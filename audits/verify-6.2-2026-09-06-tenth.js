/*
  verify-6.2-2026-09-06-tenth.js

  Item 6.2, tenth quality pass, 2026-09-06 (unattended scheduled run).

  FRESH ANGLE. Nine prior passes have widened or proved every rule and every
  "stop rather than quietly weaken the rule" fail-safe in
  tools/check-service-links.js EXCEPT one: the "stale KNOWN key" check itself
  (checker lines ~508-511 and ~527-531), which is meant to FAIL the run once
  a KNOWN, KNOWN_CLAIM or KNOWN_POM entry stops matching anything - the
  signal that the underlying fix has landed and the entry must be removed so
  the exception list cannot rot. Grepping AGENT_WORKLIST.md's own nine-pass
  history for "stale KNOWN key" / "no longer applies" / "no longer fires"
  found zero prior matches in this item's section: the mechanism that keeps
  this checker's three exception lists honest has never itself been proven
  to fire.

  This matters more here than in most checkers with a similar convention
  (check-cdn-pins.js's KNOWN_DRIFT, check-seo-lengths.js's KNOWN) because two
  of check-service-links.js's three exception dictionaries hold LIVE
  regulatory findings under open questions (Q16, feeding Q53/Q54/Q58/Q85):
  KNOWN's five entries and KNOWN_CLAIM's one entry all describe a specific,
  named live defect on the Smartts switch page. If any of those were fixed
  live (or accidentally "fixed" by a future generator change) without the
  matching KNOWN/KNOWN_CLAIM entry being deleted from this checker, a
  passing "stale entry" check is the only thing standing between "someone
  quietly stopped tracking a compliance exception" and "the run stays green
  regardless." KNOWN_POM is empty in the live checker (no generated page
  currently names a medicine), so there is no real stale case to observe
  there without a synthetic entry - Test C supplies one.

  METHOD. All three tests run against a scratch copy of the whole repo
  (`cp -a`, including .git, this item's established method since prior
  passes found excluding .git makes check-cdn-pins.js fail falsely), never
  against the live tree, because two of the three mutate real generated-page
  bytes rather than only branches.json or checker-source constants. Each
  mutation is applied, the real checker run as a child process, output
  captured, then the mutated file restored from an in-memory buffer and
  sha256-reconfirmed byte-identical to its pre-mutation hash before any
  conclusion is drawn - the same discipline every prior 6.2 pass has used.

  All five KNOWN link entries and the one KNOWN_CLAIM entry live on exactly
  one file, modules/switch/pages/switch-prescriptions-smartts-bootle.html
  (confirmed by grep before writing this script), sourced from the CONFIG
  block of tools/build-switch-pages.js. That makes the three tests:

    TEST A - simulate the Q16 blood-testing.html link fix landing: retarget
      that one href on the scratch copy to a compliant generated page
      (contraception-smartts-bootle.html, chosen because it is a real page
      generated for the same host, so nothing else about the page becomes
      newly wrong). Expect the checker to FAIL with exactly one stale KNOWN
      key (the retargeted one) and the other four KNOWN + one KNOWN_CLAIM
      entries to stay correctly matched, not swept up as stale too.

    TEST B - simulate the Q16 "Support that delivers results." claim being
      reworded to compliant copy. Expect the checker to FAIL with the
      KNOWN_CLAIM key stale, and the five KNOWN link entries unaffected.

    TEST C - KNOWN_POM has no live entry to make stale, so this mutates the
      CHECKER SOURCE itself (not branches.json, not a page - the same class
      of restore the ninth pass's own Test C used on EXTRA_LINK_HOST_SLUG):
      a synthetic KNOWN_POM entry naming a medicine that is not actually
      present anywhere in the estate is added, proving the same fail-safe
      protects all three dictionaries, not just the two with a real case to
      observe today.

  Each test is independent: the scratch copy is re-baselined (mutation
  reverted) before the next test runs, so no test result depends on a prior
  test's mutation still being in place.
*/
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { execFileSync, execSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const SCRATCH = path.join(os.tmpdir(), "scratch-62-tenth-" + Date.now());

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }
function sha256File(file) { return sha256(fs.readFileSync(file)); }

function runChecker(cwd) {
  try {
    const out = execFileSync(process.execPath, [path.join("tools", "check-service-links.js")],
      { cwd: cwd, encoding: "utf8" });
    return { exitCode: 0, out: out };
  } catch (e) {
    return { exitCode: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

console.log("=== SETUP: scratch copy ===");
execSync("cp -a " + JSON.stringify(REPO) + " " + JSON.stringify(SCRATCH));
console.log("Scratch copy at", SCRATCH);

console.log("\n=== BASELINE (scratch, no injection) ===");
const baseline = runChecker(SCRATCH);
console.log("exit code:", baseline.exitCode);
console.log(baseline.out.trim());
if (baseline.exitCode !== 0) {
  console.log("FAIL: scratch baseline is not clean; aborting before any injection.");
  process.exit(1);
}
const baselineKnownCount = (baseline.out.match(/^\s*KNOWN /gm) || []).length;
console.log("Baseline KNOWN/KNOWN CLAIM lines printed:", baselineKnownCount, "(expect 6: 5 KNOWN + 1 KNOWN CLAIM)");

const PAGE = path.join(SCRATCH, "modules", "switch", "pages", "switch-prescriptions-smartts-bootle.html");
const pageOrig = fs.readFileSync(PAGE);
const pageOrigSha = sha256(pageOrig);
console.log("Target page sha256 (pre-mutation):", pageOrigSha);

function withPageMutation(label, oldStr, newStr, expectFailSubstring, expectNotSubstrings) {
  console.log("\n=== " + label + " ===");
  const content = pageOrig.toString("utf8");
  const occurrences = content.split(oldStr).length - 1;
  if (occurrences !== 1) {
    console.log("FAIL: expected exactly 1 occurrence of the target string, found " + occurrences + ". Not mutating.");
    return { skipped: true };
  }
  fs.writeFileSync(PAGE, content.replace(oldStr, newStr));
  const result = runChecker(SCRATCH);
  console.log("exit code:", result.exitCode);
  console.log(result.out.trim());

  fs.writeFileSync(PAGE, pageOrig);
  const restoredSha = sha256File(PAGE);
  const restoredOk = restoredSha === pageOrigSha;
  console.log("Page restored sha256 matches original:", restoredOk, restoredOk ? "" : ("(" + restoredSha + ")"));
  if (!restoredOk) {
    console.log("FAIL: restore did not reproduce the original file. STOPPING, do not trust further tests.");
    process.exit(1);
  }

  const caught = result.exitCode !== 0 && result.out.indexOf("FAIL  stale KNOWN key: " + expectFailSubstring) !== -1;
  const othersUnaffected = (expectNotSubstrings || []).every(function (s) {
    return result.out.indexOf("stale KNOWN key: " + s) === -1;
  });
  console.log("Caught as the expected stale KNOWN key:", caught);
  console.log("Other KNOWN/KNOWN_CLAIM entries NOT swept up as stale:", othersUnaffected);
  return { caught: caught, othersUnaffected: othersUnaffected, exitCode: result.exitCode };
}

// TEST A - the Q16 blood-testing.html link fix landing.
const testA = withPageMutation(
  "TEST A: blood-testing.html link retargeted to a compliant generated page (simulates the Q16 fix landing)",
  'href="https://www.smarttschemist.co.uk/blood-testing.html"',
  'href="https://www.smarttschemist.co.uk/contraception-smartts-bootle.html"',
  "www.smarttschemist.co.uk/blood-testing.html",
  [
    "www.smarttschemist.co.uk/vaccinations.html",
    "www.smarttschemist.co.uk/weight-loss-clinic-bootle.html",
    "www.smarttschemist.co.uk/pharmacy-first-service-bootle.html",
    "www.smarttschemist.co.uk/medical-cannabis.html",
    "modules/switch/pages/switch-prescriptions-smartts-bootle.html::Support that delivers results."
  ]
);

// TEST B - the Q16 claim wording fix landing.
const testB = withPageMutation(
  "TEST B: 'Support that delivers results.' reworded to compliant copy (simulates the Q16 fix landing)",
  "<span>Support that delivers results.</span>",
  "<span>Weight loss consultations available.</span>",
  "modules/switch/pages/switch-prescriptions-smartts-bootle.html::Support that delivers results.",
  [
    "www.smarttschemist.co.uk/blood-testing.html",
    "www.smarttschemist.co.uk/vaccinations.html",
    "www.smarttschemist.co.uk/weight-loss-clinic-bootle.html",
    "www.smarttschemist.co.uk/pharmacy-first-service-bootle.html",
    "www.smarttschemist.co.uk/medical-cannabis.html"
  ]
);

// TEST C - KNOWN_POM has no live entry, so mutate the checker source itself
// with a synthetic never-matching entry, restored the same way the ninth
// pass's own Test C restored EXTRA_LINK_HOST_SLUG after a source mutation.
console.log("\n=== TEST C: synthetic KNOWN_POM entry (checker source, not data) ===");
const CHECKER = path.join(SCRATCH, "tools", "check-service-links.js");
const checkerOrig = fs.readFileSync(CHECKER);
const checkerOrigSha = sha256(checkerOrig);
const checkerText = checkerOrig.toString("utf8");
const needle = "const KNOWN_POM = {};";
let testC;
if (checkerText.indexOf(needle) === -1) {
  console.log("FAIL: expected 'const KNOWN_POM = {};' not found verbatim; not mutating. Inconclusive, not a pass.");
  testC = { skipped: true };
} else {
  const synthetic = 'const KNOWN_POM = {\n'
    + '  "modules/switch/pages/switch-prescriptions-smartts-bootle.html::Mounjaro": '
    + '"TEST C synthetic entry, tenth-pass stale-KNOWN_POM probe, not real, restored after use"\n'
    + '};';
  fs.writeFileSync(CHECKER, checkerText.replace(needle, synthetic));
  const resultC = runChecker(SCRATCH);
  console.log("exit code:", resultC.exitCode);
  console.log(resultC.out.trim());
  fs.writeFileSync(CHECKER, checkerOrig);
  const restoredCheckerSha = sha256File(CHECKER);
  console.log("Checker restored sha256 matches original:", restoredCheckerSha === checkerOrigSha);
  if (restoredCheckerSha !== checkerOrigSha) {
    console.log("FAIL: checker restore did not reproduce the original file. STOPPING.");
    process.exit(1);
  }
  const caught = resultC.exitCode !== 0 && resultC.out.indexOf(
    "FAIL  stale KNOWN key: modules/switch/pages/switch-prescriptions-smartts-bootle.html::Mounjaro") !== -1;
  const linkRulesUnaffected = resultC.out.indexOf("stale KNOWN key: www.smarttschemist.co.uk") === -1
    && resultC.out.indexOf("Support that delivers results") !== -1; // still printed as a normal KNOWN CLAIM hit
  console.log("Caught as the expected stale KNOWN_POM key:", caught);
  console.log("The five KNOWN link entries and the KNOWN_CLAIM entry unaffected:", linkRulesUnaffected);
  testC = { caught: caught, linkRulesUnaffected: linkRulesUnaffected, exitCode: resultC.exitCode,
    checkerRestoredOk: restoredCheckerSha === checkerOrigSha };
}

console.log("\n=== FINAL RE-CONFIRM: clean baseline after all mutations restored ===");
const finalRun = runChecker(SCRATCH);
console.log("exit code:", finalRun.exitCode);
console.log(finalRun.out.trim());
const finalPageSha = sha256File(PAGE);
const finalCheckerSha = sha256File(CHECKER);
console.log("Page sha256 matches original:", finalPageSha === pageOrigSha);
console.log("Checker sha256 matches original:", finalCheckerSha === checkerOrigSha);

console.log("\n=== DIFF SCRATCH VS LIVE (modules, core, tools, branches.json) ===");
try {
  execSync("diff -rq " + JSON.stringify(path.join(SCRATCH, "modules")) + " " + JSON.stringify(path.join(REPO, "modules")));
  execSync("diff -rq " + JSON.stringify(path.join(SCRATCH, "core")) + " " + JSON.stringify(path.join(REPO, "core")));
  execSync("diff -rq " + JSON.stringify(path.join(SCRATCH, "tools")) + " " + JSON.stringify(path.join(REPO, "tools")));
  execSync("diff -q " + JSON.stringify(path.join(SCRATCH, "branches.json")) + " " + JSON.stringify(path.join(REPO, "branches.json")));
  console.log("Scratch matches live tree exactly: true");
} catch (e) {
  console.log("Scratch DOES NOT match live tree - investigate before trusting this run:");
  console.log((e.stdout || "").toString());
}

console.log("\n=== CLEANUP ===");
execSync("rm -rf " + JSON.stringify(SCRATCH));
console.log("Scratch copy removed.");

console.log("\n=== SUMMARY ===");
console.log("Test A (blood-testing.html link fix landing):", JSON.stringify(testA));
console.log("Test B (claim wording fix landing):          ", JSON.stringify(testB));
console.log("Test C (synthetic KNOWN_POM entry):          ", JSON.stringify(testC));
const allCaught = testA.caught && testA.othersUnaffected
  && testB.caught && testB.othersUnaffected
  && testC.caught && testC.linkRulesUnaffected && testC.checkerRestoredOk;
console.log("\nAll three 'stale KNOWN key' cases (KNOWN, KNOWN_CLAIM, KNOWN_POM) caught precisely, "
  + "with no cross-firing on an unrelated entry:", allCaught);
console.log("Clean re-run after all restores, exit 0:", finalRun.exitCode === 0);
console.log("Live tree untouched throughout (scratch-only mutation):",
  finalPageSha === pageOrigSha && finalCheckerSha === checkerOrigSha);
