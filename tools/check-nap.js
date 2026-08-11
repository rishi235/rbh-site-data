#!/usr/bin/env node
/*
  check-nap.js
  Item 1.4 of the audit backlog: verify every generated branch page's
  NAP (name, address, phone) against branches.json, the single source
  of truth. Read-only: reports mismatches, changes nothing.
  Run from anywhere:  node tools/check-nap.js
  Exit code 0 = clean, 1 = mismatches found.
  Checks, per page:
    - data-branch attribute matches branchName
    - JSON-LD name, telephone, streetAddress, addressLocality,
      postalCode, addressRegion, addressCountry
    - contact card address line "street, locality, postcode"
    - every tel: link and visible phone number
    - Google Maps embed query
    - all four of those surfaces are PRESENT. Each check above only fires
      when its surface is found, so a page that lost its contact card or
      its map used to pass every rule and still count towards the "checked
      N pages" line. An unchecked page and a correct page read the same.
    - EVERY phone-shaped number on the page, not only the two shapes the
      readers above recognise, matches the branch phone. Added on the item
      1.4 quality pass, 2026-08-11: all 15 switch pages carry a number in
      FAQ body copy ("Call us on 0151 226 2051") that sat outside the
      visible-phone reader, because it wants digits straight after "Call".
      Correct today, and unread today, which are not the same thing.
    - every mailto: link belongs to the owning branch, and its visible text
      matches the address it links to. Added on the item 1.2 quality pass,
      2026-08-11. The email is the fourth published contact fact and it sits
      on the same contact card as the three this file already checks, but
      nothing read it: check-branch-links only proves nhsEmail matches the
      ODS code inside branches.json, and check-jsonld only reads the email
      if a page puts one in its JSON-LD. The six branch landing pages carry
      a visible mailto that no rule touched, so one branch's inbox on
      another branch's page would have published silently. That is the same
      failure shape as a foreign phone number or a foreign postcode, both of
      which have had a rule for weeks. Correct on all six today.
  Exceptions go in KNOWN_PHONE or KNOWN_SURFACE with a reason and a
  question id, and a key that no longer fires fails the run.
  Pages checked: modules/service/pages/*.html, modules/switch/pages/*.html,
  modules/branch/pages/*.html

  Also checked, from 2026-08-07: the Weebly paste blocks in
  modules/service/weebly-paste. Those are not generated pages. They are prose
  fragments pasted straight onto live pages this repo does not build, so a
  wrong phone number or address in one lands on the public site with nothing
  in between. They carry no data-branch, no JSON-LD and no contact-line, so
  the structured checks above cannot read them at all; before this they were
  checked for postcodes only, by check-postcodes.js, and for nothing else.
  They are checked below on the facts they do carry:
    - the PASTE TARGET host matches the branch the filename claims
    - the block names its own branch and no other branch
    - every phone number matches the branch phone
    - every postcode matches the branch postcode, and carries the street
      address in front of it, so an address cannot lose its street
    - every internal link resolves to a page this repo generates (warning
      only: a live-only target is possible but worth stating)
*/
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));
const branches = data.branches;

const PAGE_DIRS = [
  path.join(ROOT, "modules", "service", "pages"),
  path.join(ROOT, "modules", "switch", "pages"),
  path.join(ROOT, "modules", "branch", "pages"),
];

// Paste blocks live here. Kept separate from PAGE_DIRS because nothing in
// them is generated and none of the structured page checks apply.
const PASTE_DIRS = [
  path.join(ROOT, "modules", "service", "weebly-paste"),
];

const digits = (s) => String(s || "").replace(/\D/g, "");

// A phone number written for a human: 0151 226 2051, 01704 577376.
// Declared here rather than beside the paste-block section because the
// generated-page sweep below uses it too. See PHONE SWEEP.
const PHONE_RE = /\b0\d[\d ]{7,13}\d\b/g;
// A UK postcode as it appears in copy, always upper case.
const PC_RE = /\b[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}\b/g;

// Build comments carry the generator name, the run date and the CDN pin.
// Blank them before any sweep so generator bookkeeping is never read as a
// public claim. Same convention as check-em-dashes.js.
const stripComments = (s) => String(s).replace(/<!--[\s\S]*?-->/g, " ");

// A number written in a phone shape that is not a phone number. Keyed
// "<filename>::<the number as written>", with a reason and a question id.
// A key that no longer matches anything fails the run, so the list cannot rot.
const KNOWN_PHONE = {};

// A generated page that legitimately does not carry one of the four NAP
// surfaces. Keyed "<filename>::<surface>", with a reason and a question id.
// A key that no longer matches anything fails the run.
const KNOWN_SURFACE = {};

// Pages HTML-escape text and attribute values; decode before comparing.
const unesc = (s) => s === null || s === undefined ? s : String(s)
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");

// Display name on pages is the brand label; branchName adds the town for
// multi-branch brands. Either is a correct name for NAP purposes.
const nameOk = (got, b) => got === b.branchName || got === b.brandLabel;

function findBranchForFile(file) {
  // Filenames end "-<brandSlug>-<townSlug>.html".
  const stem = file.replace(/\.html$/, "");
  let best = null;
  for (const b of branches) {
    if (!b.brandSlug || !b.townSlug) continue;
    const suffix = b.brandSlug + "-" + b.townSlug;
    if (stem.endsWith(suffix)) {
      if (!best || suffix.length > best.suffix.length) best = { b, suffix };
    }
  }
  return best ? best.b : null;
}

function extract(html) {
  const out = { telLinks: [], visiblePhones: [] };
  const db = html.match(/data-branch="([^"]*)"/);
  out.dataBranch = db ? db[1] : null;
  const ld = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)<\/script>/);
  if (ld) { try { out.ld = JSON.parse(ld[1]); } catch (e) { out.ldError = e.message; } }
  let m;
  const telRe = /href="tel:([^"]+)"/g;
  while ((m = telRe.exec(html)) !== null) out.telLinks.push(m[1]);
  const visRe = /(?:Call|Phone:<\/strong>\s*<a href="tel:[^"]*">)\s*([0-9][0-9 ]{8,13}[0-9])/g;
  while ((m = visRe.exec(html)) !== null) out.visiblePhones.push(m[1]);
  const cl = html.match(/<div class="contact-line"><p>([^<]+)<\/p><\/div>/);
  out.contactAddress = cl ? cl[1].trim() : null;
  const map = html.match(/maps\?q=([^"&]+)/);
  out.mapQuery = map ? decodeURIComponent(map[1]) : null;
  // Every mailto, with the text the reader actually sees. Anchor text is
  // captured because a link whose text and href disagree is the shape that
  // survives a copy-paste rename: the visible address is corrected and the
  // href is not, so the page reads right and the mail goes elsewhere.
  out.mailLinks = [];
  const mailRe = /<a[^>]*href="mailto:([^"?]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  while ((m = mailRe.exec(html)) !== null)
    out.mailLinks.push({ href: m[1].trim(), text: m[2].replace(/<[^>]*>/g, "").trim() });
  return out;
}

let problems = 0;
let pages = 0;
let pasteBlocks = 0;
const seenBranches = new Set();
const generatedFiles = new Set();
const warnings = [];
const usedKnownPhone = new Set();
const usedKnownSurface = new Set();

function bad(file, msg) {
  problems++;
  console.log("MISMATCH " + file + ": " + msg);
}

function warn(file, msg) {
  warnings.push("WARN " + file + ": " + msg);
}

for (const dir of PAGE_DIRS) {
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith(".html")) continue;
    const html = fs.readFileSync(path.join(dir, file), "utf8");
    const rel = path.relative(ROOT, path.join(dir, file));
    generatedFiles.add(file);
    const b = findBranchForFile(file);
    if (!b) { bad(rel, "no branches.json entry matches the filename"); continue; }
    pages++;
    seenBranches.add(b.id);
    if (b.disposed) bad(rel, "page exists for disposed branch " + b.id);
    const x = extract(html);
    const expAddr = b.streetAddress + ", " + b.addressLocality + ", " + b.postalCode;
    if (x.dataBranch !== null && !nameOk(unesc(x.dataBranch), b))
      bad(rel, 'data-branch "' + x.dataBranch + '" vs branchName "' + b.branchName + '"');
    if (x.contactAddress !== null && unesc(x.contactAddress) !== expAddr)
      bad(rel, 'contact address "' + x.contactAddress + '" vs "' + expAddr + '"');
    if (x.mapQuery !== null && x.mapQuery.replace(/\s+/g, " ") !== expAddr.replace(/\s+/g, " "))
      bad(rel, 'map query "' + x.mapQuery + '" vs "' + expAddr + '"');
    for (const t of x.telLinks)
      if (digits(t) !== digits(b.phone))
        bad(rel, 'tel link "' + t + '" vs phone "' + b.phone + '"');
    for (const v of x.visiblePhones)
      if (digits(v) !== digits(b.phone))
        bad(rel, 'visible phone "' + v + '" vs "' + b.phone + '"');

    // --- THE PUBLISHED EMAIL -------------------------------------------
    // Two rules, matching the phone: the address must be one this branch
    // owns, and the link must go where it says it goes. Both branches.json
    // addresses are allowed because they are both legitimately public: the
    // rbhealth.co.uk inbox is the general route and the nhs.net one is the
    // secure clinical route. Which of the two BELONGS on a public page is a
    // separate judgement and is not decided here.
    const ownEmails = [b.email, b.nhsEmail].filter(Boolean);
    for (const ml of x.mailLinks) {
      const owns = ownEmails.some((e) => e.toLowerCase() === ml.href.toLowerCase());
      if (!owns) {
        const other = branches.find((o) =>
          [o.email, o.nhsEmail].filter(Boolean)
            .some((e) => e.toLowerCase() === ml.href.toLowerCase()));
        bad(rel, 'mailto "' + ml.href + '" is not an address of ' + b.id +
          (other ? ', it belongs to ' + other.id : ', and belongs to no branch') +
          '. Expected one of: ' + ownEmails.join(", "));
      }
      // Anchor text only has to agree when it is itself an address. A link
      // reading "email the pharmacy" is fine and is left alone.
      if (/@/.test(ml.text) && ml.text.toLowerCase() !== ml.href.toLowerCase())
        bad(rel, 'mailto link text "' + ml.text + '" does not match its href "' +
          ml.href + '", so the page shows one address and sends to another');
    }

    if (x.ldError) bad(rel, "JSON-LD does not parse: " + x.ldError);
    if (x.ld) {
      const a = x.ld.address || {};
      if (!nameOk(x.ld.name, b))
        bad(rel, 'JSON-LD name "' + x.ld.name + '" vs "' + b.branchName + '"');
      const checks = [
        ["JSON-LD streetAddress", a.streetAddress, b.streetAddress],
        ["JSON-LD addressLocality", a.addressLocality, b.addressLocality],
        ["JSON-LD postalCode", a.postalCode, b.postalCode],
        ["JSON-LD addressRegion", a.addressRegion, b.addressRegion],
        ["JSON-LD addressCountry", a.addressCountry, b.addressCountry],
      ];
      for (const [what, got, want] of checks)
        if (got !== want) bad(rel, what + ' "' + got + '" vs "' + want + '"');
      if (digits(x.ld.telephone) !== digits(b.phone))
        bad(rel, 'JSON-LD telephone "' + x.ld.telephone + '" vs "' + b.phone + '"');
    } else if (!x.ldError) {
      bad(rel, "no JSON-LD block found");
    }

    // --- THE FOUR SURFACES MUST BE THERE -------------------------------
    // Every check above is conditional: a page with no contact card, no map
    // and no tel: link passes all of them and still counts towards the
    // "checked N pages" line, so an unchecked page and a correct page read
    // the same. Absence is now a failure, with KNOWN_SURFACE for a page
    // that legitimately has none.
    const surfaces = [
      ["contact-line address", x.contactAddress !== null],
      ["map query", x.mapQuery !== null],
      ["tel: link", x.telLinks.length > 0],
      ["visible phone", x.visiblePhones.length > 0],
    ];
    for (const [what, present] of surfaces) {
      if (present) continue;
      const key = file + "::" + what;
      if (KNOWN_SURFACE[key]) {
        usedKnownSurface.add(key);
        warn(rel, "KNOWN no " + what + ". " + KNOWN_SURFACE[key].question + ": " +
          KNOWN_SURFACE[key].reason);
      } else {
        bad(rel, "carries no " + what + ", so nothing on this page was checked " +
          "for it against branches.json");
      }
    }

    // --- PHONE SWEEP ---------------------------------------------------
    // The readers above only see a phone in the two shapes they know: a
    // tel: href, and a number written straight after "Call" or after the
    // contact card's "Phone:" label. Every other phone-like number on the
    // page was invisible to this checker, which is the one thing in the
    // repo that reads a phone against branches.json at all. All 15 switch
    // pages carry one: the FAQ answer reads "Call us on 0151 226 2051",
    // and the two words between "Call" and the number put it outside the
    // reader. Correct today, and unread today, which are not the same
    // thing. Sweep every phone-shaped number instead, the way the paste
    // block half of this file already does.
    const swept = stripComments(unesc(html));
    PHONE_RE.lastIndex = 0;
    let pm;
    while ((pm = PHONE_RE.exec(swept)) !== null) {
      const raw = pm[0].trim().replace(/\s+/g, " ");
      const d = digits(raw);
      if (d.length < 10 || d.length > 11) continue;
      if (d === digits(b.phone)) continue;
      const key = file + "::" + raw;
      if (KNOWN_PHONE[key]) {
        usedKnownPhone.add(key);
        warn(rel, 'KNOWN number "' + raw + '". ' + KNOWN_PHONE[key].question + ": " +
          KNOWN_PHONE[key].reason);
        continue;
      }
      const other = branches.find((x2) => x2.phone && digits(x2.phone) === d);
      if (other)
        bad(rel, 'phone "' + raw + '" belongs to ' + other.branchName + ", not " +
          b.branchName);
      else
        bad(rel, 'phone-like number "' + raw + '" is not ' + b.branchName +
          "'s number in branches.json");
    }
  }
}

// ---------------------------------------------------------------------
// Weebly paste blocks
// ---------------------------------------------------------------------
// hostMap keys carry the www; PASTE TARGET comments usually do not.
const hostOwners = {};
for (const host of Object.keys(data.hostMap || {}))
  hostOwners[host.replace(/^www\./i, "").toLowerCase()] = data.hostMap[host];

// Paste block names read "<brandSlug>-old-..." rather than the page form
// "...-<brandSlug>-<townSlug>", so match on the brandSlug prefix. Longest
// slug wins, so a short slug cannot claim another brand's file.
function pasteOwner(file) {
  const stem = file.replace(/\.html$/, "");
  let best = null;
  for (const b of branches) {
    if (!b.brandSlug) continue;
    if (stem.startsWith(b.brandSlug + "-") &&
      (!best || b.brandSlug.length > best.key.length)) best = { b, key: b.brandSlug };
  }
  return best ? best.b : null;
}

for (const dir of PASTE_DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith(".html")) continue;
    const html = fs.readFileSync(path.join(dir, file), "utf8");
    const rel = path.relative(ROOT, path.join(dir, file));
    const b = pasteOwner(file);
    if (!b) { bad(rel, "no branches.json entry matches the paste block filename"); continue; }
    pasteBlocks++;
    if (b.disposed) bad(rel, "paste block exists for disposed branch " + b.id);
    const text = unesc(html);

    // The PASTE TARGET comment names the live page the block replaces. If it
    // disagrees with the filename, the block is aimed at the wrong site.
    const target = html.match(/PASTE TARGET:\s*(\S+)/);
    if (!target) {
      bad(rel, "no PASTE TARGET comment, so the live page it replaces is unstated");
    } else {
      const host = target[1].replace(/^https?:\/\//i, "").split("/")[0]
        .replace(/^www\./i, "").toLowerCase();
      const ids = hostOwners[host];
      if (!ids)
        bad(rel, 'PASTE TARGET host "' + host + '" is not in the branches.json hostMap');
      else if (ids.indexOf(b.id) === -1)
        bad(rel, 'PASTE TARGET host "' + host + '" belongs to ' + ids.join(", ") +
          ' but the filename claims ' + b.id);
    }

    // The block must name its own branch, and must not name another. This is
    // the McCanns Sandringham failure shape: one branch's copy on another.
    if (!text.includes(b.brandLabel))
      bad(rel, 'does not name its own branch "' + b.brandLabel + '"');
    for (const other of branches) {
      if (other.brandLabel === b.brandLabel) continue;
      if (text.includes(other.brandLabel))
        bad(rel, 'names another branch "' + other.brandLabel + '" (owner is ' +
          b.brandLabel + ')');
    }

    let m;
    let sawPhone = false;
    PHONE_RE.lastIndex = 0;
    while ((m = PHONE_RE.exec(text)) !== null) {
      if (digits(m[0]).length < 10) continue;
      sawPhone = true;
      if (digits(m[0]) !== digits(b.phone))
        bad(rel, 'phone "' + m[0].trim() + '" vs "' + b.phone + '" for ' + b.id);
    }

    let sawPostcode = false;
    PC_RE.lastIndex = 0;
    while ((m = PC_RE.exec(text)) !== null) {
      sawPostcode = true;
      if (m[0].replace(/\s+/g, " ") !== b.postalCode.replace(/\s+/g, " ")) {
        bad(rel, 'postcode "' + m[0] + '" vs "' + b.postalCode + '" for ' + b.id);
        continue;
      }
      // A postcode ends an address, so the street must be in front of it.
      // Without this an address can lose its street and still read as valid.
      const before = text.slice(Math.max(0, m.index - 90), m.index);
      if (!before.replace(/\s+/g, " ").includes(b.streetAddress))
        bad(rel, 'postcode "' + m[0] + '" is not preceded by the street address "' +
          b.streetAddress + '"');
    }

    if (!sawPhone && !sawPostcode)
      warn(rel, "carries neither a phone number nor a postcode, so nothing here " +
        "was checked against branches.json");

    // Link targets. A block that points at a page nobody builds is a live
    // button of unknown state, which is what Q8 is about. Reported, not
    // failed: a live-only target can be deliberate.
    const hrefRe = /href="([^"]+)"/g;
    while ((m = hrefRe.exec(html)) !== null) {
      const url = m[1];
      if (/^(tel:|mailto:|#|https?:|\/\/)/i.test(url)) continue;
      const leaf = url.split("/").pop().split("?")[0].split("#")[0];
      if (!leaf) continue;
      if (!generatedFiles.has(leaf))
        warn(rel, 'link target "' + leaf + '" is not a page this repo generates, ' +
          "so it is a live-only page no checker here can keep correct");
    }
  }
}

// ---------------------------------------------------------------------
// Shared paste templates
// ---------------------------------------------------------------------
// modules/switch/weebly.html is pasted into a Weebly embed on EVERY branch
// that runs a switch page this repo does not generate. It belongs to no
// branch, so the block above cannot read it: pasteOwner() matches on a
// brandSlug prefix and this file has none, and until now it was simply not
// in any list. That is the exclusion-by-nobody-thinking-about-it case
// CLAUDE.md names. The rule that fits a shared template is the opposite of
// the per-branch one: it must carry NO branch fact at all, because a phone
// number, a postcode or a branch name typed into it is published on every
// branch at once.
const SHARED_PASTE_FILES = [
  path.join(ROOT, "modules", "switch", "weebly.html"),
];

for (const abs of SHARED_PASTE_FILES) {
  const rel = path.relative(ROOT, abs);
  if (!fs.existsSync(abs)) {
    bad(rel, "listed as a shared paste template but the file is gone");
    continue;
  }
  pasteBlocks++;
  const text = stripComments(unesc(fs.readFileSync(abs, "utf8")));
  let m;
  PHONE_RE.lastIndex = 0;
  while ((m = PHONE_RE.exec(text)) !== null) {
    if (digits(m[0]).length < 10) continue;
    const owner = branches.find((b) => b.phone && digits(b.phone) === digits(m[0]));
    bad(rel, 'shared template carries phone "' + m[0].trim() + '"' +
      (owner ? " (" + owner.branchName + ")" : "") +
      ", which would publish one branch's number on every branch that pastes it");
  }
  PC_RE.lastIndex = 0;
  while ((m = PC_RE.exec(text)) !== null) {
    const owner = branches.find((b) =>
      b.postalCode.replace(/\s+/g, "") === m[0].replace(/\s+/g, ""));
    bad(rel, 'shared template carries postcode "' + m[0] + '"' +
      (owner ? " (" + owner.branchName + ")" : "") +
      ", which would publish one branch's address on every branch that pastes it");
  }
  for (const b of branches) {
    if (b.disposed) continue;
    for (const name of [b.branchName, b.brandLabel]) {
      if (name && text.includes(name))
        bad(rel, 'shared template names "' + name + '", so it is not shared: ' +
          "every other branch pasting it would publish that branch's name");
    }
  }
}

// ---------------------------------------------------------------------
// Stale exceptions
// ---------------------------------------------------------------------
// A KNOWN key that no longer matches anything is a rule somebody stopped
// breaking and nobody removed. Fail on it so neither list can rot.
for (const key of Object.keys(KNOWN_PHONE))
  if (!usedKnownPhone.has(key))
    bad("KNOWN_PHONE", 'stale exception "' + key + '" no longer matches a ' +
      "number on that page. Remove it (" + KNOWN_PHONE[key].question + ").");
for (const key of Object.keys(KNOWN_SURFACE))
  if (!usedKnownSurface.has(key))
    bad("KNOWN_SURFACE", 'stale exception "' + key + '" no longer matches a ' +
      "missing surface. Remove it (" + KNOWN_SURFACE[key].question + ").");

const missing = branches.filter((b) =>
  !b.disposed && b.id !== "rbh_head_office_aintree" && !seenBranches.has(b.id));
for (const b of missing)
  console.log("NOTE no generated pages found for " + b.id + " (" + b.branchName + ")");

for (const w of warnings) console.log(w);

console.log("Checked " + pages + " pages and " + pasteBlocks +
  " paste block(s) against " + branches.length + " branches.json entries: " +
  problems + " mismatch(es), " + warnings.length + " warning(s).");
process.exit(problems ? 1 : 0);
