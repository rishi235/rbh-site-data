/*
  smartts-independent-2026-08-14.js
  Item 3.7 quality pass, FIFTH machine pass. Runs 23, 65, 149 and the
  2026-08-12 pass came before it.

  This file shares no code with tools/. Its own file discovery, its own
  regexes, its own reading of branches.json, its own sheet parser. That is
  the whole point: a checker cannot audit itself, so the fifth reading of
  these 12 pages is written from the data rather than from the checkers.

  COVERAGE IS PROVED BEFORE THE RESULT IS READ. Run 187's lesson is that an
  extractor can pass by finding nothing, so this script exits non-zero if it
  discovers fewer than 12 pages, parses fewer than 20 sheet rows, or runs
  fewer than 2500 checks. A green run therefore means "it looked and found
  nothing", not "it failed to look".

  Pages are found by GLOBBING for the branch slug, never from a list, so a
  page added to the estate and forgotten by a list cannot hide.
*/

var fs = require("fs");
var path = require("path");

var ROOT = path.resolve(__dirname, "..");
var ME = "smartts_bootle";

var checks = 0;
var failures = [];
var notes = [];

function ok(cond, label) {
  checks++;
  if (!cond) failures.push(label);
}

// ---------------------------------------------------------------- data
var data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));
var me = null;
var others = [];
data.branches.forEach(function (b) {
  if (b.id === ME) me = b; else others.push(b);
});
if (!me) { console.error("FATAL: " + ME + " not found in branches.json"); process.exit(2); }

// ---------------------------------------------------------- discovery
function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    var p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && e.name.endsWith(".html")) out.push(p);
  });
  return out;
}

var allPages = walk(path.join(ROOT, "modules"), []).filter(function (p) {
  return path.basename(path.dirname(p)) === "pages";
});
var mine = allPages.filter(function (p) {
  return path.basename(p).indexOf("smartts") !== -1;
});

console.log("PAGES DISCOVERED: " + mine.length + " of " + allPages.length + " generated pages");
mine.forEach(function (p) { console.log("  " + path.relative(ROOT, p)); });

// ------------------------------------------------------------- helpers
function textOf(html) {
  // visible copy only: strip script, style and all tags
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}
function digits(s) { return String(s || "").replace(/[^0-9]/g, ""); }

// ------------------------------------------------------------ per page
var pinCounts = {};
var fragmentLinks = 0;

mine.forEach(function (file) {
  var rel = path.relative(ROOT, file);
  var html = fs.readFileSync(file, "utf8");
  var vis = textOf(html);

  // --- identity: exactly one H1, carrying seoTown
  var h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  ok(h1.length === 1, rel + ": expected exactly 1 h1, found " + h1.length);
  if (h1.length === 1) {
    ok(textOf(h1[0]).indexOf(me.seoTown) !== -1, rel + ": h1 does not carry seoTown " + me.seoTown);
  }

  // --- phone in both shapes, and nobody else's
  ok(vis.indexOf(me.phone) !== -1, rel + ": display phone " + me.phone + " missing");
  ok(html.indexOf("tel:" + digits(me.phone)) !== -1, rel + ": tel: link missing");
  others.forEach(function (b) {
    if (!b.phone) return;                        // head office has an empty phone
    if (digits(b.phone) === digits(me.phone)) return;
    ok(vis.indexOf(b.phone) === -1, rel + ": shows another branch's phone, " + b.phone + " (" + b.id + ")");
    ok(html.indexOf("tel:" + digits(b.phone)) === -1, rel + ": links another branch's tel:, " + b.id);
  });

  // --- address: own street and postcode only
  ok(vis.indexOf(me.streetAddress) !== -1, rel + ": own street missing");
  ok(html.indexOf(me.postalCode) !== -1, rel + ": own postcode missing");
  others.forEach(function (b) {
    if (b.postalCode && b.postalCode !== me.postalCode) {
      ok(html.indexOf(b.postalCode) === -1, rel + ": shows another branch's postcode, " + b.postalCode + " (" + b.id + ")");
    }
    if (b.streetAddress && b.streetAddress !== me.streetAddress) {
      ok(vis.indexOf(b.streetAddress) === -1, rel + ": shows another branch's street, " + b.streetAddress);
    }
  });

  // --- JSON-LD, field by field, including url and name
  var ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  ok(!!ld, rel + ": no JSON-LD block");
  if (ld) {
    var obj = null;
    try { obj = JSON.parse(ld[1]); } catch (e) { obj = null; }
    ok(!!obj, rel + ": JSON-LD does not parse");
    if (obj) {
      var family = path.basename(path.dirname(path.dirname(file)));
      ok(obj["@type"] === "Pharmacy", rel + ': @type is "' + obj["@type"] + '", expected Pharmacy');
      ok(obj.name === me.brandLabel, rel + ': ld name is "' + obj.name + '", expected brandLabel "' + me.brandLabel + '"');
      ok(obj.url === me.website + "/" + path.basename(file),
        rel + ': ld url is "' + obj.url + '", expected "' + me.website + "/" + path.basename(file) + '"');
      ok(digits(obj.telephone) === digits(me.phone), rel + ": ld telephone mismatch");
      var a = obj.address || {};
      ok(a["@type"] === "PostalAddress", rel + ": ld address @type wrong");
      ok(a.streetAddress === me.streetAddress, rel + ": ld streetAddress mismatch");
      ok(a.addressLocality === me.addressLocality, rel + ": ld addressLocality mismatch");
      ok(a.postalCode === me.postalCode, rel + ": ld postalCode mismatch");
      ok(a.addressRegion === me.addressRegion, rel + ": ld addressRegion mismatch");
      ok((a.addressCountry || "GB") === (me.addressCountry || "GB"), rel + ": ld addressCountry mismatch");
      ok(family === "service" || family === "switch", rel + ": unexpected page family " + family);
    }
  }

  // --- no literal widget id anywhere: diaries must resolve at run time
  data.branches.forEach(function (b) {
    Object.keys(b.widgets || {}).forEach(function (k) {
      var id = b.widgets[k];
      if (!id) return;
      ok(html.indexOf(id) === -1, rel + ": carries a literal widget id (" + b.id + "." + k + ")");
    });
  });

  // --- CDN pin: one ref per page, and never two
  var pins = {};
  var pinRe = /cdn\.jsdelivr\.net\/gh\/rishi235\/rbh-site-data@([^\/"']+)\//g;
  var pm;
  while ((pm = pinRe.exec(html))) pins[pm[1]] = true;
  var pinList = Object.keys(pins);
  ok(pinList.length === 1, rel + ": expected exactly 1 pinned ref, found " + pinList.length + " [" + pinList.join(", ") + "]");
  pinList.forEach(function (p) { pinCounts[p] = (pinCounts[p] || 0) + 1; });

  // --- ODS and nhs.net addresses.
  // The first draft of this line read `ok(x === -1 || true, ...)`, which can
  // never fail, under a comment claiming it was "counted below properly". It
  // was not: below only ever checked OTHER branches' codes. Scanning all 177
  // generated pages settled what the real convention is - an ODS code appears
  // on the 6 branch landing pages and nowhere else, 0 of 171 service and
  // switch pages carry one, and no generated page anywhere carries an
  // nhs.net address. Smartts is a single-site brand with no landing page, so
  // the correct assertion for all 12 of its pages is that NO ODS code and no
  // nhs.net address appears, its own included.
  ok(html.indexOf(me.odsCode) === -1,
    rel + ": carries its own ODS code " + me.odsCode + ", but service and switch pages carry none");
  ok(!me.nhsEmail || html.indexOf(me.nhsEmail) === -1,
    rel + ": carries its own nhs.net address, but no generated page in the estate carries one");
  others.forEach(function (b) {
    if (b.odsCode && b.odsCode !== me.odsCode) {
      ok(html.indexOf(b.odsCode) === -1, rel + ": carries another branch's ODS code " + b.odsCode);
    }
    if (b.nhsEmail && b.nhsEmail !== me.nhsEmail) {
      ok(html.indexOf(b.nhsEmail) === -1, rel + ": carries another branch's nhs.net address");
    }
  });

  // --- no other branch's review or Pharmacy First link
  others.forEach(function (b) {
    if (b.googleReviewUrl && b.googleReviewUrl !== me.googleReviewUrl) {
      ok(html.indexOf(b.googleReviewUrl) === -1, rel + ": links another branch's Google review (" + b.id + ")");
    }
    if (b.nhsReviewUrl && b.nhsReviewUrl !== me.nhsReviewUrl) {
      ok(html.indexOf(b.nhsReviewUrl) === -1, rel + ": links another branch's NHS review (" + b.id + ")");
    }
    if (b.pfLink && b.pfLink !== me.pfLink) {
      ok(html.indexOf(b.pfLink) === -1, rel + ": links another branch's Pharmacy First page (" + b.id + ")");
    }
  });

  // --- transport: nothing may be served over http://
  ok(!/(?:href|src)="http:\/\//.test(html), rel + ": has an http:// href or src");

  // --- no other brand named in visible copy
  var brands = {};
  data.branches.forEach(function (b) { if (b.brandLabel) brands[b.brandLabel] = true; });
  Object.keys(brands).forEach(function (label) {
    if (label === me.brandLabel) return;
    if (me.brandLabel.indexOf(label) !== -1 || label.indexOf(me.brandLabel) !== -1) return;
    ok(vis.indexOf(label) === -1, rel + ": names another brand, " + label);
  });

  // --- dashes: none in visible copy, literal or entity
  ok(!/[–—]/.test(vis), rel + ": em or en dash in visible copy");
  ok(html.indexOf("&mdash;") === -1 && html.indexOf("&ndash;") === -1, rel + ": dash entity in markup");

  // --- NEW THIS PASS: every same-page fragment link must hit an id on the
  //     same page. The primary booking CTA is a fragment link, and nothing
  //     in tools/ resolves one: check-service-links strips them by design.
  var ids = {};
  var idRe = /\sid\s*=\s*"([^"]+)"/g;
  var im;
  while ((im = idRe.exec(html))) ids[im[1]] = true;
  var hrefRe = /href\s*=\s*"#([^"]*)"/g;
  var hm;
  while ((hm = hrefRe.exec(html))) {
    if (hm[1] === "") continue;                  // href="#" is JS-driven, not a jump
    fragmentLinks++;
    ok(ids[hm[1]] === true, rel + ": fragment link #" + hm[1] + " has no matching id on the page");
  }
});

// ------------------------------------------------------------- sheets
// The estate writes each page's two Weebly SEO fields THREE times. Run 149
// closed the hole where the INDEX manifests were compared to nothing. This
// re-reads every sheet by DISCOVERY, both label dialects, and checks the
// Smartts rows agree with each other.
var sheetFiles = [];
(function findSheets(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    var p = path.join(dir, e.name);
    if (e.isDirectory()) findSheets(p);
    else if (e.isFile() && /(SEO|INDEX)\.md$/.test(e.name)) sheetFiles.push(p);
  });
})(path.join(ROOT, "modules"));

// Parsed as BLOCKS under each "## " heading, not as an ordered line machine.
// The two dialects order their fields differently - SEO.md writes title,
// permalink, description; INDEX.md writes slug, title, description - and a
// line machine that assumes one order silently yields nothing on the other.
// That is exactly what the coverage gate caught on this script's first run.
var rows = [];
var sheetBlocks = 0;
sheetFiles.forEach(function (sf) {
  var raw = fs.readFileSync(sf, "utf8");
  var rel = path.relative(ROOT, sf);
  raw.split(/\r?\n(?=##\s)/).forEach(function (block) {
    if (!/^##\s/.test(block)) return;
    sheetBlocks++;
    function grab(labels) {
      var re = new RegExp("^\\s*(?:[-*]\\s*)?\\*{0,2}(?:" + labels + ")\\*{0,2}\\s*:\\s*(.+?)\\s*$", "im");
      var m = block.match(re);
      return m ? m[1].replace(/[`*]/g, "").trim() : null;
    }
    var slug = grab("Page slug \\/ URL|Page Permalink|Permalink|Page slug");
    var title = grab("SEO title|Page Title|Meta Title");
    var desc = grab("SEO description|Page Description|Meta Description");
    if (!slug) return;
    // INDEX writes "file.html -> https://host/file.html"; keep the file only
    slug = slug.split("->")[0].trim();
    if (slug.indexOf("smartts") === -1) return;
    rows.push({ sheet: rel, file: slug.replace(/\.html$/, ""), title: title, desc: desc });
  });
});
console.log("SHEET BLOCKS SCANNED: " + sheetBlocks);

console.log("SHEET FILES DISCOVERED: " + sheetFiles.length);
console.log("SMARTTS SHEET ROWS PARSED: " + rows.length);

rows.forEach(function (r) {
  if (r.title) {
    ok(r.title.indexOf(me.seoTown) !== -1, r.sheet + " / " + r.file + ": sheet title omits " + me.seoTown);
    ok(!/[–—]/.test(r.title), r.sheet + " / " + r.file + ": dash in pasteable title");
  }
  if (r.desc) {
    ok(!/[–—]/.test(r.desc), r.sheet + " / " + r.file + ": dash in pasteable description");
    ok(r.desc.length >= 120 && r.desc.length <= 165,
      r.sheet + " / " + r.file + ": description " + r.desc.length + " chars, outside 120-165");
  }
});

// three-way agreement: the same permalink must not carry two different titles
var byFile = {};
rows.forEach(function (r) {
  if (!r.title) return;
  byFile[r.file] = byFile[r.file] || [];
  byFile[r.file].push({ sheet: r.sheet, title: r.title, desc: r.desc });
});
Object.keys(byFile).forEach(function (f) {
  var set = byFile[f];
  var titles = {};
  set.forEach(function (s) { titles[s.title] = true; });
  ok(Object.keys(titles).length === 1,
    f + ": sheets disagree on the SEO title across " + set.length + " writings [" +
    Object.keys(titles).join(" | ") + "]");
});

// --------------------------------------------------------- GBP pack
var packPath = path.join(ROOT, "gbp-packs", "smartts-bootle.md");
if (fs.existsSync(packPath)) {
  var pack = fs.readFileSync(packPath, "utf8");
  // the pasteable half only: the "Notes for the paster" block is instructions
  var pasteable = pack.split(/Notes for the paster/i)[0];
  ok(pasteable.indexOf(me.phone) !== -1, "gbp pack: own phone missing");
  ok(pasteable.indexOf(me.postalCode) !== -1, "gbp pack: own postcode missing");
  ok(pasteable.indexOf(me.streetAddress) !== -1, "gbp pack: own street missing");
  others.forEach(function (b) {
    if (b.postalCode && b.postalCode !== me.postalCode) {
      ok(pasteable.indexOf(b.postalCode) === -1, "gbp pack: another branch's postcode, " + b.postalCode);
    }
    if (b.phone && digits(b.phone) !== digits(me.phone)) {
      ok(pasteable.indexOf(b.phone) === -1, "gbp pack: another branch's phone, " + b.phone);
    }
    if (b.brandLabel && b.brandLabel !== me.brandLabel) {
      ok(pasteable.indexOf(b.brandLabel) === -1, "gbp pack: names another brand, " + b.brandLabel);
    }
  });
  // whole file: ASCII and no dash entity, because a note pasted by mistake is
  // exactly the failure these two rules exist for
  ok(!/[^\x00-\x7F]/.test(pack), "gbp pack: non-ASCII character present");
  ok(pack.indexOf("&mdash;") === -1 && pack.indexOf("&ndash;") === -1, "gbp pack: dash entity");
} else {
  notes.push("no GBP pack found at gbp-packs/smartts-bootle.md");
}

// ------------------------------------------------------------ verdict
console.log("PINS SEEN: " + JSON.stringify(pinCounts));
console.log("FRAGMENT LINKS RESOLVED: " + fragmentLinks);
console.log("CHECKS RUN: " + checks);
console.log("FAILURES: " + failures.length);
failures.forEach(function (f) { console.log("  FAIL " + f); });
notes.forEach(function (n) { console.log("  NOTE " + n); });

// Coverage gates. A green run must have LOOKED.
var gateFail = [];
if (mine.length < 12) gateFail.push("discovered only " + mine.length + " pages, expected at least 12");
if (rows.length < 20) gateFail.push("parsed only " + rows.length + " sheet rows, expected at least 20");
if (checks < 2500) gateFail.push("ran only " + checks + " checks, expected at least 2500");
if (fragmentLinks < 12) gateFail.push("resolved only " + fragmentLinks + " fragment links, expected at least 12");
if (gateFail.length) {
  console.log("COVERAGE GATE FAILED:");
  gateFail.forEach(function (g) { console.log("  " + g); });
  process.exit(3);
}

process.exit(failures.length ? 1 : 0);
