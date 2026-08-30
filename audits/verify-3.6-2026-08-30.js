/*
  verify-3.6-2026-08-30.js - sixth independent machine pass on item 3.6
  (McCanns Chemist, Aigburth and Sandringham, TWO branches on one domain).

  Imports NOTHING from tools/. Own regexes, own service-word table, own
  sheet-parsing, entity-decoding and cross-town logic. Reads branches.json
  as data only.

  Scope: the 24 McCanns service and switch pages (11 service + 1 switch
  per branch). Branch landing pages belong to item 5.2's passes.

  Carries the 3.5 sixth-pass template forward and adds what a two-branch
  shared-domain brand needs that a single-site brand does not:

    1. COUNTS: one SEO title line, one SEO description line, one h1.
    2. SHEET AGREEMENT: permalink found exactly once across all six paste
       sheets, one label per block (own regex count), FIRST Page Title and
       Page Description lines equal the page's, character for character.
    3. Own town (Aigburth / St Michael's) in title, description and h1.
       All text ENTITY-DECODED first: St Michael's may ship its apostrophe
       as &#39;, &#x27;, &apos;, &rsquo; or a typographic quote, and a rule
       that only reads a plain apostrophe would go blind on exactly the
       branch Q15 renamed.
    4. A service word for the page type in all three legs.
    5. No foreign live town in title, description or any h1 unless in that
       branch's own serviceAreaList. Sandringham pages may say Aigburth
       (it is in their catchment list); Aigburth pages must NOT say
       St Michael's (it is not in theirs).
    6. Own phone present; no other live branch's phone anywhere - the
       SIBLING BRANCH COUNTS AS FOREIGN here, the two McCanns phones must
       not cross; own postcode present, no other live branch's postcode.
    7. Lengths: title <= 65, description 80 to 165.
    8. JSON-LD parses and agrees with branches.json field by field, with
       the FAMILY-AWARE name rule check-jsonld pinned on the 2026-08-14
       3.6 pass: a service or switch page declares brandLabel (McCanns
       Chemist), never branchName; telephone digits equal the branch
       phone; streetAddress, addressLocality, postalCode, addressRegion,
       addressCountry exact; url on the branch's own host ending with the
       page filename. A tel: link on every page.
    9. No other branch's widget id, EXCLUDING ids the two McCanns
       branches legitimately share (weightLoss and travelClinic diaries
       are one diary for both).
   10. No other BRAND's brandLabel anywhere (sibling shares the label,
       so only non-McCanns labels are foreign).
   11. The switch banner file per branch points at that branch's own
       switch page.
   12. NEW LEG THIS PASS - sibling isolation and enquiry labelling:
       an Aigburth page must not reference the sandringham page slug and
       vice versa (a crossed link would walk a patient to the other
       branch's diary); every service page's #rbhsv-root carries
       data-branch equal to branchName or brandLabel (service.js labels
       the enquiry email and WhatsApp message with it) and a data-service
       attribute.
*/
"use strict";
const fs = require("fs");
const path = require("path");

const REPO = "C:/Dev/rbh-site-data";
const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));

const BRANCH_IDS = ["mccanns_aigburth", "mccanns_sandringham"];
const branches = BRANCH_IDS.map(id => {
  const b = data.branches.find(x => x.id === id);
  if (!b) { console.log("FATAL: " + id + " not in branches.json"); process.exit(1); }
  return b;
});
const liveTowns = data.branches
  .filter(b => !b.disposed && b.seoTown && b.seoTown.trim())
  .map(b => b.seoTown.trim());

function decodeEntities(s) {
  return (s || "")
    .replace(/&#39;|&#x27;|&apos;|&rsquo;|\u2019/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ");
}

// Parse all six paste sheets independently. FIRST label line per block
// (paster order) and label counts per block.
const SHEET_FILES = [
  "modules/branch/pages/SEO.md",
  "modules/service/pages/SEO.md",
  "modules/service/pages/CONTRACEPTION-SEO.md",
  "modules/service/pages/TRAVEL-CLINIC-SEO.md",
  "modules/service/pages/WEIGHT-LOSS-SEO.md",
  "modules/switch/pages/SEO.md"
];
const sheetByPermalink = {};
SHEET_FILES.forEach(sf => {
  const p = path.join(REPO, sf);
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf8");
  const blocks = text.split(/^## /m).slice(1);
  blocks.forEach(bl => {
    const perms = bl.match(/\*\*Page Permalink:\*\*\s*(\S+)/g) || [];
    const titles = bl.match(/\*\*Page Title:\*\*\s*(.+)/g) || [];
    const descs = bl.match(/\*\*Page Description:\*\*\s*(.+)/g) || [];
    if (!perms.length) return;
    const key = /\*\*Page Permalink:\*\*\s*(\S+)/.exec(bl)[1].trim().replace(/\/$/, "");
    const ti = /\*\*Page Title:\*\*\s*(.+)/.exec(bl);
    const de = /\*\*Page Description:\*\*\s*(.+)/.exec(bl);
    (sheetByPermalink[key] = sheetByPermalink[key] || []).push({
      title: ti ? ti[1].trim() : "",
      desc: de ? de[1].trim() : "",
      file: sf,
      counts: { perm: perms.length, title: titles.length, desc: descs.length }
    });
  });
});

function serviceWordsFor(file, slug) {
  const base = path.basename(file, ".html");
  if (/^pharmacy-first-/.test(base)) return ["pharmacy first"];
  const m = new RegExp("^([a-z-]+)-treatment-" + slug).exec(base);
  if (m) return [m[1].replace(/-/g, " "), "treatment"];
  if (/^contraception-/.test(base)) return ["contraception", "contraceptive"];
  if (/^weight-loss-clinic-/.test(base)) return ["weight loss"];
  if (/^travel-clinic-/.test(base)) return ["travel"];
  if (/^switch-prescriptions-/.test(base)) return ["prescription"];
  return null;
}
function hasAnyWord(text, words) {
  const t = text.toLowerCase();
  return words.some(w => t.indexOf(w.toLowerCase()) !== -1);
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function townRe(t) { return new RegExp("(^|[^A-Za-z])" + escapeRe(t) + "([^A-Za-z]|$)", "i"); }
const digits = s => (s || "").replace(/\D/g, "");

let fails = [], pagesChecked = 0, checksRun = 0;
function check(cond, msg) { checksRun++; if (!cond) fails.push(msg); }

branches.forEach(bz => {
  const slug = "mccanns-" + bz.townSlug;
  const siblingSlug = "mccanns-" + branches.find(b => b !== bz).townSlug;
  const others = data.branches.filter(b => b !== bz && !b.disposed);
  const ownWidgetVals = Object.values(bz.widgets || {});

  const PAGES = [];
  ["modules/service/pages", "modules/switch/pages"].forEach(d => {
    fs.readdirSync(path.join(REPO, d)).forEach(f => {
      if (f.endsWith(".html") && f.indexOf(slug) !== -1) PAGES.push(d + "/" + f);
    });
  });
  check(PAGES.length === 12, bz.id + ": " + PAGES.length + " pages found, expected 12 (11 service + 1 switch)");

  PAGES.forEach(relFile => {
    const file = path.join(REPO, relFile);
    const htmlRaw = fs.readFileSync(file, "utf8");
    const html = decodeEntities(htmlRaw);
    pagesChecked++;

    // 1. COUNTS
    const titleLines = html.match(/^.*Weebly page SEO title:.*$/gm) || [];
    const descLines = html.match(/^.*Weebly page SEO description:.*$/gm) || [];
    const h1Opens = html.match(/<h1[^>]*>/gi) || [];
    check(titleLines.length === 1, relFile + ": " + titleLines.length + " SEO title lines, expected 1");
    check(descLines.length === 1, relFile + ": " + descLines.length + " SEO description lines, expected 1");
    check(h1Opens.length === 1, relFile + ": " + h1Opens.length + " h1 elements, expected 1");

    const title = titleLines.length ? titleLines[0].replace(/^.*Weebly page SEO title:\s*/, "").trim() : "";
    const desc = descLines.length ? descLines[0].replace(/^.*Weebly page SEO description:\s*/, "").trim() : "";
    const h1s = [];
    const h1Re = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
    let hm;
    while ((hm = h1Re.exec(html)) !== null) h1s.push(hm[1].replace(/\s+/g, " ").trim());
    const h1 = h1s[0] || "";

    // 2. SHEET AGREEMENT + label counts
    const perm = path.basename(relFile, ".html");
    const entries = sheetByPermalink[perm] || [];
    check(entries.length === 1, relFile + ": " + entries.length + " paste sheet entries for permalink '" + perm + "'" + (entries.length ? " (" + entries.map(e => e.file).join(", ") + ")" : ""));
    if (entries.length === 1) {
      const e = entries[0];
      check(e.counts.title === 1, relFile + ": sheet block carries " + e.counts.title + " Page Title labels, expected 1 (" + e.file + ")");
      check(e.counts.desc === 1, relFile + ": sheet block carries " + e.counts.desc + " Page Description labels, expected 1 (" + e.file + ")");
      check(e.counts.perm === 1, relFile + ": sheet block carries " + e.counts.perm + " Page Permalink labels, expected 1 (" + e.file + ")");
      check(decodeEntities(e.title) === title, relFile + ": sheet title differs from page title. SHEET '" + e.title + "' PAGE '" + title + "'");
      check(decodeEntities(e.desc) === desc, relFile + ": sheet description differs from page description. SHEET '" + e.desc + "' PAGE '" + desc + "'");
    }

    // 3. OWN TOWN (entity-decoded on both sides)
    const ownTown = decodeEntities(bz.seoTown);
    [["title", title], ["description", desc], ["h1", h1]].forEach(([leg, text]) => {
      check(text.indexOf(ownTown) !== -1, relFile + ": own town '" + bz.seoTown + "' missing from " + leg + " ('" + text + "')");
    });

    // 4. SERVICE WORDS
    const words = serviceWordsFor(relFile, slug);
    if (!words) { fails.push(relFile + ": no service-word rule for this page type"); return; }
    [["title", title], ["description", desc], ["h1", h1]].forEach(([leg, text]) => {
      check(hasAnyWord(text, words), relFile + ": no service word (" + words.join(", ") + ") in " + leg + " ('" + text + "')");
    });

    // 5. CROSS-TOWN
    const excused = new Set((bz.serviceAreaList || []).map(t => decodeEntities(t).toLowerCase()));
    const foreign = liveTowns.filter(t => decodeEntities(t) !== ownTown && !excused.has(decodeEntities(t).toLowerCase()));
    [["title", title], ["description", desc]].concat(h1s.map((h, i) => ["h1[" + i + "]", h])).forEach(([leg, text]) => {
      foreign.forEach(t => {
        check(!townRe(decodeEntities(t)).test(text), relFile + ": foreign town '" + t + "' in " + leg + " ('" + text + "')");
      });
    });

    // 6. PHONES AND POSTCODES (sibling branch counts as foreign)
    const htmlDigitsStripped = html.replace(/[\s()-]/g, "");
    check(htmlDigitsStripped.indexOf(digits(bz.phone)) !== -1, relFile + ": own phone " + bz.phone + " NOT present in page");
    others.forEach(o => {
      if (o.phone && digits(o.phone) !== digits(bz.phone)) {
        check(htmlDigitsStripped.indexOf(digits(o.phone)) === -1, relFile + ": foreign phone " + o.phone + " (" + o.id + ") present in page");
      }
      if (o.postalCode && o.postalCode !== bz.postalCode) {
        check(html.toUpperCase().indexOf(o.postalCode.toUpperCase()) === -1, relFile + ": foreign postcode " + o.postalCode + " (" + o.id + ") present in page");
      }
    });
    check(html.toUpperCase().indexOf(bz.postalCode.toUpperCase()) !== -1, relFile + ": own postcode " + bz.postalCode + " NOT present in page");

    // 7. LENGTHS
    check(title.length <= 65, relFile + ": title " + title.length + " chars, over 65 ('" + title + "')");
    check(desc.length >= 80, relFile + ": description " + desc.length + " chars, under 80");
    check(desc.length <= 165, relFile + ": description " + desc.length + " chars, over 165");

    // 8. JSON-LD FIELD BY FIELD, FAMILY-AWARE NAME RULE, AND tel:
    const ld = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i.exec(htmlRaw);
    check(!!ld, relFile + ": no JSON-LD block");
    if (ld) {
      let parsed = null;
      try { parsed = JSON.parse(ld[1]); } catch (e) { fails.push(relFile + ": JSON-LD does not parse: " + e.message); }
      if (parsed) {
        const node = Array.isArray(parsed) ? parsed[0] : parsed;
        const addr = node.address || {};
        check(node.name === bz.brandLabel, relFile + ": JSON-LD name '" + node.name + "' != brandLabel '" + bz.brandLabel + "' (service/switch pages declare brandLabel, the rule check-jsonld pinned on the 2026-08-14 3.6 pass)");
        check(digits(node.telephone) === digits(bz.phone), relFile + ": JSON-LD telephone '" + node.telephone + "' != branch phone '" + bz.phone + "'");
        check(addr.streetAddress === bz.streetAddress, relFile + ": JSON-LD streetAddress '" + addr.streetAddress + "' != '" + bz.streetAddress + "'");
        check(addr.addressLocality === bz.addressLocality, relFile + ": JSON-LD addressLocality '" + addr.addressLocality + "' != '" + bz.addressLocality + "'");
        check(addr.postalCode === bz.postalCode, relFile + ": JSON-LD postalCode '" + addr.postalCode + "' != '" + bz.postalCode + "'");
        check(addr.addressRegion === bz.addressRegion, relFile + ": JSON-LD addressRegion '" + addr.addressRegion + "' != '" + bz.addressRegion + "'");
        check(addr.addressCountry === bz.addressCountry, relFile + ": JSON-LD addressCountry '" + addr.addressCountry + "' != '" + bz.addressCountry + "'");
        if (node.url) {
          check(node.url.indexOf(bz.website) === 0, relFile + ": JSON-LD url '" + node.url + "' not on own host " + bz.website);
          check(node.url.replace(/\/$/, "").endsWith(path.basename(relFile)), relFile + ": JSON-LD url '" + node.url + "' does not end with the page filename");
        } else {
          checksRun++; fails.push(relFile + ": JSON-LD has no url field");
        }
      }
    }
    check(/href=["']tel:/i.test(htmlRaw), relFile + ": no tel: link");

    // 9. FOREIGN WIDGET IDS (excluding legitimately shared McCanns diaries)
    others.forEach(o => {
      Object.entries(o.widgets || {}).forEach(([k, v]) => {
        if (v && !ownWidgetVals.includes(v)) {
          check(htmlRaw.indexOf(v) === -1, relFile + ": foreign widget id " + v + " (" + o.id + " " + k + ") present in page");
        }
      });
    });

    // 10. FOREIGN BRAND LABELS (sibling shares the label, so only other brands)
    others.forEach(o => {
      if (o.brandLabel && o.brandLabel !== bz.brandLabel) {
        check(html.indexOf(o.brandLabel) === -1, relFile + ": foreign brand '" + o.brandLabel + "' (" + o.id + ") present in page");
      }
    });

    // 12a. SIBLING SLUG ISOLATION
    check(htmlRaw.indexOf(siblingSlug) === -1, relFile + ": references sibling branch slug '" + siblingSlug + "', a crossed link walks a patient to the other branch's diary");

    // 12b. ENQUIRY LABELLING (service pages carry the booking mount)
    if (relFile.indexOf("modules/service/pages") === 0) {
      const rootTag = /<[^>]*id=["']rbhsv-root["'][^>]*>/i.exec(htmlRaw);
      check(!!rootTag, relFile + ": no #rbhsv-root element");
      if (rootTag) {
        const db = /data-branch=["']([^"']*)["']/.exec(rootTag[0]);
        const ds = /data-service=["']([^"']*)["']/.exec(rootTag[0]);
        check(!!db, relFile + ": #rbhsv-root has no data-branch, an enquiry from this page is labelled 'our pharmacy'");
        if (db) check(db[1] === bz.branchName || db[1] === bz.brandLabel, relFile + ": data-branch '" + db[1] + "' is neither branchName nor brandLabel");
        check(!!ds && ds[1].trim().length > 0, relFile + ": #rbhsv-root has no data-service");
      }
    }
  });

  // 11. BANNER
  const bf = path.join(REPO, "modules/switch/pages/banners/switch-prescriptions-" + slug + ".txt");
  check(fs.existsSync(bf), "banner switch-prescriptions-" + slug + ".txt missing");
  if (fs.existsSync(bf)) {
    const txt = fs.readFileSync(bf, "utf8");
    check(txt.indexOf("switch-prescriptions-" + slug) !== -1, "banner for " + bz.id + ": does not point at its own switch page");
    check(txt.indexOf("switch-prescriptions-" + siblingSlug) === -1, "banner for " + bz.id + ": points at the sibling branch's switch page");
  }
});

console.log("verify-3.6: " + pagesChecked + " McCanns pages checked across " + branches.length + " branches, " + Object.keys(sheetByPermalink).length + " sheet permalinks parsed, " + checksRun + " checks run");
if (fails.length) {
  console.log("FAILURES (" + fails.length + "):");
  fails.forEach(f => console.log("  FAIL  " + f));
  process.exit(1);
}
console.log("CLEAN on all legs: counts, sheet agreement and one-label-per-block, own town (entity-decoded), service words, cross-town absence, phone/postcode isolation including the sibling branch, lengths, JSON-LD field-by-field with the family-aware name rule, tel:, widget isolation net of shared diaries, brand isolation, banners, sibling slug isolation, enquiry labelling attributes.");
