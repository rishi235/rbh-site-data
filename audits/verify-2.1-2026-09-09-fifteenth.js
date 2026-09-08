/*
  verify-2.1-2026-09-09-fifteenth.js

  Fifteenth quality pass on worklist item 2.1 (Fishlocks Chemist Ainsdale).
  Fresh angle: across fourteen prior passes covering the switch page, travel
  clinic page, branch landing page, weight-loss-clinic page, contraception
  page, all seven Pharmacy First condition pages plus the overview, and
  check-app-membership.js, tools/check-booking-routes.js was never once
  named. That is the checker CLAUDE.md itself flags as guarding the single
  most silent fault class in the estate (an empty booking box, or a patient
  booked into the wrong branch's diary, while every visible line on the page
  still reads correctly), so it is the clear gap to close this pass.

  Targets four of check-booking-routes.js's five per-page rules, each against
  a real fishlocks_ainsdale page or its own branches.json record:
    RULE 1 route      - a copy of a real booking page under a filename that
                        does not parse under service.js's own routing regex.
    RULE 3 widget      - branches.json's own widgets.contraception removed
                        for fishlocks_ainsdale (contraception is in
                        NO_FALLBACK_SERVICE_KEYS per Q17, so it may not fall
                        back to the Pharmacy First diary).
    RULE 4 branchattr - data-branch on the travel clinic page swapped to a
                        different real, live branch's name.
    RULE 5 serviceattr - data-service removed from the UTI page.

  Discipline matches the established convention for this item (CLAUDE.md's
  "a test harness must restore by byte copy, not from git"): refuses to run
  if either target file already carries a git diff, captures original bytes
  before mutation, restores by direct fs.writeFileSync from the in-memory
  buffer immediately after capturing the checker's output and before any
  assertion, sha256-reconfirms byte-identical restoration before the next
  injection and again at the end. The route-rule injection only ever ADDS a
  new file (never overwrites), and that file is deleted, not restored.
*/
"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var cp = require("child_process");

var ROOT = "/sessions/exciting-clever-franklin/mnt/rbh-site-data";
var CHECKER = path.join(ROOT, "tools", "check-booking-routes.js");
var BRANCHES = path.join(ROOT, "branches.json");
var TRAVEL = path.join(ROOT, "modules", "service", "pages", "travel-clinic-fishlocks-ainsdale.html");
var UTI = path.join(ROOT, "modules", "service", "pages", "uti-treatment-fishlocks-ainsdale.html");
var STRAY_ROUTE_FILE = path.join(ROOT, "modules", "service", "pages", "notarealservice-fishlocks-ainsdale.html");

function sha(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function gitDiffEmpty(relPaths) {
  var out = cp.execSync("git status --porcelain -- " + relPaths.join(" "), { cwd: ROOT }).toString();
  return out.trim() === "";
}

function runChecker() {
  var res = cp.spawnSync("node", [CHECKER], { cwd: ROOT, encoding: "utf8" });
  return { status: res.status, out: (res.stdout || "") + (res.stderr || "") };
}

console.log("=== verify-2.1-2026-09-09-fifteenth ===\n");

// Guard: refuse if targets already dirty.
if (!gitDiffEmpty(["branches.json", "modules/service/pages/travel-clinic-fishlocks-ainsdale.html", "modules/service/pages/uti-treatment-fishlocks-ainsdale.html"])) {
  console.log("ABORT: one or more targets already carry a git diff. Not running.");
  process.exit(2);
}
if (fs.existsSync(STRAY_ROUTE_FILE)) {
  console.log("ABORT: stray route file already exists from a prior interrupted run. Not running.");
  process.exit(2);
}

var branchesOrig = fs.readFileSync(BRANCHES);
var travelOrig = fs.readFileSync(TRAVEL);
var utiOrig = fs.readFileSync(UTI);
var branchesOrigSha = sha(branchesOrig);
var travelOrigSha = sha(travelOrig);
var utiOrigSha = sha(utiOrig);

console.log("Original sha256:");
console.log("  branches.json                              " + branchesOrigSha);
console.log("  travel-clinic-fishlocks-ainsdale.html       " + travelOrigSha);
console.log("  uti-treatment-fishlocks-ainsdale.html       " + utiOrigSha);
console.log("");

// Baseline.
var baseline = runChecker();
console.log("BASELINE exit=" + baseline.status);
console.log(baseline.out.split("\n").slice(0, 6).join("\n"));
if (baseline.status !== 0) {
  console.log("ABORT: baseline is not clean. Not proceeding with injections.");
  process.exit(2);
}

var results = [];

function restoreAndVerify(file, orig, origSha, label) {
  fs.writeFileSync(file, orig);
  var nowSha = sha(fs.readFileSync(file));
  if (nowSha !== origSha) {
    console.log("!!! RESTORE MISMATCH on " + label + " - sha " + nowSha + " expected " + origSha);
    process.exit(3);
  }
}

// ---------------------------------------------------------------------------
// INJECTION 1 - RULE 1 (route): a booking-mount page whose filename does not
// parse under service.js's routing regex. Copies real content (so it is a
// realistic mount, not a synthetic one) into a filename service.js's regex
// cannot resolve, since "notarealservice" is not a service slug it declares.
// This file is NEW, not an overwrite, so restoration is deletion, not a
// byte-copy-back.
// ---------------------------------------------------------------------------
fs.writeFileSync(STRAY_ROUTE_FILE, travelOrig);
var r1 = runChecker();
var caught1 = r1.status !== 0 && r1.out.indexOf("notarealservice-fishlocks-ainsdale.html carries a booking mount but its filename does not parse") !== -1;
results.push({ n: 1, rule: "route", caught: caught1, detail: r1.out.split("\n").filter(function(l){return l.indexOf("FAIL")!==-1;}).join(" | ") });
console.log("INJECTION 1 (route): " + (caught1 ? "CAUGHT" : "NOT CAUGHT - " + r1.out));

// Cleanup: this FUSE mount refuses unlink on a file created moments earlier
// (the same standing quirk AGENT_LOG.md records for .git/index.lock and
// .git/HEAD.lock - "operation not permitted" on rm/unlink of a freshly
// created file, rename succeeds where delete does not, per Q87/Q96). Try
// unlink first; if it is refused, truncate to 0 bytes and rename to a .bak
// extension so the stray no longer matches any *.html glob any checker
// scans, note it for the log, and continue rather than crash the run.
var cleanedByDelete = false;
try { fs.unlinkSync(STRAY_ROUTE_FILE); cleanedByDelete = true; }
catch (e) {
  try {
    fs.writeFileSync(STRAY_ROUTE_FILE, "");
    var bakPath = STRAY_ROUTE_FILE + ".bak";
    fs.renameSync(STRAY_ROUTE_FILE, bakPath);
    console.log("  NOTE: unlink refused (EPERM) on this FUSE mount, same standing quirk as " +
      "Q87/Q96. Truncated to 0 bytes and renamed to " + path.basename(bakPath) +
      " so it matches no *.html glob any checker scans. Needs a manual `rm` on the " +
      "underlying Windows filesystem to fully clear; left out of git (never added).");
  } catch (e2) {
    console.log("!!! stray file could not be deleted, truncated or renamed: " + e2.message);
    process.exit(3);
  }
}
if (cleanedByDelete && fs.existsSync(STRAY_ROUTE_FILE)) { console.log("!!! stray file failed to delete"); process.exit(3); }

// Re-run clean to confirm no leftover state before next injection.
var post1 = runChecker();
if (post1.status !== 0) { console.log("!!! not clean after injection 1 cleanup"); process.exit(3); }

// ---------------------------------------------------------------------------
// INJECTION 2 - RULE 3 (widget): remove fishlocks_ainsdale's own
// widgets.contraception. Contraception is in NO_FALLBACK_SERVICE_KEYS (Q17,
// answered 2026-08-28), so with no widget of its own and no fallback
// permitted, the contraception page's booking mount should FAIL.
// ---------------------------------------------------------------------------
var branchesData = JSON.parse(branchesOrig.toString("utf8"));
var fa = branchesData.branches.find(function (b) { return b.id === "fishlocks_ainsdale"; });
if (!fa) { console.log("!!! fishlocks_ainsdale not found in branches.json"); process.exit(3); }
delete fa.widgets.contraception;
fs.writeFileSync(BRANCHES, JSON.stringify(branchesData, null, 2) + "\n");

var r2 = runChecker();
var caught2 = r2.status !== 0 && r2.out.indexOf("widgets.contraception") !== -1 &&
  r2.out.indexOf("fishlocks_ainsdale") !== -1 && r2.out.indexOf("must not fall back") !== -1;
results.push({ n: 2, rule: "widget", caught: caught2, detail: r2.out.split("\n").filter(function(l){return l.indexOf("FAIL")!==-1;}).join(" | ") });
console.log("INJECTION 2 (widget): " + (caught2 ? "CAUGHT" : "NOT CAUGHT - " + r2.out));

restoreAndVerify(BRANCHES, branchesOrig, branchesOrigSha, "branches.json (after injection 2)");
var post2 = runChecker();
if (post2.status !== 0) { console.log("!!! not clean after injection 2 restore"); process.exit(3); }

// ---------------------------------------------------------------------------
// INJECTION 3 - RULE 4 (branchattr): swap data-branch on the travel clinic
// page to a different, real, live branch's name (Smartts Chemist Bootle,
// this branch's nearest neighbour by distance but on a wholly separate
// domain and diary).
// ---------------------------------------------------------------------------
var travelHtml = travelOrig.toString("utf8");
if (travelHtml.indexOf('data-branch="Fishlocks Chemist Ainsdale"') === -1) {
  console.log("!!! expected data-branch text not found in travel clinic page - aborting this injection");
  process.exit(3);
}
var mutatedTravel = travelHtml.replace(
  'data-branch="Fishlocks Chemist Ainsdale"',
  'data-branch="Smartts Chemist Bootle"'
);
fs.writeFileSync(TRAVEL, mutatedTravel);

var r3 = runChecker();
var caught3 = r3.status !== 0 && r3.out.indexOf("travel-clinic-fishlocks-ainsdale") !== -1 &&
  r3.out.indexOf("Smartts Chemist Bootle") !== -1 && r3.out.indexOf("wrong pharmacy") !== -1;
results.push({ n: 3, rule: "branchattr", caught: caught3, detail: r3.out.split("\n").filter(function(l){return l.indexOf("FAIL")!==-1;}).join(" | ") });
console.log("INJECTION 3 (branchattr): " + (caught3 ? "CAUGHT" : "NOT CAUGHT - " + r3.out));

restoreAndVerify(TRAVEL, travelOrig, travelOrigSha, "travel-clinic-fishlocks-ainsdale.html (after injection 3)");
var post3 = runChecker();
if (post3.status !== 0) { console.log("!!! not clean after injection 3 restore"); process.exit(3); }

// ---------------------------------------------------------------------------
// INJECTION 4 - RULE 5 (serviceattr): strip data-service from the UTI page.
// ---------------------------------------------------------------------------
var utiHtml = utiOrig.toString("utf8");
var rootMatch = /<div id="rbhsv-root"([^>]*)>/.exec(utiHtml);
if (!rootMatch || rootMatch[1].indexOf("data-service=") === -1) {
  console.log("!!! expected data-service attribute not found on UTI page root - aborting this injection");
  process.exit(3);
}
var mutatedUti = utiHtml.replace(/(<div id="rbhsv-root"[^>]*?)\s+data-service="[^"]*"/, "$1");
if (mutatedUti === utiHtml) { console.log("!!! mutation did not change the UTI page"); process.exit(3); }
fs.writeFileSync(UTI, mutatedUti);

var r4 = runChecker();
var caught4 = r4.status !== 0 && r4.out.indexOf("uti-treatment-fishlocks-ainsdale") !== -1 &&
  r4.out.indexOf("no data-service") !== -1;
results.push({ n: 4, rule: "serviceattr", caught: caught4, detail: r4.out.split("\n").filter(function(l){return l.indexOf("FAIL")!==-1;}).join(" | ") });
console.log("INJECTION 4 (serviceattr): " + (caught4 ? "CAUGHT" : "NOT CAUGHT - " + r4.out));

restoreAndVerify(UTI, utiOrig, utiOrigSha, "uti-treatment-fishlocks-ainsdale.html (after injection 4)");

// ---------------------------------------------------------------------------
// Final verification.
// ---------------------------------------------------------------------------
var finalCheck = runChecker();
console.log("\nFINAL re-run exit=" + finalCheck.status);
if (finalCheck.status !== 0) { console.log("!!! not clean at the end"); console.log(finalCheck.out); process.exit(3); }

var finalBranchesSha = sha(fs.readFileSync(BRANCHES));
var finalTravelSha = sha(fs.readFileSync(TRAVEL));
var finalUtiSha = sha(fs.readFileSync(UTI));
var allRestored = finalBranchesSha === branchesOrigSha && finalTravelSha === travelOrigSha && finalUtiSha === utiOrigSha;
console.log("All three files byte-identical to original: " + allRestored);

var gitClean = gitDiffEmpty(["branches.json", "modules/service/pages/travel-clinic-fishlocks-ainsdale.html", "modules/service/pages/uti-treatment-fishlocks-ainsdale.html"]);
console.log("git status --porcelain empty on all three targets: " + gitClean);
console.log("stray route file gone: " + !fs.existsSync(STRAY_ROUTE_FILE));

console.log("\n=== SUMMARY ===");
var allCaught = true;
results.forEach(function (r) {
  console.log("  #" + r.n + " RULE " + r.rule + ": " + (r.caught ? "CAUGHT" : "NOT CAUGHT (" + r.detail + ")"));
  if (!r.caught) allCaught = false;
});
console.log("\nAll caught: " + allCaught + " | All restored: " + allRestored + " | Git clean: " + gitClean);
process.exit(allCaught && allRestored && gitClean ? 0 : 1);
