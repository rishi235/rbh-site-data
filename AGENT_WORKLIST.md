# AGENT WORKLIST - Full Audit June 2026 backlog
Source: RBH_DIGITAL_MASTER_PLAN_v2.md and RBH_DIGITAL_BUILD_PACK_v2.md
(AI\Digital Marketing\handover files, 17 July copies) and
00_DIGITAL_AUDIT_CONTEXT_PACK.md (AI\Weebly\seo).

## Rules for every run
- Work ONLY in C:\Dev\rbh-site-data on branch agents/audit-backlog.
- NEVER checkout, commit to, merge or push main. NEVER force-push anything.
- Follow repo conventions in CLAUDE.md. Pages are generated: change the
  generators and data (branches.json, tools, scripts), then regenerate.
  Do not hand-edit generated output.
- One worklist item per run, done properly. Tick it here when complete.
- Append a dated entry to AGENT_LOG.md every run, even if nothing changed.
- If an item needs a decision from Rishi, write the question in AGENT_LOG.md
  under "Questions for Rishi", mark the item [BLOCKED] here, move on.
- UK English. No em dashes. No emojis. Plain English.

## Phase 1 - Data accuracy (quick wins)
- [x] 1.4 Check every branch page's NAP (name, address, phone) against
      branches.json; fix mismatches at source and regenerate. Done 2026-08-04.
      New tools/check-nap.js verifies all 171 generated pages; Scorah
      Bramhall switch page address corrected (61-63 North Park Road),
      disposed Wilmslow switch page removed, generator now skips
      disposed branches. Checker passes clean.
Quality pass 2026-08-11: the NAP data verified clean. check-nap reports 177
pages and 0 mismatches, check-page-coverage reconciles the whole 177, all six
generators regenerated every page byte-identical, the disposed-branch guard
still fires in all four hardcoded-list generators, and all 19 checkers pass.
One defect found and fixed in the verifier rather than the data. check-nap
read a phone number in only two shapes, a tel: href and digits written
straight after "Call" or the contact card's "Phone:" label, and ignored every
other phone-shaped number on the page. All 15 switch pages carry one it could
not see: the FAQ answer reads "Call us on <number>", and the two words in
between put it outside the reader. Proved by swapping that number for another
branch's on one page: the previous checker exited 0 reporting 0 mismatches.
It now sweeps every phone-shaped number, the four NAP surfaces must be present
rather than optional, and modules/switch/weebly.html is read as a shared paste
template that must carry no branch fact at all. Negative-tested eleven ways.

## Phase 2 - Pilot pair (agreed sequence: one strong, one weak)
- [x] 2.1 Fishlocks Ainsdale: audit its pages against the Build Pack v2 spec;
      list gaps in AGENT_LOG.md, then fix what can be fixed in-repo. Done 2026-08-04.
      Full audit of all 13 repo pages plus the live site: page set complete and
      live, titles/H1s carry town + service, NAP and tel: links clean, widgets
      data-driven, helpdesk email destinations correct. Gaps logged in
      AGENT_LOG.md (JSON-LD opening hours deferred to Phase 3 regeneration,
      old shared PF page still the one ranking, CDN pin note). In-repo fix:
      stale pfLink corrected for both Fishlocks branches.
      Quality pass 2026-08-11: the repo half is clean and byte-stable and no
      in-repo defect was found. All six generators rebuilt to a zero diff, all
      18 checkers pass, the branch owns exactly the 13 pages the repo
      generates, and the four things the original audit claimed all hold:
      titles and H1s carry town and service, NAP matches branches.json field
      for field, no widget id is hardcoded anywhere, and both module
      destinations read helpdesk@rbhealth.co.uk as Build Pack v2 section 5.6
      requires. A full-tree scan for the singular brand forms returns zero
      hits outside this log, so item 1.1 is genuinely clean here in the repo.
      Of the item's three original gaps, one has closed on its own and two
      have not. The old shared page pharmacy-first-service-eccleston-ainsdale
      .html now carries a "Choose your branch" block linking to both branch
      pages, so the page that still ranks is no longer a dead end; it remains
      in the sitemap alongside both branch pages, and it is US-spelled and
      prints both phone numbers unspaced, neither of which any generator
      owns. The JSON-LD opening hours gap was deferred to the Phase 3
      regeneration, Phase 3 completed the same night and the hours never
      arrived: 6 of the 177 generated pages carry an openingHoursSpecification
      and they are exactly the six branch landing pages, so all 171 service
      and switch pages declare a Pharmacy with no hours. Asked as Q38 rather
      than deferred a second time. The live half is stale rather than wrong.
      All 40 sitemap URLs share a lastmod of 2026-07-18T23:03:23, so this site
      has had no publish for three weeks, which explains in one fact the
      landing page 404 under Q35, the pre-Q7 em dash still in the switch page
      body and the pre-Phase-3 switch SEO title. Both of those last two were
      first seen at Cherry Lane and are now confirmed at a second brand on a
      second site, so they are estate-wide rather than one branch. The new
      finding is the site's Weebly-native contact block and legal footer,
      which name the business "Fishlock Pharmacy" twice and "Fishlock Chemist"
      once, none of them the trading name, and abbreviate the Ainsdale street
      to "17 Station Rd". Same class as Q36 and unreachable by any paste of a
      generated page. Raised as Q37. Done 2026-08-11.
- [x] 2.2 Fishlocks shared-domain split: branch-specific landing pages so
      Ainsdale and Eccleston each have their own local target page. Done 2026-08-04.
      New tools/build-branch-landing-pages.js generates modules/branch/pages/
      pharmacy-fishlocks-ainsdale.html and pharmacy-fishlocks-eccleston.html
      from branches.json (NAP, opening hours, service links, sister-branch
      cross-link, hours schema in JSON-LD). check-nap extended to cover the
      new folder; 173 pages, 0 mismatches. Weebly paste by Rishi or Dane per
      modules/branch/pages/INDEX.md and SEO.md.
      Quality pass 2026-08-10: the repo half is clean and byte-stable. A
      rebuild produced zero diff, all 18 checkers pass, both pages match
      branches.json on NAP, hours, JSON-LD and links, and the two
      observations left by the 2026-08-05 pass are both resolved (the sister
      link no longer repeats the town, and Eccleston's addressRegion is now
      Lancashire with Chorley moved to seoRegion). The app sentence is
      correctly gated on hasApp and appears on these two pages only. The
      finding is on the live half, which no pass had ever read: both pages
      return a 404, as do the four from item 5.2, so the shared-domain split
      has never reached a visitor or Google. The old combined pages it exists
      to replace are still the live targets. Recorded in INDEX.md via the
      generator and asked as Q35.
- [x] 2.3 Cherry Lane: build-from-near-zero per Build Pack v2. Full page set
      (services, Pharmacy First, switch, weight loss, travel) with local SEO. Done 2026-08-04.
      Verified: full 12-page set exists in repo AND is live on
      cherrylanepharmacy.co.uk with all pages in the site navigation. Titles,
      H1s and meta carry Walton per SEO.md; widgets fully populated in
      branches.json; no POM names in new pages; check-nap clean. In-repo fix:
      stale pfLink corrected to the new overview page. Gaps logged: live PF
      overview embed is a stale paste (shows five conditions as coming soon
      although all seven pages are live) - needs a repaste; old weight loss
      page still live with POM names and efficacy claims - new Q5.
      Quality pass 2026-08-11: the repo half is clean and byte-stable. All six
      generators rebuilt to a zero diff, all 18 checkers pass, and the branch
      owns exactly the 12 pages the repo generates, correctly with no branch
      landing page. The live half is the best result any build item in this
      backlog has returned: the sitemap lists all 12 generated pages and each
      one is reachable, so unlike items 2.2 and 5.2 this build has actually
      reached the public in full. Both gaps the 2026-08-05 pass left open are
      now closed, neither by this run. The Pharmacy First overview has been
      repasted and all seven conditions now render with working links, and the
      old weight loss page has been stripped to a short signpost naming no
      medicine and making no claim, with both URLs live, which is Q5 applied
      exactly as Rishi answered it. Q5 can be treated as closed on the
      evidence. Two live findings, neither in copy this repo owns. The switch
      page SEO title field still carries the pre-Phase-3 string "Switch Your
      Prescriptions - Cherry Lane Pharmacy Walton" against the paste sheet's
      "Switch Your Prescriptions to Cherry Lane Pharmacy, Walton", which
      confirms with evidence what items 3.1, 5.1 and Q3 had only assumed. And
      the Weebly-native site footer publishes the branch NHS mailbox as
      pharmacy.FA226@mhs.net rather than nhs.net, a one-letter typo that
      bounces, found for the third time and now raised as Q36. Smartts was
      read in the same pass and publishes its mailbox correctly, so the fault
      looks site-specific rather than an estate-wide template. No in-repo
      defect found, so nothing was changed in the repo. Done 2026-08-11.

## Phase 3 - Town and service words in titles and headings (all pages)
The core position fix from the audit. Work brand by brand, one item per run.
For each brand: put town plus service words into every page title, meta
description and H1 via the generators, following the pattern in Build Pack v2.
- [x] 3.1 Define the title/H1 pattern once, in the generator, with per-branch
      town words sourced from branches.json. Document the pattern in
      AGENT_LOG.md before rolling out. Done 2026-08-04. New tools/
      seo-pattern.js is the single pattern definition (family A search-phrase
      pages, family B brand-led service pages, canonical switch form, meta
      rule), matching current generator output so rollout wiring causes no
      unintended churn. Self-test passes for all 16 buildable branches.
All Phase 3 rollout items completed in one supervised session on 2026-08-04
(Rishi asked to work ahead of schedule): the six generators were wired to
tools/seo-pattern.js, all 173 pages regenerated, and the new
tools/check-seo-pattern.js verifies every page title and H1 against the
pattern per brand. Only switch page SEO titles actually changed; all other
pages regenerated byte-identical. Live Weebly SEO fields for switch pages
still need updating at the next paste run (see Q3).
Quality pass 2026-08-11: the pattern itself verified clean. The self-test
passes, all six generators still compose through tools/seo-pattern.js, a full
regeneration of all 177 pages produced no diff, and all 19 checkers pass. One
defect found and fixed in the verifier rather than the pattern:
tools/check-seo-pattern.js held a hand-copied mirror of the seven condition
slugs and phrases, and those slugs also composed its filename regex, so an
eighth condition added to the generator would have gone untyped, been counted
as skipped and passed. The conditions are now read from build-service-pages.js
as data under test, and an untyped file is a failure rather than a skip.
- [x] 3.2 Scorah Chemists (Bramhall and Hazel Grove): put the town and
      service words into every page title, description and heading,
      regenerate, check the result. Done 2026-08-04. check-seo-pattern:
      24 pages, 0 mismatches.
      Quality pass 2026-08-11: all 26 Scorah pages re-read (12 Bramhall, 12
      Hazel Grove, 2 landing). Title, H1 and description verified clean
      against the pattern, exactly one H1 per page across the whole estate
      of 177, and the sister town appears in only the two landing
      descriptions where branches.json puts it in the branch's own
      serviceAreaList. All 19 checkers pass. The gap found was not in the
      pages but in the rules: every SEO rule in the repo was a PRESENCE rule
      (the right town must be there) and none was an ABSENCE rule, so a page
      naming its own town AND its sister branch's town passed everything.
      The 2026-08-09 pass had proved that absent by hand and nothing
      preserved it. check-seo-pattern.js now carries the cross-town rule,
      excused only by the branch's own serviceAreaList, proved to bite by
      injection on both the description and the H1 leg. No new question.
- [x] 3.3 Fishlocks Chemist (Ainsdale and Eccleston): same treatment. Done
      2026-08-04. 26 pages (incl. the two landing pages), 0 mismatches.
      Quality pass 2026-08-11: all 26 Fishlocks pages re-read (12 Ainsdale,
      12 Eccleston, 2 landing) and clean. Every title, description and H1
      carries the branch's own town, no page names the sister town, both
      2026-08-09 fixes still stand (Eccleston addressRegion Lancashire with
      seoRegion Chorley, and no "Eccleston in Eccleston" link), all six
      generators regenerate every page byte-identical, and all 19 checkers
      pass. The gap was in the rules again, and one town over. No rule in
      the repo had ever compared one H1 to another: check-seo-lengths reads
      the paste sheets, which carry the title, description and permalink but
      not the H1, and check-seo-pattern proves each H1 equals the pattern,
      which is a per-page rule. A family A H1 carries no brand, so
      Fishlocks Ainsdale and Hirshmans Ainsdale publish eight identical
      headings, and so do the Bootle and Walton pairs: 48 pages competing
      with a page of ours while every checker stayed green. New rule 4 in
      check-seo-lengths.js reads the H1 off the pages and classifies pairs
      rather than groups, proved to bite on four injections. The 48 are
      reported against Q44, which asks whether the heading should carry the
      brand, because that is a search decision and a repaste.
- [x] 3.4 Cherry Lane Pharmacy (Liverpool): same treatment. Done 2026-08-04.
      12 pages, 0 mismatches.
- [x] 3.5 Hirshmans Chemist (Ainsdale): same treatment. Done 2026-08-04.
      12 pages, 0 mismatches.
Quality pass 2026-08-11: all 12 Hirshmans pages re-read from source and clean.
Titles 44 to 62 characters, descriptions 137 to 156, one H1 each, Ainsdale in
every title, description, H1 and slug, seoTown and addressLocality both
Ainsdale so there is no divergence to get backwards, street "56-62 Sherwood
House, Station Road" and PR8 3HW on all 12, one tel: 01704577376 per page,
schema present with addressRegion Merseyside. All six generators rebuilt every
page byte-identical and all 19 existing checkers passed before any change.
The gap was in what nothing checked. Every Pharmacy First condition page states
who the NHS service is for, and states it twice, from ageNote and from
eligibleYes[0] in build-service-pages.js. Two independently authored strings
carrying one clinical fact across 98 live pages, and no checker read either.
That is the shape of defect that already bit this repo twice on SEO strings.
All seven cohorts verified correct against the NHS specification and identical
across all 14 branches, so nothing was wrong; it was simply unpinned. New
tools/check-pharmacy-first-eligibility.js makes it a rule, 8 rules over the
generator and the pages, proven by 8 negative tests. Q46 raised on whether the
earache title should carry the cohort the H1 already carries.
- [x] 3.6 McCanns Chemist (Aigburth and Sandringham): same treatment. Done
      2026-08-04. 24 pages, 0 mismatches.
- [x] 3.7 Smartts Chemist (Bootle): same treatment. Done 2026-08-04.
      12 pages, 0 mismatches.
Quality pass 2026-08-11: all 12 Smartts pages re-read from source and clean.
NAP "42 Fernhill Road", L20 9HH and 0151 922 4984 on all 12, one tel: link
each, seoTown and addressLocality both Bootle so there is no divergence to get
backwards, Bootle in every H1, permalink and paste-sheet entry, all eight
Pharmacy First sheet blocks matching the estate pattern exactly, service pages
pinned to service-module-phase1 and the switch page to 6a275e1 as their
generators declare. All six generators rebuilt every page byte-identical and
all 21 existing checkers passed before any change was made. Two verifications
that closed suspicions rather than opening them: every content file in the
repo is opened by at least one checker, tested by instrumenting fs reads
across all 21 and diffing against the file tree, so the "which files did it
read" fault that bit this repo three times is closed at file level; and the
Tiffenbergs pfLink, the only one of the 16 written without a .html extension,
resolves live through a Weebly redirect and is not broken.
The gap was one layer below the pages. An Appointedd widget id decides which
diary a booking lands in, no generated page carries one, and 79 of them sit in
branches.json. check-booking-routes guards that chain in one direction only:
its rule 7 asks whether two services inside a single branch share an id, while
sharing BETWEEN branches it counts and prints as expected. Six ids are shared
today and all six are right. A seventh would print just as calmly. The estate
policy turns out to be unanimous and undeclared - weightLoss and travelClinic
shared across a brand's sites at 3 brands of 3, pharmacyFirst, contraception
and bloodPressure per site at 3 of 3, every single-site brand unique - and
Smartts is a single-site brand sitting directly above SK Chemists Bootle, a
different brand in the same town with the same five services. A copy-paste
between those two neighbours would send NHS bookings made on one Bootle
pharmacy's page into the other's diary with all 21 checkers green. Nothing was
wrong; the policy was unpinned. New tools/check-widget-diaries.js, 4 rules
derived from the data rather than hardcoded, all 4 proven by negative tests
(truncated id, cross-brand paste, an NHS diary shared at one brand only, and a
travelClinic id dropped into a sister's weightLoss slot). No question raised.
- [x] 3.8 SK Chemists (Bootle): same treatment. Done 2026-08-04.
      12 pages, 0 mismatches.
- [x] 3.9 Coleman and Leighs Pharmacy (Liverpool): same treatment. Q1
      (trading name) was answered, so not blocked. Done 2026-08-04.
      12 pages, 0 mismatches.
- [x] 3.10 Riddings Pharmacy (Timperley): same treatment. Done 2026-08-04.
      12 pages, 0 mismatches.
- [x] 3.11 Gordon Short Chemist (Liverpool): same treatment. Done 2026-08-04.
      12 pages, 0 mismatches.
      Quality pass 2026-08-11 (sixty-ninth run). All 12 pages re-read from
      source and clean: address, postcode and phone on every occurrence
      including the tel: link, own Google review link and no other branch's,
      JSON-LD parsing and matching branches.json field for field with a
      self-referencing url, Crosby in every H1, no prescription-only medicine
      on the weight loss page, and no non-ASCII in any body except the pound
      sign in the weight loss price.
      The gap was the whole body of the private travel clinic page, on 15 live
      pages, read by no checker. The generator states its own governance twice,
      in its header and in the paste comment of every page it writes: private
      and paid, not NHS Pharmacy First, NHS-funded exceptions flagged as "ask
      the pharmacist" and never a blanket promise, and no vaccine claimed
      guaranteed in stock. Three standing instructions, written down twice,
      enforced nowhere. New tools/check-travel-clinic-copy.js, 10 rules, 16
      negative tests, all 16 caught their break. Nothing on those pages is
      wrong. One question raised on yellow fever, Q48.
- [x] 3.12 Tiffenbergs Chemist (Liverpool): same treatment. Done 2026-08-04.
      12 pages, 0 mismatches.
- [x] 3.13 Clear Chemist (Liverpool): same treatment. Done 2026-08-04.
      3 pages (switch, weight loss, travel), 0 mismatches.

## Phase 4 - GBP content packs (drafts only; agents cannot edit GBP)
One pack per branch, saved to gbp-packs/<branch-slug>.md on this branch.
Each pack: business description, extra categories to add, services section
content, photo shot list, and four post drafts (Pharmacy First, switch to us,
weight loss, travel clinic). Use branches.json for facts. Ready for Rishi or
Dane to paste in. Advertising rules apply: no medicine brand names in weight
loss posts (POM advertising is not permitted), no efficacy claims, keep
Pharmacy First wording to the NHS service description.
- [x] 4.1 Create the pack template plus the first pack (Fishlocks Ainsdale).
      Done 2026-08-04 (Cowork session, not the hourly agent). gbp-packs/
      TEMPLATE.md sets the format and the advertising rules; gbp-packs/
      fishlocks-ainsdale.md is the first pack, facts from branches.json,
      weight loss post drafted with no medicine names and no efficacy claims.
      Quality pass 2026-08-11: both halves of the item re-read from source.
      The pack verified clean fact by fact against the fishlocks_ainsdale
      entry in branches.json: name, 17 Station Road, Ainsdale PR8 3HN with
      Southport as the post town on the house convention, phone 01704 575478,
      review link, hours, catchment order Ainsdale, Birkdale, Southport, the
      app mention it earns on hasApp true, the profile website pointed at its
      own landing page rather than the shared Fishlocks homepage, the
      categories and services earned by its five widgets, a 746-character
      description that is exactly what its heading claims, four posts at 448,
      385, 402 and 313 against a 1,500 limit, Post A on the branch's own
      pfLink, and no em dash, emoji, medicine name or efficacy claim. All 19
      checkers pass. One real gap closed, in TEMPLATE.md and the checker
      rather than in the pack: the hours rule read clock TIMES only and never
      read DAYS, although a Google profile is set day by day, so "Monday to
      Saturday 8:45am to 6:00pm" on this very pack would have passed every
      check while publishing a Saturday opening for a shop branches.json
      holds as closed. check-gbp-packs.js now requires every day stated open
      to be open in branches.json, every open day to be stated, and every
      closed day to be stated as closed, all composed from branches.json.
      TEMPLATE.md's hours rule says so too, since every future pack is
      drafted from it. Six negative tests fire; all 15 packs pass unchanged.
- [x] 4.2 Cherry Lane pack. Done 2026-08-04 (Cowork session). gbp-packs/
      cherry-lane-walton.md. Posts B, C and D flagged: check those pages are
      live before posting - Cherry Lane build (2.3) is still pending.
      Quality pass 2026-08-11: the pack verified fact by fact against
      branches.json and rule by rule against TEMPLATE.md, and nothing in it is
      wrong. Address 202 Cherry Lane, Liverpool L4 8SG, phone 0151 226 2051,
      website and review link all match; hours read Monday to Friday 9:00am to
      6:30pm, Saturday 9:00am to 5:00pm, Sunday closed, which is the whole of
      this branch's openingHours and no more; description is 736 characters,
      exactly what its heading claims, and the four posts are 449, 348, 403
      and 318 against a 1,500 limit. Post A's seven conditions and its UTI 16
      to 64 range match the generated Pharmacy First page, Post C names no
      medicine and makes no efficacy claim, and all four post links point at
      pages this repo generates. The flag above is now spent: 2.3 is done, so
      Posts B, C and D have live pages. All six generators rebuilt to zero
      diff and all 18 checkers pass. Two defects found, both outside the pack.
      check-gbp-packs.js had never read two of the six profile-basics lines,
      the GBP listing name and, for the nine branches that own their domain,
      the website; both are now guarded, negative-tested seven ways, and all
      15 packs already comply. The branch-name-as-place rule read only
      in/at/near/around, so it could not see mccanns-sandringham.md telling
      the paster the profile "stays local to Sandringham", a word item 5.7
      moved off that branch on 2026-08-10; "local to" added to the rule, then
      caught it, and the copy corrected to St Michael's. Q40 asks what the
      Cherry Lane Google listing should actually be called, a decision the
      pack itself deferred on 2026-08-04 and nobody has taken since.
- [x] 4.3 Hirshmans pack. Done 2026-08-04 (Cowork session). gbp-packs/
      hirshmans-ainsdale.md. Includes note to check the live Hirshmans GBP
      description for POM medicine names when pasting (see Q4).
      Quality pass 2026-08-11: the pack verified fact by fact against
      branches.json and rule by rule against TEMPLATE.md, and nothing in it
      is wrong. Address 56-62 Sherwood House, Station Road, Ainsdale,
      Southport PR8 3HW, phone 01704 577376, website and review link all
      match; hours read Monday to Friday 8:30am to 6:00pm and Saturday
      9:00am to 5:30pm with both lunch closures, which is the whole of this
      branch's openingHours and no more, and the paster note spells out the
      two time ranges GBP needs per open day. Description is 743 characters,
      exactly what its heading claims, and the four posts are 448, 408, 402
      and 317 against a 1,500 limit. Post A's seven conditions and its UTI
      16 to 64 range match the generated Pharmacy First page condition for
      condition, Post C names no medicine and makes no efficacy claim, and
      the switch, weight loss and travel links all point at pages this repo
      generates. Catchment leads with Ainsdale, the branch owns its domain
      so the profile website is correctly the homepage, and all five widget
      services are listed. All six generators rebuilt to zero diff and all
      19 checkers pass. One defect found, in the verifier rather than the
      pack. check-gbp-packs.js read section 4, the photo shot list, for its
      heading and nothing else, so a pack could carry an empty section and
      pass. Build Pack v2 4.1 asks for 10 or more photos, the vinyl
      storefront shot and a reminder to clear pending Google updates while
      in the profile, and every pack in the estate sits exactly on 10 shots
      with no headroom at all. Three rules added, negative-tested three
      ways, and they caught a real breach: mccanns-sandringham.md was the
      one pack with no pending-Google-updates reminder, so its paster would
      have left Google's own queued edits to hours, categories and the
      address to publish themselves. Reminder added to that pack.
- [x] 4.4 Scorah Chemists Bramhall pack. Done 2026-08-04. gbp-packs/
      scorah-bramhall.md. Facts from branches.json; services drawn from the
      branch widget set (BP checks, contraception, PF, weight loss, travel).
      Scorah's travel and weight loss pages are private paid services, so no
      "free assessment" wording; hasApp false, so no app mention. Post A uses
      the shared Hazel Grove / Bramhall PF page per pfLink, with a paster
      note to swap to the branch page once live.
Quality pass 2026-08-11: the pack verified clean against branches.json and
TEMPLATE.md on every fact for the second time, and for the first time its four
post buttons were fetched live. Three of the four resolve and read correctly.
The fourth, the profile website the pack sets, is the branch landing page
pharmacy-scorah-bramhall.html and it returns a 404, which the pack's own paster
note anticipates, so the profile cannot yet move off the shared homepage. One
in-repo gap closed: nothing checked WHICH page a post button pointed at, only
that the link sat on the right host and that the page existed, so a Post D
carrying the sister branch's travel page on the same shared domain would have
passed clean and sent every click to the wrong pharmacy. tools/check-gbp-packs.js
now derives the correct target for Posts B, C and D from branches.json using the
same brandSlug-townSlug rule the generators build with, and holds Post A to
either the branch's pfLink or its own generated page so item 5.3 can still
repoint it. Four negative tests fire; all 15 packs pass. New question Q43, on
the two Weebly-native address faults found live on scorah-chemists.co.uk.
- [x] 4.5 Scorah Chemists Hazel Grove pack. Done 2026-08-04. gbp-packs/
      scorah-hazel-grove.md. Facts from branches.json; same service set as
      Bramhall (BP checks, contraception, PF, weight loss, travel). Paster
      notes flag the 24 June Saturday closure (check GBP hours), the shared
      PF page link, and the Q3/Q4 checks before pasting. No app mention
      (hasApp false); weight loss post has no medicine names or efficacy
      claims.
Quality pass 2026-08-11: the pack verified fact by fact against branches.json
for the second time and found correct on name, street address, post town,
postcode, phone, hours including the 24 June Saturday closure, review link,
catchment order, profile website pointed at its own landing page, categories
and services earned by the widget set, the 712-character description, all four
post lengths, all four post button targets, brand spelling, house style and POM
advertising. All 19 checkers pass and all seven generators reproduce every page
byte-identical. One real gap closed, in the checker rather than the pack: a pack
that names a SISTER branch was read by nothing, although two packs carry that
claim inside the business description, which is pasted verbatim into a public
Google profile. check-gbp-packs.js now requires a claimed sister to be a live
branch on the same brandLabel and requires the sentence to name that sister's
own seoTown, both composed from branches.json. Four negative tests fire:
sister disposed, sister renamed, wrong town named, stale KNOWN entry.
(4.6 to 4.15: numbering runs one past the original estimate because ten
branches remained, not nine. All ten drafted in parallel by six subagents
in a supervised Cowork session on 2026-08-04, then compliance-swept
centrally: no medicine names, no em dashes, no emojis, descriptions under
750 chars, facts spot-checked against branches.json.)
- [x] 4.6 McCanns Chemist Aigburth pack. Done 2026-08-04.
      Quality pass 2026-08-10: the pack verified fact by fact against
      branches.json and found correct on address, postcode, phone, hours
      including both lunch closures, review link, catchment order, profile
      website pointed at its own landing page, categories and services
      earned by the widget set, description length, all four post lengths,
      house style and POM advertising. One real defect found and fixed at
      source: the business description told the paster to write "There is a
      second McCanns branch at Sandringham", which reads Sandringham as a
      place. Since item 5.7 it is not one: it is in neither McCanns branch's
      serviceAreaList and that branch's local word is St Michael's on all 13
      pages it owns, including the sister cross-link on this branch's own
      landing page. The Aigburth Google profile was the last artefact in the
      estate still naming it, so the profile would have signposted a location
      none of the pages claim. Now reads "McCanns Chemist Sandringham, in
      St Michael's", matching the landing page, 725 characters against the
      750 limit, with a paster note against shortening it back.
      check-gbp-packs.js given a branch-name-as-place rule that reads the
      recognised place words out of branches.json rather than hardcoding any,
      negative-tested four ways. It was the only breach in the 15 packs.
      Logged as Q26, taken as an autonomous decision under the standing
      window.
      Quality pass 2026-08-11 (seventy-ninth run): the pack verified fact
      by fact against branches.json a second time and is clean on name,
      address, postcode, phone, hours including both lunch closures, review
      link, catchment order, hasApp, pfLink and the St Michael's
      sister-branch wording the run 37 fix introduced. Repo half clean and
      byte-stable, all 29 checkers green. Live half: all four post button
      URLs return 200 with correct content and the Post A page's hours
      block matches branches.json. The profile-website landing page
      (pharmacy-mccanns-aigburth.html) still 404s awaiting the queued
      paste run, already recorded, and the pack's own paster notes already
      cover it. The live titles carry Weebly's default " - MCCANNS
      PHARMACY" suffix (run 78 finding, repaste covers it) and the
      site-furniture "Sandrigham" typo seen in the footer is already held
      by the open furniture question. No new defect, no new question.
      Evidence: audits/mccanns-aigburth-gbp-pack-check-2026-08-11.txt.
- [x] 4.7 McCanns Chemist Sandringham pack. Done 2026-08-04. Carries the
      NOTE FOR PASTING that its description replaces the faulty live
      Hirshmans-copied text naming two POMs (Q4) in full.
      Quality pass 2026-08-11: the pack verified fact by fact against
      branches.json and rule by rule against TEMPLATE.md, and nothing in it is
      wrong. Address 1b Aigburth Road, Liverpool L17 4JP, phone 0151 727 3076,
      website and review link all match; the hours line carries both weekday
      sessions, 9:00am to 1:00pm and 2:00pm to 6:00pm with Saturday and Sunday
      closed, and the paster notes carry the split-day guidance the 4.10 pass
      made compulsory; the catchment reads "St Michael's, Aigburth, Lark Lane
      and Dingle" in all three places, leading with the seoTown item 5.7 moved
      it to, which is the Q25 correction holding; categories and services match
      the five-widget set exactly; the description is 713 characters, exactly
      what its heading claims, and the posts are 463, 298, 518 and 425 against
      a 1,500 limit; Post A's seven conditions and the UTI 16 to 64 range match
      the generated Pharmacy First page; Post C names no medicine and makes no
      efficacy claim; the file is pure ASCII; hasApp is false and nothing
      mentions an app. The description's sister-branch sentence reads "Our
      sister McCanns branch is further along Aigburth Road", which names no
      place and so does not repeat the fault the 4.6 pass fixed on the other
      side of the pair. All six generators rebuilt to a zero diff and all 18
      checkers pass.
      One in-repo defect found and fixed, in the checker rather than the pack.
      TEMPLATE.md requires every fact in a pack to come from branches.json, and
      check-gbp-packs.js guarded the phone and the postcode in both directions
      but had never read two other fields at all: the street address and the
      Google review link. Both are the silent class. A pack that quoted the
      sister's street but its own postcode passed every rule in the repo, and
      McCanns is the concrete case, because both shops sit on one road at 1b
      and 112 Aigburth Road, so a swapped house number puts the profile pin on
      the wrong building while every other line reads correctly. The review
      link is worse: every branch's is https://g.page/r/<opaque id>/review, so
      two of them differ only in a string nobody proof-reads, and pasting the
      sister's sends this shop's review requests to the sister's profile.
      Rules added in both directions for both fields, with a KNOWN_IDENTITY
      exception map on the same anti-rot convention as the other three.
      Negative-tested five ways, including a case that proves the
      whitespace-collapse works: one copy of the address wraps mid-phrase as
      "1b" then "Aigburth Road" on the next line, and the rule correctly reads
      it as present. All 15 packs already comply, so the gap was latent.
      The live findings are outside the pack. The branch landing page the pack
      sets as the profile website, pharmacy-mccanns-sandringham.html, was
      fetched and returns a 404 and is absent from the sitemap, which confirms
      Q35 at a third brand; the pack already holds the paster back for it. The
      site's Weebly-native contact block and legal footer name the business
      "McCann's Pharmacy" throughout, against "McCanns Chemist" in
      branches.json and on all 26 generated pages, abbreviate the sister's
      street to "112 Aigburth Rd", and misspell the medical centre as
      "Sandrigham". That is the same class as Q36 at Cherry Lane and Q37 at
      Fishlocks, and it makes three faulty sites out of three read, so it is
      raised as Q39 as an estate-wide question rather than a fourth per-site
      one. The branch's own Saturday and weekday hours in that block match
      branches.json, so there is no locked-door fault here. Done 2026-08-11.
- [x] 4.8 Fishlocks Chemist Eccleston pack. Done 2026-08-04. Strictly
      Eccleston facts; profile website set to the new branch landing page.
      Quality pass 2026-08-10: no defect found in the pack. Verified fact by
      fact against branches.json and rule by rule against TEMPLATE.md.
      Address, postcode PR7 5SZ, phone 01257 451251 and the review link all
      match, and no other branch's phone or postcode appears anywhere; hours
      match the NHS-confirmed spec including the Saturday 9 to 12 and match
      the landing page's own rows; catchment reads "Eccleston, Charnock
      Richard and Coppull" in all three places, leading with its own
      seoTown; the profile website already pointed at
      pharmacy-fishlocks-eccleston.html, which is why the 2026-08-09 pass
      that repointed the other five shared-domain packs did not need to
      touch this one; all four post links resolve to pages this repo
      generates and sit on the branch's own host; description 730 characters
      as the pack claims, posts 463, 348, 521 and 433, all inside the
      limits; Post A's seven conditions and age ranges match the generated
      Pharmacy First page, "earache in children" included; Post C names no
      medicine and makes no efficacy claim; no em dash, no emoji, and none
      of the Ainsdale sister-branch facts have leaked in.
      One in-repo defect found and fixed, in the checker rather than the
      pack: TEMPLATE.md says a pack must not list a service the branch has
      no widget for, and check-gbp-packs.js only ever enforced that rule in
      the omission direction. A pack could advertise a service the shop does
      not run and the repo would stay green. Reverse rules added for both
      categories and service bullets, reading a bullet plus its wrapped
      continuation lines so a note in prose that a service is NOT offered
      still passes, which is what clear-aintree.md relies on. Negative
      tested four ways. No pack in the estate breaches it today, so the gap
      was latent, not live. Logged as Q27, taken as an autonomous decision
      under the standing window.
      Quality pass 2026-08-11: repo half clean, no defect. Facts, counts
      (730, 463, 348, 521, 433) and widget coverage re-verified; checkers
      green, generators byte-identical. Live: all four post URLs 200 and
      Eccleston-correct; landing page 404 is the known queued-paste state.
      One live divergence: the switch page title serves Weebly's default
      construction, not the SEO.md title (run 78 pattern, unpasted SEO
      field). Covered by the 5.3/5.4 repaste scope; no question raised.
      See audits/fishlocks-eccleston-gbp-pack-check-2026-08-11.txt.
- [x] 4.9 Clear Chemist Aintree pack. Done 2026-08-04. No opening hours in
      branches.json so the pack says do not paste hours until confirmed
      and added; no Pharmacy First at Clear (no pfLink or widget), so
      Post A is a local team post instead.
      Quality pass 2026-08-10: every fact in the pack verified against
      branches.json and every rule against TEMPLATE.md, and nothing in it
      is wrong. Address, postcode L9 7AS, phone, website and review link
      match; catchment leads with its own seoTown; categories and services
      match the widget set exactly and the prose note that Pharmacy First,
      blood pressure and contraception are NOT offered is correct; the
      description is 669 characters, exactly what its own heading claims,
      and the posts are 460, 453, 600 and 529, all inside the 1,500 limit;
      no medicine name, no efficacy claim, no em dash, no emoji,
      no non-ASCII character, and no other branch's facts anywhere in it.
      The defects are outside the pack and were found by reading the
      branch's own live site, which nothing in this repo can do. First,
      the phone: branches.json and all three generated Clear pages carry
      0151 203 8365, while the branch's own contact page publishes 0151
      203 6535 twice and 8365 nowhere. check-nap cannot see this, because
      it compares the pages to branches.json and both agree. Raised as
      Q28, and the pack now holds the number back from the profile until
      it is settled. Second, all three post links return 404 live, and not
      as a paste backlog: clearchemist.co.uk is the e-commerce store, not
      Weebly, so Clear's three generated pages have no paste route at all.
      Raised as Q29; the pack now tells the paster to use the homepage
      button on all three rather than link an error page. Third, Clear
      advertises its own WhatsApp number, 07512 330 076, while its pages
      carry the estate-wide hardcoded 447521775631, which is the concrete
      case Q21 was missing. One in-repo fix made: check-gbp-packs.js now
      reads the pack's "- Hours:" line against branches.json in both
      directions, and requires a branch with no hours recorded to say so
      and tell the paster not to guess. TEMPLATE.md named hours in the
      same sentence as phones and claims from the start; only hours had
      never been enforced. Negative-tested five ways. No pack breaches it
      today, so the gap was latent. Done 2026-08-10.
      Quality pass 2026-08-11 (second): pack verified clean again, fact by
      fact against branches.json and rule by rule via check-gbp-packs.
      Description re-measured at its claimed 669 characters, all 29
      checkers green, all six generators byte-identical. Live re-read by
      plain GET: the three post-target pages still 404 (Q29 unchanged,
      homepage-button guard still correct), the contact page still
      publishes 0151 203 6535 only and 8365 nowhere (Q28 unchanged), and
      Clear's own WhatsApp number is still live (Q21's concrete case).
      No in-repo defect found, no question raised. Evidence:
      audits/clear-aintree-gbp-pack-check-2026-08-11.txt.
- [x] 4.10 Smartts Chemist Bootle pack. Done 2026-08-04. Medical cannabis
      framed as free eligibility consultation only, no claims.
      Quality pass 2026-08-10: every fact verified against branches.json and
      every rule against TEMPLATE.md, and nothing in the pack is wrong.
      Address 42 Fernhill Road L20 9HH, phone 0151 922 4984, website and
      review link all match, and the live site agrees on every one of them,
      unlike Clear. Hours line matches the NHS-confirmed specification
      including both sessions; description is 710 characters, exactly what
      its heading claims; posts are 461, 324, 516 and 420, all inside the
      1,500 limit; catchment leads with its own seoTown; the widget set is
      fully covered; no medicine name, no efficacy claim, no em dash, no
      emoji, no non-ASCII character, and the only other branch named is SK
      Chemists in the note explaining why the wording differs. All four post
      links resolve live, including the Pharmacy First link. The defect is a
      gap between a correct pack and what actually reaches Google: Smartts
      closes 1:00pm to 2:00pm, Google's hours editor offers one time range
      per day first, and nothing told the paster to add the second. Seven
      branches close for lunch and only two packs, Tiffenbergs Aintree and
      Gordon Short Crosby, said so. The other five, this one included, said
      nothing. Not hypothetical: every live page on smarttschemist.co.uk
      already prints 9:00am to 6:00pm with no lunch closure, so the habit
      exists on the estate's own website and the pack was the last thing
      standing between it and the profile. Guidance added to all five packs
      in the wording the two correct packs already use, and
      check-gbp-packs.js now fails any split-day pack that omits it.
      Negative-tested four ways. Raised as Q30, answered as an autonomous
      decision under the standing window. The live website hours are a
      separate, wider defect already recorded on the item 3.7 pass; this
      pack now warns the paster about the contradiction rather than leaving
      Google and the website to publish different hours for the same shop.
      Done 2026-08-10.
      Second quality pass 2026-08-11: pack verified clean second time
      running. Every fact re-verified against branches.json; description
      still exactly the 710 characters it claims; posts 461, 324, 516 and
      420; pure ASCII, no medicine name, no em dash; split-day paster
      guidance present as the first pass's rule requires. All 29 checkers
      green, six page generators byte-identical. Live: all four post links
      still resolve, homepage NAP correct (phone 0151 922 4984 only, 42
      Fernhill Road, L20 9HH), but the site still prints 9:00am to 6:00pm
      with no lunch closure, so the recorded website-hours contradiction
      stands. Switch page live title is a hand-typed variant of the sheet
      title, the third instance of the unpasted-title pattern (runs 77 and
      80), covered by queued repaste work. No in-repo defect, no copy
      changed, no new question.
- [x] 4.11 SK Chemists Bootle pack. Done 2026-08-04. Wording deliberately
      distinct from Smartts so the two Bootle profiles do not duplicate.
      Quality pass 2026-08-10: the pack verified fact by fact against
      branches.json and rule by rule against TEMPLATE.md, and nothing in it
      is wrong. Address 516 Stanley Road, Bootle L20 5DW, phone
      0151 944 1013, website and Google review link all match, and the live
      site agrees on every one of them including the NHS email. Hours are a
      single Monday to Friday session 9:00am to 6:00pm with Saturday and
      Sunday closed, so the split-hours rule the 4.10 pass added does not
      apply here; catchment reads Bootle, Sefton and Liverpool in all three
      places, leading with its own seoTown; categories and services match
      the five-widget set exactly; the description is 735 characters,
      exactly what its heading claims, against a 750 limit, and the posts
      are 466, 305, 530 and 380 against a 1,500 limit; the shot list runs
      to the full 10; Post A's seven conditions and the UTI 16 to 64 range
      match the generated Pharmacy First page; Post C names no medicine and
      makes no efficacy claim; the file is pure ASCII; hasApp is false and
      nothing in the pack mentions an app. All 18 checkers pass.
      The defect is outside the pack and it is the clearest case yet of the
      thing item 5.3 exists to fix. All four post links were fetched and all
      four load, but Post A's target, pharmacy-first-service-bootle.html, is
      absent from the branch sitemap and its heading reads "Pharmacy First
      Service in Bottle, Liverpool", misspelling the town the whole page is
      meant to rank for. The generated replacement,
      pharmacy-first-sk-chemists-bootle.html, was fetched the same pass and
      is confirmed live, is in the sitemap, spells Bootle correctly, carries
      the correct trading name and lists the same seven conditions and age
      ranges. So this branch's half of item 5.3 is a one-line repo change
      with no Weebly paste attached, the same condition as Riddings. Hard
      stop added to the paster notes recording both facts, with the
      canonical link left untouched because the repoint belongs to 5.3.
      Raised as Q34, which asks whether 5.3 should be split so the
      no-paste repoints can run unattended. Done 2026-08-10.
      Second quality pass 2026-08-11: pack re-verified clean fact by fact
      against branches.json, first re-verification of the post-hard-stop
      bytes. Description 735 and posts 466, 305, 530, 380, identical to the
      first pass. All 29 checkers green, all seven generators byte-stable.
      Live: all four post buttons resolve, fourth clean run. Post A's
      target still misspells "Bottle" and is still absent from the
      sitemap; the generated replacement is still live, in the sitemap and
      correct throughout, so SK remains a no-paste repoint for 5.3. Every
      sitemap entry is dated 2026-07-18, so the site has not been
      republished since 18 July, which explains the stale banner mojibake,
      the pre-Q7 switch body and the live-only footer strip. Paster notes
      updated with the re-check dates and the republish state; no pasted
      copy changed, no new question. Evidence in
      audits/sk-chemists-bootle-gbp-pack-check-2026-08-11.txt.
- [x] 4.12 Coleman and Leighs Pharmacy Walton pack. Done 2026-08-04.
      Confirmed trading name used throughout; paste note to correct the
      live GBP name and any old spellings. Quality pass 2026-08-10: the
      pack itself is clean against branches.json and TEMPLATE.md, but the
      live read found the Post A link returning a 404 and the three live
      pages still publishing the pre-correction trading name and em dash.
      Paster notes now stop Post A and call for the repaste. Done
      2026-08-10.
      Second quality pass 2026-08-11: pack verified clean second time
      running. Every fact re-verified against branches.json: name, address
      241 Walton Village L4 6TH, phone 0151 525 3522, website, review
      link, hasApp false with no app mention; hours match the NHS-confirmed
      two-session specification and the pack carries the split-day paster
      guidance; catchment reads Walton, Liverpool and Sefton in all three
      places, leading with its own seoTown. Description still exactly the
      631 characters it claims; posts 456, 321, 528 and 433; pure ASCII,
      no medicine name, no efficacy claim, no em dash. All 29 checkers
      green. Live: Post A's pfLink still returns a 404, so the first
      pass's hard stop stands; Posts B, C and D all resolve; homepage NAP
      correct (0151 525 3522 five times and no other 0151 number, address
      and postcode present). One state change since the first pass: the
      replacement page pharmacy-first-coleman-leigh-walton.html is now
      CONFIRMED LIVE, in the site navigation and in the sitemap, but the
      live copy is a paste taken before the item 1.1 name correction and
      reads "Coleman & Leigh" 21 times where the repo page reads the
      confirmed name, the same shape as the Gordon Short 4.14 finding. So
      the Coleman leg of 5.3 no longer needs a first paste, it needs the
      corrected repaste before the button repoint. Paster note updated to
      match; all four inner pages still publish the pre-correction name
      and the switch page still carries the og:description em dash, all
      covered by the queued repaste. No new question: every finding lands
      on a decision already made.
- [x] 4.13 Riddings Pharmacy Timperley pack. Done 2026-08-04.
      Quality pass 2026-08-10: the pack verified fact by fact against
      branches.json and rule by rule against TEMPLATE.md, and nothing in it
      is wrong. Address 38 Riddings Road WA15 6BP, phone 0161 973 2951,
      website and review link all match; hours are a single Monday to Friday
      session 9:00am to 6:00pm with Saturday and Sunday closed, so the
      split-hours rule the 4.10 pass added does not apply here; catchment
      reads Timperley, Altrincham and Trafford in all three places, leading
      with its own seoTown; categories and services match the five-widget set
      exactly; the description is 657 characters, exactly what its heading
      claims, and the posts are 449, 319, 521 and 425 against a 1,500 limit;
      Post A's seven conditions and age ranges match the generated Pharmacy
      First page; Post C names no medicine and makes no efficacy claim; no
      em dash, no en dash, no emoji and no non-ASCII character anywhere in
      the file; hasApp is false and nothing in the pack mentions an app.
      The defects are all on the far side of the pack and were found by
      reading the live site and its sitemap. Post B returns a 404: the
      switch block was pasted to this branch at the old permalink, so the
      working page is switch-prescriptions.html while the pack, correctly
      and in line with all 15 packs and modules/switch/pages/INDEX.md, names
      switch-prescriptions-riddings-timperley.html. Hard stop added to Post B
      naming the 404 and the interim URL, with the canonical link left
      untouched so nothing needs undoing after the paste. Logged as Q31 and
      taken as an autonomous decision under the standing window. Two further
      live-only findings recorded rather than decided: the branch-specific
      Pharmacy First page is CONFIRMED LIVE and in the sitemap, so item 5.3
      can repoint this one of the eleven Post A links with no paste at all,
      and the live switch page carries a Download our app block although
      branches.json has hasApp false, which is a Weebly-native element on
      the old page and does not follow the paste across. Done 2026-08-10.
      Second quality pass 2026-08-11: pack verified clean again, fact by
      fact against branches.json and rule by rule against TEMPLATE.md, all
      29 checkers green and all six page generators byte-stable. Live
      recheck found no state change: Post B's canonical URL still returns
      a 404, the live switch page still sits at the old permalink and is
      still the pre-Phase-3 paste, Posts A, C and D still resolve, the
      replacement Pharmacy First page is still live and in the sitemap,
      homepage NAP correct, and the sitemap is still dated 2026-07-18
      throughout, so the site has not been republished since 18 July. One
      live-only observation recorded in the pack's paster notes: the
      site-wide footer line sets its day and time ranges with en dashes
      and exists in no repo branch, so it is a Weebly hand paste to retype
      in the queued session, not repo copy. No in-repo defect found, no
      question raised.
- [x] 4.14 Gordon Short Chemist Crosby pack. Done 2026-08-04. Split
      lunch-closure hours flagged for correct GBP entry.
      Quality pass 2026-08-10: the pack verified fact by fact against
      branches.json and rule by rule against TEMPLATE.md, and nothing in it
      is wrong. Address 159 College Road, Liverpool L23 3AT, phone
      0151 924 3449, website and review link all match; the hours line
      carries both sessions on all six trading days, Monday to Friday
      9:00am to 1:00pm and 2:00pm to 6:00pm and Saturday 9:00am to 1:00pm
      and 2:00pm to 5:00pm, which is exactly what the split-hours rule the
      4.10 pass added requires, and the Saturday 5:00pm finish is carried
      through to the photo shot list; catchment reads Crosby, Waterloo and
      Sefton in all three places, leading with its own seoTown; categories
      and services match the five-widget set exactly; the description is
      652 characters, exactly what its heading claims, and every post is
      well inside the 1,500 limit; Post A's seven conditions and the UTI
      16 to 64 range match the generated Pharmacy First page and match the
      wording used by all fifteen packs; Post C names no medicine and makes
      no efficacy claim; no em dash, no en dash, no emoji and no non-ASCII
      character anywhere in the file; hasApp is false and nothing in the
      pack mentions an app. check-gbp-packs.js passes with no failures.
      All four post links resolve, so unlike 4.12 and 4.13 there is no dead
      button here. The defects are on the far side of the pack. Both
      Pharmacy First pages are live at once: the old pharmacy-first-service
      -crosby.html that Post A points at, which is correct in content and
      hours but is absent from the branch sitemap, and the generated
      pharmacy-first-gordon-short-crosby.html, which is in the sitemap.
      The generated one is a pre-item-1.1 paste and calls the pharmacy
      "Gordon Shorts Chemist" in its H1, its title and its body, so
      repointing Post A to it today would send patients to a page using the
      wrong trading name. Hard stop added to the paster notes recording the
      confirmed-live state and holding the swap until the repaste. Logged
      as Q32 and taken as an autonomous decision under the standing window.
      The same stale-paste name appears in the live travel clinic page
      title, so this is a branch-wide paste-age problem and not one page;
      recorded against 1.1, which is correct in the repo and has simply
      never reached this branch's live pages. Done 2026-08-10.
      Second quality pass 2026-08-11: pack verified clean again, fact by
      fact against branches.json and rule by rule; description 652
      characters exactly, posts 449, 280, 521 and 424; all 29 checkers
      green and all six generators byte-stable. All four post links still
      resolve and Post A remains safe to post as written. The hard stop
      stands: the branch-specific Pharmacy First page is still the old
      "Gordon Shorts Chemist" paste and the sitemap shows nothing
      republished since 2026-07-19. New live-only observations, recorded
      in the pack's paster notes for the queued repaste: the switch page
      body renders a pre-5.1 em dash as mojibake, the weight loss and
      travel pages carry the stale name in body text not just titles, and
      the site-wide footer hand paste uses en dashes. No in-repo defect,
      no copy changed, no question raised.
- [x] 4.15 Tiffenbergs Chemist Aintree pack. Done 2026-08-04. Leads with
      Aintree per seoTown; lunch-closure hours flagged for GBP entry.
      Quality pass 2026-08-10: the pack verified fact by fact against
      branches.json and rule by rule against TEMPLATE.md, and nothing in it is
      wrong. Address 388 Longmoor Lane, Liverpool L9 9DB, phone 0151 525 3462,
      website and review link all match, and the live site agrees on every one
      of them. The hours line carries both weekday sessions, 9:00am to 1:00pm
      and 2:00pm to 6:00pm with Saturday and Sunday closed, which is what the
      split-hours rule the 4.10 pass added requires, and the lunch closure is
      carried through to the photo shot list. Catchment reads Aintree,
      Fazakerley and Liverpool in all three places, leading with its own
      seoTown; categories and services match the five-widget set exactly; the
      description is 650 characters, exactly what its heading claims, and the
      posts are 449, 329, 521 and 447 against a 1,500 limit; Post A's seven
      conditions and the UTI 16 to 64 range match the generated Pharmacy First
      page; Post C names no medicine and makes no efficacy claim; the file is
      pure ASCII; hasApp is false and nothing mentions an app. All four post
      links were fetched and all four load, the second pack running in a row
      with no dead button. The one checker warning, that the Post A link has no
      .html ending, was tested live and is not a defect: Weebly serves the
      extensionless URL and redirects to the .html page, and the link is the
      pfLink from branches.json, so the pack is right to mirror it.
      The defect this pass found is outside the pack and is estate-wide. The
      switch banner, which is pasted into Weebly's site-wide Header Code and so
      appears on every page of every branch site, wrote its close button as a
      literal multiplication sign. That field mangles non-ASCII characters, so
      the button renders as mojibake rather than a cross. Confirmed live at
      Tiffenbergs Aintree, Riddings Timperley and Smartts Bootle, on pages
      whose own footers render an en dash correctly, so the fault is the
      Header Code field and not the page. Fixed at source in
      tools/build-switch-pages.js by writing the symbol as the HTML entity
      &times;, which innerHTML resolves anyway, and by replacing the em dash in
      the banner's config comment with a hyphen. All 15 banners regenerated and
      are now pure ASCII; no page moved. check-em-dashes.js given an ASCII-only
      rule for the banners folder, which no checker had ever read, plus the
      usual missing-and-empty guard, negative-tested four ways. INDEX.md now
      carries the repaste instruction. Logged as Q33 and taken as an autonomous
      decision under the standing window. Done 2026-08-10.
      Quality pass 2026-08-11 (second re-verification): pack verified clean
      again, fact by fact against branches.json and rule by rule, file
      unchanged since before the first pass. All 29 checkers green, all
      seven generators byte-stable. All four post buttons resolve and read
      correctly, third clean run. New for item 5.3: the generated
      replacement pharmacy-first-tiffenbergs-aintree.html is confirmed
      live, in the branch sitemap, and reads correctly throughout, so the
      Tiffenbergs repoint needs no Weebly paste. Site not republished
      since 2026-07-19; the stale banner mojibake and footer en dashes
      recorded in the pack's paster notes for the queued repaste. One new
      question, Q56: the live pages publish tiffenbergs@rbhealth.co.uk
      while branches.json holds Tiffenberg@rbhealth.co.uk, so one spelling
      is wrong where a patient can see it. Evidence in
      audits/tiffenbergs-aintree-gbp-pack-check-2026-08-11.txt.

## Done
Completed items stay in place above, ticked [x] with the completion date
appended to the line. Do not move them; the status page reads them in place.
- [x] 1.3 Sweep all pages for the McCanns Sandringham postcode error
      (CH49 1SX appearing anywhere; correct is L17 4JP). Done 2026-08-04.
      Repo, repo history and live site all clean; correct L17 4JP throughout.
      Per Master Plan v2 and Build Pack v2 section 4.2 the CH49 1SX sits in
      the GBP management record, which this agent cannot reach - action note
      for Rishi or Dane logged in AGENT_LOG.md.
      Quality pass 2026-08-11: the postcode data verified clean and the
      checker holding this item hardened twice. CH49 1SX still appears in
      exactly four files, all of them the audit recording its own finding,
      and in no page, pack or paste block. All 16 live postcodes are present
      and correctly attributed, no file carries another branch's postcode,
      all six generators regenerated every page byte-identical, and all 19
      checkers pass. The defect was in check-postcodes.js. Its allowlist was
      whole-file, so ANY wrong postcode typed into any of the seven audit
      files passed rule 1 in silence, including status/index.html, the page
      a human reads to see where the audit has got to. The exemption now
      names the one value it excuses and fails when that value goes stale.
      Rule 2 was tightened at the same time: a branch postcode must now be
      USED on a page, in a pack or in a paste block, because declaring it in
      branches.json and narrating it in AGENT_LOG.md is not an address
      anybody can be sent to. Both new rules failed their first negative
      test by counting the file that merely declares a postcode as evidence
      it is used, which is the same under-reading fault in miniature; fixed
      before commit and re-tested. Six rules negative-tested, all fire.
      Done 2026-08-11.
- [x] 1.2 Verify Hirshmans address reads "56-62 Sherwood House, Station Road,
      Ainsdale" everywhere on the site. Done 2026-08-04. Repo and live site
      both verified correct; no changes needed. One cosmetic note logged
      (contact-us page left block splits "Station Road" across a line break
      and omits the postcode - hand edit on Weebly when convenient).
- [x] 1.1 Standardise brand-name spelling across all site data and pages
      (Fishlock vs Fishlocks, Coleman & Leigh vs Leighs, Gordon Short vs
      Shorts). Done 2026-08-04, commit 1ec8f7b. Canonical form fixed to
      "Gordon Short Chemist"; Fishlocks already consistent; Coleman & Leigh
      question logged for Rishi in AGENT_LOG.md.
      Live-side note 2026-08-10, from the 4.14 quality pass: this item is
      complete and correct in the repo, where a full-tree search finds no
      "Gordon Shorts" outside this log, but it has never reached the live
      Gordon Short pages. The generated Pharmacy First page carries "Gordon
      Shorts Chemist" in its H1, its title and its body, and the travel
      clinic page carries it in its title, because both were pasted before
      commit 1ec8f7b. The live switch page is correct, so this is paste age
      rather than a bad generator. Nothing to fix here; it is a repaste,
      and it is the same repaste Q32 and item 5.3 both wait on. The 4.12
      pass found the identical pattern at Coleman and Leighs, so at least
      two branches are publishing pre-1.1 names.
      Verified again 2026-08-11 and the rule is now held by the repo rather
      than by the sweep. Repo clean: no variant spelling in branches.json,
      the generated pages, the paste blocks, the drafts or the GBP packs.
      The only near misses are the two GBP packs that deliberately quote
      what the live Gordon Short and Coleman and Leighs pages say. New
      tools/check-brand-spelling.js pins the canonical names OUTSIDE
      branches.json, sweeps 209 files of public copy for near misses derived
      from the canonical form, and checks the hardcoded brand table in
      build-switch-pages.js. Tested by breaking it three ways; all three
      fail the run. Done 2026-08-11.

## Phase 5 - Work authorised by Rishi's answers
Not part of the original audit backlog. These are the four decisions Rishi
answered that carried real work, tracked here so the status page shows what is
actually outstanding rather than reporting the backlog as finished. Numbered
so tools/build-audit-status.js picks them up like any other item.
- [x] 5.1 Q7 em dashes in public switch page copy: rewrite both strings in
      the generator and regenerate the 15 switch pages. Done 2026-08-09.
      Both sentences split at a full stop rather than hyphenated; the meta
      description now comes from one switchMeta() helper so the page tag and
      the paste sheet cannot drift; new tools/check-em-dashes.js guards it.
      OUTSTANDING on the live side: the whole switch block for those 15 pages
      needs repasting, not only the SEO field. Corrected on the 5.1 quality
      pass, 2026-08-10, after reading the Cherry Lane switch page live: the
      body still renders "it usually is not - we make the first step quick and
      easy" with an em dash, so the pre-Q7 paste is what a patient reads, not
      only what Google shows. Repaste the page body from
      modules/switch/pages/ and the SEO description from
      modules/switch/pages/SEO.md in the same session.
      Quality pass 2026-08-11: the repo half verified clean and byte-stable
      again. The pass then found the Q7 breach still live somewhere no rule
      had ever looked. modules/service/service.js writes three sentences into
      the page with innerHTML at run time and all three carried &mdash;: the
      green self-refer banner, the explainer video card and the "Prefer to
      walk in?" card, all three on the 14 Pharmacy First overview pages, one
      per branch. Every dash rule in this repo read a file format, .html, .md
      or .txt, and copy a browser assembles from a .js string at run time
      matched none of them. All three rewritten at
      source the way Q7 settled, split at a full stop, and check-em-dashes.js
      now reads the live module code under modules/ and core/ with comments
      blanked. OUTSTANDING on the live side: 156 generated pages load
      service.js from the service-module-phase1 pin, so the three sentences
      stay live until item 5.5 fast-forwards that branch.
- [x] 5.2 Q11 build branch landing pages for McCanns Aigburth, McCanns
      Sandringham, Scorah Bramhall and Scorah Hazel Grove by adding them to
      the BUILD list in tools/build-branch-landing-pages.js, same pattern as
      the Fishlocks pair from item 2.2. Done 2026-08-09. Four pages generated,
      the two Fishlocks pages regenerated byte-identical, and the four standing
      LANDING_NOT_BUILT warnings in check-page-coverage are cleared (177 pages,
      0 warnings). One real defect found and fixed while building: the meta
      description ran over 165 characters for both Scorah branches and was
      composed twice by hand, so it now comes from one length-aware
      landingMeta() helper used by the page tag and both paste sheets.
      OUTSTANDING on the live side: nothing is live until the four pages are
      pasted to Weebly, and each branch's service pages must be pasted first
      or in the same session, or the landing page links will 404. See
      modules/branch/pages/INDEX.md and SEO.md.
      Quality pass 2026-08-10: all six landing pages verified against the
      Build Pack v2 spec, branches.json and the six service tiles they link
      to. Every internal link resolves to a page this repo generates, all six
      branches genuinely hold all six services, every title and description
      fits the SERP rule, and no page carries a non-ASCII character. One real
      defect found and fixed at source: McCanns Sandringham's serviceAreaList
      still led with Aigburth after item 5.7 moved its local word to
      St Michael's, so the landing page led with the sister branch's own
      target town in its meta description, its hero sentence, its FAQ delivery
      answer and its areaServed schema. St Michael's now leads the list. Taken
      as an autonomous decision under the standing window and recorded as Q23
      for review.
      Quality pass 2026-08-11: repo half clean and byte-stable, all 28
      checkers green, sister links reciprocal in all three pairs, Sandringham
      still leads St Michael's, all six pages pure ASCII. Live half re-read:
      all six landing URLs still 404, unchanged since 2026-08-10, but all
      thirty service pages they link to now return 200 across the three
      domains, so the paste prerequisite is met for every pair and the six
      pages can be pasted in any order with no 404 risk. INDEX.md live-state
      note refreshed at source in the generator. Evidence:
      audits/landing-live-check-2026-08-11.txt.
- [ ] [BLOCKED] 5.3 Q8 repoint the 11 Post A Pharmacy First links in the GBP
      packs, and paste those pages to Weebly in the same run. Blocked because
      Rishi's answer deliberately ties the repo change to the Weebly paste,
      which an unattended run cannot do. Needs a supervised session. New
      evidence 2026-08-10, from the 4.12 quality pass: Q8 described the old
      pages as being of unknown state. One is now confirmed dead. The
      Coleman and Leighs pfLink returns a 404, while the Scorah shared page
      was fetched in the same pass and is live and correct. So the eleven
      are not one problem in one state, and at least one branch cannot post
      Post A at all until this item runs. Worth pulling forward.
      Further evidence 2026-08-11, from the 3.7 quality pass, and it adds a
      second job to the same Weebly visit. The Smartts pfLink target,
      pharmacy-first-service-bootle.html, is live but states its opening
      hours as "Monday 9:00am - 6:00pm" in the hours block and "Open Mon-Fri
      9am-6pm" in the footer strip, omitting the 1pm to 2pm lunch closure
      branches.json records from the NHS pharmacy profile, confirmed
      2026-06-24. Tiffenbergs' equivalent page, read in the same pass, states
      "(closed 1-2pm)" correctly in both places, so this is a per-page hand
      written error rather than a shared module fault. It is the same locked
      door defect the 3.7 pass first found on the Smartts weight loss page
      under Q16, now confirmed on a second Smartts page - and this is the
      page eleven GBP profiles are about to be pointed at. No question is
      raised because there is no decision to take: the correct hours are in
      branches.json. Fix the hours while in Weebly repointing the link. Also
      cosmetic on the same page, the footer strip writes the email as
      Smartts@rbhealth.co.uk while the address block above it writes
      smartts@rbhealth.co.uk. Not worth a separate visit, worth one edit
      while the page is open. Neither is fixable in this repo: the page is
      live-only Weebly that no generator owns.
      Further evidence 2026-08-10, from the 4.13 quality pass, and it cuts
      the other way: Riddings Timperley's replacement page is already live
      at pharmacy-first-riddings-timperley.html and sits in the branch's own
      sitemap. So this branch's half of the item is a one-line repo change
      with no Weebly paste attached at all, which is the condition Rishi's
      answer tied the work to. Three of the eleven are now known: one dead,
      one shared and live, one already replaced. The item is being held as a
      block of eleven when it is really eleven separate states, and the ones
      needing no paste could be done unattended if the item were split.
      A fourth state 2026-08-10, from the 4.14 quality pass, and it is the
      awkward one: at Gordon Short Crosby both pages are live at the same
      time. The old pharmacy-first-service-crosby.html that Post A points at
      works and reads correctly but is not in the branch sitemap, and the
      generated pharmacy-first-gordon-short-crosby.html is in the sitemap
      but is a pre-item-1.1 paste that calls the pharmacy "Gordon Shorts
      Chemist" throughout. So this branch needs a repaste before its repoint,
      not instead of one, and the repoint is not free here the way it is at
      Riddings. Four of the eleven are now known and no two are alike: one
      dead, one shared and live, one already replaced, one duplicated with a
      stale replacement. Any split of this item needs to check the target
      page reads correctly, not only that it resolves.
      A fifth state 2026-08-10, from the 4.11 quality pass, and it is the
      one that argues hardest for pulling the item forward: at SK Chemists
      Bootle the current Post A target loads but is absent from the branch
      sitemap and misspells the town in its own heading, reading "Pharmacy
      First Service in Bottle, Liverpool", while the generated replacement
      pharmacy-first-sk-chemists-bootle.html is confirmed live, is in the
      sitemap, spells Bootle correctly and carries the correct trading name.
      So the repoint here is free in the Riddings sense, needs no paste, and
      unlike Riddings it also stops the branch pointing Google at a page
      that misspells the word it is trying to rank for. Five of the eleven
      are now known and still no two are alike. Two of the five, Riddings
      and SK, need no Weebly paste at all, which is the condition Rishi's
      Q8 answer tied the work to. Whether to split the item on that line is
      asked as Q34.
      A sixth and a seventh state 2026-08-11, from the 4.7 quality pass, and
      both are free. The two McCanns branches share one pfLink, the old
      pharmacy-first-service-aigburth.html, so the pair sit together inside
      the eleven. The mccannspharmacy.co.uk sitemap was read and it lists
      BOTH generated replacements as live,
      pharmacy-first-mccanns-sandringham.html and
      pharmacy-first-mccanns-aigburth.html. The Sandringham one was then
      fetched and read in full rather than assumed, which is what the 4.14
      pass taught: it carries the correct trading name McCanns Chemist in its
      title, heading and body, the correct address and phone, and the same
      seven conditions and age ranges as the pack, so it does not repeat the
      Gordon Short trap of a replacement that resolves but reads wrong. Its
      one staleness is that it was pasted on 18 July and still uses the local
      word Sandringham rather than the St Michael's that item 5.7 moved the
      branch to on 2026-08-10. That is a word behind rather than wrong, since
      the shop is still named Sandringham, and it is the same three-week
      paste age the Fishlocks pass found. So four of the eleven, Riddings, SK
      and both McCanns, now need no Weebly paste at all, which is more than a
      third of the item and strengthens the case Q34 puts for splitting it.
      An eighth state 2026-08-11, from the 4.12 second quality pass, and it
      moves Coleman and Leighs from the dead column into the Gordon Short
      column. The generated replacement
      pharmacy-first-coleman-leigh-walton.html is now CONFIRMED LIVE, in
      the site navigation and in the branch's own sitemap, while the old
      pfLink target still returns a 404. But the live copy was fetched and
      read rather than assumed, as the 4.14 pass taught, and it is a
      pre-item-1.1 paste: it reads "Coleman & Leigh" 21 times in title and
      body where the repo page carries the confirmed "Coleman and Leighs"
      throughout. So this branch needs a repaste before its repoint, the
      Gordon Short shape, not the free Riddings shape. Five of the eleven
      states have now changed at least once since Q8 was asked, which is
      itself evidence for Q34: the item's facts move faster than the block
      of eleven does.
      A ninth state 2026-08-11, from the 4.15 second quality pass, and it
      is free. At Tiffenbergs Aintree the generated replacement
      pharmacy-first-tiffenbergs-aintree.html is CONFIRMED LIVE, sits in
      the branch's own sitemap, and was read in full rather than assumed:
      correct trading name throughout, correct NAP, correct seven
      conditions and age ranges, correct split hours. Its one staleness is
      a pre-Q7 em dash in the self-referral line from the 2026-07-19
      paste, a style breach the committed source fix removes at the next
      repaste, not a wrong fact. So the Tiffenbergs repoint needs no
      Weebly paste. That makes five of the eleven free (Riddings, SK,
      both McCanns, Tiffenbergs), nearly half the item, and strengthens
      the Q34 case for splitting it further. The old target,
      pharmacy-first-service-aintree.html, still loads and reads
      correctly but remains absent from the branch sitemap, the SK shape
      without the misspelling.
- [ ] [BLOCKED] 5.4 Q9 add a signpost paragraph and a button to the new
      Pharmacy First page at the top of the old Cherry Lane Pharmacy First
      page, keeping the existing video and booking widget underneath.
      Blocked because it is a hand edit in the Weebly editor. The bridge
      block at modules/service/weebly-paste/cherry-lane-old-pharmacy-first-
      replacement.html must not be pasted as it stands.
- [ ] [BLOCKED] 5.5 Q13 fast-forward service-module-phase1 to main so the 318
      live page references stop serving code this repo no longer says, and
      re-pin the 15 switch pages to a current commit at the next Weebly paste
      run, which is what stops live switch requests landing in Rishi's own
      inbox instead of the helpdesk. Answered by Rishi 2026-08-10. Blocked
      because both halves are outside an unattended run's authorisation:
      the fast-forward means pushing a branch other than agents/audit-backlog,
      and the re-pin only reaches live through a Weebly paste. Needs a
      supervised session, and sooner rather than later: service.css and
      service.js are still byte-identical between the branch and main, which
      is the only reason the fast-forward is free.
      Raised in priority 2026-08-11 by the item 5.1 quality pass. This is no
      longer only tidiness. service.js on the pinned branch is the copy that
      puts three em dashes on the 14 live Pharmacy First overview pages,
      against the house rule Q7 settled on 2026-08-09. The fix is committed on
      agents/audit-backlog and reaches a patient only when that work is on
      main and service-module-phase1 is fast-forwarded to it. service.js and
      service.css are still byte-identical across phase1 and main today,
      re-checked on 2026-08-11, so the fast-forward itself is still free.
- [x] 5.6 Q14 shorten the one over-length page title in the estate: the
      Coleman and Leighs infected insect bite title ran to 70 characters
      against Google's 65, so the brand was the part being truncated away.
      Rishi's answer was to drop "Pharmacy" from the title suffix rather than
      shorten the NHS condition wording. Done 2026-08-10. Implemented in
      tools/seo-pattern.js as a length-aware rule, not a hand edit, so a
      regeneration cannot undo it: a composed title over 65 characters is
      retried once with " Pharmacy" dropped from the end of the brand. It
      fires only on an overrun and only where the brand ends in that word,
      so the one title went 70 to 61 characters and all 176 other pages
      regenerated byte-identical. H1s, JSON-LD names, data-branch and every
      visible line of copy keep the full trading name Q1 settled. The KNOWN
      entry is gone from tools/check-seo-lengths.js, which now reports clean
      with no exceptions, and the pattern self-test passes with no length
      warnings for the first time.
      OUTSTANDING on the live side: the Weebly SEO title field for that one
      page needs repasting from modules/service/pages/SEO.md, or the live
      Google result keeps the truncated title.
      Quality pass 2026-08-10: the Q14 rule verified end to end and found
      sound. The title is 61 characters in the page, the paste sheet and the
      index, the 70-character version is gone from every file in the repo,
      the H1, the JSON-LD name, data-branch and every visible line of copy
      still carry the full trading name, and a full regeneration of all six
      generators moved no page. One real defect found and fixed in the
      tooling: the pattern self-test hardcoded "Infected insect bite
      treatment" as the longest condition, so adding a longer condition to
      build-service-pages.js would have left the worst-case sample testing a
      phrase that was no longer the worst case, which is the same
      under-sampling fault the item 3.1 pass had to fix once already. The
      self-test now derives the longest condition by reading the generator as
      data under test and fails if it declares none. Negative-tested three
      ways. A second finding, that the shortening rule can only rescue three
      of the fourteen trading brands and the estate is one character from the
      wall on two titles, is raised as Q24 and blocks nothing.
      Quality pass 2026-08-11: repo half verified clean end to end a second
      time. All 29 checkers green, all six generators reproduced every page
      byte-identical, the 61-character title stands in the page, the paste
      sheet and the index, the H1 and every visible line keep the full
      trading name, KNOWN in check-seo-lengths.js is still empty, and the
      self-test still derives the longest condition from
      build-service-pages.js. Live half checked by one plain GET: the page
      is 200 but its live title reads "Coleman & Leigh Pharmacy" (ampersand,
      singular Leigh, 68 characters), which matches no version the repo
      ever shipped - the Weebly SEO title on this page was hand-typed, not
      pasted. The already-outstanding repaste from SEO.md fixes length and
      brand spelling in one action, so no new question. Evidence:
      audits/insect-bite-title-live-check-2026-08-11.txt.
- [x] 5.7 Q15 move the McCanns Sandringham local word from "Sandringham" to
      "St Michael's". Sandringham is the only seoTown in the estate that is
      not a place in its own branch's serviceAreaList, so 12 pages aim at a
      word the rest of the branch's own data does not treat as local. Set
      seoTown to St Michael's in branches.json, hold townSlug at sandringham
      on purpose so no live URL breaks and no redirects are needed, then
      regenerate the 12 pages and add the branch to KNOWN_SEO_TOWN in
      tools/check-address-region.js, because that checker expects townSlug to
      be the slug of seoTown. Answered by Rishi 2026-08-10; repo-only work,
      so an unattended run can do it. The 12 pages then need a Weebly repaste.
      Done 2026-08-10. seoTown set to "St Michael's", townSlug held at
      "sandringham", 13 pages regenerated (the 12 the branch owns plus the
      sister cross-link line on the Aigburth landing page). No permalink
      moved, so no live URL breaks. KNOWN_SEO_TOWN in check-address-region.js
      was rekeyed to "<branch id>::<rule>" and now carries the deliberate
      townSlug hold instead of the old mismatch, so the stale-key guard still
      bites. All 17 checkers clean. One real defect found and fixed while
      doing it: the switch page did not move, because
      tools/build-switch-pages.js keeps its own hardcoded copy of brand,
      town, townSlug and site for all 15 branches rather than reading
      branches.json. Raised as Q19.
      OUTSTANDING on the live side: the Weebly SEO title, description and
      keyword fields for the 13 pages need repasting from
      modules/service/pages/SEO.md, modules/switch/pages/SEO.md and
      modules/branch/pages/SEO.md, or the live listings keep the old word.
      Quality pass 2026-08-10: the repo half of 5.7 verified clean end to
      end. Every page the branch owns leads with St Michael's in its title,
      description, H1, meta keywords, hero sentence and areaServed schema;
      no permalink moved; the apostrophe is a plain ASCII one in all 13
      pages and every paste sheet, so nothing needs escaping; the sister
      cross-link on the Aigburth landing page names St Michael's; and the
      hardcoded town in build-switch-pages.js was updated with it, which is
      the duplication Q19 already covers. One real defect found outside the
      generated pages and fixed at source: the branch's GBP content pack
      still told the paster to lead the Google profile with "Aigburth,
      St Michael's, Lark Lane and Dingle" in three places, because the pack
      was drafted on 2026-08-04 from the old catchment order and no checker
      read a pack against its own seoTown. Aigburth is the sister branch's
      target town on the same road, so the profile would have claimed one
      town while every page claimed another. Pack reordered, paster note
      added, and check-gbp-packs.js given a catchment-order rule with the
      usual anti-rot exception list, negative-tested three ways. All 14
      other packs already complied and none moved. Logged as Q25, taken as
      an autonomous decision under the standing window.
      Quality pass 2026-08-11: repo half verified clean again end to end,
      29 checkers green and all six generators byte-identical. Live half
      read by plain GET: the branch landing page still 404s (waits on the
      queued paste run) and all nine content pages return 200 with titles
      and H1s still leading with Sandringham, so the recorded repaste
      stands. New observation: every live title on mccannspharmacy.co.uk
      carries a trailing " - MCCANNS PHARMACY". Cross-domain comparison
      shows this is Weebly's default title, built as page name plus site
      title, served only where the SEO title field was never pasted:
      Fishlocks Ainsdale, which was pasted, serves its SEO.md title
      verbatim with no suffix, while Scorah Bramhall shows the same
      default construction as McCanns. So the queued repaste fixes the
      old word, the over-length titles and the suffix in one action and
      no new decision is needed. It also reframes the 2026-08-11 Coleman
      and Leighs finding: that live title is plausibly the same default
      construction rather than a hand-typed SEO field; the recorded fix
      is unchanged. Evidence:
      audits/sandringham-town-live-check-2026-08-11.txt.
- [ ] [BLOCKED] 5.8 Q16 weight loss advertising exposure: fix the five live
      weight loss pages and the estate-wide homepage claim. Rishi's answer to
      Q16 was an instruction to verify the finding against
      AI\RBH_WeightLoss_Advertising_Standards.md rather than a choice of fix.
      Verified 2026-08-10 and written up in
      compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md: the finding holds, on
      firmer grounds than Q16 stated, and it is wider. The breaches on the five
      inner pages are the superlative Mounjaro claim, the Real Results heading,
      the outcome slider, the lead price and the treatment picker, NOT the fact
      that the medicines are named, which an inner page may do in a balanced
      overview. The homepage line "Innovative solutions that deliver results.
      Tried the rest? Now try the best." was found on every homepage read,
      including a branch with no old page, so it is a shared template across
      the estate and it sits in the stricter advertising regime. Blocked on the
      choice of fix and order, re-asked as Q22, and on Weebly access in any
      case: all of it is live-only copy no generator owns. The one repo-side
      part, the "Support that delivers results" tile on the Smartts switch
      page, stays in KNOWN_CLAIM in tools/check-service-links.js until the
      decision lands.

## Phase 6 - Findings from the 2026-08-11 Ahrefs sweep

- [ ] [BLOCKED] 6.1 Q52 Sitemap duplication: Ahrefs Site Audit flags "Page in multiple
      sitemaps" as a new issue on at least 8 of the 16 projects, all newly
      appearing since the estate-wide page regeneration. Find the shared
      root cause in the sitemap generator (likely tools/build-sitemap.js or
      equivalent, check for a page being emitted into both a branch sitemap
      and a shared/index sitemap) and fix at source, then regenerate and
      spot-check 2 to 3 of the affected sites' live sitemap.xml. Not a
      ranking risk on its own but worth clearing before it masks a real
      issue in a future audit.
- [x] 6.2 Broken internal links: "Page has links to broken page" is the Done 2026-08-11
      single most common top issue across nearly every branch site in Site
      Audit. Run a full estate-wide broken-internal-link sweep (Site Audit
      internal pages report per project, or a repo-side crawl if faster),
      list every broken target found, and fix the ones that are
      generator-owned (dead cross-links, stale switch-page targets, moved
      permalinks). Log any live-only fixes needed as a question, same as
      5.8.
- [x] 6.3 Opening hours vs branches.json, shared-domain and multi-branch
      sites: Smartts' live site (homepage sidebar and footer) reads Mon-Fri
      9am-6pm against branches.json's NHS-sourced 09:00-13:00 and
      14:00-18:00 (confirmed 2026-06-24); Riddings was checked as a control
      and is correct. Check the remaining branches not yet verified against
      the live site, starting with Coleman & Leigh, Gordon Shorts and
      Tiffenbergs, then the rest of the 14. Log a question per branch with a
      mismatch rather than fixing silently, since the fix is live-only copy.
      Done 2026-08-11

## Questions for Rishi
(See AGENT_LOG.md for the running list.)
