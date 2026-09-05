/*
  verify-6.2-2026-09-05-ninth.js

  Item 6.2, ninth quality pass, 2026-09-05 (fourth unattended run today).

  FRESH ANGLE. Every prior 6.2 pass that tested a "stop rather than quietly
  weaken the rule" fail-safe in tools/check-service-links.js used a branch
  with no special role in the checker's own hardcoded tables: the seventh
  pass (2026-09-03) disposed gordonshorts_crosby to prove the PAGE_DIRS
  "page(s) not attributable to a branch host" guard; the eighth pass
  (2026-09-04) renamed away the six EXTRA_FILES and two EXTRA_JS_COPY_FILES
  to prove the "file(s) listed ... but not present" guards. Neither pass
  touched cherry-lane_walton specifically, and no pass has ever exercised
  EXTRA_LINK_HOST_SLUG - the small lookup table (checker lines ~168-171)
  that resolves the two Cherry Lane "old page" replacement files
  (modules/service/weebly-paste/cherry-lane-old-*-replacement.html) against
  their own branch host by slug, via:

      const selfHost = slug ? (hostOfSlug.get(slug) || null) : null;

  That `|| null` exists so a relative href in one of those two files
  degrades to "unattributed relative link" (reported, not silently passed)
  if cherry-lane-walton's slug ever stops resolving - the same
  stop-rather-than-weaken convention the seventh and eighth passes proved
  elsewhere. This pass asks the question no prior pass asked of this
  specific line: does that fallback actually get exercised in practice, or
  does something else in the script fire first?

  METHOD. Two realistic data-drift injections on cherrylane_liverpool
  (disposed:true; and a townSlug rename, walton -> walton-ninthtest, the
  exact seoTown-moves shape CLAUDE.md documents for McCanns Sandringham),
  each written to branches.json, the real checker run as a child process,
  output captured, then branches.json restored from an in-memory buffer and
  sha256-reconfirmed identical to the pre-injection hash before any
  assertion is drawn. No import from tools/check-service-links.js itself
  beyond invoking it as a subprocess, per this item's established
  convention.

  HYPOTHESIS UNDER TEST. cherry-lane-walton is not just referenced by
  EXTRA_LINK_HOST_SLUG - it is also a full trading branch with its own
  PAGE_DIRS pages (switch and service pages, generated under filenames
  ending "-cherry-lane-walton.html"). The PAGE_DIRS "unattributed" check
  (checker lines ~271-277) runs BEFORE the EXTRA_FILES loop and calls
  process.exit(1) immediately if any generated page cannot be attributed to
  a host. Since disposing or renaming cherry-lane-walton removes its slug
  from `slugs` (built only from non-disposed branches with the CURRENT
  brandSlug/townSlug), Cherry Lane's own already-generated PAGE_DIRS pages
  (whose filenames do not change, since this test edits data only, not
  output) stop matching any slug and become unattributed FIRST - so the
  script should exit before ever reaching the EXTRA_FILES loop that
  contains the EXTRA_LINK_HOST_SLUG line under test.

  If that is right, the `|| null` fallback in EXTRA_LINK_HOST_SLUG's lookup
  is currently unreachable dead code for this specific branch under the
  script's present structure: not a live breach (the earlier guard still
  stops the run correctly, so nothing mis-resolves or passes silently), but
  a fresh finding this item's eight prior passes did not surface, because
  none of them combined "a branch referenced by EXTRA_LINK_HOST_SLUG" with
  "a branch whose own slug is made to fail" in one probe.
*/
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const crypto = require("crypto");

const REPO = path.join(__dirname, "..");
const BRANCHES = path.join(REPO, "branches.json");
const CHECKER = path.join(REPO, "tools", "check-service-links.js");

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function runChecker() {
  try {
    const out = execFileSync(process.execPath, [CHECKER], { cwd: REPO, encoding: "utf8" });
    return { exitCode: 0, out: out };
  } catch (e) {
    return { exitCode: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

const originalBuf = fs.readFileSync(BRANCHES);
const originalSha = sha256(originalBuf);
console.log("Baseline branches.json sha256:", originalSha);

const EXPECTED_BASELINE_SHA = "904de09bc3118cefcfd7ae3f8e045b9ea1d090c634c70114f135101f0b969e1e";
if (originalSha !== EXPECTED_BASELINE_SHA) {
  console.log("NOTE: baseline sha differs from the value recorded at run start ("
    + EXPECTED_BASELINE_SHA + "). Proceeding anyway using the live file as truth, "
    + "but this should be reconciled before trusting the restore step blindly.");
}

console.log("\n=== BASELINE RUN (no injection) ===");
const baseline = runChecker();
console.log("exit code:", baseline.exitCode);
console.log(baseline.out.trim().split("\n").slice(0, 3).join("\n"));
if (baseline.exitCode !== 0) {
  console.log("FAIL: baseline is not clean; aborting before any injection.");
  process.exit(1);
}

function withInjection(label, mutateFn, expectSubstring) {
  console.log("\n=== " + label + " ===");
  const data = JSON.parse(originalBuf.toString("utf8"));
  const branch = data.branches.find(function (b) { return b.id === "cherrylane_liverpool"; });
  if (!branch) { console.log("FAIL: cherrylane_liverpool not found in branches.json"); process.exit(1); }
  mutateFn(branch);
  fs.writeFileSync(BRANCHES, JSON.stringify(data, null, 2) + "\n");
  const result = runChecker();
  console.log("exit code:", result.exitCode);
  console.log(result.out.trim());

  // Restore before drawing any conclusion.
  fs.writeFileSync(BRANCHES, originalBuf);
  const restoredSha = sha256(fs.readFileSync(BRANCHES));
  const restoredOk = restoredSha === originalSha;
  console.log("Restored sha256 matches original:", restoredOk, restoredOk ? "" : ("(" + restoredSha + ")"));
  if (!restoredOk) {
    console.log("FAIL: restore did not reproduce the original file. STOPPING, do not trust further tests.");
    process.exit(1);
  }

  const caughtAsHypothesised = result.exitCode !== 0 && result.out.indexOf(expectSubstring) !== -1;
  const reachedExtraFilesSection = result.out.indexOf("non-generated public-copy file") !== -1;
  console.log("Caught by the top-level PAGE_DIRS unattributed guard as hypothesised:", caughtAsHypothesised);
  console.log("Ever printed the EXTRA_FILES summary line (would mean EXTRA_LINK_HOST_SLUG's line was reached):",
    reachedExtraFilesSection);
  return { caughtAsHypothesised: caughtAsHypothesised, reachedExtraFilesSection: reachedExtraFilesSection };
}

const testA = withInjection(
  "TEST A: disposed:true on cherrylane_liverpool",
  function (b) { b.disposed = true; },
  "not attributable to a branch host"
);

const testB = withInjection(
  "TEST B: townSlug rename, walton -> walton-ninthtest, on cherrylane_liverpool",
  function (b) { b.townSlug = "walton-ninthtest"; },
  "not attributable to a branch host"
);

// TEST C. Tests A and B proved that EXTRA_LINK_HOST_SLUG's own fallback line
// cannot be reached via any branches.json data drift on cherry-lane-walton,
// because the earlier PAGE_DIRS unattributed guard always fires first and
// exits before the EXTRA_FILES loop runs. That leaves one open question: can
// the line ever fire at all, or is it simply dead? The one realistic way to
// reach it without touching cherry-lane-walton's own generated pages is a
// maintenance typo in EXTRA_LINK_HOST_SLUG's own hardcoded slug string inside
// check-service-links.js itself (e.g. a future edit that fat-fingers the
// value while the branch itself, and the filenames on disk, stay untouched).
// This mutates the CHECKER SOURCE, not branches.json, restored the same way
// prior passes (fifth, eighth) restored service.js/switch.js after injection:
// sha256-confirmed byte-identical before any conclusion is drawn.
function sha256File(file) { return sha256(fs.readFileSync(file)); }

console.log("\n=== TEST C: typo in EXTRA_LINK_HOST_SLUG's own slug value (checker source, not data) ===");
const checkerOrig = fs.readFileSync(CHECKER);
const checkerOrigSha = sha256(checkerOrig);
const checkerText = checkerOrig.toString("utf8");
const needle = "\"modules/service/weebly-paste/cherry-lane-old-pharmacy-first-replacement.html\": \"cherry-lane-walton\",";
let testC;
if (checkerText.indexOf(needle) === -1) {
  console.log("FAIL: expected EXTRA_LINK_HOST_SLUG line not found verbatim; not mutating the checker. "
    + "Treat this as inconclusive for Test C rather than a pass.");
  testC = { skipped: true };
} else {
  const typoed = checkerText.replace(needle, needle.replace("cherry-lane-walton", "cherry-lane-waltn"));
  fs.writeFileSync(CHECKER, typoed);
  const resultC = runChecker();
  console.log("exit code:", resultC.exitCode);
  console.log(resultC.out.trim());
  fs.writeFileSync(CHECKER, checkerOrig);
  const restoredCheckerSha = sha256File(CHECKER);
  console.log("Checker restored sha256 matches original:", restoredCheckerSha === checkerOrigSha);
  if (restoredCheckerSha !== checkerOrigSha) {
    console.log("FAIL: checker restore did not reproduce the original file. STOPPING.");
    process.exit(1);
  }
  const onlyTargetFileFailed = resultC.out.indexOf(
    "cherry-lane-old-pharmacy-first-replacement.html: relative href \"/pharmacy-first-cherry-lane-walton.html\" "
    + "but this file has no single branch host to check it against") !== -1;
  const otherFileUnaffected = resultC.out.indexOf("cherry-lane-old-weight-loss-replacement.html") === -1;
  const noTopLevelUnattributedExit = resultC.out.indexOf("not attributable to a branch host") === -1;
  console.log("Fallback fired correctly, naming only the typoed file's own relative href:", onlyTargetFileFailed);
  console.log("The other EXTRA_LINK_HOST_SLUG entry (untouched key) stayed unaffected:", otherFileUnaffected);
  console.log("Cherry Lane's own PAGE_DIRS pages were NOT caught up in this failure:", noTopLevelUnattributedExit);
  testC = {
    exitCode: resultC.exitCode,
    onlyTargetFileFailed: onlyTargetFileFailed,
    otherFileUnaffected: otherFileUnaffected,
    noTopLevelUnattributedExit: noTopLevelUnattributedExit,
    checkerRestoredOk: restoredCheckerSha === checkerOrigSha
  };
}

console.log("\n=== FINAL RE-CONFIRM: clean baseline after both injections restored ===");
const finalRun = runChecker();
console.log("exit code:", finalRun.exitCode);
console.log(finalRun.out.trim().split("\n").slice(0, 3).join("\n"));
const finalSha = sha256(fs.readFileSync(BRANCHES));
console.log("Final branches.json sha256 matches original:", finalSha === originalSha);

console.log("\n=== SUMMARY ===");
console.log("Test A (disposed):    ", JSON.stringify(testA));
console.log("Test B (slug rename): ", JSON.stringify(testB));
console.log("Test C (checker typo):", JSON.stringify(testC));
const hypothesisConfirmed = testA.caughtAsHypothesised && !testA.reachedExtraFilesSection
  && testB.caughtAsHypothesised && !testB.reachedExtraFilesSection;
console.log("Data-drift hypothesis confirmed (EXTRA_LINK_HOST_SLUG's || null fallback is unreachable "
  + "via branches.json changes to cherry-lane-walton, because the earlier PAGE_DIRS unattributed "
  + "guard always fires first):", hypothesisConfirmed);
const fallbackProvenReachable = !testC.skipped && testC.exitCode === 1 && testC.onlyTargetFileFailed
  && testC.otherFileUnaffected && testC.noTopLevelUnattributedExit && testC.checkerRestoredOk;
console.log("Fallback proven reachable and correct via a checker-source typo (Test C):", fallbackProvenReachable);
console.log("Clean re-run after restore, exit 0:", finalRun.exitCode === 0);
console.log("branches.json restored byte-identical throughout:", finalSha === originalSha);
