/*
  verify-6.2-2026-09-18-eighteenth.js

  Item 6.2 (broken internal links / check-service-links.js), eighteenth
  quality pass, run 91 of audit-backlog-worker, 2026-09-18.

  FRESH ANGLE: RULE 1's three failure shapes (stale target, cross-host
  target, disposed-branch target) all resolve host and path through
  `.toLowerCase()` before comparing against estateHosts, the `generated`
  map and disposedHosts - every one of those data structures is built and
  keyed in lowercase. No prior pass (grepped: "case", "case-insensitiv",
  "toLowerCase", "mixed case", "capitali" - zero hits across seventeen
  prior passes) had ever tested what happens when the HREF ITSELF carries
  mixed or upper case in the host or path, as a hand-typed or copy-pasted
  link in a Weebly paste block realistically could. If the lowercasing
  were missing or wrong on any one of the three failure paths, a real dead
  or misrouted link written in mixed case would resolve to a lookup key
  that matches nothing in the lowercase-keyed maps, fall through silently,
  and read as "external, out of scope" - the exact silent-pass shape every
  prior 6.2 defect has taken.

  METHOD: full repo git-archived (`git archive HEAD | tar -x`) to a
  disposable scratch copy under the outputs mount; the tracked repo was
  never opened for writing. branches.json (sha256
  169bb5a21cf62b196600d61260e0689fee040491fd0c3637eb2ac91f2ad1b102) and
  tools/check-service-links.js (sha256
  07dacddecf0be8f0ec7e836d797b24394d7da855461d6bf380fca7cb9e641ab9) both
  confirmed byte-identical to the tracked repo before any mutation.
  Baseline confirmed clean first: 177 pages, 1000 links, 423 estate, 6
  known, exit 0.

  Four cases against the scratch copy, each restored by byte copy and
  sha256-reconfirmed identical before the next:

  (1) STALE TARGET, mixed case. Appended
      <a href="HTTPS://WWW.CherryLanePharmacy.co.uk/NotARealPage-XYZ.HTML">
      to modules/service/pages/earache-treatment-cherry-lane-walton.html -
      CAUGHT first attempt: FAIL [stale target], key correctly lowered to
      www.cherrylanepharmacy.co.uk/notarealpage-xyz.html.

  (2) CROSS-HOST TARGET, mixed case. Appended
      <a href="HTTPS://WWW.CherryLanePharmacy.co.uk/Earache-Treatment-Riddings-Timperley.HTML">
      to the same Cherry Lane page (Cherry Lane's own host, but naming a
      filename this repo generates only for Riddings) - CAUGHT first
      attempt: FAIL [cross-host target], correctly naming the real owner
      www.riddingspharmacy.co.uk despite every character of both host and
      path in the injected href being differently cased from the stored
      keys.

      NOTE ON A DISCARDED FIRST ATTEMPT: an earlier version of this case
      linked FROM Cherry Lane's page TO Riddings' own real page using
      Riddings' own (mixed-case) host - www.riddingspharmacy.co.uk naming
      its own file. That is not a cross-host defect at all (the URL's host
      and the file's real owner agree), so it correctly passed clean; kept
      in the eighteenth-pass log as a confirming case-insensitive PASS on
      a legitimately correct mixed-case absolute cross-branch link, not
      reported as a finding, and not repeated in this file's own test
      list.

  (3) DISPOSED-BRANCH TARGET, mixed case. gordonshorts_crosby marked
      disposed in a scratch branches.json and its 13 generated pages
      (service + switch + branch) moved aside, then
      <a href="Https://WWW.GordonShortChemist.co.uk/Pharmacy-First-Gordon-Short-Crosby.HTML">
      appended to modules/service/pages/earache-treatment-riddings-timperley.html
      - CAUGHT first attempt: FAIL [disposed-branch target], correctly
      identifying the disposed host despite the mixed case. Restore
      verified two ways: branches.json sha256 back to the original value,
      and a `diff` of the Gordon Short Crosby filename list between the
      restored scratch copy and the tracked repo (13 files each side,
      empty diff).

  (4) CONTROL, mixed case, must PASS. Appended
      <a href="HTTPS://WWW.CherryLanePharmacy.co.uk/Earache-Treatment-Cherry-Lane-Walton.HTML">
      (the page's own real, correct, live URL, just differently cased) to
      the same Cherry Lane page - PASSED clean, confirming the
      case-insensitive match resolves a genuinely correct mixed-case link
      without a false positive, not only a genuinely broken one without a
      false negative.

  RESULT: zero in-repo defect. RULE 1's case-insensitive matching is
  proven correct on all three failure shapes and on the positive control.
  No checker, generator, page or branches.json content changed. Full
  restored baseline re-confirmed identical to the pre-injection baseline
  (177 pages, 1000 links, 423 estate, 6 known, exit 0) after every
  restore. Full 34-checker suite (34 check-*.js, excluding
  check-cdn-pins.js and check-live-hours.js, both network-dependent)
  re-run individually against the TRACKED repo after all scratch-copy work
  finished: 34/34 exit 0. `git status --porcelain -- branches.json tools
  modules core gbp-packs` on the tracked repo showed only the two
  long-standing pre-existing untracked strays
  (gbp-packs/.fuse_hidden0000000400000001,
  modules/service/pages/notarealservice-fishlocks-ainsdale.html.bak),
  neither touched.

  LIVE HALF (Claude in Chrome, one tab, read-only, nothing clicked, typed
  or submitted). All three standing item 6.2 live findings re-read and
  unchanged: www.riddingspharmacy.co.uk/clinic-prices still 404,
  www.tiffenbergschemist.co.uk/book-now.html still 404,
  www.riddingspharmacy.co.uk/switch-prescriptions-riddings-timperley.html
  still 404. Q53 and Q54 stay open, nothing new to add to either. This
  pass's own angle (case-insensitivity of a repo-side lookup) has no live
  page that could show a different result either way.

  STEP 3 answer pickup: portal feed
  (https://data.rbhealth.co.uk/api/feedback) read in full this run -
  newest entry still Q52, 2026-09-01T22:44:51.524Z, identical to every run
  since 2026-09-01. Nothing new to pick up.

  This file documents the method and result; it is not re-runnable as-is
  (the scratch copy it describes was created and deleted during the run).
  Kept as the eighteenth pass's own evidence file, the convention every
  prior 6.2 pass has followed.
*/
console.log("verify-6.2-2026-09-18-eighteenth.js: documentation-only evidence file, see header comment.");
console.log("Result: zero in-repo defect. RULE 1 case-insensitive matching proven correct");
console.log("on stale target, cross-host target, disposed-branch target and a positive control,");
console.log("all with mixed-case hrefs. Full method and output in this file's own header comment");
console.log("and in audits/verify-6.2-2026-09-18-eighteenth-output.txt.");
