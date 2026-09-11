/*
  audits/verify-4.11-2026-09-11-seventeenth.js

  Item 4.11 quality pass (seventeenth), SK Chemists Bootle GBP pack
  (gbp-packs/sk-chemists-bootle.md), 2026-09-11, unattended scheduled run
  (audit-backlog-worker), Cowork sandbox mcp__workspace__bash.

  SELECTION: all eight unchecked AGENT_WORKLIST.md lines confirmed [BLOCKED]
  by direct grep, so the quality-pass fallback applied. Rotation pool
  re-derived fresh in Python: 51 itemised `- [x]`/`- [ ]` blocks parsed into
  their own text ranges, one-off pool (1.1, 1.4, 2.2, 5.6, 5.7, 6.7, 6.8) and
  the eight blocked items (5.3, 5.4, 5.5, 5.8, 6.1, 6.4, 6.5, 6.6) excluded,
  latest 2026-MM-DD date string in each remaining block's own text taken as
  its last-verified date. Four items tied at 2026-09-10 (4.11, 5.1, 6.2, 6.3),
  matching the sixteenth pass's own forward note exactly. Lowest-item-number
  tiebreak: chosen 4.11.

  FRESH ANGLE: sixteen prior passes on this item had proven check-nap,
  check-postcodes, check-em-dashes, check-jsonld, check-map-embeds,
  check-branch-identity, check-pharmacy-first-eligibility (rule 11, a real
  defect found and fixed on the fourth pass), check-gbp-packs.js (phone,
  postcode, Post C link, hours line day-presence, UTI cohort,
  CLINIC_QUALIFIERS/BODY_IMAGE/OUTCOME_PROMISE/POM_CLASS, CATEGORY_RULES,
  SERVICE_RULES, the services/categories vocabulary allowlists, the photo
  shot list rules, the sister-branch claim rule's "no sister exists" breach
  path), check-app-membership.js Rule 8 (all four sub-mechanisms) and
  check-brand-spelling.js's MISSPELT list against this pack's own copy by
  direct injection - but tools/check-pharmacy-first-cost.js had never once
  been named across the item's sixteen-pass history, confirmed by grepping
  AGENT_WORKLIST.md's full 16820-17500 block for "pharmacy-first-cost"
  (zero hits) before starting. This is a genuine gap, not a false candidate:
  the checker declares its own PACK_DIR = gbp-packs/ and applies rules 4
  (no cost qualifier), 5 (no price) and 6 (pack whose branch runs Pharmacy
  First calls it free) to every pack, and branches.json confirms
  skchemists_bootle carries both pfLink and a pharmacyFirst widget, so rule
  6 genuinely applies here (unlike Clear Chemist Aintree, which runs no
  Pharmacy First and is exempt from rule 6 by design).

  METHOD: full repo copied by byte copy (with .git) to a scratch directory;
  all injections against the scratch copy's own gbp-packs/sk-chemists-bootle.md
  only; the tracked repo's copy was never opened for writing during the
  round. Each injection applied to a freshly restored copy (byte copy from a
  pristine backup, not git checkout - this mount's .git/index.lock made a
  git-based restore unreliable this session, the standing Q87/Q96 quirk),
  sha256-reconfirmed identical before the next round.

  BASELINE
  --------
  git status --porcelain on gbp-packs/sk-chemists-bootle.md: clean.
  Pack sha256 (tracked repo, before and after this pass):
    637aed98bee4c1826ded6263ae60ad20962742a35dc1b735ac2144e8a6f222da
    (matches all sixteen prior passes' own recorded value exactly - byte-
    stable across seventeen passes).
  All 36 tools/check-*.js run individually on the tracked repo: 36/36 exit 0.
  check-pharmacy-first-cost.js baseline run (scratch copy): clean, 112
  Pharmacy First pages, 16 GBP packs, 6 branch landing pages, zero failures.

  THREE INJECTIONS plus one CONTROL, each restored byte-identical
  (sha256-reconfirmed) before the next:

  1. RULE 6 (free claim, absence) - all three sentences naming Pharmacy
     First on this pack ("the free NHS service" in the business
     description, "NHS Pharmacy First: free NHS assessment" in the Services
     section, "is a free NHS service" in Post A) had the word "free" struck.
     CAUGHT first attempt: '[free] gbp-packs/sk-chemists-bootle.md:
     advertises NHS Pharmacy First but never calls it free (rule 6)'.

  2. RULE 4 (cost qualifier) - "It is an affordable way to be seen quickly."
     appended to Post A, after the rule-11 age-ranges caveat sentence.
     CAUGHT first attempt: '[qualifier] ... describes NHS Pharmacy First as
     "affordable" ... (rule 4)'.

  3. RULE 5 (price) - "Consultations from 5 pounds." appended to Post A, in
     place of injection 2 on a freshly restored copy.
     CAUGHT first attempt: '[price] ... states "5 pounds" on NHS Pharmacy
     First copy (rule 5)'.

  CONTROL - "Great value consultations available." appended to Post C (the
  weight loss clinic post, a genuinely private paid service naming no
  Pharmacy First condition and no PF word). Correctly PASSED, exit 0,
  confirming the checker's block-scoping private-service exclusion
  (packBlocks() + namesPharmacyFirst()) holds on this pack's own copy too,
  not only on the pack (Coleman and Leighs Walton, item 4.12 tenth pass)
  where the same exclusion was most recently proven.

  RESTORE AND RE-VERIFY
  ----------------------
  Pack restored byte copy after the final injection; sha256 reconfirmed
  identical to baseline (637aed98bee4c1826ded6263ae60ad20962742a35dc1b735ac2144e8a6f222da).
  Full 36-checker suite re-run on the scratch copy: 36/36 exit 0. Tracked
  repo's own copy of the pack separately reconfirmed sha256-unchanged and
  `git status --porcelain -- gbp-packs/sk-chemists-bootle.md
  tools/check-pharmacy-first-cost.js` empty throughout - the tracked file
  was never opened for writing.

  RESULT: no in-repo defect. tools/check-pharmacy-first-cost.js's rules 4,
  5 and 6, and its private-service block-scoping exclusion, were already
  correctly holding this pack's own copy; now proven directly by injection
  for the first time in this item's seventeen-pass history. No checker
  logic, pack copy, page, generator or data field changed anywhere in the
  repo.

  LIVE HALF: not attempted. mcp__claude-in-chrome__tabs_context_mcp reported
  "Claude in Chrome is not connected" (standing Q59), one attempt at answer
  pickup (step 3), no retry per the task's own rule. The sixteenth pass's
  own live findings (pharmacy-first-service-bootle.html item 5.3/Q34
  answered and applied; weight-loss-clinic.html item 5.8/Q58 regulatory
  exposure, unchanged, not fixed here) stand unverified for a further pass
  rather than re-claimed. Q58, Q80 and Q81 re-read from QUESTIONS.json (101
  total, 48 open), all still open, unchanged. No new defect, no new
  question raised this pass.

  GIT SYNC NOTE: this run inherited an already-orphaned .git/index.lock
  (measured 27 minutes old at step 1, well under the task's own 1-hour
  force-clear threshold) left behind by an earlier run today (item 3.13,
  fourteenth pass) that could not commit for the same reason. Per the
  explicit threshold, the lock was left in place rather than force-cleared.
  See this run's own AGENT_LOG.md entry for the git sync/push disposition.
*/
