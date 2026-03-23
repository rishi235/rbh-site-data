(function () {
  "use strict";

  var root = document.getElementById("rbhsw-root");
  if (!root) return;

  var FORM_ACTION = "https://script.google.com/macros/s/AKfycbwoudCOSQWOgFVPmlFNhASBBlyB0TEB6Ba4uaUCB3fhPN7jMXnD_8T1oLN2Ua8ZevA/exec";
  var WHATSAPP_E164 = "447521775631";

  function initSwitch() {
    var data = (window.RBH_DATA && Array.isArray(window.RBH_DATA.branches))
      ? window.RBH_DATA
      : (window.RBH_FALLBACK || { branches: [], brandGroups: {}, hostMap: {} });

    var BR = {};
    (data.branches || []).forEach(function (b) {
      if (b && b.id) BR[b.id] = b;
    });

    var HM = data.hostMap || {};

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

    function setText(id, value) {
      var el = document.getElementById(id);
      if (el) el.textContent = value;
    }

    function setHref(id, value) {
      var el = document.getElementById(id);
      if (el) el.setAttribute("href", value);
    }

    function hideEl(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = "none";
    }

    setText("sw-pill-locality", "Your local independent pharmacy in " + locality);
    setText("sw-hero-branch", branchName);
    setText("sw-contact-branch", branchName);
    setText("sw-contact-address", fullAddress || "Address available on request");

    setHref("sw-website-link", website);
    setText("sw-website-link", (location.hostname || "").replace(/^www\./, ""));

    if (phone) {
      setHref("sw-phone-link", "tel:" + phone.replace(/\s+/g, ""));
      setText("sw-phone-link", phone);

      var callBtn = document.getElementById("sw-call-btn");
      if (callBtn) {
        callBtn.href = "tel:" + phone.replace(/\s+/g, "");
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

    var map = document.getElementById("sw-map");
    if (map && fullAddress) {
      map.src = "https://www.google.com/maps?q=" + encodeURIComponent(fullAddress) + "&output=embed";
    }

    var form = document.getElementById("switch-form");
    var msg = document.getElementById("switch-msg");
    var thankyou = document.getElementById("switch-thankyou");
    var iframe = document.getElementById("switch-post");
    var waBtn = document.getElementById("switch-wa");
    var waHeroBtn = document.getElementById("switch-wa-hero");
    var callbackBtn = document.getElementById("switch-callback-btn");

    if (!form) return;

    form.setAttribute("action", FORM_ACTION);
    if (form.elements["website_url"]) form.elements["website_url"].value = window.location.href;
    if (form.elements["destination"]) form.elements["destination"].value = "rishi@rbhealth.co.uk";
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
      return {
        first_name: (form.elements["first_name"] ? form.elements["first_name"].value : "").trim(),
        last_name: (form.elements["last_name"] ? form.elements["last_name"].value : "").trim(),
        dob: (form.elements["dob"] ? form.elements["dob"].value : "").trim(),
        mobile: (form.elements["mobile"] ? form.elements["mobile"].value : "").trim(),
        email: (form.elements["email"] ? form.elements["email"].value : "").trim()
      };
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
      var titleEl = document.getElementById("switch-form-title");
      var subEl = document.getElementById("switch-form-sub");
      var submitText = document.getElementById("switch-submit-text");
      var modeLink = document.getElementById("switch-form-mode-link");
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
        var missing = [];
        var isCallback = form.getAttribute("data-mode") === "callback";

        if (isCallback) {
          if (!d.first_name) missing.push("first_name");
          if (!d.last_name) missing.push("last_name");
          if (!d.mobile) missing.push("mobile");
          if (d.email && !validEmail(d.email)) missing.push("email");
        } else {
          if (!d.first_name) missing.push("first_name");
          if (!d.last_name) missing.push("last_name");
          if (!d.dob) missing.push("dob");
          if (d.email && !validEmail(d.email)) missing.push("email");
        }

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
        var card = document.getElementById("switch-form-card");
        if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    var switchModeLink = document.getElementById("switch-switch-mode");
    if (switchModeLink) {
      switchModeLink.addEventListener("click", function (e) {
        e.preventDefault();
        setCallbackMode(false);
      });
    }

    form.addEventListener("submit", function (e) {
      clearErrors();
      setMessage("");

      var hp = form.elements["company"];
      if (hp && (hp.value || "").trim() !== "") {
        e.preventDefault();
        return;
      }

      var d = readForm();
      var missing = [];
      var isCallback = form.getAttribute("data-mode") === "callback";

      if (isCallback) {
        if (!d.first_name) missing.push("first_name");
        if (!d.last_name) missing.push("last_name");
        if (!d.mobile) missing.push("mobile");
        if (d.email && !validEmail(d.email)) missing.push("email");
      } else {
        if (!d.first_name) missing.push("first_name");
        if (!d.last_name) missing.push("last_name");
        if (!d.dob) missing.push("dob");
        if (d.email && !validEmail(d.email)) missing.push("email");
      }

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
