#!/usr/bin/env node
/*
  Item 3.9 quality pass (sixteenth), 2026-09-11 (unattended scheduled run).
  Target: tools/check-weight-loss-copy.js, proven by injection directly
  against Coleman and Leighs Pharmacy's own weight loss page for the first
  time in this item's sixteen-pass history (grepped the item's own
  AGENT_WORKLIST.md section for "weight-loss-copy" and "weight loss copy":
  zero hits naming this checker by file, despite this branch carrying a
  weight-loss-clinic page and a live widget id for it).

  Method: mutate modules/service/pages/weight-loss-clinic-coleman-leigh-
  walton.html ONE way at a time, run the real checker as a child process
  (never imported), capture stdout/exit code, restore from an in-memory
  backup immediately after, sha256-verify the restore before the next
  injection. Nothing else in the tracked tree is touched.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const TARGET = path.join(ROOT, "modules", "service", "pages",
  "weight-loss-clinic-coleman-leigh-walton.html");
const CHECKER = path.join(ROOT, "tools", "check-weight-loss-copy.js");

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function runChecker() {
  try {
    const out = execFileSync(process.execPath, [CHECKER], { cwd: ROOT, encoding: "utf8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

const original = fs.readFileSync(TARGET, "utf8");
const originalSha = sha256(Buffer.from(original, "utf8"));
console.log("BASELINE sha256: " + originalSha);

function restore() {
  fs.writeFileSync(TARGET, original, "utf8");
  const now = sha256(fs.readFileSync(TARGET));
  if (now !== originalSha) {
    console.log("!!! RESTORE FAILED, sha256 mismatch !!!");
    process.exit(2);
  }
}

function tryInjection(label, mutate, expectFail, expectSubstring) {
  const mutated = mutate(original);
  if (mutated === original) {
    console.log("[" + label + "] SKIPPED - mutation had no effect on the target string");
    return;
  }
  fs.writeFileSync(TARGET, mutated, "utf8");
  const result = runChecker();
  const caught = expectFail ? result.code !== 0 : result.code === 0;
  const containsExpected = expectSubstring ? result.out.includes(expectSubstring) : true;
  console.log("[" + label + "] exit=" + result.code +
    " expectFail=" + expectFail +
    " -> " + (caught && containsExpected ? "AS EXPECTED" : "UNEXPECTED"));
  if (expectSubstring) {
    console.log("    looked for: " + JSON.stringify(expectSubstring));
    console.log("    found: " + containsExpected);
  }
  if (!caught || !containsExpected) {
    console.log("    --- checker output (first 40 lines) ---");
    result.out.split("\n").slice(0, 40).forEach((l) => console.log("    " + l));
  }
  restore();
}

// Baseline: checker must be clean before we start.
const base = runChecker();
console.log("PRE-INJECTION checker run: exit=" + base.code);
if (base.code !== 0) {
  console.log("Checker is not clean before any injection - aborting, no mutation attempted.");
  process.exit(1);
}

// 1. RULE 4 (private/free) - inject a free-offer phrase into the hero.
tryInjection(
  "rule4-free-offer",
  (t) => t.replace(
    "This is a paid private service, not an NHS treatment",
    "This is a paid private service, not an NHS treatment, with a free consultation this month"
  ),
  true,
  'offers something "free consultation"'
);

// 2. RULE 5 (eligibility) - drop the pancreatitis screening word.
tryInjection(
  "rule5-eligibility-pancreatitis",
  (t) => t.replace(/pancreatitis/gi, "tummy trouble"),
  true,
  "the four screened conditions"
);

// 3. RULE 6 (no guarantee) - remove one of the four no-guarantee sentences.
tryInjection(
  "rule6-guarantee-dropped",
  (t) => t.replace(
    "This is a professional judgement, not a guarantee.",
    "This is a professional judgement."
  ),
  true,
  "no-guarantee statement"
);

// 4. RULE 7 (price discipline) - inject price-led wording.
tryInjection(
  "rule7-price-led",
  (t) => t.replace(
    "Prices shown are indicative and may change",
    "Special offer this week. Prices shown are indicative and may change"
  ),
  true,
  "price-led wording"
);

// 5. RULE 8 (no medicine named) - name a POM.
tryInjection(
  "rule8-medicine-named",
  (t) => t.replace(
    "Is this service right for you?",
    "Is Mounjaro right for you?"
  ),
  true,
  'names "mounjaro"'
);

// 6. RULE 9 (no efficacy/results claim) - inject a claim pattern.
tryInjection(
  "rule9-results-claim",
  (t) => t.replace(
    "How the Weight Loss Clinic works",
    "How the Weight Loss Clinic delivers results"
  ),
  true,
  "makes"
);

// 7. RULE 10 (governance promise in paste comment) - trim the head comment.
// The raw comment wraps "Superintendent pharmacist" and "signs off wording
// before publish" across two lines; the checker collapses whitespace before
// matching, so the mutation only needs to break the contiguous phrase that
// does not itself cross the line break.
tryInjection(
  "rule10-governance-comment",
  (t) => t.replace(
    "signs off wording before publish",
    "reviews wording"
  ),
  true,
  "governance note"
);

// 8. RULE 2 (pinned copy) - drop one pinned sentence.
tryInjection(
  "rule2-pinned-copy",
  (t) => t.replace(
    "Ongoing monitoring and follow-up built into your plan",
    "Ongoing monitoring built into your plan"
  ),
  true,
  "missing pinned service copy"
);

// 9. CONTROL - append a harmless HTML comment after the closing JSON-LD
// script tag. Comments are blanked before every visible()/headComment()
// read in the checker, and this sits after the only <script> block on the
// page, so it changes the file's sha256 but must not change the checker's
// verdict. Confirms the checker is reading content, not merely noticing any
// diff to the file.
tryInjection(
  "control-harmless-trailing-comment",
  (t) => t + "\n<!-- control probe, no content change -->\n",
  false,
  null
);

console.log("");
console.log("All injections complete. Final restore check:");
const finalSha = sha256(fs.readFileSync(TARGET));
console.log("Final sha256: " + finalSha + " (matches baseline: " + (finalSha === originalSha) + ")");
const finalRun = runChecker();
console.log("Final checker run after restore: exit=" + finalRun.code);
