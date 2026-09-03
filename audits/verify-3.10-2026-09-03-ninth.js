#!/usr/bin/env node
/*
 * verify-3.10-2026-09-03-ninth.js
 *
 * Item 3.10 quality pass, ninth machine-era pass, 2026-09-03.
 *
 * Fresh angle: the eight prior passes on this item (2026-08-04 through
 * 2026-09-02) proved NAP, postcodes, em-dashes, seoTown/street contamination,
 * POM-name scanning, foreign-brandLabel/foreign-ODS scanning, JSON-LD field-
 * for-field matching, map embeds, the switch-copy script-injection gap and the
 * GBP pack's profile basics against Riddings Pharmacy (Timperley) by
 * independent extraction and by injection. None of the eight ran
 * tools/check-booking-routes.js's per-page rules (BRANCHATTR, SERVICEATTR,
 * BRANCH, WIDGET) by injection against Riddings' own pages specifically - the
 * booking chain (branches.json -> generated filename -> service.js routing
 * table -> Appointedd widget id -> data-branch/data-service labelling) had
 * only ever been exercised for this branch by reading, never by injection.
 *
 * check-opening-hours.js was considered and ruled out as this pass's target
 * after research (not a dead end worth silently skipping - recorded in
 * AGENT_WORKLIST.md below): Riddings has no generated branch landing page
 * (confirmed by directory listing), so that checker's page-reading rules
 * (visible hours row, JSON-LD session match, stray-clock-time sweep) never
 * run against this branch at all - only its four estate-wide data-integrity
 * rules do, and those read branches.json directly, not any Riddings page, so
 * an injection into a Riddings file cannot exercise them. This is the same
 * "vacuous for this branch specifically" shape the sixth pass already found
 * for the foreign-ODS scan in check-postcodes.js-adjacent work.
 *
 * Two parts, per this item's established discipline:
 *   PART 1 - independent re-derivation, sharing no code with tools/, of every
 *            Riddings page's expected booking route (service slug -> branch
 *            key -> widget id -> data-branch/data-service wording) straight
 *            from branches.json and modules/service/service.js's own two
 *            tables, read as data rather than imported.
 *   PART 2 - five injections into scratch-restored copies of Riddings' own
 *            generated pages (and, for the WIDGET rule, a scratch-restored
 *            branches.json), each restored and sha256-verified before the
 *            next, proving check-booking-routes.js's BRANCHATTR (wrong
 *            branch, then missing), SERVICEATTR (missing, then cross-branch
 *            wording mismatch) and WIDGET (no-fallback service with its own
 *            widget blanked) rules actually fire against Riddings
 *            specifically rather than being proved only by the estate-wide
 *            177-page sweep.
 *
 * Refuses to run if any target file already carries a git diff. Restores by
 * direct fs.writeFileSync immediately after capturing the checker
 * subprocess's output and BEFORE any assertion runs, so a thrown assertion
 * can never leave a file mutated on disk.
 *
 * Process correction made while writing this script (self-caught before the
 * results below): the first draft asserted each caught failure by testing
 * the checker's raw stdout against its internal rule tag (e.g. /branchattr/,
 * /serviceattr/), but check-booking-routes.js's fail(subject, rule, msg)
 * never prints "rule" to the console - only "msg". That first draft therefore
 * reported all four page-level injections as MISSED even though the checker
 * had genuinely caught every one of them with the correct, specific message.
 * Fixed by asserting against the actual printed message text instead of the
 * internal tag, the same "prove the harness is reading what it thinks it is
 * reading" discipline CLAUDE.md's own repeated "ask which files/lines it
 * read" lesson describes.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const BRANCHES_FILE = path.join(ROOT, "branches.json");
const SERVICE_JS = path.join(ROOT, "modules", "service", "service.js");
const SVC_DIR = path.join(ROOT, "modules", "service", "pages");

const TARGET_FILES = {
  shingles: path.join(SVC_DIR, "shingles-treatment-riddings-timperley.html"),
  earache: path.join(SVC_DIR, "earache-treatment-riddings-timperley.html"),
  soreThroat: path.join(SVC_DIR, "sore-throat-treatment-riddings-timperley.html"),
  contraception: path.join(SVC_DIR, "contraception-riddings-timperley.html"),
};

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
function relOf(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}
function gitDiffEmpty(relPath) {
  const out = execFileSync("git", ["status", "--porcelain", "--", relPath], { cwd: ROOT }).toString();
  return out.trim() === "";
}

let checks = 0;
let failures = 0;
function assert(cond, msg) {
  checks++;
  if (!cond) {
    failures++;
    console.log("  FAIL: " + msg);
  }
}

console.log("=== verify-3.10-2026-09-03-ninth.js ===\n");

// Refuse to run if any target already has an uncommitted diff.
const allTargets = Object.values(TARGET_FILES).concat([BRANCHES_FILE]);
for (const f of allTargets) {
  if (!gitDiffEmpty(relOf(f))) {
    console.error("REFUSING TO RUN: " + relOf(f) + " already has an uncommitted diff.");
    process.exit(2);
  }
}

const branchesRaw = fs.readFileSync(BRANCHES_FILE, "utf8");
const data = JSON.parse(branchesRaw);
const b = data.branches.find((x) => x.id === "riddings_timperley");
if (!b) { console.error("branch not found"); process.exit(2); }

// ---------------------------------------------------------------------
// PART 1 - independent re-derivation of the booking chain for every
// Riddings page carrying a booking mount, sharing no code with tools/.
// ---------------------------------------------------------------------
console.log("--- PART 1: independent re-derivation ---");

const js = fs.readFileSync(SERVICE_JS, "utf8");

// Pull SERVICE_WIDGET_KEYS out of service.js as data, same discipline as the
// checker itself (not required/imported).
const swkBlockM = /SERVICE_WIDGET_KEYS\s*=\s*\{([\s\S]*?)\};/.exec(js);
assert(!!swkBlockM, "could not locate SERVICE_WIDGET_KEYS block in service.js");
const SERVICE_WIDGET_KEYS = {};
{
  const re = /["']?([a-zA-Z0-9-]+)["']?\s*:\s*["']([a-zA-Z0-9]+)["']/g;
  let m;
  while ((m = re.exec(swkBlockM[1]))) SERVICE_WIDGET_KEYS[m[1]] = m[2];
}
assert(Object.keys(SERVICE_WIDGET_KEYS).length > 5, "SERVICE_WIDGET_KEYS parsed too small: " + JSON.stringify(SERVICE_WIDGET_KEYS));

const nfM = /NO_FALLBACK_SERVICE_KEYS\s*=\s*\{([^}]*)\}/.exec(js);
assert(!!nfM, "could not locate NO_FALLBACK_SERVICE_KEYS in service.js");
const NO_FALLBACK = {};
{
  const re = /["']?([a-zA-Z0-9]+)["']?\s*:\s*true/g;
  let m;
  while ((m = re.exec(nfM[1]))) NO_FALLBACK[m[1]] = true;
}
assert(NO_FALLBACK.contraception === true && NO_FALLBACK.weightLoss === true && NO_FALLBACK.travelClinic === true,
  "NO_FALLBACK_SERVICE_KEYS did not parse as expected: " + JSON.stringify(NO_FALLBACK));

// Riddings' own 11 modules/service/pages/ filenames (excludes the switch
// page, which carries no rbhsv-booking mount and is out of scope for this
// checker).
const RIDDINGS_SERVICE_PAGES = fs.readdirSync(SVC_DIR)
  .filter((f) => f.indexOf("riddings-timperley") !== -1 && f.endsWith(".html"));
assert(RIDDINGS_SERVICE_PAGES.length === 11, "expected 11 Riddings service pages, found " + RIDDINGS_SERVICE_PAGES.length + ": " + RIDDINGS_SERVICE_PAGES.join(", "));

RIDDINGS_SERVICE_PAGES.forEach((file) => {
  const slug = file.replace(/\.html$/, "");
  const serviceSlug = slug.replace(/-riddings-timperley$/, "");
  assert(SERVICE_WIDGET_KEYS.hasOwnProperty(serviceSlug), slug + ": service slug \"" + serviceSlug + "\" not in SERVICE_WIDGET_KEYS");
  const widgetKey = SERVICE_WIDGET_KEYS[serviceSlug];
  const own = (b.widgets || {})[widgetKey];
  const usable = own || (!NO_FALLBACK[widgetKey] ? (b.widgets || {}).pharmacyFirst : undefined);
  assert(!!usable, slug + ": no usable widget id derivable (own=" + own + ", noFallback=" + !!NO_FALLBACK[widgetKey] + ")");

  const html = fs.readFileSync(path.join(SVC_DIR, file), "utf8");
  const rootM = /<div id="rbhsv-root"([^>]*)>/.exec(html);
  assert(!!rootM, slug + ": no rbhsv-root mount found");
  const dBranch = /data-branch="([^"]*)"/.exec(rootM[1]);
  const dService = /data-service="([^"]*)"/.exec(rootM[1]);
  assert(!!dBranch && (dBranch[1] === b.branchName || dBranch[1] === b.brandLabel),
    slug + ": data-branch=\"" + (dBranch && dBranch[1]) + "\" does not match branchName/brandLabel \"" + b.branchName + "\"");
  assert(!!dService && dService[1].length > 0, slug + ": data-service missing or empty");
});

console.log("Part 1: " + checks + " checks, " + failures + " failures.\n");

// ---------------------------------------------------------------------
// PART 2 - injection round against the real checker.
// ---------------------------------------------------------------------
console.log("--- PART 2: injection round against tools/check-booking-routes.js ---");

function runChecker() {
  try {
    const out = execFileSync("node", ["tools/check-booking-routes.js"], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, out: out.toString() };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "").toString() + (e.stderr || "").toString() };
  }
}

function withRestore(file, mutateFn, label, expectRe) {
  const before = fs.readFileSync(file, "utf8");
  const beforeHash = sha256(file);
  let result;
  try {
    const mutated = mutateFn(before);
    if (mutated === before) throw new Error("mutator made no change (regex did not match)");
    fs.writeFileSync(file, mutated, "utf8");
    result = runChecker();
  } finally {
    fs.writeFileSync(file, before, "utf8");
  }
  const afterHash = sha256(file);
  assert(afterHash === beforeHash, label + ": file not byte-identical after restore");
  const caught = result.code !== 0 && expectRe.test(result.out);
  assert(caught, label + ": expected checker to fail matching " + expectRe + ", got exit " + result.code + ":\n" + result.out.slice(0, 800));
  console.log("  " + (caught ? "CAUGHT" : "MISSED") + ": " + label);
}

// Baseline: checker clean before the round starts.
{
  const baseline = runChecker();
  assert(baseline.code === 0, "baseline check-booking-routes.js not clean before injection round:\n" + baseline.out.slice(0, 800));
  console.log("  baseline: exit " + baseline.code);
}

// (1) BRANCHATTR - wrong branch: shingles page's data-branch swapped for a
// real, different, live branch's name (Smartts Chemist), not an invented one.
withRestore(
  TARGET_FILES.shingles,
  (s) => s.replace('data-branch="Riddings Pharmacy"', 'data-branch="Smartts Chemist"'),
  "BRANCHATTR wrong-branch (shingles page, data-branch -> Smartts Chemist)",
  /filed against the wrong pharmacy/i
);

// (2) BRANCHATTR - missing: earache page's data-branch attribute removed
// outright (root tag still valid, just missing the attribute).
withRestore(
  TARGET_FILES.earache,
  (s) => s.replace(' data-branch="Riddings Pharmacy"', ""),
  "BRANCHATTR missing (earache page, data-branch removed)",
  /no data-branch on #rbhsv-root/i
);

// (3) SERVICEATTR - missing: sore-throat page's data-service removed.
withRestore(
  TARGET_FILES.soreThroat,
  (s) => s.replace(' data-service="Sore throat treatment"', ""),
  "SERVICEATTR missing (sore-throat page, data-service removed)",
  /no data-service on #rbhsv-root/i
);

// (4) SERVICEATTR - cross-branch wording mismatch: Riddings' own
// contraception page given different data-service wording from every other
// branch's contraception page ("Contraception service" -> "Contraception
// consultation"), which should be caught by the cross-page wording-agreement
// rule rather than the presence rule.
withRestore(
  TARGET_FILES.contraception,
  (s) => s.replace('data-service="Contraception service"', 'data-service="Contraception consultation"'),
  "SERVICEATTR wording-mismatch (contraception page, wording diverges from sister branches)",
  /described 2 different ways in data-service/i
);

// (5) WIDGET - a NO_FALLBACK service (contraception) with its OWN widget
// blanked in branches.json must fail rather than silently falling back to
// the Pharmacy First diary. Mutates branches.json itself, restored the same
// way as every other injection in this script.
withRestore(
  BRANCHES_FILE,
  (s) => {
    // Only touch the riddings_timperley block's contraception widget id.
    const idIdx = s.indexOf('"id": "riddings_timperley"');
    if (idIdx === -1) return s;
    const blockEnd = s.indexOf("\n  }", idIdx);
    const before = s.slice(0, idIdx);
    const block = s.slice(idIdx, blockEnd);
    const after = s.slice(blockEnd);
    const mutatedBlock = block.replace(/"contraception":\s*"[^"]*"/, '"contraception": ""');
    if (mutatedBlock === block) return s;
    return before + mutatedBlock + after;
  },
  "WIDGET no-fallback-service-blanked (branches.json, riddings_timperley.widgets.contraception -> \"\")",
  /needs widgets\.contraception on riddings_timperley and there is none \(this service must not fall back\)/i
);

console.log("\nPart 2: " + checks + " checks, " + failures + " failures (cumulative with Part 1).\n");

console.log("=== TOTAL: " + checks + " checks, " + failures + " failures ===");
process.exit(failures === 0 ? 0 : 1);
