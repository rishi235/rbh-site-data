#!/usr/bin/env node
/*
 * verify-2.3-2026-09-07-thirteenth.js
 *
 * Item 2.3 (Cherry Lane Pharmacy, Walton) - thirteenth machine-era quality
 * pass, unattended run, 2026-09-07.
 *
 * Twelve prior passes (2026-08-04 build through 2026-09-06 twelfth pass)
 * found two real in-repo defects (third pass: check-branch-identity.js
 * SERVICELINK rule; fourth pass: check-pharmacy-first-eligibility.js's
 * missing second age bound) and, from the ninth pass onward, worked through
 * checkers never before proven by injection against this branch's own
 * pages: check-switch-copy.js (ninth), check-brand-spelling.js /
 * check-uk-spelling.js / check-url-scheme.js (tenth), check-booking-
 * routes.js (eleventh), check-jsonld.js (twelfth). Grepping this item's own
 * AGENT_WORKLIST.md section for "check-weight-loss-copy" before this run
 * returned zero matches, despite Cherry Lane owning one of the fifteen live
 * weight loss pages and one of the two Weebly "old page moved" paste
 * blocks that checker also reads (rule 12) - the most compliance-sensitive
 * checker in the repo, per CLAUDE.md, and the one gap left on this item
 * that touches regulated copy. That is this pass's fresh angle.
 *
 * check-weight-loss-copy.js has 12 rules over three surfaces: the 15
 * modules/service/pages/weight-loss-clinic-*.html pages (rules 1-10), the 6
 * modules/branch/pages/*.html landing pages as Regime 1 (rule 11, not
 * applicable to Cherry Lane - it has no branch landing page, confirmed
 * again this pass), and the modules/service/weebly-paste/*.html "old page
 * moved" blocks as Regime 1 (rule 12, and Cherry Lane owns one:
 * cherry-lane-old-weight-loss-replacement.html). This script proves four
 * rules spanning both surfaces by injection against an isolated scratch
 * mirror containing a full copy of modules/service/pages,
 * modules/branch/pages, modules/service/weebly-paste, branches.json and the
 * six tools/ files the checker itself requires or reads (build-weight-
 * loss-pages.js, pom-names.js, claim-patterns.js, pom-class-patterns.js,
 * build-branch-landing-pages.js, and the checker itself, unmodified) -
 * never against the tracked repo files, so no restoration of tracked
 * content was ever needed. Mirror built and destroyed under
 * _agentscratch/inject-test-2.3-weightloss/ (git status --porcelain
 * modules/ branches.json tools/ confirmed empty, i.e. no tracked file
 * touched, both before and after this pass).
 *
 * Method: for each rule, mutate the scratch copy of Cherry Lane's own file,
 * run the REAL tools/check-weight-loss-copy.js (not a reimplementation -
 * a checker that only tests a copy of itself proves nothing) against the
 * mirror, confirm the expected FAIL fires with the right message, then
 * restore from a saved copy and SHA256-reconfirm byte-identical before the
 * next mutation. A baseline run (all 15 pages, all 6 landing pages, both
 * paste blocks, unmutated) was run before the first mutation and again
 * after the last restore; both were clean, exit 0.
 *
 * RESULT: all 4 injections caught first attempt:
 *   1. rule 8 (medicine)   - "Wegovy" inserted into the hero of
 *                            weight-loss-clinic-cherry-lane-walton.html ->
 *                            caught, names the file and the medicine
 *   2. rule 6 (guarantee)  - "This is a professional judgement, not a
 *                            guarantee." removed from the same page's step 2
 *                            -> caught, quotes the missing sentence
 *   3. rule 7 (price)      - "from £39.99" changed to "from £29.99" in all
 *                            three places on the same page -> caught TWICE:
 *                            this page no longer carries CONSULT_FEE, and
 *                            estate-wide drift (29.99 on 3, 39.99 on 42)
 *   4. rule 12 (paste,     - "Mounjaro" inserted into
 *      medicine)             cherry-lane-old-weight-loss-replacement.html ->
 *                            caught, cites the Regime 1 / entry-point
 *                            reasoning in the checker's own message
 *
 * Rules not exercised this pass, and why: rule 1 (coverage) and rule 2-5,
 * 9-10 (pinned copy, FAQ, private/paid, eligibility, claims, governance) all
 * read the same 15-page loop the four proven rules already confirm the
 * checker is applying to Cherry Lane's own file; proving every rule
 * individually on one branch would repeat work the eleventh and twelfth
 * passes' own precedent (proving a representative subset, not every rule of
 * every checker, on every pass) already established as sufficient. Rule 11
 * is structurally inapplicable: Cherry Lane has no branch landing page
 * (confirmed again this pass - modules/branch/pages/ holds exactly the six
 * shared-domain branches' pages, Cherry Lane is not one of them).
 *
 * Full 36-checker suite re-run individually against the real (untouched)
 * repo after this pass: 36/36 exit 0. All six generators (build-audit-
 * status.js excluded, per convention - it publishes rather than
 * regenerating pages) rebuilt: git status --porcelain modules/ empty before
 * and after, byte-identical.
 *
 * No in-repo defect found. No question raised. check-weight-loss-copy.js
 * was already correctly holding Cherry Lane Pharmacy's own weight loss page
 * and its Weebly paste block to four of its twelve rules; now proven
 * directly by injection for the first time in this item's thirteen-pass
 * history.
 *
 * This file is a record of the pass, not a script meant to be re-run
 * unattended: it documents the exact mutations and results captured live
 * against a scratch mirror built and destroyed during the run (Cowork Linux
 * sandbox shell - see AGENT_LOG.md for the full transcript). Re-running it
 * verbatim reconstructs the same mirror and mutations from scratch.
 */

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var cp = require("child_process");

var ROOT = path.resolve(__dirname, "..");
var BRANCH_SLUG = "cherry-lane-walton";
var SCRATCH = path.join(ROOT, "_agentscratch", "inject-test-2.3-weightloss");

function rimraf(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }
function sha256(p) { return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); }

function buildMirror() {
  rimraf(SCRATCH);
  fs.mkdirSync(path.join(SCRATCH, "tools"), { recursive: true });
  fs.mkdirSync(path.join(SCRATCH, "modules", "service", "pages"), { recursive: true });
  fs.mkdirSync(path.join(SCRATCH, "modules", "service", "weebly-paste"), { recursive: true });
  fs.mkdirSync(path.join(SCRATCH, "modules", "branch", "pages"), { recursive: true });

  fs.copyFileSync(path.join(ROOT, "branches.json"), path.join(SCRATCH, "branches.json"));
  [
    "check-weight-loss-copy.js", "build-weight-loss-pages.js", "pom-names.js",
    "claim-patterns.js", "pom-class-patterns.js", "build-branch-landing-pages.js"
  ].forEach(function (f) {
    fs.copyFileSync(path.join(ROOT, "tools", f), path.join(SCRATCH, "tools", f));
  });
  fs.readdirSync(path.join(ROOT, "modules", "service", "pages"))
    .filter(function (f) { return /^weight-loss-clinic-.*\.html$/.test(f); })
    .forEach(function (f) {
      fs.copyFileSync(path.join(ROOT, "modules", "service", "pages", f),
        path.join(SCRATCH, "modules", "service", "pages", f));
    });
  fs.readdirSync(path.join(ROOT, "modules", "branch", "pages"))
    .filter(function (f) { return /\.html$/.test(f); })
    .forEach(function (f) {
      fs.copyFileSync(path.join(ROOT, "modules", "branch", "pages", f),
        path.join(SCRATCH, "modules", "branch", "pages", f));
    });
  fs.readdirSync(path.join(ROOT, "modules", "service", "weebly-paste"))
    .filter(function (f) { return /\.html$/.test(f); })
    .forEach(function (f) {
      fs.copyFileSync(path.join(ROOT, "modules", "service", "weebly-paste", f),
        path.join(SCRATCH, "modules", "service", "weebly-paste", f));
    });
}

function runChecker() {
  var r = cp.spawnSync(process.execPath, [path.join(SCRATCH, "tools", "check-weight-loss-copy.js")],
    { cwd: SCRATCH, encoding: "utf8" });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}

function mutateAndTest(label, file, dir, mutate, expectSubstr) {
  var full = path.join(SCRATCH, dir, file);
  var before = fs.readFileSync(full, "utf8");
  var beforeHash = sha256(full);
  var mutated = mutate(before);
  fs.writeFileSync(full, mutated);
  var res = runChecker();
  fs.writeFileSync(full, before);
  var afterHash = sha256(full);
  var restored = afterHash === beforeHash;
  var caught = res.code !== 0 && expectSubstr.every(function (s) { return res.out.indexOf(s) !== -1; });
  console.log((caught ? "CAUGHT" : "MISSED") + "  " + label + (restored ? "" : "  RESTORE MISMATCH"));
  if (!caught) console.log(res.out);
  return caught && restored;
}

console.log("Building scratch mirror at " + SCRATCH + " ...");
buildMirror();

console.log("\nbaseline run (all real files, unmutated):");
var base = runChecker();
console.log("  exit " + base.code + (base.code === 0 ? " (clean, as expected)" : " UNEXPECTED"));

var results = [];

results.push(mutateAndTest(
  "rule 8 (medicine name)", "weight-loss-clinic-" + BRANCH_SLUG + ".html", "modules/service/pages",
  function (t) { return t.replace('<div class="wrap">', '<div class="wrap">\n<p>Ask about Wegovy today.</p>'); },
  ['names "wegovy"', "weight-loss-clinic-" + BRANCH_SLUG + ".html"]
));

results.push(mutateAndTest(
  "rule 6 (no guarantee)", "weight-loss-clinic-" + BRANCH_SLUG + ".html", "modules/service/pages",
  function (t) { return t.replace(" This is a professional judgement, not a guarantee.", ""); },
  ["has lost a no-guarantee statement", "professional judgement, not a guarantee"]
));

results.push(mutateAndTest(
  "rule 7 (price drift + fee)", "weight-loss-clinic-" + BRANCH_SLUG + ".html", "modules/service/pages",
  function (t) { return t.split("from £39.99").join("from £29.99"); },
  ["does not carry the fee declared", "not the same on every page"]
));

results.push(mutateAndTest(
  "rule 12 (paste block medicine name)", "cherry-lane-old-weight-loss-replacement.html",
  "modules/service/weebly-paste",
  function (t) { return t.replace("Prefer to talk it through?", "Ask about Mounjaro. Prefer to talk it through?"); },
  ['names "mounjaro"', "Regime 1"]
));

console.log("\nfinal baseline re-run (all restores applied):");
var finalBase = runChecker();
console.log("  exit " + finalBase.code + (finalBase.code === 0 ? " (clean, as expected)" : " UNEXPECTED"));

rimraf(SCRATCH);

var allCaught = results.every(Boolean) && base.code === 0 && finalBase.code === 0;
console.log("\n" + (allCaught
  ? "ALL 4 INJECTIONS CAUGHT. check-weight-loss-copy.js proven against Cherry Lane Pharmacy's own weight loss page and Weebly paste block for the first time in thirteen passes. No in-repo defect."
  : "AT LEAST ONE INJECTION WAS MISSED - investigate before treating this item as clean."));
process.exit(allCaught ? 0 : 1);
