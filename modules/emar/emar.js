(function(){
  "use strict";

  function initRBHEMAR(){
    var root = document.getElementById("rbhem-root");
    if (!root) return;

    var data = (window.RBH_DATA && Array.isArray(window.RBH_DATA.branches))
      ? window.RBH_DATA
      : (window.RBH_FALLBACK || { branches: [], brandGroups: {} });

    var BR = {};
    (data.branches || []).forEach(function(b){ if (b && b.id) BR[b.id] = b; });
    var GR = data.brandGroups || {};

    function byGroup(g){ return (GR[g] || []).map(function(k){ return BR[k]; }).filter(Boolean); }

    function estateAreas(limit){
      var areas = Array.from(new Set(
        Object.keys(BR).flatMap(function(k){ return BR[k].serviceAreaList || []; })
      )).filter(Boolean);
      return typeof limit === "number" ? areas.slice(0, limit) : areas;
    }

    function pickLocations(){
      var forced = (window.RBH_EMAR_OVERRIDE || "").toLowerCase().trim();
      if (forced) {
        if (BR[forced]) return [BR[forced]];
        if (GR[forced]) return byGroup(forced);
      }

      var host = (location.hostname || "").toLowerCase();
      var path = (location.pathname || "").toLowerCase();
      var surface = host + " " + path;

      // Explicit host routing
      if (host.includes("rbhealth.co.uk")) {
        var rbh = byGroup("rbhealth");
        if (rbh.length) return rbh;
      }

      if (host.includes("clearchemist.co.uk") && BR.clearchemist_aintree) {
        return [BR.clearchemist_aintree];
      }

      // Multi-site group matching
      var groupKeys = Object.keys(GR).filter(function(k){ return k !== "rbhealth"; });
      for (var i=0; i<groupKeys.length; i++){
        var g = groupKeys[i];
        if (surface.match(new RegExp(g.replace(/s$/,''), "i")) || surface.includes(g)) {
          var locs = byGroup(g);
          if (locs.length) return locs;
        }
      }

      // Common spellings
      if (/scorah/.test(surface) && GR.scorahs) return byGroup("scorahs");
      if (/mccann/.test(surface) && GR.mccanns) return byGroup("mccanns");
      if (/fishlock/.test(surface) && GR.fishlocks) return byGroup("fishlocks");

      // Best keyword match
      var best = null, bestScore = 0;
      Object.keys(BR).forEach(function(k){
        var b = BR[k];
        var kws = (b.keywords || [])
          .concat([b.addressLocality || "", b.postalCode || "", b.brandLabel || "", b.branchName || ""])
          .map(function(x){ return String(x).toLowerCase(); });

        var score = 0;
        kws.forEach(function(kw){ if (kw && surface.includes(kw)) score++; });

        if (score > bestScore) {
          best = b;
          bestScore = score;
        }
      });

      if (best) return [best];

      var first = Object.keys(BR)[0];
      return first ? [BR[first]] : [];
    }

    var C = {
      locations: pickLocations(),
      estateAreas: estateAreas,
      primaryPhone: "+44 151 521 8879",
      primaryEmail: "info@rbhealth.co.uk"
    };

    var L = Array.isArray(C.locations) ? C.locations : [];
    if (!L.length) return;

    // Hero town
    var towns = Array.from(new Set(L.map(function(x){ return x.addressLocality; }))).filter(Boolean);
    var heroTown = towns.length === 1 ? towns[0] : towns.slice(0, 2).join(" & ");

    var townEl = document.getElementById("rbhem-hero-town");
    if (townEl) townEl.textContent = heroTown;

    var subEl = document.getElementById("rbhem-hero-sub");
    if (subEl) {
      var isRBH = (location.hostname || "").toLowerCase().includes("rbhealth.co.uk");
      var localAreas = Array.from(new Set(L.flatMap(function(x){ return x.serviceAreaList || []; }))).slice(0, 8);
      var allAreas = C.estateAreas(18);

      if (isRBH && allAreas.length) {
        subEl.innerHTML = "Practical, unbiased guidance from pharmacists with 10+ years' eMAR experience. We support care homes locally from <strong>"
          + heroTown
          + "</strong> and across our wider pharmacy estate, including <strong>"
          + allAreas.join(", ")
          + "</strong>.";
      } else {
        subEl.innerHTML = "Practical, unbiased guidance from pharmacists with 10+ years' eMAR experience. Supporting care homes in and around <strong>"
          + heroTown
          + (localAreas.length ? (" (" + localAreas.join(", ") + ")") : "")
          + "</strong>.";
      }
    }

    // Branch strip
    var strip = document.getElementById("rbhem-branch-strip");
    if (strip) {
      strip.innerHTML = L.map(function(x){
        var addr = [x.streetAddress, x.addressLocality, x.postalCode].filter(Boolean).join(", ");
        var areas = (x.serviceAreaList || []).join(", ");
        return '<div class="rbhem-branch"><h3>' + (x.branchName || "Pharmacy") + '</h3><p>' + addr + '</p>'
          + (areas ? '<p class="rbhem-areas"><strong>Serving:</strong> ' + areas + '</p>' : "")
          + '</div>';
      }).join("");
    }

    // Optional estate section on rbhealth.co.uk
    var networkSlot = document.getElementById("rbhem-network-slot");
    if (networkSlot) {
      var isMain = (location.hostname || "").toLowerCase().includes("rbhealth.co.uk");
      if (isMain) {
        var a = C.estateAreas(24);
        networkSlot.innerHTML =
          '<div class="rbhem-card rbhem-pad" style="margin-top:16px;">' +
            '<div class="rbhem-badge">Our pharmacy network</div>' +
            '<h2 class="rbhem-h2">Supporting care homes across the North West</h2>' +
            '<p style="margin:0;color:#1f2937 !important;">Alongside our head office team in Aintree, RB Healthcare supports care homes through our wider pharmacy estate across <strong>'
            + (a.length ? a.join(", ") : "Liverpool, Sefton, Greater Manchester and Cheshire") +
            '</strong>.</p>' +
          '</div>';
      } else {
        networkSlot.innerHTML = "";
      }
    }

    // Optional placeholder hooks for future injected blocks
    var extraTop = document.getElementById("rbhem-extra-top");
    if (extraTop && !extraTop.innerHTML.trim()) extraTop.innerHTML = "";
    var extraBottom = document.getElementById("rbhem-extra-bottom");
    if (extraBottom && !extraBottom.innerHTML.trim()) extraBottom.innerHTML = "";

    // JSON-LD
    try {
      var graph = L.map(function(x){
        return {
          "@type":"Pharmacy",
          "@id": (x.branchName || "").toLowerCase().replace(/\s+/g, "-") + "#org",
          "name": x.branchName,
          "address":{
            "@type":"PostalAddress",
            "streetAddress": x.streetAddress,
            "addressLocality": x.addressLocality,
            "postalCode": x.postalCode,
            "addressRegion": x.addressRegion,
            "addressCountry": x.addressCountry || "GB"
          },
          "areaServed": (x.serviceAreaList || []).map(function(a){
            return { "@type":"AdministrativeArea", "name":a };
          }),
          "url": window.location.href,
          "telephone": C.primaryPhone || undefined,
          "email": C.primaryEmail || undefined
        };
      });

      var ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.text = JSON.stringify({ "@context":"https://schema.org", "@graph": graph });
      document.head.appendChild(ld);
    } catch(e){}

    // Form logic
    var WHATSAPP_E164 = "447988911911";
    var EMAIL_TO = "rishi@rbhealth.co.uk";
    var form = document.getElementById("rbhem-form");
    if (!form) return;

    var msg = document.getElementById("rbhem-msg");
    var wa = document.getElementById("rbhem-wa");
    var mailWrap = document.getElementById("rbhem-mailto-wrap");
    var mailLink = document.getElementById("rbhem-mailto-link");
    var iframe = document.getElementById("rbhem-post");
    var thankyou = document.getElementById("rbhem-thankyou");

    if (form.elements.website_url) form.elements.website_url.value = window.location.href;

    if (wa) {
      wa.addEventListener("click", function(e){
        e.preventDefault();
        var p = readForm();
        window.open(buildWhatsApp(p), "_blank", "noopener");
      });
    }

    function clearErrors(){
      form.querySelectorAll(".rbhem-input.rbhem-error").forEach(function(i){
        i.classList.remove("rbhem-error");
      });
    }

    function markErrors(fields){
      fields.forEach(function(n){
        var f = form.elements[n];
        if (f) f.classList.add("rbhem-error");
      });
    }

    function setErr(t){
      if (msg) {
        msg.textContent = t;
        msg.className = "rbhem-msg err";
      }
      if (mailWrap) mailWrap.style.display = "block";
    }

    function setInfo(t){
      if (msg) {
        msg.textContent = t;
        msg.className = "rbhem-msg";
      }
    }

    form.addEventListener("submit", function(e){
      clearErrors();

      if (form.elements.company.value.trim() !== "" || form.elements.website.value.trim() !== "") {
        e.preventDefault();
        return;
      }

      var required = ["name", "email"];
      var missing = [];

      required.forEach(function(f){
        if (!form.elements[f].value.trim()) missing.push(f);
      });

      var email = form.elements.email.value.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) missing.push("email");

      if (missing.length) {
        e.preventDefault();
        markErrors(missing);
        setErr("Please complete the required fields (marked with *)");
        return;
      }

      form.elements.pretty.value = prettyUK(form.elements.date.value, form.elements.time.value);
      setInfo("Submitting...");
      form.classList.add("rbhem-working");

      var p = readForm();
      if (mailLink) mailLink.href = buildMailto(p);
    });

    if (iframe) {
      iframe.addEventListener("load", function(){
        if (!form.classList.contains("rbhem-working")) return;
        form.style.display = "none";
        if (thankyou) thankyou.style.display = "block";
      });
    }

    function readForm(){
      var f = form.elements;
      var pretty = prettyUK(f.date.value, f.time.value);
      return {
        name: f.name.value.trim(),
        email: f.email.value.trim(),
        phone: f.phone.value.trim(),
        org: f.org.value.trim(),
        topic: f.topic.value,
        notes: f.notes.value.trim(),
        pretty: pretty
      };
    }

    function buildWhatsApp(p){
      var lines = [
        "New enquiry via website",
        "",
        "Topic: " + p.topic,
        "Preferred: " + p.pretty,
        p.notes ? ("Notes: " + p.notes) : null,
        "",
        "From: " + p.name,
        "Email: " + p.email,
        p.phone ? ("Phone: " + p.phone) : null,
        p.org ? ("Organisation: " + p.org) : null
      ].filter(Boolean).join("\n");

      return "https://wa.me/" + WHATSAPP_E164 + "?text=" + encodeURIComponent(lines);
    }

    function buildMailto(p){
      var subject = "eMAR chat request " + p.pretty;
      var body = [
        "Please arrange a quick " + p.topic + " chat.",
        "",
        "Preferred: " + p.pretty,
        p.notes ? ("Notes: " + p.notes) : null,
        "",
        "Name: " + p.name,
        "Email: " + p.email,
        p.phone ? ("Phone: " + p.phone) : null,
        p.org ? ("Organisation: " + p.org) : null,
        "",
        "Source: RBH website form"
      ].filter(Boolean).join("\n");

      return "mailto:" + encodeURIComponent(EMAIL_TO)
        + "?subject=" + encodeURIComponent(subject)
        + "&body=" + encodeURIComponent(body);
    }

    function prettyUK(dateStr, hhmm){
      if (!dateStr || !hhmm) return (dateStr || "") + (dateStr && hhmm ? " " : "") + (hhmm || "");
      var p = dateStr.split("-").map(Number);
      var Y = p[0], M = p[1], D = p[2];
      var dt = new Date(Y, M - 1, D);
      var mon = dt.toLocaleString("en-GB", { month: "short" });
      return String(D).padStart(2, "0") + " " + mon + " " + Y + ", " + hhmm;
    }
  }

  if (window.RBH_DATA) {
    initRBHEMAR();
  } else {
    document.addEventListener("RBH_DataReady", initRBHEMAR, { once: true });
  }
})();
