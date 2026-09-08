/*
  verify-3.10-2026-09-09-fourteenth.js

  Item 3.10 quality pass (fourteenth), Riddings Pharmacy (Timperley).

  Thirteen prior passes on this item proved (by injection, against Riddings'
  own pages/data unless noted): check-nap, check-em-dashes,
  check-service-links (JS-injected copy), check-postcodes,
  check-branch-identity (5 applicable rules), check-booking-routes (twice),
  check-switch-copy, check-contraception-copy, check-travel-clinic-copy,
  check-jsonld (7 of 8 rules; rule 7 email/areaServed structurally
  inapplicable), check-seo-pattern, and check-map-embeds (rules 2-5;
  rule 1 generator-level re-derived; rule 6 directions structurally
  inapplicable since Riddings has no modules/branch/pages file).
  check-opening-hours was ruled structurally inapplicable (no branch landing
  page for this branch).

  A grep of this item's full fourteen-pass AGENT_WORKLIST.md section against
  all 36 tools/check-*.js filenames returned zero hits for
  tools/check-branch-links.js - never exercised against Riddings' own
  branches.json record. Riddings carries every field this checker reads
  (odsCode, nhsEmail, nhsReviewUrl, googleReviewUrl, website, pfLink; no
  sister branch, single host), so all six rule families apply. This closes
  the same class of gap the 3.9 fourteenth pass closed for Coleman and
  Leighs Pharmacy the day before, using the same instrument shape.

  DISCIPLINE: shells out to the real checker as a child process (no import
  from tools/), refuses to run if branches.json already carries a git diff,
  records the pre-mutation buffer and its sha256 once, mutates the branch's
  own record in memory, writes it, runs the checker, restores from the
  in-memory buffer immediately after capturing output and before any
  assertion, sha256-reconfirms and re-checks `git status --porcelain --
  branches.json` after every restore.
*/
"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var cp = require("child_process");

var ROOT = path.join(__dirname, "..");
var BRANCHES_PATH = path.join(ROOT, "branches.json");

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function gitDiffEmpty(relPath) {
  var out = cp.execSync("git status --porcelain -- " + relPath, { cwd: ROOT }).toString();
  return out.trim() === "";
}

function runChecker() {
  var res = cp.spawnSync("node", ["tools/check-branch-links.js"], { cwd: ROOT, encoding: "utf8" });
  return { code: res.status, out: (res.stdout || "") + (res.stderr || "") };
}

// ---- guard: refuse to run if branches.json already has a diff ------------
if (!gitDiffEmpty("branches.json")) {
  console.error("REFUSING TO RUN: branches.json already carries a git diff.");
  process.exit(2);
}

var originalBuf = fs.readFileSync(BRANCHES_PATH);
var originalSha = sha256(originalBuf);
var originalData = JSON.parse(originalBuf.toString("utf8"));
var origRiddings = originalData.branches.find(function (x) { return x.id === "riddings_timperley"; });
var origSmartts = originalData.branches.find(function (x) { return x.id === "smartts_bootle"; });
if (!origRiddings || !origSmartts) throw new Error("branch lookup failed at setup");

console.log("Baseline branches.json sha256: " + originalSha);
console.log("Riddings odsCode=" + origRiddings.odsCode + " Smartts odsCode=" + origSmartts.odsCode);

var results = [];
var caught = 0;
var total = 0;

function restore() {
  fs.writeFileSync(BRANCHES_PATH, originalBuf);
  var nowSha = sha256(fs.readFileSync(BRANCHES_PATH));
  if (nowSha !== originalSha) {
    throw new Error("RESTORE FAILED: sha256 mismatch after restore!");
  }
  if (!gitDiffEmpty("branches.json")) {
    throw new Error("RESTORE FAILED: git status --porcelain not empty after restore!");
  }
}

function inject(label, mutateFn, expectSubstring) {
  total++;
  var data = JSON.parse(originalBuf.toString("utf8"));
  var b = data.branches.find(function (x) { return x.id === "riddings_timperley"; });
  mutateFn(b, data);
  fs.writeFileSync(BRANCHES_PATH, JSON.stringify(data, null, 2) + "\n");
  var res = runChecker();
  var out = res.out;
  var pass = res.code !== 0 && out.indexOf(expectSubstring) !== -1;
  var snippet = out.split("\n").filter(function (l) { return l.indexOf("riddings_timperley") !== -1; }).join(" | ");
  results.push({ label: label, code: res.code, caughtExpected: pass, snippet: snippet });
  if (pass) caught++;
  // restore immediately, before any further assertion
  restore();
  return pass;
}

console.log("\n=== BASELINE (should be clean, exit 0) ===");
var baseline = runChecker();
console.log(baseline.out);
if (baseline.code !== 0) {
  throw new Error("Baseline check-branch-links.js is not clean before injection testing - aborting.");
}

console.log("\n=== INJECTIONS ===");

// 1. odsCode duplicate - swap to Smartts Chemist Bootle's real ODS code.
//    Also exercises the downstream nhsEmail/nhsReviewUrl mismatches this one
//    edit creates as a bonus, the same shape the 3.9 pass found on Coleman
//    and Leighs against Fishlocks Ainsdale's code.
inject("1. odsCode duplicate (swapped to Smartts Chemist's real ODS code " + origSmartts.odsCode + ")",
  function (b) { b.odsCode = origSmartts.odsCode; },
  "duplicate of");

// 2. nhsEmail wrong, odsCode left correct.
inject("2. nhsEmail rewritten to an unrelated address",
  function (b) { b.nhsEmail = "pharmacy.WRONG99@nhs.net"; },
  'expected "pharmacy.' + origRiddings.odsCode + '@nhs.net"');

// 3. nhsReviewUrl truncated to stop at the ODS code - the exact Gordon Short
//    Crosby historical defect this checker exists to catch.
inject("3. nhsReviewUrl truncated short of /leave-a-review",
  function (b) { b.nhsReviewUrl = "https://www.nhs.uk/services/pharmacy/riddings-pharmacy/X" + b.odsCode; },
  "Anything short of /leave-a-review");

// 4. googleReviewUrl malformed shape - missing "/r/" and "/review".
inject("4. googleReviewUrl malformed shape",
  function (b) { b.googleReviewUrl = "https://g.page/CRtdZliseNZGEAE"; },
  "expected https://g.page/r/<id>/review");

// 5. googleReviewUrl duplicate - set equal to a different real branch's link.
inject("5. googleReviewUrl duplicate (set equal to Smartts Chemist's real link)",
  function (b) { b.googleReviewUrl = origSmartts.googleReviewUrl; },
  "would land on the other's listing");

// 6. website carries a path segment (no trailing slash) - tests the "no
//    path" half of the website regex, distinct from the trailing-slash shape
//    an earlier pass used on a different branch. Also exercises the pfLink
//    host knock-on, since pfLink no longer starts with the modified
//    website + "/".
inject("6. website carries a path segment",
  function (b) { b.website = "https://www.riddingspharmacy.co.uk/shop"; },
  "Expected https, a bare host, no trailing slash and no path");

// 7. pfLink repointed at a different, real branch's own page entirely,
//    off-host (Smartts Chemist Bootle's own Pharmacy First page).
inject("7. pfLink repointed at Smartts Chemist's own page (cross-host)",
  function (b) { b.pfLink = origSmartts.pfLink; },
  "not on this branch's own site");

// 8. pfLink rewritten to drop the .html extension.
inject("8. pfLink dropped .html extension",
  function (b) { b.pfLink = b.pfLink.replace(/\.html$/, ""); },
  "does not end .html");

// 9. pfLink repointed at a real branch's page whose FILENAME resolves via
//    the brandSlug-townSlug suffix convention (Fishlocks Ainsdale's own
//    Pharmacy First page), unlike injection 7's target (Smartts' pfLink
//    uses the legacy "pharmacy-first-service-<town>" naming, which resolves
//    to no owner by design - Q8/5.3 - so injection 7 only fired the host
//    rule, not the ownership rule). This exercises the ownership rule's
//    "else" branch (cross-host, non-null owner) directly, the case
//    injection 7 alone did not reach.
(function () {
  var data = JSON.parse(originalBuf.toString("utf8"));
  var fishlocks = data.branches.find(function (x) { return x.id === "fishlocks_ainsdale"; });
  inject("9. pfLink repointed at Fishlocks Ainsdale's own resolvable page (cross-host ownership)",
    function (b) { b.pfLink = fishlocks.pfLink; },
    "a Pharmacy First page belonging to fishlocks_ainsdale");
})();

console.log("\n=== RESULTS ===");
results.forEach(function (r) {
  console.log((r.caughtExpected ? "CAUGHT " : "MISSED ") + r.label + " (exit " + r.code + ")");
  if (r.snippet) console.log("    " + r.snippet);
});
console.log("\n" + caught + " / " + total + " injections caught with the expected message.");

console.log("\n=== FINAL RESTORE CONFIRMATION ===");
var finalBuf = fs.readFileSync(BRANCHES_PATH);
var finalSha = sha256(finalBuf);
console.log("Final branches.json sha256: " + finalSha + (finalSha === originalSha ? " (MATCHES baseline)" : " (MISMATCH!)"));
console.log("git status --porcelain -- branches.json: " +
  (gitDiffEmpty("branches.json") ? "empty (clean)" : "NOT EMPTY"));

console.log("\n=== FINAL CHECKER RE-RUN (should be clean, exit 0) ===");
var finalRun = runChecker();
console.log(finalRun.out);
console.log("Final check-branch-links.js exit code: " + finalRun.code);

if (finalSha !== originalSha || !gitDiffEmpty("branches.json") || finalRun.code !== 0 || caught !== total) {
  console.error("\nFAILURE: one or more integrity checks did not pass.");
  process.exit(1);
}

console.log("\nAll " + total + " injections caught, branches.json restored byte-identical, final checker run clean.");
