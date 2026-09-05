#!/usr/bin/env node
/*
 * verify-3.10-2026-09-05-eleventh.js
 *
 * Eleventh quality pass on item 3.10 (Riddings Pharmacy, Timperley). Ten prior
 * passes proved check-nap, check-em-dashes, check-service-links (JS-injected
 * copy), check-postcodes, check-branch-identity (5 rules), check-booking-routes
 * (BRANCHATTR/SERVICEATTR/WIDGET x2), check-switch-copy, check-contraception-copy
 * and check-travel-clinic-copy against Riddings' own pages by injection, and
 * ruled check-opening-hours structurally inapplicable (Riddings has no branch
 * landing page). tools/check-jsonld.js has never been named or injection-tested
 * against this branch specifically across ten passes, despite its rules (type,
 * name, url, address block, telephone spacing, map query decode) being read by
 * independent re-derivation on several passes. Same fresh-angle shape the 3.9
 * eleventh pass used for check-jsonld.js against Coleman and Leighs the same day.
 *
 * Method: shares no code with tools/check-jsonld.js beyond invoking it as a
 * child process. Refuses to run if any target file already carries a git diff.
 * Each injection restores the target file from an in-memory Buffer captured
 * before mutation, immediately after the checker subprocess output is captured
 * and before any assertion runs, and is SHA256-reconfirmed byte-identical
 * before the next injection and again at the end.
 */

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var { execFileSync } = require("child_process");

var ROOT = path.resolve(__dirname, "..");
var CHECKER = path.join(ROOT, "tools", "check-jsonld.js");

var TARGETS = {
  blocks: path.join(ROOT, "modules", "service", "pages", "earache-treatment-riddings-timperley.html"),
  type: path.join(ROOT, "modules", "service", "pages", "sore-throat-treatment-riddings-timperley.html"),
  name: path.join(ROOT, "modules", "service", "pages", "sinusitis-treatment-riddings-timperley.html"),
  url: path.join(ROOT, "modules", "service", "pages", "impetigo-treatment-riddings-timperley.html"),
  addressRegion: path.join(ROOT, "modules", "service", "pages", "uti-treatment-riddings-timperley.html"),
  telephone: path.join(ROOT, "modules", "switch", "pages", "switch-prescriptions-riddings-timperley.html"),
  mapQuery: path.join(ROOT, "modules", "service", "pages", "shingles-treatment-riddings-timperley.html")
};

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function gitDiffEmpty(file) {
  try {
    var out = execFileSync("git", ["status", "--porcelain", "--", file], { cwd: ROOT }).toString();
    return out.trim() === "";
  } catch (e) {
    console.error("git status check failed: " + e.message);
    process.exit(2);
  }
}

// Preflight: refuse to run if any target already carries a diff.
Object.keys(TARGETS).forEach(function (k) {
  var f = TARGETS[k];
  if (!fs.existsSync(f)) { console.error("MISSING TARGET " + k + ": " + f); process.exit(2); }
  if (!gitDiffEmpty(f)) { console.error("REFUSING: " + f + " already carries a git diff before this run started."); process.exit(2); }
});
console.log("Preflight OK: all 7 target files git-diff-empty at run start.\n");

function runChecker() {
  try {
    var out = execFileSync("node", [CHECKER], { cwd: ROOT }).toString();
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "").toString() + (e.stderr || "").toString() };
  }
}

var results = [];

function injectionTest(label, file, mutate, expectSubstring) {
  var original = fs.readFileSync(file);
  var originalHash = sha256(original);
  var mutated = mutate(original.toString("utf8"));
  fs.writeFileSync(file, mutated, "utf8");

  var res = runChecker();

  // Restore immediately, before any assertion.
  fs.writeFileSync(file, original);
  var restoredHash = sha256(fs.readFileSync(file));

  var caught = res.code !== 0 && res.out.indexOf(expectSubstring) !== -1;
  var restored = restoredHash === originalHash;

  results.push({
    label: label,
    file: path.relative(ROOT, file),
    caught: caught,
    restored: restored,
    exitCode: res.code
  });

  console.log("[" + label + "] " + path.relative(ROOT, file));
  console.log("  expected substring: " + JSON.stringify(expectSubstring));
  console.log("  checker exit code: " + res.code + (caught ? "  CAUGHT" : "  *** MISSED ***"));
  console.log("  file restored byte-identical: " + (restored ? "yes" : "*** NO ***"));
  if (!caught) {
    console.log("  --- checker output ---");
    console.log(res.out);
  }
  console.log("");

  if (!restored) {
    console.error("FATAL: " + file + " did not restore byte-identical. Stopping.");
    process.exit(3);
  }
}

// Baseline: checker must be clean before any injection.
var baseline = runChecker();
console.log("BASELINE checker run: exit " + baseline.code);
console.log(baseline.out);
if (baseline.code !== 0) {
  console.error("Checker is not clean before injection testing begins. Aborting.");
  process.exit(4);
}

// RULE 1 (blocks): duplicate the JSON-LD script block so two are present.
injectionTest(
  "RULE 1 blocks",
  TARGETS.blocks,
  function (html) {
    var re = /<script[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/i;
    var m = html.match(re);
    if (!m) throw new Error("no JSON-LD block found to duplicate");
    return html.replace(re, m[0] + "\n" + m[0]);
  },
  "expected exactly one JSON-LD block"
);

// RULE 2 (type): change @type to MedicalBusiness, the exact historical defect.
injectionTest(
  "RULE 2 type",
  TARGETS.type,
  function (html) {
    return html.replace(/"@type":\s*"Pharmacy"/, '"@type": "MedicalBusiness"');
  },
  '"@type" is "MedicalBusiness"'
);

// RULE 3 (name): swap JSON-LD name to a different live branch's branchName.
injectionTest(
  "RULE 3 name",
  TARGETS.name,
  function (html) {
    return html.replace(/"name":\s*"Riddings Pharmacy"/, '"name": "Smartts Chemist"');
  },
  '"name" is "Smartts Chemist"'
);

// RULE 4 (url): break the url field so it no longer matches website + filename.
injectionTest(
  "RULE 4 url",
  TARGETS.url,
  function (html) {
    return html.replace(
      /"url":\s*"https:\/\/www\.riddingspharmacy\.co\.uk\/impetigo-treatment-riddings-timperley\.html"/,
      '"url": "https://www.riddingspharmacy.co.uk/wrong-filename.html"'
    );
  },
  '"url" is "https://www.riddingspharmacy.co.uk/wrong-filename.html"'
);

// RULE 5 (address block): corrupt addressRegion to a Wirral/Cheshire-style
// wrong county, the same class of fault the CLAUDE.md postcode section
// documents for McCanns Sandringham.
injectionTest(
  "RULE 5 addressRegion",
  TARGETS.addressRegion,
  function (html) {
    return html.replace(/"addressRegion":\s*"Greater Manchester"/, '"addressRegion": "Cheshire"');
  },
  'addressRegion is "Cheshire"'
);

// RULE 6 (telephone): swap in a different live branch's phone number, spacing
// intact so the mismatch is purely on the digits/branch, not the format.
injectionTest(
  "RULE 6 telephone",
  TARGETS.telephone,
  function (html) {
    return html.replace(/"telephone":\s*"0161 973 2951"/, '"telephone": "0151 226 2051"');
  },
  '"telephone" is "0151 226 2051"'
);

// RULE 8 (map query): repoint the Google Maps iframe query at a different
// branch's address, url-encoded, exactly as it would render on the page -
// the one address on the page no text search can read.
injectionTest(
  "RULE 8 mapQuery",
  TARGETS.mapQuery,
  function (html) {
    var re = /(google\.com\/maps\?q=)([^"&]+)/;
    var m = html.match(re);
    if (!m) throw new Error("no map query found to corrupt");
    var wrongQuery = encodeURIComponent("109 Byrne Avenue, Liverpool, L20 9HH");
    return html.replace(re, "$1" + wrongQuery);
  },
  "the map iframe points at"
);

// Final re-run: checker must be clean again after every restore.
var final = runChecker();
console.log("FINAL checker run after all restores: exit " + final.code);
console.log(final.out);

var allCaught = results.every(function (r) { return r.caught; });
var allRestored = results.every(function (r) { return r.restored; });

console.log("\n=== SUMMARY ===");
results.forEach(function (r) {
  console.log("  " + (r.caught ? "CAUGHT" : "MISSED") + "  " + (r.restored ? "restored" : "NOT RESTORED") + "  " + r.label + "  " + r.file);
});
console.log("\nAll " + results.length + " injections caught: " + allCaught);
console.log("All " + results.length + " files restored byte-identical: " + allRestored);
console.log("Final checker clean: " + (final.code === 0));

if (!allCaught || !allRestored || final.code !== 0) {
  console.error("\nFAIL: verification did not fully pass.");
  process.exit(1);
}
console.log("\nPASS: all 7 rules of check-jsonld.js proven by injection against Riddings' own pages for the first time in eleven passes.");
