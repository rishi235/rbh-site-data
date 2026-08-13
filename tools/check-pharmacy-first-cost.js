/*
  tools/check-pharmacy-first-cost.js
  (added 2026-08-13 on the item 4.15 quality pass)

  Why this exists
  ---------------
  NHS Pharmacy First is free at the point of use. The consultation costs the
  patient nothing; if a medicine is supplied, the usual NHS prescription
  charge applies unless they are exempt. Those two sentences together are the
  whole cost claim, and the estate publishes them on 112 pages and in 14 GBP
  packs.

  Nothing read them. Every other rule this repo has on Pharmacy First copy
  guards WHO the service is for or WHERE an excluded patient should go:

    - tools/check-pharmacy-first-eligibility.js, the cohorts, since the
      sixty-third run.
    - tools/check-pharmacy-first-safety-net.js, the onward routes, since the
      item 3.11 quality pass.

  Neither reads a word about cost, and the frame around the cost claim does
  not either: the SEO checkers read titles and descriptions, check-seo-sheets
  reads a string composed twice, and none of them knows what the words mean.

  The repo already treats this exact claim as must-guard on ONE service.
  tools/check-contraception-copy.js rule 5 requires the no-charge answer on
  every NHS contraception page and fails a page that states a price, a fee or
  a currency amount. The NHS contraception service and NHS Pharmacy First are
  the same kind of thing, commissioned the same way and free the same way, and
  only one of them was guarded. Same asymmetry the safety-net checker was
  written to close, one service along.

  Proved by injection on 2026-08-13 against
  modules/service/pages/pharmacy-first-tiffenbergs-aintree.html: the hero pill
  changed from "Free NHS service at your local Aintree pharmacy" to "Low-cost
  NHS service at your local Aintree pharmacy" walked past all 31 checkers
  clean. That is a free NHS service advertised as a paid one, on the page a
  patient reads before deciding whether they can afford to be seen. The harm
  runs the way that is easy to miss: nobody complains about a page that
  wrongly implies a fee, they just do not come, and the pharmacy never learns
  why. The opposite direction is worse for the patient who does come. Dropping
  the prescription-charge caveat leaves the page promising something free and
  the counter asking for 9.90, which is the shape of complaint that reaches
  the GPhC.

  Nothing in the copy is wrong today. Every one of the 112 pages carries both
  halves of the claim, and every pack that advertises the service calls it
  free. This makes it a rule instead of a habit.

  What FAILS the run
  ------------------
    RULE 1, source: the generator still composes both halves of the claim.
      This is a floor on the parser, not a fingerprint on the copy: adding
      wording is fine, losing the ability to see it is not, because rules 2
      and 3 would then pass while reading a page whose copy had gone.

    RULE 2, the free claim: every Pharmacy First page states that the service
      is a free NHS one. A page that never says so is a page a patient reads
      assuming it is private.

    RULE 3, the caveat: every Pharmacy First page carries the NHS
      prescription-charge sentence. Overclaiming is its own defect, not the
      safe direction.

    RULE 4, no cost qualifier: no Pharmacy First page or pack describes the
      service as low-cost, affordable, cheap, discounted, great value, or
      anything else that prices a thing that is free. The bare word "charge"
      is NOT a trigger: the pages legitimately say "no charge to be seen" and
      "the usual NHS prescription charge applies", so only phrases that assert
      a charge on the consultation are read.

    RULE 5, no price: no Pharmacy First page or pack states a currency amount
      or a "prices from" line. A price on this copy means either the page has
      taken private-service copy, most likely from the weight loss or travel
      clinic generator, or the service has stopped being free. Both are worth
      stopping for.

    RULE 6, pack coverage: a pack whose branch runs Pharmacy First calls the
      service free somewhere. The packs are pasted into Google Business
      Profiles, which for most patients is the first and only page about the
      pharmacy they read, so the claim has to survive the trip out of the
      website. Packs that advertise no Pharmacy First at all, and TEMPLATE.md,
      make no claim and are not held to it, though both are still held to
      rules 4 and 5.

    RULE 7, branch landing pages: the six shared-domain landing pages in
      modules/branch/pages advertise Pharmacy First four times each and were
      outside rules 2 to 5 entirely, because those match on the
      pharmacy-first- filename in modules/service/pages. Added on the item 2.2
      quality pass, 2026-08-13, after a low-cost qualifier, a stated price and
      an "affordable" walked past all 32 checkers on a landing page. Held to
      the free claim and to rules 4 and 5, not to rule 3: see the long note
      above the rule for why the caveat stops at the service page.

  Run:  node tools/check-pharmacy-first-cost.js
  Exits 1 on any failure.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var GENERATOR = path.join(ROOT, "tools", "build-service-pages.js");
var PAGE_DIR = path.join(ROOT, "modules", "service", "pages");
var PACK_DIR = path.join(ROOT, "gbp-packs");
var LANDING_GENERATOR = path.join(ROOT, "tools", "build-branch-landing-pages.js");
var LANDING_DIR = path.join(ROOT, "modules", "branch", "pages");

// The seven NHS pathway keys, used to recognise a condition page by filename.
// Kept in step with the generator by the assertion under rule 1.
var CONDITION_KEYS = [
  "uti", "sore-throat", "sinusitis", "earache", "impetigo", "shingles",
  "insect-bite"
];

// The two halves of the cost claim, as they are written today.
var FREE_CLAIM = /\bfree\s+NHS\b/i;
var CHARGE_CAVEAT = /usual NHS prescription charge applies unless you are exempt/i;

// RULE 4. Phrases that put a price on the consultation. Deliberately phrases
// and not words: "charge", "fee", "pay" and "cost" all appear correctly on
// these pages, in "no charge to be seen", "the usual NHS prescription charge
// applies" and "costs you nothing", so a word-level list would fail the copy
// it exists to protect and get widened until it caught nothing.
var COST_QUALIFIERS = [
  /\blow[- ]cost\b/i,
  /\baffordable\b/i,
  /\bcheap(?:er|est)?\b/i,
  /\bdiscount(?:ed|s)?\b/i,
  /\bbudget[- ]friendly\b/i,
  /\bgreat value\b/i,
  /\bbest value\b/i,
  /\bvalue for money\b/i,
  /\bsmall fee\b/i,
  /\bconsultation fee\b/i,
  /\bthere is a charge\b/i,
  /\bwe charge\b/i,
  /\bis payable\b/i,
  /\bpay(?:ment)? (?:is )?(?:required|due)\b/i,
  /\bpaid service\b/i,
  /\bprivate consultation fee\b/i
];

// RULE 5. A currency amount, or a copy pattern that introduces one. The pound
// sign is written as an escape so this file stays pure ASCII, which
// tools/check-em-dashes.js enforces across the repo.
var PRICE_PATTERNS = [
  /[\u00A3$]\s?\d/,
  /\b\d+(?:\.\d{2})?\s?(?:pounds|GBP)\b/i,
  /\bprice[sd]?\s+from\b/i,
  /\bstarting from\s*[\u00A3$]?\d/i,
  /\bper month\s*[\u00A3$]\d/i
];

function rel(p) { return path.relative(ROOT, p).replace(/\\/g, "/"); }
function norm(s) { return (s || "").replace(/\s+/g, " ").trim(); }

var failures = [];
function fail(rule, message) { failures.push("[" + rule + "] " + message); }

// Visible page text only. A price or a qualifier hiding in a script block or a
// style block is not copy a patient reads, and the head comment on a generated
// page quotes the generator at itself.
function visibleText(html) {
  return norm(html
    .replace(/^<!--[\s\S]*?-->/, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " "));
}

// Sentence-bounded, so a report to the paster in one sentence cannot excuse a
// claim in the next. Split on a full stop followed by whitespace, which leaves
// URLs and times intact because neither carries a space after its dots.
function sentences(text) {
  return norm(text).split(/[.!?]\s+/).map(norm).filter(function (s) {
    return s.length > 0;
  });
}

// Every cost qualifier and every price found in a piece of text, reported with
// the sentence that carries it so a human can see the claim, not just the word.
function scan(label, text) {
  sentences(text).forEach(function (seg) {
    COST_QUALIFIERS.forEach(function (re) {
      var hit = seg.match(re);
      if (!hit) return;
      fail("qualifier", label + ': describes NHS Pharmacy First as "' +
        norm(hit[0]) + '", which prices a service that is free at the point ' +
        "of use (rule 4). A patient who reads this and cannot afford a fee " +
        "does not come, and never says why.\n         " + seg);
    });
    PRICE_PATTERNS.forEach(function (re) {
      var hit = seg.match(re);
      if (!hit) return;
      fail("price", label + ': states "' + norm(hit[0]) +
        '" on NHS Pharmacy First copy (rule 5). Either this page has taken ' +
        "private-service copy, most likely from the weight loss or travel " +
        "clinic generator, or the service has stopped being free. Both are " +
        "worth stopping for.\n         " + seg);
    });
  });
}

// ---------------------------------------------------------------------------
// RULE 1, on the generator: the claim is still composed where it is supposed
// to be composed, and the pathway list this file recognises pages by has not
// drifted from the generator's own.
// ---------------------------------------------------------------------------
if (!fs.existsSync(GENERATOR)) {
  console.log("check-pharmacy-first-cost");
  console.log("  FAIL generator not found: " + rel(GENERATOR));
  process.exit(1);
}
var genSrc = fs.readFileSync(GENERATOR, "utf8");
var genBody = genSrc.replace(/^[\s\S]*?\*\//, "");

if (!FREE_CLAIM.test(genBody)) {
  fail("source", rel(GENERATOR) + ": composes no free-NHS wording at all, so " +
    "rule 2 would be checking pages against copy the generator no longer " +
    "writes. Fix the extraction here rather than weakening rule 2.");
}
if (!CHARGE_CAVEAT.test(genBody)) {
  fail("source", rel(GENERATOR) + ": no longer carries the NHS " +
    "prescription-charge sentence, which is the half of the cost claim that " +
    "stops the pages overclaiming. If the wording has been rewritten, update " +
    "CHARGE_CAVEAT here to the new sentence; do not drop the rule.");
}

// Same floor on the landing generator, which composes the Pharmacy First cost
// claim a second time and independently (a service tile, a hero bullet, the
// hero paragraph and an FAQ answer). Rule 7 reads its output, so if this
// generator stops writing a free claim, rule 7 must fail loudly rather than
// pass while reading pages whose claim has gone.
if (!fs.existsSync(LANDING_GENERATOR)) {
  fail("source", rel(LANDING_GENERATOR) + " not found, so the branch landing " +
    "pages have either moved or stopped being generated, and rule 7 is " +
    "checking whatever happens to be left in " + rel(LANDING_DIR) + ".");
} else if (!FREE_CLAIM.test(fs.readFileSync(LANDING_GENERATOR, "utf8").replace(/^[\s\S]*?\*\//, ""))) {
  fail("source", rel(LANDING_GENERATOR) + ": composes no free-NHS wording at " +
    "all, so the branch landing pages no longer tell a patient that Pharmacy " +
    "First costs nothing to be seen. Fix the generator, or if the wording has " +
    "been rewritten update FREE_CLAIM here; do not drop rule 7.");
}

CONDITION_KEYS.forEach(function (k) {
  var re = new RegExp('^ {2}"?' + k + '"?:\\s*\\{', "m");
  if (!re.test(genSrc)) {
    fail("source", "this checker recognises condition pages for \"" + k +
      "\", which is no longer a condition in " + rel(GENERATOR) +
      ". The two lists have drifted, so some pages are being checked against " +
      "nothing.");
  }
});

// ---------------------------------------------------------------------------
// RULES 2 to 5, on the generated pages.
// ---------------------------------------------------------------------------
function isPharmacyFirstPage(file) {
  if (!/\.html$/.test(file)) return false;
  if (file.indexOf("pharmacy-first-") === 0) return true;
  return CONDITION_KEYS.some(function (k) {
    return file.indexOf(k + "-treatment-") === 0;
  });
}

var pages = [];
if (fs.existsSync(PAGE_DIR)) {
  fs.readdirSync(PAGE_DIR).forEach(function (f) {
    if (isPharmacyFirstPage(f)) pages.push(path.join(PAGE_DIR, f));
  });
}

// A silent zero is how a rule stops running without anybody noticing. The
// estate has 14 trading branches with Pharmacy First and each carries an
// overview page plus seven condition pages, so the floor is set well below
// that rather than at it, to survive a branch disposal without a false alarm.
if (pages.length < 40) {
  fail("coverage", "found only " + pages.length + " Pharmacy First page(s) in " +
    rel(PAGE_DIR) + ". Either the pages have moved or the filename pattern " +
    "this checker matches on has changed, and rules 2 to 5 are running on " +
    "almost nothing.");
}

pages.forEach(function (file) {
  var name = rel(file);
  var text = visibleText(fs.readFileSync(file, "utf8"));

  if (!FREE_CLAIM.test(text)) {
    fail("free", name + ": never says the Pharmacy First service is a free " +
      "NHS one (rule 2). Every other page in the estate does, so a reader " +
      "who lands on this one has no reason not to assume it is private.");
  }
  if (!CHARGE_CAVEAT.test(text)) {
    fail("caveat", name + ": carries no NHS prescription-charge sentence " +
      "(rule 3). The consultation is free and a supplied medicine is not, so " +
      "without this line the page promises something free and the counter " +
      "asks for a prescription charge the patient was never told about.");
  }

  scan(name, text);
});

// ---------------------------------------------------------------------------
// RULES 4 to 6, on the GBP packs.
// ---------------------------------------------------------------------------
// A pack is scanned in full for rules 4 and 5, TEMPLATE.md included, because a
// qualifier written into the template propagates into every pack drafted after
// it. Rule 6, the positive claim, is asked only of a pack whose branch
// actually runs Pharmacy First.
var packs = [];
if (fs.existsSync(PACK_DIR)) {
  fs.readdirSync(PACK_DIR).forEach(function (f) {
    if (/\.md$/.test(f)) packs.push(path.join(PACK_DIR, f));
  });
}

var packBranches = [];
try {
  packBranches = require(path.join(ROOT, "branches.json")).branches || [];
} catch (e) {
  fail("coverage", "could not read branches.json, so no pack could be matched " +
    "to a branch and rule 6 ran on nothing.");
}

// Only the Pharmacy First half of a pack is held to rules 4 and 5. The same
// file advertises a private weight loss clinic and a private travel clinic,
// and those are allowed to be paid services; failing them here would be
// wrong, and widening the patterns to avoid it would gut the rule. A sentence
// counts as Pharmacy First copy when it names the service or names two or more
// of the seven pathways, which is the same test rule 10 of
// check-pharmacy-first-eligibility.js uses to decide a sentence is enumerating.
var PACK_CONDITION_WORDS = [
  /\b(?:UTIs?|urinary tract infections?|water infections?)\b/i,
  /\bsore throats?\b/i,
  /\bsinusitis\b/i,
  /\bearaches?\b/i,
  /\bimpetigo\b/i,
  /\bshingles\b/i,
  /\binsect bites?\b/i
];

function namesPharmacyFirst(seg) {
  if (/pharmacy first/i.test(seg)) return true;
  var named = PACK_CONDITION_WORDS.filter(function (re) { return re.test(seg); });
  return named.length >= 2;
}

// A pack is scoped by BLOCK and not by sentence. The first negative test for
// this rule proved why: "Consultations from 25 pounds." inserted into Post A,
// the Pharmacy First post, walked past a sentence-scoped version, because that
// sentence names neither the service nor a condition. A price does not have to
// name the thing it is pricing to price it. Blocks are the pack's own headings,
// which is how the packs are written and how a paster reads them.
function packBlocks(raw) {
  var out = [];
  var current = [];
  raw.split(/\r?\n/).forEach(function (line) {
    // A markdown heading starts a block, and so does an unindented label line
    // ending in a colon. The packs use both: "### Post D - Travel clinic" is a
    // heading, "Notes for the paster:" and "Private services:" are labels with
    // no heading, and without the second form the paster notes at the foot of
    // a pack fold into the last post above them. That is not theoretical: the
    // notes name Pharmacy First, so a heading-only split pulled the whole of
    // the private travel clinic post into Pharmacy First scope and failed
    // "Affordable and convenient appointments", which is correct copy for a
    // paid service.
    if (/^#{1,4}\s/.test(line) || /^[^\s#>-][^\n]{0,60}:\s*$/.test(line)) {
      if (current.length) out.push(current.join("\n"));
      current = [line];
    } else {
      current.push(line);
    }
  });
  if (current.length) out.push(current.join("\n"));
  return out;
}

// Inside a Pharmacy First block, a sentence that is plainly about a PRIVATE
// service and does not name Pharmacy First is left alone. The business
// description is one block naming both, and a private clinic is allowed to
// carry a price. Post A, which is the block that matters most here, names no
// private service anywhere, so nothing in it is excused by this.
var PRIVATE_SERVICE = /\bweight loss\b|\btravel (?:clinic|health|consultation)\b|\bprivate (?:clinic|service|consultation|paid)\b|\bvaccination|\bmalaria\b/i;

packs.forEach(function (file) {
  var name = rel(file);
  var raw = fs.readFileSync(file, "utf8");

  var pfSentences = [];
  var pfClaimSentences = [];
  packBlocks(raw).forEach(function (block) {
    if (!namesPharmacyFirst(block)) return;
    sentences(block).forEach(function (seg) {
      if (PRIVATE_SERVICE.test(seg) && !/pharmacy first/i.test(seg)) return;
      pfSentences.push(seg);
      // Rule 6 is asked of the sentences that name Pharmacy First itself, not
      // of everything in a block that happens to mention it. The second
      // negative test proved the difference: with the free claim stripped from
      // all three Pharmacy First sentences, the pack still passed on "a free
      // NHS blood pressure check" two sentences away. A free claim about a
      // different NHS service is not a free claim about this one.
      if (namesPharmacyFirst(seg)) pfClaimSentences.push(seg);
    });
  });
  var pfText = pfSentences.join(". ");
  var pfClaimText = pfClaimSentences.join(". ");

  if (pfText) scan(name, pfText);

  if (path.basename(file) === "TEMPLATE.md") return;

  var stem = path.basename(file).replace(/\.md$/, "");
  var b = packBranches.filter(function (x) {
    return (x.brandSlug + "-" + x.townSlug) === stem;
  })[0];
  if (!b) return;

  var runsPf = !!b.pfLink || !!((b.widgets || {}).pharmacyFirst);
  if (!runsPf) return;

  if (!FREE_CLAIM.test(pfClaimText)) {
    fail("free", name + ": advertises NHS Pharmacy First but never calls it " +
      "free (rule 6). This pack is pasted into a Google Business Profile, " +
      "which for most patients is the first and only page about the pharmacy " +
      "they read, so the claim has to survive the trip off the website.");
  }
});

// ---------------------------------------------------------------------------
// RULE 7, on the branch landing pages.
// ---------------------------------------------------------------------------
// The shared-domain split (item 2.2, extended to all three shared domains by
// item 5.2) builds one landing page per branch into modules/branch/pages. All
// six advertise NHS Pharmacy First and all six price it, four times over: a
// service tile ("Free NHS treatment for seven common conditions"), a hero
// bullet ("Free NHS Pharmacy First consultations"), the hero paragraph ("the
// free NHS Pharmacy First service") and an FAQ answer ("Pharmacy First is a
// free NHS service"). Nothing read a word of it. Rules 2 to 5 stop at
// modules/service/pages and match on the pharmacy-first- filename, so every
// landing page falls outside all four.
//
// Proved by injection on 2026-08-13 against
// modules/branch/pages/pharmacy-fishlocks-ainsdale.html. Each of these walked
// past all 32 checkers clean, one at a time:
//   - the tile blurb changed from "Free NHS treatment" to "Low-cost NHS
//     treatment"
//   - the hero bullet changed to "Pharmacy First consultations from 25 pounds"
//   - the FAQ answer changed from "a free NHS service" to "an affordable NHS
//     service"
// A control that changed one digit of the phone number was caught by
// check-nap and check-jsonld, so these pages are read, just never for what
// they say the service costs. The exposure is the larger half of the estate's
// Pharmacy First advertising by audience: a landing page is the page a
// patient reaches from a Google Business Profile, and the six packs in
// gbp-packs/ each point a profile at one of these six URLs.
//
// A landing page is NOT held to rule 3, the prescription-charge caveat. It is
// a signpost, and its tile links to that branch's own Pharmacy First page,
// which carries the caveat and is held to it. Requiring the full sentence on
// a one-line tile would be a copy decision rather than a check. The wording
// that prompted the thought, "Free NHS treatment", is asked as a question
// instead of being enforced or quietly rewritten here.
//
// Scope is the Pharmacy First copy only, sentence by sentence, using the same
// namesPharmacyFirst test the packs use. The same page advertises a private
// weight loss clinic and a private travel clinic, and those are allowed to
// carry a price, so a whole-page scan would fail correct copy and then get
// widened until it caught nothing.
var landings = [];
if (fs.existsSync(LANDING_DIR)) {
  fs.readdirSync(LANDING_DIR).forEach(function (f) {
    if (/\.html$/.test(f)) landings.push(path.join(LANDING_DIR, f));
  });
}

// A silent zero again. Three shared domains carry two live branches each, so
// six pages are expected; the floor sits at four so that disposing of one
// branch of a pair does not raise a false alarm, while the folder emptying or
// being renamed still does.
if (landings.length < 4) {
  fail("coverage", "found only " + landings.length + " branch landing page(s) " +
    "in " + rel(LANDING_DIR) + ". Either the pages have moved or the folder " +
    "has changed, and rule 7 is running on almost nothing.");
}

var landingsWithPf = 0;
landings.forEach(function (file) {
  var name = rel(file);
  var text = visibleText(fs.readFileSync(file, "utf8"));

  var pfSentences = sentences(text).filter(function (seg) {
    return namesPharmacyFirst(seg);
  });
  if (!pfSentences.length) return;
  landingsWithPf++;

  var pfText = pfSentences.join(". ");
  scan(name, pfText);

  if (!FREE_CLAIM.test(pfText)) {
    fail("free", name + ": advertises NHS Pharmacy First but nowhere on the " +
      "page calls it free (rule 7). This is the page a Google Business " +
      "Profile sends a patient to, so it is often the first thing they read " +
      "about the service, and a patient who assumes it is private does not " +
      "book and never says why.");
  }
});

// The two paste sheets beside the pages carry the SEO description that goes
// into the Weebly page settings, which is the line Google shows under the
// result. A qualifier or a price there is read by more people than the page
// itself, so the description lines are held to rules 4 and 5. Only those
// lines: the rest of INDEX.md is notes to the paster about live state and
// paste order, and holding prose written for Rishi and Dane to patient-copy
// rules would fail the wrong thing.
["INDEX.md", "SEO.md"].forEach(function (f) {
  var file = path.join(LANDING_DIR, f);
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, "utf8").split(/\r?\n/).forEach(function (line) {
    var m = line.match(/^- \*\*(?:SEO description|Page Description):\*\*\s*(.+)$/);
    if (!m) return;
    if (!namesPharmacyFirst(m[1])) return;
    scan(rel(file), m[1]);
  });
});

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
console.log("check-pharmacy-first-cost");
console.log("  " + pages.length + " Pharmacy First page(s) checked for the free " +
  "claim, the prescription-charge caveat, cost qualifiers and prices");
console.log("  " + packs.length + " GBP pack(s) checked for cost qualifiers, " +
  "prices and the free claim");
console.log("  " + landings.length + " branch landing page(s) checked, " +
  landingsWithPf + " of them advertising Pharmacy First and held to the free " +
  "claim, cost qualifiers and prices");

if (failures.length) {
  console.log("");
  failures.forEach(function (f) { console.log("  FAIL " + f); });
  console.log("\ncheck-pharmacy-first-cost: " + failures.length + " failure(s).");
  process.exit(1);
}
console.log("");
console.log("check-pharmacy-first-cost: clean, every page and pack states the " +
  "free NHS claim, keeps the prescription-charge caveat, and prices nothing.");
process.exit(0);
