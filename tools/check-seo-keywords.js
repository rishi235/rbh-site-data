/*
  check-seo-keywords.js  (added 2026-08-11 on the item 3.6 quality pass)

  Weebly > Pages > (page) > SEO Settings has FOUR fields a human types by hand
  off the paste sheets: Page Title, Page Permalink, Page Description and Meta
  Keywords. Three of the four had a rule behind their content. The fourth had
  none.

    check-seo-sheets.js    reads Page Title, Page Permalink, Page Description
                           and proves the page and its sheet agree.
    check-seo-lengths.js   reads title, description, permalink, H1.
    check-seo-pattern.js   reads title, H1, description, presence and absence.
    check-em-dashes.js     reads the Meta Keywords LINE, but only ever asked
                           whether it contained a dash.

  So nothing had ever read what a Meta Keywords line SAYS. That is 177 strings
  of public copy, one per generated page, composed six different ways by six
  generators out of values that move: seoTown, brandLabel and the outward half
  of the postcode. Every one of those three has already moved during this
  audit. Item 5.7 moved McCanns Sandringham's seoTown from Sandringham to
  St Michael's on 2026-08-10, item 1.1 renamed Coleman and Leighs, and item
  1.3 corrected the McCanns Sandringham postcode. Each time, the keywords
  happened to be regenerated correctly and nothing would have said so if they
  had not been.

  Found on the item 3.6 quality pass by reading all 26 McCanns strings by
  hand, which is the ninth time a pass has hand-checked a field no rule holds.
  They are correct today. This makes them stay correct.

  What FAILS the run:
    - RULE 1, pairing: a sheet block with a Page Permalink has no Meta
      Keywords line, or an empty one. A blank field pasted into Weebly is a
      field nobody notices is blank.
    - RULE 2, resolution: the permalink does not resolve to exactly one live
      branch under "<brandSlug>-<townSlug>", or names a page this repo does
      not generate. An entry a paster cannot match to a page is worse than a
      missing one.
    - RULE 3, presence: the keywords do not carry the branch's OWN seoTown.
    - RULE 4, absence: the keywords name another live branch's seoTown and
      that town is not in this branch's own serviceAreaList. Same rule and
      same excuse as the cross-town rule in check-seo-pattern.js, for the same
      reason: on a shared domain, two branches bidding for one town compete
      with each other instead of each owning its catchment.
    - RULE 5, brand: the keywords name another live branch's brandLabel. The
      branch's own brandLabel and branchName are both fine.
    - RULE 6, postcode: a token shaped like a UK outward code that is not this
      branch's own outward code. All nine outward codes in the estate appear
      in keywords today, so this is a live rule, not a theoretical one.
    - RULE 7, claim: efficacy or results wording, using the single list in
      tools/claim-patterns.js that check-service-links.js applies to the
      pages. The weight loss and travel clinic sheets are where a phrase like
      "rapid weight loss Bootle" would be written as a keyword, and until this
      landed no rule read them at all.
    - a run in which no sheet yields a single Meta Keywords line, so the whole
      check would pass while covering nothing.

  Expected values are composed from branches.json. Nothing is imported from
  the generators, so a generator reaching for the wrong field fails here
  rather than agreeing with itself.

  Exceptions go in KNOWN, keyed "<permalink>::<rule>", with a reason and a
  question id, the same convention as KNOWN_DRIFT in check-cdn-pins.js and
  KNOWN in check-seo-lengths.js. A KNOWN key that no longer breaks its rule
  FAILS the run, so the list cannot rot.

  Run:  node tools/check-seo-keywords.js
*/
const fs = require("fs");
const path = require("path");
const findClaim = require("./claim-patterns.js").findClaim;

const REPO = path.join(__dirname, "..");

const PAGE_DIRS = [
  path.join(REPO, "modules", "branch", "pages"),
  path.join(REPO, "modules", "service", "pages"),
  path.join(REPO, "modules", "switch", "pages")
];

// Accepted breaches, keyed "<permalink>::<rule>". Empty today.
const KNOWN = {};

const failures = [];
const knownHits = {};

function rel(p) { return path.relative(REPO, p).replace(/\\/g, "/"); }

function record(permalink, rule, where, message) {
  const key = permalink + "::" + rule;
  if (Object.prototype.hasOwnProperty.call(KNOWN, key)) {
    knownHits[key] = true;
    return;
  }
  failures.push(where + ": " + message);
}

// ---------------------------------------------------------------------------
// branches.json - the expected values
// ---------------------------------------------------------------------------
const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));
const live = data.branches.filter(function (b) {
  return !b.disposed && b.brandSlug && b.townSlug && b.seoTown;
});
if (!live.length) {
  console.error("check-seo-keywords FAIL: branches.json yields no live branch, so every rule below would check nothing");
  process.exit(1);
}

const bySlug = {};
live.forEach(function (b) { bySlug[b.brandSlug + "-" + b.townSlug] = b; });
const SLUGS = Object.keys(bySlug).sort(function (a, b) { return b.length - a.length; });

// Word-boundary matching, so a town or a brand cannot be found inside a longer
// word. Same helper as check-seo-pattern.js's cross-town rule.
function wordRe(s) {
  const esc = String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("(^|[^a-z0-9])" + esc + "([^a-z0-9]|$)", "i");
}

const townOwners = {};
live.forEach(function (b) { (townOwners[b.seoTown] = townOwners[b.seoTown] || []).push(b.id); });
const TOWNS = Object.keys(townOwners);
const TOWN_RE = {};
TOWNS.forEach(function (t) { TOWN_RE[t] = wordRe(t); });

const brandOwners = {};
live.forEach(function (b) { (brandOwners[b.brandLabel] = brandOwners[b.brandLabel] || []).push(b.id); });
const BRANDS = Object.keys(brandOwners);
const BRAND_RE = {};
BRANDS.forEach(function (n) { BRAND_RE[n] = wordRe(n); });

function outward(b) { return String(b.postalCode).split(" ")[0].toUpperCase(); }
const OUTWARD_TOKEN = /\b[A-Z]{1,2}[0-9][0-9A-Z]?\b/g;

// Every page this repo generates, by permalink (filename without .html).
const generated = new Set();
PAGE_DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).filter(function (f) { return f.endsWith(".html"); })
    .forEach(function (f) { generated.add(f.replace(/\.html$/, "").toLowerCase()); });
});

// ---------------------------------------------------------------------------
// Parse every paste sheet. Sheets are DISCOVERED, not named, for the reason
// recorded in check-em-dashes.js: five of the eleven were named after their
// service and a checker listing two filenames had never opened them.
// ---------------------------------------------------------------------------
const entries = [];
let sheetCount = 0;

PAGE_DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).filter(function (f) { return f.endsWith(".md"); }).sort().forEach(function (f) {
    const file = path.join(dir, f);
    sheetCount++;
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    let cur = null;
    function flush() {
      if (cur && (cur.permalink || cur.keywords)) entries.push(cur);
      cur = null;
    }
    lines.forEach(function (line, i) {
      if (/^##\s+/.test(line)) {
        flush();
        cur = { sheet: rel(file), heading: line.replace(/^##\s+/, "").trim(), line: i + 1, permalink: "", keywords: "", kwLine: 0 };
        return;
      }
      if (!cur) return;
      let m;
      if ((m = /^-\s+\*\*Page Permalink:\*\*\s*(.*)$/.exec(line))) {
        cur.permalink = m[1].trim().replace(/\.html$/, "").toLowerCase();
      } else if ((m = /^-\s+\*\*Meta Keywords:\*\*\s*(.*)$/.exec(line))) {
        cur.keywords = m[1].trim();
        cur.kwLine = i + 1;
      }
    });
    flush();
  });
});

// ---------------------------------------------------------------------------
// The rules
// ---------------------------------------------------------------------------
let checked = 0;

entries.forEach(function (e) {
  const where = e.sheet + ' block "' + e.heading + '"';

  if (!e.permalink) {
    // A block with keywords but no permalink cannot be matched to a page.
    // check-seo-sheets.js already fails that case for title and description,
    // so it is reported here rather than failed twice.
    return;
  }

  // RULE 1 - pairing.
  if (!e.keywords) {
    record(e.permalink, "pairing", where,
      "has a Page Permalink but no Meta Keywords value. Weebly's fourth SEO field would be pasted blank.");
    return;
  }

  // RULE 2 - resolution.
  const slug = SLUGS.find(function (s) {
    return e.permalink === s || e.permalink.endsWith("-" + s);
  });
  if (!slug) {
    record(e.permalink, "resolution", where,
      "permalink '" + e.permalink + "' does not end in any live branch's <brandSlug>-<townSlug>, so its keywords "
      + "cannot be checked against a branch. Either the permalink is wrong or branches.json is.");
    return;
  }
  if (!generated.has(e.permalink)) {
    record(e.permalink, "resolution", where,
      "permalink '" + e.permalink + "' names a page this repo does not generate, so a paster has a sheet entry "
      + "with nowhere to paste it.");
    return;
  }

  const b = bySlug[slug];
  const kw = e.keywords;
  checked++;

  // RULE 3 - presence.
  if (!TOWN_RE[b.seoTown].test(kw)) {
    record(e.permalink, "presence", where,
      "Meta Keywords do not carry this branch's own seoTown '" + b.seoTown + "'. Got: " + kw);
  }

  // RULE 4 - absence.
  const areas = (b.serviceAreaList || []).map(function (s) { return String(s).toLowerCase(); });
  TOWNS.forEach(function (t) {
    if (t === b.seoTown) return;
    if (!TOWN_RE[t].test(kw)) return;
    if (areas.indexOf(t.toLowerCase()) !== -1) return;
    record(e.permalink, "absence", where,
      "Meta Keywords name '" + t + "', the seoTown of " + townOwners[t].join(" and ")
      + ", and '" + t + "' is not in this branch's serviceAreaList. Got: " + kw);
  });

  // RULE 5 - brand.
  BRANDS.forEach(function (n) {
    if (n === b.brandLabel) return;
    if (!BRAND_RE[n].test(kw)) return;
    record(e.permalink, "brand", where,
      "Meta Keywords name '" + n + "', which is the brand of " + brandOwners[n].join(" and ")
      + ", not this branch. Got: " + kw);
  });

  // RULE 6 - postcode.
  const mine = outward(b);
  let tok;
  OUTWARD_TOKEN.lastIndex = 0;
  while ((tok = OUTWARD_TOKEN.exec(kw))) {
    if (tok[0].toUpperCase() === mine) continue;
    record(e.permalink, "postcode", where,
      "Meta Keywords carry '" + tok[0] + "', which is not this branch's outward code '" + mine + "'. Got: " + kw);
  }

  // RULE 7 - claim.
  const claim = findClaim(kw);
  if (claim) {
    record(e.permalink, "claim", where,
      "Meta Keywords carry " + claim[1] + " (" + String(claim[0]) + "). Efficacy and results wording is not "
      + "allowed in public copy. Got: " + kw);
  }
});

// A run that reads no keywords at all passes while covering nothing.
if (!checked) {
  failures.push("no Meta Keywords line was read on any paste sheet, so every rule above covered nothing. "
    + "Re-run the generators that write the sheets.");
}

// A KNOWN key that no longer breaks its rule fails, so the list cannot rot.
Object.keys(KNOWN).forEach(function (key) {
  if (!knownHits[key]) {
    failures.push("KNOWN entry " + key + " no longer breaks its rule. Remove it, with the question it was "
      + "raised against, rather than leaving a stale exception in place.");
  }
});

console.log("check-seo-keywords: " + checked + " Meta Keywords line(s) across " + sheetCount
  + " paste sheet(s), against " + live.length + " live branches");
console.log("  presence and absence over " + TOWNS.length + " live seoTowns, "
  + BRANDS.length + " brand names, and each branch's own outward code");

if (Object.keys(knownHits).length) {
  console.log("");
  console.log("KNOWN (" + Object.keys(knownHits).length + ") - accepted for now, each against a question:");
  Object.keys(knownHits).sort().forEach(function (k) {
    console.log("  KNOWN " + k + ": " + KNOWN[k]);
  });
}

if (failures.length) {
  console.log("");
  console.log("FAILURES (" + failures.length + ") - in the one Weebly SEO field nothing used to read:");
  failures.forEach(function (f) { console.log("  FAIL  " + f); });
  console.log("");
  console.log("Fix at source in the generator that composes the keywords, then regenerate.");
  process.exit(1);
}

console.log("");
console.log("check-seo-keywords: clean, every Meta Keywords line matches its own branch.");
