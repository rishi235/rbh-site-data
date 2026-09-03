/*
  verify-6.2-2026-09-03-seventh.js  (item 6.2, seventh quality pass)

  Fresh angle not tested by any of the six prior 6.2 passes: does
  check-service-links.js correctly stop treating a branch's domain as "ours"
  the moment branches.json marks it disposed, even if that branch's
  already-generated pages are still sitting on disk (the exact shape a
  disposal-in-progress takes in practice, and the same shape Wilmslow's own
  disposal took before the generators learned to skip a disposed branch at
  item 1.4 - but tested here against check-service-links.js's OWN, separate
  host-resolution code, not the generators' skip logic, which is different
  code and has never been exercised by this checker before).

  Method: inject disposed:true on a real, non-shared-domain branch
  (gordonshorts_crosby - single host, no sister branch, so the blast radius
  of the injection is limited to that one branch's own 12 pages), run
  check-service-links.js as a real child process, capture its exit code and
  output, then restore branches.json to its exact pre-injection bytes and
  sha256-verify the restore before any assertion can throw and leave the
  file mutated on disk - the same discipline CLAUDE.md's weight loss section
  prescribes and every prior 6.2 injection probe has followed.

  Expectation under test: with gordonshorts_crosby disposed, its slug drops
  out of hostOfSlug, so its 12 already-generated pages (left on disk,
  unregenerated, exactly as a real disposal-in-progress would leave them)
  can no longer be attributed to a host. check-service-links.js's own
  "stop rather than quietly weaken the rule" convention for an unattributed
  page should fire: FAIL, not a silent pass and not a crash.
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const BRANCHES = path.join(REPO, "branches.json");

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const originalText = fs.readFileSync(BRANCHES, "utf8");
const originalHash = sha256(BRANCHES);
console.log("Baseline branches.json sha256:", originalHash);

// Refuse to run if the tree is already dirty on this file.
try {
  const diff = execSync("git diff --name-only -- branches.json", { cwd: REPO }).toString().trim();
  if (diff) { console.log("REFUSING: branches.json already has an uncommitted diff. Aborting."); process.exit(1); }
} catch (e) { /* git not available in this shell; proceed, sha256 restore still guards us */ }

let restored = false;
function restore() {
  if (restored) return;
  fs.writeFileSync(BRANCHES, originalText);
  const h = sha256(BRANCHES);
  restored = true;
  if (h !== originalHash) {
    console.log("RESTORE FAILED - sha256 mismatch:", h, "expected", originalHash);
    process.exitCode = 2;
  } else {
    console.log("Restored branches.json, sha256 verified identical:", h);
  }
}
process.on("exit", restore); // safety net if anything throws below

const data = JSON.parse(originalText);
const target = data.branches.find(b => b.id === "gordonshorts_crosby");
if (!target) { console.log("FAIL setup: gordonshorts_crosby not found"); process.exit(1); }
if (target.disposed) { console.log("FAIL setup: already disposed, not a clean baseline"); process.exit(1); }

target.disposed = true;
fs.writeFileSync(BRANCHES, JSON.stringify(data, null, 2) + "\n");
console.log("Injected disposed:true on gordonshorts_crosby. New sha256:", sha256(BRANCHES));

let out = "";
let code = 0;
try {
  out = execSync("node tools/check-service-links.js", { cwd: REPO, encoding: "utf8" });
} catch (e) {
  code = e.status;
  out = (e.stdout || "") + (e.stderr || "");
}

console.log("--- check-service-links.js output with gordonshorts_crosby disposed ---");
console.log(out);
console.log("--- exit code:", code, "---");

restore();

const caughtUnattributed = /not attributable to a branch host/i.test(out) && /gordon-short-crosby/i.test(out);
console.log("");
console.log("RESULT: exit code " + code + " (expect non-zero), unattributed-page FAIL mentioning "
  + "gordon-short-crosby pages: " + caughtUnattributed);
if (code !== 0 && caughtUnattributed) {
  console.log("PASS: check-service-links.js correctly refuses to run rather than silently mis-resolving "
    + "a disposed branch's still-on-disk pages.");
} else {
  console.log("UNEXPECTED: review output above by hand.");
}
