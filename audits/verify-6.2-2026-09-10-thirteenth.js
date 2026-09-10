/*
  verify-6.2-2026-09-10-thirteenth.js

  Item 6.2 quality pass (thirteenth). Fresh angle: tools/claim-patterns.js's
  CLAIM_PATTERNS list is shared by four checkers (check-service-links.js,
  check-seo-keywords.js, check-gbp-packs.js, check-weight-loss-copy.js), the
  same way tools/pom-names.js's medicine lists are shared by five - and the
  item 6.2 twelfth quality pass (2026-09-08) found that three of those five
  POM_NAMES consumers had no "stop rather than silently pass" guard against an
  emptied source list. No prior pass had asked the same question of
  CLAIM_PATTERNS.

  This script:
    1. Builds a scratch copy of the repo (no .git) in the OS temp dir.
    2. Confirms all four checkers are clean on the scratch copy.
    3. Empties CLAIM_PATTERNS in the scratch copy's tools/claim-patterns.js.
    4. Re-runs all four checkers as real child processes and records exit
       codes and output.
    5. Restores claim-patterns.js from an in-memory buffer, sha256-confirmed
       identical, before drawing any conclusion.
    6. Never touches the live tree. Imports nothing from tools/ beyond
       invoking the checkers as subprocesses.

  Run:  node audits/verify-6.2-2026-09-10-thirteenth.js
*/
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const CHECKERS = [
  "check-service-links",
  "check-seo-keywords",
  "check-gbp-packs",
  "check-weight-loss-copy"
];

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function copyRepo(dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(REPO);
  entries.forEach(function (name) {
    if (name === ".git") return;
    const src = path.join(REPO, name);
    fs.cpSync(src, path.join(dest, name), { recursive: true });
  });
}

function runChecker(dir, name) {
  try {
    const out = execFileSync(process.execPath, [path.join(dir, "tools", name + ".js")],
      { cwd: dir, encoding: "utf8" });
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status === undefined ? 1 : e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "verify-6.2-13th-"));
console.log("scratch dir: " + scratch);
copyRepo(scratch);

console.log("\n=== BASELINE (unmutated scratch copy) ===");
let baselineOk = true;
CHECKERS.forEach(function (c) {
  const r = runChecker(scratch, c);
  console.log("  " + c + ": exit " + r.code);
  if (r.code !== 0) { baselineOk = false; console.log(r.out); }
});
if (!baselineOk) {
  console.log("BASELINE NOT CLEAN - aborting, no conclusion drawn.");
  process.exit(1);
}

const claimPatternsPath = path.join(scratch, "tools", "claim-patterns.js");
const original = fs.readFileSync(claimPatternsPath);
const originalHash = sha256(original);
console.log("\noriginal tools/claim-patterns.js sha256: " + originalHash);

// Empty the CLAIM_PATTERNS array literal, leaving findClaim() and the module
// export intact so the checkers still load the module successfully.
const text = original.toString("utf8");
const marker = "const CLAIM_PATTERNS = [";
const start = text.indexOf(marker);
if (start === -1) throw new Error("CLAIM_PATTERNS marker not found - repo shape has changed");
const endMarker = "\n];";
const end = text.indexOf(endMarker, start);
if (end === -1) throw new Error("closing ]; not found - repo shape has changed");
const mutated = text.slice(0, start) + "const CLAIM_PATTERNS = [" + text.slice(end);
fs.writeFileSync(claimPatternsPath, mutated);

console.log("\n=== INJECTION: CLAIM_PATTERNS emptied ===");
const results = {};
CHECKERS.forEach(function (c) {
  const r = runChecker(scratch, c);
  results[c] = r;
  const caught = r.code !== 0;
  console.log("  " + c + ": exit " + r.code + " - " + (caught ? "CAUGHT" : "NOT CAUGHT (silent pass)"));
});

// Restore and confirm byte-identical before drawing any conclusion.
fs.writeFileSync(claimPatternsPath, original);
const restoredHash = sha256(fs.readFileSync(claimPatternsPath));
console.log("\nrestored tools/claim-patterns.js sha256: " + restoredHash
  + (restoredHash === originalHash ? "  (matches original)" : "  MISMATCH - DO NOT TRUST THIS RUN"));

console.log("\n=== POST-RESTORE CONTROL ===");
let controlOk = true;
CHECKERS.forEach(function (c) {
  const r = runChecker(scratch, c);
  console.log("  " + c + ": exit " + r.code);
  if (r.code !== 0) controlOk = false;
});
console.log(controlOk ? "All four clean again after restore." : "NOT CLEAN AFTER RESTORE - investigate.");

console.log("\n=== SUMMARY ===");
CHECKERS.forEach(function (c) {
  console.log("  " + c + ": " + (results[c].code !== 0 ? "caught the empty list" : "did NOT catch it"));
});

// Scratch copy left on disk for inspection; not deleted here because this
// sandbox's mount refuses unlink() on files created by a different process
// generation. Caller/operator can remove it; it holds no unique content.
console.log("\nDone. Scratch copy at " + scratch + " left in place (delete refused by this mount; harmless, no unique content).");
