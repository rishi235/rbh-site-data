#!/usr/bin/env node
/*
 * verify-3.4-2026-09-12-eighteenth.js
 *
 * Item 3.4 (Cherry Lane Pharmacy, Liverpool/Walton), eighteenth quality pass.
 * Seventeen prior passes proved, by direct injection against Cherry Lane's
 * own generated pages, paste sheets and GBP pack: check-nap.js,
 * check-postcodes.js, check-em-dashes.js, check-whatsapp-route.js,
 * check-service-links.js, check-switch-copy.js, check-branch-identity.js,
 * check-booking-routes.js, check-seo-pattern.js, check-jsonld.js,
 * check-map-embeds.js, check-seo-keywords.js and check-gbp-packs.js.
 *
 * tools/check-branch-links.js had never been named anywhere in this item's
 * history. It is the one checker in the estate that reads the LINK FIELDS
 * inside branches.json itself rather than a generated page - odsCode,
 * nhsEmail, nhsReviewUrl, googleReviewUrl, website and pfLink - which is
 * exactly the data every landing page and GBP pack copies from. Cherry
 * Lane's own record carries all six fields (it has an odsCode, an
 * nhsReviewUrl, a googleReviewUrl, a website and a pfLink pointing at its
 * own Pharmacy First page), so all six rules are genuinely exercisable
 * against this branch's own data.
 *
 * INITIAL INJECTION 7 DESIGN WAS WRONG AND WAS CORRECTED BEFORE THIS FINAL
 * VERSION, RECORDED HERE RATHER THAN SILENTLY REWRITTEN. The first attempt
 * repointed Cherry Lane's pfLink at Gordon Short Crosby's own real, live
 * pfLink filename ("pharmacy-first-service-crosby.html") on Cherry Lane's
 * own host, expecting the ownership rule to fail. It did not fail. Reading
 * tools/check-branch-links.js line 194 explains why: "A name that resolves
 * to nothing is one of the legacy 'pharmacy-first-service-<town>' links Q8 /
 * item 5.3 owns, and is deliberately left alone here." branchFromPageName()
 * only resolves a filename ending "-<brandSlug>-<townSlug>"; Gordon Short
 * Crosby's own pfLink (like five other trading branches' - see the DIAGNOSTIC
 * block below) does not follow that convention, so it resolves to nobody by
 * design, not by accident, and the ownership rule is correctly a no-op for
 * it - a DOCUMENTED, DELIBERATE scope exclusion tied to the already-open,
 * currently-[BLOCKED] item 5.3 (Q8, answered 2026-08-08, awaiting a Weebly
 * paste session), not an undiscovered checker defect. Forcing a "fix" here
 * would mean this run relitigating an already-answered question with no
 * authority to do so. Re-designed instead around a branch pair that DOES
 * follow the convention the rule actually enforces (Cherry Lane's own pfLink
 * swapped to Riddings Timperley's real, live, canonically-named page), which
 * cleanly exercises the ownership rule's actual detection logic - the item
 * 2.1 pass proved this rule with Fishlocks; this proves it independently
 * with Cherry Lane, a pair neither that pass nor any later one used.
 *
 * METHOD, deliberately stricter than most prior passes on this item: rather
 * than inject directly into the tracked branches.json and restore
 * immediately (the seventeenth pass's own convention), this run makes a
 * full scratch copy of the repository with `tar` (excluding .git) into a
 * fresh temp directory OUTSIDE the tracked tree, and every injection and
 * every checker invocation in this script runs against that scratch copy
 * only. The tracked repository is never written to by any injection in
 * this file. Before the scratch copy is made, and again after every
 * restore, the tracked repo's own git status is checked scoped to
 * modules/, core/, branches.json, gbp-packs/, tools/ and status/ to prove
 * nothing here touched it. No import from tools/ beyond invoking the real
 * checker as a child process against the scratch copy.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, ".."); // the TRACKED repo (read-only in this script)
const SCOPED_DIRS = ["modules", "core", "branches.json", "gbp-packs", "tools", "status"];

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function trackedRepoDirty() {
  const out = execFileSync("git", ["status", "--porcelain", "--"].concat(SCOPED_DIRS), {
    cwd: ROOT,
  }).toString();
  // Two pre-existing untracked artefacts predate this run (a stray FUSE file
  // under gbp-packs/ and a .bak file under modules/service/pages/, both
  // confirmed present before this script ran and not created by it). Any
  // OTHER line means this script, or something else, touched the tracked
  // tree, so those two exact lines are the only ones filtered out here.
  const KNOWN_PREEXISTING = [
    "?? gbp-packs/.fuse_hidden0000000400000001",
    "?? modules/service/pages/notarealservice-fishlocks-ainsdale.html.bak",
  ];
  const lines = out.split("\n").map((l) => l.trim()).filter(Boolean);
  const unexpected = lines.filter((l) => KNOWN_PREEXISTING.indexOf(l) === -1);
  return unexpected;
}

let failures = 0;
let passes = 0;

function record(name, result, expectFail, expectSubstring) {
  const failed = result.code !== 0;
  const containsExpected = expectSubstring ? result.out.includes(expectSubstring) : true;
  if (failed === expectFail && containsExpected) {
    console.log(
      `PASS  ${name}${expectFail ? " (caught: " + expectSubstring.slice(0, 80) + "...)" : " (correctly clean)"}`
    );
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
  console.log("=== Pre-flight: tracked repo must be clean before touching anything ===");
  let unexpected = trackedRepoDirty();
  if (unexpected.length) {
    console.error("REFUSING TO RUN: tracked repo has unexpected changes in scoped dirs:");
    unexpected.forEach((l) => console.error("  " + l));
    process.exit(2);
  }
  console.log("Tracked repo clean (scoped dirs), aside from the two known pre-existing artefacts.\n");

  console.log("=== Building scratch copy of the whole repo (tar, excluding .git) ===");
  const scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), "rbh-3.4-18th-"));
  execFileSync("bash", [
    "-c",
    `cd ${JSON.stringify(ROOT)} && tar --exclude='.git' -cf - . | (cd ${JSON.stringify(scratchRoot)} && tar -xf -)`,
  ]);
  console.log(`Scratch copy at: ${scratchRoot}\n`);

  const CHECKER = path.join(scratchRoot, "tools", "check-branch-links.js");
  const DATAFILE = path.join(scratchRoot, "branches.json");

  function runChecker() {
    try {
      const out = execFileSync("node", [CHECKER], { cwd: scratchRoot, encoding: "utf8" });
      return { code: 0, out };
    } catch (e) {
      return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
    }
  }

  function runFullSuite() {
    const files = fs
      .readdirSync(path.join(scratchRoot, "tools"))
      .filter((f) => /^check-.*\.js$/.test(f) && f !== "check-cdn-pins.js")
      .sort();
    const results = {};
    files.forEach((f) => {
      try {
        execFileSync("node", [path.join(scratchRoot, "tools", f)], {
          cwd: scratchRoot,
          encoding: "utf8",
        });
        results[f] = 0;
      } catch (e) {
        results[f] = e.status;
      }
    });
    return results;
  }

  const originalData = fs.readFileSync(DATAFILE);
  const originalSha = sha256(originalData);
  console.log(`Baseline (scratch) branches.json sha256: ${originalSha}`);

  const restore = () => {
    fs.writeFileSync(DATAFILE, originalData);
    const now = sha256(fs.readFileSync(DATAFILE));
    if (now !== originalSha) {
      console.error(`RESTORE FAILED: sha256 after restore (${now}) != baseline (${originalSha}). STOPPING.`);
      process.exit(3);
    }
  };

  const baseline = runChecker();
  if (baseline.code !== 0) {
    console.error("REFUSING TO RUN: baseline check-branch-links.js is not clean on the fresh scratch copy.");
    console.error(baseline.out);
    process.exit(4);
  }
  console.log("Baseline check-branch-links.js on scratch copy: clean.\n");

  console.log("=== FULL SUITE, baseline (scratch copy, all check-*.js except check-cdn-pins.js) ===");
  const fullBefore = runFullSuite();
  const failedBefore = Object.entries(fullBefore).filter(([, code]) => code !== 0);
  console.log(`${Object.keys(fullBefore).length} checkers run, ${failedBefore.length} failing.`);
  if (failedBefore.length) {
    failedBefore.forEach(([f, code]) => console.log(`  UNEXPECTED FAIL (baseline) ${f}: exit ${code}`));
    process.exit(5);
  }
  console.log("All clean before any injection.\n");

  const text = originalData.toString("utf8");
  const data = JSON.parse(text);
  const cl = data.branches.find((b) => b.id === "cherrylane_liverpool");
  if (!cl) throw new Error("cherrylane_liverpool not found in scratch branches.json");

  function withMutation(mutateFn) {
    const clone = JSON.parse(text);
    const b = clone.branches.find((x) => x.id === "cherrylane_liverpool");
    mutateFn(b, clone);
    fs.writeFileSync(DATAFILE, JSON.stringify(clone, null, 2) + "\n");
  }

  console.log("=== DIAGNOSTIC (not a pass/fail assertion): which trading branches' pfLink");
  console.log("    does branchFromPageName() fail to resolve today, and does that set match");
  console.log("    the standing 5.3/Q8/Q34 backlog? Computed fresh from the scratch copy's");
  console.log("    own branches.json, not hardcoded, so this cannot go stale silently. ===");
  {
    const byKey = {};
    data.branches.forEach((b) => {
      if (!b.disposed && b.brandSlug && b.townSlug) byKey[b.brandSlug + "-" + b.townSlug] = b;
    });
    function branchFromPageName(name) {
      let best = null, bestLen = -1;
      Object.keys(byKey).forEach((k) => {
        const suffix = "-" + k;
        if (name.length > suffix.length && name.slice(-suffix.length) === suffix && k.length > bestLen) {
          bestLen = k.length;
          best = byKey[k];
        }
      });
      return best;
    }
    const unresolved = [];
    data.branches.forEach((b) => {
      if (b.disposed || !b.pfLink) return;
      const leaf = b.pfLink.split("/").pop().replace(/\.html$/i, "");
      if (!branchFromPageName(leaf)) unresolved.push(b.id);
    });
    console.log(`    Unresolved (owner=null) today: ${unresolved.join(", ")}`);
    const expectedFromQ8 = ["scorah_bramhall", "scorah_hazel", "smartts_bootle", "hirshmans_ainsdale",
      "colemanleigh_liverpool", "gordonshorts_crosby"];
    const matches = expectedFromQ8.every((id) => unresolved.includes(id)) &&
      unresolved.every((id) => expectedFromQ8.includes(id));
    console.log(`    Matches the six branches item 5.3/Q8/Q34 already tracks (Scorah x2, Smartts,`);
    console.log(`    Hirshmans, Coleman and Leighs, Gordon Short): ${matches}. cherrylane_liverpool`);
    console.log(`    itself resolves cleanly today (its pfLink is already the migrated, canonical`);
    console.log(`    page - Q8's own text: "Only Fishlocks (both branches) and Cherry Lane were`);
    console.log(`    ever migrated"). This is a documented, deliberate scope exclusion in`);
    console.log(`    tools/check-branch-links.js line 194, not an in-repo defect - recorded here`);
    console.log(`    rather than "fixed" because this run has no authority to reopen an`);
    console.log(`    already-answered question or repoint live pfLinks while 5.3 is [BLOCKED].\n`);
  }

  console.log("=== Injections against cherrylane_liverpool, one at a time ===\n");

  // --- 1: odsCode uniqueness -------------------------------------------
  // Fishlocks Ainsdale's real, live odsCode (FK848) substituted for Cherry
  // Lane's own (FA226). An ODS code identifies one pharmacy contract with
  // NHS BSA, so two branches sharing one is a real dispensing-payment fault,
  // not a cosmetic one.
  {
    withMutation((b) => {
      b.odsCode = "FK848";
    });
    record("1 odsCode duplicate (Fishlocks Ainsdale's FK848)", runChecker(), true,
      "duplicate of fishlocks_ainsdale (FK848)");
    restore();
  }

  // --- 2: nhsEmail pattern -----------------------------------------------
  {
    withMutation((b) => {
      b.nhsEmail = "pharmacy.FA226@nhs.co.uk"; // wrong domain, right ODS code
    });
    record("2 nhsEmail wrong domain", runChecker(), true,
      'is "pharmacy.FA226@nhs.co.uk", expected "pharmacy.FA226@nhs.net"');
    restore();
  }

  // --- 3: nhsReviewUrl truncated to the profile page ----------------------
  // This is the exact real-world shape CLAUDE.md and this checker's own file
  // header document: Gordon Short Crosby's nhsReviewUrl once stopped one
  // segment short, at the ODS code, landing the patient on the NHS profile
  // page instead of the review form. Reproducing that shape on Cherry Lane's
  // own record specifically, rather than trusting that the historic fix
  // generalises.
  {
    withMutation((b) => {
      b.nhsReviewUrl = "https://www.nhs.uk/services/pharmacy/cherry-lane-pharmacy/XFA226";
    });
    record("3 nhsReviewUrl truncated (missing /leave-a-review)", runChecker(), true,
      "Anything short of /leave-a-review lands the patient on the profile page instead of the review form");
    restore();
  }

  // --- 4: googleReviewUrl pattern -----------------------------------------
  {
    withMutation((b) => {
      b.googleReviewUrl = "https://maps.google.com/r/CRF-ODLpmvUAEAE/review"; // not g.page
    });
    record("4 googleReviewUrl wrong domain", runChecker(), true,
      "expected https://g.page/r/<id>/review");
    restore();
  }

  // --- 5: googleReviewUrl uniqueness ---------------------------------------
  // Fishlocks Ainsdale's own real, live googleReviewUrl substituted for
  // Cherry Lane's. A shared link means a review meant for one shop is
  // recorded against the other's public listing.
  {
    withMutation((b) => {
      b.googleReviewUrl = "https://g.page/r/Cfl0iMf3cgGaEAE/review"; // Fishlocks Ainsdale's
    });
    record("5 googleReviewUrl shared with Fishlocks Ainsdale", runChecker(), true,
      "is the same link as fishlocks_ainsdale");
    restore();
  }

  // --- 6: website pattern (path + trailing slash) --------------------------
  {
    withMutation((b) => {
      b.website = "https://www.cherrylanepharmacy.co.uk/home/";
    });
    record("6 website carries a path and a trailing slash", runChecker(), true,
      "Expected https, a bare host, no trailing slash and no path");
    restore();
  }

  // --- 7: pfLink ownership, own host but a DIFFERENT branch's filename ----
  // Cherry Lane is single-host, so every prior host-mismatch shape this
  // checker's own file header documents (Fishlocks/McCanns/Scorah sister
  // branches sharing a domain) cannot arise here by accident. This
  // constructs the sharper case deliberately: keep Cherry Lane's own website
  // string in front (so the host-prefix rule alone would pass) but repoint
  // the filename at Riddings Timperley's own, real, canonically-named
  // Pharmacy First page ("pharmacy-first-riddings-timperley.html", on a
  // completely different real host). Riddings Timperley's pfLink follows the
  // "<brandSlug>-<townSlug>" convention branchFromPageName() actually
  // resolves (unlike Gordon Short Crosby's - see the corrected-design note
  // above and the DIAGNOSTIC block below), so this is the genuine, currently
  // ACTIVE half of the ownership-resolution rule (added by the item 2.1
  // pass), proved here on a Cherry Lane / Riddings Timperley pair neither
  // that pass nor any later one has used.
  {
    withMutation((b) => {
      b.pfLink = "https://www.cherrylanepharmacy.co.uk/pharmacy-first-riddings-timperley.html";
    });
    record("7 pfLink resolves to Riddings Timperley's page despite Cherry Lane's own host string",
      runChecker(), true,
      'a Pharmacy First page belonging to riddings_timperley ("Riddings Pharmacy"), not to this branch ("Cherry Lane Pharmacy")');
    restore();
  }

  // --- 8: pfLink suffix ------------------------------------------------
  {
    withMutation((b) => {
      b.pfLink = "https://www.cherrylanepharmacy.co.uk/pharmacy-first-cherry-lane-walton.htm";
    });
    record("8 pfLink does not end .html", runChecker(), true,
      "does not end .html");
    restore();
  }

  // --- 9 (control): reorder two unrelated, unchecked fields, no value changed
  {
    withMutation((b, clone) => {
      // shortCode and branchNumber are named in CLAUDE.md as read by no
      // checker at all, so swapping their order in the object (which
      // JSON.stringify will reflect as a line-order change) cannot change
      // any value check-branch-links.js reads.
      const idx = clone.branches.findIndex((x) => x.id === "cherrylane_liverpool");
      const orig = clone.branches[idx];
      const reordered = {};
      Object.keys(orig).forEach((k) => {
        if (k === "shortCode") return; // defer, re-insert after branchNumber
        reordered[k] = orig[k];
        if (k === "branchNumber") reordered.shortCode = orig.shortCode;
      });
      clone.branches[idx] = reordered;
    });
    record("9 CONTROL - reorder shortCode/branchNumber, no value changed", runChecker(), false, null);
    restore();
  }

  console.log(`\n${passes} passed, ${failures} failed (9 total: 8 rule injections + 1 control).\n`);

  console.log("=== FULL SUITE, after all injections/restores (scratch copy) ===");
  const fullAfter = runFullSuite();
  const failedAfter = Object.entries(fullAfter).filter(([, code]) => code !== 0);
  console.log(`${Object.keys(fullAfter).length} checkers run, ${failedAfter.length} failing.`);
  if (failedAfter.length) {
    failedAfter.forEach(([f, code]) => console.log(`  UNEXPECTED FAIL (after) ${f}: exit ${code}`));
  } else {
    console.log("All clean after the round.\n");
  }

  const finalSha = sha256(fs.readFileSync(DATAFILE));
  console.log(`Final scratch branches.json sha256: ${finalSha} (matches baseline: ${finalSha === originalSha})`);

  console.log("\n=== Post-flight: tracked repo must still be clean ===");
  unexpected = trackedRepoDirty();
  if (unexpected.length) {
    console.error("TRACKED REPO WAS TOUCHED:");
    unexpected.forEach((l) => console.error("  " + l));
    failures++;
  } else {
    console.log("Tracked repo clean (scoped dirs), aside from the two known pre-existing artefacts. Untouched throughout.");
  }

  console.log(`\nScratch copy left at ${scratchRoot} (outside the tracked repo; not committed, not cleaned up by this script).`);

  if (failures > 0 || finalSha !== originalSha || failedBefore.length || failedAfter.length) process.exit(1);
}

main();
