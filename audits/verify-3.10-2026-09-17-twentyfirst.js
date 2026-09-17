#!/usr/bin/env node
/*
  audits/verify-3.10-2026-09-17-twentyfirst.js

  Item 3.10 (Riddings Pharmacy, Timperley) twenty-first quality pass.
  Proves tools/check-url-scheme.js against Riddings' own files for the first
  time in twenty-one passes (named as untested by the twentieth pass's own
  forward note). Six injections plus one control, each restored from a saved
  original and sha256-reconfirmed identical before the next.

  Read-only against the tracked repo except for the mutate/restore cycle
  below, which always restores before this script exits. Run:
    node audits/verify-3.10-2026-09-17-twentyfirst.js
*/
"use strict";
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var cp = require("child_process");

var ROOT = path.join(__dirname, "..");
function abs(p) { return path.join(ROOT, p); }
function sha(p) { return crypto.createHash("sha256").update(fs.readFileSync(abs(p))).digest("hex"); }
function read(p) { return fs.readFileSync(abs(p), "utf8"); }
function write(p, s) { fs.writeFileSync(abs(p), s); }

var PAGE = "modules/service/pages/contraception-riddings-timperley.html";
var DATA = "branches.json";
var CHECKER = "tools/check-url-scheme.js";
var MANUAL = "GBP_MANUAL.md";

var baseline = {
  page: read(PAGE),
  data: read(DATA),
  checker: read(CHECKER),
  manual: read(MANUAL)
};
var baselineSha = { page: sha(PAGE), data: sha(DATA), checker: sha(CHECKER), manual: sha(MANUAL) };

function restore() {
  write(PAGE, baseline.page);
  write(DATA, baseline.data);
  write(CHECKER, baseline.checker);
  write(MANUAL, baseline.manual);
}
function confirmRestored(label) {
  var ok = sha(PAGE) === baselineSha.page && sha(DATA) === baselineSha.data
    && sha(CHECKER) === baselineSha.checker && sha(MANUAL) === baselineSha.manual;
  console.log("  [restore check " + label + "] " + (ok ? "OK, byte-identical to baseline" : "MISMATCH - INVESTIGATE"));
  if (!ok) process.exitCode = 2;
}
function run() {
  var r = cp.spawnSync("node", [CHECKER], { cwd: ROOT, encoding: "utf8" });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}
function section(n, desc) {
  console.log("\n--- Injection " + n + ": " + desc + " ---");
}

console.log("BASELINE shas: page=" + baselineSha.page.slice(0,12) + " data=" + baselineSha.data.slice(0,12)
  + " checker=" + baselineSha.checker.slice(0,12) + " manual=" + baselineSha.manual.slice(0,12));
var pre = run();
console.log("Pre-injection run: exit " + pre.code + " (expect 0)");
console.log(pre.out.trim().split("\n").slice(-3).join("\n"));

// ---------------------------------------------------------------------------
section(1, "RULE 1, published page - Riddings own contraception page Website link https->http");
write(PAGE, baseline.page.replace(
  'href="https://www.riddingspharmacy.co.uk" target="_blank" rel="noopener">www.riddingspharmacy.co.uk',
  'href="http://www.riddingspharmacy.co.uk" target="_blank" rel="noopener">www.riddingspharmacy.co.uk'
));
if (read(PAGE) === baseline.page) console.log("  INJECTION DID NOT APPLY - target string not found");
var r1 = run();
console.log("Result: exit " + r1.code + " (expect 1)");
console.log(r1.out.split("\n").filter(function(l){return l.indexOf("INSECURE")!==-1 && l.indexOf("contraception-riddings")!==-1;}).join("\n"));
write(PAGE, baseline.page);
confirmRestored("after injection 1");

// ---------------------------------------------------------------------------
section(2, "RULE 1, branches.json field - riddings_timperley.googleReviewUrl https->http");
write(DATA, baseline.data.replace(
  '"googleReviewUrl": "https://g.page/r/CRtdZliseNZGEAE/review"',
  '"googleReviewUrl": "http://g.page/r/CRtdZliseNZGEAE/review"'
));
if (read(DATA) === baseline.data) console.log("  INJECTION DID NOT APPLY - target string not found");
var r2 = run();
console.log("Result: exit " + r2.code + " (expect 1)");
console.log(r2.out.split("\n").filter(function(l){return l.indexOf("INSECURE branches.json riddings_timperley")!==-1;}).join("\n"));
write(DATA, baseline.data);
confirmRestored("after injection 2");

// ---------------------------------------------------------------------------
section(3, "RULE 2 GBPSITE - remove Riddings from KNOWN, exposing the real existing GBP_MANUAL divergence");
var checkerNoKnown = baseline.checker.replace(
  '  "Riddings": "Q66: as Clear Chemist. One of the three branches whose http/https click split was measured in GSC for item 6.6.",\n',
  ''
);
if (checkerNoKnown === baseline.checker) console.log("  INJECTION DID NOT APPLY - KNOWN entry text not found");
write(CHECKER, checkerNoKnown);
var r3 = run();
console.log("Result: exit " + r3.code + " (expect 1)");
console.log(r3.out.split("\n").filter(function(l){return l.indexOf("GBPSITE")!==-1 && l.indexOf("Riddings")!==-1;}).join("\n"));
write(CHECKER, baseline.checker);
confirmRestored("after injection 3");

// ---------------------------------------------------------------------------
section(4, "RULE 2 STALE - fix GBP_MANUAL Riddings row to https (matching), KNOWN entry left in place");
var manualFixed = baseline.manual.replace(
  "| Riddings | http://www.riddingspharmacy.co.uk/ | WRONG SCHEME, Q66 |",
  "| Riddings | https://www.riddingspharmacy.co.uk/ | WRONG SCHEME, Q66 |"
);
if (manualFixed === baseline.manual) console.log("  INJECTION DID NOT APPLY - row text not found");
write(MANUAL, manualFixed);
var r4 = run();
console.log("Result: exit " + r4.code + " (expect 1)");
console.log(r4.out.split("\n").filter(function(l){return l.indexOf("STALE")!==-1 && l.indexOf("Riddings")!==-1;}).join("\n"));
write(MANUAL, baseline.manual);
confirmRestored("after injection 4");

// ---------------------------------------------------------------------------
section(5, "RULE 3 MAPPED - rename the Riddings row's profile column text, PROFILE_TO_BRANCH key left unchanged");
var manualRenamed = baseline.manual.replace(
  "| Riddings | http://www.riddingspharmacy.co.uk/ | WRONG SCHEME, Q66 |",
  "| Riddings Chemist | http://www.riddingspharmacy.co.uk/ | WRONG SCHEME, Q66 |"
);
if (manualRenamed === baseline.manual) console.log("  INJECTION DID NOT APPLY - row text not found");
write(MANUAL, manualRenamed);
var r5 = run();
console.log("Result: exit " + r5.code + " (expect 1)");
console.log(r5.out.split("\n").filter(function(l){return l.indexOf("Riddings")!==-1;}).join("\n"));
write(MANUAL, baseline.manual);
confirmRestored("after injection 5");

// ---------------------------------------------------------------------------
section(6, "CONTROL - harmless GBP_MANUAL edit near the Riddings row, no scheme/profile/mapping text touched");
var manualControl = baseline.manual.replace(
  "| Riddings | http://www.riddingspharmacy.co.uk/ | WRONG SCHEME, Q66 |",
  "| Riddings | http://www.riddingspharmacy.co.uk/  | WRONG SCHEME, Q66 |"
); // one extra trailing space in the website cell only, trimmed by cells.map(trim), so semantically identical
if (manualControl === baseline.manual) console.log("  CONTROL DID NOT APPLY - row text not found");
write(MANUAL, manualControl);
var r6 = run();
console.log("Result: exit " + r6.code + " (expect 0, control should pass clean)");
write(MANUAL, baseline.manual);
confirmRestored("after control");

var post = run();
console.log("\nPost-injection run: exit " + post.code + " (expect 0)");
console.log(post.out.trim().split("\n").slice(-3).join("\n"));

console.log("\nFinal sha256 check: page=" + (sha(PAGE)===baselineSha.page) + " data=" + (sha(DATA)===baselineSha.data)
  + " checker=" + (sha(CHECKER)===baselineSha.checker) + " manual=" + (sha(MANUAL)===baselineSha.manual));
