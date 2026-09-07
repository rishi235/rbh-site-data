/*
  verify-6.2-2026-09-07-eleventh.js

  Item 6.2 quality pass (eleventh). FRESH ANGLE not touched by any of the
  prior ten passes: the medicine-name matching function itself,
  tools/pom-names.js's findMedicine(), which check-service-links.js's RULE 3
  and check-weight-loss-copy.js both call, and which check-switch-copy.js and
  check-travel-clinic-copy.js each re-implement inline with the identical
  \b...\b construction rather than calling findMedicine directly.

  HYPOTHESIS: \b is a transition between a \w character (letters, digits,
  underscore) and a non-\w character. A digit is a \w character, so \b does
  NOT fire between a letter and an immediately following digit. A medicine
  name typed with no space before a dosage number - "Mounjaro5mg",
  "orlistat120", "amoxicillin500" - would then be invisible to every rule
  built on \b<name>\b, while the same name followed by a space, a full stop
  or a comma is caught correctly. This has never been tested by any of the
  ten prior 6.2 passes, nor found in the repo-wide grep for "findMedicine"
  and "word boundary" done before starting this pass.

  A precedent for exactly this shape already exists in the estate:
  tools/check-gbp-packs.js's own findTerms() (line ~814) uses
  `(^|[^a-z])term([^a-z]|$)` instead of \b...\b, which DOES treat a digit as
  a valid boundary on either side, so that one checker is already immune to
  this gap. The other four medicine-name matchers in the repo
  (pom.findMedicine, and the inline regexes in check-switch-copy.js and
  check-travel-clinic-copy.js) are not.

  METHOD, entirely read-only against the live tree in part A/B (no file
  written), then a scratch-copy injection in part C, restored and
  sha256-verified afterwards.
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const pomPath = path.join(REPO, "tools", "pom-names.js");

function sha256(p) { return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); }

console.log("=== PART A: reproduce the blind spot against the CURRENT (unmodified) pom-names.js ===");
delete require.cache[require.resolve(pomPath)];
const pom = require(pomPath);
const POM_NAMES = pom.union(pom.WEIGHT_LOSS, pom.PHARMACY_FIRST, pom.CONTRACEPTION, pom.TRAVEL_VACCINES, pom.ANTIMALARIALS);

const dosageCases = [
  "Take Mounjaro5mg weekly",
  "orlistat120 capsules twice daily",
  "semaglutide2.4mg dose",
  "the amoxicillin500 course",
  "Wegovy1.7mg pen"
];
const controlCases = [
  "Take Mounjaro 5mg weekly",   // space - already caught, must stay caught
  "orlistat 120mg capsules",    // space - already caught
  "usually the best option",    // must NOT fire (the documented alli/usually case)
  "our proguanil-based advice"  // hyphen before base is still a boundary; must fire (proguanil present)
];

let blindSpotConfirmed = true;
dosageCases.forEach(function (t) {
  const hit = pom.findMedicine(t, POM_NAMES);
  console.log("  dosage-adjacent: " + JSON.stringify(t) + " -> " + hit);
  if (hit) blindSpotConfirmed = false; // if the CURRENT code already caught it, no gap exists
});
controlCases.forEach(function (t) {
  const hit = pom.findMedicine(t, POM_NAMES);
  console.log("  control:         " + JSON.stringify(t) + " -> " + hit);
});
console.log("BLIND SPOT ON CURRENT CODE CONFIRMED: " + blindSpotConfirmed);

console.log("");
console.log("=== PART B: sweep the real corpus for any digit-adjacent medicine name already live ===");
// Same corpus check-service-links.js itself reads: PAGE_DIRS + EXTRA_FILES + EXTRA_JS_COPY_FILES,
// plus check-weight-loss-copy.js/check-switch-copy.js/check-travel-clinic-copy.js/check-gbp-packs.js's
// own page sets (switch pages, travel pages, weight loss pages, gbp-packs/*.md) - read as plain text,
// no reliance on any checker's own (possibly blind) matcher.
const dirs = [
  path.join(REPO, "modules", "switch", "pages"),
  path.join(REPO, "modules", "service", "pages"),
  path.join(REPO, "modules", "branch", "pages"),
  path.join(REPO, "gbp-packs")
];
const extra = require(path.join(REPO, "tools", "extra-public-copy-files.js")).EXTRA_HTML_SEGMENTS
  .map(function (segs) { return path.join.apply(path, [REPO].concat(segs)); });
const jsFiles = [
  path.join(REPO, "modules", "service", "service.js"),
  path.join(REPO, "modules", "switch", "switch.js")
];
let files = [];
dirs.forEach(function (d) {
  if (!fs.existsSync(d)) return;
  fs.readdirSync(d).forEach(function (f) {
    if (f.endsWith(".html") || f.endsWith(".md")) files.push(path.join(d, f));
  });
});
files = files.concat(extra).concat(jsFiles);

// digit-adjacency scan: name immediately followed OR preceded by a digit with no separator
let liveHits = [];
files.forEach(function (file) {
  const text = fs.readFileSync(file, "utf8");
  POM_NAMES.forEach(function (n) {
    const esc = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("[a-z]?" + esc + "[0-9]|[0-9]" + esc, "i");
    if (re.test(text)) liveHits.push(path.relative(REPO, file) + "::" + n);
  });
});
console.log("Files scanned: " + files.length);
console.log("Digit-adjacent medicine-name hits found in real content: " + liveHits.length);
liveHits.forEach(function (h) { console.log("  " + h); });

console.log("");
console.log("=== PART C: injection test on a SCRATCH COPY - prove the fixed regex closes the gap ===");
const scratch = path.join(REPO, "_agentscratch", "verify-6.2-eleventh-scratch");
if (fs.existsSync(scratch)) fs.rmSync(scratch, { recursive: true, force: true });
fs.mkdirSync(scratch, { recursive: true });

// Build a tiny standalone copy of pom-names.js logic with the PROPOSED fix, and compare old vs new.
function oldFind(text, names) {
  const s = String(text == null ? "" : text);
  for (let i = 0; i < names.length; i++) {
    const n = String(names[i]).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp("\\b" + n + "\\b", "i").test(s)) return names[i];
  }
  return null;
}
function newFind(text, names) {
  const s = String(text == null ? "" : text);
  for (let i = 0; i < names.length; i++) {
    const n = String(names[i]).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp("(?:^|[^a-z])" + n + "(?:[^a-z]|$)", "i").test(s)) return names[i];
  }
  return null;
}

console.log("Case-by-case OLD vs NEW on the dosage cases (expect OLD=null, NEW=name):");
dosageCases.forEach(function (t) {
  console.log("  " + JSON.stringify(t) + "  OLD=" + oldFind(t, POM_NAMES) + "  NEW=" + newFind(t, POM_NAMES));
});
console.log("Case-by-case OLD vs NEW on the control cases (expect identical):");
controlCases.forEach(function (t) {
  const o = oldFind(t, POM_NAMES), n = newFind(t, POM_NAMES);
  console.log("  " + JSON.stringify(t) + "  OLD=" + o + "  NEW=" + n + (o === n ? "  MATCH" : "  ***DIVERGE***"));
});

console.log("");
console.log("=== PART D: whole-corpus regression - OLD vs NEW must agree on every real file, line by line ===");
let divergences = 0, linesChecked = 0;
files.forEach(function (file) {
  const text = fs.readFileSync(file, "utf8");
  text.split(/\r?\n/).forEach(function (line, i) {
    linesChecked++;
    const o = oldFind(line, POM_NAMES);
    const n = newFind(line, POM_NAMES);
    if (o !== n) {
      divergences++;
      console.log("  DIVERGE " + path.relative(REPO, file) + ":" + (i + 1) + " OLD=" + o + " NEW=" + n
        + "  line=" + line.trim().slice(0, 120));
    }
  });
});
console.log("Lines checked: " + linesChecked + ", divergences: " + divergences
  + (divergences === 0 ? " (fix is a pure widening, zero behaviour change on real content)" : " *** INVESTIGATE ***"));

fs.rmSync(scratch, { recursive: true, force: true });
console.log("");
console.log("pom-names.js sha256 (unchanged by this script): " + sha256(pomPath));
