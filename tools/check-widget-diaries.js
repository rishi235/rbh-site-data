/*
  check-widget-diaries.js  (added 2026-08-11 on the item 3.7 quality pass)

  An Appointedd widget id decides which diary a patient's booking lands in.
  There are 79 of them in branches.json, 73 distinct, and no generated page
  carries one: service.js resolves the id at run time from branches.json, so
  a wrong id is invisible on the page and shows up only as a real patient
  sitting in the wrong pharmacy's diary. That is the fault this repo already
  had once, on 2026-07-17, when six pages hard-coded the wrong id.

  check-booking-routes.js guards that chain well, but it guards it in ONE
  direction. Its rule 7 asks whether two services inside a SINGLE branch share
  an id. Sharing BETWEEN branches it does not test at all: it counts the
  shared ids and prints them as "shared between sister branches (one diary
  per pair, expected)". Six ids are shared today and all six are legitimate,
  so the line reads correctly. It would read exactly as correctly if a
  seventh appeared, whatever it was.

  That matters because the estate's diary policy is unanimous and undeclared:

    weightLoss, travelClinic     SHARED across a brand's sites, one private
                                 clinic diary per brand. 3 brands of 3.
    pharmacyFirst, contraception,
    bloodPressure                PER SITE at every brand. 3 brands of 3.
    every single-site brand      all ids unique estate-wide.

  Nothing in the repo states that, and nothing enforces it. Smartts Chemist
  Bootle, the subject of item 3.7, is a single-site brand whose five ids must
  all be unique, and it sits in branches.json directly above SK Chemists
  Bootle, a different brand in the same town with the same five services. A
  copy-paste between those two neighbours sends NHS Pharmacy First bookings
  made on one Bootle pharmacy's page into the other Bootle pharmacy's diary,
  and every one of the 21 existing checkers stays green.

  Found on the item 3.7 quality pass. Nothing was wrong; the policy was simply
  unpinned. This makes it a rule.

  What FAILS the run:
    - RULE 1, format: a widget id that is not 24 lowercase hex characters.
      A truncated or mistyped id renders an empty booking box, which looks
      like a page fault rather than a data fault.
    - RULE 2, crossbrand: one id held by branches of more than one brandKey.
      A booking made on one brand's page would land in another brand's diary.
      Never legitimate, at any service.
    - RULE 3, consistent: one service key treated two ways across the
      multi-site brands - shared at one brand and per site at another. Which
      of the two is the mistake cannot be read off the data, so it has to be
      resolved deliberately rather than guessed at. This is the rule that
      catches an NHS diary being shared: pharmacyFirst, contraception and
      bloodPressure are per site at all three multi-site brands today, so the
      first one to be shared fails here.
    - RULE 4, sharedservice: a shared id held under DIFFERENT service keys by
      its holders, for instance one branch's travelClinic id sitting in a
      sister branch's weightLoss slot. Rule 2 does not see it because the
      brand is the same, rule 3 does not see it because both keys are still
      shared at that brand, and check-booking-routes rule 7 does not see it
      because the collision is across two branches rather than inside one.
    - a run in which no widget id is read at all, so every rule above would
      cover nothing.

  Expected values are composed from branches.json alone. Which service keys
  are private and which are per site is DERIVED from how the three multi-site
  brands actually treat them, not hardcoded here, so the day a fourth brand
  gains a second site the rule reads that brand too.

  Exceptions go in KNOWN, keyed "<subject>::<rule>", with a reason and a
  question id, the same convention as KNOWN in check-booking-routes.js and
  check-seo-keywords.js. A KNOWN key that no longer breaks its rule FAILS the
  run, so the list cannot rot.

  Run:  node tools/check-widget-diaries.js
  Exits 1 on any failure.
*/
"use strict";

const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const DATA = path.join(REPO, "branches.json");

// Accepted breaches, keyed "<subject>::<rule>". Empty today.
const KNOWN = {};

const failures = [];
const knownHits = {};

function record(subject, rule, message) {
  const key = subject + "::" + rule;
  if (Object.prototype.hasOwnProperty.call(KNOWN, key)) {
    knownHits[key] = true;
    return;
  }
  failures.push(message);
}

const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
const live = data.branches.filter(function (b) { return !b.disposed; });

// ---------------------------------------------------------------------------
// Index: every id, who holds it, and under which service key.
// ---------------------------------------------------------------------------
const holders = {};        // id -> [{ branchId, brandKey, key }]
const byBrand = {};        // brandKey -> [branch]
let instances = 0;

live.forEach(function (b) {
  (byBrand[b.brandKey] = byBrand[b.brandKey] || []).push(b);
  const w = b.widgets || {};
  Object.keys(w).forEach(function (k) {
    const id = w[k];
    if (!id) return;
    instances++;
    (holders[id] = holders[id] || []).push({ branchId: b.id, brandKey: b.brandKey, key: k });
  });
});

// ---------------------------------------------------------------------------
// RULE 1 - format.
// ---------------------------------------------------------------------------
Object.keys(holders).forEach(function (id) {
  if (/^[0-9a-f]{24}$/.test(id)) return;
  const who = holders[id].map(function (h) { return h.branchId + "." + h.key; }).join(", ");
  record(id, "format",
    "widget id \"" + id + "\" (" + who + ") is not 24 lowercase hex characters. " +
    "Appointedd ids are, so this one renders an empty booking box rather than a diary.");
});

// ---------------------------------------------------------------------------
// RULE 2 - crossbrand.
// ---------------------------------------------------------------------------
Object.keys(holders).forEach(function (id) {
  const brands = holders[id]
    .map(function (h) { return h.brandKey; })
    .filter(function (v, i, a) { return a.indexOf(v) === i; });
  if (brands.length < 2) return;
  const who = holders[id].map(function (h) { return h.brandKey + "/" + h.branchId + "." + h.key; }).join(", ");
  record(id, "crossbrand",
    "widget id \"" + id + "\" is held by " + brands.length + " different brands (" + who + "). " +
    "A booking made on one brand's page would land in another brand's diary.");
});

// ---------------------------------------------------------------------------
// RULE 3 - consistent. How each multi-site brand treats each service key.
// ---------------------------------------------------------------------------
const multi = Object.keys(byBrand).filter(function (k) { return byBrand[k].length > 1; });

const keys = {};
live.forEach(function (b) {
  Object.keys(b.widgets || {}).forEach(function (k) { keys[k] = true; });
});

const treatment = {};   // serviceKey -> { shared: [brandKey], perSite: [brandKey] }
Object.keys(keys).sort().forEach(function (k) {
  const t = { shared: [], perSite: [] };
  multi.forEach(function (brand) {
    const held = byBrand[brand]
      .map(function (b) { return (b.widgets || {})[k]; })
      .filter(Boolean);
    if (held.length < 2) return;            // not held at two sites, says nothing
    const distinct = held.filter(function (v, i, a) { return a.indexOf(v) === i; });
    if (distinct.length === 1) t.shared.push(brand);
    else t.perSite.push(brand);
  });
  treatment[k] = t;
  if (t.shared.length && t.perSite.length) {
    record(k, "consistent",
      "service \"" + k + "\" is a shared brand diary at " + t.shared.join(", ") +
      " and a per-site diary at " + t.perSite.join(", ") + ". One of the two is wrong and " +
      "the data cannot say which, so it needs a decision rather than a guess. " +
      "An NHS service shared across sites books patients into the wrong pharmacy; " +
      "a private clinic split in two splits one diary into two half-empty ones.");
  }
});

// ---------------------------------------------------------------------------
// RULE 4 - sharedservice.
// ---------------------------------------------------------------------------
Object.keys(holders).forEach(function (id) {
  if (holders[id].length < 2) return;
  const serviceKeys = holders[id]
    .map(function (h) { return h.key; })
    .filter(function (v, i, a) { return a.indexOf(v) === i; });
  if (serviceKeys.length < 2) return;
  const who = holders[id].map(function (h) { return h.branchId + "." + h.key; }).join(", ");
  record(id, "sharedservice",
    "widget id \"" + id + "\" is held under " + serviceKeys.length + " different service keys (" + who + "). " +
    "Two different services are pointing at one diary across two branches, so a booking " +
    "for one service arrives filed as the other.");
});

// ---------------------------------------------------------------------------
// A run that reads nothing passes while covering nothing.
// ---------------------------------------------------------------------------
if (!instances) {
  failures.push("no widget id was read from branches.json, so every rule above covered nothing.");
}

// A KNOWN key that no longer breaks its rule fails, so the list cannot rot.
Object.keys(KNOWN).forEach(function (key) {
  if (!knownHits[key]) {
    failures.push("KNOWN entry " + key + " no longer breaks its rule. Remove it, with the question it " +
      "was raised against, rather than leaving a stale exception in place.");
  }
});

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
const distinctIds = Object.keys(holders).length;
const sharedIds = Object.keys(holders).filter(function (id) { return holders[id].length > 1; });

const sharedKeys = Object.keys(treatment).filter(function (k) { return treatment[k].shared.length; }).sort();
const siteKeys = Object.keys(treatment).filter(function (k) { return treatment[k].perSite.length; }).sort();

console.log("check-widget-diaries: " + instances + " widget id(s) across " + live.length +
  " live branches, " + distinctIds + " distinct");
console.log("  " + multi.length + " multi-site brand(s): " + multi.join(", "));
console.log("  shared brand diaries : " + (sharedKeys.length ? sharedKeys.join(", ") : "(none)"));
console.log("  per-site diaries     : " + (siteKeys.length ? siteKeys.join(", ") : "(none)"));
console.log("  " + sharedIds.length + " id(s) shared between sister sites, 0 permitted across brands");

if (Object.keys(knownHits).length) {
  console.log("");
  console.log("KNOWN (" + Object.keys(knownHits).length + ") - accepted for now, each against a question:");
  Object.keys(knownHits).sort().forEach(function (k) {
    console.log("  KNOWN " + k + ": " + KNOWN[k]);
  });
}

if (failures.length) {
  console.log("");
  console.log("FAILURES (" + failures.length + ") - in the field that decides where a booking lands:");
  failures.forEach(function (f) { console.log("  FAIL  " + f); });
  console.log("");
  console.log("Fix in branches.json against the Appointedd diary the booking should reach, then re-run.");
  process.exit(1);
}

console.log("");
console.log("check-widget-diaries: clean, every diary id belongs to exactly the branch and service that should hold it.");
process.exit(0);
