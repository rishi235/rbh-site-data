/*
  verify-3.3-2026-08-30.js - fifth independent machine pass on item 3.3
  (Fishlocks Chemist, Ainsdale and Eccleston, shared domain).

  Imports NOTHING from tools/. Own regexes, own service-word table, own
  cross-town and sheet-parsing logic. Reads branches.json as data only.

  Checks, per Fishlocks page (26: 2 landing, 22 service, 2 switch):
    1. COUNTS: exactly one "Weebly page SEO title" line, one
       "Weebly page SEO description" line, one h1 element.
    2. SHEET AGREEMENT: the paste sheet entry whose permalink matches the
       page filename exists exactly once across all six sheets, and its
       Page Title and Page Description equal the page head comment's,
       character for character. The sheets are what the paster reads, so
       page and sheet drifting apart gives Google a different string than
       the repo proves.
    3. Own town (seoTown) in title, description and h1, exact case.
    4. A service word for the page type in all three legs.
    5. No other live branch's seoTown in title, description or any h1
       unless in this branch's own serviceAreaList; the SISTER town
       (other Fishlocks branch) barred from those legs unconditionally.
    6. Sister branch's phone and postcode absent from the ENTIRE page,
       own phone present. Sister town in body copy allowed only on the
       two landing pages (the deliberate item 2.2 cross-branch paragraph).
    7. Lengths: title <= 65, description 80 to 165.
    8. The two switch banners each point at their own branch's switch
       page and never the sister's.
    9. "Eccleston in Eccleston" absent from every page (2026-08-09 fix).
*/
"use strict";
const fs = require("fs");
const path = require("path");

const REPO = "C:/Dev/rbh-site-data";
const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));

const fish = {};
data.branches.forEach(b => {
  if (/fishlock/i.test(b.brandSlug || "") || /Fishlocks/.test(b.brandLabel || "")) fish[b.townSlug] = b;
});
const ains = fish["ainsdale"], ecc = fish["eccleston"];
if (!ains || !ecc) { console.log("FATAL: could not find both Fishlocks branches"); process.exit(1); }
const liveTowns = data.branches
  .filter(b => !b.disposed && b.seoTown && b.seoTown.trim())
  .map(b => b.seoTown.trim());

const PAGES = [];
["modules/branch/pages", "modules/service/pages", "modules/switch/pages"].forEach(d => {
  fs.readdirSync(path.join(REPO, d)).forEach(f => {
    if (f.endsWith(".html") && /fishlocks/.test(f)) PAGES.push(d + "/" + f);
  });
});

// Parse all six paste sheets independently.
const SHEET_FILES = [
  "modules/branch/pages/SEO.md",
  "modules/service/pages/SEO.md",
  "modules/service/pages/CONTRACEPTION-SEO.md",
  "modules/service/pages/TRAVEL-CLINIC-SEO.md",
  "modules/service/pages/WEIGHT-LOSS-SEO.md",
  "modules/switch/pages/SEO.md"
];
const sheetByPermalink = {}; // permalink -> [{title, desc, file}]
SHEET_FILES.forEach(sf => {
  const p = path.join(REPO, sf);
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf8");
  const blocks = text.split(/^## /m).slice(1);
  blocks.forEach(bl => {
    const perm = /\*\*Page Permalink:\*\*\s*(\S+)/.exec(bl);
    const ti = /\*\*Page Title:\*\*\s*(.+)/.exec(bl);
    const de = /\*\*Page Description:\*\*\s*(.+)/.exec(bl);
    if (perm) {
      const key = perm[1].trim().replace(/\/$/, "");
      (sheetByPermalink[key] = sheetByPermalink[key] || []).push({
        title: ti ? ti[1].trim() : "",
        desc: de ? de[1].trim() : "",
        file: sf
      });
    }
  });
});

function branchFor(file) {
  const base = path.basename(file, ".html");
  if (/eccleston$/.test(base)) return ecc;
  if (/ainsdale$/.test(base)) return ains;
  return null;
}
function serviceWordsFor(file) {
  const base = path.basename(file, ".html");
  if (/^pharmacy-first-/.test(base)) return ["pharmacy first"];
  const m = /^([a-z-]+)-treatment-fishlocks/.exec(base);
  if (m) return [m[1].replace(/-/g, " "), "treatment"];
  if (/^contraception-/.test(base)) return ["contraception", "contraceptive"];
  if (/^weight-loss-clinic-/.test(base)) return ["weight loss"];
  if (/^travel-clinic-/.test(base)) return ["travel"];
  if (/^switch-prescriptions-/.test(base)) return ["prescription"];
  if (/^pharmacy-fishlocks-/.test(base)) return ["pharmacy"];
  return null;
}
function hasAnyWord(text, words) {
  const t = text.toLowerCase();
  return words.some(w => t.indexOf(w.toLowerCase()) !== -1);
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function townRe(t) { return new RegExp("(^|[^A-Za-z])" + escapeRe(t) + "([^A-Za-z]|$)", "i"); }

let fails = [], notes = [], pagesChecked = 0;

PAGES.forEach(relFile => {
  const file = path.join(REPO, relFile);
  const html = fs.readFileSync(file, "utf8");
  const b = branchFor(relFile);
  if (!b) { fails.push(relFile + ": cannot map to a Fishlocks branch"); return; }
  const sister = (b === ains) ? ecc : ains;
  const isLanding = /^pharmacy-fishlocks-/.test(path.basename(relFile));
  pagesChecked++;

  // 1. COUNTS
  const titleLines = html.match(/^.*Weebly page SEO title:.*$/gm) || [];
  const descLines = html.match(/^.*Weebly page SEO description:.*$/gm) || [];
  const h1Opens = html.match(/<h1[^>]*>/gi) || [];
  if (titleLines.length !== 1) fails.push(relFile + ": " + titleLines.length + " SEO title lines, expected 1");
  if (descLines.length !== 1) fails.push(relFile + ": " + descLines.length + " SEO description lines, expected 1");
  if (h1Opens.length !== 1) fails.push(relFile + ": " + h1Opens.length + " h1 elements, expected 1");

  const title = titleLines.length ? titleLines[0].replace(/^.*Weebly page SEO title:\s*/, "").trim() : "";
  const desc = descLines.length ? descLines[0].replace(/^.*Weebly page SEO description:\s*/, "").trim() : "";
  const h1s = [];
  const h1Re = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  let hm;
  while ((hm = h1Re.exec(html)) !== null) h1s.push(hm[1].replace(/\s+/g, " ").trim());
  const h1 = h1s[0] || "";

  // 2. SHEET AGREEMENT
  const perm = path.basename(relFile, ".html");
  const entries = sheetByPermalink[perm] || [];
  if (entries.length === 0) fails.push(relFile + ": no paste sheet entry for permalink '" + perm + "'");
  else if (entries.length > 1) fails.push(relFile + ": " + entries.length + " paste sheet entries for permalink '" + perm + "' (" + entries.map(e => e.file).join(", ") + ")");
  else {
    if (entries[0].title !== title) fails.push(relFile + ": sheet title differs from page title. SHEET '" + entries[0].title + "' PAGE '" + title + "'");
    if (entries[0].desc !== desc) fails.push(relFile + ": sheet description differs from page description. SHEET '" + entries[0].desc + "' PAGE '" + desc + "'");
  }

  // 3. OWN TOWN
  [["title", title], ["description", desc], ["h1", h1]].forEach(([leg, text]) => {
    if (text.indexOf(b.seoTown) === -1) fails.push(relFile + ": own town '" + b.seoTown + "' missing from " + leg + " ('" + text + "')");
  });

  // 4. SERVICE WORDS
  const words = serviceWordsFor(relFile);
  if (!words) { fails.push(relFile + ": no service-word rule for this page type"); return; }
  [["title", title], ["description", desc], ["h1", h1]].forEach(([leg, text]) => {
    if (!hasAnyWord(text, words)) fails.push(relFile + ": no service word (" + words.join(", ") + ") in " + leg + " ('" + text + "')");
  });

  // 5. CROSS-TOWN
  const excused = new Set((b.serviceAreaList || []).map(t => t.toLowerCase()));
  const foreign = liveTowns.filter(t => t !== b.seoTown && !excused.has(t.toLowerCase()));
  [["title", title], ["description", desc]].concat(h1s.map((h, i) => ["h1[" + i + "]", h])).forEach(([leg, text]) => {
    foreign.forEach(t => {
      if (townRe(t).test(text)) fails.push(relFile + ": foreign town '" + t + "' in " + leg + " ('" + text + "')");
    });
    if (townRe(sister.seoTown).test(text)) fails.push(relFile + ": SISTER town '" + sister.seoTown + "' in " + leg + " ('" + text + "')");
  });

  // 6. SISTER PHONE / POSTCODE / TOWN IN BODY
  const digits = s => (s || "").replace(/\D/g, "");
  const htmlDigitsStripped = html.replace(/[\s()-]/g, "");
  if (sister.phone && htmlDigitsStripped.indexOf(digits(sister.phone)) !== -1)
    fails.push(relFile + ": sister branch phone " + sister.phone + " present in page");
  if (b.phone && htmlDigitsStripped.indexOf(digits(b.phone)) === -1)
    fails.push(relFile + ": own phone " + b.phone + " NOT present in page");
  if (sister.postalCode && html.toUpperCase().indexOf(sister.postalCode.toUpperCase()) !== -1)
    fails.push(relFile + ": sister branch postcode " + sister.postalCode + " present in page");
  if (!isLanding) {
    const bodyOnly = html.replace(/<!--[\s\S]*?-->/g, " ");
    if (townRe(sister.seoTown).test(bodyOnly))
      fails.push(relFile + ": sister town '" + sister.seoTown + "' in body copy of a non-landing page");
  }

  // 7. LENGTHS
  if (title.length > 65) fails.push(relFile + ": title " + title.length + " chars, over 65 ('" + title + "')");
  if (desc.length < 80) fails.push(relFile + ": description " + desc.length + " chars, under 80");
  if (desc.length > 165) fails.push(relFile + ": description " + desc.length + " chars, over 165");

  // 9. "Eccleston in Eccleston"
  if (/Eccleston\s+in\s+Eccleston/i.test(html)) fails.push(relFile + ": 'Eccleston in Eccleston' present");
});

// 8. BANNERS
["ainsdale", "eccleston"].forEach(side => {
  const bf = path.join(REPO, "modules/switch/pages/banners/switch-prescriptions-fishlocks-" + side + ".txt");
  if (!fs.existsSync(bf)) { fails.push("banner for " + side + " missing"); return; }
  const txt = fs.readFileSync(bf, "utf8");
  const other = side === "ainsdale" ? "eccleston" : "ainsdale";
  if (txt.indexOf("switch-prescriptions-fishlocks-" + side) === -1)
    fails.push("banner " + side + ": does not point at its own switch page");
  if (txt.indexOf("switch-prescriptions-fishlocks-" + other) !== -1)
    fails.push("banner " + side + ": points at the SISTER switch page");
});

console.log("verify-3.3: " + pagesChecked + " Fishlocks pages checked, " + Object.keys(sheetByPermalink).length + " sheet permalinks parsed");
if (notes.length) notes.forEach(n => console.log("  NOTE  " + n));
if (fails.length) {
  console.log("FAILURES (" + fails.length + "):");
  fails.forEach(f => console.log("  FAIL  " + f));
  process.exit(1);
}
console.log("CLEAN on all legs: counts, sheet agreement, own town, service words, cross-town and sister-town absence, sister phone/postcode absence, lengths, banners, Eccleston-in-Eccleston.");