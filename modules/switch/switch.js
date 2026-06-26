(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Switch module — form wiring only.
  // The page content (headings, copy, FAQ, address) lives in the page HTML so
  // it is crawlable for SEO. This script just wires up the form: validation,
  // WhatsApp, callback mode, and the hidden-iframe submit to Google Apps Script.
  // Centralised here so the endpoint / behaviour can be changed for every site
  // from one place. Per-page values are read from data-* attributes.
  // ---------------------------------------------------------------------------
  var FORM_ACTION = "https://script.google.com/macros/s/AKfycbwoudCOSQWOgFVPmlFNhASBBlyB0TEB6Ba4uaUCB3fhPN7jMXnD_8T1oLN2Ua8ZevA/exec";
  var DEFAULT_WHATSAPP = "447521775631";
  var DESTINATION = "rishi@rbhealth.co.uk";

  function byId(id) { return document.getElementById(id); }

  function init() {
    var root = byId("rbhsw-root");
    var form = byId("switch-form");
    if (!form) return;

    // Per-page config (baked into the HTML, with safe fallbacks)
    var branchName = (root && root.getAttribute("data-branch")) || document.title || "our pharmacy";
    var WHATSAPP_E164 = (root && root.getAttribute("data-wa")) || DEFAULT_WHATSAPP;

    var msg = byId("switch-msg");
    var thankyou = byId("switch-thankyou");
    var iframe = byId("switch-post");
    var waBtn = byId("switch-wa");
    var waHeroBtn = byId("switch-wa-hero");
    var callbackBtn = byId("switch-callback-btn");

    form.setAttribute("action", FORM_ACTION);
    if (form.elements["website_url"]) form.elements["website_url"].value = window.location.href;
    if (form.elements["destination"] && !form.elements["destination"].value) {
      form.elements["destination"].value = DESTINATION;
    }
    if (form.elements["source"] && !form.elements["source"].value) {
      form.elements["source"].value = "Switch Page - " + branchName;
    }

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

    // Single source of truth for required fields per mode.
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
