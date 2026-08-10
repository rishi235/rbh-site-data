/*
  tools/check-seo-lengths.js - SERP length and uniqueness verifier.

  Why this exists
  ---------------
  Three checkers already cover the SEO strings, and none of them looks at
  the two things Google actually does to them:

    - check-seo-pattern.js  proves each title and H1 matches the pattern
                            defined in tools/seo-pattern.js.
    - check-seo-sheets.js   proves each page and its Weebly paste sheet
                            carry the same title and description.
    - check-em-dashes.js    proves no em or en dash reaches public copy.

  A title can satisfy the pattern, agree with its sheet, carry no dashes,
  and still be 70 characters long, in which case Google truncates it and
  the brand name is the part that disappears. A description can be inside
  the pattern and still be too short to say anything. And two branches in
  the same town can end up with byte-identical titles or descriptions,
  which is the self-competition that Phase 3 of the audit exists to stop.

  Every quality pass so far has checked lengths by hand, one brand at a
  time (Cherry Lane on 2026-08-09, Hirshmans on 2026-08-10). This makes
  it a rule instead of a habit.

  What it enforces, on the paste sheets, because those hold the strings a
  human types into Weebly > Pages > SEO Settings:

    1. Page Title is 65 characters or fewer. Past that, Google truncates.
    2. Page Description is between 80 and 165 characters. Shorter says
       nothing; longer is cut mid-sentence.
    3. No two pages share a title, a description or a permalink.

  Accepted exceptions live in KNOWN below. Each one needs a reason and a
  question id, so the list cannot quietly become a place to hide defects.
  Remove an entry the moment its question is answered and applied.

  Run:  node tools/check-seo-lengths.js
  Exits 1 on any failure. Known exceptions are reported, not failed.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

var TITLE_MAX = 65;
var DESC_MIN = 80;
var DESC_MAX = 165;

var SHEETS = [
  path.join(ROOT, "modules", "branch", "pages", "SEO.md"),
  path.join(ROOT, "modules", "service", "pages", "SEO.md"),
  path.join(ROOT, "modules", "service", "pages", "CONTRACEPTION-SEO.md"),
  path.join(ROOT, "modules", "service", "pages", "TRAVEL-CLINIC-SEO.md"),
  path.join(ROOT, "modules", "service", "pages", "WEIGHT-LOSS-SEO.md"),
  path.join(ROOT, "modules", "switch", "pages", "SEO.md")
];

// Accepted, decision pending. slug -> { field, reason, question }
var KNOWN = {
  "insect-bite-treatment-coleman-leigh-walton": {
    field: "title",
    reason: "70 characters. The longest condition name meets the longest brand name, so Google truncates and the brand is what is lost. Both ways out change public copy: shorten the NHS condition wording, or shorten the trading name Q1 settled.",
    question: "Q14"
  }
};

function rel(p) { return path.relative(ROOT, p).replace(/\\/g, "/"); }
function norm(s) { return (s || "").replace(/\s+/g, " ").trim(); }

// ---------------------------------------------------------------------------
// Parse the paste sheets. Same block shape as check-seo-sheets.js reads.
// ---------------------------------------------------------------------------
var entries = [];
var failures = [];
var known = [];
var missingSheet = 0;

SHEETS.forEach(function (sheetPath) {
  if (!fs.existsSync(sheetPath)) {
    failures.push("missing paste sheet " + rel(sheetPath));
    missingSheet++;
    return;
  }
  var lines = fs.readFileSync(sheetPath, "utf8").split(/\r?\n/);
  var cur = null;

  function flush() {
    if (cur && cur.permalink) entries.push(cur);
    cur = null;
  }

  lines.forEach(function (line) {
    var m;
    if (/^##\s+/.test(line)) {
      flush();
      cur = {
        sheet: rel(sheetPath),
        heading: norm(line.replace(/^##\s+/, "")),
        title: "", permalink: "", desc: ""
      };
      return;
    }
    if (!cur) return;
    if ((m = /^-\s+\*\*Page Title:\*\*\s*(.*)$/.exec(line))) cur.title = norm(m[1]);
    else if ((m = /^-\s+\*\*Page Permalink:\*\*\s*(.*)$/.exec(line))) cur.permalink = norm(m[1]).replace(/\.html$/, "");
    else if ((m = /^-\s+\*\*Page Description:\*\*\s*(.*)$/.exec(line))) cur.desc = norm(m[1]);
  });
  flush();
});

// ---------------------------------------------------------------------------
// Rule 1 and 2: lengths.
// ---------------------------------------------------------------------------
function report(entry, field, message) {
  var k = KNOWN[entry.permalink];
  if (k && k.field === field) {
    known.push(entry.permalink + " (" + field + "): " + message +
      "\n         " + k.question + ": " + k.reason);
    return;
  }
  failures.push(entry.permalink + " (" + entry.sheet + "): " + message);
}

entries.forEach(function (e) {
  if (!e.title) {
    failures.push(e.permalink + " (" + e.sheet + "): no Page Title");
  } else if (e.title.length > TITLE_MAX) {
    report(e, "title", "title is " + e.title.length + " characters, over the " + TITLE_MAX +
      " limit, so Google truncates it\n         " + e.title);
  }

  if (!e.desc) {
    failures.push(e.permalink + " (" + e.sheet + "): no Page Description");
  } else if (e.desc.length < DESC_MIN) {
    report(e, "desc", "description is only " + e.desc.length + " characters, under the " + DESC_MIN +
      " minimum\n         " + e.desc);
  } else if (e.desc.length > DESC_MAX) {
    report(e, "desc", "description is " + e.desc.length + " characters, over the " + DESC_MAX +
      " limit, so Google cuts it mid-sentence\n         " + e.desc);
  }
});

// ---------------------------------------------------------------------------
// Rule 3: uniqueness. Two pages sharing a title or description compete with
// each other in the same result set instead of ranking for their own town.
// ---------------------------------------------------------------------------
function duplicates(field, label) {
  var map = {};
  entries.forEach(function (e) {
    var v = e[field];
    if (!v) return;
    if (!map[v]) map[v] = [];
    map[v].push(e.permalink);
  });
  Object.keys(map).forEach(function (v) {
    if (map[v].length < 2) return;
    failures.push("duplicate " + label + ' shared by ' + map[v].length + " pages: " +
      map[v].join(", ") + "\n         " + v);
  });
}

duplicates("title", "title");
duplicates("desc", "description");
duplicates("permalink", "permalink");

// ---------------------------------------------------------------------------
// A KNOWN entry that no longer matches anything is stale. Say so, so the
// list gets cleaned out once a question is answered and applied.
// ---------------------------------------------------------------------------
var live = {};
entries.forEach(function (e) { live[e.permalink] = true; });
Object.keys(KNOWN).forEach(function (slug) {
  if (!live[slug]) {
    failures.push("KNOWN lists " + slug + " but no paste sheet carries that permalink - remove the stale entry");
  }
});

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
var lens = entries.map(function (e) { return e.title.length; }).sort(function (a, b) { return a - b; });
var dlens = entries.map(function (e) { return e.desc.length; }).sort(function (a, b) { return a - b; });

console.log("check-seo-lengths");
console.log("  " + entries.length + " paste-sheet entries across " + (SHEETS.length - missingSheet) + " sheets");
if (entries.length) {
  console.log("  titles       " + lens[0] + " to " + lens[lens.length - 1] + " characters (limit " + TITLE_MAX + ")");
  console.log("  descriptions " + dlens[0] + " to " + dlens[dlens.length - 1] + " characters (window " + DESC_MIN + " to " + DESC_MAX + ")");
}

known.forEach(function (k) { console.log("  KNOWN " + k); });

if (failures.length) {
  console.log("");
  failures.forEach(function (f) { console.log("  FAIL " + f); });
  console.log("\ncheck-seo-lengths: " + failures.length + " failure(s), " + known.length + " known issue(s) awaiting a decision.");
  process.exit(1);
}
console.log("");
console.log("check-seo-lengths: clean" +
  (known.length ? ", " + known.length + " known issue(s) awaiting a decision." : ", every title and description fits and is unique."));
process.exit(0);
