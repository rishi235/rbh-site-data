# Item 3.12 (Tiffenbergs Chemist, Aintree) - quality pass, 2026-08-31

Third quality pass on this item (2026-08-14, 2026-08-30, this one). Repo half
re-run clean; live half widened to cover pages the 2026-08-30 pass did not
read.

## Repo half

- All 36 checkers under `tools/check-*.js` run individually: 0 failures.
- All six generators (`build-service-pages.js`, `build-switch-pages.js`,
  `build-branch-landing-pages.js`, `build-weight-loss-pages.js`,
  `build-travel-clinic-pages.js`, `build-contraception-pages.js`) rebuilt
  before any change was made: `git status --porcelain modules/ core/` empty
  both before and after, confirming byte-identical output.
- No file under `tools/`, `modules/`, `core/` or `branches.json` touched this
  pass. No defect found in the repo half.

## Live half (read only, Claude in Chrome, nothing clicked/typed/submitted)

The 2026-08-30 pass read two of Tiffenbergs' 12 live pages (Pharmacy First
overview, switch). This pass read four more that had not been read live on
any prior pass for this item: weight loss, travel clinic, contraception, and
one Pharmacy First condition page (infected insect bite). Six of the 12 pages
have now been read live across the two most recent passes; the remaining six
condition pages (earache, impetigo, shingles, sinusitis, sore throat, UTI)
were not read this pass and remain unread live for this item.

- `weight-loss-clinic-tiffenbergs-aintree.html`: no medicine named by brand or
  drug name anywhere on the page (matches the compliant pattern already
  established for the estate's weight loss pages under the two-regime rule).
  No superlative or results claim; the FAQ and body copy both carry
  "individual results vary" and "nothing below is a guarantee ... a specific
  outcome" language. Price ("from £39.99") appears only inside the booking
  card, not headlined above the fold. Address, phone, opening hours (with the
  1-2pm lunch closure) and postcode all match branches.json.
- `travel-clinic-tiffenbergs-aintree.html`: no vaccine or antimalarial named
  by brand; "Yellow fever" appears only as the generic disease name, matching
  every other travel clinic page (the `yellowFeverCentre`-field gap is
  estate-wide and already pinned against Q48 in
  `tools/check-travel-clinic-copy.js`'s own KNOWN list, not specific to this
  branch). Book-ahead window stated consistently as "6 to 8 weeks" in both the
  hero-area bullet and the "who this is for" section. Facts match
  branches.json.
- `contraception-tiffenbergs-aintree.html`: NHS Pharmacy Contraception Service
  copy, no efficacy claims, facts match branches.json.
- `insect-bite-treatment-tiffenbergs-aintree.html`: Pharmacy First condition
  page, cohort and symptom wording standard, facts match branches.json.

No new defect found on any of the four pages read this pass.

## Standing findings reconfirmed, not re-raised

- Q56 (branches.json holds the singular mailbox `Tiffenberg@rbhealth.co.uk`;
  every live page's footer and contact card shows the plural
  `tiffenbergs@rbhealth.co.uk`): reconfirmed present, unchanged, on all four
  pages read this pass, in addition to the two pages the 2026-08-30 pass
  already reconfirmed it on. Still a live-only divergence; nothing in this
  repo can fix a live Weebly page without a repaste.
- The site-wide footer strip beneath the contact card ("Open Mon-Fri
  9am-6pm (closed 1-2pm) ...") renders with en dashes, not the hyphens the
  repo's own `check-em-dashes.js` enforces. This line is Weebly's shared
  site-wide footer element, not part of any file this repo generates or
  pastes (it is identical, byte for byte, across all four pages read this
  pass), so it sits outside every generated-page and paste-sheet checker's
  scope by construction, the same disposition already recorded for the
  pre-5.1 em dash in the live switch page. Not raised as a new question: it
  is the same class of pending-repaste/out-of-repo-scope gap already on
  record elsewhere in this file's history, not a new one.

## Verdict

Item 3.12 remains clean in the repo. Live coverage for this branch is now 6
of 12 pages across two passes, up from 2 of 12 before this pass, with zero
defects found on any of them. No question raised for Rishi; this did not need
his judgement.
