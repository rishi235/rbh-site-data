#!/usr/bin/env node
/*
  Item 5.2 quality pass (twelfth, 2026-09-06). NEW ANGLE: eleven prior passes on
  this item have proved several checkers by injection against these six branch
  landing pages, but tools/check-nap.js - the estate's only checker that reads a
  phone, postcode, email, name and street against branches.json at all, and the
  one CLAUDE.md itself devotes the longest dedicated section to - had only ever
  been exercised against these six pages via a HOME-GROWN re-implementation (the
  eighth pass, 2026-09-02, "own regexes", never actually invoking check-nap.js
  itself). Per this repo's own repeated lesson ("a checker reading is not the
  same as a checker being proven"), that is not the same claim. This script
  invokes the REAL tools/check-nap.js as a child process against six single,
  independently-restored injections, one per landing page, each targeting a
  distinct mechanism inside check-nap.js that a home-grown script cannot stand
  in for:

    1. pharmacy-fishlocks-ainsdale.html   - JSON-LD telephone swapped to a
       foreign branch's phone (direct JSON-LD field comparison).
    2. pharmacy-fishlocks-eccleston.html  - mailto href swapped to a foreign
       branch's real inbox, visible text left alone (mailto OWNERSHIP check).
    3. pharmacy-mccanns-aigburth.html     - a foreign branch's postcode
       inserted into hero-sub body copy in LOWER CASE (the case-insensitive
       foreign-postcode sweep, added 2026-08-14 after proving the upper-case
       sweep alone misses it).
    4. pharmacy-mccanns-sandringham.html  - a foreign branch's phone inserted
       into hero-sub body copy in an unusual dotted-separator shape, nowhere
       near "Call" or a tel: href (the PHONE_RE sweep, not the narrow
       tel:/Call readers).
    5. pharmacy-scorah-bramhall.html      - a foreign branch's brandLabel
       named in hero-sub body copy (the NAME SWEEP, case-insensitive).
    6. pharmacy-scorah-hazel-grove.html   - a foreign branch's street address,
       ABBREVIATED ("Rd" for "Road"), inserted into hero-sub body copy (the
       STREET SWEEP's abbreviation tolerance).

  Discipline, matching the ninth/tenth/eleventh passes on this item: refuses to
  run if any target already carries a git diff; takes a sha256 of each target
  before any mutation; restores each target from an in-memory buffer
  immediately after capturing check-nap.js's own subprocess output and before
  any assertion is printed; sha256-reconfirms byte-identical after every
  restoration; only one target is mutated at a time; nothing is committed by
  this script.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync, execFileSync } = require("child_process");

// Run with cwd already set to the repo root (this script may live outside
// the repo, e.g. a temp path, so __dirname cannot be trusted for ROOT).
const ROOT = process.cwd();
if (!fs.existsSync(path.join(ROOT, "branches.json")))
  throw new Error("Run this from the repo root (C:\\Dev\\rbh-site-data): branches.json not found in " + ROOT);

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

const DIR = path.join(ROOT, "modules", "branch", "pages");
const targets = [
  "pharmacy-fishlocks-ainsdale.html",
  "pharmacy-fishlocks-eccleston.html",
  "pharmacy-mccanns-aigburth.html",
  "pharmacy-mccanns-sandringham.html",
  "pharmacy-scorah-bramhall.html",
  "pharmacy-scorah-hazel-grove.html",
].map((f) => path.join(DIR, f));

// Refuse to run if any target already carries a git diff.
const porcelain = execSync("git status --porcelain -- modules/branch/pages", { cwd: ROOT, encoding: "utf8" });
if (porcelain.trim()) {
  console.log("REFUSING TO RUN: modules/branch/pages already carries a git diff:\n" + porcelain);
  process.exit(1);
}

const originals = {};
for (const t of targets) originals[t] = fs.readFileSync(t, "utf8");

function runCheckNap() {
  try {
    const out = execFileSync("node", ["tools/check-nap.js"], { cwd: ROOT, encoding: "utf8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function restore(file) {
  fs.writeFileSync(file, originals[file], "utf8");
  const now = sha256(fs.readFileSync(file, "utf8"));
  const want = sha256(originals[file]);
  if (now !== want) throw new Error("RESTORE FAILED for " + file + ": sha256 mismatch");
}

function inject(file, from, to) {
  const cur = fs.readFileSync(file, "utf8");
  if (!cur.includes(from)) throw new Error("injection anchor not found in " + file + ": " + from);
  fs.writeFileSync(file, cur.replace(from, to), "utf8");
}

let allCaught = true;
const results = [];

function round(label, file, from, to, expectSubstr) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  console.log("\n=== " + label + " (" + rel + ") ===");
  const beforeSha = sha256(fs.readFileSync(file, "utf8"));
  inject(file, from, to);
  const r = runCheckNap();
  const lines = r.out.split(/\r?\n/).filter((l) => l.includes(path.basename(file)));
  const caught = lines.some((l) => l.includes(expectSubstr));
  console.log("check-nap.js exit code: " + r.code);
  console.log("Lines mentioning this file:\n" + (lines.join("\n") || "(none)"));
  console.log(caught ? "CAUGHT (expected substring found)" : "*** NOT CAUGHT ***");
  restore(file);
  const afterSha = sha256(fs.readFileSync(file, "utf8"));
  console.log("Restored byte-identical: " + (afterSha === beforeSha));
  if (!caught || afterSha !== beforeSha) allCaught = false;
  results.push({ label, file: rel, caught, restoredOk: afterSha === beforeSha });
}

// 1. Fishlocks Ainsdale - JSON-LD telephone swapped to SK Chemists Bootle's phone.
round(
  "1. JSON-LD telephone mismatch",
  targets[0],
  '"telephone": "01704 575478",',
  '"telephone": "0151 944 1013",',
  'JSON-LD telephone'
);

// 2. Fishlocks Eccleston - mailto href swapped to Smartts Bootle's real inbox.
round(
  "2. mailto ownership mismatch",
  targets[1],
  'mailto:Eccleston@rbhealth.co.uk',
  'mailto:Smartts@rbhealth.co.uk',
  'mailto'
);

// 3. McCanns Aigburth - Scorah Bramhall's postcode, lower case, in hero-sub body copy.
round(
  "3. foreign postcode, lower case, body copy",
  targets[2],
  " Call in, phone us or book online.</p>",
  " Call in, phone us or book online. Our sister pharmacy near sk7 3lq can also help.</p>",
  "postcode"
);

// 4. McCanns Sandringham - Fishlocks Ainsdale's phone, dotted shape, body copy.
round(
  "4. foreign phone, dotted separator, body copy",
  targets[3],
  " Call in, phone us or book online.</p>",
  " Call in, phone us or book online. Our sister branch can be reached on 01704.575.478 too.</p>",
  "phone"
);

// 5. Scorah Bramhall - Smartts Chemist's brand name in hero-sub body copy.
round(
  "5. foreign brand name, body copy",
  targets[4],
  " Call in, phone us or book online.</p>",
  " Call in, phone us or book online. You can also visit Smartts Chemist for this service.</p>",
  "another pharmacy"
);

// 6. Scorah Hazel Grove - Smartts Chemist's street, abbreviated, body copy.
round(
  "6. foreign street, abbreviated, body copy",
  targets[5],
  " Call in, phone us or book online.</p>",
  " Call in, phone us or book online. Our sister branch is at 42 Fernhill Rd.</p>",
  "street address"
);

console.log("\n=== SUMMARY ===");
console.log(JSON.stringify(results, null, 2));

// Final safety net: confirm every target is byte-identical to its original and
// the tree carries no diff, regardless of the per-round restore checks above.
for (const t of targets) {
  const now = fs.readFileSync(t, "utf8");
  if (now !== originals[t]) {
    console.log("*** FINAL CHECK FAILED: " + t + " differs from original ***");
    allCaught = false;
  }
}
const finalPorcelain = execSync("git status --porcelain -- modules/branch/pages", { cwd: ROOT, encoding: "utf8" });
console.log("Final git status --porcelain -- modules/branch/pages: " + (finalPorcelain.trim() ? finalPorcelain : "(clean)"));

console.log("\n=== ALL SIX CAUGHT AND RESTORED CLEANLY: " + allCaught + " ===");
process.exit(allCaught ? 0 : 1);
