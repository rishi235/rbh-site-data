"use strict";
// Independent sixth-pass verification of item 3.2 (Scorah Chemists Bramhall
// and Hazel Grove). Imports nothing from tools/ - own regexes throughout, so
// this cannot pass merely because it agrees with the checker under test.
var fs = require("fs");
var path = require("path");
var ROOT = path.join(__dirname, "..", "..", "..", "mnt", "rbh-site-data");
var data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));

var branches = {};
data.branches.forEach(function(b){ if(!b.disposed) branches[b.id]=b; });
var bramhall = branches.scorah_bramhall || Object.values(branches).find(b=>b.brandSlug==="scorah"&&b.townSlug==="bramhall");
var hazel = Object.values(branches).find(b=>b.brandSlug==="scorah"&&b.townSlug==="hazel-grove");
if(!bramhall || !hazel){ console.log("FAIL could not resolve both Scorah branches"); process.exit(1); }

var liveSeoTowns = {};
Object.values(branches).forEach(function(b){ if(b.seoTown) (liveSeoTowns[b.seoTown]=liveSeoTowns[b.seoTown]||[]).push(b.id); });

var DIRS = [
  path.join(ROOT,"modules","service","pages"),
  path.join(ROOT,"modules","switch","pages"),
  path.join(ROOT,"modules","branch","pages")
];

var files = [];
DIRS.forEach(function(d){
  fs.readdirSync(d).filter(f=>/scorah-(bramhall|hazel-grove)\.html$/.test(f)).forEach(function(f){
    files.push(path.join(d,f));
  });
});

var fails = 0, checked = 0;
function report(f, msg){ console.log("FAIL " + path.basename(f) + ": " + msg); fails++; }

files.forEach(function(fp){
  var file = path.basename(fp);
  var html = fs.readFileSync(fp, "utf8");
  var branch = /hazel-grove\.html$/.test(file) ? hazel : bramhall;
  var otherBranch = branch === bramhall ? hazel : bramhall;
  checked++;

  // count title lines
  var titleLines = (html.match(/Weebly page SEO title:/g)||[]).length;
  var descLines = (html.match(/Weebly page SEO description:/g)||[]).length;
  var h1Count = (html.match(/<h1[^>]*>/gi)||[]).length;
  if (titleLines !== 1) report(fp, titleLines + " SEO title lines (expected 1)");
  if (descLines !== 1) report(fp, descLines + " SEO description lines (expected 1)");
  if (h1Count !== 1) report(fp, h1Count + " h1 elements (expected 1)");

  var tm = /Weebly page SEO title:\s*(.+?)\s*$/m.exec(html);
  var dm = /Weebly page SEO description:\s*(.+?)\s*$/m.exec(html);
  var hm = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html);
  var title = tm ? tm[1].trim() : null;
  var desc = dm ? dm[1].trim() : null;
  var h1 = hm ? hm[1].replace(/\s+/g," ").trim() : null;

  if (title === null) { report(fp, "no SEO title line"); }
  if (desc === null) { report(fp, "no SEO description line"); }
  if (h1 === null) { report(fp, "no h1"); }

  var townRe = new RegExp("(^|[^a-z0-9])" + branch.seoTown.replace(/[.*+?^${}()|[\]\\]/g,"\\$&") + "([^a-z0-9]|$)", "i");
  if (title !== null && !townRe.test(title)) report(fp, "title missing own seoTown '" + branch.seoTown + "': " + title);
  if (desc !== null && !townRe.test(desc)) report(fp, "description missing own seoTown '" + branch.seoTown + "': " + desc);
  if (h1 !== null && !townRe.test(h1)) report(fp, "h1 missing own seoTown '" + branch.seoTown + "': " + h1);

  // description length band
  if (desc !== null && (desc.length < 80 || desc.length > 165)) report(fp, "description length " + desc.length + " outside 80-165: " + desc);
  if (title !== null && title.length > 65) report(fp, "title length " + title.length + " exceeds 65: " + title);

  // cross-town absence: check for sister town not in serviceAreaList
  var areas = (branch.serviceAreaList||[]).map(s=>String(s).toLowerCase());
  var sisterTown = otherBranch.seoTown;
  if (sisterTown && sisterTown !== branch.seoTown) {
    var sisterRe = new RegExp("(^|[^a-z0-9])" + sisterTown.replace(/[.*+?^${}()|[\]\\]/g,"\\$&") + "([^a-z0-9]|$)", "i");
    [["title",title],["description",desc],["h1",h1]].forEach(function(pair){
      var fieldName = pair[0], val = pair[1];
      if (val !== null && sisterRe.test(val)) {
        var excused = areas.indexOf(sisterTown.toLowerCase()) !== -1;
        console.log("NOTE " + file + ": " + fieldName + " names sister town '" + sisterTown + "'" + (excused ? " (excused via serviceAreaList - known pinned case, Q71)" : " ** NOT EXCUSED - this would be a real cross-town leak **"));
        if (!excused) { fails++; }
      }
    });
  }

  // foreign town check (any OTHER live seoTown not own, not sister, not in own serviceAreaList)
  Object.keys(liveSeoTowns).forEach(function(t){
    if (t === branch.seoTown || t === sisterTown) return;
    var re = new RegExp("(^|[^a-z0-9])" + t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&") + "([^a-z0-9]|$)", "i");
    [["title",title],["description",desc],["h1",h1]].forEach(function(pair){
      var val = pair[1];
      if (val !== null && re.test(val) && areas.indexOf(t.toLowerCase()) === -1) {
        report(fp, pair[0] + " names foreign town '" + t + "' not in serviceAreaList: " + val);
      }
    });
  });
});

console.log("\n" + checked + " Scorah pages checked (own extraction, no import from tools/), " + fails + " failures.");
process.exit(fails ? 1 : 0);
