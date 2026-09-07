/*
  audits/verify-5.2-2026-09-07-thirteenth.js

  Item 5.2 (six branch landing pages), thirteenth quality pass, unattended
  scheduled run. Fresh angle: of the twelve prior passes, tools/check-
  branch-identity.js - the checker whose own docstring exists specifically
  because Fishlocks Chemist, McCanns Chemist and Scorah Chemists each run two
  shops on one shared domain, exactly these six pages - had never been proven
  by injection using the REAL checker binary as a subprocess against these
  pages. The seventh pass (2026-09-01) tested the same JSON-LD name /
  data-branch / app-card surfaces, but through a home-grown script with "own
  regexes", not by invoking tools/check-branch-identity.js itself, which is
  the standard of proof this item's ninth, tenth, eleventh and twelfth passes
  established (check-seo-keywords, check-brand-spelling, check-weight-loss-
  copy RULE 11, check-nap, all proven via the real checker as a subprocess).

  This script invokes the real tools/check-branch-identity.js as a child
  process, refuses to run if modules/branch/pages already carries a git diff,
  records each target's sha256 before any mutation, and restores by direct
  fs.writeFileSync immediately after capturing the checker subprocess's
  output and BEFORE any assertion runs - the same discipline the ninth
  through twelfth passes on this item used. One target mutated at a time,
  never layered; each restored and sha256-reconfirmed before the next.

  Six injections, one per landing page, each isolating a distinct rule of
  check-branch-identity.js's eleven:
    1. Fishlocks Ainsdale   - data-branch swapped to another branch's real
                              branchName (SK Chemists Bootle) -> RULE 2 OWNER
    2. Fishlocks Eccleston  - JSON-LD name swapped to the bare, shared
                              brandLabel ("Fishlocks Chemist") -> RULE 4
                              AMBIGUOUS (the rule this checker exists for)
    3. McCanns Aigburth     - sister-link href repointed at a branch on a
                              DIFFERENT host (Scorah Bramhall) -> RULE 9
                              SISTERLINK cross-domain
    4. McCanns Sandringham  - sister-link visible text changed away from
                              sisterNote()'s own render -> RULE 11 SISTERLABEL
    5. Scorah Bramhall      - a service-page link repointed at the SISTER
                              branch's own Pharmacy First page (same host,
                              so it resolves and silently books the wrong
                              shop) -> RULE 10 SERVICELINK
    6. Scorah Hazel Grove   - Google review link swapped to the sister
                              branch's own googleReviewUrl -> RULE 8 OUTBOUND

  Run: node audits/verify-5.2-2026-09-07-thirteenth.js
*/
"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var { execFileSync } = require("child_process");

var ROOT = path.join(__dirname, "..");
var PAGES_DIR = path.join(ROOT, "modules", "branch", "pages");
var CHECKER = path.join(ROOT, "tools", "check-branch-identity.js");

function sha256(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function gitPorcelain(scope) {
  try {
    return execFileSync("git", ["status", "--porcelain", "--", scope], {
      cwd: ROOT, encoding: "utf8"
    }).trim();
  } catch (e) {
    return "ERROR:" + e.message;
  }
}

// Refuse to run if the target directory is not already clean.
var preDiff = gitPorcelain("modules/branch/pages");
if (preDiff) {
  console.error("REFUSING TO RUN: modules/branch/pages already carries a git diff:");
  console.error(preDiff);
  process.exit(2);
}

function runChecker() {
  try {
    var out = execFileSync("node", [CHECKER], { cwd: ROOT, encoding: "utf8" });
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

var targets = [
  "pharmacy-fishlocks-ainsdale.html",
  "pharmacy-fishlocks-eccleston.html",
  "pharmacy-mccanns-aigburth.html",
  "pharmacy-mccanns-sandringham.html",
  "pharmacy-scorah-bramhall.html",
  "pharmacy-scorah-hazel-grove.html"
].map(function (f) { return path.join(PAGES_DIR, f); });

var originalSha = {};
targets.forEach(function (p) { originalSha[p] = sha256(p); });

var results = [];

function inject(label, filePath, findStr, replaceStr, expectSubstr) {
  var before = fs.readFileSync(filePath, "utf8");
  if (before.indexOf(findStr) === -1) {
    results.push({ label: label, ok: false, note: "FIND STRING NOT PRESENT - injection not applied: " + findStr });
    return;
  }
  var mutated = before.split(findStr).join(replaceStr);
  fs.writeFileSync(filePath, mutated, "utf8");
  var result = runChecker();
  // Restore immediately, before any assertion.
  fs.writeFileSync(filePath, before, "utf8");
  var restoredSha = sha256(filePath);
  var restoredOk = restoredSha === originalSha[filePath];
  var caught = result.code !== 0 && result.out.indexOf(expectSubstr) !== -1;
  results.push({
    label: label,
    ok: caught,
    restoredOk: restoredOk,
    exitCode: result.code,
    matchedExpected: result.out.indexOf(expectSubstr) !== -1,
    excerpt: result.out.split("\n").filter(function (l) { return l.indexOf("FAIL") === 0 || /^\s+FAIL/.test(l); }).slice(0, 5).join("\n")
  });
}

// 1. Fishlocks Ainsdale - RULE 2 OWNER (non-ambiguous mismatch, no shared brand)
inject(
  "1. Fishlocks Ainsdale data-branch -> SK Chemists Bootle branchName (RULE 2 OWNER)",
  targets[0],
  'data-branch="Fishlocks Chemist Ainsdale"',
  'data-branch="SK Chemists Bootle"',
  'data-branch="SK Chemists Bootle" but the page belongs to fishlocks_ainsdale'
);

// 2. Fishlocks Eccleston - RULE 4 AMBIGUOUS (bare shared brandLabel)
inject(
  "2. Fishlocks Eccleston JSON-LD name -> bare brandLabel \"Fishlocks Chemist\" (RULE 4 AMBIGUOUS)",
  targets[1],
  '"name": "Fishlocks Chemist Eccleston",',
  '"name": "Fishlocks Chemist",',
  "which is also the name of this branch's sister shop on the same website"
);

// 3. McCanns Aigburth - RULE 9 SISTERLINK cross-domain
inject(
  "3. McCanns Aigburth sister link -> Scorah Bramhall (different host) (RULE 9 SISTERLINK)",
  targets[2],
  'href="pharmacy-mccanns-sandringham.html">McCanns Chemist Sandringham in St Michael\'s</a>',
  'href="pharmacy-scorah-bramhall.html">McCanns Chemist Sandringham in St Michael\'s</a>',
  "The link is relative, so it cannot reach another website and 404s"
);

// 4. McCanns Sandringham - RULE 11 SISTERLABEL (stale/wrong visible text)
inject(
  "4. McCanns Sandringham sister link text -> wrong label (RULE 11 SISTERLABEL)",
  targets[3],
  '<a href="pharmacy-mccanns-aigburth.html">McCanns Chemist Aigburth</a>',
  '<a href="pharmacy-mccanns-aigburth.html">McCanns Chemist</a>',
  "build-branch-landing-pages.js's own sisterNote() logic would render"
);

// 5. Scorah Bramhall - RULE 10 SERVICELINK (same host, resolves, wrong branch)
inject(
  "5. Scorah Bramhall Pharmacy First link -> Scorah Hazel Grove's page, same host (RULE 10 SERVICELINK)",
  targets[4],
  'href="pharmacy-first-scorah-bramhall.html">Pharmacy First</a>',
  'href="pharmacy-first-scorah-hazel-grove.html">Pharmacy First</a>',
  "so the link resolves and the patient is quietly booked into the wrong pharmacy's service"
);

// 6. Scorah Hazel Grove - RULE 8 OUTBOUND (review link swapped to sister's)
inject(
  "6. Scorah Hazel Grove Google review link -> Scorah Bramhall's own review link (RULE 8 OUTBOUND)",
  targets[5],
  "https://g.page/r/CZbFKrky9BUsEAE/review",
  "https://g.page/r/CZdA75DAMigGEAE/review",
  "A patient following it rates the wrong shop"
);

// Final restoration proof: every target byte-identical to its original.
var allRestored = targets.every(function (p) { return sha256(p) === originalSha[p]; });
var postDiff = gitPorcelain("modules/branch/pages");

console.log("=== verify-5.2-2026-09-07-thirteenth: check-branch-identity.js injection round ===\n");
results.forEach(function (r) {
  console.log((r.ok ? "CAUGHT" : "MISSED") + "  " + r.label);
  if (r.excerpt) console.log("        " + r.excerpt.replace(/\n/g, "\n        "));
  if (r.note) console.log("        " + r.note);
});
console.log("");
console.log("All six targets restored byte-identical to original: " + allRestored);
console.log("git status --porcelain modules/branch/pages after full round: " +
  (postDiff ? "NOT EMPTY -> " + postDiff : "empty"));
var allCaught = results.every(function (r) { return r.ok; });
console.log("\nRESULT: " + (allCaught && allRestored && !postDiff
  ? "ALL SIX INJECTIONS CAUGHT, all targets restored clean."
  : "FAILURE - see above."));
process.exit(allCaught && allRestored && !postDiff ? 0 : 1);
