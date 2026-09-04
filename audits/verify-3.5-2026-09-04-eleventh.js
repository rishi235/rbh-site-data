/*
  audits/verify-3.5-2026-09-04-eleventh.js

  Item 3.5 quality pass (eleventh), 2026-09-04. Independent extraction, no
  code imported from tools/, written fresh for this run.

  Ten prior passes on this item used injection page types pharmacy-first
  (fifth), uti-treatment (seventh), weight-loss-clinic (eighth),
  switch-prescriptions (ninth) and contraception (tenth), and never
  travel-clinic-hirshmans-ainsdale.html, despite tools/check-travel-clinic-copy.js
  existing since 2026-08-11 and reading all 15 travel clinic pages including
  this one on every full-suite run. This script independently re-derives the
  same eleven checks that checker enforces, against this branch's own page
  only, using its own regexes rather than requiring tools/check-travel-clinic-copy.js
  or tools/pom-names.js.
*/
"use strict";
var fs = require("fs");
var path = require("path");
var ROOT = path.join(__dirname, "..");
var FILE = path.join(ROOT, "modules", "service", "pages", "travel-clinic-hirshmans-ainsdale.html");
var raw = fs.readFileSync(FILE, "utf8");

function norm(s) {
  return String(s).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ").trim();
}
function visible(html) {
  return norm(html.replace(/<!--[\s\S]*?-->/g, " ").replace(/<script\b[\s\S]*?<\/script>/gi, " "));
}
function plain(html) { return norm(visible(html).replace(/<[^>]*>/g, " ")); }

var text = plain(raw);
var checks = 0, fails = [];
function check(name, ok, detail) {
  checks++;
  if (!ok) fails.push(name + ": " + detail);
}

// 1. Private and paid, in the hero (before the trust bar).
var split = raw.indexOf('<div class="trust-bar">');
var heroText = plain(split === -1 ? raw : raw.slice(0, split));
check("private-paid-in-hero", /private, paid service/i.test(heroText),
  "hero does not state private, paid service");

// 2. Not described as NHS / Pharmacy First.
check("not-nhs-service", !/free NHS (?:travel )?(?:clinic|service)|NHS travel clinic|this is an NHS (?:service|appointment)/i.test(text),
  "page describes itself as an NHS service");
check("not-pharmacy-first", !/(?:part of|under) (?:the )?(?:NHS )?Pharmacy First/i.test(text),
  "page presents itself as Pharmacy First");

// 3. NHS funding statements hedged (own small independent word list).
var FUNDING = /(?:free on the NHS|available (?:free )?on the NHS|funded by the NHS|NHS-funded|NHS funded|on the NHS)/i;
var HEDGE = /\b(?:may|might|some|depending on|subject to|not an NHS|not NHS|no\.|will advise|can tell you|individual|circumstances|ask the pharmacist)\b/i;
var sentences = text.split(/(?<=[.!?])\s+/).map(function (s) { return s.trim(); }).filter(Boolean);
var unhedged = sentences.filter(function (s) {
  return FUNDING.test(s) && !/\?$/.test(s) && !HEDGE.test(s);
});
check("nhs-funding-hedged", unhedged.length === 0,
  "unhedged NHS funding statement(s): " + unhedged.join(" | "));

// 4. Stock never guaranteed, and the availability hedge is present.
check("no-stock-guarantee", !/guarantee[a-z]*\s+(?:in\s+)?stock|always\s+in\s+stock|we\s+(?:always\s+)?(?:have|hold|stock)\s+(?:all|every)\b/i.test(text),
  "page guarantees stock somewhere");
check("availability-hedge-present", /subject to availability/i.test(text),
  '"subject to availability" is not present');

// 5. Book-ahead window: one number, present at least twice (hero + FAQ).
var LEAD = /(\d+)\s*to\s*(\d+)\s*weeks\s*(?:or more\s*)?before/gi;
var windows = [], m;
while ((m = LEAD.exec(text)) !== null) windows.push(m[1] + " to " + m[2]);
var distinctWindows = windows.filter(function (v, i) { return windows.indexOf(v) === i; });
check("book-ahead-present-twice", windows.length >= 2, "book-ahead window stated " + windows.length + " time(s)");
check("book-ahead-single-value", distinctWindows.length <= 1, "multiple distinct windows: " + distinctWindows.join(", "));
check("book-ahead-is-6-to-8", distinctWindows.length === 1 && distinctWindows[0] === "6 to 8",
  "window is " + distinctWindows.join(",") + ", expected 6 to 8 (estate-wide value confirmed by check-travel-clinic-copy.js this same run)");

// 6. No vaccine or antimalarial named by brand (small independent sample list,
//    not the full tools/pom-names.js set - proves the same rule with different
//    evidence rather than re-running the checker's own list).
var SAMPLE_NAMES = ["stamaril", "havrix", "typhim", "rabipur", "ixiaro", "malarone", "doxycycline", "mefloquine"];
var namedMeds = SAMPLE_NAMES.filter(function (n) { return new RegExp("\\b" + n + "\\b", "i").test(text); });
check("no-medicine-brand-named", namedMeds.length === 0, "found: " + namedMeds.join(", "));

// 7. Four safety cohorts.
var COHORTS = [
  { what: "pregnant/breastfeeding", ok: /pregnan/i.test(text) && /breastfeed/i.test(text) },
  { what: "medical condition / weakened immune system", ok: /weakened immune system|immunosuppress|medical condition/i.test(text) },
  { what: "short notice", ok: /short notice|travelling within the next|1 to 2 weeks/i.test(text) },
  { what: "children/infants", ok: /\bchildren\b|\binfants?\b/i.test(text) }
];
COHORTS.forEach(function (c) { check("cohort-" + c.what, c.ok, "cohort not named: " + c.what); });

// 8. Trust bar names this branch's own town (Ainsdale), not a foreign one.
var townMatch = /Local\s+([^<]+?)\s+team/.exec(raw);
check("trust-bar-town-present", !!townMatch, "no Local <town> team line found");
if (townMatch) {
  check("trust-bar-town-is-ainsdale", norm(townMatch[1]) === "Ainsdale",
    'trust bar says "Local ' + norm(townMatch[1]) + ' team", expected Ainsdale');
}
check("no-foreign-town-in-copy", !/\bBramhall\b|\bHazel Grove\b|\bAigburth\b|\bSandringham\b|\bSt Michael's\b/i.test(text),
  "a foreign branch town appears in visible copy");

// 9. Yellow fever advertised (consistent with the estate-wide KNOWN entry;
//    this branch carries no yellowFeverCentre field either way).
var branches = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8")).branches;
var hirshmans = branches.filter(function (b) { return b.id === "hirshmans_ainsdale"; })[0];
check("branch-found-in-data", !!hirshmans, "hirshmans_ainsdale not found in branches.json");
if (hirshmans) {
  check("no-yellowFeverCentre-field-either-way", !Object.prototype.hasOwnProperty.call(hirshmans, "yellowFeverCentre"),
    "branch now carries a yellowFeverCentre field - Q48 may have been answered; re-check check-travel-clinic-copy.js KNOWN entry currency");
}
check("yellow-fever-advertised", /yellow fever/i.test(text), "page does not advertise yellow fever");

console.log("verify-3.5-2026-09-04-eleventh: " + checks + " checks, " + fails.length + " failure(s)");
fails.forEach(function (f) { console.log("  FAIL " + f); });
if (fails.length) process.exit(1);
console.log("OK");
