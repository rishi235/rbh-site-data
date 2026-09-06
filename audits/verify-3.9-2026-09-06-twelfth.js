/*
  Item 3.9 quality pass (twelfth machine-era pass), 2026-09-06.

  Coleman and Leighs Pharmacy (Walton). Ten prior quality passes (2026-08-12
  through 2026-09-05) have proven, by direct injection or exhaustive
  extraction, every checker EXCEPT the flagship title/H1/description checker
  itself: grep of this item's own AGENT_WORKLIST.md section against every
  tools/check-*.js filename showed zero mentions of check-seo-pattern.js in
  eleven passes, despite it being the checker item 3.1-3.13 exists to define
  and roll out, and despite Coleman and Leighs being the ORIGIN case for
  Q14/fitTitle() (the longest trading name in the estate, "Coleman and Leighs
  Pharmacy", meeting the longest NHS condition name, "Infected insect bite
  treatment", at 70 characters before the fix). Closed this run.

  Two parts:
    PART A - four standard check-seo-pattern.js injections against four of
    this branch's own pages, each restored from an in-memory buffer and
    sha256-reconfirmed before the next, run against the REAL checker.
    PART B - a boundary-specific test of fitTitle()/switchTitle() in
    isolation (no file mutation at all - calls the real exported functions
    from tools/seo-pattern.js with a synthetic branch object), because this
    branch's real switch title ("Switch Your Prescriptions to Coleman and
    Leighs Pharmacy, Walton") sits at 64 characters, one character under the
    65-character limit fitTitle enforces - the tightest margin of any title
    in the estate and the brand fitTitle exists to protect. No prior pass on
    this item has tested that margin directly.

  Run against the LIVE tree (not a scratch copy) for Part A: every mutation
  is self-restoring and immediately sha256-verified, the same choice the
  3.4 thirteenth-pass and 3.13 tenth-pass audits made for the same reason.
  Refuses to run if any target file already carries a git diff.
*/
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const REPO = path.resolve(__dirname, "..");
const CHECKER = path.join(REPO, "tools", "check-seo-pattern.js");

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function gitDiffEmpty(relPath) {
  const out = execSync(`git status --porcelain -- "${relPath}"`, { cwd: REPO }).toString();
  return out.trim() === "";
}

function runChecker() {
  try {
    const out = execSync(`node "${CHECKER}"`, { cwd: REPO, stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, out: out.toString() };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "").toString() + (e.stderr || "").toString() };
  }
}

function mutateRunRestore(label, relPath, mutateFn, expectSubstr) {
  const abs = path.join(REPO, relPath);
  if (!gitDiffEmpty(relPath)) {
    throw new Error(`REFUSING: ${relPath} already carries a git diff before this test`);
  }
  const original = fs.readFileSync(abs);
  const originalHash = sha256(original);
  let result;
  try {
    const mutated = mutateFn(original.toString("utf8"));
    fs.writeFileSync(abs, mutated, "utf8");
    result = runChecker();
  } finally {
    fs.writeFileSync(abs, original);
    const restoredHash = sha256(fs.readFileSync(abs));
    if (restoredHash !== originalHash) {
      throw new Error(`RESTORE FAILED for ${relPath}: hash mismatch after restore`);
    }
  }
  const caught = result.code !== 0 && result.out.includes(expectSubstr);
  console.log(`[${caught ? "CAUGHT" : "MISSED"}] ${label} (${relPath})`);
  if (!caught) {
    console.log("  --- checker output ---");
    console.log(result.out.split("\n").slice(0, 15).join("\n"));
  }
  if (!gitDiffEmpty(relPath)) {
    throw new Error(`POST-CHECK FAILED: ${relPath} still carries a diff after restore`);
  }
  return caught;
}

console.log("=== PART A: check-seo-pattern.js injections against Coleman and Leighs Pharmacy ===\n");

const baseline = runChecker();
console.log(`Baseline before any mutation: exit ${baseline.code}`);
if (baseline.code !== 0) {
  console.log(baseline.out);
  throw new Error("Baseline is not clean - aborting, will not inject into a dirty repo state");
}

let allCaught = true;

// 1) EXACT TITLE MATCH - append text to the Weebly SEO title line
allCaught = mutateRunRestore(
  "EXACT TITLE MATCH",
  "modules/service/pages/pharmacy-first-coleman-leigh-walton.html",
  (src) => src.replace(
    /(Weebly page SEO title:\s*Pharmacy First at Coleman and Leighs Pharmacy, Walton)/,
    "$1 - Now Open Weekends"
  ),
  "title"
) && allCaught;

// 2) CROSS-TOWN ABSENCE - name a live seoTown not in this branch's serviceAreaList
allCaught = mutateRunRestore(
  "CROSS-TOWN ABSENCE (Ainsdale, not in Walton/Liverpool/Sefton)",
  "modules/service/pages/sinusitis-treatment-coleman-leigh-walton.html",
  (src) => src.replace(
    /(Weebly page SEO description:[^\n]*NHS Pharmacy First service[^\n]*needed\.)/,
    "$1 Also serving patients from Ainsdale."
  ),
  "Ainsdale"
) && allCaught;

// 3) ONE H1 - duplicate the heading
allCaught = mutateRunRestore(
  "ONE H1",
  "modules/service/pages/sore-throat-treatment-coleman-leigh-walton.html",
  (src) => src.replace(
    /(<h1>Sore throat treatment in Walton<\/h1>)/,
    "$1\n          <h1>Pharmacy in Ainsdale</h1>"
  ),
  "h1 elements, expected exactly 1"
) && allCaught;

// 4) ONE TITLE LINE - duplicate the head-comment SEO title line
allCaught = mutateRunRestore(
  "ONE TITLE LINE",
  "modules/switch/pages/switch-prescriptions-coleman-leigh-walton.html",
  (src) => src.replace(
    /(Weebly page SEO title:[^\n]*\n)/,
    "$1  Weebly page SEO title:       Pharmacy in Ainsdale\n"
  ),
  "'Weebly page SEO title' lines, expected exactly 1"
) && allCaught;

console.log("\nFull suite re-check after Part A:");
const afterA = runChecker();
console.log(`exit ${afterA.code}`);
if (afterA.code !== 0) {
  console.log(afterA.out);
  throw new Error("Repo not clean after Part A restores");
}

console.log("\n=== PART B: fitTitle()/switchTitle() boundary test (no file mutation) ===\n");

const seoPattern = require(path.join(REPO, "tools", "seo-pattern.js"));

// Real branch, unmodified - confirm the real 64-character switch title still
// carries the FULL brand (fitTitle should NOT fire, since 64 <= 65).
const realBranch = {
  brandLabel: "Coleman and Leighs Pharmacy",
  seoTown: "Walton"
};
const realSwitchTitle = seoPattern.switchTitle(realBranch);
console.log(`Real switch title: "${realSwitchTitle}" (${realSwitchTitle.length} chars)`);
if (realSwitchTitle.length > 65) throw new Error("Real switch title unexpectedly over 65 chars");
if (!realSwitchTitle.includes("Coleman and Leighs Pharmacy")) {
  throw new Error("Real switch title unexpectedly shortened - fitTitle fired when it should not have");
}
if (realSwitchTitle.length !== 64) {
  console.log(`  NOTE: expected 64 chars per the seo-pattern.js header comment, got ${realSwitchTitle.length} - re-read the comment, this may be stale, not a defect.`);
}

// Synthetic branch: one character longer seoTown, pushing the composed
// switch title from 64 to 65 - still must NOT trigger the shortener (<=65).
const boundaryBranch = {
  brandLabel: "Coleman and Leighs Pharmacy",
  seoTown: "Waltonn" // +1 char, synthetic, never written to any tracked file
};
const boundaryTitle = seoPattern.switchTitle(boundaryBranch);
console.log(`Boundary (+1 char town) switch title: "${boundaryTitle}" (${boundaryTitle.length} chars)`);
if (boundaryTitle.length !== 65) {
  throw new Error(`Expected exactly 65 chars at the +1 boundary, got ${boundaryTitle.length}`);
}
if (!boundaryTitle.includes("Coleman and Leighs Pharmacy")) {
  throw new Error("Boundary title shortened at exactly 65 chars - fitTitle should only fire when OVER the limit, not at it");
}
console.log("[CAUGHT] fitTitle correctly leaves a 65-character title untouched (over is > 65, not >= 65)");

// Synthetic branch: two characters longer seoTown, pushing the composed
// switch title to 66 - MUST trigger the shortener (brand loses " Pharmacy").
const overBranch = {
  brandLabel: "Coleman and Leighs Pharmacy",
  seoTown: "Waltonnn" // +2 chars, synthetic, never written to any tracked file
};
const overTitle = seoPattern.switchTitle(overBranch);
console.log(`Over-limit (+2 char town) switch title: "${overTitle}" (${overTitle.length} chars)`);
if (overTitle.includes("Coleman and Leighs Pharmacy")) {
  throw new Error("fitTitle FAILED to shorten a title that should be over 65 chars - Q14 regression");
}
if (!overTitle.includes("Coleman and Leighs,")) {
  throw new Error(`Expected the shortened brand "Coleman and Leighs" in the retried title, got "${overTitle}"`);
}
if (overTitle.length > 65 && overTitle.length >= (overBranch.brandLabel.length)) {
  // sanity only, not a hard rule - fitTitle never returns something longer than the full-brand attempt
}
console.log(`[CAUGHT] fitTitle correctly drops " Pharmacy" once the composed title exceeds 65 chars (${overTitle.length} chars with shortened brand)`);

// Also prove searchTitle (family A - the actual Q14 origin page type) behaves
// the same way for the real branch's longest condition name.
const searchTitleReal = seoPattern.searchTitle("Infected insect bite treatment", realBranch);
console.log(`Real family-A title (insect bite): "${searchTitleReal}" (${searchTitleReal.length} chars)`);
if (searchTitleReal.includes("Coleman and Leighs Pharmacy")) {
  throw new Error("Q14 REGRESSION: family-A title for insect-bite should carry the SHORTENED brand, carries the full brand instead");
}
if (!searchTitleReal.endsWith("Coleman and Leighs")) {
  throw new Error(`Expected family-A title to end with the shortened brand, got "${searchTitleReal}"`);
}
console.log("[CAUGHT] Q14's own origin case (insect bite / Coleman and Leighs) still composes with the shortened brand as designed");

console.log("\n=== RESULT ===");
console.log(allCaught ? "Part A: all 4 injections caught on first attempt." : "Part A: one or more injections MISSED - see above.");
console.log("Part B: fitTitle/switchTitle/searchTitle boundary behaviour confirmed correct at 64, 65 and 66 characters, and reconfirmed against the real Q14 origin page type.");
console.log("No checker logic, generator, page or branches.json content changed in the tracked repo.");

const finalCheck = runChecker();
console.log(`\nFinal full check-seo-pattern.js run: exit ${finalCheck.code}`);
if (finalCheck.code !== 0) {
  throw new Error("Repo not clean at end of script");
}

if (!allCaught) {
  process.exitCode = 1;
}
