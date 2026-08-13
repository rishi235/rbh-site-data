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
  [/\b(?:the|our|uk'?s|nations?'?s)\s+(?:best|finest|leading|top|safest|strongest|fastest|quickest|number\s*one|no\.?\s*1)\b[^.\n]{0,40}?\b(?:treatment|clinic|service|programme|program|plan|injection|jab|weight\s*loss)\b/i, "superlative comparative claim"],
  [/\b(?:best|strongest|safest|fastest|quickest)\s+(?:weight\s*loss|slimming)\b/i, "superlative comparative claim"],
  [/\bbest[- ]in[- ]class\b/i, "superlative comparative claim"]
];

// Returns [regexp, reason] for the first pattern this text breaches, or null.
function findClaim(text) {
  for (let i = 0; i < CLAIM_PATTERNS.length; i++) {
    if (CLAIM_PATTERNS[i][0].test(text)) return CLAIM_PATTERNS[i];
  }
  return null;
}

module.exports = { CLAIM_PATTERNS: CLAIM_PATTERNS, findClaim: findClaim };
