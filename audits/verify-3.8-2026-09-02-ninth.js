// Item 3.8 quality pass (ninth), 2026-09-02, unattended scheduled run.
// Fresh independent extraction for SK Chemists Bootle (skchemists_bootle).
// Shares no code with tools/ or any prior verify-3.8-*.js. Written from
// scratch against the live HTML structure and branches.json only.

const fs = require("fs");
const path = require("path");

const branches = require("../branches.json").branches;
const live = branches.filter(b => !b.disposed);
const sk = live.find(b => b.id === "skchemists_bootle");
if (!sk) { console.error("FATAL: skchemists_bootle not found or disposed"); process.exit(1); }

const pageDirs = [
  path.join(__dirname, "..", "modules", "service", "pages"),
  path.join(__dirname, "..", "modules", "switch", "pages"),
];

let files = [];
for (const dir of pageDirs) {
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith("-sk-chemists-bootle.html")) files.push(path.join(dir, f));
  }
}

let checks = 0;
let flags = [];

function flag(file, rule, detail) {
  flags.push(`${path.basename(file)} :: ${rule} :: ${detail}`);
}

function stripBuildComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

const otherLiveBranches = live.filter(b => b.id !== sk.id);

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const html = stripBuildComments(raw);
  const base = path.basename(file);

  // 1. exactly one H1, contains own seoTown as a whole word
  checks++;
  const h1matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1matches.length !== 1) {
    flag(file, "h1-count", `found ${h1matches.length}`);
  } else {
    const h1text = h1matches[0][1].replace(/<[^>]+>/g, "").trim();
    const townRe = new RegExp(`\\b${sk.seoTown}\\b`, "i");
    checks++;
    if (!townRe.test(h1text)) flag(file, "h1-own-town", h1text);
  }

  // 2. cross-town absence: no other live branch's seoTown as whole word in H1/title/description,
  // unless that town is in sk.serviceAreaList
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i);
  const textBlocks = {
    title: titleMatch ? titleMatch[1] : "",
    description: descMatch ? descMatch[1] : "",
    h1: h1matches.length ? h1matches[0][1].replace(/<[^>]+>/g, "") : "",
  };
  for (const [blockName, text] of Object.entries(textBlocks)) {
    for (const other of otherLiveBranches) {
      if (!other.seoTown) continue;
      if (other.seoTown.toLowerCase() === sk.seoTown.toLowerCase()) continue;
      const re = new RegExp(`\\b${other.seoTown}\\b`, "i");
      checks++;
      if (re.test(text)) {
        const excused = (sk.serviceAreaList || []).some(t => t.toLowerCase() === other.seoTown.toLowerCase());
        if (!excused) flag(file, "cross-town-" + blockName, `names ${other.seoTown} (branch ${other.id})`);
      }
    }
  }

  // 3. own phone present (tel: and visible), digits-only comparison; no other live branch's phone digits anywhere
  const ownPhoneDigits = sk.phone.replace(/\D/g, "");
  checks++;
  const telHrefs = [...html.matchAll(/href=["']tel:([^"']+)["']/gi)].map(m => m[1].replace(/\D/g, ""));
  if (!telHrefs.includes(ownPhoneDigits)) flag(file, "tel-href-own", `expected ${ownPhoneDigits}, found [${telHrefs.join(",")}]`);

  // sweep every phone-shaped number sequence (7+ consecutive digit groups typical of UK numbers)
  const phoneShaped = [...html.matchAll(/(?:0\d[\d\s]{8,12}\d)/g)].map(m => m[0].replace(/\D/g, ""));
  for (const other of otherLiveBranches) {
    const otherDigits = other.phone ? other.phone.replace(/\D/g, "") : null;
    if (!otherDigits) continue;
    checks++;
    if (phoneShaped.includes(otherDigits) || telHrefs.includes(otherDigits)) {
      flag(file, "foreign-phone", `contains ${other.id}'s phone`);
    }
  }

  // 4. own postcode present; no other live branch's postcode present
  checks++;
  if (!html.includes(sk.postalCode)) flag(file, "postcode-own-missing", sk.postalCode);
  for (const other of otherLiveBranches) {
    if (!other.postalCode || other.postalCode === sk.postalCode) continue;
    checks++;
    if (html.includes(other.postalCode)) flag(file, "foreign-postcode", `contains ${other.id}'s postcode ${other.postalCode}`);
  }

  // 5. JSON-LD block: exactly one, parses, fields match branches.json
  const ldMatches = [...raw.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  checks++;
  if (ldMatches.length !== 1) {
    flag(file, "jsonld-count", `found ${ldMatches.length}`);
  } else {
    let ld;
    try { ld = JSON.parse(ldMatches[0][1]); } catch (e) { flag(file, "jsonld-parse", e.message); ld = null; }
    if (ld) {
      checks++;
      if (ld["@type"] !== "Pharmacy") flag(file, "jsonld-type", ld["@type"]);
      checks++;
      if (ld["@context"] !== "https://schema.org") flag(file, "jsonld-context", ld["@context"]);
      checks++;
      const expectedName = (sk.branchName === sk.brandLabel) ? sk.branchName : null;
      if (expectedName && ld.name !== expectedName) flag(file, "jsonld-name", `${ld.name} vs expected ${expectedName}`);
      checks++;
      if (!ld.telephone || ld.telephone.replace(/\D/g, "") !== ownPhoneDigits) flag(file, "jsonld-telephone", ld.telephone);
      checks++;
      const addr = ld.address || {};
      if (addr.streetAddress !== sk.streetAddress) flag(file, "jsonld-street", addr.streetAddress);
      checks++;
      if (addr.addressLocality !== sk.addressLocality) flag(file, "jsonld-locality", addr.addressLocality);
      checks++;
      if (addr.postalCode !== sk.postalCode) flag(file, "jsonld-postcode", addr.postalCode);
      checks++;
      if (addr.addressRegion !== sk.addressRegion) flag(file, "jsonld-region", addr.addressRegion);
      checks++;
      if (addr.addressCountry !== sk.addressCountry) flag(file, "jsonld-country", addr.addressCountry);
      checks++;
      const expectedUrl = sk.website.replace(/\/$/, "") + "/" + base;
      if (ld.url !== expectedUrl) flag(file, "jsonld-url", `${ld.url} vs expected ${expectedUrl}`);
    }
  }

  // 6. data-branch attribute
  checks++;
  const dbMatch = html.match(/data-branch=["']([^"']*)["']/);
  if (!dbMatch) {
    flag(file, "data-branch-missing", "");
  } else {
    const val = dbMatch[1];
    if (val !== sk.branchName && val !== sk.brandLabel) flag(file, "data-branch-wrong", val);
  }

  // 7. data-wa attribute, valid E.164 UK mobile without plus, matches sk.whatsapp
  checks++;
  const waMatch = html.match(/data-wa=["']([^"']*)["']/);
  if (waMatch) {
    const wa = waMatch[1];
    if (wa.includes("{{")) flag(file, "data-wa-token", wa);
    else if (wa !== sk.whatsapp) flag(file, "data-wa-mismatch", wa);
    if (!/^447\d{9}$/.test(wa)) flag(file, "data-wa-shape", wa);
  }

  // 8. map iframe: exactly one, query decodes to own address exactly
  const mapMatches = [...html.matchAll(/<iframe[^>]*class=["']map["'][^>]*src=["']([^"']+)["'][^>]*><\/iframe>/gi)];
  checks++;
  if (mapMatches.length !== 1) {
    flag(file, "map-count", `found ${mapMatches.length}`);
  } else {
    const src = mapMatches[0][1];
    checks++;
    if (!src.startsWith("https://www.google.com/maps?q=")) flag(file, "map-host", src);
    checks++;
    if (!src.includes("output=embed")) flag(file, "map-embed-flag", src);
    const qMatch = src.match(/[?&]q=([^&]+)/);
    checks++;
    if (!qMatch) {
      flag(file, "map-query-missing", src);
    } else {
      const decoded = decodeURIComponent(qMatch[1]);
      const expected = `${sk.streetAddress}, ${sk.addressLocality}, ${sk.postalCode}`;
      if (decoded !== expected) flag(file, "map-query-mismatch", `${decoded} vs expected ${expected}`);
    }
  }

  // 9. no em dash / en dash in visible copy (build comments already stripped)
  checks++;
  if (/[–—]/.test(html)) flag(file, "em-en-dash", "found em/en dash character");
  checks++;
  if (/&mdash;|&ndash;|&#8211;|&#8212;|&#x2013;|&#x2014;/i.test(html)) flag(file, "em-en-dash-entity", "found dash entity");

  // 10. WhatsApp button present implies data-wa is not inert (best-effort: check for wa.me usage note is in JS, not per-page; skip)
}

console.log(`Item 3.8 quality pass (ninth) - SK Chemists Bootle independent verification`);
console.log(`Files checked: ${files.length}`);
console.log(`Total checks: ${checks}`);
console.log(`Flags: ${flags.length}`);
if (flags.length) {
  console.log("---FLAGS---");
  for (const f of flags) console.log(f);
  process.exitCode = 1;
} else {
  console.log("0 flags - all clean.");
}
