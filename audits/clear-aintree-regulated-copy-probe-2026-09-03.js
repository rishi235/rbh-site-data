/*
  audits/clear-aintree-regulated-copy-probe-2026-09-03.js

  Item 3.13 quality pass (seventh), Clear Chemist (Aintree), 2026-09-03.

  FRESH ANGLE for this pass. Six prior passes (2026-08-13 through 2026-09-02)
  proved check-nap.js, check-jsonld.js, check-branch-identity.js and the
  generic structural instrument (audits/clear-aintree-independent-2026-08-14
  .js) against all three Clear Chemist Aintree pages by injection, targeting
  the switch page every time (audits/clear-aintree-vacuity-probe-2026-09-01
  .js: 9 fault/rule pairs, all against switch-prescriptions-clear-aintree
  .html). Across seven passes, check-weight-loss-copy.js and
  check-travel-clinic-copy.js - the two regulated-copy checkers that hold the
  eligibility, no-guarantee, no-medicine-name and no-outcome-promise wording
  on this branch's own weight loss and travel clinic pages - had never been
  proven by direct injection against THIS branch's own pages. Both checkers
  read all 15/15 pages estate-wide, so both were passing on Clear Aintree by
  construction, not by anything this item's history had tested directly. This
  probe closes that gap the same way the switch-page probe closed its own.

  Method: one fault at a time against the real tracked file, restore by byte
  copy (fs.writeFileSync from the in-memory original) rather than git, the
  lesson CLAUDE.md's own "Weight loss copy" section prescribes and the one
  the 2026-09-01 fifth pass had to apply by hand after a sandboxed-mount
  index.lock left a git-restore probe crashed mid-run. sha256-verified
  byte-identical to the pre-probe hash after every restore and again at the
  end. Refuses to run if the target already shows a git diff.

  Run:  node audits/clear-aintree-regulated-copy-probe-2026-09-03.js
*/
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const crypto = require("crypto");

const REPO = path.join(__dirname, "..");
const WL_REL = "modules/service/pages/weight-loss-clinic-clear-aintree.html";
const TC_REL = "modules/service/pages/travel-clinic-clear-aintree.html";
const WL_ABS = path.join(REPO, WL_REL);
const TC_ABS = path.join(REPO, TC_REL);
const WL_CHECKER = path.join(REPO, "tools", "check-weight-loss-copy.js");
const TC_CHECKER = path.join(REPO, "tools", "check-travel-clinic-copy.js");

function sha256(s) { return crypto.createHash("sha256").update(s, "utf8").digest("hex"); }

function gitStatusQuiet(relTarget) {
  try { return cp.execFileSync("git", ["status", "--porcelain", "--", relTarget], { cwd: REPO, stdio: "pipe" }).toString().trim(); }
  catch (e) { return null; }
}

function refuseIfDirty(relTarget) {
  const status = gitStatusQuiet(relTarget);
  if (status === null) {
    console.log("WARNING: could not read git status for " + relTarget + " (lock contention?) - proceeding on file content alone.");
  } else if (status) {
    console.log("REFUSING TO RUN: " + relTarget + " is already modified.");
    process.exit(2);
  }
}

function runChecker(checkerPath) {
  try { return { out: cp.execFileSync("node", [checkerPath], { cwd: REPO }).toString(), code: 0 }; }
  catch (e) { return { out: (e.stdout || "").toString() + (e.stderr || "").toString(), code: e.status || 1 }; }
}

refuseIfDirty(WL_REL);
refuseIfDirty(TC_REL);

const wlOriginal = fs.readFileSync(WL_ABS, "utf8");
const tcOriginal = fs.readFileSync(TC_ABS, "utf8");
const wlBaselineHash = sha256(wlOriginal);
const tcBaselineHash = sha256(tcOriginal);

let good = 0, bad = 0;

function tryInjection(label, abs, original, mutate, expectSubstrings, checkerPath) {
  const mutated = mutate(original);
  if (mutated === original) {
    console.log("  INERT   " + label + " - injection changed nothing, probe is not testing this");
    bad++;
    return;
  }
  fs.writeFileSync(abs, mutated);
  const result = runChecker(checkerPath);
  // Restore by byte copy first, before any assertion, so a thrown assertion
  // below can never leave the file mutated on disk.
  fs.writeFileSync(abs, original);
  const restored = fs.readFileSync(abs, "utf8") === original;
  const failedAsExpected = result.code !== 0;
  const allSubstringsPresent = expectSubstrings.every(function (s) {
    return result.out.toLowerCase().indexOf(s.toLowerCase()) !== -1;
  });
  const caught = failedAsExpected && allSubstringsPresent;
  console.log("  " + (caught ? "CAUGHT  " : "MISSED  ") + label +
    (restored ? "" : "  **NOT RESTORED - INVESTIGATE**"));
  if (!caught) {
    console.log("          exit=" + result.code + " expected substrings=" + JSON.stringify(expectSubstrings));
    console.log("          --- checker output tail ---");
    console.log(result.out.split("\n").slice(-15).map(function (l) { return "          " + l; }).join("\n"));
  }
  caught && restored ? good++ : bad++;
}

console.log("=== Weight loss page: modules/service/pages/weight-loss-clinic-clear-aintree.html ===");
console.log("check-weight-loss-copy.js baseline: " + (runChecker(WL_CHECKER).code === 0 ? "clean" : "ALREADY FAILING - abort"));
if (runChecker(WL_CHECKER).code !== 0) process.exit(2);

tryInjection(
  "RULE 4 private-marks: drop the unique paid-private sentence",
  WL_ABS, wlOriginal,
  function (t) {
    return t.replace(
      /This is a paid private service, not an NHS treatment, and it is\s+not right for everyone\./,
      "This is a private, paid service."
    );
  },
  ['no longer states "This is a paid private service, not an NHS treatment"'],
  WL_CHECKER
);

tryInjection(
  "RULE 8 medicine name: insert Mounjaro",
  WL_ABS, wlOriginal,
  function (t) {
    return t.replace("See below.</p>", "See below. Mounjaro may be suitable for some patients.</p>");
  },
  ['names "mounjaro"'],
  WL_CHECKER
);

tryInjection(
  "RULE 9 efficacy claim: insert real results",
  WL_ABS, wlOriginal,
  function (t) {
    return t.replace("See below.</p>", "See below. See our real results.</p>");
  },
  ["real results"],
  WL_CHECKER
);

console.log("");
console.log("=== Travel clinic page: modules/service/pages/travel-clinic-clear-aintree.html ===");
console.log("check-travel-clinic-copy.js baseline: " + (runChecker(TC_CHECKER).code === 0 ? "clean" : "ALREADY FAILING - abort"));
if (runChecker(TC_CHECKER).code !== 0) process.exit(2);

tryInjection(
  "RULE private (hero): drop the unique private-paid-service sentence",
  TC_ABS, tcOriginal,
  function (t) {
    return t.replace(
      /This is a private, paid service, not an NHS-funded appointment, though some individual vaccines may be\s+available on the NHS depending on your circumstances, the pharmacist will advise\./,
      "This service is available for travellers of all ages, the pharmacist will advise."
    );
  },
  ["[private]"],
  TC_CHECKER
);

tryInjection(
  "RULE stock: insert always in stock",
  TC_ABS, tcOriginal,
  function (t) {
    return t.replace(
      "the pharmacist will advise.</p>",
      "the pharmacist will advise. All our travel vaccines are always in stock.</p>"
    );
  },
  ["[stock]"],
  TC_CHECKER
);

tryInjection(
  "RULE medicine (rule 8): insert Typhim",
  TC_ABS, tcOriginal,
  function (t) {
    return t.replace(
      "the pharmacist will advise.</p>",
      "the pharmacist will advise. We proudly stock Typhim.</p>"
    );
  },
  ["[medicine]", "typhim"],
  TC_CHECKER
);

tryInjection(
  "RULE outcome (rule 12): insert will protect you",
  TC_ABS, tcOriginal,
  function (t) {
    return t.replace(
      "the pharmacist will advise.</p>",
      "the pharmacist will advise. This vaccine will protect you completely.</p>"
    );
  },
  ["[outcome]"],
  TC_CHECKER
);

const wlRestoredOk = sha256(fs.readFileSync(WL_ABS, "utf8")) === wlBaselineHash;
const tcRestoredOk = sha256(fs.readFileSync(TC_ABS, "utf8")) === tcBaselineHash;
const wlAfter = gitStatusQuiet(WL_REL);
const tcAfter = gitStatusQuiet(TC_REL);

console.log("");
console.log(good + " caught, " + bad + " missed.");
console.log(WL_REL + (wlRestoredOk ? " restored clean (sha256-verified)." : " **STILL MODIFIED - RESTORE BY HAND**") +
  (wlAfter === null ? " (git status unreadable, hash check is authoritative)" : (wlAfter ? " NOTE: git still shows a diff." : "")));
console.log(TC_REL + (tcRestoredOk ? " restored clean (sha256-verified)." : " **STILL MODIFIED - RESTORE BY HAND**") +
  (tcAfter === null ? " (git status unreadable, hash check is authoritative)" : (tcAfter ? " NOTE: git still shows a diff." : "")));

process.exit(bad || !wlRestoredOk || !tcRestoredOk ? 1 : 0);
