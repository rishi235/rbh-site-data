/*
  Item 2.1 quality pass, seventeenth pass, 2026-09-11.

  FRESH ANGLE: tools/check-seo-lengths.js had never been named once across
  sixteen prior passes on this item, despite Fishlocks Ainsdale being one of
  the three shared-domain branch pairs (with Fishlocks Eccleston, on
  fishlockpharmacy.co.uk) that CLAUDE.md names as the exact shape rule 4 of
  this checker exists to protect, and despite the checker's own docstring
  using Ainsdale's shingles-treatment page as its worked example of a
  deliberately brand-free family A H1.

  This script proves, by injection, that check-seo-lengths.js actually
  catches four different faults on Fishlocks Ainsdale's own copy, not just
  that the checker happens to pass today:

    1. RULE 1 (title length)   - a Page Title pushed past 65 characters
    2. RULE 2 (desc length)    - a Page Description pushed under 80 characters
    3. RULE 3 (uniqueness)     - a Page Permalink duplicated onto another
                                 page (Fishlocks Ainsdale onto Fishlocks
                                 Eccleston, the shared-domain sister)
    4. RULE 4a (H1, same branch) - one branch's H1 copied onto a second page
                                 of its own

  Then a CONTROL injection (a harmless heading reorder, values unchanged)
  confirms the checker does not fire on something that should pass.

  Method, matching every prior pass on this item: operates ONLY on the
  scratch copy at SCRATCH below (a tar --exclude='.git' copy of the tracked
  repo taken before this script ran). The tracked repo at ROOT is opened
  for reading only, never for writing, and is reconfirmed unchanged by
  git status/sha256 after this script exits. Each injection captures the
  original file's exact bytes and sha256 before mutating, runs the checker,
  restores the original bytes via fs.writeFileSync immediately after
  capturing the checker's output and before any assertion, and
  sha256-reconfirms byte-identical restoration before the next injection
  and again at the end. Refuses to run if the scratch copy is missing.
*/
"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var cp = require("child_process");

var SCRATCH = "/sessions/gifted-busy-albattani/mnt/outputs/scratch-21";
var SHEET = path.join(SCRATCH, "modules", "service", "pages", "SEO.md");
var EARACHE = path.join(SCRATCH, "modules", "service", "pages", "earache-treatment-fishlocks-ainsdale.html");
var CHECKER = path.join(SCRATCH, "tools", "check-seo-lengths.js");

if (!fs.existsSync(SCRATCH)) {
  console.error("Scratch copy missing at " + SCRATCH + " - refusing to run.");
  process.exit(2);
}
[SHEET, EARACHE, CHECKER].forEach(function (p) {
  if (!fs.existsSync(p)) { console.error("Missing required file: " + p); process.exit(2); }
});

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }
function runChecker() {
  var r = cp.spawnSync(process.execPath, [CHECKER], { cwd: SCRATCH, encoding: "utf8" });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}

var sheetOriginal = fs.readFileSync(SHEET, "utf8");
var sheetOriginalSha = sha256(Buffer.from(sheetOriginal, "utf8"));
var earacheOriginal = fs.readFileSync(EARACHE, "utf8");
var earacheOriginalSha = sha256(Buffer.from(earacheOriginal, "utf8"));

console.log("Baseline sheet sha256:   " + sheetOriginalSha);
console.log("Baseline earache sha256: " + earacheOriginalSha);

var baseline = runChecker();
console.log("Baseline run exit code: " + baseline.code + " (expect 0)");
if (baseline.code !== 0) {
  console.error("Baseline is not clean - aborting rather than testing against a dirty baseline.");
  console.error(baseline.out);
  process.exit(2);
}

function restoreSheet() {
  fs.writeFileSync(SHEET, sheetOriginal, "utf8");
  var now = sha256(fs.readFileSync(SHEET));
  if (now !== sheetOriginalSha) {
    console.error("RESTORE FAILED for SEO.md - sha256 mismatch after restore.");
    process.exit(2);
  }
}
function restoreEarache() {
  fs.writeFileSync(EARACHE, earacheOriginal, "utf8");
  var now = sha256(fs.readFileSync(EARACHE));
  if (now !== earacheOriginalSha) {
    console.error("RESTORE FAILED for earache page - sha256 mismatch after restore.");
    process.exit(2);
  }
}

var results = [];

// ---------------------------------------------------------------------------
// INJECTION 1 - RULE 1: title pushed past 65 characters.
// UTI treatment title lengthened with an unmissable suffix.
// ---------------------------------------------------------------------------
(function () {
  var target = "- **Page Title:** UTI treatment in Ainsdale - Fishlocks Chemist";
  if (sheetOriginal.indexOf(target) === -1) { console.error("Injection 1: anchor line not found"); process.exit(2); }
  var replacement = "- **Page Title:** UTI treatment and cystitis treatment in Ainsdale near Southport - Fishlocks Chemist";
  var mutated = sheetOriginal.replace(target, replacement);
  fs.writeFileSync(SHEET, mutated, "utf8");
  var r = runChecker();
  var caught = r.code !== 0 && /uti-treatment-fishlocks-ainsdale.*title is \d+ characters, over the 65 limit/s.test(r.out);
  results.push({ n: 1, rule: "RULE 1 (title length)", caught: caught, code: r.code, snippet: extractFail(r.out, "uti-treatment-fishlocks-ainsdale") });
  restoreSheet();
})();

// ---------------------------------------------------------------------------
// INJECTION 2 - RULE 2: description pushed under 80 characters.
// Sore throat description drastically shortened.
// ---------------------------------------------------------------------------
(function () {
  var target = "- **Page Description:** Sore throat treatment at Fishlocks Chemist in Ainsdale. Free NHS Pharmacy First service, be assessed by a pharmacist with no GP appointment needed.";
  if (sheetOriginal.indexOf(target) === -1) { console.error("Injection 2: anchor line not found"); process.exit(2); }
  var replacement = "- **Page Description:** Sore throat treatment, Fishlocks Ainsdale.";
  var mutated = sheetOriginal.replace(target, replacement);
  fs.writeFileSync(SHEET, mutated, "utf8");
  var r = runChecker();
  var caught = r.code !== 0 && /sore-throat-treatment-fishlocks-ainsdale.*description is only \d+ characters, under the 80 minimum/s.test(r.out);
  results.push({ n: 2, rule: "RULE 2 (description length)", caught: caught, code: r.code, snippet: extractFail(r.out, "sore-throat-treatment-fishlocks-ainsdale") });
  restoreSheet();
})();

// ---------------------------------------------------------------------------
// INJECTION 3 - RULE 3: permalink duplicated onto the shared-domain sister.
// Fishlocks Ainsdale's sinusitis permalink copied onto Fishlocks Eccleston's
// own sinusitis entry - the exact shared-domain self-competition shape
// CLAUDE.md's "town rules" section and this checker's rule 3 both exist to
// catch, tested here for the first time on this specific pair via THIS rule
// (rule 4 tests the H1 for this pair; rule 3 tests the permalink, and had
// not been proven for Fishlocks specifically).
// ---------------------------------------------------------------------------
(function () {
  var target = "- **Page Permalink:** sinusitis-treatment-fishlocks-eccleston";
  if (sheetOriginal.indexOf(target) === -1) { console.error("Injection 3: anchor line not found"); process.exit(2); }
  var replacement = "- **Page Permalink:** sinusitis-treatment-fishlocks-ainsdale";
  var mutated = sheetOriginal.replace(target, replacement);
  fs.writeFileSync(SHEET, mutated, "utf8");
  var r = runChecker();
  var caught = r.code !== 0 && /duplicate permalink shared by 2 pages/.test(r.out) && /sinusitis-treatment-fishlocks-ainsdale/.test(r.out);
  results.push({ n: 3, rule: "RULE 3 (permalink uniqueness)", caught: caught, code: r.code, snippet: extractFail(r.out, "duplicate permalink") });
  restoreSheet();
})();

// ---------------------------------------------------------------------------
// INJECTION 4 - RULE 4a: one branch reusing its own H1 on a second page.
// Fishlocks Ainsdale's shingles H1 copied onto its own earache page.
// ---------------------------------------------------------------------------
(function () {
  var target = "<h1>Earache treatment for children in Ainsdale</h1>";
  if (earacheOriginal.indexOf(target) === -1) {
    console.error("Injection 4: exact <h1> anchor not found, dumping the H1 line actually present:");
    var m = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(earacheOriginal);
    console.error(m ? m[0] : "(no H1 found at all)");
    process.exit(2);
  }
  var replacement = "<h1>Shingles treatment in Ainsdale</h1>";
  var mutated = earacheOriginal.replace(target, replacement);
  fs.writeFileSync(EARACHE, mutated, "utf8");
  var r = runChecker();
  var caught = r.code !== 0 && /one branch uses the same H1 on two of its own pages/.test(r.out) &&
    /fishlocks_ainsdale/.test(r.out);
  results.push({ n: 4, rule: "RULE 4a (H1, same branch)", caught: caught, code: r.code, snippet: extractFail(r.out, "same H1 on two of its own pages") });
  restoreEarache();
})();

// ---------------------------------------------------------------------------
// CONTROL - harmless reorder within the sheet (swap two whole blank-line-
// separated entries, no values changed), must still pass clean.
// ---------------------------------------------------------------------------
(function () {
  var utiBlock = [
    "## Fishlocks Chemist — Ainsdale — UTI",
    "- **Page Title:** UTI treatment in Ainsdale - Fishlocks Chemist",
    "- **Page Permalink:** uti-treatment-fishlocks-ainsdale",
    "- **Page Description:** UTI treatment at Fishlocks Chemist in Ainsdale. Free NHS Pharmacy First service, be assessed by a pharmacist with no GP appointment needed.",
    "- **Meta Keywords:** UTI Ainsdale, UTI treatment Ainsdale, Pharmacy First Ainsdale, pharmacy Ainsdale, PR8"
  ].join("\n");
  var soreThroatBlock = [
    "## Fishlocks Chemist — Ainsdale — Sore throat",
    "- **Page Title:** Sore throat treatment in Ainsdale - Fishlocks Chemist",
    "- **Page Permalink:** sore-throat-treatment-fishlocks-ainsdale",
    "- **Page Description:** Sore throat treatment at Fishlocks Chemist in Ainsdale. Free NHS Pharmacy First service, be assessed by a pharmacist with no GP appointment needed.",
    "- **Meta Keywords:** Sore throat Ainsdale, Sore throat treatment Ainsdale, Pharmacy First Ainsdale, pharmacy Ainsdale, PR8"
  ].join("\n");
  if (sheetOriginal.indexOf(utiBlock) === -1 || sheetOriginal.indexOf(soreThroatBlock) === -1) {
    console.error("Control: one or both anchor blocks not found verbatim");
    process.exit(2);
  }
  // Swap the two blocks' positions - same content, different order.
  var mutated = sheetOriginal.replace(utiBlock, " PLACEHOLDER_UTI ")
    .replace(soreThroatBlock, utiBlock)
    .replace(" PLACEHOLDER_UTI ", soreThroatBlock);
  fs.writeFileSync(SHEET, mutated, "utf8");
  var r = runChecker();
  var passed = r.code === 0;
  results.push({ n: 5, rule: "CONTROL (harmless reorder)", caught: passed, code: r.code, snippet: passed ? "(clean, as expected)" : extractFail(r.out, "") });
  restoreSheet();
})();

function extractFail(out, needle) {
  var lines = out.split("\n");
  var hit = lines.filter(function (l) { return needle ? l.indexOf(needle) !== -1 : /FAIL|WARN/.test(l); });
  return hit.slice(0, 3).join(" | ");
}

// Final restore re-confirmation.
var finalSheetSha = sha256(fs.readFileSync(SHEET));
var finalEaracheSha = sha256(fs.readFileSync(EARACHE));
console.log("\nFinal sheet sha256 matches baseline: " + (finalSheetSha === sheetOriginalSha));
console.log("Final earache sha256 matches baseline: " + (finalEaracheSha === earacheOriginalSha));

console.log("\nRESULTS");
results.forEach(function (r) {
  console.log("  [" + r.n + "] " + r.rule + " -> " + (r.caught ? "CAUGHT/PASSED as expected" : "*** NOT AS EXPECTED ***") +
    " (exit " + r.code + ")\n      " + r.snippet);
});

var allGood = results.every(function (r) { return r.caught; }) &&
  finalSheetSha === sheetOriginalSha && finalEaracheSha === earacheOriginalSha;

console.log("\nOVERALL: " + (allGood ? "all injections behaved as expected, restoration verified byte-identical." : "SOMETHING DID NOT MATCH EXPECTATIONS - see above."));
process.exit(allGood ? 0 : 1);
