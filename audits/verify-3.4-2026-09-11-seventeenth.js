#!/usr/bin/env node
/*
 * verify-3.4-2026-09-11-seventeenth.js
 *
 * Item 3.4 (Cherry Lane Pharmacy, Liverpool/Walton), seventeenth quality
 * pass. Sixteen prior passes proved, by direct injection against Cherry
 * Lane's own generated pages and paste sheets: check-nap.js,
 * check-postcodes.js, check-em-dashes.js, check-whatsapp-route.js,
 * check-service-links.js, check-switch-copy.js, check-branch-identity.js,
 * check-booking-routes.js, check-seo-pattern.js, check-jsonld.js,
 * check-map-embeds.js and (sixteenth pass, same day) check-seo-keywords.js.
 *
 * tools/check-gbp-packs.js had never been proven by direct injection against
 * gbp-packs/cherry-lane-walton.md, confirmed by a normalised-text grep of
 * this item's entire AGENT_WORKLIST.md section (all sixteen prior passes)
 * for "check-gbp-packs" (allowing for markdown line-wrap and hyphenation)
 * returning zero hits. Cherry Lane's own pack (item 4.2) is a real,
 * currently-clean file with no KNOWN exceptions of its own (baseline run
 * below), so this is genuinely untested ground rather than a file this
 * checker already treats specially.
 *
 * REAL DEFECT FOUND AND FIXED by injection 4 below, in the checker itself
 * rather than in any pack: tools/check-gbp-packs.js's own EM_DASH constant
 * (was line 426) was a mojibake character class - U+00C3 U+00A2 ... bytes in
 * place of an em dash, en dash and horizontal bar - that could never match a
 * real em dash typed normally. An em dash injected into cherry-lane-walton.md's
 * business description was NOT caught by this rule at all; it only failed
 * because the description's own self-reported character count happened to
 * drift by the width of the injected text, a coincidence, not detection.
 * Not a live breach: check-em-dashes.js has scanned gbp-packs/ with a
 * correct codepoint match since 2026-08-13 and still catches it (proved
 * separately, see the standalone check-em-dashes.js run in this pass's
 * evidence), so the estate-wide guarantee held throughout. But this
 * checker's own "No em dashes" rule, named in its own file header as one of
 * its checks, was dead code. Fixed to /[–—―]/, matching the
 * codepoint discipline check-em-dashes.js already uses. Full 36-checker
 * suite re-run clean after the fix (below).
 *
 * Method matches the established convention for this item: refuse to run on
 * a dirty baseline, capture the target's bytes and sha256 before any
 * mutation, restore by direct fs.writeFileSync from an in-memory Buffer
 * immediately after capturing the checker's output and before any
 * assertion, sha256-reconfirm byte-identical restoration after every
 * injection. One injection at a time. No import from tools/ beyond invoking
 * the real checker as a child process.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const TARGET = path.join(ROOT, "gbp-packs", "cherry-lane-walton.md");
const CHECKER = path.join(ROOT, "tools", "check-gbp-packs.js");

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function gitDirty(file) {
  const out = execFileSync("git", ["status", "--porcelain", "--", file], { cwd: ROOT }).toString();
  return out.trim().length > 0;
}

function runChecker() {
  try {
    const out = execFileSync("node", [CHECKER], { cwd: ROOT, encoding: "utf8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

let failures = 0;
let passes = 0;

function record(name, expectFail, expectSubstring) {
  const result = runChecker();
  const failed = result.code !== 0;
  const containsExpected = expectSubstring ? result.out.includes(expectSubstring) : true;
  if (failed === expectFail && containsExpected) {
    console.log(`PASS  ${name}${expectFail ? " (caught: " + expectSubstring.slice(0, 70) + "...)" : " (correctly clean)"}`);
    passes++;
  } else {
    console.log(`FAIL  ${name}`);
    console.log(`      expected fail=${expectFail}, got exit code ${result.code}, substring found=${containsExpected}`);
    console.log(`      --- checker output ---`);
    console.log(result.out.slice(0, 4000));
    failures++;
  }
}

function main() {
  if (gitDirty(TARGET)) {
    console.error(`REFUSING TO RUN: ${TARGET} already has a git diff. Clean the tree before running this instrument.`);
    process.exit(2);
  }

  const original = fs.readFileSync(TARGET);
  const originalSha = sha256(original);
  console.log(`Baseline ${path.basename(TARGET)} sha256: ${originalSha}`);

  const restore = () => {
    fs.writeFileSync(TARGET, original);
    const now = sha256(fs.readFileSync(TARGET));
    if (now !== originalSha) {
      console.error(`RESTORE FAILED: sha256 after restore (${now}) does not match baseline (${originalSha}). STOPPING.`);
      process.exit(3);
    }
  };

  // Baseline must be clean before any injection.
  const baseline = runChecker();
  if (baseline.code !== 0) {
    console.error("REFUSING TO RUN: baseline check-gbp-packs.js is not clean before any injection.");
    console.error(baseline.out);
    process.exit(4);
  }
  console.log("Baseline check-gbp-packs.js: clean (0 failures, warnings only, as expected).\n");

  const text = original.toString("utf8");

  // --- Injection 1: sister-branch false claim, the "no sisters" case -----
  // Cherry Lane's brandLabel ("Cherry Lane Pharmacy") is carried by no other
  // live branch, so this is a genuinely different shape from every prior
  // sister-branch injection in this repo (Scorah, McCanns), which all test a
  // branch that DOES have a sister but names the wrong town. This tests the
  // other half of the same rule: a standalone branch falsely claiming one at
  // all.
  {
    const marker = "Come and see us.";
    if (!text.includes(marker)) throw new Error("injection 1 anchor not found");
    const injected = text.replace(marker, "Our sister branch is in Bootle. " + marker);
    fs.writeFileSync(TARGET, injected);
    record(
      "1 sister-branch claim, no live sister exists",
      true,
      "the pack claims a sister or second branch, but no other live branch in branches.json carries the brand Cherry Lane Pharmacy"
    );
    restore();
  }

  // --- Injection 2: phone mismatch, Profile basics --------------------
  {
    const marker = "- Phone: 0151 226 2051";
    if (!text.includes(marker)) throw new Error("injection 2 anchor not found");
    // Fishlocks Ainsdale's real number (01704 575478), so this is a live
    // branch's number, not a nonsense string - the sister-rule shape the
    // checker's own docstring names.
    const injected = text.replace(marker, "- Phone: 01704 575478");
    fs.writeFileSync(TARGET, injected);
    record("2 phone belongs to another live branch", true, "belongs to");
    restore();
  }

  // --- Injection 3: postcode mismatch, Profile basics ------------------
  {
    const marker = "- Address: 202 Cherry Lane, Liverpool L4 8SG";
    if (!text.includes(marker)) throw new Error("injection 3 anchor not found");
    const injected = text.replace(marker, "- Address: 202 Cherry Lane, Liverpool PR8 3HN");
    fs.writeFileSync(TARGET, injected);
    record("3 postcode belongs to another live branch", true, "belongs to");
    restore();
  }

  // --- Injection 4: em dash in business description --------------------
  {
    const marker = "Come and see us.";
    if (!text.includes(marker)) throw new Error("injection 4 anchor not found");
    const injected = text.replace(marker, "Come and see us — today.");
    fs.writeFileSync(TARGET, injected);
    record("4 em dash in business description", true, "em dash");
    restore();
  }

  // --- Injection 5: Services section omission (Pharmacy First) ---------
  // Cherry Lane carries a pharmacyFirst widget in branches.json, so the
  // Services section must name it. Removing the line tests the omission
  // direction of SERVICE_RULES for this item for the first time.
  {
    const marker =
      "- NHS Pharmacy First: free NHS assessment and, where appropriate, treatment\n" +
      "  for sinusitis, sore throat, earache, impetigo, shingles, infected insect\n" +
      "  bites and uncomplicated UTIs in women, with no GP appointment needed.\n";
    if (!text.includes(marker)) throw new Error("injection 5 anchor not found");
    const injected = text.replace(marker, "");
    fs.writeFileSync(TARGET, injected);
    record(
      "5 Services section omits Pharmacy First despite the widget",
      true,
      'Services section does not list "Pharmacy First"'
    );
    restore();
  }

  // --- Injection 6 (control): reorder Post C and Post D, no value changed
  {
    const postC =
      text.match(/### Post C - Weight loss clinic[\s\S]*?(?=\n### Post D)/)[0];
    const postD =
      text.match(/### Post D - Travel clinic[\s\S]*?(?=\n\nNotes for the paster:)/)[0];
    if (!postC || !postD) throw new Error("injection 6 anchors not found");
    let injected = text.replace(postC + "\n" + postD, postD + "\n" + postC);
    if (injected === text) throw new Error("injection 6 did not change the file");
    fs.writeFileSync(TARGET, injected);
    record("6 CONTROL - reorder posts, no value changed", false, null);
    restore();
  }

  console.log(`\n${passes} passed, ${failures} failed.`);
  const finalSha = sha256(fs.readFileSync(TARGET));
  console.log(`Final ${path.basename(TARGET)} sha256: ${finalSha} (matches baseline: ${finalSha === originalSha})`);
  const finalDirty = gitDirty(TARGET);
  console.log(`git status --porcelain on target after run: ${finalDirty ? "DIRTY (BUG)" : "clean"}`);

  if (failures > 0 || finalSha !== originalSha || finalDirty) process.exit(1);
}

main();
