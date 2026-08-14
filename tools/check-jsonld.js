#!/usr/bin/env node
/*
 * check-jsonld.js
 *
 * Every generated page carries one JSON-LD block. That block is the only part
 * of the page written for a machine rather than a person, which is exactly why
 * nothing had ever read it end to end: check-nap reads visible text, and the
 * two things below are invisible to a text search.
 *
 * The defect that prompted this checker (found on the item 3.10 quality pass,
 * 2026-08-10): five of the six generators declared "@type": "Pharmacy" and one,
 * build-weight-loss-pages.js, declared "@type": "MedicalBusiness". Same
 * premises, same name, same phone, same address, one page family typed more
 * vaguely than the rest, on all 15 weight loss pages. Pharmacy is a subtype of
 * MedicalBusiness, so nothing was untrue, but a business that describes itself
 * two different ways across its own pages is harder for Google to resolve to
 * one entity. The two functions were otherwise character-for-character
 * identical, so it was a copy divergence rather than a decision.
 *
 * The second gap this closes: the contact card's Google Maps iframe carries the
 * branch address URL-ENCODED. check-nap scans for the address as plain text, so
 * a wrong address in that query is invisible to it. That is the one place on
 * the page that can point a patient at another building while every visible
 * line still reads correctly.
 *
 * Rules, all failures:
 *   1. Every generated page has exactly one JSON-LD block, and it parses.
 *   2. "@type" is Pharmacy on every branch page. No page may be typed more
 *      vaguely than its siblings.
 *   3. "name" is the right one of branchName / brandLabel FOR THAT PAGE FAMILY:
 *      a branch landing page declares branchName, a service or switch page
 *      declares brandLabel. See the note below.
 *   4. "url" is the branch website plus the page's own filename.
 *   5. PostalAddress matches branches.json field for field, including
 *      addressRegion and addressCountry.
 *   6. "telephone" matches branches.json exactly, spacing included.
 *   7. Where present, "email" matches the branch and areaServed is exactly
 *      serviceAreaList, in order.
 *   8. The Google Maps iframe query decodes to
 *      "<streetAddress>, <addressLocality>, <postalCode>".
 *
 * Expected values are composed here from branches.json rather than imported
 * from the generators, on purpose. A checker that calls the code it is checking
 * proves nothing.
 *
 * RULE 3 WAS TIGHTENED ON THE ITEM 3.6 QUALITY PASS, 2026-08-14. Nothing was
 * wrong; the policy was unpinned, which is the same shape of gap the item 3.7
 * pass found in the widget diaries. Rule 3 used to accept EITHER branchName or
 * brandLabel on EVERY page, so it could only catch a name belonging to no
 * branch at all. The estate turns out to be unanimous and undeclared: all 6
 * branch landing pages declare branchName, and all 171 service and switch
 * pages declare brandLabel (90 service and 9 switch pages sit at single-site
 * brands where the two strings are equal, so they satisfy either form).
 *
 * The direction that matters is a branch landing page falling back to the bare
 * brandLabel. A brand landing page exists precisely to separate two sites: with
 * "McCanns Chemist" on both the Aigburth and the Sandringham landing page,
 * Google is handed two pages at two different addresses carrying one identical
 * entity name, which is the merge this page family was built to prevent. The
 * old rule passed that happily. It now fails.
 */

var fs = require("fs");
var path = require("path");

var ROOT = path.resolve(__dirname, "..");
var DATA = path.join(ROOT, "branches.json");
var PAGE_DIRS = [
  path.join(ROOT, "modules", "service", "pages"),
  path.join(ROOT, "modules", "switch", "pages"),
  path.join(ROOT, "modules", "branch", "pages")
];

// The only @type any generated branch page may declare. Pharmacy is a subtype
// of MedicalBusiness and of LocalBusiness, so it says everything the vaguer
// types say and one thing more.
var REQUIRED_TYPE = "Pharmacy";

/*
 * Exceptions live here, with a reason and a question id, same convention as
 * KNOWN_DRIFT in check-cdn-pins.js. A key that no longer breaks a rule fails
 * the run, so the list cannot rot. Do not widen a rule to make a run pass.
 * Shape: "<page filename>::<rule key>": "reason"
 */
var KNOWN = {};

var failures = [];
var notes = [];
var knownHit = {};

function fail(msg) { failures.push(msg); }

function known(file, rule, msg) {
  var key = file + "::" + rule;
  if (Object.prototype.hasOwnProperty.call(KNOWN, key)) {
    knownHit[key] = true;
    notes.push("KNOWN " + key + ": " + KNOWN[key]);
    return true;
  }
  fail(msg);
  return false;
}

var data = JSON.parse(fs.readFileSync(DATA, "utf8"));
var branches = data.branches.filter(function (b) { return !b.disposed; });

function branchFor(file) {
  var hits = branches.filter(function (b) {
    return b.brandSlug && b.townSlug &&
      file.indexOf(b.brandSlug) !== -1 && file.indexOf(b.townSlug) !== -1;
  });
  // Longest slug pair wins, so "sk-chemists-bootle" cannot be claimed by a
  // branch whose slug is a substring of it.
  hits.sort(function (a, b) {
    return (b.brandSlug.length + b.townSlug.length) - (a.brandSlug.length + a.townSlug.length);
  });
  return hits[0] || null;
}

function blocksIn(html) {
  var out = [];
  var re = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  var m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

function mapQueries(html) {
  var out = [];
  var re = /google\.com\/maps\?q=([^"&]+)/g;
  var m;
  while ((m = re.exec(html)) !== null) {
    try { out.push(decodeURIComponent(m[1])); }
    catch (e) { out.push("__UNDECODABLE__ " + m[1]); }
  }
  return out;
}

function tidy(s) { return String(s === undefined || s === null ? "" : s).replace(/\s+/g, " ").trim(); }

console.log("check-jsonld");

var checked = 0;
var unmatched = 0;
var typeCounts = {};
var nameFamilies = {};
var mapsChecked = 0;

PAGE_DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(function (file) {
    if (!/\.html$/i.test(file)) return;
    if (/^DRAFT-/i.test(file)) return;

    var full = path.join(dir, file);
    var rel = path.relative(ROOT, full).replace(/\\/g, "/");
    var html = fs.readFileSync(full, "utf8");
    var b = branchFor(file);
    if (!b) {
      unmatched++;
      notes.push("no branch matched from the filename, skipped: " + rel);
      return;
    }
    checked++;

    // Rule 1
    var raw = blocksIn(html);
    if (raw.length !== 1) {
      known(file, "blocks", rel + ": expected exactly one JSON-LD block, found " + raw.length);
      if (!raw.length) return;
    }
    var obj;
    try {
      obj = JSON.parse(raw[0]);
    } catch (e) {
      fail(rel + ": JSON-LD block does not parse as JSON (" + e.message + ")");
      return;
    }

    // Rule 2
    typeCounts[obj["@type"]] = (typeCounts[obj["@type"]] || 0) + 1;
    if (obj["@type"] !== REQUIRED_TYPE) {
      known(file, "type", rel + ': "@type" is "' + obj["@type"] + '" but every branch page must declare "' +
        REQUIRED_TYPE + '". Pharmacy is a subtype of MedicalBusiness, so it is never less accurate, and one page family typed differently splits the entity.');
    }
    if (obj["@context"] !== "https://schema.org") {
      fail(rel + ': "@context" is "' + obj["@context"] + '", expected "https://schema.org"');
    }

    // Rule 3. Module-aware: see the note at the top of this file. The family is
    // taken from the directory the page was found in, not from its filename, so
    // a renamed page cannot slip into the wrong family.
    var family = path.basename(path.dirname(dir)); // branch | service | switch
    var wantName = (family === "branch") ? b.branchName : b.brandLabel;
    var wantWhich = (family === "branch") ? "branchName" : "brandLabel";
    nameFamilies[family + ":" + wantWhich] = (nameFamilies[family + ":" + wantWhich] || 0) + 1;
    if (obj.name !== wantName) {
      known(file, "name", rel + ': "name" is "' + obj.name + '" but a ' + family +
        ' page must declare ' + wantWhich + ', which branches.json gives as "' + wantName + '"' +
        (obj.name === b.branchName || obj.name === b.brandLabel
          ? '. It is this branch\'s other name, which is why the old either/or rule passed it.'
          : '.'));
    }

    // Rule 4
    var wantUrl = b.website + "/" + file;
    if (obj.url !== wantUrl) {
      known(file, "url", rel + ': "url" is "' + obj.url + '" but the branch website and this filename give "' + wantUrl + '"');
    }

    // Rule 5
    var a = obj.address;
    if (!a) {
      known(file, "address", rel + ": JSON-LD carries no address");
    } else {
      if (a["@type"] !== "PostalAddress") fail(rel + ': address "@type" is "' + a["@type"] + '", expected "PostalAddress"');
      [["streetAddress", b.streetAddress], ["addressLocality", b.addressLocality],
       ["postalCode", b.postalCode], ["addressRegion", b.addressRegion],
       ["addressCountry", b.addressCountry || "GB"]].forEach(function (pair) {
        if (tidy(a[pair[0]]) !== tidy(pair[1])) {
          known(file, "addr." + pair[0], rel + ": address." + pair[0] + ' is "' + a[pair[0]] + '" but branches.json says "' + pair[1] + '"');
        }
      });
    }

    // Rule 6. Compared as typed, not normalised: the phone on the page is the
    // phone a person reads, and spacing is part of it.
    if (tidy(obj.telephone) !== tidy(b.phone)) {
      known(file, "telephone", rel + ': "telephone" is "' + obj.telephone + '" but branches.json says "' + b.phone + '"');
    }

    // Rule 7
    if (obj.email !== undefined && obj.email !== b.email) {
      known(file, "email", rel + ': "email" is "' + obj.email + '" but branches.json says "' + b.email + '"');
    }
    if (obj.areaServed !== undefined) {
      var got = (Array.isArray(obj.areaServed) ? obj.areaServed : [obj.areaServed]).map(function (x) {
        return typeof x === "string" ? x : (x && x.name);
      });
      var want = b.serviceAreaList || [];
      if (got.join(" | ") !== want.join(" | ")) {
        known(file, "areaServed", rel + ": areaServed is [" + got.join(", ") + "] but serviceAreaList is [" + want.join(", ") + "]");
      }
    }

    // Rule 8. The one address on the page that no text search can read.
    var wantMap = [b.streetAddress, b.addressLocality, b.postalCode].join(", ");
    var maps = mapQueries(html);
    if (!maps.length) {
      known(file, "map", rel + ": no Google Maps query found, so the contact card cannot be checked against branches.json");
    }
    maps.forEach(function (q) {
      mapsChecked++;
      if (tidy(q).toLowerCase() !== tidy(wantMap).toLowerCase()) {
        known(file, "map", rel + ": the map iframe points at \"" + q + '" but branches.json gives "' + wantMap + '"');
      }
    });
  });
});

// A KNOWN entry that no longer describes a real breach is worse than no entry
// at all, because it hides the next one. Fail on it.
Object.keys(KNOWN).forEach(function (key) {
  if (!knownHit[key]) {
    fail("stale KNOWN entry " + key + ": nothing breaks that rule any more, so remove it from check-jsonld.js");
  }
});

console.log("  " + checked + " generated page(s) checked against " + branches.length + " trading branches");
console.log("  " + mapsChecked + " map iframe address(es) decoded and compared");
console.log("  @type declared: " + Object.keys(typeCounts).sort().map(function (t) {
  return t + " x" + typeCounts[t];
}).join(", "));
console.log("  name checked per family: " + Object.keys(nameFamilies).sort().map(function (k) {
  return k + " x" + nameFamilies[k];
}).join(", "));
if (unmatched) console.log("  " + unmatched + " page(s) skipped, no branch matched from the filename");

notes.forEach(function (n) { console.log("  " + n); });

if (failures.length) {
  console.log("");
  failures.forEach(function (f) { console.log("  FAIL  " + f); });
  console.log("");
  console.log("check-jsonld: " + failures.length + " failure(s).");
  process.exit(1);
}
console.log("");
console.log("check-jsonld: clean, every JSON-LD block and map address agrees with branches.json" +
  (Object.keys(KNOWN).length ? ", " + Object.keys(KNOWN).length + " known issue(s) awaiting a decision." : "."));
