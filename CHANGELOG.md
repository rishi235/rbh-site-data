# rbh-site-data — CHANGE LOG

Human-readable record of changes to this repo, newest first. GitHub changes are also in
git history; logged here in plain English so any change can be found and undone quickly.
For changes to Weebly / GBP / GA-GTM (which have no version history), the master log with
before-values is in the cowork CHANGELOG.md — this file covers the repo only.

How to undo a repo change: `git revert <commit>` (safe, keeps history) or check out the prior
commit listed under "Revert".

---

### 2026-07-17 — service.js: booking widget now injected from branches.json (data layer), overriding hard-coded page IDs
- **Surface:** GitHub `main` AND branch `service-module-phase1` (live service pages load service.js from the CDN @service-module-phase1, so this change goes LIVE on every deployed service page at CDN purge)
- **What:** Added `injectBookingWidget()` to `modules/service/service.js`. On every service page it derives branch + service from the URL (`[service]-[brandSlug]-[townSlug].html`), fetches branches.json @main from the CDN, and if the page's rendered Appointedd widget differs from the data layer's ID for that branch+service, re-renders the widget with the correct ID (loading the SDK itself if the page lacks it). Condition pages use the branch's condition-specific widget when present (Cherry Lane only today), falling back to `pharmacyFirst`. Pages already showing the correct widget are left untouched; unknown URLs / fetch failures leave the page as-is.
- **Why:** six live branches were booking into the WRONG diary (McCanns both → Cherry Lane Blood Pressure; SK → Cherry Lane Medical Cannabis; Gordon Short → Cherry Lane FLU; Scorah Hazel → Bramhall; Fishlocks Eccleston → Ainsdale). With this change plus the corrected branches.json, a wrong ID is fixed once in the data layer and propagates to every page.
- **Limit:** Gordon Short and Coleman & Leigh live pages pin the CDN at commit `@76221ba` (immutable), so this fix cannot reach them via the CDN — their Weebly embeds must be repasted. Coleman's widget was already correct; GORDON SHORT REMAINS BROKEN LIVE until its Weebly page is updated.
- **Verified:** locally served copies of the live McCanns Aigburth PF page (hard-coded Cherry Lane BP ID) and Cherry Lane UTI page against the new service.js — McCanns re-rendered to its correct PF widget, Cherry Lane UTI upgraded to its UTI-specific widget.
- **Revert:** `git revert` the commit on main and force `service-module-phase1` back to `a97c2c3`.
- **By:** Claude Code

### 2026-07-17 — Widget correction patch: fix 6 wrong pharmacyFirst IDs, add bloodPressure + contraception IDs (all 14 branches)
- **Surface:** GitHub `main` (branches.json only — live pages hard-code their widget IDs, so nothing changes live until service.js injects from the data layer)
- **What:** Applied WIDGET_CORRECTION_PATCH (source: Dane's "Website - Service Widget Library" sheet, 3 Jul 2026) to the `widgets` object of all 14 trading branches: corrected 6 wrong `pharmacyFirst` IDs, added `bloodPressure` + `contraception` for all 14, added Cherry Lane's 7 condition-specific widgets.
- **Verification (17 Jul):** every one of the 51 widget IDs was resolved against Appointedd's production widget config (the same GraphQL data the public booking iframe loads — read via booking-tools.appointedd.com per-ID; no API key involved). All 51 patch IDs match the library exactly. The 6 IDs previously in branches.json were identified as: McCanns both branches → "Cherry Lane - Blood Pressure"; SK Chemist → "Cherry Lane - Medical Cannabis"; Gordon Short → "Cherry Lane - FLU"; Scorah Hazel → "Scorah Bramhall - Pharmacy First"; Fishlocks Eccleston → "Fishlocks Ainsdale - Pharmacy First".
- **Before:** `widgets` held only `pharmacyFirst`; 6 of 14 IDs wrong (dual-branch brands shared one ID; McCanns/SK/Gordon carried Cherry Lane widgets for other services).
- **After:** all 14 branches carry verified bloodPressure/contraception/pharmacyFirst (+ Cherry Lane conditions). lastUpdated → 2026-07-17.
- **Revert:** `git revert` this commit.
- **By:** Claude Code

### 2026-06-30 — Add `service` (Pharmacy First) module + Cherry Lane pilot pages
- **Surface:** GitHub (repo only — nothing live yet; committed to branch `service-module-phase1`, not `main`)
- **What:**
  - New `modules/service/service.css` — self-contained design system scoped to `#rbhsv-root` (mirrors the switch look; deliberately NOT sharing switch.css so service edits can never break live switch pages).
  - New `modules/service/service.js` — enquiry/callback form wiring; destination = helpdesk@rbhealth.co.uk.
  - New `tools/build-service-pages.js` — generator (clinical copy written once, stamped per store/town).
  - Generated `modules/service/pages/pharmacy-first-cherry-lane-walton.html` (overview) and `uti-treatment-cherry-lane-walton.html` (UTI), plus INDEX.md / SEO.md.
  - Changed `modules/switch/switch.js` line 14: DESTINATION `rishi@rbhealth.co.uk` → `helpdesk@rbhealth.co.uk` (per handover).
- **Before:** `modules/service/` and `tools/build-service-pages.js` did not exist. switch.js DESTINATION was `rishi@rbhealth.co.uk`.
- **After:** as above. Pages pin CDN to `@main` (placeholder); Appointedd widget is a swappable slot with a call/callback fallback.
- **Not yet done (before live):** pin pages to the commit hash; drop in Cherry Lane's Appointedd "Pharmacy 1st" embed; superintendent pharmacist signs off clinical wording; push branch and review.
- **Revert:** `git checkout main` (branch never merged), or delete branch `service-module-phase1`. The switch.js email change is isolated in the same commit.
- **By:** Claude Code
- **Verified:** generator ran clean (2 pages); local inlined preview screenshotted — design matches the switch module.

### 2026-06-30 — Wire in Cherry Lane Appointedd "Pharmacy 1st" booking widget
- **Surface:** GitHub (branch `service-module-phase1`)
- **What:** Pulled the Cherry Lane "Pharmacy 1st" widget ID (`66b20ae6609c16953de3e0cf`) from Appointedd via the browser and wired it into `tools/build-service-pages.js`. The booking card now emits the real Appointedd embed (SDK + renderWidget) instead of the call/callback fallback. Regenerated both Cherry Lane pages. Added `APPOINTEDD_SDK` constant; STORES now stores a widget ID per service, not a raw embed.
- **Before:** `STORES.cherrylane_liverpool.widgets.pharmacyFirst = null` (fallback shown).
- **After:** widget ID wired; pages render the live booking widget.
- **Verified:** loaded the generated UTI page in a real browser — the Appointedd widget rendered and listed the bookable Pharmacy First services (UTI women 16-64, sore throat, shingles, sinusitis, insect bites). Look + booking + content all confirmed.
- **Revert:** set the widget ID back to `null` and re-run the generator, or revert the commit.
- **By:** Claude Code

### 2026-06-30 — Sync branches.json to enriched master + add service-layer fields
- **Surface:** GitHub (branch `service-module-phase1` — NOT yet on `main`, so the live CDN @main still serves the old data until merged)
- **What:**
  - **Caught that the repo's branches.json was a full enrichment behind.** Committed repo version was `lastUpdated 2026-06-26` with ZERO of the 2026-06-27 enrichment (no odsCode, nhsEmail, pfLink, pfBooking, nhsReviewUrl, shortCode, branchNumber on any branch). Synced it to the enriched "commit-ready" master (the version that had only ever lived in the cowork output folder).
  - **Added service-layer fields** to every branch: `website`, `seoTown` (catchment town for SEO — may differ from postal addressLocality, e.g. Cherry Lane = Walton not Liverpool), `townSlug`, `brandSlug`, and a `widgets` object (Appointedd booking widget IDs). Cherry Lane `widgets.pharmacyFirst` = `66b20ae6609c16953de3e0cf`; other stores' widgets to be added as built.
  - **Refactored `tools/build-service-pages.js`** to read brand/slug/town/site/widgets from branches.json (via a BUILD id-list + storeOf resolver) instead of a duplicate STORES config. branches.json is now the single source of truth for the service module. Regenerated pages are byte-identical to before (verified).
- **Before:** repo branches.json = 2026-06-26, no enrichment, no service fields. Generator held its own per-store config.
- **After:** repo branches.json = 2026-06-27 enrichment + service fields (66 fields added across 17 branches). Generator reads from branches.json.
- **Revert:** `git revert` the commit, or `git checkout main -- branches.json` to restore the pre-sync file. Adding fields is runtime-safe (core/site-data.js ignores unknown fields).
- **Note for go-live:** merging to main + purging the CDN will push the enriched branches.json live for all sites. It is additive/safe, but is a real data-layer change — sanity-check before the merge.
- **By:** Claude Code
- **Verified:** JSON valid; Cherry Lane overview re-rendered in a real browser with the live booking widget after the refactor.

### 2026-06-30 — Author all 7 conditions + generate full set (112 pages, 14 stores)
- **Surface:** GitHub (branch `service-module-phase1` — NOT live)
- **What:**
  - Authored the remaining 6 Pharmacy First conditions (sore throat, sinusitis, earache/otitis media, impetigo, shingles, infected insect bite) to the same standard as UTI — symptoms, eligibility, hero copy. Age ranges verified against NHS England / NHSBSA. Shared STD_STEPS + stdFaq helpers added.
  - Pulled all stores' Appointedd "Pharmacy 1st" widget IDs from the browser and added them to branches.json `widgets.pharmacyFirst` (10 branches; Fishlocks and McCanns each share one widget across their two branches).
  - Expanded BUILD to all 14 active stores (excludes head office, Clear Chemist, disposed Wilmslow). Generated 112 pages (1 overview + 7 conditions x 14 stores), plus INDEX.md / SEO.md.
- **Booking widget coverage:** 10 branches use their live Appointedd PF widget. 4 branches have NO PF widget in Appointedd and use the call/callback fallback: Hirshmans (Ainsdale), Riddings (Timperley), Scorah Bramhall, Scorah Hazel. Create those widgets in Appointedd to switch them from fallback to live booking.
- **Before:** only UTI authored; only Cherry Lane built (10 pages); 1 branch with widget.
- **After:** 7 conditions authored; 112 pages for 14 stores; 10 branches with widgets.
- **Revert:** revert the commit; or set conditions back to ready:false / shrink BUILD and re-run.
- **Pending before live (unchanged):** superintendent pharmacist signs off clinical wording; pin pages to commit hash; merge to main + CDN purge; paste into Weebly + set SEO per INDEX.md/SEO.md.
- **By:** Claude Code
- **Verified:** generator ran clean (112 files); Cherry Lane overview, UTI and shingles pages re-rendered in a real browser with the live booking widget.

### 2026-06-30 — Add the last 4 PF widgets (Rishi created them) — all 14 stores now live-booking
- **Surface:** GitHub (branch `service-module-phase1`) + Appointedd (Rishi created the widgets)
- **What:** Rishi created "Pharmacy 1st" widgets in Appointedd for the 4 stores that previously had none. Pulled their IDs and added to branches.json: hirshmans_ainsdale=6a439f268babccc7d30915ea, riddings_timperley=6a439f7b1916ef7a9401cc8f, scorah_bramhall=scorah_hazel=6a439fa31916ef7a9401cc92 (one shared Scorah widget across both branches). Regenerated all 112 pages.
- **Before:** 10 branches with widgets; 4 on call/callback fallback.
- **After:** all 14 active branches have a live Appointedd PF widget; 0 fallback placeholders remain.
- **Verified:** Scorah Bramhall overview re-rendered in a real browser — the new widget loads the bookable services correctly.
- **By:** Claude Code

<!-- New entries above this line, newest first. -->
