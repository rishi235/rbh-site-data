/*
  check-editor-snapshot.js

  WHY THIS EXISTS
  tools/branches-editor.html is the tool CLAUDE.md points people at for
  editing branches.json, and it carries a full embedded copy of branches.json
  inside itself (const DATA) as its starting snapshot. If someone edits and
  downloads without loading the real file first, they export the snapshot
  plus their change, silently reverting everything done since the snapshot
  was taken. Worse, the download stamps today's date into lastUpdated, so a
  stale export looks like the newest file.

  Found by the item 3.3 quality pass on 2026-08-09, raised as Q12. Whatever
  Rishi decides about the editor's behaviour, this checker makes the drift
  loud instead of silent: if the snapshot and the canonical file disagree,
  the run fails and says exactly which keys differ.

  Exit code 1 on any drift.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var EDITOR = path.join(ROOT, "tools", "branches-editor.html");

var live = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));
var html = fs.readFileSync(EDITOR, "utf8");

var m = html.match(/const DATA = (\{[\s\S]*?\n\});/);
if (!m) {
  console.log("check-editor-snapshot");
  console.log("  FAIL  could not find the embedded 'const DATA = {...};' " +
    "snapshot in tools/branches-editor.html. If the snapshot was " +
    "deliberately removed (Q12 option 2), delete this checker too.");
  process.exit(1);
}

var snap;
try {
  snap = JSON.parse(m[1]);
} catch (err) {
  console.log("check-editor-snapshot");
  console.log("  FAIL  the embedded snapshot is not valid JSON: " + err.message);
  process.exit(1);
}

var problems = [];

if (snap.lastUpdated !== live.lastUpdated) {
  problems.push('lastUpdated: snapshot "' + snap.lastUpdated +
    '", branches.json "' + live.lastUpdated + '"');
}
if ((snap.branches || []).length !== live.branches.length) {
  problems.push("branch count: snapshot " + (snap.branches || []).length +
    ", branches.json " + live.branches.length);
}

// Field-level comparison so the message names the branch and key, not just
// "they differ".
var snapById = {};
(snap.branches || []).forEach(function (b) { snapById[b.id] = b; });

live.branches.forEach(function (b) {
  var s = snapById[b.id];
  if (!s) {
    problems.push(b.id + ": present in branches.json, missing from the snapshot");
    return;
  }
  Object.keys(b).forEach(function (k) {
    if (JSON.stringify(b[k]) !== JSON.stringify(s[k])) {
      problems.push(b.id + "." + k + ': snapshot ' + JSON.stringify(s[k]) +
        ", branches.json " + JSON.stringify(b[k]));
    }
  });
  Object.keys(s).forEach(function (k) {
    if (!(k in b)) {
      problems.push(b.id + "." + k + ": in the snapshot only, removed from branches.json");
    }
  });
});

Object.keys(snapById).forEach(function (id) {
  if (!live.branches.some(function (b) { return b.id === id; })) {
    problems.push(id + ": in the snapshot only, not in branches.json");
  }
});

console.log("check-editor-snapshot");
console.log("  embedded snapshot: " + (snap.branches || []).length +
  " branches, lastUpdated " + snap.lastUpdated);
console.log("  branches.json:     " + live.branches.length +
  " branches, lastUpdated " + live.lastUpdated);

if (problems.length) {
  console.log("");
  problems.slice(0, 40).forEach(function (p) { console.log("  DRIFT  " + p); });
  if (problems.length > 40) {
    console.log("  ...and " + (problems.length - 40) + " more.");
  }
  console.log("");
  console.log("check-editor-snapshot: " + problems.length + " difference(s). " +
    "Refresh the const DATA block in tools/branches-editor.html from " +
    "branches.json, or the next person to export from the editor will " +
    "revert the newer file.");
  process.exit(1);
}

console.log("");
console.log("check-editor-snapshot: clean, the editor's snapshot matches branches.json.");
