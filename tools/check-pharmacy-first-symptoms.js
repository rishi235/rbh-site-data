/*
  tools/check-pharmacy-first-symptoms.js
  (added 2026-08-14 on the item 3.11 fourth quality pass)

  Why this exists
  ---------------
  Every NHS Pharmacy First condition page carries three blocks of clinical
  copy about the same pathway, and they answer three different questions:

    1. "Do I have this?"        -> CONDITIONS[cond].symptoms
    2. "Is the service for me?" -> CONDITIONS[cond].eligibleYes and ageNote
    3. "What if it is not?"     -> CONDITIONS[cond].eligibleNo

  Block 2 has been guarded since the sixty-third run by
  tools/check-pharmacy-first-eligibility.js. Block 3 has been guarded since
  the hundred-and-fortieth run by tools/check-pharmacy-first-safety-net.js.
  Until this file, nothing read block 1.

  That is the wrong way round if anything. The symptoms list is the FIRST
  clinical thing a patient reads and the block they self-assess against: it
  is what tells them whether the page is about them at all. It is composed
  once in tools/build-service-pages.js and rendered onto 98 live condition
  pages, 7 pathways across 14 branches. A bad edit there does not produce a
  visibly broken page. It produces a page that quietly describes the wrong
  illness, and every one of the 33 existing checkers stays green, because
  they all read the frame around the words rather than the words.

  Same shape of gap the sixty-third, sixty-eighth, sixty-ninth and
  hundred-and-fortieth runs found in eligibility, contraception, travel
  clinic and safety-net copy. This is the last unguarded block of the
  Pharmacy First triad, and the triad is now closed.

  Nothing in the copy is wrong today. Twelve quality passes have read it by
  hand. This makes it a rule instead of a habit.

  What FAILS the run
  ------------------
    RULE 1, presence: a ready condition with no symptoms array, or with
      fewer than 3 points, or with a blank point. A short list is what a
      half-applied template edit looks like.

    RULE 2, no duplicates: the same symptom twice in one condition. A
      duplicated line is a copy-paste slip, and it also masks a point that
      was meant to be replaced.

    RULE 3, block on the page: every condition page must carry the composed
      heading "<longName> symptoms" and the shared lead "Common signs
      include:". The lead matters on its own: it frames the list as signs to
      recognise rather than a diagnosis the page is making.

    RULE 4, verbatim on the page: every one of a condition's own symptom
      points must appear as an item OF THE SYMPTOMS LIST, word for word.
      This is what catches a stale page or a hand-edit, the same way rule 6
      of the safety-net checker does for the other block.

    RULE 5, list integrity: the symptoms list on the page must hold exactly
      as many items as the generator declares. Rule 4 catches a point that
      went missing; this catches one that was ADDED by hand, which rule 4
      cannot see.

    RULE 6, no cross-condition contamination: no condition page's symptoms
      list may carry another pathway's symptom point, and no page may carry
      another pathway's symptoms heading. Impetigo copy on the shingles page
      is the failure this catches, and it is the likeliest one, because the
      two describe rashes in similar words.

    RULE 7, descriptive not directive: a symptom point may not name an
      onward NHS route (GP, NHS 111, 999, A&E) or a walk-in or urgent care
      route. A symptoms list describes what the patient has. Escalation
      belongs in the "When to get different help" block, where the
      safety-net checker reads it and enforces "call 999" wording, an
      onward route and the age boundaries. A red flag that drifts into the
      symptoms list looks like a routine sign, loses its instruction, and
      is invisible to the checker written to guard exactly that copy.

    RULE 8, no medicine named: a symptom point may not name a medicine from
      tools/pom-names.js. A symptom is what the patient arrives with, not
      what they will be given, and naming a prescription-only medicine in
      patient-facing copy is the class of claim this repo guards hardest.

    - a run in which no condition page is read, or no ready condition is
      read, so the rules above would be covering nothing.

    - a ready condition in the generator that is not pinned in PATHWAYS
      below. A new pathway cannot be shipped without its symptoms list
      being considered, the same guard the eligibility and safety-net
      checkers use.

  What this file reads, and why it matters
  ----------------------------------------
  Rules 3 to 6 read the SYMPTOMS BLOCK ONLY, and compare whole values, never
  substrings. The first draft of this file read whole-page text with
  substring matching, and rule 6 fired on 28 clean pages: "A high
  temperature" is a genuine sore throat and earache symptom, it is also a
  substring of the sinusitis symptom "A high temperature or feeling generally
  unwell", and it appears again inside the UTI safety net's kidney-infection
  line. The eligibility, safety-net and FAQ blocks legitimately reuse this
  vocabulary, so a symptoms rule that reads them cannot be right. The rule
  this repo keeps relearning: when a checker fires, or passes, ask WHICH TEXT
  IT READ. check-seo-lengths rule 3 read the sheets and the H1 was not on
  one. check-nap read two phone shapes and the FAQ used a third.
  check-cdn-pins was built to see past the repo and still only read inside
  it. This one read the right page and the wrong part of it.

  Exceptions go in KNOWN with a reason and a question id, the same
  convention as check-branch-links.js and check-pharmacy-first-safety-net.js.
  A KNOWN key that no longer fires FAILS the run, so the list cannot rot.
*/

"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var GENERATOR = path.join(ROOT, "tools", "build-service-pages.js");
var PAGE_DIR = path.join(ROOT, "modules", "service", "pages");
var POM_FILE = path.join(ROOT, "tools", "pom-names.js");

function rel(p) { return path.relative(ROOT, p).replace(/\\/g, "/"); }
function norm(s) { return String(s).replace(/\s+/g, " ").trim(); }

// The seven pinned Pharmacy First pathways. Presence here is the guard that
// a new ready condition cannot be added without its symptoms being read.
var PATHWAYS = [
  "uti", "sore-throat", "sinusitis", "earache",
  "impetigo", "shingles", "insect-bite"
];

// Known, accepted exceptions. key -> { why, q }.
var KNOWN = {};
var knownUsed = {};

var LEAD = "Common signs include:";

// Rule 7. An onward route or an instruction to go somewhere.
var DIRECTIVE = /\bGP\b|NHS ?111|\b111\b|\b999\b|A&E|accident and emergency|walk-?in centre|urgent (?:care|treatment) centre|call (?:us|your)|see (?:a|your) (?:doctor|nurse|pharmacist)/i;

var failures = [];
var warnings = [];

// ---------------------------------------------------------------------------
// Read the CONDITIONS table out of the generator. Same extraction shape as
// check-pharmacy-first-safety-net.js so the two stay comparable.
// ---------------------------------------------------------------------------
if (!fs.existsSync(GENERATOR)) {
  console.log("check-pharmacy-first-symptoms");
  console.log("  FAIL generator not found: " + rel(GENERATOR));
  process.exit(1);
}
var src = fs.readFileSync(GENERATOR, "utf8");
var tableAt = src.indexOf("const CONDITIONS = {");
if (tableAt === -1) {
  console.log("check-pharmacy-first-symptoms");
  console.log("  FAIL could not find the CONDITIONS table in " + rel(GENERATOR));
  process.exit(1);
}
var table = src.slice(tableAt);

var marks = [];
var keyRe = /^ {2}"?([a-z-]+)"?:\s*\{/gm;
var m;
while ((m = keyRe.exec(table)) !== null) marks.push({ key: m[1], at: m.index });

var conditions = {};
marks.forEach(function (mark, i) {
  var end = i + 1 < marks.length ? marks[i + 1].at : table.length;
  var block = table.slice(mark.at, end);
  var ready = /ready:\s*true/.test(block);
  var longName = (block.match(/longName:\s*"((?:[^"\\]|\\.)*)"/) || [])[1] || null;

  var points = [];
  var hasArray = false;
  var symRaw = block.match(/symptoms:\s*\[([\s\S]*?)\]/);
  if (symRaw) {
    hasArray = true;
    var pr = /"((?:[^"\\]|\\.)*)"/g;
    var pm;
    while ((pm = pr.exec(symRaw[1])) !== null) points.push(pm[1]);
  }
  conditions[mark.key] = {
    key: mark.key, ready: ready, longName: longName,
    hasArray: hasArray, points: points
  };
});

// Pin integrity, both directions.
PATHWAYS.forEach(function (k) {
  if (!conditions[k]) {
    failures.push("PATHWAYS pins " + k + " but the generator has no such condition");
  }
});
Object.keys(conditions).forEach(function (k) {
  if (!conditions[k].ready) return;
  if (PATHWAYS.indexOf(k) === -1) {
    failures.push("generator has ready condition " + k + " that is not pinned in " +
      "PATHWAYS, so its symptoms list has never been read - add it or mark " +
      "the condition not ready");
  }
});

// ---------------------------------------------------------------------------
// The prescription-only medicine list, read from the file that already owns
// it rather than mirrored into a literal here.
// ---------------------------------------------------------------------------
var POM = [];
try {
  var pom = require(POM_FILE);
  if (Array.isArray(pom)) POM = pom;
  else if (pom && Array.isArray(pom.names)) POM = pom.names;
  else if (pom && Array.isArray(pom.POM_NAMES)) POM = pom.POM_NAMES;
  else if (pom && typeof pom === "object") {
    Object.keys(pom).forEach(function (k) {
      if (Array.isArray(pom[k])) POM = POM.concat(pom[k]);
    });
  }
} catch (e) {
  failures.push("could not read the medicine list from " + rel(POM_FILE) +
    ", so rule 8 would cover nothing: " + e.message);
}
POM = POM.filter(function (n) { return typeof n === "string" && n.length > 3; });

// ---------------------------------------------------------------------------
// Rules 1, 2, 7 and 8, on the generator.
// ---------------------------------------------------------------------------
var checked = 0;
PATHWAYS.forEach(function (k) {
  var c = conditions[k];
  if (!c || !c.ready) return;
  checked++;

  if (!c.hasArray) {
    failures.push(k + ": no symptoms array in the generator, so the page tells " +
      "a patient nothing about whether the pathway is even about them (rule 1)");
    return;
  }
  if (!c.longName) {
    failures.push(k + ": no longName in the generator, so the symptoms heading " +
      "cannot be composed (rule 1)");
  }
  if (c.points.length < 3) {
    failures.push(k + ": symptoms has " + c.points.length +
      " point(s), expected at least 3 (rule 1)");
  }
  c.points.forEach(function (p) {
    if (!norm(p)) failures.push(k + ": a symptom point is blank (rule 1)");
  });

  // RULE 2, duplicates.
  var seen = {};
  c.points.forEach(function (p) {
    var key = norm(p).toLowerCase();
    if (seen[key]) failures.push(k + ': symptom point appears twice (rule 2)\n         ' + norm(p));
    seen[key] = true;
  });

  // RULE 7, descriptive not directive.
  c.points.forEach(function (p) {
    var hit = p.match(DIRECTIVE);
    if (!hit) return;
    var kn = KNOWN[k + ":directive"];
    if (kn) {
      knownUsed[k + ":directive"] = true;
      warnings.push(k + ": symptom point names an onward route. " + kn.why + " (" + kn.q + ")");
      return;
    }
    failures.push(k + ': a symptom point names an onward route ("' + hit[0] +
      '"), so escalation advice is sitting in the descriptive block where the ' +
      'safety-net checker cannot see it and the reader is given no instruction ' +
      '(rule 7)\n         ' + norm(p));
  });

  // RULE 8, no medicine named.
  c.points.forEach(function (p) {
    POM.forEach(function (drug) {
      var re = new RegExp("\\b" + drug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
      if (re.test(p)) {
        failures.push(k + ': a symptom point names the medicine "' + drug +
          '" (rule 8)\n         ' + norm(p));
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Rules 3 to 6, on the generated pages.
// ---------------------------------------------------------------------------
// Comments are stripped in full, not just the leading build comment: every
// generated page opens with a paste comment that restates the page title, and
// a checker that locates a block by heading must not be able to find one
// inside a comment no visitor reads.
function stripped(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
}
// esc() encodes &, < and > before the copy reaches the page. Decode the three
// entities it produces so the rules test the words the patient reads rather
// than the encoding they arrive in. Learned the hard way by rule 6 of
// check-pharmacy-first-safety-net.js, where "A&amp;E" made 14 clean pages
// look like they had lost their 999 line.
function decode(s) {
  return String(s)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

// Pull the symptoms block: the h2 ending " symptoms" and the list items that
// follow it before the next h2. Returns null when the block is absent.
// Everything rules 3 to 6 assert is read from HERE and nowhere else on the
// page, which is the whole point: the eligibility, safety-net and FAQ blocks
// legitimately reuse this vocabulary.
function symptomsBlock(rawHtml) {
  var html = stripped(rawHtml);
  var h2 = /<h2[^>]*>([^<]*?\ssymptoms)<\/h2>/i.exec(html);
  if (!h2) return null;
  var rest = html.slice(h2.index + h2[0].length);
  var stop = rest.search(/<h2\b/i);
  if (stop !== -1) rest = rest.slice(0, stop);
  var items = [];
  var li = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  var lm;
  while ((lm = li.exec(rest)) !== null) items.push(norm(decode(lm[1].replace(/<[^>]+>/g, " "))));
  return { heading: norm(decode(h2[1])), lead: /Common signs include:/i.test(rest), items: items };
}

var pages = [];
if (fs.existsSync(PAGE_DIR)) {
  fs.readdirSync(PAGE_DIR).forEach(function (f) {
    if (!/\.html$/.test(f)) return;
    PATHWAYS.forEach(function (k) {
      if (f.indexOf(k + "-treatment-") === 0) pages.push({ file: path.join(PAGE_DIR, f), cond: k });
    });
  });
}

// Rule 6's fingerprint tables. A point maps to the full set of conditions
// that legitimately carry it, not a single owner: recording one owner is the
// bug that made rule 7 of the safety-net checker silently useless for the
// shared lines most likely to be miscopied.
var owners = {};
var headingOwners = {};
PATHWAYS.forEach(function (k) {
  var c = conditions[k];
  if (!c) return;
  c.points.forEach(function (p) {
    var key = norm(p);
    if (!owners[key]) owners[key] = [];
    if (owners[key].indexOf(k) === -1) owners[key].push(k);
  });
  if (c.longName) {
    var hk = norm(c.longName + " symptoms");
    if (!headingOwners[hk]) headingOwners[hk] = [];
    if (headingOwners[hk].indexOf(k) === -1) headingOwners[hk].push(k);
  }
});

pages.forEach(function (p) {
  var name = path.basename(p.file);
  var c = conditions[p.cond];
  if (!c) return;
  var html = fs.readFileSync(p.file, "utf8");
  var block = symptomsBlock(html);

  // RULE 3, the block is on the page.
  if (!block) {
    failures.push(name + ": no symptoms block on the page at all (rule 3)");
    return;
  }
  var wantHeading = c.longName ? norm(c.longName + " symptoms") : null;
  if (wantHeading && block.heading !== wantHeading) {
    failures.push(name + ': symptoms heading is "' + block.heading + '", expected "' +
      wantHeading + '" (rule 3)');
  }
  if (!block.lead) {
    failures.push(name + ': the shared lead "' + LEAD + '" is missing from the ' +
      "symptoms block, so the list reads as a diagnosis rather than signs to " +
      "recognise (rule 3)");
  }

  // RULE 4, verbatim. Matched against the ITEMS OF THE SYMPTOMS BLOCK, not
  // against the whole page. Reading the whole page is what made the first
  // draft of rule 6 fire on 28 clean pages: "A high temperature" is a real
  // sore throat and earache symptom AND a substring of the sinusitis symptom
  // "A high temperature or feeling generally unwell" and of the UTI safety
  // net. Whole-page substring matching cannot tell those apart. Block-scoped
  // exact matching can, and it is also the stricter rule.
  c.points.forEach(function (pt) {
    if (block.items.indexOf(norm(pt)) === -1) {
      failures.push(name + ": a symptom point is missing from the symptoms list (rule 4)\n" +
        "         expected: " + norm(pt) + "\n" +
        "         page has: " + block.items.join(" | "));
    }
  });

  // RULE 5, list integrity.
  if (block.items.length !== c.points.length) {
    failures.push(name + ": the symptoms list holds " + block.items.length +
      " item(s) and the generator declares " + c.points.length +
      ", so the page has been edited by hand (rule 5)\n         page: " +
      block.items.join(" | "));
  }

  // RULE 6, contamination, points then heading. Both are block-scoped and
  // both compare whole values rather than substrings, for the reason
  // recorded above rule 4.
  block.items.forEach(function (item) {
    var own = owners[item];
    if (!own || own.indexOf(p.cond) !== -1) return;
    failures.push(name + ": the symptoms list carries a symptom that belongs to the " +
      own.join("/") + " pathway, not this one (rule 6)\n         " + item);
  });
  var hOwn = headingOwners[block.heading];
  if (hOwn && hOwn.indexOf(p.cond) === -1) {
    failures.push(name + ": carries the " + hOwn.join("/") +
      " symptoms heading, not its own (rule 6)\n         " + block.heading);
  }
});

// Coverage guards.
if (!pages.length) {
  failures.push("no Pharmacy First condition pages were read from " + rel(PAGE_DIR) +
    ", so the page rules covered nothing");
}
if (!checked) {
  failures.push("no ready conditions were read from " + rel(GENERATOR) +
    ", so the generator rules covered nothing");
}
if (!POM.length) {
  failures.push("the medicine list read from " + rel(POM_FILE) +
    " is empty, so rule 8 covered nothing");
}

// A KNOWN key that never fired is stale.
Object.keys(KNOWN).forEach(function (k) {
  if (!knownUsed[k]) {
    failures.push("KNOWN entry " + k + " (" + KNOWN[k].q + ") did not apply to " +
      "anything this run, so the exception is stale - remove it.");
  }
});

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
console.log("check-pharmacy-first-symptoms");
console.log("  " + checked + " ready pathways read from " + rel(GENERATOR));
console.log("  " + pages.length + " condition pages checked against their own symptoms list");
console.log("  " + POM.length + " medicine names read from " + rel(POM_FILE) + " for rule 8");

warnings.forEach(function (w) { console.log("  WARN " + w); });

if (failures.length) {
  console.log("");
  failures.forEach(function (f) { console.log("  FAIL " + f); });
  console.log("\ncheck-pharmacy-first-symptoms: " + failures.length + " failure(s).");
  process.exit(1);
}
console.log("");
console.log("check-pharmacy-first-symptoms: clean, every condition page describes " +
  "its own pathway, no other pathway's, and no escalation advice or medicine " +
  "is hiding in the descriptive block.");
process.exit(0);
