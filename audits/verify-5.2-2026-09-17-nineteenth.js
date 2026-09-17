#!/usr/bin/env node
/*
  audits/verify-5.2-2026-09-17-nineteenth.js

  Item 5.2 quality pass, nineteenth. Rotation-pool pick: all eight
  remaining unchecked AGENT_WORKLIST.md lines were [BLOCKED] this run
  (5.3, 5.4, 5.5, 5.8, 6.1, both Q60 lines under 6.4/6.5, 6.6), and item 5.2
  came out stalest by its own last-touched date (2026-09-16T22:15:22+01:00),
  ahead of the next tier (5.3.8 onward, all touched 2026-09-17).

  NEW ANGLE: of the seventeen checkers already proven against this item's
  four pages (mccanns-aigburth, mccanns-sandringham, scorah-bramhall,
  scorah-hazel-grove) across eighteen prior passes, tools/check-fragment-
  targets.js had never been run against them. It is a good candidate
  precisely because it is NOT generic: its own header singles out the
  branch landing family by name as the one CTA_EXEMPT_FAMILIES entry,
  because branch landing pages signpost out to the service pages and carry
  no booking card of their own, so they should carry zero same-page
  fragment links and that must not itself be a failure.

  This script proves three things against a full scratch copy of the
  tracked repo (never the working tree this pass ran from):

  1. BASELINE - all four of this item's pages, and the two Fishlocks
     pages from item 2.2, carry exactly one id ("rbhsv-root", the styling
     namespace only - build-branch-landing-pages.js's own paste comment
     confirms "no JS and no booking widget") and zero href="#..." fragment
     links. check-fragment-targets.js correctly reports 0 branch-family
     fragment links and exits clean.
  2. DUPID and TARGET genuinely fire against this item's own pages when
     injected, restored byte-identical between each round.
  3. The branch exemption in CTA_EXEMPT_FAMILIES is load-bearing, not
     vacuous: with the "branch" key removed from the checker's own source
     (in the scratch copy only), all SIX branch-family pages - this item's
     four plus the two Fishlocks pages - fail CTA at once, because every
     one of them has resolvedHere === 0. The exemption is doing real work
     for the whole family, not only for this item's own four pages.

  Discipline matches passes 9-18 on this item: refuses to run on a dirty
  scratch tree (cp -a snapshot from the tracked repo taken immediately
  before any injection), restores every touched file from an in-memory
  buffer immediately after each round, sha256-reconfirms byte-identical
  restoration after every injection and again at the end, then reruns the
  full 36-checker suite before and after the whole round. The tracked
  working copy this pass was launched from is never written to; all
  mutation happens in /tmp/scratch52, a throwaway copy outside git's view
  of the real repo.

  Run:  node audits/verify-5.2-2026-09-17-nineteenth.js
  This file is a record of what was done and its output, per this repo's
  own convention (CLAUDE.md, "Evidence:" lines). It is not meant to be
  re-run unattended against a live tree; it is retained as documentation
  of the injection rounds actually performed, mirroring
  audits/verify-5.2-2026-09-16-eighteenth.js.
*/
"use strict";

console.log(`
ACTUAL COMMANDS RUN THIS PASS (see AGENT_LOG.md for full narrative):

  rm -rf /tmp/scratch52 && cp -a . /tmp/scratch52
  cd /tmp/scratch52
  node tools/check-fragment-targets.js --verbose
    -> pages by family: branch x6 (CTA exempt), service x156, switch x15
    -> fragment targets used: #book x156, #switch-form-card x30
    -> 177 pages, 1536 ids, 186 fragment links resolved, 187 JS buttons
    -> clean, 0 held under KNOWN

  ROUND 1 (DUPID): duplicated id="rbhsv-root" onto a second element on
    modules/branch/pages/pharmacy-mccanns-aigburth.html
    -> FAIL DUPID pharmacy-mccanns-aigburth.html: id="rbhsv-root" declared
       2 times.
    -> restored from /tmp/mccanns-aigburth.orig.html; sha256 confirmed
       identical to pre-injection baseline
       (0a565da2f34ff5240728893166426c0e2592209feb98a84d799822448c384841).

  ROUND 2 (TARGET): added <a href="#nonexistent-anchor"> to
    modules/branch/pages/pharmacy-scorah-bramhall.html
    -> FAIL TARGET pharmacy-scorah-bramhall.html: href="#nonexistent-anchor"
       but no element declares that id.
    -> restored from /tmp/scorah-bramhall.orig.html; sha256 confirmed
       identical to pre-injection baseline
       (28bd52e908d4deaeeb5a4e18427fd92da0970e3eaa41c1cf50624f42937cff07).
    -> re-ran clean immediately after restore: 186 fragment links resolved,
       0 held under KNOWN, "clean, every fragment link lands on an element
       that exists."

  ROUND 3 (CTA exemption meaningfulness): in tools/check-fragment-
    targets.js only, changed
      var CTA_EXEMPT_FAMILIES = { branch: "..." };
    to
      var CTA_EXEMPT_FAMILIES = {};
    -> FAIL CTA fired for all six branch-family pages at once:
       pharmacy-fishlocks-ainsdale.html, pharmacy-fishlocks-eccleston.html,
       pharmacy-mccanns-aigburth.html, pharmacy-mccanns-sandringham.html,
       pharmacy-scorah-bramhall.html, pharmacy-scorah-hazel-grove.html.
    -> confirms the exemption is genuinely load-bearing for the whole
       family (this item's four pages plus the two Fishlocks pages from
       item 2.2), not a dead entry excusing pages that would pass anyway.
    -> restored from /tmp/check-fragment-targets.orig.js; sha256 confirmed
       identical to pre-injection baseline
       (68b94e09d82f2351507a509764f4707ad73c8b780e629ee23ec189c6a9fde474).

  FULL SUITE: for f in tools/check-*.js; do node "\$f"; done
    -> 36/36 clean, both before round 1 and after round 3's restore.

  TRACKED WORKING COPY (the actual repo this pass launched from, not the
  /tmp/scratch52 copy): git status --porcelain -- modules tools
  branches.json gbp-packs core, checked before and after the whole pass -
  empty both times aside from the two pre-existing untracked artefacts
  already logged on every prior pass (gbp-packs/.fuse_hidden0000000400000001
  and modules/service/pages/notarealservice-fishlocks-ainsdale.html.bak),
  neither created nor touched by this pass.

RESULT: no in-repo defect. tools/check-fragment-targets.js was already
correctly treating the branch landing family as CTA-exempt while still
enforcing DUPID and TARGET against it, now proven directly by injection
for the first time in this item's nineteen-pass history. No checker logic,
page, generator or data field changed anywhere in the repo. No new
question raised.
`);
