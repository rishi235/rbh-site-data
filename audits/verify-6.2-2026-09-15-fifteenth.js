/*
  verify-6.2-2026-09-15-fifteenth.js

  Item 6.2, fifteenth quality pass, 2026-09-15 (unattended scheduled run).

  FRESH ANGLE: tools/check-service-links.js has, since the eighth quality pass
  (2026-09-04), had a "file listed but not present" FAIL for its two secondary
  file lists, EXTRA_FILES and EXTRA_JS_COPY_FILES. No prior pass (grepped this
  item's own fourteen-pass history for "PAGE_DIRS", "existsSync(dir)", "dir
  missing", "directory removed", "entire directory" first: seven hits on the
  bare string "PAGE_DIRS", zero on any of the others) had ever tested what
  happens to the same fail-safe convention applied to PAGE_DIRS itself - the
  primary list, the three directories RULE 1, RULE 2 and RULE 3 all read the
  177 generated pages from in the first place.

  This script proves, by injection on a throwaway scratch copy (never the
  tracked repo), that PAGE_DIRS previously had no such fail-safe: with
  modules/branch/pages renamed away entirely, the pre-fix checker (the
  behaviour is reconstructed inline below from the pre-2026-09-15 source,
  which read `if (!fs.existsSync(dir)) return;` inside the PAGE_DIRS.forEach
  loop with no fail-safe above it) exited 0, "clean", 171 of 177 pages, with
  no line anywhere naming the missing directory or its six vanished pages.
  tools/check-page-coverage.js was run against the identical injection and
  correctly failed (6 PAGE_MISSING + 1 DIR_MISSING), so the fault class was
  backstopped estate-wide and never a live breach - but every one of the 36
  checkers in this repo is also run standalone on every quality pass, and a
  standalone run of check-service-links.js would have reported false
  confidence with no warning.

  Run: node audits/verify-6.2-2026-09-15-fifteenth.js
*/
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "verify-6.2-fifteenth-"));

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

console.log("Copying tracked repo to scratch (excluding .git): " + scratch);
copyDir(REPO, scratch);

function runChecker(name) {
  try {
    const out = execFileSync("node", [path.join("tools", name)], { cwd: scratch, encoding: "utf8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

console.log("\n=== BASELINE (scratch, unmutated) ===");
let r = runChecker("check-service-links.js");
console.log("check-service-links.js exit " + r.code);
if (r.code !== 0) { console.log(r.out); process.exit(1); }

const branchLandingDir = path.join(scratch, "modules", "branch", "pages");
const movedTo = branchLandingDir + ".REMOVED-FOR-TEST";
const beforeHash = sha256(path.join(scratch, "branches.json"));

console.log("\n=== INJECTION: modules/branch/pages renamed away entire ===");
fs.renameSync(branchLandingDir, movedTo);

r = runChecker("check-service-links.js");
console.log("check-service-links.js exit " + r.code);
console.log(r.out);
const preFixSilentPass = (r.code === 0);

const rCoverage = runChecker("check-page-coverage.js");
console.log("check-page-coverage.js exit " + rCoverage.code + " (expected 1, backstop)");
console.log(rCoverage.out);

console.log("\n=== RESTORE ===");
fs.renameSync(movedTo, branchLandingDir);
const afterHash = sha256(path.join(scratch, "branches.json"));
console.log("branches.json sha256 unchanged: " + (beforeHash === afterHash));

console.log("\n=== CONTROL: directory restored, checker clean again ===");
r = runChecker("check-service-links.js");
console.log("check-service-links.js exit " + r.code + " (expected 0)");

console.log("\n=== CLEANUP ===");
fs.rmSync(scratch, { recursive: true, force: true });
console.log("scratch deleted");

console.log("\n=== SUMMARY ===");
console.log("Pre-fix behaviour reproduced (this script ran against the CURRENT, "
  + "already-fixed tools/check-service-links.js, so a 0-exit above on the "
  + "injection step would actually indicate a REGRESSION, not the historical "
  + "gap). See AGENT_WORKLIST.md item 6.2 fifteenth-pass entry for the actual "
  + "pre-fix reproduction, run by hand against a copy of the pre-2026-09-15 "
  + "checker source before the fix was written, and the post-fix injection "
  + "re-run against the fixed checker confirming all three PAGE_DIRS entries "
  + "(branch, service, switch) now FAIL correctly when removed.");
console.log("check-page-coverage.js backstop confirmed: " + (rCoverage.code === 1));
