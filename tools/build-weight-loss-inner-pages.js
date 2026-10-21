/*
  Generates the NAMED weight loss inner page (Regime 2) for a branch, to be
  pasted over that branch's existing legacy weight loss URL so the URL keeps
  the search rank it already holds.

  Run:  node tools/build-weight-loss-inner-pages.js
  Out:  modules/service/inner/<legacy-url>.html and modules/service/inner/INDEX.md

  Why this page exists (Rishi, Q60 answer 2026-09-29, confirmed 2026-10-21):
  every branch site has TWO weight loss pages.
    - The generic landing page, weight-loss-clinic-<brand>-<town>.html, built by
      build-weight-loss-pages.js. Names no medicine. In the menu, and the only
      page ads, Google posts and social link to. Regime 1.
    - This page. A page about the condition the visitor chooses to open, so it
      may name medicines in a fair overview of the options, with a clear offer
      of a consultation that may or may not lead to a prescription. Regime 2.
      Never linked from an ad, a Google post, social media or an email.

  Rule source: AI\RBH_WeightLoss_Advertising_Standards.md v2 (21 Oct 2026),
  section 3, citing MHRA Blue Guide Appendix 6 and the CAP weight control
  advice of 29 May 2026. tools/check-weight-loss-copy.js RULE 13 holds it.

  What this page must never carry (each was on the legacy template):
    a superlative ("one of the most effective"), a results heading, a weight
    loss slider or calculator, a treatment picker or a "choose a treatment"
    step, "No GP visit needed", "Buy" or basket wording, a highlighted offer.

  CLINICAL WORDING: the medicine descriptions below follow the UK licensed
  indications as at October 2026 and must be checked against the current
  SPC and signed off by the superintendent pharmacist before publishing.

  Booking: the page keeps a legacy URL, so service.js cannot resolve the
  branch from the URL. Each mount states it instead with data-branch-id and
  data-widget-key, and service.js reads the diary ids from branches.json.
*/
const fs = require("fs");
const path = require("path");

const PIN = "service-module-phase1";
const CDN = "https://cdn.jsdelivr.net/gh/rishi235/rbh-site-data@" + PIN + "/modules/service";
const APPOINTEDD_SDK = "https://booking-tools-sdk.appointedd.com/appointedd-booking-tools-sdk-v1.js";
const CONSULT_FEE = "from £39.99";

// Branch id -> the legacy URL this page replaces. Only branches whose legacy
// page has been read live and confirmed are listed. Smartts first, as the
// template (Rishi, 2026-10-21).
const BUILD = {
  smartts_bootle: "weight-loss-clinic-bootle.html"
};

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "branches.json"), "utf8"));
const byId = {};
data.branches.forEach(function (b) { byId[b.id] = b; });

function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function tel(b) { return (b.phone || "").replace(/\s+/g, ""); }
function fullAddr(b) { return [b.streetAddress, b.addressLocality, b.postalCode].filter(Boolean).join(", "); }

function seoStrings(b) {
  return {
    title: "Weight Loss Treatment Options | " + b.branchName + ", " + b.seoTown,
    meta: "Private weight loss consultations at " + b.branchName + ", " + b.seoTown +
      ", in store or online. An overview of the treatment options a prescriber may discuss with you."
  };
}

function bookingCard(b) {
  const w = b.widgets || {};
  return '' +
    '<div class="booking-card pad" id="book">\n' +
    '          <h2 class="booking-head">Book your weight loss consultation</h2>\n' +
    '          <p class="booking-sub">Private consultation at ' + esc(b.branchName) + ', ' + CONSULT_FEE + ', subject to a clinical assessment. Choose a time that suits you.</p>\n' +
    '          <div class="booking-widget">\n' +
    '            <script src="' + APPOINTEDD_SDK + '"></script>\n' +
    '            <div id="rbhsv-booking" data-branch-id="' + b.id + '" data-widget-key="weightLoss" style="background-color:#ffffff;"></div>\n' +
    '            <!-- in-store widget rendered by service.js from branches.json - do not hard-code a widgetId -->\n' +
    '          </div>\n' +
    (w.weightLossOnline
      ? '          <div class="booking-online" id="book-online" style="margin-top:18px;">\n' +
        '            <h3 class="booking-head" style="font-size:18px;">Prefer an online consultation?</h3>\n' +
        '            <p class="booking-sub">Speak to one of our prescribers from home. If treatment is prescribed, collect it from ' + esc(b.branchName) + ' or have it posted to you.</p>\n' +
        '            <div class="booking-widget">\n' +
        '              <div id="rbhsv-booking-online" style="background-color:#ffffff;"></div>\n' +
        '              <!-- online widget rendered by service.js from branches.json widgets.weightLossOnline -->\n' +
        '            </div>\n' +
        '          </div>\n'
      : '') +
    '        </div>';
}

function option(title, form, body) {
  return '' +
    '        <div class="condition-card pad">\n' +
    '          <h3>' + title + '</h3>\n' +
    '          <p><strong>' + form + '</strong></p>\n' +
    body.map(function (p) { return '          <p>' + p + '</p>\n'; }).join("") +
    '        </div>\n';
}

function treatmentOptions() {
  return '' +
    '    <section class="section" id="options">\n' +
    '      <h2 class="h2">Treatment options your prescriber may discuss</h2>\n' +
    '      <p class="lead">This is an overview, not a recommendation. You cannot choose a medicine in advance. At your consultation the prescriber decides with you whether any treatment is suitable, and a medicine that is not suitable for you will not be prescribed. Every option sits alongside diet and activity changes.</p>\n' +
    '      <div class="condition-grid">\n' +
    option("Diet, activity and support", "Every plan",
      ["Advice on eating, activity and habits, with follow-up reviews. For some people this is the right place to start without any medicine.",
       "Your GP can also tell you about NHS weight management services."]) +
    option("Orlistat", "Capsules, taken with meals",
      ["Orlistat is used alongside a reduced-calorie diet in adults with a BMI of 30 or more, or 28 or more with weight-related health risks. It works in the gut, reducing how much of the fat in food is absorbed.",
       "Common side effects include oily or loose stools and wind, particularly after fatty meals. A lower-strength version is available from the pharmacist without a prescription."]) +
    option("Mounjaro (tirzepatide)", "Weekly injection",
      ["Mounjaro is used for weight management alongside a reduced-calorie diet and more physical activity in adults with a BMI of 30 or more, or 27 to under 30 with at least one weight-related health condition. It acts on two hormone receptors (GIP and GLP-1) involved in appetite.",
       "The dose starts low and is increased over several weeks. Common side effects include nausea, diarrhoea, vomiting, constipation and indigestion. It can make the contraceptive pill less effective, and your prescriber will advise you on this."]) +
    option("Wegovy (semaglutide)", "Weekly injection",
      ["Wegovy is used for weight management alongside a reduced-calorie diet and more physical activity in adults with a BMI of 30 or more, or 27 to under 30 with at least one weight-related health condition. It acts like a natural hormone (GLP-1) involved in appetite.",
       "The dose starts low and is increased over several weeks. Common side effects include nausea, diarrhoea, vomiting, constipation and stomach pain."]) +
    '      </div>\n' +
    '      <p class="lead" style="margin-top:14px;">Side effects listed here are not a full list. Your prescriber will go through the patient information leaflet with you before you start any medicine.</p>\n' +
    '    </section>';
}

function eligibility() {
  return '' +
    '    <section class="section">\n' +
    '      <h2 class="h2">Is this service right for you?</h2>\n' +
    '      <p class="lead">A prescriber will assess your suitability at consultation. Nothing on this page is a guarantee of treatment, a specific medicine, or a specific outcome. Individual results vary.</p>\n' +
    '      <div class="eligibility">\n' +
    '        <div class="elig-box elig-yes">\n' +
    '          <h3>Who this service may suit</h3>\n' +
    '          <ul>\n' +
    '            <li>Adults aged 18 and over</li>\n' +
    '            <li>Typically a BMI in the overweight or obese range for your height (your prescriber will confirm this at assessment, and may also consider your ethnicity and weight-related health conditions)</li>\n' +
    '            <li>Ready to combine any treatment with diet and lifestyle changes, not use it as a stand-alone fix</li>\n' +
    '          </ul>\n' +
    '        </div>\n' +
    '        <div class="elig-box elig-no">\n' +
    '          <h3>When this service is not right for you</h3>\n' +
    '          <ul>\n' +
    '            <li>If you are pregnant, breastfeeding, or trying to become pregnant, this service is not suitable, please speak to your GP or midwife</li>\n' +
    '            <li>Under 18s are not seen under this service</li>\n' +
    '            <li>Certain conditions (including a personal or family history of specific thyroid cancers, pancreatitis, severe gastrointestinal disease, or an active eating disorder) may mean treatment is not appropriate, the prescriber will screen for these and advise accordingly</li>\n' +
    '            <li>If you are already taking other weight-loss or diabetes medication, tell the prescriber so they can check it is safe to proceed</li>\n' +
    '            <li>If you feel unwell, have symptoms that concern you, or need urgent help, contact your GP or NHS 111, or call 999 in an emergency</li>\n' +
    '          </ul>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </section>';
}

function inStoreOrOnline(b) {
  return '' +
    '    <section class="section">\n' +
    '      <h2 class="h2">In store or online</h2>\n' +
    '      <div class="eligibility">\n' +
    '        <div class="elig-box">\n' +
    '          <h3>In store at ' + esc(b.branchName) + '</h3>\n' +
    '          <ul>\n' +
    '            <li>Face to face with a pharmacist</li>\n' +
    '            <li>Help with injection technique if an injection is prescribed</li>\n' +
    '            <li>Weight and health checks at your reviews</li>\n' +
    '            <li>If prescribed, usually ready to collect the same day once approved</li>\n' +
    '          </ul>\n' +
    '        </div>\n' +
    '        <div class="elig-box">\n' +
    '          <h3>Online</h3>\n' +
    '          <ul>\n' +
    '            <li>A consultation from home with one of our prescribers</li>\n' +
    '            <li>If prescribed, collect from ' + esc(b.branchName) + ' or have it posted to you, usually dispatched within one working day</li>\n' +
    '            <li>Messaging support from our team</li>\n' +
    '          </ul>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '      <p class="lead" style="margin-top:14px;">Both include an eligibility assessment, follow-up and safety monitoring, and you can move between in store and online.</p>\n' +
    '    </section>';
}

function howItWorks() {
  return '' +
    '    <section class="section">\n' +
    '      <h2 class="h2">How it works</h2>\n' +
    '      <div class="steps">\n' +
    '        <div class="step"><div class="step-no">1</div><h3>Book a consultation</h3><p>Book in store or online, or call us. Your first appointment is a private, paid consultation, ' + CONSULT_FEE + '.</p></div>\n' +
    '        <div class="step"><div class="step-no">2</div><h3>Clinical assessment</h3><p>The prescriber reviews your health history, weight and current medicines, then decides with you whether any treatment is suitable. This is a professional judgement, not a guarantee.</p></div>\n' +
    '        <div class="step"><div class="step-no">3</div><h3>Your ongoing plan</h3><p>If treatment is prescribed, you collect it in store or have it posted to you, with follow-up reviews. If it is not suitable, the prescriber will explain why and advise on the best next step.</p></div>\n' +
    '      </div>\n' +
    '    </section>';
}

function faq(b) {
  return '' +
    '          <div class="faq-card pad">\n' +
    '            <h2 class="h2">Questions people usually ask</h2>\n' +
    '            <details><summary>Is this an NHS service?</summary><div class="answer">No. This is a private service. Consultations and any medication supplied are paid for privately.</div></details>\n' +
    '            <details><summary>What does it cost?</summary><div class="answer">The consultation is ' + CONSULT_FEE + '. If medication is prescribed, its cost depends on the medicine and dose, and it is confirmed before you agree to anything, so there are no hidden charges.</div></details>\n' +
    '            <details><summary>Will I definitely be prescribed medication?</summary><div class="answer">No. The prescriber only prescribes where it is clinically appropriate for you. If it is not, they will explain why and discuss other options.</div></details>\n' +
    '            <details><summary>Can I ask for a particular medicine?</summary><div class="answer">You can tell the prescriber what you have read about, and they will discuss it with you, but the decision is a clinical one made with you at your consultation. A medicine that is not suitable for you will not be prescribed.</div></details>\n' +
    '            <details><summary>How quickly will I receive my medication?</summary><div class="answer">If prescribed in store, it is usually ready the same day once approved. Posted orders are usually dispatched within one working day.</div></details>\n' +
    '            <details><summary>Can you show me how to inject?</summary><div class="answer">Yes. If an injection is prescribed, our pharmacists can show you in person, and we can support you each week if you prefer.</div></details>\n' +
    '            <details><summary>Do I need a GP referral?</summary><div class="answer">No. You can book directly with ' + esc(b.branchName) + '. This service does not replace your GP, and the prescriber will refer you back to your GP if that is the more appropriate route.</div></details>\n' +
    '          </div>\n' +
    '          <div class="faq-card pad" style="margin-top:18px;background:#f7fbfd;">\n' +
    '            <p style="margin:0;font-size:13px;line-height:1.6;color:#4b5563;">This page is general information, not medical advice, and does not guarantee eligibility, treatment or results. Suitability, any prescription and expected outcomes are decided individually by a prescriber following a full assessment. Prices shown are indicative and may change; your prescriber will confirm current pricing at consultation.</p>\n' +
    '          </div>';
}

function enquiryForm(b) {
  return '' +
    '<div class="form-card hero-form pad" id="svc-enquiry">\n' +
    '          <iframe name="svc-post" id="svc-post" style="display:none;"></iframe>\n' +
    '          <form id="svc-form" method="post" target="svc-post" novalidate>\n' +
    '            <h2 class="form-title">Prefer us to call you?</h2>\n' +
    '            <p class="form-sub">Leave your name and number and our ' + esc(b.seoTown) + ' team will call you back to arrange your consultation.</p>\n' +
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

function contactCard(b) {
  const siteHost = b.website.replace(/^https?:\/\//, "");
  const mapQ = encodeURIComponent(fullAddr(b));
  const reviewLine = b.googleReviewUrl
    ? '\n            <div class="contact-line"><p><strong>Google reviews:</strong> <a href="' + b.googleReviewUrl + '" target="_blank" rel="noopener">Read our latest reviews</a></p></div>'
    : "";
  return '' +
    '<div class="contact-card pad">\n' +
    '            <h2 class="h2">Contact ' + esc(b.branchName) + '</h2>\n' +
    '            <p><strong>' + esc(b.branchName) + '</strong></p>\n' +
    '            <div class="contact-line"><p>' + esc(fullAddr(b)) + '</p></div>\n' +
    '            <div class="contact-line"><p><strong>Phone:</strong> <a href="tel:' + tel(b) + '">' + esc(b.phone) + '</a></p></div>\n' +
    '            <div class="contact-line"><p><strong>Website:</strong> <a href="' + b.website + '" target="_blank" rel="noopener">' + esc(siteHost) + '</a></p></div>' + reviewLine + '\n' +
    '            <iframe class="map" src="https://www.google.com/maps?q=' + mapQ + '&output=embed" loading="lazy"></iframe>\n' +
    '          </div>';
}

function pharmacySchema(b, url) {
  const obj = {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    "name": b.branchName,
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
  };
  const oh = ((b.openingHours || {}).specification || []).map(function (s) {
    return { "@type": "OpeningHoursSpecification", "dayOfWeek": s.dayOfWeek, "opens": s.opens, "closes": s.closes };
  });
  if (oh.length) obj.openingHoursSpecification = oh;
  return '<script type="application/ld+json">\n' + JSON.stringify(obj, null, 2) + "\n</script>";
}

function innerPage(id, legacyFile) {
  const b = byId[id];
  if (!b) throw new Error("Unknown branch id in BUILD: " + id);
  if (b.disposed) throw new Error("Branch " + id + " is disposed and must not get a page");
  const url = b.website + "/" + legacyFile;
  const seo = seoStrings(b);
  return '<!--\n' +
    ' ' + b.branchName.toUpperCase() + ' - weight loss INNER page (Regime 2, names medicines).\n' +
    ' Paste this whole block into the Weebly "Embed Code" element on ' + url + ',\n' +
    ' REPLACING the legacy block there. Log the legacy block before replacing it (Weebly has no undo).\n' +
    ' Weebly page SEO title: ' + seo.title + '\n' +
    ' Weebly page SEO description: ' + seo.meta + '\n' +
    ' NEVER link to this page from an ad, a Google Business Profile post, social media or an email:\n' +
    ' those go to the generic landing page, which names no medicine. A menu link labelled\n' +
    ' "Weight Loss Clinic" is fine; a menu label naming a medicine is not.\n' +
    ' Superintendent pharmacist signs off the clinical wording before publish.\n' +
    '-->\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="' + CDN + '/service.css">\n' +
    '<script src="' + CDN + '/service.js" defer></script>\n\n' +
    '<div id="rbhsv-root" data-branch="' + esc(b.branchName) + '" data-service="Weight Loss Clinic" data-wa="' + b.whatsapp + '">\n' +
    '  <div class="wrap">\n\n' +
    '    <section class="hero">\n' +
    '      <div class="hero-grid">\n' +
    '        <div>\n' +
    '          <div class="hero-help-row">Private Weight Loss Clinic</div>\n' +
    '          <span class="pill">Private service &middot; not funded by the NHS &middot; ' + esc(b.seoTown) + '</span>\n' +
    '          <h1>Weight loss treatment options at ' + esc(b.branchName) + ', ' + esc(b.seoTown) + '</h1>\n' +
    '          <p class="hero-proof">Private, pharmacist-led weight loss consultations, in store or online.</p>\n' +
    '          <p class="hero-sub">This page explains the treatment options a prescriber may discuss with you at a private consultation. A consultation may or may not lead to a prescription: the prescriber decides with you whether any treatment is suitable, based on your health history. This is a paid private service, not an NHS treatment, and it is not right for everyone.</p>\n' +
    '          <div class="hero-actions-stack">\n' +
    '            <a href="#book" class="btn-pill btn-primary"><span>Book in store</span></a>\n' +
    ((b.widgets || {}).weightLossOnline ? '            <a href="#book-online" class="btn-pill btn-white"><span>Book online consultation</span></a>\n' : '') +
    '            <a href="#options" class="btn-pill btn-white"><span>Read about the options</span></a>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div>\n          ' + bookingCard(b) + '\n        </div>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    treatmentOptions() + '\n\n' +
    eligibility() + '\n\n' +
    inStoreOrOnline(b) + '\n\n' +
    howItWorks() + '\n\n' +
    '    <section class="section">\n' +
    '      <div class="main-grid">\n' +
    '        <div>\n' + faq(b) + '\n        </div>\n' +
    '        <div>\n          ' + enquiryForm(b) + '\n          <div style="margin-top:18px;"></div>\n          ' + contactCard(b) + '\n        </div>\n' +
    '      </div>\n' +
    '    </section>\n\n' +
    '  </div>\n' +
    '</div>\n\n' +
    pharmacySchema(b, url) + "\n";
}

const outDir = path.join(__dirname, "..", "modules", "service", "inner");
fs.mkdirSync(outDir, { recursive: true });

const index = ["# Weight loss inner pages (Regime 2) - paste manifest", "",
  "Each page names medicines and is pasted over the branch's existing legacy weight loss URL.",
  "Never link to these from an ad, a Google post, social media or an email. Superintendent pharmacist signs off first.", ""];

Object.keys(BUILD).forEach(function (id) {
  const b = byId[id];
  const file = BUILD[id];
  fs.writeFileSync(path.join(outDir, file), innerPage(id, file), "utf8");
  const seo = seoStrings(b);
  index.push("## " + b.branchName + " - " + b.seoTown);
  index.push("- **Paste over:** " + b.website + "/" + file);
  index.push("- **Page Title:** " + seo.title);
  index.push("- **Page Description:** " + seo.meta);
  index.push("");
});
fs.writeFileSync(path.join(outDir, "INDEX.md"), index.join("\n"), "utf8");
console.log("Generated " + Object.keys(BUILD).length + " weight loss inner page(s) into modules/service/inner/");
