/*
  tools/seo-pattern.js - the ONE definition of the page title / H1 / meta
  description pattern for every generated page (worklist item 3.1, Phase 3
  of the Full Audit June 2026 backlog).

  Why this file exists
  --------------------
  Build Pack v2, section 1.4: "Put the town and service in the page title,
  URL and main heading (H1) for each service page. This is what moves the
  store off page two for generic local searches." Section 5.1: "Build every
  URL, title and H1 from seoTown/townSlug. Using addressLocality targets
  the wrong catchment."

  Until now each build script composed its own title and H1 strings inline.
  The wording had drifted into two families plus one outlier (switch).
  This module is the single place the pattern lives. Build scripts import
  from here during the Phase 3 rollout (items 3.2 to 3.13, brand by brand);
  after rollout no build script should compose a title or H1 by hand.

  The two pattern families (both deliberate, both keep town + service)
  --------------------------------------------------------------------
  FAMILY A - search-phrase pages. The page targets what people type into
  Google ("uti treatment walton", "pharmacy ainsdale"). The search phrase
  and town lead; the brand trails where Google truncates last.
      title: "<Phrase> in <seoTown> - <brandLabel>"
      H1:    "<Phrase> in <seoTown>"
  Used by: branch landing pages (phrase "Pharmacy", brand kept in the H1,
  see landingTitle/landingH1 below), Pharmacy First condition pages,
  contraception pages.

  FAMILY B - brand-led service pages. The page is about a service AT the
  branch. Build Pack v2 section 5.4 prescribes this shape itself
  ("Pharmacy First at [store], [town]").
      title: "<Service> at <brandLabel>, <seoTown>"
      H1:    "<Service> at <brandLabel> in <seoTown>"
  Used by: Pharmacy First overview, Weight Loss Clinic, Travel Clinic.

  Switch pages: the live H1 ("Switch your prescriptions to <brand> in
  <town> in under 30 seconds") already carries service + brand + town and
  is deliberately kept as the canonical H1 - it is stronger conversion
  copy than the bare family shapes. Only the TITLE was the outlier
  ("Switch Your Prescriptions - <brand> <town>"); the canonical title is
  switchTitle below.

  Meta description rule: must contain the seoTown and at least one service
  word, 80 to 165 characters. checkMeta() enforces it.

  Title length rule (Q14, answered 2026-08-10): a composed title over 65
  characters is retried once with " Pharmacy" dropped from the end of the
  brand, because the brand is the part Google truncates. See fitTitle below.
  It changes the SERP title only; H1s, JSON-LD names and visible copy keep
  the full trading name.

  Data rules:
  - Town ALWAYS comes from branches.json seoTown (catchment town), never
    addressLocality. Cherry Lane is postally Liverpool, seoTown Walton.
  - Brand ALWAYS comes from brandLabel.
  - Disposed branches and head office are never built.

  Run "node tools/seo-pattern.js" to self-test: prints every pattern for
  every buildable branch and validates the rules.
*/
"use strict";

var path = require("path");

// Accept either a raw branches.json branch ({brandLabel, seoTown, ...}) or
// a build-script store object ({brand, town, ...}).
function pick(b) {
  return {
    brand: b.brandLabel || b.brand,
    town: b.seoTown || b.town,
    // Title qualifier. addressRegion is the SCHEMA field and must hold the
    // county (Lancashire, Merseyside, Greater Manchester), because that is
    // what schema.org PostalAddress.addressRegion means and what Google
    // reads. seoRegion is the optional SEARCH qualifier for the landing
    // title, used where the borough is the stronger local word than the
    // county: Eccleston sits in Chorley borough, Lancashire, and "Eccleston,
    // Chorley" is what distinguishes it from Eccleston, St Helens. Only set
    // seoRegion where it genuinely differs; everywhere else the county is
    // both the schema value and the qualifier.
    region: b.seoRegion || b.addressRegion || b.region || ""
  };
}

// ---------------------------------------------------------------------------
// Length-aware brand suffix (Q14, answered by Rishi 2026-08-10)
// ---------------------------------------------------------------------------
// Google truncates a title past TITLE_WARN_LEN characters, and the brand sits
// at the end of a family A title, so the brand is the part that disappears.
// One title in the whole estate ran over: the longest NHS condition name
// ("Infected insect bite treatment") landing on the longest trading name
// ("Coleman and Leighs Pharmacy"), 70 characters, which made the Walton
// listing read as an unbranded condition page in a town where RBH runs a
// second pharmacy competing for the same words.
//
// Rishi's answer: drop "Pharmacy" from the title suffix rather than shorten
// the NHS condition wording. The brand is what Google is already cutting, so
// ending it cleanly costs nothing that is not already lost, and the clinical
// wording stays exactly as the NHS describes the service.
//
// It is a rule here rather than a hand edit for two reasons: a hand-edited
// title would be overwritten by the next regeneration, and any future long
// condition name gets handled the same way instead of quietly overrunning.
//
// It fires ONLY when a composed title is over the limit AND the brand ends in
// " Pharmacy", so every other title in the estate is untouched and every other
// page regenerates byte-identical. Nothing else shortens: the H1, the JSON-LD
// name, the data-branch attribute and every visible line of copy keep the full
// trading name Q1 settled. Only the SERP title loses the word.
var TITLE_WARN_LEN = 65;

// The only permitted shortening. Returns null if the brand does not end in
// " Pharmacy", in which case the title is left long and checkTitle warns.
function shortenBrand(brand) {
  return /\sPharmacy$/.test(brand) ? brand.replace(/\sPharmacy$/, "") : null;
}

// Compose a title with `compose(brand)`, retrying once with the shortened
// brand if the first attempt overruns. Never returns a longer string than the
// full-brand version.
function fitTitle(compose, brand) {
  var full = compose(brand);
  if (full.length <= TITLE_WARN_LEN) return full;
  var shorter = shortenBrand(brand);
  if (!shorter) return full;
  var retry = compose(shorter);
  return retry.length < full.length ? retry : full;
}

// ---------------------------------------------------------------------------
// FAMILY A - search-phrase pages
// ---------------------------------------------------------------------------
function searchTitle(phrase, b) {
  var s = pick(b);
  return fitTitle(function (brand) {
    return phrase + " in " + s.town + " - " + brand;
  }, s.brand);
}
function searchH1(phrase, b) {
  var s = pick(b);
  return phrase + " in " + s.town;
}

// Branch landing page: family A with phrase "Pharmacy", brand kept in the
// H1 (the page is the branch's home target), and the county appended to the
// title when it differs from the town (disambiguates e.g. Bramhall).
function landingTitle(b) {
  var s = pick(b);
  var tag = (!s.region || s.region === s.town) ? "" : ", " + s.region;
  return fitTitle(function (brand) {
    return "Pharmacy in " + s.town + tag + " - " + brand;
  }, s.brand);
}
function landingH1(b) {
  var s = pick(b);
  return "Pharmacy in " + s.town + " - " + s.brand;
}

// ---------------------------------------------------------------------------
// FAMILY B - brand-led service pages
// ---------------------------------------------------------------------------
function brandTitle(service, b) {
  var s = pick(b);
  return fitTitle(function (brand) {
    return service + " at " + brand + ", " + s.town;
  }, s.brand);
}
function brandH1(service, b) {
  var s = pick(b);
  return service + " at " + s.brand + " in " + s.town;
}

// ---------------------------------------------------------------------------
// Switch pages - canonical Phase 3 form (generator adopts during rollout)
// ---------------------------------------------------------------------------
// Composed through fitTitle like every other title in this file. It was not,
// until the item 5.6 quality pass on 2026-08-13: switchTitle was the one
// composer of the four that concatenated directly, so the Q14 length rule -
// the whole point of item 5.6 - did not reach the switch family at all. That
// mattered rather than being tidiness, because the longest switch title in the
// estate is "Switch Your Prescriptions to Coleman and Leighs Pharmacy, Walton"
// at 64 characters, ONE character under the 65 limit, on the one brand Q14
// exists to protect and the one brand fitTitle can actually rescue (it is the
// longest brand in the estate and it ends in " Pharmacy"). The fixed prefix
// "Switch Your Prescriptions to " is 29 characters, so this family has the
// least headroom of the four and was the only one with no rule behind it. Any
// future rename or seoTown change that added one character would have shipped
// a truncated title with no auto-fix, and check-seo-lengths would have failed
// the board instead, needing a human to clear what Q14 already decided.
// Wiring fitTitle in changes no current output: all 15 switch titles are 64
// characters or fewer, so every switch page regenerates byte-identical.
function switchTitle(b) {
  var s = pick(b);
  return fitTitle(function (brand) {
    return "Switch Your Prescriptions to " + brand + ", " + s.town;
  }, s.brand);
}
function switchH1(b) {
  var s = pick(b);
  return "Switch your prescriptions to " + s.brand + " in " + s.town + " in under 30 seconds";
}

// ---------------------------------------------------------------------------
// Validation helpers (used by the self-test and by rollout runs)
// ---------------------------------------------------------------------------
// TITLE_WARN_LEN is declared once, above fitTitle, so the limit the composer
// fits to and the limit the checker warns at cannot drift apart. Since the
// Q14 rule landed, an overrun that survives fitTitle means a brand that does
// not end in " Pharmacy" and cannot be shortened, so the warning still stands
// rather than being made unreachable.
// One service-word test, shared by all three legs, so title, H1 and meta
// cannot drift apart in how they read the same serviceWords list. Absent or
// empty serviceWords means "not asserted" and passes, which keeps the older
// two-argument checkTitle(title, b) callers (the self-test rows below, and
// any rollout script) working unchanged.
function hasServiceWord(text, serviceWords) {
  if (!serviceWords || !serviceWords.length) return true;
  var low = String(text || "").toLowerCase();
  return serviceWords.some(function (w) { return low.indexOf(String(w).toLowerCase()) !== -1; });
}

// SERVICE WORDS, the second half of item 3.2 (added on the 2026-08-13 pass).
// Item 3.2 is "put the town AND SERVICE WORDS into every page title,
// description and heading". Until this landed only the DESCRIPTION leg was
// checked: checkMeta() has taken serviceWords since it was written, while
// checkTitle() asserted the town alone and there was no H1 check at all.
// Title and H1 were guarded only by check-seo-pattern.js comparing the page
// with what these functions produce TODAY, which catches a page that drifts
// from the pattern but never a PATTERN that drifts from the spec: change the
// composer, regenerate, and both sides move together. Proved by injection on
// this pass - brandTitle() and brandH1() were each made to drop the service
// word for one family (Travel Clinic), 15 pages rebuilt without it, and all
// 30 checkers stayed green both times. Same class of fault as the 2026-08-11
// cross-town finding on this item: the pages were right, the rules were not.
function checkTitle(title, b, serviceWords) {
  var s = pick(b);
  var problems = [];
  if (title.indexOf(s.town) === -1) problems.push("title missing seoTown '" + s.town + "'");
  if (!hasServiceWord(title, serviceWords)) problems.push("title missing service words (" + (serviceWords || []).join("/") + ")");
  if (title.length > TITLE_WARN_LEN) problems.push("WARN title " + title.length + " chars (brand may truncate in SERP)");
  return problems;
}

// The H1 leg. Nothing checked the H1's own content before this: the exact
// match in check-seo-pattern.js is pattern-relative, and the cross-town rule
// is an ABSENCE rule, so an H1 that lost its own town or its service word
// tripped neither. The town half is not purely theoretical cover either -
// under injection an H1 that dropped its town was caught only incidentally,
// by the H1-duplication warning in check-seo-lengths, and only because two
// branches share the Scorah brand. A single-branch brand would not collide
// and nothing would have fired.
function checkH1(h1, b, serviceWords) {
  var s = pick(b);
  var problems = [];
  if (String(h1 || "").indexOf(s.town) === -1) problems.push("h1 missing seoTown '" + s.town + "'");
  if (!hasServiceWord(h1, serviceWords)) problems.push("h1 missing service words (" + (serviceWords || []).join("/") + ")");
  return problems;
}

function checkMeta(meta, b, serviceWords) {
  var s = pick(b);
  var problems = [];
  var low = (meta || "").toLowerCase();
  if (low.indexOf(s.town.toLowerCase()) === -1) problems.push("meta missing seoTown '" + s.town + "'");
  if (!hasServiceWord(meta, serviceWords)) problems.push("meta missing service words (" + (serviceWords || []).join("/") + ")");
  if (meta && meta.length < 80) problems.push("meta under 80 chars");
  if (meta && meta.length > 165) problems.push("meta over 165 chars");
  return problems;
}

// ---------------------------------------------------------------------------
// Page-type map: which family each generated page type uses. This is the
// rollout contract for items 3.2 to 3.13 - every build script listed here
// must produce titles/H1s via the named functions, nothing hand-composed.
// ---------------------------------------------------------------------------
var PAGE_TYPES = [
  { key: "branchLanding", builder: "build-branch-landing-pages.js", family: "A", title: "landingTitle(b)", h1: "landingH1(b)", phrase: "Pharmacy" },
  { key: "pfCondition",   builder: "build-service-pages.js",        family: "A", title: "searchTitle(conditionPhrase, b)", h1: "searchH1(conditionH1Phrase, b)", phrase: "per condition, e.g. UTI treatment" },
  { key: "contraception", builder: "build-contraception-pages.js",  family: "A", title: "searchTitle('NHS contraception service', b)", h1: "searchH1('NHS contraception service', b)", phrase: "NHS contraception service" },
  { key: "pfOverview",    builder: "build-service-pages.js",        family: "B", title: "brandTitle('Pharmacy First', b)", h1: "brandH1('Pharmacy First', b)", phrase: "Pharmacy First" },
  { key: "weightLoss",    builder: "build-weight-loss-pages.js",    family: "B", title: "brandTitle('Weight Loss Clinic', b)", h1: "brandH1('Weight Loss Clinic', b)", phrase: "Weight Loss Clinic" },
  { key: "travelClinic",  builder: "build-travel-clinic-pages.js",  family: "B", title: "brandTitle('Travel Clinic', b)", h1: "brandH1('Travel Clinic', b)", phrase: "Travel Clinic" },
  { key: "switch",        builder: "build-switch-pages.js",         family: "switch", title: "switchTitle(b)", h1: "switchH1(b)", phrase: "Switch Your Prescriptions" }
];

module.exports = {
  pick: pick,
  searchTitle: searchTitle,
  searchH1: searchH1,
  landingTitle: landingTitle,
  landingH1: landingH1,
  brandTitle: brandTitle,
  brandH1: brandH1,
  switchTitle: switchTitle,
  switchH1: switchH1,
  checkTitle: checkTitle,
  checkH1: checkH1,
  checkMeta: checkMeta,
  hasServiceWord: hasServiceWord,
  shortenBrand: shortenBrand,
  fitTitle: fitTitle,
  TITLE_WARN_LEN: TITLE_WARN_LEN,
  PAGE_TYPES: PAGE_TYPES
};

// ---------------------------------------------------------------------------
// Self-test: node tools/seo-pattern.js
// Prints every pattern for every buildable branch and validates the rules.
// Exits 1 on a hard failure (missing seoTown/brandLabel on a buildable
// branch, or a title missing its town). Length overruns are warnings.
// ---------------------------------------------------------------------------
if (require.main === module) {
  var data = require(path.join(__dirname, "..", "branches.json"));
  var hardFail = false;
  var warnings = 0;

  // The longest condition phrase is READ FROM build-service-pages.js rather
  // than written here as a literal. It used to be the literal "Infected
  // insect bite treatment", which was the longest condition on the day the
  // Q14 rule landed (item 5.6). A literal is the same under-sampling fault
  // the item 3.1 pass already had to fix once: add a longer condition to
  // CONDITIONS and the self-test would keep testing the old worst case and
  // keep reporting no length warnings, while the generator wrote a longer
  // title into 14 real pages. The generator is read as DATA UNDER TEST, the
  // same convention as check-whatsapp-route and check-booking-routes, so a
  // generator that stops declaring metaCondition fails here instead of
  // quietly narrowing what this test covers.
  var fs = require("fs");
  var builderSrc = fs.readFileSync(path.join(__dirname, "build-service-pages.js"), "utf8");
  var conditions = (builderSrc.match(/metaCondition:\s*"[^"]+"/g) || []).map(function (m) {
    return m.replace(/^metaCondition:\s*"/, "").replace(/"$/, "");
  });
  if (!conditions.length) {
    console.error("FAIL build-service-pages.js declares no metaCondition values, so the longest-condition sample cannot be derived");
    process.exit(1);
  }
  var longestCondition = conditions.slice().sort(function (a, b) { return b.length - a.length; })[0];
  console.log("Longest condition phrase read from build-service-pages.js: \"" + longestCondition +
    "\" (" + longestCondition.length + " chars, " + conditions.length + " condition entries read)\n");

  data.branches.forEach(function (b) {
    if (b.disposed) return;
    if (b.id === "rbh_head_office_aintree") return; // head office: no pages
    if (!b.seoTown || !b.brandLabel) {
      console.error("FAIL " + b.id + ": missing seoTown or brandLabel");
      hardFail = true;
      return;
    }
    console.log("== " + b.id + " (" + b.brandLabel + ", " + b.seoTown + ")");
    // Fourth column is the service words each row must carry, mirroring the
    // sw lists check-seo-pattern.js derives per page type. Without it the
    // self-test printed the H1 and asserted nothing about either leg.
    var rows = [
      ["landing      ", landingTitle(b), landingH1(b), ["pharmacy"]],
      ["pfOverview   ", brandTitle("Pharmacy First", b), brandH1("Pharmacy First", b), ["pharmacy first"]],
      ["pfCondition  ", searchTitle("UTI treatment", b), searchH1("UTI treatment", b), ["uti", "treatment"]],
      // Longest condition phrase in build-service-pages.js CONDITIONS, derived
      // above rather than hardcoded. Sampled as well as the shortest so the
      // length check sees the worst case: with UTI alone the self-test never
      // reached TITLE_WARN_LEN and reported no warnings even though a real
      // generated page ran to 70 characters.
      ["pfConditionMax", searchTitle(longestCondition, b), searchH1(longestCondition, b), ["treatment"]],
      ["contraception", searchTitle("NHS contraception service", b), searchH1("NHS contraception service", b), ["contraception", "contraceptive"]],
      ["weightLoss   ", brandTitle("Weight Loss Clinic", b), brandH1("Weight Loss Clinic", b), ["weight loss"]],
      ["travelClinic ", brandTitle("Travel Clinic", b), brandH1("Travel Clinic", b), ["travel"]],
      ["switch       ", switchTitle(b), switchH1(b), ["prescription"]]
    ];
    rows.forEach(function (r) {
      var probs = checkTitle(r[1], b, r[3]).concat(checkH1(r[2], b, r[3]));
      probs.forEach(function (p) {
        if (p.indexOf("WARN") === 0) { warnings++; console.log("   " + r[0] + " " + p); }
        else { hardFail = true; console.error("   " + r[0] + " FAIL " + p); }
      });
      console.log("   " + r[0] + " title: " + r[1] + "  |  H1: " + r[2]);
    });
  });

  console.log("\nSelf-test " + (hardFail ? "FAILED" : "passed") + (warnings ? " with " + warnings + " length warning(s)" : "") + ".");
  process.exit(hardFail ? 1 : 0);
}
