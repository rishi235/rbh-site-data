/*
  audits/fishlocks-independent-2026-08-13.js - item 3.3 quality pass, third pass.

  Independent extraction, written fresh for this run. It deliberately shares NO
  code with tools/: its own regexes, its own service-word lists, its own copy of
  the expected town/phone facts read straight from branches.json. The point is
  to agree with the checkers by arriving separately, not by calling them.

  Read-only. Prints a report and exits 1 on any finding.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));

var FISH = data.branches.filter(function (b) {
  return !b.disposed && /^fishlocks$/i.test(b.brandSlug || "");
});

var DIRS = ["modules/branch/pages", "modules/service/pages", "modules/switch/pages"]
  .map(function (d) { return path.join(ROOT, d); });

// Own service-word table, keyed off the filename prefix. Written here by hand
// rather than imported, so a wrong list in tools/ cannot make this agree.
function serviceWordsFor(file) {
  if (/^pharmacy-first-/.test(file)) return ["pharmacy first"];
  if (/^contraception-/.test(file)) return ["contraception", "contraceptive"];
  if (/^weight-loss-clinic-/.test(file)) return ["weight loss"];
  if (/^travel-clinic-/.test(file)) return ["travel"];
  if (/^switch-prescriptions-/.test(file)) return ["prescription"];
  if (/-treatment-/.test(file)) return ["treatment"];
  if (/^pharmacy-/.test(file)) return ["pharmacy"];
  return null;
}

var findings = [];
var rows = [];
var townsLive = {};
data.branches.forEach(function (b) {
  if (b.disposed || !b.seoTown) return;
  townsLive[b.seoTown] = true;
});

FISH.forEach(function (br) {
  var suffix = "-" + br.brandSlug + "-" + br.townSlug + ".html";
  var sister = FISH.filter(function (o) { return o.id !== br.id; })[0];

  DIRS.forEach(function (dir) {
    fs.readdirSync(dir).forEach(function (file) {
      if (file.slice(-suffix.length) !== suffix) return;
      var html = fs.readFileSync(path.join(dir, file), "utf8");

      // Own extraction. Deliberately different expressions from the checkers'.
      var title = (html.match(/^.*Weebly page SEO title:[ \t]*(.*?)[ \t]*$/m) || [])[1] || null;
      var desc = (html.match(/^.*Weebly page SEO description:[ \t]*(.*?)[ \t]*$/m) || [])[1] || null;
      var h1all = html.match(/<h1[\s>][\s\S]*?<\/h1>/gi) || [];
      var h1 = h1all.length
        ? h1all[0].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
        : null;

      var sw = serviceWordsFor(file);
      var why = [];

      if (!title) why.push("no SEO title line");
      if (!desc) why.push("no SEO description line");
      if (!h1) why.push("no H1");
      if (h1all.length !== 1) why.push("expected exactly 1 H1, found " + h1all.length);
      if (!sw) why.push("this audit cannot type the file, so it asserts nothing");

      // Own town, all three public strings.
      [["title", title], ["h1", h1], ["description", desc]].forEach(function (p) {
        if (p[1] && p[1].toLowerCase().indexOf(br.seoTown.toLowerCase()) === -1) {
          why.push(p[0] + " missing own seoTown '" + br.seoTown + "'");
        }
      });

      // Service words, all three legs.
      if (sw) {
        [["title", title], ["h1", h1], ["description", desc]].forEach(function (p) {
          if (!p[1]) return;
          var low = p[1].toLowerCase();
          var hit = sw.some(function (w) { return low.indexOf(w) !== -1; });
          if (!hit) why.push(p[0] + " carries none of the service words (" + sw.join("/") + ")");
        });
      }

      // Sister town, and any other live seoTown, in the three public strings.
      var areas = (br.serviceAreaList || []).map(function (s) { return s.toLowerCase(); });
      [["title", title], ["h1", h1], ["description", desc]].forEach(function (p) {
        if (!p[1]) return;
        Object.keys(townsLive).forEach(function (t) {
          if (t === br.seoTown) return;
          if (areas.indexOf(t.toLowerCase()) !== -1) return;
          if (new RegExp("(^|[^a-z0-9])" + t + "([^a-z0-9]|$)", "i").test(p[1])) {
            why.push(p[0] + " names other live seoTown '" + t + "'");
          }
        });
      });

      // Description window.
      if (desc && (desc.length < 80 || desc.length > 165)) {
        why.push("description " + desc.length + " chars, outside 80 to 165");
      }

      // Phone: this branch's number present, the sister's absent.
      var digits = html.replace(/[^0-9]/g, "");
      var mine = br.phone.replace(/[^0-9]/g, "");
      var theirs = sister ? sister.phone.replace(/[^0-9]/g, "") : null;
      if (digits.indexOf(mine) === -1) why.push("own phone " + br.phone + " absent");
      if (theirs && digits.indexOf(theirs) !== -1) why.push("sister phone " + sister.phone + " present");

      // Postcode: own present, sister's absent.
      if (html.indexOf(br.postalCode) === -1) why.push("own postcode " + br.postalCode + " absent");
      if (sister && html.indexOf(sister.postalCode) !== -1) {
        why.push("sister postcode " + sister.postalCode + " present");
      }

      rows.push({
        file: file, town: br.seoTown, titleLen: title ? title.length : 0,
        descLen: desc ? desc.length : 0, ok: why.length === 0
      });
      if (why.length) findings.push(file + " [" + br.seoTown + "]: " + why.join("; "));
    });
  });
});

rows.sort(function (a, b) { return a.file < b.file ? -1 : 1; });
console.log("Fishlocks independent extraction, " + rows.length + " pages");
FISH.forEach(function (b) {
  var n = rows.filter(function (r) { return r.town === b.seoTown; }).length;
  console.log("  " + b.seoTown + ": " + n + " pages (host " + b.website + ")");
});
var tl = rows.map(function (r) { return r.titleLen; });
var dl = rows.map(function (r) { return r.descLen; });
console.log("  title lengths       " + Math.min.apply(null, tl) + " to " + Math.max.apply(null, tl));
console.log("  description lengths " + Math.min.apply(null, dl) + " to " + Math.max.apply(null, dl));

if (findings.length) {
  console.log("");
  findings.forEach(function (f) { console.log("  FINDING " + f); });
  console.log("\n" + findings.length + " finding(s).");
  process.exit(1);
}
console.log("\nClean: own town, service words and correct phone/postcode on every page; no sister town in title, H1 or description.");
process.exit(0);
