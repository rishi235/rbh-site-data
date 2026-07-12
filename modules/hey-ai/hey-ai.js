(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // hey-ai module — makes each pharmacy site legible to AI assistants and
  // search engines (GEO). Two jobs:
  //   1. Inject rich schema.org JSON-LD (Pharmacy) into <head> — always runs.
  //   2. Render a visible "Pharmacy information" facts card into #rbhai-root
  //      (optional — only if the element exists on the page).
  // Data comes from branches.json via core/site-data.js (RBH_DataReady), same
  // pattern as the eMAR module. Branch selection:
  //   window.RBH_HEYAI_OVERRIDE → hostMap[hostname] → keyword match → head office.
  // Fields gphcNumber / yearEstablished / extraServices are optional per branch;
  // rows are skipped when absent so partial data never breaks the page.
  // ---------------------------------------------------------------------------

  var GPHC_REGISTER_URL = "https://www.pharmacyregulation.org/registers/pharmacy";

  function initRBHHeyAI() {
    var data = (window.RBH_DATA && Array.isArray(window.RBH_DATA.branches))
      ? window.RBH_DATA
      : (window.RBH_FALLBACK || { branches: [], brandGroups: {}, hostMap: {} });

    var BR = {};
    (data.branches || []).forEach(function (b) {
      if (b && b.id) BR[b.id] = b;
    });

    var GR = data.brandGroups || {};
    var HM = data.hostMap || {};

    function byGroup(g) {
      return (GR[g] || []).map(function (k) { return BR[k]; }).filter(Boolean);
    }

    function byIds(ids) {
      return (ids || []).map(function (id) { return BR[id]; }).filter(Boolean);
    }

    function pickLocations() {
      var forced = (window.RBH_HEYAI_OVERRIDE || "").toLowerCase().trim();
      if (forced) {
        if (BR[forced]) return [BR[forced]];
        if (GR[forced]) return byGroup(forced);
      }

      var host = (location.hostname || "").toLowerCase();
      var path = (location.pathname || "").toLowerCase();
      var surface = host + " " + path;

      if (HM[host]) {
        var mapped = byIds(HM[host]);
        if (mapped.length) return mapped;
      }

      var groupKeys = Object.keys(GR).filter(function (k) { return k !== "rbhealth"; });
      for (var i = 0; i < groupKeys.length; i++) {
        var g = groupKeys[i];
        if (surface.match(new RegExp(g.replace(/s$/, ""), "i")) || surface.includes(g)) {
          var locs = byGroup(g);
          if (locs.length) return locs;
        }
      }

      if (/scorah/.test(surface) && GR.scorahs) return byGroup("scorahs");
      if (/mccann/.test(surface) && GR.mccanns) return byGroup("mccanns");
      if (/fishlock/.test(surface) && GR.fishlocks) return byGroup("fishlocks");

      var best = null, bestScore = 0;
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

      if (best) return [best];

      if (BR.rbh_head_office_aintree) return [BR.rbh_head_office_aintree];
      var first = Object.keys(BR)[0];
      return first ? [BR[first]] : [];
    }

    function servicesFor(b) {
      return (data.standardServices || []).concat(b.extraServices || []);
    }

    var L = pickLocations();
    if (!L.length) return;

    // --- 1. JSON-LD ----------------------------------------------------------
    try {
      var graph = L.map(function (x) {
        var node = {
          "@type": "Pharmacy",
          "@id": window.location.origin + "/#" + (x.id || "pharmacy"),
          "name": x.branchName,
          "brand": x.brandLabel ? { "@type": "Brand", "name": x.brandLabel } : undefined,
          "parentOrganization": { "@type": "Organization", "name": "RB Healthcare Ltd" },
          "url": window.location.href,
          "telephone": x.phone || undefined,
          "email": x.email || undefined,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": x.streetAddress,
            "addressLocality": x.addressLocality,
            "postalCode": x.postalCode,
            "addressRegion": x.addressRegion,
            "addressCountry": x.addressCountry || "GB"
          },
          "areaServed": (x.serviceAreaList || []).map(function (a) {
            return { "@type": "AdministrativeArea", "name": a };
          }),
          "foundingDate": x.yearEstablished ? String(x.yearEstablished) : undefined,
          "identifier": x.gphcNumber ? {
            "@type": "PropertyValue",
            "propertyID": "GPhC Premises Registration Number",
            "value": String(x.gphcNumber)
          } : undefined,
          "makesOffer": servicesFor(x).map(function (s) {
            return { "@type": "Offer", "itemOffered": { "@type": "Service", "name": s } };
          })
        };

        Object.keys(node).forEach(function (k) {
          if (node[k] === undefined) delete node[k];
        });
        return node;
      });

      var ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.text = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
      document.head.appendChild(ld);
    } catch (e) {}

    // --- 2. Visible facts card (optional) ------------------------------------
    var root = document.getElementById("rbhai-root");
    if (!root) return;

    function esc(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    root.innerHTML = L.map(function (x) {
      var addr = [x.streetAddress, x.addressLocality, x.postalCode].filter(Boolean).join(", ");
      var areas = (x.serviceAreaList || []).join(", ");
      var svc = servicesFor(x);

      var rows = [
        ["Address", esc(addr)],
        x.phone ? ["Phone", '<a href="tel:' + esc(x.phone.replace(/\s+/g, "")) + '">' + esc(x.phone) + "</a>"] : null,
        x.email ? ["Email", '<a href="mailto:' + esc(x.email) + '">' + esc(x.email) + "</a>"] : null,
        x.gphcNumber ? ["GPhC premises registration", '<a href="' + GPHC_REGISTER_URL + '" rel="noopener" target="_blank">' + esc(x.gphcNumber) + "</a>"] : null,
        x.yearEstablished ? ["Established", esc(x.yearEstablished)] : null,
        ["Part of", "RB Healthcare Ltd"],
        areas ? ["Areas served", esc(areas)] : null
      ].filter(Boolean);

      return (
        '<section class="rbhai-card">' +
        '<h2 class="rbhai-h2">' + esc(x.branchName) + " — pharmacy information</h2>" +
        '<dl class="rbhai-facts">' +
        rows.map(function (r) {
          return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>";
        }).join("") +
        "</dl>" +
        (svc.length
          ? '<h3 class="rbhai-h3">Services</h3><ul class="rbhai-services">' +
            svc.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") +
            "</ul>"
          : "") +
        (x.googleReviewUrl
          ? '<p class="rbhai-review"><a href="' + esc(x.googleReviewUrl) + '" rel="noopener" target="_blank">Leave us a Google review</a></p>'
          : "") +
        "</section>"
      );
    }).join("");
  }

  if (window.RBH_DATA) {
    initRBHHeyAI();
  } else {
    document.addEventListener("RBH_DataReady", initRBHHeyAI, { once: true });
  }
})();
