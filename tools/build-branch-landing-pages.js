/*
  Item 2.2 (Full Audit June 2026): shared-domain split.
  Generates one branch landing page per branch of a shared-domain brand, so
  each branch has its own local target page ("pharmacy in <town>") on the
  shared website. One domain cannot rank twice in the same map for the same
  term, so the second branch leans on its own GBP listing plus this page
  (Master Plan v2, section 3).

  Run:  node tools/build-branch-landing-pages.js
  Out:  modules/branch/pages/<slug>.html, plus INDEX.md and SEO.md

  Model (same as the other generators): layout written once here; per-branch
  pages are stamped from branches.json (NAP, opening hours, service links).
  Scope: all six branches on the three shared domains. Fishlocks Ainsdale and
  Eccleston (the pilot pair, item 2.2), then McCanns Aigburth and Sandringham
  and Scorah Bramhall and Hazel Grove (item 5.2, authorised by Rishi's answer
  to Q11).

  Notes:
  - Pages are static crawlable text. They load service.css for styling but
    NOT service.js: a landing page has no booking widget, so there is nothing
    to resolve at runtime and nothing to break.
  - JSON-LD includes openingHoursSpecification from branches.json. These are
    the first pages to carry hours schema (the 2.1 audit deferred it on the
    171 existing pages to Phase 3 regeneration; new pages get it from day one).
  - Weebly cannot 301, so the old shared pages stay live; each landing page
    cross-links its sister branch to disambiguate the shared domain.
*/
const fs = require("fs");
const path = require("path");
const pat = require("./seo-pattern"); // single source of title/H1 pattern (item 3.1)

// Same ref as the service pages: service.css only (see note above).
const PIN = "service-module-phase1";
const CDN = "https://cdn.jsdelivr.net/gh/rishi235/rbh-site-data@" + PIN + "/modules/service";

// Which branches get a landing page, by branches.json id.
// Every live branch that shares a website host with another live branch
// belongs here; check-page-coverage.js warns (LANDING_NOT_BUILT) for any that
// does not. Three shared domains today: fishlockpharmacy.co.uk,
// mccannspharmacy.co.uk and scorah-chemists.co.uk.
const BUILD = [
  "fishlocks_ainsdale",
  "fishlocks_eccleston",
  "mccanns_aigburth",
  "mccanns_sandringham",
  "scorah_bramhall",
  "scorah_hazel"
];

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "branches.json"), "utf8"));
const byId = {};
data.branches.forEach(function (b) { byId[b.id] = b; });

function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function tel(b) { return (b.phone || "").replace(/\s+/g, ""); }
function fullAddr(b) { return [b.streetAddress, b.addressLocality, b.postalCode].filter(Boolean).join(", "); }
function siteHost(b) { return (b.website || "").replace(/^https?:\/\//, ""); }

// Sister branches on the same host, from hostMap (skip disposed).
function sistersOf(id) {
  var host = null;
  Object.keys(data.hostMap).forEach(function (h) {
    if (data.hostMap[h].indexOf(id) !== -1) host = h;
  });
  if (!host) return [];
  return data.hostMap[host].filter(function (x) {
    return x !== id && byId[x] && !byId[x].disposed;
  });
}

// "08:45" -> "8.45am" (UK style, no leading zero)
function fmtTime(t) {
  var p = t.split(":");
  var h = parseInt(p[0], 10);
  var m = p[1];
  var ap = h >= 12 ? "pm" : "am";
  var h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return h12 + (m === "00" ? "" : "." + m) + ap;
}

// A day can carry more than one session in branches.json. McCanns close for
// lunch, so their weekdays are two entries (09:00-13:00 and 14:00-18:00), and
// an earlier version of this function overwrote the first with the second, so
// the page told patients the pharmacy opened at 2pm when it opens at 9am.
// Sessions are therefore collected per day, sorted by opening time and joined.
function hoursRows(b) {
  var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  var sessions = {};
  var oh = b.openingHours || {};
  (oh.specification || []).forEach(function (spec) {
    spec.dayOfWeek.forEach(function (d) {
      if (!sessions[d]) sessions[d] = [];
      sessions[d].push({ opens: spec.opens, closes: spec.closes });
    });
  });
  var map = {};
  Object.keys(sessions).forEach(function (d) {
    map[d] = sessions[d]
      .slice()
      .sort(function (x, y) { return x.opens < y.opens ? -1 : x.opens > y.opens ? 1 : 0; })
      .map(function (s) { return fmtTime(s.opens) + " to " + fmtTime(s.closes); })
      .join(", ");
  });
  (oh.closedDays || []).forEach(function (d) { map[d] = "Closed"; });
  return days.map(function (d) { return [d, map[d] || "Closed"]; });
}

function joinTowns(list) {
  if (!list || !list.length) return "";
  if (list.length === 1) return list[0];
  return list.slice(0, -1).join(", ") + " and " + list[list.length - 1];
}

function landingSlug(b) { return "pharmacy-" + b.brandSlug + "-" + b.townSlug + ".html"; }

// One definition of the meta description, used for the page's SEO tag AND for
// the paste sheets, so the two can never drift apart (same rule as switchMeta
// in build-switch-pages.js). The serving list is trimmed a town at a time
// until the whole line fits the 165-character rule in tools/seo-pattern.js.
// Scorah lists five service areas, which pushed the Bramhall and Hazel Grove
// descriptions past the limit; over 165 characters Google truncates the
// snippet mid-sentence and the towns at the end are the part it drops.
var META_MAX = 165;
function landingMeta(b) {
  var head = b.branchName + ", " + b.seoTown + " " + b.postalCode +
    ". NHS prescriptions, Pharmacy First and private clinics.";
  var towns = (b.serviceAreaList || []).slice();
  while (towns.length) {
    var full = head + " Serving " + joinTowns(towns) + ".";
    if (full.length <= META_MAX) return full;
    towns.pop();
  }
  return head;
}

function servicesOf(b) {
  var ss = b.brandSlug + "-" + b.townSlug;
  return [
    { name: "NHS Pharmacy First", href: "pharmacy-first-" + ss + ".html",
      blurb: "Free NHS treatment for seven common conditions, with no GP appointment needed." },
    { name: "NHS repeat prescriptions", href: "switch-prescriptions-" + ss + ".html",
      blurb: "Order your NHS repeat prescriptions with us, with collection or delivery." + (b.hasApp ? " Manage everything in the free RB Healthcare Pharmacy app." : "") },
    { name: "Weight loss clinic", href: "weight-loss-clinic-" + ss + ".html",
      blurb: "Private weight loss support with our pharmacy team. Book a consultation to find out more." },
    { name: "Travel clinic", href: "travel-clinic-" + ss + ".html",
      blurb: "Travel vaccinations and advice before your trip." },
    { name: "Contraception", href: "contraception-" + ss + ".html",
      blurb: "NHS contraception service. Start or continue oral contraception without a GP appointment." },
    // The NHS blood pressure check cohort is "adults aged 40 and over", pinned
    // in tools/check-pharmacy-first-eligibility.js and stated that way in all
    // fifteen GBP packs. This tile said "if you are over 40", which is a year
    // narrower than the service and turns away eligible forty-year-olds. Found
    // and corrected on the item 5.2 quality pass, 2026-08-14; rule 9 of that
    // checker now reads these six pages, so the two cannot drift again.
    { name: "Blood pressure checks", href: null,
      blurb: "Free NHS blood pressure checks for adults aged 40 and over. Just ask in store." }
  ];
}

function headComment(b, title, meta, slug) {
  return "<!--\n" +
    "  " + b.branchName.toUpperCase() + " - branch landing page (shared-domain split, item 2.2).\n" +
    "  Paste this whole block into the Weebly \"Embed Code\" element on " + slug + "\n" +
    "  Weebly page SEO title:       " + title + "\n" +
    "  Weebly page SEO description:  " + meta + "\n" +
    "  Static page: loads service.css for styling only, no JS and no booking widget.\n" +
    "-->";
}

function headLinks() {
  return '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="' + CDN + '/service.css">';
}

function pharmacySchema(b, url) {
  var spec = ((b.openingHours || {}).specification || []).map(function (s) {
    return {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": s.dayOfWeek,
      "opens": s.opens,
      "closes": s.closes
    };
  });
  var obj = {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    "name": b.branchName,
    "url": url,
    "telephone": b.phone || "",
    "email": b.email || "",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": b.streetAddress || "",
      "addressLocality": b.addressLocality || "",
      "postalCode": b.postalCode || "",
      "addressRegion": b.addressRegion || "",
      "addressCountry": b.addressCountry || "GB"
    }
  };
  if (spec.length) obj.openingHoursSpecification = spec;
  if (b.serviceAreaList && b.serviceAreaList.length) {
    obj.areaServed = b.serviceAreaList.map(function (t) { return { "@type": "City", "name": t }; });
  }
  return '<script type="application/ld+json">\n' + JSON.stringify(obj, null, 2) + "\n</script>";
}

function trustBar(b) {
  return '' +
    '<div class="trust-bar">\n' +
    '      <div class="trust-item"><strong>NHS and private services</strong><span>Pharmacy First, prescriptions, clinics</span></div>\n' +
    '      <div class="trust-item"><strong>Local ' + esc(b.seoTown) + ' team</strong><span>Real people, not a call centre</span></div>\n' +
    '      <div class="trust-item"><strong>Easy to reach</strong><span>' + esc(b.streetAddress) + '</span></div>\n' +
    '      <div class="trust-item"><strong>Private consultation room</strong><span>Seen discreetly in the pharmacy</span></div>\n' +
    '    </div>';
}

function hoursCard(b) {
  var rows = hoursRows(b).map(function (r) {
    return '<div class="contact-line"><p><strong>' + esc(r[0]) + ':</strong> ' + esc(r[1]) + '</p></div>';
  }).join("\n            ");
  var note = (b.openingHours && b.openingHours.source)
    ? '\n            <p style="color:#6b7280;font-size:13px;">Hours as listed on our ' + esc(b.openingHours.source) + '.</p>'
    : "";
  return '' +
    '<div class="contact-card pad">\n' +
    '            <h2 class="h2">Opening hours</h2>\n' +
    '            ' + rows + note + '\n' +
    '          </div>';
}

function contactCard(b, mapQ) {
  var reviewLine = b.googleReviewUrl
    ? '\n            <div class="contact-line"><p><strong>Google reviews:</strong> <a href="' + b.googleReviewUrl + '" target="_blank" rel="noopener">Review us on Google</a></p></div>'
    : "";
  var nhsLine = b.nhsReviewUrl
    ? '\n            <div class="contact-line"><p><strong>NHS website:</strong> <a href="' + b.nhsReviewUrl + '" target="_blank" rel="noopener">Leave a review on the NHS website</a></p></div>'
    : "";
  return '' +
    '<div class="contact-card pad">\n' +
    '            <h2 class="h2">Find ' + esc(b.branchName) + '</h2>\n' +
    '            <div class="contact-line"><p>' + esc(fullAddr(b)) + '</p></div>\n' +
    '            <div class="contact-line"><p><strong>Phone:</strong> <a href="tel:' + tel(b) + '">' + esc(b.phone) + '</a></p></div>\n' +
    '            <div class="contact-line"><p><strong>Email:</strong> <a href="mailto:' + esc(b.email) + '">' + esc(b.email) + '</a></p></div>' + reviewLine + nhsLine + '\n' +
    '            <iframe class="map" src="https://www.google.com/maps?q=' + mapQ + '&output=embed" loading="lazy"></iframe>\n' +
    '          </div>';
}

function sisterNote(b) {
  var sisters = sistersOf(b.id);
  if (!sisters.length) return "";
  var links = sisters.map(function (sid) {
    var s = byId[sid];
    // Most branch names already end with their town ("Fishlocks Chemist
    // Eccleston"), so appending " in <town>" reads "Eccleston in Eccleston".
    // Only add the town when the name does not already carry it.
    var name = esc(s.branchName);
    var town = esc(s.seoTown);
    var label = new RegExp("\\b" + town.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i").test(s.branchName)
      ? name
      : name + " in " + town;
    return '<a href="' + landingSlug(s) + '">' + label + '</a>';
  }).join(", ");
  return '' +
    '<section class="section">\n' +
    '      <div class="faq-card pad">\n' +
    '        <h2 class="h2">Looking for our other branch?</h2>\n' +
    '        <p class="lead">' + esc(b.brandLabel) + ' has more than one branch. This page is for our ' + esc(b.seoTown) + ' pharmacy. If you are nearer our other branch, see ' + links + '.</p>\n' +
    '      </div>\n' +
    '    </section>\n\n    ';
}

function landingPage(id) {
  var b = byId[id];
  if (!b) throw new Error("Unknown branch id in BUILD: " + id);
  if (!b.brandSlug || !b.seoTown || !b.townSlug || !b.website) {
    throw new Error("Branch " + id + " is missing brandSlug/seoTown/townSlug/website in branches.json");
  }
  if (b.disposed) throw new Error("Branch " + id + " is disposed; remove it from BUILD.");

  var slug = landingSlug(b);
  var url = b.website + "/" + slug;
  var title = pat.landingTitle(b);
  var meta = landingMeta(b);
  var mapQ = encodeURIComponent(fullAddr(b));
  var directions = "https://www.google.com/maps/dir/?api=1&destination=" + mapQ;

  var tiles = servicesOf(b).map(function (s) {
    var body = '<strong>' + esc(s.name) + '</strong>\n          <span>' + esc(s.blurb) + '</span>';
    return s.href
      ? '<a class="condition-card" href="' + s.href + '">\n          ' + body + '\n          <em>Learn more</em>\n        </a>'
      : '<div class="condition-card">\n          ' + body + '\n        </div>';
  }).join("\n        ");

  return headComment(b, title, meta, slug) + "\n" +
    headLinks() + "\n\n" +
    '<div id="rbhsv-root" data-branch="' + esc(b.branchName) + '">\n' +
    '  <div class="wrap">\n\n' +
    '    <section class="hero">\n' +
    '      <div class="hero-grid">\n' +
    '        <div>\n' +
    '          <div class="hero-help-row">' + esc(b.brandLabel) + '</div>\n' +
    '          <span class="pill">Your local pharmacy in ' + esc(b.seoTown) + '</span>\n' +
    '          <h1>' + esc(pat.landingH1(b)) + '</h1>\n' +
    '          <p class="hero-proof">NHS and private pharmacy services at ' + esc(b.streetAddress) + '.</p>\n' +
    '          <p class="hero-sub">' + esc(b.branchName) + ' serves ' + esc(joinTowns(b.serviceAreaList)) + ' with NHS prescriptions, the free NHS Pharmacy First service, and private weight loss and travel clinics. Call in, phone us or book online.</p>\n' +
    '          <ul class="hero-points">\n' +
    '            <li>NHS repeat prescriptions, collection and delivery</li>\n' +
    '            <li>Free NHS Pharmacy First consultations</li>\n' +
    '            <li>Private weight loss and travel clinics</li>\n' +
    '            <li>Local ' + esc(b.seoTown) + ' team who know their patients</li>\n' +
    '          </ul>\n' +
    '          <div class="hero-actions-stack">\n' +
    '            <a href="tel:' + tel(b) + '" class="btn-pill btn-primary"><span>Call ' + esc(b.phone) + '</span></a>\n' +
    '            <a href="' + directions + '" target="_blank" rel="noopener" class="btn-pill btn-white"><span>Get directions</span></a>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div>\n          ' + hoursCard(b) + '\n        </div>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    '    ' + trustBar(b) + '\n\n' +
    '    <section class="section">\n' +
    '      <h2 class="h2">Services at our ' + esc(b.seoTown) + ' pharmacy</h2>\n' +
    '      <p class="lead">Everything below is available at this branch. Tap a service to see details and book.</p>\n' +
    '      <div class="condition-grid">\n        ' + tiles + '\n      </div>\n' +
    '    </section>\n\n' +
    '    ' + sisterNote(b) +
    '<section class="section">\n' +
    '      <div class="main-grid">\n' +
    '        <div>\n' +
    '          <div class="faq-card pad">\n' +
    '            <h2 class="h2">Questions people usually ask</h2>\n' +
    '            <details><summary>Do you deliver prescriptions?</summary><div class="answer">Yes. Ask in store or call us and the team will explain how collection and delivery work for ' + esc(joinTowns(b.serviceAreaList)) + '.</div></details>\n' +
    '            <details><summary>Can I switch my prescriptions to you?</summary><div class="answer">Yes, and it takes about a minute. Visit our <a href="switch-prescriptions-' + b.brandSlug + '-' + b.townSlug + '.html">switch your prescriptions</a> page or call us and we will handle the rest with your GP surgery.</div></details>\n' +
    '            <details><summary>Do I need a GP appointment for Pharmacy First?</summary><div class="answer">No. Pharmacy First is a free NHS service where our pharmacist can assess and, where appropriate, treat seven common conditions. See our <a href="pharmacy-first-' + b.brandSlug + '-' + b.townSlug + '.html">Pharmacy First</a> page.</div></details>\n' +
    '            <details><summary>Where do I park?</summary><div class="answer">We are at ' + esc(fullAddr(b)) + '. Use the directions button above and Google Maps will route you to the door.</div></details>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div>\n          ' + contactCard(b, mapQ) + '\n        </div>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    '  </div>\n' +
    '</div>\n\n' +
    pharmacySchema(b, url) + "\n";
}

// --- write ------------------------------------------------------------------

var outDir = path.join(__dirname, "..", "modules", "branch", "pages");
fs.mkdirSync(outDir, { recursive: true });

var manifest = [];

BUILD.forEach(function (id) {
  var b = byId[id];
  var slug = landingSlug(b);
  var html = landingPage(id);
  fs.writeFileSync(path.join(outDir, slug), html);
  manifest.push({
    branch: b.branchName,
    file: slug,
    permalink: slug.replace(/\.html$/, ""),
    liveUrl: b.website + "/" + slug,
    seoTitle: pat.landingTitle(b),
    seoDesc: landingMeta(b),
    keywords: ["pharmacy " + b.seoTown, "chemist " + b.seoTown, b.brandLabel, b.postalCode.split(" ")[0]].join(", ")
  });
});

// INDEX.md
var md = "# Branch landing pages - paste manifest\n\n" +
  "Shared-domain split (item 2.2): each branch on a shared website gets its own\n" +
  "local landing page. Paste each file into a Weebly Embed Code element on the\n" +
  "matching URL and set the Weebly page SEO title and description.\n\n" +
  "Suggested Weebly placement: top-level pages, one per branch, linked from the\n" +
  "site navigation (e.g. \"Ainsdale branch\" / \"Eccleston branch\").\n\n" +
  "Before pasting: each landing page links to that branch's own service pages\n" +
  "(pharmacy-first-, switch-prescriptions-, weight-loss-clinic-, travel-clinic-,\n" +
  "contraception-). Those pages exist in this repo but are not live on every\n" +
  "site yet. Paste the branch's service pages first, or paste them in the same\n" +
  "session, so the landing page does not link to pages that return a 404.\n\n" +
  "LIVE STATE, READ 2026-08-12: not one of these pages is live. All six URLs\n" +
  "below were fetched again that day and all six still returned a 404, unchanged\n" +
  "from the 2026-08-10 and 2026-08-11 readings. The prerequisite remains\n" +
  "satisfied: every service page these six pages link to was fetched in the\n" +
  "same pass, thirty URLs across the three domains (five per\n" +
  "branch: pharmacy-first-, switch-prescriptions-, weight-loss-clinic-,\n" +
  "travel-clinic-, contraception-), and all thirty returned 200. The paste\n" +
  "order constraint in the paragraph above is therefore already satisfied for\n" +
  "ALL THREE pairs, not just Fishlocks Chemist: each of the six landing pages can be\n" +
  "pasted on its own, in any order, and no link on it will 404. The only thing\n" +
  "between the shared-domain split and a visitor or Google is the six Weebly\n" +
  "pastes themselves. The six packs in gbp-packs/ each set the Google profile\n" +
  "website to the matching URL below, so six Google Business Profiles are\n" +
  "waiting on this paste and no other. Re-read this before trusting it: it\n" +
  "records one reading on one day, not a standing fact.\n\n";
manifest.forEach(function (m) {
  md += "## " + m.branch + "\n";
  md += "- **Page slug / URL:** `" + m.file + "` -> " + m.liveUrl + "\n";
  md += "- **SEO title:** " + m.seoTitle + "\n";
  md += "- **SEO description:** " + m.seoDesc + "\n\n";
});
fs.writeFileSync(path.join(outDir, "INDEX.md"), md);

// SEO.md
var seo = "# Weebly SEO Settings - branch landing pages\n\nFor each page, paste these into Weebly > Pages > (page) > SEO Settings.\nMeta keywords are ignored by Google/Bing (kept for completeness only).\n\n";
manifest.forEach(function (m) {
  seo += "## " + m.branch + "\n";
  seo += "- **Page Title:** " + m.seoTitle + "\n";
  seo += "- **Page Permalink:** " + m.permalink + "\n";
  seo += "- **Page Description:** " + m.seoDesc + "\n";
  seo += "- **Meta Keywords:** " + m.keywords + "\n\n";
});
fs.writeFileSync(path.join(outDir, "SEO.md"), seo);

console.log("Generated " + manifest.length + " branch landing pages into modules/branch/pages/");
