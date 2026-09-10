/*
  audits/verify-3.9-2026-09-10-fifteenth.js

  Item 3.9 (Coleman and Leighs Pharmacy, Walton), fifteenth quality pass.

  Target: tools/check-seo-lengths.js, never proven by injection against this
  branch's own paste-sheet entries or pages in fourteen prior passes (grepped
  the item's full AGENT_WORKLIST.md section for every one of the 36
  tools/check-*.js filenames before starting; check-seo-lengths.js had zero
  mentions). This is a well-chosen gap: Coleman and Leighs is one of the four
  town pairs CLAUDE.md names by name for this exact checker (Walton, alongside
  Cherry Lane Pharmacy), so its rule 3 (title/description/permalink
  uniqueness) and rule 4c (cross-host H1 sharing, reported against Q44) both
  have live, real exposure through this specific branch today.

  Method: shells out to the real checker as a child process (no import from
  tools/), mutates tracked files in place, sha256-verifies the exact original
  content before the first mutation, restores from an in-memory buffer after
  every single injection, and re-verifies the restore byte-for-byte before
  moving to the next one. Never runs two injections at once.
*/
"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var { execFileSync } = require("child_process");

var ROOT = "/sessions/confident-cool-fermi/mnt/rbh-site-data";
var CHECKER = path.join(ROOT, "tools", "check-seo-lengths.js");

var SEO_MD = path.join(ROOT, "modules", "service", "pages", "SEO.md");
var INSECT_BITE = path.join(ROOT, "modules", "service", "pages", "insect-bite-treatment-coleman-leigh-walton.html");
var IMPETIGO = path.join(ROOT, "modules", "service", "pages", "impetigo-treatment-coleman-leigh-walton.html");
var SHINGLES = path.join(ROOT, "modules", "service", "pages", "shingles-treatment-coleman-leigh-walton.html");

var TARGET_FILES = [SEO_MD, INSECT_BITE, IMPETIGO, SHINGLES];

function sha(p) { return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); }
function read(p) { return fs.readFileSync(p, "utf8"); }
function write(p, s) { fs.writeFileSync(p, s, "utf8"); }

function gitStatusClean(files) {
  var rel = files.map(function (f) { return path.relative(ROOT, f); });
  var out;
  try {
    out = execFileSync("git", ["status", "--porcelain", "--"].concat(rel), { cwd: ROOT, encoding: "utf8" });
  } catch (e) {
    out = (e.stdout || "") + (e.stderr || "");
  }
  return out.trim();
}

function runChecker() {
  try {
    var out = execFileSync("node", [CHECKER], { cwd: ROOT, encoding: "utf8" });
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function run36() {
  var dir = path.join(ROOT, "tools");
  var files = fs.readdirSync(dir).filter(function (f) { return /^check-.*\.js$/.test(f); });
  var fails = [];
  files.forEach(function (f) {
    try {
      execFileSync("node", [path.join(dir, f)], { cwd: ROOT, encoding: "utf8" });
    } catch (e) {
      fails.push(f);
    }
  });
  return { total: files.length, fails: fails };
}

var log = [];
function say(s) { log.push(s); console.log(s); }

say("=== PRE-FLIGHT ===");
var preStatus = gitStatusClean(TARGET_FILES);
if (preStatus) {
  say("REFUSING TO RUN: target files already carry an uncommitted diff:\n" + preStatus);
  process.exit(2);
}
say("git status clean on all 4 target files - confirmed.");

var backups = {};
TARGET_FILES.forEach(function (f) { backups[f] = read(f); });
var baselineSha = {};
TARGET_FILES.forEach(function (f) { baselineSha[f] = sha(f); });
say("sha256 baseline recorded for all 4 target files.");

var baseline = runChecker();
say("Baseline run: exit " + baseline.code + " (expect 0)");
if (baseline.code !== 0) { say("ABORT: checker not clean before any mutation.\n" + baseline.out); process.exit(2); }
var baselineWarnCount = (baseline.out.match(/warning\(s\)/) || [])[0];
say("Baseline warning line: " + (baseline.out.split("\n").filter(function(l){return /warning\(s\)/.test(l);})[0]));

function restore(f) {
  write(f, backups[f]);
  var s = sha(f);
  if (s !== baselineSha[f]) throw new Error("RESTORE FAILED for " + f + ", sha mismatch");
}
function restoreAll() { TARGET_FILES.forEach(restore); }

var results = [];
function injection(name, mutateFn, expectFail, expectSubstr) {
  say("\n=== INJECTION: " + name + " ===");
  mutateFn();
  var r = runChecker();
  var pass;
  if (expectFail) {
    pass = r.code === 1 && expectSubstr.every(function (s) { return r.out.indexOf(s) !== -1; });
  } else {
    pass = r.code === 0;
  }
  say((pass ? "CAUGHT (as expected)" : "*** NOT CAUGHT - GAP ***") + " exit=" + r.code);
  if (!pass) say("OUTPUT:\n" + r.out);
  else {
    var matchLines = r.out.split("\n").filter(function (l) {
      return expectSubstr.some(function (s) { return l.indexOf(s) !== -1; }) || /FAIL/.test(l);
    });
    say("Relevant output line(s):\n" + matchLines.join("\n"));
  }
  restoreAll();
  var afterSha = TARGET_FILES.map(sha).join(",");
  var expectedSha = TARGET_FILES.map(function (f) { return baselineSha[f]; }).join(",");
  var restoredOk = afterSha === expectedSha;
  say("Restore sha256-confirmed: " + restoredOk);
  results.push({ name: name, caught: pass, restored: restoredOk });
}

// ---------------------------------------------------------------------------
// INJECTION A - Rule 1: title over 65 characters.
// ---------------------------------------------------------------------------
injection(
  "Rule 1, title too long (Coleman and Leighs Pharmacy First overview)",
  function () {
    var s = read(SEO_MD);
    var oldLine = "- **Page Title:** Pharmacy First at Coleman and Leighs Pharmacy, Walton";
    var newLine = "- **Page Title:** Pharmacy First at Coleman and Leighs Pharmacy, Walton, Liverpool, Merseyside";
    if (s.indexOf(oldLine) === -1) throw new Error("target line not found");
    write(SEO_MD, s.replace(oldLine, newLine));
  },
  true,
  ["pharmacy-first-coleman-leigh-walton", "over the 65 limit"]
);

// ---------------------------------------------------------------------------
// INJECTION B - Rule 2: description under 80 characters.
// ---------------------------------------------------------------------------
injection(
  "Rule 2, description too short (Coleman and Leighs UTI page)",
  function () {
    var s = read(SEO_MD);
    var oldLine = "- **Page Description:** UTI treatment at Coleman and Leighs Pharmacy in Walton. Free NHS Pharmacy First service, be assessed by a pharmacist with no GP appointment needed.";
    var newLine = "- **Page Description:** UTI treatment, no appointment needed.";
    if (s.indexOf(oldLine) === -1) throw new Error("target line not found");
    write(SEO_MD, s.replace(oldLine, newLine));
  },
  true,
  ["uti-treatment-coleman-leigh-walton", "under the 80 minimum"]
);

// ---------------------------------------------------------------------------
// INJECTION C - Rule 2: description over 165 characters.
// ---------------------------------------------------------------------------
injection(
  "Rule 2, description too long (Coleman and Leighs sore throat page)",
  function () {
    var s = read(SEO_MD);
    var oldLine = "- **Page Description:** Sore throat treatment at Coleman and Leighs Pharmacy in Walton. Free NHS Pharmacy First service, be assessed by a pharmacist with no GP appointment needed.";
    var newLine = "- **Page Description:** Sore throat treatment at Coleman and Leighs Pharmacy in Walton. Free NHS Pharmacy First service, be assessed by a pharmacist with no GP appointment needed at all, any day of the week, including bank holidays and weekends, walk in.";
    if (s.indexOf(oldLine) === -1) throw new Error("target line not found");
    write(SEO_MD, s.replace(oldLine, newLine));
  },
  true,
  ["sore-throat-treatment-coleman-leigh-walton", "over the 165 limit"]
);

// ---------------------------------------------------------------------------
// INJECTION D - Rule 3: duplicate title (two of the branch's own pages).
// ---------------------------------------------------------------------------
injection(
  "Rule 3, duplicate title (sinusitis title copied onto earache)",
  function () {
    var s = read(SEO_MD);
    var oldLine = "- **Page Title:** Earache treatment in Walton - Coleman and Leighs Pharmacy";
    var newLine = "- **Page Title:** Sinusitis treatment in Walton - Coleman and Leighs Pharmacy";
    if (s.indexOf(oldLine) === -1) throw new Error("target line not found");
    write(SEO_MD, s.replace(oldLine, newLine));
  },
  true,
  ["duplicate title", "earache-treatment-coleman-leigh-walton", "sinusitis-treatment-coleman-leigh-walton"]
);

// ---------------------------------------------------------------------------
// INJECTION E - Rule 3: duplicate permalink (earache permalink copied onto impetigo).
// ---------------------------------------------------------------------------
injection(
  "Rule 3, duplicate permalink (earache permalink copied onto impetigo's sheet entry)",
  function () {
    var s = read(SEO_MD);
    var oldLine = "- **Page Permalink:** impetigo-treatment-coleman-leigh-walton";
    var newLine = "- **Page Permalink:** earache-treatment-coleman-leigh-walton";
    if (s.indexOf(oldLine) === -1) throw new Error("target line not found");
    write(SEO_MD, s.replace(oldLine, newLine));
  },
  true,
  ["duplicate permalink", "earache-treatment-coleman-leigh-walton"]
);

// ---------------------------------------------------------------------------
// INJECTION F - Rule 4a: one branch, same H1 on two of its own pages.
// ---------------------------------------------------------------------------
injection(
  "Rule 4a, same branch repeats an H1 on two of its own pages (impetigo H1 copied onto insect-bite's page)",
  function () {
    var s = read(INSECT_BITE);
    var oldH1 = "<h1>Infected insect bite treatment in Walton</h1>";
    var newH1 = "<h1>Impetigo treatment in Walton</h1>";
    if (s.indexOf(oldH1) === -1) throw new Error("target H1 not found");
    write(INSECT_BITE, s.replace(oldH1, newH1));
  },
  true,
  ["one branch uses the same H1 on two of its own pages", "colemanleigh_liverpool"]
);

// ---------------------------------------------------------------------------
// INJECTION G - Rule 4c negative control: de-duplicate the shingles H1 from
// Cherry Lane's matching H1 and confirm the specific Q44 warning DISAPPEARS,
// proving the warning is computed live from current file content rather than
// a static list - then restore and confirm it reappears.
// ---------------------------------------------------------------------------
say("\n=== INJECTION: Rule 4c negative control (de-duplicate shingles H1 from Cherry Lane's) ===");
(function () {
  var before = runChecker();
  var warnLineBefore = "H1 shared across pharmacies on different hosts (Q44) - shingles-treatment-cherry-lane-walton.html and shingles-treatment-coleman-leigh-walton.html";
  var hadWarnBefore = before.out.indexOf(warnLineBefore) !== -1;
  say("Warning present before mutation: " + hadWarnBefore + " (expect true)");

  var s = read(SHINGLES);
  var oldH1 = "<h1>Shingles treatment in Walton</h1>";
  var newH1 = "<h1>Shingles treatment in Walton at Coleman and Leighs</h1>";
  if (s.indexOf(oldH1) === -1) throw new Error("target H1 not found");
  write(SHINGLES, s.replace(oldH1, newH1));

  var after = runChecker();
  var hasWarnAfter = after.out.indexOf(warnLineBefore) !== -1;
  say("Checker exit after de-dup mutation: " + after.code + " (expect 0, still clean - rule 4c only warns)");
  say("Specific Q44 warning still present after de-dup: " + hasWarnAfter + " (expect false)");

  restoreAll();
  var restoredCheck = runChecker();
  var warnLineRestored = restoredCheck.out.indexOf(warnLineBefore) !== -1;
  say("Warning reappears after restore: " + warnLineRestored + " (expect true)");

  var ok = hadWarnBefore && after.code === 0 && !hasWarnAfter && warnLineRestored;
  results.push({ name: "Rule 4c negative control", caught: ok, restored: TARGET_FILES.every(function (f) { return sha(f) === baselineSha[f]; }) });
  say(ok ? "CONFIRMED: rule 4c warning is computed live, not a static list." : "*** UNEXPECTED RESULT ***");
})();

// ---------------------------------------------------------------------------
// Final verification.
// ---------------------------------------------------------------------------
say("\n=== FINAL VERIFICATION ===");
var finalRun = runChecker();
say("Final check-seo-lengths.js run: exit " + finalRun.code + " (expect 0)");
var finalShaOk = TARGET_FILES.every(function (f) { return sha(f) === baselineSha[f]; });
say("All 4 target files sha256-identical to baseline: " + finalShaOk);
var finalStatus = gitStatusClean(TARGET_FILES);
say("git status --porcelain on target files after run: " + (finalStatus ? "NOT CLEAN:\n" + finalStatus : "clean"));

say("\n=== FULL SUITE ===");
var suite = run36();
say(suite.total + " checkers run individually, " + suite.fails.length + " failed" +
  (suite.fails.length ? ": " + suite.fails.join(", ") : "") + " (expect 0 failed).");

say("\n=== SUMMARY ===");
results.forEach(function (r) {
  say("  " + (r.caught ? "PASS" : "FAIL") + " / restore " + (r.restored ? "ok" : "BAD") + "  " + r.name);
});
var allOk = results.every(function (r) { return r.caught && r.restored; }) && finalRun.code === 0 && finalShaOk && !finalStatus && suite.fails.length === 0;
say("\nOVERALL: " + (allOk ? "ALL INJECTIONS CAUGHT, ALL RESTORES CONFIRMED, FULL SUITE CLEAN." : "*** SOMETHING FAILED - SEE ABOVE ***"));
process.exit(allOk ? 0 : 1);
