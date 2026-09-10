/*
  verify-3.10-2026-09-10-fifteenth.js

  Item 3.10 (Riddings Pharmacy, Timperley), fifteenth quality pass.

  Fourteen prior passes proved, by direct injection against Riddings' own
  pages and paste sheets: check-booking-routes.js, check-branch-identity.js,
  check-branch-links.js, check-contraception-copy.js, check-em-dashes.js,
  check-jsonld.js, check-map-embeds.js, check-nap.js, check-opening-hours.js,
  check-postcodes.js, check-seo-pattern.js, check-service-links.js,
  check-switch-copy.js and check-travel-clinic-copy.js. Confirmed by grepping
  the item's entire AGENT_WORKLIST.md section for every one of the 35
  checker filenames: check-weight-loss-copy.js has zero hits. Riddings offers
  the service (branches.json widgets.weightLoss is set) and has its own page,
  modules/service/pages/weight-loss-clinic-riddings-timperley.html, so this
  is a real gap, not an inapplicable checker.

  Riddings has no branch landing page (modules/branch/pages) and no Weebly
  paste block (modules/service/weebly-paste) of its own - confirmed by
  directory listing before this script was written - so rules 11 and 12
  cannot be exercised against Riddings specifically; this targets rules 2,
  3, 4, 5, 6, 7, 8, 9 and 10, all of which read Riddings' own generated page.

  Method: nine injections into Riddings' own weight-loss-clinic page, one per
  rule, each restored byte-identical (sha256-verified) immediately after its
  catch is confirmed. Refuses to run if the target file is not already
  clean (git diff) so a real in-flight edit is never clobbered or misread as
  this script's own baseline.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const TARGET = path.join(REPO, "modules", "service", "pages", "weight-loss-clinic-riddings-timperley.html");
const CHECKER = path.join(REPO, "tools", "check-weight-loss-copy.js");

function sha256(s) { return crypto.createHash("sha256").update(s, "utf8").digest("hex"); }

function gitDiffClean(relPath) {
  try {
    const out = execFileSync("git", ["status", "--porcelain", "--", relPath], { cwd: REPO }).toString();
    return out.trim() === "";
  } catch (e) {
    console.log("git status check failed: " + e.message);
    return false;
  }
}

function runChecker() {
  try {
    const out = execFileSync("node", [CHECKER], { cwd: REPO }).toString();
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "").toString() + (e.stderr || "").toString() };
  }
}

const relTarget = "modules/service/pages/weight-loss-clinic-riddings-timperley.html";

console.log("verify-3.10-2026-09-10-fifteenth: check-weight-loss-copy.js against Riddings Pharmacy");
console.log("");

if (!gitDiffClean(relTarget)) {
  console.log("REFUSING TO RUN: " + relTarget + " already has an uncommitted diff. " +
    "This script only runs against a clean baseline so a real in-flight edit is never " +
    "mistaken for this script's own injection.");
  process.exit(1);
}

const baseline = fs.readFileSync(TARGET, "utf8");
const baselineHash = sha256(baseline);
console.log("Baseline read: " + relTarget + " (" + baseline.length + " bytes, sha256 " +
  baselineHash.slice(0, 12) + "...)");

const base = runChecker();
if (base.code !== 0) {
  console.log("REFUSING TO RUN: check-weight-loss-copy.js is not clean on the baseline tree.");
  console.log(base.out);
  process.exit(1);
}
console.log("Baseline checker run: clean (exit 0).");
console.log("");

let passCount = 0;
let failCount = 0;

function injection(name, rule, transform, expectSubstrings) {
  const injected = transform(baseline);
  if (injected === baseline) {
    console.log("[" + name + "] SKIPPED - transform made no change (target string not found).");
    failCount++;
    return;
  }
  fs.writeFileSync(TARGET, injected, "utf8");
  const result = runChecker();
  fs.writeFileSync(TARGET, baseline, "utf8");
  const restoredHash = sha256(fs.readFileSync(TARGET, "utf8"));
  const restoredOk = restoredHash === baselineHash;

  const caught = result.code !== 0 &&
    expectSubstrings.every(function (s) { return result.out.indexOf(s) !== -1; });

  if (caught && restoredOk) {
    console.log("[" + name + "] CAUGHT (rule " + rule + "), restored byte-identical (sha256 confirmed).");
    passCount++;
  } else {
    console.log("[" + name + "] *** PROBLEM ***");
    console.log("  restored byte-identical: " + restoredOk);
    console.log("  checker exit code: " + result.code);
    console.log("  expected substrings: " + JSON.stringify(expectSubstrings));
    console.log("  checker output:");
    console.log(result.out.split("\n").map(function (l) { return "    " + l; }).join("\n"));
    failCount++;
  }
  console.log("");
}

// 1. RULE 2, pinned copy - remove the "Private Weight Loss Clinic" label.
injection("rule2-pinned-copy", "2",
  function (s) { return s.replace(
    '<div class="hero-help-row">Private Weight Loss Clinic</div>',
    '<div class="hero-help-row">Weight Management Service</div>'); },
  ["riddings", "missing pinned service copy", "Private Weight Loss Clinic"]);

// 2. RULE 3, FAQ - drop the "No." that keeps consultation and prescription apart.
injection("rule3-faq-answer", "3",
  function (s) { return s.replace(
    "No. This is a clinical assessment, not an automatic prescription.",
    "This is a clinical assessment, not an automatic prescription."); },
  ["riddings", "without the part that carries the promise"]);

// 3. RULE 4, free offer on a paid private service page.
injection("rule4-free-offer", "4",
  function (s) { return s.replace(
    "This is a paid private service, not an NHS treatment, and it is not right for everyone. See below.",
    "This is a paid private service, not an NHS treatment, and it is not right for everyone. Enjoy a free consultation this month. See below."); },
  ["riddings", "free consultation"]);

// 4. RULE 5, numeric BMI threshold (the framing must stay a range, never a number).
injection("rule5-bmi-number", "5",
  function (s) { return s.replace(
    "Typically a BMI in the overweight or obese range for your height",
    "Typically a BMI over 30 in the overweight or obese range for your height"); },
  ["riddings", "states a numeric BMI threshold"]);

// 5. RULE 6, drop one of the four no-guarantee sentences.
injection("rule6-no-guarantee", "6",
  function (s) { return s.replace(
    " Individual results vary depending on factors including starting weight, diet and lifestyle.",
    ""); },
  ["riddings", "has lost a no-guarantee statement"]);

// 6. RULE 7, price-led wording next to the fee.
injection("rule7-price-led", "7",
  function (s) { return s.replace(
    "Private consultation at Riddings Pharmacy, from £39.99. Choose a time that suits you.",
    "Private consultation at Riddings Pharmacy, from £39.99. Special offer this week. Choose a time that suits you."); },
  ["riddings", "uses price-led wording", "Special offer"]);

// 7. RULE 8, a named prescription-only medicine.
injection("rule8-medicine-name", "8",
  function (s) { return s.replace(
    "There are several prescription-only weight-loss medicines available in the UK,",
    "There are several prescription-only weight-loss medicines available in the UK, such as Wegovy,"); },
  ["riddings", "wegovy"]);

// 8. RULE 9, an efficacy/results claim.
injection("rule9-claim", "9",
  function (s) { return s.replace(
    "Medically-supported weight loss, assessed and supervised by a pharmacist.",
    "Medically-supported weight loss, assessed and supervised by a pharmacist. Our clinic delivers results."); },
  ["riddings", "delivers results"]);

// 9. RULE 10, the governance promise in the page's own paste comment.
injection("rule10-governance", "10",
  function (s) { return s.replace(
    "Superintendent pharmacist\n  signs off wording before publish",
    "Wording reviewed before publish"); },
  ["riddings", "lost part of its paste-comment governance note", "Superintendent pharmacist signs off wording before publish"]);

// Final control: confirm the target file is back to the exact baseline and
// the full checker suite is clean estate-wide.
const finalHash = sha256(fs.readFileSync(TARGET, "utf8"));
console.log("Final restore check: " + (finalHash === baselineHash ? "OK, byte-identical to baseline" : "*** MISMATCH ***"));
if (finalHash !== baselineHash) failCount++;

const finalRun = runChecker();
console.log("Final check-weight-loss-copy.js run: " + (finalRun.code === 0 ? "clean (exit 0)" : "FAILING (exit " + finalRun.code + ")"));
if (finalRun.code !== 0) {
  console.log(finalRun.out);
  failCount++;
}

console.log("");
console.log("SUMMARY: " + passCount + " injection(s) caught as expected, " + failCount + " problem(s).");
process.exit(failCount ? 1 : 0);
