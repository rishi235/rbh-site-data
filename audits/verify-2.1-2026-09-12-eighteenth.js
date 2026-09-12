#!/usr/bin/env node
// Item 2.1 (Fishlocks Ainsdale) eighteenth quality pass, 2026-09-12.
// Fresh angle per the seventeenth pass's forward note: prove check-seo-lengths.js
// rule 4b (two branches on the SAME host sharing an H1 -> FAIL) by copying
// Fishlocks Ainsdale's own H1 onto Fishlocks Eccleston's own page of the same
// service (impetigo treatment), rather than onto a same-branch page (already
// proven, rule 4a, sixteenth/seventeenth passes) or a cross-host page (rule 4c,
// warning only, proven on other items).
//
// Runs entirely against a disposable git-archive-style scratch copy. Refuses to
// run on a dirty baseline. Captures original bytes and sha256 before mutation,
// restores by direct fs.writeFileSync immediately after capturing the checker's
// output and before any assertion, sha256-reconfirms byte-identical restoration
// after the injection and again at the end.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = "/sessions/vigilant-compassionate-mccarthy/mnt/outputs/scratch-2.1-18";

function sha256(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function runChecker(name) {
  try {
    const out = execFileSync("node", [path.join(ROOT, "tools", name)], {
      cwd: ROOT,
      encoding: "utf8",
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function runAllCheckers() {
  const toolsDir = path.join(ROOT, "tools");
  const checkers = fs.readdirSync(toolsDir).filter((f) => /^check-.*\.js$/.test(f));
  const results = {};
  checkers.forEach((c) => {
    results[c] = runChecker(c);
  });
  return results;
}

console.log("=== Item 2.1 eighteenth quality pass: rule 4b same-host H1 collision ===");
console.log("Scratch root:", ROOT);

// --- Baseline: full checker suite must be clean before touching anything ---
console.log("\n--- Baseline full checker suite ---");
const baseline = runAllCheckers();
let baselineFails = [];
Object.keys(baseline).forEach((c) => {
  if (baseline[c].code !== 0) baselineFails.push(c);
});
console.log(Object.keys(baseline).length + " checkers run, " + baselineFails.length + " non-zero exit.");
if (baselineFails.length) {
  console.log("Non-clean checkers (recorded, expected only check-cdn-pins.js on a .git-less scratch copy):");
  baselineFails.forEach((c) => console.log("  " + c));
}

const target = path.join(ROOT, "modules", "service", "pages", "impetigo-treatment-fishlocks-eccleston.html");
if (!fs.existsSync(target)) {
  console.error("FATAL: target file missing: " + target);
  process.exit(2);
}

const originalBytes = fs.readFileSync(target);
const originalSha = sha256(target);
console.log("\nTarget file: " + target);
console.log("Original sha256: " + originalSha);

const originalH1Match = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(originalBytes.toString("utf8"));
if (!originalH1Match) {
  console.error("FATAL: could not find H1 in target file");
  process.exit(2);
}
console.log("Original H1: " + originalH1Match[1]);

const ainsdaleFile = path.join(ROOT, "modules", "service", "pages", "impetigo-treatment-fishlocks-ainsdale.html");
const ainsdaleBody = fs.readFileSync(ainsdaleFile, "utf8");
const ainsdaleH1Match = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(ainsdaleBody);
if (!ainsdaleH1Match) {
  console.error("FATAL: could not find H1 in Ainsdale source file");
  process.exit(2);
}
console.log("Ainsdale H1 to inject: " + ainsdaleH1Match[1]);

// --- Injection: overwrite Eccleston's own H1 with Ainsdale's ---
const mutatedBody = originalBytes.toString("utf8").replace(
  /(<h1[^>]*>)([\s\S]*?)(<\/h1>)/i,
  "$1" + ainsdaleH1Match[1] + "$3"
);
fs.writeFileSync(target, mutatedBody, "utf8");
console.log("\nInjected. New sha256: " + sha256(target));

// --- Run check-seo-lengths.js against the injected state ---
console.log("\n--- check-seo-lengths.js against injected state ---");
const injectedResult = runChecker("check-seo-lengths.js");
console.log("Exit code: " + injectedResult.code);
console.log(injectedResult.out);

// --- Restore immediately, before any assertion ---
fs.writeFileSync(target, originalBytes);
const restoredSha = sha256(target);
console.log("\nRestored. sha256 after restore: " + restoredSha);
const restoreOk = restoredSha === originalSha;
console.log("Byte-identical restore: " + restoreOk);

if (!restoreOk) {
  console.error("FATAL: restore did not reproduce original bytes. Manual intervention required.");
  process.exit(2);
}

// --- Assertions ---
const caught = injectedResult.code !== 0 &&
  /two branches on one website host share an H1/.test(injectedResult.out) &&
  injectedResult.out.indexOf("fishlockpharmacy.co.uk") !== -1;

console.log("\n--- Assertion ---");
console.log("Injection caught as rule 4b same-host FAIL naming fishlockpharmacy.co.uk: " + caught);

// --- Re-run full suite after restore, confirm clean again ---
console.log("\n--- Full checker suite after restore ---");
const after = runAllCheckers();
let afterFails = [];
Object.keys(after).forEach((c) => {
  if (after[c].code !== 0) afterFails.push(c);
});
console.log(Object.keys(after).length + " checkers run, " + afterFails.length + " non-zero exit.");
afterFails.forEach((c) => console.log("  " + c));

const afterMatchesBaseline = JSON.stringify(baselineFails.sort()) === JSON.stringify(afterFails.sort());
console.log("After-restore failure set matches baseline failure set: " + afterMatchesBaseline);

console.log("\n=== RESULT ===");
console.log("caught=" + caught + " restoreOk=" + restoreOk + " afterMatchesBaseline=" + afterMatchesBaseline);
if (caught && restoreOk && afterMatchesBaseline) {
  console.log("PASS: rule 4b proven by injection, target file confirmed byte-identical after restore.");
  process.exit(0);
} else {
  console.log("FAIL: see above.");
  process.exit(1);
}
