/*
  Item 5.2 quality pass (eleventh), 2026-09-05. Unattended scheduled run.

  Fresh angle: ten prior passes on item 5.2 (2026-08-09 build through
  2026-09-04 tenth) have proven check-address-region.js (serviceAreaList
  ordering), check-pharmacy-first-eligibility.js rule 9 (the 40-and-over
  cohort), check-seo-keywords.js and check-brand-spelling.js against these
  six branch landing pages by injection, plus two custom (non-tools/)
  instruments covering JSON-LD/data-branch/app-membership and the NAP/map/
  directions surfaces. Not one of the ten passes ever mentions
  tools/check-weight-loss-copy.js, even though its own RULE 11 exists
  specifically for these six pages: "the six branch landing pages in
  modules/branch/pages, which are Regime 1 rather than Regime 2 and were
  read by none of the ten rules above" (the ten rules being 1-10, which read
  modules/service/pages only). RULE 11 is also the single most
  compliance-sensitive rule touching this item's pages, since
  AI\RBH_WeightLoss_Advertising_Standards.md treats a page a Google Business
  Profile links to (which is what all six of these pages are, per every
  gbp-packs/*.md "website" field) as near-total prohibition rather than the
  looser inner-page regime the fifteen weight-loss-clinic-*.html pages sit
  in. All 36 checkers passing every prior pass has always covered these six
  pages' RULE 11 result, but no pass has proved BY INJECTION that RULE 11
  actually catches a regression on one of them, as distinct from having
  never seen one.

  Method, same discipline as the ninth pass on this item (check-seo-keywords)
  and the tenth (check-brand-spelling): refuse to run if any target page
  already carries a git diff, record each target's sha256 before any
  mutation, mutate the real tracked file, capture the real checker's
  subprocess output and exit code, restore by direct fs.writeFileSync
  IMMEDIATELY after capturing output and BEFORE any assertion runs,
  sha256-verify byte-identical restoration before the next injection and
  again at the very end. Each injection targets a freshly restored page, not
  a previously mutated one, and (unlike the ninth pass, which used one
  target file for all seven injections) this round spreads across five of
  the six pages plus one repeat, so the whole item's own page set is
  exercised rather than one branch standing in for all six.

  Eight injections, one per distinct failure path RULE 11 holds:
    1. Fishlocks Ainsdale   - medicine name in an anchor's title attribute
                              (hover text/small print, not visible copy)
    2. Fishlocks Eccleston  - POM class, self-scoping ("skinny jab")
    3. McCanns Aigburth     - purchase wording ("Add to Basket")
    4. McCanns Sandringham  - POM class, in-context ("weekly injections")
    5. Scorah Bramhall      - rate-of-loss-within-a-period claim
    6. Scorah Hazel Grove   - offer/discount wording
    7. Fishlocks Ainsdale   - efficacy/results claim (second injection,
                              fully restored from injection 1 first)
    8. McCanns Aigburth     - positive floor: tile loses the word
                              "consultation" (second injection, fully
                              restored from injection 3 first)

  Run: node verify-5.2-2026-09-05-eleventh.js
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = "/sessions/adoring-magical-bohr/mnt/rbh-site-data";
const DIR = path.join(REPO, "modules", "branch", "pages");
const CHECKER = path.join(REPO, "tools", "check-weight-loss-copy.js");

function sha256(s) { return crypto.createHash("sha256").update(s).digest("hex"); }

function runChecker() {
  try {
    const out = execFileSync("node", [CHECKER], { cwd: REPO, encoding: "utf8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function gitDiffFor(relPath) {
  return execFileSync("git", ["status", "--porcelain", "--", relPath], { cwd: REPO, encoding: "utf8" }).trim();
}

const files = {
  ainsdale: path.join(DIR, "pharmacy-fishlocks-ainsdale.html"),
  eccleston: path.join(DIR, "pharmacy-fishlocks-eccleston.html"),
  aigburth: path.join(DIR, "pharmacy-mccanns-aigburth.html"),
  sandringham: path.join(DIR, "pharmacy-mccanns-sandringham.html"),
  bramhall: path.join(DIR, "pharmacy-scorah-bramhall.html"),
  hazelgrove: path.join(DIR, "pharmacy-scorah-hazel-grove.html")
};

const originals = {};
for (const key in files) {
  const rel = path.relative(REPO, files[key]).replace(/\\/g, "/");
  const diff = gitDiffFor(rel);
  if (diff) {
    console.error("REFUSING TO RUN: " + rel + " already carries an uncommitted diff:\n" + diff);
    process.exit(2);
  }
  originals[key] = fs.readFileSync(files[key], "utf8");
}
console.log("Baseline: all 6 target pages confirmed clean (no git diff) before any mutation.");

function restore(key) {
  fs.writeFileSync(files[key], originals[key]);
  const now = sha256(fs.readFileSync(files[key], "utf8"));
  const want = sha256(originals[key]);
  if (now !== want) {
    console.error("FATAL: restoration of " + key + " did not reproduce the original byte-for-byte.");
    process.exit(3);
  }
  const rel = path.relative(REPO, files[key]).replace(/\\/g, "/");
  const diff = gitDiffFor(rel);
  if (diff) {
    console.error("FATAL: " + rel + " still shows a git diff after restoration:\n" + diff);
    process.exit(3);
  }
}

function mustReplace(content, find, replacement, label) {
  if (content.indexOf(find) === -1) {
    console.error("REFUSING TO RUN: expected string not found verbatim for " + label + ":\n" + find);
    process.exit(2);
  }
  return content.replace(find, replacement);
}

const injections = [
  {
    name: "1. Fishlocks Ainsdale - medicine name in a title attribute (hover text)",
    key: "ainsdale",
    apply: function () {
      const find = 'target="_blank" rel="noopener" class="btn-pill btn-white"><span>Get directions</span></a>';
      const rep = 'target="_blank" rel="noopener" title="Ask about Mounjaro availability" class="btn-pill btn-white"><span>Get directions</span></a>';
      return mustReplace(originals.ainsdale, find, rep, "ainsdale medicine-in-attribute");
    },
    expectSnippet: 'names "mounjaro"'
  },
  {
    name: "2. Fishlocks Eccleston - POM class, self-scoping (skinny jab)",
    key: "eccleston",
    apply: function () {
      const find = "and private weight loss and travel clinics. Call in, phone us or book online.";
      const rep = "and private weight loss (including our skinny jab clinic) and travel clinics. Call in, phone us or book online.";
      return mustReplace(originals.eccleston, find, rep, "eccleston skinny jab");
    },
    expectSnippet: 'the phrase "skinny jab"'
  },
  {
    name: "3. McCanns Aigburth - purchase wording (Add to Basket)",
    key: "aigburth",
    apply: function () {
      const find = "<span>Private weight loss support with our pharmacy team. Book a consultation to find out more.</span>";
      const rep = "<span>Private weight loss support with our pharmacy team. Add to Basket for your consultation.</span>";
      return mustReplace(originals.aigburth, find, rep, "aigburth add to basket");
    },
    expectSnippet: '"Add to Basket"'
  },
  {
    name: "4. McCanns Sandringham - POM class, in-context (weekly injections)",
    key: "sandringham",
    apply: function () {
      const find = "and private weight loss and travel clinics. Call in, phone us or book online.";
      const rep = "and private weight loss and travel clinics, now offering weekly injections. Call in, phone us or book online.";
      return mustReplace(originals.sandringham, find, rep, "sandringham weekly injections");
    },
    expectSnippet: "a weekly injectable"
  },
  {
    name: "5. Scorah Bramhall - rate-of-loss-within-a-period claim",
    key: "bramhall",
    apply: function () {
      const find = '<p class="hero-sub">Scorah Chemists Bramhall serves Bramhall, Cheadle Hulme, Hazel Grove, Handforth and Poynton with NHS prescriptions, the free NHS Pharmacy First service, and private weight loss and travel clinics. Call in, phone us or book online.</p>';
      const rep = '<p class="hero-sub">Scorah Chemists Bramhall serves Bramhall, Cheadle Hulme, Hazel Grove, Handforth and Poynton with NHS prescriptions, the free NHS Pharmacy First service, and private weight loss and travel clinics. Call in, phone us or book online. Weight loss patients often lose two stone in just 8 weeks.</p>';
      return mustReplace(originals.bramhall, find, rep, "bramhall rate claim");
    },
    expectSnippet: "an amount of weight within a stated period"
  },
  {
    name: "6. Scorah Hazel Grove - offer/discount wording",
    key: "hazelgrove",
    apply: function () {
      const find = '<p class="hero-sub">Scorah Chemists Hazel Grove serves Hazel Grove, Bramhall, Offerton, Great Moor and Poynton with NHS prescriptions, the free NHS Pharmacy First service, and private weight loss and travel clinics. Call in, phone us or book online.</p>';
      const rep = '<p class="hero-sub">Scorah Chemists Hazel Grove serves Hazel Grove, Bramhall, Offerton, Great Moor and Poynton with NHS prescriptions, the free NHS Pharmacy First service, and private weight loss and travel clinics. Call in, phone us or book online. Weight loss consultations have a special offer this month.</p>';
      return mustReplace(originals.hazelgrove, find, rep, "hazel grove special offer");
    },
    expectSnippet: "a special offer"
  },
  {
    name: "7. Fishlocks Ainsdale (second injection, freshly restored) - efficacy/results claim",
    key: "ainsdale",
    apply: function () {
      const find = '<p class="hero-sub">Fishlocks Chemist Ainsdale serves Ainsdale, Birkdale and Southport with NHS prescriptions, the free NHS Pharmacy First service, and private weight loss and travel clinics. Call in, phone us or book online.</p>';
      const rep = '<p class="hero-sub">Fishlocks Chemist Ainsdale serves Ainsdale, Birkdale and Southport with NHS prescriptions, the free NHS Pharmacy First service, and private weight loss and travel clinics. Call in, phone us or book online. Our weight loss clinic delivers results for every patient.</p>';
      return mustReplace(originals.ainsdale, find, rep, "ainsdale delivers results");
    },
    expectSnippet: "promises results"
  },
  {
    name: "8. McCanns Aigburth (second injection, freshly restored) - positive floor, tile loses \"consultation\"",
    key: "aigburth",
    apply: function () {
      const find = "<strong>Weight loss clinic</strong>\n          <span>Private weight loss support with our pharmacy team. Book a consultation to find out more.</span>";
      const rep = "<strong>Weight loss clinic</strong>\n          <span>Private weight loss support with our pharmacy team. Learn more today.</span>";
      return mustReplace(originals.aigburth, find, rep, "aigburth tile no consultation");
    },
    expectSnippet: "never calls the service a consultation"
  }
];

let passCount = 0;
const results = [];

injections.forEach(function (inj, i) {
  const mutated = inj.apply();
  fs.writeFileSync(files[inj.key], mutated);
  const res = runChecker();
  restore(inj.key);

  const caught = res.code !== 0 && res.out.toLowerCase().indexOf(inj.expectSnippet.toLowerCase()) !== -1;
  results.push({ name: inj.name, caught: caught, exitCode: res.code });
  if (caught) {
    passCount++;
    console.log("[" + (i + 1) + "/" + injections.length + "] CAUGHT - " + inj.name);
  } else {
    console.log("[" + (i + 1) + "/" + injections.length + "] *** MISSED *** - " + inj.name);
    console.log("    exit code: " + res.code);
    console.log("    output:\n" + res.out.split("\n").map(function (l) { return "      " + l; }).join("\n"));
  }
});

// Final restoration check across all six files, independent of the
// per-injection checks above.
console.log("");
let allClean = true;
for (const key in files) {
  const rel = path.relative(REPO, files[key]).replace(/\\/g, "/");
  const finalSha = sha256(fs.readFileSync(files[key], "utf8"));
  const wantSha = sha256(originals[key]);
  const diff = gitDiffFor(rel);
  const ok = finalSha === wantSha && !diff;
  if (!ok) allClean = false;
  console.log(rel + ": " + (ok ? "byte-identical, clean" : "*** MISMATCH OR DIRTY ***"));
}

console.log("");
console.log("SUMMARY: " + passCount + "/" + injections.length + " injections caught.");

if (passCount !== injections.length || !allClean) {
  console.log("RESULT: FAIL - see above.");
  process.exit(1);
}
console.log("RESULT: PASS - tools/check-weight-loss-copy.js RULE 11 proved by direct injection " +
  "against five of item 5.2's six branch landing pages (Fishlocks Ainsdale twice), covering the " +
  "medicine-name-in-attribute scan, both POM-class mechanisms (self-scoping and in-context), " +
  "purchase wording, a rate-of-loss claim, an offer/discount, an efficacy claim and the positive " +
  "consultation floor - the first time in eleven passes on this item that check-weight-loss-copy.js " +
  "has been exercised at all.");
