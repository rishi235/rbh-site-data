#!/usr/bin/env node
/*
  check-nap.js
  Item 1.4 of the audit backlog: verify every generated branch page's
  NAP (name, address, phone) against branches.json, the single source
  of truth. Read-only: reports mismatches, changes nothing.
  Run from anywhere:  node tools/check-nap.js
  Exit code 0 = clean, 1 = mismatches found.
  Checks, per page:
    - data-branch attribute matches branchName
    - JSON-LD name, telephone, streetAddress, addressLocality,
      postalCode, addressRegion, addressCountry
    - contact card address line "street, locality, postcode"
    - every tel: link and visible phone number
    - Google Maps embed query
  Pages checked: modules/service/pages/*.html, modules/switch/pages/*.html,
  modules/branch/pages/*.html
*/
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));
const branches = data.branches;

const PAGE_DIRS = [
  path.join(ROOT, "modules", "service", "pages"),
  path.join(ROOT, "modules", "switch", "pages"),
  path.join(ROOT, "modules", "branch", "pages"),
];

const digits = (s) => String(s || "").replace(/\D/g, "");

// Pages HTML-escape text and attribute values; decode before comparing.
const unesc = (s) => s === null || s === undefined ? s : String(s)
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");

// Display name on pages is the brand label; branchName adds the town for
// multi-branch brands. Either is a correct name for NAP purposes.
const nameOk = (got, b) => got === b.branchName || got === b.brandLabel;

function findBranchForFile(file) {
  // Filenames end "-<brandSlug>-<townSlug>.html".
  const stem = file.replace(/\.html$/, "");
  let best = null;
  for (const b of branches) {
    if (!b.brandSlug || !b.townSlug) continue;
    const suffix = b.brandSlug + "-" + b.townSlug;
    if (stem.endsWith(suffix)) {
      if (!best || suffix.length > best.suffix.length) best = { b, suffix };
    }
  }
  return best ? best.b : null;
}

function extract(html) {
  const out = { telLinks: [], visiblePhones: [] };
  const db = html.match(/data-branch="([^"]*)"/);
  out.dataBranch = db ? db[1] : null;
  const ld = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)<\/script>/);
  if (ld) { try { out.ld = JSON.parse(ld[1]); } catch (e) { out.ldError = e.message; } }
  let m;
  const telRe = /href="tel:([^"]+)"/g;
  while ((m = telRe.exec(html)) !== null) out.telLinks.push(m[1]);
  const visRe = /(?:Call|Phone:<\/strong>\s*<a href="tel:[^"]*">)\s*([0-9][0-9 ]{8,13}[0-9])/g;
  while ((m = visRe.exec(html)) !== null) out.visiblePhones.push(m[1]);
  const cl = html.match(/<div class="contact-line"><p>([^<]+)<\/p><\/div>/);
  out.contactAddress = cl ? cl[1].trim() : null;
  const map = html.match(/maps\?q=([^"&]+)/);
  out.mapQuery = map ? decodeURIComponent(map[1]) : null;
  return out;
}

let problems = 0;
let pages = 0;
const seenBranches = new Set();

function bad(file, msg) {
  problems++;
  console.log("MISMATCH " + file + ": " + msg);
}

for (const dir of PAGE_DIRS) {
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith(".html")) continue;
    const html = fs.readFileSync(path.join(dir, file), "utf8");
    const rel = path.relative(ROOT, path.join(dir, file));
    const b = findBranchForFile(file);
    if (!b) { bad(rel, "no branches.json entry matches the filename"); continue; }
    pages++;
    seenBranches.add(b.id);
    if (b.disposed) bad(rel, "page exists for disposed branch " + b.id);
    const x = extract(html);
    const expAddr = b.streetAddress + ", " + b.addressLocality + ", " + b.postalCode;
    if (x.dataBranch !== null && !nameOk(unesc(x.dataBranch), b))
      bad(rel, 'data-branch "' + x.dataBranch + '" vs branchName "' + b.branchName + '"');
    if (x.contactAddress !== null && unesc(x.contactAddress) !== expAddr)
      bad(rel, 'contact address "' + x.contactAddress + '" vs "' + expAddr + '"');
    if (x.mapQuery !== null && x.mapQuery.replace(/\s+/g, " ") !== expAddr.replace(/\s+/g, " "))
      bad(rel, 'map query "' + x.mapQuery + '" vs "' + expAddr + '"');
    for (const t of x.telLinks)
      if (digits(t) !== digits(b.phone))
        bad(rel, 'tel link "' + t + '" vs phone "' + b.phone + '"');
    for (const v of x.visiblePhones)
      if (digits(v) !== digits(b.phone))
        bad(rel, 'visible phone "' + v + '" vs "' + b.phone + '"');

    if (x.ldError) bad(rel, "JSON-LD does not parse: " + x.ldError);
    if (x.ld) {
      const a = x.ld.address || {};
      if (!nameOk(x.ld.name, b))
        bad(rel, 'JSON-LD name "' + x.ld.name + '" vs "' + b.branchName + '"');
      const checks = [
        ["JSON-LD streetAddress", a.streetAddress, b.streetAddress],
        ["JSON-LD addressLocality", a.addressLocality, b.addressLocality],
        ["JSON-LD postalCode", a.postalCode, b.postalCode],
        ["JSON-LD addressRegion", a.addressRegion, b.addressRegion],
        ["JSON-LD addressCountry", a.addressCountry, b.addressCountry],
      ];
      for (const [what, got, want] of checks)
        if (got !== want) bad(rel, what + ' "' + got + '" vs "' + want + '"');
      if (digits(x.ld.telephone) !== digits(b.phone))
        bad(rel, 'JSON-LD telephone "' + x.ld.telephone + '" vs "' + b.phone + '"');
    } else if (!x.ldError) {
      bad(rel, "no JSON-LD block found");
    }
  }
}

const missing = branches.filter((b) =>
  !b.disposed && b.id !== "rbh_head_office_aintree" && !seenBranches.has(b.id));
for (const b of missing)
  console.log("NOTE no generated pages found for " + b.id + " (" + b.branchName + ")");

console.log("Checked " + pages + " pages against " + branches.length +
  " branches.json entries: " + problems + " mismatch(es).");
process.exit(problems ? 1 : 0);
