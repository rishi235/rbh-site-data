/*
  verify-3.2-2026-08-30.js - fifth independent machine pass on item 3.2.

  Imports NOTHING from tools/. Own regexes, own service-word table, own
  cross-town logic. Reads branches.json as data only.

  Checks, per Scorah page (26 pages: 2 landing, 22 service, 2 switch):
    1. COUNTS: exactly one "Weebly page SEO title" line, exactly one
       "Weebly page SEO description" line, exactly one h1 element. The h1
       count is the rule the 2026-08-14 pass added; the title and
       description LINE counts are this pass's extension of the same
       question to the other two legs of item 3.2's sentence.
    2. Own town (seoTown) in title, description and h1, exact case.
    3. A service word for the page type in title, description and h1,
       case-insensitive.
    4. No other live branch's seoTown in title, description or any h1,
       unless that town is in this branch's own serviceAreaList.
    5. Title <= 65 characters, description 80 to 165.
*/
"use strict";
const fs = require("fs");
const path = require("path");

const REPO = "C:/Dev/rbh-site-data";
const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));

const scorah = {};
data.branches.forEach(b => {
  if (b.brandSlug && /scorah/i.test(b.brandSlug) || /Scorah/.test(b.brandLabel || "")) {
    scorah[b.townSlug] = b;
  }
});
const liveTowns = data.branches
  .filter(b => !b.disposed && b.seoTown && b.seoTown.trim())
  .map(b => b.seoTown.trim());

const PAGES = [];
[["modules/branch/pages"], ["modules/service/pages"], ["modules/switch/pages"]].forEach(([d]) => {
  fs.readdirSync(path.join(REPO, d)).forEach(f => {
    if (f.endsWith(".html") && /scorah/.test(f)) PAGES.push(path.join(d, f));
  });
});

function branchFor(file) {
  const base = path.basename(file, ".html");
  if (/hazel-grove$/.test(base)) return scorah["hazel-grove"];
  if (/bramhall$/.test(base)) return scorah["bramhall"];
  return null;
}

function serviceWordsFor(file) {
  const base = path.basename(file, ".html");
  if (/^pharmacy-first-/.test(base)) return [["pharmacy first"]];
  const m = /^([a-z-]+)-treatment-scorah/.exec(base);
  if (m) return [[m[1].replace(/-/g, " ")], ["treatment"]]; // both must appear? item says service words - require EITHER leg? Mirror repo: condition word AND/OR treatment. Use: at least one of the two.
  if (/^contraception-/.test(base)) return [["contraception", "contraceptive"]];
  if (/^weight-loss-clinic-/.test(base)) return [["weight loss"]];
  if (/^travel-clinic-/.test(base)) return [["travel"]];
  if (/^switch-prescriptions-/.test(base)) return [["prescription"]];
  if (/^pharmacy-scorah-/.test(base)) return [["pharmacy"]];
  return null;
}
// serviceWordsFor returns groups; the page passes a leg if EVERY group has at
// least one member present (condition pages therefore need the condition word
// AND "treatment"... but the repo rule treats sw as any-of. To stay strictly
// independent we assert the LOOSER any-of rule as the floor and REPORT if the
// stricter all-groups rule would fail, without failing the run on it.
function hasAnyWord(text, words) {
  const t = text.toLowerCase();
  return words.some(w => t.indexOf(w.toLowerCase()) !== -1);
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

let fails = [], reports = [], pagesChecked = 0;

PAGES.forEach(relFile => {
  const file = path.join(REPO, relFile);
  const html = fs.readFileSync(file, "utf8");
  const b = branchFor(relFile);
  if (!b) { fails.push(relFile + ": cannot map to a Scorah branch"); return; }
  pagesChecked++;

  // COUNTS
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

  // OWN TOWN, exact case
  [["title", title], ["description", desc], ["h1", h1]].forEach(([leg, text]) => {
    if (text.indexOf(b.seoTown) === -1) fails.push(relFile + ": own town '" + b.seoTown + "' missing from " + leg + " ('" + text + "')");
  });

  // SERVICE WORDS
  const groups = serviceWordsFor(relFile);
  if (!groups) { fails.push(relFile + ": no service-word rule for this page type"); return; }
  const flat = groups.reduce((a, g) => a.concat(g), []);
  [["title", title], ["description", desc], ["h1", h1]].forEach(([leg, text]) => {
    if (!hasAnyWord(text, flat)) fails.push(relFile + ": no service word (" + flat.join(", ") + ") in " + leg + " ('" + text + "')");
    groups.forEach(g => {
      if (!hasAnyWord(text, g)) reports.push(relFile + ": " + leg + " lacks word group [" + g.join("/") + "] (strict all-groups view only)");
    });
  });

  // CROSS-TOWN ABSENCE - all h1s, not just the first
  const excused = new Set((b.serviceAreaList || []).map(t => t.toLowerCase()));
  const foreign = liveTowns.filter(t => t !== b.seoTown && !excused.has(t.toLowerCase()));
  [["title", title], ["description", desc]].concat(h1s.map((h, i) => ["h1[" + i + "]", h])).forEach(([leg, text]) => {
    foreign.forEach(t => {
      const re = new RegExp("(^|[^A-Za-z])" + escapeRe(t) + "([^A-Za-z]|$)", "i");
      if (re.test(text)) fails.push(relFile + ": foreign town '" + t + "' in " + leg + " ('" + text + "')");
    });
  });

  // LENGTHS
  if (title.length > 65) fails.push(relFile + ": title " + title.length + " chars, over 65 ('" + title + "')");
  if (desc.length < 80) fails.push(relFile + ": description " + desc.length + " chars, under 80");
  if (desc.length > 165) fails.push(relFile + ": description " + desc.length + " chars, over 165");
});

console.log("verify-3.2: " + pagesChecked + " Scorah pages checked");
if (reports.length) {
  console.log("REPORTS (strict view, not failures):");
  reports.forEach(r => console.log("  NOTE  " + r));
}
if (fails.length) {
  console.log("FAILURES (" + fails.length + "):");
  fails.forEach(f => console.log("  FAIL  " + f));
  process.exit(1);
}
console.log("CLEAN on all legs: counts (title line, description line, h1), own town, service words, cross-town absence, lengths.");
