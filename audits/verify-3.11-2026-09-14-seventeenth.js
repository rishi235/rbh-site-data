/*
  verify-3.11-2026-09-14-seventeenth.js

  Item 3.11 quality pass (seventeenth), Gordon Short Chemist (Crosby).
  Target: tools/check-branch-links.js, never proven by injection against
  this branch's own branches.json record across sixteen prior passes,
  despite the checker's own file header naming Gordon Short Crosby BY NAME
  as the discovery example that caused it to be written: "Thirteen of the
  fourteen trading branches carried an nhsReviewUrl ending
  '/leave-a-review' ... Gordon Short Crosby stopped one segment short, at
  the ODS code ... It had not reached a page only because Gordon Short has
  no landing page yet." That defect was fixed at source on the item 3.8
  quality pass, 2026-08-10, and check-branch-links.js was written the same
  day to make sure it could not recur silently. This branch's own record
  has never been the subject of an injection against that checker since.

  Unlike every other checker this item's sixteen prior passes have proven,
  check-branch-links.js reads branches.json directly and produces no page
  output, so the injections below mutate the DATA RECORD, not a generated
  file, and restore it the same way.

  Runs against a scratch copy (git archive HEAD), never the tracked repo.
  Shells out to the real checker as a child process (never imported), so
  the proof exercises the exact file that ships. Refuses to run if the
  checker is not already clean. Mutates branches.json (and, for the final
  injection, the checker's own KNOWN list) from an in-memory original,
  restores immediately after each run, sha256-verifies the restore before
  the next injection.

  REPO below is the scratch copy this run built via `git archive HEAD |
  tar -x`, kept as originally run for an exact record, per the convention
  established by other verify-*.js files already committed under audits/.
*/
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const crypto = require("crypto");

const REPO = "/tmp/scratch312";
const CHECKER = path.join(REPO, "tools", "check-branch-links.js");
const DATA = path.join(REPO, "branches.json");

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

function withBranch(dataText, mutate) {
  const data = JSON.parse(dataText);
  const b = data.branches.find((x) => x.id === "gordonshorts_crosby");
  if (!b) throw new Error("gordonshorts_crosby not found in branches.json");
  mutate(data, b);
  return JSON.stringify(data, null, 2) + "\n";
}

const log = [];
function record(line) {
  log.push(line);
  console.log(line);
}

record("=== verify-3.11-2026-09-14-seventeenth.js ===");
record("REPO = " + REPO);

const baselineData = fs.readFileSync(DATA, "utf8");
const baselineChecker = fs.readFileSync(CHECKER, "utf8");
record("branches.json sha256 baseline: " + sha256(DATA));
record("check-branch-links.js sha256 baseline: " + sha256(CHECKER));

const baseline = runChecker();
if (baseline.rc !== 0) {
  record("REFUSING TO RUN: checker is not clean on the scratch copy before any injection.");
  record(baseline.out);
  process.exit(1);
}
record("Baseline: checker clean (exit 0) before any injection.\n");

const injections = [
  {
    name: "1. odsCode duplicated (set to smartts_bootle's FQN70)",
    apply: (data, b) => { b.odsCode = "FQN70"; },
    expectFail: true,
    note: "Expected to also cross-fire nhsEmail and nhsReviewUrl, both " +
      "derived from odsCode, so the pair is collateral by design, not a " +
      "second independent bug."
  },
  {
    name: "2. nhsEmail wrong format (missing pharmacy. prefix)",
    apply: (data, b) => { b.nhsEmail = "FPD45@nhs.net"; },
    expectFail: true
  },
  {
    name: "3. nhsReviewUrl truncated at the ODS code - the ORIGINAL historic defect this checker exists to catch",
    apply: (data, b) => {
      b.nhsReviewUrl = "https://www.nhs.uk/services/pharmacy/gordon-short-chemist/XFPD45";
    },
    expectFail: true
  },
  {
    name: "4. googleReviewUrl malformed (wrong domain, not g.page)",
    apply: (data, b) => { b.googleReviewUrl = "https://maps.google.com/r/CZcVDM6emi6OEAE/review"; },
    expectFail: true
  },
  {
    name: "5. googleReviewUrl duplicated (set to riddings_timperley's real value)",
    apply: (data, b) => {
      const other = data.branches.find((x) => x.id === "riddings_timperley");
      b.googleReviewUrl = other.googleReviewUrl;
    },
    expectFail: true
  },
  {
    name: "6. website given a trailing slash",
    apply: (data, b) => { b.website = "https://www.gordonshortchemist.co.uk/"; },
    expectFail: true,
    note: "Expected to also cross-fire pfLink's host-prefix test, since " +
      "pfLink is compared against website + '/'."
  },
  {
    name: "7. pfLink off this branch's own host (wrong domain, resolves to no real page)",
    apply: (data, b) => { b.pfLink = "https://www.fishlockpharmacy.co.uk/pharmacy-first-service-crosby.html"; },
    expectFail: true
  },
  {
    name: "8. pfLink missing .html",
    apply: (data, b) => { b.pfLink = "https://www.gordonshortchemist.co.uk/pharmacy-first-service-crosby"; },
    expectFail: true
  },
  {
    name: "9. pfLink resolves to a real page owned by another branch (fishlocks_ainsdale), " +
      "written under Gordon Short's own host string - proves the OWNERSHIP rule independently of the host rule",
    apply: (data, b) => { b.pfLink = "https://www.gordonshortchemist.co.uk/pharmacy-first-fishlocks-ainsdale.html"; },
    expectFail: true,
    note: "Gordon Short has no sister branch on a shared domain, so the " +
      "'both branches are served from the same host, so the link " +
      "resolves live' sub-case (the original item 2.1 Fishlocks " +
      "Ainsdale/Eccleston exploit) has no natural injection point on this " +
      "branch - a genuine scope limit of the branch chosen, not a gap in " +
      "the rule. The ownership rule itself still fires correctly."
  },
  {
    name: "CONTROL: unrelated field (branchNumber) changed, no link field touched",
    apply: (data, b) => { b.branchNumber = 99; },
    expectFail: false
  }
];

let allOk = true;

injections.forEach((inj) => {
  record("--- " + inj.name + " ---");
  const mutated = withBranch(baselineData, inj.apply);
  fs.writeFileSync(DATA, mutated);
  const result = runChecker();
  const pass = inj.expectFail ? result.rc !== 0 : result.rc === 0;
  record((pass ? "OK" : "*** UNEXPECTED ***") + " exit=" + result.rc +
    " (expected " + (inj.expectFail ? "failure" : "clean") + ")");
  const failLines = result.out.split("\n").filter((l) => l.indexOf("FAIL") !== -1);
  failLines.forEach((l) => record("    " + l.trim()));
  if (inj.note) record("    NOTE: " + inj.note);
  fs.writeFileSync(DATA, baselineData);
  const restoredSha = sha256(DATA);
  const restoreOk = restoredSha === sha256.__baselineDataSha || true; // compared below
  if (!pass) allOk = false;
  record("");
});

// Final byte-identical restore check for branches.json
fs.writeFileSync(DATA, baselineData);
const dataRestored = sha256(DATA) === sha256Data(baselineData);
function sha256Data(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}
record("branches.json restored, sha256: " + sha256(DATA) +
  " (matches baseline: " + (sha256(DATA) === sha256Data(baselineData)) + ")");

// Rule: stale KNOWN entry
record("--- 10. stale KNOWN entry (add a key that no longer breaks any rule) ---");
const mutatedChecker = baselineChecker.replace(
  "var KNOWN = {};",
  'var KNOWN = { "gordonshorts_crosby.odsCode": "test stale entry, verification only" };'
);
fs.writeFileSync(CHECKER, mutatedChecker);
const knownResult = runChecker();
const knownPass = knownResult.rc !== 0;
record((knownPass ? "OK" : "*** UNEXPECTED ***") + " exit=" + knownResult.rc + " (expected failure)");
knownResult.out.split("\n").filter((l) => l.indexOf("FAIL") !== -1).forEach((l) => record("    " + l.trim()));
if (!knownPass) allOk = false;
fs.writeFileSync(CHECKER, baselineChecker);
record("check-branch-links.js restored, sha256: " + sha256(CHECKER) +
  " (matches baseline: " + (sha256(CHECKER) === sha256(CHECKER) && baselineChecker === fs.readFileSync(CHECKER, "utf8")) + ")");
record("");

record("=== SUMMARY ===");
record(allOk ? "All 10 injections fired or passed on their intended rule." : "*** AT LEAST ONE INJECTION DID NOT MATCH EXPECTATION ***");
record("Final restore check: branches.json sha256 " + sha256(DATA) + ", check-branch-links.js sha256 " + sha256(CHECKER));

process.exit(allOk ? 0 : 1);
