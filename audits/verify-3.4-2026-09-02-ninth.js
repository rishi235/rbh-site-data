// Independent extraction for item 3.4 (Cherry Lane Pharmacy, Walton), ninth quality pass, 2026-09-02.
// Written fresh for this run. Shares no code with tools/. Reads branches.json and the 12
// generated pages directly with hand-written regex, not by importing any generator or checker.
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = "C:\\Dev\\rbh-site-data";
const branches = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8")).branches;
const cl = branches.find((b) => b.branchName === "Cherry Lane Pharmacy");
if (!cl) { console.error("FAIL: Cherry Lane Pharmacy not found in branches.json"); process.exit(1); }

const otherBranches = branches.filter((b) => b.id !== cl.id && !b.disposed);
const foreignTowns = [...new Set(otherBranches.map((b) => b.seoTown).filter(Boolean))]
  .filter((t) => t !== cl.seoTown && !(cl.serviceAreaList || []).includes(t));
const foreignBrands = [...new Set(otherBranches.map((b) => b.brandLabel))].filter((b) => b !== cl.brandLabel);
const foreignPhones = [...new Set(otherBranches.map((b) => b.phone))].filter((p) => p !== cl.phone);
const foreignPostcodes = [...new Set(otherBranches.map((b) => b.postalCode))].filter((p) => p !== cl.postalCode);
const foreignWa = [...new Set(otherBranches.map((b) => b.whatsapp).filter(Boolean))].filter((w) => w !== cl.whatsapp);
const ownWidgetIds = new Set(Object.values(cl.widgets || {}));
const allWidgetIds = new Set();
for (const b of branches) for (const v of Object.values(b.widgets || {})) allWidgetIds.add(v);
const foreignWidgetIds = [...allWidgetIds].filter((id) => !ownWidgetIds.has(id));

const files = [
  "modules/service/pages/contraception-cherry-lane-walton.html",
  "modules/service/pages/earache-treatment-cherry-lane-walton.html",
  "modules/service/pages/impetigo-treatment-cherry-lane-walton.html",
  "modules/service/pages/insect-bite-treatment-cherry-lane-walton.html",
  "modules/service/pages/pharmacy-first-cherry-lane-walton.html",
  "modules/service/pages/shingles-treatment-cherry-lane-walton.html",
  "modules/service/pages/sinusitis-treatment-cherry-lane-walton.html",
  "modules/service/pages/sore-throat-treatment-cherry-lane-walton.html",
  "modules/service/pages/travel-clinic-cherry-lane-walton.html",
  "modules/service/pages/uti-treatment-cherry-lane-walton.html",
  "modules/service/pages/weight-loss-clinic-cherry-lane-walton.html",
  "modules/switch/pages/switch-prescriptions-cherry-lane-walton.html",
];

let checks = 0;
let failures = 0;
function check(cond, msg) {
  checks++;
  if (!cond) {
    failures++;
    console.log("FAIL: " + msg);
  }
}

for (const rel of files) {
  const full = path.join(ROOT, rel.replace(/\//g, "\\"));
  check(fs.existsSync(full), rel + " exists");
  if (!fs.existsSync(full)) continue;
  const raw = fs.readFileSync(full, "utf8");
  // strip the build-comment header so it isn't scanned as visible copy
  const body = raw.replace(/^<!--[\s\S]*?-->/, "");

  // H1 count and content
  const h1s = [...body.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => m[1].replace(/<[^>]+>/g, "").trim());
  check(h1s.length === 1, rel + ": exactly one H1 (" + h1s.length + ")");
  if (h1s.length === 1) {
    check(h1s[0].includes(cl.seoTown), rel + ": H1 carries seoTown Walton (" + h1s[0] + ")");
    for (const t of foreignTowns) check(!h1s[0].includes(t), rel + ": H1 does not carry foreign town " + t);
    for (const br of foreignBrands) check(!h1s[0].includes(br), rel + ": H1 does not carry foreign brand " + br);
  }

  // data-branch and data-wa
  const dataBranch = body.match(/data-branch="([^"]*)"/);
  if (rel.includes("switch") || rel.includes("service")) {
    check(!!dataBranch, rel + ": has data-branch attribute");
    if (dataBranch) check(dataBranch[1] === cl.branchName, rel + ": data-branch is Cherry Lane Pharmacy (" + dataBranch[1] + ")");
  }
  const dataWa = body.match(/data-wa="([^"]*)"/);
  check(!!dataWa, rel + ": has data-wa attribute");
  if (dataWa) {
    check(dataWa[1] === cl.whatsapp, rel + ": data-wa is own number (" + dataWa[1] + ")");
    for (const w of foreignWa) check(dataWa[1] !== w, rel + ": data-wa is not foreign number " + w);
  }

  // phone: tel: link and display, own number only
  const telLinks = [...body.matchAll(/href="tel:(\+?\d+)"/g)].map((m) => m[1]);
  check(telLinks.length >= 1, rel + ": has at least one tel: link");
  const ownTel = cl.phone.replace(/\s+/g, "");
  for (const t of telLinks) check(t === ownTel, rel + ": tel: link is own number (" + t + ")");
  const phoneShaped = [...body.matchAll(/\b0\d{2,4}[\s.-]?\d{3}[\s.-]?\d{3,4}\b/g)].map((m) => m[0]);
  for (const p of phoneShaped) {
    const normalised = p.replace(/[\s.-]/g, "");
    const ownNormalised = cl.phone.replace(/[\s.-]/g, "");
    check(normalised === ownNormalised, rel + ": visible phone-shaped number is own (" + p + ")");
  }
  for (const fp of foreignPhones) {
    check(!body.includes(fp), rel + ": does not contain foreign phone " + fp);
  }

  // postcode isolation
  const pcRegex = /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/g;
  const postcodes = [...body.matchAll(pcRegex)].map((m) => m[0]);
  for (const pc of postcodes) {
    check(pc.replace(/\s+/g, "") === cl.postalCode.replace(/\s+/g, ""), rel + ": postcode found is own (" + pc + ")");
  }
  for (const fpc of foreignPostcodes) check(!body.includes(fpc), rel + ": does not contain foreign postcode " + fpc);

  // JSON-LD
  const ldMatch = body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  check(!!ldMatch, rel + ": has a JSON-LD block");
  if (ldMatch) {
    let ld;
    try { ld = JSON.parse(ldMatch[1]); } catch (e) { ld = null; }
    check(!!ld, rel + ": JSON-LD parses");
    if (ld) {
      check(ld["@type"] === "Pharmacy", rel + ": JSON-LD @type is Pharmacy");
      check(ld.name === cl.branchName || ld.name === cl.brandLabel, rel + ": JSON-LD name matches branch (" + ld.name + ")");
      check(ld.telephone === cl.phone, rel + ": JSON-LD telephone matches (" + ld.telephone + ")");
      const addr = ld.address || {};
      check(addr.streetAddress === cl.streetAddress, rel + ": JSON-LD streetAddress matches");
      check(addr.addressLocality === cl.addressLocality, rel + ": JSON-LD addressLocality matches (" + addr.addressLocality + ")");
      check(addr.postalCode === cl.postalCode, rel + ": JSON-LD postalCode matches");
      check(addr.addressRegion === cl.addressRegion, rel + ": JSON-LD addressRegion matches");
      check(addr.addressCountry === cl.addressCountry, rel + ": JSON-LD addressCountry matches");
      const expectedFile = path.basename(rel);
      check(ld.url === cl.website + "/" + expectedFile, rel + ": JSON-LD url matches own website + filename (" + ld.url + ")");
    }
  }

  // map iframe query matches own address, url-encoded
  const mapMatch = body.match(/google\.com\/maps\?q=([^&"']+)&output=embed/);
  check(!!mapMatch, rel + ": has a map embed");
  if (mapMatch) {
    const decoded = decodeURIComponent(mapMatch[1]);
    const expected = `${cl.streetAddress}, ${cl.addressLocality}, ${cl.postalCode}`;
    check(decoded === expected, rel + ": map query matches own address (" + decoded + ")");
  }

  // widget ids: no foreign 24-hex widget id hard-coded
  const hex24 = [...body.matchAll(/\b[a-f0-9]{24}\b/g)].map((m) => m[0]);
  for (const id of hex24) check(!foreignWidgetIds.includes(id), rel + ": no foreign widget id hard-coded (" + id + ")");

  // CDN pins
  if (rel.includes("modules/service/")) {
    check(body.includes("@service-module-phase1/modules/service/service.css"), rel + ": pins service.css to service-module-phase1");
    check(body.includes("@service-module-phase1/modules/service/service.js"), rel + ": pins service.js to service-module-phase1");
  }
  if (rel.includes("modules/switch/")) {
    check(body.includes("@6a275e1/modules/switch/switch.css"), rel + ": pins switch.css to 6a275e1");
    check(body.includes("@6a275e1/modules/switch/switch.js"), rel + ": pins switch.js to 6a275e1");
  }

  // no em dash / en dash, literal or entity, in the body (post-comment-strip)
  check(!/[\u2013\u2014]/.test(body), rel + ": no literal em/en dash");
  check(!/&#8211;|&#8212;|&ndash;|&mdash;/i.test(body), rel + ": no em/en dash HTML entity");

  // weight loss page: no brand-name medicine anywhere
  if (rel.includes("weight-loss-clinic")) {
    const meds = ["Mounjaro", "Wegovy", "Orlistat", "Ozempic", "Saxenda", "Xenical", "tirzepatide", "semaglutide", "liraglutide"];
    for (const m of meds) check(!new RegExp(m, "i").test(body), rel + ": no brand-name medicine (" + m + ")");
  }
}

console.log(`\n${checks} checks, ${failures} failures across ${files.length} pages.`);
process.exit(failures > 0 ? 1 : 0);
