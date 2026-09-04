/*
  verify-6.2-2026-09-04-eighth.js

  Item 6.2, eighth quality pass. Fresh angle not covered by any of the seven
  prior passes (confirmed by grepping AGENT_WORKLIST.md for "missingExtra",
  "missingJsCopy", "not present", "listed in tools/extra-public-copy-files"
  and "listed in EXTRA_JS_COPY_FILES" before writing this script - zero
  matches other than an unrelated line about live HTML content on item 4.2).

  check-service-links.js carries two "stop rather than quietly weaken the
  rule" fail-safes, added on the fourth pass (2026-08-31) and fifth pass
  (2026-09-01) respectively:

    - EXTRA_FILES (the six non-generated public-copy files): "A listed file
      that no longer exists fails the run rather than being skipped
      quietly" -> prints "FAIL  file(s) listed in tools/extra-public-copy-
      files.js but not present: <name>" and exits 1.
    - EXTRA_JS_COPY_FILES (service.js, switch.js): "A listed file that no
      longer exists fails the run, the same convention as EXTRA_FILES" ->
      prints "FAIL  file(s) listed in EXTRA_JS_COPY_FILES but not present:
      <name>" and exits 1.

  Both fail-safes exist specifically so that a file going missing (renamed,
  deleted, moved by a future refactor) cannot silently narrow RULE 2/RULE 3's
  coverage back down to PAGE_DIRS-only while the checker keeps reporting
  clean. Every prior 6.2 pass proved what the checker catches inside a file
  it reads; none proved that the checker notices when a file it is supposed
  to read has disappeared. That is the same "prove the stop-rather-than-
  weaken convention actually fires" shape the seventh pass used against the
  unattributed-page fail-safe (disposed branch injection) - this pass applies
  it to the two fail-safes the seventh pass did not touch.

  METHOD. For each of the eight listed files (six EXTRA_FILES, two
  EXTRA_JS_COPY_FILES) in turn: read its content into memory, rename it away
  with fs.renameSync (not delete - nothing is ever unlinked), run
  tools/check-service-links.js as a real child process, assert exit code 1
  and that stdout names the correct missing file under the correct message,
  then rename it back immediately and assert the restored file's bytes are
  identical (Buffer.compare) to what was read before the rename. Only one
  file is ever missing at a time. git status --porcelain on the relevant
  folders is checked empty before the first probe and after the last
  restore.
*/
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const crypto = require("crypto");

const REPO = path.join(__dirname, "..");
const CHECKER = path.join(REPO, "tools", "check-service-links.js");

const EXTRA_FILES = require(path.join(REPO, "tools", "extra-public-copy-files.js"))
  .EXTRA_HTML_SEGMENTS.map(function (segs) { return path.join.apply(path, [REPO].concat(segs)); });

const EXTRA_JS_COPY_FILES = [
  path.join(REPO, "modules", "service", "service.js"),
  path.join(REPO, "modules", "switch", "switch.js")
];

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }
function rel(p) { return path.relative(REPO, p).replace(/\\/g, "/"); }

function runChecker() {
  try {
    const out = execFileSync("node", [CHECKER], { cwd: REPO, encoding: "utf8" });
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function gitStatusEmpty(label) {
  const out = execFileSync("git", ["status", "--porcelain", "--",
    "modules", "core", "tools", "branches.json", "gbp-packs"], { cwd: REPO, encoding: "utf8" });
  console.log(label + ": git status --porcelain = " + JSON.stringify(out.trim()));
  if (out.trim() !== "") { throw new Error("Working tree not clean at " + label + ": " + out); }
}

console.log("=== verify-6.2-2026-09-04-eighth ===");
gitStatusEmpty("before any probe");

const baseline = runChecker();
console.log("Baseline run: exit " + baseline.code);
if (baseline.code !== 0) { throw new Error("Baseline check-service-links.js was not clean; aborting."); }

let pass = 0, fail = 0;

function probe(file, expectedMessageFragment, label) {
  const original = fs.readFileSync(file);
  const originalHash = sha256(original);
  const tmpPath = file + ".__verify6_2_missing__";
  fs.renameSync(file, tmpPath);
  let result;
  try {
    result = runChecker();
  } finally {
    // Always restore before asserting, so a thrown assertion never leaves the
    // repo mutated.
    fs.renameSync(tmpPath, file);
  }
  const restored = fs.readFileSync(file);
  const restoredHash = sha256(restored);
  const restoredOk = restoredHash === originalHash && Buffer.compare(original, restored) === 0;
  const caught = result.code === 1 && result.out.indexOf(expectedMessageFragment) !== -1
    && result.out.indexOf(rel(file)) !== -1;

  console.log("");
  console.log("PROBE: " + label + " (" + rel(file) + ")");
  console.log("  exit code: " + result.code + " (expected 1)");
  console.log("  message fragment present: " + (result.out.indexOf(expectedMessageFragment) !== -1));
  console.log("  filename named in output: " + (result.out.indexOf(rel(file)) !== -1));
  console.log("  restored byte-identical (sha256 " + restoredHash + "): " + restoredOk);
  if (caught && restoredOk) {
    console.log("  RESULT: CAUGHT and restored cleanly");
    pass++;
  } else {
    console.log("  RESULT: *** NOT CAUGHT OR NOT RESTORED CLEANLY ***");
    if (!caught) {
      console.log("  --- relevant output ---");
      console.log(result.out.split("\n").filter(function (l) { return l.indexOf("FAIL") !== -1; }).join("\n"));
    }
    fail++;
  }
}

EXTRA_FILES.forEach(function (file) {
  probe(file, "file(s) listed in tools/extra-public-copy-files.js but not present", "EXTRA_FILES missing");
});

EXTRA_JS_COPY_FILES.forEach(function (file) {
  probe(file, "file(s) listed in EXTRA_JS_COPY_FILES but not present", "EXTRA_JS_COPY_FILES missing");
});

console.log("");
console.log("=== Final state ===");
const final = runChecker();
console.log("Final check-service-links.js run: exit " + final.code + " (expected 0, matching baseline)");
gitStatusEmpty("after all probes and restores");

console.log("");
console.log("SUMMARY: " + pass + " caught and restored cleanly, " + fail + " NOT caught or NOT restored, "
  + "out of " + (EXTRA_FILES.length + EXTRA_JS_COPY_FILES.length) + " files probed.");

if (fail > 0 || final.code !== 0) {
  console.log("VERIFY: FAIL");
  process.exit(1);
}
console.log("VERIFY: PASS");
