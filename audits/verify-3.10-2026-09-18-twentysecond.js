"use strict";
/*
  item 3.10 (Riddings Pharmacy, Timperley) - twenty-second quality pass, run 112, 2026-09-18.

  Picks up the candidate list the twenty-first pass (2026-09-17) left behind:
  fifteen checkers never proven by injection against Riddings. This pass proves
  four of them - check-address-region.js, check-seo-sheets.js,
  check-whatsapp-route.js, check-widget-diaries.js - each with a single
  surgical injection specific to this branch, a full-suite re-run to see the
  true blast radius, then an exact restore proven by sha256.

  Run: node audits/verify-3.10-2026-09-18-twentysecond.js
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const CHECKERS_DIR = path.join(ROOT, "tools");

function sha(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}
function read(p) { return fs.readFileSync(p, "utf8"); }
function write(p, s) { fs.writeFileSync(p, s, "utf8"); }

function runChecker(name) {
  try {
    const out = execFileSync("node", [path.join(CHECKERS_DIR, name)], { cwd: ROOT, encoding: "utf8" });
    return { name, exit: 0, out };
  } catch (e) {
    return { name, exit: e.status === undefined ? 1 : e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function runFullSuite() {
  const files = fs.readdirSync(CHECKERS_DIR)
    .filter(f => /^check-.*\.js$/.test(f) && f !== "check-live-hours.js")
    .sort();
  return files.map(runChecker);
}

const log = [];
function say(s) { log.push(s); console.log(s); }

// ---------------------------------------------------------------------------
say("=== BASELINE ===");
const baseline = runFullSuite();
const baselineFails = baseline.filter(r => r.exit !== 0);
say("checkers run: " + baseline.length + ", failing: " + baselineFails.length);
baselineFails.forEach(r => say("  UNEXPECTED BASELINE FAIL: " + r.name));

const BRANCHES = path.join(ROOT, "branches.json");
const SEO_SHEET = path.join(ROOT, "modules", "service", "pages", "SEO.md");
const WA_PAGE = path.join(ROOT, "modules", "service", "pages", "uti-treatment-riddings-timperley.html");

const origBranches = read(BRANCHES);
const origSeoSheet = read(SEO_SHEET);
const origWaPage = read(WA_PAGE);
const shaBranches0 = sha(BRANCHES);
const shaSeoSheet0 = sha(SEO_SHEET);
const shaWaPage0 = sha(WA_PAGE);

const results = {};

function restoreAll() {
  write(BRANCHES, origBranches);
  write(SEO_SHEET, origSeoSheet);
  write(WA_PAGE, origWaPage);
}

// ---------------------------------------------------------------------------
say("");
say("=== INJECTION 1: check-address-region.js, seoTownInList rule ===");
say("Remove 'Timperley' from riddings_timperley.serviceAreaList (data-only edit, no page regenerated).");
try {
  const b1 = JSON.parse(origBranches);
  const r1 = b1.branches.find(x => x.id === "riddings_timperley");
  say("  before: serviceAreaList = " + JSON.stringify(r1.serviceAreaList));
  r1.serviceAreaList = r1.serviceAreaList.filter(t => t !== "Timperley");
  say("  after:  serviceAreaList = " + JSON.stringify(r1.serviceAreaList));
  write(BRANCHES, JSON.stringify(b1, null, 2) + "\n");

  const targeted = runChecker("check-address-region.js");
  say("  check-address-region.js exit=" + targeted.exit);
  say(targeted.out.split("\n").map(l => "    " + l).join("\n"));

  const full1 = runFullSuite();
  const fails1 = full1.filter(r => r.exit !== 0);
  say("  full suite: " + full1.length + " run, " + fails1.length + " failing: " + fails1.map(r => r.name).join(", "));
  results.injection1 = { targetedExit: targeted.exit, fullFails: fails1.map(r => r.name) };
} finally {
  restoreAll();
}
say("  restored. sha256 branches.json matches baseline: " + (sha(BRANCHES) === shaBranches0));

// ---------------------------------------------------------------------------
say("");
say("=== CONTROL for injection 1: confirm clean after restore ===");
const control1 = runChecker("check-address-region.js");
say("  check-address-region.js exit=" + control1.exit + " (expect 0)");

// ---------------------------------------------------------------------------
say("");
say("=== INJECTION 2: check-seo-sheets.js, description drift ===");
say("Append one character to the Riddings Pharmacy First Page Description in modules/service/pages/SEO.md.");
try {
  if (!origSeoSheet.includes("pharmacy-first-riddings-timperley")) {
    throw new Error("could not find pharmacy-first-riddings-timperley block in SEO.md");
  }
  const idx = origSeoSheet.indexOf("pharmacy-first-riddings-timperley");
  const descIdx = origSeoSheet.indexOf("Page Description:", idx);
  const lineEnd = origSeoSheet.indexOf("\n", descIdx);
  const before = origSeoSheet.slice(0, lineEnd);
  const after = origSeoSheet.slice(lineEnd);
  if (!before.endsWith("needed.")) {
    say("  WARNING: description did not end as expected, aborting this injection safely");
  } else {
    const mutated = before + " Extra." + after;
    write(SEO_SHEET, mutated);
    say("  mutated Page Description line for pharmacy-first-riddings-timperley (appended ' Extra.')");

    const targeted2 = runChecker("check-seo-sheets.js");
    say("  check-seo-sheets.js exit=" + targeted2.exit);
    say(targeted2.out.split("\n").map(l => "    " + l).join("\n"));

    const full2 = runFullSuite();
    const fails2 = full2.filter(r => r.exit !== 0);
    say("  full suite: " + full2.length + " run, " + fails2.length + " failing: " + fails2.map(r => r.name).join(", "));
    results.injection2 = { targetedExit: targeted2.exit, fullFails: fails2.map(r => r.name) };
  }
} finally {
  restoreAll();
}
say("  restored. sha256 SEO.md matches baseline: " + (sha(SEO_SHEET) === shaSeoSheet0));

say("");
say("=== CONTROL for injection 2: confirm clean after restore ===");
const control2 = runChecker("check-seo-sheets.js");
say("  check-seo-sheets.js exit=" + control2.exit + " (expect 0)");

// ---------------------------------------------------------------------------
say("");
say("=== INJECTION 3: check-whatsapp-route.js, RULE 4 page agreement ===");
say("Change data-wa on uti-treatment-riddings-timperley.html to a different, still-valid E.164 UK mobile.");
try {
  const m = origWaPage.match(/data-wa="([^"]*)"/);
  if (!m) throw new Error("no data-wa attribute found on the UTI page");
  say("  before: data-wa=\"" + m[1] + "\"");
  const wrongNumber = "447521775699";
  const mutatedPage = origWaPage.replace(/data-wa="([^"]*)"/, 'data-wa="' + wrongNumber + '"');
  write(WA_PAGE, mutatedPage);
  say("  after:  data-wa=\"" + wrongNumber + "\"");

  const targeted3 = runChecker("check-whatsapp-route.js");
  say("  check-whatsapp-route.js exit=" + targeted3.exit);
  say(targeted3.out.split("\n").map(l => "    " + l).join("\n"));

  const full3 = runFullSuite();
  const fails3 = full3.filter(r => r.exit !== 0);
  say("  full suite: " + full3.length + " run, " + fails3.length + " failing: " + fails3.map(r => r.name).join(", "));
  results.injection3 = { targetedExit: targeted3.exit, fullFails: fails3.map(r => r.name) };
} finally {
  restoreAll();
}
say("  restored. sha256 UTI page matches baseline: " + (sha(WA_PAGE) === shaWaPage0));

say("");
say("=== CONTROL for injection 3: confirm clean after restore ===");
const control3 = runChecker("check-whatsapp-route.js");
say("  check-whatsapp-route.js exit=" + control3.exit + " (expect 0)");

// ---------------------------------------------------------------------------
say("");
say("=== INJECTION 4: check-widget-diaries.js, RULE 2 crossbrand ===");
say("Set riddings_timperley.widgets.pharmacyFirst to cherrylane_liverpool's own pharmacyFirst id.");
try {
  const b4 = JSON.parse(origBranches);
  const riddings = b4.branches.find(x => x.id === "riddings_timperley");
  const cherry = b4.branches.find(x => x.id === "cherrylane_liverpool");
  say("  before: riddings pharmacyFirst = " + riddings.widgets.pharmacyFirst);
  say("  cherry lane pharmacyFirst      = " + cherry.widgets.pharmacyFirst + " (different brand)");
  riddings.widgets.pharmacyFirst = cherry.widgets.pharmacyFirst;
  write(BRANCHES, JSON.stringify(b4, null, 2) + "\n");

  const targeted4 = runChecker("check-widget-diaries.js");
  say("  check-widget-diaries.js exit=" + targeted4.exit);
  say(targeted4.out.split("\n").map(l => "    " + l).join("\n"));

  const full4 = runFullSuite();
  const fails4 = full4.filter(r => r.exit !== 0);
  say("  full suite: " + full4.length + " run, " + fails4.length + " failing: " + fails4.map(r => r.name).join(", "));
  results.injection4 = { targetedExit: targeted4.exit, fullFails: fails4.map(r => r.name) };
} finally {
  restoreAll();
}
say("  restored. sha256 branches.json matches baseline: " + (sha(BRANCHES) === shaBranches0));

say("");
say("=== CONTROL for injection 4: confirm clean after restore ===");
const control4 = runChecker("check-widget-diaries.js");
say("  check-widget-diaries.js exit=" + control4.exit + " (expect 0)");

// ---------------------------------------------------------------------------
say("");
say("=== FINAL FULL SUITE, all files restored ===");
const finalSuite = runFullSuite();
const finalFails = finalSuite.filter(r => r.exit !== 0);
say("checkers run: " + finalSuite.length + ", failing: " + finalFails.length);
finalFails.forEach(r => say("  UNEXPECTED FINAL FAIL: " + r.name));

say("");
say("=== FINAL SHA256 CHECK ===");
say("branches.json : " + (sha(BRANCHES) === shaBranches0 ? "MATCH" : "MISMATCH"));
say("SEO.md        : " + (sha(SEO_SHEET) === shaSeoSheet0 ? "MATCH" : "MISMATCH"));
say("uti page      : " + (sha(WA_PAGE) === shaWaPage0 ? "MATCH" : "MISMATCH"));

say("");
say("=== SUMMARY ===");
say(JSON.stringify(results, null, 2));

fs.writeFileSync(path.join(ROOT, "audits", "riddings-item-3.10-quality-pass-2026-09-18-twentysecond-output.txt"), log.join("\n") + "\n", "utf8");
console.log("\nEvidence written to audits/riddings-item-3.10-quality-pass-2026-09-18-twentysecond-output.txt");
