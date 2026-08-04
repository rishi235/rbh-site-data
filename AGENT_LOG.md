# AGENT LOG - hourly audit-backlog runs
Newest entries at the top. Every run appends an entry, even a no-change one.
Format: date, time, item worked, what changed, commit hash, open questions.

## Questions for Rishi
Open: Q2 (Wilmslow web presence), Q3 (how tonight's fixes go live: merge to
main first or pin to branch commit), Q4 (rewrite the 16 GBP descriptions -
McCanns Sandringham currently carries Hirshmans text naming two POM weight
loss medicines), Q5 (old Cherry Lane weight loss page still live naming
Wegovy, Mounjaro and Orlistat with an efficacy claim - strip, delete or
leave). All in QUESTIONS.json and on the portal answer form.

ANSWERED 2026-08-04 (item 1.1): Coleman & Leigh vs Leighs. Rishi confirmed
  the correct trading name is "Coleman and Leighs Pharmacy". Repo updated and
  regenerated same day (see entry below). Do not re-raise this question.

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
