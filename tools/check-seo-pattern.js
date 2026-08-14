/*
  tools/check-seo-pattern.js - Phase 3 verifier (worklist items 3.2 to 3.13).

  Checks every generated page against the canonical title/H1 pattern in
  tools/seo-pattern.js: the head-comment "Weebly page SEO title" line and
  the page <h1> must equal what the pattern functions produce for that
  branch and page type, and both must carry the branch seoTown.

  Also checks the head-comment "Weebly page SEO description" line against
  the meta rule (seo-pattern checkMeta: must carry the seoTown, at least
  one service word for the page type, and be 80 to 165 characters).
  Added 2026-08-05 during the quality pass on the Phase 3 rollout - the
  meta leg of Phase 3 was previously unverified.

  Two things this checker now refuses to do quietly, both added on the item
  3.1 quality pass, 2026-08-11:

  - The seven condition phrases and slugs are READ from build-service-pages.js
    rather than mirrored into a literal here. See readConditions below for why
    the mirror was the more dangerous half of the copy.
  - A file it cannot type is a FAILURE, not a skip. An unchecked page and a
    passing page used to look the same in the summary line.

  Third thing it refuses to do quietly, added on the item 3.2 quality pass,
  2026-08-11: a page must not carry ANOTHER live branch's seoTown in its
  title, H1 or description unless that town is in this branch's own
  serviceAreaList. See CROSS-TOWN below. Until this landed, every rule here
  was a PRESENCE rule - the right town has to be there - and nothing was an
  ABSENCE rule, so a page could name its own town and its sister branch's
  town and pass everything.

  Fourth thing, added on the item 3.2 quality pass, 2026-08-13: the SERVICE
  WORD half of item 3.2 is now asserted on the title and the H1, not on the
  description alone. Item 3.2 reads "put the town and service words into
  every page title, description and heading", and until this landed the
  service words reached checkMeta only. Title and H1 were guarded by the
  exact match against the pattern functions, which is pattern-relative: edit
  a composer to drop its service word, regenerate, and page and expectation
  move together. Proved by injection - brandTitle and brandH1 each made to
  drop the service word for Travel Clinic alone, 15 pages rebuilt without
  it, 30 checkers green both times. The H1 had no content rule of its own at
  all, so its seoTown is now asserted here too.

  Fifth thing, added on the item 3.2 quality pass, 2026-08-14: a page must
  carry EXACTLY ONE h1. Every h1 rule in this repo reads the FIRST h1 and
  stops, so a SECOND heading was invisible to all of them at once. See
  ONE H1 below.

  Run:  node tools/check-seo-pattern.js
  Exits 1 on any mismatch. Reports per brand so the Phase 3 worklist items
  (one brand each) can be verified individually.
*/
"use strict";

var fs = require("fs");
var path = require("path");
var pat = require("./seo-pattern");

var data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "branches.json"), "utf8"));

// slug (brandSlug-townSlug) -> branch
var bySlug = {};
data.branches.forEach(function (b) {
  if (b.disposed || !b.brandSlug || !b.townSlug) return;
  bySlug[b.brandSlug + "-" + b.townSlug] = b;
});

function fail(msg) {
  console.error("check-seo-pattern FAIL: " + msg);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// CROSS-TOWN - the absence rule (item 3.2 quality pass, 2026-08-11)
// ---------------------------------------------------------------------------
// Everything above this line is a PRESENCE rule: the title must carry the
// branch's own seoTown, the description must carry it too. Presence rules
// cannot see the fault Phase 3 exists to prevent, which is a page carrying
// SOMEBODY ELSE'S town. A description reading "Scorah Chemists Bramhall and
// Hazel Grove" satisfies the seoTown rule for both Scorah branches at once,
// and both pages then compete for both towns on one shared domain instead of
// each owning its own catchment. That is the exact failure Build Pack v2
// section 1.4 is written against, and on 2026-08-09 the item 3.2 pass proved
// it absent BY HAND. Nothing preserved that. A hand check that no rule
// replaces is a check that holds until the next regeneration.
//
// Three shared-domain pairs make it live rather than theoretical: Scorah
// (Bramhall / Hazel Grove), Fishlocks (Ainsdale / Eccleston) and McCanns
// (Aigburth / St Michael's). Item 5.7 also proved seoTown is a value that
// MOVES: McCanns Sandringham's went from Sandringham to St Michael's on
// 2026-08-10, which is how a town word ends up on the wrong page in the
// first place.
//
// The excuse is serviceAreaList, and it is the right excuse rather than a
// hole, because that list is the branch's own catchment in the single source
// of truth. Bramhall genuinely serves Hazel Grove and says so in
// branches.json, so its landing description naming Hazel Grove is a fact
// about the branch, not a leak. Five entries carry that excuse today
// (Scorah both ways, McCanns Sandringham -> Aigburth, Clear Chemist ->
// Walton and Bootle). If a branch stops serving a town, the fix is to remove
// it from serviceAreaList and let this rule fail the pages that still say it.
//
// Matching is word-boundary rather than substring so a town cannot be found
// inside a longer word. No two live seoTowns are substrings of each other
// today and no live brandLabel contains another branch's seoTown, both
// checked on the pass, so nothing rests on that - it is here so the rule
// stays honest if a future town name is added that does.
var townOwners = {};   // seoTown -> [branch id]
data.branches.forEach(function (b) {
  if (b.disposed || b.id === "rbh_head_office_aintree" || !b.seoTown) return;
  (townOwners[b.seoTown] = townOwners[b.seoTown] || []).push(b.id);
});
var OTHER_TOWNS = Object.keys(townOwners);
if (!OTHER_TOWNS.length) fail("branches.json yields no live seoTown, so the cross-town rule would check nothing");

function townRe(town) {
  var esc = town.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("(^|[^a-z0-9])" + esc + "([^a-z0-9]|$)", "i");
}
var TOWN_RE = {};
OTHER_TOWNS.forEach(function (t) { TOWN_RE[t] = townRe(t); });

// Returns a list of problem strings for one page's three public strings.
function checkCrossTown(b, fields) {
  var problems = [];
  var areas = (b.serviceAreaList || []).map(function (s) { return String(s).toLowerCase(); });
  Object.keys(fields).forEach(function (fieldName) {
    var value = fields[fieldName] || "";
    OTHER_TOWNS.forEach(function (t) {
      if (t === b.seoTown) return;
      if (!TOWN_RE[t].test(value)) return;
      if (areas.indexOf(t.toLowerCase()) !== -1) return; // in this branch's own catchment
      problems.push(fieldName + " names '" + t + "', the seoTown of " +
        townOwners[t].join(" and ") + ", and '" + t + "' is not in this branch's serviceAreaList");
    });
  });
  return problems;
}

// ---------------------------------------------------------------------------
// Condition slug -> phrases, DERIVED from build-service-pages.js
// ---------------------------------------------------------------------------
// This used to be a literal, copied out of the generator with a comment saying
// it mirrored it. A copy that agrees with its source is indistinguishable from
// a derived value right up to the moment the source changes, and this copy had
// the worse half of that fault. The condition slugs also composed the filename
// regex below, so an eighth condition added to the generator would not have
// failed this checker. Its pages would simply have stopped being TYPED: counted
// as non-pattern files, reported in the skipped total, and the run would still
// have exited 0 while 14 or more real pages went unverified.
//
// Same convention as the seo-pattern self-test, check-whatsapp-route and
// check-booking-routes: the generator is read as DATA UNDER TEST, so a
// generator that stops declaring these fields fails here instead of quietly
// narrowing what this checker covers. Title comes from metaCondition, H1 from
// h1Phrase, which is the same pair the generator itself writes; only earache
// differs between the two today.
function readConditions() {
  var src = fs.readFileSync(path.join(__dirname, "build-service-pages.js"), "utf8");
  var lines = src.split(/\r?\n/);

  var start = -1, end = -1, i;
  for (i = 0; i < lines.length; i++) {
    if (/^const CONDITIONS\s*=\s*\{/.test(lines[i])) { start = i; break; }
  }
  if (start === -1) fail("build-service-pages.js declares no 'const CONDITIONS = {' block, so the condition phrases cannot be derived");
  for (i = start + 1; i < lines.length; i++) {
    if (/^\};/.test(lines[i])) { end = i; break; }
  }
  if (end === -1) fail("the CONDITIONS block in build-service-pages.js has no closing '};' at column 0, so its entries cannot be read");

  var out = {}, count = 0, key = null, body = [];
  function flush() {
    if (key === null) return;
    var text = body.join("\n");
    var wasKey = key;
    key = null;
    // ready:false still lists the condition on the overview but builds no page,
    // so there is nothing for this checker to type.
    if (!/(^|[\s,{])ready:\s*true\b/.test(text)) return;
    var slug = /(^|[\s,{])slug:\s*"([^"]+)"/.exec(text);
    var meta = /(^|[\s,{])metaCondition:\s*"([^"]+)"/.exec(text);
    var h1 = /(^|[\s,{])h1Phrase:\s*"([^"]+)"/.exec(text);
    if (!slug || !meta || !h1) {
      fail("condition '" + wasKey + "' in build-service-pages.js is ready:true but does not declare slug, metaCondition and h1Phrase, so its pages cannot be typed");
    }
    out[slug[2]] = { title: meta[2], h1: h1[2] };
    count++;
  }
  for (i = start + 1; i < end; i++) {
    var m = /^ {2}(?:"([^"]+)"|([A-Za-z0-9_$]+))\s*:\s*\{/.exec(lines[i]);
    if (m) { flush(); key = m[1] || m[2]; body = []; continue; }
    if (key !== null) body.push(lines[i]);
  }
  flush();
  if (!count) fail("no ready:true conditions could be read from build-service-pages.js");
  return out;
}

var CONDITIONS = readConditions();
var CONDITION_SLUGS = Object.keys(CONDITIONS);
var CONDITION_RE = new RegExp("^(" + CONDITION_SLUGS.map(function (s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}).join("|") + ")-treatment-(.+\\.html)$");

// Every .html file in the three page directories below must be a page this
// checker knows how to type. A file it cannot type is not "skipped", it is
// UNCHECKED: nothing verifies its title, its H1 or its description, and the
// run still exits 0. A legitimately non-page file goes in KNOWN_NON_PAGE with
// a reason and a question id, the same convention as KNOWN_DRIFT in
// check-cdn-pins.js, and a key that is no longer there fails the run so the
// list cannot rot. It is empty today: all 177 files are typed.
var KNOWN_NON_PAGE = {
  // "example.html": "why this file carries no pattern (Qnn)"
};

// filename -> { branch, expected title, expected h1 } or null if not a page
// this checker knows how to type.
function expectationsFor(file) {
  var m;
  function branchOf(rest) { return bySlug[rest.replace(/\.html$/, "")] || null; }

  if ((m = /^pharmacy-first-(.+\.html)$/.exec(file))) {
    var b1 = branchOf(m[1]);
    return b1 && { b: b1, title: pat.brandTitle("Pharmacy First", b1), h1: pat.brandH1("Pharmacy First", b1), sw: ["pharmacy first"] };
  }
  if ((m = CONDITION_RE.exec(file))) {
    var c = CONDITIONS[m[1]], b2 = branchOf(m[2]);
    return b2 && { b: b2, title: pat.searchTitle(c.title, b2), h1: pat.searchH1(c.h1, b2), sw: [m[1].replace(/-/g, " "), "treatment"] };
  }
  if ((m = /^contraception-(.+\.html)$/.exec(file))) {
    var b3 = branchOf(m[1]);
    return b3 && { b: b3, title: pat.searchTitle("NHS contraception service", b3), h1: pat.searchH1("NHS contraception service", b3), sw: ["contraception", "contraceptive"] };
  }
  if ((m = /^weight-loss-clinic-(.+\.html)$/.exec(file))) {
    var b4 = branchOf(m[1]);
    return b4 && { b: b4, title: pat.brandTitle("Weight Loss Clinic", b4), h1: pat.brandH1("Weight Loss Clinic", b4), sw: ["weight loss"] };
  }
  if ((m = /^travel-clinic-(.+\.html)$/.exec(file))) {
    var b5 = branchOf(m[1]);
    return b5 && { b: b5, title: pat.brandTitle("Travel Clinic", b5), h1: pat.brandH1("Travel Clinic", b5), sw: ["travel"] };
  }
  if ((m = /^switch-prescriptions-(.+\.html)$/.exec(file))) {
    var b6 = branchOf(m[1]);
    return b6 && { b: b6, title: pat.switchTitle(b6), h1: pat.switchH1(b6), sw: ["prescription"] };
  }
  if ((m = /^pharmacy-(.+\.html)$/.exec(file))) {
    var b7 = branchOf(m[1]);
    return b7 && { b: b7, title: pat.landingTitle(b7), h1: pat.landingH1(b7), sw: ["pharmacy"] };
  }
  return null;
}

var DIRS = [
  path.join(__dirname, "..", "modules", "service", "pages"),
  path.join(__dirname, "..", "modules", "switch", "pages"),
  path.join(__dirname, "..", "modules", "branch", "pages")
];

// ---------------------------------------------------------------------------
// ONE H1 - the count rule (item 3.2 quality pass, 2026-08-14)
// ---------------------------------------------------------------------------
// Item 3.2 is "put the town and service words into every page title,
// description and HEADING". Every heading rule in this repo reads the first
// h1 and stops: the exact match below takes hm[1] off one regex, checkH1()
// is handed that one string, checkCrossTown() is handed the same string, and
// rule 4 of check-seo-lengths.js runs its own single .exec() the same way.
// Not one of them counts. So a page carrying a SECOND h1 satisfied all of
// them at once, because all of them were reading the first one.
//
// That is not a cosmetic gap on this item in particular. The cross-town
// ABSENCE rule above was added on the 2026-08-11 pass on this same item,
// precisely because Scorah Bramhall and Hazel Grove share a domain and a
// page naming its sister town makes the two compete for one catchment. A
// second h1 is the one place that rule could not look. Proved by injection
// on this pass: a second "<h1>Pharmacy in Ainsdale</h1>" was added to
// pharmacy-scorah-bramhall.html, naming a live seoTown that is NOT in
// Bramhall's serviceAreaList, and all 35 checkers and the self-test passed.
// An earlier injection that also carried a foreign BRAND was caught, but
// only by check-nap.js and only on the brand, which is collateral rather
// than cover: strip the brand and nothing fires.
//
// "Exactly one h1 per page" was verified BY HAND on the 2026-08-11 pass and
// re-verified by independent extraction on 2026-08-12 and 2026-08-13. It was
// true all three times and no rule preserved it, which is the same fault
// this file's own CROSS-TOWN note records: a hand check that no rule
// replaces is a check that holds until the next regeneration.
//
// Counting uses <h1[^>]*> so an h1 that gains an attribute still counts.
// The exact match below deliberately keeps its bare <h1> read, so an
// attributed h1 fails loudly there rather than being quietly accepted; the
// two are different questions and neither is widened to suit the other.
var H1_OPEN_RE = /<h1[^>]*>/gi;

var perBrand = {}; // brandLabel -> { pages: n, fails: [] }
var checked = 0, fails = 0, crossTownChecked = 0, swChecked = 0, h1CountChecked = 0;
var untyped = [];  // files this checker could not type: unchecked, not skipped

DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(function (file) {
    if (!/\.html$/.test(file)) return;
    var exp = expectationsFor(file);
    if (!exp) { untyped.push(file); return; }
    var html = fs.readFileSync(path.join(dir, file), "utf8");

    var tm = /Weebly page SEO title:\s*(.+?)\s*$/m.exec(html);
    var hm = /<h1>([\s\S]*?)<\/h1>/.exec(html);
    var gotTitle = tm ? tm[1].trim() : "(no SEO title line)";
    var gotH1 = hm ? hm[1].replace(/\s+/g, " ").trim() : "(no h1)";

    var brand = exp.b.brandLabel;
    perBrand[brand] = perBrand[brand] || { pages: 0, fails: [] };
    perBrand[brand].pages++;
    checked++;

    // ONE H1. Runs before the content rules below, because every one of them
    // reads a single h1 and a page with two makes all of them report on the
    // first while the second goes unread. See the ONE H1 note above.
    var h1Count = (html.match(H1_OPEN_RE) || []).length;
    if (h1Count !== 1) {
      perBrand[brand].fails.push(file + ": " + h1Count + " h1 elements, expected exactly 1. " +
        "Every h1 rule in this repo reads the first h1 only, so the others go unchecked " +
        "by the pattern match, the seoTown and service-word rules and the cross-town rule.");
      fails++;
    } else {
      h1CountChecked++;
    }

    if (gotTitle !== exp.title) { perBrand[brand].fails.push(file + ": title '" + gotTitle + "' != '" + exp.title + "'"); fails++; }
    if (gotH1 !== exp.h1) { perBrand[brand].fails.push(file + ": h1 '" + gotH1 + "' != '" + exp.h1 + "'"); fails++; }
    // exp.sw is now passed to the TITLE leg as well as the meta leg, and the
    // H1 leg is checked at all, both new on the 2026-08-13 item 3.2 pass.
    // Before this, sw reached checkMeta alone: a pattern function that
    // dropped its service word regenerated every page without it and stayed
    // green everywhere. See the note above checkTitle in tools/seo-pattern.js.
    pat.checkTitle(gotTitle, exp.b, exp.sw).forEach(function (p) {
      if (p.indexOf("WARN") !== 0) { perBrand[brand].fails.push(file + ": " + p); fails++; }
    });
    pat.checkH1(gotH1, exp.b, exp.sw).forEach(function (p) {
      perBrand[brand].fails.push(file + ": " + p);
      fails++;
    });
    // A page type typed here but given no service words would pass both new
    // rules vacuously, which is the "empty contract passes as a clean one"
    // fault this file already refuses for PAGE_TYPES. Fail it instead.
    if (!exp.sw || !exp.sw.length) {
      perBrand[brand].fails.push(file + ": expectationsFor() declares no service words, so the title and h1 service rules assert nothing");
      fails++;
    } else {
      swChecked++;
    }

    var dm = /Weebly page SEO description:\s*(.+?)\s*$/m.exec(html);
    var gotDesc = null;
    if (!dm) {
      perBrand[brand].fails.push(file + ": no SEO description line");
      fails++;
    } else {
      gotDesc = dm[1].trim();
      pat.checkMeta(gotDesc, exp.b, exp.sw).forEach(function (p) {
        perBrand[brand].fails.push(file + ": " + p);
        fails++;
      });
    }

    // The absence rule. Runs on what the page ACTUALLY carries, not on what
    // the pattern would produce, because the fault it looks for is drift.
    crossTownChecked++;
    checkCrossTown(exp.b, { title: gotTitle, h1: gotH1, description: gotDesc || "" }).forEach(function (p) {
      perBrand[brand].fails.push(file + ": " + p);
      fails++;
    });
  });
});

Object.keys(perBrand).sort().forEach(function (brand) {
  var r = perBrand[brand];
  console.log((r.fails.length ? "FAIL " : "OK   ") + brand + " - " + r.pages + " pages" + (r.fails.length ? ", " + r.fails.length + " mismatches" : ""));
  r.fails.forEach(function (f) { console.log("       " + f); });
});
// Untyped files, and the KNOWN_NON_PAGE list that excuses them.
var excused = [];
untyped.forEach(function (file) {
  if (Object.prototype.hasOwnProperty.call(KNOWN_NON_PAGE, file)) { excused.push(file); return; }
  console.log("FAIL untyped file - " + file + ": this checker cannot type it, so nothing verifies its");
  console.log("       title, H1 or description. Add the page type to expectationsFor(), or list the");
  console.log("       file in KNOWN_NON_PAGE with a reason and a question id.");
  fails++;
});
Object.keys(KNOWN_NON_PAGE).forEach(function (file) {
  if (excused.indexOf(file) === -1) {
    console.log("FAIL stale KNOWN_NON_PAGE key - " + file + " is no longer an untyped file. Remove it.");
    fails++;
  }
});

// ---------------------------------------------------------------------------
// PAGE_TYPES CONTRACT - does each generator still compose THROUGH the pattern?
// (item 3.1 quality pass, 2026-08-13)
// ---------------------------------------------------------------------------
// Everything above this line reads the OUTPUT: 177 generated pages, compared
// with what the pattern functions produce today. That is the right test for
// items 3.2 to 3.13, and it is blind to the fault item 3.1 exists to prevent.
// tools/seo-pattern.js PAGE_TYPES calls itself "the rollout contract - every
// build script listed here must produce titles/H1s via the named functions,
// nothing hand-composed", and until this rule landed nothing in the repo read
// PAGE_TYPES at all. A generator that drops the require and inlines the same
// composition regenerates every page byte-identical, so no output rule above
// can see it, and the NEXT change to seo-pattern.js then silently fails to
// reach that page family. Proved on this pass: build-travel-clinic-pages.js
// was given a hand-composed copy of brandTitle, all 15 pages rebuilt to a zero
// diff, all 29 checkers and the self-test passed, and the contract was broken
// with nothing anywhere to say so. Reverted.
//
// So the contract is read as DATA UNDER TEST, the same convention as the
// conditions read from build-service-pages.js above: a listed builder that has
// gone FAILS, a named function seo-pattern does not export FAILS, a builder
// that no longer calls its named function FAILS, and a PAGE_TYPES matching
// nothing FAILS rather than passing an empty loop. The reverse direction is
// checked too, because a NEW generator added outside the contract is the same
// hole from the other end: every tools/build-*.js must be named by a
// PAGE_TYPES entry or listed in KNOWN_NON_PAGE_BUILDER with a reason, and a
// stale key there FAILS.
//
// WHAT THIS RULE DOES NOT READ, stated plainly because "ask which files it
// read" is the lesson this repo keeps relearning. The call check is textual
// and file-wide: it asks whether the builder calls the named function ANYWHERE,
// not whether the specific title or H1 leg does. Most builders call the same
// function twice, once for the page and once for its paste sheet, so inlining
// ONE of the two would still find the other and pass here. That residual case
// is not silent, it is merely late: the output rules above recompute every
// expectation from the live pattern functions, so the moment seo-pattern.js
// changes and the pages are regenerated, the half that stopped composing
// stops matching and FAILS. What this rule adds is the OTHER half of the
// problem, which nothing caught at all: the contract itself rotting, and the
// failure naming the generator that stopped composing at the moment it stops
// rather than surfacing later as an unexplained page mismatch.
var KNOWN_NON_PAGE_BUILDER = {
  "build-status-page.js": "generates status/index.html, the internal progress board. Not a public branch page and carries no SEO pattern.",
  "build-audit-status.js": "publishes the audit status page to the data portal. Generates no branch page."
};

var TOOLS_DIR = __dirname;
var contractChecked = 0;
var contractBuilders = {};

if (!pat.PAGE_TYPES || !pat.PAGE_TYPES.length) {
  console.log("FAIL tools/seo-pattern.js exports no PAGE_TYPES entries, so the rollout contract is");
  console.log("       unverifiable. An empty contract must not pass as a clean one.");
  fails++;
}

(pat.PAGE_TYPES || []).forEach(function (t) {
  contractBuilders[t.builder] = true;
  var file = path.join(TOOLS_DIR, t.builder);
  if (!fs.existsSync(file)) {
    console.log("FAIL PAGE_TYPES '" + t.key + "' names " + t.builder + ", which does not exist.");
    console.log("       Update the contract in tools/seo-pattern.js.");
    fails++;
    return;
  }
  var src = fs.readFileSync(file, "utf8");
  var aliasMatch = /(?:var|const|let)\s+(\w+)\s*=\s*require\(\s*["']\.\/seo-pattern["']\s*\)/.exec(src);
  if (!aliasMatch) {
    console.log("FAIL " + t.builder + " (PAGE_TYPES '" + t.key + "') does not require ./seo-pattern,");
    console.log("       so it cannot be composing through the shared pattern.");
    fails++;
    return;
  }
  var alias = aliasMatch[1];
  [["title", t.title], ["h1", t.h1]].forEach(function (pair) {
    var leg = pair[0];
    var fnMatch = /^([A-Za-z_$][\w$]*)\s*\(/.exec(String(pair[1] || "").trim());
    if (!fnMatch) {
      console.log("FAIL PAGE_TYPES '" + t.key + "' " + leg + " is '" + pair[1] + "', which names no");
      console.log("       function. The contract must name the pattern function it promises.");
      fails++;
      return;
    }
    var fn = fnMatch[1];
    if (typeof pat[fn] !== "function") {
      console.log("FAIL PAGE_TYPES '" + t.key + "' " + leg + " names " + fn + "(), which");
      console.log("       tools/seo-pattern.js does not export.");
      fails++;
      return;
    }
    if (src.indexOf(alias + "." + fn + "(") === -1) {
      console.log("FAIL " + t.builder + " (PAGE_TYPES '" + t.key + "' " + leg + ") never calls " +
        alias + "." + fn + "().");
      console.log("       The string is hand-composed, so a change to tools/seo-pattern.js will not");
      console.log("       reach these pages even though they match the pattern today.");
      fails++;
      return;
    }
    contractChecked++;
  });
});

fs.readdirSync(TOOLS_DIR).filter(function (f) { return /^build-.*\.js$/.test(f); }).sort().forEach(function (f) {
  if (contractBuilders[f]) return;
  if (Object.prototype.hasOwnProperty.call(KNOWN_NON_PAGE_BUILDER, f)) return;
  console.log("FAIL " + f + " is a generator named by no PAGE_TYPES entry, so nothing checks that it");
  console.log("       composes through tools/seo-pattern.js. Add it to PAGE_TYPES, or to");
  console.log("       KNOWN_NON_PAGE_BUILDER with a reason.");
  fails++;
});
Object.keys(KNOWN_NON_PAGE_BUILDER).forEach(function (f) {
  if (!fs.existsSync(path.join(TOOLS_DIR, f))) {
    console.log("FAIL stale KNOWN_NON_PAGE_BUILDER key - " + f + " no longer exists. Remove it.");
    fails++;
  } else if (contractBuilders[f]) {
    console.log("FAIL stale KNOWN_NON_PAGE_BUILDER key - " + f + " is now named by a PAGE_TYPES entry.");
    console.log("       Remove it.");
    fails++;
  }
});

// ---------------------------------------------------------------------------
// DATA-SOURCE RULE - does the pattern still read seoTown? (item 3.1 quality
// pass, 2026-08-14)
// ---------------------------------------------------------------------------
// Item 3.1 is "define the title/H1 pattern once, in the generator, WITH
// PER-BRANCH TOWN WORDS SOURCED FROM branches.json", and Build Pack v2 section
// 5.1 says why: "Build every URL, title and H1 from seoTown/townSlug. Using
// addressLocality targets the wrong catchment." Every rule above this line is
// blind to that clause, because every one of them asks the town of
// seo-pattern.js pick() and then checks the page against the answer. That is
// circular. pick() decides the town for all nine composers and for
// checkTitle(), checkH1() and checkMeta() as well, so a pick() that started
// reading addressLocality would move the pages and the expectations together
// and the exact match would still hold.
//
// It is not a theoretical clause. Eight of the fifteen live branches have a
// seoTown that differs from their addressLocality, and the difference is the
// whole point of the field: Cherry Lane and Coleman and Leighs are postally
// Liverpool and trade in Walton, Tiffenbergs is postally Liverpool and trades
// in Aintree, and McCanns Sandringham is postally Liverpool and trades in
// St Michael's. Under addressLocality those eight pages would target Liverpool,
// which is the exact miss Build Pack v2 warns about, and RBH would have two
// pairs of branches competing for one city word instead of four catchments.
//
// Proved by injection on this pass, twice, because the two halves fail
// differently. Injecting the drift into landingTitle/landingH1 alone was
// caught, loudly and by name, by the self-test in tools/seo-pattern.js, since
// checkTitle() still asked the honest pick() for the town. Injecting it into
// pick() ITSELF defeated that: the self-test passed, and the only reason the
// suite went red was collateral, five of the seven page types being built from
// store objects whose town the generator resolves from b.seoTown before the
// pattern ever sees it. Those generators are an accidental anchor, not a rule,
// and the branch landing family has no such anchor at all: it hands the raw
// branch straight to landingTitle(), so under a pick() drift the page and the
// expectation move together and nothing above fires.
//
// So the source is asserted directly, against branches.json rather than
// against the pattern's own answer. The vacuity guard matters as much as the
// rule: if no live branch had a seoTown that differed from its addressLocality
// the comparison would pass whichever field pick() read, so an estate that
// stopped exercising the difference FAILS here rather than quietly reducing
// this to a check of nothing. Same convention as the empty-PAGE_TYPES and
// empty-service-words guards above.
var sourceChecked = 0, sourceDiffering = 0;
data.branches.forEach(function (b) {
  if (b.disposed || b.id === "rbh_head_office_aintree") return;
  if (!b.seoTown || !b.brandLabel) return; // the self-test hard-fails these
  var got = pat.pick(b);
  sourceChecked++;
  if (b.addressLocality && b.addressLocality !== b.seoTown) sourceDiffering++;
  if (got.town !== b.seoTown) {
    console.log("FAIL " + b.id + ": seo-pattern pick() returns town '" + got.town + "' but branches.json");
    console.log("       seoTown is '" + b.seoTown + "'. Titles, H1s and descriptions must be built from");
    console.log("       seoTown (Build Pack v2 section 5.1), not addressLocality '" + (b.addressLocality || "") + "'.");
    fails++;
  }
  if (got.brand !== b.brandLabel) {
    console.log("FAIL " + b.id + ": seo-pattern pick() returns brand '" + got.brand + "' but branches.json");
    console.log("       brandLabel is '" + b.brandLabel + "'. The brand must come from brandLabel.");
    fails++;
  }
});
if (!sourceChecked) {
  console.log("FAIL the data-source rule read no buildable branch, so it asserts nothing about where");
  console.log("       seo-pattern.js takes its town and brand from.");
  fails++;
} else if (!sourceDiffering) {
  console.log("FAIL no live branch has an addressLocality that differs from its seoTown, so the");
  console.log("       data-source rule cannot tell the two fields apart and would pass whichever one");
  console.log("       pick() read. Restore a differing branch or retire this rule deliberately.");
  fails++;
}

console.log("\n" + CONDITION_SLUGS.length + " ready conditions read from build-service-pages.js: " + CONDITION_SLUGS.join(", "));
console.log("PAGE_TYPES contract: " + contractChecked + " title/H1 leg(s) verified across " +
  Object.keys(contractBuilders).length + " generator(s), " +
  Object.keys(KNOWN_NON_PAGE_BUILDER).length + " non-page builder(s) excused.");
console.log("service-word rule: " + swChecked + " pages had title, h1 and meta all read against their page type's service words.");
console.log("one-h1 rule: " + h1CountChecked + " pages carry exactly one h1, so the pattern, seoTown, service-word and cross-town rules read the whole heading of every page.");
console.log("data-source rule: " + sourceChecked + " branches had seo-pattern pick() checked against branches.json seoTown/brandLabel, " +
  sourceDiffering + " of them with an addressLocality that differs from seoTown.");
console.log("cross-town rule: " + crossTownChecked + " pages read against " + OTHER_TOWNS.length +
  " live seoTowns (" + OTHER_TOWNS.join(", ") + "), serviceAreaList excusing the branch's own catchment.");
console.log(checked + " pages checked, " + untyped.length + " untyped (" + excused.length + " excused by KNOWN_NON_PAGE), " + fails + " failures.");
process.exit(fails ? 1 : 0);
