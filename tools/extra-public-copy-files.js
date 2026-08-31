/*
  extra-public-copy-files.js  (added on the item 6.2 quality pass (fourth),
  2026-08-31)

  Single source of truth for the six files that carry live estate copy without
  being a generated page under modules/[family]/pages/: two hand-pasted Weebly embeds
  (modules/switch/weebly.html, modules/emar/weebly), two DRAFT-*.html content
  specs the weight loss and travel clinic generators name in their own headers
  as their approved-copy source, and two Cherry Lane "old page" replacement
  blocks pasted over dead live URLs to preserve their Google rank (see
  CLAUDE.md, "The copy that reaches the public without being generated").

  Until this pass, only check-em-dashes.js knew this list (as its own
  hardcoded EXTRA_HTML), added across the item 3.9 and 5.1 quality passes.
  check-service-links.js's RULE 2 (efficacy/results claims) and RULE 3 (POM
  medicine names) exist specifically to keep prescription-only medicine names
  and outcome promises out of public copy, and both read only
  modules/[family]/pages/, so the exact class of file this repo already knew carried
  that risk (the item 3.9 pass found &ndash; entities surviving in
  DRAFT-weight-loss-copy.html after the generated pages were fixed) sat
  outside the one checker built for medicine names and claims. Zero hits on
  all six files when this was added, so the gap was latent, not a live
  breach - the same shape as every other "ask which files it read" finding in
  this repo.

  Kept as ONE list rather than two copies that happen to agree, because two
  copies that agree are indistinguishable from one source of truth right up
  to the moment somebody edits one - the same argument CLAUDE.md already makes
  for the seven hardcoded WhatsApp numbers.

  Each entry is a path SEGMENT ARRAY, not a joined path, so each caller
  composes it against its own REPO constant: path.join(REPO, ...segments).
*/
const EXTRA_HTML_SEGMENTS = [
  ["modules", "switch", "weebly.html"],
  ["modules", "emar", "weebly"],
  ["modules", "service", "DRAFT-weight-loss-copy.html"],
  ["modules", "service", "DRAFT-travel-clinic-copy.html"],
  ["modules", "service", "weebly-paste", "cherry-lane-old-pharmacy-first-replacement.html"],
  ["modules", "service", "weebly-paste", "cherry-lane-old-weight-loss-replacement.html"]
];

module.exports = { EXTRA_HTML_SEGMENTS: EXTRA_HTML_SEGMENTS };
