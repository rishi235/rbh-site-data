/*
  verify-2.2-2026-09-05-eighth.js

  Item 2.2 (Fishlocks Ainsdale/Eccleston shared-domain branch landing pages),
  eighth quality pass. Seven prior passes had tested NAP, hours, JSON-LD (as
  a side effect of foreign-fact injection), the SISTERLINK/OUTBOUND link
  targets (rules 8/9), the SISTERLABEL text (rule 11), the Pharmacy First
  cost claim, and the WhatsApp-by-design absence - but the hasApp gating on
  these two pages ("app sentence correctly gated on hasApp") had only ever
  been checked by OBSERVATION across all seven passes, never by injection
  against the real checker (tools/check-app-membership.js). Fishlocks
  Ainsdale and Eccleston are two of only four app members in the estate
  (CLAUDE.md's own "hasApp" section), so this is exactly the copy-paste-risk
  field that section warns about, unproven specifically for this item.

  This script shares no code with tools/check-app-membership.js beyond
  invoking it as a child process against an ISOLATED SCRATCH COPY of the
  repository (built via `git archive HEAD`), never against the tracked
  working tree. The tracked repo is not opened for writing at any point;
  every mutation happens in the scratch copy, and each file is restored
  from an in-memory buffer immediately after the checker output is
  captured, sha256-reconfirmed before the next case and again at the end.

  Run:  node audits/verify-2.2-2026-09-05-eighth.js
  (assumes a scratch mirror has already been built with
   `git archive HEAD | tar -x -C <scratch>`; see AGENT_WORKLIST.md for the
   exact commands used this run - this file documents and reproduces them)
*/
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const crypto = require("crypto");

const REPO = path.join(__dirname, "..");
const SCRATCH = process.env.SCRATCH_2_2 || "/tmp/scratch-2.2-verify";

function sha256(p) { return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); }

function buildScratch() {
  if (fs.existsSync(SCRATCH)) fs.rmSync(SCRATCH, { recursive: true, force: true });
  fs.mkdirSync(SCRATCH, { recursive: true });
  execFileSync("sh", ["-c", `git archive HEAD | tar -x -C "${SCRATCH}"`], { cwd: REPO, stdio: "inherit" });
}

function runChecker() {
  try {
    const out = execFileSync("node", ["tools/check-app-membership.js"], { cwd: SCRATCH, encoding: "utf8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function mutateAndTest(label, file, mutateFn, expectFail, expectedRule) {
  const full = path.join(SCRATCH, file);
  const before = fs.readFileSync(full, "utf8");
  const beforeHash = sha256(full);
  const mutated = mutateFn(before);
  fs.writeFileSync(full, mutated, "utf8");
  const result = runChecker();
  const caught = result.code !== 0 && result.out.includes(expectedRule);
  console.log("  " + label + ": " + (caught === expectFail ? "PASS (as expected)" : "*** UNEXPECTED ***"));
  console.log("    checker exit " + result.code + (caught ? ", matched rule \"" + expectedRule + "\"" : ""));
  fs.writeFileSync(full, before, "utf8");
  const afterHash = sha256(full);
  if (afterHash !== beforeHash) {
    throw new Error("RESTORE FAILED for " + file + " - hash mismatch after restore");
  }
  return caught === expectFail;
}

console.log("=== verify-2.2-2026-09-05-eighth: check-app-membership.js RULE 3/5 by injection ===");
buildScratch();

console.log("\nBaseline in scratch:");
const baseline = runChecker();
console.log("  exit " + baseline.code + " (expect 0)");
if (baseline.code !== 0) { console.log(baseline.out); process.exit(1); }

let allOk = true;

allOk = mutateAndTest(
  "TEST 1: strip app sentence from Fishlocks Ainsdale (hasApp true)",
  "modules/branch/pages/pharmacy-fishlocks-ainsdale.html",
  (s) => s.replace(/Manage everything in the [^<]*app[^<]*\./, "REMOVED APP SENTENCE FOR TEST"),
  true, "carries no app sentence"
) && allOk;

allOk = mutateAndTest(
  "TEST 2: inject app sentence into McCanns Aigburth (hasApp false)",
  "modules/branch/pages/pharmacy-mccanns-aigburth.html",
  (s) => s + "\n<span>Manage everything in the free RB Healthcare Pharmacy app.</span>\n",
  true, "carries the app sentence but branches.json says this branch is not an app member"
) && allOk;

allOk = mutateAndTest(
  "TEST 3: strip app sentence from Fishlocks Eccleston (hasApp true)",
  "modules/branch/pages/pharmacy-fishlocks-eccleston.html",
  (s) => s.replace(/Manage everything in the [^<]*app[^<]*\./, "REMOVED APP SENTENCE FOR TEST"),
  true, "carries no app sentence"
) && allOk;

allOk = mutateAndTest(
  "TEST 4: wrong app name on Fishlocks Ainsdale (RULE 5, one name)",
  "modules/branch/pages/pharmacy-fishlocks-ainsdale.html",
  (s) => s.replace(/RB Healthcare Pharmacy app/, "RB Healthcare app"),
  true, "one name"
) && allOk;

console.log("\nFinal baseline re-check in scratch:");
const final = runChecker();
console.log("  exit " + final.code + " (expect 0)");
allOk = allOk && final.code === 0;

console.log("\n" + (allOk ? "ALL CASES BEHAVED AS EXPECTED" : "*** SOME CASE DID NOT BEHAVE AS EXPECTED - SEE ABOVE ***"));
process.exit(allOk ? 0 : 1);
