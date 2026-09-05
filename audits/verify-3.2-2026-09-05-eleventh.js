#!/usr/bin/env node
/*
  Item 3.2 quality pass (eleventh), 2026-09-05, unattended Cowork run.
  Scorah Chemists (Bramhall and Hazel Grove) - independent extraction proving
  the same-page fragment-link target rule (the #book / #switch-form-card CTA
  wiring) against Scorah's own 26 pages for the first time in this item's
  eleven-pass history.

  Own regexes throughout. Imports nothing from tools/check-fragment-targets.js
  so this is a genuine second reader, not a re-run of the checker under test.

  Read-only. Run: node audits/verify-3.2-2026-09-05-eleventh.js
*/
"use strict";
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

var SCORAH_PAGES = [
  "modules/branch/pages/pharmacy-scorah-bramhall.html",
  "modules/branch/pages/pharmacy-scorah-hazel-grove.html",
  "modules/service/pages/contraception-scorah-bramhall.html",
  "modules/service/pages/contraception-scorah-hazel-grove.html",
  "modules/service/pages/earache-treatment-scorah-bramhall.html",
  "modules/service/pages/earache-treatment-scorah-hazel-grove.html",
  "modules/service/pages/impetigo-treatment-scorah-bramhall.html",
  "modules/service/pages/impetigo-treatment-scorah-hazel-grove.html",
  "modules/service/pages/insect-bite-treatment-scorah-bramhall.html",
  "modules/service/pages/insect-bite-treatment-scorah-hazel-grove.html",
  "modules/service/pages/pharmacy-first-scorah-bramhall.html",
  "modules/service/pages/pharmacy-first-scorah-hazel-grove.html",
  "modules/service/pages/shingles-treatment-scorah-bramhall.html",
  "modules/service/pages/shingles-treatment-scorah-hazel-grove.html",
  "modules/service/pages/sinusitis-treatment-scorah-bramhall.html",
  "modules/service/pages/sinusitis-treatment-scorah-hazel-grove.html",
  "modules/service/pages/sore-throat-treatment-scorah-bramhall.html",
  "modules/service/pages/sore-throat-treatment-scorah-hazel-grove.html",
  "modules/service/pages/travel-clinic-scorah-bramhall.html",
  "modules/service/pages/travel-clinic-scorah-hazel-grove.html",
  "modules/service/pages/uti-treatment-scorah-bramhall.html",
  "modules/service/pages/uti-treatment-scorah-hazel-grove.html",
  "modules/service/pages/weight-loss-clinic-scorah-bramhall.html",
  "modules/service/pages/weight-loss-clinic-scorah-hazel-grove.html",
  "modules/switch/pages/switch-prescriptions-scorah-bramhall.html",
  "modules/switch/pages/switch-prescriptions-scorah-hazel-grove.html"
];

var checks = 0;
var failures = [];

function fail(msg) { failures.push(msg); }

SCORAH_PAGES.forEach(function (rel) {
  var file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { fail("MISSING page " + rel); return; }
  var html = fs.readFileSync(file, "utf8");

  // ids declared on this page, with counts
  var idCounts = {};
  var idRe = /\sid\s*=\s*"([^"]+)"/g;
  var m;
  while ((m = idRe.exec(html)) !== null) {
    idCounts[m[1]] = (idCounts[m[1]] || 0) + 1;
  }

  // RULE: no id declared twice
  checks++;
  var dupes = Object.keys(idCounts).filter(function (k) { return idCounts[k] > 1; });
  if (dupes.length) fail(rel + ": duplicate id(s): " + dupes.join(", "));

  // RULE: every href="#frag" (frag non-empty) resolves to a declared id
  var hrefRe = /href\s*=\s*"#([^"]*)"/g;
  var fragLinksOnPage = 0;
  while ((m = hrefRe.exec(html)) !== null) {
    var frag = m[1];
    if (frag === "") continue; // JS-driven button, not a jump
    checks++;
    fragLinksOnPage++;
    if (!idCounts[frag]) {
      fail(rel + ': href="#' + frag + '" has no matching id="' + frag + '" on the same page');
    }
  }

  // RULE: page carries at least one resolving fragment link (CTA present).
  // Branch landing pages are exempt: they signpost out to the service pages
  // and carry no booking card of their own, the same exemption
  // check-fragment-targets.js documents in CTA_EXEMPT_FAMILIES. Scorah's two
  // landing pages (pharmacy-scorah-bramhall.html,
  // pharmacy-scorah-hazel-grove.html) are exactly this case.
  var isBranchLanding = rel.indexOf("modules/branch/pages/") === 0;
  checks++;
  if (fragLinksOnPage === 0 && !isBranchLanding) {
    fail(rel + ": no same-page fragment link found at all (no CTA wiring to prove)");
  }
});

console.log("verify-3.2-2026-09-05-eleventh: " + SCORAH_PAGES.length + " Scorah pages read, " + checks + " checks, " + failures.length + " failures");
failures.forEach(function (f) { console.log("  FAIL " + f); });
process.exit(failures.length ? 1 : 0);
