(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Service module — enquiry/callback form wiring only.
  //
  // The page content (headings, clinical copy, eligibility, FAQ, address) lives
  // in the page HTML so it is crawlable for SEO. Bookings are handled by the
  // store's embedded Appointedd widget (its own script). This file only wires the
  // SECONDARY "request a callback / enquiry" action: validation, WhatsApp, and the
  // hidden-iframe submit to the shared Google Apps Script endpoint.
  //
  // Destination is the shared helpdesk inbox (NOT a personal address).
  // Per-page values are read from data-* attributes on #rbhsv-root.
  // ---------------------------------------------------------------------------
  var FORM_ACTION = "https://script.google.com/macros/s/AKfycbwoudCOSQWOgFVPmlFNhASBBlyB0TEB6Ba4uaUCB3fhPN7jMXnD_8T1oLN2Ua8ZevA/exec";
  var DEFAULT_WHATSAPP = "447521775631";
  var DESTINATION = "helpdesk@rbhealth.co.uk";

  function byId(id) { return document.getElementById(id); }

  function init() {
    var root = byId("rbhsv-root");
    var form = byId("svc-form");
    if (!form) return;

    // Per-page config (baked into the HTML, with safe fallbacks)
    var branchName = (root && root.getAttribute("data-branch")) || "our pharmacy";
    var serviceName = (root && root.getAttribute("data-service")) || "Pharmacy service";
    var WHATSAPP_E164 = (root && root.getAttribute("data-wa")) || DEFAULT_WHATSAPP;

    var msg = byId("svc-msg");
    var thankyou = byId("svc-thankyou");
    var iframe = byId("svc-post");
    var waBtn = byId("svc-wa");

    form.setAttribute("action", FORM_ACTION);
    if (form.elements["website_url"]) form.elements["website_url"].value = window.location.href;
    if (form.elements["destination"]) form.elements["destination"].value = DESTINATION;
    if (form.elements["source"] && !form.elements["source"].value) {
      form.elements["source"].value = "Service Enquiry - " + serviceName + " - " + branchName;
    }

    function clearErrors() {
      form.querySelectorAll("input, textarea").forEach(function (field) {
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
        mobile: val("mobile"),
        email: val("email"),
        message: val("message")
      };
    }

    // Required: name + a way to call back (mobile). Email validated only if given.
    function getMissing(d) {
      var missing = [];
      if (!d.first_name) missing.push("first_name");
      if (!d.last_name) missing.push("last_name");
      if (!d.mobile) missing.push("mobile");
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

    function buildWhatsAppText(d) {
      var lines = [
        "Service enquiry / callback request",
        "",
        "Pharmacy: " + branchName,
        "Service: " + serviceName,
        "",
        d.first_name ? "First name: " + d.first_name : null,
        d.last_name ? "Last name: " + d.last_name : null,
        d.mobile ? "Mobile: " + d.mobile : null,
        d.email ? "Email: " + d.email : null,
        d.message ? "Message: " + d.message : null,
        "",
        "Page: " + window.location.href
      ].filter(Boolean);

      return "https://wa.me/" + WHATSAPP_E164 + "?text=" + encodeURIComponent(lines.join("\n"));
    }

    function openWhatsApp(d) {
      var url = buildWhatsAppText(d || {});
      var w = window.open(url, "_blank", "noopener");
      if (!w) window.location.href = url;
    }

    if (waBtn) {
      waBtn.addEventListener("click", function (e) {
        e.preventDefault();
        clearErrors();
        var d = readForm();
        var missing = getMissing(d);
        if (missing.length) {
          markErrors(missing);
          setMessage("Please enter your name and phone number first.", "err");
          return;
        }
        openWhatsApp(d);
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
      var missing = getMissing(d);

      if (missing.length) {
        e.preventDefault();
        markErrors(missing);
        setMessage("Please enter your name and phone number.", "err");
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

  // ---------------------------------------------------------------------------
  // Pharmacy First extras — friendly self-refer banner (all PF pages) + explainer
  // video (overview pages only). Injected here so one module change covers every
  // PF page. Only runs on #rbhsv-root[data-service="Pharmacy First"]; leaves
  // Contraception and old non-module pages untouched. Idempotent.
  // ---------------------------------------------------------------------------
  var PF_VIDEO = "https://www.youtube.com/embed/ec-43uOnzPY";
  function injectPFExtras() {
    var root = byId("rbhsv-root");
    if (!root || root.getAttribute("data-service") !== "Pharmacy First") return;
    if (byId("rbh-selfrefer")) return;
    var wrap = root.querySelector(".wrap") || root;

    var banner = document.createElement("div");
    banner.id = "rbh-selfrefer";
    banner.style.cssText = "font-family:Poppins,Arial,sans-serif;margin:0 0 6px;";
    banner.innerHTML =
      "<div style='background:#009639;color:#fff;text-align:center;font-weight:600;" +
      "font-size:16px;line-height:1.45;padding:12px 18px;border-radius:12px;'>" +
      "&#10003; You can refer yourself &mdash; just book below or walk in. " +
      "No GP appointment or referral needed.</div>";
    wrap.insertBefore(banner, wrap.firstChild);

    // Explainer video on overview pages only (URL starts /pharmacy-first-...).
    if (location.pathname.indexOf("/pharmacy-first-") === 0) {
      var hero = wrap.querySelector(".hero");
      var vid = document.createElement("section");
      vid.style.cssText = "font-family:Poppins,Arial,sans-serif;text-align:center;padding:34px 16px 4px;";
      vid.innerHTML =
        "<h2 style='font-size:24px;font-weight:800;color:#0b2a4a;margin:0 0 6px;'>" +
        "New to Pharmacy First?</h2>" +
        "<p style='font-size:15px;color:#4b5563;margin:0 auto 18px;max-width:520px;'>" +
        "Watch how the free NHS service works &mdash; no GP appointment or referral needed.</p>" +
        "<div style='max-width:620px;margin:0 auto;'>" +
        "<div style='position:relative;padding-bottom:56.25%;height:0;border-radius:14px;" +
        "overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,.12);'>" +
        "<iframe src='" + PF_VIDEO + "' title='Pharmacy First' loading='lazy' " +
        "style='position:absolute;top:0;left:0;width:100%;height:100%;border:0;' " +
        "allow='accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;" +
        "picture-in-picture;web-share' allowfullscreen></iframe></div></div>";
      if (hero && hero.parentNode) hero.parentNode.insertBefore(vid, hero.nextSibling);
      else wrap.appendChild(vid);
    }
  }

  function boot() {
    init();
    try { injectPFExtras(); } catch (e) { /* never block the form on a banner error */ }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
