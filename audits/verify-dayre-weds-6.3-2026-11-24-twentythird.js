/*
 * Standalone, read-only verification for tools/check-live-hours.js's own
 * DAY_RE and daySnippets()/htmlToText() logic (item 6.3, twenty-third
 * quality pass, 2026-11-24). Never touches the tracked repo and never
 * makes a live HTTP request.
 */
"use strict";
var assert = require("assert");

// ---- verbatim from tools/check-live-hours.js (as read this run) ----
var DAY_RE = /\b(mon(day)?|tue(s|sday)?|wed(s|nesday)?|thu(r|rs|rsday)?|fri(day)?|sat(urday)?|sun(day)?)\b/i;

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;/g, "'").replace(/&ndash;|&mdash;/g, "-")
    .replace(/[ \t]+/g, " ");
}

function daySnippets(text) {
  var lines = text.split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean);
  var keep = {};
  lines.forEach(function (l, i) {
    if (DAY_RE.test(l)) {
      for (var j = Math.max(0, i - 6); j <= Math.min(lines.length - 1, i + 2); j++) keep[j] = 1;
    }
  });
  var out = [];
  var run = [];
  lines.forEach(function (l, i) {
    if (keep[i]) { run.push(l); }
    else if (run.length) { out.push(run.join(" | ")); run = []; }
  });
  if (run.length) out.push(run.join(" | "));
  return out;
}
// ---- end verbatim ----

var results = [];
function check(name, fn) {
  try { fn(); results.push([name, "PASS"]); }
  catch (e) { results.push([name, "FAIL: " + e.message]); }
}

var WEEKDAY_ABBREVS = {
  Monday: ["Mon", "Monday"],
  Tuesday: ["Tue", "Tues", "Tuesday"],
  Wednesday: ["Wed", "Weds", "Wednesday"],
  Thursday: ["Thu", "Thur", "Thurs", "Thursday"],
  Friday: ["Fri", "Friday"],
  Saturday: ["Sat", "Saturday"],
  Sunday: ["Sun", "Sunday"]
};
Object.keys(WEEKDAY_ABBREVS).forEach(function (day) {
  WEEKDAY_ABBREVS[day].forEach(function (abbr) {
    check("DAY_RE matches '" + abbr + "' as a bare token (" + day + ")", function () {
      assert.strictEqual(DAY_RE.test(abbr), true, "'" + abbr + "' should match DAY_RE");
    });
    check("DAY_RE matches '" + abbr + "' inside a realistic hours line (" + day + ")", function () {
      var line = abbr + ": 9.00am - 6.00pm";
      assert.strictEqual(DAY_RE.test(line), true, "'" + line + "' should match DAY_RE");
    });
  });
});

check("DAY_RE does not match 'Monthly' (false positive guard)", function () {
  assert.strictEqual(DAY_RE.test("Monthly newsletter"), false);
});
check("DAY_RE does not match 'Friendly' (false positive guard)", function () {
  assert.strictEqual(DAY_RE.test("Friendly staff"), false);
});
check("DAY_RE does not match 'Satisfaction' (false positive guard)", function () {
  assert.strictEqual(DAY_RE.test("Satisfaction guaranteed"), false);
});
check("DAY_RE positive control: 'Sunday roast' should match", function () {
  assert.strictEqual(DAY_RE.test("Sunday roast available"), true);
});

check("daySnippets() builds a snippet around a 'Weds' line exactly as it does for 'Wed'", function () {
  var textWed = [
    "123 High Street", "Anytown",
    "t: 0151 000 0000", "e: shop@example.com",
    "Opening hours",
    "Wed: 9.00am - 6.00pm",
    "Next card heading"
  ].join("\n");
  var textWeds = textWed.replace("Wed:", "Weds:");
  var snipWed = daySnippets(textWed);
  var snipWeds = daySnippets(textWeds);
  assert.strictEqual(snipWed.length, 1, "control: 'Wed' should produce one snippet group");
  assert.strictEqual(snipWeds.length, 1, "'Weds' should produce one snippet group identically to 'Wed'");
});

check("htmlToText() converts <br> to a newline", function () {
  var out = htmlToText("Mon-Fri<br>9am-6pm");
  assert.ok(out.indexOf("\n") !== -1, "expected a newline after <br>");
});
check("htmlToText() converts <br/> (self-closed) to a newline", function () {
  var out = htmlToText("Mon-Fri<br/>9am-6pm");
  assert.ok(out.indexOf("\n") !== -1);
});
check("htmlToText() ends a block element with a newline", function () {
  var out = htmlToText("<p>Weds: 9am-6pm</p><p>Thu: 9am-6pm</p>");
  assert.ok(out.split("\n").filter(Boolean).length >= 2, "expected at least 2 lines from 2 <p> blocks");
});
check("htmlToText() decodes &amp; / &nbsp; / &rsquo; / &mdash;", function () {
  var out = htmlToText("Mon&amp;Tue&nbsp;closed&mdash;see note. We&rsquo;re open Weds.");
  assert.ok(out.indexOf("&") !== -1, "expected & to be decoded");
  assert.ok(out.indexOf(" ") === -1, "expected &nbsp; to become a plain space, not stay encoded");
  assert.ok(out.indexOf("-") !== -1, "expected &mdash; to become a plain hyphen");
  assert.ok(out.indexOf("'") !== -1, "expected &rsquo; to become a plain apostrophe");
});
check("htmlToText() strips <script> and <style> content entirely (not just the tags)", function () {
  var out = htmlToText("<script>var day='Weds';document.write(day);</script><p>Weds: 9am-6pm</p>");
  assert.ok(out.indexOf("document.write") === -1, "script body text must not leak into the stripped text");
  assert.ok(out.indexOf("Weds: 9am-6pm") !== -1, "the real paragraph text must still be present");
});

check("full pipeline: a live page using 'Weds' instead of 'Wed' still yields a snippet", function () {
  var html = "<div class=\"hours-card\">" +
    "<p>123 High Street</p>" +
    "<p>Opening hours</p>" +
    "<p>Mon: 9.00am - 6.00pm</p>" +
    "<p>Tues: 9.00am - 6.00pm</p>" +
    "<p>Weds: 9.00am - 6.00pm</p>" +
    "<p>Thurs: 9.00am - 6.00pm</p>" +
    "<p>Fri: 9.00am - 6.00pm</p>" +
    "</div>";
  var text = htmlToText(html);
  var snips = daySnippets(text);
  var joined = snips.join(" ");
  assert.ok(joined.indexOf("Weds") !== -1, "the 'Weds' line must appear in at least one snippet group");
});

var fails = results.filter(function (r) { return r[1] !== "PASS"; });
results.forEach(function (r) { console.log((r[1] === "PASS" ? "PASS  " : "FAIL  ") + r[0] + (r[1] === "PASS" ? "" : "  -> " + r[1])); });
console.log("");
console.log(results.length + " checks, " + fails.length + " failing.");
process.exit(fails.length ? 1 : 0);
