#!/usr/bin/env node
"use strict";
// audits/verify-4.11-2026-09-03-tenth.js
// Tenth quality pass on item 4.11 (SK Chemists Bootle GBP pack). Untried
// angle: this pack has never had an injection round against the
// CLINIC_QUALIFIERS, BODY_IMAGE, OUTCOME_PROMISE or POM_CLASS rule families
// in tools/check-gbp-packs.js, all of which were added and proved on OTHER
// packs (fishlocks-eccleston.md, gordon-short-crosby.md, mccanns-sandringham.md,
// riddings-timperley.md) but never against this pack's own Post C / Post D
// copy. Refuses to run if the file already carries a git diff. Restores by
// direct byte copy from the saved original after each injection, before any
// assertion runs, and sha256-verifies the restoration. Each injection is
// applied to a freshly restored copy, not layered on the previous one.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const TARGET = path.join(ROOT, "gbp-packs", "sk-chemists-bootle.md");
const CHECKER = path.join(ROOT, "tools", "check-gbp-packs.js");

function sha256(s) { return crypto.createHash("sha256").update(s, "utf8").digest("hex"); }

// Refuse if the target already has an uncommitted diff.
const diffCheck = execSync(`git diff --name-only -- "${TARGET}"`, { cwd: ROOT }).toString().trim();
if (diffCheck) {
  console.error("REFUSING: gbp-packs/sk-chemists-bootle.md already carries a git diff. Aborting.");
  process.exit(2);
}

const original = fs.readFileSync(TARGET, "utf8");
const originalSha = sha256(original);
console.log("Original sha256:", originalSha);

function runChecker() {
  try {
    const out = execSync(`node "${CHECKER}"`, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, out: out.toString() };
  } catch (e) {
    return { code: e.status, out: (e.stdout ? e.stdout.toString() : "") + (e.stderr ? e.stderr.toString() : "") };
  }
}

function restore() {
  fs.writeFileSync(TARGET, original, "utf8");
  const nowSha = sha256(fs.readFileSync(TARGET, "utf8"));
  if (nowSha !== originalSha) {
    console.error("RESTORE FAILED - sha mismatch!", nowSha, "vs", originalSha);
    process.exit(3);
  }
}

const injections = [
  {
    name: "1. CLINIC_QUALIFIERS - delete the paid/suitability sentence from Post C",
    mutate: (t) => t.replace(
      "This is a private, paid service and it is not suitable for\neveryone - the pharmacist will advise. Confidential and judgement-free.",
      "Confidential and judgement-free."
    ),
    expectRule: "weightLossPaid / weightLossSuitability",
  },
  {
    name: "2. CLINIC_QUALIFIERS - delete 'supervised plan' from Post C",
    mutate: (t) => t.replace(
      "stay\nwith you throughout a supervised plan alongside diet and lifestyle\nchanges.",
      "stay\nwith you throughout a plan alongside diet and lifestyle\nchanges."
    ),
    expectRule: "weightLossSupervised",
  },
  {
    name: "3. CLINIC_QUALIFIERS - delete travel suitability clause from Post D",
    mutate: (t) => t.replace(
      "with the vaccinations and\nmalaria prevention that suit your trip, subject to availability and\nclinical suitability.",
      "with the vaccinations and\nmalaria prevention that suit your trip."
    ),
    expectRule: "travelSuitability",
  },
  {
    name: "4. BODY_IMAGE_SELF - inject transformation framing into Post C",
    mutate: (t) => t.replace(
      "Ready to take weight loss seriously, with support that is actually there?",
      "Ready to start your transformation? Ready to take weight loss seriously, with support that is actually there?"
    ),
    expectRule: "BODY_IMAGE_SELF transformation framing",
  },
  {
    name: "5. OUTCOME_PROMISE - inject a protection guarantee into Post D",
    mutate: (t) => t.replace(
      "Book your travel consultation today.",
      "We guarantee full protection for every destination. Book your travel consultation today."
    ),
    expectRule: "OUTCOME_PROMISE guarantee wording",
  },
  {
    name: "6. POM_CLASS SELF_SCOPING - inject 'skinny jab' into Post C",
    mutate: (t) => t.replace(
      "The pharmacist-led weight loss clinic at SK Chemists in Bootle begins with",
      "The skinny jab clinic at SK Chemists in Bootle begins with"
    ),
    expectRule: "POM_CLASS SELF_SCOPING skinny jab",
  },
];

let allCaught = true;
for (const inj of injections) {
  const mutated = inj.mutate(original);
  if (mutated === original) {
    console.error("INJECTION NO-OP (pattern not found):", inj.name);
    allCaught = false;
    restore();
    continue;
  }
  fs.writeFileSync(TARGET, mutated, "utf8");
  const result = runChecker();
  restore(); // restore BEFORE asserting, per house discipline
  const caught = result.code !== 0 && result.out.toLowerCase().includes("sk-chemists-bootle.md");
  console.log("----");
  console.log(inj.name);
  console.log("expect:", inj.expectRule);
  console.log("checker exit code:", result.code);
  console.log("caught (nonzero exit + names the file):", caught);
  if (caught) {
    const lines = result.out.split("\n").filter((l) => l.includes("sk-chemists-bootle.md"));
    lines.forEach((l) => console.log("  >", l.trim()));
  } else {
    allCaught = false;
    console.log("  FULL OUTPUT:\n" + result.out);
  }
}

// Final restore verification
const finalContent = fs.readFileSync(TARGET, "utf8");
const finalSha = sha256(finalContent);
console.log("----");
console.log("Final sha256:", finalSha, finalSha === originalSha ? "(matches original)" : "(MISMATCH!)");

// Re-run full suite clean after the round
console.log("----");
console.log("Re-running full checker after restoration...");
const finalRun = runChecker();
console.log("Full checker exit code after restoration:", finalRun.code);

console.log("====");
console.log(allCaught && finalSha === originalSha && finalRun.code === 0 ? "ALL PASS" : "SOMETHING FAILED - REVIEW ABOVE");
process.exit(allCaught && finalSha === originalSha && finalRun.code === 0 ? 0 : 1);
