#!/usr/bin/env node
/*
 * verify-5.2-2026-09-10-fifteenth.js
 *
 * Item 5.2 quality pass, fifteenth. Fourteen prior passes have proven
 * check-address-region.js, check-branch-identity.js, check-branch-links.js,
 * check-brand-spelling.js, check-live-hours.js, check-nap.js,
 * check-opening-hours.js, check-pharmacy-first-eligibility.js,
 * check-seo-keywords.js and (indirectly, via bespoke scripts rather than the
 * real checker) JSON-LD name/telephone/email fields against these six
 * branch landing pages, but tools/check-jsonld.js itself - the checker whose
 * own header names this exact page family as the reason Rule 3 was
 * tightened on 2026-08-14 (Q18) - has never been run and proven BY
 * INJECTION against any of item 5.2's own four pages (McCanns Aigburth,
 * McCanns Sandringham, Scorah Bramhall, Scorah Hazel Grove). Target chosen:
 * modules/branch/pages/pharmacy-mccanns-aigburth.html.
 *
 * Same discipline as every prior injection instrument on this item and on
 * 3.9/3.10/6.2 today: shells out to the real tools/check-jsonld.js as a
 * child process (no import from tools/ beyond invoking it), refuses to run
 * if the target file already carries a git diff, records the pre-mutation
 * buffer and its sha256 once, restores from the in-memory buffer
 * immediately after capturing each injection's output and BEFORE any
 * assertion, sha256-reconfirms and re-checks git status after every
 * restore. Each injection mutates a freshly restored copy.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const TARGET = path.join(ROOT, "modules", "branch", "pages", "pharmacy-mccanns-aigburth.html");
const CHECKER = path.join(ROOT, "tools", "check-jsonld.js");

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }
function gitDiffEmpty(rel) {
  const out = execFileSync("git", ["status", "--porcelain", "--", rel], { cwd: ROOT }).toString();
  return out.trim() === "";
}
function runChecker() {
  try {
    const out = execFileSync("node", [CHECKER], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, out: out.toString() };
  } catch (e) {
    return { code: e.status, out: (e.stdout ? e.stdout.toString() : "") + (e.stderr ? e.stderr.toString() : "") };
  }
}

const relTarget = path.relative(ROOT, TARGET).replace(/\\/g, "/");

console.log("verify-5.2-2026-09-10-fifteenth: proving check-jsonld.js against " + relTarget);
console.log("");

if (!gitDiffEmpty(relTarget)) {
  console.error("REFUSING TO RUN: " + relTarget + " already carries a git diff. Clean it first.");
  process.exit(2);
}

const original = fs.readFileSync(TARGET);
const originalSha = sha256(original);
console.log("baseline sha256 " + originalSha + " (" + original.length + " bytes)");

const baseline = runChecker();
console.log("baseline checker exit code: " + baseline.code + " (expect 0)");
if (baseline.code !== 0) {
  console.error("REFUSING TO RUN: checker is not clean before any injection. Output:\n" + baseline.out);
  process.exit(2);
}

let pass = 0, fail = 0;

function restore(label) {
  fs.writeFileSync(TARGET, original);
  const nowSha = sha256(fs.readFileSync(TARGET));
  const diffClean = gitDiffEmpty(relTarget);
  if (nowSha !== originalSha || !diffClean) {
    console.error("RESTORE FAILED after " + label + ": sha " + nowSha + " diffClean=" + diffClean);
    process.exit(3);
  }
}

function inject(label, ruleTag, mutateFn, expectSubstring) {
  const html = original.toString("utf8");
  const mutated = mutateFn(html);
  if (mutated === html) {
    console.error("  [" + label + "] MUTATION NO-OP - the target string was not found. Aborting.");
    fail++;
    return;
  }
  fs.writeFileSync(TARGET, mutated, "utf8");
  const result = runChecker();
  restore(label);
  const caught = result.code !== 0 && result.out.indexOf(expectSubstring) !== -1;
  if (caught) {
    pass++;
    console.log("  [" + ruleTag + "] " + label + " - CAUGHT");
  } else {
    fail++;
    console.log("  [" + ruleTag + "] " + label + " - NOT CAUGHT AS EXPECTED. exit=" + result.code);
    console.log("    expected substring: " + expectSubstring);
    console.log("    actual output:\n" + result.out.split("\n").map(function (l) { return "      " + l; }).join("\n"));
  }
}

console.log("");
console.log("INJECTION ROUND (8 injections, one per rule, each restored byte-identical before the next):");

// Rule 1: exactly one JSON-LD block - inject a second, bogus block. This
// page fragment (a Weebly paste block, no <body> tag of its own) ends
// immediately after the existing JSON-LD </script>, so append straight
// after that rather than assuming a </body> exists.
inject(
  "second JSON-LD block appended",
  "RULE 1 blocks",
  function (html) {
    var marker = '  ]\n}\n</script>';
    if (html.indexOf(marker) === -1) return html;
    return html.replace(
      marker,
      marker + '\n<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"bogus"}</script>'
    );
  },
  "expected exactly one JSON-LD block, found 2"
);

// Rule 2: @type must be Pharmacy.
inject(
  '"@type" changed to MedicalBusiness',
  "RULE 2 type",
  function (html) { return html.replace('"@type": "Pharmacy"', '"@type": "MedicalBusiness"'); },
  '"@type" is "MedicalBusiness"'
);

// Rule 3: name must be branchName (Q18). Swap to the bare shared brandLabel,
// the exact regression Q18 exists to catch on this page family.
inject(
  '"name" changed to bare brandLabel "McCanns Chemist"',
  "RULE 3 name",
  function (html) { return html.replace('"name": "McCanns Chemist Aigburth"', '"name": "McCanns Chemist"'); },
  '"name" is "McCanns Chemist"'
);

// Rule 4: url must be website + filename.
inject(
  '"url" pointed at a different filename',
  "RULE 4 url",
  function (html) {
    return html.replace(
      '"url": "https://www.mccannspharmacy.co.uk/pharmacy-mccanns-aigburth.html"',
      '"url": "https://www.mccannspharmacy.co.uk/pharmacy-mccanns-sandringham.html"'
    );
  },
  '"url" is "https://www.mccannspharmacy.co.uk/pharmacy-mccanns-sandringham.html"'
);

// Rule 5: address fields must match branches.json field for field. Swap
// addressRegion to a borough, the exact CLAUDE.md schema fault this field
// exists to prevent.
inject(
  '"addressRegion" changed from Merseyside to Liverpool (borough, not county)',
  "RULE 5 address",
  function (html) { return html.replace('"addressRegion": "Merseyside"', '"addressRegion": "Liverpool"'); },
  'address.addressRegion is "Liverpool"'
);

// Rule 6: telephone must match branches.json exactly, spacing included.
inject(
  '"telephone" swapped to Scorah Bramhall\'s real number',
  "RULE 6 telephone",
  function (html) { return html.replace('"telephone": "0151 727 3185"', '"telephone": "0161 439 2233"'); },
  '"telephone" is "0161 439 2233"'
);

// Rule 7a: email must match branches.json.
inject(
  '"email" rewritten to an unrelated address',
  "RULE 7 email",
  function (html) { return html.replace('"email": "Aigburth@rbhealth.co.uk"', '"email": "wrong@rbhealth.co.uk"'); },
  '"email" is "wrong@rbhealth.co.uk"'
);

// Rule 8: the map iframe query must decode to the branch's own address.
// Uses McCanns Sandringham's real postcode (L17 4JP), its own sister branch
// on the same shared domain, rather than a fabricated value, so this
// injection does not itself trip check-postcodes.js with an unknown string.
inject(
  "map iframe query changed to sister branch McCanns Sandringham's real postcode",
  "RULE 8 map",
  function (html) {
    return html.replace(
      "google.com/maps?q=112%20Aigburth%20Road%2C%20Liverpool%2C%20L17%207BP&output=embed",
      "google.com/maps?q=112%20Aigburth%20Road%2C%20Liverpool%2C%20L17%204JP&output=embed"
    );
  },
  "the map iframe points at"
);

console.log("");
console.log(pass + " passed, " + fail + " failed (of " + (pass + fail) + " injections)");

const finalSha = sha256(fs.readFileSync(TARGET));
const finalDiffClean = gitDiffEmpty(relTarget);
console.log("final sha256 " + finalSha + " (byte-identical to baseline: " + (finalSha === originalSha) + ")");
console.log("final git diff clean: " + finalDiffClean);

const afterAll = runChecker();
console.log("checker exit code after full round: " + afterAll.code + " (expect 0)");

if (fail > 0 || finalSha !== originalSha || !finalDiffClean || afterAll.code !== 0) {
  console.error("");
  console.error("FAILED: see above.");
  process.exit(1);
}

console.log("");
console.log("All 8 rules of check-jsonld.js proven by injection against " + relTarget + ". File restored byte-identical throughout.");

