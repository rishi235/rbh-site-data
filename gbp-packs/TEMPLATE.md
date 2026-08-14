# GBP content pack - TEMPLATE

How to use: copy this file to gbp-packs/<branch-slug>.md and fill the two
header blocks below plus every numbered section, from branches.json (facts)
and the branch's live pages (tone).
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

## Pack header and profile basics (both sit above section 1)

Every one of the 15 packs opens with these two blocks, and eight of the
checker's rules read them. Until the item 4.1 quality pass on 2026-08-13
this template ran from the rules straight into section 1, so a pack drafted
faithfully from it carried neither block. Proved by injection that day, on
a copy of fishlocks-ainsdale.md: strip the two blocks and
tools/check-gbp-packs.js reports ONE fault, the missing Branch id line, and
silently skips every fact rule beneath it, because without the id it cannot
resolve the pack to a branch. Put the id back and seven more failures
appear at once - name, address, phone, hours, review link and profile
website. So the drafter met the same pack twice before reaching a real
content error. The checker held; the template was the hole.

    # GBP content pack - <branchName>

    Branch id: <id> (branches.json). Drafted <YYYY-MM-DD>.
    Facts checked against branches.json (address, phone, hours confirmed by
    NHS <openingHours.confirmed>). Ready for Rishi or Dane to paste into GBP.

    Profile basics (for checking, not pasting):
    - Name on GBP: <branchName>
    - Address: <streetAddress>, <addressLocality> <postalCode>, adding the
      post town where it differs from addressLocality, which is the house
      convention ("17 Station Road, Ainsdale, Southport PR8 3HN")
    - Phone: <phone>
    - Hours: every open day and every clock time from this branch's
      openingHours, with every closed day stated as closed. See the opening
      hours rule above; it is enforced in both directions
    - Website: <website>, the homepage, for a branch that owns its domain.
      On a shared domain write "Website for the profile:" instead and point
      it at pharmacy-<brandSlug>-<townSlug>.html. See the profile website
      rule above
    - Review link: <googleReviewUrl>

Every value in the block comes from branches.json and nothing in it is
invented. None of it is pasted as copy either: it is what the paster checks
the profile against, field by field, before touching the sections below.

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
pack that omits one, and warns where the business description leaves one out.
The two PRIVATE bullets carry their qualifier here as well as in the posts,
because this section is pasted into the profile in its own right: the weight
loss bullet says the clinic runs as a "supervised plan", and the travel bullet
says vaccinations are "subject to availability and clinical suitability". See
the note under section 5.)

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

(THE QUALIFIERS ON THE TWO PRIVATE CLINICS. The two lines above say what these
posts may not contain. They must also SAY certain things, and until the item
4.8 quality pass on 2026-08-14 this template asked for none of it, which is
why three packs were drafted without any of it and nothing said so. A GBP post
is an advertisement pushed onto a public profile, the stricter of the two
weight loss regimes, so the qualifier is the part that makes the offer lawful.
tools/check-gbp-packs.js now fails any pack that leaves one out.
Post C, wherever the branch has a weightLoss widget, states all three of:
  - that the clinic is a "private, paid service"
  - that it is "not right for everyone" or "not suitable for everyone", or
    that "the pharmacist will advise"
  - that it runs as a "supervised plan"
Post D, wherever the branch has a travelClinic widget, states that
vaccinations are "subject to availability and clinical suitability".
Write these as ordinary sentences in the branch's own voice. Do not bolt them
on as a disclaimer.)

Notes for the paster:
(This block sits below section 5 and is the only part of a pack addressed to
the person doing the pasting rather than to the Google profile. Nothing here
is pasted into Google. All 15 packs carry it, and until the item 4.1 quality
pass on 2026-08-14 this template did not mention it at all, so a pack drafted
faithfully from the template would have carried none of the instructions
below and nothing would have said so. tools/check-gbp-packs.js now fails any
pack, and this template, that has no "Notes for the paster:" line. Write the
branch-specific version of each note that applies.)
- Profile website: on a shared domain, name the landing page to use and say
  whether it resolves yet. If it does not, say plainly that the profile
  website must not be set until it does. A profile pointed at a page that
  returns 404 is worse than one left alone.
- Post C names no medicines and makes no efficacy claims, per the POM
  advertising rules above. Say so here, and say that none are to be added
  when posting.
- Post buttons: if GBP only offers "Learn more", use it with the same links.
- Categories: check the names against what GBP's picker offers on the day and
  take the closest match, because the picker list is not stable.
- Anything else branch-specific the paster would otherwise get wrong, and the
  date any live state claimed above was last observed, so the next reader can
  tell how old it is.
