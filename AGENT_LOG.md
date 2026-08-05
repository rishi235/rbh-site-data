# AGENT LOG - hourly audit-backlog runs
Newest entries at the top. Every run appends an entry, even a no-change one.
Format: date, time, item worked, what changed, commit hash, open questions.

## Questions for Rishi
Open: none. Q1 to Q5 are all answered. Q2 to Q5 were answered by Rishi
directly in a Cowork session on 2026-08-05 and are recorded in
QUESTIONS.json (committed by the recovery run below).

ANSWERED 2026-08-04 (item 1.1): Coleman & Leigh vs Leighs. Rishi confirmed
  the correct trading name is "Coleman and Leighs Pharmacy". Repo updated and
  regenerated same day (see entry below). Do not re-raise this question.

---

## 2026-08-05 (unattended run) - Quality pass on item 2.2: Fishlocks branch landing pages verified against Build Pack v2 and current data

No unchecked worklist items and no open questions, so quality pass per
the standing rules. Item taken: 2.2 (Fishlocks shared-domain split),
the first Phase 2 item to get a re-verification pass - all Phase 4
packs and the Phase 3 meta descriptions were covered by earlier passes.

Verified clean, both pages (pharmacy-fishlocks-ainsdale.html and
pharmacy-fishlocks-eccleston.html in modules/branch/pages/):
- NAP exact against current branches.json: names, street addresses
  (17 Station Road PR8 3HN; Unit 3 The Carrington Centre, New Mill
  Street PR7 5SZ), phones (01704 575478 / 01257 451251), emails,
  Google review and NHS review links all match, tel: links correctly
  stripped of spaces.
- Opening hours correct in both the visible hours card and the JSON-LD
  openingHoursSpecification: Ainsdale Mon-Fri 8.45am to 6pm, closed
  weekends; Eccleston Mon-Fri 9am to 6pm plus Saturday 9am to 12pm,
  closed Sunday. Both match branches.json (NHS confirmed 2026-06-24)
  and both carry the NHS-profile source note.
- JSON-LD Pharmacy schema complete: address block, telephone, email,
  areaServed listing the three catchment towns each, hours as above.
- Every linked service page exists: pharmacy-first-, weight-loss-
  clinic-, travel-clinic-, contraception- (modules/service/pages/) and
  switch-prescriptions- (modules/switch/pages/) for both branch slugs.
  Sister-branch cross-links point at each other correctly, satisfying
  the Master Plan v2 shared-domain design (second branch leans on its
  own GBP listing plus its own landing page).
- Titles and H1s follow tools/seo-pattern.js (landingTitle/landingH1);
  check-seo-pattern passes 26 Fishlocks pages including these two.
- Regeneration is byte-identical: re-ran tools/build-branch-landing-
  pages.js against current branches.json, git status clean after.
  check-nap also clean (173 pages, 0 mismatches).
- Compliance sweep on both pages plus INDEX.md and SEO.md: no POM or
  generic medicine names, no efficacy claims, no em dashes, no emojis.
  Weight loss tile wording is consultation-only. Pharmacy First
  wording sticks to the NHS service description (seven conditions,
  no GP appointment needed).
- INDEX.md and SEO.md paste manifests match the generated pages'
  head-comment titles and descriptions; meta descriptions around
  140-150 characters, inside the meta rule.

Observations only, no action taken:
1. Sister-link text reads "Fishlocks Chemist Eccleston in Eccleston"
   (town stated twice, as the branch name already ends with the town).
   Cosmetic. A generator tweak would regenerate both pages; left alone
   to avoid churning pages that may already be pasted or queued for
   the Q3 go-live paste run.
2. Eccleston addressRegion is "Chorley" (borough, not county) in
   branches.json, which also feeds the SEO title "Pharmacy in
   Eccleston, Chorley". Likely deliberate as the local search
   qualifier; flagged only in case it was not.

Files changed: AGENT_LOG.md only.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (unattended run) - Quality pass follow-up: seven duplicate GBP pack descriptions rewritten

No unchecked worklist items and no open questions, so quality pass per
the standing rules. Item taken: the FINDING left by the 4.12 to 4.15
pass below - seven earlier pack descriptions were near-duplicates of
each other (13 pack pairs at 65 per cent or more on shared six-word
runs, same-brand pairs worst: Scorah Bramhall v Hazel Grove 77,
McCanns Aigburth v Sandringham 73, Cherry Lane v Hirshmans 80).

Done this run: rewrote the business description in seven packs so each
is distinct in structure and phrasing - scorah-bramhall (now 742
chars), scorah-hazel-grove (712), mccanns-aigburth (703),
mccanns-sandringham (713), cherry-lane-walton (637),
hirshmans-ainsdale (650), fishlocks-eccleston (730). Facts unchanged
in all seven: same addresses, streets, service areas, service sets,
sister-branch mentions, app or no-app position, free-assessment
wording only where it already applied (Cherry Lane, Hirshmans), and
six-days-a-week only where true. Fishlocks Ainsdale kept as the
anchor; only the other side of its high pairs changed. Headers updated
to the new paste-form counts.

Whole-folder check after the edits, all 15 packs: claimed v actual
description length exact, all under 750, no POM or generic medicine
names, no efficacy phrases, no em dashes, no emojis. Pairwise
six-word-run overlap now worst at 30 per cent (Coleman and Leighs v
Gordon Short, both from the earlier supervised rewrite) - well under
the 65 per cent finding threshold; every pair named in the finding now
sits far below it. Minor observation only, no action needed.

Files changed: gbp-packs/scorah-bramhall.md,
gbp-packs/scorah-hazel-grove.md, gbp-packs/mccanns-aigburth.md,
gbp-packs/mccanns-sandringham.md, gbp-packs/cherry-lane-walton.md,
gbp-packs/hirshmans-ainsdale.md, gbp-packs/fishlocks-eccleston.md,
AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open. Paste order guidance unchanged:
McCanns Sandringham first (Q4 POM exposure on the live description).

---

## 2026-08-05 (supervised run) - Quality pass on items 4.12 to 4.15: the last four GBP packs verified, plus a duplicate-description fix

Run continued at Rishi's request in the same Cowork session as the 4.10
and 4.11 passes. All four remaining packs on the older shot list taken
together: 4.12 Coleman and Leighs Walton, 4.13 Riddings Timperley,
4.14 Gordon Short Crosby, 4.15 Tiffenbergs Aintree.

Verified clean against the current branches.json for all four:
- Profile facts all match: names, addresses (241 Walton Village L4 6TH;
  38 Riddings Road, Timperley, Altrincham WA15 6BP; 159 College Road
  L23 3AT; 388 Longmoor Lane L9 9DB), phones, websites, review links
  and service area lists.
- Hours correct in every pack, including the awkward ones: Coleman and
  Leighs and Tiffenbergs both Mon-Fri 9:00-1:00 and 2:00-6:00 with the
  lunch closure spelled out; Gordon Short Mon-Sat with the lunch
  closure and the 5:00pm Saturday finish; Riddings straight 9:00-6:00
  Mon-Fri. All NHS confirmed 2026-06-24. Paster notes on the split-hours
  branches correctly tell the paster to enter two ranges per day in GBP.
- Post A URLs match pfLink exactly in all four, and the branch-specific
  Pharmacy First pages (pharmacy-first-coleman-leigh-walton.html,
  pharmacy-first-riddings-timperley.html,
  pharmacy-first-gordon-short-crosby.html,
  pharmacy-first-tiffenbergs-aintree.html) are all verified present in
  modules/service/pages/ for the later link swap.
- Posts B, C and D carry the exact generated page slugs in all four,
  every one verified present in modules/. No placeholder links. Post
  lengths range 280 to 528 characters, all well under the 1,500 limit.
- Widget coverage correct: all four have the same five widgets
  (bloodPressure, contraception, pharmacyFirst, weightLoss,
  travelClinic) and each services section lists those five, nothing
  extra.
- No-app handling correct in all four: hasApp false, and the only
  occurrence of "app" in each pack is the paster note saying not to
  add one.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gaps found and fixed:
1. Shot lists extended from 6 to 10 shots in all four per Build Pack
   4.1 and the updated TEMPLATE.md, plus the pending-Google-updates
   paster note. Each hours shot is branch-specific: Coleman and Leighs
   and Tiffenbergs ask for the lunch closure to be legible, Gordon
   Short for the lunch closure and the 5:00pm Saturday finish,
   Riddings for the straight 9am to 6pm weekday hours. Street-context
   shots named per road (Walton Village, Riddings Road, College Road,
   Longmoor Lane).
2. Duplicate descriptions. Three of the four descriptions were
   word-for-word identical apart from the branch name, street, town and
   service areas, and the fourth differed only by one sentence. Google
   treating four profile descriptions as the same text undercuts the
   point of the exercise. All four rewritten to be distinct in
   structure and phrasing while keeping every fact from branches.json,
   the same service coverage and the same compliance position. New
   counts: Coleman and Leighs 631, Gordon Short 652, Riddings 657,
   Tiffenbergs 650, all under the 750 limit and all headers corrected.
   The four now share no meaningful phrasing with each other or with
   any other pack.

Whole-folder check run after the edits: all 15 packs pass on claimed
versus actual description length, the 750-character limit, the 10-shot
minimum and the compliance sweep.

FINDING for a future run (not fixed here, outside this item's scope):
the same duplicate-description problem affects seven of the earlier
packs. Measured on shared six-word runs, 13 pack pairs sit at 65 per
cent or higher. The two that matter most are the same-brand pairs,
where the profiles are closest geographically and Google is most
likely to collapse them: Scorah Bramhall versus Scorah Hazel Grove at
77 per cent, and McCanns Aigburth versus McCanns Sandringham at 73 per
cent. Also high: Cherry Lane versus Hirshmans at 80 per cent,
Fishlocks Ainsdale versus Hirshmans at 77 per cent, Cherry Lane versus
Fishlocks Ainsdale at 71 per cent, and Fishlocks Eccleston against the
McCanns and Scorah packs at 65 to 67 per cent. Recommend a single run
that rewrites the seven affected descriptions, taking the same-brand
pairs first. Facts and compliance position stay as they are; only the
phrasing and structure change.

Files changed: gbp-packs/coleman-leigh-walton.md,
gbp-packs/gordon-short-crosby.md, gbp-packs/riddings-timperley.md,
gbp-packs/tiffenbergs-aintree.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (supervised run) - Quality pass on item 4.11: SK Chemists Bootle GBP pack verified against Build Pack v2 and current data

Run continued at Rishi's request in the same Cowork session as the 4.10
pass. No unchecked worklist items and no open questions, so quality pass
per the standing rules. Item chosen: 4.11, the SK Chemists Bootle pack -
next in paste order as flagged in the previous entry.

Verified clean against the current branches.json:
- Profile facts all match: name, 516 Stanley Road, Bootle L20 5DW,
  0151 944 1013, website https://www.skchemist.co.uk, review link,
  service areas (Bootle, Sefton, Liverpool).
- Hours correct throughout: Mon-Fri 9:00am-6:00pm (NHS confirmed
  2026-06-24), Saturday and Sunday closed. The description's "Open 9am
  to 6pm Monday to Friday" matches.
- Description header claimed 735 characters; actual paste-form count is
  exactly 735. No correction needed.
- Post A URL matches pfLink exactly (the shared
  pharmacy-first-service-bootle.html live page), and the paster note
  correctly flags the swap to the branch-specific
  pharmacy-first-sk-chemists-bootle.html once confirmed live - that
  page is verified present in modules/service/pages/.
- Posts B, C and D carry the exact generated page slugs
  (switch-prescriptions-sk-chemists-bootle.html,
  weight-loss-clinic-sk-chemists-bootle.html,
  travel-clinic-sk-chemists-bootle.html), all verified present in
  modules/. No placeholder links. Post lengths 466, 305, 530 and 380
  characters, all well under the 1,500 limit.
- Widget coverage correct: branches.json has bloodPressure,
  contraception, pharmacyFirst, weightLoss and travelClinic widgets and
  the services section lists all five, nothing extra.
- No-app handling correct: hasApp false, no app mention in the
  description, services or posts; the only occurrence of "app" in the
  pack is the paster note saying not to add one.
- Bootle deduplication note intact: description deliberately worded
  differently from the Smartts pack.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gap found and fixed in the pack:
- Shot list extended from 6 to 10 shots per Build Pack 4.1 and the
  updated TEMPLATE.md (vinyl storefront lead shot where fitted,
  street-context angle along Stanley Road, shop floor, hours notice)
  plus the pending-Google-updates paster note. No app screen shot for
  this branch (hasApp false). Blood pressure shot kept.

Note: 4 packs still carry the older shot list (coleman-leigh-walton,
gordon-short-crosby, riddings-timperley, tiffenbergs-aintree). Next in
paste order: 4.12 Coleman and Leighs Walton.

Files changed: gbp-packs/sk-chemists-bootle.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.10: Smartts Chemist Bootle GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.10, the Smartts Bootle pack - next in
paste order as flagged in the previous entry.

Verified clean against the current branches.json:
- Profile facts all match: name, 42 Fernhill Road, Bootle L20 9HH,
  0151 922 4984, website https://www.smarttschemist.co.uk, review link,
  service areas (Bootle, Sefton, Liverpool). hasApp true and the pack
  mentions the app correctly.
- Hours correct throughout: Mon-Fri 9:00am-1:00pm and 2:00pm-6:00pm
  (NHS confirmed 2026-06-24), Saturday and Sunday closed. The
  description's "closed 1pm to 2pm for lunch" matches the split hours
  in branches.json.
- Description header claimed 710 characters; actual paste-form count is
  exactly 710. No correction needed.
- Post A URL matches pfLink exactly (the shared
  pharmacy-first-service-bootle.html live page), and the paster note
  correctly flags the swap to the branch-specific
  pharmacy-first-smartts-bootle.html once confirmed live - that page is
  verified present in modules/service/pages/.
- Posts B, C and D carry the exact generated page slugs
  (switch-prescriptions-smartts-bootle.html,
  weight-loss-clinic-smartts-bootle.html,
  travel-clinic-smartts-bootle.html), all verified present in modules/.
  No placeholder links. Post lengths 461, 324, 516 and 420 characters,
  all well under the 1,500 limit.
- Widget coverage correct: branches.json has bloodPressure,
  contraception, pharmacyFirst, weightLoss and travelClinic widgets and
  the services section lists all five. Blood tests, vaccinations and
  medical cannabis are live site pages rather than widgets, and the
  paster note to check those pages before pasting stands.
- Medical cannabis wording stays within "book a free consultation to
  discuss eligibility" - no availability or benefit claims.
- Bootle deduplication note intact: description deliberately worded
  differently from the SK Chemists pack.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gap found and fixed in the pack:
- Shot list extended from 7 to 11 shots per Build Pack 4.1 and the
  updated TEMPLATE.md (vinyl storefront lead shot where fitted,
  street-context angle along Fernhill Road, shop floor, hours notice)
  plus the pending-Google-updates paster note. The hours shot for this
  branch specifically asks for the weekday lunch closure (1:00pm to
  2:00pm) and the weekend closure to be legible. Blood pressure and
  app shots kept.

Note: 5 packs still carry the older shot list (coleman-leigh-walton,
gordon-short-crosby, riddings-timperley, sk-chemists-bootle,
tiffenbergs-aintree). Next in paste order: 4.11 SK Chemists Bootle.

Files changed: gbp-packs/smartts-bootle.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.9: Clear Chemist Aintree GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.9, the Clear Chemist Aintree pack - next
in paste order as flagged in the previous entry.

Verified clean against the current branches.json:
- Profile facts all match: name, Unit 20 Brookfield Trade Centre,
  Brookfield Drive, Aintree, Liverpool L9 7AS, 0151 203 8365, website
  https://www.clearchemist.co.uk, review link, service areas (Aintree,
  Fazakerley, Walton, Bootle, North Liverpool). hasApp true and the
  pack mentions the app correctly.
- Hours handling correct: branches.json has no opening hours for this
  branch and the pack says do not paste or invent hours - confirm and
  add to branches.json first. That instruction stands.
- Description header claimed 669 characters; actual paste-form count is
  exactly 669. No correction needed.
- No-Pharmacy-First handling correct: branches.json has no pfLink,
  pfBooking false and no PF, blood pressure or contraception widgets,
  and the pack neither lists those services nor drafts a PF post.
  Post A is the local team post as agreed at 4.9 drafting.
- Posts B, C and D carry the exact generated page slugs
  (switch-prescriptions-clear-aintree.html,
  weight-loss-clinic-clear-aintree.html,
  travel-clinic-clear-aintree.html), all verified present in modules/.
  Post A uses the homepage, correct for a team post. No placeholder
  links. Post lengths 407, 360, 515 and 449 characters, all well under
  the 1,500 limit.
- Local-not-online framing intact throughout, per the pack's own rule
  that the profile must read as a physical pharmacy.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gap found and fixed in the pack:
- Shot list extended from 6 to 10 shots per Build Pack 4.1 and the
  updated TEMPLATE.md (vinyl storefront lead shot where fitted,
  street-context angle showing the Brookfield Trade Centre approach
  and parking, shop floor and collection counter, hours notice) plus
  the pending-Google-updates paster note. The hours shot for this
  branch doubles as the source for the missing branches.json hours:
  photograph the door notice, confirm the hours, add them to
  branches.json, then set them on GBP.

Note: 6 packs still carry the older shot list (coleman-leigh-walton,
gordon-short-crosby, riddings-timperley, sk-chemists-bootle,
smartts-bootle, tiffenbergs-aintree). Next in paste order:
4.10 Smartts Bootle.

Files changed: gbp-packs/clear-aintree.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.8: Fishlocks Eccleston GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.8, the Fishlocks Eccleston pack - next in
paste order as flagged in the previous entry (4.7 Sandringham already
passed).

Verified clean against the current branches.json:
- Profile facts all match: name, Unit 3 The Carrington Centre, New Mill
  Street, Eccleston, Chorley PR7 5SZ, 01257 451251, hours Mon-Fri
  9:00-6:00, Saturday 9:00-12:00, Sunday closed (NHS confirmed
  2026-06-24), review link, service areas (Eccleston, Charnock Richard,
  Coppull). hasApp true and the pack correctly mentions the app.
- Description header claimed 724 characters; actual paste-form count is
  exactly 724. No correction needed.
- Post A URL matches pfLink exactly, and pfLink is already
  branch-specific (pharmacy-first-fishlocks-eccleston.html) - no swap
  note needed for this branch, unlike the shared-page branches.
- Posts B, C and D carry the exact generated page slugs
  (switch-prescriptions-fishlocks-eccleston.html,
  weight-loss-clinic-fishlocks-eccleston.html,
  travel-clinic-fishlocks-eccleston.html), all verified present in
  modules/. The profile website landing page
  (pharmacy-fishlocks-eccleston.html, from item 2.2) is confirmed
  present in modules/branch/pages/. No placeholder links. Post lengths
  463, 348, 521 and 433 characters, all well under the 1,500 limit.
- Shared-domain handling correct throughout: profile website points at
  the Eccleston landing page, not the shared fishlockpharmacy.co.uk
  homepage, and the paster notes repeat the warning.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gap found and fixed in the pack:
- Shot list extended from 6 to 10 shots per Build Pack 4.1 and the
  updated TEMPLATE.md (vinyl storefront lead shot where fitted,
  street-context angle showing the Carrington Centre parade and
  parking, shop floor, hours notice) plus the pending-Google-updates
  paster note. The hours shot for this branch specifically asks for
  the Saturday morning-only opening (9:00am to 12:00pm) to be legible.
  Blood pressure shot kept.

Note: 7 packs still carry the older shot list (clear-aintree,
coleman-leigh-walton, gordon-short-crosby, riddings-timperley,
sk-chemists-bootle, smartts-bootle, tiffenbergs-aintree). Next in
paste order: 4.9 Clear Chemist Aintree.

Files changed: gbp-packs/fishlocks-eccleston.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.6: McCanns Aigburth GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.6, the McCanns Aigburth pack - next in
paste order after Scorah Hazel Grove, as flagged in the previous entry.

Verified clean against the current branches.json:
- Profile facts all match: name, 112 Aigburth Road, Liverpool L17 7BP,
  0151 727 3185, hours Mon-Fri 9:00-1:00 and 2:00-6:00, Saturday
  9:00-1:00 and 2:00-5:00, Sunday closed (NHS confirmed 2026-06-24),
  website, review link, service areas (Aigburth, Sefton Park, Mossley
  Hill, Grassendale). hasApp false and the pack correctly makes no app
  mention.
- Description header claimed 714 characters; actual paste-form count is
  exactly 714. No correction needed.
- Post A URL matches pfLink exactly (shared Aigburth PF page), and the
  branch-specific page pharmacy-first-mccanns-aigburth.html is confirmed
  present in modules/service/pages/ - existing paster note to swap once
  live still stands.
- Posts B, C and D carry the exact generated page slugs
  (switch-prescriptions-mccanns-aigburth.html,
  weight-loss-clinic-mccanns-aigburth.html,
  travel-clinic-mccanns-aigburth.html), all verified present in
  modules/. No placeholder links. Post lengths 446, 306, 518 and 426
  characters, all well under the 1,500 limit.
- Sister-branch line in the description (Sandringham also on Aigburth
  Road) checked against branches.json - correct.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gap found and fixed in the pack:
- Shot list extended from 6 to 10 shots per Build Pack 4.1 and the
  updated TEMPLATE.md (vinyl storefront lead shot where fitted,
  street-context angle, shop floor, hours notice) plus the
  pending-Google-updates paster note. The hours shot for this branch
  specifically asks for the weekday and Saturday lunch closure
  (1:00pm to 2:00pm) to be legible. Blood pressure shot kept.

Note: 8 packs still carry the older shot list (clear-aintree,
coleman-leigh-walton, fishlocks-eccleston, gordon-short-crosby,
riddings-timperley, sk-chemists-bootle, smartts-bootle,
tiffenbergs-aintree). Next in paste order: 4.8 Fishlocks Eccleston
(4.7 Sandringham already passed).

Files changed: gbp-packs/mccanns-aigburth.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.5: Scorah Hazel Grove GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.5, the Scorah Hazel Grove pack - next in
paste order after Sandringham, Fishlocks Ainsdale, Cherry Lane,
Hirshmans and Scorah Bramhall, as flagged in the previous entry.

Verified clean against the current branches.json (lastUpdated 2026-08-05):
- Profile facts all match: name, 87 Macclesfield Road, Hazel Grove SK7
  6BG, 01625 872267, hours Mon-Fri 9:00-6:00, Saturday and Sunday
  closed (NHS confirmed 2026-06-24), with the pack's warning about the
  24 June Saturday cessation still accurate and prominent. Website,
  review link and service areas (Hazel Grove, Bramhall, Offerton,
  Great Moor, Poynton) all match. hasApp false and the description
  correctly makes no app mention.
- Description header claimed 685 characters; actual paste-form count is
  exactly 685. No correction needed.
- Post A URL matches pfLink exactly (shared Hazel Grove / Bramhall PF
  page, with the existing paster note to swap to the branch-specific
  page once live - that page is confirmed present in the repo).
- Posts B, C and D already carry the exact generated page slugs
  (switch-prescriptions-scorah-hazel-grove.html,
  weight-loss-clinic-scorah-hazel-grove.html,
  travel-clinic-scorah-hazel-grove.html), all verified present in
  modules/. First pack in this pass series with no placeholder links
  to fix. All four posts well under the 1,500 character limit.
- Private paid services correctly framed: no "free assessment" wording,
  and Post C states plainly it is a private, paid service.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gap found and fixed in the pack:
- Shot list extended from 6 to 10 shots per Build Pack 4.1 and the
  updated TEMPLATE.md (vinyl storefront lead shot where fitted,
  street-context angle, shop floor, hours notice) plus the
  pending-Google-updates paster note. The hours shot for this branch
  specifically asks for the sign showing no Saturday opening, given
  the 24 June cessation. The branch-specific blood pressure shot kept.

Note: 9 packs still carry the older shot list. Next in paste order:
4.6 McCanns Aigburth.

Files changed: gbp-packs/scorah-hazel-grove.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.4: Scorah Bramhall GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.4, the Scorah Bramhall pack - next in
line after Sandringham, Fishlocks Ainsdale, Cherry Lane and Hirshmans,
continuing one pack per quality pass in paste order.

Verified clean against the current branches.json (lastUpdated 2026-08-05):
- Profile facts all match: name, 61-63 North Park Road, Bramhall SK7
  3LQ, 0161 439 3744, hours Mon-Fri 9:00-6:00 and Sat 9:00-1:00 with no
  lunch closure, closed Sunday (NHS confirmed 2026-06-24), website,
  review link, service areas Bramhall, Cheadle Hulme, Hazel Grove,
  Handforth and Poynton. hasApp false and the description correctly
  makes no app mention.
- Description header claimed 687 characters; actual paste-form count is
  exactly 687. No correction needed - first pack in this pass series
  where the count was already right.
- Post A URL matches pfLink exactly (shared Hazel Grove / Bramhall PF
  page, with the existing paster note to swap to the branch page once
  live). Post B URL matches the generated switch page slug.
- Private paid services correctly framed: no "free assessment" wording
  on travel or weight loss, and Post C states plainly it is a private,
  paid service.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gaps found and fixed in the pack:
- Post C and D buttons pointed at the bare domain with placeholder
  text. Both now carry the exact generated page URLs
  (weight-loss-clinic-scorah-bramhall.html and
  travel-clinic-scorah-bramhall.html), verified present in
  modules/service/pages/.
- Shot list extended from 6 to 10 shots per Build Pack 4.1 and the
  updated TEMPLATE.md (vinyl storefront lead shot where fitted,
  street-context angle, shop floor, hours notice) plus the
  pending-Google-updates paster note. The branch-specific blood
  pressure shot kept.

Note: 10 packs still carry the older shot list and, in some,
placeholder post links. Next in paste order: 4.5 Scorah Hazel Grove.

Files changed: gbp-packs/scorah-bramhall.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.3: Hirshmans GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.3, the Hirshmans pack - next in the Q4
paste order after Sandringham, Fishlocks Ainsdale and Cherry Lane, and
directly tied to Q4: the faulty live Sandringham description was copied
from Hirshmans text naming two POMs, so this pack's own live-description
replacement matters as much as Sandringham's.

Verified clean against the current branches.json (lastUpdated 2026-08-05):
- Profile facts all match: name, 56-62 Sherwood House, Station Road,
  Ainsdale PR8 3HW, 01704 577376, hours Mon-Fri 8:30-6:00 and Sat
  9:00-5:30 both with the 1:00-2:00 lunch closure, closed Sunday
  (NHS confirmed 2026-06-24), website, review link, service areas
  Ainsdale, Birkdale and Southport. hasApp false and the description
  correctly makes no app mention.
- Post A URL matches pfLink exactly; Post B URL matches the generated
  switch page slug.
- The Q4 header note (check the live Hirshmans description for medicine
  names when pasting, replace with the pack description) is still
  accurate and stays.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gaps found and fixed in the pack:
- Description header claimed 646 characters; actual paste-form count is
  655. Header corrected (still well under 750).
- Post C and D buttons pointed at the bare domain with placeholder
  text. Both now carry the exact generated page URLs
  (weight-loss-clinic-hirshmans-ainsdale.html and
  travel-clinic-hirshmans-ainsdale.html).
- Shot list extended from 7 to 10 shots per Build Pack 4.1 and the
  updated TEMPLATE.md (vinyl storefront lead shot where fitted,
  street-context angle, shop floor, hours notice) plus the
  pending-Google-updates paster note.

Note: 11 packs still carry the older shot list and, in some,
placeholder post links. Continuing one per quality pass in paste
order, per the one-item rule.

Files changed: gbp-packs/hirshmans-ainsdale.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.2: Cherry Lane GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.2, the Cherry Lane pack - next in the Q4
paste order after Sandringham and Fishlocks Ainsdale, and the pack most
in need of an update: it was drafted while the 2.3 build was still
pending, so its warnings no longer matched reality.

Verified clean against the current branches.json (lastUpdated 2026-08-05):
- Profile facts all match: name, 202 Cherry Lane Liverpool L4 8SG,
  0151 226 2051, hours Mon-Fri 9:00-6:30 Sat 9:00-5:00 closed Sunday
  (NHS confirmed 2026-06-24), website, review link, service areas
  Walton, Everton and north Liverpool. hasApp false and the
  description correctly makes no app mention.
- Post A URL matches pfLink and the generated page; Post B URL matches
  the generated switch page slug.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gaps found and fixed in the pack:
- The IMPORTANT header still said the 2.3 build was pending and posts
  B, C and D needed live checks. 2.3 completed 2026-08-04 with all 12
  pages verified live, so the header now says all four posts are
  usable, and carries the two remaining live-site caveats instead: the
  stale PF overview embed (repaste needed) and the old POM weight loss
  page pending the Q5 hand edit, with a warning not to link the old
  page from Post C.
- Post C and D buttons pointed at the bare domain with placeholder
  text. Both now carry the exact generated page URLs
  (weight-loss-clinic-cherry-lane-walton.html and
  travel-clinic-cherry-lane-walton.html).
- "(check page is live first)" removed from the three post headings.
- Shot list extended from 7 to 10 shots per Build Pack 4.1 and the
  updated TEMPLATE.md (vinyl storefront lead shot where fitted,
  street-context angle, shop floor, hours notice) plus the
  pending-Google-updates paster note.
- Description header claimed 636 characters; actual count is 642.
  Header corrected (still well under 750).

Note: 12 packs still carry the 6-shot list and older notes. Continuing
one per quality pass in paste order, per the one-item rule.

Files changed: gbp-packs/cherry-lane-walton.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.1: Fishlocks Ainsdale GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.1, the Fishlocks Ainsdale pack - the
first pack drafted, so it predates the two Build Pack 4.1 requirements
added to TEMPLATE.md by the 4.7 quality pass (10+ photos including the
vinyl storefront; action pending Google updates), and it is next in
line after Sandringham in the Q4 paste order.

Verified clean against the current branches.json (lastUpdated 2026-08-05):
- Profile facts all match: name, 17 Station Road Ainsdale PR8 3HN,
  01704 575478, hours Mon-Fri 8:45-6:00 closed Sat-Sun (NHS confirmed
  2026-06-24), website, review link, service areas Ainsdale, Birkdale
  and Southport. hasApp true, and the description mentions the app.
- Post A pfLink matches branches.json (branch-specific Pharmacy First
  page); Post B switch URL matches the generated page slug.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.
- Description within limit, but the header claimed 664 characters and
  the actual paste-form count is 680. Header corrected to 680 (still
  well under 750).

Gaps found against Build Pack v2 section 4.1 and the updated TEMPLATE.md,
fixed in the pack:
- Shot list had 7 shots and did not mention the vinyl storefront or
  pending Google updates. Extended to 10 shots (vinyl storefront lead
  shot where fitted, street-context angle, shop floor, hours notice)
  and added the pending-updates paster note, matching the Sandringham
  pack format.
- Post C and Post D buttons pointed at the bare domain with a "(weight
  loss clinic page)" placeholder. Both now carry the exact generated
  page URLs (weight-loss-clinic-fishlocks-ainsdale.html and
  travel-clinic-fishlocks-ainsdale.html), consistent with Posts A and B
  and with the later packs.

Note: 13 packs still carry the 6-shot list and, in some, placeholder
post links. Working through them one per quality pass in paste order
rather than bulk-editing, per the one-item rule.

Files changed: gbp-packs/fishlocks-ainsdale.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.7: McCanns Sandringham GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.7, the McCanns Sandringham pack, because
the Q4 answer makes it the first pack to be pasted (its live GBP
description names two POMs) and it was drafted against the 2026-08-04
branches.json, before the Wilmslow removal bumped the file.

Verified clean:
- Profile facts (name, address 1b Aigburth Road L17 4JP, phone 0151 727
  3076, hours Mon-Fri 9-1 and 2-6 closed Sat-Sun, website, review link,
  service areas, hasApp false) all match the current branches.json
  (lastUpdated 2026-08-05).
- Business description is exactly 700 characters as the pack claims,
  under the 750 limit.
- Compliance sweep: no POM or generic medicine names, no efficacy
  phrases, no em dashes, no emojis, UK English throughout.
- Post B, C and D target pages all exist in the repo (switch, weight
  loss clinic, travel clinic for mccanns-sandringham). The branch
  Pharmacy First page exists too, ready for the link swap the paster
  note describes.
- Post A pfLink (shared pharmacy-first-service-aigburth.html) is a
  live-site-only page, not repo-generated - consistent with the paster
  note. Both McCanns branches share it per branches.json.
- Sister-branch claim checked: Aigburth branch is at 112 Aigburth Road,
  so "further along Aigburth Road" is accurate.
- Live URL resolution could not be checked from this run (no web access
  to the live site from the worker); the pack already tells the paster
  to check the URLs before posting.

Gap found against Build Pack v2 section 4.1 and fixed:
- Spec asks for 10+ photos including the new vinyl storefront, and for
  pending Google updates to be actioned. The pack's shot list had 6
  shots and covered neither point. Extended the shot list to 10 (vinyl
  storefront lead shot where fitted, shop floor, hours notice, street
  context) and added a paster note to action pending Google updates.
- TEMPLATE.md section 4 updated to carry both requirements so future
  packs inherit them. The other 14 packs share the same 6-shot gap;
  left for a later pass or the paster - flagged here, not silently
  rolled out, to keep this run to one item.

Files changed: gbp-packs/mccanns-sandringham.md, gbp-packs/TEMPLATE.md,
AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Recovery: verify and commit the Cowork session's Q2 to Q5 answer applications

Found on arrival: a stale .agent-lock (3.2 hours old, deleted per the
standing rules) and uncommitted changes to QUESTIONS.json and
branches.json, left by the 2026-08-05 Cowork session in which Rishi
answered Q2 to Q5 directly. That session applied the Q2 decision
(Wilmslow branch entry and hostMap entry removed from branches.json,
lastUpdated bumped to 2026-08-05) and recorded all four answers, but
was interrupted before committing.

This run verified the leftover state rather than taking it on trust:
- All six generators re-run against the edited branches.json: output
  byte-identical, no further file changes.
- check-nap: 173 pages against 16 branches.json entries, 0 mismatches.
- check-seo-pattern: 173 pages, 0 failures (title, H1 and meta).
- seo-pattern self-test passes for all 16 buildable branches.
- Outlook answer search (subject "Portal feedback", body "AUDIT ANSWER"):
  no matches. The answers came via the Cowork session, not the portal.

All five questions are now answered; none open. The worklist has no
unchecked items, so no new scope was taken - committing the verified
recovery was this run's work item.

Notes for Rishi:
- The Q5 answer says paste-ready replacement blocks were created in
  cowork/cherry-lane-old-page-replacements/. That folder is not in this
  repo, so it presumably lives in the Cowork session's own workspace.
  If the blocks should be kept in the repo, copy them in during a
  supervised session.
- Remaining "wilmslow" references in the repo are historical or inert:
  CHANGELOG.md and the branches.json schemaNote (history),
  scripts/add-weightloss-travel-widgets.js (one-off script wording),
  tools/build-switch-pages.js (hard-coded map entry no branch matches
  any more; generator output unchanged), status/index.html (regenerated
  by the status build).
- tools/branches-editor.html embeds a stale snapshot of branches.json
  data that still includes the Wilmslow entry. Per CLAUDE.md, copies of
  branches.json get flagged, not merged or edited: flagged here.

Files changed: QUESTIONS.json and branches.json (from the Cowork
session, verified this run), AGENT_LOG.md.
Commit: b240c32 (hash appended in a follow-up commit after push).
Questions: none new. None open.

---

## 2026-08-05 - Quality pass on the Phase 3 rollout: meta descriptions verified and brought inside the rule
Worklist has no unchecked items and no Outlook answers were waiting (Q2 to
Q5 still open), so this run was a quality pass per the standing rules.
Item re-verified: the Phase 3 rollout (3.1 to 3.13). Its checker only
covered titles and H1s; the meta description leg of "title, meta
description and H1" was never verified against the meta rule documented
in tools/seo-pattern.js (seoTown + a service word, 80 to 165 chars).

Findings when the meta check was first run: 47 failures across 173 pages,
all generator-level, none branch-specific. (1) Travel clinic metas 170+
chars on every branch. (2) Weight loss clinic metas about 185 chars on
every branch. (3) The two Fishlocks landing page metas up to 199 chars.
(4) Contraception metas tipped over 165 only for the longest brand name
(Coleman and Leighs). A fifth group ("meta missing contraception") was a
checker false positive - the copy says "contraceptive pill", which
carries the service - fixed in the checker word list, not the pages.

Fixes, all at generator level then regenerated (no hand edits to output):
- tools/check-seo-pattern.js: now also checks the "Weebly page SEO
  description" line of every page via seo-pattern checkMeta, with service
  words per page type. This closes the verification gap permanently.
- tools/build-travel-clinic-pages.js: meta trimmed to "Private travel
  clinic at <brand> in <town>. Travel vaccinations and malaria prevention
  advice, subject to clinical suitability." Caution wording kept.
- tools/build-weight-loss-pages.js: meta trimmed to "Private,
  pharmacist-led weight loss clinic at <brand> in <town>. Clinical
  assessment first; treatment only where appropriate." Still no medicine
  names and no efficacy claims; the generic POM-medication sentence went
  in the trim, which if anything lowers the advertising exposure.
- tools/build-contraception-pages.js: "Start, restart or continue"
  shortened to "Start or continue" so the longest brand fits.
- tools/build-branch-landing-pages.js: meta now uses seoTown + postcode
  instead of the full street address (full NAP remains in the page body
  and JSON-LD); service list wording shortened. Serving towns kept.

Result: check-seo-pattern now verifies 173 pages for title, H1 AND meta,
0 failures. check-nap 173 pages, 0 mismatches. seo-pattern self-test
passes. 46 regenerated pages changed only their SEO description line.
NOTE FOR PASTING: the SEO description is a Weebly page setting, so the
new shorter metas take effect at the next Weebly paste run (Q3 decision)
- pasting the embed block alone does not update it.
Commit: see this commit on agents/audit-backlog.

---

## 2026-08-04 (night) - Items 4.6 to 4.15: remaining ten GBP packs drafted in parallel (supervised session)
Rishi asked for the remaining packs to be split across parallel subagents
to move faster. Six subagents each drafted one or two packs simultaneously,
all from TEMPLATE.md, the scorah-bramhall.md house style, and branches.json
facts only. All ten written to gbp-packs/: mccanns-aigburth, mccanns-
sandringham, fishlocks-eccleston, clear-aintree, smartts-bootle,
sk-chemists-bootle, coleman-leigh-walton, riddings-timperley,
gordon-short-crosby, tiffenbergs-aintree. Every branch now has a pack.

Central compliance sweep after the subagents finished (not relying on
their self-checks): scan of all 15 packs for POM names (Wegovy, Mounjaro,
Ozempic, Saxenda, Orlistat, generics), efficacy phrases, em dashes and
emojis - all clean; the only "guaranteed" match is TEMPLATE.md's own rule
text. Descriptions all under 750 chars (633 to 735). Facts spot-checked
against branches.json (McCanns Sandringham verified line by line: L17 4JP,
0151 727 3076, split lunch hours).

Notable pack decisions:
- McCanns Sandringham opens with a NOTE FOR PASTING: its description
  replaces the faulty live Hirshmans-copied text (Q4) in full.
- Clear Chemist: no hours in branches.json, so the pack forbids pasting
  hours until confirmed; no Pharmacy First service at Clear, so Post A is
  a local team post.
- Coleman and Leighs: confirmed trading name throughout, plus a paste note
  to correct the live GBP name and old spellings.
- Both Bootle packs deliberately worded distinctly to avoid duplicate
  text across the two profiles.
- Lunch-closure branches flagged so GBP hours get entered as two ranges.

Phase 4 is now complete. ACTION FOR RISHI OR DANE: paste the packs into
GBP branch by branch (descriptions, categories, services, then start the
post rotation). Q4 can arguably be closed by pasting the new descriptions,
but it stays open until Rishi confirms the approach.

Files changed: 10 new gbp-packs/*.md, AGENT_WORKLIST.md (4.6-4.15 ticked,
numbering note), AGENT_LOG.md.
Questions: none new. Q2, Q3, Q4, Q5 remain open.

---

## 2026-08-04 (scheduled run) - Item 4.5: Scorah Chemists Hazel Grove GBP pack
Answers check: searched Outlook for subject "Portal feedback" with body
"AUDIT ANSWER" - no matches in the last week. Q2, Q3, Q4, Q5 remain open.

What was done:
- New gbp-packs/scorah-hazel-grove.md, next branch in branches.json order
  (scorah_hazel, index 1; Bramhall, Fishlocks Ainsdale, Hirshmans and
  Cherry Lane already have packs). Format follows TEMPLATE.md and the
  scorah-bramhall.md sibling pack.
- Facts from branches.json only: 87 Macclesfield Road, Hazel Grove,
  Stockport SK7 6BG; 01625 872267; hours Mon-Fri 9-6, closed Sat and Sun
  (Saturday trading ceased 24 June 2026 per branches.json openingHours
  note). Description 685 chars, under the 750 limit, verified by script.
- Same service set as Bramhall (widget-driven: BP checks, contraception,
  PF, weight loss, travel), same private-paid wording for travel and
  weight loss, no app mention (hasApp false), weight loss post names no
  medicines and makes no efficacy claims.
- Post links checked against the generated pages in modules/: switch,
  weight loss and travel posts use the branch-specific slugs
  (switch-prescriptions-scorah-hazel-grove.html etc.); Post A uses the
  shared Hazel Grove / Bramhall PF page per pfLink with the usual swap
  note. Paster notes flag the Saturday closure check on GBP hours and the
  Q3 (live copy may lag repo) and Q4 (description audit) checks.
- Worklist: 4.5 ticked in place; remainder renumbered as 4.6 through 4.14.
Files changed: gbp-packs/scorah-hazel-grove.md (new), AGENT_WORKLIST.md,
AGENT_LOG.md. Commit hash: recorded in the commit itself.
Questions: none new this run.

## 2026-08-04 (scheduled run) - Item 4.4: Scorah Chemists Bramhall GBP pack
Answers check: no emails with subject starting "AGENT ANSWER" in the last
7 days (search ran clean; the only hit was an unrelated supplier spend
report). Q2, Q3, Q4, Q5 remain open.

What was done:
- New gbp-packs/scorah-bramhall.md, next branch in branches.json order after
  the three packs already done. Format follows TEMPLATE.md and the
  fishlocks-ainsdale.md model.
- Facts from branches.json only: address, phone, hours (NHS confirmed
  2026-06-24, Sat 9-1), review link, service areas. Services drawn from the
  branch widget set: BP checks, contraception, Pharmacy First, weight loss,
  travel.
- Deliberate differences from the Fishlocks pack, checked against the
  generated Scorah pages: no free delivery, collection or blister pack
  claims (the Scorah switch page makes none); travel and weight loss are
  written as private paid services with "subject to availability and
  clinical suitability" wording (matching the live page copy) rather than
  Fishlocks' "free assessment"; no app mention (hasApp false); weight loss
  post names no medicines and makes no efficacy claims.
- Post A links the shared Hazel Grove / Bramhall PF page per pfLink, with a
  paster note to swap to pharmacy-first-scorah-bramhall.html once that page
  is confirmed live. Paster note also flags checking the Post B switch URL
  resolves before posting.

Files changed: gbp-packs/scorah-bramhall.md (new), AGENT_WORKLIST.md (4.4
ticked, remainder renumbered 4.5-4.14), AGENT_LOG.md, status/index.html.
Questions: none new.

## 2026-08-04 (late evening, second entry) - Items 3.2 to 3.13: Phase 3 rollout completed (supervised session)
Rishi asked to continue ahead of schedule in the same Cowork session, so the
one-item-per-run rule was set aside on his instruction. Lock held throughout.

What was done:
- All six generators (service, contraception, weight loss, travel, branch
  landing, switch) now import tools/seo-pattern.js and build every title and
  H1 through it. No build script composes a title or H1 by hand any more.
  Condition pages now declare an h1Phrase (e.g. "Earache treatment for
  children") consumed by searchH1() instead of a local h1 function.
- switchH1 in seo-pattern.js corrected before rollout: the live switch H1
  ("Switch your prescriptions to <brand> in <town> in under 30 seconds")
  already carries service + brand + town and is stronger conversion copy,
  so it is the canonical form. Only the switch TITLE was the outlier.
- All 173 pages regenerated. Result exactly as designed in 3.1: every
  service, contraception, weight loss, travel and landing page came out
  byte-identical; the only content change is the 15 switch page SEO titles
  ("Switch Your Prescriptions - Scorah Chemists Bramhall" becomes "Switch
  Your Prescriptions to Scorah Chemists, Bramhall") plus the switch
  INDEX.md / SEO.md manifests.
- New tools/check-seo-pattern.js verifies every generated page's SEO title
  line and <h1> against the pattern module, reported per brand. Run result:
  12 brands, 173 pages, 0 mismatches, 0 skipped. check-nap.js also re-run
  clean (173 pages, 0 mismatches).

Incident, caught and fixed in-session: a PowerShell bulk edit of three
build scripts mangled UTF-8 (em dashes became mojibake) and the corruption
propagated into regenerated pages. The diff review caught it before any
commit; the three generators and all generated output were reverted to HEAD
and the edits re-applied with an encoding-safe editor. Nothing corrupted
was committed. Lesson recorded: do not bulk-edit these files with default
Windows PowerShell 5.1 text round-trips.

ACTION FOR RISHI OR DANE: the 15 live switch pages on Weebly still carry
the old SEO title in Pages > SEO Settings. Update them from the new
modules/switch/pages/SEO.md at the next paste run (ties into open Q3).
The page HTML itself is unchanged, so no embed re-paste is needed for this.

Files changed: 6 build scripts, tools/seo-pattern.js (switchH1 + doc),
tools/check-seo-pattern.js (new), 15 switch pages, switch INDEX.md/SEO.md,
AGENT_WORKLIST.md (3.2-3.13 ticked), AGENT_LOG.md.
Questions: none new. Q2, Q3, Q4, Q5 remain open.

---

## 2026-08-04 (late evening) - Item 3.1: title/H1 pattern defined once in the generator layer (hourly agent run)
Lock: none found; created and removed normally.
Answers check: no "Portal feedback" / "AUDIT ANSWER" emails in Outlook.
Q2, Q3, Q4 and Q5 remain open.

New file tools/seo-pattern.js - the single definition of the page title, H1
and meta description pattern for every generated page type, sourced from
branches.json seoTown/brandLabel (never addressLocality), per Build Pack v2
sections 1.4 and 5.1.

THE PATTERN (documented here before rollout, as 3.1 requires):
- Family A, search-phrase pages (PF condition pages, contraception, branch
  landing): title "<Phrase> in <seoTown> - <brandLabel>", H1 "<Phrase> in
  <seoTown>". Landing pages keep the brand in the H1 and append the county
  to the title when it differs from the town (e.g. "Pharmacy in Bramhall,
  Greater Manchester - Scorah Chemists").
- Family B, brand-led service pages (PF overview, Weight Loss Clinic,
  Travel Clinic): title "<Service> at <brandLabel>, <seoTown>", H1
  "<Service> at <brandLabel> in <seoTown>". This is the shape Build Pack v2
  section 5.4 itself prescribes for the PF overview.
- Switch pages: canonical form "Switch Your Prescriptions to <brandLabel>,
  <seoTown>" (title) / "... in <seoTown>" (H1). Current generator output
  ("Switch Your Prescriptions - <brand> <town>") is the one deviation from
  the family shapes; the switch generator adopts the canonical form during
  its brand rollout runs.
- Meta description: must contain seoTown and a service word, 80-165 chars
  (checkMeta() enforces).

Key design choice: families A and B were codified to match the CURRENT
output of the five service/landing/contraception generators exactly, so
wiring them to the module in items 3.2-3.13 produces no unintended page
churn - those rollout runs are then about verification and fixing per-brand
anomalies, not mass regeneration. Only switch pages will actually change.

Verified: node tools/seo-pattern.js self-test passes - all 16 buildable
branches (head office and disposed Wilmslow excluded), 7 page types each,
titles all carry seoTown, no hard failures, no length warnings (longest
titles are the Coleman and Leighs contraception/switch forms at 64-65
chars, within the 65-char warn threshold).

Files changed: tools/seo-pattern.js (new), AGENT_WORKLIST.md (3.1 ticked),
AGENT_LOG.md. No pages regenerated this run by design - rollout is 3.2+.
Commit: see git log for this entry's hash.
Questions: none new.

---

## 2026-08-04 (evening) - Item 2.3: Cherry Lane build-from-near-zero (hourly agent run)
Lock note: found .agent-lock aged 3h 0m at start of run - 4 seconds past the
staleness threshold, treated as stale per procedure and replaced.
Answers check: no "Portal feedback" / "AUDIT ANSWER" emails in Outlook.
Q2, Q3 and Q4 remain open.

The "build" turned out to be a verification job: the full Cherry Lane page
set already exists in the repo AND is already live on cherrylanepharmacy.co.uk.
Audit scope: all 12 repo pages for cherrylane_liverpool (11 service module
pages, 1 switch page, plus banner) against Build Pack v2 Blocks 1 and 5, and
live checks on the domain.

PASSES:
- Page set complete in repo: PF overview + 7 condition pages + contraception
  + weight loss clinic + travel clinic + switch. All 12 live at the
  cherry-lane-walton slugs and all present in the live site navigation.
- H1s and SEO.md titles/descriptions all carry service + Walton (seoTown
  correctly used, not the postal town Liverpool). Meta keywords include L4.
- NAP clean (check-nap re-run: 173 pages, 0 mismatches). Phones in tel:
  links. No template bleed from other branches. No personal rishi@ address.
- No hard-coded widget IDs; widgets resolve from branches.json, and Cherry
  Lane is the best-populated branch in the file - all 12 service widget IDs
  present including per-condition ones.
- New live weight loss page is compliant: no medicine names, no efficacy
  claims, private-service framing, eligibility and safety caveats present.
- Live PF overview and weight loss pages carry correct NAP, hours matching
  branches.json (NHS-confirmed 2026-06-24), Google review link, map embed.

IN-REPO FIX APPLIED:
- branches.json pfLink for cherrylane_liverpool pointed at the OLD page
  (pharmacy-first-service-walton.html), which now renders empty. Corrected
  to the live overview page (pharmacy-first-cherry-lane-walton.html). Same
  class of fix as the Fishlocks pfLink correction in 2.1. No generator
  consumes pfLink, so no regeneration needed; check-nap re-run clean.

GAPS (outside agent reach, logged for action):
1. The LIVE PF overview embed is a stale paste: it shows five of the seven
   conditions as "Page coming soon" although all seven condition pages are
   live and in the navigation. The repo version links all seven. Needs a
   repaste of pharmacy-first-cherry-lane-walton.html by Rishi or Dane (the
   toolbar paste route proven in the 4.1 session works). Rides on Q3 for
   whether to paste from branch or main.
2. REGULATORY: the old weight loss page (weight-loss-clinic-walton.html) is
   still live, still first in the navigation, names Wegovy, Mounjaro and
   Orlistat with product images, claims "lose up to 22.5% of your body
   weight", and its phone/price/hours fields render blank. POM advertising
   exposure on the public site, same class as Q4. Raised as Q5 with options
   and a recommendation (strip the POM content, keep the URL).
3. Navigation shows TWO weight loss entries (old and new) - confusing and
   splits clicks. Resolution folds into the Q5 answer.
4. Coleman and Leighs pfLink in branches.json also points at an old-style
   pharmacy-first-service-walton.html URL on their domain - not checked this
   run (out of scope), flag for the 3.9 Coleman and Leighs run.
Files changed: branches.json (pfLink), QUESTIONS.json (Q5 added),
AGENT_WORKLIST.md (2.3 ticked), this log.
Commit: see git.

## 2026-08-04 - Item 2.2: Fishlocks shared-domain split (hourly agent run)
Answers check: no "Portal feedback" / "AUDIT ANSWER" emails in Outlook.
Q2, Q3 and Q4 remain open on the portal answer form.

Built the branch landing pages that give Ainsdale and Eccleston their own
local target page on the shared fishlockpharmacy.co.uk domain (Master Plan
v2 section 3: a shared domain cannot rank twice for the same term, so each
branch leans on its own GBP listing plus a branch-specific landing page).

What was built:
- New generator tools/build-branch-landing-pages.js, same model as the other
  generators: layout once, pages stamped from branches.json. BUILD list holds
  fishlocks_ainsdale and fishlocks_eccleston now; add McCanns and Scorah ids
  when their turn comes in the brand-by-brand rollout.
- Output modules/branch/pages/: pharmacy-fishlocks-ainsdale.html and
  pharmacy-fishlocks-eccleston.html plus INDEX.md and SEO.md. Slug pattern
  pharmacy-<brandSlug>-<townSlug>.html, titles "Pharmacy in <seoTown>,
  <region> - <brandLabel>" targeting the generic "pharmacy in <town>" terms.
- Each page: hero with town words, opening hours (from the NHS-confirmed
  block in branches.json), services grid linking the branch's own PF, switch,
  weight loss, travel and contraception pages, sister-branch cross-link to
  disambiguate the shared domain, FAQ, NAP card with Google and NHS review
  links, map embed. Static crawlable text; loads service.css only, no JS and
  no booking widget, so nothing to resolve at runtime.
- JSON-LD carries openingHoursSpecification and areaServed - the first pages
  to do so (the 2.1 audit deferred hours schema on the 171 existing pages to
  Phase 3; new pages get it from day one).
- tools/check-nap.js now scans modules/branch/pages too. Verified: 173 pages,
  0 mismatches, exit 0.
Notes: weight loss copy names no medicines and makes no claims; Pharmacy
First wording stays on the NHS service description. Weebly cannot 301, so
the old shared pages stay live with their "Choose your branch" links; what
finally happens to them rides on Q3. Pages reach Weebly by paste (Rishi or
Dane) per INDEX.md; suggest navigation entries "Ainsdale branch" and
"Eccleston branch".
Files changed: tools/build-branch-landing-pages.js (new), tools/check-nap.js,
modules/branch/pages/* (new), AGENT_WORKLIST.md (2.2 ticked), this log.
Commit: see git.

## 2026-08-04 (evening) - GBP McCanns Sandringham fixed; Coleman pastes still blocked
Cowork session update. Rishi said "go": GBP was reachable on the Cowork PC,
so the McCanns Sandringham management record is FIXED - address now 1B
Aigburth Road, Aigburth, Liverpool L17 4JP (was Dingle / CH49 1SX), and the
Hirshmans copy-paste description replaced with McCanns text naming no
medicines (pending Google's standard review). Logged in the cowork CHANGELOG.
The Build Pack 4.2 action note on the CH49 1SX error can be considered
closed once the description clears review.
The Coleman re-paste run remains BLOCKED: the Cowork PC Chrome still holds
the rbhealth Weebly session, not rishi@rishibhatia.co.uk. Runbook is staged
(cowork\COLEMAN_REPASTE_RUNBOOK.md); it runs the moment that login lands.
Hirshmans contact-us cosmetic fix (postcode missing) attempted but the
editor viewport went unstable - no changes made, still queued.

## 2026-08-04 - Items 4.2 and 4.3: Cherry Lane and Hirshmans GBP packs
Run by Claude in the Cowork session, continuing Phase 4 while logins are
sorted. gbp-packs/cherry-lane-walton.md and gbp-packs/hirshmans-ainsdale.md
written to the TEMPLATE.md format, facts from branches.json. Cherry Lane
posts B, C and D carry a "check the page is live first" flag because the 2.3
build has not run yet. Hirshmans pack cross-references Q4 (medicine names in
live GBP descriptions). Both weight loss posts name no medicines and make no
efficacy claims. Ticked 4.2 and 4.3.

## 2026-08-04 - Item 4.1: GBP pack template + Fishlocks Ainsdale pack
Run by Claude in the Cowork session, not the hourly agent. Rishi asked for
open work to continue while Weebly and GBP logins are sorted tonight.
Created gbp-packs/TEMPLATE.md (pack format plus the advertising rules) and
gbp-packs/fishlocks-ainsdale.md (description under the 750 char GBP limit,
categories, services list, photo shot list, four post drafts). Facts from
branches.json. The weight loss post names no medicines and makes no efficacy
claims. Ticked 4.1 in the worklist.
Added Q3 and Q4 to QUESTIONS.json (see above). Also done outside the repo
today, logged in the cowork CHANGELOG: Coleman and Leighs native Weebly copy
fixed and published; Scorah Bramhall switch embed re-pasted and published
(61-63 North Park Road now live in the page; a site-wide JSON-LD block
outside the page embeds still carries the old 61 - follow-up under Q3); the
July Cherry Lane pin-swap confirmed unnecessary (branch ref caught up).
Note for the hourly agents: embed re-pastes ARE automatable now - the Edit
Custom HTML toolbar opened fine and Ctrl+V pasted from the system clipboard.

## 2026-08-04 - Item 2.1: Fishlocks Ainsdale audit vs Build Pack v2
Answers check: no "Portal feedback" / "AUDIT ANSWER" emails found. Q1 was
answered by Rishi directly in a Cowork session (see entry below), so this run
recorded that answer into QUESTIONS.json (status now "answered") to keep the
portal honest. Q2 (Wilmslow) remains open.

Audit scope: all 13 repo pages for fishlocks_ainsdale (11 service module
pages, 1 switch page, 1 switch banner) checked against Build Pack v2 Blocks
1 and 5, plus live-site spot checks on fishlockpharmacy.co.uk.

PASSES (no action needed):
- Page set complete: PF overview + all 7 condition pages + contraception +
  weight loss clinic + travel clinic + switch. All live on the domain and
  linked in the site navigation. Live overview page matches repo output.
- Titles, meta descriptions and H1s all carry service + Ainsdale (Block 1.4
  already satisfied for the module pages; Phase 3 remains for legacy pages).
- NAP clean (check-nap: 171 pages, 0 mismatches, re-run this session). Every
  phone number is in a tel: link. No template copy bleed from other branches.
- No hard-coded Appointedd widget IDs; service.js resolves widgets from
  branches.json@main by URL slug, with correct no-fallback handling for
  weight loss and travel clinic. Ainsdale widgets fully populated in
  branches.json (pharmacyFirst, weightLoss, travelClinic, contraception,
  bloodPressure).
- Enquiry/callback destination is helpdesk@rbhealth.co.uk in BOTH the
  service and switch modules (Build Pack 5.6 done). No rishi@ anywhere.
- Content is real crawlable text; opening hours on the live contact blocks
  match branches.json (NHS-confirmed 2026-06-24).

GAPS (logged, with disposition):
1. JSON-LD has no openingHoursSpecification, though branches.json carries
   confirmed hours. All five generators duplicate their own pharmacySchema()
   block, and live embeds are static HTML, so fixing now would regenerate
   171 pages and demand a full Weebly repaste for a nice-to-have. DEFERRED:
   fold into Phase 3 item 3.1 (pattern definition) so every page is
   regenerated and repasted once, not twice. Same for adding "geo".
2. Google still ranks the OLD shared PF page
   (pharmacy-first-service-eccleston-ainsdale.html); the new per-branch
   pages are live but not yet the ranking targets. The old page does now
   carry "Choose your branch" links to both overviews. The proper split
   (and what to do with the old shared pages - Weebly cannot 301) is item
   2.2, next in the worklist.
3. CDN pin drift risk: service pages load module CSS/JS pinned to
   @service-module-phase1 and switch pages to commit @6a275e1, while
   service.js fetches branches.json from @main. Pins are currently in sync
   with main (verified: only DRAFT files differ), and commit pins are
   arguably deliberate (jsDelivr caches immutably). No change made; when
   embeds are next repasted (Phase 3), standardise the module refs.
4. branches.json pfLink for both Fishlocks branches pointed at the old
   shared PF page. FIXED this run: Ainsdale ->
   pharmacy-first-fishlocks-ainsdale.html, Eccleston ->
   pharmacy-first-fishlocks-eccleston.html (both verified live), in
   branches.json and the branches-editor.html snapshot. pfLink is not
   consumed by generators, so no regeneration needed.
5. Cosmetic, Weebly-side (hand fixes, not blockers): og:image is the blank
   Weebly placeholder sitewide; the legacy footer on the old PF page spells
   the brand "Fishlock Pharmacy" while the CDN footer says "Fishlocks
   Chemist" - the Q1-style naming question does not arise here (branches.json
   brandLabel "Fishlocks Chemist" matches the NHS profile).

Files changed: branches.json, tools/branches-editor.html, QUESTIONS.json,
AGENT_WORKLIST.md (2.1 ticked), this log, status page. Commit: see git.

## 2026-08-04 - Coleman and Leighs rename (answer to item 1.1 question)
Run by Claude in the Cowork session, not the hourly agent. Rishi confirmed
the correct trading name: "Coleman and Leighs Pharmacy" ("and" spelled out,
Leighs with s, no apostrophe - matches the domain and NHS profile slug).
Changed brandLabel and branchName in branches.json, the embedded snapshot in
tools/branches-editor.html and the brand string in tools/build-switch-pages.js,
then regenerated via build-service-pages.js, build-contraception-pages.js,
build-weight-loss-pages.js, build-travel-clinic-pages.js and
build-switch-pages.js. Verified: git grep "Coleman & Leigh" returns nothing
outside this log, the worklist and CHANGELOG history.
Regeneration also picked up two unrelated catch-ups: stale Wilmslow switch
pages removed (disposal completed 1 June) and the Scorah Bramhall switch page
address updated to 61-63 North Park Road (branches.json already correct, page
was stale).
Reminder: live Weebly copy for Coleman and Leighs still mixes four name
variants and needs the CDN embeds repasted before the corrected pages go live.

## 2026-08-04 - Item 1.4: NAP check, every branch page vs branches.json
Answers check: no "AGENT ANSWER" emails in the last 7 days. The item 1.1
Coleman naming question was answered directly by Rishi in a Cowork session
that ran alongside this run (entry above); nothing further to apply here.
Built tools/check-nap.js, a read-only checker that verifies every generated
page (modules/service/pages and modules/switch/pages, 171 pages) against
branches.json: data-branch attribute, contact card address line, Google
Maps embed query, every tel: link and visible phone number, and the full
JSON-LD block (name, telephone, street, locality, postcode, region,
country). Names accept either brandLabel or the town-qualified branchName.
Findings and fixes:
- Scorah Bramhall switch page carried the pre-normalisation address
  "61 North Park Road" in the contact line, maps embed and JSON-LD.
  branches.json was normalised to "61-63 North Park Road" on 27 June
  (schemaNote) after the switch pages were last generated. Fixed by
  regeneration. The eleven Scorah Bramhall service pages were already
  correct.
- switch-prescriptions-wilmslow-wilmslow.html (plus its banner) still
  existed for the disposed Wilmslow branch. build-switch-pages.js had no
  disposed handling; added a skip that also removes stale output for
  disposed branches, and regenerated. Page and banner deleted.
- Everything else clean: all 14 trading branches' service pages and the
  remaining switch pages match branches.json exactly on name, address
  and phone. Final checker run: 171 pages, 0 mismatches.
Timing note: this run and Rishi's Cowork session worked the repo at the
same time (the .agent-lock only guards hourly runs against each other).
This run made the generator disposed-skip fix and first regenerated the
switch pages; the Cowork session's rename commit 497fcb0 then swept those
fixes in with its own regeneration, which is why its message credits them
as "catch-ups". No harm done - same source data, same generators, and the
worklist item is complete either way. Committed by this run: tools/
check-nap.js (new checker), the item 1.4 worklist tick, this log entry and
the rebuilt status page. Final state verified after both sessions' changes:
checker clean, 171 pages, 0 mismatches.
Action note for Rishi or Dane (not a blocker): repaste the Scorah Bramhall
switch page embed into Weebly so the 61-63 address fix goes live. And if
the old wilmslow-pharmacy.co.uk switch page is still live anywhere, take
it down - RBH should not be inviting prescription switches to a branch it
no longer owns.

---

## 2026-08-04 - Item 1.3: McCanns Sandringham postcode sweep (CH49 1SX)
Answers check: no "AGENT ANSWER" emails in the last 7 days. Coleman & Leigh
question from item 1.1 remains open.
Swept for CH49 1SX (and any CH49) with L17 4JP as the correct value:
- Repo: zero hits outside the worklist text itself. git log -S shows CH49
  has never been in any site data or generated page in the repo's history.
  branches.json mccanns_sandringham entry correct: 1b Aigburth Road,
  Liverpool, L17 4JP, 0151 727 3076. All 12 generated Sandringham pages
  (11 service, 1 switch) carry L17 4JP twice each - contact line and
  JSON-LD schema postalCode. Zero CH49.
- Live site (checked 2026-08-04): homepage and the Sandringham switch page
  both zero CH49; contact blocks, sitewide CDN footer bar and JSON-LD all
  show L17 4JP correctly.
- Root cause per Master Plan v2 (line 72) and Build Pack v2 (section 4.2):
  the CH49 1SX sits in the McCanns Sandringham GBP MANAGEMENT RECORD, not
  on any web page. The live GBP profile already displays L17 4JP. Agents
  cannot edit GBP, so this is a hand fix.
Action note for Rishi or Dane (not a blocker): in the Google Business
Profile manager, open McCanns Sandringham and correct the management-record
address to 1b Aigburth Road, Liverpool L17 4JP (currently shows Wirral
postcode CH49 1SX). Two minutes in the GBP dashboard.
Also noted while checking (cosmetic, Weebly hand edit): homepage address
block spells "Sandrigham Medical Centre" (missing n).
No repo changes needed. Commit this run: worklist/log/status page only.

## 2026-08-04 - Item 1.2: Hirshmans address sweep
Answers check: no "AGENT ANSWER" emails in the last 7 days. Coleman & Leigh
question from item 1.1 remains open.
Verified "56-62 Sherwood House, Station Road, Ainsdale" everywhere:
- Repo: branches.json (line 688) correct, and git history shows it has been
  correct since the initial seed. All 13 generated Hirshmans pages (11
  service, 1 switch, 1 travel/weight loss set) carry the correct address in
  the contact line, the Google Maps embed URL and the JSON-LD schema
  streetAddress. tools/branches-editor.html snapshot correct. Swept for
  wrong variants (missing "Sherwood House", 56/62, 56 - 62, en dash,
  "62 Station Road", "56 Station") - zero hits. Every "PR8 3HW" occurrence
  sits alongside the correct street address.
- Live site (checked 2026-08-04): homepage footer contact block, sitewide
  CDN footer bar and contact-us page all correct.
No repo changes needed. Commit this run: worklist/log/status page only.
Note for Rishi or Dane (not a blocker): on the live contact-us page the
left-hand address block wraps "Station Road" across a line break mid-word
pair and omits the PR8 3HW postcode. Correct address, scruffy presentation.
Hand edit in Weebly when convenient - outside what this agent can reach.

## 2026-08-04 - Item 1.1: Standardise brand-name spelling
Established canonical forms from branches.json and the live sites:
- Fishlocks Chemist: repo already consistent. "fishlock" (singular) remains
  only in the domain (fishlockpharmacy.co.uk), the NHS review slug and the
  keyword-match tokens, all intentional. Live site checked: "Fishlocks"
  throughout the copy. No change needed.
- Coleman & Leigh Pharmacy: repo internally consistent, but the live site,
  domain and NHS profile disagree with each other. Question logged above;
  no repo change made.
- Gordon Short Chemist: branches.json carried "Gordon Shorts Chemist" and
  propagated it into all 16 generated Gordon Short service pages. The live
  site (checked 2026-08-04, zero occurrences of "Shorts"), the domain
  (gordonshortchemist.co.uk) and the NHS profile (gordon-short-chemist) all
  use the singular. Fixed brandLabel and branchName in branches.json, bumped
  lastUpdated, updated the embedded snapshot in tools/branches-editor.html,
  then regenerated via build-service-pages.js, build-contraception-pages.js,
  build-weight-loss-pages.js and build-travel-clinic-pages.js. Verified:
  git grep "Gordon Shorts" now returns nothing outside CHANGELOG history.
Files changed: branches.json, tools/branches-editor.html, 16 Gordon Short
pages plus INDEX/SEO/TRAVEL-CLINIC/WEIGHT-LOSS index sheets (19 files,
189 lines). Commit: 1ec8f7b.
Note: per CHANGELOG, the live Gordon Short Weebly pages pin the CDN at
commit 76221ba, so the corrected pages only go live when the embeds are
repasted. One for Rishi or Dane when convenient.

## 2026-08-04 - Setup
Branch agents/audit-backlog created from main. Worklist seeded from
Master Plan v2, Build Pack v2 and the June audit context pack. Hourly
scheduled task created on the ProDesk. No site changes made in this run.
