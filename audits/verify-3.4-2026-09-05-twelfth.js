/*
  audits/verify-3.4-2026-09-05-twelfth.js

  Item 3.4 (Cherry Lane Pharmacy, Walton), twelfth quality pass.

  Eleven prior passes proved, by direct injection against Cherry Lane's own
  pages and branch record: check-nap.js, check-postcodes.js,
  check-em-dashes.js, check-whatsapp-route.js, check-service-links.js,
  check-switch-copy.js and check-branch-identity.js. tools/check-booking-
  routes.js - the checker guarding the chain from branches.json's widgets
  block through to the Appointedd diary a patient actually lands in - had
  never been exercised against Cherry Lane specifically. "No hard-coded
  widget id" and "no foreign widget id" were checked in earlier passes, but
  that is a different claim from this checker's own five per-page rules
  (ROUTE, BRANCH, WIDGET, BRANCHATTR, SERVICEATTR) and its estate-wide RULE
  9 (FALLBACK) having been proved by injection on this branch's own record
  and pages.

  This script imports nothing from tools/ beyond invoking the real checker
  as a child process. It refuses to run if any target file already carries
  a git diff, records every target's sha256 before mutation, and restores
  by direct fs.writeFileSync from an in-memory buffer immediately after
  capturing the checker's output and BEFORE any assertion, so a thrown
  assertion can never leave a file mutated on disk.

  Run: node audits/verify-3.4-2026-09-05-twelfth.js
*/
"use strict";
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var { execFileSync } = require("child_process");

var ROOT = path.join(__dirname, "..");
var BRANCHES_JSON = path.join(ROOT, "branches.json");
var SERVICE_JS = path.join(ROOT, "modules", "service", "service.js");
var INSECT_BITE = path.join(ROOT, "modules", "service", "pages", "insect-bite-treatment-cherry-lane-walton.html");
var SINUSITIS = path.join(ROOT, "modules", "service", "pages", "sinusitis-treatment-cherry-lane-walton.html");

var TARGETS = [BRANCHES_JSON, SERVICE_JS, INSECT_BITE, SINUSITIS];

function sha256(p) { return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); }
function rel(p) { return path.relative(ROOT, p).replace(/\\/g, "/"); }

function gitDiffEmpty(p) {
  var out = execFileSync("git", ["status", "--porcelain", "--", rel(p)], { cwd: ROOT }).toString();
  return out.trim() === "";
}

TARGETS.forEach(function (p) {
  if (!gitDiffEmpty(p)) {
    console.error("REFUSING TO RUN: " + rel(p) + " already carries a git diff.");
    process.exit(2);
  }
});

var originals = {};
var hashes = {};
TARGETS.forEach(function (p) {
  originals[p] = fs.readFileSync(p);
  hashes[p] = sha256(p);
});

function restoreAll() {
  TARGETS.forEach(function (p) { fs.writeFileSync(p, originals[p]); });
  TARGETS.forEach(function (p) {
    var now = sha256(p);
    if (now !== hashes[p]) {
      console.error("SHA256 MISMATCH AFTER RESTORE: " + rel(p));
      process.exitCode = 2;
    }
  });
}

function runChecker() {
  try {
    var out = execFileSync("node", ["tools/check-booking-routes.js"], { cwd: ROOT }).toString();
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout ? e.stdout.toString() : "") + (e.stderr ? e.stderr.toString() : "") };
  }
}

var results = [];
function record(name, expectFail, tagSubstr, res) {
  var pass;
  if (expectFail) {
    pass = res.code !== 0 && res.out.indexOf(tagSubstr) !== -1;
  } else {
    pass = res.code === 0;
  }
  results.push({ name: name, pass: pass, code: res.code, tagSubstr: tagSubstr });
  console.log((pass ? "OK  " : "*** FAIL ***  ") + name + " (exit " + res.code + ")");
  if (!pass) console.log(res.out);
}

// ---------------------------------------------------------------------------
// TEST 1: RULE branch. Rename Cherry Lane's townSlug in branches.json so its
// routing key resolves to no trading branch.
// ---------------------------------------------------------------------------
(function test1() {
  var json = originals[BRANCHES_JSON].toString("utf8");
  var needle = '"townSlug": "walton",\n      "brandSlug": "cherry-lane",';
  if (json.indexOf(needle) === -1) {
    console.error("TEST 1 setup: needle not found, aborting this test only.");
    results.push({ name: "RULE branch (townSlug rename)", pass: false, code: null });
    return;
  }
  var mutated = json.replace(needle, '"townSlug": "walton-twelfthtest",\n      "brandSlug": "cherry-lane",');
  fs.writeFileSync(BRANCHES_JSON, mutated);
  var res = runChecker();
  record("RULE branch (townSlug rename cherrylane_liverpool)", true, "matches no trading branch", res);
  fs.writeFileSync(BRANCHES_JSON, originals[BRANCHES_JSON]);
})();

// ---------------------------------------------------------------------------
// TEST 2: RULE widget, NO_FALLBACK service. Remove Cherry Lane's own
// travelClinic widget id. travelClinic is in NO_FALLBACK_SERVICE_KEYS, so it
// must not silently fall back to the Pharmacy First diary.
// ---------------------------------------------------------------------------
(function test2() {
  var json = originals[BRANCHES_JSON].toString("utf8");
  var needle = '"travelClinic": "6a5bf3ac7066e1645399e678"';
  if (json.indexOf(needle) === -1) {
    console.error("TEST 2 setup: needle not found, aborting this test only.");
    results.push({ name: "RULE widget (travelClinic removed, no-fallback)", pass: false, code: null });
    return;
  }
  // Remove the key entirely (with its comma) rather than blank the value, so
  // the branch object stays valid JSON with the key genuinely absent.
  // travelClinic is the LAST key in Cherry Lane's widgets block, so the comma
  // sits before it, not after.
  var mutated = json.replace(',\n        "travelClinic": "6a5bf3ac7066e1645399e678"', '');
  if (mutated === json) {
    console.error("TEST 2 setup: comma-prefixed removal failed, aborting this test only.");
    results.push({ name: "RULE widget (travelClinic removed, no-fallback)", pass: false, code: null });
    return;
  }
  fs.writeFileSync(BRANCHES_JSON, mutated);
  var res = runChecker();
  record("RULE widget (Cherry Lane travelClinic removed, must not fall back)", true,
    "needs widgets.travelClinic", res);
  fs.writeFileSync(BRANCHES_JSON, originals[BRANCHES_JSON]);
})();

// ---------------------------------------------------------------------------
// TEST 3 (positive): RULE widget, Pharmacy First condition. Remove Cherry
// Lane's own earache widget. earache IS a Pharmacy First condition (linked
// from the branch's own PF overview page), so removing only its own widget
// must fall back to pharmacyFirst cleanly - no failure expected. This proves
// the fallback path itself works for Cherry Lane, not only that NO_FALLBACK
// services are blocked from it.
// ---------------------------------------------------------------------------
(function test3() {
  var json = originals[BRANCHES_JSON].toString("utf8");
  var needle = '"earache": "6a479c06fb612bf3ee54d85b"';
  if (json.indexOf(needle) === -1) {
    console.error("TEST 3 setup: needle not found, aborting this test only.");
    results.push({ name: "RULE widget positive fallback (earache removed)", pass: false, code: null });
    return;
  }
  // earache is followed by impetigo in Cherry Lane's widgets block, so its
  // own trailing comma sits after it, not before.
  var mutated = json.replace('"earache": "6a479c06fb612bf3ee54d85b",\n        ', '');
  if (mutated === json) {
    console.error("TEST 3 setup: comma-suffixed removal failed, aborting this test only.");
    results.push({ name: "RULE widget positive fallback (earache removed)", pass: false, code: null });
    return;
  }
  fs.writeFileSync(BRANCHES_JSON, mutated);
  var res = runChecker();
  record("RULE widget positive fallback (Cherry Lane earache removed, PF condition, should fall back cleanly)",
    false, null, res);
  fs.writeFileSync(BRANCHES_JSON, originals[BRANCHES_JSON]);
})();

// ---------------------------------------------------------------------------
// TEST 4: RULE branchattr. Swap data-branch on Cherry Lane's insect bite page
// (untried page for Cherry Lane injection testing in this checker) for a
// different live branch's name.
// ---------------------------------------------------------------------------
(function test4() {
  var html = originals[INSECT_BITE].toString("utf8");
  var needle = 'data-branch="Cherry Lane Pharmacy"';
  if (html.indexOf(needle) === -1) {
    console.error("TEST 4 setup: needle not found, aborting this test only.");
    results.push({ name: "RULE branchattr (data-branch swap)", pass: false, code: null });
    return;
  }
  var mutated = html.replace(needle, 'data-branch="Smartts Chemist"');
  fs.writeFileSync(INSECT_BITE, mutated);
  var res = runChecker();
  record("RULE branchattr (insect-bite-treatment-cherry-lane-walton.html data-branch swapped to Smartts Chemist)",
    true, "so an enquiry from this page is filed against the wrong pharmacy", res);
  fs.writeFileSync(INSECT_BITE, originals[INSECT_BITE]);
})();

// ---------------------------------------------------------------------------
// TEST 5: RULE serviceattr. Change data-service wording on Cherry Lane's
// sinusitis page (untried page for Cherry Lane injection testing in this
// checker) so it disagrees with every other branch's sinusitis page.
// ---------------------------------------------------------------------------
(function test5() {
  var html = originals[SINUSITIS].toString("utf8");
  var m = /data-service="([^"]+)"/.exec(html);
  if (!m) {
    console.error("TEST 5 setup: data-service not found, aborting this test only.");
    results.push({ name: "RULE serviceattr (data-service reworded)", pass: false, code: null });
    return;
  }
  var original = m[1];
  var mutated = html.replace('data-service="' + original + '"', 'data-service="' + original + " (Cherry Lane only wording)" + '"');
  fs.writeFileSync(SINUSITIS, mutated);
  var res = runChecker();
  record("RULE serviceattr (sinusitis-treatment-cherry-lane-walton.html data-service reworded, was \"" + original + "\")",
    true, "is described", res);
  fs.writeFileSync(SINUSITIS, originals[SINUSITIS]);
})();

// ---------------------------------------------------------------------------
// Final restore + sha256 reconfirmation, then a clean checker run.
// ---------------------------------------------------------------------------
restoreAll();
var finalRun = runChecker();
console.log("\nFinal clean run after all restores: exit " + finalRun.code);
if (finalRun.code !== 0) {
  console.log(finalRun.out);
  process.exitCode = 2;
}

var failed = results.filter(function (r) { return !r.pass; });
console.log("\n" + results.length + " test(s), " + failed.length + " failure(s) of expectation.");
if (failed.length) process.exitCode = 1;
