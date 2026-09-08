/*
  audits/verify-6.2-2026-09-08-twelfth.js

  Item 6.2, twelfth quality pass, 2026-09-08.

  FRESH ANGLE: check-service-links.js's own header notes that RULE 3's
  medicine union "stops outright on an empty union so a silently empty list
  can never present itself as a clean estate (the run-151 lesson)". Grepped
  this item's full eleven-pass history in AGENT_WORKLIST.md for
  "POM name union", "POM_NAMES.length" and "empty POM" before starting: zero
  matches. That fail-safe had never been proven by injection, and - more to
  the point - no prior pass had asked whether the OTHER checkers that import
  tools/pom-names.js share the same protection.

  Five checkers require tools/pom-names.js: check-service-links.js,
  check-pharmacy-first-symptoms.js, check-weight-loss-copy.js,
  check-travel-clinic-copy.js and check-switch-copy.js. This script proves,
  against a disposable scratch copy of the repo (never the live tree), that
  BEFORE this pass's fix only two of the five refused to run on an emptied
  source list; the other three reported "OK - no failures" with zero medicine
  checks performed, which is exactly the failure mode check-service-links.js
  was built to prevent. AFTER the fix (three small guards added to
  check-travel-clinic-copy.js, check-switch-copy.js and
  check-weight-loss-copy.js, matching the shape already used by
  check-service-links.js and check-pharmacy-first-symptoms.js) all five
  correctly fail.

  Run against the LIVE tree, this script only re-proves the post-fix
  behaviour (it copies the live tree to a scratch directory, mutates the
  scratch copy's tools/pom-names.js, and restores nothing on the live tree,
  since nothing on the live tree is ever touched).

  Run:  node audits/verify-6.2-2026-09-08-twelfth.js
*/
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");

function cpR(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === ".git") continue; // not needed for these checkers, faster copy
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) cpR(s, d);
    else fs.copyFileSync(s, d);
  }
}

function run(scratch, script) {
  try {
    execFileSync("node", [script], { cwd: scratch, stdio: "pipe" });
    return { rc: 0, out: "" };
  } catch (e) {
    return { rc: e.status == null ? 1 : e.status, out: (e.stdout || "").toString() + (e.stderr || "").toString() };
  }
}

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "verify-6.2-twelfth-"));
console.log("scratch dir: " + scratch);
cpR(REPO, scratch);

const pomFile = path.join(scratch, "tools", "pom-names.js");
const before = fs.readFileSync(pomFile, "utf8");

const CHECKERS = [
  "tools/check-service-links.js",
  "tools/check-pharmacy-first-symptoms.js",
  "tools/check-weight-loss-copy.js",
  "tools/check-travel-clinic-copy.js",
  "tools/check-switch-copy.js"
];

console.log("\n=== CONTROL (unmutated scratch copy, should all be RC=0) ===");
let controlOk = true;
CHECKERS.forEach(function (c) {
  const r = run(scratch, c);
  console.log("  " + c + " -> RC=" + r.rc);
  if (r.rc !== 0) { controlOk = false; console.log(r.out); }
});
if (!controlOk) { console.log("\nFAIL control run was not clean - aborting"); process.exit(1); }

console.log("\n=== INJECTION: empty all five source arrays in the scratch copy's pom-names.js ===");
let mutated = before;
["WEIGHT_LOSS", "PHARMACY_FIRST", "CONTRACEPTION", "TRAVEL_VACCINES", "ANTIMALARIALS"].forEach(function (name) {
  const re = new RegExp("const " + name + " = \\[[\\s\\S]*?\\];");
  const m = mutated.match(re);
  if (!m) throw new Error("anchor not found: " + name);
  mutated = mutated.replace(re, "const " + name + " = [];");
});
if (mutated === before) throw new Error("mutation had no effect");
fs.writeFileSync(pomFile, mutated);

let allCaught = true;
CHECKERS.forEach(function (c) {
  const r = run(scratch, c);
  const caught = r.rc !== 0;
  console.log("  " + c + " -> RC=" + r.rc + (caught ? "  CAUGHT" : "  *** NOT CAUGHT ***"));
  if (!caught) allCaught = false;
});

console.log("\n=== RESTORE CHECK (scratch copy only; live tree was never touched) ===");
fs.writeFileSync(pomFile, before);
const after = fs.readFileSync(pomFile, "utf8");
console.log("  scratch pom-names.js restored, byte-identical to pre-injection: " + (after === before));

fs.rmSync(scratch, { recursive: true, force: true });
console.log("  scratch dir removed");

console.log("\nRESULT: " + (allCaught
  ? "all five checkers correctly refuse to run on an emptied POM source list."
  : "at least one checker did NOT catch the emptied list - see output above."));
process.exit(allCaught ? 0 : 1);
