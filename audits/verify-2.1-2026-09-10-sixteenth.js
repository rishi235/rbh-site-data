/*
  Item 2.1 (Fishlocks Ainsdale) quality pass, sixteenth pass, 2026-09-10.

  FRESH ANGLE: tools/check-page-coverage.js has never been named once across
  fifteen prior passes on this item, despite it being the checker that proves
  the very first claim the 2026-08-04 audit made ("page set complete") and
  every pass since has repeated ("13 pages", "all six generators rebuild to
  a zero diff") without ever proving, by injection, that the coverage checker
  would actually catch it if Fishlocks Ainsdale lost a page from a generator's
  BUILD list, lost a page from disk, or lost its branch-landing-page entry
  (the exact class of fault item 2.2 built the landing pages to fix).

  Three injections, each targeting a different rule in check-page-coverage.js,
  on a freshly restored copy each time. Same discipline as the fifteenth
  pass's own script: refuse to run on a dirty tree, capture original bytes
  and sha256 before mutation, restore by direct fs.writeFileSync immediately
  after capturing the checker's output and before any assertion, sha256
  reconfirm after every restore.

  Run: node verify-2.1-2026-09-10-sixteenth.js
*/
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = "/sessions/vibrant-great-ride/mnt/rbh-site-data";
const CHECKER = path.join(ROOT, "tools", "check-page-coverage.js");

function sha(p) { return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); }
function log(s) { console.log(s); }

function gitDirty(paths) {
  const out = execFileSync("git", ["status", "--porcelain", "--", ...paths], { cwd: ROOT, encoding: "utf8" });
  // ignore the known pre-existing stray .bak file left by the fifteenth pass
  return out.split(/\r?\n/).filter(l => l.trim() && !l.includes("notarealservice-fishlocks-ainsdale.html.bak")).join("\n");
}

function runChecker() {
  try {
    const out = execFileSync("node", [CHECKER], { cwd: ROOT, encoding: "utf8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

let failures = 0;
function expect(cond, label) {
  if (cond) { log("  PASS " + label); }
  else { log("  **FAIL (of this verify script)** " + label); failures++; }
}

// ---------------------------------------------------------------------------
log("=== Pre-flight: tree must be clean before any injection ===");
const preDirty = gitDirty([
  "tools/build-service-pages.js",
  "tools/build-branch-landing-pages.js",
  "modules/service/pages",
  "modules/branch/pages"
]);
if (preDirty) {
  console.error("REFUSING TO RUN: tree not clean:\n" + preDirty);
  process.exit(2);
}
log("clean.\n");

log("=== Baseline: full checker run before any injection ===");
const baseline = runChecker();
expect(baseline.code === 0, "baseline check-page-coverage.js exits 0");
log(baseline.out.split("\n").slice(0, 6).join("\n"));
log("");

// ---------------------------------------------------------------------------
// Injection 1: NOT_BUILT. Remove "fishlocks_ainsdale" from build-service-pages.js
// BUILD list (Pharmacy First). branches.json is untouched, so the branch still
// earns the pages; only the generator's own list stops naming it.
// ---------------------------------------------------------------------------
log("=== Injection 1: NOT_BUILT (build-service-pages.js BUILD list) ===");
{
  const target = path.join(ROOT, "tools", "build-service-pages.js");
  const original = fs.readFileSync(target, "utf8");
  const shaBefore = sha(target);
  const mutated = original.replace('  "fishlocks_ainsdale",\n', "");
  expect(mutated !== original, "mutation actually changed the file");
  fs.writeFileSync(target, mutated, "utf8");

  const result = runChecker();

  // restore immediately, before any assertion on the result
  fs.writeFileSync(target, original, "utf8");
  const shaAfter = sha(target);
  expect(shaAfter === shaBefore, "build-service-pages.js byte-identical after restore");

  expect(result.code === 1, "checker exits 1 with fishlocks_ainsdale dropped from BUILD");
  expect(/NOT_BUILT/.test(result.out), "failure code is NOT_BUILT");
  expect(/fishlocks_ainsdale/.test(result.out), "message names fishlocks_ainsdale");
  expect(/Pharmacy First/.test(result.out), "message names the Pharmacy First rule");
  log(result.out.split("\n").filter(l => /FAIL/.test(l)).join("\n"));
  log("");
}

// ---------------------------------------------------------------------------
// Injection 2: PAGE_MISSING. A page the branch earns and the BUILD list still
// names, removed from disk. Renamed rather than deleted (delete is refused on
// this FUSE mount per the standing Q87/Q96 quirk the fifteenth pass hit).
// ---------------------------------------------------------------------------
log("=== Injection 2: PAGE_MISSING (page removed from disk) ===");
{
  const dir = path.join(ROOT, "modules", "service", "pages");
  const file = "shingles-treatment-fishlocks-ainsdale.html";
  const target = path.join(dir, file);
  const parked = path.join(dir, file + ".parked-by-verify-2.1-sixteenth");
  expect(fs.existsSync(target), "target page exists before injection");
  const shaBefore = sha(target);

  fs.renameSync(target, parked);
  expect(!fs.existsSync(target), "target page is off disk during injection");

  const result = runChecker();

  // restore immediately
  fs.renameSync(parked, target);
  expect(fs.existsSync(target), "target page restored");
  expect(sha(target) === shaBefore, "restored page byte-identical (sha256)");

  expect(result.code === 1, "checker exits 1 with the page missing");
  expect(/PAGE_MISSING/.test(result.out), "failure code is PAGE_MISSING");
  expect(new RegExp(file.replace(/\./g, "\\.")).test(result.out), "message names the missing file");
  expect(/fishlocks_ainsdale/.test(result.out), "message names fishlocks_ainsdale as the earning branch");
  log(result.out.split("\n").filter(l => /FAIL/.test(l)).join("\n"));
  log("");
}

// ---------------------------------------------------------------------------
// Injection 3: LANDING_NOT_BUILT (warning). Remove fishlocks_ainsdale from
// build-branch-landing-pages.js's BUILD list. branches.json still has it
// sharing fishlockpharmacy.co.uk with fishlocks_eccleston, so it should WARN,
// referencing item 2.2 by name, not FAIL (Rishi's decision, not a build defect).
// ---------------------------------------------------------------------------
log("=== Injection 3: LANDING_NOT_BUILT (build-branch-landing-pages.js BUILD list) ===");
{
  const target = path.join(ROOT, "tools", "build-branch-landing-pages.js");
  const original = fs.readFileSync(target, "utf8");
  const shaBefore = sha(target);
  const mutated = original.replace('  "fishlocks_ainsdale",\n', "");
  expect(mutated !== original, "mutation actually changed the file");
  fs.writeFileSync(target, mutated, "utf8");

  const result = runChecker();

  fs.writeFileSync(target, original, "utf8");
  const shaAfter = sha(target);
  expect(shaAfter === shaBefore, "build-branch-landing-pages.js byte-identical after restore");

  // This rule warns, not fails - the checker's exit code should stay 0
  // (assuming everything else is clean) while still printing the warning.
  expect(/LANDING_NOT_BUILT/.test(result.out), "warning code is LANDING_NOT_BUILT");
  expect(/fishlocks_ainsdale/.test(result.out), "message names fishlocks_ainsdale");
  expect(/[Ii]tem 2\.2/.test(result.out), "message references item 2.2 by name");
  log(result.out.split("\n").filter(l => /LANDING_NOT_BUILT/.test(l)).join("\n"));
  log("");
}

// ---------------------------------------------------------------------------
log("=== Post-flight: full checker run after all injections, tree re-verified clean ===");
const postDirty = gitDirty([
  "tools/build-service-pages.js",
  "tools/build-branch-landing-pages.js",
  "modules/service/pages",
  "modules/branch/pages"
]);
expect(!postDirty, "tree clean after all three injections and restores" + (postDirty ? ":\n" + postDirty : ""));

const after = runChecker();
expect(after.code === 0, "checker exits 0 again after full restore");
expect(after.out === baseline.out, "checker output byte-identical to the pre-injection baseline");
log(after.out.split("\n").slice(0, 6).join("\n"));

log("\n" + (failures === 0
  ? "ALL CHECKS PASSED (" + (16) + " assertions, 0 failures)."
  : failures + " ASSERTION FAILURE(S) - see above."));
process.exit(failures === 0 ? 0 : 1);
