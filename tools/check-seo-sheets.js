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

  The INDEX sheets, added 2026-08-13 on the item 3.7 quality pass
  ---------------------------------------------------------------
  Until then this file read a NAMED list of six *-SEO.md sheets. The estate
  writes the same two Weebly fields TWICE more: the five *INDEX.md paste
  manifests carry "SEO title" and "SEO description" for 163 of the 177
  pages, under different labels, pointing at the page with a backticked slug
  instead of a permalink. Those 163 pairs were compared to nothing. A person
  pasting works from whichever sheet is open in front of them, so a wrong
  title in an INDEX sheet reached the Weebly SEO field with no checker in
  between.

  Proved by injection rather than by reading. The service INDEX.md row for
  uti-treatment-smartts-bootle was changed to "UTI treatment in Aintree -
  Hirshmans Pharmacy": another branch, another brand, another town, on a
  Smartts page. All 30 checkers passed. With the rule below it fails here,
  and the injection was reverted with git checkout before anything else was
  done.

  Sheets are now DISCOVERED rather than named, and each block is sorted into
  one of two dialects by the labels it uses. The 14 contraception pages have
  no INDEX row because no CONTRACEPTION-INDEX.md exists; they are covered by
  CONTRACEPTION-SEO.md, so a missing INDEX row is counted and reported
  rather than failed, while an INDEX sheet that parses to zero rows fails.

  Run:  node tools/check-seo-sheets.js
  Exits 1 on any failure.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

var PAGE_DIRS = [
  path.join(ROOT, "modules", "service", "pages"),
  path.join(ROOT, "modules", "switch", "pages"),
  path.join(ROOT, "modules", "branch", "pages")
];

// Sheets are DISCOVERED, not named, for the reason check-em-dashes.js was
// changed on 2026-08-11: a named list stops covering the day a generator
// adds a sheet, and says nothing when it does. Every *.md in a pages folder
// is read and sorted into one of the two dialects below by the labels it
// uses. A folder that yields no sheet at all fails, so the rule cannot
// quietly stop covering either.
function discoverSheets() {
  var out = [];
  PAGE_DIRS.forEach(function (dir) {
    if (!fs.existsSync(dir)) return;
    var found = fs.readdirSync(dir).filter(function (f) { return /\.md$/i.test(f); });
    if (!found.length) {
      failures.push(rel(dir) + ": no paste sheet in this pages folder, so nothing here is compared to its pages");
    }
    found.sort().forEach(function (f) { out.push(path.join(dir, f)); });
  });
  return out;
}

function rel(p) { return path.relative(ROOT, p).replace(/\\/g, "/"); }
function norm(s) { return (s || "").replace(/\s+/g, " ").trim(); }

// ---------------------------------------------------------------------------
// Parse the paste sheets. Every entry is a "## <heading>" block carrying
// "- **Page Title:**", "- **Page Permalink:**" and "- **Page Description:**".
// ---------------------------------------------------------------------------
var entries = {};   // permalink -> { title, desc, sheet, heading }   SEO dialect
var idxEntries = {};// slug      -> { title, desc, sheet, heading }   INDEX dialect
var failures = [];
var sheetCount = 0;
var idxCount = 0;
var idxSheetRows = {};

var SHEETS = discoverSheets();

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
    var store = cur.dialect === "index" ? idxEntries : entries;
    if (store[cur.permalink]) {
      failures.push(rel(sheetPath) + ": permalink " + cur.permalink + " is also listed in " + store[cur.permalink].sheet + " - a paster would not know which block to use");
    } else {
      store[cur.permalink] = { title: cur.title, desc: cur.desc, sheet: rel(sheetPath), heading: cur.heading };
      if (cur.dialect === "index") {
        idxCount++;
        idxSheetRows[rel(sheetPath)] = (idxSheetRows[rel(sheetPath)] || 0) + 1;
      } else {
        sheetCount++;
      }
    }
    cur = null;
  }

  lines.forEach(function (line) {
    var m;
    if (/^##\s+/.test(line)) {
      flush();
      cur = { heading: norm(line.replace(/^##\s+/, "")), title: "", permalink: "", desc: "", dialect: "seo" };
      return;
    }
    if (!cur) return;
    // SEO dialect: the *-SEO.md sheets.
    if ((m = /^-\s+\*\*Page Title:\*\*\s*(.*)$/.exec(line))) cur.title = norm(m[1]);
    else if ((m = /^-\s+\*\*Page Permalink:\*\*\s*(.*)$/.exec(line))) cur.permalink = norm(m[1]).replace(/\.html$/, "");
    else if ((m = /^-\s+\*\*Page Description:\*\*\s*(.*)$/.exec(line))) cur.desc = norm(m[1]);
    // INDEX dialect: the *INDEX.md sheets write the SAME two Weebly fields
    // under different labels, and point at the page with a backticked slug
    // rather than a permalink. The slug is taken from the backticks alone:
    // the switch sheet writes a non-ASCII arrow after it and the service
    // sheet writes "->", so anything that reads past the closing backtick
    // covers one sheet and silently drops the other.
    else if ((m = /^-\s+\*\*SEO title:\*\*\s*(.*)$/i.exec(line))) { cur.title = norm(m[1]); cur.dialect = "index"; }
    else if ((m = /^-\s+\*\*SEO description:\*\*\s*(.*)$/i.exec(line))) { cur.desc = norm(m[1]); cur.dialect = "index"; }
    else if ((m = /^-\s+\*\*Page slug \/ URL:\*\*\s*`([^`]+?)(?:\.html)?`/i.exec(line))) { cur.permalink = norm(m[1]); cur.dialect = "index"; }
  });
  flush();
});

// ---------------------------------------------------------------------------
// Walk the generated pages and compare.
// ---------------------------------------------------------------------------
var seen = {};
var idxSeen = {};
var idxCompared = 0;
var idxMissing = 0;
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

    // The INDEX sheets carry a SECOND pasteable copy of the same two Weebly
    // fields. Nothing compared them to the page until 2026-08-13, so a wrong
    // title there reached the person doing the pasting with no checker in
    // between. Compared where a row exists; 14 contraception pages have no
    // INDEX row because no CONTRACEPTION-INDEX.md exists, and they are
    // covered by CONTRACEPTION-SEO.md above, so a missing row is counted and
    // reported rather than failed.
    var ie = idxEntries[slug];
    if (ie) {
      idxCompared++;
      if (pageTitle !== null && ie.title && pageTitle !== ie.title) {
        failures.push(slug + ": title drift against the INDEX sheet\n         page  : " + pageTitle + "\n         index : " + ie.title + "  (" + ie.sheet + ")");
      }
      if (pageDesc !== null && ie.desc && pageDesc !== ie.desc) {
        failures.push(slug + ": description drift against the INDEX sheet\n         page  : " + pageDesc + "\n         index : " + ie.desc + "  (" + ie.sheet + ")");
      }
      idxSeen[slug] = true;
    } else {
      idxMissing++;
    }

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

Object.keys(idxEntries).sort().forEach(function (slug) {
  if (!idxSeen[slug]) {
    failures.push(idxEntries[slug].sheet + ": lists " + slug + " but no such page is generated, so the paster would be sent to a page that does not exist");
  }
});

// An INDEX sheet that parses to nothing is the failure this rule is meant to
// prevent: it would read as "clean" while covering not one line.
Object.keys(idxSheetRows).forEach(function (s) {
  if (!idxSheetRows[s]) failures.push(s + ": parsed to zero rows, so nothing in it was compared to any page");
});
SHEETS.forEach(function (s) {
  var r = rel(s);
  if (/INDEX\.md$/i.test(r) && !idxSheetRows[r]) {
    failures.push(r + ": an INDEX sheet that yielded no comparable row, so nothing in it was compared to any page");
  }
});

console.log("check-seo-sheets");
console.log("  " + sheetCount + " SEO-sheet entries and " + idxCount + " INDEX-sheet entries across " + SHEETS.length + " discovered sheets");
console.log("  " + pageCount + " generated pages compared");
console.log("  " + idxCompared + " pages also compared against an INDEX sheet, " + idxMissing + " with no INDEX row (the contraception family has no INDEX sheet)\n");

if (failures.length) {
  failures.forEach(function (f) { console.log("  FAIL " + f); });
  console.log("\ncheck-seo-sheets: " + failures.length + " failure(s).");
  process.exit(1);
}
console.log("check-seo-sheets: clean, every page and its paste sheet agree.");
process.exit(0);
