#!/usr/bin/env node
/*
  tools/check-postcodes.js - repo-wide postcode integrity.

  Why this exists
  ---------------
  Worklist item 1.3 was a one-off sweep for the McCanns Sandringham postcode
  error (CH49 1SX, a Wirral postcode, where the correct value is L17 4JP).
  The sweep found the repo clean, but nothing stopped the error class coming
  back. check-nap.js compares the postcode in three specific slots on the
  173 generated pages (JSON-LD, the contact-line, the map query) against
  branches.json; it says nothing about a postcode appearing anywhere else,
  and it does not look outside the three page directories at all. That
  leaves the Weebly paste blocks in modules/service/weebly-paste - copy that
  is pasted straight onto the public site - checked by nothing.

  This checker turns the one-off sweep into a standing one. Read-only.

  Rules
  -----
  1. UNKNOWN    every postcode in the repo must belong to a branches.json
                entry. The only exception is a NAMED historical value quoted
                in one of the narrative files that document the audit, and a
                named value that has left the repo fails as a stale exemption.
  2. MISSING    every live branch postcode must appear in a file that is NOT
                one of those narrative files, so a branch cannot silently lose
                its address and have the audit's own prose cover for it.
  3. FOREIGN    a file that belongs to one branch must not carry another
                branch's postcode. This is the McCanns Sandringham failure
                shape exactly: a real, valid postcode on the wrong branch.
  4. DISPOSED   a disposed branch's postcode must not appear in generated
                pages, packs or paste blocks.
  5. UNOWNED    a file carrying a postcode whose owning branch cannot be
                worked out is reported, so the tool states what it did not
                check rather than passing over it in silence.
  6. MISATTRIB  a line that names exactly one branch must carry that branch's
                postcode and no other branch's. Rule 3 matches ONE owner per
                FILENAME, so a MULTI-branch file is reported UNOWNED by rule 5
                and then checked by nothing but rule 1, which only asks whether
                a postcode is real - not whether it is on the right branch.
                That is the item 1.3 failure shape exactly.

  Run:  node tools/check-postcodes.js  [--verbose]
  Exit 0 = clean, 1 = failures. Warnings alone do not fail the run.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var VERBOSE = process.argv.indexOf("--verbose") !== -1;
var data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));
var branches = data.branches;

// Two separate ideas, kept separate on purpose.
//
// NARRATIVE_FILES are the surfaces allowed to QUOTE a postcode that is not in
// branches.json, because they record the audit itself: the worklist item names
// the wrong postcode, the log explains it, the status page renders both, and
// this checker carries it as the historical example in the comment above. A
// file listed here that quotes nothing today is fine; it is a documentation
// surface, not a claim. A file listed here that has gone is a failure, the
// same convention as EXTRA_HTML in check-em-dashes.js.
//
// NARRATIVE_POSTCODES are the specific historical values those files may
// quote. Until the item 1.3 quality pass on 2026-08-11 there was no such list.
// The exemption was whole-file, so ANY postcode typed into any of the listed
// files passed rule 1 in silence - including a wrong one written into
// status/index.html, which is the page a human reads to see where the audit
// has got to, and into QUESTIONS.json, which is where a question quotes a
// value back to Rishi for a decision. The exemption now names the value it
// excuses, and a named value that appears nowhere in the repo FAILS as a stale
// exemption, the same convention as KNOWN in check-seo-lengths.js and
// KNOWN_DRIFT in check-cdn-pins.js, so the list cannot rot.
var NARRATIVE_FILES = [
  "AGENT_LOG.md",
  "AGENT_WORKLIST.md",
  "QUESTIONS.json",
  "CHANGELOG.md",
  "README.md",
  "CLAUDE.md",
  "status/index.html",
  "tools/check-postcodes.js"
];

var NARRATIVE_POSTCODES = {
  "CH49 1SX": "Item 1.3: the Wirral postcode found on McCanns Sandringham, whose correct value is L17 4JP. The audit files quote it to record the error that was fixed.",
  "SK7 1BJ": "Run 95 (item 1.4 quality pass, 2026-08-12): the foreign postcode injected into Cherry Lane's contraception page to prove check-nap's body-copy blind spot. audits/nap-check-2026-08-12.txt quotes it to record the test."
};

// Files that DECLARE or DOCUMENT a postcode rather than USE it. This
// distinction is what makes rules 1 and 2 mean anything, and getting it wrong
// was caught while writing them: branches.json is the source of every
// postcode, so counting it as an appearance let rule 2 pass for a branch whose
// address had left every page and pack; and this file is itself scanned and is
// itself a narrative file, so writing a value into NARRATIVE_POSTCODES made
// that value appear in the repo and the stale-exemption rule could never fire.
// A postcode has to turn up somewhere a patient could read it before either
// rule is satisfied.
var SELF = "tools/check-postcodes.js";
var DECLARING = ["branches.json", SELF];

// Directories whose files are owned by a single branch, so rule 3 applies.
var OWNED_DIRS = [
  "modules/service/pages",
  "modules/switch/pages",
  "modules/branch/pages",
  "modules/service/weebly-paste",
  "gbp-packs"
];

var SKIP_DIRS = { ".git": 1, "node_modules": 1, ".vscode": 1 };
var TEXT_EXT = /\.(html|md|js|json|txt|css|ps1)$/i;
var PC_RE = /\b([A-Z]{1,2}[0-9][A-Z0-9]?)\s?([0-9][A-Z]{2})\b/g;

function norm(pc) { return String(pc || "").toUpperCase().replace(/\s+/g, " ").trim(); }
function rel(p) { return path.relative(ROOT, p).replace(/\\/g, "/"); }

// postcode -> branch. Two entries can share a postcode: Clear Chemist Aintree
// and head office are both at Unit 20 Brookfield, L9 7AS. Prefer a live
// trading branch over a disposed one, and over head office, so the reported
// owner is the one a reader would expect.
function rank(b) { return (b.disposed ? 0 : 2) + (b.id === "rbh_head_office_aintree" ? 0 : 1); }
var byPostcode = {};
branches.forEach(function (b) {
  var pc = norm(b.postalCode);
  if (!pc) return;
  if (!byPostcode[pc] || rank(b) > rank(byPostcode[pc])) byPostcode[pc] = b;
});

// Longest-suffix match on "<brandSlug>-<townSlug>" (as check-nap.js does),
// falling back to a brandSlug prefix for the paste blocks and packs, whose
// names are "cherry-lane-old-..." rather than "...-cherry-lane-walton".
function ownerOf(relPath) {
  var stem = path.basename(relPath).replace(/\.(html|md)$/, "");
  var best = null;
  branches.forEach(function (b) {
    if (!b.brandSlug || !b.townSlug) return;
    var suffix = b.brandSlug + "-" + b.townSlug;
    if (stem.endsWith(suffix) && (!best || suffix.length > best.key.length)) best = { b: b, key: suffix };
    if (stem === suffix && (!best || suffix.length > best.key.length)) best = { b: b, key: suffix };
  });
  if (best) return best.b;
  branches.forEach(function (b) {
    if (!b.brandSlug) return;
    if (stem.indexOf(b.brandSlug + "-") === 0 && (!best || b.brandSlug.length > best.key.length)) best = { b: b, key: b.brandSlug };
  });
  return best ? best.b : null;
}

var failures = [];
var warnings = [];
var seenPostcodes = {};      // postcode -> [every file carrying it]
var seenAsUse = {};          // postcode -> [files that USE it: pages, packs, paste blocks]
var narrativeQuotes = {};    // postcode -> [narrative files quoting it, excluding this file]
var filesScanned = 0;

function fail(m) { failures.push(m); }
function warn(m) { warnings.push(m); }

function scan(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    var p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS[e.name]) scan(p); return; }
    if (!TEXT_EXT.test(e.name)) return;
    checkFile(p);
  });
}

function checkFile(p) {
  var r = rel(p);
  var text = fs.readFileSync(p, "utf8");
  var found = {};
  var m;
  PC_RE.lastIndex = 0;
  while ((m = PC_RE.exec(text)) !== null) found[norm(m[1] + " " + m[2])] = true;
  var list = Object.keys(found);
  filesScanned++;
  if (!list.length) return;

  // Any file under audits/ is a narrative surface: it is the audit recording
  // itself, the same rationale as the listed files above. Found on the item
  // 4.3 quality pass 2026-08-12: run 95 wrote its injection value (SK7 1BJ)
  // into audits/nap-check-2026-08-12.txt AFTER running the checkers, so the
  // committed state was red and no run had seen it. Directory membership only
  // grants the right to QUOTE; the value must still be named in
  // NARRATIVE_POSTCODES, so a wrong postcode typed into an audit file still
  // fails.
  var isNarrative = NARRATIVE_FILES.indexOf(r) !== -1 || r.indexOf("audits/") === 0;
  var ownedDir = OWNED_DIRS.filter(function (d) { return r.indexOf(d + "/") === 0; })[0];
  var owner = ownedDir ? ownerOf(r) : null;

  if (ownedDir && !owner) warn("UNOWNED " + r + " carries " + list.join(", ") + " but no branch could be matched to the filename");

  list.forEach(function (pc) {
    (seenPostcodes[pc] = seenPostcodes[pc] || []).push(r);
    if (!isNarrative && DECLARING.indexOf(r) === -1) (seenAsUse[pc] = seenAsUse[pc] || []).push(r);
    if (isNarrative && r !== SELF) (narrativeQuotes[pc] = narrativeQuotes[pc] || []).push(r);
    var b = byPostcode[pc];

    if (!b) {
      if (isNarrative && NARRATIVE_POSTCODES[pc]) return;
      if (isNarrative) {
        fail("UNKNOWN  " + r + ": postcode " + pc + " is in no branches.json entry and is not a named historical value. " +
             "If the audit legitimately quotes it, add it to NARRATIVE_POSTCODES with a reason; otherwise correct it.");
        return;
      }
      fail("UNKNOWN  " + r + ": postcode " + pc + " is in no branches.json entry");
      return;
    }
    if (b.disposed && ownedDir) {
      fail("DISPOSED " + r + ": postcode " + pc + " belongs to disposed branch " + b.id);
      return;
    }
    if (owner && norm(owner.postalCode) !== pc) {
      fail("FOREIGN  " + r + ": owned by " + owner.id + " (" + norm(owner.postalCode) + ") but carries " + pc + " (" + b.id + ")");
    }
  });

  // Rule 6. Found on the item 1.3 quality pass 2026-08-13, from this
  // checker's own standing UNOWNED warnings rather than from the data.
  // modules/branch/pages/INDEX.md and SEO.md each carry SIX branches and six
  // postcodes, so ownerOf() can match no single owner, rule 3 is switched off
  // for them, and the only rule left is rule 1 - which asks whether a postcode
  // is REAL, not whether it is on the RIGHT branch. A real postcode against the
  // wrong branch is precisely the McCanns Sandringham error this item exists
  // to prevent, and it would have passed here in silence. It is not a
  // theoretical gap: both files hold the most confusable pair in the estate,
  // McCanns Aigburth L17 7BP and McCanns Sandringham L17 4JP - same brand,
  // same L17 district, five lines apart - and both files are public SEO
  // descriptions pasted into Weebly. Checked line by line, and ONLY where a
  // line names exactly one branch, so a page that merely mentions a
  // neighbouring branch is never accused. Narrative and declaring files are
  // exempt for the usual reason: they quote the wrong value on purpose.
  if (!isNarrative && DECLARING.indexOf(r) === -1) {
    text.split(/\r?\n/).forEach(function (line, idx) {
      var named = branches.filter(function (b) {
        return b.branchName && line.indexOf(b.branchName) !== -1;
      });
      if (named.length !== 1) return;
      var b = named[0];
      var want = norm(b.postalCode);
      if (!want) return;
      var onLine = {};
      var mm;
      PC_RE.lastIndex = 0;
      while ((mm = PC_RE.exec(line)) !== null) onLine[norm(mm[1] + " " + mm[2])] = true;
      Object.keys(onLine).forEach(function (pc) {
        if (pc !== want && byPostcode[pc]) {
          fail("MISATTRIB " + r + ":" + (idx + 1) + ": line names " + b.branchName +
               " (" + want + ") but carries " + pc + " (" + byPostcode[pc].id + ")");
        }
      });
    });
  }
}

scan(ROOT);

// Rule 2: every live branch postcode must be USED somewhere - on a page, in a
// pack, in a paste block. Declaring it in branches.json and narrating it in
// AGENT_LOG.md is not an address anybody can be sent to.
branches.forEach(function (b) {
  if (b.disposed) return;
  var pc = norm(b.postalCode);
  if (!pc) { warn("NO POSTCODE in branches.json for " + b.id); return; }
  if (!seenPostcodes[pc]) {
    fail("MISSING  postcode " + pc + " (" + b.id + ") appears nowhere in the repo");
    return;
  }
  if (!seenAsUse[pc]) {
    fail("MISSING  postcode " + pc + " (" + b.id + ") is only declared or narrated (" +
      seenPostcodes[pc].join(", ") + "): no page, pack or paste block carries this branch's address");
  }
});

// Rule 1, second half: the exemption list cannot rot. A named historical value
// that has left the repo has done its job and the entry must go, and a
// narrative file that has been deleted or renamed must not sit here unnoticed.
// Measured against the narrative files ONLY, and never against this file, or
// the entry would keep itself alive just by being written down here.
Object.keys(NARRATIVE_POSTCODES).forEach(function (pc) {
  if (!narrativeQuotes[pc]) {
    fail("STALE    NARRATIVE_POSTCODES names " + pc + " but no narrative file quotes it. Remove the entry.");
    return;
  }
  if (byPostcode[pc]) {
    fail("STALE    NARRATIVE_POSTCODES names " + pc + ", which is now a real branches.json postcode (" +
      byPostcode[pc].id + "). Remove the entry: it is excusing a value that no longer needs excusing.");
  }
});

NARRATIVE_FILES.forEach(function (f) {
  if (!fs.existsSync(path.join(ROOT, f))) {
    fail("STALE    NARRATIVE_FILES names " + f + ", which is not in the repo. Remove the entry or restore the file.");
  }
});

if (VERBOSE) {
  console.log("Postcodes found:");
  Object.keys(seenPostcodes).sort().forEach(function (pc) {
    var b = byPostcode[pc];
    console.log("  " + pc + "  " + (b ? b.id : "(not in branches.json)") + "  " + seenPostcodes[pc].length + " file(s)");
  });
  console.log("");
}

warnings.forEach(function (w) { console.log("WARN  " + w); });
failures.forEach(function (f) { console.log(f); });

console.log("\n" + filesScanned + " text files scanned, " +
  Object.keys(seenPostcodes).length + " distinct postcode(s), " +
  branches.filter(function (b) { return !b.disposed; }).length + " live branches: " +
  failures.length + " failure(s), " + warnings.length + " warning(s).");
process.exit(failures.length ? 1 : 0);
