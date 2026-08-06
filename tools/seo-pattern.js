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
    region: b.addressRegion || b.region || ""
  };
}

// ---------------------------------------------------------------------------
// FAMILY A - search-phrase pages
// ---------------------------------------------------------------------------
function searchTitle(phrase, b) {
  var s = pick(b);
  return phrase + " in " + s.town + " - " + s.brand;
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
  return "Pharmacy in " + s.town + tag + " - " + s.brand;
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
  return service + " at " + s.brand + ", " + s.town;
}
function brandH1(service, b) {
  var s = pick(b);
  return service + " at " + s.brand + " in " + s.town;
}

// ---------------------------------------------------------------------------
// Switch pages - canonical Phase 3 form (generator adopts during rollout)
// ---------------------------------------------------------------------------
function switchTitle(b) {
  var s = pick(b);
  return "Switch Your Prescriptions to " + s.brand + ", " + s.town;
}
function switchH1(b) {
  var s = pick(b);
  return "Switch your prescriptions to " + s.brand + " in " + s.town + " in under 30 seconds";
}

// ---------------------------------------------------------------------------
// Validation helpers (used by the self-test and by rollout runs)
// ---------------------------------------------------------------------------
// A title is fine up to 65 chars; longer only trims the trailing brand in
// the SERP, so overruns WARN rather than fail.
var TITLE_WARN_LEN = 65;

function checkTitle(title, b) {
  var s = pick(b);
  var problems = [];
  if (title.indexOf(s.town) === -1) problems.push("title missing seoTown '" + s.town + "'");
  if (title.length > TITLE_WARN_LEN) problems.push("WARN title " + title.length + " chars (brand may truncate in SERP)");
  return problems;
}

function checkMeta(meta, b, serviceWords) {
  var s = pick(b);
  var problems = [];
  var low = (meta || "").toLowerCase();
  if (low.indexOf(s.town.toLowerCase()) === -1) problems.push("meta missing seoTown '" + s.town + "'");
  var hasService = (serviceWords || []).some(function (w) { return low.indexOf(w.toLowerCase()) !== -1; });
  if (serviceWords && serviceWords.length && !hasService) problems.push("meta missing service words (" + serviceWords.join("/") + ")");
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
  checkMeta: checkMeta,
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

  data.branches.forEach(function (b) {
    if (b.disposed) return;
    if (b.id === "rbh_head_office_aintree") return; // head office: no pages
    if (!b.seoTown || !b.brandLabel) {
      console.error("FAIL " + b.id + ": missing seoTown or brandLabel");
      hardFail = true;
      return;
    }
    console.log("== " + b.id + " (" + b.brandLabel + ", " + b.seoTown + ")");
    var rows = [
      ["landing      ", landingTitle(b), landingH1(b)],
      ["pfOverview   ", brandTitle("Pharmacy First", b), brandH1("Pharmacy First", b)],
      ["pfCondition  ", searchTitle("UTI treatment", b), searchH1("UTI treatment", b)],
      // Longest condition phrase in build-service-pages.js CONDITIONS. Sampled
      // as well as the shortest so the length check sees the worst case: with
      // UTI alone the self-test never reached TITLE_WARN_LEN and reported no
      // warnings even though a real generated page ran to 70 characters.
      ["pfConditionMax", searchTitle("Infected insect bite treatment", b), searchH1("Infected insect bite treatment", b)],
      ["contraception", searchTitle("NHS contraception service", b), searchH1("NHS contraception service", b)],
      ["weightLoss   ", brandTitle("Weight Loss Clinic", b), brandH1("Weight Loss Clinic", b)],
      ["travelClinic ", brandTitle("Travel Clinic", b), brandH1("Travel Clinic", b)],
      ["switch       ", switchTitle(b), switchH1(b)]
    ];
    rows.forEach(function (r) {
      var probs = checkTitle(r[1], b);
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
