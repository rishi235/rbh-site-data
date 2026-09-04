/*
  Item 3.2, tenth quality pass, 2026-09-04.

  Independent extraction (own regexes, imports nothing from tools/) proving
  the ONE ANGLE never explicitly proven against Scorah's own 26 pages across
  nine prior passes: which pharmacy each page says it is via data-branch and
  the JSON-LD "name", the two machine-readable identity fields
  tools/check-branch-identity.js exists to guard, and the exact risk shape
  Scorah Bramhall/Hazel Grove sit in (shared brandLabel "Scorah Chemists",
  shared host scorah-chemists.co.uk, distinct branchName). Prior nine passes
  covered title, description, H1, permalink/URL and meta keywords; none read
  data-branch or JSON-LD name.

  Checks per page:
    1. data-branch present and equals the owning branch's branchName (not
       the bare shared brandLabel).
    2. JSON-LD name present and equals the owning branch's branchName (not
       the bare shared brandLabel).
    3. Both fields consistent across every page of the same branch.
    4. Bramhall and Hazel Grove never declare the same JSON-LD name as each
       other (they share a host).
*/
"use strict";
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var branches = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8")).branches;
var bramhall = branches.find(function (b) { return b.id === "scorah_bramhall"; });
var hazel = branches.find(function (b) { return b.id === "scorah_hazel"; });

var dirs = [
  path.join(ROOT, "modules", "service", "pages"),
  path.join(ROOT, "modules", "switch", "pages"),
  path.join(ROOT, "modules", "branch", "pages")
];

var files = [];
dirs.forEach(function (d) {
  fs.readdirSync(d).forEach(function (f) {
    if (/scorah-bramhall\.html$/.test(f) || /scorah-hazel-grove\.html$/.test(f)) {
      files.push(path.join(d, f));
    }
  });
});

function dataBranch(html) {
  var root = /<div id="rbhs[vw]-root"([^>]*)>/.exec(html);
  if (!root) return undefined;
  var m = /data-branch="([^"]*)"/.exec(root[1]);
  return m ? m[1] : null;
}
function schemaName(html) {
  var m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
  if (!m) return undefined;
  try { return JSON.parse(m[1]).name || null; } catch (e) { return null; }
}

var checks = 0, failures = 0;
var dbByBranch = { scorah_bramhall: {}, scorah_hazel: {} };
var snByBranch = { scorah_bramhall: {}, scorah_hazel: {} };

files.forEach(function (f) {
  var html = fs.readFileSync(f, "utf8");
  var isBramhall = /scorah-bramhall\.html$/.test(f);
  var b = isBramhall ? bramhall : hazel;
  var rel = path.relative(ROOT, f).replace(/\\/g, "/");

  var db = dataBranch(html);
  checks++;
  if (db === undefined) {
    console.log("SKIP (no module root) " + rel);
  } else if (db !== b.branchName) {
    failures++;
    console.log("FAIL data-branch " + rel + ": \"" + db + "\" (expected \"" + b.branchName + "\")");
  } else {
    dbByBranch[b.id][db] = true;
  }

  var sn = schemaName(html);
  checks++;
  if (sn === undefined) {
    failures++;
    console.log("FAIL no JSON-LD block " + rel);
  } else if (sn !== b.branchName) {
    failures++;
    console.log("FAIL JSON-LD name " + rel + ": \"" + sn + "\" (expected \"" + b.branchName + "\")");
  } else {
    snByBranch[b.id][sn] = true;
  }
});

// Consistency within each branch.
["scorah_bramhall", "scorah_hazel"].forEach(function (id) {
  checks++;
  var dbVals = Object.keys(dbByBranch[id]);
  if (dbVals.length > 1) { failures++; console.log("FAIL " + id + " data-branch inconsistent: " + dbVals.join(", ")); }
  checks++;
  var snVals = Object.keys(snByBranch[id]);
  if (snVals.length > 1) { failures++; console.log("FAIL " + id + " JSON-LD name inconsistent: " + snVals.join(", ")); }
});

// Cross-branch collision.
checks++;
var bramhallNames = Object.keys(snByBranch.scorah_bramhall);
var hazelNames = Object.keys(snByBranch.scorah_hazel);
var collide = bramhallNames.filter(function (n) { return hazelNames.indexOf(n) !== -1; });
if (collide.length) { failures++; console.log("FAIL Bramhall and Hazel Grove share JSON-LD name(s): " + collide.join(", ")); }

console.log("");
console.log(files.length + " Scorah pages read, " + checks + " checks, " + failures + " failure(s)");
console.log("Bramhall branchName: \"" + bramhall.branchName + "\", brandLabel: \"" + bramhall.brandLabel + "\"");
console.log("Hazel Grove branchName: \"" + hazel.branchName + "\", brandLabel: \"" + hazel.brandLabel + "\"");
process.exit(failures ? 1 : 0);
