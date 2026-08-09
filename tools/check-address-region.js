/*
  check-address-region.js

  WHY THIS EXISTS
  addressRegion is the schema.org PostalAddress field. For a GB address it
  must hold the COUNTY, because that is the first-order administrative
  division Google reads out of LocalBusiness structured data. A borough or a
  district in that field is wrong, and no other checker could see it:
  check-nap proves every page AGREES with branches.json, which stays green
  even when branches.json itself carries the wrong value.

  Found by the item 3.3 quality pass on 2026-08-09: Fishlocks Eccleston
  carried "Chorley" (a borough of Lancashire) where every other branch
  carried a county. It had been noticed on 2026-08-05 and left, because the
  same field also feeds the landing page title, where "Eccleston, Chorley" is
  the stronger local search qualifier. The two uses are now separate fields:
  addressRegion is the county for schema, seoRegion is the optional title
  qualifier. This checker guards the schema half.

  RBH is a North West England group, so the allow-list is the four counties
  the estate can legitimately sit in. If the group ever buys outside the
  North West, add the county here rather than widening the rule.

  Exit code 1 on any failure.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));

// Ceremonial counties covering RB Healthcare's estate.
var COUNTIES = [
  "Merseyside",
  "Greater Manchester",
  "Lancashire",
  "Cheshire"
];

var failures = [];
var warnings = [];
var checked = 0;

data.branches.forEach(function (b) {
  if (b.disposed) return;
  checked++;

  var region = b.addressRegion || "";

  if (!region) {
    failures.push(b.id + ": addressRegion is empty. Schema needs the county.");
    return;
  }

  if (COUNTIES.indexOf(region) === -1) {
    failures.push(
      b.id + ': addressRegion is "' + region + '", which is not one of the ' +
      "counties this group trades in (" + COUNTIES.join(", ") + "). " +
      "addressRegion must be the county, not a borough, district or town. " +
      "If it was meant as a search qualifier, put it in seoRegion instead."
    );
    return;
  }

  if (region === b.addressLocality) {
    failures.push(
      b.id + ': addressRegion equals addressLocality ("' + region + '"). ' +
      "One of them is wrong; the region must be the wider county."
    );
    return;
  }

  // seoRegion is optional. Where it is set it should differ from the county,
  // otherwise it is redundant and will drift.
  if (b.seoRegion && b.seoRegion === region) {
    warnings.push(
      b.id + ': seoRegion equals addressRegion ("' + region + '"), so it is ' +
      "doing nothing. Remove it, or the two will drift apart."
    );
  }
  if (b.seoRegion && b.seoRegion === b.seoTown) {
    warnings.push(
      b.id + ': seoRegion equals seoTown ("' + b.seoTown + '"), which would ' +
      "produce a landing title reading \"in X, X\"."
    );
  }
});

console.log("check-address-region");
console.log("  " + checked + " trading branches checked against " +
  COUNTIES.length + " permitted counties");

warnings.forEach(function (w) { console.log("  WARN  " + w); });
failures.forEach(function (f) { console.log("  FAIL  " + f); });

if (failures.length) {
  console.log("");
  console.log("check-address-region: " + failures.length + " failure(s).");
  process.exit(1);
}

console.log("");
console.log("check-address-region: clean, every addressRegion is a county" +
  (warnings.length ? " (" + warnings.length + " warning(s))" : "") + ".");
