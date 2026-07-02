/*
  Generates the NHS Pharmacy Contraception Service page per store from
  branches.json (same data model as build-service-pages.js). One page per store,
  reusing the store's Appointedd "Pharmacy 1st" widget for booking.

  Run:  node tools/build-contraception-pages.js
  Out:  modules/service/pages/contraception-<brandSlug>-<townSlug>.html
        + cowork CONTRACEPTION_SEO.md (per-store SEO + raw URL)

  Clinical wording is NHS Pharmacy Contraception Service standard (NHS England /
  NHS.uk). No NHS-set age range -> neutral "Free NHS service" badge; under-16s
  carry a safeguarding step. Superintendent pharmacist signs off before publish.
*/
const fs = require("fs");
const path = require("path");

const PIN = "76221ba";
const CDN = "https://cdn.jsdelivr.net/gh/rishi235/rbh-site-data@" + PIN + "/modules/service";
const WHATSAPP = "447521775631";
const APPOINTEDD_SDK = "https://booking-tools-sdk.appointedd.com/appointedd-booking-tools-sdk-v1.js";
const RAW = "https://raw.githubusercontent.com/rishi235/rbh-site-data/service-module-phase1/modules/service/pages/";

const BUILD = [
  "cherrylane_liverpool", "colemanleigh_liverpool", "fishlocks_ainsdale",
  "fishlocks_eccleston", "gordonshorts_crosby", "hirshmans_ainsdale",
  "mccanns_aigburth", "mccanns_sandringham", "riddings_timperley",
  "scorah_bramhall", "scorah_hazel", "skchemists_bootle",
  "smartts_bootle", "tiffenbergs_longmoor"
];

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "branches.json"), "utf8"));
const byId = {};
data.branches.forEach(function (b) { byId[b.id] = b; });

function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function tel(b) { return (b.phone || "").replace(/\s+/g, ""); }
function fullAddr(b) { return [b.streetAddress, b.addressLocality, b.postalCode].filter(Boolean).join(", "); }
function outward(b) { return ((b || {}).postalCode || "").split(" ")[0]; }

function storeOf(id) {
  const b = byId[id];
  if (!b) throw new Error("Unknown branch id: " + id);
  if (!b.brandSlug || !b.seoTown || !b.townSlug || !b.website) throw new Error("Missing service fields: " + id);
  return { id: id, brand: b.brandLabel, brandSlug: b.brandSlug, town: b.seoTown, townSlug: b.townSlug, site: b.website, widgets: b.widgets || {} };
}

function headLinks() {
  return '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="' + CDN + '/service.css">\n' +
    '<script src="' + CDN + '/service.js" defer></script>';
}

function bookingCard(store, b) {
  var widgetId = store.widgets && store.widgets.pharmacyFirst;
  var inner = widgetId
    ? '<div class="booking-widget">\n' +
      '            <script src="' + APPOINTEDD_SDK + '"></script>\n' +
      '            <div id="rbhsv-booking" style="background-color:#ffffff;"></div>\n' +
      '            <script type="text/javascript">\n' +
      '              Appointedd.renderWidget("rbhsv-booking", { widgetId: "' + widgetId + '", enableLanguageSelector: false });\n' +
      '            </script>\n' +
      '          </div>'
    : '<div class="booking-placeholder">\n' +
      '            <strong>Book your free NHS appointment</strong>\n' +
      '            <p>Call <a href="tel:' + tel(b) + '">' + esc(b.phone) + '</a> to book, or request a callback below and we will arrange a time.</p>\n' +
      '          </div>';
  return '<div class="booking-card pad" id="book">\n' +
    '          <h2 class="booking-head">Book your contraception appointment</h2>\n' +
    '          <p class="booking-sub">Free NHS contraception service at ' + esc(store.brand) + '. Choose a time that suits you.</p>\n' +
    '          ' + inner + '\n        </div>';
}

function trustBar(store) {
  return '<div class="trust-bar">\n' +
    '      <div class="trust-item"><strong>Free NHS service</strong><span>No charge to be seen or supplied</span></div>\n' +
    '      <div class="trust-item"><strong>No GP appointment</strong><span>Be seen by a pharmacist directly</span></div>\n' +
    '      <div class="trust-item"><strong>Confidential</strong><span>Your GP is only told with your consent</span></div>\n' +
    '      <div class="trust-item"><strong>Local ' + esc(store.town) + ' team</strong><span>Seen privately in the pharmacy</span></div>\n' +
    '    </div>';
}

function enquiryForm(store) {
  return '<div class="form-card hero-form pad" id="svc-enquiry">\n' +
    '          <iframe name="svc-post" id="svc-post" style="display:none;"></iframe>\n' +
    '          <form id="svc-form" method="post" target="svc-post" novalidate>\n' +
    '            <h2 class="form-title">Prefer us to call you?</h2>\n' +
    '            <p class="form-sub">Leave your name and number and our ' + esc(store.town) + ' team will call you back to arrange your appointment.</p>\n' +
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
    '            <p class="privacy">We will only use your details to arrange your appointment.</p>\n' +
    '            <div id="svc-msg" class="msg" aria-live="polite"></div>\n' +
    '          </form>\n' +
    '          <div id="svc-thankyou" class="thankyou">\n' +
    '            <h3>Thank you</h3>\n' +
    '            <p>We have received your request and the team will call you back shortly.</p>\n' +
    '          </div>\n        </div>';
}

function contactCard(store, b) {
  var siteHost = store.site.replace(/^https?:\/\//, "");
  var mapQ = encodeURIComponent(fullAddr(b));
  var reviewLine = b.googleReviewUrl
    ? '\n            <div class="contact-line"><p><strong>Google reviews:</strong> <a href="' + b.googleReviewUrl + '" target="_blank" rel="noopener">Read our latest reviews</a></p></div>'
    : "";
  return '<div class="contact-card pad">\n' +
    '            <h2 class="h2">Contact ' + esc(store.brand) + '</h2>\n' +
    '            <p><strong>' + esc(store.brand) + '</strong></p>\n' +
    '            <div class="contact-line"><p>' + esc(fullAddr(b)) + '</p></div>\n' +
    '            <div class="contact-line"><p><strong>Phone:</strong> <a href="tel:' + tel(b) + '">' + esc(b.phone) + '</a></p></div>\n' +
    '            <div class="contact-line"><p><strong>Website:</strong> <a href="' + store.site + '" target="_blank" rel="noopener">' + esc(siteHost) + '</a></p></div>' + reviewLine + '\n' +
    '            <iframe class="map" src="https://www.google.com/maps?q=' + mapQ + '&output=embed" loading="lazy"></iframe>\n          </div>';
}

function pharmacySchema(store, b, url) {
  return '<script type="application/ld+json">\n' + JSON.stringify({
    "@context": "https://schema.org", "@type": "Pharmacy", "name": store.brand, "url": url,
    "telephone": b.phone || "",
    "address": { "@type": "PostalAddress", "streetAddress": b.streetAddress || "", "addressLocality": b.addressLocality || "", "postalCode": b.postalCode || "", "addressRegion": b.addressRegion || "", "addressCountry": b.addressCountry || "GB" }
  }, null, 2) + "\n</script>";
}

function contraceptionPage(storeId) {
  var store = storeOf(storeId), b = byId[storeId];
  var slug = "contraception-" + store.brandSlug + "-" + store.townSlug + ".html";
  var url = store.site + "/" + slug;
  var title = "NHS contraception service in " + store.town + " - " + store.brand;
  var meta = "Get the contraceptive pill on the NHS at " + store.brand + " in " + store.town + ". Start, restart or continue the pill with no GP appointment needed. Free and confidential.";
  return "<!--\n  " + store.brand.toUpperCase() + " — " + title + " (SEO-first, NHS Pharmacy Contraception Service).\n" +
    "  Weebly page SEO title:       " + title + "\n  Weebly page SEO description:  " + meta + "\n" +
    "  NOTE: NHS Pharmacy Contraception Service standard wording. Superintendent pharmacist signs off before publish.\n-->\n" +
    headLinks() + "\n\n" +
    '<div id="rbhsv-root" data-branch="' + esc(store.brand) + '" data-service="Contraception service" data-wa="' + WHATSAPP + '">\n' +
    '  <div class="wrap">\n\n' +
    '    <section class="hero">\n      <div class="hero-grid">\n        <div>\n' +
    '          <div class="hero-help-row">NHS Pharmacy Contraception Service</div>\n' +
    '          <span class="pill">Free NHS service in ' + esc(store.town) + '</span>\n' +
    '          <h1>NHS contraception service in ' + esc(store.town) + '</h1>\n' +
    '          <p class="hero-proof">Start, restart or continue the contraceptive pill, with no GP appointment needed.</p>\n' +
    '          <p class="hero-sub">' + esc(store.brand) + ' offers the NHS Pharmacy Contraception Service in ' + esc(store.town) + '. A pharmacist can start you on the contraceptive pill, restart it after a break, or provide your ongoing supply, in a private consultation with no GP appointment or referral needed.</p>\n' +
    '          <ul class="hero-points">\n' +
    '            <li>Free NHS service, confidential consultation</li>\n' +
    '            <li>No GP appointment or referral needed</li>\n' +
    '            <li>Combined pill and progestogen-only ("mini") pill</li>\n' +
    '            <li>Seen privately by your local ' + esc(store.town) + ' team</li>\n' +
    '          </ul>\n' +
    '          <div class="hero-actions-stack">\n' +
    '            <a href="#book" class="btn-pill btn-primary"><span>Book an appointment</span></a>\n' +
    '            <a href="tel:' + tel(b) + '" class="btn-pill btn-white"><span>Call ' + esc(b.phone) + '</span></a>\n' +
    '          </div>\n        </div>\n' +
    '        <div>\n          ' + bookingCard(store, b) + '\n        </div>\n' +
    '      </div>\n    </section>\n\n' +
    '    ' + trustBar(store) + '\n\n' +
    '    <section class="section">\n      <h2 class="h2">What this NHS service covers</h2>\n' +
    '      <p class="lead">A pharmacist at ' + esc(store.brand) + ' can help you:</p>\n' +
    '      <div class="faq-card pad">\n        <ul class="hero-points" style="margin-left:20px;color:#374151;max-width:none;">\n' +
    '            <li>Start the contraceptive pill for the first time</li>\n' +
    '            <li>Restart the pill after a break</li>\n' +
    '            <li>Get an ongoing (repeat) supply of your pill</li>\n' +
    '            <li>Choose between the combined pill and the progestogen-only ("mini") pill</li>\n' +
    '        </ul>\n      </div>\n    </section>\n\n' +
    '    <section class="section">\n      <h2 class="h2">Is this service right for you?</h2>\n' +
    '      <div class="eligibility">\n' +
    '        <div class="elig-box elig-yes">\n          <h3>This NHS service can help if you</h3>\n          <ul>\n' +
    '              <li>Want to start, restart or continue the contraceptive pill</li>\n' +
    '              <li>Are happy to have a short private consultation, including a blood pressure and height and weight check</li>\n' +
    '              <li>Want a free, confidential NHS service without a GP appointment</li>\n          </ul>\n        </div>\n' +
    '        <div class="elig-box elig-no">\n          <h3>When we will point you elsewhere</h3>\n          <ul>\n' +
    '              <li>If the pill is not suitable for you, the pharmacist will refer you to a GP or sexual health clinic</li>\n' +
    '              <li>For a coil or implant (long-acting contraception), we will advise where to get this locally</li>\n' +
    '              <li>If you need emergency contraception, ask us or call, this can often be dealt with the same day</li>\n          </ul>\n        </div>\n' +
    '      </div>\n    </section>\n\n' +
    '    <section class="section">\n      <h2 class="h2">How it works at ' + esc(store.brand) + '</h2>\n      <div class="steps">\n' +
    '        <div class="step"><div class="step-no">1</div><h3>Book or call in</h3><p>Book a contraception appointment online, or call us. You can often be seen the same day.</p></div>\n' +
    '        <div class="step"><div class="step-no">2</div><h3>Private consultation</h3><p>You are seen in private. The pharmacist asks about your health, checks your blood pressure and your height and weight, and talks through your options.</p></div>\n' +
    '        <div class="step"><div class="step-no">3</div><h3>Get your supply</h3><p>Where the pill is right for you, the pharmacist supplies it and explains how to take it. If it is not suitable, they advise the best next step.</p></div>\n' +
    '      </div>\n    </section>\n\n' +
    '    <section class="section">\n      <div class="main-grid">\n        <div>\n' +
    '          <div class="faq-card pad">\n            <h2 class="h2">Questions people usually ask</h2>\n' +
    '            <details><summary>Is it free?</summary><div class="answer">Yes. The NHS Pharmacy Contraception Service is free, and there is no prescription charge for the contraception supplied through it.</div></details>\n' +
    '            <details><summary>Do I need to see my GP first?</summary><div class="answer">No. You can come straight to ' + esc(store.brand) + ', no GP appointment or referral is needed.</div></details>\n' +
    '            <details><summary>Can I start the pill, or only continue it?</summary><div class="answer">Both. The pharmacist can start you on the pill for the first time, restart it after a break, or provide your ongoing supply.</div></details>\n' +
    '            <details><summary>Is it confidential?</summary><div class="answer">Yes. Your consultation is private and confidential. We will only tell your GP that you have used the service if you give your consent.</div></details>\n' +
    '            <details><summary>What happens at the appointment?</summary><div class="answer">The pharmacist asks about your health, checks your blood pressure and your height and weight, and explains how to take the pill and what to look out for.</div></details>\n' +
    '          </div>\n        </div>\n' +
    '        <div>\n          ' + enquiryForm(store) + '\n          <div style="margin-top:18px;"></div>\n          ' + contactCard(store, b) + '\n        </div>\n' +
    '      </div>\n    </section>\n\n' +
    '  </div>\n</div>\n\n' +
    pharmacySchema(store, b, url) + "\n";
}

var outDir = path.join(__dirname, "..", "modules", "service", "pages");
fs.mkdirSync(outDir, { recursive: true });

var seoMd = "# NHS Contraception Service — per-store build sheet\n\nOne standalone page per store. Header Type = No Header. Visible in nav (label 'Contraception'). Do NOT publish until superintendent-pharmacist sign-off.\n\n";
BUILD.forEach(function (storeId) {
  var store = storeOf(storeId);
  var slug = "contraception-" + store.brandSlug + "-" + store.townSlug + ".html";
  fs.writeFileSync(path.join(outDir, slug), contraceptionPage(storeId));
  var permalink = slug.replace(/\.html$/, "");
  seoMd += "## " + store.brand + " — " + store.town + "\n" +
    "- **Page name:** Contraception\n" +
    "- **Page Title:** NHS contraception service in " + store.town + " - " + store.brand + "\n" +
    "- **Permalink:** " + permalink + "\n" +
    "- **Description:** Get the contraceptive pill on the NHS at " + store.brand + " in " + store.town + ". Start, restart or continue the pill with no GP appointment needed. Free and confidential.\n" +
    "- **Meta Keywords:** contraceptive pill " + store.town + ", NHS contraception " + store.town + ", pill without prescription " + store.town + ", pharmacy " + store.town + ", " + outward(byId[storeId]) + "\n" +
    "- **HTML URL:** " + RAW + slug + "\n\n";
});
fs.writeFileSync("C:/Users/rishi/OneDrive - RB Healthcare Ltd/Downloads/cowork/CONTRACEPTION_SEO.md", seoMd);
console.log("Generated " + BUILD.length + " contraception pages into modules/service/pages/");
console.log("Build sheet: cowork/CONTRACEPTION_SEO.md");
