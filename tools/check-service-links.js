/*
  check-service-links.js  (added 2026-08-10 on the item 3.7 quality pass, Q16)

  Two rules, both about what a generated page sends a patient towards and what
  it promises them on the way.

  Why it exists. The Smartts switch page is the only generated page in the
  estate carrying a hand-written services grid: six tiles with hardcoded URLs
  and hardcoded sales copy, sitting in tools/build-switch-pages.js since the
  page was first built. Nothing checked either half. The grid was found
  pointing at weight-loss-clinic-bootle.html, an old live-only page that names
  three prescription-only medicines and claims a percentage weight loss, while
  the repo has generated a compliant replacement (weight-loss-clinic-smartts-
  bootle.html) since Phase 3. The same tile described the clinic as "Support
  that delivers results", which is an efficacy claim on a weight loss service.

  Advertising prescription-only medicines to the public is not permitted, and
  the house rule on weight loss copy is no medicine names and no efficacy
  claims. A checker that only reads titles and headings cannot see either
  problem, because both live in a link target and a nine-word tile.

  What FAILS the run:
    - RULE 1, stale target: a generated page links to a page on one of our own
      branch domains that this repo does not generate. Either the repo owns the
      page and the link should point at the generated slug, or the page is
      live-only and nothing here can keep it correct. Both need saying out loud.
    - RULE 2, claim: efficacy or results-claim wording in visible page copy.

  What is only REPORTED, not failed:
    - links to pages on our domains that are listed in KNOWN below, each with a
      reason and a question id, same convention as KNOWN_DRIFT in
      check-cdn-pins.js and KNOWN in check-seo-lengths.js.

  A KNOWN entry that no longer triggers FAILS the run, so the list cannot rot
  once a question is answered and the fix lands.

  Run:  node tools/check-service-links.js
*/
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");

const PAGE_DIRS = [
  path.join(REPO, "modules", "switch", "pages"),
  path.join(REPO, "modules", "service", "pages"),
  path.join(REPO, "modules", "branch", "pages")
];

// Link targets on our own domains that this repo does not generate, accepted
// for now with a reason. Key is "<host><path>".
const KNOWN = {
  "www.smarttschemist.co.uk/weight-loss-clinic-bootle.html":
    "Q16: old live-only weight loss page naming Wegovy, Mounjaro and Orlistat with a 22.5% claim and a price. "
    + "The compliant replacement weight-loss-clinic-smartts-bootle.html is generated here but the tile still "
    + "points at the old page. Repointing it needs the new page pasted live first, so it is Rishi's call.",
  "www.smarttschemist.co.uk/pharmacy-first-service-bootle.html":
    "Q8/Q16: old live-only Pharmacy First page. Same class as the 11 GBP pack links held under item 5.3, which is "
    + "blocked because the repo change is tied to a Weebly paste.",
  "www.smarttschemist.co.uk/blood-testing.html":
    "Q16: live-only service page. Blood tests are not a branches.json widget, so no generator owns this page.",
  "www.smarttschemist.co.uk/vaccinations.html":
    "Q16: live-only service page, used by both the Vaccinations tile and the Travel Clinic tile. The repo does "
    + "generate travel-clinic-smartts-bootle.html, so the Travel Clinic tile has a generated page to point at.",
  "www.smarttschemist.co.uk/medical-cannabis.html":
    "Q16: live-only service page. No generator owns it; wording is held to eligibility only."
};

// Claim strings accepted for now with a reason, same convention as KNOWN.
// Key is "<relative file path>::<the offending phrase>".
const KNOWN_CLAIM = {
  "modules/switch/pages/switch-prescriptions-smartts-bootle.html::Support that delivers results.":
    "Q16: the Weight Loss Clinic tile on the Smartts switch page promises an outcome, which the house rule on "
    + "weight loss copy does not allow. It is hardcoded in the CONFIG block of tools/build-switch-pages.js and is "
    + "the only claim of its kind in the estate. Not rewritten autonomously because it is patient-facing "
    + "regulatory copy, which is Rishi's call; the replacement wording is offered in Q16."
};

// Results and efficacy wording. Deliberately narrow: it targets promises about
// outcome, not ordinary service description.
const CLAIM_PATTERNS = [
  [/delivers results/i, "promises results"],
  [/proven results/i, "promises results"],
  [/guaranteed results|results guaranteed/i, "guarantees results"],
  [/real results/i, "promises results"],
  [/lose up to/i, "quantified weight loss claim"],
  [/\d+(\.\d+)?\s*%\s*of your body/i, "quantified weight loss claim"],
  [/most effective (weight loss|treatment)/i, "comparative efficacy claim"],
  [/rapid weight loss|fast weight loss/i, "efficacy claim"],
  [/that actually works|treatment that works/i, "efficacy claim"]
];

function rel(p) { return path.relative(REPO, p).replace(/\\/g, "/"); }

// Blank out HTML comments, keeping line numbers intact, so build notes that
// discuss the rules are not read as breaches of them.
function blankComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, function (block) {
    return block.replace(/[^\n]/g, " ");
  });
}

const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));
const estateHosts = new Set();
data.branches.forEach(function (b) {
  if (b.disposed || !b.website) return;
  estateHosts.add(b.website.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase());
});

// Every page this repo generates, by filename.
const generated = new Set();
PAGE_DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).filter(function (f) { return f.endsWith(".html"); })
    .forEach(function (f) { generated.add(f.toLowerCase()); });
});

const failures = [];
const knownHits = {};
const knownClaimHits = {};
let pageCount = 0;
let linkCount = 0;
let estateLinkCount = 0;

PAGE_DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).filter(function (f) { return f.endsWith(".html"); }).forEach(function (f) {
    const file = path.join(dir, f);
    const visible = blankComments(fs.readFileSync(file, "utf8"));
    pageCount++;

    // RULE 1 - link targets
    const re = /href="(https?:)?\/\/([^\/"?#]+)\/([^"?#]*\.html)"/gi;
    let m;
    while ((m = re.exec(visible))) {
      linkCount++;
      const host = m[2].toLowerCase();
      const page = m[3].toLowerCase().replace(/^.*\//, "");
      if (!estateHosts.has(host)) continue;
      estateLinkCount++;
      if (generated.has(page)) continue;
      const key = host + "/" + m[3].toLowerCase();
      if (KNOWN[key]) { knownHits[key] = (knownHits[key] || 0) + 1; continue; }
      failures.push({
        file: rel(file),
        rule: "stale target",
        text: "links to " + key + ", which this repo does not generate"
      });
    }

    // RULE 2 - claims in visible copy
    visible.split(/\r?\n/).forEach(function (line, i) {
      // One report per line: a single sentence can trip two patterns at once
      // ("lose up to 22.5% of your body weight" trips both), and reporting it
      // twice makes the output read as two defects.
      const pair = CLAIM_PATTERNS.find(function (p) { return p[0].test(line); });
      if (!pair) return;
      const claimKey = Object.keys(KNOWN_CLAIM).find(function (k) {
        const parts = k.split("::");
        return parts[0] === rel(file) && line.indexOf(parts[1]) !== -1;
      });
      if (claimKey) { knownClaimHits[claimKey] = (knownClaimHits[claimKey] || 0) + 1; return; }
      failures.push({
        file: rel(file),
        rule: "claim",
        text: "line " + (i + 1) + " (" + pair[1] + "): " + line.trim().slice(0, 160)
      });
    });
  });
});

// A KNOWN entry that no longer fires means the fix landed; the entry must go.
const stale = Object.keys(KNOWN).filter(function (k) { return !knownHits[k]; })
  .concat(Object.keys(KNOWN_CLAIM).filter(function (k) { return !knownClaimHits[k]; }));

console.log("check-service-links");
console.log("  " + pageCount + " generated page(s), " + linkCount + " link(s), "
  + estateLinkCount + " of them to our own " + estateHosts.size + " branch domains");
Object.keys(knownHits).forEach(function (k) {
  console.log("  KNOWN " + k + " (" + knownHits[k] + " reference(s)): " + KNOWN[k]);
});
Object.keys(knownClaimHits).forEach(function (k) {
  console.log("  KNOWN CLAIM " + k.split("::")[1] + " in " + k.split("::")[0] + ": " + KNOWN_CLAIM[k]);
});

if (stale.length) {
  console.log("");
  console.log("FAILURES - KNOWN entries that no longer apply (remove them):");
  stale.forEach(function (k) { console.log("  FAIL  stale KNOWN key: " + k); });
}

if (failures.length) {
  console.log("");
  console.log("FAILURES (" + failures.length + "):");
  failures.forEach(function (f) {
    console.log("  FAIL  [" + f.rule + "] " + f.file + ": " + f.text);
  });
  console.log("");
  console.log("Fix at source in the generator, then regenerate. A tile that promises an");
  console.log("outcome, or points at a page this repo cannot keep compliant, is the two");
  console.log("ways a weight loss service ends up advertising what it must not.");
}

if (failures.length || stale.length) process.exit(1);

console.log("");
console.log("check-service-links: clean, "
  + (Object.keys(knownHits).length + Object.keys(knownClaimHits).length)
  + " known issue(s) awaiting a decision.");
