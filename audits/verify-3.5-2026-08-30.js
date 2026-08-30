/*
  verify-3.5-2026-08-30.js - sixth independent machine pass on item 3.5
  (Hirshmans Chemist, Ainsdale, single branch).

  Imports NOTHING from tools/. Own regexes, own service-word table, own
  sheet-parsing and cross-town logic. Reads branches.json as data only.

  Checks, per Hirshmans page (12: 11 service, 1 switch):
    1. COUNTS: exactly one "Weebly page SEO title" line, one
       "Weebly page SEO description" line, one h1 element.
    2. SHEET AGREEMENT: the paste sheet entry whose permalink matches the
       page filename exists exactly once across all six sheets, its block
       carries each label exactly once (one-label-per-block, counted with
       this file's own regex), and its FIRST Page Title and Page
       Description lines - the lines a paster reading top to bottom
       takes - equal the page head comment's, character for character.
    3. Own town (seoTown = Ainsdale) in title, description and h1.
    4. A service word for the page type in all three legs.
    5. No other live branch's seoTown in title, description or any h1
       unless in Hirshmans' own serviceAreaList (Ainsdale, Birkdale,
       Southport are excused).
    6. Own phone present; no OTHER branch's phone anywhere in the page;
       own postcode PR8 3HW present and no other branch's postcode
       anywhere.
    7. Lengths: title <= 65, description 80 to 165.
    8. JSON-LD present, parses, and - NEW LEG THIS PASS, tighter than the
       addressLocality-only rule the 3.4 template carried - agrees with
       branches.json field by field: name = branchName, telephone digits
       = branch phone, streetAddress, addressLocality, postalCode,
       addressRegion, addressCountry all exact, and the url sits on the
       branch's own website host and ends with the page filename. A tel:
       link on every page.
    9. No other branch's widget id anywhere in the page.
   10. No other branch's brandLabel anywhere in the page.
   11. The switch banner points at Hirshmans' own switch page.
*/
"use strict";
const fs = require("fs");
const path = require("path");

const REPO = "C:/Dev/rbh-site-data";
const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));

const hz = data.branches.find(b => b.id === "hirshmans_ainsdale");
if (!hz) { console.log("FATAL: hirshmans_ainsdale not in branches.json"); process.exit(1); }
const others = data.branches.filter(b => b !== hz && !b.disposed);
const liveTowns = data.branches
  .filter(b => !b.disposed && b.seoTown && b.seoTown.trim())
  .map(b => b.seoTown.trim());

const PAGES = [];
["modules/service/pages", "modules/switch/pages"].forEach(d => {
  fs.readdirSync(path.join(REPO, d)).forEach(f => {
    if (f.endsWith(".html") && /hirshmans/.test(f)) PAGES.push(d + "/" + f);
  });
});

// Parse all six paste sheets independently. Keep FIRST label line per
// block (paster order) and COUNT label lines per block.
const SHEET_FILES = [
  "modules/branch/pages/SEO.md",
  "modules/service/pages/SEO.md",
  "modules/service/pages/CONTRACEPTION-SEO.md",
  "modules/service/pages/TRAVEL-CLINIC-SEO.md",
  "modules/service/pages/WEIGHT-LOSS-SEO.md",
  "modules/switch/pages/SEO.md"
];
const sheetByPermalink = {}; // permalink -> [{title, desc, file, counts}]
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
  const m = /^([a-z-]+)-treatment-hirshmans/.exec(base);
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
    check(text.indexOf(hz.seoTown) !== -1, relFile + ": own town '" + hz.seoTown + "' missing from " + leg + " ('" + text + "')");
  });

  // 4. SERVICE WORDS
  const words = serviceWordsFor(relFile);
  if (!words) { fails.push(relFile + ": no service-word rule for this page type"); return; }
  [["title", title], ["description", desc], ["h1", h1]].forEach(([leg, text]) => {
    check(hasAnyWord(text, words), relFile + ": no service word (" + words.join(", ") + ") in " + leg + " ('" + text + "')");
  });

  // 5. CROSS-TOWN
  const excused = new Set((hz.serviceAreaList || []).map(t => t.toLowerCase()));
  const foreign = liveTowns.filter(t => t !== hz.seoTown && !excused.has(t.toLowerCase()));
  [["title", title], ["description", desc]].concat(h1s.map((h, i) => ["h1[" + i + "]", h])).forEach(([leg, text]) => {
    foreign.forEach(t => {
      check(!townRe(t).test(text), relFile + ": foreign town '" + t + "' in " + leg + " ('" + text + "')");
    });
  });

  // 6. PHONES AND POSTCODES
  const htmlDigitsStripped = html.replace(/[\s()-]/g, "");
  check(htmlDigitsStripped.indexOf(digits(hz.phone)) !== -1, relFile + ": own phone " + hz.phone + " NOT present in page");
  others.forEach(o => {
    if (o.phone && digits(o.phone) !== digits(hz.phone)) {
      check(htmlDigitsStripped.indexOf(digits(o.phone)) === -1, relFile + ": foreign phone " + o.phone + " (" + o.id + ") present in page");
    }
    if (o.postalCode && o.postalCode !== hz.postalCode) {
      check(html.toUpperCase().indexOf(o.postalCode.toUpperCase()) === -1, relFile + ": foreign postcode " + o.postalCode + " (" + o.id + ") present in page");
    }
  });
  check(html.toUpperCase().indexOf(hz.postalCode.toUpperCase()) !== -1, relFile + ": own postcode " + hz.postalCode + " NOT present in page");

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
      check(node.name === hz.branchName, relFile + ": JSON-LD name '" + node.name + "' != branchName '" + hz.branchName + "'");
      check(digits(node.telephone) === digits(hz.phone), relFile + ": JSON-LD telephone '" + node.telephone + "' != branch phone '" + hz.phone + "'");
      check(addr.streetAddress === hz.streetAddress, relFile + ": JSON-LD streetAddress '" + addr.streetAddress + "' != '" + hz.streetAddress + "'");
      check(addr.addressLocality === hz.addressLocality, relFile + ": JSON-LD addressLocality '" + addr.addressLocality + "' != '" + hz.addressLocality + "'");
      check(addr.postalCode === hz.postalCode, relFile + ": JSON-LD postalCode '" + addr.postalCode + "' != '" + hz.postalCode + "'");
      check(addr.addressRegion === hz.addressRegion, relFile + ": JSON-LD addressRegion '" + addr.addressRegion + "' != '" + hz.addressRegion + "'");
      check(addr.addressCountry === hz.addressCountry, relFile + ": JSON-LD addressCountry '" + addr.addressCountry + "' != '" + hz.addressCountry + "'");
      if (node.url) {
        check(node.url.indexOf(hz.website) === 0, relFile + ": JSON-LD url '" + node.url + "' not on own host " + hz.website);
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
      if (v && !Object.values(hz.widgets || {}).includes(v)) {
        check(html.indexOf(v) === -1, relFile + ": foreign widget id " + v + " (" + o.id + " " + k + ") present in page");
      }
    });
  });

  // 10. FOREIGN BRAND LABELS
  others.forEach(o => {
    if (o.brandLabel && o.brandLabel !== hz.brandLabel) {
      check(html.indexOf(o.brandLabel) === -1, relFile + ": foreign brand '" + o.brandLabel + "' (" + o.id + ") present in page");
    }
  });
});

// 11. BANNER
const bf = path.join(REPO, "modules/switch/pages/banners/switch-prescriptions-hirshmans-ainsdale.txt");
check(fs.existsSync(bf), "banner switch-prescriptions-hirshmans-ainsdale.txt missing");
if (fs.existsSync(bf)) {
  const txt = fs.readFileSync(bf, "utf8");
  check(txt.indexOf("switch-prescriptions-hirshmans-ainsdale") !== -1, "banner: does not point at Hirshmans' own switch page");
}

console.log("verify-3.5: " + pagesChecked + " Hirshmans pages checked, " + Object.keys(sheetByPermalink).length + " sheet permalinks parsed, " + checksRun + " checks run");
if (fails.length) {
  console.log("FAILURES (" + fails.length + "):");
  fails.forEach(f => console.log("  FAIL  " + f));
  process.exit(1);
}
console.log("CLEAN on all legs: counts, sheet agreement and one-label-per-block, own town, service words, cross-town absence, phone/postcode isolation, lengths, JSON-LD field-by-field, tel:, widget isolation, brand isolation, banner.");
