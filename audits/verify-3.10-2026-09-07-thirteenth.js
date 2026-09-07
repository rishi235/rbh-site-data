/*
  verify-3.10-2026-09-07-thirteenth.js

  Item 3.10 (Riddings Pharmacy, Timperley), thirteenth quality pass.

  Twelve prior passes had proven check-nap, check-em-dashes,
  check-service-links (JS-injected copy), check-postcodes,
  check-branch-identity (5 rules), check-booking-routes (twice),
  check-switch-copy, check-contraception-copy, check-travel-clinic-copy,
  check-jsonld (7 of 8 rules) and check-seo-pattern against Riddings' own
  pages by injection, and ruled check-opening-hours structurally
  inapplicable (no branch landing page for this branch). A grep of this
  item's own AGENT_WORKLIST.md section for "check-map-embeds.js" returned
  zero hits across all twelve passes, despite CLAUDE.md itself calling the
  map iframe "the address no text search can read" and check-map-embeds.js
  being one of only 36 checkers in the repo. This instrument closes that
  gap.

  Shares no code with tools/check-map-embeds.js beyond invoking the real
  checker as a child process. Refuses to run if any target file already
  carries a git diff. Restores each target from an in-memory Buffer
  captured before mutation, immediately after capturing the checker's
  output and before any assertion runs. SHA256-reconfirms byte-identical
  before the next injection and again at the end.

  Run: node audits/verify-3.10-2026-09-07-thirteenth.js
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function gitDiffEmpty(relPath) {
  try {
    const out = execFileSync("git", ["status", "--porcelain", "--", relPath], { cwd: REPO }).toString();
    return out.trim() === "";
  } catch (e) {
    throw new Error("git status failed for " + relPath + ": " + e.message);
  }
}

function runChecker() {
  try {
    const out = execFileSync("node", ["tools/check-map-embeds.js"], { cwd: REPO }).toString();
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "").toString() + (e.stderr || "").toString() };
  }
}

const targets = [
  "modules/service/pages/contraception-riddings-timperley.html",
  "modules/service/pages/impetigo-treatment-riddings-timperley.html",
  "modules/service/pages/earache-treatment-riddings-timperley.html",
  "modules/service/pages/insect-bite-treatment-riddings-timperley.html"
];

targets.forEach(function (t) {
  if (!gitDiffEmpty(t)) throw new Error("REFUSING TO RUN: " + t + " already carries a git diff before this instrument touched anything.");
});
console.log("PRECHECK: all " + targets.length + " target files git-diff-empty at start.");

const baseline = runChecker();
console.log("\nBASELINE: exit " + baseline.code);
console.log(baseline.out.trim().split("\n").slice(0, 5).join("\n"));
if (baseline.code !== 0) throw new Error("Baseline is not clean, refusing to inject.");

const results = [];

function inject(label, relPath, mutate, expectSnippet) {
  const abs = path.join(REPO, relPath);
  const original = fs.readFileSync(abs);
  const originalHash = sha256(original);
  try {
    const mutated = mutate(original.toString("utf8"));
    fs.writeFileSync(abs, mutated, "utf8");
    const res = runChecker();
    const caught = res.code !== 0 && res.out.includes(expectSnippet);
    results.push({ label: label, file: relPath, caught: caught, code: res.code, snippet: expectSnippet, sample: caught ? (res.out.split("\n").filter(function(l){return l.indexOf(expectSnippet.split(":")[0]) !== -1 || l.toLowerCase().indexOf(expectSnippet.toLowerCase().split(" ")[0]) !== -1;}).slice(0,3).join(" | ")) : res.out.split("\n").slice(-15).join(" | ") });
  } finally {
    fs.writeFileSync(abs, original);
    const restoredHash = sha256(fs.readFileSync(abs));
    if (restoredHash !== originalHash) throw new Error("RESTORE FAILED for " + relPath + " - hash mismatch after restore!");
    if (!gitDiffEmpty(relPath)) throw new Error("RESTORE FAILED for " + relPath + " - git diff not empty after restore!");
  }
}

// RULE 2 - coverage: duplicate the exact iframe line so two embeds exist.
inject(
  "RULE 2 coverage (duplicate embed)",
  "modules/service/pages/contraception-riddings-timperley.html",
  function (src) {
    const m = src.match(/<iframe class="map"[^>]*><\/iframe>/);
    if (!m) throw new Error("could not find map iframe to duplicate");
    return src.replace(m[0], m[0] + m[0]);
  },
  "expected exactly 1"
);

// RULE 3 - the address: change map query AND contact card together to a
// different (but internally self-consistent) address, so RULE 4 agreement
// still holds and only RULE 3 fires.
inject(
  "RULE 3 the address (self-consistent wrong address)",
  "modules/service/pages/impetigo-treatment-riddings-timperley.html",
  function (src) {
    const wrongAddr = "150 Marsh Lane, Bootle, Liverpool, L20 9HH"; // Smartts Chemist Bootle's address
    const wrongQuery = encodeURIComponent(wrongAddr);
    let out = src.replace(
      /(<div class="contact-line"><p>)[^<]*(<\/p><\/div>)/,
      "$1" + wrongAddr + "$2"
    );
    out = out.replace(
      /(<iframe class="map" src="https:\/\/www\.google\.com\/maps\?q=)[^&]*(&output=embed"[^>]*><\/iframe>)/,
      "$1" + wrongQuery + "$2"
    );
    return out;
  },
  "map points at"
);

// RULE 4 - agreement: change ONLY the contact card text, leave the map
// query pointing at the correct branches.json address.
inject(
  "RULE 4 agreement (contact card diverges from map)",
  "modules/service/pages/earache-treatment-riddings-timperley.html",
  function (src) {
    // Wrong street, but the branch's OWN real postcode (WA15 6BP), so this
    // does not introduce a fresh postcode-shaped string check-postcodes.js
    // has never seen (that would be a self-inflicted false alarm of exactly
    // the shape the tenth pass already logged and fixed once for this item).
    return src.replace(
      /(<div class="contact-line"><p>)[^<]*(<\/p><\/div>)/,
      "$1" + "1 Fake Street, Timperley, Altrincham, WA15 6BP" + "$2"
    );
  },
  "contact card reads"
);

// RULE 5 - encoding: inject a raw comma into the map query.
inject(
  "RULE 5 encoding (raw comma in query)",
  "modules/service/pages/insect-bite-treatment-riddings-timperley.html",
  function (src) {
    return src.replace(
      /(<iframe class="map" src="https:\/\/www\.google\.com\/maps\?q=)([^&]*)(&output=embed"[^>]*><\/iframe>)/,
      function (whole, pre, q, post) {
        return pre + q + "," + post;
      }
    );
  },
  "raw space or comma"
);

console.log("\nINJECTION RESULTS:");
results.forEach(function (r) {
  console.log("  " + (r.caught ? "CAUGHT" : "MISSED") + "  " + r.label + " (" + r.file + ") exit " + r.code);
  if (!r.caught) console.log("    " + r.sample);
});

const allCaught = results.every(function (r) { return r.caught; });

// Final sanity: checker clean again after every restore.
const final = runChecker();
console.log("\nFINAL RE-RUN after all restores: exit " + final.code);
if (final.code !== 0) throw new Error("Checker not clean after restores - a restore may be incomplete: " + final.out);

// RULE 6 (directions) - structural applicability check for this branch.
const branchPagesDir = path.join(REPO, "modules", "branch", "pages");
const hasRiddingsLanding = fs.existsSync(branchPagesDir) &&
  fs.readdirSync(branchPagesDir).some(function (f) { return f.indexOf("riddings") !== -1; });
console.log("\nRULE 6 (directions button) structural check: modules/branch/pages "
  + (hasRiddingsLanding ? "DOES" : "does NOT") + " contain a Riddings landing page - rule "
  + (hasRiddingsLanding ? "applies and should be tested." : "is structurally inapplicable to this branch, consistent with the ninth-pass finding for check-opening-hours."));

// RULE 1 (generators) - not branch-specific (it inspects generator SOURCE,
// not any branch's output), so not injection-tested per-branch here;
// independently re-derived instead: every one of the six generators must
// join streetAddress/addressLocality/postalCode and pass the result through
// encodeURIComponent.
const GEN_DIR = path.join(REPO, "tools");
const GENERATORS = [
  "build-service-pages.js", "build-switch-pages.js", "build-weight-loss-pages.js",
  "build-travel-clinic-pages.js", "build-contraception-pages.js", "build-branch-landing-pages.js"
];
let rule1ok = true;
GENERATORS.forEach(function (g) {
  const src = fs.readFileSync(path.join(GEN_DIR, g), "utf8");
  const joins = /\[\s*b\.streetAddress\s*,\s*b\.addressLocality\s*,\s*b\.postalCode\s*\]/.test(src);
  const encodes = /encodeURIComponent\s*\(\s*(?:fullAddr\s*\(\s*b\s*\)|fullAddress)\s*\)/.test(src);
  console.log("  RULE 1 " + g + ": joins=" + joins + " encodes=" + encodes);
  if (!joins || !encodes) rule1ok = false;
});

console.log("\n=== SUMMARY ===");
console.log("Injections: " + results.filter(function(r){return r.caught;}).length + "/" + results.length + " caught first attempt.");
console.log("RULE 1 (generators, estate-wide, not branch-specific): " + (rule1ok ? "OK, all six generators compose correctly." : "PROBLEM."));
console.log("RULE 6 (directions): " + (hasRiddingsLanding ? "applicable, needs testing" : "structurally inapplicable to Riddings (no landing page)."));
console.log(allCaught && rule1ok ? "RESULT: PASS - all applicable rules proven, no in-repo defect." : "RESULT: FAIL - see above.");
process.exit(allCaught && rule1ok ? 0 : 1);
