/*
  Independent verification, item 3.7 (Smartts Chemist, Bootle), ninth quality pass,
  2026-09-03. Written fresh, shares no code with tools/. Two parts:

  PART A - the standard sweep this item's prior eight passes have all run:
  own postcode/phone/street present, no other live branch's; JSON-LD field by
  field; data-branch/data-wa; cross-town seoTown guard (serviceAreaList-excused);
  no hard-coded Appointedd widget id; map query decodes to own address; hasApp/
  app-card consistency; no em dash outside the build-comment exemption.

  PART B - the fresh angle for this pass: check-contraception-copy.js has never
  been proven by direct injection against contraception-smartts-bootle.html
  across any of Smartts' eight prior passes (it was proven against SK Chemists
  Bootle's contraception page when the checker was first written, and against
  Hirshmans Chemist Ainsdale's on the 3.5 tenth pass, but never Smartts'). This
  leg independently checks that page against rules 4 (service name), 5 (free,
  no price), 6 (consent direction) and 8 (no medicine names) by reading the
  rendered page directly, not by calling the checker.
*/
"use strict";
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var PAGE_DIR = path.join(ROOT, "modules", "service", "pages");
var SWITCH_DIR = path.join(ROOT, "modules", "switch", "pages");

var data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));
var branches = data.branches.filter(function (b) { return !b.disposed; });
var byId = {};
branches.forEach(function (b) { byId[b.id] = b; });
var smartts = byId["smartts_bootle"];
if (!smartts) { console.error("smartts_bootle not found in branches.json"); process.exit(1); }

var checks = 0, flags = [];
function check(cond, msg) {
  checks++;
  if (!cond) flags.push(msg);
}

function norm(s) {
  return String(s)
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ").trim();
}
function visible(html) { return norm(String(html).replace(/<!--[\s\S]*?-->/g, " ")); }
function crawlable(html) {
  return norm(String(html)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " "));
}

// -----------------------------------------------------------------------
// Gather the 12 Smartts pages: 11 service-family HTML files plus the
// switch page. (The switch banner .txt is not a page and is skipped.)
// -----------------------------------------------------------------------
var files = [];
fs.readdirSync(PAGE_DIR).forEach(function (f) {
  if (f.indexOf("smartts-bootle") !== -1 && f.endsWith(".html")) {
    files.push(path.join(PAGE_DIR, f));
  }
});
fs.readdirSync(SWITCH_DIR).forEach(function (f) {
  if (f.indexOf("smartts-bootle") !== -1 && f.endsWith(".html")) {
    files.push(path.join(SWITCH_DIR, f));
  }
});
check(files.length === 12, "expected 12 Smartts pages, found " + files.length + ": " + files.join(", "));

// Every other live branch, for the cross-town / foreign-fact scan.
var others = branches.filter(function (b) { return b.id !== "smartts_bootle"; });

files.forEach(function (file) {
  var raw = fs.readFileSync(file, "utf8");
  var text = visible(raw);
  var crawl = crawlable(raw);
  var name = path.relative(ROOT, file).replace(/\\/g, "/");

  // Own facts present.
  check(text.indexOf(smartts.streetAddress) !== -1, name + ": missing own street address");
  check(text.indexOf(smartts.postalCode) !== -1, name + ": missing own postcode");
  check(text.indexOf(smartts.phone) !== -1, name + ": missing own visible phone");
  var telHref = new RegExp('tel:\\+?44?0?' + smartts.phone.replace(/\D/g, '').replace(/^0/, '') + '|tel:' + smartts.phone.replace(/\s/g, ''));
  var telPresent = /href="tel:[^"]+"/.test(raw);
  check(telPresent, name + ": no tel: link found at all");

  // No other live branch's postcode or phone appears on this page.
  others.forEach(function (o) {
    if (o.postalCode && o.postalCode !== smartts.postalCode) {
      check(text.indexOf(o.postalCode) === -1, name + ": carries " + o.id + "'s postcode " + o.postalCode);
    }
    if (o.phone && o.phone !== smartts.phone) {
      check(text.indexOf(o.phone) === -1, name + ": carries " + o.id + "'s phone " + o.phone);
    }
  });

  // JSON-LD block, field by field.
  var ldMatch = raw.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  check(!!ldMatch, name + ": no JSON-LD block found");
  if (ldMatch) {
    var ld;
    try { ld = JSON.parse(ldMatch[1]); } catch (e) { ld = null; }
    check(!!ld, name + ": JSON-LD did not parse: " + (ld ? "" : "parse error"));
    if (ld) {
      check(ld["@type"] === "Pharmacy", name + ": JSON-LD @type is " + ld["@type"] + ", expected Pharmacy");
      check(ld.telephone === smartts.phone, name + ": JSON-LD telephone is " + ld.telephone + ", expected " + smartts.phone);
      if (ld.address) {
        check(ld.address.streetAddress === smartts.streetAddress, name + ": JSON-LD streetAddress mismatch");
        check(ld.address.postalCode === smartts.postalCode, name + ": JSON-LD postalCode mismatch");
        check(ld.address.addressLocality === smartts.addressLocality, name + ": JSON-LD addressLocality mismatch");
        check(ld.address.addressRegion === smartts.addressRegion, name + ": JSON-LD addressRegion mismatch, got " + ld.address.addressRegion);
      } else {
        check(false, name + ": JSON-LD has no address block");
      }
    }
  }

  // data-branch / data-wa, where present.
  var dbMatch = raw.match(/data-branch="([^"]*)"/);
  if (dbMatch) {
    check(dbMatch[1] === smartts.branchName || dbMatch[1] === smartts.brandLabel,
      name + ": data-branch=\"" + dbMatch[1] + "\" is neither branchName nor brandLabel for smartts_bootle");
  }
  var waMatch = raw.match(/data-wa="([^"]*)"/);
  if (waMatch && smartts.whatsapp) {
    check(waMatch[1] === smartts.whatsapp, name + ": data-wa=\"" + waMatch[1] + "\" does not match branches.json whatsapp " + smartts.whatsapp);
  }

  // Cross-town guard: no other live branch's seoTown appears unless it is in
  // Smartts' own serviceAreaList.
  others.forEach(function (o) {
    if (!o.seoTown || o.seoTown === smartts.seoTown) return;
    if ((smartts.serviceAreaList || []).indexOf(o.seoTown) !== -1) return;
    var re = new RegExp("\\b" + o.seoTown.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b");
    check(!re.test(text), name + ": names foreign live seoTown \"" + o.seoTown + "\" (" + o.id + "), not excused by serviceAreaList");
  });

  // No other live branch's Appointedd widget id anywhere on the page.
  others.forEach(function (o) {
    if (!o.widgets) return;
    Object.keys(o.widgets).forEach(function (svc) {
      var wid = o.widgets[svc];
      if (!wid) return;
      check(raw.indexOf(wid) === -1, name + ": carries " + o.id + "'s " + svc + " widget id " + wid);
    });
  });

  // Map query decodes to own address, where a map embed is present.
  var mapMatch = raw.match(/google\.com\/maps\?q=([^"&]+)/);
  if (mapMatch) {
    var decoded = decodeURIComponent(mapMatch[1]);
    var expected = smartts.streetAddress + ", " + smartts.addressLocality + ", " + smartts.postalCode;
    check(decoded.indexOf(smartts.streetAddress) !== -1 && decoded.indexOf(smartts.postalCode) !== -1,
      name + ": map query \"" + decoded + "\" does not resolve to own address (expected to contain \"" + expected + "\")");
  }

  // hasApp / app-card consistency: Smartts is a member (hasApp true).
  if (file.indexOf(path.join("switch", "pages")) !== -1 || name.indexOf("switch/pages") !== -1) {
    var hasAppCard = /download our app|RB Healthcare Pharmacy app/i.test(text);
    check(smartts.hasApp === true ? hasAppCard : !hasAppCard,
      name + ": app-card presence (" + hasAppCard + ") disagrees with hasApp=" + smartts.hasApp);
  }

  // No em dash outside the documented build-comment exemption.
  var withoutComment = raw.replace(/<!--[\s\S]*?-->/g, " ");
  check(withoutComment.indexOf("—") === -1, name + ": em dash found outside the build comment");
});

// -----------------------------------------------------------------------
// PART B - contraception copy, Smartts-specific, rules 4/5/6/8.
// -----------------------------------------------------------------------
var contraFile = path.join(PAGE_DIR, "contraception-smartts-bootle.html");
check(fs.existsSync(contraFile), "contraception-smartts-bootle.html missing entirely");
if (fs.existsSync(contraFile)) {
  var craw = fs.readFileSync(contraFile, "utf8");
  var ccrawl = crawlable(craw);
  var ctext = visible(craw);
  var clower = ctext.toLowerCase();

  // RULE 4: service named correctly.
  check(ccrawl.indexOf("NHS Pharmacy Contraception Service") !== -1,
    "contraception-smartts-bootle.html: does not name \"NHS Pharmacy Contraception Service\" as crawlable text");
  ["NHS Contraception Service", "Pharmacy Contraception Scheme", "NHS contraception scheme"].forEach(function (w) {
    check(ctext.indexOf(w) === -1, "contraception-smartts-bootle.html: carries wrong service name \"" + w + "\"");
  });

  // RULE 5: free, no price.
  check(ccrawl.toLowerCase().indexOf("no prescription charge") !== -1,
    "contraception-smartts-bootle.html: no \"no prescription charge\" line found as crawlable text");
  var priceHit = /£\s?\d|\b\d+\s?(?:pounds|p per)\b|\bfrom \d+\b/i.exec(ctext);
  check(!priceHit, "contraception-smartts-bootle.html: states a price - " + (priceHit ? priceHit[0] : ""));
  ["there is a charge", "a small fee", "consultation fee", "payable"].forEach(function (w) {
    check(clower.indexOf(w) === -1, "contraception-smartts-bootle.html: carries charge wording \"" + w + "\"");
  });

  // RULE 6: consent direction.
  var CONSENT = /only tell your gp[^.]*if you give your consent/i;
  check(CONSENT.test(ccrawl), "contraception-smartts-bootle.html: consent sentence not found as crawlable text in the correct direction");
  ["we will always tell your gp", "your gp will be told", "we never tell your gp",
   "we will not tell your gp", "your gp is always informed"].forEach(function (w) {
    check(clower.indexOf(w) === -1, "contraception-smartts-bootle.html: carries reversed consent wording \"" + w + "\"");
  });

  // RULE 7: no LARC offer wording.
  ["we fit", "we can fit", "fitted here", "fitting service", "we insert",
   "we provide the coil", "we provide the implant", "coil fitting",
   "implant fitting", "we offer the coil", "we offer the implant",
   "contraceptive injection here", "we give the injection"].forEach(function (w) {
    check(clower.indexOf(w) === -1, "contraception-smartts-bootle.html: carries LARC-offer wording \"" + w + "\"");
  });

  // RULE 8: no medicine names.
  var MEDS = ["microgynon", "rigevidon", "levest", "maexeni", "ovranette", "marvelon",
    "gedarel", "millinette", "yasmin", "lucette", "eloine", "cilest", "femodene",
    "katya", "cerazette", "cerelle", "zelleta", "nacrez", "hana", "lovima",
    "noriday", "norgeston", "levonorgestrel", "desogestrel", "norethisterone",
    "ethinylestradiol", "ethinyloestradiol", "drospirenone", "gestodene",
    "norgestimate", "ellaone", "levonelle", "ulipristal", "depo-provera",
    "sayana", "nexplanon", "mirena", "kyleena"];
  MEDS.forEach(function (m) {
    var re = new RegExp("\\b" + m + "\\b", "i");
    check(!re.test(ctext), "contraception-smartts-bootle.html: names medicine \"" + m + "\"");
  });

  // Widget id: contraception page should carry Smartts' own contraception
  // widget id and no sibling's.
  check(craw.indexOf(smartts.widgets.contraception) !== -1 ||
        /rbhsv-root|rbhsw-root/.test(craw),
    "contraception-smartts-bootle.html: no mount and no own widget id literal found (checking service.js routing assumption)");
}

console.log("verify-3.7 (ninth pass): " + checks + " checks, " + flags.length + " flags");
if (flags.length) {
  flags.forEach(function (f) { console.log("  FLAG: " + f); });
  process.exit(1);
}
console.log("  OK - no flags");
