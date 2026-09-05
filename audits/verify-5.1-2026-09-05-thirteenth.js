/*
  verify-5.1-2026-09-05-thirteenth.js

  Item 5.1 quality pass (thirteenth), 2026-09-05. Independent instrument
  proving a real gap in tools/check-em-dashes.js's numeric HTML character
  reference matching, one turn past the tenth pass's padding fix: a numeric
  character reference missing its trailing semicolon (e.g. "&#8212" rather
  than "&#8212;") still decodes to the em/en dash character in every real
  HTML parser, per the WHATWG HTML parsing algorithm's numeric-character-
  reference end state, which does not require the semicolon to translate the
  reference (only records a parse error when it is absent). The unfixed
  checker's NUMERIC_ENTITY_RE required a literal trailing ";", so a
  missing-semicolon dash reference passed as clean.

  This script shares no code with tools/check-em-dashes.js beyond invoking it
  as a child process. It refuses to run against a dirty target, restores the
  target from an in-memory buffer immediately after every checker run and
  before drawing any conclusion, and sha256-verifies the restoration each
  time. It never runs against the tracked repo directly for the injection
  half - that was done in an isolated /tmp scratch mirror of the whole repo
  (no .git, so check-cdn-pins.js's git-ref resolution does not apply there;
  the real tracked repo's own check-cdn-pins.js was run separately and
  confirmed clean, 0 failures, 3 warnings, 7 known, unaffected by this fix).

  Empirical proof that the semicolon really is optional in real HTML parsing,
  independent of this repo's regex: parse5 (a spec-conformant WHATWG HTML5
  tokenizer, the same parsing algorithm class jsdom and real browsers
  implement) decodes "left&#8212right" to "left—right" and
  "left&#x2014right" the same way, while "left&mdashright" (a NAMED
  reference, no semicolon) stays literal text - confirming the
  semicolon-optional behaviour is specific to the numeric form and does not
  extend to &mdash;/&ndash;, which correctly stay exact-match in this
  checker.

  Run:  node audits/verify-5.1-2026-09-05-thirteenth.js
  Expects: all "real dash" cases FAIL (checker correctly catches them) and
  both non-dash controls PASS (checker correctly leaves them alone), against
  the FIXED checker only. A separate run against the pre-fix checker source
  (git show HEAD~1er tools/check-em-dashes.js, i.e. the version before this
  pass's commit) is expected to let every real case through with exit 0.
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const TARGET = path.join(REPO, "modules", "switch", "pages", "SEO.md");
const CHECKER = path.join(REPO, "tools", "check-em-dashes.js");

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function gitDiffEmpty(file) {
  try {
    execFileSync("git", ["diff", "--quiet", "--", file], { cwd: REPO });
    return true;
  } catch (e) {
    return false;
  }
}

if (!gitDiffEmpty(TARGET)) {
  console.error("REFUSING TO RUN: " + path.relative(REPO, TARGET) + " already carries a git diff.");
  process.exit(2);
}

const orig = fs.readFileSync(TARGET);
const origHash = sha256(orig);
console.log("target: " + path.relative(REPO, TARGET) + " sha256=" + origHash);

const anchor = "- **Page Permalink:** switch-prescriptions-smartts-bootle";
const origText = orig.toString("utf8");
if (!origText.includes(anchor)) {
  console.error("REFUSING TO RUN: anchor line not found, repo has moved on since this probe was written.");
  process.exit(2);
}

function runChecker() {
  try {
    const out = execFileSync("node", [CHECKER], { cwd: REPO, encoding: "utf8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function restore() {
  fs.writeFileSync(TARGET, orig);
  const now = sha256(fs.readFileSync(TARGET));
  if (now !== origHash) {
    console.error("RESTORE FAILED, hash mismatch: " + now + " expected " + origHash);
    process.exit(3);
  }
}

const cases = [
  { name: "decimal no-semicolon (em)", suffix: "&#8212test", expectCaught: true },
  { name: "hex no-semicolon (em)", suffix: "&#x2014test", expectCaught: true },
  { name: "padded decimal no-semicolon (em)", suffix: "&#008212test", expectCaught: true },
  { name: "padded hex no-semicolon (em)", suffix: "&#X002014test", expectCaught: true },
  { name: "decimal no-semicolon (en)", suffix: "&#8211test", expectCaught: true },
  { name: "control: no-semicolon non-dash (letter A, #65)", suffix: "&#65test", expectCaught: false },
  { name: "control: no-semicolon non-dash (nbsp, #160)", suffix: "&#160test", expectCaught: false },
  { name: "control: with-semicolon still caught (em)", suffix: "&#8212;test", expectCaught: true }
];

let allOk = true;
for (const c of cases) {
  const mutated = origText.replace(anchor, anchor + c.suffix);
  fs.writeFileSync(TARGET, mutated, "utf8");
  const result = runChecker();
  const caught = result.code === 1 && /Page Permalink/.test(result.out);
  restore();
  const ok = caught === c.expectCaught;
  allOk = allOk && ok;
  console.log((ok ? "OK  " : "MISMATCH") + "  " + c.name.padEnd(45) + " exit=" + result.code + " caught=" + caught + " expected=" + c.expectCaught);
}

const finalHash = sha256(fs.readFileSync(TARGET));
console.log("final hash matches original: " + (finalHash === origHash));
console.log(allOk && finalHash === origHash ? "\nALL CASES AS EXPECTED" : "\nFAILED - see MISMATCH lines above");
process.exit(allOk && finalHash === origHash ? 0 : 1);
