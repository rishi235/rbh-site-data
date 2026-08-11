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

  And on the PAGES, because the H1 is not on any paste sheet and rule 3
  therefore cannot see it:

    4. No two pages share an H1. Fails for one branch repeating its own
       heading and for two branches on one website host; reported against a
       question id where the two branches sit on different hosts, because
       the family A H1 deliberately carries no brand and changing that is a
       search decision. Added on the item 3.3 quality pass, 2026-08-11.

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

// Rule 4 reads the pages themselves, because the H1 is not on a paste sheet.
var PAGE_DIRS = [
  path.join(ROOT, "modules", "branch", "pages"),
  path.join(ROOT, "modules", "service", "pages"),
  path.join(ROOT, "modules", "switch", "pages")
];

var SHEETS = [
  path.join(ROOT, "modules", "branch", "pages", "SEO.md"),
  path.join(ROOT, "modules", "service", "pages", "SEO.md"),
  path.join(ROOT, "modules", "service", "pages", "CONTRACEPTION-SEO.md"),
  path.join(ROOT, "modules", "service", "pages", "TRAVEL-CLINIC-SEO.md"),
  path.join(ROOT, "modules", "service", "pages", "WEIGHT-LOSS-SEO.md"),
  path.join(ROOT, "modules", "switch", "pages", "SEO.md")
];

// Accepted, decision pending. slug -> { field, reason, question }
//
// Empty as of 2026-08-10. The single entry here was the Coleman and Leighs
// infected insect bite title at 70 characters, held open as Q14. Rishi
// answered on 2026-08-10 (drop "Pharmacy" from the title suffix rather than
// shorten the NHS condition wording) and the fix landed the same day as a
// length-aware rule in tools/seo-pattern.js, so the title is now 61
// characters and the exception was removed rather than left to rot.
var KNOWN = {};

function rel(p) { return path.relative(ROOT, p).replace(/\\/g, "/"); }
function norm(s) { return (s || "").replace(/\s+/g, " ").trim(); }

// ---------------------------------------------------------------------------
// Parse the paste sheets. Same block shape as check-seo-sheets.js reads.
// ---------------------------------------------------------------------------
var entries = [];
var failures = [];
var known = [];
var warnings = [];
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
// Rule 4: the H1, which is on the page and not on any paste sheet.
//
// Rule 3 above reads the sheets, so it covers the title, the description and
// the permalink. It cannot see the H1, and no other checker compares one H1
// to another: check-seo-pattern proves each H1 EQUALS what seo-pattern.js
// composes for that branch and page type, which is a per-page rule.
//
// That matters because a family A H1 deliberately carries no brand. The title
// is "Shingles treatment in Ainsdale - Fishlocks Chemist"; the H1 on the same
// page is "Shingles treatment in Ainsdale". Two RBH pharmacies share a town in
// four places (Ainsdale, Bootle, Walton, Aintree), so on those pages the
// strongest on-page heading is byte-identical between two of our own shops.
//
// Three legs, because the same string means different things in different
// places:
//   4a FAIL  one branch using the same H1 on two of its own pages. A branch
//            declaring one heading twice is never right.
//   4b FAIL  two branches on the SAME website host sharing an H1. That is the
//            shared-domain self-competition items 2.2 and 3.2 exist to stop,
//            on the three pairs that share a domain (Scorah, Fishlocks,
//            McCanns). Clean today because every H1 carries its own town.
//   4c WARN  two branches on different hosts sharing an H1. Real exposure,
//            but whether the H1 should carry the brand is a search decision
//            about 96 family A pages, so it is reported against a question id
//            rather than failed. See Q44.
// ---------------------------------------------------------------------------
var liveBranches = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"))
  .branches.filter(function (b) { return !b.disposed && b.brandSlug && b.townSlug; });

function ownerOf(file) {
  var base = file.replace(/\.html$/, "");
  var hit = null;
  liveBranches.forEach(function (b) {
    var suffix = "-" + b.brandSlug + "-" + b.townSlug;
    if (base.length > suffix.length && base.slice(-suffix.length) === suffix) {
      // longest match wins, so a townSlug that is a suffix of another cannot win
      if (!hit || suffix.length > hit.suffix.length) hit = { branch: b, suffix: suffix };
    }
  });
  return hit ? hit.branch : null;
}

var h1Pages = [];
PAGE_DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) {
    failures.push("missing page directory " + rel(dir));
    return;
  }
  fs.readdirSync(dir).forEach(function (file) {
    if (!/\.html$/.test(file)) return;
    var body = fs.readFileSync(path.join(dir, file), "utf8");
    var m = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(body);
    if (!m) {
      failures.push(file + " (" + rel(dir) + "): no H1 on the page, so rule 4 cannot read it");
      return;
    }
    var owner = ownerOf(file);
    if (!owner) {
      failures.push(file + " (" + rel(dir) + "): filename resolves to no live branch, so its H1 goes unchecked");
      return;
    }
    h1Pages.push({
      file: file,
      h1: norm(m[1].replace(/<[^>]+>/g, "")),
      branchId: owner.id,
      host: (owner.website || "").replace(/^https?:\/\//, "").replace(/\/$/, "")
    });
  });
});

var byH1 = {};
h1Pages.forEach(function (p) {
  if (!byH1[p.h1]) byH1[p.h1] = [];
  byH1[p.h1].push(p);
});

// Classify PAIRS, not groups. A group is not one verdict: three pages can hold
// a same-host collision and a cross-host overlap at once, and reading the group
// as a unit downgraded the collision to a warning. Found by injection when this
// rule was written, which is why the pairing is explicit.
var h1Shared = {};
Object.keys(byH1).forEach(function (h1) {
  var group = byH1[h1];
  if (group.length < 2) return;
  var sameBranch = [];
  var sameHost = [];
  var crossHost = [];

  for (var i = 0; i < group.length; i++) {
    for (var j = i + 1; j < group.length; j++) {
      var a = group[i], b = group[j];
      var pair = a.file + " and " + b.file;
      if (a.branchId === b.branchId) sameBranch.push(a.branchId + ": " + pair);
      else if (a.host === b.host) sameHost.push(a.host + ": " + pair);
      else { crossHost.push(pair); h1Shared[a.file] = true; h1Shared[b.file] = true; }
    }
  }

  sameBranch.forEach(function (p) {
    failures.push("one branch uses the same H1 on two of its own pages - " + p + "\n         " + h1);
  });
  sameHost.forEach(function (p) {
    failures.push("two branches on one website host share an H1, so they compete on one domain - " +
      p + "\n         " + h1);
  });
  if (crossHost.length) {
    warnings.push("H1 shared across pharmacies on different hosts (Q44) - " +
      crossHost.join("; ") + "\n         " + h1);
  }
});
h1Shared = Object.keys(h1Shared).length;

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
console.log("  " + h1Pages.length + " page H1s read, " + h1Shared + " sharing an H1 with a page at another pharmacy");

known.forEach(function (k) { console.log("  KNOWN " + k); });
warnings.forEach(function (w) { console.log("  WARN " + w); });

if (failures.length) {
  console.log("");
  failures.forEach(function (f) { console.log("  FAIL " + f); });
  console.log("\ncheck-seo-lengths: " + failures.length + " failure(s), " + known.length + " known issue(s) awaiting a decision.");
  process.exit(1);
}
console.log("");
console.log("check-seo-lengths: clean" +
  (known.length ? ", " + known.length + " known issue(s) awaiting a decision." : ", every title and description fits and is unique.") +
  (warnings.length ? " " + warnings.length + " warning(s)." : ""));
process.exit(0);
