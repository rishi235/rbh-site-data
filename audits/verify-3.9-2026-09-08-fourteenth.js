/*
  verify-3.9-2026-09-08-fourteenth.js

  Item 3.9 quality pass (fourteenth), Coleman and Leighs Pharmacy (Liverpool,
  seoTown Walton). Thirteen prior passes on this item never ran
  tools/check-branch-links.js against this branch's own branches.json record
  (confirmed by grepping the item's full AGENT_WORKLIST.md section before
  writing this script - zero mentions of "check-branch-links" in thirteen
  passes, the only checker among the 36 with a clear, well-defined rule set
  never exercised here). check-branch-links.js is the checker that reads the
  link fields (odsCode, nhsEmail, nhsReviewUrl, googleReviewUrl, website,
  pfLink) directly out of branches.json, before they ever reach a page or a
  pack, so this closes a real gap in this item's own coverage history.

  Discipline matches the established pattern for this class of test (used
  today on items 3.2 and 3.13 against other branches): mutate the REAL
  branches.json in place, one field at a time, run the REAL checker
  (tools/check-branch-links.js) as a child process against it, capture its
  output, then restore branches.json from an in-memory buffer captured
  BEFORE the first mutation, sha256-verify the restore, and confirm
  `git status --porcelain -- branches.json` is empty before the next
  mutation. Refuses to run at all if branches.json already carries a git
  diff at start.
*/
"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var cp = require("child_process");

var ROOT = path.join(__dirname, "..");
var DATA_PATH = path.join(ROOT, "branches.json");
var CHECKER = path.join(ROOT, "tools", "check-branch-links.js");
var BRANCH_ID = "colemanleigh_liverpool";

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function gitDiffEmpty() {
  var out = cp.execSync(
    'git status --porcelain -- branches.json',
    { cwd: ROOT }
  ).toString();
  return out.trim() === "";
}

function runChecker() {
  var res = cp.spawnSync(process.execPath, [CHECKER], { cwd: ROOT, encoding: "utf8" });
  return { code: res.status, out: (res.stdout || "") + (res.stderr || "") };
}

// ---- pre-flight -------------------------------------------------------
if (!gitDiffEmpty()) {
  console.error("REFUSING TO RUN: branches.json already carries a git diff. Fix that first.");
  process.exit(2);
}

var original = fs.readFileSync(DATA_PATH);
var originalHash = sha256(original);
console.log("Baseline branches.json sha256: " + originalHash);

var baseline = runChecker();
console.log("Baseline check-branch-links.js: exit " + baseline.code);
console.log(baseline.out.split("\n").slice(0, 3).join("\n"));
if (baseline.code !== 0) {
  console.error("REFUSING TO RUN: checker is not clean on the unmodified tree.");
  process.exit(2);
}

var results = [];

function mutateAndRun(label, mutateFn) {
  var data = JSON.parse(original.toString("utf8"));
  var b = data.branches.find(function (x) { return x.id === BRANCH_ID; });
  if (!b) throw new Error("Branch " + BRANCH_ID + " not found in branches.json");
  var before = JSON.stringify(b);
  mutateFn(data, b);
  var after = JSON.stringify(data.branches.find(function (x) { return x.id === BRANCH_ID; }));
  if (before === after) {
    throw new Error(label + ": mutator made no change - refusing to report a false pass.");
  }
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");
  var res = runChecker();
  // restore immediately, before any assertion
  fs.writeFileSync(DATA_PATH, original);
  var restoredHash = sha256(fs.readFileSync(DATA_PATH));
  var restoredOk = restoredHash === originalHash && gitDiffEmpty();
  var caught = res.code !== 0 && res.out.indexOf(BRANCH_ID) !== -1;
  results.push({
    label: label,
    exitCode: res.code,
    caught: caught,
    restoredOk: restoredOk,
    snippet: res.out.split("\n").filter(function (l) { return l.indexOf(BRANCH_ID) !== -1; }).join(" | ")
  });
  if (!restoredOk) {
    console.error("RESTORE FAILED after " + label + " - stopping immediately.");
    process.exit(3);
  }
}

// 1. odsCode duplicate - copy Fishlocks Ainsdale's ODS code onto this branch
var otherOds = JSON.parse(original.toString("utf8")).branches
  .find(function (x) { return x.id === "fishlocks_ainsdale"; }).odsCode;
mutateAndRun("RULE ODSCODE (duplicate odsCode)", function (data, b) {
  b.odsCode = otherOds;
});

// 2. nhsEmail mismatch (odsCode left correct, email diverges from it)
mutateAndRun("RULE NHSEMAIL (mismatched pharmacy.<odsCode>@nhs.net)", function (data, b) {
  b.nhsEmail = "pharmacy.WRONG99@nhs.net";
});

// 3. nhsReviewUrl truncated to the profile page, short of /leave-a-review
mutateAndRun("RULE NHSREVIEW (truncated before /leave-a-review)", function (data, b) {
  b.nhsReviewUrl = "https://www.nhs.uk/services/pharmacy/coleman-and-leighs-pharmacy/X" + b.odsCode;
});

// 4. googleReviewUrl malformed shape
mutateAndRun("RULE GOOGLESHAPE (malformed g.page URL)", function (data, b) {
  b.googleReviewUrl = "https://g.page/CVRiXrQr74lLEAE";
});

// 5. googleReviewUrl duplicate of another branch's
var otherGoogle = JSON.parse(original.toString("utf8")).branches
  .find(function (x) { return x.id === "fishlocks_ainsdale"; }).googleReviewUrl;
mutateAndRun("RULE GOOGLEDUP (shared with Fishlocks Ainsdale)", function (data, b) {
  b.googleReviewUrl = otherGoogle;
});

// 6. website carries a trailing slash (not a bare host)
mutateAndRun("RULE WEBSITE (trailing slash)", function (data, b) {
  b.website = b.website + "/";
});

// 7. pfLink off-host - pointed at a different branch's own website
mutateAndRun("RULE PFHOST (pfLink off this branch's own host)", function (data, b) {
  b.pfLink = "https://www.fishlockpharmacy.co.uk/pharmacy-first-fishlocks-ainsdale.html";
});

// 8. pfLink not ending .html
mutateAndRun("RULE PFHTML (pfLink missing .html)", function (data, b) {
  b.pfLink = b.website + "/pharmacy-first-coleman-leigh-walton";
});

// 9. pfLink ownership - resolves to a real page belonging to a DIFFERENT
//    branch that shares no host with this one (cross-host case, the "else"
//    branch of the ownership message, never exercised for this branch before)
mutateAndRun("RULE PFOWNER (pfLink resolves to a cross-host sister page)", function (data, b) {
  b.pfLink = b.website + "/pharmacy-first-fishlocks-ainsdale.html";
});

console.log("\n=== RESULTS ===");
var allCaught = true;
results.forEach(function (r) {
  console.log((r.caught ? "CAUGHT " : "MISSED ") + r.label + " (exit " + r.exitCode + ", restored " + (r.restoredOk ? "ok" : "FAILED") + ")");
  if (r.snippet) console.log("    " + r.snippet);
  if (!r.caught) allCaught = false;
});

// final confirmation
var finalHash = sha256(fs.readFileSync(DATA_PATH));
console.log("\nFinal branches.json sha256: " + finalHash + (finalHash === originalHash ? " (matches baseline)" : " (MISMATCH)"));
console.log("Final git diff empty: " + gitDiffEmpty());
var finalRun = runChecker();
console.log("Final check-branch-links.js re-run: exit " + finalRun.code);

process.exit(allCaught && finalHash === originalHash && finalRun.code === 0 ? 0 : 1);
