/*
  audits/verify-4.11-2026-09-18-twentyfirst.js

  Item 4.11 quality pass (twenty-first), SK Chemists Bootle GBP pack
  (gbp-packs/sk-chemists-bootle.md) and its 12 generated pages, 2026-09-18,
  unattended scheduled run (audit-backlog-worker), Cowork sandbox
  mcp__workspace__bash.

  SELECTION: all eight unchecked AGENT_WORKLIST.md lines confirmed [BLOCKED]
  by direct grep (5.3, 5.4, 5.5, 5.8, 6.1, both Q60 lines under 6.4/6.5, 6.6),
  matching run 101's own finding from earlier the same day. Fell to the
  quality-pass fallback. Rotation pool re-derived independently in Python:
  51 itemised `- [x]`/`- [ ]` blocks parsed into their own line ranges,
  excluding the seven standing out-of-rotation items (1.1, 1.4, 2.2, 5.6,
  5.7, 6.7, 6.8) and the thirteen items already touched earlier today,
  2026-09-18 (1.2, 2.3, 3.1, 3.2, 3.7, 3.9, 3.11, 3.12, 3.13, 4.6, 4.12, 6.2,
  6.3 - the last thirteen picked across runs 88-101, confirmed by grepping
  "Picked N.N" out of each of today's 14 AGENT_LOG.md entries). 23 candidates
  remained. `git log -1 --format=%ad --date=iso-strict -L<start>,<end>:AGENT_WORKLIST.md`
  taken per candidate: 4.11 came out stalest at 2026-09-17T12:14:15+01:00,
  ahead of 5.1 (12:42:26), 4.2 (13:15:10) and 20 others, matching run 101's
  own forward note exactly (4.11 was the second-stalest candidate on run 101,
  behind only 4.6, which run 101 itself picked and removed from the pool).

  FRESH ANGLE: twenty prior passes had proven check-nap, check-postcodes,
  check-em-dashes (claimed only, see correction below), check-jsonld,
  check-branch-identity (claimed only, see correction below),
  check-pharmacy-first-eligibility, check-gbp-packs.js (phone, postcode,
  Post C link, hours-line day-presence, UTI cohort, CLINIC_QUALIFIERS,
  BODY_IMAGE, OUTCOME_PROMISE, POM_CLASS, CATEGORY_RULES, SERVICE_RULES, the
  services/categories vocabulary allowlists, the photo shot list rules, the
  sister-branch claim rule's no-sister-exists path), check-app-membership.js
  Rule 8 (all four sub-mechanisms), check-brand-spelling.js's MISSPELT list,
  check-gbp-pharmacy-first.js (12 rules), check-pharmacy-first-cost.js
  (rules 4, 5, 6) and check-whatsapp-route.js (rules 4, 5, 6) against this
  pack or these pages by direct injection - but tools/check-map-embeds.js had
  never once been named with an actual injection record, confirmed by
  grepping the item's full 903-line block for "map-embed" and "map embed":
  one hit only, inside the seventeenth pass's own summary sentence listing
  it (alongside check-branch-identity.js and check-em-dashes.js) as already
  "proven ... by direct injection" - a claim with no injection description
  anywhere in the sixteen passes before it or the four passes since. The
  twentieth pass's own jsonld work makes the same point from the other
  direction: it explicitly ran a fresh check-jsonld.js injection round on
  2026-09-17 despite the seventeenth pass's identical sentence, six days
  earlier, already claiming jsonld was proven. This is the "ask which files
  it actually read" lesson CLAUDE.md names repeatedly (check-seo-lengths
  rule 3, check-nap, check-cdn-pins) applied to this item's own paper trail:
  a summary sentence recapping prior work is not itself evidence, and one
  pass's unchecked claim was silently propagating as fact for four more
  passes until this one re-verified it by direct grep before relying on it.
  check-branch-identity.js and check-em-dashes.js remain equally unproven
  against this branch specifically and are recorded here as open gaps for a
  future pass, not addressed in this one to keep this pass to a single fresh
  angle.

  check-map-embeds.js (added item 3.9 pass, 2026-08-11) holds six rules: (1)
  generators compose the query from branches.json's three address fields
  through encodeURIComponent, no literal; (2) coverage, exactly one map embed
  per page, both directions; (3) the address, decoded query equals the
  branch's own streetAddress/addressLocality/postalCode; (4) agreement, the
  map matches the contact card's own printed address on the same page; (5)
  encoding, the URL is properly percent-encoded, on www.google.com, keeps
  output=embed; (6) directions, a "Get directions" destination matches the
  map query on the same page. SK Chemists Bootle has no branch landing page
  (confirmed: not present under modules/branch/pages), so rule 6 does not
  apply to this branch; rules 2, 3, 4 and 5 do, across all 12 of its
  generated pages.

  METHOD: full repo (modules/, tools/, branches.json, gbp-packs/) byte-copied
  to /tmp/scratch-411, a disposable scratch directory outside any tracked or
  connected path; the tracked repo was never opened for writing during the
  injection round. Each injection applied to a freshly restored copy (byte
  copy from the tracked repo, not git checkout - this mount's .git/index.lock
  and .git/HEAD.lock unlink-permission quirk, the standing Q87/Q96 constraint,
  made a git-based restore unreliable again this session at steps 1-2 before
  any item work began), sha256-reconfirmed identical before the next round.

  BASELINE
  --------
  branches.json sha256 (tracked repo, before and after this pass):
    169bb5a21cf62b196600d61260e0689fee040491fd0c3637eb2ac91f2ad1b102
    (the standing regression anchor, unchanged).
  Pack sha256 (tracked repo, before and after this pass):
    637aed98bee4c1826ded6263ae60ad20962742a35dc1b735ac2144e8a6f222da
    (matches all twenty prior passes' own recorded value exactly - byte-
    stable across twenty-one passes; this pass touches the branch's GENERATED
    PAGES, not the pack itself, so the pack file was not opened for writing).
  All 34 tools/check-*.js run individually on the tracked repo before any
  work (check-live-hours.js excluded, needs network, same convention as the
  twentieth pass): 34/34 exit 0.
  check-map-embeds.js baseline run (scratch copy): clean, 16 trading
  branches, 16 map addresses read from branches.json, 177 generated pages,
  177 map embeds, 6 directions buttons, 6 generators checked.

  THREE INJECTIONS plus one CONTROL, each against a freshly restored scratch
  copy of the named page, sha256-reconfirmed byte-identical to the tracked
  original before the next:

  1. RULES 3 + 4 (the address, and agreement with the contact card) -
     earache-treatment-sk-chemists-bootle.html's map iframe query changed
     from SK Chemists Bootle's own address to Cherry Lane Pharmacy's
     ("202 Cherry Lane, Liverpool, L4 8SG"), the contact card left untouched.
     CAUGHT on both rules simultaneously, as expected: '[the address] ...
     map points at "202 Cherry Lane, Liverpool, L4 8SG" and branches.json
     gives this branch "516 Stanley Road, Bootle, L20 5DW"' and
     '[agreement] ... contact card reads "516 Stanley Road, Bootle, L20 5DW"
     and the map underneath it points at "202 Cherry Lane, Liverpool,
     L4 8SG"'.

  2. RULE 5 (encoding) - shingles-treatment-sk-chemists-bootle.html's map
     query given a raw, unencoded space ("516%20Stanley Road%2C..."  in
     place of "516%20Stanley%20Road%2C..."), on a freshly restored copy.
     CAUGHT first attempt, exactly the one rule: '[encoding] ... map query
     carries a raw space or comma, which breaks the embed:
     516%20Stanley Road%2C%20Bootle%2C%20L20%205DW'.

  3. RULE 2 (coverage) - sinusitis-treatment-sk-chemists-bootle.html given a
     second, duplicated map iframe immediately after the first (the "pasted
     a second map by hand" shape the rule's own header names), on a freshly
     restored copy. CAUGHT first attempt, exactly the one rule:
     '[coverage] ... carries 2 map embed(s), expected exactly 1'.

  CONTROL - uti-treatment-sk-chemists-bootle.html's VISIBLE phone number and
  tel: link changed to a wrong number (0151 944 9999), the map and contact
  card address left untouched, on a freshly restored copy. check-map-embeds.js
  correctly stayed silent (exit 0, zero mentions of the page), confirming no
  cross-fire; check-nap.js independently caught it with four MISMATCH lines
  (tel link, visible phone, and both phone-like-number-not-this-branch's
  checks). Confirms check-map-embeds.js's scope is exactly what its own rules
  claim and no wider.

  All four injections caught on the first attempt with the expected
  rule-specific message; the control passed clean on check-map-embeds.js and
  failed as expected on check-nap.js. All four touched pages restored by
  byte copy from the tracked repo and sha256-reconfirmed identical to the
  tracked original after each individual restoration:
    earache-treatment-sk-chemists-bootle.html:
      1c3813eb3018cd18abfa20769a7e5374b459a64c98a8b378267d51bde0e41575
    shingles-treatment-sk-chemists-bootle.html:
      12fa2ecbc9467d86595aef3531dca05d029b51c22e85fcf8c6740cae002a40c5
    sinusitis-treatment-sk-chemists-bootle.html:
      bc281d57de197663a2f3bec4d824f50c53e0fba929e7fcdbf0b3777e0a0b55a7
    uti-treatment-sk-chemists-bootle.html:
      03add12e27bccb210aa20619987c8e8caa4c4ae32361653d4ac9828db98a718f
  Full 34-checker suite re-run on the tracked repo after the round: 34/34
  exit 0. All 12 of SK Chemists Bootle's generated pages, branches.json and
  the pack itself sha256-confirmed unchanged from baseline (see log entry
  for the full list). The tracked repo was never opened for writing during
  the injection round; only /tmp/scratch-411 (outside any tracked or
  connected path) was mutated and restored throughout.

  RESULT: no in-repo defect. check-map-embeds.js was already correctly
  holding this branch's generated pages to all four rules tested, now
  proven directly by injection for the first time in this item's
  twenty-one-pass history. No checker logic, pack copy, page, generator or
  data field changed anywhere in the repo. check-branch-identity.js and
  check-em-dashes.js remain unproven by direct injection against this
  branch specifically and are the recommended fresh angle for a future pass.

  LIVE HALF: performed this pass, Claude in Chrome connected (single
  instance, no dual-browser ambiguity). Step 3 answer pickup: navigated to
  https://data.rbhealth.co.uk/api/feedback and read the full JSON feed -
  newest entry still Q52, 2026-09-01T22:44:51.524Z, identical to every run
  since 2026-09-01 and already recorded answered in QUESTIONS.json. Nothing
  new to pick up. Fetched
  https://www.skchemist.co.uk/earache-treatment-sk-chemists-bootle.html live
  (the page targeted by this pass's own injection 1) and read its extracted
  text: contact card reads "516 Stanley Road, Bootle, L20 5DW", phone
  "0151 944 1013", hours Monday-Friday 9:00am-6:00pm with Saturday and
  Sunday closed, all matching branches.json and the repo source exactly. A
  direct javascript_tool read of the live iframe's src attribute was blocked
  by the browser extension's own cookie/query-string content policy; the
  extracted-text confirmation above was taken as sufficient rather than
  retrying the blocked route. No new live finding; standing item 5.3/Q34,
  5.8/Q58 and Q99 positions not re-read this pass (last confirmed on the
  eighteenth, twentieth and twentieth passes respectively, unchanged).

  No new defect, no new question raised. Evidence in this file and in
  AGENT_WORKLIST.md's own item 4.11 block.
*/
console.log("See header comment for the full twenty-first quality pass record. " +
  "This file is a record of work already performed and verified interactively; " +
  "it is not a re-runnable harness.");
