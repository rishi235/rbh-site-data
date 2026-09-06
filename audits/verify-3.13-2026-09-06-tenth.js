/*
  audits/verify-3.13-2026-09-06-tenth.js - tenth quality pass on worklist item
  3.13 (Clear Chemist, Aintree).

  Nine prior passes proved tools/check-switch-copy.js (seventh pass),
  tools/check-weight-loss-copy.js and tools/check-travel-clinic-copy.js
  (seventh pass) and tools/check-jsonld.js (ninth pass) against this branch's
  own three pages by direct injection. A grep of this item's own
  AGENT_WORKLIST.md section for "check-seo-pattern.js" across all nine prior
  passes returns zero hits - the one checker never once pointed at Clear
  Chemist Aintree specifically, despite it being the flagship checker for the
  whole Phase 3.x series this item belongs to (tools/check-seo-pattern.js's
  own header: "Phase 3 verifier (worklist items 3.2 to 3.13)"). Passing
  estate-wide (177 pages, 0 failures) is not the same as being proven against
  THIS branch by injection - the exact distinction CLAUDE.md documents
  repeatedly ("a list of names is not a rule, it is a snapshot"; "when a
  checker passes, ask which files it read").

  Same four rule-shapes the item 3.7 twelfth pass (Smartts Chemist Bootle)
  proved for the first time against that branch: exact title match, cross-town
  absence, one H1, one title line. Restored by fs.writeFileSync from an
  in-memory buffer captured before any mutation, sha256-reconfirmed after every
  restore, matching the discipline this item's own seventh/eighth/ninth passes
  established (not git checkout, which this sandbox's FUSE-mounted .git can
  crash mid-restore, as this item's own fifth pass found and fixed).

  Run: node verify-3.13-2026-09-06-tenth.js   (run from repo root)
*/
"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var { execSync } = require("child_process");

var ROOT = process.cwd();

var FILES = {
  switchPage: path.join(ROOT, "modules", "switch", "pages", "switch-prescriptions-clear-aintree.html"),
  weightLoss: path.join(ROOT, "modules", "service", "pages", "weight-loss-clinic-clear-aintree.html"),
  travel: path.join(ROOT, "modules", "service", "pages", "travel-clinic-clear-aintree.html"),
};

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function readBuf(p) {
  return fs.readFileSync(p);
}

function runChecker() {
  try {
    var out = execSync("node tools/check-seo-pattern.js", { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

// ---- baseline ----
var baseline = {};
Object.keys(FILES).forEach(function (k) {
  var buf = readBuf(FILES[k]);
  baseline[k] = { buf: buf, sha: sha256(buf) };
});

console.log("Baseline sha256:");
Object.keys(baseline).forEach(function (k) {
  console.log("  " + k + " " + baseline[k].sha + " (" + FILES[k] + ")");
});

var base = runChecker();
if (base.code !== 0) {
  console.error("ABORT: check-seo-pattern.js is not clean before any injection. Output:\n" + base.out);
  process.exit(2);
}
console.log("Baseline check-seo-pattern.js: exit 0 (clean).\n");

function restore(k) {
  fs.writeFileSync(FILES[k], baseline[k].buf);
  var again = sha256(readBuf(FILES[k]));
  if (again !== baseline[k].sha) {
    console.error("RESTORE FAILURE on " + k + ": sha256 " + again + " != baseline " + baseline[k].sha);
    process.exit(3);
  }
}

var results = [];

function tryInjection(name, k, mutate, expectSubstr) {
  var original = baseline[k].buf.toString("utf8");
  var mutated = mutate(original);
  fs.writeFileSync(FILES[k], mutated, "utf8");
  var res = runChecker();
  var caught = res.code !== 0 && res.out.indexOf(expectSubstr) !== -1;
  results.push({ name: name, file: k, caught: caught, exitCode: res.code, expectSubstr: expectSubstr, output: res.out.trim() });
  restore(k);
}

// 1. EXACT TITLE MATCH - append text to the Weebly SEO title line (switch page)
tryInjection(
  "exact-title-match",
  "switchPage",
  function (s) {
    return s.replace(
      "Weebly page SEO title:       Switch Your Prescriptions to Clear Chemist, Aintree",
      "Weebly page SEO title:       Switch Your Prescriptions to Clear Chemist, Aintree - Now Open Weekends"
    );
  },
  "title"
);

// 2. CROSS-TOWN ABSENCE - name a live branch's seoTown not in Clear's own
//    serviceAreaList (Aintree, Fazakerley, Walton, Bootle, North Liverpool).
//    Ainsdale is a real live seoTown (Fishlocks Ainsdale, Hirshmans Ainsdale),
//    the same value the item 3.7 twelfth pass used for the identical purpose.
tryInjection(
  "cross-town-absence",
  "weightLoss",
  function (s) {
    return s.replace(
      "Weebly page SEO description:  Private, pharmacist-led weight loss clinic at Clear Chemist in Aintree. Clinical assessment first; treatment only where appropriate.",
      "Weebly page SEO description:  Private, pharmacist-led weight loss clinic at Clear Chemist in Aintree. Also serving patients from Ainsdale. Clinical assessment first; treatment only where appropriate."
    );
  },
  "Ainsdale"
);

// 3. ONE H1 - second heading inserted directly after the genuine one
tryInjection(
  "one-h1",
  "travel",
  function (s) {
    return s.replace(
      "<h1>Travel Clinic at Clear Chemist in Aintree</h1>",
      "<h1>Travel Clinic at Clear Chemist in Aintree</h1>\n          <h1>Pharmacy in Ainsdale</h1>"
    );
  },
  "h1"
);

// 4. ONE TITLE LINE - a second "Weebly page SEO title" line inserted right
//    after the genuine one in the head comment
tryInjection(
  "one-title-line",
  "switchPage",
  function (s) {
    return s.replace(
      "Weebly page SEO title:       Switch Your Prescriptions to Clear Chemist, Aintree\n",
      "Weebly page SEO title:       Switch Your Prescriptions to Clear Chemist, Aintree\n  Weebly page SEO title:       Pharmacy in Ainsdale\n"
    );
  },
  "Weebly page SEO title"
);

// ---- final restore verification ----
var finalOk = true;
Object.keys(FILES).forEach(function (k) {
  var buf = readBuf(FILES[k]);
  var sha = sha256(buf);
  if (sha !== baseline[k].sha) {
    console.error("FINAL VERIFY FAILURE: " + k + " sha256 " + sha + " != baseline " + baseline[k].sha);
    finalOk = false;
  }
});

var finalCheck = runChecker();

console.log("\n=== RESULTS ===");
var missed = 0;
results.forEach(function (r) {
  console.log((r.caught ? "CAUGHT" : "MISSED") + "  " + r.name + "  (" + r.file + ", exit " + r.exitCode + ")");
  if (!r.caught) {
    missed++;
    console.log("    expected substring: " + JSON.stringify(r.expectSubstr));
    console.log("    output: " + r.output.split("\n").slice(0, 5).join("\n    "));
  }
});

console.log("\nAll files restored byte-identical: " + (finalOk ? "YES" : "NO"));
console.log("Final check-seo-pattern.js run: exit " + finalCheck.code + (finalCheck.code === 0 ? " (clean)" : ""));
console.log(missed === 0 && finalOk && finalCheck.code === 0 ? "\nPASS: " + results.length + "/" + results.length + " caught, all restores verified, checker clean after." : "\nFAIL: see above.");

process.exit(missed === 0 && finalOk && finalCheck.code === 0 ? 0 : 1);
