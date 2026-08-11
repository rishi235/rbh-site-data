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
  once in `tools\seo-pattern.js`. It types every file by name first, and two
  rules keep that typing honest. The seven Pharmacy First condition slugs and
  phrases are READ from `build-service-pages.js` rather than mirrored into a
  literal, because those slugs also compose the filename regex: an eighth
  condition added to the generator used to fall outside it, so its 14 pages
  would have gone untyped and the run would still have exited 0. And a file
  the checker cannot type is a FAILURE, not a skip - an unchecked page and a
  passing page used to look the same in the summary line. A legitimately
  non-page file goes in `KNOWN_NON_PAGE` with a reason and a question id, and
  a stale key fails the run. Found and fixed on the item 3.1 quality pass,
  2026-08-11.
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


## The copy that reaches the public without being generated

Almost every rule in this repo is enforced against `modules\*\pages\`, because
that is where the 177 generated pages live. Five files carry public copy and
are not in there, so a checker scoped to those folders does not see them:

- `modules\service\weebly-paste\*.html` and `modules\switch\weebly.html`, which
  a human pastes into a Weebly embed element, so they are as public as any
  generated page the moment somebody pastes them
- `modules\service\DRAFT-weight-loss-copy.html` and
  `DRAFT-travel-clinic-copy.html`, which are pasted nowhere but ARE the approved
  copy that `build-weight-loss-pages.js` and `build-travel-clinic-pages.js`
  name in their own headers as the source they were built from

The second pair is the trap. The item 3.9 pass stripped 30 `&ndash;` entities
out of the generated weight loss pages by fixing the generator. The draft the
generator cites as its approved copy kept them, in the same two sentences,
until the item 5.1 pass on 2026-08-10. Output clean, stated source not, and
the repo green throughout, because `check-em-dashes` read three folders and
none of them was this one.

So: when a copy rule changes, change the generator AND the draft it cites, and
check that whatever enforces the rule reads both. `check-em-dashes` now covers
all five files through its `EXTRA_HTML` list, blanking build comments first so
governance notes at the top of a draft stay reportable rather than failing, and
failing if a listed file has gone. Note that `check-jsonld` and
`check-whatsapp-route` deliberately exclude `DRAFT-*` by name, which is correct
for them: a template has no branch to resolve against. Exclusion by structure
is fine. Exclusion by nobody having thought about it is what this section is
here to stop.

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

Hours reach the public in one more place, and it is the place most people
read: the Google Business Profile. `check-opening-hours` stops at the repo
boundary, and until the item 4.9 pass on 2026-08-10 nothing read the `- Hours:`
line in a GBP pack at all, although `gbp-packs\TEMPLATE.md`'s first rule names
hours alongside phones and claims as facts that come from branches.json only.
`check-gbp-packs.js` now reads it: every clock time on the line must be an
opening or closing time in that branch's `openingHours`, every time in the data
must appear on the line, and a branch with no hours in branches.json must have
a line saying so and telling the paster not to paste, invent or guess. Clear
Chemist Aintree is the only branch in that position.

Proving the pack's hours line is right is not the whole journey to the public,
and the item 4.10 pass on 2026-08-10 found the rest of it. Seven branches close
for lunch, so a weekday appears twice in `specification`. Google's hours editor
offers ONE time range per day first, so a paster working from a perfectly
correct pack can still publish a single 9 to 6 range and state that the
pharmacy is open through the hour it is shut - the same locked-door fault,
arriving through the paster rather than through the data. Only two packs said
so. `check-gbp-packs.js` now fails any pack whose branch has a split day and
does not tell the paster the profile needs two ranges for it. The wording came
from `tiffenbergs-aintree.md` and `gordon-short-crosby.md` rather than being
composed fresh, and the match runs against whitespace-collapsed text because
that guidance wraps mid-sentence.

The reason it is not hypothetical is worth carrying: every live page on
`smarttschemist.co.uk`, and the site footer, already print 9:00am to 6:00pm for
a branch whose NHS-confirmed hours close 1:00pm to 2:00pm. The habit exists on
our own website (found on the item 3.7 pass and wider than the page Q16
recorded), so the pack is the last thing standing between it and the profile.
`smartts-bootle.md` now warns the paster that the two disagree. Correcting the
website itself needs a Weebly session.

Two things in that rule are deliberate and worth not undoing. Times inside a
parenthetical marked as history, or inside quotation marks, are read as
evidence rather than as a claim, so `scorah-hazel-grove.md` can record the
Saturday that ceased on 24 June 2026 and `clear-aintree.md` can quote the hours
its own website publishes without either being read as stating them. And the
bullet reader does not use a `/m` regex: these files are CRLF, and under `/m`
JavaScript treats a bare `\r` as a line terminator, so `^` and `$` both fire at
every line break and the rule would have read the first line of a three-line
bullet, checking Monday to Friday and never seeing Saturday. That is the same
under-reading fault the item 4.8 pass had to design around in the same file.

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


## The WhatsApp number, and the seven places it lives

Every other contact detail on a generated page comes from `branches.json` and
has a checker behind it: the phone in `check-nap`, the review link and the NHS
mailbox in `check-branch-links`, the booking diary in `check-booking-routes`.
The WhatsApp number is not in `branches.json` at all.

It is hardcoded SEVEN times. Once as `const WHATSAPP` in each of the five
service-family generators, and once as `var DEFAULT_WHATSAPP` in each of
`modules\service\service.js` and `modules\switch\switch.js`. It reaches a page
as `data-wa` on the module root, and `service.js` / `switch.js` read that
attribute to build the `wa.me` link behind "Send via WhatsApp instead". A page
with no `data-wa` falls back to the runtime default silently.

All seven agree on `447521775631` today, and that is the whole problem: seven
copies that agree are indistinguishable from one source of truth right up to
the moment somebody edits one. Then some pages send patient enquiries to a
number nobody is watching, while every visible line on the page still reads
correctly. Same silent class as the switch pages found still posting
prescription switch requests to a personal inbox, and the same shape as the
duplicated switch-page `CONFIG` raised as Q19.

`tools\check-whatsapp-route.js` guards it. Six rules fail the run: two
generators declaring different numbers; a generator that emits a module root
but declares no constant; a runtime default that disagrees with the generators;
any declared or emitted value that is not a UK mobile in E.164 without the plus;
a page whose `data-wa` disagrees; a generated page still carrying a `{{TOKEN}}`
placeholder; and a page with a WhatsApp button but no `data-wa`, which would
fall back to the runtime default instead of the value the generator meant to
set. The generators and the module JS are read as DATA UNDER TEST rather than
required in, so a generator that stops declaring the constant fails here.

Reported, not failed: pages carrying `data-wa` with no button and no callback
form, so the attribute is inert. 29 pages are in that position today, 15 travel
clinic and 14 Pharmacy First overview, which is the substance of Q20.

`modules\emar\emar.js` deliberately carries a different number. It drives the
Borough Care eMAR screens, a separate function answering on its own line, not
the public site. It sits in `KNOWN` so the divergence stays deliberate rather
than becoming a copy somebody forgot. Exceptions go in `KNOWN` with a reason
and a question id, and a key that no longer fires fails the run.

Until Q21 settles where the number should live, do not change one copy on its
own. Change all five generators, then both module defaults, then regenerate,
in the same commit. Note that touching the two module defaults ends the
byte-identical state between `origin/main` and the pinned ref
`service-module-phase1`, which is the only reason Q13's fast-forward is free,
so that half belongs in a supervised session alongside Q13 and Q17.

Found on the item 3.13 quality pass, 2026-08-10.


## The phone number, and the two shapes a checker was willing to read

`tools\check-nap.js` is the only thing in this repo that reads a phone number
against `branches.json`. Until the item 1.4 quality pass on 2026-08-11 it read
one in exactly two shapes: a `tel:` href, and digits written straight after
the word "Call" or after the contact card's `Phone:` label. Every other
phone-shaped number on a page was invisible to it.

All 15 switch pages carry one. The FAQ answer reads "Call us on 0151 226
2051", and the two words between "Call" and the number put it outside the
reader. Swapping that number for another branch's on one page, the previous
checker exited 0 and reported "177 pages ... 0 mismatches". The numbers are
correct today because `build-switch-pages.js` interpolates `b.phone` there,
but correct and read are not the same thing, and the switch page is where a
patient who has decided to move their prescriptions picks up the telephone.

It now sweeps EVERY phone-shaped number on a page and requires it to be that
branch's, naming the branch it does belong to, which is what the paste-block
half of the same file already did. Build comments are blanked first, the same
convention as `check-em-dashes`.

Two further rules landed with it. The four NAP surfaces (contact-line address,
map query, `tel:` link, visible phone) must be PRESENT: every check was
conditional on finding its surface, so a page that lost its contact card
passed every rule and still counted towards the "checked N pages" line. And
`modules\switch\weebly.html` is now read as a SHARED paste template. It is
pasted into a Weebly embed on every branch running a switch page this repo
does not generate, it belongs to no branch, and `pasteOwner()` matches on a
brandSlug prefix, so nothing had ever read it. The rule for a shared template
is the inverse of the per-branch one: it must carry no phone, no postcode and
no branch name at all, because one branch's fact typed into it is published on
every branch at once.

Exceptions go in `KNOWN_PHONE` or `KNOWN_SURFACE` with a reason and a question
id, and a key that no longer fires fails the run.


## Weight loss copy - the rule book is outside this repo

The house reference for anything weight loss is

    AI\RBH_WeightLoss_Advertising_Standards.md   (compiled 19 July 2026)

It is not in this repo and must not be copied into it. Read it before writing,
editing or judging any weight loss copy, live or generated.

The one thing to carry in your head, because getting it wrong costs a patient
information and fixes nothing: there are TWO regimes, not one. In advertising -
leaflets, press, posters, paid search, paid and organic social, influencer and
affiliate content, and the landing page an ad points at - almost any reference
to a prescription-only medicine breaches CAP rule 12.12, named or not. On the
INNER pages of our own website there is a limited exemption: a page about the
condition, which the consumer chooses to access, may carry non-promotional
information on named medicines in a fair overview of the options, provided it
is clear the customer is being offered a consultation that may or may not lead
to a prescription. The homepage is not an inner page, and neither is a page an
ad links straight to.

So "it names Mounjaro" is not the finding. The finding is a superlative, a
results heading, an outcome slider, a lead price above the fold, or a picker
that lets the patient choose the medicine. That distinction is the whole of
`compliance\WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md`, written on the Q16 answer,
which records what was read live at Smartts and Riddings on 2026-08-10,
element by element, with the rule each one is measured against and a verdict.

Note what this means for the generated pages: they are clean and stay clean
because they name no medicine at all, which is the safe side of a line they do
not need to walk. `tools\check-service-links.js` enforces the no-claims half in
public copy. Nothing in this repo can see a live-only Weebly page, which is why
the five pages in Q16 and Q22 sat unseen for the whole audit.


## The trading name, and the rename that no checker would notice

Item 1.1 settled the trading names on 2026-08-04: Fishlocks not Fishlock,
Coleman and Leighs not Coleman & Leigh, Gordon Short not Gordon Shorts. It has
been re-verified on every quality pass since by hand, with a fresh pattern
sweep typed out each time, because nothing in the repo held the rule. The rule
lived in whoever was running the sweep.

`tools\check-brand-spelling.js` now holds it, and it closes two gaps of very
different sizes.

The small one is hand-written copy. Almost every visible brand mention on a
generated page is composed from the same string that lands in `data-branch` and
the JSON-LD `name`, so `check-nap` and `check-branch-identity` catch a wrong
one as a side effect. Copy that is typed rather than composed gets no such
protection: the GBP packs, the Weebly paste blocks, the two `DRAFT-*` files,
and any prose a generator carries inline.

The large one is `branches.json` itself. Every checker here composes what it
expects from that file, which is correct and is also the hole: a rename inside
it propagates to 177 pages with every other check still green, because they all
agree with the new spelling. So the canonical forms are pinned in `CANONICAL`
inside the checker, outside `branches.json`. A `brandLabel` that no longer
matches its pin fails, a branch missing from the list fails, and a pinned id
that is no longer a trading branch fails. Renaming a branch stays possible and
becomes deliberate: change both files in one commit, and the diff says a name
changed instead of hiding it.

Near misses are derived from the canonical form, not listed, so nobody has to
think of them in advance: a trailing `s` added or dropped on any word, an
apostrophe-s form, and `and` written as `&`. That is what makes
"Fishlock Chemist", "Fishlock's Chemist", "Gordon Shorts Chemist" and
"Coleman & Leigh Pharmacy" all findings without a hand-written list. Third
rule: the `brand:` strings hardcoded in the `CONFIG` table of
`tools\build-switch-pages.js`, the one place a brand is typed rather than read,
must match `branches.json`.

Two things in it are deliberate. Whitespace is collapsed before a match is
compared to the canonical form, because a trading name wraps across a line in
markdown and across a tag boundary in HTML, and this checker tests the spelling
only - `check-em-dashes` and the SEO checkers own the punctuation and the
layout. And a variant inside double quotation marks is read as evidence rather
than as a claim, in markdown only: several GBP packs record what a branch's
LIVE pages currently say so the paster knows the website and the profile
disagree, and `gordon-short-crosby.md` and `coleman-leigh-walton.md` both do
exactly that today. The exemption is markdown-only because in HTML every
attribute is quoted, so the same rule there would blank `data-branch` and the
JSON-LD `name`, which is most of what the check is for.

Written on the item 1.1 quality pass, 2026-08-11. The repo was clean when it
landed, and the checker was tested by breaking it three ways: a variant typed
into a generated page, a rename inside `branches.json`, and a stale brand in
the switch `CONFIG` table. All three fail the run.
