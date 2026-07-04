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

## Switch pages are SEO-first

The switch landing pages keep their **content in the Weebly page HTML** (see
`modules/switch/pages/`) so search engines can read the headings, copy, FAQ and address.
Only the **styling (`switch.css`)** and **form logic (`switch.js`)** load from the CDN.
`switch.js` does not build the page — it just wires the form (validation, WhatsApp,
callback, submit). One page per site, each with its own town/brand baked into the H1.

When you publish a switch page, also set the Weebly **page SEO title + meta description**
(per page) — those are the strongest local-search signals. Example for Smartts:
- Title: `Switch Your Prescriptions - Smartts Chemist Bootle`
- Description: `Switch your prescriptions to Smartts Chemist in Bootle in under 30 seconds. Local NHS pharmacy — we contact your GP and handle everything.`

## data/tasks.json — daily Asana feed for the data portal

`data/tasks.json` is a machine-generated feed of Rishi's open Asana tasks (workspace
rbhealth.co.uk), refreshed daily by a scheduled Claude session via Composio. Do not edit
it by hand — changes are overwritten on the next refresh.

Schema: `generated_at` (UTC), `counts` (`total` / `overdue` / `due_next_7_days` /
`no_due_date`), and `tasks[]` sorted overdue-first then by due date, each with `gid`,
`name`, `due_on`, `overdue`, `projects[]` and an Asana permalink `url`. The portal fetches
it like any other static JSON in this repo (jsDelivr `@main` once merged; raw
`raw.githubusercontent.com` URL works for any branch and re-caches within ~5 minutes).

## Pushing CSS/JS changes live (commit pinning)

The switch pages pin `switch.css` / `switch.js` to a **commit hash**, e.g.
`@c83a2f2/modules/switch/switch.js`, not `@main`. This is deliberate:
- jsDelivr's `@main` mirror can lag up to ~12h and ignores `?v=` query strings, so `@main`
  updates are slow and unpredictable.
- A hash is immutable: it loads instantly and a stray push can never change a live site.

So to roll out a CSS/JS change: push it, then update the hash in each page's two `<link>` /
`<script>` lines and re-paste. (Content edits don't need this — they're just the Weebly HTML.)
The `branches.json` data layer still uses `@main`; purge it after edits via
https://purge.jsdelivr.net/gh/rishi235/rbh-site-data@main/branches.json
