/*
  tools/check-seo-sheets.js - paste-sheet verifier.

  Why this exists
  ---------------
  tools/check-seo-pattern.js checks the SEO title and description written
  into each generated page's head comment. But the strings that actually
  reach Google are the ones a human types into Weebly > Pages > SEO
  Settings, and those are read off the paste sheets:

      modules/branch/pages/SEO.md
      modules/service/pages/SEO.md
      modules/service/pages/TRAVEL-CLINIC-SEO.md
      modules/service/pages/WEIGHT-LOSS-SEO.md
      modules/switch/pages/SEO.md

  Nothing checked that the sheet and the page agreed. Twice now a generator
  has been found composing the same description twice, once for the page tag
  and once for the sheet, and the two drifted (switch pages, 2026-08-09
  fifteenth run; branch landing pages, sixteenth run). Both were fixed by
  routing the sheet and the page through one helper. This checker makes
  that permanent: if a generator ever composes a title or description twice
  and the two disagree, the run fails here.

  It also fails on a page with no sheet entry (nothing to paste) and on a
  sheet entry with no page (a paster would be sent to a page that does not
  exist).

  Run:  node tools/check-seo-sheets.js
  Exits 1 on any failure.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

var SHEETS = [
  path.join(ROOT, "modules", "branch", "pages", "SEO.md"),
  path.join(ROOT, "modules", "service", "pages", "SEO.md"),
  path.join(ROOT, "modules", "service", "pages", "CONTRACEPTION-SEO.md"),
  path.join(ROOT, "modules", "service", "pages", "TRAVEL-CLINIC-SEO.md"),
  path.join(ROOT, "modules", "service", "pages", "WEIGHT-LOSS-SEO.md"),
  path.join(ROOT, "modules", "switch", "pages", "SEO.md")
];

var PAGE_DIRS = [
  path.join(ROOT, "modules", "service", "pages"),
  path.join(ROOT, "modules", "switch", "pages"),
  path.join(ROOT, "modules", "branch", "pages")
];

function rel(p) { return path.relative(ROOT, p).replace(/\\/g, "/"); }
function norm(s) { return (s || "").replace(/\s+/g, " ").trim(); }

// ---------------------------------------------------------------------------
// Parse the paste sheets. Every entry is a "## <heading>" block carrying
// "- **Page Title:**", "- **Page Permalink:**" and "- **Page Description:**".
// ---------------------------------------------------------------------------
var entries = {};   // permalink -> { title, desc, sheet, heading }
var failures = [];
var sheetCount = 0;

SHEETS.forEach(function (sheetPath) {
  if (!fs.existsSync(sheetPath)) {
    failures.push("missing paste sheet " + rel(sheetPath));
    return;
  }
  var lines = fs.readFileSync(sheetPath, "utf8").split(/\r?\n/);
  var cur = null;

  function flush() {
    if (!cur) return;
    if (!cur.permalink) {
      if (cur.title || cur.desc) {
        failures.push(rel(sheetPath) + ' block "' + cur.heading + '": has a title or description but no Page Permalink, so it cannot be matched to a page');
      }
      cur = null;
      return;
    }
    if (entries[cur.permalink]) {
      failures.push(rel(sheetPath) + ": permalink " + cur.permalink + " is also listed in " + entries[cur.permalink].sheet + " - a paster would not know which block to use");
    } else {
      entries[cur.permalink] = { title: cur.title, desc: cur.desc, sheet: rel(sheetPath), heading: cur.heading };
      sheetCount++;
    }
    cur = null;
  }

  lines.forEach(function (line) {
    var m;
    if (/^##\s+/.test(line)) {
      flush();
      cur = { heading: norm(line.replace(/^##\s+/, "")), title: "", permalink: "", desc: "" };
      return;
    }
    if (!cur) return;
    if ((m = /^-\s+\*\*Page Title:\*\*\s*(.*)$/.exec(line))) cur.title = norm(m[1]);
    else if ((m = /^-\s+\*\*Page Permalink:\*\*\s*(.*)$/.exec(line))) cur.permalink = norm(m[1]).replace(/\.html$/, "");
    else if ((m = /^-\s+\*\*Page Description:\*\*\s*(.*)$/.exec(line))) cur.desc = norm(m[1]);
  });
  flush();
});

// ---------------------------------------------------------------------------
// Walk the generated pages and compare.
// ---------------------------------------------------------------------------
var seen = {};
var pageCount = 0;

PAGE_DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(function (file) {
    if (!/\.html$/.test(file)) return;
    var slug = file.replace(/\.html$/, "");
    var html = fs.readFileSync(path.join(dir, file), "utf8");
    pageCount++;

    var tm = /Weebly page SEO title:\s*(.+?)\s*$/m.exec(html);
    var dm = /Weebly page SEO description:\s*(.+?)\s*$/m.exec(html);
    var pageTitle = tm ? norm(tm[1]) : null;
    var pageDesc = dm ? norm(dm[1]) : null;

    var e = entries[slug];
    if (!e) {
      failures.push(slug + ".html: no entry in any paste sheet, so there is nothing to paste into its Weebly SEO fields");
      return;
    }
    seen[slug] = true;

    if (pageTitle === null) {
      failures.push(slug + ".html: no 'Weebly page SEO title' line in the page");
    } else if (pageTitle !== e.title) {
      failures.push(slug + ": title drift\n         page  : " + pageTitle + "\n         sheet : " + e.title + "  (" + e.sheet + ")");
    }

    if (pageDesc === null) {
      failures.push(slug + ".html: no 'Weebly page SEO description' line in the page");
    } else if (pageDesc !== e.desc) {
      failures.push(slug + ": description drift\n         page  : " + pageDesc + "\n         sheet : " + e.desc + "  (" + e.sheet + ")");
    }
  });
});

Object.keys(entries).sort().forEach(function (slug) {
  if (!seen[slug]) {
    failures.push(entries[slug].sheet + ": lists " + slug + " but no such page is generated, so the paster would be sent to a page that does not exist");
  }
});

console.log("check-seo-sheets");
console.log("  " + sheetCount + " paste-sheet entries across " + SHEETS.length + " sheets");
console.log("  " + pageCount + " generated pages compared\n");

if (failures.length) {
  failures.forEach(function (f) { console.log("  FAIL " + f); });
  console.log("\ncheck-seo-sheets: " + failures.length + " failure(s).");
  process.exit(1);
}
console.log("check-seo-sheets: clean, every page and its paste sheet agree.");
process.exit(0);
