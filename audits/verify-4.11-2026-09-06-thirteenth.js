// Item 4.11 (SK Chemists Bootle pack), thirteenth quality pass, 2026-09-06.
// Fresh angle: tools/check-app-membership.js Rule 8 (the GBP content pack
// app-claim guard, added on the item 4.5 quality pass 2026-08-14) has been
// proven by injection against scorah-hazel-grove.md and smartts-bootle.md
// (per that rule's own header comment) but never against SK Chemists
// Bootle's own pack in this item's twelve-pass history. SK is thematically
// the sharpest branch to prove it on: CLAUDE.md's own "hasApp" section names
// SK Chemists Bootle as the standing non-member sitting 1.5 miles from
// Smartts Bootle, the member, and warns that a copy-paste between two
// adjacent records is exactly how the field goes wrong silently.
//
// Four injections, one at a time, each restored by direct byte write from an
// in-memory Buffer immediately after capturing the checker's own stdout and
// BEFORE any assertion is printed, sha256-reconfirmed byte-identical after
// each restoration and again at the end. Only ever one target mutated at a
// time. Refuses to run if the file already carries a git diff.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = "/sessions/adoring-peaceful-archimedes/mnt/rbh-site-data";
const TARGET = path.join(REPO, "gbp-packs", "sk-chemists-bootle.md");
const CHECKER = path.join(REPO, "tools", "check-app-membership.js");

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function gitDiff(rel) {
  return execFileSync("git", ["status", "--porcelain", "--", rel], { cwd: REPO, encoding: "utf8" }).trim();
}

function runChecker() {
  try {
    const out = execFileSync("node", [CHECKER], { cwd: REPO, encoding: "utf8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

const relTarget = "gbp-packs/sk-chemists-bootle.md";
const preDiff = gitDiff(relTarget);
if (preDiff) {
  console.log("REFUSING TO RUN: " + relTarget + " already has a git diff:\n" + preDiff);
  process.exit(2);
}

const original = fs.readFileSync(TARGET);
const originalHash = sha256(original);
console.log("Baseline sha256: " + originalHash);

const baseline = runChecker();
console.log("Baseline checker exit: " + baseline.code + " (expect 0)");
console.log(baseline.out.split("\n").slice(0, 8).join("\n"));
if (baseline.code !== 0) {
  console.log("REFUSING TO RUN: baseline is not clean.");
  process.exit(2);
}

function restore(label) {
  fs.writeFileSync(TARGET, original);
  const h = sha256(fs.readFileSync(TARGET));
  const ok = h === originalHash;
  console.log("  restored after " + label + ": sha256 " + (ok ? "MATCHES original" : "MISMATCH!!"));
  if (!ok) { console.log("  ABORTING - restoration failed integrity check"); process.exit(3); }
}

function inject(label, mutateFn, expectSubstring) {
  console.log("\n--- Injection: " + label + " ---");
  const text = original.toString("utf8");
  const mutated = mutateFn(text);
  if (mutated === text) {
    console.log("  MUTATION NO-OP - target text not found, aborting this injection");
    process.exit(4);
  }
  fs.writeFileSync(TARGET, mutated, "utf8");
  const result = runChecker();
  console.log("  checker exit: " + result.code + " (expect non-zero)");
  const relevantLines = result.out.split("\n").filter(l => l.includes("FAIL") || l.includes(label) || /skchemists_bootle|sk-chemists-bootle/i.test(l));
  console.log(relevantLines.slice(0, 12).join("\n"));
  const caught = result.code !== 0 && (!expectSubstring || result.out.includes(expectSubstring));
  console.log("  CAUGHT: " + caught);
  restore(label);
  return caught;
}

const results = [];

// (1) Rule 8a + 8d together: inject an app claim into a POST (published
// copy), while the paster note still reads "No app mention anywhere in this
// pack". Expect BOTH 8a (published copy claims app, hasApp false) and 8d
// (note says none, but copy carries one) to fire simultaneously.
results.push(["8a+8d (Post B app claim)", inject(
  "8a+8d (Post B app claim)",
  t => t.replace(
    "with a team you can actually get on the phone. Serving Bootle, Sefton and\nLiverpool.",
    "with a team you can actually get on the phone. You can also manage your\nrepeat prescriptions through our app. Serving Bootle, Sefton and Liverpool."
  ),
  "hasApp false"
)]);

// (2) Rule 8b: inject an app mention into the photo shot list, WITHOUT
// changing the total shot count (SK sits exactly on the PHOTO_MIN=10 floor
// per the eleventh-pass finding, so adding an 11th shot is not the point -
// reword one existing shot instead, to isolate 8b from the shot-count rule).
results.push(["8b (shot list app mention)", inject(
  "8b (shot list app mention)",
  t => t.replace(
    "- Team photo behind the counter.",
    "- Team photo behind the counter, with the app download screen visible on the counter iPad."
  ),
  "photo shot list asks for an app shot"
)]);

// (3) Rule 8c (saysTrue branch only): flip the paster note's stated hasApp
// value to true while leaving the actual pasted copy untouched (still no app
// claim anywhere in desc/svc/posts). Expect 8c to fire alone.
results.push(["8c (note says hasApp true)", inject(
  "8c (note says hasApp true)",
  t => t.replace(
    "- No app mention anywhere in this pack: branches.json has hasApp false for\n  this branch.",
    "- No app mention anywhere in this pack: branches.json has hasApp true for\n  this branch."
  ),
  "hasApp true"
)]);

// (4) Rule 8c (the "both" branch): add a second, contradictory hasApp line
// alongside the existing correct one, so the note asserts both true and
// false for the same branch. This is the one sub-branch of rule 8c the
// single-line flip above cannot exercise.
results.push(["8c (note states both true and false)", inject(
  "8c (note states both true and false)",
  t => t.replace(
    "- No app mention anywhere in this pack: branches.json has hasApp false for\n  this branch.",
    "- No app mention anywhere in this pack: branches.json has hasApp false for\n  this branch. Also note branches.json has hasApp true for this branch."
  ),
  "notes state both hasApp true and hasApp false"
)]);

console.log("\n=== SUMMARY ===");
let allCaught = true;
results.forEach(([label, caught]) => {
  console.log((caught ? "CAUGHT" : "MISSED") + "  " + label);
  if (!caught) allCaught = false;
});

// Final re-confirmation the tracked file is untouched.
const finalHash = sha256(fs.readFileSync(TARGET));
console.log("\nFinal sha256: " + finalHash + " (" + (finalHash === originalHash ? "MATCHES" : "MISMATCH!!") + ")");
const finalDiff = gitDiff(relTarget);
console.log("Final git status --porcelain: " + (finalDiff ? finalDiff : "(clean)"));

const finalChecker = runChecker();
console.log("Final check-app-membership.js exit: " + finalChecker.code + " (expect 0)");

console.log("\nALL CAUGHT: " + allCaught);
process.exit(allCaught && finalHash === originalHash && !finalDiff && finalChecker.code === 0 ? 0 : 1);
