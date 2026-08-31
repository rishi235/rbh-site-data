/*
  tools/check-cdn-pins.js - proves that what the CDN serves to a live page is
  what this repo currently says (quality pass on item 3.4, 2026-08-09).

  Why this file exists
  --------------------
  Every generated page loads its CSS and JS from jsDelivr against a pinned
  ref, e.g.

      https://cdn.jsdelivr.net/gh/rishi235/rbh-site-data@<ref>/modules/service/service.js

  Two pinning models are in use and both are deliberate (README section
  "Pushing CSS/JS changes live (commit pinning)"):

    - a MUTABLE branch ref ("service-module-phase1"), used by the five
      service-family generators. One push to that branch updates every live
      page without a Weebly repaste. That is the whole point of it.
    - an IMMUTABLE commit ref ("6a275e1"), used by the switch generator,
      because jsDelivr can lag ~12h on a branch ref and ignores ?v=.

  Neither model is wrong. What nothing was checking is whether the pinned
  ref still holds the CURRENT code. A commit pin freezes forever, and a
  branch pin only works while somebody keeps the branch level with main.
  When either drifts, the repo is green, every other checker is green, and
  live is quietly serving old code. That is not a hypothetical: this checker
  was written after finding that the switch pages' pinned switch.js still
  sends switch requests to rishi@rbhealth.co.uk, four commits' worth of fixes
  after main changed it to helpdesk@rbhealth.co.uk.

  What it checks
  --------------
    FAIL  a page pins a ref its own generator does not declare (hand-edited
          page, or a generator changed without regenerating)
    FAIL  a pinned ref no longer resolves in git (branch deleted = every live
          page using it loses its stylesheet and script)
    FAIL  a pinned asset's content differs from main, unless the exact
          file+ref pair is listed in KNOWN_DRIFT below with a reason
    WARN  a mutable branch ref is behind main (the "push once, live
          everywhere" model has stopped working, even if the assets happen
          to match today)

  What it missed until the item 3.4 quality pass, 2026-08-11
  ----------------------------------------------------------
  Everything above read GENERATED PAGES only, because that is where the 177
  pages live. Two kinds of file carry a jsDelivr pin and are not in there, so
  the checker that exists to see past the repo boundary could not see them.

    FAIL  a public paste file pins a ref its own module's generator does not
          declare. modules/switch/weebly.html is pasted into a Weebly embed on
          every branch running a switch page this repo does not generate, and
          it pins switch.css at @main while build-switch-pages.js pins the
          immutable 6a275e1. Two refs for one module's stylesheet, one on the
          generated pages and one on the pasted embed. The two are byte-
          identical today, so this is latent, not live-visible - which is
          exactly how it survived. It also carries ?v=, which the README
          records as ignored by jsDelivr on a ref.

    WARN  a runtime DATA fetch. This is the one that matters. Both
          modules/service/service.js and core/site-data.js fetch
          branches.json from @main at runtime, so the booking chain
          documented in CLAUDE.md has a second hop nothing had ever read:

              page pins service.js @service-module-phase1
                -> service.js fetches branches.json @main
                  -> widget id, phone, address, hours

          Every checker in this repo validates branches.json on THIS branch.
          Live resolves it from main. While the two differ, a live page can
          render a widget id, a phone number or an address this repo has
          already corrected, with every check green. Same class as the Q13
          switch.js finding, one layer down: that one was stale CODE behind a
          pin, this is stale DATA behind a pin.

  The rule worth carrying, and it is the third time this repo has found it:
  when a checker passes, ask WHICH FILES it read. This one was written to see
  past the repo boundary and still only looked at the 177 pages inside it.

  Run: node tools/check-cdn-pins.js
*/
"use strict";

var fs = require("fs");
var path = require("path");
var execFileSync = require("child_process").execFileSync;

var ROOT = path.join(__dirname, "..");
var TOOLS = __dirname;

// ---------------------------------------------------------------------------
// Known, accepted drift. Each entry needs a reason and the question that
// covers it, so this list can never quietly become a place to hide defects.
// Remove the entry the moment the underlying fix lands.
// ---------------------------------------------------------------------------
var KNOWN_DRIFT = [
  {
    ref: "6a275e1",
    file: "modules/switch/switch.js",
    question: "Q13",
    since: "2026-08-09",
    reason: "Pinned commit still carries DESTINATION rishi@rbhealth.co.uk; main " +
            "says helpdesk@rbhealth.co.uk. Fixing it needs a new pin plus a Weebly " +
            "repaste of all 15 switch pages, which an unattended run cannot do."
  }
];

// ---------------------------------------------------------------------------
// Files that carry a jsDelivr pin and are NOT generated pages, so the page
// walk below cannot reach them. Two groups, checked by different rules.
//
// PASTE = public copy. A human pastes it into a Weebly embed, so it is as
// public as any generated page the moment somebody pastes it. It must pin
// what its own module's generator pins.
//
// RUNTIME = an asset that is itself served from the CDN and fetches more from
// it at run time. This is the second hop in the booking chain.
//
// A listed file that has gone FAILS the run, the same convention as
// EXTRA_HTML in check-em-dashes.js, so the list cannot rot.
//
// modules/emar/weebly was missing from this list until the item 5.1 quality
// pass, 2026-08-31 - the same shape of gap this file's own header already
// names: "when a checker passes, ask WHICH FILES it read." check-em-dashes.js
// added modules/emar/weebly to ITS EXTRA_HTML list on 2026-08-11, on the
// reasoning that it is "a hand-pasted Weebly block like modules/switch/
// weebly.html and is as public as one" - it is pasted into the Borough Care
// eMAR page and loads emar.css, emar.js and core/site-data.js from jsDelivr
// @main, exactly the shape this checker exists to verify. This list was
// never told, so a public paste template carrying three live CDN pins sat
// entirely outside the one checker whose job is proving a pin still holds
// current code. See GENERATORLESS_MODULES below for why modules/emar/emar.css
// and .js need a further carve-out once they are actually read.
// ---------------------------------------------------------------------------
var EXTRA_PASTE = [
  "modules/switch/weebly.html",
  "modules/emar/weebly",
  "modules/service/weebly-paste/cherry-lane-old-pharmacy-first-replacement.html",
  "modules/service/weebly-paste/cherry-lane-old-weight-loss-replacement.html",
  "modules/service/DRAFT-weight-loss-copy.html",
  "modules/service/DRAFT-travel-clinic-copy.html"
];

var EXTRA_RUNTIME = [
  "modules/service/service.js",
  "modules/switch/switch.js",
  "core/site-data.js"
];

// Accepted ref mismatches in the files above. Same convention as KNOWN_DRIFT:
// a reason, a question id, and an entry that no longer fires FAILS the run.
var KNOWN_PIN_REF = [
  {
    file: "modules/switch/weebly.html",
    asset: "modules/switch/switch.css",
    ref: "main",
    question: "Q45",
    since: "2026-08-11",
    reason: "The shared switch paste template pins @main while build-switch-pages.js " +
            "pins the immutable 6a275e1. switch.css is byte-identical at both refs " +
            "today, so nothing renders differently and changing it would need a " +
            "repaste of every branch running a pasted switch embed. Which ref the " +
            "template should carry is Rishi's call, raised as Q45."
  },
  {
    file: "modules/switch/weebly.html",
    asset: "modules/switch/switch.js",
    ref: "main",
    question: "Q45",
    since: "2026-08-11",
    reason: "This one is not cosmetic and it sharpens Q13. The pasted embed loads " +
            "switch.js from @main, whose DESTINATION is helpdesk@rbhealth.co.uk. The " +
            "15 GENERATED switch pages load it from @6a275e1, whose DESTINATION is " +
            "rishi@rbhealth.co.uk. So the same module is running two destinations in " +
            "public at once, split by whether a branch got the paste or the generated " +
            "page, and the paste half is the half that is already correct. Q13 fixes " +
            "the generated half; this entry records that the split existed and was " +
            "read by nothing until 2026-08-11."
  }
];

function git(args) {
  // stdio piped so a probe that is EXPECTED to fail (e.g. resolving a ref that
  // only exists as origin/<ref>) does not leak git's stderr into the report.
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}
function gitQuiet(args) {
  try { return { ok: true, out: git(args) }; }
  catch (e) { return { ok: false, out: String((e && e.message) || e) }; }
}

// Baseline to compare against: origin/main if we have it, else main.
function mainRef() {
  if (gitQuiet(["rev-parse", "--verify", "--quiet", "origin/main"]).ok) return "origin/main";
  return "main";
}

// ---------------------------------------------------------------------------
// What each generator declares: PIN, and the module folder its CDN points at.
// ---------------------------------------------------------------------------
function readGenerators() {
  var out = {}; // module folder -> { pin: [generator names] }
  fs.readdirSync(TOOLS).filter(function (f) {
    return /^build-.*\.js$/.test(f);
  }).forEach(function (f) {
    var src = fs.readFileSync(path.join(TOOLS, f), "utf8");
    var pinM = src.match(/^\s*(?:const|var|let)\s+PIN\s*=\s*"([^"]+)"/m);
    if (!pinM) return;
    var cdnM = src.match(/rbh-site-data@"\s*\+\s*PIN\s*\+\s*"\/modules\/([A-Za-z0-9\-]+)/);
    if (!cdnM) return;
    var mod = cdnM[1];
    out[mod] = out[mod] || {};
    out[mod][pinM[1]] = out[mod][pinM[1]] || [];
    out[mod][pinM[1]].push(f);
  });
  return out;
}

// ---------------------------------------------------------------------------
// Every jsDelivr pin actually present in a generated page.
// ---------------------------------------------------------------------------
var PIN_RE = /cdn\.jsdelivr\.net\/gh\/rishi235\/rbh-site-data@([A-Za-z0-9._\-\/]+?)\/(modules\/[A-Za-z0-9._\-\/]+?\.(?:css|js))/g;

function readPages() {
  var rows = [];
  ["service", "switch", "branch"].forEach(function (mod) {
    var dir = path.join(ROOT, "modules", mod, "pages");
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).filter(function (f) { return /\.html$/.test(f); }).forEach(function (f) {
      var html = fs.readFileSync(path.join(dir, f), "utf8");
      var m;
      PIN_RE.lastIndex = 0;
      while ((m = PIN_RE.exec(html)) !== null) {
        rows.push({ mod: mod, page: "modules/" + mod + "/pages/" + f, ref: m[1], file: m[2] });
      }
    });
  });
  return rows;
}

// A runtime fetch of repo DATA, as opposed to a stylesheet or a script.
var DATA_RE = /cdn\.jsdelivr\.net\/gh\/rishi235\/rbh-site-data@([A-Za-z0-9._\-\/]+?)\/(branches\.json)/g;

// The non-generated files also load core/ assets, which PIN_RE deliberately
// does not match because no generated page carries one. A paste template does.
var EXTRA_ASSET_RE = /cdn\.jsdelivr\.net\/gh\/rishi235\/rbh-site-data@([A-Za-z0-9._\-\/]+?)\/((?:modules|core)\/[A-Za-z0-9._\-\/]+?\.(?:css|js))/g;

// Read the non-generated files. Missing file = FAIL, so the lists cannot rot.
function readExtras(list, kind, missing) {
  var rows = [];
  list.forEach(function (relPath) {
    var abs = path.join(ROOT, relPath);
    if (!fs.existsSync(abs)) {
      missing.push(relPath + " is listed in EXTRA_" + kind.toUpperCase() +
        " but is not in the repo - remove the entry or restore the file");
      return;
    }
    var text = fs.readFileSync(abs, "utf8");
    var m;
    EXTRA_ASSET_RE.lastIndex = 0;
    while ((m = EXTRA_ASSET_RE.exec(text)) !== null) {
      rows.push({ kind: kind, page: relPath, ref: m[1], file: m[2], data: false });
    }
    DATA_RE.lastIndex = 0;
    while ((m = DATA_RE.exec(text)) !== null) {
      rows.push({ kind: kind, page: relPath, ref: m[1], file: m[2], data: true });
    }
  });
  return rows;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
var failures = [];
var warnings = [];
var known = [];

var gens = readGenerators();
var rows = readPages();
var MAIN = mainRef();

var missingExtras = [];
var extraPaste = readExtras(EXTRA_PASTE, "paste", missingExtras);
var extraRuntime = readExtras(EXTRA_RUNTIME, "runtime", missingExtras);
var knownPinHits = {};
missingExtras.forEach(function (m) { failures.push(m); });

console.log("check-cdn-pins");
console.log("  baseline: " + MAIN);

if (!rows.length) {
  console.error("FAIL  no jsDelivr pins found in any generated page - has the pin format changed?");
  process.exit(1);
}

// 1. Every page's pin must be one a generator declares for THAT ASSET.
//    Keyed on the asset's module folder, not the page's: branch landing pages
//    live in modules/branch/pages but correctly load modules/service assets.
rows.forEach(function (r) {
  var assetMod = (r.file.split("/")[1]) || "";
  var declared = gens[assetMod];
  if (!declared) {
    failures.push(r.page + ": pins " + r.ref + " but no generator declares a PIN for modules/" + assetMod);
    return;
  }
  if (!declared[r.ref]) {
    failures.push(r.page + ": pins '" + r.ref + "' for " + r.file + ", but the modules/" + assetMod +
      " generator(s) declare " + Object.keys(declared).map(function (p) { return "'" + p + "'"; }).join(", ") +
      " - regenerate, or the page was hand-edited");
  }
});

// 2 and 3. Per distinct ref+file: does the ref resolve, and does its content
//          match main?
var seen = {};
rows.forEach(function (r) { seen[r.ref + " " + r.file] = r; });

var refPages = {};
rows.forEach(function (r) { refPages[r.ref] = (refPages[r.ref] || 0) + 1; });

Object.keys(seen).forEach(function (k) {
  var r = seen[k];
  var resolved = gitQuiet(["rev-parse", "--verify", "--quiet", r.ref + "^{commit}"]);
  if (!resolved.ok) {
    resolved = gitQuiet(["rev-parse", "--verify", "--quiet", "origin/" + r.ref + "^{commit}"]);
  }
  if (!resolved.ok) {
    failures.push("ref '" + r.ref + "' does not resolve in git - if it is gone from GitHub, " +
      refPages[r.ref] + " live page reference(s) lose " + r.file);
    return;
  }
  var pinned = gitQuiet(["show", r.ref + ":" + r.file]);
  if (!pinned.ok) pinned = gitQuiet(["show", "origin/" + r.ref + ":" + r.file]);
  var current = gitQuiet(["show", MAIN + ":" + r.file]);
  if (!pinned.ok || !current.ok) {
    failures.push("could not read " + r.file + " at " + r.ref + " or at " + MAIN);
    return;
  }
  if (pinned.out !== current.out) {
    var hit = KNOWN_DRIFT.filter(function (d) { return d.ref === r.ref && d.file === r.file; })[0];
    if (hit) {
      known.push(r.file + " @" + r.ref + " differs from " + MAIN + " (" + hit.question +
        ", raised " + hit.since + "): " + hit.reason);
    } else {
      failures.push(r.file + " @" + r.ref + " differs from " + MAIN +
        " - live pages are serving code this repo no longer says");
    }
  }
});

// 4. A mutable branch ref only delivers "push once, live everywhere" while it
//    is level with main. Behind main, the model is inert even if the assets
//    happen to match today.
Object.keys(refPages).forEach(function (ref) {
  var isBranch = gitQuiet(["rev-parse", "--verify", "--quiet", "refs/remotes/origin/" + ref]).ok;
  if (!isBranch) return; // a commit pin is meant to be frozen
  var counts = gitQuiet(["rev-list", "--left-right", "--count", MAIN + "...origin/" + ref]);
  if (!counts.ok) return;
  var parts = counts.out.trim().split(/\s+/);
  var behind = parseInt(parts[0], 10) || 0;
  if (behind > 0) {
    warnings.push("branch ref '" + ref + "' is " + behind + " commit(s) behind " + MAIN +
      " and carries " + refPages[ref] + " page reference(s). It is pinned as a MUTABLE ref so " +
      "that one push updates live pages without a repaste; while it sits behind main, that " +
      "no longer happens.");
  }
});

// modules/ folders that no build-*.js generator declares a PIN for, derived
// from the filesystem rather than named, added on the same pass that added
// modules/emar/weebly to EXTRA_PASTE above (item 5.1 quality pass,
// 2026-08-31). service and switch each have a generator that owns a PIN for
// their own module folder and is the single source of truth for it; branch
// and emar do not - branch pages load modules/service assets rather than a
// modules/branch/*.css or .js of their own, and emar has no generator at
// all, so nothing in this repo composes an expected ref for modules/emar/
// emar.css or emar.js. That is the same position core/ assets are already
// in below, for the same reason (no generated page loads one, so there is
// nothing to hold a paste reference to), so it gets the same treatment:
// reported so the reference is visible, not failed for lacking a comparison
// that cannot exist. Deriving this from the filesystem rather than writing
// "emar" as a literal keeps a typo'd module name in a paste file (which
// matches no real folder) failing as before, instead of silently downgrading
// it - the exact "list vs shape" lesson this repo's other checkers already
// carry.
var MODULES_DIR = path.join(ROOT, "modules");
var GENERATORLESS_MODULES = new Set(
  fs.existsSync(MODULES_DIR)
    ? fs.readdirSync(MODULES_DIR, { withFileTypes: true })
        .filter(function (e) { return e.isDirectory() && !gens[e.name]; })
        .map(function (e) { return e.name; })
    : []
);

// 5. A PUBLIC PASTE file must pin what its own module's generator pins. It is
//    pasted into a Weebly embed, so it is as public as a generated page, and
//    two refs for one module's asset means the pasted embed and the generated
//    pages can render from different code.
extraPaste.forEach(function (r) {
  if (r.data) return; // handled by rule 6
  // core/ assets are declared by no generator, because no generated page loads
  // one. A paste template does, so the reference is reported rather than
  // failed - there is no generator PIN to compare it against.
  if (r.file.indexOf("core/") === 0) {
    known.push(r.page + " loads " + r.file + " @" + r.ref +
      ", a core asset no generator declares a PIN for, so nothing composes an " +
      "expected ref for it. Reported so the reference is at least visible.");
    return;
  }
  var assetMod = (r.file.split("/")[1]) || "";
  // A generator-less module (emar today) is the same position as core/: no
  // generated page loads one, so nothing composes an expected ref. Reported,
  // not failed. See GENERATORLESS_MODULES above.
  if (GENERATORLESS_MODULES.has(assetMod)) {
    known.push(r.page + " loads " + r.file + " @" + r.ref +
      ", a modules/" + assetMod + " asset no generator declares a PIN for, so " +
      "nothing composes an expected ref for it. Reported so the reference is " +
      "at least visible.");
    return;
  }
  var declared = gens[assetMod];
  if (!declared) {
    failures.push(r.page + ": pins " + r.ref + " but no generator declares a PIN for modules/" + assetMod);
    return;
  }
  if (declared[r.ref]) return;
  var hit = KNOWN_PIN_REF.filter(function (k) {
    return k.file === r.page && k.asset === r.file && k.ref === r.ref;
  })[0];
  if (hit) {
    knownPinHits[hit.file + "::" + hit.asset] = true;
    known.push(r.page + " pins " + r.file + " @" + r.ref + ", not the generator's ref (" +
      hit.question + ", raised " + hit.since + "): " + hit.reason);
    return;
  }
  failures.push(r.page + ": public paste copy pins '" + r.ref + "' for " + r.file +
    ", but the modules/" + assetMod + " generator(s) declare " +
    Object.keys(declared).map(function (p) { return "'" + p + "'"; }).join(", ") +
    " - the pasted embed and the generated pages would load different code");
});

// 6. THE SECOND HOP. An asset served from the CDN that fetches repo DATA from
//    the CDN at run time. Every checker here validates branches.json on the
//    CHECKED-OUT branch; live resolves it from whatever ref this line names.
//    While the two differ, live can render a widget id, a phone number or an
//    address this repo has already corrected, with every check green.
var headBranch = gitQuiet(["rev-parse", "--abbrev-ref", "HEAD"]);
var headName = headBranch.ok ? headBranch.out.trim() : "HEAD";
extraRuntime.concat(extraPaste).filter(function (r) { return r.data; }).forEach(function (r) {
  var resolved = gitQuiet(["rev-parse", "--verify", "--quiet", r.ref + "^{commit}"]);
  if (!resolved.ok) resolved = gitQuiet(["rev-parse", "--verify", "--quiet", "origin/" + r.ref + "^{commit}"]);
  if (!resolved.ok) {
    failures.push(r.page + ": fetches " + r.file + " from ref '" + r.ref +
      "' at run time, and that ref does not resolve in git");
    return;
  }
  var served = gitQuiet(["show", r.ref + ":" + r.file]);
  if (!served.ok) served = gitQuiet(["show", "origin/" + r.ref + ":" + r.file]);
  var here = gitQuiet(["show", "HEAD:" + r.file]);
  if (!served.ok || !here.ok) {
    failures.push("could not read " + r.file + " at " + r.ref + " or at HEAD");
    return;
  }
  if (served.out === here.out) {
    known.push(r.page + " fetches " + r.file + " @" + r.ref + " at run time; identical to " +
      headName + " today, so live data and checked data agree.");
    return;
  }
  warnings.push(r.page + " fetches " + r.file + " from @" + r.ref + " at RUN TIME, and that copy " +
    "differs from " + headName + ", which is the branch every checker here validates. Live " +
    "resolves branch data - widget ids, phones, addresses, hours - from @" + r.ref + ". Until " +
    "this branch reaches " + r.ref + ", a page can render data this repo has already corrected " +
    "while every check stays green. Second hop in the booking chain (Q45).");
});

// A KNOWN_PIN_REF entry that no longer fires means the fix landed; it must go.
KNOWN_PIN_REF.forEach(function (k) {
  if (!knownPinHits[k.file + "::" + k.asset]) {
    failures.push("stale KNOWN_PIN_REF entry: " + k.file + " no longer pins " + k.asset +
      " at '" + k.ref + "' (" + k.question + ") - remove the entry");
  }
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
var refList = Object.keys(refPages).sort();
console.log("  " + rows.length + " pin reference(s) across " +
  Object.keys(rows.reduce(function (a, r) { a[r.page] = 1; return a; }, {})).length +
  " generated page(s), " + refList.length + " distinct ref(s): " + refList.join(", "));
console.log("  plus " + (extraPaste.length + extraRuntime.length) + " reference(s) in " +
  (EXTRA_PASTE.length + EXTRA_RUNTIME.length) + " non-generated file(s): " +
  EXTRA_PASTE.length + " public paste, " + EXTRA_RUNTIME.length + " runtime asset(s)");

known.forEach(function (k) { console.log("  KNOWN " + k); });
warnings.forEach(function (w) { console.log("  WARN  " + w); });
failures.forEach(function (f) { console.error("  FAIL  " + f); });

console.log("");
if (failures.length) {
  console.error("check-cdn-pins: " + failures.length + " failure(s), " + warnings.length +
    " warning(s), " + known.length + " known.");
  process.exit(1);
}
console.log("check-cdn-pins: clean, " + warnings.length + " warning(s), " + known.length +
  " known issue(s) awaiting a decision.");
process.exit(0);
