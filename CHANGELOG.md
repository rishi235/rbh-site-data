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

<!-- New entries above this line, newest first. -->
