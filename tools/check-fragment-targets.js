#!/usr/bin/env node
/*
  tools/check-fragment-targets.js  (added 2026-08-14 on the item 3.7 quality
  pass, fifth machine pass over Smartts Chemist Bootle)

  WHY THIS EXISTS
  ---------------
  The primary call to action on every service page in this estate is a
  same-page fragment link. build-service-pages.js writes

      <a href="#book" class="btn-pill btn-primary"><span>Book an appointment</span></a>

  and the booking card it points at is a separate element carrying id="book",
  written some four hundred lines away in the same generator. The switch
  family does the same thing with #switch-form-card. Contraception, travel
  clinic and weight loss each write their own copy of the pattern.

  Nothing in tools/ resolved either half. check-service-links.js is the
  checker that reads links, and it strips same-page anchors on purpose before
  it starts, because its job is where a link LEAVES the page to. So the anchor
  and the id were written by hand in six generators and compared to each other
  by nothing. Rename the booking card's id in one generator, or typo the href
  as #booking, and the button silently scrolls nowhere on up to 158 live
  pages. Every one of the 35 existing checkers stays green, because the page
  still has its heading, its NAP, its JSON-LD, its pin and its phone number.
  It just cannot be booked from.

  That matters more than an ordinary cosmetic break. These are NHS Pharmacy
  First, contraception, travel and weight loss bookings, so the button is the
  revenue path and the patient's route into a clinical service, and a page
  that looks perfect in every audit is the worst place for it to fail.

  NOTHING WAS BROKEN WHEN THIS WAS WRITTEN. All 186 fragment links on the 177
  generated pages resolved against 1,446 declared ids, a further 172 JS-driven
  href="#" buttons were exempted, and no page declared an id twice. This closes
  a latent hole rather than repairing a live one, which is the honest way to
  describe it. (The first draft of this header said 188, a figure the checker's
  own output contradicts; corrected here rather than left to be quoted onward.)

  RULES
  -----
  1. TARGET   every href="#name" on a generated page must have a matching
              id="name" on that same page. href="#" is not a jump - it is a
              JS-driven button, the WhatsApp control being the estate's one
              use - so it is counted and exempted rather than failed.
  2. CTA      every page in a family that HAS a booking card must carry at
              least one fragment link that resolves. Without this, rule 1
              passes vacuously on a page whose booking card was dropped
              altogether: no fragment links means no broken fragment links.
              CTA_EXEMPT_FAMILIES names the families this does not apply to,
              and the branch landing family is the only one, because it
              signposts out to the service pages and has no card of its own.
  3. DUPID    no id may be declared twice on one page. A browser jumps to the
              first, so a duplicate is both a silent wrong-target risk and a
              reliable sign that a generator emitted a block twice.

  Divergences accepted for now go in KNOWN, keyed "<page filename>::<rule>",
  with a reason and a question id. A KNOWN key that no longer breaks its rule
  FAILS the run, the same contract as check-url-scheme.js and
  check-seo-lengths.js, so the list cannot rot once a fix lands.

  Read-only. Run:  node tools/check-fragment-targets.js  [--verbose]
  Exit 0 = clean, 1 = failures.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var VERBOSE = process.argv.indexOf("--verbose") !== -1;

// Page families, taken from the directory a page is found in rather than from
// its filename, so a renamed page cannot slip into the wrong family. Same
// convention as check-jsonld.js.
var PAGE_DIRS = [
  "modules/service/pages",
  "modules/switch/pages",
  "modules/branch/pages"
];

// Families with no booking card of their own. The branch landing pages
// signpost out to the service pages, so they carry no #book anchor and rule 2
// must not demand one. Listing it here rather than skipping it quietly means
// the exemption is visible and can be argued with.
var CTA_EXEMPT_FAMILIES = { branch: "landing pages signpost out to the service pages and carry no booking card" };

var KNOWN = {};

var failures = [];
var usedKnown = {};

function rel(p) { return path.relative(ROOT, p).replace(/\\/g, "/"); }
function fail(m) { failures.push("  FAIL  " + m); }

function known(file, rule, message) {
  var key = file + "::" + rule;
  if (KNOWN[key]) { usedKnown[key] = true; return; }
  fail(message);
}

// ---------------------------------------------------------------------------
// Discovery. Pages are globbed from the directories above, never read from a
// list, so a page added and forgotten by a list cannot hide from this.
// ---------------------------------------------------------------------------
var pages = [];
PAGE_DIRS.forEach(function (d) {
  var dir = path.join(ROOT, d);
  if (!fs.existsSync(dir)) {
    fail("MISSING  PAGE_DIRS names " + d + ", which is not in the repo. Remove the entry or restore the directory.");
    return;
  }
  fs.readdirSync(dir).forEach(function (name) {
    if (name.endsWith(".html")) pages.push(path.join(dir, name));
  });
});

var fragmentLinks = 0;
var jsButtons = 0;
var idsDeclared = 0;
var byFamily = {};
var targetsSeen = {};

pages.forEach(function (file) {
  var r = rel(file);
  var name = path.basename(file);
  var family = path.basename(path.dirname(path.dirname(file)));
  var html = fs.readFileSync(file, "utf8");

  byFamily[family] = (byFamily[family] || 0) + 1;

  // --- ids on this page, with counts, for rules 1 and 3
  var counts = {};
  var m;
  var idRe = /\sid\s*=\s*"([^"]+)"/g;
  while ((m = idRe.exec(html)) !== null) {
    counts[m[1]] = (counts[m[1]] || 0) + 1;
    idsDeclared++;
  }

  // --- RULE 3: no id twice
  Object.keys(counts).forEach(function (id) {
    if (counts[id] > 1) {
      known(name, "dupid", "DUPID    " + r + ': id="' + id + '" is declared ' + counts[id]
        + ' times. A browser jumps to the first, so the later one is unreachable and this is normally a generator emitting a block twice.');
    }
  });

  // --- RULE 1: every fragment link resolves
  var resolvedHere = 0;
  var hrefRe = /href\s*=\s*"#([^"]*)"/g;
  while ((m = hrefRe.exec(html)) !== null) {
    var frag = m[1];
    if (frag === "") { jsButtons++; continue; }
    fragmentLinks++;
    targetsSeen[frag] = (targetsSeen[frag] || 0) + 1;
    if (counts[frag]) {
      resolvedHere++;
    } else {
      known(name, "target", "TARGET   " + r + ': href="#' + frag + '" but no element on this page declares id="'
        + frag + '". The link scrolls nowhere.');
    }
  }

  // --- RULE 2: a family that has a booking card must actually carry one
  if (!CTA_EXEMPT_FAMILIES[family] && resolvedHere === 0) {
    known(name, "cta", "CTA      " + r + " carries no resolving same-page fragment link at all. "
      + "Every " + family + " page in this estate has a booking card reached by one, so this page has lost its call to action, "
      + "and rule 1 cannot see that because a page with no fragment links has no broken ones.");
  }
});

// A KNOWN key that excused nothing is a rotted exemption.
Object.keys(KNOWN).forEach(function (k) {
  if (!usedKnown[k]) {
    fail("STALE    KNOWN names \"" + k + "\" but nothing broke that rule for that page. Remove the entry.");
  }
});

// A CTA_EXEMPT_FAMILIES entry naming a family that no longer exists is the
// same kind of rot, and would silently stop protecting anything.
Object.keys(CTA_EXEMPT_FAMILIES).forEach(function (f) {
  if (!byFamily[f]) {
    fail("STALE    CTA_EXEMPT_FAMILIES names family \"" + f + "\", which has no pages. Remove the entry.");
  }
});

// Coverage gate. A checker that found no pages must not report "clean".
if (pages.length === 0) {
  fail("COVERAGE no pages were discovered under PAGE_DIRS, so this run proved nothing.");
}
if (fragmentLinks === 0 && pages.length > 0) {
  fail("COVERAGE " + pages.length + " page(s) were read but not one fragment link was found. "
    + "The estate's booking buttons are fragment links, so this means the extractor stopped matching, not that the pages changed.");
}

if (VERBOSE) {
  console.log("pages by family: " + Object.keys(byFamily).sort().map(function (f) {
    return f + " x" + byFamily[f] + (CTA_EXEMPT_FAMILIES[f] ? " (CTA exempt)" : "");
  }).join(", "));
  console.log("fragment targets used: " + Object.keys(targetsSeen).sort().map(function (t) {
    return "#" + t + " x" + targetsSeen[t];
  }).join(", "));
  console.log("");
}

failures.forEach(function (f) { console.log(f); });

console.log("\ncheck-fragment-targets");
console.log("  " + pages.length + " generated page(s) read, " + idsDeclared + " id(s) declared");
console.log("  " + fragmentLinks + " same-page fragment link(s) resolved against them, "
  + jsButtons + " JS-driven href=\"#\" button(s) exempted");
console.log("  " + Object.keys(usedKnown).length + " held under KNOWN");

if (!failures.length) {
  console.log("\ncheck-fragment-targets: clean, every fragment link lands on an element that exists.");
}

process.exit(failures.length ? 1 : 0);
