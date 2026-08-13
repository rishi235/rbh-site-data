# GBP content pack - TEMPLATE

How to use: copy this file to gbp-packs/<branch-slug>.md and fill every
section from branches.json (facts) and the branch's live pages (tone).
Everything here is paste-ready for Google Business Profile. Agents draft;
Rishi or Dane paste into GBP by hand.

Rules for every pack (from Master Plan v2 / Build Pack v2 and advertising law):
- Facts come from branches.json only. No invented hours, phones or claims.
- No medicine brand names anywhere in weight loss content. POM advertising
  to the public is not permitted. Describe the service, not the medicines.
- No efficacy claims ("works", "guaranteed", "best results"). No before/after.
- Pharmacy First wording stays close to the NHS service description: free NHS
  service, seven conditions, no GP appointment needed, age ranges apply.
- UK English. No em dashes. No emojis. Plain English. A pack is pasted into a
  plain-text Google field, so tools/check-em-dashes.js holds every file in this
  folder, this template included, to pure ASCII AND fails a dash written as an
  HTML entity (the ampersand-mdash and ampersand-ndash spellings, and their
  numeric forms): nothing resolves an entity on a Google profile, so it would
  publish as the literal characters a patient then reads in the description.
  That is also why this rule cannot be written out here in its own entity
  form, and why the checker's own explanation lives in the checker, not here.
  Added at the item 4.3 quality pass, 2026-08-13, after an
  em dash, an emoji and a smart quote were each shown to pass all 29 checkers.
  UK spelling is NOT yet enforced by any checker and still rests on the writer.
- Profile website on a shared domain: Fishlocks, McCanns and Scorah each run
  two branches on one website. Those branches point the GBP profile website
  at their own branch landing page (pharmacy-<brandSlug>-<townSlug>.html),
  not at the shared homepage, so the two profiles do not hand Google the
  same page (Master Plan v2 section 3). A branch that owns its domain
  outright points at the homepage as normal. tools/check-gbp-packs.js fails
  any shared-domain pack that points at the homepage once the landing page
  exists in the repo. The landing page must be pasted to Weebly, with the
  branch's service pages, before the profile website is changed.
- Opening hours: the "- Hours:" line in the profile basics is what the paster
  sets on the profile, and it is the one fact on a Google profile that sends
  a patient to a locked door. Every clock time on that line must be an
  opening or closing time in the branch's own openingHours in branches.json,
  and every time in branches.json must appear on the line, so a wrapped
  Saturday session cannot be left off. The line must also name the right
  DAYS, because a Google profile is set day by day and the times alone cannot
  show a day is wrong: "Monday to Saturday 8:45am to 6:00pm" states only
  times the data already holds, so it passes on times while publishing a
  Saturday opening for a shop that is shut, and "Monday to Thursday" drops
  Friday from the profile without changing a single time. So every day
  stated as open must be open in branches.json, every day branches.json
  opens must be stated, and every closed day must be stated as closed,
  because GBP keeps whatever the profile already shows for a day the paster
  is not told about. Where branches.json holds no hours at all, the line
  must say so and tell the paster not to paste, invent or guess them.
  tools/check-gbp-packs.js enforces all of it. Times inside a parenthetical
  marked as history ("previously", "ceased") or inside quotation marks are
  read as evidence rather than as a claim, which is how a ceased Saturday and
  a quoted source can be recorded without stating them as hours. Days inside
  a parenthetical are read the same way, as a lunch closure or a history
  note and never as a day claim, and the day reading stops at the first full
  stop that starts a new sentence, so paster instructions written below the
  line are not read as hours.
- Business description: GBP limit is 750 characters. Stay under it.
- Posts: keep each under 1,500 characters; first sentence carries the message.

## 1. Business description (max 750 chars)
(Who the branch is, how long serving the area, core NHS services, the private
clinics as services not products, service area towns, invitation to visit.)

## 2. Categories
- Primary: Pharmacy
- Additional to add if not present (use the nearest name GBP's picker offers):
  (list per branch - Travel clinic and Vaccination centre wherever the branch
  has a travel clinic, Weight loss service wherever it has a weight loss
  clinic, per Build Pack v2 section 4.1. Which ones apply is decided by the
  branch's widget set in branches.json, and tools/check-gbp-packs.js fails
  any pack that leaves one out.)

## 3. Services section content
(One line per service as GBP "Services" entries: service name plus a one
sentence plain-English description. NHS services first, then private.
List every service the branch's widget set in branches.json gives it -
Pharmacy First, blood pressure, contraception, weight loss, travel clinic -
and do not list one it has no widget for. tools/check-gbp-packs.js fails any
pack that omits one, and warns where the business description leaves one out.)

## 4. Photo shot list
(What to photograph so the profile looks real and local. Front, inside,
team, consultation room. Note anything branch-specific worth showing.
Build Pack 4.1 asks for at least 10 photos, including the new vinyl
storefront where fitted, so list 10 shots. Also remind the paster to
action any pending Google updates while in the profile.)

## 5. Post drafts (four)
### Post A - Pharmacy First
### Post B - Switch your prescriptions
### Post C - Weight loss clinic (no medicine names, no efficacy claims)
### Post D - Travel clinic
(Each post: text plus the button suggestion - "Book" or "Learn more" with the
right page link from branches.json.)
