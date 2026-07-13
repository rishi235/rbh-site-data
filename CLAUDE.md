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
    streetAddress, addressLocality, postalCode, addressRegion, addressCountry,
    phone, email, googleReviewUrl, hasApp, keywords[], serviceAreaList[],
    shortCode, branchNumber, odsCode, nhsEmail,
    pfLink, pfBooking, nhsReviewUrl,
    website, seoTown, townSlug, brandSlug, widgets{}, disposed

Notes:
- seoTown is the catchment town used in page titles and H1. It may differ from
  the postal addressLocality (Cherry Lane = Walton, not Liverpool).
- Head office (rbh_head_office_aintree) has no phone, email, odsCode or
  nhsEmail. That is correct, not missing data.
- Bump lastUpdated on every edit.

## Editing

Use tools\branches-editor.html to review and edit. It loads branches.json,
validates, and exports a replacement file. Always commit and push after an edit,
so the GitHub copy and the local copy never drift.
