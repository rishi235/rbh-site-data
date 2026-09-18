#!/usr/bin/env node
/*
  audits/verify-5.2-2026-09-18-twentieth.js

  Item 5.2 quality pass, twentieth. Rotation-pool pick: all eight remaining
  unchecked AGENT_WORKLIST.md lines were [BLOCKED] this run (5.3, 5.4, 5.5,
  5.8, 6.1, both Q60 lines under 6.4/6.5, 6.6), so a quality pass was
  required. Rotation pool re-derived fresh from
  `git log --pretty="%aI|%s" -i --grep="item N.N[^0-9]"` per candidate item,
  over the 36 items minus the seven standing out-of-rotation items (1.1,
  1.4, 2.2, 5.6, 5.7, 6.7, 6.8) and the eight blocked items: 5.2 came out
  uniquely stalest at 2026-09-17T17:41:21+01:00, ahead of the next tier
  (3.8, 2026-09-17T18:11:03+01:00) and everything else, all touched later
  on 2026-09-17 or on 2026-09-18 by other runs today.

  NEW ANGLE. Of the eighteen checkers proven by direct injection against
  this item's own four pages across nineteen prior passes (see the
  nineteenth pass's own "Guard coverage" list in AGENT_WORKLIST.md),
  tools/check-seo-sheets.js had never been run against them, despite being
  one of the five core SEO checkers CLAUDE.md names by name (check-seo-
  pattern, check-seo-sheets, check-em-dashes, check-seo-keywords, check-
  seo-lengths) and despite its own header citing "branch landing pages" as
  one of the two generators it was written against after finding a
  composed-twice description drift (2026-08-09, sixteenth build run - an
  unrelated historical fix, not an item-5.2 pass). check-seo-pattern.js and
  check-seo-keywords.js are both on the covered list; check-seo-sheets.js,
  which guards the OTHER two Weebly fields (title, description) against
  the paste sheets rather than against the pattern composer, was not.

  This script proves four things against a full scratch copy of the
  tracked repo (never the working tree this pass ran from), covering both
  paste-sheet dialects (SEO.md and INDEX.md) and both directions of drift
  (page wrong, sheet wrong) plus the missing-entry case:

  1. BASELINE - all four of this item's pages agree with both
     modules/branch/pages/SEO.md and modules/branch/pages/INDEX.md.
     check-seo-sheets.js reports 177 SEO-sheet entries, 163 INDEX-sheet
     entries, 177 pages compared, 0 failures.
  2. TITLE DRIFT, page side - the "Weebly page SEO title" head-comment
     line on pharmacy-mccanns-aigburth.html was appended with " Extra".
     CAUGHT twice at once: "title drift" against SEO.md and "title drift
     against the INDEX sheet" against INDEX.md, since the same page feeds
     both comparisons.
  3. DESCRIPTION DRIFT, sheet side - SEO.md's Page Description for
     pharmacy-scorah-hazel-grove was changed to a different serving-area
     sentence, page untouched. CAUGHT: "description drift".
  4. MISSING SHEET ENTRY - the whole "## Scorah Chemists Bramhall" block
     was deleted from SEO.md. CAUGHT: "pharmacy-scorah-bramhall.html: no
     entry in any paste sheet, so there is nothing to paste into its
     Weebly SEO fields".
  5. INDEX-DIALECT TITLE DRIFT - INDEX.md's "SEO title" row for McCanns
     Sandringham was reverted from "St Michael's" back to "Sandringham"
     (the pre-Q15 wording), SEO.md and the page untouched. CAUGHT: "title
     drift against the INDEX sheet", page reading "St Michael's" against
     an index value reading "Sandringham" - a live re-confirmation, as a
     side effect, that the Q15/item 5.7 seoTown correction is still
     holding in this sheet four weeks on.

  Discipline matches passes 9-19 on this item: refuses to run on a dirty
  scratch tree (cp -a snapshot from the tracked repo taken immediately
  before any injection), restores every touched file from an in-memory-
  held original immediately after each round, sha256-reconfirms byte-
  identical restoration after every injection, then reruns the full
  36-checker suite once after all four rounds are restored. The tracked
  working copy this pass was launched from is never written to; all
  mutation happens in /tmp/scratch52b, a throwaway copy outside git's view
  of the real repo.

  Run:  node audits/verify-5.2-2026-09-18-twentieth.js
  This file is a record of what was done and its output, per this repo's
  own convention (CLAUDE.md, "Evidence:" lines). It is not meant to be
  re-run unattended against a live tree; it is retained as documentation
  of the injection rounds actually performed, mirroring
  audits/verify-5.2-2026-09-17-nineteenth.js.
*/
"use strict";

console.log(`
ACTUAL COMMANDS RUN THIS PASS (see AGENT_LOG.md for full narrative):

  rm -rf /tmp/scratch52b && cp -a . /tmp/scratch52b
  cd /tmp/scratch52b
  node tools/check-seo-sheets.js
    -> 177 SEO-sheet entries and 163 INDEX-sheet entries across 11 sheets
    -> 177 generated pages compared, 163 also against an INDEX sheet
    -> clean, every page and its paste sheet agree

  sha256 baselines:
    pharmacy-mccanns-aigburth.html:
      0a565da2f34ff5240728893166426c0e2592209feb98a84d799822448c384841
    modules/branch/pages/SEO.md:
      bddc9d45747773543df171309f4f8cd5f4349830955ee1eb42038b3405e0823c
    modules/branch/pages/INDEX.md:
      09166f27b575f202a13db1df176f73601223ae31ca615e6a2d8ae96b5c8936ce

  ROUND 1 (TITLE DRIFT, page side): appended " Extra" to the "Weebly page
    SEO title" line in modules/branch/pages/pharmacy-mccanns-aigburth.html
    -> FAIL pharmacy-mccanns-aigburth: title drift against the INDEX sheet
       page  : Pharmacy in Aigburth, Merseyside - McCanns Chemist Extra
       index : Pharmacy in Aigburth, Merseyside - McCanns Chemist
    -> FAIL pharmacy-mccanns-aigburth: title drift
       page  : Pharmacy in Aigburth, Merseyside - McCanns Chemist Extra
       sheet : Pharmacy in Aigburth, Merseyside - McCanns Chemist
    -> restored from /tmp/mccanns-aigburth.orig.html; sha256 reconfirmed
       identical to the baseline above.

  ROUND 2 (DESCRIPTION DRIFT, sheet side): changed the Page Description
    for pharmacy-scorah-hazel-grove in modules/branch/pages/SEO.md to a
    different serving-area sentence ("Serving Hazel Grove and Stockport
    town centre" in place of "Serving Hazel Grove, Bramhall, Offerton and
    Great Moor"), page left untouched.
    -> FAIL pharmacy-scorah-hazel-grove: description drift
       page  : ...Serving Hazel Grove, Bramhall, Offerton and Great Moor.
       sheet : ...Serving Hazel Grove and Stockport town centre.
    -> restored from /tmp/branch-SEO.orig.md; sha256 reconfirmed identical
       to the baseline above; re-ran clean immediately after restore.

  ROUND 3 (MISSING SHEET ENTRY): deleted the entire "## Scorah Chemists
    Bramhall" block (six lines) from modules/branch/pages/SEO.md.
    -> FAIL pharmacy-scorah-bramhall.html: no entry in any paste sheet,
       so there is nothing to paste into its Weebly SEO fields
    -> SEO-sheet entry count dropped from 177 to 176, confirming the
       block was genuinely gone rather than merely reordered.
    -> restored from /tmp/branch-SEO.orig2.md; sha256 reconfirmed
       identical to the baseline above.

  ROUND 4 (INDEX-DIALECT TITLE DRIFT): changed the "SEO title" row for
    McCanns Chemist Sandringham in modules/branch/pages/INDEX.md from
    "Pharmacy in St Michael's, Merseyside - McCanns Chemist" back to
    "Pharmacy in Sandringham, Merseyside - McCanns Chemist" (the pre-Q15
    wording), SEO.md and the page left untouched.
    -> FAIL pharmacy-mccanns-sandringham: title drift against the INDEX
       sheet
       page  : Pharmacy in St Michael's, Merseyside - McCanns Chemist
       index : Pharmacy in Sandringham, Merseyside - McCanns Chemist
    -> incidental live re-confirmation that the Q15/item 5.7 seoTown
       correction (Sandringham -> St Michael's) is still holding in this
       sheet: the page and SEO.md both still read St Michael's, so only
       the injected INDEX.md copy disagreed.
    -> restored from /tmp/branch-INDEX.orig.md; sha256 reconfirmed
       identical to the baseline above.

  Full 36-checker suite re-run once after all four rounds restored:
  36/36 exit 0 (check-live-hours.js excluded, network-dependent).

  git status --porcelain on the tracked working copy (modules, tools,
  branches.json, gbp-packs, core) before and after this pass: only the two
  long-standing pre-existing untracked strays already logged on every
  prior pass (gbp-packs/.fuse_hidden0000000400000001,
  modules/service/pages/notarealservice-fishlocks-ainsdale.html.bak),
  neither created nor touched by this pass. All mutation happened in
  /tmp/scratch52b only.

RESULT: no in-repo defect. tools/check-seo-sheets.js was already
correctly guarding this item's four branch landing pages against both
paste-sheet dialects, in both drift directions, and against a missing
entry - now proven directly by injection for the first time in this
item's twenty-pass history.
`);
