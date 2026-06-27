/*
  Generates one SEO-first switch landing page per branch (per town) from
  branches.json + the per-branch config below. Run:  node tools/build-switch-pages.js
  Outputs: modules/switch/pages/<slug>.html  and  modules/switch/pages/INDEX.md
*/
const fs = require("fs");
const path = require("path");

// Commit hash the pages pin switch.css / switch.js to (immutable = no jsDelivr lag).
const PIN = "6a275e1";
const CDN = "https://cdn.jsdelivr.net/gh/rishi235/rbh-site-data@" + PIN + "/modules/switch";
const WHATSAPP = "447521775631";

// Per-branch presentation config (town/slug curated for SEO; data pulled from branches.json).
// videoId and services are only set where we have real URLs (Smartts).
const CONFIG = {
  smartts_bootle:        { brand: "Smartts Chemist", brandSlug: "smartts", town: "Bootle", townSlug: "bootle", site: "https://www.smarttschemist.co.uk",
    videoId: "Y5yamwKtIDU",
    services: [
      ["service-red","Blood Tests","Fast local private testing.","https://www.smarttschemist.co.uk/blood-testing.html"],
      ["service-gold","Vaccinations","Comprehensive vaccination services.","https://www.smarttschemist.co.uk/vaccinations.html"],
      ["service-green","Weight Loss Clinic","Support that delivers results.","https://www.smarttschemist.co.uk/weight-loss-clinic-bootle.html"],
      ["service-blue","Pharmacy First","NHS treatment for common conditions.","https://www.smarttschemist.co.uk/pharmacy-first-service-bootle.html"],
      ["service-orange","Travel Clinic","Advice and vaccines before travel.","https://www.smarttschemist.co.uk/vaccinations.html"],
      ["service-purple","Medical Cannabis","Book a free consultation to discuss eligibility.","https://www.smarttschemist.co.uk/medical-cannabis.html"]
    ] },
  colemanleigh_liverpool:{ brand: "Coleman & Leigh Pharmacy", brandSlug: "coleman-leigh", town: "Walton", townSlug: "walton", site: "https://www.colemanandleighspharmacy.co.uk" },
  fishlocks_ainsdale:    { brand: "Fishlocks Chemist", brandSlug: "fishlocks", town: "Ainsdale", townSlug: "ainsdale", site: "https://www.fishlockpharmacy.co.uk" },
  fishlocks_eccleston:   { brand: "Fishlocks Chemist", brandSlug: "fishlocks", town: "Eccleston", townSlug: "eccleston", site: "https://www.fishlockpharmacy.co.uk" },
  gordonshorts_crosby:   { brand: "Gordon Short Chemist", brandSlug: "gordon-short", town: "Crosby", townSlug: "crosby", site: "https://www.gordonshortchemist.co.uk" },
  hirshmans_ainsdale:    { brand: "Hirshmans Chemist", brandSlug: "hirshmans", town: "Ainsdale", townSlug: "ainsdale", site: "https://www.hirshmanspharmacy.co.uk" },
  mccanns_aigburth:      { brand: "McCanns Chemist", brandSlug: "mccanns", town: "Aigburth", townSlug: "aigburth", site: "https://www.mccannspharmacy.co.uk" },
  mccanns_sandringham:   { brand: "McCanns Chemist", brandSlug: "mccanns", town: "Sandringham", townSlug: "sandringham", site: "https://www.mccannspharmacy.co.uk" },
  riddings_timperley:    { brand: "Riddings Pharmacy", brandSlug: "riddings", town: "Timperley", townSlug: "timperley", site: "https://www.riddingspharmacy.co.uk" },
  skchemists_bootle:     { brand: "SK Chemists", brandSlug: "sk-chemists", town: "Bootle", townSlug: "bootle", site: "https://www.skchemist.co.uk" },
  tiffenbergs_longmoor:  { brand: "Tiffenbergs Chemist", brandSlug: "tiffenbergs", town: "Aintree", townSlug: "aintree", site: "https://www.tiffenbergschemist.co.uk" },
  scorah_bramhall:       { brand: "Scorah Chemists", brandSlug: "scorah", town: "Bramhall", townSlug: "bramhall", site: "https://www.scorah-chemists.co.uk" },
  scorah_hazel:          { brand: "Scorah Chemists", brandSlug: "scorah", town: "Hazel Grove", townSlug: "hazel-grove", site: "https://www.scorah-chemists.co.uk" },
  wilmslow_wilmslow:     { brand: "Wilmslow Pharmacy", brandSlug: "wilmslow", town: "Wilmslow", townSlug: "wilmslow", site: "https://www.wilmslow-pharmacy.co.uk" },
  cherrylane_liverpool:  { brand: "Cherry Lane Pharmacy", brandSlug: "cherry-lane", town: "Walton", townSlug: "walton", site: "https://www.cherrylanepharmacy.co.uk" },
  clearchemist_aintree:  { brand: "Clear Chemist", brandSlug: "clear", town: "Aintree", townSlug: "aintree", site: "https://www.clearchemist.co.uk" }
};

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "branches.json"), "utf8"));
const byId = {};
data.branches.forEach(b => { byId[b.id] = b; });

function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

function page(id){
  const c = CONFIG[id];
  const b = byId[id];
  const slug = `switch-prescriptions-${c.brandSlug}-${c.townSlug}.html`;
  const url = `${c.site}/${slug}`;
  const tel = (b.phone||"").replace(/\s+/g,"");
  const fullAddress = [b.streetAddress, b.addressLocality, b.postalCode].filter(Boolean).join(", ");
  const mapQ = encodeURIComponent(fullAddress);
  const siteHost = c.site.replace(/^https?:\/\//,"");
  const title = `Switch Your Prescriptions - ${c.brand} ${c.town}`;
  const meta = `Switch your prescriptions to ${c.brand} in ${c.town} in under 30 seconds. Local NHS pharmacy — we contact your GP and handle everything.`;

  const appCard = b.hasApp ? `
            <div class="app-card">
              <div class="app-head"><strong>Download our app</strong></div>
              <p class="app-copy">Manage your prescriptions more easily through the RB Healthcare Pharmacy app.</p>
              <div class="store-grid">
                <a class="store-btn" href="https://apps.apple.com/gb/app/rb-healthcare-pharmacy/id6757514364" target="_blank" rel="noopener"><span><small>Download on the</small><span class="txt">App Store</span></span></a>
                <a class="store-btn" href="https://play.google.com/store/apps/details?id=com.rbhealthcare.pharmacy.app&pcampaignid=web_share" target="_blank" rel="noopener"><span><small>Get it on</small><span class="txt">Google Play</span></span></a>
              </div>
            </div>` : "";

  const reviewCard = b.googleReviewUrl ? `
            <div class="google-review-card">
              <div class="google-review-inner">
                <div class="google-copy">
                  <strong>Google reviews <span class="stars" aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</span></strong>
                  <p>See what local patients say about ${esc(c.brand)} and why people in ${esc(c.town)} choose us.</p>
                </div>
                <div class="google-action">
                  <a class="google-link-btn" href="${b.googleReviewUrl}" target="_blank" rel="noopener"><span>Read Google reviews</span></a>
                </div>
              </div>
            </div>` : "";

  const reviewContactLine = b.googleReviewUrl ? `
            <div class="contact-line"><p><strong>Google reviews:</strong> <a href="${b.googleReviewUrl}" target="_blank" rel="noopener">Read our latest reviews</a></p></div>` : "";

  const video = c.videoId ? `

    <section class="section">
      <div class="video-card pad">
        <h2 class="h2">Watch how easy it is to switch</h2>
        <p class="lead">A short video from the ${esc(c.brand)} team explaining what happens and why switching is easier than most people think.</p>
        <div class="video-frame">
          <iframe src="https://www.youtube.com/embed/${c.videoId}" title="How to switch to ${esc(c.brand)}" loading="lazy" allowfullscreen></iframe>
        </div>
      </div>
    </section>` : "";

  const services = c.services ? `

    <section class="section">
      <div class="services-card pad">
        <h2 class="h2">Healthcare services available at ${esc(c.brand)}</h2>
        <p class="lead" style="margin-bottom:18px;">${esc(c.brand)} provides a range of NHS and private healthcare services for the local ${esc(c.town)} community.</p>
        <div class="service-grid">
          ${c.services.map(s=>`<a class="service-item ${s[0]}" href="${s[3]}"><strong>${esc(s[1])}</strong><span>${esc(s[2])}</span><em>Learn more</em></a>`).join("\n          ")}
        </div>
      </div>
    </section>` : "";

  return `<!--
  ${c.brand.toUpperCase()} — Switch landing page (SEO-first).
  Paste this whole block into the Weebly "Embed Code" element on ${slug}
  Weebly page SEO title:       ${title}
  Weebly page SEO description:  ${meta}
-->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${CDN}/switch.css">
<script src="${CDN}/switch.js" defer></script>

<div id="rbhsw-root" data-branch="${esc(c.brand)}" data-wa="${WHATSAPP}">
  <div class="wrap">

    <section class="hero">
      <div class="hero-grid">
        <div>
          <div class="hero-help-row">Need help deciding?</div>
          <span class="pill">Your local independent pharmacy in ${esc(c.town)}</span>

          <h1>Switch your prescriptions to ${esc(c.brand)} in ${esc(c.town)} in under 30 seconds</h1>
          <p class="hero-proof">We contact your GP. We handle everything. You do nothing.</p>

          <p class="hero-sub">${esc(c.brand)} is a local NHS pharmacy in ${esc(c.town)}. Switching your prescriptions to us is quick, free, and means your medication comes to a pharmacy team you can actually speak to.</p>

          <ul class="hero-points">
            <li>We handle the full switch for you</li>
            <li>No interruption to your medication</li>
            <li>Local ${esc(c.town)} pharmacy support, not a call centre</li>
            <li>Speak to a pharmacist when you need help</li>
          </ul>

          <div class="hero-actions-stack">
            <a href="#switch-form-card" class="btn-pill btn-primary"><span>Start your switch</span></a>
            <a href="tel:${tel}" class="btn-pill btn-white"><span>Call ${esc(b.phone)}</span></a>
            <a href="#switch-form-card" id="switch-callback-btn" class="btn-pill btn-white"><span>Request a callback</span></a>
            <a id="switch-wa-hero" href="#" class="btn-pill btn-wa" rel="nofollow noopener"><span>Chat on WhatsApp</span></a>
          </div>
        </div>

        <div id="switch-form-card" class="form-card hero-form pad">
          <iframe name="switch-post" id="switch-post" style="display:none;"></iframe>

          <form id="switch-form" method="post" target="switch-post" novalidate>
            <h2 class="form-title" id="switch-form-title">Start your switch</h2>
            <p class="form-sub" id="switch-form-sub">This takes about 30 seconds. Our team will review the request and guide the next step.</p>

            <div class="form-grid">
              <label>First name *<input type="text" name="first_name" autocomplete="given-name" required></label>
              <label>Last name *<input type="text" name="last_name" autocomplete="family-name" required></label>
              <label class="field-dob">Date of birth *<input type="date" name="dob" required></label>
              <label><span class="mobile-label-text">Mobile (optional)</span><input type="tel" name="mobile" autocomplete="tel" placeholder="07..."></label>
              <label class="full">Email (optional)<input type="email" name="email" autocomplete="email" placeholder="name@example.com"></label>
            </div>

            <input type="hidden" name="destination" value="">
            <input type="hidden" name="source" value="${esc(c.brand)} ${esc(c.town)} Switch Page">
            <input type="hidden" name="website_url" value="">
            <input type="text" name="company" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">

            <p id="switch-form-mode-link" style="display:none; margin:0 0 14px; font-size:14px;">
              <a href="#" id="switch-switch-mode">Or start your prescription switch instead</a>
            </p>

            <div class="actions">
              <button type="submit" class="btn submit-btn"><span id="switch-submit-text">Submit switch request</span></button>
              <a id="switch-wa" class="btn wa-btn" href="#" rel="nofollow noopener">Send via WhatsApp instead</a>
            </div>

            <p class="privacy">We will only use your details to help process your switch request.</p>
            <div id="switch-msg" class="msg" aria-live="polite"></div>
          </form>

          <div id="switch-thankyou" class="thankyou">
            <h3>Thank you</h3>
            <p>We have received your request and the team will contact you shortly.</p>
          </div>

          <div class="right-stack">${appCard}${reviewCard}
          </div>
        </div>
      </div>
    </section>

    <div class="trust-bar">
      <div class="trust-item"><strong>NHS pharmacy</strong><span>Registered local healthcare provider</span></div>
      <div class="trust-item"><strong>Local ${esc(c.town)} team</strong><span>Real people, not a call centre</span></div>
      <div class="trust-item"><strong>Simple switching</strong><span>We help handle the transfer process</span></div>
      <div class="trust-item"><strong>Easy to contact</strong><span>Phone and WhatsApp if you prefer to speak to us</span></div>
    </div>

    <section class="section">
      <h2 class="h2">How switching to ${esc(c.brand)} works</h2>
      <p class="lead">Most people put off switching pharmacy because they assume it will be a hassle. With ${esc(c.brand)} in ${esc(c.town)}, it usually is not — we make the first step quick and easy.</p>
      <div class="steps">
        <div class="step"><div class="step-no">1</div><h3>Fill in the form</h3><p>Enter your first name, last name and date of birth. Mobile and email are optional.</p></div>
        <div class="step"><div class="step-no">2</div><h3>We review your request</h3><p>Our ${esc(c.town)} team checks your details and guides the next step to move your prescriptions across.</p></div>
        <div class="step"><div class="step-no">3</div><h3>Collect from us</h3><p>Your prescriptions come to ${esc(c.brand)} and you get support from a real local pharmacy team.</p></div>
      </div>
    </section>${video}

    <section class="section">
      <div class="main-grid">
        <div>
          <div class="faq-card pad">
            <h2 class="h2">Questions people usually ask</h2>
            <details><summary>Is switching pharmacy to ${esc(c.brand)} a hassle?</summary><div class="answer">Usually no. Most people delay it because they assume it will be awkward, but switching to ${esc(c.brand)} in ${esc(c.town)} is much simpler than expected.</div></details>
            <details><summary>Do I need to contact my GP myself?</summary><div class="answer">Not always. We help guide the process and handle what we can from our side. If anything extra is needed, we will tell you clearly.</div></details>
            <details><summary>Why do you only ask for basic details?</summary><div class="answer">Because long forms put people off. For the first step, we only need enough information to identify you and start the process properly.</div></details>
            <details><summary>What if I am not ready yet?</summary><div class="answer">Call us on ${esc(b.phone)}, request a callback, or send a WhatsApp message instead. The aim is to make this easy, not pushy.</div></details>
          </div>
        </div>
        <div>
          <div class="contact-card pad">
            <h2 class="h2">Contact ${esc(c.brand)}</h2>
            <p><strong>${esc(c.brand)}</strong></p>
            <div class="contact-line"><p>${esc(fullAddress)}</p></div>
            <div class="contact-line"><p><strong>Phone:</strong> <a href="tel:${tel}">${esc(b.phone)}</a></p></div>
            <div class="contact-line"><p><strong>Website:</strong> <a href="${c.site}" target="_blank" rel="noopener">${esc(siteHost)}</a></p></div>${reviewContactLine}
            <iframe class="map" src="https://www.google.com/maps?q=${mapQ}&output=embed" loading="lazy"></iframe>
          </div>
        </div>
      </div>
    </section>${services}

  </div>
</div>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Pharmacy",
  "name": "${c.brand.replace(/"/g,'')}",
  "url": "${url}",
  "telephone": "${b.phone||""}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "${(b.streetAddress||"").replace(/"/g,'')}",
    "addressLocality": "${b.addressLocality||""}",
    "postalCode": "${b.postalCode||""}",
    "addressRegion": "${b.addressRegion||""}",
    "addressCountry": "${b.addressCountry||"GB"}"
  }
}
</script>
`;
}

const outDir = path.join(__dirname, "..", "modules", "switch", "pages");
fs.mkdirSync(outDir, { recursive: true });
const bannerDir = path.join(outDir, "banners");
fs.mkdirSync(bannerDir, { recursive: true });

function banner(c){
  var slug = "switch-prescriptions-" + c.brandSlug + "-" + c.townSlug + ".html";
  var href = "/" + slug;
  var brandEsc = c.brand.replace(/"/g, "");
  return `<!-- RBH switch banner. Paste into Weebly: Settings > SEO > Header Code (site-wide).
     Only the two CONFIG lines below change per site. Auto-hides on the switch page. -->
<style>
  :root { --flu-h: 0px; }
  .flu-header-banner{ display:none; position:fixed; top:0; left:0; right:0; z-index:10000; background:#ED8B00; color:#fff; text-align:center; width:100%; box-sizing:border-box; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; font-size:16px; padding:10px 15px; }
  .flu-header-banner span{ margin-right:12px; font-weight:500; display:inline-block; }
  .flu-header-banner .flu-header-btn{ display:inline-block; background:#fff; color:#ED8B00; padding:6px 12px; border-radius:4px; font-weight:600; text-decoration:none; transition:background .2s,color .2s; white-space:nowrap; }
  .flu-header-banner .flu-header-btn:hover{ background:#333; color:#fff; }
  .flu-header-banner .flu-header-close{ background:none; border:none; color:#fff; font-size:20px; font-weight:bold; line-height:1; position:absolute; right:12px; top:6px; cursor:pointer; }
  body.flu-banner-active .edison-header, body.flu-banner-active .nav.mobile-nav, body.flu-banner-active .wsite-menu-default, body.flu-banner-active .site-nav, body.flu-banner-active .wsite-com-header-cart{ top: var(--flu-h) !important; }
  body.flu-banner-active.flu-has-banner .banner-wrap{ padding-top: var(--flu-h) !important; }
  body.flu-banner-active.flu-has-banner.banner-overlay-on .banner-wrap{ padding-top: calc(var(--flu-h) + 16px) !important; }
  body.flu-banner-active.flu-noheader .content-wrap{ margin-top: var(--flu-h) !important; }
  body.flu-banner-active{ scroll-padding-top: calc(var(--flu-h) + 10px); }
  @media (max-width:767px){ .flu-header-banner{ font-size:14px; padding:8px 12px; } }
</style>
<script>
(function(){
  /* ===== CONFIG — change these two lines per site ===== */
  var SWITCH_URL = "${href}";
  var BRAND = "${brandEsc}";
  /* =================================================== */
  var DISMISS_KEY = "rbhSwitchBannerClosed";
  var store = window.sessionStorage;
  function onReady(fn){ if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",fn,{once:true});}else{fn();} }
  onReady(function(){
    if ((location.pathname||"").toLowerCase().indexOf("/switch-prescriptions")===0){
      document.body.classList.remove("flu-banner-active","flu-noheader","flu-has-banner");
      document.documentElement.style.setProperty("--flu-h","0px");
      var stray=document.getElementById("fluBanner"); if(stray) stray.remove(); return;
    }
    var existing=document.getElementById("fluBanner"); if(existing) existing.remove();
    var hasBannerWrap=!!document.querySelector(".banner-wrap");
    document.body.classList.toggle("flu-has-banner",hasBannerWrap);
    document.body.classList.toggle("flu-noheader",!hasBannerWrap);
    if (store.getItem(DISMISS_KEY)==="1"){ document.body.classList.remove("flu-banner-active"); document.documentElement.style.setProperty("--flu-h","0px"); return; }
    var b=document.createElement("div");
    b.className="flu-header-banner"; b.id="fluBanner";
    b.innerHTML="<span>Change to "+BRAND+" in 30 seconds.</span> <a class='flu-header-btn' href='"+SWITCH_URL+"'>Switch now</a> <button class='flu-header-close' aria-label='Close'>×</button>";
    document.body.prepend(b);
    b.style.display="block";
    document.body.classList.add("flu-banner-active");
    var setHeight=function(){ var h=Math.ceil(b.getBoundingClientRect().height); document.documentElement.style.setProperty("--flu-h",h+"px"); };
    setHeight(); window.addEventListener("resize",setHeight); setTimeout(setHeight,100); window.addEventListener("load",setHeight);
    b.querySelector(".flu-header-close").addEventListener("click",function(){ store.setItem(DISMISS_KEY,"1"); b.remove(); document.body.classList.remove("flu-banner-active"); document.documentElement.style.setProperty("--flu-h","0px"); });
  });
})();
</script>`;
}

function keywords(c, b){
  const outward = (b.postalCode||"").split(" ")[0];
  return [
    c.brand,
    `${c.brand} ${c.town}`,
    `switch prescriptions ${c.town}`,
    "switch pharmacy",
    "prescription transfer",
    "repeat prescriptions",
    `pharmacy ${c.town}`,
    `NHS pharmacy ${c.town}`,
    `chemist ${c.town}`,
    outward
  ].filter(Boolean).join(", ");
}

const manifest = [];
Object.keys(CONFIG).forEach(id => {
  const c = CONFIG[id];
  const b = byId[id];
  const slug = `switch-prescriptions-${c.brandSlug}-${c.townSlug}.html`;
  fs.writeFileSync(path.join(outDir, slug), page(id));
  fs.writeFileSync(path.join(bannerDir, slug.replace(/\.html$/, ".txt")), banner(c));
  manifest.push({
    branch: c.brand + " — " + c.town,
    file: slug,
    permalink: slug.replace(/\.html$/,""),
    liveUrl: `${c.site}/${slug}`,
    seoTitle: `Switch Your Prescriptions - ${c.brand} ${c.town}`,
    seoDesc: `Switch your prescriptions to ${c.brand} in ${c.town} in under 30 seconds. Local NHS pharmacy — we contact your GP and handle everything.`,
    keywords: keywords(c, b),
    hasApp: !!b.hasApp
  });
});

// Write a human-readable index/manifest
let md = "# Switch pages — paste manifest\n\nEach page below is in this folder. Paste the file's contents into a Weebly Embed Code element on the matching URL, and set the Weebly page SEO title + description.\n\n";
manifest.forEach(m => {
  md += `## ${m.branch}${m.hasApp ? "  *(app member)*" : ""}\n`;
  md += `- **Page slug / URL:** \`${m.file}\` → ${m.liveUrl}\n`;
  md += `- **SEO title:** ${m.seoTitle}\n`;
  md += `- **SEO description:** ${m.seoDesc}\n\n`;
});
fs.writeFileSync(path.join(outDir, "INDEX.md"), md);

// Write the per-page Weebly SEO Settings sheet (Title / Permalink / Description / Keywords)
let seo = "# Weebly SEO Settings — per page\n\nFor each page, paste these into Weebly > Pages > (page) > SEO Settings.\nMeta keywords are ignored by Google/Bing (kept for completeness only).\n\n";
manifest.forEach(m => {
  seo += `## ${m.branch}${m.hasApp ? "  *(app member)*" : ""}\n`;
  seo += `- **Page Title:** ${m.seoTitle}\n`;
  seo += `- **Page Permalink:** ${m.permalink}\n`;
  seo += `- **Page Description:** ${m.seoDesc}\n`;
  seo += `- **Meta Keywords:** ${m.keywords}\n\n`;
});
fs.writeFileSync(path.join(outDir, "SEO.md"), seo);

console.log("Generated " + manifest.length + " pages into modules/switch/pages/");
manifest.forEach(m => console.log("  " + (m.hasApp?"[APP] ":"      ") + m.file));
