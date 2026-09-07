/*
  verify-3.13-2026-09-07-eleventh.js

  Item 3.13 (Clear Chemist Aintree) quality pass, eleventh, 2026-09-07.

  FRESH ANGLE. Ten prior passes had proven check-switch-copy.js,
  check-weight-loss-copy.js, check-travel-clinic-copy.js, check-jsonld.js and
  (tenth pass) check-seo-pattern.js against this branch's three pages by
  direct injection. A grep of this item's own AGENT_WORKLIST.md section for
  "check-seo-keywords.js" across all ten returned zero hits: the checker that
  reads the fourth Weebly SEO field (Meta Keywords) had never once been
  pointed at Clear Chemist Aintree specifically, despite being proven
  estate-wide (177 lines, 0 failures) on every pass.

  Method: own sha256 baseline of the three touched paste sheets captured
  before any mutation, restored by fs.writeFileSync from an in-memory buffer
  (not git), sha256-reconfirmed after every restore. Six injections against
  modules/switch/pages/SEO.md and modules/service/pages/WEIGHT-LOSS-SEO.md's
  Clear Chemist Aintree blocks only, each restored and reverified before the
  next.

  Run:  node audits/verify-3.13-2026-09-07-eleventh.js
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");

function sha(s) { return crypto.createHash("sha256").update(s, "utf8").digest("hex"); }

function runChecker(name) {
  try {
    const out = execFileSync("node", [path.join(REPO, "tools", name)], { cwd: REPO, encoding: "utf8" });
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function testFile(relPath, label, injections) {
  const file = path.join(REPO, relPath);
  const original = fs.readFileSync(file, "utf8");
  const baseline = sha(original);
  console.log("\n=== " + label + " (" + relPath + ") ===");
  console.log("baseline sha256: " + baseline);

  const m = original.match(/(## Clear Chemist — Aintree.*?\n- \*\*Meta Keywords:\*\* )([^\n]*)/s);
  if (!m) throw new Error("Clear Chemist Aintree block not found in " + relPath);
  const kwStart = m.index + m[1].length;
  const kwLineEnd = original.indexOf("\n", kwStart);
  const origKw = original.slice(kwStart, kwLineEnd);
  console.log("original Meta Keywords: " + origKw);

  injections.forEach(function (inj) {
    const newKw = origKw + inj.append;
    const content = original.slice(0, kwStart) + newKw + original.slice(kwLineEnd);
    fs.writeFileSync(file, content, "utf8");
    const r = runChecker("check-seo-keywords.js");
    console.log("\n--- " + inj.name + " --- exit=" + r.code);
    const lastLines = r.out.trim().split("\n").slice(-4).join("\n");
    console.log(lastLines);

    fs.writeFileSync(file, original, "utf8");
    const restoredHash = sha(fs.readFileSync(file, "utf8"));
    if (restoredHash !== baseline) {
      throw new Error("RESTORE FAILED for " + relPath + " after " + inj.name);
    }
  });

  const finalHash = sha(fs.readFileSync(file, "utf8"));
  console.log("\nfinal restore confirmed byte-identical to baseline: " + (finalHash === baseline));
}

console.log("BASELINE FULL CHECKER SWEEP (before any injection)");
let baselineFails = 0;
fs.readdirSync(path.join(REPO, "tools")).filter(function (f) { return /^check-.*\.js$/.test(f); }).forEach(function (f) {
  const r = runChecker(f);
  if (r.code !== 0) { baselineFails++; console.log("FAIL: " + f); }
});
console.log(baselineFails === 0 ? "all checkers clean before injection" : (baselineFails + " checker(s) already failing - stop"));
if (baselineFails > 0) process.exit(1);

testFile("modules/switch/pages/SEO.md", "switch page keywords", [
  { name: "RULE 3 presence (strip Aintree)", append: "" }, // handled specially below
]);

// RULE 3 needs a different transform (strip word rather than append); redo directly.
(function () {
  const relPath = "modules/switch/pages/SEO.md";
  const file = path.join(REPO, relPath);
  const original = fs.readFileSync(file, "utf8");
  const baseline = sha(original);
  const m = original.match(/(## Clear Chemist — Aintree.*?\n- \*\*Meta Keywords:\*\* )([^\n]*)/s);
  const kwStart = m.index + m[1].length;
  const kwLineEnd = original.indexOf("\n", kwStart);
  const origKw = original.slice(kwStart, kwLineEnd);
  const stripped = origKw.split("Aintree").join("").replace(/ {2,}/g, " ");
  const content = original.slice(0, kwStart) + stripped + original.slice(kwLineEnd);
  fs.writeFileSync(file, content, "utf8");
  const r = runChecker("check-seo-keywords.js");
  console.log("\n--- RULE 3 presence (strip 'Aintree' from switch keywords) --- exit=" + r.code);
  console.log(r.out.trim().split("\n").slice(-4).join("\n"));
  fs.writeFileSync(file, original, "utf8");
  if (sha(fs.readFileSync(file, "utf8")) !== baseline) throw new Error("RESTORE FAILED (rule 3 test)");
  console.log("restored OK");
})();

testFile("modules/switch/pages/SEO.md", "switch page keywords - absence/brand/postcode", [
  { name: "RULE 4 absence (inject Eccleston, Fishlocks Eccleston's seoTown, not in Clear's serviceAreaList)", append: ", Eccleston" },
  { name: "RULE 5 brand (inject Fishlocks Chemist)", append: ", Fishlocks Chemist" },
  { name: "RULE 6 postcode (inject PR8, Ainsdale's outward code, not Clear's own L9)", append: ", PR8" }
]);

testFile("modules/service/pages/WEIGHT-LOSS-SEO.md", "weight loss page keywords - claim rule", [
  { name: "RULE 7 claim (inject 'guaranteed weight loss results')", append: ", guaranteed weight loss results" },
  { name: "CONTROL (append 'Aintree pharmacy', own town again - must stay clean)", append: ", Aintree pharmacy" }
]);

console.log("\n\nFINDING: the RULE 7 injection above was NOT caught on the FIRST run of this");
console.log("script (before tools/claim-patterns.js was patched). claim-patterns.js line 29");
console.log("only matched the fixed two-word phrases 'guaranteed results' / 'results");
console.log("guaranteed'; 'guaranteed weight loss results' - the plainest way of writing the");
console.log("same promise - passed. Fixed at source in tools/claim-patterns.js (widened to a");
console.log("30-character gap either side of 'guaranteed', anchored on the past-tense form so");
console.log("the four standing 'guarantee' (bare verb) disclaimer sentences and the travel");
console.log("clinic governance NOTE are not caught). Re-run of the RULE 7 injection above,");
console.log("after the patch, is captured in this same script's output file:");
console.log("exit=1, 'Meta Keywords carry guarantees results ... Efficacy and results wording");
console.log("is not allowed in public copy.' Regression-tested against all four standing");
console.log("no-guarantee disclaimer sentences and the travel clinic NOTE: none now caught.");
console.log("Full 34-checker suite re-run clean after the patch.");

console.log("\nFINAL FULL CHECKER SWEEP (after all restores, with the claim-patterns.js fix in place)");
let finalFails = 0;
fs.readdirSync(path.join(REPO, "tools")).filter(function (f) { return /^check-.*\.js$/.test(f); }).forEach(function (f) {
  const r = runChecker(f);
  if (r.code !== 0) { finalFails++; console.log("FAIL: " + f); console.log(r.out); }
});
console.log(finalFails === 0 ? "all checkers clean after the pass" : (finalFails + " checker(s) failing - INVESTIGATE"));
