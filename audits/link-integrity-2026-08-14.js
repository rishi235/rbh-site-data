/*
  link-integrity-2026-08-14.js
  Item 6.2 quality pass, second machine pass. Written from scratch for this run.
  Shares no code with tools/: own globbing, own href regex, own branches.json
  read, own resolution model. If it agrees with tools/check-service-links.js it
  agrees by arriving there separately.

  THE MODEL THIS PASS APPLIES, which is the thing the earlier pass did not.
  Every generated page is published to exactly one Weebly site, at the site
  root. So an estate-internal link is live-correct only if the target page is
  generated FOR THE HOST THE LINK LANDS ON, at the root of it. A basename that
  exists somewhere in the estate is not enough: fishlockpharmacy.co.uk does not
  serve riddingspharmacy.co.uk's pages, so a relative href to another branch's
  page is a live 404 even though the file exists in this repo.

  Rules, all four fail the run:
    R1 CROSS-HOST   an estate-internal link whose target page is not generated
                    for the host the link resolves on.
    R2 NOT IN REPO  an estate-internal .html target no generator owns at all
                    (unless listed in LIVE_ONLY below, with a reason).
    R3 SUBPATH      an estate-internal link with a directory in its path. Weebly
                    publishes at the root, so /a/b.html cannot resolve.
    R4 NO EXTENSION an estate path that is not a .html page, so no generated
                    file can be matched against it.

  COVERAGE GATES, checked before any verdict is read, because an extractor that
  finds nothing passes every rule: pages found by globbing not from a list, page
  count, host attribution for every page, href count, and estate-link count.
  Any gate failing exits non-zero.

  Run:  node audits/link-integrity-2026-08-14.js
*/
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const DIRS = ["modules/switch/pages", "modules/service/pages", "modules/branch/pages"];

// Estate pages that are live-only, i.e. no generator owns them. Each needs a
// reason. Same convention as KNOWN in tools/check-service-links.js, kept
// separate on purpose so this pass does not inherit that list's judgements.
const LIVE_ONLY = {
  "www.smarttschemist.co.uk/weight-loss-clinic-bootle.html": "Q16, old live-only weight loss page",
  "www.smarttschemist.co.uk/pharmacy-first-service-bootle.html": "Q8/Q16, old live-only Pharmacy First page",
  "www.smarttschemist.co.uk/blood-testing.html": "Q16, live-only service page",
  "www.smarttschemist.co.uk/vaccinations.html": "Q16, live-only service page",
  "www.smarttschemist.co.uk/medical-cannabis.html": "Q16, live-only service page"
};

function fail(msg) { console.log("GATE FAIL: " + msg); process.exit(2); }

// ---- branches.json, read here rather than taken from any tool ----
const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));
const hostOf = new Map();   // "<brandSlug>-<townSlug>" -> host
const estateHosts = new Set();
data.branches.forEach(function (b) {
  if (b.disposed || !b.website) return;
  const host = b.website.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
  estateHosts.add(host);
  if (b.brandSlug && b.townSlug) hostOf.set((b.brandSlug + "-" + b.townSlug).toLowerCase(), host);
});
if (estateHosts.size < 10) fail("estate host set looks too small: " + estateHosts.size);
if (hostOf.size < 10) fail("branch slug map looks too small: " + hostOf.size);

// ---- pages, found by globbing the directories ----
const pages = [];
DIRS.forEach(function (d) {
  const dir = path.join(REPO, d);
  if (!fs.existsSync(dir)) fail("page directory missing: " + d);
  fs.readdirSync(dir).filter(function (f) { return /\.html$/i.test(f); })
    .forEach(function (f) { pages.push({ rel: d + "/" + f, file: path.join(dir, f), name: f.toLowerCase() }); });
});
if (pages.length < 150) fail("only " + pages.length + " pages found, expected the full estate");

// ---- attribute every page to a host by its branch suffix ----
// Longest slug first so scorah-hazel-grove is not eaten by a shorter match.
const slugs = Array.from(hostOf.keys()).sort(function (a, b) { return b.length - a.length; });
const pageHost = new Map();          // basename -> host that publishes it
let unattributed = [];
pages.forEach(function (p) {
  const base = p.name.replace(/\.html$/, "");
  const slug = slugs.find(function (s) { return base.endsWith("-" + s); });
  if (!slug) { unattributed.push(p.rel); return; }
  p.host = hostOf.get(slug);
  pageHost.set(p.name, p.host);
});
if (unattributed.length) fail("page(s) not attributable to a branch: " + unattributed.join(", "));
if (pageHost.size !== pages.length) fail("host attribution incomplete: " + pageHost.size + " of " + pages.length);

// ---- extract and classify every href ----
const failures = [];
const liveOnlyHits = {};
let hrefCount = 0, estateCount = 0, relCount = 0, absCount = 0, homeCount = 0;

pages.forEach(function (p) {
  // Comments blanked, line count preserved, so build notes are not read as links.
  const html = fs.readFileSync(p.file, "utf8").replace(/<!--[\s\S]*?-->/g, function (b) {
    return b.replace(/[^\n]/g, " ");
  });
  // Both quote styles. tools/check-service-links.js reads double quotes only.
  const re = /href\s*=\s*("([^"]*)"|'([^']*)')/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = (m[2] !== undefined ? m[2] : m[3]).trim();
    if (!href) continue;
    if (/^(mailto:|tel:|javascript:|data:|#)/i.test(href)) continue;
    hrefCount++;

    const abs = href.match(/^(?:https?:)?\/\/([^\/?#]+)([^?#]*)/i);
    let host, pth;
    if (abs) {
      host = abs[1].toLowerCase();
      if (!estateHosts.has(host)) continue;      // external, out of scope
      absCount++;
      pth = abs[2] || "/";
    } else {
      host = p.host;                              // relative, resolves on its own site
      pth = href.split("?")[0].split("#")[0];
      if (!pth) continue;                         // same-page anchor only
      relCount++;
    }
    estateCount++;

    pth = pth.replace(/^\/+/, "");
    if (pth === "") { homeCount++; continue; }    // homepage always exists

    if (pth.indexOf("/") !== -1) {
      failures.push({ rule: "R3 SUBPATH", file: p.rel, text: host + "/" + pth + " has a directory; Weebly publishes at the root" });
      continue;
    }
    if (!/\.html$/i.test(pth)) {
      failures.push({ rule: "R4 NO EXTENSION", file: p.rel, text: host + "/" + pth + " is not a .html page, so no generated file can be matched against it" });
      continue;
    }

    const key = host + "/" + pth.toLowerCase();
    const owner = pageHost.get(pth.toLowerCase());
    if (owner === undefined) {
      if (LIVE_ONLY[key]) { liveOnlyHits[key] = (liveOnlyHits[key] || 0) + 1; continue; }
      failures.push({ rule: "R2 NOT IN REPO", file: p.rel, text: "links to " + key + ", which no generator owns" });
      continue;
    }
    if (owner !== host) {
      failures.push({ rule: "R1 CROSS-HOST", file: p.rel, text: "links to " + key + " but that page is generated for " + owner + ", so it 404s on " + host });
    }
  }
});

// ---- gates read before the verdict ----
if (hrefCount < 500) fail("only " + hrefCount + " hrefs read across " + pages.length + " pages");
if (estateCount < 100) fail("only " + estateCount + " estate-internal links seen");
const staleLiveOnly = Object.keys(LIVE_ONLY).filter(function (k) { return !liveOnlyHits[k]; });

console.log("link-integrity (independent, item 6.2)");
console.log("  " + pages.length + " generated page(s) across " + DIRS.length + " directories, "
  + estateHosts.size + " estate host(s), " + hostOf.size + " branch slug(s)");
console.log("  " + hrefCount + " href(s) read, " + estateCount + " estate-internal ("
  + absCount + " absolute, " + relCount + " relative, " + homeCount + " homepage)");
Object.keys(liveOnlyHits).forEach(function (k) {
  console.log("  LIVE-ONLY " + k + " (" + liveOnlyHits[k] + " reference(s)): " + LIVE_ONLY[k]);
});
if (staleLiveOnly.length) {
  staleLiveOnly.forEach(function (k) { console.log("  FAIL stale LIVE_ONLY key, no longer referenced: " + k); });
}
if (failures.length) {
  console.log("");
  console.log("FAILURES (" + failures.length + "):");
  failures.forEach(function (f) { console.log("  FAIL  [" + f.rule + "] " + f.file + ": " + f.text); });
}
if (failures.length || staleLiveOnly.length) process.exit(1);
console.log("");
console.log("link-integrity: clean, " + Object.keys(liveOnlyHits).length + " live-only target(s) on the record.");
