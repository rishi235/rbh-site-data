#!/usr/bin/env node
/*
 * verify-3.9-2026-09-05-eleventh.js
 *
 * Item 3.9 (Coleman and Leighs Pharmacy, Liverpool/Walton) - eleventh
 * machine-era quality pass, unattended run, 2026-09-05.
 *
 * Ten prior machine-era passes (2026-08-12 through 2026-09-04) found zero
 * in-repo defects on this item across: NAP/JSON-LD/POM scans, phone/postcode/
 * dash/seoTown contamination families, brand variants, data-branch/data-wa,
 * booking-widget assignment and Pharmacy First fallback, Google Maps embed
 * cross-check, Meta Keywords sheets, CDN pin values, fragment targets, URL
 * scheme, GBP pack blood-pressure/yellow-fever/sister-claim rules, GBP pack
 * DAY-based hours rules, and (tenth pass) tools/check-branch-identity.js by
 * direct injection.
 *
 * The tenth pass explicitly noted, before starting, that grepping this
 * item's own AGENT_WORKLIST.md section showed ZERO prior mentions of either
 * check-branch-identity.js or check-jsonld.js. The tenth pass closed the
 * first gap. check-jsonld.js was left untouched - it had never been proven
 * by injection against Coleman and Leighs' own 12 pages in nine passes, and
 * remained untouched after the tenth. That is this (eleventh) pass's fresh
 * angle.
 *
 * check-jsonld.js has 8 named rules (see its own header). This script proves
 * all 8 by injection against an isolated scratch mirror containing ONLY this
 * branch's 12 real generated pages, branches.json, and an unmodified copy of
 * tools/check-jsonld.js - never against the tracked repo files, so no
 * restoration of tracked content was ever needed. Mirror built and destroyed
 * under _agentscratch/inject-test-3.9-jsonld/ (git status --porcelain
 * modules/ confirmed empty, i.e. no tracked file touched, both before and
 * after this pass).
 *
 * Method: for each rule, copy the real page into the mirror fresh, apply one
 * targeted string mutation, run the REAL tools/check-jsonld.js (not a
 * reimplementation - a checker that only tests a copy of itself proves
 * nothing) against the mirror, confirm the expected FAIL fires with the
 * right message, then restore. A baseline run (all 12 real pages, unmutated)
 * was run before the first mutation and again after the last restore; both
 * were clean, exit 0.
 *
 * RESULT: all 8 rules fire correctly:
 *   1. blocks count      - a duplicate <script type="application/ld+json">
 *                          block inserted into insect-bite-treatment ->
 *                          "expected exactly one JSON-LD block, found 2"
 *   2. @type              - rewritten to MedicalBusiness on pharmacy-first ->
 *                          caught, cites the Pharmacy-is-a-subtype reasoning
 *   2b. @context          - rewritten to http:// on impetigo-treatment ->
 *                          caught
 *   3. name               - rewritten to "Smartts Chemist" on
 *                          earache-treatment -> caught, cites branchName
 *   4. url                - filename swapped to a non-existent page on
 *                          shingles-treatment -> caught
 *   5. address (region)   - addressRegion rewritten to "Cheshire" on
 *                          sinusitis-treatment -> caught
 *   6. telephone          - spacing stripped on sore-throat-treatment ->
 *                          caught (spacing-sensitive comparison confirmed)
 *   8. map query           - postcode corrupted (L4 6TH -> L4 7TH) in the
 *                          Google Maps iframe on uti-treatment -> caught
 *
 * Rule 7 (email / areaServed) is not exercised: none of this branch's 12
 * pages carries either field (confirmed by reading the raw JSON-LD block on
 * every page before mutating anything - this branch has no branch-landing
 * page in modules/branch/pages/, and the service/switch generators do not
 * emit email or areaServed). Structurally inapplicable to this item, the
 * same shape as AMBIGUOUS/SISTERLINK being skipped for branches with no
 * sister on the tenth pass - noted rather than silently skipped.
 *
 * Full 36-checker suite re-run individually against the real (untouched)
 * repo after this pass: 36/36 exit 0. All six generators (build-audit-
 * status.js excluded, per convention - it publishes rather than
 * regenerating pages) rebuilt: git status --porcelain modules/ core/ empty
 * before and after, byte-identical.
 *
 * No in-repo defect found. No question raised. check-jsonld.js was already
 * correctly holding Coleman and Leighs Pharmacy's own 12 pages to all 7
 * applicable rules; now proven directly by injection for the first time in
 * this item's eleven-pass history.
 *
 * This file is a record of the pass, not a script meant to be re-run
 * unattended: it documents the exact mutations and results captured live
 * against a scratch mirror built and destroyed during the run (PowerShell,
 * native Windows host - see AGENT_LOG.md for the full transcript). Re-running
 * it verbatim reconstructs the same mirror and mutations from scratch.
 */

var fs = require("fs");
var path = require("path");
var os = require("os");
var cp = require("child_process");

var ROOT = path.resolve(__dirname, "..");
var BRANCH_SLUG = "coleman-leigh-walton";
var SCRATCH = path.join(ROOT, "_agentscratch", "inject-test-3.9-jsonld-rerun");

function rimraf(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }

function buildMirror() {
  rimraf(SCRATCH);
  fs.mkdirSync(path.join(SCRATCH, "tools"), { recursive: true });
  fs.mkdirSync(path.join(SCRATCH, "modules", "service", "pages"), { recursive: true });
  fs.mkdirSync(path.join(SCRATCH, "modules", "switch", "pages"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "branches.json"), path.join(SCRATCH, "branches.json"));
  fs.copyFileSync(path.join(ROOT, "tools", "check-jsonld.js"), path.join(SCRATCH, "tools", "check-jsonld.js"));
  var svcDir = path.join(ROOT, "modules", "service", "pages");
  fs.readdirSync(svcDir).filter(function (f) { return f.indexOf(BRANCH_SLUG) !== -1; })
    .forEach(function (f) { fs.copyFileSync(path.join(svcDir, f), path.join(SCRATCH, "modules", "service", "pages", f)); });
  var swFile = "switch-prescriptions-" + BRANCH_SLUG + ".html";
  fs.copyFileSync(path.join(ROOT, "modules", "switch", "pages", swFile), path.join(SCRATCH, "modules", "switch", "pages", swFile));
}

function runChecker() {
  var r = cp.spawnSync(process.execPath, ["tools/check-jsonld.js"], { cwd: SCRATCH, encoding: "utf8" });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}

function mutateAndTest(label, file, find, replace, expectSubstr) {
  var full = path.join(SCRATCH, "modules", "service", "pages", file);
  var orig = fs.readFileSync(full, "utf8");
  var mut = orig.split(find).join(replace);
  if (mut === orig) throw new Error(label + ": mutation string not found, refusing to report a false pass");
  fs.writeFileSync(full, mut);
  var res = runChecker();
  fs.writeFileSync(full, orig); // restore mirror copy immediately
  var caught = res.code !== 0 && res.out.indexOf(expectSubstr) !== -1;
  console.log((caught ? "CAUGHT" : "MISSED") + "  " + label);
  if (!caught) console.log("    expected substring not found: " + expectSubstr + "\n    got: " + res.out);
  return caught;
}

buildMirror();
console.log("baseline (all 12 real pages, unmutated):");
var base = runChecker();
console.log("  exit " + base.code + (base.code === 0 ? " (clean, as expected)" : " UNEXPECTED"));

var results = [];
results.push(mutateAndTest(
  "rule 2 (@type)", "pharmacy-first-" + BRANCH_SLUG + ".html",
  '"@type": "Pharmacy"', '"@type": "MedicalBusiness"',
  "every branch"));
results.push(mutateAndTest(
  "rule 3 (name)", "earache-treatment-" + BRANCH_SLUG + ".html",
  '"name": "Coleman and Leighs Pharmacy"', '"name": "Smartts Chemist"',
  "must declare branchName"));
results.push(mutateAndTest(
  "rule 4 (url)", "shingles-treatment-" + BRANCH_SLUG + ".html",
  "shingles-treatment-" + BRANCH_SLUG + ".html\"", "wrong-filename-" + BRANCH_SLUG + ".html\"",
  '"url" is'));
results.push(mutateAndTest(
  "rule 5 (address.addressRegion)", "sinusitis-treatment-" + BRANCH_SLUG + ".html",
  '"addressRegion": "Merseyside"', '"addressRegion": "Cheshire"',
  "addressRegion is"));
results.push(mutateAndTest(
  "rule 6 (telephone)", "sore-throat-treatment-" + BRANCH_SLUG + ".html",
  '"telephone": "0151 525 3522"', '"telephone": "01515253522"',
  '"telephone" is'));
results.push(mutateAndTest(
  "rule 2b (@context)", "impetigo-treatment-" + BRANCH_SLUG + ".html",
  '"@context": "https://schema.org"', '"@context": "http://schema.org"',
  '"@context" is'));
results.push(mutateAndTest(
  "rule 8 (map query)", "uti-treatment-" + BRANCH_SLUG + ".html",
  "L4%206TH", "L4%207TH",
  "map iframe points"));

// Rule 1: duplicate JSON-LD block
(function () {
  var file = "insect-bite-treatment-" + BRANCH_SLUG + ".html";
  var full = path.join(SCRATCH, "modules", "service", "pages", file);
  var orig = fs.readFileSync(full, "utf8");
  var marker = '<script type="application/ld+json">';
  var idx = orig.indexOf(marker);
  var endIdx = orig.indexOf("</script>", idx) + "</script>".length;
  var block = orig.slice(idx, endIdx);
  var mut = orig.slice(0, idx) + block + "\n" + orig.slice(idx);
  fs.writeFileSync(full, mut);
  var res = runChecker();
  fs.writeFileSync(full, orig);
  var caught = res.code !== 0 && res.out.indexOf("found 2") !== -1;
  console.log((caught ? "CAUGHT" : "MISSED") + "  rule 1 (duplicate JSON-LD block)");
  results.push(caught);
})();

console.log("\nfinal baseline re-run (all restores applied):");
var finalBase = runChecker();
console.log("  exit " + finalBase.code + (finalBase.code === 0 ? " (clean, as expected)" : " UNEXPECTED"));

rimraf(SCRATCH);

var allCaught = results.every(Boolean) && base.code === 0 && finalBase.code === 0;
console.log("\n" + (allCaught
  ? "ALL 8 INJECTIONS CAUGHT. check-jsonld.js proven against Coleman and Leighs Pharmacy's own pages for the first time in eleven passes. No in-repo defect."
  : "AT LEAST ONE INJECTION WAS MISSED - investigate before treating this item as clean."));
process.exit(allCaught ? 0 : 1);
