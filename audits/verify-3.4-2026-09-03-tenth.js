/*
  audits/verify-3.4-2026-09-03-tenth.js

  Item 3.4 (Cherry Lane Pharmacy, Walton) - tenth quality pass, 2026-09-03.

  What the first nine passes already proved by injection against Cherry Lane's
  own pages: the postal-town paste-block fault (fourth), the weight loss
  Regime 1 paste-block rules (fifth), the one-label-per-block sheet rule
  (sixth), tools/check-whatsapp-route.js's data-wa rule on the weight-loss and
  UTI pages (seventh, eighth), and tools/check-nap.js /
  tools/check-postcodes.js / tools/check-em-dashes.js on the travel clinic
  page (ninth). Read against this item's full AGENT_WORKLIST.md history before
  choosing this pass's angle, to avoid repeating a proof already on record.

  What had never been tested directly against Cherry Lane's OWN switch page:
  tools/check-switch-copy.js's claim, town, form and collection-notice rules
  (rules 7, 8, 9, 10) and its banner-ownership rule (11a). Every prior
  injection against Cherry Lane's switch page targeted NAP/whatsapp/identity
  fields; nothing had mutated the switch-specific copy rules on THIS branch's
  own page and banner file. check-switch-copy.js is read estate-wide (15
  pages), so Cherry Lane's page was passing by construction, not by anything
  this item's own history had exercised - the same "proved by construction,
  not by injection" gap the ninth pass closed for check-nap.js/
  check-postcodes.js/check-em-dashes.js on the travel clinic page.

  Method: read the two real tracked files, mutate one at a time from an
  in-memory original, run tools/check-switch-copy.js as a real subprocess,
  capture its output, restore by direct fs.writeFileSync BEFORE any assertion
  (so a thrown assertion can never leave a file mutated on disk), and
  sha256-verify both files identical to their pre-probe hashes at the end.
  Refuses to run if either target file already shows a git diff. No import
  from tools/ beyond invoking the checker as a subprocess.

  Run: node audits/verify-3.4-2026-09-03-tenth.js
*/
"use strict";

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var { execFileSync } = require("child_process");

var ROOT = path.join(__dirname, "..");
var PAGE = path.join(ROOT, "modules", "switch", "pages", "switch-prescriptions-cherry-lane-walton.html");
var BANNER = path.join(ROOT, "modules", "switch", "pages", "banners", "switch-prescriptions-cherry-lane-walton.txt");
var CHECKER = path.join(ROOT, "tools", "check-switch-copy.js");

function sha256(s) { return crypto.createHash("sha256").update(s, "utf8").digest("hex"); }

function gitDiffEmpty(file) {
  var out = execFileSync("git", ["diff", "--name-only", "--", file], { cwd: ROOT }).toString().trim();
  return out === "";
}

if (!gitDiffEmpty(PAGE) || !gitDiffEmpty(BANNER)) {
  console.error("REFUSING TO RUN: target file(s) already show an uncommitted git diff. " +
    "Commit or stash first so this probe's restore can be verified against a known-clean baseline.");
  process.exit(2);
}

var origPage = fs.readFileSync(PAGE, "utf8");
var origBanner = fs.readFileSync(BANNER, "utf8");
var pageHash = sha256(origPage);
var bannerHash = sha256(origBanner);

console.log("Baseline sha256 (page):   " + pageHash);
console.log("Baseline sha256 (banner): " + bannerHash);

function runChecker() {
  try {
    var out = execFileSync("node", [CHECKER], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, out: out.toString() };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "").toString() + (e.stderr || "").toString() };
  }
}

console.log("\n--- BASELINE RUN (before any injection) ---");
var base = runChecker();
console.log("exit " + base.code + (base.code === 0 ? " (OK, as expected)" : " -- UNEXPECTED, aborting"));
if (base.code !== 0) {
  console.log(base.out);
  process.exit(1);
}

var results = [];
function restore() {
  fs.writeFileSync(PAGE, origPage, "utf8");
  fs.writeFileSync(BANNER, origBanner, "utf8");
}

function inject(label, mutate, expectTag) {
  restore(); // always start from a known-clean baseline
  mutate();
  var r = runChecker();
  restore(); // restore BEFORE any assertion below, per the discipline this file states
  var pOk = sha256(fs.readFileSync(PAGE, "utf8")) === pageHash;
  var bOk = sha256(fs.readFileSync(BANNER, "utf8")) === bannerHash;
  var caught = r.code !== 0 && r.out.indexOf(expectTag) !== -1;
  results.push({ label: label, caught: caught, restoredClean: pOk && bOk, exit: r.code, tag: expectTag });
  console.log("\n--- " + label + " ---");
  console.log("expected tag: " + expectTag);
  console.log("checker exit: " + r.code + (caught ? "  CAUGHT (tag matched)" : "  NOT CAUGHT AS EXPECTED"));
  console.log("restored byte-identical: page=" + pOk + " banner=" + bOk);
  if (!caught) console.log(r.out);
}

// 1. RULE 7, no-medicines: name a POM in the hero-sub paragraph.
inject(
  "RULE 7 no-medicines (POM name inserted in hero-sub)",
  function () {
    var html = fs.readFileSync(PAGE, "utf8");
    var mutated = html.replace(
      "Switching your prescriptions to us is quick, free, and means your medication comes to a pharmacy team you can actually speak to.",
      "Switching your prescriptions to us is quick, free, and means your medication comes to a pharmacy team you can actually speak to. Ask us about Mounjaro."
    );
    if (mutated === html) throw new Error("anchor text not found - page has drifted from what this probe expects");
    fs.writeFileSync(PAGE, mutated, "utf8");
  },
  "[no-medicines]"
);

// 2. RULE 8, town: wrong town in the pill line.
inject(
  "RULE 8 town (pill line renamed to a foreign branch's town)",
  function () {
    var html = fs.readFileSync(PAGE, "utf8");
    var mutated = html.replace(
      '<span class="pill">Your local independent pharmacy in Walton</span>',
      '<span class="pill">Your local independent pharmacy in Bootle</span>'
    );
    if (mutated === html) throw new Error("anchor text not found - page has drifted from what this probe expects");
    fs.writeFileSync(PAGE, mutated, "utf8");
  },
  "[town]"
);

// 3. RULE 9, form-copy: add a field the generator's FIELD_WORDS does not know
//    and step 1 does not mention.
inject(
  "RULE 9 form-copy (undescribed postcode field added to form-grid)",
  function () {
    var html = fs.readFileSync(PAGE, "utf8");
    var mutated = html.replace(
      '<label class="full">Email (optional)<input type="email" name="email" autocomplete="email" placeholder="name@example.com"></label>\n            </div>',
      '<label class="full">Email (optional)<input type="email" name="email" autocomplete="email" placeholder="name@example.com"></label>\n              <label>Postcode<input type="text" name="postcode" autocomplete="postal-code"></label>\n            </div>'
    );
    if (mutated === html) throw new Error("anchor text not found - page has drifted from what this probe expects");
    fs.writeFileSync(PAGE, mutated, "utf8");
  },
  "[form-copy]"
);

// 4. RULE 10, collection-notice: delete the privacy sentence entirely.
inject(
  "RULE 10 collection-notice (privacy sentence removed)",
  function () {
    var html = fs.readFileSync(PAGE, "utf8");
    var mutated = html.replace(
      '<p class="privacy">We will only use your details to help process your switch request.</p>\n            ',
      ""
    );
    if (mutated === html) throw new Error("anchor text not found - page has drifted from what this probe expects");
    fs.writeFileSync(PAGE, mutated, "utf8");
  },
  "[collection-notice]"
);

// 5. RULE 11a, banner ownership: point Cherry Lane's own banner at another
//    branch's switch page. Cherry Lane is single-host (not one of the three
//    shared-domain sites), so this exercises 11a cleanly with no interaction
//    from the KNOWN-pinned 11b shared-host entries.
inject(
  "RULE 11a banner (SWITCH_URL repointed at another branch's switch page)",
  function () {
    var txt = fs.readFileSync(BANNER, "utf8");
    var mutated = txt.replace(
      'var SWITCH_URL = "/switch-prescriptions-cherry-lane-walton.html";',
      'var SWITCH_URL = "/switch-prescriptions-hirshmans-ainsdale.html";'
    );
    if (mutated === txt) throw new Error("anchor text not found - banner has drifted from what this probe expects");
    fs.writeFileSync(BANNER, mutated, "utf8");
  },
  "[banner]"
);

console.log("\n--- FINAL RESTORE CHECK ---");
restore();
var finalPageOk = sha256(fs.readFileSync(PAGE, "utf8")) === pageHash;
var finalBannerOk = sha256(fs.readFileSync(BANNER, "utf8")) === bannerHash;
console.log("page byte-identical to baseline:   " + finalPageOk);
console.log("banner byte-identical to baseline: " + finalBannerOk);

console.log("\n--- FINAL CHECKER RUN (must be clean) ---");
var finalRun = runChecker();
console.log("exit " + finalRun.code + (finalRun.code === 0 ? " (OK)" : " -- UNEXPECTED"));
if (finalRun.code !== 0) console.log(finalRun.out);

console.log("\n=== SUMMARY ===");
var allCaught = true, allRestored = finalPageOk && finalBannerOk;
results.forEach(function (r) {
  console.log((r.caught ? "CAUGHT   " : "MISSED   ") + r.label);
  if (!r.caught) allCaught = false;
  if (!r.restoredClean) allRestored = false;
});
console.log("\nAll " + results.length + " injections caught: " + allCaught);
console.log("All restores byte-identical throughout: " + allRestored);
console.log("Final tree byte-identical to baseline: " + (finalPageOk && finalBannerOk));

if (!allCaught || !allRestored || finalRun.code !== 0) {
  process.exit(1);
}
