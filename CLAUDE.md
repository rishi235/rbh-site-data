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


The title limit is not only checked, it is fitted to. `tools\seo-pattern.js`
composes every title through `fitTitle()`: if the composed string runs past 65
characters it is retried once with " Pharmacy" dropped from the end of the
brand, because the brand sits at the end of a family A title and is therefore
the part Google truncates. It fires ONLY on an overrun and ONLY where the
brand ends in that word, so it is invisible everywhere else and a regeneration
produces byte-identical output for every page that already fits.

Only the SERP title shortens. The H1, the JSON-LD `name`, the `data-branch`
attribute and every visible line of copy keep the full trading name. Do not
"fix" a long title by hand-editing a generated page or a paste sheet: the next
regeneration overwrites it. Change the rule, or shorten the phrase at source.

It exists because one title in the estate ran to 70 characters - the longest
NHS condition name ("Infected insect bite treatment") on the longest trading
name ("Coleman and Leighs Pharmacy") - so the Walton listing rendered as an
unbranded condition page in a town where RBH runs a second pharmacy competing
for the same words. Found on the item 3.5 quality pass, raised as Q14, and
answered by Rishi on 2026-08-10: shorten the brand, not the NHS wording.


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

## The JSON-LD block, and the address no text search can read

`tools\check-jsonld.js` reads the one part of every generated page that is
written for a machine rather than a person. Nothing had ever read it end to
end, because `check-nap` scans visible text and the two things below are
invisible to a text scan.

It found that five of the six generators declared `"@type": "Pharmacy"` and one,
`build-weight-loss-pages.js`, declared `"@type": "MedicalBusiness"`, on all 15
weight loss pages. Same premises, same name, same phone, same address. Pharmacy
is a subtype of MedicalBusiness, so nothing was untrue, but a business that
describes itself two ways across its own pages is harder for Google to resolve
to one entity. The two schema functions were otherwise character-for-character
identical, so it was a copy divergence, not a decision. Found and fixed on the
item 3.10 quality pass, 2026-08-10. Every page now declares Pharmacy.

The second gap it closes: the contact card's Google Maps iframe carries the
branch address URL-ENCODED, so a wrong address there is invisible to `check-nap`
while every visible line on the page still reads correctly. That is the one
element on the page that can point a patient at another building silently.

Per page it checks: exactly one JSON-LD block and it parses; `@type` is
Pharmacy; `@context` is `https://schema.org`; `name` is the branch's
`branchName` or `brandLabel`; `url` is the branch `website` plus the page's own
filename; `PostalAddress` matches branches.json field for field including
`addressRegion` and `addressCountry`; `telephone` matches exactly, spacing
included; and where present `email` matches and `areaServed` is exactly
`serviceAreaList`, in order. Then it decodes the map query and compares it to
`streetAddress, addressLocality, postalCode`.

Expected values are composed from branches.json rather than imported from the
generators, on purpose. Exceptions go in `KNOWN` keyed
`<filename>::<rule>` with a reason and a question id, and a key that no longer
breaks a rule fails the check, so the list cannot rot.

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


## The booking chain - filename to diary

A generated service page does not carry its Appointedd widget id. It ships an
empty mount and `modules\service\service.js` reads the LIVE URL, splits it into
a service slug and a `brandSlug-townSlug` key, looks that key up in
branches.json and renders the widget id it finds. That was deliberate: six
pages once hard-coded the wrong id and sent bookings into another branch's
diary (verified 2026-07-17), so the data layer became the single source of
truth and a wrong id is now fixed in one place.

The cost is a chain that nothing checked past its first link:

    branches.json (brandSlug + townSlug + widgets)
      -> generated filename
      -> paste-sheet permalink      (check-seo-sheets guards this one)
      -> live URL
      -> service.js routing table
      -> Appointedd widget id

A break anywhere after the permalink does not show up as a wrong word on a
page. It shows up as an empty white booking box, or as a patient booked into
the wrong diary, while every visible line on the page still reads correctly.
Same class of silent fault as the map iframe in `check-jsonld.js`.

`tools\check-booking-routes.js` closes it. Per page carrying a booking mount:
the filename parses under service.js's OWN routing regex; the key resolves to
exactly one trading branch; that branch holds a usable widget under service.js's
own fallback rules; `data-branch` names the branch the URL resolves to, because
that attribute labels the enquiry email and the WhatsApp message; and
`data-service` is present and worded the same on every page of that service.
Estate-wide: no two branches share a routing key, and no two services at one
branch share an Appointedd id. Sister branches sharing one weight loss or
travel diary across a pair (Scorah, McCanns, Fishlocks) is normal and reported,
not failed.

The rule that matters is the fallback rule. service.js lets a page fall back to
the branch's Pharmacy First diary when it has no widget of its own. That is
right for the seven Pharmacy First conditions, because Pharmacy First is the
service that covers them, and wrong for a separate service with its own diary.
Which is which is NOT hardcoded in the checker: a service counts as a Pharmacy
First condition if and only if the branch's own Pharmacy First overview page
links to it. Anything else must appear in `NO_FALLBACK_SERVICE_KEYS`.

That rule found the asymmetry on the item 3.11 quality pass, 2026-08-10:
weight loss and travel clinic are barred from falling back, contraception is
not, although the NHS Pharmacy Contraception Service has its own diary at all
14 branches that offer it and no Pharmacy First overview links to it. It is
latent, because `check-page-coverage` only earns a contraception page where the
branch already holds a contraception widget. It was not fixed on the spot
because `service.js` is a CDN-pinned asset and is currently byte-identical
between main and the pinned ref, which is the only reason Q13's fast-forward is
free. Raised as Q17 and recorded in the checker's KNOWN list.

service.js's two tables are read as DATA UNDER TEST rather than imported, so a
service added to the generators and forgotten in service.js fails here instead
of shipping as an empty booking box. Exceptions go in `KNOWN`, keyed
`<subject>::<rule>`, with a reason and a question id, and a key that no longer
breaks its rule fails the run.


## Which pharmacy does a page say it is

`branches.json` holds two names per branch and they are not the same field.
`brandLabel` is the brand ("Scorah Chemists"). `branchName` is this shop
("Scorah Chemists Hazel Grove"). For ten of the sixteen branches the two
strings are identical, so nothing turns on the choice. For six of them they
are not, and those six are exactly the branches that share a brand AND a
website with a sister shop: Fishlocks Ainsdale and Eccleston, McCanns
Aigburth and Sandringham, Scorah Bramhall and Hazel Grove.

Two machine-readable places on every page consume the name, and neither is
visible copy, which is why no other checker reads them for this:

- The JSON-LD `name`. This is what Google reads to decide whether two
  addresses are one business or two. The same Pharmacy name at two postcodes
  on one domain is the entity-resolution problem item 2.2 was created to fix,
  and the same class as the `@type` divergence fixed on the 3.10 pass.
- `data-branch` on `#rbhsv-root` / `#rbhsw-root`. `service.js` and
  `switch.js` read it to label an enquiry, a callback request and a WhatsApp
  message. On the switch pages it is worse than inert: the page bakes a
  town-specific `source` value, and `switch.js` OVERWRITES it with
  `"Callback request - " + data-branch` as soon as a visitor toggles callback
  mode, so a correct label is replaced by an ambiguous one.

Found on the item 3.12 quality pass, 2026-08-10. Five generators
(`build-service-pages`, `build-switch-pages`, `build-weight-loss-pages`,
`build-travel-clinic-pages`, `build-contraception-pages`) map
`brand: b.brandLabel` and use it for both fields. The sixth,
`build-branch-landing-pages`, uses `b.branchName`. So each of the six shares
a brand across 12 pages and names its own shop on the 13th. Raised as Q18 and
not changed, because moving the JSON-LD name is a search decision and it puts
72 pages into the repaste queue.

`tools\check-branch-identity.js` guards it. Per page: the filename resolves to
exactly one branch; a page with a module root carries a non-empty
`data-branch`; `data-branch` and the JSON-LD `name` are that branch's
`branchName` or `brandLabel` and never another branch's name; and where a
brandLabel is carried by more than one trading branch, both fields must be the
`branchName`, because the bare brandLabel names two shops. Estate-wide: two
branches on one website host never publish the same JSON-LD `name`, and one
branch never declares two different names across its own pages. In
`branches.json` itself: `branchName` starts with `brandLabel`, and a branch
sharing a brandLabel does not have that bare brandLabel as its branchName.

Expected values are composed from `branches.json`; nothing is imported from
the generators, so a generator reaching for the wrong field fails here.
Exceptions go in `KNOWN`, keyed `<subject>::<rule>`, with a reason and a
question id, and a key that no longer breaks its rule fails the run.
