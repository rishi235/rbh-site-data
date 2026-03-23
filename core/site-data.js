(function () {
  "use strict";

  // Bump this value whenever you want to force-refresh @main caches
  var DATA_VERSION = "2026-03-23-1";

  // Keep @main while building; later switch to @v1.0.0 (or newer tag)
  var DATA_URL =
    "https://cdn.jsdelivr.net/gh/rishi235/rbh-site-data@main/branches.json?v=" +
    encodeURIComponent(DATA_VERSION);

  var TIMEOUT_MS = 10000;

  // Conservative fallback if remote fetch fails
  var FALLBACK = {
    lastUpdated: "2026-03-23",
    brandGroups: {
      rbhealth: ["rbh_head_office_aintree"]
    },
    branches: [
      {
        id: "rbh_head_office_aintree",
        brandKey: "rbhealth",
        brandLabel: "RB Healthcare Ltd",
        branchName: "RB Healthcare Ltd Head Office",
        streetAddress: "Unit 20 Brookfield Trade Centre, Brookfield Drive, Aintree",
        addressLocality: "Liverpool",
        postalCode: "L9 7AS",
        addressRegion: "Merseyside",
        addressCountry: "GB",
        keywords: [
          "rbhealth",
          "rb-health",
          "rb healthcare",
          "head office",
          "head-office",
          "aintree",
          "brookfield",
          "l9 7as",
          "l9"
        ],
        serviceAreaList: [
          "Aintree",
          "Fazakerley",
          "Maghull",
          "Walton",
          "Bootle",
          "North Liverpool"
        ]
      }
    ]
  };

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        setTimeout(function () {
          reject(new Error("Timeout after " + ms + "ms"));
        }, ms);
      })
    ]);
  }

  function normalize(data) {
    if (!data || !Array.isArray(data.branches)) {
      throw new Error("Invalid schema: branches[] missing");
    }

    return {
      lastUpdated: data.lastUpdated || "",
      brandGroups: data.brandGroups || {},
      branches: data.branches
    };
  }

  function publish(data, source) {
    window.RBH_DATA = data;
    window.RBH_DATA_SOURCE = source;

    document.dispatchEvent(
      new CustomEvent("RBH_DataReady", {
        detail: { source: source, data: data }
      })
    );
  }

  function publishError(message) {
    document.dispatchEvent(
      new CustomEvent("RBH_DataError", {
        detail: { message: message }
      })
    );
  }

  function loadData() {
    return withTimeout(fetch(DATA_URL, { cache: "no-store" }), TIMEOUT_MS)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (json) {
        var clean = normalize(json);
        publish(clean, "cdn");
        return clean;
      })
      .catch(function (err) {
        console.warn("RBH site-data fetch failed:", err.message);
        var fallbackData = normalize(FALLBACK);
        publish(fallbackData, "fallback");
        publishError(err.message);
        return fallbackData;
      });
  }

  // Optional helper for modules that want a promise
  window.RBH_getData = function () {
    if (window.RBH_DATA && Array.isArray(window.RBH_DATA.branches)) {
      return Promise.resolve(window.RBH_DATA);
    }
    return loadData();
  };

  // Auto-load immediately
  if (!window.RBH_DATA || !Array.isArray(window.RBH_DATA.branches)) {
    loadData();
  } else {
    publish(window.RBH_DATA, "existing");
  }
})();
