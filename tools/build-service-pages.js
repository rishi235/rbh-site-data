/*
  Generates SEO-first Pharmacy First pages (one overview + per-condition pages)
  per store from branches.json + the config below.

  Run:  node tools/build-service-pages.js
  Out:  modules/service/pages/<slug>.html, plus INDEX.md and SEO.md

  Model (same as the switch module): clinical copy for each condition is written
  ONCE here; per-store pages are that copy stamped with the store's town, phone,
  address and Appointedd booking widget. Add a store to STORES and a condition to
  CONDITIONS, then re-run.

  IMPORTANT before going live:
    1. Set PIN to the commit hash that contains service.css / service.js (immutable
       = no jsDelivr lag), the same way the switch pages pin a hash.
    2. Drop each store's real Appointedd "Pharmacy 1st" embed into STORES[...].widgets
       (replace the null). Until then pages render a graceful "call us / callback"
       fallback instead of the widget.
    3. Clinical copy is NHS Pharmacy First standard wording. Superintendent pharmacist
       signs off final wording before publish (governance).
*/
const fs = require("fs");
const path = require("path");

// Commit hash the pages pin service.css / service.js to. "main" is fine for local
// preview; set to the real hash on rollout (see note above).
const PIN = "76221ba";
const CDN = "https://cdn.jsdelivr.net/gh/rishi235/rbh-site-data@" + PIN + "/modules/service";
const WHATSAPP = "447521775631";

// Appointedd SDK is identical for every store/service; only the widgetId changes.
const APPOINTEDD_SDK = "https://booking-tools-sdk.appointedd.com/appointedd-booking-tools-sdk-v1.js";

// ---------------------------------------------------------------------------
// Which stores to build, by branches.json id. Add an id here as each store is
// brought online. Everything the page needs is read from branches.json: brand
// (brandLabel), brandSlug, seoTown/townSlug, website, phone/address, and the
// Appointedd widget IDs (widgets.pharmacyFirst). branches.json is the single
// source of truth — there is no duplicate per-store config here.
// To add a store's booking widget: Appointedd > Booking Tools > Booking Widgets
// > open "<Store> - Pharmacy 1st" > Get embed code > copy the widgetId into that
// branch's `widgets.pharmacyFirst` in branches.json.
// ---------------------------------------------------------------------------
const BUILD = [
  "cherrylane_liverpool",
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

// ---------------------------------------------------------------------------
// CONDITIONS — clinical copy written once. `ready:true` generates a live
// condition page and links the overview tile to it. `ready:false` still lists
// the condition on the overview (as plain text) but does not build a page yet.
// ageNote text is the NHS Pharmacy First clinical pathway age range.
//
// Clinical wording is NHS Pharmacy First standard (age ranges verified against
// NHS England / NHSBSA clinical pathways). The superintendent pharmacist signs
// off final wording before any page is published.
// ---------------------------------------------------------------------------

// The process is the same for every condition, so steps/core FAQs are shared.
const STD_STEPS = [
  ["Book or call in", "Book a Pharmacy First appointment online, or call us. You can often be seen the same day."],
  ["Speak to the pharmacist", "You are seen in private. The pharmacist asks about your symptoms and checks whether this service is right for you."],
  ["Get the right outcome", "If treatment is appropriate, the pharmacist supplies it. If not, they advise the best next step. This is an NHS assessment, so treatment is only given when clinically appropriate."]
];

function stdFaq(condLower) {
  return [
    ["Do I need to see my GP first?", "No. You can come straight to the pharmacy. For " + condLower + ", a pharmacist can assess you and, where appropriate, supply treatment without a GP appointment."],
    ["Is it free?", "The Pharmacy First consultation is a free NHS service. If you are supplied a medicine, the usual NHS prescription charge applies unless you are exempt."],
    ["Will I definitely be given medicine?", "Not necessarily. The pharmacist assesses your symptoms and only supplies treatment if it is clinically appropriate. If it is not, they will explain the best next step."],
    ["Do I need an appointment?", "You can book online for a set time, or call in. Booking ahead means you are seen quickly and in private."]
  ];
}

const CONDITIONS = {
  uti: {
    name: "UTI", longName: "Urinary tract infection (UTI)", slug: "uti",
    ready: true,
    ageNote: "Women aged 16 to 64",
    blurb: "Burning when you wee, needing to go more often, or lower tummy pain.",
    metaCondition: "UTI treatment",
    h1: function (town) { return "UTI treatment in " + town; },
    heroProof: "Be seen by a pharmacist, with no GP appointment needed.",
    heroSub: function (brand, town) {
      return brand + " offers the NHS Pharmacy First service for uncomplicated urinary tract infections in " + town +
        ". A pharmacist can assess your symptoms and, if it is right for you, supply treatment, all without a GP appointment.";
    },
    symptoms: [
      "Pain or a burning feeling when you wee",
      "Needing to wee more often or more urgently than usual",
      "Cloudy wee, or blood in your wee",
      "Pain low down in your tummy",
      "Feeling generally unwell"
    ],
    eligibleYes: {
      title: "Who this NHS service is for",
      points: [
        "Women aged 16 to 64",
        "Symptoms of an uncomplicated lower urinary tract infection",
        "No GP appointment or referral needed, just book or call in"
      ]
    },
    eligibleNo: {
      title: "When to get different help",
      points: [
        "If you are pregnant, under 16 or over 64, the pharmacist will guide you to the right care",
        "Men with UTI symptoms should speak to a GP",
        "A high temperature, pain in your back or side, or feeling very unwell can mean a kidney infection, contact your GP or call NHS 111"
      ]
    },
    steps: [
      ["Book or call in", "Book a Pharmacy First appointment online, or call us. You can often be seen the same day."],
      ["Speak to the pharmacist", "The pharmacist asks about your symptoms in private and checks whether this service is right for you."],
      ["Get the right outcome", "If treatment is appropriate, the pharmacist supplies it. If not, they advise the best next step. This is an NHS assessment, so treatment is only given when clinically appropriate."]
    ],
    faq: [
      ["Do I need to see my GP first?", "No. You can come straight to the pharmacy. The pharmacist can assess your symptoms and supply treatment if it is appropriate, without a GP appointment."],
      ["Is it free?", "The Pharmacy First consultation is a free NHS service. If you are supplied a medicine, the usual NHS prescription charge applies unless you are exempt."],
      ["Will I definitely be given antibiotics?", "Not necessarily. The pharmacist assesses your symptoms and only supplies antibiotics if they are clinically appropriate. If they are not, the pharmacist will explain the best next step."],
      ["Do I need an appointment?", "You can book online for a set time, or call in. Booking ahead means you are seen quickly and in private."]
    ]
  },

  "sore-throat": {
    name: "Sore throat", longName: "Sore throat (acute pharyngitis)", slug: "sore-throat",
    ready: true, ageNote: "Age 5 and over",
    blurb: "A painful throat that is not getting better on its own.",
    metaCondition: "Sore throat treatment",
    h1: function (town) { return "Sore throat treatment in " + town; },
    heroProof: "Be assessed by a pharmacist, with no GP appointment needed.",
    heroSub: function (brand, town) {
      return brand + " offers the NHS Pharmacy First service for acute sore throat in " + town +
        ". A pharmacist can assess your symptoms using a recognised scoring system and, where treatment is right for you, supply it without a GP appointment.";
    },
    symptoms: [
      "A painful or scratchy throat",
      "Pain when swallowing",
      "Swollen tonsils or glands in your neck",
      "A high temperature",
      "Bad breath or a hoarse voice"
    ],
    eligibleYes: { title: "Who this NHS service is for", points: [
      "Anyone aged 5 and over",
      "Symptoms of an acute sore throat",
      "No GP appointment or referral needed, just book or call in"
    ] },
    eligibleNo: { title: "When to get different help", points: [
      "Children under 5 should see a GP",
      "If you have a weakened immune system, the pharmacist will guide you to the right care",
      "Difficulty breathing, drooling or a muffled voice need urgent help, call 999 or go to A&E"
    ] },
    steps: STD_STEPS, faq: stdFaq("a sore throat")
  },

  sinusitis: {
    name: "Sinusitis", longName: "Acute sinusitis", slug: "sinusitis",
    ready: true, ageNote: "Age 12 and over",
    blurb: "Blocked or painful sinuses, facial pressure or congestion.",
    metaCondition: "Sinusitis treatment",
    h1: function (town) { return "Sinusitis treatment in " + town; },
    heroProof: "Be assessed by a pharmacist, with no GP appointment needed.",
    heroSub: function (brand, town) {
      return brand + " offers the NHS Pharmacy First service for acute sinusitis in " + town +
        ". A pharmacist can assess your symptoms and, where treatment is right for you, supply it without a GP appointment.";
    },
    symptoms: [
      "Pain, swelling or tenderness around your cheeks, eyes or forehead",
      "A blocked or runny nose",
      "A reduced sense of smell",
      "Green or yellow mucus from your nose",
      "A high temperature or feeling generally unwell"
    ],
    eligibleYes: { title: "Who this NHS service is for", points: [
      "Anyone aged 12 and over",
      "Symptoms of acute sinusitis",
      "No GP appointment or referral needed, just book or call in"
    ] },
    eligibleNo: { title: "When to get different help", points: [
      "Children under 12 should see a GP",
      "Symptoms lasting more than a few weeks may need a GP review",
      "A severe headache, swelling around the eyes or confusion need urgent help, call 999 or NHS 111"
    ] },
    steps: STD_STEPS, faq: stdFaq("sinusitis")
  },

  earache: {
    name: "Earache", longName: "Acute otitis media (earache)", slug: "earache",
    ready: true, ageNote: "Age 1 to 17",
    blurb: "Ear pain in children, often alongside a cold or temperature.",
    metaCondition: "Earache treatment",
    h1: function (town) { return "Earache treatment for children in " + town; },
    heroProof: "Be assessed by a pharmacist, with no GP appointment needed.",
    heroSub: function (brand, town) {
      return brand + " offers the NHS Pharmacy First service for acute ear infections (otitis media) in children and young people in " + town +
        ". A pharmacist can assess your child and, where treatment is right, supply it without a GP appointment.";
    },
    symptoms: [
      "Ear pain",
      "Tugging or rubbing at the ear in younger children",
      "A high temperature",
      "Irritability, restlessness or trouble sleeping",
      "Reduced hearing or fluid coming from the ear"
    ],
    eligibleYes: { title: "Who this NHS service is for", points: [
      "Children and young people aged 1 to 17",
      "Symptoms of an acute ear infection",
      "A parent or carer can attend with the child"
    ] },
    eligibleNo: { title: "When to get different help", points: [
      "Babies under 1 should see a GP",
      "Adults aged 18 and over are not covered by this pathway",
      "A very unwell child, a stiff neck or a rash that does not fade need urgent help, call 999 or NHS 111"
    ] },
    steps: STD_STEPS, faq: stdFaq("an ear infection")
  },

  impetigo: {
    name: "Impetigo", longName: "Impetigo", slug: "impetigo",
    ready: true, ageNote: "Age 1 and over",
    blurb: "Red sores or blisters that crust over, often around the nose and mouth.",
    metaCondition: "Impetigo treatment",
    h1: function (town) { return "Impetigo treatment in " + town; },
    heroProof: "Be assessed by a pharmacist, with no GP appointment needed.",
    heroSub: function (brand, town) {
      return brand + " offers the NHS Pharmacy First service for impetigo in " + town +
        ". A pharmacist can assess your skin and, where treatment is right for you, supply it without a GP appointment.";
    },
    symptoms: [
      "Red sores or blisters, often around the nose and mouth",
      "Sores that burst and leave golden-brown crusts",
      "Itchy skin around the sores",
      "Sores that spread to other areas of the body"
    ],
    eligibleYes: { title: "Who this NHS service is for", points: [
      "Anyone aged 1 and over",
      "Localised, non-bullous impetigo",
      "No GP appointment or referral needed, just book or call in"
    ] },
    eligibleNo: { title: "When to get different help", points: [
      "Babies under 1 should see a GP",
      "Widespread, bullous or recurrent impetigo may need a GP",
      "If you have a weakened immune system, the pharmacist will guide you to the right care"
    ] },
    steps: STD_STEPS, faq: stdFaq("impetigo")
  },

  shingles: {
    name: "Shingles", longName: "Shingles", slug: "shingles",
    ready: true, ageNote: "Age 18 and over",
    blurb: "A painful rash, usually on one side of the body. Best seen early.",
    metaCondition: "Shingles treatment",
    h1: function (town) { return "Shingles treatment in " + town; },
    heroProof: "Be seen quickly by a pharmacist, with no GP appointment needed.",
    heroSub: function (brand, town) {
      return brand + " offers the NHS Pharmacy First service for shingles in " + town +
        ". Shingles is best treated early, so see a pharmacist as soon as the rash appears. Where treatment is right for you, they can supply it without a GP appointment.";
    },
    symptoms: [
      "A painful, tingling or burning feeling in one area of skin",
      "A rash, usually on one side of the body",
      "Fluid-filled blisters that scab over",
      "Feeling generally unwell"
    ],
    eligibleYes: { title: "Who this NHS service is for", points: [
      "Adults aged 18 and over",
      "A new shingles rash",
      "Seen as soon as possible, ideally within 3 days of the rash starting"
    ] },
    eligibleNo: { title: "When to get different help", points: [
      "A rash near or affecting the eye needs urgent help, contact your GP or NHS 111 the same day",
      "If you are pregnant or have a weakened immune system, the pharmacist will guide you to the right care",
      "Children and young people under 18 should see a GP"
    ] },
    steps: STD_STEPS, faq: stdFaq("shingles")
  },

  "insect-bite": {
    name: "Infected insect bite", longName: "Infected insect bite", slug: "insect-bite",
    ready: true, ageNote: "Age 1 and over",
    blurb: "A bite or sting that has become red, swollen, hot or painful.",
    metaCondition: "Infected insect bite treatment",
    h1: function (town) { return "Infected insect bite treatment in " + town; },
    heroProof: "Be assessed by a pharmacist, with no GP appointment needed.",
    heroSub: function (brand, town) {
      return brand + " offers the NHS Pharmacy First service for infected insect bites and stings in " + town +
        ". A pharmacist can assess the bite and, where treatment is right for you, supply it without a GP appointment.";
    },
    symptoms: [
      "Redness or swelling that is spreading or getting worse",
      "The area feels hot or painful",
      "Pus or fluid coming from the bite",
      "Feeling generally unwell"
    ],
    eligibleYes: { title: "Who this NHS service is for", points: [
      "Anyone aged 1 and over",
      "A bite or sting that looks infected",
      "No GP appointment or referral needed, just book or call in"
    ] },
    eligibleNo: { title: "When to get different help", points: [
      "Babies under 1 should see a GP",
      "Swelling of the face, lips or throat, or difficulty breathing, is a serious allergic reaction, call 999 now",
      "Spreading redness with a high temperature or feeling very unwell needs urgent help, call NHS 111"
    ] },
    steps: STD_STEPS, faq: stdFaq("an infected insect bite")
  }
};

// Order conditions appear on the overview.
const CONDITION_ORDER = ["uti", "sore-throat", "sinusitis", "earache", "impetigo", "shingles", "insect-bite"];

// FULL SCOPE: all 7 conditions live on every store (8 pages/store).

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "branches.json"), "utf8"));
const byId = {};
data.branches.forEach(function (b) { byId[b.id] = b; });

function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function tel(b) { return (b.phone || "").replace(/\s+/g, ""); }
function fullAddr(b) { return [b.streetAddress, b.addressLocality, b.postalCode].filter(Boolean).join(", "); }

// --- shared building blocks -------------------------------------------------

function headComment(store, title, meta, slug) {
  return "<!--\n" +
    "  " + store.brand.toUpperCase() + " — " + title + " (SEO-first, NHS Pharmacy First).\n" +
    "  Paste this whole block into the Weebly \"Embed Code\" element on " + slug + "\n" +
    "  Weebly page SEO title:       " + title + "\n" +
    "  Weebly page SEO description:  " + meta + "\n" +
    "  NOTE: clinical wording is NHS Pharmacy First standard. Superintendent pharmacist\n" +
    "  signs off before publish. Add the store's Appointedd \"Pharmacy 1st\" embed where marked.\n" +
    "-->";
}

function headLinks() {
  return '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="' + CDN + '/service.css">\n' +
    '<script src="' + CDN + '/service.js" defer></script>';
}

function bookingCard(store, b, serviceLabel) {
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
      '            <!-- APPOINTEDD: add the ' + esc(store.brand) + ' "Pharmacy 1st" widget ID to STORES[...].widgets, then re-run the generator. -->\n' +
      '            <strong>Book your free NHS appointment</strong>\n' +
      '            <p>Call <a href="tel:' + tel(b) + '">' + esc(b.phone) + '</a> to book, or request a callback below and we will arrange a time.</p>\n' +
      '          </div>';
  return '' +
    '<div class="booking-card pad" id="book">\n' +
    '          <h2 class="booking-head">Book your ' + esc(serviceLabel) + ' appointment</h2>\n' +
    '          <p class="booking-sub">Free NHS Pharmacy First service at ' + esc(store.brand) + '. Choose a time that suits you.</p>\n' +
    '          ' + inner + '\n' +
    '        </div>';
}

function enquiryForm(store) {
  return '' +
    '<div class="form-card hero-form pad" id="svc-enquiry">\n' +
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
    '          </div>\n' +
    '        </div>';
}

function trustBar(store) {
  return '' +
    '<div class="trust-bar">\n' +
    '      <div class="trust-item"><strong>Free NHS service</strong><span>Pharmacy First, no charge to be seen</span></div>\n' +
    '      <div class="trust-item"><strong>No GP appointment</strong><span>Be assessed by a pharmacist directly</span></div>\n' +
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

// --- overview page ----------------------------------------------------------

function overviewPage(storeId) {
  var store = storeOf(storeId);
  var b = byId[storeId];
  var slug = "pharmacy-first-" + store.brandSlug + "-" + store.townSlug + ".html";
  var url = store.site + "/" + slug;
  var title = "Pharmacy First at " + store.brand + ", " + store.town;
  var meta = "Pharmacy First at " + store.brand + " in " + store.town + ". Free NHS treatment for common conditions like UTIs, sore throat and more, no GP appointment needed.";

  var tiles = CONDITION_ORDER.map(function (key) {
    var c = CONDITIONS[key];
    var href = c.ready ? (c.slug + "-treatment-" + store.brandSlug + "-" + store.townSlug + ".html") : null;
    var body =
      '<strong>' + esc(c.name) + '</strong>\n' +
      '          <span>' + esc(c.blurb) + '</span>\n' +
      '          <span style="color:#6b7280;font-size:13px;">' + esc(c.ageNote) + '</span>';
    return href
      ? '<a class="condition-card" href="' + href + '">\n          ' + body + '\n          <em>Learn more</em>\n        </a>'
      : '<div class="condition-card">\n          ' + body + '\n          <em style="color:#9ca3af;text-decoration:none;">Page coming soon</em>\n        </div>';
  }).join("\n        ");

  return headComment(store, title, meta, slug) + "\n" +
    headLinks() + "\n\n" +
    '<div id="rbhsv-root" data-branch="' + esc(store.brand) + '" data-service="Pharmacy First" data-wa="' + WHATSAPP + '">\n' +
    '  <div class="wrap">\n\n' +
    '    <section class="hero">\n' +
    '      <div class="hero-grid">\n' +
    '        <div>\n' +
    '          <div class="hero-help-row">NHS Pharmacy First</div>\n' +
    '          <span class="pill">Free NHS service at your local ' + esc(store.town) + ' pharmacy</span>\n' +
    '          <h1>Pharmacy First at ' + esc(store.brand) + ' in ' + esc(store.town) + '</h1>\n' +
    '          <p class="hero-proof">Get treated for common conditions without a GP appointment.</p>\n' +
    '          <p class="hero-sub">Pharmacy First is a free NHS service. A pharmacist at ' + esc(store.brand) + ' can assess and, where appropriate, treat seven common conditions, so you can be seen quickly without waiting for a GP.</p>\n' +
    '          <ul class="hero-points">\n' +
    '            <li>Free NHS consultation with a pharmacist</li>\n' +
    '            <li>No GP appointment or referral needed</li>\n' +
    '            <li>Treatment supplied where it is clinically appropriate</li>\n' +
    '            <li>Seen privately by your local ' + esc(store.town) + ' team</li>\n' +
    '          </ul>\n' +
    '          <div class="hero-actions-stack">\n' +
    '            <a href="#book" class="btn-pill btn-primary"><span>Book an appointment</span></a>\n' +
    '            <a href="tel:' + tel(b) + '" class="btn-pill btn-white"><span>Call ' + esc(b.phone) + '</span></a>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div>\n          ' + bookingCard(store, b, "Pharmacy First") + '\n        </div>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    '    ' + trustBar(store) + '\n\n' +
    '    <section class="section">\n' +
    '      <h2 class="h2">Conditions we can treat under Pharmacy First</h2>\n' +
    '      <p class="lead">Pharmacy First covers these seven common conditions. Each has its own age range set by the NHS. Tap a condition to learn more, or book an appointment and the pharmacist will assess you.</p>\n' +
    '      <div class="condition-grid">\n        ' + tiles + '\n      </div>\n' +
    '    </section>\n\n' +
    '    <section class="section">\n' +
    '      <h2 class="h2">How Pharmacy First works</h2>\n' +
    '      <div class="steps">\n' +
    '        <div class="step"><div class="step-no">1</div><h3>Book or call in</h3><p>Book an appointment online or call us. You can often be seen the same day.</p></div>\n' +
    '        <div class="step"><div class="step-no">2</div><h3>Speak to the pharmacist</h3><p>You are seen privately. The pharmacist asks about your symptoms and checks the service is right for you.</p></div>\n' +
    '        <div class="step"><div class="step-no">3</div><h3>Get the right outcome</h3><p>If treatment is appropriate, the pharmacist supplies it. If not, they advise the best next step.</p></div>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    '    <section class="section">\n' +
    '      <div class="main-grid">\n' +
    '        <div>\n' +
    '          <div class="faq-card pad">\n' +
    '            <h2 class="h2">Questions people usually ask</h2>\n' +
    '            <details><summary>Is Pharmacy First really free?</summary><div class="answer">Yes. The Pharmacy First consultation is a free NHS service. If you are supplied a medicine, the usual NHS prescription charge applies unless you are exempt.</div></details>\n' +
    '            <details><summary>Do I need to see my GP first?</summary><div class="answer">No. You can come straight to ' + esc(store.brand) + '. For the conditions covered, a pharmacist can assess you and supply treatment if it is appropriate.</div></details>\n' +
    '            <details><summary>Will I definitely get medicine?</summary><div class="answer">Not always. This is an NHS assessment, so the pharmacist only supplies treatment when it is clinically appropriate. If it is not, they will explain the best next step.</div></details>\n' +
    '            <details><summary>Do I need an appointment?</summary><div class="answer">You can book online for a set time, or call in. Booking ahead means you are seen quickly and in private.</div></details>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div>\n          ' + contactCard(store, b) + '\n        </div>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    '  </div>\n' +
    '</div>\n\n' +
    pharmacySchema(store, b, url) + "\n";
}

// --- condition page ---------------------------------------------------------

function conditionPage(storeId, key) {
  var store = storeOf(storeId);
  var b = byId[storeId];
  var c = CONDITIONS[key];
  var slug = c.slug + "-treatment-" + store.brandSlug + "-" + store.townSlug + ".html";
  var url = store.site + "/" + slug;
  var overviewSlug = "pharmacy-first-" + store.brandSlug + "-" + store.townSlug + ".html";
  var title = c.metaCondition + " in " + store.town + " - " + store.brand;
  var meta = c.name + " treatment at " + store.brand + " in " + store.town +
    ". Free NHS Pharmacy First service, be assessed by a pharmacist with no GP appointment needed.";

  var symptoms = c.symptoms.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("\n            ");
  var yesPoints = c.eligibleYes.points.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("\n              ");
  var noPoints = c.eligibleNo.points.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("\n              ");
  var steps = c.steps.map(function (s, i) {
    return '<div class="step"><div class="step-no">' + (i + 1) + '</div><h3>' + esc(s[0]) + '</h3><p>' + esc(s[1]) + '</p></div>';
  }).join("\n        ");
  var faqs = c.faq.map(function (f) {
    return '<details><summary>' + esc(f[0]) + '</summary><div class="answer">' + esc(f[1]) + '</div></details>';
  }).join("\n            ");

  return headComment(store, title, meta, slug) + "\n" +
    headLinks() + "\n\n" +
    '<div id="rbhsv-root" data-branch="' + esc(store.brand) + '" data-service="' + esc(c.metaCondition) + '" data-wa="' + WHATSAPP + '">\n' +
    '  <div class="wrap">\n\n' +
    '    <section class="hero">\n' +
    '      <div class="hero-grid">\n' +
    '        <div>\n' +
    '          <div class="hero-help-row">NHS Pharmacy First</div>\n' +
    '          <span class="pill">' + esc(c.ageNote) + ' &middot; Free NHS service in ' + esc(store.town) + '</span>\n' +
    '          <h1>' + esc(c.h1(store.town)) + '</h1>\n' +
    '          <p class="hero-proof">' + esc(c.heroProof) + '</p>\n' +
    '          <p class="hero-sub">' + esc(c.heroSub(store.brand, store.town)) + '</p>\n' +
    '          <div class="hero-actions-stack">\n' +
    '            <a href="#book" class="btn-pill btn-primary"><span>Book an appointment</span></a>\n' +
    '            <a href="tel:' + tel(b) + '" class="btn-pill btn-white"><span>Call ' + esc(b.phone) + '</span></a>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div>\n          ' + bookingCard(store, b, c.name) + '\n        </div>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    '    ' + trustBar(store) + '\n\n' +
    '    <section class="section">\n' +
    '      <h2 class="h2">' + esc(c.longName) + ' symptoms</h2>\n' +
    '      <p class="lead">Common signs include:</p>\n' +
    '      <div class="faq-card pad">\n' +
    '        <ul class="hero-points" style="margin-left:20px;color:#374151;max-width:none;">\n            ' + symptoms + '\n        </ul>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    '    <section class="section">\n' +
    '      <h2 class="h2">Is this service right for you?</h2>\n' +
    '      <div class="eligibility">\n' +
    '        <div class="elig-box elig-yes">\n' +
    '          <h3>' + esc(c.eligibleYes.title) + '</h3>\n' +
    '          <ul>\n              ' + yesPoints + '\n          </ul>\n' +
    '        </div>\n' +
    '        <div class="elig-box elig-no">\n' +
    '          <h3>' + esc(c.eligibleNo.title) + '</h3>\n' +
    '          <ul>\n              ' + noPoints + '\n          </ul>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    '    <section class="section">\n' +
    '      <h2 class="h2">How it works at ' + esc(store.brand) + '</h2>\n' +
    '      <div class="steps">\n        ' + steps + '\n      </div>\n' +
    '    </section>\n\n' +
    '    <section class="section">\n' +
    '      <div class="main-grid">\n' +
    '        <div>\n' +
    '          <div class="faq-card pad">\n' +
    '            <h2 class="h2">Questions people usually ask</h2>\n            ' + faqs + '\n' +
    '          </div>\n' +
    '          <p class="lead" style="margin-top:18px;font-size:16px;"><a href="' + overviewSlug + '">See all conditions covered by Pharmacy First at ' + esc(store.brand) + '</a></p>\n' +
    '        </div>\n' +
    '        <div>\n          ' + enquiryForm(store) + '\n          <div style="margin-top:18px;"></div>\n          ' + contactCard(store, b) + '\n        </div>\n' +
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

  // Overview
  var ovSlug = "pharmacy-first-" + store.brandSlug + "-" + store.townSlug + ".html";
  fs.writeFileSync(path.join(outDir, ovSlug), overviewPage(storeId));
  manifest.push({
    store: store.brand + " — " + store.town,
    type: "Overview",
    file: ovSlug,
    permalink: ovSlug.replace(/\.html$/, ""),
    liveUrl: store.site + "/" + ovSlug,
    seoTitle: "Pharmacy First at " + store.brand + ", " + store.town,
    seoDesc: "Pharmacy First at " + store.brand + " in " + store.town + ". Free NHS treatment for common conditions like UTIs, sore throat and more, no GP appointment needed.",
    keywords: ["Pharmacy First " + store.town, "NHS Pharmacy First", store.brand, "pharmacy " + store.town, (b_outward(storeId))].filter(Boolean).join(", ")
  });

  // Condition pages (ready only)
  CONDITION_ORDER.forEach(function (key) {
    var c = CONDITIONS[key];
    if (!c.ready) return;
    var slug = c.slug + "-treatment-" + store.brandSlug + "-" + store.townSlug + ".html";
    fs.writeFileSync(path.join(outDir, slug), conditionPage(storeId, key));
    manifest.push({
      store: store.brand + " — " + store.town,
      type: c.name,
      file: slug,
      permalink: slug.replace(/\.html$/, ""),
      liveUrl: store.site + "/" + slug,
      seoTitle: c.metaCondition + " in " + store.town + " - " + store.brand,
      seoDesc: c.name + " treatment at " + store.brand + " in " + store.town + ". Free NHS Pharmacy First service, be assessed by a pharmacist with no GP appointment needed.",
      keywords: [c.name + " " + store.town, c.name + " treatment " + store.town, "Pharmacy First " + store.town, "pharmacy " + store.town, b_outward(storeId)].filter(Boolean).join(", ")
    });
  });
});

function b_outward(storeId) { return ((byId[storeId] || {}).postalCode || "").split(" ")[0]; }

// INDEX.md
var md = "# Service (Pharmacy First) pages — paste manifest\n\n" +
  "Each page below is in this folder. Paste the file's contents into a Weebly Embed Code element on the matching URL, and set the Weebly page SEO title + description.\n\n" +
  "Before publishing each page: drop the store's Appointedd \"Pharmacy 1st\" widget into the booking card (replace the call/callback fallback), and have the superintendent pharmacist sign off the clinical wording.\n\n";
manifest.forEach(function (m) {
  md += "## " + m.store + " — " + m.type + "\n";
  md += "- **Page slug / URL:** `" + m.file + "` -> " + m.liveUrl + "\n";
  md += "- **SEO title:** " + m.seoTitle + "\n";
  md += "- **SEO description:** " + m.seoDesc + "\n\n";
});
fs.writeFileSync(path.join(outDir, "INDEX.md"), md);

// SEO.md
var seo = "# Weebly SEO Settings — Pharmacy First pages\n\nFor each page, paste these into Weebly > Pages > (page) > SEO Settings.\nMeta keywords are ignored by Google/Bing (kept for completeness only).\n\n";
manifest.forEach(function (m) {
  seo += "## " + m.store + " — " + m.type + "\n";
  seo += "- **Page Title:** " + m.seoTitle + "\n";
  seo += "- **Page Permalink:** " + m.permalink + "\n";
  seo += "- **Page Description:** " + m.seoDesc + "\n";
  seo += "- **Meta Keywords:** " + m.keywords + "\n\n";
});
fs.writeFileSync(path.join(outDir, "SEO.md"), seo);

console.log("Generated " + manifest.length + " service pages into modules/service/pages/");
manifest.forEach(function (m) { console.log("  " + m.file); });
