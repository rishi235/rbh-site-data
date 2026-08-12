/*
  tools/check-pharmacy-first-eligibility.js - NHS Pharmacy First cohort verifier.

  Why this exists
  ---------------
  Every Pharmacy First condition page tells the reader who the NHS service
  is for, and it says it TWICE:

    - the hero pill, from CONDITIONS[cond].ageNote in
      tools/build-service-pages.js            eg "Age 18 and over"
    - the eligibility list, from
      CONDITIONS[cond].eligibleYes.points[0]  eg "Adults aged 18 and over"

  Two independently authored strings carrying one clinical fact, composed
  in one file, rendered onto 98 live pages. That is the exact shape of
  defect this repo has already been bitten by twice: the switch pages on
  2026-08-09 and the branch landing pages on the sixteenth run both had a
  generator composing one string twice, and the two drifted. Both were
  caught by eye, then made permanent by tools/check-seo-sheets.js.

  Nothing did the same for the eligibility wording, and that wording is a
  higher-stakes claim than any SEO string in this repo. It tells a patient
  whether an NHS service covers them. Get it wrong and an adult reads that
  the pharmacy treats their earache when the pathway stops at 17, or a
  woman of 65 books a UTI consultation she is not eligible for. The
  scheduled task rules single this class out: Pharmacy First wording
  sticks to the NHS service description, and a wrong call on a live
  patient-facing regulatory claim is worse than a delay.

  Nine quality passes have now read this copy by hand, one brand at a
  time, and confirmed it correct. This makes it a rule instead of a habit.

  What it enforces
  ----------------
  On tools/build-service-pages.js, the source of the copy:

    1. Every ready condition has both an ageNote and an eligibleYes list.
    2. The age numbers in ageNote and eligibleYes[0] agree with each other.
    3. Both agree with NHS, the pinned criteria below.
    4. The cohort word is right where NHS restricts by more than age:
       UTI is women only, earache is children and young people, shingles
       is adults.

  On the generated pages, because a generator can be right and a page
  still stale or hand-edited:

    5. Every condition page carries its eligibility heading and its
       eligibleYes[0] cohort line verbatim.
    6. Every condition page carries its ageNote verbatim.
    7. No condition page states an age number for that condition other
       than the ones NHS allows. This is what catches a drifted edit that
       still looks plausible, eg "aged 16 and over" on the shingles page.

       One number sits just outside the cohort and is still correct: the
       earache page says "Adults aged 18 and over are not covered by this
       pathway", where the cohort is 1 to 17. That is the boundary of the
       range restated as an exclusion, so the rule allows a number that is
       one either side of the cohort ONLY when it appears in a sentence
       that redirects the reader elsewhere. It is derived from the pinned
       range rather than whitelisted, so it cannot be used to smuggle a
       wrong number past the check: "aged 25 and over are not covered"
       still fails, and so does a bare "aged 18 and over" with no redirect.

    8. Every condition page carries the safety redirect that names the
       excluded cohort, where NHS defines one.

    9. On the GBP packs in gbp-packs/, no age is stated that is not a pinned
       NHS cohort, and no pinned cohort is attached to the wrong service.
       Rules 1 to 8 guard the generator and the 98 generated pages, and
       stopped at the repo boundary: nothing read the packs. That mattered
       because a pack is public-facing clinical copy in its own right. Post A
       states the UTI cohort and the business description states the blood
       pressure cohort, and those two sentences are pasted into a Google
       Business Profile, which for most patients is the first and only page
       about the pharmacy they ever read. Proved by injection on 2026-08-12
       against gbp-packs/mccanns-sandringham.md: "women aged 16 to 64"
       changed to "16 to 65" and "adults aged 40 and over" changed to "30
       and over" walked past all 29 checkers clean. Both are wrong NHS
       eligibility published to the public, and 16 to 65 also invites a
       woman the pathway excludes to attend for a consultation she cannot
       have. Matching is by whole cohort PHRASE and not by number, so a
       right number on the wrong service ("blood pressure checks for adults
       aged 16 to 64") fails too, and the check is sentence-bounded so a
       cohort named in a neighbouring sentence cannot excuse it.

  The blood pressure cohort is pinned here because rule 9 needs it and it
  was pinned nowhere else in the repo: it existed only as prose, in
  tools/build-branch-landing-pages.js and in ten of the packs.

  The pinned criteria, from the NHS Pharmacy First service specification
  (seven clinical pathways). Changing a number here is a clinical change,
  not a copy change, and should be made only against the current NHS
  service description:

    UTI              women aged 16 to 64
    sore throat      aged 5 and over
    sinusitis        aged 12 and over
    earache          children and young people aged 1 to 17
    impetigo         aged 1 and over
    shingles         adults aged 18 and over
    infected bite    aged 1 and over

  Run:  node tools/check-pharmacy-first-eligibility.js
  Exits 1 on any failure.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var GENERATOR = path.join(ROOT, "tools", "build-service-pages.js");
var PAGE_DIR = path.join(ROOT, "modules", "service", "pages");
var PACK_DIR = path.join(ROOT, "gbp-packs");

// ---------------------------------------------------------------------------
// The pinned NHS criteria. ages is the exact set of age numbers the copy for
// that condition is allowed to use. cohort is the word NHS restricts by where
// it restricts by more than age. excluded is the redirect that must be on the
// page so a reader outside the cohort is sent somewhere.
// ---------------------------------------------------------------------------
var NHS = {
  "uti":         { ages: [16, 64], cohort: "women",    excluded: /Men with UTI symptoms should speak to a GP/i },
  "sore-throat": { ages: [5],      cohort: null,       excluded: null },
  "sinusitis":   { ages: [12],     cohort: null,       excluded: null },
  "earache":     { ages: [1, 17],  cohort: "children", excluded: /Babies under 1 should see a GP/i },
  "impetigo":    { ages: [1],      cohort: null,       excluded: null },
  "shingles":    { ages: [18],     cohort: "adults",   excluded: /Children and young people under 18 should see a GP/i },
  "insect-bite": { ages: [1],      cohort: null,       excluded: null }
};

// ---------------------------------------------------------------------------
// Rule 9's table: the cohort phrases a GBP pack is allowed to state, and the
// service each one belongs to. A pack is not condition-scoped the way a
// condition page is - it names all seven pathways in a single sentence - so
// the pack rule matches whole PHRASES rather than bare numbers, and requires
// the sentence to name the service the cohort belongs to. That is what stops
// a right number landing on the wrong service. Add an entry here only when
// NHS defines a cohort for a service the packs actually advertise.
// ---------------------------------------------------------------------------
var PACK_COHORTS = [
  {
    re: /\baged\s+16\s+to\s+64\b/i,
    context: /\bwomen\b/i,
    what: "the group NHS restricts the UTI pathway to (women)",
    nhs: "women aged 16 to 64"
  },
  {
    // "and over" and "or over" are both live in the packs and both correct.
    re: /\baged\s+40\s+(?:and|or)\s+over\b/i,
    context: /\bblood\s+pressure\b/i,
    what: "the NHS blood pressure check service",
    nhs: "adults aged 40 and over"
  }
];

// Not every "under 30" is an age. The switch posts promise a transfer takes
// "under 30 seconds", and the photo section counts shots. A number carrying a
// unit is a quantity, so it is not read as an age. Ages in these packs are
// always written "aged N", which this never suppresses.
var UNIT_AFTER = /^\s*(?:second|minute|hour|day|week|month|year|character|word|photo|shot|mile|metre|meter|item|patient|prescription)s?\b/i;

// A page for condition X may legitimately mention other numbers (3 days for
// shingles, 999, 111). Only numbers written as an AGE are checked, and only
// against that condition's allowed set.
var AGE_IN_TEXT = /(?:aged|age)\s+(\d{1,2})|\bunder\s+(\d{1,2})\b|\bover\s+(\d{1,2})\b/gi;

// Wording that sends the reader somewhere other than this service. A boundary
// age is only tolerated inside one of these (see rule 7).
var REDIRECTS = /not covered by this pathway|should see a GP|should speak to a GP|guide you to the right care|contact your GP|call NHS 111|call 999/i;

function rel(p) { return path.relative(ROOT, p).replace(/\\/g, "/"); }
function norm(s) { return (s || "").replace(/\s+/g, " ").trim(); }
function nums(s) { return (String(s).match(/\d{1,2}/g) || []).map(Number); }
function sameNums(a, b) { return a.length === b.length && a.every(function (n, i) { return n === b[i]; }); }

var failures = [];
var warnings = [];

// ---------------------------------------------------------------------------
// Read the CONDITIONS table out of the generator.
// ---------------------------------------------------------------------------
if (!fs.existsSync(GENERATOR)) {
  console.log("check-pharmacy-first-eligibility");
  console.log("  FAIL generator not found: " + rel(GENERATOR));
  process.exit(1);
}
var src = fs.readFileSync(GENERATOR, "utf8");
var tableAt = src.indexOf("const CONDITIONS = {");
if (tableAt === -1) {
  console.log("check-pharmacy-first-eligibility");
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
  var ageNote = (block.match(/ageNote:\s*"([^"]*)"/) || [])[1];
  var yesTitle = (block.match(/eligibleYes:\s*\{[\s\S]*?title:\s*"([^"]*)"/) || [])[1];
  var yesFirst = (block.match(/eligibleYes:\s*\{[\s\S]*?points:\s*\[\s*"([^"]*)"/) || [])[1];
  conditions[mark.key] = { key: mark.key, ready: ready, ageNote: ageNote, yesTitle: yesTitle, yesFirst: yesFirst };
});

// Every pinned condition must exist in the generator, and vice versa.
Object.keys(NHS).forEach(function (k) {
  if (!conditions[k]) failures.push("NHS pins " + k + " but the generator has no such condition");
});
Object.keys(conditions).forEach(function (k) {
  var c = conditions[k];
  if (!c.ready) return;
  if (!NHS[k]) {
    failures.push("generator has ready condition " + k + " with no pinned NHS criteria - add it to NHS or mark the condition not ready");
  }
});

// ---------------------------------------------------------------------------
// Rules 1 to 4, on the generator.
// ---------------------------------------------------------------------------
var checked = 0;
Object.keys(NHS).forEach(function (k) {
  var c = conditions[k];
  if (!c) return;
  var pin = NHS[k];
  checked++;

  if (!c.ageNote) { failures.push(k + ": no ageNote in the generator (rule 1)"); }
  if (!c.yesFirst) { failures.push(k + ": no eligibleYes points in the generator (rule 1)"); }
  if (!c.ageNote || !c.yesFirst) return;

  var a = nums(c.ageNote);
  var y = nums(c.yesFirst);

  if (!sameNums(a, y)) {
    failures.push(k + ": the two eligibility strings disagree (rule 2)\n" +
      "         ageNote        : " + c.ageNote + "\n" +
      "         eligibleYes[0] : " + c.yesFirst);
  }
  if (!sameNums(a, pin.ages)) {
    failures.push(k + ": ageNote does not match the NHS criteria (rule 3)\n" +
      "         ageNote : " + c.ageNote + "\n" +
      "         NHS     : " + pin.ages.join(" to "));
  }
  if (!sameNums(y, pin.ages)) {
    failures.push(k + ": eligibleYes[0] does not match the NHS criteria (rule 3)\n" +
      "         eligibleYes[0] : " + c.yesFirst + "\n" +
      "         NHS            : " + pin.ages.join(" to "));
  }
  if (pin.cohort) {
    var re = new RegExp("\\b" + pin.cohort + "\\b", "i");
    if (!re.test(c.yesFirst)) {
      failures.push(k + ": NHS restricts this pathway to " + pin.cohort +
        " and eligibleYes[0] does not say so (rule 4)\n         " + c.yesFirst);
    }
  }
});

// ---------------------------------------------------------------------------
// Rules 5 to 8, on the generated pages.
// ---------------------------------------------------------------------------
function stripped(html) {
  return html
    .replace(/^<!--[\s\S]*?-->/, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
}

// Flat view, for the verbatim matching in rules 5 and 6.
function visibleText(html) {
  return norm(stripped(html).replace(/<[^>]+>/g, " "));
}

// Block view, for rule 7. The eligibility copy is a list of bullets and
// carries almost no full stops, so splitting on sentences runs one bullet
// into the next and a redirect in a NEIGHBOURING bullet then excuses an age
// that its own bullet never justified. That is not hypothetical: the first
// negative test for the boundary rule passed against a page reading "Adults
// aged 18 and over are welcome too", because the bullet above it still said
// "should see a GP". Bounded at block elements instead.
function visibleSegments(html) {
  return stripped(html)
    .replace(/<\/(li|p|h[1-6]|div|section|td|th|dd|dt)\s*>/gi, "")
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .split("")
    .map(norm)
    .filter(function (s) { return s.length > 0; });
}

var pages = [];
if (fs.existsSync(PAGE_DIR)) {
  fs.readdirSync(PAGE_DIR).forEach(function (f) {
    if (!/\.html$/.test(f)) return;
    Object.keys(NHS).forEach(function (k) {
      if (f.indexOf(k + "-treatment-") === 0) pages.push({ file: path.join(PAGE_DIR, f), cond: k });
    });
  });
}

pages.forEach(function (p) {
  var c = conditions[p.cond];
  var pin = NHS[p.cond];
  if (!c) return;
  var html = fs.readFileSync(p.file, "utf8");
  var text = visibleText(html);
  var segments = visibleSegments(html);
  var name = rel(p.file);

  if (c.yesTitle && text.indexOf(c.yesTitle) === -1) {
    failures.push(name + ": eligibility heading missing from the page (rule 5)\n         expected: " + c.yesTitle);
  }
  if (c.yesFirst && text.indexOf(c.yesFirst) === -1) {
    failures.push(name + ": eligibility cohort line missing from the page (rule 5)\n         expected: " + c.yesFirst);
  }
  if (c.ageNote && text.indexOf(c.ageNote) === -1) {
    failures.push(name + ": ageNote missing from the page (rule 6)\n         expected: " + c.ageNote);
  }

  // Rule 7: no age number outside the pinned set for this condition, except
  // a boundary number one either side of the cohort inside redirect wording.
  var allowed = {};
  pin.ages.forEach(function (n) { allowed[n] = true; });
  var lo = Math.min.apply(null, pin.ages);
  var hi = Math.max.apply(null, pin.ages);
  var boundary = {};
  boundary[lo - 1] = true;
  boundary[hi + 1] = true;

  var stray = {};
  segments.forEach(function (seg) {
    var mm;
    AGE_IN_TEXT.lastIndex = 0;
    while ((mm = AGE_IN_TEXT.exec(seg)) !== null) {
      var n = Number(mm[1] || mm[2] || mm[3]);
      if (allowed[n]) continue;
      // Allow it only if it is a boundary of the cohort AND the block it
      // sits in redirects the reader elsewhere.
      if (boundary[n] && REDIRECTS.test(seg)) continue;
      stray[n] = seg;
    }
  });
  Object.keys(stray).forEach(function (n) {
    failures.push(name + ": states age " + n +
      " which is not in the NHS criteria for " + p.cond +
      " (" + pin.ages.join(" to ") + ") (rule 7)\n         " + stray[n]);
  });

  if (pin.excluded && !pin.excluded.test(text)) {
    failures.push(name + ": the safety redirect for the excluded cohort is missing (rule 8)\n" +
      "         expected to match: " + pin.excluded);
  }
});

// ---------------------------------------------------------------------------
// Rule 9, on the GBP packs.
// ---------------------------------------------------------------------------
// Sentence-bounded, for the same reason rule 7 is block-bounded: a cohort
// named in the sentence next door must not excuse an age in this one. Split
// on a full stop followed by whitespace, which leaves URLs and times intact
// because neither carries a space after its dots or colons.
function packSentences(text) {
  return norm(text)
    .split(/[.!?]\s+/)
    .map(norm)
    .filter(function (s) { return s.length > 0; });
}

var packs = [];
if (fs.existsSync(PACK_DIR)) {
  fs.readdirSync(PACK_DIR).forEach(function (f) {
    if (!/\.md$/.test(f)) return;
    if (f === "TEMPLATE.md") return;
    packs.push(path.join(PACK_DIR, f));
  });
}

packs.forEach(function (file) {
  var name = rel(file);
  packSentences(fs.readFileSync(file, "utf8")).forEach(function (seg) {
    var seen = {};
    var mm;
    AGE_IN_TEXT.lastIndex = 0;
    while ((mm = AGE_IN_TEXT.exec(seg)) !== null) {
      if (UNIT_AFTER.test(seg.slice(mm.index + mm[0].length))) continue;
      seen[Number(mm[1] || mm[2] || mm[3])] = true;
    }
    if (!Object.keys(seen).length) return;

    var accounted = {};
    PACK_COHORTS.forEach(function (c) {
      var hit = seg.match(c.re);
      if (!hit) return;
      if (!c.context.test(seg)) {
        failures.push(name + ": states \"" + norm(hit[0]) +
          "\" in a sentence that never names " + c.what +
          ", so a pinned cohort is attached to the wrong service (rule 9)\n" +
          "         NHS pins this cohort as: " + c.nhs + "\n         " + seg);
        return;
      }
      nums(hit[0]).forEach(function (n) { accounted[n] = true; });
    });

    Object.keys(seen).forEach(function (n) {
      if (accounted[n]) return;
      failures.push(name + ": states age " + n +
        ", which is not part of any NHS cohort a pack may state (rule 9)\n" +
        "         pinned cohorts: " +
        PACK_COHORTS.map(function (c) { return c.nhs; }).join("; ") +
        "\n         " + seg);
    });
  });
});

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
console.log("check-pharmacy-first-eligibility");
console.log("  " + checked + " pinned conditions read from " + rel(GENERATOR));
console.log("  " + pages.length + " condition pages checked against them");
console.log("  " + packs.length + " GBP packs checked against the pinned cohorts");

warnings.forEach(function (w) { console.log("  WARN " + w); });

if (failures.length) {
  console.log("");
  failures.forEach(function (f) { console.log("  FAIL " + f); });
  console.log("\ncheck-pharmacy-first-eligibility: " + failures.length + " failure(s).");
  process.exit(1);
}
console.log("");
console.log("check-pharmacy-first-eligibility: clean, every page states the NHS cohort and no other age.");
process.exit(0);
