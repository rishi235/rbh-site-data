/*
  verify-3.12-2026-08-30.js - independent machine pass on item 3.12
  (Tiffenbergs Chemist, Aintree, single branch, 12 pages), the first
  full-leg pass since run 196 on 2026-08-14.

  Imports NOTHING from tools/. Own regexes, own service-word table, own
  sheet-parsing and cross-town logic. Reads branches.json and the two
  module JS files as data only.

  Legs follow the single-branch template proved on 3.5/3.7/3.8/3.9:
   1. counts (one SEO title line, one description line, one h1)
   2. paste-sheet agreement plus one-label-per-block
   3. own town in title, description and h1
   4. service words in title, description and h1
   5. cross-town absence (Clear Chemist also carries seoTown Aintree;
      the shared value is excluded by construction, and the branch's own
      serviceAreaList towns - Aintree, Fazakerley, Liverpool - are excused)
   6. phone/postcode isolation both ways (own present, every other live
      branch's absent; Clear Chemist sits in the same L9 district, so the
      postcode leg is the one that separates the two Aintree branches)
   7. title and description lengths
   8. JSON-LD field by field against branches.json, plus a tel: link
   9. foreign widget ids absent
  10. foreign brand labels absent
  11. banner points at the branch's own switch page
  12. root attributes (#rbhsv-root data-branch and data-service)
  13. fragment resolution (every href="#x" resolves in-page)
  14. no hard-coded 24-hex widget id anywhere
  15. WhatsApp agreement with DEFAULT_WHATSAPP in both modules
*/
"use strict";
const fs = require("fs");
const path = require("path");

const REPO = "C:/Dev/rbh-site-data";
const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));

const sm = data.branches.find(b => b.id === "tiffenbergs_longmoor");
if (!sm) { console.log("FATAL: tiffenbergs_longmoor not in branches.json"); process.exit(1); }
const others = data.branches.filter(b => b !== sm && !b.disposed);
const liveTowns = data.branches
  .filter(b => !b.disposed && b.seoTown && b.seoTown.trim())
  .map(b => b.seoTown.trim());

const PAGES = [];
["modules/service/pages", "modules/switch/pages"].forEach(d => {
  fs.readdirSync(path.join(REPO, d)).forEach(f => {
    if (f.endsWith(".html") && /tiffenbergs/.test(f)) PAGES.push(d + "/" + f);
  });
});

const SHEET_FILES = [
  "modules/branch/pages/SEO.md",
  "modules/service/pages/SEO.md",
  "modules/service/pages/CONTRACEPTION-SEO.md",
  "modules/service/pages/TRAVEL-CLINIC-SEO.md",
  "modules/service/pages/WEIGHT-LOSS-SEO.md",
  "modules/switch/pages/SEO.md"
];
const sheetByPermalink = {};
SHEET_FILES.forEach(sf => {
  const p = path.join(REPO, sf);
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf8");
  const blocks = text.split(/^## /m).slice(1);
  blocks.forEach(bl => {
    const perms = bl.match(/\*\*Page Permalink:\*\*\s*(\S+)/g) || [];
    const titles = bl.match(/\*\*Page Title:\*\*\s*(.+)/g) || [];
    const descs = bl.match(/\*\*Page Description:\*\*\s*(.+)/g) || [];
    if (!perms.length) return;
    const key = /\*\*Page Permalink:\*\*\s*(\S+)/.exec(bl)[1].trim().replace(/\/$/, "");
    const ti = /\*\*Page Title:\*\*\s*(.+)/.exec(bl);
    const de = /\*\*Page Description:\*\*\s*(.+)/.exec(bl);
    (sheetByPermalink[key] = sheetByPermalink[key] || []).push({
      title: ti ? ti[1].trim() : "",
      desc: de ? de[1].trim() : "",
      file: sf,
      counts: { perm: perms.length, title: titles.length, desc: descs.length }
    });
  });
});

function serviceWordsFor(file) {
  const base = path.basename(file, ".html");
  if (/^pharmacy-first-/.test(base)) return ["pharmacy first"];
  const m = /^([a-z-]+)-treatment-tiffenbergs/.exec(base);
  if (m) return [m[1].replace(/-/g, " "), "treatment"];
  if (/^contraception-/.test(base)) return ["contraception", "contraceptive"];
  if (/^weight-loss-clinic-/.test(base)) return ["weight loss"];
  if (/^travel-clinic-/.test(base)) return ["travel"];
  if (/^switch-prescriptions-/.test(base)) return ["prescription"];
  return null;
}
function hasAnyWord(text, words) {
  const t = text.toLowerCase();
  return words.some(w => t.indexOf(w.toLowerCase()) !== -1);
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function townRe(t) { return new RegExp("(^|[^A-Za-z])" + escapeRe(t) + "([^A-Za-z]|$)", "i"); }
const digits = s => (s || "").replace(/\D/g, "");

let fails = [], pagesChecked = 0, checksRun = 0;
function check(cond, msg) { checksRun++; if (!cond) fails.push(msg); }

// leg 15 ground truth, read as text
const waDefaults = [];
["modules/service/service.js", "modules/switch/switch.js"].forEach(f => {
  const p = path.join(REPO, f);
  if (!fs.existsSync(p)) { fails.push(f + ": missing, cannot read DEFAULT_WHATSAPP"); return; }
  const m = /DEFAULT_WHATSAPP\s*=\s*["'](\d+)["']/.exec(fs.readFileSync(p, "utf8"));
  if (m) waDefaults.push({ file: f, num: m[1] });
  else fails.push(f + ": no DEFAULT_WHATSAPP found");
});
check(waDefaults.length === 2 && waDefaults[0].num === waDefaults[1].num,
  "DEFAULT_WHATSAPP disagreement or missing: " + JSON.stringify(waDefaults));
const WA = waDefaults.length ? waDefaults[0].num : "";
const pageWa = [];

PAGES.forEach(relFile => {
  const file = path.join(REPO, relFile);
  const html = fs.readFileSync(file, "utf8");
  pagesChecked++;

  // 1. COUNTS
  const titleLines = html.match(/^.*Weebly page SEO title:.*$/gm) || [];
  const descLines = html.match(/^.*Weebly page SEO description:.*$/gm) || [];
  const h1Opens = html.match(/<h1[^>]*>/gi) || [];
  check(titleLines.length === 1, relFile + ": " + titleLines.length + " SEO title lines, expected 1");
  check(descLines.length === 1, relFile + ": " + descLines.length + " SEO description lines, expected 1");
  check(h1Opens.length === 1, relFile + ": " + h1Opens.length + " h1 elements, expected 1");

  const title = titleLines.length ? titleLines[0].replace(/^.*Weebly page SEO title:\s*/, "").trim() : "";
  const desc = descLines.length ? descLines[0].replace(/^.*Weebly page SEO description:\s*/, "").trim() : "";
  const h1s = [];
  const h1Re = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  let hm;
  while ((hm = h1Re.exec(html)) !== null) h1s.push(hm[1].replace(/\s+/g, " ").trim());
  const h1 = h1s[0] || "";

  // 2. SHEET AGREEMENT + label counts
  const perm = path.basename(relFile, ".html");
  const entries = sheetByPermalink[perm] || [];
  check(entries.length === 1, relFile + ": " + entries.length + " paste sheet entries for permalink '" + perm + "'" + (entries.length ? " (" + entries.map(e => e.file).join(", ") + ")" : ""));
  if (entries.length === 1) {
    const e = entries[0];
    check(e.counts.title === 1, relFile + ": sheet block carries " + e.counts.title + " Page Title labels, expected 1 (" + e.file + ")");
    check(e.counts.desc === 1, relFile + ": sheet block carries " + e.counts.desc + " Page Description labels, expected 1 (" + e.file + ")");
    check(e.counts.perm === 1, relFile + ": sheet block carries " + e.counts.perm + " Page Permalink labels, expected 1 (" + e.file + ")");
    check(e.title === title, relFile + ": sheet title differs from page title. SHEET '" + e.title + "' PAGE '" + title + "'");
    check(e.desc === desc, relFile + ": sheet description differs from page description. SHEET '" + e.desc + "' PAGE '" + desc + "'");
  }

  // 3. OWN TOWN
  [["title", title], ["description", desc], ["h1", h1]].forEach(([leg, text]) => {
    check(text.indexOf(sm.seoTown) !== -1, relFile + ": own town '" + sm.seoTown + "' missing from " + leg + " ('" + text + "')");
  });

  // 4. SERVICE WORDS
  const words = serviceWordsFor(relFile);
  if (!words) { fails.push(relFile + ": no service-word rule for this page type"); return; }
  [["title", title], ["description", desc], ["h1", h1]].forEach(([leg, text]) => {
    check(hasAnyWord(text, words), relFile + ": no service word (" + words.join(", ") + ") in " + leg + " ('" + text + "')");
  });

  // 5. CROSS-TOWN (Clear Chemist also carries seoTown Aintree; shared value excluded)
  const excused = new Set((sm.serviceAreaList || []).map(t => t.toLowerCase()));
  const foreign = liveTowns.filter(t => t !== sm.seoTown && !excused.has(t.toLowerCase()));
  [["title", title], ["description", desc]].concat(h1s.map((h, i) => ["h1[" + i + "]", h])).forEach(([leg, text]) => {
    foreign.forEach(t => {
      check(!townRe(t).test(text), relFile + ": foreign town '" + t + "' in " + leg + " ('" + text + "')");
    });
  });

  // 6. PHONES AND POSTCODES (Clear Chemist Aintree shares the L9 district;
  // its full postcode L9 7AS must still be absent from every Tiffenbergs page)
  const htmlDigitsStripped = html.replace(/[\s()-]/g, "");
  check(htmlDigitsStripped.indexOf(digits(sm.phone)) !== -1, relFile + ": own phone " + sm.phone + " NOT present in page");
  others.forEach(o => {
    if (o.phone && digits(o.phone) !== digits(sm.phone)) {
      check(htmlDigitsStripped.indexOf(digits(o.phone)) === -1, relFile + ": foreign phone " + o.phone + " (" + o.id + ") present in page");
    }
    if (o.postalCode && o.postalCode !== sm.postalCode) {
      check(html.toUpperCase().indexOf(o.postalCode.toUpperCase()) === -1, relFile + ": foreign postcode " + o.postalCode + " (" + o.id + ") present in page");
    }
  });
  check(html.toUpperCase().indexOf(sm.postalCode.toUpperCase()) !== -1, relFile + ": own postcode " + sm.postalCode + " NOT present in page");

  // 7. LENGTHS
  check(title.length <= 65, relFile + ": title " + title.length + " chars, over 65 ('" + title + "')");
  check(desc.length >= 80, relFile + ": description " + desc.length + " chars, under 80");
  check(desc.length <= 165, relFile + ": description " + desc.length + " chars, over 165");

  // 8. JSON-LD FIELD BY FIELD AND tel:
  const ld = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
  check(!!ld, relFile + ": no JSON-LD block");
  if (ld) {
    let parsed = null;
    try { parsed = JSON.parse(ld[1]); } catch (e) { fails.push(relFile + ": JSON-LD does not parse: " + e.message); }
    if (parsed) {
      const node = Array.isArray(parsed) ? parsed[0] : parsed;
      const addr = node.address || {};
      check(node.name === sm.branchName, relFile + ": JSON-LD name '" + node.name + "' != branchName '" + sm.branchName + "'");
      check(digits(node.telephone) === digits(sm.phone), relFile + ": JSON-LD telephone '" + node.telephone + "' != branch phone '" + sm.phone + "'");
      check(addr.streetAddress === sm.streetAddress, relFile + ": JSON-LD streetAddress '" + addr.streetAddress + "' != '" + sm.streetAddress + "'");
      check(addr.addressLocality === sm.addressLocality, relFile + ": JSON-LD addressLocality '" + addr.addressLocality + "' != '" + sm.addressLocality + "'");
      check(addr.postalCode === sm.postalCode, relFile + ": JSON-LD postalCode '" + addr.postalCode + "' != '" + sm.postalCode + "'");
      check(addr.addressRegion === sm.addressRegion, relFile + ": JSON-LD addressRegion '" + addr.addressRegion + "' != '" + sm.addressRegion + "'");
      check(addr.addressCountry === sm.addressCountry, relFile + ": JSON-LD addressCountry '" + addr.addressCountry + "' != '" + sm.addressCountry + "'");
      if (node.url) {
        check(node.url.indexOf(sm.website) === 0, relFile + ": JSON-LD url '" + node.url + "' not on own host " + sm.website);
        check(node.url.replace(/\/$/, "").endsWith(path.basename(relFile)), relFile + ": JSON-LD url '" + node.url + "' does not end with the page filename");
      } else {
        checksRun++; fails.push(relFile + ": JSON-LD has no url field");
      }
    }
  }
  check(/href=["']tel:/i.test(html), relFile + ": no tel: link");

  // 9. FOREIGN WIDGET IDS
  others.forEach(o => {
    Object.entries(o.widgets || {}).forEach(([k, v]) => {
      if (v && !Object.values(sm.widgets || {}).includes(v)) {
        check(html.indexOf(v) === -1, relFile + ": foreign widget id " + v + " (" + o.id + " " + k + ") present in page");
      }
    });
  });

  // 10. FOREIGN BRAND LABELS
  others.forEach(o => {
    if (o.brandLabel && o.brandLabel !== sm.brandLabel) {
      check(html.indexOf(o.brandLabel) === -1, relFile + ": foreign brand '" + o.brandLabel + "' (" + o.id + ") present in page");
    }
  });

  // 12. ROOT ATTRIBUTES (service pages only; the switch module has its own root)
  if (relFile.indexOf("modules/service/pages") === 0) {
    const root = /<div id="rbhsv-root"([^>]*)>/.exec(html);
    check(!!root, relFile + ": no #rbhsv-root element");
    if (root) {
      const db = /data-branch="([^"]*)"/.exec(root[1]);
      const ds = /data-service="([^"]*)"/.exec(root[1]);
      check(!!db && (db[1] === sm.branchName || db[1] === sm.brandLabel),
        relFile + ": data-branch '" + (db ? db[1] : "") + "' is neither branchName nor brandLabel");
      check(!!ds && ds[1].trim().length > 0, relFile + ": data-service missing or empty");
    }
  }

  // 13. FRAGMENT RESOLUTION
  const ids = new Set();
  const idRe = /id="([^"]+)"/g;
  let im;
  while ((im = idRe.exec(html)) !== null) ids.add(im[1]);
  const fragRe = /href="#([^"]+)"/g;
  let fm;
  while ((fm = fragRe.exec(html)) !== null) {
    check(ids.has(fm[1]), relFile + ": fragment link #" + fm[1] + " has no matching id in the page");
  }

  // 14. NO HARD-CODED WIDGET ID (24-hex anywhere in the page)
  const hexMatches = html.match(/[0-9a-f]{24}/g) || [];
  check(hexMatches.length === 0, relFile + ": 24-hex string(s) hard-coded in page: " + hexMatches.join(", ") + " (widgets must be rendered by the module JS)");

  // 15. WHATSAPP
  const wa = /data-wa="([^"]*)"/.exec(html);
  check(!!wa, relFile + ": no data-wa attribute");
  if (wa) {
    pageWa.push({ page: relFile, num: wa[1] });
    check(/^447\d{9}$/.test(wa[1]), relFile + ": data-wa '" + wa[1] + "' is not 447 plus nine digits");
    check(wa[1] === WA, relFile + ": data-wa '" + wa[1] + "' != module DEFAULT_WHATSAPP '" + WA + "'");
  }
});

check(pagesChecked === 12, "expected 12 Tiffenbergs pages, found " + pagesChecked);
check(new Set(pageWa.map(w => w.num)).size <= 1, "pages disagree on data-wa: " + JSON.stringify(pageWa));

// 11. BANNER
const bf = path.join(REPO, "modules/switch/pages/banners/switch-prescriptions-tiffenbergs-aintree.txt");
check(fs.existsSync(bf), "banner switch-prescriptions-tiffenbergs-aintree.txt missing");
if (fs.existsSync(bf)) {
  const txt = fs.readFileSync(bf, "utf8");
  check(txt.indexOf("switch-prescriptions-tiffenbergs-aintree") !== -1, "banner: does not point at Tiffenbergs' own switch page");
}

console.log("verify-3.12: " + pagesChecked + " Tiffenbergs pages checked, " + Object.keys(sheetByPermalink).length + " sheet permalinks parsed, " + checksRun + " checks run");
if (fails.length) {
  console.log("FAILURES (" + fails.length + "):");
  fails.forEach(f => console.log("  FAIL  " + f));
  process.exit(1);
}
console.log("CLEAN on all legs: counts, sheet agreement and one-label-per-block, own town, service words, cross-town absence, phone/postcode isolation (including from Clear Chemist in the same L9 district), lengths, JSON-LD field-by-field, tel:, widget isolation, brand isolation, banner, root attributes, fragment resolution, no hard-coded widget ids, WhatsApp agreement.");
