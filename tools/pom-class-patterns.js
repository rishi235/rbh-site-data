/*
  tools/pom-class-patterns.js  (added 2026-08-14 on the item 4.13 quality pass)

  The ways public RBH copy can promote a prescription-only weight loss
  medicine WITHOUT naming it, defined ONCE and required by every checker that
  needs them, the same way tools/pom-names.js defines the medicine names and
  tools/claim-patterns.js defines the efficacy wording.

  Why it is its own file now
  --------------------------
  These patterns were written on the item 2.1 quality pass inside
  check-weight-loss-copy.js, and that file's own header said why they were not
  promoted at the time, and named the condition for promoting them:

    "listed below rather than in tools/pom-names.js on purpose: pom-names is
     a list of NAMES required by five checkers, these are class references and
     they are barred in this regime only. If a second Regime 1 family ever
     needs them, promote them then, the way pom-names itself was promoted once
     three checkers had typed the same list."

  The item 4.13 quality pass on 2026-08-14 found that second Regime 1 family,
  and it was the strictest surface in the repo. The GBP packs in gbp-packs/ are
  copy drafted to be pasted into a public Google Business Profile, which is
  advertising in the plainest sense, and check-gbp-packs.js knew only the NAMES
  from pom-names.js and the efficacy wording from claim-patterns.js. Proved by
  injection into Post C of gbp-packs/riddings-timperley.md, one edit at a time,
  each reverted and the file sha256-compared back to its original afterwards.
  All five of these passed ALL 36 CHECKERS:

    "The pharmacist-led weight loss injection clinic at Riddings Pharmacy"
    "The skinny jab clinic at Riddings Pharmacy"
    "Our GLP-1 clinic at Riddings Pharmacy"
    "... offers a weekly injection after a consultation"
    "The pharmacist-led weight loss pen service at Riddings Pharmacy"

  Every one of those is caught on the weight loss pages and on the six branch
  landing pages, and none of them was caught on the pack that feeds the Google
  profile those pages are linked from. That is the same shape as the item 4.15
  and 2.2 findings on Pharmacy First cost, and the item 2.1 finding on rule 11
  scoping: a rule written for one folder, and a second folder that publishes
  the same claim to the same patient.

  Why these phrases at all
  ------------------------
  The ASA has ruled that a POM is promoted without being named, by the GLP-1
  class, "skinny jab", "weight loss injections", "weight loss pen", "obesity
  treatment jab" and a once-a-week dosing reference. Read
  compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md and the house reference it
  points at, AI\RBH_WeightLoss_Advertising_Standards.md, before adding or
  removing anything here.

  This list is NOT the regulatory floor, for the same reason pom-names.js is
  not: the house standard splits the position in two, and under the Regime 2
  inner-page exemption a page the consumer chooses to visit may carry balanced
  factual information about a medicine. These patterns enforce the position the
  REGIME 1 surfaces have declared, which today is naming and alluding to no
  medicine at all. If that position is ever relaxed for a surface, relax it in
  that surface's checker and record the decision. Do not quietly delete a
  pattern from here to make a run pass.

  The two lists are scoped differently, and the split matters
  ----------------------------------------------------------
  SELF_SCOPING carries its own subject. "Skinny jab" and "GLP-1" are wrong
  wherever they sit, so they are read across the whole surface.

  IN_CONTEXT is only wrong ABOUT weight loss. "Once a week" and "weekly
  injection" are ordinary English elsewhere, and the contraception service
  legitimately signposts a contraceptive injection, so these are read sentence
  by sentence and only in sentences that name weight loss. Reading them across
  the whole surface would fail correct copy and the rule would then get widened
  until it caught nothing, which is the trap recorded against the "guarantee"
  rule on the item 4.8 pass and the "option" note on the item 4.12 pass.
*/

// Self-scoping: the phrase names its own subject, so read it across the
// whole surface.
const SELF_SCOPING = [
  [/\bglp[\s-]?1\b/i, "the GLP-1 class"],
  [/\bskinny\s+jabs?\b/i, 'the phrase "skinny jab"'],
  [/\bfat\s+jabs?\b/i, 'the phrase "fat jab"'],
  [/\bobesity\s+treatment\s+jabs?\b/i, 'the phrase "obesity treatment jab"'],
  [/\bweight[\s-]*loss\s+(?:injections?|jabs?|pens?|shots?)\b/i,
    "an injectable weight loss product"],
  [/\bslimming\s+(?:injections?|jabs?|pens?|shots?)\b/i,
    "an injectable weight loss product"],
  [/\b(?:injectable|injection)\s+weight[\s-]*loss\b/i,
    "an injectable weight loss product"]
];

// Only wrong about weight loss, so read only in sentences that name it.
const IN_CONTEXT = [
  [/\bonce[\s-]a[\s-]week\b/i, "a once-a-week dosing schedule"],
  [/\bweekly\s+(?:injections?|jabs?|pens?|shots?|doses?)\b/i, "a weekly injectable"]
];

// The subject test IN_CONTEXT is gated on. Defined here so both callers ask
// the same question rather than each writing its own regex.
function namesWeightLoss(seg) {
  return /weight[\s-]*loss|weight management|slimming/i.test(seg);
}

// Find the first breach in a whole surface. Returns {re, why, match} or null.
// Callers supply their own sentence splitter because the page checker reads
// raw HTML with comments blanked and the pack checker reads markdown.
function findSelfScoping(text) {
  for (const [re, why] of SELF_SCOPING) {
    const m = text.match(re);
    if (m) return { re: re, why: why, match: m[0] };
  }
  return null;
}

function findInContext(seg) {
  if (!namesWeightLoss(seg)) return null;
  for (const [re, why] of IN_CONTEXT) {
    const m = seg.match(re);
    if (m) return { re: re, why: why, match: m[0] };
  }
  return null;
}

module.exports = {
  SELF_SCOPING: SELF_SCOPING,
  IN_CONTEXT: IN_CONTEXT,
  namesWeightLoss: namesWeightLoss,
  findSelfScoping: findSelfScoping,
  findInContext: findInContext
};
