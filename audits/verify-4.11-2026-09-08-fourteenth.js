// Fourteenth quality pass on worklist item 4.11 (SK Chemists Bootle GBP
// pack), 2026-09-08 (unattended scheduled run, rotation-pool pick).
//
// Thirteen prior passes had injection-tested this pack's phone, postcode,
// Post C link, hours line, UTI age cohort, the rule 11 age qualifier, the
// CLINIC_QUALIFIERS/BODY_IMAGE/OUTCOME_PROMISE/POM_CLASS weight loss and
// travel families, CATEGORY_RULES/SERVICE_RULES omissions, the services and
// categories vocabulary allowlists, the photo shot list rules, all of
// check-gbp-pharmacy-first.js's completeness/age/scope rules, and
// check-app-membership.js's Rule 8 app-claim guard - but never, against this
// branch's own pack, two rules that plainly apply to it:
//
//   1. check-gbp-packs.js's sister-branch claim rule. SK Chemists is a
//      unique brandLabel (no other live branch shares it), so a pack
//      falsely claiming a sister or second branch should fail on the
//      "no other live branch carries the brand" path - untested here in
//      thirteen passes because every prior sister-branch injection in the
//      estate targeted a branch that DOES have a real sister (Scorah,
//      McCanns), never a branch that does not.
//   2. check-brand-spelling.js's MISSPELT list, which carries a pattern
//      written specifically for this brand ("S K Chemists" -> "SK
//      Chemists"), never proven against this pack's own file.
//
// Convention matches prior passes on this item: invoke the real checkers as
// child processes only (no import from tools/), refuse to run if the target
// already carries a git diff, restore by direct byte write from an
// in-memory Buffer immediately after capturing each checker's output and
// before any assertion, sha256-confirm byte-identical before the round,
// after each individual restoration, and again at the end.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const TARGET = path.join(ROOT, "gbp-packs", "sk-chemists-bootle.md");
const CHECKER_GBP = path.join(ROOT, "tools", "check-gbp-packs.js");
const CHECKER_BRAND = path.join(ROOT, "tools", "check-brand-spelling.js");

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function gitDiffClean(file) {
  try {
    execFileSync("git", ["diff", "--quiet", "--", file], { cwd: ROOT });
    return true;
  } catch (e) {
    return false;
  }
}

function runChecker(checkerPath) {
  try {
    const out = execFileSync("node", [checkerPath], { cwd: ROOT, encoding: "utf8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERTION FAILED: " + msg);
}

if (!gitDiffClean(TARGET)) {
  console.error("REFUSING TO RUN: " + TARGET + " already carries a git diff.");
  process.exit(2);
}

const original = fs.readFileSync(TARGET);
const originalHash = sha256(original);
console.log("Target:", TARGET);
console.log("Original sha256:", originalHash);

const baseGbp = runChecker(CHECKER_GBP);
const baseBrand = runChecker(CHECKER_BRAND);
assert(baseGbp.code === 0, "check-gbp-packs.js baseline should be clean, got exit " + baseGbp.code + "\n" + baseGbp.out);
assert(baseBrand.code === 0, "check-brand-spelling.js baseline should be clean, got exit " + baseBrand.code + "\n" + baseBrand.out);
console.log("Baseline: both checkers exit 0.");

const results = [];

function restore() {
  fs.writeFileSync(TARGET, original);
  const h = sha256(fs.readFileSync(TARGET));
  assert(h === originalHash, "restore did not reproduce the original byte-for-byte (got " + h + ")");
}

function runInjection(name, mutate, checkerPath, expectSubstring) {
  restore();
  let text = original.toString("utf8");
  const mutated = mutate(text);
  assert(mutated !== text, name + ": mutation produced no change");
  fs.writeFileSync(TARGET, mutated, "utf8");
  const r = runChecker(checkerPath);
  const caught = r.code !== 0 && r.out.toLowerCase().includes(expectSubstring.toLowerCase());
  results.push({ name, caught, code: r.code, expectSubstring, sample: caught ? r.out.split("\n").find(l => l.toLowerCase().includes(expectSubstring.toLowerCase())) : r.out.slice(0, 400) });
  restore();
}

runInjection(
  "false sister-branch claim (no sister exists for this brand)",
  (text) => text.replace(
    "SK Chemists is a friendly independent NHS pharmacy at 516 Stanley Road,",
    "Our sister branch in Southport is close by. SK Chemists is a friendly independent NHS pharmacy at 516 Stanley Road,"
  ),
  CHECKER_GBP,
  "no other live branch"
);

runInjection(
  "MISSPELT brand pattern: 'S K Chemists' in place of 'SK Chemists'",
  (text) => text.replace(
    "SK Chemists is a friendly independent NHS pharmacy",
    "S K Chemists is a friendly independent NHS pharmacy"
  ),
  CHECKER_BRAND,
  "s k chemists"
);

restore();
const finalHash = sha256(fs.readFileSync(TARGET));
assert(finalHash === originalHash, "final file hash does not match original");

console.log("\n=== RESULTS ===");
let allCaught = true;
for (const r of results) {
  console.log((r.caught ? "CAUGHT" : "MISSED") + ": " + r.name + " (exit " + r.code + ")");
  console.log("  " + (r.sample || "").trim());
  if (!r.caught) allCaught = false;
}

console.log("\nFile sha256 after full round:", finalHash, finalHash === originalHash ? "(matches original)" : "(MISMATCH)");

const toolsDir = path.join(ROOT, "tools");
const allCheckers = fs.readdirSync(toolsDir).filter(f => f.startsWith("check-") && f.endsWith(".js"));
let allClean = true;
for (const f of allCheckers) {
  const r = runChecker(path.join(toolsDir, f));
  if (r.code !== 0) {
    allClean = false;
    console.log("POST-ROUND FAIL:", f, r.out.slice(0, 300));
  }
}
console.log("\nFull suite after round: " + allCheckers.length + " checkers, " + (allClean ? "all clean" : "FAILURES ABOVE"));

process.exit(allCaught && allClean && finalHash === originalHash ? 0 : 1);
