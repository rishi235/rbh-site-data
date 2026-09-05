/*
  audits/verify-3.7-2026-09-05-eleventh.js

  Item 3.7 (Smartts Chemist, Bootle), eleventh quality pass, 2026-09-05.
  Independent fresh extraction, no code shared with tools/ or any prior
  pass's script. Re-derives every expected value from branches.json and
  reads the twelve Smartts pages directly.

  Run: node audits/verify-3.7-2026-09-05-eleventh.js
*/
"use strict";
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));
var branches = data.branches.filter(function (b) { return !b.disposed; });
var smartts = branches.find(function (b) { return b.id === "smartts_bootle"; });
if (!smartts) { console.log("FATAL: smartts_bootle not found in branches.json"); process.exit(1); }

var otherBranches = branches.filter(function (b) { return b.id !== smartts.id; });

var files = [
  "modules/service/pages/contraception-smartts-bootle.html",
  "modules/service/pages/earache-treatment-smartts-bootle.html",
  "modules/service/pages/impetigo-treatment-smartts-bootle.html",
  "modules/service/pages/insect-bite-treatment-smartts-bootle.html",
  "modules/service/pages/pharmacy-first-smartts-bootle.html",
  "modules/service/pages/shingles-treatment-smartts-bootle.html",
  "modules/service/pages/sinusitis-treatment-smartts-bootle.html",
  "modules/service/pages/sore-throat-treatment-smartts-bootle.html",
  "modules/service/pages/travel-clinic-smartts-bootle.html",
  "modules/service/pages/uti-treatment-smartts-bootle.html",
  "modules/service/pages/weight-loss-clinic-smartts-bootle.html",
  "modules/switch/pages/switch-prescriptions-smartts-bootle.html"
];

var checks = 0, flags = [];
function check(cond, msg) {
  checks++;
  if (!cond) flags.push(msg);
}

files.forEach(function (relPath) {
  var full = path.join(ROOT, relPath);
  var html = fs.readFileSync(full, "utf8");
  var label = relPath;

  // Strip the build comment before scanning for em dashes, matching the
  // estate-wide documented exemption (see check-em-dashes.js).
  var noBuildComment = html.replace(/<!--[\s\S]*?-->/g, "");

  // 1. Own street/postcode/phone present.
  check(html.indexOf(smartts.streetAddress) !== -1, label + ": own street address missing");
  check(html.indexOf(smartts.postalCode) !== -1, label + ": own postcode missing");
  check(html.indexOf(smartts.phone) !== -1, label + ": own phone (display) missing");
  check(html.indexOf("tel:" + smartts.phone.replace(/\s+/g, "")) !== -1 ||
        html.indexOf("tel:" + smartts.phone) !== -1,
        label + ": tel: link for own phone missing");

  // 2. No other trading branch's postcode or phone appears anywhere.
  otherBranches.forEach(function (b) {
    if (b.postalCode && b.postalCode !== smartts.postalCode &&
        html.indexOf(b.postalCode) !== -1) {
      flags.push(label + ": carries " + b.id + "'s postcode " + b.postalCode);
    }
    checks++;
    if (b.phone && b.phone !== smartts.phone &&
        html.indexOf(b.phone.replace(/\s+/g, "")) !== -1) {
      flags.push(label + ": carries " + b.id + "'s phone digits");
    }
    checks++;
  });

  // 3. Own seoTown present; no foreign live branch's seoTown without a
  //    serviceAreaList excuse (word-boundary match).
  check(new RegExp("\\b" + smartts.seoTown + "\\b").test(html),
        label + ": own seoTown (" + smartts.seoTown + ") not found");
  var excuseList = smartts.serviceAreaList || [];
  otherBranches.forEach(function (b) {
    if (!b.seoTown || b.seoTown === smartts.seoTown) return;
    checks++;
    var re = new RegExp("\\b" + b.seoTown.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b");
    if (re.test(html) && excuseList.indexOf(b.seoTown) === -1) {
      flags.push(label + ": names foreign seoTown \"" + b.seoTown + "\" (" + b.id +
        ") with no serviceAreaList excuse");
    }
  });

  // 4. No em dash outside the build comment.
  check(noBuildComment.indexOf("—") === -1,
        label + ": em dash found outside the build comment");

  // 5. JSON-LD address/telephone field-by-field.
  var ldMatch = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
  checks++;
  if (!ldMatch) {
    flags.push(label + ": no JSON-LD block found");
  } else {
    var ld;
    try { ld = JSON.parse(ldMatch[1]); } catch (e) { ld = null; }
    if (!ld) {
      flags.push(label + ": JSON-LD does not parse");
    } else {
      var addr = ld.address || {};
      check(addr.streetAddress === smartts.streetAddress, label + ": JSON-LD streetAddress mismatch");
      check(addr.addressLocality === smartts.addressLocality, label + ": JSON-LD addressLocality mismatch");
      check(addr.postalCode === smartts.postalCode, label + ": JSON-LD postalCode mismatch");
      check(addr.addressRegion === smartts.addressRegion, label + ": JSON-LD addressRegion mismatch");
      check(addr.addressCountry === smartts.addressCountry, label + ": JSON-LD addressCountry mismatch");
      check(ld.telephone === smartts.phone, label + ": JSON-LD telephone mismatch");
    }
  }

  // 6. Map iframe query decodes to this branch's own address.
  var mapMatch = /maps\/embed\?[^"]*q=([^"&]+)/.exec(html) || /google\.com\/maps[^"]*[?&]q=([^"&]+)/.exec(html);
  checks++;
  if (mapMatch) {
    var decoded = decodeURIComponent(mapMatch[1].replace(/\+/g, " "));
    var expected = smartts.streetAddress + ", " + smartts.addressLocality + ", " + smartts.postalCode;
    if (decoded.indexOf(smartts.streetAddress) === -1 || decoded.indexOf(smartts.postalCode) === -1) {
      flags.push(label + ": map query does not resolve to own address (\"" + decoded + "\" vs expected \"" + expected + "\")");
    }
  } else if (html.indexOf('id="rbhsv-root"') !== -1 || html.indexOf('id="rbhsw-root"') !== -1) {
    // contact-card pages should carry a map; note if absent rather than silently skip
    if (html.indexOf("maps") !== -1 || html.indexOf("iframe") !== -1) {
      // has some map-like markup but query pattern didn't match - flag for review
      flags.push(label + ": map markup present but query could not be parsed by this script");
    }
  }

  // 7. hasApp consistency: smartts.hasApp is true, so switch page must carry the app card.
  if (relPath.indexOf("switch-prescriptions-") !== -1) {
    checks++;
    var hasAppCard = /RB Healthcare Pharmacy app/i.test(html) || /apps\.apple\.com/.test(html) || /play\.google\.com/.test(html);
    if (smartts.hasApp && !hasAppCard) {
      flags.push(label + ": branch hasApp=true but no app card/store link found on switch page");
    }
    if (!smartts.hasApp && hasAppCard) {
      flags.push(label + ": branch hasApp=false but app card/store link found on switch page");
    }
  }

  // 8. data-branch on the module root names this branch.
  var rootMatch = /<div id="rbhs[vw]-root"([^>]*)>/.exec(html);
  checks++;
  if (rootMatch) {
    var dBranchMatch = /data-branch="([^"]*)"/.exec(rootMatch[1]);
    if (!dBranchMatch) {
      flags.push(label + ": module root present but no data-branch attribute");
    } else if (dBranchMatch[1] !== smartts.branchName && dBranchMatch[1] !== smartts.brandLabel) {
      flags.push(label + ": data-branch=\"" + dBranchMatch[1] + "\" does not match branchName/brandLabel");
    }
  }
});

console.log("verify-3.7-2026-09-05-eleventh: " + files.length + " pages, " + checks + " checks, " + flags.length + " flag(s)");
if (flags.length) {
  flags.forEach(function (f) { console.log("  FLAG  " + f); });
  process.exit(1);
}
console.log("clean.");
process.exit(0);
