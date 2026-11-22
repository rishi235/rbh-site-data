"use strict";
// Read-only verification script, item 6.3, twenty-second quality pass.
// Copies human() and expectedRows() VERBATIM from the tracked
// tools/check-live-hours.js (diff-confirmed below) and exercises them
// against real branches.json data plus synthetic edge cases. No tracked
// file is written. No network request is made by this script.

var fs = require("fs");
var path = require("path");
var ROOT = path.join(__dirname, "..");
var data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));
var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// --- verbatim copy from tools/check-live-hours.js ---
function human(t) {
  var bits = String(t).split(":");
  var h = parseInt(bits[0], 10);
  var m = bits[1];
  var suffix = h >= 12 ? "pm" : "am";
  var h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return h12 + (m === "00" ? "" : "." + m) + suffix;
}
function expectedRows(branch) {
  var oh = branch.openingHours || {};
  var rows = {};
  DAYS.forEach(function (day) {
    if ((oh.closedDays || []).indexOf(day) !== -1) { rows[day] = "Closed"; return; }
    var sessions = (oh.specification || []).filter(function (s) {
      return (s.dayOfWeek || []).indexOf(day) !== -1;
    });
    if (!sessions.length) { rows[day] = "Closed"; return; }
    sessions.sort(function (a, b) { return a.opens < b.opens ? -1 : 1; });
    rows[day] = sessions.map(function (s) { return human(s.opens) + " to " + human(s.closes); }).join(", ");
  });
  return rows;
}
// --- end verbatim copy ---

var results = { diffConfirmed: null, humanTests: [], sortTests: [], realDataRows: {} };

// 1. Diff-confirm the copy is verbatim against the tracked file.
var tracked = fs.readFileSync(path.join(ROOT, "tools/check-live-hours.js"), "utf8");
var thisFile = fs.readFileSync(__filename, "utf8");
var humanBlock = thisFile.match(/function human\(t\) \{[\s\S]*?\n\}/)[0];
var rowsBlock = thisFile.match(/function expectedRows\(branch\) \{[\s\S]*?\n\}/)[0];
results.diffConfirmed = {
  humanMatches: tracked.indexOf(humanBlock) !== -1,
  expectedRowsMatches: tracked.indexOf(rowsBlock) !== -1
};

// 2. human() edge cases never exercised in 21 prior passes.
var humanCases = [
  ["00:00", "12am (midnight)"],
  ["12:00", "12pm (noon)"],
  ["09:05", "9.05am, NOT 9.5am"],
  ["09:00", "9am, no leading .00"],
  ["13:00", "1pm"],
  ["23:59", "11.59pm"],
  ["00:30", "12.30am"],
  ["14:00", "2pm"]
];
humanCases.forEach(function (c) {
  var out = human(c[0]);
  results.humanTests.push({ input: c[0], output: out, expectedShape: c[1] });
});

// 3. expectedRows() sort/join on every REAL multi-session branch in
// branches.json (the 7 lunch-closure branches CLAUDE.md names), confirming
// the morning session always precedes the afternoon session in the
// composed string (ascending by opens), which is what a human reader
// compares against the live snippet order.
var multiBranches = ["mccanns_aigburth", "mccanns_sandringham", "smartts_bootle",
  "hirshmans_ainsdale", "colemanleigh_liverpool", "gordonshorts_crosby", "tiffenbergs_longmoor"];
multiBranches.forEach(function (id) {
  var b = data.branches.find(function (x) { return x.id === id; });
  if (!b) { results.realDataRows[id] = "BRANCH NOT FOUND"; return; }
  var rows = expectedRows(b);
  var splitDayRows = {};
  DAYS.forEach(function (day) {
    var sessionsForDay = (b.openingHours.specification || []).filter(function (s) {
      return (s.dayOfWeek || []).indexOf(day) !== -1;
    });
    if (sessionsForDay.length > 1) splitDayRows[day] = rows[day];
  });
  results.realDataRows[id] = splitDayRows;
});

// 4. Injection test: deliberately REVERSE the sort comparator (descending)
// on a synthetic two-session day and confirm the composed string flips to
// afternoon-before-morning, proving the comparator direction in the
// tracked file is load-bearing and not accidentally already in data
// order. This is the first direct test of sessions.sort() across all 21
// prior passes.
function expectedRowsWrongSort(branch) {
  var oh = branch.openingHours || {};
  var rows = {};
  DAYS.forEach(function (day) {
    if ((oh.closedDays || []).indexOf(day) !== -1) { rows[day] = "Closed"; return; }
    var sessions = (oh.specification || []).filter(function (s) {
      return (s.dayOfWeek || []).indexOf(day) !== -1;
    });
    if (!sessions.length) { rows[day] = "Closed"; return; }
    sessions.sort(function (a, b) { return a.opens > b.opens ? -1 : 1; }); // INJECTED: reversed
    rows[day] = sessions.map(function (s) { return human(s.opens) + " to " + human(s.closes); }).join(", ");
  });
  return rows;
}
var sample = data.branches.find(function (x) { return x.id === "mccanns_aigburth"; });
var correctMonday = expectedRows(sample).Monday;
var wrongMonday = expectedRowsWrongSort(sample).Monday;
results.sortTests.push({
  branch: "mccanns_aigburth",
  day: "Monday",
  correctOrder: correctMonday,
  withInjectedReversedComparator: wrongMonday,
  divergesAsExpected: correctMonday !== wrongMonday
});

console.log(JSON.stringify(results, null, 2));
