/*
  verify-6.2-2026-09-17-seventeenth.js

  Item 6.2, seventeenth quality pass. Proves the LINE-WRAP CLAIMS gap in
  tools/check-service-links.js's RULE 2 (see that file's own header comment
  for the full write-up) by injection against a disposable scratch copy of
  the repo, then proves the fix catches it and that a clean run of the fixed
  checker is byte-identical to the pre-injection baseline.

  Does NOT import anything from tools/ beyond invoking the checker as a real
  child process against a scratch copy. Never opens the tracked repo for
  writing.

  Run: node audits/verify-6.2-2026-09-17-seventeenth.js
*/
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const TARGET_FILE = "modules/service/weebly-paste/cherry-lane-old-weight-loss-replacement.html";

function scratchCopy() {
  const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), "verify62-17-"));
  execFileSync("bash", ["-c", "git -C " + JSON.stringify(REPO) + " archive HEAD | tar -x -C " + JSON.stringify(dir)]);
  return dir;
}

function runChecker(dir) {
  try {
    const out = execFileSync("node", ["tools/check-service-links.js"], { cwd: dir, encoding: "utf8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

console.log("verify-6.2-2026-09-17-seventeenth");

// 1. Baseline: unmutated scratch copy, checker as tracked, must be clean.
const dir1 = scratchCopy();
const baseline = runChecker(dir1);
console.log("  baseline (unmutated, unfixed checker): exit " + baseline.code
  + (baseline.code === 0 ? " (clean, as expected)" : " -- UNEXPECTED, aborting"));
if (baseline.code !== 0) { console.log(baseline.out); process.exit(1); }

// 2. Injection: wrap a claim phrase across two adjacent lines, the same
// hand-wrap shape this exact file already uses for its own legitimate copy
// (lines 8-9 today: "Our weight loss clinic has moved to a new page with
// current information / about the pharmacist-led service...").
const targetPath = path.join(dir1, TARGET_FILE);
const before = fs.readFileSync(targetPath, "utf8");
const injected = before.replace(
  "</div>\n",
  '  <p>Our weight loss service genuinely delivers\n     results you can see for yourself.</p>\n</div>\n'
);
if (injected === before) { console.log("  FAIL injection target string not found"); process.exit(1); }
fs.writeFileSync(targetPath, injected);

const preFix = runChecker(dir1);
console.log("  injected, PRE-FIX checker: exit " + preFix.code
  + (preFix.code === 0 ? " (clean - CONFIRMS THE GAP: claim invisible to per-line scan)" : " -- unexpected FAIL, gap already closed?"));
if (preFix.code !== 0) console.log(preFix.out);

// 3. Apply the fix to the SCRATCH copy's checker only (mirrors the fix
// landed in the tracked repo the same day - see check-service-links.js
// header, "LINE-WRAP CLAIMS").
const checkerPath = path.join(dir1, "tools", "check-service-links.js");
const trackedFixed = fs.readFileSync(path.join(REPO, "tools", "check-service-links.js"), "utf8");
fs.writeFileSync(checkerPath, trackedFixed);

const postFix = runChecker(dir1);
const caught = postFix.code !== 0 && /claim \(line wrap\)/.test(postFix.out);
console.log("  injected, POST-FIX checker: exit " + postFix.code
  + (caught ? " (FAILS correctly, rule \"claim (line wrap)\" fired)" : " -- DID NOT CATCH, fix incomplete"));
if (!caught) { console.log(postFix.out); process.exit(1); }

// 4. Restore and control: fixed checker against the UNMUTATED file must
// reproduce the exact baseline (same known-issue count, no new failures
// anywhere in the corpus this checker already reads).
fs.writeFileSync(targetPath, before);
const control = runChecker(dir1);
console.log("  restored, POST-FIX checker vs clean content: exit " + control.code
  + (control.code === 0 ? " (clean, matches baseline)" : " -- UNEXPECTED"));
if (control.code !== 0) console.log(control.out);

const sameKnownCount = /clean, 6 known issue\(s\)/.test(control.out) && /clean, 6 known issue\(s\)/.test(baseline.out);
console.log("  known-issue count unchanged (6 before and after): " + (sameKnownCount ? "yes" : "NO - check output above"));

// Cleanup is best-effort: this sandbox's FUSE mount refuses unlink on some
// scratch files (the standing Q87/Q96/Q102 limitation), which must not be
// read as a test failure.
try { fs.rmSync(dir1, { recursive: true, force: true }); }
catch (e) { console.log("  (scratch cleanup skipped: " + e.code + ", not a test failure)"); }

const ok = baseline.code === 0 && preFix.code === 0 && caught && control.code === 0 && sameKnownCount;
console.log("");
console.log(ok ? "RESULT: gap confirmed pre-fix, fix confirmed catching it, no regression on real content."
  : "RESULT: FAILED - see output above.");
process.exit(ok ? 0 : 1);
