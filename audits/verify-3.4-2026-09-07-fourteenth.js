#!/usr/bin/env node
/*
 * verify-3.4-2026-09-07-fourteenth.js
 *
 * Item 3.4 (Cherry Lane Pharmacy, Walton), fourteenth quality pass.
 *
 * The genuinely untested angle this pass closes: thirteen prior passes proved,
 * by direct injection against Cherry Lane's own pages and branch record,
 * check-nap.js, check-postcodes.js, check-em-dashes.js, check-whatsapp-route.js,
 * check-service-links.js, check-switch-copy.js, check-branch-identity.js,
 * check-booking-routes.js and check-seo-pattern.js. tools/check-jsonld.js - the
 * checker guarding the one part of every page written for a machine rather than
 * a person, and the one CLAUDE.md's own "The JSON-LD block, and the address no
 * text search can read" section names directly - had never been proven by
 * injection against Cherry Lane's own pages. A grep of this item's entire
 * AGENT_WORKLIST.md section (2680-3251, all thirteen prior passes) for
 * "check-jsonld" returned zero hits.
 *
 * Method matches every prior pass on this item: refuses to run if any target
 * file already carries a git diff, records each target's sha256 before any
 * mutation, restores by direct fs.writeFileSync from an in-memory Buffer
 * immediately after capturing the checker's output and BEFORE any assertion so
 * a thrown assertion can never leave a file mutated on disk, sha256-reconfirms
 * identical-to-baseline after every restore. One mutation at a time. Real
 * checker invoked as a child process, nothing imported from tools/.
 */

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var { execFileSync } = require("child_process");

var ROOT = "/sessions/wonderful-peaceful-brahmagupta/mnt/rbh-site-data";
var CHECKER = path.join(ROOT, "tools", "check-jsonld.js");

var TARGETS = {
  uti: path.join(ROOT, "modules/service/pages/uti-treatment-cherry-lane-walton.html"),
  earache: path.join(ROOT, "modules/service/pages/earache-treatment-cherry-lane-walton.html"),
  sorethroat: path.join(ROOT, "modules/service/pages/sore-throat-treatment-cherry-lane-walton.html"),
  shingles: path.join(ROOT, "modules/service/pages/shingles-treatment-cherry-lane-walton.html"),
  insectbite: path.join(ROOT, "modules/service/pages/insect-bite-treatment-cherry-lane-walton.html"),
};

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }
function must(cond, msg) { if (!cond) { throw new Error("ASSERTION FAILED: " + msg); } }

// Refuse to run if any target already carries a git diff.
var gitDiff = execFileSync("git", ["status", "--porcelain", "--", ...Object.values(TARGETS)], { cwd: ROOT }).toString();
must(gitDiff.trim() === "", "target files already carry a git diff, refusing to run:\n" + gitDiff);

var baseline = {};
Object.keys(TARGETS).forEach(function (k) {
  var buf = fs.readFileSync(TARGETS[k]);
  baseline[k] = { buf: buf, sha: sha256(buf) };
});

function runChecker() {
  try {
    var out = execFileSync("node", [CHECKER], { cwd: ROOT, encoding: "utf8" });
    return { exit: 0, out: out };
  } catch (e) {
    return { exit: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function restore(k) {
  fs.writeFileSync(TARGETS[k], baseline[k].buf);
  var now = sha256(fs.readFileSync(TARGETS[k]));
  must(now === baseline[k].sha, k + ": restore failed to reproduce baseline sha256");
}

function withMutation(k, mutateFn, label, expectSubstr) {
  var original = baseline[k].buf.toString("utf8");
  var mutated = mutateFn(original);
  must(mutated !== original, label + ": mutation produced no change, test is void");
  fs.writeFileSync(TARGETS[k], mutated, "utf8");
  var result = runChecker();
  // Restore BEFORE any assertion on the result, so a failed assertion never
  // leaves a mutated file on disk.
  restore(k);
  console.log("--- " + label + " ---");
  console.log("exit: " + result.exit);
  var caught = result.exit !== 0 && result.out.indexOf(expectSubstr) !== -1;
  console.log(caught ? "CAUGHT (contains expected substring)" : "NOT CAUGHT");
  if (!caught) {
    console.log("FULL OUTPUT:\n" + result.out);
  }
  return caught;
}

var results = {};

// (1) RULE 2 @type - uti page, Pharmacy -> LocalBusiness (a real, valid but
// vaguer schema.org type, exactly the shape of the real 3.10-pass defect this
// checker exists to guard against).
results.type = withMutation("uti", function (s) {
  return s.replace(/"@type"\s*:\s*"Pharmacy"/, '"@type": "LocalBusiness"');
}, "RULE 2 @type (uti page, Pharmacy -> LocalBusiness)", '"@type" is "LocalBusiness"');

// (2) RULE 6 telephone - earache page, Cherry Lane's own phone swapped for
// Smartts Chemist Bootle's (0151 944 9351), a real, different live branch's
// number, inside the JSON-LD telephone field only (not the visible tel: link,
// so this isolates check-jsonld.js's own rule from check-nap.js's).
results.telephone = withMutation("earache", function (s) {
  return s.replace(/("telephone"\s*:\s*")0151 226 2051(")/, "$10151 944 9351$2");
}, "RULE 6 telephone (earache page, own JSON-LD phone -> Smartts Bootle's)", '"telephone" is "0151 944 9351"');

// (3) RULE 5 address.addressRegion - sore-throat page, Merseyside -> Cheshire
// (a real county value used elsewhere in the estate, e.g. Riddings Timperley),
// the exact schema.org field CLAUDE.md flags as the one Google reads to place
// the business, and the one field a plain visible-text scan would not catch
// since the county rarely appears in prose copy.
results.addressRegion = withMutation("sorethroat", function (s) {
  return s.replace(/("addressRegion"\s*:\s*")Merseyside(")/, "$1Cheshire$2");
}, "RULE 5 address.addressRegion (sore-throat page, Merseyside -> Cheshire)", 'address.addressRegion is "Cheshire"');

// (4) RULE 4 url - shingles page, own filename swapped for a different Cherry
// Lane page's filename inside the JSON-LD url field, so the value stays a
// real, live, same-branch URL and only the url-vs-filename correspondence
// breaks (a subtler defect than a foreign branch's url would be).
results.url = withMutation("shingles", function (s) {
  return s.replace(
    /("url"\s*:\s*")https:\/\/www\.cherrylanepharmacy\.co\.uk\/shingles-treatment-cherry-lane-walton\.html(")/,
    "$1https://www.cherrylanepharmacy.co.uk/uti-treatment-cherry-lane-walton.html$2"
  );
}, "RULE 4 url (shingles page, own url -> a different Cherry Lane page's url)", 'shingles-treatment-cherry-lane-walton.html');

// (5) RULE 8 map iframe - insect-bite page, the Google Maps query swapped for
// a different Cherry Lane page's un-encoded literal text (still a real string,
// still decodes cleanly, only wrong): "202 Cherry Lane, Bootle, L4 8SG" - the
// exact citation-consistency shape (a foreign town slotted into the postal
// address) the item's own fourth-pass defect was, but this time inside the
// one field CLAUDE.md calls "the address no text search can read", never
// exercised on this checker for this branch before.
results.map = withMutation("insectbite", function (s) {
  return s.replace(
    /google\.com\/maps\?q=202%20Cherry%20Lane%2C%20Liverpool%2C%20L4%208SG/,
    "google.com/maps?q=202%20Cherry%20Lane%2C%20Bootle%2C%20L4%208SG"
  );
}, "RULE 8 map iframe (insect-bite page, own address -> Bootle substituted for Liverpool)", "the map iframe points at");

console.log("\n=== SUMMARY ===");
var allCaught = true;
Object.keys(results).forEach(function (k) {
  console.log(k + ": " + (results[k] ? "CAUGHT" : "NOT CAUGHT"));
  if (!results[k]) allCaught = false;
});

// Final sha256 re-confirmation, all five targets, after all restores.
Object.keys(TARGETS).forEach(function (k) {
  var now = sha256(fs.readFileSync(TARGETS[k]));
  must(now === baseline[k].sha, k + ": FINAL sha256 check failed, file not byte-identical to baseline");
});
console.log("\nAll five target files sha256-confirmed byte-identical to pre-test baseline.");

var finalGitDiff = execFileSync("git", ["status", "--porcelain", "--", ...Object.values(TARGETS)], { cwd: ROOT }).toString();
must(finalGitDiff.trim() === "", "target files carry a git diff after restore:\n" + finalGitDiff);
console.log("git status --porcelain on all five target files: empty, confirmed after restore.");

if (!allCaught) {
  console.log("\nFAILURE: not all injections were caught. See NOT CAUGHT entries above.");
  process.exit(1);
}
console.log("\nAll five injections caught on first attempt with the expected rule.");
