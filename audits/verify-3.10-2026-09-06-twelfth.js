/*
  Item 3.10 quality pass (twelfth machine-era pass), 2026-09-06.

  Riddings Pharmacy (Timperley). Eleven prior quality passes (2026-08-12
  through 2026-09-05) have proven, by direct injection or exhaustive
  extraction, check-nap, check-em-dashes, check-service-links (JS-injected
  copy), check-postcodes, check-branch-identity (5 rules), check-booking-
  routes (BRANCHATTR/SERVICEATTR/WIDGET, twice), check-switch-copy,
  check-contraception-copy, check-travel-clinic-copy and check-jsonld (7 of
  8 rules, rule 7 structurally inapplicable) against this branch's own
  pages, and ruled check-opening-hours structurally inapplicable (Riddings
  has no generated branch landing page). Grepping this item's own
  AGENT_WORKLIST.md section against every tools/check-*.js filename showed
  zero mentions of check-seo-pattern.js in eleven passes - the checker that
  defines and verifies the title/H1/description pattern the whole 3.1-3.13
  worklist series exists to roll out, and the same gap the 3.4 thirteenth
  pass and 3.9 twelfth pass each closed for their own branches earlier
  today. Closed here for Riddings.

  Four standard check-seo-pattern.js injections against four of this
  branch's own pages: two never used for any injection test on this item
  before (insect-bite-treatment, travel-clinic), plus two previously used
  for a DIFFERENT checker's injection (sore-throat-treatment, switch-
  prescriptions), each restored from an in-memory buffer and sha256-
  reconfirmed before the next, run against the REAL checker.

  Run against the LIVE tree (not a scratch copy): every mutation is
  self-restoring and immediately sha256-verified, the same choice the 3.4
  thirteenth-pass and 3.9 twelfth-pass audits made for the same reason.
  Refuses to run if any target file already carries a git diff.
*/
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const REPO = path.resolve(__dirname, "..");
const CHECKER = path.join(REPO, "tools", "check-seo-pattern.js");

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function gitDiffEmpty(relPath) {
  const out = execSync(`git status --porcelain -- "${relPath}"`, { cwd: REPO }).toString();
  return out.trim() === "";
}

function runChecker() {
  try {
    const out = execSync(`node "${CHECKER}"`, { cwd: REPO, stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, out: out.toString() };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "").toString() + (e.stderr || "").toString() };
  }
}

function mutateRunRestore(label, relPath, mutateFn, expectSubstr) {
  const abs = path.join(REPO, relPath);
  if (!gitDiffEmpty(relPath)) {
    throw new Error(`REFUSING: ${relPath} already carries a git diff before this test`);
  }
  const original = fs.readFileSync(abs);
  const originalHash = sha256(original);
  let result;
  try {
    const mutated = mutateFn(original.toString("utf8"));
    if (mutated === original.toString("utf8")) {
      throw new Error(`Mutation for "${label}" did not change ${relPath} - regex failed to match`);
    }
    fs.writeFileSync(abs, mutated, "utf8");
    result = runChecker();
  } finally {
    fs.writeFileSync(abs, original);
    const restoredHash = sha256(fs.readFileSync(abs));
    if (restoredHash !== originalHash) {
      throw new Error(`RESTORE FAILED for ${relPath}: hash mismatch after restore`);
    }
  }
  const caught = result.code !== 0 && result.out.includes(expectSubstr);
  console.log(`[${caught ? "CAUGHT" : "MISSED"}] ${label} (${relPath})`);
  if (!caught) {
    console.log("  --- checker output ---");
    console.log(result.out.split("\n").slice(0, 15).join("\n"));
  }
  if (!gitDiffEmpty(relPath)) {
    throw new Error(`POST-CHECK FAILED: ${relPath} still carries a diff after restore`);
  }
  return caught;
}

console.log("=== check-seo-pattern.js injections against Riddings Pharmacy (Timperley) ===\n");

const baseline = runChecker();
console.log(`Baseline before any mutation: exit ${baseline.code}`);
if (baseline.code !== 0) {
  console.log(baseline.out);
  throw new Error("Baseline is not clean - aborting, will not inject into a dirty repo state");
}

let allCaught = true;

// 1) EXACT TITLE MATCH - append text to the Weebly SEO title line.
// insect-bite-treatment: never used for injection testing on this item
// before, and it is the Q14/fitTitle() family-A page type (the same class
// of page the 3.9 twelfth pass tested at Coleman and Leighs, its origin
// case) - a different reason to pick it than any prior Riddings pass used.
allCaught = mutateRunRestore(
  "EXACT TITLE MATCH",
  "modules/service/pages/insect-bite-treatment-riddings-timperley.html",
  (src) => src.replace(
    /(Weebly page SEO title:\s*Infected insect bite treatment in Timperley - Riddings Pharmacy)/,
    "$1 - Now Open Weekends"
  ),
  "title"
) && allCaught;

// 2) CROSS-TOWN ABSENCE - name a live seoTown not in this branch's
// serviceAreaList (Timperley, Altrincham, Trafford). Riddings is
// single-host (riddingspharmacy.co.uk carries no sister branch per
// hostMap), so no SISTER_TOWNS excuse applies either. travel-clinic: never
// used for injection testing on this item before, despite being one of
// the 15 highest-commitment paid-service pages in the estate.
allCaught = mutateRunRestore(
  "CROSS-TOWN ABSENCE (Ainsdale, not in Timperley/Altrincham/Trafford)",
  "modules/service/pages/travel-clinic-riddings-timperley.html",
  (src) => src.replace(
    /(Weebly page SEO description:[^\n]*malaria prevention advice, subject to clinical suitability\.)/,
    "$1 Also serving patients from Ainsdale."
  ),
  "Ainsdale"
) && allCaught;

// 3) ONE H1 - duplicate the heading. sore-throat-treatment: previously used
// on this item (ninth pass, check-booking-routes SERVICEATTR removal;
// tenth pass, check-branch-identity RULE OWNER) - a different rule of a
// different checker each time, now check-seo-pattern's own h1-count rule.
allCaught = mutateRunRestore(
  "ONE H1",
  "modules/service/pages/sore-throat-treatment-riddings-timperley.html",
  (src) => src.replace(
    /(<h1>Sore throat treatment in Timperley<\/h1>)/,
    "$1\n          <h1>Pharmacy in Ainsdale</h1>"
  ),
  "h1 elements, expected exactly 1"
) && allCaught;

// 4) ONE TITLE LINE - duplicate the head-comment SEO title line. switch
// page: previously used (eighth pass phone swap, ninth pass n/a, eleventh
// pass telephone swap for check-jsonld) - again a different rule of a
// different checker.
allCaught = mutateRunRestore(
  "ONE TITLE LINE",
  "modules/switch/pages/switch-prescriptions-riddings-timperley.html",
  (src) => src.replace(
    /(Weebly page SEO title:[^\n]*\n)/,
    "$1  Weebly page SEO title:       Pharmacy in Ainsdale\n"
  ),
  "'Weebly page SEO title' lines, expected exactly 1"
) && allCaught;

console.log("\nFull check-seo-pattern.js re-check after all four injections:");
const afterAll = runChecker();
console.log(`exit ${afterAll.code}`);
if (afterAll.code !== 0) {
  console.log(afterAll.out);
  throw new Error("Repo not clean after restores");
}

console.log("\n=== RESULT ===");
console.log(allCaught ? "All 4 injections caught on first attempt." : "One or more injections MISSED - see above.");
console.log("No checker logic, generator, page or branches.json content changed in the tracked repo.");

if (!allCaught) {
  process.exitCode = 1;
}
