/*
  audits/clear-aintree-vacuity-probe-2026-09-01.js

  Item 3.13 quality pass (fifth), Clear Chemist (Aintree), 2026-09-01.
  Rerun of audits/clear-aintree-vacuity-probe-2026-08-14.js with two fixes
  made to the INSTRUMENT, not the repo, found while re-running it this pass:

  1. STALE INJECTION VALUE. The 2026-08-14 probe's first injection hardcoded
     the pre-Q28 phone digits ("tel:01512038365"). Q28 changed Clear Chemist
     Aintree's phone to 0151 203 6535 on 2026-08-30, so that string no longer
     appears anywhere on the page and the injection came back INERT ("changed
     nothing") the moment this pass tried it - not a repo defect, a stale
     literal in the test. Fixed by reading the live phone out of
     branches.json at run time instead of hardcoding either number, so a
     future phone change cannot make this injection go quietly inert again.

  2. RESTORE-BY-GIT, NOT BY-COPY. The 2026-08-14 probe restored each
     injection with `git checkout -- TARGET` rather than writing the
     in-memory `original` string back to disk. Re-running it this pass, a
     `git status --porcelain` issued moments earlier from the sandboxed
     mount's shell had itself left a fresh .git/index.lock behind (that
     mount can create and rename files but not unlink them - the standing
     Q87 finding), so the SECOND injection's `git checkout --` call failed
     outright with "Unable to create index.lock: File exists" and the
     script crashed with the page still sitting on disk carrying the
     injected second-H1 fault, uncommitted. It was caught and restored by
     hand via the Windows PowerShell path this same session (sha256 verified
     byte-identical to the pre-probe hash) before this file was written, but
     the probe should not depend on git's lock file succeeding to leave the
     repo clean. This version restores by writing `original` straight back
     with fs.writeFileSync after every injection - the exact fix CLAUDE.md's
     own "Weight loss copy" -> harness section already prescribes ("A test
     harness must restore by byte copy, not from git") - and keeps a git
     status check only as a secondary confirmation, not the repair mechanism.

  Everything else - the nine fault/rule pairs, the two prior lessons in the
  comments below them (postcode must be a real foreign value; target the
  element, not the paste-header comment), and the pre-flight clean-worktree
  refusal - is unchanged from 2026-08-14.

  Run:  node audits/clear-aintree-vacuity-probe-2026-09-01.js
*/
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const REPO = path.join(__dirname, "..");
const AUDIT = path.join(__dirname, "clear-aintree-independent-2026-08-14.js");
const TARGET = "modules/switch/pages/switch-prescriptions-clear-aintree.html";
const abs = path.join(REPO, TARGET);

const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));
const me = data.branches.find(b => b.id === "clearchemist_aintree");
const myDigits = (me.phone || "").replace(/\D/g, "");

function gitStatusQuiet(args) {
  try { return cp.execFileSync("git", args, { cwd: REPO, stdio: "pipe" }).toString().trim(); }
  catch (e) { return null; }
}

const status = gitStatusQuiet(["status", "--porcelain", "--", TARGET]);
if (status === null) {
  console.log("WARNING: could not read git status (index.lock contention?) - proceeding on file content alone.");
} else if (status) {
  console.log("REFUSING TO RUN: " + TARGET + " is already modified.");
  process.exit(2);
}

const original = fs.readFileSync(abs, "utf8");
if (!original.includes("tel:" + myDigits)) {
  console.log("REFUSING TO RUN: current phone digits " + myDigits + " (from branches.json) not found in " + TARGET + " - injection target assumption is wrong, fix the probe before trusting it.");
  process.exit(2);
}
// one digit away from the real number, so the mutation is guaranteed non-inert
const wrongDigits = myDigits.slice(0, -1) + (myDigits.slice(-1) === "6" ? "7" : "6");

// each: [label, expected rule id, mutate(text) -> text]
const injections = [
  ["wrong tel digit", "TELMATCH", t => t.replace("tel:" + myDigits, "tel:" + wrongDigits)],
  ["second H1", "H1COUNT", t => t.replace("</h1>", "</h1><h1>Second heading</h1>")],
  ["em dash in copy", "DASH", t => t.replace("We handle everything.", "We handle everything — all of it.")],
  ["http:// URL", "SCHEME", t => t.replace('href="https://www.clearchemist.co.uk"', 'href="http://www.clearchemist.co.uk"')],
  ["personal inbox", "PERSONALEMAIL", t => t.replace('name="destination" value=""', 'name="destination" value="rishi@rbhealth.co.uk"')],
  // PR8 3HN is Fishlocks Ainsdale. The first draft of this probe injected an
  // invented code one character away from it, which belongs to no branch, so
  // the rule was right not to fire and the probe was testing nothing. An
  // injection has to be a REAL foreign value or it proves the opposite of
  // what it claims. The invented code is deliberately not written out here:
  // check-postcodes.js scans this file and rightly refuses any postcode that
  // is in no branch and carries no registered reason.
  ["foreign postcode", "FOREIGNPOSTCODE", t => t.replace("L9 7AS", "L9 7AS and PR8 3HN")],
  ["dangling fragment", "FRAGMENT", t => t.replace('href="#switch-form-card"', 'href="#does-not-exist"')],
  ["hard-coded widget id", "WIDGETID", t => t.replace('data-branch="Clear Chemist"', 'data-branch="Clear Chemist" data-widget="691451f1f9b8831e135baacb"')],
  // Likewise this one first matched the phrase inside the paste-header
  // comment, which the audit strips before reading copy, so the H1 kept its
  // town and the rule correctly stayed silent. Target the element itself.
  ["town stripped from H1", "H1TOWN", t => t.replace(/<h1([^>]*)>[\s\S]*?<\/h1>/i, "<h1$1>Switch your prescriptions to Clear Chemist in under 30 seconds</h1>")]
];

let good = 0, bad = 0;
for (const [label, rule, mutate] of injections) {
  const mutated = mutate(original);
  if (mutated === original) { console.log("  INERT   " + label + " - injection changed nothing, probe is not testing this rule"); bad++; continue; }
  fs.writeFileSync(abs, mutated);
  let out = "";
  try { out = cp.execFileSync("node", [AUDIT], { cwd: REPO }).toString(); }
  catch (e) { out = (e.stdout || "").toString() + (e.stderr || "").toString(); }
  // Restore by byte copy first - this must not depend on git succeeding.
  fs.writeFileSync(abs, original);
  const caught = out.includes("[" + rule + "]");
  console.log("  " + (caught ? "CAUGHT  " : "MISSED  ") + label + "  (expected " + rule + ")");
  caught ? good++ : bad++;
}

const restoredOk = fs.readFileSync(abs, "utf8") === original;
const after = gitStatusQuiet(["status", "--porcelain", "--", TARGET]);
console.log("\n" + good + " caught, " + bad + " missed. " + TARGET +
  (restoredOk ? " restored clean (byte-verified)." : " STILL MODIFIED - RESTORE BY HAND") +
  (after === null ? " (git status unreadable, byte check is authoritative)" : (after ? " NOTE: git still shows a diff." : "")));
process.exit(bad || !restoredOk ? 1 : 0);
