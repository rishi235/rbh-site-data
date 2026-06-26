# rbh-site-data

Shared data and front-end modules for RB Healthcare Ltd pharmacy websites (hosted on
Weebly). Each Weebly site pastes a small embed snippet; everything else — styling, logic
and branch data — is loaded from this repo over the jsDelivr CDN, so one edit here updates
every site.

## Structure

```
branches.json          Single source of truth: every branch + routing data
core/site-data.js      Loads branches.json, publishes window.RBH_DATA, fires RBH_DataReady
modules/
  switch/              "Switch to our pharmacy" landing page
    weebly.html        ← paste this into a Weebly Embed Code element
    switch.js          Picks the branch, fills the page, handles the form
    switch.css         Styles (scoped to #rbhsw-root)
  emar/                eMAR for care homes (same pattern)
```

## How it works

1. The embed loads `core/site-data.js`, which fetches `branches.json` from the CDN and
   publishes it to `window.RBH_DATA` (with a hard-coded fallback if the fetch fails).
2. The module (`switch.js` / `emar.js`) waits for the `RBH_DataReady` event, then selects
   the branch for the current site by:
   `window.RBH_SWITCH_OVERRIDE` → `hostMap[hostname]` → keyword match → head office.
3. It populates the page (name, address, phone, map, schema.org markup) and wires the form
   to the Google Apps Script endpoint.

## branches.json

Each branch record:

| Field             | Notes                                                            |
|-------------------|------------------------------------------------------------------|
| `id`              | Unique key, referenced by `hostMap` / `brandGroups`              |
| `brandKey`/`brandLabel` | Brand grouping and display name                            |
| `branchName`      | Shown on the page                                                |
| `streetAddress`, `addressLocality`, `postalCode`, `addressRegion`, `addressCountry` | Address |
| `phone`, `email`  | Optional — rows are hidden if absent                             |
| `hasApp`          | **`true` only for branches on the RB Healthcare Pharmacy app.** Controls the app-download card. |
| `googleReviewUrl` | Optional — shows the Google reviews card when present            |
| `keywords`        | Used for fallback branch matching                                |
| `serviceAreaList` | Service areas (used by the eMAR module)                          |

### App members

Only these branches have `hasApp: true` (the app-download card is hidden everywhere else):
**Smartts Chemist, Clear Chemist, Fishlocks Ainsdale, Fishlocks Eccleston.**

### Adding or editing a branch

1. Edit `branches.json` (add the record, plus a `hostMap` entry for the site's domain).
2. Set `hasApp` (`true`/`false`) and add `phone` / `googleReviewUrl` if known.
3. Commit. jsDelivr serves `@main` within minutes; bump the `?v=` cache version to force
   an immediate refresh.

## Cache busting

Assets are loaded with a `?v=YYYYMMDD-N` query string in the embed, and
`DATA_VERSION` in `core/site-data.js` does the same for `branches.json`.
**When you change CSS/JS, bump the `?v=` in the embed; when you change data, bump
`DATA_VERSION`.** Keep them in step (current: `20260626-1`).
