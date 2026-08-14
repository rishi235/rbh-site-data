/*
  claim-patterns.js  (added 2026-08-11 on the item 3.6 quality pass)

  The efficacy and results wording the house rule on weight loss copy does not
  allow, defined ONCE and required by every checker that needs it, the same way
  tools/seo-pattern.js defines the title and H1 pattern once.

  Why it is its own file. The list started inside check-service-links.js, which
  reads the 177 generated .html pages and nothing else. The item 3.6 quality
  pass found that the Weebly paste sheets carry a fourth pasteable SEO field,
  Meta Keywords, that no checker read the CONTENT of, and a keyword line is
  exactly where "rapid weight loss Bootle" would be written. Adding a claims
  rule to the sheet side meant either copying the patterns into a second file
  or defining them once. Two copies of a rule that agree are indistinguishable
  from one rule right up to the moment somebody edits one, which is the same
  argument recorded against the seven hardcoded WhatsApp numbers in CLAUDE.md.

  Deliberately narrow. These target a promise about an OUTCOME, not ordinary
  service description. "Weight loss clinic in Bootle" is a service. "Lose up to
  22.5% of your body weight" is a claim. The house reference for anything
  weight loss is AI\RBH_WeightLoss_Advertising_Standards.md, which is not in
  this repo and must not be copied into it; read it before adding a pattern.

  Each entry is [regexp, plain-English reason].
*/
const CLAIM_PATTERNS = [
  [/delivers results/i, "promises results"],
  [/proven results/i, "promises results"],
  [/guaranteed results|results guaranteed/i, "guarantees results"],
  [/real results/i, "promises results"],
  [/lose up to/i, "quantified weight loss claim"],
  [/\d+(\.\d+)?\s*%\s*of your body/i, "quantified weight loss claim"],
  [/most effective (weight loss|treatment)/i, "comparative efficacy claim"],
  [/rapid weight loss|fast weight loss/i, "efficacy claim"],
  [/that actually works|treatment that works/i, "efficacy claim"],

  // Superlatives, added 2026-08-13 on the fourth item 4.13 quality pass.
  // "most effective" above was the ONLY comparative form the list held, so the
  // plainest way of writing the same claim went straight through: injected
  // into Riddings Post C, a weight loss advertisement bound for a public
  // Google profile, all six of "the best treatment for weight loss", "the
  // UK's number one weight loss clinic", "the leading weight loss clinic",
  // "the fastest treatment", "the safest weight loss treatment" and
  // "best-in-class" passed every checker in this repo. The house reference
  // names this exact class in its own words: information about medicines must
  // be balanced and factual, "X is used to treat..." rather than "X, the
  // best/fastest/strongest treatment for...".
  //
  // Deliberately noun-anchored rather than a bare superlative, because "best"
  // is ordinary English elsewhere in the same files: 11 of the 15 branch packs
  // say "otherwise the best straight-on frontage shot" in their photo shot
  // list, which is a direction to a photographer and not a claim about a
  // medicine, and those same 11 are the only packs using the word at all. A
  // bare superlative would therefore have failed 11 packs on copy that is
  // never posted. The superlative only fails where it qualifies the thing
  // being sold.
  [/\b(?:the|our|uk'?s|nations?'?s)\s+(?:best|finest|leading|top|safest|strongest|fastest|quickest|number\s*one|no\.?\s*1)\b[^.\n]{0,40}?\b(?:treatment|clinic|service|programme|program|plan|injection|jab|weight\s*loss|way|method|lose\s+weight|losing\s+weight)\b/i, "superlative comparative claim"],
  [/\b(?:best|strongest|safest|fastest|quickest)\s+(?:weight\s*loss|slimming)\b/i, "superlative comparative claim"],
  [/\bbest[- ]in[- ]class\b/i, "superlative comparative claim"],

  // The OUTCOME anchor, added 2026-08-14 on the fifth item 4.12 quality pass.
  // The 2026-08-13 superlative rule above anchored on the NOUN being sold, and
  // the noun list held only the things a pack calls the product: treatment,
  // clinic, service, programme, plan, injection, jab, weight loss. That leaves
  // out the plainest English there is for the same promise, which names the
  // outcome instead of the product. Injected into Post C of
  // coleman-leigh-walton.md, a weight loss advertisement bound for a public
  // Google profile, "This is the fastest and most effective way to lose
  // weight" passed ALL 36 CHECKERS. Two separate misses put it through:
  // "fastest" was followed by "way", which was in no noun list, and
  // "most effective" was only ever read in the fixed forms "most effective
  // weight loss" and "most effective treatment", so "most effective way"
  // matched nothing at all.
  //
  // It is the same fault the 4.13 pass wrote up one step further out. That
  // pass found the superlative expressed about the product and fixed it; this
  // is the superlative expressed about the result, which is what a person
  // actually writes when they are selling. "way" and "method" are added to
  // the noun anchor above, and the verb phrase "lose weight" / "losing
  // weight" is added beside them so a sentence that never names a noun at
  // all is still read.
  //
  // Three more words were drafted into that list and taken back out, because
  // a sweep of all 402 text files in this repo showed they are ordinary
  // clinical English here rather than selling words. "option" appears in
  // "call us and we will advise on the best option" - the travel clinic
  // caution about vaccines needing lead time, written into
  // build-travel-clinic-pages.js and therefore standing on all sixteen
  // generated travel clinic pages, which check-service-links.js reads. It is
  // advice to ring the pharmacy, not a promise about a product, and adding
  // the word would have failed sixteen live pages for saying the right
  // thing. "route" and "approach" were dropped with it on the same reasoning
  // (route of administration, a different pathway). This is the same
  // discipline the 2026-08-13 note above records for a bare superlative:
  // widen the anchor only as far as the evidence in the repo allows.
  //
  // "most effective" gets its own line rather than being folded into the
  // superlative pattern, because it is a two-word comparative rather than a
  // single superlative adjective and the original entry, which is left where
  // it is, only ever covered two of its forms. Kept noun-anchored and
  // distance-bounded for the reason the 4.13 note gives: a bare "effective"
  // is ordinary English about a service, and only the comparative qualifying
  // the thing being sold is a claim.
  [/\b(?:most|more)\s+effective\b[^.\n]{0,40}?\b(?:weight\s*loss|treatment|clinic|service|programme|program|plan|injection|jab|way|method|lose\s+weight|losing\s+weight)\b/i, "comparative efficacy claim"]
];

// Returns [regexp, reason] for the first pattern this text breaches, or null.
function findClaim(text) {
  for (let i = 0; i < CLAIM_PATTERNS.length; i++) {
    if (CLAIM_PATTERNS[i][0].test(text)) return CLAIM_PATTERNS[i];
  }
  return null;
}

module.exports = { CLAIM_PATTERNS: CLAIM_PATTERNS, findClaim: findClaim };
