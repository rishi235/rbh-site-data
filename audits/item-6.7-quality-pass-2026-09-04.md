# Item 6.7 quality pass, 2026-09-04 (first pass since 2026-08-29)

## Why this item
All 8 [BLOCKED] items were excluded and every other item in the 42-item
completed pool had already had a "quality pass" logged more recently than
6.7's original 2026-08-29 completion (next-oldest was 5.7 at 2026-08-30).
6.7 had never been re-verified since it was built, making it the stalest
item in the pool.

## Data verification (live source)
Fetched https://www.gov.uk/bank-holidays directly (fetch performed
2026-09-04; the page's own `meta-govuk:updated-at` was 2026-09-02T16:04:28+01:00).
Its "Past bank holidays in England and Wales 2026" and "Upcoming bank
holidays in England and Wales 2026" tables give, combined:

  1 January (Thu), 3 April (Fri, Good Friday), 6 April (Mon, Easter Monday),
  4 May (Mon), 25 May (Mon), 31 August (Mon), 25 December (Fri),
  28 December (Mon, Boxing Day substitute - 26 Dec falls on a Saturday)

branches.json's bankHolidays.dates2026 is:
  ["2026-01-01","2026-04-03","2026-04-06","2026-05-04","2026-05-25",
   "2026-08-31","2026-12-25","2026-12-28"]

Exact match, all 8 dates. No drift since Q79 was answered 2026-08-27.

## Repo checks (tracked repo, no changes made)
- `node tools/check-opening-hours.js`: clean. 6 landing pages, rule 7
  (88 clock-times swept), rule 8 (177 no-hours-card files swept), plus the
  bankHolidays block validation (8 dates, tradingPolicy "closed"). Exit 0.
- `node tools/check-live-hours.js`: ran live. Report:
  audits/live-hours-check-2026-09-04.json. bankHolidays.nearThisRun =
  ["2026-08-31"] - the first time this item has had a genuine near-date to
  exercise (today, 2026-09-04, is 4 days after the 31 Aug bank holiday)
  rather than a synthetic one. Read every "Closed" snippet in the report
  by hand: all are the standing weekly Saturday/Sunday pattern (or, at
  Hirshmans/McCanns/Gordon Short/etc., the daily lunch closure); none is a
  one-off Monday closure near 31 August, so nothing was at risk of being
  silently mislabelled as a holiday, and nothing needed relabelling either.
- Full 36-checker suite run against the tracked repo before and after the
  injection tests below: 36/36 exit 0 both times.

## Injection tests (disposable scratch copy, PowerShell against the
## canonical C:\Dev\rbh-site-data, robocopy to %TEMP%\rbh-6.7-scratch,
## excluding .git/_agentscratch/audits; deleted after)

This item's four original negative tests (bad date, bad policy, duplicate
date, genuine mismatch survives) had never been re-proven since the item
was built on 2026-08-29. Re-ran all four, plus two more:

1. Bad ISO date ("2026-13-03" in place of 2026-04-06) -> FAIL, exact message
   `bankHolidays: "2026-13-03" is not a real ISO yyyy-mm-dd date...`
2. Duplicate date (dates2026[3] set equal to dates2026[0]) -> FAIL, exact
   message `bankHolidays: "2026-01-01" is listed twice`
3. Bad tradingPolicy ("sometimes") -> FAIL, exact message
   `bankHolidays: tradingPolicy is "sometimes" but must be "closed",
   "reduced" or "normal"...`
4. Empty dates2026 array (block present, vacuous) -> FAIL, exact message
   `bankHolidays: block is present but dates2026 is missing or empty...`
5. Whole bankHolidays block deleted -> degrades to a NOTE and exit 0, not a
   FAIL, as designed (an absent block is a known degraded state, not a
   defect in itself)
6. Genuine hours mismatch: Tuesday's visible text in
   modules/branch/pages/pharmacy-mccanns-aigburth.html changed from
   "2pm to 6pm" to "2pm to 7pm" (McCanns Aigburth is both a split-day
   branch and one of the branches whose live GBP listing prompted this
   item on 2026-08-27) -> FAIL, exact message `modules/branch/pages/
   pharmacy-mccanns-aigburth.html: Tuesday reads "9am to 1pm, 2pm to 7pm"
   but branches.json says "9am to 1pm, 2pm to 6pm"`. Confirms the
   bank-holiday exemption does not swallow a real weekly-hours defect.

Each mutation was restored immediately after (branches.json restored by
byte copy from a pre-mutation backup, sha256 904de09bc3118cefcfd7ae3f8e045b9e
a1d090c634c70114f135101f0b969e1e confirmed identical before test 1 and after
the final restore; the HTML file restored from its own `.orig` copy). The
scratch directory was deleted in full afterward. `git status --porcelain`
on every touched tracked file was empty throughout - no tracked file was
ever mutated.

## Result
Zero in-repo defect found. Zero live defect found (no bank-holiday-adjacent
Closed day misread on any of the 14 trading branches checked live). No new
question raised. Item 6.7 remains correctly implemented and is now
re-verified for the first time since it was built.
