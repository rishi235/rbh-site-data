(function () {
  "use strict";

  var FORM_ACTION = "https://script.google.com/macros/s/AKfycbwoudCOSQWOgFVPmlFNhASBBlyB0TEB6Ba4uaUCB3fhPN7jMXnD_8T1oLN2Ua8ZevA/exec";
  var WHATSAPP_E164 = "447521775631";

  var root = document.getElementById("rbhsw-root");
  if (!root) return;

  var form = document.getElementById("smartts-form");
  var msg = document.getElementById("smartts-msg");
  var thankyou = document.getElementById("smartts-thankyou");
  var iframe = document.getElementById("smartts-post");
  var waBtn = document.getElementById("smartts-wa");
  var waHeroBtn = document.getElementById("smartts-wa-hero");
  var callbackBtn = document.getElementById("smartts-callback-btn");

  if (!form) return;

  if (form.elements["website_url"]) form.elements["website_url"].value = window.location.href;
  form.setAttribute("action", FORM_ACTION);

  function clearErrors() {
    var fields = form.querySelectorAll("input");
    fields.forEach(function (field) {
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
      isCallback ? "Callback request from Smartts" : "New Smartts switch request",
      "",
      d.first_name ? "First name: " + d.first_name : null,
      d.last_name ? "Last name: " + d.last_name : null,
      d.dob ? "DOB: " + d.dob : null,
      d.mobile ? "Mobile: " + d.mobile : null,
      d.email ? "Email: " + d.email : null,
      "",
      "Source: " + (isCallback ? "Callback - Smartts switch page" : "Smartts switch landing page"),
      "Page: " + window.location.href
    ].filter(Boolean);

    return "https://wa.me/" + WHATSAPP_E164 + "?text=" + encodeURIComponent(lines.join("\n"));
  }

  function openWhatsApp(d, isCallback) {
    var url = buildWhatsAppText(d || {}, isCallback);
    var w = window.open(url, "_blank", "noopener");
    if (!w) window.location.href = url;
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

  function setCallbackMode(on) {
    var titleEl = document.getElementById("smartts-form-title");
    var subEl = document.getElementById("smartts-form-sub");
    var submitText = document.getElementById("smartts-submit-text");
    var modeLink = document.getElementById("smartts-form-mode-link");
    var mobileLabel = form.querySelector(".mobile-label-text");
    var dobInput = form.elements["dob"];

    if (on) {
      form.classList.add("form-mode-callback");
      form.setAttribute("data-mode", "callback");
      if (form.elements["source"]) form.elements["source"].value = "Callback request - Smartts Switch Page";
      if (dobInput) dobInput.removeAttribute("required");
      if (form.elements["mobile"]) form.elements["mobile"].setAttribute("required", "required");
      if (mobileLabel) mobileLabel.textContent = "Mobile *";
      if (titleEl) titleEl.textContent = "Request a callback";
      if (subEl) subEl.textContent = "We'll call you back. Just your name and phone number needed.";
      if (submitText) submitText.textContent = "Request callback";
      if (modeLink) modeLink.style.display = "block";

      setTimeout(function () {
        if (form.elements["mobile"]) form.elements["mobile"].focus();
      }, 100);
    } else {
      form.classList.remove("form-mode-callback");
      form.removeAttribute("data-mode");
      if (form.elements["source"]) form.elements["source"].value = "Smartts Switch Page";
      if (dobInput) dobInput.setAttribute("required", "required");
      if (form.elements["mobile"]) form.elements["mobile"].removeAttribute("required");
      if (mobileLabel) mobileLabel.textContent = "Mobile (optional)";
      if (titleEl) titleEl.textContent = "Start your switch";
      if (subEl) subEl.textContent = "This takes about 30 seconds. Our team will review the request and guide the next step.";
      if (submitText) submitText.textContent = "Submit switch request";
      if (modeLink) modeLink.style.display = "none";
    }
  }

  if (callbackBtn) {
    callbackBtn.addEventListener("click", function (e) {
      e.preventDefault();
      setCallbackMode(true);
      var card = document.getElementById("smartts-form-card");
      if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  var switchModeLink = document.getElementById("smartts-switch-mode");
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
      "name": "Smartts Chemist",
      "url": window.location.href,
      "telephone": "0151 922 4984",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "42 Fernhill Road",
        "addressLocality": "Bootle",
        "postalCode": "L20 9HH",
        "addressCountry": "GB"
      }
    };

    var ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify(schema);
    document.head.appendChild(ld);
  } catch (e) {}
})();
