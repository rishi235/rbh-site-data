/*
  check-weebly-furniture-freshness.js
  (added 2026-09-18, item 5.1 twenty-second quality pass)

  Why this file exists
  ---------------------
  WEEBLY_FURNITURE_CHECKLIST.md exists so that the Q39 estate-wide Weebly
  furniture sweep can be mechanical rather than investigative: a paster opens
  the file, reads a branch's "Correct values" table, and types it straight
  into Weebly with no further thought. Its own header says so in as many
  words ("the correct values are already held here") and its own generator's
  header repeats it ("the paster never has to guess or re-derive a fact this
  repo already holds right").

  Three earlier passes on this item (nineteenth, twentieth, twenty-first)
  widened check-em-dashes.js, check-brand-spelling.js and check-uk-spelling.js
  to read this file, because a dash or a misspelling typed straight into
  Weebly is exactly the "typed straight into Weebly with no build step"
  risk class those checkers exist for. All three ask the same question this
  item keeps asking of itself: is the CHARACTER SET right.

  None of the three, and no other checker in this repo, ever asked the prior
  question: is the CONTENT right - specifically, is the checked-in file what
  the generator would produce RIGHT NOW from the current branches.json, or
  has branches.json moved on since the file was last regenerated and
  committed. That is not a hypothetical shape. It is the identical fault
  check-cdn-pins.js was written to catch for a jsDelivr pin ("a commit pin
  freezes forever, and a branch pin only works while somebody keeps the
  branch level with main... the repo is green, every other checker is green,
  and live is quietly serving old code") and the identical fault the
  runtime-data-fetch WARN rule in that same checker catches for
  branches.json itself. WEEBLY_FURNITURE_CHECKLIST.md has no build step and
  no CI - it is a plain committed file, hand-triggered by
  "node tools/build-weebly-furniture-checklist.js", with nothing anywhere
  that re-runs it after a branches.json edit. If a branch's phone number,
  address or NHS mailbox changes in branches.json (exactly the kind of edit
  this audit makes routinely - see items 5.2/Q28/Q41 for examples already
  in this file's own history) and nobody remembers to regenerate this one
  file, every other checker in the repo stays green (branches.json is
  self-consistent, the generated pages are byte-identical, the dash and
  spelling checkers see no character-set problem) while this file goes on
  telling a human, in a table headed "Correct values", to type the OLD
  number into Weebly during the very sweep this file exists to make safe.
  That is worse than no checklist at all, because a wrong "correct value" is
  trusted rather than verified.

  Proved by injection rather than argued (2026-09-18): on a /tmp scratch
  copy (git archive HEAD, tracked repo never opened for writing), changed
  Scorah Chemists Bramhall's phone in branches.json from "0161 439 3744" to
  "0161 439 9999" and left WEEBLY_FURNITURE_CHECKLIST.md untouched (the
  exact "branches.json moved on, checklist did not" scenario this checker
  exists for). Before this checker existed: all 36 pre-existing checkers
  still exited 0 - none of them noticed, because none of them compares this
  file's content to a fresh regeneration. Confirmed check-nap.js does not
  see it at all: its own PAGE_DIRS/PASTE_DIRS list three page directories
  and does not include the repo root. After adding this checker: FAILed with
  exactly one mismatch, naming scorah_bramhall's Phone row and both the
  stale and the current value. Restored branches.json from the scratch
  backup, sha256-reconfirmed identical, re-ran clean.

  What this checks
  -----------------
  Requires tools/build-weebly-furniture-checklist.js's own buildMarkdown()
  (refactored on this pass to be requirable rather than only runnable as a
  CLI script that writes the file as a side effect - see that file's own
  history for the extraction) and calls it with the CURRENT branches.json,
  producing the exact markdown the generator would write if run right now.
  Diffs that byte-for-byte against the checked-in WEEBLY_FURNITURE_CHECKLIST.md.

    FAIL  the file does not exist at all
    FAIL  the checked-in file differs from a fresh regeneration - names the
          first differing line and, where the mismatch falls inside a
          per-branch "Correct values" table, the branch and field affected

  Deliberately NOT duplicated here: the generator's own KNOWN_FINDINGS table
  (hand-authored live findings with their own source/date, not derivable
  from branches.json) and its own markdown layout. Requiring buildMarkdown()
  rather than re-implementing it is the same "read as data under test, do
  not hold a second copy of the string being checked" principle already
  applied to check-app-membership.js (the app name and store URLs), so this
  checker cannot itself drift from what the generator actually produces.

  Run:  node tools/check-weebly-furniture-freshness.js
*/
"use strict";
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const CHECKLIST_PATH = path.join(REPO, "WEEBLY_FURNITURE_CHECKLIST.md");
const GENERATOR_PATH = path.join(REPO, "tools", "build-weebly-furniture-checklist.js");

const failures = [];

if (!fs.existsSync(GENERATOR_PATH)) {
  console.log("check-weebly-furniture-freshness");
  console.log("  FAIL  tools/build-weebly-furniture-checklist.js is missing - nothing to check against");
  process.exit(1);
}

if (!fs.existsSync(CHECKLIST_PATH)) {
  console.log("check-weebly-furniture-freshness");
  console.log("  FAIL  WEEBLY_FURNITURE_CHECKLIST.md is missing - run node tools/build-weebly-furniture-checklist.js");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));
const generator = require(GENERATOR_PATH);

if (typeof generator.buildMarkdown !== "function") {
  console.log("check-weebly-furniture-freshness");
  console.log("  FAIL  tools/build-weebly-furniture-checklist.js no longer exports buildMarkdown() - "
    + "this checker cannot prove freshness without it");
  process.exit(1);
}

const expected = generator.buildMarkdown(data);
const actual = fs.readFileSync(CHECKLIST_PATH, "utf8");

if (expected !== actual) {
  const expLines = expected.split("\n");
  const actLines = actual.split("\n");
  let firstDiff = -1;
  const maxLines = Math.max(expLines.length, actLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (expLines[i] !== actLines[i]) { firstDiff = i; break; }
  }

  // Best-effort: identify which branch's table the first differing line
  // falls under, by scanning upward for the nearest "### <name> (`id`)"
  // heading in the ACTUAL (checked-in) file.
  let branchContext = null;
  for (let i = firstDiff; i >= 0; i--) {
    const m = /^### (.+) \(`([^`]+)`\)$/.exec(actLines[i] || "");
    if (m) { branchContext = m[1] + " (" + m[2] + ")"; break; }
  }

  failures.push({
    line: firstDiff + 1,
    branch: branchContext,
    expectedLine: expLines[firstDiff] !== undefined ? expLines[firstDiff] : "(file ends here)",
    actualLine: actLines[firstDiff] !== undefined ? actLines[firstDiff] : "(file ends here)",
    expLen: expLines.length,
    actLen: actLines.length
  });
}

console.log("check-weebly-furniture-freshness");
console.log("  " + data.branches.length + " branch(es) in branches.json (lastUpdated " + data.lastUpdated + ")");
console.log("  WEEBLY_FURNITURE_CHECKLIST.md: " + actual.split("\n").length + " line(s) checked-in, "
  + expected.split("\n").length + " line(s) a fresh regeneration would produce");

if (failures.length) {
  console.log("");
  console.log("FAILURES (" + failures.length + "):");
  failures.forEach(function (f) {
    console.log("  FAIL  WEEBLY_FURNITURE_CHECKLIST.md is stale relative to the current branches.json"
      + (f.branch ? " (in " + f.branch + "'s table)" : "") + ":");
    console.log("        first differs at line " + f.line + " (checked-in has " + f.actLen
      + " total lines, a fresh build would produce " + f.expLen + ")");
    console.log("        checked-in : " + f.actualLine);
    console.log("        fresh build: " + f.expectedLine);
  });
  console.log("");
  console.log("Run node tools/build-weebly-furniture-checklist.js and commit the result. Do not");
  console.log("hand-edit WEEBLY_FURNITURE_CHECKLIST.md - the whole point of this checker is that");
  console.log("the paster's \"Correct values\" table has to actually be current, not merely present.");
  process.exit(1);
}

console.log("");
console.log("check-weebly-furniture-freshness: clean, WEEBLY_FURNITURE_CHECKLIST.md is byte-identical "
  + "to what tools/build-weebly-furniture-checklist.js would produce from the current branches.json.");
