/*
 * Standalone, read-only verification for tools/check-live-hours.js's own
 * sitemap-driven URL selection logic (item 6.3, twentieth quality pass,
 * 2026-09-19). Never touches the tracked repo and never makes a live HTTP
 * request: extractLocs(), PAGE_HINT_RE and the url-collection loop inside
 * collectHost() are copied VERBATIM from tools/check-live-hours.js (as read
 * this run) so the logic under test is the real logic, not a
 * reimplementation of it.
 *
 * Why this angle: a grep of every item-6.3 line across AGENT_WORKLIST.md for
 * PAGE_HINT_RE, extractLocs, sitemap.xml, "urls.length" and
 * daySnippets/htmlToText returned zero hits across all nineteen prior passes
 * on this item, despite two of the last three passes (eighteenth,
 * nineteenth) finding fresh untested surface specifically inside this same
 * file (the disposed filter, NEAR_DAYS, hostPages per-host sharing). This is
 * the one piece of that file's own logic that decides WHICH live pages the
 * whole survey even reads: if the sitemap filter or its 8-URL cap picked the
 * wrong pages, every downstream snippet, and every branch verdict a human
 * reads off it, would be silently scoped to the wrong evidence while the
 * tool still exits 0 (it is a survey tool, never a gate) - the same
 * "checker passes, but which files did it read" shape this repo's own
 * CLAUDE.md names repeatedly (check-seo-lengths rule 3, check-nap, this
 * checker's own rule 9 and rule 7 gaps).
 */
"use strict";

var assert = require("assert");

// ---- verbatim from tools/check-live-hours.js ----
var PAGE_HINT_RE = /(contact|opening|hours|find|about|visit)/i;

function extractLocs(xml) {
  var locs = [];
  var re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  var m;
  while ((m = re.exec(xml)) !== null) locs.push(m[1]);
  return locs;
}

// The url-collection body of collectHost(), copied verbatim and wrapped so
// it can be exercised without the surrounding fetch chain. origin and xml
// are the only two inputs this fragment reads.
function selectUrls(origin, xml) {
  var urls = [origin + "/"];
  extractLocs(xml).forEach(function (u) {
    if (PAGE_HINT_RE.test(u) && urls.indexOf(u) === -1 && urls.length < 8) urls.push(u);
  });
  return urls;
}
// ---- end verbatim ----

var results = [];
function check(name, fn) {
  try { fn(); results.push([name, "PASS"]); }
  catch (e) { results.push([name, "FAIL: " + e.message]); }
}

check("extractLocs finds every <loc> in a well-formed sitemap", function () {
  var xml = "<urlset><url><loc>https://x.example/</loc></url>" +
    "<url><loc>https://x.example/contact.html</loc></url>" +
    "<url><loc>https://x.example/blog/post-1.html</loc></url></urlset>";
  var got = extractLocs(xml);
  assert.deepStrictEqual(got, [
    "https://x.example/",
    "https://x.example/contact.html",
    "https://x.example/blog/post-1.html"
  ]);
});

check("extractLocs returns [] on empty input, does not throw", function () {
  assert.deepStrictEqual(extractLocs(""), []);
});
check("extractLocs returns [] on non-sitemap HTML (e.g. a Cloudflare block page), does not throw", function () {
  var html = "<html><body><h1>Attention Required!</h1><p>Cloudflare</p></body></html>";
  assert.deepStrictEqual(extractLocs(html), []);
});

check("PAGE_HINT_RE matches contact/opening/hours/find/about/visit paths", function () {
  ["https://x.example/contact-us.html", "https://x.example/opening-hours.html",
    "https://x.example/find-a-pharmacy.html", "https://x.example/about-us.html",
    "https://x.example/visit-us.html", "https://x.example/our-hours.html"
  ].forEach(function (u) { assert.ok(PAGE_HINT_RE.test(u), u + " should match"); });
});
check("PAGE_HINT_RE excludes ordinary content pages that say nothing about visiting the branch", function () {
  ["https://x.example/shingles-treatment.html", "https://x.example/travel-clinic.html",
    "https://x.example/weight-loss-clinic.html", "https://x.example/blog/flu-jabs-2026.html"
  ].forEach(function (u) { assert.ok(!PAGE_HINT_RE.test(u), u + " should NOT match"); });
});

check("8-URL cap keeps exactly 7 hinted URLs plus the origin, in document order, when the sitemap offers more", function () {
  var locs = [];
  for (var i = 1; i <= 15; i++) locs.push("<url><loc>https://x.example/contact-branch-" + i + ".html</loc></url>");
  var xml = "<urlset>" + locs.join("") + "</urlset>";
  var urls = selectUrls("https://x.example", xml);
  assert.strictEqual(urls.length, 8, "expected origin + 7 hinted urls, got " + urls.length);
  assert.strictEqual(urls[0], "https://x.example/");
  for (var j = 1; j <= 7; j++) {
    assert.strictEqual(urls[j], "https://x.example/contact-branch-" + j + ".html",
      "slot " + j + " should be branch-" + j + " (document order), got " + urls[j]);
  }
  assert.ok(urls.indexOf("https://x.example/contact-branch-8.html") === -1, "branch-8 must have been cut off by the cap");
});

check("a sitemap loc identical to the origin is not duplicated, so it cannot steal a slot from a real hinted page", function () {
  var xml = "<urlset><url><loc>https://x.example/</loc></url>" +
    "<url><loc>https://x.example/find-us.html</loc></url></urlset>";
  var urls = selectUrls("https://x.example", xml);
  assert.deepStrictEqual(urls, ["https://x.example/", "https://x.example/find-us.html"]);
});

check("mixed sitemap: only hinted pages are added, unrelated pages skipped, cap still respected", function () {
  var locs = ["https://x.example/shingles-treatment.html", "https://x.example/contact-us.html",
    "https://x.example/travel-clinic.html", "https://x.example/opening-hours.html",
    "https://x.example/weight-loss.html", "https://x.example/find-a-pharmacy.html"
  ];
  var xml = "<urlset>" + locs.map(function (u) { return "<url><loc>" + u + "</loc></url>"; }).join("") + "</urlset>";
  var urls = selectUrls("https://x.example", xml);
  assert.deepStrictEqual(urls, [
    "https://x.example/",
    "https://x.example/contact-us.html",
    "https://x.example/opening-hours.html",
    "https://x.example/find-a-pharmacy.html"
  ]);
});

console.log("verify-6.3 sitemap URL-selection logic (twentieth pass, 2026-09-19)");
var failed = 0;
results.forEach(function (r) {
  console.log("  " + (r[1] === "PASS" ? "PASS" : "FAIL") + "  " + r[0] + (r[1] === "PASS" ? "" : "  (" + r[1] + ")"));
  if (r[1] !== "PASS") failed++;
});
console.log("");
console.log(failed ? (failed + " of " + results.length + " checks FAILED") : ("all " + results.length + " checks passed"));
process.exit(failed ? 1 : 0);
