/*
  tools/pom-names.js  (added 2026-08-11 on the item 3.13 quality pass)

  The prescription-only medicine names public RBH copy must not carry,
  defined ONCE and required by every checker that needs them, the same way
  tools/seo-pattern.js defines the title and H1 pattern once and
  tools/claim-patterns.js defines the efficacy wording once.

  Why it is its own file
  ----------------------
  By this run the same class of list had been typed out THREE times, in
  check-gbp-packs.js, check-switch-copy.js and check-travel-clinic-copy.js,
  each written on a different day for a different page family. The item 3.13
  pass was about to add a fourth for the weight loss pages, which is the point
  the repo has already been through twice: the WhatsApp number in seven
  hardcoded places (item 3.13 pass, 2026-08-10) and the claim patterns in two
  (item 3.6 pass, 2026-08-11). Two copies of a rule that agree are
  indistinguishable from one rule right up to the moment somebody edits one.

  So the names are grouped by the clinical class that puts them on a page,
  because that is how a checker needs them: a travel page has no business
  naming Mounjaro and a weight loss page has no business naming Stamaril, but
  both bans are the same rule about the same thing.

  What this list is NOT
  ---------------------
  It is not a statement of the regulatory floor. compliance/
  WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md records the house position in full, and
  it is more nuanced than a word list: under the inner-page exemption a page
  the consumer chooses to visit MAY carry non-promotional, balanced
  information naming a specific medicine. What decides a page is how the
  medicine is presented and how the page is reached, not whether the word
  appears.

  These lists therefore enforce the position each GENERATOR has declared for
  its own page family, which in every case today is the stricter one of naming
  no medicine at all. If that position is ever relaxed for a page family,
  relax it in that generator's header and in that checker's use of this file
  together, and record the decision. Do not quietly delete a name from here to
  make a run pass.

  Read compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md and the house reference
  it points at, AI\RBH_WeightLoss_Advertising_Standards.md, before adding or
  removing anything.
*/

// Weight loss and related classes. Brand names and INNs.
const WEIGHT_LOSS = [
  "wegovy", "ozempic", "saxenda", "victoza", "rybelsus", "mounjaro",
  "zepbound", "xenical", "orlistat", "alli", "mysimba", "contrave",
  "semaglutide", "tirzepatide", "liraglutide", "phentermine", "duromine",
  "naltrexone", "bupropion", "setmelanotide", "metreleptin"
];

// The seven NHS Pharmacy First pathways prescribe from these.
const PHARMACY_FIRST = [
  "nitrofurantoin", "amoxicillin", "phenoxymethylpenicillin", "clarithromycin",
  "aciclovir", "fusidic", "flucloxacillin", "hydrocortisone"
];

// NHS Pharmacy Contraception Service.
const CONTRACEPTION = ["levonorgestrel", "desogestrel"];

// Travel vaccine brands.
const TRAVEL_VACCINES = [
  "stamaril", "havrix", "avaxim", "vaqta", "twinrix", "ambirix", "engerix",
  "fendrix", "hbvaxpro", "typhim", "typherix", "vivotif", "viatim",
  "rabipur", "verorab", "ixiaro", "encepur", "ticovac", "dukoral",
  "revaxis", "boostrix", "repevax", "diftavax", "nimenrix", "menveo",
  "menquadfi", "menitorix", "priorix", "mmrvaxpro", "varivax", "varilrix",
  "zostavax", "shingrix", "qdenga", "jespect", "rabavert"
];

// Antimalarials and the other POMs a travel page could drift into naming.
const ANTIMALARIALS = [
  "malarone", "maloff", "lariam", "mefloquine", "atovaquone", "proguanil",
  "doxycycline", "chloroquine", "primaquine", "tafenoquine", "arakoda",
  "riamet", "artemether", "azithromycin", "ciprofloxacin"
];

// Returns a de-duplicated, sorted list from any number of groups.
function union() {
  const out = {};
  for (let i = 0; i < arguments.length; i++) {
    (arguments[i] || []).forEach(function (n) { out[String(n).toLowerCase()] = true; });
  }
  return Object.keys(out).sort();
}

// Returns the first name in `names` that appears in `text` as a whole word,
// or null. Matching is word-boundary, never substring, so "alli" does not
// fire on "usually" and "proguanil" does not fire inside a longer word.
function findMedicine(text, names) {
  const s = String(text == null ? "" : text);
  for (let i = 0; i < names.length; i++) {
    const n = String(names[i]).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp("\\b" + n + "\\b", "i").test(s)) return names[i];
  }
  return null;
}

module.exports = {
  WEIGHT_LOSS: WEIGHT_LOSS,
  PHARMACY_FIRST: PHARMACY_FIRST,
  CONTRACEPTION: CONTRACEPTION,
  TRAVEL_VACCINES: TRAVEL_VACCINES,
  ANTIMALARIALS: ANTIMALARIALS,
  union: union,
  findMedicine: findMedicine
};
