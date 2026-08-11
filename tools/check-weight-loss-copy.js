/*
  tools/check-weight-loss-copy.js - private Weight Loss Clinic copy verifier.

  Why this exists
  ---------------
  Fifteen live pages sell a paid clinical service that ends, for some
  visitors, in a prescription-only medicine. They tell a patient what the
  consultation is, what it costs, who the service may suit, who it is not for,
  which conditions stop it, what happens if they feel unwell, and how certain
  they can be of being treated at all. Every word of that is composed in
  tools/build-weight-loss-pages.js, and until this checker nothing in the repo
  read any of it.

  The weight loss pages were not unchecked by oversight. They are covered the
  same ways every generated page is: check-page-coverage earns the page,
  check-seo-pattern holds the title and H1, check-seo-sheets, check-seo-lengths
  and check-seo-keywords hold the four Weebly fields, check-nap and
  check-jsonld hold the address block, check-map-embeds holds the map,
  check-booking-routes and check-widget-diaries hold the diary the booking
  lands in, check-branch-links holds the review link, check-branch-identity
  holds data-branch, check-cdn-pins holds the pinned assets, check-em-dashes
  holds the characters, check-service-links holds the link targets and the
  efficacy wording. Every one of those reads the frame. None reads the service
  description inside it.

  That is now the fifth and last generator to be closed the same way. The
  sixty-third run closed Pharmacy First eligibility, the sixty-eighth
  contraception, the sixty-ninth the travel clinic, the seventieth the switch
  pages. Four times the finding was the same: the copy was correct and simply
  had no rule behind it.

  Why this one matters most
  -------------------------
  It is the only page family in the estate with a live regulatory question
  already open against it. compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md
  records what the OLD live-only weight loss pages say and measures it against
  the house reference, AI\RBH_WeightLoss_Advertising_Standards.md. It found
  breaches on those pages of exactly the kind this generator was written to
  avoid: a results heading, a superlative claim about a named medicine, a
  slider promising a percentage of body weight, and a lead price above the
  fold. Item 5.8 and Q22 are still open on that. The generated replacement
  pages are the compliant version, and until this run the only thing keeping
  them compliant was that nobody had edited them.

  This checker does not restate the regulator's position, which is more
  nuanced than a word list: on an inner page the consumer chooses to visit,
  balanced non-promotional information naming a medicine can be permitted.
  What it enforces is the position THIS GENERATOR declares in its own header
  and repeats in the paste comment at the top of every page it writes:

      no brand-name medicine is named anywhere (POM advertising rules).
      Eligibility is framed as a clinical assessment, never a guarantee.
      Superintendent pharmacist signs off wording before publish.

  A page that ships that promise in its own comment and then breaks it is
  worse than one that never made it. So RULE 10 checks the promise is still on
  the page, and the rest of the rules check the page keeps it.

  What FAILS the run
  ------------------
    RULE 1  coverage: the 15 pages the generator's BUILD list declares, no
            more and no fewer, and every weight-loss-clinic-*.html on disk
            accounted for.
    RULE 2  pinned copy: the service description sentences that are the same
            on every page are still on every page.
    RULE 3  the seven FAQ pairs, and the answer to "will I definitely be
            prescribed" still begins No.
    RULE 4  private and paid: the page says it is private, paid and not NHS
            funded, and makes no free offer.
    RULE 5  eligibility integrity: 18 and over, the under-18 exclusion,
            pregnancy and breastfeeding, the four screened conditions, the
            interaction warning, and the safety net to GP, NHS 111 and 999.
            No numeric BMI threshold, because a number lets a visitor
            self-qualify and the generator frames BMI as a range a clinician
            confirms.
    RULE 6  no guarantee: the four sentences that say treatment, outcome and
            eligibility are not promised.
    RULE 7  price discipline: one fee string, identical across all 15 pages,
            "from"-qualified, in the three places the generator writes it, with
            the separate-medication-cost answer and the indicative-price
            disclaimer beside it, and no offer, discount or price-led wording.
    RULE 8  no medicine named, from tools/pom-names.js.
    RULE 9  no efficacy or results claim, from tools/claim-patterns.js.
    RULE 10 the governance promise is still in the page's own paste comment.

  What is only REPORTED, not failed
  ---------------------------------
    breaches listed in KNOWN below, each with a reason and a question id, the
    same convention as KNOWN_DRIFT in check-cdn-pins.js. A KNOWN entry that no
    longer triggers FAILS the run, so the list cannot rot once a question is
    answered and the fix lands.

  Run:  node tools/check-weight-loss-copy.js
*/
const fs = require("fs");
const path = require("path");
const pom = require("./pom-names.js");
const claims = require("./claim-patterns.js");

const REPO = path.join(__dirname, "..");
const PAGE_DIR = path.join(REPO, "modules", "service", "pages");
const GENERATOR = path.join(REPO, "tools", "build-weight-loss-pages.js");
const BRANCHES = path.join(REPO, "branches.json");

// Accepted breaches. Key is "<rule>::<relative file>::<detail>".
const KNOWN = {};

const failures = [];
const knownUsed = {};

function rel(p) { return path.relative(REPO, p).replace(/\\/g, "/"); }

function fail(rule, key, message) {
  const k = rule + "::" + key;
  if (Object.prototype.hasOwnProperty.call(KNOWN, k)) {
    knownUsed[k] = KNOWN[k];
    return;
  }
  failures.push(message);
}

// --- reading -----------------------------------------------------------------

// The head comment carries the governance promise, so it is read on its own
// (RULE 10) and blanked out of the visible text, so a build note discussing a
// rule is never read as a breach of it.
function headComment(raw) {
  const m = raw.match(/<!--[\s\S]*?-->/);
  return m ? collapse(m[0].replace(/<!--|-->/g, " ")) : "";
}

function blankComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, " ");
}

function collapse(s) {
  return String(s == null ? "" : s).replace(/\s+/g, " ").trim();
}

// Visible copy: comments and scripts out, tags out, the handful of entities
// this generator actually emits decoded, whitespace collapsed. The JSON-LD
// block is a <script>, so it goes with the scripts: it is checked by
// check-jsonld.js and is not copy a patient reads.
function visible(raw) {
  let t = blankComments(raw);
  t = t.replace(/<script[\s\S]*?<\/script>/gi, " ");
  t = t.replace(/<style[\s\S]*?<\/style>/gi, " ");
  t = t.replace(/<[^>]+>/g, " ");
  t = t.replace(/&nbsp;/g, " ")
       .replace(/&middot;/g, " ")
       .replace(/&pound;/g, "£")
       .replace(/&amp;/g, "&")
       .replace(/&lt;/g, "<")
       .replace(/&gt;/g, ">")
       .replace(/&quot;/g, '"')
       .replace(/&#39;/g, "'");
  return collapse(t);
}

const genSrc = fs.readFileSync(GENERATOR, "utf8");
const data = JSON.parse(fs.readFileSync(BRANCHES, "utf8"));
const byId = {};
data.branches.forEach(function (b) { byId[b.id] = b; });

// RULE 1 reads the BUILD list out of the generator rather than mirroring it
// here, for the reason recorded against check-seo-pattern on the item 3.1
// pass: a hand-copied mirror of a generator's own list stops being a test the
// moment the generator changes.
const buildBlock = genSrc.match(/const\s+BUILD\s*=\s*\[([\s\S]*?)\]\s*;/);
if (!buildBlock) {
  console.log("check-weight-loss-copy");
  console.log("FAIL - cannot find the BUILD list in " + rel(GENERATOR) +
    ". This checker reads the page list from the generator; if the generator " +
    "no longer declares one, the two have to be reconciled by hand.");
  process.exit(1);
}
const BUILD = (buildBlock[1].match(/"([^"]+)"/g) || []).map(function (s) {
  return s.replace(/"/g, "");
});

// The fee is declared once in the generator. Read it from there too, so the
// price rule tests the pages against the source of the number rather than
// against a second copy of it typed in here.
const feeDecl = genSrc.match(/const\s+CONSULT_FEE\s*=\s*"([^"]+)"/);
const CONSULT_FEE = feeDecl ? feeDecl[1] : null;
if (!CONSULT_FEE) {
  console.log("check-weight-loss-copy");
  console.log("FAIL - cannot find CONSULT_FEE in " + rel(GENERATOR) + ".");
  process.exit(1);
}

// Expected filename for each branch in BUILD.
const expected = {};
BUILD.forEach(function (id) {
  const b = byId[id];
  if (!b) {
    fail("coverage", "unknown-branch::" + id,
      rel(GENERATOR) + ' BUILD names branch id "' + id + '", which is not in branches.json.');
    return;
  }
  if (b.disposed) {
    fail("coverage", "disposed::" + id,
      rel(GENERATOR) + ' BUILD still names "' + id + '", which is marked disposed in ' +
      "branches.json. A disposed branch must not have live pages.");
    return;
  }
  expected["weight-loss-clinic-" + b.brandSlug + "-" + b.townSlug + ".html"] = b;
});

const onDisk = fs.readdirSync(PAGE_DIR).filter(function (f) {
  return /^weight-loss-clinic-.*\.html$/.test(f);
});

Object.keys(expected).forEach(function (f) {
  if (onDisk.indexOf(f) === -1) {
    fail("coverage", "missing::" + f,
      "modules/service/pages/" + f + " is declared by the generator's BUILD list " +
      "and is not on disk. Re-run node tools/build-weight-loss-pages.js.");
  }
});
onDisk.forEach(function (f) {
  if (!Object.prototype.hasOwnProperty.call(expected, f)) {
    fail("coverage", "orphan::" + f,
      "modules/service/pages/" + f + " is a weight loss page no branch in the " +
      "generator's BUILD list accounts for. Either the branch left BUILD and the " +
      "page was not deleted, or the file is hand-made.");
  }
});

const pages = onDisk.filter(function (f) {
  return Object.prototype.hasOwnProperty.call(expected, f);
}).map(function (f) {
  const file = path.join(PAGE_DIR, f);
  const raw = fs.readFileSync(file, "utf8");
  return {
    name: f,
    file: file,
    branch: expected[f],
    raw: raw,
    head: headComment(raw),
    text: visible(raw)
  };
});

// ---------------------------------------------------------------------------
// RULE 2, pinned copy.
//
// Every sentence below is the same on all 15 pages: it carries no branch name,
// no town and no phone number, so it is the generator's own voice rather than
// data. That makes it exactly the copy a plausible-looking edit trims without
// anyone noticing, and exactly the copy nothing read before this checker.
// ---------------------------------------------------------------------------
const COPY = [
  "Private Weight Loss Clinic",
  "Medically-supported weight loss, assessed and supervised by a pharmacist.",
  "A qualified pharmacist or clinician will review your health history and, where it is clinically appropriate, prescription-only weight-loss medication can be supplied as part of a supervised plan alongside diet and lifestyle changes.",
  "This is a paid private service, not an NHS treatment, and it is not right for everyone.",
  "Private, paid consultation with a qualified pharmacist or clinician",
  "A full health and eligibility check before anything is prescribed",
  "Prescription-only weight-loss medication supplied only where clinically appropriate",
  "Ongoing monitoring and follow-up built into your plan",
  "Paid consultation, not funded by the NHS",
  "Full clinical assessment before any prescription",
  "Follow-up reviews built into your plan",
  "Is this service right for you?",
  "This is a clinical service. A pharmacist or clinician will assess your suitability at consultation.",
  "Who this service may suit",
  "When this service is not right for you",
  "Ready to combine any treatment with diet and lifestyle changes, not use it as a stand-alone fix",
  "No known medical reason that would make prescription-only weight-loss medication unsuitable, confirmed at your assessment",
  "How the Weight Loss Clinic works",
  "Full clinical assessment",
  "Your ongoing plan",
  "We will only use your details to arrange your consultation."
];

pages.forEach(function (p) {
  COPY.forEach(function (line) {
    if (p.text.indexOf(line) === -1) {
      fail("copy", p.name + "::" + line.slice(0, 40),
        rel(p.file) + ' is missing pinned service copy: "' + line + '". This ' +
        "sentence is the same on all 15 pages and is composed in " +
        rel(GENERATOR) + ". If it changed there, it changed on 15 live pages.");
    }
  });
});

// ---------------------------------------------------------------------------
// RULE 3, the FAQ pairs.
//
// Seven questions, and for each the part of the answer that carries the
// promise rather than the wording around it. The first entry is the one that
// matters most: the page is allowed to sell a consultation, not a
// prescription, and the answer to "will I definitely be prescribed" is the
// sentence that keeps those two apart.
// ---------------------------------------------------------------------------
const FAQ = [
  ["Will I definitely be prescribed weight-loss medication?",
    "No. This is a clinical assessment, not an automatic prescription."],
  ["Is this an NHS service?",
    "No. The Weight Loss Clinic is a private service."],
  ["What does it cost?",
    "If medication is prescribed, its cost is separate and will be explained clearly before you agree to anything"],
  ["Which medication will I be offered?",
    "We cannot guarantee that any particular product will be available or right for you"],
  ["Is it safe?",
    "there can be side effects, and it is not suitable for everyone"],
  ["Do I need a GP referral?",
    "This service does not replace your GP"],
  ["Do I need an appointment?",
    "this service is by appointment"]
];

pages.forEach(function (p) {
  FAQ.forEach(function (pair) {
    if (p.text.indexOf(pair[0]) === -1) {
      fail("faq", p.name + "::q::" + pair[0].slice(0, 40),
        rel(p.file) + ' has lost the FAQ question "' + pair[0] + '".');
      return;
    }
    if (p.text.indexOf(pair[1]) === -1) {
      fail("faq", p.name + "::a::" + pair[0].slice(0, 40),
        rel(p.file) + ' answers "' + pair[0] + '" without the part that carries ' +
        'the promise: "' + pair[1] + '".');
    }
  });
});

// ---------------------------------------------------------------------------
// RULE 4, private, paid, and not NHS funded.
//
// This is the single most important thing the page says about itself, and it
// is said four times deliberately: in the pill, in the hero paragraph, in the
// trust bar and in the first FAQ. A patient who reads it as an NHS service has
// been misled about what they are about to pay for, and an NHS claim on a
// private service is a different and worse problem than a marketing one.
//
// The free rule is the reverse of the same thing, and the repo has been here:
// the item 4.1 pass swept "free assessment" wording out of two GBP packs.
// ---------------------------------------------------------------------------
const PRIVATE_MARKS = [
  "Private service",
  "not funded by the NHS",
  "This is a paid private service, not an NHS treatment",
  "No. The Weight Loss Clinic is a private service."
];
const FREE_OFFERS = [
  /\bfree consultation\b/i,
  /\bfree assessment\b/i,
  /\bfree treatment\b/i,
  /\bfree of charge\b/i,
  /\bno charge\b/i,
  /\bfor free\b/i
];

pages.forEach(function (p) {
  PRIVATE_MARKS.forEach(function (m) {
    if (p.text.indexOf(m) === -1) {
      fail("private", p.name + "::" + m.slice(0, 40),
        rel(p.file) + ' no longer states "' + m + '". The Weight Loss Clinic is a ' +
        "paid private service and every page has to say so plainly.");
    }
  });
  if (p.text.indexOf("this is not free or NHS-funded") === -1) {
    fail("private", p.name + "::not-free",
      rel(p.file) + ' has lost the sentence that says consultations and medication ' +
      'are "paid for privately; this is not free or NHS-funded".');
  }
  FREE_OFFERS.forEach(function (re) {
    const m = p.text.match(re);
    if (m) {
      fail("private", p.name + "::free::" + m[0].toLowerCase(),
        rel(p.file) + ' offers something "' + m[0] + '" on a paid private service ' +
        "page. Free offers on a page that leads to a prescription-only medicine are " +
        "a ruled breach in the house reference; see compliance/" +
        "WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md.");
    }
  });
});

// ---------------------------------------------------------------------------
// RULE 5, eligibility integrity.
//
// The counterpart of check-pharmacy-first-eligibility (NHS cohorts) and of
// RULE 9 in check-travel-clinic-copy (who must speak up). Trimming any of
// these boxes stops the page telling a pregnant reader, a reader under 18, or
// a reader with pancreatitis or an eating disorder that this service is not
// for them, on the one page in the estate where the answer can end in a
// prescription-only medicine.
//
// The last rule is the one a tidy-up would introduce rather than remove. The
// generator frames BMI as "a range for your height, your clinician will
// confirm", never a number. A number turns an eligibility criterion into a
// self-qualification test the visitor applies before they ever speak to
// anyone, which is the opposite of the framing the page's own governance
// comment promises.
// ---------------------------------------------------------------------------
const COHORTS = [
  { what: "adults 18 and over", res: [/Adults aged 18 and over/i] },
  { what: "the under-18 exclusion", res: [/Under 18s are not seen under this service/i] },
  { what: "pregnancy, breastfeeding and trying to conceive",
    res: [/pregnant/i, /breastfeeding/i, /trying to become pregnant/i, /speak to your GP or midwife/i] },
  { what: "the four screened conditions",
    res: [/thyroid cancer/i, /pancreatitis/i, /gastrointestinal disease/i, /eating disorder/i] },
  { what: "the interaction warning",
    res: [/already taking other weight-loss or diabetes medication/i] },
  { what: "the safety net", res: [/GP or NHS 111/i, /999 in an emergency/i] }
];

pages.forEach(function (p) {
  COHORTS.forEach(function (c) {
    c.res.forEach(function (re) {
      if (!re.test(p.text)) {
        fail("eligibility", p.name + "::" + c.what + "::" + String(re),
          rel(p.file) + " no longer covers " + c.what + " (" + String(re) + " does " +
          "not match). This is a screening statement on a page that can end in a " +
          "prescription-only medicine.");
      }
    });
  });

  if (!/Typically a BMI in the overweight or obese range for your height/i.test(p.text)) {
    fail("eligibility", p.name + "::bmi-framing",
      rel(p.file) + " has lost the BMI framing sentence. The generator states BMI as " +
      "a range a clinician confirms, never a number.");
  }
  const bmiNumber = p.text.match(/BMI[^.]{0,60}?\b\d{2}(\.\d)?\b/i);
  if (bmiNumber) {
    fail("eligibility", p.name + "::bmi-number",
      rel(p.file) + ' states a numeric BMI threshold: "' + collapse(bmiNumber[0]) +
      '". A number lets a visitor decide their own eligibility before any ' +
      "assessment, which is the framing " + rel(GENERATOR) + " exists to avoid.");
  }
});

// ---------------------------------------------------------------------------
// RULE 6, nothing is guaranteed.
//
// Four sentences, in four different places on the page, all saying the same
// thing: treatment is not promised, a particular medicine is not promised, and
// an outcome is not promised. The house reference treats a promise of outcome
// as the trigger for enforcement on an inner page, and the old live pages
// broke exactly this: a results heading, a superlative, and a slider returning
// a personalised figure. See compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md.
// ---------------------------------------------------------------------------
const NO_GUARANTEE = [
  "Nothing below is a guarantee of treatment, a specific medicine, or a specific outcome. Individual results vary.",
  "This is a professional judgement, not a guarantee.",
  "This page is general information, not medical advice, and does not guarantee eligibility, treatment or results.",
  "Individual results vary depending on factors including starting weight, diet and lifestyle."
];

pages.forEach(function (p) {
  NO_GUARANTEE.forEach(function (s) {
    if (p.text.indexOf(s) === -1) {
      fail("guarantee", p.name + "::" + s.slice(0, 40),
        rel(p.file) + ' has lost a no-guarantee statement: "' + s + '".');
    }
  });
});

// ---------------------------------------------------------------------------
// RULE 7, price discipline.
//
// The fee is the one number on these pages, it is declared once in the
// generator as CONSULT_FEE, and it is RBH's own publicly quoted starting
// price rather than an invented figure. Three things can go wrong with it and
// nothing read any of them: it can drift between branches, it can lose the
// "from" that makes it a starting price rather than the price, and it can
// acquire the offer wording the house reference names as a ruled breach
// ("POM only special offers or discounted prices", "treatments start from").
//
// The fourth is the one that would be worst and is the easiest to write by
// accident: a price against the MEDICINE rather than the consultation. The
// page's own FAQ keeps those apart deliberately.
// ---------------------------------------------------------------------------
const FEE_RE = /from £\d+(?:\.\d{2})?/g;
const PRICE_LED = [
  /\bspecial offer\b/i, /\bdiscount(?:ed)?\b/i, /\bsale\b/i, /\bsave £/i,
  /\bcheapest\b/i, /\blowest price\b/i, /\bbest price\b/i, /\bprice match\b/i,
  /\btreatments start from\b/i, /\bfrom only\b/i
];

const feeSeen = {};
pages.forEach(function (p) {
  const hits = p.text.match(FEE_RE) || [];
  hits.forEach(function (h) { (feeSeen[h] = feeSeen[h] || []).push(p.name); });

  if (hits.length !== 3) {
    fail("price", p.name + "::count",
      rel(p.file) + " states the consultation fee " + hits.length + " time(s). The " +
      "generator writes it in exactly three places: the booking card, step 1 of " +
      "how it works, and the cost FAQ.");
  }
  if (p.text.indexOf(CONSULT_FEE) === -1) {
    fail("price", p.name + "::fee",
      rel(p.file) + ' does not carry the fee declared in ' + rel(GENERATOR) +
      ' (CONSULT_FEE = "' + CONSULT_FEE + '").');
  }
  if (p.text.indexOf("Prices shown are indicative and may change; your clinician will confirm current pricing at consultation.") === -1) {
    fail("price", p.name + "::indicative",
      rel(p.file) + " states a price without the indicative-pricing sentence beside it.");
  }
  PRICE_LED.forEach(function (re) {
    const m = p.text.match(re);
    if (m) {
      fail("price", p.name + "::price-led::" + m[0].toLowerCase(),
        rel(p.file) + ' uses price-led wording: "' + m[0] + '". On a page that can ' +
        "end in a prescription-only medicine the house reference permits a factual " +
        "price and bars offers, discounts and encouragement to choose on price.");
    }
  });

  // A price sitting next to the medicine rather than the consultation.
  const nearMed = p.text.match(/£\d[^.]{0,60}?\b(?:medication|medicine|treatment)\b/i)
    || p.text.match(/\b(?:medication|medicine|treatment)\b[^.]{0,60}?£\d/i);
  if (nearMed) {
    fail("price", p.name + "::medicine-price",
      rel(p.file) + ' prices the medicine rather than the consultation: "' +
      collapse(nearMed[0]) + '". The fee on this page is for the consultation; ' +
      "the cost of any medication is answered separately and deliberately.");
  }
});

const feeStrings = Object.keys(feeSeen);
if (feeStrings.length > 1) {
  fail("price", "drift::" + feeStrings.join("|"),
    "The consultation fee is not the same on every page: " +
    feeStrings.map(function (f) {
      return '"' + f + '" on ' + feeSeen[f].length + " page(s)";
    }).join(", ") + ". It is declared once in " + rel(GENERATOR) + ", so two " +
    "values means a page has been hand-edited.");
}

// ---------------------------------------------------------------------------
// RULE 8, no medicine named.
//
// The names come from tools/pom-names.js, which this run created so that the
// four checkers needing a medicine list share one instead of holding four
// copies of it. Read that file's header before changing this: the ban here is
// the position build-weight-loss-pages.js declares for its own pages, which is
// stricter than the regulatory floor recorded in compliance/
// WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md. If the house position on inner pages is
// ever relaxed, relax it in the generator header and here together.
// ---------------------------------------------------------------------------
// Every name is reported, not just the first: a page that has drifted has
// usually drifted more than once, and a checker that stops at the first hit
// makes that look like a one-word fix.
pages.forEach(function (p) {
  pom.WEIGHT_LOSS.forEach(function (name) {
    if (pom.findMedicine(p.text, [name])) {
      fail("medicine", p.name + "::" + name,
        rel(p.file) + ' names "' + name + '". ' + rel(GENERATOR) + " states in its " +
        "own header, and every page repeats in its paste comment, that no brand-name " +
        "medicine is named anywhere on these pages.");
    }
  });
});

// ---------------------------------------------------------------------------
// RULE 9, no efficacy or results claim.
//
// The patterns come from tools/claim-patterns.js, the same single list
// check-service-links.js applies to the 177 generated pages and
// check-seo-keywords.js applies to the Meta Keywords lines. It is applied
// again here on purpose: this is the page family the list was written for, and
// a rule that lives only in a checker about LINKS is a rule nobody looking at
// weight loss copy would think to run.
// ---------------------------------------------------------------------------
pages.forEach(function (p) {
  const hit = claims.findClaim(p.text);
  if (hit) {
    const m = p.text.match(hit[0]);
    fail("claim", p.name + "::" + (m ? m[0].toLowerCase() : String(hit[0])),
      rel(p.file) + ' makes ' + hit[1] + ': "' + (m ? m[0] : String(hit[0])) +
      '". Weight loss copy carries no promise about an outcome.');
  }
});

// ---------------------------------------------------------------------------
// RULE 10, the page still ships its own governance promise.
//
// Every page opens with a paste comment telling whoever pastes it into Weebly
// what the page is and what it must not say. That comment is the reason the
// nine rules above are the right rules: they are the promise the page makes
// about itself. A page that quietly drops the promise is a page nobody is
// holding to it at paste time, which is the one moment a human is looking.
// ---------------------------------------------------------------------------
const GOVERNANCE = [
  "Weight Loss Clinic (private, paid service",
  "NOT NHS",
  "no brand-name medicine is named anywhere (POM advertising rules)",
  "Eligibility is framed as a clinical assessment, never a guarantee.",
  "Superintendent pharmacist signs off wording before publish"
];

pages.forEach(function (p) {
  GOVERNANCE.forEach(function (g) {
    if (p.head.indexOf(g) === -1) {
      fail("governance", p.name + "::" + g.slice(0, 40),
        rel(p.file) + ' has lost part of its paste-comment governance note: "' + g +
        '". That comment is what a paster reads before publishing the page.');
    }
  });
});

// --- report ------------------------------------------------------------------

const staleKnown = Object.keys(KNOWN).filter(function (k) {
  return !Object.prototype.hasOwnProperty.call(knownUsed, k);
});
staleKnown.forEach(function (k) {
  failures.push('KNOWN entry "' + k + '" no longer matches anything. The breach it ' +
    "excused has been fixed or moved, so remove the entry rather than leaving it to rot.");
});

console.log("check-weight-loss-copy");
console.log("  " + pages.length + " weight loss page(s) read against " + rel(GENERATOR));
console.log("  " + COPY.length + " line(s) of service copy pinned, " + FAQ.length +
  " FAQ pair(s), " + COHORTS.length + " screening statement(s)");
console.log("  " + pom.WEIGHT_LOSS.length + " medicine name(s) barred from " +
  "tools/pom-names.js, " + claims.CLAIM_PATTERNS.length + " claim pattern(s) from " +
  "tools/claim-patterns.js");
console.log('  consultation fee: "' + CONSULT_FEE + '", the same on all ' +
  pages.length + " page(s)");

const acceptedKeys = Object.keys(knownUsed);
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
