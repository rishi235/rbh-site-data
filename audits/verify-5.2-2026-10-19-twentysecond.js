"use strict";
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var cp = require("child_process");

var ROOT = "/tmp/scratch52_item522";
var SEO_MD = path.join(ROOT, "modules", "branch", "pages", "SEO.md");
var PAGES = {
  aigburth: path.join(ROOT, "modules", "branch", "pages", "pharmacy-mccanns-aigburth.html"),
  sandringham: path.join(ROOT, "modules", "branch", "pages", "pharmacy-mccanns-sandringham.html"),
  bramhall: path.join(ROOT, "modules", "branch", "pages", "pharmacy-scorah-bramhall.html"),
  hazelgrove: path.join(ROOT, "modules", "branch", "pages", "pharmacy-scorah-hazel-grove.html")
};
var CHECKER = path.join(ROOT, "tools", "check-seo-lengths.js");

function sha(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function runChecker() {
  var r = cp.spawnSync("node", [CHECKER], { cwd: ROOT, encoding: "utf8" });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

function restore(p, buf, originalSha) {
  fs.writeFileSync(p, buf);
  var now = sha(p);
  if (now !== originalSha) {
    throw new Error("RESTORE FAILED for " + p + " - sha mismatch after restore");
  }
}

var seoBuf = fs.readFileSync(SEO_MD);
var seoSha = sha(SEO_MD);
var pageBufs = {};
var pageShas = {};
Object.keys(PAGES).forEach(function (k) {
  pageBufs[k] = fs.readFileSync(PAGES[k]);
  pageShas[k] = sha(PAGES[k]);
});

console.log("Baseline SEO.md sha256: " + seoSha);
Object.keys(PAGES).forEach(function (k) {
  console.log("Baseline " + k + " sha256: " + pageShas[k]);
});

var baseline = runChecker();
console.log("\n=== BASELINE RUN ===");
console.log("exit " + baseline.status);
console.log(baseline.stdout);
if (baseline.status !== 0) {
  console.log("ABORT: baseline is not clean, refusing to inject.");
  process.exit(1);
}

var results = [];

function round(name, mutateFn, expectSubstr) {
  mutateFn();
  var r = runChecker();
  var caught = r.status !== 0 && r.stdout.indexOf(expectSubstr) !== -1;
  results.push({ name: name, caught: caught, status: r.status });
  console.log("\n=== " + name + " ===");
  console.log("exit " + r.status + " caught=" + caught);
  console.log(r.stdout);
}

round(
  "RULE1_TITLE_TOO_LONG",
  function () {
    var s = seoBuf.toString("utf8");
    var mutated = s.replace(
      "- **Page Title:** Pharmacy in Aigburth, Merseyside - McCanns Chemist",
      "- **Page Title:** Pharmacy in Aigburth, Merseyside - McCanns Chemist Extra Long Padding Words Here"
    );
    if (mutated === s) throw new Error("mutation 1 did not match source text");
    fs.writeFileSync(SEO_MD, mutated, "utf8");
  },
  "over the 65 limit"
);
restore(SEO_MD, seoBuf, seoSha);

round(
  "RULE2_DESCRIPTION_TOO_SHORT",
  function () {
    var s = seoBuf.toString("utf8");
    var mutated = s.replace(
      "- **Page Description:** Scorah Chemists Bramhall, Bramhall SK7 3LQ. NHS prescriptions, Pharmacy First and private clinics. Serving Bramhall, Cheadle Hulme, Handforth and Poynton.",
      "- **Page Description:** Scorah Chemists Bramhall."
    );
    if (mutated === s) throw new Error("mutation 2 did not match source text");
    fs.writeFileSync(SEO_MD, mutated, "utf8");
  },
  "under the 80 minimum"
);
restore(SEO_MD, seoBuf, seoSha);

round(
  "RULE3_DUPLICATE_PERMALINK",
  function () {
    var s = seoBuf.toString("utf8");
    var mutated = s.replace(
      "- **Page Permalink:** pharmacy-scorah-hazel-grove",
      "- **Page Permalink:** pharmacy-scorah-bramhall"
    );
    if (mutated === s) throw new Error("mutation 3 did not match source text");
    fs.writeFileSync(SEO_MD, mutated, "utf8");
  },
  "permalink"
);
restore(SEO_MD, seoBuf, seoSha);

round(
  "RULE4_DUPLICATE_H1",
  function () {
    var s = pageBufs.sandringham.toString("utf8");
    var mutated = s.replace(
      /<h1>[^<]*<\/h1>/,
      "<h1>Pharmacy in Aigburth - McCanns Chemist</h1>"
    );
    if (mutated === s) throw new Error("mutation 4 did not match source text");
    fs.writeFileSync(PAGES.sandringham, mutated, "utf8");
  },
  "sharing"
);
restore(PAGES.sandringham, pageBufs.sandringham, pageShas.sandringham);

console.log("\n=== FINAL RESTORE CONFIRMATION ===");
console.log("SEO.md sha256 matches baseline: " + (sha(SEO_MD) === seoSha));
Object.keys(PAGES).forEach(function (k) {
  console.log(k + " sha256 matches baseline: " + (sha(PAGES[k]) === pageShas[k]));
});

var finalBaseline = runChecker();
console.log("\n=== FINAL BASELINE RE-RUN ===");
console.log("exit " + finalBaseline.status);
console.log(finalBaseline.stdout);

console.log("\n=== SUMMARY ===");
results.forEach(function (r) {
  console.log(r.name + ": " + (r.caught ? "CAUGHT" : "NOT CAUGHT"));
});
var allCaught = results.every(function (r) { return r.caught; });
console.log("\nALL CAUGHT: " + allCaught);
process.exit(allCaught && finalBaseline.status === 0 ? 0 : 2);
