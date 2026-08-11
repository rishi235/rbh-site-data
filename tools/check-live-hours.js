/*
  check-live-hours.js

  WHY THIS EXISTS
  Item 6.3: Smartts' live homepage (sidebar and footer) said Mon-Fri 9am-6pm
  while branches.json carries the NHS-sourced split day 09:00-13:00 and
  14:00-18:00 (confirmed 2026-06-24). Riddings was checked as a control and
  was correct. Nothing had verified the other branches' LIVE Weebly pages
  against branches.json - tools/check-opening-hours.js only checks the
  generated landing pages in this repo, not what Weebly actually serves.

  WHAT IT DOES
  For every trading branch that carries opening hours, fetch the live
  homepage plus any sitemap pages that look like contact / opening-hours /
  find-us pages, strip the HTML to text, and record every snippet of text
  around a weekday mention. The snippets and the expected hours composed
  from branches.json go into the audit JSON. The tool does NOT decide
  match or mismatch: free-text hours on Weebly pages vary too much for a
  regex verdict to be trusted, and a wrong "match" here sends a patient to
  a locked door. A human (or the worker run) reads the snippets against
  the expected rows and raises a question per mismatched branch.

  SCOPE AND CONDUCT
  - Read-only: GET requests only, same conduct as sweep-broken-links.js.
  - Shared-domain sites (Scorah x2, McCanns x2, Fishlocks x2) are fetched
    once per host; every branch on that host is compared against the same
    page set, since the pages carry both branches' hours.

  OUTPUT
  - audits/live-hours-check-<date>.json - snippets + expected, per branch.
  - Console summary, one line per branch: pages fetched, snippet count.
  Exit code 0 always: survey tool, not a gate.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));

var UA = "RBH-internal-hours-check/1.0 (rbh-site-data tools; read-only audit)";
var TIMEOUT_MS = 20000;
var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
var DAY_RE = /\b(mon(day)?|tue(s|sday)?|wed(nesday)?|thu(r|rs|rsday)?|fri(day)?|sat(urday)?|sun(day)?)\b/i;
var PAGE_HINT_RE = /(contact|opening|hours|find|about|visit)/i;

function fetchWithTimeout(url) {
  var ctrl = new AbortController();
  var t = setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);
  return fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: { "User-Agent": UA },
    signal: ctrl.signal
  }).finally(function () { clearTimeout(t); });
}

// "08:45" -> "8.45am", same convention as check-opening-hours.js.
function human(t) {
  var bits = String(t).split(":");
  var h = parseInt(bits[0], 10);
  var m = bits[1];
  var suffix = h >= 12 ? "pm" : "am";
  var h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return h12 + (m === "00" ? "" : "." + m) + suffix;
}

function expectedRows(branch) {
  var oh = branch.openingHours || {};
  var rows = {};
  DAYS.forEach(function (day) {
    if ((oh.closedDays || []).indexOf(day) !== -1) { rows[day] = "Closed"; return; }
    var sessions = (oh.specification || []).filter(function (s) {
      return (s.dayOfWeek || []).indexOf(day) !== -1;
    });
    if (!sessions.length) { rows[day] = "Closed"; return; }
    sessions.sort(function (a, b) { return a.opens < b.opens ? -1 : 1; });
    rows[day] = sessions.map(function (s) { return human(s.opens) + " to " + human(s.closes); }).join(", ");
  });
  return rows;
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;/g, "'").replace(/&ndash;|&mdash;/g, "-")
    .replace(/[ \t]+/g, " ");
}

// Every line (plus its neighbours) that mentions a weekday. Neighbours are
// kept because Weebly often puts "Monday - Friday" and the times on
// separate lines.
function daySnippets(text) {
  var lines = text.split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean);
  var keep = {};
  lines.forEach(function (l, i) {
    if (DAY_RE.test(l)) {
      for (var j = Math.max(0, i - 1); j <= Math.min(lines.length - 1, i + 2); j++) keep[j] = 1;
    }
  });
  var out = [];
  var run = [];
  lines.forEach(function (l, i) {
    if (keep[i]) { run.push(l); }
    else if (run.length) { out.push(run.join(" | ")); run = []; }
  });
  if (run.length) out.push(run.join(" | "));
  return out;
}

function extractLocs(xml) {
  var locs = [];
  var re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  var m;
  while ((m = re.exec(xml)) !== null) locs.push(m[1]);
  return locs;
}

var branches = data.branches.filter(function (b) {
  return !b.disposed && b.openingHours && (b.openingHours.specification || []).length;
});

// One fetch pass per host, shared across the branches on it.
var hostPages = {}; // host -> [{url, snippets} | {url, error}]

function collectHost(website) {
  var origin = website.replace(/\/+$/, "");
  var host = origin.replace(/^https?:\/\//, "");
  if (hostPages[host]) return Promise.resolve();
  hostPages[host] = [];
  var urls = [origin + "/"];
  return fetchWithTimeout(origin + "/sitemap.xml").then(function (r) {
    return r.ok ? r.text() : "";
  }).catch(function () { return ""; }).then(function (xml) {
    extractLocs(xml).forEach(function (u) {
      if (PAGE_HINT_RE.test(u) && urls.indexOf(u) === -1 && urls.length < 8) urls.push(u);
    });
    var chain = Promise.resolve();
    urls.forEach(function (u) {
      chain = chain.then(function () {
        return fetchWithTimeout(u).then(function (r) {
          if (!r.ok) { hostPages[host].push({ url: u, error: "HTTP " + r.status }); return; }
          return r.text().then(function (html) {
            hostPages[host].push({ url: u, snippets: daySnippets(htmlToText(html)) });
          });
        }).catch(function (e) {
          hostPages[host].push({ url: u, error: String(e && e.message || e) });
        });
      });
    });
    return chain;
  });
}

var chain = Promise.resolve();
branches.forEach(function (b) { chain = chain.then(function () { return collectHost(b.website); }); });

chain.then(function () {
  var report = {
    date: new Date().toISOString().slice(0, 10),
    note: "Snippets are raw text around weekday mentions on live pages. Expected rows composed from branches.json. Verdicts are made by the reader, not this tool.",
    branches: branches.map(function (b) {
      var host = b.website.replace(/^https?:\/\//, "").replace(/\/+$/, "");
      return {
        id: b.id,
        branchName: b.branchName,
        website: b.website,
        expected: expectedRows(b),
        pages: hostPages[host] || []
      };
    })
  };
  var outDir = path.join(ROOT, "audits");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  var outFile = path.join(outDir, "live-hours-check-" + report.date + ".json");
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log("check-live-hours: " + report.branches.length + " branch(es), report written to " + path.relative(ROOT, outFile));
  report.branches.forEach(function (rb) {
    var snips = rb.pages.reduce(function (n, p) { return n + (p.snippets ? p.snippets.length : 0); }, 0);
    var errs = rb.pages.filter(function (p) { return p.error; }).length;
    console.log("  " + rb.id + ": " + rb.pages.length + " page(s), " + snips + " snippet group(s)" + (errs ? ", " + errs + " fetch error(s)" : ""));
  });
});
