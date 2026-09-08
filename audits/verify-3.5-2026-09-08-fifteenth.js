// Independent extraction: check-jsonld.js's 8 rules, re-derived fresh (no
// import from tools/), against all 12 Hirshmans Chemist (Ainsdale) pages.
var fs = require("fs");
var path = require("path");
var ROOT = "/sessions/beautiful-charming-faraday/mnt/rbh-site-data";
var b = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"))
  .branches.find(function (x) { return x.id === "hirshmans_ainsdale"; });

var files = [
  "modules/service/pages/contraception-hirshmans-ainsdale.html",
  "modules/service/pages/earache-treatment-hirshmans-ainsdale.html",
  "modules/service/pages/impetigo-treatment-hirshmans-ainsdale.html",
  "modules/service/pages/insect-bite-treatment-hirshmans-ainsdale.html",
  "modules/service/pages/pharmacy-first-hirshmans-ainsdale.html",
  "modules/service/pages/shingles-treatment-hirshmans-ainsdale.html",
  "modules/service/pages/sinusitis-treatment-hirshmans-ainsdale.html",
  "modules/service/pages/sore-throat-treatment-hirshmans-ainsdale.html",
  "modules/service/pages/travel-clinic-hirshmans-ainsdale.html",
  "modules/service/pages/uti-treatment-hirshmans-ainsdale.html",
  "modules/service/pages/weight-loss-clinic-hirshmans-ainsdale.html",
  "modules/switch/pages/switch-prescriptions-hirshmans-ainsdale.html"
];

var checks = 0, failures = [];
function tidy(s){return String(s==null?"":s).replace(/\s+/g," ").trim();}

files.forEach(function (rel) {
  var html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  var blocks = [];
  var re = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  var m;
  while ((m = re.exec(html)) !== null) blocks.push(m[1]);
  checks++;
  if (blocks.length !== 1) { failures.push(rel + ": expected 1 JSON-LD block, found " + blocks.length); return; }
  var obj;
  try { obj = JSON.parse(blocks[0]); } catch (e) { failures.push(rel + ": JSON-LD does not parse: " + e.message); return; }

  checks++; if (obj["@type"] !== "Pharmacy") failures.push(rel + ": @type is " + obj["@type"] + ", expected Pharmacy");
  checks++; if (obj["@context"] !== "https://schema.org") failures.push(rel + ": @context wrong");
  checks++; if (obj.name !== b.branchName) failures.push(rel + ": name is " + obj.name + ", expected " + b.branchName);
  checks++; var wantUrl = b.website + "/" + path.basename(rel);
  if (obj.url !== wantUrl) failures.push(rel + ": url is " + obj.url + ", expected " + wantUrl);

  var a = obj.address || {};
  [["streetAddress", b.streetAddress], ["addressLocality", b.addressLocality],
   ["postalCode", b.postalCode], ["addressRegion", b.addressRegion],
   ["addressCountry", b.addressCountry || "GB"]].forEach(function (pair) {
    checks++;
    if (tidy(a[pair[0]]) !== tidy(pair[1])) failures.push(rel + ": address." + pair[0] + " is " + a[pair[0]] + ", expected " + pair[1]);
  });

  checks++; if (tidy(obj.telephone) !== tidy(b.phone)) failures.push(rel + ": telephone mismatch");

  if (obj.email !== undefined) { checks++; if (obj.email !== b.email) failures.push(rel + ": email mismatch"); }
  if (obj.areaServed !== undefined) {
    checks++;
    var got = (Array.isArray(obj.areaServed) ? obj.areaServed : [obj.areaServed]);
    if (got.join(" | ") !== (b.serviceAreaList||[]).join(" | ")) failures.push(rel + ": areaServed mismatch");
  }

  var mapRe = /google\.com\/maps\?q=([^"&]+)/g, mm, maps = [];
  while ((mm = mapRe.exec(html)) !== null) { try { maps.push(decodeURIComponent(mm[1])); } catch(e){ maps.push("__BAD__"); } }
  var wantMap = [b.streetAddress, b.addressLocality, b.postalCode].join(", ");
  checks++;
  if (!maps.length) failures.push(rel + ": no map query found");
  else maps.forEach(function(q){ if (tidy(q).toLowerCase() !== tidy(wantMap).toLowerCase()) failures.push(rel + ": map query is " + q + ", expected " + wantMap); });
});

console.log(checks + " checks, " + failures.length + " failures");
failures.forEach(function(f){ console.log("FAIL " + f); });
process.exit(failures.length ? 1 : 0);
