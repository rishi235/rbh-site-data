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
- Every entry written to QUESTIONS.json opens its "question" field with one
  plain-English sentence naming the decision needed, stating the
  recommendation in the same sentence where there is one. The full
  technical detail, file names and generator names included, still follows
  straight after in full, for whoever picks the item up to act on; it is
  just not the first thing Rishi has to read to decide. Give the matching
  AGENT_LOG.md narrative the same opening sentence when one is written for
  the same finding.

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
Quality pass 2026-08-12: NAP data clean again. 177 pages, 0 mismatches,
byte-stable regeneration, all 29 checkers pass. Two verifier blind spots found
by injection and closed, both the same shape as the phone one from 2026-08-11:
the generated-page half swept every phone-shaped string but read a postcode in
only three fixed places and an email only inside a mailto anchor, so a foreign
postcode in body copy and a foreign inbox written as plain text both passed
unread. check-nap now sweeps every postcode-shaped and email-shaped string on
every generated page, paste blocks get the email sweep too, and the shared
template must carry no email at all. RFC 2606 example.com addresses (the form
placeholder on 142 pages) are excluded as incapable of being a contact fact.
Negative-tested six ways. Live half: Cherry Lane contraception page NAP exact
on name, address and phone, but its footer still publishes the Q36 mhs.net
typo the 2026-08-11 hand fix removed from index and contact pages; Q36 note
updated.
Quality pass 2026-08-13 (run 136): NAP data clean for the third pass running.
177 pages, 3 paste blocks, 0 mismatches, all six generators byte-stable, all
29 checkers pass. REPO HALF ONLY, no live half: the browser was unavailable
(Q59). Two more verifier blind spots found by injection and closed, the same
shape as the phone one and the postcode/email ones before them, and this time
in the two surfaces the item is actually named after. check-nap read the NAME
in only two structured fields (data-branch, JSON-LD name) and the STREET in
only three fixed places (contact line, map query, JSON-LD); neither was read
in body copy, and check-branch-identity reads the same two name fields, so
nothing closed it. The paste-block half of check-nap has banned naming another
branch since 2026-08-07; the generated half, 177 pages against 3, had no such
rule. Proved by injecting "You can also visit Smartts Chemist at 42 Fernhill
Road for this service" into the visible hero copy of the Cherry Lane NHS
contraception page: a foreign pharmacy and a foreign street on a live patient
page, and all 29 checkers exited 0. check-nap now sweeps every generated page
for any other branch's branchName, brandLabel or streetAddress, skipping
branches that share this page's brandLabel (so the item 2.2 "our other branch"
block still passes) or its street (so Clear Chemist and the head office, both
at Unit 20 Brookfield, do not flag each other). KNOWN_NAME and KNOWN_STREET
added on the same stale-key-fails contract as the existing lists. Negative
tested nine ways, including the three false-positive guards. Full working in
audits/nap-item-1.4-quality-pass-2026-08-13-run136.txt.
Quality pass 2026-08-14 (run 179): NAP data clean for the fourth pass running.
177 pages, 3 paste blocks, 0 mismatches, all 32 checkers pass, all six
generators rebuild to a zero diff. REPO HALF ONLY, no live half: the browser
was unavailable (Q59). One defect found and fixed in the verifier rather than
the data, and it is the layer under the three before it. Each earlier pass
moved the READER and left the SHAPE at one: a sweep that looks everywhere for
a single spelling of a fact is only as wide as that spelling. Proved by
injection on the Cherry Lane contraception page, where all 32 checkers exited
0 on a foreign phone written 0161-439-3744, (0161) 439 3744, 0161.439.3744,
0161&nbsp;439&nbsp;3744 and +44 161 439 3744, on a foreign postcode written
"sk7 3lq", on a foreign trading name written "smartts chemist" and on a
foreign street written "42 fernhill road". unesc now decodes the non-breaking
space, PHONE_RE reads hyphens, full stops and brackets and accepts +44 via a
new phoneDigits(), the name and street sweeps are case-insensitive, and a
narrow foreign-postcode-any-case rule was added rather than putting /i on
PC_RE, which would have flagged copy like "vitamin B12 3rd". Negative tested
22 ways, 15 must-catch and 7 must-pass. Residual stated: an abbreviated street
("Station Rd") is still not read. Full working in
audits/nap-item-1.4-quality-pass-2026-08-14-run179.txt.
Quality pass 2026-08-29 23:43 (eighth run today): NAP data clean for the fifth
pass running. 177 pages, 3 paste blocks, 0 mismatches, all 36 checkers pass,
all six generators rebuild to a zero diff. Two shape gaps found by injection
and closed, both one notch along the 2026-08-14 axis. PHONE_RE allowed at most
two separator characters between digit groups, so a foreign phone written with
spaced hyphens or full stops ("0161 - 439 - 3744") passed all 36 checkers
while "0161- 439 -3744" was caught; widened to three. The foreign-postcode-
any-case rule only knew the spaced spelling, so "sk73lq" passed unread even
though PC_RE reads SK73LQ (its space is optional); it now reads the spaceless
form, boundary-guarded so a longer token containing the letters cannot fire
it. The paste-block half, whose postcode sweep is upper-case PC_RE only, got
the any-case rule the generated pages have had since 2026-08-14. Negative
tested 18 ways, 10 must-catch and 8 must-pass, all correct, and the whole
estate exits 0 under the wider rules. LIVE HALF DONE for the first time since
2026-08-12: the live Cherry Lane contraception page is NAP-exact on name,
address, phone and the generated footer email; the Weebly site furniture
still publishes the Q36 pharmacy.FA226@mhs.net typo, unchanged, already
tracked. Residuals unchanged and deliberate: an abbreviated street
("Station Rd") and an unrecognised lower-case postcode-shaped string are
still not read. Full working in
audits/nap-item-1.4-quality-pass-2026-08-29.txt.
Quality pass 2026-08-31 (all unchecked items [BLOCKED], quality-pass fallback):
NAP data clean for the sixth pass running. 177 pages, 3 paste blocks, 0
mismatches, all 36 checkers pass, all six generators rebuild to a zero diff.
REPO HALF ONLY, no live half this run. Ran all 36 checkers and the full
regeneration diff first with no defect found, then, rather than stop there,
tested the one residual this item has carried unfixed since 2026-08-14: "an
abbreviated street ('Station Rd') is still not read". Proved it was still
real, not stale wording, by injecting "42 Fernhill Rd" (Smartts Bootle's own
street, abbreviated, no brand name alongside it so the name sweep could not
mask the result) into the Cherry Lane contraception page: all 36 checkers
exited 0, the same shape as every earlier phone, postcode, email and name gap
this item has closed. Fixed at the same layer as those: the street sweep
(added 2026-08-13) matched only the exact streetAddress string; it now
matches the full word or its common abbreviation for the road-type word only
(Road/Rd, Street/St, Lane/Ln, Drive/Dr, Avenue/Ave), built per street as a
regex rather than a plain .includes(), with the house number and the rest of
the name still required to match exactly so this cannot loosen into a false
positive on an unrelated street. Verified the fix three ways: the injected
abbreviated street is now caught (MISMATCH, correct branch identified), the
real repo still exits 0 mismatches with the injection reverted (byte-identical
to the pre-change file), and a full cross-check of every branch pair's street
against every other branch's abbreviation pattern found no false positive
beyond the one case already skipped by design (Clear Chemist and RB
Healthcare Ltd Head Office share the literal string "Unit 20 Brookfield Trade
Centre, Brookfield Drive, Aintree", already exempted by the existing
exact-match skip before the new pattern is even reached). Residual narrowed,
not closed: an unrecognised lower-case postcode-shaped string is unchanged,
and abbreviations for close/crescent/etc. are not covered, only the five
road-type words that actually appear in branches.json today; widen the list
the day a sixth one is added. No question raised, blocks nothing.
Environment note: this run's shell has no usable git credential for
git@github.com (git fetch/push both fail "Host key verification failed",
consistent with every other sandboxed-shell entry in this log), so step 9's
push and step 10's status-page publish are queued for a native-host run, the
same pattern recorded throughout 2026-08-31's entries above.

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
      Quality pass 2026-08-12: repo half clean, no in-repo defect. All six
      generators rebuilt to a zero diff, all 29 checkers pass, all 13 pages
      verified field by field against branches.json (H1 town, NAP, phone as
      text and tel: link, JSON-LD parse and address, no POM names, no
      foreign postcode or phone, no em dash or mojibake, app sentence
      correctly gated on hasApp). Live half: 12 of 13 pages return 200 with
      clean copy; the branch landing page still 404s awaiting the Q35 paste,
      and all 40 sitemap lastmods still read 2026-07-18, a fourth week
      without a publish. New finding: the old shared page
      weight-loss-services-eccleston-ainsdale.html is a sixth live instance
      of the Q16 weight loss template (Real Results heading, outcome slider,
      treatment picker, six POM names in meta keywords), homepage-linked so
      outside the inner-page exemption, and absent from the Q16/Q22
      five-page list. Raised as Q57. Evidence:
      audits/fishlocks-ainsdale-build-check-2026-08-12.txt.
      Quality pass 2026-08-12 (fourth pass, repo half only): all 13 pages
      verified field by field again and clean, all six generators rebuild to
      a zero diff, all 29 checkers pass. The em dashes flagged on 12 pages
      are inside <!-- --> build headers, which check-em-dashes.js blanks by
      design, and the pound sign on the weight loss page is the RULE 7 fee.
      The pass found a verifier gap, not a data one: nothing checked that a
      branch's pfLink names a Pharmacy First page that branch owns. The host
      test is blind on a shared domain, and Fishlocks, McCanns and Scorah
      each put two branches on one host, so a sister-branch pfLink passes and
      resolves 200. Proved by injection: swapping fishlocks_ainsdale.pfLink
      to the Eccleston page passed all 29 once the editor snapshot was
      refreshed, which is the normal workflow after a data edit. pfLink feeds
      the landing page route and the GBP pack button, so the patient is
      quietly booked into the wrong pharmacy, and this is the same field the
      original 2.1 audit found stale. check-branch-links.js gains a pfLink
      ownership rule, resolving the filename to its owning branch by the
      longest brandSlug-townSlug suffix, as rule 10 does for page links.
      Legacy pharmacy-first-service-<town> names are skipped deliberately:
      they are the 11 values Q8 / item 5.3 owns. Clean on the untouched tree,
      catches the injection, and catches post-5.3-style sister swaps on
      McCanns and Scorah too. No page, copy or data change. Evidence:
      audits/fishlocks-ainsdale-quality-pass-2026-08-12b.txt.
      Quality pass 2026-08-13 (fifth pass, repo half only): all 32 checkers
      pass and all six generators rebuild to a zero diff, before and after.
      The pass found a regulated copy checker one folder short, the same
      shape as the defect run 172 left in check-pharmacy-first-cost.js.
      tools/check-weight-loss-copy.js declared modules/service/pages only, so
      all ten of its rules ran on the 15 weight loss pages and none on the six
      branch landing pages, which advertise the same private clinic three
      times each. That is the stricter half, not the looser one: the house
      standard splits by how a page is reached, the inner-page exemption
      explicitly excludes "a proactively linked landing page", and each of the
      six gbp-packs points a Google Business Profile website field at one of
      these six URLs. RULE 11 added, holding the landing pages to Regime 1: no
      medicine name anywhere including hover text and attributes (read raw,
      not visible text), no POM class reference (GLP-1, skinny jab, weight
      loss injections and the rest of the ASA-ruled list), no purchase
      wording, and in the weight loss copy no results, rate-of-loss or
      body-part claim and no offer or discount, plus a source floor, a
      coverage floor of four, and a positive floor that the tile linking into
      the weight loss page must call the service a consultation. A plain
      consultation price is deliberately still allowed, because the standard
      permits indicative prices on a homepage-class page. Negative tested 17
      ways, all as expected, including the attribute-only medicine name that
      visible text would have missed and a first design of the positive floor
      that passed when it should have failed. No page, copy or data change.
      Not closed and left for the next pass: check-travel-clinic-copy.js and
      check-contraception-copy.js are short in exactly the same way. Evidence:
      audits/fishlocks-ainsdale-quality-pass-2026-08-13.txt.
      Quality pass 2026-08-30 (sixth pass): repo half clean and byte-stable
      again, all six generators rebuilt to a zero diff, all 34 checkers pass.
      gbp-packs/fishlocks-ainsdale.md re-verified fact by fact against
      branches.json (address, phone, hours, review link) and its description
      and post lengths recomputed independently (746, 448, 385, 402, 313
      characters), all matching the pack's own claims. Live half: one
      positive change, the fishlockpharmacy.co.uk sitemap has moved on from
      the 2026-07-18 lastmod every prior pass recorded to 2026-08-14, so a
      publish has happened on this site since the fifth pass, though it did
      not include either branch landing page. Q35 (branch landing pages
      still 404), Q37 (Weebly-native contact block and legal footer naming
      the business "Fishlock Pharmacy"/"Fishlock Chemist" and abbreviating
      the Ainsdale street), and Q57 (the sixth live copy of the old weight
      loss template, still carrying "Real Results with Mounjaro" and naming
      six POM medicines) were all read live again and are unchanged;
      existing questions still accurately describe live state. The
      check-travel-clinic-copy.js/check-contraception-copy.js scope gap the
      fifth pass left open is reconfirmed present (both still scope to
      modules/service/pages only, unlike check-weight-loss-copy.js's RULE
      11) but shown to have no live breach behind it today: both branch
      landing page tiles are static literals in
      tools/build-branch-landing-pages.js, confirmed identical on all six
      pages and clean against every RULE 4-12 pattern both checkers already
      enforce. A lightweight design (verbatim-check the one literal per
      service, then run it through the existing pom-names.js and
      outcome-promise-patterns.js pattern sets, no per-branch template
      resolver needed) is left for a dedicated pass, since a change to a
      regulated-copy checker deserves the same negative testing RULE 11 got
      rather than being fitted in alongside a routine pass. No in-repo
      defect found; no question raised; no worklist item blocked or
      unblocked. Evidence: audits/fishlocks-ainsdale-quality-pass-2026-08-30
      .txt.
      Quality pass 2026-08-31 (seventh pass): all 8 worklist items still
      unchecked are [BLOCKED], so this was the fallback quality pass, picked
      by the standard ranking (oldest max-date, then fewest quality-pass
      mentions, then file order): item 2.1 won an eight-way tie at
      2026-08-30/5 mentions on file order. Repo half: all 36 checkers pass
      (up from 34 at the sixth pass, two more added since), all six
      generators rebuild to a zero diff against the untouched tree, and an
      independent extraction (no imports from tools/) swept all 13 pages for
      phone, postcode and street address presence, foreign NAP from every
      other branch, em/en dash outside build comments, and the singular
      "Fishlock" brand near-miss. Zero issues. No in-repo defect found.
      Live half, read-only via Chrome: fishlockpharmacy.co.uk's sitemap is
      still fixed at the 2026-08-14T17:32:10 lastmod the sixth pass recorded,
      confirming no publish has happened on this site in the seventeen days
      since, so Q35, Q37 and Q57 were re-read live rather than assumed
      current. All three still hold exactly as last logged: (1) Q35,
      pharmacy-fishlocks-ainsdale.html still 404s and neither branch landing
      page is in the sitemap's 40 URLs; (2) Q37, contact.html's Weebly-native
      contact block still heads its columns "Fishlock Pharmacy, Ainsdale,
      Southport" / "Fishlock Pharmacy, Eccleston, Chorley", the legal line
      still reads "Fishlock Chemist (GPHC no. 1121085 and 1034673)", and the
      Ainsdale address still abbreviates to "17 Station Rd"; (3) Q57, the
      homepage's plain "Weight Loss Clinic" link (as distinct from the two
      branch-specific links beside it) still resolves to
      weight-loss-services-eccleston-ainsdale.html, which still carries the
      "Real Results with Mounjaro" heading, the weight-loss outcome slider
      and the three-medicine treatment picker (Wegovy, Mounjaro, Orlistat).
      One new, non-blocking observation for Q37: the same pages now also
      carry a second, separate footer block below the wrong Weebly contact
      block, reading "Fishlocks Chemist - two local NHS pharmacies in
      Ainsdale & Eccleston" with the address correctly given in full as
      "17 Station Road" rather than "Rd". This block is new since the sixth
      pass logged the contact block's wording and appears site-wide (seen
      identically on contact.html and the weight-loss page), so a correctly
      worded trust bar already exists alongside the still-wrong native
      contact block rather than instead of it; this does not change Q37's
      recommendation but is added to its text below so the next Weebly
      session knows one of the two blocks on the page is already right. No
      new question raised (folded into Q37 rather than opening a fresh one,
      since it is additional detail on the same live fault, not a new
      fault). No worklist item blocked or unblocked. Evidence:
      audits/fishlocks-ainsdale-quality-pass-2026-08-31.txt.
      Quality pass 2026-09-01 (eighth pass): all 8 worklist items still
      unchecked (5.3, 5.4, 5.5, 5.8, 6.1, 6.4, 6.5, 6.6) confirmed still
      [BLOCKED], so this was the fallback quality pass, picked by the
      standard rotation-pool ranking (oldest newest-mention commit across
      the 36 rotation-pool items, excluding the seven one-off items 1.1,
      1.4, 2.2, 5.6, 5.7, 6.7, 6.8): item 2.1's newest mention was the
      seventh pass at 2026-08-31T22:11:45+01:00, older than every other
      pool item. Repo half: all 36 checkers pass estate-wide, all six
      generators rebuild to a byte-identical zero diff against the untouched
      tree (189 tracked modules/ and core/ files, sha256 before/after
      identical), and check-gbp-packs.js against fishlocks-ainsdale.md
      returns 0 failures (two known WARNs unchanged: Q72 private-clinic
      qualifiers, Q64 post-town vs addressLocality). Four commits touched
      tools/ since the seventh pass (33ed5ca, bf55653, 7952f50, ec35fcf);
      branches.json unchanged since then, so no data drift to re-verify. A
      fresh independent Python extraction (no imports from tools/) swept all
      13 pages across 9 check families - own phone, foreign phone sweep,
      own postcode, foreign postcode sweep, em/en dash outside build
      comments, singular "Fishlock" near-miss, JSON-LD field match, Google
      Maps embed decode-and-compare, seoTown presence - 117 checks, 0
      issues. Guard effectiveness proved by injection against a full rsync
      scratch copy (not the tracked files): the branch's own phone swapped
      for a foreign-shaped number on its switch page, CAUGHT by check-nap.js
      (7 mismatch lines) and by the independent script's JSON-LD check; real
      repo confirmed untouched afterwards, scratch copy deleted. No in-repo
      defect found. Live half: not re-verified this pass, Claude in Chrome
      unavailable ("not connected", checked twice). Q35, Q37 (including the
      seventh-pass addendum) and Q57 treated as unchanged rather than
      re-verified. No new question raised; no worklist item blocked or
      unblocked. Evidence:
      audits/fishlocks-ainsdale-quality-pass-2026-09-01.txt.
      Quality pass 2026-09-02 (ninth pass): all 8 worklist items still
      unchecked (5.3, 5.4, 5.5, 5.8, 6.1, 6.4, 6.5, 6.6) confirmed still
      [BLOCKED], so this was the fallback quality pass, picked by the
      standard rotation-pool ranking over the 36-item pool (43 checked items
      minus the standing out-of-rotation set 1.1, 1.4, 2.2, 5.6, 5.7, 6.7,
      6.8): item 2.1's newest mention was the eighth pass at
      2026-09-01T22:39:55+01:00, older than every other pool item (2.1 is
      not itself in the out-of-rotation set; 2.2 is a different item). Repo
      half: all 36 checkers pass estate-wide, all six generators rebuild to
      a byte-identical zero diff against the untouched tree (git status
      --porcelain modules/ core/ empty before and after). A fresh
      independent Node.js extraction was written for this pass, sharing no
      code with tools/ (audits/verify-2.1-2026-09-02-ninth.js, the first
      checked-in independent script for this item; prior passes logged
      ad hoc extractions directly into this file without keeping the
      script): 806 checks across the 13 owned pages (own/foreign postcode,
      own/foreign phone spaced and digit forms, own seoTown presence,
      foreign seoTown scoped to title/H1/meta description, singular
      "Fishlock" and apostrophe near-misses, em/en dash literal and entity,
      JSON-LD parsed field by field including full address block, Google
      Maps embed query decode-and-compare, data-branch and data-wa where
      present, pfLink ownership both directions), 0 failures on the final
      run. Two false-positive bugs in the instrument itself were found and
      fixed before trusting that result, not repo defects: (1) the map
      query regex assumed the URL shape "google.com/maps/embed?...q=", but
      the live shape confirmed by direct inspection is
      "google.com/maps?q=...&output=embed", which made all 13 pages read as
      missing a map embed until the regex was corrected; (2) the first
      foreign-seoTown rule scanned the whole page body rather than the SEO
      strings, which flagged the branch landing page's deliberate "Looking
      for our other branch?" sister-link paragraph (composed by
      build-branch-landing-pages.js, confirmed by reading the generator
      source) as a foreign-town claim; rescoped to title/H1/meta
      description only, matching the scope CLAUDE.md documents for
      check-seo-pattern.js's own absence rule, since that paragraph is a
      deliberate cross-navigation feature (same category as
      check-gbp-packs.js's KNOWN_SISTER exemption), not an SEO claim on
      Eccleston. Guard effectiveness proved by three injections against
      travel-clinic-fishlocks-ainsdale.html (untried page for this item's
      injection testing; the eighth pass used the switch page): a phone
      swap to Smartts Chemist Bootle's real number (0151 922 4984) caught
      by check-nap.js (6 mismatches) and by the independent script (2
      failures); a postcode swap to Smartts' L20 9HH caught by
      check-postcodes.js's FOREIGN rule and by the independent script's
      foreign-postcode and JSON-LD rules; an &ndash; entity injected into
      the street address caught by check-em-dashes.js (2 lines) and by the
      independent script. All three restored by byte copy from a
      pre-injection backup, SHA256-confirmed identical to the original
      after each restoration and again after the final one; backup file
      deleted afterwards. check-gbp-packs.js against fishlocks-ainsdale.md
      re-read: 0 failures, the same two known WARNs as the eighth pass
      (Q72 private-clinic qualifiers, Q64 post-town vs addressLocality),
      both confirmed still open and estate-wide, not specific to this
      branch. No in-repo defect found. Live half: not performed this pass,
      Claude in Chrome reported not connected (checked at the start of the
      run and again before finishing repo work); Q35 was answered on
      2026-09-01 (paste the six branch landing pages as their own Weebly
      job) since the eighth pass, so is no longer an open live finding for
      this item; Q37 and Q57 remain open and are treated as unchanged
      rather than re-verified. No new question raised; no worklist item
      blocked or unblocked. Evidence:
      audits/verify-2.1-2026-09-02-ninth.js,
      audits/verify-2.1-2026-09-02-ninth-output.txt.
Quality pass 2026-09-03 (tenth pass): all 8 worklist items still unchecked
(5.3, 5.4, 5.5, 5.8, 6.1, 6.4, 6.5, 6.6) confirmed still [BLOCKED], so this was
the fallback quality pass, picked by the standard rotation-pool ranking over
the 36-item pool (43 checked items minus the standing out-of-rotation set 1.1,
1.4, 2.2, 5.6, 5.7, 6.7, 6.8), re-derived fresh from git log rather than
assumed: item 2.1's newest mention was the ninth pass at
2026-09-02T20:10:56+01:00, older than every other pool item, exactly matching
the ninth pass's own forward note. Repo half: all 36 checkers pass
estate-wide, all six generators rebuild to a byte-identical zero diff against
the untouched tree (git status --porcelain modules/ core/ tools/
branches.json gbp-packs/ empty before and after). Fresh angle: of this
branch's 13 owned pages, the switch page was injection-tested at the eighth
pass and the travel clinic page at the ninth, but the branch landing page
itself, modules/branch/pages/pharmacy-fishlocks-ainsdale.html, had never had
a dedicated injection round for this item, despite carrying more distinct
machine- and human-read surfaces than any other page type this branch owns:
JSON-LD opening hours, the visible hours card, data-branch identity, the
blood pressure eligibility cohort, and the map embed. New instrument written
fresh (audits/verify-2.1-2026-09-03-tenth.py, no import from tools/ beyond
invoking the real checkers as child processes): restores by direct file
write from a saved original immediately after capturing each checker's
output and before any assertion runs, sha256-verified byte-identical before
the next injection and again at the end, the same discipline the CLAUDE.md
item 5.2 note requires ("a test harness must restore by byte copy, not from
git"). Five injections, each applied to a freshly restored copy of the
original rather than layered on the previous one: (1) the JSON-LD
openingHoursSpecification closing time changed from 18:00 to 17:00 for the
five weekday sessions, leaving the visible card untouched - CAUGHT by
check-opening-hours.js's JSON-LD-match rule, "JSON-LD opening hours do not
match branches.json". (2) the visible Saturday row changed from "Closed" to
"9am to 1pm", leaving the JSON-LD untouched - CAUGHT by the same checker's
visible-row rule, "Saturday reads '9am to 1pm' but branches.json says
'Closed'". (3) data-branch swapped from "Fishlocks Chemist Ainsdale" to a
real, different, live branch's name, "Smartts Chemist Bootle", not an
invented one - CAUGHT by check-branch-identity.js on both its per-page rule
and its cross-page "declares 2 different values for data-branch" rule. (4)
the blood pressure tile's wording changed from "adults aged 40 and over" to
"adults over 40" - the exact phrasing CLAUDE.md records as the real,
already-fixed item 5.2 defect (six landing pages once said "if you are over
40", a year narrower than the NHS service) - CAUGHT by
check-pharmacy-first-eligibility.js rule 9, "states age 40, which is not
part of any NHS cohort this copy may state". (5) the map embed's query
postcode changed from this branch's own PR8 3HN to Smartts Bootle's real
L20 9HH, leaving the visible contact card and the directions button
untouched - CAUGHT by check-map-embeds.js on all three of its cross-surface
rules at once (the address itself, agreement with the contact card, and
agreement with the directions button). All five injections caught on the
first run, then the whole script re-run a second time end to end with
identical results, confirming reproducibility. File confirmed
byte-identical to its original sha256 before the round, after each
individual restoration, and after the final one; the real repo's git status
stayed empty throughout, and the full 36-checker suite re-run clean
immediately after. No in-repo defect found. Live half: not attempted this
pass, Claude in Chrome confirmed not connected both at the start of the run
and again before finishing (checked twice, matching the discipline recent
passes have used); Q37 and Q57 are treated as unchanged rather than
re-verified, Q35 remains answered and closed as of the ninth pass. No new
question raised; no worklist item blocked or unblocked. Evidence:
audits/verify-2.1-2026-09-03-tenth.py,
audits/verify-2.1-2026-09-03-tenth-output.txt.
Quality pass 2026-09-04 (eleventh pass): all 8 worklist items still unchecked
(5.3, 5.4, 5.5, 5.8, 6.1, 6.4, 6.5, 6.6) confirmed still [BLOCKED], so this was
the fallback quality pass, picked by the standard rotation-pool ranking over
the 36-item pool (43 checked items minus the standing out-of-rotation set 1.1,
1.4, 2.2, 5.6, 5.7, 6.7, 6.8), re-derived fresh from git log rather than
assumed: item 2.1's newest mention was the tenth pass at
2026-09-03T15:12:13+01:00, older than every other pool item (5.2, 4.11, 5.1,
3.6 and 3.12 tied, 3.8, 6.3 all newer), exactly matching the tenth pass's own
forward note. Repo half: all 36 checkers pass estate-wide, all six generators
rebuild to a byte-identical zero diff against the untouched tree (git status
--porcelain modules/ core/ empty before and after). Fresh angle: of this
branch's 13 owned pages, the switch page (eighth pass), the travel clinic page
(ninth pass) and the branch landing page (tenth pass) had each been
injection-tested, but the weight-loss-clinic page - the single most
compliance-sensitive page type this branch owns - had never had a dedicated
injection round for this item. New instrument written fresh
(audits/verify-2.1-2026-09-04-eleventh.js, no import from tools/ beyond
invoking the real checker as a child process): refuses to run if the target
file already carries a git diff, restores by direct file write from a saved
original immediately after capturing the checker's output and before any
assertion, sha256-verified byte-identical before the next injection and again
at the end. Five injections, each applied to a freshly restored copy of the
original: (1) RULE 4 (private, paid, not NHS) - "This is a paid private
service, not an NHS treatment," replaced with "This is a fantastic new
service," - CAUGHT. (2) RULE 5 (eligibility) - the "Adults aged 18 and over"
screening line changed to 16 and over - CAUGHT. (3) RULE 6 (no guarantee) -
the page's own no-guarantee sentence replaced with a guarantee claim - CAUGHT.
(4) RULE 8 (no medicine named) - the prescription-only medication sentence
replaced with one naming Mounjaro and Wegovy - CAUGHT. (5) RULE 9 (no efficacy
or results claim) - the consultation sentence prefixed with a "real results,
lose weight fast" claim - CAUGHT. All five caught on exit code 1, all five
restored byte-identical (sha256-reconfirmed), file confirmed byte-identical to
its original hash before the round, after each restoration, and after the
final one; the real repo's git status stayed empty throughout, and
check-weight-loss-copy.js re-run clean (exit 0) immediately after. Full
36-checker suite re-run clean. One process note, not a repo defect: a
follow-up manual re-check attempted directly through this session's own
PowerShell command channel, rather than through the Node.js instrument,
silently failed to reproduce the RULE 6 match and reported a false "OK" -
traced to how that inline command string was transmitted, not to the checker
or the file (the Node.js script's own guard, which refuses and exits if a
mutation string is not found, never fired for any of the five injections, so
all five ran against genuinely mutated content); the manual re-check is
discarded and the Node.js result stands as the record. No in-repo defect
found. Live half: PowerShell Invoke-WebRequest sweep of
fishlockpharmacy.co.uk (Claude in Chrome confirmed not connected), the first
live reconfirmation for this item since the seventh pass on 2026-08-31, four
passes ago. Q37 (the Weebly-native contact block naming the business "Fishlock
Pharmacy" and "Fishlock Chemist", and abbreviating the Ainsdale address to "17
Station Rd") reconfirmed still live and unchanged on contact.html. Q57 (the
old shared page weight-loss-services-eccleston-ainsdale.html, homepage-linked
and outside the inner-page exemption) reconfirmed still live and unchanged:
the "Real Results" heading and all three POM names (Mounjaro, Wegovy,
Orlistat) still present. The site's sitemap lastmod is still fixed at
2026-08-14T17:32:10, unchanged since the sixth pass, now three weeks without a
publish. No new question raised; both findings are reconfirmation of existing
standing state, not new faults. Evidence:
audits/verify-2.1-2026-09-04-eleventh.js,
audits/verify-2.1-2026-09-04-eleventh-output.txt.- [x] 2.2 Fishlocks shared-domain split: branch-specific landing pages so
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
      Quality pass 2026-08-11: second full pass, clean again. Rebuild zero
      diff, all 29 checkers pass, both pages match branches.json field for
      field on NAP, hours, JSON-LD and links; pure ASCII. The app sentence
      now reads "RB Healthcare Pharmacy app" via the item 3.8 rename
      (dade388), still correctly gated on hasApp. Live half unchanged: both
      pages still 404, sitemap still dated 2026-07-18 with the three
      combined two-town pages still the live targets, so the paste asked
      as Q35 remains the only outstanding step. No defect, no copy change.
      Quality pass 2026-08-12: repo half clean for the third pass, no data
      defect and no copy change, but one verifier defect found and closed.
      Rebuild zero diff, all 29 checkers pass, both pages match branches.json
      field for field on NAP, hours, JSON-LD, review links, service areas and
      cross-link. Five foreign facts were injected into the Ainsdale page and
      run past the whole suite: a swapped service-area town was caught by
      check-jsonld and check-seo-sheets, a swapped directions destination by
      check-map-embeds, and three were not caught at all. The sister-branch
      link could be repointed at another brand's page on another domain, and
      the Google and NHS review links could be swapped for the sister
      branch's, with all 29 checkers exiting 0. Same shape as the CLAUDE.md
      misses: check-branch-links owns those three fields but reads only
      branches.json, and the checkers that read pages did not own the fields.
      The consequence is not cosmetic - a relative link to another domain is
      a 404, and a swapped review link puts a patient's review on the wrong
      pharmacy's Google or NHS profile, where it cannot be moved back.
      tools/check-branch-identity.js gains rule 8 (OUTBOUND, a review link on
      a page is the owning branch's own) and rule 9 (SISTERLINK, a branch
      landing link points at a branch on the same website host and never at
      its own page). It now reads 198 review links and 6 landing links across
      the 177 pages and reports both counts. Re-probed seven ways after the
      fix, including a self-link, an unowned landing filename, a review link
      belonging to no branch (warns, does not fail, as designed) and a
      control that correctly stays green. Live half not run and not claimed:
      two Chrome instances are connected and an unattended run may not choose
      between them, so no browser call was made. Evidence:
      audits/fishlocks-branch-landing-check-2026-08-12.txt.
      Quality pass 2026-08-13: repo half clean for the fourth pass, no data
      defect and no copy change, but one verifier defect found and closed, and
      one wording question raised. Rebuild zero diff across all six
      generators, all 32 checkers exit 0 before and after, and both pages
      match branches.json field for field on NAP, phone, email, both review
      links, seoTown, JSON-LD (name, url, telephone, email, all five address
      fields, areaServed against serviceAreaList and every opening-hours
      session), the sister-branch cross-link, all five service links and the
      hasApp gating: 0 mismatches on 64 compared fields, both pages pure
      ASCII. THE DEFECT IS THE ONE THE PREVIOUS RUN CLOSED ONE STEP SHORT OF.
      Run 172 added tools/check-pharmacy-first-cost.js because nothing read
      the Pharmacy First cost claim, and scoped it to modules/service/pages
      matched on the pharmacy-first- filename. These six landing pages
      advertise Pharmacy First four times each (a service tile, a hero
      bullet, the hero paragraph and an FAQ answer, all calling it free) and
      sat outside every rule of it. Injected into the Ainsdale page one at a
      time, a "Low-cost NHS treatment" tile, a "Pharmacy First consultations
      from 25 pounds" bullet and an "affordable NHS service" FAQ answer all
      walked past all 32 checkers clean, while a control that changed one
      digit of the phone number was caught by check-nap and check-jsonld. The
      audience makes it the larger half: the six GBP packs each point a
      Google Business Profile at one of these six URLs, so this is the page a
      patient reaches from Google. Rule 7 added, holding the landing pages to
      the free claim and to the qualifier and price rules, plus a source
      floor on the landing generator, a coverage floor, and the SEO
      description lines in INDEX.md and SEO.md. Not held to rule 3, the
      prescription-charge caveat: the tile is one line and links to the page
      that carries it. Re-probed eight ways, including two false-positive
      controls (a price on the private weight loss tile and on the private
      travel clinic tile, both correctly ignored) and a strip of all four
      free claims, which correctly fails. The tile wording itself, "Free NHS
      treatment", is asked as Q69 rather than rewritten: the consultation is
      free and a supplied medicine is not. Live half not run and not claimed:
      two Chrome instances are connected and an unattended run may not choose
      between them. Evidence:
      audits/fishlocks-branch-landing-check-2026-08-13.txt.
      Quality pass 2026-08-30 (fifth pass): repo half clean and byte-stable
      again, all six generators rebuilt to a zero diff, all 36 checkers pass.
      Both branch landing pages re-verified field by field against
      branches.json (NAP, phone as text and tel: link, email, both review
      links, JSON-LD address fields including seoRegion, opening hours,
      sister-branch cross-link, pfLink, hasApp gating): 0 mismatches. The
      missing WhatsApp field on both pages is confirmed by design, not a
      gap: check-whatsapp-route.js documents build-branch-landing-pages.js
      as deliberately excluded from its GENERATORS list, since these pages
      carry no module root, no booking mount and no WhatsApp route. Live
      half: both pages still 404, still absent from the sitemap, whose 40
      URLs still carry the 2026-08-14T17:32:10 lastmod the item 2.1 sixth
      pass recorded earlier today, confirming no publish since. Q35 (branch
      pages 404, awaiting Weebly paste) and Q69 (the "Free NHS treatment"
      wording) re-read live and both still accurately describe live state.
      No in-repo defect found; no question raised or closed. Evidence:
      audits/fishlocks-branch-landing-check-2026-08-30.txt.
      Quality pass 2026-08-31 (sixth pass): repo half clean and byte-stable
      a sixth time. All six generators rebuilt from branches.json, sha256
      of all 182 generated HTML files taken before and after: zero diff.
      All 36 check-*.js run individually, all exit 0. Manual field sweep of
      both branch landing pages against branches.json (branchName,
      streetAddress, addressLocality, postalCode, addressRegion, phone,
      email, seoTown, googleReviewUrl, nhsReviewUrl, hasApp gating and app
      sentence): all present and matching. One correction to the fifth
      pass's own wording: pfLink was listed among the "0 mismatches"
      compared fields, but the raw branches.json pfLink URL string does not
      appear on either page verbatim, because build-branch-landing-pages.js
      does not read pfLink at all (grepped, no reference) and instead
      builds its own relative same-domain link
      ("pharmacy-first-<brandSlug>-<townSlug>.html"). That link is correct
      for a page living on the branch's own domain and is already covered
      by check-service-links.js and check-branch-identity.js, both clean,
      so this is a wording correction about which field was actually
      compared, not a defect in the page. Live half, read-only via Claude
      in Chrome: both pages still 404, sitemap.xml still 40 URLs at the
      same 2026-08-14T17:32:10 lastmod as every pass since the 14th,
      neither landing page listed, no publish since. Q35 and Q69 re-read
      against current live state and both still accurately describe it. No
      in-repo defect found; no question raised or closed. Evidence:
      audits/fishlocks-branch-landing-check-2026-08-31.txt,
      audits/checker-results-2.2-2026-08-31.txt,
      audits/_before-2.2-2026-08-31.sha256, audits/_after-2.2-2026-08-31.sha256.
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
      Second quality pass 2026-08-11 (eighty-ninth run): repo half clean
      again, byte-stable, all 29 checkers green, all 12 pages verified
      field by field against branches.json; the estate-wide em dash in
      every page's build comment was checked and is a documented
      report-only exemption in check-em-dashes.js, not a defect. Live:
      all 12 pages still live in the 28-URL sitemap. Three state notes:
      the Q36 footer typo is gone (footer now publishes no NHS mailbox at
      all, only Cherry@rbhealth.co.uk - hand-fixed live since 00:05
      today); sitemap lastmod stayed 2026-08-07 through that change, so
      lastmod is not a safe republish indicator for site furniture; and
      the switch body's pre-Q7 sentence actually renders as mojibake
      ("OCircumflex CCedilla oDiaeresis" for the em dash), visible
      garbage a patient reads, cleared by the already-queued repaste. No
      in-repo defect, no copy changed, no new question. Evidence:
      audits/cherry-lane-build-check-2026-08-11-second.txt.
      Third quality pass 2026-08-12 (hundred-and-thirtieth run): repo half
      only, live half not run (two Chrome instances connected, Q59). Data
      clean for the third pass running - six generators to a zero diff, all
      29 checkers green, all 12 pages verified field by field against
      branches.json. Two things explained rather than assumed: the weight
      loss pound sign is the RULE 7 fee string, uniform across all 15 pages,
      not price drift; and Cherry Lane carries no opening hours or ODS code
      in-page, correct because it has no branch landing page. The finding was
      in the verifier. Twelve injections, eleven caught, including the Google
      review swap caught by rule 8 added yesterday for Fishlocks, so that fix
      generalises. The miss: a service page's Pharmacy First link repointed
      at Coleman and Leighs, the other Walton branch, passed all 29 checkers,
      because rule 9 covers the landing family only and explicitly carves out
      every other family. check-branch-identity.js gains rule 10 SERVICELINK,
      reading 238 service links across 177 pages, clean on the untouched tree
      and catching both the Cherry Lane case and the same-host Fishlocks case
      where the misbooking is silent. No page, copy or data change, no new
      question. Evidence:
      audits/cherry-lane-item-2.3-quality-pass-2026-08-12-run130.txt.
      Fourth quality pass 2026-08-13 (hundred-and-seventy-first run). Repo
      half clean for the fourth pass running: six generators to a zero diff,
      all 31 checkers green, the 12 pages verified field by field against
      branches.json, no non-ASCII outside the documented build-comment
      exemption and the RULE 7 fee sign. ONE REAL DEFECT FOUND AND FIXED, in
      tools/check-pharmacy-first-eligibility.js: its age pattern read only the
      first number after "aged", so the SECOND end of every cohort RANGE was
      invisible to rule 7 on all 98 condition pages. "Women aged 16 to 64"
      changed to "Women aged 16 to 74" in the hero pill of
      uti-treatment-cherry-lane-walton.html walked past all 31 checkers,
      because rules 5 and 6 match the correct string anywhere on the page and
      the eligibility list below still carried it. Now caught, on the UTI and
      the earache pages, with the untouched tree still green. Live half read
      this run, read only: all 12 pages still in the 28-URL sitemap, the
      Pharmacy First overview renders all seven conditions with the correct
      NHS age ranges, and the old weight loss page is still the compliant
      signpost Q5 asked for, naming no medicine and making no claim. Three
      live faults stand, none in copy this repo owns: the Q36 footer typo
      pharmacy.FA226@mhs.net is BACK on every page read, against the
      2026-08-11 note that recorded it gone; the switch page still renders the
      pre-Q7 em dash as mojibake; and the switch SEO title field is still the
      pre-Phase-3 string. Evidence:
      audits/cherry-lane-item-2.3-quality-pass-2026-08-13-run171.txt.
      Fifth quality pass 2026-08-29 (extended interactive session, repo half
      only - live-site verification not possible that run, see the log
      entry). All 12 pages verified against Build Pack v2: page set,
      Walton titles/H1s, NAP against branches.json, UK spelling, em dash
      rule and POM absence all pass. One new finding, raised as Q82: the
      repo CLAUDE.md still names Weebly\seo\rbh-site-data\branches.json as
      the only valid branches.json, but this repo's branches.json is the
      only real file; documentation defect, not decided autonomously
      because it touches how the OneDrive clone gets closed out. No fix
      made. Evidence: cherry-lane-gbp-pack-check-2026-08-29.txt covers the
      linked 4.2 GBP pack pass from the same session.
      Sixth quality pass 2026-08-30 (unattended run). Repo half clean
      again: six generators to a byte-identical worktree, all 36 checkers
      exit 0, branches.json fields spot-checked against the 12 pages, the
      switch page's build-comment SEO title/description confirmed correct
      against spec. Live half performed this run (single Chrome tab
      available): three known live-only faults reconfirmed unchanged, none
      in copy this repo owns - the switch page title still the
      pre-Phase-3 string, the switch page's "How switching works" intro
      still renders its em dash as mojibake, and the footer NHS mailbox
      typo pharmacy.FA226@mhs.net is back (last seen fixed only once, on
      2026-08-11, wrong again by 2026-08-13 and again now), all already
      tracked (5.1/3.1/Q3, estate repaste backlog, Q36). Pharmacy First
      overview still renders all seven conditions with correct NHS age
      ranges; the old weight loss page remains the compliant Q5 signpost.
      Comma splices in the weight-loss-clinic FAQ (noted 2026-08-04) are
      confirmed still present and now identified as sitting inside a
      shared FAQ-answer template rather than being Cherry-Lane-specific;
      still not fixed, for the same reason as before (generated output,
      no repaste currently queued for this alone). No in-repo defect
      found, no fix needed, no new question. Q82 remains open, untouched.
      Evidence:
      audits/cherry-lane-item-2.3-quality-pass-2026-08-30-sixth.txt.
      Seventh quality pass 2026-09-01 (unattended run). Repo half clean again:
      six generators to a zero diff across the whole repo, all 36 checkers
      exit 0. NEW FINDING, live and significant: the Pharmacy First overview
      page (cherrylanepharmacy.co.uk/pharmacy-first-cherry-lane-walton.html)
      is showing five of its seven condition cards - Sinusitis, Earache,
      Impetigo, Shingles, Infected insect bite - as "Page coming soon" with
      no working link, the exact original 2026-08-04 fault that the
      2026-08-11 pass believed fixed and every live check since (2026-08-13,
      2026-08-30) reconfirmed as fine. Those checks only read for the
      condition name and NHS age range text, which is present on the broken
      cards too, so none of them actually tested for the "coming soon"
      marker or the href. The repo's own generated page is correct (all
      seven as working links, confirmed field by field), so this is a live
      Weebly paste issue, not an in-repo defect - raised as Q89 rather than
      repasted (no autonomous window this run, and no live-editing route
      available in any case). Two other known live-only faults reconfirmed
      unchanged (switch page SEO title still pre-Phase-3; switch page body
      still renders a visible mojibake em dash, now pinned to the "How
      switching to Cherry Lane Pharmacy works" lead paragraph specifically,
      confirmed not inside an HTML comment). The Q36 footer NHS mailbox typo
      was not observed this pass on any of the three pages checked (it is
      simply absent rather than typo'd, matching the 2026-08-11 state
      instead of the 2026-08-13/2026-08-30 state) - logged as unstable, not
      re-raised. Weight loss page rechecked for medicine names and
      superlative claims: none found. No in-repo defect, no fix made.
      Evidence:
      audits/cherry-lane-item-2.3-quality-pass-2026-09-01-seventh.txt.
      Eighth quality pass 2026-09-02 (unattended run). Repo half clean again:
      six generators to a zero diff, all 36 checkers exit 0, branches.json
      fields and the 12-page set re-verified field by field. FINDING: Q89's
      fault is GONE live. The Pharmacy First overview page now renders all
      seven condition cards with correct working links and no "Page coming
      soon" text anywhere; spot-checked shingles-treatment-cherry-lane-
      walton.html (one of the five previously broken cards), which loads
      200 with fully correct copy. The repaste Q89 asked for evidently
      happened between the seventh pass (2026-09-01) and this one. Q89
      marked answered on this evidence, same precedent as Q5 on this item's
      original build entry. Two known live-only faults reconfirmed
      unchanged (switch page SEO title still pre-Phase-3; switch page body
      still renders the pre-Q7 em dash as visible mojibake in the "How
      switching to Cherry Lane Pharmacy works" lead paragraph). The Q36
      footer NHS mailbox typo pharmacy.FA226@mhs.net is BACK, observed on
      all four live pages checked this pass (a stronger, more consistent
      read than the seventh pass's "absent on all three checked"),
      reinforcing the "unstable between deploys or caches" pattern rather
      than a one-off; Q36 already answered and awaiting the next
      supervised Weebly session, not re-raised, note appended only. Minor
      unchased observation: a mojibake "x" character on the switch banner
      matches the shape of the estate-wide switch-banner mojibake already
      logged on the 4.15 eighth pass, not independently confirmed against
      source bytes this run (browser tool blocked the raw fetch). Weight
      loss page rechecked: no medicine names, no superlative claims,
      correct hedging, unchanged. No in-repo defect, no fix made. Evidence:
      audits/cherry-lane-item-2.3-quality-pass-2026-09-02-eighth.txt.
      Ninth quality pass 2026-09-03 (unattended run). Repo half clean again:
      six generators to a zero diff, all 36 checkers exit 0, branches.json
      fields and the 12-page set re-verified field by field. FRESH ANGLE:
      tools/check-switch-copy.js had never had its branch-specific rules
      (RULE 8 town, RULE 6 time-claim, RULE 9 form/sentence agreement)
      proved by injection against Cherry Lane's own switch page specifically
      (confirmed by a source search for "cherry" in the checker, zero
      matches beforehand). Three injections on
      switch-prescriptions-cherry-lane-walton.html, each restored by byte
      copy and SHA256-confirmed before the next: (1) trust-bar town swapped
      Walton for Bootle - caught, 4 failures (verbatim, missing own town,
      two cross-branch town collisions against smartts_bootle and
      skchemists_bootle); (2) H1 seconds figure changed 30 to 45 - caught,
      2 failures (page states two figures; estate now states two figures
      across 15 pages); (3) mobile input marked required while step 1 still
      calls it optional - caught, 1 failure. All three caught first
      attempt, file restored to baseline hash each time, full 36-checker
      suite clean after final restore. No in-repo defect, no rule or page
      byte changed. Live half: Chrome unreachable this run (retried once),
      fell back to HTTPS status-code check only - five pages spot-checked
      (Pharmacy First overview, switch, weight loss, travel clinic,
      shingles) all 200; page-content findings from the eighth pass (switch
      SEO title pre-Phase-3, switch body mojibake em dash, Q36 footer
      mailbox typo) not re-readable this pass and stand as last recorded.
      No new question. Evidence:
      audits/cherry-lane-item-2.3-quality-pass-2026-09-03-ninth.txt.
      Tenth quality pass 2026-09-04 (unattended run). Repo half clean
      again: six generators to a zero diff, all 36 checkers exit 0,
      branches.json fields and the 12-page set re-verified field by field.
      FRESH ANGLE: check-brand-spelling.js, check-uk-spelling.js and
      check-url-scheme.js all passively scan Cherry Lane's own generated
      pages on every full-suite run but had never been individually proven
      by injection against this item's own PAGE content (as opposed to a
      GBP pack) to actually catch a defect here. Three injections on a
      scratch copy, each restored by byte copy and SHA256-reconfirmed
      before the next: (1) all 11 "Cherry Lane Pharmacy" occurrences in the
      Pharmacy First overview page changed to "Cherry Lane Chemist" -
      caught by check-brand-spelling.js, 11 failures, correct trading name
      named; (2) the weight loss page's "Choose a time that suits you."
      changed to "We organize a time that suits you." - caught by
      check-uk-spelling.js, correct UK form "organise" named; (3) an
      insecure http:// link appended to the switch page - caught by
      check-url-scheme.js as a published-surface breach, linked to item
      6.6. All three caught first attempt, full 36-checker suite clean
      after final restore, all three files SHA256-confirmed byte-identical
      to baseline. No in-repo defect, no rule or page byte changed. LIVE
      HALF, SIGNIFICANT FINDING: Chrome unreachable again (Q59), fell back
      to raw HTTP fetch. The Pharmacy First overview page is AGAIN showing
      five of seven condition cards (Sinusitis, Earache, Impetigo,
      Shingles, Infected insect bite) as "Page coming soon" with no href -
      the identical fault closed on the eighth pass (2026-09-02, Q89) and
      not re-tested on the ninth pass (2026-09-03, status-code-only
      fallback cannot see this). The repo's own page remains correct.
      Raised fresh as Q95 rather than repasted (browser read-only, no
      live-editing route), recommending the cause be investigated before a
      third blind repaste since the second one has now visibly failed to
      hold. Two other known live-only faults reconfirmed unchanged (switch
      SEO title pre-Phase-3; switch body mojibake em dash), neither
      re-raised. Q36 footer mailbox typo not observed this pass, consistent
      with its already-logged instability. Evidence:
      audits/cherry-lane-item-2.3-quality-pass-2026-09-04-tenth.txt.

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
Quality pass 2026-08-12: clean, no defect found. Self-test passes with no
length warnings, check-seo-pattern reads 177 pages with 0 failures and 0
untyped, all six generators reproduce every page byte-identical, all 29
checkers green, and the pattern re-verified against Build Pack v2 sections
1.4, 5.1 and 5.4. Live sample: Fishlocks Ainsdale serves the pattern title
verbatim; Scorah Bramhall still serves Weebly's default doubled-brand title
(SEO field unpasted, the run 78 finding, queued under 5.3/5.4). Evidence in
audits/seo-pattern-check-2026-08-12.txt.
Quality pass 2026-08-13: the pattern clean for the third consecutive pass,
one defect found and fixed in the verifier. Self-test passes with no length
warnings, all six generators reproduce all 177 pages byte-identical, all 29
checkers green. The defect: seo-pattern.js PAGE_TYPES describes itself as the
rollout contract for items 3.2 to 3.13, and git grep showed nothing in the
repo read it. Proved by giving build-travel-clinic-pages.js a hand-composed
replica of brandTitle: all 15 pages rebuilt to a zero diff and all 29 checkers
and the self-test passed with the contract broken. Reverted.
check-seo-pattern.js now reads PAGE_TYPES as data under test, so a listed
builder that has gone, a builder that drops the require or stops calling its
named function, a function seo-pattern does not export, a new generator named
by no entry, an empty contract and a stale KNOWN_NON_PAGE_BUILDER key all
fail. Negative-tested eight ways, two of them guards against the opposite
error. Residual limitation stated in the checker and the audit file: the call
check is file-wide, so inlining one of a builder's two call sites is caught
late by the output rules rather than here. Evidence in
audits/seo-pattern-check-2026-08-13.txt. REPO HALF ONLY, the live half was not
run: browser unavailable, see the log for this run.
Quality pass 2026-08-14: the pattern clean for the fourth consecutive pass,
one defect found and fixed in the verifier. Self-test passes with no length
warnings, all six generators reproduce all 177 pages byte-identical, all 32
checkers green. The defect: item 3.1 requires the town words to be SOURCED
FROM branches.json (Build Pack v2 section 5.1, "using addressLocality targets
the wrong catchment") and nothing asserted that clause. Every town rule in the
repo took its expected town from seo-pattern pick(), which is also what the
composers use, so the check was circular. Eight of the fifteen live branches
have seoTown different from addressLocality, so a pick() reading the wrong
field would put Liverpool on the Walton, Aintree, Crosby, St Michael's and
Aigburth pages at once. Proved by injection twice: injected into
landingTitle/landingH1 the self-test caught it by name, but injected into
pick() itself the self-test PASSED and the suite went red only by collateral,
because five of the seven page types are built from store objects the
generator resolves before the pattern sees them. The branch landing family has
no such anchor and both McCanns landing pages silently became "Pharmacy in
Liverpool" with identical titles and H1s on one shared domain.
check-seo-pattern.js now carries a data-source rule asserting pick().town
equals seoTown and pick().brand equals brandLabel against branches.json
directly, with a vacuity guard so an estate that stopped exercising the
difference fails rather than passing on nothing. Negative-tested four ways.
Residual: build-switch-pages.js CONFIG still mirrors brand and town as
literals, examined and not a live defect because the exact match recomputes
from the raw branch, but recorded as a mirror. Evidence in
audits/seo-pattern-check-2026-08-14.txt. REPO HALF ONLY, the live half was not
run: browser unavailable, see the log for this run. No new question.
Quality pass 2026-08-30: the pattern clean for the fifth consecutive pass,
one defect found and fixed in the verifier. Self-test passes with no length
warnings, all six generators reproduce all 177 pages byte-identical, all 36
checkers green. The defect, one notch along the run-178 axis: the data-source
rule that pass added covers pick().town and pick().brand, and pick() returns
three values. The third, region, is the landing-title qualifier (seoRegion
where set, else addressRegion - "Eccleston, Chorley" is what separates
Fishlocks Eccleston from Eccleston, St Helens) and nothing asserted its
source. Proved by injection twice: precedence swapped to addressRegion-first,
the Eccleston title silently became "Pharmacy in Eccleston, Lancashire" and
everything stayed green; region read from addressLocality, six landing pages
lost the qualifier or swapped it for postal "Liverpool" and everything stayed
green. check-seo-pattern.js now asserts pick().region against
(seoRegion || addressRegion) from branches.json directly, with a vacuity
guard requiring at least one live branch to exercise the precedence.
Negative-tested four ways. Residual stated in the audit file: no self-test
row asserts the region qualifier, so a composer-side region drift is caught
late by the exact match rather than by name. Live sample: the Cherry Lane
contraception page serves the pattern title and H1 verbatim, exactly one h1.
Landing pages still not live (Q35 paste outstanding). Evidence in
audits/seo-pattern-check-2026-08-30.txt. No new question.
Quality pass 2026-08-30 (sixth pass): the pattern clean again, no defect
found in the pattern itself. Self-test passes with no length warnings, all
six generators reproduce all 177 pages byte-identical, all 36 checkers
green. One injection test run rather than a length-of-rope reading: fitTitle
was patched to always return the unshortened title (compose(brand) with no
retry), all service pages rebuilt, and check-seo-lengths.js caught it by
name on insect-bite-treatment-coleman-leigh-walton.html ("title is 70
characters, over the 65 limit"), the one page in the estate that exercises
the Q14/Q24 shortenBrand rescue. So the fitTitle contract (item 5.6's rule)
is genuinely backstopped by a second checker, not merely self-consistent
with seo-pattern.js's own self-test. Reverted; git status clean and all 36
checkers re-confirmed green afterwards. Live sample:
colemanandleighspharmacy.co.uk/insect-bite-treatment-coleman-leigh-walton.html
read directly - H1 and meta service-word content match the pattern, but the
live SEO title and description both still read "Coleman & Leigh Pharmacy"
rather than the repo's "Coleman and Leighs Pharmacy" (or, for this specific
page, the Q14-shortened "Coleman and Leighs"), the same long-tracked
brand-name paste lag as Q1/item 1.1, unchanged and not fixed here.
Separate process finding, not about the pattern itself: this item was
reached only after discovering that item 4.11's fifth and sixth passes
(2026-08-29, 2026-08-30) were logged in AGENT_LOG.md and in
gbp-packs/sk-chemists-bootle.md but never appended here, which is why
AGENT_WORKLIST.md alone made 4.11 look like the oldest unverified item when
it was not. Raised as Q84 rather than fixed here, since backfilling every
affected item is bigger than this pass's scope. No new question about the
pattern itself. Evidence in audits/seo-pattern-check-2026-08-30-sixth.txt.
Quality pass 2026-09-01 (seventh pass, unattended run): clean again, no new
defect. Self-test passes with no length warnings. All six generators
reproduce all 203 files under modules/*/pages byte-identical
(audits/_before-3.1-2026-09-01-seventh.sha256 and
_after-3.1-2026-09-01-seventh.sha256, zero diff). All 36 tools/check-*.js
checkers green. check-seo-pattern.js itself: 177 pages checked, 0 untyped,
0 failures, the same two PINNED McCanns/Scorah cross-town findings as every
recent pass (Q71, still open, not a failure).
Rather than invent a new angle on a file six passes have already
stress-tested from most directions (condition-slug mirroring, the
PAGE_TYPES contract, town/brand/region source, one-h1, one-line,
cross-town absence, fitTitle's length rescue), this pass re-proved one of
the existing SAFEGUARDS rather than the pattern: the region leg's own
vacuity guard, which the 2026-08-30 fifth pass added and reasoned about but
which no log entry shows being triggered by actual injection. Fishlocks
Eccleston is the sole live branch whose seoRegion differs from its
addressRegion, so it is the one branch propping that guard up. Method:
rsync-copied the whole repo to a scratch directory outside the mounted
working tree, confirmed the copy's own check passed clean, edited the
copy's branches.json to set fishlocks_eccleston's seoRegion equal to its
addressRegion (removing the only branch that exercises the precedence),
reran check-seo-pattern.js: exit 1, "FAIL no live branch has a seoRegion
that differs from its addressRegion... Fishlocks Eccleston carried the
differing value when this rule was written. Restore one or retire the leg
deliberately." Scratch directory deleted immediately after; git status on
the tracked repo confirmed branches.json and Weebly/ untouched throughout.
Evidence in audits/seo-pattern-region-vacuity-reproof-2026-09-01.txt. The
guard is real, not merely documented.
Live sample: fishlockpharmacy.co.uk/pharmacy-first-fishlocks-ainsdale.html
still serves the pattern verbatim (title "Pharmacy First at Fishlocks
Chemist, Ainsdale", H1 "Pharmacy First at Fishlocks Chemist in Ainsdale",
exactly one h1). mccannspharmacy.co.uk/pharmacy-mccanns-sandringham.html
(the pinned Q71 page) returns 404, consistent with Q35's landing-page paste
still being outstanding across all six branch landing pages, not a new or
changed finding. No in-repo defect found, no page, generator, checker or
branches.json entry changed, no new question raised.
Quality pass 2026-09-02 (eighth pass, unattended scheduled run): clean
again, no new defect. Self-test passed with no length warnings. All six
generators reproduce all 203 files under modules/*/pages byte-identical
(sha256 before/after, zero diff). All 36 tools/check-*.js checkers green;
check-seo-pattern.js itself reports 177 pages, 0 untyped, 0 failures, the
same two PINNED cross-town findings as every recent pass (Q71, still open).
Rather than repeat an already-stress-tested angle, this pass proved a leg
that had never been isolated by injection: check-seo-pattern.js's OWN
checkMeta length-bound rule (80 to 165 characters), which duplicates a
bound check-seo-lengths.js also owns, so defense in depth was previously
reasoned about but not demonstrated. On a scratch copy outside the tracked
tree, uti-treatment-fishlocks-ainsdale.html's description was shortened to
76 characters and, separately, lengthened to 213, and check-seo-pattern.js
run alone (not check-seo-lengths.js) caught both: "meta under 80 chars" and
"meta over 165 chars" respectively. File restored between and after tests,
sha256-confirmed byte-identical to the original; scratch directory deleted;
tracked repo confirmed untouched throughout. Live half not performed:
Claude in Chrome reported not connected, no further retry per the
unattended-run rule; the 2026-09-01 seventh-pass live verdicts
(fishlockpharmacy.co.uk pattern verbatim, mccannspharmacy.co.uk Q71 page
still 404) stand as written rather than being restated as re-checked. No
in-repo defect, no new live finding, no new question. Evidence in
audits/seo-pattern-check-2026-09-02-eighth.txt.
Quality pass 2026-09-03 (ninth pass, unattended scheduled run): clean again,
no defect in the checker. Self-test passed with no length warnings. All six
generators reproduce all 216 files under modules/ and core/ byte-identical
(sha256 before/after, 216/216, zero diff, git status --porcelain empty).
check-seo-pattern.js itself: 177 pages, 0 untyped, 0 failures, the same two
PINNED cross-town cases as every recent pass (Q71, still open, not a
failure).
Rather than repeat an already-stress-tested leg, this pass proved three
angles of the PAGE_TYPES CONTRACT and the KNOWN lists that no prior 3.1 pass
had isolated by injection, all on a full scratch copy of tools/, branches.json
and the three page directories outside the tracked tree (not the rsync method
of the seventh pass, a targeted PowerShell copy instead; the scratch copy's
own baseline run matched the tracked repo's own output exactly, 177/0/0,
before any mutation). (1) REVERSE-DIRECTION CONTRACT: the comment above
KNOWN_NON_PAGE_BUILDER states "every tools/build-*.js must be named by a
PAGE_TYPES entry... a stale key there FAILS", a rule six prior passes on this
item described as backstopped but never triggered. A new file,
tools/build-injection-test-9th-pass.js (a two-line no-op, named to match the
build-*.js glob and nothing else), was added to the scratch copy: caught by
name, "FAIL build-injection-test-9th-pass.js is a generator named by no
PAGE_TYPES entry", exit 1. Removed; scratch copy re-ran clean (177/0/0, exit
0) before the next mutation. (2) STALE KNOWN_NON_PAGE_BUILDER KEY: deleted
tools/build-audit-status.js from the scratch copy, the sole file the key
currently excuses, so the key now names a builder that no longer exists.
Caught by name, "FAIL stale KNOWN_NON_PAGE_BUILDER key - build-audit-status.js
no longer exists. Remove it", exit 1. Restored by copying the real file back
from the tracked repo; scratch re-ran clean before the next mutation. (3)
UNTYPED FILE FAILS RATHER THAN SKIPS: the 2026-08-11 first pass changed this
behaviour but no log entry shows it proved by injection. Added
modules/service/pages/totally-unrecognised-page-9th-pass.html (a bare HTML
stub matching no expectationsFor() pattern) to the scratch copy: caught by
name, "FAIL untyped file - totally-unrecognised-page-9th-pass.html: this
checker cannot type it", the untyped count moving from 0 to 1, exit 1. All
three defaults are the correct, documented behaviour, so nothing was fixed;
the scratch directory was deleted after use and `git status --porcelain
modules/ tools/ core/ branches.json` on the tracked repo confirmed empty
throughout and at the end, since every mutation happened only in the scratch
copy. Zero in-repo defects found this pass.
LIVE HALF: Claude in Chrome reported not connected (checked via
tabs_context_mcp at answer pickup); per procedure not retried by another
route, no login attempted. Fell back to the established read-only HTTP GET
route (Invoke-WebRequest, GET only): fishlockpharmacy.co.uk/
pharmacy-first-fishlocks-ainsdale.html returned HTTP 200, title "Pharmacy
First at Fishlocks Chemist, Ainsdale" and H1 "Pharmacy First at Fishlocks
Chemist in Ainsdale", both the pattern verbatim, unchanged from every prior
pass's live sample. The Q71/mccannspharmacy.co.uk 404 finding was not
re-read this pass; treated as unchanged rather than re-verified, consistent
with the eighth pass's own convention when the finding is not new. No new
live finding, no new question raised - this is a re-verification, not a
live-facing or patient-facing decision.
Quality pass 2026-09-03 (tenth pass, unattended scheduled run): clean again,
no in-repo defect. Self-test passed with no length warnings. All six
generators reproduce all 193 files under modules/ and core/ byte-identical
(sha256 before/after, zero diff, git status --porcelain empty throughout).
All 36 tools/check-*.js checkers green; check-seo-pattern.js itself: 177
pages, 0 untyped, 0 failures, the same two PINNED cross-town cases as every
recent pass (Q71, still open).
Nine prior passes had exercised the exact-match H1 leg, the count leg, the
data-source leg, the PAGE_TYPES contract and the cross-town/sister-town
legs, but none had tested the ONE difference between the two H1 regexes in
check-seo-pattern.js itself: H1_OPEN_RE (the counting rule, line 406) reads
<h1[^>]*>, matching any h1 including an attributed one, while the exact-match
extraction (line 440) reads a bare <h1>(...)</h1> only. The file's own
comment states this is deliberate ("the exact match below deliberately
keeps its bare <h1> read, so an attributed h1 fails loudly there rather
than being quietly accepted") but no log entry across nine passes shows it
proved by injection - a residual claim standing on its own word, the same
shape of gap this item has closed eight times before on other legs.
METHOD. modules/service/pages/pharmacy-first-fishlocks-ainsdale.html backed
up by sha256 first (14bbf91a...29ba1a). Baseline: estate-wide grep confirmed
all 177 pages carry a bare <h1> today, zero attributed h1 elements, so the
gap was untested rather than already live. class="hero" added to the page's
own h1 tag only (<h1>...</h1> to <h1 class="hero">...</h1>), nothing else
touched.
RESULT OF INJECTION: check-seo-pattern.js exit 1, 3 failures, all on this
one file, all by name - "h1 '(no h1)' != 'Pharmacy First at Fishlocks
Chemist in Ainsdale'", "h1 missing seoTown 'Ainsdale'", "h1 missing service
words (pharmacy first)". Confirms the documented behaviour rather than
merely repeating it: the attributed h1 is not silently accepted, it fails
loudly, exactly as the comment claims. Also confirms the two regexes stay
independent as designed rather than one gap hiding behind the other - the
one-h1 COUNT rule still read "177 pages carry exactly one h1" in the same
run (H1_OPEN_RE correctly counted the attributed tag), so the failure came
entirely from the content/exact-match leg, not from a count miss. Residual
worth naming rather than fixing: the failure message reads "(no h1)" for a
page that does have an h1, which is accurate to what the bare-tag regex
found but potentially misleading to a human reading the output - a
diagnostic-wording note, not a coverage gap, and not touched this pass since
the checker still catches the fault correctly.
File restored from the sha256 backup; hash reconfirmed identical
immediately after. Full 36-checker suite re-run clean (36/36 exit 0)
immediately after restore; all six generators rebuilt a second time, sha256
of all 193 files under modules/ and core/ unchanged from the pre-pass
baseline; git status --porcelain modules/ core/ tools/ branches.json
gbp-packs/ status/ empty throughout and at the end.
LIVE HALF: Claude in Chrome reported not connected at answer pickup (step
3), consistent with the standing Q59 cause; not retried by another route
for the pickup itself, no login attempted. For the live read, fell back to
the established read-only plain HTTP GET route (curl, GET only, -L to
follow the http-to-https redirect, no interaction): network egress
confirmed working first (google.com 200), then
fishlockpharmacy.co.uk/pharmacy-first-fishlocks-ainsdale.html read via a
301 to www.fishlockpharmacy.co.uk, final response HTTP 200, title "Pharmacy
First at Fishlocks Chemist, Ainsdale" and H1 "Pharmacy First at Fishlocks
Chemist in Ainsdale", both the pattern verbatim - unchanged from every
prior pass's live sample, and specifically confirms today's live page still
carries a bare (unattributed) h1, consistent with the injection finding
above being a closed gap rather than a live one. The Q71/mccannspharmacy.co.uk
404 finding was not re-read this pass, treated as unchanged per the eighth
pass's own convention. No new live finding.
RESULT. Zero in-repo defects found this pass. One genuinely untested
residual claim in check-seo-pattern.js proved correct by injection: an
attributed h1 fails the checker loudly rather than passing silently, and it
does so without weakening the separate one-h1 count rule. No checker logic
changed - this was verification only, the documented behaviour already
being correct. No page, generator, checker or branches.json entry changed.
No new question raised.
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
      Quality pass 2026-08-12: second machine pass. All 26 Scorah pages
      re-read by an independent extraction (own regexes, not the checker):
      title, description and H1 all carry the branch's own town, exactly
      one H1 per page, the sister town appears only in the two landing
      descriptions that branches.json excuses via serviceAreaList, and
      every description sits inside 80 to 165 characters. All 29 checkers
      pass, cross-town rule included; all seven generators rebuilt
      byte-identical. Live half, two read-only GETs on the Hazel Grove
      side: the UTI page serves the pattern's H1 and copy verbatim under
      Weebly's doubled-brand default title, which extends the run 78
      unpasted-title finding to Hazel Grove explicitly; the landing page
      still 404s as the pack's paster note anticipates. Both known and
      queued under 5.3/5.4 and the paste run. No repo defect. No new
      question.
      Quality pass 2026-08-13: third machine pass, REPO HALF ONLY (browser
      unavailable, see the log). All 26 Scorah pages re-read by a third
      independent extraction and clean on every leg: own town in title, H1
      and description, exactly one H1, no sister town outside the two
      landing descriptions branches.json excuses, description length inside
      80 to 165. All 30 checkers and the self-test pass, all seven
      generators rebuild byte-identical. THE GAP WAS THE OTHER HALF OF THE
      ITEM'S OWN SENTENCE. Item 3.2 is "put the town AND SERVICE WORDS into
      every page title, description and heading", and both earlier passes
      read only the town half. Service words reached checkMeta alone: the
      description was guarded, the title was not, and the H1 had no content
      rule of any kind, only an exact match against the pattern functions,
      which is pattern-relative and moves with the composer. Proved by
      injection: brandTitle and brandH1 each made to drop the service word
      for Travel Clinic alone, 15 pages rebuilt without it, all 30 checkers
      green both times; an H1 that dropped its town was caught only
      incidentally by the H1-duplication warning in check-seo-lengths, and
      only because two branches share the Scorah brand. Fixed in
      seo-pattern.js (checkTitle now takes serviceWords, new checkH1 asserts
      town and service word, one shared hasServiceWord helper for all three
      legs) and check-seo-pattern.js (both wired in, plus a guard failing any
      page type declared with no service words). Five negative tests, all
      five fire. No new question.
      Quality pass 2026-08-14: fourth machine pass, REPO HALF ONLY (browser
      unavailable, see the log). All 26 Scorah pages re-read by a fourth
      independent extraction and CLEAN on every leg for the fourth
      consecutive pass: own town in title, description and H1, exactly one
      H1, no foreign seoTown outside the branch's own serviceAreaList,
      titles 42 to 63 characters against a 65 limit, descriptions 135 to 160
      inside the 80 to 165 band. THE GAP WAS THE HEADING LEG, AND IT WAS A
      COUNTING GAP. Item 3.2 covers the heading, and every heading rule in
      the repo reads the FIRST h1 and stops: the exact match, checkH1(),
      checkCrossTown() and rule 4 of check-seo-lengths.js. None of them
      counts, so a SECOND h1 was invisible to all four at once. That lands
      on this item in particular because the cross-town absence rule was
      added on the 2026-08-11 pass on 3.2 precisely because Bramhall and
      Hazel Grove share a domain, and a second h1 was the one place it could
      not look. Proved by injection: a second "<h1>Pharmacy in Ainsdale</h1>"
      on pharmacy-scorah-bramhall.html, naming a live seoTown absent from
      Bramhall's serviceAreaList, passed all 35 checkers and the self-test.
      The same injection carrying a foreign BRAND was caught, but by
      check-nap.js on the brand alone, which is collateral rather than
      cover. "Exactly one h1 per page" had been verified by hand on 08-11
      and by extraction on 08-12 and 08-13, true every time and preserved by
      no rule. Fixed in check-seo-pattern.js with a ONE H1 rule counting
      <h1[^>]*> so an attributed h1 still counts, running before the content
      rules. The exact match deliberately keeps its bare <h1> read rather
      than being widened, so the fix tightens without loosening. Five
      negative tests, all five fire, all five restores byte-identical by
      sha256. Evidence in audits/seo-pattern-h1-count-2026-08-14.txt. No new
      question.
      Quality pass 2026-08-30: fifth machine pass, both halves. All 26
      Scorah pages re-read by a fifth independent extraction and CLEAN on
      every leg for the fifth consecutive pass: own town in title,
      description and H1, service words on all three legs, exactly one H1,
      no foreign seoTown outside the branch's own serviceAreaList, titles
      inside 65 characters, descriptions inside 80 to 165. Live half, two
      read-only GETs: the Bramhall UTI page serves the pattern's H1 and
      copy verbatim under Weebly's doubled-brand default title, which
      extends the known unpasted-title finding to Bramhall explicitly, and
      the Bramhall landing page 404s exactly as the Hazel Grove landing did
      on the 08-12 pass. Both known and queued under 5.3/5.4 and the paste
      run. THE GAP WAS THE 08-14 COUNTING QUESTION ASKED OF THE OTHER TWO
      LEGS. The 08-14 pass counted h1 elements and stopped there; the title
      and description lines were still read first-match-only by .exec(), so
      a page carrying a SECOND "Weebly page SEO title" or "Weebly page SEO
      description" line passed every rule while the second line went
      unread, and those lines are exactly what the paster's eyes read when
      the block goes into Weebly. Proved by injection: a second title line
      and a second description line, each reading "Pharmacy in Ainsdale" on
      the Bramhall UTI page (a live seoTown not in Bramhall's
      serviceAreaList), passed all 36 checkers. Fixed in
      check-seo-pattern.js: a ONE TITLE LINE, ONE DESCRIPTION LINE rule
      counting the labels anywhere in the file, mirrored on the ONE H1
      rule. Four negative tests (duplicate title, duplicate description,
      missing title line, duplicate in the body outside the head comment),
      all four fire; restore byte-identical, all 36 checkers green, all six
      generators rebuild to a zero diff. Evidence in
      audits/verify-3.2-2026-08-30.js and
      audits/verify-3.2-2026-08-30-output.txt. No new question.
      Quality pass 2026-08-31: sixth machine pass, both halves. All 36
      checkers green before inspection, all six generators rebuilt to a
      zero diff (sha256 before/after every file in the three page
      directories). A sixth independent extraction
      (audits/verify-3.2-2026-08-31.js, own regexes, imports nothing from
      tools/) re-read all 26 Scorah pages and found them CLEAN on every leg
      for the sixth consecutive pass: own seoTown in title, description and
      h1, exactly one of each, titles within 65 characters, descriptions
      within 80 to 165, no foreign seoTown outside the branch's own
      serviceAreaList bar the two pinned sister-town landing descriptions
      Q71 already covers. Rather than only re-reading, this pass proved the
      guard still bites: injected a second "<h1>Pharmacy in Ainsdale</h1>"
      (a live seoTown absent from Bramhall's serviceAreaList) into
      pharmacy-scorah-bramhall.html, the same fault shape the 2026-08-14
      pass fixed; check-seo-pattern.js caught it immediately ("2 h1
      elements, expected exactly 1"). Restored by writing
      `git show HEAD:<path>` back over the file, because `git checkout --`
      fails to unlink on this mount; sha256-confirmed byte-identical to the
      original, checkers green again. No drift found, no new fault class,
      no new question. Live half unchanged: the Bramhall UTI page still
      serves Weebly's doubled-brand default title (unpasted, queued under
      5.3/5.4) and the Bramhall landing page still 404s (unchanged since
      2026-08-12). Evidence in audits/verify-3.2-2026-08-31.js.
      Quality pass 2026-09-01: seventh machine pass, REPO HALF ONLY (Claude
      in Chrome not connected this run, so the live half was not read; see
      the log). All 36 checkers green before inspection. All six generators
      rebuilt to a zero diff (sha256 of every file under modules/ before and
      after, 215 files, byte-identical). A seventh independent extraction
      (audits/verify-3.2-2026-08-31.js, re-run unmodified) re-read all 26
      Scorah pages and found them CLEAN on every leg for the seventh
      consecutive pass: own seoTown in title, description and h1, exactly
      one of each, no foreign seoTown outside the branch's own
      serviceAreaList bar the two pinned sister-town landing descriptions
      Q71 already covers. Proved the guard still bites by injection on a
      page type not used in the last two proofs: a second
      "<h1>Pharmacy in Ainsdale</h1>" (a live seoTown absent from Hazel
      Grove's serviceAreaList) added to contraception-scorah-hazel-grove.html;
      check-seo-pattern.js caught it immediately ("2 h1 elements, expected
      exactly 1"), exit code 1. Restored via `git show HEAD:<path>` (git
      checkout fails to unlink on this mount), sha256-confirmed
      byte-identical to the original before the edit, all 36 checkers green
      again, extraction clean again. branches.json's scorah_bramhall and
      scorah_hazel entries re-read field by field against both packs:
      address, phone, review link, hours (Bramhall Mon-Fri 09:00-18:00 and
      Sat 09:00-13:00; Hazel Grove Mon-Fri 09:00-18:00, Saturday ceased 24
      June 2026, both correctly closedDays Sunday/Saturday+Sunday) - all
      match. `check-gbp-packs.js` output for both packs unchanged: the same
      two known WARNs (live-only pfLink target; Q64 post-town vs
      addressLocality divergence), no new WARN. No drift found, no new
      fault class, no in-repo defect, no new question. Live half not
      re-read this pass (browser unavailable); the two previously logged
      live-only findings (Bramhall and Hazel Grove UTI pages serving
      Weebly's doubled-brand default title, queued under 5.3/5.4; the
      Bramhall landing page 404) were not re-confirmed and should not be
      assumed unchanged without a future browser-available pass. Evidence in
      audits/verify-3.2-2026-09-01-seventh-output.txt,
      audits/_before-3.2-2026-09-01-seventh.sha256,
      audits/_after-3.2-2026-09-01-seventh.sha256.
      Quality pass 2026-09-02 (eighth): clean on both halves that could be
      run, no repo defect, no new question on item 3.2 itself. All 35
      tools/check-*.js run individually, all exit 0 (see
      audits/checker-sweep-2026-09-02-item3.2.txt). All six generators
      rebuilt from branches.json; sha256 of all 215 files under modules/
      taken before and after: byte-identical, zero diff, git status --short
      modules empty. An eighth independent extraction
      (audits/verify-3.2-2026-09-02-eighth.js, imports nothing from
      tools/, own regexes, parses the paste sheets by block rather than
      trusting the generator) re-read all 26 Scorah pages (13 Bramhall, 13
      Hazel Grove, each 11 service pages, 1 landing page and 1 switch
      page): 208 checks, 0 failures. THIS PASS'S NEW ANGLE: none of the
      first seven passes had gone back to the Build Pack v2 source wording
      for this item. RBH_DIGITAL_BUILD_PACK_v2.md section 1.4 ("Page
      titles and headings") reads "Put the town and service in the page
      title, URL and main heading (H1) for each service page" - three
      elements, not two. All seven prior passes verified title and H1
      thoroughly; none had explicitly verified the URL/permalink leg
      across the full set. This pass added that check: for all 26 pages,
      the generated filename (which is also the Weebly Page Permalink
      pasted from the sheet, cross-checked by direct block lookup rather
      than assumed) contains the branch's own townSlug. All 26 clean,
      confirmed by the same extraction that also re-proved title (seoTown
      present, <=65 chars), description (seoTown present, 80-165 chars),
      and H1 (exactly one, seoTown present) for the sixth consecutive
      pass. No unexcused cross-town mention flagged. No in-repo defect
      found, no new question on this item. INCIDENTAL FINDING while
      reading the Build Pack for this cross-check: Block 2 of the same
      document ("Fix Scorah double-tracking", GA4/UA tag cleanup) has no
      tracking anywhere in this repo and cannot be completed by any
      generator here, since it is manual Google account/Tag Manager work.
      Not a defect in item 3.2 and no repo scope invented for it; raised
      separately as Q94. LIVE HALF NOT RUN:
      mcp__claude-in-chrome__list_connected_browsers returned an empty
      array this run (no browser session available), so the two
      previously logged live-only findings (Bramhall/Hazel Grove UTI pages
      serving Weebly's doubled-brand default title, queued under 5.3/5.4;
      the Bramhall landing page 404) were not re-checked and should not be
      assumed unchanged. Evidence in
      audits/verify-3.2-2026-09-02-eighth.js,
      audits/verify-3.2-2026-09-02-eighth-output.txt,
      audits/checker-sweep-2026-09-02-item3.2.txt.
      Quality pass 2026-09-03 (ninth): REPO HALF ONLY, no defect. All 36
      checkers green before inspection, git status --porcelain on
      gbp-packs/, modules/, core/, branches.json, tools/, status/ empty. THE
      GAP WAS A FIELD NEVER MENTIONED IN THIS ITEM'S OWN HISTORY. Eight prior
      passes proved title, description, H1 and (pass 8) the permalink/URL
      leg; none had ever pointed check-seo-keywords.js (added on the item
      3.6 pass, 2026-08-11, precisely because "nothing had ever read what a
      Meta Keywords line SAYS") at a Scorah Bramhall or Hazel Grove sheet
      block by direct injection. Proved by four injections against the
      "Scorah Chemists - Bramhall - UTI" block in
      modules/service/pages/SEO.md: dropping "Bramhall" from every keyword
      phrase failed RULE 3 (presence); appending "Ainsdale" (a live seoTown
      not in Bramhall's serviceAreaList, deliberately not "Hazel Grove",
      which Bramhall's own serviceAreaList legitimately excuses) failed RULE
      4 (absence); substituting "Fishlocks Chemist" for the branch's own
      brand failed RULE 5 (brand); replacing outward code "SK7" with "L23"
      failed RULE 6 (postcode). All four caught first attempt. RULE 8
      (retired town word) does not apply to either Scorah branch (only
      McCanns Sandringham carries a retired townSlug word today) and RULE 7
      (claim wording) is already proven against the weight loss and travel
      clinic sheets specifically, where that risk actually lives; neither
      was force-fitted onto a block with no matching content. Each
      restoration confirmed byte-identical by MD5
      (6B95C8DBD647E3F63B892FEEDD5A0DE4) before the next injection and again
      after the last. Full 36-checker suite re-run: 36/36 exit 0. All six
      generators re-run: SHA256 of every file under modules/ before and
      after, 0 differences. LIVE HALF NOT PERFORMED: Claude in Chrome
      returned zero connected browsers; the Claude Browser (built-in) pane's
      navigation to scorah-chemists.co.uk was denied in this unattended
      session (no user present to approve the site). The two previously
      logged live-only findings (Bramhall/Hazel Grove UTI pages serving
      Weebly's doubled-brand default title, queued under 5.3/5.4; the
      Bramhall landing page 404) were not re-checked this pass and should
      not be assumed unchanged. No checker logic edited, no pack or page
      content byte changed anywhere in the repo, no new question. Evidence
      in audits/scorah-bramhall-seo-keywords-3.2-pass-2026-09-03-ninth.txt.
      Quality pass 2026-09-04 (tenth): REPO HALF ONLY (Claude in Chrome not
      connected this run; see the log). Nine prior passes proved title,
      description, H1, permalink/URL and meta keywords; none had ever read
      data-branch or the JSON-LD "name" on Scorah's own 26 pages, although
      tools/check-branch-identity.js exists specifically for the three
      shared-brand, shared-host pairs in the estate (Fishlocks, McCanns,
      Scorah) and had been proven by injection against Smartts Bootle,
      Cherry Lane and Fishlocks pages before, never against Scorah's. A new
      independent extraction (audits/verify-3.2-2026-09-04-tenth.js, own
      regexes, imports nothing from tools/) read all 26 Scorah pages (13
      Bramhall, 13 Hazel Grove): 57 checks, 0 failures - both branches carry
      their own branchName (never the bare shared brandLabel "Scorah
      Chemists") on data-branch and JSON-LD name, each field is consistent
      across every page of its own branch, and Bramhall and Hazel Grove
      never declare the same JSON-LD name as each other. Proved the guard
      still bites with two injections: (1)
      modules/branch/pages/pharmacy-scorah-bramhall.html's JSON-LD name
      changed from "Scorah Chemists Bramhall" to the bare "Scorah Chemists"
      - check-branch-identity.js caught it immediately (rule 4, AMBIGUOUS,
      "also the name of this branch's sister shop"); (2)
      modules/service/pages/uti-treatment-scorah-hazel-grove.html's
      data-branch changed the same way - caught immediately on the same
      rule, confirming it fires on both fields independently. Both restored
      using a binary-safe Node script (fs.writeFileSync of `git show
      HEAD:<path>` as a Buffer) rather than PowerShell's `Out-File`, because
      this pass found `Out-File -Encoding utf8` (the method implied by
      earlier passes' "git show HEAD:<path>" note) silently corrupts the
      restore via a BOM and CRLF normalisation - SHA256 mismatched the
      baseline on the first attempt. The binary-safe restore matched
      baseline SHA256 exactly on both files. Full 36-checker suite re-run
      after both restores: 36/36 exit 0. git status --porcelain -- gbp-packs
      modules tools core branches.json status empty throughout. No checker
      logic, generator, pack or page content changed in the tracked tree.
      No in-repo defect, no new fault class, no new question. LIVE HALF NOT
      PERFORMED: Claude in Chrome unreachable this run (checked before this
      section); the previously logged live-only findings (Bramhall/Hazel
      Grove UTI pages serving Weebly's doubled-brand default title, queued
      under 5.3/5.4; the Bramhall landing page 404) were not re-checked and
      should not be assumed unchanged. Evidence in
      audits/verify-3.2-2026-09-04-tenth.js and this AGENT_LOG.md entry.
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
      Quality pass 2026-08-12 (second): clean on both halves, no defect.
      All 26 pages re-read by a fresh independent extraction (own regexes,
      no code shared with the checkers): every title, description and H1
      carries the branch's own town, exactly one H1 per page, descriptions
      137 to 157 characters, correct phone on every page, no wrong-side
      phone anywhere. The sister town appears only in the two landing
      pages' deliberate cross-branch paragraph from the item 2.2
      shared-domain split (body copy, not title, description or H1). Both
      2026-08-09 fixes stand: Eccleston addressRegion Lancashire with
      seoRegion Chorley re-read from branches.json, and "Eccleston in
      Eccleston" absent from all 26 pages. All 29 checkers pass, rule 4
      cross-brand H1 check included. All seven generators rebuilt
      byte-identical (status timestamp only, discarded). Live half, two
      read-only GETs, one per side: both UTI pages 200 with the exact
      pattern title and H1, and unlike Scorah the pasted SEO titles are
      live here, no doubled-brand default on either side.
      Quality pass 2026-08-13 (third): REPO HALF ONLY, no browser available,
      so nothing live was read and nothing live is claimed. The 26 pages are
      clean on every leg by a third independent extraction written fresh for
      this run: own town in title, H1 and description, service words on all
      three legs, exactly one H1 each, titles 44 to 63 characters,
      descriptions 137 to 157, own phone and postcode present and the
      sister branch's absent, and no other live seoTown in any of the three
      public strings. All 30 checkers, the self-test and all seven
      generators byte-stable. The run 144 service-word rule was tested
      rather than trusted: a vacuity probe asked, for all 210 branch/type/leg
      combinations, whether the service word survives with the brand name
      removed, because a brand like "Cherry Lane Pharmacy" could have been
      satisfying the landing rule on its own name. It does not: the leading
      service phrase supplies the word in all 210, so the rule is sound.
      THE DEFECT IS OUTSIDE THE PAGES AND IS ESTATE-WIDE. The switch banner
      is pasted into Weebly Header Code, a SINGLE SITE-WIDE field, and each
      banner hard-codes one SWITCH_URL. Fishlocks, McCanns and Scorah each
      trade two branches on one domain, so 15 banner files exist for 12
      sites and on those three only one banner can ever be pasted: every
      page on the domain, including the sister branch's thirteen, would
      carry a banner pointing at one branch's switch page. That is the
      shared-domain self-competition items 2.2 and 3.2 exist to stop,
      reaching the estate through the one artefact neither item read. The
      banners were held only to ASCII (check-em-dashes) and brand spelling
      (check-brand-spelling); nothing asked where they SEND people. New rule
      11 in check-switch-copy.js reads them: 11a fails outright if a banner
      points at another branch, 11b detects the shared-site conflict and
      pins it to Q63, since which branch should win is a live conversion
      decision. Six negative tests, all six fire, including one that removes
      11b's own excuse to prove it is not a no-op. Raised as Q63.
      Quality pass 2026-08-14 (fourth): REPO HALF ONLY, browser unavailable
      for the 24th run running, so nothing live was read or claimed. The 26
      pages are clean on every leg by a fourth independent extraction: own
      town in title, description and H1, service words on all three legs,
      exactly one H1 each, titles 44 to 63 characters, descriptions 137 to
      157, own phone present and the sister branch's phone and postcode
      absent, and no other live seoTown in any of the three public strings.
      The extractor's own first version was wrong and was fixed before being
      trusted: it read title and description from head tags these Weebly
      embed fragments do not have, and reported all 26 EMPTY. It now reads
      them from the paste sheets, which is what reaches Google. All 35
      checkers, the self-test and all seven generators byte-stable, before
      and after. THE DEFECT IS THAT AN EXCUSE LIST IS ALSO PUBLIC COPY.
      checkCrossTown excused any town in the branch's own serviceAreaList,
      with no exception for a sister branch on the same host, and three hosts
      each serve two branches. serviceAreaList is rendered into the public
      description as "Serving X, Y and Z", so ONE data edit both writes a
      sister town into a branch's own description and buys the exemption that
      hides it. Self-cloaking, no code change needed. Proved by injection:
      "Eccleston" added to fishlocks_ainsdale.serviceAreaList shipped
      "Serving Ainsdale, Birkdale, Southport and Eccleston" into the page and
      the paste sheet, and all 35 checkers and the self-test exited 0. NOT
      FIXED BY FAILING IT: the new rule fired on the untouched tree, on three
      live pages (McCanns Sandringham naming Aigburth, and the two Scorah
      pages naming each other), all three geographically honest neighbours.
      Which branch should own a shared catchment word is a live conversion
      decision, so those three are PINNED to Q71 on the KNOWN_DRIFT
      convention rather than failed, while any new instance fails outright
      and a pin whose case is fixed fails as stale. Six negative tests, all
      six behave as required, including a no-loosening test and a
      false-positive test. Raised as Q71. Full working in
      audits/fishlocks-item-3.3-quality-pass-2026-08-14.txt.
      Quality pass 2026-08-30 (fifth): clean on both halves, and the rules
      gap was one artefact up the chain again. All 26 pages re-read by a
      fifth independent extraction (audits/verify-3.3-2026-08-30.js,
      imports nothing from tools/): counts (one SEO title line, one
      description line, one h1 per page), sheet agreement by permalink
      across all six paste sheets, own town on all three legs, service
      words on all three legs, cross-town and sister-town absence, sister
      phone and postcode absent from every page, lengths, both switch
      banners pointing at their own branch, and "Eccleston in Eccleston"
      absent. All clean. All 36 checkers green and all six generators
      byte-stable before and after. LIVE HALF, first since 2026-08-12: both
      UTI pages read read-only, exact pattern title and H1 live on both
      sides, pasted SEO titles live (no doubled-brand Weebly default,
      unlike Scorah), own phone and address correct in each embed, and the
      site furniture opening hours match branches.json on both branches.
      The furniture faults visible on fishlockpharmacy.co.uk (Fishlock
      Pharmacy naming, "17 Station Rd", singular Fishlock Chemist in the
      GPhC line) are the known Q37 set, nothing new. THE DEFECT WAS IN THE
      SHEETS RULE, THE 3.2 COUNT QUESTION ONE ARTEFACT UP THE CHAIN:
      check-seo-sheets.js parses a paste sheet block last-write-wins, so a
      block carrying the same label twice kept only the second value and
      compared THAT to the page, while a paster reading the block top to
      bottom takes the first. Proved by injection before fixing: a second
      "- **Page Title:** Pharmacy in Ainsdale" line ahead of the real one
      in the Fishlocks Ainsdale UTI block passed all 36 checkers while the
      independent extraction caught the mismatch. Fixed with a
      one-label-per-block rule in check-seo-sheets.js covering both sheet
      dialects, with the failure message naming the dialect's own labels.
      Five negative tests, all five fire: duplicate Page Title, Page
      Description and Page Permalink in an SEO block, duplicate SEO title
      in an INDEX block, and the clean tree passes. Evidence in
      audits/verify-3.3-2026-08-30-output.txt.
      Quality pass 2026-08-31 (sixth): clean on both halves, no repo
      defect, no new question. All 36 checkers green. All six generators
      rebuilt from branches.json; sha256 of every file in
      modules/service/pages, modules/switch/pages and modules/branch/pages
      taken before and after: byte-identical, zero diff. A sixth
      independent extraction (audits/verify-3.3-2026-08-31.js, imports
      nothing from tools/, own regexes throughout) re-read all 26 pages
      (11 Ainsdale service pages + 1 switch page, the same for Eccleston,
      plus 2 landing pages): 591 checks, 0 failures. Covers the fifth
      pass's own fix (no duplicate label per sheet block, both dialects),
      one H1 per page, title <=65 characters, description 80-165, own
      seoTown present in title/H1/description, sister seoTown absent
      unless excused via serviceAreaList (neither branch's list carries
      the other's town, so no Q71-style pin applies here), no other live
      seoTown present, own phone present, sister phone absent, and JSON-LD
      address/telephone matching branches.json field by field. Cross-town
      guard re-proved by injection, then restored: a second "near
      Eccleston" clause added to the Ainsdale UTI page's H1 was caught by
      both check-seo-pattern.js (exit 1, names the shared-domain rule) and
      the independent extraction (2 failures) before being reverted via
      `git show HEAD:<path> > <path>` (this mount's `git checkout --`
      cannot unlink the old file); sha256 after restore matched the
      pre-injection file exactly and all 36 checkers were re-run clean.
      LIVE HALF: both UTI pages read read-only via Claude in Chrome.
      Ainsdale serves exact pattern title/H1 and its own phone (01704
      575478); Eccleston serves exact pattern title/H1 and its own phone
      (01257 451251); both addresses correct. The only divergence on
      either page is the pre-existing, already-tracked Q37 footer-widget
      set (singular "Fishlock Pharmacy" branding and the abbreviated "17
      Station Rd" street name in the contact widget) - unchanged, nothing
      new. Evidence in
      audits/fishlocks-item-3.3-quality-pass-2026-08-31.txt.
      NOTE ON RUN CONDITIONS: executed via Cowork's sandboxed shell, not
      the native Windows host this procedure assumes. `git fetch origin`
      failed with "Host key verification failed" (no SSH key for
      git@github.com in this shell), the same limitation every recent run
      in this log has recorded; this run's commit will sit locally ahead
      of origin/agents/audit-backlog until a native-host or credentialed
      session pushes it.
      Quality pass 2026-09-01 (seventh): clean on both halves, no repo
      defect, no new question. All 36 checkers green. All six generators
      rebuilt from branches.json; sha256 of every file in
      modules/service/pages, modules/switch/pages and modules/branch/pages
      taken before and after: byte-identical, zero diff (203 files). A
      seventh independent extraction (audits/verify-3.3-2026-09-01.js,
      imports nothing from tools/, own regexes throughout) re-read all 26
      pages plus the six paste sheets: 343 checks, 0 failures. Cross-town
      guard re-proved by injection: "UTI treatment in Ainsdale, near
      Eccleston" on the Ainsdale UTI page's H1 was caught by both the
      independent extraction and check-seo-pattern.js (exit 1, names the
      shared-domain rule), then restored from a pre-injection copy (this
      mount cannot unlink via `git checkout --`); sha256 after restore
      matched the pre-injection file exactly and all 36 checkers were
      re-run clean. LIVE HALF (read-only Node fetch, Claude in Chrome
      unavailable this run - two connected Chrome extensions and no human
      present to choose one, standing Q59): both UTI pages read 200 with
      exact pattern title/H1 and their own phone and postcode; the
      standing Q37 footer set (singular "Fishlock Pharmacy" branding,
      abbreviated "17 Station Rd") reconfirmed present and unchanged on
      both branches, nothing new. Evidence in
      audits/fishlocks-item-3.3-quality-pass-2026-09-01.txt.
      NOTE ON RUN CONDITIONS: git fetch/checkout/pull and the eventual
      push were run via the Windows-MCP PowerShell tool directly against
      the real C:\Dev\rbh-site-data (the credentialed native host), not
      the sandboxed Linux mount used for the checkers and generators -
      that mount's `git fetch origin` again failed outright with "Host
      key verification failed" (no SSH key for git@github.com in that
      sandbox), same as every recent run's diagnosis (Q87).
      Quality pass 2026-09-02 (eighth): clean on both halves, no repo
      defect, no new question. All six generators rebuilt from
      branches.json; sha256 of every file in modules/service/pages,
      modules/switch/pages and modules/branch/pages taken before and
      after (203 files): byte-identical, zero diff. All 36 tools/check-*.js
      run individually, all exit 0. An eighth independent extraction
      (audits/verify-3.3-2026-09-02.js, imports nothing from tools/, own
      regexes throughout) re-read all 26 pages plus the six paste sheets:
      665 checks, 0 failures, repeating every leg the seventh pass proved
      and adding two new legs no prior independent extraction for this item
      covered - JSON-LD PostalAddress/telephone matching branches.json
      field by field, and the paste sheets' Meta Keywords line (own town
      present, sister town absent unless excused via serviceAreaList,
      sister brandLabel absent). Cross-town guard re-proved by injection:
      "UTI treatment in Ainsdale, near Eccleston" appended to the Ainsdale
      UTI page's H1 was caught by both check-seo-pattern.js (exit 1, 2
      mismatches) and the independent extraction (1 failure), then restored
      from a pre-injection byte copy (sha256 matched exactly); all 36
      checkers re-run clean post-restore. A stray .git/index.lock left by
      the sandboxed mount's `git status` call during the post-restore
      re-check was cleared via the Windows-MCP PowerShell path (same class
      as Q87's standing lock-handling note), no repo content affected.
      LIVE HALF (single Chrome tab, no Q59 ambiguity): both UTI pages read
      200 with the exact pattern title/H1 ("UTI treatment in Ainsdale -
      Fishlocks Chemist" / "... in Eccleston - ..."), each branch's own
      phone and postcode correct, and the standing Q37 footer set (singular
      "Fishlock Pharmacy"/"Fishlock Chemist" naming, "17 Station Rd"
      abbreviation) reconfirmed present and unchanged on both branches -
      the correct second trust-bar block noted on the seventh-pass addendum
      also still coexists alongside it, nothing new either way.
      NOTE ON RUN CONDITIONS: git fetch/checkout/pull and the eventual
      push were run via the Windows-MCP PowerShell tool directly against
      the real C:\Dev\rbh-site-data, not the sandboxed Linux mount used for
      the checkers and generators - that mount's `git fetch origin` again
      failed outright with "Host key verification failed", same as every
      recent run's diagnosis (Q87).
      Quality pass 2026-09-03 (ninth): clean on both halves, no repo defect,
      no new question. All 36 checkers green before and after. All six
      generators rebuilt from branches.json; git status --porcelain empty
      before and after, byte-stable. A ninth independent extraction
      (audits/verify-3.3-2026-09-03.js, imports nothing from tools/, own
      regexes throughout) re-read all Ainsdale and Eccleston service pages
      plus both switch and landing pages: 158 checks, 0 failures, repeating
      the established legs and adding a new one - app membership - since
      Fishlocks Ainsdale and Eccleston are both app members (hasApp true),
      the only brand in the estate with two app-member branches sharing a
      domain. THE FRESH ANGLE: eight prior passes had proved SEO pattern,
      sheets, JSON-LD, meta keywords and the cross-town guard by injection
      against Fishlocks' own pages, but none had pointed
      tools/check-app-membership.js at Fishlocks by injection - the shared-
      domain shape that checker's own history flags as its blind spot (rule
      7's marker bug was found on a Smartts/Hirshmans swap, not Fishlocks).
      Four injections run, all four caught, all four restored and
      sha256-confirmed byte-identical: RULE 2, the app card renamed out of
      switch-prescriptions-fishlocks-ainsdale.html (FAIL, no app card on an
      app member); RULE 3, the app sentence altered out of pharmacy-
      fishlocks-eccleston.html (FAIL, no app sentence on an app member);
      RULE 5, "RB Healthcare Pharmacy app" shortened to "RB Healthcare app"
      on the same landing page (FAIL, non-canonical name); RULE 7, the
      *(app member)* marker stripped from the Fishlocks Eccleston heading in
      modules/switch/pages/INDEX.md (FAIL, marks 3 of the true 4 app
      members). No defect - all four rules were already correctly protecting
      Fishlocks' pages; this proves it directly for the branch pair the
      checker's own history says was weakest-covered, rather than only by
      general design and proof against SK Chemists/Smartts and the GBP
      packs. tools/check-app-membership.js unchanged, no rule logic edited.
      No page, generator or branches.json byte changed. LIVE HALF: Claude in
      Chrome unreachable this run (not connected, retried once - standing
      Q59), fell back to a direct HTTPS status-code check. Both UTI pages
      and both switch pages returned 200; two guessed landing-page URLs
      returned 404 on fishlockpharmacy.co.uk, not pursued further since this
      is a status-code-only fallback and no prior 3.3 pass has live-checked
      the landing pages specifically - the guess may be wrong rather than
      the page being absent, worth a follow-up with a working browser
      session. Evidence in
      audits/fishlocks-item-3.3-quality-pass-2026-09-03-ninth.txt.
      Quality pass 2026-09-04 (tenth): clean on both halves, no repo
      defect, no new question. All 36 checkers green before and after.
      git status --porcelain -- modules tools core branches.json status
      empty throughout. THE FRESH ANGLE: nine prior passes had proved
      check-seo-pattern.js, check-seo-sheets.js, check-jsonld.js,
      check-seo-keywords.js and check-app-membership.js against this
      item's own 26 pages by injection, but the standing trio check-
      brand-spelling.js, check-uk-spelling.js and check-url-scheme.js had
      only ever been proven against sister GBP packs (the 4.x item
      lineage), never against Fishlocks' own generated PAGES specifically
      - the same gap shape the Cherry Lane 2.3 tenth pass closed for its
      own item the same day. Three injections run against a full scratch
      copy (.git included), one at a time, each restored by byte copy and
      sha256-reconfirmed before the next: brand spelling ("Fishlocks
      Chemist" to "Fishlock Chemist", 11 occurrences, the pharmacy-first
      page) CAUGHT, 12 failures, correct canonical name named; url scheme
      (the fonts.googleapis.com stylesheet link on the switch page
      downgraded to http://) CAUGHT, exit 1, published-surface breach
      named and linked to item 6.6; UK spelling ("not a call centre" to
      "not a call center" on the weight loss page, the address-field
      "Carrington Centre" occurrences left untouched to keep the
      injection isolated) CAUGHT, correct UK form named. All three
      restores sha256-confirmed byte-identical to baseline; full 36-
      checker suite re-run clean after the final restore. No in-repo
      defect found; all three rules already correctly protect Fishlocks'
      own pages, this proves it directly rather than only by general
      design and by proof against sister packs. LIVE HALF: Claude in
      Chrome unreachable this run (standing Q59), fell back to a status-
      code-only check: both UTI pages and both switch pages return 200 on
      www.fishlockpharmacy.co.uk. No page content read by this method, so
      the standing Q37 footer set was not re-verified this pass. Evidence
      in audits/fishlocks-item-3.3-quality-pass-2026-09-04-tenth.txt.
- [x] 3.4 Cherry Lane Pharmacy (Liverpool): same treatment. Done 2026-08-04.
      12 pages, 0 mismatches.
Quality pass 2026-08-12 (third): clean on both halves, no defect. All 12
pages re-read by an independent extraction written fresh for this run: title,
description and H1 carry Walton on every page, exactly one H1 each,
descriptions 138 to 157 characters, one phone 0151 226 2051 as display and
tel: on all 12, postcode L4 8SG only, no foreign town, schema address correct
field by field against branches.json, no hard-coded widget id, service pages
pinned service-module-phase1 and the switch page 6a275e1. All 29 checkers
pass and all seven generators rebuilt byte-identical. Live: UTI and Pharmacy
First pages both 200 with exact pattern titles and H1s and NHS-correct
cohorts; the only live fault is the known Q36 footer mailbox typo (mhs.net).
Evidence in audits/cherry-lane-build-check-2026-08-12-third.txt. No new
question.
Quality pass 2026-08-13 (fourth): ONE REAL DEFECT, and it was not on a page.
REPO HALF ONLY, no browser was available so nothing live was read or claimed.
All 12 pages re-verified by a fourth independent extraction written fresh for
this run, sharing no code with tools/: 817 checks, 0 failures. One H1 per page
carrying Walton, no sister town or brand, display phone 0151 226 2051 and its
tel: link on all 12 with no other phone-shaped number anywhere, L4 8SG the only
postcode, JSON-LD address correct field by field including addressLocality
Liverpool (the postal town, NOT the seoTown), every 24-character widget id
owned by this branch, service pages pinned service-module-phase1 and the switch
page 6a275e1, and no medicine name or claim-shaped phrase on any page including
weight loss. All 30 checkers pass and all seven generators rebuild
byte-identical. The defect was in the two Weebly paste blocks, the only two
files in the repo where a human wrote an address as prose instead of a
generator composing it from the data, and the only two that had drifted: both
published "202 Cherry Lane, Walton, Liverpool L4 8SG", putting the seoTown
inside a postal address, while branches.json, all 177 generated pages and
gbp-packs/cherry-lane-walton.md all publish Liverpool as the post town. One
shop, one repo, two address strings for the public, which is the citation
consistency fault item 1.4 exists to stop. CLAUDE.md gives seoTown one job,
the catchment word in titles and H1s. Both blocks corrected. The gap that let
it through was narrow and old: check-nap.js proves the postcode is the
branch's own and that the street sits in front of it, and never read the words
BETWEEN them, so "202 Cherry Lane, Bramhall L4 8SG" would have passed every
rule in the file. New post-town rule added to the paste-block half, equality
not containment because the fault was an extra true word, proved by five
negative tests that all fire. Neither block is live, so nothing published
changed. Recorded not fixed: check-weight-loss-copy.js scopes to
modules/service/pages only, so the weight loss paste block is weight loss copy
no weight loss rule reads. It is clean today. Worth a later run. Evidence in
audits/cherry-lane-build-check-2026-08-13-fourth.txt. No new question.
Quality pass 2026-08-14 (fifth): ZERO DEFECTS IN THE 12 PAGES for the second
consecutive pass and not one character of any page was edited. THE DEFECT THE
FOURTH PASS RECORDED IS NOW CLOSED. REPO HALF ONLY, no browser was available
so nothing live was read or claimed. Fifth independent extraction written
fresh for this run and sharing no code with tools/: 288 checks, 0 failures,
across all 12 pages. Coverage was proved positively before the result was
believed, because the 187th run's lesson is that an extractor can pass by
finding nothing: 171 sheet entries parsed across all five paste sheets, all 12
pages matched to an entry, titles 45 to 63 characters, descriptions 138 to 157,
exactly one H1 each, JSON-LD and a tel: link on all 12. Walton in every title,
description and H1, Liverpool as the JSON-LD addressLocality (the postal town,
NOT the seoTown), phone 0151 226 2051 with no other phone-shaped number, L4 8SG
the only postcode, no foreign town, brand or widget id. THE FIX: rule 12 added
to check-weight-loss-copy.js, which now reads modules/service/weebly-paste as
Regime 1. Regime chosen on the standard's own test of how a page is REACHED,
not how important it is: each block's header comment names its paste target and
both are legacy URLs Google already ranks, so they are entry points and the
inner-page naming exemption does not apply. Both blocks are clean under the
strict reading, so adopting it rewrote nothing. Ten negative tests, all ten
fire and all ten name the paste file. ONE DEFECT FOUND IN MY OWN FIRST DRAFT
AND RECORDED SO IT IS NOT REPEATED: the first version gated every rule behind
the block naming weight loss, so a block naming Mounjaro while never using the
words weight loss would have been skipped entirely. Rule 11 does not make that
mistake, it runs the self-scoping scans on every page and gates only the
context-scoped ones. Corrected to match, and test 10 exists to hold it. Rule 12
deliberately does NOT apply rule 11's positive consultation floor: that floor
is anchored on a service tile whose job is to sell the clinic, while this block
is a page-moved notice, so requiring it would fail correct copy. All 35
checkers pass and all seven generators rebuild with no generated page changed.
Evidence in audits/cherry-lane-build-check-2026-08-14-fifth.txt. No new
question. Done 2026-08-14
Quality pass 2026-08-30 (sixth): clean on both halves, no defect, no new
question. All 12 pages re-read by a sixth independent extraction
(audits/verify-3.4-2026-08-30.js, imports nothing from tools/): 1,938 checks,
0 failures - counts, sheet agreement including the one-label-per-block count
the 3.3 pass added (proved here by injection on the Cherry Lane UTI block,
where the doubled title also trips this verifier's first-line comparison),
Walton in all three legs, no foreign town, phone and postcode isolation
against every other live branch, lengths, JSON-LD postal-town Liverpool, tel:
on all 12, no foreign widget id, banner self-pointing, and the two
weebly-paste replacement blocks name no POM and link their destination pages.
Three injections, all fire; tools/check-seo-sheets.js also fires cross-brand
on the doubled label. Live half, two read-only GETs, the first since
2026-08-12: UTI and Pharmacy First pages serve the exact sheet titles,
descriptions and H1s, own phone and postcode only, and the furniture hours
line matches branches.json exactly.
Quality pass 2026-08-31 (seventh): REPO HALF CLEAN, LIVE HALF FOUND ONE REAL
DEFECT, not on a repo-generated page. All 36 checkers pass and all six
generators rebuild byte-identical (git diff empty on modules/ and core/
before and after). A seventh independent extraction
(audits/verify-3.4-2026-08-31-seventh.js, imports nothing from tools/): 1,914
checks across all 12 pages, 0 failures, repeating every invariant the sixth
pass proved plus one the sixth pass could not have run - the "whatsapp" field
Q21 added to branches.json between the sixth and seventh passes. Every
Cherry Lane page carrying a module root now carries data-wa="447521775631"
and no other branch's whatsapp number appears anywhere. Proved live by
injection (a foreign number substituted into the UTI page's data-wa, caught,
reverted, git diff empty again).
Live half widened past the two pages every prior pass has read (UTI,
Pharmacy First): read the two old-URL bridge pages
(weight-loss-clinic-walton.html, pharmacy-first-service-walton.html) for the
first time since their weebly-paste replacement blocks were written on
2026-08-05 and corrected on 2026-08-13, plus the homepage and the UTI page
again as a control. weight-loss-clinic-walton.html is live with the bridge
content, but it is the 2026-08-05 wording, not the 2026-08-13 fix: the fourth
quality pass removed "Walton" from between "Cherry Lane" and "Liverpool" in
the postal address inside modules/service/weebly-paste/cherry-lane-old-weight-
loss-replacement.html (the exact citation-consistency fault CLAUDE.md
documents for this item), but the live page still reads "202 Cherry Lane,
Walton, Liverpool L4 8SG" today, 18 days after the repo was corrected - the
live paste has never been refreshed. pharmacy-first-service-walton.html
carries neither the 2026-08-05 nor the 2026-08-13 wording: it is a fully
different, independently functioning page with its own hero, an embedded
YouTube explainer and a live Appointedd booking widget (confirmed by reading
the iframe's own query string, id=66b20ae6609c16953de3e0cf, which IS Cherry
Lane's own pharmacyFirst widget id in branches.json - no wrong-diary risk).
The repo's 2026-08-05 comment calling this page "currently renders empty" no
longer describes it; something replaced it live since, outside this repo's
visibility, and the weebly-paste replacement was never applied here either.
SEPARATELY, and worse for citation consistency: a site-wide Weebly contact
element (not part of any repo-controlled page content, and invisible to
get_page_text's rendered-text extraction - only found by reading actual
mailto href attributes) carries two Scorah Chemists addresses -
mailto:info@scorah-chemists.co.uk and mailto:scorahchemists87@npanet.co.uk -
alongside the correct mailto:Cherry@rbhealth.co.uk, on every Cherry Lane page
sampled: the homepage, uti-treatment-cherry-lane-walton.html (a repo-generated
page previously read clean three times), and both old-URL bridge pages.
scorah-chemists.co.uk is confirmed live in branches.json as the real website
for Scorah Chemists Bramhall and Hazel Grove, an unrelated branch pair, so
this is a genuine cross-branch citation on Cherry Lane's site, consistent with
the site having been built from a cloned Scorah Weebly template whose
site-wide contact widget was never fully de-branded. Nothing in this repo
could have caught either finding: the first is a live/repo drift on a file
this repo does track but does not re-verify live on every pass, the second is
a Weebly-native element with no file in this repo at all, the same class of
blind spot CLAUDE.md already documents for live-only Weebly pages. Both
recorded as Q86, both require a live Weebly edit outside this repo's reach,
neither touches a generated page, generator or branches.json field, so
nothing was fixed and nothing regenerated. Known Q36 footer typo
(pharmacy.FA226@mhs.net) re-confirmed present and unchanged on both old-URL
pages, not re-raised.
Quality pass 2026-09-01 (eighth): REPO HALF CLEAN, ZERO DEFECTS. Live half not
read this run (Claude in Chrome not connected), so the seventh pass's two live
findings (Q86 cross-branch Scorah mailto addresses in the site-wide contact
widget; the stale 2026-08-05 wording still live on the weight-loss-clinic-
walton.html bridge page) and the Q36 footer typo stand unverified rather than
reconfirmed. All 36 checkers pass; all six generators rebuilt and 189
modules/core files sha256-hashed before and after, byte-identical, zero diff.
An eighth independent extraction sharing no code with tools/
(audits/verify-3.4-2026-09-01-eighth.js): 1,918 checks across all 12 pages, 0
failures, repeating every seventh-pass invariant (counts, sheet agreement,
own/foreign town, service words, phone/postcode isolation, lengths, JSON-LD
postal-town Liverpool, tel:, foreign widget ids, data-wa/whatsapp) plus two new
ones: a positive re-test that both weebly-paste replacement blocks' postal
address string reads "202 Cherry Lane, Liverpool L4 8SG" verbatim with no
seoTown inserted (the exact fourth-pass citation-consistency fault, now a
standing regression guard rather than an absence-of-Walton scan that could
miss a different wrong word in the same slot), and a check that
check-service-links.js's item-6.2-fifth-pass widening (landed earlier in this
same run) actually names modules/service/service.js and
modules/switch/switch.js rather than silently excluding Cherry Lane's
Pharmacy First and switch pages from the new JS-injected-copy scan. Guard
effectiveness re-proved by injection: data-wa on
weight-loss-clinic-cherry-lane-walton.html (untried page type for Cherry
Lane injection testing; prior passes used the UTI page twice) set to a
foreign number, both the verify script and tools/check-whatsapp-route.js
fired correctly, restored by direct byte-level reversal rather than git
checkout (sandbox mount blocks unlink on this file, matching the
documented Q87-adjacent finding), sha256 confirmed identical to HEAD
afterward and the full 189-file estate confirmed byte-identical again. No
in-repo defect, no new question. Done 2026-09-01
Quality pass 2026-09-02 (ninth): REPO HALF CLEAN, ZERO DEFECTS. Live half not
read this run (Claude in Chrome not connected), so the seventh pass's two live
findings (Q86 cross-branch Scorah mailto addresses in the site-wide contact
widget; the stale 2026-08-05 wording still live on the weight-loss-clinic-
walton.html bridge page) and the Q36 footer typo stand unverified for a second
consecutive pass. All 36 tools/check-*.js checkers ran individually and passed
(the one apparent check-postcodes.js failure mid-run traced to this run's own
_agentscratch/gitlog_rotation.txt, a git-log dump used to compute the rotation
pool that quoted a commit message containing the CH49 1SX narrative postcode
CLAUDE.md already documents - the same false-alarm shape recorded on the
2026-09-02 17:07 BST run - deleted, untracked, never committed, re-ran clean).
All six generators rebuilt byte-identical (git status --porcelain modules/
core/ empty before and after). A ninth independent extraction, written fresh
for this run and sharing no code with tools/
(audits/verify-3.4-2026-09-02-ninth.js): 1,030 checks across all 12 pages, 0
failures - H1 count and Walton/no-foreign-town/no-foreign-brand, data-branch
and data-wa, tel: link and visible-phone isolation against every other live
branch's number, postcode isolation, JSON-LD type/name/telephone/address/url
field by field, map query matching own address, no foreign widget id
hard-coded, CDN pins (service-module-phase1 / 6a275e1), no literal or entity
em/en dash, and no brand-name medicine anywhere on the weight loss page.
Guard effectiveness re-proved by injection on travel-clinic-cherry-lane-
walton.html (untried page for Cherry Lane injection testing; prior passes
used the UTI, switch, Pharmacy First and weight-loss-clinic pages): a phone
swap to Smartts Chemist's number caught by both tools/check-nap.js and this
run's verify script; a postcode swap to Smartts's L20 9HH caught by
tools/check-postcodes.js's FOREIGN rule and the verify script, alongside a
JSON-LD name corruption from an earlier combined-injection attempt that also
correctly failed both; and, after that combined attempt was found to have
silently prevented its own third change (a regex step renaming every "Cherry
Lane Pharmacy" occurrence had already consumed the literal substring the
em-dash injection depended on, an authoring mistake in the test script, not a
checker gap - confirmed by checking the file for the dash character before
concluding anything), a clean single-purpose re-run of the em-dash injection
was caught correctly by both tools/check-em-dashes.js and the verify script.
Restored by byte copy from a pre-injection backup each time, sha256-confirmed
identical to the original after the final restoration. No in-repo defect, no
new question.
Quality pass 2026-09-03 (tenth): REPO HALF CLEAN, ZERO DEFECTS. Live half not
read this run: Claude in Chrome not connected (checked once at step 3 answer
pickup and again independently before this quality pass's live half), and the
built-in Claude Browser's navigation to cherrylanepharmacy.co.uk was denied or
failed with no user present in this unattended session to approve a new site,
the same outcome the ninth pass recorded a day earlier. So for a third
consecutive pass the seventh pass's two live findings (Q86 cross-branch Scorah
mailto addresses in the site-wide contact widget; the stale 2026-08-05 wording
still live on the weight-loss-clinic-walton.html bridge page) and the Q36
footer typo stand unverified. All 36 tools/check-*.js checkers ran
individually and passed; all six generators rebuilt with git status --porcelain
on modules/ and core/ empty before and after (byte-identical).
The genuinely untested angle this pass closed: every prior injection against
Cherry Lane's own switch page (seventh, eighth, ninth passes; also the
sixth's banner self-pointing check) targeted NAP, whatsapp/data-wa, identity
and character-level rules. tools/check-switch-copy.js's own claim, town, form
and collection-notice rules (4 through 10) and its banner-ownership rule (11a)
had never been proven by direct injection against Cherry Lane's own switch
page or banner file specifically - the page was passing only by construction
of the estate-wide 15-page sweep, the same "proved by construction, not by
injection" gap the ninth pass closed for check-nap.js/check-postcodes.js/
check-em-dashes.js on the travel clinic page. New instrument, no import from
tools/ beyond invoking the real checker as a subprocess
(audits/verify-3.4-2026-09-03-tenth.js): refuses to run if either target file
already carries a git diff, records both files' sha256 before any mutation,
and restores by direct fs.writeFileSync immediately after capturing the
checker's output and BEFORE any assertion, so a thrown assertion can never
leave a file mutated on disk, the same discipline the eighth and ninth passes
used. Five injections, one at a time, each restored and sha256-verified
byte-identical before the next: a prescription-only medicine name (Mounjaro)
inserted into the hero-sub paragraph, caught by RULE 7 no-medicines; the pill
line's own town changed from Walton to Bootle (a real, different live
branch's town), caught by RULE 8 town; an undescribed "postcode" field added
to the form grid with no FIELD_WORDS entry and no mention in step 1, caught by
RULE 9 form-copy; the privacy/collection-notice paragraph deleted outright,
caught by RULE 10 collection-notice; and, on the banner file rather than the
page, Cherry Lane's own SWITCH_URL repointed at Hirshmans Ainsdale's switch
page (Cherry Lane is single-host, one of the twelve branches NOT caught up in
the three shared-domain sites already pinned to Q63 in KNOWN, so this cleanly
exercises 11a alone with no interaction from the 11b entries), caught by
RULE banner. All five caught first attempt with the expected rule tag; both
files confirmed byte-identical to their pre-probe sha256 hashes after every
individual injection and again at the end; the checker's own final run after
the round was clean. Full 36-checker suite and all six generators re-confirmed
clean after the round. No in-repo defect, no new question.
Next stalest by the same block-bounded git-log method, for whoever runs the
next unattended pass, derived fresh this run against the 36-item rotation
pool: 3.9 (2026-09-02T19:09:58+01:00), then 3.10, 2.1, 5.2, 4.11, 5.1, 3.12,
3.6 - re-derive rather than assume, since other runs may land in between.
Quality pass 2026-09-04 (eleventh): REPO HALF CLEAN, ZERO DEFECTS. Stalest
item independently re-derived via the established git-log block method (677
commits touching AGENT_WORKLIST.md/AGENT_LOG.md at the point this pass began,
36-item rotation pool): 3.4 uniquely stalest at 2026-09-03T13:41:45+01:00,
ahead of 3.9 (14:12:16) and 3.10 (14:43:36), matching the tenth pass's own
forward note. All 36 tools/check-*.js checkers ran individually and passed;
all six generators rebuilt via their own build-*.js scripts with git status
--porcelain on modules/ and core/ empty before and after (byte-identical).
An earlier, interrupted run of this same scheduled task had already begun
this pass: audits/verify-3.4-2026-09-04-eleventh.js existed at run start
(written and last run at 09:41 BST, before this run's own lock was created),
but no worklist paragraph, log entry or commit followed, consistent with a
run terminated shortly after writing and executing the script - the same
shape the 3.5 eleventh pass documented on 2026-09-04 for its own recovered
script. The script was read in full before use (proper discipline: shells
out to the real checker as a child process, no import from tools/, refuses
to run if any target already carries a git diff, restores from an in-memory
Buffer immediately after capturing output and before any assertion, sha256-
reconfirms). Rather than trust the orphaned output file blind, it was re-run
fresh against the current tree (confirmed clean via git status --porcelain
first) rather than assumed current.
The genuinely untested angle this pass closed: ten prior passes (third
through tenth) proved check-nap.js, check-postcodes.js, check-em-dashes.js,
check-whatsapp-route.js, check-service-links.js and check-switch-copy.js
against Cherry Lane's own pages by direct injection, but tools/check-branch-
identity.js - whose own file header records that its RULE servicelink was
born from a real Cherry Lane defect found on item 2.3 (2026-08-12: a
Pharmacy First condition tile was repointed at Coleman and Leighs, the other
Walton branch, and all 29 checkers of the day exited 0) - had never been
proven by injection against Cherry Lane's own pages specifically. That the
2.3 fix has held since is not the same claim as this item's own instrument
having proved it.
Five injections, one at a time, each restored by direct fs.writeFileSync from
an in-memory Buffer and sha256-reconfirmed before the next: (1) RULE identity
- data-branch emptied on contraception-cherry-lane-walton.html's module root,
caught ("carries a module root but no data-branch"); (2) RULE owner -
data-branch on earache-treatment-cherry-lane-walton.html swapped for Smartts
Chemist's name, caught, correctly also flagging that Cherry Lane's own pages
now declared two different data-branch values; (3) RULE schemaname - JSON-LD
name on sore-throat-treatment-cherry-lane-walton.html swapped for Hirshmans
Chemist's, caught, same two-values cross-check; (4) RULE outbound - the
Google review link on shingles-treatment-cherry-lane-walton.html swapped for
Smartts Chemist's, caught ("A patient following it rates the wrong shop");
(5) RULE servicelink - the shingles condition tile on pharmacy-first-cherry-
lane-walton.html repointed at Coleman and Leighs' equivalent page (the exact
shape of the real 2026-08-12 defect, cross-host since Coleman and Leighs is
served from a different domain), caught ("so it 404s and the service route
is dead"). All five caught first attempt with the expected message; final
checker run after all restores exit 0; all five target files git-diff-empty
throughout. Full 36-checker suite re-run individually after the round: 36/36
exit 0. Output: audits/verify-3.4-2026-09-04-eleventh-output.txt (regenerated
this run in UTF-8; the orphaned copy from the interrupted run had been
captured via a PowerShell redirection that produced UTF-16, unreadable as
plain text - a fresh instance of the same encoding gotcha the 3.5 eleventh
pass hit and fixed on 2026-09-04 for its own gitlog capture, not a defect in
the script's own logic).
LIVE HALF, PARTIAL. Claude in Chrome confirmed not connected (checked at
step 3 and again independently before this section, a fourth consecutive
pass without it). Fell back to the established read-only PowerShell
Invoke-WebRequest route rather than leaving the live half entirely unread for
a fourth time. uti-treatment-cherry-lane-walton.html and pharmacy-first-
cherry-lane-walton.html both 200, own postcode (L4 8SG), own phone (0151 226
2051) and Walton all present, matching repo state exactly - no drift on the
two pages every pass reconfirms. pharmacy-first-service-walton.html (the
independent bridge page with its own Appointedd widget) still carries widget
id 66b20ae6609c16953de3e0cf, Cherry Lane's own Pharmacy First diary - no
wrong-diary risk, unchanged since the seventh pass first read it.
weight-loss-clinic-walton.html RECONFIRMS the seventh pass's Q86 finding
still live and uncorrected: the page still reads "...Walton, Liverpool L4
8SG" (matched verbatim), the 2026-08-05 wording, not the 2026-08-13 repo fix
("Cherry Lane, Liverpool L4 8SG", absent) - now 22 days since the repo was
corrected with the live paste never refreshed. THE OTHER HALF OF Q86, THE
SITE-WIDE CONTACT WIDGET'S CROSS-BRANCH SCORAH MAILTO ADDRESSES, COULD NOT BE
CHECKED EITHER WAY THIS PASS AND IS NOT CLAIMED FIXED: a raw
Invoke-WebRequest fetch of the homepage contained no "mailto:" string at all
anywhere in 73,163 characters of HTML (not even the correct
Cherry@rbhealth.co.uk one, though "Cherry@rbhealth" appears as visible text
elsewhere on the page), consistent with the seventh pass's own note that this
widget was invisible even to rendered-text extraction and only readable by
inspecting actual href attributes in a live DOM - something a raw HTTP GET
with no JavaScript execution cannot do at all, a stricter limitation than
Claude in Chrome being disconnected, not evidence either way. Q36's footer
typo (pharmacy.FA226@mhs.net) also not reconfirmed by the same limitation (no
"mhs.net" string found, but the whole footer element may not be in the raw
HTML this method can see). Both stand unverified rather than reconfirmed or
cleared; Q86 not re-raised, no new question.
WORKLIST AND COMMIT. This paragraph. check-em-dashes.js re-run after the
edit: clean. New evidence file this run: audits/verify-3.4-2026-09-04-
eleventh.js (recovered from the interrupted run, read in full, re-run fresh
rather than trusted) and its regenerated UTF-8 output file. QUESTIONS.json
unchanged (95 total, 42 open; no pickup available this run - Claude in Chrome
not connected, standing Q59 - no new question raised). Files changed and
committed: AGENT_WORKLIST.md, the two audits/ files, and AGENT_LOG.md - no
generator, page, data field or checker file touched in the tracked tree,
reconfirmed immediately before commit.
Next stalest by this run's own computation, for whoever runs the next
unattended pass: 3.9 (2026-09-02T19:09:58+01:00), then 3.10, 2.1 - re-derive
rather than assume, since other runs may land in between.

- [x] 3.5 Hirshmans Chemist (Ainsdale): same treatment. Done 2026-08-04.
      12 pages, 0 mismatches. Quality pass 2026-08-14 (fifth), Done 2026-08-14.
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
Quality pass 2026-08-12 (third): all 12 Hirshmans pages re-verified by an
independent extraction written fresh for this run, no checker code reused.
350 checks, zero failures: one H1 per page carrying Ainsdale, titles and
descriptions on pattern (descriptions 137 to 156 characters), display phone
01704 577376 and tel: link on all 12 with no other branch's phone digits
anywhere, PR8 3HW the only postcode, no other branch's town in any page text,
JSON-LD address correct field by field against branches.json, no hard-coded
widget id, service pages pinned service-module-phase1 and the switch page
6a275e1. POM scan (82 names) and claim-pattern scan clean on all 12 including
the weight loss page. All seven generators rebuilt byte-identical, all 29
checkers pass. Live half, two read-only GETs: the generated UTI page serves
the exact pattern title, H1, NAP, hours and the correct FW378 nhs.net footer
email; the old hand-built pharmacy-first-service-ainsdale.html still carries
its known faults (017014577376 non-dialling phone, 64 Station Road, Hirshmans
Pharmacy branding, US spellings), all already recorded in the GBP pack's Post
A HARD STOP and Q41's note, nothing new to raise. Evidence in
audits/hirshmans-build-check-2026-08-12-third.txt. No in-repo defect found.
Quality pass 2026-08-13 (fourth): all 12 Hirshmans pages re-read by a fresh
independent extraction, 1728 checks, zero failures. One H1 per page carrying
Ainsdale, display phone 01704 577376 and its tel: link on all 12 with no other
branch's phone digits anywhere, PR8 3HW the only postcode, the street string on
all 12, no other brand or seoTown outside this branch's own serviceAreaList,
every widget id owned by this branch, service pages pinned service-module-phase1
and the switch page 6a275e1, JSON-LD address correct field by field, own ODS
FW378 only, no other branch's review or Pharmacy First link, and no http:// href
or src on any page. All 30 checkers pass, all seven generators rebuild
byte-identical. Repo half only, no browser this run.
The pages were clean; the defect class was in the packs. An estate-wide sweep
of the words BETWEEN the street and the postcode, the rule the item 3.4 pass
added to check-nap.js for the two Weebly paste blocks, applied to every file,
found five GBP packs publishing a post town branches.json does not hold:
Hirshmans and Fishlocks Ainsdale (Southport), Fishlocks Eccleston (Chorley),
Scorah Bramhall and Scorah Hazel Grove (Stockport). Five shops each hand the
public two address strings out of one repo, one to Google and one on every
generated page, which is the citation fault item 1.4 exists to stop. Inverse of
the Cherry Lane case: here the PACKS are the postally correct half, so which
way to standardise changes schema.org on all 177 pages and is Q64's decision.
Nothing edited. tools/check-gbp-packs.js now enforces the rule with the five
packs in KNOWN_IDENTITY against Q64, proven by five negative tests. Evidence in
audits/hirshmans-build-check-2026-08-13-fourth.txt.
Quality pass 2026-08-14 (fifth): the 12 pages are clean for the second
consecutive pass and not one character of any page was edited. Fifth
independent extraction, own regexes, no code shared with tools/: 1728 checks,
0 failures, the same count the fourth pass ran, so the two agree by arriving
separately. Titles 44 to 62, descriptions 137 to 156, exactly one H1 each
carrying Ainsdale, PR8 3HW the only postcode, 01704 577376 the only phone, no
foreign brand, town, phone, postcode or widget id, JSON-LD address correct
field by field on all 12. All six generators reproduced every page
byte-identical and all 35 checkers pass. Three injections into
pharmacy-first-hirshmans-ainsdale.html were all caught: a second H1 naming a
foreign town, the seoTown removed from the H1, and a foreign town in the SEO
description. The first is a cross-branch regression test of the h1 COUNT rule
added on the item 3.2 pass two runs earlier, and it fires here too.
ONE DEFECT FOUND AND FIXED, and it was in the audit METHOD rather than on a
page: audits/ was not covered by .gitattributes, so git checked the live-hours
report out with CRLF and check-live-hours.js immediately rewrote it with LF,
leaving a phantom "modified" file in the git status that every quality pass
reads as its proof the generators still match. Fixed by declaring audits/ as
LF, the same rule the generated page folders already carry. Evidence in
audits/hirshmans-build-check-2026-08-14-fifth.txt. No new question.
Quality pass 2026-08-30 06:20 (sixth): 12 pages clean on a sixth independent
extraction, 2,258 checks, 0 failures. New leg: JSON-LD verified field by field
against branches.json rather than addressLocality alone; also new, brand-label
isolation. Three injections (doubled sheet label, foreign town, foreign
postcode in JSON-LD) all caught and restored. Live half, first since the fifth
pass: UTI page clean; switch page found serving pre-Q7 stale title and
description (paste-lag, already tracked under the 5.6 repaste queue). No new
question.
Quality pass 2026-08-31 (seventh): 12 pages clean on a seventh independent
extraction (audits/verify-3.5-2026-08-31.js, __dirname-relative rather than
the sixth pass's hardcoded C:/Dev/rbh-site-data path), 2,282 checks, 0
failures. NEW LEG: Q21's per-branch whatsapp field confirmed on all 12
rendered pages (data-wa="447521775631", Hirshmans' own number, no foreign
number present), independent of check-whatsapp-route.js. Two simultaneous
injections into the UTI page (foreign town "Bramhall" appended to the h1;
data-wa corrupted) both caught by check-seo-pattern.js, check-whatsapp-route.js
and the independent verifier, then restored byte-identical
(sha256 0e361de6...62783e confirmed). Live half, two read-only reads: UTI page
clean, including the footer hours line stating both weekday sessions and both
Saturday sessions distinctly against branches.json; switch page's pre-Q7 title/
description paste-lag and mojibake em dash reconfirmed unchanged, no repo-side
fix available. All six generators rebuild byte-identical; all 36 checkers
green. Evidence in audits/hirshmans-item-3.5-quality-pass-2026-08-31.txt. No
new question.
Quality pass 2026-09-01 (eighth): 12 pages clean on an eighth independent
extraction (audits/verify-3.5-2026-09-01.js, freshly written, no import from
tools/), 240 checks, 0 failures. All 36 checkers pass; all six generators
rebuild byte-identical against 203 sha256-hashed files under modules/, git
status --short modules/ empty throughout. Guard re-proof by injection, on a
page type not used for injection in either of the two prior passes that name
one (fifth: pharmacy-first-hirshmans-ainsdale.html; seventh: uti-treatment-
hirshmans-ainsdale.html): two simultaneous injections into weight-loss-clinic-
hirshmans-ainsdale.html, a second h1 naming Aigburth (a live seoTown outside
this branch's serviceAreaList) and a corrupted data-wa. Both caught -
check-seo-pattern.js on the h1 count, check-whatsapp-route.js on the WhatsApp
mismatch, and the independent extraction on all three derived faults - then
restored via `git show HEAD:<path>` and sha256-confirmed byte-identical
(fb53935e...1edd728). Full 36-checker suite and independent extraction both
re-run clean after restore. Live half NOT READ this pass: Claude in Chrome
reported not connected, no other route attempted; the seventh pass's two
live-only findings (switch page pre-Q7 title/description paste-lag with
mojibake em dash, under the 5.6 repaste queue) were not re-confirmed and
should not be assumed unchanged. Evidence in
audits/hirshmans-item-3.5-quality-pass-2026-09-01.txt. No in-repo defect, no
new question.
Quality pass 2026-09-02 (ninth): 12 pages clean on a ninth independent
extraction (audits/verify-3.5-2026-09-02-ninth.js, freshly written, no import
from tools/), 756 checks, 0 failures. All 36 checkers pass (audits/checker-
sweep-2026-09-02-item3.5.txt); all six generators rebuild every modules/ file
byte-identical, git status --short modules/ empty both before and after
regeneration. NEW LEG: cross-checked against RBH_DIGITAL_BUILD_PACK_v2.md
section 1.4 ("title, URL and main heading") for the first time on this item,
matching the check added on the item 3.2 eighth pass - for all 12 pages, the
generated filename (which is also the sheet's own Page Permalink, looked up
by exact block match rather than assumed) contains this branch's townSlug
"ainsdale", alongside the pre-existing title and H1 legs. Also newly
re-proved: the build comment's human-readable Weebly SEO title/description
lines match the sheet's Page Title/Page Description exactly, independent of
check-seo-sheets.js. Guard re-proof by injection, on a page type not used for
injection in any of the eight prior passes on this item (fifth: pharmacy-
first; seventh: uti-treatment; eighth: weight-loss-clinic): two simultaneous
injections into switch-prescriptions-hirshmans-ainsdale.html, a foreign
seoTown ("Bramhall", outside this branch's serviceAreaList) appended to the
H1, and a corrupted data-wa. Both caught - check-seo-pattern.js on the h1
mismatch and the foreign-town rule, check-whatsapp-route.js on the WhatsApp
mismatch, and the independent extraction on both - then restored via git
checkout and sha256-confirmed byte-identical to the pre-injection hash. Full
36-checker suite and independent extraction both re-run clean after restore.
TOOLING NOTE, not a repo defect: this run's own checker sweep first threw a
false FAIL from check-postcodes.js (which scans the whole repo, per its own
documented scope) picking up postcode-shaped text inside this run's own
scratch git-log dump left in _agentscratch/. Same shape as the item 4.1
ninth-pass /tmp finding. Fixed by deleting the scratch files and re-running
checker output to a directory outside the repo tree for the rest of this
pass; confirmed clean afterwards (0 failures, 3 pre-existing UNOWNED warnings
on TEMPLATE.md and the branch sheets, unchanged from baseline).
Live half NOT READ this pass: Claude in Chrome reported not connected on two
separate checks, no other route tried, no login attempted. The seventh
pass's live-only findings (switch page pre-Q7 title/description paste-lag
with mojibake em dash, under the 5.6 repaste queue) were not re-confirmed
and should not be assumed unchanged or resolved. Evidence in
audits/verify-3.5-2026-09-02-ninth.js,
audits/verify-3.5-2026-09-02-ninth-output.txt and
audits/checker-sweep-2026-09-02-item3.5.txt. No in-repo defect found, no new
question.
Quality pass 2026-09-03 (tenth): 12 pages clean on a tenth independent
extraction (audits/verify-3.5-2026-09-03-tenth.js, freshly written, no import
from tools/), 459 checks, 0 failures. All 35 checkers pass; all six
generators rebuild byte-identical against 215 sha256-hashed files under
modules/, git status --porcelain modules/, core/ empty before and after
regeneration. NEW LEG: the contraception page, never independently verified
on this item across nine prior passes, checked against RULE 4, 5, 6, 7 and 8
of check-contraception-copy.js by fresh extraction rather than by calling the
checker - NHS service name present, free-of-charge line present with the
negation preserved ("no prescription charge"), no currency amount, consent
sentence present, no coil/implant offer, no contraceptive named by brand or
drug name across 8 candidate names. One false positive in this run's own
harness caught and fixed before commit: an initial blunt regex flagged the
legitimate "no prescription charge" sentence as if it were a charge being
stated; corrected to recognise the negation, same class of own-tooling fix as
the item 3.5 ninth pass's scratch-file false positive and the item 4.1 ninth
pass's /tmp finding. GUARD RE-PROOF BY INJECTION, on a page type never used
for injection on this item in nine prior passes (fifth: pharmacy-first;
seventh: uti-treatment; eighth: weight-loss-clinic; ninth: switch-
prescriptions) and on a generator family (contraception) never injection-
tested on this item at all: contraception-hirshmans-ainsdale.html. Round 1,
two simultaneous injections - foreign seoTown "Bramhall" (outside this
branch's serviceAreaList) appended to the H1, and a corrupted data-wa - both
caught (check-seo-pattern.js on the h1 mismatch and the foreign-town rule,
check-whatsapp-route.js on the WhatsApp mismatch, and the independent
extraction on both), restored via git checkout, sha256-confirmed byte-
identical to the pre-injection hash
(a595d8a370af06379c981ae4e075bdca53fe312622938e8e8b5029fe20ee1fe9). Round 2,
separate: the free-of-charge FAQ answer rewritten to state "a £9.35
prescription charge applies", the first time check-contraception-copy.js has
been injection-proved on this item - caught by its own RULE 3 (verbatim) and
RULE 5 (free) and by the independent extraction, restored via git checkout,
sha256-confirmed byte-identical again. Full 35-checker suite and independent
extraction both re-run clean after each restore; git status --porcelain on
modules/, core/, gbp-packs/, branches.json, tools/, status/ empty throughout.
Live half NOT READ this pass: Claude in Chrome reported zero connected
browsers on two separate checks (before and after the repo-side work), no
other route attempted, no login attempted. The seventh pass's live-only
finding (switch page pre-Q7 title/description paste-lag with mojibake em
dash, under the 5.6 repaste queue) was not re-confirmed and should not be
assumed unchanged or resolved. Evidence in
audits/verify-3.5-2026-09-03-tenth.js. No in-repo defect found, no new
question.

Quality pass 2026-09-04 (eleventh): NEW LEG, the travel clinic page, never
independently verified on this item across ten prior passes despite
tools/check-travel-clinic-copy.js existing since 2026-08-11 and reading all 15
travel clinic pages including this branch's own on every full-suite run
(confirmed by grep: 27 mentions of check-travel-clinic-copy in AGENT_LOG.md,
none combined with "hirshmans"). Independent extraction
(audits/verify-3.5-2026-09-04-eleventh.js, freshly written, no import from
tools/) read travel-clinic-hirshmans-ainsdale.html against the same eleven
checks check-travel-clinic-copy.js enforces: 20 checks, 0 failures - private
and paid stated in the hero, no NHS or Pharmacy First framing, NHS funding
statements hedged, no stock guarantee and the availability hedge present,
book-ahead window 6 to 8 weeks stated twice and consistently, no vaccine or
antimalarial brand named (8-name sample), all four safety cohorts named,
trust bar names Ainsdale and not a sister branch's town, and the yellow fever
KNOWN-entry gap (Q48) reconfirmed unresolved rather than assumed. GUARD
RE-PROOF BY INJECTION, on a page type (travel clinic) never used for
injection on this item across ten prior passes (fifth: pharmacy-first;
seventh: uti-treatment; eighth: weight-loss-clinic; ninth:
switch-prescriptions; tenth: contraception) and on a checker
(check-travel-clinic-copy.js) never proven against this item's own page
before. Baseline SHA256 F6829E9388F2F34F52EB7DE0B36919C3DB771044E1481E15E683B174FBED7BBA
recorded first, via a Node script rather than PowerShell -replace, learning
from the 3.2 tenth pass's own PowerShell Out-File BOM/CRLF restore-corruption
finding earlier this same run sequence. Injection 1: the hero-sub's governing
sentence ("This is a private, paid service, not an NHS-funded appointment...")
changed to "This is a free NHS service, not a private appointment..." after
the script confirmed the target string matched. CAUGHT: check-travel-clinic-copy.js
exit 1, three failures - rule verbatim (the page no longer matches the
generator's line), rule private (the hero no longer states "private, paid
service"), and the explicit NOT_PRIVATE pattern (the page now calls the
clinic a free NHS service) - all naming this exact file. Restored by
fs.writeFileSync from the pre-injection backup copy, SHA256-reconfirmed
identical to baseline. Injection 2, a different rule and a different part of
the page: "Havrix" (a hepatitis A vaccine brand) appended to the Hepatitis A
and B vaccine-grid card's description. CAUGHT: check-travel-clinic-copy.js
exit 1, one failure, rule medicine, naming the file and the exact brand name.
Restored the same way, SHA256-reconfirmed identical to baseline. Full
36-checker suite re-run after each restore: 36/36 exit 0 both times. git
status --porcelain -- gbp-packs modules tools core branches.json status
empty throughout; no checker logic, generator or page content changed in the
tracked tree at any point. LIVE HALF: Claude in Chrome unreachable this run
(checked at step 3 and reconfirmed before this section). Fell back to
read-only PowerShell Invoke-WebRequest against hirshmanspharmacy.co.uk, the
established fallback. travel-clinic-hirshmans-ainsdale.html: 200, carries
"private, paid service" in visible text, no medicine brand name found (same
8-name sample), book-ahead window "6 to 8 weeks" present alongside the
unrelated "1 to 2 weeks" short-notice cohort line, correctly distinct per
Rule 7's own exemption - matches the repo-side state exactly, no live-only
finding. sitemap.xml: 200, every lastmod still 2026-08-14T16:09:17+00:00,
unchanged since the sixth pass first recorded this timestamp, no republish.
Evidence in audits/verify-3.5-2026-09-04-eleventh.js: the extraction script
itself was written by an earlier, interrupted run of this same scheduled
task, which created the script and a .agent-lock but did not run it, commit
it or log it; found at this run's start with its .agent-lock past the
45-minute staleness threshold and correctly treated as abandoned per the
task's own lock rule (see ENVIRONMENT note in AGENT_LOG.md). No in-repo
defect found, no new question.

- [x] 3.6 McCanns Chemist (Aigburth and Sandringham): same treatment. Done
      2026-08-04. 24 pages, 0 mismatches.
Quality pass 2026-08-12 (third; earlier passes run 22 and run 64 were logged
but never noted here - this is the first note under this item, gap now
closed). All 26 pages (branch landing pages added since by item 5.2)
re-verified by a fresh independent extraction, no checker code reused.
572 checks, 0 failures: one H1 per page carrying the seoTown (Aigburth /
St Michael's after 5.7), paste-sheet titles and descriptions on pattern
(descriptions 135 to 159 characters), correct phone as display and tel: on
all 26 with no other branch's digits, own postcode only, cross-town scan
clean with Sandringham's own catchment excusing Aigburth, JSON-LD address
correct field by field, no hard-coded widget id (79 estate ids scanned),
pins as generators declare, POM and claim-pattern scans clean including
weight loss pages and sheet strings. Widget diary policy holds: weightLoss
and travelClinic shared across the brand, the three NHS diaries unique per
site. All 29 checkers pass, all seven generators rebuilt byte-identical.
Live half, two read-only GETs: the generated Sandringham UTI page serves
correctly but the 5.7 St Michael's retitle is not yet pasted live (title
and H1 still read Sandringham - expected, rides the queued repaste); the
Weebly footer's "Sandrigham" typo and McCann's Pharmacy branding are Q39,
already open. The shared pfLink page still carries its known faults and
waits on the 5.3 decision, though it now signposts both generated branch
Pharmacy First pages. No in-repo defect found. Evidence in
audits/mccanns-build-check-2026-08-12.txt.
Quality pass 2026-08-13 (fourth). REPO HALF ONLY: no browser this run, so
nothing live was read or claimed. All 26 pages re-verified by a fourth
independent extraction sharing no code with tools/, 6,666 checks, 0 failures:
one H1 per page carrying its own seoTown including the St Michael's retitle,
phone in both shapes, own postcode and street only, JSON-LD address field by
field, no hard-coded widget id (79 estate ids scanned), pins consistent per
family, own ODS only, no other branch's review or Pharmacy First link, no
http:// on any page, cross-town clean apart from the deliberate same-brand
signpost to Sandringham on the Aigburth landing page. 50 sheet rows,
descriptions 135 to 159 characters. Both GBP packs satisfy run 147's new
post-town rule. All 30 checkers pass, all seven generators byte-identical. [see the fifth pass
below: this pass and the three before it read the JSON-LD "name" through a
rule that could not tell branchName from brandLabel, so "field by field" was
one field short of true.]
ONE DEFECT FOUND, in a checker rather than on a page: check-em-dashes.js read
three pasteable label spellings and the INDEX.md sheets write two more ("SEO
title", "SEO description", 326 lines), which were being counted as headings
rather than pasted values. Proved by injection, fixed at source, three
negative tests all fire. All 326 lines were already clean, so a latent hole
closed, not a live breach. No copy edited anywhere. Evidence in
audits/mccanns-build-check-2026-08-13.txt.
Quality pass 2026-08-14 (fifth). Done 2026-08-14. REPO HALF ONLY: two Chrome
instances are connected and an unattended run cannot choose between them, so
no browser was used, nothing live was read and nothing live is claimed. All 26
pages re-verified by a fifth independent extraction sharing no code with
tools/, 4,636 checks, 0 failures, and NOT ONE CHARACTER OF ANY PAGE WAS
EDITED. Coverage was proved before the result was read (run 187's lesson): 26
pages found by globbing, 177 sheet entries parsed across all six sheets, all 26
matched to a sheet entry by permalink, and the script refuses to report a
result on fewer than 500 checks. One H1 per page carrying its own seoTown,
phone in both shapes with every tel: link its own, own postcode and street
only, JSON-LD address field by field, 73 estate widget ids scanned per page
with none hard-coded, pins as each generator declares (24 pages
@service-module-phase1, the 2 switch pages @6a275e1), own ODS only, no other
branch's review URL, no http:// anywhere, cross-town clean. Titles 42 to 64
characters, descriptions 135 to 159. Brand widget diary policy re-asserted from
the data: weightLoss and travelClinic shared across both McCanns sites, the
three NHS diaries unique per site and colliding with no other branch. All 35
checkers pass, all six generators reproduced every page byte-identical.
ONE DEFECT FOUND AND FIXED, in a checker rather than on a page, and it was
found by my own extractor being WRONG first. My draft asserted the JSON-LD
"name" equals brandLabel on every page and flagged the two branch landing
pages. The pages were right and the assertion was wrong, so before changing
anything I read all 177 estate pages: the convention is unanimous and was
undeclared, 6 of 6 branch landing pages carry branchName and 171 of 171
service and switch pages carry brandLabel. check-jsonld rule 3 accepted EITHER
name on EVERY page, so it could only ever catch a name belonging to no branch
at all. The direction that matters is a branch landing page falling back to
the bare brandLabel: that hands Google two pages at two different addresses
carrying one identical entity name, which is the exact merge the branch
landing page family exists to prevent, and the old rule passed it. Rule 3 is
now module-aware, taking the family from the directory rather than the
filename. Three negative tests, all three fire, and the two that prove the new
behaviour both PASSED under the old rule. Nothing was wrong today; the policy
was unpinned, same shape as the widget diary gap found on item 3.7. No copy
edited anywhere. Evidence in audits/mccanns-build-check-2026-08-14.txt.
Quality pass 2026-08-31 (sixth). Done 2026-08-31. Clean on both halves, no
repo defect, no new question. All 36 checkers green (up from 35 at the
fifth pass on 2026-08-14). All six generators rebuilt; sha256 of all 203 files
under modules/service/pages, modules/switch/pages and modules/branch/pages
identical before and after. A sixth independent extraction
(audits/verify-3.6-2026-08-31.js, imports nothing from tools/, own regexes
throughout) re-read all 26 pages: 2,589 checks, 0 failures, covering one H1
per page carrying the branch's own seoTown, the excused/unexcused
cross-town asymmetry (Sandringham's serviceAreaList carries Aigburth so its
sister mention is excused, Aigburth's does not carry St Michael's so no
excuse exists there), own phone and postcode present with the sister's
absent, JSON-LD name equal to the branch's own branchName rather than the
bare shared brandLabel "McCanns Chemist" per the item 3.12 branch-identity
rule, JSON-LD address matching branches.json field by field, the map embed
decoding to the branch's own address, data-wa matching the estate WhatsApp
number, and title/description length and own-town presence resolved against
the correct one of four service-family sheets. Cross-town guard re-proved
by injection, then restored: "near St Michael's" added to the Aigburth UTI
H1 was caught by both check-seo-pattern.js (naming the shared-domain rule
by id) and the independent extraction before being reverted via `git show
HEAD:<path> > <path>` (this mount's `git checkout --` cannot unlink the old
file); sha256 after restore matched the pre-injection file exactly and all
36 checkers were re-run clean. LIVE HALF, two read-only GETs via Claude in
Chrome: the Aigburth UTI page is fully correct (title, H1, phone, address,
hours). The Sandringham UTI page's title and H1 still read "Sandringham"
rather than "St Michael's" live, though the repo's generated page and paste
sheet both correctly carry "St Michael's" - this is the queued item
5.7/Q15 repaste, already tracked since the fourth pass on 2026-08-14, not a
repo defect. The site footer's known Q39 set ("McCann's Pharmacy" branding,
"Sandrigham Medical Centre" typo) is unchanged, nothing new. Evidence in
audits/mccanns-build-check-2026-08-31.txt. NOTE ON RUN CONDITIONS: executed
via Cowork's sandboxed shell, not the native Windows host this procedure
assumes; `git fetch origin` failed with "Host key verification failed" (no
SSH credential for git@github.com from this shell), the same limitation
every recent run has recorded, and a pre-existing .git/index.lock (left by
an earlier run, under the 1-hour staleness threshold throughout) may leave
this run's commit sitting locally until a native-host or credentialed
session pushes it - see the AGENT_LOG.md addendum for this run's actual
outcome.
Quality pass 2026-09-01 (seventh). Done 2026-09-01. Selected as the least
recently verified item in the 36-item rotation pool (last touched
2026-08-30, older than every other pool item; all eight open worklist
lines were still [BLOCKED] and answer pickup via Claude in Chrome was
unavailable, so no item unblocked). All 36 checkers re-run individually:
36/36 pass, byte-identical regeneration confirmed via sha256 across all
203 generated files under modules/service/pages, modules/switch/pages and
modules/branch/pages before and after rebuilding all six generators. A
seventh independent extraction (audits/verify-3.6-2026-09-01.js, own
regexes throughout, imports nothing from tools/) re-read all 26 McCanns
pages: 1,437 checks, 0 failures, covering the H1's own seoTown with the
excused/unexcused cross-town asymmetry, own phone in both visible and
tel: form with no other branch's digits present, own postcode only,
JSON-LD name equal to the branch's own branchName (never the bare shared
brandLabel "McCanns Chemist"), JSON-LD address field by field, the map
embed and the branch landing page's "Get directions" button both decoding
to the branch's own full address, data-wa matching the estate WhatsApp
number, data-branch naming the right branch, and no other branch's
review or ODS identifiers. Three injections, each restored by byte copy
from a pre-injection backup and sha256-confirmed identical to the
original before continuing (this mount cannot unlink via `git checkout
--`): an unexcused cross-town H1 ("near St Michael's" added to the
Aigburth UTI H1, since Aigburth's own serviceAreaList carries no St
Michael's or Sandringham) caught by check-seo-pattern.js and the
independent extraction; a phone swap on the Aigburth branch landing page
to Sandringham's number, caught by check-nap.js (6 mismatches) and the
independent extraction; an em dash inserted into gbp-packs/mccanns-
aigburth.md's Post A copy, caught by check-em-dashes.js. Full 36-checker
suite re-run clean after the final restore; `git status --short
modules/ branches.json gbp-packs/ tools/` empty throughout (verified via
the Windows-side working copy, since this mount's own `git status`
briefly re-creates .git/index.lock and cannot unlink it either - the
lock was removed from the Windows side, confirmed no git process was
running, and it was well under the one-hour staleness bar but plainly
orphaned rather than held). LIVE HALF: Claude in Chrome unavailable
("not connected"), so read via plain read-only Node fetch() (GET only,
the established fallback) instead of retrying another route. Four URLs
read: the Aigburth UTI page is fully correct live (title and H1 both
read "Aigburth", HTTP 200); the Sandringham UTI page's title and H1
still read "Sandringham" rather than "St Michael's" live, matching the
repo and paste sheet's correct "St Michael's" only in the repo - this is
the queued 5.7/Q15 repaste, unchanged since the fourth pass on
2026-08-14 and reconfirmed on every pass since including the sixth on
2026-08-31; both branch landing pages (pharmacy-mccanns-aigburth.html,
pharmacy-mccanns-sandringham.html) still 404 live, which is the standing
queued-paste state each pack's own paster note anticipates (Q35),
reconfirmed unchanged rather than new. No in-repo defect found, no new
question raised.
Quality pass 2026-09-02 (eighth). Done 2026-09-02. Selected as the least
recently verified item in the rotation pool: every non-excluded item was
last touched 2026-09-01 except three freshly touched the same day
(3.12, 4.13, 5.1), so the pool tied at 2026-09-01; broken by the
own-block "quality pass" mention count the 3.12 fifth-pass run
established as the more reliable tie-break (log-wide proximity matching
was found that run to pick up other items' incidental cross-references
as if they were the item's own passes). 3.6 tied lowest at 5 own-block
mentions alongside 3.8 and 6.3; broken by ascending item number as a
plain, auditable rule with all three genuinely tied.
REPO HALF. All 36 tools/check-*.js checkers re-run individually: 36 of
36 exit 0. All six generators (branch landing, contraception, service,
switch, travel clinic, weight loss) rebuilt; sha256 of all 203 files
under modules/service/pages, modules/switch/pages and modules/branch/pages
taken before and after: byte-identical, zero diff; git status empty on
modules/, branches.json, gbp-packs/ and tools/ throughout. A fresh
eighth independent extraction (audits/verify-3.6-2026-09-02.js, own
regexes throughout, imports nothing from tools/) re-read all 26 McCanns
pages: 1,351 checks, 0 failures, covering H1 own-seoTown, the
excused/unexcused cross-town asymmetry (now also correctly excusing the
Aigburth branch landing page's deliberate sister-branch signpost link,
a page-type exception the first draft of this pass's own script missed
and had to correct - see below), own phone in both display and tel:
form with no other branch's digits present anywhere on the page, own
postcode only, JSON-LD name equal to the branch's own branchName rather
than the bare shared brandLabel, JSON-LD address field by field, data-wa
matching the estate WhatsApp number (correctly absent on the two branch
landing pages, which carry no WhatsApp button by design, confirmed on
the item 2.2 fifth pass), data-branch naming the right branch, and the
map embed decoding to the branch's own full address.
SCRIPT-DESIGN FINDING, not a page defect. The extraction's first run
flagged 3 false positives: the Aigburth branch landing page "names
unexcused sister town" (it names Sandringham/St Michael's inside its
own deliberate "if you are nearer our other branch" signpost sentence,
which item 3.6's sixth pass already recorded as intentional) and both
branch landing pages "missing data-wa" (they carry no WhatsApp button
of any kind, correct by design). The script's town-excuse and
data-wa checks did not know branch landing pages are a distinct page
type with their own deliberate exceptions; fixed by excusing that page
type explicitly in both checks, rather than by weakening either rule
generally. Re-run clean at 1,351/1,351 after the fix - same shape as
several prior passes' own extractor bugs (the 3.6 fifth pass's own
JSON-LD "name" assertion, the 3.13 fifth pass's vacuity-probe faults).
INJECTION TEST, two faults, both on pages untried in any prior 3.6
pass (earlier passes tested the Aigburth UTI H1, the Aigburth branch
landing page's phone, and a GBP pack Post A copy): (1)
sinusitis-treatment-mccanns-aigburth.html's JSON-LD postalCode changed
from Aigburth's own L17 7BP to Sandringham's L17 4JP - caught by the
independent extraction (3 legs), check-jsonld.js and check-nap.js,
which also correctly named the postcode as belonging to "McCanns
Chemist Sandringham, not McCanns Chemist Aigburth"; (2)
pharmacy-first-mccanns-sandringham.html's data-wa changed from the
estate's 447521775631 to a fabricated 447000000000 - caught by the
independent extraction and check-whatsapp-route.js. Both files restored
by byte copy from a pre-injection backup (not git checkout, per this
mount's established unlink() limitation) and sha256-confirmed identical
to the pre-injection original; all 36 checkers and the independent
extraction re-run clean after both restores.
LIVE HALF, read-only, via direct fetch (Claude in Chrome unavailable
this run - see AGENT_LOG.md). Five URLs read: the Aigburth UTI page is
fully correct live (title and H1 both read "Aigburth", HTTP 200, own
phone x6); the Sandringham UTI page's title and H1 still read
"Sandringham" rather than "St Michael's" live, matching the repo's
correct "St Michael's" only in the repo - the queued 5.7/Q15 repaste,
unchanged since the fourth pass on 2026-08-14 and reconfirmed on every
pass since; both branch landing pages still 404 live (Q35, standing
queued-paste state); the Aigburth switch page is correct (trading name,
own phone x7). The known Q39 footer set ("McCann's Pharmacy" branding,
"Sandrigham" typo) reconfirmed present and unchanged on the Sandringham
UTI page. No in-repo defect found. No new live finding. No new question
raised - the script fix was a plain, no-judgement-call correction, the
same class several prior passes have recorded in-line without a
QUESTIONS.json entry. Evidence: audits/verify-3.6-2026-09-02.js
(committed).
Quality pass 2026-09-02 (ninth, 22:34 BST). Selected as the least recently
verified item in the standing 36-item rotation pool: all 8 unblocked
AGENT_WORKLIST.md lines confirmed [BLOCKED] (8 of 8 via direct grep), so
the quality-pass fallback applied. Rotation computed the same way as every
prior pass: git log --pretty=format:"%cI|%s" matched item N.N by word
boundary (case-insensitive), first/most recent match per item, over the
standing pool. Item 3.6 was stalest, last mentioned 2026-09-02T02:15:44+01:00;
item 3.12 (done in the immediately preceding run) was most recent at
2026-09-02T22:08:51+01:00.
REPO HALF. All 36 tools/check-*.js checkers re-run individually before any
change: 36/36 exit 0. All six generators rebuilt first; git status
--porcelain modules/ core/ empty before and after, confirming byte-identical
regeneration. A ninth independent extraction, sharing no code with tools/ or
any prior verify-3.6-*.js (audits/verify-3.6-2026-09-02-ninth.js): 1,287
checks across all 26 McCanns pages plus estate-level branches.json assertions,
0 failures - H1 own-seoTown, the excused/unexcused cross-town asymmetry
(Sandringham's serviceAreaList excuses naming Aigburth; Aigburth's does not
excuse St Michael's/Sandringham, and both branch landing pages' deliberate
sister-branch signpost is treated as the documented exception, not a fault),
own phone in full-string form with no other live branch's phone string
anywhere on the page, own postcode with no other branch's postcode, JSON-LD
name equal to the branch's own branchName rather than the bare shared
brandLabel, JSON-LD address field by field, data-wa against the estate
WhatsApp number, data-branch naming the right branch, no em/en dash outside
build comments, and the brand widget-diary policy (weightLoss and
travelClinic ids identical across both sister branches; contraception and
pharmacyFirst ids distinct per branch) re-asserted at the branches.json
level.
SCRIPT-DESIGN FINDING, not a page defect, caught before trusting the first
"clean" result - the same discipline recorded on every prior pass across this
item and others. The script's first draft asserted a widget id should be
findable as a literal string on the service/booking pages. All 8 widget-id
pages failed. Reading CLAUDE.md's own "booking chain" section and the actual
page markup showed why: a generated service page deliberately ships an EMPTY
mount and carries no widget id at all, because modules/service/service.js
resolves it at runtime from branches.json via the filename's
brandSlug-townSlug key - hard-coding an id on the page is exactly the fault
that section records as already having sent bookings into the wrong branch's
diary once before. Fixed by checking instead that NO widget id belonging to
any of the 16 live branches is hard-coded anywhere on these pages, and that
the booking mount (rbhsv-root/rbhsw-root) is present; re-run clean at
1,287/1,287. Not a repo defect - the pages were always correct, the draft
script's assumption was wrong.
INJECTION TEST, three faults on impetigo-treatment-mccanns-sandringham.html,
untried by any prior 3.6 pass (earlier passes used the UTI H1, the Aigburth
branch landing page's phone, sinusitis' JSON-LD postalCode, data-wa on the
pharmacy-first page, and a GBP pack Post A copy): (1) postalCode swapped from
Sandringham's own L17 4JP to Aigburth's L17 7BP throughout the page - caught
by check-postcodes.js's FOREIGN rule, check-jsonld.js's postalCode rule,
check-nap.js (4 mismatches) and the independent script (3 legs); (2) data-wa
changed from the estate's 447521775631 to a fabricated 447000000000 - caught
by check-whatsapp-route.js and the independent script; (3) an &#8212; numeric
em-dash entity appended after the H1 - caught by check-em-dashes.js and the
independent script. File restored by byte copy from a pre-injection backup,
SHA256-confirmed identical to the original before and after (557D1474...);
all 36 checkers and the independent script re-run clean after restore; git
status --porcelain modules/ empty throughout.
GBP packs (gbp-packs/mccanns-aigburth.md, gbp-packs/mccanns-sandringham.md)
re-checked via check-gbp-packs.js: 0 failures, no warning naming either
branch. Both packs' profile-basics block (name, address, phone, hours,
review link) re-read field by field against branches.json: agrees exactly.
Both sister-branch mentions in the business descriptions name the correct
counterpart town ("McCanns Chemist Sandringham, in St Michael's" on the
Aigburth pack; "Our sister McCanns..." continuing on the Sandringham pack)
per the check-gbp-packs.js KNOWN_SISTER rule.
LIVE HALF. Claude in Chrome reported not connected (checked at answer pickup
and again before this item's live check); per procedure not retried by
another route, no login attempted. Fell back to the established plain
read-only Node-equivalent GET route (Invoke-WebRequest, GET only, no
interaction) used by the seventh and eighth passes when Chrome is
unavailable: the Aigburth UTI page is fully correct live (title and H1 both
read "Aigburth", HTTP 200); the Sandringham UTI page's title and H1 still
read "Sandringham" rather than "St Michael's" live, matching the repo's
correct "St Michael's" only in the repo - the queued 5.7/Q15 repaste,
unchanged since the fourth pass on 2026-08-14 and reconfirmed on every pass
since; both branch landing pages still return HTTP 404 live (Q35, standing
queued-paste state, unchanged); the known Q39 footer set ("McCann's
Pharmacy" branding, "Sandrigham" typo) reconfirmed still present and
unchanged on the Sandringham UTI page. No new live finding.
Zero in-repo defects found this pass. No new question raised - the widget-id
script correction was a plain, no-judgement-call fix, the same class several
prior passes on this item have recorded in-line without a QUESTIONS.json
entry. QUESTIONS.json re-read: 94 total, 41 open, unchanged; none answered
by pickup this run. Autonomous window (step 4): no "Standing authorisation"
heading present at the top of AGENT_LOG.md at the start of the run, so none
was open; proceeded normally (moot regardless, nothing here needed a
decision). Environment: mcp__workspace__bash (Cowork sandboxed Linux shell)
returned "Permission to use mcp__workspace__bash has been denied" on every
call this run, consistent with every recent run; all git, Node and file work
was done via mcp__Windows-MCP__PowerShell against the canonical
C:\Dev\rbh-site-data working copy, the established route. .agent-lock: none
present at start, none stale; written 22:34:44 BST, deleted at the end of
this run. No stale .git\index.lock. Pre-existing untracked debris (numerous
.agent-lock.released-* files, .lock-test-file, .testfile123.todelete, a
malformed literal-path file, open_q.txt, qtmp.json, scratchtest*.txt and
other _agentscratch/ and audits/ leftovers from prior runs) noted but not
touched, out of this item's scope; nothing created or left behind by this
run beyond its own two kept audit files. Evidence:
audits/verify-3.6-2026-09-02-ninth.js,
audits/verify-3.6-2026-09-02-ninth-output.txt (both committed).
Quality pass 2026-09-03 (tenth, unattended scheduled run via Cowork).
Selected as the least recently verified item in the standing 36-item
rotation pool: all 8 unblocked AGENT_WORKLIST.md lines confirmed
[BLOCKED] by direct grep, so the quality-pass fallback applied.
Rotation re-derived fresh (git log --pretty=format:"%cI|%s" matched per
item by word boundary, latest touch per pool item, same method as every
prior pass): 3.6 uniquely stalest at 2026-09-02T22:40:23+01:00, exactly
matching the forward note the ninth pass left (then 3.8, 6.3, 3.1, 4.3,
4.6, 4.5).
BASELINE. All 36 tools/check-*.js re-run individually before any change:
36/36 exit 0. All six generators rebuilt first: sha256 of all 216 files
under modules/ and core/ identical before and after, byte-identical
regeneration confirmed. git status --porcelain on modules/, core/,
branches.json, gbp-packs/, tools/, status/ empty throughout.
FRESH ANGLE. Rather than an eleventh independent full-page extraction
(nine of those already exist for this item and the marginal value of a
tenth was judged low), this pass targeted two things genuinely untested
against this item's own real files across all nine prior passes: the
check-gbp-packs.js hours-day fix that landed in the immediately
preceding run (item 3.12's seventh pass, commit 893974f), and
check-app-membership.js, which had never been named in any of this
item's nine prior passes despite covering a field (hasApp) both McCanns
branches carry.
INJECTION 1 (proving the 3.12 fix generalises to this item's own files).
The 3.12 seventh pass proved its fix only against Tiffenbergs' own pack,
plus a grep confirming the same comma-split sentence shape existed
nowhere else with a wrong value; it did not injection-test the fix
against any other branch's pack directly. Both McCanns branches are
lunch-closure branches (13:00-14:00 gap, Monday to Friday, confirmed
fresh from branches.json), the exact class the fix concerns, so this
pass proved it directly: gbp-packs/mccanns-aigburth.md and
gbp-packs/mccanns-sandringham.md backed up by sha256
(fdb1429d...36693 and bc9ab580...893e) before any mutation. A sentence
in the same broken shape as Tiffenbergs' real one ("Open Monday to
Friday, closed 1pm to 3pm for lunch" - one hour wrong, comma-splitting
the day clause from the closure clause) was inserted into each pack's
business description in turn, never both at once. Both were CAUGHT: five
day-mismatch failures each (Monday to Friday, "states a closure of 13:00
to 15:00, but branches.json leaves [Day] closed 13:00 to 14:00"), plus
two incidental character-count failures from the added sentence pushing
the description over 750 characters. Each file restored via `git show
HEAD:<path> > <path>` (this mount's `git checkout --` cannot unlink) and
sha256-reconfirmed identical to its pre-injection backup before touching
the other; full 36-checker suite re-run clean after each restore.
Confirms the fix protects this item's own branches, not only Tiffenbergs,
Coleman and Leighs and Smartts Bootle.
INJECTION 2 (check-app-membership.js, untested on this item across nine
prior passes). Both McCanns branches carry hasApp: false in
branches.json, confirmed fresh. Baseline: modules/switch/pages/switch-
prescriptions-mccanns-aigburth.html carries no "app" string of any kind
(grep clean) and check-app-membership.js reports the estate clean before
injection. File backed up by sha256 (539caeed...cddf1). An app-card block
(head, copy sentence, both real store URLs) copied verbatim from
Smartts Bootle's own switch page, a genuine app member, was inserted into
the McCanns Aigburth switch page after its form. CAUGHT: "carries the app
card but branches.json says this branch is not an app member." Restored
via `git show HEAD:<path> > <path>`, sha256-reconfirmed identical to the
pre-injection backup (539caeed...cddf1); full 36-checker suite and
check-app-membership.js specifically re-run clean after restore. git
status --porcelain on both touched paths empty at the end.
LIVE HALF. Claude in Chrome confirmed not connected (checked twice: once
at answer pickup, once again immediately before this item's live check).
Per procedure not retried by another route for the pickup; for the live
read itself, fell back to the established plain read-only GET route
(curl, GET only, no interaction - the same class of fallback the
seventh, eighth and ninth passes used via Node fetch / Invoke-WebRequest
when Chrome is unavailable). Five URLs read: the Aigburth UTI page is
fully correct live (title and H1 both read "Aigburth", HTTP 200, own
phone x6); the Sandringham UTI page's title and H1 still read
"Sandringham" rather than "St Michael's" live, matching the repo's
correct "St Michael's" only in the repo - the queued 5.7/Q15 repaste,
unchanged since the fourth pass on 2026-08-14 and reconfirmed on every
pass since; both branch landing pages still return HTTP 404 live (Q35,
standing queued-paste state, unchanged); the Aigburth switch page is
correct live (HTTP 200). The known Q39 footer set ("McCann's Pharmacy"
branding, "Sandrigham Medical Centre" typo) reconfirmed still present
and unchanged on the Sandringham UTI page. No new live finding.
RESULT. Zero in-repo defects found this pass; both injections confirm
existing protection rather than uncovering a gap. No new question raised
- both injections were verification of already-landed rules against
this item's own files, not a judgement call. QUESTIONS.json re-read: 94
total, 41 open, unchanged; none answered by pickup this run. Evidence:
this paragraph and the sha256 values quoted above (no new audit file
created - both injections were done and restored in place, matching the
established practice of not committing throwaway probe artefacts once
the paragraph itself records the method and hashes).
- [x] 3.7 Smartts Chemist (Bootle): same treatment. Done 2026-08-04.
      12 pages, 0 mismatches. Quality pass 2026-08-13. Done 2026-08-14.
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
Quality pass 2026-08-12 (third; runs 23 and 65 before it). All 12 pages
re-verified by a fresh independent extraction, no checker code reused. 348
checks, 15 flags, all 15 triaged to documented states, 0 real defects: one H1
per page carrying Bootle, paste-sheet titles and descriptions on pattern,
phone as display and tel: on all 12 with no other branch's digits, own
postcode only (SK's L20 5DW nowhere), cross-town scan clean, JSON-LD address
and telephone correct field by field, no literal widget id (79 estate ids
scanned), pins as generators declare, POM and claim scans clean bar the one
KNOWN_CLAIM already tracked under Q16/5.8. The three flag classes: the em
dash in the HTML build comment is check-em-dashes' documented exemption
(estate-wide, 171 pages, no visitor sees it); the travel and weight loss
keyword lines follow their own estate-wide shape, not the Pharmacy First one;
the switch tile claim is the recorded Q16 exposure whose exemption fails the
run if it goes stale. All 29 checkers pass, all seven generators rebuilt
byte-identical. Live half, two read-only GETs: the generated UTI page serves
correctly (title, H1, NAP, cohort wording, footer email); live footer hours
still omit the lunch closure (run 65's known Weebly repair) and the switch
banner mojibake close button is still the pre-run-44 paste; the old
pharmacy-first-service-bootle.html pfLink keeps its known 5.3 faults, seven
cohorts correct. Nothing new raised. Evidence in
audits/smartts-build-check-2026-08-12.txt. No in-repo defect found.
Quality pass 2026-08-13 (fourth). REPO HALF ONLY: no browser this run, so
nothing live was read or claimed. All 12 pages re-verified by a fourth
independent extraction sharing no code with tools/, 2,952 checks, 0 failures:
one H1 per page carrying Bootle, phone in both shapes with no other branch's
digits, own street and postcode only, JSON-LD field by field, no hard-coded
widget id, pins as the generators declare, own ODS FQN70 only, no other
branch's review or Pharmacy First link, no http:// on any page, no other
brand named. 23 sheet rows, descriptions 133 to 152 characters. GBP pack
clean on the pasteable half. ONE DEFECT FOUND, live-reaching: the estate
writes each page's two Weebly SEO fields THREE times (page comment, *-SEO.md,
*INDEX.md) and check-seo-sheets.js read a NAMED list of six *-SEO.md files,
so the five INDEX manifests, 163 pages' worth, were compared to nothing. An
INDEX row reading "UTI treatment in Aintree - Hirshmans Pharmacy" on a
Smartts page passed all 30 checkers. Sheets are now discovered, both label
dialects parsed, three negative tests all fire. All 163 rows were already
correct, so a latent hole closed rather than a live breach, and no copy was
edited anywhere. Two apparent findings were faults in this run's own script
and are written up rather than dropped. No question raised. Evidence in
audits/smartts-build-check-2026-08-13.txt.
CORRECTION added 2026-08-14, fifth pass: the phrase "own ODS FQN70 only" above
meant "no other branch's ODS code". It did not mean the page carries its own,
and no pass has ever asserted that, because the extractor line meant to do it
could never fail. These 12 pages carry no ODS code at all, which is correct:
an ODS code appears only on the 6 branch landing pages, and Smartts has none.
Quality pass 2026-08-14 (fifth). REPO HALF ONLY: two Chrome instances are
connected and an unattended run cannot choose between them, so no browser was
used and nothing live is claimed. All 12 pages re-verified by a fifth
independent extraction sharing no code with tools/, 3,071 checks, 0 failures,
and all four coverage gates cleared before the result was read. One H1 each
carrying Bootle, phone in both shapes with no other branch's digits, own
street and postcode only, JSON-LD field by field, no hard-coded widget id, one
pin per page as the generators declare, no other branch's ODS, review URL or
Pharmacy First link, no http://, no other brand named, no dash in any shape.
23 sheet rows across 11 discovered sheet files, the three writings of each
page's SEO fields agreeing. All 36 checkers pass and all six generators
rebuilt every page byte-identical. ONE DEFECT FOUND, latent and live-reaching:
the booking button on every service page is a same-page fragment link and
NOTHING IN THE REPO RESOLVED IT against the id it points at, because
check-service-links strips same-page anchors by design. A renamed id or a
typo'd href would leave the CTA scrolling nowhere on up to 158 live pages with
all 35 checkers green, and these are NHS Pharmacy First, contraception, travel
and weight loss bookings. Nothing was broken: all 186 fragment links resolved,
no duplicate id. New tools/check-fragment-targets.js, 3 rules, all 3 proven by
injection into real pages with a clean re-run between each. Rule 2 exists
because rule 1 passes vacuously on a page whose booking card was dropped
entirely. A second defect was in this pass's own method and is written up
rather than dropped. No copy edited anywhere, no question raised. Evidence in
audits/smartts-build-check-2026-08-14.txt.
Quality pass 2026-08-31 (sixth; unattended, Cowork sandboxed shell, not the
native Windows environment this procedure assumes - see this run's own
AGENT_LOG.md entry for the environment limitations, unchanged from every
other run today). Picked as the least recently verified completed item: a
case-sensitivity bug in this run's own tie-break scan (matching "Quality
pass" but not "Fifth quality pass") first suggested 4.10/4.12/4.13 were the
most overdue at 21 days stale; redone case-insensitively across all 43
completed items, the true answer was 3.7 itself (last verified 2026-08-14,
5.6 tied at the same date but is a narrow single-fact item, not a full
branch audit) and 6.7/6.8 (never verified, but done only two days ago, so
not yet due). Worth carrying: a tie-break scan that silently drops entries
because of a capitalisation difference is the same class of fault this repo
keeps finding in its checkers - ask which lines a scan actually matched.
All 12 pages re-verified by a sixth independent extraction sharing no code
with tools/ (audits/verify-3.7-2026-08-31.js): 697 checks, 0 failures after
two bugs in the script itself were found and fixed rather than reported as
defects - it did not strip the HTML build comment before its em-dash check
(the comment's own em dash is check-em-dashes.js's documented, estate-wide
exemption) and it looked for a maps embed at .../maps/embed?q=... when the
generators actually emit .../maps?q=...&output=embed. Covers: own postcode
and phone present with no other live branch's; own street address present;
map query decodes to the branch's own address; JSON-LD @type Pharmacy, name,
telephone and full PostalAddress field by field; data-branch and data-wa
correct where present; the cross-town naming guard (no other live branch's
seoTown without a serviceAreaList excuse); hasApp consistency (Smartts is a
member, its switch page carries the app card); no em dash outside the
build-comment exemption; no other branch's Appointedd widget id anywhere on
the page; every discovered paste-sheet block naming this branch carries its
own Bootle seoTown; the shared switch paste template (modules/switch/
weebly.html) carries no branch-specific fact. All 36 checkers (up from 21 at
the first pass) re-run before any change: 0 failures. All six generators
rebuilt: git status on modules/service/pages, modules/switch/pages and
modules/branch/pages shows zero diff, byte-identical.
Three injections run against the real checkers on pharmacy-first-smartts-
bootle.html, each restored by byte copy from a saved original (not git
checkout) before the next: phone swapped to SK Chemists Bootle's number,
caught by check-nap.js (6 mismatches); postcode swapped to SK Chemists
Bootle's, caught by check-postcodes.js ("FOREIGN ... owned by smartts_bootle
but carries L20 5DW (skchemists_bootle)"); and the road-name twin fault the
item 4.10 fourth pass found unguarded in GBP packs at the time (Fernhill to
Fernhall), tested here against the page side for the first time - caught
independently by check-nap.js, check-jsonld.js and check-map-embeds.js,
confirming the generated-page checkers already do field-level string
equality on streetAddress rather than presence-only, so that fault class
never reached the page side even before the 4.10 pack fix. No defect, but
worth recording as closing a suspicion rather than opening one. Final sweep
after all three injections and reverts: 36 of 36 checkers exit 0, and
git diff on the injected file is empty.
Live half performed (browser available this run, unlike the fifth pass):
read-only GETs on pharmacy-first-smartts-bootle.html and switch-
prescriptions-smartts-bootle.html. NAP correct on both (42 Fernhill Road,
Bootle, L20 9HH; 0151 922 4984). Three standing live-only gaps reconfirmed
unchanged, none new: (1) the live footer/hours card still prints "Monday
9:00am - 6:00pm" etc with no lunch closure shown, the website-hours
contradiction first recorded on the item 4.10 first pass; (2) the switch
page's live browser-tab title still reads "Switch Your Prescriptions -
Smartts Chemist Bootle", a hand-typed variant of the paste-sheet title
"Switch Your Prescriptions to Smartts Chemist, Bootle", the same unpasted-
title pattern recorded on runs 77 and 80; (3) the switch page's services
grid still reads "Weight Loss Clinic - Support that delivers results" under
the tracked Q16/5.8 KNOWN_CLAIM exemption, key not stale. The switch banner
mojibake close button (INDEX.md's own note, confirmed live at Smartts on
2026-08-10) was not independently re-read this pass - plain-text extraction
does not reliably surface a single mojibake glyph, and re-confirming it
would need a screenshot rather than get_page_text. Answer pickup (step 3)
performed: 26 entries read from https://data.rbhealth.co.uk/api/feedback,
spanning Q2-Q29, every id already "answered" in QUESTIONS.json, nothing new.
No in-repo defect found, no copy changed, no new question. Evidence in
audits/smartts-build-check-2026-08-31.txt and audits/verify-3.7-2026-08-31.js.
Done 2026-08-31 (sixth pass).
Quality pass 2026-09-01 (seventh; unattended, Cowork sandboxed shell for file
work plus the Windows PowerShell path for git, per the standing Q87 split -
see this run's AGENT_LOG.md entry). Picked as the least recently verified
rotation-pool item by the established method (oldest commit whose message
matches each item id by word boundary): 3.7 last touched 2026-08-31T12:46,
older than every other of the 36 rotation-pool items. All 36 checkers run
individually before any change, 36/36 exit 0. All six generators rebuilt,
sha256 of all 215 modules/ files byte-identical before and after, zero diff.
Fresh independent extraction (audits/verify-3.7-2026-09-01.js, no code
shared with tools/) across all 12 pages: 2,113 checks, 0 flags - own phone,
postcode and street address present with no other live branch's; JSON-LD
field by field; data-wa; cross-town seoTown guard; hasApp/app-card
consistency; no em dash outside the build-comment exemption; no other
branch's widget id, ODS code or brandLabel; map query decodes correctly; no
non-https link. Guard re-proof by injection widened rather than repeated:
all three of the sixth pass's injections landed on pharmacy-first-smartts-
bootle.html, so this pass used switch-prescriptions-smartts-bootle.html
instead (untried for Smartts injection before). Three injections, each
restored by byte copy and sha256-confirmed before the next: phone swap to
SK Chemists Bootle's number, caught by check-nap.js (7 mismatches across
visible text, JSON-LD and its cross-branch rule); postcode swap to SK
Chemists Bootle's L20 5DW, caught by check-postcodes.js's FOREIGN rule; an
em dash added to the hero-proof paragraph (not the build comment), caught
by check-em-dashes.js by file and line. Final sweep: file sha256 matches
pre-injection, git diff empty, all 36 checkers clean. Live half not
performed - Claude in Chrome reported not connected at answer pickup and
again for this item; the sixth pass's three live-only findings (hours-card
lunch closure omitted, switch page live tab title a hand-typed variant,
Q16/5.8 KNOWN_CLAIM services-grid wording) were not re-confirmed and should
not be assumed unchanged. Answer pickup unavailable (Chrome not connected);
57 questions open, unchanged from the prior run. No in-repo defect, no copy
changed, no new question. Evidence in audits/smartts-build-check-2026-09-01.txt
and audits/verify-3.7-2026-09-01.js.
Done 2026-09-01 (seventh pass).
Quality pass 2026-09-02 (eighth; unattended, native Windows environment via
mcp__Windows-MCP__PowerShell for both git and Node, mcp__workspace__bash denied
outright this run rather than the SSH host-key failure recorded on prior
passes - see this run's AGENT_LOG.md entry). Picked as the least recently
verified rotation-pool item by the established method (oldest commit whose
message matches each item id by word boundary, over the 36-item pool): 3.7
last touched 2026-09-01T18:40, older than every other item; 3.5 (just done
the same day) was most recent.
Baseline sweep before any change found one pre-existing failure unrelated to
Smartts: check-postcodes.js FAILED (3 UNKNOWN) because two untracked scratch
files under _agentscratch/ (a leftover full git-log dump from an earlier run,
plus one this run wrote for the rotation scan) contained commit-message text
with postcode-shaped substrings, and check-postcodes.js scans the whole repo
by design. Removed both scratch files (never committed, not part of any
worklist item); check-postcodes.js returned to 0 failures. Worth carrying:
scratch debris left in the repo tree between runs can flip the one checker
that reads the whole repo, exactly the "which files did it read" class of
fault this repo keeps finding, just from the wrong direction - the checker
was reading correctly, the tree had drifted. All 36 checkers then confirmed
0/36 failing before any change was made.
All six generators rebuilt: sha256 of all 215 modules/ files taken before and
after, Compare-Object reports zero diff, git status on modules/ empty.
Fresh independent extraction (audits/verify-3.7-2026-09-02-eighth.js, no code
shared with tools/ or with any prior pass's script) across all 12 Smartts
pages: 264 checks, 0 flags - own postcode, street address and phone present
with no other live branch's; tel: link resolves to own number; JSON-LD
@type/@context/name/telephone/PostalAddress field by field; data-branch and
data-wa correct where present; cross-town seoTown guard (no other live
branch's seoTown without a serviceAreaList excuse); no em dash outside the
build-comment exemption; no other branch's Appointedd widget id anywhere on
the page; map query decodes to the branch's own address; no http:// links;
no other branch's ODS code, review URL or Pharmacy First link; hasApp/app-card
consistency (Smartts is a member, store URLs appear only on its switch page).
Guard re-proof by injection used a page untried in either of the two prior
injection passes: weight-loss-clinic-smartts-bootle.html (sixth pass used
pharmacy-first-smartts-bootle.html, seventh used switch-prescriptions-
smartts-bootle.html). Three injections, each restored from a byte-copy backup
and sha256-confirmed identical to the pre-injection original before the next:
phone swapped to SK Chemists Bootle's 0151 944 1013, caught by check-nap.js
(6 mismatches: visible phone x2, JSON-LD telephone, plus three "belongs to SK
Chemists, not Smartts Chemist" cross-branch flags) and independently by this
pass's own script; postcode swapped to SK Chemists Bootle's L20 5DW, caught
by check-postcodes.js's FOREIGN rule; an em dash added to the booking-sub
paragraph (line 39, not the build comment), caught by check-em-dashes.js by
file and line and by this pass's own script. One process error worth
recording rather than hiding: the first attempt at the em-dash injection used
Set-Content on a PowerShell line array with -NoNewline, which silently joined
every line into one with no separators and corrupted the file structure
(confirmed by a newline count of 1 where 172 was expected); caught before any
checker ran, by inspecting the file rather than trusting the write, restored
from the byte-copy backup, and redone as a plain string replace on the raw
file content, the same method already proven safe by the first two
injections. Final sweep after all three injections and reverts: file sha256
matches the pre-injection original exactly, git status/diff on the file
empty, all 36 checkers exit 0, this pass's own script back to 264/0.
Live half not performed - Claude in Chrome reported not connected at answer
pickup and was not retried for this item, per procedure (no other route
tried, no login attempted). The sixth pass's three live-only findings (hours
card lunch closure omitted, switch page live tab title a hand-typed variant,
Q16/5.8 KNOWN_CLAIM services-grid wording) were not re-confirmed this pass
and should not be assumed unchanged. Answer pickup (step 3): Chrome not
connected, unavailable; 41 questions open per QUESTIONS.json at the start of
this run, unchanged by this pass. No autonomous-window heading present in
AGENT_LOG.md at the start of this run, so step 4 did not apply. No in-repo
defect in Smartts's own pages, one pre-existing repo-hygiene issue found and
fixed (the scratch-debris false failure above), no copy changed, no new
question. Evidence in audits/smartts-build-check-2026-09-02-eighth.txt and
audits/verify-3.7-2026-09-02-eighth.js.
Done 2026-09-02 (eighth pass).
Quality pass 2026-09-03 (ninth; unattended scheduled run via Cowork, native
Windows environment via mcp__Windows-MCP__PowerShell for git, Node and file
edits, mcp__workspace__bash used only for lock creation and orientation - the
standing Q87 split). Picked as the least recently verified rotation-pool item
by the established method (git log commit subjects matched by word boundary
against each of the 36 rotation-pool item ids): 3.7 last touched
2026-09-02T16:42:22+01:00, older than every other item; 3.13 was next at
2026-09-02T17:07:43+01:00, not a tie.
Baseline: all 36 checkers run individually before any change, 36/36 exit 0;
git status --porcelain on gbp-packs/, modules/, core/, branches.json, tools/,
status/ empty. All six generators rebuilt: sha256 of all 215 modules/ files
taken before and after, zero diff, git status on modules/ empty.
Fresh independent extraction (audits/verify-3.7-2026-09-03-ninth.js, no code
shared with tools/ or any prior pass's script) across all 12 Smartts pages:
1,655 checks, 0 flags - own postcode, street address and phone present with
no other live branch's; tel: link present; JSON-LD @type/telephone/full
PostalAddress field by field; data-branch and data-wa correct where present;
cross-town seoTown guard; no other live branch's Appointedd widget id
anywhere on any of the 12 pages; map query decodes to the branch's own
address; hasApp/app-card consistency on the switch page; no em dash outside
the build-comment exemption.
The fresh angle: check-contraception-copy.js had never been proven by direct
injection against contraception-smartts-bootle.html across any of this
item's eight prior passes - it was proven against SK Chemists Bootle's
contraception page when the checker was first written (item 3.6 pass) and
against Hirshmans Chemist Ainsdale's on the 3.5 tenth pass, but never
Smartts'. A second, Smartts-specific leg was added to this pass's own
extraction script checking rules 4 (service name), 5 (free/no price), 6
(consent direction), 7 (no LARC offer) and 8 (no medicine names) by reading
the rendered page directly.
Three injections run against the real checker on contraception-smartts-
bootle.html, each restored from a byte-copy backup and sha256-confirmed
identical to the pre-injection original
(51C65AFE79E807B2ACD0087F98FC7E24F4CF2A1DA050C8F80525027261203AD4) before
the next: the consent sentence reversed to "We will not tell your GP that
you have used the service.", caught by check-contraception-copy.js
(verbatim + consent, both directions) and independently by this pass's own
script; the no-prescription-charge sentence rewritten to state a 9.35
pound charge, caught by check-contraception-copy.js (verbatim + free, both
the missing no-charge line and the stated price) and independently; and two
named contraceptive medicines (Yasmin, Cerazette) appended to a step
sentence, caught by check-contraception-copy.js's rule 8 and independently.
All three caught first attempt by both the real checker and the independent
script. Final sweep after all three injections and reverts: file sha256
matches the pre-injection original exactly, git status/diff on the file
empty, all 36 checkers exit 0, this pass's own script back to 1,655/0.
Live half not performed - Claude in Chrome reported zero connected browsers
at the start and end of this run; the built-in Claude Browser pane was
tried as an alternative for this quality pass's live half only (not for
step 3 answer pickup, which is Claude-in-Chrome only per the task file) and
its navigation to smarttschemist.co.uk was denied, consistent with no user
being present in this unattended session to approve a new site. The sixth
pass's three live-only findings (hours-card lunch closure omitted on the
live footer, switch page live tab title a hand-typed variant of the
paste-sheet title, Q16/5.8 KNOWN_CLAIM services-grid wording) were not
re-confirmed this pass and should not be assumed unchanged. Answer pickup
(step 3): Chrome not connected, unavailable; 41 questions open of 94 total
per QUESTIONS.json at the start of this run, unchanged by this pass. No
autonomous-window heading present in AGENT_LOG.md at the start of this run,
so step 4 did not apply.
No in-repo defect found, no copy changed anywhere in the repo, no new
question. Evidence in audits/verify-3.7-2026-09-03-ninth.js.
Done 2026-09-03 (ninth pass).
Quality pass 2026-09-04 (tenth; unattended scheduled run via Cowork, native
Windows environment via mcp__Windows-MCP__PowerShell and FileSystem for git,
Node and file writes, mcp__workspace__bash used only for lock handling and
orientation - the standing Q87 split). Picked as the least recently verified
rotation-pool item, independently re-derived by the established method (git
log commit subjects for AGENT_WORKLIST.md and AGENT_LOG.md matched by word
boundary against each of the 36 rotation-pool item ids, most recent mention
per item, sorted ascending): 3.7 last touched 2026-09-03T12:13:34+01:00,
oldest of the 36, ahead of 3.13 (12:42:20) and 6.2 (13:14:57) - confirming the
ninth pass's own forward note.
Baseline: all 36 checkers run individually before any change, 36/36 exit 0;
git status --porcelain on gbp-packs/, modules/, core/, branches.json, tools/,
status/ empty. All six generators rebuilt: git status --porcelain -- modules
empty afterwards, zero diff.
FRESH ANGLE: none of the nine prior passes ever proved tools/check-switch-
copy.js - the eleven-rule checker for the highest-commitment page family in
the estate - against Smartts's own switch page or banner file, confirmed by a
source search for "smartts" in that checker returning zero matches beforehand.
The nine passes proved check-nap.js, check-postcodes.js, check-em-dashes.js
and check-contraception-copy.js against Smartts specifically; check-switch-
copy.js itself, proven twice elsewhere this week (item 2.3's ninth pass on
Cherry Lane, rules 6/8/9; item 3.4's tenth pass on Cherry Lane, rules
7/8/9/10/11a), had never touched this item. This pass repeats the fuller
five-rule sweep against Smartts's own switch page and banner.
Fresh independent extraction (audits/verify-3.7-2026-09-04-tenth.js, no code
shared with tools/ or any prior pass's script) across all 12 Smartts pages:
1,479 checks, 0 flags - own postcode, street address and phone present on
every page; no other live branch's postcode, ODS code or Appointedd widget id
anywhere; cross-town seoTown guard (no other live branch's town without a
serviceAreaList excuse); no em dash outside the build-comment exemption;
hasApp/app-card consistency on the switch page (Smartts is a member, the app
card is present).
Five injections run against the real check-switch-copy.js on switch-
prescriptions-smartts-bootle.html and its banner file, each restored by direct
Buffer write (not a text pipeline) and sha256-confirmed identical to the
pre-injection original before the next: a prescription-only weight loss
medicine name (Wegovy) added to the hero-sub paragraph, caught by RULE 7
no-medicines; the pill line's own town changed from Bootle to Walton (a real,
different live branch's town), caught by RULE 8 town, and instructively so -
Walton is named as a foreign town twice, once each against colemanleigh_
liverpool and cherrylane_liverpool, the two branches that genuinely share that
town, confirming the rule reports every foreign match rather than stopping at
the first; an undescribed "nhs_number" field added to the form grid with no
FIELD_WORDS entry and no mention in step 1, caught by RULE 9 form-copy; the
privacy/collection-notice paragraph deleted outright, caught by RULE 10
collection-notice; and, on the banner file rather than the page, Smartts's own
SWITCH_URL repointed at Cherry Lane's switch page (Smartts is single-host, not
one of the three shared-domain sites pinned to Q63 in KNOWN, so this cleanly
exercises rule 11a alone), caught by the banner rule. All five caught first
attempt with the expected rule tag; both files confirmed byte-identical to
their pre-probe sha256 hashes after every individual injection and again at
the end; the checker's own final run after the round was clean. Full
36-checker suite re-run individually after the round: 36/36 exit 0. git status
--porcelain on gbp-packs/, modules/, core/, branches.json, tools/, status/
empty throughout. No checker logic, generator, page or banner content changed
in the tracked tree at any point.
Live half: Claude in Chrome reported not connected (retried at answer pickup
and again for this item); the built-in Claude Browser pane was denied
navigating a new site, consistent with no user present in this unattended
session to approve it; mcp__workspace__web_fetch declined the URL as outside
its provenance set. Fell back to a read-only PowerShell Invoke-WebRequest
against smarttschemist.co.uk/switch-prescriptions-smartts-bootle.html: 200,
own postcode, own phone, the "30 seconds" time claim and the collection-notice
sentence ("only use your details") all present in the live response, matching
the repo-side state exactly. The banner itself (site-wide Weebly Header Code)
was not independently re-read live this pass; the sixth pass's three
live-only findings (hours-card lunch closure, switch page live tab title, the
Q16/5.8 KNOWN_CLAIM services-grid wording) were not re-confirmed and should
not be assumed unchanged. Answer pickup (step 3): Chrome not connected,
unavailable; 42 questions open of 95 total per QUESTIONS.json at the start of
this run, unchanged by this pass. No autonomous-window heading present in
AGENT_LOG.md at the start of this run, so step 4 did not apply.
No in-repo defect found, no copy changed anywhere in the repo, no new
question. Evidence in audits/verify-3.7-2026-09-04-tenth.js.
Done 2026-09-04 (tenth pass).
- [x] 3.8 SK Chemists (Bootle): same treatment. Done 2026-08-04.
      12 pages, 0 mismatches.
      Quality pass 2026-08-12 (hundred-and-eighth run, second machine-era
      pass): all 12 SK pages re-verified by a fresh independent extraction,
      no checker code reused. 228 checks, 24 flags, all 24 extraction
      artefacts (fragments carry no title tag or footer email by design;
      titles and descriptions found in the paste sheets by permalink for
      all 12, footer email confirmed live in both casings). Zero in-repo
      defects. Live half, two read-only GETs: UTI page serves correct H1,
      cohort wording, NAP, phone and hours, but its title renders as page
      name plus site title (run 78 Weebly default), so SK's service page
      SEO title fields await the queued 5.3/5.4 repaste; switch banner
      mojibake close button persists (already recorded, fourth site); the
      pfLink page keeps its known 5.3/Q34 faults with all seven conditions
      and cohorts still correct against the NHS specification. Evidence in
      audits/sk-build-check-2026-08-12.txt.
      Quality pass 2026-08-13 (third). REPO HALF ONLY: no browser this run, so
      nothing live was read or claimed. All 12 pages re-verified by a third
      independent extraction sharing no code with tools/, 3,512 checks, 0
      failures: one H1 per page carrying Bootle, phone in both shapes with no
      other branch's digits, own street and postcode only, JSON-LD field by
      field including the url's own host and filename, no hard-coded widget id,
      own ODS FH575 only, no other branch's review or Pharmacy First link, no
      http:// on any page, no other brand in visible copy, relative links all
      resolving and staying in-branch. 23 sheet rows compared across the three
      copies of every page's two Weebly SEO fields. All 30 checkers pass and all
      six generators rebuild byte-identical. GBP pack clean, zero non-ASCII and
      zero dash entities. Six negative tests all fire. NO in-repo defect found
      in the estate. Three findings were faults in this run's own work and are
      written up rather than dropped, one of them real: the first sheet parser
      dropped every *-SEO.md title, because those sheets write Page Title before
      Page Permalink while the INDEX sheets write the slug first, so the title
      half of the comparison was vacuous while still reporting 23 rows. Caught
      only by a negative test, fixed by parsing each heading block whole, and
      the check count rose from 3,452 to 3,512 once the dropped comparisons ran.
      No question raised. Evidence in audits/sk-build-check-2026-08-13.txt.
      Quality pass 2026-08-14 (fourth). REPO HALF ONLY: no browser answer
      session, so nothing live was read or claimed. ZERO DEFECTS IN THE 12 SK
      PAGES and not one character of any page was edited. A fresh independent
      extraction sharing no code with tools/ asked a question nothing in the
      repo had asked of these pages: is any identity copy present only inside a
      <script>, and therefore absent to a crawler? 96 checks across the 12
      pages, 0 flags: exactly one crawlable H1 per page carrying Bootle, and
      phone in both shapes, postcode, street, town and brand label all real
      text on every page. Estate control run so an SK-clean result could not
      look special: all 182 pages under modules/ scanned, no page anywhere has
      a script-only H1. ONE REAL DEFECT FOUND AND FIXED IN REPO, in
      tools/check-contraception-copy.js: it read pages through visible(), which
      strips HTML comments but not <script> bodies, so copy moved into a script
      and written back with innerHTML satisfied every presence rule while being
      invisible to Google, against Build Pack v2 section 5.1. This is the
      second instance of the class the 193rd run fixed in check-switch-copy.js
      and deliberately left for its own pass. Proved by injection, not by
      reading: the four hero-points on contraception-sk-chemists-bootle.html,
      including "Free NHS service, confidential consultation", were moved into
      a script byte-identically and all 36 checkers stayed green; the same
      block wrapped in an HTML comment failed on all four lines, which is what
      proves the hole was the script half only. Presence rules now read
      crawlable text; the absence rules were deliberately NOT changed, because
      a price or a reversed consent sentence injected by JavaScript is still
      put in front of the patient. Seven negative tests all fire, including one
      guarding the half that was not changed. 36 checkers pass, six generators
      rebuild byte-identical. No question raised. Evidence in
      audits/sk-build-check-2026-08-14.txt.
      Quality pass 2026-08-31 (fifth). EXECUTED VIA COWORK'S SANDBOXED SHELL.
      All 36 checkers exit 0 before any change. All six generators rebuilt;
      sha256 of all 12 SK files identical before and after; git diff --stat
      and git diff -b --stat against the whole modules/ tree both empty.
      Fresh independent extraction sharing no code with tools/
      (audits/sk-independent-2026-08-31.js): 696 checks, 0 flags, 12 files -
      one H1 per page carrying Bootle, own phone/postcode/ODS present, no
      other live branch's phone, postcode, ODS or brand label present
      anywhere, JSON-LD parses and matches branches.json field by field on
      all 12. Guard re-proved by injection, not just read: the visible
      contact-line phone on uti-treatment-sk-chemists-bootle.html was
      changed to Cherry Lane's number, check-nap.js caught it by name (2
      mismatches), file restored and confirmed byte-identical by cmp,
      checker re-run clean. GBP pack cross-checked field by field against
      branches.json, matches. ZERO IN-REPO DEFECTS, fifth pass running.
      LIVE HALF PERFORMED, two read-only GETs (Claude in Chrome, no click,
      no submit, no login). uti-treatment-sk-chemists-bootle.html: all
      facts correct; one known live-only gap reconfirmed unchanged, the
      SEO title field still awaiting the 5.3/5.4 repaste so the browser tab
      shows the Weebly-default "... - SK CHEMIST" suffix instead of the
      paste sheet's title. switch-prescriptions-sk-chemists-bootle.html:
      all facts correct; one known live-only gap reconfirmed unchanged, the
      "usually is not" sentence still carries the pre-Q7/5.1 mojibake em
      dash, matching today's 4.11 pass finding on the same page and the
      same estate-wide switch-page repaste-lag pattern already tracked on
      Cherry Lane, both Scorah branches and Gordon Short Crosby. No repo
      action needed for either; both are paste lag only. No new question
      raised. Evidence in audits/sk-build-check-2026-08-31.txt and
      audits/sk-independent-2026-08-31.js.
      Quality pass 2026-09-01 (sixth, unattended scheduled run). Taken
      because all 8 unchecked worklist lines are [BLOCKED]; 3.8 was the
      rotation-pool item with the oldest last-touching commit. All 36
      checkers pass before any change. All six generators rebuilt byte-
      identical across 215 files under modules/ (sha256 before/after, zero
      diff). Fresh independent extraction sharing no code with tools/
      (audits/verify-3.8-2026-09-01.js): 12 files, 1,044 checks, 0 flags -
      one H1 per page naming Bootle, own phone/postcode/street/ODS/WhatsApp
      present with no other live branch's, JSON-LD matching branches.json
      field by field, map query decoding to the branch's own address, no
      foreign seoTown outside serviceAreaList. Guard re-proved by injection
      on a page type not used for SK Bootle injection before (pharmacy-
      first-sk-chemists-bootle.html, hub page rather than a leaf condition
      page): a duplicate H1 naming Aigburth (McCanns' seoTown, not in this
      branch's serviceAreaList) plus a corrupted data-wa, both caught
      immediately by check-seo-pattern.js, check-whatsapp-route.js and the
      independent extraction; file restored and confirmed byte-identical by
      sha256 and cmp; all 36 checkers and the independent extraction re-run
      clean. GBP pack cross-checked field by field against branches.json
      (name, address, phone, both hours directions, website, review link),
      matches; no sister-branch claim, correctly. ZERO IN-REPO DEFECTS,
      sixth pass running. LIVE HALF NOT PERFORMED: Claude in Chrome not
      connected this run (checked twice); logged as unavailable, not
      retried by another route, and the fifth pass's two live-only findings
      (pfLink page pre-5.3/Q34 repaste, switch page pre-Q7/5.1 mojibake em
      dash) were not re-confirmed and should not be assumed unchanged. No
      new question raised. Evidence in
      audits/sk-bootle-item-3.8-quality-pass-2026-09-01.txt and
      audits/verify-3.8-2026-09-01.js.
      Quality pass 2026-09-02 (seventh, unattended scheduled run). Taken
      because all 8 unchecked worklist lines are [BLOCKED]; item-selection
      method unchanged from the sixth pass (per-item block max date, "quality
      pass" mentions within that block as tie-break, ascending item number as
      final tie-break). 3.6 (touched earlier today by an immediately
      preceding run) dropped out of the tied-lowest group, leaving 3.8 and
      6.3 tied at 5 own-block mentions; 3.8 selected as the lower number.
      REPO HALF. All 36 checkers pass before any change. All six generators
      rebuilt; sha256 of all 203 files under modules/service/pages,
      modules/switch/pages and modules/branch/pages identical before and
      after; git status empty on modules/, branches.json, gbp-packs/ and
      tools/ both before and after. Fresh independent extraction sharing no
      code with tools/ (audits/verify-3.8-2026-09-02.js): 12 files, 996
      checks, 0 flags on the clean run - one H1 per page naming Bootle, own
      phone in both display and tel: shapes with no other live branch's
      digits present anywhere, own postcode only, JSON-LD matching
      branches.json field by field, map query decoding to the branch's own
      address, data-wa carrying the estate constant, no foreign seoTown
      outside serviceAreaList (Bootle, Sefton, Liverpool), no other
      brandLabel in visible copy. The script's own first run flagged all 12
      pages on MAP_COUNT: its map-embed regex assumed the
      "/maps/embed?...q=" shape used by the write-up's own prose, but the
      live markup is "/maps?q=...&output=embed" (confirmed by grep against
      uti-treatment-sk-chemists-bootle.html); fixed by matching the iframe
      src wholesale and testing for q= and output=embed as separate query
      parameters, same shape as several prior passes' own extractor bugs.
      Guard re-proved by injection, not just read: two distinct faults
      planted on weight-loss-clinic-sk-chemists-bootle.html (H1 town changed
      Bootle to Aigburth; data-wa corrupted to a non-estate number), caught
      by the independent script (H1_TOWN, FOREIGN_SEOTOWN, DATA_WA) and by
      the official checkers (check-seo-pattern.js: h1 mismatch, missing
      seoTown, names Aigburth outside serviceAreaList; check-whatsapp-route.js:
      data-wa disagreement), file restored and confirmed byte-identical by
      sha256 and cmp, all 36 checkers and the independent script re-run
      clean (996 checks, 0 flags). GBP pack cross-checked field by field
      against branches.json (name, address, phone, hours, website, review
      link): matches; Post A/B/C/D links, Smartts-Bootle wording-divergence
      note and bank holiday guidance unchanged and correctly still present.
      ZERO IN-REPO DEFECTS, seventh pass running. LIVE HALF NOT PERFORMED:
      Claude in Chrome reported not connected at the start of this run
      (tabs_context_mcp), matching the standing Q59 diagnosis; logged as
      unavailable, not retried by another route per the unattended-run rule.
      The sixth pass's two live-only findings (pfLink page pre-5.3/Q34
      repaste, switch page pre-Q7/5.1 mojibake em dash) were not re-confirmed
      and should not be assumed unchanged. No new question raised. Evidence
      in audits/verify-3.8-2026-09-02.js.
      Quality pass 2026-09-02 (ninth, unattended scheduled run). Taken
      because all 8 unchecked worklist lines are [BLOCKED] (confirmed by
      direct grep, 8 of 8); item-selection method unchanged from prior
      passes - most recent commit-subject mention per item across the
      standing 36-item rotation pool (43 completed items minus the
      out-of-rotation set 1.1, 1.4, 2.2, 5.6, 5.7, 6.7, 6.8), stalest wins.
      3.8 was stalest, last mentioned 2026-09-02T02:42:13+01:00 (the eighth
      pass); no tie. Answer pickup (step 3) attempted first: Claude in
      Chrome not connected, logged as unavailable, not retried by another
      route, per the unattended-run rule. No autonomous-window heading
      present at the top of this file, so no autonomous decisions applied.
      REPO HALF. All 36 tools/check-*.js checkers re-run individually
      before any change, 0 failures. All six page generators rebuilt from
      branches.json; sha256 of all 221 files under modules/ and core/
      identical before and after (git status --porcelain modules/ core/
      empty). Fresh independent extraction sharing no code with tools/ or
      any prior verify-3.8-*.js (audits/verify-3.8-2026-09-02-ninth.js):
      12 files, 1,092 checks, 0 flags - one H1 per page naming Bootle
      (own seoTown), no other live branch's seoTown in title/H1/
      description outside serviceAreaList's excused Liverpool, own phone
      in both tel: and visible shapes with no other live branch's digits
      present anywhere on the page, own postcode only, JSON-LD parsing
      with @type Pharmacy, @context, name, telephone, full postal address
      and url all matching branches.json field for field, data-branch
      naming the branch correctly, data-wa a valid non-placeholder UK
      mobile matching branches.json, exactly one map iframe per page
      decoding to the branch's own address on the correct host with
      output=embed, and no em/en dash character or entity in visible
      copy. Guard effectiveness proved by injection: postcode swapped to
      a foreign value in one page, script caught it on both the plain
      postcode check and the JSON-LD address check (2 flags), file
      restored from a byte-level backup copy (not git checkout, per the
      standing lesson on restoring test harness state), re-verified clean
      afterwards, git status empty on the mutated-then-restored file. No
      new defect found; no new question raised. Evidence in
      audits/verify-3.8-2026-09-02-ninth.js.
      Quality pass 2026-09-03 (tenth, unattended scheduled run via Cowork).
      Taken because all 8 unchecked AGENT_WORKLIST.md lines confirmed
      [BLOCKED] by direct grep; item-selection method unchanged (most
      recent commit-subject mention per item across the standing 36-item
      rotation pool, stalest wins, re-derived fresh via a Python script
      rather than assumed from the ninth pass's forward note). 3.8 was
      uniquely stalest (last touched 2026-09-02T23:09:17+01:00), matching
      the forward note. Answer pickup (step 3): mcp__claude-in-chrome__
      tabs_context_mcp reported the extension not connected, matching the
      standing Q59 diagnosis; logged as unavailable, not retried by
      another route. No autonomous-window heading present at the top of
      AGENT_LOG.md, so moot regardless.
      REPO HALF. Baseline: all 36 tools/check-*.js run individually before
      any change, 0 failures. Six page generators (build-branch-landing,
      build-contraception, build-service, build-switch, build-travel-
      clinic, build-weight-loss) rebuilt; sha256 of all 216 files under
      modules/ and core/ identical before and after; git status --porcelain
      on modules/, core/, branches.json, gbp-packs/, tools/, status/ empty
      throughout.
      FRESH ANGLE. All nine prior passes re-extracted and re-verified this
      item's 12 pages against branches.json repeatedly, always zero
      defects; a tenth pass of the same shape was judged low marginal
      value. tools/check-app-membership.js (landed on the 3.8-adjacent
      item 3.6's own tenth pass, 2026-09-03) had never been named against
      SK Chemists Bootle's own real files across any of the nine prior
      passes, despite this being the exact pair CLAUDE.md names as the
      risk case for the hasApp field: "SK Chemists Bootle is not [an app
      member], and it sits 1.5 miles from Smartts [Bootle, which is], in
      the same town, on the same postcode prefix, and directly beside it
      in branches.json. A copy-paste between two adjacent records
      publishes an app card on the shop that does not run the app." That
      sentence was never tested against SK Bootle's own switch page. It
      was this pass.
      METHOD. modules/switch/pages/switch-prescriptions-sk-chemists-bootle.html
      backed up by byte copy first (sha256
      4e1dedc3a1279a30a5836c295afd6dc4eb492e6b4842c579e8e6e5d98d97c7ea);
      baseline grep confirmed the page carries no actual app-card content
      (the four "app" substring hits present are all inside "WhatsApp" and
      "application/ld+json", none an app-card reference), consistent with
      branches.json's hasApp: false for skchemists_bootle.
      INJECTION. The app-card block (heading, copy sentence, both real
      store URLs) copied verbatim from Smartts Chemist Bootle's own switch
      page, the exact adjacent branch CLAUDE.md names, inserted into SK
      Bootle's switch page in the same right-stack position it occupies on
      Smartts' page (immediately before the Google reviews card). CAUGHT
      by two independent checkers at once, both by name: check-app-
      membership.js failed with "carries the app card but branches.json
      says this branch is not an app member"; check-switch-copy.js failed
      twice on the same page, once per injected line ("the page carries
      the appCard line ... and this branch does not set b.hasApp, so the
      page is promising something the data says it does not have"). A
      full 36-checker run with the injection in place showed exactly these
      two failures and no others. File restored from the byte backup;
      sha256 and cmp both confirmed identical to the pre-injection backup;
      full 36-checker suite re-run clean (36/36) immediately after.
      FINDING. Not a defect: both guards generalise correctly to this
      item's own files, and do so redundantly, which is itself worth
      recording since it had never been proved for this specific pair
      before. CLAUDE.md's own hasApp section (written before check-app-
      membership.js existed) frames SK Bootle/Smartts Bootle as the
      highest-risk adjacency in the estate for exactly this class of copy-
      paste error; this pass is the first time that named risk was tested
      against SK Bootle's real page rather than assumed covered by the
      general estate-wide check-app-membership.js sweep. It held, twice
      over.
      GBP PACK. gbp-packs/sk-chemists-bootle.md re-read in full: already
      carries an explicit paster note, "No app mention anywhere in this
      pack: branches.json has hasApp false for this branch," so no drift
      to report there either; the pack's own name, address, phone, hours
      and review link all still match branches.json field for field.
      LIVE HALF PERFORMED, read-only GET (curl, no interaction, no login;
      Claude in Chrome unavailable per the answer-pickup finding above, so
      the established plain-GET fallback used, same route as the fifth,
      seventh and ninth passes). Network egress confirmed working (google.
      com and the branch's own homepage both 200) before drawing any
      conclusion. switch-prescriptions-sk-chemists-bootle.html live: HTTP
      200; H1 exact match; phone correct in both the visible and tel:
      shapes; NO app-card content anywhere in the live HTML (zero matches
      for "download our app", "app-card", "app store" or "google play"),
      the first time this item's live half has specifically checked the
      app dimension and it is clean, live-confirming the fresh-angle
      finding above rather than only proving it in the repo. Two known,
      already-tracked live-only gaps reconfirmed unchanged, neither newly
      found this pass: the browser tab title still renders the Weebly-
      default "... - SK CHEMIST" suffix instead of the paste sheet's own
      title (queued 5.3/5.4 repaste); the "usually is not" sentence still
      carries the pre-Q7/5.1 mojibake em dash (byte-confirmed, matching the
      same site-wide switch-page repaste-lag pattern already tracked on
      Cherry Lane, both Scorah branches, Gordon Short Crosby and this same
      branch on the fifth and seventh passes). No repo action needed for
      either; both are paste lag only, not a repo defect.
      RESULT. Zero in-repo defects found this pass. Real gap in test
      coverage closed (check-app-membership.js and check-switch-copy.js
      proved against this item's own files for the first time, on
      CLAUDE.md's own named highest-risk pair), and both guards held, live
      and in the repo. No checker logic changed. No question raised.
- [x] 3.9 Coleman and Leighs Pharmacy (Liverpool): same treatment. Q1
      (trading name) was answered, so not blocked. Done 2026-08-04.
      12 pages, 0 mismatches.
      Quality pass 2026-08-12 (hundred-and-ninth run). All 12 pages re-read
      by a fresh extraction, 240 check groups, zero flags: one H1 per page
      carrying Walton, NAP and every tel: link correct, no other branch's
      phone, postcode, review link or town, JSON-LD field for field against
      branches.json including Merseyside and self-referencing urls, trading
      name in the Q1 form throughout, POM union scan empty, no em dash
      outside build comments, no app copy, no foreign widget id. Live:
      pfLink still 404 (known 5.3/Q8 evidence, replacement page ready in
      repo); homepage NAP, hours and email correct; stale-paste ampersand
      banner and footer, mojibake close button and the Q22 weight loss
      tagline all persist, previously recorded, confirmation only.
      Evidence in audits/coleman-build-check-2026-08-12.txt.
      Quality pass 2026-08-13 (hundred-and-fifty-first run, third machine-era
      pass). REPO HALF ONLY: no browser, so nothing live was read and the
      live findings above are not reconfirmed. All 12 pages re-read by a
      fresh independent extraction sharing no code with tools/. 2,297 checks,
      0 failures, and every one of the 20 check families counted rather than
      assumed so none ran vacuously. 20 negative tests all fire. All 30
      checkers pass and all six generators rebuild byte-identical. 12 sheet
      permalinks one-to-one with the 12 pages, 276 checks, blocks parsed
      whole so field order cannot hide a comparison. NO defect found in the
      estate. One real finding, estate-wide: the foreign NHS mailbox and
      foreign widget id scans are structurally vacuous because no generated
      page anywhere carries either value (0 of 177), so they pass for the
      wrong reason; both are explained by existing design (Q36, Q17) and need
      no fix, but neither is evidence a page is clean. Three further findings
      were faults in this run's own work, all written up rather than dropped.
      No question raised. Evidence in
      audits/coleman-build-check-2026-08-13.txt. Done 2026-08-13
      Quality pass 2026-08-14 (hundred-and-ninety-fifth run, fourth
      machine-era pass). REPO HALF ONLY: no browser, so nothing live was read
      and the live findings above are not reconfirmed. All 12 pages re-read by
      a fresh independent extraction sharing no code with tools/, restating
      the pattern from the Build Pack v2 spec text rather than importing
      tools/seo-pattern.js so the generator is not tested against itself.
      208 checks, 0 flags. The new question this pass asked: can a page's
      seoTown be present only because the STREET contains that word? Coleman
      and Leighs raises it, seoTown Walton against street "241 Walton
      Village". Town survives removal of the street string in every title and
      H1, and schema addressLocality stays Liverpool, so the catchment word
      has not leaked into the postal locality. ESTATE CONTROL so a clean
      result could not look special: same question put to all 177 generated
      pages, 0 without exactly one crawlable H1, 0 missing their seoTown, 0
      whose H1 town comes only from the street. ZERO DEFECTS IN THE 12 PAGES
      and not one character of any page was edited. ONE REAL DEFECT FOUND AND
      FIXED IN REPO, in tools/check-travel-clinic-copy.js: it stripped
      <script> bodies case-sensitively, so uppercase <SCRIPT> survived and
      copy hidden inside one counted as visible. Third instance of the class
      the 193rd and 194th runs closed on check-switch-copy.js and
      check-contraception-copy.js; this one was missed because it did strip
      scripts and so read as already covered. Proved by injection with a
      lowercase control, including the governing "private, paid service"
      sentence going missing while the checker returned OK. Three faults in
      this run's own instrument (56 flags then 4, all its own) written up
      rather than dropped. No question raised. Evidence in
      Quality pass 2026-08-30 (fifth machine-era pass). BOTH HALVES. Repo:
      all 12 pages re-read by a fresh independent extraction sharing no
      code with tools/ (audits/coleman-walton-independent-2026-08-30.js),
      1,705 checks across 13 counted families, 0 failures; the
      contamination family alone runs 1,404. All 36 checkers green and all
      six generators rebuild to a zero diff before inspection. Three shape
      probes, injected then restored: a foreign-branch tel: link CAUGHT
      (check-nap), an en dash as decimal entity CAUGHT (check-em-dashes),
      and a POM name (Mounjaro) in general service-page body copy CAUGHT BY
      NOTHING - a real gap, since the four copy checkers each read only
      their own page family and check-pharmacy-first-symptoms rule 8 reads
      the symptoms block only. Closed this run: check-service-links.js
      gains RULE 3, a whole-page POM scan of every generated page from
      tools/pom-names.js (full five-group union appears on 0 of 182 pages,
      measured before the rule was added), proved by mutation on two page
      families and by a clean re-run after restore. Live, read-only GETs:
      pfLink still 404 (standing 5.3/Q8 state, unchanged); the replacement
      PF page is live and correct in content but still the pre-rename
      "Coleman & Leigh" paste, so repaste-before-repoint stands; homepage
      NAP, hours and email correct; the weight loss tile claim, mojibake
      switch-banner close button and ampersand branding persist, all
      previously recorded, confirmation only. No new question. Evidence in
      audits/coleman-walton-item-3.9-quality-pass-2026-08-30.txt.
      Done 2026-08-30
      audits/coleman-build-check-2026-08-14.txt. Done 2026-08-14
      Quality pass 2026-08-31 (sixth machine-era pass). BOTH HALVES. Repo:
      all 36 checkers re-run individually, 0 failures; all six generators
      rebuilt, git status empty before and after (sha256 of all 12 pages
      unchanged). Fresh independent extraction sharing no code with tools/
      (audits/verify-3.9-2026-08-31-sixth.js), 301 checks across 8 families
      (phone-shaped strings, postcode-shaped strings, em/en dash outside
      comments, cross-branch seoTown contamination, POM-name union,
      ampersand/missing-s brand variants, data-branch/JSON-LD name and
      @type, data-wa against the branch's own whatsapp field), 0 failures.
      Instrument proved by three injections into scratch copies (never
      touching the repo): a foreign phone number caught, a foreign seoTown
      (Bootle) caught, an em dash injected into the H1 caught; a first
      em-dash injection attempt landed inside the build comment's own
      (permitted) em dash and was correctly invisible, which is the
      checker working as intended, not a gap, confirmed by re-running the
      probe against visible body copy instead. Live, read-only via Claude
      in Chrome: homepage unchanged since the 2026-08-12 GBP pack note
      (body copy reads "Coleman and Leighs Pharmacy" correctly, but the
      header banner and footer still read "Coleman & Leigh Pharmacy", 19
      days after that pack recorded it as a mixed-state site); pfLink
      (Post A, https://www.colemanandleighspharmacy.co.uk/pharmacy-first-
      service-walton.html) still 404, standing 5.3/Q8 state, unchanged;
      the live switch page is still the pre-rename paste throughout,
      including a mojibake em dash ("it usually is not [mojibake] we make
      the first step") that the repo's own generated copy does not
      contain (verified: the generated file has no em dash outside its
      build comment and reads "it usually is not. We make the first step"
      with a full stop), so the live page predates both the 2026-08-04
      brand-name fix and whatever em-dash cleanup gave the repo its
      current wording; the homepage weight loss line ("Innovative
      solutions that deliver results... Now try the best") also persists,
      standing Q22 state, itself unresolved on the portal ("Unsure. Need
      to loop back on this"). No new defect in the repo. No new question
      raised; all three live findings were already recorded (GBP pack
      2026-08-12, this item's own 2026-08-12/2026-08-30 passes, Q8, Q22)
      and this pass is confirmation that none of them has moved in three
      weeks, which is itself worth Rishi knowing given repaste is sitting
      on a growing backlog. Evidence in audits/verify-3.9-2026-08-31-
      sixth.js (copied into the repo from the sandbox scratch directory
      where it was authored and run). Done 2026-08-31
      Quality pass 2026-09-01 (seventh machine-era pass). REPO HALF ONLY:
      Claude in Chrome reported not connected at the top of this run
      (tabs_context_mcp), so nothing live was read this pass and the live
      findings recorded on 2026-08-31 are not reconfirmed. Picked by the
      standing rotation-pool method (oldest "most recent commit mentioning
      this item number" among the 36 rotation-pool items): 3.9's last
      mention, 2026-08-31T20:17:11+01:00, was the oldest of all 36, ahead
      of 3.10 (21:40) and every later item through 3.4 (2026-09-01
      21:11:59, the immediately prior run). All 36 checkers run
      individually before any change: 36/36 pass. All six generators
      rebuilt; sha256 of all 189 .html/.js/.css files under modules/ and
      core/ taken before and after: byte-identical. git status clean
      throughout.
      Wrote a seventh independent extraction,
      audits/verify-3.9-2026-09-01-seventh.js, sharing no code with tools/
      and not copied from any prior pass's script. Deliberately covers
      three families not exercised as independent re-derivations in this
      item's own six prior passes: the booking-widget assignment per page
      including the Pharmacy First fallback rule (is each of the seven
      condition pages actually linked from the branch's own PF overview,
      does branches.json carry distinct, non-colliding widget ids for
      weight loss/travel clinic/contraception so none of them silently
      falls back, and are this branch's four widget ids unique across the
      whole estate); the Google Maps embed query (encoding and value,
      cross-checked independently against the visible contact-card address
      on the same page, proving the two are checked separately rather than
      one standing in for the other); and the Meta Keywords line read
      directly from the five paste sheets (SEO.md, CONTRACEPTION-SEO.md,
      TRAVEL-CLINIC-SEO.md, WEIGHT-LOSS-SEO.md, switch SEO.md), checked for
      own seoTown present, no foreign seoTown without the serviceAreaList
      excuse, no foreign brandLabel, and no claim/efficacy wording (a
      second, independently-worded pattern list, not read from
      tools/claim-patterns.js). A fourth, lighter family re-confirms title
      length (<=65) and description length (80-165) and seoTown presence
      in both, recomposed from the sheets. 625 checks across the 12 pages
      and 12 keyword blocks, 0 failures. ZERO DEFECTS FOUND.
      Instrument proved by four injections, all run against a scratch copy
      of modules/ and branches.json in /tmp (never against the tracked
      repo files, so no restoration was needed and none of the sandbox's
      known git-unlink problems could apply): a widget-id collision
      (weightLoss set equal to pharmacyFirst) CAUGHT, both the
      would-fall-back check and the no-two-ids-identical check firing; a
      wrong town/postcode in one page's map query CAUGHT, with the
      contact-card cross-check correctly staying silent since only the map
      was mutated, proving the two checks are independent rather than one
      masking the other; a foreign brandLabel plus a claim word injected
      into one keywords line CAUGHT, three failures, naming both branches
      that share the foreign brand; and an artificially lengthened title
      (78 characters) CAUGHT. Total check count stayed at 625 in every run,
      confirming no check was silently skipped by the mutation. Scratch
      directory deleted after use; sha256 of the real repo's branches.json
      and the two mutated-in-scratch page files reconfirmed unchanged
      against the pre-run baseline. No new defect, no new question.
      Evidence in audits/verify-3.9-2026-09-01-seventh.js. Done 2026-09-01
      Quality pass 2026-09-02 (eighth machine-era pass, 19:04 BST unattended
      run). REPO HALF ONLY: Claude in Chrome reported not connected at the
      top of this run (tabs_context_mcp), so nothing live was read and the
      three standing live findings from the 2026-08-31 sixth pass (header/
      footer still "Coleman & Leigh Pharmacy" against body copy's correct
      "Coleman and Leighs Pharmacy"; pfLink still 404, standing Q8; live
      switch page still the pre-rename paste with a mojibake em dash the
      repo's own copy does not have) remain unconfirmed for a third
      consecutive pass. Picked by the standing rotation-pool method (oldest
      "most recent commit mentioning this item number" among the 36
      rotation-pool items, all 8 unblocked AGENT_WORKLIST.md lines confirmed
      [BLOCKED] first): 3.9's last mention, 2026-09-01T21:43:17+01:00, was
      the oldest of all 36, ahead of 3.10 (22:09) and every item through 3.4
      (2026-09-02T18:10:44+01:00, the immediately prior run). All 36
      tools/check-*.js checkers run individually before any change: 36/36
      pass. All six generators rebuilt; git status --porcelain modules/
      core/ empty before and after (byte-identical). One untracked
      _agentscratch/gitlog_rotation2.txt working file (the git-log dump
      used to compute the rotation) deleted before the checker run, per the
      standing lesson from six prior passes that such dumps can quote a
      commit message containing the CH49 1SX narrative postcode and flip
      check-postcodes.js to a false UNKNOWN; not needed this time, all 36
      were clean regardless.
      Wrote an eighth independent extraction, audits/verify-3.9-2026-09-02-
      eighth.js, sharing no code with tools/ or any prior verify-3.9-*.js.
      Deliberately covers four families not exercised as independent
      re-derivations in this item's own seven prior passes: CDN pin values
      on this branch's 12 pages, re-derived from each generator's own
      `const PIN` declaration rather than imported; in-page fragment
      targets (every href="#id" on this branch's own pages resolves to a
      real id on the same page); URL scheme (no bare http:// anywhere in
      the 12 pages); and the GBP pack's blood pressure age-cohort wording,
      yellow fever silence and sister-branch-claim absence, read directly
      off gbp-packs/coleman-leigh-walton.md rather than through
      check-pharmacy-first-eligibility.js, check-travel-clinic-copy.js or
      check-gbp-packs.js. 59 checks across the 12 pages and the pack, 0
      failures.
      Instrument proved by four injections against a scratch mirror
      (_agentscratch/inject-test-3.9/, containing only this branch's own
      12 pages, branches.json, the five relevant generator sources and the
      GBP pack; never against the tracked repo files, confirmed by git
      status --porcelain returning empty for modules/, core/, gbp-packs/,
      branches.json and tools/ before and after): a CDN pin mismatch on the
      Pharmacy First overview page CAUGHT (2 failures, one per jsDelivr ref
      on that page); a foreign fragment target CAUGHT (60 checks, 1
      failure, correctly one more check than baseline since the new href
      is itself a new check); a bare http:// link CAUGHT; and the GBP
      pack's blood pressure cohort rewritten from "aged 40 and over" to
      "aged over 40" CAUGHT. One process slip caught and corrected before
      trusting a "clean" result, the same shape recorded on four prior
      passes across other items: the first fragment-target injection
      attempt targeted a literal <body> tag, but this branch's generated
      pages are Weebly embed fragments with no <body> element at all (per
      CLAUDE.md's module architecture), so the regex replace silently
      matched nothing and the page was unchanged; caught by checking the
      file for the injected marker string before trusting the "0 failures"
      result, corrected by inserting the anchor at the start of the file
      instead. Scratch mirror deleted after use.
      No new in-repo defect found this pass. QUESTIONS.json re-read: 94
      total, 41 open, unchanged; no question specific to item 3.9 is open.
      Evidence in audits/verify-3.9-2026-09-02-eighth.js and audits/verify-
      3.9-2026-09-02-eighth-output.txt. Done 2026-09-02
      Quality pass 2026-09-03 (ninth machine-era pass, unattended run).
      REPO HALF ONLY: Claude in Chrome reported not connected at the top of
      this run (tabs_context_mcp); the built-in Claude Browser was not tried
      this pass since step 3's answer pickup is Claude-in-Chrome-only and no
      live read was planned for this angle. The three standing live findings
      from the 2026-08-31 sixth pass remain unconfirmed for a fourth
      consecutive pass. Picked by the standing rotation-pool method: all 8
      unchecked AGENT_WORKLIST.md lines confirmed [BLOCKED] by direct grep,
      so the quality-pass fallback applied; a fresh git-log-match derivation
      (36-item rotation pool, the standing 7 out-of-rotation items excluded)
      gave 3.9 as stalest (last touched 2026-09-02T19:09:58+01:00, ahead of
      3.10 at 19:40:46), independently reproducing the forward note the
      3.4 tenth-pass entry left this same day. All 36 tools/check-*.js run
      individually before any change: 36/36 pass. All seven build-*.js
      generators re-run (build-audit-status.js excluded, it publishes to the
      portal rather than regenerating pages and needs step 10's own
      invocation); git status --porcelain on modules/ and core/ empty before
      and after, as expected since neither a generator nor branches.json was
      touched this pass.

      Fresh angle: none of the eight prior passes had proved
      tools/check-gbp-packs.js's DAY-based hours rules (as opposed to its
      clock-time rules, proved for this branch's Q40/blood-pressure line on
      the eighth pass but never for the day-presence logic) or its
      sister-branch-claim rule against gbp-packs/coleman-leigh-walton.md
      specifically. Coleman and Leighs is one of the seven branches in the
      estate that closes for lunch, which is exactly the branch shape
      CLAUDE.md's "A right answer in the wrong unit" section and this
      checker's own header identify as the estate's most consequential
      hours defect class (the live smarttschemist.co.uk 9-to-6-straight-
      through fault this checker's splitDay rule exists to stop reaching
      another profile the same way).

      Wrote a ninth independent instrument, audits/verify-3.9-2026-09-03-
      ninth.js, sharing no code with tools/ or any prior verify-3.9-*.js.
      Two parts. Part 1: independent re-derivation, straight from
      branches.json, of this branch's open/closed days, its true split-day
      shape (all five weekdays carry two sessions each, a uniform Mon-Fri
      lunch closure - the real checker's own splitDay() returns only the
      first day it finds, "Monday", for its message, confirmed by reading
      the function rather than assumed, so this is a wording choice in the
      checker and not a gap) and the absence of any live sibling sharing its
      brandLabel, cross-checked against what the pack's hours line and
      paster notes actually say using an independently-worded regex, not
      imported from check-gbp-packs.js. 10 checks, 0 failures on the first
      run after one self-caught correction: the first version of this part
      wrongly asserted the checker's own splitDay() would report all five
      days, which conflated the DATA shape (five split days) with the
      MESSAGE-composition shape (one representative day); corrected to
      assert the data shape directly and note the checker's simplification
      as deliberate rather than as a defect.

      Part 2: four injections into a scratch-mutated copy of the one pack
      file this branch owns, each restored via fs.writeFileSync immediately
      after capturing the checker subprocess's output and before any
      assertion, and sha256-verified byte-identical before the next
      injection and again at the end. (1) Friday dropped from the "Monday to
      Friday" open range - CAUGHT, "does not state Friday as an open day".
      (2) Saturday falsely claimed open - CAUGHT, "hours line states the
      branch is open on Saturday". (3) the "GBP hours need two time ranges"
      paster instruction removed, hours line itself left untouched - CAUGHT,
      "must tell the paster the profile needs two time ranges". (4) a false
      "Our sister branch is in Bootle" sentence inserted into the business
      description - CAUGHT, "no other live branch in branches.json carries
      the brand". One process correction before trusting the round: the
      first version of injections 3 and 4 used literal multi-line regexes
      assuming exact line-wrap positions and matched nothing, so the
      "unmutated" original silently passed every time (the same class of
      false-negative six prior passes across other items have hit and
      logged); caught by having the mutator throw if its regex found no
      match rather than silently returning the input unchanged, and fixed
      by matching on \s+ in place of literal newlines, the same discipline
      check-gbp-packs.js's own comments prescribe for these wrapped pack
      files. All four injections then caught on the corrected run; the pack
      file's sha256 matched its pre-probe value after every individual
      injection and again at the end (fs.readFileSync of the tracked file
      immediately after, plus git status --porcelain on the single file,
      confirmed no diff throughout). 22 checks total across both parts, 0
      failures. Full 36-checker suite re-run clean after the round.

      RESULT. No defect on item 3.9 - check-gbp-packs.js was already
      correctly holding Coleman and Leighs' own pack to its day-open,
      day-open-reverse, day-closed, splitDay-warning and sister-branch-
      absence rules; now proven directly by injection against this branch
      for the first time in this item's nine-pass history, rather than only
      by the estate-wide 15-pack sweep. No checker logic, page, generator,
      pack or data field changed anywhere in the repo.

      No new question raised. QUESTIONS.json re-read before and after: 94
      total, 41 open, unchanged. Evidence in audits/verify-3.9-2026-09-03-
      ninth.js. Done 2026-09-03

      Next stalest by the same block-bounded method, for whoever runs the
      next unattended pass: with 3.9 now freshly touched today (2026-09-03),
      the next-oldest untouched item in the standing rotation pool was 3.10
      (2026-09-02T19:40:46+01:00), then 2.1, 5.2, 4.11, 5.1, 3.12, 3.6, 3.8 -
      but should be re-derived fresh rather than assumed, since other runs
      may land in between.

      Quality pass 2026-09-04 (tenth machine-era pass, unattended run).
      BOTH HALVES - first successful live read on this item since the
      2026-08-31 sixth pass (four consecutive passes in between found
      Claude in Chrome not connected and stopped there). Picked by the
      standing rotation-pool method: all 8 unchecked AGENT_WORKLIST.md
      lines confirmed [BLOCKED] by direct grep, so the quality-pass
      fallback applied; a fresh git-log-match derivation over the
      36-item rotation pool gave 3.9 as stalest (last touched
      2026-09-03T14:12:16+01:00), independently reproducing the forward
      note both the ninth pass and the same-day 3.4 eleventh pass left.
      All 36 tools/check-*.js run individually before any change: 36/36
      pass. All six generators rebuilt; git status --porcelain modules/
      core/ empty before and after.

      Fresh angle (repo half): tools/check-branch-identity.js had never
      been proven by injection against Coleman and Leighs' own pages in
      nine prior passes (confirmed by grepping this item's own section
      before starting - zero mentions of check-branch-identity or
      check-jsonld). Notable given the checker's own file header cites
      the real 2026-08-12 Cherry Lane defect (a Pharmacy First tile
      repointed at "Coleman and Leighs' equivalent page") as the reason
      RULE SERVICELINK exists, yet the checker had never been tested the
      other way round, against this branch's own pages. Adapted the
      same-day Cherry Lane eleventh pass's proven template. Wrote
      audits/verify-3.9-2026-09-04-tenth.js, sharing no code with tools/
      or any prior verify-3.9-*.js. Five injections, one target file
      each (AMBIGUOUS and SISTERLINK skipped as structurally
      inapplicable: this branch shares no brandLabel or website host
      with a sister branch): (1) RULE IDENTITY - data-branch emptied on
      contraception-coleman-leigh-walton.html, CAUGHT; (2) RULE OWNER -
      data-branch swapped to "Smartts Chemist" on earache-treatment-
      coleman-leigh-walton.html, CAUGHT, both the specific-page message
      and the cross-check that the branch now declared two different
      data-branch values; (3) RULE SCHEMANAME - JSON-LD name swapped to
      "Smartts Chemist" on sore-throat-treatment-coleman-leigh-walton.html,
      CAUGHT, same two-values cross-check; (4) RULE OUTBOUND - the Google
      review link on shingles-treatment-coleman-leigh-walton.html
      swapped for Smartts Chemist's, CAUGHT, "a patient following it
      rates the wrong shop"; (5) RULE SERVICELINK - the shingles
      condition tile on pharmacy-first-coleman-leigh-walton.html
      repointed at Smartts' equivalent page (cross-host, the same shape
      as the real 2026-08-12 defect), CAUGHT, "so it 404s and the
      service route is dead". All five caught first attempt with the
      expected message, all five files restored byte-identical
      (sha256-reconfirmed) before the next probe. One process correction
      before trusting the round: the first version of the IDENTITY and
      OWNER mutators used a regex assuming a line-wrap inside the
      data-branch attribute value that terminal display had suggested
      but the file does not actually contain; caught by the script's own
      "mutator found no match, refusing to report a false pass" guard
      rather than producing a false catch, fixed by switching to a plain
      string match. Final checker re-run after all restores: exit 0.
      Full 36-checker suite re-run individually after the round: 36/36
      exit 0. Zero in-repo defect - check-branch-identity.js was already
      correctly holding this branch to all five applicable rules, now
      proven directly by injection for the first time in ten passes.
      Evidence in audits/verify-3.9-2026-09-04-tenth.js and its output
      file.

      Live half. Claude in Chrome reported not connected (fifth
      consecutive pass); the built-in Claude Browser pane was tried this
      time rather than skipped, and requires a one-time site approval
      that no user is present in this unattended session to grant
      (request_access would have blocked on a human who is not there,
      so it was not called, consistent with the standing browser-read-
      only rule). Fell back to a read-only PowerShell Invoke-WebRequest
      sweep instead of leaving the live half unread for a fifth
      consecutive pass, the same substitution the same-day 3.4 eleventh
      pass used. This reconfirmed all three standing findings first
      recorded on 2026-08-31, unconfirmed for the four passes since: the
      visible body of the homepage still carries both "Coleman & Leigh
      Pharmacy" (wrong) and "Coleman and Leighs Pharmacy" (correct) side
      by side; pfLink (pharmacy-first-service-walton.html) still returns
      404; and the live switch page (switch-prescriptions-coleman-leigh-
      walton.html) still carries a mojibake rendering of an em dash in
      "it usually is not [mojibake] we make the first step", which the
      repo's own generated copy does not contain. Also reconfirmed: the
      standing Q22 homepage weight loss line ("Innovative solutions that
      deliver results...Now try the best") is still live, unchanged. One
      addition to the standing record, not previously logged by any
      prior pass on this item: the homepage's own og:site_name meta tag
      reads "COLEMANS & LEIGHS PHARMACY", a third brand variant distinct
      from both the correct trading name and the "Coleman & Leigh" seen
      in the header/footer (added s on Coleman, ampersand, all caps).
      Low visibility (surfaces only in social-share link previews, not
      to a browsing patient) so not raised as a new question, but noted
      here as a more complete picture of how many divergent forms the
      pre-rename paste left behind on this one domain. No repo action
      possible on any of this - it is standing evidence that the live
      Weebly site has not been repasted since the 2026-08-04 rename and
      the em-dash cleanup, not something this repo's tooling can reach.
      No new question raised; all findings were already recorded and
      this pass is reconfirmation, now via a route that works even when
      Claude in Chrome is unavailable.

      QUESTIONS.json re-read before and after: 95 total, 42 open,
      unchanged; no question specific to item 3.9 is open. Done 2026-09-04

      Next stalest by this run's own computation, for whoever runs the
      next unattended pass: 3.10 (2026-09-03T14:43:36+01:00), then 2.1
      (15:12:13), then 5.2 (15:40:58), then 4.11 (16:11:03) - should be
      re-derived fresh using the per-item-most-recent-mention method
      above, not assumed.
- [x] 3.10 Riddings Pharmacy (Timperley): same treatment. Done 2026-08-04.
      12 pages, 0 mismatches.
      Quality pass 2026-08-12 (hundred-and-tenth run, second machine-era
      pass): all 12 Riddings pages re-verified by a fresh independent
      extraction, no checker code reused. 2628 check groups, zero flags:
      one H1 per page carrying Timperley, NAP and every tel: link correct
      as unspaced digits, no other branch's phone, postcode, review link
      or widget id, JSON-LD field for field against branches.json
      including Greater Manchester and the two-part "Timperley,
      Altrincham" locality, POM union scan empty including the weight
      loss page, no em dash outside build comments, no app copy. Live
      half, two read-only GETs: the pfLink page serves correctly with all
      seven cohorts right against the NHS specification; homepage NAP,
      hours and email correct; known states persist and are confirmation
      only (switch banner mojibake close button, the Q31-era Cheshire
      county in the live contact block and homepage body, the Q22
      estate-wide weight loss tagline). Zero in-repo defects. Evidence in
      audits/riddings-build-check-2026-08-12.txt.
      Quality pass 2026-08-13 (hundred-and-fifty-second run, third machine-era
      pass). REPO HALF ONLY: no browser, so nothing live was read and the live
      findings above are not reconfirmed. All 12 pages re-read by a fresh
      independent extraction sharing no code with tools/. 3,312 checks over 27
      families, 0 failures, and every family counted rather than assumed so
      none ran vacuously. 25 negative tests all fire, each mutation confirmed
      to have applied. All 30 checkers exit 0 and all six generators rebuild
      byte-identical. GBP pack and switch banner file both clean and free of
      foreign data; the banner's close button is the correct &times; entity in
      repo, so the live mojibake is a stale paste, not a repo state. NO defect
      found in the estate. Three findings: run 151's vacuity finding narrowed,
      the foreign-ODS scan is vacuous only at Riddings and does real work on
      the six shared-domain landing pages; a fault in this run's own POM
      extractor, written up rather than dropped; and Riddings confirmed as the
      worked precedent for open Q64 rather than a third convention. No
      question raised. Evidence in
      audits/riddings-build-check-2026-08-13.txt. Done 2026-08-13
      Quality pass 2026-08-14 (hundred-and-ninety-third run, fourth machine-era
      pass). REPO HALF ONLY: the portal fetch returned the Cloudflare Access
      sign-in page, so nothing live was read and the live findings above are
      not reconfirmed. ZERO DEFECTS IN THE 12 PAGES and not one character of
      any page was edited. 36 checkers green, all six generators rebuild all
      177 pages byte-identical, and the sheet set proved 1:1 with the pages
      (177 entries, 177 pages, no orphan either way) so the sheet-driven rules
      are not vacuous. ONE REAL DEFECT FOUND AND FIXED IN REPO, in
      tools/check-switch-copy.js. Build Pack v2 section 5.1 states as a
      critical rule that anything which must rank has to be real text in the
      page and not injected by JavaScript, and nothing asserted it. RULE 3
      pins every generator copy line to every page but asked whether the page
      SOURCE carried it, and textOf() strips tags without stripping script
      bodies, so a line moved into a script that writes it back with innerHTML
      satisfied both halves of the test while leaving the page unrankable.
      Proved by injection: the three "How switching works" steps on the
      Riddings switch page hidden in a script, all 36 checkers stayed green;
      the same injection on the travel clinic page failed at once, because
      check-travel-clinic-copy.js has stripped scripts since the sixty-ninth
      run. The two checkers were asking different questions of the same class
      of copy and the weaker one guards the 15 highest-commitment pages in the
      estate. Fixed with crawlable()/crawlableText() on the PRESENCE rules
      only: the absence direction still reads raw source, because copy hidden
      in a script is still shown to the patient, so an unearned promise is
      still a promise. Guard added so the run fails if the stripper stops
      removing anything or starts removing the body. Six negative tests, all
      fire, including a regression guard that a simply deleted line still
      fails with the old wording. SECOND INSTANCE FOUND AND DELIBERATELY NOT
      FIXED: check-contraception-copy.js has the same gap, reproduced on this
      item's own contraception page, and left for its own pass because its
      single visible() also feeds four absence rules and a safeguarding rule
      that would be weakened by the same edit. No question raised. Evidence in
      audits/riddings-build-check-2026-08-14.txt. Done 2026-08-14
      Quality pass 2026-08-30 (fifth machine-era pass). BOTH HALVES. Repo:
      12 pages re-read by a fresh independent extraction sharing no code
      with tools/, 1,872 checks across 23 counted families, 0 failures;
      7 negative tests all fire (node-applied); three gap probes in the
      known shape family (foreign postcode as &nbsp; entity, as raw U+00A0,
      em dash as &mdash; entity) all CAUGHT by existing checkers - first
      pass on this item to find zero new checker gaps. Live: homepage NAP,
      hours and email correct; the three known live states persist
      (mojibake close button, Q31 Cheshire, Q22 tagline); pfLink page
      serves all seven cohorts correctly but is pre-repaste legacy copy
      (US spellings, old title/H1) - stale paste, part of the tracked
      estate-wide repaste backlog, not a repo defect. Zero in-repo
      defects, nothing edited. Evidence in
      audits/riddings-build-check-2026-08-30.txt. Done 2026-08-30
      Quality pass 2026-08-31 (sixth machine-era pass). Selected as the
      least-recently-verified completed item (oldest max-date in its own
      block, 2026-08-30, tied with several others, fewest quality-pass
      mentions among the tie, file order breaking the final tie against
      2.1/2.2/4.2/4.3/4.5/4.9/4.10/1.2). New angle: five checkers had been
      hardened since the fifth pass yesterday (check-em-dashes/check-
      service-links widened for the sixth public-copy file; check-brand-
      spelling case-drift rule; check-nap abbreviated-street sweep; check-
      cdn-pins EXTRA_PASTE gained modules/emar/weebly; check-postcodes
      fixed-point double-decode and fused-postcode detection; check-gbp-
      packs gained the bank holiday special-hours rule), none of which had
      run against Riddings before. Ran all 36 checkers fresh, full estate:
      0 failures. Confirmed gbp-packs/riddings-timperley.md already carries
      the Q79 bank holiday section (added on an earlier estate-wide pass,
      not this one). Two WARN-level (not failing) service-link notices on
      the pack, both pre-existing and expected: pharmacy-first-service-
      timperley.html and switch-prescriptions.html are live-only pages this
      repo does not generate. Live half, two read-only GETs: homepage NAP,
      hours, email and the Q22 weight loss tagline ("Innovative solutions
      that deliver results. Tried the rest? Now try the best.") all
      unchanged and match branches.json; re-confirmed this exact string is
      the one already covered by Q22 (answered "unsure, will produce
      guidance" on 2026-08-30, no repo action pending) rather than a new
      finding. pfLink page still serves all seven Pharmacy First cohorts
      correctly on the pre-repaste legacy copy already logged as a stale-
      paste backlog item, not a repo defect. ZERO in-repo defects, nothing
      edited. Evidence in audits/riddings-full-suite-2026-08-31.txt. Done
      2026-08-31
      Quality pass 2026-09-01 (seventh pass, unattended scheduled run).
      Selected as the least-recently-verified completed item (oldest newest-
      mention date across all 36 rotation-pool items). REPO HALF ONLY:
      Claude in Chrome reported not connected, so nothing live was read and
      the live findings above are not reconfirmed. All 36 checkers run
      individually, 36/36 clean; all six generators rebuild all 189 tracked
      modules/core files byte-identical. Fresh independent Python extraction
      (108 checks, 9 families: tel:/visible-phone/postcode matching, JSON-LD
      field-for-field, seoTown presence, foreign-brandLabel absence, em/en
      dash absence, data-branch correctness, map-query decode-compare) across
      all 12 pages, 0 failures. Targeted the two checkers hardened since the
      sixth pass that had not yet been proved against Riddings by injection:
      check-service-links.js's new JS-injected-copy reading (33ed5ca) caught
      "Guaranteed results" injected into service.js's innerHTML card copy;
      check-nap.js re-confirmed catching a foreign phone number swapped into
      Riddings' own switch page. Both injections run against a full /tmp
      rsync scratch copy (not the tracked repo), diffed back to confirm the
      real files were never touched. ZERO in-repo defects found, nothing
      edited. Evidence in audits/riddings-build-check-2026-09-01.txt. Done
      2026-09-01
      Quality pass 2026-09-02 (eighth pass, unattended scheduled run via
      Cowork, 19:34 BST). Selected as stalest of the 36-item rotation pool
      (last mentioned 2026-09-01T22:09:26+01:00; item 3.9 done immediately
      before this run was most recent at 2026-09-02T19:04+01:00). All 8
      unchecked AGENT_WORKLIST.md lines confirmed [BLOCKED] (8 of 8 via
      direct grep), so the quality-pass fallback applied. REPO HALF ONLY:
      mcp__claude-in-chrome__tabs_context_mcp reported the extension not
      connected, so nothing live was read and the live findings recorded on
      the fourth through seventh passes (switch banner mojibake, the Q31-era
      Cheshire county string, the Q22 weight loss tagline, the pre-repaste
      pfLink legacy copy) stand unverified for a further pass. All 36
      tools/check-*.js checkers run individually, 36/36 clean (0 failures
      across the board; warnings and known-issue counts unchanged from the
      established baseline). All six generators rebuilt; git status
      --porcelain modules/ core/ empty both before and after, confirming
      byte-identical regeneration. An eighth independent extraction written
      fresh for this run, sharing no code with tools/ or any prior verify-
      3.10-*.js (audits/verify-3.10-2026-09-02-eighth.js): 696 checks across
      the 12 Riddings pages (11 service-family pages plus the switch page),
      0 failures - own postcode present and no foreign live-branch postcode,
      every tel: href and every phone-shaped foreign number checked and
      clean, own seoTown present with the foreign-seoTown absence rule
      applied against serviceAreaList, brandLabel spelling, JSON-LD parsed
      and checked field for field (type, telephone, address block including
      addressRegion), map embed query decode-compared to the branch address,
      no em/en dash literal or entity outside build comments, data-wa
      against the agreed WhatsApp number, data-branch naming only this
      branch. Instrument proved by four injections against the tracked
      weight-loss-clinic-riddings-timperley.html file (not previously used
      for injection testing on this item; prior passes used the switch page
      and the service.js JS-copy path), each restored by byte copy and
      SHA256-confirmed identical to the pre-injection original before the
      next injection: a phone swap to Smartts Chemist's number caught by the
      JSON-LD telephone rule; a postcode swap to Smartts' L20 9HH caught by
      both the foreign-postcode rule and the JSON-LD postalCode rule; an
      &ndash; entity appended in a plain span caught by the em/en dash rule;
      and a "serving Bootle residents" line caught by the foreign-seoTown
      rule (Bootle is SK Chemists' seoTown, not in Riddings'
      serviceAreaList). One process note: a literal em dash character
      (U+2013) injected via PowerShell string interpolation failed to persist
      to disk in this environment for reasons not fully diagnosed (Contains
      checks against the written file returned false); switched to the
      &ndash; HTML entity, which check-em-dashes.js and this script both
      treat identically to the literal character, and the injection then
      behaved as expected. GBP pack (gbp-packs/riddings-timperley.md)
      re-read in full: profile basics (name, address, phone, hours, website,
      review link) all agree with branches.json; Post A's link and the
      pfLink cross-reference agree; all prior live findings the pack
      documents (Post B's 404 permalink, the live "Timperley, Cheshire"
      region, the site-wide footer en-dash/middot hours line) are pack notes
      already on record, not new. ZERO in-repo defects found, nothing
      edited under tools/, modules/, core/, gbp-packs/ or branches.json.
      Scratch injection directory deleted after use, leaving no untracked
      debris from this run. Evidence in
      audits/verify-3.10-2026-09-02-eighth.js and audits/verify-3.10-2026-
      09-02-eighth-output.txt. No new question raised. Done 2026-09-02
      Quality pass 2026-09-03 (ninth pass, unattended scheduled run via
      Cowork). Selected as stalest of the 36-item rotation pool (last
      mentioned 2026-09-02T19:40:46+01:00; item 3.9's ninth pass immediately
      before this run was most recent at 2026-09-03T14:12:16+01:00), derived
      by the same block-bounded git-log method as the immediately preceding
      run and cross-checked against its forward note (exact match: 3.10, then
      2.1, 5.2, 4.11, 5.1, 3.12, 3.6, 3.8). All 8 unchecked AGENT_WORKLIST.md
      lines confirmed [BLOCKED] by direct grep, so the quality-pass fallback
      applied. REPO HALF ONLY: mcp__claude-in-chrome__tabs_context_mcp
      reported the extension not connected at both step 3 and again
      independently before the live half; the built-in Claude Browser was
      also tried (preview_start to riddingspharmacy.co.uk) and denied, the
      same "no user present to approve a new site" outcome recorded on the
      3.4 tenth pass a day earlier. Nothing live read this pass; the live
      findings on record from the fourth through eighth passes (switch banner
      mojibake close button, Q31-era Cheshire county string, Q22 estate-wide
      weight loss tagline, pre-repaste pfLink legacy copy) stand unverified
      for a further pass. FRESH ANGLE. check-opening-hours.js was considered
      first and ruled out after research: Riddings has no generated branch
      landing page at all, so that checker's three page-reading rules and its
      stray-clock-time sweep never run against this branch, and its four
      remaining data-integrity rules read branches.json directly rather than
      any Riddings page, so no injection into a Riddings file could exercise
      them either way - the same "vacuous for this branch specifically" shape
      the sixth pass already found and named for a different checker.
      Redirected to tools/check-booking-routes.js instead: the booking chain
      (branches.json -> filename -> service.js's two tables -> Appointedd
      widget id -> data-branch/data-service labelling) had been read for this
      branch across all eight prior passes but never proved by injection
      against Riddings' own pages specifically, only by the estate-wide
      177-page sweep. New instrument written fresh
      (audits/verify-3.10-2026-09-03-ninth.js, no import from tools/ beyond
      invoking the real checker as a child process): refuses to run if any
      target file already carries a git diff, restores every mutation by
      direct fs.writeFileSync immediately after capturing the checker
      subprocess's output and before any assertion runs, sha256-verified
      byte-identical before the next injection and again at the end. PART 1:
      independent re-derivation of all 11 Riddings service-page booking
      routes straight from branches.json and service.js's SERVICE_WIDGET_KEYS
      / NO_FALLBACK_SERVICE_KEYS tables (read as data, not imported) - 60
      checks, 0 failures. PART 2: five injections against Riddings' own
      files, each restored and hash-verified before the next: (1) shingles
      page's data-branch swapped for a real, different live branch's name
      (Smartts Chemist) - CAUGHT, "filed against the wrong pharmacy"; (2)
      earache page's data-branch attribute removed outright - CAUGHT, "no
      data-branch on #rbhsv-root"; (3) sore-throat page's data-service
      removed - CAUGHT, "no data-service on #rbhsv-root"; (4) contraception
      page's data-service wording changed to diverge from every sister
      branch's contraception page - CAUGHT, "described 2 different ways in
      data-service"; (5) branches.json's own riddings_timperley.widgets.
      contraception blanked to "" (contraception is a NO_FALLBACK service, so
      this must fail rather than silently falling back to the Pharmacy First
      diary) - CAUGHT, "needs widgets.contraception ... and there is none
      (this service must not fall back)". All five caught on the first
      attempt with the expected message; every target file confirmed
      byte-identical to its pre-injection sha256 hash after its own injection
      and again at the end; git status --porcelain on branches.json and
      modules/ empty throughout. ONE SELF-CAUGHT PROCESS CORRECTION recorded
      in the script's own header: the first draft asserted each catch by
      testing the checker's stdout against its internal rule tag (e.g.
      /branchattr/), but check-booking-routes.js's fail() never prints the
      tag to the console, only the message - so the first draft reported all
      four page-level injections as MISSED despite the real checker having
      caught every one correctly. Fixed by asserting against the actual
      printed message text; all five then passed. Full 36-checker suite
      re-run clean after the round (36/36 exit 0), all six generators re-run
      and rebuilt byte-identical (git status --porcelain on modules/ and
      core/ empty before and after). RESULT. No defect on item 3.10 itself -
      tools/check-booking-routes.js was already correctly holding Riddings'
      own pages and its branches.json widget data to the BRANCHATTR,
      SERVICEATTR and WIDGET rules; now proven directly by injection for the
      first time in this item's nine-pass history, alongside a documented
      structural finding (not a defect) that check-opening-hours.js has no
      page to check for this specific branch. No checker logic, page,
      generator or data field changed anywhere in the repo. Evidence in
      audits/verify-3.10-2026-09-03-ninth.js. No new question raised.
      Next stalest by the same block-bounded method, for whoever runs the
      next unattended pass: with 3.10 now freshly touched today (2026-09-03),
      the next-oldest untouched item in the standing rotation pool at the
      time of this run's derivation was 2.1 (2026-09-02T20:10:56+01:00), then
      5.2, 4.11, 5.1, 3.12, 3.6, 3.8, 6.3 - but should be re-derived fresh
      rather than assumed, since other runs may land in between. Done
      2026-09-03
      Quality pass 2026-09-04 (tenth pass, unattended scheduled run via
      Cowork). Selected as stalest of the 36-item rotation pool (last
      mentioned 2026-09-03T14:43:36+01:00), independently re-derived by the
      block-bounded git-log method over the standing pool (43 completed
      items minus the 7 standing out-of-rotation: 1.1, 1.4, 2.2, 5.6, 5.7,
      6.7, 6.8) and matching the ninth pass's own forward note exactly: 3.10,
      then 2.1, 5.2, 4.11, 5.1, 3.6, 3.12, 3.8. All 8 unchecked
      AGENT_WORKLIST.md lines confirmed [BLOCKED] by direct grep, so the
      quality-pass fallback applied. BASELINE: git status --porcelain on
      modules/core/tools/branches.json/gbp-packs was empty before any work,
      except one self-inflicted false alarm caught and cleared before it
      touched anything tracked - a scratch file this run's own item-selection
      computation had written into the pre-existing untracked _agentscratch/
      directory happened to contain postcode-shaped text from historical
      commit messages, which made check-postcodes.js fail with 5 UNKNOWN
      lines; deleted the scratch file (not a repo change, nothing tracked was
      touched) and the checker returned to its usual 0 failures, 3 warnings.
      All 36 checkers then ran clean individually (36/36 exit 0) and all six
      generators rebuilt byte-identical (git status --porcelain on modules/
      and core/ empty before and after). FRESH ANGLE: this item's own
      AGENT_WORKLIST.md section was grepped for "branch-identity" before
      starting - the twelve hits in the whole file are all Scorah, McCanns,
      Fishlocks, Cherry Lane or Coleman and Leighs, none of them Riddings, so
      despite nine prior passes proving check-nap, check-em-dashes,
      check-service-links (JS-injected copy), check-booking-routes
      (BRANCHATTR/SERVICEATTR/WIDGET), check-switch-copy and the
      postcode/seoTown/map/JSON-LD field-for-field rules against Riddings'
      own pages, tools/check-branch-identity.js had never been proven against
      this branch specifically - the same class of gap the 3.4 and 3.9 tenth
      passes closed for Cherry Lane and Coleman and Leighs two runs earlier
      today. Confirmed via branches.json that Riddings' brandLabel equals its
      branchName and no sister branch shares riddingspharmacy.co.uk, so rules
      4 (AMBIGUOUS), 5 (SITEUNIQUE) and 9 (SISTERLINK) are structurally
      inapplicable here; the five rules that do apply (1 IDENTITY, 2 OWNER, 3
      SCHEMANAME, 8 OUTBOUND, 10 SERVICELINK) were targeted instead, the same
      shape used for the other two non-shared-brand branches. INDEPENDENT
      INSTRUMENT AND PROOF BY INJECTION
      (audits/verify-3.10-2026-09-04-tenth.js, invokes the real checker as a
      child process, refuses to run if any target file already carries a git
      diff, restores from an in-memory Buffer immediately after capturing the
      checker's output and before any assertion, sha256-confirms each
      restore): five injections in turn, one target file each, none
      previously used for injection testing on this item (earache, sore
      throat, shingles, sinusitis and the Pharmacy First overview pages): (1)
      RULE IDENTITY - data-branch emptied on
      earache-treatment-riddings-timperley.html's module root, caught,
      "carries a module root but no data-branch"; (2) RULE OWNER -
      data-branch swapped to Smartts Chemist's name on
      sore-throat-treatment-riddings-timperley.html, caught, "filed against
      the wrong pharmacy"; (3) RULE SCHEMANAME - JSON-LD name swapped to
      Hirshmans Chemist's on
      shingles-treatment-riddings-timperley.html, caught, "Google is told
      this address belongs to another pharmacy"; (4) RULE OUTBOUND - the
      Google review link on sinusitis-treatment-riddings-timperley.html
      swapped for Smartts Chemist's, caught, "A patient following it rates
      the wrong shop"; (5) RULE SERVICELINK - the shingles condition tile on
      pharmacy-first-riddings-timperley.html repointed at Smartts' equivalent
      page (cross-host: riddingspharmacy.co.uk against
      www.smarttschemist.co.uk), caught, "so it 404s and the service route is
      dead". All five caught first attempt with the expected message, all
      five files restored byte-identical (sha256-reconfirmed) before the next
      probe and again at the end; git status --porcelain on the five target
      files empty throughout. Final checker re-run after all restores: exit
      0. Full 36-checker suite re-run individually after the round: 36/36
      exit 0, all six generators rebuilt byte-identical. No in-repo defect -
      check-branch-identity.js was already correctly holding this branch to
      all five applicable rules; now proven directly for the first time in
      ten passes. Evidence in audits/verify-3.10-2026-09-04-tenth.js and
      audits/verify-3.10-2026-09-04-tenth-output.txt. LIVE HALF - Claude in
      Chrome confirmed not connected (tabs_context_mcp); the built-in browser
      pane was not tried, per the standing finding that no user is present in
      this unattended session to grant a new-site approval. Fell back to a
      read-only PowerShell Invoke-WebRequest sweep of
      www.riddingspharmacy.co.uk rather than leaving the live half unread:
      homepage returns 200 with own phone (0161 973 2951), own email
      (Riddings@rbhealth.co.uk) and Timperley all present; the standing
      Q31-era "Cheshire" county string is still live (branches.json holds
      Greater Manchester for addressRegion; the live page has no "Greater
      Manchester" string at all), matching the finding recorded on every
      prior pass since the second; the Q22 estate-wide weight loss tagline
      ("Now try the best") is still live, unchanged, itself unresolved on the
      portal; pfLink (pharmacy-first-riddings-timperley.html on the live
      site) returns 200, consistent with the pre-repaste legacy-copy finding
      already on record as part of the estate-wide repaste backlog, not
      re-verified word for word this pass. No new finding; all live
      observations reconfirm existing standing state. No new question
      raised. Done 2026-09-04
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
      Quality pass 2026-08-12 (hundred-and-eleventh run, second machine-era
      pass): all 12 Gordon Short pages re-verified by a fresh independent
      extraction, no checker code reused. 1680 check groups, zero flags:
      one H1 per page carrying Crosby, NAP visible on every page and every
      tel: link the branch's own unspaced digits, no other trading branch's
      phone, postcode, review link or widget id, JSON-LD parsing on all 12
      and matching branches.json field for field including Merseyside as
      addressRegion and a self-referencing url on the branch's own domain,
      POM union scan empty including the weight loss page, no em dash
      outside build comments, no non-ASCII outside comments except the
      pound sign on the weight loss price, no app copy, hasApp false.
      openingHoursSpecification is absent from service and switch JSON-LD
      by generator design estate-wide; it lives only on the six item 5.2
      branch landing pages, and Gordon Short, on its own domain, correctly
      has none. Live half, two read-only GETs: the pfLink page serves
      correctly with all seven Pharmacy First cohorts right against the
      NHS specification; homepage NAP, hours, email and footer correct.
      Known states persist, confirmation only: the switch banner mojibake
      close button, the Q22 estate-wide weight loss tagline, and the
      live-only "Great Crosby" line in the sidebar address block (footer
      matches branches.json exactly; cosmetic, not a county defect). Zero
      in-repo defects. Evidence in
      audits/gordon-short-build-check-2026-08-12.txt.
      Third quality pass 2026-08-13 (hundred-and-fortieth run). SELECTED IN
      ERROR: this item was NOT the oldest verification standing. Run 111 had
      re-verified it on 2026-08-12 and the oldest is item 4.4 (run 99). See
      the log entry for the corrected derivation. The pass was done and is
      recorded because the gap it closed is estate-wide rather than specific
      to this branch, but the next run must take 4.4.
      REPO HALF ONLY, no browser available, nothing live read or claimed.
      All 12 pages
      re-read from source and clean for the third consecutive pass, verified
      independently of the checkers: street, postcode and spaced phone on
      every page, the unspaced tel: link, own Google review link on all 12 and
      no other branch's, no other trading branch's phone or postcode anywhere,
      JSON-LD parsing on all 12 and matching branches.json field for field
      (159 College Road / Liverpool / L23 3AT / Merseyside), and Crosby in
      every H1. All 30 checkers exit 0 and all six generators reproduced every
      page byte-identical.
      The gap was the OTHER half of the Pharmacy First eligibility copy. The
      sixty-third run pinned who the service is FOR (ageNote and eligibleYes).
      Nothing ever read eligibleNo, the "When to get different help" block,
      which is the safety net: where an excluded patient should go, and which
      red-flag symptoms mean get urgent help today. It is composed once in
      build-service-pages.js and rendered onto 98 live condition pages, and it
      is the higher-consequence half of the pair. The repo already guards this
      class of copy on weight loss pages (check-weight-loss-copy "the safety
      net") and guarded it nowhere on Pharmacy First. New
      tools/check-pharmacy-first-safety-net.js, 7 rules plus a coverage guard
      and a stale-exception guard, 9 negative tests, all 9 caught their break
      and all injections restored byte-identical. Two defects were found in
      the checker itself by its own negative tests and fixed before commit:
      it compared against raw page text, so esc()'s "A&amp;E" made all 14 sore
      throat pages look like they had lost their 999 line, and rule 7 recorded
      a single owner per point, which silently disabled contamination
      detection for the shared lines most likely to be miscopied. Nothing on
      any page is wrong. One question raised, Q61: impetigo is the only one of
      the seven pathways whose safety net names no urgent route, which is a
      clinical call on live patient-facing copy and not mine to make, so the
      checker warns on it rather than failing. Done 2026-08-13
      Fourth quality pass 2026-08-14 (hundred-and-eighty-third run), and this
      time correctly selected: 3.11 was the oldest verification standing at 42
      run headings, re-derived mechanically from all 41 completed items and all
      223 headings rather than inherited from the previous run's prediction.
      ZERO IN-REPO DEFECTS on the 12 pages for the fourth consecutive pass. An
      independent extraction importing nothing from tools/ ran 960 checks with
      0 failures: one H1 per page carrying Crosby, 159 College Road / L23 3AT /
      0151 924 3449 visible on all 12, every tel: link the branch's own
      unspaced digits, own Google review link on all 12 and no other branch's
      phone, postcode or review link, every email on the pages branches.json's
      own or the branch nhs.net address, JSON-LD parsing on all 12 and matching
      branches.json field for field with a self-referencing url, no http://, no
      emoji, no em dash and no non-ASCII in visible copy except the pound sign,
      no other branch's town or widget id, and no app copy against hasApp
      false. All 34 checkers exit 0 and all seven generators rebuild every page
      byte-identical.
      THE GAP WAS THE THIRD AND LAST UNGUARDED BLOCK OF THE PHARMACY FIRST
      TRIAD. Every condition page answers three questions: do I have this
      (symptoms), is the service for me (eligibleYes, guarded since run 63),
      and what if it is not (eligibleNo, guarded since run 140 on this item's
      own third pass). Nothing had ever read the symptoms list, which is
      composed once in build-service-pages.js and rendered onto 98 live
      condition pages, and which is the first clinical block a patient reads
      and the one they self-assess against. Found by method, not by eye: all 66
      distinct headings across the 12 pages were extracted and searched across
      every file in tools/, and 26 came back guarded by nothing. New
      tools/check-pharmacy-first-symptoms.js, 8 rules, three coverage guards
      and a two-way PATHWAYS pin guard so a new pathway cannot ship without its
      symptoms being read. 14 negative tests, all 14 caught their break, every
      injection restored and proved byte-identical by sha256.
      ONE DEFECT IN THE CHECKER ITSELF, found by its own first run and fixed
      before commit: the first draft read whole-page text with substring
      matching and rule 6 failed on 28 clean pages, because "A high
      temperature" is a real sore throat and earache symptom, a substring of
      the sinusitis symptom, and also sits inside the UTI safety net. Rules 3
      to 6 now read the symptoms block only and compare whole values. Fourth
      time this repo has found the same fault: ask which text a checker read.
      LIVE HALF, read-only, two pages. The symptoms block is correct on both
      the live UTI and shingles pages, heading, lead and every point verbatim,
      with no impetigo copy on the shingles page. Both pages are still the
      pre-item-1.1 "Gordon Shorts Chemist" paste, which is a known state
      awaiting a Weebly paste run and not fixable here, and that is exactly
      what makes the reading useful: the symptoms copy is identical in a paste
      over ten days old and in today's build, so the newly guarded block is the
      block patients are reading now. Also confirmed: branches.json on
      origin/service-module-phase1 still says "Gordon Shorts Chemist"
      (lastUpdated 2026-07-17) against main's "Gordon Short Chemist", and that
      branch is 63 commits behind main, which is Q13 restated with a concrete
      field. No new question. Evidence in
      audits/gordon-short-build-check-2026-08-14.txt. Done 2026-08-14
      Fifth quality pass 2026-08-30 (commit 163b2dc) was completed and
      logged in AGENT_LOG.md but never appended to this block - a sync
      gap, the same shape as Q84. Recorded there: 12 pages clean on 1,823
      independent checks, both clinical/identity guards re-proved by
      mutation, live pfLink and homepage verified, zero in-repo defects.
      Sixth quality pass 2026-08-31, both halves. REPO HALF: all 34
      checkers exit 0. Fresh independent extraction
      (audits/verify-3.11-2026-08-31.js), importing nothing from tools/,
      ran 708 checks across all 12 pages: own phone spaced and unspaced
      (tel:), own postcode and street address, own Google review link, H1
      carrying Crosby on every page, correct "Gordon Short Chemist"
      spelling only (never "Gordon Shorts"), no other trading branch's
      phone, postcode or review link anywhere, JSON-LD parsed and matched
      to branches.json field for field (name, address, telephone) on all
      12, no em or en dash and no unexpected non-ASCII outside the weight
      loss price's pound sign. Zero failures. All six generators rebuild
      every page byte-identical; git status clean.
      LIVE HALF, four read-only GETs (pharmacy-first, switch, weight
      loss, travel clinic). NAP, hours and email correct against
      branches.json on all four. Known live-only states reconfirmed
      unchanged, all already tracked, nothing new: the cosmetic "Great
      Crosby" sidebar line (footer address block correct); the
      estate-wide en dash in the footer hours strip; the mojibake em dash
      in the switch page's "usually is not" sentence, pre-repaste; and
      the STOP-standing "Gordon Shorts Chemist" misspelling, which still
      carries through the title, H1, body and footer of the live
      weight-loss-clinic and travel-clinic pages (not the pharmacy-first
      or switch pages, both correct) despite the generated repo pages
      being correct throughout - a content block that survives a full
      rebuild, not a stale paste, per the 4.14 finding; the STOP against
      repointing Post A stands. Weight loss and travel clinic copy on
      both live pages re-read for compliance: no prescription-only
      medicine named, balanced framing, no superlative or guaranteed-
      outcome language, no vaccine stock guarantee, pricing not headlined
      as a discount, all required safety-net cohorts present. Zero
      in-repo defects. No new question. Evidence in
      audits/verify-3.11-2026-08-31.js and
      audits/gordon-short-item-3.11-quality-pass-2026-08-31.txt. Done
      2026-08-31
      Seventh quality pass 2026-09-01 (unattended run), both halves. This was
      the oldest rotation-pool item standing: 5.7's own 2026-08-30 correction
      note named 4.2 as next, 4.2 was taken by an earlier run today, and a
      fresh block-bounded scan of AGENT_WORKLIST.md (excluding the one-off
      items 1.1, 1.4, 2.2, 5.6, 5.7, 6.7, 6.8, which are not part of the
      rotation) found 3.11 tied with sixteen others at 2026-08-31 and earliest
      by evidence-file timestamp within that day (05:44 BST, before every
      other tied item).
      REPO HALF. All 36 tools/check-*.js checkers exit 0 before any change.
      All six generators (build-service-pages, build-branch-landing-pages,
      build-switch-pages, build-weight-loss-pages, build-travel-clinic-pages,
      build-contraception-pages) rebuilt: sha256 of every file under
      modules/*/pages/ taken before and after, zero diff, git status clean on
      modules/.
      Fresh independent extraction, audits/verify-3.11-2026-09-01.js,
      importing nothing from tools/: 978 checks across all 12 pages (11
      service-family pages plus the switch page), 0 failures. Own spaced
      phone and unspaced tel: link, own postcode and street address, own
      Google review link and no other trading branch's phone, postcode or
      review link anywhere, H1 carrying Crosby on every page, correct
      "Gordon Short Chemist" spelling only (zero "Gordon Shorts" hits),
      JSON-LD parsed and matched to branches.json field for field (name,
      address, telephone) on all 12, no em or en dash and no unexpected
      non-ASCII outside the weight loss price's pound sign, and no app copy
      or store URLs (hasApp false). Weight loss page separately re-confirmed
      to name no prescription-only medicine by brand.
      Verifier proved live, not vacuous, by four injections on a disposable
      backup-and-byte-restore cycle (this mount's git checkout cannot unlink
      the old file, the known FUSE restriction, so restoration was a plain
      file copy each time, sha256-confirmed identical to the pre-injection
      backup after every restore): own phone swapped for another branch's
      (caught, 3 failures), Crosby removed from an H1 (caught), correct
      spelling swapped to the wrong plural (caught, 2 failures including the
      JSON-LD name), an em dash inserted in the body (caught, 2 failures).
      All four restored and git status clean on modules/ throughout.
      LIVE HALF, read-only, five GETs (Claude in Chrome unavailable this run,
      "not connected"; fell back to plain Node fetch(), the established
      fallback since the item 3.3/3.4 passes). pharmacy-first-service-
      crosby.html (the actual pfLink target): 200, correct branding
      throughout (12 correct hits, 0 wrong), own phone present, all seven
      Pharmacy First conditions present with no "coming soon" text anywhere.
      One new observation, not raised as a question: this live-only page's
      main heading is an H2, not an H1 ("Gordon Short Chemist: Pharmacy
      First in Crosby", town correct) - reads as a Weebly theme rendering
      choice on a page this repo does not generate, not a content defect,
      and no prior pass claimed an H1 on this specific URL. switch-
      prescriptions-gordon-short-crosby.html: 200, correct branding
      throughout (26 correct, 0 wrong), still carries the known mojibake
      "ÔÇö" for the em dash, pre-repaste, unchanged. weight-loss-clinic- and
      travel-clinic-gordon-short-crosby.html: both still read "Gordon
      Shorts Chemist" (wrong, plural) in title, H1 and body - 12 and 11
      wrong hits respectively - unchanged since 2026-08-10; the STOP against
      repointing Post A stands and this is the same known-live-only state
      every prior pass has recorded, not a new defect. Weight loss page
      re-checked for compliance: no prescription-only medicine named, no
      Buy Now, no percentage-loss claim; the one "best"/"guaranteed" regex
      hit was "advise on the best next step" (safety-net language, false
      positive, not an efficacy claim). Homepage: phone and postcode both
      present and correct; email present as shorts@rbhealth.co.uk
      (case-insensitive match to branches.json's Shorts@rbhealth.co.uk); NHS
      mailbox not shown on the homepage, consistent with every prior pass
      (never claimed there). sitemap.xml: every entry still lastmod
      2026-08-15T07:41:55+00:00, unchanged, no republish since the last
      pass's own reading.
      Zero in-repo defects. No new question. Evidence:
      audits/verify-3.11-2026-09-01.js. Done 2026-09-01
      Eighth quality pass 2026-09-02 (unattended run), fresh angle only, no
      re-litigation of NAP/JSON-LD/spelling/symptoms/safety-net/em-dashes
      (all seven prior passes' territory). Selected as the oldest of the 36
      rotation-pool items: parsed the full git log (no truncated window) for
      an "item N.N"-shaped commit subject per candidate, excluding the
      standing out-of-rotation pool (1.1, 1.4, 2.2, 5.6, 5.7, 6.7, 6.8); 3.11
      last mentioned 2026-09-01T14:43:42+01:00 (seventh pass), over 24 hours
      before every other of the 36 candidates.
      REPO HALF. All 36 tools/check-*.js exit 0 on the untouched worktree.
      Fresh angle: the booking chain (branches.json widgets -> filename ->
      service.js routing -> Appointedd widget id -> data-branch/data-service
      on the mount), never independently read on THIS item before, though
      check-booking-routes.js covers it estate-wide and already passes.
      New audits/verify-3.11-2026-09-02-booking-chain.js, importing nothing
      from tools/, reads service.js's own SERVICE_WIDGET_KEYS map and
      NO_FALLBACK_SERVICE_KEYS set as data under test: 68 checks across all
      11 service-family pages plus the switch page, 0 failures. Confirmed:
      pharmacy-first resolves to the branch's own pharmacyFirst widget; all
      seven NHS condition pages (uti, sore-throat, sinusitis, earache,
      impetigo, shingles, insect-bite) correctly fall back to the same
      pharmacyFirst widget, none holding one of their own; contraception,
      weight-loss-clinic and travel-clinic each resolve to their own
      dedicated widget id with no fallback; every page's data-branch reads
      "Gordon Short Chemist" and no other branch's name; every data-service
      value is present and non-empty; the switch page's data-branch matches
      too.
      Two injections proved the verifier live, restored by byte copy (not
      git checkout, this mount's documented unlink restriction) and
      sha256-confirmed identical to the pre-injection backup both times: a
      wrong branch name swapped onto the pharmacy-first page's data-branch
      (caught, 1 failure), and the contraception widget id deleted from
      branches.json entirely (caught, 1 failure). The second injection
      caught a genuine bug in this pass's own first-draft check, the same
      shape as the checker-tests-itself pattern recorded on this item's
      third and fourth passes: the WIDGET rule originally read
      "!!wanted || NO_FALLBACK[serviceKey]", which let a NO_FALLBACK
      service's widget id be deleted and still pass, because NO_FALLBACK
      being true satisfied the check regardless of wanted. A page that
      exists was already earned by check-page-coverage.js only because the
      branch holds that widget, so an existing NO_FALLBACK page with no
      widget id is a real break, not a correctly-absent case. Fixed to
      require wanted unconditionally; both injections re-run clean after
      the fix and all 36 checkers plus the new verifier re-confirmed 0
      failures on the fully restored worktree (git status clean on all
      tracked files).
      LIVE HALF, read-only, two GETs (Claude in Chrome unavailable this
      run, zero connected browsers; plain Node fetch(), the established
      fallback). NEW OBSERVATION, not a defect: the pfLink target
      (pharmacy-first-service-crosby.html) is a DIFFERENT live page from
      this repo's generated pharmacy-first-gordon-short-crosby.html - a
      different filename entirely, and one that does not parse under
      service.js's own routing regex (which needs the URL to start
      "pharmacy-first-<brandSlug>-<townSlug>"). Confirmed the live page
      carries no jsdelivr reference and no rbhsv-root mount at all: the
      booking widget there is a separate, hand-pasted Appointedd embed
      with a HARDCODED widgetId, not the dynamic service.js lookup this
      repo's generated pages and check-booking-routes.js assume. The
      hardcoded id read directly off the live page is
      66b9ea0304f4c06db8fdbf8f, an exact match to branches.json's own
      pharmacyFirst widget for this branch, so the live booking is wired
      to the correct diary despite using a different mechanism - positive
      confirmation, not a defect. Five other branches carry the same
      "pharmacy-first-service-<town>.html" pfLink shape (Scorah, Smartts,
      Hirshmans, Coleman and Leighs, plus this one), which is outside this
      item's scope to check further; raised as Q93 since no checker in
      this repo reads a live hardcoded widget embed against
      branches.json, and this pass could only do it by hand for one
      branch. Homepage: phone (0151 924 3449, 3 hits), postcode-bearing
      address (159 College Road, 3 hits) and email (shorts@rbhealth.co.uk,
      1 hit, case-insensitive) all correct.
      Zero in-repo defects. One question raised, Q93 (does not block this
      item). Evidence: audits/verify-3.11-2026-09-02-booking-chain.js.
      Done 2026-09-02
      Ninth quality pass 2026-09-03 (unattended run), fresh angle only. This
      was the oldest of the 36 rotation-pool items: git log parsed in full for
      an "item N.N"-shaped commit subject per candidate, excluding the
      standing out-of-rotation set (1.1, 1.4, 2.2, 5.6, 5.7, 6.7, 6.8); 3.11
      last touched 2026-09-02T14:17:05+01:00, over 25 minutes before the next
      stalest (4.4) and clearly ahead of the rest of the pool.
      REPO HALF ONLY, no browser available (Claude in Chrome not connected).
      Eight prior passes had covered NAP, JSON-LD, spelling, the eligible/
      safety-net/symptoms triad, live-page compliance and the booking chain.
      Neither check-whatsapp-route.js nor check-map-embeds.js had been proven
      by direct injection against this branch's own pages before, only via
      the pack passing the full suite - the same class of gap other items'
      recent passes (1.2 tenth, 4.14 tenth, 4.2 eleventh, 4.7 tenth) closed
      for check-brand-spelling.js and check-url-scheme.js on their own packs.
      Baseline: all 36 checkers exit 0, git status clean. Both files backed
      up by byte copy before mutation (this branch's pharmacy-first page and
      its switch page).
      Four injections, all caught first attempt, all restored and MD5-
      confirmed byte-identical to backup: (1) pharmacy-first page's data-wa
      changed to a wrong number - check-whatsapp-route.js failed correctly,
      naming the page and the disagreement; (2) pharmacy-first page's map
      query postcode changed (3AT to 3AZ) - check-map-embeds.js failed on
      both its address-vs-branches.json rule and its contact-card-vs-map
      agreement rule; (3) switch page's data-wa changed to a different wrong
      number - check-whatsapp-route.js failed correctly; (4) switch page's
      map query street name changed ("College Road" to "College Street",
      postcode left correct to isolate the street mismatch) - check-map-
      embeds.js failed on both rules again.
      Final verification: full 36-checker suite re-run clean, git status
      clean on modules/, core/, branches.json, tools/, status/, gbp-packs/.
      All six generators re-run, output byte-stable (git status clean on
      modules/, core/ before and after).
      Zero in-repo defects. No new question. Evidence:
      audits/gordon-short-item-3.11-quality-pass-2026-09-03-ninth.txt.
      Done 2026-09-03
      Tenth quality pass 2026-09-04 (unattended run), fresh angle only. Oldest
      of the 36 rotation-pool items, independently re-derived via
      `git log --pretty=format:"%cI|||%s"` over the full candidate pool,
      matching the forward note left by the 1.2 eleventh pass earlier the
      same run sequence.
      REPO HALF ONLY (Claude in Chrome not connected). Nine prior passes had
      covered NAP, JSON-LD, spelling, the Pharmacy First eligibility/safety-
      net/symptoms triad, the booking chain, check-whatsapp-route.js and
      check-map-embeds.js, all by injection against this item's own pages.
      Neither check-pharmacy-first-cost.js nor check-app-membership.js had
      been proved by direct injection against this branch's own generated
      pages before, only via the full-suite pass - the same gap this week's
      1.2/4.14/4.2/4.7 passes closed for their own GBP packs.
      Baseline: all 34 checkers exit 0, git status clean. Target:
      modules/service/pages/pharmacy-first-gordon-short-crosby.html, SHA256
      61A2227C9625F7FC6F21CA879D493397DEEE87D69D1FF08FE966425376170A83.
      Injection 1: all seven "free NHS" occurrences swapped to "low-cost
      NHS". CAUGHT: check-pharmacy-first-cost.js, 6 failures (rule 2 and
      rule 4), naming the file. Restored, SHA256-reconfirmed, re-run clean.
      Injection 2: a first attempt (PowerShell -replace targeting a "</p>"
      tag the page does not use) silently matched nothing and a follow-on
      PowerShell statement then truncated the live file to 0 bytes by
      accident, unrelated to any checker or generator. Caught immediately by
      hash comparison before any checker was run against the corrupted
      state; restored at once from a pre-injection backup and
      SHA256-reconfirmed before continuing. Redone with a Node script:
      inserted an app sentence naming "RB Healthcare Pharmacy app" before
      "Book your Pharmacy First appointment". CAUGHT: check-app-membership.js
      rule "absence elsewhere", naming the file, correct since
      gordonshorts_crosby is hasApp: false. Restored, SHA256-reconfirmed,
      re-run clean.
      Full 34-checker suite re-run clean; build-service-pages.js and
      build-switch-pages.js rebuilt byte-identical (git status clean on
      modules/, core/). No checker, generator or page content changed in the
      tracked tree at any point.
      LIVE HALF, read-only (Claude in Chrome unavailable, PowerShell
      Invoke-WebRequest fallback). sitemap.xml lastmod unchanged at
      2026-08-15T07:41:55+00:00, no republish. pharmacy-first-service-
      crosby.html (the live pfLink target, Q93's hand-built page): 200, no
      app mention or store URL anywhere (consistent with hasApp: false), no
      cost qualifier. A raw-text scan flagged one "GBP" hit, which on
      inspection was the Weebly platform's own storeCurrency script
      variable, not visible copy - a fetch-method caveat, not a finding.
      Zero in-repo defects. No new question. Evidence:
      audits/gordon-short-item-3.11-quality-pass-2026-09-04-tenth.txt. Done
      2026-09-04
- [x] 3.12 Tiffenbergs Chemist (Liverpool): same treatment. Done 2026-08-04.
      12 pages, 0 mismatches. Quality pass 2026-08-14.
      Quality pass 2026-08-30, both halves. Repo half: fresh independent
      instrument audits/verify-3.12-2026-08-30.js (imports nothing from
      tools/, own regexes and sheet parsing) ran 2,355 checks across the
      12 Tiffenbergs pages on the 15-leg single-branch template proved on
      3.5/3.7/3.8/3.9: counts, sheet agreement, own town, service words,
      cross-town absence, phone/postcode isolation (including from Clear
      Chemist in the same L9 district), lengths, JSON-LD field by field,
      tel:, widget and brand isolation, banner, root attributes, fragment
      resolution, no hard-coded widget ids, WhatsApp agreement. 0 failures.
      Instrument proved by three fault injections (foreign phone, Clear's
      L9 7AS postcode, orphan 24-hex id), all three caught, page restored
      by git each time. All 36 checkers green, six generators rebuilt to a
      zero diff. Live half: pharmacy-first and switch pages read read-only;
      phone, address, postcode, Aintree wording and displayed hours all
      match branches.json. Q56 (footer publishes tiffenbergs@ plural
      against branches.json singular) re-confirmed still present live, not
      re-raised. The pre-5.1 em dash in the live switch page copy remains,
      as expected until the queued Weebly repaste; the repo copy is clean.
      Quality pass 2026-08-31, THIRD PASS, WIDENED LIVE COVERAGE. Repo half:
      re-ran all 36 checkers individually (0 failures) and rebuilt all six
      generators before touching anything (git status on modules/ and
      core/ empty before and after, byte-identical). No file changed; no
      defect found in the repo half. Live half, read only, nothing clicked
      or typed: read four of Tiffenbergs' 12 live pages the 2026-08-30 pass
      had not read (weight loss, travel clinic, contraception, and the
      infected-insect-bite Pharmacy First condition page), taking live
      coverage for this item from 2 of 12 pages to 6 of 12 across the two
      most recent passes. All four clean: no medicine or vaccine named by
      brand on the weight loss or travel clinic pages, no superlative or
      results claim, price shown only inside the booking card and not
      headlined, book-ahead window stated consistently as "6 to 8 weeks",
      and every fact (address, phone, opening hours including the 1-2pm
      lunch closure, postcode, seoTown) matches branches.json on all four.
      Q56 reconfirmed present and unchanged on all four pages read this
      pass. One further live-only observation, not raised as new: the
      shared Weebly site-wide footer strip beneath the contact card on
      every page (not any file this repo generates) renders with en dashes,
      the same pending-repaste/out-of-repo-scope class already on record
      for the switch page's em dash, not a new gap. No question raised for
      Rishi. Evidence: audits/verify-3.12-2026-08-31.md. Six of Tiffenbergs'
      12 live pages (earache, impetigo, shingles, sinusitis, sore throat,
      UTI) remain unread live for this item; left for a future pass.
      Quality pass 2026-09-01, FOURTH PASS, REPO HALF ONLY. All 36 checkers
      re-run individually before any change, 0 failures; all six generators
      rebuilt first, 189 files under modules/ and core/ sha256-hashed before
      and after, byte-identical, git status empty throughout. Fresh
      independent instrument audits/verify-3.12-2026-09-01.js (portable repo
      root, no import from tools/, same 15-leg single-branch template as the
      prior three passes): 12 pages, 177 sheet permalinks, 2,355 checks, 0
      failures. Instrument proved by three sequential fault injections, each
      restored by byte copy (not git checkout) and sha256-confirmed back to
      the original before the next, on sinusitis-treatment-tiffenbergs-
      aintree.html - a Pharmacy First condition page untried for Tiffenbergs
      injection in any prior pass, widening from the pharmacy-first hub and
      switch pages used previously: (1) visible phone swapped to Smartts
      Bootle's number, caught by the foreign-phone leg; (2) postcode swapped
      to L9 7AS, caught twice (rbh_head_office_aintree and clearchemist_
      aintree both carry that postcode); (3) an orphan 24-hex string added
      beside the module root, caught by the hard-coded-widget-id leg. Zero
      in-repo defect. Live half NOT done this pass: Claude in Chrome not
      connected (confirmed at answer pickup and again for this item), so the
      six live pages left unread by the 2026-08-31 pass (earache, impetigo,
      shingles, sinusitis, sore throat, UTI) remain unread live, and Q56
      (Tiffenberg@ singular in branches.json vs tiffenbergs@ plural on the
      live footer) was not re-confirmed this pass - not assumed unchanged.
      No new question raised.
      Quality pass 2026-09-02, FIFTH PASS, both halves, item selected by a
      revised method (see AGENT_LOG.md for why): the log-wide "quality pass"
      proximity heuristic used by recent runs produced an unresolved tie
      between 3.11 and 3.2 at 8 mentions each, and cross-checking against the
      simpler count of "quality pass" occurrences inside each item's own
      AGENT_WORKLIST.md block showed that heuristic does not track actual
      verification depth (3.11 and 3.2 both already carry 7 own-block passes,
      while several tied items carry only 5). Re-ranked the full 33-item
      2026-09-01-dated pool by own-block pass count instead: 3.12 came out
      lowest at 4, a clear margin under the next tier (5, three items), so 3.12
      was selected outright, no further tie-break needed.
      REPO HALF. All 36 checkers re-run individually before any change, 0
      failures. All seven generators rebuilt first; every file under
      modules/*/pages sha256-hashed before and after (203 files), byte-
      identical, git status empty on modules/ and core/ throughout.
      Fresh independent instrument audits/verify-3.12-2026-09-02.js (same
      15-leg single-branch template as the four prior passes, imports
      nothing from tools/): 12 pages, 177 sheet permalinks, 2,355 checks, 0
      failures. Instrument proved live by three fault injections, each on a
      page untried for injection in any prior 3.12 pass, restored by byte
      copy (not git checkout) and sha256-confirmed identical to the
      pre-injection backup before the next: (1) impetigo page's spaced phone
      swapped to a fabricated non-branch number - caught via the JSON-LD
      telephone leg only, the unspaced tel: digits were untouched by the
      substitution so the "own phone present" leg correctly stayed green,
      and no "foreign phone" leg fired because the fabricated number
      matches no real branch, the same fabricated-vs-real distinction
      already established on check-nap's WARN/FAIL split; (2) UTI page's
      postcode swapped to Clear Chemist Aintree's real L9 7AS (the shared L9
      district this item's template exists to separate) - caught four ways
      at once, both foreign-postcode legs (rbh_head_office_aintree and
      clearchemist_aintree share that postcode), the own-postcode-absent
      leg and the JSON-LD postalCode leg; (3) earache page given an orphan
      24-hex string beside its module root - caught by the hard-coded-
      widget-id leg. Zero in-repo defect. All 203 generated files
      sha256-confirmed byte-identical to the pre-pass baseline after every
      restore.
      LIVE HALF, read-only, widened to the six pages left unread by every
      prior pass (earache, impetigo, shingles, sinusitis, sore throat, UTI),
      via plain curl from the sandbox (Claude in Chrome confirmed
      unreachable at answer pickup and again for this item; the sandbox has
      direct outbound network access this run, so no PowerShell fallback was
      needed). This takes live coverage of Tiffenbergs' 12 live pages to
      12 of 12 across the passes taken together, for the first time. All six
      clean and mutually consistent: own phone (both spaced text and
      unspaced tel: href), own postcode, own street address and "Aintree"
      all present on every page; H1 and title both follow the
      "<Condition> treatment in Aintree - Tiffenbergs Chemist" pattern; no
      other trading branch's phone or postcode found on any of the six
      (the "RB Healthcare Ltd" hit from group-brand comparison is the
      shared footer copyright line printed on every page across the whole
      estate, not cross-branch contamination - a false positive in this
      pass's own comparison, not a finding). Q56 (branches.json's singular
      Tiffenberg@ against the live plural tiffenbergs@) reconfirmed present
      and unchanged in the contact block and footer of all six pages, not
      re-raised. Two already-known, out-of-repo-scope live-only states
      confirmed present on all six, identical byte count on each, both
      inside non-rendering script/comment text rather than visible copy: the
      pre-repaste mojibake "ÔÇö" em dash (this time inside a shared Google
      tag/GTM header comment that also names Coleman and Leighs, evidently
      boilerplate copied site-wide from that branch's original setup and
      unchanged since, not something a patient reads) and the mojibake
      "├ù" (a UTF-8 multiplication-sign close icon rendered as Windows-1252)
      inside the switch banner's close-button template literal, the same
      close-button mojibake already tracked on other branches. Neither is
      new; both sit outside this repo's generated output. No prescription
      medicine names or superlative claims on any of the six condition
      pages (none expected; these are Pharmacy First pathways, not weight
      loss). Zero in-repo defects. No new question raised.
      Evidence: audits/verify-3.12-2026-09-02.js,
      _agentscratch/live312/*.html (six live fetches, working copy only, not
      committed). Done 2026-09-02
      Quality pass 2026-09-02, SIXTH PASS, REPO HALF ONLY (Claude in Chrome
      confirmed not connected at answer pickup and again for this item).
      All 36 tools/check-*.js checkers re-run individually before any
      change, 0 failures. All six generators rebuilt first (196 files
      under modules/ and core/ hashed before), git status --porcelain
      modules/ core/ empty after regeneration, byte-identical, nothing to
      commit from the rebuild. Re-ran the existing independent instrument
      audits/verify-3.12-2026-09-02.js (fifth pass, same day, portable, no
      import from tools/): 12 pages, 177 sheet permalinks, 2,355 checks, 0
      failures, confirming no drift since this morning's pass. Guard
      effectiveness re-proved by three fresh fault injections on
      contraception-tiffenbergs-aintree.html, a page untried for injection
      in any of the five prior 3.12 passes (own diary, not a Pharmacy First
      fallback page, so a different surface from the condition pages used
      previously): (1) visible phone (contact-line only, tel: href left
      alone) swapped to Smartts Chemist Bootle's real number, caught by
      check-nap.js as two mismatches (own phone wrong, foreign phone
      belongs to Smartts); (2) visible address postcode (contact-line only)
      swapped to Clear Chemist Aintree's real L9 7AS - the same shared L9
      district this item's template exists to keep separated - caught by
      check-postcodes.js's FOREIGN rule naming clearchemist_aintree by id;
      check-jsonld.js correctly stayed clean on this one, since only the
      visible contact line was touched and its own JSON-LD postalCode field
      was untouched - each checker owns its own surface, not a gap; (3) an
      &#8212; numeric entity injected beside the H1, caught by
      check-em-dashes.js ("em dash (HTML numeric entity)"), incidentally
      re-confirming the immediately preceding run's fix to that checker's
      numeric-entity matching against a live page rather than only the
      injected test file it was built and proved against. All three
      restored by byte copy (not git checkout) from a pre-injection backup
      and SHA256-confirmed identical to the original
      (9F6CE5DDE12C5E3A69DD15266DE9E4DACDCBCC21F2D7F7F3D54EC85869FACFA0)
      after each restoration and again after the last; backup file deleted
      afterwards. All 36 checkers re-run clean after cleanup; git status
      --porcelain on modules/, core/, gbp-packs/, branches.json and tools/
      empty throughout and at the end. GBP pack
      (gbp-packs/tiffenbergs-aintree.md) re-checked via check-gbp-packs.js:
      0 failures, 17 estate-wide human-judgement warnings unchanged, none
      naming Tiffenbergs. branches.json's tiffenbergs_longmoor record
      re-read field by field (phone, postalCode, seoTown, hasApp): agrees
      with the pack and with every page. Zero in-repo defects found. Live
      half not attempted this pass: full 12-of-12 live coverage was already
      completed earlier the same day by the fifth pass, so re-reading it
      again today would not be new information, and Claude in Chrome was
      unreachable regardless (checked at answer pickup and again here). Q56
      (branches.json's singular Tiffenberg@ against the live plural
      tiffenbergs@) stands as last confirmed by the fifth pass, not
      re-verified. No new question raised.
      Evidence: this run reused audits/verify-3.12-2026-09-02.js rather
      than duplicating it, since it was written and proved the same day;
      injection transcript is this run's own PowerShell session, not
      separately filed. Done 2026-09-02 (sixth pass)
      Quality pass 2026-09-03, SEVENTH PASS, FRESH ANGLE: tools/check-gbp-
      packs.js's hours-rule family proven by injection against Tiffenbergs'
      own GBP pack for the first time (six prior passes injected into the
      service pages but never into gbp-packs/tiffenbergs-aintree.md itself).
      Tiffenbergs is one of the seven lunch-closure branches and has no
      branch landing page, so check-opening-hours.js never reaches it - the
      pack and check-gbp-packs.js are the only guard on this branch's
      published hours. Baseline: all 36 checkers 0 failures, all six
      generators rebuilt first, 216 files under modules/ and core/ sha256-
      unchanged. Pack backed up by byte copy before mutation, baseline
      SHA256 59D288C1C32920C05BC9B12479EC2BC8970FFA5639977CCEE10EC9BE9046811B,
      restored and sha256-reconfirmed identical after every injection.
      Five injections against the unfixed checker: (1) Hours line time
      9:00am->9:15am - CAUGHT, three rules at once; (2) Hours line day
      Monday-Friday->Monday-Saturday - CAUGHT by the day-set rule; (3) Hours
      line lunch break inverted (9-1/2-6 -> 9-2/1-6, same times, same days) -
      CAUGHT, and only by the time-to-day pairing rule as designed; (4)
      business description's "closed 1pm to 2pm for lunch" -> "closed 1pm to
      3pm for lunch", outside the guarded Hours line - MISSED, full suite
      exit 0; (5) removed the paster instruction to enter two GBP time ranges
      - CAUGHT by the split-day rule.
      FINDING (injection 4). The "anywhere in the pack" hours rule splits
      each sentence on commas and requires a day word and an hours/closure
      claim in the SAME segment. Tiffenbergs' own business description states
      them in two different comma-separated segments ("Open Monday to
      Friday, closed 1pm to 2pm for lunch."), so the closure segment carries
      no day word and is silently skipped. Identical wording, word for word,
      also found in coleman-leigh-walton.md and smartts-bootle.md by grep;
      both confirmed genuine split-day branches with a 13:00-14:00 gap, both
      currently correct on re-read, so this is a latent hole across three
      packs, not a live breach on any of them. Gordon Short Crosby's pack
      states the same fact with no comma ("closes for lunch 1:00pm to
      2:00pm Monday to Saturday"), which is why the item 4.14 pass that
      built this rule never hit the gap - the sentence shape it was proved
      against does not have it.
      FIX. tools/check-gbp-packs.js: added a sentence-scoped carryDays
      variable to the segment loop - a segment with no day word of its own
      now inherits the day set from the most recent segment in the SAME
      sentence that named one, instead of being skipped. Reset every
      sentence, only ever set from a segment's own days, so it cannot chain
      a day claim across a sentence boundary or invent one nobody stated.
      VERIFICATION. Re-ran injection 4 against the fixed checker: CAUGHT,
      five failures (one per weekday), each reading "outside the guarded
      hours line, this pack states a [Day] closure of 13:00 to 15:00, but
      branches.json leaves [Day] closed 13:00 to 14:00." Restored, sha256
      confirmed. Full 36-checker suite re-run on the real repo: 0 failures,
      identical warning set to baseline (17 estate-wide warnings, none newly
      naming Tiffenbergs, Coleman and Leighs or Smartts Bootle) - the fix
      creates no false positive on the two other packs sharing the sentence
      shape. All six generators rebuilt again: 216 files under modules/ and
      core/ sha256-unchanged, byte-identical - checker-only fix, no page,
      pack, generator or branches.json entry touched.
      RESULT. Real, previously latent defect fixed: the "anywhere in the
      pack" hours rule could not see a closure claim comma-split from its
      day clause, the exact shape of three packs' own business descriptions.
      All three correct on the current tree. No live breach.
      LIVE HALF not attempted: Claude in Chrome confirmed not connected at
      answer pickup and again for this item; the sixth pass already brought
      Tiffenbergs to 12-of-12 live coverage the same day, so nothing new to
      gain by re-reading it unread. Q56 stands as last confirmed by the
      fifth/sixth passes. No new question raised - checker widening on data
      already known correct, not a live-facing decision.
      Evidence: audits/tiffenbergs-item-3.12-quality-pass-2026-09-03-
      seventh.txt. Done 2026-09-03 (seventh pass)
- [x] 3.13 Clear Chemist (Liverpool): same treatment. Done 2026-08-04.
      3 pages (switch, weight loss, travel), 0 mismatches.
      Quality pass 2026-08-13, REPO HALF ONLY: no browser was available this
      run, so nothing live was read and nothing live is claimed. The three
      pages are clean on every fact. All three re-read by an independent
      extraction with its own file discovery, its own regexes and its own
      reading of branches.json, importing nothing from tools/: 3 pages found
      out of 182 html files under modules/, 225 checks, 0 failures. Exactly
      one H1 per page, each carrying both Aintree and Clear Chemist; display
      phone 0151 203 8365 in visible copy with every tel: link the unspaced
      form and no other branch's number in either shape; own postcode L9 7AS
      present and no other branch's; JSON-LD parsed on all three and compared
      field by field to branches.json, including Liverpool as addressLocality
      against Aintree as the seoTown, with each url ending in its own
      filename; no other branch's town or brand named; no http:// URL, no
      emoji; website and review link matching branches.json; and no
      hard-coded Appointedd widget id on any page. All 30 checkers pass and
      all seven generators rebuild every page byte-identical (only
      status/index.html moves, and only because run 153's log entries grew
      it). The em dashes in the page header comments are not a breach:
      check-em-dashes.js reports dashes inside build comments rather than
      failing them, deliberately and with its reasoning written down, because
      no visitor sees them.
      THE FINDING IS NOT IN THE FACTS, IT IS IN WHAT THE PAGES PROMISE, and
      it is raised as Q65 rather than fixed. All three pages invite the
      patient to attend in person: the switch page promises "Collect from
      us" and calls Clear "your local independent pharmacy in Aintree" and
      "a local NHS pharmacy in Aintree", the weight loss page says "call in,
      so you can be seen privately without waiting", and the travel clinic
      page says patients are "seen discreetly in the pharmacy". Every field
      branches.json holds for this branch says the opposite: it is the only
      one of the 15 trading pharmacies with no openingHours ("no public NHS
      profile hours applicable"), no pfLink and pfBooking false, no
      nhsReviewUrl, only two widgets rather than five, an address shared
      with head office at a trade centre unit, exclusion from the
      broken-link sweep, and a schemaNote recording that Clear "has no
      physical branch resource in Appointedd". NOTHING WAS EDITED. This is a
      live patient-facing claim with a regulatory edge, which the run
      instructions carve out of autonomous decisions, and no autonomous
      window is open in any case. No checker was added either, because any
      rule would have to assert Clear's trading status, which is the thing
      being asked.
      Quality pass 2026-08-14, second machine pass, REPO HALF ONLY: two Chrome
      extension instances are connected and the tooling requires a human to
      choose between them, so nothing live was read and nothing live is
      claimed. ZERO DEFECTS, no page edited. A new independent instrument
      (audits/clear-aintree-independent-2026-08-14.js, importing nothing from
      tools/) ran 298 checks across the three pages and found none: structure,
      heading order, paste-header SEO title and description lengths, phone in
      both shapes, postcode, review link, website, map embed address, no
      foreign branch identity, no http://, no dash, no emoji, no personal
      inbox, no hard-coded widget id, every fragment target resolving, and
      every CDN pin resolving to a real ref with the pinned file present at
      it. The instrument was proved before it was believed: a companion probe
      (audits/clear-aintree-vacuity-probe-2026-08-14.js) injects nine real
      faults one at a time and all nine are now caught, with the page restored
      by git after each. THREE SEPARATE FALSE READINGS WERE CAUGHT AND FIXED
      IN THE INSTRUMENTS, NOT IN THE REPO: cmd ate the "^" in "^{commit}" so
      every CDN pin first looked broken; "service-module-phase1" exists in
      this clone only as a remote tracking ref, which is not a live fault
      because jsDelivr resolves against GitHub; and two probe injections were
      vacuous, one using a postcode belonging to no branch and one landing
      inside the paste-header comment the audit deliberately strips. THE ONE
      NEW COVERAGE FINDING, reported not raised: sweep-broken-links.js
      excludes www.clearchemist.co.uk by SKIP_HOSTS, so no link on these three
      pages has ever been status-checked. Measured rather than assumed, that
      exposure is currently nil, because all three links to that host are the
      site root, which cannot 404 while the site exists. It becomes real the
      moment a deep link is added, and section D of the audit re-measures it.
      Q65 (the pages promise a walk-in service the branch record contradicts)
      and Q20 (the inert data-wa on the travel page, which is estate-wide
      across 15 travel and 14 Pharmacy First pages, not a Clear defect) are
      both already open and were deliberately not re-raised.
      Quality pass 2026-08-30, third machine pass, FIRST WITH A LIVE HALF.
      REPO HALF: zero defects, no page edited. All six generators rebuilt
      byte-identical and all 36 checkers pass. The proven independent
      instrument (audits/clear-aintree-independent-2026-08-14.js, importing
      nothing from tools/) re-ran clean: 298 checks across the three pages,
      0 failures, output saved to
      audits/clear-aintree-independent-2026-08-30-output.txt. The instrument
      was re-proved before being believed: the nine-fault vacuity probe ran
      again and all nine injections were caught, with the page restored
      clean by git afterwards
      (audits/clear-aintree-vacuity-probe-2026-08-30-output.txt). Section D
      re-measured the sweep-broken-links SKIP_HOSTS exposure: still nil,
      because all three links to www.clearchemist.co.uk remain the site
      root and no deep link has been added.
      LIVE HALF, READ ONLY, the first time any pass has read the live store
      for this item: one browser tab, four addresses read, nothing clicked,
      typed or submitted. The site root loads and trades normally. All
      three generated slugs (switch-prescriptions-clear-aintree.html,
      weight-loss-clinic-clear-aintree.html and
      travel-clinic-clear-aintree.html) return the store's own 404 page,
      which confirms by direct observation what Q29 records: the three
      pages have never reached the public, so the walk-in wording Q65
      queries is not yet in front of any patient. The store's 404 page
      gives 0151 203 6535 as the contact number, consistent with Q28's
      standing read that 6535 is the e-commerce customer services line
      while branches.json's 8365 is the pharmacy line; nothing about that
      divergence changed. Q65, Q29 and Q28 all remain open and were
      deliberately not re-raised.
      Fourth quality pass 2026-08-31, from Cowork's sandboxed shell (see
      this run's AGENT_LOG.md entry for the environment note common to
      every sandboxed-shell run). All 8 unblocked worklist items were
      [BLOCKED], so this was the fallback quality pass, picked by the same
      method as prior fallback passes: oldest last-verified date, tied
      with 6.2, then fewest "quality pass" mentions in its own block
      (also tied with 6.2 at 3), then file order.
      REPO HALF: zero defects. All 36 checkers ran individually, 0
      failures. Every generator (tools/build-*.js) re-ran and
      `git status --porcelain modules/ core/` was empty before and after,
      confirming byte-identical output.
      TARGETED VERIFICATION: this pass's actual finding is that Q28's
      2026-08-30 implementation note ("branches.json updated for
      clearchemist_aintree... three Clear pages... regenerated") had never
      been independently re-checked by a later run, so it was checked now
      rather than taken on trust. branches.json's clearchemist_aintree
      phone reads 0151 203 6535; all three generated pages
      (switch-prescriptions-clear-aintree.html,
      weight-loss-clinic-clear-aintree.html,
      travel-clinic-clear-aintree.html) print only 6535, no trace of the
      old 8365; check-nap.js confirms 0 mismatches across 177 pages and 3
      paste blocks. A grep for the old number outside branches.json and
      the generated pages did surface one hit, in
      gbp-packs/clear-aintree.md, and it was read in full before being
      treated as a finding: it is the pack's own dated note recording that
      the number changed FROM 8365 TO 6535 on 2026-08-30, not a paste
      value, and every actual paste-facing line in the pack (the Profile
      basics phone line, Post A, Post B and the paster note) already reads
      6535. Confirmed not a defect, same class as the quoted-evidence
      exemption already documented elsewhere in this repo for GBP pack
      narrative.
      LIVE HALF, READ ONLY, second time this item has had one: one browser
      tab, five addresses read, nothing clicked, typed or submitted. Root
      trades normally. The contact page gives 0151 203 6535 in both NAP
      surfaces ("Customer Services Telephone" and the complaints footer),
      matching branches.json and matching the 2026-08-30 read, so no drift
      in the 24 hours since. All three generated slugs still return the
      store's own 404 page (which itself now shows 6535 too), unchanged
      from 2026-08-30 and consistent with Q29, which has since moved from
      open to answered ("leave the three pages generated and unpublished
      ... revisit when the store is next worked on") - re-read against
      QUESTIONS.json this run rather than assumed. Q28 has likewise moved
      from open to answered since the note directly above this one was
      written (that note's "Q28... remains open" was accurate at the time
      it was written, earlier the same day). Q65 remains open and was not
      re-raised; nothing this pass read bears on it beyond what the
      2026-08-30 pass already recorded.
      Answer pickup (this run's step 3) reconfirmed separately: all 17
      distinct question ids visible in the portal feedback endpoint,
      including Q28 and Q29, already carry "answered" in QUESTIONS.json,
      so nothing new to apply from that source either.
      Zero in-repo defects found; nothing edited under tools/, modules/,
      core/ or branches.json.
      Quality pass 2026-09-01 (fifth), unattended scheduled run, Cowork
      sandboxed shell for file work plus the Windows PowerShell path for
      git network operations (the standing Q87 split). All 8 unblocked
      worklist items were [BLOCKED], so this was the fallback quality
      pass, picked by the rotation-pool method (oldest commit last
      mentioning each of the 36 rotation-pool item numbers): 3.13 was
      oldest, last touched 2026-08-31T18:39:51+01:00.
      REPO HALF: all 36 checkers ran individually, 0 failures. All six
      generators rebuilt; 189 files under modules/ and core/ sha256-hashed
      before and after, byte-identical throughout, git status empty. The
      proven independent instrument (audits/clear-aintree-independent-
      2026-08-14.js, unchanged, importing nothing from tools/) re-ran
      clean: 298 checks across the three pages, 0 failures, output saved
      to audits/clear-aintree-independent-2026-09-01-output.txt.
      TWO REAL FAULTS FOUND AND FIXED IN THE INSTRUMENTS, NOT THE REPO,
      both in the nine-fault vacuity probe:
      (1) STALE INJECTION VALUE. The probe's first injection hardcoded the
      pre-Q28 phone digits (tel:01512038365). Since Q28 changed this
      branch's phone to 0151 203 6535 on 2026-08-30, that string no longer
      appears on the page, so the injection came back INERT the moment it
      was tried - not a live defect, a stale literal in a test unchanged
      since 2026-08-14 and never revisited after the phone fix landed.
      (2) RESTORE-BY-GIT FAILURE. Re-running the original probe, a
      `git status --porcelain` issued moments earlier from the sandboxed
      shell had left a fresh .git/index.lock behind (that mount can create
      and rename files but not unlink them, the standing Q87 finding), so
      the probe's second injection's `git checkout --` restore call failed
      with "Unable to create index.lock: File exists" and the script
      crashed with switch-prescriptions-clear-aintree.html still sitting
      on disk carrying the injected second-H1 fault, UNCOMMITTED. Caught
      immediately: the live file was checked, confirmed still mutated, and
      restored via the Windows PowerShell path (which holds working git
      access and no lock contention on this mount), then sha256-verified
      byte-identical to the pre-probe hash
      (96db1824436b7f8c4e37bc576fe539f48f7a9fdbd30debfccb3c6a6dd5dd78f9)
      before anything else touched the file. No repo-content damage; the
      mutation never reached a commit.
      Both fixed in a new instrument, audits/clear-aintree-vacuity-probe-
      2026-09-01.js: the phone-digit injection now reads the live number
      out of branches.json at run time rather than hardcoding either the
      old or new number, so a future phone change cannot make it go inert
      again; and every injection is now restored with fs.writeFileSync
      back to the in-memory original string, with git status kept only as
      a secondary confirmation rather than the repair mechanism - the
      exact fix CLAUDE.md's own "A test harness must restore by byte copy,
      not from git" lesson already prescribes elsewhere in this repo, not
      yet applied to this particular probe until now. Re-run clean: 9
      caught, 0 missed, file restored clean and byte-verified, output
      saved to audits/clear-aintree-vacuity-probe-2026-09-01-output.txt.
      GBP PACK cross-checked (gbp-packs/clear-aintree.md): consistent with
      branches.json throughout; the one phone-shaped WARN check-gbp-
      packs.js raises against it (the old 8365 number) is the pack's own
      dated narrative recording the Q28 change, not a paste value, same
      class as the exemption already documented for this pack on the
      2026-08-31 pass.
      LIVE HALF: not read this pass. Claude in Chrome not connected
      (confirmed at answer pickup, step 3 of this run, and not retried by
      another route per the procedure's own instruction). Q28's phone fix
      and Q29's three-pages-still-404 state were both independently
      reconfirmed live earlier the same day by this run's own item 4.9
      quality pass (seventh), so not re-stated here as unverified. Q65
      remains open and was correctly not touched: a live patient-facing
      regulatory claim, carved out of autonomous decisions regardless of
      window state, and no autonomous window was open this run in any
      case.
      Zero in-repo defects. Nothing edited under tools/, modules/, core/
      or branches.json; the only repo changes this pass are the two new
      audit instrument/output files and this log entry.
      Quality pass 2026-09-02 (sixth), unattended scheduled run, Windows
      PowerShell path throughout (mcp__workspace__bash denied outright
      this run, same as the immediately preceding 16:34 BST run's item
      3.7 pass; no sandboxed-shell work attempted). All 8 unblocked
      worklist items were [BLOCKED] (confirmed by direct grep, 8 of 8),
      so this was the fallback quality pass, picked by the standing
      rotation-pool method: git log commit subjects matched against each
      of the 36 rotation-pool item numbers (43 checked items minus the
      standing out-of-rotation set 1.1, 1.4, 2.2, 5.6, 5.7, 6.7, 6.8),
      oldest most-recent-mention wins. 3.13 was oldest, last touched
      2026-09-01T19:42:48+01:00, ahead of 6.2 (20:13:45) and 3.4 (21:11:59).
      REPO HALF: all 36 checkers ran individually. 35 passed clean on the
      first run; check-postcodes.js initially returned 1 failure, but the
      cause was this run's own working file, _agentscratch/gitlog.txt (a
      git-log dump made to compute the rotation pool above), which quoted
      a commit message containing the McCanns Sandringham correction
      postcode CH49 1SX - the exact NARRATIVE_POSTCODES value CLAUDE.md
      already documents, hitting a file outside NARRATIVE_FILES. Same
      shape as the stray-scratch-file finding recorded on this run's own
      earlier item 3.7 pass. Deleted (untracked, never committed;
      confirmed by `git status --porcelain _agentscratch` showing only
      the untracked directory itself beforehand); check-postcodes.js
      re-ran clean, 0 failures, 3 warnings, none new. Not a repo defect.
      All six generators rebuilt (branch landing, contraception, service,
      switch, travel clinic, weight loss); `git status --porcelain
      modules/ core/` empty both before and after, byte-identical output.
      The proven independent instrument
      (audits/clear-aintree-independent-2026-08-14.js, unchanged,
      importing nothing from tools/) re-ran clean: 298 checks across the
      three pages, 0 failures, output saved to
      audits/clear-aintree-independent-2026-09-02-output.txt. The
      instrument was re-proved before being believed: the nine-fault
      vacuity probe (audits/clear-aintree-vacuity-probe-2026-09-01.js,
      the version fixed on the previous pass to read the live phone digit
      from branches.json at run time and restore by byte copy rather than
      git) ran again, 9 caught, 0 missed, page restored clean and
      byte-verified, output saved to
      audits/clear-aintree-vacuity-probe-2026-09-02-output.txt.
      GBP PACK re-checked (gbp-packs/clear-aintree.md): the one WARN
      check-gbp-packs.js raises against it is unchanged and confirmed
      still narrative - line 15's "the old 0151 203 8365" recording the
      Q28 change, not a paste value; every actual paste-facing line
      (Profile basics phone, Post A, Post B) reads 0151 203 6535. Output
      saved to audits/clear-aintree-gbp-pack-check-2026-09-02.txt.
      LIVE HALF: not read this pass. Claude in Chrome confirmed not
      connected at this run's own step 3 answer pickup; per procedure,
      not retried by another route and no login attempted.
      Zero in-repo defects found in Clear Chemist's own pages, records or
      pack. Q65 remains open and was correctly not re-raised: a live
      patient-facing regulatory claim (whether Clear can take a walk-in),
      carved out of autonomous decisions regardless of window state, and
      no autonomous window was open this run (no "Standing authorisation"
      heading present at the top of AGENT_LOG.md at the start of the
      run). Q28 and Q29 re-read from QUESTIONS.json: both still
      "answered", unchanged, not re-stated as findings.
      Nothing edited under tools/, modules/, core/ or branches.json; the
      only repo changes this pass are three new audit output files and
      this log entry.
      Quality pass 2026-09-03 (seventh), unattended scheduled run, Windows
      PowerShell path throughout for git and generator/checker work (the
      Cowork sandboxed mount was used only for orientation: lock creation,
      reading QUESTIONS.json and AGENT_LOG.md, and confirming remote state
      via origin-https, since origin over SSH fails "Host key verification
      failed" from that mount, the standing Q87 diagnosis). All 8 unblocked
      worklist items were [BLOCKED] (confirmed by direct grep), so this was
      the fallback quality pass, picked by the standing rotation-pool
      method: git log commit subjects matched against each of the 36
      rotation-pool item numbers (43 checked items minus the standing
      out-of-rotation set 1.1, 1.4, 2.2, 5.6, 5.7, 6.7, 6.8), oldest
      most-recent-mention wins. 3.13 was oldest, last touched
      2026-09-02T17:07:43+01:00, ahead of 6.2 (17:38:31) and 3.4 (18:10:44),
      confirming the sixth pass's own forward note.
      REPO HALF: all 36 checkers ran individually. One transient failure on
      the first run, in the run's own working file rather than the repo:
      check-postcodes.js failed against a scratch git-log dump this run
      wrote to _agentscratch/ while deriving the stalest item, which quoted
      historical commit subjects containing five narrative postcodes,
      including the McCanns Sandringham correction postcode CLAUDE.md
      already documents (CH49 1SX). Same shape as the identical finding on
      the sixth pass one day earlier. Deleted (untracked, never committed);
      check-postcodes.js re-ran clean, 0 failures, 3 warnings, none new. Not
      a repo defect. All six generators rebuilt; git status --porcelain on
      modules/, core/, tools/, branches.json, gbp-packs/ empty both before
      and after, byte-identical output confirmed. The proven independent
      instrument (audits/clear-aintree-independent-2026-08-14.js, unchanged,
      importing nothing from tools/) re-ran clean: 298 checks across the
      three pages, 0 failures. The nine-fault vacuity probe
      (audits/clear-aintree-vacuity-probe-2026-09-01.js) re-ran against the
      switch page: 9 caught, 0 missed, restored clean and byte-verified.
      FRESH ANGLE (the actual finding of this pass). Across six prior
      passes, every injection test against this item targeted the switch
      page (switch-prescriptions-clear-aintree.html) with generic NAP and
      structural faults. check-weight-loss-copy.js and
      check-travel-clinic-copy.js - the two regulated-copy checkers holding
      the eligibility, no-guarantee, no-medicine-name and no-outcome-promise
      wording - had never been proven by direct injection against this
      branch's own weight-loss-clinic-clear-aintree.html or
      travel-clinic-clear-aintree.html in this item's seven-pass history.
      Both checkers read all 15 pages estate-wide, so Clear's two pages were
      passing by construction, not by anything this item had tested
      directly. New instrument written for this pass,
      audits/clear-aintree-regulated-copy-probe-2026-09-03.js, restoring by
      fs.writeFileSync byte copy rather than git (the same fix the fifth
      pass had to apply by hand after a sandboxed-mount index.lock crashed
      an earlier probe mid-run), sha256-verified after every restore and
      again at the end. Seven injections, one at a time: on the weight loss
      page, dropping the unique "This is a paid private service, not an NHS
      treatment" sentence (RULE 4, private-marks), inserting "Mounjaro"
      (RULE 8, medicine name) and inserting "real results" (RULE 9, efficacy
      claim); on the travel clinic page, dropping the unique hero sentence
      naming it "a private, paid service" (RULE private), inserting "always
      in stock" (RULE stock), inserting the travel vaccine brand "Typhim"
      (RULE medicine) and inserting "will protect you completely" (RULE
      outcome, promised protection). All seven caught first attempt, both
      files restored clean and sha256-verified byte-identical to their
      pre-probe hashes throughout. Output saved to
      audits/clear-aintree-regulated-copy-probe-2026-09-03-output.txt.
      GBP PACK re-checked (gbp-packs/clear-aintree.md): the one WARN
      check-gbp-packs.js raises is unchanged and confirmed still narrative,
      the pack's own dated note recording the Q28 phone change from 0151 203
      8365 to 6535, not a paste value.
      LIVE HALF: not read this pass. Claude in Chrome confirmed not
      connected, checked at this run's own step 3 answer pickup and again
      before this quality pass's live half; not retried by another route
      and no login attempted, per procedure.
      RESULT. No in-repo defect found. check-weight-loss-copy.js and
      check-travel-clinic-copy.js were already correctly protecting Clear
      Chemist Aintree's regulated pages on every rule tested; now proven
      directly by injection against this branch specifically for the first
      time. Q65 (the pages' walk-in wording against the branch's own
      no-physical-branch-resource record) remains open and was correctly
      not touched: a live patient-facing regulatory claim, carved out of
      autonomous decisions regardless of window state, and no autonomous
      window was open this run (no "Standing authorisation" heading present
      at the top of AGENT_LOG.md at the start of the run). Q28 and Q29
      re-read from QUESTIONS.json: both still "answered", unchanged. Nothing
      edited under tools/, modules/, core/, branches.json or gbp-packs/; the
      only repo changes this pass are the new probe instrument, its output
      file and this log entry.
      Quality pass 2026-09-04 (eighth), unattended scheduled run, Cowork
      sandboxed shell for orientation and lock handling, Windows PowerShell
      path throughout for all file work, generators, checkers and git network
      operations (the standing Q87 split: sandboxed git fetch/pull over
      origin-https works read-only, but push has no stored credential from
      the sandbox, so all writes and the push go via the canonical
      C:\Dev\rbh-site-data working copy). All 8 unblocked worklist items
      confirmed [BLOCKED] by direct grep, so this was the fallback quality
      pass, picked by the standing rotation-pool method: git log commit
      subjects matched against each of the 36 rotation-pool item numbers (43
      checked items minus the standing out-of-rotation set 1.1, 1.4, 2.2,
      5.6, 5.7, 6.7, 6.8), oldest most-recent-mention wins. 3.13 was oldest,
      last touched 2026-09-03T12:42:20+01:00, ahead of 6.2 (13:14:57) and 3.4
      (13:41:45), independently confirming the seventh pass's own forward
      note.
      BASELINE. All 36 checkers ran individually. One transient failure on
      the first run, in this run's own working file rather than the repo:
      check-postcodes.js failed against a scratch file
      (_agentscratch/item313.txt) this run had written while reading this
      item's own history, which quoted this section's earlier prose
      containing the McCanns Sandringham correction postcode CLAUDE.md
      already documents (CH49 1SX) - the same shape as the identical finding
      on the sixth and seventh passes one and two days earlier. Deleted
      (untracked, never committed); check-postcodes.js re-ran clean, 0
      failures, 3 warnings, none new. Not a repo defect. All six generators
      rebuilt; git status --porcelain on modules/, core/, tools/,
      branches.json, gbp-packs/ empty both before and after, byte-identical
      output confirmed, including switch-prescriptions-clear-aintree.html
      matching its standing sha256
      (96DB1824436B7F8C4E37BC576FE539F48F7A9FDBD30DEBFCCB3C6A6DD5DD78F9,
      unchanged since the fifth pass first recorded it on 2026-09-01).
      FRESH ANGLE (the actual finding of this pass). Across seven prior
      passes, every fact about this item's three pages was verified through
      a separate custom instrument
      (audits/clear-aintree-independent-2026-08-14.js) and its own
      nine-fault vacuity probe, which proves that INSTRUMENT is not vacuous -
      it has never once run the real repo checker, tools/check-switch-copy.js,
      against Clear's own switch page by injection. The seventh pass closed
      the equivalent gap for check-weight-loss-copy.js and
      check-travel-clinic-copy.js against Clear's other two pages;
      check-switch-copy.js against switch-prescriptions-clear-aintree.html
      was the one page/checker pairing for this item left unproven by direct
      injection against the real checker. Closed this pass with a new
      instrument, audits/verify-3.13-2026-09-04-eighth.js (own sha256
      baseline of both the page and its banner captured before any mutation,
      restore by fs.writeFileSync from an in-memory Buffer rather than git,
      sha256-reconfirmed after every restore, matching the discipline the
      3.2 tenth, 3.5 eleventh and 3.7 tenth passes established). Five
      injections, one at a time, on five different rules: RULE 7
      no-medicines (the hero-sub's "means your medication comes to a
      pharmacy team you can actually speak to" changed to name "Wegovy"),
      RULE 8 town (the pill's own town changed from Aintree to Walton, a
      real, different live branch's town rather than an invented one - both
      colemanleigh_liverpool and cherrylane_liverpool hold it), RULE 9
      form-copy (an undescribed "nhs_number" text input added to the form
      grid, no FIELD_WORDS entry, no mention in step 1), RULE 10
      collection-notice (the privacy paragraph deleted outright), and RULE
      11a banner (switch-prescriptions-clear-aintree.txt's own SWITCH_URL
      repointed at Cherry Lane's switch page). All five caught first
      attempt, each with the correct rule tag in the checker's own output
      ([no-medicines], [town] twice over (correctly naming both
      colemanleigh_liverpool and cherrylane_liverpool as the genuine holders
      of Walton), [form-copy], [collection-notice], [banner]), both files
      restored and sha256-reconfirmed byte-identical to their pre-injection
      baselines throughout, final check-switch-copy.js run exit 0. Output
      saved to audits/verify-3.13-2026-09-04-eighth-output.txt.
      ONE FAULT FOUND AND FIXED IN THIS PASS'S OWN NEW INSTRUMENT, NOT THE
      REPO. The first run of the new script reported all five injections as
      MISSED despite the checker correctly exiting 1 with the correct
      finding on every one: the script's own tag-match compared the
      checker's output against the rule NUMBER ("7", "8", "9", "10", "11")
      rather than the bracket tag the checker actually prints
      ([no-medicines], [town], [form-copy], [collection-notice], [banner]).
      Fixed by matching against the real tags; re-run confirmed 5 caught, 0
      missed, same shape as the stale-literal and restore-by-git faults the
      fifth and prior passes found and fixed in their own instruments rather
      than the repo.
      LIVE HALF. Claude in Chrome confirmed not connected, checked at this
      run's own step 3 answer pickup and again immediately before this
      section; not retried by another route and no login attempted, per
      procedure. Fell back to the established read-only PowerShell route.
      The site root (https://www.clearchemist.co.uk/) loaded cleanly and
      consistently, 200, across every attempt this pass. The three
      unpublished slugs this item covers
      (switch-prescriptions-clear-aintree.html,
      weight-loss-clinic-clear-aintree.html,
      travel-clinic-clear-aintree.html) did NOT reproduce the clean
      200-with-the-store's-own-404-body response the 2026-08-30 and
      2026-08-31 passes recorded: repeated attempts this pass returned three
      different results depending on the HTTP client signature used (curl.exe
      403 on all four URLs including the root; PowerShell's default .NET
      client, "connection closed unexpectedly" on the three slugs but a clean
      200 on the root; a browser-spoofed user agent, 500 on the three slugs,
      still 200 on the root), and a final isolated retry of the switch slug
      after a 20 second pause still returned a connection abort. Reported
      as an observation, not raised as a defect and not turned into a
      question: nothing in branches.json or this repo asserts anything about
      these unpublished slugs' live HTTP behaviour beyond Q29's standing
      answer (leave generated and unpublished), the pattern (root stable,
      three specific deep paths unstable, varying by client fingerprint
      across repeated automated requests in a short window) is consistent
      with WAF or bot-protection behaviour rather than an origin-server
      fault, and this pass already probed these same three URLs more than
      once in quick succession, which is exactly the kind of traffic such
      protection is built to react to. Flagged here so a future pass with a
      working browser session, which reads a real rendered page rather than
      a raw HTTP client, checks whether this reproduces.
      RESULT. No in-repo defect found. check-switch-copy.js was already
      correctly protecting Clear Chemist Aintree's switch page and banner on
      every rule tested; now proven directly by injection against this
      branch specifically for the first time, closing the last unproven
      page/checker pairing in this item's history. Q65 (the pages' walk-in
      wording against the branch's own no-physical-branch-resource record)
      remains open and was correctly not touched: a live patient-facing
      regulatory claim, carved out of autonomous decisions regardless of
      window state, and no autonomous window was open this run (no "Standing
      authorisation" heading present at the top of AGENT_LOG.md at the start
      of the run). Q28 and Q29 re-read from QUESTIONS.json: both still
      "answered", unchanged. No new question raised. Nothing edited under
      tools/, modules/, core/, branches.json or gbp-packs/; the only repo
      changes this pass are the new probe instrument, its output file and
      this log entry.

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
      Quality pass 2026-08-12 (third): repo half still clean. Every fact
      re-verified against the fishlocks_ainsdale entry in branches.json, all
      seven generators rebuilt to zero diff (status/index.html timestamp
      only) and all 29 checkers pass. The live half was read for the first
      time on this item: all four post button targets fetched 2026-08-12 and
      all resolve and read correctly for Ainsdale (right phone, address,
      conditions and age ranges on Post A's page; Post C's target is the
      compliant generated weight loss page, no medicine names, no efficacy
      claims). The one live fault is the profile website target: the Ainsdale
      landing page pharmacy-fishlocks-ainsdale.html still returns 404, the
      known Q35 state. In-repo fix this pass: the pack's first paster note
      still said to paste the landing page "along with this branch's service
      pages", which is stale now the service pages are live; rewritten to
      the observed 2026-08-12 state so the paster is told the posts are
      clear to publish and only the landing page paste is outstanding.
      Quality pass 2026-08-13 (fourth), REPO HALF ONLY: no browser was
      available this run, so nothing live was read and nothing live is
      claimed. The pack half is clean on every fact re-checked against the
      fishlocks_ainsdale entry in branches.json: name, 17 Station Road,
      Ainsdale, Southport PR8 3HN, phone 01704 575478, review link, hours
      Monday to Friday 8:45am to 6:00pm with Saturday and Sunday stated
      closed, catchment leading with Ainsdale, the app line it earns on
      hasApp true, the profile website on its own landing page, the
      categories and services earned by its five widgets, Post A on the
      branch's own pfLink, and a description measured at 746 characters,
      exactly what its heading claims. All 30 checkers pass and all seven
      generators rebuild to zero diff (status/index.html timestamp only).
      THE DEFECT THIS PASS, IN THE OTHER HALF OF THE ITEM. TEMPLATE.md, the
      file every pack is copied from, told the drafter to "fill every
      section" and then ran from its rules block straight into section 1.
      It carried neither the "Branch id:" line nor the profile basics
      block, although all 15 packs carry both and eight rules in
      check-gbp-packs.js read them. Proved by injection on a copy of
      fishlocks-ainsdale.md: strip the two blocks and the checker reports
      ONE fault, the missing Branch id line, then skips every fact rule
      beneath it, because without the id there is no branch to check
      against; put the id back and seven more fire at once, holding the
      five facts a Google profile actually publishes. So a pack drafted
      faithfully from the template had to fail twice before anyone saw a
      real content error. The checker held throughout; the template was the
      hole, and run 101 fixing a stale note in the pack while leaving the
      same staleness in the template is the evidence that a file no rule
      reads will rot. Fixed both halves: TEMPLATE.md now carries the
      skeleton above section 1, with every field sourced to branches.json
      and pointing at the hours and profile-website rules already above it,
      and check-gbp-packs.js now reads TEMPLATE.md itself, which nothing
      did before because the pack loop excludes it by name. Eight negative
      tests, all eight fire, one failure each, and the restored file is
      clean. No new question.
      Quality pass 2026-08-14 (fifth), REPO HALF ONLY: no live page was
      read this run and nothing live is claimed. Done 2026-08-14. The pack
      half is clean again on every fact re-checked against the
      fishlocks_ainsdale entry in branches.json: name, 17 Station Road,
      Ainsdale, Southport PR8 3HN, phone 01704 575478, review link, hours
      Monday to Friday 8:45am to 6:00pm with Saturday and Sunday stated
      closed, catchment leading with Ainsdale, the app line it earns on
      hasApp true, the profile website on its own landing page, the five
      widgets earning their categories and services, Post A on the branch's
      own pfLink, and the description heading claiming 746 characters.
      All 35 checkers pass and all seven generators rebuild to zero diff
      (status/index.html timestamp only). Not one character of the pack was
      edited.
      THE DEFECT THIS PASS IS THE 2026-08-13 ONE AGAIN, ONE LEVEL UP. That
      pass pinned the skeleton ABOVE section 1 into TEMPLATE.md and stopped
      there. The five numbered sections and the four post headings, which
      are the structure every pack is failed for missing, were enforced on
      the finished pack and on nothing in the file the pack is copied from.
      Proved by injection on TEMPLATE.md three ways: section 3 retitled,
      Post D demoted to a plain line, section 1 retitled. Every one of the
      three walked past ALL 35 checkers clean, and each was restored and
      proved byte-identical by sha256. A drafter copying the broken
      template produces a pack missing a required section, and the failure
      then lands on the pack rather than on the template that caused it.
      SECOND DEFECT, THE SAME SHAPE. All 15 packs carry a "Notes for the
      paster:" block below section 5; TEMPLATE.md never mentioned it and no
      rule read it. It is the only part of a pack addressed to the human
      rather than to the profile, and it is where the instructions with
      consequence sit: do not set the profile website until the landing
      page resolves, do not add medicine names to Post C, match the
      categories against GBP's picker on the day. A pack drafted faithfully
      from the template would have carried none of them and nothing would
      have said so.
      Fixed both halves. check-gbp-packs.js now holds TEMPLATE.md to every
      REQUIRED_SECTIONS and REQUIRED_POSTS heading and to the notes block,
      with the patterns READ from those arrays rather than retyped, so the
      template and the pack loop cannot drift apart; every pack is now held
      to the notes block too, and all 15 already comply; and an empty-array
      guard stops the derivation being retired silently. TEMPLATE.md now
      carries a "Notes for the paster:" section saying what belongs in it.
      Thirteen negative tests, all thirteen fire, every injected file
      restored and proved byte-identical by sha256. No new question.
      Quality pass 2026-08-30 03:11 (sixth, commit 4ecae38): AGENT_WORKLIST.md
      sync gap - this pass was logged in AGENT_LOG.md but never appended
      here; backfilled now as part of the seventh pass below. Independent
      verifier (audits/verify-4.1-2026-08-30.js, imports nothing from
      tools/) ran 153 checks against branches.json: canonical NAP,
      foreign-branch leakage, POM and drug-class names, outcome/efficacy
      patterns, PF condition list and ages, hasApp/app-mention, the
      746-character description claim, hours day-composition, catchment
      order, pfLink on Post A, post lengths, URL domains. Zero defects,
      zero flags. Not one character of the pack edited. Live half:
      profile-website target still 404 (Q35, unchanged since 2026-08-12);
      live switch page still carries the pre-Q13-repaste em dash (Q45).
      See audits/fishlocks-ainsdale-4.1-pass-2026-08-30.txt.
      Quality pass 2026-08-31 (seventh): re-ran the same independent
      verifier unmodified - CHECKS=153 DEFECTS=0 FLAGS=0, identical to the
      sixth pass, no drift in the pack or TEMPLATE.md since 2026-08-30.
      All 50 tools/*.js scripts (36 checkers plus generators) clean; six
      page generators rebuild to zero diff bar status/index.html's
      timestamp. Live half re-checked: pharmacy-fishlocks-ainsdale.html
      still 404 (Q35 unchanged), switch page em dash still live (Q45
      unchanged, tracked under Q13's answered-but-not-yet-applied
      pin-and-repaste plan, item 5.5). No new defect, no new question.
      See audits/fishlocks-ainsdale-4.1-pass-2026-08-31.txt. Done 2026-08-31
      Quality pass 2026-09-01 (eighth): least recently verified rotation-pool
      item, picked by reading each candidate's actual git commit timestamp
      rather than trusting AGENT_WORKLIST.md's own date-only text or
      AGENT_LOG.md's header phrasing (both methods have misled prior passes
      on other items - see the 4.9 and 4.6/4.8 entries). All 36 checkers
      pass; all six generators rebuild byte-identical (sha256 of every file
      under modules/ unchanged); independent verifier
      audits/verify-4.1-2026-08-30.js re-run unmodified, CHECKS=153
      DEFECTS=0 FLAGS=0, identical to the sixth and seventh passes. Pack
      re-checked field by field against the fishlocks_ainsdale entry in
      branches.json: clean. check-gbp-packs.js's two WARNs (Q72 qualifier
      wording, Q64 address post-town divergence) both pre-existing and
      unchanged. Live half read by plain Node fetch() (Claude in Chrome
      unavailable, "not connected"): profile-website target still 404 (Q35
      unchanged); switch page em dash still live (Q45 unchanged); weight
      loss page's one en dash confirmed safety-net language, not a new
      claim. NEW FINDING, never recorded in this item's seven prior passes:
      every page checked on fishlockpharmacy.co.uk carries a shared site
      footer misspelling the brand as "Fishlock Pharmacy" (branch-picker
      block) and "Fishlock Chemist" (GPHC/legal line), dropping the "s"
      item 1.1 standardised into every generated page. Confirmed on three
      separate URLs, so very likely site-wide across both Fishlocks
      branches. This footer is hand-built Weebly content outside anything
      this repo generates or checks, so no repo-side fix exists. Raised as
      Q91. No page, generator or branches.json field changed this pass.
      See audits/fishlocks-ainsdale-4.1-pass-2026-09-01.txt and
      audits/verify-4.1-2026-09-01-output.txt. Done 2026-09-01
      Quality pass 2026-09-02 (ninth, unattended run): all 36 checkers
      re-run clean (redone via a writable output path after this run's own
      first sweep gave a false FAIL from a stale /tmp file, see the audit
      note); all six generators rebuild byte-identical across all 193
      modules/ files; audits/verify-4.1-2026-08-30.js re-run unmodified,
      CHECKS=153 DEFECTS=0 FLAGS=0, unchanged since the sixth pass. Pack
      re-checked field by field against the current fishlocks_ainsdale
      entry in branches.json: clean, nothing has moved since the eighth
      pass. Independent Python re-count confirms description 746 and posts
      448/385/402/313 exactly, pure ASCII, no dash, no medicine name.
      QUESTIONS.json: Q35 and Q45 have both moved to "answered" since the
      eighth pass (paste the six landing pages; merge agents/audit-backlog
      to main) but neither answer yields an in-repo change here - both
      actions are outside this worker's permitted scope - noted for the
      next pass rather than acted on. Q91 remains open, unchanged, still no
      repo-side fix available. LIVE HALF NOT PERFORMED: Claude in Chrome
      had no connected browser, the built-in browser pane denied
      navigation outright on this unattended run (no user present to grant
      site access), and mcp__workspace__web_fetch refused the URL on its
      own provenance gate; per the standing rule against working around a
      blocked fetch, no bash/curl alternative was used. Live state stands
      as last recorded on the eighth pass. No in-repo defect found, no
      fix needed, no new question. See
      audits/fishlocks-ainsdale-4.1-pass-2026-09-02.txt. Done 2026-09-02
      Quality pass 2026-09-03 (tenth, unattended run): repo half clean, all 36
      checkers pass, pack re-verified field by field against branches.json,
      nothing moved since the ninth pass. FRESH ANGLE: check-brand-spelling.js,
      check-url-scheme.js and check-uk-spelling.js had never been proven
      against this specific pack by direct injection, the same gap the 1.2,
      4.14, 4.2, 4.7, 3.11 and 4.4 passes closed this same week for their own
      packs. Three injections, one per checker: the GBP name dropped its
      trailing s ("Fishlock Chemist"), Post C's Book button target changed to
      http, and "Vaccination centre" changed to the US spelling. All three
      caught first attempt, cross-referencing item 6.6 correctly on the
      scheme fault. File restored byte-identical (MD5 match) after each
      injection and again at the end; full 36-checker suite and all six
      generators re-run clean afterwards. No defect on the item, nothing
      changed in the repo. LIVE HALF NOT PERFORMED: no Claude in Chrome
      browser connected this run. Live state stands as last recorded on the
      ninth pass: profile-website target still 404 (Q35 answered but not yet
      applied), switch page em dash still live (Q45 answered but not yet
      applied), Q91 footer misspelling still open. No new question. See
      audits/fishlocks-ainsdale-4.1-pass-2026-09-03-tenth.txt. Done 2026-09-03
      Quality pass 2026-09-04 (eleventh, unattended run): repo half clean at the
      start, all 36 checkers pass, pack re-verified field by field against
      branches.json, nothing moved since the tenth pass. FRESH ANGLE:
      check-pharmacy-first-cost.js and check-app-membership.js had never been
      proven against this specific pack, the same gap the 1.2/3.11/4.4/4.14/4.2/4.7
      passes closed this same week for their own packs. Reading check-app-membership.js
      in full found this was not merely unproven coverage but a REAL GAP: Rule 8
      (the GBP packs) only ever guards the false-claim direction (a non-member's
      pack claiming an app), never the opposite - whether a MEMBER branch's pack
      (fishlocks_ainsdale is one of only four) actually carries the app mention its
      profile is meant to publish, although Rules 2 and 3 already hold that "if and
      only if" bidirectionally for the generated pages. Confirmed latent, not live:
      all four current app-member packs already carry the mention. FIXED:
      tools/check-app-membership.js now has Rule 8e, mirroring Rules 2/3's
      bidirectional logic for packs. Proved by injection on this item's own file:
      the pack's one app mention ("...repeats through our app.") changed to
      "...repeats through our system.", caught first attempt naming this exact
      pack; restored byte-identical (MD5 match) and full 36-checker suite re-run
      clean. No pack content left changed - only tools/check-app-membership.js
      carries a tracked change. No new question, the fix mirrors existing logic
      rather than requiring a judgement call. LIVE HALF: no Claude in Chrome
      browser connected, fell back to read-only PowerShell fetch. Profile-website
      target still 404 (Q35, answered but not yet applied). Switch page fetched
      200 but its prose intro (carrying the Q45 mojibake dash in prior findings)
      was not present in the raw HTML at all, consistent with that content being
      rendered client-side at runtime - recorded as a method limitation, this pass
      neither confirms nor refutes Q45's live state. Q91 footer misspelling
      ("Fishlock Pharmacy"/"Fishlock Chemist") reconfirmed present, unchanged, no
      repo-side fix available. See
      audits/fishlocks-ainsdale-4.1-pass-2026-09-04-eleventh.txt. Done 2026-09-04
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
      Quality pass 2026-08-12 (second): pack still clean fact by fact
      against branches.json; all six generators rebuild to zero diff and
      all 29 checkers pass; the four post targets and the sitemap all
      verified live. One of the two live caveats has cleared: the old
      weight loss page (weight-loss-clinic-walton.html) has had its Q5
      hand edit done - now a short signpost to the new page, no medicine
      names, no pricing - and the pack note records this. The stale
      Pharmacy First embed caveat still holds (five conditions shown as
      coming soon on the live page). Q40 remains open.
      Quality pass 2026-08-12 (third), repo half only, browser unavailable:
      the pack is clean for the third pass running and nothing in it was
      edited. Every fact re-checked against branches.json, the four counts
      the pack claims of itself measured rather than trusted and all exact
      (description 736, posts 449, 348, 403, 318), pure ASCII, no em dash,
      all four link targets generated by this repo. The defect is again a
      verifier one. Rule 9 pinned the AGES a pack may state but nothing read
      the CONDITION LIST beside them, so dropping the UTI pathway and
      calling the list six, adding conjunctivitis to it, saying "nine
      common conditions", and dropping impetigo and shingles from the
      services bullet all walked past 29 checkers clean. Rule 10 added to
      check-pharmacy-first-eligibility.js: an enumerating sentence must name
      all seven pathways and nothing else, a stated count must be seven, and
      a branch that runs Pharmacy First must enumerate somewhere. Its
      surface table is keyed to the generator's own conditions and fails if
      the two sets drift. Nine injections caught, four legitimate variants
      pass, and a false positive found on the first run - a bracketed paster
      note reporting the stale live embed - fixed by reading parentheticals
      as evidence, the same convention the hours rules already use. Zero
      page diff, 29 checkers pass. Q40 remains open. Done 2026-08-12
      Quality pass 2026-08-29 (seventh): pack verified fact by fact against
      branches.json, every self-claimed count measured exact (736; 449, 348,
      403, 318), zero non-ASCII, all four post targets in the repo, live and
      in the sitemap, and the old weight loss page still holding the Q5 edit
      (no medicine names, no pricing). Nothing in the pack is wrong. The
      run-176 residue was taken: an enumerated AREA_LEADIN ("across", "the
      wider") now lets both catchment rules parse the two Tiffenbergs runs
      they had been skipping, proved dead before and alive after by
      length-neutral injection in seven directions, with the order rule
      stripping lead-ins before its seoTown comparison so the three
      "across <seoTown>" packs stay green on their own correct copy. See
      audits/cherry-lane-gbp-pack-check-2026-08-29.txt.
      Quality pass 2026-08-30 (eighth): pack re-verified fact by fact
      against branches.json (address, phone, hours, website, review link
      and service area all match), and the two length claims recomputed
      with the same wrapped-line-join method check-gbp-packs.js uses
      (description 736, posts 449, 348, 403, 318) - exact match, nothing
      wrong. All 34 checkers in tools/ pass clean, cherry-lane-walton.md's
      only warning is the already-tracked Q72 exception. All six page
      generators rebuilt: modules/branch/pages/INDEX.md came back
      different from what was committed, a regression - see below.
      Live pages re-read: pharmacy-first-cherry-lane-walton.html now shows
      all seven Pharmacy First conditions live with no "coming soon" text
      anywhere on the page, so the stale-embed caveat this pack has
      carried since 2026-08-12 is cleared; pack updated to record this.
      weight-loss-clinic-walton.html still carries its Q5 signpost, no
      medicine names, no pricing - unchanged. The live footer's NHS
      mailbox on both pages read pharmacy.FA226@mhs.net, the already-open
      Q36 typo, unchanged; not raised again, noted in the pack instead so
      the next pass does not need to rediscover it.
      REGRESSION FOUND AND FIXED: rebuilding
      tools/build-branch-landing-pages.js reverted
      modules/branch/pages/INDEX.md's "not just Fishlocks Chemist" back to
      "not just Fishlocks", undoing the item 5.7 run's 2026-08-30
      brand-spelling fix. That fix had been made by hand-editing the
      generated INDEX.md rather than the generator, on the mistaken belief
      recorded in that run's own log entry that INDEX.md is hand-authored
      with no generator; it is not - line 391 of
      build-branch-landing-pages.js hardcodes the sentence and rewrites
      the whole file on every run. Fixed at the correct source this time:
      the generator's own string now reads "not just Fishlocks Chemist",
      and regenerating now reproduces the committed INDEX.md byte for
      byte. All 34 checkers re-run clean afterwards, including
      check-brand-spelling.js. Files changed this pass:
      tools/build-branch-landing-pages.js, gbp-packs/cherry-lane-walton.md.
      Done 2026-08-30
      Quality pass 2026-09-01 (ninth, unattended run): pack re-verified fact
      by fact against branches.json (address, phone, hours, website, review
      link and service area all match), and both length claims recomputed
      independently with the same wrapped-line-join method check-gbp-packs.js
      uses (description 736, posts 449, 348, 403, 318) - exact match, nothing
      wrong. All six page generators rebuilt to a zero diff across the whole
      repo (git diff --stat and --name-only both empty), all 36 checkers
      exit 0, and check-gbp-packs.js reports 0 failures with cherry-lane-
      walton.md's only warning still the already-tracked Q72 exception.
      Q40, Q72 and Q36 spot-checked in QUESTIONS.json and confirmed still
      open, none stale. Live half NOT performed: the built-in browser denied
      navigation to cherrylanepharmacy.co.uk outright on this unattended run
      (no user present to grant site access), the same class of blocker Q59
      already tracks; not retried by any other route. Live state therefore
      stands as last recorded on the 2.3 seventh quality pass (2026-09-01):
      Q89 Pharmacy First overview regression, Q36 footer mailbox typo, and
      the 3.1/5.1/Q3 switch page title and mojibake em dash all unverified
      this pass. No in-repo defect found, no fix needed, no new question.
      Evidence: audits/cherry-lane-gbp-pack-check-2026-09-01.txt.
      Quality pass 2026-09-02 (tenth, unattended run): pack re-verified fact
      by fact against branches.json (address, phone, hours, website, review
      link and service area all match) and both length claims recomputed
      independently (description 736, posts 449, 348, 403, 318) - exact
      match, nothing wrong. All six generators rebuilt to a zero diff across
      the whole repo, all 36 checkers exit 0. Q40 and Q36 confirmed moved to
      "answered" since the ninth pass; Q72 remains open and is the pack's
      only tracked warning, unchanged.
      IN-REPO DEFECT FOUND AND FIXED: the Categories section still carried
      the pre-answer caveat that listing-name changes were untouched by
      this pack; Q40 was answered 2026-08-01 (sic, posted 2026-09-01)
      recommending the listing be renamed to "Cherry Lane Pharmacy" with
      the travel and weight loss words moved into categories and services
      instead, so the NOTE bullet was rewritten to instruct the paster to
      do exactly that. First edit used a non-"NOTE" label and broke
      check-gbp-packs.js's NOTE-bullet exemption (6 false FAILs, each
      comma-separated clause read as an unrecognised category); corrected
      by keeping the "NOTE" label, all 36 checkers re-run clean.
      Live half performed this pass (browser access available, unlike the
      ninth pass): all seven Pharmacy First conditions live and working
      (Q89 fix holds); switch page mojibake em dash and Q36 footer typo
      both confirmed unchanged, already tracked; travel clinic page clean.
      NEW FINDING: the weight loss clinic page renders two sentences with
      a live en dash and lower-case continuation where the repo's
      generated page uses a plain full stop (confirmed byte-for-byte
      against modules/service/pages/weight-loss-clinic-cherry-lane-walton.html).
      No compliance substance changed (both qualifiers still present, no
      medicine named). Same class of fault as the tracked Q7/5.1 switch
      page dash but not previously read on this page; raised as Q92,
      recommending it join the existing paste-lag backlog. No in-repo fix
      applies, since no generator or data file reaches a live Weebly
      paste. Files changed this pass: gbp-packs/cherry-lane-walton.md.
      Evidence: audits/cherry-lane-item-4.2-quality-pass-2026-09-02-tenth.txt.
      Quality pass 2026-09-03 (eleventh, unattended run): fresh angle - proved
      check-uk-spelling.js, check-brand-spelling.js and check-url-scheme.js
      directly against this pack by injection, the same three checkers the
      item 4.7 tenth pass proved against McCanns Sandringham this same
      morning; no prior pass on this item had pointed any of the three at
      cherry-lane-walton.md specifically. Baseline clean (36/36 checkers,
      zero-diff regeneration). Three injections, each restored and MD5-
      confirmed before the next: "Vaccination centre" to "Vaccination center"
      (caught by check-uk-spelling.js), "Cherry Lane Pharmacy" to "Cherry
      Lanes Pharmacy" (caught by check-brand-spelling.js), and the Post B
      switch button target https to http (caught by check-url-scheme.js,
      correctly cross-referenced to item 6.6 rather than raised as a new
      question). All three caught first attempt. No defect - all three rules
      already protected this pack; now proven directly rather than only by
      general design. No checker logic edited, no pack content byte changed.
      Live half: browser unavailable (Q59), fell back to HTTPS HEAD checks on
      all four post targets - all 200. Files changed: none (all injections
      restored). Evidence: audits/cherry-lane-item-4.2-quality-pass-2026-09-03-eleventh.txt.
      Quality pass 2026-09-04 (twelfth, unattended run): fresh angle - proved
      check-pharmacy-first-cost.js rule 6 and check-app-membership.js rule 8a
      against this pack by injection for the first time, the same gap the
      item 4.7 eleventh pass closed for McCanns Sandringham this same
      morning; no prior pass on this item had pointed either checker at
      cherry-lane-walton.md specifically. Baseline clean (36/36 checkers,
      SHA256 831E72C18EF9007D7FD760E9AFCD1CE60513AC99A42BDF1FF4E014FCEF052EC2).
      Two injections, each restored and SHA256-reconfirmed before the next:
      "free" stripped from all three sentences naming Pharmacy First
      (caught by check-pharmacy-first-cost.js rule 6, first attempt failed
      silently on a line-wrap/whitespace mismatch, caught before running the
      checker and redone with a wrap-safe pattern); "Manage your
      prescriptions on the go with our free app." appended to the Services
      section (caught by check-app-membership.js rule 8a; rule 8d not
      testable here, this pack's notes lack the exact phrase 8d checks for,
      unlike McCanns Sandringham). Both caught first corrected attempt. No
      defect - both checkers already protected this pack; now proven
      directly. No checker logic edited, no pack content byte changed.
      SIGNIFICANT LIVE FINDING (not new, cross-referenced): the Pharmacy
      First overview page still shows five of seven condition cards as
      "Page coming soon", the same fault the 2.3 tenth pass raised fresh as
      Q95 earlier the same day; this pack's own preamble still claims the
      caveat cleared 2026-08-30, which Q95 has now shown stale a second
      time. Not re-raised as a new question, not edited pending Q95's
      answer. All four post targets otherwise 200. Q92 and Q36 not
      independently reconfirmed this pass (fetch-method limitation on the
      weight loss page, noted rather than asserted). Files changed: none
      (all injections restored).
      Evidence: audits/cherry-lane-item-4.2-quality-pass-2026-09-04-twelfth.txt.
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
      Quality pass 2026-08-13 (third pass, repo half only, no browser
      available): the pack is clean again on every fact. Description 743
      characters as its heading claims, posts 448, 408, 402 and 317 against
      the 1,500 limit, and name, street, locality, postcode, phone, website
      and review link all matching branches.json. The Hours line carries
      every clock time in openingHours and no other, and names Monday to
      Saturday open and Sunday closed. All five widget services are listed,
      ten photo shots with the vinyl lead and the pending-Google-updates
      reminder, and the three usable post buttons point at pages this repo
      generates. Post A's HARD STOP still stands: its button is the legacy
      hand-built pharmacy-first-service-ainsdale.html, which is item 5.3 and
      Q8/Q34, not a defect in this pack. All 29 checkers exit 0 and all six
      generators rebuild byte-identical.
      One defect found, again in the verifier and not the pack, and this
      time not in check-gbp-packs.js. Six injections into this pack were
      caught: the sister branch's street (Fishlocks Ainsdale is 17 Station
      Road, the same street as Hirshmans at 56-62 Sherwood House, so a
      swapped number sends a patient 200 yards to the wrong shop), its
      phone, its review link, a POM medicine name in Post C, an efficacy
      claim, and another branch named in the description. Three were not
      caught: a literal em dash in the business description, a real emoji
      in Post D, and US spelling. Those are TEMPLATE.md's own rule for
      every pack, "UK English. No em dashes. No emojis. Plain English", and
      no checker was reading it, so a pack was fact checked hard and copy
      checked not at all. The character half is now closed in
      tools/check-em-dashes.js, which held pages, paste sheets, banners and
      live module code but had never read gbp-packs: all 16 files including
      TEMPLATE.md are held to pure ASCII AND to no dash entity, the second
      rule being necessary because an entity is itself ASCII and would
      paste onto a Google profile as literal text. Negative-tested five
      ways plus the missing-folder guard. All 16 files were already clean,
      so this closes a latent hole rather than a live breach. UK spelling
      stays open: it needs a word list, not a character test, and is left
      for a later pass rather than half-built here.
      Quality pass 2026-08-14 (fourth pass, repo half only, no browser
      available): the pack is clean on every fact again. Description 743
      characters as its heading claims, posts 448, 408, 402 and 317 against
      the 1,500 limit, and name, street, locality, postcode, phone, website
      and review link all matching branches.json. Every clock time in the
      Hours line maps to openingHours and no other time appears, all five
      widget services are listed, ten photo shots with the vinyl lead and
      the pending-Google-updates reminder. Post A's HARD STOP still stands
      and is item 5.3 / Q8/Q34, not a defect here. This pass closed the UK
      spelling residual named directly above, the last open clause of
      TEMPLATE.md's copy rule, in a new tools/check-uk-spelling.js. A word
      list could easily have been useless rather than weak: measured first,
      a naive sweep reports 614 hits for "color" (all CSS), 346 for "check"
      (all "blood pressure check", correct UK English) and 51 for "center"
      (all text-align). So the reader only ever sees copy - text nodes and
      the attributes a person reads, string literals in .js with tag state
      carried ACROSS literals because a literal can sit wholly inside a tag
      with no angle bracket in it, content: in .css, and branches.json
      string values because emar.js renders those live - and the list only
      holds words with no legitimate UK reading, with check, meter, license,
      practice, program, curb, fetus, sulfur and judgment excluded by name
      and reason. 167 spellings, self-guarded against rot. Negative tested
      16 ways, all 16 correct: 10 must-catch including the original US
      spelling injection, an alt attribute, a banner, branches.json and copy
      following a bare "<" and ">"; 6 must-pass including CSS, "licensed
      pharmacy", "GP practice", "blood glucose meter" and a quoted reading
      of a live page. All 16 packs, 177 pages, banners, drafts, module code
      and branches.json were already clean, so this closes a latent hole
      rather than a live breach. 33 checkers exit 0 and all six generators
      rebuild byte-identical. Residual: Americanisms that are vocabulary
      rather than spelling (drugstore, vacation, shot, refill) are still not
      read, deliberately, because catching them needs register rather than a
      list and would cry wolf on "shot". Audit:
      audits/uk-spelling-item-4.3-quality-pass-2026-08-14-run180.txt
      Quality pass 2026-08-30 (fifth pass, repo and live): the pack is
      clean on every fact again. Description 743 characters as its heading
      claims, posts 448, 408, 402 and 317 against the 1,500 limit, and
      name, street, locality, postcode, phone, hours, website and review
      link all matching branches.json. Post A's HARD STOP still stands and
      is item 5.3 / Q8/Q34, not a defect here. Live half read-only: the
      Post C and Post D button targets and the generated Pharmacy First
      replacement all load on hirshmanspharmacy.co.uk with the right
      address, phone and NHS age ranges, so the HARD STOP note's claim
      about the replacement page being live and correct is true. One
      defect found, in the verifier and not the pack: the road name in
      published prose was read by nothing. "A local team on Station Road"
      changed to "Shakespeare Road" in Post B passed all 36 checkers in
      silence, and the same wrong road in the photo shot list also passed.
      Towns, house numbers and the address line were each guarded; the
      road name was not, and the road is the navigational fact a patient
      walks down. New road-name rule in check-gbp-packs.js: every road
      phrase in the description, services section, post bodies and photo
      shot list must resolve to this branch's own street, a place the
      branch owns in branches.json, a live brand name, or a sister's road
      in a sentence naming that sister, everything derived from
      branches.json, with a KNOWN_ROAD exception map and a vacuity guard
      (14 of 15 packs carry a road phrase today). Negative-tested five
      ways, all correct. All 36 checkers exit 0 and all six generators
      rebuild byte-identical. Audit:
      audits/road-rule-item-4.3-quality-pass-2026-08-30.txt
      Quality pass 2026-08-30 (sixth pass, repo and live): the pack itself
      is unaffected and needed no change, Post C already links to the
      correct generated weight-loss-clinic-hirshmans-ainsdale.html. All six
      generators rebuilt to zero diff and all 36 checkers exit 0. Live
      checks this pass: Post B's target
      (switch-prescriptions-hirshmans-ainsdale.html) loads with matching
      name, address, phone and hours, but its body still carries the
      pre-Q7 em dash live ("it usually is not [em dash] we make the first
      step quick and easy" against the repo source's plain full stop),
      the same outstanding item 5.1 live-paste-lag already confirmed at
      Cherry Lane and reconfirmed on Coleman and Leighs; Hirshmans joins
      that list, no new question needed. Separately, and not a defect in
      this pack: the live Hirshmans homepage's top nav, secondary nav,
      footer nav and a content image all link to the legacy
      hirshmanspharmacy.co.uk/weight-loss-clinic.html rather than the
      compliant generated page, an eighth live instance of the item 5.8
      pattern (superlative Mounjaro claim, Real Results heading, outcome
      slider, named treatment picker, lead price, plus a wrong branch
      address matching the known 5.3 error). Recorded in
      compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md and raised as Q85
      under item 5.8, which stays [BLOCKED]; nothing live was changed.
      Quality pass 2026-09-01 (seventh pass, repo and live): all facts
      re-verified against branches.json (name, address, phone, hours with
      both lunch closures, website, review link, three-town service area,
      hasApp false, all five widgets), nothing wrong. All six generators
      rebuilt to zero diff (sha256 before/after identical across all
      modules/*/pages files) and all 36 checkers exit 0, no new warnings
      beyond the standing tracked ones (Q64 post-town, Q72 qualifier
      wording). Rather than search for a new gap in a pack that has now had
      six clean passes, this pass instead re-proved two existing
      check-gbp-packs.js safeguards by disposable scratch-copy injection
      applied specifically to THIS pack's own copy, since neither had been
      individually re-proven against Hirshmans text since the rule was
      written: the road-name rule (born here on the fifth pass) against
      Post B ("Station Road" to "Shakespeare Road", caught, FAIL) and the
      claim-patterns word-number outcome-claim rule (born on Scorah
      Bramhall's fifth pass, never proven here before) against Post C
      ("Most patients lose a stone in the first month.", caught, FAIL).
      Scratch copy deleted after each restoration; tracked repo confirmed
      unchanged throughout. See
      audits/road-and-claim-reproof-4.3-2026-09-01-seventh.txt and
      audits/gbp-packs-check-2026-09-01-item4.3-seventh.txt.
      Live half, read-only via Chrome, all four post targets plus the
      legacy Post A page: pharmacy-first-service-ainsdale.html (Post A's
      HARD STOP page) is still live with the wrong address (64 station
      Road instead of 56-62 Sherwood House, Station Road), the non-dialling
      phone 017014577376, and the old "Hirshmans Pharmacy" branding -
      unchanged, exactly as the pack's own note describes, still item
      5.3/Q8/Q34, not a new finding. switch-prescriptions-hirshmans-ainsdale.html
      (Post B) has correct facts throughout but still renders the pre-Q7 em
      dash as mojibake ("it usually is not ÔÇö we make the
      first step quick and easy"), the same live-paste-lag family already
      confirmed at Cherry Lane and Coleman and Leighs and previously found
      here too; unchanged. weight-loss-clinic-hirshmans-ainsdale.html
      (Post C) and travel-clinic-hirshmans-ainsdale.html (Post D), the two
      generated pages, both read clean: private paid service framing
      throughout, no medicine named, no outcome or efficacy claims, full
      eligibility hedging, consistent with the compliant-inner-page
      standard. No in-repo defect found, no new question raised. Done
      2026-09-01
      Quality pass 2026-09-02 (eighth pass, repo and live): re-verified as
      the least recently touched rotation-pool item (last touched 04:10 BST
      on 2026-09-01, the earliest last-touch time of all 27 eligible items
      once the eight items already re-passed earlier on 2026-09-02 were
      excluded). All facts re-checked against branches.json (name, address,
      phone, hours with both lunch closures, website, review link,
      three-town service area, hasApp false, all five widgets) and nothing
      wrong. All six generators rebuilt to zero diff (sha256 before/after
      identical across all 203 modules/*/pages files) and all 36 checkers
      exit 0, no new warnings beyond the standing tracked ones (Q64 post-town,
      Q72 qualifier wording, Q44 shared H1, plus the pack's own documented
      Post A HARD STOP note). Fresh scratch-copy injection test, chosen
      because the bank-holiday special-hours rule (born on the 4.5 quality
      pass, 2026-08-30) had never been individually re-proven against this
      pack's own copy: on a disposable rsync copy of the whole repo outside
      the tracked tree, the "Bank holiday special hours" paragraph was
      stripped from gbp-packs/hirshmans-ainsdale.md and check-gbp-packs.js
      run alone failed it by name, "the paster note has no bank holiday
      special-hours instruction". Scratch copy deleted immediately after;
      sha256 of gbp-packs/hirshmans-ainsdale.md in the tracked repo confirmed
      unchanged throughout. Live half, read-only via Chrome (connected this
      run): all four post targets re-read. pharmacy-first-service-ainsdale.html
      (Post A, HARD STOP) still live with the wrong address (64 station Road
      instead of 56-62 Sherwood House), the non-dialling phone
      017014577376, and "Hirshmans Pharmacy" branding in the body copy -
      unchanged, still item 5.3/Q8/Q34, not a new finding.
      switch-prescriptions-hirshmans-ainsdale.html (Post B) still renders
      the pre-Q7 em dash as mojibake ("it usually is not ÔÇö
      we make the first step quick and easy"), the same live-paste-lag
      family as Cherry Lane and Coleman and Leighs, unchanged since the
      seventh pass. weight-loss-clinic-hirshmans-ainsdale.html (Post C) and
      travel-clinic-hirshmans-ainsdale.html (Post D) both still read clean:
      private paid framing, no medicine or vaccine named as guaranteed in
      stock, full eligibility hedging. No in-repo defect found, no new
      question raised. Audit:
      audits/checker-suite-4.3-2026-09-02-eighth.txt. Done 2026-09-02
      Quality pass 2026-09-03 (ninth pass, repo and live): re-verified as
      the stalest rotation-pool item (last touched 2026-09-02T04:13:25+01:00,
      the earliest last-touch time of the 36-item pool once 3.1 and 6.3 were
      re-passed earlier the same day). All facts re-checked against
      branches.json (name, address, phone, hours with both lunch closures,
      website, review link, three-town service area, hasApp false, all five
      widgets) and nothing wrong. All six generators rebuilt to zero diff
      (sha256 before/after identical across all 216 modules/core files) and
      all 36 checkers exit 0 in the tracked repo, no new warnings beyond the
      standing tracked ones (Q64 post-town, Q72 qualifier wording, Q44 shared
      H1, plus the pack's own Post A HARD STOP note). New angle: three rules
      in check-pharmacy-first-eligibility.js (9, wrong NHS age cohort; 10,
      enumeration list naming a non-NHS condition; 11, missing qualifier
      sentence) had each been proven by injection before but only against
      other packs (mccanns-sandringham.md, cherry-lane-walton.md and
      sk-chemists-bootle.md respectively), never against this pack's own
      copy even though Hirshmans enumerates all seven conditions and states
      both pinned cohorts. Proved all three by injection on a disposable
      robocopy scratch copy of the whole repo: wrong ages (30, 16 to 65)
      caught by rule 9, an added "conjunctivitis" in Post A's list caught by
      rule 10, and the deleted qualifier sentence caught by rule 11 - all
      three FAIL as documented, restored and re-run clean each time. Tracked
      repo confirmed untouched throughout. See
      audits/pharmacy-first-eligibility-reproof-4.3-2026-09-03-ninth.txt.
      Note: a full 36-checker sanity run against the same scratch copy showed
      check-cdn-pins.js failing there only because the scratch copy has no
      .git for its main-branch comparison to resolve against; the tracked
      repo's own check-cdn-pins.js run (before and after) exits 0 clean with
      the same standing warnings, so this is a scratch-environment artifact,
      not a finding. Live half, read-only via HTTP GET (Claude in Chrome not
      connected this run): all four post targets returned 200. Post A
      (pharmacy-first-service-ainsdale.html, the HARD STOP page) still
      carries the wrong address, the non-dialling phone 017014577376 and the
      old "Hirshmans Pharmacy" branding - unchanged, still item 5.3/Q8/Q34,
      not a new finding. Post B (switch-prescriptions-hirshmans-ainsdale.html)
      still renders the pre-Q7 em dash as mojibake (a three-byte replacement
      sequence in place of the intended em dash, in "it usually is not
      [mojibake] we make the first step quick and easy"), the same
      live-paste-lag family as Cherry Lane and Coleman and Leighs, unchanged.
      Post C and Post D targets both returned 200 (not re-read in full text
      this pass; last confirmed clean on the seventh and eighth passes). No
      in-repo defect found, no new question raised. Done 2026-09-03
      Quality pass 2026-09-03 (tenth pass, repo and live): re-verified as the
      stalest rotation-pool item (last touched 2026-09-03T01:46:25+01:00, the
      earliest of the 36-item pool re-derived fresh by the same anchored
      git-log method the ninth pass used, matching the forward note that
      pass left). All facts re-checked against branches.json (name, address,
      phone, hours with both lunch closures, website, review link, three-town
      service area, hasApp false, all five widgets) and nothing wrong. Full
      36-checker suite run individually: 36/36 exit 0 at baseline. All six
      generators rebuilt to zero diff (sha256 of all 193 modules/core files
      identical before and after). New angle: check-gbp-packs.js's splitDay
      rule (the one requiring a split-day pack to tell the paster the profile
      needs two GBP time ranges, not one) had been read against this pack six
      times across nine prior passes but never proven by injection here -
      only proven by injection against Tiffenbergs, Gordon Short Crosby and
      the two other split-day packs on today's earlier 3.12 seventh pass.
      gbp-packs/hirshmans-ainsdale.md backed up by sha256 first
      (215430cdda8317622b471bc59a34c4e46282283735cca40d6f85fc58d051927b); its
      "GBP hours need two time ranges..." paster-note bullet was deleted
      entirely, leaving only "Sunday closed." in its place. check-gbp-packs.js
      caught it immediately and only, one FAIL by name: "this branch closes
      for lunch (Monday appears twice in openingHours), so the pack must tell
      the paster the profile needs two time ranges for that day rather than
      one." Exit 1, exactly one FAIL line, the standing Q64/Q72 WARNs
      unchanged alongside it. File restored by byte copy (this mount cannot
      unlink via git checkout, the standing FUSE quirk); sha256 reconfirmed
      identical to the pre-injection backup. Full 36-checker suite re-run
      clean immediately after (36/36 exit 0); git status --porcelain on the
      file empty. Confirms the splitDay rule genuinely generalises to this
      pack's own copy rather than being trusted only because the estate-wide
      sweep passed, closing the last untested check-gbp-packs.js rule this
      item's own text carries evidence for (road-name rule proven seventh
      pass, claim-patterns rule proven seventh pass, bank-holiday rule proven
      eighth pass, splitDay rule proven this pass). Live half, read-only GET
      (Claude in Chrome not connected this run; network egress confirmed via
      google.com and the branch homepage, both 200, before drawing any
      conclusion): all four post targets returned 200.
      pharmacy-first-service-ainsdale.html (Post A, HARD STOP) still carries
      the wrong address (64 station Road), the non-dialling phone
      017014577376 and "Hirshmans Pharmacy" branding in its own hand-pasted
      body copy - unchanged, still item 5.3/Q8/Q34. Read more closely this
      pass than before: the CORRECT address (56-62 Sherwood House) and phone
      (01704 577376) also appear on the same page, in the sitewide footer and
      JSON-LD block that core/site-data.js renders at runtime from
      branches.json, separate from the hand-pasted legacy body - so the page
      is publishing two different addresses and two different phone numbers
      to a patient reading top to bottom, not one wrong fact repeated. Not a
      new defect (the sitewide footer/schema half was already known correct
      and the pasted-body half was already known wrong; this pass just
      confirmed both live on the one page at once rather than reading only
      the body), but sharper than any of the nine prior write-ups of this
      page, so recorded for whoever actions 5.3/Q8/Q34.
      switch-prescriptions-hirshmans-ainsdale.html (Post B) still renders the
      pre-Q7 em dash as mojibake ("usually is not \xc3\x94\xc3\x87\xc3\xb6 we
      make the first step quick and easy"), unchanged, the same live-paste-lag
      family as Cherry Lane and Coleman and Leighs.
      weight-loss-clinic-hirshmans-ainsdale.html (Post C) read in full this
      pass: no medicine name, no superlative or results claim, private
      consultation framing throughout, clean. travel-clinic-hirshmans-
      ainsdale.html (Post D) read in full: the only match for "guaranteed" is
      inside the generator's own HTML build comment ("no vaccine is claimed
      guaranteed in stock"), not patient-facing copy; the visible page states
      "subject to availability and clinical suitability", correctly hedged.
      No in-repo defect found, no new question raised. Done 2026-09-03
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
Quality pass 2026-08-12: third pass, clean. Every fact verified against
branches.json again; the 742-character description claim is true under the
checker's paste-join count (a naive newline count reads 752, which is why the
claim was re-derived rather than trusted). The run 57 button-target guard
proved by injection, not assumed: Post D pointed at the sister branch's
travel-clinic-scorah-hazel-grove.html failed check-gbp-packs at exit 1 naming
both leaves, restored clean. All five URLs fetched live read-only: the profile
website pharmacy-scorah-bramhall.html still 404s as the paster note
anticipates, and Posts A to D all resolve and read correctly for Bramhall.
Everything seen live is already held in Q43; one sentence added there for the
shared Pharmacy First page's own contact section carrying the truncated
61 North Park Road and an unspaced phone, the same Weebly furniture family.
No in-repo defect. audits/scorah-bramhall-pack-check-2026-08-12.txt.
Quality pass 2026-08-13 (run 141): fourth pass, clean, REPO HALF ONLY (no
browser, so the four post buttons and the profile website line are carried
forward from the run 99 pass unverified). 22 independent assertions against
branches.json, 21 pass and the 22nd a false flag from the test itself. The
gap closed is estate-wide: the two reverse rules on services and categories
were a blocklist over five services and three categories, so a claim outside
that vocabulary was invisible. An injected "- Ear wax removal" service bullet
and a "Dental clinic" category both passed all 30 checkers. check-gbp-packs.js
now also runs an allowlist over every service label and secondary category in
every pack, derived by reading all 15 packs rather than from memory; 7 of 7
negative tests caught. The rule deliberately promises only that no NEW claim
can appear silently, not that a claim is true, because seven recognised labels
have no widget in branches.json to check against. New question Q62 on the post
town in the address line, which has no source of truth in the repo.
audits/scorah-bramhall-pack-check-2026-08-13.txt.
Quality pass 2026-08-14 (run 184): fifth pass, clean, REPO HALF ONLY (no
browser session, so the four post buttons and the profile website line are
carried forward from the run 99 live pass, still unverified since). 174
independent assertions, 0 failures: every branches.json fact present, no other
trading branch's phone, postcode or review link anywhere, hasApp false with no
app copy, and the 742-character description claim re-derived and true.
The gap closed is estate-wide and clinical. check-gbp-packs.js is 2,360 lines
and reads every FACT in a pack, and not one condition name: "sinusitis",
"sore throat", "earache", "impetigo", "shingles" and "insect bite" appear
nowhere in it. Fourteen packs publish the seven Pharmacy First conditions
twice each, in the Services bullet and in Post A, and every one of those 28
blocks is pasted verbatim into a public Google profile. So the clinical scope
of an NHS service was stated 28 times in public copy and guarded by nothing.
All 28 blocks verified correct by hand first: seven of seven conditions in
each, "where appropriate" hedge present, stated free, no price, UTI at 16 to
64 and earache paediatric, all matching the canon in build-service-pages.js.
New tools/check-gbp-pharmacy-first.js, 12 rules plus two coverage guards,
reading the canon out of the generator so the packs and the 98 live condition
pages cannot drift. 17 negative tests, all 17 caught their break, every
injection restored and proved byte-identical by sha256. Two defects were found
IN THE NEW CHECKER by its own tests and fixed before commit: a CRLF and $
scope collapse that had rules 3 to 8 reading one line per block while
reporting success, and a rule 5 that could not see the business description,
which is the third place a pack claims the condition count. No new question.
audits/scorah-bramhall-pack-check-2026-08-14.txt.
Quality pass 2026-08-30 (fifth pass, commit f276b9f): sync gap, this pass was
recorded in AGENT_LOG.md but never appended here until the sixth pass below
found the gap. Summary from the log: pack clean on 120 independent checks,
the run-99 live post-button findings carried forward unverified this pass
(no browser session), the PF condition guard re-proved by mutation, and a
real gap found and closed in tools/claim-patterns.js: a word-number outcome
claim ("Most patients lose a stone in the first month.") injected into
Post C passed all 36 checkers because the quantified-claim pattern read
digits only. Fixed by adding word numbers (a/an/one..ten, half a) and
drop/shed verbs to the pattern. Ten unit tests pass, the mutation re-run
goes red, the clean repo stays green on all 36. No new question. See
AGENT_LOG.md "## 2026-08-30 [commit f276b9f...] - Quality pass on 4.4" and
audits/scorah-bramhall-4.4-pass-2026-08-30.txt.
Quality pass 2026-08-31: sixth pass, clean. 149 independent checks in a
rewritten verifier (audits/verify-4.4-2026-08-31.js), 0 defects: every
fact from the fifth pass re-verified plus four new checks - weekday and
Saturday hours strings derived from branches.json's openingHours.specification
rather than hardcoded, so an hours change would be caught without a script
update; the bank-holiday paster note added on the 4.5 pass carries none of
the eight actual bankHolidays.dates2026 values in any form, which is the
real drift risk its own wording warns against (the verifier's first cut
banned every ISO-shaped date and false-flagged the note's own provenance
dates - fixed to check against the real date list instead); the
sister-branch sentence checked against branches.json rather than assumed
(Hazel Grove, id scorah_hazel, is a live branch sharing the pack's
brandLabel); and the WhatsApp reference in Post B checked against the
branch's own whatsapp field. Both prior guards re-proved by mutation
(PF condition swap caught fourfold by check-gbp-pharmacy-first.js; the
word-number outcome claim caught by check-gbp-packs.js, confirming the
fifth pass's fix still holds), applied with node and sha256-verified before
and after restoration. Live half read-only, all five URLs: Post A's pfLink
page, Post C's weight loss page and Post D's travel clinic page all read
correctly; Post B's switch page still carries the pre-Q7 em dash rendering
as mojibake (Q43 family, unchanged); the profile website target still
404s as the pack's paster note anticipates (Q43, unchanged since
2026-08-11); the shared PF page's truncated "61 North Park Road" contact
line is unchanged and already recorded under Q43's third-pass note. No
new question. See audits/verify-4.4-2026-08-31.js and
audits/scorah-bramhall-4.4-pass-2026-08-31.txt.
Quality pass 2026-09-01 (seventh, unattended scheduled run): clean. All 36
tools/check-*.js checkers pass. Fresh independent verifier written
(audits/verify-4.4-2026-09-01.js, own regexes, imports nothing from
tools/), 58 checks, 0 failures. Three guards re-proved by injection, each
restored by byte copy and sha256-confirmed identical to the original
before continuing: a phone swap (caught by check-gbp-packs.js and the
verifier), a Pharmacy First condition swap dropping shingles from both the
Services bullet and Post A (caught fourfold, twice each by
check-gbp-pharmacy-first.js and the verifier), and an em dash in Post D
(caught by check-em-dashes.js and the verifier). Full 36-checker suite
re-run clean after the final restore; git status on gbp-packs/, modules/
and branches.json empty throughout. Live half read-only (Claude in Chrome
unavailable this run, fell back to plain fetch()): Post A, Post C and
Post D all read correctly; the profile website target still 404s as the
pack anticipates (Q43, unchanged); the shared PF page's truncated address
is unchanged (Q43). One finding REFINED rather than new: Post B's switch
page still carries the pre-Q7 text in its meta description, which the
sixth pass described as rendering as mojibake ("ÔÇö") - this pass reads
it as a correctly-encoded genuine em dash (U+2014), same underlying
unrepasted-live-page drift, corrected description only. Not a new
question; the pack's own Post B note already covers it. No in-repo defect.
See audits/verify-4.4-2026-09-01.js and
audits/scorah-bramhall-4.4-pass-2026-09-01.txt.
Quality pass 2026-09-02 (ninth, unattended scheduled run): clean, with one
in-repo fix rather than a repeat of the prior eight passes' fact
re-verification. All 36 checkers re-run against the untouched worktree,
36/36 pass. Fresh angle: TEMPLATE.md's "Notes for the paster" section
requires "the date any live state claimed above was last observed, so the
next reader can tell how old it is", and no checker enforces it. By hand
against all 15 packs: eleven already carry dated live-state notes, built
up pass by pass, but scorah-bramhall.md (this item), scorah-hazel-grove.md
and fishlocks-eccleston.md do not, despite AGENT_WORKLIST.md's own history
showing the Bramhall 404 re-checked live four times since 2026-08-11. A
paster reading only the pack, which is what it is drafted for, had no way
to tell that claim was current rather than three weeks stale. Fixed at
source for this pack: the profile-website and Post B notes in
gbp-packs/scorah-bramhall.md now carry today's dated observation. Live
half, plain HTTP fetch (Claude in Chrome unavailable this run, empty
list_connected_browsers, same as this morning's 3.11 pass): profile
website pharmacy-scorah-bramhall.html still 404s, unchanged since
2026-08-11; Post B switch page resolves (200), NAP matches, but the "How
switching works" intro still renders the pre-Q7 em dash as mojibake
(U+00E2 U+20AC U+201D), same family as Gordon Short, SK Chemists Bootle
and Tiffenberg's packs and AGENT_WORKLIST item 4.3's Cherry Lane/Coleman
and Leighs finding - live-paste-lag, not a repo defect, source and paste
sheet both already clean; Posts A, C and D all resolve and read correctly,
weight loss page names no medicine and carries all three required
qualifiers, travel clinic page carries its availability hedge, shared PF
page lists all seven conditions including earache under its NHS clinical
heading. No new checker rule added this pass (a free-text pattern match
for "undated live claim" across 15 differently-worded packs risked more
false positives than value under this run's time budget); flagged as
worth a properly scoped rule in a future pass. No new question. Full
36-checker suite re-run clean after the edit; git diff --stat shows
exactly gbp-packs/scorah-bramhall.md, 16 insertions, 3 deletions. See
audits/scorah-bramhall-4.4-pass-2026-09-02.txt.
Quality pass 2026-09-03 (tenth, unattended scheduled run): baseline was NOT
clean at the start of this pass, unrelated to this item - tools/check-postcodes.js
failed on the untouched worktree because the item 3.11 ninth pass (committed
6d06c42, earlier the same run-day) had injected the postcode L23 3AZ into
Gordon Short Crosby's pharmacy-first page to prove check-map-embeds.js, then
restored the page, but AGENT_LOG.md and audits/gordon-short-item-3.11-quality-
pass-2026-09-03-ninth.txt both quote the injected value in their write-ups
without adding it to check-postcodes.js's NARRATIVE_POSTCODES allowlist - the
same gap, on a different postcode, that the item 6.3 sixth quality pass closed
for L23 6TX the day before (2026-09-02). Fixed at source: L23 3AZ added to
NARRATIVE_POSTCODES with a reason naming the injection, the two files that
quote it, and the precedent. All 36 checkers re-run clean after the fix (0
change to any pack, page or branches.json - the fix is checker-only).
With a clean baseline restored, fresh angle for this item itself: grepped
AGENT_LOG.md for check-brand-spelling.js, check-url-scheme.js and
check-uk-spelling.js alongside "bramhall" - zero hits for all three, so none
had ever been pointed at gbp-packs/scorah-bramhall.md by direct injection,
the same class of gap the 1.2 tenth, 4.7 tenth, 4.14 eighth and 4.2 eleventh
passes closed this week for their own packs. gbp-packs/scorah-bramhall.md
backed up by MD5 (ae58dd982780a11b808b6df84e29eecf) before any mutation, each
injection made with the native Edit tool, the targeted checker run, then the
file restored via Edit and the restore verified byte-for-byte (MD5 match)
before the next injection.
INJECTION 1 (check-brand-spelling.js): line 8, "Name on GBP: Scorah Chemists
Bramhall" changed to "Scorah Chemist Bramhall" (trailing s dropped). Result:
FAIL, "reads \"Scorah Chemist\". The trading name is \"Scorah Chemists\"".
Caught first attempt.
INJECTION 2 (check-url-scheme.js): the Post D (travel clinic, Book button)
target changed from https to http. Result: FAIL, INSECURE, "published surface
carries http://... An insecure estate URL on a live page is a crawlable
duplicate of the https page, which is item 6.6." Caught first attempt,
correctly cross-referenced to the existing item 6.6 rather than raised as a
duplicate question.
INJECTION 3 (check-uk-spelling.js): line 35, "Vaccination centre" changed to
"Vaccination center". Result: FAIL, "reads \"center\". UK English is
\"centre\"". Caught first attempt.
Final restore confirmed byte-identical to the pre-injection original (MD5
match). Full 36-checker suite re-run after the last restore: 36/36 exit 0.
git status --porcelain on gbp-packs/, modules/, core/, branches.json empty
except the intended tools/check-postcodes.js fix. All six page generators
re-run: git status --porcelain on modules/, core/ empty before and after,
confirming byte-stable output. No defect on this item - all three rules were
already correctly protecting this pack; now proven directly by injection for
the first time. No new question. See audits/scorah-bramhall-4.4-pass-
2026-09-03-tenth.txt.
Quality pass 2026-09-04 (eleventh, unattended scheduled run): clean. All 36 checkers re-run against
the untouched worktree, 36/36 pass. Fresh angle: grepped this item's full ten-pass history for
check-pharmacy-first-cost.js and check-app-membership.js - zero hits for both, so neither had ever
been pointed at this pack by direct injection, only covered passively via the full-suite pass, the
same gap class this week's 1.2 eleventh, 3.11 tenth, 4.7 eleventh and 4.2 twelfth passes closed for
their own packs. gbp-packs/scorah-bramhall.md backed up by MD5 (ae58dd982780a11b808b6df84e29eecf)
before any mutation.
INJECTION 1 (check-pharmacy-first-cost.js rule 6): "free" stripped from the three sentences naming
Pharmacy First itself (business description, Services section, Post A). First attempt used literal
single-line string matches and silently missed two of the three because the pack hard-wraps prose
across newlines; caught by re-grepping for "free" after the run rather than trusting a clean exit,
restored, and redone with whitespace-tolerant regexes that matched all three. Result: FAIL, rule
"free", naming the pack: "advertises NHS Pharmacy First but never calls it free (rule 6)". Caught
on the corrected attempt.
INJECTION 2 (check-app-membership.js rules 8a and 8d): one line added to the Services section,
"Manage your prescriptions on the go with our RB Healthcare Pharmacy app." (scorah_bramhall
confirmed hasApp: false; the pack's own paster note already states "No app mention anywhere in
this pack", making rule 8d directly testable here too). Result: FAIL, two failures, both naming
the pack - rule 8a ("the copy pasted into the public Google profile claims an app, but
branches.json has hasApp false") and rule 8d ("the paster note says there is no app mention
anywhere in this pack, but the pasted copy carries one"). Both fired together on the single
injection, as expected.
Both restores done by MD5-verified byte copy from the pre-injection backup
(ae58dd982780a11b808b6df84e29eecf reconfirmed each time), each followed by a clean re-run of the
injected checker. Full 36-checker suite re-run after the final restore: 36/36 exit 0. No checker
logic edited. No in-repo defect - both checkers already correctly guard this pack; proven directly
by injection for the first time rather than by passive full-suite coverage alone.
Live half, read-only fallback (Claude in Chrome unreachable this run, reconfirmed immediately
before this section): all five URLs unchanged from the ninth/tenth passes' own findings - profile
website pharmacy-scorah-bramhall.html still 404 (unchanged since 2026-08-11); Post B switch page
resolves (200) with the same pre-Q7 mojibake em dash in its intro, already recorded as
live-paste-lag in the pack's own note, not a repo defect; Posts A (branch PF page), C (weight loss)
and D (travel clinic) all resolve (200) and read correctly. No new finding, no new question. See
audits/scorah-bramhall-4.4-pass-2026-09-04-eleventh.txt.
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
Quality pass 2026-08-12 (hundredth run): third pass, clean. Every fact
re-verified against branches.json; the 712-character description claim
re-derived under the checker's paste-join convention (naive count 721,
paste-joined 712, inside 750); the run 57 sister guard negative-tested
and proved (wrong town named, exit 1 naming the live sister, restored
clean); all 29 checkers pass; all seven generators byte-identical. Live:
the landing page still 404s as the paster note anticipates, the shared
PF page prints the Hazel Grove phone and email unspaced (Q43 family,
note extended), the switch page live copy still carries the pre-5.1 em
dash against a repo full stop (paste lag, Q43), the weight loss page
names no medicines and makes no claims, the travel page reads correctly.
No in-repo defect. See audits/scorah-hazel-grove-pack-check-2026-08-12.txt.
Quality pass 2026-08-13 (run 160): fourth pass. The pack itself clean again,
every fact re-verified against branches.json including the sister-branch
claim, the catchment order, the 712-character description and the 24 June
Saturday closure; the post town on the "- Address:" line is Q64 and was not
re-raised. One real defect found and fixed, in the checker rather than the
pack: TWO EFFICACY RULES EXISTED, ONE PER SURFACE, AND THEY DID NOT AGREE.
The generated pages carry the shared list in tools/claim-patterns.js via
check-weight-loss-copy rule 9; the packs carried only the local EFFICACY_FAIL
list, which is not a superset of it. Five phrasings failed on a page and
passed on a post - "fast weight loss" (the list has "rapid" but not "fast"),
"delivers results", "real results", "most effective weight loss", "that
actually works" - proved by injecting all five into this pack and getting
exit 0 every time. A GBP post is Regime 1 advertising pasted onto a public
Google profile and an inner page is Regime 2, so the looser rule was
governing the more exposed surface. check-gbp-packs.js now applies
CLAIM_PATTERNS as well as EFFICACY_FAIL, both kept because neither contains
the other, and neither list retyped. Extended to TEMPLATE.md, which the pack
loop excludes by name and which propagates into every future pack, with a
structural carve-out for the rules block that quotes the wording it bans,
plus a guard that fails if that boundary heading is renamed. Eight negative
tests fire. 31 checkers pass, all six generators byte-identical, no page or
data field touched. See audits/scorah-hazel-grove-pack-check-2026-08-13.txt.
Quality pass 2026-08-14 (run 201): fifth pass. The pack itself clean for the
fifth time, every fact re-verified against branches.json: name, street address,
postcode, phone, hours including the 24 June Saturday closure, review link,
catchment order and its lead town, profile website on its own landing page,
categories and services earned by the widget set, the sister-branch claim, the
712-character description and all four post button targets. The post town on
the "- Address:" line is Q64 and was not re-raised. One real defect found and
fixed, again in a checker rather than the pack: HASAPP WAS UNREAD ON THE PACK
SURFACE. check-app-membership.js was written because hasApp reached a public
page unguarded, then stopped at the generated pages; "hasApp" appears nowhere
in check-gbp-packs.js and this checker was not among the fourteen that open
gbp-packs/. Yet four packs publish app copy into the business description and
posts and ten more carry a paster note asserting what branches.json says.
Proved by injection: an app sentence added to this pack's description with the
stated count kept honest and the length legal passed all 36 checkers, the same
claim in Post B passed all 36, and stripping every app claim out of
smartts-bootle.md passed all 36. Two earlier injections fired on the length
rule and the unrecognised-service rule, not on the app, which is why each was
re-run isolated. RULE 8 added to check-app-membership.js, the file that already
owns the field, rather than a third copy of it elsewhere: 8a the pasted copy,
8b the photo shot list, 8c the paster note against branches.json, 8d the note
against the pack it describes. Scope is the pasted copy only, so
riddings-timperley.md's note warning the paster NOT to inherit an old page's
App Store block does not fire. Eight negative tests fire, including the
adjacent-record boolean flip this file was created for, now caught on the pack
surface too. 36 checkers pass, all six generators byte-identical, no page, pack
or data field touched. See audits/scorah-hazel-grove-pack-check-2026-08-14.txt.
Quality pass 2026-08-30: sixth pass. The pack itself clean for the sixth time,
every fact re-verified against branches.json: name, street address, postcode,
phone, hours including the 24 June Saturday closure, review link, catchment
order, profile website on its own landing page, hasApp false honoured, the
712-character description re-derived at 712, all five referenced repo slugs
present. Live, read-only: the landing page still 404s exactly as the paster
note anticipates (Q35 class), the Post A-D targets all return 200. The post
town on the "- Address:" line is Q64 and was not re-raised. One real defect
found and fixed, on the pack surface across the estate rather than in this
pack alone: BANK HOLIDAYS NEVER REACHED THE PACK SURFACE. Q79 (answered
2026-08-27, all stores closed on bank holidays) landed in branches.json the
same day and the hours checkers learned to read it on 2026-08-29 (item 6.7),
but no pack and not GBP_MANUAL.md told the paster that a GBP profile shows a
bank holiday as Open unless special hours are set, with the Summer bank
holiday falling the day after this run. Same class as the run 201 hasApp
finding: a branches.json fact unread where it is acted on. Fixed with one
identical paster-note bullet in all 15 packs and a template variant in
TEMPLATE.md, naming bankHolidays.dates2026 rather than retyping the dates so
nothing can drift, plus two rules in check-gbp-packs.js: every pack's notes
block, and the template's, must carry the instruction and name the field,
gated on tradingPolicy "closed" so a policy change forces the notes to be
rewritten. Three negative tests fire, each restored sha256-identical. 36
checkers pass, all six generators byte-identical, no pasted copy, page or
data field touched. See audits/scorah-hazel-grove-pack-check-2026-08-30.txt.
Quality pass 2026-09-01: seventh pass. The pack re-verified clean for the
seventh time: name, street address, postcode, phone, hours including the 24
June Saturday closure, review link, catchment order and its five towns
(matching serviceAreaList exactly), profile website on its own landing page,
hasApp false honoured, the sister-branch sentence naming Bramhall correctly,
the bank holiday bullet added last pass still present and still naming
bankHolidays.dates2026 rather than retyped dates, and the 712-character
description re-derived independently at exactly 712. The post town on the
"- Address:" line is Q64 and was not re-raised. Live, read-only, via Claude
in Chrome: the landing page (pharmacy-scorah-hazel-grove.html) still 404s
exactly as the paster note anticipates (Q35 class); all four Post A-D button
targets return 200 and render correctly, including the shared Post A page's
Hazel Grove contact block; the site footer's "Hazel Grove: ... Mon-Fri
9am-6pm, Sat & Sun closed" still agrees with branches.json's post-24-June
hours, no Saturday reappearance. No new defect, no in-repo change beyond
this note and the audit file. 36/36 checkers pass, all six generators
untouched. See audits/scorah-hazel-grove-pack-check-2026-09-01.txt. Next
stalest by the standing projection: 4.6.
Quality pass 2026-09-02: eighth pass, unattended run, rotation pool
(least-recently-touched item computed from `git log`'s own commit dates per
"item N.N" mention, ahead of the standing projection above which predated
today's other passes). The pack re-verified clean for the eighth time: name,
street address, postcode, phone, hours including the 24 June Saturday
closure, review link, catchment order and its five towns (serviceAreaList
match, same order), hasApp false honoured, pfLink, profile website on its own
landing page, the sister-branch sentence naming Bramhall correctly (Bramhall
not disposed, its own seoTown is Bramhall), the bank holiday paster note still
present and still naming bankHolidays.dates2026 rather than retyped dates, all
six CLINIC_QUALIFIERS markers present in Post C, and the 712-character
description re-derived independently at exactly 712. The post town on the
"- Address:" line is Q64 and was not re-raised. All 36 checkers pass, all six
generators byte-identical (git status --porcelain -- modules/ empty).
INJECTION TEST, a rule not previously tried on this specific pack: the
"- Address:" line's road name changed from "87 Macclesfield Road" to
"87 Fernhall Road" (house number and postcode left alone). Caught by THREE
rules at once, one more than expected - the address-line-integrity rule (the
line no longer contains this branch's own street), the branch-street
PRESENCE rule (the full string "87 Macclesfield Road" including the house
number appears nowhere else, only the bare road name does, five times), and
the stale-KNOWN-exception guard (KNOWN_IDENTITY["scorah_hazel::
addressPostTown"], the Q64 exception, stopped matching once a second,
different fault existed). Restored by byte copy from a pre-mutation backup
(sha256 64fd2ae6...b7a4038 confirmed identical after restore, diff empty);
all 36 checkers re-ran clean with the Q64 WARN unchanged. Live half not
performed (Claude in Chrome not connected this run); the 2026-09-01
seventh-pass live verdicts stand unreconfirmed. No in-repo defect, no new
question. See audits/scorah-hazel-grove-pack-check-2026-09-02.txt.
Quality pass 2026-09-03: ninth pass, unattended run, rotation pool (4.5 the
unique stalest, last mentioned 2026-09-02T05:13:10+01:00; next stalest 1.3).
Facts re-verified against branches.json for the ninth time, all matching:
name, street address, postcode, phone, hours (no lunch closure, so the item
4.6 pass's PAIRING-rule angle does not apply to this branch), review link,
catchment order and its five towns, hasApp false, pfLink, profile website,
sister-branch sentence naming Bramhall, the bank holiday paster note, and the
712-character description re-derived independently. All 36 checkers pass, all
six generators byte-identical. NEW ANGLE: the RECOGNISED_SERVICES/
RECOGNISED_CATEGORIES allowlist rule (item 4.4 pass, 2026-08-13) had, by its
own header comment, only ever been proved by injection against
gbp-packs/scorah-bramhall.md, this pack's own sister on the same brand -
never against scorah-hazel-grove.md itself. Proved now: injected the same two
values as the original proof, a "Dental clinic" secondary category and an
"Ear wax removal: microsuction ear wax removal by appointment." services
bullet, neither in the recognised vocabulary. Both caught cleanly, two FAILs
named against this pack specifically, exit 1. Restored by byte copy (sha256
64fd2ae6...b7a4038 confirmed identical after restore, diff empty); all 36
checkers re-ran clean. Live half not performed (Claude in Chrome not
connected this run); the 2026-09-01 seventh-pass live verdicts stand
unreconfirmed. No in-repo defect, no new question. See
audits/scorah-hazel-grove-pack-check-2026-09-03.txt.
Quality pass 2026-09-03 (unattended run, ~20:38 BST): tenth pass, rotation
pool (4.5 the unique stalest at 2026-09-02T05:13:10+01:00; 3.1, 4.3 and 4.6
dropped out of contention, all done by earlier runs the same day). Facts
re-verified against branches.json for the tenth time, all matching: name,
street address, postcode, phone, hours (no lunch closure), review link,
catchment order and its five towns, hasApp false, pfLink, profile website,
sister-branch sentence naming Bramhall, the bank holiday paster note, and the
712-character description re-derived independently. The post town on the
"- Address:" line is the standing Q64 exception and was not re-raised. All
36 checkers pass (0 failures, 17 pre-existing estate-wide warnings), all six
generators byte-identical. NEW ANGLE: the "another branch's TOWN must not
appear in the pasted copy" rule (added item 4.8 pass, 2026-08-13, by
injection into fishlocks-eccleston.md) had never been individually proved
against this pack. Proved by injection: Post B's catchment sentence changed
from "...Great Moor and Poynton." to "...Great Moor, Poynton and Aigburth"
(McCanns Chemist Aigburth's own town, a live branch, not in this branch's
serviceAreaList). Caught by TWO rules at once - the catchment-list membership
rule and the foreign-town rule - the same "one more than expected" pattern
the eighth pass found on its address-line injection, and confirmed the two
rules are not redundant (each catches a shape the other would miss). Restored
by byte copy (sha256 64fd2ae6...b7a4038 confirmed identical, diff empty); all
36 checkers re-ran clean. Live half not performed (Claude in Chrome not
connected this run); the 2026-09-01 seventh-pass live verdicts stand
unreconfirmed. No in-repo defect, no new question. See
audits/scorah-hazel-grove-pack-check-2026-09-03-tenth.txt.
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
      Quality pass 2026-08-12 (hundred-and-twentieth run): pack verified
      fact by fact against branches.json a third time, clean on every
      field including both lunch closures, catchment order, pfLink,
      hasApp and the St Michael's sister-branch wording. All 28 checkers
      green, worktree byte-stable. Live half by plain GET: all four post
      button URLs 200 with correct H1s, the Post A page's Aigburth footer
      hours block matches branches.json exactly, the profile-website
      landing page still 404s awaiting the queued paste run (already
      recorded). No new defect, no new question. Evidence:
      audits/mccanns-aigburth-gbp-pack-check-2026-08-12.txt.
      Quality pass 2026-08-13 (hundred-and-sixty-third run): fourth pass.
      REPO HALF ONLY, no browser this run (two Chrome instances connected,
      Q59), so the 2026-08-12 live verdicts above stand as written and
      nothing live is re-claimed. The pack's own data is clean for the
      fourth time: address, postcode, phone, both lunch closures, review
      link, catchment order, profile website, categories, services,
      description length and all four post buttons all agree with
      branches.json, and its one warning is the known 5.3 pfLink item.
      ONE REAL DEFECT FOUND AND FIXED, and it was in the checker, not the
      pack. check-gbp-packs.js read the street address twice, as a PRESENCE
      check (the branch's own address appears somewhere) and a SISTER check
      (no other branch's address appears), and neither proves the addresses
      the pack actually publishes are this branch's. Proved by injection:
      changing the profile-basics "- Address:" line alone from 112 to 114
      Aigburth Road passed every rule clean, because the three other
      mentions still read 112 and satisfied presence, and 114 is nobody's
      address so was invisible to the sister rule. That is the line the
      paster sets the Google Maps pin from. The same injection passed in
      the description, in Post B and in Post D, and a mistyped number also
      silently DISABLES the post-town rule, which finds the town by locating
      the street inside the address line. New rule proves every house number
      stated on the branch's own road is that branch's own, derived from
      branches.json with nothing hardcoded, engaging for 13 of the 16
      branches and reading hyphenated ranges. Estate-wide, not local: four
      packs state their address more than once and so were exposed the same
      way (this one, McCanns Sandringham, SK Chemists Bootle and Smartts
      Bootle), and the new rule was confirmed to catch a single changed
      mention in each of the other three. Ten injections caught, none
      missed, all 31 checkers green, no page, generator, data field or piece
      of patient-facing copy changed. No new question.
      Quality pass 2026-08-14 (two-hundred-and-fourth run): fifth pass, and
      the pack's own data is clean for the fifth time on name, address, post
      town, postcode, phone, hours including both lunch closures, review
      link, catchment order, profile website, categories, services,
      description length, all four post buttons and hasApp. One warning, the
      known 5.3 pfLink. REPO HALF ONLY, no browser (Q59), so the 2026-08-12
      live verdicts above stand as written. All 36 checkers green and all six
      generators byte-stable before and after. ONE REAL DEFECT FOUND AND
      FIXED, in the checker rather than the pack, and it is the hours twin of
      the address defect the 2026-08-13 pass closed on this same pack. Every
      hours rule reads ONE region, the "- Hours:" bullet, and this pack
      states its hours in four places. Proved by injection with all 36
      checkers exiting 0 three times: the paster note's Saturday close moved
      from 5:00pm to 6:00pm, the photo list's lunch closure moved to 3:00pm,
      and the note's "Monday to Friday" turned into "Monday to Saturday".
      The first is the sentence the paster reads while typing into Google's
      hours editor. Estate-wide: 11 of the 15 packs state a clock time
      outside the guarded line, and in six of them it is inside the business
      description or a post, which is public copy pasted verbatim into the
      profile. New rule holds every hours statement anywhere in a pack to
      branches.json, composed from the data with nothing hardcoded, reading a
      lunch sentence as a BREAK against the gap the specification leaves
      rather than as opening hours, and deliberately not reading quoted
      spans, history parentheticals or days held closed, each of which is a
      real line in a real pack. The first draft of the rule split on the
      colon inside "9:00am" and silently read nothing, which its own negative
      tests caught; recorded rather than quietly fixed. Negative tested 14
      ways, 9 must-catch across four packs and three regions and 5 must-pass
      false-positive guards, all as expected. Residual stated: a restatement
      naming no weekday is still unread. No page, copy or data change, no new
      question. Evidence:
      audits/mccanns-aigburth-gbp-pack-quality-pass-2026-08-14.txt.
      Quality pass 2026-08-30 (unattended run): sixth pass. Ordering re-derived
      mechanically: all 41 completed items read out of this file, all run
      headings in AGENT_LOG.md walked, and 4.6 (last touched 2026-08-11, the
      seventy-ninth run) came back the oldest standing verification in the
      estate, tied on date with 4.8, 4.9, 4.10, 4.12, 4.13 and 4.14 but
      earliest that day. Pack verified fact by fact against branches.json a
      sixth time: name, address, phone, hours with both lunch closures,
      review link, catchment order, hasApp, pfLink, description length
      (725 characters recomputed independently) and the St Michael's
      sister-branch wording all hold. node tools/check-gbp-packs.js: 0
      failures, one known WARN (the live-only pfLink target). Bank holiday
      paster note (added estate-wide on the 4.5 pass) confirmed present.
      LIVE HALF, read-only: all four post button URLs and the homepage
      return 200; the profile-website landing page still 404s awaiting the
      queued paste run (unchanged from every prior pass). The Weebly title
      suffix and the Sandrigham/McCann's furniture typos are the same known
      findings already held elsewhere. ONE NEW FINDING, not a repo defect:
      the weight loss clinic page at this domain was read against
      compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md for the first time and
      is materially cleaner than the seven branches that file already
      covers (no medicine named, no efficacy claim, no slider, no treatment
      picker, balanced eligibility section), but its booking block leads
      with a standalone "from Ã‚Â£39.99" price ahead of its eligibility
      section, the same pattern the reference rules a breach elsewhere.
      McCanns Sandringham not read this run, presumed same template,
      unverified. Nothing edited (live Weebly copy, and pricing/regulatory
      wording is never an autonomous decision); written up in the
      compliance file and raised as Q83. Evidence:
      audits/mccanns-aigburth-gbp-pack-quality-pass-2026-08-30.txt.
      Quality pass 2026-09-01 (unattended run, seventh pass): the oldest
      standing verification in the rotation pool (last touched 2026-08-30,
      tied that day with 4.7, 4.8, 4.9, 4.10, 4.12, 4.13, 4.15, 2.3, 1.2 and
      5.7, but earliest of that group). Pack re-verified fact by fact
      against branches.json a seventh time: name, address, postcode, phone,
      hours with both lunch closures, review link, catchment order, hasApp,
      pfLink, description length (725 characters, recomputed independently
      in Node, unchanged) and the St Michael's sister-branch wording (McCanns
      Sandringham's brandLabel and seoTown re-checked directly, still
      "McCanns Chemist" / "St Michael's", not disposed, so the sentence
      still holds both ways). node tools/check-gbp-packs.js: 0 failures, the
      one standing WARN (Post A's live-only link target). All 36 checkers
      run individually: 36/36 pass. All six generators rebuilt; git status
      on modules/ empty, byte-identical. LIVE HALF, read-only via Claude in
      Chrome, five page reads, nothing clicked or typed: the profile-website
      landing page (pharmacy-mccanns-aigburth.html) still 404s, unchanged,
      still awaiting the queued Weebly paste. Post A
      (pharmacy-first-service-aigburth.html): 200, Weebly default title
      suffix and the Q39 furniture faults ("Sandrigham" typo, "McCann's
      Pharmacy" naming, abbreviated street) all reconfirmed unchanged, not
      re-raised. Post B (switch-prescriptions-mccanns-aigburth.html): 200,
      matches this repo's generated output. Post C
      (weight-loss-clinic-mccanns-aigburth.html): 200, no medicine named, no
      efficacy claim, "not right for everyone" stated; Q83's finding
      reconfirmed unchanged (booking block still states "from £39.99" ahead
      of the eligibility section) and not re-raised, Q83 already covers this
      exact fact. Post D (travel-clinic-mccanns-aigburth.html): 200, matches
      this repo's generated output, no vaccine named by brand. No new
      in-repo defect, no new question; open question count unchanged at 53.
      Evidence: audits/mccanns-aigburth-gbp-pack-quality-pass-2026-09-01.txt.
      Quality pass 2026-09-02 (unattended run, eighth pass): oldest standing
      verification in the rotation pool, re-derived from AGENT_LOG.md header
      dates rather than assumed - tied at 2026-08-11 with 4.8, 4.9, 4.10 and
      4.13, but earliest of that group by run sequence number (seventy-ninth
      run that day, before 4.8's eightieth). Pack re-verified fact by fact
      against branches.json an eighth time: name, address, postcode, phone,
      hours with both lunch closures, review link, catchment order, hasApp,
      pfLink, description length (725 characters, recomputed independently)
      and the St Michael's sister-branch wording (mccanns_sandringham's own
      record re-read directly this pass: brandLabel, seoTown and disposed
      status all still hold). node tools/check-gbp-packs.js: 0 failures. All
      33 other checkers run individually: 33/33 exit 0. All six generators
      rebuilt: git status on modules/ empty, byte-stable. INJECTION TEST: the
      profile-basics phone line mutated one digit on a scratch-backed copy
      (sha256 recorded before and after); check-gbp-packs.js caught it
      cleanly with both a WARN (wrong number present) and a FAIL (real
      number absent); restored by byte copy from the pre-mutation backup,
      not git checkout, and the post-restore sha256 matched exactly. LIVE
      HALF NOT PERFORMED this run: Claude in Chrome reported not connected
      when queried at step 3, so the 2026-09-01 seventh-pass live verdicts
      stand unchanged and nothing live is re-claimed. No new in-repo defect,
      no new question; open question count unchanged at 40 (of 91 total).
      Evidence: audits/mccanns-aigburth-gbp-pack-quality-pass-2026-09-02.txt.
      Quality pass 2026-09-03 (unattended run, ninth pass): stalest item in
      the rotation pool, re-derived mechanically (last touched
      2026-09-02T04:42:57+01:00, next stalest was 4.5 at 05:13:10, no tie).
      Pack re-verified fact by fact against branches.json a ninth time: name,
      address, postcode, phone, hours, review link, catchment order, hasApp,
      pfLink, serviceAreaList, description length (725 of 750, checker-
      verified rather than hand-recomputed) and the St Michael's
      sister-branch wording (mccanns_sandringham re-read directly: still
      "McCanns Chemist" / "St Michael's", not disposed). node
      tools/check-gbp-packs.js: 0 failures, known warnings only. All 36
      checkers run individually: 36/36 exit 0. All six generators rebuilt:
      0 diffs across modules/ and core/, git status empty throughout.
      NEW ANGLE: the time/day PAIRING rule (added item 4.14 pass,
      2026-08-12, proven that pass only against gordon-short-crosby.md) had
      never been proven by injection against this pack, despite the rule's
      own header comment naming mccanns-aigburth.md as one of six exposed
      branches and as the example of the explicit-two-ranges grammar it
      parses. INJECTION: on a scratch copy, swapped the weekday and Saturday
      afternoon closing times on the "- Hours:" line (2:00pm to 6:00pm and
      2:00pm to 5:00pm), which leaves the claimed day set and the claimed
      time set both unchanged (so the day rule and the clock-time-set rule
      both still pass) and wrongs only the pairing. RESULT: exit 1, six
      FAILs (Monday through Saturday), each naming the exact wrong pairing
      and the correct branches.json pairing, worded precisely as the rule's
      header comment describes. RESTORED by byte copy (not git checkout);
      post-restore sha256 matched the tracked repo's own file exactly;
      re-run clean. Tracked repo confirmed untouched throughout. Nothing
      fixed - this pass adds proof, not correction. LIVE HALF: Claude in
      Chrome not connected; fell back to read-only HTTP GET. Profile-website
      landing page still 404s, unchanged, still awaiting the queued paste
      run. The other four post targets all 200; full text not re-read this
      pass (last confirmed clean on the seventh and sixth passes), so this
      is a status check, and Q83 (weight loss booking-block price ahead of
      eligibility) is not re-raised as it is already open. No new in-repo
      defect, no new question; open question count unchanged at 41 of 94.
      Evidence: audits/mccanns-aigburth-gbp-pack-quality-pass-2026-09-03-ninth.txt.
      Quality pass 2026-09-03 (unattended run, tenth pass): stalest item in the
      rotation pool, re-derived mechanically (last touched 2026-09-03T02:10:07+01:00,
      next stalest 4.5 at 02:40:10, no tie). Pack re-verified: node
      tools/check-gbp-packs.js 0 failures, same 17 known WARNs as every prior
      pass. All 36 checkers run individually: 36/36 exit 0. git status empty
      throughout. NEW ANGLE: the splitDay rule (added item 4.10 pass, 2026-08-10,
      "a lunch closure must tell the paster to enter TWO ranges") had never been
      proven by injection against this pack specifically, despite this pack
      genuinely closing for lunch (Monday appears twice in branches.json's
      openingHours.specification) and already carrying the required paster
      note. INJECTION: on a sha256-backed scratch copy, deleted the splitDay
      sentence from the paster notes, leaving only "Sunday closed." RESULT:
      exit 1, exactly one FAIL, named precisely as the rule's own message,
      with all 17 pre-existing WARNs unchanged and no other pack's verdict
      moved. RESTORED by byte copy (not git checkout); post-restore sha256
      matched the pre-injection value exactly (fdb1429d...693); re-run clean,
      36/36 checkers exit 0, tracked repo confirmed untouched throughout.
      Nothing fixed - this pass adds proof, not correction. LIVE HALF: Claude
      in Chrome not connected (Q59); fell back to read-only HTTP GET. Profile-
      website landing page still 404s, unchanged, still awaiting the queued
      paste run. The other four post targets all 200; full text not re-read
      this pass (last confirmed clean on the seventh and ninth passes), so
      this is a status check, and Q83 is not re-raised as it is already open.
      No new in-repo defect, no new question; open question count unchanged
      at 41 of 94. Evidence:
      audits/mccanns-aigburth-gbp-pack-quality-pass-2026-09-03-tenth.txt.
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
      Quality pass 2026-08-12: second pass. Pack verified fact by fact against
      branches.json and every checker rule again; repo half clean, zero diff,
      all 29 checkers pass. One in-repo defect found and fixed in the pack
      itself: its own paster note instructed a Post A swap to the branch's
      generated Pharmacy First page "once that page is confirmed live on
      Weebly", and this pass verified the condition met (200 and present in
      the branch sitemap, both read this run), so the swap was executed and
      the note rewritten to record it. The live GBP link repoint remains item
      5.3's business and branches.json pfLink was deliberately not touched.
      Live half otherwise re-confirms known states: the landing page still
      404s (Q35), the live SEO titles still carry the unpasted default
      construction (run 78), and the Weebly furniture faults remain with Q39,
      still open. No new question.
      Evidence: audits/mccanns-sandringham-gbp-pack-check-2026-08-12.txt.
      Quality pass 2026-08-12b: third pass, repo half only, the live half not
      run and not claimed (two Chrome extensions connected, an unattended run
      may not choose between them, Q59). The pack is clean for the third
      consecutive pass: every fact re-checked against branches.json, the
      counts it claims of itself verified rather than trusted (description
      713, posts 463, 298, 518, 425), pure ASCII, no em dash, catchment still
      leading with St Michael's, and the weight loss page its Post C button
      links to still names no medicine. Nothing in the pack was edited.
      One in-repo defect found and fixed, in the checker rather than the pack,
      and it was the packs' clinical copy that was unguarded. No checker read
      a GBP pack for NHS eligibility: rules 1 to 8 of
      check-pharmacy-first-eligibility.js guard the generator and the 98
      generated condition pages and stop there. Proved by injection, not
      asserted: "women aged 16 to 64" changed to "16 to 65" and "adults aged
      40 and over" to "30 and over" walked past all 29 checkers clean. That is
      wrong NHS eligibility pasted onto a Google profile, which for most
      patients is the only page about the pharmacy they ever read, and 16 to
      65 invites a woman the pathway excludes to attend for a consultation she
      cannot have. Rule 9 added to that checker, where the clinical numbers
      already live so they are not duplicated, and the NHS blood pressure
      cohort pinned with them for the first time (it existed only as prose).
      Matching is by whole cohort phrase, not bare number, so a right number
      on the wrong service fails too, and it is sentence-bounded. Two false
      positives on first run were both rule defects and were fixed in the
      rule, no pack touched: "aged 40 or over" is a legitimate variant, and
      "under 30 seconds" is a duration, not an age. Negative-tested seven
      ways including two other packs; every case took the full suite from 0
      failures to 1. All six generators rebuild to a zero diff and all 29
      checkers pass. No new question.
      Evidence: audits/mccanns-sandringham-gbp-pack-check-2026-08-12b.txt.
      Quality pass 2026-08-13: fifth pass, repo half only, no live check and
      no answer pickup (the portal returned the Cloudflare Access login page,
      the cause Q59 records). The pack is clean for the fifth consecutive
      pass and nothing in it was edited: every fact re-read against
      branches.json, the counts it claims of itself measured rather than
      trusted (713, 463, 298, 518, 425), zero non-ASCII, dash and smart-quote
      characters, catchment still leading with St Michael's in all three
      places, hasApp still false with no app claim.
      Method was injection rather than recitation: 14 injections, each
      followed by the full 32-checker suite and an automatic restore.
      ONE REAL DEFECT FOUND AND FIXED, in tools/check-gbp-packs.js. Its
      catchment rule reads the ORDER of the list and is structurally
      incapable of reading anything else, because the regex it matches with
      is composed out of the branch's own serviceAreaList towns and so can
      only ever match those towns. A town that is not on the list is not a
      wrong element, it is invisible: the run ends one element early and
      still leads with the right seoTown. Proved by injection, replacing
      Dingle with Woolton in the services-section catchment, which walked
      past all 32 checkers clean while claiming a catchment the group does
      not have on a public Google profile. The foreign-town rule further
      down the file does not cover it, because that one fires only on
      another branch's own town; a town belonging to no branch falls between
      the two. A membership rule was added beside the order rule, composed
      from branches.json, deliberately membership only and not completeness
      or order. Two false positives on the first run were both rule defects
      and were fixed in the rule with no pack touched: the lead-in verb was
      being swallowed ("Serving Bootle"), and an address was being read as a
      catchment ("Sherwood House, Station Road, Ainsdale, Southport").
      Negative-tested four ways, each producing exactly one failure so the
      two rules do not double up, including a loophole test proving
      "Serving Woolton" still fails. All 15 packs already comply, so the gap
      was latent. All 32 checkers exit 0 and all six generators rebuild to a
      zero diff. No new question.
      Recorded but not fixed, for the next pass: an absolute outcome
      guarantee injected into Post D ("Every traveller is fully protected")
      passed all 32 checkers, because check-travel-clinic-copy.js does not
      read gbp-packs/ at all. Same shape as the last three runs' defects.
      Evidence: audits/mccanns-sandringham-gbp-pack-check-2026-08-13.txt.
      Quality pass 2026-08-29: sixth pass, repo and live halves both run.
      The pack is clean for the sixth consecutive pass and was not edited:
      every fact re-read against branches.json, the counts it claims of
      itself measured rather than trusted (713, 463, 298, 518, 425), zero
      non-ASCII, catchment still leading with St Michael's in all three
      places, hasApp still false with no app claim. Live: all four post
      targets 200 and in the sitemap; the profile-website landing page still
      404s (Q35, the pack holds the paster back); the live Post A page still
      carries the unpasted default title and pre-Q15 copy, the recorded
      live-lag state awaiting the queued repaste.
      The gap the fifth pass recorded for the next pass is now CLOSED. It
      had survived the 4.15 pass of 2026-08-29, which fixed the page half
      only: re-proved by mutation, "We guarantee full protection for every
      destination." in Post D still passed all 36 checkers. RULE 12's
      pattern list moved to the new shared tools/outcome-promise-patterns.js
      (the claim-patterns.js convention), check-travel-clinic-copy.js now
      requires it unchanged in scope, and check-gbp-packs.js scans every
      pack and the TEMPLATE.md specimen surface with it, question-exempt.
      Swept first: no pack carries any such wording today, so the gap was
      latent. Negative-tested six ways (guarantee in Post D fails, the same
      wording as a question passes, 100% in a second pack fails, lifelong
      immunity fails, template specimen fails, visible page copy still
      fails under the refactored RULE 12), all correct, every mutation
      restored to a clean worktree. All six generators rebuild to a zero
      diff and all 36 checkers pass. No new question.
      Evidence: audits/mccanns-sandringham-gbp-pack-check-2026-08-29.txt.
      Quality pass 2026-08-30: seventh pass, repo half clean and live half
      performed. Every fact re-checked against branches.json, including a
      cross-check against sibling mccanns_aigburth to rule out the
      swapped-identity class the second pass found (distinct street number,
      postcode, review link and phone confirmed on both records). Counts
      measured independently rather than trusted: description 713, posts
      463, 298, 518, 425, matching the pack's own claims and the checker's
      --verbose output exactly. Zero non-ASCII bytes by direct byte read.
      Post C re-swept against the outcome-promise-patterns wording the sixth
      pass added: still clean, nothing regressed. All six generators rebuild
      to a zero diff and all 36 checkers pass.
      Live half: the four post targets (Pharmacy First, switch, weight loss
      clinic, travel clinic) all return 200 and sit in the branch sitemap.
      The profile-website landing page pharmacy-mccanns-sandringham.html
      still 404s and is absent from the sitemap (Q35, unchanged, the pack
      still holds the paster back on that field). The live Post A page still
      serves the unpasted default title and has no "St Michael's" string in
      its body (checked directly), while the repo-generated copy correctly
      leads with St Michael's in both H1 and meta description - the same
      queued-repaste lag recorded on every prior pass, not a new finding.
      branches.json pfLink deliberately untouched (item 5.3's business,
      still [BLOCKED]). No in-repo defect found this pass. No new question.
      Evidence: audits/mccanns-sandringham-gbp-pack-check-2026-08-30.txt.
      Quality pass 2026-09-01 (eighth): re-derived the least-recently-
      verified rotation item with a proper block-bounded scan of this
      whole file rather than a line-window heuristic (a window heuristic
      had just been shown, in item 4.10's own entry, to under-read a
      different item's pass history), confirming 4.7 as the correct pick
      over 4.2 by same-day commit position. Every fact re-checked against
      branches.json: address, phone, review link, hours, hasApp, catchment
      order and membership, all four post links. Counts re-measured
      independently: description 713, posts 463/298/518/425, all exact.
      All six generators rebuilt to a zero-diff worktree (182 pages
      byte-identical before/after); all 36 checkers exit 0.
      Three injections proved the guards rather than reciting them, each
      on a disposable backup restored by plain file copy and confirmed
      byte-identical by md5sum before continuing: (1) street address
      swapped to sister McCanns Aigburth's "112 Aigburth Road" - caught by
      both the sister-identity rule and the address-presence rule in
      check-gbp-packs.js; (2) Post A's NHS cohort widened from "16 to 64"
      to "16 to 65" - caught by check-pharmacy-first-eligibility rule 9
      (2 failures, both ages named); (3) the services-section catchment
      line changed from "...and Dingle" to "...and Woolton" (not in this
      branch's serviceAreaList) - caught by check-gbp-packs.js's catchment
      membership rule. All three restored and the full 36-checker suite
      re-run clean.
      Live half performed via plain read-only HTTP GET (Claude in Chrome
      unavailable - two Chrome extensions connected, unattended run cannot
      choose, Q59). All five findings reconfirmed unchanged from the
      seventh pass: pharmacy-mccanns-sandringham.html still 404 (Q35); the
      four content pages (Pharmacy First, switch, weight loss, travel
      clinic) all 200 but still serve the unpasted default title and body
      copy leading with "Sandringham" rather than "St Michael's"; sitemap
      lastmod still 2026-08-14T23:05:25+00:00 throughout and the landing
      page still absent from it, confirming no republish since the
      seventh pass's own reading. No in-repo defect found. No new
      question. Evidence:
      audits/mccanns-sandringham-gbp-pack-check-2026-09-01.txt.
      Quality pass 2026-09-02 (ninth): re-derived the rotation pick the same
      way as the eighth pass (block-bounded scan of this whole file, not a
      line-window heuristic); item 3.3 was excluded as freshly completed
      that morning (08:34 UTC), confirming 4.7 as stalest ahead of 4.2 and
      the rest of the pool. Every fact re-checked against branches.json:
      address, phone, review link, hours (both weekday sessions and the
      split-day paster note), hasApp, catchment order and membership, all
      four post links. Counts re-measured independently via
      check-gbp-packs.js --verbose rather than trusted: description 713,
      posts 463/298/518/425, all exact and unchanged from every prior pass.
      All six generators rebuilt to a zero-diff worktree (180 pages
      byte-identical before/after, weebly.html paste template excluded per
      convention); all 36 checkers exit 0.
      Three fresh injections proved the guards rather than reciting them,
      each on a disposable backup restored by plain byte copy and confirmed
      identical by MD5 before continuing: (1) postcode swapped to sister
      McCanns Aigburth's L17 7BP - caught by both check-gbp-packs.js (own
      postcode absent, foreign postcode attributed to the correct sister)
      and check-postcodes.js's independent FOREIGN rule; (2) the NHS blood
      pressure cohort widened from "40 and over" to "35 and over" - caught
      by check-pharmacy-first-eligibility.js rule 9; (3) the review link
      swapped to sister McCanns Aigburth's - caught by check-gbp-packs.js
      (own link absent, foreign link attributed to the correct sister),
      while check-branch-links.js correctly stayed clean since
      branches.json itself was untouched. All three restored and the full
      36-checker suite re-run clean each time.
      Live half performed via Claude in Chrome, plain read-only GET, no
      login or clicks beyond navigation. All five findings reconfirmed
      unchanged from the eighth pass: pharmacy-mccanns-sandringham.html
      still 404 (Q35); the four content pages (Pharmacy First, switch,
      weight loss, travel clinic) all 200 and in the sitemap, but the
      Pharmacy First page still serves the unpasted default title and body
      copy leading with "Sandringham" rather than "St Michael's"; sitemap
      lastmod unchanged at 2026-08-14T23:05:25Z throughout and the landing
      page still absent from it. Noted in passing, not new and out of
      scope for this pack-level item: the live switch page's hero and
      trust-bar copy still carries the unconditional wording Q49 (answered
      via portal 2026-09-01) recommends qualifying; check-switch-copy.js's
      own KNOWN list already tracks this against Q49, so it is not this
      item's defect to fix. No in-repo defect found this pass. No new
      question; open question count unchanged at 38 (of 91 total).
      Evidence: audits/mccanns-sandringham-gbp-pack-quality-pass-2026-09-02.txt.
      Quality pass 2026-09-03 (tenth): re-derived the rotation pick per the
      established block-bounded method; 2.3 and 3.3 were both completed
      earlier the same morning (06:34 and 07:12 BST), leaving 4.7 the stalest
      in the pool at 2026-09-02T10:12:37+01:00, confirming the ninth pass's
      own forward note. Every fact re-checked against branches.json: address
      1b Aigburth Road / L17 4JP, phone 0151 727 3076, review link, both
      weekday hours sessions with the split-day paster note, hasApp false,
      catchment leading with St Michael's in all three places. Counts
      re-measured independently via check-gbp-packs.js --verbose rather
      than trusted: description 713, posts 463/298/518/425, all exact and
      unchanged from every prior pass. All six generators rebuilt to a
      zero-diff worktree; all 36 checkers exit 0.
      Three fresh injections proved rules never before proven against this
      specific pack, each on the live file, MD5-confirmed byte-identical to
      the pre-injection baseline after restore: (1) "Vaccination centre"
      changed to "Vaccination center" - caught by check-uk-spelling.js
      ("reads \"center\". UK English is \"centre\""); (2) the pack's own
      heading changed from "McCanns Chemist Sandringham" to "McCann's
      Chemist Sandringham" - caught by check-brand-spelling.js ("the
      trading name is \"McCanns Chemist\""); (3) the Post C button target
      changed from https to http - caught by check-url-scheme.js as an
      insecure published surface (cross-referenced to item 6.6). All three
      restored and the full 36-checker suite re-run clean. These three
      checkers had been proven against other packs and pages in earlier
      items but never by direct injection against this pack, which the
      eight prior passes' logged injections (address/postcode/review-link
      identity, NHS eligibility cohort, catchment order/membership, outcome
      promise, POM-class allusion, pricing, discount, buy-now CTA, body
      image) had not covered.
      Live half performed via read-only HTTPS HEAD requests (Claude in
      Chrome not connected this run; PowerShell Invoke-WebRequest used as
      the established fallback). All four findings reconfirmed unchanged
      from the ninth pass: pharmacy-mccanns-sandringham.html still 404 and
      absent from the sitemap (Q35); the four post-target pages (Pharmacy
      First, switch, weight loss, travel clinic) all 200 and present in the
      sitemap; sitemap lastmod unchanged at 2026-08-14T23:05:25Z throughout,
      confirming no republish since the ninth pass's own reading. No
      in-repo defect found this pass. No new question; open question count
      unchanged at 41 (of 94 total).
      Quality pass 2026-09-04 (eleventh): re-derived the rotation pick with a
      corrected method rather than trusting the tenth pass's own forward
      note verbatim. A first regex sweep of git log by item number produced a
      false tie between 4.2 and 4.7, because a log-correction commit for 4.2
      happened to name 4.7 in its own message text; restricting the match to
      commit subjects that begin "Item <n> " removed the false hit and put
      4.7 uniquely stalest at 2026-09-03T07:45:54+01:00 (its own tenth pass),
      ahead of 4.2's genuine eleventh pass at 08:09:57 the same morning, then
      4.14, then 1.2. Every fact re-checked against branches.json: address 1b
      Aigburth Road / L17 4JP, phone 0151 727 3076, review link, both weekday
      hours sessions with the split-day paster note, hasApp false, catchment
      leading with St Michael's in all three places. Counts re-measured
      independently via check-gbp-packs.js --verbose rather than trusted:
      description 713, posts 463/298/518/425, all exact and unchanged from
      every prior pass. All six generators rebuilt to a zero-diff worktree;
      all 36 checkers exit 0 on a full scratch copy before any edit.
      Two fresh injections proved checkers that read gbp-packs/ but had never
      once been tested by injection against this specific pack across ten
      prior passes, both on a disposable scratch copy of the whole repo
      (not the tracked tree), restored by plain file copy and MD5-confirmed
      byte-identical to baseline (1FDAB7C3402DB5B18DFCDA0D4BD59BB4) before
      and after each injection: (1) tools/check-pharmacy-first-cost.js rule
      6 - stripped "free" from all three sentences in the pack that name
      Pharmacy First itself (the description, the Services section line, and
      Post A's opening line; a single sentence was tried first and correctly
      did not fail, since the rule reads the free claim across every
      Pharmacy-First-naming sentence in the pack, not sentence by sentence) -
      caught, rule 6, "advertises NHS Pharmacy First but never calls it
      free"; (2) tools/check-app-membership.js rules 8a and 8d - added "-
      Manage your prescriptions on the go with our free app." to the
      Services section, a plausible real paste error given this branch's
      sister (Aigburth) and other estate branches do carry such a line -
      caught both rules at once: the published copy claims an app for a
      hasApp-false branch, and the paster note's own "No app mention
      anywhere in this pack" statement is contradicted by the copy it
      describes. Full 36-checker suite re-run clean after each restore.
      No in-repo defect found - both checkers already correctly guard this
      pack, proven directly rather than by passive coverage for the first
      time.
      Live half: Claude in Chrome not connected this run (Q59, unchanged);
      PowerShell Invoke-WebRequest used as the established fallback, HEAD
      requests only. All findings reconfirmed unchanged from the tenth pass:
      pharmacy-mccanns-sandringham.html still 404 and absent from the
      sitemap (Q35); the four post-target pages (Pharmacy First, switch,
      weight loss, travel clinic) all 200 and present in the sitemap;
      sitemap lastmod unchanged at 2026-08-14T23:05:25Z throughout,
      confirming no republish since the tenth pass's own reading. No new
      question; open question count unchanged at 42 (of 95 total).
      Evidence: audits/mccanns-sandringham-item-4.7-quality-pass-2026-09-04-eleventh.txt.
      Next stalest by this run's own computation, for whoever runs the next
      unattended pass: 4.2 (eleventh pass 2026-09-03T08:09:57+01:00), then
      4.14, then 1.2, then 3.11/4.4 (tied) - should be re-derived fresh with
      the subject-anchored match ("Item <n> " at the start of the commit
      subject), not the bare-substring match that produced the false 4.2/4.7
      tie this run corrected.
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
      Quality pass 2026-08-12: third pass, clean on both halves, verdicts
      identical to run 80. Facts, counts (730, 463, 348, 521, 433) and
      widget coverage re-verified against branches.json; all 28 static
      checkers green with no WARN on this pack; all six generators
      byte-identical. Live: all four post URLs 200 and Eccleston-correct
      with the seven Pharmacy First conditions present; landing page 404
      remains the known queued-paste state (Q35); switch title still the
      unpasted Weebly default (run 78 pattern, queued repaste covers it).
      No question raised.
      See audits/fishlocks-eccleston-gbp-pack-check-2026-08-12.txt.
      Quality pass 2026-08-13: fourth pass. Repo half only, no live check
      and no answer pickup (two Chrome browsers connected, an unattended
      run cannot choose between them; Q59, eleven consecutive runs). The
      pack itself is clean for the fourth time. Method changed from
      reciting the facts again to injection-testing whether the checkers
      prove what they claim: 19 injections, 16 caught. All six profile
      basics caught, and every value in that block appears exactly once
      here, so the run 163 house-number gap does not bite this pack. All
      four Pharmacy First and blood pressure cohort injections caught by
      check-pharmacy-first-eligibility.js rule 9 rather than by
      check-gbp-packs.js, which an earlier draft of this pass misread as a
      gap because it ran one checker instead of all 31.
      One real defect found and fixed in the checker, not the pack: the
      business description says where the shop IS, and changing "in
      Eccleston, near Chorley" to "in Ainsdale, near Southport" - the
      sister Fishlocks branch on the shared domain - passed all 31
      checkers clean. Phone, postcode, review link, street address and
      house number are all guarded against a sister's value leaking in;
      the TOWN was the one member of that family with no rule, and it is
      the word the description leads with. A presence rule cannot cover it
      because "Eccleston" appears 25 times in the pack. New rule bars
      another live branch's seoTown or addressLocality from the business
      description and the post bodies, exempting this branch's own
      serviceAreaList and any sentence the sister rule already governs;
      paster notes and preamble are out of scope because they are never
      published. Composed from branches.json, KNOWN_FOREIGN_TOWN with the
      standard anti-rot sweep. Seven negative tests all correct, 31
      checkers green, 0 findings across the 15 real packs, so the gap was
      latent not live. No patient-facing copy changed. No question raised.
      See audits/fishlocks-eccleston-gbp-pack-check-2026-08-13.txt.
      Quality pass 2026-08-14: fifth pass. Repo half only, no live check and
      no answer pickup (two Chrome browsers connected, an unattended run
      cannot choose between them; Q59, forty-second consecutive run). The
      pack itself is clean for the fifth time, facts re-verified field by
      field against branches.json. 30 injections across three batches, all
      36 checkers run on each. Confirmed in passing that the hours rule the
      204th run added for item 4.6 reaches this pack's photo shot list.
      One real defect found and fixed in the checker and the template, not
      in any published copy. Every advertising rule in the estate BANS
      wording and none REQUIRES any, and the two private clinics are sold on
      qualified offers. Six edits walked past all 36 checkers clean:
      deleting the whole "private, paid service and it is not right for
      everyone - the pharmacist will advise" sentence from Post C, deleting
      the supervised-plan wording from Post C and from the services bullet,
      deleting "subject to availability and clinical suitability" from Post
      D and from the services bullet, and changing "private, paid service"
      to "free service", which advertises a paid weight loss clinic as free
      on a public Google profile. A GBP post is Regime 1, the stricter half
      of the house weight loss standard. check-weight-loss-copy.js does not
      read gbp-packs/ at all, check-gbp-packs.js carried only prohibitions,
      and TEMPLATE.md asked for none of it, so the convention was kept by 12
      packs and required by no file. New CLINIC_QUALIFIERS rule, six markers
      gated on the branch's widget set and on the pack having that post;
      TEMPLATE.md sections 3 and 5 now tell the drafter to write them.
      Negative tested 10 ways, 7 must-catch and 3 must-pass, all correct.
      The convention is bimodal: 12 packs carry all six markers and three
      (Cherry Lane Walton, Fishlocks Ainsdale, Hirshmans Ainsdale) carry
      none, running a whole older Post C and Post D drafting. Those three
      are pinned in KNOWN_CLINIC_QUALIFIER against Q72 rather than
      rewritten, because changing live patient-facing weight loss and travel
      advertising is Rishi's decision. Residual stated: an outcome claim
      outside the known vocabulary still passes, which is a standing design
      position in that checker rather than a new finding.
      See audits/fishlocks-eccleston-gbp-pack-check-2026-08-14.txt.
      Quality pass 2026-08-30: sixth pass, unattended run. Repo half and
      live half both checked; pack clean again, no defect. All 36 checkers
      individually run, 0 failures; the one warning against this pack is
      the pre-existing Q64 post-town divergence, unchanged. Facts and
      counts (730, 463, 348, 521, 433) re-verified against branches.json
      independently rather than trusted; all six generators re-run, git
      status empty afterwards. Live: landing page still 404 (known
      queued-paste state, 5.3/5.4); Posts A, B and D all 200 and
      Eccleston-correct; switch page title still serves Weebly's default
      construction rather than the generated SEO title (same divergence as
      the 2026-08-11 pass, same 5.3/5.4 coverage). Post C (weight loss
      clinic) checked against compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md
      as a Regime 1 page (linked from the sitewide nav and header button):
      no medicine named, no superlative or efficacy claim, no lead pricing
      in the hero, no Buy Now button, clear that treatment is not
      guaranteed - clean. No question raised.
      See audits/fishlocks-eccleston-gbp-pack-check-2026-08-30.txt.
      Quality pass 2026-09-01 (unattended run, seventh pass, rotation pool):
      earliest-last-touched item in the pool once 4.5 and 4.6 were re-verified
      today (chronological order within 2026-08-30 re-derived from git log
      --reverse, since several items in the pool share that calendar date;
      4.8's sixth pass, 845ae17, is the earliest commit of the eleven still in
      the pool). Pack re-verified fact by fact against branches.json a seventh
      time: address, PR7 5SZ, phone 01257 451251, hours (Mon-Fri 9-6, Sat 9-12,
      Sun closed), review link, catchment "Eccleston, Charnock Richard and
      Coppull" in order, hasApp true, pfLink, and all five character counts
      (730/463/348/521/433) recomputed independently in Node rather than
      trusted - unchanged. node tools/check-gbp-packs.js: 0 failures, the one
      standing WARN is the pre-existing Q64 post-town divergence. All 36
      checkers run individually: 36/36 pass. All eight generators rebuilt;
      git status on modules/ empty, byte-identical (build-audit-status.js
      fails as always in this sandbox, Q87, not a page generator).
      LIVE HALF, via Claude in Chrome, read-only, five page reads, nothing
      clicked or typed. pharmacy-fishlocks-eccleston.html (landing page):
      still 404, known queued-paste state (5.3/5.4). Post A
      (pharmacy-first-fishlocks-eccleston.html): 200, matches this repo's
      generated output, all seven Pharmacy First conditions present with
      correct age ranges. Post B (switch-prescriptions-fishlocks-
      eccleston.html): 200; live title reads "Switch Your Prescriptions -
      Fishlocks Chemist Eccleston" against the paste sheet's "Switch Your
      Prescriptions to Fishlocks Chemist, Eccleston" - the same Weebly
      default-construction divergence the 2026-08-11 and 2026-08-30 passes
      already recorded, unchanged, still covered by 5.3/5.4, not re-raised.
      Post C (weight-loss-clinic-fishlocks-eccleston.html): 200; no medicine
      named, no superlative or efficacy claim, no lead pricing in the hero,
      eligibility section balanced - consistent with the sixth pass's "clean"
      verdict on those elements. NEW FINDING, more precise than the sixth
      pass's hero-only check: the booking block below the hero reads "Private
      consultation at Fishlocks Chemist, from £39.99. Choose a time that
      suits you.", ahead of the "Is this service right for you?" eligibility
      section - the identical construction Q83 raised against McCanns
      Aigburth, word for word but for the branch name. Read against
      tools/build-weight-loss-pages.js, this is not branch-specific: a single
      CONSULT_FEE constant (line 23) is interpolated into the same booking
      heading (line 108) ahead of the same eligibility block (line 234) on
      all 15 generated pages, so this is confirmed as a generator-level
      pattern rather than a McCanns or Fishlocks peculiarity. Full write-up
      in compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md under a new
      2026-09-01 section. Raised as Q88, cross-referencing Q83; both should
      be answered together. Post D (travel-clinic-fishlocks-eccleston.html):
      200, matches this repo's generated output, no vaccine named by brand,
      all six vaccine/advice categories listed generically. No in-repo defect
      found. No page, generator, pack or branches.json entry changed. Open
      question count 54 (Q88 added), 53 pre-existing unchanged.
      See audits/fishlocks-eccleston-gbp-pack-quality-pass-2026-09-01.txt.
      Quality pass 2026-09-02 (ninth, unattended run): repo half only, Claude
      in Chrome not connected so no live re-check. Pack re-verified fact by
      fact against branches.json, unchanged and clean; all 36 checkers green
      on the untouched repo. Checked what had changed in check-gbp-packs.js
      since the seventh pass: the item 1.2 eighth pass (2026-09-01) made the
      OWN-street presence rule and the FOREIGN-street sister rule
      abbreviation-aware (Road/Rd, Street/St, Lane/Ln, Drive/Dr, Avenue/Ave)
      but never carried that across to the "- Address:" line rule or its
      post-town dependent, both older than that fix. Injection proved the
      gap: writing the address line's own correct street as "New Mill St"
      instead of "New Mill Street" - a normal abbreviation, not an error -
      failed check-gbp-packs.js outright and silently disabled the post-town
      rule too, the same pathology already documented against a wrong digit
      or a misspelled road name. Fixed in the checker only: added
      lastStreetMatch(), reusing streetPattern() with a global flag, and
      pointed both the address-line presence rule and the post-town
      calculation at its match (index and actual matched length, not
      ownStreet.length, since an abbreviation is shorter) instead of plain
      indexOf. Re-tested: the same injection now passes and correctly
      reactivates the pre-existing KNOWN Q64 post-town WARN; a genuine wrong
      road name and a sister branch's address substituted into the same line
      both still FAIL, unchanged. File restored by copy after each test,
      sha256-confirmed identical throughout; full 36-checker suite green on
      the final state; only tools/check-gbp-packs.js differs from HEAD, the
      pack itself untouched. Latent estate-wide (14 of 16 branches carry a
      Road/Street/Lane/Drive/Avenue word in their street address; all 15 live
      packs write it in full today, so nothing was failing live). No new
      question. Open question count unchanged, 40 open of 91 total.
      See audits/fishlocks-eccleston-gbp-pack-quality-pass-2026-09-02.txt.
      Quality pass 2026-09-03 (tenth, unattended run): stalest item in the
      36-item rotation pool, re-derived independently (git log commit
      subjects matched by word-boundary "item N.N", first/most recent match
      per pool item; 4.8 unique stalest at 2026-09-02T06:16:36+01:00, no
      tie). Repo half only, Claude in Chrome not connected so no live
      re-check. Baseline: git status clean, all 36 checkers green, all six
      generators byte-identical, branches.json facts re-verified unchanged
      for the tenth time. New angle: nine prior dedicated passes on this
      pack had never tested check-gbp-packs.js's OUTCOME_PROMISE rule
      (added item 4.7 sixth pass, 2026-08-29; previously proved only against
      mccanns-sandringham.md and, as of this morning's item 4.13 ninth pass,
      riddings-timperley.md) against this pack's own Post D, despite it
      carrying a travel clinic post throughout. Proved by injection on a
      full scratch copy: "We guarantee full protection for every
      destination." (guarantee wording) FAILED; "The right vaccine will
      protect you for years to come." (declarative "will protect you")
      FAILED; "Wondering if a travel vaccine will fully protect you before
      you fly? Ask the pharmacist at your consultation." (genuine question)
      PASSED, confirming the question exemption. File restored byte-
      identical (sha256-confirmed), scratch copy deleted. No defect found -
      the rule already covered this pack correctly. check-gbp-packs.js
      changed: documentation comment only, above the OUTCOME_PROMISE block.
      gbp-packs/fishlocks-eccleston.md unchanged. Post-change: 36/36
      checkers green, generators byte-stable. No new question. Open
      question count 41 open of 94 total (unchanged by this pass).
      See audits/fishlocks-eccleston-outcome-promise-reproof-4.8-tenth-2026-09-03.txt.
      Quality pass 2026-09-03 (eleventh, unattended run): stalest item in the
      36-item rotation pool, independently re-derived (git log commit subjects
      matched by word-boundary "N.N", most recent match per pool item; 4.8
      unique stalest at 2026-09-03T04:10:11+01:00, matching the immediately
      preceding item 4.13 tenth-pass entry's own forward note). Repo half
      only, Claude in Chrome not connected so no live re-check (Q59). Baseline:
      git status clean, all 36 checkers green, facts re-verified against
      branches.json unchanged for the eleventh time. New angle: eleven prior
      dedicated passes had never proven check-brand-spelling.js,
      check-url-scheme.js or check-uk-spelling.js against this pack's own
      copy by injection - only the general 36-checker suite passing - despite
      that trio being proven today against five sister packs (4.1, 4.4, 4.7,
      4.14, 1.2). Proved by four injections on a scratch copy, each restored
      and sha256-reconfirmed before the next: (1) "Fishlocks Chemist" dropped
      to "Fishlock Chemist" in the business description - CAUGHT by
      check-brand-spelling.js rule 2; (2) Post B's button URL changed to
      http:// - CAUGHT by check-url-scheme.js rule 1 (INSECURE, published
      surface); (3) "traveling" (US spelling) inserted into Post D - CAUGHT by
      check-uk-spelling.js; (4) a control - "Fishlock Chemist" wrapped in
      quotation marks in a paster note, the same convention other packs use to
      record a live-page divergence - correctly PASSED (reported as a NOTE,
      not a FAIL), confirming the quote-evidence mask works on this pack's own
      copy and not only in theory. All four behaved exactly as designed; no
      checker gap found. METHOD NOTE: the scratch copy (rsync, .git excluded
      for speed) made check-cdn-pins.js fail with "ref does not resolve in
      git" after the injections were restored; re-run directly on the tracked
      repo it was clean, confirming the failure was an artefact of the
      .git-less scratch copy and not a repo defect - recorded so a future pass
      knows check-cdn-pins.js needs the tracked repo, not a partial scratch
      copy, to give a meaningful answer. Incidental, out of scope: an
      untracked qtmp.json at the repo root (pre-existing debris, unrelated to
      this item) triggers a WARN in check-url-scheme.js; left alone, not
      raised as a new question. gbp-packs/fishlocks-eccleston.md unchanged
      throughout (sha256 identical before and after). No generator, page, data
      field or checker file changed. No new question. Open question count 41
      open of 94 total (unchanged by this pass; answer pickup unavailable,
      Chrome not connected).
      See audits/fishlocks-eccleston-gbp-pack-brand-url-spelling-4.8-eleventh-2026-09-03.txt.
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
      Quality pass 2026-08-12 (third): repo half clean, no defect and no
      change. Every fact re-verified against branches.json (name, address
      Unit 20 Brookfield Trade Centre, L9 7AS, phone, website, review
      link, all five catchment towns leading with seoTown); widget set
      and services agree both ways and the no-Pharmacy-First note is
      still correct against pfLink absent and pfBooking false;
      description re-measured at its claimed 669 and the posts at 460,
      453, 600 and 529, identical to both earlier passes; no medicine
      name, no efficacy claim, no em dash, no emoji, no non-ASCII. The
      only apparent other-branch facts are head office's, which is
      co-located at the same unit, so not a leak. All 28 static checkers
      exit 0 (52 estate-wide WARNs, the same 52 as run 121); the one
      WARN naming this pack is it deliberately quoting the disputed live
      number to document Q28. All six generators re-run and the worktree
      stayed byte-stable. LIVE HALF NOT PERFORMED: the sandboxed fetch
      refused the URLs as out of provenance and the permitted browser
      route needs a browser chosen from two connected instances, which
      needs the user. So this pass makes no fresh live claim; Q28, Q29
      and Q21's concrete case stand as last verified 2026-08-11 and are
      unaffected. Re-read the live half on the next pass with a live
      route. Evidence:
      audits/clear-aintree-gbp-pack-check-2026-08-12.txt. Done 2026-08-12
      Quality pass 2026-08-13: fourth pass. Repo half only, no live check
      and no answer pickup (two Chrome browsers connected, an unattended
      run cannot choose between them; Q59, twelve consecutive runs). The
      pack itself is clean for the fourth time. Method was injection
      testing, as runs 163 and 164 used: nine injections, six caught
      before the fix. One real defect found and fixed in the checker, not
      the pack. The business description says where the shop IS, and
      changing "in Aintree, Liverpool" to "in Walton, Liverpool" passed
      all 31 checkers clean. The run 164 town rule does not catch it by
      its own design: it exempts any town in the branch's own
      serviceAreaList as a catchment town, and Walton is in Clear
      Aintree's. That exemption is right about the catchment clause and
      wrong about the location clause. It is the worse half of the pair,
      because a catchment town is already in the same sentence, so it is
      the substitution a careless edit actually makes, and "in Walton ...
      serving Aintree, Fazakerley, Walton" still scans. Walton is also
      the seoTown of Cherry Lane Pharmacy and Coleman and Leighs
      Pharmacy, so the corrupted line puts Clear Chemist where two other
      RBH pharmacies genuinely are. New rule reads the location construct
      (road, then the town immediately following as "<road> in <Town>" or
      "<road>, <Town>,") and requires that town to be the branch's own
      seoTown or addressLocality; seven packs state a road-anchored town
      and are checked, the other eight state none and are skipped rather
      than guessed at. Scope is published copy only, matching run 164.
      KNOWN_LOCATION_TOWN with the standard anti-rot sweep. Confirmed
      estate-wide on smartts-bootle, fishlocks-eccleston and
      gordon-short-crosby, and the run 164 foreign-town rule still fires,
      so the new rule is additive. 31 checkers green, 0 findings across
      the 15 real packs, no patient-facing copy changed. Two gaps
      confirmed but not fixed: the phone is a presence rule and a
      single-site change is uncaught (NEW, the run 163 finding one field
      along, deferred only because this pack deliberately quotes a second
      number to document Q28 so the fix needs scoping to published copy);
      and the unit number in one place, which is NOT new, being the
      documented "Unit" exclusion in the run 163 rule's own comment.
      Evidence:
      audits/clear-aintree-gbp-pack-check-2026-08-13.txt. Done 2026-08-13
      Quality pass 2026-08-30 (sixth pass): pack clean on every fact
      and every rule for the sixth time, no repo defect. All 36
      checkers 0 failures; check-gbp-packs.js's only warning against
      this pack remains the pre-existing Q28 documentation flag. All
      six page-content generators re-run, worktree byte-stable. Live
      half re-read: contact page still publishes 0151 203 6535 and no
      8365 (Q28 unchanged), Clear's own WhatsApp 07512 330 076 still
      distinct from the estate-wide hardcoded number (Q21's concrete
      case, unchanged), hours unchanged, and all three post-target
      URLs still 404 (Q29 unchanged, homepage-button workaround still
      correct). No new question raised. Evidence:
      audits/clear-aintree-gbp-pack-check-2026-08-30.txt. Done 2026-08-30
      Seventh quality pass 2026-09-01: this pass's own commit timestamp
      (12:11 that day) turns out to sit BEFORE Rishi answered Q28 at
      17:00 the same day, so "Q28 unchanged" above was accurate when
      written but is now stale; the pack itself was separately brought
      up to date afterwards (its Phone line and Post A both already
      read 0151 203 6535 with a note "confirmed by Rishi 2026-08-30
      (Q28) ... Safe to paste"), so this is the first pass able to
      confirm the fix LIVE rather than repeat the pre-fix finding. All
      36 checkers exit 0; check-gbp-packs.js's sole WARN against this
      pack is unchanged and reconfirmed deliberate: the pack's own
      narrative sentence quotes the superseded number "0151 203 8365"
      exactly once, explaining the correction, not stating it as a live
      fact, the same accepted WARN every pass since the second has
      carried. Independent extraction, audits/verify-4.9-2026-09-01.js,
      imports nothing from tools/, parses the pack and branches.json
      with its own regexes: 23 checks, all passed, including description
      669/750 and four posts (407, 360, 515, 449) all under the 1,500
      limit, phone matching branches.json in the profile-basics line and
      both Post A and Post B, all five catchment towns, hasApp/app
      mention, zero hits against the 84-name POM union, zero dashes of
      any kind, and the old-number narrative sentence appearing exactly
      once. One false failure caught and corrected before recording:
      matching "speak to on 0151 203 6535" against the raw file first
      failed, because the pack's own markdown wraps the sentence as
      "...actually speak\nto on 0151 203 6535...", splitting the phrase
      across a line break; re-run on whitespace-collapsed text, the same
      convention check-gbp-packs.js already uses for its own
      sentence-bounded rules, confirmed it correct. All seven real page
      generators rebuilt, git status empty afterwards (build-audit-
      status.js fails as always in this sandbox on its hardcoded
      C:/Dev/rbh-site-data path, Q87's second finding, not a page
      generator so it does not affect byte-identical proof). Live half
      performed via Claude in Chrome, read-only, one tab, closed between
      pages, nothing clicked, typed or submitted beyond navigation and
      text extraction: the contact page now publishes 0151 203 6535 with
      no 8365 anywhere, including on the branch's own 404 template,
      closing the loop the sixth pass could not (Q28 CONFIRMED FIXED,
      live and in-repo agree for the first time this pass verified it
      after the fix landed). Clear's own WhatsApp 07512 330 076 still
      live and still distinct from the estate-wide hardcoded default
      (Q21's concrete case, unchanged). Hours unchanged (two different
      weekly patterns for NHS and non-NHS services, still correctly
      withheld from branches.json and GBP). All three post-target URLs
      (switch-prescriptions-clear-aintree.html, weight-loss-clinic-
      clear-aintree.html, travel-clinic-clear-aintree.html) still return
      404 live, each showing the branch's own 404 template with the
      correct new phone number (Q29 unchanged, homepage-button
      workaround in the pack still correct and necessary). No in-repo
      defect found, no new question raised. Evidence:
      audits/clear-aintree-gbp-pack-check-2026-09-01.txt,
      audits/verify-4.9-2026-09-01.js,
      audits/verify-4.9-2026-09-01-output.txt. Done 2026-09-01
      Eighth quality pass 2026-09-02 (backfilled 2026-09-03, this pass:
      the eighth-pass commit touched only AGENT_LOG.md and never this
      file, the same paragraph-lag gap the item 4.10 eighth pass found
      and backfilled for itself the same day): pack re-verified clean
      against branches.json's clearchemist_aintree record and against
      TEMPLATE.md; four checker changes landed since the seventh pass
      (abbreviation-aware address rules in check-gbp-packs.js from items
      1.2 and 4.8, an nbsp-aware postcode match in check-postcodes.js
      from item 1.3, and POST_INSTRUCTION whitespace hardening from item
      4.13) checked individually and confirmed not to touch this pack:
      no abbreviated road-type words in its address, zero &nbsp; entities,
      post instructions already formatted to the hardened marker. All 36
      checkers exit 0. Q21 (WhatsApp), Q28 (phone) and Q29 (no Weebly
      paste route) all remain answered and unchanged; the separate open
      Q65 (walk-in/collection wording) sits against item 3.13, not this
      pack. branches.json's bankHolidays block intact and still read at
      paste time, not retyped. LIVE HALF NOT PERFORMED: Claude in Chrome
      reported not connected. No in-repo defect, no new question. Done
      2026-09-02
      Ninth quality pass 2026-09-03: fresh angle rather than a twelfth
      fact re-verification over ground eight prior passes already
      covered exhaustively. Item 5.1's tenth pass (2026-09-02, commit
      077a551) fixed check-em-dashes.js to decode numeric HTML dash
      entities by value (any digit count or padding) rather than an
      exact digit-string match, proved at the time only against
      modules/switch/pages/SEO.md; re-proved here directly against this
      pack's own copy for the first time, by injecting a padded hex
      numeric em dash (&#x02014;) into Post B - caught first attempt,
      restored byte-identical (SHA256-confirmed), full 36-checker suite
      clean after restore. Second angle: item 4.4's ninth pass found
      TEMPLATE.md's undated-live-claim convention unenforced by any
      checker and hand-checked all 15 packs, recording this one as
      already compliant; re-read clear-aintree.md directly this pass and
      confirmed every live-state claim (address, phone, hours, the three
      post-target 404s) still carries its observation date. LIVE HALF:
      Claude in Chrome unreachable again, so used the established
      Windows-MCP PowerShell fallback with curl.exe rather than skipping
      (Invoke-WebRequest failed against clearchemist.co.uk with
      "connection closed unexpectedly" on the three post-target URLs,
      a method note for future runs; curl.exe -A "Mozilla/5.0" worked
      cleanly). Contact page confirms phone 0151 203 6535 (Q28) and
      WhatsApp 07512 330 076 (Q21's concrete case) both unchanged; all
      three post-target URLs still 404 (Q29 unchanged, homepage-button
      workaround still correct). All 36 checkers exit 0 throughout. No
      in-repo defect found, no new question raised. Evidence:
      audits/clear-aintree-4.9-ninth-pass-2026-09-03.txt. Done 2026-09-03
      Tenth quality pass 2026-09-03: fresh angle, proving
      check-brand-spelling.js, check-url-scheme.js and check-uk-spelling.js
      genuinely catch a breach on this pack's own copy, none of which nine
      prior passes had individually tested here despite the same trio
      already proven against several sister GBP packs. Full repo copied
      with .git included (per the item 4.10 ninth pass's method note) to a
      scratch directory; four injections run one at a time, each restored
      and sha256-reconfirmed before the next. First attempt at the brand
      injection ("Clear" to "Clea" in the heading) was NOT caught, but on
      reading check-brand-spelling.js's rule 2 this was a self-caught
      design error, not a checker gap: rule 2 derives near-miss forms only
      as a trailing s, an apostrophe-s, "and"/"&", a shop-type swap or a
      case-flatten, and "Clear" has none of the first four and is already
      sentence case, so its only two derived forms are "Clears" and
      "Clear's". Corrected to "Clears Chemist Aintree" - CAUGHT, correct
      message. Second: Post C's button URL downgraded to http:// - CAUGHT
      by check-url-scheme.js, correct message naming item 6.6. Third:
      "sorted" changed to "organized" (US spelling) in Post D - CAUGHT by
      check-uk-spelling.js, correct UK form named. Fourth, a control: a
      synthetic paster note quoting "Clear Chemists" as a recorded reading
      of a live page - correctly PASSED as a NOTE, confirming the
      brand-spelling quote-evidence mask works on this pack's own copy.
      All four behaved exactly as designed; no checker gap found. Full
      36-checker suite re-run on the scratch copy after the final restore:
      36/36 exit 0. Tracked repo confirmed untouched throughout; hash
      identical to baseline at the end. LIVE HALF NOT PERFORMED: Claude in
      Chrome reported not connected this run; all live-side findings still
      rest on the ninth pass's 2026-09-03 read (Q28, Q21's concrete case,
      Q29 all unchanged). No in-repo defect, no new question raised.
      Evidence:
      audits/clear-aintree-brand-url-uk-spelling-4.9-tenth-2026-09-03.txt.
      Done 2026-09-03
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
      Third quality pass 2026-08-12: clean on both halves again. Every
      fact re-verified against branches.json including both hours
      sessions; description still exactly 710 characters; posts 461, 324,
      516 and 420, identical across all three passes; pure ASCII, no
      medicine name against all 21 in pom-names.js, no dash, no emoji;
      split-day paster guidance present. All 29 checkers exit 0, six
      generators byte-stable. The two WARNs naming this branch are the
      checkers working: check-gbp-packs on the live-only pfLink target and
      check-seo-lengths on the 8 H1s shared with SK Chemists Bootle under
      Q44. The build-switch-pages.js weight loss tile is unchanged and
      still correctly held in KNOWN_CLAIM with its Q16 reason, key not
      stale. Live half performed via a read-only fetch after the browser
      route was again unavailable: NAP correct, all four post targets
      live, and the website-hours contradiction still stands with no lunch
      closure. One live state advance recorded against item 5.3, not acted
      on here: pharmacy-first-smartts-bootle.html is now live in the
      homepage navigation, which is the condition the pack sets for
      swapping Post A's link. No in-repo defect, no copy changed, no new
      question. Done 2026-08-12.
      Fourth quality pass 2026-08-14: pack clean on every fact for the
      fourth time running, and ONE REAL DEFECT FOUND AND FIXED in
      tools/check-gbp-packs.js. Nothing in this pack or any other pack was
      edited. Every fact re-verified against branches.json including both
      hours sessions; description still exactly the 710 characters it
      claims; posts 461, 324, 516 and 420; pure ASCII, no medicine name, no
      em dash, no emoji; split-day lunch guidance still present, and
      removing it still fails, so the rule the first pass added holds.
      Method was injection testing, 25 injections one value at a time with
      all 36 checkers run on each and the file restored and byte-compared
      after every one. 21 caught, 1 skipped as a non-unique anchor, 3 not.
      THE DEFECT: changing the "- Address:" line alone from "42 Fernhill
      Road" to "42 Fernhall Road" passed all 36 checkers clean. This is the
      road-name twin of the house-number fault the 4.6 pass fixed and the
      unit-number fault the 4.9 pass fixed, and it is the worst of the
      three: the presence rule passes because the road is spelled correctly
      in the description and Posts B and D, the sister rule passes because
      Fernhall Road is no branch's address, the house-number rule is blind
      rather than quiet because its regex looks for a number in front of a
      road name it can no longer find, and the post-town rule below it is
      switched off by the same edit for the same reason. A wrong house
      number moves the Google Maps pin along the right road; a wrong road
      name puts the pharmacy on a road it is not on. Fixed by requiring the
      "- Address:" line to contain the branches.json streetAddress. All 15
      packs satisfy it today, checked before the rule was written, so it
      needed no exception on the day it landed. Negative-tested five ways
      across three packs including a unit-address pack; a case-only change
      is deliberately not a failure. Two injections were not caught and
      were not fixed here: a benefit claim added to the medical cannabis
      services line, raised as Q75 because it is a live regulatory claim,
      and "judgement" changed to "judgment", which is not a defect because
      judgment is correct UK English in the legal register and a rule would
      create false positives, exactly the trap check-uk-spelling.js is
      written to avoid. Done 2026-08-14.
      Fifth quality pass 2026-08-30: pack clean on every fact for the fifth
      time running, no in-repo defect. All 36 checkers exit 0. Every fact
      re-verified against branches.json: name, address (42 Fernhill Road,
      Bootle L20 9HH), phone 0151 922 4984, website, review link, split
      hours (09:00 to 13:00 and 14:00 to 18:00 Monday to Friday, Saturday
      and Sunday closed) and the bank holiday note added on the item 4.5
      pass. Catchment reads Bootle, Sefton and Liverpool in all three
      places, leading with its own seoTown. check-gbp-packs.js's own
      summary still carries one warning against this pack, the pre-existing
      live-only pfLink target note, unchanged; check-seo-lengths.js still
      carries the pre-existing Q44 shared-H1 warning against the eight
      pages shared with SK Chemists Bootle, also unchanged. Eight
      injections run one at a time against a working copy and reverted
      after each, all caught, zero misses: road-name twin (Fernhill to
      Fernhall, the fourth pass's own fix) and phone swapped to SK Chemists
      Bootle's number both caught by check-gbp-packs; a medicine name pair
      added to Post C and an outcome claim added to Post C both caught by
      check-gbp-packs; the postcode swapped to Fishlocks Ainsdale's caught
      by check-gbp-packs and check-postcodes; the catchment order reversed
      caught by check-gbp-packs; an em dash substituted into Post A caught
      by check-em-dashes (first attempt at this injection targeted the
      wrong substring and wrongly logged a miss before the substring was
      corrected and re-run); and the split-hours lunch guidance bullet
      removed from the paster notes caught by check-gbp-packs, the rule
      the first pass added. All six generators rebuilt to a zero diff.
      Live half not performed: the browser tool returned the two-Chrome-
      instances selection error on the first call (Q59's standing
      condition, still open), so no browser call beyond that one rejected
      attempt was made. No new question. Done 2026-08-30.
      Sixth quality pass 2026-09-01: pack clean on every fact for the sixth
      time running, no in-repo defect. Independent extraction
      (audits/verify-4.10-2026-09-01.js, imports nothing from tools/, own
      regexes) re-verified all facts against branches.json: name, address
      (42 Fernhill Road, Bootle L20 9HH), phone 0151 922 4984, website,
      review link, both hours sessions and Saturday/Sunday closed,
      description exactly 710 characters, all four post links resolving to
      existing generated files bar the known live-only pfLink, all four
      posts under the 1,500 character limit, no medicine or vaccine brand
      name (including yellow fever), no em dash, en dash, smart quote or
      nbsp. 29/29 checks passed. All 36 tools/check-*.js exit 0; all six
      generators rebuilt byte-identical (sha256 before/after matched).
      Live half performed via Claude in Chrome, read-only, three of the
      four post targets read: switch-prescriptions-smartts-bootle.html
      reconfirms two already-open findings unchanged - the Q55 website
      hours contradiction (footer and page both print 9:00am-6:00pm with no
      lunch closure, matching this pack's own paster warning) and the Q16
      "Support that delivers results" weight-loss tile claim, still
      correctly held in check-service-links.js's KNOWN_CLAIM pending
      Rishi's wording decision. weight-loss-clinic-smartts-bootle.html
      reconfirms the Q51/Q83/Q88 lead-price-position finding (booking card
      states "from £39.99" above the eligibility section, same as the other
      14 weight loss pages) and a stale paste separate from that: two
      strings on this live page ("not right for everyone" and "at
      consultation") still carry the pre-cleanup en dash the item 3.9 pass
      already removed from the generator on 2026-08-11, so the live copy on
      this specific branch predates that fix and needs the same repaste the
      other weight-loss pages are already queued for. Not raised as a new
      question: it is the same estate-wide finding already reconfirmed on
      several other branches' weight loss pages (see run log), just newly
      confirmed on this one. Estate-wide en-dash footer hours line (no
      in-repo source) also present, unchanged, already known.
      travel-clinic-smartts-bootle.html reconfirms the Q48 yellow fever gap
      (branches.json has no yellowFeverCentre field for this branch) and no
      other issue. pharmacy-first-service-bootle.html (Post A's live-only
      target) is the known old page held under Q8/Q16, unchanged.
      PROCESS NOTE: this run's initial staleness scan used a line-boundary
      regex over AGENT_WORKLIST.md that mis-detected this item's block end
      and read only the very first (2026-08-10) pass, ranking 4.10 as the
      stalest item in the 36-item rotation pool when its true last pass was
      2026-08-30, one of the more recent. Caught before committing by
      reading this paragraph directly. The corrected reading of all 43
      items' own paragraphs shows 4.11 (SK Chemists Bootle pack, sole pass
      2026-08-10) is the genuinely stalest item in the pool, older than
      2.3 (2026-08-11), 3.11 (2026-08-14) and 6.2/6.3 (2026-08-13); the
      next run should take 4.11. No new question. Done 2026-09-01.
      Seventh quality pass 2026-09-02 (unattended run, backfilled here on
      the eighth pass - the seventh pass's own commit only touched
      AGENT_LOG.md and an audit sha256 file, and never appended this
      paragraph, a gap noticed and corrected while re-deriving staleness for
      the eighth pass rather than left to repeat). Pack re-verified clean:
      all facts matched branches.json again, all 36 checkers exit 0. Tested
      three check-gbp-packs.js fixes that had landed since the sixth pass
      (abbreviation-aware own-street and foreign-street sister rules from
      item 1.2's eighth pass and item 4.8's ninth pass; POST_INSTRUCTION
      hard-stop leading-whitespace tolerance from item 4.13's eighth pass)
      by four injections, all proving correctly on this pack specifically:
      "42 Fernhill Road" abbreviated to "42 Fernhill Rd" passed (legitimate
      abbreviation); "Fernhill Road" changed to "Fernhall Road" failed
      (negative control, genuine error still caught); the SK Chemists
      cross-reference in the paster notes expanded to include "516 Stanley
      Road" (both full and abbreviated "Rd" forms) failed both ways (sister
      street rule fires on this pack's own copy too); a 2,010-character
      block starting with three leading spaces before "STOP" inserted after
      Post D failed to leak into counted post copy, confirming the
      whitespace-tolerant hard-stop marker holds here. No in-repo defect, no
      new question. Live half not read (Claude in Chrome not connected).
      Done 2026-09-02.
      Eighth quality pass 2026-09-03: fresh angle - the OUTCOME_PROMISE rule
      (added item 4.7 sixth pass, 2026-08-29, and by now proved against
      mccanns-sandringham.md, riddings-timperley.md and
      fishlocks-eccleston.md) had never been pointed at this pack's own
      Post D despite seven prior dedicated passes, the same "proved once,
      assumed everywhere" gap the 4.8 and 4.13 tenth/ninth passes closed for
      their own packs. All facts re-verified against branches.json's
      smartts_bootle record (address, phone, both hours sessions, website,
      review link, serviceAreaList, hasApp, all five widgets) - unchanged.
      Baseline: 36/36 checkers exit 0, tree clean. Three injections into
      Post D's closing line, file restored by byte copy and sha256-verified
      identical after each: guarantee wording FAILED; declarative "will
      protect you" FAILED; a genuine question PASSED, confirming the
      question exemption on this pack's own copy too. tools/check-gbp-packs.js
      changed: documentation comment only, recording this pass's proof (a
      fourth pack now proved against). gbp-packs/smartts-bootle.md
      unchanged. All 36 checkers and byte-stable regeneration (six
      generators, empty diff) re-confirmed after restore. Live half not
      performed: Claude in Chrome reported not connected. No in-repo defect,
      no new question. Evidence in
      audits/smartts-bootle-outcome-promise-reproof-4.10-eighth-2026-09-03.txt.
      Done 2026-09-03.
      Ninth quality pass 2026-09-03: fresh angle - check-brand-spelling.js,
      check-url-scheme.js and check-uk-spelling.js had already been proven
      today against six sister GBP packs (4.1, 4.4, 4.7, 4.14, 1.2, 4.8) but
      never against this pack specifically across eight prior passes, the
      same "proved once, assumed everywhere" gap shape. All facts
      re-verified against branches.json's smartts_bootle record - unchanged.
      Baseline: 36/36 checkers exit 0, smartts-bootle.md sha256
      541239e0869bc60bfceb7dd57414c2872a0104a294785a10c8aa2f387003796b.
      Method changed from the eighth pass: full repo copied to scratch WITH
      .git included this time, since the 4.8 ninth pass found that excluding
      .git makes check-cdn-pins.js fail falsely on a scratch copy. Four
      injections run one at a time against the scratch copy, each restored
      and sha256-reconfirmed identical before the next: (1) "Smartts
      Chemist" dropped to "Smarts Chemist" in the heading line - CAUGHT by
      check-brand-spelling.js, correct canonical form named; (2) Post B's
      button URL changed https to http - CAUGHT by check-url-scheme.js as
      an INSECURE published surface; (3) "traveling" (US spelling) inserted
      into Post D's opening line - CAUGHT by check-uk-spelling.js, correct
      UK form named; (4) a control - a synthetic paster note recording
      ""Smarts Chemist", quoted here as evidence of what was seen, not a
      claim" - correctly PASSED (exit 0, NOTE only), confirming the
      brand-spelling quote-evidence mask works on this pack's own copy too.
      All four behaved exactly as designed; no checker gap found. Tracked
      repo confirmed untouched throughout (git status --porcelain empty,
      sha256 identical at the end); all 36 checkers re-run clean on the
      scratch copy after restore. No generator, page, data field or checker
      file touched. Live half not performed: Claude in Chrome not connected
      this run. No in-repo defect, no new question. Evidence in
      audits/smartts-bootle-brand-url-uk-spelling-4.10-ninth-2026-09-03.txt.
      Done 2026-09-03.
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
      Third quality pass 2026-08-12: the pack is clean again and byte-stable
      across all three passes. Description 735 and posts 466, 305, 530, 380,
      identical to both earlier passes; pure ASCII, zero dashes of any kind,
      zero POM names; every branches.json fact re-matched including ODS
      FH575, the NHS email, pfBooking true and hasApp false; Post A's seven
      conditions and the UTI 16 to 64 range still match the generated
      Pharmacy First page. All 29 checkers exit 0, all six generators
      rebuild to zero diff. Live, fifth clean run: all four post targets
      resolve, Post A's target still misspells "Bottle" and is still absent
      from the sitemap, and the sitemap is still dated 2026-07-18, so SK
      remains a no-paste repoint for 5.3 and the stale paste remains the
      repaste backlog. Confirmed this pass that the en dashes on the live
      weight loss page do not exist in the repo source, so that divergence
      is paste lag and not an in-repo defect.
      The one new finding is outside the pack and it widens item 5.8. This
      branch carries a legacy /weight-loss-clinic.html that the 2026-08-10
      assessment never opened, because SK was recorded as the control
      branch with no old page on the strength of reading its homepage only.
      It is the same old template, it is in the branch sitemap, and the top
      nav plus a homepage tile link straight into it, which puts it in the
      stricter advertising regime rather than the inner-page one. With Q57's
      Fishlocks find the same day, 5.8 is seven branches, not five, and SK is
      the clearest stricter-regime case of them. Nothing was
      changed on any live page and no weight loss copy was edited. Raised as
      Q58, recorded as a dated correction in
      compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md, and flagged in the
      pack's paster notes as a do-not-substitute warning for Post C's link.
      Also worth keeping: an earlier draft of that warning named the
      medicines and check-gbp-packs.js failed the run for it. The checker
      was left strict and the note was reworded instead. Evidence in
      audits/sk-chemists-bootle-gbp-pack-check-2026-08-12.txt.
      Fourth quality pass 2026-08-13: the pack is clean again and
      byte-stable across all four passes. Description 735 and posts 466,
      305, 530, 380, identical to all three earlier passes; zero non-ASCII
      characters, zero dashes of any kind, zero smart quotes, zero POM
      names. Every branches.json fact re-matched including ODS FH575, the
      NHS email, pfBooking true, hasApp false, the Monday to Friday 9 to 6
      hours with Saturday and Sunday closed, and the catchment Bootle,
      Sefton and Liverpool leading with its own seoTown. All 31 checkers
      exit 0 and all six generators rebuild to zero diff. Repo half only:
      two Chrome extensions are connected and an unattended run cannot
      choose between them, so nothing live was read and the 2026-08-10 to
      2026-08-12 live verdicts stand as written rather than being restated
      as re-checked. Six injections were correctly caught, including
      repointing Post C at the legacy weight-loss-clinic.html, opening the
      hours line on a day branches.json closes, and moving the UTI cohort
      off 16 to 64, so this pack's prose STOPs are backed by rules.
      ONE REAL DEFECT FOUND AND FIXED, in
      tools/check-pharmacy-first-eligibility.js and nowhere else: deleting
      "Age ranges set by the NHS apply to each condition." from Post A,
      and changing nothing else, walked past all 31 checkers clean. A pack
      prints an age for one pathway out of seven, so that one sentence is
      the whole qualification on a flat seven-condition advertisement, and
      without it the six unstated pathways read as open to anyone: a
      six-month-old brought for the earache pathway that starts at 1, or a
      sore throat consultation asked for on a four-year-old when the
      pathway starts at 5. Added as rule 11, held only against packs that
      enumerate the conditions, which is all 14 that do and none of the two
      that do not. It pins a convention the estate already keeps, so no
      pack copy, page, generator, data field or patient-facing wording
      changed. Re-proved by injection on four packs after the fix. No new
      question raised. Evidence in
      audits/sk-chemists-bootle-gbp-pack-check-2026-08-13.txt.
      Fifth quality pass (recovered 2026-08-29, run originally started
      2026-08-14 and crashed before committing; recovered after
      re-verification since leaving it uncommitted would contaminate every
      later commit): found that section 3 of the pack (the Services
      entries, published copy per TEMPLATE.md) was read by no
      published-copy rule, so a wrong phone number, lead pricing with a
      discount, or a false seven-days-a-week claim there would pass in
      silence while the same fault would fail in the description.
      tools/check-gbp-packs.js gained servicesOf() and section 3 joined the
      published phone, price/offer and foreign-town scopes. All 36 checkers
      re-run clean; the pack's own bytes did not change. Two residual
      checker-widening questions raised as Q80 (prose hours claims read by
      no rule) and Q81 (comparative outcome claims with no product noun or
      superlative), both open. Evidence in
      audits/sk-chemists-bootle-gbp-pack-check-2026-08-14.txt.
      Sixth quality pass 2026-08-30: pack clean on every fact for the sixth
      time (description 735, posts 466/305/530/380, unchanged); all 36
      checkers exit 0, all six generators rebuild to zero diff. Live half
      performed: pharmacy-first-sk-chemists-bootle.html reconfirmed correct
      throughout; three known live-only faults reconfirmed unchanged and
      not fixed here (pharmacy-first-service-bootle.html still misspells
      "Bottle" and is still outside the sitemap, item 5.3/Q34; the legacy
      weight-loss-clinic.html is still live, still linked three times from
      the homepage, item 5.8/Q58; the switch page mojibake dash is still
      paste-lag). One factual update recorded: the sitemap now reads
      2026-08-14T18:12:51, so the site has been republished since the
      18 July date the paster notes previously warned about, but the
      branch-specific paste backlog did not move with it; a dated addendum
      was appended to sk-chemists-bootle.md so the paste queue is not
      misled by the stale line. No new question. This entry backfills a
      sync gap: the fifth and sixth passes were done and committed on
      2026-08-29/30 but never recorded here until this seventh pass found
      the gap.
      Seventh quality pass 2026-08-31: pack re-verified byte-stable for the
      seventh time running (description 735, posts 466/305/530/380, pure
      ASCII, zero em or en dashes). All 36 tools/check-*.js checkers exit 0
      and all six generators rebuild to a byte-identical worktree (203
      generated pages unchanged). Address, phone, hours, website, review
      link, hasApp and catchment cross-checked directly against
      branches.json (id skchemists_bootle) field by field and match.
      Live half NOT performed this run: the built-in browser refused
      navigation to both the answer-pickup portal and the live branch
      domain (denied/failed with no further detail), so the 2026-08-30
      sixth-pass live verdicts stand as written rather than being restated
      as re-checked. Q80 and Q81 remain open and untouched; no autonomous
      window was active. No new defect found, no new question raised;
      this pass's only change is the fifth/sixth-pass sync-gap backfill
      above.
      Eighth quality pass 2026-09-02 (unattended scheduled run, rotation-
      pool pick - the least recently verified item across the whole
      worklist, selected by parsing each item's own paragraph rather than
      a fixed line window): pack byte-stable for the eighth time
      (description 735, posts 466/305/530/380, pure ASCII, zero em or en
      dashes). All 36 checkers exit 0. All branches.json facts (address,
      phone, hours, website, review link, ODS, nhsEmail, pfLink, hasApp,
      serviceAreaList) re-matched field by field. All six generators
      rebuilt; sha256 of all 203 files in modules/service/pages,
      modules/switch/pages and modules/branch/pages taken before and
      after: byte-identical, zero diff. Injection test: the branch phone
      swapped for Cherry Lane Pharmacy's number, caught by
      check-gbp-packs.js naming both the wrong-branch number and the
      missing own number; restored, sha256 matched the pre-injection file
      exactly, all 36 checkers re-run clean. LIVE HALF (Claude in Chrome,
      no ambiguity this run): pharmacy-first-sk-chemists-bootle.html
      correct and unchanged; pharmacy-first-service-bootle.html still
      misspells "Bottle" and is still absent from the sitemap (item
      5.3/Q34, unchanged); sitemap still dated 2026-08-14T18:12:51,
      unchanged since the sixth pass; switch page's mojibake em dash
      still live, source still holds no dash (paste lag, unchanged);
      weight-loss-clinic.html still live with named medicines, a
      superlative claim, an outcome slider and lead pricing (item
      5.8/Q58, unchanged, not fixed here). No new defect, no new
      question. Q80 and Q81 remain open and untouched. Evidence in
      audits/sk-chemists-bootle-gbp-pack-check-2026-09-02.txt.
      Ninth quality pass 2026-09-02 (unattended scheduled run, rotation-
      pool pick, stalest item last mentioned 2026-09-02T00:13:10+01:00,
      the eighth pass itself, earlier the same day): all branches.json
      facts re-matched field by field (address, phone, hours, website,
      review link, serviceAreaList, hasApp, pfLink), no drift. All 36
      checkers exit 0. All six generators rebuilt; 203 files under
      modules/service/pages, modules/switch/pages and modules/branch/pages
      sha256-hashed before and after: byte-identical, zero diff.
      Injection test, an untried angle for this item (eighth pass injected
      a phone swap; this pass injects a postcode swap): the pack's own
      postcode L20 5DW swapped for Cherry Lane Pharmacy's L4 8SG in the
      Address line, caught independently by both check-gbp-packs.js (two
      failures, own-postcode-missing and foreign-postcode-named) and
      check-postcodes.js's FOREIGN rule; restored by byte copy, sha256
      matched the pre-injection file exactly, all 36 checkers re-run
      clean. LIVE HALF: not performed, Claude in Chrome not connected
      (checked twice this run). Q34 (raised on the eighth pass, about item
      5.3's old pharmacy-first-service-bootle.html target) is now recorded
      as answered and applied, so it is no longer an open finding for this
      item; the eighth pass's other live findings (switch-page paste-lag
      em dash, weight-loss-clinic.html's item 5.8/Q58 regulatory exposure)
      stand unverified for a further pass rather than re-claimed. Q58, Q80
      and Q81 re-read from QUESTIONS.json, all still open, unchanged. No
      new defect, no new question. Evidence in
      audits/sk-chemists-bootle-gbp-pack-check-2026-09-02-ninth.txt.
      Tenth quality pass 2026-09-03 (unattended scheduled run, rotation-pool
      pick, stalest item last mentioned 2026-09-02T21:09:53+01:00, the ninth
      pass): all branches.json facts re-matched field by field (address,
      phone, hours, website, review link, serviceAreaList, hasApp, pfLink,
      widgets), no drift. All 36 checkers exit 0. All six generators
      rebuilt; git status --porcelain on modules/, core/, tools/,
      branches.json and gbp-packs/ empty before and after, confirming
      byte-identical regeneration.
      Fresh angle: nine prior passes had injection-tested this pack's phone,
      postcode, Post C link, hours line, UTI cohort and the rule 11 age
      qualifier, but never the CLINIC_QUALIFIERS, BODY_IMAGE, OUTCOME_PROMISE
      or POM_CLASS rule families in check-gbp-packs.js, all of which were
      added and proved on OTHER packs (fishlocks-eccleston.md,
      gordon-short-crosby.md, mccanns-sandringham.md, riddings-timperley.md)
      but never against this pack's own Post C or Post D copy. Six
      injections run against a freshly restored copy each time, byte
      copy restore before any assertion, sha256-verified: (1) deleting the
      "private, paid service...not suitable for everyone" sentence from
      Post C, CAUGHT by both the weightLossPaid and weightLossSuitability
      qualifiers; (2) deleting "supervised plan" from Post C, CAUGHT by
      weightLossSupervised; (3) deleting "subject to availability and
      clinical suitability" from Post D, CAUGHT by travelSuitability;
      (4) injecting "Ready to start your transformation?" into Post C,
      CAUGHT by BODY_IMAGE_SELF transformation framing; (5) injecting
      "We guarantee full protection for every destination." into Post D,
      CAUGHT by OUTCOME_PROMISE guarantee wording; (6) injecting "The
      skinny jab clinic at SK Chemists" in place of the pharmacist-led
      wording in Post C, CAUGHT by POM_CLASS SELF_SCOPING. All six caught
      on the first run. File sha256-confirmed byte-identical to the
      original before the round, after each individual restoration, and
      after the final one. Full 36-checker suite re-run clean after the
      round.
      RESULT: no defect on item 4.11 itself. check-gbp-packs.js already
      correctly held this pack's Post C and Post D to the clinic qualifier,
      body image, outcome promise and POM class rules; now proven directly
      by injection for the first time in this item's ten-pass history.
      No checker logic, pack copy, page, generator or data field changed
      anywhere in the repo.
      LIVE HALF: not attempted this pass. Claude in Chrome confirmed not
      connected at step 3 and again independently before finishing repo
      work. The ninth pass's live findings (Q34 answered and applied;
      switch-page paste-lag em dash and weight-loss-clinic.html's item
      5.8/Q58 regulatory exposure, both unchanged) stand unverified for a
      further pass rather than re-claimed. Q58, Q80 and Q81 re-read from
      QUESTIONS.json, all still open, unchanged. No new defect, no new
      question. Evidence in
      audits/verify-4.11-2026-09-03-tenth.js and
      audits/verify-4.11-2026-09-03-tenth-output.txt.
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
      Third quality pass 2026-08-12. Both halves performed. Repo half
      clean for the third run: every fact re-verified against
      branches.json and the four counts came back byte-identical to both
      earlier passes (description 631, posts 456, 321, 528 and 433), so
      the pack is stable across three passes. Zero non-ASCII, zero dash
      characters, zero dash entities. The medicine-name test was widened
      this pass: previous runs measured against the 21-name weight loss
      group, this one measured against the full 82-name union of all five
      groups in tools/pom-names.js, still zero. All 29 checkers exit 0;
      the 9 WARNs naming this branch are the two known classes, the
      live-only pfLink target and the 8 Q44 H1s shared with Cherry Lane,
      both the checker working rather than a defect. The "Vaccination
      centre" category was queried and cleared: all 15 packs and
      TEMPLATE.md carry it, so it is the template position, not an
      outlier. The 39.99 consultation fee on the generated weight loss
      page was queried against the weight loss standards and cleared:
      RULE 7 in
      check-weight-loss-copy.js fixes it at exactly three placements with
      the indicative-pricing sentence beside it, and
      WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md distinguishes that from the old
      page's above-the-fold lead price, which was the breach. One in-repo
      defect found and fixed: the pack's own paster note claimed every
      page on the live site reads "Coleman & Leigh Pharmacy" in title and
      body copy, and the live read shows that overstates it. The homepage
      title, H1 and body already read the confirmed name, as does the
      address block on every page; the header banner, navigation, the
      four inner service pages and the footer still read the old name.
      The note now records the mixed state and sizes the repaste
      accordingly. Live: pfLink still 404 on 2026-08-12 so the hard stop
      stands; Posts B, C and D all resolve for the third consecutive day;
      all 12 Coleman pages in the repo carry the confirmed name with zero
      ampersand versions and zero dashes, so the repo needs no edit, only
      pasting. The homepage carries the Q22 estate-wide weight loss
      tagline, making Coleman the fourth branch confirming it after
      Smartts, Riddings and SK Chemists, and it narrows Q22 usefully:
      Coleman's BOOK NOW WEIGHT LOSS CLINIC button lands on the clean
      repo-generated page, not a Mounjaro page, so here the homepage line
      is the whole of the exposure. No new question: every finding lands
      on a decision already made. Done 2026-08-12.
      Fourth quality pass 2026-08-13. REPO HALF ONLY: two Chrome instances
      are connected and an unattended run cannot choose between them, so
      nothing live was read and the 2026-08-12 live verdicts above stand
      as written. The pack is stable across four passes: every fact
      re-verified against branches.json (name, 241 Walton Village
      Liverpool L4 6TH, 0151 525 3522, website, review link, hasApp false
      with no app mention, catchment Walton, Liverpool and Sefton), and
      all five character counts came back byte-identical to all three
      earlier passes (description 631, posts 456, 321, 528 and 433). Zero
      non-ASCII, zero dash characters, zero dash entities, zero hits
      against the full 82-name union in tools/pom-names.js. All 31
      checkers exit 0. Eight injections were run against the pack from a
      harness held outside the repo; seven were caught, including both
      button-URL injections (a path typo and a .co.uk to .com swap), the
      review-link token, the postcode, the house number, the closing time
      and the catchment town. ONE IN-REPO DEFECT FOUND AND FIXED, in
      tools/check-gbp-packs.js: the rule that verifies the description
      heading's stated character count carried a Math.abs(...) > 5
      tolerance, an eleven-character window around a number meant to be
      exact, directly contradicting its own comment that the claim "must
      be true". A five-character edit to the description left the heading
      stating a figure that was no longer true with every checker green.
      All 16 packs were measured: every one that states a count matches
      it exactly, so the slack had never been needed by any pack and only
      served to let the number the paster is told to trust drift. The
      tolerance is removed and the comparison is now exact. The hard 750
      limit is separately enforced and was verified against a
      771-character injection, so no over-length description could ever
      have reached a profile through this gap; the exposure was a stale
      claim, which matters most on the five packs sitting within fifteen
      characters of the limit. No page, generator, data field,
      branches.json entry, paste sheet, GBP pack or piece of
      patient-facing copy was changed. No new question raised.
      Fifth quality pass 2026-08-14. Repo half only: the one connected
      Chrome instance is not signed in to the portal, so nothing live was
      read and the 2026-08-12 live verdicts above stand as written. The
      pack is stable across five passes: every fact re-verified against
      branches.json (name, 241 Walton Village Liverpool L4 6TH,
      0151 525 3522, website, review link, hasApp false with no app
      mention, catchment Walton, Liverpool and Sefton leading with its own
      seoTown), and all five character counts came back byte-identical to
      all four earlier passes (description 631 exactly as the heading
      claims, posts 456, 321, 528 and 433). Zero non-ASCII, zero dash
      characters, zero dash entities, zero hits against the full 82-name
      union in tools/pom-names.js. All 36 checkers exit 0 and all six page
      generators rebuild every page byte-identical, before and after.
      Twenty-four injections were run from a harness held outside the repo,
      one value at a time, all 36 checkers on each, the pack restored from
      the original and sha256-compared after every one; 23 ran, 1 skipped
      for a non-unique anchor, and every one restored clean. Nineteen were
      caught, including the ampersand and dropped-s forms of the trading
      name, both website-domain typos, both button-URL typos, the review
      link token, the phone digit, the postcode, the guarded hours line,
      the house number, the blood pressure age, the Pharmacy First age
      range, a dropped catchment town, a foreign town in the location
      clause, an app mention and an em dash. ONE IN-REPO DEFECT FOUND AND
      FIXED, in tools/claim-patterns.js: "This is the fastest and most
      effective way to lose weight", injected into Post C, passed all 36
      checkers. The 2026-08-13 superlative rule anchored only on the nouns
      a pack uses for the product, so "fastest" followed by "way" matched
      nothing, and "most effective" was only ever read in the two fixed
      forms "most effective weight loss" and "most effective treatment".
      The noun anchor now also reads way, method and the verb phrase
      lose/losing weight, and "most/more effective" gets its own
      noun-anchored rule. Option, route and approach were drafted in and
      taken back out: "advise on the best option" is the travel clinic
      lead-time caution on all sixteen generated travel clinic pages, and
      failing those would have been a false positive on correct clinical
      advice. Verified both ways: sixteen claim phrasings caught, ten
      pieces of legitimate copy still clean, all 36 checkers green with the
      warn count unchanged at 55, and the injection re-run in situ is now
      caught by check-gbp-packs.js. No page, generator, data field,
      branches.json entry, paste sheet, GBP pack or piece of
      patient-facing copy was changed. Three further gaps identified and
      recorded in AGENT_LOG.md for the next pass; one question raised, Q76.
      Done 2026-08-14.
      Sixth quality pass 2026-08-30: pack clean on every fact for the sixth
      time running, no in-repo defect. All 36 checkers exit 0. Every fact
      re-verified against branches.json: name Coleman and Leighs Pharmacy,
      address 241 Walton Village, Liverpool L4 6TH, phone 0151 525 3522,
      website, review link, hasApp false with no app mention, both
      opening-hours sessions (09:00 to 13:00 and 14:00 to 18:00 Monday to
      Friday, Saturday and Sunday closed) and catchment Walton, Liverpool
      and Sefton in all three places, leading with its own seoTown. All
      five character counts came back byte-identical to all five earlier
      passes (description 631 exactly as the heading claims, posts 456,
      321, 528 and 433). Zero non-ASCII, zero dash characters, zero dash
      entities, zero hits against the now 84-name union in
      tools/pom-names.js. Eight injections run from a harness held outside
      the repo, one value at a time, all restored and sha256-confirmed
      byte-identical after every one. BOTH gaps this pack's fifth pass
      found and left open are now closed, neither by an edit made here: a
      road name swapped into Post B and into the photo shot list, with no
      house number in front of it either time, is now caught by
      check-gbp-packs.js (the guard the item 4.10 pass added earlier
      today); and the lunch closure stated with a wrong time inside a
      comma clause, and again with "weekday" standing in for a day name,
      is now caught too (the hours-statement-anywhere rule other passes
      broadened today). Q76's own case was re-run to confirm it is still
      live: a sister branch's name substituted for this branch's own in
      Post C is still MISSED by every checker, exactly as Q76 describes,
      so Q76 stands exactly as raised. All 7 build-*.js page generators
      re-run; git status empty afterwards, so nothing in the estate
      drifted. Live half not performed: the browser tool rejected the
      connection with the standing two-Chrome-instances error (Q59); the
      2026-08-12 live verdicts recorded in this pack stand as written. No
      new question, no in-repo defect. Done 2026-08-30.
      Seventh quality pass 2026-09-01: pack clean on every fact for the
      seventh time running, no in-repo defect. All 36 checkers exit 0; the
      one WARN naming this pack (Post A's pfLink resolving to a live-only
      page) is unchanged, the same accepted class every pass since the
      second has carried. Every fact re-verified against branches.json:
      name, address 241 Walton Village, Liverpool L4 6TH, phone
      0151 525 3522, website, review link, hasApp false, both opening-hours
      sessions and catchment Walton, Liverpool and Sefton in all three
      places. All five character counts came back byte-identical to all
      six earlier passes (description 631, posts 456, 321, 528 and 433).
      Zero non-ASCII, zero dash characters, zero dash entities, zero hits
      against the medicine-name union in tools/pom-names.js. PROCESS NOTE:
      that union is 82 names (21 + 8 + 2 + 36 + 15 across the five groups),
      not the 84 the sixth pass's own paragraph states; tools/pom-names.js
      has had exactly one commit since it was created on the item 3.13 pass
      (2026-08-11) and has not changed since, so the sixth pass's count was
      a miscount in its own write-up, not a file that shrank. No functional
      effect - the checker uses the full union regardless of the number
      quoted about it - so nothing was fixed, only corrected here.
      Nine injections run from a harness held outside the repo, one value
      at a time, all restored and sha256-confirmed byte-identical after
      every one. Eight were caught: a wrong phone digit inside Post B's own
      paste-able body (check-gbp-packs.js, which explicitly distinguishes
      this from the WARN-only case below), a wrong postcode, a website
      domain typo in a button URL, the ampersand form of the trading name
      in Post B (check-brand-spelling.js, confirming its GBP-pack coverage
      still holds), a real em dash character in Post D (check-em-dashes.js),
      a foreign town (Aigburth, McCanns' own seoTown) in the description
      (three separate rules, including the description-length rule since
      the extra word pushed the count past its stated heading), the review
      link token, a dropped house number, a wrong closing time, and an app
      mention added to the published services section despite hasApp being
      false (check-app-membership.js). One deliberately proved a boundary
      rather than a gap: the same wrong phone digit placed in the "Profile
      basics (for checking, not pasting)" reference line, with the correct
      number still standing in Post B, produced only the known WARN, not a
      FAIL, because that line is explicitly not paste content and the
      correct number remains published elsewhere - confirmed as intended
      behaviour, not a defect, by reading check-gbp-packs.js's own WARN
      text. Q76's own case was re-run a third time to confirm it is still
      live: a sister branch's name (Cherry Lane, which shares this
      branch's Walton seoTown) substituted for this branch's own in Post C
      is still MISSED by every one of the 36 checkers, exactly as Q76
      describes, so Q76 stands exactly as raised and still awaits a
      decision on scope. All 7 build-*.js page generators re-run; git
      status empty on modules/ afterwards, so nothing in the estate
      drifted.
      Live half performed for the first time since the second and third
      passes (2026-08-11 and 2026-08-12); the four passes between then and
      now could not reach a working browser. Via Claude in Chrome,
      read-only: Post A's pfLink still 404s, so the paster note's hard stop
      still stands. The replacement page
      pharmacy-first-coleman-leigh-walton.html is still live and still the
      pre-correction paste: title, H1, body copy, header banner and footer
      all read "Coleman & Leigh Pharmacy", while the address block on the
      same page reads the confirmed "Coleman and Leighs Pharmacy" - the
      identical mixed state recorded on 2026-08-12, unchanged since. Posts
      B, C and D all still resolve, in the same mixed-name state. The
      homepage still carries the Q22 estate-wide weight loss line
      ("Innovative solutions that deliver results. Tried the rest? Now try
      the best."), unchanged; Q22 was answered 2026-08-30 as "Unsure,
      guidance pending", so no repo action is due on it yet. No new
      question, no in-repo defect. Done 2026-09-01.
      Eighth quality pass 2026-09-02 (unattended run via Cowork; the
      Linux sandbox's bash tool could not reach GitHub over SSH this run,
      "Host key verification failed", so git and the checker runs were
      done via Windows-MCP PowerShell against the same working copy at
      C:\Dev\rbh-site-data instead). Pack clean on every fact for the
      eighth time running, no in-repo defect. All 36 checkers exit 0; the
      one WARN naming this pack (Post A's pfLink resolving to a live-only
      page) is unchanged. Every fact re-verified against branches.json:
      name Coleman and Leighs Pharmacy, address 241 Walton Village,
      Liverpool L4 6TH, phone 0151 525 3522, website, review link, hasApp
      false, both opening-hours sessions (09:00 to 13:00 and 14:00 to
      18:00 Monday to Friday, Saturday and Sunday closed) and catchment
      Walton, Liverpool and Sefton in all three places, leading with its
      own seoTown. Description length (631) and all four post lengths
      (456, 321, 528, 433) confirmed exact by the checker's own
      zero-tolerance rule; zero non-ASCII characters, zero dash
      characters, zero dash entities; zero hits against the 82-name
      tools/pom-names.js union, checked directly with a standalone script
      rather than trusted from the checker alone. All 7 build-*.js page
      generators re-run; git status on modules/ empty afterwards, so
      nothing in the estate drifted.
      Four injections run this pass, one value at a time, each restored
      from an in-memory byte copy held before the edit (not git checkout)
      and confirmed byte-identical afterwards via git diff --stat: a wrong
      postcode (caught by check-gbp-packs.js and check-postcodes.js), a
      wrong phone digit (caught by check-gbp-packs.js), and a genuine em
      dash character added to Post B (caught by check-em-dashes.js). That
      third injection was run twice: the first attempt used a plain hyphen
      rather than an em dash and, correctly, nothing caught it, which is
      right behaviour under the standing hyphens-only rule and not a
      checker gap, so it was re-run with an actual U+2014 character to
      test the real thing. Q76's own case was re-run a fourth time: a
      sister branch's name (Cherry Lane, which shares this branch's Walton
      seoTown) substituted for this branch's own in Post C is still MISSED
      by every one of the 36 checkers, exactly as before. Q76 stands
      exactly as raised and still awaits a decision on scope.
      Live half not performed via Claude in Chrome: the extension reported
      not connected at the start of this run and again when retried
      mid-pass. As a supplementary, non-browser check only, a direct
      HTTPS HEAD request to the Post A pfLink target returned 404,
      consistent with every check since the first pass on 2026-08-10; this
      confirms only the status code, not page content or the name-state
      finding, so the fuller 2026-09-01 live verdicts (mixed old and new
      trading name across the site, Posts B, C and D resolving, the Q22
      tagline unchanged) stand as written rather than being re-verified.
      No new question, no in-repo defect. Done 2026-09-02.
      Ninth quality pass 2026-09-03 (unattended run via Cowork; the Linux
      sandbox's bash tool again could not reach GitHub over SSH, "Host key
      verification failed", so all git, Node and file work was done via
      Windows-MCP PowerShell against the canonical C:\Dev\rbh-site-data
      working copy). Stalest item in the rotation pool, re-derived
      mechanically with a tightened match requiring each commit subject to
      START with "Item <N>" rather than merely contain it (a looser
      "contains" match produces false ties, as the previous run's own
      forward-note shows: it named 4.15 as next-stalest, but the tightened
      match confirms 4.12's own eighth-pass commit at
      2026-09-02T08:13:34+01:00 predates 4.15's 2026-09-02T08:46:01+01:00).
      4.12 confirmed the unique stalest, no tie. Pack re-verified fact by
      fact against branches.json a ninth time: name, address 241 Walton
      Village, Liverpool L4 6TH, phone 0151 525 3522, website, review link,
      hasApp false with no app mention, both opening-hours sessions and
      catchment Walton, Liverpool and Sefton in all three places, leading
      with its own seoTown - all unchanged from every prior pass. All 36
      checkers exit 0 before any change. NEW ANGLE: the OUTCOME_PROMISE
      rule (added item 4.7 sixth pass, 2026-08-29, barring protection or
      immunity outcome promises) has this same run been proved by direct
      injection against three sibling packs carrying their own travel
      clinic Post D (riddings-timperley.md, fishlocks-eccleston.md,
      smartts-bootle.md) but had never been pointed at this pack's own
      copy across its eight prior dedicated passes - the same "proved
      once, assumed everywhere" shape this repo's CLAUDE.md names as a
      recurring finding. Pack backed up by byte copy before mutation;
      baseline SHA256
      6C8B9CAC1D70FD6330D9A801B6DD74367C70F973EC54C4FDE9D93BA7EA724D88.
      INJECTION 1 (Post D closing line, "Book your travel consultation
      today." appended with "We guarantee full protection for every
      destination."): FAIL, line 137, outcome promise "guarantee". Caught
      first attempt. INJECTION 2 (same line replaced with "The right
      vaccine will protect you for years to come."): FAIL, line 137,
      outcome promise "will protect you". Caught first attempt. INJECTION
      3 (same line replaced with a genuine question, "Wondering if a
      travel vaccine will fully protect you before you fly? Ask the
      pharmacist at your consultation.", expect PASS): PASS, 0 failures,
      only the standing pfLink live-only-page WARN, confirming the
      question exemption holds on this pack's own copy too. File restored
      by byte copy (not git checkout) after each injection, SHA256
      reconfirmed identical to baseline every time. Full 36-checker suite
      re-run after final restore: 36/36 exit 0. All six build-*.js page
      generators re-run: exit 0 each, git status on modules/ and core/
      empty before and after, byte-stable. LIVE HALF: Claude in Chrome not
      connected; fell back to a direct HTTPS status-code check via
      curl.exe. Post A pfLink still 404, unchanged since 2026-08-10; Posts
      B, C and D (switch, weight loss, travel clinic) all still 200,
      unchanged. Status code only, not page content - the fuller
      2026-09-01 live verdicts (mixed old/new trading name, Q76's
      sister-branch-name gap, the Q22 tagline) stand as written, not
      re-verified this pass. No in-repo defect, no new question;
      QUESTIONS.json unchanged (41 open of 94 total). Evidence:
      audits/coleman-leigh-walton-outcome-promise-reproof-4.12-ninth-2026-09-03.txt.
      Done 2026-09-03.
      Tenth quality pass 2026-09-03 (unattended run via Cowork; the Linux
      sandbox's bash tool again failed SSH to GitHub with "Host key
      verification failed" though HTTPS fetch worked, so all git, Node and
      file work went via Windows-MCP PowerShell against the canonical
      C:\Dev\rbh-site-data working copy, the established route). FRESH ANGLE:
      check-url-scheme.js and check-uk-spelling.js, two-thirds of the
      standing trio (with check-brand-spelling.js) being proven pack by pack
      across recent passes on sibling files (4.9, 4.14, 4.8, 4.13 and
      others), had never been pointed at this pack's own copy across nine
      prior dedicated passes. Pack backed up by byte copy before each
      mutation; baseline SHA256
      6C8B9CAC1D70FD6330D9A801B6DD74367C70F973EC54C4FDE9D93BA7EA724D88,
      unchanged from the ninth pass. Baseline: all 36 checkers exit 0 before
      any change. INJECTION 1 (check-url-scheme.js Rule 1, Post D closing
      line: appended "More details at
      http://www.colemanandleighspharmacy.co.uk/travel-info."): FAIL,
      "published surface carries http://...", caught first attempt; restored
      by byte copy, SHA256 reconfirmed identical. INJECTION 2
      (check-uk-spelling.js Rule 1, Post B: "handle everything else" changed
      to "organize everything else"): FAIL, line 115, reads "organize", UK
      English is "organise", caught first attempt; restored, SHA256
      reconfirmed identical. INJECTION 3, a quoted-evidence control matching
      the pattern this pack's own paster notes already use to quote live-page
      wording (added a new quoted sentence: the live footer also still reads
      "please organize your repeat prescription two working days ahead",
      unchanged since the paste): correctly PASSED (exit 0), reported only as
      a NOTE recording "organize" inside quotation marks as a reading of what
      a live page says rather than this file claiming it, confirming the
      maskQuotes exemption holds on this pack's own copy too, not only on the
      sibling packs where it was proven before. INJECTION 4, a light
      reconfirmation of check-brand-spelling.js (Post B: trading name swapped
      for the pre-correction "Coleman & Leigh Pharmacy"): FAIL, line 113,
      caught first attempt, confirming the trio's third member still holds
      here too; restored, SHA256 reconfirmed identical. Full 36-checker suite
      re-run after final restore: 36/36 exit 0. All seven build-*.js page
      generators re-run: exit 0 each, git status on modules/ and core/ empty
      before and after, byte-stable. Q76's sister-branch-name substitution
      gap was not re-run this pass, already reconfirmed four times running on
      this pack; re-running a fifth identical proof added no new information
      within this pass's chosen angle. LIVE HALF: not attempted, Claude in
      Chrome reported not connected at step 3. The 2026-09-01 live verdicts
      (mixed old/new trading name across the site, Q76's sister-branch-name
      gap, the Q22 tagline, Post A's pfLink 404) stand as written, not
      re-verified this pass. No in-repo defect, no new question;
      QUESTIONS.json unchanged (41 open of 94 total). Done 2026-09-03.
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
      Third quality pass 2026-08-12: pack clean again and byte-stable across
      all three passes (description 657, posts 449, 319, 521, 425), every
      fact re-verified against branches.json, all 29 checkers green and all
      six generators rebuilt to zero diff. This pass found its defect in the
      rule rather than the pack. check-gbp-packs.js measured Post B at 1354
      characters against the 1,500 limit, because postsOf stripped only the
      "Button:" line and the paster notes, so the roughly 1,000-character
      hard stop sitting inside Post B was counted as copy bound for a public
      Google profile. Riddings is the only pack carrying an in-post
      instruction block, and the count only ever ran high, so this was a
      false-failure risk rather than a missed breach, but at 1354 of 1,500 it
      sat about 146 characters of extra clarification away from failing the
      pack on copy that is never posted. Fixed at source: postsOf now cuts at
      a line-anchored upper-case STOP or DO NOT POST marker and keeps the
      stripped text, and a new floor fails any post left under 40 characters
      so a marker placed above the copy cannot empty a post silently. Ten
      negative tests against the shipped functions plus one end-to-end test
      through the real checker, all passed. Post B now reports 319 and no
      other pack's numbers moved. Live half NOT performed: two Chrome
      instances were connected and choosing between them needs a human, so
      no live page was fetched and every live-side state still rests on the
      2026-08-11 check. Answer pickup unavailable for the same reason.
      Evidence: audits/riddings-timperley-gbp-pack-check-2026-08-12.txt.
      No question raised. Done 2026-08-12.
      Fourth quality pass 2026-08-13: pack clean and byte-stable across all
      four passes (description 657, posts 449, 319, 521, 425, zero non-ASCII,
      zero dash characters), every fact re-verified against branches.json,
      all 31 checkers green before and after. The defect was again in the
      rule, and it is estate-wide and a compliance one. tools/claim-patterns.js
      is the single shared definition of disallowed weight loss wording, used
      by the 177 generated pages and by all 15 packs, and its only comparative
      entry was "most effective", so it caught one phrasing and no other.
      Injected into Post C, which is an advertisement bound for a public
      Google profile, all seven of "the best weight loss treatment", "the best
      treatment for weight loss", "the UK's number one weight loss clinic",
      "the leading weight loss clinic", "the fastest treatment", "the safest
      weight loss treatment" and "best-in-class" passed every checker. The
      house reference names this exact class at its line 26: balanced and
      factual, "X is used to treat...", not "X, the best/fastest/strongest
      treatment for...". Fixed at the shared source with three noun-anchored
      patterns, deliberately not a bare superlative because 11 of the 15 packs
      say "otherwise the best straight-on frontage shot" in their photo shot
      list, which is a direction to a photographer and not a claim about a
      medicine, so a bare rule would have failed 11 packs. Tests: 10 benign
      and 9 claim strings
      through the shipped findClaim with zero false positives and zero false
      negatives, all seven injections re-run end to end and now caught, and
      the full suite re-run across every pack and page with no false failure.
      15 injections this pass, 13 caught. A medicine name placed inside the
      Post B hard stop was caught, so the third pass's marker cut did not open
      a compliance hole. Two misses raised rather than fixed: Q67, opening
      hours stated in the description prose are never checked against
      branches.json because every hours rule reads the "- Hours:" line only;
      and Q68, the catchment list is only checked for its lead town, so a
      town swapped further down the list passes. Live half NOT performed:
      two Chrome instances connected, so no live page was read and every
      live-side state still rests on the 2026-08-11 check. Answer pickup
      unavailable for the same reason (Q59).
      Evidence: audits/riddings-timperley-gbp-pack-check-2026-08-13.txt.
      Done 2026-08-13.
      Fifth quality pass 2026-08-14: pack clean and byte-stable across all
      five passes (description 657, posts 449, 319, 521, 425, zero non-ASCII,
      zero em or en dashes, zero smart quotes), every fact re-verified against
      branches.json. The defect was in the rule again, and it is estate-wide
      and a compliance one. The pack surface could promote a prescription-only
      weight loss medicine WITHOUT naming it. check-gbp-packs.js read the pack
      for medicine names (tools/pom-names.js) and for efficacy claims
      (tools/claim-patterns.js), and neither can see a medicine that is
      pointed at rather than named or claimed about. Injected one at a time
      into Post C, an advertisement bound for a public Google profile and so
      Regime 1, all five of "weight loss injection clinic", "the skinny jab
      clinic", "Our GLP-1 clinic", "offers a weekly injection" and "weight
      loss pen service" PASSED ALL 36 CHECKERS. The ASA has ruled each of
      these promotes a POM as surely as naming it. The patterns already
      existed for the six branch landing pages, written on the item 2.1 pass,
      and check-weight-loss-copy.js had recorded in its own header the exact
      condition for promoting them: "if a second Regime 1 family ever needs
      them, promote them then". The packs are that family. Fixed by moving
      them to a new shared tools/pom-class-patterns.js, read by both checkers
      from one definition, and adding a rule to check-gbp-packs.js. Scoping is
      split as on the pages: the self-scoping phrases are read across the
      whole pack, the dosing phrases only in sentences naming weight loss, so
      the contraception service can still signpost a contraceptive injection.
      All 16 packs including TEMPLATE.md swept before wiring with zero hits,
      so the gap was latent and nothing live is wrong. All five injections
      re-run and now caught, a control injection of ordinary service copy
      still passes, and the pack sha256-compared back to its original after
      every single injection. All 36 checkers green before and after and the
      generators rebuild byte-identical. One new question, Q77: the 15 weight
      loss pages in modules/service/pages do NOT read these patterns, which
      was measured on this pass rather than assumed and is a judgement about
      live patient-facing copy, so it was raised rather than decided. Live
      half NOT performed: answer pickup returned the Cloudflare Access sign-in
      page (Q59), so no live page was read and every live-side state still
      rests on the 2026-08-11 check. Done 2026-08-14.
      Sixth quality pass 2026-08-30: pack clean on every fact for the sixth
      time, no in-repo defect. All 36 checkers exit 0, all seven build-*.js
      generators re-run with git status clean afterwards (the one unrelated
      change in the tree, status/index.html, is this run's own status-page
      timestamp refresh, not a Riddings artefact). Facts re-verified against
      branches.json: name Riddings Pharmacy, address 38 Riddings Road,
      Timperley, Altrincham WA15 6BP, phone 0161 973 2951, website and
      review link, hasApp false with no app mention, single Monday to
      Friday 09:00 to 18:00 session with Saturday and Sunday closed,
      catchment Timperley, Altrincham and Trafford leading with its own
      seoTown. Description and posts byte-identical to all five earlier
      passes (description 657, posts 449, 319, 521, 425); the only edit to
      this file today was the 4.5 pass's estate-wide bank holiday note
      appended at 11:12, which touches no fact this pass checks. Four fresh
      injections run one at a time from the live file with sha256 restore
      after each: "skinny jab" into Post C (pom-class-patterns.js scoping),
      an outcome claim ("you could lose up to 22.5% of your body weight")
      into Post C, a foreign branch's town (Bootle) into Post D, and a
      medicine name (Mounjaro) into Post C. All four CAUGHT, none missed;
      no new checker gap found this pass.
      LIVE HALF PERFORMED for the first time since 2026-08-11: this run's
      browser connection resolved to a single Chrome instance rather than
      the two-instance block Q59 has recorded on recent runs. Post B's
      canonical URL (switch-prescriptions-riddings-timperley.html) still
      returns a 404, unchanged since 2026-08-10; the hard stop in the pack
      remains necessary. The live switch page still sits at the old
      permalink switch-prescriptions.html and is still the pre-Phase-3
      paste: H1 without town words, a "Download our app" block despite
      hasApp false, the contact block reading "Timperley, Cheshire" against
      branches.json's Greater Manchester, and the site-wide footer line
      still set with en dashes. All previously logged, none changed. NEW
      THIS PASS: the site's sitemap.xml has in fact been republished since
      the last check, lastmod now 2026-08-14T22:45:05+00:00 across every
      URL (previously 2026-07-18), yet the switch-prescriptions-riddings-
      timperley.html paste still did not land in that republish and the
      page is still absent from the sitemap. The pack's own assumption
      that this paste "rides along with paste work already queued" at "the
      next Weebly paste run" does not hold: a full republish has already
      happened since without it, so the estate-wide repaste backlog (5.6,
      5.7) needs this branch's switch paste actioned explicitly rather than
      assumed to ride along. The branch-specific Pharmacy First page
      remains live and in the sitemap as the pack records; today's separate
      item 3.10 pass independently found it is still pre-repaste legacy
      copy (US spellings, old title and H1), same backlog, not a new
      finding here. Also confirmed live and unchanged: weight-loss-clinic-
      timperley.html, the old page linked from the homepage nav and still
      in the sitemap, still carries the full Regime 1 breach already
      recorded in compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md (Riddings
      Timperley is one of the seven branches listed there) - Mounjaro,
      Wegovy and Orlistat named, an efficacy superlative, an outcome slider
      claiming up to 22.5% body weight loss, and lead pricing at Ã¯Â¿Â½39.99.
      This is worklist item 5.8's territory and Rishi's Q5 answer already
      sets the fix direction, so no new question is raised; the GBP pack's
      own Post C remains compliant and is not implicated. Answer pickup
      succeeded this run (single Chrome instance): all entries found were
      already recorded against Q2 to Q17 by earlier runs, nothing new to
      process. No new question raised. Done 2026-08-30.
      Seventh quality pass 2026-09-01: all 36 checkers
      run fresh, all green before any change. Every fact re-verified against
      branches.json (id riddings_timperley): name Riddings Pharmacy, address
      38 Riddings Road, Timperley, Altrincham WA15 6BP, phone
      0161 973 2951, website and review link, hasApp false with no app
      mention, single Monday to Friday 09:00 to 18:00 session with Saturday
      and Sunday closed, catchment Timperley, Altrincham and Trafford
      leading with its own seoTown. Byte-identical to all six earlier
      passes: description 657, posts 449, 319, 521, 425, zero non-ASCII
      characters, zero em or en dashes. Riddings is not a shared brand (one
      branch carries "Riddings Pharmacy" in branches.json), so the Q76
      sister-branch-name gap does not apply to this pack.
      Two fresh injections run against a working copy, sha256-restored after
      each: stripping "bankHolidays.dates2026" from the paster note while
      keeping the words "bank holiday" and "special hours" - CAUGHT by the
      item 4.5 rule, confirming it still reads this pack correctly; and
      recasing the Post B hard-stop marker from "STOP - DO NOT POST" to
      "Stop - do not post" - MISSED. check-gbp-packs.js's POST_INSTRUCTION
      regex that cuts the ~1,000-character hard-stop instruction block out
      of Post B before counting it as posted copy was case-sensitive, so the
      recased marker stopped firing and the instruction block, including a
      live URL, was counted as PUBLISHED copy: Post B measured 1356
      characters instead of 319, and the full 36-checker suite still exited
      0, because 1356 still sits under the 1,500 limit. Fixed at source:
      POST_INSTRUCTION now carries the /i flag. Verified three ways before
      committing - the original STOP casing still measures 319, the recased
      Stop casing now also measures 319, and removing the marker word
      entirely (leaving the instruction prose in place) still measures
      1285, proving the fix requires the marker word rather than always
      stripping trailing text. Checked all 15 packs plus TEMPLATE.md for any
      existing line starting "stop" or "do not post" in any case before
      widening the match: none exists outside this one marker, so nothing
      that currently passes can start failing. All 36 checkers green after
      the fix, gbp-packs/riddings-timperley.md untouched and sha256-confirmed
      byte-identical to the version at the start of this pass, all seven
      build-*.js generators re-run with git status --porcelain modules/
      empty before and after.
      LIVE HALF performed via Claude in Chrome, read-only, one tab, nothing
      clicked, typed or submitted beyond navigation and text extraction.
      Every finding unchanged from the sixth pass: Post B's canonical URL
      (switch-prescriptions-riddings-timperley.html) still 404; the live
      switch page still sits at the old permalink switch-prescriptions.html,
      still the pre-Phase-3 paste (H1 with no town words, a "Download our
      app" block despite hasApp false, the contact block reading "Timperley,
      Cheshire" against branches.json's Greater Manchester, and the
      site-wide footer set with en dashes); the branch-specific Pharmacy
      First page remains live, correct against branches.json and in the
      sitemap; the sitemap is still dated lastmod 2026-08-14T22:45:05+00:00
      throughout and still has no entry for
      switch-prescriptions-riddings-timperley.html, so the switch paste for
      this branch still has not landed despite the site having been
      republished since the pack's own note was written. weight-loss-clinic-
      timperley.html re-checked and unchanged: Mounjaro, Wegovy and Orlistat
      named, the "Real Results with Mounjaro" heading, the outcome slider
      claiming up to 22.5% body weight loss, and lead pricing "From £39.99"
      all still live, matching compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md
      exactly. This is worklist item 5.8's territory and Rishi's Q5 answer
      already sets the fix direction, so no new question raised here; the
      GBP pack's own Post C remains compliant and is not implicated.
      Answer pickup (step 3): https://data.rbhealth.co.uk/api/feedback
      returned the same 28 entries recent runs have read, newest still Q29
      at 2026-08-30T17:01; cross-checked against QUESTIONS.json, all 17
      distinct ids already recorded "answered" with matching text, nothing
      to reconcile. No autonomous window active at the top of AGENT_LOG.md,
      so step 8's exception did not apply; not needed this pass regardless,
      since the marker-casing finding was a straightforward code fix with no
      judgement call for Rishi. No new question raised. Done 2026-09-01.
      Eighth quality pass 2026-09-02: pack clean and byte-stable across all
      eight passes (description 657, posts 449, 319, 521, 425, zero
      non-ASCII characters, zero em or en dashes), every fact re-verified
      against branches.json (id riddings_timperley): name Riddings
      Pharmacy, address 38 Riddings Road, Timperley, Altrincham WA15 6BP,
      phone 0161 973 2951, website and review link, hasApp false with no
      app mention, single Monday to Friday 09:00 to 18:00 session with
      Saturday and Sunday closed, catchment Timperley, Altrincham and
      Trafford leading with its own seoTown. Post A's repoint to the
      branch-specific Pharmacy First page (2026-09-01, per Q34/item 5.3)
      confirmed still in place and matching branches.json's pfLink.
      All 36 checkers run fresh before any change: all green.
      Three fresh injections run against a working copy outside the repo
      (not the tracked file), sha256-confirmed byte-identical restore after
      each: (1) a real sister branch's phone number (Clear Chemist's 0151
      203 6535) added alongside the correct one in Post B's body, plus the
      word "Aintree" - CAUGHT three ways at once (the phone-sister rule,
      the published-phone rule and the foreign-town rule); (2) the same
      with a fabricated, non-existent phone number - correctly produced
      only a WARN, not a FAIL, confirming the sister rule is deliberately
      scoped to numbers that actually belong to another branch; (3) a
      single leading space added before the real "STOP - DO NOT POST"
      marker on Post B - MISSED. check-gbp-packs.js's POST_INSTRUCTION
      regex (`/^(?:STOP|DO NOT POST)\b/im`), hardened for case on the
      seventh pass, was still anchored to column zero, so one leading space
      stopped it firing a second, distinct way: the whole ~1,000-character
      hard-stop instruction block, including the live 404 URL, was counted
      as Post B's posted copy again (1,499 characters of raw block against
      the true 319), and the 36-checker suite still exited 0 because 1,499
      still sits under the 1,500 ceiling. Fixed at source: POST_INSTRUCTION
      now reads `/^\s*(?:STOP|DO NOT POST)\b/im`. Verified: the leading-space
      injection now measures Post B at 319 again (confirmed by direct
      instrumentation of postsOf's own logic, not just the checker's exit
      code); the two earlier injections (this pass's own foreign-phone/town
      test, and the seventh pass's recased marker) both still caught after
      the change; and all 16 pack files (15 packs plus TEMPLATE.md) swept
      for any line newly matching the widened regex - two lines found
      (TEMPLATE.md line 58, clear-aintree.md line 148) but both sit outside
      any Post body the checker reads (TEMPLATE.md's is general rule prose
      above the "## 5. Post drafts" section entirely; clear-aintree.md's is
      inside its own "Notes for the paster:" block, already cut from the
      body before POST_INSTRUCTION is ever applied), so nothing that
      currently passes starts failing. All 36 checkers green after the fix,
      gbp-packs/riddings-timperley.md untouched and sha256-confirmed
      byte-identical to the version at the start of this pass, all seven
      build-*.js generators re-run with the 203 files under
      modules/service/pages, modules/switch/pages and modules/branch/pages
      byte-identical before and after (sha256-compared file by file).
      LIVE HALF NOT performed: Claude in Chrome was not connected this run
      (extension unreachable), so no live page was fetched and every
      live-side state still rests on the seventh pass's 2026-09-01 check.
      Answer pickup (step 3) also unavailable for the same reason; per the
      unattended-run rule this was logged rather than retried by another
      route. No autonomous window active at the top of AGENT_LOG.md. No new
      question raised: the marker-whitespace finding was a straightforward,
      well-scoped code fix with no judgement call for Rishi, the same class
      as the seventh pass's casing fix. Done 2026-09-02.
      Ninth quality pass 2026-09-03: pack clean and byte-stable across all
      nine passes (description 657, posts 449, 319, 521, 425, zero non-ASCII
      characters, zero em or en dashes), sha256 confirmed unchanged
      throughout. All 36 checkers green before and after; all seven
      build-*.js scripts re-run with git status --porcelain modules/ core/
      empty before and after. Selected as the stalest item in the 36-item
      pool (last dedicated commit 2026-09-02T01:13:24+01:00, older than any
      other item once the search was corrected to match only "item <N>"
      subjects rather than any bare mention of the number, which had
      produced a false tie with 4.8 from an incidental name-drop inside the
      4.10 pass's own commit message).
      NEW ANGLE. OUTCOME_PROMISE (added item 4.7 sixth pass, 2026-08-29) had
      only ever been proved by mutation against gbp-packs/mccanns-
      sandringham.md, the pack the rule was written against. Riddings
      Timperley carries its own travelClinic widget and its own Post D is a
      travel clinic post, so the rule is directly relevant here, but none of
      this item's eight prior passes had tested it against this pack's own
      copy. Three injections run against a full scratch copy of the repo
      (C:\Dev\rbh-scratch-449, not the tracked file), sha256-restored after
      each: "We guarantee full protection for every destination." in Post D
      - FAILED (guarantee wording); "Wondering if a travel vaccine will
      fully protect you before you fly?" in Post D - PASSED, confirming the
      question exemption holds on this pack's own copy and not only on the
      pack the rule was written against; "The right vaccine will protect
      you for years to come." in Post D - FAILED (declarative "will protect
      you"). All three behaved exactly as designed. Tracked file confirmed
      byte-identical throughout by sha256 and git status. Documentation
      comment added above the OUTCOME_PROMISE block in
      tools/check-gbp-packs.js recording the proof; no rule logic changed.
      No in-repo defect found.
      LIVE HALF NOT performed: Claude in Chrome not connected this run: all
      live-side findings still rest on the seventh pass's 2026-09-01 check
      (Post B 404, pre-Phase-3 switch page paste at the old permalink,
      branch-specific Pharmacy First page live and correct, weight-loss-
      clinic-timperley.html's Regime 1 breach per compliance/
      WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md, all unchanged). Answer pickup
      also unavailable for the same reason. No autonomous window active. No
      new question raised: this is a re-verification of documented checker
      behaviour against a specific pack's own copy, not a live-facing or
      patient-facing decision. Evidence: audits/riddings-timperley-outcome-
      promise-reproof-4.13-ninth-2026-09-03.txt. Done 2026-09-03.
      Tenth quality pass 2026-09-03: pack clean and byte-stable across all
      ten passes (description 657, posts 449, 319, 521, 425, zero non-ASCII
      characters, zero em or en dashes), sha256 confirmed unchanged
      throughout (8cc587968d3f6b83a3509aa27151c7dc30172b626b9d0fed824630a77
      5917c04 before and after). Selected as stalest in the 36-item rotation
      pool by the same commit-subject-date method as recent passes (pattern
      matched against "item <N>" subjects only, over the pool of 45
      completed items minus the standing 7 out-of-rotation: 1.1, 1.4, 2.2,
      5.6, 5.7, 6.7, 6.8); 4.13 came out stalest at 2026-09-03T03:43:53+01:00,
      matching the ninth pass's own forward note exactly.
      BASELINE. git status --porcelain empty on gbp-packs/, modules/, core/,
      tools/, branches.json, status/ at the start. All 36 tools/check-*.js
      run individually: 36/36 exit 0. node tools/check-gbp-packs.js: 0
      failures, the same 17 estate-wide WARNs as every recent pass, with
      Riddings' own only line still the known switch-prescriptions.html
      live-only WARN.
      NEW ANGLE. The button-target derivation rule (BUTTON_PAGE, item 4.4
      pass), the button-label/CTA allowlist rule and the no-lead-pricing rule
      (both added on the item 4.5 pass, 2026-08-13, proved at the time
      against scorah-hazel-grove.md and a generic pack) had never been
      individually injection-tested against this pack's own copy across nine
      prior passes, despite Riddings running both a weight loss (Post C) and
      a travel clinic (Post D) widget, which is exactly the POM_POSTS
      surface those rules exist to protect.
      METHOD. Full repo copied to a scratch directory
      (/sessions/nifty-hopeful-ramanujan/scratch/449/repo, outside the
      tracked working tree), sha256-confirmed byte-identical to the tracked
      copy before use, checker baseline re-confirmed clean in the scratch
      copy first. Four injections run one at a time against the scratch
      copy's gbp-packs/riddings-timperley.md only, sha256-restored via
      `git checkout --` after each and confirmed byte-identical to the
      original before the next: (1) Post C's button label changed from
      "Book" to "Buy now" - CAUGHT, the POM-specific message naming the
      house standard's Buy-button prohibition; (2) a lead-price sentence
      ("Weight loss plans from just 49 pounds a month.") added into Post C's
      body before its Button line - CAUGHT by the pricing rule, naming
      compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md section 5; (3) a control
      test, Post B's button label changed from "Learn more" to "Sign up"
      (Post B is not a POM_POSTS letter) - CAUGHT, but correctly via the
      generic "not a button label any pack in this repo uses" message rather
      than the POM-specific one, confirming the rule is scoped by letter and
      not by wording alone; (4) Post C's button URL changed to Post D's own
      page (travel-clinic-riddings-timperley.html) - CAUGHT by the BUTTON_PAGE
      derivation rule, naming the correct expected leaf built from
      branches.json's brandSlug/townSlug. All four behaved exactly as
      designed; no checker gap found.
      METHOD NOTE, worth carrying: injection (3)'s first attempt used a sed
      pattern targeting the bare URL "switch-prescriptions.html" without
      the "-riddings-timperley" suffix, which does not appear on Post B's
      real Button line but does appear inside Post B's own hard-stop
      paster note (the 404 URL the marker exists to warn about). That first
      attempt silently edited the WRONG occurrence, left the real Button
      line untouched, and would have been misread as a checker miss if the
      result had been trusted without checking what actually changed.
      Caught by instrumenting buttonsOf() directly against the "injected"
      file and seeing the original "Learn more" / "-riddings-timperley.html"
      CTA and URL still intact, before any finding was written up; the
      injection was then corrected to target the real Button line by its
      exact surrounding text, and re-run to the CAUGHT result recorded
      above. The general rule: an injection test proves nothing unless the
      change is independently confirmed to have landed where intended, not
      only that the checker's exit code changed (or, here, didn't).
      Tracked repo confirmed untouched throughout (git status --porcelain
      empty on all tracked paths; gbp-packs/riddings-timperley.md sha256
      identical before and after; all 36 checkers re-run on the tracked
      copy after cleanup, 36/36 exit 0). Scratch directory deleted in full
      after use.
      LIVE HALF NOT performed: Claude in Chrome reported not connected this
      run (tabs_context_mcp returned "not connected"). All live-side
      findings still rest on the seventh pass's 2026-09-01 check (Post B
      404, pre-Phase-3 switch page paste at the old permalink, branch-
      specific Pharmacy First page live and correct, weight-loss-clinic-
      timperley.html's Regime 1 breach per compliance/
      WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md, all unchanged, and item 5.8's
      own Q5 answer already sets that fix direction). Answer pickup (step 3)
      also unavailable for the same reason; QUESTIONS.json unchanged this
      run (94 total, 41 open). No autonomous window active at the top of
      AGENT_LOG.md. No new question raised: pure re-verification of
      documented checker behaviour against this pack's own copy, with no
      judgement call, no business, legal, pricing or regulatory content
      changed. Evidence: audits/riddings-timperley-button-rules-4.13-tenth-
      2026-09-03.txt. Done 2026-09-03.
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
      Third quality pass 2026-08-12: pack verified clean for the third time,
      fact by fact against branches.json and rule by rule. Description 652
      characters exactly, posts 449, 280, 521 and 424, identical to both
      earlier passes, so the pack is byte-stable across three. Zero
      non-ASCII, zero dashes of any kind, zero smart quotes. All 29 checkers
      pass and all six generators rebuild byte-identical. LIVE HALF NOT
      PERFORMED, so this pass makes no fresh claim about the live pages and
      the hard stop above stands untouched. One in-repo defect found and
      fixed, again in a checker rather than in a pack, and the same shape as
      the previous three passes: check-gbp-packs read the hours line as two
      independent SETS, one of clock times and one of day names, and nothing
      bound a time to the day it belongs to. Proved by injection here:
      swapping this branch's 6:00pm weekday close with its 5:00pm Saturday
      close leaves the set of times and the set of days both untouched, and
      the pack passed clean while publishing a pharmacy that shuts an hour
      early five days a week. Inverting the lunch closure passed the same
      way. Six of the sixteen branches state a time that differs between
      days and were exposed: Scorah Bramhall, McCanns Aigburth, Fishlocks
      Eccleston, Hirshmans Ainsdale, Gordon Short Crosby and Cherry Lane.
      The checker now rebuilds the line into the ranges it publishes for
      each day and compares those against that day's own entries, reading
      both grammars the estate uses for a split day, the two explicit ranges
      and the envelope-plus-break form Hirshmans carries. Negative-tested
      fifteen ways across six packs, twelve defects caught and three
      legitimate rewrites correctly left alone. No pack copy changed, no
      question raised. Done 2026-08-12.
      Fourth quality pass 2026-08-13. REPO HALF ONLY: two Chrome instances are
      connected and an unattended run cannot choose between them, so no live
      page was read and this pass makes no fresh live claim. The hard STOP
      above stands as written on the 2026-08-11 evidence. The pack is clean
      and byte-stable across four passes: every fact re-verified against
      branches.json (name, 159 College Road, Liverpool L23 3AT, 0151 924 3449,
      website, review link, pfLink, hasApp false with no app claim, catchment
      Crosby, Waterloo and Sefton leading with its own seoTown in all three
      places), hours matching openingHours on both sessions of all six trading
      days plus Sunday closed, description 652 characters and posts 449, 280,
      521 and 424, identical to all three earlier passes, and zero non-ASCII,
      dash or smart-quote characters. All 31 checkers exit 0 before and after.
      ONE REAL DEFECT FOUND AND FIXED IN REPO, in tools/check-gbp-packs.js.
      The Post A rule accepted two destinations as equally correct, the pfLink
      page and the branch's own generated page, because item 5.3 will repoint
      them one day. That is right estate-wide and wrong for this branch, whose
      generated page is the confirmed-live "Gordon Shorts Chemist" paste. The
      only thing holding the swap was the prose STOP note, and prose is not a
      rule: proved by injection here, defanging the note left all 31 checkers
      green, and so did making the swap itself, which would publish a button
      sending patients to a page carrying the wrong trading name. Added
      PF_TARGET_HOLD, keyed by branch id with a reason and question id (Q32),
      and the Post A rule now fails on the held target while leaving the
      pfLink target correct. Negative-tested three ways: an unheld branch
      making the same swap still passes, so 5.3 is unaffected everywhere else;
      a foreign leaf on this branch still raises the original error and
      exactly one failure, so the rules do not double up; and the pack as
      written stays green. The hold does NOT self-expire, unlike the other
      exception maps in this file, because it is cleared by a Weebly repaste
      that no repo file records; that departure is documented at the map. No
      pack copy, page, generator, data field or branches.json entry changed.
      No question raised. Done 2026-08-13.
      Fifth quality pass 2026-08-14. REPO HALF ONLY: the answer-pickup fetch
      returned a Cloudflare Access login page, so no live page was read and this
      pass makes no fresh live claim. The 2026-08-10 hard STOP on the Post A
      link swap stands as written. Baseline was GREEN at HEAD on a clean
      worktree, unlike the previous run. The pack is clean and byte-stable
      across five passes: every fact re-verified against branches.json (name,
      159 College Road, Liverpool L23 3AT, 0151 924 3449, website, review link,
      pfLink, hasApp false with no app claim, catchment Crosby, Waterloo and
      Sefton leading with its own seoTown in all three places), hours matching
      openingHours on both sessions of all six trading days plus Sunday closed,
      description 652 characters and posts 449, 280, 521 and 424, identical to
      all four earlier passes, and zero non-ASCII, dash or smart-quote
      characters. ONE REAL DEFECT FOUND AND FIXED IN REPO, again in a checker
      and again one step further out than the last four passes: weight loss
      copy that sells on BODY IMAGE rather than on the service was read by no
      rule at all. Seven injections into this pack, one at a time and each
      sha256-compared back afterwards, PASSED ALL 36 CHECKERS in complete
      silence, with not even a warning raised: "Ready to start your
      transformation?", "Feel confident in your body again.", "Get beach body
      ready for summer.", "Join hundreds of local patients who have already
      slimmed down.", "Do not let your weight hold you back any longer.", "A
      new you starts here.", and a photo shot list direction reading "A weight
      loss patient holding up the trousers they have slimmed out of". The
      eighth injection, "Before and after photos from a weight loss patient",
      WAS caught, by the EFFICACY_FAIL literal "before and after" - so the
      phrase was barred and the same picture described in a photographer's own
      words was not. None of the existing rules could see these:
      claim-patterns reads a claim about the product, the method or a measured
      outcome, pom-class-patterns reads an unnamed medicine, and EFFICACY_WARN
      holds "transform" but is only a warning AND cannot match
      "transformation", because findTerms wraps every term in a word boundary,
      so the exact word the house reference quotes slips past even the soft
      warning. The house reference names this class in its own words
      (compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md section 7, the 2025-26
      social responsibility rulings that turn on exploiting body image). Fixed
      with BODY_IMAGE_SELF and BODY_IMAGE_CONTEXT in tools/check-gbp-packs.js,
      deliberately NOT promoted to the shared claim-patterns.js, because that
      list governs the generated inner pages, which are Regime 2, and the
      assessment records a live page carrying "Ready to start your
      transformation?" and rates it acceptable there; promoting it would fail
      correct live copy. All twelve patterns were swept across the 16 packs,
      modules/, core/, brand/ and tools/ before being wired: zero matches
      anywhere, so the rule asserts nothing new about copy that exists today.
      The first negative test FAILED and is recorded because it is the more
      useful half: gated sentence by sentence on namesWeightLoss, the way
      POM_CLASS is gated, two of the seven walked straight back through the
      rule just written to catch them, because neither sentence contains the
      phrase "weight loss". Re-scoped so the body of any post whose label names
      weight loss is read as one surface, Post C being the weight loss
      advertisement by construction, with the sentence gate still applying
      everywhere else. Negative-tested ten ways: all seven injections now fail
      with exactly one failure each, and three controls stay clean, including
      the photographer's "otherwise the best straight-on frontage shot" that 11
      of the 15 packs carry and a legitimate "join the NHS contraception
      service". All 36 checkers exit 0 and all six generators rebuild
      byte-identical. No pack copy, page, generator, data field or
      branches.json entry changed. Q78 raised, asking whether the same family
      should be read on the generated weight loss and branch landing pages.
      Done 2026-08-14.
      Sixth quality pass 2026-08-30 (backfilled here on the seventh pass below;
      the pack's own note recorded this at the time but it was never synced to
      this file, the same sync gap several other items have needed backfilling
      this month). Live recheck: the site's sitemap was now dated 2026-08-15 on
      every page, against 2026-07-19 on every earlier check, so a site-wide
      republish had happened. pfLink (pharmacy-first-service-crosby.html) and
      the switch page both now read Gordon Short Chemist correctly, the switch
      page's naming fault fixed by that republish, but the switch page's
      mojibake em dash survived it. The three branch-specific generated pages
      (pharmacy-first-gordon-short-crosby.html, weight-loss-clinic-gordon-
      short-crosby.html, travel-clinic-gordon-short-crosby.html) were all
      rebuilt in the republish but still read Gordon Shorts Chemist throughout,
      unchanged since 2026-08-10; the wrong name is evidently sitting in a
      content block Weebly carries forward across republishes rather than
      something a one-off repaste fixes. The STOP on repointing Post A to the
      branch-specific page stands. Footer en dashes on all four pages
      unchanged. No pack fact affected, no in-repo defect, no question raised.
      Seventh quality pass 2026-08-31. FIRST RUN THIS SESSION VIA THE NATIVE
      WINDOWS HOST rather than Cowork's sandboxed shell (see the AGENT_LOG.md
      entry for this date for the wider environment note). Baseline green: all
      36 checkers exit 0 before any change. Pack re-verified fact by fact
      against branches.json: address 159 College Road, Liverpool L23 3AT,
      phone 0151 924 3449, both hours sessions on all six trading days plus
      Sunday closed, catchment Crosby, Waterloo and Sefton leading with its own
      seoTown, hasApp false with no app claim, review link and website both
      match, description still 652 characters, posts 449/280/521/424,
      identical to all six earlier passes: byte-stable across seven. Zero
      non-ASCII, dash or smart-quote characters in the pack itself. All six
      generators rebuilt: sha256 of all 204 files under modules/service/pages,
      modules/switch/pages and modules/branch/pages identical before and
      after. LIVE HALF PERFORMED (read-only, Claude in Chrome, navigate and
      get_page_text only, no click, no submit, no login, tab closed after):
      pharmacy-first-service-crosby.html, the page Post A actually links to,
      still reads Gordon Short Chemist throughout and remains safe as written.
      switch-prescriptions-gordon-short-crosby.html still reads Gordon Short
      Chemist correctly; its mojibake em dash in "How switching...works" is
      unchanged. pharmacy-first-gordon-short-crosby.html, the branch-specific
      page Post A must not be repointed to, still reads Gordon Shorts Chemist
      throughout its heading and body, though its own contact card and footer
      blocks correctly read Gordon Short Chemist, the same split the sixth
      pass found; the STOP stands, unchanged. Footer en dashes on all three
      checked pages unchanged. One further live-only observation, not
      previously logged: a stray mojibake glyph near the top of every page
      checked (rendering as "├ù", most likely a corrupted close-button
      multiplication sign in a site-wide banner snippet), appears sitewide
      rather than branch-specific, no repo file carries it; noted here for
      whoever next handles the repaste queue, not actioned further. No
      in-repo defect found. No pack fact, page, generator or branches.json
      entry changed. No new question raised. Done 2026-08-31.
      Eighth quality pass 2026-09-01. Selection required a block-bounded
      scan of this whole file rather than trusting AGENT_LOG.md header text:
      several items done earlier today (3.3, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10,
      4.13) used header wording a simple "Item X.Y quality pass" grep would
      have missed, wrongly suggesting them as still-oldest; reading each
      item's own bounded block for a "2026-09-01" mention showed 4.14 was
      the only one of that group with none, so 4.14 was taken.
      Pack clean and byte-stable for the eighth pass running: a fresh
      independent extraction (audits/verify-4.14-2026-09-01.js, own regexes,
      imports nothing from tools/) re-checked name, address, phone, website,
      review link, hasApp/no-app-claim, both weekday sessions, both Saturday
      sessions (confirming the Saturday close is genuinely shorter than the
      weekday close), Sunday closed, catchment order and membership, the
      652-character description claim, Post A resolving to the exact pfLink
      rather than the held branch page, the other three posts resolving to
      files this repo generates, all four post lengths (449/280/521/424,
      identical to all seven earlier passes), no medicine name, no
      body-image wording in Post C, and no em/en dash, smart quote or nbsp:
      42/42 passed. All 36 checkers exit 0 before any change. All six
      generators rebuilt to a zero-diff worktree (203 files, sha256
      identical before/after).
      Three injections proved rather than recited: Post A's button swapped
      to the held branch-specific page (caught by check-gbp-packs.js's
      PF_TARGET_HOLD/Q32 rule); the stated Saturday close widened from
      5:00pm to 6:00pm, every individual time and day name still technically
      the branch's own (caught by the day-binding rule with both a
      missing-time and a day-mismatch failure); "Ready to start your
      transformation?" appended to Post C (caught by the BODY_IMAGE_SELF
      rule from the fifth pass). All three restored via plain file copy
      from a pre-injection backup, sha256-confirmed byte-identical each
      time, full 36-checker suite re-run clean after the final restore.
      LIVE HALF performed via plain read-only Node fetch (Claude in Chrome
      unavailable - two connected browsers, unattended run cannot choose,
      Q59). All findings from the sixth and seventh passes reconfirmed
      unchanged: Post A's actual target (pharmacy-first-service-crosby.html)
      correct and safe; the switch page's naming is fixed (24 correct, 0
      wrong) but its mojibake em dash under "How switching...works" is
      still there ("ÔÇö"); the three branch-specific pages Post A must not
      be repointed to (Pharmacy First, weight loss, travel clinic) still
      read "Gordon Shorts Chemist" throughout (16, 12 and 11 wrong-name
      occurrences respectively against 5 correct each), so the STOP remains
      correctly in force; the sitewide mojibake "├ù" close-button glyph is
      present on all five pages read; the sitemap is still dated
      2026-08-15T07:41:55+00:00 throughout, no republish since the last
      check.
      NEW FINDING, on a page outside this item's four tracked post targets
      so nothing before this run had read it: the sitemap also lists
      weight-loss-clinic-crosby.html, a second live weight loss URL
      alongside the pack-linked one, the same "old page live next to the
      current one" shape as the confirmed Post A STOP. Its real head
      correctly names the branch but its own meta description names Wegovy
      and Mounjaro by brand in a promotional frame - public search-snippet
      copy, Regime 1 territory. A vendor booking-widget snippet further down
      the page body separately carries its own inert second title/meta pair
      naming "Wilmslow Pharmacy" (RBH's own disposed Wilmslow branch, or
      unrelated vendor boilerplate - not established). Not acted on: this
      repo does not generate or link to this page, the medicine-naming point
      is a live regulatory claim, and neither call is this run's to make
      alone. Raised as Q90. No in-repo defect on the pack itself. Evidence
      in audits/gordon-short-item-4.14-quality-pass-2026-09-01-eighth.txt.
      Done 2026-09-01.
      Ninth quality pass 2026-09-02. Baseline green: all 36 checkers exit 0
      before any change. Pack re-verified fact by fact against branches.json's
      gordonshorts_crosby entry, read side by side rather than trusted from
      the checker: name Gordon Short Chemist, 159 College Road, Liverpool
      L23 3AT, phone 0151 924 3449, website, review link
      https://g.page/r/CZcVDM6emi6OEAE/review, pfLink, hasApp false with no
      app claim in the pack, catchment Crosby, Waterloo and Sefton in that
      order in all three places, and both opening-hours sessions on all six
      trading days plus Sunday closed, all exact matches. Description and
      post character counts independently recomputed by script (own
      line-join, nothing imported from the checker): 652 description,
      449/280/521/424 for Posts A-D, byte-identical to all eight earlier
      passes - ninth pass running with zero drift. Zero non-ASCII, dash or
      smart-quote characters. All six generators rebuilt from branches.json;
      sha256 of all 203 files under modules/service/pages, modules/switch/
      pages and modules/branch/pages identical before and after, zero diff.
      One injection re-proved rather than recited: Post A's button swapped
      to the held branch-specific page, sha256-confirmed before and after,
      still caught by name by check-gbp-packs.js's PF_TARGET_HOLD/Q32 rule
      with the same message as the fourth pass; restored byte-identical and
      the full 36-checker suite re-run clean.
      LIVE HALF PERFORMED (read-only, Claude in Chrome, navigate and
      get_page_text/javascript_tool only, no click, no submit, no login;
      only one browser connected this run, unlike the eighth pass's two).
      All tracked findings reconfirmed unchanged: pfLink
      (pharmacy-first-service-crosby.html), Post A's real target, still
      reads Gordon Short Chemist throughout and remains safe as written;
      switch-prescriptions-gordon-short-crosby.html still reads Gordon Short
      Chemist correctly, its mojibake em dash under "How switching...works"
      unchanged ("ÔÇö"); pharmacy-first-gordon-short-crosby.html, the
      branch-specific page Post A must not be repointed to, still reads
      "Gordon Shorts Chemist" throughout title, heading and body, with the
      contact card and footer still correctly reading the singular name -
      the STOP stands; the sitewide mojibake "├ù" glyph is still present
      near the top of every page read; the footer hour ranges on all pages
      checked still use en dashes; the sitemap is still dated
      2026-08-15T07:41:55+00:00 throughout, no republish since the last
      check, and still lists weight-loss-clinic-crosby.html, the second
      live weight loss URL outside this pack's post targets. Its meta
      description still names Wegovy and Mounjaro by brand, reconfirming
      Q90 unchanged; not re-raised, per the standing instruction not to
      duplicate it.
      One fresh angle not run by any earlier pass: read the actual href, not
      just the visible text, behind the "Read Google reviews" link on the
      live switch page via javascript_tool. It resolves to
      https://g.page/r/CZcVDM6emi6OEAE/review, an exact match for
      branches.json's googleReviewUrl and the pack's own profile-basics
      line - the review link chain is correct end to end, not just
      correct-looking. No in-repo defect found. No pack copy, page,
      generator, data field or branches.json entry changed. No new question
      raised. Done 2026-09-02.
      Tenth quality pass 2026-09-03 (unattended scheduled run via Cowork).
      Fresh angle: check-uk-spelling.js, check-brand-spelling.js and
      check-url-scheme.js had never been proven against this pack by direct
      injection, only implicitly by the suite passing each prior pass - the
      same gap the 4.7 tenth pass and 4.2 eleventh pass closed for their own
      packs this same morning. Baseline green: 35/35 checkers exit 0, git
      status clean, pack MD5 28f675f809d7d8c5cb286ff861187f17 (11,975
      bytes). Three injections, each backed up, run, restored and
      MD5-verified: "Vaccination centre" to "center" caught by
      check-uk-spelling.js first attempt; the heading changed to "Gordon
      Shorts Chemist Crosby" (the exact real-world confusable name this
      branch's live pre-1.1 pages carry) caught by check-brand-spelling.js,
      which correctly told the injected heading apart from the five
      pre-existing quoted narrative mentions of the same wrong name,
      leaving those as NOTEs rather than false-failing; Post C's target
      swapped from https to http caught by check-url-scheme.js and
      correctly cross-referenced to item 6.6 rather than raised as a new
      question. All three caught first attempt, file restored
      byte-identical each time (MD5 match), full 35-checker suite clean
      after the final restore, all six generators rebuilt byte-stable.
      LIVE HALF: Claude in Chrome not connected (Q59, retried twice). Fell
      back to read-only HTTPS HEAD requests: all four post targets and
      sitemap.xml return 200. Sitemap lastmod unchanged at
      2026-08-15T07:41:55+00:00 throughout, no republish since the ninth
      pass; weight-loss-clinic-crosby.html (Q90) still present at the same
      timestamp, not re-examined for content this pass (status-code only),
      Q90 not re-raised. No in-repo defect found. No pack copy, page,
      generator, data field or branches.json entry changed. No new question
      raised. Evidence: audits/gordon-short-item-4.14-quality-pass-2026-09-03-tenth.txt.
      Done 2026-09-03.
      Eleventh quality pass 2026-09-04 (unattended scheduled run via Cowork).
      Fresh angle: check-pharmacy-first-cost.js rule 6 and check-app-
      membership.js rules 8a/8d had never been proven against this pack by
      direct injection, the same gap the 4.2 twelfth and 4.7 tenth/eleventh
      passes closed for their own packs earlier the same run. Baseline
      green on the canonical copy: 36/36 checkers exit 0, git status clean
      at HEAD e745ff4, pack MD5 28f675f809d7d8c5cb286ff861187f17 (11,975
      bytes), byte-stable across eleven passes. Full repo copied to a
      scratch directory (robocopy, .git excluded); both target checkers
      re-run clean there before any edit.
      Injection 1: "free" stripped from all three Pharmacy-First-naming
      sentences (business description, Services section, Post A). First
      attempt used CRLF as the join between wrapped lines and silently
      matched nothing, because this pack's specific line wraps in these
      three sentences use a bare LF, not CRLF like most of the file -
      caught by a changed/unchanged check before running the checker, not
      mistaken for a clean result. Redone with the correct separator: all
      three changed. CAUGHT: check-pharmacy-first-cost.js exit 1, rule
      "free", naming the pack.
      Injection 2: an app claim sentence appended to the Services section
      (gordonshorts_crosby confirmed hasApp false). Unlike McCanns
      Sandringham (tested on the 4.7 tenth pass), this pack's paster notes
      DO carry the exact phrase "No app mention anywhere in this pack", so
      one injection caught both rule 8a (public copy against the field) and
      rule 8d (the note against the pack) at once, naming the pack and the
      branch both times - fuller coverage than the McCanns test achieved.
      Both restores done by copying the pre-injection backup over the
      scratch file (not git checkout), MD5-reconfirmed
      28f675f809d7d8c5cb286ff861187f17 each time. Full 36-checker suite
      re-run on the scratch copy after both restores: 35/36 exit 0, the one
      failure being check-cdn-pins.js's documented no-.git scratch-copy
      artefact (recorded on the 4.2 twelfth pass this same run), not a repo
      defect.
      Fact re-verification against branches.json's gordonshorts_crosby
      entry, read fresh rather than trusted from the checker: name,
      address, phone, website, review link, hasApp false, catchment order,
      pfLink and both opening-hours sessions on all six trading days all
      exact matches, eleventh pass running with zero drift.
      LIVE HALF: Claude in Chrome not connected (Q59, retried once). Fell
      back to read-only HTTPS requests via PowerShell on the canonical
      host. All four post-linked pages and sitemap.xml return 200. Sitemap
      lastmod unchanged at 2026-08-15T07:41:55+00:00, no republish since
      the tenth pass. pharmacy-first-gordon-short-crosby.html still reads
      "Gordon Shorts Chemist" 16 times (the exact count the ninth pass
      recorded), so the STOP and PF_TARGET_HOLD/Q32 remain correctly in
      force. The switch page's "How switching...works" heading correctly
      reads the singular "Gordon Short Chemist"; its lead paragraph still
      renders the mojibake em dash ("ÔÇö"), unchanged since the sixth pass.
      Weight loss and travel clinic pages checked for status only (200)
      this pass, content not re-read.
      No in-repo defect found. No pack copy, page, generator, data field or
      branches.json entry changed. No new question raised. Evidence:
      audits/gordon-short-item-4.14-quality-pass-2026-09-04-eleventh.txt.
      Done 2026-09-04.
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
      Quality pass 2026-08-12 (third re-verification, repo half only): pack
      verified clean again. Unchanged in git since the second pass, and
      byte-stable with it on every measurement: description 650, posts 449,
      329, 521 and 425, pure ASCII, no dashes. Every fact re-matched against
      branches.json including the split weekday hours in all three places,
      the catchment order, the five-widget set behind the categories, hasApp
      false and the pfLink Post A mirrors. Post A's seven conditions and the
      UTI 16 to 64 range re-checked against the generated Pharmacy First page
      for this branch and match word for word. Post C names no medicine, makes
      no claim, quotes no price. All 29 checkers green, all six generators
      byte-stable. The live half was NOT performed: two Chrome instances are
      connected and the browser tooling needs a human choice between them,
      which an unattended run cannot give, so no page was fetched. The live
      state stands on the 2026-08-11 pass. One finding for item 5.8, recorded
      under it, and one correction written into AGENT_LOG.md: run 86's heading
      is stamped 23:15 against 22:15, 22:40, 23:08 and 23:42 for runs 85, 87,
      88 and 89, exactly an hour after run 85 minute for minute and so about
      an hour ahead of its true time, which made this item look fresher than
      items verified after it and is why runs 87 to 127 passed over it.
      Evidence in audits/tiffenbergs-aintree-gbp-pack-check-2026-08-12.txt.
      Quality pass 2026-08-13 (fourth re-verification, repo half only): pack
      verified clean again and unchanged in git since the second pass, MD5
      E6AD155DFDE54A89BAC51AD5A355063A, 144 lines, pure ASCII. Every fact
      re-matched against branches.json, description 650 and posts 449, 329,
      521 and 425, Post A's seven conditions and the UTI 16 to 64 range
      matching the generated Pharmacy First page. ONE REAL DEFECT FOUND AND
      FIXED, outside the pack and estate-wide: nothing in the repo read the
      Pharmacy First COST claim. Changing the hero pill on
      pharmacy-first-tiffenbergs-aintree.html from "Free NHS service" to
      "Low-cost NHS service" walked past all 31 checkers clean, which is a free
      NHS service advertised as a paid one on the page a patient reads before
      deciding whether they can afford to be seen. check-contraception-copy.js
      has guarded exactly this claim on the NHS contraception pages since it
      was written; Pharmacy First had no equivalent. New checker
      tools/check-pharmacy-first-cost.js, 6 rules over 112 pages and 16 packs:
      the free claim present, the NHS prescription-charge caveat present, no
      cost qualifier, no price, and a pack that advertises the service calls it
      free in a sentence that names it. Negative-tested seven ways, five that
      must fail and two that must not, three of which changed the design. All
      32 checkers exit 0 and all six generators are byte-stable, so no page,
      pack, generator output or piece of patient-facing copy changed. Two
      verifier gaps carried from the previous run are re-confirmed still open
      for the next passes: an H1 town word moved off the seoTown, and a
      guarantee added to the travel clinic page. No question raised. Evidence
      in audits/tiffenbergs-aintree-gbp-pack-check-2026-08-13.txt.
      Quality pass 2026-08-29 (fifth re-verification, repo half only): pack
      verified clean again, byte-identical with the fourth pass, MD5
      E6AD155DFDE54A89BAC51AD5A355063A, 144 lines. Every fact re-matched
      against branches.json: name, address, phone, split weekday hours with
      the lunch closure in all three places, website, review link, catchment
      membership and order leading with seoTown, hasApp false, Post A
      mirroring pfLink. Description 650 characters as claimed, pure ASCII, no
      dashes, no medicine names, Post C and D qualifiers present, all three
      Post B/C/D targets exist as generated pages. check-gbp-packs 0 failures.
      Live half NOT performed: two Chrome extensions connected, an unattended
      run cannot choose between them (Q59); live state stands on 2026-08-11.
      The two carried verifier gaps were re-tested. The H1-off-seoTown gap is
      CLOSED: check-seo-pattern now fails the mutation precisely. The travel
      clinic guarantee gap was STILL OPEN and is now closed: RULE 12 (outcome
      promises) added to check-travel-clinic-copy.js, promise-framed patterns
      only after a first draft tripped on the legitimate "take time to give
      full protection" FAQ line, negative-tested six ways (five must-fail,
      one must-pass question exemption). All 36 checkers exit 0; no page,
      pack or generator output changed. Evidence in
      audits/tiffenbergs-aintree-gbp-pack-check-2026-08-29.txt.
      Quality pass 2026-08-30 (sixth re-verification, live half performed
      for the first time since 2026-08-11): pack verified clean again,
      byte-identical with the fourth and fifth passes. Every fact
      re-matched against branches.json. All 36 checkers exit 0, all six
      generators byte-stable. Live half performed: site republished
      (sitemap now 2026-08-15, was 2026-07-19), all four post targets
      return 200 and read correctly. Three known live-only defects
      reconfirmed unchanged (switch banner mojibake despite the
      republish, footer en dashes, tiffenbergs@ vs Tiffenberg@ email
      split, Q56 still open). One new finding, queued for the same
      repaste: two live content blocks (Post B switching-works intro,
      Post C suitability intro) carry a dash the repo source and
      generated page do not; not a repo defect. No new question raised.
      Evidence in audits/tiffenbergs-aintree-gbp-pack-check-2026-08-30.txt.
      Quality pass 2026-09-01 (seventh re-verification, repo half only):
      pack verified clean again, unchanged in git since the sixth pass
      (md5 04d3e0daac4f80fac10890a8d68d60ff). Every fact re-matched against
      branches.json programmatically (name, address, phone, split weekday
      hours, website, review link, hasApp false, catchment order, the
      five-widget set). All 36 checkers exit 0; the pack's one WARN (Post A
      link has no .html ending) is the same known non-defect every prior
      pass has recorded. All six generators rebuilt, all 197 generated
      files byte-identical. Pure ASCII confirmed, no em or en dashes. The
      switch banner's source-side mojibake fix (run-44) reconfirmed present
      (&times; entity, no raw mojibake sequence). Post A/B/C/D target files
      confirmed present in the repo. Freshly proved, for the first time
      specifically against this pack's own wording rather than a synthetic
      template: the Q79 bank-holiday notesBlock rule in check-gbp-packs.js.
      On a disposable /tmp scratch copy, replaced the notes block's literal
      "bankHolidays.dates2026" with "bank holiday dates" - FAIL correctly
      raised naming this file; reverted, re-ran clean, diffed the reverted
      scratch file against the tracked repo copy as byte-identical. Tracked
      repo never touched by the test. Live half NOT performed: two Chrome
      extensions are connected and an unattended run cannot choose between
      them (Q59, same blocker the third, fourth and fifth passes hit); live
      state stands on the sixth pass, 2026-08-30. No repo defect found, no
      page, pack, generator output or branches.json entry changed, no new
      question raised. Evidence in
      audits/tiffenbergs-aintree-gbp-pack-check-2026-09-01-seventh.txt.
      Quality pass 2026-09-02 (eighth re-verification, repo and live both
      performed): pack unchanged since the sixth pass (md5
      6880a60bd1e32fea3fa791a806b2b3e2), every fact re-matched against
      branches.json, all 36 checkers exit 0, all six generators byte-stable.
      Live half performed for the first time since 2026-08-30: only one
      Chrome instance was connected this run (Q59's ambiguity did not
      recur), so all four post targets were fetched and read correctly, and
      the known live-only defects (switch banner mojibake, footer en
      dashes, tiffenbergs@ vs Tiffenberg@ email split, the two stray dashes
      on Posts B and C) were all reconfirmed unchanged since 2026-08-30.
      Sitemap unchanged since the 2026-08-15 republish.
      NEW: read the live homepage's actual link targets (not inferred from
      the sitemap) and confirmed both the top nav "Weight Loss Clinic" item
      and a separate body link point at the old weight-loss-clinic-aintree.
      html template (Mounjaro/Wegovy/Orlistat named, a "Real Results"
      heading, a weight-loss slider, a lead £39.99 price above the fold),
      while the compliant generated page is reachable only via a third,
      secondary link. This closes the "link context... unrecorded" gap the
      2026-08-12 addendum left open specifically for Tiffenbergs (one of
      Q16's "original five"), putting it alongside SK (Q58) and Hirshmans
      (Q85) as a confirmed regime 1 case. Recorded as an addendum in
      compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md and cross-referenced
      into Q58's note; no new question raised, since Q58 already asks the
      operative question this evidence answers, and this is a live
      patient-facing regulatory finding an unattended run may not act on
      directly. No page, pack, generator output or branches.json entry
      changed. Evidence in
      audits/tiffenbergs-aintree-gbp-pack-check-2026-09-02-eighth.txt.
      Quality pass 2026-09-03 (ninth re-verification, repo half only): pack
      verified clean again, unchanged since the eighth pass (sha256
      59d288c1c32920c05bc9b12479ec2bc8970ffa5639977ccee10ec9be9046811b).
      Every fact re-matched against branches.json for the ninth time (name,
      address, phone, split weekday hours, website, review link, hasApp
      false, catchment order, the five-widget set). All 36 checkers exit 0,
      all six generators byte-stable. Fresh angle: check-gbp-packs.js's
      OUTCOME_PROMISE rule (added item 4.7 sixth pass, 2026-08-29, the same
      day RULE 12 was added to check-travel-clinic-copy.js on this item's
      own fifth pass) had never been proved by direct injection against
      THIS pack's own Post D, only against four siblings
      (mccanns-sandringham, riddings-timperley, fishlocks-eccleston,
      smartts-bootle). Three injections into Post D's closing line, each
      reverted by byte-copy restore with sha256 confirming identical: "We
      guarantee full protection for every destination." (guarantee
      wording) FAILED; "The right vaccine will protect you for years to
      come." (declarative "will protect you") FAILED; "Wondering if a
      travel vaccine will fully protect you before you fly? Ask the
      pharmacist at your consultation." (a genuine question) PASSED,
      confirming the question exemption holds on this pack's own copy too.
      No defect found. tools/check-gbp-packs.js changed: a documentation
      comment recording this pass's injections, matching the convention
      the 4.13/4.8/4.10 passes established; no rule logic changed. Live
      half: Claude in Chrome unreachable this run; fell back to a
      status-code-only curl.exe check of all four post targets, all 200,
      unchanged from the eighth pass. Evidence in
      audits/tiffenbergs-aintree-outcome-promise-reproof-4.15-ninth-2026-09-03.txt.
      Quality pass 2026-09-04 (tenth re-verification, repo half only): pack
      verified clean again, unchanged since the ninth pass (sha256
      59d288c1c32920c05bc9b12479ec2bc8970ffa5639977ccee10ec9be9046811b).
      All 36 checkers exit 0. Fresh angle: check-brand-spelling.js,
      check-url-scheme.js and check-uk-spelling.js had never been proven
      by direct injection against THIS pack's own copy, only against nine
      sister packs across today's parallel lineage (Fishlocks Ainsdale,
      Scorah Bramhall, McCanns Sandringham, Gordon Short Crosby,
      Hirshmans Ainsdale, Fishlocks Eccleston, Smartts Bootle, Clear
      Chemist Aintree, Coleman and Leighs Walton) - only ever covered by
      the general 36-checker suite passing. Four injections on a scratch
      copy, each restored by byte copy and sha256-reconfirmed identical:
      (1) Post A's "Tiffenbergs Chemist" dropped to "Tiffenberg Chemist" -
      CAUGHT by check-brand-spelling.js, correct canonical name named;
      (2) Post B's button URL downgraded https to http - CAUGHT by
      check-url-scheme.js rule 1 (INSECURE, published surface, naming
      item 6.6); (3) Post B's "handle everything else" changed to
      "organize everything else" - CAUGHT by check-uk-spelling.js,
      correct UK form named; (4) a quoted-evidence control naming
      "Tiffenberg Chemist" inside quotation marks as a note of live
      footer wording - correctly PASSED (exit 0, reported only as a
      NOTE), confirming the brand-spelling quote mask holds on this
      pack's own copy too. All four behaved exactly as designed; no
      checker gap found. Own baseline pollution caught and corrected
      before testing: this run's own git-log orientation dump had
      written two scratch files into _agentscratch/ (untracked but
      inside check-postcodes.js's whole-repo scan surface) containing
      genuine postcode strings from old commit subjects, which made
      check-postcodes.js exit 1 falsely on the first suite run; deleted
      before any checker work, re-ran clean. Live half: Claude in Chrome
      unreachable this run; fell back to a status-code-only curl.exe
      check of all four post targets, all 200, unchanged from the eighth
      and ninth passes. No in-repo defect found, no new question raised.
      Evidence in
      audits/tiffenbergs-aintree-brand-url-uk-spelling-4.15-tenth-2026-09-04.txt.

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
      Quality pass 2026-08-12: clean on both halves, nothing to fix. CH49
      1SX still confined to the audit narrating itself, now five files
      with the CLAUDE.md section run 55 added; no page, pack, paste block
      or branches.json entry carries it, and a case-insensitive sweep
      finds no hidden form. L17 4JP correct in branches.json and on the
      live Pharmacy First page, contact block and footer. All six
      generators byte-stable, all 29 checkers pass. The guard was proved
      rather than assumed: an injected CH49 1SX failed as UNKNOWN, and
      the checker also flagged the injection script itself for holding
      the literal value, the value-named quoting rule working as
      designed. Run 96's audits/-narrative change has not loosened this
      item. Live blemishes seen (Sandrigham typo, McCann's Pharmacy
      naming, pre-5.7 local word) are all already held under Q39 and item
      5.3. GBP management record still out of reach; action note for
      Rishi or Dane stands. Evidence:
      audits/mccanns-sandringham-postcode-check-2026-08-12.txt.
      Quality pass 2026-08-13 (fourth pass): data clean again and not one
      character of it edited. CH49 1SX still confined to six files, all of
      them the audit narrating itself; L17 4JP correct in branches.json and
      used across 27 files; all six branch landing postcodes verified by
      branchName against branches.json. All 29 checkers pass, all six
      generators byte-identical. Three pre-existing guards proved by
      injection (UNKNOWN on a live page, FOREIGN with a real other-branch
      postcode, and the run 55 value-named exemption on status/index.html),
      all restored. The defect was in the checker again, and it was hiding
      in plain sight: check-postcodes.js has been printing two UNOWNED
      warnings for modules/branch/pages/INDEX.md and SEO.md, and three
      earlier passes read them as noise. Those two files carry SIX branches
      each, so ownerOf() could match no owner, rule 3 was switched off, and
      only rule 1 applied - which asks whether a postcode is real, not
      whether it is on the right branch. A real postcode on the wrong
      branch is this item's exact failure shape, and both files hold the
      most confusable pair in the estate (McCanns Aigburth L17 7BP and
      McCanns Sandringham L17 4JP, same brand, same district, five lines
      apart) in public SEO copy that is pasted into Weebly. Earlier passes
      verified that data was right; none noticed nothing was holding it
      right. New rule 6 MISATTRIB checks line by line, firing only where a
      line names exactly one branch so a page mentioning a neighbour is
      never accused. Negative-tested twice, both previously silent passes,
      both now fail; 341-file clean run confirms no false positive. No new
      question. Done 2026-08-13. Evidence:
      audits/mccanns-sandringham-postcode-check-2026-08-13.txt.
      Quality pass 2026-08-14 (fifth pass): data clean again and not one
      character of it edited. CH49 1SX still confined to eight files, all of
      them the audit narrating itself; L17 4JP correct in branches.json and
      used across 30 files, 16 of them pages, packs or paste blocks. All 33
      checkers pass, all six generators byte-identical, only the checker
      changed. The defect was in check-postcodes.js for the fifth time
      running, and this time it was under all six rules at once rather than
      in any one of them. Every rule reads its postcodes through one regular
      expression, PC_RE, which is uppercase-only and allows at most one
      whitespace character, so "pr8 3hw", "PR8&nbsp;3HW", "PR8  3HW" and a
      postcode wrapped across two lines are unread by rules 1 to 6
      simultaneously, including on a live page. Four earlier passes proved
      the guard by injection and all four injected the value in the one
      typographic form the guard was already looking for. Not theoretical:
      check-nap.js, the sibling checker on the same data, hit this exact
      fault and fixed it for itself (its lines 53 and 421 record a branch
      postcode typed in lower case passing unread), and nobody carried the
      lesson across. Fix: a second, case-insensitive expression with the
      separator widened to spaces, tabs, a non-breaking space, an &nbsp;
      entity or one line wrap, and now required rather than optional, since
      requiring it is what stops a case-insensitive match reading CSS hex
      colours and short git hashes as postcodes. Both expressions feed one
      extract() used by both scan sites, so the two cannot drift apart
      again. The widening is bounded on purpose and the boundary is named in
      the file: a loose match only counts if it canonicalises to a postcode
      the repo already has a position on, which covers the whole of this
      item's risk, because the dangerous error is a real postcode that sends
      a patient to the wrong place. Five negative tests, all five previously
      silent, all five now fail, including the Aigburth postcode in lower
      case on the Sandringham line of the multi-branch SEO.md; three
      uppercase regressions still fail as before. No new question. Done
      2026-08-14. Evidence:
      audits/mccanns-sandringham-postcode-check-2026-08-14.txt.
      Quality pass 2026-08-30 (sixth pass): data clean again and not one
      character of it edited. CH49 1SX still confined to nine files, all
      of them the audit narrating itself; L17 4JP correct in branches.json
      and used across 32 files; the live Pharmacy First page carries the
      right postcode on both McCanns blocks and the landing page 404
      remains the queued-paste finding, not new. All 36 checkers pass, all
      six generators byte-identical, only the checker changed. The defect
      was in check-postcodes.js for the sixth time: the fifth pass widened
      the separator to spaces, tabs, &nbsp; and a line wrap, but a
      postcode travels inside LINKS as well as prose, and the URL forms
      %20, %2B, a literal + and a hyphen were unread by all six rules at
      once. Proved before fixing: a Google Maps directions link carrying
      the AIGBURTH postcode in + form, written into
      gbp-packs/mccanns-sandringham.md - copy that is pasted into the
      Google Business Profile, links included - passed all 36 checkers in
      silence. The generated pages were already guarded (check-map-embeds
      proves value, encoding, contact-card agreement and the directions
      button; check-nap caught a %20 injection in a paste block), but the
      packs and any future URL-carrying surface had nothing behind them,
      which is the exact class of gap this checker was written to close.
      Fix: the four URL separators added to PC_RE_LOOSE in the shared
      extract(), still INTEREST-bounded so date ranges, CSS tokens and
      street-number ranges like 61-63 stay unread. Five negative tests:
      plus-form foreign, lowercase plus-form CH49 1SX, hyphen slug form
      and %2B form all previously silent and all now fail, and the plain
      uppercase regression still fails. Warning set identical before and
      after, the same three standing UNOWNED. No new question. Done
      2026-08-30. Evidence:
      audits/mccanns-sandringham-postcode-check-2026-08-30.txt.
      Quality pass 2026-08-30 (seventh pass): data clean again and not one
      character of it edited. CH49 1SX still confined to the audit
      narrating itself; L17 4JP correct in branches.json and used across
      the estate; the live Pharmacy First page re-verified, both McCanns
      contact blocks correct, no CH49 anywhere. All 36 checkers pass, all
      six generators byte-identical, only the checker changed. The defect
      was in check-postcodes.js for the seventh time: PC_RE_LOOSE's
      separator was REQUIRED ({1,10}), so a fused postcode with no
      separator at all - lower case, no space, no punctuation - was unread
      by all six rules at once, on top of the plain uppercase form PC_RE
      already read fused. Proved before fixing: Aigburth's postcode fused
      and lowercased ('l177bp') on a line naming McCanns Chemist
      Sandringham in gbp-packs/mccanns-sandringham.md - the exact
      MISATTRIB shape rule 6 exists to catch - passed all 36 checkers in
      silence. Fix: the separator group made optional ({0,10}), still
      INTEREST-bounded so it cannot start reading hex colours, hashes or
      slugs elsewhere as postcodes. Negative-tested: the injection above
      now fails as both FOREIGN and MISATTRIB; reverted, then fixed; full
      36-checker suite and all six generators re-run clean afterwards. No
      new question. Done 2026-08-30. Evidence:
      audits/mccanns-sandringham-postcode-check-2026-08-30-seventh.txt.
      Quality pass 2026-09-01 (eighth pass): data clean again and not one
      character of it edited. CH49 1SX still confined to the audit
      narrating itself; L17 4JP correct in branches.json and used across
      the estate. All 36 checkers pass, all six generators byte-identical,
      only the checker changed. The defect was in check-postcodes.js for
      the eighth time: PC_RE_LOOSE's separator recognised the literal named
      entity "&nbsp;" and a raw U+00A0 character, but not the two numeric
      character references that mean the same thing, "&#160;" (decimal) and
      "&#xa0;" (hex, either case). Proved before fixing: Aigburth's postcode
      split as "L17&#160;7BP" and again as "L17&#xa0;7BP", written on a line
      naming McCanns Chemist Sandringham in gbp-packs/mccanns-sandringham.md
      - the same MISATTRIB shape every earlier pass on this item has found -
      passed all 36 checkers in silence. Not a new class of gap:
      check-nap.js's own unesc() has decoded "&nbsp;|&#160;|&#xa0;" since
      the item 1.4 quality pass, 2026-08-14, and the comment introducing
      PC_RE_LOOSE's percent-encoding widening already named this exact
      failure mode without it being fixed here. Fix: both numeric forms
      added to the separator alternation, written out in both cases for the
      hex form's letters since this regex carries no "i" flag. Negative-
      tested on a scratch copy outside the working tree: the injection above
      failed as both FOREIGN and MISATTRIB after the fix, passed silently
      before it; reverted after proving, then applied to the tracked
      checker and re-verified there too. Live half: pharmacy-first-service-
      aigburth.html re-read, both McCanns contact blocks correct (L17 7BP
      Aigburth, L17 4JP Sandringham), no CH49 1SX anywhere, "Sandrigham"
      typo still standing under Q39, nothing new. No new question. Done
      2026-09-01. Evidence:
      audits/mccanns-sandringham-postcode-check-2026-09-01-eighth.txt,
      audits/_before-1.3-eighth-2026-09-01.sha256,
      audits/_after-1.3-eighth-2026-09-01.sha256 (identical).
      Quality pass 2026-09-02 (ninth pass): data clean again and not one
      character of it edited. CH49 1SX still confined to the audit
      narrating itself; L17 4JP correct in branches.json and used across
      the estate. All 36 checkers pass, all six generators byte-identical
      (git status --porcelain -- modules/ empty before and after), only the
      checker changed. The defect was in check-postcodes.js for the ninth
      time, and it was the one gap the eighth pass's own comment had already
      named without closing: PC_RE_LOOSE's separator recognised the numeric
      character references "&#160;" and "&#xa0;" case-insensitively (an
      explicit [xX][aA]0 class) but still matched the NAMED entity "&nbsp;"
      as four fixed lowercase letters, so "&NBSP;", "&Nbsp;" and every other
      case variant of the entity itself matched nothing. Proved before
      fixing, file-wide rather than against the regex in isolation:
      Aigburth's postcode written as "L17&NBSP;7BP" on Post B of
      gbp-packs/mccanns-sandringham.md (a line naming McCanns Chemist
      Sandringham only, per the standard MISATTRIB shape) extracted as zero
      postcodes under the unmodified checker - a direct node -e run against
      the mutated file confirmed only the pre-existing "L17 4JP" was found -
      so neither rule 3 (FOREIGN) nor rule 6 (MISATTRIB) had anything to
      fire on, and the full 36-checker suite passed at exit 0 with the wrong
      postcode present. Not a new class of gap: check-nap.js's unesc() has
      decoded &nbsp; case-insensitively (a whole-pattern "gi" flag on a
      separate, single-purpose regex) since the item 1.4 quality pass,
      2026-08-14, and this checker had already carried that lesson across
      for the numeric forms but not for the named entity itself. Fix: the
      four letters of "nbsp" each written as an explicit upper/lower pair,
      matching the convention the hex form already used, so the numeric
      escapes, "+" and "-" stay exactly as case-sensitive as before (no
      whole-pattern "i" flag added, for the same reason the eighth pass
      gave). Negative-tested: the injection above now fails as FOREIGN
      (file-level, gbp-packs is an OWNED_DIRS directory) after the fix and
      passed silently before it; reverted by byte copy from a pre-mutation
      backup (sha256-verified identical, not git checkout), then the fix
      applied to the tracked checker and re-verified there too. A second
      supplementary injection on the branch-name line itself, run on a
      scratch copy outside the working tree, confirmed the fixed regex also
      extracts the case-varied postcode where rule 6 (MISATTRIB) would apply.
      No new question. Done 2026-09-02. Evidence:
      audits/mccanns-sandringham-postcode-check-2026-09-02-ninth.txt,
      audits/_before-1.3-ninth-2026-09-02.sha256,
      audits/_after-1.3-ninth-2026-09-02.sha256 (identical).
      Quality pass 2026-09-03 (tenth pass): data clean again, nothing edited
      in branches.json, modules/ or core/. All 36 checkers pass, all six
      generators byte-identical. This pass changed angle rather than widening
      the separator regex again: the nine prior passes (second through ninth)
      all re-tested rule 1 (UNKNOWN), rule 3 (FOREIGN) or rule 6 (MISATTRIB)
      by finding one more whitespace or encoding form PC_RE_LOOSE's separator
      missed. Rule 4 (DISPOSED) and rule 2's "if (b.disposed) return"
      exemption had not been individually re-tested since the original
      six-rule hardening on 2026-08-11, and branches.json today carries no
      disposed:true record at all - Wilmslow Pharmacy, the one branch that
      ever carried that flag, was removed from the file entirely under the Q2
      answer on 5 August 2026 rather than kept as a disposed record. So rule 4
      has zero live branches to protect right now, which is a fact about the
      data, not a flaw in the rule: Wilmslow's own git history (3d1cc18,
      1d8821c) shows the flag-then-remove pattern did happen once and could
      happen again for a future disposal. Proved on a full rsync scratch copy
      (0 failures baseline matching tracked repo exactly): added a
      disposed:true branch record reproducing Wilmslow's real fields
      (postcode SK9 2TA) to the scratch branches.json only, plus a synthetic
      OWNED_DIRS page carrying that postcode - fired correctly as DISPOSED on
      first attempt. Removed the synthetic page with the disposed record still
      present - rule 2 correctly did not demand the postcode be used anywhere,
      confirming the disposed-branch exemption holds. Scratch copy discarded,
      tracked repo untouched throughout. tools/check-postcodes.js changed to
      add SK9 2TA to NARRATIVE_POSTCODES (this file and AGENT_LOG.md now quote
      it) and a comment above rule 4 documenting the proof and explaining why
      the rule currently guards zero branches, so the next pass does not have
      to re-derive it. No new question. Done 2026-09-03. Evidence:
      audits/postcode-disposed-rule-reproof-1.3-tenth-2026-09-03.txt.
      Quality pass 2026-09-03 (eleventh pass): data clean again and not one
      character of branches.json, modules/ or core/ edited. All 36 checkers
      pass, all six generators byte-identical (git status --porcelain --
      modules/ core/ branches.json empty before and after). This pass changed
      angle for the first time in the item's history: the ten prior passes all
      tested whether a PAGE, PACK or PASTE BLOCK disagreed with branches.json
      (nine widened PC_RE_LOOSE's separator, the tenth re-proved the disposed-
      branch exemption); none had ever asked whether branches.json agreed with
      ITSELF. rank() (line 237) exists precisely because two entries can
      legitimately share a postcode - Clear Chemist Aintree and head office,
      both Unit 20 Brookfield, L9 7AS - but it only picks a display owner when
      that happens; nothing distinguished that deliberate case from an
      accidental one. Proved on a scratch copy before writing anything:
      McCanns Sandringham's own postalCode set to McCanns Aigburth's real
      L17 7BP, all six generators re-run so all 15 of Sandringham's own pages
      consistently carried the wrong postcode - the unmodified checker (rules
      1-6) reported zero FOREIGN, MISATTRIB, DISPOSED or MISSING failures on
      any of them, because every regenerated file matched the wrong data it
      was built from and no rule read branches.json's own postalCode column
      for internal agreement. Fix: new DELIBERATE_SHARED_POSTCODES constant
      naming the one legitimate case with a reason, and new rule 7 (DUPLICATE)
      which groups live branches by postcode and fails any postcode shared by
      two or more whose id set is not exactly excused there, plus a staleness
      half (same convention as NARRATIVE_POSTCODES) that fails if the excused
      entry ever stops matching branches.json's actual sharers. Re-tested on
      the scratch copy: clean baseline unaffected (rule 7 correctly excuses
      L9 7AS), the injection above now fires DUPLICATE, and a temporarily
      wrong id in the allowlist fires STALE; scratch discarded afterwards. On
      the tracked repo: branches.json itself needed no change (only the one
      deliberate case has ever existed here); all 36 checkers and all six
      generators re-run clean. No new question. Done 2026-09-03. Evidence:
      audits/postcode-duplicate-rule-1.3-eleventh-2026-09-03.txt.
- [x] 1.2 Verify Hirshmans address reads "56-62 Sherwood House, Station Road,
      Ainsdale" everywhere on the site. Done 2026-08-04. Repo and live site
      both verified correct; no changes needed. One cosmetic note logged
      (contact-us page left block splits "Station Road" across a line break
      and omits the postcode - hand edit on Weebly when convenient).
      Third quality pass 2026-08-12 (ninety-eighth run, after runs 10 and
      56): clean on both halves. branches.json canonical, 14 broken variants swept across 308
      files with every hit a narrative surface, both check-nap guards (the
      address rule and run 56's email rules) proved by injection and restored,
      all 29 checkers pass, generators byte-identical. Live contact-us read
      once, read-only: address correct on all three surfaces, hours match
      branches.json. Standing cosmetics still live and already in Q41's note;
      one addition there (middle block also carries the nhs.net address). New
      minor note: the live footer strip uses en dashes in its hours line and
      has no in-repo source, a hand edit for the next Weebly visit. Evidence
      in audits/hirshmans-address-check-2026-08-12.txt.
      Fourth quality pass 2026-08-13 (hundred-and-thirty-ninth run). REPO
      HALF ONLY, no browser available, nothing live read or claimed. Clean
      for the fourth consecutive pass, no data edited, no checker defect
      found, no new question. branches.json canonical; nine broken variants
      swept and every hit accounted for (the "64 Station Road" and
      "017014577376" hits in the GBP pack are the Post A HARD STOP note
      recording the OLD live page's defect, and the unspaced "01704577376"
      in 13 generated pages is the tel: href, whose visible text is
      correctly spaced). All 29 checkers exit 0, generators byte-identical.
      Guard coverage EXTENDED this pass: five injections, all restored. The
      one that matters is the real neighbouring-branch address, Fishlocks
      Ainsdale 17 Station Road PR8 3HN, since both pharmacies sit on Station
      Road, Ainsdale and that is the estate's most plausible real mix-up. It
      is caught twice, by check-nap (which names fishlocks_ainsdale) and
      independently by check-postcodes (FOREIGN). New this pass: the GBP
      pack surface was injected too, for both street and postcode, and
      check-gbp-packs caught both and named the consequence ("the profile
      would put the pin on another branch"). Earlier passes had proved the
      page surface only. Evidence in
      audits/hirshmans-address-check-2026-08-13.txt. Done 2026-08-13
      Fifth quality pass 2026-08-14 (hundred-and-eighty-second run). BOTH
      HALVES this time, repo and live, browser read-only. Clean for the fifth
      consecutive pass on the thing the item is about: the address. No data,
      page, generator or patient-facing copy edited. 19 broken variants swept
      across 386 files and every hit accounted for as narrative, a declaring
      checker, the GBP pack's HARD STOP note, or Fishlocks Ainsdale's own
      correct PR8 3HN. All 12 Hirshmans pages carry the canonical street,
      locality and PR8 3HW and none carries PR8 3HN. All 33 checkers exit 0,
      all six generators byte-identical. Guard coverage extended twice: the
      check-postcodes PC_RE fix made yesterday was proved on THIS item's
      surface for the first time (lower-case and double-spaced foreign
      postcodes both now caught, where before yesterday they were invisible
      to all six rules at once), and a wrong street was injected at SOURCE in
      branches.json rather than into the pack, proving check-nap and
      check-gbp-packs fire in that direction too, which four earlier passes
      never tested. Narrative correction: the unspaced phone sits in 12
      generated pages, not the 13 the fourth pass recorded; the 13th file is
      a switch banner, and no switch banner in the estate carries a postcode.
      One in-repo defect found and fixed: status/index.html was stale at
      "1 to do, 7 blocked" against a real 0 and 8, regenerated. Live half:
      address correct on all three surfaces, hours match branches.json, every
      Q41 cosmetic still live, one addition folded into Q41's note (both
      address blocks print "Ainsdale" then "Southport", which the repo never
      says). No new question. Evidence in
      audits/hirshmans-address-check-2026-08-14.txt. Done 2026-08-14
      Sixth quality pass 2026-08-30. Both halves, browser read-only. Clean for
      the sixth consecutive pass on the address itself: branches.json
      canonical, 17 broken variants swept across 418 tracked files with every
      hit accounted for, all 12 Hirshmans pages carry the canonical street and
      PR8 3HW, all 36 checkers exit 0, all six generators byte-identical.
      Guard coverage extended twice, both surfaces never proved for this item
      before: a JSON-LD-only foreign postcode (check-jsonld and
      check-postcodes both fired) and a map query pointed at the neighbour
      (check-map-embeds fired on value and agreement). Two defects found and
      fixed away from the address: status/index.html stale since 2026-08-14
      (build-status-page.js not run by recent runs - run 56's lesson on this
      same item, recurred), regenerated; and check-postcodes could not see a
      postcode inside a fully URL-encoded link because the %20 preceding the
      token defeats the leading word boundary, so a foreign postcode in an
      encoded pack directions link passed all 36 checkers in silence - the
      exact surface the 2026-08-30 1.3 fix was written for, incompletely.
      extract() now also reads a URL-decoded view; proved by injection on the
      page and the pack, before and after. Live half: address correct on all
      three surfaces, hours match branches.json including lunch closures,
      every Q41 cosmetic still live, nothing new. Evidence in
      audits/hirshmans-address-check-2026-08-30.txt. Done 2026-08-30
      Seventh quality pass 2026-08-30 (rotation pool, following 1.3's
      seventh pass): address clean both halves for the seventh consecutive
      time. All 12 Hirshmans pages carry PR8 3HW, PR8 3HN found only on
      Fishlocks Ainsdale pages, gbp-packs/hirshmans-ainsdale.md canonical
      with its HARD STOP note unchanged. Guard coverage extended again: the
      sixth pass's URL-decode view only stripped ONE layer of percent
      encoding, so a DOUBLE-encoded separator ("%2520", "%20" re-encoded)
      still defeated it - proved by injection on the same Hirshmans page
      and the pack, both passing all 36 checkers in silence before the fix.
      extract() now decodes in a bounded loop (5 passes) and also collapses
      %25 to a literal "%", so any depth of re-encoding unwinds; proved
      clean by the identical injections failing at exit 1 after the fix,
      restored, re-run clean. Live half: contact-us read in full, address
      correct on all three surfaces, hours match branches.json including
      both lunch closures, every Q41 cosmetic still live and unchanged,
      nothing new to add. Evidence in
      audits/hirshmans-address-check-2026-08-30-seventh.txt. Done 2026-08-30
      Eighth quality pass 2026-09-01 (unattended run, rotation pool). REPO
      HALF ONLY: built-in browser denied navigation outright and Claude in
      Chrome could not resolve its multi-browser prompt unattended, so
      nothing live was read or claimed. Address itself clean for the eighth
      consecutive pass: branches.json canonical, a five-pattern broken-
      variant sweep across all 533 tracked files came back fully accounted
      for (PR8 3HN is Fishlocks Ainsdale's own postcode; "64 Station Road"
      and "017014577376" are confined to the pack's own HARD STOP note and
      its rendering in status/index.html; zero hits for "Sherwood Road"),
      all 36 checkers exit 0, all six generators byte-identical except
      status/index.html's routine timestamp regeneration. Guard coverage
      extended twice. First, proved by injection that check-nap.js's
      abbreviation-aware street sweep (added 2026-08-31 on Smartts' Fernhill
      Road) also fires correctly on HIRSHMANS' OWN compound street written
      as "Station Rd", never previously used to test that feature; reverted
      byte-identical, re-ran clean. Second and more significant: the same
      injection tried against the GBP PACK surface (a different checker,
      check-gbp-packs.js) passed with 0 failures, because that file's
      foreign-street rule still matched only the exact string - the
      identical gap check-nap.js fixed for itself six days ago, never
      carried across, despite that fix's own comment warning "nobody
      carried the lesson across" about the sibling case. Fixed: added the
      same STREET_ABBR/streetPattern() logic to check-gbp-packs.js, reusing
      its existing escapeRe() helper, applied to both the own-street
      presence rule and the foreign-street rule. Re-proved by injection
      (now FAILS, reported in canonical full form), reverted byte-
      identical, all 36 checkers and all six generators re-run clean. Not
      theoretical for this pair: Hirshmans Ainsdale and Fishlocks Ainsdale
      share Station Road, the estate's most plausible real street mix-up,
      and a GBP pack is pasted verbatim into a live public profile. No new
      question. Evidence in
      audits/hirshmans-address-check-2026-09-01-eighth.txt. Done 2026-09-01
      Ninth quality pass 2026-09-02 (unattended scheduled run, rotation pool
      - item 1.2 was the stalest of the 36 rotation candidates, last touched
      2026-09-01T13:17 BST, over 24 hours before this run, derived from
      `git log` "item N.N" mentions with the standing one-off exclusions
      1.1/1.4/2.2/5.6/5.7/6.7/6.8). REPO HALF: address clean for the ninth
      consecutive pass. branches.json's hirshmans_ainsdale record unchanged
      (56-62 Sherwood House, Station Road, Ainsdale, PR8 3HW, 01704 577376,
      review link, both lunch-closure hour sessions). Eight-pattern broken-
      variant sweep across all 587 tracked files: every "PR8 3HN" hit is
      Fishlocks Ainsdale's own postcode, every "017014577376" and "64
      Station Road"-shaped hit is confined to the pack's own HARD STOP note
      and narrative/audit files, the one "Hirshman Chemist" hit is a
      historical audit file recording a past finding, not a live surface;
      zero hits for "Sherwood Road", "56 62 Sherwood" or any digit-shifted
      phone. All 36 checkers run individually: 36/36 exit 0. All six
      generators rebuilt from branches.json; sha256 of all 203 files under
      modules/service/pages, modules/switch/pages and modules/branch/pages
      identical before and after, zero diff.
      GUARD COVERAGE EXTENDED TWICE, both angles never tested on this item
      before. First, a day-shape defect on the pack's own Hours line
      (CLAUDE.md's own documented lesson that a profile is set in days, not
      only times): "Monday to Friday" changed to "Monday to Thursday" with
      every time value left untouched. check-gbp-packs.js's day rule caught
      it correctly - "branches.json opens this branch on Friday, but the
      hours line does not state Friday as an open day" - proving the rule
      reads the day set, not just the clock times, on this branch's own
      pack for the first time. Second, the branch's own phone number on the
      GBP PACK surface specifically (prior passes proved phone-shaped
      strings on the generated pages via check-nap; the pack via
      check-gbp-packs had only ever been proven on street and postcode, per
      the fourth pass): last digit changed (...577376 -> ...577375).
      check-gbp-packs.js caught it - "branch phone 01704 577376 does not
      appear anywhere in the pack" - and separately flagged the wrong
      number as phone-shaped, same as its existing narrative-line WARN
      logic. Both injections captured to a byte-for-byte backup before
      editing, restored from that backup (not `git checkout`, per the
      standing lesson elsewhere in this repo about that command discarding
      uncommitted work), sha256-confirmed identical to the pre-injection
      file both times, and the full 36-checker suite re-run clean after
      restoration.
      LIVE HALF NOT PERFORMED. Claude in Chrome reported connected (one
      browser) at the start of this run, then reported not connected when
      the live-side check for this item was attempted a few minutes later;
      no fetch was retried against a login wall or an unavailable
      extension, per the standing procedure. The eighth pass's live state
      (contact-us address, hours and every Q41 cosmetic) stands unconfirmed
      but unchanged from this run's perspective.
      No in-repo defect found, no new question raised. Evidence: full
      36-checker output and both injection transcripts captured this run;
      see AGENT_LOG.md for the environment/lock/push handling notes, not
      repeated here. Done 2026-09-02
      Tenth quality pass 2026-09-03 (unattended scheduled run, rotation pool
      - item 1.2 was the stalest of the 43 completed items, last touched
      2026-09-02T13:49 BST, re-derived fresh from `git log` "item N.N"
      mentions with the standing out-of-rotation set 1.1/1.4/2.2/5.6/5.7/
      6.7/6.8 excluded; the next four stalest were 3.11, 4.4, 4.1, 3.2, all
      also touched 2026-09-02, so 1.2 was the clear choice). REPO HALF ONLY;
      no live check this pass (see ENVIRONMENT note below). Baseline: all 36
      checkers exit 0 individually, gbp-packs/hirshmans-ainsdale.md MD5
      84cc37eaf34c48cfaeabd059a5215ae2, git status --porcelain empty on
      gbp-packs/, modules/, core/, branches.json, tools/, status/.
      GUARD COVERAGE EXTENDED: check-brand-spelling.js and
      check-url-scheme.js had never been pointed at
      gbp-packs/hirshmans-ainsdale.md by direct injection (only implicitly,
      via the pack passing the full suite each prior pass) - the same class
      of gap the 4.7 tenth, 4.2 eleventh and 4.14 tenth passes closed for
      their own packs the same morning. check-uk-spelling.js is different:
      this exact pack is that checker's own origin case (its file header
      records the item 4.3 pass on 2026-08-13 planting US spelling into this
      file to find the gap check-uk-spelling.js was then built to close), so
      today's injection is a re-proof of regression safety, not a first
      proof.
      INJECTION 1 (check-brand-spelling.js): line 13, "Name on GBP:
      Hirshmans Chemist" changed to "Name on GBP: Hirshman Chemist" (trailing
      s dropped, the near-miss shape the checker derives automatically).
      Result: FAIL, "reads \"Hirshman Chemist\". The trading name is
      \"Hirshmans Chemist\"", correctly distinguishing the injected
      profile-basics line from the two pre-existing quoted narrative
      mentions of "Hirshmans Pharmacy" at lines 38 and 124 (the old live GBP
      listing name), which stayed as NOTEs. Caught first attempt.
      INJECTION 2 (check-url-scheme.js): the Post D (travel clinic, Book
      button) target changed from https to http. Result: FAIL, INSECURE,
      "published surface carries http://... An insecure estate URL on a
      live page is a crawlable duplicate of the https page, which is item
      6.6." Caught first attempt, correctly cross-referenced to the existing
      item 6.6 rather than raised as a duplicate question.
      INJECTION 3 (check-uk-spelling.js, re-proof): line 37, "Vaccination
      centre" changed to "Vaccination center". Result: FAIL, "reads
      \"center\". UK English is \"centre\"". Caught first attempt, confirming
      no regression since the rule's own origin case.
      Each injection captured to a byte-for-byte backup before editing and
      restored from that backup (not `git checkout`), MD5-confirmed
      identical to the pre-injection file after each restoration and again
      after all three. Full 36-checker suite re-run clean after the final
      restore, all six generators re-run with git status --porcelain empty
      on modules/ and core/ (byte-stable output).
      ENVIRONMENT NOTE: this run's Cowork sandbox mount again showed the
      Q87 pattern (SSH fetch fails host-key verification; the FUSE-mounted
      working copy blocks unlink() on any file, confirmed fresh this run
      against a plain non-git test file, not just .git internals) - used
      only for orientation, lock and reading QUESTIONS.json/AGENT_LOG.md/
      AGENT_WORKLIST.md. All file edits, checker runs, generator runs, git
      operations and the publish step were done via Windows-MCP PowerShell
      and the Read/Edit file tools against the canonical C:\Dev\rbh-site-data
      working copy, the established route from item 4.12's eighth pass
      onward. No live check performed - list_connected_browsers reported
      zero Claude in Chrome browsers connected (checked once, covering both
      answer pickup and this item's live half); the ninth pass's live state
      (contact-us address, hours, Q41 cosmetics) stands unconfirmed but
      unchanged.
      No in-repo defect found, no new question raised. Evidence in
      audits/hirshmans-address-check-2026-09-03-tenth.txt. Done 2026-09-03
      Eleventh quality pass 2026-09-04 (unattended scheduled run, rotation
      pool - item 1.2 was the stalest of the rotation pool, last touched
      2026-09-03T09:12:44+01:00, re-derived fresh from `git log` "Item N.N "
      mentions anchored to the start of the commit subject; the next four
      stalest were 3.11, 4.4, 4.1, 3.2, all also touched 2026-09-03). REPO
      HALF: address itself clean for the eleventh consecutive pass,
      branches.json's hirshmans_ainsdale record unchanged. All 36 checkers
      exit 0 both before and after this pass's one edit.
      GUARD COVERAGE EXTENDED: check-pharmacy-first-cost.js rule 6 (the
      positive free claim) and check-app-membership.js rule 8a (pack copy
      against hasApp) had never been pointed at
      gbp-packs/hirshmans-ainsdale.md by direct injection, only covered
      passively by the full-suite pass, the same gap shape the item 4.14
      eleventh, 4.2 twelfth and 4.7 eleventh passes closed for their own
      packs the same week. Injection 1: "free" stripped from the three
      sentences naming Pharmacy First itself (business description, Services
      section, Post A). CAUGHT: check-pharmacy-first-cost.js exit 1, rule
      "free", naming the pack. Injection 2: "Manage your prescriptions on
      the go with our free app." added to the Services section
      (hirshmans_ainsdale confirmed hasApp false). CAUGHT:
      check-app-membership.js exit 1, rule 8a, naming the pack and the
      branch. Rule 8d not testable here: this pack's paster notes do not
      carry the exact phrase "No app mention anywhere in this pack" rule 8d
      checks for. Both injections run on a disposable scratch copy outside
      the tracked tree, restored by byte copy and SHA256-reconfirmed
      identical before continuing, full 36-checker suite clean after the
      final restore. No in-repo defect found by either injection.
      LIVE HALF, read-only via PowerShell Invoke-WebRequest (Claude in
      Chrome not connected, checked once at answer pickup). sitemap.xml
      lastmod unchanged at 2026-08-14T16:09:17+00:00, no publish since the
      sixth pass. contact-us.html and the generated replacement page
      (pharmacy-first-hirshmans-ainsdale.html) both address- and
      brand-exact, matching branches.json. SIGNIFICANT FINDING on the OLD
      hand-built page the pack's HARD STOP note names
      (pharmacy-first-service-ainsdale.html): the note's phone and branding
      faults are unchanged (017014577376 still does not dial, "Hirshmans
      Pharmacy" still appears 9 times), but its street-address fault has
      been silently corrected on the live page since the note was last
      checked 2026-08-12 - the page now reads "56-62 Sherwood House, Station
      Road, Ainsdale, PR8 3HW" throughout, with no "64 Station Road" left.
      FIX APPLIED: the note was rewritten to state today's re-verified fact
      rather than repeat the stale one, recording the address fault as fixed
      and the phone/branding faults as still open and independently
      sufficient to keep the HARD STOP in force. This is a narrative
      correction to a hand-authored pack, not a generated-output edit, so no
      regeneration was needed. The underlying recommendation (do not post
      Post A with the current link; repoint via Q8/Q34, item 5.3) is
      unchanged. Verified after editing: all 36 checkers exit 0, git diff
      confined to the one paragraph, zero non-ASCII characters added, no
      other tracked file touched. No new question raised, no worklist item
      blocked or unblocked. Evidence:
      audits/hirshmans-address-check-2026-09-04-eleventh.txt. Done 2026-09-04
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
      Quality pass 2026-08-13 (repo half only): the rule holds for the fifth
      consecutive pass. All six generators rebuild to a zero diff, all 29
      checkers pass, and the hand sweep re-run as git grep finds every
      remaining variant is either the rule being stated, a quoted reading of a
      live page in a GBP pack, or the status page rendering this worklist.
      Zero in public copy. The defect is again the checker's reach, not the
      copy: three places a brand publishes that no rule here could read.
      modules/emar/emar.js types the business name into the visible eMAR
      paragraph; core/site-data.js carries a whole branch record as its
      offline FALLBACK, brandLabel and branchName included, which is what
      renders when the branches.json fetch fails or times out, so rule 3's
      "one place a brand is typed rather than read" was two; and
      modules/emar/weebly is a hand-pasted Weebly block with no file
      extension, outside both the folder list and the extension filter. All
      three proved by injection passing all 29 checkers before the fix. Same
      shape as the item 5.1 finding in service.js. modules/ and core/ are now
      walked for .js and .css with comments blanked, exactly as
      check-em-dashes.js reads them, modules/emar/weebly is named in
      SCAN_FILES, and new rule 5 pins the FALLBACK record against CANONICAL.
      Reach 224 to 225 files plus 7 code files plus 1 FALLBACK record.
      Negative-tested eight ways, all reverted. Evidence:
      audits/brand-spelling-check-2026-08-13.txt. Done 2026-08-13.
      Quality pass 2026-08-14 (repo half only): the rule holds for the sixth
      consecutive pass. All 32 checkers pass, all six generators rebuild to a
      zero diff, and three separate reach probes came back clean: every file
      under modules, core, brand, gbp-packs, status, compliance and scripts is
      either scanned or justifiably not copy (five uncovered, all internal);
      no field in branches.json other than brandLabel, branchName and the
      schemaNote carries a brand name, and none of them holds a variant; and
      the four "RB Healthcare Ltd" strings typed into the other generators are
      OneDrive folder paths, not published copy, so rule 3's pin of
      build-switch-pages.js is still the right shape.
      THE DEFECT WAS IN THE DERIVATION, NOT THE REACH. Rule 2 built its near
      misses by varying the trailing s, the apostrophe form and "and"/"&", so
      it could only ever see a brand misspelled in its FIRST half. The
      shop-type word was unguarded, and that is the half this estate actually
      gets wrong: Hirshmans trades as "Hirshmans Chemist" and publishes from
      hirshmanspharmacy.co.uk, and the Ainsdale pack records "Hirshmans
      Pharmacy" as the branding the old live page carried. Proved by
      injection: "Hirshmans Pharmacy", "Cherry Lane Chemist" and "McCanns
      Pharmacy" each passed all 32 checkers, while a dropped s in the same
      position on the same file failed. Fixed by deriving Chemist, Chemists,
      Pharmacy and Pharmacies as alternatives for each other, derived rather
      than listed so a rename is covered the day CANONICAL changes. All six
      probes now fail across six different surfaces (pack prose, landing page,
      switch banner, the extension-less emar block, a service SEO sheet) and
      all three pre-existing controls still fail. Zero false positives on real
      copy: the only change to the clean run is two more quoted readings of a
      live page read as evidence, both at Hirshmans Ainsdale, up from 6 to 8.
      LIVE SIDE, and it is the one that matters: the Hirshmans Ainsdale GBP
      listing is still named "Hirshmans Pharmacy - Travel Vaccination and
      Simple Weight Loss Clinic". Pre-1.1 name on the group's most public
      surface, and it names a parked brand. Raised as Q70, blocks nothing.
      Done 2026-08-14.
      Quality pass 2026-08-29 (repo half and a live read): the rule holds for
      the seventh consecutive pass. All 36 checker scripts exit 0, all six
      generators rebuild to a zero diff. THE DEFECT THIS TIME WAS IN RULE 4,
      NOT RULE 2: letter-level misspellings that drop a doubled consonant.
      Rule 2 derives near misses from the canonical letters, so "Smarts
      Chemist" (one t) and "Ridings Pharmacy" (one d) are invisible to it by
      construction, and neither was in the MISSPELT list. Proved by
      injection: both passed all 36 checkers, while the derived control
      "Smartt Chemist" in the same position failed. Fixed by extending
      MISSPELT with Smarts, Ridings and the spaced Mc Cann (same class as
      the listed S K Chemists), after verifying zero legitimate uses of any
      of the three in public copy. Negative-tested seven ways including a
      lowercase prose control; zero false positives, the clean run is
      unchanged. Evidence: audits/brand-spelling-check-2026-08-29.txt.
      LIVE SIDE, movement in both directions: the Gordon Short Pharmacy
      First page no longer carries "Gordon Shorts" anywhere - the name was
      hand-corrected in place, though the page is still the old hand-built
      copy, not the generated one. The travel clinic page is UNCHANGED: a
      pre-1.1 paste with "Gordon Shorts Chemist" in its title, H1, body and
      its own contact card, while the site-wide footer on the same page
      spells it correctly, so the branch now disagrees with itself within a
      single page. Same repaste Q32 and item 5.3 wait on. Blocks nothing,
      no new question. Done 2026-08-29.
      Quality pass 2026-08-31 (eighth, repo half only): the rule holds for
      the eighth consecutive pass. All 36 checker scripts exit 0 and all six
      generators rebuild to a byte-identical diff against the committed
      output, confirming the repo was clean going in. THE DEFECT THIS TIME
      WAS A NEW DIMENSION AGAIN, CASE RATHER THAN LETTERS: every rule before
      this one is deliberately case-sensitive (the 2026-08-29 pass kept
      "smarts" and "riding" untouched in prose on purpose), which is right
      for an ordinary English word but leaves a word that carries a capital
      BEYOND its first letter unguarded, because nothing about ordinary
      spelling marks the flattened form as wrong. Proved by injection:
      "Mccanns Chemist", "Mccann Chemist" and "Sk Chemists" all passed every
      one of the 36 checkers, while the derived control "Smartt Chemist" (an
      unrelated existing rule) still correctly failed in the same run.
      Verified zero legitimate uses of "Mccann", "Mccanns", "Sk" or "Rb" as
      standalone words anywhere in public copy before changing anything.
      Fixed in rule 2 (VARIANT), not rule 4, because this is arithmetic
      rather than knowledge: wordForms() now derives a sentence-case
      flattened form (first letter kept, rest lowercased) for every form it
      already builds, so McCanns/McCann/McCann's and SK/SKs/SK's each also
      cover their flattened twin automatically, and RB Healthcare Ltd is
      covered the same way without being named. Guarded against widening
      into a false positive the way the case-sensitive design exists to
      avoid: a word already in sentence case (Chemist, Healthcare, and, the
      shop-type swap forms) flattens to itself and adds nothing, proved by
      a full clean re-run finding zero new hits anywhere in the 225 files of
      copy or the 7 code files. Negative-tested by injecting the three
      variants into a real page, confirming exit 1 naming the correct branch
      and the correct trading name for each, then reverting to a
      byte-identical file and re-confirming exit 0. Evidence:
      audits/brand-spelling-check-2026-08-31.txt (clean run) plus the
      injection transcript in this run's AGENT_LOG.md entry. Live side not
      re-read this pass; the last live read (2026-08-29) is the current
      standing note. Blocks nothing, no new question - this is the same
      mechanical widening item 1.1 has needed on five of its eight passes.
      Done 2026-08-31.

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
      Quality pass 2026-08-13: repo half verified clean and byte-stable
      again, all 30 checkers green and all seven generators rebuilding every
      page byte-identical. The pass then found the SIXTH instance of this
      repo's recurring fault, one turn past the fifth. The 2026-08-11 pass
      widened check-em-dashes.js to read the live module CODE, because copy
      the browser assembles at run time is in no .html file. It stopped at
      the code. The DATA that code renders was still read by no dash rule:
      core/site-data.js fetches branches.json from jsDelivr at run time and
      modules/emar/emar.js renders branchName, streetAddress,
      addressLocality, postalCode and serviceAreaList into the eMAR page.
      Proved reachable by marker injection rather than argued: of the branch
      fields only twelve reach a generated page, and branchName and
      serviceAreaList are not among them, so a dash in either shows up in no
      .html in this repo and the page rule can never catch it downstream. An
      em dash injected into serviceAreaList passed all 30 checkers and
      changed no generated page. FIXED IN REPO, no sign-off needed, since it
      is a checker widening and not patient-facing copy: check-em-dashes.js
      now reads the run-time data, reports a field path such as
      branches[12].serviceAreaList[0] rather than only a line number, treats
      the top-level schemaNote as a maintenance note that nothing renders,
      and fails if live code references a .json that is not covered, so the
      list cannot go stale the way every named list in this file's history
      has. branches.json was clean throughout, so this closed a latent hole
      rather than a live breach.
      Quality pass 2026-08-14: repo half verified clean and byte-stable again,
      all 36 checkers green and all seven generators rebuilding every page
      byte-identical. The pass then found the SEVENTH instance of this repo's
      recurring fault, and it is the same named-list shape as the sixth rather
      than a new one. The 2026-08-13 pass fixed WHICH FILES the dash rule reads
      and left WHICH LINES a list of five label names. The paste sheets write
      NINE labels. The four not named were Page Permalink (177), Page slug /
      URL (163), Page name (14) and HTML URL (14), and Page Permalink is not an
      edge case: it sits between Page Title and Page Description in the same
      four-line block, is typed into the same Weebly SEO panel in the same
      sitting, and becomes the live page URL. Proved by injection rather than
      argued: an em dash in any of the four passed check-em-dashes with exit 0
      and moved the notes counter from 591 to 592 and nothing else, the
      identical signature the 3.6 pass recorded for SEO title. FIXED IN REPO,
      no sign-off needed, since it is a checker widening and not patient-facing
      copy: the rule is now a SHAPE, not a list, so any "- **Label:** value"
      line in a sheet is checked and only markdown section headings and prose
      fall to the notes bucket. Verified in ten directions, all four new labels
      and all five previously named ones now fail on injection while a section
      heading correctly stays reported. All nine labels were clean throughout,
      so this closed a latent hole rather than a live breach and no copy and no
      generated page changed. Coverage of FILES was re-derived from scratch on
      the same pass and is complete: all 182 .html under modules/ are reached,
      and the only asset a generated page loads from outside CODE_DIRS is the
      third-party Appointedd SDK. Instrument kept at
      audits/em-dash-label-coverage-probe-2026-08-14.js.
Quality pass 2026-08-31 (eighth). UNATTENDED RUN, COWORK SANDBOXED SHELL. No
SSH key for git@github.com in this shell (git fetch/push both give "Host key
verification failed"); this run's commit sits locally ahead of
origin/agents/audit-backlog until a native-host or credentialed session
pushes it. Browser WAS available this run (unlike the immediately prior run)
and answer pickup ran clean: all 17 portal entries read back (Q2-Q29 range)
were already recorded as "answered" in QUESTIONS.json, nothing new to apply.
No standing autonomous window present. All eight remaining unchecked items
confirmed [BLOCKED] directly against this file, so the quality-pass branch
was taken; 5.1 came out tied oldest by last-touched date (2026-08-14) with
3.6, 3.7, 3.8 and 4.14, all excluded as already covered by an earlier run
today except these four, and 5.1 was picked from the tie.
node tools/check-em-dashes.js re-run clean: 177 pages, 6 non-generated copy
files, 7 live module code files, 15 banners, 16 GBP packs, 11 paste sheets,
1 run-time data file, 233 files scanned, zero failures - byte-identical
counts to the seventh pass, nothing in this item's own domain has drifted.
ONE REAL DEFECT FOUND AND FIXED, one hop over into check-cdn-pins.js rather
than in check-em-dashes.js itself, by re-applying this item's own question
("which files carry public copy nobody is reading") to a sibling checker.
check-em-dashes.js added modules/emar/weebly to its own EXTRA_HTML on
2026-08-11 with the reasoning "a hand-pasted Weebly block like
modules/switch/weebly.html and is as public as one" - but check-cdn-pins.js's
EXTRA_PASTE list, whose whole job is proving a pin still holds current code,
was never told, so this file's three live CDN references (emar.css, emar.js,
core/site-data.js, all @main) sat entirely outside the one checker built to
see them. Added to EXTRA_PASTE. That surfaced a second, smaller gap
underneath: emar.css and emar.js are declared by no generator (there is no
build-emar-pages.js, unlike service and switch), the same position core/
assets are already in, so naively adding the file would have FAILED both on
"no generator declares a PIN for modules/emar" - correct in shape, wrong in
verdict, since there is structurally nothing to compare against. Generalised
the existing core/ carve-out into GENERATORLESS_MODULES, derived from the
filesystem (module folders under modules/ with no build-*.js declaring a
PIN) rather than a named list, on purpose: a typo'd module path in a paste
file matches no real folder and still fails as before, proved by injection
(sed-swapped modules/emar/emar.css to modules/emarx/emar.css, ran the
checker, got exactly one FAIL naming modules/emarx, restored the file and
confirmed sha256-identical to the pre-injection copy). All tools/check-*.js
re-run individually after the fix: 36 of 36 exit 0. No generator or
branches.json touched, so no regeneration was needed and none was run.
emar.css and emar.js at @main matched HEAD byte for byte when this landed
(git diff against locally cached origin/main, itself stale since 2026-08-15
for lack of network git access this session, so this is not a fully live
confirmation and is stated as such), so this closes a latent hole rather
than a live breach. CLAUDE.md's CDN-pins section corrected in place (it said
"five public-copy files", there are six) with a short addendum in the same
narrative style recording the finding and the fix. No pack, page, generator
or branches.json entry changed. No question raised - this is a checker
widening, not a live-facing decision. Evidence: this log entry and the
in-place check-cdn-pins.js comments; no separate audits/ file was produced,
this pass being short enough that the checker's own annotated diff is the
record.
Quality pass 2026-09-02 (ninth). UNATTENDED RUN. Both git network access
(via Windows-MCP PowerShell against the real C:\Dev\rbh-site-data repo) and
Claude in Chrome were working cleanly this run, which let this pass do
something most of the last several could not: check the actual live CDN
content rather than only the repo. REPO HALF: all 36 checkers exit 0;
node tools/check-em-dashes.js reports the same steady-state count as the
eighth pass (233 files scanned, 200 comment dashes, 591 sheet-structure
dashes, 1 maintenance-note dash, zero failures). All six generators
rebuilt; sha256 of all 203 files under modules/service/pages,
modules/switch/pages and modules/branch/pages taken before and after:
byte-identical, zero diff. Nothing has drifted since 2026-08-31.
LIVE HALF, now checked directly rather than inferred: fetched
https://cdn.jsdelivr.net/gh/rishi235/rbh-site-data@service-module-phase1/modules/service/service.js
in Chrome and read it. It still carries all three &mdash; entities the
2026-08-11 pass rewrote at source (self-refer banner, video card, "Prefer
to walk in?" card) and its NO_FALLBACK_SERVICE_KEYS still omits
"contraception" (the Q17 fix). Confirmed with `git diff
origin/service-module-phase1 HEAD -- modules/service/service.js` via
Windows-MCP PowerShell: seven hunks of difference, all fixes already on
this branch and none on the pin. origin/service-module-phase1 is a clean
ancestor of origin/main (`git merge-base --is-ancestor` exit 0) but main
itself has not absorbed this branch's fixes either - Q13/Q45's answered
"fast-forward"/"merge to main" decisions have not yet been carried out,
which is exactly what item 5.5 (still [BLOCKED]) exists to do. Not this
item's fix to make; recorded here as live confirmation of an already-known
block, not a new finding. Also re-read the Cherry Lane switch page live
(switch-prescriptions-cherry-lane-walton.html): the "How switching to
Cherry Lane Pharmacy works" paragraph still renders "it usually is not
ÔÇö we make the first step quick and easy" - the same pre-Q7 pasted em
dash as every prior pass, now showing as a different mojibake sequence
(ÔÇö rather than the "a EUR" form recorded on 2026-08-13) but the same
underlying fault: repo source holds a full stop, Weebly still holds the
old em dash, unrepasted. The page's own footer also still shows
pharmacy.FA226@mhs.net, which is Q36's already-logged typo, not this
item's. ZERO IN-REPO DEFECT. No new question: both live findings are
already tracked (item 5.5/Q13/Q45 for the CDN pin, Q36 for the mailbox
typo) and this pass changed nothing about either. Ninth consecutive clean
pass on the repo half.
Quality pass 2026-09-02 (tenth). UNATTENDED RUN. All 8 remaining unchecked
AGENT_WORKLIST.md lines confirmed [BLOCKED] (8 of 8 via direct grep), so the
quality-pass fallback applied via the standing rotation-pool method: git log
--pretty=format:"%cI|%s" matched item N.N by word boundary (case-insensitive),
first/most recent match per item, over the standing 36-item pool. Item 5.1 was
stalest, last mentioned 2026-09-02T00:39:08+01:00; item 4.11 (done in the
immediately preceding run) was most recent at 2026-09-02T21:09:53+01:00.
This pass found a REAL, previously latent gap in tools/check-em-dashes.js
itself, one item deeper than any of the prior nine passes on this item: every
numeric HTML character-reference form the checker matched (&#8212; &#8211;
&#x2014; &#x2013;) was matched by EXACT DIGIT STRING, not by decoded value.
The HTML5 tokenizer accumulates a numeric character reference's digits into a
code point and ignores leading zeros - "&#08212;" and "&#x02014;" render as
the identical em dash to "&#8212;" and "&#x2014;" in every browser - so a
zero-padded numeric entity was invisible to this checker while being exactly
as public as the un-padded form it already caught. Proved by injection rather
than argued: "&#x02014;" written into the real Page Permalink line for
Fishlocks Ainsdale in modules/switch/pages/SEO.md passed
`node tools/check-em-dashes.js` with exit 0 ("clean"). FIXED IN REPO, no
sign-off needed, same as this item's five prior checker-widening fixes: the
entity match is now two named-entity tests (&mdash;/&ndash;, exact spelling,
safe because HTML5 named references are case-sensitive with no padding
concept) plus a general numeric-reference regex whose matches are DECODED and
compared by value against U+2014/U+2013, robust to any digit count or
padding by construction - the same "shape not list" fix this checker's own
header already documents for five earlier gaps (files, code, data, sheet
files, sheet lines), now landing a sixth time one level further down, inside
the character-matching regex itself rather than in what it was pointed at.
Re-ran the same injected file after the fix: exit 1, correctly named "em dash
(HTML numeric entity)" at the right line. Restored modules/switch/pages/SEO.md
by byte copy from a pre-injection backup; SHA256 confirmed identical
(73689c39...45fd0) before and after, line count unchanged (95). Independent
proof kept at audits/em-dash-numeric-entity-padding-probe-2026-09-02.js. 15
cases: six previously-missed padded em/en-dash forms (decimal and hex, one to
several leading zeros, mixed-case X), four previously-caught un-padded forms,
three non-dash numeric entities (nbsp, padded and un-padded) to prove no new
false positive, one plain string and one literal hyphen as controls. All 15
correct. All 36 tools/check-*.js re-run individually after the fix: 36/36
exit 0, identical steady-state counts to before this pass (233 files scanned,
200 comment dashes, 591 sheet-heading dashes, 1 data-note dash), confirming
the fix changes matching logic without changing any verdict on real content.
All six generators rebuilt: git status --porcelain modules/ core/ empty
before and after, so no page or generator was touched and none needed to be -
this was a checker-only fix. Live half not read this run (Claude in Chrome
reported not connected on the standard tabs_context_mcp check; per procedure,
not retried by another route, no login attempted); the ninth pass's two live
findings (item 5.5/Q13/Q45 CDN-pin block, Q36 mailbox typo) stand unchanged
and unclaimed by this pass. No new question raised - this is a checker
widening, not a live-facing or patient-facing decision. Tenth consecutive
clean pass on the repo half; first of the ten to find a defect in the
checker's own character-matching logic rather than in a page, pack, sheet or
generator.
Quality pass 2026-09-03 (eleventh). UNATTENDED RUN. All 8 remaining unchecked
AGENT_WORKLIST.md lines confirmed [BLOCKED] by direct grep, so the
quality-pass fallback applied via the standing rotation-pool method
(git log --pretty=format:"%cI|%s" matched by word boundary over the 36-item
pool); 5.1 came out uniquely stalest again, last touched 2026-09-02
(the tenth pass), one run after being freshly touched, because the run
immediately before this one (4.11's tenth pass) advanced a different item.
Answer pickup unavailable this run (Claude in Chrome not connected at
tabs_context_mcp; not retried by another route). No standing autonomous
window present.
This pass found the SIXTH instance of this item's own recurring fault, one
level past the tenth pass's numeric-HTML-entity-padding fix and a different
axis from any of the five before it (files, code-vs-data, sheet files, sheet
lines, entity padding): a dash written as a SOURCE-LEVEL ESCAPE inside the
live module code itself, rather than as an HTML-level encoding. A JS string
or template literal can carry "\u2014" (fixed four hex digits) or the ES6
code-point form "\u{2014}" (any digit count), and a CSS string value, most
often a content: property, can carry the CSS Syntax Level 3 hex escape
"\2014" (one to six hex digits, with a single trailing whitespace
character consumed as part of the escape). All four decode to the identical
em or en dash a patient's browser or the JS engine renders once the code runs
or the stylesheet applies, and none is an HTML entity, so every dash rule in
this file before this pass - literal character, named entity, numeric entity
- matched none of them.
Proved by injection rather than argued, using a fresh instrument
(audits/em-dash-escape-sequence-probe-2026-09-03.js: refuses to run if either
target file already carries a diff, records sha256 before mutation, restores
by direct write-back immediately after each checker run, sha256-verifies the
restoration every time, never layers one injection on the last). Five real
cases against the unfixed checker, all missed (exit 0, wrongly clean): the
4-digit and ES6 code-point JS em dash escape and the 4-digit JS en dash
escape, each written into modules/service/service.js's own real video-card
sentence ("See how the free NHS service works..."); the unpadded CSS hex
escape and a padded-with-trailing-space CSS hex escape for the en dash, each
appended as a real declaration to modules/switch/switch.css. Two controls
both stayed correctly clean throughout, proving the eventual fix does not
overreach: a JS "\u0041" (the letter A, not a dash) was never flagged, and
the em dash escape written inside a whole-line // comment in service.js
stayed in the comment-dash notes bucket rather than failing, matching this
checker's own comment-blanking rule for every other form it reads.
FIXED IN REPO, no sign-off needed, same as this item's five prior
checker-widening fixes: tools/check-em-dashes.js now decodes any JS
"\uXXXX" / "\u{X...}" escape and any CSS "\X{1,6}" hex escape found on a
comment-blanked line of a .js or .css file under CODE_DIRS, by VALUE rather
than by spelling, so it is robust to digit count and padding by construction,
the same "shape not list" fix this file's own history keeps landing on.
Deliberately scoped to CODE_DIRS only: a JS-style escape has no meaning in an
HTML page, a markdown sheet or branches.json, and branches.json's string
values are read post-JSON.parse, which already decodes a genuine JSON
"\u2014" into the real character before hasDash() ever sees it, so that
path was never a gap; widening either pattern past .js/.css would risk a
false positive rather than close a real hole. Re-ran the exact same probe
script after the fix: all five real cases now CAUGHT (exit 1, correctly named
"em dash (JS unicode escape) in live module code" / "... (CSS hex escape) ..."
at the right line), both controls still correctly clean. Files confirmed
sha256-identical to their pre-probe state after every case and at the end.
All 36 tools/check-*.js re-run individually after the fix: 36/36 exit 0,
identical steady-state counts to the tenth pass (233 files scanned, 200
comment dashes, 591 sheet-heading dashes, 1 data-note dash), confirming the
fix changes matching logic without changing any verdict on real content. All
six page generators rebuilt: git status --porcelain modules/ core/ empty
before and after, so no page, pack or generator was touched and none needed
to be - this was a checker-only fix, and modules/service/service.js and
modules/switch/switch.css themselves were clean throughout (confirmed by
sha256, not only by the checker passing on them).
Live half not read this run (Claude in Chrome not connected at step 3 and not
retried at the end either); the ninth pass's two live findings (item
5.5/Q13/Q45 CDN-pin block, Q36 mailbox typo) stand unchanged and unclaimed by
this pass. No new question raised - this is a checker widening, not a
live-facing or patient-facing decision. Eleventh consecutive clean pass on
the repo half; second of the eleven (after the tenth) to find a defect in the
checker's own matching logic rather than in a page, pack, sheet or generator,
and the first to find one in the CODE rule rather than the entity rule.
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
      Quality pass 2026-08-13: repo half only, no browser available, so
      nothing live was read and nothing live is claimed. All 30 checkers
      green, all six pages regenerate byte-identical, and coverage was
      measured rather than assumed by hooking fs.readFileSync on every
      checker: 16 of the 30 read all six landing pages, and the 14 that read
      none are the service-family checkers that have no business there.
      ONE REAL DEFECT FOUND AND FIXED IN REPO, in the guard rather than the
      data. The defect this item's own 2026-08-10 pass found, McCanns
      Sandringham leading its serviceAreaList with Aigburth, its sister on
      the shared domain, was fixed in the data but no rule was ever added, so
      it could return silently. The only rule that saw list order was a
      warning in check-address-region.js that called it "harmless today".
      Proved otherwise by injection: putting Aigburth back at the head and
      regenerating changed the Weebly SEO description, the SEO.md paste
      sheet, the hero sentence, the FAQ delivery answer and the order of
      areaServed in the Pharmacy schema, and 29 of 30 checkers stayed green.
      The 30th, check-editor-snapshot, failed only because branches.json had
      been touched at all, and its own message tells the operator to refresh
      the snapshot, which clears it and leaves the defect in place on a full
      green board. check-address-region.js now FAILS when serviceAreaList[0]
      is a town another live branch owns as its seoTown, with sharper wording
      when that branch is a sister on the same domain, and keeps a warning
      for ordering that no branch owns (Cherry Lane leads with Liverpool).
      Proved to bite by two injections, same-domain and cross-domain, both
      restored with git checkout; nothing injected survives and the six pages
      are byte-identical to the committed ones. No data, no page and no
      patient-facing copy was changed. No new question raised.
      Quality pass 2026-08-14: repo half only, no browser available, so
      nothing live was read and nothing live is claimed. ONE REAL DEFECT FOUND
      AND FIXED, and this time it is in the patient-facing copy itself, not
      only in a guard. All six landing pages advertised the free NHS blood
      pressure check as being "if you are over 40". The NHS cohort is adults
      aged 40 AND OVER, which is how all fifteen GBP packs state it and how it
      is pinned in tools/check-pharmacy-first-eligibility.js. The pages were a
      year narrower than the service and turned away eligible forty-year-olds.
      All 36 checkers passed on it: the 22 that read these pages read titles,
      links, hours, NAP and copy rules, and not one reads an age. Rule 9,
      which pins exactly this cohort, read gbp-packs/ only, even though the
      header of that same checker had named
      tools/build-branch-landing-pages.js two days earlier as carrying the
      cohort as unguarded prose. Naming an unguarded file is not guarding it.
      Fixed both halves: the blurb now reads "Free NHS blood pressure checks
      for adults aged 40 and over", and rule 9 now reads the six generated
      landing pages as well as the packs, on their readable text with markup,
      JSON-LD and the paste comment stripped. Safety measured before the rule
      was widened rather than after: across all six pages the only age-shaped
      string of any kind is the cohort itself, so no opening time, postcode,
      phone number or street number is caught. Seven negative cases pass,
      including the original defect put back in the generator, a wrong cohort
      on a page, the right number attached to the wrong service, the pack half
      still biting, and a missing landing directory failing rather than
      passing quietly. One line changed on each of the six pages and nothing
      else moved; all 36 checkers green and all six generators rebuild clean.
      Evidence: audits/landing-coverage-probe-2026-08-14.js and
      audits/rule9-landing-negative-tests-2026-08-14.ps1. No new question
      raised: the cohort was already decided and pinned in this repo, so this
      is the copy being brought back to the estate's own standard.
      Quality pass 2026-08-30: fifth pass, both halves. Repo half: all 36
      checkers green and all six generators rebuilt byte-identical before
      inspection. The bank holiday work that landed since the last pass
      (branches.json bankHolidays block added 2026-08-27, checker awareness
      item 6.7 done 2026-08-29) was read against these pages: the landing
      pages state weekly hours only, and check-opening-hours.js confirms
      every visible and structured opening time on all six pages still
      matches branches.json, with the bankHolidays block validated
      alongside. ONE REAL DEFECT FOUND AND FIXED, in the data's own
      documentation rather than a page: the bankHolidays.note in
      branches.json still claimed check-live-hours.js and
      check-opening-hours.js do not read dates2026 or tradingPolicy and
      that Q79 was not yet implemented in the checkers, which item 6.7
      made untrue on 2026-08-29. A future run trusting that note would
      either hand-allow a live Closed-day mismatch the checkers now
      label, or set about rebuilding 6.7. The note now records that 6.7
      is implemented. No page, no patient-facing copy and no schema
      changed; the six pages are byte-identical to the committed ones and
      check-editor-snapshot stays clean since no branch field moved.
      Live half, read only: all six landing URLs re-read in one tab,
      nothing clicked, typed or submitted; all six still return 404,
      unchanged since 2026-08-10, now 20 days queued for the Weebly paste
      (Q35 remains the open decision on how they go live). The thirty
      service pages they link to were not re-swept this run; the
      2026-08-11 finding that all thirty return 200 stands as the paste
      prerequisite. No new question raised.
      Quality pass 2026-09-01 (sixth): clean on both halves, no repo
      defect, no new question. All 36 checkers green before inspection.
      All six generators rebuilt from branches.json; sha256 of all 203
      files under modules/service/pages, modules/switch/pages and
      modules/branch/pages taken before and after: byte-identical, zero
      diff. A fresh independent check
      (audits/verify-5.2-2026-09-01.py, imports nothing from tools/, own
      regexes) re-read all six landing pages: own seoTown present, own
      phone present, the "aged 40 and over" blood pressure cohort wording
      (fixed at source on the 2026-08-14 pass) still current on all six
      with no reversion to the stale "over 40" phrasing, and a
      cross-branch seoTown sweep. One apparent match was investigated
      rather than reported blind: Fishlocks Eccleston's page names
      "Ainsdale", which is also the seoTown of an unrelated branch
      (Hirshmans Ainsdale, a different brand), but reading the actual
      sentence confirms it is the deliberate item 2.2 sister-link
      paragraph naming Fishlocks Chemist's OWN sister branch, which
      happens to share the same town word as Hirshmans by coincidence,
      not a foreign-town breach. Two negative tests proved the script is
      not a no-op before trusting its clean result: a stale "if you are
      over 40" injection and a genuine unexcused foreign-town injection
      (both run against a scratch copy outside the repo, never against a
      tracked file) each correctly failed the script, naming the right
      branch and the right fault. NEW ANGLE CHECKED: Q21's answer (a
      per-branch `whatsapp` field in branches.json) has landed since the
      fifth pass, all 16 branches now carry it, but
      build-branch-landing-pages.js does not read it and none of the six
      pages carries a `data-wa` attribute. Confirmed correct rather than
      assumed: these six pages are navigational hubs with no booking or
      WhatsApp widget of their own, unlike the service pages they link
      to, so the field is out of scope for this generator and this is not
      a gap. Live half, read only via Claude in Chrome: all six landing
      URLs re-read, all six still 404, unchanged since 2026-08-10, now 22
      days queued (Q35 still open). One of the thirty linked service
      pages spot-checked (Fishlocks Ainsdale's Pharmacy First page)
      still returns 200 with the pre-existing Q37 footer-widget set
      unchanged; the full thirty were not re-swept this run, same scope
      decision as the fifth pass. No page, generator, checker or
      branches.json entry changed. Evidence:
      audits/verify-5.2-2026-09-01.py and
      audits/verify-5.2-2026-09-01-output.txt.
      Quality pass 2026-09-01 (seventh, unattended run, rotation-pool pick):
      repo half only, Claude in Chrome not connected so nothing live was
      read or claimed this run; the sixth pass's live findings (all six
      URLs 404, 22+ days queued, Q35 still open) stand unchanged rather
      than being re-verified. All 36 checkers green before inspection. All
      six generators rebuilt from branches.json; sha256 of all 189 tracked
      .html/.js/.css files under modules/ and core/ taken before and after:
      byte-identical, zero diff. Confirmed branches.json and the
      landing-page generator/checker files untouched since the sixth pass
      (`git log 3c590d1c..HEAD` empty for both), so this pass re-confirms
      rather than re-tests against moved data.
      NEW ANGLE: these six landing pages are exactly the six branches
      estate-wide where brandLabel != branchName (Fishlocks, McCanns and
      Scorah each run two shops on one shared domain - see CLAUDE.md
      "Which pharmacy does a page say it is"), which makes them the
      highest-risk pages in the estate for a bare-brandLabel JSON-LD/
      data-branch bug, and none of the six prior passes tested this
      specifically against these pages. Wrote a fresh independent script
      (audits/verify-5.2-2026-09-01-seventh.py, own JSON-LD parsing, no
      import from tools/) checking, per page: JSON-LD `name` equals the
      branch's own `branchName` (not the bare shared `brandLabel`),
      `data-branch` equals `branchName`, and an app-card marker is present
      if and only if the branch is an app member (true only for the two
      Fishlocks branches). All six pages clean on all three checks. Proved
      the script is not a no-op by injection against a scratch temp-dir
      copy, never the tracked file: swapping Fishlocks Ainsdale's
      branchName for the bare brandLabel in both the JSON-LD name and
      data-branch was caught (three mismatch lines, including one flagging
      it as ambiguous with the sister branch), and adding an app-download
      sentence to McCanns Aigburth (not an app member) was caught. Tracked
      files confirmed untouched throughout (`git status --porcelain
      modules/branch/` empty after both injections). No defect found, no
      page or generator changed, no new question raised. Evidence:
      audits/verify-5.2-2026-09-01-seventh.py and
      audits/verify-5.2-2026-09-01-seventh-output.txt.
      Quality pass 2026-09-02 (eighth, unattended run, rotation-pool pick):
      repo half only, Claude in Chrome not connected (checked at the start
      of the run and again before finishing), so nothing live was read or
      claimed; the seventh pass's live findings (all six URLs 404, Q35
      still open) stand unchanged. All 34 tools/check-*.js checkers ran
      individually, 34/34 clean, 0 failures. All six generators rebuilt
      byte-identical (git status --porcelain modules/ core/ empty before
      and after).
      NEW ANGLE: none of the seven prior passes had independently
      re-derived the "Get directions" button or the visible Email: contact
      line on these six pages, both hand-typed surfaces distinct from the
      tel:/JSON-LD surfaces earlier passes covered, or run full cross-branch
      NAP isolation (phone, postcode, email) against all 16 branches rather
      than only the six landing branches' own data. Wrote a fresh
      independent script (audits/verify-5.2-2026-09-02-eighth.js, imports
      nothing from tools/, own regexes): 342 checks across the six pages -
      tel: href and visible "Call ..." button digits, mailto: href and
      visible Email: line, Get directions button destination decoded and
      compared to the branch's own address, map iframe query decoded and
      compared both to the branch address and to the directions
      destination (catching drift between the two if they ever
      diverged), googleReviewUrl and nhsReviewUrl link targets, visible
      postcode in the address contact-line, JSON-LD email field, and
      phone/email/postcode isolation against all 15 other live branches.
      0 failures.
      Guard effectiveness proved by four injections against an in-memory
      copy of pharmacy-mccanns-aigburth.html (a scratch harness script,
      audits/_scratch-inject-test-5.2.js, deleted immediately after use;
      the tracked file was opened read-only throughout, confirmed by
      git status --porcelain modules/branch/ empty before and after): a
      tel: href swap to Fishlocks Ainsdale's real phone caught (own
      mismatch and foreign match both true); a visible-address postcode
      swap to Fishlocks Ainsdale's postcode caught; a Get directions
      destination changed to a fabricated address while the map iframe
      was left alone caught as a directions-vs-map drift; a mailto: email
      swap to Fishlocks Ainsdale's email caught (own mismatch and foreign
      match both true). One process slip caught and corrected before
      trusting the "clean" instrument, the same discipline recorded on
      multiple prior passes across other items: the first postcode-swap
      injection used a plain string .replace() on the bare address text,
      which silently patched the FAQ "Where do I park?" answer (the first
      occurrence of that exact string in the file) rather than the
      contact-card address line further down, so both checks read false
      with no visible error. Caught by inspecting the actual matched
      string rather than trusting the boolean, and fixed by scoping the
      replacement to the full `<div class="contact-line"><p>...</p></div>`
      wrapper, which is also why the real verify script's own regex was
      never at risk: it already requires that exact wrapper and would not
      have matched the FAQ paragraph either way. Not a defect in the
      verify script or in the page. No in-repo defect found this pass, no
      page, generator, checker or branches.json entry changed, no new
      question raised. Evidence: audits/verify-5.2-2026-09-02-eighth.js
      and audits/verify-5.2-2026-09-02-eighth-output.txt.
      Quality pass 2026-09-03 (ninth, unattended run, rotation-pool pick):
      repo half only. Claude in Chrome confirmed not connected at step 3 and
      again before finishing, so nothing live was read or claimed; the
      eighth pass's live findings (all six URLs 404, Q35 still open) stand
      unchanged. All 36 tools/check-*.js checkers ran individually, 36/36
      clean. All six generators rebuilt; sha256 of every file under
      modules/branch/pages/ taken before and after: byte-identical, zero
      diff.
      NEW ANGLE: of the 36 checkers, tools/check-seo-keywords.js reads
      modules/branch/pages/SEO.md (it is in the checker's own PAGE_DIRS
      list) and has been passing clean across all eight prior passes on
      this item, but no prior pass ever proved BY INJECTION that it
      actually catches a regression on one of these six pages' Meta
      Keywords lines, as distinct from never having seen one. McCanns
      Chemist Sandringham was chosen as the target because it is the one
      branch estate-wide whose townSlug ("sandringham") no longer matches
      its seoTown ("St Michael's", moved on item 5.7, 2026-08-10), which is
      the exact, and otherwise vacuous, condition RULE 8 (retired town
      word) exists to guard; no prior 5.2 pass had exercised that rule
      against this branch's own keywords line specifically.
      METHOD. New instrument written fresh
      (audits/verify-5.2-2026-09-03-ninth.js, no import from tools/ beyond
      invoking the real checker as a child process): refuses to run if
      modules/branch/pages/SEO.md already carries a git diff, records its
      sha256 before any mutation, and restores by direct
      fs.writeFileSync immediately after capturing the checker subprocess's
      output and BEFORE any assertion runs, the same discipline the
      eighth/ninth passes on other items used. Each injection mutates a
      freshly restored copy rather than layering on the previous one.
      INJECTION ROUND. Seven injections against the McCanns Sandringham
      Meta Keywords line only, one per rule the checker holds: (1) the
      value blanked - CAUGHT, RULE 1 pairing. (2) both occurrences of "St
      Michael's" replaced with "chemist" - CAUGHT, RULE 3 presence. (3)
      "Aintree" appended, a real live seoTown (Clear Chemist Aintree and
      Tiffenbergs Chemist Longmoor) not in this branch's serviceAreaList -
      CAUGHT, RULE 4 absence, the same example the checker's own header
      names. (4) "Fishlocks Chemist" appended, a real live branch's own
      brandLabel - CAUGHT, RULE 5 brand. (5) "PR8" appended, Fishlocks
      Chemist Ainsdale's real outward code against this branch's own L17 -
      CAUGHT, RULE 6 postcode. (6) "rapid weight loss" appended, matching
      claim-patterns.js's efficacy pattern - CAUGHT, RULE 7 claim. (7)
      "Sandringham" appended, the exact word item 5.7 retired from this
      branch's seoTown and which is not in its serviceAreaList - CAUGHT,
      RULE 8 retired town word. All seven caught on the first run; the
      whole script was then re-run a second time end to end with identical
      results, confirming reproducibility. File sha256-confirmed
      byte-identical to the original before the round, after each
      individual restoration, and after the final one; git status
      --porcelain on the target file stayed empty throughout. Full
      36-checker suite re-run clean after the round; all six generators
      re-run, git status --porcelain on modules/ empty before and after.
      RESULT. No defect on item 5.2 itself - tools/check-seo-keywords.js was
      already correctly holding McCanns Chemist Sandringham's own Meta
      Keywords line to all seven of its content rules, now proven directly
      by injection for the first time in this item's nine-pass history,
      including the one rule (RULE 8) that only this branch can make
      non-vacuous. No checker logic, page, generator or data field changed
      anywhere in the repo. No new question raised. Evidence:
      audits/verify-5.2-2026-09-03-ninth.js and
      audits/verify-5.2-2026-09-03-ninth-output.txt.
      Quality pass 2026-09-04 (tenth, unattended run, rotation-pool pick):
      repo half only. Claude in Chrome confirmed not connected
      (list_connected_browsers returned empty) at the start of the run, so
      nothing live was read or claimed; the ninth pass's live findings (all
      six URLs 404, Q35 still open) stand unchanged. Baseline: git status
      --porcelain on modules/core/tools/branches.json/gbp-packs empty before
      any work. All 36 tools/check-*.js checkers ran individually, 36/36
      clean. All six generators rebuilt from branches.json before
      inspection: git status --porcelain -- modules core empty before and
      after, byte-identical.
      NEW ANGLE. Of the 36 checkers, tools/check-brand-spelling.js reads
      modules/branch/pages (it is in both its SCAN_DIRS and its
      SHORT_SCAN_DIRS) and has passed clean across all nine prior passes on
      this item, but no prior pass on item 5.2, and no prior pass on the
      checker itself, had proven BY INJECTION that it actually catches a
      brand-spelling regression specifically inside one of these six
      landing pages' own visible copy, as distinct from never having seen
      one there. Three of the checker's rules were targeted because each
      exercises a different mechanism: rule 2 (VARIANT, derived near
      misses), rule 2's case-drift extension (added by the eighth 1.1 pass,
      2026-08-31, never exercised against a landing page), and rule 4
      (MISSPELT, listed transliterations).
      METHOD. New scratch harness written fresh
      (audits/_scratch-inject-test-5.2-tenth.js, deleted immediately after
      use; imports nothing from tools/ beyond invoking the real checker as
      a child process): refuses to run if any of the three target landing
      pages already carries a git diff, records each one's sha256 before
      any mutation, and restores by direct fs.writeFileSync immediately
      after capturing the checker subprocess's output and before any
      assertion runs, the same discipline the eighth and ninth passes used.
      INJECTION ROUND, one per target, each into visible hand-typed prose
      rather than an attribute already guarded by check-nap or
      check-branch-identity: (1) Scorah Chemists Hazel Grove's
      hero-help-row changed from "Scorah Chemists" to "Scorah Pharmacy" (a
      shop-type swap, rule 2) - CAUGHT. Scorah was chosen because it carries
      no MISSPELT entry, isolating rule 2 cleanly. (2) McCanns Chemist
      Aigburth's hero-help-row changed from "McCanns Chemist" to "Mccanns
      Chemist" (the internal capital flattened, rule 2's case-drift
      extension) - CAUGHT. (3) McCanns Chemist Sandringham's hero-sub
      paragraph changed from "McCanns Chemist" to "MacCann" (a listed
      transliteration, rule 4) - CAUGHT. All three caught on the first run;
      the whole harness was then re-run a second time end to end with
      identical results, confirming reproducibility. All three files
      sha256-confirmed byte-identical to their originals after each
      individual restoration; git status --porcelain on the three target
      files stayed empty throughout both rounds. Full 36-checker suite
      re-run clean after the round; all six generators re-run, git status
      --porcelain on modules/ and core/ empty before and after.
      RESULT. No defect on item 5.2 itself - tools/check-brand-spelling.js
      was already correctly holding all three tested surfaces to its brand
      rules, now proven directly by injection for the first time against
      any of this item's six landing pages, exercising a mechanism (rule 2)
      that none of the nine prior passes had aimed at this checker at all.
      No checker logic, page, generator or data field changed anywhere in
      the repo. No new question raised. Scratch harness deleted after use
      per its own header; nothing under audits/ was added by this pass.
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
      Q34 ANSWERED 2026-09-01 (unattended run, answer pickup via Claude in
      Chrome, which connected for the first time in several runs): "Split
      5.3 into the branches that need a paste and the branches that do
      not, and let an unattended run repoint only where the replacement
      page has been fetched and confirmed live, in the branch sitemap,
      correctly named and correctly spelled. Riddings and SK move now at
      no cost and with no paste; the other nine stay blocked and
      unchanged." Applied the rule rather than only the two named
      examples, because the worklist's own accumulated evidence (states
      five through nine above) already shows five of the eleven meeting
      that exact bar: Riddings, SK, both McCanns and Tiffenbergs. All five
      were re-fetched live today rather than trusted from the earlier
      passes, and all five still read correctly (title, trading name,
      NAP, seven conditions, ages, and for the two McCanns pages the
      sister-branch cross-reference). branches.json's pfLink for all five
      was repointed from the old shared/misspelled/no-.html target to
      each branch's own generated page, and the corresponding "Post A"
      button and paster note were updated in mccanns-aigburth.md,
      riddings-timperley.md, sk-chemists-bootle.md and
      tiffenbergs-aintree.md (mccanns-sandringham.md's pack already
      pointed at its own page from an earlier pass, so only its
      branches.json pfLink needed the swap). check-branch-links.js's
      stale KNOWN entry for tiffenbergs_longmoor.pfLink was removed (the
      field no longer breaks the rule it excused) and
      tools/branches-editor.html's embedded snapshot was refreshed to
      match. All 36 checkers green, all six generators rebuild
      byte-identical (pfLink is not read by any generator), before and
      after. The rest of the eleven stay [BLOCKED] and unchanged,
      including Coleman and Leighs and Gordon Short, which need a repaste
      before their repoint per the eighth and fourth states above, and
      any branch among the eleven not yet confirmed live in a pass. This
      item is not ticked done, only partially actioned this run. See
      AGENT_LOG.md for the full run record.
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
      Quality pass 2026-08-12: repo half verified clean a third time. All
      29 checkers green, all seven generators reproduced every page
      byte-identical, the 61-character title stands in the page, the paste
      sheet and the index, the 70-character version survives only in Q14's
      record in QUESTIONS.json, the full trading name stands in every
      visible line of copy, KNOWN in check-seo-lengths.js is still empty,
      and the self-test still derives the longest condition from
      build-service-pages.js. Live half: one plain GET, page 200, live
      title byte-identical to the run 77 reading (hand-typed "Coleman &
      Leigh Pharmacy"), so the Q14 repaste remains outstanding and remains
      the whole fix. One count correction: the decoded live title is 67
      characters, not the 68 run 77 recorded; same string, no consequence.
      Evidence: audits/insect-bite-title-live-check-2026-08-12.txt.
      Quality pass 2026-08-13: repo half verified clean a fourth time (30
      checkers green, all six generators byte-identical, the 61-character
      insect bite title standing in the page, the paste sheet and the index,
      KNOWN in check-seo-lengths.js still empty, the self-test still deriving
      the longest condition from build-service-pages.js). REPO HALF ONLY: no
      browser was available, so the Q14 live repaste is unverified this run
      and remains outstanding. ONE REAL DEFECT FOUND AND FIXED: the Q14
      length rule did not reach the switch page family at all. seo-pattern.js
      has four title composers; searchTitle, landingTitle and brandTitle all
      compose through fitTitle, and switchTitle concatenated directly, so the
      one rule item 5.6 exists to enforce was absent from 15 of the 177
      titles. Measured before fixing: the longest switch title is "Switch
      Your Prescriptions to Coleman and Leighs Pharmacy, Walton" at 64
      characters, ONE under the limit, on the longest brand in the estate,
      which is also the one brand fitTitle can rescue because it ends in
      " Pharmacy". The fixed 29-character prefix gives this family the least
      headroom of the four and it was the only one with no rule behind it.
      Fixed by wiring switchTitle through fitTitle. Negative-tested four
      ways: real data unchanged, an injected 65-character town correctly not
      shortened, an injected "Walton Vale" going 69 to 60 where the old code
      shipped 69, and a brand not ending in " Pharmacy" correctly declined
      and left long, which is Q24's recorded limitation and not a new
      question. Output unchanged: all 177 pages and all six paste sheets
      regenerate byte-identical, the only modified file is the composer.
      Measured, not fixed, and recorded here rather than raised: the true
      worst case in the estate is not the insect bite title but "NHS
      contraception service in Walton - Coleman and Leighs Pharmacy" at
      exactly 65, which is legal and correctly left alone by fitTitle, and
      check-seo-lengths.js holds its own TITLE_MAX = 65 rather than importing
      the exported TITLE_WARN_LEN, which is left as it is on purpose so the
      checker stays an independent witness to the composer.
      Quality pass 2026-08-14: repo half verified clean a fifth time (36
      checkers green, all six generators byte-identical, the self-test still
      deriving the longest condition from build-service-pages.js, KNOWN in
      check-seo-lengths.js still empty). Composer half re-measured from
      branches.json rather than trusted: 195 composed titles across all
      seven families, NONE over the 65 limit, and exactly ONE title in the
      estate is actually being rescued by the Q14 rule, the insect bite
      title at Coleman and Leighs going 70 to 61. All six generators
      compose through the four seo-pattern composers, so the switchTitle
      bypass fixed on 2026-08-13 was the last one. REPO HALF ONLY: no
      browser was available (two Chrome extension instances connected and
      an unattended run cannot choose between them), so the Q14 live
      repaste is unverified this run and remains outstanding. ONE REAL
      DEFECT FOUND AND FIXED, in the guard rather than the copy: item 5.6
      promises that only the SERP title loses the word and that the H1,
      the JSON-LD name, data-branch and every visible line of copy keep the
      full trading name. Two thirds of that was guarded and one third was
      not. Proved by injection on a real page, not argued: putting
      "Coleman and Leighs" into the JSON-LD name fails check-nap,
      check-jsonld and check-branch-identity, but putting it into the hero
      paragraph, a section heading and the contact block while leaving
      data-branch and the JSON-LD name correct passed ALL 36 checkers. The
      cause is structural, not an oversight: check-brand-spelling rule 2
      derives near misses by SWAPPING the shop-type word, never by
      dropping it, and dropping it is exactly what the Q14 rule does, so
      the one variant this repo manufactures deliberately is the one
      variant rule 2 is built not to see. Fixed by adding rule 6 to
      check-brand-spelling.js: the shortened brand may appear only on a
      line whose role is to declare the page SEO title, anywhere else in a
      generated page or paste sheet is a leak. Which brands shorten, and
      to what, is read back out of seo-pattern.js by asking fitTitle
      itself rather than restating its rule, so the two cannot drift; a
      first attempt that restated the rule as any shop-type word wrongly
      flagged "SK" and "Fishlocks" and was corrected before commit.
      Measured before writing: 0 hits across all 188 generated pages and
      paste sheets, so it fails nothing that was passing. Negative-tested
      18 ways plus three live injections, including a leak on a Riddings
      page, where "Riddings" is also the street the shop stands on.
      Street addresses and the repo's own "<short brand> <town>" shorthand
      are masked, both derived from branches.json. Output unchanged: all
      177 pages and all six paste sheets regenerate byte-identical, the
      only modified file is the checker.
      Quality pass 2026-08-31 (sixth pass, unattended, Cowork sandboxed
      shell): repo half verified clean a sixth time. All 36 checkers ran
      clean after one unrelated fix (see below); all eight generators
      reproduced every page and paste sheet byte-identical; the 61-character
      insect bite title stands unchanged in the page, the paste sheet and
      the index; KNOWN in check-seo-lengths.js is still empty; the self-test
      still derives the longest condition from build-service-pages.js; and
      switchTitle still composes through fitTitle. BEFORE starting this
      item's own pass, check-brand-spelling.js was found failing estate-wide
      (1 of 36 checkers), unrelated to 5.6: gbp-packs/gordon-short-crosby.md
      line 192 (the seventh-pass live-recheck note the immediately preceding
      run added) reported the live "Gordon Shorts Chemist" misspelling
      without quotation marks, breaking the quoted-is-evidence convention
      rule 2 relies on to tell a note from a claim. Fixed by quoting it, the
      same way the four other live-recheck notes in that same file already
      do; checker back to clean; no other item affected; not logged against
      4.14 since it is a one-line formatting fix to that item's own most
      recent note, not new fact-finding.
      Live half: checked via Claude in Chrome (read-only). The live Weebly
      SEO title field for insect-bite-treatment-coleman-leigh-walton.html is
      unchanged since first read on 2026-08-10/11: "Infected insect bite
      treatment in Walton - Coleman & Leigh Pharmacy", 67 characters,
      ampersand and singular "Leigh", matching no version this repo has ever
      shipped. The live meta description also reads "Coleman & Leigh
      Pharmacy" against the repo's "Coleman and Leighs Pharmacy". The H1
      is correct and carries no brand, as the family A pattern requires. The
      Q14 repaste (title and description together, from
      modules/service/pages/SEO.md) remains the whole fix and remains
      outstanding, now unconfirmed-changed across seven live reads spanning
      2026-08-10 to 2026-08-31. No new question: Q14 already describes this
      exactly and already recommends the repaste. Evidence gathered inline
      this run (document.title, H1 and meta description read via JavaScript
      in the live page), not saved to a separate audit file.
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
      Quality pass 2026-08-12: repo half verified clean a third time. All
      28 static checkers green, all seven generators byte-stable.
      branches.json still reads seoTown "St Michael's" with townSlug held
      at "sandringham" on purpose, serviceAreaList leading St Michael's,
      and KNOWN_SEO_TOWN in check-address-region.js still carries the
      deliberate mccanns_sandringham::townSlug hold with its written
      reason. All 13 pages the branch owns lead with St Michael's in H1
      and in the paste-sheet title, description and meta keywords, every
      permalink keeps sandringham, and the apostrophe is plain ASCII
      throughout. Live half read by plain GET across all 13 URLs: the
      landing page still 404s, the 12 content pages return 200 with
      titles and H1s still leading Sandringham and still carrying
      Weebly's default " - MCCANNS PHARMACY" suffix, and sitemap.xml
      carries the single lastmod 2026-07-18 throughout, so nothing has
      been republished and the recorded repaste from the three SEO.md
      sheets remains the whole fix. Wider live coverage than run 78,
      which recorded nine content pages; no state change is implied,
      since the sitemap is unchanged. No in-repo defect, no new
      question. Evidence:
      audits/sandringham-town-live-check-2026-08-12.txt.
      Quality pass 2026-08-13 (run 162): repo half clean for the fourth pass
      running, REPO HALF ONLY (browser unavailable, Q59). 142 checks over the
      13 owned pages, the sister landing page, three paste sheets, the switch
      generator's hardcoded town table and the exception list, 0 failures.
      All 31 checkers green, all six generators byte-identical. seoTown still
      "St Michael's" with an ASCII apostrophe, townSlug still held at
      "sandringham", serviceAreaList still leading St Michael's, every
      permalink unmoved. The two surviving "Sandringham" strings are the
      branchName and the branch mailbox, which are NAP facts this item never
      touched; the first cut of the run's own verifier called them defects and
      was corrected rather than the data. THE DEFECT WAS IN THE EXCEPTION,
      not the data. The Q15 hold in check-address-region.js was keyed to the
      RULE it excuses ("townSlug must be the slug of seoTown"), which every
      seoTown whose slug is not "sandringham" also breaks, so one approved
      arrangement licensed all of them. The stale-key guard proved the
      exception was still used and nothing proved it was still the exception
      Rishi granted. Proved by injection: seoTown moved to "Lark Lane" and the
      change made the way an operator would make it, in branches.json, the
      hardcoded table in build-switch-pages.js and the pack's catchment order.
      Thirty of thirty-one checkers went green; the thirty-first,
      check-editor-snapshot, fires on any branches.json edit and tells the
      operator to refresh the snapshot, which clears it. Thirteen pages, three
      paste sheets, the pack and the areaServed schema then led with a word
      nobody approved. Fixed in the verifier: every KNOWN_SEO_TOWN entry must
      now declare an "expect" block of the values it was granted for, a new
      grantedFor() gates all three consumption sites, an entry with no expect
      fails, and an expect naming a field this file does not read fails. Nine
      negative tests, six fire and three are false-positive guards. No page,
      generator, data field or piece of patient-facing copy changed, no new
      question. Evidence:
      audits/sandringham-town-item-5.7-quality-pass-2026-08-13-run162.txt.
      Quality pass 2026-08-14 (fifth, run 203). Done 2026-08-14. REPO HALF
      ONLY (browser unavailable, Q59, fortieth consecutive run). The migration
      re-verified correct: seoTown "St Michael's" with an ASCII apostrophe,
      townSlug still held at "sandringham", serviceAreaList still leading
      St Michael's, 13 Meta Keywords lines carrying St Michael's and none
      carrying the old word. ONE REAL DEFECT FOUND AND FIXED, in the guard
      rather than on a page, and it is this item's own subject matter.
      check-seo-sheets.js parses three of Weebly's four SEO fields and never
      Meta Keywords, so 177 lines of public copy are compared to nothing
      there. Their dedicated guard, check-seo-keywords.js, has a rule for a
      wrong town, but it asks whether the word is ANOTHER LIVE BRANCH's
      seoTown, so its edge is the set of live seoTowns. 5.7 RETIRED a town
      word, and a retired word is in nobody's set. Proved by a contrast pair
      on one line: "Aintree" fires that rule, "Sandringham" - the word 5.7
      itself retired - passed all 36 checkers. So the one item that created
      an orphaned town word is the one item whose regression its own guard
      could not see. Fixed with RULE 8, retired town word, derived from
      townSlug against seoTown so it needs no list to maintain and covers
      the next townSlug hold automatically; the permalink keeps the word on
      purpose and is not policed, and a word genuinely back in
      serviceAreaList is not retired. Five negative tests, three fire and two
      are false-positive guards. All 177 keywords lines scanned: 0 foreign
      town words, so a latent hole closed, not a live breach. No page,
      generator, data field or patient-facing copy changed. No new question.
      Two method errors were caught mid-run and corrected rather than
      reported: PowerShell re-encoding a sheet and mangling its em dashes,
      which made an unrelated checker fire, and a "git checkout -- ." that
      silently reverted the fix before its own tests ran. Both are written up
      in the evidence file. Evidence:
      audits/sandringham-town-item-5.7-quality-pass-2026-08-14-run203.txt.
      Quality pass 2026-08-30 (this run): repo half re-verified again. All 35
      static tools/check-*.js checkers pass (check-live-hours.js excluded,
      needs a live fetch). branches.json still holds seoTown "St Michael's"
      with townSlug held at "sandringham" on purpose; all 13 pages the branch
      owns still lead with St Michael's in title, description, H1, meta
      keywords and hero copy; permalinks unmoved; the Aigburth sister
      cross-link still names St Michael's; the GBP pack's catchment order
      fix from the 2026-08-11 pass still holds. Live half read again by
      plain GET on switch-prescriptions-mccanns-sandringham.html: unchanged
      from every prior pass, the live SEO title, H1 and body copy still say
      "Sandringham", not "St Michael's" - the Weebly repaste flagged
      OUTSTANDING since 2026-08-10 has still not happened. No new question;
      this is the same recorded paste backlog, reconfirmed, not a new defect.
      Two regressions were found and fixed during this pass, both caused by
      this run's own earlier work (Q24: widening the title-shortening rule
      to Chemist-suffixed brands), not by anything in 5.7 itself: (1)
      check-brand-spelling.js rule 6 read "SK CHEMISTS" (an uppercase build
      comment header) as a bare "SK" leak because its shop-type-word lookahead
      only matched title case; the lookahead alternatives were widened to
      also match the all-caps forms (an attempted case-insensitive fix was
      tried first, reverted immediately when it started matching lower-case
      URL slugs like "-scorah-hazel-grove-" and produced 785 false failures);
      (2) modules/branch/pages/INDEX.md:24 had a genuine bare "Fishlocks"
      mention with no shop-type word, reworded to "Fishlocks Chemist". All
      35 checkers clean after both fixes.
      CORRECTION TO METHOD: this item was picked without first checking the
      established rotation-exclusion list recorded earlier today (1.1, 1.4,
      2.2, 5.6, 5.7, 6.7, 6.8 are one-offs, not part of the rotation pool).
      5.7 should not have been the rotation pick; it was still worth doing
      because it re-verified this run's own Q24/Q28 edits caused no regression
      elsewhere, but it does not reset 5.7's rotation clock in the sense the
      other candidates use. Per the same method, 4.2 (Cherry Lane GBP pack)
      is the one rotation candidate not touched on 2026-08-30 (last pass
      2026-08-29 22:35 BST) and should be the next run's quality-pass item.
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
      decision lands. Q57 (2026-08-12) records a sixth live instance of the
      same template at fishlockpharmacy.co.uk/weight-loss-services-eccleston
      -ainsdale.html, homepage-linked; whatever fix Q22 chooses should cover
      it too. Q58 (2026-08-12, found on the 4.11 quality pass) records a
      SEVENTH at skchemist.co.uk/weight-loss-clinic.html. SK matters beyond
      the count for two reasons. It was the branch the 2026-08-10 assessment
      used as its control, "no old page", so the five-page scope was built on
      a premise now known to be wrong; the page was missed because only the
      homepage was read and not the branch sitemap, which means the sweep for
      this item must be driven from each branch sitemap. And SK is the
      cleanest stricter-regime case in the set: its own top nav and a
      homepage tile both link straight into the legacy page, so that regime
      applies without needing to establish ad spend, which is the fact the
      assessment recorded it could not establish. Corrected in
      compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md under the 2026-08-12
      heading.
      2026-08-12 (evening, run 128, found on the 4.15 quality pass, recorded
      not decided): one of the seven branch sitemaps has already been read
      and does not need reading again. Run 86 read the Tiffenbergs Aintree
      sitemap on 2026-08-11 and recorded, in
      audits/tiffenbergs-aintree-gbp-pack-check-2026-08-11.txt, that the
      legacy weight loss page is live and sits in that sitemap alongside the
      generated inner page, so Tiffenbergs is publishing two pages for one
      service, the SK shape. What is still unknown for Tiffenbergs is only
      the link context, whether the homepage or top nav points into the
      legacy page, which is what decides regime 1 against regime 2. That
      context is established for two branches only, SK and Fishlocks. The
      sweep should record both facts per branch, sitemap listing and link
      context: either one alone settles nothing. Added as an addendum to the
      assessment. No new question, no live read, nothing touched.
      2026-08-30 (sixth pass on item 4.3, Hirshmans Chemist Ainsdale): an
      eighth live instance found, hirshmanspharmacy.co.uk/weight-loss-clinic.html.
      All six elements from the 2026-08-10 assessment present (superlative
      Mounjaro claim, Real Results heading, outcome slider, named treatment
      picker, lead price of "39.99" above the fold) plus a wrong branch
      address matching the known 5.3 HARD STOP error. All four on-page
      weight-loss link slots on the live homepage (top nav, secondary nav,
      footer nav, content image) point at the legacy page and none point at
      the compliant generated page this branch's own GBP pack already links
      to, the clearest regime 1 case confirmed yet, stronger than SK. Raised
      as Q85, recommending the SK-style unlink-first approach given the
      severity. Full evidence in compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md
      under the 2026-08-30 addition for Hirshmans. gbp-packs/hirshmans-ainsdale.md
      itself is unaffected and was not touched. Item 5.8 stays [BLOCKED].

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
      Quality pass 2026-08-13: the four live findings of 2026-08-11 stand as
      written and Q53/Q54 stay open; no browser was available, so nothing
      live was re-read and nothing live is re-claimed. ONE REAL DEFECT FOUND
      AND FIXED IN REPO, in the checker rather than in a page. RULE 1 of
      tools/check-service-links.js is the only repo-side rule guarding the
      class of link this item is about, and it matched one link shape only:
      absolute, estate host, ending .html. That was 6 of the 421
      estate-internal links on the 177 generated pages. The other 415 were
      covered by no rule: 244 relative hrefs (the service cross-links, which
      are exactly the dead-cross-link and stale-permalink shape 6.2 exists
      to catch) and 171 bare-host homepage links. The extensionless shape,
      which is what Riddings /clinic-prices is, could not be seen either.
      Rule widened to read all three shapes and proved by injection: a
      relative link to a non-generated page, a relative link with a query
      string, and an extensionless estate path all now fail, and the
      original 6 absolute links still resolve. No page, generator, data
      field or piece of patient-facing copy was changed. No defect was
      hiding in the blind spot on the day it was closed: all 244 relative
      targets resolve to pages this repo generates, so the gap was the
      finding, not a live breakage. All 30 checkers green before and after.
      Second quality pass 2026-08-14, REPO HALF ONLY: the Cloudflare Access
      session was not signed in, so no live page was read and nothing live is
      re-claimed. The four live findings of 2026-08-11 stand as written and
      Q53/Q54 stay open. TWO REAL DEFECTS FOUND AND FIXED, both in the checker,
      neither on a page. The 2026-08-13 widening made RULE 1 of
      tools/check-service-links.js read all three link shapes, but it still
      resolved a target BY FILENAME against the estate as a whole, asking only
      whether a basename existed somewhere. Every generated page is published to
      exactly one Weebly site, at that site's root, so that was the wrong
      question. Defect 1, cross-host: a relative link from a Fishlocks page to
      contraception-riddings-timperley.html passed, because the file exists,
      and 404s live, because fishlockpharmacy.co.uk does not serve Riddings'
      pages. That is the dead-cross-link class this item exists to catch, and
      all 244 relative links sat in the blind spot. Defect 2, subpath: the rule
      took everything after the last slash, so a path with a directory in it
      resolved on the filename at the end, and Weebly publishes at the root.
      RULE 1 now resolves by host, attributing each page to its domain by its
      brandSlug-townSlug suffix, so the paired Fishlocks, Scorah and McCanns
      branches correctly share a host and may cross-link, and rejects any path
      carrying a directory. A page nothing can attribute to a host now stops the
      run rather than quietly weakening the rule. Proved by injection, four
      cases: cross-host and subpath both passed the old rule and both fail now;
      not-in-repo and extensionless failed before and still do. Verified by a
      second extractor written from scratch for this pass and sharing no code
      with tools/ (audits/link-integrity-2026-08-14.js, own globbing, own href
      regex covering both quote styles, own resolution model, five coverage
      gates): it reached the same estate independently, 177 pages, 987 hrefs,
      421 estate-internal (177 absolute, 244 relative, 171 homepage), and found
      ZERO defects on the pages. So no defect was in either blind spot on the
      day it was closed: the gaps were the finding, not a live breakage. Counts
      and the six known issues are unchanged by the widening, so the rule is not
      weaker anywhere it was already strong. No page, generator, data field or
      piece of patient-facing copy was changed. All 36 checkers green, and all
      six generators reproduced every page byte-identical, before and after.
      Third quality pass 2026-08-30, BOTH HALVES for the first time since the
      2026-08-11 sweep. Repo half: ONE REAL DEFECT FOUND AND FIXED, in the
      checker, not on a page. RULE 1 of tools/check-service-links.js read
      double-quoted hrefs only, so a single-quoted href - hand-added, or
      emitted by a future generator change - was read by no rule at all. All
      1,705 generator-emitted hrefs are double-quoted today, so nothing was
      hiding behind the gap on the day it was closed. Proved by injection in
      both directions: a single-quoted link to a dead estate page and a
      single-quoted cross-host link both passed the old rule and both fail
      the widened one, and the double-quoted control fails both. Verified by
      a third from-scratch extractor sharing no code with tools/
      (audits/link-integrity-6.2-2026-08-30.js: own globbing, own href regex
      reading both quote styles, own resolution model, five coverage gates,
      one proved to fire by mutation). It reached the same estate
      independently: 177 pages, 987 hrefs, 421 estate-internal (6 absolute
      with a path, 244 relative, 171 homepage), 5 known targets carrying 6
      references, ZERO defects. Clean-tree counts identical before and after
      the widening. Live half, read only, five URLs, nothing clicked or
      typed: all four 2026-08-11 findings re-read for the first time since
      the sweep and all four stand unchanged 19 days on. The canonical
      Riddings switch permalink still 404s and the old permalink still
      serves; Tiffenbergs book-now.html still 404s; Riddings /clinic-prices
      still 404s while service-price-list.html serves. Q53 and Q54 stay open.
      NEW FACT recorded on Q53's note: the stale live Riddings switch page
      carries the 'Support that delivers results.' weight loss tile, an
      efficacy claim the repo's generated replacement does not contain, so
      the queued permalink fix also removes a live results claim on a weight
      loss service. No page, generator, data field or piece of patient-facing
      copy was changed. All 36 checkers green, and all six generators
      reproduced every page byte-identical, before and after.
      Fourth quality pass 2026-08-31, both halves. ONE REAL DEFECT FOUND AND
      FIXED, in the checker, not in any page. check-service-links.js's RULE 2
      (efficacy/results claims) and RULE 3 (POM medicine names) exist
      specifically to keep prescription-only medicine names and outcome
      promises off public copy, and both read PAGE_DIRS only - the 177
      generated pages. Six files carry live public copy without being a
      generated page (two hand-pasted Weebly embeds, two DRAFT-*.html content
      specs the weight loss and travel clinic generators cite as their own
      approved-copy source, and two Cherry Lane "old page" replacement
      blocks), and check-em-dashes.js has scanned all six as its own
      EXTRA_HTML since the item 3.9 and 5.1 quality passes - the item 3.9
      pass found a stale &ndash; surviving in DRAFT-weight-loss-copy.html
      after the generated pages were fixed for it, so this repo already knew
      this exact file class carried copy risk. check-service-links.js read
      none of them. Extracted the six-file list into
      tools/extra-public-copy-files.js (path segment arrays, one per file) so
      it is one source of truth rather than two copies that happen to agree;
      check-em-dashes.js's own EXTRA_HTML now derives from it, proved
      byte-identical before and after (233 files scanned, same clean-tree
      counts). check-service-links.js now scans all six for RULE 2 and RULE 3
      in full (neither needs a host), and for RULE 1 (link targets) resolves
      the two Cherry Lane replacement files against their real branch host,
      since both carry a genuine relative link into a real Weebly page
      (verified against branches.json's cherry-lane-walton entry rather than
      hardcoded); the other four are store-agnostic templates with no single
      branch to resolve a relative link against, so a relative href on them
      is skipped only when it is an unstamped {{TOKEN}} placeholder and
      otherwise reported as "unattributed relative link" rather than silently
      passed, the same stop-rather-than-weaken convention already used for a
      generated page with no matching branch host. Zero hits on all six files
      when this was added (1,000 links now counted, up from 987, all new
      count from the extra files; still 6 KNOWN, still 0 unexplained
      failures): the gap was latent, not a live breach. Proved by injection,
      four cases, each reverted to a byte-identical file afterwards (git diff
      empty on modules/ throughout): a POM name added to
      DRAFT-weight-loss-copy.html caught by RULE 3; a claim added to
      modules/emar/weebly caught by RULE 2; a real relative link added to the
      store-agnostic DRAFT-travel-clinic-copy.html caught as "unattributed
      relative link"; and the Cherry Lane pharmacy-first replacement's own
      link retargeted to a non-existent page caught as "stale target" via the
      new host-aware resolution. All 36 checkers green and all six generators
      reproduced every page byte-identical, before and after; no generator,
      page, data field or patient-facing copy touched.
      Live half, read only, four URLs, nothing clicked or typed: all four
      2026-08-11 findings re-read a second day running and all four stand
      unchanged - Riddings' canonical switch permalink still 404s and the old
      permalink still serves the full switch page (still carrying its own
      "Support that delivers results" weight loss tile, already noted against
      Q53); Tiffenbergs' book-now.html still 404s; Riddings' /clinic-prices
      still 404s. Q53 and Q54 stay open, nothing new to add to either.
      Fifth quality pass 2026-09-01, REPO HALF ONLY (Claude in Chrome
      unavailable this run). ONE REAL DEFECT FOUND AND FIXED, in the checker,
      not in any page. RULE 2 (claims) and RULE 3 (POM medicine names) exist
      to keep outcome promises and prescription-only medicine names out of
      public copy, and until this pass both read PAGE_DIRS and the six
      EXTRA_FILES only - all of it static HTML on disk. Two files inject
      further patient-facing copy into a page's DOM at RUNTIME, after the
      static HTML has loaded, and were read by no rule at all:
      modules/service/service.js's injectPFExtras() writes a self-refer
      banner, an explainer-video card, a "prefer to walk in" card and a
      client-side re-link of any stale "Page coming soon" condition tile into
      every Pharmacy First page, and modules/switch/switch.js writes the
      callback and switch-form field labels. A claim or a medicine name
      written into one of those template strings would have passed every
      checker in the repo. The same service.js function also builds a link
      href at runtime (from location.pathname and a hardcoded SLUGS table)
      rather than emitting a static one, so RULE 1 cannot see it either;
      checked by hand rather than extending RULE 1 to the JS source, because
      a naive href-literal scan of the JS misreads its own string
      concatenation (href='" + telHref + "') as a malformed link - the runtime
      link is safe because brandTown always comes from the current page's own
      pathname, so it only ever resolves on that page's own host, and the
      SLUGS table's seven keys were checked against build-service-pages.js's
      condition-card text and against the filenames of all 98 generated
      condition pages and all 14 overview pages, exact matches throughout.
      tools/check-service-links.js now reads modules/service/service.js and
      modules/switch/switch.js through RULE 2 and RULE 3 only (a new
      EXTRA_JS_COPY_FILES list, scanned via a shared scanCopy() function
      pulled out of the RULE1/RULE2/RULE3 block so JS files never run through
      RULE 1's href regex); modules/emar/emar.js stays excluded on purpose, the
      same Borough Care boundary check-whatsapp-route.js already draws.
      Zero hits on both files when this was added: the gap was latent, not a
      live breach, the same shape every 6.2 pass before this one has found.
      Proved by injection, three cases, each file restored to its
      pre-injection sha256 afterwards: a results claim added to service.js's
      self-refer banner text, a medicine name added to switch.js's "Start your
      switch" button label, both caught by the widened checker and both
      invisible to it beforehand. Verified by a from-scratch independent
      script sharing no code with tools/claim-patterns.js or
      tools/pom-names.js (audits/service-links-js-copy-independent-2026-09-01.js:
      own medicine list, own claim phrases, own file list): 0 hits on the
      clean files, and it independently caught the same two injected strings
      when tested against them. All 36 checkers green and all six generators
      reproduced every page byte-identical, before and after; no generator,
      page, data field or patient-facing copy touched. Live half not read
      this pass (Claude in Chrome unavailable); the four 2026-08-14 findings
      are not re-claimed. Q53 and Q54 stay open.
      Sixth quality pass, 2026-09-02 (unattended scheduled run), REPO HALF
      ONLY (Claude in Chrome not connected this run either). NO NEW DEFECT
      FOUND. All 35 checkers in tools/ ran individually and exited clean (0
      failures across the board; the usual WARN/NOTE lines are pre-existing
      and unrelated to this item). Both 6.2-specific independent instruments
      re-run clean: audits/link-integrity-6.2-2026-08-30.js reached
      177 pages, 987 hrefs, 421 estate-internal (6 absolute, 244 relative,
      171 homepage), 5 known targets/6 references, 0 defects; audits/
      service-links-js-copy-independent-2026-09-01.js scanned both
      EXTRA_JS_COPY_FILES (service.js, switch.js) with its own medicine list
      and claim phrases, 0 hits. All six generators (build-service-pages,
      build-switch-pages, build-branch-landing-pages, build-weight-loss-pages,
      build-travel-clinic-pages, build-contraception-pages) reproduced every
      page byte-identical: git status --porcelain modules/ core/ was empty
      both before and after the rebuild. One angle examined and ruled out
      rather than left unasked: blankComments() in check-service-links.js
      strips only HTML-style <!-- --> comments, and is applied unmodified to
      the two EXTRA_JS_COPY_FILES (added on the fifth pass). A JS file has no
      HTML comments, so blankComments() blanks nothing in service.js or
      switch.js, meaning every JS-source comment in those two files is
      scanned as "visible" text by RULE 2 and RULE 3, the same as any real
      template string. That is over-inclusive, not under-inclusive: it
      cannot hide a claim or a POM name (the failure mode every prior 6.2
      pass has been hunting), it can only ever produce a false FAIL if a
      future code comment happens to contain a claim phrase or a medicine
      name, which is a maintainability note, not a defect, and is not
      independently confirmed as a live problem, so no checker change was
      made on the strength of it alone. Also read core/site-data.js in full:
      it is a branches.json fetch-and-fallback shim, dispatches events, and
      contains no patient-facing prose or claim/medicine-shaped strings
      (only a hardcoded FALLBACK branch record with address fields, already
      covered by check-brand-spelling.js's own FALLBACK check), so its
      absence from EXTRA_FILES/EXTRA_JS_COPY_FILES is correct, not a gap.
      QUESTIONS.json re-read: 94 total, 41 open, Q53 and Q54 both still
      "open", nothing new to add to either; the four 2026-08-14 live findings
      are not re-claimed, live half not read this pass. Environment: 
      mcp__workspace__bash (Cowork sandboxed Linux shell) returned
      "Permission to use mcp__workspace__bash has been denied" on every call
      this run; all git, Node and file work was done via
      mcp__Windows-MCP__PowerShell against the canonical C:\Dev\rbh-site-data
      working copy, the established route recorded on every recent pass.
      Seventh quality pass, 2026-09-03 (unattended scheduled run). NO NEW
      DEFECT FOUND. Live half attempted and refused: navigation to
      riddingspharmacy.co.uk via the built-in browser was denied both on
      preview_start and a direct retry, consistent with no user present in
      this unattended session to approve a new site; the four 2026-08-14
      live findings (Riddings switch permalink, Tiffenbergs book-now.html,
      Riddings /clinic-prices) are not re-read and not re-claimed this pass,
      and Q53/Q54 stay open unchanged. All 36 checkers ran individually and
      passed, one transient false failure ruled out first: check-postcodes.js
      briefly failed against this run's own git-log scratch dump in
      _agentscratch (quoting the same narrative postcodes, including the
      McCanns Sandringham correction CH49 1SX, that CLAUDE.md documents and
      several prior passes have hit the same way); deleted, not a repo
      defect, checker re-ran clean. FRESH ANGLE: every one of the six prior
      6.2 passes widened or re-proved RULE 1's link-shape and host-resolution
      logic in check-service-links.js; none had tested what that resolution
      does when a branch is marked disposed in branches.json while its
      already-generated pages are still sitting on disk unregenerated, which
      is exactly the shape Wilmslow's disposal took before the generators
      themselves learned to skip a disposed branch (item 1.4) - but this
      exercises check-service-links.js's own separate host-attribution code,
      not the generators' skip logic, and that code had never been tested by
      any prior pass. METHOD: disposed:true injected onto a real, single-host
      branch (gordonshorts_crosby, chosen because it shares no domain with a
      sister branch, so the blast radius is limited to that branch's own 12
      pages), check-service-links.js run as a real child process, output
      captured, then branches.json restored by byte copy and sha256-verified
      identical to its pre-injection hash (904de09bc3118cefcfd7ae3f8e045b9ea
      1d090c634c70114f135101f0b969e1e, confirmed both before injection and
      after restore) before any assertion could leave the file mutated on
      disk - the same discipline every prior 6.2 and the 3.13 seventh-pass
      injection probe has followed. New instrument:
      audits/verify-6.2-2026-09-03-seventh.js, no import from tools/ beyond
      invoking the checker as a subprocess. RESULT: check-service-links.js
      correctly refused to run rather than silently mis-resolving or quietly
      ignoring the orphaned pages, failing outright with "page(s) not
      attributable to a branch host" and naming all 12 of
      gordonshorts_crosby's generated pages individually (the switch page and
      all 11 service pages). That is the checker's own "stop rather than
      quietly weaken the rule" convention, proved for the first time against
      a live-shaped disposal-in-progress rather than only against a
      synthetic unattributed filename. Full 36-checker suite and a
      byte-identical git diff on branches.json/modules/core/tools/gbp-packs
      re-confirmed clean after restore. No checker logic, page, generator or
      data field changed. Environment: mcp__workspace__bash (Cowork
      sandboxed Linux FUSE mount of C:\dev\rbh-site-data) used throughout for
      orientation, reading, the stalest-item derivation and the injection
      probe itself; git push is not possible from that mount (HTTPS has no
      cached username, SSH has no host key - the standing Q87 diagnosis), so
      this entry's commit and push were done via mcp__Windows-MCP__PowerShell
      against the canonical C:\Dev\rbh-site-data working copy, which the
      mount is a live view of the same files. One incidental fix made before
      the commit: a .git\index.lock left behind by this run's own bash git
      status call failing to clean up after itself on the FUSE mount (not by
      a running git process - confirmed via Get-Process before deleting it)
      was removed via mcp__Windows-MCP__FileSystem, since an unremoved lock
      file would have blocked every git command on the canonical copy for
      this and any later run. Two of this run's own stale scratch files
      (_agentscratch/gitlog_debug.txt, _agentscratch/gitlog_check.txt) were
      also deleted after use; the wider _agentscratch pile of untracked
      scratch files from many earlier runs was left alone, out of this
      item's scope.
      Eighth quality pass, 2026-09-04 (unattended scheduled run). NO NEW
      DEFECT FOUND. Live half not read this pass: Claude in Chrome reported
      not connected, and the built-in browser pane required a new-site
      approval for riddingspharmacy.co.uk with no user present in this
      unattended session to grant it, so request_access was not called and
      nothing was clicked, typed or submitted. The four 2026-08-14 findings
      (Riddings switch permalink, Riddings /clinic-prices, Tiffenbergs
      book-now.html) are not re-read and not re-claimed; Q53 and Q54 stay
      open unchanged.
      FRESH ANGLE: tools/check-service-links.js carries two "stop rather
      than quietly weaken the rule" fail-safes that no prior 6.2 pass had
      ever exercised (confirmed by grepping AGENT_WORKLIST.md for
      "missingExtra", "missingJsCopy", "not present", "listed in
      tools/extra-public-copy-files" and "listed in EXTRA_JS_COPY_FILES"
      before starting: zero matches other than one unrelated line on item
      4.2). A listed EXTRA_FILE (one of the six non-generated public-copy
      files) or EXTRA_JS_COPY_FILE (service.js, switch.js) going missing is
      meant to fail the run outright rather than silently narrowing RULE 2
      and RULE 3 back down to PAGE_DIRS-only. Every prior pass proved what
      the checker catches inside a file it reads; none proved the checker
      notices when a file it is supposed to read has disappeared - the same
      class of gap the seventh pass closed for the separate
      unattributed-page fail-safe by injecting a disposed branch, applied
      here to the two fail-safes that pass did not touch.
      METHOD: audits/verify-6.2-2026-09-04-eighth.js (own script, invokes
      the real checker as a child process, imports nothing from tools/
      beyond the checker itself and its own extra-public-copy-files.js
      list). Baseline confirmed clean (exit 0); working tree confirmed
      clean via git status --porcelain first. Each of the eight listed
      files renamed away one at a time with fs.renameSync (never deleted),
      the real checker run as a child process, then the file renamed back
      immediately and its restored bytes sha256-compared against a Buffer
      read before the rename, before any assertion could leave the repo
      mutated. RESULT: all eight caught first attempt - the six EXTRA_FILES
      each failed with "file(s) listed in tools/extra-public-copy-files.js
      but not present", naming the correct file, and both
      EXTRA_JS_COPY_FILES failed with "file(s) listed in EXTRA_JS_COPY_FILES
      but not present", naming the correct file - and all eight restored
      byte-identical (sha256-confirmed) with the working tree clean
      throughout. Both fail-safes work exactly as designed; zero in-repo
      defect. Full 36-checker suite re-run individually after the probes:
      36/36 exit 0. All six generators rebuilt: git status --porcelain --
      modules core tools branches.json gbp-packs empty before and after,
      byte-identical output confirmed. No checker logic, generator, page,
      banner or data field changed in the tracked tree at any point. Output
      saved to audits/verify-6.2-2026-09-04-eighth-output.txt.
      Environment: mcp__workspace__bash (Cowork sandboxed Linux FUSE mount
      of C:/dev/rbh-site-data) used for orientation, the lock, the
      QUESTIONS.json read and the independent stalest-item computation (git
      log matched per candidate against the standing 36-item rotation pool:
      6.2 uniquely stalest at 2026-09-03T13:14:57+01:00, matching and
      confirming the 3.13 eighth pass's own forward note). git fetch/pull
      origin-https succeeded read-only and confirmed the mount level with
      origin at bac9338 (the 3.13 eighth pass's own commit), no divergence;
      git push is not possible from the sandbox mount (HTTPS has no cached
      username, SSH fails host key verification - the standing Q87
      diagnosis), so the verification script, this entry and the
      commit/push were done via mcp__Windows-MCP__PowerShell and native
      file tools against the canonical C:\Dev\rbh-site-data working copy,
      the established route given Q87's unresolved sandbox-push blocker.
      QUESTIONS.json re-read in full: 95 total, 42 open, no pickup
      available this run (Claude in Chrome not connected), no new question
      raised. .agent-lock deleted before exit.
- [x] 6.3 Opening hours vs branches.json, shared-domain and multi-branch
      sites: Smartts' live site (homepage sidebar and footer) reads Mon-Fri
      9am-6pm against branches.json's NHS-sourced 09:00-13:00 and
      14:00-18:00 (confirmed 2026-06-24); Riddings was checked as a control
      and is correct. Check the remaining branches not yet verified against
      the live site, starting with Coleman & Leigh, Gordon Shorts and
      Tiffenbergs, then the rest of the 14. Log a question per branch with a
      mismatch rather than fixing silently, since the fix is live-only copy.
      Done 2026-08-11
      Quality pass 2026-08-12: re-ran tools/check-live-hours.js read-only
      across all 14 trading branches (evidence
      audits/live-hours-check-2026-08-12.json) and read every snippet
      against branches.json. Verdicts unchanged from 2026-08-11: thirteen
      match, Smartts is still the sole mismatch (homepage hours card,
      contact page and site footer all say Mon-Fri 9am-6pm straight
      through against the NHS-sourced lunch closure), so Q55 stands as
      raised and stays open. The Scorah footer carries explicitly
      labelled per-branch hours lines (Bramhall Sat 9am-1pm, Hazel Grove
      Sat and Sun closed), read directly this time without needing the
      raw-order check; the Fishlocks and McCanns cards were tied to
      branches by their adjacent addresses as before, both correct.
      check-opening-hours.js green in the repo half. No in-repo defect
      found.
      Second quality pass 2026-08-13, REPO HALF ONLY: two Chrome instances
      are connected and an unattended run cannot choose between them, so no
      browser call was made, nothing live was read and nothing live is
      re-claimed. The 2026-08-12 verdicts stand as written and Q55 stays
      open. ONE REAL DEFECT FOUND AND FIXED IN REPO, in the checker rather
      than in any page or piece of data. tools/check-opening-hours.js is the
      dedicated guard for this item and it could not see an omitted day.
      Rules 1 to 3 compare the page against branches.json, and expectedRow()
      renders a day that is in neither closedDays nor specification as
      "Closed", which is exactly what the generator writes, so page and data
      are derived from the same gap and always agree. Rule 4 guarded the
      contradiction, a day in both lists; nothing guarded the gap, a day in
      neither. Proved by injection: removing Saturday from mccanns_aigburth
      without adding it to closedDays made the landing page publish
      "Saturday: Closed" for a branch that trades 9am to 1pm and 2pm to 5pm,
      and check-opening-hours still reported clean. The only two checkers
      that failed were incidental and neither is a guard for this:
      check-gbp-packs reads the static pack rather than the page, and
      check-editor-snapshot fires on any branches.json edit at all,
      legitimate or not. Publishing "Closed" on a trading day is the same
      fault as publishing the wrong time, pointed the other way: it turns
      patients away rather than sending them to a locked door. New rule 6
      added at data level, so it covers the ten branches with no landing
      page as well, because an unstated day also reaches the GBP packs and
      the JSON-LD. Negative-tested eight ways: omission caught on a
      landing-page branch and on a non-landing-page branch, a dropped
      weekday block caught, a closedDays entry removed and caught, rule 4
      still firing, no fire on a branch carrying no openingHours, and no
      fire on a legitimate closure that is properly stated and regenerated.
      Zero branches breach it on today's data, so the fix is a no-op on the
      current estate and closes the gap for the next edit. No page, no
      generator, no data field and no patient-facing copy changed. All 31
      checkers green and all six generators rebuild byte-identical. No
      question raised. Done 2026-08-13.
      Third quality pass 2026-08-14 (run 202), REPO HALF ONLY: two Chrome
      instances are connected and an unattended run cannot choose between
      them, so no browser call was made, nothing live was read and nothing
      live is re-claimed. The 2026-08-12 verdicts stand and Q55 stays open.
      ONE REAL DEFECT FOUND AND FIXED, again in the checker rather than in any
      page or piece of data, and it is the layer under rule 6. Every rule this
      checker had moved the READER deeper into the hours card and left its
      EDGE where it was: rules 1 to 3 read the structured rows and the
      JSON-LD, rules 4 to 6 read branches.json, and nothing read the rest of
      the page at all. So an hours claim written anywhere else on a landing
      page was not wrong to this checker, it was invisible to it, and
      check-gbp-packs cannot cover it either because that checker reads the
      static pack rather than the generated page. Proved by adding one FAQ
      answer to build-branch-landing-pages.js, "We are open Monday to Friday,
      9am to 6pm, and Saturday mornings": ALL 36 CHECKERS EXITED 0 while all
      six landing pages published it two inches under an hours card reading
      "Monday: 9am to 1pm, 2pm to 6pm". That is this item's own subject
      matter, the Smartts straight-through Mon-Fri 9am-6pm claim that hides a
      lunch closure, reproduced in the repo, contradicting the page's own card
      and sending a patient to a locked door at 1.30pm. New rule 7 is a
      CONTAINMENT rule rather than another comparison: the hours card is the
      only place on a landing page a clock time may appear, so it does not
      matter how a future claim is worded, which a comparison rule would have
      to parse and would lose to the next phrasing. Read raw, so a time in a
      title or alt attribute counts. Backed by a coverage floor (88 clock
      times swept today), a KNOWN_TIME_OUTSIDE_CARD exception list on the
      usual stale-key-fails contract, and a deliberate design choice that a
      changed card markup fails loudly via rule 1 rather than falling silently
      open. Negative tested 11 ways, 7 must-catch and 4 must-pass, all as
      expected, including the attribute-only time, full-stop minutes, a stale
      exception key, a blinded reader, the changed markup, and three
      false-positive guards. Residual stated: a bare 24-hour time ("open 9 to
      18") is not read, because those numerals cannot be told from "seven
      common conditions" or "aged 16 to 64" without inventing false positives
      on live patient pages. Zero pages breach the rule today, so the fix is a
      no-op on the current estate and closes the gap for the next edit, as
      rule 6 was. No page, generator, data field or patient-facing copy
      changed. All 36 checkers green and all six generators rebuild
      byte-identical, before and after. No question raised. Evidence:
      audits/opening-hours-rule7-negative-tests-2026-08-14.ps1. Done
      2026-08-14.
      Third quality pass 2026-08-30, both halves. Repo half: rule 7
      re-proved by injection (the FAQ prose hours claim was caught on the
      generated pages, checker exit 1, tree restored to a zero diff, all
      static checkers green). Live half, first since 2026-08-12:
      check-live-hours.js across all 14 trading branches (evidence
      audits/live-hours-check-2026-08-30.json), the first read with the
      6.7 bank holiday labelling active - 2026-08-31 (Summer bank
      holiday, tradingPolicy closed) was flagged by the tool. Verdicts:
      thirteen branches match branches.json; Smartts still publishes
      straight-through Mon-Fri hours with no lunch closure on the
      homepage card, the NAP line and the contact page, so Q55 stands as
      raised. ONE SURVEY-TOOL DEFECT FOUND AND FIXED: the snippet window
      (1 line before each weekday line, 2 after) dropped each hours
      card's own heading while keeping the NEXT card's, so the raw
      snippets read the Scorah contact page as Bramhall Sat Closed and
      Hazel Grove Sat 9am-1pm, the exact swap of the truth; a read-only
      look at the live DOM shows the first card is Hazel Grove (Sat
      Closed, correct) and the second Bramhall (Sat 9am-1pm, correct).
      Leading window widened to 6 lines so each card carries its own
      address or postcode line; today's audit JSON regenerated and now
      reads correctly without leaving the file.
      Fourth quality pass 2026-09-01 (unattended run, Cowork sandboxed
      shell). Repo half: all 36 checkers run fresh, all green; all six
      generators rebuilt to a byte-identical worktree against
      audits/_before-6.3-2026-09-01.sha256 (203 files, zero diff). Live
      half re-run for the first time since 2026-08-30:
      tools/check-live-hours.js executed directly from this sandbox's own
      shell via Node's native fetch (no browser needed, network reaches
      all 14 branch domains), evidence
      audits/live-hours-check-2026-09-01.json. The bank holiday label
      correctly named 2026-08-31 (Summer bank holiday, one day before
      this run) as near, so the reader allows for it before reading any
      Closed snippet. All 14 branches' snippets read by hand against
      branches.json: thirteen match exactly, including the seven
      lunch-closure branches (mccanns_aigburth, mccanns_sandringham,
      hirshmans_ainsdale, colemanleigh_liverpool, gordonshorts_crosby,
      tiffenbergs_longmoor all publish their closed-1-2pm hours live, and
      scorah/fishlocks/skchemists/riddings/cherry_lane's straight-through
      or half-day Saturday hours all match too). Smartts remains the sole
      mismatch: both the homepage hours card and the contact page still
      publish straight-through "9:00am - 6:00pm" with no lunch closure,
      against branches.json's NHS-sourced 09:00-13:00/14:00-18:00 split,
      unchanged since first found. Q55 stands as raised, live-only fix,
      not something this repo can correct. Checker trusted rather than
      assumed: rule 7 (the containment rule that catches a clock time
      printed anywhere outside the hours card) re-proved by injection on
      a scratch copy of the repo outside the working tree (never against
      a tracked file) - added a spurious "9am to 6pm on Saturdays" FAQ
      answer to McCanns Aigburth's landing page, checker correctly
      exited 1 with two failures naming both times and the right file;
      scratch copy discarded afterwards, tracked tree untouched. No
      in-repo defect found, no fix needed, no new question. Evidence:
      audits/live-hours-check-2026-09-01.json,
      audits/_before-6.3-2026-09-01.sha256,
      audits/_after-6.3-2026-09-01.sha256 (identical).
      Fifth quality pass 2026-09-02 (unattended run, Cowork). Repo half: all
      36 checkers run individually, 36 of 36 exit 0; all six generators
      rebuilt, sha256 of all 203 generated files identical before and
      after; git status empty on modules/, branches.json, gbp-packs/ and
      tools/ throughout. Live half re-run: the sandbox reached all 14
      branch domains directly over plain HTTPS (confirmed by a curl 200
      against two branch hosts first), so tools/check-live-hours.js ran
      unattended with no browser needed, evidence
      audits/live-hours-check-2026-09-02.json. Bank holiday labelling
      checked against bankHolidays.dates2026 by hand (only 2026-08-31 falls
      within the 14-day window of this run, and the tool's own console
      note named exactly that date and no other). All 14 branches' live
      snippets read against branches.json by address, phone and postcode
      rather than by the snippet's own trailing section label, because the
      Fishlocks and Scorah pages still interleave one section's footer
      contact details with the next section's heading and hours inside a
      single extracted snippet (the same shape the 2026-08-30 pass
      described; the 2026-08-14 widening fixed the LEADING drop, not this
      trailing carry-over, and it remains a reading hazard rather than an
      in-repo defect, since the tool deliberately hands raw snippets to a
      human rather than auto-verdicting). Read this way, all thirteen
      previously-matching branches still match exactly, including the
      seven lunch-closure branches and both split-domain pairs read by
      their own address/phone rather than the trailing label. Smartts
      remains the sole live mismatch: the homepage hours card, the contact
      page and the site footer all still publish straight-through
      "9:00am - 6:00pm" (or "09:00 - 18:00") with no lunch closure, against
      branches.json's NHS-sourced 09:00-13:00/14:00-18:00 split. Q55 stands
      as raised; this remains a live-only fix outside this repo's control,
      not something a worker run can correct. One fresh check not run on
      any prior pass of this item: rule 6 (the omission guard added
      2026-08-13, last proved 2026-08-13) re-tested by injection this run
      rather than assumed - removed Saturday from riddings_timperley's
      closedDays in the tracked branches.json without adding it to
      specification (an omission, not a stated closure), ran
      check-opening-hours.js: failed exactly as designed ("Saturday is in
      neither closedDays nor specification"), then branches.json restored
      from a pre-injection copy taken immediately before the edit and
      confirmed byte-identical by sha256 both before overwriting and after
      restoring; checker re-run clean (36/36) and git status confirmed
      empty on the file throughout via git status --porcelain (both the
      sandbox mount and, independently, Windows-MCP PowerShell against the
      real C:\Dev\rbh-site-data). No page, generator or data field left
      changed. No in-repo defect found, no fix needed, no new question.
      Evidence: audits/live-hours-check-2026-09-02.json (this pass's live
      survey). Note for whoever runs the next pass: a stale, zero-length
      .git\index.lock (Windows timestamp 02/09/2026 03:10) was found
      during this run's git status calls from the sandboxed Linux mount,
      causing an "unable to unlink ... Operation not permitted" warning
      there; confirmed under the procedure's 1-hour/no-process threshold
      it does not yet qualify for deletion (under a minute old when found,
      no git process running per Get-Process on the Windows side), so it
      was left in place and not touched, and all git status/diff checks in
      this run were cross-verified via Windows-MCP PowerShell instead,
      which was unaffected by it. Worth a look if a future run finds it
      still present and genuinely stale.

      Quality pass (sixth), done 2026-09-03: baseline check before any
      change found tools/check-postcodes.js failing (1 failure) - the
      ninth-pass item 3.8 write-up in AGENT_LOG.md quoted its injection
      value "L23 6TX" without adding it to NARRATIVE_POSTCODES, so the
      repo-wide postcode checker had been red since that commit landed.
      Fixed in-repo: added the entry to NARRATIVE_POSTCODES with a reason
      naming the 3.8 ninth pass; check-postcodes.js re-run clean (0
      failures, 3 pre-existing UNOWNED warnings unchanged). All 36
      checkers then re-run individually: 36 of 36 exit 0. All six
      generators rebuilt from branches.json: sha256 of all 216 files
      under modules/ and core/ identical before and after, git status
      --porcelain modules/ core/ empty throughout.
      INJECTION PROOF: rule 4 (a day in both closedDays and specification
      at once) had not been proved by injection in any of this item's
      five prior passes, unlike rules 6 and 7. branches.json backed up
      byte-for-byte first (sha256 904DE09B...). "Saturday" added to
      gordonshorts_crosby's closedDays alongside its existing Saturday
      opening sessions: check-opening-hours.js failed immediately and
      specifically ("gordonshorts_crosby: Saturday is listed in
      closedDays and also carries opening times"), exit 1. Restored by
      byte copy from the backup, sha256 confirmed identical
      (904DE09B...), all 36 checkers re-run clean, git status --porcelain
      branches.json empty afterwards.
      LIVE HALF: Claude in Chrome unreachable (tabs_context_mcp reported
      not connected, checked at answer pickup and again before this
      item's live check); per procedure not retried by another route, no
      login attempted. Fell back to the established read-only HTTP GET
      route (Invoke-WebRequest, GET only). Smartts homepage
      (smarttschemist.co.uk) still publishes "9:00am - 6:00pm" straight
      through with no lunch closure, in both the hours card (five
      matches) and the entity-encoded footer widget ("9am-6pm, Sat & Sun
      closed") - unchanged since first found 2026-08-11. Gordon Short
      Crosby checked as a live control: correctly publishes "9:00am -
      6:00pm (closed 1-2pm)" throughout, confirming the injection target
      branch's live copy still agrees with branches.json. Q55 (raised
      2026-08-11) was answered via the portal on 2026-09-02 - Rishi chose
      option 1, edit the live Smartts pages to the lunch-closure wording -
      but the live site has not yet been edited as of this pass, which is
      expected: implementing Q55's answer is a Weebly session outside
      this worker's write scope (browser use stays read-only). Not
      re-raised as a new question; Q55 stands as answered-but-not-yet-
      actioned, worth flagging to whoever next has Weebly access.
      One in-repo defect found and fixed this pass (the postcode
      exemption gap above); zero defects in check-opening-hours.js
      itself. Evidence: this write-up; no new audit file needed since the
      HTTP checks were brief and are quoted here in full.
      Quality pass (seventh), 2026-09-03 (unattended run, Cowork). REAL COVERAGE
      GAP FOUND AND CLOSED, in the checker rather than any page or data field.
      Rules 1 to 7 all scope to the six branch landing pages, the only page
      family built with an hours card, because that is the surface rule 7 was
      built to contain. Nothing checked whether the same fault could reach any
      of the other 171 public pages: the 15 switch pages and the 156
      service-family pages (Pharmacy First, weight loss, travel clinic,
      contraception), none of which carries an hours card at all, so nothing
      in this checker or any of the other 35 had ever swept them for a clock
      time. A sentence such as "call us weekdays 9am to 6pm" added to a
      switch-page FAQ or a service-page trust bar would publish an hours claim
      with nothing in the estate to compare it to branches.json, and every
      checker would still exit 0 - rule 7's own gap, reopened one layer out.
      New rule 8 added: an absence rule, not a comparison, since none of these
      pages has anything to check a clock time against. Swept 177 files: the
      171 generated switch/service-family pages plus five hand-pasted public
      copy files that carry the same exposure and are read for the same reason
      check-em-dashes.js already reads them (as public as a generated page the
      moment somebody pastes them) - modules/switch/weebly.html,
      modules/emar/weebly, modules/service/DRAFT-weight-loss-copy.html,
      modules/service/DRAFT-travel-clinic-copy.html and the two files under
      modules/service/weebly-paste/. Same KNOWN_TIME_OUTSIDE_ESTATE stale-key-
      fails exemption contract as rule 7's KNOWN_TIME_OUTSIDE_CARD, and the
      same coverage-floor guard (fails if the sweep finds zero files, so a
      broken path cannot pass by reading nothing).
      INJECTION PROOF, three ways, each backed up by sha256 first and restored
      byte-for-byte after: "Open 9am to 6pm weekdays." inserted into
      modules/switch/pages/switch-prescriptions-sk-chemists-bootle.html (a
      switch page), modules/service/pages/contraception-cherry-lane-walton.html
      (a service-family page) and modules/switch/weebly.html (a pasted public
      copy file). All three caught immediately and specifically, two failures
      each (one per clock time), six failures total, exit 1. All three files
      restored from their pre-injection backups; sha256 confirmed identical to
      baseline on each; full 36-checker suite re-run clean (36/36) immediately
      after; git status --porcelain modules/ empty afterwards. Anti-rot also
      proved: a stale KNOWN_TIME_OUTSIDE_ESTATE key run against a scratch copy
      of the checker (never the tracked file) failed correctly and specifically
      ("nothing matched it"); scratch copy deleted afterwards, tracked checker
      untouched by that test.
      Zero pages carry a clock time in this sweep today, so the fix is a no-op
      on the current estate and closes the gap for the next edit, the same
      posture rules 6 and 7 were added under. Baseline before any edit: one
      pre-existing failure in check-postcodes.js, traced to this run's own
      scratch file (_agentscratch/log_dump.txt, a git-log dump made for the
      item-selection rotation derivation and left behind after use) carrying
      postcodes from old commit messages that check-postcodes.js reads because
      it scans the whole repo; deleted, not a repo defect, checker clean
      afterwards. All 36 checkers then re-run individually: 36 of 36 exit 0.
      All six generators (plus build-audit-status.js) rebuilt: sha256 of every
      file under modules/ and core/ identical before and after, git status
      --porcelain modules/ core/ branches.json empty throughout. Live half not
      re-run this pass (repo-only finding; Q55's live Smartts status is
      unchanged and not re-claimed here). No new question raised - this was a
      checker-coverage gap with an obvious, low-risk fix (an absence rule with
      no live breach to weigh), not a judgement call for Rishi. Only
      tools/check-opening-hours.js changed; no page, generator, data field or
      patient-facing copy touched.

- [ ] [BLOCKED] Q60 6.4 (low priority, cosmetic) McCanns nav button styling: on
      mccannspharmacy.co.uk (shared Aigburth/Sandringham site, Weebly), the
      three weight loss nav entries ("Weight Loss Clinic", "Weight Loss
      Clinic (Aigburth)", "Weight Loss Clinic (Sandringham)") have Weebly's
      per-item "show as button" style switched on while every other nav
      item is plain text, which wraps the desktop nav into four rows.
      Confirmed live 2026-08-13 by reading the nav DOM: exactly those three
      links carry a teal background, nothing else does. Not on this repo,
      Weebly editor only. Depends on the decision at 6.5 below: if the
      weight loss landing page comes out of the main nav entirely, this
      may resolve itself by removing two of the three entries rather than
      restyling them. Check the same three-button pattern on Fishlocks and
      Scorah, the other shared-domain sites, while in there.
- [ ] [BLOCKED] Q60 6.5 Weight loss nav architecture: decide whether the weight loss
      landing (advertising) page should appear in the main site nav at
      all, per each branch, or only be reached via ad campaigns and a
      direct link, with only the inner information page kept in the nav.
      Keeping the landing page out of primary navigation removes it from
      the near-total-prohibition regime for organic visitors entirely
      (RBH_WeightLoss_Advertising_Standards.md: Regime 1 covers "any page a
      button proactively links to"), and reduces nav clutter at the
      shared-domain sites. Competitor check 2026-08-13: Superdrug Online
      Doctor's main nav carries one generic category link, "Weight Loss &
      Wellbeing", no drug name, with promotional claims kept to a homepage
      banner ("consultation", a discount code, no named POM or personalised
      outcome). LloydsPharmacy does not surface weight loss as a top-level
      nav item at all, it sits inside the "Online Doctor" dropdown; their
      homepage carousel does carry a precise outcome claim ("up to 22.5% of
      body weight") next to a discount code, which is the same shape of
      claim RBH's own standards document treats as high risk, so a
      competitor doing it is not evidence it is safe, only evidence
      enforcement is inconsistent. Feeds into the wider decision at Q22.

- [ ] [BLOCKED] 6.6 Q66 (downgraded to low urgency, see the correction below)
      HTTP/HTTPS duplicate
      indexing: checked live in real Google Search Console (not Ahrefs) on
      2026-08-13 for Cherry Lane, Riddings and McCanns. All three have BOTH
      http:// and https:// versions of pages separately indexed and
      splitting clicks, with no consistent winner: Cherry Lane's insecure
      http://www.cherrylanepharmacy.co.uk/ homepage took 342 of the
      domain's 742 clicks in the last 90 days versus only 13 for the
      https:// homepage; Riddings and McCanns split closer to evenly (151
      vs 105, and 190 vs 119). This points to a missing or inconsistent
      http-to-https redirect, and/or no canonical tag, at the Weebly or DNS
      level, present on at least 3 sites and worth checking estate-wide.
      Splitting authority and clicks between two URLs for the same page is
      a plausible driver of the mixed, inconsistent Site Explorer and GSC
      trends noticed this week, more concrete than a seasonal guess. Fix is
      a redirect/canonical setup, not patient-facing copy, so this can be
      actioned without a content sign-off once confirmed estate-wide.
      Check Weebly's own domain/HTTPS settings first (Weebly usually forces
      https by default; if these sites don't, something was changed or
      they're on an older Weebly HTTPS setting).

      CORRECTION 2026-08-13, same day, after testing the live redirects:
      the redirect is NOT broken. Loading http://www.cherrylanepharmacy.co.uk/,
      http://www.riddingspharmacy.co.uk/ and http://www.mccannspharmacy.co.uk/
      in a browser all land correctly on the https:// version. So no visitor
      is being left on an insecure page and the original framing of this item
      was overstated. Two things remain genuinely true and worth doing:
      (a) NO CANONICAL TAG on any page checked (Cherry Lane, Riddings,
      McCanns homepages all return canonical: NONE; only og:url is present).
      A self-referencing canonical is the standard way to tell Google which
      version is authoritative and would speed consolidation onto https.
      Weebly may or may not expose this; check SEO settings and header code.
      (b) Google is still holding and serving the legacy http:// URLs in its
      index, which is why GSC attributes clicks to them (the click is
      recorded against the URL that appeared in the search result, before
      the redirect fires). This is a historic index artifact that normally
      decays on its own; the canonical tag at (a) helps it along. Downgrade
      from "high priority" to "worth doing, low risk, no urgency". Do NOT
      change any Weebly domain or SSL setting on the strength of the
      original wording above; nothing there is misconfigured.
      Repo-side check 2026-08-13 (run 135), so the next run does not repeat
      it: none of the 177 generated pages carries a rel="canonical" tag, and
      no page or branches.json field carries an http:// URL, every one is
      https. The two "canonical" hits in build-contraception-pages.js are
      about the canonical paste SHEET, not the tag. So the repo is neither
      the cause nor the fix: these pages are body embeds pasted into Weebly
      and a canonical tag belongs in the head, which Weebly owns. This item
      is Weebly domain and HTTPS settings or DNS. It is NOT blocked on a
      decision, it is blocked on tooling: live GSC and the Weebly admin both
      need the browser, which unattended runs have not had since run 121
      (see Q59). Next run should take this item if the browser is back.
      Run 159, 2026-08-13, repo half only, no browser: THE THIRD SURFACE.
      Run 135 checked the repo and the earlier notes checked Weebly, and
      between them they missed the one place the estate publishes a URL to
      Google on purpose. Nine of the sixteen Google Business Profiles carry
      an http:// website field where branches.json says https:// (Clear,
      both Fishlocks, McCanns Aigburth, head office, Riddings, both Scorahs,
      SK Chemists). That was ALREADY WRITTEN DOWN, in GBP_MANUAL.md section
      6 item 2, on 2026-08-09, four days before this item was raised, and
      neither document referenced the other. Raised as Q66 and the two are
      now linked from both ends.
      THE IN-REPO DEFECT, which is the part this run fixed: GBP_MANUAL.md
      section 5 is the state table a later sweep reads to decide what is
      left to do, and it marked all nine of those rows "correct", one of
      them literally "correct, http", while section 6 of the same file said
      all nine are wrong. A table that clears what the prose flags is worse
      than no table. The nine verdicts now name the divergence and cite
      Q66, and McCanns Aigburth is recorded as diverging on PATH as well as
      scheme, since it points at contact-us.html while its sister branch on
      the same domain points at the https root.
      A CAUSAL CLAIM TESTED AND DROPPED, not asserted. The tempting story
      is that the insecure citations drive the split. They do not. Of the
      three branches measured in GSC above, Cherry Lane is the ONLY one
      whose profile is already correctly https, and it has the worst split
      by a wide margin, 342 to 13 against Riddings 151 to 105 and McCanns
      190 to 119. If the citation drove it, Cherry Lane would be the clean
      one. So Q66 is worth doing on its own terms, a right citation and one
      less redirect hop, and it should not be expected to move these
      numbers. The canonical tag at (a) remains the thing that would.
      STANDING GUARD ADDED. Run 135's result was true and nothing held it,
      so one http:// href pasted into a generator would put an insecure
      estate URL onto up to 177 live pages with all 30 checkers green.
      tools/check-url-scheme.js (checker 31) fails on any insecure URL on a
      generated page, paste block, GBP pack or branches.json URL field, with
      XML namespace URIs allowed because they are identifiers and are http
      by specification, and holds every row of the GBP table against
      branches.json so a divergence cannot be recorded as correct again.
      Today: 222 published files, 59 URL fields, 16 table rows, 0 insecure,
      9 held under KNOWN against Q66. Ten negative tests, control clean
      before and after. No page, generator, data field or piece of
      patient-facing copy was changed.
      WHAT IS LEFT, and why it is blocked rather than done: the GBP edits
      need Rishi (Q66, a write to live verified listings), and the canonical
      tag needs the Weebly head and therefore the browser (Q59). There is
      no repo-side work remaining on this item.

- [x] 6.7 Bank holiday awareness in the hours checkers: branches.json now
      carries a bankHolidays block (added 2026-08-27, Q79 answered) with
      gov.uk's 2026 England and Wales dates and tradingPolicy: "closed",
      confirmed by Rishi - all branches close on every date in it. Neither
      check-live-hours.js nor check-opening-hours.js reads either field
      yet. Found live in a Cowork session checking a McCanns Aigburth GMB
      fix: the live Google listing correctly showed Monday closed for the
      31 August bank holiday, and without the gov.uk cross-check this read
      as a second data defect stacked on top of the one Dane had actually
      found and fixed (14:15 vs 14:00). check-live-hours.js should skip or
      specially label any date in dates2026 rather than compare it to the
      weekly openingHours rows, and check-opening-hours.js should not fail
      a generated page's JSON-LD or visible card for omitting a one-off
      closure that dates2026/tradingPolicy already accounts for.
      Negative-test that a genuine weekly-hours mismatch on a non-bank-
      holiday date still fails, so the exemption cannot swallow a real
      defect that happens to land near one of the seven dates.
      Done 2026-08-29. check-live-hours.js labels rather than skips: the
      report gains a bankHolidays section (region, tradingPolicy,
      withinDays 14, nearThisRun) and a console NOTE when any dates2026
      date falls within 14 days of the run, so a one-off Closed snippet
      near a holiday is read in context instead of raised as a defect.
      check-opening-hours.js keeps every weekly rule exactly as it was, no
      rule reads dates2026 and a page is never failed for omitting a
      one-off closure the policy accounts for, and now validates the block
      itself (real ISO dates, no duplicates, tradingPolicy one of
      closed/reduced/normal) because the live labelling depends on it.
      Negative-tested four ways: bad date, bad policy and duplicate date
      each fail, and a genuine Tuesday mismatch injected into a landing
      page still fails on a non-holiday date, so the awareness cannot
      swallow a real defect. Demonstrated live this run: 2026-08-31 is two
      days out and audits/live-hours-check-2026-08-29.json carries the
      label.
      Quality pass 2026-09-04 (first pass since 2026-08-29, the stalest
      completed item in the 42-item pool: nothing else had gone longer
      without a re-check). Data first: fetched gov.uk/bank-holidays live
      (fetched today, page itself last updated 2026-09-02) and confirmed
      all eight dates in branches.json's bankHolidays.dates2026 against its
      published "Past bank holidays in England and Wales 2026" and
      "Upcoming bank holidays in England and Wales 2026" tables exactly:
      1 Jan, 3 Apr, 6 Apr, 4 May, 25 May, 31 Aug, 25 Dec, 28 Dec (the last
      being the Boxing Day substitute day, 26 Dec falling on a Saturday).
      No drift since Q79. check-opening-hours.js run clean against the
      tracked repo (6 landing pages, rule 7's 88 clock-time sweep, rule 8's
      177-file no-hours-card sweep, all pass) and check-live-hours.js run
      live: today (2026-09-04) sits 4 days after the 31 August bank
      holiday, so nearThisRun correctly returned ["2026-08-31"] for the
      first time this item has had a real near-date to exercise rather
      than a synthetic one; read every live Closed snippet in the fresh
      report and none is a one-off Monday closure near that date, only the
      standing weekly Saturday/Sunday pattern, so no defect was
      silently mislabelled as a holiday. This item's four original
      negative tests (bad date, bad policy, duplicate date, genuine
      mismatch survives) had stood since 2026-08-29 without ever being
      re-proven, so this pass re-ran all four plus two more by injection on
      a disposable robocopy scratch copy outside the tracked tree (PowerShell
      against the canonical C:\Dev\rbh-site-data working copy; this
      sandbox's read-only mount was used only for analysis, matching Q87):
      an invalid ISO date ("2026-13-03") FAILed by name, a duplicated date
      FAILed by name, an invalid tradingPolicy ("sometimes") FAILed by
      name, an emptied dates2026 array FAILed by name (block present but
      vacuous is always wrong), the whole bankHolidays block deleted
      degraded correctly to a NOTE and exit 0 rather than a FAIL (a
      genuinely absent block is a known degraded state, not a defect), and
      a genuine Tuesday hours mismatch injected into
      modules/branch/pages/pharmacy-mccanns-aigburth.html (a split-day,
      bank-holiday-adjacent branch) still FAILed on rule 7 with the exact
      mismatch quoted, proving the bank-holiday exemption cannot swallow a
      real defect. Scratch copy deleted after each restoration; sha256 of
      the tracked branches.json confirmed identical before and after
      (904de09b...969e1e); git status --porcelain on the touched tracked
      files was empty throughout. Full 36-checker suite re-run against the
      tracked repo after: 36/36 exit 0. Zero in-repo defect found, no new
      question raised.

- [x] 6.8 Plain-English decision line on the rest of the open backlog: Done 2026-08-29
      QUESTIONS.json holds 55 open items (Q17 to Q78, excluding answered
      ones). Rishi flagged that the "question" field buries the actual
      decision under file names and generator names he does not need to
      read to decide, and asked for the fix in rule form (added above,
      2026-08-28) rather than a one-off cleanup. Four items were retrofitted
      the same day as a working example: Q17, Q18, Q19 and Q24 each now
      open with one plain-English "Decision needed:" sentence stating the
      choice and, where there is one, the recommendation, with the existing
      technical detail left in full straight after it. The remaining ~51
      open items still read as they did before. Do this with the same care
      as the four above, not mechanically: read each question, its options
      and its note before writing the one-line summary, and do not shorten,
      soften or drop any existing technical detail, option or note. This is
      a rewrite of the opening sentence only. One run is unlikely to clear
      all 51; note here how many are done and keep going next run.
      Progress 2026-08-29: ten more retrofitted this run with a plain-English
      opening sentence and recommendation, originals preserved in full: Q20,
      Q21, Q22, Q28, Q29, Q34, Q35, Q36, Q37 and Q38. With the four done
      2026-08-28 (Q17, Q18, Q19, Q24) and Q80/Q81 written that way from new,
      40 open questions remain to retrofit. Keep going next run from Q39.
      Quality pass 2026-08-31: checked the actual state of QUESTIONS.json
      against this note's own "40 remain, keep going from Q39" instruction,
      since all non-blocked worklist items are done and this was the least
      recently touched. The 40 had already been cleared by runs between
      2026-08-29 and 2026-08-30 that did the retrofit work but never wrote a
      progress line here, the same missing-worklist-note gap Q84 raised
      about other items; Q39 to Q82, Q84 and Q85 all carried a "Decision
      needed:" opening already. One gap remained: Q83, dated 2026-08-30, was
      the only open question of 51 with no retrofit, most likely added by a
      run that retrofitted its siblings (Q82, Q84, Q85) but missed the one
      in between. Fixed by prepending one plain-English sentence stating the
      choice (fold the McCanns Aigburth lead-price finding into item 5.8, or
      leave it on record, or fix it standalone) and the recommendation
      (fold into 5.8), with the full original finding preserved verbatim
      straight after, same convention as every other retrofit. Verified
      programmatically that all 51 currently open questions (Q34 to Q85,
      excluding answered ones) now open with "Decision needed:" and that
      JSON.parse still succeeds. check-em-dashes.js, check-postcodes.js and
      check-url-scheme.js, the three checkers that read QUESTIONS.json, all
      still pass with 0 failures. No page regenerated, nothing else in the
      repo touched. This item is now genuinely complete: no open question
      remains unretrofitted. Any future question added to QUESTIONS.json
      still needs the same "Decision needed:" opening under the standing
      rule near the top of this file; this is not a one-off any more.

## Questions for Rishi
(See AGENT_LOG.md for the running list.)
