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
    var wrap = root.querySelector(".wrap") || root;

    // 1) Friendly self-refer banner at the very top (all PF pages).
    if (!byId("rbh-selfrefer")) {
      var banner = document.createElement("div");
      banner.id = "rbh-selfrefer";
      banner.style.cssText = "font-family:Poppins,Arial,sans-serif;margin:0 0 6px;";
      banner.innerHTML =
        "<div style='background:#009639;color:#fff;text-align:center;font-weight:600;" +
        "font-size:16px;line-height:1.45;padding:12px 18px;border-radius:12px;'>" +
        "&#10003; You can refer yourself &mdash; just book below or walk in. " +
        "No GP appointment or referral needed.</div>";
      wrap.insertBefore(banner, wrap.firstChild);
    }

    // 2) Make the "Book or call in" step actionable: book -> #book, call -> tel:.
    var telEl = root.querySelector("a[href^='tel:']");
    var telHref = telEl ? telEl.getAttribute("href") : null;
    var stepPs = root.querySelectorAll(".step p");
    for (var i = 0; i < stepPs.length; i++) {
      var p = stepPs[i];
      if (p.getAttribute("data-rbh-linked")) continue;
      var h = p.innerHTML;
      if (/Book an appointment/i.test(h)) {
        h = h.replace(/Book an appointment/i,
          "<a href='#book' style='color:#0b7bc1;font-weight:700;'>Book an appointment</a>");
        if (telHref) h = h.replace(/\bcall us\b/i,
          "<a href='" + telHref + "' style='color:#0b7bc1;font-weight:700;'>call us</a>");
        p.innerHTML = h;
        p.setAttribute("data-rbh-linked", "1");
      }
    }

    // 3) Explainer video as a distinct tile, placed UNDER "How Pharmacy First works"
    //    (overview pages only). Mobile-friendly: fluid card + responsive 16:9 embed.
    if (location.pathname.indexOf("/pharmacy-first-") === 0 && !byId("rbh-video")) {
      var stepsEl = wrap.querySelector(".steps");
      var stepsSection = stepsEl && stepsEl.closest ? stepsEl.closest("section") : null;
      var vid = document.createElement("section");
      vid.id = "rbh-video";
      vid.className = "section"; // match the module's content width (aligns with the steps row)
      vid.style.cssText = "font-family:Poppins,Arial,sans-serif;";
      vid.innerHTML =
        "<div style='background:#eaf6ff;border:1px solid #cfe8fb;" +
        "border-radius:18px;padding:28px 22px;text-align:center;box-sizing:border-box;'>" +
        "<span style='display:inline-block;background:#009639;color:#fff;font-size:12px;" +
        "font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 13px;" +
        "border-radius:999px;margin-bottom:12px;'>&#9654; Watch</span>" +
        "<h2 style='font-size:22px;font-weight:800;color:#0b2a4a;margin:0 0 6px;'>" +
        "New to Pharmacy First?</h2>" +
        "<p style='font-size:15px;color:#4b5563;margin:0 auto 18px;max-width:520px;'>" +
        "See how the free NHS service works &mdash; no GP appointment or referral needed.</p>" +
        "<div style='max-width:600px;margin:0 auto;'>" +
        "<div style='position:relative;padding-bottom:56.25%;height:0;border-radius:14px;" +
        "overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,.12);'>" +
        "<iframe src='" + PF_VIDEO + "' title='Pharmacy First' loading='lazy' " +
        "style='position:absolute;top:0;left:0;width:100%;height:100%;border:0;' " +
        "allow='accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;" +
        "picture-in-picture;web-share' allowfullscreen></iframe></div></div></div>";
      if (stepsSection && stepsSection.parentNode) {
        stepsSection.parentNode.insertBefore(vid, stepsSection.nextSibling);
      } else {
        wrap.appendChild(vid);
      }
    }

    // 4) "Prefer to walk in?" helper card in the hero's left column (overview pages
    //    only). Fills the blank space left by the tall 7-condition booking widget and
    //    reinforces the self-refer / walk-in message. Single-condition pages have a
    //    short booking list so the columns balance -> no card needed there.
    if (location.pathname.indexOf("/pharmacy-first-") === 0 && !byId("rbh-walkin")) {
      var stack = wrap.querySelector(".hero-actions-stack");
      if (stack) {
        var phoneCall = telHref
          ? "Call <a href='" + telHref + "' style='color:#fff;font-weight:700;" +
            "text-decoration:underline;'>" + (telEl ? telEl.textContent.replace(/^\s*call\s*/i, "").trim() : "us") + "</a>"
          : "call us";
        var card = document.createElement("div");
        card.id = "rbh-walkin";
        card.style.cssText = "font-family:Poppins,Arial,sans-serif;" +
          "background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);" +
          "border-radius:18px;padding:18px 20px;box-sizing:border-box;";
        card.innerHTML =
          "<div style='display:flex;align-items:center;gap:9px;margin-bottom:8px;'>" +
          "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='#7ee0a6' " +
          "stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>" +
          "<path d='M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0'/><path d='M7 21l3 -4'/>" +
          "<path d='M16 21l-2 -4l-3 -3l1 -6'/><path d='M6 12l2 -3l4 -1l3 3l3 1'/></svg>" +
          "<span style='font-size:17px;font-weight:700;color:#fff;'>Prefer to walk in?</span></div>" +
          "<p style='font-size:14px;line-height:1.55;margin:0 0 10px;color:#dbe8ff;'>" +
          "Just pop in and ask about Pharmacy First &mdash; no appointment or GP referral needed.</p>" +
          "<p style='font-size:14px;line-height:1.55;margin:0;color:#dbe8ff;'>" +
          "Not sure which of the conditions fits? " + phoneCall +
          " and we&rsquo;ll help you book the right one.</p>";
        stack.appendChild(card);
      }
    }

    // 5) Re-link stale "Page coming soon" condition tiles (overview pages only).
    //    Tiles are static HTML baked into the page; some were pasted while a
    //    condition was still ready:false, so they show a dead "Page coming soon"
    //    label even though that condition page is now live. Convert those to real
    //    links, deriving the URL the same way the generator does:
    //    <conditionSlug>-treatment-<brand>-<town>.html (brand-town from this path).
    if (location.pathname.indexOf("/pharmacy-first-") === 0) {
      var mm = location.pathname.match(/\/pharmacy-first-(.+?)\.html/);
      var brandTown = mm ? mm[1] : null;
      var SLUGS = {
        "uti": "uti", "sore throat": "sore-throat", "sinusitis": "sinusitis",
        "earache": "earache", "impetigo": "impetigo", "shingles": "shingles",
        "infected insect bite": "insect-bite", "insect bite": "insect-bite"
      };
      if (brandTown) {
        var tiles = wrap.querySelectorAll("div.condition-card");
        for (var k = 0; k < tiles.length; k++) {
          var tile = tiles[k];
          if (tile.getAttribute("data-rbh-linked")) continue;
          if (!/Page coming soon/i.test(tile.textContent)) continue;
          var strong = tile.querySelector("strong");
          var cslug = strong ? SLUGS[strong.textContent.trim().toLowerCase()] : null;
          if (!cslug) continue;
          var a = document.createElement("a");
          a.className = "condition-card";
          a.setAttribute("href", cslug + "-treatment-" + brandTown + ".html");
          a.setAttribute("data-rbh-linked", "1");
          a.innerHTML = tile.innerHTML.replace(
            /<em[^>]*>\s*Page coming soon\s*<\/em>/i, "<em>Learn more</em>");
          tile.parentNode.replaceChild(a, tile);
        }
      }
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
