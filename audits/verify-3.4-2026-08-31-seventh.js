/*
  verify-3.4-2026-08-31-seventh.js - seventh independent machine pass on item
  3.4 (Cherry Lane Pharmacy, Walton, single branch).

  Imports NOTHING from tools/. Own regexes, own service-word table, own
  sheet-parsing and cross-town logic. Reads branches.json as data only.

  Repeats the core invariants the sixth pass (2026-08-30) proved, PLUS one
  check that pass could not have run: the "whatsapp" field. branches.json
  gained a per-branch "whatsapp" field between the sixth and seventh passes
  (Q21, implemented in the five generators, service.js and switch.js left
  as fallback-only). Every one of Cherry Lane's 12 pages should now carry
  data-wa="<cl.whatsapp>" and no foreign number.

  Checks, per Cherry Lane page (12: 11 service, 1 switch):
    1. COUNTS: exactly one SEO title line, one SEO description line, one h1.
    2. SHEET AGREEMENT: page head comment matches its paste sheet entry,
       one label per line.
    3. Own town (Walton) in title, description, h1.
    4. A service word for the page type in all three legs.
    5. No other live branch's seoTown anywhere, excused list applied.
    6. Own phone/postcode present, no foreign phone/postcode.
    7. Lengths: title <= 65, description 80-165.
    8. JSON-LD present, addressLocality Liverpool (postal town), tel: link.
    9. No other branch's widget id anywhere in the page.
   10. NEW: every page carrying a module root has data-wa="<cl.whatsapp>"
       and no other branch's whatsapp number anywhere in the page.
   11. The switch banner points at Cherry Lane's own switch page.
   12. The two weebly-paste replacement blocks name no POM and link their
       destination page (read-only).
*/
"use strict";
const fs = require("fs");
const path = require("path");

const REPO = process.cwd();
const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));

const cl = data.branches.find(b => b.id === "cherrylane_liverpool");
if (!cl) { console.log("FATAL: cherrylane_liverpool not in branches.json"); process.exit(1); }
if (!cl.whatsapp) { console.log("FATAL: cherrylane_liverpool has no whatsapp field"); process.exit(1); }
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
    const permM = /\*\*Page Permalink:\*\*\s*(\S+)/.exec(bl);
    if (!permM) return;
    const key = permM[1].trim().replace(/\/$/, "");
    const ti = /\*\*Page Title:\*\*\s*(.+)/.exec(bl);
    const de = /\*\*Page Description:\*\*\s*(.+)/.exec(bl);
    (sheetByPermalink[key] = sheetByPermalink[key] || []).push({
      title: ti ? ti[1].trim() : "", desc: de ? de[1].trim() : "", file: sf
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

  const perm = path.basename(relFile, ".html");
  const entries = sheetByPermalink[perm] || [];
  check(entries.length === 1, relFile + ": " + entries.length + " paste sheet entries for permalink '" + perm + "'");
  if (entries.length === 1) {
    check(entries[0].title === title, relFile + ": sheet title differs. SHEET '" + entries[0].title + "' PAGE '" + title + "'");
    check(entries[0].desc === desc, relFile + ": sheet description differs. SHEET '" + entries[0].desc + "' PAGE '" + desc + "'");
  }

  [["title", title], ["description", desc], ["h1", h1]].forEach(([leg, text]) => {
    check(text.indexOf(cl.seoTown) !== -1, relFile + ": own town '" + cl.seoTown + "' missing from " + leg);
  });

  const words = serviceWordsFor(relFile);
  if (!words) { fails.push(relFile + ": no service-word rule for this page type"); return; }
  [["title", title], ["description", desc], ["h1", h1]].forEach(([leg, text]) => {
    check(hasAnyWord(text, words), relFile + ": no service word (" + words.join(", ") + ") in " + leg);
  });

  const excused = new Set((cl.serviceAreaList || []).map(t => t.toLowerCase()));
  const foreign = liveTowns.filter(t => t !== cl.seoTown && !excused.has(t.toLowerCase()));
  [["title", title], ["description", desc]].concat(h1s.map((h, i) => ["h1[" + i + "]", h])).forEach(([leg, text]) => {
    foreign.forEach(t => check(!townRe(t).test(text), relFile + ": foreign town '" + t + "' in " + leg));
  });

  const htmlDigitsStripped = html.replace(/[\s()-]/g, "");
  check(htmlDigitsStripped.indexOf(digits(cl.phone)) !== -1, relFile + ": own phone NOT present");
  others.forEach(o => {
    if (o.phone && digits(o.phone) !== digits(cl.phone)) {
      check(htmlDigitsStripped.indexOf(digits(o.phone)) === -1, relFile + ": foreign phone " + o.phone + " (" + o.id + ") present");
    }
    if (o.postalCode && o.postalCode !== cl.postalCode) {
      check(html.toUpperCase().indexOf(o.postalCode.toUpperCase()) === -1, relFile + ": foreign postcode " + o.postalCode + " (" + o.id + ") present");
    }
  });
  check(html.toUpperCase().indexOf(cl.postalCode.toUpperCase()) !== -1, relFile + ": own postcode NOT present");

  check(title.length <= 65, relFile + ": title " + title.length + " chars, over 65");
  check(desc.length >= 80, relFile + ": description " + desc.length + " chars, under 80");
  check(desc.length <= 165, relFile + ": description " + desc.length + " chars, over 165");

  const ld = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
  check(!!ld, relFile + ": no JSON-LD block");
  if (ld) {
    check(/"addressLocality":\s*"Liverpool"/.test(ld[1]), relFile + ": JSON-LD addressLocality is not the postal town Liverpool");
  }
  check(/href=["']tel:/i.test(html), relFile + ": no tel: link");

  others.forEach(o => {
    Object.entries(o.widgets || {}).forEach(([k, v]) => {
      if (v && !Object.values(cl.widgets || {}).includes(v)) {
        check(html.indexOf(v) === -1, relFile + ": foreign widget id " + v + " (" + o.id + " " + k + ") present");
      }
    });
  });

  // NEW: whatsapp data-wa field
  const waMatch = /data-wa=["']([^"']+)["']/.exec(html);
  if (/rbhsv-root|rbhsw-root/.test(html)) {
    check(!!waMatch, relFile + ": has a module root but no data-wa attribute");
    if (waMatch) check(waMatch[1] === cl.whatsapp, relFile + ": data-wa is '" + waMatch[1] + "', expected own whatsapp '" + cl.whatsapp + "'");
  }
  others.forEach(o => {
    if (o.whatsapp && o.whatsapp !== cl.whatsapp) {
      check(html.indexOf(o.whatsapp) === -1, relFile + ": foreign whatsapp " + o.whatsapp + " (" + o.id + ") present");
    }
  });
});

const bf = path.join(REPO, "modules/switch/pages/banners/switch-prescriptions-cherry-lane-walton.txt");
check(fs.existsSync(bf), "banner switch-prescriptions-cherry-lane-walton.txt missing");
if (fs.existsSync(bf)) {
  const txt = fs.readFileSync(bf, "utf8");
  check(txt.indexOf("switch-prescriptions-cherry-lane-walton") !== -1, "banner: does not point at Cherry Lane's own switch page");
}

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

console.log("verify-3.4-seventh: " + pagesChecked + " Cherry Lane pages checked, " + checksRun + " checks run");
if (fails.length) {
  console.log("FAILURES (" + fails.length + "):");
  fails.forEach(f => console.log("  FAIL  " + f));
  process.exit(1);
}
console.log("CLEAN on all legs including the new data-wa/whatsapp check.");
