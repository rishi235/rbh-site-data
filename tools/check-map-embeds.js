/*
  check-map-embeds.js  (added 2026-08-11 on the item 3.9 quality pass)

  The Google Maps embed was the last piece of branch data that reaches a
  patient and was read by no checker.

  Why it matters here rather than in the abstract. Every generated page in the
  estate ends on a contact card, and the last thing in that card is an iframe
  holding a map query built from the branch's own address. On the six branch
  landing pages there is a second copy of the same string, in the "Get
  directions" button at the top of the page, which opens Google Maps
  navigation. That button is the one surface in this repo that does not merely
  tell a patient where the shop is, it drives them there.

  Nothing read either. Six generators compose the query the same way, from
  streetAddress, addressLocality and postalCode, and then percent-encode it,
  so the string is correct today. But it is correct by coincidence of six
  independent copies agreeing, not by rule. Swap the composition in one
  generator, or let one page keep a stale encoded address after a move, and
  183 pages of visible copy still read correctly, the schema PostalAddress
  still matches branches.json, check-nap still reports 0 mismatches, and the
  map underneath quietly points at the wrong shop. Coleman and Leighs is the
  branch that shows why the pair has to agree: its postal locality is
  Liverpool and its seoTown is Walton, so the address a map needs and the town
  the page sells are different words, and a checker that only reads the
  visible town would not notice the map going wrong.

  Same class of fault as hasApp on the 3.8 pass and the meta keywords on the
  3.6 pass: not wrong data, unpinned data.

  The encoding is checked as well as the value, because these two fail in
  different ways. A wrong address sends a patient to the wrong place. A right
  address with a raw space or a raw comma in it breaks the iframe, and a
  broken map is silent: the page still renders, the card still has a heading,
  and the space where the map should be is simply empty.
*/
/*
  What FAILS the run:
    - RULE 1, generators: a generator emits a maps URL that is not built from
      branches.json, or stops composing the query from the three address
      fields. A literal address typed into a generator is how the six copies
      stop agreeing.
    - RULE 2, coverage: a generated page in a family that carries contact cards
      has no map embed, or more than one. Both directions, because a page with
      two maps has had one pasted into it by hand.
    - RULE 3, the address: the decoded map query does not equal the owning
      branch's streetAddress, addressLocality and postalCode joined with ", ",
      or the page cannot be matched to a branch at all.
    - RULE 4, agreement: the decoded map query does not equal the address the
      same page prints in its contact card. The map and the words above it
      must be the same address.
    - RULE 5, encoding: a map URL is not properly percent-encoded, is not on
      www.google.com, or has lost output=embed. A map that does not load is
      not a smaller fault than a map in the wrong town, it is a quieter one.
    - RULE 6, directions: a "Get directions" destination does not equal the map
      query on the same page.
    - a stale KNOWN key, same convention as check-app-membership.js.

  Run:  node tools/check-map-embeds.js
*/
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");

// Families whose generators emit a contact card. Every page in them must
// carry exactly one map.
const PAGE_DIRS = [
  path.join(REPO, "modules", "service", "pages"),
  path.join(REPO, "modules", "switch", "pages"),
  path.join(REPO, "modules", "branch", "pages")
];

// The generators that emit a maps URL, read as data under test rather than
// mirrored into a literal here.
const GENERATORS = [
  "build-service-pages.js",
  "build-switch-pages.js",
  "build-weight-loss-pages.js",
  "build-travel-clinic-pages.js",
  "build-contraception-pages.js",
  "build-branch-landing-pages.js"
];

// Pages that may legitimately carry a map that fails a rule, each with a
// reason and a question id. Empty today. A key that no longer fires FAILS the
// run, so the list cannot rot.
const KNOWN = {};

function rel(p) { return path.relative(REPO, p).replace(/\\/g, "/"); }

const failures = [];
const knownHits = {};

// ---- branches.json ---------------------------------------------------------
const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));
const branches = (data.branches || []).filter(function (b) { return !b.disposed; });

function fullAddr(b) {
  return [b.streetAddress, b.addressLocality, b.postalCode].filter(Boolean).join(", ");
}

const addrByKey = {};   // "brandSlug-townSlug" -> full address
branches.forEach(function (b) {
  const a = fullAddr(b);
  if (!b.streetAddress || !b.addressLocality || !b.postalCode) {
    failures.push({
      rule: "the address",
      where: "branches.json / " + b.id,
      text: "is missing one of streetAddress, addressLocality or postalCode, so its map query is built short"
    });
    return;
  }
  addrByKey[b.brandSlug + "-" + b.townSlug] = a;
});

function keyForFile(name) {
  const stem = name.replace(/\.html$/, "");
  let best = null;
  Object.keys(addrByKey).forEach(function (k) {
    if (stem.length >= k.length && stem.slice(-k.length) === k) {
      if (!best || k.length > best.length) best = k;
    }
  });
  return best;
}

function listHtml(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(function (f) { return f.endsWith(".html"); });
}

// ---- RULE 1: the generators -------------------------------------------------
// Each generator that emits a maps URL must build the query from the three
// address fields of a branch record. A maps URL whose query is a literal is
// the fault this rule exists for: it would survive a move, a rename and a
// regeneration without ever changing.
const MAPS_IN_SRC = /https:\/\/www\.google\.com\/maps[^"'`\s]*/g;

GENERATORS.forEach(function (name) {
  const file = path.join(REPO, "tools", name);
  if (!fs.existsSync(file)) {
    failures.push({ rule: "generators", where: "tools/" + name, text: "generator is missing" });
    return;
  }
  const src = fs.readFileSync(file, "utf8");
  const urls = src.match(MAPS_IN_SRC) || [];
  if (!urls.length) {
    failures.push({
      rule: "generators",
      where: "tools/" + name,
      text: "no longer emits a Google Maps URL, so its pages lost the map without any page rule noticing"
    });
    return;
  }
  // The composition must reach branches.json. Every generator today does it
  // through a three-field join and an encodeURIComponent; both halves are
  // required, because either one alone can be right while the other is not.
  const joins = /\[\s*b\.streetAddress\s*,\s*b\.addressLocality\s*,\s*b\.postalCode\s*\]/.test(src);
  const encodes = /encodeURIComponent\s*\(\s*(?:fullAddr\s*\(\s*b\s*\)|fullAddress)\s*\)/.test(src);
  if (!joins) {
    failures.push({
      rule: "generators",
      where: "tools/" + name,
      text: "emits a maps URL but no longer joins streetAddress, addressLocality and postalCode from a branch record"
    });
  }
  if (!encodes) {
    failures.push({
      rule: "generators",
      where: "tools/" + name,
      text: "emits a maps URL whose query is not passed through encodeURIComponent"
    });
  }
  // A literal postcode inside a maps URL in generator source is a hardcoded
  // address whichever way it got there.
  urls.forEach(function (u) {
    if (/[A-Z]{1,2}\d[A-Z\d]?(%20|\+|\s)?\d[A-Z]{2}/i.test(u)) {
      failures.push({
        rule: "generators",
        where: "tools/" + name,
        text: "has a postcode written into a maps URL in its own source: " + u
      });
    }
  });
});

// ---- the page rules ---------------------------------------------------------
const EMBED_RE = /<iframe[^>]*class="map"[^>]*src="([^"]+)"[^>]*>/g;
const ANY_MAPS_RE = /https:\/\/www\.google\.com\/maps[^"'\s<>]*/g;
const DIR_RE = /https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=([^"'\s<>]+)/g;
// The address the contact card prints, which is the line a patient reads.
const CONTACT_ADDR_RE = /<div class="contact-line"><p>([^<]*\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})<\/p><\/div>/;

function decodeQ(s) {
  try { return decodeURIComponent(s); } catch (e) { return null; }
}

let pagesChecked = 0;
let mapsChecked = 0;
let dirsChecked = 0;

PAGE_DIRS.forEach(function (dir) {
  listHtml(dir).forEach(function (f) {
    const file = path.join(dir, f);
    const where = rel(file);
    const src = fs.readFileSync(file, "utf8");
    pagesChecked++;

    const key = keyForFile(f);
    if (key === null) {
      // An untypable page is a FAILURE, not a skip. A page nothing can match
      // to a branch and a page that passes used to look identical.
      failures.push({
        rule: "the address",
        where: where,
        text: "cannot be matched to a branch in branches.json, so its map was never tested"
      });
      return;
    }
    const want = addrByKey[key];

    // RULE 2 - coverage, both directions.
    EMBED_RE.lastIndex = 0;
    const embeds = [];
    let m;
    while ((m = EMBED_RE.exec(src)) !== null) embeds.push(m[1]);

    if (embeds.length !== 1) {
      if (KNOWN[where]) { knownHits[where] = (knownHits[where] || 0) + 1; }
      else {
        failures.push({
          rule: "coverage",
          where: where,
          text: "carries " + embeds.length + " map embed(s), expected exactly 1"
        });
      }
      if (!embeds.length) return;
    }

    const url = embeds[0];
    mapsChecked++;

    // RULE 5 - encoding and shape, checked before the value, because a query
    // that will not decode cannot be compared to anything.
    const qm = url.match(/^https:\/\/www\.google\.com\/maps\?q=([^&]*)&output=embed$/);
    if (!qm) {
      failures.push({
        rule: "encoding",
        where: where,
        text: "map src is not the shape https://www.google.com/maps?q=<encoded>&output=embed: " + url
      });
      return;
    }
    const raw = qm[1];
    if (/[\s,]/.test(raw)) {
      failures.push({
        rule: "encoding",
        where: where,
        text: "map query carries a raw space or comma, which breaks the embed: " + raw
      });
      return;
    }
    const got = decodeQ(raw);
    if (got === null) {
      failures.push({
        rule: "encoding",
        where: where,
        text: "map query is not valid percent-encoding and will not decode: " + raw
      });
      return;
    }
    if (encodeURIComponent(got) !== raw) {
      failures.push({
        rule: "encoding",
        where: where,
        text: "map query is not the encodeURIComponent form of its own value: " + raw
      });
    }

    // RULE 3 - the address itself.
    if (got !== want) {
      failures.push({
        rule: "the address",
        where: where,
        text: 'map points at "' + got + '" and branches.json gives this branch "' + want + '"'
      });
    }

    // RULE 4 - the map and the words above it.
    const cm = src.match(CONTACT_ADDR_RE);
    if (!cm) {
      failures.push({
        rule: "agreement",
        where: where,
        text: "has a map but prints no address in its contact card, so the two cannot be compared"
      });
    } else if (cm[1].trim() !== got) {
      failures.push({
        rule: "agreement",
        where: where,
        text: 'contact card reads "' + cm[1].trim() + '" and the map underneath it points at "' + got + '"'
      });
    }

    // RULE 6 - the directions button, where there is one.
    DIR_RE.lastIndex = 0;
    let d;
    while ((d = DIR_RE.exec(src)) !== null) {
      dirsChecked++;
      const dest = decodeQ(d[1]);
      if (dest === null) {
        failures.push({
          rule: "directions",
          where: where,
          text: "directions destination is not valid percent-encoding: " + d[1]
        });
      } else if (dest !== got) {
        failures.push({
          rule: "directions",
          where: where,
          text: 'directions button routes to "' + dest + '" and the map on the same page shows "' + got + '"'
        });
      }
    }

    // Any other maps URL on the page has escaped both rules above.
    ANY_MAPS_RE.lastIndex = 0;
    let a;
    while ((a = ANY_MAPS_RE.exec(src)) !== null) {
      const u = a[0];
      if (u === url) continue;
      if (/^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/.test(u)) continue;
      failures.push({
        rule: "coverage",
        where: where,
        text: "carries a Google Maps URL that is neither its map embed nor a directions button: " + u
      });
    }
  });
});

// ---- report -----------------------------------------------------------------
const stale = Object.keys(KNOWN).filter(function (k) { return !knownHits[k]; });

console.log("check-map-embeds");
console.log("  " + branches.length + " trading branch(es), " + Object.keys(addrByKey).length + " map address(es) read from branches.json");
console.log("  " + pagesChecked + " generated page(s), " + mapsChecked + " map embed(s), " + dirsChecked + " directions button(s)");
console.log("  " + GENERATORS.length + " generator(s) checked for how the query is composed");
Object.keys(knownHits).forEach(function (k) {
  console.log("  KNOWN " + k + ": " + KNOWN[k]);
});

if (stale.length) {
  console.log("");
  console.log("FAILURES - KNOWN entries that no longer apply (remove them):");
  stale.forEach(function (k) { console.log("  FAIL  stale KNOWN key: " + k); });
}

if (failures.length) {
  console.log("");
  console.log("FAILURES (" + failures.length + "):");
  failures.forEach(function (f) {
    console.log("  FAIL  [" + f.rule + "] " + f.where + ": " + f.text);
  });
  console.log("");
  console.log("Fix the address in branches.json, or the composition in the generator that owns");
  console.log("the contact card, then regenerate. Do not edit a page by hand: the map iframe is");
  console.log("emitted, and the next build overwrites anything typed into a page.");
  process.exit(1);
}
if (stale.length) process.exit(1);

console.log("");
console.log("check-map-embeds: clean, every map and directions link matches its branch address, "
  + Object.keys(knownHits).length + " known exception(s).");
