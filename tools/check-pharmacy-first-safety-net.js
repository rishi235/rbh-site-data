/*
  tools/check-pharmacy-first-safety-net.js
  (added 2026-08-13 on the item 3.11 quality pass)

  Why this exists
  ---------------
  Every NHS Pharmacy First condition page carries two halves of one clinical
  message. The first half says who the service is for. The second half, the
  "When to get different help" block, says what to do when it is NOT for you:
  where an excluded patient should go, and which symptoms mean stop booking a
  pharmacy appointment and get urgent help today.

    - the first half comes from CONDITIONS[cond].eligibleYes and ageNote,
      and tools/check-pharmacy-first-eligibility.js has guarded it since the
      sixty-third run.
    - the second half comes from CONDITIONS[cond].eligibleNo in
      tools/build-service-pages.js, and until this file nothing read it.

  That asymmetry is the defect. eligibleNo is composed once in the generator
  and rendered onto every Pharmacy First condition page in the estate, and it
  is the higher-consequence half of the pair. The eligibility copy being wrong
  sends a patient to a service that turns them away. The safety-net copy being
  wrong, or silently dropped by a bad edit, leaves a patient with a possible
  kidney infection, a shingles rash near the eye, or the swelling face of an
  anaphylactic reaction reading a page that never tells them to escalate.

  The repo already treats this class of copy as must-guard on ONE service:
  check-weight-loss-copy.js rule "the safety net" requires "GP or NHS 111" and
  "999 in an emergency" on every weight loss page. The seven Pharmacy First
  condition pages carry the same class of copy and had no equivalent rule.
  Same shape of gap the sixty-third, sixty-eighth and sixty-ninth runs found
  in Pharmacy First eligibility, contraception and travel clinic copy: the
  frame around the words was checked eight ways and the words were not.

  Nothing in the copy is wrong today. Eleven quality passes have now read it
  by hand. This makes it a rule instead of a habit.

  What FAILS the run
  ------------------
    RULE 1, presence: a ready condition with no eligibleNo block, a block
      whose heading is not the estate's "When to get different help", or a
      block with fewer than 3 points. A missing heading is what a half-applied
      template edit looks like.

    RULE 2, onward route: an eligibleNo block that names no onward NHS route
      at all (GP, NHS 111 or 999). A page may tell a patient the service does
      not cover them, but never without telling them where to go instead.

    RULE 3, lower boundary: the youngest age the NHS pathway covers must be
      named as an exclusion, as "under N". This is the boundary a parent
      reads to decide whether to bring a child at all.

    RULE 4, upper boundary: where the pathway has an upper age, the excluded
      side must be named too, as "over N" or as "N+1 and over". UTI stops at
      64 and earache at 17, and both say so today in different words, so both
      spellings are accepted.

    RULE 5, emergency wording: a point that names 999 must instruct the reader
      to CALL it. "999" sitting in a sentence without the instruction is not
      an escalation, it is a number.

    RULE 6, verbatim on the page: every condition page must carry its own
      eligibleNo heading and every one of its own eligibleNo points, word for
      word. This is what catches a stale page or a hand-edit, the same way
      rules 5 and 6 of the eligibility checker do for the other half.

    RULE 7, no cross-condition contamination: no condition page may carry a
      safety-net point that belongs only to a DIFFERENT condition. A page
      telling an impetigo patient to call 999 for a swelling throat is copy
      that drifted in from the insect bite pathway.

    - a run in which no condition page is read at all, so every page rule
      above would be covering nothing.

  What WARNS
  ----------
  A condition whose safety net names no URGENT route (999, NHS 111, "urgent"
  or "same day"), only a routine one. Today that is impetigo alone, and
  whether it should carry a red flag is a clinical call about live
  patient-facing NHS copy, which is not a decision this agent may take. It is
  recorded in KNOWN below against its question id and warns until answered.

  Exceptions go in KNOWN with a reason and a question id, the same convention
  as check-branch-links.js. A KNOWN key that no longer breaks its rule fails
  the run, so the list cannot rot.
*/

"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var GENERATOR = path.join(ROOT, "tools", "build-service-pages.js");
var PAGE_DIR = path.join(ROOT, "modules", "service", "pages");

function rel(p) { return path.relative(ROOT, p).replace(/\\/g, "/"); }
function norm(s) { return String(s).replace(/\s+/g, " ").trim(); }

// ---------------------------------------------------------------------------
// The pinned NHS age boundaries, kept deliberately in the same shape as the
// NHS table in check-pharmacy-first-eligibility.js. min is the youngest age
// the pathway covers, max is the oldest or null where the pathway has no
// upper limit.
// ---------------------------------------------------------------------------
var NHS = {
  "uti":         { min: 16, max: 64 },
  "sore-throat": { min: 5,  max: null },
  "sinusitis":   { min: 12, max: null },
  "earache":     { min: 1,  max: 17 },
  "impetigo":    { min: 1,  max: null },
  "shingles":    { min: 18, max: null },
  "insect-bite": { min: 1,  max: null }
};

// Known, accepted exceptions. key -> { rule, why, q }.
var KNOWN = {
  "impetigo:urgent": {
    rule: "urgent",
    why: "The impetigo safety net names a GP twice but no urgent route. " +
         "Whether NHS impetigo copy should carry a red flag is a clinical " +
         "call on live patient-facing copy, so it is raised, not decided.",
    q: "Q61"
  }
};
var knownUsed = {};

var ROUTE = /\bGP\b|NHS 111|\b111\b|\b999\b/i;
var URGENT = /\b999\b|NHS 111|\b111\b|\burgent\b|same day/i;

var failures = [];
var warnings = [];

// ---------------------------------------------------------------------------
// Read the CONDITIONS table out of the generator.
// ---------------------------------------------------------------------------
if (!fs.existsSync(GENERATOR)) {
  console.log("check-pharmacy-first-safety-net");
  console.log("  FAIL generator not found: " + rel(GENERATOR));
  process.exit(1);
}
var src = fs.readFileSync(GENERATOR, "utf8");
var tableAt = src.indexOf("const CONDITIONS = {");
if (tableAt === -1) {
  console.log("check-pharmacy-first-safety-net");
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

  var noBlock = block.match(/eligibleNo:\s*\{([\s\S]*?)\}\s*,?\s*(?:steps|faq)\s*:/);
  var noTitle = null;
  var noPoints = [];
  if (noBlock) {
    noTitle = (noBlock[1].match(/title:\s*"([^"]*)"/) || [])[1] || null;
    var pointsRaw = (noBlock[1].match(/points:\s*\[([\s\S]*?)\]/) || [])[1];
    if (pointsRaw) {
      var pr = /"((?:[^"\\]|\\.)*)"/g;
      var pm;
      while ((pm = pr.exec(pointsRaw)) !== null) noPoints.push(pm[1]);
    }
  }
  conditions[mark.key] = {
    key: mark.key, ready: ready, hasBlock: !!noBlock,
    noTitle: noTitle, noPoints: noPoints
  };
});

// Every pinned condition must exist in the generator, and every ready
// condition must be pinned. Same guard as the eligibility checker, so a new
// pathway cannot be added without a safety net being considered for it.
Object.keys(NHS).forEach(function (k) {
  if (!conditions[k]) failures.push("NHS pins " + k + " but the generator has no such condition");
});
Object.keys(conditions).forEach(function (k) {
  if (!conditions[k].ready) return;
  if (!NHS[k]) {
    failures.push("generator has ready condition " + k + " with no pinned age boundary " +
      "- add it to NHS or mark the condition not ready");
  }
});

var TITLE = "When to get different help";

// ---------------------------------------------------------------------------
// Rules 1 to 5, on the generator.
// ---------------------------------------------------------------------------
var checked = 0;
Object.keys(NHS).forEach(function (k) {
  var c = conditions[k];
  if (!c || !c.ready) return;
  checked++;

  if (!c.hasBlock) {
    failures.push(k + ": no eligibleNo block in the generator, so the pathway " +
      "tells a patient it may not cover them and never says what to do instead (rule 1)");
    return;
  }
  if (c.noTitle !== TITLE) {
    failures.push(k + ': eligibleNo heading is "' + c.noTitle + '", expected "' +
      TITLE + '" (rule 1)');
  }
  if (c.noPoints.length < 3) {
    failures.push(k + ": eligibleNo has " + c.noPoints.length +
      " point(s), expected at least 3 (rule 1)");
  }
  if (!c.noPoints.length) return;

  var all = c.noPoints.join(" | ");

  // RULE 2, onward route.
  if (!ROUTE.test(all)) {
    failures.push(k + ": the safety net names no onward NHS route at all, so an " +
      "excluded patient is told the service is not for them and nowhere to go " +
      "instead (rule 2)\n         " + all);
  }

  // RULE 3, lower boundary named as an exclusion.
  var pin = NHS[k];
  var lowRe = new RegExp("under\\s+" + pin.min + "\\b", "i");
  if (!lowRe.test(all)) {
    failures.push(k + ': NHS covers this pathway from age ' + pin.min +
      ' and the safety net never names the excluded side as "under ' + pin.min +
      '" (rule 3)\n         ' + all);
  }

  // RULE 4, upper boundary named as an exclusion, where there is one.
  if (pin.max !== null) {
    var overRe = new RegExp("over\\s+" + pin.max + "\\b", "i");
    var andOverRe = new RegExp("\\b" + (pin.max + 1) + "\\s+and\\s+over\\b", "i");
    if (!overRe.test(all) && !andOverRe.test(all)) {
      failures.push(k + ": NHS stops this pathway at age " + pin.max +
        ' and the safety net never names the excluded side, as "over ' + pin.max +
        '" or "' + (pin.max + 1) + ' and over" (rule 4)\n         ' + all);
    }
  }

  // RULE 5, an emergency number must come with the instruction to call it.
  c.noPoints.forEach(function (p) {
    if (!/\b999\b/.test(p)) return;
    if (!/call\s+999\b/i.test(p)) {
      failures.push(k + ': a safety-net point names 999 without instructing the ' +
        'reader to call it (rule 5)\n         ' + p);
    }
  });

  // WARNING, urgent route present.
  var kn = KNOWN[k + ":urgent"];
  if (!URGENT.test(all)) {
    if (kn) {
      knownUsed[k + ":urgent"] = true;
      warnings.push(k + ": safety net names no urgent route. " + kn.why + " (" + kn.q + ")");
    } else {
      failures.push(k + ": the safety net names only routine help and no urgent " +
        "route, so a red-flag symptom has nowhere to escalate to (rule 2, urgent)\n         " + all);
    }
  } else if (kn) {
    failures.push(k + ": KNOWN entry " + k + ":urgent (" + kn.q + ") is stale - the " +
      "safety net now names an urgent route, so remove the exception.");
  }
});

// ---------------------------------------------------------------------------
// Rules 6 and 7, on the generated pages.
// ---------------------------------------------------------------------------
function stripped(html) {
  return html
    .replace(/^<!--[\s\S]*?-->/, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
}
// The generator's esc() encodes &, < and > before the copy reaches the page,
// so the sore throat point "call 999 or go to A&E" is stored on all 14 pages
// as "A&amp;E". Comparing raw page text against the generator string fails on
// every one of them and looks exactly like a missing red flag. Decode the
// three entities esc() produces before matching, so rule 6 tests the words
// the patient reads rather than the encoding they arrive in.
function decode(s) {
  return String(s)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
function visibleText(html) {
  return norm(decode(stripped(html).replace(/<[^>]+>/g, " ")));
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

// Rule 7's fingerprint table: point -> the set of conditions that own it.
// An earlier version of this rule recorded a single owner and threw the
// fingerprint away as soon as a second condition shared the point. That made
// the rule silently useless for exactly the lines most likely to be
// copy-pasted: "Babies under 1 should see a GP" is shared by earache,
// impetigo and insect bite, so pasting it onto the UTI page was not caught.
// The negative test for rule 7 failed against that version. Keeping the full
// set means a point is contamination on any page whose condition is not in
// it, however many conditions legitimately share it.
var owners = {};
Object.keys(NHS).forEach(function (k) {
  var c = conditions[k];
  if (!c) return;
  c.noPoints.forEach(function (p) {
    var key = norm(p);
    if (!owners[key]) owners[key] = [];
    if (owners[key].indexOf(k) === -1) owners[key].push(k);
  });
});

pages.forEach(function (p) {
  var name = path.basename(p.file);
  var c = conditions[p.cond];
  if (!c) return;
  var text = visibleText(fs.readFileSync(p.file, "utf8"));

  // RULE 6, verbatim.
  if (c.noTitle && text.indexOf(c.noTitle) === -1) {
    failures.push(name + ": the safety-net heading is missing from the page (rule 6)\n" +
      "         expected: " + c.noTitle);
  }
  c.noPoints.forEach(function (pt) {
    if (text.indexOf(norm(pt)) === -1) {
      failures.push(name + ": a safety-net point is missing from the page (rule 6)\n" +
        "         expected: " + norm(pt));
    }
  });

  // RULE 7, contamination.
  Object.keys(owners).forEach(function (key) {
    var own = owners[key];
    if (own.indexOf(p.cond) !== -1) return;
    if (text.indexOf(key) !== -1) {
      failures.push(name + ": carries a safety-net point that belongs to the " +
        own.join("/") + " pathway, not this one (rule 7)\n         " + key);
    }
  });
});

// Coverage guard: rules 6 and 7 must have had something to read.
if (!pages.length) {
  failures.push("no Pharmacy First condition pages were read from " + rel(PAGE_DIR) +
    ", so the page rules covered nothing");
}
if (!checked) {
  failures.push("no ready conditions were read from " + rel(GENERATOR) +
    ", so the generator rules covered nothing");
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
console.log("check-pharmacy-first-safety-net");
console.log("  " + checked + " ready conditions read from " + rel(GENERATOR));
console.log("  " + pages.length + " condition pages checked against their own safety net");

warnings.forEach(function (w) { console.log("  WARN " + w); });

if (failures.length) {
  console.log("");
  failures.forEach(function (f) { console.log("  FAIL " + f); });
  console.log("\ncheck-pharmacy-first-safety-net: " + failures.length + " failure(s).");
  process.exit(1);
}
console.log("");
console.log("check-pharmacy-first-safety-net: clean, every condition page states " +
  "its own escalation advice and no other pathway's.");
process.exit(0);
