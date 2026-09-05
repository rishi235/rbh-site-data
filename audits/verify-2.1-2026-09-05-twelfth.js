/*
  audits/verify-2.1-2026-09-05-twelfth.js

  Item 2.1 (Fishlocks Ainsdale), twelfth quality pass, 2026-09-05.

  Of this branch's 13 owned pages, four page types have already had a
  dedicated injection round for this item: the switch page (eighth pass,
  check-nap.js), the travel clinic page (ninth pass, check-nap.js /
  check-postcodes.js / check-em-dashes.js), the branch landing page (tenth
  pass, check-opening-hours.js / check-branch-identity.js /
  check-pharmacy-first-eligibility.js rule 9 / check-map-embeds.js) and the
  weight-loss-clinic page (eleventh pass, check-weight-loss-copy.js). Left
  untested for this item across eleven prior passes: the seven Pharmacy
  First condition pages, the Pharmacy First overview page, and the
  contraception page. This pass proves check-contraception-copy.js against
  contraception-fishlocks-ainsdale.html, which has never been injection
  tested for item 2.1 (it was written on 2026-08-14 against a different
  branch entirely and CLAUDE.md's own account of it names no branch).

  Design, matching the discipline the tenth and eleventh passes used:
    - refuses to run if the target file already carries a git diff
    - captures a baseline pass of the real checker first
    - restores by direct file write from an in-memory buffer captured at
      the start, immediately after each check and before the next mutation
      (never `git checkout`, per the CLAUDE.md item 5.2 lesson)
    - sha256-reconfirms byte-identical restoration before the next
      injection and again at the end
    - one targeted mutation at a time, never layered on the previous one
    - invokes the real tool as a child process; no code shared with
      tools/check-contraception-copy.js beyond that

  Run:  node audits/verify-2.1-2026-09-05-twelfth.js
*/
"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var cp = require("child_process");

var ROOT = path.join(__dirname, "..");
var TARGET = path.join(ROOT, "modules", "service", "pages", "contraception-fishlocks-ainsdale.html");
var CHECKER = path.join(ROOT, "tools", "check-contraception-copy.js");

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function gitDiffEmpty(relPath) {
  var out = cp.execSync('git status --porcelain -- "' + relPath + '"', { cwd: ROOT }).toString();
  return out.trim().length === 0;
}

function runChecker() {
  var res = cp.spawnSync(process.execPath, [CHECKER], { cwd: ROOT, encoding: "utf8" });
  return { code: res.status, out: (res.stdout || "") + (res.stderr || "") };
}

var relTarget = path.relative(ROOT, TARGET).replace(/\\/g, "/");

console.log("verify-2.1-2026-09-05-twelfth: proving check-contraception-copy.js against " + relTarget);

if (!gitDiffEmpty(relTarget)) {
  console.error("REFUSING TO RUN: " + relTarget + " already has an uncommitted git diff. " +
    "This harness must start from a clean, committed original or restoration cannot be trusted.");
  process.exit(2);
}

var original = fs.readFileSync(TARGET);
var originalHash = sha256(original);
console.log("Original file captured in memory, sha256 " + originalHash + ", " + original.length + " bytes.");

// Baseline: the real checker must pass clean before any mutation.
var baseline = runChecker();
if (baseline.code !== 0) {
  console.error("REFUSING TO RUN: baseline check-contraception-copy.js did not pass clean " +
    "(exit " + baseline.code + "). Fix the baseline before testing injections against it.");
  console.error(baseline.out);
  process.exit(2);
}
console.log("Baseline: check-contraception-copy.js exits 0 on the untouched tree. OK.");

var results = [];
var allOk = true;

function restore(label) {
  fs.writeFileSync(TARGET, original);
  var h = sha256(fs.readFileSync(TARGET));
  var ok = h === originalHash;
  if (!ok) {
    console.error("RESTORE FAILURE after " + label + ": sha256 " + h + " != original " + originalHash);
    allOk = false;
  } else {
    console.log("  restored byte-identical (sha256 " + h + ") after " + label);
  }
}

function tryInjection(label, mutate, expectSubstring) {
  var src = original.toString("utf8");
  var mutated = mutate(src);
  if (mutated === src) {
    console.error("INJECTION SETUP FAILURE for " + label + ": mutation string not found in source, " +
      "so nothing was actually changed. Aborting rather than reporting a false pass.");
    allOk = false;
    return;
  }
  fs.writeFileSync(TARGET, mutated, "utf8");
  var res = runChecker();
  var caught = res.code !== 0 && res.out.indexOf(expectSubstring) !== -1;
  console.log("[" + label + "] exit=" + res.code + " expected-substring-found=" +
    (res.out.indexOf(expectSubstring) !== -1) + " -> " + (caught ? "CAUGHT" : "NOT CAUGHT"));
  if (!caught) {
    allOk = false;
    console.error("  --- checker output ---");
    console.error(res.out);
    console.error("  --- end output ---");
  }
  results.push({ label: label, caught: caught });
  restore(label);
}

// 1) RULE 4 (servicename): inject a wrong name for the service without
// removing the correct one, so this isolates the wrongNames absence rule
// rather than the SERVICE_NAME presence rule.
tryInjection(
  "RULE 4 servicename (wrong name injected)",
  function (s) {
    return s.replace(
      "A pharmacist can start you on the contraceptive pill, restart it after a break, or provide your ongoing supply, in a private consultation with no GP appointment or referral needed.",
      "A pharmacist can start you on the contraceptive pill under the NHS Contraception Service, restart it after a break, or provide your ongoing supply, in a private consultation with no GP appointment or referral needed."
    );
  },
  "servicename"
);

// 2) RULE 5 (free): inject a consultation-fee phrase from the checker's own
// forbidden-phrase list.
tryInjection(
  "RULE 5 free (consultation fee wording injected)",
  function (s) {
    return s.replace(
      "We will only use your details to arrange your appointment.",
      "We will only use your details to arrange your appointment. A consultation fee applies for this service."
    );
  },
  "free"
);

// 3) RULE 6 (consent, reversed direction): replace the confidentiality FAQ
// answer with a sentence that states the opposite of the consent promise.
tryInjection(
  "RULE 6 consent (reversed)",
  function (s) {
    return s.replace(
      "Yes. Your consultation is private and confidential. We will only tell your GP that you have used the service if you give your consent.",
      "Yes. Your consultation is private and confidential. Your GP will be told about your visit automatically."
    );
  },
  "consent"
);

// 4) RULE 7 (larc): offer to fit a coil, rather than signposting one.
tryInjection(
  "RULE 7 larc (coil-fitting offer injected)",
  function (s) {
    return s.replace(
      "For a coil or implant (long-acting contraception), we will advise where to get this locally",
      "For a coil or implant, we can fit the coil in a same-day appointment"
    );
  },
  "larc"
);

// 5) RULE 8 (medicine name): name a prescription-only contraceptive pill by brand.
tryInjection(
  "RULE 8 medicine (brand name injected)",
  function (s) {
    return s.replace(
      "Seen privately by your local Ainsdale team",
      "Seen privately by your local Ainsdale team, currently stocking Microgynon"
    );
  },
  "medicine"
);

// Final confirmation the file is back to its original bytes.
var finalHash = sha256(fs.readFileSync(TARGET));
console.log("Final sha256 " + finalHash + " (" + (finalHash === originalHash ? "matches" : "DOES NOT MATCH") +
  " original " + originalHash + ").");
if (finalHash !== originalHash) allOk = false;

// Re-run the real checker once more clean, to confirm the file is genuinely
// back to a passing state and not merely byte-identical by coincidence.
var finalRun = runChecker();
console.log("Final re-run of check-contraception-copy.js: exit " + finalRun.code +
  (finalRun.code === 0 ? " (OK)" : " (UNEXPECTED FAILURE)"));
if (finalRun.code !== 0) { allOk = false; console.error(finalRun.out); }

console.log("");
console.log("Summary: " + results.filter(function (r) { return r.caught; }).length + "/" +
  results.length + " injections caught.");
results.forEach(function (r) { console.log("  " + (r.caught ? "CAUGHT " : "MISSED ") + r.label); });

process.exit(allOk ? 0 : 1);
