/*
  Item 5.2 quality pass (ninth), 2026-09-03. Unattended scheduled run.

  Fresh angle: none of the eight prior passes on item 5.2 (2026-08-09 build
  through 2026-09-02 eighth) ever exercised tools/check-seo-keywords.js
  against these six branch landing pages, even though check-seo-keywords.js's
  own PAGE_DIRS list includes modules/branch/pages and
  build-branch-landing-pages.js's manifest writes a Meta Keywords line for
  all six pages into modules/branch/pages/SEO.md. The full 36-checker suite
  running clean each pass has always covered these six keyword lines, but no
  pass has proved by injection that check-seo-keywords.js actually CATCHES a
  regression on one of them specifically, as distinct from having never seen
  one.

  McCanns Chemist Sandringham was chosen as the injection target because it
  is the one branch in the estate whose townSlug ("sandringham") no longer
  matches its seoTown ("St Michael's", moved on item 5.7, 2026-08-10), which
  is exactly the shape RULE 8 (retired town word) exists to guard and the
  rule check-seo-keywords.js's own header names as "exactly one branch in the
  estate diverges today, which is 5.7's own." No prior pass on 5.2 has
  injection-tested this specific branch's keywords line against this
  specific checker.

  Method, same discipline as the eighth/ninth passes on other items this
  audit: save the real tracked file's content and sha256 before any
  mutation, mutate the real file (check-seo-keywords.js reads it by path, so
  there is nothing else to mutate), capture the real checker's subprocess
  output and exit code, restore by direct fs.writeFileSync from the saved
  original IMMEDIATELY after capturing output and BEFORE any assertion runs,
  sha256-verify byte-identical restoration before the next injection and
  again at the very end. Each injection is applied to a freshly restored
  copy, not layered on the previous one, so a false pass on injection N
  cannot be masked by injection N+1.

  Run: node audits/verify-5.2-2026-09-03-ninth.js
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const TARGET = path.join(REPO, "modules", "branch", "pages", "SEO.md");
const CHECKER = path.join(REPO, "tools", "check-seo-keywords.js");

function sha256(s) { return crypto.createHash("sha256").update(s).digest("hex"); }

function runChecker() {
  try {
    const out = execFileSync("node", [CHECKER], { cwd: REPO, encoding: "utf8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

const original = fs.readFileSync(TARGET, "utf8");
const originalSha = sha256(original);
console.log("Target: " + path.relative(REPO, TARGET));
console.log("Original sha256: " + originalSha);

if (execFileSync("git", ["status", "--porcelain", "modules/branch/pages/SEO.md"], { cwd: REPO, encoding: "utf8" }).trim()) {
  console.error("REFUSING TO RUN: modules/branch/pages/SEO.md already carries an uncommitted diff.");
  process.exit(2);
}

const KW_LINE_ORIG = "- **Meta Keywords:** pharmacy St Michael's, chemist St Michael's, McCanns Chemist, L17";
if (original.indexOf(KW_LINE_ORIG) === -1) {
  console.error("REFUSING TO RUN: expected McCanns Sandringham keywords line not found verbatim. File has moved; update the harness rather than trust a fuzzy match.");
  process.exit(2);
}

function mutate(replacement) {
  const next = original.replace(KW_LINE_ORIG, replacement);
  if (next === original) throw new Error("mutation produced no change - regex/string did not match");
  return next;
}

function restore() {
  fs.writeFileSync(TARGET, original);
  const nowSha = sha256(fs.readFileSync(TARGET, "utf8"));
  if (nowSha !== originalSha) {
    console.error("FATAL: restoration did not reproduce the original file byte-for-byte. sha256 " + nowSha + " != " + originalSha);
    process.exit(3);
  }
}

const injections = [
  {
    name: "RULE 1 pairing - blank the Meta Keywords value",
    mutated: () => mutate("- **Meta Keywords:**"),
    expectRule: "pairing",
    expectSnippet: "has a Page Permalink but no Meta Keywords value"
  },
  {
    name: "RULE 3 presence - drop own seoTown from the line",
    mutated: () => mutate("- **Meta Keywords:** pharmacy chemist, chemist chemist, McCanns Chemist, L17"),
    expectRule: "presence",
    expectSnippet: "do not carry this branch's own seoTown 'St Michael's'"
  },
  {
    name: "RULE 4 absence - add Aintree (another live branch's seoTown, not in serviceAreaList)",
    mutated: () => mutate(KW_LINE_ORIG + ", Aintree"),
    expectRule: "absence",
    expectSnippet: "name 'Aintree'"
  },
  {
    name: "RULE 5 brand - add Fishlocks Chemist (another live branch's brandLabel)",
    mutated: () => mutate(KW_LINE_ORIG + ", Fishlocks Chemist"),
    expectRule: "brand",
    expectSnippet: "name 'Fishlocks Chemist'"
  },
  {
    name: "RULE 6 postcode - add PR8 (Fishlocks Ainsdale's outward code, not this branch's L17)",
    mutated: () => mutate(KW_LINE_ORIG + ", PR8"),
    expectRule: "postcode",
    expectSnippet: "carry 'PR8', which is not this branch's outward code 'L17'"
  },
  {
    name: "RULE 7 claim - add 'rapid weight loss'",
    mutated: () => mutate(KW_LINE_ORIG + ", rapid weight loss"),
    expectRule: "claim",
    expectSnippet: "efficacy claim"
  },
  {
    name: "RULE 8 retired town word - add 'Sandringham', the word item 5.7 retired",
    mutated: () => mutate(KW_LINE_ORIG + ", Sandringham"),
    expectRule: "retired",
    expectSnippet: "no longer its seoTown"
  }
];

let passCount = 0;
const results = [];

injections.forEach(function (inj, i) {
  const mutatedContent = inj.mutated();
  fs.writeFileSync(TARGET, mutatedContent);
  const res = runChecker();
  restore();

  const caught = res.code !== 0 && res.out.indexOf(inj.expectSnippet) !== -1;
  results.push({ name: inj.name, caught: caught, exitCode: res.code });
  if (caught) {
    passCount++;
    console.log("[" + (i + 1) + "/" + injections.length + "] CAUGHT - " + inj.name);
  } else {
    console.log("[" + (i + 1) + "/" + injections.length + "] *** MISSED *** - " + inj.name);
    console.log("    exit code: " + res.code);
    console.log("    output:\n" + res.out.split("\n").map(function (l) { return "      " + l; }).join("\n"));
  }
});

// Final restoration check, independent of the per-injection one above.
const finalContent = fs.readFileSync(TARGET, "utf8");
const finalSha = sha256(finalContent);
console.log("");
console.log("Final sha256: " + finalSha + (finalSha === originalSha ? " (matches original)" : " *** MISMATCH ***"));

const gitDiff = execFileSync("git", ["status", "--porcelain", "modules/branch/pages/SEO.md"], { cwd: REPO, encoding: "utf8" }).trim();
console.log("git status --porcelain on the target file: " + (gitDiff ? ("DIRTY: " + gitDiff) : "clean"));

console.log("");
console.log("SUMMARY: " + passCount + "/" + injections.length + " injections caught.");

if (passCount !== injections.length || finalSha !== originalSha || gitDiff) {
  console.log("RESULT: FAIL - see above.");
  process.exit(1);
}
console.log("RESULT: PASS - check-seo-keywords.js's rules 1, 3, 4, 5, 6, 7 and 8 all proved by direct injection against McCanns Chemist Sandringham's own Meta Keywords line, the branch whose retired townSlug word makes RULE 8 non-vacuous.");
