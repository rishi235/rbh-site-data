/*
  audits/sw-vacuity-probe-2026-08-13.js - item 3.3 quality pass, 2026-08-13.

  Asks one question about the service-word rule added on the 2026-08-13 item
  3.2 pass: for each branch and page type, is the service word present because
  the SERVICE PHRASE put it there, or only because the BRAND NAME happens to
  contain it?

  Where the brand supplies it, the rule is vacuous: the composer could drop its
  service phrase entirely and checkTitle/checkH1 would still pass, because the
  brand keeps the word in the string.

  Method: compose the real title/H1, remove the brandLabel (and its Q14
  shortened form), then re-run the same service-word test the checkers use.
  Read-only. Prints a table.
*/
"use strict";

var path = require("path");
var pat = require(path.join(__dirname, "..", "tools", "seo-pattern"));
var data = require(path.join(__dirname, "..", "branches.json"));

// Same lists check-seo-pattern.js expectationsFor() attaches per page type.
var TYPES = [
  { key: "landing", sw: ["pharmacy"], title: function (b) { return pat.landingTitle(b); }, h1: function (b) { return pat.landingH1(b); } },
  { key: "pfOverview", sw: ["pharmacy first"], title: function (b) { return pat.brandTitle("Pharmacy First", b); }, h1: function (b) { return pat.brandH1("Pharmacy First", b); } },
  { key: "pfCondition", sw: ["uti", "treatment"], title: function (b) { return pat.searchTitle("UTI treatment", b); }, h1: function (b) { return pat.searchH1("UTI treatment", b); } },
  { key: "contraception", sw: ["contraception", "contraceptive"], title: function (b) { return pat.searchTitle("NHS contraception service", b); }, h1: function (b) { return pat.searchH1("NHS contraception service", b); } },
  { key: "weightLoss", sw: ["weight loss"], title: function (b) { return pat.brandTitle("Weight Loss Clinic", b); }, h1: function (b) { return pat.brandH1("Weight Loss Clinic", b); } },
  { key: "travelClinic", sw: ["travel"], title: function (b) { return pat.brandTitle("Travel Clinic", b); }, h1: function (b) { return pat.brandH1("Travel Clinic", b); } },
  { key: "switch", sw: ["prescription"], title: function (b) { return pat.switchTitle(b); }, h1: function (b) { return pat.switchH1(b); } }
];

function stripBrand(text, brand) {
  var out = String(text || "");
  var shorter = pat.shortenBrand(brand);
  [brand, shorter].forEach(function (v) {
    if (!v) return;
    out = out.split(v).join(" ");
  });
  return out;
}

var vacuous = [];
var solid = 0;

data.branches.forEach(function (b) {
  if (b.disposed || b.id === "rbh_head_office_aintree" || !b.seoTown || !b.brandLabel) return;
  TYPES.forEach(function (t) {
    [["title", t.title(b)], ["h1", t.h1(b)]].forEach(function (leg) {
      var full = leg[1];
      // Sanity: the rule should pass on the real string.
      if (!pat.hasServiceWord(full, t.sw)) {
        vacuous.push("REAL STRING ALREADY FAILS " + b.id + " " + t.key + " " + leg[0] + ": " + full);
        return;
      }
      var without = stripBrand(full, b.brandLabel);
      if (pat.hasServiceWord(without, t.sw)) { solid++; return; }
      vacuous.push(b.brandLabel + " / " + b.seoTown + "  " + t.key + " " + leg[0] +
        "\n            real:        " + full +
        "\n            brand gone:  " + without.replace(/\s+/g, " ").trim() +
        "\n            -> the service word came ONLY from the brand name");
    });
  });
});

console.log("Service-word vacuity probe (item 3.3 quality pass, 2026-08-13)");
console.log("  " + solid + " branch/type/leg combinations where the service phrase supplies the word");
console.log("  " + vacuous.length + " where it does NOT (rule passes on the brand name alone)");
if (vacuous.length) {
  console.log("");
  vacuous.forEach(function (v) { console.log("  VACUOUS " + v); });
}
