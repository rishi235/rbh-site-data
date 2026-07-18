/*
  Generates the private Weight Loss Clinic page (one per store) from
  branches.json + modules/service/DRAFT-weight-loss-copy.html's approved copy.

  Run:  node tools/build-weight-loss-pages.js
  Out:  modules/service/pages/weight-loss-clinic-<brandSlug>-<townSlug>.html,
        plus INDEX.md / SEO.md additions and a PASTE_PACK doc per store.

  This is a PRIVATE, PAID service (not NHS Pharmacy First) — see the governance
  notes at the top of DRAFT-weight-loss-copy.html. No brand-name medicine is
  named anywhere in this generator; eligibility is always framed as "a
  clinician will assess", never a guarantee. CONSULT_FEE below ("from £39.99")
  is RBH's own existing publicly-quoted starting price (rbhealth.co.uk/weight.html),
  not an invented figure.
*/
const fs = require("fs");
const path = require("path");

const PIN = "service-module-phase1";
const CDN = "https://cdn.jsdelivr.net/gh/rishi235/rbh-site-data@" + PIN + "/modules/service";
const WHATSAPP = "447521775631";
const APPOINTEDD_SDK = "https://booking-tools-sdk.appointedd.com/appointedd-booking-tools-sdk-v1.js";
const CONSULT_FEE = "from £39.99";

// Every active, non-disposed brand with a widgets.weightLoss id in branches.json.
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
    "  " + store.brand.toUpperCase() + " — Weight Loss Clinic (private, paid service — NOT NHS).\n" +
    "  Paste this whole block into the Weebly \"Embed Code\" element on " + slug + "\n" +
    "  Weebly page SEO title:       " + title + "\n" +
    "  Weebly page SEO description:  " + meta + "\n" +
    "  NOTE: no brand-name medicine is named anywhere (POM advertising rules). Eligibility\n" +
    "  is framed as a clinical assessment, never a guarantee. Superintendent pharmacist\n" +
    "  signs off wording before publish, per DRAFT-weight-loss-copy.html governance notes.\n" +
    "-->";
}

function headLinks() {
  return '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="' + CDN + '/service.css">\n' +
    '<script src="' + CDN + '/service.js" defer></script>';
}

function bookingCard(store, b) {
  var hasWidget = store.widgets && store.widgets.weightLoss;
  var inner = hasWidget
    ? '<div class="booking-widget">\n' +
      '            <script src="' + APPOINTEDD_SDK + '"></script>\n' +
      '            <div id="rbhsv-booking" style="background-color:#ffffff;"></div>\n' +
      '            <!-- widget rendered by service.js from branches.json - do not hard-code a widgetId -->\n' +
      '          </div>'
    : '<div class="booking-placeholder">\n' +
      '            <!-- APPOINTEDD: add the ' + esc(store.brand) + ' "Weight Loss" widget ID to that branch\'s widgets.weightLoss in branches.json, then re-run the generator. -->\n' +
      '            <strong>Book your private consultation</strong>\n' +
      '            <p>Call <a href="tel:' + tel(b) + '">' + esc(b.phone) + '</a> to book, or request a callback below and we will arrange a time.</p>\n' +
      '          </div>';
  return '' +
    '<div class="booking-card pad" id="book">\n' +
    '          <h2 class="booking-head">Book your Weight Loss Clinic consultation</h2>\n' +
    '          <p class="booking-sub">Private consultation at ' + esc(store.brand) + ', ' + CONSULT_FEE + '. Choose a time that suits you.</p>\n' +
    '          ' + inner + '\n' +
    '        </div>';
}

function enquiryForm(store) {
  return '' +
    '<div class="form-card hero-form pad" id="svc-enquiry">\n' +
    '          <iframe name="svc-post" id="svc-post" style="display:none;"></iframe>\n' +
    '          <form id="svc-form" method="post" target="svc-post" novalidate>\n' +
    '            <h2 class="form-title">Prefer us to call you?</h2>\n' +
    '            <p class="form-sub">Leave your name and number and our ' + esc(store.town) + ' team will call you back to arrange your consultation.</p>\n' +
    '            <div class="form-grid">\n' +
    '              <label>First name *<input type="text" name="first_name" autocomplete="given-name" required></label>\n' +
    '              <label>Last name *<input type="text" name="last_name" autocomplete="family-name" required></label>\n' +
    '              <label>Mobile *<input type="tel" name="mobile" autocomplete="tel" placeholder="07..." required></label>\n' +
    '              <label>Email (optional)<input type="email" name="email" autocomplete="email" placeholder="name@example.com"></label>\n' +
    '              <label class="full">Anything we should know? (optional)<textarea name="message" rows="3"></textarea></label>\n' +
    '            </div>\n' +
    '            <input type="hidden" name="destination" value="">\n' +
    '            <input type="hidden" name="source" value="">\n' +
    '            <input type="hidden" name="website_url" value="">\n' +
    '            <input type="text" name="company" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">\n' +
    '            <div class="actions">\n' +
    '              <button type="submit" class="btn submit-btn"><span>Request a callback</span></button>\n' +
    '              <a id="svc-wa" class="btn wa-btn" href="#" rel="nofollow noopener">Send via WhatsApp instead</a>\n' +
    '            </div>\n' +
    '            <p class="privacy">We will only use your details to arrange your consultation.</p>\n' +
    '            <div id="svc-msg" class="msg" aria-live="polite"></div>\n' +
    '          </form>\n' +
    '          <div id="svc-thankyou" class="thankyou">\n' +
    '            <h3>Thank you</h3>\n' +
    '            <p>We have received your request and the team will call you back shortly.</p>\n' +
    '          </div>\n' +
    '        </div>';
}

function trustBar(store) {
  return '' +
    '<div class="trust-bar">\n' +
    '      <div class="trust-item"><strong>Private service</strong><span>Paid consultation, not funded by the NHS</span></div>\n' +
    '      <div class="trust-item"><strong>Pharmacist-led</strong><span>Full clinical assessment before any prescription</span></div>\n' +
    '      <div class="trust-item"><strong>Local ' + esc(store.town) + ' team</strong><span>Real people, not a call centre</span></div>\n' +
    '      <div class="trust-item"><strong>Ongoing support</strong><span>Follow-up reviews built into your plan</span></div>\n' +
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

function medicalBusinessSchema(store, b, url) {
  return '<script type="application/ld+json">\n' +
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "MedicalBusiness",
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

function weightLossPage(storeId) {
  var store = storeOf(storeId);
  var b = byId[storeId];
  var slug = "weight-loss-clinic-" + store.brandSlug + "-" + store.townSlug + ".html";
  var url = store.site + "/" + slug;
  var title = "Weight Loss Clinic at " + store.brand + ", " + store.town;
  var meta = "Private, pharmacist-led weight loss clinic at " + store.brand + " in " + store.town + ". Full clinical assessment; prescription-only weight-loss medication supplied only where clinically appropriate.";

  return headComment(store, title, meta, slug) + "\n" +
    headLinks() + "\n\n" +
    '<div id="rbhsv-root" data-branch="' + esc(store.brand) + '" data-service="Weight Loss Clinic" data-wa="' + WHATSAPP + '">\n' +
    '  <div class="wrap">\n\n' +
    '    <section class="hero">\n' +
    '      <div class="hero-grid">\n' +
    '        <div>\n' +
    '          <div class="hero-help-row">Private Weight Loss Clinic</div>\n' +
    '          <span class="pill">Private service &middot; not funded by the NHS &middot; ' + esc(store.town) + '</span>\n' +
    '          <h1>Weight Loss Clinic at ' + esc(store.brand) + ' in ' + esc(store.town) + '</h1>\n' +
    '          <p class="hero-proof">Medically-supported weight loss, assessed and supervised by a pharmacist.</p>\n' +
    '          <p class="hero-sub">' + esc(store.brand) + ' offers a private weight loss consultation service in ' + esc(store.town) + '. A qualified pharmacist or clinician will review your health history and, where it is clinically appropriate, prescription-only weight-loss medication can be supplied as part of a supervised plan alongside diet and lifestyle changes. This is a paid private service, not an NHS treatment, and it is not right for everyone &ndash; see below.</p>\n' +
    '          <ul class="hero-points">\n' +
    '            <li>Private, paid consultation with a qualified pharmacist or clinician</li>\n' +
    '            <li>A full health and eligibility check before anything is prescribed</li>\n' +
    '            <li>Prescription-only weight-loss medication supplied only where clinically appropriate</li>\n' +
    '            <li>Ongoing monitoring and follow-up built into your plan</li>\n' +
    '          </ul>\n' +
    '          <div class="hero-actions-stack">\n' +
    '            <a href="#book" class="btn-pill btn-primary"><span>Book a consultation</span></a>\n' +
    '            <a href="tel:' + tel(b) + '" class="btn-pill btn-white"><span>Call ' + esc(b.phone) + '</span></a>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div>\n          ' + bookingCard(store, b) + '\n        </div>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    '    ' + trustBar(store) + '\n\n' +
    '    <section class="section">\n' +
    '      <h2 class="h2">Is this service right for you?</h2>\n' +
    '      <p class="lead">This is a clinical service. A pharmacist or clinician will assess your suitability at consultation &ndash; nothing below is a guarantee of treatment, a specific medicine, or a specific outcome. Individual results vary.</p>\n' +
    '      <div class="eligibility">\n' +
    '        <div class="elig-box elig-yes">\n' +
    '          <h3>Who this service may suit</h3>\n' +
    '          <ul>\n' +
    '            <li>Adults aged 18 and over</li>\n' +
    '            <li>Typically a BMI in the overweight or obese range for your height (your clinician will confirm this at assessment, and may also consider your ethnicity and weight-related health conditions)</li>\n' +
    '            <li>Ready to combine any treatment with diet and lifestyle changes, not use it as a stand-alone fix</li>\n' +
    '            <li>No known medical reason that would make prescription-only weight-loss medication unsuitable, confirmed at your assessment</li>\n' +
    '          </ul>\n' +
    '        </div>\n' +
    '        <div class="elig-box elig-no">\n' +
    '          <h3>When this service is not right for you</h3>\n' +
    '          <ul>\n' +
    '            <li>If you are pregnant, breastfeeding, or trying to become pregnant, this service is not suitable, please speak to your GP or midwife</li>\n' +
    '            <li>Under 18s are not seen under this service</li>\n' +
    '            <li>Certain conditions (including a personal or family history of specific thyroid cancers, pancreatitis, severe gastrointestinal disease, or an active eating disorder) may mean this treatment is not appropriate, the pharmacist will screen for these and advise accordingly</li>\n' +
    '            <li>If you are already taking other weight-loss or diabetes medication, tell the clinician so they can check it is safe to proceed</li>\n' +
    '            <li>If you feel unwell, have symptoms that concern you, or need urgent help, contact your GP or NHS 111, or call 999 in an emergency</li>\n' +
    '          </ul>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    '    <section class="section">\n' +
    '      <h2 class="h2">How the Weight Loss Clinic works</h2>\n' +
    '      <div class="steps">\n' +
    '        <div class="step"><div class="step-no">1</div><h3>Book your consultation</h3><p>Book online or call us. Your first appointment is a private, paid consultation with a pharmacist or clinician, ' + CONSULT_FEE + '.</p></div>\n' +
    '        <div class="step"><div class="step-no">2</div><h3>Full clinical assessment</h3><p>The clinician reviews your health history, weight and any relevant checks, then decides whether prescription-only weight-loss medication is clinically appropriate for you. This is a professional judgement, not a guarantee.</p></div>\n' +
    '        <div class="step"><div class="step-no">3</div><h3>Your ongoing plan</h3><p>If treatment is suitable, it is supplied privately alongside diet and lifestyle advice, with follow-up reviews to monitor how you are getting on. If it is not suitable, the clinician will explain why and advise on the best next step.</p></div>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    '    <section class="section">\n' +
    '      <div class="main-grid">\n' +
    '        <div>\n' +
    '          <div class="faq-card pad">\n' +
    '            <h2 class="h2">Questions people usually ask</h2>\n' +
    '            <details><summary>Is this an NHS service?</summary><div class="answer">No. The Weight Loss Clinic is a private service. Consultations and any medication supplied are paid for privately; this is not free or NHS-funded.</div></details>\n' +
    '            <details><summary>What does it cost?</summary><div class="answer">The initial consultation is ' + CONSULT_FEE + '. If medication is prescribed, its cost is separate and will be explained clearly before you agree to anything, so there are no hidden charges.</div></details>\n' +
    '            <details><summary>Will I definitely be prescribed weight-loss medication?</summary><div class="answer">No. This is a clinical assessment, not an automatic prescription. The pharmacist or clinician only prescribes where it is clinically appropriate for you, based on your health history and the eligibility criteria above. If it is not appropriate, they will explain why and discuss other options.</div></details>\n' +
    '            <details><summary>Which medication will I be offered?</summary><div class="answer">There are several prescription-only weight-loss medicines available in the UK, and your clinician will discuss which, if any, may be suitable for you at your assessment. We cannot guarantee that any particular product will be available or right for you, this is decided case by case.</div></details>\n' +
    '            <details><summary>Is it safe?</summary><div class="answer">Any prescribing is carried out by a qualified pharmacist or clinician, following a full assessment, with monitoring and follow-up built into your plan. As with any medicine, there can be side effects, and it is not suitable for everyone, your clinician will talk you through this before you decide.</div></details>\n' +
    '            <details><summary>Do I need a GP referral?</summary><div class="answer">No. You can book directly with ' + esc(store.brand) + '. This service does not replace your GP, and the clinician will refer you back to your GP if that is the more appropriate route.</div></details>\n' +
    '            <details><summary>Do I need an appointment?</summary><div class="answer">Yes, this service is by appointment. Book online for a set time, or call in, so you can be seen privately without waiting.</div></details>\n' +
    '          </div>\n' +
    '          <div class="faq-card pad" style="margin-top:18px;background:#f7fbfd;">\n' +
    '            <p style="margin:0;font-size:13px;line-height:1.6;color:#4b5563;">This page is general information, not medical advice, and does not guarantee eligibility, treatment or results. Suitability, any prescription, and expected outcomes are decided individually by a qualified pharmacist or clinician following a full assessment. Prices shown are indicative and may change; your clinician will confirm current pricing at consultation. Individual results vary depending on factors including starting weight, diet and lifestyle.</p>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div>\n          ' + enquiryForm(store) + '\n          <div style="margin-top:18px;"></div>\n          ' + contactCard(store, b) + '\n        </div>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    '  </div>\n' +
    '</div>\n\n' +
    medicalBusinessSchema(store, b, url) + "\n";
}

// --- write ------------------------------------------------------------------

var outDir = path.join(__dirname, "..", "modules", "service", "pages");
fs.mkdirSync(outDir, { recursive: true });

var manifest = [];

BUILD.forEach(function (storeId) {
  var store = storeOf(storeId);
  var slug = "weight-loss-clinic-" + store.brandSlug + "-" + store.townSlug + ".html";
  var html = weightLossPage(storeId);
  fs.writeFileSync(path.join(outDir, slug), html);
  manifest.push({
    store: store.brand + " — " + store.town,
    storeSlug: store.brandSlug + "-" + store.townSlug,
    name: "Weight Loss Clinic",
    type: "Overview",
    file: slug,
    permalink: slug.replace(/\.html$/, ""),
    liveUrl: store.site + "/" + slug,
    seoTitle: "Weight Loss Clinic at " + store.brand + ", " + store.town,
    seoDesc: "Private, pharmacist-led weight loss clinic at " + store.brand + " in " + store.town + ". Full clinical assessment; prescription-only weight-loss medication supplied only where clinically appropriate.",
    keywords: ["weight loss clinic " + store.town, "medicated weight loss " + store.town, store.brand, "pharmacy " + store.town].filter(Boolean).join(", "),
    html: html
  });
});

var md = "# Weight Loss Clinic pages — paste manifest\n\n" +
  "Private, paid service. Paste each file's contents into a Weebly Embed Code element on the matching URL, and set the Weebly page SEO title + description.\n\n" +
  "Before publishing: superintendent pharmacist signs off wording per DRAFT-weight-loss-copy.html governance notes.\n\n";
manifest.forEach(function (m) {
  md += "## " + m.store + " — " + m.type + "\n";
  md += "- **Page slug / URL:** `" + m.file + "` -> " + m.liveUrl + "\n";
  md += "- **SEO title:** " + m.seoTitle + "\n";
  md += "- **SEO description:** " + m.seoDesc + "\n\n";
});
fs.writeFileSync(path.join(outDir, "WEIGHT-LOSS-INDEX.md"), md);

var seo = "# Weebly SEO Settings — Weight Loss Clinic pages\n\nFor each page, paste these into Weebly > Pages > (page) > SEO Settings.\n\n";
manifest.forEach(function (m) {
  seo += "## " + m.store + "\n";
  seo += "- **Page Title:** " + m.seoTitle + "\n";
  seo += "- **Page Permalink:** " + m.permalink + "\n";
  seo += "- **Page Description:** " + m.seoDesc + "\n";
  seo += "- **Meta Keywords:** " + m.keywords + "\n\n";
});
fs.writeFileSync(path.join(outDir, "WEIGHT-LOSS-SEO.md"), seo);

var packDir = "C:/Users/rishi/OneDrive - RB Healthcare Ltd/Downloads/cowork/PASTE_PACK";
fs.mkdirSync(packDir, { recursive: true });
var byStore = {};
manifest.forEach(function (m) { (byStore[m.storeSlug] = byStore[m.storeSlug] || []).push(m); });
Object.keys(byStore).forEach(function (ss) {
  var pages = byStore[ss];
  var store = pages[0].store;
  var doc = "# PASTE PACK — Weight Loss Clinic — " + store + "\n\nCreate a Standard Page, set Header Type = No Header, set the 4 SEO fields, drop an Embed Code element, paste the HTML block.\n\n";
  pages.forEach(function (m) {
    doc += "\n---\n\n## " + m.name + "\n\n";
    doc += "**SEO Title:** " + m.seoTitle + "\n\n";
    doc += "**Permalink:** " + m.permalink + "\n\n";
    doc += "**SEO Description:** " + m.seoDesc + "\n\n";
    doc += "**Meta Keywords:** " + m.keywords + "\n\n";
    doc += "**HTML to paste into the Embed Code block:**\n\n";
    doc += "```html\n" + m.html.replace(/```/g, "``​`") + "\n```\n";
  });
  fs.writeFileSync(path.join(packDir, ss + "-weight-loss.md"), doc);
});

console.log("Generated " + manifest.length + " Weight Loss Clinic pages into modules/service/pages/");
