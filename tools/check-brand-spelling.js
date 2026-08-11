/*
  tools/check-brand-spelling.js - is the pharmacy's name spelled the one way
  item 1.1 settled?

  Why this exists
  ---------------
  Item 1.1 standardised the trading names: Fishlocks not Fishlock, Coleman
  and Leighs not Coleman & Leigh, Gordon Short not Gordon Shorts. It was
  ticked on 2026-08-04 and has been re-verified on every quality pass since
  BY HAND, with a fresh pattern sweep typed out each time. Nothing in the
  repo held the rule, so the rule lived in the person running the sweep.

  Two gaps that leaves, and they are different sizes.

  1. HAND-WRITTEN COPY. Almost every visible brand mention on a generated
     page comes from the same string that lands in data-branch and the
     JSON-LD name, so check-nap and check-branch-identity catch a wrong one
     as a side effect. The copy that is typed rather than composed does not
     get that protection: the GBP packs, the Weebly paste blocks, the two
     DRAFT copy files named in CLAUDE.md, and any prose a generator carries
     inline. A variant spelling typed into one of those is invisible to all
     eighteen other checkers.

  2. THE SOURCE ITSELF, which is the one that matters. Every checker in this
     repo composes what it expects from branches.json. That is right, and it
     means a rename inside branches.json propagates to 177 pages with every
     checker still green, because they all agree with the new spelling. The
     canonical forms are therefore pinned HERE, in CANONICAL below, and a
     brandLabel that no longer matches its pin fails. Renaming a branch is a
     deliberate act: change branches.json, change this list in the same
     commit, and the diff says a name changed instead of hiding it.

  What it checks
  --------------
    1. CANON    every trading branch's brandLabel is exactly its pinned
                canonical form, and branchName is that brandLabel alone or
                that brandLabel plus a qualifier. A branch missing from
                CANONICAL fails, and a CANONICAL id no longer in
                branches.json fails, so the list cannot rot in either
                direction.
    2. VARIANT  no near-miss spelling of any canonical brand appears in
                public copy. Near misses are derived from the canonical form
                rather than listed: a trailing s added or dropped on any
                word, an apostrophe-s form, and "and" written as "&". So
                "Fishlock Chemist", "Fishlock's Chemist", "Gordon Shorts
                Chemist" and "Coleman & Leigh Pharmacy" are all caught
                without anyone having thought of them in advance.
    3. CONFIG   the brand strings hardcoded in the CONFIG table of
                tools/build-switch-pages.js match branches.json. That table
                is the one place a brand is typed rather than read, and it
                feeds 15 pages.

  Quoted text is evidence, not a claim
  ------------------------------------
  Several GBP packs record what a branch's LIVE pages currently say, so the
  paster knows the website and the profile disagree and which one is right.
  Those readings are inside double quotation marks, so a variant found
  inside a quoted span is reported as evidence and not failed. Same
  precedent as the parenthetical and quoted times in check-gbp-packs.js.
  Quotes are matched after whitespace is collapsed, because that guidance
  wraps mid-sentence and these files are CRLF.

  Run:  node tools/check-brand-spelling.js
  Exits 1 on any failure.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

// ---------------------------------------------------------------------------
// CANONICAL - the trading names item 1.1 settled, pinned outside
// branches.json on purpose. Keyed by branch id. Change this list and
// branches.json in the same commit, never one alone.
// ---------------------------------------------------------------------------
var CANONICAL = {
  scorah_bramhall:        "Scorah Chemists",
  scorah_hazel:           "Scorah Chemists",
  mccanns_aigburth:       "McCanns Chemist",
  mccanns_sandringham:    "McCanns Chemist",
  fishlocks_ainsdale:     "Fishlocks Chemist",
  fishlocks_eccleston:    "Fishlocks Chemist",
  rbh_head_office_aintree:"RB Healthcare Ltd",
  clearchemist_aintree:   "Clear Chemist",
  smartts_bootle:         "Smartts Chemist",
  hirshmans_ainsdale:     "Hirshmans Chemist",
  skchemists_bootle:      "SK Chemists",
  colemanleigh_liverpool: "Coleman and Leighs Pharmacy",
  riddings_timperley:     "Riddings Pharmacy",
  gordonshorts_crosby:    "Gordon Short Chemist",
  cherrylane_liverpool:   "Cherry Lane Pharmacy",
  tiffenbergs_longmoor:   "Tiffenbergs Chemist"
};

// ---------------------------------------------------------------------------
// KNOWN - a variant this repo is knowingly publishing while a decision is
// open. Key: "<file>::<variant>". A key that no longer fires fails the run.
// Quoted evidence does NOT belong here; it is handled by the quote rule.
// ---------------------------------------------------------------------------
var KNOWN = {};

var failures = [];
var warnings = [];
var notes = [];
var knownHit = {};

function fail(key, msg) {
  if (KNOWN[key]) { knownHit[key] = true; return; }
  failures.push(msg);
}
function rel(p) { return path.relative(ROOT, p).replace(/\\/g, "/"); }
function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

// ---------------------------------------------------------------------------
// branches.json, and rule 1.
// ---------------------------------------------------------------------------
var data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));
var branches = data.branches.filter(function (b) { return !b.disposed; });

branches.forEach(function (b) {
  var want = CANONICAL[b.id];
  if (!want) {
    fail(b.id + "::canon", b.id + ': brandLabel "' + b.brandLabel + '" has no ' +
      "pinned canonical form in check-brand-spelling.js. A new branch's " +
      "trading name is a decision, so add it to CANONICAL deliberately " +
      "rather than letting branches.json define its own spelling");
    return;
  }
  if (b.brandLabel !== want) {
    fail(b.id + "::canon", b.id + ': brandLabel is "' + b.brandLabel +
      '" but the canonical trading name is "' + want + '". Every checker in ' +
      "this repo composes what it expects from branches.json, so a rename " +
      "here reaches all of that branch's pages with every other check still " +
      "green. If the name really has changed, change CANONICAL in the same " +
      "commit");
  }
  if (b.branchName !== b.brandLabel &&
      b.branchName.indexOf(b.brandLabel + " ") !== 0) {
    fail(b.id + "::canon", b.id + ': branchName "' + b.branchName + '" is ' +
      'neither the brand "' + b.brandLabel + '" nor that brand followed by a ' +
      "qualifier, so the two fields spell the business differently");
  }
});

Object.keys(CANONICAL).forEach(function (id) {
  if (!branches.some(function (b) { return b.id === id; })) {
    failures.push("CANONICAL entry " + id + " is no longer a trading branch " +
      "in branches.json - remove it from check-brand-spelling.js so the list " +
      "cannot rot");
  }
});

// ---------------------------------------------------------------------------
// Rule 2 patterns, derived from the canonical forms rather than listed.
// ---------------------------------------------------------------------------
function wordForms(w) {
  var forms = [w];
  if (/s$/.test(w)) {
    forms.push(w.slice(0, -1));
    forms.push(w.slice(0, -1) + "'s");
  } else {
    forms.push(w + "s");
    forms.push(w + "'s");
  }
  if (w.toLowerCase() === "and") forms.push("&");
  return forms;
}

var brandPatterns = [];
Object.keys(CANONICAL).forEach(function (id) {
  var label = CANONICAL[id];
  if (brandPatterns.some(function (p) { return p.label === label; })) return;
  var body = label.split(/\s+/).map(function (w) {
    return "(?:" + wordForms(w).map(esc).join("|") + ")";
  }).join("\\s+");
  brandPatterns.push({ label: label, re: new RegExp("\\b" + body + "\\b", "g") });
});

// ---------------------------------------------------------------------------
// The copy in scope. Generated pages and their paste sheets, the paste
// blocks and drafts CLAUDE.md names as public copy that no folder scan
// reaches, and the GBP packs, which are copy bound for Google.
// ---------------------------------------------------------------------------
var SCAN_DIRS = [
  path.join(ROOT, "modules", "service", "pages"),
  path.join(ROOT, "modules", "switch", "pages"),
  path.join(ROOT, "modules", "branch", "pages"),
  path.join(ROOT, "modules", "service", "weebly-paste"),
  path.join(ROOT, "gbp-packs")
];
var SCAN_FILES = [
  path.join(ROOT, "modules", "switch", "weebly.html"),
  path.join(ROOT, "modules", "service", "DRAFT-weight-loss-copy.html"),
  path.join(ROOT, "modules", "service", "DRAFT-travel-clinic-copy.html")
];

var files = [];
SCAN_DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) {
    failures.push(rel(dir) + " is in the scan list but is not there any more " +
      "- either the copy moved and this list needs updating, or a folder of " +
      "public copy has gone unnoticed");
    return;
  }
  fs.readdirSync(dir).forEach(function (f) {
    if (/\.(html|md)$/i.test(f)) files.push(path.join(dir, f));
  });
});
SCAN_FILES.forEach(function (f) {
  if (!fs.existsSync(f)) {
    failures.push(rel(f) + " is in the scan list but is not there any more " +
      "- CLAUDE.md names it as public copy, so its disappearance is a " +
      "finding, not a pass");
    return;
  }
  files.push(f);
});

// Blank quoted spans so a recorded reading of a live page is evidence, not a
// claim. Markdown only: in HTML every attribute is quoted, so the same rule
// there would blank data-branch and the JSON-LD name, which is most of what
// this check is for.
function maskQuotes(text) {
  return text.replace(/"[^"]*"/g, function (m) {
    return m.replace(/[^\r\n]/g, " ");
  });
}

function flat(s) { return s.replace(/\s+/g, " ").trim(); }

function lineOf(text, index) {
  return text.slice(0, index).split(/\r\n|\r|\n/).length;
}

var scanned = 0;
var quotedEvidence = 0;

files.forEach(function (p) {
  var raw = fs.readFileSync(p, "utf8");
  var isMd = /\.md$/i.test(p);
  var text = isMd ? maskQuotes(raw) : raw;
  scanned++;

  brandPatterns.forEach(function (bp) {
    bp.re.lastIndex = 0;
    var m;
    while ((m = bp.re.exec(text)) !== null) {
      // A trading name may wrap across a line in markdown and across a tag
      // boundary in HTML, so whitespace is collapsed before the comparison.
      // Only the spelling is under test here; check-em-dashes and the SEO
      // checkers own the punctuation and the layout.
      var got = flat(m[0]);
      if (got === bp.label) continue;               // the correct spelling
      fail(rel(p) + "::" + got,
        rel(p) + ":" + lineOf(text, m.index) + ': reads "' + got +
        '". The trading name is "' + bp.label + '"');
    }
    if (isMd) {
      bp.re.lastIndex = 0;
      var q;
      while ((q = bp.re.exec(raw)) !== null) {
        if (flat(q[0]) === bp.label) continue;
        if (text.slice(q.index, q.index + q[0].length).trim() === "") {
          quotedEvidence++;
          notes.push(rel(p) + ":" + lineOf(raw, q.index) + ' records "' +
            flat(q[0]) + '" inside quotation marks, read as a note of what a live ' +
            'page says rather than as this file claiming it');
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Rule 3: the one table where a brand is typed rather than read.
// ---------------------------------------------------------------------------
var switchGen = path.join(ROOT, "tools", "build-switch-pages.js");
var byId = {};
branches.forEach(function (b) { byId[b.id] = b; });

if (!fs.existsSync(switchGen)) {
  failures.push("tools/build-switch-pages.js is gone, so the hardcoded brand " +
    "table this rule exists to guard cannot be read");
} else {
  var gen = fs.readFileSync(switchGen, "utf8");
  var re = /(\w+):\s*\{\s*brand:\s*"([^"]+)"/g;
  var found = 0;
  var m2;
  while ((m2 = re.exec(gen)) !== null) {
    var id = m2[1], typed = m2[2];
    var b = byId[id];
    found++;
    if (!b) {
      fail(id + "::config", "tools/build-switch-pages.js CONFIG has an entry " +
        'for "' + id + '", which is not a trading branch in branches.json');
      continue;
    }
    if (typed !== b.brandLabel) {
      fail(id + "::config", "tools/build-switch-pages.js CONFIG types brand " +
        '"' + typed + '" for ' + id + ', but branches.json says "' +
        b.brandLabel + '". That string becomes the H1, the body copy, the ' +
        "data-branch and the JSON-LD name on this branch's switch page");
    }
  }
  if (!found) {
    failures.push("tools/build-switch-pages.js: no CONFIG brand entries " +
      "matched, so this rule read nothing. The table's shape has changed and " +
      "the pattern needs updating rather than passing silently");
  }
  notes.push(found + " hardcoded brand string(s) in build-switch-pages.js " +
    "CONFIG checked against branches.json");
}

// ---------------------------------------------------------------------------
// Stale KNOWN keys.
// ---------------------------------------------------------------------------
Object.keys(KNOWN).forEach(function (k) {
  if (!knownHit[k]) {
    failures.push("KNOWN entry " + k + " (" + KNOWN[k].question + ") no " +
      "longer fires - remove it from check-brand-spelling.js so the list " +
      "cannot rot");
  }
});

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
console.log("check-brand-spelling");
console.log("  " + branches.length + " trading branch(es), " +
  brandPatterns.length + " distinct trading name(s) pinned");
console.log("  " + scanned + " file(s) of public copy scanned for near-miss " +
  "spellings");
console.log("");

warnings.forEach(function (w) { console.log("  WARN  " + w); });
notes.forEach(function (n) { console.log("  NOTE  " + n); });
Object.keys(knownHit).forEach(function (k) {
  console.log("  KNOWN " + k + " (" + KNOWN[k].question + "): " + KNOWN[k].reason);
});

if (failures.length) {
  failures.forEach(function (f) { console.log("  FAIL  " + f); });
  console.log("\ncheck-brand-spelling: " + failures.length + " failure(s).");
  process.exit(1);
}
console.log("check-brand-spelling: clean, every trading name is spelled the " +
  "one way" +
  (quotedEvidence ? ", " + quotedEvidence + " quoted reading(s) of a live " +
    "page read as evidence" : "") + ".");
process.exit(0);
