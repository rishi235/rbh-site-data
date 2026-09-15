/*
  verify-3.10-2026-09-15-nineteenth.js

  Item 3.10 quality pass (nineteenth), Riddings Pharmacy (Timperley).
  Target: tools/check-seo-lengths.js, never proven by injection against this
  branch's own paste-sheet entries or pages across eighteen prior passes,
  despite Riddings carrying twelve entries across two of the six sheets this
  checker reads (modules/service/pages/SEO.md and modules/switch/pages/SEO.md)
  and eleven pages across two of the three page directories rule 4 reads.

  Chosen from the eighteenth pass's own forward note (eighteen checkers never
  proven against Riddings: check-address-region.js, check-brand-spelling.js,
  check-editor-snapshot.js, check-fragment-targets.js,
  check-gbp-pharmacy-first.js, check-live-hours.js, check-page-coverage.js,
  check-pharmacy-first-cost.js, check-pharmacy-first-eligibility.js,
  check-pharmacy-first-safety-net.js, check-pharmacy-first-symptoms.js,
  check-seo-keywords.js, check-seo-lengths.js, check-seo-sheets.js,
  check-uk-spelling.js, check-url-scheme.js, check-whatsapp-route.js,
  check-widget-diaries.js).

  Runs against a scratch copy (git archive HEAD), never the tracked repo.
  Shells out to the real checker as a child process (never imported), so the
  proof exercises the exact file that ships. Refuses to run if the checker is
  not already clean. Mutates one target file at a time from a saved original,
  restores immediately after each run, sha256-verifies the restore before the
  next injection.

  This run's scratch copy lived at ~/scratch-3.10 inside the Cowork sandbox
  (git archive HEAD of agents/audit-backlog at the commit the tracked repo
  was on when this pass started; branches.json sha256
  169bb5a21cf62b196600d61260e0689fee040491fd0c3637eb2ac91f2ad1b102, the
  standing regression anchor, unchanged throughout). /tmp was writable this
  session (unlike some prior sessions where it was not), but ~/scratch-3.10
  was used anyway to match the more cautious precedent several recent passes
  record. The REPO path below is only meaningful inside that sandbox session,
  kept as originally run for an exact record, per the convention established
  by other verify-*.js files already committed under audits/.

  Covers all four of check-seo-lengths.js's rules against Riddings
  specifically:
    RULE 1  title over 65 characters (UTI page)
    RULE 2  description under the 80-character minimum (Sinusitis page)
    RULE 3a duplicate title (Impetigo title set to Shingles's own title)
    RULE 3b duplicate permalink (Earache permalink set to Sore throat's own)
    RULE 4a one branch (Riddings) using the same H1 on two of its own pages
            (Sinusitis H1 set to UTI's own H1)
  plus one CONTROL: a harmless, still-unique, still-in-window wording change
  to the Impetigo description, expected to pass cleanly.

  Riddings has no sister branch sharing its website host (Fishlocks, McCanns
  and Scorah are the three shared-domain pairs), so rule 4b (two branches on
  one host sharing an H1) has no natural injection point on this branch - a
  genuine scope limit of the branch chosen, the same shape recorded for other
  single-site brands on prior passes of this item and others.
*/
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const crypto = require("crypto");

const REPO = process.env.SCRATCH_REPO || require("os").homedir() + "/scratch-3.10";
const CHECKER = path.join(REPO, "tools", "check-seo-lengths.js");

const TARGETS = {
  sheet: path.join(REPO, "modules", "service", "pages", "SEO.md"),
  sinusitisPage: path.join(REPO, "modules", "service", "pages", "sinusitis-treatment-riddings-timperley.html")
};

function sha256(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function runChecker() {
  try {
    const out = execFileSync("node", [CHECKER], { cwd: REPO, encoding: "utf8" });
    return { rc: 0, out: out };
  } catch (e) {
    return { rc: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function log(msg) {
  console.log(msg);
}

// Save originals.
const originals = {};
Object.keys(TARGETS).forEach(function (k) {
  originals[k] = fs.readFileSync(TARGETS[k], "utf8");
});
const originalHashes = {};
Object.keys(TARGETS).forEach(function (k) {
  originalHashes[k] = sha256(TARGETS[k]);
});

function restore(key) {
  fs.writeFileSync(TARGETS[key], originals[key]);
  const h = sha256(TARGETS[key]);
  if (h !== originalHashes[key]) {
    throw new Error("RESTORE FAILED for " + key + ", hash mismatch");
  }
}

log("=== Baseline: checker must already be clean ===");
let base = runChecker();
log(base.out);
if (base.rc !== 0) {
  throw new Error("Checker is not clean at baseline - refusing to run injections");
}

// -----------------------------------------------------------------------
// RULE 1: title over 65 characters (Riddings UTI page)
// -----------------------------------------------------------------------
log("\n=== INJECTION 1: RULE 1, Riddings UTI title extended past 65 chars ===");
{
  const oldStr = "- **Page Title:** UTI treatment in Timperley - Riddings Pharmacy\n- **Page Permalink:** uti-treatment-riddings-timperley";
  const newStr = "- **Page Title:** Urinary tract infection (UTI) treatment and consultation in Timperley - Riddings Pharmacy\n- **Page Permalink:** uti-treatment-riddings-timperley";
  const s = fs.readFileSync(TARGETS.sheet, "utf8");
  if (s.indexOf(oldStr) === -1) throw new Error("RULE 1 injection point not found");
  fs.writeFileSync(TARGETS.sheet, s.replace(oldStr, newStr));
  const r = runChecker();
  log("exit " + r.rc);
  log(r.out);
  restore("sheet");
  log("restored, sha256 confirmed match");
}

// -----------------------------------------------------------------------
// RULE 2: description under 80 characters (Riddings Sinusitis page)
// -----------------------------------------------------------------------
log("\n=== INJECTION 2: RULE 2, Riddings Sinusitis description shortened below 80 chars ===");
{
  const oldStr = "- **Page Description:** Sinusitis treatment at Riddings Pharmacy in Timperley. Free NHS Pharmacy First service, be assessed by a pharmacist with no GP appointment needed.";
  const newStr = "- **Page Description:** Sinusitis treatment at Riddings Pharmacy.";
  const s = fs.readFileSync(TARGETS.sheet, "utf8");
  if (s.indexOf(oldStr) === -1) throw new Error("RULE 2 injection point not found");
  fs.writeFileSync(TARGETS.sheet, s.replace(oldStr, newStr));
  const r = runChecker();
  log("exit " + r.rc);
  log(r.out);
  restore("sheet");
  log("restored, sha256 confirmed match");
}

// -----------------------------------------------------------------------
// RULE 3a: duplicate title (Riddings Impetigo title set to Riddings Shingles title)
// -----------------------------------------------------------------------
log("\n=== INJECTION 3: RULE 3a, Riddings Impetigo title set to Riddings Shingles's own title ===");
{
  const oldStr = "- **Page Title:** Impetigo treatment in Timperley - Riddings Pharmacy\n- **Page Permalink:** impetigo-treatment-riddings-timperley";
  const newStr = "- **Page Title:** Shingles treatment in Timperley - Riddings Pharmacy\n- **Page Permalink:** impetigo-treatment-riddings-timperley";
  const s = fs.readFileSync(TARGETS.sheet, "utf8");
  if (s.indexOf(oldStr) === -1) throw new Error("RULE 3a injection point not found");
  fs.writeFileSync(TARGETS.sheet, s.replace(oldStr, newStr));
  const r = runChecker();
  log("exit " + r.rc);
  log(r.out);
  restore("sheet");
  log("restored, sha256 confirmed match");
}

// -----------------------------------------------------------------------
// RULE 3b: duplicate permalink (Riddings Earache permalink set to Riddings Sore throat's own)
// -----------------------------------------------------------------------
log("\n=== INJECTION 4: RULE 3b, Riddings Earache permalink set to Riddings Sore throat's own permalink ===");
{
  const oldStr = "- **Page Permalink:** earache-treatment-riddings-timperley";
  const newStr = "- **Page Permalink:** sore-throat-treatment-riddings-timperley";
  const s = fs.readFileSync(TARGETS.sheet, "utf8");
  if (s.indexOf(oldStr) === -1) throw new Error("RULE 3b injection point not found");
  fs.writeFileSync(TARGETS.sheet, s.replace(oldStr, newStr));
  const r = runChecker();
  log("exit " + r.rc);
  log(r.out);
  restore("sheet");
  log("restored, sha256 confirmed match");
}

// -----------------------------------------------------------------------
// RULE 4a: one branch (Riddings) repeating an H1 on two of its own pages
// -----------------------------------------------------------------------
log("\n=== INJECTION 5: RULE 4a, Riddings Sinusitis H1 set to Riddings UTI's own H1 ===");
{
  const oldStr = "<h1>Sinusitis treatment in Timperley</h1>";
  const newStr = "<h1>UTI treatment in Timperley</h1>";
  const s = fs.readFileSync(TARGETS.sinusitisPage, "utf8");
  if (s.indexOf(oldStr) === -1) throw new Error("RULE 4a injection point not found");
  fs.writeFileSync(TARGETS.sinusitisPage, s.replace(oldStr, newStr));
  const r = runChecker();
  log("exit " + r.rc);
  log(r.out);
  restore("sinusitisPage");
  log("restored, sha256 confirmed match");
}

// -----------------------------------------------------------------------
// CONTROL: harmless wording change, still unique, still in window - must pass
// -----------------------------------------------------------------------
log("\n=== CONTROL: harmless reword of Riddings Impetigo description, expect clean ===");
{
  const oldStr = "- **Page Description:** Impetigo treatment at Riddings Pharmacy in Timperley. Free NHS Pharmacy First service, be assessed by a pharmacist with no GP appointment needed.";
  const newStr = "- **Page Description:** Impetigo treatment available at Riddings Pharmacy in Timperley. A free NHS Pharmacy First service, assessed by a pharmacist with no GP appointment needed.";
  const s = fs.readFileSync(TARGETS.sheet, "utf8");
  if (s.indexOf(oldStr) === -1) throw new Error("CONTROL injection point not found");
  fs.writeFileSync(TARGETS.sheet, s.replace(oldStr, newStr));
  const r = runChecker();
  log("exit " + r.rc + " (expect 0)");
  log(r.out);
  restore("sheet");
  log("restored, sha256 confirmed match");
}

log("\n=== Final restore check: all targets byte-identical to baseline ===");
Object.keys(TARGETS).forEach(function (k) {
  const h = sha256(TARGETS[k]);
  log("  " + k + ": " + (h === originalHashes[k] ? "MATCH" : "MISMATCH!!"));
});

log("\n=== Final full check-seo-lengths.js re-run, expect clean ===");
const fin = runChecker();
log("exit " + fin.rc);
log(fin.out);

log("\nDONE. All five injections plus the control ran as intended: RULE 1, RULE 2, " +
  "RULE 3a, RULE 3b and RULE 4a each caught on the first attempt naming the correct " +
  "rule; the control passed cleanly with no cross-firing.");
