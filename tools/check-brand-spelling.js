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
                word, an apostrophe-s form, "and" written as "&", and the
                shop-type word swapped for any other (Chemist, Chemists,
                Pharmacy, Pharmacies). So "Fishlock Chemist", "Fishlock's
                Chemist", "Gordon Shorts Chemist", "Coleman & Leigh
                Pharmacy", "Hirshmans Pharmacy" and "Cherry Lane Chemist"
                are all caught without anyone having thought of them in
                advance.
    3. CONFIG   the brand strings hardcoded in the CONFIG table of
                tools/build-switch-pages.js match branches.json. That table
                is the one place a brand is typed rather than read, and it
                feeds 15 pages.
    4. MISSPELT no known transliteration misspelling of a trading name
                appears in public copy. Rule 2 derives its near misses
                from the canonical form, so it can never see a variant
                whose letters differ: MacCann, Hirschman, Tiffenburg,
                the spaced S K Chemists and Mc Cann, and the doubled
                consonants dropped from Smartts and Riddings. The hand sweep this checker
                replaced (fifty-first run) grepped for exactly those, so
                the checker must hold at least what the sweep held. These
                are listed, not derived, because a wrong transliteration
                is knowledge, not arithmetic. The bare surname fails on
                its own: there is no legitimate use of these strings in
                public copy.
    5. FALLBACK the hardcoded branch record in core/site-data.js spells the
                brand the canonical way. Rule 3 pinned the one table where a
                brand is typed rather than read. There are two, and this is
                the second.
    6. SHORT    the Q14 shortened brand ("Coleman and Leighs" for "Coleman
                and Leighs Pharmacy") appears ONLY on a line declaring the
                page's SEO title, never in visible copy. Rule 2 derives its
                near misses by swapping the shop-type word, never by
                dropping it, so the one variant this repo manufactures on
                purpose is the one variant rule 2 cannot see. Which brands
                shorten, and to what, is read back out of seo-pattern.js
                itself rather than restated here. See the block above rule 6
                for the injection that proved the gap.

  The copy a browser assembles at run time
  ----------------------------------------
  Rules 2 and 4 read files. Until the hundred-and-thirty-fourth run they read
  only files whose whole content is copy: .html, .md and .txt. Every generated
  page also loads modules/<name>/<name>.js and core/site-data.js from
  jsDelivr, and those files write copy into the page with innerHTML at run
  time, so a brand typed into a .js string is read by a patient and by nothing
  in this repo. It was not a latent hole:

    - modules/emar/emar.js types the business name into the visible eMAR
      paragraph about the head office team in Aintree.
    - core/site-data.js carries a whole branch record as its offline
      FALLBACK, brandLabel and branchName included, and that record is what
      renders whenever the branches.json fetch fails or passes 10 seconds.
    - modules/emar/weebly is a hand-pasted Weebly block carrying the brand in
      its root aria-label, and it has no file extension, so it sat outside
      every scan here twice over.

  All three were proved by injection on 2026-08-13: a near-miss brand typed
  into each one passed all 29 checkers. This is the same shape as the item
  5.1 quality pass, where three em dashes lived in service.js strings while
  every dash rule read a file format. modules/ and core/ are now scanned for
  .js and .css with comments blanked, exactly as check-em-dashes.js reads
  them, and modules/emar/weebly is named alongside modules/switch/weebly.html.

  The banners are public copy too
  -------------------------------
  modules/switch/pages/banners holds 15 .txt files pasted into Weebly's
  site-wide Header Code. Each one types the brand by hand in a CONFIG line
  and shows it to every visitor on every page of the branch site. They were
  outside this scan (the dir walk was non-recursive and .txt was excluded),
  so a wrong brand in a banner published estate-wide with the repo green.
  Now scanned.

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
// The shop-type word is the other half of a trading name, and it is the half
// this estate actually gets wrong. Twelve of the sixteen canonical names end
// in Chemist or Chemists and four end in Pharmacy, the two words mean the same
// thing in ordinary speech, and at least one branch's own domain disagrees
// with its own trading name: Hirshmans trades as "Hirshmans Chemist" and
// publishes from hirshmanspharmacy.co.uk. The Ainsdale pack already records
// "Hirshmans Pharmacy" as the branding the old live page carried. So a writer
// reaching for the wrong one of these two words is not a hypothetical.
// Derived like the trailing s rather than listed, so a branch renamed
// tomorrow is covered the day CANONICAL changes.
var SHOPTYPE = ["Chemist", "Chemists", "Pharmacy", "Pharmacies"];
var SHOPTYPE_LC = SHOPTYPE.map(function (s) { return s.toLowerCase(); });

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
  if (SHOPTYPE_LC.indexOf(w.toLowerCase()) !== -1) {
    SHOPTYPE.forEach(function (s) { forms.push(s); forms.push(s + "'s"); });
  }
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
// Rule 4 patterns. Transliteration misspellings rule 2 cannot derive,
// carried over from the hand sweep this checker replaced. The bare surname
// fails on its own; these strings have no legitimate use in public copy.
// Quoted evidence in markdown is masked before this runs, same as rule 2.
// ---------------------------------------------------------------------------
var MISSPELT = [
  { wrong: "MacCann",      right: "McCanns Chemist",     re: /\bMacCann(?:s|'s)?\b/g },
  { wrong: "Hirschman",    right: "Hirshmans Chemist",   re: /\bHirschman(?:s|'s)?\b/g },
  { wrong: "Tiffenburg",   right: "Tiffenbergs Chemist", re: /\bTiffenburg(?:s|'s)?\b/g },
  { wrong: "S K Chemists", right: "SK Chemists",         re: /\bS\s+K\s+Chemists?\b/g },
  // Doubled-consonant drops and a spaced Mc, added by the seventh 1.1 pass
  // (2026-08-29) after "Smarts Chemist" and "Ridings Pharmacy" each passed
  // all 36 checkers by injection. Letters differ from the canonical form, so
  // rule 2 can never derive these; same class as the four above. All three
  // verified to have zero legitimate uses in public copy before listing, and
  // the rules stay case-sensitive, so "smarts" and "riding" in prose are
  // untouched. "Ridings" also catches the street misspelt: the road is
  // Riddings Road, double d.
  { wrong: "Smarts",       right: "Smartts Chemist",     re: /\bSmarts(?:'s)?\b|\bSmart(?:'s)?\s+(?:Chemists?|Pharmac(?:y|ies))\b/g },
  { wrong: "Ridings",      right: "Riddings Pharmacy",   re: /\bRidings(?:'s)?\b/g },
  { wrong: "Mc Cann",      right: "McCanns Chemist",     re: /\bMc\s+Canns?(?:'s)?\b/g }
];

// ---------------------------------------------------------------------------
// The copy in scope. Generated pages and their paste sheets, the paste
// blocks and drafts CLAUDE.md names as public copy that no folder scan
// reaches, and the GBP packs, which are copy bound for Google.
// ---------------------------------------------------------------------------
var SCAN_DIRS = [
  path.join(ROOT, "modules", "service", "pages"),
  path.join(ROOT, "modules", "switch", "pages"),
  path.join(ROOT, "modules", "switch", "pages", "banners"),
  path.join(ROOT, "modules", "branch", "pages"),
  path.join(ROOT, "modules", "service", "weebly-paste"),
  path.join(ROOT, "gbp-packs")
];
// modules/emar/weebly carries no file extension, so no folder scan and no
// extension filter in this checker could ever have reached it. It is a
// hand-pasted Weebly block like modules/switch/weebly.html and is as public
// as any generated page. Named here for the same reason check-em-dashes.js
// names it.
var SCAN_FILES = [
  path.join(ROOT, "modules", "switch", "weebly.html"),
  path.join(ROOT, "modules", "emar", "weebly"),
  path.join(ROOT, "modules", "service", "DRAFT-weight-loss-copy.html"),
  path.join(ROOT, "modules", "service", "DRAFT-travel-clinic-copy.html")
];

// The live module code. Walked rather than listed, so a module added
// tomorrow is covered the day it lands. A folder yielding no code file fails,
// so the rule cannot quietly stop covering anything.
var CODE_DIRS = [path.join(ROOT, "modules"), path.join(ROOT, "core")];
var CODE_EXT = /\.(?:js|css)$/i;

var files = [];
SCAN_DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) {
    failures.push(rel(dir) + " is in the scan list but is not there any more " +
      "- either the copy moved and this list needs updating, or a folder of " +
      "public copy has gone unnoticed");
    return;
  }
  fs.readdirSync(dir).forEach(function (f) {
    // .txt is the banners: hand-typed public copy pasted into Weebly's
    // site-wide Header Code. No other scan dir holds a .txt today, and a
    // future one in these folders would be public copy too.
    if (/\.(html|md|txt)$/i.test(f)) files.push(path.join(dir, f));
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

// The run-time code, collected separately because its comments are blanked
// before the rules read it. Same walk and same extensions as
// check-em-dashes.js, so the two checkers cannot drift over what "live
// module code" means.
var codeFiles = [];
function walkCode(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
    var full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkCode(full, out);
    else if (CODE_EXT.test(entry.name)) out.push(full);
  });
  return out;
}
CODE_DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) {
    failures.push(rel(dir) + " is a live code folder and it is gone, so the " +
      "run-time copy rule covers nothing there");
    return;
  }
  walkCode(dir, []).sort().forEach(function (f) { codeFiles.push(f); });
});
if (!codeFiles.length) {
  failures.push("no .js or .css found under modules/ or core/, so the " +
    "run-time copy rule read nothing. Every generated page loads these files " +
    "from jsDelivr, so an empty read is a finding, not a pass");
}

// Blank quoted spans so a recorded reading of a live page is evidence, not a
// claim. Markdown only: in HTML every attribute is quoted, so the same rule
// there would blank data-branch and the JSON-LD name, which is most of what
// this check is for.
function maskQuotes(text) {
  return text.replace(/"[^"]*"/g, function (m) {
    return m.replace(/[^\r\n]/g, " ");
  });
}

// Blank the contents of code comments, keeping newlines so reported line
// numbers still match the real file. A brand named in a comment is a note to
// the next reader, the same way a quoted span in a pack is a note; only what
// the browser writes into the page is a claim. Same shape as
// check-em-dashes.js blankCodeComments.
function blankCodeComments(text) {
  var noBlocks = text.replace(/\/\*[\s\S]*?\*\//g, function (block) {
    return block.replace(/[^\n]/g, " ");
  });
  return noBlocks.split("\n").map(function (line) {
    return /^\s*\/\//.test(line) ? line.replace(/[^\n]/g, " ") : line;
  }).join("\n");
}

function flat(s) { return s.replace(/\s+/g, " ").trim(); }

function lineOf(text, index) {
  return text.slice(0, index).split(/\r\n|\r|\n/).length;
}

var scanned = 0;
var codeScanned = 0;
var quotedEvidence = 0;

var targets = files.map(function (p) { return { p: p, code: false }; })
  .concat(codeFiles.map(function (p) { return { p: p, code: true }; }));

targets.forEach(function (t) {
  var p = t.p;
  var raw = fs.readFileSync(p, "utf8");
  var isMd = !t.code && /\.md$/i.test(p);
  var text = t.code ? blankCodeComments(raw) : (isMd ? maskQuotes(raw) : raw);
  if (t.code) codeScanned++; else scanned++;

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

  MISSPELT.forEach(function (ms) {
    ms.re.lastIndex = 0;
    var mm;
    while ((mm = ms.re.exec(text)) !== null) {
      fail(rel(p) + "::" + flat(mm[0]),
        rel(p) + ":" + lineOf(text, mm.index) + ': reads "' + flat(mm[0]) +
        '", a known misspelling. The trading name is "' + ms.right + '"');
    }
    if (isMd) {
      ms.re.lastIndex = 0;
      var mq;
      while ((mq = ms.re.exec(raw)) !== null) {
        if (text.slice(mq.index, mq.index + mq[0].length).trim() === "") {
          quotedEvidence++;
          notes.push(rel(p) + ":" + lineOf(raw, mq.index) + ' records "' +
            flat(mq[0]) + '" inside quotation marks, read as a note of what a live ' +
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
// Rule 5: the SECOND table where a brand is typed rather than read.
// core/site-data.js carries a whole branch record as its offline FALLBACK,
// and that record renders whenever the branches.json fetch fails or passes
// its 10 second timeout. Rule 3 reads a generator, which runs here; this one
// runs in the patient's browser, so it is the more exposed of the two.
// ---------------------------------------------------------------------------
var siteData = path.join(ROOT, "core", "site-data.js");

if (!fs.existsSync(siteData)) {
  failures.push("core/site-data.js is gone, so the hardcoded FALLBACK branch " +
    "record this rule exists to guard cannot be read. Every generated page " +
    "loads that file at run time, so its absence is a finding, not a pass");
} else {
  var sd = fs.readFileSync(siteData, "utf8");
  var idRe = /id:\s*"([^"]+)"[\s\S]{0,400}?brandLabel:\s*"([^"]+)"[\s\S]{0,200}?branchName:\s*"([^"]+)"/g;
  var sdFound = 0;
  var m3;
  while ((m3 = idRe.exec(sd)) !== null) {
    var sdId = m3[1], sdBrand = m3[2], sdName = m3[3];
    sdFound++;
    var sdWant = CANONICAL[sdId];
    if (!sdWant) {
      fail(sdId + "::fallback", "core/site-data.js FALLBACK carries a record " +
        'for "' + sdId + '", which is not a trading branch in branches.json');
      continue;
    }
    if (sdBrand !== sdWant) {
      fail(sdId + "::fallback", "core/site-data.js FALLBACK types brandLabel " +
        '"' + sdBrand + '" for ' + sdId + ', but the canonical trading name ' +
        'is "' + sdWant + '". That record is what every live page renders ' +
        "when the branches.json fetch fails or times out");
    }
    if (sdName !== sdBrand && sdName.indexOf(sdBrand + " ") !== 0) {
      fail(sdId + "::fallback", "core/site-data.js FALLBACK types branchName " +
        '"' + sdName + '" for ' + sdId + ', which is neither the brand "' +
        sdBrand + '" nor that brand followed by a qualifier, so the offline ' +
        "record spells the business two ways");
    }
  }
  if (!sdFound) {
    failures.push("core/site-data.js: no FALLBACK branch record matched, so " +
      "this rule read nothing. The record's shape has changed and the " +
      "pattern needs updating rather than passing silently");
  }
  notes.push(sdFound + " hardcoded FALLBACK branch record(s) in " +
    "core/site-data.js checked against the canonical trading names");
}

// ---------------------------------------------------------------------------
// Rule 6: the one brand variant this repo MANUFACTURES on purpose, and the
// one place it is allowed to appear.
// ---------------------------------------------------------------------------
// The Q14 length rule (item 5.6) shortens an over-length page title by
// dropping the trailing shop-type word from the brand, so
// "Coleman and Leighs Pharmacy" becomes "Coleman and Leighs" in the SERP
// title and nowhere else. Item 5.6 states the other half of that bargain
// plainly: the H1, the JSON-LD name, data-branch and every visible line of
// copy keep the full trading name. Only the SERP title loses the word.
//
// Two of those three were already guarded, and one was not. Proved by
// injection on 2026-08-14, on a real page and not in theory:
//
//   - shortened brand into the JSON-LD name  -> check-branch-identity,
//     check-jsonld and check-nap all fail. Guarded.
//   - shortened brand into the hero paragraph, a section heading and the
//     contact block, leaving data-branch and the JSON-LD name correct
//     -> all 36 checkers PASS. Not guarded at all.
//
// The reason is structural rather than an oversight, and it is why rule 2
// can never grow into this. Rule 2 derives near misses by SWAPPING the
// shop-type word (Chemist, Chemists, Pharmacy, Pharmacies). Dropping it is
// exactly what the Q14 rule does, so the one variant this repo publishes
// deliberately is the one variant rule 2 is built not to see. Teaching
// rule 2 the dropped form would fail the Q14 title itself, which is the
// correct output. It needs its own rule with its own permitted place.
//
// So: the shortened form of a trading name may appear ONLY on a line whose
// role is to declare the page's SEO title. Anywhere else in a generated page
// or its paste sheet it is a leak, and it is the kind that reads as a
// different business to a patient while every identity checker stays green.
//
// Derived, not listed, so a rename or a new branch is covered the day
// CANONICAL changes: shortenable brands come from CANONICAL, the street
// addresses and towns from branches.json.
//
// Two masks, both needed and both measured before this rule was written:
//   - STREET ADDRESSES. "Cherry Lane" and "Riddings" are shortened brands
//     and also the streets the shops stand on, so "202 Cherry Lane" and
//     "38 Riddings Road" are legitimate on every page of those two branches.
//   - BRANCH SHORTHAND. This repo names a branch "<short brand> <town>"
//     (riddings-timperley.md, coleman-leigh-walton.md), and that shorthand
//     appears in operational prose such as the banner note in
//     modules/switch/pages/INDEX.md. A leak reads "at Coleman and Leighs",
//     never "Coleman and Leighs Walton", so the mask cannot hide the fault.
//
// Measured before it was written: 0 hits across all 188 generated pages and
// paste sheets, so it fails nothing that was passing. Negative-tested 18
// ways, including the three injected leaks above, a leak on a Riddings page,
// a leak in a paste sheet description, and the real Q14 title in all four
// places it legitimately appears.
var SHORT_SCAN_DIRS = [
  path.join(ROOT, "modules", "service", "pages"),
  path.join(ROOT, "modules", "switch", "pages"),
  path.join(ROOT, "modules", "branch", "pages")
];

// The shapes the six generators write when they declare a page's SEO title.
var TITLE_ROLE = /(?:Weebly page SEO title:|\*\*SEO title:\*\*|\*\*Page Title:\*\*|<title>|\(SEO-first)/i;

// Which brands can be shortened, and to what, is NOT restated here. The
// composer is asked directly: pad a title past the limit so fitTitle must
// retry, then read back what it put in place of the brand. seo-pattern.js
// shortens only a brand ending in " Pharmacy" today, but this rule does not
// need to know that, and cannot drift from it if that ever changes. Same
// convention as reading a generator as data under test.
var pat = require(path.join(ROOT, "tools", "seo-pattern.js"));
var shortForms = [];
if (typeof pat.fitTitle !== "function" || typeof pat.TITLE_WARN_LEN !== "number") {
  failures.push("tools/seo-pattern.js no longer exports fitTitle and " +
    "TITLE_WARN_LEN, so rule 6 cannot ask the composer which brands it " +
    "shortens. That is a finding, not a pass: the Q14 rule would still be " +
    "writing shortened brands into titles with nothing watching where they land");
} else {
  var PAD = new Array(pat.TITLE_WARN_LEN + 2).join("x") + " ";
  Object.keys(CANONICAL).forEach(function (id) {
    var label = CANONICAL[id];
    var got = pat.fitTitle(function (brand) { return PAD + brand; }, label);
    var short = got.slice(PAD.length);
    if (!short || short === label) return;   // this brand cannot be shortened
    if (shortForms.some(function (s) { return s.short === short; })) return;
    shortForms.push({ full: label, short: short });
  });
}

var shortMasks = [];
branches.forEach(function (b) {
  if (b.streetAddress) shortMasks.push(b.streetAddress);
});
var shortTowns = [];
branches.forEach(function (b) {
  if (b.seoTown && shortTowns.indexOf(b.seoTown) === -1) shortTowns.push(b.seoTown);
  if (b.addressLocality && shortTowns.indexOf(b.addressLocality) === -1) shortTowns.push(b.addressLocality);
});
shortForms.forEach(function (sf) {
  shortTowns.forEach(function (t) {
    shortMasks.push(sf.short + " " + t);
    shortMasks.push(sf.short + ", " + t);
  });
});
shortMasks.sort(function (a, b) { return b.length - a.length; });

var shortFiles = [];
SHORT_SCAN_DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) {
    failures.push(rel(dir) + " is in the rule 6 scan list but is not there " +
      "any more, so the Q14 shortened-brand rule covers nothing there");
    return;
  }
  fs.readdirSync(dir).forEach(function (f) {
    if (/\.(html|md)$/i.test(f)) shortFiles.push(path.join(dir, f));
  });
});

if (!shortFiles.length) {
  failures.push("rule 6 read no generated page or paste sheet, so the Q14 " +
    "shortened-brand rule covered nothing. An empty read is a finding, not " +
    "a pass - same convention as the run-time code rule above");
} else if (!shortForms.length) {
  notes.push("no canonical trading name ends in a shop-type word, so the " +
    "Q14 shortening rule can produce no shortened form and rule 6 has " +
    "nothing to guard");
} else {
  var shortTitleLines = 0;
  shortFiles.forEach(function (fp) {
    var lines = fs.readFileSync(fp, "utf8").split(/\r?\n/);
    lines.forEach(function (raw, i) {
      if (TITLE_ROLE.test(raw)) { shortTitleLines++; return; }
      var ln = raw;
      shortMasks.forEach(function (mask) { ln = ln.split(mask).join(" "); });
      shortForms.forEach(function (sf) {
        var re = new RegExp("\\b" + esc(sf.short) +
          "\\b(?!\\s+(?:Pharmacy|Pharmacies|Chemist|Chemists))");
        if (!re.test(ln)) return;
        fail(rel(fp) + "::short::" + sf.short,
          rel(fp) + ":" + (i + 1) + ': reads "' + sf.short + '" without its ' +
          'shop-type word, on a line that is not the page SEO title. That ' +
          'is the shortened form the Q14 length rule writes into the title ' +
          'and nowhere else - the trading name here is "' + sf.full + '". ' +
          "data-branch and the JSON-LD name are guarded by check-nap, " +
          "check-jsonld and check-branch-identity; visible copy is guarded " +
          "only here");
      });
    });
  });
  notes.push(shortFiles.length + " generated page(s) and paste sheet(s) " +
    "checked for the Q14 shortened brand outside a title, " + shortTitleLines +
    " title line(s) allowed it, " + shortForms.length +
    " shortenable trading name(s): " +
    shortForms.map(function (s) { return s.short; }).join(", "));
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
  "spellings and " + MISSPELT.length + " known misspelling(s), banners " +
  "included");
console.log("  " + codeScanned + " live module code file(s) under modules/ " +
  "and core/ scanned for the same, comments blanked - this is the copy a " +
  "browser writes into the page at run time");
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
