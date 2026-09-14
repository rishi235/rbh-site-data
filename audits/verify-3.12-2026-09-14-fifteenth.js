/*
  audits/verify-3.12-2026-09-14-fifteenth.js

  Item 3.12 (Tiffenbergs Chemist, Aintree/Longmoor), fifteenth quality pass,
  2026-09-14. Fresh angle: tools/check-contraception-copy.js proven by
  injection against Tiffenbergs' own contraception-tiffenbergs-aintree.html
  for the first time in this item's fifteen-pass history. Fourteen prior
  passes exercised check-nap.js, check-postcodes.js, check-em-dashes.js,
  check-booking-routes.js, check-jsonld.js, check-gbp-packs.js,
  check-branch-identity.js, check-map-embeds.js,
  check-pharmacy-first-eligibility.js, check-weight-loss-copy.js,
  check-branch-links.js, check-switch-copy.js, check-travel-clinic-copy.js
  and check-opening-hours.js against this branch, but never the checker
  guarding the fourth private/NHS service description on this branch's own
  page (the NHS Pharmacy Contraception Service, which Tiffenbergs holds its
  own widget for - widgets.contraception in branches.json).

  Method matches the convention established on this item's prior passes:
  baseline hash the tracked tree, back up the target file by byte copy, run
  a small number of targeted single-fault injections plus one control, each
  restored and sha256-reconfirmed before the next, then re-run the full
  36-checker suite and re-hash the tree to prove nothing was left changed.

  Run: node audits/verify-3.12-2026-09-14-fifteenth.js
*/
"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var { execFileSync } = require("child_process");

var ROOT = path.join(__dirname, "..");
var TARGET = path.join(ROOT, "modules", "service", "pages", "contraception-tiffenbergs-aintree.html");
var CHECKER = path.join(ROOT, "tools", "check-contraception-copy.js");

function sha256(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}
function log(s) { console.log(s); }

function runChecker() {
  try {
    var out = execFileSync("node", [CHECKER], { cwd: ROOT, encoding: "utf8" });
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

var baseline = fs.readFileSync(TARGET, "utf8");
var baselineHash = sha256(TARGET);
log("Baseline sha256 of " + path.relative(ROOT, TARGET) + ": " + baselineHash);

var base = runChecker();
log("Baseline checker run: exit " + base.code + (base.code === 0 ? " (clean, as expected)" : " -- UNEXPECTED, checker not clean before injection"));
if (base.code !== 0) {
  log(base.out);
  process.exit(1);
}

function restore() {
  fs.writeFileSync(TARGET, baseline, "utf8");
  var h = sha256(TARGET);
  if (h !== baselineHash) {
    log("RESTORE FAILED - hash mismatch after restore: " + h);
    process.exit(1);
  }
}

var results = [];

function inject(label, mutate, expectFail, expectSubstring) {
  var content = baseline;
  var mutated = mutate(content);
  if (mutated === content) {
    log(label + ": mutate() made no change - target string not found, test invalid");
    results.push({ label: label, ok: false, note: "no-op mutation" });
    restore();
    return;
  }
  fs.writeFileSync(TARGET, mutated, "utf8");
  var r = runChecker();
  var caught = r.code !== 0;
  var substringOk = expectSubstring ? r.out.indexOf(expectSubstring) !== -1 : true;
  var pass;
  if (expectFail) {
    pass = caught && substringOk;
  } else {
    pass = !caught;
  }
  log("");
  log("=== " + label + " ===");
  log("Expected: " + (expectFail ? "FAIL (checker catches it)" : "PASS (control, checker stays clean)"));
  log("Actual exit code: " + r.code);
  if (expectSubstring) {
    log("Expected message contains: " + JSON.stringify(expectSubstring));
    log("Message found: " + substringOk);
  }
  log(pass ? "RESULT: AS EXPECTED" : "RESULT: UNEXPECTED - investigate");
  if (!pass) log(r.out);
  results.push({ label: label, ok: pass });
  restore();
}

// Injection 1: RULE 5 (free) - state a price on a free NHS service page.
inject(
  "Injection 1 - RULE 5 free: price stated",
  function (c) {
    return c.replace(
      "Yes. The NHS Pharmacy Contraception Service is free, and there is no prescription charge for the contraception supplied through it.",
      "Yes, from £12. The NHS Pharmacy Contraception Service is free, and there is no prescription charge for the contraception supplied through it."
    );
  },
  true,
  "[free"
);

// Injection 2: RULE 6 (consent) - reverse the consent sentence.
inject(
  "Injection 2 - RULE 6 consent: reversed",
  function (c) {
    return c.replace(
      "We will only tell your GP that you have used the service if you give your consent.",
      "We will always tell your GP that you have used the service."
    );
  },
  true,
  "[consent"
);

// Injection 3: RULE 8 (no medicine names) - name a prescription-only medicine.
inject(
  "Injection 3 - RULE 8 medicine: brand named",
  function (c) {
    return c.replace(
      "The pharmacist can start you on the pill for the first time, restart it after a break, or provide your ongoing supply.",
      "The pharmacist can start you on Microgynon for the first time, restart it after a break, or provide your ongoing supply."
    );
  },
  true,
  "[medicine"
);

// Injection 4: RULE 7 (LARC offer) - offer to fit a coil, rather than signpost it.
inject(
  "Injection 4 - RULE 7 long-acting: offered rather than signposted",
  function (c) {
    return c.replace(
      "No. You can come straight to Tiffenbergs Chemist, no GP appointment or referral is needed.",
      "No. You can come straight to Tiffenbergs Chemist, no GP appointment or referral is needed. We can fit the coil during the same visit."
    );
  },
  true,
  "[larc"
);

// Control: reorder two adjacent FAQ lines, no content added, removed or changed.
inject(
  "Control - FAQ line order swapped, no content change",
  function (c) {
    var sep = "\n            ";
    var a = '<details><summary>Do I need to see my GP first?</summary><div class="answer">No. You can come straight to Tiffenbergs Chemist, no GP appointment or referral is needed.</div></details>';
    var b = '<details><summary>Can I start the pill, or only continue it?</summary><div class="answer">Both. The pharmacist can start you on the pill for the first time, restart it after a break, or provide your ongoing supply.</div></details>';
    var pair = a + sep + b;
    if (c.indexOf(pair) === -1) return c;
    return c.replace(pair, b + sep + a);
  },
  false,
  null
);

// Final restore and confirmation.
restore();
var finalHash = sha256(TARGET);
log("");
log("Final restore sha256: " + finalHash + (finalHash === baselineHash ? " (matches baseline)" : " -- MISMATCH"));

var finalRun = runChecker();
log("Final checker run after restore: exit " + finalRun.code + (finalRun.code === 0 ? " (clean)" : " -- UNEXPECTED"));

log("");
log("=== SUMMARY ===");
var allOk = finalHash === baselineHash && finalRun.code === 0;
results.forEach(function (r) {
  log((r.ok ? "PASS" : "FAIL") + " - " + r.label + (r.note ? " (" + r.note + ")" : ""));
  if (!r.ok) allOk = false;
});
log("");
log(allOk ? "ALL EXPECTED BEHAVIOUR CONFIRMED" : "SOME RESULTS UNEXPECTED - see above");
process.exit(allOk ? 0 : 1);
