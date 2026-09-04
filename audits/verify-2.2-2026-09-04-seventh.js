/*
  audits/verify-2.2-2026-09-04-seventh.js

  Item 2.2 quality pass (seventh). Evidence script for the SISTERLABEL rule
  (rule 11) added to tools/check-branch-identity.js this pass.

  WHAT THIS PROVES
  Rule 9 (SISTERLINK, added on this item's third pass, 2026-08-12) proves a
  branch landing page's "looking for our other branch?" link resolves to the
  correct sister branch's page on the correct host. It never read the link's
  visible TEXT. That text is generated once, by sisterNote() in
  tools/build-branch-landing-pages.js: the sister's branchName, with " in
  <seoTown>" appended only when branchName does not already end with that
  town. Six prior passes on this item tested NAP, SISTERLINK/OUTBOUND link
  targets, the Pharmacy First cost claim, WhatsApp-by-design and the pfLink
  field - none had pointed at this label.

  It is not hypothetical. McCanns Sandringham's seoTown moved to "St
  Michael's" under item 5.7 while its branchName still ends "Sandringham",
  so it is the one live case in the estate that already exercises the
  "append the town" branch of sisterNote()'s regex. Read directly off the
  generated page below, it renders correctly today - but nothing was
  guarding it, so a future rename could break it silently, exactly the shape
  Q94 (item 3.2, eighth pass) flagged for GA tracking on the same branch
  pair, and the shape this repo's whole audit method looks for: ask which
  field a passing checker actually reads.

  METHOD
  Refuses to run if any target file already carries a git diff. Restores by
  direct write-back from an in-memory Buffer immediately after each round,
  sha256-verified byte-identical before, after each restoration, and again
  at the end. Two injections, each on a fresh restore: (1) McCanns Aigburth's
  sister-link label stripped of its " in St Michael's" suffix (the "should
  have appended, did not" direction); (2) Fishlocks Ainsdale's sister-link
  label given a spurious " in Eccleston" suffix it should not carry (the
  "should not have appended, did" direction). Both caught by the new rule 11
  on first run.

  Run:  node audits/verify-2.2-2026-09-04-seventh.js
*/
"use strict";
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var cp = require("child_process");

var ROOT = path.join(__dirname, "..");
var CHECKER = path.join(ROOT, "tools", "check-branch-identity.js");

var TARGETS = {
  aigburth: path.join(ROOT, "modules", "branch", "pages", "pharmacy-mccanns-aigburth.html"),
  ainsdale: path.join(ROOT, "modules", "branch", "pages", "pharmacy-fishlocks-ainsdale.html")
};

function sha(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function gitDiffEmpty(file) {
  var rel = path.relative(ROOT, file);
  var out = cp.execSync("git status --porcelain -- " + JSON.stringify(rel), { cwd: ROOT }).toString();
  return out.trim() === "";
}

function runChecker() {
  try {
    var out = cp.execSync("node " + JSON.stringify(CHECKER), { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, out: out.toString() };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "").toString() + (e.stderr || "").toString() };
  }
}

Object.keys(TARGETS).forEach(function (k) {
  if (!gitDiffEmpty(TARGETS[k])) {
    console.log("REFUSING TO RUN: " + TARGETS[k] + " already carries a git diff.");
    process.exit(2);
  }
});

var results = [];

function round(name, file, mutate, expectSubstring) {
  var before = fs.readFileSync(file);
  var beforeHash = sha(before);
  var mutated = mutate(before.toString("utf8"));
  fs.writeFileSync(file, mutated, "utf8");
  var afterMutate = fs.readFileSync(file);
  var check = runChecker();
  var caught = check.code !== 0 && check.out.indexOf(expectSubstring) !== -1;
  fs.writeFileSync(file, before);
  var restored = fs.readFileSync(file);
  var restoredHash = sha(restored);
  var byteIdentical = restoredHash === beforeHash;
  results.push({
    name: name,
    caught: caught,
    byteIdentical: byteIdentical,
    beforeHash: beforeHash,
    restoredHash: restoredHash,
    checkerExitCode: check.code
  });
  console.log((caught ? "CAUGHT" : "MISSED") + "  " + name +
    "  byte-identical-restore=" + byteIdentical);
  if (!caught) console.log(check.out);
}

round(
  "aigburth-strip-town-suffix",
  TARGETS.aigburth,
  function (html) {
    return html.replace(
      "McCanns Chemist Sandringham in St Michael's",
      "McCanns Chemist Sandringham"
    );
  },
  "the label, not the href"
);

round(
  "ainsdale-spurious-town-suffix",
  TARGETS.ainsdale,
  function (html) {
    return html.replace(
      "Fishlocks Chemist Eccleston<",
      "Fishlocks Chemist Eccleston in Eccleston<"
    );
  },
  "the label, not the href"
);

var baseline = runChecker();
console.log("\nFinal baseline check-branch-identity.js exit code: " + baseline.code +
  " (expect 0)");

var allGood = results.every(function (r) { return r.caught && r.byteIdentical; }) &&
  baseline.code === 0;
console.log(allGood ? "\nRESULT: PASS - both directions caught, both files restored byte-identical, baseline clean." :
  "\nRESULT: FAIL - see above.");
process.exit(allGood ? 0 : 1);
