/*
  outcome-promise-patterns.js  (added 2026-08-29 on the item 4.7 sixth quality pass)

  The protection and immunity promises no travel copy may make, defined ONCE
  and required by every checker that needs them, the same convention as
  tools/claim-patterns.js and tools/seo-pattern.js.

  Why it is its own file. The list started as RULE 12 inside
  check-travel-clinic-copy.js, added earlier the same day by the 4.15 quality
  pass, and that checker reads the generated pages and nothing else. The item
  4.7 fifth quality pass (2026-08-13) had already recorded, unfixed, that the
  same guarantee injected into Post D of a GBP pack walks past every checker,
  and the sixth pass re-proved it by mutation after the 4.15 fix shipped:
  "We guarantee full protection for every destination." in Post D of
  gbp-packs/mccanns-sandringham.md passed all 36 checkers, because
  check-travel-clinic-copy.js does not read gbp-packs/ and the pack checker's
  own EFFICACY_FAIL list carries "guaranteed" wording about RESULTS, not about
  protection. A pack is pasted onto a public Google profile as an
  advertisement, so it cannot promise what a page may not. Two copies of the
  rule would agree right up to the moment somebody edits one, which is the
  argument claim-patterns.js already records, so the list moved here and both
  checkers require it.

  Deliberately promise-framed. A travel vaccine reduces risk; these target a
  PROMISE of protection or immunity as an outcome, not ordinary clinical
  English. The 4.15 pass rejected a draft that flagged bare "full protection",
  because the generator's own book-ahead FAQ legitimately says some vaccines
  "take time to give full protection" on all 15 pages. Keep that discipline:
  widen only on injection evidence, and sweep the repo for legitimate uses
  before shipping a pattern. Questions are exempt at the call sites, because a
  question is not a promise.

  Each entry is [regexp, plain-English reason].
*/
"use strict";

var OUTCOME_PROMISE = [
  [/guarantee[a-z]*/i, "uses guarantee wording"],
  [/100\s*%/, "promises a percentage"],
  [/\bassured?\s+(?:of\s+)?(?:full\s+)?(?:protection|immunity)/i, "promises assured protection"],
  [/(?:fully|completely|totally)\s+(?:protected|immune)\b/i, "promises full protection"],
  [/lifelong\s+(?:protection|immunity)/i, "promises lifelong protection"],
  [/will\s+protect\s+you/i, "promises protection as an outcome"]
];

module.exports = { OUTCOME_PROMISE: OUTCOME_PROMISE };
