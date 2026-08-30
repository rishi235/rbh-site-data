/*
check-page-coverage.js

Read-only checker. Answers one question the other checkers cannot:
does the SET of generated pages match what branches.json says should exist?

check-nap.js, check-postcodes.js and check-seo-pattern.js all inspect the
pages that happen to be on disk. If a branch is added to branches.json and
nobody adds its id to the generators' hardcoded BUILD lists, no page is ever
written for it, so there is nothing for those checkers to find and they all
report a clean pass. The branch is simply absent. This checker closes that
gap: it derives the expected page set from branches.json alone, then compares
it both to the generators' driving lists and to the files on disk.

Run:  node tools/check-page-coverage.js [--verbose]
Exit: 0 clean, 1 on any failure. Warnings never fail the run.

Convention matches check-nap.js, check-postcodes.js, check-seo-pattern.js
and check-gbp-packs.js: read-only, no writes, no network.
*/

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const VERBOSE = process.argv.indexOf("--verbose") > -1;

const failures = [];
const warnings = [];
function fail(code, msg) { failures.push(code + ": " + msg); }
function warn(code, msg) { warnings.push(code + ": " + msg); }

const data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));
const allBranches = data.branches || [];
const live = allBranches.filter(function (b) { return !b.disposed; });
const disposed = allBranches.filter(function (b) { return b.disposed; });
const byId = {};
allBranches.forEach(function (b) { byId[b.id] = b; });

// --- read the generators' driving lists ------------------------------------
// Parsed from source rather than required, because requiring a generator runs
// it and writes files. A list that cannot be parsed is a failure, not a skip:
// silently checking nothing is the exact problem this tool exists to stop.

function genSource(file) {
  const p = path.join(ROOT, "tools", file);
  if (!fs.existsSync(p)) { fail("GENERATOR_MISSING", "tools/" + file + " does not exist"); return null; }
  return fs.readFileSync(p, "utf8");
}

function buildList(file) {
  const src = genSource(file);
  if (src === null) return null;
  const m = src.match(/const\s+BUILD\s*=\s*\[([\s\S]*?)\]\s*;/);
  if (!m) { fail("LIST_UNREADABLE", "could not find a BUILD array in tools/" + file); return null; }
  const ids = (m[1].match(/"([a-z0-9_]+)"/g) || []).map(function (s) { return s.replace(/"/g, ""); });
  if (!ids.length) { fail("LIST_UNREADABLE", "BUILD array in tools/" + file + " parsed as empty"); return null; }
  return ids;
}

function switchConfigList() {
  const src = genSource("build-switch-pages.js");
  if (src === null) return null;
  // Q19 (answered and applied 2026-08-30): brand, brandSlug, town, townSlug
  // and site moved out of a hardcoded per-branch CONFIG literal and now come
  // from branches.json; CONFIG itself is built at runtime, so there is no
  // literal object under that name any more. The list of branch ids that get
  // a switch page still lives as a literal object though: EXTRAS, holding
  // only the genuinely presentation-only extras (videoId, services). Its keys
  // are the same 15 branch ids CONFIG's keys used to be.
  const m = src.match(/const\s+EXTRAS\s*=\s*\{([\s\S]*?)\n\};/);
  if (!m) { fail("LIST_UNREADABLE", "could not find the EXTRAS object in tools/build-switch-pages.js"); return null; }
  const keys = (m[1].match(/^ {2}([a-z0-9_]+)\s*:/gm) || []).map(function (s) { return s.trim().replace(":", ""); });
  if (!keys.length) { fail("LIST_UNREADABLE", "EXTRAS object in tools/build-switch-pages.js parsed as empty"); return null; }
  return keys;
}

function conditionSlugs() {
  const src = genSource("build-service-pages.js");
  if (src === null) return null;
  const order = src.match(/const\s+CONDITION_ORDER\s*=\s*\[([\s\S]*?)\]\s*;/);
  if (!order) { fail("LIST_UNREADABLE", "could not find CONDITION_ORDER in tools/build-service-pages.js"); return null; }
  const ordered = (order[1].match(/"([a-z-]+)"/g) || []).map(function (s) { return s.replace(/"/g, ""); });
  // ready:false conditions are listed on the overview but no page is built.
  const ready = {};
  const re = /slug:\s*"([a-z-]+)"\s*,?\s*[\r\n]+\s*ready:\s*(true|false)/g;
  let hit;
  while ((hit = re.exec(src)) !== null) { ready[hit[1]] = hit[2] === "true"; }
  const built = ordered.filter(function (s) { return ready[s] === true; });
  const unknown = ordered.filter(function (s) { return ready[s] === undefined; });
  if (unknown.length) { fail("LIST_UNREADABLE", "no ready flag parsed for condition(s): " + unknown.join(", ")); return null; }
  return { ordered: ordered, built: built, deferred: ordered.filter(function (s) { return ready[s] === false; }) };
}

// --- what branches.json says should exist ----------------------------------
// Each rule states, in one place, the branch fact that earns a page. This is
// the only definition of "should exist" in the repo; the generators' BUILD
// lists are treated as a copy of it that has to be kept honest.

function hasWidget(b, key) { return !!(b.widgets && b.widgets[key]); }
function sluggable(b) { return !!(b.brandSlug && b.townSlug && b.website); }

const conds = conditionSlugs();

const RULES = [
  {
    name: "Pharmacy First",
    generator: "build-service-pages.js",
    list: buildList("build-service-pages.js"),
    dir: "modules/service/pages",
    reason: "widgets.pharmacyFirst is set",
    qualifies: function (b) { return sluggable(b) && hasWidget(b, "pharmacyFirst"); },
    files: function (b) {
      const tail = "-" + b.brandSlug + "-" + b.townSlug + ".html";
      const out = ["pharmacy-first" + tail];
      (conds ? conds.built : []).forEach(function (c) { out.push(c + "-treatment" + tail); });
      return out;
    }
  },
  {
    name: "Contraception",
    generator: "build-contraception-pages.js",
    list: buildList("build-contraception-pages.js"),
    dir: "modules/service/pages",
    reason: "widgets.contraception is set",
    qualifies: function (b) { return sluggable(b) && hasWidget(b, "contraception"); },
    files: function (b) { return ["contraception-" + b.brandSlug + "-" + b.townSlug + ".html"]; }
  },
  {
    name: "Travel clinic",
    generator: "build-travel-clinic-pages.js",
    list: buildList("build-travel-clinic-pages.js"),
    dir: "modules/service/pages",
    reason: "widgets.travelClinic is set",
    qualifies: function (b) { return sluggable(b) && hasWidget(b, "travelClinic"); },
    files: function (b) { return ["travel-clinic-" + b.brandSlug + "-" + b.townSlug + ".html"]; }
  },
  {
    name: "Weight loss",
    generator: "build-weight-loss-pages.js",
    list: buildList("build-weight-loss-pages.js"),
    dir: "modules/service/pages",
    reason: "widgets.weightLoss is set",
    qualifies: function (b) { return sluggable(b) && hasWidget(b, "weightLoss"); },
    files: function (b) { return ["weight-loss-clinic-" + b.brandSlug + "-" + b.townSlug + ".html"]; }
  },
  {
    name: "Switch",
    generator: "build-switch-pages.js",
    list: switchConfigList(),
    listLabel: "CONFIG object",
    dir: "modules/switch/pages",
    reason: "the branch trades and has brandSlug, townSlug and website",
    qualifies: sluggable,
    files: function (b) { return ["switch-prescriptions-" + b.brandSlug + "-" + b.townSlug + ".html"]; }
  }
];

// --- checks ----------------------------------------------------------------

const expectedByDir = {};   // dir -> Set of filenames branches.json earns
function expect(dir, file) { (expectedByDir[dir] = expectedByDir[dir] || new Set()).add(file); }

let ruleLines = [];

RULES.forEach(function (rule) {
  if (!rule.list) return;   // parse failure already recorded
  const earned = live.filter(rule.qualifies).map(function (b) { return b.id; });
  const listed = rule.list.slice();

  // 1. A branch that earns pages but is in no generator list gets nothing
  //    built, and every other checker reports clean because there is no file.
  earned.forEach(function (id) {
    if (listed.indexOf(id) === -1) {
      fail("NOT_BUILT", rule.name + ": branch " + id + " earns pages (" + rule.reason +
        ") but is not in the " + (rule.listLabel || "BUILD list") + " of tools/" + rule.generator +
        ". No page will ever be generated for it and no other checker will notice.");
    }
  });

  // 2. A generator list entry that branches.json no longer backs.
  listed.forEach(function (id) {
    const b = byId[id];
    if (!b) {
      fail("STALE_ID", rule.name + ": tools/" + rule.generator + " lists " + id +
        ", which is not in branches.json at all.");
      return;
    }
    if (b.disposed) {
      fail("DISPOSED_LISTED", rule.name + ": tools/" + rule.generator + " lists " + id +
        ", which is marked disposed in branches.json. Remove it from the list.");
      return;
    }
    if (!rule.qualifies(b)) {
      fail("NOT_EARNED", rule.name + ": tools/" + rule.generator + " lists " + id +
        ", but branches.json does not earn it a page (" + rule.reason + " is not true).");
    }
  });

  // 3. The files themselves.
  live.filter(rule.qualifies).forEach(function (b) {
    rule.files(b).forEach(function (f) {
      expect(rule.dir, f);
      if (!fs.existsSync(path.join(ROOT, rule.dir, f))) {
        fail("PAGE_MISSING", rule.name + ": " + rule.dir + "/" + f +
          " is earned by " + b.id + " but is not on disk. Re-run tools/" + rule.generator + ".");
      }
    });
  });

  ruleLines.push("  " + rule.name.padEnd(16) + " earns " + String(earned.length).padStart(2) +
    " branches, list holds " + String(listed.length).padStart(2));
});

// --- branch landing pages --------------------------------------------------
// Item 2.2 built these because two branches sharing one domain have no page of
// their own to rank locally. That reasoning is a property of the data, not of
// Fishlocks, so the rule is derived from branches.json: any live branch that
// shares its website host with another live branch has the same problem.
// A shared-domain branch with no landing page WARNS rather than fails, because
// whether to build one is Rishi's decision, not a build defect. Everything
// else about the list is checked as strictly as the other rules.

const LANDING_DIR = "modules/branch/pages";
const LANDING_GEN = "build-branch-landing-pages.js";
const landingList = buildList(LANDING_GEN);

function host(b) {
  if (!b.website) return null;
  return String(b.website).replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
}
function landingFile(b) { return "pharmacy-" + b.brandSlug + "-" + b.townSlug + ".html"; }

const shareCount = {};
live.forEach(function (b) {
  const h = host(b);
  if (h) shareCount[h] = (shareCount[h] || 0) + 1;
});
function sharesDomain(b) { return sluggable(b) && shareCount[host(b)] > 1; }

const sharing = live.filter(sharesDomain);

if (landingList) {
  sharing.forEach(function (b) {
    if (landingList.indexOf(b.id) === -1) {
      warn("LANDING_NOT_BUILT", b.id + " shares " + host(b) + " with another trading branch but has no " +
        "branch landing page, and is not in the BUILD list of tools/" + LANDING_GEN +
        ". Item 2.2 built these for Fishlocks for exactly this reason.");
    }
  });

  landingList.forEach(function (id) {
    const b = byId[id];
    if (!b) {
      fail("STALE_ID", "Branch landing: tools/" + LANDING_GEN + " lists " + id +
        ", which is not in branches.json at all.");
      return;
    }
    if (b.disposed) {
      fail("DISPOSED_LISTED", "Branch landing: tools/" + LANDING_GEN + " lists " + id +
        ", which is marked disposed in branches.json. Remove it from the list.");
      return;
    }
    if (!sluggable(b)) {
      fail("NOT_EARNED", "Branch landing: tools/" + LANDING_GEN + " lists " + id +
        ", which has no brandSlug, townSlug or website, so no page can be named for it.");
      return;
    }
    if (!sharesDomain(b)) {
      warn("LANDING_NOT_SHARED", "Branch landing: tools/" + LANDING_GEN + " lists " + id +
        ", which no longer shares its domain with another trading branch. Harmless, but the " +
        "page is doing nothing the branch's own site does not already do.");
    }
    const f = landingFile(b);
    expect(LANDING_DIR, f);
    if (!fs.existsSync(path.join(ROOT, LANDING_DIR, f))) {
      fail("PAGE_MISSING", "Branch landing: " + LANDING_DIR + "/" + f + " is listed for " + id +
        " but is not on disk. Re-run tools/" + LANDING_GEN + ".");
    }
  });

  ruleLines.push("  " + "Branch landing".padEnd(16) + " earns " + String(sharing.length).padStart(2) +
    " branches, list holds " + String(landingList.length).padStart(2));
}

// --- orphans ---------------------------------------------------------------
// The mirror of NOT_BUILT. A page on disk that branches.json no longer earns
// is a page nobody maintains: it keeps its old NAP, its old trading name and
// its old claims, and every other checker walks straight past it because they
// only read what is there. Disposal is the common cause, a renamed slug the
// other.

Object.keys(expectedByDir).forEach(function (dir) {
  const p = path.join(ROOT, dir);
  if (!fs.existsSync(p)) { fail("DIR_MISSING", dir + " does not exist"); return; }
  fs.readdirSync(p).filter(function (f) { return /\.html$/.test(f); }).forEach(function (f) {
    if (!expectedByDir[dir].has(f)) {
      fail("ORPHAN_PAGE", dir + "/" + f + " is on disk but branches.json earns no such page. " +
        "It is generated output nothing maintains: check whether its branch was disposed or its " +
        "slug renamed, then delete it.");
    }
  });
});

// --- report ----------------------------------------------------------------

let expectedTotal = 0;
Object.keys(expectedByDir).forEach(function (d) { expectedTotal += expectedByDir[d].size; });

console.log("check-page-coverage");
console.log("  branches.json: " + allBranches.length + " branches, " + live.length +
  " trading, " + disposed.length + " disposed");
if (conds) {
  console.log("  conditions:    " + conds.built.length + " built" +
    (conds.deferred.length ? ", " + conds.deferred.length + " deferred (" + conds.deferred.join(", ") + ")" : ""));
}
ruleLines.forEach(function (l) { console.log(l); });
console.log("  expected page set: " + expectedTotal + " pages across " +
  Object.keys(expectedByDir).length + " folders");

if (VERBOSE) {
  Object.keys(expectedByDir).sort().forEach(function (d) {
    console.log("");
    console.log("  " + d + " (" + expectedByDir[d].size + ")");
    Array.from(expectedByDir[d]).sort().forEach(function (f) { console.log("    " + f); });
  });
}

if (warnings.length) {
  console.log("");
  console.log("WARNINGS (" + warnings.length + ") - do not fail the run:");
  warnings.forEach(function (w) { console.log("  " + w); });
}

console.log("");
if (failures.length) {
  console.log("FAILURES (" + failures.length + "):");
  failures.forEach(function (f) { console.log("  " + f); });
  console.log("");
  console.log("check-page-coverage: FAILED");
  process.exit(1);
}
console.log("check-page-coverage: clean, " + expectedTotal + " pages accounted for" +
  (warnings.length ? ", " + warnings.length + " warning(s)" : ""));
process.exit(0);
