/*
  Item 3.10 (Riddings Pharmacy, Timperley) - tenth quality pass, 2026-09-04.

  Nine prior passes proved check-nap, check-em-dashes, check-service-links
  (JS-injected copy), check-booking-routes (BRANCHATTR/SERVICEATTR/WIDGET),
  postcode/seoTown/map/JSON-LD field-for-field rules and check-switch-copy
  against Riddings' own pages by direct injection. tools/check-branch-identity.js
  had never been proven against this branch specifically (grepped this item's
  own AGENT_WORKLIST.md section first: zero mentions of "branch-identity"
  attached to Riddings - the twelve hits in the file are all Scorah, McCanns,
  Fishlocks, Cherry Lane or Coleman and Leighs). Riddings' brandLabel equals
  its branchName and it has no sister branch on riddingspharmacy.co.uk
  (confirmed via branches.json: brandCount["Riddings Pharmacy"] === 1), so
  rules 4 (AMBIGUOUS), 5 (SITEUNIQUE) and 9 (SISTERLINK) are structurally
  inapplicable here, the same shape the 3.4 (Cherry Lane) and 3.9 (Coleman and
  Leighs) tenth passes found for their own non-shared-brand branches. This
  script proves the five rules that DO apply: IDENTITY (1), OWNER (2),
  SCHEMANAME (3), OUTBOUND (8), SERVICELINK (10).

  Method: read each target file into a Buffer, mutate on disk, run the real
  checker as a child process, restore from the in-memory Buffer immediately
  after capturing output (before any assertion), sha256-confirm the restore,
  then assert the checker's message. Refuses to run at all if any target file
  already carries a git diff. No import from tools/ beyond invoking the real
  checker as a subprocess.
*/
"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var cp = require("child_process");

var ROOT = path.join(__dirname, "..");
var CHECKER = path.join(ROOT, "tools", "check-branch-identity.js");
var PAGES = path.join(ROOT, "modules", "service", "pages");

var TARGETS = {
  identity: path.join(PAGES, "earache-treatment-riddings-timperley.html"),
  owner: path.join(PAGES, "sore-throat-treatment-riddings-timperley.html"),
  schemaname: path.join(PAGES, "shingles-treatment-riddings-timperley.html"),
  outbound: path.join(PAGES, "sinusitis-treatment-riddings-timperley.html"),
  servicelink: path.join(PAGES, "pharmacy-first-riddings-timperley.html")
};

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function gitDiffEmpty(file) {
  var rel = path.relative(ROOT, file);
  var out = cp.execSync('git status --porcelain -- "' + rel + '"', { cwd: ROOT }).toString();
  return out.trim() === "";
}

function runChecker() {
  var res = cp.spawnSync(process.execPath, [CHECKER], { cwd: ROOT, encoding: "utf8" });
  return { code: res.status, stdout: res.stdout || "", stderr: res.stderr || "" };
}

// -----------------------------------------------------------------------
// Preflight: refuse to run if any target already carries a git diff.
// -----------------------------------------------------------------------
Object.keys(TARGETS).forEach(function (k) {
  if (!gitDiffEmpty(TARGETS[k])) {
    console.log("REFUSING TO RUN: " + TARGETS[k] + " already carries a git diff.");
    process.exit(2);
  }
});
console.log("Preflight: all 5 target files git-diff-empty.");

var baselineBuffers = {};
Object.keys(TARGETS).forEach(function (k) {
  baselineBuffers[k] = fs.readFileSync(TARGETS[k]);
});

var baseline = runChecker();
console.log("Baseline check-branch-identity.js: exit " + baseline.code +
  (baseline.code === 0 ? " (clean, as expected before any mutation)" : " (UNEXPECTED - not clean before mutation)"));
if (baseline.code !== 0) {
  console.log(baseline.stdout);
  process.exit(2);
}

var results = [];

function probe(name, file, mutateFn, expectSubstring) {
  var original = baselineBuffers[name];
  var text = original.toString("utf8");
  var mutated = mutateFn(text);
  if (mutated === text) {
    console.log("MUTATOR FOR " + name + " MADE NO CHANGE - refusing to report a false pass.");
    process.exit(2);
  }
  fs.writeFileSync(file, mutated, "utf8");
  var res = runChecker();
  // Restore immediately, before any assertion.
  fs.writeFileSync(file, original);
  var restoredSha = sha256(fs.readFileSync(file));
  var originalSha = sha256(original);
  var restoredOk = restoredSha === originalSha;
  var caught = res.code !== 0 && res.stdout.indexOf(expectSubstring) !== -1;
  results.push({ name: name, file: path.relative(ROOT, file), caught: caught, restoredOk: restoredOk, code: res.code });
  console.log("--- " + name.toUpperCase() + " (" + path.relative(ROOT, file) + ") ---");
  console.log("  checker exit: " + res.code + ", expected substring found: " + caught);
  if (!caught) {
    console.log("  FULL STDOUT:\n" + res.stdout);
  } else {
    var lines = res.stdout.split("\n").filter(function (l) { return l.indexOf(expectSubstring) !== -1; });
    console.log("  matched line: " + lines[0]);
  }
  console.log("  restored byte-identical: " + restoredOk + " (sha256 " + restoredSha + ")");
}

// 1. IDENTITY - empty out data-branch on the module root.
probe("identity", TARGETS.identity, function (text) {
  return text.replace(
    /(<div id="rbhsv-root"[^>]*\sdata-branch=")[^"]*(")/,
    "$1$2"
  );
}, "carries a module root but no");

// 2. OWNER - data-branch swapped for a real, different branch's name.
probe("owner", TARGETS.owner, function (text) {
  return text.replace(
    /(<div id="rbhsv-root"[^>]*\sdata-branch=")Riddings Pharmacy(")/,
    "$1Smartts Chemist$2"
  );
}, "filed against the wrong pharmacy");

// 3. SCHEMANAME - JSON-LD name swapped for a different branch's.
probe("schemaname", TARGETS.schemaname, function (text) {
  return text.replace(
    /("name"\s*:\s*")Riddings Pharmacy(")/,
    "$1Hirshmans Chemist$2"
  );
}, "Google is told this address belongs to another pharmacy");

// 4. OUTBOUND - review link swapped for a different branch's Google review link.
probe("outbound", TARGETS.outbound, function (text) {
  return text.replace(
    "https://g.page/r/CRtdZliseNZGEAE/review",
    "https://g.page/r/CVzJUbDqQwReEBM/review"
  );
}, "A patient following it rates the wrong shop");

// 5. SERVICELINK - the shingles condition tile repointed at Smartts' equivalent page.
probe("servicelink", TARGETS.servicelink, function (text) {
  return text.replace(
    'href="shingles-treatment-riddings-timperley.html"',
    'href="shingles-treatment-smartts-bootle.html"'
  );
}, "it 404s and the service route is dead");

// -----------------------------------------------------------------------
// Final state check.
// -----------------------------------------------------------------------
var finalCheck = runChecker();
console.log("\nFinal check-branch-identity.js after all restores: exit " + finalCheck.code);

var allDiffEmpty = Object.keys(TARGETS).every(function (k) { return gitDiffEmpty(TARGETS[k]); });
console.log("All 5 target files git-diff-empty after run: " + allDiffEmpty);

var allCaught = results.every(function (r) { return r.caught; });
var allRestored = results.every(function (r) { return r.restoredOk; });

console.log("\nSUMMARY: " + results.length + " probes, " +
  results.filter(function (r) { return r.caught; }).length + " caught, " +
  results.filter(function (r) { return r.restoredOk; }).length + " restored byte-identical.");
console.log(allCaught && allRestored && finalCheck.code === 0 && allDiffEmpty
  ? "RESULT: PASS - all five rules caught the injection, all files restored, tree clean."
  : "RESULT: FAIL - see above.");

process.exit(allCaught && allRestored && finalCheck.code === 0 && allDiffEmpty ? 0 : 1);
