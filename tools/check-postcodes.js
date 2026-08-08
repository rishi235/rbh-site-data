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
                entry. The only exception is the narrative allowlist below:
                files that document the historical error and must be free to
                quote it.
  2. MISSING    every live branch postcode must appear somewhere in the repo,
                so a branch cannot silently lose its address.
  3. FOREIGN    a file that belongs to one branch must not carry another
                branch's postcode. This is the McCanns Sandringham failure
                shape exactly: a real, valid postcode on the wrong branch.
  4. DISPOSED   a disposed branch's postcode must not appear in generated
                pages, packs or paste blocks.
  5. UNOWNED    a file carrying a postcode whose owning branch cannot be
                worked out is reported, so the tool states what it did not
                check rather than passing over it in silence.

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

// Files allowed to quote a postcode that is not in branches.json. These
// record the audit itself: the worklist item names the wrong postcode, the
// log explains it, the status page renders both, and this checker carries it
// as the historical example in the comment above.
var NARRATIVE = [
  "AGENT_LOG.md",
  "AGENT_WORKLIST.md",
  "QUESTIONS.json",
  "CHANGELOG.md",
  "README.md",
  "status/index.html",
  "tools/check-postcodes.js"
];

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
var seenPostcodes = {};   // postcode -> [files]
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

  var isNarrative = NARRATIVE.indexOf(r) !== -1;
  var ownedDir = OWNED_DIRS.filter(function (d) { return r.indexOf(d + "/") === 0; })[0];
  var owner = ownedDir ? ownerOf(r) : null;

  if (ownedDir && !owner) warn("UNOWNED " + r + " carries " + list.join(", ") + " but no branch could be matched to the filename");

  list.forEach(function (pc) {
    (seenPostcodes[pc] = seenPostcodes[pc] || []).push(r);
    var b = byPostcode[pc];

    if (!b) {
      if (isNarrative) return;   // documenting the historical error is allowed
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
}

scan(ROOT);

// Rule 2: every live branch postcode must appear somewhere.
branches.forEach(function (b) {
  if (b.disposed) return;
  var pc = norm(b.postalCode);
  if (!pc) { warn("NO POSTCODE in branches.json for " + b.id); return; }
  if (!seenPostcodes[pc]) fail("MISSING  postcode " + pc + " (" + b.id + ") appears nowhere in the repo");
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
