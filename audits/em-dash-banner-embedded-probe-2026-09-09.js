/*
  em-dash-banner-embedded-probe-2026-09-09.js

  Standalone, independently re-runnable proof for the item 5.1 quality pass
  (sixteenth), 2026-09-09: a switch banner paste file (modules/switch/pages/
  banners/*.txt) carries a real inline <style> block and a real inline
  <script> block - it is pasted whole into Weebly's site-wide Header Code
  field - but check-em-dashes.js's checkBannerFile only ever ran the
  ASCII-only line scan. It never called checkEmbeddedBlocks or
  checkEmbeddedAttributes, so a JS unicode escape or a CSS hex escape written
  inside the banner's own <style>/<script> text is pure ASCII by construction
  and passed the ASCII-only rule silently, then decodes to a real em/en dash
  the moment a browser evaluates the CSS or runs the JS.

  This script copies the repo into an isolated /tmp mirror (no .git, so the
  tracked repo is never opened for writing), injects three cases against the
  real check-em-dashes.js, restores the mirror's target file after each case
  by direct write-back, and confirms the tracked repo's own copy of the
  target banner is untouched throughout by sha256.

  Run:  node audits/em-dash-banner-embedded-probe-2026-09-09.js
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const MIRROR = "/tmp/rbh-em-dash-banner-probe-mirror";
const TARGET_REL = "modules/switch/pages/banners/switch-prescriptions-cherry-lane-walton.txt";
const TRACKED_TARGET = path.join(REPO, TARGET_REL);

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function copyDirExceptGit(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirExceptGit(s, d);
    else fs.copyFileSync(s, d);
  }
}

function runChecker(cwd) {
  try {
    const out = execFileSync("node", ["tools/check-em-dashes.js"], { cwd, encoding: "utf8" });
    return { exit: 0, out };
  } catch (err) {
    return { exit: err.status, out: (err.stdout || "") + (err.stderr || "") };
  }
}

const trackedBefore = sha256(TRACKED_TARGET);
console.log("Tracked repo target sha256 before: " + trackedBefore);

rmrf(MIRROR);
copyDirExceptGit(REPO, MIRROR);
const mirrorTarget = path.join(MIRROR, TARGET_REL);
const originalBytes = fs.readFileSync(mirrorTarget, "utf8");
console.log("Mirror target sha256 (should match tracked): " + sha256(mirrorTarget));

const baseline = runChecker(MIRROR);
console.log("Baseline (mirror, unmodified): exit " + baseline.exit);
if (baseline.exit !== 0) {
  console.log(baseline.out);
  throw new Error("Baseline should be clean before injecting anything.");
}

let allPassed = true;

function restore() {
  fs.writeFileSync(mirrorTarget, originalBytes, "utf8");
}

// Case A: CSS hex escape inside the real <style> block.
restore();
{
  const cssTarget = ".flu-header-banner span{ margin-right:12px; font-weight:500; display:inline-block; }";
  const text = fs.readFileSync(mirrorTarget, "utf8");
  if (!text.includes(cssTarget)) throw new Error("CSS injection target not found - banner file has changed shape.");
  const injected = text.replace(
    cssTarget,
    cssTarget.replace(
      "display:inline-block; }",
      "display:inline-block; } .flu-header-banner .flu-test-mark::before{content:\"\\2014\";}"
    )
  );
  fs.writeFileSync(mirrorTarget, injected, "utf8");
  const result = runChecker(MIRROR);
  const caught = result.exit === 1 && /CSS hex escape.*inline <style> block/.test(result.out);
  console.log("Case A (CSS hex escape in <style> block): " + (caught ? "CAUGHT (correct)" : "MISSED (BUG)"));
  if (!caught) { allPassed = false; console.log(result.out); }
}

// Case B: JS unicode escape inside the real <script> block's innerHTML string.
restore();
{
  const esc = String.fromCharCode(92) + "u2014"; // literal backslash-u-2014, not a real dash
  const text = fs.readFileSync(mirrorTarget, "utf8");
  const marker = "in 30 seconds.</span>";
  if (!text.includes(marker)) throw new Error("JS injection target not found - banner file has changed shape.");
  const injected = text.replace(marker, "in 30 seconds." + esc + "</span>");
  fs.writeFileSync(mirrorTarget, injected, "utf8");
  const result = runChecker(MIRROR);
  const caught = result.exit === 1 && /JS\/JSON unicode escape.*inline <script> block/.test(result.out);
  console.log("Case B (JS unicode escape in <script> block): " + (caught ? "CAUGHT (correct)" : "MISSED (BUG)"));
  if (!caught) { allPassed = false; console.log(result.out); }
}

// Control: a non-dash escape (the letter A, \0041) in the same style block
// must stay clean - proves the fix does not overreach.
restore();
{
  const cssTarget = ".flu-header-banner span{ margin-right:12px; font-weight:500; display:inline-block; }";
  const text = fs.readFileSync(mirrorTarget, "utf8");
  const injected = text.replace(
    cssTarget,
    cssTarget.replace(
      "display:inline-block; }",
      "display:inline-block; } .flu-header-banner .flu-test-mark2::before{content:\"\\0041\";}"
    )
  );
  fs.writeFileSync(mirrorTarget, injected, "utf8");
  const result = runChecker(MIRROR);
  const stillClean = result.exit === 0;
  console.log("Control (non-dash \\0041 escape, should stay clean): " + (stillClean ? "CORRECTLY CLEAN" : "FALSE POSITIVE (BUG)"));
  if (!stillClean) { allPassed = false; console.log(result.out); }
}

// Final restore and re-baseline.
restore();
const finalBaseline = runChecker(MIRROR);
console.log("Final restore baseline: exit " + finalBaseline.exit);
if (finalBaseline.exit !== 0 || finalBaseline.out.trim() !== baseline.out.trim()) {
  allPassed = false;
  console.log("Restored mirror output differs from original baseline - restore did not fully succeed.");
}

const trackedAfter = sha256(TRACKED_TARGET);
console.log("Tracked repo target sha256 after: " + trackedAfter);
if (trackedAfter !== trackedBefore) {
  allPassed = false;
  console.log("TRACKED REPO FILE CHANGED - this must never happen. Investigate immediately.");
}

rmrf(MIRROR);

if (!allPassed) {
  console.log("\nFAILED - see above.");
  process.exit(1);
}
console.log("\nALL CHECKS PASSED");
