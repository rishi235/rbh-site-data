"use strict";
// Injection proof, item 3.13 twelfth pass: run the REAL tools/check-branch-links.js
// as a child process against mutated copies of branches.json targeting
// clearchemist_aintree's own fields, restoring the original buffer and
// sha256-reconfirming byte-identity before the next injection. Nothing is
// committed mid-test.
var fs = require("fs");
var crypto = require("crypto");
var cp = require("child_process");

var FILE = "branches.json";
var original = fs.readFileSync(FILE, "utf8");
var originalHash = crypto.createHash("sha256").update(original).digest("hex");
console.log("baseline sha256: " + originalHash);

function runChecker() {
  var r = cp.spawnSync("node", ["tools/check-branch-links.js"], { encoding: "utf8" });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}

function restore() {
  fs.writeFileSync(FILE, original, "utf8");
  var h = crypto.createHash("sha256").update(fs.readFileSync(FILE, "utf8")).digest("hex");
  if (h !== originalHash) { throw new Error("RESTORE FAILED, hash mismatch"); }
}

function injectAndRun(label, mutateFn) {
  var data = JSON.parse(original);
  var clear = data.branches.find(function (x) { return x.id === "clearchemist_aintree"; });
  mutateFn(clear, data);
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");
  var res = runChecker();
  console.log("--- " + label + " ---");
  console.log("exit code: " + res.code);
  console.log(res.out.split("\n").filter(function(l){return l.indexOf("FAIL")>=0 || l.indexOf("check-branch-links:")>=0;}).join("\n"));
  restore();
  console.log("restored, hash ok");
}

// (1) odsCode duplicated onto another branch's own code - real cross-branch dup
injectAndRun("1: odsCode set to Gordon Short Crosby's own code (FF890 guess, will look up)", function (clear, data) {
  var other = data.branches.find(function (x) { return x.id !== "clearchemist_aintree" && x.odsCode && !x.disposed; });
  clear.__otherId = other.id;
  clear.odsCode = other.odsCode;
});

// (2) nhsEmail wrong (does not match odsCode)
injectAndRun("2: nhsEmail mismatched from own odsCode", function (clear) {
  clear.nhsEmail = "pharmacy.WRONG1@nhs.net";
});

// (3) googleReviewUrl malformed shape
injectAndRun("3: googleReviewUrl malformed (missing /review suffix)", function (clear) {
  clear.googleReviewUrl = clear.googleReviewUrl.replace(/\/review$/, "");
});

// (4) googleReviewUrl duplicated onto another branch's own review link
injectAndRun("4: googleReviewUrl set to another live branch's own link", function (clear, data) {
  var other = data.branches.find(function (x) { return x.id !== "clearchemist_aintree" && x.googleReviewUrl && !x.disposed; });
  clear.googleReviewUrl = other.googleReviewUrl;
});

// (5) website given a trailing slash
injectAndRun("5: website given a trailing slash", function (clear) {
  clear.website = clear.website + "/";
});

console.log("ALL INJECTIONS COMPLETE, branches.json restored to baseline");
var finalHash = crypto.createHash("sha256").update(fs.readFileSync(FILE, "utf8")).digest("hex");
console.log("final sha256: " + finalHash + " match=" + (finalHash === originalHash));
