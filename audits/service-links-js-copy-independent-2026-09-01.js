/*
  service-links-js-copy-independent-2026-09-01.js

  Independent verification for the item 6.2 quality pass (fifth), 2026-09-01:
  tools/check-service-links.js's RULE 2 and RULE 3 now also scan
  modules/service/service.js and modules/switch/switch.js, because both files
  inject patient-facing copy into a page's DOM at runtime (see that file's
  header comment, "JS-INJECTED COPY"). This script re-checks the same two
  files with its own file list, its own medicine-name list and its own claim
  wording, sharing no code with tools/claim-patterns.js or tools/pom-names.js,
  so a bug or a narrow pattern in those shared lists cannot hide a real hit
  from both the checker and its own verification at once.

  Run:  node audits/service-links-js-copy-independent-2026-09-01.js
*/
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const FILES = [
  path.join(REPO, "modules", "service", "service.js"),
  path.join(REPO, "modules", "switch", "switch.js")
];

// Own, independently-typed list of the medicine names relevant to this
// estate's five POM-name groups (weight loss, Pharmacy First, contraception,
// travel vaccines, antimalarials), not read from tools/pom-names.js.
const MEDICINES = [
  "mounjaro", "wegovy", "ozempic", "saxenda", "orlistat", "xenical",
  "rybelsus", "trulicity", "victoza", "tirzepatide", "semaglutide",
  "liraglutide", "phentermine", "alli",
  "flucloxacillin", "clarithromycin", "nitrofurantoin", "trimethoprim",
  "phenoxymethylpenicillin", "chloramphenicol", "fusidic acid",
  "desogestrel", "levonorgestrel", "ulipristal",
  "malarone", "doxycycline", "mefloquine", "atovaquone", "proguanil"
];

// Own, independently-worded set of results/efficacy phrases, not read from
// tools/claim-patterns.js.
const CLAIM_PHRASES = [
  /deliver(s|ed)? results/i,
  /guarantee/i,
  /lose up to/i,
  /\bfastest\b/i,
  /\bbest\b.{0,20}(treatment|clinic|service)/i,
  /proven results/i,
  /\d+%\s*(off|weight|body)/i
];

let hits = 0;
FILES.forEach(function (file) {
  if (!fs.existsSync(file)) {
    console.log("MISSING: " + file);
    hits++;
    return;
  }
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach(function (line, i) {
    const lower = line.toLowerCase();
    MEDICINES.forEach(function (m) {
      // word-boundary-ish check: not preceded/followed by a letter
      const re = new RegExp("(^|[^a-z])" + m.replace(/\s+/g, "\\s+") + "([^a-z]|$)", "i");
      if (re.test(lower)) {
        hits++;
        console.log("MEDICINE HIT " + path.relative(REPO, file) + ":" + (i + 1) + " [" + m + "] " + line.trim().slice(0, 150));
      }
    });
    CLAIM_PHRASES.forEach(function (re) {
      if (re.test(line)) {
        hits++;
        console.log("CLAIM HIT " + path.relative(REPO, file) + ":" + (i + 1) + " " + line.trim().slice(0, 150));
      }
    });
  });
});

console.log("");
console.log("service-links-js-copy-independent: " + FILES.length + " file(s) scanned, " + hits + " hit(s).");
process.exit(hits ? 1 : 0);
