/*
  audits/verify-3.4-2026-09-04-eleventh.js

  Item 3.4 (Cherry Lane Pharmacy) quality pass, eleventh, 2026-09-04.

  Genuinely untested angle: ten prior passes (third through tenth) proved
  check-nap.js, check-postcodes.js, check-em-dashes.js, check-whatsapp-route.js,
  check-service-links.js and check-switch-copy.js against Cherry Lane's own
  pages by direct injection. None ever ran tools/check-branch-identity.js
  against Cherry Lane's own pages by injection, despite that checker's own
  file header recording that its rule 10 (SERVICELINK) was born from a real
  Cherry Lane defect found on a DIFFERENT worklist item (2.3, 2026-08-12: a
  Pharmacy First condition link on a Cherry Lane page was repointed at Coleman
  and Leighs, the other Walton branch, and all 29 checkers of the day exited
  0). That the fix has held since is not the same claim as this item's own
  instrument having proved it - the same "proved by construction, not by
  injection" gap the ninth and tenth passes closed for other checkers.

  This script shells out to the real tools/check-branch-identity.js as a
  child process (no import, no shared code) and proves five of its ten rules
  against five different Cherry Lane pages, one injection at a time:

    1. RULE identity   - contraception-cherry-lane-walton.html: data-branch
                         emptied on the module root.
    2. RULE owner      - earache-treatment-cherry-lane-walton.html:
                         data-branch swapped for Smartts Chemist's name.
    3. RULE schemaname - sore-throat-treatment-cherry-lane-walton.html:
                         JSON-LD "name" swapped for Hirshmans Chemist's name.
    4. RULE outbound   - shingles-treatment-cherry-lane-walton.html: the
                         Google review link swapped for Smartts Chemist's.
    5. RULE servicelink - pharmacy-first-cherry-lane-walton.html: the
                         shingles condition tile link repointed at Coleman
                         and Leighs' equivalent page (cross-host: Coleman and
                         Leighs is served from a different domain), the same
                         shape of injection as the real 2026-08-12 defect.

  Discipline matches the eighth/ninth/tenth passes' own instruments: refuses
  to run if any target file already carries a git diff, records every target
  file's sha256 before any mutation, restores by direct fs.writeFileSync from
  the in-memory original Buffer immediately after capturing the checker's
  output and BEFORE any assertion (so a thrown assertion can never leave a
  file mutated on disk), and re-confirms sha256-identical after each restore.
*/
"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var { execFileSync } = require("child_process");

var ROOT = path.join(__dirname, "..");
var CHECKER = path.join(ROOT, "tools", "check-branch-identity.js");

var TARGETS = {
  identity: path.join(ROOT, "modules", "service", "pages", "contraception-cherry-lane-walton.html"),
  owner: path.join(ROOT, "modules", "service", "pages", "earache-treatment-cherry-lane-walton.html"),
  schemaname: path.join(ROOT, "modules", "service", "pages", "sore-throat-treatment-cherry-lane-walton.html"),
  outbound: path.join(ROOT, "modules", "service", "pages", "shingles-treatment-cherry-lane-walton.html"),
  servicelink: path.join(ROOT, "modules", "service", "pages", "pharmacy-first-cherry-lane-walton.html")
};

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function gitDiffEmpty(p) {
  var rel = path.relative(ROOT, p).replace(/\\/g, "/");
  var out = execFileSync("git", ["status", "--porcelain", "--", rel], { cwd: ROOT }).toString();
  return out.trim() === "";
}

function runChecker() {
  try {
    var out = execFileSync("node", [CHECKER], { cwd: ROOT }).toString();
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout ? e.stdout.toString() : "") + (e.stderr ? e.stderr.toString() : "") };
  }
}

// -----------------------------------------------------------------------
// Pre-flight: refuse to run if any target already carries a git diff.
// -----------------------------------------------------------------------
Object.keys(TARGETS).forEach(function (k) {
  if (!gitDiffEmpty(TARGETS[k])) {
    console.error("REFUSING TO RUN: " + TARGETS[k] + " already carries a git diff before any injection.");
    process.exit(2);
  }
});

var originals = {};
Object.keys(TARGETS).forEach(function (k) {
  originals[k] = fs.readFileSync(TARGETS[k]);
});

var baseline = runChecker();
if (baseline.code !== 0) {
  console.error("REFUSING TO RUN: baseline check-branch-identity.js is not clean (exit " + baseline.code + ").");
  console.error(baseline.out);
  process.exit(2);
}
console.log("Baseline: check-branch-identity.js clean (exit 0). Proceeding with five injections.\n");

var results = [];

function inject(name, key, mutate, expectTag) {
  var file = TARGETS[key];
  var original = originals[key];
  var text = original.toString("utf8");
  var mutated = mutate(text);
  if (mutated === text) {
    throw new Error(name + ": mutate() produced no change - injection is a no-op, test is invalid");
  }
  fs.writeFileSync(file, mutated, "utf8");
  var res = runChecker();
  // Restore immediately, before any assertion.
  fs.writeFileSync(file, original);
  var restoredSha = sha256(fs.readFileSync(file));
  var originalSha = sha256(original);
  var restoredOk = restoredSha === originalSha;
  var caught = res.code !== 0 && res.out.indexOf(expectTag) !== -1;
  results.push({
    name: name,
    file: path.relative(ROOT, file).replace(/\\/g, "/"),
    caught: caught,
    exitCode: res.code,
    expectTag: expectTag,
    restoredOk: restoredOk,
    outSnippet: res.out.split("\n").filter(function (l) { return l.indexOf("FAIL") !== -1; }).join(" | ")
  });
  if (!restoredOk) {
    throw new Error(name + ": RESTORE FAILED, file not byte-identical to original - STOP, manual intervention needed on " + file);
  }
}

// NOTE ON expectTag: check-branch-identity.js's fail(subject, rule, msg) does
// NOT print the rule name as a bracketed tag the way check-switch-copy.js
// does - it only records it internally for KNOWN-key matching. The first
// version of this script matched on the bare rule word ("identity", "owner",
// "schemaname", "outbound", "servicelink") and every rule but "identity"
// wrongly reported MISSED, because none of those five words appear anywhere
// in the checker's actual console output - "identity" only happened to
// coincidentally match the literal banner line "check-branch-identity" the
// script prints on every run, regardless of pass or fail, which is what let
// rule 1 slip through as an accidental true positive rather than a real one.
// Fixed by matching on a distinctive substring from each rule's own real
// failure message instead. This is a fault in this instrument, not the repo:
// the checker caught all five injections correctly on the first run: the raw
// output already showed the right FAIL line naming the right file, the right
// wrong value and the right owning branch for every one of the five.

// 1. RULE identity - empty data-branch.
inject(
  "1. identity (empty data-branch)",
  "identity",
  function (text) {
    return text.replace(
      /(<div id="rbhsv-root" data-branch=")Cherry Lane Pharmacy(")/,
      "$1$2"
    );
  },
  "carries a module root but no data-branch"
);

// 2. RULE owner - data-branch names another real branch.
inject(
  "2. owner (data-branch -> Smartts Chemist)",
  "owner",
  function (text) {
    return text.replace(
      /(<div id="rbhsv-root" data-branch=")Cherry Lane Pharmacy(")/,
      "$1Smartts Chemist$2"
    );
  },
  "an enquiry from this page is filed against the wrong pharmacy"
);

// 3. RULE schemaname - JSON-LD name names another real branch.
inject(
  "3. schemaname (JSON-LD name -> Hirshmans Chemist)",
  "schemaname",
  function (text) {
    return text.replace(
      /("@type":\s*"Pharmacy",\s*\r?\n\s*"name":\s*")Cherry Lane Pharmacy(")/,
      "$1Hirshmans Chemist$2"
    );
  },
  "Google is told this address belongs to another pharmacy"
);

// 4. RULE outbound - Google review link swapped for another branch's.
inject(
  "4. outbound (Google review link -> Smartts Chemist's)",
  "outbound",
  function (text) {
    return text.split("https://g.page/r/CRF-ODLpmvUAEAE/review").join(
      "https://g.page/r/CVzJUbDqQwReEBM/review"
    );
  },
  "A patient following it rates the wrong shop"
);

// 5. RULE servicelink - a condition tile link repointed at Coleman and
//    Leighs' equivalent page (the real 2026-08-12 defect shape).
inject(
  "5. servicelink (shingles tile -> Coleman and Leighs)",
  "servicelink",
  function (text) {
    return text.split('href="shingles-treatment-cherry-lane-walton.html"').join(
      'href="shingles-treatment-coleman-leigh-walton.html"'
    );
  },
  "so it 404s and the service route is dead"
);

// -----------------------------------------------------------------------
// Final state: re-run the checker clean, re-confirm every file untouched.
// -----------------------------------------------------------------------
var finalRun = runChecker();
var allFilesClean = Object.keys(TARGETS).every(function (k) { return gitDiffEmpty(TARGETS[k]); });

console.log("RESULTS");
results.forEach(function (r) {
  console.log("  " + (r.caught ? "CAUGHT" : "MISSED") + "  " + r.name);
  console.log("    file: " + r.file);
  console.log("    exit: " + r.exitCode + "  expectTag: [" + r.expectTag + "]  restoredOk: " + r.restoredOk);
  if (r.outSnippet) console.log("    " + r.outSnippet);
});

console.log("\nFinal checker run after all restores: exit " + finalRun.code +
  (finalRun.code === 0 ? " (clean)" : " (UNEXPECTED - not clean)"));
console.log("All five target files git-diff-empty after restore: " + allFilesClean);

var allCaught = results.every(function (r) { return r.caught; });
var allRestored = results.every(function (r) { return r.restoredOk; });

console.log("\nSUMMARY: " + results.length + " injection(s), " +
  results.filter(function (r) { return r.caught; }).length + " caught, " +
  results.filter(function (r) { return !r.caught; }).length + " missed. " +
  "All restored byte-identical: " + allRestored + ".");

if (!allCaught || !allRestored || finalRun.code !== 0 || !allFilesClean) {
  console.log("\nFAIL: one or more checks above did not pass.");
  process.exit(1);
}
console.log("\nPASS: all five rules of check-branch-identity.js proved by injection against Cherry Lane's own pages; all files restored byte-identical; checker clean throughout.");
process.exit(0);
