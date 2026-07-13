# rbh-site-data — CHANGE LOG

Human-readable record of changes to this repo, newest first. GitHub changes are also in
git history; logged here in plain English so any change can be found and undone quickly.
For changes to Weebly / GBP / GA-GTM (which have no version history), the master log with
before-values is in the cowork CHANGELOG.md — this file covers the repo only.

How to undo a repo change: `git revert <commit>` (safe, keeps history) or check out the prior
commit listed under "Revert".

---

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
