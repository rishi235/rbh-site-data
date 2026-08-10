# rbh-site-data - project rules

## branches.json - single source of truth

The ONLY valid branches.json is:

    Weebly\seo\rbh-site-data\branches.json

Repo: https://github.com/rishi235/rbh-site-data

Do not create, read, or write copies of branches.json anywhere else.
If you find another one, it is stale. Do not merge it. Flag it and stop.

History (for context, do not resurrect these):
- Weebly\rbh-site-data\branches.json - stale clone, 8 commits behind. Archived 13 Jul 2026.
- Weebly\seo\branches.json - orphan copy, no repo. Deleted 13 Jul 2026.

## Do not confuse with the data-portal file

    Data_Publish\Data Publishing\data-portal\site\data\branches.json

That is a SEPARATE file with a completely different schema (rx codes, cashup
slugs, sat/sun opening flags). It is not a version of this file.
Never merge the two. Never copy fields between them.

## Schema

Top level: lastUpdated, brandGroups, hostMap, branches[], schemaNote

Each branch in branches[] uses these keys:

    id, brandKey, brandLabel, branchName,
    streetAddress, addressLocality, postalCode, addressRegion, seoRegion, addressCountry,
    phone, email, googleReviewUrl, hasApp, keywords[], serviceAreaList[],
    shortCode, branchNumber, odsCode, nhsEmail,
    pfLink, pfBooking, nhsReviewUrl,
    website, seoTown, townSlug, brandSlug, widgets{}, disposed

Notes:
- seoTown is the catchment town used in page titles and H1. It may differ from
  the postal addressLocality (Cherry Lane = Walton, not Liverpool).
- addressRegion is the SCHEMA field and must be the county (Merseyside,
  Greater Manchester, Lancashire, Cheshire). It goes into schema.org
  PostalAddress, which Google reads. Never put a borough, district or town
  in it. tools/check-address-region.js enforces this.
- seoRegion is OPTIONAL and is the SEARCH qualifier appended to a branch
  landing page title. Set it only where the borough beats the county as the
  local word: Fishlocks Eccleston is "Eccleston, Chorley" in the title, which
  separates it from Eccleston in St Helens, while its addressRegion stays
  Lancashire. If unset, the title falls back to addressRegion.
- Head office (rbh_head_office_aintree) has no phone, email, odsCode or
  nhsEmail. That is correct, not missing data.
- Bump lastUpdated on every edit.

## Editing

Use tools\branches-editor.html to review and edit. It loads branches.json,
validates, and exports a replacement file. Always commit and push after an edit,
so the GitHub copy and the local copy never drift.

## CDN pins - what live pages actually load

Every generated page loads its CSS and JS from jsDelivr against a pinned ref.
The ref is declared ONCE per generator, as `const PIN`. Never write a pin into
a page by hand; change PIN and regenerate.

Two pinning models, both deliberate (see README, "Pushing CSS/JS changes live"):

- MUTABLE branch ref, currently `service-module-phase1`, used by the five
  service-family generators. One push to that branch updates every live page
  with no Weebly repaste. Purge after a push.
- IMMUTABLE commit ref, currently `6a275e1`, used by the switch generator,
  because jsDelivr can lag ~12h on a branch ref and ignores `?v=`.

The trap this creates: the repo can be entirely green while live serves old
code, because no other checker looks past the repo. A commit pin is frozen
forever, and a branch pin only helps while somebody keeps that branch level
with main. tools\check-cdn-pins.js exists to make that visible. It fails if a
page pins something its generator does not declare, if a pinned ref no longer
resolves, or if a pinned asset's content differs from main. Run it after any
change to a generator PIN, to modules\*\*.css / .js, or before a paste run.

If a pinned asset legitimately differs from main while a decision is pending,
add it to KNOWN_DRIFT in that checker with a reason and a question id. Do not
widen the checker to make it pass.

## SEO strings - what Google actually shows

The title and description that reach Google are the ones a human types into
Weebly > Pages > SEO Settings, read off the paste sheets (`*SEO.md`), not the
page body. Four checkers guard them and they do different jobs:

- `tools\check-seo-pattern.js` - the title and H1 match the pattern defined
  once in `tools\seo-pattern.js`.
- `tools\check-seo-sheets.js` - the page and its paste sheet carry the same
  strings, so a generator composing a description twice cannot let the two
  drift.
- `tools\check-em-dashes.js` - no em or en dash reaches public copy.
- `tools\check-seo-lengths.js` - the strings fit the SERP and are unique:
  title 65 characters or fewer, description between 80 and 165, and no two
  pages sharing a title, description or permalink.

Lengths and uniqueness matter for the same reason Phase 3 of the audit exists.
An overlong title is truncated and the brand is the part that disappears. Two
branches in the same town sharing a description compete with each other instead
of ranking for their own catchment, and RBH has four town pairs where that is
possible: Ainsdale, Bootle, Walton and Aintree.

If a string legitimately breaks a rule while a decision is pending, add it to
KNOWN in `check-seo-lengths.js` with a reason and a question id, the same
convention as KNOWN_DRIFT in `check-cdn-pins.js`. Do not widen the thresholds
to make a run pass, and remove the entry once the question is answered and
applied - the checker fails on a stale KNOWN key.


## Opening hours - the copy that sends someone to a locked door

A day in `openingHours.specification` can carry MORE THAN ONE session, because
seven branches close for lunch. Anything that renders hours must collect every
session for a day and join them, not write each one into the same slot. An
earlier version of `tools\build-branch-landing-pages.js` did the latter, so
both McCanns landing pages told patients the pharmacy opened at 2pm when it
opens at 9am, while the JSON-LD on the same page was right. Found and fixed on
the item 3.6 quality pass, 2026-08-10.

`tools\check-opening-hours.js` guards both halves. It composes the expected
strings from branches.json itself rather than calling the generator, and it
fails if a visible row disagrees with the data, if a day is missing or doubled,
if the JSON-LD sessions do not match the data exactly, if a day is in
`closedDays` and in `specification` at once, or if a session does not close
after it opens. Run it after any change to a branch's hours or to a generator
that prints them.

## Where a page sends people, and what it promises them

`tools\check-service-links.js` covers the two things a title checker cannot see:
the target of a link and the promise in a tile.

- A generated page must not link to a page on one of our own branch domains
  that this repo does not generate. Either the repo owns the page and the link
  should use the generated slug, or the page is live-only and nothing here can
  keep it correct.
- Public copy must carry no efficacy or results claims.

It exists because the Smartts switch page is the only generated page in the
estate with a hand-written services grid, hardcoded in the `CONFIG` block of
`tools\build-switch-pages.js`. Its Weight Loss Clinic tile was found pointing
at `weight-loss-clinic-bootle.html`, an old live-only page naming three
prescription-only medicines and claiming a percentage weight loss, while this
repo has generated a compliant replacement since Phase 3. The same tile called
the clinic "Support that delivers results". Found on the item 3.7 quality pass,
2026-08-10, and raised as Q16.

Exceptions go in `KNOWN` (link targets) or `KNOWN_CLAIM` (wording) with a
reason and a question id, and an entry that no longer applies fails the check,
so neither list can rot. Do not widen the patterns to make a run pass.

## The link fields inside branches.json

Every other link checker here reads pages. `tools\check-branch-links.js` reads
the link fields in `branches.json` itself, because those fields are what the
landing pages and the GBP packs copy from, so a malformed one is invisible
until it has already been printed somewhere.

It checks, per branch: `odsCode` is unique; `nhsEmail` is exactly
`pharmacy.<odsCode>@nhs.net`; `nhsReviewUrl` is
`https://www.nhs.uk/services/pharmacy/<slug>/X<odsCode>/leave-a-review`;
`googleReviewUrl` matches `https://g.page/r/<id>/review` and is not shared by
two branches; `website` is a bare https host with no trailing slash and no
path; and `pfLink` sits on the branch's own host and ends `.html`.

Found on the item 3.8 quality pass, 2026-08-10. Thirteen of the fourteen
trading branches ended their `nhsReviewUrl` at `/leave-a-review`, the NHS form
that actually takes a review. Gordon Short Crosby stopped one segment short, at
the ODS code, which lands the patient on the profile page instead. It had not
reached a page only because Gordon Short has no landing page yet. Fixed at
source the same run.

A trading branch with an `odsCode` but no `nhsReviewUrl` is a warning, not a
failure: Clear Chemist Aintree is deliberately different. Exceptions go in
`KNOWN` with a reason and a question id, and a key that no longer breaks a rule
fails the check, so the list cannot rot.

## seoTown - the word the pages claim as the catchment

`seoTown` drives the title, the description, the H1 and the permalink for every
page a branch owns, so it has to be a place, not a branch nickname.
`tools\check-address-region.js` now checks it against the branch's own
`serviceAreaList`: the seoTown must appear in that list, `townSlug` must be its
slug, and two branches sharing a domain must not share a seoTown, or their
titles and permalinks collide. Being in the list but not first is a warning
only (Cherry Lane leads with Liverpool and targets Walton, which is deliberate).

Exceptions go in `KNOWN_SEO_TOWN` with a reason and a question id, and a key
that no longer breaks the rule fails the check, so the list cannot rot.
