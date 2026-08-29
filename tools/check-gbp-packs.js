#!/usr/bin/env node
/*
  check-gbp-packs.js
  Phase 4 of the audit backlog: verify every GBP content pack in gbp-packs/
  against the pack rules in gbp-packs/TEMPLATE.md and the facts in
  branches.json, the single source of truth. Read-only: reports, changes
  nothing.
  Run from anywhere:  node tools/check-gbp-packs.js
  Exit code 0 = clean, 1 = failures found.
  Checks, per pack:
    - Branch id line present and resolves to a live branch in branches.json
    - Coverage: every non-disposed branch has a pack, no orphan packs
    - Business description under the 750 character GBP limit, and the
      character count the pack states about itself is true
    - No medicine brand names or INNs anywhere (POM advertising is not
      permitted to the public)
    - No efficacy claims
    - No em dashes, no emojis (house style). Since the item 5.1 quality pass
      on 2026-08-12 this reads BOTH spellings: the literal characters and the
      HTML entity forms (&mdash; &ndash; and numeric), because a pack pastes
      into Google as plain text and an entity would reach the public profile
      as literal characters
    - Every post under the 1,500 character limit, and not empty. The body
      measured is the posted copy only: the "Button:" line and any paster
      instruction block inside the post (the Riddings Post B hard stop) are
      cut out first, because neither is ever posted
    - Phone and postcode match branches.json; no other branch's phone or
      postcode appears in the pack
    - No other branch's TOWN appears in the copy that is pasted into the
      public profile (the business description and the post bodies), unless
      it is in this branch's own serviceAreaList or the sentence is a
      governed sister-branch claim. Paster notes and the preamble are out of
      scope because they are never published
    - The five template sections and the four posts are all present
    - The Categories section sets Pharmacy as primary and lists every
      secondary category the branch's services earn (Build Pack v2 4.1)
    - The Services section lists every service the branch's widget set in
      branches.json says it offers, and the description mentions them
      too where the 750 characters allow (Build Pack v2 4.1)
    - And the reverse: no category or service bullet claims something the
      branch's widget set does not give it, so a profile cannot advertise a
      service the shop does not run. Bullets only, so a pack may still say
      in prose that a service is NOT offered, as clear-aintree.md does
    - No pasted copy reads a branch name as if it were a place ("at
      Sandringham"), where that word is in no branch's seoTown and in no
      serviceAreaList. The branch and its town both get named instead
    - The catchment list in the pack leads with the branch's own seoTown,
      the word every page the branch owns leads with, so the profile and
      the site target the same town
    - Shared-domain branches point the GBP profile website at their own
      branch landing page, not at the shared homepage. Master Plan v2
      section 3: two branches on one website cannot rank twice in the same
      map, so the second branch "leans on its own GBP listing and on
      branch-specific landing pages". Two profiles pointing at one homepage
      throws that away. And the other direction: a branch that owns its
      domain outright must carry a Website line and it must be that
      homepage, not a page inside the site
    - The "Name on GBP" line states this branch's trading name from
      branches.json, and not a sister branch's
    - The Photo shot list actually lists at least 10 shots, names the vinyl
      storefront, and tells the paster to action any pending Google updates
      while they are in the profile (Build Pack v2 4.1, TEMPLATE.md
      section 4). Until the item 4.3 quality pass this section was only ever
      checked for its heading
    - A sister branch named in a pack is a real, live branch on the same
      brand, and the sentence names that sister's own seoTown. Two packs
      carry the claim inside the business description, which is pasted
      verbatim into a public Google profile, and it is the one fact in a
      pack that is about ANOTHER branch. A disposal or a rename would leave
      the sentence standing and correct-looking. Found on the item 4.5
      quality pass, 2026-08-11
*/
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PACK_DIR = path.join(ROOT, "gbp-packs");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));
const branches = data.branches;

const digits = (s) => String(s || "").replace(/\D/g, "");
const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Medicine names must not appear in public-facing pharmacy marketing.
// Brand names and INNs for the weight loss and related POM classes. The list
// moved into tools/pom-names.js on the item 3.13 quality pass, 2026-08-11,
// because by then the same class of list had been typed out in three separate
// checkers and a fourth was about to be written. Membership is unchanged.
const MEDICINE_NAMES = require("./pom-names.js").WEIGHT_LOSS;

// The shared efficacy list, the SAME one check-weight-loss-copy.js rule 9 and
// check-service-links.js apply to the generated pages. Added on the item 4.5
// quality pass, 2026-08-13, because the two surfaces were being held to two
// different standards and the wrong one was looser.
//
// The house standard splits weight loss copy in two. A generated inner page is
// Regime 2: the customer chose to click into it. A GBP post is Regime 1: it is
// an advertisement pushed onto a public Google profile, which is the STRICTER
// half. Until this run the page carried the shared 9-pattern list and the pack
// carried only EFFICACY_FAIL below, and EFFICACY_FAIL is not a superset of it.
// Five phrasings failed on a page and passed on a post: "fast weight loss"
// (the list has "rapid" but not "fast"), "delivers results", "real results"
// (it has "proven results" and "best results" but not these two), "most
// effective weight loss" and "that actually works". All five were injected
// into a real pack on this run and check-gbp-packs.js returned exit 0 on every
// one of them. So the looser rule governed the more exposed surface.
//
// Both lists are kept and both are applied, because neither contains the
// other: EFFICACY_FAIL carries pack-specific wording the shared list has no
// reason to hold ("miracle", "cure", "no side effects", "before and after",
// "risk free"), and CLAIM_PATTERNS carries the five above. What is NOT done
// here is retyping either list into the other file, which is the fault
// claim-patterns.js was created to stop: two copies of a rule that agree are
// indistinguishable from one rule until somebody edits one.
const CLAIM_PATTERNS = require("./claim-patterns.js").CLAIM_PATTERNS;

// The shared protection-promise list, the SAME one RULE 12 of
// check-travel-clinic-copy.js reads over the generated pages. Defined once in
// tools/outcome-promise-patterns.js; see the outcome-promise scan below.
const OUTCOME_PROMISE = require("./outcome-promise-patterns.js").OUTCOME_PROMISE;

// The ways copy can promote a prescription-only weight loss medicine without
// naming it. Shared with check-weight-loss-copy.js, which applies the same
// definitions to the generated pages. See the rule that uses this, and
// tools/pom-class-patterns.js, for the injections that proved a pack could
// carry all of them and pass every checker.
const POM_CLASS = require("./pom-class-patterns.js");

// Sentence splitter for the sentence-scoped half of that rule. Matches the
// splitter check-weight-loss-copy.js uses, so a sentence means the same thing
// on both surfaces: whitespace collapsed first, then split on . ! or ?
// followed by a space. Newlines inside a pack's wrapped post body collapse to
// spaces, so a post reads as prose rather than as one sentence per line.
const splitSentences = (s) =>
  norm(s).split(/[.!?]\s+/).map(norm).filter((x) => x.length > 0);

// Hard efficacy claims. Pack-specific, and deliberately NOT merged into
// tools/claim-patterns.js: that file is the shared page-and-pack list, this one
// is the extra wording a pasted Google post should not carry. Both run.
const EFFICACY_FAIL = [
  "guaranteed", "guarantee weight", "best results", "proven results",
  "clinically proven", "miracle", "before and after", "before/after",
  "lose up to", "up to 22.5", "% of your body weight", "percent of your body",
  "fastest way", "rapid weight loss", "melt away", "shed pounds",
  "results you can see", "no side effects", "completely safe", "risk free",
  "risk-free", "cure",
];

// Softer wording worth a human look but not an automatic failure.
const EFFICACY_WARN = [
  "transform", "life changing", "life-changing", "amazing", "incredible",
  "dramatic",
];

// BODY IMAGE AND SOCIAL PROOF, added on the item 4.14 quality pass, 2026-08-14.
//
// Every weight loss rule above this point reads a claim about the PRODUCT (the
// best clinic), the METHOD (the fastest way), the PATIENT'S MEASURED OUTCOME
// (lose 2 stone in 12 weeks) or the MEDICINE (skinny jab, GLP-1). None of them
// reads the appeal that sells weight loss without making any of those claims:
// the one aimed at how the reader feels about their body. Injected one at a
// time into gbp-packs/gordon-short-crosby.md, each reverted and the file
// sha256-compared back afterwards, SIX PASSED ALL 36 CHECKERS in complete
// silence, with not even a warning raised:
//
//   "Ready to start your transformation?"
//   "Feel confident in your body again."
//   "Get beach body ready for summer."
//   "Join hundreds of local patients who have already slimmed down."
//   "Do not let your weight hold you back any longer."
//   "A new you starts here."
//
// A seventh, a photo direction reading "A weight loss patient holding up the
// trousers they have slimmed out of", also passed. That is a before-and-after
// picture described without the words: EFFICACY_FAIL catches the literal
// "before and after", and the shot list is where a photographer is told what
// to take, so the words are exactly what a person writing a brief would not
// use. The photographs go onto the same public profile as the posts.
//
// Why this is a rule and not a matter of taste. The house reference names this
// class in its own words. compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md
// section 7 puts "Ready to start your transformation?" with "the 2025-26
// social responsibility rulings in the reference, which turn on exploiting
// body image". It rates it CONDITIONAL and "on its own it is mild" - but it is
// rating an INNER PAGE, which is Regime 2, the half with the exemption. A pack
// is pasted into a public Google profile, which is Regime 1, the advertising
// half with the near-total prohibition. The same sentence is not the same
// sentence on the two surfaces, which is the whole point of the two-regime
// split, and the stricter surface was the one with no rule at all.
//
// "transform" is already in EFFICACY_WARN above, and it does not help. Two
// reasons, both measured on this pass rather than assumed. It is a WARN, so it
// cannot fail a run. And findTerms wraps every term as (^|[^a-z])term([^a-z]|$),
// so "transform" does not match "transformation" - the exact word the house
// reference quotes slips past even the soft warning. The entry is left where
// it is; it is doing a different job on a different word.
//
// Scoped to the pack and NOT promoted to tools/claim-patterns.js, which is the
// shared list check-weight-loss-copy.js applies to the generated pages. That
// would be wrong here and would fail correct live copy: the assessment records
// the live Smartts page carrying "Ready to start your transformation?" and
// rates it acceptable in its regime. This is a Regime 1 position, so it lives
// in the Regime 1 checker, the way EFFICACY_FAIL does. If a second Regime 1
// family ever needs these, promote them then, the way pom-class-patterns.js
// was promoted once the packs needed what the pages already had.
//
// Split self-scoping from in-context for the reason pom-class-patterns.js
// gives: a phrase that carries its own subject is wrong wherever it sits, and
// a phrase that is ordinary English elsewhere is only wrong about weight loss.
// All twelve patterns were swept across all 16 packs, all 177 generated pages
// in modules/, core/, brand/ and tools/ before being wired: ZERO matches
// anywhere. So this rule asserts nothing new about copy that exists today and
// the gap it closes was latent, which is the same footing the POM_CLASS rule
// was added on.
const BODY_IMAGE_SELF = [
  [/\b(?:beach|bikini|summer|holiday)\s+bod(?:y|ies)\b/i,
    "body-image pressure tied to an event"],
  [/\bnew\s+you\b/i, "a new-self promise"],
  [/\btransformation\b|\btransform\s+your\s+(?:body|life|shape|figure)\b/i,
    "transformation framing"],
  [/\bconfiden(?:t|ce)\s+in\s+your\s+(?:own\s+)?(?:body|skin)\b/i,
    "a body-image appeal"],
  [/\bbody\s+you\s+deserve\b|\blove\s+your\s+body\b/i, "a body-image appeal"],
  [/\bslimmed\s+out\s+of\b/i,
    "a before-and-after picture described without the words"],
  [/\b(?:old|former)\s+(?:trousers|jeans|clothes|dress|shirt)s?\b/i,
    "a before-and-after picture described without the words"],
];

// Only wrong ABOUT weight loss, so read sentence by sentence and only where the
// sentence names it. Gated on POM_CLASS.namesWeightLoss so both rules ask the
// same question rather than each writing its own regex.
const BODY_IMAGE_CONTEXT = [
  [/\b(?:hold|holds|holding)\s+you\s+back\b/i,
    "pressure framing that treats the reader's body as the obstacle"],
  [/\bslim(?:med|ming)?\s+down\b/i, "an outcome promised in plainer words"],
  [/\bjoin\s+(?:hundreds|thousands|dozens|\d+)\b/i,
    "social proof, which is testimonial evidence in numbers"],
];

// The QUALIFIERS on the two private clinical services, added on the item 4.8
// quality pass, 2026-08-14. Everything above this point bans wording. Nothing
// above it REQUIRES any, and the two private clinics are sold on qualified
// offers: the qualifier is the part that makes the advertisement lawful, and
// deleting it leaves an offer that reads better and promises more.
//
// Proved by injection against gbp-packs/fishlocks-eccleston.md, one edit at a
// time, all 36 checkers run on each. Six deletions walked past every one of
// them clean:
//   - the whole "This is a private, paid service and it is not right for
//     everyone - the pharmacist will advise." sentence, cut from Post C
//   - "as part of a supervised plan alongside diet and lifestyle changes",
//     cut from Post C, leaving the clinic with no plan and no diet framing
//   - the same "supervised plan" wording cut from the services bullet
//   - "subject to availability and clinical suitability", cut from Post D
//   - the same wording cut from the services travel bullet
//   - "private, paid service" changed to "free service", which advertises a
//     paid weight loss clinic as free on a public Google profile
// A GBP post is Regime 1 under the house weight loss standard, the stricter
// half: an advertisement pushed onto a public profile rather than an inner
// page the patient chose. The estate already bans the medicine names and the
// efficacy claims there. It did not hold the qualifier that sits beside them.
//
// This pins a convention the estate already keeps rather than inventing one:
// 12 of the 15 packs carry every marker below, and the three that carry none
// are a whole older Post C and Post D drafting, not a partial drift. They are
// listed in KNOWN_CLINIC_QUALIFIER against the question that asks whether to
// bring them onto the same wording. Same shape as rule 11 in
// check-pharmacy-first-eligibility.js, which pinned the "Age ranges set by the
// NHS apply to each condition" sentence for the same reason.
//
// Wording is matched loosely enough to survive an honest rewrite: "not right
// for everyone" and "not suitable for everyone" are both live and both count,
// and the pharmacist-will-advise clause satisfies the same requirement on its
// own.
const CLINIC_QUALIFIERS = [
  {
    key: "weightLossPaid",
    widget: "weightLoss",
    where: "post",
    postRe: /weight loss/i,
    re: /private,?\s+paid\s+service/i,
    what: "that the weight loss clinic is a private, paid service",
    why:
      "a GBP post is an advertisement, and a private weight loss clinic " +
      "advertised without saying it is paid for reads as an NHS service",
  },
  {
    key: "weightLossSuitability",
    widget: "weightLoss",
    where: "post",
    postRe: /weight loss/i,
    re: /not\s+(?:right|suitable)\s+for\s+everyone|pharmacist\s+will\s+advise/i,
    what: "that the weight loss clinic is not right for everyone, or that the pharmacist will advise",
    why:
      "without it the post advertises an unqualified offer of a service that " +
      "is clinically assessed and may be declined",
  },
  {
    key: "weightLossSupervised",
    widget: "weightLoss",
    where: "post",
    postRe: /weight loss/i,
    re: /supervised\s+plan/i,
    what: "that the weight loss clinic is a supervised plan",
    why:
      "it is the wording that frames the clinic as ongoing clinical " +
      "supervision rather than a product being sold",
  },
  {
    key: "travelSuitability",
    widget: "travelClinic",
    where: "post",
    postRe: /travel/i,
    re: /subject\s+to\s+availability\s+and\s+clinical\s+suitability/i,
    what: "that travel vaccinations are subject to availability and clinical suitability",
    why:
      "without it the post promises vaccines the clinic may not hold and may " +
      "not be able to give the patient in front of it",
  },
  {
    key: "servicesWeightLossSupervised",
    widget: "weightLoss",
    where: "services",
    re: /supervised\s+plan/i,
    what: "that the weight loss clinic is a supervised plan",
    why: "the services section is pasted into the profile in its own right",
  },
  {
    key: "servicesTravelSuitability",
    widget: "travelClinic",
    where: "services",
    re: /subject\s+to\s+availability\s+and\s+clinical\s+suitability/i,
    what: "that travel vaccinations are subject to availability and clinical suitability",
    why: "the services section is pasted into the profile in its own right",
  },
];

const EM_DASH = /[—–―]/;
// The entity spellings of the same characters. A pack is pasted into Google's
// plain-text profile fields, so an entity does not render as a dash there: it
// reaches the public profile as the literal characters "&mdash;". That is
// broken copy of a different kind, and until the item 5.1 quality pass on
// 2026-08-12 nothing read the packs for it. Same shape as the fault that put
// 30 &ndash; entities on the generated weight loss pages while the literal
// dash rule reported clean (item 3.9 pass): a rule that reads only one
// spelling of a character is not a rule. check-em-dashes.js has carried both
// spellings since 2026-08-10; this checker now does too.
const ENTITY_DASH = /&(?:mdash|ndash|horbar|#8212|#8211|#8213|#[xX]2014|#[xX]2013|#[xX]2015);/;
const EMOJI = /\p{Extended_Pictographic}/u;

// Day names in week order, plus a token that reads every abbreviation the
// packs use. Read by the hours-days rule below. The token is a source string
// rather than a RegExp so it can be built into both a standalone scan and a
// day-range scan without carrying a stale lastIndex between them.
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SRC = "\\b(mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\\b";
const dayIndexOf = (w) => DAY_NAMES.findIndex((d) => d.slice(0, 3).toLowerCase() === w.slice(0, 3).toLowerCase());

// Accepted exceptions to the catchment-order rule, keyed "<branch id>::areaOrder".
// Each needs a reason and a question id, and the check fails on a key that no
// longer breaks its rule, so the list cannot go stale. Same convention as
// KNOWN_SEO_TOWN in check-address-region.js and KNOWN in check-seo-lengths.js.
const KNOWN_AREA_ORDER = {};
const seenAreaKnown = {};

// Accepted exceptions to the branch-name-as-place rule, keyed
// "<branch id>::branchWordAsPlace::<word>". Same anti-rot convention: a key
// that no longer matches a real breach fails the run.
const KNOWN_BRANCH_WORD = {};
const seenBranchWordKnown = {};

// Accepted exceptions to the two "the branch does not offer this" rules, keyed
// "<branch id>::serviceNotOffered::<widget key>" or
// "<branch id>::categoryNotEarned::<category name>". Use one only where the
// branch genuinely runs a service that branches.json does not model yet, and
// say so with a question id. Same anti-rot convention as the maps above: a key
// that no longer matches a real breach fails the run, so the list cannot rot.
const KNOWN_NOT_OFFERED = {};
const seenNotOfferedKnown = {};

// Accepted exceptions to the profile-basics rules, keyed
// "<branch id>::gbpName", "<branch id>::streetAddress",
// "<branch id>::addressPostTown", "<branch id>::addressStreetLine",
// "<branch id>::reviewLink" or
// "<branch id>::profileWebsite". Same anti-rot
// convention: a key that no longer matches a real breach fails the run.
const POST_TOWN_Q64 = {
  question: "Q64",
  reason:
    "the pack's address carries the Royal Mail post town for the postcode " +
    "(SOUTHPORT for PR8, CHORLEY for PR7, STOCKPORT for SK7) while " +
    "branches.json holds only the dependent locality, so the two are not in " +
    "step. Which of the two is the estate standard is the decision Q64 asks, " +
    "and all five move together once it is answered. Nothing is edited until " +
    "then, because addressLocality feeds schema.org PostalAddress on all 177 " +
    "generated pages.",
};
const KNOWN_IDENTITY = {
  "hirshmans_ainsdale::addressPostTown": POST_TOWN_Q64,
  "fishlocks_ainsdale::addressPostTown": POST_TOWN_Q64,
  "fishlocks_eccleston::addressPostTown": POST_TOWN_Q64,
  "scorah_bramhall::addressPostTown": POST_TOWN_Q64,
  "scorah_hazel::addressPostTown": POST_TOWN_Q64,
};
const seenIdentityKnown = {};

// Accepted exceptions to the photo shot list rules, keyed
// "<branch id>::photoCount", "<branch id>::photoVinyl" or
// "<branch id>::photoGoogleUpdates". Same anti-rot convention: a key that no
// longer matches a real breach fails the run.
const KNOWN_PHOTOS = {};
const seenPhotosKnown = {};

// Accepted exceptions to the sister-branch rule, keyed
// "<branch id>::sisterBranch". Use one only where a pack deliberately names
// a sister the estate no longer models as one, and say so with a question
// id. Same anti-rot convention: a key that no longer matches a real breach
// fails the run.
const KNOWN_SISTER = {};
const seenSisterKnown = {};

// Accepted exceptions to the hours-days rule, keyed "<branch id>::hoursDays".
// Use one only where a pack deliberately states a day the branch's own
// openingHours does not support, and say so with a question id. Same anti-rot
// convention: a key that no longer matches a real breach fails the run.
const KNOWN_HOURS_DAYS = {};
const seenHoursDaysKnown = {};

// Accepted exceptions to the foreign-town rule, keyed
// "<branch id>::foreignTown". Use one only where a pack deliberately names
// another branch's town in copy that is pasted into the public profile, and
// say so with a question id. Same anti-rot convention: a key that no longer
// matches a real breach fails the run.
const KNOWN_FOREIGN_TOWN = {};
const seenForeignTownKnown = {};
const KNOWN_LOCATION_TOWN = {};
const seenLocationTownKnown = {};
// "<branch id>::publishedPhone". Use one only where a pack deliberately
// publishes a number that is not the branch's own in copy that reaches the
// profile, and say so with a question id. Same anti-rot convention.
const KNOWN_PUBLISHED_PHONE = {};
const seenPublishedPhoneKnown = {};

// Accepted exceptions to the private-clinic qualifier rule, keyed
// "<branch id>::clinicQualifiers". One key per BRANCH rather than one per
// missing qualifier, because these three packs are not a partial drift: they
// carry an older Post C and Post D drafting wholesale and carry none of the
// six markers, so they will be rewritten together or not at all. The key goes
// stale as a unit the moment a pack gains all of them, which is the anti-rot
// convention the maps above use.
//
// This is deliberately NOT fixed in this run. The rule above is a checker
// change and touches no published copy; rewriting these three packs would
// change live patient-facing weight loss and travel advertising, which is a
// decision for Rishi and not one an unattended run should take. Q72 asks it.
const CLINIC_QUALIFIER_Q72 = {
  question: "Q72",
  reason:
    "the pack carries the older Post C and Post D drafting, which states " +
    "neither that the weight loss clinic is a private, paid service that is " +
    "not right for everyone and runs as a supervised plan, nor that travel " +
    "vaccinations are subject to availability and clinical suitability. The " +
    "other 12 packs state all of it. Whether these three are brought onto the " +
    "same wording is the decision Q72 asks; all three move together.",
};
const KNOWN_CLINIC_QUALIFIER = {
  "cherrylane_liverpool::clinicQualifiers": CLINIC_QUALIFIER_Q72,
  "fishlocks_ainsdale::clinicQualifiers": CLINIC_QUALIFIER_Q72,
  "hirshmans_ainsdale::clinicQualifiers": CLINIC_QUALIFIER_Q72,
};
const seenClinicQualifierKnown = {};

// Branches where Post A must NOT yet be repointed at their own generated
// Pharmacy First page, keyed by branch id. The Post A rule below treats the
// pfLink page and the branch's own generated page as equally correct, because
// worklist item 5.3 will eventually repoint them. That is right in general and
// wrong for a branch whose generated page is confirmed LIVE as a stale paste:
// swapping the link there sends patients to a page that loads, looks fine and
// publishes the wrong trading name. The pack carries this as a prose "STOP"
// note for the paster, and prose is not a rule: deleting that note left all 31
// checkers green, and so did making the swap itself.
//
// ANTI-ROT WORKS DIFFERENTLY HERE, deliberately. The other maps in this file
// fail when a key stops matching a real breach, because the repo holds enough
// to tell. This hold cannot: it is cleared by a Weebly repaste, which no repo
// file records. So a key here does NOT expire on its own. Clear it by hand in
// the same session as the repaste, after checking the live page's heading
// reads the branchName in branches.json.
const PF_TARGET_HOLD = {
  gordonshorts_crosby: {
    reason:
      "the live pharmacy-first-gordon-short-crosby.html is a pre-item-1.1 paste " +
      "and calls the pharmacy \"Gordon Shorts Chemist\" in its heading, title and " +
      "body. Confirmed live 2026-08-10 and rechecked 2026-08-11; the branch " +
      "sitemap has published nothing since 2026-07-19",
    question: "Q32",
  },
};

const fails = [];
const warns = [];
const stats = [];
const VERBOSE = process.argv.includes("--verbose");
const fail = (file, msg) => fails.push(`${file}: ${msg}`);
const warn = (file, msg) => warns.push(`${file}: ${msg}`);

// A branch is expected to have a pack if it is a real trading branch:
// not disposed, and not the head office (which has no phone or ODS code).
const isPackable = (b) =>
  !b.disposed && b.id !== "rbh_head_office_aintree" && !!b.phone;

const packFiles = fs.readdirSync(PACK_DIR)
  .filter((f) => f.endsWith(".md") && f !== "TEMPLATE.md")
  .sort();

// Every .html page this repo generates, by filename. Pack links that point
// at a page not in this set are live-only pages the repo does not build, so
// nothing here can keep them correct.
const GENERATED = new Set();
for (const d of ["service", "switch", "branch"]) {
  const dir = path.join(ROOT, "modules", d, "pages");
  if (fs.existsSync(dir)) fs.readdirSync(dir).forEach((f) => GENERATED.add(f.toLowerCase()));
}

const byId = new Map(branches.map((b) => [b.id, b]));
const seenIds = new Map();

// Branch landing pages, as built by tools/build-branch-landing-pages.js.
// Same slug rule, read from branches.json, so the two cannot drift.
const landingSlug = (b) =>
  b.brandSlug && b.townSlug ? `pharmacy-${b.brandSlug}-${b.townSlug}.html` : null;

// Which website hosts carry more than one live branch. A branch on a shared
// host needs its GBP profile pointed at its own landing page; a branch that
// owns its domain outright is correct to point at the homepage.
const hostCount = new Map();
for (const b of branches) {
  if (b.disposed || !b.website) continue;
  const h = String(b.website).replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
  hostCount.set(h, (hostCount.get(h) || 0) + 1);
}

// Every word the estate treats as a place, read from branches.json: every
// branch's seoTown plus every entry in every serviceAreaList. Nothing is
// hardcoded, so a town added to a catchment list becomes a recognised place
// on the next run without anyone editing this file.
const PLACE_WORDS = new Set();
for (const b of branches) {
  if (b.seoTown) PLACE_WORDS.add(String(b.seoTown).toLowerCase());
  for (const t of b.serviceAreaList || []) PLACE_WORDS.add(String(t).toLowerCase());
}

// Branch names that are not places. brandLabel is the trading brand
// ("McCanns Chemist"), so what is left of branchName is the word that tells
// two branches of one brand apart ("Sandringham"). Usually that word is also
// the town, and those are dropped here: only the ones that name no place
// survive, and only those can be misread as a location.
const BRANCH_WORDS = branches
  .filter((b) => isPackable(b) && b.branchName && b.brandLabel)
  .map((b) => ({
    word: b.branchName.replace(b.brandLabel, "").trim(),
    branchName: b.branchName,
    seoTown: b.seoTown || "",
  }))
  .filter((x) => x.word && !PLACE_WORDS.has(x.word.toLowerCase()));

// Section headings the template requires, in order.
const REQUIRED_SECTIONS = [
  /^##\s*1\.\s*Business description/m,
  /^##\s*2\.\s*Categories/m,
  /^##\s*3\.\s*Services section content/m,
  /^##\s*4\.\s*Photo shot list/m,
  /^##\s*5\.\s*Post drafts/m,
];
const REQUIRED_POSTS = [
  /^###\s*Post A\b/m,
  /^###\s*Post B\b/m,
  /^###\s*Post C\b/m,
  /^###\s*Post D\b/m,
];

// The block that sits below section 5 in every finished pack. It is not a
// numbered section and it is not pasted into Google, which is exactly why it
// had no rule: it is the only place the pack speaks to the human doing the
// pasting rather than to the profile. All 15 packs carry it and it is where
// the instructions with real consequence live - "do NOT set the profile
// website until it resolves", "do not add medicine names when posting",
// "check the category names against what GBP's picker actually offers".
// Lose it and the paste still looks complete while the paster is no longer
// told any of that. Found on the item 4.1 quality pass, 2026-08-14.
const REQUIRED_NOTES = /^Notes for the paster:/m;

// Pull the business description body: everything between the section 1
// heading and the next "## " heading, minus the heading line itself.
function descriptionOf(text) {
  const m = text.match(/^##\s*1\.\s*Business description[^\n]*\n([\s\S]*?)(?=^##\s)/m);
  return m ? m[1].trim() : null;
}

// The services section body: everything between the section 3 heading and the
// next "## " heading. Added on the item 4.11 quality pass, 2026-08-14.
//
// Every published-copy rule in this file was scoped to two blocks, the
// business description and the post bodies, on the reasoning each of those
// rules writes out for itself: the preamble and the "Notes for the paster"
// block are instructions and never reach the profile, so a rule reading the
// whole file would fail the packs that quote a wrong number or a sister town
// in order to document it. That reasoning is right and the scope drawn from
// it was short by one block. TEMPLATE.md says of section 3 that it "is pasted
// into the profile in its own right", and it is: each line becomes a GBP
// Services entry on the public profile, sitting beside the description a
// patient reads.
//
// Proved by injection on this pass, on gbp-packs/sk-chemists-bootle.md. The
// SAME string was injected into the description, into Post C and into section
// 3, one at a time, each reverted and the file sha256-compared back
// afterwards. Three of them failed in the description and passed section 3 in
// silence:
//   - "Call 0151 944 1014 for weight loss enquiries."   (one digit changed)
//   - "Prices from 99 pounds a month with a discount for the first month."
//   - "The clinic is open seven days a week including Saturday and Sunday."
// The first publishes a number that dials nothing on a profile whose whole
// job is to be rung. The second is the lead pricing plus discount that
// section 5 of compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md names as a
// ruled breach in the advertising regime, and a Services entry is advertising
// exactly as a post is. The third states an opening day for a shop shut on
// both weekend days, which is the locked-door fault the opening hours rule
// calls the one fact on a profile that matters most.
//
// So this is a scope defect, not a missing rule: the rules existed and were
// pointed at two thirds of the published surface. Nothing about live copy
// changes, because no pack in the estate carries any of the above in section
// 3 today. It stops one being added silently.
function servicesOf(text) {
  const m = text.match(/^##\s*3\.\s*Services section content[^\n]*\n([\s\S]*?)(?=^##\s)/m);
  return m ? m[1].trim() : null;
}

// A post can carry a paster instruction block of its own, after the copy and
// the "Button:" line. The Riddings Post B hard stop is the first and so far
// the only one in the estate: the forty-second run added it when the canonical
// switch URL was found returning a 404, telling the paster not to publish that
// button as it stands. That block is guidance to the person pasting and is
// never posted copy, so measuring it as post text is wrong. Before this cut
// Riddings Post B measured 1354 characters against the 1,500 limit while the
// copy that actually posts is 319, so a post nobody had lengthened sat about
// 150 characters of extra clarification away from a false failure. The count
// only ever ran high, so it could not have hidden a genuinely over-length
// post, but it made the reported headroom meaningless. Cut at the marker, the
// same way the body already cuts at "Notes for the paster:", and keep the
// stripped text so the caller can still reason about it.
const POST_INSTRUCTION = /^(?:STOP|DO NOT POST)\b/m;

// Split the post drafts section into the individual posts, keeping the
// post body only (drop the "Button:" line, which is not posted copy, and any
// paster instruction block, which is not posted copy either).
function postsOf(text) {
  const sec = text.match(/^##\s*5\.\s*Post drafts[^\n]*\n([\s\S]*)$/m);
  if (!sec) return [];
  const parts = sec[1].split(/^###\s*/m).slice(1);
  return parts.map((p) => {
    const nl = p.indexOf("\n");
    const label = nl === -1 ? p.trim() : p.slice(0, nl).trim();
    let body = nl === -1 ? "" : p.slice(nl + 1);
    body = body.split(/^Notes for the paster:/m)[0];
    const beforeNote = body.split(POST_INSTRUCTION)[0];
    const note = body.slice(beforeNote.length).trim();
    body = beforeNote.replace(/^Button:.*$/gm, "").trim();
    return { label, body, note };
  });
}

// The "Button:" line of each post, which postsOf deliberately strips out of
// the body so it cannot inflate a character count. Read separately here
// because the button is the only clickable thing on a GBP post, so it is the
// one line on the post that decides where a click actually lands.
function buttonsOf(text) {
  const sec = text.match(/^##\s*5\.\s*Post drafts[^\n]*\n([\s\S]*)$/m);
  if (!sec) return [];
  const parts = sec[1].split(/^###\s*/m).slice(1);
  return parts.map((p) => {
    const nl = p.indexOf("\n");
    const label = nl === -1 ? p.trim() : p.slice(0, nl).trim();
    const rest = (nl === -1 ? "" : p.slice(nl + 1)).split(/^Notes for the paster:/m)[0];
    const line = (rest.match(/^Button:.*$/m) || [""])[0].trim();
    const url = (line.match(/https?:\/\/[^\s)"'<>]+/) || [""])[0].replace(/[.,]$/, "");
    const letter = (label.match(/^Post\s+([A-Z])\b/) || [])[1] || "";
    // The words ON the button, as distinct from where it points. Added on the
    // item 4.5 pass because nothing in this file had ever read them: see the
    // button label rule below for why that mattered.
    const cta = (line.match(/^Button:\s*(.+?)\s*->\s*https?:/) || [])[1] || "";
    return { label, letter, line, url, cta };
  });
}

// Case-insensitive whole-word search that reports the line it was found on.
function findTerms(text, terms) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  for (const term of terms) {
    const re = new RegExp(`(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i");
    lines.forEach((line, i) => {
      if (re.test(line)) hits.push({ term, line: i + 1, text: norm(line).slice(0, 90) });
    });
  }
  return hits;
}

// The same shape as findTerms, for the shared CLAIM_PATTERNS, which are regular
// expressions rather than substrings and so cannot go through findTerms' word
// boundary wrapper. Reports the line number, the wording matched and the
// plain-English reason the shared list gives, so a failure names the phrase
// rather than the pattern.
function findClaims(text, patterns) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  for (const [re, reason] of patterns) {
    lines.forEach((line, i) => {
      const m = line.match(re);
      if (m) hits.push({ term: norm(m[0]), reason, line: i + 1, text: norm(line).slice(0, 90) });
    });
  }
  return hits;
}

for (const file of packFiles) {
  const full = path.join(PACK_DIR, file);
  const text = fs.readFileSync(full, "utf8");

  // --- branch identity -----------------------------------------------
  const idm = text.match(/^Branch id:\s*([a-z0-9_]+)/m);
  if (!idm) {
    fail(file, 'no "Branch id: <id>" line, so the pack cannot be checked against branches.json');
    continue;
  }
  const id = idm[1];
  const b = byId.get(id);
  if (!b) {
    fail(file, `branch id "${id}" is not in branches.json`);
    continue;
  }
  if (b.disposed) fail(file, `branch id "${id}" is marked disposed in branches.json`);
  if (seenIds.has(id)) fail(file, `branch id "${id}" is also used by ${seenIds.get(id)}`);
  seenIds.set(id, file);

  // --- structure ------------------------------------------------------
  REQUIRED_SECTIONS.forEach((re, i) => {
    if (!re.test(text)) fail(file, `missing template section ${i + 1}`);
  });
  REQUIRED_POSTS.forEach((re, i) => {
    if (!re.test(text)) fail(file, `missing Post ${"ABCD"[i]}`);
  });
  if (!REQUIRED_NOTES.test(text)) {
    fail(file, 'no "Notes for the paster:" block below section 5. That block is the only part of the pack addressed to the person doing the pasting rather than to the Google profile, and it carries the instructions with consequence: which branches must not have their profile website set yet, that no medicine name may be added to the weight loss post, and that the category names have to be matched against whatever GBP\'s picker offers on the day. Without it the pack still reads as complete and the paster is told none of it');
  }

  // --- the GBP profile website on a shared domain -----------------------
  // Master Plan v2 section 3: Fishlocks, McCanns and Scorah each run two
  // branches on one website, so the second branch "leans on its own GBP
  // listing and on branch-specific landing pages". If both profiles point
  // at the same homepage, Google gets one page for two listings and neither
  // profile carries a local target, which is the whole reason the landing
  // pages were built (items 2.2 and 5.2). Only enforced where the landing
  // page actually exists in the repo, so this cannot fail for a branch that
  // has nothing to point at yet.
  const ownHostForSite = String(b.website || "")
    .replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
  const slug = landingSlug(b);
  const sharesHost = (hostCount.get(ownHostForSite) || 0) > 1;
  if (sharesHost && slug && GENERATED.has(slug)) {
    const siteLine = (text.match(/^-\s*Website[^\n]*(?:\n\s{2,}[^\n]*)*/m) || [])[0] || "";
    if (!siteLine) {
      fail(file, `no "- Website" line in the profile basics, so the paster has nothing telling them to use the ${slug} landing page`);
    } else if (!siteLine.toLowerCase().includes(slug)) {
      fail(file, `profile website does not point at this branch's landing page ${slug}. ${ownHostForSite} carries ${hostCount.get(ownHostForSite)} live branches, so pointing the profile at the shared homepage gives both listings the same page (Master Plan v2 section 3)`);
    }
  } else if (!sharesHost && b.website) {
    // The other half of the same rule, and until the item 4.2 quality pass on
    // 2026-08-11 it did not exist. TEMPLATE.md states both directions: a
    // shared-domain branch points the profile at its own landing page, and
    // "a branch that owns its domain outright points at the homepage as
    // normal". Only the first half was enforced, so for the nine branches
    // that own their domain the Website line was never read at all.
    //
    // Two faults that line can carry, both silent. It can be missing, and
    // then the pack tells the paster everything about the profile except
    // where to send the traffic. Or it can point at a deep page, and then
    // every visitor Google sends from the profile lands on one service page
    // instead of the shop's front door: the branch's own homepage stops
    // collecting the profile's traffic and its other services stop being
    // one click away. Neither breaks any rule already here. The foreign-host
    // case is already caught, by the link rule further down, because every
    // website in branches.json carries "pharmacy", "chemist" or "rbhealth"
    // in its host, so that rule reads them all.
    //
    // This is not hypothetical for the website field in particular. The
    // supervised GBP check on 2026-08-09 found Google had silently replaced
    // the website on at least one profile with an NHS page. The pack is what
    // the paster restores the correct value from, so it has to be right and
    // it has to be there.
    const siteLine = (text.match(/^-\s*Website[^\n]*(?:\n\s{2,}[^\n]*)*/m) || [])[0] || "";
    const key = `${b.id}::profileWebsite`;
    const known = KNOWN_IDENTITY[key];
    const identityFail = (msg) => {
      if (known) { seenIdentityKnown[key] = true; warn(file, `KNOWN ${msg} ${known.question}: ${known.reason}`); }
      else fail(file, msg);
    };
    const onOwnHost = (siteLine.match(/https?:\/\/[^\s)"'<>]+/g) || [])
      .map((u) => u.replace(/[.,]$/, ""))
      .filter((u) => u.replace(/^https?:\/\//, "").split("/")[0].toLowerCase() === ownHostForSite);
    if (!siteLine) {
      identityFail(`no "- Website" line in the profile basics, so the pack tells the paster everything about the profile except where to send its traffic. This branch owns ${ownHostForSite} outright, so the line should carry that homepage (TEMPLATE.md)`);
    } else if (!onOwnHost.length) {
      identityFail(`the "- Website" line carries no address on ${ownHostForSite}, which is this branch's own website in branches.json, so the paster has nothing to set the profile website from.`);
    } else {
      const deep = onOwnHost.filter((u) => u.replace(/^https?:\/\//, "").replace(/\/$/, "").includes("/"));
      if (deep.length) {
        identityFail(`profile website points at "${deep[0]}", a page inside the site rather than the homepage. This branch owns ${ownHostForSite} outright, so TEMPLATE.md sends the profile to the homepage: a deep link hands every visitor Google sends from the profile a single service page instead of the shop's front door. The landing-page rule above is for shared domains only, and ${ownHostForSite} carries one live branch.`);
      }
    }
  }

  // --- categories against the services the branch actually offers -------
  // Build Pack v2 section 4.1 asks for the secondary categories that apply:
  // Travel clinic, Vaccination centre and Weight loss service. The pack is
  // the paster's instruction sheet, so a category missing here is a category
  // that never gets added in GBP, and the profile stays out of those map
  // results. Which ones apply is read from the branch's widget set in
  // branches.json rather than from the pack, so the two cannot drift.
  // Vaccination centre follows the travel clinic: a travel clinic is where
  // the branch gives travel vaccinations, which is what the category names.
  const catSec = (text.match(/^##\s*2\.\s*Categories[^\n]*\n([\s\S]*?)(?=^##\s)/m) || [])[1] || "";
  if (!/primary:\s*pharmacy/i.test(catSec)) {
    fail(file, "Categories section does not set Pharmacy as the primary category");
  }
  const widgets = b.widgets || {};
  const CATEGORY_RULES = [
    { earned: !!widgets.travelClinic, name: "Travel clinic", because: "the branch has a travel clinic" },
    { earned: !!widgets.travelClinic, name: "Vaccination centre", because: "the branch's travel clinic gives vaccinations" },
    { earned: !!widgets.weightLoss, name: "Weight loss service", because: "the branch has a weight loss clinic" },
  ];
  for (const rule of CATEGORY_RULES) {
    if (!rule.earned) continue;
    if (!catSec.toLowerCase().includes(rule.name.toLowerCase())) {
      fail(file, `Categories section does not list "${rule.name}", but ${rule.because} per branches.json (Build Pack v2 section 4.1)`);
    }
  }
  // The same rule the other way round. TEMPLATE.md says a pack must not list
  // a service the branch has no widget for, and until the item 4.8 pass
  // nothing enforced that half: the loops above only ever fired on an
  // OMISSION. A category the branch has not earned is the more expensive
  // direction of the two. An omission costs RBH a listing in one map search.
  // A category or service the branch does not run puts the branch in a search
  // it cannot serve, so somebody travels to the shop for a service that is
  // not there, and Google measures the profile against what patients find.
  // Only the pack's own BULLET LINES are read, not the section prose, because
  // a correct pack may say in a note that a service is NOT offered:
  // clear-aintree.md does exactly that, and reading the whole section would
  // fail the one pack that handles this best.
  // A bullet is a line opening with "- " PLUS the indented lines that wrap it,
  // because every pack wraps at about 70 characters and a category list often
  // runs "- ...: Travel clinic,\n  Weight loss service, Vaccination centre".
  // Reading only the "- " lines would miss the wrapped half and the rule would
  // silently cover a third of what it claims to. Any line that starts back at
  // column 0 without a "- " closes the list, which is what keeps a prose note
  // like clear-aintree.md's "Note: branches.json shows no Pharmacy First..."
  // out of the claim text.
  const bulletsOf = (section) => {
    const out = [];
    let inBullet = false;
    for (const line of String(section || "").split("\n")) {
      if (/^\s*-\s+/.test(line)) { inBullet = true; out.push(line.trim()); continue; }
      if (inBullet && /^\s+\S/.test(line)) { out.push(line.trim()); continue; }
      inBullet = false;
    }
    return out.join(" ");
  };
  const catBullets = bulletsOf(catSec);
  for (const rule of CATEGORY_RULES) {
    if (rule.earned) continue;
    if (catBullets.toLowerCase().includes(rule.name.toLowerCase())) {
      const key = `${b.id}::categoryNotEarned::${rule.name}`;
      if (KNOWN_NOT_OFFERED[key]) { seenNotOfferedKnown[key] = true; continue; }
      fail(file, `Categories section lists "${rule.name}", but branches.json does not give this branch the widget that earns it, so the profile would enter map searches for a service the branch does not run. Remove it, or add the service to branches.json first`);
    }
  }

  // --- services section against the services the branch actually offers --
  // Build Pack v2 section 4.1 asks for the services section to be filled.
  // A service the branch genuinely runs but the pack does not list is a
  // service that never reaches the profile, so it never shows in the map
  // results for that search. As with categories, which services apply is
  // read from the branch's widget set in branches.json, not from the pack,
  // so the two cannot drift. Whitespace is flattened first because packs
  // wrap their lines, and a wrapped "Pharmacy\nFirst" would otherwise read
  // as missing.
  const SERVICE_RULES = [
    { key: "pharmacyFirst", name: "Pharmacy First", re: /pharmacy first/i },
    { key: "bloodPressure", name: "NHS blood pressure check", re: /blood pressure/i },
    { key: "contraception", name: "NHS contraception service", re: /contracept/i },
    { key: "weightLoss", name: "Weight loss clinic", re: /weight loss|weight management/i },
    { key: "travelClinic", name: "Travel clinic", re: /travel/i },
  ];
  const svcSec = norm((text.match(/^##\s*3\.\s*Services section content[^\n]*\n([\s\S]*?)(?=^##\s)/m) || [])[1]);
  const descFlat = norm((text.match(/^##\s*1\.\s*Business description[^\n]*\n([\s\S]*?)(?=^##\s)/m) || [])[1]);
  for (const rule of SERVICE_RULES) {
    if (!widgets[rule.key]) continue;
    if (!rule.re.test(svcSec)) {
      fail(file, `Services section does not list "${rule.name}", but branches.json gives this branch a ${rule.key} widget (Build Pack v2 section 4.1)`);
    }
    if (!rule.re.test(descFlat)) {
      warn(file, `business description does not mention "${rule.name}", which branches.json says the branch offers - worth including if the 750 characters allow`);
    }
  }
  // And the reverse, on the service bullets only, for the reason given above
  // the category version: a Services entry for something the branch does not
  // run is a promise made to a patient who then makes a journey for it.
  const svcBullets = norm(bulletsOf((text.match(/^##\s*3\.\s*Services section content[^\n]*\n([\s\S]*?)(?=^##\s)/m) || [])[1]));
  for (const rule of SERVICE_RULES) {
    if (widgets[rule.key]) continue;
    if (!rule.re.test(svcBullets)) continue;
    const key = `${b.id}::serviceNotOffered::${rule.key}`;
    if (KNOWN_NOT_OFFERED[key]) { seenNotOfferedKnown[key] = true; continue; }
    fail(file, `Services section lists "${rule.name}", but branches.json gives this branch no ${rule.key} widget, so the profile would advertise a service the branch does not run. Remove it, or add the service to branches.json first`);
  }

  // --- claims outside the known vocabulary --------------------------------
  // Found on the item 4.4 quality pass, 2026-08-13, by injection.
  //
  // The two reverse rules above are a BLOCKLIST: they walk SERVICE_RULES and
  // CATEGORY_RULES, five services and three categories, and fail a pack that
  // claims one of those without the widget that earns it. That shape can only
  // ever catch a claim it already has a name for. A claim OUTSIDE the list is
  // invisible to it. Proved against gbp-packs/scorah-bramhall.md: a services
  // bullet reading "- Ear wax removal: microsuction ear wax removal by
  // appointment." and a secondary category "Dental clinic" both walked past
  // all 30 checkers clean. Neither is a service any RBH branch runs.
  //
  // That is the hole sitting exactly where the risk is highest. The rules
  // above already state the reason a false claim is the expensive direction:
  // "somebody travels to the shop for a service that is not there". The
  // likeliest false claim is not "travel clinic" on a branch that lost its
  // travel widget, which the blocklist does catch. It is a service nobody
  // thought to name, added to a pack in good faith from a stale note or a
  // half-remembered conversation, and pasted into a public Google profile
  // that most patients read instead of the website. For a pharmacy an
  // invented clinical service is also an advertising-standards and GPhC
  // exposure, not only a wasted journey.
  //
  // So this rule inverts the shape: an ALLOWLIST. Every service bullet label
  // and every secondary category named in any pack must be one this repo
  // already recognises. The vocabulary below is not a guess: it is the
  // complete set in use across all 15 packs on 2026-08-13, derived by reading
  // them rather than by memory.
  //
  // What this rule does and does not promise, stated plainly so a later run
  // does not over-trust it. Seven of these labels have no widget in
  // branches.json at all (blister packs, blood testing, NHS vaccinations,
  // medical cannabis and so on), so nothing in this repo can confirm the
  // branch runs them. This rule therefore does NOT verify a claim is true. It
  // guarantees only that no pack can introduce a NEW service or category
  // claim silently: adding one now requires a deliberate edit here, which is
  // where a human decides whether the branch really offers it. That is the
  // strongest guarantee the repo's data can support, and it is the one the
  // blocklist above was missing.
  const RECOGNISED_SERVICES = [
    "NHS prescription dispensing", "NHS Pharmacy First", "NHS blood pressure check",
    "NHS contraception service", "Travel clinic", "Weight loss clinic",
    "Private consultation room", "Blister packs", "NHS vaccinations",
    "Vaccinations", "Blood testing", "Blood tests", "Medical cannabis consultation",
  ].map((s) => s.toLowerCase());
  const RECOGNISED_CATEGORIES = [
    "Pharmacy", "Travel clinic", "Vaccination centre", "Weight loss service",
    "Blood testing service",
  ].map((s) => s.toLowerCase());

  // Per-bullet, unlike bulletsOf() above, which flattens the whole section
  // into one string. This rule needs each bullet on its own so it can read
  // the label in front of the colon and name the offending one in the error.
  const bulletListOf = (section) => {
    const out = [];
    let inBullet = false;
    for (const line of String(section || "").split("\n")) {
      if (/^\s*-\s+/.test(line)) { inBullet = true; out.push(line.trim().replace(/^-\s*/, "")); continue; }
      if (inBullet && /^\s+\S/.test(line)) { out[out.length - 1] += " " + line.trim(); continue; }
      inBullet = false;
    }
    return out;
  };

  // A pack may carry a "NOTE:" bullet about the live listing name, as
  // cherry-lane-walton.md and hirshmans-ainsdale.md both do. That is a note to
  // the paster, not a category claim, so it is skipped by the same reasoning
  // that keeps clear-aintree.md's prose note out of the rules above.
  // catSec is already the raw section text. svcSec above was flattened by
  // norm(), which destroys the line breaks this rule reads, so the services
  // section is taken from the source again rather than reusing it.
  const svcSecRaw = (text.match(/^##\s*3\.\s*Services section content[^\n]*\n([\s\S]*?)(?=^##\s)/m) || [])[1] || "";
  for (const bl of bulletListOf(catSec)) {
    if (/^note\b/i.test(bl)) continue;
    const names = (bl.match(/^[^:]+:\s*(.*)$/) || [])[1];
    if (!names) continue;
    for (const raw of names.split(",")) {
      const name = raw.trim().replace(/\.$/, "");
      if (!name) continue;
      if (RECOGNISED_CATEGORIES.includes(name.toLowerCase())) continue;
      fail(file, `Categories section names "${name}", which is not a category any pack in this repo uses. A secondary category puts the profile into map searches for that service, so an unrecognised one advertises something no RBH branch is known to run. If the branch genuinely offers it, add it to RECOGNISED_CATEGORIES in tools/check-gbp-packs.js deliberately`);
    }
  }
  for (const bl of bulletListOf(svcSecRaw)) {
    if (/^note\b/i.test(bl)) continue;
    const label = (bl.match(/^([^:]+):/) || [])[1];
    if (!label) continue;
    if (RECOGNISED_SERVICES.includes(label.trim().toLowerCase())) continue;
    fail(file, `Services section lists "${label.trim()}", which is not a service any pack in this repo uses. This section is pasted into a public Google profile, so an unrecognised service is a promise to a patient who then makes a journey for it. If the branch genuinely offers it, add it to RECOGNISED_SERVICES in tools/check-gbp-packs.js deliberately`);
  }

  // --- the photo shot list ------------------------------------------------
  // Until the item 4.3 quality pass on 2026-08-11, section 4 was read for its
  // heading and nothing else: REQUIRED_SECTIONS proved the "## 4. Photo shot
  // list" line existed, and a pack could have carried an empty section under
  // it and passed. Every other section of the pack has a rule behind it, and
  // this is the section Build Pack v2 puts a number on.
  //
  // Three things the section owes the paster, all from Build Pack v2 4.1 and
  // TEMPLATE.md section 4.
  //
  // The count. Build Pack v2 asks for "10+ photos", and TEMPLATE.md turns
  // that into "list 10 shots". Every pack in the estate sits exactly on 10,
  // one on 11, so there is no headroom at all: delete a single bullet while
  // editing a pack and the profile it builds drops under the requirement with
  // nothing to notice. Photo count is one of the few GBP inputs Google
  // measures directly, so a short set costs the profile map ranking, and the
  // pack is the only place the paster is told how many to take.
  //
  // The vinyl. The new storefront vinyl is the one shot that has to be on the
  // profile the day it is fitted, because it is what makes the listing look
  // current, and it is the shot nobody thinks of unless the sheet says so.
  //
  // The pending Google updates. Google queues its own suggested edits against
  // a profile - hours, categories, an address someone "corrected" - and they
  // publish if nobody acts on them. The 2026-08-09 supervised check found
  // Google had silently replaced the website on at least one profile. The
  // paster is already inside the profile when they load the photos, which is
  // the one moment those queued edits are free to clear, so TEMPLATE.md puts
  // the reminder here. mccanns-sandringham.md was missing it, found by this
  // rule and fixed at the same pass.
  const photoSecRaw = (text.match(/^##\s*4\.\s*Photo shot list[^\n]*\n([\s\S]*?)(?=^##\s)/m) || [])[1] || "";
  const photoSec = norm(photoSecRaw);
  const photoBullets = photoSecRaw.split("\n").filter((l) => /^-\s+\S/.test(l)).length;
  const photoFail = (suffix, msg) => {
    const key = `${b.id}::${suffix}`;
    const known = KNOWN_PHOTOS[key];
    if (known) { seenPhotosKnown[key] = true; warn(file, `KNOWN ${msg} ${known.question}: ${known.reason}`); }
    else fail(file, msg);
  };
  const PHOTO_MIN = 10;
  if (photoBullets < PHOTO_MIN) {
    photoFail("photoCount", `Photo shot list names ${photoBullets} shot${photoBullets === 1 ? "" : "s"}, and Build Pack v2 4.1 asks for at least ${PHOTO_MIN}. The pack is the only sheet telling the paster how many photos to take, so a short list is a short profile`);
  }
  if (!/vinyl/i.test(photoSec)) {
    photoFail("photoVinyl", "Photo shot list does not mention the vinyl storefront, which Build Pack v2 4.1 asks for in the photo set and TEMPLATE.md section 4 repeats. It is the shot that makes the listing look current and the one nobody takes unless the sheet says so");
  }
  if (!/pending google update|google updates/i.test(photoSec)) {
    photoFail("photoGoogleUpdates", 'Photo shot list does not remind the paster to action any pending Google updates while they are in the profile (TEMPLATE.md section 4). Google\'s own suggested edits to hours, categories and the address publish themselves if nobody clears them, and loading the photos is the one visit where clearing them is free');
  }

  // --- catchment order: the profile must lead with the branch's own town --
  // seoTown is the word every page this branch owns leads with: its title,
  // its description, its H1 and its areaServed schema. The catchment list in
  // the pack is the same claim made on the GBP profile, and Google reads the
  // profile and the site together. A pack that leads with a different town
  // aims the profile at a town the pages do not target, and where two
  // branches share a domain that is usually the sister branch's own town,
  // which is the overlap the branch landing pages exist to stop.
  //
  // Added by the item 5.7 quality pass on 2026-08-10. Item 5.7 moved McCanns
  // Sandringham's seoTown from Sandringham to St Michael's and regenerated
  // every page the branch owns, but the pack had been drafted on 2026-08-04
  // from the old serviceAreaList order and nothing read the two against each
  // other, so the profile copy still led with Aigburth: the town its sister
  // branch further along the same road already targets. Every other pack in
  // the estate already led with its own seoTown, so this encodes a convention
  // the packs keep rather than inventing one.
  //
  // Only a genuine catchment RUN counts: three or more serviceAreaList towns
  // joined by nothing but commas and "and". Any mention of a town would not
  // do, because McCanns Sandringham sits at 1b Aigburth Road and a street
  // name is an address, not a catchment claim.
  const areaList = (b.serviceAreaList || []).filter(Boolean);

  // A catchment element may carry a lowercase compass qualifier: three packs
  // write "north Liverpool" where branches.json holds plain "Liverpool".
  //
  // Found on the item 4.2 quality pass, 2026-08-13, by length-neutral
  // injection into gbp-packs/cherry-lane-walton.md. Both catchment rules
  // below parse a run as elements separated by commas and "and", and both
  // built their element out of capitalised words or the branch's own town
  // names only. Neither could match "north Liverpool", so the run
  // "Walton, Everton and north Liverpool" ended one element early at two
  // towns, and BOTH rules short-circuit on `towns.length < 3`. The effect is
  // not a weakened check, it is no check at all: Everton was replaced with
  // Woolton, a town this branch does not serve, and every checker stayed
  // green; the lead town was swapped to Everton and the order rule never
  // fired either. Moving the qualifier to the tail ("Liverpool north") made
  // the identical bad town fail immediately, which is what isolated the
  // cause to the qualifier rather than to the rules.
  //
  // Only lowercase qualifiers are matched, which is the form the packs use;
  // a capitalised "North Liverpool" is already a plain place and is handled
  // by the existing element. asOwnTown() below reads an element's trailing
  // words, so "north Liverpool" resolves to the branch's own Liverpool and
  // counts towards the two-own-town threshold rather than against it.
  const AREA_QUALIFIER =
    "(?:north|south|east|west|central|greater|upper|lower|inner|outer)\\s+";

  if (b.seoTown && areaList.length >= 3) {
    // Longest first, so "North Liverpool" wins over "Liverpool".
    const alt = areaList.slice().sort((x, y) => y.length - x.length).map(escapeRe).join("|");
    const OWN_ELEM = `(?:${AREA_QUALIFIER})?(?:${alt})`;
    const runRe = new RegExp(`${OWN_ELEM}(?:\\s*,\\s*${OWN_ELEM})+(?:\\s*,?\\s+and\\s+${OWN_ELEM})?`, "g");
    const flat = text.replace(/\s*\n\s*/g, " ");
    const key = `${id}::areaOrder`;
    for (const run of flat.match(runRe) || []) {
      const towns = run.split(/\s*,\s*|\s+and\s+/).map((t) => t.trim()).filter(Boolean);
      if (towns.length < 3) continue;
      if (towns[0] === b.seoTown) continue;
      const known = KNOWN_AREA_ORDER[key];
      if (known) {
        seenAreaKnown[key] = true;
        warn(file, `KNOWN catchment list leads with "${towns[0]}", not this branch's seoTown "${b.seoTown}". ${known.question}: ${known.reason}`);
      } else {
        fail(file, `catchment list leads with "${towns[0]}", but this branch's seoTown in branches.json is "${b.seoTown}", which is the word every page it owns leads with. The profile and the site would target different towns. Found: "${run}"`);
      }
    }
  }

  // --- and every town IN the catchment list must be one of this branch's --
  // The rule above reads the ORDER of the catchment list and nothing else,
  // and it is structurally incapable of reading anything else, because the
  // regex it matches with is composed out of the branch's own areaList towns
  // and so can only ever match those towns. A town that is not on the list
  // is not read as a wrong element: it is invisible, and the run simply ends
  // one element early. Splice a foreign town into the tail of the list and
  // the shortened run still leads with the right seoTown, so the rule above
  // passes it in both directions.
  //
  // Found on the item 4.7 quality pass, 2026-08-13, by injection into
  // gbp-packs/mccanns-sandringham.md: the services-section catchment
  // "St Michael's, Aigburth, Lark Lane and Dingle" had Dingle replaced with
  // Woolton, a town this branch does not serve, and all 32 checkers stayed
  // green. That copy is pasted verbatim into a public Google profile, so it
  // claims a catchment the group does not have and aims the profile's local
  // search at a town none of the branch's own pages target.
  //
  // The foreign-town rule further down this file does not cover it. That one
  // fires only on a town that is ANOTHER branch's seoTown or addressLocality,
  // which is the sister-branch leak. A town belonging to no branch at all
  // falls between the two rules, which is exactly what Woolton is. This rule
  // closes the membership direction and leaves ownership to that one.
  //
  // Deliberately membership only, not completeness and not order. A pack may
  // legitimately quote a shorter run than branches.json holds, and the lead
  // word is already owned by the rule above. What a pack may not do is name
  // a town that is nowhere in this branch's own data.
  //
  // Composed from branches.json, so adding a town to a serviceAreaList makes
  // it a permitted word for that branch with no edit here. A run must carry
  // at least two of the branch's own towns before it is read as a catchment
  // claim at all, which is what keeps ordinary capitalised prose lists out:
  // "Check the Post B, C and D page URLs" carries none.
  if (areaList.length >= 3) {
    const own = new Set(
      [...areaList, b.seoTown, b.addressLocality]
        .filter(Boolean)
        .map((t) => String(t).toLowerCase())
    );
    const altOwn = areaList
      .slice()
      .sort((x, y) => y.length - x.length)
      .map(escapeRe)
      .join("|");
    // A capitalised place-shaped phrase: "Woolton", "Lark Lane", "St Helens".
    const PLACE = "[A-Z][A-Za-z'\\-]*(?:\\s+[A-Z][A-Za-z'\\-]*){0,2}";
    const ELEM = `(?:(?:${AREA_QUALIFIER})?(?:${altOwn}|${PLACE}))`;
    const anyRe = new RegExp(`${ELEM}(?:\\s*,\\s*${ELEM})+(?:\\s*,?\\s+and\\s+${ELEM})?`, "g");
    const flatAny = text.replace(/\s*\n\s*/g, " ");
    for (const run of flatAny.match(anyRe) || []) {
      const towns = run.split(/\s*,\s*|\s+and\s+/).map((t) => t.trim()).filter(Boolean);
      if (towns.length < 3) continue;
      // An element carries its lead-in verb when the run opens a sentence:
      // every pack writes "Serving Bootle, Sefton and Liverpool", so the
      // first element reads "Serving Bootle". Read the trailing words of an
      // element too, and take the element as that town if a trailing phrase
      // is one. This is not a loophole: it accepts an element only when a
      // town the branch really has is what the element ENDS with, so
      // "Serving Woolton" is still read as Woolton and still fails.
      const asOwnTown = (t) => {
        const words = t.split(/\s+/);
        for (let i = 0; i < words.length; i++) {
          if (own.has(words.slice(i).join(" ").toLowerCase())) return true;
        }
        return false;
      };
      // A street is not a catchment claim. Both Ainsdale packs open with
      // "Sherwood House, Station Road, Ainsdale, Southport" and Riddings
      // with "Riddings Road, Timperley, Altrincham": an address, comma
      // separated, ending in the branch's own towns, which is the same
      // shape as a catchment run and means the opposite thing. Only a
      // NON-own element is tested this way, so "Lark Lane" is untouched,
      // because it is a real town in this branch's serviceAreaList.
      const STREET = /\b(?:Road|Rd|Street|St|Lane|Avenue|Ave|Drive|Close|Way|Parade|House|Court|Place|Terrace|Crescent|Square|Walk|Row|Hill)\b\.?$/i;
      const ownHits = towns.filter((t) => asOwnTown(t));
      // Two of the branch's own towns is what makes this a catchment claim
      // rather than any other comma list that happens to be capitalised.
      if (ownHits.length < 2) continue;
      for (const t of towns) {
        if (asOwnTown(t)) continue;
        if (STREET.test(t)) continue;
        fail(file, `catchment list names "${t}", which is not in this branch's serviceAreaList in branches.json (${areaList.join(", ")}) and is neither its seoTown nor its addressLocality. This list is pasted verbatim into the public Google profile, so it claims a catchment the branch does not have and aims the profile at a town none of its own pages target. Found: "${run}"`);
      }
    }
  }

  // --- a branch name used as if it were a place -------------------------
  // Some branches are named after something that is not a town: McCanns
  // Chemist Sandringham is named after the parade it stands on, not a place
  // anybody searches for. Item 5.7 settled that on Rishi's Q15 answer by
  // moving that branch's seoTown to St Michael's, and every page the branch
  // owns now leads with St Michael's, including the sister cross-link on the
  // Aigburth landing page, which reads "McCanns Chemist Sandringham in
  // St Michael's".
  //
  // A pack that writes "in Sandringham" or "at Sandringham" therefore puts a
  // word on the Google profile that the estate's own data does not treat as
  // a place: it is in no branch's seoTown and in no branch's
  // serviceAreaList. Google reads the profile and the site together, so the
  // profile would name a location none of the pages claim, which adds no
  // local signal and contradicts the site. Where two branches share a road
  // and a domain, as the two McCanns do, the sister-branch sentence is also
  // the one line that tells a reader which shop is which, so getting the
  // other branch's town into it is the point of the sentence.
  //
  // Which words count as places is read from branches.json, never hardcoded,
  // so adding a town to a catchment list retires the rule for that word by
  // itself. Only "in/at/near/around <word>" counts: a bare branch name is a
  // name, which is correct usage and must not be flagged.
  //
  // The paster notes are excluded. They are instructions to a human, not
  // copy that gets pasted into GBP, and they need to be able to quote the
  // wrong form in order to warn against it. Same treatment postsOf gives
  // them.
  const pasteable = text.split(/^Notes for the paster:/m)[0].replace(/\s*\n\s*/g, " ");
  for (const bw of BRANCH_WORDS) {
    // "local to" joined the prepositions on the item 4.2 quality pass,
    // 2026-08-11, because a real breach had been sitting behind it since
    // item 5.7 landed. mccanns-sandringham.md told the paster to use the
    // landing page "so the profile stays local to Sandringham", written on
    // 2026-08-04 when Sandringham was still that branch's seoTown. Q15 moved
    // the local word to St Michael's and every generated page followed, but
    // this line did not, and the rule read only in/at/near/around, so the one
    // sentence in the pack that names the town the profile is being aimed at
    // was the one construction it could not see.
    const re = new RegExp(`\\b(?:in|at|near|around|local to)\\s+${escapeRe(bw.word)}\\b`, "gi");
    const hits = pasteable.match(re) || [];
    if (!hits.length) continue;
    const key = `${id}::branchWordAsPlace::${bw.word}`;
    const known = KNOWN_BRANCH_WORD[key];
    if (known) {
      seenBranchWordKnown[key] = true;
      warn(file, `KNOWN "${hits[0]}" reads "${bw.word}" as a place. ${known.question}: ${known.reason}`);
    } else {
      fail(file, `"${hits[0]}" reads "${bw.word}" as a place, but "${bw.word}" is the branch name of ${bw.branchName} and is not a place in branches.json: it is no branch's seoTown and appears in no serviceAreaList. That branch's local word is "${bw.seoTown}", which is what all of its pages lead with. Name the branch and its town, as the landing pages do: "${bw.branchName} in ${bw.seoTown}".`);
    }
  }

  // --- business description length ------------------------------------
  const desc = descriptionOf(text);
  if (desc === null) {
    fail(file, "business description body could not be read");
  } else {
    // GBP counts the pasted description. Packs wrap lines for readability,
    // so join wrapped lines to a single paragraph before counting.
    const oneLine = desc.replace(/\s*\n\s*/g, " ").trim();
    if (oneLine.length > 750) {
      fail(file, `business description is ${oneLine.length} characters, over the 750 GBP limit`);
    }
    // The heading usually states its own count. If it does, it must be true.
    //
    // This rule carried a Math.abs(...) > 5 tolerance until the fourth
    // quality pass of item 4.12 on 2026-08-13, and the tolerance is why the
    // rule did not do what the line above it says. An eleven-character window
    // (-5 to +5) sat around a number that is meant to be exact, so an edit
    // that changed the description by up to five characters left the heading
    // stating a figure that was no longer true and every checker green. The
    // pass found it by lengthening "for years" to "for many years", exactly
    // five characters, which is not "> 5" and so passed.
    //
    // The tolerance bought nothing. descriptionOf() and the join above are
    // deterministic, and all fifteen packs plus TEMPLATE.md were measured on
    // the same pass: every pack that states a count matches it exactly, none
    // off by even one, so no pack ever needed the slack. What the slack did
    // instead was let the one number the paster is told to trust drift.
    //
    // The hard 750 limit above is separately enforced and was verified
    // against a 771-character injection on the same pass, so an over-length
    // description cannot reach a profile through this gap. The exposure here
    // is a stale claim, not a truncated paste: five packs sit within fifteen
    // characters of the limit (fishlocks-ainsdale 746, hirshmans-ainsdale
    // 743, scorah-bramhall 742, cherry-lane-walton 736, sk-chemists-bootle
    // 735), and on those a heading understating the true length by five is
    // the difference between a paster reading headroom that exists and
    // headroom that does not.
    const stated = text.match(/^##\s*1\.\s*Business description[^\n]*?this is (\d+)/mi);
    if (stated) {
      const claimed = Number(stated[1]);
      if (claimed !== oneLine.length) {
        fail(file, `description heading claims ${claimed} characters, actual is ${oneLine.length}`);
      }
    }
  }

  // --- post lengths ----------------------------------------------------
  // The body measured here has the "Button:" line and any paster instruction
  // block cut out by postsOf, so it is the copy that actually reaches the
  // profile and nothing else. The cut needs a floor under it: a marker put
  // above the copy rather than below it would leave an empty body, and an
  // empty body would sail through a maximum-length rule while publishing a
  // post with nothing in it. So an empty or near-empty body fails, and a
  // stripped instruction block that leaves no copy behind says which marker
  // swallowed it.
  const postLens = [];
  for (const p of postsOf(text)) {
    const len = p.body.replace(/\s*\n\s*/g, " ").trim().length;
    postLens.push(`${p.label.split(" ")[1] || p.label}=${len}`);
    if (len > 1500) fail(file, `${p.label} is ${len} characters, over the 1,500 limit`);
    if (len < 40) {
      fail(file, p.note
        ? `${p.label} has only ${len} characters of posted copy once its paster instruction block is set aside, so the instruction marker ("${norm(p.note).slice(0, 40)}") sits above the copy instead of below it and the post would publish empty`
        : `${p.label} has only ${len} characters of body, so there is no post to publish`);
    }
  }
  stats.push({
    file,
    desc: desc === null ? "n/a" : desc.replace(/\s*\n\s*/g, " ").trim().length,
    posts: postLens.join(" "),
  });

  // --- advertising compliance ------------------------------------------
  for (const h of findTerms(text, MEDICINE_NAMES)) {
    fail(file, `line ${h.line}: medicine name "${h.term}" - POM advertising to the public is not permitted. Context: ${h.text}`);
  }
  for (const h of findTerms(text, EFFICACY_FAIL)) {
    fail(file, `line ${h.line}: efficacy claim "${h.term}". Context: ${h.text}`);
  }
  // The shared list, applied to the pack because a GBP post is an advertisement
  // and a generated page is not. See the CLAIM_PATTERNS comment at the top.
  for (const h of findClaims(text, CLAIM_PATTERNS)) {
    fail(file, `line ${h.line}: efficacy claim "${h.term}" (${h.reason}), from the shared tools/claim-patterns.js that check-weight-loss-copy.js applies to the generated pages. A pack is pasted into a public Google profile as an advertisement, so it cannot say what an inner page may not. Context: ${h.text}`);
  }
  for (const h of findTerms(text, EFFICACY_WARN)) {
    warn(file, `line ${h.line}: check wording "${h.term}". Context: ${h.text}`);
  }
  // --- no outcome promises -----------------------------------------------
  // Added on the item 4.7 sixth quality pass, 2026-08-29. The 4.7 fifth pass
  // (2026-08-13) recorded, unfixed, that an absolute protection guarantee
  // injected into Post D passed every checker, and the 4.15 pass earlier on
  // 2026-08-29 closed that gap for the generated pages only (RULE 12 of
  // check-travel-clinic-copy.js reads modules/service/pages, not this
  // folder). Re-proved by mutation on this pass after that fix shipped:
  // "We guarantee full protection for every destination." in Post D of
  // gbp-packs/mccanns-sandringham.md passed all 36 checkers, because
  // EFFICACY_FAIL above carries guarantee wording about RESULTS, not about
  // protection. A pack is pasted onto a public Google profile as an
  // advertisement, so it cannot promise what a page may not. The patterns are
  // shared with RULE 12 via tools/outcome-promise-patterns.js so the two
  // cannot drift, and the question exemption is RULE 12's own: a question is
  // not a promise.
  {
    const packLines = text.split(/\r?\n/);
    for (const [re, reason] of OUTCOME_PROMISE) {
      packLines.forEach((line, i) => {
        const m = line.match(re);
        if (!m) return;
        const sentence = (line.split(/(?<=[.!?])\s+/).find((s) => s.indexOf(m[0]) !== -1) || line).trim();
        if (/\?$/.test(sentence)) return; // a question is not a promise
        fail(file, `line ${i + 1}: outcome promise "${norm(m[0])}" (${reason}), from the shared tools/outcome-promise-patterns.js that RULE 12 of check-travel-clinic-copy.js applies to the generated pages. No pack may promise protection or immunity as an outcome; the copy may only say what the service is and that suitability is decided at the consultation. Context: ${norm(line).slice(0, 90)}`);
      });
    }
  }

  // --- promoting a POM without naming it ---------------------------------
  // Added on the item 4.13 quality pass, 2026-08-14, by injection into Post C
  // of gbp-packs/riddings-timperley.md. The three rules above read the pack
  // for medicine NAMES (pom-names.js) and for efficacy CLAIMS
  // (claim-patterns.js). Neither can see a medicine that is promoted without
  // being named and without a claim being made about it, and that is a ruled
  // breach in its own right rather than a near miss. Five injections, one at a
  // time, each reverted and the file sha256-compared back afterwards, ALL FIVE
  // PASSED ALL 36 CHECKERS:
  //
  //   "The pharmacist-led weight loss injection clinic at Riddings Pharmacy"
  //   "The skinny jab clinic at Riddings Pharmacy"
  //   "Our GLP-1 clinic at Riddings Pharmacy"
  //   "... offers a weekly injection after a consultation"
  //   "The pharmacist-led weight loss pen service at Riddings Pharmacy"
  //
  // Every one of those is already caught on the six branch landing pages, by
  // RULE 11 of check-weight-loss-copy.js. Measured on this pass rather than
  // assumed, and the first draft of this comment had it wrong: they are NOT
  // caught on the 15 weight loss pages in modules/service/pages, because
  // POM_CLASS belongs to rule 11 and rule 11 reads modules/branch/pages only.
  // Injecting "skinny jab", "GLP-1" and "weight loss injection" into
  // weight-loss-clinic-cherry-lane-walton.html left that checker at exit 0,
  // and into pharmacy-fishlocks-ainsdale.html failed it every time. Q77 asks
  // Rishi whether the service pages should read these patterns too; it is a
  // live patient-facing regulatory judgement, so it is not decided here.
  //
  // The pack that feeds the Google profile those landing pages are linked FROM
  // had no such rule, so the most exposed surface in the estate was the least
  // guarded. Same shape as the item 4.15 and 2.2 findings on Pharmacy First
  // cost and the item 2.1 finding on rule 11 scoping: a rule written for one
  // folder, and a second folder publishing the same claim to the same patient.
  //
  // The patterns were moved to tools/pom-class-patterns.js to be read here and
  // there from one definition, on the condition check-weight-loss-copy.js set
  // in its own header when it declined to promote them: "if a second Regime 1
  // family ever needs them, promote them then". The packs are that family.
  //
  // Scope. SELF_SCOPING reads the whole pack: "skinny jab" is wrong in a
  // paster note as surely as in a post. IN_CONTEXT reads only sentences that
  // name weight loss, because "once a week" and "weekly injection" are
  // ordinary English elsewhere and the contraception service legitimately
  // signposts a contraceptive injection. Reading those across the whole pack
  // would fail correct copy and the rule would then be widened until it caught
  // nothing, which is the trap the "guarantee" note on the item 4.8 pass and
  // the "option" note on the item 4.12 pass both record.
  //
  // All 16 packs including TEMPLATE.md were swept before this rule was wired
  // and none matches either list, so it asserts nothing new about live copy
  // and the gap it closes was latent.
  const pomClassHit = POM_CLASS.findSelfScoping(text);
  if (pomClassHit) {
    fail(file, `this pack alludes to a prescription-only weight loss medicine without naming it, by ${pomClassHit.why}: "${pomClassHit.match}". The ASA has ruled that this promotes a POM to the public just as naming it does, and a pack is pasted into a public Google profile, which is Regime 1 in compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md, the advertising regime with the near-total prohibition. Naming no medicine is not enough if the copy points at one anyway. Patterns in tools/pom-class-patterns.js`);
  }
  for (const seg of splitSentences(text)) {
    const ctxHit = POM_CLASS.findInContext(seg);
    if (ctxHit) {
      fail(file, `this pack describes ${ctxHit.why} in a sentence about weight loss: "${ctxHit.match}". A dosing schedule identifies the medicine class without naming it, which the ASA treats as promoting the POM, and a GBP pack is Regime 1 advertising. Patterns in tools/pom-class-patterns.js. Sentence: ${seg.slice(0, 120)}`);
    }
  }

  // --- body image and social proof ---------------------------------------
  // See the BODY_IMAGE_SELF comment at the top of this file for the seven
  // injections that proved this was unguarded, and for why the rule stops at
  // the pack instead of being shared with the generated pages.
  for (const h of findClaims(text, BODY_IMAGE_SELF)) {
    fail(file, `line ${h.line}: this pack sells weight loss on body image rather than on the service, by ${h.reason}: "${h.term}". The house standards put this with the social responsibility rulings that turn on exploiting body image (compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md section 7). An inner page the customer chose to visit gets some latitude there; a pack is pasted into a public Google profile, which is Regime 1, the advertising regime, and gets none. Context: ${h.text}`);
  }
  // The in-context half needs a unit BIGGER than the sentence, and the first
  // negative test on this rule is what proved it. "Do not let your weight hold
  // you back any longer." and "Join hundreds of local patients who have already
  // slimmed down." are both squarely about weight loss, and neither contains
  // the phrase "weight loss": split into sentences and gated on
  // POM_CLASS.namesWeightLoss, both walked straight back through the rule that
  // had just been written to catch them. The sentence gate is right for
  // POM_CLASS, where the risk is a contraceptive injection being read as a
  // weight loss one, and wrong here, where the selling sentence names a
  // feeling rather than the service.
  //
  // The post is the honest unit. Post C IS the weight loss advertisement by
  // construction, so its whole body is a weight loss context and is read as
  // one. Everywhere else in the pack the sentence gate still applies, so a
  // stray "slim down" in the travel clinic post is not read as weight loss
  // copy. Hits are de-duplicated by phrase so a breach inside Post C is
  // reported once rather than twice.
  const bodyImageSurfaces = postsOf(text)
    .filter((p) => /weight\s*loss/i.test(p.label))
    .map((p) => p.body)
    .concat(splitSentences(text).filter((s) => POM_CLASS.namesWeightLoss(s)));
  const bodyImageSeen = new Set();
  for (const surface of bodyImageSurfaces) {
    for (const [re, why] of BODY_IMAGE_CONTEXT) {
      const m = surface.match(re);
      if (!m) continue;
      const key = `${why}::${m[0].toLowerCase()}`;
      if (bodyImageSeen.has(key)) break;
      bodyImageSeen.add(key);
      fail(file, `this pack uses ${why} in its weight loss copy: "${m[0]}". A GBP pack is Regime 1 advertising under the house standards, where the appeal has to rest on the service and its qualifiers rather than on how the reader is invited to feel about their body (compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md section 7). Context: ${norm(surface).slice(0, 120)}`);
      break;
    }
  }

  // --- the qualifiers on the two private clinics -------------------------
  // The other direction from every rule above: what a pack must SAY, not what
  // it may not. See the CLINIC_QUALIFIERS comment at the top for the six
  // injections that proved this was unguarded, and why a GBP post is the
  // stricter of the two weight loss regimes.
  //
  // Gated on the branch's widget set, so a branch that runs neither clinic is
  // never asked for a qualifier on a service it does not offer, and the pack
  // only has to carry the wording on a surface it actually uses: if a pack has
  // no weight loss post, the post-level weight loss rules do not apply to it.
  // That is the same gating the services and categories rules above use.
  const qualPosts = postsOf(text);
  const qualSvc = norm((text.match(/^##\s*3\.\s*Services section content[^\n]*\n([\s\S]*?)(?=^##\s)/m) || [])[1]);
  const qualMissing = [];
  for (const q of CLINIC_QUALIFIERS) {
    if (!(b.widgets || {})[q.widget]) continue;
    let surface = null;
    let surfaceName = "";
    if (q.where === "post") {
      const p = qualPosts.find((x) => q.postRe.test(x.label));
      if (!p) continue;
      surface = norm(p.body);
      surfaceName = p.label;
    } else {
      if (!qualSvc) continue;
      surface = qualSvc;
      surfaceName = "Services section";
    }
    if (!q.re.test(surface)) {
      qualMissing.push({ key: q.key, surfaceName, what: q.what, why: q.why });
    }
  }
  if (qualMissing.length) {
    const knownKey = `${id}::clinicQualifiers`;
    const known = KNOWN_CLINIC_QUALIFIER[knownKey];
    if (known) {
      seenClinicQualifierKnown[knownKey] = true;
      warn(file, `known exception (${known.question}): ${qualMissing.length} private-clinic qualifier(s) missing - ${qualMissing.map((m) => m.key).join(", ")}. ${known.reason}`);
    } else {
      for (const m of qualMissing) {
        fail(file, `${m.surfaceName} does not state ${m.what}. This is copy pasted into a public Google Business Profile, which is an advertisement, and ${m.why}. 12 of the 15 packs state it. If this pack is deliberately different, add "${knownKey}" to KNOWN_CLINIC_QUALIFIER with a question id.`);
      }
    }
  }

  // --- house style -------------------------------------------------------
  text.split(/\r?\n/).forEach((line, i) => {
    if (EM_DASH.test(line)) fail(file, `line ${i + 1}: em dash, house style is standard hyphens only. Context: ${norm(line).slice(0, 90)}`);
    if (ENTITY_DASH.test(line)) fail(file, `line ${i + 1}: HTML entity dash. A pack pastes as plain text, so this reaches the public profile as literal characters. Context: ${norm(line).slice(0, 90)}`);
    if (EMOJI.test(line)) fail(file, `line ${i + 1}: emoji, house style is no emojis. Context: ${norm(line).slice(0, 90)}`);
  });

  // --- facts against branches.json ---------------------------------------
  const packDigits = text.match(/\b0\d[\d\s]{8,13}\b/g) || [];
  const ownPhone = digits(b.phone);
  for (const raw of packDigits) {
    const d = digits(raw);
    if (d.length < 10 || d === ownPhone) continue;
    const other = branches.find((x) => digits(x.phone) === d);
    if (other) fail(file, `phone ${norm(raw)} belongs to ${other.branchName}, not ${b.branchName}`);
    else warn(file, `phone-like number ${norm(raw)} is not ${b.branchName}'s number in branches.json`);
  }
  if (ownPhone && digits(text).indexOf(ownPhone) === -1) {
    fail(file, `branch phone ${b.phone} does not appear anywhere in the pack`);
  }

  // --- the phone in PUBLISHED copy ---------------------------------------
  // The two rules directly above guard the phone in two ways, and a pack that
  // publishes a wrong number satisfies both. The sister rule only fails when
  // the wrong number happens to be another branch's; anything else is a WARN.
  // The presence rule only asks whether the right number appears SOMEWHERE in
  // the file, so in a pack that prints the phone more than once, changing one
  // copy leaves the others to satisfy it. Confirmed by injection on the item
  // 4.10 pass, 2026-08-13: one digit changed in a post body of
  // clear-aintree.md, coleman-leigh-walton.md and riddings-timperley.md passed
  // all 31 checkers. Run 165 predicted this gap on the 4.9 pass and deferred
  // it for the scope decision below.
  //
  // A mistyped digit is the substitution a careless edit actually makes, and
  // it is the one no reader detects, because a plausible local number reads as
  // correct. Pasted into a Google Business Profile it is worse than a missing
  // number: it publishes a dead line, or somebody else's, as the way to reach
  // a pharmacy.
  //
  // Scope is the published copy only, the same scope the two town rules below
  // use: the business description and the post bodies. The preamble and the
  // "Notes for the paster" block are instructions and never reach the profile,
  // and that is exactly where the estate's legitimate wrong numbers sit.
  // clear-aintree.md quotes the number its own website publishes in order to
  // document Q28, and hirshmans-ainsdale.md quotes a number that does not dial
  // for the same reason. A rule reading the whole file would fail both for
  // saying the true thing, which is why this is scoped rather than absolute.
  const phoneScopes = [];
  const descForPhone = descriptionOf(text);
  if (descForPhone) phoneScopes.push(["business description", descForPhone]);
  // Section 3 joins the scope on the item 4.11 pass, 2026-08-14: see the note
  // on servicesOf() above. A wrong number in a Services entry publishes on the
  // same profile as a wrong number in the description.
  const servicesForPhone = servicesOf(text);
  if (servicesForPhone) phoneScopes.push(["services section", servicesForPhone]);
  for (const p of postsOf(text)) phoneScopes.push([p.label, p.body]);
  const publishedPhoneBreaches = [];
  for (const [scope, body] of phoneScopes) {
    for (const raw of String(body || "").match(/\b0\d[\d\s]{8,13}\b/g) || []) {
      const d = digits(raw);
      if (d.length < 10 || d === ownPhone) continue;
      const other = branches.find((x) => isPackable(x) && digits(x.phone) === d);
      const whose = other ? `, which is ${other.branchName}'s number,` : "";
      publishedPhoneBreaches.push(
        `the ${scope} publishes the phone number ${norm(raw)}${whose} but branches.json holds ${b.phone} for ${b.branchName}. This copy is pasted verbatim into the public Google profile, so it publishes a number that is not this pharmacy's. The presence rule above does not see it, because ${b.phone} still appears elsewhere in the pack, and the sister rule only fails a number that belongs to another branch`
      );
    }
  }
  if (publishedPhoneBreaches.length) {
    const key = `${b.id}::publishedPhone`;
    const known = KNOWN_PUBLISHED_PHONE[key];
    if (known) {
      seenPublishedPhoneKnown[key] = true;
      warn(file, `KNOWN ${publishedPhoneBreaches[0]}. ${known.question}: ${known.reason}`);
    } else {
      for (const msg of publishedPhoneBreaches) fail(file, msg);
    }
  } else if (KNOWN_PUBLISHED_PHONE[`${b.id}::publishedPhone`]) {
    seenPublishedPhoneKnown[`${b.id}::publishedPhone`] = false;
  }

  // --- pack links against the pages this repo actually generates ---------
  const ownHost = String(b.website || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  for (const link of text.match(/https?:\/\/[^\s)"'<>]+/g) || []) {
    const clean = link.replace(/[.,]$/, "");
    const host = clean.replace(/^https?:\/\//, "").split("/")[0];
    if (!/pharmacy|chemist|rbhealth/i.test(host)) continue;
    if (ownHost && host.toLowerCase() !== ownHost.toLowerCase()) {
      fail(file, `link points at ${host}, but this branch's website is ${ownHost}: ${clean}`);
      continue;
    }
    const seg = clean.split("/").slice(3).join("/");
    if (!seg) continue;
    if (!/\.html$/i.test(seg)) {
      warn(file, `link has no .html ending, which Weebly pages normally need: ${clean}`);
      continue;
    }
    if (!GENERATED.has(seg.toLowerCase())) {
      warn(file, `link target "${seg}" is not a page this repo generates, so it is a live-only page no checker here can keep correct`);
    }
  }

  // --- post buttons point at this branch's own page ----------------------
  // The link rule above proves every link in the pack is on the right host
  // and that the page exists. It cannot see WHICH page a given post should
  // carry, so a Post D pointing at the weight loss page, or at the SISTER
  // branch's travel page on the same shared host, passes it clean. That
  // matters more than it reads: the button is the only clickable thing on a
  // Google post, Fishlocks, McCanns and Scorah each run two branches on one
  // domain, so on those six packs the wrong leaf is not a 404 that anyone
  // would notice, it is a working page for the wrong pharmacy, and the Q10
  // work on 2026-08-07 pasted these packs into live profiles.
  //
  // The correct page is DERIVED from branches.json rather than listed here,
  // using the same <type>-<brandSlug>-<townSlug>.html rule the generators
  // build with (tools/build-switch-pages.js) and the same rule landingSlug
  // uses above, so a branch renamed in branches.json moves its expected
  // buttons with it and the two cannot drift.
  const pageFor = (kind) =>
    b.brandSlug && b.townSlug ? `${kind}-${b.brandSlug}-${b.townSlug}.html` : null;
  const BUTTON_PAGE = {
    B: { kind: "switch-prescriptions", what: "switch page" },
    C: { kind: "weight-loss-clinic", what: "weight loss clinic page" },
    D: { kind: "travel-clinic", what: "travel clinic page" },
  };
  for (const p of buttonsOf(text)) {
    if (!p.letter) continue;
    if (!p.line) {
      fail(file, `${p.label} has no "Button:" line, so the post would publish with nothing to click and no way through to the page it is about`);
      continue;
    }
    if (!p.url) {
      fail(file, `${p.label} has a "Button:" line carrying no link: ${p.line}`);
      continue;
    }
    const leaf = p.url.split("/").pop().toLowerCase();

    if (p.letter === "A") {
      // Pharmacy First. Two destinations are correct and which one applies is
      // worklist item 5.3's business: the live pfLink in branches.json today,
      // or this branch's own generated page once 5.3 repoints those links.
      // A branch with no pfLink and no pharmacyFirst widget runs no Pharmacy
      // First service at all, so its Post A is a different post (Clear Chemist
      // labels its own "replaces Pharmacy First") and the rule does not apply.
      if (!b.pfLink && !(b.widgets || {}).pharmacyFirst) continue;
      const own = pageFor("pharmacy-first");
      const okPf = !!b.pfLink && p.url === b.pfLink;
      const okOwn = !!own && leaf === own.toLowerCase() && GENERATED.has(own.toLowerCase());
      if (!okPf && !okOwn) {
        fail(file, `${p.label} button goes to "${leaf}", but this branch's Pharmacy First destination in branches.json is ${b.pfLink || "(pfLink not set)"}, and the only other correct target is its own generated page ${own || "(no brandSlug or townSlug)"}`);
      }
      // The two targets are equally correct in general, but not for a branch
      // whose generated page is confirmed live as a stale paste. See
      // PF_TARGET_HOLD at the top of this file.
      const hold = PF_TARGET_HOLD[id];
      if (hold && okOwn) {
        fail(file, `${p.label} button goes to this branch's own generated Pharmacy First page "${leaf}", but that swap is on hold (${hold.question}): ${hold.reason}. The pfLink page ${b.pfLink || "(pfLink not set)"} is the correct target until the generated page has been repasted from this repo and its heading checked against branchName. Repaste first, then clear the ${id} entry from PF_TARGET_HOLD in tools/check-gbp-packs.js in the same session`);
      }
      continue;
    }

    const rule = BUTTON_PAGE[p.letter];
    if (!rule) continue;
    const want = pageFor(rule.kind);
    if (!want) {
      fail(file, `branches.json gives this branch no brandSlug or townSlug, so the ${rule.what} ${p.label} should link to cannot be worked out`);
      continue;
    }
    if (leaf !== want.toLowerCase()) {
      fail(file, `${p.label} button goes to "${leaf}", but this branch's ${rule.what} is "${want}", built as <type>-<brandSlug>-<townSlug>.html from branches.json. On a shared domain a wrong leaf is the sister branch's page, which loads fine and sends the click to the wrong pharmacy`);
      continue;
    }
    if (!GENERATED.has(want.toLowerCase())) {
      fail(file, `${p.label} button goes to "${want}", which is the right name for this branch's ${rule.what} but is not a page this repo generates, so the post would publish a button onto a page nothing here builds`);
    }
  }

  // --- post button LABELS, not only their destinations --------------------
  // The loop above proves every button points at the right page. It reads the
  // URL out of the "Button:" line and nothing else. The WORDS on the button
  // were read by no rule in this file, and they could not be picked up
  // anywhere else either, because postsOf() strips the whole "Button:" line
  // out of the post body before the POM and efficacy scan runs over it. So
  // the one line on a Google post that is both public copy AND the only
  // clickable control sat outside every content rule in the repo. Proved by
  // injection on the item 4.5 pass, 2026-08-13: a Post C reading
  // "Button: Buy now -> .../weight-loss-clinic-scorah-hazel-grove.html"
  // passed all 30 checkers, with the link, the body and the page all correct.
  //
  // Why this is the expensive direction and not a cosmetic one. The house
  // reference (compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md section 6, and
  // AI\RBH_WeightLoss_Advertising_Standards.md behind it) bars "Buy [product]"
  // style controls on a prescription-only service, and treats a treatment
  // picker as the same journey in softer words. A Google post is Regime 1 in
  // that reference, the proactive advertising regime with the near-total
  // prohibition, not the inner-page exemption. And "Buy" is not a label
  // anybody has to invent: it is one of the options in Google's own button
  // picker, sitting in the dropdown beside "Book", so the wrong choice is one
  // click away for the person pasting. This pack is the sheet that tells them
  // which one to choose, which is exactly why the sheet has to be right.
  //
  // Allowlist, not blocklist, for the reason the services rule above gives:
  // a blocklist only catches a wording somebody already thought to name. The
  // vocabulary below is the complete set in use across all 15 packs on
  // 2026-08-13, derived by reading their 60 button lines rather than from
  // memory: "Learn more" on Posts A and B, "Book" on Posts C and D.
  const RECOGNISED_CTAS = ["Learn more", "Book"].map((s) => s.toLowerCase());
  // Not the defence. The allowlist above is. These are the transactional
  // options in Google's own picker, named only so that when one of them turns
  // up on a POM post the failure says WHY it is barred rather than only that
  // it is unrecognised.
  const TRANSACTIONAL_CTAS = [
    "Buy", "Buy now", "Order online", "Order now", "Shop", "Sign up",
  ].map((s) => s.toLowerCase());
  const POM_POSTS = { C: "weight loss", D: "travel vaccination" };
  for (const p of buttonsOf(text)) {
    if (!p.letter || !p.line || !p.url) continue;
    if (!p.cta) {
      fail(file, `${p.label} has a "Button:" line with no label before the link, so the pack does not tell the paster which button to pick in Google's picker: ${p.line}`);
      continue;
    }
    const cta = p.cta.toLowerCase();
    if (RECOGNISED_CTAS.includes(cta)) continue;
    if (TRANSACTIONAL_CTAS.includes(cta) && POM_POSTS[p.letter]) {
      fail(file, `${p.label} is the ${POM_POSTS[p.letter]} post and its button is labelled "${p.cta}". A transactional call to action on a prescription-only service is the "Buy [product]" control the house standards bar, and a Google post sits in the advertising regime where that prohibition is near-total (compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md). Use "Book" or "Learn more"`);
      continue;
    }
    fail(file, `${p.label} button is labelled "${p.cta}", which is not a button label any pack in this repo uses. The button is public copy and the only clickable control on the post, so a new label is a new call to action reaching patients. If it is genuinely wanted, add it to RECOGNISED_CTAS in tools/check-gbp-packs.js deliberately, having checked it against the house advertising standards first`);
  }

  // --- no lead pricing or offer wording in the posted copy -----------------
  // Found by the same injection round as the button label rule above, and it
  // is the other half of the same hole. The POM and efficacy scan reads the
  // post bodies, so a named medicine or a superlative is caught. Neither is
  // what the house reference actually rules on hardest in the advertising
  // regime. Section 5 of compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md turns
  // on PRICE: a single lead price placed before any eligibility wording
  // "encourages entry on price", and it records "POM only special offers or
  // discounted prices" and "treatments start from ..." as ruled breaches in
  // ads (Phlo, Juniper, Hexpress, 9 July 2025). That is wording, not a
  // medicine name, so nothing in this repo was looking for it.
  //
  // Proved by injection on 2026-08-13: "Weight loss from just 99 pounds a
  // month." and "Half price for the first month, this week only." both walked
  // past all 30 checkers inside Post C. A pound sign happened to trip
  // check-em-dashes.js on its non-ASCII rule, which is luck rather than a
  // pricing rule, and it disappears the moment the price is written in words.
  //
  // Scope is the four post bodies, which are the copy that actually publishes.
  // The reference permits a factual price LIST on an inner page the customer
  // chooses to visit; a Google post is not that page, it is Regime 1, the
  // proactive advertising regime. No pack in the estate carries a price in a
  // post body today, so this rule asserts nothing new about live copy: it
  // stops one being added silently.
  //
  // "Free" is deliberately NOT a trigger. Every pack says "free NHS services",
  // "free NHS assessment" and "free blood pressure checks", which is the
  // correct description of an NHS service and the opposite of a promotion.
  const PRICE_PATTERNS = [
    [/£\s?\d/, "a price"],
    [/\b\d+(?:\.\d{1,2})?\s*(?:pounds|quid|gbp)\b/i, "a price written in words"],
    [/\bfrom\s+(?:just\s+|only\s+)?\d/i, 'a "from" lead price'],
  ];
  const OFFER_PATTERNS = [
    [/\bspecial offers?\b/i, "a special offer"],
    [/\bhalf[- ]price\b/i, "a half-price offer"],
    [/\bdiscount(?:ed|s)?\b/i, "a discount"],
    [/\b\d+\s*%\s*off\b/i, "a percentage discount"],
    [/\bthis week only\b|\blimited time\b|\bwhile stocks last\b/i, "a time-limited offer"],
    [/\bsave\s+£?\s?\d/i, "a saving claim"],
  ];
  // Section 3 joins the four post bodies on the item 4.11 pass, 2026-08-14:
  // see the note on servicesOf() above. A Services entry is pushed onto the
  // public profile exactly as a post is, so a lead price or a discount in one
  // is the same advertising the rule below bars in the other.
  const priceScopes = postsOf(text).map((p) => ({ label: p.label, body: p.body }));
  const servicesForPrice = servicesOf(text);
  if (servicesForPrice) priceScopes.push({ label: "The services section", body: servicesForPrice });
  for (const p of priceScopes) {
    for (const [re, why] of PRICE_PATTERNS) {
      const hit = p.body.match(re);
      if (!hit) continue;
      fail(file, `${p.label} carries ${why} in the posted copy ("${norm(hit[0])}"). A Google post is advertising, not an inner page the customer chose to visit, and the house standards bar lead pricing that encourages entry on price, naming "treatments start from ..." as a ruled breach (compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md section 5). Keep price out of the post and let the consultation page carry it`);
      break;
    }
    for (const [re, why] of OFFER_PATTERNS) {
      const hit = p.body.match(re);
      if (!hit) continue;
      fail(file, `${p.label} carries ${why} in the posted copy ("${norm(hit[0])}"). Highlighted offers and discounts on a pharmacy service are barred in the advertising regime the house standards apply to a Google post (compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md section 5). Note "free NHS ..." is not this: an NHS service being free of charge is a fact, not an offer`);
      break;
    }
  }

  const pcRe = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/g;
  const ownPc = norm(b.postalCode).toUpperCase().replace(/\s+/g, "");
  const foundPcs = new Set((text.match(pcRe) || []).map((p) => p.toUpperCase().replace(/\s+/g, "")));
  if (ownPc && !foundPcs.has(ownPc)) {
    fail(file, `branch postcode ${b.postalCode} does not appear anywhere in the pack`);
  }
  for (const pc of foundPcs) {
    if (pc === ownPc) continue;
    const other = branches.find((x) => norm(x.postalCode).toUpperCase().replace(/\s+/g, "") === pc);
    if (other) fail(file, `postcode ${pc} belongs to ${other.branchName}, not ${b.branchName}`);
  }

  // --- the street address and the review link ----------------------------
  // Two fields no checker had ever read in a pack, found on the item 4.7
  // quality pass, 2026-08-11. Both are pure copy in a markdown file, so the
  // repo's other guards cannot see them: check-nap and check-jsonld read
  // generated pages, and check-branch-links reads the fields in
  // branches.json rather than anything that quotes them.
  //
  // Both are the same silent class as the map iframe in check-jsonld and the
  // booking chain in check-booking-routes: a wrong value here reads perfectly
  // well, breaks no rule anything else enforces, and only shows up in the
  // world.
  //
  // The street address is the line that puts a pin on Google Maps. It is not
  // hypothetical that a sister branch's number could be pasted into the wrong
  // pack: three brands run two shops each, and McCanns runs both of its shops
  // on ONE road, at 1b Aigburth Road and 112 Aigburth Road. The postcode rule
  // above would not catch a swapped house number, because a pack that quoted
  // the sister's street but its own postcode passes every existing rule.
  //
  // The review link is the line the whole profile is judged on. Every branch's
  // link is https://g.page/r/<opaque id>/review, so two of them differ only in
  // a string no human proof-reads. Paste the sister's and this shop's review
  // requests land on the sister's profile: one profile's rating grows on
  // another's custom, and nothing anywhere reports it. check-branch-links
  // already proves the field in branches.json is well formed and unique per
  // branch, which is exactly why the remaining risk is in the copying.
  const flatText = norm(text).toLowerCase();

  // The name the paster sets on the profile. Added by the item 4.2 quality
  // pass, 2026-08-11, for the same reason as the two fields below: it is a
  // profile-basics line that nothing had ever read.
  //
  // It is the field the whole listing is identified by, and it is the one
  // Google acts on by itself. Its own rule is that the name must be the
  // real-world name of the business, so a name carrying extra service words
  // is a name Google can edit or suspend without asking, and the pack is
  // what the profile gets restored from when it does. Three brands run two
  // shops each, and those pairs differ by a single word, so a pack that
  // states the sister's name renames the wrong shop on Google: exactly the
  // class of fault the street-address rule below was added for.
  //
  // Exact match against branchName in branches.json, the trading name every
  // generated page in the estate already leads with, so the profile and the
  // site cannot claim to be two businesses. Where a listing genuinely needs
  // a different name, KNOWN_IDENTITY takes it with a question id rather than
  // the rule being loosened. Note this reads the pack's INSTRUCTION, not
  // what Google currently shows: cherry-lane-walton.md records in prose that
  // the live listing reads "Cherry Lane Pharmacy - Travel Vaccination and
  // Simple Weight Loss Clinic" and that changing it is a separate decision,
  // which is a pack correctly reporting a divergence, not claiming it.
  const nameLine = (text.match(/^-\s*Name on GBP:[^\n]*(?:\n\s{2,}[^\n]*)*/m) || [])[0] || "";
  const statedName = norm(nameLine.replace(/^-\s*Name on GBP:/, ""));
  const nameKey = `${b.id}::gbpName`;
  const nameKnown = KNOWN_IDENTITY[nameKey];
  const nameFail = (msg) => {
    if (nameKnown) { seenIdentityKnown[nameKey] = true; warn(file, `KNOWN ${msg} ${nameKnown.question}: ${nameKnown.reason}`); }
    else fail(file, msg);
  };
  if (!nameLine) {
    nameFail(`no "- Name on GBP:" line in the profile basics, so the pack does not say what the listing should be called. The trading name in branches.json is "${b.branchName}".`);
  } else if (statedName !== norm(b.branchName)) {
    const other = branches.find((x) => x.id !== b.id && norm(x.branchName) === statedName);
    nameFail(other
      ? `the "- Name on GBP:" line reads "${statedName}", which is ${other.branchName}'s trading name in branches.json, not this branch's "${b.branchName}", so the paster would rename the wrong shop on Google.`
      : `the "- Name on GBP:" line reads "${statedName}", but branches.json gives this branch the trading name "${b.branchName}", which is the name every generated page it owns leads with. Google's own rule is that a listing carries the real-world business name, so the profile and the site must not claim to be two businesses.`);
  }

  const ownStreet = norm(b.streetAddress || "");
  if (ownStreet && flatText.indexOf(ownStreet.toLowerCase()) === -1) {
    const key = `${b.id}::streetAddress`;
    const known = KNOWN_IDENTITY[key];
    if (known) {
      seenIdentityKnown[key] = true;
      warn(file, `KNOWN branch street address "${b.streetAddress}" does not appear in the pack. ${known.question}: ${known.reason}`);
    } else {
      fail(file, `branch street address "${b.streetAddress}" does not appear anywhere in the pack, so the paster has nothing to set the profile address from`);
    }
  }
  for (const other of branches) {
    if (other.id === b.id) continue;
    const s = norm(other.streetAddress || "");
    // Two entries genuinely share premises (Clear Chemist Aintree and the head
    // office are both Unit 20 Brookfield Trade Centre), so an identical string
    // is not a foreign address at all.
    if (!s || s.toLowerCase() === ownStreet.toLowerCase()) continue;
    if (flatText.indexOf(s.toLowerCase()) === -1) continue;
    const key = `${b.id}::streetAddress`;
    const known = KNOWN_IDENTITY[key];
    if (known) {
      seenIdentityKnown[key] = true;
      warn(file, `KNOWN pack carries ${other.branchName}'s street address. ${known.question}: ${known.reason}`);
    } else {
      fail(file, `street address "${other.streetAddress}" belongs to ${other.branchName}, not ${b.branchName}, so the profile would put the pin on another branch`);
    }
  }

  // --- every house number stated on the branch's own road -----------------
  // The two rules above are a PRESENCE check and a SISTER check. The first
  // proves the branch's own street address appears somewhere in the pack. The
  // second proves no other branch's street address appears. Neither proves
  // that the address strings the pack actually publishes are this branch's,
  // and a pack states its house number four times over: the profile-basics
  // "- Address:" line, the business description, and Posts B and D.
  //
  // Found on the item 4.6 quality pass, 2026-08-13, by injection into
  // mccanns-aigburth.md. Changing the "- Address:" line alone from 112 to
  // 114 Aigburth Road passed this file clean, because the three remaining
  // mentions still read "112 Aigburth Road" and satisfied the presence rule,
  // and because 114 is nobody's address and so was invisible to the sister
  // rule. That line is the one the paster sets the Google Maps pin from, so
  // the pack would move the pin two doors down and report nothing. The same
  // injection passed in the description, in Post B and in Post D.
  //
  // Nothing else covers it. The postcode rules pass because the postcode is
  // untouched, and the post-town rule below is DISABLED by the very same
  // fault: it locates the post town by finding the branch's own street inside
  // the address line, and gives up silently when it is not there. So one
  // mistyped digit both publishes a wrong pin and switches off the next rule.
  //
  // The rule engages where the branch's own streetAddress OPENS with a house
  // number, which is thirteen of the sixteen, and reads a hyphenated range as
  // one number so Scorah Bramhall ("61-63 North Park Road") and Hirshmans
  // Ainsdale ("56-62 Sherwood House, Station Road") are covered rather than
  // skipped. The remaining three open with "Unit" (Fishlocks Eccleston and the
  // two entries that share Unit 20 Brookfield), where the digits are a unit
  // designation rather than a street number.
  //
  // THOSE THREE ARE NOW COVERED TOO, added on the item 4.9 quality pass,
  // 2026-08-14. The 4.6 pass left them "to the rules above", and injection
  // into clear-aintree.md on this pass showed the rules above do not hold
  // them: changing the "- Address:" line alone from Unit 20 to Unit 21
  // Brookfield Trade Centre passed ALL 36 CHECKERS clean, for exactly the two
  // reasons this rule was written for. The presence rule passed because the
  // description and Post A still spell "Unit 20 Brookfield Trade Centre", and
  // the sister rule passed because Unit 21 is no branch's address. A unit
  // number is not a softer fact than a house number on a trade estate: it is
  // the only thing separating one door from the next, and it is the line the
  // paster sets the Google Maps pin from. Leaving it uncovered meant the two
  // packs on Brookfield Drive and the one at The Carrington Centre were the
  // three in the estate where a wrong door published silently.
  //
  // A unit address is matched on the FIRST comma-separated segment of the
  // road part ("Brookfield Trade Centre", "The Carrington Centre") rather
  // than the whole string, because the packs write the tail differently each
  // time: branches.json holds "Unit 20 Brookfield Trade Centre, Brookfield
  // Drive, Aintree" while Post A writes "Unit 20 Brookfield Trade Centre on
  // Brookfield Drive". Matching the whole string would find none of them and
  // the rule would pass on everything. The "Unit" word itself is optional in
  // the match, so a mention that drops it and writes a bare "21 Brookfield
  // Trade Centre" is caught on the same footing. Whitespace is collapsed
  // first because these mentions wrap mid-address in the packs (Post D writes
  // "at 112\nAigburth Road"), and a line-bounded read would miss them.
  // Occurrences that spell another branch's full address are skipped, so the
  // sister rule keeps sole ownership of that fault and it is reported once.
  const NUMBER_SRC = "\\d+[a-z]?(?:\\s*-\\s*\\d+[a-z]?)?";
  const UNIT_WORD_SRC = "(?:unit|suite)";
  const simpleStreet = new RegExp(`^(${NUMBER_SRC})\\s+(.+)$`, "i").exec(ownStreet);
  const unitStreet = simpleStreet
    ? null
    : new RegExp(`^${UNIT_WORD_SRC}\\s+(${NUMBER_SRC})\\s+(.+)$`, "i").exec(ownStreet);
  const parsedStreet = simpleStreet || unitStreet;
  if (parsedStreet) {
    const isUnit = !simpleStreet;
    const ownNumber = parsedStreet[1];
    // A unit address is anchored on its first comma-separated segment only;
    // see the note above for why the whole string finds nothing.
    const ownRoad = isUnit ? parsedStreet[2].split(",")[0].trim() : parsedStreet[2];
    const otherStreets = branches
      .filter((x) => x.id !== b.id && x.streetAddress)
      .map((x) => norm(x.streetAddress).toLowerCase());
    const numbered = new RegExp(
      `\\b${isUnit ? `(?:${UNIT_WORD_SRC}\\s+)?` : ""}(${NUMBER_SRC})\\s+${escapeRe(ownRoad)}\\b`,
      "gi"
    );
    const sameNumber = (n) => n.toLowerCase().replace(/\s*-\s*/g, "-") === ownNumber.toLowerCase().replace(/\s*-\s*/g, "-");
    const reported = new Set();
    for (const m of norm(text).matchAll(numbered)) {
      if (sameNumber(m[1])) continue;
      const stated = norm(m[0]);
      const lower = stated.toLowerCase();
      if (otherStreets.some((s) => s === lower || s.startsWith(lower + " ") || s.startsWith(lower + ","))) continue;
      if (reported.has(lower)) continue;
      reported.add(lower);
      const key = `${b.id}::streetNumber`;
      const known = KNOWN_IDENTITY[key];
      const msg = `the pack states "${stated}", but branches.json puts this branch at "${b.streetAddress}". The branch's own address appears elsewhere in the pack, which is why the presence rule passes, and this number is no branch's address, which is why the sister rule passes. A pack is pasted straight into Google Business Profile, so a wrong ${isUnit ? "unit number in the right building moves the map pin to the wrong door" : "house number on the right road moves the map pin to the wrong building"}`;
      if (known) {
        seenIdentityKnown[key] = true;
        warn(file, `KNOWN ${msg}. ${known.question}: ${known.reason}`);
      } else {
        fail(file, msg);
      }
    }
  }

  // --- the post town, between the street and the postcode ------------------
  // Added by the item 3.5 quality pass, 2026-08-13, as the estate-wide half of
  // the rule the item 3.4 pass added to check-nap.js the day before.
  //
  // That rule closed the gap for the two Weebly paste blocks: the postcode
  // rules above prove the postcode is the branch's own and the street rules
  // prove the street is in the pack, and then both stop, so nothing had ever
  // read the words BETWEEN them, which is exactly where the post town lives.
  // check-nap.js reads only modules/service/weebly-paste, so the fifteen GBP
  // packs, which are the other file class where a human wrote an address as
  // prose rather than a generator composing it from branches.json, were still
  // unread. They are the ones that matter most for this fault: a pack is what
  // a person copies into Google Business Profile, so a divergence here is a
  // divergence between what Google holds and what all 177 generated pages
  // publish, which is the citation-consistency fault item 1.4 exists to stop.
  //
  // The rule is equality after commas and full stops are dropped from BOTH
  // sides, so a locality legitimately holding two words (Riddings Timperley
  // holds "Timperley, Altrincham") is not read as a breach.
  const addrLine = (text.match(/^-\s*Address:[^\n]*(?:\n\s{2,}[^\n]*)*/m) || [])[0] || "";
  const flatAddr = norm(addrLine.replace(/^-\s*Address:/, ""));

  // --- the "- Address:" line must carry the branch's own street ------------
  // Added by the item 4.10 quality pass, 2026-08-14, by injection into
  // smartts-bootle.md. Changing the "- Address:" line alone from "42 Fernhill
  // Road" to "42 Fernhall Road" passed ALL 36 CHECKERS clean.
  //
  // This is the road-name twin of the house-number fault the 4.6 pass found
  // and the unit-number fault the 4.9 pass found, and it passes for the same
  // two reasons plus a third that makes it worse:
  //
  //   1. The presence rule above passes, because the description, Post B and
  //      Post D still spell "42 Fernhill Road" correctly.
  //   2. The sister rule above passes, because "Fernhall Road" is no branch's
  //      address.
  //   3. The house-number rule above is BLIND to it, not merely quiet. That
  //      rule scans for a number sitting in front of the branch's own road
  //      name, so a misspelled road name is not a wrong number on a known
  //      road, it is an occurrence the regex never matches at all.
  //
  // And then the post-town rule immediately below is DISABLED by the very
  // same edit, because it locates the post town by finding the branch's own
  // street inside the address line and does nothing at all when it is not
  // there. That silent give-up is the exact pathology the house-number note
  // above warned about ("one mistyped digit both publishes a wrong pin and
  // switches off the next rule"), reached here through the road name instead.
  //
  // The consequence is the worst of the three address faults, because the
  // "- Address:" line is the single line the paster sets the Google Maps pin
  // from. A wrong house number moves the pin along the right road; a wrong
  // road name puts the pharmacy on a road it is not on, or on no road at all,
  // and Google will silently geocode it wherever it can. Every other rule in
  // this file kept reporting clean while it did so.
  //
  // The rule is deliberately the narrowest thing that closes it: the address
  // line must CONTAIN the branches.json streetAddress after whitespace is
  // collapsed. It is not an equality test, because the line legitimately
  // carries the post town and postcode after the street, and the rule below
  // is the one that owns the words between them. All fifteen packs satisfy it
  // today, verified before the rule was written, so it fails only on a real
  // divergence and does not need a single exception on the day it lands.
  const streetLineKey = `${b.id}::addressStreetLine`;
  const streetLineKnown = KNOWN_IDENTITY[streetLineKey];
  if (addrLine && ownStreet && flatAddr.toLowerCase().indexOf(ownStreet.toLowerCase()) === -1) {
    const msg = `the "- Address:" line reads "${flatAddr}", which does not contain this branch's street address "${b.streetAddress}" from branches.json. The presence rule passes because the street is spelled correctly elsewhere in the pack, and the sister rule passes because what the line actually states is no branch's address. That line is the one the paster sets the Google Maps pin from, so the profile would publish a street this branch is not on, and the post town rule below is switched off by the same edit because it finds the post town by locating the street inside this line.`;
    if (streetLineKnown) {
      seenIdentityKnown[streetLineKey] = true;
      warn(file, `KNOWN ${msg} ${streetLineKnown.question}: ${streetLineKnown.reason}`);
    } else {
      fail(file, msg);
    }
  }

  const townKey = `${b.id}::addressPostTown`;
  const townKnown = KNOWN_IDENTITY[townKey];
  if (addrLine && ownStreet && b.postalCode) {
    const at = flatAddr.toLowerCase().lastIndexOf(ownStreet.toLowerCase());
    const pcAt = flatAddr.toUpperCase().indexOf(b.postalCode.toUpperCase());
    if (at !== -1 && pcAt > at) {
      const tidy = (s) => s.replace(/[,.]/g, " ").replace(/\s+/g, " ").trim();
      const between = tidy(flatAddr.slice(at + ownStreet.length, pcAt));
      const want = tidy(b.addressLocality || "");
      if (between !== want) {
        const msg = `the "- Address:" line reads "${flatAddr}", so the post town between the street and the postcode is "${between}", but branches.json holds addressLocality as "${b.addressLocality}". A pack is pasted into Google Business Profile, so one shop would publish two different address strings, one to Google and one on every page this repo generates.`;
        if (townKnown) { seenIdentityKnown[townKey] = true; warn(file, `KNOWN ${msg} ${townKnown.question}: ${townKnown.reason}`); }
        else fail(file, msg);
      }
    }
  }

  const ownReview = norm(b.googleReviewUrl || "");
  if (ownReview && flatText.indexOf(ownReview.toLowerCase()) === -1) {
    const key = `${b.id}::reviewLink`;
    const known = KNOWN_IDENTITY[key];
    if (known) {
      seenIdentityKnown[key] = true;
      warn(file, `KNOWN branch review link does not appear in the pack. ${known.question}: ${known.reason}`);
    } else {
      fail(file, `branch review link ${b.googleReviewUrl} does not appear anywhere in the pack, so the paster has no way to check the profile points at this branch's reviews`);
    }
  }
  for (const other of branches) {
    if (other.id === b.id) continue;
    const r = norm(other.googleReviewUrl || "");
    if (!r || r.toLowerCase() === ownReview.toLowerCase()) continue;
    if (flatText.indexOf(r.toLowerCase()) === -1) continue;
    const key = `${b.id}::reviewLink`;
    const known = KNOWN_IDENTITY[key];
    if (known) {
      seenIdentityKnown[key] = true;
      warn(file, `KNOWN pack carries ${other.branchName}'s review link. ${known.question}: ${known.reason}`);
    } else {
      fail(file, `review link ${other.googleReviewUrl} belongs to ${other.branchName}, not ${b.branchName}, so this branch's review requests would land on another branch's profile`);
    }
  }

  // --- opening hours on the profile --------------------------------------
  // TEMPLATE.md's first rule names three things that must come from
  // branches.json and nowhere else: "No invented hours, phones or claims."
  // Phones were guarded above, both directions, and postcodes with them.
  // Hours were not read at all until the item 4.9 quality pass on
  // 2026-08-10, although they are the one fact on a Google profile that
  // sends a patient to a locked door, and the profile is where most people
  // read them: tools/check-opening-hours.js guards the generated pages and
  // stops at the repo boundary.
  //
  // Two rules, and which one applies is decided by branches.json.
  //
  // A branch WITH hours: every clock time the pack states must be a time
  // the branch's own openingHours specification contains, and every time in
  // the specification must appear in the pack. A drifted closing time is
  // otherwise invisible, because no other checker reads a pack for it.
  //
  // A branch WITHOUT hours: Clear Chemist Aintree is the only one, and its
  // pack is the model. The rule is a PRESENCE check, that the hours line
  // tells the paster the data is missing and not to paste or guess. It is
  // deliberately not an absence check on clock times, because that would
  // fail the one pack that handles this best: clear-aintree.md quotes the
  // times the branch's own website publishes, as evidence for the question
  // that closes the gap, and quoting evidence is the opposite of inventing
  // hours. Same trap the item 4.8 pass had to design around.
  // The bullet plus every indented line that wraps it. Deliberately NOT a
  // /m regex. These files are CRLF, and under /m JavaScript treats a bare \r
  // as a line terminator, so both /^/ and /$/ fire at every CRLF: a /m
  // lookahead ends the match at the first line break and the rule silently
  // reads one line of a four-line bullet while looking like it read all of
  // it. Every pack wraps its hours at about 70 characters, so under /m this
  // rule would have checked Monday to Friday and never seen Saturday. Same
  // under-reading fault the item 4.8 pass had to design around in the bullet
  // reader above. Without /m, ^ and $ mean start and end of file, which is
  // what the alternation below wants.
  const hoursLine = (text.match(/(?:^|\n)-[ \t]*Hours:[\s\S]*?(?=\r?\n-[ \t]|\r?\n[ \t]*\r?\n|\r?\n##[ \t]|$)/) || [])[0] || "";
  const toMinutes = (h, m, ap) => {
    let hh = Number(h);
    if (ap === "pm" && hh !== 12) hh += 12;
    if (ap === "am" && hh === 12) hh = 0;
    return `${String(hh).padStart(2, "0")}:${m || "00"}`;
  };
  // Two kinds of time in an hours line are not a claim about when the shop
  // is open, and reading them as one would fail the two packs that do this
  // best. A parenthetical marked as history: scorah-hazel-grove.md records
  // "(previously Sat 9:00am to 1:00pm)" so the paster knows to check GBP is
  // not still showing a Saturday that ceased on 24 June 2026, which is the
  // opposite of stating hours. And a quoted span: clear-aintree.md quotes
  // the times the branch's own website publishes as evidence for the
  // question that closes its missing-hours gap. A genuine lunch closure
  // stays in scope, because "(closed 1:00pm to 2:00pm)" carries no history
  // word, and its times are in the specification anyway.
  const hoursClaim = hoursLine
    .replace(/\([^)]*\b(?:previously|formerly|ceased|used to|was)\b[^)]*\)/gi, " ")
    .replace(/"[^"]*"/g, " ");
  const packTimes = new Set();
  for (const m of hoursClaim.matchAll(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi)) {
    packTimes.add(toMinutes(m[1], m[2], m[3].toLowerCase()));
  }
  const spec = (b.openingHours && b.openingHours.specification) || null;
  if (!hoursLine) {
    fail(file, 'no "- Hours:" line in the profile basics, so the paster has nothing telling them what to set on the profile');
  } else if (spec && spec.length) {
    const dataTimes = new Set();
    for (const s of spec) { dataTimes.add(s.opens); dataTimes.add(s.closes); }
    for (const t of packTimes) {
      if (!dataTimes.has(t)) {
        fail(file, `hours line states ${t}, which is not an opening or closing time in this branch's openingHours in branches.json (${[...dataTimes].sort().join(", ")}). GBP hours send patients to the door, so the pack and the data must agree`);
      }
    }
    for (const t of dataTimes) {
      if (!packTimes.has(t)) {
        fail(file, `branches.json has this branch opening or closing at ${t}, but that time does not appear in the pack's hours line, so the profile would be set from an incomplete picture`);
      }
    }
  } else if (!/not recorded in branches\.json/i.test(hoursLine) ||
             !/do not (paste|invent|guess)/i.test(hoursLine)) {
    fail(file, "branches.json holds no openingHours for this branch, so the hours line must say the data is not recorded and tell the paster not to paste, invent or guess hours. It does not");
  }

  // --- the hours line names the right DAYS, not just the right times -----
  // The rule above reads clock times and nothing else. Days are never read,
  // by it or by anything else in this file, and a Google profile is set day
  // by day. So the estate's loudest hours fault passes every check it has:
  // "Monday to SATURDAY 8:45am to 6:00pm" on the Fishlocks Ainsdale pack
  // states only 08:45 and 18:00, both of which are in that branch's own
  // specification, and every time in the specification appears on the line,
  // so the clock-time rule is satisfied in both directions and the pack
  // publishes a Saturday opening for a shop branches.json holds as closed.
  // That is the locked-door fault the hours rule exists to stop, arriving
  // through the day rather than through the time. It runs the other way
  // too: "Monday to Thursday" drops Friday from the profile silently,
  // because Friday's times are the same as every other weekday's and the
  // clock-time rule cannot tell a missing day from a shared one.
  //
  // Three checks, all composed from branches.json so nothing is hardcoded.
  // A day stated as open must be open in the specification; every day the
  // specification opens must be stated; and a day branches.json holds as
  // closed must be stated as closed, because GBP keeps whatever the profile
  // already says for a day the paster is not told about, which is how a
  // ceased Saturday survives a repaste (scorah-hazel-grove.md exists to
  // stop exactly that, and states both closed days explicitly).
  //
  // Parentheticals are removed before reading, because in this estate a
  // parenthetical is always a lunch closure or a history note and never a
  // day claim: "(closed 1:00pm to 2:00pm)" would otherwise read Monday to
  // Friday as closed on hirshmans-ainsdale.md, and "(previously Sat 9:00am
  // to 1:00pm)" would read a ceased Saturday as a live one. The claim then
  // ends at the first full stop that starts a new sentence, so the paster
  // instructions after it are not read as hours: scorah-hazel-grove.md
  // names Saturday twice more in prose telling the paster to check GBP is
  // not still showing it.
  //
  // Whitespace is collapsed first, for the CRLF reason set out above: every
  // pack wraps this line, and a line-bounded read would see Monday to
  // Friday and never reach the Saturday and Sunday that follow it.
  if (hoursLine && spec && spec.length) {
    const daysClaim = (hoursLine
      .replace(/\([^)]*\)/g, " ")
      .replace(/"[^"]*"/g, " ")
      .replace(/\s+/g, " ")
      .split(/\.\s+(?=[A-Z])|\.\s*$/)[0] || "");
    const expandRanges = (s) =>
      s.replace(new RegExp(`${DAY_SRC}\\s*(?:to|-|through|thru|until)\\s*${DAY_SRC}`, "gi"), (m, a, z) => {
        const from = dayIndexOf(a);
        const to = dayIndexOf(z);
        if (from < 0 || to < 0 || to < from) return m;
        return ` ${DAY_NAMES.slice(from, to + 1).join(" ")} `;
      });
    const claimedOpen = new Set();
    const claimedClosed = new Set();
    for (const seg of daysClaim.split(/[,;]/)) {
      const bucket = /\bclosed\b/i.test(seg) ? claimedClosed : claimedOpen;
      for (const m of expandRanges(seg).matchAll(new RegExp(DAY_SRC, "gi"))) {
        const i = dayIndexOf(m[1]);
        if (i >= 0) bucket.add(DAY_NAMES[i]);
      }
    }
    const dataOpen = new Set();
    for (const s of spec) for (const d of (s.dayOfWeek || [])) dataOpen.add(d);
    const dataClosed = new Set(
      (b.openingHours && b.openingHours.closedDays && b.openingHours.closedDays.length)
        ? b.openingHours.closedDays
        : DAY_NAMES.filter((d) => !dataOpen.has(d))
    );
    const openList = DAY_NAMES.filter((d) => dataOpen.has(d)).join(", ") || "none";
    const breaches = [];
    for (const d of DAY_NAMES) {
      if (claimedOpen.has(d) && !dataOpen.has(d)) {
        breaches.push(`the hours line states the branch is open on ${d}, but branches.json opens it only on ${openList}. A profile that publishes a day the shop is shut sends patients to a locked door`);
      } else if (dataOpen.has(d) && !claimedOpen.has(d)) {
        breaches.push(`branches.json opens this branch on ${d}, but the hours line does not state ${d} as an open day, so the profile would be set from an incomplete picture and that day would be published wrong or left as Google has it`);
      } else if (dataClosed.has(d) && !claimedClosed.has(d) && !claimedOpen.has(d)) {
        breaches.push(`branches.json holds ${d} as a closed day, but the hours line does not state ${d} as closed. GBP keeps whatever the profile already shows for a day the paster is not told about, so a closure the group has made never reaches the listing`);
      }
    }
    if (breaches.length) {
      const key = `${b.id}::hoursDays`;
      const known = KNOWN_HOURS_DAYS[key];
      if (known) {
        seenHoursDaysKnown[key] = true;
        breaches.forEach((br) => warn(file, `KNOWN ${br}. ${known.question}: ${known.reason}`));
      } else {
        breaches.forEach((br) => fail(file, br));
      }
    } else if (KNOWN_HOURS_DAYS[`${b.id}::hoursDays`]) {
      seenHoursDaysKnown[`${b.id}::hoursDays`] = false;
    }
  }

  // --- and the right time must be on the right DAY ------------------------
  // The two rules above are both SET comparisons and neither binds a time to
  // a day. The clock-time rule asks only whether every time stated appears
  // somewhere in the specification and every time in the specification
  // appears somewhere on the line. The day rule asks only which days are
  // named open and closed. So a pack can carry every correct time, on the
  // wrong day, and satisfy both rules in both directions.
  //
  // Not hypothetical, and found on the item 4.14 quality pass, 2026-08-12,
  // by injection into gordon-short-crosby.md. That branch closes at 6:00pm
  // on weekdays and 5:00pm on Saturday. Swapping those two closing times
  // between the weekday segment and the Saturday segment leaves the set of
  // stated times identical, leaves every day still named, and the pack
  // passed clean: it published a pharmacy shutting at 5:00pm five days a
  // week that is open until 6:00pm, and a Saturday running an hour past the
  // one the staff work. Inverting a lunch closure the same way ("9:00am to
  // 2:00pm and 1:00pm to 6:00pm") also passed, because those are the same
  // four times in the same set. Both are the locked-door fault the hours
  // rules exist to stop, arriving through the PAIRING rather than through
  // the time or the day. Six of the sixteen branches state a time that
  // differs between days and are exposed to it: Scorah Bramhall, McCanns
  // Aigburth, Fishlocks Eccleston, Hirshmans Ainsdale, Gordon Short Crosby
  // and Cherry Lane.
  //
  // So this rule rebuilds the hours line into the ranges it publishes FOR
  // EACH DAY and compares those against that day's own entries. It reads
  // the two grammars the estate actually uses for a split day, because both
  // are in the packs and both must land on the same pair of ranges:
  // "9:00am to 1:00pm and 2:00pm to 6:00pm" states the two ranges outright,
  // while hirshmans-ainsdale.md writes the envelope and the break instead,
  // "8:30am to 6:00pm (closed 1:00pm to 2:00pm)". A lunch parenthetical is
  // therefore read here rather than stripped, but only when the segment
  // states a single range for it to divide; where the ranges are already
  // explicit the parenthetical is redundant and is ignored, which is what
  // mccanns-aigburth.md carries. Days named closed are skipped, since the
  // day rule above owns them, and a branch with no specification is skipped
  // for the reason given there.
  if (hoursLine && spec && spec.length) {
    const TIME_SRC = "(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)";
    const TO_SRC = "(?:to|until|till)";
    const claimLine = (hoursClaim.replace(/\s+/g, " ").split(/\.\s+(?=[A-Z])|\.\s*$/)[0] || "");
    const expandDayRanges = (s) =>
      s.replace(new RegExp(`${DAY_SRC}\\s*(?:to|-|through|thru|until)\\s*${DAY_SRC}`, "gi"), (m, a, z) => {
        const from = dayIndexOf(a);
        const to = dayIndexOf(z);
        if (from < 0 || to < 0 || to < from) return m;
        return ` ${DAY_NAMES.slice(from, to + 1).join(" ")} `;
      });
    // Split on separators OUTSIDE parentheses, so a lunch note stays with
    // the day segment it qualifies.
    const segments = [];
    let depth = 0;
    let buf = "";
    for (const ch of claimLine) {
      if (ch === "(") depth++;
      else if (ch === ")") depth = Math.max(0, depth - 1);
      if ((ch === "," || ch === ";") && depth === 0) { segments.push(buf); buf = ""; }
      else buf += ch;
    }
    segments.push(buf);
    const rangesOf = (seg) => {
      const bare = seg.replace(/\([^)]*\)/g, " ");
      const out = [];
      for (const m of bare.matchAll(new RegExp(`${TIME_SRC}\\s*${TO_SRC}\\s*${TIME_SRC}`, "gi"))) {
        out.push([toMinutes(m[1], m[2], m[3].toLowerCase()), toMinutes(m[4], m[5], m[6].toLowerCase())]);
      }
      if (out.length === 1) {
        const br = seg.match(new RegExp(`\\(\\s*closed[^)]*?${TIME_SRC}\\s*${TO_SRC}\\s*${TIME_SRC}[^)]*\\)`, "i"));
        if (br) {
          const bs = toMinutes(br[1], br[2], br[3].toLowerCase());
          const be = toMinutes(br[4], br[5], br[6].toLowerCase());
          if (bs > out[0][0] && be < out[0][1] && bs < be) return [[out[0][0], bs], [be, out[0][1]]];
        }
      }
      return out;
    };
    const claimedRanges = {};
    for (const seg of segments) {
      if (/\bclosed\b/i.test(seg.replace(/\([^)]*\)/g, " "))) continue;
      const days = [];
      for (const m of expandDayRanges(seg).matchAll(new RegExp(DAY_SRC, "gi"))) {
        const i = dayIndexOf(m[1]);
        if (i >= 0) days.push(DAY_NAMES[i]);
      }
      const rs = rangesOf(seg);
      if (!days.length || !rs.length) continue;
      for (const d of days) {
        claimedRanges[d] = (claimedRanges[d] || []).concat(rs.map((r) => `${r[0]} to ${r[1]}`));
      }
    }
    const dataRanges = {};
    for (const s of spec) {
      for (const d of (s.dayOfWeek || [])) {
        (dataRanges[d] = dataRanges[d] || []).push(`${s.opens} to ${s.closes}`);
      }
    }
    for (const d of DAY_NAMES) {
      const want = (dataRanges[d] || []).slice().sort();
      const got = (claimedRanges[d] || []).slice().sort();
      if (!want.length || !got.length) continue;
      if (want.join(" | ") !== got.join(" | ")) {
        fail(file, `the hours line publishes ${d} as ${got.join(" and ")}, but branches.json holds ${d} as ${want.join(" and ")}. Every time here may still be one of this branch's own times and every day may still be named, which is why the set-based time and day rules above both pass it. A day published longer than the branch works sends patients to a locked door, and a day published shorter turns them away while the shop is open`);
      }
    }
  }

  // --- an hours statement ANYWHERE in the pack must agree ----------------
  // Every rule above reads ONE region, the "- Hours:" bullet in the profile
  // basics, and stops at its line break. Eleven of the fifteen packs state a
  // clock time somewhere else as well, and two of those places are read by
  // the person about to type into Google: the paster note that restates the
  // split day in full, and the business description, which is PUBLIC copy
  // pasted verbatim into the profile. Neither agreed with anything.
  //
  // Found on the item 4.6 quality pass, 2026-08-14, by injection into
  // mccanns-aigburth.md, which states its hours in four places. Changing the
  // paster note's Saturday close from 5:00pm to 6:00pm left the guarded
  // hours line untouched and ALL 36 CHECKERS EXITED 0, so the pack published
  // one Saturday to the checker and a different one to the paster. Moving
  // the photo list's lunch closure to "1:00pm to 3:00pm" passed the same
  // way, and so did turning the note's "Monday to Friday" into "Monday to
  // Saturday". It is the same shape as the address defect the 2026-08-13
  // pass closed on this same pack: a fact stated more than once, guarded in
  // one place only, and the unguarded copy is the operative one.
  //
  // Scope and the three things deliberately NOT read, each of which is a
  // real line in a real pack rather than a hypothetical:
  // - QUOTED spans, because clear-aintree.md and smartts-bootle.md quote the
  //   hours the branch's own WEBSITE publishes as evidence that the site is
  //   wrong. Reading a quoted error as a claim would fail the two packs
  //   doing this best. Same reason the hours line strips them.
  // - HISTORY parentheticals, for scorah-hazel-grove.md's ceased Saturday.
  // - Any day branches.json holds CLOSED, because that day has no ranges to
  //   compare against and the day rule above already owns it. This is what
  //   keeps scorah-hazel-grove.md's "still shows Saturday 9:00am to 1:00pm,
  //   remove it" out of scope: it is an instruction to delete a wrong
  //   Saturday, not a claim to publish one.
  //
  // A lunch statement is read as a BREAK, not as opening hours, and checked
  // against the gap the specification actually leaves. "The pharmacy closes
  // for lunch 1:00pm to 2:00pm Monday to Saturday" in gordon-short-crosby.md
  // is a correct sentence that a naive opening-hours read would fail.
  if (spec && spec.length) {
    const T2 = "(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)";
    const TO2 = "(?:to|until|till)";
    const dRanges = {};
    for (const s of spec) {
      for (const d of (s.dayOfWeek || [])) {
        (dRanges[d] = dRanges[d] || []).push([s.opens, s.closes]);
      }
    }
    for (const d of Object.keys(dRanges)) dRanges[d].sort((a, z) => a[0].localeCompare(z[0]));
    const gapsOf = (d) => {
      const rs = dRanges[d] || [];
      const out = [];
      for (let i = 1; i < rs.length; i++) out.push([rs[i - 1][1], rs[i][0]]);
      return out;
    };
    const expandDays2 = (s) =>
      s.replace(new RegExp(`${DAY_SRC}\\s*(?:to|-|through|thru|until)\\s*${DAY_SRC}`, "gi"), (m, a, z) => {
        const from = dayIndexOf(a);
        const to = dayIndexOf(z);
        if (from < 0 || to < 0 || to < from) return m;
        return ` ${DAY_NAMES.slice(from, to + 1).join(" ")} `;
      });
    const pairsIn = (s) => {
      const out = [];
      for (const m of s.matchAll(new RegExp(`${T2}\\s*${TO2}\\s*${T2}`, "gi"))) {
        out.push([toMinutes(m[1], m[2], m[3].toLowerCase()), toMinutes(m[4], m[5], m[6].toLowerCase())]);
      }
      return out;
    };
    const scope = (hoursLine ? text.split(hoursLine).join(" \n ") : text)
      .replace(/\([^)]*\b(?:previously|formerly|ceased|used to|was)\b[^)]*\)/gi, " ")
      .replace(/"[^"]*"/g, " ")
      .replace(/\s+/g, " ");
    for (const sentence of scope.split(/\.\s+/)) {
      if (!new RegExp(T2, "i").test(sentence)) continue;
      // The colon is a separator here because the paster note introduces its
      // restatement with one ("... to show the lunch closure: Monday to
      // Friday ..."), and without it the two day segments arrive fused and
      // the wrong day carries the wrong ranges. But a clock time contains a
      // colon too, so splitting on every one cuts "9:00am" into "9" and
      // "00am" and the rule silently reads nothing. That is exactly what the
      // first draft of this rule did: it caught the photo-list injection,
      // whose colons sat inside parentheses and so were never split, and
      // missed both paster-note injections. A colon between two digits is
      // part of a time, never punctuation.
      const segs = [];
      let depth = 0;
      let buf = "";
      for (let i = 0; i < sentence.length; i++) {
        const ch = sentence[i];
        if (ch === "(") depth++;
        else if (ch === ")") depth = Math.max(0, depth - 1);
        const inTime = ch === ":" && /\d/.test(sentence[i - 1] || "") && /\d/.test(sentence[i + 1] || "");
        if ((ch === "," || ch === ";" || (ch === ":" && !inTime)) && depth === 0) { segs.push(buf); buf = ""; }
        else buf += ch;
      }
      segs.push(buf);
      for (const seg of segs) {
        const days = [];
        for (const m of expandDays2(seg).matchAll(new RegExp(DAY_SRC, "gi"))) {
          const i = dayIndexOf(m[1]);
          if (i >= 0 && !days.includes(DAY_NAMES[i])) days.push(DAY_NAMES[i]);
        }
        const openDays = days.filter((d) => (dRanges[d] || []).length);
        if (!openDays.length) continue;
        const where = norm(seg).trim().slice(0, 110);
        if (/\bclos(?:ed|es|ure|ing)\b|\blunch\b/i.test(seg)) {
          const claimed = pairsIn(seg);
          if (claimed.length !== 1) continue;
          const [cs, ce] = claimed[0];
          for (const d of openDays) {
            const gaps = gapsOf(d);
            if (!gaps.length) continue;
            if (!gaps.some((g) => g[0] === cs && g[1] === ce)) {
              fail(file, `outside the guarded hours line, this pack states a ${d} closure of ${cs} to ${ce}, but branches.json leaves ${d} closed ${gaps.map((g) => `${g[0]} to ${g[1]}`).join(" and ")}. The hours line is not the only place this pack states its hours, and this one is read by the paster or pasted into the public profile. Found: "${where}"`);
            }
          }
        } else {
          let claimed = pairsIn(seg.replace(/\([^)]*\)/g, " "));
          if (!claimed.length) claimed = pairsIn(seg);
          if (!claimed.length) continue;
          const got = claimed.map((r) => `${r[0]} to ${r[1]}`).sort();
          for (const d of openDays) {
            const want = (dRanges[d] || []).map((r) => `${r[0]} to ${r[1]}`).sort();
            if (want.join(" | ") !== got.join(" | ")) {
              fail(file, `outside the guarded hours line, this pack publishes ${d} as ${got.join(" and ")}, but branches.json holds ${d} as ${want.join(" and ")}. The "- Hours:" line may be perfect and still leave this wrong, because nothing read past it. A day published longer than the branch works sends patients to a locked door, and a day published shorter turns them away while the shop is open. Found: "${where}"`);
            }
          }
        }
      }
    }
  }

  // --- a lunch closure must tell the paster to enter TWO ranges -----------
  // Seven of the sixteen branches close for lunch, so a weekday appears
  // twice in openingHours.specification. The rule above proves the pack's
  // hours LINE is right and stops there, and that is not the whole journey.
  // A pack can state "9:00am to 1:00pm and 2:00pm to 6:00pm" perfectly and
  // still reach Google as a single 9 to 6 range, because one range per day
  // is what Google's hours editor offers first and adding the second is a
  // step the paster has to know to take. What the profile then says is that
  // the pharmacy is open through the hour it is shut: the same locked-door
  // fault the hours rule exists to stop, arriving through the paster rather
  // than through the data, at the one place most patients actually read.
  //
  // Not hypothetical. Every live page on smarttschemist.co.uk prints
  // 9:00am to 6:00pm for all five weekdays, and the site footer repeats it,
  // for a branch whose NHS-confirmed hours close 1:00pm to 2:00pm (found on
  // the item 3.7 pass, 2026-08-10, and wider than the page Q16 recorded).
  // The habit already exists on the estate's own website. The pack is the
  // last thing standing between it and the profile.
  //
  // Two packs already carry the instruction, so this enforces house
  // practice rather than inventing it: tiffenbergs-aintree.md ("GBP hours
  // need two time ranges per weekday") and gordon-short-crosby.md ("enter
  // split hours in GBP, not 9 to 6 straight through"). Found on the item
  // 4.10 quality pass, 2026-08-10, when the other five split-day packs
  // turned out to say nothing.
  //
  // Whitespace is collapsed before matching, for the CRLF reason set out
  // above and one more: the guidance wraps mid-sentence in
  // gordon-short-crosby.md, so any line-bounded read would miss it and
  // report a pack that does this correctly as a pack that does not.
  const splitDay = (() => {
    if (!spec) return null;
    const seen = {};
    for (const s of spec) {
      for (const d of (s.dayOfWeek || [])) {
        seen[d] = (seen[d] || 0) + 1;
        if (seen[d] > 1) return d;
      }
    }
    return null;
  })();
  if (splitDay) {
    const flat = text.replace(/\s+/g, " ");
    const RANGES = "two (?:separate )?(?:time )?ranges|split hours";
    const tellsPaster =
      new RegExp(`(?:gbp|google|profile)[^.]{0,140}?(?:${RANGES})`, "i").test(flat) ||
      new RegExp(`(?:${RANGES})[^.]{0,140}?(?:gbp|google|profile)`, "i").test(flat);
    if (!tellsPaster) {
      fail(file, `this branch closes for lunch (${splitDay} appears twice in openingHours), so the pack must tell the paster the profile needs two time ranges for that day rather than one. Google's hours editor offers a single range first, and a single range publishes the pharmacy as open through the hour it is shut`);
    }
  }

  // --- a sister branch named in prose must be a real, live sister --------
  // Three packs tell a reader that this shop has a sister branch and name
  // the town it is in. scorah-hazel-grove.md says "Our sister branch is in
  // Bramhall", scorah-bramhall.md says "our sister branch in Hazel Grove is
  // close by", and both of those sentences sit INSIDE the business
  // description, which is pasted verbatim into a public Google profile.
  // mccanns-sandringham.md carries the third in a paster note.
  //
  // Nothing read them. Every other fact in the profile basics is composed
  // from branches.json and guarded - the name, the address, the phone, the
  // postcode, the review link, the profile website, the hours, and since
  // the item 4.4 pass the target of every post button. A sister claim is
  // the one fact in a pack that is about ANOTHER branch, and it was typed
  // by hand and agreed with nothing.
  //
  // The fault it lets through is not hypothetical for this group. Wilmslow
  // was disposed on 1 July 2026, which is why the generators had to learn
  // to skip a disposed branch at item 1.4. A disposal takes a branch out of
  // branches.json's live set and out of every generated page automatically,
  // and it would leave this sentence standing, on a public profile, sending
  // patients to a pharmacy the group no longer owns. A rename does the same
  // thing more quietly: change a seoTown and the sister's own pages all
  // move, while the sentence naming it keeps the old word.
  //
  // Two rules, both composed from branches.json so nothing is hardcoded:
  // a pack may only claim a sister if this branch really has one, meaning
  // another live branch carrying the same brandLabel; and the sentence must
  // name that sister's seoTown. Reading is sentence-bounded and whitespace
  // is collapsed first, for the CRLF reason set out above and because both
  // live examples wrap mid-sentence.
  const flatForSister = text.replace(/\s+/g, " ");
  const sisterSentences = (flatForSister.match(/[^.]*\bsister branch(?:es)?\b[^.]*\./gi) || []);
  if (sisterSentences.length) {
    const sisters = branches.filter(
      (o) => isPackable(o) && o.id !== b.id && o.brandLabel && o.brandLabel === b.brandLabel
    );
    const key = `${b.id}::sisterBranch`;
    const known = KNOWN_SISTER[key];
    const towns = sisters.map((o) => o.seoTown).filter(Boolean);
    const named = sisterSentences.filter((s) =>
      towns.some((t) => new RegExp(`\\b${escapeRe(t)}\\b`, "i").test(s))
    );
    let breach = null;
    if (!sisters.length) {
      breach = `the pack claims a sister branch, but no other live branch in branches.json carries the brand ${b.brandLabel}. A pack description is pasted verbatim into a public Google profile, so this would send patients to a pharmacy the group does not have`;
    } else if (!named.length) {
      breach = `the pack claims a sister branch but names no town belonging to one. This branch's live sisters are ${sisters.map((o) => `${o.branchName} (${o.seoTown})`).join(", ")}, and the sentence reads "${sisterSentences[0].trim()}"`;
    }
    if (breach) {
      if (known) {
        seenSisterKnown[key] = true;
        warn(file, `KNOWN ${breach}. ${known.question}: ${known.reason}`);
      } else {
        fail(file, breach);
      }
    } else if (known) {
      // Recorded here rather than silently ignored: the anti-rot sweep
      // below turns an exception that stopped applying into a failure.
      seenSisterKnown[key] = false;
    }
  }

  // --- another branch's TOWN must not appear in the pasted copy ----------
  // Found on the item 4.8 quality pass, 2026-08-13, by injection. The
  // business description of fishlocks-eccleston.md opens by saying where the
  // shop is: "trades from Unit 3 The Carrington Centre on New Mill Street in
  // Eccleston, near Chorley". Changing that ONE clause to "in Ainsdale, near
  // Southport" - the sister Fishlocks branch, on the shared
  // fishlockpharmacy.co.uk domain - passed all 31 checkers clean.
  //
  // Nothing read it. The estate already guards every other identifying fact
  // against a sister's value leaking in: the phone, the postcode, the review
  // link, the street address and, since the item 4.6 pass, the house number
  // on the branch's own road. The TOWN is the one member of that family that
  // had no rule, and it is the word the description leads with.
  //
  // Presence rules cannot cover it, for the reason the 4.6 pass set out: the
  // branch's own town appears 25 times in this pack, so a rule asking whether
  // "Eccleston" appears somewhere is satisfied no matter what the location
  // clause says. The corrupted description reads perfectly well and
  // contradicts itself only if you hold the address line and the catchment
  // list in view at the same time, which no reader of a Google profile does.
  //
  // What it would publish is worse than a wrong pin. The description is
  // pasted verbatim into the public profile, so the shop would state a town
  // it is not in, 30 miles away, while its own address line and catchment
  // still say Eccleston. Two Fishlocks branches share one domain and one
  // brand name, which is exactly the confusion the pack's own paster note
  // exists to prevent: "do not mix in Ainsdale details".
  //
  // Scope is the copy that actually reaches the public: the business
  // description and the post bodies. The preamble and the "Notes for the
  // paster" block are instructions to the person pasting and are never
  // published, which is where all three of the estate's current legitimate
  // foreign-town mentions sit (both Fishlocks packs name the other's town
  // when explaining the shared domain).
  //
  // Two exemptions, both derived rather than whitelisted. A town in this
  // branch's own serviceAreaList is its catchment and belongs in the copy.
  // And a sentence making a sister claim is governed by the rule directly
  // above, which already proves the town named is a real live sister's: that
  // is what lets mccanns-aigburth.md say "a second branch, McCanns Chemist
  // Sandringham, in St Michael's" inside its description and stay green.
  // Both "sister branch" and "second branch" phrasings are read, because the
  // estate uses both.
  const descForTown = descriptionOf(text);
  const townScopes = [];
  if (descForTown) townScopes.push(["business description", descForTown]);
  // Section 3 joins the scope on the item 4.11 pass, 2026-08-14: see the note
  // on servicesOf() above. Several packs name their catchment towns in the
  // Services entries ("serving Bootle, Sefton and Liverpool"), which is the
  // branch's own serviceAreaList and exempt; a SISTER's town appearing there
  // would publish the same contradiction on the same profile as one in the
  // description.
  const servicesForTown = servicesOf(text);
  if (servicesForTown) townScopes.push(["services section", servicesForTown]);
  for (const p of postsOf(text)) townScopes.push([p.label, p.body]);

  const splitPlaces = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
  const ownWords = new Set(
    [...splitPlaces(b.seoTown), ...splitPlaces(b.addressLocality), ...(b.serviceAreaList || [])]
      .map((s) => s.toLowerCase())
  );
  const foreign = new Map();
  for (const o of branches) {
    if (!isPackable(o) || o.id === b.id) continue;
    for (const t of [...splitPlaces(o.seoTown), ...splitPlaces(o.addressLocality)]) {
      if (ownWords.has(t.toLowerCase())) continue;
      if (!foreign.has(t.toLowerCase())) foreign.set(t.toLowerCase(), { town: t, owners: [] });
      foreign.get(t.toLowerCase()).owners.push(o.branchName);
    }
  }

  const townBreaches = [];
  for (const [scope, body] of townScopes) {
    const flatBody = String(body || "").replace(/\s+/g, " ");
    for (const { town, owners } of foreign.values()) {
      const re = new RegExp(`\\b${escapeRe(town)}\\b`, "gi");
      if (!re.test(flatBody)) continue;
      // Sentence-bounded, so a governed sister claim exempts only itself.
      const guilty = (flatBody.match(/[^.]*\.|[^.]+$/g) || []).filter(
        (s) => new RegExp(`\\b${escapeRe(town)}\\b`, "i").test(s) &&
               !/\b(?:sister|second)\s+branch(?:es)?\b/i.test(s)
      );
      if (!guilty.length) continue;
      townBreaches.push(
        `the ${scope} names "${town}", which is the town of ${[...new Set(owners)].join(" and ")} and is neither this branch's own town nor anywhere in its serviceAreaList. This copy is pasted verbatim into the public Google profile, so it would tell patients the shop is somewhere it is not. The sentence reads "${guilty[0].trim()}"`
      );
    }
  }
  if (townBreaches.length) {
    const key = `${b.id}::foreignTown`;
    const known = KNOWN_FOREIGN_TOWN[key];
    if (known) {
      seenForeignTownKnown[key] = true;
      warn(file, `KNOWN ${townBreaches[0]}. ${known.question}: ${known.reason}`);
    } else {
      for (const msg of townBreaches) fail(file, msg);
    }
  } else if (KNOWN_FOREIGN_TOWN[`${b.id}::foreignTown`]) {
    seenForeignTownKnown[`${b.id}::foreignTown`] = false;
  }

  // --- the town in the LOCATION clause, not just a foreign town ------------
  // Found on the item 4.9 quality pass, 2026-08-13, by injection into
  // clear-aintree.md. The business description opens by saying where the shop
  // is: "at Unit 20 Brookfield Trade Centre on Brookfield Drive in Aintree,
  // Liverpool". Changing that one clause to "in Walton, Liverpool" passed all
  // 31 checkers clean.
  //
  // The rule directly above was written on the 4.8 pass for exactly this
  // fault and does not catch it, by its own design. It carries a derived
  // exemption: "a town in this branch's own serviceAreaList is its catchment
  // and belongs in the copy". Walton IS in Clear Aintree's serviceAreaList,
  // so the substituted town is exempt before the rule looks at where in the
  // sentence it sits. The exemption is right about the catchment CLAUSE
  // ("serving Aintree, Fazakerley, Walton, Bootle and North Liverpool") and
  // wrong about the LOCATION clause, which is the one that states where the
  // building is.
  //
  // This is the worse half of the pair, not the same fault twice. A foreign
  // town is a word that has no business in the pack at all; a catchment town
  // is already sitting in the same sentence, so it is the substitution a
  // careless edit actually makes, and it is the one the reader cannot detect,
  // because "in Walton ... serving Aintree, Fazakerley, Walton" still scans.
  // Walton is also the seoTown of TWO other branches in this estate, Cherry
  // Lane Pharmacy and Coleman and Leighs Pharmacy, so the corrupted line does
  // not merely misplace Clear Chemist, it puts it where two RBH pharmacies
  // genuinely are, about two miles away, on copy pasted verbatim into Google.
  //
  // The rule reads the LOCATION CONSTRUCT rather than the whole sentence: a
  // road name, then the town that immediately follows it, either as
  // "<road> in <Town>" or as "<road>, <Town>,". That town must be this
  // branch's own seoTown or addressLocality. It is deliberately narrow. The
  // captured word must be a town the estate actually knows, so "on Cherry
  // Lane, open six days a week" and "on Macclesfield Road, Scorah Chemists
  // Hazel Grove looks after" do not match a location construct at all. Seven
  // of the fifteen packs state a road-anchored town and are checked; the
  // other eight state no town after their road and are skipped rather than
  // guessed at, the same choice the house-number rule makes for the three
  // "Unit" addresses.
  //
  // Scope is the published copy only, matching the rule above: the business
  // description and the post bodies. The preamble and the paster notes are
  // instructions and never reach the profile.
  const ROAD_SUFFIX =
    "(?:Road|Street|Drive|Lane|Avenue|Way|Village|Close|Place|Parade|Crescent|Terrace|Walk|Hill|Green|Square)";
  const estateTowns = new Map();
  for (const o of branches) {
    if (!isPackable(o)) continue;
    for (const t of [...splitPlaces(o.seoTown), ...splitPlaces(o.addressLocality)]) {
      if (t) estateTowns.set(t.toLowerCase(), t);
    }
  }
  for (const t of b.serviceAreaList || []) {
    if (t) estateTowns.set(String(t).toLowerCase(), String(t));
  }
  const ownTowns = new Set(
    [...splitPlaces(b.seoTown), ...splitPlaces(b.addressLocality)].map((s) => s.toLowerCase())
  );
  const locationRe = new RegExp(
    `\\b${ROAD_SUFFIX}\\s*(?:\\bin\\b|,)\\s*([A-Z][A-Za-z'’]*(?:\\s+[A-Z][A-Za-z'’]*)*)`,
    "g"
  );
  const locationBreaches = [];
  for (const [scope, body] of townScopes) {
    const flatBody = String(body || "").replace(/\s+/g, " ");
    for (const m of flatBody.matchAll(locationRe)) {
      // Longest known town first, so "North Liverpool" wins over "Liverpool".
      const captured = m[1];
      let named = null;
      for (const [lc, orig] of estateTowns) {
        if (captured.toLowerCase() === lc || captured.toLowerCase().startsWith(lc + " ")) {
          if (!named || lc.length > named.toLowerCase().length) named = orig;
        }
      }
      if (!named) continue;
      if (ownTowns.has(named.toLowerCase())) continue;
      const owners = branches
        .filter(
          (o) =>
            isPackable(o) &&
            o.id !== b.id &&
            [...splitPlaces(o.seoTown), ...splitPlaces(o.addressLocality)].some(
              (t) => t.toLowerCase() === named.toLowerCase()
            )
        )
        .map((o) => o.branchName);
      const whose = owners.length
        ? `, which is the town of ${[...new Set(owners)].join(" and ")},`
        : "";
      locationBreaches.push(
        `the ${scope} places this branch on its own road but in "${named}"${whose} while branches.json puts it in "${b.seoTown}" (postal "${b.addressLocality}"). The catchment rule above does not see it, because "${named}" is in this branch's own serviceAreaList and is therefore exempt as a catchment town, but a catchment town is somewhere the branch SERVES, not where it IS. This copy is pasted verbatim into the public Google profile. The construct reads "${m[0].trim()}"`
      );
    }
  }
  if (locationBreaches.length) {
    const key = `${b.id}::locationTown`;
    const known = KNOWN_LOCATION_TOWN[key];
    if (known) {
      seenLocationTownKnown[key] = true;
      warn(file, `KNOWN ${locationBreaches[0]}. ${known.question}: ${known.reason}`);
    } else {
      for (const msg of locationBreaches) fail(file, msg);
    }
  } else if (KNOWN_LOCATION_TOWN[`${b.id}::locationTown`]) {
    seenLocationTownKnown[`${b.id}::locationTown`] = false;
  }
}

// --- the exception list cannot rot ---------------------------------------
// A KNOWN_AREA_ORDER key that no longer describes a real breach is a note
// nobody will delete and a rule quietly narrowed, so it fails the run. Same
// anti-rot convention as KNOWN_SEO_TOWN, KNOWN_DRIFT and KNOWN_CLAIM.
for (const key of Object.keys(KNOWN_AREA_ORDER)) {
  if (!seenAreaKnown[key]) {
    fails.push(`stale exception: KNOWN_AREA_ORDER["${key}"] no longer matches a pack that breaks the catchment-order rule. Remove it (${KNOWN_AREA_ORDER[key].question}).`);
  }
}
for (const key of Object.keys(KNOWN_BRANCH_WORD)) {
  if (!seenBranchWordKnown[key]) {
    fails.push(`stale exception: KNOWN_BRANCH_WORD["${key}"] no longer matches a pack that reads a branch name as a place. Remove it (${KNOWN_BRANCH_WORD[key].question}).`);
  }
}
for (const key of Object.keys(KNOWN_NOT_OFFERED)) {
  if (!seenNotOfferedKnown[key]) {
    fails.push(`stale exception: KNOWN_NOT_OFFERED["${key}"] no longer matches a pack claiming a service or category the branch does not have. Remove it (${KNOWN_NOT_OFFERED[key].question}).`);
  }
}
for (const key of Object.keys(KNOWN_IDENTITY)) {
  if (!seenIdentityKnown[key]) {
    fails.push(`stale exception: KNOWN_IDENTITY["${key}"] no longer matches a pack with a profile-basics fault in its name, street address, address line street, post town, review link or website. Remove it (${KNOWN_IDENTITY[key].question}).`);
  }
}
for (const key of Object.keys(KNOWN_PHOTOS)) {
  if (!seenPhotosKnown[key]) {
    fails.push(`stale exception: KNOWN_PHOTOS["${key}"] no longer matches a pack with a short photo shot list, no vinyl storefront shot or no pending-Google-updates reminder. Remove it (${KNOWN_PHOTOS[key].question}).`);
  }
}
for (const key of Object.keys(KNOWN_SISTER)) {
  if (!seenSisterKnown[key]) {
    fails.push(`stale exception: KNOWN_SISTER["${key}"] no longer matches a pack claiming a sister branch that is not a live branch on the same brand. Remove it (${KNOWN_SISTER[key].question}).`);
  }
}
for (const key of Object.keys(KNOWN_HOURS_DAYS)) {
  if (!seenHoursDaysKnown[key]) {
    fails.push(`stale exception: KNOWN_HOURS_DAYS["${key}"] no longer matches a pack whose hours line names days the branch's openingHours does not support. Remove it (${KNOWN_HOURS_DAYS[key].question}).`);
  }
}
for (const key of Object.keys(KNOWN_FOREIGN_TOWN)) {
  if (!seenForeignTownKnown[key]) {
    fails.push(`stale exception: KNOWN_FOREIGN_TOWN["${key}"] no longer matches a pack naming another branch's town in its pasted copy. Remove it (${KNOWN_FOREIGN_TOWN[key].question}).`);
  }
}

for (const key of Object.keys(KNOWN_LOCATION_TOWN)) {
  if (!seenLocationTownKnown[key]) {
    fails.push(`stale exception: KNOWN_LOCATION_TOWN["${key}"] no longer matches a pack stating the wrong town in its location clause. Remove it (${KNOWN_LOCATION_TOWN[key].question}).`);
  }
}

for (const key of Object.keys(KNOWN_PUBLISHED_PHONE)) {
  if (!seenPublishedPhoneKnown[key]) {
    fails.push(`stale exception: KNOWN_PUBLISHED_PHONE["${key}"] no longer matches a pack publishing a phone number that is not the branch's own. Remove it (${KNOWN_PUBLISHED_PHONE[key].question}).`);
  }
}

for (const key of Object.keys(KNOWN_CLINIC_QUALIFIER)) {
  if (!seenClinicQualifierKnown[key]) {
    fails.push(`stale exception: KNOWN_CLINIC_QUALIFIER["${key}"] no longer matches a pack missing a private-clinic qualifier, so the pack has been brought onto the estate wording. Remove it (${KNOWN_CLINIC_QUALIFIER[key].question}).`);
  }
}

// --- the template a pack is drafted FROM ---------------------------------
// Every rule above reads a FINISHED pack. Nothing read the file those packs
// are copied from, because the pack loop excludes TEMPLATE.md by name: it
// resolves to no branch, so the fact rules cannot run on it. That left the
// drafting instruction free to drift out of step with the rules enforced
// here, and it had. Found on the item 4.1 quality pass, 2026-08-13.
// TEMPLATE.md told the drafter to "fill every section" and then ran from its
// rules block straight into section 1, carrying neither the "Branch id:"
// line nor the profile basics block, although all 15 packs carry both and
// eight rules in this file read them.
//
// Why it is worth a rule and not just a fixed file. Proved by injection that
// day on a copy of fishlocks-ainsdale.md: strip the two blocks and this
// checker reports ONE fault, the missing Branch id line, and then silently
// skips every fact rule beneath it, because without the id there is no
// branch to check the pack against. Put the id back and seven more failures
// appear at once: name, street address, phone, hours, review link and the
// profile website. So the template handed a drafter a pack that had to fail
// twice over before they saw a real content error, and the second round held
// the five facts a GBP profile actually publishes. Run 101 fixed a stale
// note in the Fishlocks pack and left the same class of staleness standing
// in the template, which is the evidence that an unread file rots.
const TEMPLATE_FILE = path.join(PACK_DIR, "TEMPLATE.md");
if (!fs.existsSync(TEMPLATE_FILE)) {
  fails.push("gbp-packs/TEMPLATE.md is missing, so there is no drafting instruction for the next pack and nothing this checker enforces is written down for a human");
} else {
  const tpl = fs.readFileSync(TEMPLATE_FILE, "utf8");
  const REQUIRED_TEMPLATE_BITS = [
    [/^[ \t]*Branch id:/m, '"Branch id:" line, which is what resolves a pack to branches.json and without which every fact rule in this checker is skipped'],
    [/^[ \t]*Profile basics/m, '"Profile basics" block, which carries the facts the paster sets on the Google profile'],
    [/^[ \t]*-[ \t]*Name on GBP:/m, '"- Name on GBP:" field'],
    [/^[ \t]*-[ \t]*Address:/m, '"- Address:" field'],
    [/^[ \t]*-[ \t]*Phone:/m, '"- Phone:" field'],
    [/^[ \t]*-[ \t]*Hours:/m, '"- Hours:" field'],
    [/^[ \t]*-[ \t]*Website/m, '"- Website" field (or "- Website for the profile" on a shared domain)'],
    [/^[ \t]*-[ \t]*Review link:/m, '"- Review link:" field'],
  ];
  for (const [re, what] of REQUIRED_TEMPLATE_BITS) {
    if (!re.test(tpl)) {
      fails.push(`TEMPLATE.md no longer shows the ${what}. A pack drafted from this template would reach this checker missing it, and the fact rules here would report it late or, without the branch id, not at all. Restore the skeleton that sits above section 1 (item 4.1 quality pass, 2026-08-13).`);
    }
  }
  // The template must SHOW every block a finished pack is required to have.
  // Found on the item 4.1 quality pass, 2026-08-14, and it is the same fault
  // as the one above, one level up. The 2026-08-13 pass pinned the skeleton
  // that sits ABOVE section 1 and stopped there, so the five numbered
  // sections and the four post headings - the structure every pack is failed
  // for missing, five lines of REQUIRED_SECTIONS and four of REQUIRED_POSTS -
  // were enforced on the finished pack and on nothing in the file the pack is
  // copied from.
  //
  // Proved by injection that day, on gbp-packs/TEMPLATE.md, three ways:
  // "## 3. Services section content" retitled to "## 3. Services (free
  // text)", "### Post D - Travel clinic" demoted to a plain line, and
  // "## 1. Business description" retitled to "## 1. About the branch". Each
  // break was restored and the file proved byte-identical by sha256, and
  // every one of the three walked past ALL 35 checkers clean. A drafter
  // copying the broken template produces a pack missing a required section,
  // and only then does anything fail - in the pack, not in the template that
  // caused it, which is the long way round to a fault that was already
  // written down.
  //
  // The patterns are READ from REQUIRED_SECTIONS, REQUIRED_POSTS and
  // REQUIRED_NOTES rather than typed again here, so the template and the pack
  // loop cannot drift apart: change what a pack must contain and the template
  // is held to the new shape in the same edit. That is deliberate - retyping
  // the headings is exactly how this file would come to enforce one structure
  // on packs and a different one on the template.
  if (!REQUIRED_SECTIONS.length || !REQUIRED_POSTS.length) {
    fails.push("REQUIRED_SECTIONS or REQUIRED_POSTS is empty, so the pack structure rule and the TEMPLATE.md structure rule below it both pass on anything. Whatever emptied it has retired two rules silently; restore the headings or delete both rules deliberately");
  }
  REQUIRED_SECTIONS.forEach((re, i) => {
    if (!re.test(tpl)) {
      fails.push(`TEMPLATE.md does not show section ${i + 1} (${re.source}), although every pack is failed for missing it. A pack drafted from this template would be missing a required section before anyone wrote a word of copy into it (item 4.1 quality pass, 2026-08-14).`);
    }
  });
  REQUIRED_POSTS.forEach((re, i) => {
    if (!re.test(tpl)) {
      fails.push(`TEMPLATE.md does not show the "Post ${"ABCD"[i]}" heading, although every pack is failed for missing it. Section 5 asks for four posts and the template is the only place the drafter is told which four (item 4.1 quality pass, 2026-08-14).`);
    }
  });
  if (!REQUIRED_NOTES.test(tpl)) {
    fails.push('TEMPLATE.md does not show the "Notes for the paster:" block, although all 15 packs carry one below section 5 and every pack is now failed for missing it. That block holds the instructions with consequence - do not set the profile website until the landing page resolves, do not add medicine names to the weight loss post, match the categories against GBP\'s picker on the day - and a pack drafted from a template that never mentions it would carry none of them (item 4.1 quality pass, 2026-08-14).');
  }

  // The advertising rules, applied to the template as well. The pack loop
  // excludes TEMPLATE.md by name, so a medicine name or an efficacy claim
  // written into the template as SPECIMEN COPY is read by nothing, and every
  // pack drafted from it would inherit the phrasing. The template is the one
  // file in gbp-packs/ that propagates.
  //
  // The rules block is cut out first, and that carve-out is the whole reason
  // this needed care. The template teaches these rules by QUOTING the wording
  // it bans - 'No efficacy claims ("works", "guaranteed", "best results"). No
  // before/after.' - so a flat scan fails the one file whose job is to state
  // the rule, three times, and the fix a future reader would reach for is to
  // delete the quotes from the rule. That is the same convention this checker
  // already applies to opening hours, where a time inside quotation marks or a
  // "previously/ceased" parenthetical is read as evidence rather than as a
  // claim, and the same one the run instructions give the log and the worklist
  // for quoting an insecure URL. A file may name what it forbids.
  //
  // The cut is structural, not a word list: from the "Rules for every pack"
  // heading to the first "## " section heading. Lines are blanked rather than
  // removed so the reported line numbers still match the file. Everything
  // below the rules block - the specimen header, the profile basics skeleton
  // and all five numbered sections - is scanned, because that is what a
  // drafter copies. Today those sections carry only parenthetical instructions
  // and no pasteable copy, so this guard fails nothing; it exists for the
  // first time somebody writes a real example post into section 5.
  const tplLines = tpl.split(/\r?\n/);
  let inRules = false;
  const tplScannable = tplLines
    .map((line) => {
      if (/^Rules for every pack\b/.test(line)) { inRules = true; return ""; }
      if (inRules && /^##\s/.test(line)) inRules = false;
      return inRules ? "" : line;
    })
    .join("\n");
  for (const h of findTerms(tplScannable, MEDICINE_NAMES)) {
    fails.push(`TEMPLATE.md line ${h.line}: medicine name "${h.term}". Every pack drafted from this template would copy it onto a public Google profile. Context: ${h.text}`);
  }
  for (const h of findClaims(tplScannable, CLAIM_PATTERNS)) {
    fails.push(`TEMPLATE.md line ${h.line}: efficacy claim "${h.term}" (${h.reason}), from the shared tools/claim-patterns.js. Specimen copy in the template becomes real copy in the next pack. Context: ${h.text}`);
  }
  for (const h of findTerms(tplScannable, EFFICACY_FAIL)) {
    fails.push(`TEMPLATE.md line ${h.line}: efficacy claim "${h.term}". Specimen copy in the template becomes real copy in the next pack. Context: ${h.text}`);
  }
  for (const h of findClaims(tplScannable, OUTCOME_PROMISE)) {
    fails.push(`TEMPLATE.md line ${h.line}: outcome promise "${h.term}" (${h.reason}), from the shared tools/outcome-promise-patterns.js. Specimen copy in the template becomes real copy in the next pack. Context: ${h.text}`);
  }
  if (!/^Rules for every pack\b/m.test(tpl)) {
    fails.push('TEMPLATE.md no longer has a "Rules for every pack" heading. That heading is the boundary the advertising scan above uses to tell the block that STATES the rules from the specimen copy a drafter copies, so without it the template\'s own rule statements would be read as claims and fail. Restore the heading, or move the carve-out to whatever replaced it (item 4.5 quality pass, 2026-08-13).');
  }
}

// --- coverage both ways --------------------------------------------------
for (const b of branches) {
  if (!isPackable(b)) continue;
  if (![...seenIds.keys()].includes(b.id)) {
    fails.push(`coverage: ${b.branchName} (${b.id}) is a live branch with no pack in gbp-packs/`);
  }
}

// --- report ---------------------------------------------------------------
const packable = branches.filter(isPackable).length;
console.log(`check-gbp-packs: ${packFiles.length} packs, ${packable} live branches in branches.json`);
if (VERBOSE) {
  console.log("\nDescription and post character counts (limits: 750 / 1500):");
  stats.forEach((s) => console.log(`  ${s.file.padEnd(28)} desc=${String(s.desc).padStart(3)}  ${s.posts}`));
}
if (warns.length) {
  console.log(`\n${warns.length} warning(s) - human judgement, not automatic failures:`);
  warns.forEach((w) => console.log(`  WARN  ${w}`));
}
if (fails.length) {
  console.log(`\n${fails.length} failure(s):`);
  fails.forEach((f) => console.log(`  FAIL  ${f}`));
  process.exit(1);
}
console.log("\n0 failures.");
