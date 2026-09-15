/*
  audits/verify-3.12-2026-09-15-sixteenth.js

  Item 3.12 (Tiffenbergs Chemist, Aintree), sixteenth quality pass,
  2026-09-15. Fresh angle: tools/check-seo-lengths.js, never once proven
  against this branch by injection across the fifteen prior passes (which
  exercised, in order: check-nap.js, check-postcodes.js, check-em-dashes.js,
  check-booking-routes.js, check-jsonld.js, check-gbp-packs.js,
  check-branch-identity.js, check-map-embeds.js,
  check-pharmacy-first-eligibility.js, check-weight-loss-copy.js,
  check-branch-links.js, check-opening-hours.js, check-switch-copy.js,
  check-travel-clinic-copy.js and check-contraception-copy.js).

  check-seo-lengths.js holds four rules: (1) title <= 65 chars, (2)
  description between 80 and 165 chars, (3) no two pages share a title,
  description or permalink, (4) no two pages share an H1 (same-branch,
  same-host, cross-host legs). This instrument injects one fault per rule
  against Tiffenbergs' own paste-sheet entries and page HTML, plus one
  control, each restored by byte copy (not git checkout) and sha256-
  reconfirmed identical to baseline before the next runs.

  Portable: run from the repo root, no import from tools/, no dependency on
  any prior pass's files. Intended to be run against a scratch copy (e.g.
  git archive HEAD | tar -x) so the tracked working copy is never touched.

  Run:  node audits/verify-3.12-2026-09-15-sixteenth.js
*/
"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var cp = require("child_process");

var ROOT = path.join(__dirname, "..");
var SEO_MD = path.join(ROOT, "modules", "service", "pages", "SEO.md");
var SHINGLES = path.join(ROOT, "modules", "service", "pages", "shingles-treatment-tiffenbergs-aintree.html");
var IMPETIGO = path.join(ROOT, "modules", "service", "pages", "impetigo-treatment-tiffenbergs-aintree.html");
var CHECKER = path.join(ROOT, "tools", "check-seo-lengths.js");

function sha256(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}
function readAll() { return { seo: fs.readFileSync(SEO_MD, "utf8"), shingles: fs.readFileSync(SHINGLES, "utf8"), impetigo: fs.readFileSync(IMPETIGO, "utf8") }; }
function writeAll(o) { fs.writeFileSync(SEO_MD, o.seo); fs.writeFileSync(SHINGLES, o.shingles); fs.writeFileSync(IMPETIGO, o.impetigo); }
function runChecker() {
  var r = cp.spawnSync("node", [CHECKER], { encoding: "utf8" });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}
function must(cond, msg) { if (!cond) { console.log("ASSERT FAILED: " + msg); process.exit(2); } }

var baseline = readAll();
var baselineHashes = { seo: sha256(SEO_MD), shingles: sha256(SHINGLES), impetigo: sha256(IMPETIGO) };
console.log("Baseline hashes: seo=" + baselineHashes.seo.slice(0, 12) + " shingles=" + baselineHashes.shingles.slice(0, 12) + " impetigo=" + baselineHashes.impetigo.slice(0, 12));

var pre = runChecker();
must(pre.code === 0, "checker not clean before any injection");
console.log("Pre-injection run: clean (exit 0)");

function restore() {
  writeAll(baseline);
  must(sha256(SEO_MD) === baselineHashes.seo, "SEO.md did not restore to baseline");
  must(sha256(SHINGLES) === baselineHashes.shingles, "shingles page did not restore to baseline");
  must(sha256(IMPETIGO) === baselineHashes.impetigo, "impetigo page did not restore to baseline");
}

var results = [];

// --- (1) RULE 1: title over 65 characters -----------------------------
(function () {
  var o = readAll();
  var oldStr = "- **Page Title:** UTI treatment in Aintree - Tiffenbergs Chemist\n- **Page Permalink:** uti-treatment-tiffenbergs-aintree";
  var newStr = "- **Page Title:** UTI treatment in Aintree - Tiffenbergs Chemist and Pharmacy Services Centre\n- **Page Permalink:** uti-treatment-tiffenbergs-aintree";
  must(o.seo.indexOf(oldStr) !== -1, "rule1: anchor not found");
  o.seo = o.seo.replace(oldStr, newStr);
  writeAll(o);
  var r = runChecker();
  var caught = r.code !== 0 && /uti-treatment-tiffenbergs-aintree.*over the 65 limit/.test(r.out);
  console.log("(1) RULE 1 title-length: " + (caught ? "CAUGHT" : "MISSED"));
  results.push(["RULE 1 title-length", caught]);
  restore();
})();

// --- (2) RULE 2: description under 80 characters -----------------------
(function () {
  var o = readAll();
  var oldStr = "- **Page Description:** Sore throat treatment at Tiffenbergs Chemist in Aintree. Free NHS Pharmacy First service, be assessed by a pharmacist with no GP appointment needed.";
  var newStr = "- **Page Description:** Sore throat treatment at Tiffenbergs.";
  must(o.seo.indexOf(oldStr) !== -1, "rule2: anchor not found");
  o.seo = o.seo.replace(oldStr, newStr);
  writeAll(o);
  var r = runChecker();
  var caught = r.code !== 0 && /sore-throat-treatment-tiffenbergs-aintree.*under the 80 minimum/.test(r.out);
  console.log("(2) RULE 2 desc-length: " + (caught ? "CAUGHT" : "MISSED"));
  results.push(["RULE 2 desc-length", caught]);
  restore();
})();

// --- (3) RULE 3a: duplicate title (same branch) -------------------------
(function () {
  var o = readAll();
  var oldStr = "- **Page Title:** Sinusitis treatment in Aintree - Tiffenbergs Chemist\n- **Page Permalink:** sinusitis-treatment-tiffenbergs-aintree";
  var newStr = "- **Page Title:** Earache treatment in Aintree - Tiffenbergs Chemist\n- **Page Permalink:** sinusitis-treatment-tiffenbergs-aintree";
  must(o.seo.indexOf(oldStr) !== -1, "rule3a: anchor not found");
  o.seo = o.seo.replace(oldStr, newStr);
  writeAll(o);
  var r = runChecker();
  var caught = r.code !== 0 && /duplicate title shared by 2 pages.*Sinusitis.*Earache/.test(r.out);
  console.log("(3) RULE 3a duplicate-title: " + (caught ? "CAUGHT" : "MISSED"));
  results.push(["RULE 3a duplicate-title", caught]);
  restore();
})();

// --- (4) RULE 3b: duplicate permalink (same branch) ----------------------
(function () {
  var o = readAll();
  var oldStr = "- **Page Permalink:** impetigo-treatment-tiffenbergs-aintree";
  var newStr = "- **Page Permalink:** shingles-treatment-tiffenbergs-aintree";
  must(o.seo.indexOf(oldStr) !== -1, "rule3b: anchor not found");
  o.seo = o.seo.replace(oldStr, newStr);
  writeAll(o);
  var r = runChecker();
  var caught = r.code !== 0 && /duplicate permalink shared by 2 pages.*Impetigo.*Shingles/.test(r.out);
  console.log("(4) RULE 3b duplicate-permalink: " + (caught ? "CAUGHT" : "MISSED"));
  results.push(["RULE 3b duplicate-permalink", caught]);
  restore();
})();

// --- (5) RULE 4a: duplicate H1 on two of the branch's own pages ---------
(function () {
  var o = readAll();
  var oldStr = "<h1>Shingles treatment in Aintree - Tiffenbergs Chemist</h1>";
  var newStr = "<h1>Infected insect bite treatment in Aintree - Tiffenbergs Chemist</h1>";
  must(o.shingles.indexOf(oldStr) !== -1, "rule4a: anchor not found");
  o.shingles = o.shingles.replace(oldStr, newStr);
  writeAll(o);
  var r = runChecker();
  var caught = r.code !== 0 && /one branch uses the same H1 on two of its own pages - tiffenbergs_longmoor/.test(r.out);
  console.log("(5) RULE 4a duplicate-H1-same-branch: " + (caught ? "CAUGHT" : "MISSED"));
  results.push(["RULE 4a duplicate-H1-same-branch", caught]);
  restore();
})();

// --- CONTROL: benign reword, unique, within window -----------------------
(function () {
  var o = readAll();
  var oldStr = "- **Page Description:** Impetigo treatment at Tiffenbergs Chemist in Aintree. Free NHS Pharmacy First service, be assessed by a pharmacist with no GP appointment needed.";
  var newStr = "- **Page Description:** Impetigo treatment available at Tiffenbergs Chemist, Aintree. This free NHS Pharmacy First service means no GP appointment is needed before assessment.";
  must(o.seo.indexOf(oldStr) !== -1, "control: anchor not found");
  o.seo = o.seo.replace(oldStr, newStr);
  writeAll(o);
  var r = runChecker();
  var passed = r.code === 0;
  console.log("(6) CONTROL benign reword: " + (passed ? "PASSED (correct)" : "FAILED (unexpected cross-fire)"));
  results.push(["CONTROL", passed]);
  restore();
})();

var post = runChecker();
must(post.code === 0, "checker not clean after final restore");
must(sha256(SEO_MD) === baselineHashes.seo, "final SEO.md hash mismatch");
must(sha256(SHINGLES) === baselineHashes.shingles, "final shingles hash mismatch");
must(sha256(IMPETIGO) === baselineHashes.impetigo, "final impetigo hash mismatch");
console.log("Post-run restore: clean (exit 0), all three files sha256-confirmed back to baseline.");

var allGood = results.every(function (r) { return r[1]; });
console.log("\nSummary: " + results.filter(function (r) { return r[1]; }).length + "/" + results.length + " legs behaved as expected.");
process.exit(allGood ? 0 : 1);
