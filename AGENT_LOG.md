# AGENT LOG - hourly audit-backlog runs
Newest entries at the top. Every run appends an entry, even a no-change one.
Format: date, time, item worked, what changed, commit hash, open questions.

## Questions for Rishi
- None open.
- ANSWERED 2026-08-04 (item 1.1): Coleman & Leigh vs Leighs. Rishi confirmed
  the correct trading name is "Coleman and Leighs Pharmacy". Repo updated and
  regenerated same day (see entry below). Do not re-raise this question.

---

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
