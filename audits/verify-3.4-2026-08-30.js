/*
  verify-3.4-2026-08-30.js - sixth independent machine pass on item 3.4
  (Cherry Lane Pharmacy, Walton, single branch).

  Imports NOTHING from tools/. Own regexes, own service-word table, own
  sheet-parsing and cross-town logic. Reads branches.json as data only.

  Checks, per Cherry Lane page (12: 11 service, 1 switch):
    1. COUNTS: exactly one "Weebly page SEO title" line, one
       "Weebly page SEO description" line, one h1 element.
    2. SHEET AGREEMENT: the paste sheet entry whose permalink matches the
       page filename exists exactly once across all six sheets, its block
       carries each label exactly once (a doubled label is what the
       one-label-per-block rule added on the 3.3 pass guards; this
       verifier counts them with its own regex), and its FIRST Page Title
       and Page Description lines - the lines a paster reading top to
       bottom takes - equal the page head comment's, character for
       character.
    3. Own town (seoTown = Walton) in title, description and h1.
    4. A service word for the page type in all three legs.
    5. No other live branch's seoTown in title, description or any h1
       unless in Cherry Lane's own serviceAreaList (Liverpool, Walton,
       Everton are excused).
    6. Own phone present; no OTHER branch's phone anywhere in the page;
       own postcode L4 8SG present and no other branch's postcode
       anywhere.
    7. Lengths: title <= 65, description 80 to 165.
    8. JSON-LD present with addressLocality "Liverpool" (the postal town,
       deliberately NOT the seoTown) and a tel: link on every page.
    9. No other branch's widget id anywhere in the page.
   10. The switch banner points at Cherry Lane's own switch page.
   11. The two weebly-paste replacement blocks
       (cherry-lane-old-*-replacement.html) name no weight loss POM
       (independent name list, not tools/pom-names.js) and each links to
       its destination page, so a block cannot advertise a service and
       strand the patient. Read-only: this verifier changes no copy.
*/
"use strict";
const fs = require("fs");
const path = require("path");

const REPO = "C:/Dev/rbh-site-data";
const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));

const cl = data.branches.find(b => b.id === "cherrylane_liverpool");
if (!cl) { console.log("FATAL: cherrylane_liverpool not in branches.json"); process.exit(1); }
const others = data.branches.filter(b => b !== cl && !b.disposed);
const liveTowns = data.branches
  .filter(b => !b.disposed && b.seoTown && b.seoTown.trim())
  .map(b => b.seoTown.trim());

const PAGES = [];
["modules/service/pages", "modules/switch/pages"].forEach(d => {
  fs.readdirSync(path.join(REPO, d)).forEach(f => {
    if (f.endsWith(".html") && /cherry-lane/.test(f)) PAGES.push(d + "/" + f);
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
  const m = /^([a-z-]+)-treatment-cherry-lane/.exec(base);
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
    check(text.indexOf(cl.seoTown) !== -1, relFile + ": own town '" + cl.seoTown + "' missing from " + leg + " ('" + text + "')");
  });

  // 4. SERVICE WORDS
  const words = serviceWordsFor(relFile);
  if (!words) { fails.push(relFile + ": no service-word rule for this page type"); return; }
  [["title", title], ["description", desc], ["h1", h1]].forEach(([leg, text]) => {
    check(hasAnyWord(text, words), relFile + ": no service word (" + words.join(", ") + ") in " + leg + " ('" + text + "')");
  });

  // 5. CROSS-TOWN
  const excused = new Set((cl.serviceAreaList || []).map(t => t.toLowerCase()));
  const foreign = liveTowns.filter(t => t !== cl.seoTown && !excused.has(t.toLowerCase()));
  [["title", title], ["description", desc]].concat(h1s.map((h, i) => ["h1[" + i + "]", h])).forEach(([leg, text]) => {
    foreign.forEach(t => {
      check(!townRe(t).test(text), relFile + ": foreign town '" + t + "' in " + leg + " ('" + text + "')");
    });
  });

  // 6. PHONES AND POSTCODES
  const htmlDigitsStripped = html.replace(/[\s()-]/g, "");
  check(htmlDigitsStripped.indexOf(digits(cl.phone)) !== -1, relFile + ": own phone " + cl.phone + " NOT present in page");
  others.forEach(o => {
    if (o.phone && digits(o.phone) !== digits(cl.phone)) {
      check(htmlDigitsStripped.indexOf(digits(o.phone)) === -1, relFile + ": foreign phone " + o.phone + " (" + o.id + ") present in page");
    }
    if (o.postalCode && o.postalCode !== cl.postalCode) {
      check(html.toUpperCase().indexOf(o.postalCode.toUpperCase()) === -1, relFile + ": foreign postcode " + o.postalCode + " (" + o.id + ") present in page");
    }
  });
  check(html.toUpperCase().indexOf(cl.postalCode.toUpperCase()) !== -1, relFile + ": own postcode " + cl.postalCode + " NOT present in page");

  // 7. LENGTHS
  check(title.length <= 65, relFile + ": title " + title.length + " chars, over 65 ('" + title + "')");
  check(desc.length >= 80, relFile + ": description " + desc.length + " chars, under 80");
  check(desc.length <= 165, relFile + ": description " + desc.length + " chars, over 165");

  // 8. JSON-LD AND tel:
  const ld = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
  check(!!ld, relFile + ": no JSON-LD block");
  if (ld) {
    let parsed = null;
    try { parsed = JSON.parse(ld[1]); } catch (e) { fails.push(relFile + ": JSON-LD does not parse: " + e.message); }
    if (parsed) {
      const addr = JSON.stringify(parsed);
      check(addr.indexOf('"addressLocality":"Liverpool"') !== -1 || /"addressLocality":\s*"Liverpool"/.test(ld[1]),
        relFile + ": JSON-LD addressLocality is not the postal town Liverpool");
      check(addr.indexOf(cl.seoTown) === -1 || !/"addressLocality":\s*"Walton"/.test(ld[1]),
        relFile + ": JSON-LD addressLocality is the seoTown, should be the postal town");
    }
  }
  check(/href=["']tel:/i.test(html), relFile + ": no tel: link");

  // 9. FOREIGN WIDGET IDS
  others.forEach(o => {
    Object.entries(o.widgets || {}).forEach(([k, v]) => {
      if (v && !Object.values(cl.widgets || {}).includes(v)) {
        check(html.indexOf(v) === -1, relFile + ": foreign widget id " + v + " (" + o.id + " " + k + ") present in page");
      }
    });
  });
});

// 10. BANNER
const bf = path.join(REPO, "modules/switch/pages/banners/switch-prescriptions-cherry-lane-walton.txt");
check(fs.existsSync(bf), "banner switch-prescriptions-cherry-lane-walton.txt missing");
if (fs.existsSync(bf)) {
  const txt = fs.readFileSync(bf, "utf8");
  check(txt.indexOf("switch-prescriptions-cherry-lane-walton") !== -1, "banner: does not point at Cherry Lane's own switch page");
}

// 11. WEEBLY-PASTE REPLACEMENT BLOCKS (read-only checks)
const POMS = ["mounjaro", "wegovy", "orlistat", "saxenda", "ozempic", "tirzepatide", "semaglutide", "liraglutide", "xenical", "alli", "rybelsus", "victoza"];
[
  ["modules/service/weebly-paste/cherry-lane-old-weight-loss-replacement.html", "weight-loss-clinic-cherry-lane-walton"],
  ["modules/service/weebly-paste/cherry-lane-old-pharmacy-first-replacement.html", "pharmacy-first-cherry-lane-walton"]
].forEach(([rel, dest]) => {
  const p = path.join(REPO, rel);
  check(fs.existsSync(p), rel + " missing");
  if (!fs.existsSync(p)) return;
  const html = fs.readFileSync(p, "utf8").toLowerCase();
  POMS.forEach(m => check(html.indexOf(m) === -1, rel + ": names POM '" + m + "'"));
  check(html.indexOf(dest) !== -1, rel + ": does not link to destination page " + dest);
});

console.log("verify-3.4: " + pagesChecked + " Cherry Lane pages checked, " + Object.keys(sheetByPermalink).length + " sheet permalinks parsed, " + checksRun + " checks run");
if (fails.length) {
  console.log("FAILURES (" + fails.length + "):");
  fails.forEach(f => console.log("  FAIL  " + f));
  process.exit(1);
}
console.log("CLEAN on all legs: counts, sheet agreement and one-label-per-block, own town, service words, cross-town absence, phone/postcode isolation, lengths, JSON-LD postal town, tel:, widget isolation, banner, replacement blocks.");
