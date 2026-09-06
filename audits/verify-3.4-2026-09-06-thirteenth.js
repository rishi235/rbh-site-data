/*
  audits/verify-3.4-2026-09-06-thirteenth.js

  Item 3.4 (Cherry Lane Pharmacy, Walton) quality pass, thirteenth.

  The genuinely untested angle: tools/check-seo-pattern.js - the flagship
  Phase 3 checker that defines the exact title/H1/description pattern the
  whole 3.1-3.13 worklist series exists to roll out - has never once been
  proven by direct injection against Cherry Lane's own pages specifically,
  in twelve prior passes on this item. The same gap was found and closed for
  item 3.7 (Smartts, twelfth pass) and item 3.13 (Clear Chemist, tenth pass);
  this closes it for Cherry Lane. Twelve prior passes proved check-nap.js,
  check-postcodes.js, check-em-dashes.js, check-whatsapp-route.js,
  check-service-links.js, check-switch-copy.js, check-branch-identity.js and
  check-booking-routes.js against this branch; check-seo-pattern.js was not
  among them despite being the checker item 3.4's own worklist entry exists
  to satisfy.

  Discipline, matching this item's own eleventh/twelfth passes: no import
  from tools/ beyond invoking the real checker as a child process. Refuses to
  run if any target file already carries a git diff. Captures each target's
  sha256 and full buffer before any mutation. Restores by direct
  fs.writeFileSync from the in-memory buffer immediately after capturing the
  checker's output and BEFORE any assertion is made, so a thrown assertion
  can never leave a file mutated on disk. Re-confirms sha256 identical to the
  pre-mutation hash after every restore, before the next test begins.

  Four injections, one at a time, each on an untried Cherry Lane page for
  this checker where one exists (prior passes' injection testing against
  Cherry Lane used UTI, switch, Pharmacy First, weight-loss-clinic,
  travel-clinic, earache, sore-throat, shingles, sinusitis and insect-bite;
  contraception and impetigo had never been touched by any injection test on
  this item before this pass):

    1. EXACT TITLE MATCH   - contraception-cherry-lane-walton.html (untried page)
    2. CROSS-TOWN ABSENCE  - impetigo-treatment-cherry-lane-walton.html (untried page)
    3. ONE H1              - pharmacy-first-cherry-lane-walton.html
    4. ONE TITLE LINE      - switch-prescriptions-cherry-lane-walton.html

  Run:  node audits/verify-3.4-2026-09-06-thirteenth.js
  Exits 1 on any unexpected outcome (an injection not caught, a checker
  crash, a restore that does not hash-match, or any target already dirty at
  start). Exits 0 only if all four injections were caught on their intended
  signature and every target file was confirmed byte-identical afterward.
*/
"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var cp = require("child_process");

var ROOT = path.join(__dirname, "..");

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function gitDiffEmpty(relPath) {
  var out = cp.spawnSync("git", ["status", "--porcelain", "--", relPath], { cwd: ROOT, encoding: "utf8" });
  if (out.status !== 0) throw new Error("git status failed for " + relPath + ": " + out.stderr);
  return out.stdout.trim() === "";
}

function runChecker() {
  var out = cp.spawnSync(process.execPath, [path.join(ROOT, "tools", "check-seo-pattern.js")], {
    cwd: ROOT, encoding: "utf8"
  });
  return { status: out.status, stdout: out.stdout || "", stderr: out.stderr || "" };
}

var TARGETS = {
  title: path.join(ROOT, "modules", "service", "pages", "contraception-cherry-lane-walton.html"),
  crosstown: path.join(ROOT, "modules", "service", "pages", "impetigo-treatment-cherry-lane-walton.html"),
  oneh1: path.join(ROOT, "modules", "service", "pages", "pharmacy-first-cherry-lane-walton.html"),
  onetitleline: path.join(ROOT, "modules", "switch", "pages", "switch-prescriptions-cherry-lane-walton.html")
};

var RELATIVE = {
  title: "modules/service/pages/contraception-cherry-lane-walton.html",
  crosstown: "modules/service/pages/impetigo-treatment-cherry-lane-walton.html",
  oneh1: "modules/service/pages/pharmacy-first-cherry-lane-walton.html",
  onetitleline: "modules/switch/pages/switch-prescriptions-cherry-lane-walton.html"
};

var results = [];
var failures = 0;

function log(msg) {
  console.log(msg);
  results.push(msg);
}

// -----------------------------------------------------------------------
// PRE-FLIGHT: refuse to run if any target already carries a git diff.
// -----------------------------------------------------------------------
Object.keys(TARGETS).forEach(function (key) {
  if (!fs.existsSync(TARGETS[key])) {
    throw new Error("target missing: " + TARGETS[key]);
  }
  if (!gitDiffEmpty(RELATIVE[key])) {
    throw new Error("refusing to run: " + RELATIVE[key] + " already carries a git diff before this script touched it");
  }
});
log("PRE-FLIGHT: all four target files git-diff-empty before any mutation.");

// Baseline run.
var baseline = runChecker();
log("BASELINE: check-seo-pattern.js exit " + baseline.status + " (expect 0).");
if (baseline.status !== 0) {
  throw new Error("baseline check-seo-pattern.js is not clean, aborting before any injection:\n" + baseline.stdout);
}
if (baseline.stdout.indexOf("OK   Cherry Lane Pharmacy - ") === -1) {
  throw new Error("baseline does not show Cherry Lane Pharmacy passing cleanly:\n" + baseline.stdout);
}
log("BASELINE confirms: " + baseline.stdout.split("\n").filter(function (l) { return l.indexOf("Cherry Lane Pharmacy") !== -1; }).join(" | "));

var buffers = {};
Object.keys(TARGETS).forEach(function (key) {
  buffers[key] = fs.readFileSync(TARGETS[key]);
});
var hashes = {};
Object.keys(buffers).forEach(function (key) { hashes[key] = sha256(buffers[key]); });

function restoreAndVerify(key) {
  fs.writeFileSync(TARGETS[key], buffers[key]);
  var after = sha256(fs.readFileSync(TARGETS[key]));
  if (after !== hashes[key]) {
    throw new Error("RESTORE FAILED for " + RELATIVE[key] + " - sha256 mismatch after restore. STOP.");
  }
  if (!gitDiffEmpty(RELATIVE[key])) {
    throw new Error("RESTORE FAILED for " + RELATIVE[key] + " - git still reports a diff after restore. STOP.");
  }
}

function expectCaught(name, key, mutate, expectedFragmentTests) {
  var original = buffers[key].toString("utf8");
  var mutated = mutate(original);
  if (mutated === original) {
    throw new Error(name + ": mutation function made no change to " + RELATIVE[key] + ", test is void");
  }
  fs.writeFileSync(TARGETS[key], mutated, "utf8");
  var res = runChecker();
  // Restore BEFORE any assertion, so a thrown assertion never leaves the
  // file mutated on disk.
  restoreAndVerify(key);

  var caught = res.status !== 0;
  var matched = expectedFragmentTests.every(function (frag) { return res.stdout.indexOf(frag) !== -1; });
  if (!caught) {
    failures++;
    log("FAIL " + name + ": injection on " + RELATIVE[key] + " did NOT change checker exit status (still " + res.status + "). NOT CAUGHT.");
    return;
  }
  if (!matched) {
    failures++;
    log("FAIL " + name + ": checker exited non-zero but did not print the expected fragment(s) " +
      JSON.stringify(expectedFragmentTests) + ". Actual relevant output:\n" +
      res.stdout.split("\n").filter(function (l) { return l.indexOf(path.basename(TARGETS[key])) !== -1; }).join("\n"));
    return;
  }
  log("CAUGHT " + name + " on " + RELATIVE[key] + " (exit " + res.status + "), expected fragment(s) present.");
}

// -----------------------------------------------------------------------
// TEST 1: EXACT TITLE MATCH
// -----------------------------------------------------------------------
expectCaught(
  "EXACT TITLE MATCH",
  "title",
  function (html) {
    return html.replace(
      /(Weebly page SEO title:\s*)(.+)/,
      function (m, p1, p2) { return p1 + p2.trimEnd() + " - Now Open Weekends"; }
    );
  },
  ["title '", "- Now Open Weekends", "!="]
);

// -----------------------------------------------------------------------
// TEST 2: CROSS-TOWN ABSENCE - "Ainsdale" is a live seoTown (Fishlocks
// Ainsdale / Hirshmans Ainsdale), not in Cherry Lane's own serviceAreaList
// (Liverpool, Walton, Everton), and Cherry Lane is single-host so no
// SISTER_TOWNS excuse applies either.
// -----------------------------------------------------------------------
expectCaught(
  "CROSS-TOWN ABSENCE",
  "crosstown",
  function (html) {
    return html.replace(
      /(Weebly page SEO description:\s*)(.+)/,
      function (m, p1, p2) { return p1 + p2.trimEnd() + " Also serving patients from Ainsdale."; }
    );
  },
  ["names 'Ainsdale'", "is not in this branch's serviceAreaList"]
);

// -----------------------------------------------------------------------
// TEST 3: ONE H1 - a second <h1> naming a foreign town, appended directly
// after the genuine heading.
// -----------------------------------------------------------------------
expectCaught(
  "ONE H1",
  "oneh1",
  function (html) {
    return html.replace(
      /(<h1>[\s\S]*?<\/h1>)/,
      function (m) { return m + "\n<h1>Pharmacy in Ainsdale</h1>"; }
    );
  },
  ["2 h1 elements, expected exactly 1"]
);

// -----------------------------------------------------------------------
// TEST 4: ONE TITLE LINE - a second "Weebly page SEO title" line inserted
// immediately after the genuine one in the head comment.
// -----------------------------------------------------------------------
expectCaught(
  "ONE TITLE LINE",
  "onetitleline",
  function (html) {
    return html.replace(
      /(Weebly page SEO title:\s*.+)/,
      function (m) { return m + "\nWeebly page SEO title:       Pharmacy in Ainsdale"; }
    );
  },
  ["2 'Weebly page SEO title' lines, expected exactly 1"]
);

// -----------------------------------------------------------------------
// FINAL: re-confirm baseline clean and all four targets untouched.
// -----------------------------------------------------------------------
var final = runChecker();
log("FINAL: check-seo-pattern.js exit " + final.status + " after all four restores (expect 0).");
if (final.status !== 0) {
  failures++;
  log("FAIL FINAL: checker not clean after restores:\n" + final.stdout);
}
Object.keys(TARGETS).forEach(function (key) {
  if (!gitDiffEmpty(RELATIVE[key])) {
    failures++;
    log("FAIL FINAL: " + RELATIVE[key] + " still shows a git diff after all restores.");
  }
  var nowHash = sha256(fs.readFileSync(TARGETS[key]));
  if (nowHash !== hashes[key]) {
    failures++;
    log("FAIL FINAL: " + RELATIVE[key] + " sha256 does not match pre-test hash.");
  }
});

log("\n" + (failures ? (failures + " FAILURE(S)") : "ALL FOUR INJECTIONS CAUGHT, ZERO FAILURES") + ".");
process.exit(failures ? 1 : 0);
