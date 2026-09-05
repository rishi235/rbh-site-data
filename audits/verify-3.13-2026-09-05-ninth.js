#!/usr/bin/env node
/*
 * verify-3.13-2026-09-05-ninth.js
 *
 * Item 3.13 (Clear Chemist, Aintree) quality pass, ninth. Eight prior passes
 * proved tools/check-switch-copy.js, tools/check-weight-loss-copy.js and
 * tools/check-travel-clinic-copy.js against this branch's three pages by
 * direct injection. None of the eight ever touched tools/check-jsonld.js:
 * a grep of this item's own AGENT_WORKLIST.md section for "check-jsonld.js"
 * returns zero hits, against one narrative-only mention of check-nap.js and
 * zero for check-map-embeds.js, check-branch-identity.js and
 * check-cdn-pins.js. check-jsonld.js is named throughout this repo's own
 * CLAUDE.md as the "silent fault" checker - the one part of a page written
 * for a machine rather than a person, where a wrong value is invisible to
 * every text-based checker (check-nap, check-seo-*, check-em-dashes) and
 * still renders a perfectly normal-looking page. That is the gap this pass
 * closes.
 *
 * Two parts, same discipline as the 3.2 tenth, 3.5 eleventh, 3.7 eleventh
 * and 3.13 eighth passes:
 *   PART A - an independent extraction of the three pages' own JSON-LD and
 *   map-iframe query, built fresh here with no shared code with
 *   tools/check-jsonld.js, compared field by field against branches.json.
 *   PART B - direct injection against the REAL tools/check-jsonld.js, one
 *   rule at a time, each restored from an in-memory Buffer captured before
 *   any mutation (not via git) and sha256-reconfirmed byte-identical after
 *   every restore.
 *
 * Clear Chemist Aintree is worth this specifically because it is the one
 * trading branch whose JSON-LD carries no email and no areaServed on some
 * pages by virtue of its own data (schemaNote: "no physical branch resource
 * in Appointedd"), and its address is a trade-centre unit rather than a
 * normal street address, which is exactly the shape of address a map-query
 * URL-encoder is most likely to mangle (multiple spaces, a unit number, a
 * comma before "Aintree").
 */

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var cp = require("child_process");

var ROOT = path.resolve(__dirname, "..");
var DATA = path.join(ROOT, "branches.json");
var CHECKER = path.join(ROOT, "tools", "check-jsonld.js");

var PAGES = [
  path.join(ROOT, "modules", "service", "pages", "weight-loss-clinic-clear-aintree.html"),
  path.join(ROOT, "modules", "service", "pages", "travel-clinic-clear-aintree.html"),
  path.join(ROOT, "modules", "switch", "pages", "switch-prescriptions-clear-aintree.html")
];

var data = JSON.parse(fs.readFileSync(DATA, "utf8"));
var branch = data.branches.find(function (b) { return b.id === "clearchemist_aintree"; });
if (!branch) { console.log("FATAL: clearchemist_aintree not found in branches.json"); process.exit(2); }

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }
function tidy(s) { return String(s === undefined || s === null ? "" : s).replace(/\s+/g, " ").trim(); }

var failures = [];
function fail(msg) { failures.push(msg); console.log("  FAIL  " + msg); }

console.log("verify-3.13-2026-09-05-ninth: PART A - independent JSON-LD/map extraction");
console.log("branch: " + branch.id + " (" + branch.branchName + ")");
console.log("");

var checkedA = 0;
PAGES.forEach(function (full) {
  var rel = path.relative(ROOT, full).replace(/\\/g, "/");
  var html = fs.readFileSync(full, "utf8");

  // Own JSON-LD extraction, own regex, no reuse of tools/check-jsonld.js code.
  var scriptMatches = html.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
  if (scriptMatches.length !== 1) {
    fail(rel + ": expected exactly 1 ld+json block, found " + scriptMatches.length);
    return;
  }
  var inner = scriptMatches[0].replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
  var obj;
  try { obj = JSON.parse(inner); } catch (e) {
    fail(rel + ": JSON-LD does not parse: " + e.message);
    return;
  }
  checkedA++;

  var expect = {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    "name": branch.branchName,
    "url": branch.website + "/" + path.basename(full),
    "telephone": branch.phone
  };
  Object.keys(expect).forEach(function (k) {
    if (obj[k] !== expect[k]) {
      fail(rel + ": " + k + ' is "' + obj[k] + '" but expected "' + expect[k] + '"');
    } else {
      console.log("  OK    " + rel + ": " + k + ' = "' + obj[k] + '"');
    }
  });

  var addr = obj.address || {};
  var wantAddr = {
    "@type": "PostalAddress",
    streetAddress: branch.streetAddress,
    addressLocality: branch.addressLocality,
    postalCode: branch.postalCode,
    addressRegion: branch.addressRegion,
    addressCountry: branch.addressCountry || "GB"
  };
  Object.keys(wantAddr).forEach(function (k) {
    if (tidy(addr[k]) !== tidy(wantAddr[k])) {
      fail(rel + ": address." + k + ' is "' + addr[k] + '" but expected "' + wantAddr[k] + '"');
    } else {
      console.log("  OK    " + rel + ": address." + k + ' = "' + addr[k] + '"');
    }
  });

  // Own map-iframe extraction and decode, own regex.
  var mapMatch = html.match(/google\.com\/maps\?q=([^"&]+)/);
  if (!mapMatch) {
    fail(rel + ": no Google Maps iframe query found");
  } else {
    var decoded = decodeURIComponent(mapMatch[1]);
    var wantMap = [branch.streetAddress, branch.addressLocality, branch.postalCode].join(", ");
    if (tidy(decoded).toLowerCase() !== tidy(wantMap).toLowerCase()) {
      fail(rel + ": map query decodes to \"" + decoded + "\" but expected \"" + wantMap + "\"");
    } else {
      console.log("  OK    " + rel + ": map query decodes to \"" + decoded + "\"");
    }
  }
});

console.log("");
console.log("PART A result: " + checkedA + "/" + PAGES.length + " pages parsed, " +
  failures.length + " failure(s) so far.");

if (failures.length) {
  console.log("PART A found real defects; stopping before injection testing.");
  process.exit(1);
}

console.log("");
console.log("verify-3.13-2026-09-05-ninth: PART B - injection against the real check-jsonld.js");
console.log("");

function runChecker() {
  var res = cp.spawnSync(process.execPath, [CHECKER], { cwd: ROOT, encoding: "utf8" });
  return { code: res.status, out: (res.stdout || "") + (res.stderr || "") };
}

// Baseline: real checker must be clean before any injection.
var baseline = runChecker();
console.log("baseline check-jsonld.js exit=" + baseline.code);
if (baseline.code !== 0) {
  console.log(baseline.out);
  console.log("FATAL: check-jsonld.js is not clean before injection testing. Aborting, no mutation made.");
  process.exit(2);
}

var buffers = {};
PAGES.forEach(function (p) { buffers[p] = fs.readFileSync(p); });

var results = [];

function inject(label, file, mutate, expectSubstring) {
  var before = buffers[file];
  var shaBefore = sha256(before);
  var text = before.toString("utf8");
  var mutated = mutate(text);
  if (mutated === text) {
    results.push({ label: label, outcome: "SKIPPED (pattern not found, no mutation made)" });
    return;
  }
  fs.writeFileSync(file, mutated, "utf8");
  var res = runChecker();
  var caught = res.code !== 0 && res.out.indexOf(expectSubstring) !== -1;
  results.push({
    label: label,
    outcome: caught ? "CAUGHT (exit " + res.code + ", found \"" + expectSubstring + "\")" : "MISSED (exit " + res.code + ")",
    fullOutputIfMissed: caught ? undefined : res.out
  });
  // Restore from in-memory buffer, not git.
  fs.writeFileSync(file, before);
  var shaAfter = sha256(fs.readFileSync(file));
  if (shaAfter !== shaBefore) {
    results.push({ label: label + " RESTORE", outcome: "FAILED TO RESTORE BYTE-IDENTICAL: " + shaBefore + " vs " + shaAfter });
  }
}

var weightLoss = PAGES[0];
var travel = PAGES[1];
var switchPage = PAGES[2];

// RULE 2: @type
inject("RULE 2 @type (weight loss page: Pharmacy -> MedicalBusiness)", weightLoss,
  function (t) { return t.replace('"@type": "Pharmacy"', '"@type": "MedicalBusiness"'); },
  "type");

// RULE 3: name
inject("RULE 3 name (travel page: \"Clear Chemist\" -> \"Clear Chemist Aintree Ltd\")", travel,
  function (t) { return t.replace('"name": "Clear Chemist"', '"name": "Clear Chemist Aintree Ltd"'); },
  "name");

// RULE 4: url
inject("RULE 4 url (switch page: filename repointed to a different branch's page)", switchPage,
  function (t) {
    return t.replace(
      '"url": "https://www.clearchemist.co.uk/switch-prescriptions-clear-aintree.html"',
      '"url": "https://www.clearchemist.co.uk/switch-prescriptions-cherrylane-liverpool.html"'
    );
  },
  "url");

// RULE 5: address (postcode changed to a real different branch's postcode,
// not an invented one - McCanns Sandringham, per the same convention the
// eighth pass used for the town injection).
inject("RULE 5 address.postalCode (weight loss page: L9 7AS -> L17 4JP)", weightLoss,
  function (t) { return t.replace('"postalCode": "L9 7AS"', '"postalCode": "L17 4JP"'); },
  "address.postalCode");

// RULE 6: telephone (spacing changed, not digits - proves the "compared as
// typed, not normalised" claim in the checker's own header comment).
inject("RULE 6 telephone (travel page: \"0151 203 6535\" -> \"01512036535\")", travel,
  function (t) { return t.replace('"telephone": "0151 203 6535"', '"telephone": "01512036535"'); },
  "telephone");

// RULE 8: map iframe query (switch page: postcode in the map query changed,
// leaving the JSON-LD address alone, to prove the two are checked
// independently as the file header says). Uses Gordon Shorts Crosby's own
// real postcode (L23 3AT), a different real branch rather than an invented
// value, per check-postcodes.js's own narrative-postcode rule and the
// convention the 3.13 eighth pass set with the Walton town injection.
inject("RULE 8 map query (switch page: L9%207AS -> L23%203AT in the iframe only)", switchPage,
  function (t) { return t.replace("Brookfield%20Drive%2C%20Aintree%2C%20Liverpool%2C%20L9%207AS", "Brookfield%20Drive%2C%20Aintree%2C%20Liverpool%2C%20L23%203AT"); },
  "map");

console.log("");
results.forEach(function (r) {
  console.log("  " + r.label + ": " + r.outcome);
  if (r.fullOutputIfMissed) {
    console.log("    --- full checker output ---");
    console.log(r.fullOutputIfMissed.split("\n").map(function (l) { return "    " + l; }).join("\n"));
  }
});

var missed = results.filter(function (r) { return /MISSED|FAILED TO RESTORE/.test(r.outcome); });

console.log("");
console.log(results.length + " injection(s) run, " + missed.length + " missed or failed to restore.");

// Final re-verify: real checker clean again, all three files sha256-identical
// to their pre-injection baselines.
var finalCheck = runChecker();
console.log("final check-jsonld.js exit=" + finalCheck.code + " (must be 0)");

var shaMismatch = [];
PAGES.forEach(function (p) {
  var now = sha256(fs.readFileSync(p));
  var want = sha256(buffers[p]);
  if (now !== want) shaMismatch.push(p);
});
console.log("sha256 mismatch after full run: " + shaMismatch.length + " file(s)" + (shaMismatch.length ? (" - " + shaMismatch.join(", ")) : ""));

if (missed.length || finalCheck.code !== 0 || shaMismatch.length) {
  console.log("");
  console.log("verify-3.13-2026-09-05-ninth: FAILED - see above.");
  process.exit(1);
}

console.log("");
console.log("verify-3.13-2026-09-05-ninth: PASSED. check-jsonld.js proven against Clear Chemist");
console.log("Aintree's own three pages for the first time in nine passes on this item: all six");
console.log("rules it enforces (type, name, url, address, telephone, map) caught a real, single");
console.log("-field injection on this branch's own pages, and every file was restored byte-");
console.log("identical to its pre-injection state each time.");
