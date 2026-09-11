"use strict";
// Fourteenth quality pass on item 3.12 (Tiffenbergs Chemist, Liverpool/Aintree).
// FRESH ANGLE: tools/check-travel-clinic-copy.js proven by injection against
// Tiffenbergs' own travel-clinic-tiffenbergs-aintree.html for the first time
// in this item's fourteen-pass history. Thirteen prior passes exercised
// check-nap, check-postcodes, check-em-dashes, check-booking-routes,
// check-jsonld, check-gbp-packs, check-branch-identity, check-map-embeds,
// check-pharmacy-first-eligibility, check-weight-loss-copy,
// check-branch-links and check-switch-copy against this branch, but never
// the checker guarding the third private-paid service description.
//
// Imports nothing from tools/; shells out to the real checker as a child
// process; mutates the page from a byte-copy backup; restores by byte copy
// (not git checkout) and sha256-reconfirms identical before the next.
var fs = require("fs");
var path = require("path");
var cp = require("child_process");

var ROOT = "/sessions/friendly-pensive-maxwell/mnt/rbh-site-data";
var TARGET = path.join(ROOT, "modules/service/pages/travel-clinic-tiffenbergs-aintree.html");
var BACKUP = "/tmp/travel-clinic-tiffenbergs-aintree.pristine.html";
var CHECKER = path.join(ROOT, "tools/check-travel-clinic-copy.js");

function sha256(p) {
  return require("crypto").createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}
function runChecker() {
  var r = cp.spawnSync("node", [CHECKER], { cwd: ROOT, encoding: "utf8" });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}
function restore() {
  fs.copyFileSync(BACKUP, TARGET);
  var h = sha256(TARGET);
  if (h !== baselineHash) throw new Error("RESTORE FAILED, hash mismatch: " + h);
  console.log("  restored, sha256 confirmed " + h);
}

console.log("=== BASELINE ===");
fs.copyFileSync(TARGET, BACKUP);
var baselineHash = sha256(TARGET);
console.log("target: " + TARGET);
console.log("baseline sha256: " + baselineHash);
var base = runChecker();
console.log("baseline checker exit: " + base.code);
if (base.code !== 0) { console.log(base.out); throw new Error("Checker not clean at baseline, aborting."); }
console.log(base.out.split("\n").slice(0,6).join("\n"));

var results = [];

function injection(label, mutate, expectFail) {
  console.log("\n=== " + label + " ===");
  var raw = fs.readFileSync(TARGET, "utf8");
  var mutated = mutate(raw);
  if (mutated === raw) throw new Error("Injection made no change: " + label);
  fs.writeFileSync(TARGET, mutated);
  var r = runChecker();
  var ok = expectFail ? (r.code !== 0) : (r.code === 0);
  console.log("exit: " + r.code + " (expected " + (expectFail ? "FAIL" : "PASS") + ") -> " + (ok ? "AS EXPECTED" : "UNEXPECTED"));
  console.log(r.out);
  results.push({ label: label, expectFail: expectFail, exit: r.code, ok: ok });
  restore();
}

// Injection 1: RULE 6, stock guarantee inserted into the FAQ.
injection("INJECTION 1 - RULE 6 stock guarantee", function (raw) {
  return raw.replace(
    "Most adult travellers can.",
    "Most adult travellers can. We guarantee stock of all travel vaccines."
  );
}, true);

// Injection 2: RULE 7, lead-time internal mismatch (one of three mentions changed).
injection("INJECTION 2 - RULE 7 lead-time internal mismatch", function (raw) {
  return raw.replace(
    "Recommended booking 6 to 8 weeks before you travel",
    "Recommended booking 4 to 6 weeks before you travel"
  );
}, true);

// Injection 3: RULE 9, children/infants cohort line removed.
injection("INJECTION 3 - RULE 9 cohort omission (children and infants)", function (raw) {
  return raw.replace(
    /<li>Children and infants may need a different pathway, please ask when booking<\/li>/,
    ""
  );
}, true);

// Control: reorder two FAQ <details> lines (lines 125-126), no content added/removed/changed.
injection("CONTROL - reorder FAQ entries, no content change", function (raw) {
  var lines = raw.split("\n");
  var idxA = lines.findIndex(function(l){ return l.indexOf("Is the Travel Clinic free on the NHS?") !== -1; });
  var idxB = lines.findIndex(function(l){ return l.indexOf("How far in advance should I book?") !== -1; });
  if (idxA === -1 || idxB === -1) throw new Error("control anchors not found");
  if (idxB !== idxA + 1) throw new Error("control anchors not adjacent as expected");
  var tmp = lines[idxA]; lines[idxA] = lines[idxB]; lines[idxB] = tmp;
  return lines.join("\n");
}, false);

console.log("\n=== FINAL RESTORE CHECK ===");
var finalHash = sha256(TARGET);
console.log("final sha256: " + finalHash + " (matches baseline: " + (finalHash === baselineHash) + ")");
if (finalHash !== baselineHash) throw new Error("FINAL STATE DOES NOT MATCH BASELINE");

console.log("\n=== SUMMARY ===");
results.forEach(function (r) {
  console.log((r.ok ? "PASS-AS-EXPECTED" : "**UNEXPECTED**") + "  " + r.label + "  (exit " + r.exit + ")");
});
var allOk = results.every(function (r) { return r.ok; });
console.log("\nALL AS EXPECTED: " + allOk);
fs.unlinkSync(BACKUP);
process.exit(allOk ? 0 : 1);
