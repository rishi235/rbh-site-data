/*
  tools/check-travel-clinic-copy.js - private Travel Clinic copy verifier.

  Why this exists
  ---------------
  Fifteen live pages sell a paid clinical service. They tell a traveller what
  the consultation is, what it costs them, what it does not cost the NHS, how
  far ahead to book, which vaccines the branch can talk about, and who should
  say something before they are given one. Every word of that is composed in
  tools/build-travel-clinic-pages.js, and until this checker nothing in the
  repo read any of it.

  The travel clinic pages were not unchecked by oversight. They are covered
  the same eight ways every other leaf service page is: check-page-coverage
  earns the page, check-seo-pattern holds the title and H1, check-seo-sheets
  and check-seo-keywords hold the four Weebly fields, check-nap and
  check-jsonld hold the address block, check-map-embeds holds the map,
  check-booking-routes and check-widget-diaries hold the diary the booking
  lands in, check-em-dashes holds the characters. Every one of those reads the
  frame. None reads the service description inside it.

  That leaves travel clinic as the last of the three separate services with
  unguarded body copy. The sixty-third run closed Pharmacy First eligibility,
  the sixty-eighth closed contraception, and both found the same thing: the
  copy was correct and simply had no rule behind it.

  Why it matters more than an SEO string. This generator states its own
  governance in its header, and every page it writes repeats it in the paste
  comment:

      "This is a PRIVATE, PAID service - not NHS Pharmacy First (some
       individual vaccines may be NHS-funded depending on personal
       circumstances; the copy flags this as 'ask the pharmacist', never a
       blanket promise). No vaccine is claimed to be guaranteed in stock."

  Three sentences of standing instruction, written down twice, enforced
  nowhere. A plausible copy edit breaks any of them without changing a title:

    - Drop "private, paid service" from the hero and the page reads as a free
      NHS clinic while we take payment at the counter.
    - Turn "some individual vaccines may be available on the NHS depending on
      your circumstances" into a flat "available on the NHS" and the page is
      wrong about NHS funding, not just about us.
    - Turn "subject to availability" into a promise and the page guarantees
      stock of a medicine, which is the one thing the superintendent
      pharmacist's note says never to do.

  What it enforces
  ----------------
  The copy is read OUT of the generator rather than mirrored here, the lesson
  of the fifty-second run: a hand-copied list in a checker goes stale silently
  and a new bullet never gets typed. Rules 4 to 10 are absolute instead, so
  editing the generator cannot make them pass by agreeing with themselves.

    - RULE 1, source: the generator still exposes the copy this checker reads.
      If a refactor moves it somewhere this parser cannot see, the run fails
      rather than quietly checking nothing.
    - RULE 2, pages: every branch the generator builds has its page on disk.
    - RULE 3, verbatim: every static line of service copy in the generator
      appears on every page, word for word, with branch values resolved, so a
      page cannot borrow another branch's town inside a sentence.
    - RULE 4, private: every page states in visible copy that this is a
      private, paid service, and states it in the hero rather than only in an
      FAQ a reader may never open. No page may describe it as an NHS service
      or as Pharmacy First.
    - RULE 5, NHS funding: every statement about NHS funding carries a hedge.
      A blanket promise that a vaccine is free on the NHS fails. Questions are
      exempt, because a question is not a promise.
    - RULE 6, stock: no page guarantees a vaccine is in stock, and every page
      carries the availability hedge that makes the rest of the copy honest.
    - RULE 7, lead time: the book-ahead window is one number on the page and
      the same number on all fifteen, so a traveller cannot be told six weeks
      on one branch's page and four on another's.
    - RULE 8, no medicine names: no page names a vaccine or antimalarial by
      brand or by drug name. These are prescription-only medicines and this is
      public advertising copy, the same rule the weight loss and contraception
      pages run under.
    - RULE 9, safety cohorts: the four groups who must speak up before being
      vaccinated are named on every page. This is the travel counterpart of
      the eligibility rule the sixty-third run wrote for Pharmacy First.
    - RULE 10, town: the trust bar names the branch's own seoTown. It is the
      one line of body copy that carries a place name and nothing read it.
    - RULE 11, yellow fever: a page may only advertise yellow fever where its
      branch declares it holds the registration that vaccine requires. No
      branch declares it either way today, so the rule is pinned in KNOWN
      against the question it is waiting on rather than filled in by an agent.
    - a stale KNOWN key fails, the same convention as KNOWN_DRIFT in
      check-cdn-pins.js, so an accepted breach cannot outlive its reason.

  Clinical wording is not this checker's to decide. It pins what the
  superintendent pharmacist signed off and fails when it moves.

  Run:  node tools/check-travel-clinic-copy.js
  Exits 1 on any failure.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var GENERATOR = path.join(ROOT, "tools", "build-travel-clinic-pages.js");
var PAGE_DIR = path.join(ROOT, "modules", "service", "pages");
var BRANCHES = path.join(ROOT, "branches.json");

// Accepted breaches, keyed "<rule>::<what>", each with the reason it stands.
// A key that no longer breaks its rule fails the run, so this list cannot rot.
var KNOWN = {
  "yellowfever::no branch declares yellowFeverCentre":
    "Raised as Q48 on 2026-08-11. All fifteen travel clinic pages advertise " +
    "yellow fever in the vaccine grid. Yellow fever vaccine may only be given, " +
    "and the international certificate only issued, by a centre registered for " +
    "it, and branches.json records nothing about which of our branches hold " +
    "that registration. Whether a branch is registered is a regulatory fact " +
    "about the business, not something an agent can decide or infer, so the " +
    "gap is pinned here rather than filled and the copy is left untouched. " +
    "Remove this entry when the answer lands and yellowFeverCentre is set on " +
    "every branch the generator builds."
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
//
// The contact card, the booking card and the schema block are dropped first.
// They are frame, not copy, they are already held by check-nap, check-jsonld,
// check-map-embeds and check-booking-routes, and the contact card's review
// line is conditional on a branch field, which would make rule 3 report a
// missing line on any branch without a review URL.
// ---------------------------------------------------------------------------
var genSrc = fs.readFileSync(GENERATOR, "utf8");
var genBody = genSrc.replace(/^[\s\S]*?\*\//, "");

function dropFunction(src, name) {
  var start = src.indexOf("function " + name + "(");
  if (start === -1) return { src: src, found: false };
  var next = src.indexOf("\nfunction ", start + 1);
  var end = next === -1 ? src.length : next;
  return { src: src.slice(0, start) + src.slice(end), found: true };
}

var DROPPED = ["headComment", "headLinks", "bookingCard", "contactCard", "pharmacySchema"];
var copySrc = genBody;
var missingDrops = [];
DROPPED.forEach(function (n) {
  var r = dropFunction(copySrc, n);
  if (!r.found) missingDrops.push(n);
  copySrc = r.src;
});

function collect(src, re) {
  var out = [], m;
  re.lastIndex = 0;
  while ((m = re.exec(src)) !== null) {
    var s = m[1].replace(/\\n/g, "").replace(/\s+/g, " ").trim();
    if (s) out.push(s);
  }
  return out;
}

// Every piece of service copy the generator writes into the page body.
var bullets = collect(copySrc, /<li>([\s\S]*?)<\/li>/g);
var answers = collect(copySrc, /<div class="answer">([\s\S]*?)<\/div>/g);
var summaries = collect(copySrc, /<summary>([\s\S]*?)<\/summary>/g);
var stepText = collect(copySrc, /<h3>[^<]*<\/h3><p>([\s\S]*?)<\/p>/g);
var headings2 = collect(copySrc, /<h2 class="h2">([\s\S]*?)<\/h2>/g);
var headings3 = collect(copySrc, /<h3>([\s\S]*?)<\/h3>/g);
var leads = collect(copySrc, /<p class="lead">([\s\S]*?)<\/p>/g);
var heroSub = collect(copySrc, /<p class="hero-sub">([\s\S]*?)<\/p>/g);
var heroProof = collect(copySrc, /<p class="hero-proof">([\s\S]*?)<\/p>/g);
var pill = collect(copySrc, /<span class="pill">([\s\S]*?)<\/span>/g);
var cardTitles = collect(copySrc, /<strong>([\s\S]*?)<\/strong>/g);
var cardText = collect(copySrc, /<span>([\s\S]*?)<\/span>/g);

// ---------------------------------------------------------------------------
// RULE 1, source. These counts are floors, not fingerprints: adding copy is
// fine, losing the ability to see it is not.
// ---------------------------------------------------------------------------
if (missingDrops.length) {
  failures.push("[source] " + rel(GENERATOR) + ": expected helper function(s) " +
    missingDrops.join(", ") + " are gone, so this checker is no longer dropping " +
    "the frame it means to drop and rule 3 may be comparing address lines as copy.");
}
if (bullets.length < 10) {
  failures.push("[source] " + rel(GENERATOR) + ": found only " + bullets.length +
    " <li> lines of service copy. The generator has been refactored past this " +
    "parser, so rules 3 and 9 would pass while reading almost nothing. Fix the " +
    "extraction here rather than lowering this floor.");
}
if (answers.length < 5 || summaries.length < 5) {
  failures.push("[source] " + rel(GENERATOR) + ": found " + summaries.length +
    " FAQ question(s) and " + answers.length + " answer(s). The FAQ carries the " +
    "private-not-NHS answer and the stock answer, so losing sight of it disables " +
    "the rules that matter most here.");
}
if (summaries.length !== answers.length) {
  failures.push("[source] " + rel(GENERATOR) + ": " + summaries.length +
    " FAQ question(s) but " + answers.length + " answer(s), so at least one " +
    "question on a live page has no answer behind it.");
}
if (cardTitles.length < 6 || cardText.length < 6) {
  failures.push("[source] " + rel(GENERATOR) + ": found " + cardTitles.length +
    " card heading(s) and " + cardText.length + " card line(s). The vaccine grid " +
    "is where a medicine name would be typed, so rule 8 must be able to see it.");
}
if (heroSub.length !== 1) {
  failures.push("[source] " + rel(GENERATOR) + ": found " + heroSub.length +
    " hero paragraph(s). That paragraph carries the private-and-paid statement, " +
    "which is the single sentence rule 4 exists to hold.");
}

// A literal that splices a branch value in, eg
//   <strong>Local ' + esc(store.town) + ' team</strong>
// is held as a template so it can be resolved per branch instead of skipped.
var SPLICE = /'\s*\+\s*esc\((?:store|b)\.(\w+)\)\s*\+\s*'/g;

function isTemplate(s) { SPLICE.lastIndex = 0; return SPLICE.test(s); }

function resolveFor(s, branch) {
  SPLICE.lastIndex = 0;
  return s.replace(SPLICE, function (_m, field) {
    if (field === "town") return branch.seoTown;
    if (field === "brand") return branch.brandLabel;
    if (field === "phone") return branch.phone;
    return " UNRESOLVED:" + field + " ";
  });
}

var copyLines = bullets
  .concat(answers, summaries, stepText, headings2, headings3,
          leads, heroSub, heroProof, pill, cardTitles, cardText);

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
// Crawlable copy only. HTML comments and <script> bodies both go, because
// neither is copy a traveller reads or a crawler indexes. Build Pack v2
// section 5.1: "anything that must RANK has to be real text in the page, not
// injected by JavaScript".
//
// The tag match is case-insensitive and \b-anchored, and that is the whole
// point of this note. The 193rd and 194th runs closed this class on
// check-switch-copy.js and check-contraception-copy.js, both of which had no
// script stripping at all. This checker DID strip scripts, so it read as
// already covered and nobody re-examined it, but it stripped them
// case-sensitively. <SCRIPT> survived, and copy hidden inside one counted as
// visible. Proved on the item 3.9 quality pass, 2026-08-14, by moving the
// hero paragraph of travel-clinic-coleman-leigh-walton.html into an
// uppercase <SCRIPT> that wrote it back with innerHTML: the governing
// "private, paid service" sentence was absent from the rendered page and
// this checker still returned OK. The same block in lowercase failed
// immediately, which is what proves the hole was the case half only.
function visible(html) {
  return norm(html.replace(/<!--[\s\S]*?-->/g, " ")
                  .replace(/<script\b[\s\S]*?<\/script>/gi, " "));
}
// Visible text with the tags removed, for the sentence-level rules.
function plain(html) { return norm(visible(html).replace(/<[^>]*>/g, " ")); }

// ---------------------------------------------------------------------------
// RULE 2, pages.
// ---------------------------------------------------------------------------
var pages = [];
buildIds.forEach(function (id) {
  var b = byId[id];
  if (!b) {
    failures.push("[pages] " + rel(GENERATOR) + ' BUILD names "' + id +
      '" but branches.json has no such branch.');
    return;
  }
  var file = path.join(PAGE_DIR, "travel-clinic-" + b.brandSlug + "-" + b.townSlug + ".html");
  if (!fs.existsSync(file)) {
    failures.push("[pages] " + rel(file) + " is missing, but the generator builds " +
      b.brandLabel + " " + b.seoTown + ", so a paster has a sheet entry and no page.");
    return;
  }
  pages.push({ b: b, file: file, raw: fs.readFileSync(file, "utf8") });
});

// ---------------------------------------------------------------------------
// RULE 3, verbatim.
// ---------------------------------------------------------------------------
pages.forEach(function (p) {
  var text = visible(p.raw);
  var name = rel(p.file);
  copyLines.forEach(function (line) {
    var want = norm(isTemplate(line) ? resolveFor(line, p.b) : line);
    if (want.indexOf("UNRESOLVED:") !== -1) {
      fail("verbatim", name + "|" + want, name + ": the generator splices a branch " +
        'field this checker cannot resolve into "' + want + '", so that line ' +
        "of copy is not being checked on any page.");
      return;
    }
    if (text.indexOf(want) === -1) {
      fail("verbatim", name + "|" + want, name + ' does not carry the generator line "' +
        want + '". Either the page is a stale build or it has been hand-edited.');
    }
  });
});

// ---------------------------------------------------------------------------
// RULE 4, private and paid, said where a reader sees it.
//
// The hero is everything before the trust bar. An FAQ answer four screens down
// is not where somebody learns they are about to be charged.
// ---------------------------------------------------------------------------
var NOT_PRIVATE = [
  [/free NHS (?:travel )?(?:clinic|service)/i, "calls the travel clinic a free NHS service"],
  [/NHS travel clinic/i, "calls the travel clinic an NHS clinic"],
  [/(?:part of|under) (?:the )?(?:NHS )?Pharmacy First/i, "presents the travel clinic as Pharmacy First"],
  [/this is an NHS (?:service|appointment)/i, "calls a paid private service an NHS service"],
  [/no charge for (?:the )?(?:travel )?consultation/i, "says the paid consultation is free"]
];

pages.forEach(function (p) {
  var name = rel(p.file);
  var split = p.raw.indexOf('<div class="trust-bar">');
  var hero = plain(split === -1 ? p.raw : p.raw.slice(0, split));
  var text = plain(p.raw);

  if (!/private, paid service/i.test(hero)) {
    fail("private", name, name + ' does not say "private, paid service" in the hero. ' +
      "That sentence is where a traveller learns the consultation is chargeable " +
      "and that the NHS is not paying for it, and the generator header calls it " +
      "the governing statement of these pages.");
  }
  NOT_PRIVATE.forEach(function (r) {
    var hit = r[0].exec(text);
    if (hit) {
      fail("private", name + "|" + r[1], name + ' ' + r[1] + ' ("' + hit[0].trim() +
        '"). This is a private, paid service and the page must not read otherwise.');
    }
  });
});

// ---------------------------------------------------------------------------
// RULE 5, NHS funding is always hedged.
//
// The generator header: NHS-funded exceptions are flagged as "ask the
// pharmacist", never a blanket promise. A question is not a promise, so
// interrogative sentences are exempt.
// ---------------------------------------------------------------------------
var FUNDING = /(?:free on the NHS|available (?:free )?on the NHS|funded by the NHS|NHS-funded|NHS funded|on the NHS)/i;
var HEDGE = /\b(?:may|might|some|depending on|subject to|not an NHS|not NHS|no\.|will advise|can tell you|individual|circumstances|ask the pharmacist)\b/i;

function sentences(t) {
  return t.split(/(?<=[.!?])\s+/).map(function (s) { return s.trim(); }).filter(Boolean);
}

pages.forEach(function (p) {
  var name = rel(p.file);
  sentences(plain(p.raw)).forEach(function (s) {
    if (!FUNDING.test(s)) return;
    if (/\?$/.test(s)) return;               // a question is not a promise
    if (HEDGE.test(s)) return;
    fail("nhsfunding", name + "|" + s, name + ' states NHS funding without a hedge: "' +
      s + '". The generator header requires NHS-funded exceptions to be flagged ' +
      'as "ask the pharmacist", never a blanket promise, because whether a ' +
      "particular vaccine is NHS-funded depends on the individual traveller.");
  });
});

// ---------------------------------------------------------------------------
// RULE 6, stock is never guaranteed.
// ---------------------------------------------------------------------------
var STOCK_PROMISE = [
  [/guarantee[a-z]*\s+(?:in\s+)?stock/i, "guarantees stock"],
  [/guaranteed\s+in\s+stock/i, "guarantees stock"],
  [/always\s+in\s+stock/i, "promises permanent stock"],
  [/we\s+(?:always\s+)?(?:have|hold|stock)\s+(?:all|every)\b/i, "promises every vaccine"],
  [/all\s+(?:travel\s+)?vaccines?\s+(?:are\s+)?(?:in\s+stock|available)/i, "promises every vaccine"],
  [/every\s+(?:travel\s+)?vaccine\s+(?:in\s+stock|available)/i, "promises every vaccine"],
  [/we\s+will\s+have\s+(?:the|your)\s+vaccine/i, "promises a named vaccine will be there"],
  [/no\s+need\s+to\s+order\s+in/i, "denies the ordering-in that the FAQ relies on"]
];

pages.forEach(function (p) {
  var name = rel(p.file);
  var text = plain(p.raw);
  STOCK_PROMISE.forEach(function (r) {
    var hit = r[0].exec(text);
    if (!hit) return;
    if (/\?$/.test((sentences(text).filter(function (s) { return s.indexOf(hit[0]) !== -1; })[0] || ""))) return;
    fail("stock", name + "|" + r[1], name + " " + r[1] + ' ("' + hit[0].trim() +
      '"). The generator header says no vaccine is claimed to be guaranteed in ' +
      "stock, because availability varies and some vaccines are ordered in.");
  });
  if (!/subject to availability/i.test(text)) {
    fail("stock", name + "|hedge", name + ' does not carry "subject to availability". ' +
      "That phrase is what makes the vaccine grid a list of what the branch can " +
      "talk about rather than a list of what is on the shelf today.");
  }
});

// ---------------------------------------------------------------------------
// RULE 7, one book-ahead window, on every page.
//
// Only ranges attached to booking ahead are compared. "travelling within the
// next 1 to 2 weeks" is a different statement and is deliberately not caught.
// ---------------------------------------------------------------------------
var LEAD = /(\d+)\s*to\s*(\d+)\s*weeks\s*(?:or more\s*)?before/gi;
var leadSeen = {};

pages.forEach(function (p) {
  var name = rel(p.file);
  var text = plain(p.raw);
  var found = [], m;
  LEAD.lastIndex = 0;
  while ((m = LEAD.exec(text)) !== null) found.push(m[1] + " to " + m[2]);
  if (found.length < 2) {
    fail("leadtime", name + "|count", name + " states the book-ahead window " +
      found.length + " time(s). It belongs in the hero and in the FAQ, so a " +
      "reader who skims either one still gets it.");
    return;
  }
  var distinct = found.filter(function (v, i) { return found.indexOf(v) === i; });
  if (distinct.length > 1) {
    fail("leadtime", name + "|internal", name + " gives two different book-ahead " +
      "windows on one page: " + distinct.join(" weeks and ") + " weeks. A reader " +
      "cannot tell which one to act on.");
    return;
  }
  (leadSeen[distinct[0]] = leadSeen[distinct[0]] || []).push(name);
});

var leadValues = Object.keys(leadSeen);
if (leadValues.length > 1) {
  failures.push("[leadtime] the estate gives " + leadValues.length + " different " +
    "book-ahead windows: " + leadValues.map(function (v) {
      return v + " weeks on " + leadSeen[v].length + " page(s)";
    }).join(", ") + ". The same private service must not tell a traveller to book " +
    "further ahead at one branch than at another.");
}

// ---------------------------------------------------------------------------
// RULE 8, no medicine named.
//
// Vaccine brands and antimalarials are prescription-only medicines. Naming the
// DISEASE is service description and is required: "Yellow fever", "Typhoid",
// "Malaria prevention". Naming the PRODUCT is advertising a POM to the public.
// ---------------------------------------------------------------------------
// The names moved into tools/pom-names.js on the item 3.13 quality pass,
// 2026-08-11, because by then the same class of list had been typed out in
// three separate checkers and a fourth was about to be written. Membership is
// unchanged: the travel vaccine brands and the antimalarials, in that order.
var pomNames = require("./pom-names.js");
var MEDICINE_NAMES = pomNames.union(pomNames.TRAVEL_VACCINES, pomNames.ANTIMALARIALS);

pages.forEach(function (p) {
  var name = rel(p.file);
  var text = plain(p.raw);
  MEDICINE_NAMES.forEach(function (m) {
    if (new RegExp("\\b" + m + "\\b", "i").test(text)) {
      fail("medicine", name + "|" + m, name + ' names "' + m + '", a prescription-only ' +
        "medicine, in public advertising copy. Name the disease the vaccine or " +
        "tablet is for, never the product.");
    }
  });
});

// ---------------------------------------------------------------------------
// RULE 9, the four groups who must speak up.
//
// The travel counterpart of check-pharmacy-first-eligibility. Trimming this box
// stops the page telling a pregnant traveller, or a traveller on immune-
// suppressing medication, to say so before they are given anything.
// ---------------------------------------------------------------------------
var COHORTS = [
  { what: "pregnant or breastfeeding travellers",
    re: [/pregnan/i, /breastfeed/i],
    why: "some vaccines need individual clinical review in pregnancy" },
  { what: "travellers with a medical condition or a weakened immune system",
    re: [/weakened immune system|immunosuppress|medical condition/i],
    why: "these change which vaccines are suitable" },
  { what: "travellers booking at short notice",
    re: [/short notice|travelling within the next|1 to 2 weeks/i],
    why: "a vaccine given too late may not protect them" },
  { what: "children and infants",
    re: [/\bchildren\b|\binfants?\b/i],
    why: "they may need a different pathway" }
];

pages.forEach(function (p) {
  var name = rel(p.file);
  var text = plain(p.raw);
  COHORTS.forEach(function (c) {
    var ok = c.re.every(function (r) { return r.test(text); });
    if (!ok) {
      fail("cohort", name + "|" + c.what, name + " does not name " + c.what +
        " anywhere in visible copy. The page must tell them to say so before " +
        "being vaccinated, because " + c.why + ".");
    }
  });
});

// ---------------------------------------------------------------------------
// RULE 10, the trust bar names this branch's own town.
// ---------------------------------------------------------------------------
pages.forEach(function (p) {
  var name = rel(p.file);
  var m = /Local\s+([^<]+?)\s+team/.exec(p.raw);
  if (!m) {
    fail("town", name + "|missing", name + ' has no "Local <town> team" line in its ' +
      "trust bar. It is the one line of body copy carrying a place name.");
    return;
  }
  if (norm(m[1]) !== p.b.seoTown) {
    fail("town", name + "|" + norm(m[1]), name + ' says "Local ' + norm(m[1]) +
      ' team" but this branch\'s seoTown is ' + p.b.seoTown + '. On a shared ' +
      "domain that is the sister branch's town on this branch's page.");
  }
});

// ---------------------------------------------------------------------------
// RULE 11, yellow fever is not an ordinary travel vaccine.
//
// Yellow fever vaccine may only be given, and the international certificate
// only issued, by a centre registered for it. Every travel clinic page
// advertises it in the vaccine grid. branches.json holds no field saying which
// branches are registered, so nothing in the estate can tell whether that line
// is true at a given shop, and no other checker would ever notice.
//
// This rule does not guess. It asks branches.json to say, and pins the silence
// against the question it is waiting on.
// ---------------------------------------------------------------------------
var YELLOW_FEVER = /yellow fever/i;
var declaringBranches = data.branches.filter(function (b) {
  return Object.prototype.hasOwnProperty.call(b, "yellowFeverCentre");
});
var advertising = pages.filter(function (p) { return YELLOW_FEVER.test(plain(p.raw)); });

if (advertising.length) {
  if (!declaringBranches.length) {
    fail("yellowfever", "no branch declares yellowFeverCentre",
      advertising.length + " travel clinic page(s) advertise yellow fever and no " +
      "branch in branches.json carries a yellowFeverCentre field, so nothing here " +
      "can tell whether the branch may give it or issue the certificate.");
  } else {
    advertising.forEach(function (p) {
      if (p.b.yellowFeverCentre !== true) {
        fail("yellowfever", rel(p.file), rel(p.file) + " advertises yellow fever but " +
          p.b.brandLabel + " " + p.b.seoTown + " does not have yellowFeverCentre set " +
          "to true in branches.json. Either the branch is registered and the data " +
          "should say so, or the vaccine grid on that page should not name it.");
      }
    });
  }
}

// ---------------------------------------------------------------------------
// A KNOWN entry that no longer breaks its rule is a lie about the estate.
// ---------------------------------------------------------------------------
Object.keys(KNOWN).forEach(function (key) {
  if (!knownUsed[key]) {
    failures.push("[known] stale KNOWN entry " + key + ": nothing breaks that rule " +
      "any more, so remove it from check-travel-clinic-copy.js.");
  }
});

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
console.log("check-travel-clinic-copy");
console.log("  " + pages.length + " travel clinic page(s) read against " + rel(GENERATOR));
console.log("  " + copyLines.length + " line(s) of service copy pinned, " +
  summaries.length + " FAQ pair(s), " + MEDICINE_NAMES.length + " medicine name(s) barred");
console.log("  " + advertising.length + " page(s) advertise yellow fever, " +
  declaringBranches.length + " branch(es) declare yellowFeverCentre");
if (leadValues.length === 1) {
  console.log("  book-ahead window: " + leadValues[0] + " weeks, the same on all " +
    pages.length + " page(s)");
}

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
