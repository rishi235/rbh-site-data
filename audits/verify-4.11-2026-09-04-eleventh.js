// Item 4.11 quality pass (eleventh), 2026-09-04.
// Proof-by-injection harness for tools/check-gbp-packs.js against
// gbp-packs/sk-chemists-bootle.md. Invokes the real checker as a child
// process (never imports its logic). Restores by direct byte copy
// immediately after each capture, before any assertion runs. Refuses to
// run if the target already carries a git diff. sha256-verifies the file
// is byte-identical to its committed original before the round, after
// each restoration, and again at the end.
//
// This pass targets six rule families in check-gbp-packs.js that ten prior
// passes on this item never exercised against THIS pack's own text:
// CATEGORY_RULES omission, SERVICE_RULES omission, the services-vocabulary
// allowlist, the categories-vocabulary allowlist, and two photo-shot-list
// rules (count, vinyl mention). Prior passes covered phone, postcode, Post C
// link substitution, hours, the UTI cohort, rule 11's age qualifier, and the
// CLINIC_QUALIFIERS/BODY_IMAGE/OUTCOME_PROMISE/POM_CLASS families - none of
// which overlap the six above.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const crypto = require("crypto");

const REPO = "/sessions/friendly-zealous-hawking/mnt/rbh-site-data";
const TARGET = path.join(REPO, "gbp-packs", "sk-chemists-bootle.md");
const CHECKER = path.join(REPO, "tools", "check-gbp-packs.js");

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function gitDiffEmpty(relPath) {
  const out = execFileSync("git", ["status", "--porcelain", "--", relPath], { cwd: REPO }).toString();
  return out.trim() === "";
}

function runChecker() {
  try {
    const out = execFileSync("node", [CHECKER], { cwd: REPO, encoding: "utf8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

// --- guard: refuse if already dirty ---
if (!gitDiffEmpty("gbp-packs/sk-chemists-bootle.md")) {
  console.error("REFUSING: gbp-packs/sk-chemists-bootle.md already carries a git diff. Aborting.");
  process.exit(2);
}

const original = fs.readFileSync(TARGET);
const originalSha = sha256(original);
console.log("Original sha256:", originalSha);

// Baseline: checker must be clean before any mutation
let base = runChecker();
console.log("BASELINE checker exit:", base.code);
if (base.code !== 0) {
  console.error("Baseline checker is not clean - aborting before any injection.");
  console.error(base.out);
  process.exit(3);
}

function restore(label) {
  fs.writeFileSync(TARGET, original);
  const nowSha = sha256(fs.readFileSync(TARGET));
  const ok = nowSha === originalSha;
  console.log(`RESTORE after ${label}: sha256 ${ok ? "MATCHES" : "MISMATCH!!"} original`);
  if (!ok) {
    console.error("FATAL: restore did not reproduce the original file byte-for-byte.");
    process.exit(4);
  }
}

function inject(label, mutateFn, expectFailContains) {
  const text = original.toString("utf8");
  const mutated = mutateFn(text);
  if (mutated === text) {
    console.error(`NO-MATCH GUARD FIRED for "${label}" - mutator made no change. Aborting.`);
    process.exit(5);
  }
  fs.writeFileSync(TARGET, mutated, "utf8");
  const res = runChecker();
  const caught = res.code !== 0 && expectFailContains.every((s) => res.out.includes(s));
  console.log(`INJECTION "${label}": checker exit ${res.code} - ${caught ? "CAUGHT" : "*** NOT CAUGHT ***"}`);
  if (!caught) {
    console.log("--- checker output ---");
    console.log(res.out);
  }
  restore(label);
  return caught;
}

const results = [];

// 1. CATEGORY_RULES omission: SK has a travelClinic widget (earned), so
//    Travel clinic must be listed in section 2. Remove it.
results.push(inject(
  "CATEGORY_RULES omission (remove Travel clinic from section 2)",
  (t) => t.replace(
    "- Add if not present (nearest GBP picker name): Travel clinic,\n  Weight loss service, Vaccination centre",
    "- Add if not present (nearest GBP picker name): Weight loss service, Vaccination centre"
  ),
  ['Categories section does not list "Travel clinic"']
));

// 2. SERVICE_RULES omission: SK has a contraception widget (earned), so
//    section 3 must list it. Remove the whole bullet.
results.push(inject(
  "SERVICE_RULES omission (remove NHS contraception service bullet from section 3)",
  (t) => t.replace(
    "- NHS contraception service: start or continue oral contraception at the\n  pharmacy without a GP appointment.\n",
    ""
  ),
  ['Services section does not list "NHS contraception service"']
));

// 3. Services vocabulary allowlist: add a fabricated, unrecognised service
//    bullet to section 3 (the exact "Ear wax removal" wording proven on
//    scorah-bramhall.md on the item 4.4 pass, never tried on this pack).
results.push(inject(
  "services vocabulary allowlist (add unrecognised 'Ear wax removal' bullet)",
  (t) => t.replace(
    "- Private consultation room: confidential advice on your medicines.\n",
    "- Private consultation room: confidential advice on your medicines.\n- Ear wax removal: microsuction ear wax removal by appointment.\n"
  ),
  ['Services section lists "Ear wax removal"', 'not a service any pack in this repo uses']
));

// 4. Categories vocabulary allowlist: add a fabricated, unrecognised
//    category to section 2.
results.push(inject(
  "categories vocabulary allowlist (add unrecognised 'Dental clinic' category)",
  (t) => t.replace(
    "- Add if not present (nearest GBP picker name): Travel clinic,\n  Weight loss service, Vaccination centre",
    "- Add if not present (nearest GBP picker name): Travel clinic,\n  Weight loss service, Vaccination centre, Dental clinic"
  ),
  ['Categories section names "Dental clinic"', 'not a category any pack in this repo uses']
));

// 5. Photo shot list count: SK sits exactly on the PHOTO_MIN=10 floor with
//    no headroom (per CLAUDE.md's own note on this rule). Delete one bullet
//    to drop it to 9.
results.push(inject(
  "photo shot list count (delete one of the 10 bullets, drop to 9)",
  (t) => t.replace(
    "- Team photo behind the counter.\n",
    ""
  ),
  ["Photo shot list names 9 shot", "at least 10"]
));

// 6. Photo shot list vinyl mention: remove the only occurrence of "vinyl"
//    from the shot list.
results.push(inject(
  "photo shot list vinyl mention (reword first bullet to drop 'vinyl')",
  (t) => t.replace(
    "- Vinyl storefront lead shot where fitted; otherwise the best straight-on\n  frontage shot.",
    "- Storefront lead shot where fitted; otherwise the best straight-on\n  frontage shot."
  ),
  ["does not mention the vinyl storefront"]
));

// Final full restore check + final checker run
const finalBuf = fs.readFileSync(TARGET);
const finalSha = sha256(finalBuf);
console.log("\nFINAL sha256:", finalSha, finalSha === originalSha ? "(MATCHES original)" : "(MISMATCH!!)");

const finalCheck = runChecker();
console.log("FINAL checker exit:", finalCheck.code);

console.log("\n=== SUMMARY ===");
const labels = [
  "CATEGORY_RULES omission",
  "SERVICE_RULES omission",
  "services vocabulary allowlist",
  "categories vocabulary allowlist",
  "photo shot list count",
  "photo shot list vinyl mention",
];
labels.forEach((l, i) => console.log(`${i + 1}. ${l}: ${results[i] ? "CAUGHT" : "*** NOT CAUGHT ***"}`));
console.log(`\nAll caught: ${results.every(Boolean)}`);
console.log(`git diff empty at end: ${gitDiffEmpty("gbp-packs/sk-chemists-bootle.md")}`);
