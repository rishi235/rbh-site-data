#!/usr/bin/env node
/*
 * check-opening-hours.js
 *
 * Opening hours are the one piece of copy on the site that sends a patient to
 * a locked door. They exist in two places on a branch landing page: the
 * visible "Opening hours" card that a person reads, and the
 * openingHoursSpecification block in JSON-LD that Google reads. Both are
 * generated from branches.json, and nothing checked that either one agreed
 * with it.
 *
 * The defect that prompted this checker (found on the 3.6 quality pass,
 * 2026-08-10): a day can carry more than one session in branches.json,
 * because McCanns close for lunch. The generator wrote each session into the
 * same slot, so the second overwrote the first and both McCanns landing pages
 * told patients the pharmacy opened at 2pm when it opens at 9am. The JSON-LD
 * was right the whole time, so the page disagreed with its own schema.
 *
 * Rules, all failures:
 *   1. Every day of the week has exactly one visible row on the page.
 *   2. Each visible row equals what branches.json says, including every
 *      session on a split day, in opening-time order.
 *   3. The JSON-LD openingHoursSpecification carries exactly the sessions in
 *      branches.json, no more and no fewer.
 *   4. A day cannot be in closedDays and in specification at the same time.
 *   5. A session must close after it opens.
 *
 * The expected strings are composed here from branches.json rather than
 * imported from the generator, on purpose. A checker that calls the code it
 * is checking proves nothing.
 */

var fs = require("fs");
var path = require("path");

var ROOT = path.resolve(__dirname, "..");
var DATA = path.join(ROOT, "branches.json");
var LANDING_DIR = path.join(ROOT, "modules", "branch", "pages");
var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

var failures = [];
var notes = [];

function fail(msg) { failures.push(msg); }

// "08:45" -> "8.45am", "13:00" -> "1pm". UK style, no leading zero.
function human(t) {
  var bits = String(t).split(":");
  var h = parseInt(bits[0], 10);
  var m = bits[1];
  var suffix = h >= 12 ? "pm" : "am";
  var h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return h12 + (m === "00" ? "" : "." + m) + suffix;
}

function expectedRow(branch, day) {
  var oh = branch.openingHours || {};
  var closed = (oh.closedDays || []).indexOf(day) !== -1;
  if (closed) return "Closed";
  var sessions = (oh.specification || []).filter(function (s) {
    return (s.dayOfWeek || []).indexOf(day) !== -1;
  });
  if (!sessions.length) return "Closed";
  sessions.sort(function (a, b) { return a.opens < b.opens ? -1 : a.opens > b.opens ? 1 : 0; });
  return sessions.map(function (s) { return human(s.opens) + " to " + human(s.closes); }).join(", ");
}

function visibleRows(html) {
  var rows = {};
  var re = /<strong>(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):<\/strong>\s*([^<]*)<\/p>/g;
  var m;
  while ((m = re.exec(html)) !== null) {
    if (rows[m[1]] !== undefined) rows[m[1]] = "__DUPLICATE__";
    else rows[m[1]] = m[2].trim();
  }
  return rows;
}

// Parse the page's JSON-LD properly rather than pattern-matching it. A lazy
// regex over the block stops at the first inner "]" (the dayOfWeek array) and
// silently reports no sessions at all, which reads as a failure on every page.
function schemaSessions(html, rel) {
  var blocks = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
  var out = null;
  blocks.forEach(function (raw) {
    var body = raw.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    var obj;
    try {
      obj = JSON.parse(body);
    } catch (e) {
      fail(rel + ": JSON-LD block does not parse as JSON (" + e.message + ")");
      return;
    }
    var list = obj && obj.openingHoursSpecification;
    if (!list) return;
    out = out || [];
    list.forEach(function (s) {
      (s.dayOfWeek || []).forEach(function (d) { out.push(d + " " + s.opens + "-" + s.closes); });
    });
  });
  return out === null ? null : out.sort();
}

function dataSessions(branch) {
  var out = [];
  ((branch.openingHours || {}).specification || []).forEach(function (s) {
    (s.dayOfWeek || []).forEach(function (d) { out.push(d + " " + s.opens + "-" + s.closes); });
  });
  return out.sort();
}

var data = JSON.parse(fs.readFileSync(DATA, "utf8"));
var branches = data.branches.filter(function (b) { return !b.disposed; });

console.log("check-opening-hours");

// Rules 4 and 5 apply to the data itself, landing page or not.
branches.forEach(function (b) {
  var oh = b.openingHours;
  if (!oh) return;
  (oh.closedDays || []).forEach(function (d) {
    var clash = (oh.specification || []).some(function (s) { return (s.dayOfWeek || []).indexOf(d) !== -1; });
    if (clash) fail(b.id + ": " + d + " is listed in closedDays and also carries opening times");
  });
  (oh.specification || []).forEach(function (s) {
    if (!(s.closes > s.opens)) fail(b.id + ": session " + s.opens + " to " + s.closes + " does not close after it opens");
    (s.dayOfWeek || []).forEach(function (d) {
      if (DAYS.indexOf(d) === -1) fail(b.id + ': "' + d + '" is not a day of the week');
    });
  });
});

var checkedPages = 0;
var splitDayBranches = [];

branches.forEach(function (b) {
  if (!b.brandSlug || !b.townSlug) return;
  var oh = b.openingHours || {};
  var perDay = {};
  (oh.specification || []).forEach(function (s) {
    (s.dayOfWeek || []).forEach(function (d) { perDay[d] = (perDay[d] || 0) + 1; });
  });
  var hasSplit = Object.keys(perDay).some(function (d) { return perDay[d] > 1; });
  if (hasSplit) splitDayBranches.push(b.id);

  var file = path.join(LANDING_DIR, "pharmacy-" + b.brandSlug + "-" + b.townSlug + ".html");
  if (!fs.existsSync(file)) return;
  checkedPages++;
  var html = fs.readFileSync(file, "utf8");
  var rel = path.relative(ROOT, file).replace(/\\/g, "/");

  var rows = visibleRows(html);
  DAYS.forEach(function (d) {
    var got = rows[d];
    var want = expectedRow(b, d);
    if (got === undefined) fail(rel + ": no visible row for " + d);
    else if (got === "__DUPLICATE__") fail(rel + ": " + d + " appears more than once in the hours card");
    else if (got !== want) fail(rel + ": " + d + ' reads "' + got + '" but branches.json says "' + want + '"');
  });

  var onPage = schemaSessions(html, rel);
  var inData = dataSessions(b);
  if (onPage === null) {
    if (inData.length) fail(rel + ": branches.json carries opening hours but the page has no openingHoursSpecification");
  } else if (onPage.join(" | ") !== inData.join(" | ")) {
    fail(rel + ": JSON-LD opening hours do not match branches.json");
    fail("    page: " + (onPage.join(", ") || "(none)"));
    fail("    data: " + (inData.join(", ") || "(none)"));
  }
});

console.log("  " + checkedPages + " landing page(s) checked against " + branches.length + " trading branches");
if (splitDayBranches.length) {
  notes.push("branches with a split day (lunch closure), the case that caused the defect: " + splitDayBranches.join(", "));
}
notes.forEach(function (n) { console.log("  NOTE  " + n); });

if (failures.length) {
  console.log("");
  failures.forEach(function (f) { console.log("  FAIL  " + f); });
  console.log("");
  console.log("check-opening-hours: " + failures.length + " failure(s).");
  process.exit(1);
}
console.log("");
console.log("check-opening-hours: clean, every visible and structured opening time matches branches.json.");
