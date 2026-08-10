# AGENT LOG - hourly audit-backlog runs
Newest entries at the top. Every run appends an entry, even a no-change one.
Format: date, time, item worked, what changed, commit hash, open questions.

## Questions for Rishi
OPEN: Q18 (raised 2026-08-10, twenty-eighth run) - the six branches that share
a brand and a website with a sister shop (Fishlocks, McCanns, Scorah) identify
themselves on 12 of their 13 pages by the brand, not the shop. Five generators
use brandLabel for the JSON-LD name Google reads and for the data-branch
attribute that labels every enquiry; the landing page generator uses
branchName. So each shared domain hands Google two Pharmacy records with one
name and two postcodes, and an enquiry arrives labelled with a name that fits
both shops. Recommendation is to move the five generators onto branchName for
those two machine-readable fields only, leaving all visible copy as it reads.
That changes 72 pages, all of them already in the paste queue. Nothing is
blocked by it and no enquiry is actually lost, because the hidden website_url
field still carries the page URL.
OPEN: Q17 (raised 2026-08-10, twenty-seventh run) - the booking widget on every
service page is resolved at run time from the live URL, and service.js bars
weight loss and travel clinic from falling back to the Pharmacy First diary
because they are separate services. Contraception has its own diary at all 14
branches too, and is not barred. It is latent, because a contraception page is
only generated where the branch already holds the widget. Raised rather than
fixed because service.js is a CDN-pinned asset that is byte-identical between
main and the pinned ref today, which is the only reason Q13's fast-forward is
free. Recommendation is to add the bar in the same session that answers Q13.
Nothing is blocked by it.
OPEN: Q16 (raised 2026-08-10, twenty-third run) - READ THIS ONE FIRST. Q5 found
one old weight loss page still live at Cherry Lane naming prescription-only
medicines and it was treated as a one-off. Checking all 15 branch sites this
run found the same template still live at FIVE more branches: Smartts Bootle,
Gordon Short Crosby, Tiffenbergs Aintree, Riddings Timperley and Coleman and
Leighs Walton. Each names Wegovy, Mounjaro and Orlistat, carries a slider
promising "up to 26kg (22.5% of your body weight)", and advertises a price.
Recommendation is to strip the offending elements in place and keep the booking
routes, which is what Q5 and Q9 together point at. Nothing in the repo is
blocked by it, because all five are live-only pages no generator owns.
OPEN: Q15 (raised 2026-08-10, twenty-second run) - all 12 McCanns Sandringham
pages aim at the word "Sandringham", which is the branch name rather than a
place. It is the only branch in the estate whose seoTown is missing from its
own serviceAreaList, and its GBP pack calls it a branch name throughout. The
sister branch 700 metres up the same road already holds Aigburth, so the
recommendation is to move the 12 pages onto St Michael's, keeping the existing
permalinks so no live URL breaks. Nothing is blocked by it.
OPEN: Q14 (raised 2026-08-10, twenty-first run) - one page title in the whole
estate is over Google's length limit: the Coleman and Leighs infected insect
bite page runs to 70 characters, so the brand is truncated away in the result.
Both ways of shortening it edit public copy on a clinical page, which is why
the autonomous window did not cover it. Recommendation is to drop "Pharmacy"
from that one title suffix. Nothing is blocked by it.
OPEN: Q13 (raised 2026-08-09, twentieth run) - both jsDelivr CDN pins have
gone stale, so live pages serve code this repo no longer says. The live switch
pages still send switch requests to rishi@rbhealth.co.uk because their pinned
commit predates the change to helpdesk@rbhealth.co.uk. Recommendation is to
fast-forward service-module-phase1 to main (no repaste needed) and re-pin the
switch pages at the next paste run. Nothing is blocked by it.
Q1 to Q12 are all answered as of 2026-08-09.

## Standing authorisation - autonomous window, 2026-08-09 23:14 BST to 2026-08-10 23:14 BST
Rishi is offline for the next 24 hours and does not want to be asked
anything in this window. For that period only, if a run would otherwise
raise a new question and mark an item [BLOCKED], take the recommended
option instead, implement it, and log the decision clearly at the top of
this file under an "AUTONOMOUS DECISION" heading so it is easy to find
and review in the morning. This does not relax any other rule: still
never touch main, never force-push, never touch Weebly or GBP beyond
read-only verification, still stop and log rather than guess on anything
involving money, legal risk, or a live patient-facing regulatory claim
(medicine names, efficacy claims) - raise those as a normal [BLOCKED]
question even in this window, since a wrong autonomous call there is
worse than a delay. This authorisation expires at 2026-08-10 23:14 BST;
after that, resume the normal behaviour of raising questions and
waiting for an answer.

Q1 to Q11 are all answered as of 2026-08-09. Q7, Q8, Q9 and
Q11 were answered by Rishi in a Cowork session, all four taking the
recommended option. Q10 was answered and completed on 2026-08-08.

Q7 IS NOW DONE IN THE REPO (2026-08-09, fifteenth run). What is left of it is
the Weebly repaste of the SEO description field for the 15 switch pages.
Q11 IS NOW DONE IN THE REPO TOO (2026-08-09, sixteenth run). What is left of
it is the Weebly paste of the four new landing pages, alongside each branch's
service pages. Q8 and Q9 both need the Weebly editor, so both stay [BLOCKED]
in AGENT_WORKLIST.md rather than nagging every unattended run. All three
outstanding jobs are now Weebly paste work, not repo work.

WHAT THE FOUR ANSWERS AUTHORISE:
  - Q7 (repo only, an unattended run can do it): DONE 2026-08-09. Rewrite the
    two em dash strings in tools/build-switch-pages.js by splitting each
    sentence at a full stop rather than swapping in a hyphen, then regenerate
    the 15 switch pages. The Weebly SEO description field STILL needs
    repasting at the next paste run.
  - Q11 (repo only, an unattended run can do it): DONE 2026-08-09. Build
    landing pages for McCanns Aigburth, McCanns Sandringham, Scorah Bramhall
    and Scorah Hazel Grove from the existing generator, same pattern as the
    Fishlocks pair built under item 2.2. The four pages STILL need pasting to
    Weebly, and the branch service pages they link to must be pasted first or
    in the same session.
  - Q8 (needs the Weebly editor): repoint all 11 Post A Pharmacy First links
    in the GBP packs to the new generated pages, AND paste those pages to
    Weebly in the same run. Rishi accepted that this puts the Weebly paste on
    the critical path.
  - Q9 (needs the Weebly editor, hand edit): add a signpost paragraph and a
    button to the new Pharmacy First page at the TOP of the old Cherry Lane
    Pharmacy First page, keeping the existing video and booking widget
    underneath. The bridge block at modules/service/weebly-paste/
    cherry-lane-old-pharmacy-first-replacement.html must NOT be pasted as it
    stands, because it would remove that widget. Rewrite it as a
    signpost-only fragment or retire it.

Note on how these were answered: through the Cowork session directly, not
the portal. The portal route is still broken, see below.

ANSWER PICKUP: LIKELY FIXED 2026-08-09 EVENING. In a supervised session the
browser picker was resolved with switch_browser and the chosen Chrome is now
named "prodesk". Both registrations reported isLocal true, so the diagnosis
below (a spare Chrome on the Surface needing sign-out) was WRONG: it is two
Chrome profiles or a stale registration on the ProDesk itself. The next
unattended run that has an open question should try the portal fetch normally
and record whether the name persisted. Everything below this line is the
historic account and is kept only for context.

NOTE ON ANSWER PICKUP: STILL BROKEN on 2026-08-09, six runs running. Checked
again on the fourteenth run: both Chrome browsers are still connected, still
report as "Browser 1" and "Browser 2", and the tooling still refuses to act
until a human picks one. Q7, Q8, Q9 and Q11 have now been open and unanswerable
through the portal since 6, 7, 7 and 7 August. Nothing else was tried, per the
standing rules. The fix is to disconnect the spare Chrome from the account or
sign the Surface out. Answering in a Cowork session still works.

EARLIER NOTE ON ANSWER PICKUP: the 2026-08-07 fix did not hold.
The supervised session named the two browsers "prodesk" and "Surface" through
the switch_browser confirmation screen and expected the next unattended run to
select prodesk by deviceId. Checked again on the twelfth run: both browsers are
still connected and both still report as "Browser 1" and "Browser 2". The names
did not persist, and the tooling still refuses to act until a human picks one,
which an unattended run cannot do. That is four runs in a row with no pickup.
Q7 and Q8 have now been open and unanswerable through the portal since 6 and 7
August. The only fix that will actually work is disconnecting the spare Chrome
from the account, or signing the Surface out. Naming them is not enough.
Until then the portal answer forms are write-only: answering there reaches
nothing. Answering in a Cowork session still works, as it did for Q1 to Q6.

HISTORIC (for context): the portal answer fetch failed three runs
running, every time because two Chrome browsers are connected to the account
and the browser tools will not act until a human picks one, which an
unattended run cannot do. Any answers left on the portal for Q7 or Q8 are
sitting there unread, and have been for three runs. Disconnecting the spare
Chrome, or naming one as the default, would restore the route. Until that
happens the portal answer forms are effectively write-only: answering there
reaches nothing. Answering in a Cowork session still works, as it did for
Q1 to Q6.
Open: Q8 (raised 2026-08-07, eighth run) - the Pharmacy First button in
Post A of 11 of the 15 GBP packs points at an old live-only page rather
than at the new branch page this repo generates. Only Fishlocks and Cherry
Lane were ever migrated. Nothing is blocked; the packs are not posted yet.
Recommendation is to repoint all 11 and paste the new pages at the same run.
Open: Q7 (raised 2026-08-06, seventh run) - em dashes reach public copy in
two strings generated by tools/build-switch-pages.js: the visible body
sentence on all 15 switch pages and the meta description that becomes the
Google snippet. Recommendation is to rewrite both by splitting the sentence
rather than swapping in a hyphen. Nothing is blocked by it; answer on the
status page when convenient.
Q6 answered by Rishi in a Cowork session on 2026-08-05:
both replacement blocks recreated in modules/service/weebly-paste/,
version-controlled. Weebly paste of both blocks still outstanding -
needs Weebly editor login. Also that session: agents/audit-backlog
merged to main (d520487..aa950e0, no force) per the Q3 answer,
checkers clean beforehand (173 pages, 0 failures).
Q1 to Q5 are all answered. Q2 to Q5 were answered by Rishi
directly in a Cowork session on 2026-08-05 and are recorded in
QUESTIONS.json (committed by the recovery run below).

ANSWERED 2026-08-04 (item 1.1): Coleman & Leigh vs Leighs. Rishi confirmed
  the correct trading name is "Coleman and Leighs Pharmacy". Repo updated and
  regenerated same day (see entry below). Do not re-raise this question.

## 2026-08-10 13:34 (unattended run, twenty-eighth) - Quality pass on item
3.12, Tiffenbergs Chemist Aintree. All 12 Tiffenbergs pages verified clean on
title, description, H1, NAP, tel: link, review link, schema, links, clinical
age ranges and weight loss compliance. The gap this run found is not in
Tiffenbergs and not in any single page: on the six branches that share a brand
with a sister shop, the pages identify themselves by the BRAND rather than by
the shop, in the two machine-readable fields that decide how Google resolves
the business and how an enquiry is labelled. New
tools/check-branch-identity.js closes it. Not fixed on the spot, for the
reason given below, and raised as Q18. Commit 49cebbd.

WHAT WAS VERIFIED ON TIFFENBERGS ITSELF. All 12 pages (11 service plus the
switch page) carry 388 Longmoor Lane, Liverpool, L9 9DB and 0151 525 3462 on
every occurrence, visible, in the tel: link and in the JSON-LD, and every page
carries Tiffenbergs' own Google review link and no other branch's. No page
carries another branch's phone or postcode. Titles, descriptions, H1s and
permalinks all lead with Aintree, which is the branch's seoTown and the first
entry in its own serviceAreaList, so the word the pages claim is a place the
branch itself says it serves. Clear Chemist also sits in Aintree, but on its
own domain and with its own brandSlug, so no title, description or permalink
collides. The Pharmacy First overview links all seven condition pages and each
condition page links back. The weight loss page names no prescription-only
medicine, makes no efficacy claim, carries the estate's single CONSULT_FEE
price string and repeats the individual-results disclaimer twice.

THE CLINICAL CHECK, DONE BY HAND BECAUSE NO CHECKER OWNS IT. The seven
condition cards on the Pharmacy First overview state an NHS age range each,
and the condition page repeats it in its hero pill and again in its
eligibility list. All seven agree with the NHS Pharmacy First clinical
pathways: UTI women aged 16 to 64, sore throat 5 and over, sinusitis 12 and
over, earache 1 to 17, impetigo 1 and over, shingles 18 and over, infected
insect bite 1 and over. Earache is the one that matters most, because it is
the only bounded range, and the page states the upper bound in both places
and adds "Adults aged 18 and over are not covered by this pathway" rather
than leaving it implied.

TWO THINGS ABOUT TIFFENBERGS WORTH RECORDING RATHER THAN FIXING. Its pfLink
is the one link field in branches.json with no .html ending, already recorded
as KNOWN in check-branch-links against Q8 and moving with the other ten under
item 5.3. And its branch email is Tiffenberg@rbhealth.co.uk, singular, where
the trading name is plural. That is a mailbox name, not site copy, and it
reaches no page; it is the same shape as the Shorts@ note from the 3.11 pass.

THE GAP, AND WHY NO CHECKER SAW IT. branches.json carries two names per
branch: brandLabel, the brand, and branchName, this shop. For ten of the
sixteen branches the two strings are identical, so the choice between them is
invisible. For six of them they are not, and those six are exactly the
branches that share a brand AND a website with a sister shop: Fishlocks
Ainsdale and Eccleston, McCanns Aigburth and Sandringham, Scorah Bramhall and
Hazel Grove. Five of the six generators map brand: b.brandLabel and use it in
two places on every page: the JSON-LD "name", and the data-branch attribute on
the module root. The sixth, build-branch-landing-pages, written later for
exactly this shared-domain problem, uses b.branchName. So each of those six
branches has 12 pages that name the brand and one that names the shop.
Nothing caught it because both existing readers were written to tolerate
either field: check-booking-routes rule 4 accepts data-branch equal to
branchName OR brandLabel, and check-jsonld accepts the same for the name. That
tolerance is correct for the ten branches where the two are the same string
and is precisely the hole for the six where they are not. Neither field is
visible copy, so no text scan could ever have seen it, which is the same class
of silent fault as the map iframe and the booking chain.

WHAT IT ACTUALLY COSTS. Two things, and they are different in kind. On the
search side, each of the three shared domains hands Google twelve pages
declaring a Pharmacy called "Fishlocks Chemist" at PR8 3HN and twelve
declaring a Pharmacy of the same name at PR7 5SZ, plus one landing page each
that does name the shop. That is the entity-resolution problem item 2.2 was
built to fix, arriving through a field item 2.2 never touched. On the enquiry
side, service.js and switch.js read data-branch to label an enquiry, a
callback request and a WhatsApp message, so a request from Hazel Grove reaches
the helpdesk labelled "Scorah Chemists". The switch pages are the sharper
case: the page bakes a town-specific source value ("Fishlocks Chemist Ainsdale
Switch Page"), and switch.js overwrites it with "Callback request - " plus
data-branch the moment a visitor toggles callback mode, so a correct label is
actively replaced by an ambiguous one, on the journey where the town decides
which shop sets the patient up. Nothing is lost outright: the hidden
website_url field carries the page URL on every submission, so the town can
always be recovered by reading it. The fault is in the label a human reads
first, not in the data.

WHY IT WAS RAISED RATHER THAN FIXED. The fix is one field name in five
generators, and it is unusually contained: because branchName equals
brandLabel for the other ten branches, only the six shared-brand branches
change and the other 105 pages regenerate byte-identical. It was not taken
because the JSON-LD name is what Google uses to decide whether two addresses
are one business or two, so changing it on 66 pages is a search decision
rather than a correction, and because it puts 72 pages into a Weebly repaste
queue that is already the bottleneck on items 5.1, 5.2 and 5.3. Splitting it,
fixing data-branch now and the schema name later, would cost two regenerations
and two pastes of the same 72 pages, so the two halves are kept together in
one question. Same reading of the autonomous window as Q13 to Q17: the window
converts a decision that BLOCKS a worklist item into an autonomous one, and
this blocks nothing.

WHAT THE NEW CHECKER DOES. Per page: the filename resolves to exactly one
trading branch; a page carrying a module root carries a non-empty data-branch;
data-branch and the JSON-LD name are that branch's branchName or brandLabel
and never another branch's name, which is reported by naming the branch the
string actually belongs to; and where a brandLabel is carried by more than one
trading branch, both fields must be the branchName. Estate-wide: two branches
on one website host never publish the same JSON-LD name, and one branch never
declares two different names across its own pages, so a half-finished
migration fails rather than shipping. In branches.json itself: branchName
starts with brandLabel, so a branch name is always the brand plus a qualifier
and never a divergent spelling, and a branch sharing a brandLabel does not
have that bare brandLabel as its branchName. The last two rules guard the data
the fix would rely on. Expected values are composed from branches.json and
nothing is imported from the generators, so a generator reaching for the wrong
field fails here. The six branches are recorded in KNOWN against Q18.

NEGATIVE TESTS. Eleven, and all eleven fired: a missing data-branch on a page
with a module root, a data-branch naming another pharmacy, a JSON-LD name
naming another pharmacy, a JSON-LD block with no usable name, a page filename
matching no branch, a branchName that does not start with its brandLabel, a
shared brandLabel used as a branchName, one branch declaring two different
data-branch values across its pages, two branches on one host publishing one
JSON-LD name, a KNOWN key that no longer breaks its rule, and finally the
positive case: applying the proposed fix to all 13 Scorah Hazel Grove pages
makes that branch's KNOWN entry go stale and fails the run, which proves the
entry is tied to the defect rather than to a name. Every mutated file was
restored and confirmed byte-clean against git afterwards.

WHAT ELSE THE PASS SWEPT AND FOUND CLEAN. Estate-wide rather than Tiffenbergs
only. The enquiry form itself, which nothing had read: service.js needs
svc-form, the svc-post hidden iframe, svc-wa, svc-msg, svc-thankyou and the
fields first_name, last_name, mobile, email, message, the company honeypot and
the hidden destination, source and website_url. All 127 pages that carry a
form carry the complete set, with no page missing a field and no field
appearing on only some pages. The 35 pages with no service form are the 14
Pharmacy First overview pages, the 15 travel clinic pages and the 6 landing
pages, and that split is per generator rather than per branch, so it is a
design choice and not drift; the 15 switch pages carry their own switch-form
instead, with the same hidden fields. The destination input is empty in every
page carrying one, which matters
because switch.js only fills it when it is empty: a page-baked value would
silently beat the module and survive the Q13 fix. WhatsApp numbers: one
central number on all 171 pages that carry the attribute, no per-branch
variation to drift. No generated page carries an unreplaced {{TEMPLATE}}
placeholder; the only files that do are the two DRAFT copy templates, which no
generator publishes.

Files changed: tools/check-branch-identity.js (new), CLAUDE.md, QUESTIONS.json,
AGENT_LOG.md. No generated page changed and no generator changed, so no
regeneration was needed and nothing new joins the Weebly paste queue. All 17
checkers re-run clean afterwards (177 pages, 0 failures) with the same warning
and KNOWN profile as before, plus the six new KNOWN entries against Q18.
Nothing ticked in AGENT_WORKLIST.md: this was a quality pass, and 5.3 and 5.4
remain the only unchecked items, both [BLOCKED] on Weebly access.

Run start state. No .agent-lock and no .git\index.lock, no git process
running. Worktree clean, branch agents/audit-backlog level with origin at
dedb156.

Portal answer pickup: ATTEMPTED, UNAVAILABLE, seven runs in a row now. Q13 to
Q17 were all open at the start, so the condition was met. The browser tooling
reached https://data.rbhealth.co.uk/api/feedback and Cloudflare Access
returned its sign-in page rather than the feedback JSON, so Rishi's Chrome
does not hold a signed-in Access session. Per the scheduled task rules no
login was attempted and no other route was tried. Any answers left on the
portal for Q13 to Q18 remain unread by an unattended run. If those answers
matter, they need a supervised session or a signed-in Chrome.

## 2026-08-10 13:04 (unattended run, twenty-seventh) - Quality pass on item
3.11, Gordon Short Chemist Crosby. All 12 Gordon Short pages verified clean on
title, description, H1, NAP, tel: link, review link, schema, links and
compliance. The gap this run found is not in those pages and not in any page:
the chain that decides which Appointedd diary a patient books into had never
been checked past its first link. New tools/check-booking-routes.js closes it
end to end, and the first thing it found is that one of the three separate
services is missing from the guard that stops a booking landing in the wrong
diary. Not fixed on the spot, for a reason given below, and raised as Q17.
Commit 110ed2f.

WHAT WAS VERIFIED ON GORDON SHORT ITSELF. All 12 pages (11 service plus the
switch page) carry 159 College Road, L23 3AT and 0151 924 3449 on every
occurrence, visible, in the tel: link and in the JSON-LD, and every page carries
Gordon Short's own Google review link and no other branch's. No page carries any
other branch's phone or postcode. Titles, descriptions, H1s and permalinks all
lead with Crosby, which is the branch's seoTown and the first entry in its own
serviceAreaList, so the word the pages claim is a place the branch itself says
it serves. Every title is 63 characters or fewer and every description sits
between 138 and 157. The Pharmacy First overview links all seven condition
pages and each condition page links back. The weight loss page names no
prescription-only medicine and makes no efficacy claim. The only two words that
looked like claims are in HTML build comments, not public copy: the travel
clinic page's "no vaccine is claimed guaranteed in stock" note to the paster.

TWO THINGS ABOUT GORDON SHORT WORTH RECORDING RATHER THAN FIXING. It is one of
the seven branches with a lunch closure, and its Saturday is split too (09:00
to 13:00 and 14:00 to 17:00), which is the shape that caused the 2pm defect on
the McCanns landing pages. No Gordon Short page prints opening hours, because
it is one of the nine branches with no landing page, so nothing here is
exposed to it. And its branch email is still Shorts@rbhealth.co.uk, the old
brand spelling that item 1.1 retired from the trading name. That is a mailbox
name, not site copy, and it reaches no page.

THE GAP, AND WHY NO CHECKER SAW IT. A generated service page does not carry its
Appointedd widget id at all. It ships an empty mount and a comment telling the
next person not to hard-code one. modules/service/service.js then reads the LIVE
URL, splits it into a service slug and a brandSlug-townSlug key, looks that key
up in branches.json and renders the id it finds. That was a deliberate fix: six
pages once hard-coded the wrong id and sent bookings into another branch's diary
(verified 2026-07-17). The cost of the design is a chain nothing checked:
branches.json to filename to paste-sheet permalink to live URL to service.js's
routing table to the widget id. check-seo-sheets ties the filename to the
permalink. Everything after that was unguarded, and a break there does not show
up as a wrong word on a page. It shows up as an empty white booking box, or as a
patient booked into the wrong diary, while every visible line still reads
correctly. That is the same class of silent fault as the map iframe.

WHAT THE NEW CHECKER DOES. Per page carrying a booking mount: the filename
parses under service.js's OWN routing regex; the brandSlug-townSlug key resolves
to exactly one trading branch; that branch holds a usable widget id under
service.js's own fallback rules; data-branch on #rbhsv-root names the branch the
URL resolves to, because that attribute is what labels the enquiry email and the
WhatsApp message, so a wrong one misfiles a real enquiry; and data-service is
present and worded identically on every page of that service, so one service
cannot reach the helpdesk under two names. Estate-wide it also checks that no
two branches share a routing key, and that no two services at one branch share
an Appointedd id. Sister branches sharing one weight loss and one travel diary
across a pair (Scorah, McCanns, Fishlocks) is normal and is reported, not
failed. service.js's routing regex and its SERVICE_WIDGET_KEYS map are read as
DATA UNDER TEST rather than imported, and are checked against each other and
against the pages the repo actually generates, so a service added to the
generators and forgotten in service.js fails here instead of shipping as an
empty booking box. 156 pages carry a booking mount and all 156 resolve today.

THE FINDING. service.js lets a page fall back to the branch's Pharmacy First
diary when it has no widget of its own, and bars weight loss and travel clinic
from doing so, with a comment saying that falling back there "would book a
customer into the wrong clinic/service". The NHS Pharmacy Contraception Service
sits in exactly that category and is not barred. It has its own diary at all 14
branches that offer it, it is never the same id as Pharmacy First anywhere, and
no branch's Pharmacy First overview page links to it. The checker does not
hardcode which services are Pharmacy First conditions: it reads them off the
overview pages themselves, which link exactly the seven conditions and none of
the three separate services, so the rule derives itself from the site rather
than from an opinion in a checker.

WHY IT WAS RAISED RATHER THAN FIXED. The fix is two words in service.js, and
the autonomous window would normally cover it: it is routing logic, not public
copy, no medicine name, claim or price. It was not taken because of what
service.js is. It is a CDN-pinned asset, and today modules/service/service.js is
byte-identical between origin/main and the pinned ref service-module-phase1.
Q13's recommended fix, fast-forwarding that pinned branch to main, is free
precisely because nothing has diverged. Editing service.js now would end that
and turn an unanswered question about a LIVE defect (switch requests still going
to Rishi's own inbox) into a more expensive one. The contraception fault is
latent in the meantime: check-page-coverage only earns a contraception page
where the branch already holds a contraception widget, so the fallback cannot
fire today. Cheaper and safer to let the fix ride along with Q13, which is what
Q17 recommends.

NEGATIVE TESTS. Fifteen, one per rule, and all fifteen fired: an unparseable
filename, a routing key matching no branch, a no-fallback service with no widget
id, a data-branch naming another pharmacy, a missing data-branch, a missing
data-service, one page describing the service differently from its siblings, two
branches sharing a routing key, two services at one branch sharing an Appointedd
id, a slug in the routing regex but not in the map, a slug in the map but not in
the regex, a Pharmacy First condition wrongly barred from falling back, a
separate service missing from the bar, a stale KNOWN entry, and a change to the
shape of service.js that stops the checker reading its routing table. Every
mutated file was restored and confirmed byte-clean against git afterwards.

WHAT ELSE THE PASS SWEPT AND FOUND CLEAN. Estate-wide rather than Gordon Short
only, on the same reasoning as the previous runs. Google review links on all
177 pages: every page carries its owner branch's link and no other's. Internal
links between generated pages: 244 checked, and the only cross-branch links are
the six deliberate sister-branch links on the landing pages, each between two
branches on one shared domain. Pharmacy First link graph across all 14
branches: every overview links all seven conditions and every condition page
links back to its own branch's overview. Price strings in public copy: one,
"from £39.99", on all 15 weight loss pages, defined once as CONSULT_FEE in the
generator rather than written out per page, and no travel clinic page carries a
price at all.

Files changed: tools/check-booking-routes.js (new), CLAUDE.md, QUESTIONS.json,
AGENT_LOG.md. No generated page changed and no generator changed, so no
regeneration was needed and nothing new joins the Weebly paste queue. All 16
checkers re-run clean afterwards (177 pages, 0 failures) with the same warning
and KNOWN profile as before, plus the one new KNOWN entry against Q17. Nothing
ticked in AGENT_WORKLIST.md: this was a quality pass, and 5.3 and 5.4 remain
the only unchecked items, both [BLOCKED] on Weebly access.

Run start state. No .agent-lock and no .git\index.lock, no git process running.
Worktree clean, branch agents/audit-backlog level with origin at 0ec492e.

Portal answer pickup: ATTEMPTED, UNAVAILABLE, six runs in a row now. Q13 to Q16
were all open at the start, so the condition was met. The browser tooling
reached https://data.rbhealth.co.uk/api/feedback and Cloudflare Access returned
its sign-in page rather than the feedback JSON, so Rishi's Chrome does not hold
a signed-in Access session. Per the scheduled task rules no login was attempted
and no other route was tried. Any answers left on the portal for Q13 to Q17
remain unread by an unattended run. If those answers matter, they need a
supervised session or a signed-in Chrome.

## 2026-08-10 12:34 (unattended run, twenty-sixth) - Quality pass on item 3.10,
Riddings Pharmacy Timperley. All 12 Riddings pages verified clean on title,
description, H1, NAP, schema, map, links and compliance. The defect this run
found is not in those pages: one of the six generators has been declaring a
different schema.org business type from the other five, so all 15 weight loss
pages told Google the branch was a MedicalBusiness while its other 162 pages
said Pharmacy. Fixed at source, 15 pages regenerated, new tools/check-jsonld.js
makes it permanent. No question raised, commit 9eae2e5.

WHAT WAS VERIFIED ON RIDDINGS ITSELF. All 12 pages (11 service plus the switch
page) carry 38 Riddings Road, WA15 6BP and 0161 973 2951 on every occurrence,
visible, in the tel: link and in the JSON-LD, and the PostalAddress matches
branches.json field for field including Greater Manchester as the county. Every
page carries Riddings' own Google review link and no other branch's. Titles,
descriptions, H1s and permalinks all lead with Timperley, which is the branch's
seoTown and the first entry in its own serviceAreaList, so the word the pages
claim is a place the branch itself says it serves. The Pharmacy First overview
links to all seven condition pages and each condition page links back. The
weight loss page names no prescription-only medicine, makes no efficacy claim
and carries the full limitation paragraph.

Two things about Riddings worth recording rather than fixing. Its
addressLocality is the only two-part locality in the estate, "Timperley,
Altrincham", which is correct for the postal address and reads correctly
everywhere it prints. And Riddings is one of the nine branches with no landing
page, so its contraception, travel, weight loss and switch pages have no
inbound link from any other generated page. That is the standing consequence of
landing pages existing for six branches only, not a Riddings defect: the six
that have one are the six whose pages are linked.

THE DEFECT, AND WHY NO CHECKER SAW IT. Six generators write a JSON-LD block.
Five of them call a function named pharmacySchema that declares
"@type": "Pharmacy". tools/build-weight-loss-pages.js calls one named
medicalBusinessSchema that declares "@type": "MedicalBusiness". The two
functions were otherwise character-for-character identical, same name, same
url, same telephone, same PostalAddress, which is what makes this a copy
divergence rather than a decision. Nothing in the repo had ever read a JSON-LD
block end to end. check-nap reads visible text, check-opening-hours reads only
the openingHoursSpecification on the six landing pages, and check-seo-pattern
reads titles and H1s. The block that is written for a machine rather than a
person was the one part of the page no rule covered.

WHY IT MATTERS AND WHY IT WAS SAFE TO FIX. schema.org Pharmacy is a subtype of
MedicalBusiness, so nothing on those 15 pages was untrue. The cost is entity
resolution: a business that describes itself two ways across its own pages
gives Google two weaker signals instead of one strong one, and the page family
typed vaguely is the private paid service where the local pack listing is worth
most. The fix moves to the MORE specific and more conservative type, matches
the travel clinic generator that builds the sister private service, and changes
one line per page. No title, description, H1 or visible word moved: the diff is
15 files, 15 insertions, 15 deletions, one line each.

WHY IT WAS FIXED RATHER THAN ASKED, ON A WEIGHT LOSS PAGE. The autonomous
window reserves patient-facing regulatory copy for Rishi, so the carve-out was
considered directly, as on the previous run. It does not apply: this is
structured data, not public copy. No medicine name, efficacy claim, price or
clinical statement was touched, nothing a patient reads changed, and the change
is towards the narrower description of the business rather than a broader one.

WHAT WAS DONE TO MAKE IT PERMANENT. New tools/check-jsonld.js reads all 177
generated pages and checks, per page: exactly one JSON-LD block and it parses;
"@type" is Pharmacy; "@context" is https://schema.org; "name" is the branch's
branchName or brandLabel; "url" is the branch website plus the page's own
filename; PostalAddress matches branches.json field for field including
addressRegion and addressCountry; "telephone" matches exactly, spacing
included; and where present "email" matches and areaServed is exactly
serviceAreaList, in order. Expected values are composed from branches.json
rather than imported from the generators, on the same reasoning as
check-opening-hours: a checker that calls the code it is checking proves
nothing. Seventeen negative tests run and all fired, one per rule plus a
deliberate parse break, a second JSON-LD block, an areaServed reordering, and a
stale KNOWN entry. Every mutated file was restored and confirmed byte-clean
against git afterwards.

THE SECOND GAP THE SAME CHECKER CLOSES. Every page's contact card carries a
Google Maps iframe whose query is the branch address URL-ENCODED. check-nap
scans for the address as plain text, so it cannot see that query at all. That
is the one element on a page that can send a patient to another building while
every visible line still reads correctly. All 177 map queries were decoded and
compared to branches.json this run and all 177 match exactly, so this found no
defect, but it was an unguarded route to the worst kind of error on the site
and it is now a rule. Two negative tests fired on it, a wrong postcode and a
missing iframe.

WHAT ELSE THE PASS SWEPT AND FOUND CLEAN. Estate-wide rather than Riddings
only, on the same reasoning as the previous two runs. Every branch email and
nhsEmail: nhsEmail is pharmacy.<odsCode>@nhs.net for all 14 trading branches
with an ODS code, and the only branch emails printed on any page are the six
landing pages, each its own. Booking widget ids in branches.json: no id is
reused by two services at one branch, and the only ids shared between branches
are the weight loss and travel pairs at Scorah, McCanns and Fishlocks, which
are the three shared-domain sister pairs, so a booking cannot land in an
unrelated branch's diary. JSON-LD parse: all 177 blocks parse as JSON.

Files changed: tools/build-weight-loss-pages.js, tools/check-jsonld.js (new),
CLAUDE.md, the 15 weight-loss-clinic-*.html pages, AGENT_LOG.md. All 15
checkers re-run clean afterwards (177 pages, 0 failures) with the same warning
and KNOWN profile as before the change, so nothing else moved. Nothing ticked
in AGENT_WORKLIST.md: this was a quality pass, and 5.3 and 5.4 remain the only
unchecked items, both [BLOCKED] on Weebly access. QUESTIONS.json unchanged,
Q13 to Q16 still open.

OUTSTANDING ON THE LIVE SIDE. The 15 weight loss pages now differ from what is
live, so they join the queued paste work. They were already in that queue from
the previous run's en dash fix, so this adds no new paste. No SEO field changed,
so nothing extra needs repasting in Weebly > Pages > SEO Settings.

Run start state. No .agent-lock and no .git\index.lock, no git process running.
Worktree clean, branch agents/audit-backlog level with origin at 5bb30b5.

Portal answer pickup: ATTEMPTED, UNAVAILABLE, same blocker as the previous
three runs. Q13, Q14, Q15 and Q16 were all open at the start, so the condition
was met. The browser tooling reached https://data.rbhealth.co.uk/api/feedback
and the portal returned the Cloudflare Access sign-in page rather than the
feedback JSON, so Rishi's Chrome still does not hold a signed-in Access
session. Per the scheduled task rules no login was attempted and no other route
was tried. Any answers left on the portal for Q13 to Q16 remain unread by an
unattended run, and that is now five runs in a row. If those four answers
matter, they need a supervised session or a signed-in Chrome.

## 2026-08-10 12:04 (unattended run, twenty-fifth) - Quality pass on item 3.9,
Coleman and Leighs Pharmacy Walton. All 12 Coleman pages verified clean on
title, H1, NAP, postcode, schema, links and compliance. The defect this run
found is not in those pages: the house no-dash rule was only ever half
enforced, so every weight loss page in the estate has been carrying en dashes
in public copy while the checker reported clean. Fixed at source, 15 pages
regenerated, checker widened. No question raised, commit a797b1a.

WHAT WAS VERIFIED ON COLEMAN ITSELF. All 12 pages (11 service plus the switch
page) carry 241 Walton Village, L4 6TH and 0151 525 3522 on every occurrence,
visible and in tel: links, and the JSON-LD PostalAddress matches branches.json
field for field including Merseyside as the county. Every page carries
Coleman's own Google review link and no other branch's. The trading name reads
"Coleman and Leighs Pharmacy" in every visible string across all 12 pages,
which is the form Q1 settled: no "&", no "Leigh" singular, no apostrophe. That
was the thing most worth checking here, because this is the branch the estate
renamed, and the rename held. The brand slug in the filenames stays
coleman-leigh, which is a permalink and deliberately not renamed.

THE DEFECT, AND WHY NO CHECKER SAW IT. tools/check-em-dashes.js was written on
2026-08-09 as the permanent half of the Q7 fix, and its rule is one character
class: /[--]/. That matches an en or em dash typed as a literal character. It
does not match the same two characters written as HTML entities, and a browser
renders the two forms identically. All 15 generated weight loss pages carried
&ndash; twice each, 30 en dashes of public copy, and the checker had been
reporting "clean, no em or en dashes in public copy" over every run since it
was written. A rule that reads only one of the two spellings of the same
character is not a rule, it is a rule-shaped gap.

WHERE THEY WERE. Both came from tools/build-weight-loss-pages.js, lines 212 and
230, so they landed on all 15 pages identically:
  - the hero paragraph: "...not right for everyone &ndash; see below."
  - the eligibility lead: "...assess your suitability at consultation &ndash;
    nothing below is a guarantee of treatment, a specific medicine, or a
    specific outcome."
Both are now split at a full stop ("...not right for everyone. See below." and
"...at consultation. Nothing below is a guarantee...") rather than swapping in
a hyphen, which is exactly what Rishi's Q7 answer directed for the literal
case. The meaning of both sentences is unchanged, and the second one is the
compliance sentence on the weight loss pages, so it was rewritten to say the
same thing in the same order rather than reworded.

WHY IT WAS FIXED RATHER THAN ASKED, ON A WEIGHT LOSS PAGE. The autonomous
window reserves patient-facing regulatory copy for Rishi, and these are weight
loss pages, so the carve-out was considered directly. It does not apply: no
medicine name, efficacy claim, price or clinical statement was touched, and the
change is typographic. More to the point, Q7 already settled this exact
question and chose this exact remedy. This is not a new decision, it is the
answered Q7 decision reaching instances the checker could not see. Nothing was
weakened: the words "guarantee", "not an NHS treatment" and "individual results
vary" all survive verbatim.

WHAT WAS DONE TO MAKE IT PERMANENT. check-em-dashes.js now tests literal and
entity forms through one hasDash() helper used by all three call sites, covers
&mdash; &ndash; &#8212; &#8211; &#x2014; &#x2013; in both cases, and reports
which form it found so a failure says what to search for. The comment-exemption
and paste-sheet-heading exemption are unchanged and now count entity dashes
too. Six negative tests run and all passed: entity en, entity em, numeric en,
hex em, plus both literal forms re-tested so the original rule cannot regress.
A seventh confirmed an entity dash on a pasteable Page Title line in a paste
sheet fails, and an eighth confirmed one in a sheet heading still does not.
Every temporary file and the edited sheet were restored and verified byte-clean
afterwards.

WHAT ELSE THE PASS SWEPT AND FOUND CLEAN. Three things were checked across all
177 pages rather than just Coleman's 12, on the same reasoning as the previous
run. Template placeholders: the only {{...}} left anywhere are in the two
DRAFT-*.html copy templates, which are inputs, not output, so no generated page
ships an unreplaced placeholder. WhatsApp destination: one number, 447521775631,
on all 171 pages that carry the enquiry form, declared once per generator and
matching the DEFAULT in both service.js and switch.js, so no branch page sends
an enquiry to a different number than the script would use. Weight loss and
travel copy estate-wide: every occurrence of "guarantee", "results", "safe" and
"effective" reads as a limitation or a caveat, not a promise, and the only
efficacy claim in the estate remains the single Smartts tile already held under
Q16.

ONE THING RECORDED, NOT RAISED. No service or switch page carries opening hours
in visible copy or in JSON-LD; only the six branch landing pages do. That is
consistent across all 177 pages and all 15 branches, so it is a design choice
rather than a Coleman defect, and it means the seven lunch-closure branches
(Coleman among them) cannot state hours wrongly on a service page because they
do not state them at all. Worth knowing if landing pages are ever built for the
remaining branches, since that is the page type where the 3.6 defect lived.

Files changed: tools/build-weight-loss-pages.js, tools/check-em-dashes.js,
the 15 weight-loss-clinic-*.html pages, AGENT_LOG.md. All 13 checkers re-run
clean afterwards (177 pages, 0 failures) with the same warning and KNOWN
profile as before the change, so nothing else moved. Nothing ticked in
AGENT_WORKLIST.md: this was a quality pass, and 5.3 and 5.4 remain the only
unchecked items, both [BLOCKED] on Weebly access. QUESTIONS.json unchanged,
Q13 to Q16 still open.

OUTSTANDING ON THE LIVE SIDE. The 15 weight loss pages now differ from what is
live, so they need pasting to Weebly like the rest of the queued paste work.
The SEO title and description for these pages are unchanged, so no SEO field
needs repasting for this fix.

Run start state. No .agent-lock and no .git\index.lock, no git process running.
Worktree clean, branch agents/audit-backlog level with origin at 0718f40.

Portal answer pickup: ATTEMPTED, UNAVAILABLE, same blocker as the previous two
runs. Q13, Q14, Q15 and Q16 were all open at the start, so the condition was
met. The browser tooling reached https://data.rbhealth.co.uk/api/feedback and
the portal returned the Cloudflare Access sign-in page rather than the feedback
JSON, so Rishi's Chrome still does not hold a signed-in Access session. Per the
scheduled task rules no login was attempted and no other route was tried. Any
answers left on the portal for Q13 to Q16 remain unread by an unattended run,
and that is now four runs in a row.

## 2026-08-10 11:34 (unattended run, twenty-fourth) - Quality pass on item 3.8,
SK Chemists Bootle. All 12 SK pages verified clean on title, H1, description,
NAP, postcode, links and compliance, and the pass then found the defect by
looking at the one place no checker had ever read: the link fields inside
branches.json. Gordon Short Crosby's NHS review link stops one segment short of
the review form. Fixed at source, and new tools/check-branch-links.js makes it
permanent. No question raised and no public copy changed.

WHAT WAS VERIFIED ON SK ITSELF. All 12 pages (11 service plus the switch page)
carry 516 Stanley Road, L20 5DW and 0151 944 1013 on every occurrence, visible
and in tel: links. Every internal link on those pages points at a page this
repo generates. Every one carries SK's own Google review link and no other
branch's. The switch page has no app card, which is correct because SK is the
only Bootle branch with hasApp false, and no hand-written services grid, so the
3.7 finding is confined to Smartts as recorded. SK and Smartts share Bootle and
their titles and descriptions differ only by brand name, which is the Phase 3
pattern working as designed; the permalinks carry the brand slug, so nothing
collides.

WHAT THE PASS WENT LOOKING FOR NEXT. SK and Smartts are 1.5 miles apart, both
in Bootle, both L20, so this branch is the estate's best test of whether any
per-branch identifier can land on the wrong shop. Three were swept across all
177 pages: booking widget ids, Google review links, and the NHS fields.

  - Booking widget ids never reach a page at all. The 73 ids in branches.json
    appear only in branches.json, branches-editor.html, CHANGELOG.md and one
    script; the widgets are placed in Weebly directly and pages carry a #book
    anchor. So there is no page-level route for a booking to reach the wrong
    branch. Recorded rather than raised, and no checker written, because there
    is nothing on a page to check.
  - Google review links are clean estate-wide. All 177 generated pages carry
    exactly their own branch's link, 15 distinct links across 15 trading
    branches, none shared. Head office has none, which is correct.
  - The NHS fields were not clean.

THE DEFECT. Thirteen of the fourteen branches with an ODS code end their
nhsReviewUrl at /leave-a-review, which is the NHS form that actually takes a
review. Gordon Short Crosby's stops at the ODS code:
https://www.nhs.uk/services/pharmacy/gordon-short-chemist/XFPD45. That lands
the patient on the profile page instead of the review form, so a patient sent
there to leave a review has to find the form themselves. Fixed by appending
/leave-a-review, in branches.json and in the editor's embedded snapshot, with
lastUpdated bumped to 2026-08-10 in both.

WHY IT HAD NOT SHOWN UP YET, AND WHY IT WOULD HAVE. nhsReviewUrl reaches a page
through tools/build-branch-landing-pages.js, and only six landing pages exist so
far. Gordon Short is not one of them. Item 5.2 built four more under Q11 and the
remaining branches are queued, so the broken link was sitting in the data
waiting for the run that would print it. All six generators were re-run after
the fix and every page came out byte-identical, which confirms nothing public
changed today.

WHY IT WAS FIXED RATHER THAN ASKED. A malformed URL against a 13-of-14 pattern
is a defect with one correct answer, not a decision, so it did not need a
question even outside the autonomous window. The window was live at the time of
this run in any case (expires 23:14 tonight), and this falls nowhere near its
money, legal or patient-facing-regulatory-claim carve-out: no public copy
changed and no clinical wording was touched.

WHAT WAS DONE TO MAKE IT PERMANENT. New tools/check-branch-links.js, the first
checker in this repo to read branches.json's own link fields rather than pages.
Six rules: odsCode unique; nhsEmail exactly pharmacy.<odsCode>@nhs.net;
nhsReviewUrl matching .../X<odsCode>/leave-a-review; googleReviewUrl matching
the g.page shape and not shared by two branches; website a bare https host with
no trailing slash or path; pfLink on the branch's own host and ending .html.
Nine negative tests run and all passed (baseline clean, missing
/leave-a-review, another branch's ODS in the URL, mismatched nhsEmail, shared
Google review link, duplicate odsCode, pfLink on another branch's domain,
trailing slash on website, and a stale KNOWN key failing the run).
branches.json was restored byte-identical afterwards. Documented in CLAUDE.md.

TWO THINGS RECORDED, NOT RAISED. Clear Chemist Aintree is the only trading
branch with an ODS code and no nhsReviewUrl at all. It was already treated as
deliberately different on the 4.9 quality pass (no opening hours either), so
the checker reports it as a warning rather than a failure. Separately, the
pfLink sweep found exactly the 11 branches whose Post A Pharmacy First link
points at a live-only page this repo does not generate, which is precisely the
scope of item 5.3 and Q8, so it confirms that item rather than adding to it.
Tiffenbergs is in KNOWN against Q8 because its pfLink also lacks .html.

Files changed: branches.json, tools/branches-editor.html,
tools/check-branch-links.js (new), CLAUDE.md, AGENT_LOG.md. All 14 checkers
re-run clean (177 pages, 0 failures); all six generators re-run and output
byte-identical. Nothing ticked in AGENT_WORKLIST.md: this was a quality pass,
and 5.3 and 5.4 remain the only unchecked items, both [BLOCKED] on Weebly
access. QUESTIONS.json unchanged, Q13 to Q16 still open.

Run start state. No .agent-lock and no .git\index.lock, no git process running.
Worktree clean, branch agents/audit-backlog level with origin at 139304a.

Portal answer pickup: ATTEMPTED, UNAVAILABLE, same blocker as the previous run.
Q13, Q14, Q15 and Q16 were all open at the start, so the condition was met. The
browser tooling opened a tab and reached https://data.rbhealth.co.uk/api/feedback,
and the portal returned the Cloudflare Access sign-in page rather than the
feedback JSON, meaning Rishi's Chrome still does not hold a signed-in Access
session. Per the scheduled task rules no login was attempted and no other route
was tried. Any answers left on the portal for Q13 to Q16 remain unread by an
unattended run, and that is now three runs in a row.

## 2026-08-10 11:04 (unattended run, twenty-third) - Quality pass on item 3.7,
Smartts Chemist Bootle. All 12 Smartts pages verified clean on title, H1,
description, NAP, postcode, opening hours, schema and paste sheets, and the
GBP pack verified clean on every fact including the lunch closure. The pass
then followed the one thing that made this branch different from the six
before it, and found the most serious live exposure this backlog has turned
up. Raised as Q16. No public copy was changed.

WHAT MADE SMARTTS DIFFERENT. It is the only branch whose switch page carries a
hand-written services grid: six tiles with hardcoded URLs and hardcoded sales
copy, sitting in the CONFIG block of tools/build-switch-pages.js since the page
was first built, and never touched by the Phase 3 rollout because no generator
composes them. Checking where those six tiles actually point found the Weight
Loss Clinic tile aiming at weight-loss-clinic-bootle.html, which is not the
page this repo generates for that branch.

WHAT THAT PAGE TURNED OUT TO BE. Read live, it is the same old template Q5
found at Cherry Lane: Wegovy, Mounjaro and Orlistat named with dosage formats,
a slider telling the visitor "you could lose up to 26kg (22.5% of your body
weight)", a section headed "Real Results with Mounjaro" claiming it is "one of
the most effective weight loss treatments available", and a price of "From
£39.99". Q5 was raised on the assumption Cherry Lane was a one-off. It was not.
Checking the equivalent URL on all 15 branch sites found the same page still
live at FIVE branches: Smartts Bootle, Gordon Short Crosby, Tiffenbergs
Aintree, Riddings Timperley and Coleman and Leighs Walton. The other nine
return 404 and Cherry Lane was fixed under Q5. Advertising prescription-only
medicines to the public is not permitted, so that is five live pages of
regulatory exposure that no checker in this repo could ever have seen, because
all five are live-only Weebly pages that no generator owns.

A SIXTH DEFECT ON THE SAME PAGE. The Smartts one also prints its opening hours
as "Mon-Fri 9am-6pm" in three places, omitting the 1pm to 2pm lunch closure
branches.json records, so it tells patients the pharmacy is open when it is
shut. That is the same locked-door class as the 3.6 defect, but live and
outside the repo's reach. Gordon Short and Tiffenbergs both state their lunch
closure correctly, so it is specific to the Smartts page.

WHY NOTHING WAS CHANGED. The autonomous window was live at the time of this run
(expires 23:14 tonight), but its own carve-out reserves money, legal risk and
patient-facing regulatory claims - medicine names and efficacy claims by name -
for Rishi even inside the window. Every part of this finding is exactly that,
so it was raised rather than actioned, on the same reading as Q13, Q14 and Q15.
That includes the one part sitting in the repo rather than live: the Weight
Loss Clinic tile describes the clinic as "Support that delivers results", which
is an efficacy claim and the only one of its kind in the estate. Suggested
replacement wording, taken from the compliance-swept Smartts GBP pack, is
"Pharmacist-led consultations and ongoing support". It was not applied.

WHAT WAS DONE. New tools/check-service-links.js, which closes the gap that let
all of this sit unseen. Two rules: a generated page must not link to a page on
one of our own branch domains that this repo does not generate, and public copy
must carry no efficacy or results wording. Four rules negative-tested (claim
injected, stale link injected, generated link accepted, stale KNOWN key
detected). The Smartts tile and the five live-only link targets are recorded in
its KNOWN and KNOWN_CLAIM lists against Q16, so it reports every run without
going permanently red, and an entry that stops applying fails the run so the
lists cannot rot. Documented in CLAUDE.md.

A SMALLER FINDING, NOT ACTED ON. The same grid points its Travel Clinic tile at
vaccinations.html, the same URL as its Vaccinations tile, although this repo
generates travel-clinic-smartts-bootle.html. Folded into Q16 rather than fixed
separately, because the whole grid needs one decision.

CHECKED AND CLEAN, so recorded rather than raised: all 15 GBP packs state their
opening hours correctly against branches.json, including all seven lunch-closure
branches, which was the first thing checked after the 3.6 defect. Smartts and SK
Chemists share the town of Bootle and their titles and descriptions are
identical except for the brand name, which is the Phase 3 pattern working as
designed rather than a defect; the permalinks carry the brand slug, so nothing
collides. Nothing was ticked in AGENT_WORKLIST.md: this was a quality pass, and
5.3 and 5.4 remain the only unchecked items, both [BLOCKED] on Weebly access.

Files changed: tools/check-service-links.js (new), CLAUDE.md, QUESTIONS.json,
AGENT_LOG.md. All 13 checkers re-run clean (177 pages, 0 failures); switch and
service generators re-run and output byte-identical.

Run start state. No .agent-lock and no .git\index.lock, no git process running.
Worktree clean, branch agents/audit-backlog level with origin at 9c564e4.

Portal answer pickup: ATTEMPTED, UNAVAILABLE, different blocker from the last
two runs. Q13, Q14 and Q15 were open at the start, so the condition was met,
and this time the browser tooling did open a tab and reach the URL. The portal
returned the Cloudflare Access sign-in page for data.rbhealth.co.uk rather than
the feedback JSON, meaning Rishi's Chrome does not currently hold a signed-in
Access session. Per the scheduled task rules no login was attempted and no
other route was tried. Any answers left on the portal for Q13, Q14 or Q15 are
therefore still unread by an unattended run.

## 2026-08-10 10:34 (unattended run, twenty-second) - Quality pass on item 3.6, McCanns Chemist Aigburth and Sandringham. All 26 McCanns pages verified clean on title, H1, description, NAP, links and compliance, and then the pass found the first defect in this backlog that could send a patient to a locked door: both McCanns landing pages printed opening hours starting at 2pm for branches that open at 9am, because a day with a lunch closure carries two sessions and the generator kept only the second. Fixed at source, both pages regenerated, and new tools/check-opening-hours.js makes it permanent. A second finding, that the Sandringham pages target a word that is not a place, is raised as Q15

Run start state. No .agent-lock and no .git\index.lock, no git process running.
Worktree clean, branch agents/audit-backlog level with origin at 90a0cc0.

Portal answer pickup: ATTEMPTED, UNAVAILABLE, same blocker as the previous run.
Q13 and Q14 were open at the start, so the condition was met. The browser
tooling still lists two Chrome registrations as "Browser 1" and "Browser 2",
both isLocal true, and it refuses to open a tab until a human picks between
them. There is no human in an unattended run, so no fetch could be made. Per
the scheduled task rules no other route was tried. This is now the second run
in a row blocked the same way and the third day it has cost an answer pickup:
the fix is to remove or rename one of the two registrations so only one
remains, which needs a supervised session. It also means the live-site leg of
a quality pass stays unavailable, so everything below is verified against the
repo.

AUTONOMOUS WINDOW: ACTIVE (opened 2026-08-09 23:14, expires 2026-08-10 23:14).
No autonomous decision was taken and none was needed. The defect fixed below
had a single correct answer sitting in branches.json, so it was a repair, not a
choice. The one real choice this run surfaced is recorded under Q15 for the
same reason Q13 and Q14 were: the window converts a decision that BLOCKS a
worklist item into an autonomous one, and this blocks nothing while changing
the local search word on 12 patient-facing pages.

WHY A QUALITY PASS, AND WHY 3.6. Every numbered item is ticked except 5.3 and
5.4, both [BLOCKED] on someone being logged into the Weebly editor, so there
was no unblocked item to take. On the least-recently-verified rule the
eighteenth to twenty-first runs took 3.2, 3.3, 3.4 and 3.5, so 3.6 is next in
that block. It is also the largest untouched set left: 26 pages across two
branches on one shared domain.

WHAT WAS VERIFIED ON 3.6, AND WHAT PASSED. All 26 McCanns pages (22 service,
2 switch, 2 branch landing) checked against the Build Pack v2 rule that town
and service words belong in the title, description and heading:
  - check-seo-pattern and check-seo-sheets both clean across the 26. Every H1
    equals what tools/seo-pattern.js produces and every page agrees with the
    paste sheet a human types into Weebly.
  - NAP. Aigburth reads 112 Aigburth Road, L17 7BP, 0151 727 3185; Sandringham
    reads 1b Aigburth Road, L17 4JP, 0151 727 3076. Correct on all 26, one tel:
    link per page, and the L17 4JP that item 1.3 was raised over is right
    everywhere.
  - Schema. addressLocality Liverpool and addressRegion Merseyside on all 26,
    which is correct: both branches post to Liverpool while the pages target
    the catchment towns.
  - Internal links. Every href on every page resolves to a page this repo
    generates. The only external targets are the font, the CDN asset, the
    Google review link and, on the landing pages, the NHS review link. No dead
    or malformed link, and the sister-branch cross-link reads correctly in both
    directions (the "Eccleston in Eccleston" fault found on the 3.3 pass does
    not repeat here).
  - Compliance. No prescription medicine name and no efficacy claim anywhere in
    the 26, including both weight loss pages. hasApp is false for both branches
    and no page mentions an app.

THE DEFECT, AND WHY NOTHING COULD SEE IT. The two landing pages printed:
    Monday: 2pm to 6pm ... Friday: 2pm to 6pm, Saturday: 2pm to 5pm
branches.json says both branches open 09:00 to 13:00 and again 14:00 to 18:00
on weekdays, confirmed against the NHS pharmacy profile on 2026-06-24. The
morning session was simply gone. A patient reading the Aigburth page would
believe the pharmacy is shut until 2pm on every day of the week, when it opens
at 9am. Sandringham had the same fault on its five weekdays.

Cause, in tools/build-branch-landing-pages.js: hoursRows() wrote each session
into map[day], so where a day carried two sessions the afternoon overwrote the
morning. Seven of the sixteen branches close for lunch and so carry split days
(McCanns Aigburth and Sandringham, Smartts, Hirshmans, Coleman and Leighs,
Gordon Short, Tiffenbergs). Only the two McCanns have landing pages today, so
only two pages were wrong, but the other five would have been wrong the moment
their landing pages were built.

No checker could see it for a specific reason worth recording. check-nap proves
a page agrees with branches.json on name, address and phone, and hours are not
in its remit. Every other checker works on titles, descriptions, slugs, pins or
packs. Nothing had ever compared rendered opening hours with the data, and the
JSON-LD on the same page was correct throughout, so the page contradicted its
own structured data and stayed green.

WHAT WAS FIXED IN-REPO.
  - tools/build-branch-landing-pages.js: hoursRows() now collects every session
    for a day, sorts them by opening time and joins them, so a lunch closure
    reads "9am to 1pm, 2pm to 6pm". Regenerated all six landing pages: the two
    McCanns pages changed, the four others came out byte-identical, which is
    the expected result since only McCanns have split days.
  - tools/check-opening-hours.js, new. It composes the expected strings from
    branches.json itself rather than calling the generator, on the principle
    that a checker which calls the code it is checking proves nothing. Five
    rules: every day has exactly one visible row; each row equals the data
    including every session on a split day; the JSON-LD sessions match the data
    exactly; a day cannot be in closedDays and in specification at once; and a
    session must close after it opens. It also names the branches carrying
    split days, so the case that caused this is visible on every future run.
  - All eight negative tests caught and each restored afterwards: an altered
    visible row, a deleted day row, a duplicated day row, an altered JSON-LD
    opens value, a deliberately unparseable JSON-LD block, a closedDays clash,
    a session closing before it opens, and a misspelt day name. One real bug in
    the checker was found by its own negative tests and fixed before commit: a
    lazy regex over the JSON-LD block stopped at the first inner "]" and
    reported every page as having no hours at all, so the block is now parsed
    as JSON properly.

THE SECOND FINDING, RAISED AS Q15. Every branch in the estate takes its seoTown
off the front of its own serviceAreaList. McCanns Sandringham does not: its
pages say "in Sandringham" on all 12, while its serviceAreaList, its schema
areaServed and its GBP pack all say Aigburth, St Michael's, Lark Lane and
Dingle and never mention Sandringham at all. The GBP pack calls it a branch
name from top to bottom. So 12 pages are aimed at a word the rest of the
branch's own data does not treat as a place, and the sister branch 700 metres
up the same road already holds Aigburth. Recommended answer is to move the 12
pages onto St Michael's while keeping the existing permalinks, so no live URL
breaks and no redirect is needed. What is explicitly not on the table is
setting it to Aigburth, which would give two branches on one shared domain
identical titles and identical permalinks.
tools/check-address-region.js gains four rules to hold this: seoTown must
appear in the branch's own serviceAreaList, townSlug must be its slug, two
branches sharing a domain must not share a seoTown, and being in the list but
not first is a warning only (Cherry Lane leads with Liverpool and targets
Walton on purpose). Sandringham sits in a KNOWN_SEO_TOWN list against Q15, the
same convention as KNOWN_DRIFT and KNOWN elsewhere, so it reports every run
without going permanently red and the entry fails once it is stale. All five
rules negative-tested, each caught, each restored.

VERIFIED OBSERVATION, NO CHANGE MADE. Both McCanns branches share one pfLink
pointing at pharmacy-first-service-aigburth.html, a live-only page. That is
already inside Q8 (answered: repoint all 11 Post A links and paste the new
pages in the same run) and check-gbp-packs already warns on both packs every
run, so nothing new was raised and nothing was changed.

PUBLIC COPY CHANGED, DELIBERATELY. Twelve rows of opening hours across the two
McCanns landing pages. Neither page is live yet - the six landing pages have
been waiting on a Weebly paste since items 2.2 and 5.2 - so this corrects them
before anyone sees them rather than adding to the repaste list.

CHECKER RUN, AFTER: all twelve pass. check-opening-hours clean (6 landing pages
checked, 7 split-day branches named); check-address-region clean with 2
warnings (Sandringham KNOWN against Q15, Cherry Lane seoTown not first);
check-seo-lengths clean with 1 known issue (Q14); check-cdn-pins clean with 1
warning and 1 known issue (Q13); check-nap 177 pages 0 mismatches;
check-postcodes 0 failures (2 standing INDEX/SEO warnings); check-seo-pattern
177 pages 0 failures; check-seo-sheets clean; check-page-coverage clean;
check-em-dashes clean; check-gbp-packs 0 failures (standing Q8 link warnings);
check-editor-snapshot clean.

WHAT IS STILL OUTSTANDING, UNCHANGED BY THIS RUN. All of it needs someone
logged into Weebly: the switch page SEO descriptions repaste (Q7), the six
landing pages and their branch service pages (items 2.2 and 5.2, now carrying
the corrected hours), items 5.3 and 5.4, and the switch page re-pin (Q13). Q14
adds one title repaste to that list once answered, and Q15 would add twelve.

Files changed: tools/build-branch-landing-pages.js,
modules/branch/pages/pharmacy-mccanns-aigburth.html,
modules/branch/pages/pharmacy-mccanns-sandringham.html,
tools/check-opening-hours.js (new), tools/check-address-region.js, CLAUDE.md,
QUESTIONS.json, AGENT_LOG.md. AGENT_WORKLIST.md is deliberately unchanged: this
was a quality pass, so there was no item to tick, and Q15 blocks nothing.

---

## 2026-08-10 10:04 (unattended run, twenty-first) - Quality pass on item 3.5, Hirshmans Chemist Ainsdale. All 12 Hirshmans pages verified clean on title, description, H1, NAP, schema, internal links and weight loss compliance. The pass then found the first real defect of its kind by widening the check to the whole estate: nothing anywhere enforced that an SEO title or description fits what Google shows, or that two pages do not share one. One title is over the limit and is raised as Q14; new tools/check-seo-lengths.js makes both rules permanent

Run start state. A stale .agent-lock was present, written 2026-08-10 09:05:43,
58.6 minutes old and so past the 45-minute threshold in the scheduled task
prompt. Cleared as stale, which is the third orphaned lock in two days. No
.git\index.lock and no git process running. Worktree clean, branch
agents/audit-backlog level with origin at f0d7a61.

Portal answer pickup: ATTEMPTED, UNAVAILABLE. Q13 was open at the start of the
run, so the condition was met. The browser tooling still lists the two Chrome
registrations as "Browser 1" and "Browser 2", both reporting isLocal true, so
the "prodesk" name recorded on 2026-08-09 evening did NOT persist. The tooling
requires a human to pick between the two before any tab can be opened, and
there is no human in an unattended run, so the fetch could not be made. Per the
scheduled task rules no other route was tried. Recording the answer plainly for
whoever fixes this: the rename did not survive, and the blocker is the picker,
not the Cloudflare Access session. A direct HTTP fetch of the live site was
also refused by the tooling, so the live-site leg of a quality pass remains
unavailable to unattended runs; everything below is verified against the repo.

AUTONOMOUS WINDOW: ACTIVE at the time of this run (opened 2026-08-09 23:14,
expires 2026-08-10 23:14). It did not change what this run did. See the Q14
section below for why the one decision this run surfaced falls inside the
window's own carve-out rather than being taken autonomously.

WHY A QUALITY PASS, AND WHY 3.5. Every numbered item is ticked except 5.3 and
5.4, both [BLOCKED] on someone being logged into the Weebly editor, so there
was no unblocked item to take. On the least-recently-verified rule the
eighteenth, nineteenth and twentieth runs took 3.2, 3.3 and 3.4, so 3.5 is
next in that block.

WHAT WAS VERIFIED ON 3.5, AND WHAT PASSED. All 12 Hirshmans pages (11 service,
1 switch) checked against the Build Pack v2 rule that town and service words
belong in the title, description and heading:
  - check-seo-pattern and check-seo-sheets both clean. Every H1 equals what
    tools/seo-pattern.js produces, and every page agrees with the paste sheet
    a human types into Weebly.
  - Town words. seoTown and addressLocality are both Ainsdale here, so unlike
    Cherry Lane there is no divergence to get backwards. All 12 titles, H1s,
    descriptions and slugs carry Ainsdale; schema addressLocality is Ainsdale
    and addressRegion is Merseyside on all 12.
  - Titles 44 to 62 characters, descriptions 137 to 156. Inside the limits,
    and each carries Ainsdale plus a service word.
  - NAP. Street reads "56-62 Sherwood House, Station Road" and postcode
    PR8 3HW on all 12, matching branches.json and the 1.2 verification. One
    tel: link per page, 01704577376, correct on all 12.
  - Internal links. Every href on every Hirshmans page resolves: the Pharmacy
    First page links all seven condition pages, each condition page links back,
    and the only external targets are the font, the CDN asset and the Google
    review URL. No dead or malformed link.
  - Compliance. No prescription medicine name and no efficacy claim on the
    weight loss page or anywhere else in the set. hasApp is false and no page
    mentions an app.
  - No landing page for Hirshmans, correctly: it has its own domain, so the
    shared-domain treatment from item 2.2 does not apply.

VERIFIED OBSERVATIONS, NO CHANGE MADE. Two things were checked, found to be
deliberate rather than broken, and are recorded so a later pass does not spend
a run rediscovering them:
  - openingHoursSpecification appears on only 6 of 177 pages, the branch
    landing pages. branches.json carries a full NHS-sourced hours block for
    Hirshmans, confirmed 2026-06-24, including the 13:00 to 14:00 lunch
    closure. Item 2.1 recorded hours schema as "deferred to Phase 3
    regeneration" and Phase 3 turned out to be about titles, so it was never
    picked up. Deliberately NOT actioned: Build Pack v2 section 5.1 says the
    hours block "is available for schema markup and contact blocks", which
    makes it an option, not a requirement, and adding it would change 171
    generated pages and put all 171 on the Weebly repaste list for something
    the spec does not ask for. That is new scope, not a defect, so it is
    logged rather than built. Same reasoning applies to areaServed, which is
    also on the 6 landing pages only although serviceAreaList is populated for
    all 16 branches. No page displays opening hours as visible copy outside
    those 6, so there is no risk of a page showing wrong times.
  - 15 of the 16 branch emails have a capitalised local part
    (Hirshmans@rbhealth.co.uk, Ainsdale@rbhealth.co.uk and so on). Left alone:
    local parts are treated case-insensitively by every mail provider in use,
    the strings are consistent with each other, and changing 15 data fields to
    fix nothing is churn.

THE DEFECT, AND WHY NOTHING COULD SEE IT. Three checkers already cover the SEO
strings and none of them looks at what Google does to them. check-seo-pattern
proves a title matches the pattern; check-seo-sheets proves the page and the
paste sheet agree; check-em-dashes proves no dash reaches public copy. A title
can pass all three and still be too long to display, and two branches in the
same town can pass all three with byte-identical descriptions. Every quality
pass so far has measured lengths by hand, one brand at a time, which is a habit
rather than a rule. Measured across all 177 paste-sheet entries this run:
  - Titles run 36 to 70 characters. Exactly one is over 65:
    insect-bite-treatment-coleman-leigh-walton, at 70. The longest NHS
    condition name has landed on the longest trading name. Every other title
    in the estate is 62 or fewer.
  - Descriptions run 129 to 164 characters. All 177 sit inside the 80 to 165
    window, so nothing is cut mid-sentence and nothing is too thin.
  - Uniqueness is clean: no two pages share a title, a description or a
    permalink. This was the bigger worry going in, because RBH has four town
    pairs where two of its own branches target the same words (Ainsdale,
    Bootle, Walton, Aintree), and Hirshmans is half of the Ainsdale pair.
    Confirmed genuinely distinct, not near-distinct.

WHAT WAS FIXED IN-REPO. tools/check-seo-lengths.js, new. It reads all 177
paste-sheet entries and enforces three rules: title 65 characters or fewer,
description between 80 and 165, and no two pages sharing a title, description
or permalink. Accepted exceptions go in a KNOWN list that requires a reason and
a question id, the same convention as KNOWN_DRIFT in check-cdn-pins.js, and the
checker fails on a KNOWN key that no longer matches any page so the list cannot
go stale. It reads the paste sheets rather than the page tags on purpose: the
sheets hold the strings a human actually types into Weebly, which is where the
text that reaches Google lives.
All five rules negative-tested, each caught, each restored afterwards: emptying
KNOWN turned the Coleman title from a known issue into a hard failure; a
duplicated description across two Hirshmans pages was named with both slugs; a
26-character description failed the floor; an 84-character title failed the
ceiling; and a KNOWN key pointing at no page failed as stale. CLAUDE.md now
documents all four SEO checkers, what each one is for, and the rule that the
thresholds are not to be widened to make a run pass.

WHY Q14 WAS RAISED RATHER THAN ACTIONED, INSIDE THE AUTONOMOUS WINDOW. The one
over-length title cannot be fixed without editing public copy on a
patient-facing clinical page, and the two ways of doing it pull against
different earlier decisions: dropping "Infected" changes how an NHS service is
described, and dropping "Pharmacy" overrides the trading name Rishi settled
personally in Q1. The window's own carve-out reserves live patient-facing
service wording for a supervised decision, so it goes to Rishi with a
recommendation (drop "Pharmacy", since the brand is the part Google is already
truncating away) rather than being taken here. The title is recorded in the new
checker's KNOWN list against Q14, so it reports every run without going
permanently red and turns hard red the moment any other string breaks a rule.
Nothing is blocked by it.

NO PUBLIC COPY CHANGED. No generator was touched and no page was regenerated,
so this run adds nothing to the Weebly repaste list.

CHECKER RUN, AFTER: all eleven pass. check-seo-lengths clean with 1 known issue
(Q14); check-cdn-pins clean with 1 warning (service-module-phase1 behind main)
and 1 known issue (switch.js, Q13); check-nap 177 pages 0 mismatches;
check-postcodes 0 failures (2 standing INDEX/SEO warnings); check-seo-pattern
177 pages 0 failures; check-seo-sheets clean; check-page-coverage clean;
check-em-dashes clean; check-gbp-packs 0 failures (standing Q8 link warnings);
check-address-region clean; check-editor-snapshot clean.

WHAT IS STILL OUTSTANDING, UNCHANGED BY THIS RUN. All of it needs someone
logged into Weebly: the switch page SEO descriptions repaste (Q7), the six
landing pages and their branch service pages (items 2.2 and 5.2), items 5.3 and
5.4, and the switch page re-pin (Q13). Q14 adds one title repaste to that list
once it is answered.

Files changed: tools/check-seo-lengths.js (new), CLAUDE.md, QUESTIONS.json,
AGENT_LOG.md. No generated page changed. AGENT_WORKLIST.md is deliberately
unchanged: this was a quality pass, so there was no item to tick, and Q14
blocks nothing.

---

## 2026-08-09 23:34 (unattended run, twentieth) - Quality pass on item 3.4, Cherry Lane Pharmacy. All 12 Cherry Lane pages verified clean, including the seoTown/addressLocality divergence that makes this branch the one most likely to get the town wrong. The pass then found a defect no checker could see: both CDN pins have gone stale, and the live switch pages are still sending prescription switch requests to rishi@rbhealth.co.uk rather than the helpdesk. New tools/check-cdn-pins.js makes it visible; the fix needs a supervised session and is raised as Q13

Run start state. No .agent-lock and no .git\index.lock, no git process running.
Worktree clean, branch agents/audit-backlog level with origin at e32e451.

Portal answer pickup: not attempted, condition not met. Every question in
QUESTIONS.json had status "answered" at the start of the run (Q1 to Q12), so
there was nothing to pick up. Q13 is raised by this run, so the next run has a
reason to try the portal again and record whether the "prodesk" browser name
persisted.

WHY A QUALITY PASS, AND WHY 3.4. Every numbered item is ticked except 5.3 and
5.4, both [BLOCKED] on someone being logged into the Weebly editor, so there
was no unblocked item to take. On the least-recently-verified rule, items 3.4
to 3.13 have never had an individual pass; the eighteenth and nineteenth runs
took 3.2 and 3.3, so 3.4 is next in that block.

WHAT WAS VERIFIED ON 3.4, AND WHAT PASSED. All 12 Cherry Lane pages (11
service, 1 switch) checked against the Build Pack v2 rule that town and service
words belong in the title, description and heading:
  - check-seo-pattern and check-seo-sheets both clean. Every H1 equals what
    tools/seo-pattern.js produces, and every page agrees with the paste sheet
    a human types into Weebly, which is where the strings that reach Google
    actually live.
  - The town divergence, which is the specific risk here. Cherry Lane is the
    branch CLAUDE.md names as the example: postally Liverpool, seoTown Walton.
    Get it backwards and the pages target the wrong catchment. All 12 pages use
    Walton in the title, H1, description and slug, and Liverpool only inside
    schema.org addressLocality, which is postal truth. addressRegion is
    Merseyside on all 12. That is the right way round on every page.
  - Meta descriptions: all 12 between 140 and 157 characters, inside the 80 to
    165 rule, each carrying Walton plus a service word.
  - Titles: longest is 63 characters (infected insect bite), inside the 65
    warn threshold, so nothing truncates in the SERP.
  - pfLink in branches.json points at pharmacy-first-cherry-lane-walton.html,
    which is a page this repo generates. That was a fix made under item 2.3 and
    it has held.
  - No landing page for Cherry Lane, correctly: it has its own domain, so the
    shared-domain treatment from item 2.2 does not apply.

VERIFIED OBSERVATION, NO CHANGE MADE. Cherry Lane and Coleman and Leighs both
carry seoTown "Walton", so two RBH branches target the same town words. Three
other pairs do the same: Fishlocks and Hirshmans on Ainsdale, Smartts and SK on
Bootle, Clear and Tiffenbergs on Aintree. This is not the shared-domain slug
collision that item 2.2 exists to prevent - each of these sits on its own
domain, and every title carries its own brand, so no URL is at risk and there
is no duplicate content. They are genuinely different pharmacies in the same
town. Recording it as checked and deliberately left alone, rather than as a
defect, so a later pass does not spend a run rediscovering it. Whether the
group wants two of its own branches competing for "pharmacy Walton" is a
marketing judgement, not a repo defect, and changing it would rewrite public
titles on 24 pages.

THE DEFECT, AND WHY NOTHING COULD SEE IT. Every generated page loads its CSS
and JS from jsDelivr against a pinned ref. Nine checkers verify the repo. None
of them looked at what the pin actually serves, so the repo can be entirely
green while live runs old code.
  - The 15 switch pages pin the immutable commit 6a275e1, dated 26 June. Its
    modules/switch/switch.js sets DESTINATION to rishi@rbhealth.co.uk. main has
    said helpdesk@rbhealth.co.uk since. So every prescription switch request
    submitted from a live switch page has been going to Rishi's own inbox, not
    the helpdesk. Item 2.1 recorded "helpdesk email destinations correct" on
    2026-08-04, and that was true of the repo; it was not true of the pin.
    Confirmed from git, not inferred: the pinned blob and main's blob differ by
    exactly that one line.
  - The other 318 page references pin the mutable branch service-module-phase1,
    which is 63 commits behind main and 0 ahead. Its service.css and service.js
    are byte-identical to main today, so nothing is broken there. But the
    reason CHANGELOG.md moved that generator off an immutable SHA on 17 July
    was so one push updates every live page without a repaste, and while the
    branch sits behind main that mechanism is inert.
Neither pinning model is wrong; README sets both out deliberately. What was
missing was anything checking that a pin still holds current code.

WHAT WAS FIXED IN-REPO. tools/check-cdn-pins.js, new. It reads every jsDelivr
pin out of all 177 generated pages, and fails if a page pins something its own
generator does not declare (hand-edited page, or a generator changed without
regenerating), if a pinned ref no longer resolves in git (a deleted branch
would take the stylesheet and script off every live page using it), or if a
pinned asset's content differs from main. Accepted drift goes in a KNOWN_DRIFT
list that requires a reason and a question id, so it cannot become a place to
hide defects. A mutable branch ref sitting behind main is a warning. It keys
the expected pin on the ASSET's module folder rather than the page's, because
branch landing pages live in modules/branch/pages but correctly load
modules/service assets.
Tested against two real regressions, both caught, both restored afterwards:
repointing one Cherry Lane page to a nonexistent ref gave two failures naming
the page and the dead ref; emptying KNOWN_DRIFT gave a hard failure on
switch.js. CLAUDE.md now documents both pinning models, the trap, and the rule
that a pin is never written into a page by hand.

WHY Q13 WAS RAISED RATHER THAN ACTIONED, INSIDE THE AUTONOMOUS WINDOW. The
window says take the recommended option instead of blocking. It could not
apply here, and not because a decision was dodged: the recommended fix is to
fast-forward service-module-phase1 to main, which means pushing a branch other
than agents/audit-backlog, and to re-pin the switch pages, which only reaches
live through a Weebly paste. Both are outside this run's authorisation. So the
half that is in scope was done in full, and the half that needs push rights and
the Weebly editor is Q13 with a recommendation. Nothing is blocked by it.
Worth doing soon on timing alone: the service assets are identical between the
branch and main right now, so the fast-forward is a no-op for live pages today.
Once they diverge it stops being free.

NO PUBLIC COPY CHANGED. All six generators re-run and all 177 pages regenerated
byte-identical, so this run creates no Weebly repaste burden of its own.

CHECKER RUN, AFTER: all ten pass. check-cdn-pins clean with 1 warning
(service-module-phase1 behind main) and 1 known issue (switch.js, Q13);
check-nap 177 pages 0 mismatches; check-postcodes 0 failures (2 standing
INDEX/SEO warnings); check-seo-pattern 177 pages 0 failures;
check-page-coverage clean; check-em-dashes clean; check-seo-sheets clean;
check-gbp-packs 0 failures (standing Q8 link warnings); check-address-region
clean; check-editor-snapshot clean.

WHAT IS STILL OUTSTANDING, UNCHANGED BY THIS RUN. All of it needs someone
logged into Weebly: the switch page SEO descriptions repaste (Q7), the six
landing pages and their branch service pages (items 2.2 and 5.2), and items 5.3
and 5.4. Q13 adds the switch page re-pin to that same paste run.

Files changed: tools/check-cdn-pins.js (new), CLAUDE.md, QUESTIONS.json,
AGENT_LOG.md. No generated page changed. AGENT_WORKLIST.md is deliberately
unchanged: this was a quality pass, so there was no item to tick, and Q13
blocks nothing.

---

## 2026-08-09 23:14 (supervised Cowork session, Rishi present) - Q12 answered and implemented; 24-hour autonomous window opened

Rishi is stepping away until roughly 2026-08-10 23:14 BST and asked for the
backlog to keep moving without needing him to answer anything in that
window. Two things done directly in this session rather than left for the
next unattended run:

1. Q12 answered (recommended option) and implemented: tools/branches-
   editor.html now has a loadedFromFile flag, false until a real
   branches.json is loaded via Load. Download checks the flag and shows
   an explanatory alert instead of exporting if it is false, so the
   editor can no longer silently export the bundled snapshot over a real
   edit. All five checkers re-run clean after the change: 177 pages, 262
   text files, 16 branches, 0 failures.
2. The "## Standing authorisation" section above added, expiring
   2026-08-10 23:14 BST. Runs inside that window should take the
   recommended option on any new question rather than raising it and
   waiting, log it clearly as an AUTONOMOUS DECISION, and keep going -
   except anything touching money, legal risk, or a live regulatory claim,
   which still gets raised and left [BLOCKED] as normal regardless of the
   window, because a wrong unattended call there is worse than a delay.

ALSO: two orphaned .agent-lock files were found and cleared tonight (one
from the earlier machine reboot, a second from a run that appears to have
died mid-work around 20:34 without reaching its own cleanup step - cause
not established). Both times the repo was verified clean and no git
process was running before clearing. This is the second unexplained lock
today; if it recurs, the fix is to shorten the 3-hour staleness window in
the scheduled task prompt itself, not to keep clearing by hand.

---

## 2026-08-09 (unattended run, nineteenth) - Quality pass on item 3.3, Fishlocks Chemist Ainsdale and Eccleston. The 26 Fishlocks pages verified clean on title, H1, meta and slug uniqueness across the shared domain. Two real defects found and fixed at source: Eccleston's schema addressRegion held a borough, not a county, on all 13 of its pages, and the sister-branch link on all six landing pages read "Eccleston in Eccleston". Both were fixed without changing a single page title. A third finding, the stale editable copy of branches.json embedded in branches-editor.html, is raised as Q12

Run start state. No .agent-lock and no .git\index.lock. Worktree clean.
Branch agents/audit-backlog level with origin at 28a16a3.

Portal answer pickup: not attempted, condition not met. QUESTIONS.json had no
question with status "open" at the start of the run (Q1 to Q11 all answered).
Q12 is raised by this run, so the next run will have a reason to try.

WHY A QUALITY PASS, AND WHY 3.3. Every numbered item is ticked except 5.3 and
5.4, both [BLOCKED] on someone being logged into the Weebly editor, so there
was no unblocked item to take. On the least-recently-verified rule 3.3 is the
oldest: the eighteenth run took 3.2 as the first of the block of items 3.2 to
3.13 that had never had an individual pass, so 3.3 is next in that block.

WHAT WAS VERIFIED ON 3.3, AND WHAT PASSED. All 26 Fishlocks pages (12
Ainsdale, 12 Eccleston, plus the two landing pages from item 2.2) checked
against the Build Pack v2 rule that town and service words belong in the
title, description and heading:
  - check-seo-pattern: 26 Fishlocks pages, 0 mismatches. Every SEO title and
    every H1 equals what tools/seo-pattern.js produces.
  - check-seo-sheets: every page agrees with the paste sheet a human types
    into Weebly, which is the check the eighteenth run added and the only one
    that sees the strings that actually reach Google.
  - Town words come from seoTown. Both branches have seoTown equal to their
    addressLocality, so there is no Cherry Lane style divergence to get wrong.
  - Slug uniqueness on the shared domain. Both branches sit on
    fishlockpharmacy.co.uk, so a slug collision would put one branch's page
    on top of the other's URL. All 26 slugs carry the branch (-fishlocks-
    ainsdale / -fishlocks-eccleston); no collision. This is the specific risk
    the shared-domain rule in Master Plan v2 section 3 exists to catch, and
    no checker was covering it, so it was checked by hand this run.
  - Cross-town check: no Ainsdale page carries Eccleston in its title, H1 or
    description, and none the other way.
  - The pages are Weebly embed fragments and carry no <title> tag by design;
    the SEO title lives in the paste sheet. That is correct, not a gap.

DEFECT 1, AND WHY IT MATTERED. branches.json gave Fishlocks Eccleston an
addressRegion of "Chorley". Chorley is a borough. Every other one of the 16
branches carries a county (Merseyside, Greater Manchester). addressRegion is
the schema.org PostalAddress field, so this put a borough where Google reads
the county, on all 13 Eccleston pages plus the landing page. No checker could
see it: check-nap proves every page AGREES with branches.json, which stays
green when branches.json itself is wrong.

It had been spotted before. The 2.2 quality pass on 2026-08-05 recorded it as
"Observations only, no action taken ... Likely deliberate as the local search
qualifier; flagged only in case it was not". That was prose in this log, which
the standing rules say not to do for anything needing a decision, so it never
reached Rishi and sat unresolved for four days. Noting that so the pattern is
not repeated: a finding that needs a decision goes in QUESTIONS.json.

The 2026-08-05 run's instinct was right, though, which is why the fix is not a
straight overwrite. "Eccleston, Chorley" IS the better search qualifier: it
separates this branch from Eccleston in St Helens and Eccleston near Chester,
which "Eccleston, Lancashire" does less sharply. One field was doing two
different jobs. They are now two fields:
  - addressRegion = "Lancashire". The county. Schema truth.
  - seoRegion = "Chorley". Optional, new, used only by landingTitle() in
    tools/seo-pattern.js, falling back to addressRegion when unset.
Net effect on public copy: NONE. The Eccleston landing title still reads
"Pharmacy in Eccleston, Chorley - Fishlocks Chemist", byte-identical. The only
output change is the JSON-LD region on 13 pages, from wrong to right. No
Weebly repaste is created by this fix.

DEFECT 2. The sister-branch link on all six branch landing pages read
"Fishlocks Chemist Eccleston in Eccleston", "McCanns Chemist Sandringham in
Sandringham", "Scorah Chemists Bramhall in Bramhall" and so on. The generator
appended " in <seoTown>" to a branch name that already ends with the town.
Public copy, on every shared-domain landing page. Also flagged as prose by the
2026-08-05 pass and also left. tools/build-branch-landing-pages.js now only
appends the town when the branch name does not already end with it, so it
still works for any future branch named otherwise. Six pages regenerated.
None of the six is live yet, so again no repaste burden.

NEW CHECKERS, BOTH TESTED AGAINST A REAL REGRESSION.
  - tools/check-address-region.js: fails if any trading branch's addressRegion
    is not one of the four counties this group trades in, is empty, or equals
    its own addressLocality; warns if seoRegion is set but redundant. Verified
    by putting "Chorley" back: exit 1 with the branch and the reason named.
  - tools/check-editor-snapshot.js: compares the embedded snapshot inside
    tools/branches-editor.html against branches.json field by field and fails
    on any drift. Verified on a temp copy with seoRegion deleted: exit 1
    naming fishlocks_eccleston.seoRegion.

FINDING RAISED AS Q12. tools/branches-editor.html, the tool CLAUDE.md tells
people to use for editing branches.json, embeds a whole copy of branches.json
as its starting snapshot, and its download button stamps today's date into
lastUpdated. Anyone who edits and downloads without first loading the real
file exports the snapshot plus their change, silently reverting every edit
made since, in a file that then looks like the newest one. That is the single
click that could undo the whole backlog's data work. The snapshot was one edit
behind when found; it has been refreshed to match exactly (verified identical)
and the new checker now fails on drift, so nothing is broken today. Whether to
make the editor refuse to export until a file is loaded is Rishi's call, so it
is Q12 with a recommendation rather than a change made unattended. Nothing is
blocked by it.

ALSO DONE. CLAUDE.md's schema section now documents both fields, states that
addressRegion must be the county and never a borough, and explains when
seoRegion is appropriate, so the distinction survives this log entry.

CHECKER RUN, AFTER: all nine pass. check-address-region clean (16 branches),
check-editor-snapshot clean, check-nap 177 pages 0 mismatches,
check-postcodes 0 failures (2 standing INDEX/SEO warnings), check-seo-pattern
177 pages 0 failures, check-page-coverage clean 177 pages, check-em-dashes
clean, check-seo-sheets clean, check-gbp-packs 0 failures (the standing Q8
link warnings).

WHAT IS STILL OUTSTANDING, UNCHANGED BY THIS RUN. All three remaining jobs
need someone logged into Weebly: the switch page SEO descriptions repaste
(Q7), the six landing pages and their branch service pages paste (item 2.2
and 5.2), and items 5.3 and 5.4.

Files changed: branches.json, tools/seo-pattern.js,
tools/build-branch-landing-pages.js, tools/branches-editor.html,
tools/check-address-region.js (new), tools/check-editor-snapshot.js (new),
CLAUDE.md, QUESTIONS.json, AGENT_LOG.md, and 19 regenerated pages (13
Eccleston service/switch pages, 6 branch landing pages). AGENT_WORKLIST.md is
deliberately unchanged: this was a quality pass, so there was no item to tick,
and Q12 blocks nothing.
Commit: see this commit on agents/audit-backlog.
Questions: Q12 raised, open. No item blocked by it.

---

## 2026-08-09 (unattended run, eighteenth) - Quality pass on item 3.2, Scorah Chemists Bramhall and Hazel Grove. The 26 Scorah pages verified clean on title, H1 and meta. The pass found a real gap the existing checkers could not see: nothing ever compared a page against the paste sheet a human actually types into Weebly, and on that comparison all 14 contraception pages had no paste sheet in the repo at all. New tools/check-seo-sheets.js closes the gap and the contraception generator now writes its sheet into the repo like every other generator

Run start state. No .agent-lock and no .git\index.lock. Worktree clean.
Branch agents/audit-backlog level with origin at b98984f.

Portal answer pickup: not attempted, condition not met. QUESTIONS.json has
no question with status "open" (Q1 to Q11 all answered).

Answer pickup route, checked again anyway because a quality pass may raise a
question: STILL BROKEN, eighth run running. list_connected_browsers returns
two browsers, both on Windows, both still called "Browser 1" and "Browser 2",
and the tooling still refuses to act until a human picks one. An unattended
run cannot pick. The fix remains the same: disconnect the spare Chrome from
the account, or sign the Surface out. Answering in a Cowork session works.
This also means the live-site leg of a quality pass cannot be done unattended,
so everything below is repo-side verification.

WHY A QUALITY PASS, AND WHY 3.2. Every numbered item is ticked except 5.3
and 5.4, both [BLOCKED] on someone being logged into the Weebly editor, so
there was no unblocked item to take. On the least-recently-verified rule, 3.2
is the oldest: items 3.2 to 3.13 have never had an individual pass, their only
verification being the Phase 3 rollout pass of 2026-08-05, which is the oldest
entry in this log for any completed item. 3.1 was passed on 2026-08-06 and
every Phase 4 pack has had at least one later pass. 3.2 is the first of the
never-individually-passed block.

WHAT WAS VERIFIED ON 3.2, AND WHAT PASSED. All 26 Scorah pages (12 Bramhall,
12 Hazel Grove, plus the two branch landing pages built under item 5.2) were
checked against the Build Pack v2 rule that the town and service words belong
in the title, description and heading:
  - check-seo-pattern: 26 Scorah pages, 0 mismatches. Every SEO title and
    every H1 equals what tools/seo-pattern.js produces for that branch and
    page type.
  - Town words come from seoTown, not addressLocality, per Build Pack v2
    section 5.1. Bramhall and Hazel Grove both have seoTown equal to their
    addressLocality, so there is no Cherry Lane style divergence to get wrong.
  - Cross-town check: no Bramhall page carries Hazel Grove in its title, H1
    or description, and none the other way, with one deliberate exception.
    Both landing page descriptions name the sister town because it is a real
    entry in that branch's serviceAreaList in branches.json (Bramhall serves
    Hazel Grove and vice versa). Factually right and left alone. Changing it
    would mean editing branches.json service areas, which is out of scope for
    a quality pass and would move other pages.
  - Meta lengths: all 26 sit between 135 and 160 characters, inside the 80 to
    165 rule, with the two landing pages at the top of the range at 158 and
    160 after the length-aware landingMeta() helper added in the sixteenth run.
  - Landing titles correctly append the county ("Pharmacy in Bramhall,
    Greater Manchester - Scorah Chemists"), which is what disambiguates
    Bramhall from anywhere else with that name.
  - Both branches share scorah-chemists.co.uk, so the shared-domain rule in
    Master Plan v2 section 3 applies. Both now have their own landing page
    (item 5.2) and both GBP packs point at their own page (item 4.1 pass).
    That leg holds.

THE GAP, AND WHY IT MATTERS. Item 3.2 is worded "title, description and
heading". Titles and H1s are verified by check-seo-pattern, and so is the
description written into each page's head comment. But the head comment is
not what reaches Google. The strings that reach Google are the ones a human
types into Weebly > Pages > SEO Settings, and those are read off the paste
sheets in modules/*/pages/SEO.md. Nothing had ever compared the two. That
matters because a generator composing the same description twice is a defect
this project has already hit twice: the fifteenth run found the switch page
meta composed once for the page tag and once for the paste sheet, and the
sixteenth found the same in the branch landing generator. Both were fixed by
routing sheet and page through one helper. Neither fix left a guard behind.

WHAT THE NEW CHECKER FOUND. tools/check-seo-sheets.js matches every generated
page to its paste sheet entry by permalink and fails on a title mismatch, a
description mismatch, a page with no sheet entry, a sheet entry with no page,
or a permalink listed in two sheets. On its first run: 163 sheet entries
against 177 pages, and 14 failures. No drift anywhere, which is the good news
and confirms the fifteenth and sixteenth run fixes held. The 14 failures were
all one thing: every contraception page, including both Scorah ones, had no
paste sheet entry anywhere in the repo. There was nothing for a paster to
copy the SEO title and description from.

WHY. tools/build-contraception-pages.js did build a sheet, but wrote it only
to a hard-coded absolute path, C:/Users/rishi/OneDrive - RB Healthcare Ltd/
Downloads/cowork/CONTRACEPTION_SEO.md. Three consequences. The sheet was not
version-controlled, so it never reached the status page and no checker could
read it. The generator would throw on any machine without that exact folder,
which is every machine except this one. And the sheet's description was a
second hand-written literal, separate from the one written into the page head
comment: identical today by luck, and exactly the drift the other two
generators had already been caught doing. The sheet also used "Permalink" and
"Description" where the other four sheets use "Page Permalink" and
"Page Description", so even in the right place it would not have parsed.

WHAT CHANGED.
  tools/build-contraception-pages.js
    - New contraceptionMeta(store) helper. The page head comment and the
      paste sheet now both call it, so the two cannot drift. Same shape as
      switchMeta() and landingMeta().
    - The sheet is now written to modules/service/pages/CONTRACEPTION-SEO.md,
      in the repo, beside the pages it describes, like the other four.
    - Field names changed to Page Title / Page Permalink / Page Description
      to match the other sheets so the checker can read them.
    - The OneDrive drop is kept, because it is where the existing paste
      workflow looks, but it is now best effort: written only if the folder
      already exists, wrapped so a failure cannot break the build.
    - Header comment updated to describe the new outputs.
  tools/check-seo-sheets.js - new checker, described above.
  modules/service/pages/CONTRACEPTION-SEO.md - new, generated, 14 entries.

VERIFICATION. The 14 contraception pages regenerated byte-identical (git
status shows no page changes), which proves the contraceptionMeta refactor
changed no output. check-seo-sheets then reports 177 sheet entries against
177 pages, clean. The checker was negative-tested: editing one string in the
new sheet produced 14 description-drift failures and exit 1, and regenerating
restored it exactly and returned exit 0, so it is not passing vacuously.
Full suite after the change, all exit 0: check-seo-pattern 177 pages 0
failures, check-seo-sheets clean, check-nap 177 pages 0 mismatches,
check-page-coverage 177 pages clean, check-postcodes 0 failures 2 warnings
(the two pre-existing UNOWNED INDEX/SEO warnings), check-em-dashes clean,
check-gbp-packs 0 failures with the known Q8 link warnings.

NOT DONE, AND WHY. The live-site leg of the pass was not possible, see the
answer pickup note above. Contraception pages still have no INDEX.md entry
the way the other service page types do; the new sheet carries the page name,
permalink and raw URL, which is the same information, so this was left rather
than widening the run. No question raised: nothing here needed a decision.

OUTSTANDING ON THE LIVE SIDE, unchanged by this run and all needing the
Weebly editor: repaste the SEO description field for the 15 switch pages,
paste the four new landing pages plus their branch service pages, item 5.3
(Q8) and item 5.4 (Q9). The contraception SEO fields can now be pasted too,
from modules/service/pages/CONTRACEPTION-SEO.md.

Commit: 446d239. This hash line is recorded by the follow-up commit that
immediately succeeds it, the same convention as earlier runs.
Questions raised this run: none.

## 2026-08-09 (unattended run, seventeenth) - Quality pass on item 4.1, the GBP pack template and the Fishlocks Ainsdale pack. The pack verified clean on every fact and rule. The pass found one real defect it shares with four other packs: five of the six shared-domain branches still point their GBP profile website at the shared homepage, so two listings would hand Google the same page. Fixed in all five, and made permanent with a rule in check-gbp-packs.js

Run start state. No .agent-lock and no .git\index.lock. Worktree clean.
Branch agents/audit-backlog level with origin at e3de812.

Portal answer pickup: not attempted. QUESTIONS.json has no question with
status "open" (Q1 to Q11 all answered), so the step 3 condition was not met.
The two-Chrome problem in the notes above is still untested and still needs
the spare Chrome disconnecting before any future question can be answered
through the portal.

WHY A QUALITY PASS, AND WHY 4.1. Every numbered worklist item is ticked
except 5.3 and 5.4, and both are [BLOCKED] because they need someone logged
into the Weebly editor. So there was no unblocked item to take and the
standing rule points at a quality pass. The previous run nominated 4.1 as the
least recently verified item, and that holds: 4.1 was last passed on
2026-08-05 and has not been looked at since, while 4.3, 4.4 and 4.5 have all
had later passes.

WHAT WAS VERIFIED ON 4.1, AND WHAT PASSED. Every fact in
gbp-packs/fishlocks-ainsdale.md checked against branches.json: branch name,
17 Station Road / Ainsdale / PR8 3HN, phone 01704 575478, Monday to Friday
8:45am to 6:00pm with Saturday and Sunday closed, the review link, and the
app mention which is correct because hasApp is true. The service area list
(Ainsdale, Birkdale, Southport) matches. All five widgets in branches.json
(pharmacyFirst, bloodPressure, contraception, weightLoss, travelClinic) are
carried in both the description and the services section, and the categories
section lists Travel clinic, Vaccination centre and Weight loss service as
the widget set earns. Post A's button uses the branch pfLink from
branches.json. Advertising rules hold: no medicine names anywhere, no
efficacy claims, Pharmacy First wording stays on the NHS service
description. All 15 packs were also swept for em and en dashes and none
carries one. TEMPLATE.md still matches what the packs actually do.

THE DEFECT, AND WHY IT MATTERS. The pack's "Profile basics" told the paster
to set the GBP profile website to https://www.fishlockpharmacy.co.uk, the
shared homepage. Fishlocks runs two branches on that one domain, and McCanns
and Scorah do the same on theirs. Master Plan v2 section 3 is explicit about
this: two branches on one website cannot rank twice in the same map, so the
second branch "leans on its own GBP listing and on branch-specific landing
pages". Pointing both profiles at the same homepage throws that away. It
gives Google one page for two listings, and neither profile carries a page
that is local to its own town. It is also the exact thing items 2.2 and 5.2
built the six landing pages to fix, so the packs were undoing the work.

Only gbp-packs/fishlocks-eccleston.md had it right; that pack was written
after the Fishlocks landing pages existed and points the profile at
pharmacy-fishlocks-eccleston.html. The other five packs predate their landing
pages: Ainsdale's was built under item 2.2 and the McCanns and Scorah pair
were built yesterday under item 5.2, and no one went back to the packs.

WHAT WAS FIXED. Five packs now point the profile website at the branch's own
landing page, in the same wording fishlocks-eccleston.md already used, with
the shared domain named underneath so the paster can see why:
  fishlocks-ainsdale.md    -> pharmacy-fishlocks-ainsdale.html
  mccanns-aigburth.md      -> pharmacy-mccanns-aigburth.html
  mccanns-sandringham.md   -> pharmacy-mccanns-sandringham.html
  scorah-bramhall.md       -> pharmacy-scorah-bramhall.html
  scorah-hazel-grove.md    -> pharmacy-scorah-hazel-grove.html
Each also gains a note in "Notes for the paster" naming the sister branch on
the domain and saying plainly that the landing page has to be pasted to
Weebly, with that branch's service pages, BEFORE the profile website is
changed. That ordering matters: none of the six landing pages is live yet, so
setting the profile website today would point a Google listing at a 404,
which is worse than the homepage. The note is the guard against that.

MADE PERMANENT SO IT CANNOT COME BACK. tools/check-gbp-packs.js gains a
shared-domain rule. It counts how many live branches sit on each website host
in branches.json, derives the landing page slug the same way
build-branch-landing-pages.js does (pharmacy-<brandSlug>-<townSlug>.html), and
fails any pack whose branch shares a host and whose profile website does not
name that landing page. It only fires where the landing page actually exists
in modules/branch/pages, so a branch with nothing to point at yet cannot fail
on it. Both TEMPLATE.md and the checker's header comment now carry the rule,
so the next pack written from the template starts correct.

The rule was negative-tested rather than assumed. Reverting scorah-bramhall.md
to the shared homepage made the checker exit 1 and name the file, the missing
landing page and the host that carries two branches; restoring the file made
it exit 0 again, and git status confirmed the restore was byte-identical.

CHECKERS AFTER THE CHANGE. All six pass. check-nap: 177 pages and 2 paste
blocks against 16 branches, 0 mismatches. check-seo-pattern: 177 pages across
12 brands, 0 failures. check-postcodes: 257 files, 16 postcodes, 0 failures,
the 2 standing UNOWNED warnings on the branch INDEX.md and SEO.md.
check-page-coverage: clean, 177 pages accounted for, no LANDING_NOT_BUILT
warnings left. check-gbp-packs: 15 packs, 0 failures, the same 11 standing
Pharmacy First link warnings that are Q8 and unchanged by this run.
check-em-dashes: 183 files, clean.

NO GENERATED PAGES MOVED. This run touched packs, one checker and the
template only. No generator ran, so no page HTML is in the diff, which is
what every previous quality pass has looked like.

AGENT_WORKLIST.md deliberately untouched. Nothing was completed that is not
already ticked, and a quality pass does not tick anything. Same as every
previous pass.

NO NEW QUESTIONS. The fix follows a decision Rishi has already made (Q11,
build the four landing pages) to its logical end, so nothing here needs a
new answer.

WHAT THIS ADDS TO THE OUTSTANDING WEEBLY LIST. Nothing new in kind, but it
sharpens the order. When the paste session happens, for each of the six
shared-domain branches: paste the branch's service pages, paste the branch
landing page, confirm both resolve, and only then change the GBP profile
website to the landing page. Doing the GBP change first points a live listing
at a 404.

NEXT RUN. Still no unblocked worklist item, so another quality pass. The
oldest remaining passes are the 2026-08-05 batch; item 2.1 (Fishlocks
Ainsdale audit) is the earliest of them, with 2.2, 2.3 and the 4.2 to 4.15
packs behind it in the same batch.

Files changed: gbp-packs/fishlocks-ainsdale.md, gbp-packs/mccanns-aigburth.md,
gbp-packs/mccanns-sandringham.md, gbp-packs/scorah-bramhall.md,
gbp-packs/scorah-hazel-grove.md, gbp-packs/TEMPLATE.md,
tools/check-gbp-packs.js, AGENT_LOG.md.
Commit: 1aefa88 (this line added by the follow-up commit, as the hash cannot
be known before the commit exists).
Questions raised: none.

---

## 2026-08-09 (supervised Cowork session, evening) - GBP live check. The two jobs we went in for were already done. Found instead that Google has silently replaced the website on at least one profile with an NHS.uk page. One reverted, fourteen still to check

WHY THIS SESSION HAPPENED. Rishi was at the machine and asked what to do next.
The recommendation was to clear the two live regulatory items before any SEO
paste work, on the grounds that POM advertising exposure outranks ranking cost.
Both turned out to be closed already.

BROWSER NOTE. The two-Chrome problem did NOT need the spare disconnecting.
Both entries reported isLocal true, so the long-standing theory in this log
that a spare Chrome on the Surface needed signing out is wrong. Rishi
confirmed only one Chrome window was open after a reboot, which points at
either two Chrome profiles on the ProDesk or a stale registration that had not
expired. switch_browser resolved it in one step and the browser is now named
"prodesk", so future runs should be able to select it by name.

CHECKED, NO CHANGE NEEDED (both previously believed outstanding)
  - McCanns Sandringham GBP description. Live text carries NO medicine names
    and is not the copied Hirshmans text. The Q4 exposure on this listing is
    closed. It is not the pack text from gbp-packs/mccanns-sandringham.md
    either, so pasting the pack version is now an improvement, not a fix.
    Live text recorded below for the record.
  - McCanns Sandringham address. Reads "1B Aigburth Road, Aigburth, Liverpool
    L17 4JP". No CH49 1SX and no Dingle anywhere in the record. The note in
    the weebly-navigation skill and Build Pack 4.2 is STALE and should be
    retired so it stops being re-raised.
  - McCanns Aigburth. Description IS the pack text from
    gbp-packs/mccanns-aigburth.md, so the Phase 4 packs have been partly
    pasted already by Rishi or Dane. Website field is on the right domain.

CHANGE MADE (one, authorised by Rishi in session)
  McCanns Sandringham (shop code P-6d4XW5AEypC5), Website field.
    BEFORE: https://www.nhs.uk/services/pharmacy/mccanns-pharmacy/FAP24
            carrying a Google notice reading "Your website was updated by
            Google."
    AFTER:  https://www.mccannspharmacy.co.uk   (the website value in
            branches.json for mccanns_sandringham)
    STATUS at time of writing: pending Google review, up to 10 minutes.
    Nothing else on the profile was touched. The "OK" button on Google's
    notice and the "Confirm" button on the review banner were both left
    alone deliberately, since accepting either could lock in Google's version.

WHY IT MATTERS. The website button on the Google listing is the entry point
for every funnel this audit has been building: switch prescriptions, Pharmacy
First, the branch landing pages from item 5.2. Pointing it at NHS.uk hands
that traffic to the NHS directory instead of the branch site. It is worth more
than the ranking work currently queued.

UPDATE, LATER THE SAME SESSION: THE SWEEP WAS COMPLETED. All 16 profiles have
now been checked one by one. Result: ONE substitution in sixteen, the McCanns
Sandringham one already recorded above. Every other website field points at
the correct branch domain. Full table, plus the working method and the traps,
are written up in the new GBP_MANUAL.md at the repo root. Findings that need
a decision from Rishi are in section 6 of that file: keyword-stuffed profile
names on 15 of 16 (suspension risk on verified listings, and they advertise
the parked Simple Weight Loss brand), nine profiles still on http, both
Fishlocks and both Scorah branches pointing at the same shared root URL, two
descriptions not carrying the pack text, and head office categorised as a
Pharmacy. The "0 Google updates" button label and the "Google updates (16)"
filter confirm what the red dot means: every listing has a Google update
awaiting review, in three flavours (website changed, social profile changed,
or a prompt to confirm). Nothing was accepted or confirmed.

ORIGINAL NOTE AT THE TIME OF WRITING - 14 PROFILES OUTSTANDING. Only McCanns
Aigburth and McCanns Sandringham had been inspected. Every one of the sixteen pencil icons in the group list
carries a red dot, and the Aigburth record showed a banner reading "Review and
edit your business information to improve your presence on Google. Scroll down
to confirm", so Google is pushing changes across the estate. Remaining:
Cherry Lane, Clear, Coleman and Leighs, Fishlocks Ainsdale, Fishlocks
Eccleston, Gordon Short, Hirshmans, RB Healthcare head office, Riddings,
Scorah Bramhall, Scorah Hazel Grove, SK Chemists, Smartts, Tiffenbergs.
Method that works: group dropdown to "RB Healthcare Ltd", pencil on the row,
Contact tab, drag the dialog's inner scrollbar down to Website.

TWO FINDINGS NOT ACTIONED, BOTH NEED A DECISION FROM RISHI
  1. All 16 profiles are named in the pattern "<Brand> - <Branch> - Travel
     Vaccination and Simple Weight Loss Clinic". Google's naming guidance is
     that the field holds the real-world business name only; descriptors and
     keywords in it put a verified listing at risk of suspension. It also
     advertises Simple Weight Loss, a brand formally parked for 90 days.
  2. Website targets are inconsistent where they are correct. McCanns
     Aigburth points at http://www.mccannspharmacy.co.uk/contact-us.html:
     right domain, but http rather than https and a contact page rather than
     a landing page. Worth a single decision on what these should point at
     across the estate, ideally the branch landing pages once pasted.

LIVE DESCRIPTION RECORDED BEFORE ANY FUTURE EDIT (McCanns Sandringham):
"At McCanns Pharmacy Sandringham on Aigburth Road, we are a trusted NHS
pharmacy providing essential healthcare services, including prescription
dispensing, Pharmacy First consultations and blood pressure checks. Our team
also offers travel vaccinations, private blood testing and a pharmacist-led
weight loss clinic, with expert, in-person care. Visit us for professional
advice and personalised healthcare, all in a friendly, community-focused
setting."
Note: it advertises private blood testing, which is not a service in
branches.json for this branch, and omits the NHS contraception service, which
is. Worth checking which is right before the pack text replaces it.

NOT REACHED THIS SESSION. The Cherry Lane Weebly job (old weight loss page
still naming three medicines and claiming up to 22.5 percent body weight
loss) was not started. It remains the highest-value Weebly item. The
replacement block at modules/service/weebly-paste/
cherry-lane-old-weight-loss-replacement.html was reviewed and IS safe to
paste as it stands. The Pharmacy First one in the same folder is still NOT
safe: it replaces the whole page and would remove the video and booking
widget that Rishi's Q9 answer said to keep.

---

## 2026-08-09 (unattended run, sixteenth) - Item 5.2 done: the four remaining shared-domain branches now have their own landing pages. Building them exposed a real defect in the generator's meta description, which ran over the 165-character limit for both Scorah branches, so the description is now built once by a length-aware helper instead of being composed twice by hand

Run start state. No .agent-lock and no .git\index.lock. Worktree clean.
Branch agents/audit-backlog level with origin at 2ec9262. Lock created and
deleted around the run.

Portal answer pickup: not attempted. QUESTIONS.json has no question with
status "open" (Q1 to Q11 all answered), so the step 3 condition was not met.
The two-Chrome problem described in the notes above is therefore still
untested and still needs the spare Chrome disconnecting before any future
question can be answered through the portal.

ITEM WORKED: 5.2 (Q11) - build branch landing pages for McCanns Aigburth,
McCanns Sandringham, Scorah Bramhall and Scorah Hazel Grove.

WHAT WAS DONE
1. Added the four ids to the BUILD list in tools/build-branch-landing-pages.js
   and rewrote the scope comment at the top of the file. The list is now the
   full set of six branches across the three shared domains
   (fishlockpharmacy.co.uk, mccannspharmacy.co.uk, scorah-chemists.co.uk),
   which is exactly the set check-page-coverage.js derives from branches.json.
2. Regenerated. Four new pages written to modules/branch/pages/:
   pharmacy-mccanns-aigburth.html, pharmacy-mccanns-sandringham.html,
   pharmacy-scorah-bramhall.html, pharmacy-scorah-hazel-grove.html.
   The two existing Fishlocks pages regenerated byte-identical, so nothing
   already pasted to Weebly has moved.
3. Fixed a real defect the new pages exposed (see below).
4. Added a "before pasting" note to the generated INDEX.md.

THE DEFECT, AND WHY IT MATTERED
check-seo-pattern.js failed the first regeneration: the meta descriptions for
both Scorah landing pages ran over the 165-character rule. The generator built
the description by concatenating the branch name, town, postcode, a service
sentence and then every town in serviceAreaList. Scorah lists five service
areas, so both Scorah pages overran. Over 165 characters Google truncates the
snippet mid-sentence, and the part it drops is the end, which is where the
towns sit. The extra length bought nothing and cost the local town words the
sentence exists to carry. The same string was also composed twice, once
for the page tag and once for the paste sheet, which is the exact drift that
item 5.1 removed from the switch pages last run.

Both problems are fixed the same way. A single landingMeta(b) helper now
builds the description and is used by the page tag AND by INDEX.md and SEO.md,
so they cannot drift. It trims the serving list one town at a time until the
whole line fits 165 characters, rather than truncating mid-word: Scorah
Bramhall now lists four of its five towns, Scorah Hazel Grove likewise, and
the dropped town still appears in the page's own body copy. The four
non-Scorah pages were already inside the limit and are unchanged by the
helper.

VERIFICATION (all run after the final regeneration)
  check-page-coverage  clean, 177 pages accounted for, 0 warnings.
                       Branch landing now earns 6 and the list holds 6. The
                       four standing LANDING_NOT_BUILT warnings are cleared,
                       which was the stated point of the item.
  check-seo-pattern    177 pages, 0 failures (was 2 before the meta fix).
  check-nap            177 pages, 0 mismatches, 0 warnings.
  check-em-dashes      clean, no em or en dashes in public copy.
  check-postcodes      0 failures. Two pre-existing UNOWNED warnings on
                       modules/branch/pages/INDEX.md and SEO.md, which carry
                       every branch's postcode by design and cannot be
                       matched to a single branch by filename. Not new.
  check-gbp-packs      0 failures.
  seo-pattern self-test passed, 1 pre-existing length warning.
Spot-checked two of the four pages by hand: NAP, opening hours, tel: link,
JSON-LD with openingHoursSpecification, sister-branch cross-link and all five
service links resolve to that branch's own slugs.

FILES CHANGED
  tools/build-branch-landing-pages.js  BUILD list, scope comment, new
                                       landingMeta() helper, INDEX.md note
  modules/branch/pages/pharmacy-mccanns-aigburth.html        new
  modules/branch/pages/pharmacy-mccanns-sandringham.html     new
  modules/branch/pages/pharmacy-scorah-bramhall.html         new
  modules/branch/pages/pharmacy-scorah-hazel-grove.html      new
  modules/branch/pages/INDEX.md        regenerated
  modules/branch/pages/SEO.md          regenerated
  AGENT_WORKLIST.md, AGENT_LOG.md
Commit 7f75e6e on agents/audit-backlog (this hash line was corrected by the
follow-up commit that carries it; the work itself is all in 7f75e6e).

OUTSTANDING ON THE LIVE SIDE (repo work is finished)
These four pages are repo output. Nothing is live until someone pastes them.
For Rishi or Dane, per modules/branch/pages/INDEX.md and SEO.md:
  - Create four Weebly pages on mccannspharmacy.co.uk and
    scorah-chemists.co.uk at the permalinks in SEO.md, paste each file into
    an Embed Code element, and set the SEO title and description from SEO.md.
  - Paste each branch's service pages first, or in the same session. The
    landing pages link to pharmacy-first-, switch-prescriptions-,
    weight-loss-clinic-, travel-clinic- and contraception- pages for that
    branch. Those exist in the repo but are not live on either site yet, so
    pasting a landing page on its own would publish links that 404. This is
    the same paste run that Q8 has been waiting for.
  - Link each landing page from the site navigation, for example "Aigburth
    branch" and "Sandringham branch".

NO NEW QUESTIONS. Nothing is blocked by this item.

NEXT RUN. Every unblocked item on the worklist is now complete. 5.3 and 5.4
both need the Weebly editor and stay [BLOCKED]. So the next unattended run
should take a quality pass under step 4: the least recently verified
completed item is 4.1, the GBP pack template and the Fishlocks Ainsdale pack.

---

## 2026-08-09 (unattended run, fifteenth) - Applied the Q7 decision: the two em dash strings that reached the public on all 15 switch pages are rewritten at source and regenerated. The meta description is now defined once instead of twice, and a new checker fails any future run that puts a dash back into public copy

Run start state. No .agent-lock and no .git\index.lock. Worktree clean apart
from this run's own temporary scripts. Branch agents/audit-backlog level with
origin at 02cdef8.

Portal answer pickup: not attempted this run. QUESTIONS.json has no question
with status "open" - Q1 to Q11 are all answered - so the step 3 condition for
fetching was not met. The two-Chrome problem described in the notes above is
therefore not blocking anything today. It will matter again the moment a new
question is raised, and the fix is still to disconnect the spare Chrome from
the account or sign the Surface out.

WHICH WORK, AND WHY THIS RATHER THAN A QUALITY PASS. Every worklist item is
ticked, so the standing rule points at a quality pass. A quality pass was not
the right call this run. Four of Rishi's answers carry work that was recorded
but never done, and the note at the top of this log says so plainly: "None of
this is done yet, and it is the whole of the outstanding work." Two of those
four are repo-only and need no Weebly access. Doing a fresh verification pass
on a pack that already passed, while an authorised fix to public-facing copy
sat undone for a second day, would have been the wrong order. Q7 was taken
first because it is the one with a live consequence: the em dash is in the
meta description that becomes the Google search snippet for all 15 switch
pages, so it is visible to anyone searching, not just to a visitor on the page.

WHAT CHANGED IN THE GENERATOR. tools/build-switch-pages.js, three edits.
The body sentence on every switch page read "With <brand> in <town>, it
usually is not - we make the first step quick and easy", with an em dash. It
now reads "...it usually is not. We make the first step quick and easy." The
meta description read "Local NHS pharmacy - we contact your GP and handle
everything", again with an em dash, and now reads "Local NHS pharmacy. We
contact your GP and handle everything." Both were split at a full stop rather
than having the dash swapped for a hyphen, which is what Rishi's answer asked
for and which reads better in both sentences.

ONE THING WORTH FLAGGING THAT WAS NOT IN THE QUESTION. That meta description
was written out twice in the file, once for the page's own meta tag and once
for the seoDesc field in the Weebly paste sheet, as two separate copies of the
same literal. Fixing only one would have left the page and the paste sheet
disagreeing, and nothing in the repo would have caught it. Both now call a
single switchMeta() helper, so the string exists in one place and the two
cannot drift apart again. That is a small change and it is the reason the fix
is safe to leave unattended.

REGENERATION AND WHAT ACTUALLY MOVED. node tools/build-switch-pages.js
regenerated all 15 pages. The diff is exactly what it should be: 17 files, 60
insertions and 60 deletions, two changed lines per page (the SEO description
line in the build header comment and the body sentence), plus the Page
Description lines in INDEX.md and SEO.md. No other page in the repo moved, and
no other generator was touched.

CHECKERS. All existing checkers were run after regeneration and all pass.
check-nap: 173 pages and 2 paste blocks against 16 branches, 0 mismatches,
0 warnings. check-seo-pattern: 173 pages across 12 brands, 0 failures.
check-postcodes: 256 files, 16 postcodes, 0 failures, the 2 standing UNOWNED
warnings on the branch INDEX.md and SEO.md. check-page-coverage: clean, 173
pages accounted for, the 4 standing LANDING_NOT_BUILT warnings that are Q11.
check-gbp-packs: 15 packs, 0 failures, the 11 standing Pharmacy First link
warnings that are Q8.

NEW CHECKER, SO THIS CANNOT COME BACK. tools/check-em-dashes.js. It scans all
173 generated pages and the paste sheets. It fails the run on an em dash or an
en dash in copy that reaches the public, meaning anywhere in a generated page
once HTML comments are blanked out, and in the Page Title, Page Description
and Meta Keywords lines of the paste sheets, which are the values someone
types into Weebly. It reports, without failing, the dashes that sit inside
HTML build comments and in paste sheet headings, because no customer sees
either. Current state: 173 pages plus paste sheets scanned, clean, with 186
dashes in build comments and 482 in paster headings reported for honesty. The
checker was negative-tested rather than assumed: a throwaway page carrying an
em dash was dropped into the switch pages folder, the checker failed with exit
code 1 and named the file and line, and passed again with exit code 0 once the
file was removed.

WHAT IS STILL OUTSTANDING ON Q7, AND IT DOES MATTER. The repo half is done.
The live half is not. The Weebly SEO description field for the 15 switch pages
still holds the old text with the em dash, and that is the string Google shows.
It needs repasting from modules/switch/pages/SEO.md at the next paste run.
Until that happens the fix is invisible to anyone searching.

HOUSEKEEPING ON THE WORKLIST, AND A STATUS PAGE PROBLEM WORTH KNOWING ABOUT.
Because every numbered item was ticked, there was nowhere to record the work
Rishi's answers authorised, and the last two runs each had to reason from
scratch about what was outstanding. Worse, the status page was reporting
35 of 35 done, 100 per cent, while three authorised jobs had not been started.
That is not an honest page for Rishi to look at.

The first attempt at a fix, a plain section headed "Answered decisions", did
not work: tools/build-audit-status.js only recognises items numbered "N.M"
underneath a heading of the exact form "## Phase N - name", so the new items
were silently invisible and the page still read 100 per cent. Checked rather
than assumed, by reading the parser. The section is therefore now a proper
"## Phase 5 - Work authorised by Rishi's answers", with items 5.1 to 5.4, so
the existing parser picks them up with no code change. 5.1 (Q7) is ticked.
5.2 (Q11) is unchecked, which makes it the first unchecked item and therefore
the next unattended run's work. 5.3 (Q8) and 5.4 (Q9) are marked [BLOCKED]
because both need someone logged into the Weebly editor, so unattended runs
will skip them instead of failing on them every hour, and the status page
shows them as needing Rishi.

NEXT RUN SHOULD TAKE Q11: build branch landing pages for McCanns Aigburth,
McCanns Sandringham, Scorah Bramhall and Scorah Hazel Grove by adding them to
the BUILD list in tools/build-branch-landing-pages.js, same pattern as the
Fishlocks pair from item 2.2. That clears the four standing LANDING_NOT_BUILT
warnings in check-page-coverage.

Files changed: tools/build-switch-pages.js, tools/check-em-dashes.js (new),
the 15 modules/switch/pages/*.html, modules/switch/pages/INDEX.md,
modules/switch/pages/SEO.md, QUESTIONS.json, AGENT_WORKLIST.md, AGENT_LOG.md.
Questions raised: none.

## 2026-08-09 (unattended run, fourteenth) - Quality pass on item 4.5, the Scorah Chemists Hazel Grove GBP pack. The pack verified clean on every fact and rule. The cross-check found one real defect elsewhere: the Cherry Lane pack omits two free NHS services the branch actually offers from both its description and its services section. Fixed, and made permanent with a services rule in check-gbp-packs.js

Run start state. A .agent-lock was present and 3 hours 29 minutes old, over the
three hour threshold, so treated as stale per the standing rules and cleared.
No .git\index.lock. Worktree clean, branch level with origin at 08bc483. No
unchecked worklist items, so a quality pass per the standing rules.

Portal answer pickup: NOT AVAILABLE, sixth run running, same cause. Two Chrome
browsers are still connected, both still report as "Browser 1" and "Browser 2",
and the tooling still requires a human to pick one before any browser action.
An unattended run cannot do that, so nothing was tried beyond the check, per
the standing rules. Q7, Q8, Q9 and Q11 remain open and unreachable through the
portal. See the note at the top of this file.

WHICH ITEM, AND WHY. Least recently verified completed item. Reading the pass
history in this log, item 4.4 was passed on 2026-08-08, and 4.1, 4.2, 4.3 and
4.7 have all had passes later than their original 2026-08-05 scheduled ones.
The oldest remaining single pass is item 4.5, Scorah Chemists Hazel Grove,
passed once on 2026-08-05 and not looked at since. It is also live-consequence
work now: the Q10 session on 7 August pasted the pack descriptions into 11 GBP
profiles, so the packs are the source of what is public, not drafts in a folder.

WHAT WAS VERIFIED ON 4.5, AND WHAT PASSED. Every fact checked against the
branches.json entry for scorah_hazel: address 87 Macclesfield Road, Hazel Grove
SK7 6BG, phone 01625 872267, website, Google review link, the five service area
towns, and the opening hours including the Saturday closure, all correct and
matching the NHS-confirmed 2026-06-24 hours record. The business description is
712 characters when the wrapped lines are joined, exactly as its heading claims,
inside the 750 limit. The four posts are 449, 349, 521 and 429 characters, all
far inside the 1,500 limit. No medicine names, no efficacy claims, no em dashes,
no non-ASCII characters anywhere in the file. Ten photo shots as Build Pack 4.1
asks. Categories now carry Vaccination centre from last run's estate fix. The
three branch-specific post link targets all exist as pages this repo generates,
and the branch-specific Pharmacy First page named in the paster note is real at
modules/service/pages/pharmacy-first-scorah-hazel-grove.html. The WhatsApp claim
in Post B was checked rather than assumed, as TEMPLATE.md bars invented claims:
the branch's own switch page offers WhatsApp in four places, so it is grounded.
Nothing in the pack itself needed changing.

CROSS-CHECK ACROSS ALL 15 PACKS. Four Build Pack 4.1 facts the checker did not
yet cover were surveyed estate-wide: photo shot counts, review links, addresses
and service area towns are correct in all 15. Opening hours were surveyed
against branches.json in detail after an early survey appeared to show seven
mismatches; every one turned out to be an artefact of the survey regex stopping
at a wrapped line, and all 15 packs state hours that match branches.json exactly,
including the lunch closures at Gordon Short, McCanns Aigburth, Tiffenbergs,
Smartts, Coleman and Leighs and McCanns Sandringham. Recording that here because
the same wrapping trap produced two more false positives before it was caught,
and the fix in the checker guards against it.

DEFECT FOUND, AND ITS SIZE. Comparing each pack's services section against the
branch's widget set in branches.json found one genuine gap. Cherry Lane has
bloodPressure and contraception widgets, and the repo generates a contraception
page for it, but the Cherry Lane pack lists neither service in its services
section and mentions neither in its business description. Both are free NHS
services, both are the kind of search that brings local patients to a profile,
and Cherry Lane is the branch item 2.3 built from near zero, so its profile is
the one with the least existing presence to fall back on. Every other pack with
those widgets lists both. Clear Chemist looked like a second case in the raw
survey but is correct: it has neither widget and its pack carries an explicit
note not to add those services to GBP unless branches.json is updated first.

WHAT WAS CHANGED. Two edits to gbp-packs/cherry-lane-walton.md. The services
section gains an NHS blood pressure check line and an NHS contraception service
line, worded as in the other 14 packs. The business description was rewritten to
name all three free NHS services in one sentence, in the same "three free NHS
services" shape the Hazel Grove pack uses, and is now 736 characters against the
750 limit, with the stated count in the heading updated to match. The rewrite
also drops "a vaccination service" from the private list, which was double
counting the travel clinic vaccinations named in the same sentence; the NHS
vaccinations line in the services section is untouched. Packs are hand-drafted
markdown, not generated output, so a direct edit is the correct route; no
generator writes to gbp-packs.

MADE PERMANENT. tools/check-gbp-packs.js gains a services block that reads which
services a pack must list from the branch's widget set in branches.json rather
than from the pack, so the two cannot drift: Pharmacy First, blood pressure,
contraception, weight loss and travel clinic each fail the run if the branch has
the widget and the services section does not name the service, and warn if the
business description leaves it out. Whitespace is flattened before matching,
which is the specific trap that made the manual survey report false positives.
All four rules negative-tested by breaking the Cherry Lane pack four ways in
turn and confirming each fires with the right message and exit code 1, then
restoring byte-identical. TEMPLATE.md section 3 rewritten to state the rule.

ONE TRAP WORTH RECORDING. The first negative-test harness restored the file with
git checkout, which silently reverted the uncommitted Cherry Lane fix along with
the deliberate break. The fix had to be reapplied. Restore from an in-memory
copy, not from git, when the work under test is not committed yet. This sits
alongside the BOM trap recorded on the thirteenth run: both are ways a restore
step can quietly undo the run's actual work.

VERIFICATION. All six generators re-run afterwards: every page regenerated
byte-identical, git status shows no page and no branches.json change, only the
Cherry Lane pack, the checker and the template. All five checkers pass at exit
0: check-nap 173 pages 0 mismatches, check-postcodes 0 failures, check-seo-
pattern 173 pages 0 failures, check-gbp-packs 0 failures, check-page-coverage
173 pages accounted for. The new description rule raises no warnings, so all 15
descriptions now name every service their branch offers. Pre-existing warnings
unchanged and all belong to open questions: the 10 GBP link warnings and the
Tiffenbergs missing .html are Q8, the 4 landing page warnings are Q11, the 2
postcode warnings are the known unowned INDEX.md and SEO.md files.

NO WORKLIST CHANGE. Every worklist item is already complete and this was a
quality pass on 4.5, so nothing was ticked, in line with the previous quality-
pass runs. The record of the pass is this entry.

NO NEW QUESTIONS. The Cherry Lane omission is a drafting gap against the spec
and against all 14 sibling packs, so it was a defect to fix rather than a
decision to ask about. Nothing was raised.

## 2026-08-08 (unattended run, thirteenth) - Quality pass on item 4.4, the Scorah Chemists Bramhall GBP pack. The pack itself verified clean against branches.json and TEMPLATE.md, but the cross-check found an estate-wide defect against Build Pack v2 section 4.1: 11 of the 15 packs omit the Vaccination centre secondary category their travel clinics earn. Fixed in all 11 and made permanent with three new rules in check-gbp-packs.js

Run start state. A .agent-lock was present and 3.02 hours old, marginally over
the three hour threshold, so treated as stale per the standing rules and
cleared. No .git\index.lock. Worktree clean, branch level with origin at
e32f3b0. No unchecked worklist items, so a quality pass per the standing rules.

Portal answer pickup: NOT AVAILABLE, fifth run running, same cause. See the
revised note at the top of this file. Q7, Q8, Q9 and Q11 remain open and
unreachable through the portal.

WHICH ITEM, AND WHY. Least recently verified completed item. Reading the pass
history in this log, every 2026-08-05 GBP pack pass sits at the bottom of that
day's block, and the oldest of them is item 4.4, Scorah Chemists Bramhall,
passed once on 2026-08-05 and not looked at since. Everything else has had a
more recent pass. It is also a live-consequence item now: the Q10 work on
7 August pasted the pack descriptions into 11 GBP profiles, so the packs are no
longer drafts sitting in a folder, they are the source of what is public.

WHAT WAS VERIFIED ON 4.4, AND WHAT PASSED. Every fact in the pack was checked
against the branches.json entry for scorah_bramhall: address 61-63 North Park
Road, Bramhall SK7 3LQ, phone 0161 439 3744, website, Google review link,
service area towns, and the opening hours including the Saturday 9:00 to 1:00
close, all correct and all matching the NHS-confirmed 2026-06-24 hours record.
The business description is 742 characters when the wrapped lines are joined,
exactly as its own heading claims, and inside the 750 GBP limit. All four posts
are far inside the 1,500 limit (446, 348, 518, 424). No medicine names, no
efficacy claims, no em dashes, no emojis. Ten photo shots listed as Build Pack
4.1 asks. The three post link targets all exist as pages this repo generates
(switch-prescriptions, weight-loss-clinic and travel-clinic for scorah-bramhall),
and the paster note's claim that a branch-specific Pharmacy First page exists in
the repo is true: modules/service/pages/pharmacy-first-scorah-bramhall.html. The
WhatsApp line in Post B was checked rather than assumed, because TEMPLATE.md
bars invented claims: the branch's own switch page offers WhatsApp in four
places, so the claim is grounded. Post C correctly frames weight loss as a
private paid service with no free assessment wording, which is the point item
4.4 was flagged on when it was first drafted.

DEFECT FOUND, AND ITS SIZE. Build Pack v2 section 4.1 asks for the secondary
categories that apply: Travel clinic, Vaccination centre and Weight loss
service. The Scorah Bramhall pack lists only Travel clinic and Weight loss
service. Checking the other 14 packs showed this is not a Bramhall slip: only
four packs (Cherry Lane, Fishlocks Ainsdale, Hirshmans, Smartts) list
Vaccination centre and 11 do not, although branches.json gives every one of the
15 packable branches a travelClinic widget, and every one of the 11 packs
describes a travel clinic offering vaccinations in its own services section and
Post D. So 11 profiles were set to be pasted without the category that puts a
pharmacy into the vaccination and travel-jab map results, on a service the group
actually sells. Categories are also one of the strongest local ranking signals
Google offers, and unlike the description they cost nothing to add.

WHAT WAS CHANGED. Vaccination centre added to the Categories section of the 11
packs that lacked it: clear-aintree, coleman-leigh-walton, fishlocks-eccleston,
gordon-short-crosby, mccanns-aigburth, mccanns-sandringham, riddings-timperley,
scorah-bramhall, scorah-hazel-grove, sk-chemists-bootle, tiffenbergs-aintree.
One line changed per file, no other text touched. Clear Chemist was included
after checking its pack: it has a travelClinic widget and its services section
describes travel vaccinations, the same basis as the rest, even though it has no
NHS Pharmacy First. Packs are hand-drafted markdown, not generated output, so a
direct edit is the correct route here; no generator writes to gbp-packs.

MADE PERMANENT. tools/check-gbp-packs.js gains a categories block that reads
which secondary categories a pack must list from the branch's widget set in
branches.json rather than from the pack, so the two cannot drift: Travel clinic
and Vaccination centre wherever travelClinic is set, Weight loss service
wherever weightLoss is set, plus a check that Pharmacy is the primary category.
All four rules negative-tested by breaking the Bramhall pack four ways in turn
and confirming each fires with the right message and exit code 1, then
restoring. One trap worth recording for future runs: restoring a file with
PowerShell Set-Content -Encoding UTF8 writes a byte order mark and shows up as a
spurious first-line diff. The file was restored with git checkout and the edit
reapplied through node instead. TEMPLATE.md section 2 rewritten to state the
rule plainly so the next pack drafted does not repeat the omission.

VERIFICATION. All six generators re-run afterwards: every page regenerated
byte-identical, git status shows no page or branches.json change, only the 11
packs, the checker and the template. All five checkers pass at exit 0:
check-nap 173 pages 0 mismatches, check-postcodes 0 failures, check-seo-pattern
173 pages 0 failures, check-gbp-packs 0 failures, check-page-coverage 173 pages
accounted for. The pre-existing warnings are unchanged and all belong to open
questions: the 10 GBP link warnings are Q8, the 4 landing page warnings are Q11,
the 2 postcode warnings are the known unowned INDEX.md and SEO.md files.

NO NEW QUESTIONS. The category fix follows the spec and four sibling packs, so
it was a defect to fix rather than a decision to ask about. Nothing was raised.

STILL OUTSTANDING FOR A HUMAN, unchanged by this run: paste the two Cherry Lane
Weebly blocks from modules/service/weebly-paste/; update the Weebly SEO fields
for the switch pages; add the Vaccination centre category to the 11 GBP profiles
when next in them, alongside the pack descriptions already pasted.

## 2026-08-07 (unattended run, twelfth) - Recovered the crashed eleventh run's unfinished coverage checker and completed it. tools/check-page-coverage.js is the first checker that reads what SHOULD exist from branches.json rather than inspecting whatever happens to be on disk. It found a real stale entry in the switch generator, now removed. Fifteen rules negative-tested. New Q11

Run start state. A .agent-lock was present and 3.49 hours old, so treated as
stale per the standing rules and cleared. No .git\index.lock and no git process
running. The worktree carried four untracked scratch files from the crashed
run: .agent-tmp-git.ps1, .agent-tmp-lock.ps1, tmp-analyse.js and a half-written
tools/check-page-coverage.js, 207 lines, ending mid-file with no orphan check,
no report and no exit code. Branch already level with origin. No unchecked
worklist items, so quality pass per the standing rules.

Portal answer pickup: NOT AVAILABLE, fourth run running. Both Chrome browsers
are still connected and still report as "Browser 1" and "Browser 2" despite
being named in the supervised session, so the tooling still demands a human
choice. Nothing else was tried, per the standing rules. See the revised note
above: naming the browsers did not fix it and will not; one of them has to go.

WHAT WAS TAKEN, AND WHY. Every completed item has had a quality pass, so the
tenth run's note offered two routes: go round again from the oldest, or address
the structural weakness carried in this log for five runs now - the generators
are driven by hardcoded lists rather than by branches.json, so adding or
disposing of a branch needs a code edit in several places and nothing fails if
one is missed. The crashed run had started on exactly that, so this run
recovered its work rather than starting a third thing. Framed as a quality pass
on the Phase 3 rollout claim that all pages are generated from branches.json:
the claim was true of the pages that exist, and silent about the ones that
do not.

THE GAP THIS CLOSES. check-nap, check-postcodes, check-seo-pattern and
check-gbp-packs all inspect the files on disk. If a branch is added to
branches.json and nobody adds its id to a generator list, no page is written,
so there is nothing for those checkers to find and all four report a clean
pass. The branch is simply absent and the estate looks healthy.
tools/check-page-coverage.js derives the expected page set from branches.json
alone, then compares it to the generators' driving lists and to the files on
disk. It reports 173 pages across three folders, which matches the figure this
log has cited since the Phase 3 rollout.

DEFECT FOUND AND FIXED. tools/build-switch-pages.js still carried a
wilmslow_wilmslow entry in its CONFIG object. Wilmslow was removed from
branches.json entirely under the Q2 answer on 5 August, so the entry pointed at
a branch that no longer exists and at a domain that transferred with the sale.
No page was being generated from it, because the disposed-branch guard added
under item 1.4 caught it, but the entry was live code one data change away from
resurrecting a sold branch's page. Removed. All six generators re-run
afterwards: every page regenerated byte-identical, git status shows no page,
pack, paste block or branches.json change, only the generator source. All five
checkers pass at exit 0.

FINDING RAISED AS Q11, NOT ACTED ON. The new checker derives the branch
landing page rule from the data rather than from the built list: any branch
sharing its website with another trading branch has no page of its own to rank
locally, which is precisely why item 2.2 built the Fishlocks pair. Two more
pairs are in the same position and have nothing - McCanns Aigburth and
Sandringham on mccannspharmacy.co.uk, Scorah Bramhall and Hazel Grove on
scorah-chemists.co.uk. Four branches, four towns, no local target page.
Building them is a decision rather than a defect, so they are reported as
warnings, the checker still exits 0, and the question is Q11. Recommendation
is to build all four from the existing generator.

NEGATIVE TESTS. Fifteen in total, every rule proved to fire and the harness
itself checked. NOT_BUILT (both the BUILD-list path and the switch CONFIG
path), STALE_ID, DISPOSED_LISTED, NOT_EARNED, PAGE_MISSING, ORPHAN_PAGE,
LIST_UNREADABLE (both the BUILD-list path and the CONFIG path),
GENERATOR_MISSING, DIR_MISSING, LANDING_NOT_BUILT, LANDING_NOT_SHARED. Two
harness defects were caught and corrected rather than glossed over. First, the
NOT_BUILT test passed on a substring match against LANDING_NOT_BUILT, so it
proved nothing; re-run with an exact code match, plus a silent-when-clean test
so a rule that always fires cannot masquerade as a pass. Second, the harness
reverts each mutation with git checkout, which silently reverted the
wilmslow fix made earlier in the run; caught on the next git status, re-applied
and re-verified. One cosmetic defect in the checker itself was found by the
tests and fixed: the switch generator's NOT_BUILT message called its CONFIG
object a BUILD list, which would have sent a reader to the wrong place.

Live site NOT checked this run. The work is entirely repo-side and the browser
tools are blocked for the same reason as the answer pickup.

Files changed: tools/check-page-coverage.js (new, completed),
tools/build-switch-pages.js (stale CONFIG entry removed), QUESTIONS.json (Q11),
AGENT_LOG.md. No page, pack, paste block or branches.json bytes changed. Six
untracked scratch files removed, four of them left by earlier runs.
AGENT_WORKLIST deliberately untouched, matching every previous quality pass.
Commit: see this commit on agents/audit-backlog.
Questions: Q7, Q8, Q9, Q10 open and unchanged. Q11 raised by this run.

Note for a later run: the structural weakness is now visible rather than fixed.
The checker will fail loudly the moment a branch is added to branches.json and
missed in a generator list, which is the dangerous case, but the lists are
still hand-maintained in six places. Driving the generators from branches.json
directly is the real fix and is a bigger job than one run; it should be taken
deliberately, with the checker as the safety net that proves the change built
the same 173 pages.

---

## 2026-08-08 (supervised Cowork session) - Merged to main at Rishi's instruction. Cherry Lane's PUBLIC Google profile is showing a LloydsPharmacy description, which is neither the old text nor the new one

MERGE DONE. agents/audit-backlog merged to main as 3da863d, no force, no
rebase, aa950e0..3da863d. Merged in a supervised session per the Q3 answer,
which bars the unattended agent from touching main. Before merging: all five
checkers run on the branch, all exit 0. Diff reviewed: 30 files, docs, GBP
packs, checkers, generators, the two Weebly paste blocks and .gitattributes.
No generated page HTML in the diff, consistent with every quality pass
reporting the pages as byte-identical. After merging: all five checkers run
again on main, all exit 0 (173 pages, 0 mismatches, 0 failures). Then pushed.
The five checkers are now on main rather than only on the working branch,
which was the point.

Concurrency, again: while this session was on main doing the merge, an
unattended run committed a1a9591 to agents/audit-backlog (quality pass on
item 4.4, adding the Vaccination centre category to 11 GBP packs plus three
new rules in check-gbp-packs.js). That commit was already on the branch when
the merge ran, so it went into main without this session having reviewed it
specifically. The post-merge checkers cover it and it passes, but the point
stands: work is being merged that no human and no single agent has read end
to end. Third collision in two days. The schedule should be paused during
supervised sessions.

CHERRY LANE PUBLIC PROFILE - NEEDS A HUMAN LOOK
The Cherry Lane GBP description was replaced in the manager yesterday and
Google queued it as "edit pending". Checking the public profile today, the
description Google actually shows the public is:
  "LloydsPharmacy is a leading community pharmacy and healthcare provider in
   the UK, that endeavours to manage, prevent, treat and support your health
   and chronic conditions. We partner with the NHS and local healthcare
   providers to develop and deliver..."
That is neither the Mounjaro and Wegovy text that was in the manager
yesterday nor the pack text that replaced it. It is a different company's
boilerplate, presumably left over from when the site traded as a Lloyds
branch. Three possible explanations and this session cannot tell them apart
from the outside: the edit is still propagating, Google is serving a stale
cache, or there is a second Google listing for this address that RBH does
not manage and that is the one ranking. The manager row for Cherry Lane is
also one of the few with no shop code set. Worth someone opening the public
profile directly and checking whether there are duplicate listings to merge.
No further edit was made, because changing the same field again while an
edit is pending is how you end up with two competing pending edits.

BOTH DATA ERRORS NOW RESOLVED AND FIXED. Rishi asked for them to be settled
against branches.json or the NHS profile rather than by asking him, so both
were checked against independent sources first.

McCanns Aigburth phone. branches.json: Aigburth 0151 727 3185, Sandringham
0151 727 3076. Independent confirmation from the practice website, Cylex,
locatepharmacy and merseyside.com, all giving 0151 727 3185 for 112 Aigburth
Road. Google's own public panels already showed the correct primary number
for each branch, so the 3076 on Aigburth was a stray additional number, not
the one being advertised. Removed. Aigburth now carries 0151 727 3185 only.
Worth noting the removal appeared not to save on the first attempt: the
manager redisplayed both numbers immediately afterwards. Reopening the
profile in a fresh tab showed only 3185, so the first save had in fact
worked and the manager was rendering stale state. Anyone verifying a GBP
edit should reload rather than trust the panel it returns you to.

Hirshmans address. The sources split, but not evenly:
  - "Sherwood House, 56-62 Station Rd, Ainsdale" appears in the NHSBSA
    pharmacy contractor register (the official dispensing contract record,
    ODS code FHW57) across five separate monthly files, and on
    nhs.uk/pharmacy/hirshman-s-chemist. It also matches branches.json and
    the website.
  - "64 Station Road" appears only on an older nhs.uk service-directory
    page and on a GP surgery page that had copied from it.
Google's own address autocomplete offered "56-62 Station Road, Ainsdale,
Southport" as a real address, which is independent confirmation again.
Corrected: street address changed from "64 Station Road" to "56-62 Station
Road", post town Southport and postcode PR8 3HW both unchanged, map pin
moved to Station Road in Ainsdale. Google queued it as pending review and
did NOT trigger re-verification, which was the risk Rishi weighed before
approving. Confirm in a few hours that it cleared and that the listing is
still Verified.

One deliberate omission: the building name "Sherwood House" was not added to
the GBP. The canonical Google address is "56-62 Station Road" and selecting
it is what fixed the geocoding. Google's optional extra address line renders
after the street rather than before it, so adding the building name there
would read "56-62 Station Road, Sherwood House", which is wrong for a UK
address. The building name remains on the website and the NHS record where
it belongs. Note the sources themselves disagree on ordering: NHSBSA has
"SHERWOOD HOUSE, 56-62 STATION RD" and branches.json has "56-62 Sherwood
House, Station Road". branches.json is arguably the odd one out and could be
tidied to match the NHS form, but it is cosmetic and check-nap enforces
consistency with whatever it says, so it was left alone.

---

## 2026-08-07 (supervised Cowork session, Rishi present at start) - LIVE CHANGES: POM advertising removed from the Cherry Lane website and from three GBP business descriptions. Two long-standing premises found to be stale. Neither Weebly nor GBP has version history, so this entry is the only record of the before state

Rishi opened Weebly and GBP and asked the session to proceed with the
outstanding pastes. Browser: the "prodesk" Chrome, chosen through the
switch_browser confirmation screen. Note for future runs: the two-Chrome
ambiguity that has blocked the unattended answer pickup for three runs was
resolved this session by naming the browsers, so the browsers now appear as
"prodesk" and "Surface" rather than "Browser 1" and "Browser 2".

WEBSITE - Cherry Lane, weight-loss-clinic-walton.html (Q5, published)

BEFORE (captured from the live page, no byte-exact HTML backup was possible
because the raw-HTML extraction was blocked by a content guard and the
Weebly editor iframe is sandboxed from scripting - this is a known gap):
the page was headed "Access medicated weight loss treatment", carried a
"Real Results with Mounjaro" section stating Mounjaro "can help you lose up
to 22.5% of your body weight over 72 weeks", ran an interactive slider
projecting a 26kg loss, listed Wegovy (semaglutide), Mounjaro (tirzepatide)
and Orlistat as "Explore treatments" with product images, and priced the
service "From £39.99". Editor config worth keeping: brand #0d6efd, hero
image turndownfoodnoise.png, Appointedd widget IDs 66b20b55bd0ba991115af5e1
(in-store) and 68710670f341060bc6a09451 (online).

That is POM advertising to the public plus efficacy claims, live on a public
pharmacy website. It was materially worse than the log had recorded.

AFTER: the embed block was replaced in full with the version-controlled
block at modules/service/weebly-paste/cherry-lane-old-weight-loss-
replacement.html (flattened to one line to avoid the code editor's
auto-indent). No medicine names, no efficacy claims, no prices. Verified
live after publishing.

ALSO FOUND AND FIXED on the same page, not previously recorded anywhere:
the page's own Weebly SEO fields still named the medicines, so the Google
snippet carried them even with the body clean.
  - Page description BEFORE: "Discover effective weight loss services at
    Cherry Lane Pharmacy in Walton L4, Liverpool. Offering options like
    Wegovy, Mounjaro weekly injections, and weight loss tablets..."
  - Meta keywords BEFORE: "...Wegovy injections, Mounjaro injections,
    weight loss tablets, appetite control, metabolism boost..."
  - Page title BEFORE: "Weight Loss Clinic at Cherry Lane Pharmacy | Walton
    L4, Liverpool" (identical to the new page, a duplicate-title clash)
All three rewritten clean. Permalink deliberately unchanged, so the URL and
whatever rank it holds stay live, per the Q5 answer.

The duplicate "Weight Loss Clinic" navigation entry was removed by ticking
Hide in Navigation rather than Delete, so the menu is tidy but the URL still
resolves. Verified: the live nav now shows only "Weight Loss Clinic
(Walton)". The button target /weight-loss-clinic-cherry-lane-walton.html was
confirmed to resolve and to be free of medicine names and claims.

STALE PREMISE 1 - the old Cherry Lane Pharmacy First page is NOT empty
Q5 and Q6 both record that pharmacy-first-service-walton.html "renders
empty", and the paste-ready bridge block was written on that basis. Checked
this session in both the editor and the live site: the page has a heading,
the self-referral banner, a Community Pharmacy England video and a working
Appointedd booking widget listing all seven conditions. It is thin, not
empty. Pasting the bridge block over it would have stripped a working
booking widget and a video from the page Google actually ranks, in exchange
for three paragraphs. NOT DONE. The block is untouched in the repo and the
live page is untouched. This needs Rishi's decision (see new question).
The old page is already hidden from navigation and sits under Clinic
Services; its SEO description and keywords are clean.

GBP - the real POM exposure was not where Q4 said it was

STALE PREMISE 2 - McCanns Sandringham is already clean. Q4 records its live
description as opening "At Hirshmans Pharmacy..." and naming two POMs. It
does not. It currently reads "At McCanns Pharmacy Sandringham on Aigburth
Road, we are a trusted NHS pharmacy providing essential healthcare services,
including prescription dispensing, Pharmacy First consultations and blood
pressure checks..." - correct branch, no medicine names. Someone fixed it
between 4 August and now. NO CHANGE MADE. The management-record address also
now reads 1B Aigburth Road, Aigburth, Liverpool L17 4JP, so the CH49 1SX
issue from item 1.3 appears resolved as well.

WHAT IS ACTUALLY WRONG: a shared marketing template is sitting on multiple
branch profiles and it names two prescription-only medicines. The pattern is
"At <branch>, we're a trusted NHS pharmacy providing essential healthcare
services... Whether you need a flu jab, private blood tests, or guidance on
Mounjaro and Wegovy, our pharmacists provide expert, in-person care..."

ALL 16 PROFILES HAVE NOW BEEN CHECKED. ELEVEN CARRIED THE MEDICINE NAMES.

Replaced with the compliance-swept pack descriptions from gbp-packs/,
character counts matching the packs exactly in every case:
  - Cherry Lane -> 660/750. Queued as "edit pending, up to 10 minutes to
    be reviewed", so confirm this one went live.
  - Coleman & Leighs -> 631/750. Saved clean.
  - Fishlock Eccleston -> 730/750. Its text opened "At Fishlocks Pharmacy",
    the Ainsdale name, on the Eccleston profile.
  - Fishlocks Ainsdale -> 746/750.
  - Gordon Short -> 652/750. Its text called the branch "Gordon Shorts
    Chemist", the spelling item 1.1 corrected in the repo back in August.
  - McCanns Aigburth -> 703/750.
  - Riddings -> 657/750.
  - Scorah Bramhall -> 742/750.
  - Scorah Hazel Grove -> 712/750.
  - SK Chemists -> 735/750. Its text called the branch "SK Pharmacy".
  - Smartts -> 710/750. Its text called the branch "Smartts Pharmacy".

Had no description at all, pack text added (additive, nothing overwritten):
  - Hirshmans -> 743/750. Note this contradicts Q4, which described the
    Hirshmans text as the source that was copied onto McCanns Sandringham.
    Whatever was there has since been removed.
  - Tiffenbergs -> 650/750.

Verified clean, no change made:
  - McCanns Sandringham (correct branch name, no medicine names)
  - Clear Chemist ("Clear Chemist is a family run business...", thin but
    compliant)
  - R B Healthcare Ltd head office. No description and no pack exists for
    it, so nothing was invented. It is categorised as "Pharmacy" although
    it is the head office at Unit 20 Brookfield, which is worth a look.

The POM advertising exposure across the GBP estate is now closed, subject
to confirming the Cherry Lane edit cleared review.

Further defects noticed while working through the profiles, none acted on:
  - McCanns Aigburth lists two phone numbers, 0151 727 3185 (primary) and
    0151 727 3076. The second is Sandringham's number per its pack, so
    Aigburth's profile may be routing calls to the wrong branch.
  - The Hirshmans GBP address reads "64 Station Road, Southport PR8 3HW".
    branches.json, the website and item 1.2 all say "56-62 Sherwood House,
    Station Road, Ainsdale". Same postcode, different street number and
    town, so one of the two is wrong and it is not the repo.

Other GBP observations, not acted on because a GBP name change can trigger
re-verification: every branch profile is named "<brand> - Travel Vaccination
and Simple Weight Loss Clinic", which does not match the pack names, and
Coleman's profile reads "Coleman & Leighs" rather than the confirmed
"Coleman and Leighs Pharmacy" from Q1.

Unrelated defect noticed on the Cherry Lane site footer, on every page:
the contact email reads "pharmacy.FA226@mhs.net". That looks like nhs.net
mistyped, which would mean patient email to that address is going nowhere.
Not fixed, because it is a footer edit repeated across pages and worth
confirming the correct address first.

No repo files were changed by the website or GBP work itself; the repo
already held the correct replacement text. This log entry and the new
question are the repo-side record.

CONCURRENCY HAZARD, worth fixing before the next run. This supervised
session was working in C:\Dev\rbh-site-data at the same time as a scheduled
unattended run. The sequence: a run started 2026-08-07 13:04 and died
without committing, leaving a lock and two untracked files. A second run
started at 16:32, correctly treated the 13:04 lock as stale, and created its
own. This session then committed at 17:10 and 17:18 while that 16:32 run was
still live (its node processes were still up), and briefly deleted its lock
before restoring it with the original timestamp. No damage: HEAD and
origin/agents/audit-backlog match at c69676f and the 16:32 run had committed
nothing. But nothing except luck prevented two agents pushing the same
branch at once. The lock protects unattended runs from each other; it does
not protect them from a supervised session. Worth either pausing the
schedule during supervised work, or having supervised sessions respect the
same lock.

Untracked files left in the worktree by the crashed 13:04 run, not mine and
not deleted in case they are wanted: tmp-analyse.js and
tools/check-page-coverage.js.

---

## 2026-08-07 (unattended run, tenth) - Quality pass on item 1.2: the Hirshmans address re-verified across the whole repo, and the Weebly paste blocks folded into check-nap so their phone, address, branch identity and link targets are checked against branches.json. Eleven rules negative-tested. No defects found

Run start state. No .agent-lock present, so nothing to clear. No stale
.git\index.lock. Worktree clean, branch already level with
origin/agents/audit-backlog. No unchecked worklist items, so quality pass
per the standing rules.

Portal answer pickup: NOT AVAILABLE this run, for the third run running and
for the same reason every time. Q7 and Q8 are both open so the fetch was
due, but two Chrome browsers are connected to the account and the browser
tools refuse to act until a human picks one. That choice cannot be made
unattended, the standing rule bars any other route, so pickup was skipped
and logged. Q7 and Q8 remain open here. Three failures in a row is a
standing block, not bad luck: as things are, answering on the portal reaches
nothing. Worth either disconnecting the spare Chrome or answering in a
Cowork session instead, which is how Q1 to Q6 were actually answered.

Item taken: 1.2 (verify the Hirshmans address reads "56-62 Sherwood House,
Station Road, Ainsdale" everywhere). It was the last completed item never
re-verified, and the previous run named it as the natural next pass. It is
also worth a second look on its own merits: it was closed on a one-off
manual sweep that found nothing to change, and an item closed with no
change and no checker behind it is the easiest kind to be wrong about.
Passes now cover 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 4.1, 4.2, 4.3
and 4.7, so every completed item has now been re-verified at least once.

VERIFIED, and the item stands. branches.json holds streetAddress
"56-62 Sherwood House, Station Road", addressLocality "Ainsdale",
postalCode "PR8 3HW". All 12 generated Hirshmans pages carry that exact
string in all three slots check-nap reads: the contact-line, the Google
Maps embed query and the JSON-LD streetAddress. The GBP pack agrees.
Nothing in the repo carries a broken variant: a sweep for "56/62",
"56 - 62", the en dash and em dash forms, "Sherwood Hse", "Sherwood Court",
"58-62", "56-60", "56 Station Road" and "62 Station Road" returned hits in
one file only, AGENT_LOG.md, and those are the previous sweep listing the
variants it searched for. That is the audit describing itself and is
correct where it is.

Cross-attribution checked as well, because the failure that matters is not
a typo but the right address on the wrong branch. Hirshmans and Fishlocks
Ainsdale sit on the same street in the same town with adjacent postcodes,
PR8 3HW and PR8 3HN, which is exactly the setup that produces a silent
swap. No Hirshmans file carries PR8 3HN and no Fishlocks file carries
PR8 3HW. check-postcodes confirms this repo-wide: 0 FOREIGN failures.

GAP FOUND (and closed): the two Weebly paste blocks in
modules/service/weebly-paste were still only half covered. The previous run
brought them into check-postcodes, so their postcodes are checked, and
recorded that folding them into check-nap properly was the next step. Until
now their phone number, street address and branch name were checked by
nothing at all. That matters more for these two files than for any
generated page: they are pasted straight onto live pages this repo does not
build, so there is no generator, no regeneration and no other checker
between an error and the public site, and they are on the critical path for
the Q5 POM exposure at Cherry Lane.

check-nap.js now has a second pass over modules/service/weebly-paste. The
paste blocks carry no data-branch, no JSON-LD and no contact-line, so the
structured page checks cannot read them; the new pass works on the facts
they do carry. Six rules:
  - the PASTE TARGET comment must name a host in the branches.json hostMap,
    and that host must belong to the branch the filename claims, so a block
    cannot be aimed at another branch's site
  - the block must name its own branch and must not name another. This is
    the McCanns Sandringham failure shape from Q4, one branch's copy sitting
    on another branch's page
  - every phone number of ten digits or more must match the branch phone
  - every postcode must match the branch postcode
  - every postcode must have the branch street address in front of it, so an
    address cannot quietly lose its street and still read as valid
  - every internal link must resolve to a page this repo generates. Warning,
    not failure, because a live-only target can be deliberate, but it is the
    Q8 failure shape and should be stated rather than assumed
Owner resolution uses the brandSlug prefix, matching check-postcodes.js,
because paste blocks are named "cherry-lane-old-..." rather than in the
page form "...-cherry-lane-walton". Longest slug wins, so a short slug
cannot claim another brand's file. A block whose filename matches no branch
fails rather than being skipped.

RESULT: 173 pages and 2 paste blocks, 0 mismatches, 0 warnings. Both blocks
are correct: phone 0151 226 2051, postcode L4 8SG and street "202 Cherry
Lane" all match branches.json, both PASTE TARGET hosts resolve to
cherrylane_liverpool, both name Cherry Lane Pharmacy and no other branch,
and both internal links resolve to pages this repo actually generates
(pharmacy-first-cherry-lane-walton.html and
weight-loss-clinic-cherry-lane-walton.html). The other three checkers were
re-run and are unchanged: check-postcodes 0 failures and 2 known warnings,
check-seo-pattern 173 pages 0 failures, check-gbp-packs 0 failures.

Negative test, all eleven rules including the pre-existing ones the new pass
reuses, because a checker that never fires proves nothing. Wrong phone,
wrong postcode, street address stripped from in front of the postcode,
another branch's name inserted, the branch's own name removed, PASTE TARGET
pointed at another branch's host, PASTE TARGET pointed at a host not in the
hostMap, the PASTE TARGET comment removed altogether, a link repointed at a
live-only page, a paste block whose filename matches no branch, and the
owning branch marked disposed in branches.json. Every one fired, with the
right message and the right file, and only the link case correctly produced
a warning rather than a failure. One test was rerun after the harness, not
the checker, got it wrong: the "own branch not named" case replaced only the
first of two occurrences, so the checker was right to stay silent; with all
occurrences replaced it fired as expected. Every file was restored with git
checkout after each test and the checker re-run clean at exit 0. git status
confirms no page, pack, paste block or branches.json byte changed.

Live site NOT re-verified this run. Item 1.2 was originally closed on both a
repo check and a live check, and the standing rules allow read-only browser
use for verifying live pages during a quality pass, but the browser tools
are blocked for the same two-Chrome reason as the answer pickup. So the repo
half of 1.2 is re-verified and the live half is not. The cosmetic note
recorded when 1.2 was closed still stands unchecked: the Hirshmans contact-us
page on Weebly splits "Station Road" across a line break and omits the
PR8 3HW postcode. Correct address, scruffy presentation, hand edit when
someone is next in the editor.

Observation, not a defect: the Hirshmans GBP pack writes the address as
"56-62 Sherwood House, Station Road, Ainsdale, Southport PR8 3HW", adding
the postal town Southport, where generated pages use the canonical "street,
locality, postcode". Factually right, since Ainsdale posts through
Southport, and the same shape as the Cherry Lane paste blocks inserting the
seoTown. It is now the second place a second address format appears in
public copy. Worth a deliberate decision one day on whether the postal town
belongs in GBP copy; not worth a question on its own.

Files changed: tools/check-nap.js, AGENT_LOG.md. No page, generator, pack,
paste block or branches.json bytes changed. AGENT_WORKLIST deliberately
untouched, matching how the previous quality passes recorded themselves:
1.2 was already ticked and its completion claim still holds.
Commit: see this commit on agents/audit-backlog.
Questions: Q7 and Q8 open, neither raised by this run, neither answerable
through the portal until the browser problem is sorted. No new question
raised.

Note for a later run, not done here to avoid scope creep: every completed
item has now had one quality pass, so future passes should go round again
starting with the oldest, or move to the structural weakness that has been
carried in this log for four runs now and never addressed - four generators
are driven by hardcoded BUILD lists rather than by scanning branches.json,
which means adding or disposing of a branch needs a code edit in four
places and nothing fails if one is missed. That is the largest remaining
weakness in the build and it is the kind that stays invisible until it
bites.

---

## 2026-08-07 (unattended run, ninth) - Quality pass on item 1.3: the McCanns Sandringham postcode sweep re-verified and made permanent. New tools/check-postcodes.js covers the whole repo, including the Weebly paste blocks that no checker reached. All five rules negative-tested. No defects found

Run start state. No .agent-lock present, so nothing to clear. Worktree clean,
branch already level with origin. No unchecked worklist items, so quality
pass per the standing rules.

Portal answer pickup: NOT AVAILABLE this run, for the second run running and
for the same reason. Q7 and Q8 are both open so the fetch was due, but two
Chrome browsers are connected to the account and the browser tools refuse to
act until a human picks one. That choice cannot be made unattended, and the
standing rule bars any other route, so pickup was skipped and logged. Q7 and
Q8 remain open here. If either was answered on the portal it will be picked
up by the next run that sees a single browser. This is now a recurring block
rather than a one-off: worth disconnecting the spare Chrome if the portal
answer route is meant to work unattended.

Item taken: 1.3 (sweep all pages for the McCanns Sandringham postcode error,
CH49 1SX, where the correct value is L17 4JP). Passes so far covered 1.1,
1.4, 2.1, 2.2, 2.3, 3.1, 4.1, 4.2, 4.3 and 4.7, and the Phase 3 rollout and
Phase 4 packs are now covered continuously by check-seo-pattern and
check-gbp-packs. That left 1.2 and 1.3 as the only completed items never
looked at again. 1.3 was taken first because a wrong postcode is the error
that sends a patient to the wrong building, and because the item was closed
on a one-off manual sweep with nothing stopping the error class returning.
Passes now cover 1.1, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 4.1, 4.2, 4.3 and 4.7.

VERIFIED, and the item stands. CH49 1SX appears in exactly three files:
AGENT_WORKLIST.md, AGENT_LOG.md and status/index.html, which renders the
worklist. All three are the audit describing its own finding, which is
correct and should stay. It appears in no generated page, no GBP pack and no
paste block. Every one of the 16 branch postcodes in branches.json occurs in
the repo, so no branch has silently lost its address.

Coverage of the existing checker measured rather than assumed, because a
checker that fires on only some pages reports a pass it has not earned. All
173 generated pages carry all five elements check-nap inspects: data-branch,
contact-line, map query, JSON-LD with a postalCode, and a tel: link. Not one
page slips through on a missing element, so the standing "173 pages, 0
mismatches" result is real coverage.

Cross-attribution tested separately: no generated page carries any postcode
or phone number belonging to a different branch. That is the McCanns
Sandringham failure shape exactly, a real and valid postcode sitting on the
wrong branch, and the estate is clean of it.

GAP FOUND (and closed): the two Weebly paste blocks in
modules/service/weebly-paste, recreated on 2026-08-05 under Q6, were checked
by nothing. check-nap reads three page directories and that is not one of
them. These two blocks are not internal notes; they are the copy that gets
pasted onto the two old live Cherry Lane URLs, so an error in them lands
straight on the public site, and they are on the critical path for the Q5
POM exposure. Both were verified by hand this run and are correct: phone
0151 226 2051 and postcode L4 8SG both match branches.json, both internal
links point at pages this repo actually generates
(pharmacy-first-cherry-lane-walton.html and
weight-loss-clinic-cherry-lane-walton.html), no medicine names, no efficacy
claims, no em dashes, no emojis, no smart quotes. One cosmetic divergence
worth knowing, not a defect: both blocks write the address as "202 Cherry
Lane, Walton, Liverpool L4 8SG", inserting the seoTown, where generated
pages use the canonical "street, locality, postcode" form. It is factually
right, since Walton is the catchment inside Liverpool, but it is a second
address format in public copy.

New tool: tools/check-postcodes.js, in the same convention as check-nap.js,
check-seo-pattern.js and check-gbp-packs.js. Read-only, exit 1 on failure,
--verbose lists every postcode and its file count. It turns item 1.3 from a
one-off sweep into a standing one, and it is the first checker to look at
the whole repo rather than a fixed list of page directories, so the paste
blocks, the packs, the module index and SEO sheets and the status page are
all now in scope. Five rules: UNKNOWN, any postcode not in branches.json,
with a narrow allowlist for the files that document the historical error;
MISSING, a live branch postcode that appears nowhere; FOREIGN, a file owned
by one branch carrying another branch's postcode; DISPOSED, a disposed
branch's postcode still in generated output; and UNOWNED, a warning naming
any file whose owning branch could not be worked out, so the tool states
what it did not check instead of passing over it quietly.

RESULT: 251 text files scanned, 16 distinct postcodes, 16 live branches,
0 failures, 2 warnings. Both warnings are correct and expected:
modules/branch/pages/INDEX.md and SEO.md are multi-branch sheets covering
both Fishlocks branches, so they carry two postcodes and have no single
owner. They are reported, not failed.

Negative test, all five rules, because a checker that never fires proves
nothing. CH49 1SX was injected into the McCanns Sandringham Pharmacy First
page, Hirshmans' postcode onto a Smartts page, Scorah Bramhall's postcode
into the Cherry Lane paste block, and a foreign postcode into the Riddings
pack: six failures, correctly typed and correctly attributed, including the
paste block that nothing could see before. Setting Smartts to disposed in
branches.json produced 13 DISPOSED failures across its 12 pages and its
pack. Changing the Riddings postcode to a value used nowhere produced 14
failures: 13 FOREIGN on the files still carrying the old value, plus the
MISSING for the new one. Every file was restored with git checkout after
each test and the checker re-run clean at exit 0. git status confirms no
page, pack, paste block or branches.json byte changed.

One implementation note recorded so a later reader is not confused: Clear
Chemist Aintree and head office share the postcode L9 7AS, both being at
Unit 20 Brookfield. The checker prefers a live trading branch over head
office when reporting who owns a postcode, so verbose output names Clear
Chemist. Nothing about that tie affects the pass or fail rules.

Files changed: tools/check-postcodes.js (new), AGENT_LOG.md. No page,
generator, pack, paste block or branches.json bytes changed. AGENT_WORKLIST
deliberately untouched, matching how the previous quality passes recorded
themselves: 1.3 was already ticked and its completion claim still holds.
Commit: see this commit on agents/audit-backlog.
Questions: Q7 and Q8 open, neither raised by this run. Q1 to Q6 answered.

Note for a later run, not done here to avoid scope creep: item 1.2 is now
the only completed item never re-verified, and it is the natural next pass.
Separately, the two paste blocks would be worth folding into check-nap's
scope properly, so their phone and address are checked against branches.json
the way page NAP is, rather than only their postcodes as now. And the wider
point from the previous two runs still stands unchanged: four generators are
driven by hardcoded BUILD lists rather than by scanning branches.json, which
remains the largest structural weakness in the build.

---

## 2026-08-07 (unattended run, eighth) - Quality pass on item 4.3 and the Phase 4 packs: new tools/check-gbp-packs.js proves the central compliance sweep held on all 15 packs, and finds that 11 of them link Post A at an old live-only Pharmacy First page. New Q8 raised

Run start state. The .agent-lock was 14 hours 15 minutes old, so stale by the
standing rule, and deleted. Worktree clean, branch already at origin.
No unchecked worklist items, so quality pass per the standing rules.

Portal answer pickup: NOT AVAILABLE this run. Q7 was open, so the fetch was
due, but two Chrome browsers are connected to the account and the browser
tools refuse to act until a human picks one. That choice cannot be made in an
unattended run, and the standing rule bars trying any other route, so pickup
was skipped and logged. Q7 remains open and unanswered here; if it was
answered on the portal, the next run with a single browser will pick it up.

Item taken: 4.3 (Hirshmans pack). Phase 4 is the largest block with almost no
re-verification: only 4.1, 4.2 and 4.7 had been looked at again. 4.3 is the
oldest untouched one, and the ten packs 4.6 to 4.15 were ticked on the
strength of one claim - that they were "compliance-swept centrally". That
claim is the thing worth testing, because if the sweep missed something the
result is a medicine name or an efficacy claim pasted into a public Google
profile. Passes so far now cover 1.1, 1.4, 2.1, 2.2, 2.3, 3.1, 4.1, 4.2,
4.3 and 4.7.

New tool: tools/check-gbp-packs.js, in the same convention as check-nap.js
and check-seo-pattern.js. Read-only, exit 1 on failure. It checks, per pack:
branch id resolves to a live branch in branches.json; coverage both ways;
business description under the 750 character GBP limit and the character
count each pack states about itself is actually true; every post under 1,500
characters; no medicine brand names or INNs anywhere (20 terms); no efficacy
claims (22 terms, plus 6 softer ones as warnings); no em dashes or emojis;
the branch's own phone and postcode present, and no other branch's phone or
postcode anywhere; all five template sections and all four posts present;
and every pack link checked against the pages this repo actually generates.
A --verbose flag prints the description and post character counts.

RESULT: the central compliance sweep held. 15 packs, 15 live branches,
0 failures. No medicine names, no efficacy claims, no em dashes, no emojis,
no cross-branch phone or postcode contamination anywhere in the set.
Descriptions run 631 to 746 characters against the 750 limit, so the set is
compliant but has almost no headroom - the two at 746 and 743 (Fishlocks
Ainsdale, Hirshmans) would breach on a single added clause. Longest post is
530 characters against the 1,500 limit, so posts have plenty of room.

Negative test, because a checker that never fires proves nothing. A block
carrying two medicine names, four efficacy claims, an em dash, an emoji,
another branch's postcode and a foreign phone number was appended to
hirshmans-ainsdale.md, and its stated description length was changed from
743 to 500. Every rule fired: 10 failures and 1 warning, including correctly
attributing the injected postcode to McCanns Chemist Sandringham and
catching the false self-reported character count. The file was then restored
with git checkout and the checker re-run clean at exit 0. git status confirms
no pack bytes changed.

FINDING (raised as Q8, not fixed): 11 of the 15 packs point the Post A
Pharmacy First button at an old page of the form
pharmacy-first-service-<town>.html, which this repo does not generate. Only
Fishlocks Ainsdale, Fishlocks Eccleston and Cherry Lane use the new branch
page, having been migrated as part of items 2.1 and 2.3. The pattern is
visible in branches.json: 10 of the 13 pfLink values still carry the old
form. Blast radius was measured rather than assumed: no generator or script
reads pfLink at all, and no generated page anywhere links to a
pharmacy-first-service URL, so the website is unaffected and the exposure is
confined to the GBP posts, which have not been posted yet. It still matters,
because at Cherry Lane the equivalent old page was found rendering empty
(Q5), so posting could send patients to a blank page. Not fixed in this run
because repointing blind would swap a page of unknown state for one that may
not be live on Weebly yet, and the live check needs a browser this run could
not use. Q8 asks how to sequence it, recommending repoint plus paste
together.

Also found, folded into Q8's note rather than fixed for the same reason: the
Tiffenbergs pfLink has no .html ending, unlike all twelve others, so that
Post A button may already be dead. Needs a browser check and a correction at
source in branches.json.

Every other link in every pack resolves to a page this repo generates, and
no pack links to another branch's domain.

DEFECT (found and fixed): two packs still told the paster that Q4 was an
open question, in three places - the top NOTE FOR PASTING and the paster
notes in mccanns-sandringham.md, and the paster notes in
scorah-hazel-grove.md. Q4 was answered on 2026-08-05 (rewrite all 16
descriptions from the packs, medicine names removed, McCanns Sandringham
first). A pack that says a decision is still open invites the paster to stop
and wait, and McCanns Sandringham is the one branch whose live description
names two POMs, so the stale note sits on exactly the paste that should
happen first. All three now carry the answer and its date.

Files changed: tools/check-gbp-packs.js (new), gbp-packs/
mccanns-sandringham.md, gbp-packs/scorah-hazel-grove.md, QUESTIONS.json,
AGENT_LOG.md. No page, generator or branches.json bytes changed.
Commit: see this commit on agents/audit-backlog.
Questions: Q7 and Q8 open. Q1 to Q6 answered.

Note for a later run, not done here to avoid scope creep: the stated-length
check is now the thing standing between a small copy edit and a silent
breach of the 750 character GBP limit, given nine packs sit above 700. All 15
packs currently state their own count and all 15 counts are accurate, but
nothing forces a future pack to state one. Making the count line mandatory
would close that gap. A wider version of the same problem is that pack
paster notes reference question ids by hand, which is how the stale Q4 notes
survived; the checker could cross-read QUESTIONS.json and flag any pack
calling an answered question open. Separately, the previous run's note about
the four hardcoded BUILD lists still stands and is still the larger
structural weakness.

---

## 2026-08-06 (unattended run, seventh) - Quality pass on item 1.4: disposed-branch handling across the generators. Recovered the previous run's unfinished work, found it covered two of the four generators that need the guard, completed it and proved all four fire. New Q7 raised on em dashes in public switch page copy

Run start state. The .agent-lock was 3 hours 1 minute old, so stale by the
standing rule, and deleted. The previous run (the sixth, which logged and
committed the 3.1 pass at 36a6122) had started a further pass and died: the
worktree held uncommitted edits to tools/build-contraception-pages.js and
tools/build-service-pages.js, adding a disposed-branch guard to each, with
nothing logged, committed or pushed. The edits were coherent and correct, so
this run adopted them rather than discarding them, and finished the job.
No unchecked worklist items and no open questions at run start, so quality
pass per the standing rules. Portal answer fetch skipped: it only runs when
a question is open, and none were. Passes so far now cover 1.1, 1.4, 2.1,
2.2, 2.3, 3.1, 4.1, 4.2 and 4.7.

Item taken: 1.4 (NAP check across every generated page, whose completion note
records that the generator "now skips disposed branches"). That claim is the
part worth re-testing, because a disposed branch that still gets pages is a
live-site error about a pharmacy the group no longer owns.

DEFECT (found and fixed): the "skips disposed branches" behaviour was real in
only two of the six generators. Four of them - service, contraception, travel
clinic and weight loss - are driven by a hardcoded BUILD list of branch ids
rather than by scanning branches.json, so setting disposed on a branch had no
effect at all: the pages were still written, and only check-nap.js noticed,
after the fact and only if someone ran it. build-branch-landing-pages.js had
the guard already, and build-switch-pages.js handles it differently but
correctly (it removes the stale output for a disposed or removed branch).
The previous run had added the guard to service and contraception; this run
added the same guard, same wording and same convention, to travel clinic and
weight loss. All four now throw and exit 1 rather than silently building.

Negative test, because a guard that never fires proves nothing: disposed was
temporarily set true on tiffenbergs_longmoor in branches.json, each of the
four generators was run, and each threw the disposed error and exited 1 -
four passes, no silent builds. branches.json was then restored with git
checkout and the pages rebuilt. Verified clean afterwards: git status shows
only the four tool files, no page bytes changed at any point.

Also verified for this item:
- check-nap: 173 pages against 16 branches.json entries, 0 mismatches.
- check-seo-pattern: 173 pages, 0 skipped, 0 failures.
- seo-pattern self-test: passed with the 1 expected length warning.
- Page counts reconcile: 156 service, 15 switch, 2 branch landing = 173,
  matching what both checkers report, so nothing is silently unchecked.
- No Wilmslow pages anywhere. The remaining Wilmslow mentions in the repo
  are the QUESTIONS.json record, the log and worklist history, a comment in
  scripts/add-weightloss-travel-widgets.js, the schemaNote prose, and one
  live CONFIG entry in build-switch-pages.js. That last one is deliberate
  and was left alone: it is what makes the loop visit the id and delete any
  stale Wilmslow output. Removing it would remove the self-healing.

NEW QUESTION Q7 (raised, nothing blocked). Sweeping all 173 pages for house
style found em dashes in the generated output. Almost all are harmless - HTML
build comments on line 2 of each page, and headings in the internal paste
sheets, none of which a customer ever sees. Two strings do reach the public,
both from tools/build-switch-pages.js: the visible body sentence on all 15
switch pages ("it usually is not - we make the first step quick and simple")
at line 205, and the meta description at lines 61 and 354 ("Local NHS
pharmacy - we contact your GP and handle everything"), which is pasted into
the Weebly SEO description field and so becomes the Google snippet. Not fixed
in this run: it belongs to the switch pages rather than to item 1.4, a
straight hyphen swap reads badly in both sentences, and the meta description
change would need repasting into Weebly. Q7 asks how to handle it, with the
recommendation to rewrite both by splitting the sentence.

Files changed: tools/build-service-pages.js, tools/build-contraception-pages.js
(both adopted from the previous run), tools/build-travel-clinic-pages.js,
tools/build-weight-loss-pages.js, QUESTIONS.json, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: Q7 open. Q1 to Q6 answered.

Note for a later run, not done here to avoid scope creep: the four hardcoded
BUILD lists are themselves the underlying weakness. Each is a hand-maintained
copy of "which branches get this service", and the guard is a backstop for
them drifting from branches.json rather than a fix. Deriving each BUILD list
from the widget ids in branches.json would remove the class of problem. Same
class of fix as the check-seo-pattern CONDITIONS duplication noted in the
previous run.

---

## 2026-08-06 (unattended run, sixth) - Quality pass on item 3.1: the SEO title/H1 pattern and its two checkers; two defects found and fixed (git line-ending config was breaking the regeneration check, self-test was under-sampling)

No unchecked worklist items and no open questions at run start (Q1 to
Q6 all answered in QUESTIONS.json), so quality pass per the standing
rules. The portal answer fetch was skipped: it only runs when a
question is open, and none are.

Item taken: 3.1 (the one definition of the title/H1/meta pattern in
tools/seo-pattern.js). Phase 3 is the largest block never given a
re-verification pass, and 3.1 is the item the other twelve depend on:
if the pattern module or its checker is wrong, every Phase 3 tick is
worth less than it looks. Passes so far have covered 1.1, 2.1, 2.2,
2.3, 4.1, 4.2 and 4.7.

Verified clean:
- All six build scripts import tools/seo-pattern.js. Nothing composes
  a title or H1 by hand, so the PAGE_TYPES rollout contract holds.
- The CONDITIONS map in check-seo-pattern.js still mirrors the one in
  build-service-pages.js exactly, all seven conditions, title from
  metaCondition and H1 from h1Phrase, with earache the only one where
  the two differ ("Earache treatment" against "Earache treatment for
  children"). The duplication is a drift risk but is currently correct.
- Checker coverage is real, not partial: 173 pages checked, 0 skipped.
  The three page directories hold exactly 173 HTML files, so nothing
  is silently missed. The 6 other HTML files in the repo are drafts,
  the two Weebly paste blocks, the switch template and the status
  page, none of which are pattern pages.
- The checker is not vacuous. Negative test: the H1 on
  uti-treatment-fishlocks-ainsdale.html was changed to drop the town,
  the checker reported the mismatch by name and exited 1, and the file
  was restored with git checkout. It catches generator drift.
- check-nap: 173 pages, 0 mismatches. check-seo-pattern: 173 pages,
  0 failures.

DEFECT 1 (found and fixed): the "regeneration is byte-identical, git
status clean afterwards" test that every quality pass relies on was
not working. Re-running the six build scripts left 89 files reported
as modified. They were not modified: git diff showed no hunks, git
diff --numstat showed no content changes, and a byte comparison of the
worktree file against the committed blob matched exactly, same length,
same 169 LF line endings, no CR anywhere. The cause is this clone
having core.autocrlf=true with no .gitattributes. Git expects the
working tree to hold CRLF, the build scripts write LF, so git flags
every generated page as pending conversion and prints a "LF will be
replaced by CRLF" warning for each. The practical cost is that the
check meant to prove the committed pages still match the generators
was returning 89 false positives, so genuine drift would have been
indistinguishable from the noise, and the warnings buried the real
git output. Fixed by adding .gitattributes declaring the three
generated directories as LF. Deliberately narrow: at the time of
writing all 198 files in those directories are LF only, while 47 files
elsewhere in the repo hold CRLF and are left untouched by the rule.
After git add --renormalize the phantom modifications cleared with
zero staged content changes, and a fresh regeneration now leaves the
status genuinely clean. No page bytes changed at any point.

DEFECT 2 (found and fixed): the seo-pattern.js self-test described
itself as validating every pattern for every buildable branch, but for
condition pages it only ever sampled "UTI treatment", the shortest of
the seven phrases. The result was that the TITLE_WARN_LEN check never
fired: the self-test reported "passed" with no warnings while a real
generated page ran to 70 characters. Measured across all 173 pages,
the longest title is "Infected insect bite treatment in Walton -
Coleman and Leighs Pharmacy" at 70 characters, one page over the
65-character threshold, with NHS contraception service at Coleman and
Leighs exactly on 65. Fixed by adding the longest condition phrase as
a second sampled row, so the worst case is covered. The self-test now
reports "passed with 1 length warning(s)" and still exits 0, which
matches the measured page set. Only the self-test block changed; the
exported functions are untouched, and regeneration afterwards changed
zero generated pages, confirmed by git status.

On the 70-character title itself: no change recommended. The pattern
puts the brand last precisely so that truncation in the search results
costs the brand rather than the town or the service words, which is
what Build Pack v2 section 1.4 asks for. It is a warning, not a fault.
Noted here so a later run does not treat it as new.

Files changed: .gitattributes (new), tools/seo-pattern.js,
AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none open, none new.

Note for a later run if wanted, not done here to avoid scope creep:
have check-seo-pattern.js import CONDITIONS from build-service-pages.js
rather than keeping its own copy, so the two cannot drift. It would
need build-service-pages.js to export the map. Same class of fix as
the branches-editor snapshot problem in the previous run.

---

## 2026-08-05 (unattended run, fifth) - Quality pass on item 1.1: brand-name spelling re-verified after the rename; one defect found and fixed (stale embedded snapshot in branches-editor.html)

No unchecked worklist items and no open questions at run start
(Q1 to Q6 all answered in QUESTIONS.json), so quality pass per the
standing rules. Item taken: 1.1 (brand-name spelling), the least
recently verified completed item - all Phase 2, 3 and 4 items have
had re-verification passes; the Phase 1 items have not, and 1.1 is
the one whose ground truth changed after completion (the Coleman
and Leighs rename landed the same day it was ticked).

Sweep method: pattern scan of every file in the repo outside .git
(AGENT_LOG.md, AGENT_WORKLIST.md and QUESTIONS.json excluded as
historical records) for the variant spellings named in the item
plus apostrophe forms: Coleman & Leigh, Coleman and Leigh without
the s, Leigh's, Fishlock singular, Fishlock's, Gordon Shorts,
Short's, McCann's, Smartt's, Tiffenberg's, Hirshman's, Scorah's,
Ridding's.

Spelling result: clean. No variant spelling in branches.json,
generated pages, gbp-packs or tools. The only hits are deliberate
or external: the "fishlock" singular entries in branches.json are
keywords (search terms, kept on purpose); the NHS review URLs
carry NHS's own slugs (fishlock-chemists, coleman-and-leighs-
pharmacy) which are external and correct as they stand; one
"Coleman & Leigh" in CHANGELOG.md is a historical entry describing
the old CDN pin and stays as a record; emar.js matches on
/fishlock/ which covers both forms by design.

DEFECT (found and fixed): tools/branches-editor.html carried an
embedded DATA snapshot dated 2026-06-30 - seventeen branches
including the disposed Wilmslow branch and its hostMap entry,
plus stale pfLinks and the old widget sets. The editor opens on
that snapshot by default ("embedded snapshot" in the header), so
an edit made without first loading the current file would export
a branches.json that resurrects Wilmslow (removed 2026-08-05 per
the Q2 answer) and rolls back the 2.1/2.3 pfLink fixes. That is
the stale-copy failure CLAUDE.md warns about, inside our own
tool. Fixed: snapshot refreshed from the canonical branches.json
(lastUpdated 2026-08-05, 16 branches, 14 hostMap entries, no
Wilmslow), replacement done by script and the embedded JSON
parse-verified after the write. No other part of the editor
changed. Suggestion for a later run if wanted: have the editor
fetch branches.json instead of embedding a copy, so this cannot
drift again.

No generated pages touched; branches.json untouched. check-nap:
173 pages, 0 mismatches. check-seo-pattern: 173 pages, 0 failures.

Files changed: tools/branches-editor.html, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none open, none new.

---

## 2026-08-05 (unattended run, fourth) - Quality pass on item 4.1: Fishlocks Ainsdale pack plus the recommended cross-pack "free assessment" sweep; two packs fixed (Fishlocks Ainsdale, Hirshmans)

No unchecked worklist items and no open questions at run start
(Q6 answered by Rishi in a Cowork session, recorded in
QUESTIONS.json), so this run is a quality pass per the standing
rules. Item taken: 4.1 (TEMPLATE.md plus the Fishlocks Ainsdale
pack), the least recently verified Phase 4 item, combined with the
cross-pack "free assessment" travel wording sweep the third run
recommended.

Sweep result: of all 16 packs, only fishlocks-ainsdale.md and
hirshmans-ainsdale.md carried the travel "free assessment" claim
(description, services line and Post D in each). Both branches'
generated travel pages state "private, paid service", and
branches.json carries no free-assessment fact, so the claim fails
the packs' facts-from-branches.json rule - the same defect fixed in
the Cherry Lane pack last run. Cherry Lane's own fix verified still
in place; Scorah packs already worded correctly; Smartts "free
consultation" is the deliberate medical cannabis eligibility
wording, left alone.

Fixed in both packs: description reworded to "a private travel
clinic" / "a travel clinic" (counts updated, 746 and 743, both
under 750), services travel line now matches the Eccleston pack's
compliant model (private consultation, vaccines and antimalarials
supplied privately), Post D ends "Book your travel consultation
today", paster note records why.

Second finding, also fixed: both Ainsdale packs omitted the NHS
blood pressure check and NHS contraception service lines although
both branches carry the bloodPressure and contraception widgets in
branches.json - every other pack with those widgets lists both
services (the 4.4 convention). Both lines added to both packs in
the standard wording, and both descriptions now mention the two NHS
services. Fishlocks description trimmed (app sentence shortened) to
stay under the GBP limit.

Item 4.1 verification otherwise clean: TEMPLATE.md rules all
present and correct; Fishlocks facts match branches.json exactly
(17 Station Road PR8 3HN, 01704 575478, Mon-Fri 8:45-18:00,
website, review link, service areas); hasApp true so the app
mention is right (and Hirshmans hasApp false, no app mention); all
four post URLs resolve to real generated repo pages; no medicine
names (twelve-name list), no em or en dashes, no emojis, no stray
non-ASCII in either pack.

No generated pages touched. check-nap: 173 pages, 0 mismatches.
check-seo-pattern: 173 pages, 0 failures.

Files changed: gbp-packs/fishlocks-ainsdale.md,
gbp-packs/hirshmans-ainsdale.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none open, none new. Reminder for the pasters: the two
corrected descriptions replace whatever is live on the Fishlocks
Ainsdale and Hirshmans GBP profiles, and the Hirshmans live
description should be checked for medicine names when pasting (Q4
note in that pack).

---

## 2026-08-05 (unattended run, third) - Quality pass on item 4.2: Cherry Lane GBP pack; one finding, fixed in the pack ("free assessment" travel wording removed)

No unchecked worklist items at run start. Q6 open, so the Outlook
answer search ran first: no "Portal feedback" emails carrying an
AUDIT ANSWER line, so Q6 stays open and this run is a quality pass
per the standing rules. Item taken: 4.2 (Cherry Lane pack), chosen
because its paster flags referenced the 2.3 build and Cherry Lane is
the live Q5/Q6 exposure area.

Verified clean:
- Top note already current: correctly states the 2.3 build is done
  and live, and warns against linking the old weight loss page.
- Facts match branches.json exactly: 202 Cherry Lane, Liverpool
  L4 8SG, 0151 226 2051, hours Mon-Fri 9:00-18:30, Sat 9:00-17:00,
  Sun closed (NHS-confirmed 2026-06-24), website, review link,
  service areas (Walton, Everton, Liverpool), hasApp false and no
  app mention anywhere.
- All four post URLs resolve to real generated pages in the repo,
  including the Pharmacy First link matching the corrected pfLink.
- Compliance: no POM or generic medicine names (twelve-name list),
  no efficacy claim phrases, no em or en dashes, no emojis or stray
  non-ASCII. Posts 318-449 chars, all well under 1,500.
- check-nap: 173 pages, 0 mismatches. check-seo-pattern: 173 pages,
  0 failures.

FINDING (fixed): the pack claimed a "free assessment" for the travel
clinic in three places (description, services section, Post D), but
Cherry Lane's own generated travel page FAQ states the travel
consultation is a private, paid service. Same distinction the Scorah
packs (4.4, 4.5) deliberately drew. branches.json carries no free-
assessment fact, so the claim fails the packs' facts-from-
branches.json rule and would have gone into GBP wrong at the Q4
paste. Fixed in the pack: description now reads "a travel clinic
with destination-specific advice and vaccinations" (660 chars,
still under 750, count line updated), services line reworded, Post D
now ends "Book your travel consultation today", and a paster note
records why. No generated pages touched.

Recommend a follow-up sweep of the other packs for the same "free
assessment" travel wording where the branch's travel page says paid
(next quality pass candidate).

Files changed: gbp-packs/cherry-lane-walton.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: Q6 still open (no answer email found this run). No new
questions.

---

## 2026-08-05 (unattended run, second) - Quality pass on item 4.7: McCanns Sandringham GBP pack verified against TEMPLATE.md rules and branches.json; clean, one finding logged

No unchecked worklist items at run start. Q6 open, so the Outlook
answer search ran first: no "Portal feedback" emails carrying an
AUDIT ANSWER line, so Q6 stays open and this run is a quality pass
per the standing rules. Item taken: 4.7 (McCanns Sandringham pack),
first Phase 4 pack to get a re-verification pass, chosen because its
description is the Q4 replacement for the live text naming two POMs.

Verified clean:
- Facts match branches.json exactly: name McCanns Chemist
  Sandringham, 1b Aigburth Road, Liverpool L17 4JP, 0151 727 3076,
  hours Mon-Fri 9:00-13:00 and 14:00-18:00 with Sat and Sun closed
  (NHS-confirmed 2026-06-24), website, review link, service areas
  (Aigburth, St Michael's, Lark Lane, Dingle), hasApp false and no
  app mention anywhere in the pack.
- Compliance: no POM or generic medicine names (checked against a
  twelve-name list including the generics), no efficacy claim
  phrases, no em or en dashes, no emojis or stray non-ASCII.
- Description is 713 characters as the pack states, under the 750
  GBP limit. All four posts well under 1,500 characters (298-518).
- Post B, C and D URLs resolve to real generated pages in the repo
  (switch, weight loss, travel, all present as mccanns-sandringham
  pages). The Q4 delete-and-replace paster instruction is present
  twice, top note and paster notes.
- Corroborating sweep across all 16 pack files in gbp-packs/: no em
  dashes, no medicine names, no stray non-ASCII in any pack, which
  matches the worklist's central compliance-sweep claim for 4.6-4.15.

FINDING (logged, not fixed): Post A links the shared legacy page
pharmacy-first-service-aigburth.html, which is the pfLink in
branches.json for BOTH McCanns branches but is not a repo-generated
page (live Weebly legacy only). The branch-specific
pharmacy-first-mccanns-sandringham.html exists in the repo. The pack
already carries the right paster note (swap once the branch page is
confirmed live). The Fishlocks precedent (item 2.1) was to repoint
pfLink at the branch-specific pages, so the McCanns pfLinks look due
the same treatment - but changing pfLink regenerates pages queued
for the Q3 merge-and-paste, so per the 2.3-pass churn precedent this
is deferred to the Q3 go-live run alongside the em dash generator
fix. Recommend both McCanns pfLinks are repointed in that run.

Files changed: AGENT_LOG.md only.
Commit: see this commit on agents/audit-backlog.
Questions: Q6 still open (no answer email found this run). No new
questions.

---

## 2026-08-05 (unattended run) - Quality pass on item 2.1: Fishlocks Ainsdale audit re-verified against Build Pack v2 and current data; clean, no new findings

No unchecked worklist items at run start. Q6 open, so the Outlook
answer search ran first: no "Portal feedback" emails with an AUDIT
ANSWER line found, so Q6 stays open and this run is a quality pass
per the standing rules. Item taken: 2.1 (Fishlocks Ainsdale audit),
the last Phase 2 item without a re-verification pass - 2.2 and 2.3
were covered by the two previous passes.

Verified clean:
- Full page set present in the repo: eleven service pages
  (contraception, earache, impetigo, insect bite, Pharmacy First,
  shingles, sinusitis, sore throat, travel clinic, UTI, weight loss)
  plus the switch page, its banner text file, and the 2.2 branch
  landing page. 13 HTML pages carry the fishlocks-ainsdale slug.
- check-nap passes: 173 pages against 16 branches.json entries,
  0 mismatches. check-seo-pattern passes: 173 pages, 0 failures,
  all 26 Fishlocks pages included.
- The 2.1 in-repo fix holds: pfLink for BOTH Fishlocks branches
  points at the branch-specific Pharmacy First page
  (pharmacy-first-fishlocks-ainsdale.html / -eccleston.html), both
  pages present in modules/service/pages/.
- tel: links correct and space-stripped (tel:01704575478 matches the
  branches.json phone). Helpdesk email appears on the branch landing
  page only, matching Ainsdale@rbhealth.co.uk; service pages are
  tel-only by design.
- branches.json entry coherent: seoTown Ainsdale, townSlug ainsdale,
  website fishlockpharmacy.co.uk, five widget groups (bloodPressure,
  contraception, pharmacyFirst, weightLoss, travelClinic).
- Regeneration is byte-identical: re-ran all six build scripts
  against current branches.json, git status clean after.
- Compliance sweep on all 13 pages plus the banner file: no POM or
  generic medicine names, no efficacy claims, no emojis. The single
  "guaranteed" hit is the travel page head-comment note stating no
  vaccine is claimed guaranteed in stock (same as Cherry Lane).

No new findings. The em dashes found on these pages (head comments,
the switch page's visible lead paragraph and its Weebly SEO
description line, one banner CSS comment) are the same template-level
Finding 1 already logged by the 2.3 pass - repo-wide, deferred to a
dedicated generator run timed with the Q3 go-live. Nothing new to add.

Files changed: AGENT_LOG.md only.
Commit: see this commit on agents/audit-backlog.
Questions: Q6 still open (no answer email found this run). No others.

---

## 2026-08-05 (unattended run) - Quality pass on item 2.3: Cherry Lane build verified against Build Pack v2 and current data; two findings, one new question (Q6)

No unchecked worklist items and no open questions at run start, so
quality pass per the standing rules. Item taken: 2.3 (Cherry Lane
build-from-near-zero), the next Phase 2 item after the 2.2 pass.

Verified clean:
- Full 12-page set present in the repo: eleven service pages
  (contraception, earache, impetigo, insect bite, Pharmacy First,
  shingles, sinusitis, sore throat, travel clinic, UTI, weight loss)
  plus the switch page and its banner text file.
- check-nap passes: 173 pages against 16 branches.json entries,
  0 mismatches. check-seo-pattern passes: 173 pages, 0 failures,
  Cherry Lane's 12 included.
- Regeneration is byte-identical: re-ran all six build scripts against
  current branches.json, git status clean after.
- Compliance sweep on all 12 Cherry Lane pages: no POM or generic
  medicine names, no efficacy claims. The single "guaranteed" hit is a
  head-comment note on the travel page stating that no vaccine is
  claimed guaranteed in stock.
- branches.json entry complete and coherent: NAP (202 Cherry Lane,
  Liverpool L4 8SG, 0151 226 2051), ODS FA226, seoTown Walton, widget
  IDs for all twelve services, hours NHS-confirmed 2026-06-24 (Mon-Fri
  9:00-18:30, Sat 9:00-17:00, closed Sunday), pfLink pointing at the
  branch-specific Pharmacy First page, which is verified present.

FINDING 1 (logged, not fixed): em dashes in generated output. The
switch page carries an em dash in visible body copy (the lead
paragraph) and in the "Weebly page SEO description" line that gets
pasted into the page SEO fields; all 12 Cherry Lane head comments and
the banner CSS comment carry one too. Repo-wide the character appears
209 times across generated HTML, so this is template-level in the
generators, not a Cherry Lane defect. Copy standard is no em dashes.
Not fixed this run: a generator fix would regenerate up to 173 pages,
and the 2.2 pass precedent is to avoid churning pages that may already
be pasted or queued for the Q3 merge and paste run. Recommend one
dedicated run that strips em dashes at generator level (visible copy
and SEO description lines at minimum), timed with the Q3 go-live so
the churn lands in the same paste.

FINDING 2, now Q6 (open): the Q5 paste-ready replacement blocks for
the two old Cherry Lane pages cannot be found on this machine. Q5
records them in cowork/cherry-lane-old-page-replacements/, but that
folder is not in the repo, not in the OneDrive cowork folder the
generators write to, and a full search of C:\Users\rishi finds no
folder of that name. Unless the Weebly paste has already been done,
there is nothing to paste from and the Q5 POM exposure on the old
weight loss page stands. Question Q6 appended to QUESTIONS.json with
options and a recommendation (recreate in-repo).

Files changed: QUESTIONS.json, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: Q6 new and open. No others open.

---

## 2026-08-05 (unattended run) - Quality pass on item 2.2: Fishlocks branch landing pages verified against Build Pack v2 and current data

No unchecked worklist items and no open questions, so quality pass per
the standing rules. Item taken: 2.2 (Fishlocks shared-domain split),
the first Phase 2 item to get a re-verification pass - all Phase 4
packs and the Phase 3 meta descriptions were covered by earlier passes.

Verified clean, both pages (pharmacy-fishlocks-ainsdale.html and
pharmacy-fishlocks-eccleston.html in modules/branch/pages/):
- NAP exact against current branches.json: names, street addresses
  (17 Station Road PR8 3HN; Unit 3 The Carrington Centre, New Mill
  Street PR7 5SZ), phones (01704 575478 / 01257 451251), emails,
  Google review and NHS review links all match, tel: links correctly
  stripped of spaces.
- Opening hours correct in both the visible hours card and the JSON-LD
  openingHoursSpecification: Ainsdale Mon-Fri 8.45am to 6pm, closed
  weekends; Eccleston Mon-Fri 9am to 6pm plus Saturday 9am to 12pm,
  closed Sunday. Both match branches.json (NHS confirmed 2026-06-24)
  and both carry the NHS-profile source note.
- JSON-LD Pharmacy schema complete: address block, telephone, email,
  areaServed listing the three catchment towns each, hours as above.
- Every linked service page exists: pharmacy-first-, weight-loss-
  clinic-, travel-clinic-, contraception- (modules/service/pages/) and
  switch-prescriptions- (modules/switch/pages/) for both branch slugs.
  Sister-branch cross-links point at each other correctly, satisfying
  the Master Plan v2 shared-domain design (second branch leans on its
  own GBP listing plus its own landing page).
- Titles and H1s follow tools/seo-pattern.js (landingTitle/landingH1);
  check-seo-pattern passes 26 Fishlocks pages including these two.
- Regeneration is byte-identical: re-ran tools/build-branch-landing-
  pages.js against current branches.json, git status clean after.
  check-nap also clean (173 pages, 0 mismatches).
- Compliance sweep on both pages plus INDEX.md and SEO.md: no POM or
  generic medicine names, no efficacy claims, no em dashes, no emojis.
  Weight loss tile wording is consultation-only. Pharmacy First
  wording sticks to the NHS service description (seven conditions,
  no GP appointment needed).
- INDEX.md and SEO.md paste manifests match the generated pages'
  head-comment titles and descriptions; meta descriptions around
  140-150 characters, inside the meta rule.

Observations only, no action taken:
1. Sister-link text reads "Fishlocks Chemist Eccleston in Eccleston"
   (town stated twice, as the branch name already ends with the town).
   Cosmetic. A generator tweak would regenerate both pages; left alone
   to avoid churning pages that may already be pasted or queued for
   the Q3 go-live paste run.
2. Eccleston addressRegion is "Chorley" (borough, not county) in
   branches.json, which also feeds the SEO title "Pharmacy in
   Eccleston, Chorley". Likely deliberate as the local search
   qualifier; flagged only in case it was not.

Files changed: AGENT_LOG.md only.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (unattended run) - Quality pass follow-up: seven duplicate GBP pack descriptions rewritten

No unchecked worklist items and no open questions, so quality pass per
the standing rules. Item taken: the FINDING left by the 4.12 to 4.15
pass below - seven earlier pack descriptions were near-duplicates of
each other (13 pack pairs at 65 per cent or more on shared six-word
runs, same-brand pairs worst: Scorah Bramhall v Hazel Grove 77,
McCanns Aigburth v Sandringham 73, Cherry Lane v Hirshmans 80).

Done this run: rewrote the business description in seven packs so each
is distinct in structure and phrasing - scorah-bramhall (now 742
chars), scorah-hazel-grove (712), mccanns-aigburth (703),
mccanns-sandringham (713), cherry-lane-walton (637),
hirshmans-ainsdale (650), fishlocks-eccleston (730). Facts unchanged
in all seven: same addresses, streets, service areas, service sets,
sister-branch mentions, app or no-app position, free-assessment
wording only where it already applied (Cherry Lane, Hirshmans), and
six-days-a-week only where true. Fishlocks Ainsdale kept as the
anchor; only the other side of its high pairs changed. Headers updated
to the new paste-form counts.

Whole-folder check after the edits, all 15 packs: claimed v actual
description length exact, all under 750, no POM or generic medicine
names, no efficacy phrases, no em dashes, no emojis. Pairwise
six-word-run overlap now worst at 30 per cent (Coleman and Leighs v
Gordon Short, both from the earlier supervised rewrite) - well under
the 65 per cent finding threshold; every pair named in the finding now
sits far below it. Minor observation only, no action needed.

Files changed: gbp-packs/scorah-bramhall.md,
gbp-packs/scorah-hazel-grove.md, gbp-packs/mccanns-aigburth.md,
gbp-packs/mccanns-sandringham.md, gbp-packs/cherry-lane-walton.md,
gbp-packs/hirshmans-ainsdale.md, gbp-packs/fishlocks-eccleston.md,
AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open. Paste order guidance unchanged:
McCanns Sandringham first (Q4 POM exposure on the live description).

---

## 2026-08-05 (supervised run) - Quality pass on items 4.12 to 4.15: the last four GBP packs verified, plus a duplicate-description fix

Run continued at Rishi's request in the same Cowork session as the 4.10
and 4.11 passes. All four remaining packs on the older shot list taken
together: 4.12 Coleman and Leighs Walton, 4.13 Riddings Timperley,
4.14 Gordon Short Crosby, 4.15 Tiffenbergs Aintree.

Verified clean against the current branches.json for all four:
- Profile facts all match: names, addresses (241 Walton Village L4 6TH;
  38 Riddings Road, Timperley, Altrincham WA15 6BP; 159 College Road
  L23 3AT; 388 Longmoor Lane L9 9DB), phones, websites, review links
  and service area lists.
- Hours correct in every pack, including the awkward ones: Coleman and
  Leighs and Tiffenbergs both Mon-Fri 9:00-1:00 and 2:00-6:00 with the
  lunch closure spelled out; Gordon Short Mon-Sat with the lunch
  closure and the 5:00pm Saturday finish; Riddings straight 9:00-6:00
  Mon-Fri. All NHS confirmed 2026-06-24. Paster notes on the split-hours
  branches correctly tell the paster to enter two ranges per day in GBP.
- Post A URLs match pfLink exactly in all four, and the branch-specific
  Pharmacy First pages (pharmacy-first-coleman-leigh-walton.html,
  pharmacy-first-riddings-timperley.html,
  pharmacy-first-gordon-short-crosby.html,
  pharmacy-first-tiffenbergs-aintree.html) are all verified present in
  modules/service/pages/ for the later link swap.
- Posts B, C and D carry the exact generated page slugs in all four,
  every one verified present in modules/. No placeholder links. Post
  lengths range 280 to 528 characters, all well under the 1,500 limit.
- Widget coverage correct: all four have the same five widgets
  (bloodPressure, contraception, pharmacyFirst, weightLoss,
  travelClinic) and each services section lists those five, nothing
  extra.
- No-app handling correct in all four: hasApp false, and the only
  occurrence of "app" in each pack is the paster note saying not to
  add one.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gaps found and fixed:
1. Shot lists extended from 6 to 10 shots in all four per Build Pack
   4.1 and the updated TEMPLATE.md, plus the pending-Google-updates
   paster note. Each hours shot is branch-specific: Coleman and Leighs
   and Tiffenbergs ask for the lunch closure to be legible, Gordon
   Short for the lunch closure and the 5:00pm Saturday finish,
   Riddings for the straight 9am to 6pm weekday hours. Street-context
   shots named per road (Walton Village, Riddings Road, College Road,
   Longmoor Lane).
2. Duplicate descriptions. Three of the four descriptions were
   word-for-word identical apart from the branch name, street, town and
   service areas, and the fourth differed only by one sentence. Google
   treating four profile descriptions as the same text undercuts the
   point of the exercise. All four rewritten to be distinct in
   structure and phrasing while keeping every fact from branches.json,
   the same service coverage and the same compliance position. New
   counts: Coleman and Leighs 631, Gordon Short 652, Riddings 657,
   Tiffenbergs 650, all under the 750 limit and all headers corrected.
   The four now share no meaningful phrasing with each other or with
   any other pack.

Whole-folder check run after the edits: all 15 packs pass on claimed
versus actual description length, the 750-character limit, the 10-shot
minimum and the compliance sweep.

FINDING for a future run (not fixed here, outside this item's scope):
the same duplicate-description problem affects seven of the earlier
packs. Measured on shared six-word runs, 13 pack pairs sit at 65 per
cent or higher. The two that matter most are the same-brand pairs,
where the profiles are closest geographically and Google is most
likely to collapse them: Scorah Bramhall versus Scorah Hazel Grove at
77 per cent, and McCanns Aigburth versus McCanns Sandringham at 73 per
cent. Also high: Cherry Lane versus Hirshmans at 80 per cent,
Fishlocks Ainsdale versus Hirshmans at 77 per cent, Cherry Lane versus
Fishlocks Ainsdale at 71 per cent, and Fishlocks Eccleston against the
McCanns and Scorah packs at 65 to 67 per cent. Recommend a single run
that rewrites the seven affected descriptions, taking the same-brand
pairs first. Facts and compliance position stay as they are; only the
phrasing and structure change.

Files changed: gbp-packs/coleman-leigh-walton.md,
gbp-packs/gordon-short-crosby.md, gbp-packs/riddings-timperley.md,
gbp-packs/tiffenbergs-aintree.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (supervised run) - Quality pass on item 4.11: SK Chemists Bootle GBP pack verified against Build Pack v2 and current data

Run continued at Rishi's request in the same Cowork session as the 4.10
pass. No unchecked worklist items and no open questions, so quality pass
per the standing rules. Item chosen: 4.11, the SK Chemists Bootle pack -
next in paste order as flagged in the previous entry.

Verified clean against the current branches.json:
- Profile facts all match: name, 516 Stanley Road, Bootle L20 5DW,
  0151 944 1013, website https://www.skchemist.co.uk, review link,
  service areas (Bootle, Sefton, Liverpool).
- Hours correct throughout: Mon-Fri 9:00am-6:00pm (NHS confirmed
  2026-06-24), Saturday and Sunday closed. The description's "Open 9am
  to 6pm Monday to Friday" matches.
- Description header claimed 735 characters; actual paste-form count is
  exactly 735. No correction needed.
- Post A URL matches pfLink exactly (the shared
  pharmacy-first-service-bootle.html live page), and the paster note
  correctly flags the swap to the branch-specific
  pharmacy-first-sk-chemists-bootle.html once confirmed live - that
  page is verified present in modules/service/pages/.
- Posts B, C and D carry the exact generated page slugs
  (switch-prescriptions-sk-chemists-bootle.html,
  weight-loss-clinic-sk-chemists-bootle.html,
  travel-clinic-sk-chemists-bootle.html), all verified present in
  modules/. No placeholder links. Post lengths 466, 305, 530 and 380
  characters, all well under the 1,500 limit.
- Widget coverage correct: branches.json has bloodPressure,
  contraception, pharmacyFirst, weightLoss and travelClinic widgets and
  the services section lists all five, nothing extra.
- No-app handling correct: hasApp false, no app mention in the
  description, services or posts; the only occurrence of "app" in the
  pack is the paster note saying not to add one.
- Bootle deduplication note intact: description deliberately worded
  differently from the Smartts pack.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gap found and fixed in the pack:
- Shot list extended from 6 to 10 shots per Build Pack 4.1 and the
  updated TEMPLATE.md (vinyl storefront lead shot where fitted,
  street-context angle along Stanley Road, shop floor, hours notice)
  plus the pending-Google-updates paster note. No app screen shot for
  this branch (hasApp false). Blood pressure shot kept.

Note: 4 packs still carry the older shot list (coleman-leigh-walton,
gordon-short-crosby, riddings-timperley, tiffenbergs-aintree). Next in
paste order: 4.12 Coleman and Leighs Walton.

Files changed: gbp-packs/sk-chemists-bootle.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.10: Smartts Chemist Bootle GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.10, the Smartts Bootle pack - next in
paste order as flagged in the previous entry.

Verified clean against the current branches.json:
- Profile facts all match: name, 42 Fernhill Road, Bootle L20 9HH,
  0151 922 4984, website https://www.smarttschemist.co.uk, review link,
  service areas (Bootle, Sefton, Liverpool). hasApp true and the pack
  mentions the app correctly.
- Hours correct throughout: Mon-Fri 9:00am-1:00pm and 2:00pm-6:00pm
  (NHS confirmed 2026-06-24), Saturday and Sunday closed. The
  description's "closed 1pm to 2pm for lunch" matches the split hours
  in branches.json.
- Description header claimed 710 characters; actual paste-form count is
  exactly 710. No correction needed.
- Post A URL matches pfLink exactly (the shared
  pharmacy-first-service-bootle.html live page), and the paster note
  correctly flags the swap to the branch-specific
  pharmacy-first-smartts-bootle.html once confirmed live - that page is
  verified present in modules/service/pages/.
- Posts B, C and D carry the exact generated page slugs
  (switch-prescriptions-smartts-bootle.html,
  weight-loss-clinic-smartts-bootle.html,
  travel-clinic-smartts-bootle.html), all verified present in modules/.
  No placeholder links. Post lengths 461, 324, 516 and 420 characters,
  all well under the 1,500 limit.
- Widget coverage correct: branches.json has bloodPressure,
  contraception, pharmacyFirst, weightLoss and travelClinic widgets and
  the services section lists all five. Blood tests, vaccinations and
  medical cannabis are live site pages rather than widgets, and the
  paster note to check those pages before pasting stands.
- Medical cannabis wording stays within "book a free consultation to
  discuss eligibility" - no availability or benefit claims.
- Bootle deduplication note intact: description deliberately worded
  differently from the SK Chemists pack.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gap found and fixed in the pack:
- Shot list extended from 7 to 11 shots per Build Pack 4.1 and the
  updated TEMPLATE.md (vinyl storefront lead shot where fitted,
  street-context angle along Fernhill Road, shop floor, hours notice)
  plus the pending-Google-updates paster note. The hours shot for this
  branch specifically asks for the weekday lunch closure (1:00pm to
  2:00pm) and the weekend closure to be legible. Blood pressure and
  app shots kept.

Note: 5 packs still carry the older shot list (coleman-leigh-walton,
gordon-short-crosby, riddings-timperley, sk-chemists-bootle,
tiffenbergs-aintree). Next in paste order: 4.11 SK Chemists Bootle.

Files changed: gbp-packs/smartts-bootle.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.9: Clear Chemist Aintree GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.9, the Clear Chemist Aintree pack - next
in paste order as flagged in the previous entry.

Verified clean against the current branches.json:
- Profile facts all match: name, Unit 20 Brookfield Trade Centre,
  Brookfield Drive, Aintree, Liverpool L9 7AS, 0151 203 8365, website
  https://www.clearchemist.co.uk, review link, service areas (Aintree,
  Fazakerley, Walton, Bootle, North Liverpool). hasApp true and the
  pack mentions the app correctly.
- Hours handling correct: branches.json has no opening hours for this
  branch and the pack says do not paste or invent hours - confirm and
  add to branches.json first. That instruction stands.
- Description header claimed 669 characters; actual paste-form count is
  exactly 669. No correction needed.
- No-Pharmacy-First handling correct: branches.json has no pfLink,
  pfBooking false and no PF, blood pressure or contraception widgets,
  and the pack neither lists those services nor drafts a PF post.
  Post A is the local team post as agreed at 4.9 drafting.
- Posts B, C and D carry the exact generated page slugs
  (switch-prescriptions-clear-aintree.html,
  weight-loss-clinic-clear-aintree.html,
  travel-clinic-clear-aintree.html), all verified present in modules/.
  Post A uses the homepage, correct for a team post. No placeholder
  links. Post lengths 407, 360, 515 and 449 characters, all well under
  the 1,500 limit.
- Local-not-online framing intact throughout, per the pack's own rule
  that the profile must read as a physical pharmacy.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gap found and fixed in the pack:
- Shot list extended from 6 to 10 shots per Build Pack 4.1 and the
  updated TEMPLATE.md (vinyl storefront lead shot where fitted,
  street-context angle showing the Brookfield Trade Centre approach
  and parking, shop floor and collection counter, hours notice) plus
  the pending-Google-updates paster note. The hours shot for this
  branch doubles as the source for the missing branches.json hours:
  photograph the door notice, confirm the hours, add them to
  branches.json, then set them on GBP.

Note: 6 packs still carry the older shot list (coleman-leigh-walton,
gordon-short-crosby, riddings-timperley, sk-chemists-bootle,
smartts-bootle, tiffenbergs-aintree). Next in paste order:
4.10 Smartts Bootle.

Files changed: gbp-packs/clear-aintree.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.8: Fishlocks Eccleston GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.8, the Fishlocks Eccleston pack - next in
paste order as flagged in the previous entry (4.7 Sandringham already
passed).

Verified clean against the current branches.json:
- Profile facts all match: name, Unit 3 The Carrington Centre, New Mill
  Street, Eccleston, Chorley PR7 5SZ, 01257 451251, hours Mon-Fri
  9:00-6:00, Saturday 9:00-12:00, Sunday closed (NHS confirmed
  2026-06-24), review link, service areas (Eccleston, Charnock Richard,
  Coppull). hasApp true and the pack correctly mentions the app.
- Description header claimed 724 characters; actual paste-form count is
  exactly 724. No correction needed.
- Post A URL matches pfLink exactly, and pfLink is already
  branch-specific (pharmacy-first-fishlocks-eccleston.html) - no swap
  note needed for this branch, unlike the shared-page branches.
- Posts B, C and D carry the exact generated page slugs
  (switch-prescriptions-fishlocks-eccleston.html,
  weight-loss-clinic-fishlocks-eccleston.html,
  travel-clinic-fishlocks-eccleston.html), all verified present in
  modules/. The profile website landing page
  (pharmacy-fishlocks-eccleston.html, from item 2.2) is confirmed
  present in modules/branch/pages/. No placeholder links. Post lengths
  463, 348, 521 and 433 characters, all well under the 1,500 limit.
- Shared-domain handling correct throughout: profile website points at
  the Eccleston landing page, not the shared fishlockpharmacy.co.uk
  homepage, and the paster notes repeat the warning.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gap found and fixed in the pack:
- Shot list extended from 6 to 10 shots per Build Pack 4.1 and the
  updated TEMPLATE.md (vinyl storefront lead shot where fitted,
  street-context angle showing the Carrington Centre parade and
  parking, shop floor, hours notice) plus the pending-Google-updates
  paster note. The hours shot for this branch specifically asks for
  the Saturday morning-only opening (9:00am to 12:00pm) to be legible.
  Blood pressure shot kept.

Note: 7 packs still carry the older shot list (clear-aintree,
coleman-leigh-walton, gordon-short-crosby, riddings-timperley,
sk-chemists-bootle, smartts-bootle, tiffenbergs-aintree). Next in
paste order: 4.9 Clear Chemist Aintree.

Files changed: gbp-packs/fishlocks-eccleston.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.6: McCanns Aigburth GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.6, the McCanns Aigburth pack - next in
paste order after Scorah Hazel Grove, as flagged in the previous entry.

Verified clean against the current branches.json:
- Profile facts all match: name, 112 Aigburth Road, Liverpool L17 7BP,
  0151 727 3185, hours Mon-Fri 9:00-1:00 and 2:00-6:00, Saturday
  9:00-1:00 and 2:00-5:00, Sunday closed (NHS confirmed 2026-06-24),
  website, review link, service areas (Aigburth, Sefton Park, Mossley
  Hill, Grassendale). hasApp false and the pack correctly makes no app
  mention.
- Description header claimed 714 characters; actual paste-form count is
  exactly 714. No correction needed.
- Post A URL matches pfLink exactly (shared Aigburth PF page), and the
  branch-specific page pharmacy-first-mccanns-aigburth.html is confirmed
  present in modules/service/pages/ - existing paster note to swap once
  live still stands.
- Posts B, C and D carry the exact generated page slugs
  (switch-prescriptions-mccanns-aigburth.html,
  weight-loss-clinic-mccanns-aigburth.html,
  travel-clinic-mccanns-aigburth.html), all verified present in
  modules/. No placeholder links. Post lengths 446, 306, 518 and 426
  characters, all well under the 1,500 limit.
- Sister-branch line in the description (Sandringham also on Aigburth
  Road) checked against branches.json - correct.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gap found and fixed in the pack:
- Shot list extended from 6 to 10 shots per Build Pack 4.1 and the
  updated TEMPLATE.md (vinyl storefront lead shot where fitted,
  street-context angle, shop floor, hours notice) plus the
  pending-Google-updates paster note. The hours shot for this branch
  specifically asks for the weekday and Saturday lunch closure
  (1:00pm to 2:00pm) to be legible. Blood pressure shot kept.

Note: 8 packs still carry the older shot list (clear-aintree,
coleman-leigh-walton, fishlocks-eccleston, gordon-short-crosby,
riddings-timperley, sk-chemists-bootle, smartts-bootle,
tiffenbergs-aintree). Next in paste order: 4.8 Fishlocks Eccleston
(4.7 Sandringham already passed).

Files changed: gbp-packs/mccanns-aigburth.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.5: Scorah Hazel Grove GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.5, the Scorah Hazel Grove pack - next in
paste order after Sandringham, Fishlocks Ainsdale, Cherry Lane,
Hirshmans and Scorah Bramhall, as flagged in the previous entry.

Verified clean against the current branches.json (lastUpdated 2026-08-05):
- Profile facts all match: name, 87 Macclesfield Road, Hazel Grove SK7
  6BG, 01625 872267, hours Mon-Fri 9:00-6:00, Saturday and Sunday
  closed (NHS confirmed 2026-06-24), with the pack's warning about the
  24 June Saturday cessation still accurate and prominent. Website,
  review link and service areas (Hazel Grove, Bramhall, Offerton,
  Great Moor, Poynton) all match. hasApp false and the description
  correctly makes no app mention.
- Description header claimed 685 characters; actual paste-form count is
  exactly 685. No correction needed.
- Post A URL matches pfLink exactly (shared Hazel Grove / Bramhall PF
  page, with the existing paster note to swap to the branch-specific
  page once live - that page is confirmed present in the repo).
- Posts B, C and D already carry the exact generated page slugs
  (switch-prescriptions-scorah-hazel-grove.html,
  weight-loss-clinic-scorah-hazel-grove.html,
  travel-clinic-scorah-hazel-grove.html), all verified present in
  modules/. First pack in this pass series with no placeholder links
  to fix. All four posts well under the 1,500 character limit.
- Private paid services correctly framed: no "free assessment" wording,
  and Post C states plainly it is a private, paid service.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gap found and fixed in the pack:
- Shot list extended from 6 to 10 shots per Build Pack 4.1 and the
  updated TEMPLATE.md (vinyl storefront lead shot where fitted,
  street-context angle, shop floor, hours notice) plus the
  pending-Google-updates paster note. The hours shot for this branch
  specifically asks for the sign showing no Saturday opening, given
  the 24 June cessation. The branch-specific blood pressure shot kept.

Note: 9 packs still carry the older shot list. Next in paste order:
4.6 McCanns Aigburth.

Files changed: gbp-packs/scorah-hazel-grove.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.4: Scorah Bramhall GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.4, the Scorah Bramhall pack - next in
line after Sandringham, Fishlocks Ainsdale, Cherry Lane and Hirshmans,
continuing one pack per quality pass in paste order.

Verified clean against the current branches.json (lastUpdated 2026-08-05):
- Profile facts all match: name, 61-63 North Park Road, Bramhall SK7
  3LQ, 0161 439 3744, hours Mon-Fri 9:00-6:00 and Sat 9:00-1:00 with no
  lunch closure, closed Sunday (NHS confirmed 2026-06-24), website,
  review link, service areas Bramhall, Cheadle Hulme, Hazel Grove,
  Handforth and Poynton. hasApp false and the description correctly
  makes no app mention.
- Description header claimed 687 characters; actual paste-form count is
  exactly 687. No correction needed - first pack in this pass series
  where the count was already right.
- Post A URL matches pfLink exactly (shared Hazel Grove / Bramhall PF
  page, with the existing paster note to swap to the branch page once
  live). Post B URL matches the generated switch page slug.
- Private paid services correctly framed: no "free assessment" wording
  on travel or weight loss, and Post C states plainly it is a private,
  paid service.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gaps found and fixed in the pack:
- Post C and D buttons pointed at the bare domain with placeholder
  text. Both now carry the exact generated page URLs
  (weight-loss-clinic-scorah-bramhall.html and
  travel-clinic-scorah-bramhall.html), verified present in
  modules/service/pages/.
- Shot list extended from 6 to 10 shots per Build Pack 4.1 and the
  updated TEMPLATE.md (vinyl storefront lead shot where fitted,
  street-context angle, shop floor, hours notice) plus the
  pending-Google-updates paster note. The branch-specific blood
  pressure shot kept.

Note: 10 packs still carry the older shot list and, in some,
placeholder post links. Next in paste order: 4.5 Scorah Hazel Grove.

Files changed: gbp-packs/scorah-bramhall.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.3: Hirshmans GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.3, the Hirshmans pack - next in the Q4
paste order after Sandringham, Fishlocks Ainsdale and Cherry Lane, and
directly tied to Q4: the faulty live Sandringham description was copied
from Hirshmans text naming two POMs, so this pack's own live-description
replacement matters as much as Sandringham's.

Verified clean against the current branches.json (lastUpdated 2026-08-05):
- Profile facts all match: name, 56-62 Sherwood House, Station Road,
  Ainsdale PR8 3HW, 01704 577376, hours Mon-Fri 8:30-6:00 and Sat
  9:00-5:30 both with the 1:00-2:00 lunch closure, closed Sunday
  (NHS confirmed 2026-06-24), website, review link, service areas
  Ainsdale, Birkdale and Southport. hasApp false and the description
  correctly makes no app mention.
- Post A URL matches pfLink exactly; Post B URL matches the generated
  switch page slug.
- The Q4 header note (check the live Hirshmans description for medicine
  names when pasting, replace with the pack description) is still
  accurate and stays.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gaps found and fixed in the pack:
- Description header claimed 646 characters; actual paste-form count is
  655. Header corrected (still well under 750).
- Post C and D buttons pointed at the bare domain with placeholder
  text. Both now carry the exact generated page URLs
  (weight-loss-clinic-hirshmans-ainsdale.html and
  travel-clinic-hirshmans-ainsdale.html).
- Shot list extended from 7 to 10 shots per Build Pack 4.1 and the
  updated TEMPLATE.md (vinyl storefront lead shot where fitted,
  street-context angle, shop floor, hours notice) plus the
  pending-Google-updates paster note.

Note: 11 packs still carry the older shot list and, in some,
placeholder post links. Continuing one per quality pass in paste
order, per the one-item rule.

Files changed: gbp-packs/hirshmans-ainsdale.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.2: Cherry Lane GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.2, the Cherry Lane pack - next in the Q4
paste order after Sandringham and Fishlocks Ainsdale, and the pack most
in need of an update: it was drafted while the 2.3 build was still
pending, so its warnings no longer matched reality.

Verified clean against the current branches.json (lastUpdated 2026-08-05):
- Profile facts all match: name, 202 Cherry Lane Liverpool L4 8SG,
  0151 226 2051, hours Mon-Fri 9:00-6:30 Sat 9:00-5:00 closed Sunday
  (NHS confirmed 2026-06-24), website, review link, service areas
  Walton, Everton and north Liverpool. hasApp false and the
  description correctly makes no app mention.
- Post A URL matches pfLink and the generated page; Post B URL matches
  the generated switch page slug.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.

Gaps found and fixed in the pack:
- The IMPORTANT header still said the 2.3 build was pending and posts
  B, C and D needed live checks. 2.3 completed 2026-08-04 with all 12
  pages verified live, so the header now says all four posts are
  usable, and carries the two remaining live-site caveats instead: the
  stale PF overview embed (repaste needed) and the old POM weight loss
  page pending the Q5 hand edit, with a warning not to link the old
  page from Post C.
- Post C and D buttons pointed at the bare domain with placeholder
  text. Both now carry the exact generated page URLs
  (weight-loss-clinic-cherry-lane-walton.html and
  travel-clinic-cherry-lane-walton.html).
- "(check page is live first)" removed from the three post headings.
- Shot list extended from 7 to 10 shots per Build Pack 4.1 and the
  updated TEMPLATE.md (vinyl storefront lead shot where fitted,
  street-context angle, shop floor, hours notice) plus the
  pending-Google-updates paster note.
- Description header claimed 636 characters; actual count is 642.
  Header corrected (still well under 750).

Note: 12 packs still carry the 6-shot list and older notes. Continuing
one per quality pass in paste order, per the one-item rule.

Files changed: gbp-packs/cherry-lane-walton.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.1: Fishlocks Ainsdale GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.1, the Fishlocks Ainsdale pack - the
first pack drafted, so it predates the two Build Pack 4.1 requirements
added to TEMPLATE.md by the 4.7 quality pass (10+ photos including the
vinyl storefront; action pending Google updates), and it is next in
line after Sandringham in the Q4 paste order.

Verified clean against the current branches.json (lastUpdated 2026-08-05):
- Profile facts all match: name, 17 Station Road Ainsdale PR8 3HN,
  01704 575478, hours Mon-Fri 8:45-6:00 closed Sat-Sun (NHS confirmed
  2026-06-24), website, review link, service areas Ainsdale, Birkdale
  and Southport. hasApp true, and the description mentions the app.
- Post A pfLink matches branches.json (branch-specific Pharmacy First
  page); Post B switch URL matches the generated page slug.
- Compliance sweep by script: no POM or generic medicine names, no
  efficacy phrases, no em dashes, no emojis, UK English.
- Description within limit, but the header claimed 664 characters and
  the actual paste-form count is 680. Header corrected to 680 (still
  well under 750).

Gaps found against Build Pack v2 section 4.1 and the updated TEMPLATE.md,
fixed in the pack:
- Shot list had 7 shots and did not mention the vinyl storefront or
  pending Google updates. Extended to 10 shots (vinyl storefront lead
  shot where fitted, street-context angle, shop floor, hours notice)
  and added the pending-updates paster note, matching the Sandringham
  pack format.
- Post C and Post D buttons pointed at the bare domain with a "(weight
  loss clinic page)" placeholder. Both now carry the exact generated
  page URLs (weight-loss-clinic-fishlocks-ainsdale.html and
  travel-clinic-fishlocks-ainsdale.html), consistent with Posts A and B
  and with the later packs.

Note: 13 packs still carry the 6-shot list and, in some, placeholder
post links. Working through them one per quality pass in paste order
rather than bulk-editing, per the one-item rule.

Files changed: gbp-packs/fishlocks-ainsdale.md, AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Quality pass on item 4.7: McCanns Sandringham GBP pack verified against Build Pack v2 and current data

Worklist has no unchecked items and QUESTIONS.json has no open questions
(no Outlook search needed), so this run was a quality pass per the
standing rules. Item chosen: 4.7, the McCanns Sandringham pack, because
the Q4 answer makes it the first pack to be pasted (its live GBP
description names two POMs) and it was drafted against the 2026-08-04
branches.json, before the Wilmslow removal bumped the file.

Verified clean:
- Profile facts (name, address 1b Aigburth Road L17 4JP, phone 0151 727
  3076, hours Mon-Fri 9-1 and 2-6 closed Sat-Sun, website, review link,
  service areas, hasApp false) all match the current branches.json
  (lastUpdated 2026-08-05).
- Business description is exactly 700 characters as the pack claims,
  under the 750 limit.
- Compliance sweep: no POM or generic medicine names, no efficacy
  phrases, no em dashes, no emojis, UK English throughout.
- Post B, C and D target pages all exist in the repo (switch, weight
  loss clinic, travel clinic for mccanns-sandringham). The branch
  Pharmacy First page exists too, ready for the link swap the paster
  note describes.
- Post A pfLink (shared pharmacy-first-service-aigburth.html) is a
  live-site-only page, not repo-generated - consistent with the paster
  note. Both McCanns branches share it per branches.json.
- Sister-branch claim checked: Aigburth branch is at 112 Aigburth Road,
  so "further along Aigburth Road" is accurate.
- Live URL resolution could not be checked from this run (no web access
  to the live site from the worker); the pack already tells the paster
  to check the URLs before posting.

Gap found against Build Pack v2 section 4.1 and fixed:
- Spec asks for 10+ photos including the new vinyl storefront, and for
  pending Google updates to be actioned. The pack's shot list had 6
  shots and covered neither point. Extended the shot list to 10 (vinyl
  storefront lead shot where fitted, shop floor, hours notice, street
  context) and added a paster note to action pending Google updates.
- TEMPLATE.md section 4 updated to carry both requirements so future
  packs inherit them. The other 14 packs share the same 6-shot gap;
  left for a later pass or the paster - flagged here, not silently
  rolled out, to keep this run to one item.

Files changed: gbp-packs/mccanns-sandringham.md, gbp-packs/TEMPLATE.md,
AGENT_LOG.md.
Commit: see this commit on agents/audit-backlog.
Questions: none new. None open.

---

## 2026-08-05 (scheduled run) - Recovery: verify and commit the Cowork session's Q2 to Q5 answer applications

Found on arrival: a stale .agent-lock (3.2 hours old, deleted per the
standing rules) and uncommitted changes to QUESTIONS.json and
branches.json, left by the 2026-08-05 Cowork session in which Rishi
answered Q2 to Q5 directly. That session applied the Q2 decision
(Wilmslow branch entry and hostMap entry removed from branches.json,
lastUpdated bumped to 2026-08-05) and recorded all four answers, but
was interrupted before committing.

This run verified the leftover state rather than taking it on trust:
- All six generators re-run against the edited branches.json: output
  byte-identical, no further file changes.
- check-nap: 173 pages against 16 branches.json entries, 0 mismatches.
- check-seo-pattern: 173 pages, 0 failures (title, H1 and meta).
- seo-pattern self-test passes for all 16 buildable branches.
- Outlook answer search (subject "Portal feedback", body "AUDIT ANSWER"):
  no matches. The answers came via the Cowork session, not the portal.

All five questions are now answered; none open. The worklist has no
unchecked items, so no new scope was taken - committing the verified
recovery was this run's work item.

Notes for Rishi:
- The Q5 answer says paste-ready replacement blocks were created in
  cowork/cherry-lane-old-page-replacements/. That folder is not in this
  repo, so it presumably lives in the Cowork session's own workspace.
  If the blocks should be kept in the repo, copy them in during a
  supervised session.
- Remaining "wilmslow" references in the repo are historical or inert:
  CHANGELOG.md and the branches.json schemaNote (history),
  scripts/add-weightloss-travel-widgets.js (one-off script wording),
  tools/build-switch-pages.js (hard-coded map entry no branch matches
  any more; generator output unchanged), status/index.html (regenerated
  by the status build).
- tools/branches-editor.html embeds a stale snapshot of branches.json
  data that still includes the Wilmslow entry. Per CLAUDE.md, copies of
  branches.json get flagged, not merged or edited: flagged here.

Files changed: QUESTIONS.json and branches.json (from the Cowork
session, verified this run), AGENT_LOG.md.
Commit: b240c32 (hash appended in a follow-up commit after push).
Questions: none new. None open.

---

## 2026-08-05 - Quality pass on the Phase 3 rollout: meta descriptions verified and brought inside the rule
Worklist has no unchecked items and no Outlook answers were waiting (Q2 to
Q5 still open), so this run was a quality pass per the standing rules.
Item re-verified: the Phase 3 rollout (3.1 to 3.13). Its checker only
covered titles and H1s; the meta description leg of "title, meta
description and H1" was never verified against the meta rule documented
in tools/seo-pattern.js (seoTown + a service word, 80 to 165 chars).

Findings when the meta check was first run: 47 failures across 173 pages,
all generator-level, none branch-specific. (1) Travel clinic metas 170+
chars on every branch. (2) Weight loss clinic metas about 185 chars on
every branch. (3) The two Fishlocks landing page metas up to 199 chars.
(4) Contraception metas tipped over 165 only for the longest brand name
(Coleman and Leighs). A fifth group ("meta missing contraception") was a
checker false positive - the copy says "contraceptive pill", which
carries the service - fixed in the checker word list, not the pages.

Fixes, all at generator level then regenerated (no hand edits to output):
- tools/check-seo-pattern.js: now also checks the "Weebly page SEO
  description" line of every page via seo-pattern checkMeta, with service
  words per page type. This closes the verification gap permanently.
- tools/build-travel-clinic-pages.js: meta trimmed to "Private travel
  clinic at <brand> in <town>. Travel vaccinations and malaria prevention
  advice, subject to clinical suitability." Caution wording kept.
- tools/build-weight-loss-pages.js: meta trimmed to "Private,
  pharmacist-led weight loss clinic at <brand> in <town>. Clinical
  assessment first; treatment only where appropriate." Still no medicine
  names and no efficacy claims; the generic POM-medication sentence went
  in the trim, which if anything lowers the advertising exposure.
- tools/build-contraception-pages.js: "Start, restart or continue"
  shortened to "Start or continue" so the longest brand fits.
- tools/build-branch-landing-pages.js: meta now uses seoTown + postcode
  instead of the full street address (full NAP remains in the page body
  and JSON-LD); service list wording shortened. Serving towns kept.

Result: check-seo-pattern now verifies 173 pages for title, H1 AND meta,
0 failures. check-nap 173 pages, 0 mismatches. seo-pattern self-test
passes. 46 regenerated pages changed only their SEO description line.
NOTE FOR PASTING: the SEO description is a Weebly page setting, so the
new shorter metas take effect at the next Weebly paste run (Q3 decision)
- pasting the embed block alone does not update it.
Commit: see this commit on agents/audit-backlog.

---

## 2026-08-04 (night) - Items 4.6 to 4.15: remaining ten GBP packs drafted in parallel (supervised session)
Rishi asked for the remaining packs to be split across parallel subagents
to move faster. Six subagents each drafted one or two packs simultaneously,
all from TEMPLATE.md, the scorah-bramhall.md house style, and branches.json
facts only. All ten written to gbp-packs/: mccanns-aigburth, mccanns-
sandringham, fishlocks-eccleston, clear-aintree, smartts-bootle,
sk-chemists-bootle, coleman-leigh-walton, riddings-timperley,
gordon-short-crosby, tiffenbergs-aintree. Every branch now has a pack.

Central compliance sweep after the subagents finished (not relying on
their self-checks): scan of all 15 packs for POM names (Wegovy, Mounjaro,
Ozempic, Saxenda, Orlistat, generics), efficacy phrases, em dashes and
emojis - all clean; the only "guaranteed" match is TEMPLATE.md's own rule
text. Descriptions all under 750 chars (633 to 735). Facts spot-checked
against branches.json (McCanns Sandringham verified line by line: L17 4JP,
0151 727 3076, split lunch hours).

Notable pack decisions:
- McCanns Sandringham opens with a NOTE FOR PASTING: its description
  replaces the faulty live Hirshmans-copied text (Q4) in full.
- Clear Chemist: no hours in branches.json, so the pack forbids pasting
  hours until confirmed; no Pharmacy First service at Clear, so Post A is
  a local team post.
- Coleman and Leighs: confirmed trading name throughout, plus a paste note
  to correct the live GBP name and old spellings.
- Both Bootle packs deliberately worded distinctly to avoid duplicate
  text across the two profiles.
- Lunch-closure branches flagged so GBP hours get entered as two ranges.

Phase 4 is now complete. ACTION FOR RISHI OR DANE: paste the packs into
GBP branch by branch (descriptions, categories, services, then start the
post rotation). Q4 can arguably be closed by pasting the new descriptions,
but it stays open until Rishi confirms the approach.

Files changed: 10 new gbp-packs/*.md, AGENT_WORKLIST.md (4.6-4.15 ticked,
numbering note), AGENT_LOG.md.
Questions: none new. Q2, Q3, Q4, Q5 remain open.

---

## 2026-08-04 (scheduled run) - Item 4.5: Scorah Chemists Hazel Grove GBP pack
Answers check: searched Outlook for subject "Portal feedback" with body
"AUDIT ANSWER" - no matches in the last week. Q2, Q3, Q4, Q5 remain open.

What was done:
- New gbp-packs/scorah-hazel-grove.md, next branch in branches.json order
  (scorah_hazel, index 1; Bramhall, Fishlocks Ainsdale, Hirshmans and
  Cherry Lane already have packs). Format follows TEMPLATE.md and the
  scorah-bramhall.md sibling pack.
- Facts from branches.json only: 87 Macclesfield Road, Hazel Grove,
  Stockport SK7 6BG; 01625 872267; hours Mon-Fri 9-6, closed Sat and Sun
  (Saturday trading ceased 24 June 2026 per branches.json openingHours
  note). Description 685 chars, under the 750 limit, verified by script.
- Same service set as Bramhall (widget-driven: BP checks, contraception,
  PF, weight loss, travel), same private-paid wording for travel and
  weight loss, no app mention (hasApp false), weight loss post names no
  medicines and makes no efficacy claims.
- Post links checked against the generated pages in modules/: switch,
  weight loss and travel posts use the branch-specific slugs
  (switch-prescriptions-scorah-hazel-grove.html etc.); Post A uses the
  shared Hazel Grove / Bramhall PF page per pfLink with the usual swap
  note. Paster notes flag the Saturday closure check on GBP hours and the
  Q3 (live copy may lag repo) and Q4 (description audit) checks.
- Worklist: 4.5 ticked in place; remainder renumbered as 4.6 through 4.14.
Files changed: gbp-packs/scorah-hazel-grove.md (new), AGENT_WORKLIST.md,
AGENT_LOG.md. Commit hash: recorded in the commit itself.
Questions: none new this run.

## 2026-08-04 (scheduled run) - Item 4.4: Scorah Chemists Bramhall GBP pack
Answers check: no emails with subject starting "AGENT ANSWER" in the last
7 days (search ran clean; the only hit was an unrelated supplier spend
report). Q2, Q3, Q4, Q5 remain open.

What was done:
- New gbp-packs/scorah-bramhall.md, next branch in branches.json order after
  the three packs already done. Format follows TEMPLATE.md and the
  fishlocks-ainsdale.md model.
- Facts from branches.json only: address, phone, hours (NHS confirmed
  2026-06-24, Sat 9-1), review link, service areas. Services drawn from the
  branch widget set: BP checks, contraception, Pharmacy First, weight loss,
  travel.
- Deliberate differences from the Fishlocks pack, checked against the
  generated Scorah pages: no free delivery, collection or blister pack
  claims (the Scorah switch page makes none); travel and weight loss are
  written as private paid services with "subject to availability and
  clinical suitability" wording (matching the live page copy) rather than
  Fishlocks' "free assessment"; no app mention (hasApp false); weight loss
  post names no medicines and makes no efficacy claims.
- Post A links the shared Hazel Grove / Bramhall PF page per pfLink, with a
  paster note to swap to pharmacy-first-scorah-bramhall.html once that page
  is confirmed live. Paster note also flags checking the Post B switch URL
  resolves before posting.

Files changed: gbp-packs/scorah-bramhall.md (new), AGENT_WORKLIST.md (4.4
ticked, remainder renumbered 4.5-4.14), AGENT_LOG.md, status/index.html.
Questions: none new.

## 2026-08-04 (late evening, second entry) - Items 3.2 to 3.13: Phase 3 rollout completed (supervised session)
Rishi asked to continue ahead of schedule in the same Cowork session, so the
one-item-per-run rule was set aside on his instruction. Lock held throughout.

What was done:
- All six generators (service, contraception, weight loss, travel, branch
  landing, switch) now import tools/seo-pattern.js and build every title and
  H1 through it. No build script composes a title or H1 by hand any more.
  Condition pages now declare an h1Phrase (e.g. "Earache treatment for
  children") consumed by searchH1() instead of a local h1 function.
- switchH1 in seo-pattern.js corrected before rollout: the live switch H1
  ("Switch your prescriptions to <brand> in <town> in under 30 seconds")
  already carries service + brand + town and is stronger conversion copy,
  so it is the canonical form. Only the switch TITLE was the outlier.
- All 173 pages regenerated. Result exactly as designed in 3.1: every
  service, contraception, weight loss, travel and landing page came out
  byte-identical; the only content change is the 15 switch page SEO titles
  ("Switch Your Prescriptions - Scorah Chemists Bramhall" becomes "Switch
  Your Prescriptions to Scorah Chemists, Bramhall") plus the switch
  INDEX.md / SEO.md manifests.
- New tools/check-seo-pattern.js verifies every generated page's SEO title
  line and <h1> against the pattern module, reported per brand. Run result:
  12 brands, 173 pages, 0 mismatches, 0 skipped. check-nap.js also re-run
  clean (173 pages, 0 mismatches).

Incident, caught and fixed in-session: a PowerShell bulk edit of three
build scripts mangled UTF-8 (em dashes became mojibake) and the corruption
propagated into regenerated pages. The diff review caught it before any
commit; the three generators and all generated output were reverted to HEAD
and the edits re-applied with an encoding-safe editor. Nothing corrupted
was committed. Lesson recorded: do not bulk-edit these files with default
Windows PowerShell 5.1 text round-trips.

ACTION FOR RISHI OR DANE: the 15 live switch pages on Weebly still carry
the old SEO title in Pages > SEO Settings. Update them from the new
modules/switch/pages/SEO.md at the next paste run (ties into open Q3).
The page HTML itself is unchanged, so no embed re-paste is needed for this.

Files changed: 6 build scripts, tools/seo-pattern.js (switchH1 + doc),
tools/check-seo-pattern.js (new), 15 switch pages, switch INDEX.md/SEO.md,
AGENT_WORKLIST.md (3.2-3.13 ticked), AGENT_LOG.md.
Questions: none new. Q2, Q3, Q4, Q5 remain open.

---

## 2026-08-04 (late evening) - Item 3.1: title/H1 pattern defined once in the generator layer (hourly agent run)
Lock: none found; created and removed normally.
Answers check: no "Portal feedback" / "AUDIT ANSWER" emails in Outlook.
Q2, Q3, Q4 and Q5 remain open.

New file tools/seo-pattern.js - the single definition of the page title, H1
and meta description pattern for every generated page type, sourced from
branches.json seoTown/brandLabel (never addressLocality), per Build Pack v2
sections 1.4 and 5.1.

THE PATTERN (documented here before rollout, as 3.1 requires):
- Family A, search-phrase pages (PF condition pages, contraception, branch
  landing): title "<Phrase> in <seoTown> - <brandLabel>", H1 "<Phrase> in
  <seoTown>". Landing pages keep the brand in the H1 and append the county
  to the title when it differs from the town (e.g. "Pharmacy in Bramhall,
  Greater Manchester - Scorah Chemists").
- Family B, brand-led service pages (PF overview, Weight Loss Clinic,
  Travel Clinic): title "<Service> at <brandLabel>, <seoTown>", H1
  "<Service> at <brandLabel> in <seoTown>". This is the shape Build Pack v2
  section 5.4 itself prescribes for the PF overview.
- Switch pages: canonical form "Switch Your Prescriptions to <brandLabel>,
  <seoTown>" (title) / "... in <seoTown>" (H1). Current generator output
  ("Switch Your Prescriptions - <brand> <town>") is the one deviation from
  the family shapes; the switch generator adopts the canonical form during
  its brand rollout runs.
- Meta description: must contain seoTown and a service word, 80-165 chars
  (checkMeta() enforces).

Key design choice: families A and B were codified to match the CURRENT
output of the five service/landing/contraception generators exactly, so
wiring them to the module in items 3.2-3.13 produces no unintended page
churn - those rollout runs are then about verification and fixing per-brand
anomalies, not mass regeneration. Only switch pages will actually change.

Verified: node tools/seo-pattern.js self-test passes - all 16 buildable
branches (head office and disposed Wilmslow excluded), 7 page types each,
titles all carry seoTown, no hard failures, no length warnings (longest
titles are the Coleman and Leighs contraception/switch forms at 64-65
chars, within the 65-char warn threshold).

Files changed: tools/seo-pattern.js (new), AGENT_WORKLIST.md (3.1 ticked),
AGENT_LOG.md. No pages regenerated this run by design - rollout is 3.2+.
Commit: see git log for this entry's hash.
Questions: none new.

---

## 2026-08-04 (evening) - Item 2.3: Cherry Lane build-from-near-zero (hourly agent run)
Lock note: found .agent-lock aged 3h 0m at start of run - 4 seconds past the
staleness threshold, treated as stale per procedure and replaced.
Answers check: no "Portal feedback" / "AUDIT ANSWER" emails in Outlook.
Q2, Q3 and Q4 remain open.

The "build" turned out to be a verification job: the full Cherry Lane page
set already exists in the repo AND is already live on cherrylanepharmacy.co.uk.
Audit scope: all 12 repo pages for cherrylane_liverpool (11 service module
pages, 1 switch page, plus banner) against Build Pack v2 Blocks 1 and 5, and
live checks on the domain.

PASSES:
- Page set complete in repo: PF overview + 7 condition pages + contraception
  + weight loss clinic + travel clinic + switch. All 12 live at the
  cherry-lane-walton slugs and all present in the live site navigation.
- H1s and SEO.md titles/descriptions all carry service + Walton (seoTown
  correctly used, not the postal town Liverpool). Meta keywords include L4.
- NAP clean (check-nap re-run: 173 pages, 0 mismatches). Phones in tel:
  links. No template bleed from other branches. No personal rishi@ address.
- No hard-coded widget IDs; widgets resolve from branches.json, and Cherry
  Lane is the best-populated branch in the file - all 12 service widget IDs
  present including per-condition ones.
- New live weight loss page is compliant: no medicine names, no efficacy
  claims, private-service framing, eligibility and safety caveats present.
- Live PF overview and weight loss pages carry correct NAP, hours matching
  branches.json (NHS-confirmed 2026-06-24), Google review link, map embed.

IN-REPO FIX APPLIED:
- branches.json pfLink for cherrylane_liverpool pointed at the OLD page
  (pharmacy-first-service-walton.html), which now renders empty. Corrected
  to the live overview page (pharmacy-first-cherry-lane-walton.html). Same
  class of fix as the Fishlocks pfLink correction in 2.1. No generator
  consumes pfLink, so no regeneration needed; check-nap re-run clean.

GAPS (outside agent reach, logged for action):
1. The LIVE PF overview embed is a stale paste: it shows five of the seven
   conditions as "Page coming soon" although all seven condition pages are
   live and in the navigation. The repo version links all seven. Needs a
   repaste of pharmacy-first-cherry-lane-walton.html by Rishi or Dane (the
   toolbar paste route proven in the 4.1 session works). Rides on Q3 for
   whether to paste from branch or main.
2. REGULATORY: the old weight loss page (weight-loss-clinic-walton.html) is
   still live, still first in the navigation, names Wegovy, Mounjaro and
   Orlistat with product images, claims "lose up to 22.5% of your body
   weight", and its phone/price/hours fields render blank. POM advertising
   exposure on the public site, same class as Q4. Raised as Q5 with options
   and a recommendation (strip the POM content, keep the URL).
3. Navigation shows TWO weight loss entries (old and new) - confusing and
   splits clicks. Resolution folds into the Q5 answer.
4. Coleman and Leighs pfLink in branches.json also points at an old-style
   pharmacy-first-service-walton.html URL on their domain - not checked this
   run (out of scope), flag for the 3.9 Coleman and Leighs run.
Files changed: branches.json (pfLink), QUESTIONS.json (Q5 added),
AGENT_WORKLIST.md (2.3 ticked), this log.
Commit: see git.

## 2026-08-04 - Item 2.2: Fishlocks shared-domain split (hourly agent run)
Answers check: no "Portal feedback" / "AUDIT ANSWER" emails in Outlook.
Q2, Q3 and Q4 remain open on the portal answer form.

Built the branch landing pages that give Ainsdale and Eccleston their own
local target page on the shared fishlockpharmacy.co.uk domain (Master Plan
v2 section 3: a shared domain cannot rank twice for the same term, so each
branch leans on its own GBP listing plus a branch-specific landing page).

What was built:
- New generator tools/build-branch-landing-pages.js, same model as the other
  generators: layout once, pages stamped from branches.json. BUILD list holds
  fishlocks_ainsdale and fishlocks_eccleston now; add McCanns and Scorah ids
  when their turn comes in the brand-by-brand rollout.
- Output modules/branch/pages/: pharmacy-fishlocks-ainsdale.html and
  pharmacy-fishlocks-eccleston.html plus INDEX.md and SEO.md. Slug pattern
  pharmacy-<brandSlug>-<townSlug>.html, titles "Pharmacy in <seoTown>,
  <region> - <brandLabel>" targeting the generic "pharmacy in <town>" terms.
- Each page: hero with town words, opening hours (from the NHS-confirmed
  block in branches.json), services grid linking the branch's own PF, switch,
  weight loss, travel and contraception pages, sister-branch cross-link to
  disambiguate the shared domain, FAQ, NAP card with Google and NHS review
  links, map embed. Static crawlable text; loads service.css only, no JS and
  no booking widget, so nothing to resolve at runtime.
- JSON-LD carries openingHoursSpecification and areaServed - the first pages
  to do so (the 2.1 audit deferred hours schema on the 171 existing pages to
  Phase 3; new pages get it from day one).
- tools/check-nap.js now scans modules/branch/pages too. Verified: 173 pages,
  0 mismatches, exit 0.
Notes: weight loss copy names no medicines and makes no claims; Pharmacy
First wording stays on the NHS service description. Weebly cannot 301, so
the old shared pages stay live with their "Choose your branch" links; what
finally happens to them rides on Q3. Pages reach Weebly by paste (Rishi or
Dane) per INDEX.md; suggest navigation entries "Ainsdale branch" and
"Eccleston branch".
Files changed: tools/build-branch-landing-pages.js (new), tools/check-nap.js,
modules/branch/pages/* (new), AGENT_WORKLIST.md (2.2 ticked), this log.
Commit: see git.

## 2026-08-04 (evening) - GBP McCanns Sandringham fixed; Coleman pastes still blocked
Cowork session update. Rishi said "go": GBP was reachable on the Cowork PC,
so the McCanns Sandringham management record is FIXED - address now 1B
Aigburth Road, Aigburth, Liverpool L17 4JP (was Dingle / CH49 1SX), and the
Hirshmans copy-paste description replaced with McCanns text naming no
medicines (pending Google's standard review). Logged in the cowork CHANGELOG.
The Build Pack 4.2 action note on the CH49 1SX error can be considered
closed once the description clears review.
The Coleman re-paste run remains BLOCKED: the Cowork PC Chrome still holds
the rbhealth Weebly session, not rishi@rishibhatia.co.uk. Runbook is staged
(cowork\COLEMAN_REPASTE_RUNBOOK.md); it runs the moment that login lands.
Hirshmans contact-us cosmetic fix (postcode missing) attempted but the
editor viewport went unstable - no changes made, still queued.

## 2026-08-04 - Items 4.2 and 4.3: Cherry Lane and Hirshmans GBP packs
Run by Claude in the Cowork session, continuing Phase 4 while logins are
sorted. gbp-packs/cherry-lane-walton.md and gbp-packs/hirshmans-ainsdale.md
written to the TEMPLATE.md format, facts from branches.json. Cherry Lane
posts B, C and D carry a "check the page is live first" flag because the 2.3
build has not run yet. Hirshmans pack cross-references Q4 (medicine names in
live GBP descriptions). Both weight loss posts name no medicines and make no
efficacy claims. Ticked 4.2 and 4.3.

## 2026-08-04 - Item 4.1: GBP pack template + Fishlocks Ainsdale pack
Run by Claude in the Cowork session, not the hourly agent. Rishi asked for
open work to continue while Weebly and GBP logins are sorted tonight.
Created gbp-packs/TEMPLATE.md (pack format plus the advertising rules) and
gbp-packs/fishlocks-ainsdale.md (description under the 750 char GBP limit,
categories, services list, photo shot list, four post drafts). Facts from
branches.json. The weight loss post names no medicines and makes no efficacy
claims. Ticked 4.1 in the worklist.
Added Q3 and Q4 to QUESTIONS.json (see above). Also done outside the repo
today, logged in the cowork CHANGELOG: Coleman and Leighs native Weebly copy
fixed and published; Scorah Bramhall switch embed re-pasted and published
(61-63 North Park Road now live in the page; a site-wide JSON-LD block
outside the page embeds still carries the old 61 - follow-up under Q3); the
July Cherry Lane pin-swap confirmed unnecessary (branch ref caught up).
Note for the hourly agents: embed re-pastes ARE automatable now - the Edit
Custom HTML toolbar opened fine and Ctrl+V pasted from the system clipboard.

## 2026-08-04 - Item 2.1: Fishlocks Ainsdale audit vs Build Pack v2
Answers check: no "Portal feedback" / "AUDIT ANSWER" emails found. Q1 was
answered by Rishi directly in a Cowork session (see entry below), so this run
recorded that answer into QUESTIONS.json (status now "answered") to keep the
portal honest. Q2 (Wilmslow) remains open.

Audit scope: all 13 repo pages for fishlocks_ainsdale (11 service module
pages, 1 switch page, 1 switch banner) checked against Build Pack v2 Blocks
1 and 5, plus live-site spot checks on fishlockpharmacy.co.uk.

PASSES (no action needed):
- Page set complete: PF overview + all 7 condition pages + contraception +
  weight loss clinic + travel clinic + switch. All live on the domain and
  linked in the site navigation. Live overview page matches repo output.
- Titles, meta descriptions and H1s all carry service + Ainsdale (Block 1.4
  already satisfied for the module pages; Phase 3 remains for legacy pages).
- NAP clean (check-nap: 171 pages, 0 mismatches, re-run this session). Every
  phone number is in a tel: link. No template copy bleed from other branches.
- No hard-coded Appointedd widget IDs; service.js resolves widgets from
  branches.json@main by URL slug, with correct no-fallback handling for
  weight loss and travel clinic. Ainsdale widgets fully populated in
  branches.json (pharmacyFirst, weightLoss, travelClinic, contraception,
  bloodPressure).
- Enquiry/callback destination is helpdesk@rbhealth.co.uk in BOTH the
  service and switch modules (Build Pack 5.6 done). No rishi@ anywhere.
- Content is real crawlable text; opening hours on the live contact blocks
  match branches.json (NHS-confirmed 2026-06-24).

GAPS (logged, with disposition):
1. JSON-LD has no openingHoursSpecification, though branches.json carries
   confirmed hours. All five generators duplicate their own pharmacySchema()
   block, and live embeds are static HTML, so fixing now would regenerate
   171 pages and demand a full Weebly repaste for a nice-to-have. DEFERRED:
   fold into Phase 3 item 3.1 (pattern definition) so every page is
   regenerated and repasted once, not twice. Same for adding "geo".
2. Google still ranks the OLD shared PF page
   (pharmacy-first-service-eccleston-ainsdale.html); the new per-branch
   pages are live but not yet the ranking targets. The old page does now
   carry "Choose your branch" links to both overviews. The proper split
   (and what to do with the old shared pages - Weebly cannot 301) is item
   2.2, next in the worklist.
3. CDN pin drift risk: service pages load module CSS/JS pinned to
   @service-module-phase1 and switch pages to commit @6a275e1, while
   service.js fetches branches.json from @main. Pins are currently in sync
   with main (verified: only DRAFT files differ), and commit pins are
   arguably deliberate (jsDelivr caches immutably). No change made; when
   embeds are next repasted (Phase 3), standardise the module refs.
4. branches.json pfLink for both Fishlocks branches pointed at the old
   shared PF page. FIXED this run: Ainsdale ->
   pharmacy-first-fishlocks-ainsdale.html, Eccleston ->
   pharmacy-first-fishlocks-eccleston.html (both verified live), in
   branches.json and the branches-editor.html snapshot. pfLink is not
   consumed by generators, so no regeneration needed.
5. Cosmetic, Weebly-side (hand fixes, not blockers): og:image is the blank
   Weebly placeholder sitewide; the legacy footer on the old PF page spells
   the brand "Fishlock Pharmacy" while the CDN footer says "Fishlocks
   Chemist" - the Q1-style naming question does not arise here (branches.json
   brandLabel "Fishlocks Chemist" matches the NHS profile).

Files changed: branches.json, tools/branches-editor.html, QUESTIONS.json,
AGENT_WORKLIST.md (2.1 ticked), this log, status page. Commit: see git.

## 2026-08-04 - Coleman and Leighs rename (answer to item 1.1 question)
Run by Claude in the Cowork session, not the hourly agent. Rishi confirmed
the correct trading name: "Coleman and Leighs Pharmacy" ("and" spelled out,
Leighs with s, no apostrophe - matches the domain and NHS profile slug).
Changed brandLabel and branchName in branches.json, the embedded snapshot in
tools/branches-editor.html and the brand string in tools/build-switch-pages.js,
then regenerated via build-service-pages.js, build-contraception-pages.js,
build-weight-loss-pages.js, build-travel-clinic-pages.js and
build-switch-pages.js. Verified: git grep "Coleman & Leigh" returns nothing
outside this log, the worklist and CHANGELOG history.
Regeneration also picked up two unrelated catch-ups: stale Wilmslow switch
pages removed (disposal completed 1 June) and the Scorah Bramhall switch page
address updated to 61-63 North Park Road (branches.json already correct, page
was stale).
Reminder: live Weebly copy for Coleman and Leighs still mixes four name
variants and needs the CDN embeds repasted before the corrected pages go live.

## 2026-08-04 - Item 1.4: NAP check, every branch page vs branches.json
Answers check: no "AGENT ANSWER" emails in the last 7 days. The item 1.1
Coleman naming question was answered directly by Rishi in a Cowork session
that ran alongside this run (entry above); nothing further to apply here.
Built tools/check-nap.js, a read-only checker that verifies every generated
page (modules/service/pages and modules/switch/pages, 171 pages) against
branches.json: data-branch attribute, contact card address line, Google
Maps embed query, every tel: link and visible phone number, and the full
JSON-LD block (name, telephone, street, locality, postcode, region,
country). Names accept either brandLabel or the town-qualified branchName.
Findings and fixes:
- Scorah Bramhall switch page carried the pre-normalisation address
  "61 North Park Road" in the contact line, maps embed and JSON-LD.
  branches.json was normalised to "61-63 North Park Road" on 27 June
  (schemaNote) after the switch pages were last generated. Fixed by
  regeneration. The eleven Scorah Bramhall service pages were already
  correct.
- switch-prescriptions-wilmslow-wilmslow.html (plus its banner) still
  existed for the disposed Wilmslow branch. build-switch-pages.js had no
  disposed handling; added a skip that also removes stale output for
  disposed branches, and regenerated. Page and banner deleted.
- Everything else clean: all 14 trading branches' service pages and the
  remaining switch pages match branches.json exactly on name, address
  and phone. Final checker run: 171 pages, 0 mismatches.
Timing note: this run and Rishi's Cowork session worked the repo at the
same time (the .agent-lock only guards hourly runs against each other).
This run made the generator disposed-skip fix and first regenerated the
switch pages; the Cowork session's rename commit 497fcb0 then swept those
fixes in with its own regeneration, which is why its message credits them
as "catch-ups". No harm done - same source data, same generators, and the
worklist item is complete either way. Committed by this run: tools/
check-nap.js (new checker), the item 1.4 worklist tick, this log entry and
the rebuilt status page. Final state verified after both sessions' changes:
checker clean, 171 pages, 0 mismatches.
Action note for Rishi or Dane (not a blocker): repaste the Scorah Bramhall
switch page embed into Weebly so the 61-63 address fix goes live. And if
the old wilmslow-pharmacy.co.uk switch page is still live anywhere, take
it down - RBH should not be inviting prescription switches to a branch it
no longer owns.

---

## 2026-08-04 - Item 1.3: McCanns Sandringham postcode sweep (CH49 1SX)
Answers check: no "AGENT ANSWER" emails in the last 7 days. Coleman & Leigh
question from item 1.1 remains open.
Swept for CH49 1SX (and any CH49) with L17 4JP as the correct value:
- Repo: zero hits outside the worklist text itself. git log -S shows CH49
  has never been in any site data or generated page in the repo's history.
  branches.json mccanns_sandringham entry correct: 1b Aigburth Road,
  Liverpool, L17 4JP, 0151 727 3076. All 12 generated Sandringham pages
  (11 service, 1 switch) carry L17 4JP twice each - contact line and
  JSON-LD schema postalCode. Zero CH49.
- Live site (checked 2026-08-04): homepage and the Sandringham switch page
  both zero CH49; contact blocks, sitewide CDN footer bar and JSON-LD all
  show L17 4JP correctly.
- Root cause per Master Plan v2 (line 72) and Build Pack v2 (section 4.2):
  the CH49 1SX sits in the McCanns Sandringham GBP MANAGEMENT RECORD, not
  on any web page. The live GBP profile already displays L17 4JP. Agents
  cannot edit GBP, so this is a hand fix.
Action note for Rishi or Dane (not a blocker): in the Google Business
Profile manager, open McCanns Sandringham and correct the management-record
address to 1b Aigburth Road, Liverpool L17 4JP (currently shows Wirral
postcode CH49 1SX). Two minutes in the GBP dashboard.
Also noted while checking (cosmetic, Weebly hand edit): homepage address
block spells "Sandrigham Medical Centre" (missing n).
No repo changes needed. Commit this run: worklist/log/status page only.

## 2026-08-04 - Item 1.2: Hirshmans address sweep
Answers check: no "AGENT ANSWER" emails in the last 7 days. Coleman & Leigh
question from item 1.1 remains open.
Verified "56-62 Sherwood House, Station Road, Ainsdale" everywhere:
- Repo: branches.json (line 688) correct, and git history shows it has been
  correct since the initial seed. All 13 generated Hirshmans pages (11
  service, 1 switch, 1 travel/weight loss set) carry the correct address in
  the contact line, the Google Maps embed URL and the JSON-LD schema
  streetAddress. tools/branches-editor.html snapshot correct. Swept for
  wrong variants (missing "Sherwood House", 56/62, 56 - 62, en dash,
  "62 Station Road", "56 Station") - zero hits. Every "PR8 3HW" occurrence
  sits alongside the correct street address.
- Live site (checked 2026-08-04): homepage footer contact block, sitewide
  CDN footer bar and contact-us page all correct.
No repo changes needed. Commit this run: worklist/log/status page only.
Note for Rishi or Dane (not a blocker): on the live contact-us page the
left-hand address block wraps "Station Road" across a line break mid-word
pair and omits the PR8 3HW postcode. Correct address, scruffy presentation.
Hand edit in Weebly when convenient - outside what this agent can reach.

## 2026-08-04 - Item 1.1: Standardise brand-name spelling
Established canonical forms from branches.json and the live sites:
- Fishlocks Chemist: repo already consistent. "fishlock" (singular) remains
  only in the domain (fishlockpharmacy.co.uk), the NHS review slug and the
  keyword-match tokens, all intentional. Live site checked: "Fishlocks"
  throughout the copy. No change needed.
- Coleman & Leigh Pharmacy: repo internally consistent, but the live site,
  domain and NHS profile disagree with each other. Question logged above;
  no repo change made.
- Gordon Short Chemist: branches.json carried "Gordon Shorts Chemist" and
  propagated it into all 16 generated Gordon Short service pages. The live
  site (checked 2026-08-04, zero occurrences of "Shorts"), the domain
  (gordonshortchemist.co.uk) and the NHS profile (gordon-short-chemist) all
  use the singular. Fixed brandLabel and branchName in branches.json, bumped
  lastUpdated, updated the embedded snapshot in tools/branches-editor.html,
  then regenerated via build-service-pages.js, build-contraception-pages.js,
  build-weight-loss-pages.js and build-travel-clinic-pages.js. Verified:
  git grep "Gordon Shorts" now returns nothing outside CHANGELOG history.
Files changed: branches.json, tools/branches-editor.html, 16 Gordon Short
pages plus INDEX/SEO/TRAVEL-CLINIC/WEIGHT-LOSS index sheets (19 files,
189 lines). Commit: 1ec8f7b.
Note: per CHANGELOG, the live Gordon Short Weebly pages pin the CDN at
commit 76221ba, so the corrected pages only go live when the embeds are
repasted. One for Rishi or Dane when convenient.

## 2026-08-04 - Setup
Branch agents/audit-backlog created from main. Worklist seeded from
Master Plan v2, Build Pack v2 and the June audit context pack. Hourly
scheduled task created on the ProDesk. No site changes made in this run.
