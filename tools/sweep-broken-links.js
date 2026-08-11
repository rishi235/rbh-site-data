/*
  sweep-broken-links.js

  WHY THIS EXISTS
  Item 6.2 from the 2026-08-11 Ahrefs sweep: "Page has links to broken page"
  is the most common top issue across the branch sites in Site Audit. The
  Site Audit API is closed to the current plan, so this is the repo-side
  sweep the item allows for: crawl each branch site's sitemap pages live,
  collect every estate-internal link, status-check each unique target, and
  report the broken ones with the pages that carry them.

  SCOPE
  - Every www host in branches.json hostMap EXCEPT www.clearchemist.co.uk
    (27,000+ URLs, cannot be swept in one worker run) and the bare
    rbhealth.co.uk (redirects to www).
  - "Internal" means the target host is any estate host in hostMap, with or
    without www, http or https. Cross-site links between branch sites count,
    since dead cross-links are generator-owned territory.
  - Read-only: GET and HEAD requests only.

  OUTPUT
  - audits/broken-links-sweep-<date>.json - full machine-readable result.
  - Console summary, one line per broken target.
  Exit code is 0 even when broken links are found: this is a survey tool,
  not a gate. The worklist item decides what gets fixed.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));

var SKIP_HOSTS = { "www.clearchemist.co.uk": 1, "rbhealth.co.uk": 1 };
var UA = "RBH-internal-link-sweep/1.0 (rbh-site-data tools; read-only audit)";
var TIMEOUT_MS = 20000;
var CONCURRENCY = 8;

var estateHosts = {};
Object.keys(data.hostMap || {}).forEach(function (h) {
  estateHosts[h] = 1;
  estateHosts[h.replace(/^www\./, "")] = 1;
});

var crawlHosts = Object.keys(data.hostMap || {}).filter(function (h) {
  return /^www\./.test(h) && !SKIP_HOSTS[h];
});

function fetchWithTimeout(url, method) {
  var ctrl = new AbortController();
  var t = setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);
  return fetch(url, {
    method: method || "GET",
    redirect: "follow",
    headers: { "User-Agent": UA },
    signal: ctrl.signal
  }).finally(function () { clearTimeout(t); });
}

function pool(items, limit, worker) {
  var i = 0;
  var results = [];
  function next() {
    if (i >= items.length) return Promise.resolve();
    var idx = i++;
    return Promise.resolve(worker(items[idx], idx)).then(function (r) {
      results[idx] = r;
      return next();
    });
  }
  var lanes = [];
  for (var l = 0; l < Math.min(limit, items.length); l++) lanes.push(next());
  return Promise.all(lanes).then(function () { return results; });
}

function extractLocs(xml) {
  var locs = [];
  var re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  var m;
  while ((m = re.exec(xml)) !== null) locs.push(m[1]);
  return locs;
}

function extractHrefs(html) {
  var hrefs = [];
  var re = /href\s*=\s*("([^"]*)"|'([^']*)')/gi;
  var m;
  while ((m = re.exec(html)) !== null) hrefs.push(m[2] !== undefined ? m[2] : m[3]);
  return hrefs;
}

function normalise(href, baseUrl) {
  if (!href) return null;
  var h = href.trim();
  if (/^(mailto:|tel:|javascript:|data:|#)/i.test(h)) return null;
  var u;
  try { u = new URL(h, baseUrl); } catch (e) { return null; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  u.hash = "";
  return u.href;
}

function isEstate(urlStr) {
  try { return !!estateHosts[new URL(urlStr).hostname]; } catch (e) { return false; }
}

var report = {
  generated: new Date().toISOString(),
  scope: crawlHosts,
  skipped: Object.keys(SKIP_HOSTS),
  sites: {},
  targets: {},
  broken: []
};

function crawlSite(host) {
  var site = { sitemapUrls: 0, pagesFetched: 0, pageErrors: [] };
  report.sites[host] = site;
  var smUrl = "https://" + host + "/sitemap.xml";
  return fetchWithTimeout(smUrl).then(function (res) {
    if (!res.ok) { site.sitemapError = "HTTP " + res.status; return []; }
    return res.text().then(extractLocs);
  }, function (e) { site.sitemapError = String(e); return []; }
  ).then(function (locs) {
    site.sitemapUrls = locs.length;
    return pool(locs, CONCURRENCY, function (pageUrl) {
      return fetchWithTimeout(pageUrl).then(function (res) {
        if (!res.ok) {
          site.pageErrors.push(pageUrl + " HTTP " + res.status);
          return null;
        }
        return res.text().then(function (html) {
          site.pagesFetched++;
          extractHrefs(html).forEach(function (href) {
            var abs = normalise(href, pageUrl);
            if (!abs || !isEstate(abs)) return;
            if (!report.targets[abs]) report.targets[abs] = { sources: [] };
            var t = report.targets[abs];
            if (t.sources.length < 25 && t.sources.indexOf(pageUrl) === -1) {
              t.sources.push(pageUrl);
            }
          });
        });
      }, function (e) { site.pageErrors.push(pageUrl + " " + String(e)); });
    });
  });
}

function checkTarget(urlStr) {
  var t = report.targets[urlStr];
  return fetchWithTimeout(urlStr, "HEAD").then(function (res) {
    if (res.status === 405 || res.status === 501) throw new Error("retry-get");
    return res;
  }).catch(function () {
    return fetchWithTimeout(urlStr, "GET");
  }).then(function (res) {
    t.status = res.status;
    t.finalUrl = res.url;
  }, function (e) {
    t.status = 0;
    t.error = String(e);
  });
}

pool(crawlHosts, 3, crawlSite).then(function () {
  var targets = Object.keys(report.targets);
  console.log("Crawled " + crawlHosts.length + " sites, " +
    targets.length + " unique estate-internal targets to check.");
  return pool(targets, CONCURRENCY, checkTarget);
}).then(function () {
  Object.keys(report.targets).sort().forEach(function (u) {
    var t = report.targets[u];
    if (t.status === 0 || t.status >= 400) {
      report.broken.push({ target: u, status: t.status,
        error: t.error || null, sources: t.sources });
    }
  });
  var outDir = path.join(ROOT, "audits");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  var stamp = report.generated.slice(0, 10);
  var outFile = path.join(outDir, "broken-links-sweep-" + stamp + ".json");
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log("");
  console.log("BROKEN (" + report.broken.length + "):");
  report.broken.forEach(function (b) {
    console.log("  " + (b.status || "ERR") + "  " + b.target +
      "  <- " + b.sources.slice(0, 3).join(", ") +
      (b.sources.length > 3 ? " (+" + (b.sources.length - 3) + " more)" : ""));
  });
  console.log("");
  console.log("Report written to " + outFile);
}).catch(function (e) {
  console.error("Sweep failed: " + e.stack);
  process.exit(2);
});
