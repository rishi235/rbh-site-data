(function () {
  "use strict";

  var root = document.getElementById("rbhsw-root");
  if (!root) return;

  var FORM_ACTION = "https://script.google.com/macros/s/AKfycbwoudCOSQWOgFVPmlFNhASBBlyB0TEB6Ba4uaUCB3fhPN7jMXnD_8T1oLN2Ua8ZevA/exec";
  var WHATSAPP_E164 = "447521775631";
  var DESTINATION = "rishi@rbhealth.co.uk";

  // ---------------------------------------------------------------------------
  // Page markup. Lives here (not in Weebly) so the whole layout is controlled
  // from GitHub — Weebly only needs the loader lines + <div id="rbhsw-root">.
  // ---------------------------------------------------------------------------
  var TEMPLATE =
    '<div class="wrap">' +
    '  <section class="hero">' +
    '    <div class="hero-grid">' +
    '      <div>' +
    '        <div class="hero-help-row">Need help deciding?</div>' +
    '        <span class="pill" id="sw-pill-locality">Your local independent pharmacy</span>' +
    '        <h1>Switch your prescriptions to <span id="sw-hero-branch">your local pharmacy</span> in under 30 seconds</h1>' +
    '        <p class="hero-proof">We contact your GP. We handle everything. You do nothing.</p>' +
    '        <ul class="hero-points">' +
    '          <li>We handle the full switch for you</li>' +
    '          <li>No interruption to your medication</li>' +
    '          <li>Local pharmacy support, not a call centre</li>' +
    '          <li>Speak to a pharmacist when you need help</li>' +
    '        </ul>' +
    '        <div class="hero-actions-stack">' +
    '          <a href="#switch-form-card" class="btn-pill btn-primary"><span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4 12h16M12 4l8 8-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>Start your switch</span></a>' +
    '          <a id="sw-call-btn" href="#" class="btn-pill btn-white"><span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.77.66 2.61a2 2 0 0 1-.45 2.11L8.05 9.91a16 16 0 0 0 6.04 6.04l1.47-1.27a2 2 0 0 1 2.11-.45c.84.32 1.71.54 2.61.66A2 2 0 0 1 22 16.92z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="sw-call-text">Call us</span></a>' +
    '          <a href="#switch-form-card" id="switch-callback-btn" class="btn-pill btn-white"><span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>Request a callback</span></a>' +
    '          <a id="switch-wa-hero" href="#" class="btn-pill btn-wa" rel="nofollow noopener"><span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M20 11.5A8.5 8.5 0 0 1 7.52 19L4 20l1.06-3.34A8.5 8.5 0 1 1 20 11.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>Chat on WhatsApp</span></a>' +
    '        </div>' +
    '      </div>' +
    '      <div id="switch-form-card" class="form-card hero-form pad">' +
    '        <iframe name="switch-post" id="switch-post" style="display:none;"></iframe>' +
    '        <form id="switch-form" method="post" target="switch-post" novalidate>' +
    '          <h2 class="form-title" id="switch-form-title">Start your switch</h2>' +
    '          <p class="form-sub" id="switch-form-sub">This takes about 30 seconds. Our team will review the request and guide the next step.</p>' +
    '          <div class="form-grid">' +
    '            <label>First name *<input type="text" name="first_name" autocomplete="given-name" required></label>' +
    '            <label>Last name *<input type="text" name="last_name" autocomplete="family-name" required></label>' +
    '            <label class="field-dob">Date of birth *<input type="date" name="dob" required></label>' +
    '            <label><span class="mobile-label-text">Mobile (optional)</span><input type="tel" name="mobile" autocomplete="tel" placeholder="07..."></label>' +
    '            <label class="full">Email (optional)<input type="email" name="email" autocomplete="email" placeholder="name@example.com"></label>' +
    '          </div>' +
    '          <input type="hidden" name="destination" value="">' +
    '          <input type="hidden" name="source" value="">' +
    '          <input type="hidden" name="website_url" value="">' +
    '          <input type="text" name="company" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
    '          <p id="switch-form-mode-link" style="display:none; margin:0 0 14px; font-size:14px;"><a href="#" id="switch-switch-mode">Or start your prescription switch instead</a></p>' +
    '          <div class="actions">' +
    '            <button type="submit" class="btn submit-btn"><span id="switch-submit-text">Submit switch request</span></button>' +
    '            <a id="switch-wa" class="btn wa-btn" href="#" rel="nofollow noopener">Send via WhatsApp instead</a>' +
    '          </div>' +
    '          <p class="privacy">We will only use your details to help process your switch request.</p>' +
    '          <div id="switch-msg" class="msg" aria-live="polite"></div>' +
    '        </form>' +
    '        <div id="switch-thankyou" class="thankyou">' +
    '          <h3>Thank you</h3>' +
    '          <p>We have received your request and the team will contact you shortly.</p>' +
    '        </div>' +
    '        <div class="right-stack">' +
    '          <div id="sw-app-card" class="app-card" style="display:none;">' +
    '            <div class="app-head"><span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="6" y="2" width="12" height="20" rx="3" stroke="currentColor" stroke-width="2"/><path d="M11 18h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span><strong>Download our app</strong></div>' +
    '            <p class="app-copy">Manage your prescriptions more easily through the RB Healthcare Pharmacy app.</p>' +
    '            <div class="store-grid">' +
    '              <a class="store-btn" href="https://apps.apple.com/gb/app/rb-healthcare-pharmacy/id6757514364" target="_blank" rel="noopener"><span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.37 12.61c.03 3.24 2.84 4.32 2.87 4.34-.02.08-.45 1.52-1.48 3.01-.89 1.29-1.82 2.57-3.28 2.6-1.43.03-1.89-.85-3.52-.85-1.64 0-2.15.82-3.49.88-1.41.05-2.48-1.4-3.38-2.68-1.84-2.64-3.25-7.46-1.36-10.74.94-1.62 2.61-2.65 4.42-2.67 1.38-.03 2.68.93 3.52.93.84 0 2.42-1.15 4.08-.98.69.03 2.62.28 3.86 2.1-.1.06-2.3 1.34-2.24 4.06zM13.92 4.9c.75-.91 1.26-2.18 1.12-3.44-1.08.04-2.39.72-3.16 1.62-.69.79-1.29 2.07-1.13 3.29 1.2.09 2.42-.61 3.17-1.47z"/></svg></span><span><small>Download on the</small><span class="txt">App Store</span></span></a>' +
    '              <a class="store-btn" href="https://play.google.com/store/apps/details?id=com.rbhealthcare.pharmacy.app&pcampaignid=web_share" target="_blank" rel="noopener"><span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M3 2.5v19l10.5-9.5L3 2.5z" fill="#00C853"/><path d="M13.5 12 17 8.8 21 11.1c1.2.7 1.2 1.1 0 1.8L17 15.2 13.5 12z" fill="#FFAB00"/><path d="M3 2.5 14.8 9.3 17 8.8 6.2 2.7c-1-.4-1.8-.3-2.2-.2z" fill="#00B0FF"/><path d="M3 21.5 14.8 14.7 17 15.2 6.2 21.3c-1 .4-1.8.3-2.2.2z" fill="#FF5252"/></svg></span><span><small>Get it on</small><span class="txt">Google Play</span></span></a>' +
    '            </div>' +
    '          </div>' +
    '          <div id="sw-review-card" class="google-review-card" style="display:none;">' +
    '            <div class="google-review-inner">' +
    '              <div class="google-badge"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHBhdGggZmlsbD0iI0VBNDMzNSIgZD0iTTI0IDkuNWMzLjU0IDAgNi43MiAxLjIyIDkuMjIgMy42Mmw2Ljg4LTYuODhDMzUuOSAyLjMgMzAuNDIgMCAyNCAwIDE0LjYyIDAgNi41MSA1LjM4IDIuNTYgMTMuMjJsOCA2LjIxQzEyLjQ3IDEzLjUgMTcuNzMgOS41IDI0IDkuNXoiLz48cGF0aCBmaWxsPSIjNDI4NUY0IiBkPSJNNDYuOTggMjQuNTVjMC0xLjU3LS4xNC0zLjA5LS40LTQuNTVIMjR2OC42MmgxMi45NGMtLjU2IDMuMDItMi4yNiA1LjU4LTQuODIgNy4yOWw3LjM5IDUuNzRjNC4zLTMuOTYgNi43Ny05Ljc5IDYuNzctMTcuMXoiLz48cGF0aCBmaWxsPSIjRkJCQzA1IiBkPSJNMTAuNTYgMjguNTdBMTQuNSAxNC41IDAgMCAxIDkuNSAyNGMwLTEuNTguMzgtMy4wNyAxLjA2LTQuNTdsLTgtNi4yMUEyMy45NCAyMy45NCAwIDAgMCAwIDI0YzAgMy44Ny45MiA3LjUyIDIuNTYgMTAuNzhsOC02LjIxeiIvPjxwYXRoIGZpbGw9IiMzNEE4NTMiIGQ9Ik0yNCA0OGM2LjQ4IDAgMTEuOTItMi4xMyAxNS44OS01LjgxbC03LjM5LTUuNzRjLTIuMDUgMS4zOC00LjY3IDIuMi04LjUgMi4yLTYuMjcgMC0xMS41My00LTEzLjQ0LTkuOTNsLTggNi4yMUM2LjUxIDQyLjYyIDE0LjYyIDQ4IDI0IDQ4eiIvPjwvc3ZnPg==" alt="" width="34" height="34" aria-hidden="true"></div>' +
    '              <div class="google-copy"><strong>Google reviews <span class="stars" aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</span></strong><p>See what local patients say about this pharmacy.</p></div>' +
    '              <div class="google-action"><a id="sw-review-link" class="google-link-btn" href="#" target="_blank" rel="noopener"><span>Read Google reviews</span></a></div>' +
    '            </div>' +
    '          </div>' +
    '        </div>' +
    '      </div>' +
    '    </div>' +
    '  </section>' +
    '  <div class="trust-bar">' +
    '    <div class="trust-item"><strong>NHS pharmacy</strong><span>Registered local healthcare provider</span></div>' +
    '    <div class="trust-item"><strong>Local team</strong><span>Real people, not a call centre</span></div>' +
    '    <div class="trust-item"><strong>Simple switching</strong><span>We help handle the transfer process</span></div>' +
    '    <div class="trust-item"><strong>Easy to contact</strong><span>Phone and WhatsApp available</span></div>' +
    '  </div>' +
    '  <section class="section">' +
    '    <h2 class="h2">How switching works</h2>' +
    '    <p class="lead">Most people put this off because they assume it will be a hassle. Usually it is not.</p>' +
    '    <div class="steps">' +
    '      <div class="step"><div class="step-no">1</div><h3>Fill in the form</h3><p>Enter your first name, last name and date of birth. Mobile and email are optional.</p></div>' +
    '      <div class="step"><div class="step-no">2</div><h3>We review your request</h3><p>Our team checks your details and guides the next step to move your prescriptions across.</p></div>' +
    '      <div class="step"><div class="step-no">3</div><h3>Collect from us</h3><p>Your prescriptions come to your local pharmacy and you get support from a real local team.</p></div>' +
    '    </div>' +
    '  </section>' +
    '  <section class="section">' +
    '    <div class="main-grid">' +
    '      <div>' +
    '        <div class="faq-card pad">' +
    '          <h2 class="h2">Questions people usually ask</h2>' +
    '          <details><summary>Is switching pharmacy a hassle?</summary><div class="answer">Usually no. Most people delay it because they assume it will be awkward, but in many cases it is much simpler than expected.</div></details>' +
    '          <details><summary>Do I need to contact my GP myself?</summary><div class="answer">Not always. We help guide the process and handle what we can from our side. If anything extra is needed, we will tell you clearly.</div></details>' +
    '          <details><summary>Why do you only ask for basic details?</summary><div class="answer">Because long forms put people off. For the first step, we only need enough information to identify you and start the process properly.</div></details>' +
    '          <details><summary>What if I am not ready yet?</summary><div class="answer">Call us, request a callback, or use WhatsApp instead. The aim is to make this easy, not pushy.</div></details>' +
    '        </div>' +
    '      </div>' +
    '      <div>' +
    '        <div class="contact-card pad">' +
    '          <h2 class="h2">Contact</h2>' +
    '          <p><strong id="sw-contact-branch">Your local pharmacy</strong></p>' +
    '          <p id="sw-contact-address">Address</p>' +
    '          <p id="sw-phone-row"><strong>Phone:</strong> <a id="sw-phone-link" href="#">Call</a></p>' +
    '          <p id="sw-email-row"><strong>Email:</strong> <a id="sw-email-link" href="#">Email</a></p>' +
    '          <p><strong>Website:</strong> <a id="sw-website-link" href="#" target="_blank" rel="noopener">Website</a></p>' +
    '          <iframe id="sw-map" class="map" src="" loading="lazy"></iframe>' +
    '        </div>' +
    '      </div>' +
    '    </div>' +
    '  </section>' +
    '</div>';

  // Render the layout into the (otherwise empty) Weebly container.
  root.innerHTML = TEMPLATE;

  // ---- small DOM helpers ----------------------------------------------------
  function byId(id) { return document.getElementById(id); }
  function setText(id, value) { var el = byId(id); if (el) el.textContent = value; }
  function setHref(id, value) { var el = byId(id); if (el) el.setAttribute("href", value); }
  function showEl(id) { var el = byId(id); if (el) el.style.display = ""; }
  function hideEl(id) { var el = byId(id); if (el) el.style.display = "none"; }

  function initSwitch() {
    var data = (window.RBH_DATA && Array.isArray(window.RBH_DATA.branches))
      ? window.RBH_DATA
      : (window.RBH_FALLBACK || { branches: [], brandGroups: {}, hostMap: {} });

    var BR = {};
    (data.branches || []).forEach(function (b) {
      if (b && b.id) BR[b.id] = b;
    });

    var HM = data.hostMap || {};

    // ---- branch selection ---------------------------------------------------
    function pickBranch() {
      var forced = (window.RBH_SWITCH_OVERRIDE || "").toLowerCase().trim();
      if (forced && BR[forced]) return BR[forced];

      var host = (location.hostname || "").toLowerCase();

      if (HM[host] && HM[host].length) {
        var mapped = HM[host].map(function (id) { return BR[id]; }).filter(Boolean);
        if (mapped.length) return mapped[0];
      }

      var surface = host + " " + (location.pathname || "").toLowerCase();
      var best = null;
      var bestScore = 0;

      Object.keys(BR).forEach(function (k) {
        var b = BR[k];
        var kws = (b.keywords || [])
          .concat([b.addressLocality || "", b.postalCode || "", b.brandLabel || "", b.branchName || ""])
          .map(function (x) { return String(x).toLowerCase(); });

        var score = 0;
        kws.forEach(function (kw) {
          if (kw && surface.includes(kw)) score++;
        });

        if (score > bestScore) {
          best = b;
          bestScore = score;
        }
      });

      if (best) return best;
      if (BR.rbh_head_office_aintree) return BR.rbh_head_office_aintree;

      var first = Object.keys(BR)[0];
      return first ? BR[first] : null;
    }

    var branch = pickBranch();
    if (!branch) return;

    var branchName = branch.branchName || branch.brandLabel || "your local pharmacy";
    var locality = branch.addressLocality || "your area";
    var fullAddress = [branch.streetAddress, branch.addressLocality, branch.postalCode].filter(Boolean).join(", ");
    var website = "https://" + (location.hostname || "");
    var phone = branch.phone || "";
    var email = branch.email || "";

    // ---- populate static copy ----------------------------------------------
    setText("sw-pill-locality", "Your local independent pharmacy in " + locality);
    setText("sw-hero-branch", branchName);
    setText("sw-contact-branch", branchName);
    setText("sw-contact-address", fullAddress || "Address available on request");

    setHref("sw-website-link", website);
    setText("sw-website-link", (location.hostname || "").replace(/^www\./, ""));

    if (phone) {
      var telHref = "tel:" + phone.replace(/\s+/g, "");
      setHref("sw-phone-link", telHref);
      setText("sw-phone-link", phone);

      var callBtn = byId("sw-call-btn");
      if (callBtn) {
        callBtn.href = telHref;
        var t = callBtn.querySelector(".sw-call-text");
        if (t) t.textContent = "Call " + phone;
      }
    } else {
      hideEl("sw-phone-row");
      hideEl("sw-call-btn");
    }

    if (email) {
      setHref("sw-email-link", "mailto:" + email);
      setText("sw-email-link", email);
    } else {
      hideEl("sw-email-row");
    }

    var map = byId("sw-map");
    if (map && fullAddress) {
      map.src = "https://www.google.com/maps?q=" + encodeURIComponent(fullAddress) + "&output=embed";
    }

    // ---- app card: only for branches signed up to the RBH app --------------
    if (branch.hasApp) {
      showEl("sw-app-card");
    } else {
      hideEl("sw-app-card");
    }

    // ---- Google reviews: only when we have a review link -------------------
    if (branch.googleReviewUrl) {
      setHref("sw-review-link", branch.googleReviewUrl);
      showEl("sw-review-card");
    } else {
      hideEl("sw-review-card");
    }

    // ---- form ---------------------------------------------------------------
    var form = byId("switch-form");
    var msg = byId("switch-msg");
    var thankyou = byId("switch-thankyou");
    var iframe = byId("switch-post");
    var waBtn = byId("switch-wa");
    var waHeroBtn = byId("switch-wa-hero");
    var callbackBtn = byId("switch-callback-btn");

    if (!form) return;

    form.setAttribute("action", FORM_ACTION);
    if (form.elements["website_url"]) form.elements["website_url"].value = window.location.href;
    if (form.elements["destination"]) form.elements["destination"].value = DESTINATION;
    if (form.elements["source"]) form.elements["source"].value = "Switch Page - " + branchName;

    function clearErrors() {
      form.querySelectorAll("input").forEach(function (field) {
        field.classList.remove("error");
        field.removeAttribute("aria-invalid");
      });
      if (msg) msg.removeAttribute("role");
    }

    function setMessage(text, type) {
      if (!msg) return;
      msg.textContent = text || "";
      msg.className = "msg" + (type ? " " + type : "");
      if (type === "err") msg.setAttribute("role", "alert");
    }

    function validEmail(v) {
      if (!v) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    function readForm() {
      function val(name) {
        return form.elements[name] ? (form.elements[name].value || "").trim() : "";
      }
      return {
        first_name: val("first_name"),
        last_name: val("last_name"),
        dob: val("dob"),
        mobile: val("mobile"),
        email: val("email")
      };
    }

    function isCallbackMode() {
      return form.getAttribute("data-mode") === "callback";
    }

    // Single source of truth for which fields are required in each mode.
    function getMissing(d, isCallback) {
      var missing = [];
      if (!d.first_name) missing.push("first_name");
      if (!d.last_name) missing.push("last_name");
      if (isCallback) {
        if (!d.mobile) missing.push("mobile");
      } else {
        if (!d.dob) missing.push("dob");
      }
      if (d.email && !validEmail(d.email)) missing.push("email");
      return missing;
    }

    function markErrors(missing) {
      missing.forEach(function (name) {
        if (form.elements[name]) {
          form.elements[name].classList.add("error");
          form.elements[name].setAttribute("aria-invalid", "true");
        }
      });
    }

    function buildWhatsAppText(d, isCallback) {
      var lines = [
        isCallback ? "Callback request" : "New switch request",
        "",
        "Pharmacy: " + branchName,
        fullAddress ? "Address: " + fullAddress : null,
        "",
        d.first_name ? "First name: " + d.first_name : null,
        d.last_name ? "Last name: " + d.last_name : null,
        d.dob ? "DOB: " + d.dob : null,
        d.mobile ? "Mobile: " + d.mobile : null,
        d.email ? "Email: " + d.email : null,
        "",
        "Source: " + (isCallback ? "Callback mode" : "Switch mode"),
        "Page: " + window.location.href
      ].filter(Boolean);

      return "https://wa.me/" + WHATSAPP_E164 + "?text=" + encodeURIComponent(lines.join("\n"));
    }

    function openWhatsApp(d, isCallback) {
      var url = buildWhatsAppText(d || {}, isCallback);
      var w = window.open(url, "_blank", "noopener");
      if (!w) window.location.href = url;
    }

    function setCallbackMode(on) {
      var titleEl = byId("switch-form-title");
      var subEl = byId("switch-form-sub");
      var submitText = byId("switch-submit-text");
      var modeLink = byId("switch-form-mode-link");
      var mobileLabel = form.querySelector(".mobile-label-text");
      var dobInput = form.elements["dob"];

      if (on) {
        form.classList.add("form-mode-callback");
        form.setAttribute("data-mode", "callback");
        if (form.elements["source"]) form.elements["source"].value = "Callback request - " + branchName;
        if (dobInput) dobInput.removeAttribute("required");
        if (form.elements["mobile"]) form.elements["mobile"].setAttribute("required", "required");
        if (mobileLabel) mobileLabel.textContent = "Mobile *";
        if (titleEl) titleEl.textContent = "Request a callback";
        if (subEl) subEl.textContent = "We'll call you back. Just your name and phone number needed.";
        if (submitText) submitText.textContent = "Request callback";
        if (modeLink) modeLink.style.display = "block";
      } else {
        form.classList.remove("form-mode-callback");
        form.removeAttribute("data-mode");
        if (form.elements["source"]) form.elements["source"].value = "Switch Page - " + branchName;
        if (dobInput) dobInput.setAttribute("required", "required");
        if (form.elements["mobile"]) form.elements["mobile"].removeAttribute("required");
        if (mobileLabel) mobileLabel.textContent = "Mobile (optional)";
        if (titleEl) titleEl.textContent = "Start your switch";
        if (subEl) subEl.textContent = "This takes about 30 seconds. Our team will review the request and guide the next step.";
        if (submitText) submitText.textContent = "Submit switch request";
        if (modeLink) modeLink.style.display = "none";
      }
    }

    if (waBtn) {
      waBtn.addEventListener("click", function (e) {
        e.preventDefault();
        clearErrors();

        var d = readForm();
        var isCallback = isCallbackMode();
        var missing = getMissing(d, isCallback);

        if (missing.length) {
          markErrors(missing);
          setMessage(isCallback ? "Please enter your name and phone number first." : "Please complete the required fields first.", "err");
          return;
        }

        openWhatsApp(d, isCallback);
      });
    }

    if (waHeroBtn) {
      waHeroBtn.addEventListener("click", function (e) {
        e.preventDefault();
        openWhatsApp(readForm(), false);
      });
    }

    if (callbackBtn) {
      callbackBtn.addEventListener("click", function (e) {
        e.preventDefault();
        setCallbackMode(true);
        var card = byId("switch-form-card");
        if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    var switchModeLink = byId("switch-switch-mode");
    if (switchModeLink) {
      switchModeLink.addEventListener("click", function (e) {
        e.preventDefault();
        setCallbackMode(false);
      });
    }

    form.addEventListener("submit", function (e) {
      clearErrors();
      setMessage("");

      // Honeypot: silently drop bot submissions.
      var hp = form.elements["company"];
      if (hp && (hp.value || "").trim() !== "") {
        e.preventDefault();
        return;
      }

      var d = readForm();
      var isCallback = isCallbackMode();
      var missing = getMissing(d, isCallback);

      if (missing.length) {
        e.preventDefault();
        markErrors(missing);
        setMessage(isCallback ? "Please enter your name and phone number." : "Please complete the required fields.", "err");
        return;
      }

      setMessage("Submitting...");
      form.setAttribute("data-submitted", "true");
    });

    if (iframe) {
      iframe.addEventListener("load", function () {
        if (form.getAttribute("data-submitted") !== "true") return;
        form.style.display = "none";
        if (thankyou) thankyou.style.display = "block";
        setMessage("");
        form.removeAttribute("data-submitted");
      });
    }

    // ---- structured data ----------------------------------------------------
    try {
      var schema = {
        "@context": "https://schema.org",
        "@type": "Pharmacy",
        "name": branchName,
        "url": window.location.href,
        "telephone": phone || undefined,
        "email": email || undefined,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": branch.streetAddress,
          "addressLocality": branch.addressLocality,
          "postalCode": branch.postalCode,
          "addressRegion": branch.addressRegion,
          "addressCountry": branch.addressCountry || "GB"
        }
      };

      var ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.text = JSON.stringify(schema);
      document.head.appendChild(ld);
    } catch (e) {}
  }

  if (window.RBH_DATA) {
    initSwitch();
  } else {
    document.addEventListener("RBH_DataReady", initSwitch, { once: true });
  }
})();
