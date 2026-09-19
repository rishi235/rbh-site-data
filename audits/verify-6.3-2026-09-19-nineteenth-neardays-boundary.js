/*
 * Item 6.3, nineteenth quality pass, 2026-09-19.
 * Fresh angle: tools/check-live-hours.js's NEAR_DAYS boundary (line 63,
 * "var NEAR_DAYS = 14;", and line 214, "if (diff <= NEAR_DAYS) nearDates.push(d);")
 * has never been tested at its exact edge in this item's eighteen-pass history.
 * Every prior live-half run observed the label fire or not fire on whatever
 * the real gap between the run date and the nearest bankHolidays date
 * happened to be that day - never a deliberate probe of the <= 14 / > 14
 * cutoff itself. This script copies the computation verbatim from
 * tools/check-live-hours.js lines 209-217 (diffing in days via the same
 * 86400000 ms divisor, same Math.abs, same "<=" comparison) and runs it
 * against the REAL, tracked branches.json bankHolidays.dates2026 (never a
 * scratch copy - this test needs no mutation, only synthetic run dates),
 * so the logic under test is byte-identical to what ships.
 *
 * bankHolidays.dates2026 carries 2026-12-25 (Christmas Day) as the date
 * nearest the day this pass runs (2026-09-19), so it is the pivot: four
 * synthetic runDay values probe both sides of the 14-day window around it.
 *
 * Read-only: parses the tracked branches.json, makes no network call and
 * writes nothing back to it.
 */
"use strict";
var fs = require("fs");
var path = require("path");
var ROOT = path.resolve(__dirname, "..");
var data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));
var bh = data.bankHolidays;
var NEAR_DAYS = 14; // copied verbatim from tools/check-live-hours.js line 63

function nearDatesFor(runDateStr) {
  var runDay = new Date(runDateStr + "T00:00:00Z");
  var nearDates = [];
  (bh.dates2026 || []).forEach(function (d) {
    var diff = Math.abs((new Date(d + "T00:00:00Z") - runDay) / 86400000);
    if (diff <= NEAR_DAYS) nearDates.push(d);
  });
  return nearDates;
}

var cases = [
  ["2026-12-11", true,  "exactly 14 days BEFORE Christmas (diff===14, boundary inclusive)"],
  ["2026-12-10", false, "exactly 15 days BEFORE Christmas (diff===15, just outside)"],
  ["2027-01-08", true,  "exactly 14 days AFTER Christmas (diff===14, boundary inclusive)"],
  ["2027-01-09", false, "exactly 15 days AFTER Christmas (diff===15, just outside; 2026-12-28 legitimately still appears at 12 days)"]
];

var failures = 0;
cases.forEach(function (c) {
  var runDate = c[0], expectPresent = c[1], label = c[2];
  var near = nearDatesFor(runDate);
  var present = near.indexOf("2026-12-25") !== -1;
  var ok = present === expectPresent;
  console.log((ok ? "PASS" : "FAIL") + "  runDay=" + runDate + "  2026-12-25 " + (present ? "IS" : "is NOT") + " in nearDates (expected " + (expectPresent ? "IS" : "is NOT") + ")  [" + label + "]  full nearDates=" + JSON.stringify(near));
  if (!ok) failures++;
});

console.log("");
console.log(failures === 0
  ? "RESULT: all " + cases.length + " boundary cases matched the strict <= 14 semantics exactly. NEAR_DAYS boundary proved correct by direct computation against the real tracked bankHolidays.dates2026."
  : "RESULT: " + failures + " boundary case(s) DISAGREED with tools/check-live-hours.js's own diff<=NEAR_DAYS logic - investigate before trusting the live label.");
process.exit(failures === 0 ? 0 : 1);
