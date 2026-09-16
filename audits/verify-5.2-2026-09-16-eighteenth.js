"use strict";
// audits/verify-5.2-2026-09-16-eighteenth.js
// Injection harness for item 5.2 (branch landing pages), eighteenth quality pass.
// Target: tools/check-page-coverage.js's "branch landing pages" section (lines
// 217-286), never proven by injection in this item's seventeen-pass history
// despite being the exact checker whose LANDING_NOT_BUILT warnings created
// this item (item 2.2 / item 5.2's own opening line).
//
// Runs entirely against a scratch copy at /tmp/rbh-scratch-5.2, itself copied
// from the tracked repo (branches.json, tools/, modules/) before this script
// ran. Never touches the tracked repo. Restores branches.json and the
// generator source from an in-memory buffer immediately after each
// injection's checker output is captured and before any assertion, the same
// discipline as passes 9-17 on this item.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const crypto = require("crypto");

const ROOT = __dirname;
const BJ = path.join(ROOT, "branches.json");
const GEN = path.join(ROOT, "tools", "build-branch-landing-pages.js");
const PAGES_DIR = path.join(ROOT, "modules", "branch", "pages");

function sha(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

const bjOrig = fs.readFileSync(BJ);
const genOrig = fs.readFileSync(GEN);
const bjOrigSha = sha(bjOrig);
const genOrigSha = sha(genOrig);

function restore() {
  fs.writeFileSync(BJ, bjOrig);
  fs.writeFileSync(GEN, genOrig);
  if (fs.existsSync(path.join(PAGES_DIR, "pharmacy-orphan-test.html"))) {
    fs.unlinkSync(path.join(PAGES_DIR, "pharmacy-orphan-test.html"));
  }
  const missingTarget = path.join(PAGES_DIR, "pharmacy-scorah-bramhall.html");
  if (!fs.existsSync(missingTarget) && global.__scorahBramhallBuf) {
    fs.writeFileSync(missingTarget, global.__scorahBramhallBuf);
  }
  const b1 = sha(fs.readFileSync(BJ));
  const g1 = sha(fs.readFileSync(GEN));
  if (b1 !== bjOrigSha) throw new Error("RESTORE FAILED: branches.json not byte-identical");
  if (g1 !== genOrigSha) throw new Error("RESTORE FAILED: generator not byte-identical");
}

function runChecker() {
  try {
    const out = execFileSync("node", ["tools/check-page-coverage.js", "--verbose"], { cwd: ROOT, encoding: "utf8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function section(title) { console.log("\n=== " + title + " ==="); }

// sanity: refuse if scratch already dirty relative to what we captured
if (sha(fs.readFileSync(BJ)) !== bjOrigSha) throw new Error("branches.json already dirty before round");

// --- Injection 1: STALE_ID ---------------------------------------------
section("Injection 1: STALE_ID (fake id in BUILD list)");
{
  let src = fs.readFileSync(GEN, "utf8");
  src = src.replace(
    /const BUILD = \[\n/,
    'const BUILD = [\n  "fake_branch_xyz",\n'
  );
  fs.writeFileSync(GEN, src);
  const r = runChecker();
  console.log("exit:", r.code);
  console.log(r.out.split("\n").filter(l => /STALE_ID/.test(l)).join("\n"));
  restore();
  console.log("restored, byte-identical confirmed");
}

// --- Injection 2: DISPOSED_LISTED ---------------------------------------
section("Injection 2: DISPOSED_LISTED (disposed branch added to BUILD list)");
{
  let bj = JSON.parse(fs.readFileSync(BJ, "utf8"));
  const b = bj.branches.find(x => x.id === "cherrylane_liverpool");
  if (!b) throw new Error("cherrylane_liverpool not found");
  b.disposed = true;
  fs.writeFileSync(BJ, JSON.stringify(bj, null, 2));
  let src = fs.readFileSync(GEN, "utf8");
  src = src.replace(
    /const BUILD = \[\n/,
    'const BUILD = [\n  "cherrylane_liverpool",\n'
  );
  fs.writeFileSync(GEN, src);
  const r = runChecker();
  console.log("exit:", r.code);
  console.log(r.out.split("\n").filter(l => /DISPOSED_LISTED/.test(l)).join("\n"));
  restore();
  console.log("restored, byte-identical confirmed");
}

// --- Injection 3: NOT_EARNED ---------------------------------------------
section("Injection 3: NOT_EARNED (brandSlug removed from a listed branch)");
{
  let bj = JSON.parse(fs.readFileSync(BJ, "utf8"));
  const b = bj.branches.find(x => x.id === "mccanns_aigburth");
  if (!b) throw new Error("mccanns_aigburth not found");
  delete b.brandSlug;
  fs.writeFileSync(BJ, JSON.stringify(bj, null, 2));
  const r = runChecker();
  console.log("exit:", r.code);
  console.log(r.out.split("\n").filter(l => /NOT_EARNED/.test(l)).join("\n"));
  restore();
  console.log("restored, byte-identical confirmed");
}

// --- Injection 4: PAGE_MISSING -------------------------------------------
section("Injection 4: PAGE_MISSING (Scorah Bramhall's own page deleted from disk)");
{
  const target = path.join(PAGES_DIR, "pharmacy-scorah-bramhall.html");
  global.__scorahBramhallBuf = fs.readFileSync(target);
  fs.unlinkSync(target);
  const r = runChecker();
  console.log("exit:", r.code);
  console.log(r.out.split("\n").filter(l => /PAGE_MISSING/.test(l)).join("\n"));
  restore();
  console.log("restored:", fs.existsSync(target), "byte-identical:", sha(fs.readFileSync(target)) === sha(global.__scorahBramhallBuf));
}

// --- Injection 5: LANDING_NOT_BUILT (warning) -----------------------------
section("Injection 5: LANDING_NOT_BUILT (scorah_hazel removed from BUILD list, branches.json untouched)");
{
  let src = fs.readFileSync(GEN, "utf8");
  const before = src;
  // Remove the whole array element cleanly (line + comma/newline), rather
  // than replacing the string value in place, which would leave a stale
  // placeholder id occupying the slot and trip STALE_ID instead of the
  // intended LANDING_NOT_BUILT warning.
  src = src.replace(/\n\s*"scorah_hazel"\n/, "\n");
  if (src === before) throw new Error("replace did not match");
  fs.writeFileSync(GEN, src);
  const r = runChecker();
  console.log("exit:", r.code);
  console.log(r.out.split("\n").filter(l => /LANDING_NOT_BUILT/.test(l)).join("\n"));
  restore();
  console.log("restored, byte-identical confirmed");
}

// --- Injection 6: LANDING_NOT_SHARED (warning) ----------------------------
section("Injection 6: LANDING_NOT_SHARED (Hazel Grove's website changed to a unique host)");
{
  let bj = JSON.parse(fs.readFileSync(BJ, "utf8"));
  const b = bj.branches.find(x => x.id === "scorah_hazel");
  if (!b) throw new Error("scorah_hazel not found");
  const origWebsite = b.website;
  b.website = "https://scorah-hazel-unique-test-host.co.uk";
  fs.writeFileSync(BJ, JSON.stringify(bj, null, 2));
  const r = runChecker();
  console.log("exit:", r.code);
  console.log("original website was:", origWebsite);
  console.log(r.out.split("\n").filter(l => /LANDING_NOT_SHARED/.test(l)).join("\n"));
  restore();
  console.log("restored, byte-identical confirmed");
}

// --- Injection 7: ORPHAN_PAGE ---------------------------------------------
section("Injection 7: ORPHAN_PAGE (stray file added to modules/branch/pages)");
{
  const strayPath = path.join(PAGES_DIR, "pharmacy-orphan-test.html");
  fs.writeFileSync(strayPath, "<html><body>stray test file, not earned by branches.json</body></html>");
  const r = runChecker();
  console.log("exit:", r.code);
  console.log(r.out.split("\n").filter(l => /ORPHAN_PAGE/.test(l)).join("\n"));
  restore();
  console.log("restored, stray file removed:", !fs.existsSync(strayPath));
}

// --- Control: unrelated field change, should stay clean on this section --
section("Control: unrelated field added to scorah_bramhall, should not fire any landing rule");
{
  let bj = JSON.parse(fs.readFileSync(BJ, "utf8"));
  const b = bj.branches.find(x => x.id === "scorah_bramhall");
  b.controlTestField = "unrelated, not read by check-page-coverage.js";
  fs.writeFileSync(BJ, JSON.stringify(bj, null, 2));
  const r = runChecker();
  console.log("exit:", r.code);
  const landingLines = r.out.split("\n").filter(l => /LANDING_NOT_BUILT|LANDING_NOT_SHARED|STALE_ID|DISPOSED_LISTED|NOT_EARNED|PAGE_MISSING|ORPHAN_PAGE/.test(l));
  console.log("landing-section findings (expect none):", landingLines.length ? landingLines.join("\n") : "(none)");
  restore();
  console.log("restored, byte-identical confirmed");
}

// --- Final restoration confirmation ---------------------------------------
section("Final state");
console.log("branches.json sha256 matches baseline:", sha(fs.readFileSync(BJ)) === bjOrigSha);
console.log("generator sha256 matches baseline:", sha(fs.readFileSync(GEN)) === genOrigSha);
const finalRun = runChecker();
console.log("final baseline re-run exit:", finalRun.code);
console.log(finalRun.out.split("\n").slice(-3).join("\n"));
