/*
  audits/link-integrity-6.2-2026-08-30.js - third independent extraction for
  item 6.2 (broken internal links). Shares NO code with tools/: own file
  discovery, own href regex reading BOTH quote styles, own branches.json read,
  own host-attribution and resolution model. Coverage is proved before the
  result is read: five gates, each exiting non-zero on its own, so the
  extractor cannot pass by finding nothing.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const REPO = path.join(__dirname, "..");

function die(msg) { console.log("GATE FAIL: " + msg); process.exit(1); }

// Own branches.json read
const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));
const hosts = new Set();
const slugHost = [];
for (const b of data.branches) {
  if (b.disposed || !b.website) continue;
  const h = b.website.replace(/^https?:\/\//i, "").replace(/\/+$/, "").toLowerCase();
  hosts.add(h);
  if (b.brandSlug && b.townSlug) slugHost.push([(b.brandSlug + "-" + b.townSlug).toLowerCase(), h]);
}
slugHost.sort((a, b2) => b2[0].length - a[0].length);

// GATE 1 and 2: the estate shape this run expects
if (hosts.size !== 13) die("estate host set is " + hosts.size + ", expected 13");
if (slugHost.length !== 15) die("slug map holds " + slugHost.length + " branches, expected 15");

// Own file discovery: every .html under modules/*/pages
const pages = [];
for (const mod of fs.readdirSync(path.join(REPO, "modules"))) {
  const d = path.join(REPO, "modules", mod, "pages");
  if (!fs.existsSync(d) || !fs.statSync(d).isDirectory()) continue;
  for (const f of fs.readdirSync(d)) if (f.endsWith(".html")) pages.push(path.join(d, f));
}
// GATE 3: page count
if (pages.length !== 177) die("found " + pages.length + " generated pages, expected 177");

// Own host attribution
function hostOf(name) {
  const stem = name.toLowerCase().replace(/\.html$/, "");
  for (const [slug, h] of slugHost) if (stem.endsWith("-" + slug)) return h;
  return null;
}
const pageHost = new Map();
for (const p of pages) {
  const h = hostOf(path.basename(p));
  if (!h) die("page not attributable to a host: " + path.basename(p));
  pageHost.set(path.basename(p).toLowerCase(), h);
}

// Own href walk, both quote styles, comments blanked with own code
let hrefTotal = 0, estateTotal = 0, absN = 0, relN = 0, homeN = 0;
const defects = [];
const knownSeen = new Map();
const KNOWN_TARGETS = new Set([
  "www.smarttschemist.co.uk/weight-loss-clinic-bootle.html",
  "www.smarttschemist.co.uk/pharmacy-first-service-bootle.html",
  "www.smarttschemist.co.uk/blood-testing.html",
  "www.smarttschemist.co.uk/vaccinations.html",
  "www.smarttschemist.co.uk/medical-cannabis.html"
]);
for (const p of pages) {
  let text = fs.readFileSync(p, "utf8").replace(/<!--[\s\S]*?-->/g, s => s.replace(/[^\n]/g, " "));
  const own = pageHost.get(path.basename(p).toLowerCase());
  const re = /href\s*=\s*("([^"]*)"|'([^']*)')/gi;
  let m;
  while ((m = re.exec(text))) {
    const href = (m[2] !== undefined ? m[2] : m[3]).trim();
    if (!href || /^(mailto:|tel:|javascript:|data:|#)/i.test(href)) continue;
    hrefTotal++;
    const abs = href.match(/^(?:https?:)?\/\/([^\/"?#]+)([^"?#]*)/i);
    let host, pth, shape;
    if (abs) {
      host = abs[1].toLowerCase();
      if (!hosts.has(host)) continue;
      pth = (abs[2] || "/").split("?")[0].split("#")[0];
      shape = "abs";
    } else {
      host = own;
      pth = href.split("?")[0].split("#")[0];
      if (!pth) continue;
      shape = "rel";
    }
    estateTotal++;
    pth = pth.replace(/^\/+/, "");
    if (pth === "") { homeN++; continue; }
    if (shape === "abs") absN++; else relN++;
    const key = host + "/" + pth.toLowerCase();
    if (KNOWN_TARGETS.has(key)) { knownSeen.set(key, (knownSeen.get(key) || 0) + 1); continue; }
    if (pth.includes("/")) { defects.push(path.basename(p) + " -> " + key + " (subpath)"); continue; }
    if (!/\.html$/i.test(pth)) { defects.push(path.basename(p) + " -> " + key + " (extensionless)"); continue; }
    const owner = pageHost.get(pth.toLowerCase());
    if (owner === undefined) { defects.push(path.basename(p) + " -> " + key + " (not generated)"); continue; }
    if (owner !== host) { defects.push(path.basename(p) + " -> " + key + " (cross-host, owner " + owner + ")"); }
  }
}
// GATE 4 and 5: the link population this run expects
if (hrefTotal !== 987) die("walked " + hrefTotal + " hrefs, expected 987");
if (estateTotal !== 421) die("estate-internal links " + estateTotal + ", expected 421");

let knownRefs = 0; for (const v of knownSeen.values()) knownRefs += v;
console.log("pages=" + pages.length + " hrefs=" + hrefTotal + " estate=" + estateTotal +
  " (abs=" + absN + " rel=" + relN + " homepage=" + homeN + ")");
console.log("known targets seen=" + knownSeen.size + " references=" + knownRefs);
console.log("defects=" + defects.length);
for (const d of defects) console.log("  DEFECT " + d);
if (defects.length) process.exit(1);
console.log("CLEAN");
