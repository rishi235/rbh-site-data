/*
  tools/check-seo-pattern.js - Phase 3 verifier (worklist items 3.2 to 3.13).

  Checks every generated page against the canonical title/H1 pattern in
  tools/seo-pattern.js: the head-comment "Weebly page SEO title" line and
  the page <h1> must equal what the pattern functions produce for that
  branch and page type, and both must carry the branch seoTown.

  Run:  node tools/check-seo-pattern.js
  Exits 1 on any mismatch. Reports per brand so the Phase 3 worklist items
  (one brand each) can be verified individually.
*/
"use strict";

var fs = require("fs");
var path = require("path");
var pat = require("./seo-pattern");

var data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "branches.json"), "utf8"));

// slug (brandSlug-townSlug) -> branch
var bySlug = {};
data.branches.forEach(function (b) {
  if (b.disposed || !b.brandSlug || !b.townSlug) return;
  bySlug[b.brandSlug + "-" + b.townSlug] = b;
});

// Condition slug -> phrases (mirrors CONDITIONS in build-service-pages.js;
// title uses metaCondition, H1 uses h1Phrase - only earache differs).
var CONDITIONS = {
  "uti":         { title: "UTI treatment",                  h1: "UTI treatment" },
  "sore-throat": { title: "Sore throat treatment",          h1: "Sore throat treatment" },
  "sinusitis":   { title: "Sinusitis treatment",            h1: "Sinusitis treatment" },
  "earache":     { title: "Earache treatment",              h1: "Earache treatment for children" },
  "impetigo":    { title: "Impetigo treatment",             h1: "Impetigo treatment" },
  "shingles":    { title: "Shingles treatment",             h1: "Shingles treatment" },
  "insect-bite": { title: "Infected insect bite treatment", h1: "Infected insect bite treatment" }
};

// filename -> { branch, expected title, expected h1 } or null if not a page
// this checker knows how to type.
function expectationsFor(file) {
  var m;
  function branchOf(rest) { return bySlug[rest.replace(/\.html$/, "")] || null; }

  if ((m = /^pharmacy-first-(.+\.html)$/.exec(file))) {
    var b1 = branchOf(m[1]);
    return b1 && { b: b1, title: pat.brandTitle("Pharmacy First", b1), h1: pat.brandH1("Pharmacy First", b1) };
  }
  if ((m = /^(uti|sore-throat|sinusitis|earache|impetigo|shingles|insect-bite)-treatment-(.+\.html)$/.exec(file))) {
    var c = CONDITIONS[m[1]], b2 = branchOf(m[2]);
    return b2 && { b: b2, title: pat.searchTitle(c.title, b2), h1: pat.searchH1(c.h1, b2) };
  }
  if ((m = /^contraception-(.+\.html)$/.exec(file))) {
    var b3 = branchOf(m[1]);
    return b3 && { b: b3, title: pat.searchTitle("NHS contraception service", b3), h1: pat.searchH1("NHS contraception service", b3) };
  }
  if ((m = /^weight-loss-clinic-(.+\.html)$/.exec(file))) {
    var b4 = branchOf(m[1]);
    return b4 && { b: b4, title: pat.brandTitle("Weight Loss Clinic", b4), h1: pat.brandH1("Weight Loss Clinic", b4) };
  }
  if ((m = /^travel-clinic-(.+\.html)$/.exec(file))) {
    var b5 = branchOf(m[1]);
    return b5 && { b: b5, title: pat.brandTitle("Travel Clinic", b5), h1: pat.brandH1("Travel Clinic", b5) };
  }
  if ((m = /^switch-prescriptions-(.+\.html)$/.exec(file))) {
    var b6 = branchOf(m[1]);
    return b6 && { b: b6, title: pat.switchTitle(b6), h1: pat.switchH1(b6) };
  }
  if ((m = /^pharmacy-(.+\.html)$/.exec(file))) {
    var b7 = branchOf(m[1]);
    return b7 && { b: b7, title: pat.landingTitle(b7), h1: pat.landingH1(b7) };
  }
  return null;
}

var DIRS = [
  path.join(__dirname, "..", "modules", "service", "pages"),
  path.join(__dirname, "..", "modules", "switch", "pages"),
  path.join(__dirname, "..", "modules", "branch", "pages")
];

var perBrand = {}; // brandLabel -> { pages: n, fails: [] }
var checked = 0, skipped = 0, fails = 0;

DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(function (file) {
    if (!/\.html$/.test(file)) return;
    var exp = expectationsFor(file);
    if (!exp) { skipped++; return; }
    var html = fs.readFileSync(path.join(dir, file), "utf8");

    var tm = /Weebly page SEO title:\s*(.+?)\s*$/m.exec(html);
    var hm = /<h1>([\s\S]*?)<\/h1>/.exec(html);
    var gotTitle = tm ? tm[1].trim() : "(no SEO title line)";
    var gotH1 = hm ? hm[1].replace(/\s+/g, " ").trim() : "(no h1)";

    var brand = exp.b.brandLabel;
    perBrand[brand] = perBrand[brand] || { pages: 0, fails: [] };
    perBrand[brand].pages++;
    checked++;

    if (gotTitle !== exp.title) { perBrand[brand].fails.push(file + ": title '" + gotTitle + "' != '" + exp.title + "'"); fails++; }
    if (gotH1 !== exp.h1) { perBrand[brand].fails.push(file + ": h1 '" + gotH1 + "' != '" + exp.h1 + "'"); fails++; }
    pat.checkTitle(gotTitle, exp.b).forEach(function (p) {
      if (p.indexOf("WARN") !== 0) { perBrand[brand].fails.push(file + ": " + p); fails++; }
    });
  });
});

Object.keys(perBrand).sort().forEach(function (brand) {
  var r = perBrand[brand];
  console.log((r.fails.length ? "FAIL " : "OK   ") + brand + " - " + r.pages + " pages" + (r.fails.length ? ", " + r.fails.length + " mismatches" : ""));
  r.fails.forEach(function (f) { console.log("       " + f); });
});
console.log("\n" + checked + " pages checked (" + skipped + " skipped as non-pattern files), " + fails + " failures.");
process.exit(fails ? 1 : 0);
