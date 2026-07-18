/*
  Generates the private Travel Clinic page (one per store) from branches.json +
  modules/service/DRAFT-travel-clinic-copy.html's approved copy.

  Run:  node tools/build-travel-clinic-pages.js
  Out:  modules/service/pages/travel-clinic-<brandSlug>-<townSlug>.html,
        plus INDEX.md / SEO.md additions and a PASTE_PACK doc per store.

  This is a PRIVATE, PAID service — not NHS Pharmacy First (some individual
  vaccines may be NHS-funded depending on personal circumstances; the copy
  flags this as "ask the pharmacist", never a blanket promise). No vaccine is
  claimed to be guaranteed in stock. See governance notes at the top of
  DRAFT-travel-clinic-copy.html.
*/
const fs = require("fs");
const path = require("path");

const PIN = "service-module-phase1";
const CDN = "https://cdn.jsdelivr.net/gh/rishi235/rbh-site-data@" + PIN + "/modules/service";
const WHATSAPP = "447521775631";
const APPOINTEDD_SDK = "https://booking-tools-sdk.appointedd.com/appointedd-booking-tools-sdk-v1.js";

// Every active, non-disposed brand with a widgets.travelClinic id in branches.json.
const BUILD = [
  "cherrylane_liverpool",
  "clearchemist_aintree",
  "colemanleigh_liverpool",
  "fishlocks_ainsdale",
  "fishlocks_eccleston",
  "gordonshorts_crosby",
  "hirshmans_ainsdale",
  "mccanns_aigburth",
  "mccanns_sandringham",
  "riddings_timperley",
  "scorah_bramhall",
  "scorah_hazel",
  "skchemists_bootle",
  "smartts_bootle",
  "tiffenbergs_longmoor"
];

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "branches.json"), "utf8"));
const byId = {};
data.branches.forEach(function (b) { byId[b.id] = b; });

function storeOf(id) {
  const b = byId[id];
  if (!b) throw new Error("Unknown branch id in BUILD: " + id);
  if (!b.brandSlug || !b.seoTown || !b.townSlug || !b.website) {
    throw new Error("Branch " + id + " is missing service-layer fields (brandSlug/seoTown/townSlug/website) in branches.json");
  }
  return {
    id: id,
    brand: b.brandLabel,
    brandSlug: b.brandSlug,
    town: b.seoTown,
    townSlug: b.townSlug,
    site: b.website,
    widgets: b.widgets || {}
  };
}

function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function tel(b) { return (b.phone || "").replace(/\s+/g, ""); }
function fullAddr(b) { return [b.streetAddress, b.addressLocality, b.postalCode].filter(Boolean).join(", "); }

function headComment(store, title, meta, slug) {
  return "<!--\n" +
    "  " + store.brand.toUpperCase() + " — Travel Clinic (private, paid service).\n" +
    "  Paste this whole block into the Weebly \"Embed Code\" element on " + slug + "\n" +
    "  Weebly page SEO title:       " + title + "\n" +
    "  Weebly page SEO description:  " + meta + "\n" +
    "  NOTE: no vaccine is claimed guaranteed in stock; NHS-funded exceptions are\n" +
    "  flagged as \"ask the pharmacist\", never a blanket promise. Superintendent\n" +
    "  pharmacist signs off wording before publish, per DRAFT-travel-clinic-copy.html.\n" +
    "-->";
}

function headLinks() {
  return '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="' + CDN + '/service.css">\n' +
    '<script src="' + CDN + '/service.js" defer></script>';
}

function bookingCard(store, b) {
  var hasWidget = store.widgets && store.widgets.travelClinic;
  var inner = hasWidget
    ? '<div class="booking-widget">\n' +
      '            <script src="' + APPOINTEDD_SDK + '"></script>\n' +
      '            <div id="rbhsv-booking" style="background-color:#ffffff;"></div>\n' +
      '            <!-- widget rendered by service.js from branches.json - do not hard-code a widgetId -->\n' +
      '          </div>'
    : '<div class="booking-placeholder">\n' +
      '            <!-- APPOINTEDD: add the ' + esc(store.brand) + ' "Travel Clinic" widget ID to that branch\'s widgets.travelClinic in branches.json, then re-run the generator. -->\n' +
      '            <strong>Book your travel consultation</strong>\n' +
      '            <p>Call <a href="tel:' + tel(b) + '">' + esc(b.phone) + '</a> to book, or request a callback below and we will arrange a time.</p>\n' +
      '          </div>';
  return '' +
    '<div class="booking-card pad" id="book">\n' +
    '          <h2 class="booking-head">Book your travel consultation</h2>\n' +
    '          <p class="booking-sub">Private travel clinic appointments at ' + esc(store.brand) + '. Choose a time that suits you.</p>\n' +
    '          ' + inner + '\n' +
    '        </div>';
}

function trustBar(store) {
  return '' +
    '<div class="trust-bar">\n' +
    '      <div class="trust-item"><strong>Qualified advisors</strong><span>Trained travel health pharmacists</span></div>\n' +
    '      <div class="trust-item"><strong>Personalised advice</strong><span>Based on your destination and health history</span></div>\n' +
    '      <div class="trust-item"><strong>Local ' + esc(store.town) + ' team</strong><span>Real people, not a call centre</span></div>\n' +
    '      <div class="trust-item"><strong>Private consultation</strong><span>Seen discreetly in the pharmacy</span></div>\n' +
    '    </div>';
}

function contactCard(store, b) {
  var siteHost = store.site.replace(/^https?:\/\//, "");
  var mapQ = encodeURIComponent(fullAddr(b));
  var reviewLine = b.googleReviewUrl
    ? '\n            <div class="contact-line"><p><strong>Google reviews:</strong> <a href="' + b.googleReviewUrl + '" target="_blank" rel="noopener">Read our latest reviews</a></p></div>'
    : "";
  return '' +
    '<div class="contact-card pad">\n' +
    '            <h2 class="h2">Contact ' + esc(store.brand) + '</h2>\n' +
    '            <p><strong>' + esc(store.brand) + '</strong></p>\n' +
    '            <div class="contact-line"><p>' + esc(fullAddr(b)) + '</p></div>\n' +
    '            <div class="contact-line"><p><strong>Phone:</strong> <a href="tel:' + tel(b) + '">' + esc(b.phone) + '</a></p></div>\n' +
    '            <div class="contact-line"><p><strong>Website:</strong> <a href="' + store.site + '" target="_blank" rel="noopener">' + esc(siteHost) + '</a></p></div>' + reviewLine + '\n' +
    '            <iframe class="map" src="https://www.google.com/maps?q=' + mapQ + '&output=embed" loading="lazy"></iframe>\n' +
    '          </div>';
}

function pharmacySchema(store, b, url) {
  return '<script type="application/ld+json">\n' +
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Pharmacy",
      "name": store.brand,
      "url": url,
      "telephone": b.phone || "",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": b.streetAddress || "",
        "addressLocality": b.addressLocality || "",
        "postalCode": b.postalCode || "",
        "addressRegion": b.addressRegion || "",
        "addressCountry": b.addressCountry || "GB"
      }
    }, null, 2) + "\n</script>";
}

function travelClinicPage(storeId) {
  var store = storeOf(storeId);
  var b = byId[storeId];
  var slug = "travel-clinic-" + store.brandSlug + "-" + store.townSlug + ".html";
  var url = store.site + "/" + slug;
  var title = "Travel Clinic at " + store.brand + ", " + store.town;
  var meta = "Private travel health clinic at " + store.brand + " in " + store.town + ". Personalised travel vaccination and malaria prevention advice, subject to availability and clinical suitability.";

  return headComment(store, title, meta, slug) + "\n" +
    headLinks() + "\n\n" +
    '<div id="rbhsv-root" data-branch="' + esc(store.brand) + '" data-service="Travel Clinic" data-wa="' + WHATSAPP + '">\n' +
    '  <div class="wrap">\n\n' +
    '    <section class="hero">\n' +
    '      <div class="hero-grid">\n' +
    '        <div>\n' +
    '          <div class="hero-help-row">Travel Clinic</div>\n' +
    '          <span class="pill">Private travel health service at your local ' + esc(store.town) + ' pharmacy</span>\n' +
    '          <h1>Travel Clinic at ' + esc(store.brand) + ' in ' + esc(store.town) + '</h1>\n' +
    '          <p class="hero-proof">Personalised travel health advice and vaccinations before you go.</p>\n' +
    '          <p class="hero-sub">' + esc(store.brand) + ' offers a private travel health consultation service in ' + esc(store.town) + '. A qualified travel health advisor or pharmacist reviews your destination, itinerary and medical history, then recommends the vaccinations and malaria prevention that are right for your trip. This is a private, paid service, not an NHS-funded appointment, though some individual vaccines may be available on the NHS depending on your circumstances, the pharmacist will advise.</p>\n' +
    '          <ul class="hero-points">\n' +
    '            <li>One-to-one consultation with a qualified travel health advisor</li>\n' +
    '            <li>A wide range of travel vaccinations, subject to availability and clinical suitability</li>\n' +
    '            <li>Advice on malaria prevention tablets for your destination</li>\n' +
    '            <li>Recommended booking 6 to 8 weeks before you travel</li>\n' +
    '          </ul>\n' +
    '          <div class="hero-actions-stack">\n' +
    '            <a href="#book" class="btn-pill btn-primary"><span>Book a travel consultation</span></a>\n' +
    '            <a href="tel:' + tel(b) + '" class="btn-pill btn-white"><span>Call ' + esc(b.phone) + '</span></a>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div>\n          ' + bookingCard(store, b) + '\n        </div>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    '    ' + trustBar(store) + '\n\n' +
    '    <section class="section">\n' +
    '      <h2 class="h2">Travel vaccinations and advice we can help with</h2>\n' +
    '      <p class="lead">This is a private service covering a wide range of travel-related vaccines and advice, subject to availability and clinical suitability. Exactly what you need depends on where you are going, so book a consultation and the pharmacist will confirm what applies to your trip.</p>\n' +
    '      <div class="condition-grid">\n' +
    '        <div class="condition-card">\n' +
    '          <strong>Yellow fever</strong>\n' +
    '          <span>Required or recommended for parts of Africa and South America.</span>\n' +
    '        </div>\n' +
    '        <div class="condition-card">\n' +
    '          <strong>Typhoid</strong>\n' +
    '          <span>Recommended for many long-haul and rural destinations.</span>\n' +
    '        </div>\n' +
    '        <div class="condition-card">\n' +
    '          <strong>Hepatitis A &amp; B</strong>\n' +
    '          <span>Common recommendations depending on destination and activities.</span>\n' +
    '        </div>\n' +
    '        <div class="condition-card">\n' +
    '          <strong>Rabies</strong>\n' +
    '          <span>Considered for remote travel or higher animal-contact risk.</span>\n' +
    '        </div>\n' +
    '        <div class="condition-card">\n' +
    '          <strong>Japanese encephalitis</strong>\n' +
    '          <span>Relevant for some rural and longer-stay itineraries in Asia.</span>\n' +
    '        </div>\n' +
    '        <div class="condition-card">\n' +
    '          <strong>Malaria prevention</strong>\n' +
    '          <span>Advice and tablets suited to your destination and travel dates.</span>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    '    <section class="section">\n' +
    '      <h2 class="h2">Is this service right for you?</h2>\n' +
    '      <div class="eligibility">\n' +
    '        <div class="elig-box elig-yes">\n' +
    '          <h3>Who a travel consultation is for</h3>\n' +
    '          <ul>\n' +
    '            <li>Anyone travelling abroad who wants personalised vaccination and health advice</li>\n' +
    '            <li>Travellers booking 6 to 8 weeks or more before departure, giving time for vaccines to take effect and, where needed, multiple doses</li>\n' +
    '            <li>Anyone unsure which vaccines or malaria tablets suit their itinerary</li>\n' +
    '          </ul>\n' +
    '        </div>\n' +
    '        <div class="elig-box elig-no">\n' +
    '          <h3>When you may need a different or extra assessment</h3>\n' +
    '          <ul>\n' +
    '            <li>Pregnant or breastfeeding travellers should mention this when booking, as some vaccines need individual clinical review</li>\n' +
    '            <li>Certain medical conditions, a weakened immune system, or regular medication may affect which vaccines are suitable, the pharmacist will assess this with you</li>\n' +
    '            <li>Travelling within the next 1 to 2 weeks may limit which vaccines can still be effective in time, call us and we will advise on the best option</li>\n' +
    '            <li>Children and infants may need a different pathway, please ask when booking</li>\n' +
    '          </ul>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    '    <section class="section">\n' +
    '      <h2 class="h2">How a travel consultation works</h2>\n' +
    '      <div class="steps">\n' +
    '        <div class="step"><div class="step-no">1</div><h3>Book a consultation</h3><p>Book online or call us. We recommend booking 6 to 8 weeks before you travel, as some vaccines need time to work or are given as a course.</p></div>\n' +
    '        <div class="step"><div class="step-no">2</div><h3>Discuss your itinerary</h3><p>You are seen privately. The travel health advisor reviews your destination, trip length, activities and medical history to work out what you need.</p></div>\n' +
    '        <div class="step"><div class="step-no">3</div><h3>Get vaccinated or advised</h3><p>Where a vaccine is suitable and available, it can be given during your visit. You will also get tailored advice on malaria prevention and general travel health.</p></div>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    '    <section class="section">\n' +
    '      <div class="main-grid">\n' +
    '        <div>\n' +
    '          <div class="faq-card pad">\n' +
    '            <h2 class="h2">Questions people usually ask</h2>\n' +
    '            <details><summary>Is the Travel Clinic free on the NHS?</summary><div class="answer">No. The travel consultation and most travel vaccines are a private, paid service. Some individual vaccines, such as typhoid or hepatitis A, may be available free on the NHS depending on your personal circumstances, the pharmacist can tell you what applies to you.</div></details>\n' +
    '            <details><summary>How far in advance should I book?</summary><div class="answer">Ideally 6 to 8 weeks before you travel. Some vaccines are given as a course of more than one dose, or take time to give full protection, so booking early gives the best cover. If you are travelling sooner, contact us and we will advise on what is still possible.</div></details>\n' +
    '            <details><summary>Will you definitely have the vaccine I need in stock?</summary><div class="answer">We offer a wide range of travel vaccinations, but availability can vary and some vaccines need to be ordered in. Suitability is also assessed individually. Book a consultation and the pharmacist will confirm what is available and appropriate for your trip.</div></details>\n' +
    '            <details><summary>Can anyone use the Travel Clinic?</summary><div class="answer">Most adult travellers can. If you are pregnant or breastfeeding, have a medical condition, a weakened immune system, are travelling with young children, or are travelling at very short notice, the pharmacist will assess your individual situation before recommending anything.</div></details>\n' +
    '            <details><summary>Do I need an appointment?</summary><div class="answer">Yes, the travel consultation is by appointment so the advisor has time to go through your itinerary and health history properly. Book online for a set time, or call us.</div></details>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div>\n          ' + contactCard(store, b) + '\n        </div>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    '  </div>\n' +
    '</div>\n\n' +
    pharmacySchema(store, b, url) + "\n";
}

// --- write ------------------------------------------------------------------

var outDir = path.join(__dirname, "..", "modules", "service", "pages");
fs.mkdirSync(outDir, { recursive: true });

var manifest = [];

BUILD.forEach(function (storeId) {
  var store = storeOf(storeId);
  var slug = "travel-clinic-" + store.brandSlug + "-" + store.townSlug + ".html";
  var html = travelClinicPage(storeId);
  fs.writeFileSync(path.join(outDir, slug), html);
  manifest.push({
    store: store.brand + " — " + store.town,
    storeSlug: store.brandSlug + "-" + store.townSlug,
    name: "Travel Clinic",
    type: "Overview",
    file: slug,
    permalink: slug.replace(/\.html$/, ""),
    liveUrl: store.site + "/" + slug,
    seoTitle: "Travel Clinic at " + store.brand + ", " + store.town,
    seoDesc: "Private travel health clinic at " + store.brand + " in " + store.town + ". Personalised travel vaccination and malaria prevention advice, subject to availability and clinical suitability.",
    keywords: ["travel clinic " + store.town, "travel vaccinations " + store.town, store.brand, "pharmacy " + store.town].filter(Boolean).join(", "),
    html: html
  });
});

var md = "# Travel Clinic pages — paste manifest\n\n" +
  "Private, paid service. Paste each file's contents into a Weebly Embed Code element on the matching URL, and set the Weebly page SEO title + description.\n\n" +
  "Before publishing: superintendent pharmacist signs off wording per DRAFT-travel-clinic-copy.html governance notes.\n\n";
manifest.forEach(function (m) {
  md += "## " + m.store + " — " + m.type + "\n";
  md += "- **Page slug / URL:** `" + m.file + "` -> " + m.liveUrl + "\n";
  md += "- **SEO title:** " + m.seoTitle + "\n";
  md += "- **SEO description:** " + m.seoDesc + "\n\n";
});
fs.writeFileSync(path.join(outDir, "TRAVEL-CLINIC-INDEX.md"), md);

var seo = "# Weebly SEO Settings — Travel Clinic pages\n\nFor each page, paste these into Weebly > Pages > (page) > SEO Settings.\n\n";
manifest.forEach(function (m) {
  seo += "## " + m.store + "\n";
  seo += "- **Page Title:** " + m.seoTitle + "\n";
  seo += "- **Page Permalink:** " + m.permalink + "\n";
  seo += "- **Page Description:** " + m.seoDesc + "\n";
  seo += "- **Meta Keywords:** " + m.keywords + "\n\n";
});
fs.writeFileSync(path.join(outDir, "TRAVEL-CLINIC-SEO.md"), seo);

var packDir = "C:/Users/rishi/OneDrive - RB Healthcare Ltd/Downloads/cowork/PASTE_PACK";
fs.mkdirSync(packDir, { recursive: true });
var byStore = {};
manifest.forEach(function (m) { (byStore[m.storeSlug] = byStore[m.storeSlug] || []).push(m); });
Object.keys(byStore).forEach(function (ss) {
  var pages = byStore[ss];
  var store = pages[0].store;
  var doc = "# PASTE PACK — Travel Clinic — " + store + "\n\nCreate a Standard Page, set Header Type = No Header, set the 4 SEO fields, drop an Embed Code element, paste the HTML block.\n\n";
  pages.forEach(function (m) {
    doc += "\n---\n\n## " + m.name + "\n\n";
    doc += "**SEO Title:** " + m.seoTitle + "\n\n";
    doc += "**Permalink:** " + m.permalink + "\n\n";
    doc += "**SEO Description:** " + m.seoDesc + "\n\n";
    doc += "**Meta Keywords:** " + m.keywords + "\n\n";
    doc += "**HTML to paste into the Embed Code block:**\n\n";
    doc += "```html\n" + m.html.replace(/```/g, "``​`") + "\n```\n";
  });
  fs.writeFileSync(path.join(packDir, ss + "-travel-clinic.md"), doc);
});

console.log("Generated " + manifest.length + " Travel Clinic pages into modules/service/pages/");
