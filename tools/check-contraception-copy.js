/*
  tools/check-contraception-copy.js - NHS Pharmacy Contraception Service copy verifier.

  Why this exists
  ---------------
  Fourteen live pages tell a patient what the NHS Pharmacy Contraception
  Service is, who it is for, what it costs and who gets told about it. Every
  word of that is composed in tools/build-contraception-pages.js, and until
  this checker nothing in the repo read any of it.

  The contraception pages were not unchecked by oversight. They are covered
  eight ways already: check-page-coverage earns the page, check-seo-pattern
  holds the title and H1, check-seo-sheets ties the page to its paste sheet,
  check-seo-keywords holds the fourth Weebly field, check-nap and check-jsonld
  hold the address block, check-map-embeds holds the map, check-widget-diaries
  holds the booking diary. Every one of those reads the frame. None reads the
  service description inside it.

  That is the same gap the sixty-third run closed for Pharmacy First. Every PF
  condition page states its NHS cohort twice and no rule read either, so
  check-pharmacy-first-eligibility.js was written. It deliberately covers the
  seven PF pathways and nothing else. Contraception is the estate's other NHS
  clinical service, on its own generator, with its own eligibility boxes, its
  own free-of-charge claim and its own confidentiality promise, and it fell in
  the gap between the two.

  Why it matters more than an SEO string. Three of these claims are the kind a
  plausible-looking copy edit breaks without anyone noticing:

    - "Free NHS service" and "no prescription charge". State a price on an NHS
      service and the page is wrong about the NHS, not just about us.
    - "We will only tell your GP that you have used the service if you give
      your consent." Flip that sentence and the page misstates what happens to
      a patient's data on a service people use precisely because it is
      confidential.
    - The coil and implant line. This service supplies oral contraception. The
      page signposts long-acting methods elsewhere and must never read as an
      offer to fit one.

  What it enforces
  ----------------
  The copy is read OUT of the generator rather than mirrored here, the lesson
  of the fifty-second run: a hand-copied list in a checker goes stale silently
  and a new bullet never gets typed. Add a bullet to the generator and it is
  under test on the next run without touching this file.

    - RULE 1, source: the generator still exposes the copy this checker reads,
      that is, a covers list, both eligibility boxes and the FAQ. If a refactor
      moves the copy somewhere this parser cannot see, the run fails rather
      than quietly checking nothing. This is the failure mode a presence-only
      checker cannot detect in itself.
    - RULE 2, pages: every branch the generator builds has its page on disk.
    - RULE 3, verbatim: every static line of service copy in the generator
      appears on every page, word for word. Lines carrying the brand or the
      town are compared after substituting that branch's own values, so a page
      cannot borrow another branch's town inside a sentence either. Read
      against the CRAWLABLE text, not the raw source: from the item 3.8
      quality pass on 2026-08-14, copy that survives only inside a <script> or
      an HTML comment counts as absent, per Build Pack v2 section 5.1. A guard
      fails the run if the stripper stops removing anything or starts removing
      the body.
    - RULE 4, service name: every page names the service by its NHS name,
      "NHS Pharmacy Contraception Service". A page naming it anything else
      fails.
    - RULE 5, free: every page carries the no-charge answer, and no page states
      a price, a fee or a currency amount anywhere. A charge on this page is a
      false statement about an NHS service.
    - RULE 6, consent: the confidentiality answer says the GP is told only with
      consent. A page that promises the GP is never told, or states the GP is
      always told, fails. Both directions, because a presence rule alone cannot
      see a sentence that has been reversed.
    - RULE 7, long-acting: no page offers to fit, insert or provide a coil,
      implant or injection. Signposting those methods elsewhere is required and
      allowed; offering them is not.
    - RULE 8, no medicine names: no page names a contraceptive by brand or by
      drug name. These are prescription-only medicines and this is public
      advertising copy, the same rule the weight loss pages run under.
    - RULE 9, safeguarding: the generator's own header says under-16s carry a
      safeguarding step. If no page carries one, that is a documented intention
      the pages do not keep, and it fails unless it is listed in KNOWN below
      with the question it is waiting on.
    - a stale KNOWN key fails, the same convention as KNOWN_DRIFT in
      check-cdn-pins.js, so an accepted breach cannot outlive its reason.

  Clinical wording is not this checker's to decide. It pins what the
  superintendent pharmacist signed off and fails when it moves.

  Run:  node tools/check-contraception-copy.js
  Exits 1 on any failure.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var GENERATOR = path.join(ROOT, "tools", "build-contraception-pages.js");
var PAGE_DIR = path.join(ROOT, "modules", "service", "pages");
var BRANCHES = path.join(ROOT, "branches.json");

// The NHS's own name for the service. Not ours to shorten.
var SERVICE_NAME = "NHS Pharmacy Contraception Service";

// Accepted breaches, keyed "<rule>::<what>", each with the reason it stands.
// A key that no longer breaks its rule fails the run, so this list cannot rot.
var KNOWN = {
  "safeguarding::no under-16 step on any page":
    "Raised as Q47 on 2026-08-11. The generator header states under-16s carry " +
    "a safeguarding step and no page carries one. Writing that wording is a " +
    "clinical and safeguarding decision for the superintendent pharmacist, " +
    "not an agent edit, so the gap is pinned here rather than filled. Remove " +
    "this entry when the answer lands and the wording is on the pages."
};
var knownUsed = {};

var failures = [];
function fail(rule, what, message) {
  var key = rule + "::" + what;
  if (Object.prototype.hasOwnProperty.call(KNOWN, key)) { knownUsed[key] = true; return; }
  failures.push("[" + rule + "] " + message);
}

function rel(p) { return path.relative(ROOT, p).replace(/\\/g, "/"); }

// ---------------------------------------------------------------------------
// Read the copy out of the generator.
//
// The generator composes the page as concatenated JavaScript string literals,
// so a line of service copy sits in the source verbatim, except where a branch
// value is spliced in and the literal breaks around a ' + esc(...) + '. Those
// are kept as templates and resolved per branch in rule 3.
// ---------------------------------------------------------------------------
var genSrc = fs.readFileSync(GENERATOR, "utf8");

// Strip the head comment so prose about the copy is never mistaken for copy.
var genBody = genSrc.replace(/^[\s\S]*?\*\//, "");

function collect(re) {
  var out = [], m;
  re.lastIndex = 0;
  while ((m = re.exec(genBody)) !== null) {
    var s = m[1].replace(/\\n/g, "").replace(/\s+/g, " ").trim();
    if (s) out.push(s);
  }
  return out;
}

// Every list item and every FAQ answer the generator writes.
var bullets = collect(/<li>([\s\S]*?)<\/li>/g);
var answers = collect(/<div class="answer">([\s\S]*?)<\/div>/g);
var summaries = collect(/<summary>([\s\S]*?)<\/summary>/g);
var stepText = collect(/<h3>[^<]*<\/h3><p>([\s\S]*?)<\/p>/g);

// Rule 1: the parser found the copy it exists to guard. These counts are floors,
// not fingerprints: adding copy is fine, losing the ability to see it is not.
if (bullets.length < 10) {
  failures.push("[source] " + rel(GENERATOR) + ": found only " + bullets.length +
    " <li> lines of service copy. The generator has been refactored past this " +
    "parser, so rules 3 to 8 would pass while reading almost nothing. Fix the " +
    "extraction here rather than lowering this floor.");
}
if (answers.length < 5 || summaries.length < 5) {
  failures.push("[source] " + rel(GENERATOR) + ": found " + summaries.length +
    " FAQ question(s) and " + answers.length + " answer(s). The FAQ carries the " +
    "no-charge claim and the consent promise, so losing sight of it disables " +
    "rules 5 and 6.");
}
if (summaries.length !== answers.length) {
  failures.push("[source] " + rel(GENERATOR) + ": " + summaries.length +
    " FAQ question(s) but " + answers.length + " answer(s), so at least one " +
    "question on a live page has no answer behind it.");
}

// A literal that splices a branch value in, eg
//   <li>Seen privately by your local ' + esc(store.town) + ' team</li>
// is held as a template so it can be resolved per branch instead of skipped.
var SPLICE = /'\s*\+\s*esc\((?:store|b)\.(\w+)\)\s*\+\s*'/g;

function isTemplate(s) { SPLICE.lastIndex = 0; return SPLICE.test(s); }

function resolveFor(s, branch) {
  SPLICE.lastIndex = 0;
  return s.replace(SPLICE, function (_m, field) {
    if (field === "town") return branch.seoTown;
    if (field === "brand") return branch.brandLabel;
    if (field === "phone") return branch.phone;
    return " UNRESOLVED:" + field + " ";
  });
}

var copyLines = bullets.concat(answers, stepText);

// ---------------------------------------------------------------------------
// Which branches the generator builds, read from its own BUILD list so this
// checker cannot disagree with it.
// ---------------------------------------------------------------------------
var buildBlock = /var BUILD\s*=\s*\[([\s\S]*?)\]|const BUILD\s*=\s*\[([\s\S]*?)\]/.exec(genSrc);
var buildIds = [];
if (buildBlock) {
  var inner = buildBlock[1] || buildBlock[2] || "";
  buildIds = (inner.match(/"[^"]+"/g) || []).map(function (s) { return s.replace(/"/g, ""); });
}
if (!buildIds.length) {
  failures.push("[source] " + rel(GENERATOR) + ": could not read the BUILD list, " +
    "so this checker does not know which pages should exist.");
}

var data = JSON.parse(fs.readFileSync(BRANCHES, "utf8"));
var byId = {};
data.branches.forEach(function (b) { byId[b.id] = b; });

function norm(s) {
  return String(s)
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ").trim();
}
function visible(html) { return norm(html.replace(/<!--[\s\S]*?-->/g, " ")); }

// ---------------------------------------------------------------------------
// CRAWLABLE - what a search engine can actually read (item 3.8 quality pass,
// 2026-08-14).
//
// Build Pack v2 section 5.1 states it as a critical rule: "anything that must
// RANK has to be real text in the page, not injected by JavaScript".
// visible() above strips HTML comments but not <script> bodies, so a line of
// service copy moved out of the body into a script that writes it back with
// innerHTML stayed in visible() and RULE 3 passed on copy Google can no longer
// see. That is the precise fault section 5.1 is written against.
//
// Proved by injection on this pass, not by reading: the four hero-points on
// contraception-sk-chemists-bootle.html, including "Free NHS service,
// confidential consultation", were replaced by an empty div plus a script
// assigning the identical markup to innerHTML. All 36 checkers stayed green.
// The same block wrapped in an HTML comment failed immediately on all four
// lines, which is what proves the hole was the script half only.
//
// This is the second instance of the class. The first was fixed in
// check-switch-copy.js on the item 3.10 quality pass earlier the same day and
// found there; this mirrors that fix so the two checkers ask the same question
// of the same class of copy.
//
// PRESENCE DIRECTION ONLY. Absence rules below must keep reading visible(),
// because copy hidden in a script is still written into the page for a patient
// to read: a price, a reversed consent sentence or a named medicine injected
// by JavaScript is still in front of the patient. Weakening an absence rule to
// match a presence rule would trade one blind spot for another.
// ---------------------------------------------------------------------------
function crawlable(html) {
  return norm(String(html)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " "));
}
function textOnly(s) { return norm(String(s).replace(/<[^>]+>/g, " ")); }

var pages = [];
buildIds.forEach(function (id) {
  var b = byId[id];
  if (!b) {
    failures.push("[pages] " + rel(GENERATOR) + ' BUILD names "' + id +
      '" but branches.json has no such branch.');
    return;
  }
  var file = path.join(PAGE_DIR, "contraception-" + b.brandSlug + "-" + b.townSlug + ".html");
  if (!fs.existsSync(file)) {
    failures.push("[pages] " + rel(file) + " is missing, but the generator builds " +
      b.brandLabel + " " + b.seoTown + ", so a paster has a sheet entry and no page.");
    return;
  }
  var raw = fs.readFileSync(file, "utf8");
  pages.push({ b: b, file: file, raw: raw, crawl: crawlable(raw) });
});

// Guard on the stripper itself. A regex that silently stopped matching would
// turn every presence rule below back into a source rule without failing
// anything, and a regex that ate the page would make them pass on nothing.
// Every contraception page carries three <script> blocks and two HTML
// comments, so the stripper must shrink the page, and the body must survive.
pages.forEach(function (p) {
  if (p.crawl.length >= visible(p.raw).length) {
    failures.push("[crawlable] " + rel(p.file) + ": stripping scripts and comments " +
      "removed nothing, so every presence rule below is reading the raw source " +
      "again and the Build Pack v2 section 5.1 rule is not being applied.");
  }
  var plain = textOnly(p.crawl);
  if (plain.length < 2500) {
    failures.push("[crawlable] " + rel(p.file) + ": only " + plain.length +
      " characters of crawlable text survive the stripper, against roughly 3,650 " +
      "on a healthy page of this family. Either the page has lost its body copy " +
      "or the stripper is over-matching and the rules below are checking almost " +
      "nothing.");
  }
});

pages.forEach(function (p) {
  // Two different questions, so two different readings. "Is the copy on the
  // page?" is a presence rule and reads the crawlable text. "Is forbidden
  // wording on the page?" is an absence rule and reads everything, because
  // innerHTML still shows it to the patient. See CRAWLABLE above.
  var crawl = p.crawl;
  var all = visible(p.raw);
  var name = rel(p.file);

  // RULE 3: every line of service copy, verbatim, with branch values resolved.
  copyLines.forEach(function (line) {
    var want = norm(isTemplate(line) ? resolveFor(line, p.b) : line);
    if (want.indexOf("UNRESOLVED:") !== -1) {
      fail("verbatim", name + "|" + want, name + ": the generator splices a branch " +
        "field this checker cannot resolve into “" + want + "”, so that line " +
        "of copy is not being checked on any page.");
      return;
    }
    if (crawl.indexOf(want) === -1) {
      var hidden = all.indexOf(want) !== -1;
      fail("verbatim", name + "|" + want, name + ' does not carry the generator line "' +
        want + '"' + (hidden
          ? " as crawlable text. It is present in the source but only inside a " +
            "<script>, so a patient searching for it cannot find the page. Build " +
            "Pack v2 section 5.1: anything that must rank has to be real text in " +
            "the page, not injected by JavaScript."
          : ". Either the page is a stale build or it has been hand-edited."));
    }
  });

  // RULE 4: the service is named the way the NHS names it.
  if (crawl.indexOf(SERVICE_NAME) === -1) {
    fail("servicename", name, name + ' does not name the service "' + SERVICE_NAME +
      '" as crawlable text. A page that renames an NHS service is describing ' +
      "something that does not exist, and a page that only names it from a " +
      "script is not naming it to a search engine at all.");
  }
  var wrongNames = [
    "NHS Contraception Service", "Pharmacy Contraception Scheme",
    "NHS contraception scheme", "contraception scheme"
  ];
  wrongNames.forEach(function (w) {
    // Only a miss: the correct name contains none of these as a substring.
    if (SERVICE_NAME.indexOf(w) !== -1) return;
    if (all.indexOf(w) !== -1) {
      fail("servicename", name + "|" + w, name + ' calls the service "' + w +
        '" but its NHS name is "' + SERVICE_NAME + '".');
    }
  });
});

// ---------------------------------------------------------------------------
// Rules 5 to 8, the claims a plausible edit breaks.
// ---------------------------------------------------------------------------

// Drug and brand names for oral contraception. All prescription-only, so none
// may be advertised in public copy. Same rule the weight loss pages run under.
var MEDICINE_NAMES = [
  "microgynon", "rigevidon", "levest", "maexeni", "ovranette", "marvelon",
  "gedarel", "millinette", "yasmin", "lucette", "eloine", "cilest", "femodene",
  "katya", "cerazette", "cerelle", "zelleta", "nacrez", "hana", "lovima",
  "noriday", "norgeston", "levonorgestrel", "desogestrel", "norethisterone",
  "ethinylestradiol", "ethinyloestradiol", "drospirenone", "gestodene",
  "norgestimate", "ellaone", "levonelle", "ulipristal", "depo-provera",
  "sayana", "nexplanon", "mirena", "kyleena"
];

// Offering a long-acting method, as opposed to signposting one.
var LARC_OFFERS = [
  "we fit", "we can fit", "fitted here", "fitting service", "we insert",
  "we provide the coil", "we provide the implant", "coil fitting",
  "implant fitting", "we offer the coil", "we offer the implant",
  "contraceptive injection here", "we give the injection"
];

pages.forEach(function (p) {
  // Absence rules read everything (text/lower); the two presence rules in this
  // block read the crawlable text. See CRAWLABLE above.
  var text = visible(p.raw);
  var lower = text.toLowerCase();
  var crawl = p.crawl;
  var crawlLower = crawl.toLowerCase();
  var name = rel(p.file);

  // RULE 5: free, and priced nowhere.
  if (crawlLower.indexOf("no prescription charge") === -1) {
    fail("free", name, name + " does not carry the no-prescription-charge answer " +
      "as crawlable text, which is the one line that tells a reader this NHS " +
      "service costs nothing." +
      (lower.indexOf("no prescription charge") !== -1
        ? " It is in the source but only inside a <script>, so it is not on the " +
          "page as far as a search engine is concerned."
        : ""));
  }
  var priceHit = /£\s?\d|\b\d+\s?(?:pounds|p per)\b|\bfrom \d+\b/i.exec(text);
  if (priceHit) {
    fail("free", name + "|price", name + ' states a price, "' + priceHit[0].trim() +
      '", on a free NHS service page. Either the page has taken private-service ' +
      "copy or the service has stopped being free, and both are worth stopping for.");
  }
  ["there is a charge", "a small fee", "consultation fee", "payable"].forEach(function (w) {
    if (lower.indexOf(w) !== -1) {
      fail("free", name + "|" + w, name + ' says "' + w + '" on a free NHS service page.');
    }
  });

  // RULE 6: consent, in the right direction.
  var CONSENT = /only tell your gp[^.]*if you give your consent/i;
  var consentOk = CONSENT.test(crawl);
  if (!consentOk) {
    fail("consent", name, name + " does not carry the consent sentence in the form " +
      '"We will only tell your GP that you have used the service if you give your ' +
      'consent." That sentence is the page\'s statement of what happens to the ' +
      "patient's data, so it is not one to paraphrase." +
      (CONSENT.test(text)
        ? " It is in the source but only inside a <script>, so the page's only " +
          "statement about the patient's data is not crawlable text."
        : ""));
  }
  var reversed = [
    "we will always tell your gp", "your gp will be told", "we never tell your gp",
    "we will not tell your gp", "your gp is always informed"
  ];
  reversed.forEach(function (w) {
    if (lower.indexOf(w) !== -1) {
      fail("consent", name + "|" + w, name + ' says "' + w + '", which contradicts the ' +
        "consent sentence. One of the two is wrong and a reader cannot tell which.");
    }
  });

  // RULE 7: signpost long-acting methods, never offer them.
  LARC_OFFERS.forEach(function (w) {
    if (lower.indexOf(w) !== -1) {
      fail("larc", name + "|" + w, name + ' says "' + w + '". This service supplies ' +
        "oral contraception; a coil, implant or injection must be signposted " +
        "elsewhere, not offered here.");
    }
  });

  // RULE 8: no medicine named.
  MEDICINE_NAMES.forEach(function (m) {
    if (new RegExp("\\b" + m + "\\b", "i").test(text)) {
      fail("medicine", name + "|" + m, name + ' names "' + m + '", a prescription-only ' +
        "medicine, in public advertising copy.");
    }
  });
});

// ---------------------------------------------------------------------------
// RULE 9: the safeguarding step the generator's own header promises.
//
// build-contraception-pages.js says, in its header: "No NHS-set age range ->
// neutral 'Free NHS service' badge; under-16s carry a safeguarding step." That
// is a statement about what these pages do. If no page does it, the header is
// describing a page that does not exist, and the next person to read it will
// believe the safeguarding wording is already live.
//
// Writing that wording is a clinical decision, so this rule pins the gap and
// names the question rather than filling it.
// ---------------------------------------------------------------------------
var headerPromisesSafeguarding = /under-?16s?\s+carry\s+a\s+safeguarding\s+step/i.test(genSrc);
if (headerPromisesSafeguarding) {
  // Presence rule, so crawlable text: a safeguarding step a patient only sees
  // after JavaScript runs is not a safeguarding step the page states.
  var withStep = pages.filter(function (p) {
    var t = p.crawl.toLowerCase();
    return t.indexOf("under 16") !== -1 || t.indexOf("under-16") !== -1 ||
           t.indexOf("safeguard") !== -1 || /aged\s+16/.test(t);
  });
  if (withStep.length === 0) {
    fail("safeguarding", "no under-16 step on any page",
      rel(GENERATOR) + " states in its header that under-16s carry a safeguarding " +
      "step, and none of the " + pages.length + " generated contraception pages " +
      "carries any under-16 or safeguarding wording. Either the pages need it or " +
      "the header should stop claiming it.");
  } else if (withStep.length !== pages.length) {
    fail("safeguarding", "partial under-16 step",
      "Only " + withStep.length + " of " + pages.length + " contraception pages carry " +
      "under-16 or safeguarding wording, so the same NHS service reads differently " +
      "depending on which branch a patient lands on.");
  }
}

// ---------------------------------------------------------------------------
// A KNOWN entry that no longer breaks its rule is a lie about the estate.
// ---------------------------------------------------------------------------
Object.keys(KNOWN).forEach(function (key) {
  if (!knownUsed[key]) {
    failures.push("[known] stale KNOWN entry " + key + ": nothing breaks that rule " +
      "any more, so remove it from check-contraception-copy.js.");
  }
});

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
console.log("check-contraception-copy");
console.log("  " + pages.length + " contraception page(s) read against " +
  rel(GENERATOR));
console.log("  " + copyLines.length + " line(s) of service copy pinned, " +
  summaries.length + " FAQ pair(s)");
console.log("  presence rules read crawlable text only (scripts and comments " +
  "stripped, Build Pack v2 section 5.1); absence rules read the whole page");

var acceptedKeys = Object.keys(knownUsed);
if (acceptedKeys.length) {
  console.log("  " + acceptedKeys.length + " accepted breach(es), each with a reason in KNOWN:");
  acceptedKeys.forEach(function (k) { console.log("    " + k); });
}

if (failures.length) {
  console.log("");
  console.log("FAIL - " + failures.length + " problem(s):");
  failures.forEach(function (f) { console.log("  " + f); });
  process.exit(1);
}

console.log("  OK - no failures");
