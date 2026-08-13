# GBP manual - auditing and editing the 16 Google Business Profiles

Written 2026-08-09 after a full sweep of all 16 RB Healthcare profiles.
Covers what the red dot means, the click sequence that actually works, the
traps, and the current state of every profile.

Companion to the weebly-navigation skill. GBP has no undo and no version
history, so every change must be logged in AGENT_LOG.md with its before value.

## 1. Getting in

1. Sign in to Chrome as rishi@rbhealth.co.uk. Claude never enters passwords.
2. Go to https://business.google.com/locations
3. The default view says "Ungrouped - 0 businesses". This is normal and is
   not an error. Use the group dropdown at the top left and pick
   "RB Healthcare Ltd". The other groups are Simple Weight Loss and
   Travel Clinics.
4. The group URL is stable and can be bookmarked:
   https://business.google.com/groups/104557957947949815610/locations
5. Set the window to roughly 1600 x 1100. This matters, see section 3.

## 2. What the red dot on the pencil means

The pencil is NOT an edit button. Its accessible name in the page markup is
"N Google updates". The red dot is that control's notification badge: the
listing has a change Google has generated, applied, or wants confirmed.

The filter dropdown above the table has a "Google updates (16)" option. As of
2026-08-09 all 16 profiles are flagged, which is why every row is lit.

Opening a flagged profile shows one of three things:

  a. "Your website was updated by Google."
     Google has ALREADY CHANGED the website field. Treat as a live defect.
  b. "Your social media profile was updated by Google."
     Google has added Facebook, Instagram, Twitter or LinkedIn links it
     found. Usually harmless if the accounts are genuinely ours, but check.
  c. "Review and edit your business information to improve your presence on
     Google. Scroll down to confirm."
     A prompt only. Nothing has changed yet.

The dot does not distinguish between these. You have to open each profile.

DO NOT click "OK" on a Google notice or "Confirm" on the review banner unless
you have decided to accept Google's version. Both can lock in the change.

## 3. The click sequence that works

The Business information dialog is slow and fragile. These rules were worked
out the hard way and save a lot of failed clicks.

- SET THE WINDOW SIZE FIRST, around 1600 x 1100. At smaller sizes the dialog
  renders at an inconsistent zoom between loads, so fixed click positions
  drift and miss. At this size the render is stable AND the About tab shows
  the Website field without switching tabs, which halves the work.
- The dialog takes 15 to 30 seconds to appear. Wait, then screenshot.
- NEVER close a dialog and click the next pencil in the same action batch.
  The second click never registers. Close, wait, then click in a separate
  step. This was the single biggest time waster.
- If a click seems to do nothing, just click the same pencil again. It
  usually opens on the second attempt.
- If the page freezes, the screenshot times out, or the zoom drifts, press F5
  or reload the group URL. The render comes back clean. Reloading is cheaper
  than fighting it.
- The dialog content is NOT readable as page text. It sits outside the
  readable DOM, so text extraction returns only the list behind it. You must
  use screenshots to read a profile.
- The list rows themselves ARE readable as text, so the full set of profile
  names, addresses and shop codes can be pulled in one go without clicking.

## 4. Editing the website field

1. Open the profile, About tab. Website sits under Contact information.
2. Click directly on the URL value. It turns into a text box with Save and
   Cancel beneath it.
3. Select all, type the new URL, click Save.
4. It then shows "Your edit is pending. It usually takes up to 10 minutes to
   be reviewed", with the old value struck through and the new one below.
5. Record the before value and the after value in AGENT_LOG.md immediately.

The correct URL for each branch is the "website" field in branches.json.
That file is the source of truth, not what is currently in GBP.

## 5. State of all 16 profiles as at 2026-08-09

Website field, checked one by one.

| Profile | Website in GBP | Verdict |
|---|---|---|
| Cherry Lane | https://www.cherrylanepharmacy.co.uk/ | correct |
| Clear Chemist | http://www.clearchemist.co.uk/ | WRONG SCHEME, Q66 |
| Coleman and Leighs | https://www.colemanandleighspharmacy.co.uk/ | correct |
| Fishlocks Eccleston | http://www.fishlockpharmacy.co.uk/ | WRONG SCHEME, Q66; shared root, item 3 below |
| Fishlocks Ainsdale | http://www.fishlockpharmacy.co.uk/ | WRONG SCHEME, Q66; shared root, item 3 below |
| Gordon Short | https://www.gordonshortchemist.co.uk/ | correct |
| Hirshmans | https://www.hirshmanspharmacy.co.uk/ | correct |
| McCanns Aigburth | http://www.mccannspharmacy.co.uk/contact-us.html | WRONG SCHEME AND PATH, Q66; sister branch points at the https root |
| McCanns Sandringham | https://www.mccannspharmacy.co.uk | FIXED 2026-08-09, was nhs.uk |
| RB Healthcare head office | http://www.rbhealth.co.uk/ | WRONG SCHEME, Q66; also miscategorised, item 5 below |
| Riddings | http://www.riddingspharmacy.co.uk/ | WRONG SCHEME, Q66 |
| Scorah Bramhall | http://www.scorah-chemists.co.uk/ | WRONG SCHEME, Q66; shared root, item 3 below |
| Scorah Hazel Grove | http://www.scorah-chemists.co.uk/ | WRONG SCHEME, Q66; shared root, item 3 below |
| SK Chemists | http://www.skchemist.co.uk/ | WRONG SCHEME, Q66 |
| Smartts | https://www.smarttschemist.co.uk/ | correct |
| Tiffenbergs | https://www.tiffenbergschemist.co.uk/ | correct |

One substitution in sixteen. The base rate is low, but it was on a branch
whose own site was fine, so it can happen to any of them. Worth a re-check
each quarter, or whenever the Google updates filter count jumps.

VERDICT COLUMN CORRECTED 2026-08-13, worklist item 6.6. As first written, this
table marked all nine http rows "correct", one of them literally "correct,
http", while section 6 item 2 below recorded that those same nine are wrong and
should all be https. The table and the open-items list contradicted each other,
and the table is the half a later sweep reads to decide what is left to do, so
nine known divergences were one glance away from being retired by accident. The
verdicts now say what section 4 says: branches.json is the source of truth, all
16 of its website values are https, and a row that differs from it on scheme or
path is wrong however good the domain is.

A trailing slash is NOT a divergence. branches.json stores the unslashed form
because tools/check-branch-links.js requires it, and on a homepage the two
resolve to the same resource.

tools/check-url-scheme.js now holds this table against branches.json row by
row, so a divergence cannot be recorded as correct again, and a profile added
here without a mapping fails rather than going unchecked.

## 6. Open items this sweep surfaced

Decisions for Rishi, none actioned:

1. NAMES. Fifteen of sixteen profiles are named in the pattern
   "<Brand> - <Branch> - Travel Vaccination and Simple Weight Loss Clinic".
   Google's guidance is that the name field holds the real-world business
   name only. Descriptors and keywords in it are a suspension risk on a
   verified listing. It also advertises Simple Weight Loss, a brand parked
   for 90 days. Clear Chemist is the only clean one, named just
   "Clear Chemist". Coleman and Leighs is additionally still shown as
   "Coleman & Leighs", not the confirmed trading name.
2. HTTP VERSUS HTTPS. Nine profiles point at http, six at https, one at the
   https root after the 2026-08-09 fix. All should be https. Raised as Q66 on
   2026-08-13 and linked to worklist item 6.6, which is the same subject read
   from the other end: item 6.6 came from Google Search Console showing http
   and https versions of the same page indexed separately and splitting
   clicks. The GBP website field is the strongest citation Google holds for a
   local business, so nine of them naming the insecure URL is the business
   telling Google its home page is the http one.
   IT IS NOT THE CAUSE OF THE SPLIT, and saying so would be wrong. Item 6.6
   measured three branches in GSC. Cherry Lane is the only one of the three
   whose GBP is correctly https, and it has by far the worst split: 342 clicks
   on the http home page against 13 on https, where Riddings (GBP http) is 151
   to 105 and McCanns (GBP http) is 190 to 119. If the citation drove the
   split, Cherry Lane would be the clean one; it is the worst one. So fix
   these nine because a citation should be right and a redirect hop is waste,
   not because it will move those numbers. What item 6.6 says will move them
   is a self-referencing canonical tag, which no page currently has and which
   lives in the Weebly head, not here and not in the repo.
3. SHARED ROOT URLS. Both Fishlocks branches point at the same root, and both
   Scorah branches point at the same root. This is exactly the problem the
   branch landing pages from worklist item 2.2 and 5.2 exist to solve. Once
   those pages are pasted, each branch profile should point at its own
   landing page rather than the shared homepage.
4. DESCRIPTIONS. Most profiles now carry the Phase 4 pack text. Two do not:
   Clear Chemist still has old copy, and McCanns Sandringham has a rewrite
   that is compliant but is not the pack version. McCanns Sandringham's live
   text also advertises private blood testing, which is not a service listed
   for that branch in branches.json, and omits the NHS contraception service,
   which is.
5. HEAD OFFICE. R B Healthcare Ltd is categorised as Pharmacy and has no
   description. It is an office and warehouse, not a pharmacy.

## 7. Standing rules

- No passwords entered by Claude. Rishi signs in, Claude drives after that.
- Log every change with its before value before making it.
- Never accept a Google update without deciding it is right.
- branches.json is the source of truth for NAP, website and services.
- Weight loss content must not name prescription-only medicines or make
  efficacy claims, in descriptions or posts.
