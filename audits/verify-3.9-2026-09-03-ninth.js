#!/usr/bin/env node
/*
 * verify-3.9-2026-09-03-ninth.js
 *
 * Item 3.9 quality pass, ninth machine-era pass, 2026-09-03.
 *
 * Fresh angle: the eight prior passes on this item (2026-08-12 through
 * 2026-09-02) proved NAP, postcodes, em-dashes, seoTown/street contamination,
 * POM-name scanning, booking-widget assignment, map embeds, meta keywords,
 * CDN pins, in-page fragments, URL scheme and the GBP pack's blood-pressure
 * cohort wording against this branch, all by injection or independent
 * extraction. None of the eight touched tools/check-gbp-packs.js's DAY-based
 * hours rules or its sister-branch-claim rule against THIS branch's own pack,
 * gbp-packs/coleman-leigh-walton.md - and Coleman and Leighs is one of the
 * seven branches in the estate that closes for lunch (Monday to Friday,
 * 9:00am to 1:00pm and 2:00pm to 6:00pm), which is exactly the shape of
 * branch check-gbp-packs.js's own header calls out as the estate's loudest
 * hours fault (CLAUDE.md "A right answer in the wrong unit", and the live
 * smarttschemist.co.uk 9-to-6-straight-through fault the checker's splitDay
 * rule was written to stop reaching another profile the same way).
 *
 * Two parts, per this item's established discipline:
 *   PART 1 - independent re-derivation, sharing no code with tools/, of the
 *            branch's own open/closed days and split-day status straight
 *            from branches.json, checked against what the pack's hours line
 *            and paster notes actually say.
 *   PART 2 - four injections into a scratch copy of the ONE pack file this
 *            branch owns, each restored and sha256-verified before the next,
 *            proving check-gbp-packs.js's day-open, day-open-reverse,
 *            day-closed, splitDay-warning and sister-branch-absence rules
 *            actually fire against Coleman and Leighs specifically rather
 *            than being proved only by the estate-wide 15-pack sweep.
 *
 * Refuses to run if the target file already carries a git diff. Restores by
 * direct fs.writeFileSync immediately after capturing the checker
 * subprocess's output and BEFORE any assertion runs, so a thrown assertion
 * can never leave the file mutated on disk.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const PACK_FILE = path.join(ROOT, "gbp-packs", "coleman-leigh-walton.md");
const BRANCHES_FILE = path.join(ROOT, "branches.json");

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
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

console.log("=== verify-3.9-2026-09-03-ninth.js ===\n");

if (!gitDiffEmpty("gbp-packs/coleman-leigh-walton.md")) {
  console.error("REFUSING TO RUN: gbp-packs/coleman-leigh-walton.md already has an uncommitted diff.");
  process.exit(2);
}

const branches = JSON.parse(fs.readFileSync(BRANCHES_FILE, "utf8")).branches;
const b = branches.find((x) => x.id === "colemanleigh_liverpool");
if (!b) { console.error("branch not found"); process.exit(2); }

// ---------------------------------------------------------------------
// PART 1 - independent re-derivation from branches.json
// ---------------------------------------------------------------------
console.log("--- PART 1: independent re-derivation from branches.json ---");

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const spec = (b.openingHours && b.openingHours.specification) || [];
const dataOpen = new Set();
for (const s of spec) for (const d of (s.dayOfWeek || [])) dataOpen.add(d);
const dataClosed = new Set(
  (b.openingHours && b.openingHours.closedDays && b.openingHours.closedDays.length)
    ? b.openingHours.closedDays
    : DAY_NAMES.filter((d) => !dataOpen.has(d))
);

assert(
  DAY_NAMES.every((d) => dataOpen.has(d) || dataClosed.has(d)),
  "every day of the week should be classified open or closed by branches.json"
);
assert(
  ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].every((d) => dataOpen.has(d)),
  "Monday-Friday should be open per branches.json"
);
assert(
  dataClosed.has("Saturday") && dataClosed.has("Sunday"),
  "Saturday and Sunday should be closed per branches.json"
);

// split-day detection, re-derived independently of check-gbp-packs.js's own
// splitDay IIFE. Note: the real checker's IIFE returns the FIRST day it
// finds with more than one session (an early return inside its loop), which
// for Coleman is "Monday" only, since that is first in dayOfWeek order in
// both sessions - it is a message-wording choice, not a claim that only one
// day is split. The DATA reality, and what this independent pass checks, is
// that all five weekdays carry two sessions each (uniform lunch closure).
const sessionCount = {};
for (const s of spec) for (const d of (s.dayOfWeek || [])) sessionCount[d] = (sessionCount[d] || 0) + 1;
const splitDays = DAY_NAMES.filter((d) => (sessionCount[d] || 0) > 1);
assert(
  splitDays.length === 5 && ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].every((d) => splitDays.includes(d)),
  "all five weekdays should carry two sessions each (uniform Mon-Fri lunch closure)"
);
console.log(`  split days detected (data-true, all sessions counted): ${splitDays.join(", ")}`);
console.log(`  (the real checker's splitDay() reports only the first match, "Monday", for its message - a wording choice, not a gap, confirmed by reading tools/check-gbp-packs.js lines 2827-2837)`);

const packText = fs.readFileSync(PACK_FILE, "utf8");
const flat = packText.replace(/\s+/g, " ");

// Hours line present and states both ranges
const hoursLineMatch = flat.match(/- Hours:\s*([^\n]*?)(?:\s*- Website:|$)/i);
assert(!!hoursLineMatch, "pack should carry a '- Hours:' line");
const hoursLine = hoursLineMatch ? hoursLineMatch[1] : "";
assert(/9:00am to 1:00pm/.test(hoursLine) && /2:00pm to 6:00pm/.test(hoursLine), "hours line should state both halves of the split day explicitly");
assert(/Saturday and Sunday closed/i.test(hoursLine), "hours line should state the weekend closure explicitly");

// splitDay warning phrase present, independently worded regex (not imported
// from check-gbp-packs.js's own RANGES pattern)
const tellsPasterIndependent = /(gbp|google)[^.]{0,160}?two\s+(?:separate\s+)?(?:time\s+)?ranges/i.test(flat)
  || /two\s+(?:separate\s+)?(?:time\s+)?ranges[^.]{0,160}?(gbp|google)/i.test(flat);
assert(tellsPasterIndependent, "pack should tell the paster GBP needs two time ranges for the split day");

// sister-branch rule: Coleman and Leighs has no sibling on the same brand
const sisters = branches.filter((o) => o.id !== b.id && o.brandLabel === b.brandLabel && o.disposed !== true);
assert(sisters.length === 0, "Coleman and Leighs should have no live sibling sharing its brandLabel (single-site brand)");
assert(!/\bsister branch(?:es)?\b/i.test(flat), "pack should not currently claim a sister branch (it has none)");

console.log(`Part 1: ${checks} checks, ${failures} failures.\n`);

// ---------------------------------------------------------------------
// PART 2 - injection round against the real checker
// ---------------------------------------------------------------------
console.log("--- PART 2: injection round against tools/check-gbp-packs.js ---");

const originalBytes = fs.readFileSync(PACK_FILE);
const originalSha = sha256(PACK_FILE);

function runChecker() {
  try {
    execFileSync("node", ["tools/check-gbp-packs.js"], { cwd: ROOT, stdio: "pipe" });
    return { code: 0, out: "" };
  } catch (e) {
    return { code: e.status || 1, out: (e.stdout ? e.stdout.toString() : "") + (e.stderr ? e.stderr.toString() : "") };
  }
}

function withMutation(label, mutateFn, expectFail, expectSubstring) {
  const before = fs.readFileSync(PACK_FILE, "utf8");
  const mutated = mutateFn(before);
  let result;
  try {
    fs.writeFileSync(PACK_FILE, mutated);
    result = runChecker();
  } finally {
    // restore BEFORE any assertion, unconditionally
    fs.writeFileSync(PACK_FILE, originalBytes);
  }
  const restoredSha = sha256(PACK_FILE);
  const restoredOk = restoredSha === originalSha;
  const caught = expectFail ? result.code !== 0 : result.code === 0;
  const nameHit = expectSubstring ? result.out.includes(expectSubstring) : true;
  checks++;
  if (!restoredOk) { failures++; console.log(`  FAIL: ${label} - file not byte-identical after restore`); }
  checks++;
  if (!caught) { failures++; console.log(`  FAIL: ${label} - checker exit code ${result.code}, expected ${expectFail ? "non-zero" : "zero"}`); }
  checks++;
  if (!nameHit) { failures++; console.log(`  FAIL: ${label} - expected substring "${expectSubstring}" not found in output`); }
  console.log(`  ${label}: exit=${result.code} restored=${restoredOk} ${nameHit ? "(substring matched)" : ""}`);
  return result;
}

// (1) day-open-reverse: drop Friday from the Monday-Friday range
withMutation(
  "1. drop Friday from the open-day range",
  (t) => t.replace(/Monday to Friday 9:00am to 1:00pm and 2:00pm to 6:00pm/, "Monday to Thursday 9:00am to 1:00pm and 2:00pm to 6:00pm"),
  true,
  "does not state Friday as an open day"
);

// (2) day-open: claim Saturday as open when branches.json holds it closed
withMutation(
  "2. falsely claim Saturday open",
  (t) => t.replace("Saturday and Sunday closed", "Saturday 9:00am to 1:00pm, Sunday closed"),
  true,
  "hours line states the branch is open on Saturday"
);

// (3) splitDay warning: remove the "two time ranges" instruction from the
// paster notes, leaving the hours line itself untouched. Matched with \s+
// standing in for every line wrap rather than literal newlines, since these
// packs wrap mid-sentence (the same lesson check-gbp-packs.js's own header
// records for reading this exact file).
withMutation(
  "3. remove the split-day GBP instruction",
  (t) => {
    const re = /-\s+GBP hours need two time ranges per weekday[\s\S]*?Saturday and Sunday closed\.\s*\n/;
    if (!re.test(t)) throw new Error("mutation 3 regex did not match - fix the probe before trusting its result");
    return t.replace(re, "- Saturday and Sunday closed.\n");
  },
  true,
  "must tell the paster the profile needs two time ranges"
);

// (4) sister-branch: falsely claim a sister branch in the description.
// "Serving Walton, Liverpool\nand Sefton." wraps mid-sentence in the pack,
// so this matches on \s+ rather than a literal string.
withMutation(
  "4. inject a false sister-branch claim",
  (t) => {
    const re = /Serving Walton,\s+Liverpool\s+and Sefton\./;
    if (!re.test(t)) throw new Error("mutation 4 regex did not match - fix the probe before trusting its result");
    return t.replace(re, "Serving Walton, Liverpool and Sefton. Our sister branch is in Bootle.");
  },
  true,
  "no other live branch in branches.json carries the brand"
);

console.log(`\nPart 2: ${checks - failures >= 0 ? "" : ""}total checks so far ${checks}, failures ${failures}.`);

// final integrity confirmation
const finalSha = sha256(PACK_FILE);
console.log(`\nFinal sha256 check: ${finalSha === originalSha ? "MATCH (file untouched)" : "MISMATCH - INVESTIGATE"}`);
if (finalSha !== originalSha) { failures++; checks++; }

console.log(`\n=== TOTAL: ${checks} checks, ${failures} failures ===`);
process.exit(failures ? 1 : 0);
