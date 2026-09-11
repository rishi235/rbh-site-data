/*
  audits/verify-3.13-2026-09-11-fourteenth.js

  Item 3.13 quality pass (fourteenth), Clear Chemist (Liverpool/Aintree),
  2026-09-11, unattended scheduled run (audit-backlog-worker), Cowork sandbox
  mcp__workspace__bash.

  FRESH ANGLE: thirteen prior passes on this item had proven check-nap,
  check-postcodes, check-em-dashes, check-jsonld, check-map-embeds,
  check-branch-identity, check-weight-loss-copy, check-travel-clinic-copy,
  check-switch-copy, check-whatsapp-route, check-gbp-packs and (thirteenth
  pass, 2026-09-10) check-app-membership by injection against Clear Chemist
  Aintree's own files, but never tools/check-booking-routes.js, despite Clear
  carrying two live Appointedd booking mounts (weight-loss-clinic-clear-
  aintree.html, travel-clinic-clear-aintree.html) and being one of the
  branches with no Pharmacy First widget at all (pfBooking: false, no
  pharmacyFirst entry in widgets), which makes it a genuine test of rule 3's
  "no fallback available" path rather than the "falls back to Pharmacy First"
  path most other branches exercise.

  METHOD: shells out to the real tools/check-booking-routes.js as a child
  process (never imported), against byte-copy backups of the two target pages
  and branches.json, restoring by byte copy (not git checkout) and
  sha256-reconfirming identical before the next injection.

  BASELINE
  --------
  git status --porcelain on the three target files: clean.
  All 36 tools/check-*.js run individually: 36/36 exit 0.
  sha256 before any mutation:
    weight-loss-clinic-clear-aintree.html:
      bc59665be986a853cc6b6ab8406f17a3ecdc5710c26e22a9eff30ec8c4dd98aa
    travel-clinic-clear-aintree.html:
      a42a3d3a3c607b3e856680fd2e882155a9b82de2a45a4433fb3dc6756ded4796
    branches.json:
      904de09bc3118cefcfd7ae3f8e045b9ea1d090c634c70114f135101f0b969e1e

  FOUR INJECTIONS, each restored byte-identical (sha256-reconfirmed) before
  the next:

  1. RULE 4 (branchattr, wrong value) - weight-loss-clinic-clear-aintree.html:
     data-branch="Clear Chemist" changed to data-branch="Fishlocks Chemist".
     CAUGHT first attempt: 'data-branch="Fishlocks Chemist" but the URL
     resolves to clearchemist_aintree ("Clear Chemist"), so an enquiry from
     this page is filed against the wrong pharmacy'.

  2. RULE 5 (serviceattr, missing) - travel-clinic-clear-aintree.html:
     data-service="Travel Clinic" changed to data-service="".
     CAUGHT first attempt: 'has a booking mount but no data-service on
     #rbhsv-root, so the enquiry is labelled "Pharmacy service"'.

  3. RULE 3 (widget, no fallback available) - branches.json:
     widgets.travelClinic deleted from the clearchemist_aintree record.
     travelClinic is in service.js's NO_FALLBACK_SERVICE_KEYS, and Clear has
     no pharmacyFirst widget to fall back to regardless, so this proves the
     "genuinely no diary" path rather than the "wrong diary via fallback"
     path.
     CAUGHT first attempt: 'travel-clinic-clear-aintree.html needs
     widgets.travelClinic on clearchemist_aintree and there is none (this
     service must not fall back), so the booking box renders empty'.

  4. RULE 4 (branchattr, missing attribute) - weight-loss-clinic-clear-
     aintree.html: data-branch attribute removed entirely from #rbhsv-root
     (distinct code path from injection 1, which supplied a wrong value
     rather than omitting the attribute).
     CAUGHT first attempt: 'has a booking mount but no data-branch on
     #rbhsv-root, so an enquiry from it is labelled "our pharmacy"'.

  CONTROL - travel-clinic-clear-aintree.html: data-service and data-branch
  attributes on #rbhsv-root swapped in order, values unchanged.
  Correctly PASSED, exit 0, confirming the checker reacts to attribute
  presence/value rather than attribute order.

  RESTORE AND RE-VERIFY
  ----------------------
  All three files restored from byte-copy backups and sha256-reconfirmed
  identical to baseline after the final injection. Full 36-checker suite
  re-run: 36/36 exit 0. git status --porcelain: no tracked file changed
  (only the same pre-existing untracked debris every recent pass has
  recorded: gbp-packs/.fuse_hidden0000000400000001,
  modules/service/pages/notarealservice-fishlocks-ainsdale.html.bak, both
  pre-dating this run).

  RESULT: no in-repo defect. tools/check-booking-routes.js was already
  correctly holding Clear Chemist Aintree's own two booking pages across
  rules 3, 4 and 5, now proven directly by injection for the first time in
  this item's fourteen-pass history, including the "no fallback available"
  branch of rule 3 that most other branches' passes cannot exercise because
  they hold a Pharmacy First widget to fall back to.

  LIVE HALF: not attempted. mcp__claude-in-chrome__tabs_context_mcp reported
  "Claude in Chrome is not connected" (standing Q59, one attempt, no retry
  per the task's own rule). Live state not re-confirmed this pass and should
  not be assumed unchanged from the last live read.
*/
