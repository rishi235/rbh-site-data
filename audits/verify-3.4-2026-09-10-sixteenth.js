// Item 3.4 quality pass (sixteenth), 2026-09-10.
// Proves tools/check-seo-keywords.js by direct injection against Cherry Lane
// Pharmacy's own paste sheets for the first time. Fifteen prior passes on
// this item proved, by injection against Cherry Lane's own pages and paste
// sheets, check-nap.js, check-postcodes.js, check-em-dashes.js,
// check-whatsapp-route.js, check-service-links.js, check-switch-copy.js,
// check-branch-identity.js, check-booking-routes.js, check-seo-pattern.js,
// check-jsonld.js and check-map-embeds.js. A grep of this item's entire
// section for "check-seo-keywords" (allowing for markdown line-wrap) returns
// zero hits before this run.
//
// check-seo-keywords.js is the checker for the fourth Weebly SEO field, Meta
// Keywords, which no other checker's CONTENT rule reaches (check-em-dashes
// only ever asked whether the line held a dash). Cherry Lane's 12 pages carry
// 12 Meta Keywords lines across four paste sheets: modules/service/pages/
// SEO.md (8 blocks: overview + 7 Pharmacy First conditions),
// CONTRACEPTION-SEO.md, TRAVEL-CLINIC-SEO.md, WEIGHT-LOSS-SEO.md and
// modules/switch/pages/SEO.md.
//
// Discipline matches the fifteen prior injection instruments on this item: no
// import from tools/ beyond invoking the real checker as a child process,
// refuses to run if any target already carries a git diff, records every
// target's sha256 before mutation, restores by direct fs.writeFileSync from
// an in-memory Buffer immediately after capturing the checker's output and
// before any assertion, sha256-reconfirms after every restore.
//
// Rule 8 (retired town word) is not exercised here: it only ever fires for a
// branch whose townSlug no longer spells its own seoTown, and Cherry Lane's
// townSlug ("walton") and seoTown ("Walton") are the same word, so there is
// no orphaned word to inject against on this branch. McCanns Sandringham is
// the one branch in the estate where that rule bites (item 5.7's own
// retained townSlug); testing rule 8 belongs there, not here, and is already
// covered by check-seo-keywords.js's own header note.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const CHECKER = path.join(REPO, "tools", "check-seo-keywords.js");

function sha(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function gitDiffEmpty(relPath) {
  const out = execFileSync("git", ["status", "--porcelain", "--", relPath], { cwd: REPO }).toString();
  return out.trim() === "";
}

function runChecker() {
  try {
    const out = execFileSync("node", [CHECKER], { cwd: REPO }).toString();
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "").toString() + (e.stderr || "").toString() };
  }
}

const targets = [
  "modules/service/pages/SEO.md",
  "modules/service/pages/WEIGHT-LOSS-SEO.md"
];

console.log("=== PRECONDITION: refuse to run if any target already carries a diff ===");
targets.forEach(function (t) {
  if (!gitDiffEmpty(t)) {
    console.error("REFUSING: " + t + " already has a git diff");
    process.exit(2);
  }
  console.log("  clean: " + t);
});

const baselineBuf = {};
const baselineSha = {};
targets.forEach(function (t) {
  const p = path.join(REPO, t);
  baselineBuf[t] = fs.readFileSync(p);
  baselineSha[t] = sha(baselineBuf[t]);
});

console.log("");
console.log("=== BASELINE: check-seo-keywords.js on the clean tree ===");
const base = runChecker();
console.log("exit " + base.code);
if (base.code !== 0) { console.error("Baseline is not clean, aborting."); console.error(base.out); process.exit(3); }

function inject(label, target, mutateFn, expectFragment) {
  console.log("");
  console.log("=== INJECTION: " + label + " (" + target + ") ===");
  const p = path.join(REPO, target);
  const original = baselineBuf[target].toString("utf8");
  const mutated = mutateFn(original);
  if (mutated === original) {
    console.error("MUTATION NO-OP for " + label + " - test authoring error");
    process.exit(4);
  }
  fs.writeFileSync(p, mutated, "utf8");
  const result = runChecker();
  // restore immediately, before any assertion
  fs.writeFileSync(p, baselineBuf[target]);
  const restoredSha = sha(fs.readFileSync(p));
  const restoredOk = restoredSha === baselineSha[target];
  console.log("  checker exit: " + result.code + " (expect 1)");
  const caught = result.code === 1 && result.out.indexOf(expectFragment) !== -1;
  console.log("  caught expected fragment '" + expectFragment + "': " + caught);
  console.log("  restored byte-identical: " + restoredOk);
  if (!caught || !restoredOk) {
    console.error("FAIL on " + label);
    console.error(result.out);
    process.exit(5);
  }
  return true;
}

// (1) RULE 1, pairing - blank the Meta Keywords value on the Overview block,
// the first Cherry Lane block in the sheet.
inject(
  "RULE 1 pairing - Overview block's Meta Keywords blanked",
  "modules/service/pages/SEO.md",
  function (src) {
    const re = /(## Cherry Lane Pharmacy — Walton — Overview\n[\s\S]*?- \*\*Meta Keywords:\*\* )Pharmacy First Walton, NHS Pharmacy First, Cherry Lane Pharmacy, pharmacy Walton, L4/;
    if (!re.test(src)) throw new Error("expected Overview Meta Keywords line not found");
    return src.replace(re, "$1");
  },
  "no Meta Keywords value"
);

// (2) RULE 2, resolution - corrupt the UTI block's Page Permalink so it no
// longer ends in any live branch's <brandSlug>-<townSlug>.
inject(
  "RULE 2 resolution - UTI block's Page Permalink corrupted",
  "modules/service/pages/SEO.md",
  function (src) {
    const re = /(## Cherry Lane Pharmacy — Walton — UTI\n- \*\*Page Title:\*\*[^\n]*\n- \*\*Page Permalink:\*\* )uti-treatment-cherry-lane-walton/;
    if (!re.test(src)) throw new Error("expected UTI Page Permalink line not found");
    return src.replace(re, "$1uti-treatment-cherry-lane-nowhereville");
  },
  "does not end in any live branch"
);

// (3) RULE 3, presence - Sore throat block's keywords lose the word Walton
// entirely, replaced with an unrelated word that names no town at all.
inject(
  "RULE 3 presence - Sore throat block's keywords drop Walton",
  "modules/service/pages/SEO.md",
  function (src) {
    const re = /(## Cherry Lane Pharmacy — Walton — Sore throat\n[\s\S]*?- \*\*Meta Keywords:\*\* )Sore throat Walton, Sore throat treatment Walton, Pharmacy First Walton, pharmacy Walton, L4/;
    if (!re.test(src)) throw new Error("expected Sore throat Meta Keywords line not found");
    return src.replace(re, "$1Sore throat clinic, Sore throat treatment clinic, Pharmacy First service, local pharmacy, L4");
  },
  "do not carry this branch's own seoTown"
);

// (4) RULE 4, absence - Sinusitis block's keywords gain "Bootle", the seoTown
// of Smartts Chemist and SK Chemists, neither of which Cherry Lane's own
// serviceAreaList (Liverpool, Walton, Everton) names.
inject(
  "RULE 4 absence - Sinusitis block's keywords gain Bootle",
  "modules/service/pages/SEO.md",
  function (src) {
    const re = /(## Cherry Lane Pharmacy — Walton — Sinusitis\n[\s\S]*?- \*\*Meta Keywords:\*\* )Sinusitis Walton, Sinusitis treatment Walton, Pharmacy First Walton, pharmacy Walton, L4/;
    if (!re.test(src)) throw new Error("expected Sinusitis Meta Keywords line not found");
    return src.replace(re, "$1Sinusitis Walton, Sinusitis treatment Walton, Pharmacy First Walton, pharmacy Walton and Bootle, L4");
  },
  "is not in this branch's serviceAreaList"
);

// (5) RULE 5, brand - Earache block's keywords gain "Smartts Chemist", a
// different live branch's brandLabel.
inject(
  "RULE 5 brand - Earache block's keywords gain Smartts Chemist",
  "modules/service/pages/SEO.md",
  function (src) {
    const re = /(## Cherry Lane Pharmacy — Walton — Earache\n[\s\S]*?- \*\*Meta Keywords:\*\* )Earache Walton, Earache treatment Walton, Pharmacy First Walton, pharmacy Walton, L4/;
    if (!re.test(src)) throw new Error("expected Earache Meta Keywords line not found");
    return src.replace(re, "$1Earache Walton, Earache treatment Walton, Pharmacy First Walton, Smartts Chemist, pharmacy Walton, L4");
  },
  "which is the brand of"
);

// (6) RULE 6, postcode - Impetigo block's keywords gain "L20", Smartts
// Chemist and SK Chemists' own outward code, not Cherry Lane's L4.
inject(
  "RULE 6 postcode - Impetigo block's keywords gain L20",
  "modules/service/pages/SEO.md",
  function (src) {
    const re = /(## Cherry Lane Pharmacy — Walton — Impetigo\n[\s\S]*?- \*\*Meta Keywords:\*\* )Impetigo Walton, Impetigo treatment Walton, Pharmacy First Walton, pharmacy Walton, L4/;
    if (!re.test(src)) throw new Error("expected Impetigo Meta Keywords line not found");
    return src.replace(re, "$1Impetigo Walton, Impetigo treatment Walton, Pharmacy First Walton, pharmacy Walton, L4, L20");
  },
  "is not this branch's outward code"
);

// (7) RULE 7, claim - the weight loss block's keywords gain "rapid weight
// loss Walton", the exact shape CLAUDE.md's own check-seo-keywords.js header
// names as the reason this rule exists ("rapid weight loss Bootle").
inject(
  "RULE 7 claim - weight loss block's keywords gain 'rapid weight loss'",
  "modules/service/pages/WEIGHT-LOSS-SEO.md",
  function (src) {
    const re = /(## Cherry Lane Pharmacy — Walton\n[\s\S]*?- \*\*Meta Keywords:\*\* )weight loss clinic Walton, medicated weight loss Walton, Cherry Lane Pharmacy, pharmacy Walton/;
    if (!re.test(src)) throw new Error("expected weight loss Meta Keywords line not found");
    return src.replace(re, "$1weight loss clinic Walton, rapid weight loss Walton, Cherry Lane Pharmacy, pharmacy Walton");
  },
  "Efficacy and results wording is not"
);

console.log("");
console.log("=== FINAL: check-seo-keywords.js re-run after all restores ===");
const fin = runChecker();
console.log("exit " + fin.code);
if (fin.code !== 0) { console.error("Final run not clean"); console.error(fin.out); process.exit(6); }

console.log("");
console.log("=== FINAL sha256 confirmation, both targets byte-identical to baseline ===");
targets.forEach(function (t) {
  const now = sha(fs.readFileSync(path.join(REPO, t)));
  const ok = now === baselineSha[t];
  console.log("  " + t + ": " + (ok ? "OK" : "MISMATCH"));
  if (!ok) process.exit(7);
});

console.log("");
console.log("ALL PASSED: 7/7 injections (rules 1-7) caught by check-seo-keywords.js on first attempt, all targets restored byte-identical. Rule 8 not applicable to Cherry Lane (townSlug equals seoTown, no orphaned word to inject against).");
