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
    - EVERY postcode-shaped string and EVERY email-shaped string on the page
      matches the branch, the same sweep the phone got. Added on the item 1.4
      quality pass, 2026-08-12: the paste-block half of this file has swept
      postcodes since 2026-08-07, but the generated-page half read a postcode
      in exactly three places (contact line, map query, JSON-LD) and an email
      only inside a mailto href. A foreign postcode in body copy, or a
      foreign inbox written as plain text rather than a link, passed unread.
      Proved by injection on Cherry Lane's contraception page: a Bramhall
      postcode and a Fishlocks address in visible copy, and the checker
      exited 0 on both.
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
    - the sweeps above read a fact WRITTEN MORE THAN ONE WAY. Added on the
      item 1.4 quality pass, 2026-08-14. Every sweep before this one fixed
      WHERE a fact could sit and left WHAT SHAPE it could be written in at
      exactly one, so the identical wrong fact in a second spelling passed
      unread: a phone as 0151-226-2051, (0151) 226 2051, 0151.226.2051,
      0151&nbsp;226&nbsp;2051 or +44 151 226 2051; another branch's postcode
      as "sk7 3bl"; another pharmacy's trading name as "smartts chemist".
      All five phone shapes, the lower-case postcode and the lower-case name
      were injected into a live page on 2026-08-14 and this file exited 0 on
      every one of them.
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
//
// WIDENED on the item 1.4 quality pass, 2026-08-14. The sweep added on
// 2026-08-11 fixed WHERE a number could be read and left WHAT SHAPE it could
// be written in at exactly one: digits separated by spaces, with a leading
// zero. The same wrong number written 0151-226-2051, (0151) 226 2051,
// 0151.226.2051, 0151&nbsp;226&nbsp;2051 or +44 151 226 2051 was invisible to
// every rule in this file. That is the same failure as the "Call us on"
// number in August, one layer down: the reader moved, the shape did not.
// Separators allowed between digits are the space, the hyphen, the full stop
// and round brackets; the +44 international prefix is allowed in place of the
// leading zero. The 10-or-11-digit filter below still does the real narrowing,
// so a wider match here cannot flag an ordinary number in copy.
// WIDENED AGAIN on the item 1.4 quality pass, 2026-08-29, one notch along
// the same axis: the 2026-08-14 widening allowed up to TWO separator
// characters between digit groups, so a number written with a spaced
// hyphen or full stop ("0161 - 439 - 3744", three characters between the
// groups) still passed every rule in this file, while "0161- 439 -3744"
// was caught. Proved by injection on the Cherry Lane contraception page.
// Three is enough for every spaced single-separator style a human types;
// the 10-to-12-digit shape still does the real narrowing, and the whole
// estate exits 0 under the wider run, so it does not cry wolf today.
const PHONE_RE = /(?:\+\s?44[\s.()-]*|\b0)\d(?:[\s.()-]{0,3}\d){8,10}\b/g;

// Reduce a written number to its national form: drop every separator, and
// turn a +44 international prefix into the leading 0 it stands in for, so
// "+44 151 226 2051" and "0151 226 2051" compare equal. digits() is left
// alone because tel: hrefs and JSON-LD telephone are machine fields that are
// already written in one shape.
const phoneDigits = (s) => {
  const t = String(s || "").trim();
  let d = t.replace(/\D/g, "");
  if (/^\+\s?4\s?4/.test(t)) {
    d = d.replace(/^44/, "");
    if (d.charAt(0) !== "0") d = "0" + d;
  }
  return d;
};
// A UK postcode as it appears in copy, always upper case.
const PC_RE = /\b[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}\b/g;
// An email address as it appears in copy or inside a mailto href.
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// RFC 2606 reserves example.com/.net/.org for documentation, so an address
// there can never be a real inbox and can never be a wrong contact fact.
// The form placeholder "name@example.com" on 142 pages is the case in point.
// Real addresses are NOT excluded by where they sit: a branch address in a
// placeholder attribute would still be swept and would still have to be the
// branch's own.
const isReservedEmail = (e) => /@example\.(com|net|org)$/i.test(e);

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

// A postcode-shaped string that is not the branch's postcode, and an
// email-shaped string that belongs to nobody in branches.json, that are
// legitimate anyway. Same contract as KNOWN_PHONE: keyed
// "<filename>::<the string as written>", and a stale key fails the run.
const KNOWN_POSTCODE = {};
const KNOWN_EMAIL = {};

// Another branch's trading name, or another branch's street address, that
// legitimately appears on this page. Same contract as the lists above:
// keyed "<filename>::<the string as written>", and a stale key fails the run.
const KNOWN_NAME = {};
const KNOWN_STREET = {};

// Pages HTML-escape text and attribute values; decode before comparing.
// The non-breaking space is decoded to an ordinary space, and a literal
// U+00A0 is normalised to one, because every sweep in this file separates
// the parts of a fact on whitespace. Without this, "0151&nbsp;226&nbsp;2051"
// and "202&nbsp;Cherry Lane" are not the same strings as the ones the rules
// are looking for, and a wrong number or a wrong street written that way
// reads correctly to the public and passes unread here. Added on the item
// 1.4 quality pass, 2026-08-14.
const unesc = (s) => s === null || s === undefined ? s : String(s)
  .replace(/&nbsp;|&#160;|&#xa0;/gi, " ").replace(/\u00a0/g, " ")
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
const usedKnownPostcode = new Set();
const usedKnownEmail = new Set();
const usedKnownName = new Set();
const usedKnownStreet = new Set();

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
    // Lower-cased once for the case-insensitive sweeps below (foreign
    // postcode, name, street). Declared here rather than beside the first of
    // them so all three read the same haystack.
    const sweptLower = swept.toLowerCase();
    PHONE_RE.lastIndex = 0;
    let pm;
    while ((pm = PHONE_RE.exec(swept)) !== null) {
      const raw = pm[0].trim().replace(/\s+/g, " ");
      const d = phoneDigits(raw);
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

    // --- POSTCODE SWEEP ------------------------------------------------
    // The paste-block half of this file has swept every postcode-shaped
    // string since 2026-08-07. The generated-page half read a postcode in
    // exactly three places: the contact line, the map query and the JSON-LD
    // block. A foreign postcode anywhere else in body copy passed unread,
    // proved by injection on 2026-08-12. Sweep the whole page the way the
    // phone sweep does. The map query never trips this: its postcode is
    // URL-encoded, so PC_RE cannot see it, and it has its own rule above.
    const normPC = (s) => s.replace(/\s+/g, " ").trim();
    PC_RE.lastIndex = 0;
    let pcm;
    while ((pcm = PC_RE.exec(swept)) !== null) {
      const raw = normPC(pcm[0]);
      if (raw === normPC(b.postalCode)) continue;
      const key = file + "::" + raw;
      if (KNOWN_POSTCODE[key]) {
        usedKnownPostcode.add(key);
        warn(rel, 'KNOWN postcode "' + raw + '". ' + KNOWN_POSTCODE[key].question +
          ": " + KNOWN_POSTCODE[key].reason);
        continue;
      }
      const other = branches.find((x2) =>
        x2.postalCode && normPC(x2.postalCode) === raw);
      if (other)
        bad(rel, 'postcode "' + raw + '" belongs to ' + other.branchName + ", not " +
          b.branchName);
      else
        bad(rel, 'postcode-shaped string "' + raw + '" is not ' + b.branchName +
          "'s postcode in branches.json");
    }

    // --- FOREIGN POSTCODE, WRITTEN IN ANY CASE -------------------------
    // PC_RE has no /i flag, on the stated assumption that a postcode in copy
    // is "always upper case". That is a convention, not a fact, and it is the
    // shape half of the same blind spot the phone had: the sweep above reads
    // WHERE a postcode may sit but only ONE way of writing it, so another
    // branch's postcode typed "sk7 3bl" or "Sk7 3bl" passed unread. Proved by
    // injection on 2026-08-14.
    //
    // The fix is deliberately narrow rather than putting /i on PC_RE. Matched
    // case-insensitively, the postcode shape (letters, digit, optional
    // character, digit, two letters) also fits ordinary copy such as
    // "vitamin B12 3rd", and this checker's whole value is that it does not
    // cry wolf. So this rule looks only for a string that IS another live
    // branch's postcode, which can never be innocent on this page. An
    // unrecognised lower-case postcode-shaped string is left alone, and that
    // is stated rather than hidden.
    for (const other of branches) {
      if (other.id === b.id || !other.postalCode) continue;
      if (other.postalCode.replace(/\s+/g, " ").toUpperCase() ===
        b.postalCode.replace(/\s+/g, " ").toUpperCase()) continue;
      const want = other.postalCode.replace(/\s+/g, " ").toLowerCase();
      // The spaceless form too ("sk73lq"), added 2026-08-29: PC_RE reads
      // SK73LQ because its space is optional, but this rule's indexOf only
      // knew the spaced spelling, so the same foreign postcode written
      // lower case AND without its space passed unread. Proved by
      // injection. Boundary-guarded so a longer token that merely contains
      // the letters cannot fire it.
      const wantBare = other.postalCode.replace(/\s+/g, "").toLowerCase();
      let at = sweptLower.indexOf(want);
      let matchLen = other.postalCode.length;
      if (at === -1) {
        const bareRe = new RegExp("(?<![a-z0-9])" + wantBare + "(?![a-z0-9])");
        const bm = bareRe.exec(sweptLower);
        if (!bm) continue;
        at = bm.index;
        matchLen = wantBare.length;
      }
      const asWritten = swept.substr(at, matchLen);
      // An all-upper-case occurrence is already reported by the sweep above.
      // Reporting it twice would not add anything.
      if (asWritten === asWritten.toUpperCase()) continue;
      const key = file + "::" + asWritten;
      if (KNOWN_POSTCODE[key]) {
        usedKnownPostcode.add(key);
        warn(rel, 'KNOWN postcode "' + asWritten + '". ' +
          KNOWN_POSTCODE[key].question + ": " + KNOWN_POSTCODE[key].reason);
        continue;
      }
      bad(rel, 'postcode "' + asWritten + '" belongs to ' + other.branchName +
        ", not " + b.branchName + ". Written in mixed or lower case, so the " +
        "upper-case postcode sweep could not see it");
    }

    // --- EMAIL SWEEP ---------------------------------------------------
    // The mailto rule above only reads an address inside an anchor. An email
    // written as plain text ("write to x@y any time") was invisible, proved
    // by injection on 2026-08-12. Sweep every email-shaped string; each must
    // be one of the branch's own two published addresses.
    EMAIL_RE.lastIndex = 0;
    let em;
    while ((em = EMAIL_RE.exec(swept)) !== null) {
      const raw = em[0].toLowerCase();
      if (isReservedEmail(raw)) continue;
      if (ownEmails.some((e) => e.toLowerCase() === raw)) continue;
      const key = file + "::" + em[0];
      if (KNOWN_EMAIL[key]) {
        usedKnownEmail.add(key);
        warn(rel, 'KNOWN email "' + em[0] + '". ' + KNOWN_EMAIL[key].question +
          ": " + KNOWN_EMAIL[key].reason);
        continue;
      }
      const other = branches.find((o) =>
        [o.email, o.nhsEmail].filter(Boolean)
          .some((e) => e.toLowerCase() === raw));
      if (other)
        bad(rel, 'email "' + em[0] + '" belongs to ' + other.id + ", not " + b.id);
      else
        bad(rel, 'email-shaped string "' + em[0] + '" is not an address of ' +
          b.id + " in branches.json");
    }

    // --- NAME SWEEP ----------------------------------------------------
    // The N in NAP, and until the item 1.4 quality pass of 2026-08-13 the
    // one surface this file never swept. The name was read in exactly two
    // structured fields, data-branch and JSON-LD name, and check-branch-
    // identity reads the same two plus link targets. Neither reads BODY
    // COPY, so another pharmacy's trading name written into a sentence on
    // this page was invisible to all 29 checkers. That is the McCanns
    // Sandringham failure shape, one branch's copy left on another, and the
    // paste-block half of this very file has had the rule since 2026-08-07
    // ("must name its own branch, and must not name another"); the
    // generated half, which is 177 pages against 3, did not.
    // Proved by injection on Cherry Lane's contraception page: the visible
    // sentence "You can also visit Smartts Chemist at 42 Fernhill Road for
    // this service" published a foreign pharmacy and a foreign street, and
    // all 29 checkers exited 0.
    // Branches sharing this brandLabel are skipped: a sister branch on a
    // shared domain is legitimately named by the item 2.2 "our other
    // branch" block, and its LINK is already policed by check-branch-
    // identity rule 9.
    // Matched without regard to case, added on the item 1.4 quality pass of
    // 2026-08-14. The rule was written as an exact-string includes(), so
    // "smartts chemist" in a sentence, or a name typed in capitals in a
    // heading, published a foreign pharmacy and passed. Case cannot make a
    // trading name innocent, and a brand label is distinctive enough that
    // matching it loosely cannot flag ordinary copy.
    for (const other of branches) {
      if (other.brandLabel === b.brandLabel) continue;
      for (const nm of [other.branchName, other.brandLabel]) {
        if (!nm || !sweptLower.includes(nm.toLowerCase())) continue;
        const key = file + "::" + nm;
        if (KNOWN_NAME[key]) {
          usedKnownName.add(key);
          warn(rel, 'KNOWN name "' + nm + '". ' + KNOWN_NAME[key].question +
            ": " + KNOWN_NAME[key].reason);
          continue;
        }
        bad(rel, 'names another pharmacy "' + nm + '" (' + other.id +
          ") in page copy, but this page belongs to " + b.branchName);
        break;
      }
    }

    // --- STREET SWEEP --------------------------------------------------
    // The street half of the A in NAP. The postcode sweep added on
    // 2026-08-12 catches a foreign address only when a postcode is written
    // beside it; a street line on its own ("42 Fernhill Road") carries no
    // postcode shape and passed unread. The contact line, map query and
    // JSON-LD each check a street, but only in their own fixed place, which
    // is the identical blind spot the phone had in August and the postcode
    // had yesterday. Branches sharing this street are skipped: Clear
    // Chemist and RB Healthcare Ltd Head Office are both Unit 20 Brookfield
    // Trade Centre, so that string is not foreign on either.
    // Matched without regard to case for the same reason as the name sweep
    // above. A street line is not less foreign for being written in lower
    // case or in a capitalised heading.
    for (const other of branches) {
      if (!other.streetAddress || other.streetAddress === b.streetAddress) continue;
      if (!sweptLower.includes(other.streetAddress.toLowerCase())) continue;
      const key = file + "::" + other.streetAddress;
      if (KNOWN_STREET[key]) {
        usedKnownStreet.add(key);
        warn(rel, 'KNOWN street "' + other.streetAddress + '". ' +
          KNOWN_STREET[key].question + ": " + KNOWN_STREET[key].reason);
        continue;
      }
      bad(rel, 'carries another branch\'s street address "' +
        other.streetAddress + '" (' + other.id + '), but this page belongs to ' +
        b.branchName + ' at "' + b.streetAddress + '"');
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
      if (phoneDigits(m[0]).length < 10) continue;
      sawPhone = true;
      if (phoneDigits(m[0]) !== digits(b.phone))
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

    // The post town, which is the gap between the two rules above. Added on
    // the item 3.4 quality pass, 2026-08-13. The postcode sweep proves the
    // postcode is the branch's own and that the street sits in front of it,
    // and then stops. Nothing had ever read the words BETWEEN them, which is
    // exactly where the post town lives, so a block could publish
    // "202 Cherry Lane, Bramhall L4 8SG" and pass every rule in this file.
    //
    // Cherry Lane's own two blocks were the live case, and the fault was an
    // EXTRA true word rather than a false one. Both wrote "202 Cherry Lane,
    // Walton, Liverpool L4 8SG", putting the seoTown inside a postal address.
    // CLAUDE.md gives seoTown one job, "the catchment town used in page titles
    // and H1", and branches.json, all 177 generated pages and gbp-packs/
    // cherry-lane-walton.md all publish "202 Cherry Lane, Liverpool L4 8SG".
    // So one shop was handing the public two different address strings out of
    // one repo, which is the citation-consistency fault item 1.4 exists to
    // stop. These two files are the only place in the repo where a human wrote
    // an address as prose rather than a generator composing it from the data,
    // and they are the only two that drifted.
    //
    // The rule is equality, not containment, because the fault was an extra
    // word: what sits between the street and the postcode must be the branch's
    // own addressLocality and nothing else, commas and full stops aside.
    PC_RE.lastIndex = 0;
    while ((m = PC_RE.exec(text)) !== null) {
      const upto = text.slice(0, m.index).replace(/\s+/g, " ");
      const at = upto.lastIndexOf(b.streetAddress);
      if (at === -1) continue; // the street rule above has already failed this
      const between = upto.slice(at + b.streetAddress.length)
        .replace(/[,.]/g, " ").replace(/\s+/g, " ").trim();
      if (between !== b.addressLocality)
        bad(rel, 'the address reads "' + b.streetAddress +
          (between ? ", " + between : "") + " " + m[0] +
          '" but branches.json holds the post town as "' + b.addressLocality +
          '". One shop published with two address strings splits its own ' +
          "citations, and seoTown belongs in a title, not in an address");
    }

    // --- FOREIGN POSTCODE, WRITTEN IN ANY CASE ------------------------
    // Added on the item 1.4 quality pass, 2026-08-29. The generated pages
    // have had this rule since 2026-08-14; the paste blocks, whose
    // postcode sweep above is PC_RE and therefore upper-case only, never
    // got it, so another branch's postcode typed "sk7 3lq" or "sk73lq"
    // in a block passed unread. Same narrow shape as the generated rule:
    // only a string that IS another live branch's postcode fires, an
    // unrecognised lower-case postcode-shaped string is left alone, and
    // an all-upper-case occurrence is skipped because PC_RE already
    // reports it.
    const textLower = text.toLowerCase();
    for (const other of branches) {
      if (other.id === b.id || !other.postalCode) continue;
      if (other.postalCode.replace(/\s+/g, " ").toUpperCase() ===
        b.postalCode.replace(/\s+/g, " ").toUpperCase()) continue;
      const wantPc = other.postalCode.replace(/\s+/g, " ").toLowerCase();
      const wantPcBare = other.postalCode.replace(/\s+/g, "").toLowerCase();
      let pcAt = textLower.indexOf(wantPc);
      let pcLen = other.postalCode.length;
      if (pcAt === -1) {
        const bareRe = new RegExp("(?<![a-z0-9])" + wantPcBare + "(?![a-z0-9])");
        const bm = bareRe.exec(textLower);
        if (!bm) continue;
        pcAt = bm.index;
        pcLen = wantPcBare.length;
      }
      const pcAsWritten = text.substr(pcAt, pcLen);
      if (pcAsWritten === pcAsWritten.toUpperCase()) continue;
      bad(rel, 'postcode "' + pcAsWritten + '" belongs to ' + other.branchName +
        ", not " + b.branchName + ". Written in mixed or lower case, so the " +
        "upper-case postcode sweep could not see it");
    }

    // Emails got the generated-page sweep on 2026-08-12; the paste blocks
    // get the same rule for the same reason. A foreign inbox in a block
    // lands on the public site with nothing in between.
    const pasteOwnEmails = [b.email, b.nhsEmail].filter(Boolean);
    EMAIL_RE.lastIndex = 0;
    while ((m = EMAIL_RE.exec(text)) !== null) {
      const raw = m[0].toLowerCase();
      if (isReservedEmail(raw)) continue;
      if (pasteOwnEmails.some((e) => e.toLowerCase() === raw)) continue;
      const key = file + "::" + m[0];
      if (KNOWN_EMAIL[key]) {
        usedKnownEmail.add(key);
        warn(rel, 'KNOWN email "' + m[0] + '". ' + KNOWN_EMAIL[key].question +
          ": " + KNOWN_EMAIL[key].reason);
        continue;
      }
      const other = branches.find((o) =>
        [o.email, o.nhsEmail].filter(Boolean)
          .some((e) => e.toLowerCase() === raw));
      bad(rel, 'email "' + m[0] + '" is not an address of ' + b.id +
        (other ? ", it belongs to " + other.id : ", and belongs to no branch"));
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
    if (phoneDigits(m[0]).length < 10) continue;
    const owner = branches.find((b) => b.phone && digits(b.phone) === phoneDigits(m[0]));
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
  EMAIL_RE.lastIndex = 0;
  while ((m = EMAIL_RE.exec(text)) !== null) {
    if (isReservedEmail(m[0])) continue;
    const owner = branches.find((b) =>
      [b.email, b.nhsEmail].filter(Boolean)
        .some((e) => e.toLowerCase() === m[0].toLowerCase()));
    bad(rel, 'shared template carries email "' + m[0] + '"' +
      (owner ? " (" + owner.id + ")" : "") +
      ", which would publish one branch's inbox on every branch that pastes it");
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
for (const key of Object.keys(KNOWN_POSTCODE))
  if (!usedKnownPostcode.has(key))
    bad("KNOWN_POSTCODE", 'stale exception "' + key + '" no longer matches a ' +
      "postcode on that page. Remove it (" + KNOWN_POSTCODE[key].question + ").");
for (const key of Object.keys(KNOWN_EMAIL))
  if (!usedKnownEmail.has(key))
    bad("KNOWN_EMAIL", 'stale exception "' + key + '" no longer matches an ' +
      "email on that page. Remove it (" + KNOWN_EMAIL[key].question + ").");
for (const key of Object.keys(KNOWN_NAME))
  if (!usedKnownName.has(key))
    bad("KNOWN_NAME", 'stale exception "' + key + '" no longer matches a ' +
      "name on that page. Remove it (" + KNOWN_NAME[key].question + ").");
for (const key of Object.keys(KNOWN_STREET))
  if (!usedKnownStreet.has(key))
    bad("KNOWN_STREET", 'stale exception "' + key + '" no longer matches a ' +
      "street address on that page. Remove it (" + KNOWN_STREET[key].question + ").");

const missing = branches.filter((b) =>
  !b.disposed && b.id !== "rbh_head_office_aintree" && !seenBranches.has(b.id));
for (const b of missing)
  console.log("NOTE no generated pages found for " + b.id + " (" + b.branchName + ")");

for (const w of warnings) console.log(w);

console.log("Checked " + pages + " pages and " + pasteBlocks +
  " paste block(s) against " + branches.length + " branches.json entries: " +
  problems + " mismatch(es), " + warnings.length + " warning(s).");
process.exit(problems ? 1 : 0);
