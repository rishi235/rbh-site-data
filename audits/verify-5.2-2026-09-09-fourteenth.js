/*
  verify-5.2-2026-09-09-fourteenth.js

  Item 5.2 (McCanns Aigburth, McCanns Sandringham, Scorah Bramhall, Scorah
  Hazel Grove branch landing pages), fourteenth quality pass.

  tools/check-branch-links.js had zero mentions across this item's thirteen
  prior passes, despite CLAUDE.md naming it as the checker that reads the
  link fields inside branches.json itself (odsCode, nhsEmail, nhsReviewUrl,
  googleReviewUrl, website, pfLink) rather than a generated page, and despite
  this item owning two of the three shared-domain sister pairs in the estate
  (Scorah Bramhall/Hazel Grove and McCanns Aigburth/Sandringham) that the
  checker's own pfLink ownership rule was written specifically to catch.

  Target: scorah_bramhall's own branches.json record. Nine injections across
  all six rule families, matching the discipline of the 3.9 and 3.10 passes
  against this same checker (shell out to the real checker as a child
  process, never import from tools/; refuse to run if branches.json already
  carries a git diff; record the pre-mutation buffer and its sha256 once;
  restore from the in-memory buffer immediately after capturing output and
  before any assertion; sha256-reconfirm and re-check git status after every
  restore).
*/
"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var { execFileSync } = require("child_process");

var ROOT = path.join(__dirname, "..");
var BRANCHES_PATH = path.join(ROOT, "branches.json");
var CHECKER = path.join(ROOT, "tools", "check-branch-links.js");

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function gitStatusPorcelain(args) {
  return execFileSync("git", ["status", "--porcelain"].concat(args), { cwd: ROOT }).toString();
}

function runChecker() {
  try {
    var out = execFileSync("node", [CHECKER], { cwd: ROOT }).toString();
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "").toString() + (e.stderr || "").toString() };
  }
}

// ---- guard: refuse to run against a dirty tree -----------------------------
var preStatus = gitStatusPorcelain(["--", "branches.json"]);
if (preStatus.trim() !== "") {
  console.error("REFUSING TO RUN: branches.json already carries a git diff:\n" + preStatus);
  process.exit(2);
}

var originalBuf = fs.readFileSync(BRANCHES_PATH);
var originalSha = sha256(originalBuf);
console.log("Baseline branches.json sha256: " + originalSha);

var baseline = runChecker();
console.log("Baseline checker exit code: " + baseline.code);
console.log(baseline.out);
if (baseline.code !== 0) {
  console.error("REFUSING TO RUN: baseline check-branch-links.js is not clean.");
  process.exit(2);
}

var results = [];

function restore() {
  fs.writeFileSync(BRANCHES_PATH, originalBuf);
  var nowSha = sha256(fs.readFileSync(BRANCHES_PATH));
  var status = gitStatusPorcelain(["--", "branches.json"]);
  if (nowSha !== originalSha) {
    throw new Error("RESTORE FAILED: sha256 mismatch after restore.");
  }
  if (status.trim() !== "") {
    throw new Error("RESTORE FAILED: git status not clean after restore:\n" + status);
  }
}

function mutateAndRun(label, mutateFn) {
  var data = JSON.parse(originalBuf.toString("utf8"));
  var b = data.branches.find(function (x) { return x.id === "scorah_bramhall"; });
  if (!b) throw new Error("scorah_bramhall not found in branches.json");
  mutateFn(b, data);
  fs.writeFileSync(BRANCHES_PATH, JSON.stringify(data, null, 2) + "\n");
  var res = runChecker();
  restore();
  results.push({ label: label, code: res.code, out: res.out });
  console.log("---- " + label + " ----");
  console.log("exit code: " + res.code);
  console.log(res.out);
}

// (1) odsCode duplicate - swap to Riddings Pharmacy's real ODS code (FDW90)
mutateAndRun("1 odsCode duplicate (-> Riddings FDW90)", function (b) {
  b.odsCode = "FDW90";
});

// (2) nhsEmail rewritten, odsCode left correct
mutateAndRun("2 nhsEmail wrong, odsCode correct", function (b) {
  b.nhsEmail = "pharmacy.wrongaddress@nhs.net";
});

// (3) nhsReviewUrl truncated to stop at the ODS code (the Gordon Short defect)
mutateAndRun("3 nhsReviewUrl truncated short of /leave-a-review", function (b) {
  b.nhsReviewUrl = "https://www.nhs.uk/services/pharmacy/scorah-chemists-bramhall/X" + b.odsCode;
});

// (4) googleReviewUrl malformed shape (missing /r/ and /review)
mutateAndRun("4 googleReviewUrl malformed shape", function (b) {
  b.googleReviewUrl = "https://g.page/CZdA75DAMigGEAE";
});

// (5) googleReviewUrl set equal to Scorah Hazel Grove's real link (sister)
mutateAndRun("5 googleReviewUrl duplicate of sister branch", function (b, data) {
  var sis = data.branches.find(function (x) { return x.id === "scorah_hazel"; });
  b.googleReviewUrl = sis.googleReviewUrl;
});

// (6) website given a trailing slash (shape rule + knock-on pfLink host rule)
mutateAndRun("6 website trailing slash", function (b) {
  b.website = b.website + "/";
});

// (7) pfLink repointed cross-host, at a real Fishlocks Ainsdale page
mutateAndRun("7 pfLink cross-host (-> Fishlocks Ainsdale page)", function (b) {
  b.pfLink = "https://fishlockpharmacy.co.uk/pharmacy-first-fishlocks-ainsdale.html";
});

// (8) pfLink rewritten to drop .html
mutateAndRun("8 pfLink missing .html", function (b) {
  b.pfLink = b.pfLink.replace(/\.html$/, "");
});

// (9) pfLink repointed at Scorah Hazel Grove's own REAL generated page -
// same host (scorah-chemists.co.uk), so it resolves; exercises the
// same-host ownership branch of the rule directly, the exact silent
// wrong-pharmacy-booking scenario CLAUDE.md's "link fields" section and
// the checker's own header both describe for this sister pair.
mutateAndRun("9 pfLink same-host sister ownership (-> Scorah Hazel Grove real page)", function (b) {
  b.pfLink = "https://www.scorah-chemists.co.uk/pharmacy-first-scorah-hazel-grove.html";
});

// ---- final re-confirmation --------------------------------------------------
var finalSha = sha256(fs.readFileSync(BRANCHES_PATH));
var finalStatus = gitStatusPorcelain(["--", "branches.json"]);
console.log("Final branches.json sha256: " + finalSha + " (matches baseline: " + (finalSha === originalSha) + ")");
console.log("Final git status --porcelain -- branches.json: " + JSON.stringify(finalStatus));

var finalCheck = runChecker();
console.log("Final re-run of check-branch-links.js exit code: " + finalCheck.code);
console.log(finalCheck.out);

var allCaught = results.every(function (r) { return r.code === 1; });
console.log("\nSUMMARY: " + results.length + " injections, all caught (exit 1): " + allCaught);
if (!allCaught || finalSha !== originalSha || finalStatus.trim() !== "" || finalCheck.code !== 0) {
  console.error("VERIFICATION FAILED");
  process.exit(1);
}
console.log("VERIFICATION PASSED");
