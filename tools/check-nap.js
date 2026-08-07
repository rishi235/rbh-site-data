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

  Also checked, from 2026-08-07: the Weebly paste blocks in
  modules/service/weebly-paste. Those are not generated pages. They are prose
  fragments pasted straight onto live pages this repo does not build, so a
  wrong phone number or address in one lands on the public site with nothing
  in between. They carry no data-branch, no JSON-LD and no contact-line, so
  the structured checks above cannot read them at all; before this they were
  checked for postcodes only, by check-postcodes.js, and for nothing else.
  They are checked below on the facts they do carry:
    - the PASTE TARGET host matches the branch the filename claims
    - the block names its own branch and no other branch
    - every phone number matches the branch phone
    - every postcode matches the branch postcode, and carries the street
      address in front of it, so an address cannot lose its street
    - every internal link resolves to a page this repo generates (warning
      only: a live-only target is possible but worth stating)
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

// Paste blocks live here. Kept separate from PAGE_DIRS because nothing in
// them is generated and none of the structured page checks apply.
const PASTE_DIRS = [
  path.join(ROOT, "modules", "service", "weebly-paste"),
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
let pasteBlocks = 0;
const seenBranches = new Set();
const generatedFiles = new Set();
const warnings = [];

function bad(file, msg) {
  problems++;
  console.log("MISMATCH " + file + ": " + msg);
}

function warn(file, msg) {
  warnings.push("WARN " + file + ": " + msg);
}

for (const dir of PAGE_DIRS) {
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith(".html")) continue;
    const html = fs.readFileSync(path.join(dir, file), "utf8");
    const rel = path.relative(ROOT, path.join(dir, file));
    generatedFiles.add(file);
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

// ---------------------------------------------------------------------
// Weebly paste blocks
// ---------------------------------------------------------------------
// A phone number written for a human: 0151 226 2051, 01704 577376.
const PHONE_RE = /\b0\d[\d ]{7,13}\d\b/g;
// A UK postcode as it appears in copy, always upper case.
const PC_RE = /\b[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}\b/g;

// hostMap keys carry the www; PASTE TARGET comments usually do not.
const hostOwners = {};
for (const host of Object.keys(data.hostMap || {}))
  hostOwners[host.replace(/^www\./i, "").toLowerCase()] = data.hostMap[host];

// Paste block names read "<brandSlug>-old-..." rather than the page form
// "...-<brandSlug>-<townSlug>", so match on the brandSlug prefix. Longest
// slug wins, so a short slug cannot claim another brand's file.
function pasteOwner(file) {
  const stem = file.replace(/\.html$/, "");
  let best = null;
  for (const b of branches) {
    if (!b.brandSlug) continue;
    if (stem.startsWith(b.brandSlug + "-") &&
      (!best || b.brandSlug.length > best.key.length)) best = { b, key: b.brandSlug };
  }
  return best ? best.b : null;
}

for (const dir of PASTE_DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith(".html")) continue;
    const html = fs.readFileSync(path.join(dir, file), "utf8");
    const rel = path.relative(ROOT, path.join(dir, file));
    const b = pasteOwner(file);
    if (!b) { bad(rel, "no branches.json entry matches the paste block filename"); continue; }
    pasteBlocks++;
    if (b.disposed) bad(rel, "paste block exists for disposed branch " + b.id);
    const text = unesc(html);

    // The PASTE TARGET comment names the live page the block replaces. If it
    // disagrees with the filename, the block is aimed at the wrong site.
    const target = html.match(/PASTE TARGET:\s*(\S+)/);
    if (!target) {
      bad(rel, "no PASTE TARGET comment, so the live page it replaces is unstated");
    } else {
      const host = target[1].replace(/^https?:\/\//i, "").split("/")[0]
        .replace(/^www\./i, "").toLowerCase();
      const ids = hostOwners[host];
      if (!ids)
        bad(rel, 'PASTE TARGET host "' + host + '" is not in the branches.json hostMap');
      else if (ids.indexOf(b.id) === -1)
        bad(rel, 'PASTE TARGET host "' + host + '" belongs to ' + ids.join(", ") +
          ' but the filename claims ' + b.id);
    }

    // The block must name its own branch, and must not name another. This is
    // the McCanns Sandringham failure shape: one branch's copy on another.
    if (!text.includes(b.brandLabel))
      bad(rel, 'does not name its own branch "' + b.brandLabel + '"');
    for (const other of branches) {
      if (other.brandLabel === b.brandLabel) continue;
      if (text.includes(other.brandLabel))
        bad(rel, 'names another branch "' + other.brandLabel + '" (owner is ' +
          b.brandLabel + ')');
    }

    let m;
    let sawPhone = false;
    PHONE_RE.lastIndex = 0;
    while ((m = PHONE_RE.exec(text)) !== null) {
      if (digits(m[0]).length < 10) continue;
      sawPhone = true;
      if (digits(m[0]) !== digits(b.phone))
        bad(rel, 'phone "' + m[0].trim() + '" vs "' + b.phone + '" for ' + b.id);
    }

    let sawPostcode = false;
    PC_RE.lastIndex = 0;
    while ((m = PC_RE.exec(text)) !== null) {
      sawPostcode = true;
      if (m[0].replace(/\s+/g, " ") !== b.postalCode.replace(/\s+/g, " ")) {
        bad(rel, 'postcode "' + m[0] + '" vs "' + b.postalCode + '" for ' + b.id);
        continue;
      }
      // A postcode ends an address, so the street must be in front of it.
      // Without this an address can lose its street and still read as valid.
      const before = text.slice(Math.max(0, m.index - 90), m.index);
      if (!before.replace(/\s+/g, " ").includes(b.streetAddress))
        bad(rel, 'postcode "' + m[0] + '" is not preceded by the street address "' +
          b.streetAddress + '"');
    }

    if (!sawPhone && !sawPostcode)
      warn(rel, "carries neither a phone number nor a postcode, so nothing here " +
        "was checked against branches.json");

    // Link targets. A block that points at a page nobody builds is a live
    // button of unknown state, which is what Q8 is about. Reported, not
    // failed: a live-only target can be deliberate.
    const hrefRe = /href="([^"]+)"/g;
    while ((m = hrefRe.exec(html)) !== null) {
      const url = m[1];
      if (/^(tel:|mailto:|#|https?:|\/\/)/i.test(url)) continue;
      const leaf = url.split("/").pop().split("?")[0].split("#")[0];
      if (!leaf) continue;
      if (!generatedFiles.has(leaf))
        warn(rel, 'link target "' + leaf + '" is not a page this repo generates, ' +
          "so it is a live-only page no checker here can keep correct");
    }
  }
}

const missing = branches.filter((b) =>
  !b.disposed && b.id !== "rbh_head_office_aintree" && !seenBranches.has(b.id));
for (const b of missing)
  console.log("NOTE no generated pages found for " + b.id + " (" + b.branchName + ")");

for (const w of warnings) console.log(w);

console.log("Checked " + pages + " pages and " + pasteBlocks +
  " paste block(s) against " + branches.length + " branches.json entries: " +
  problems + " mismatch(es), " + warnings.length + " warning(s).");
process.exit(problems ? 1 : 0);
