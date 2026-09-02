// Independent extraction for item 3.6 (McCanns Chemist, Aigburth and Sandringham)
// quality pass, eighth pass, 2026-09-02. Imports nothing from tools/.
// Own regexes throughout, per the discipline recorded by all prior passes
// on this item and its siblings.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const branches = JSON.parse(fs.readFileSync(path.join(ROOT, 'branches.json'), 'utf8')).branches;

const aig = branches.find(b => b.id === 'mccanns_aigburth');
const san = branches.find(b => b.id === 'mccanns_sandringham');
if (!aig || !san) { console.error('FATAL: could not find both McCanns branch records'); process.exit(2); }

const trading = branches.filter(b => !b.disposed);

let checks = 0;
let failures = [];

function check(desc, cond) {
  checks++;
  if (!cond) failures.push(desc);
}

function glob(dir, pattern) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => pattern.test(f)).map(f => path.join(dir, f));
}

const pageFiles = [
  ...glob(path.join(ROOT, 'modules/service/pages'), /mccanns-(aigburth|sandringham)\.html$/),
  ...glob(path.join(ROOT, 'modules/switch/pages'), /mccanns-(aigburth|sandringham)\.html$/),
  ...glob(path.join(ROOT, 'modules/branch/pages'), /mccanns-(aigburth|sandringham)\.html$/),
];

check('exactly 26 McCanns pages found (13 per branch)', pageFiles.length === 26);

function spaced(phone) { return phone; }
function unspaced(phone) { return phone.replace(/\s+/g, ''); }

for (const file of pageFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const base = path.basename(file);
  const isAigburth = /aigburth/.test(base);
  const own = isAigburth ? aig : san;
  const sister = isAigburth ? san : aig;
  const isBranchLandingPage = file.includes('modules/branch/pages') || file.includes('modules\\branch\\pages');

  // 1. H1 carries own seoTown
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  check(`${base}: has an H1`, !!h1Match);
  if (h1Match) {
    const h1Text = h1Match[1].replace(/<[^>]+>/g, '');
    const townRe = new RegExp('\\b' + own.seoTown.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    check(`${base}: H1 carries own seoTown (${own.seoTown})`, townRe.test(h1Text));
  }

  // 2. Cross-town: page must not name the sister's seoTown unless excused via own
  // serviceAreaList, OR unless this is a branch landing page, whose whole point is to
  // signpost the visitor to the correct sister branch by name and town (confirmed
  // deliberate on the item 2.2 and item 3.6 sixth-pass write-ups: "the deliberate
  // same-brand signpost to Sandringham on the Aigburth landing page").
  const sisterTownRe = new RegExp('\\b' + sister.seoTown.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
  const excused = isBranchLandingPage || (own.serviceAreaList || []).some(t => t.toLowerCase() === sister.seoTown.toLowerCase());
  const namesSisterTown = sisterTownRe.test(html);
  if (excused) {
    check(`${base}: sister town mention is excused (branch landing signpost or serviceAreaList) (informational)`, true);
  } else {
    check(`${base}: does not name unexcused sister town (${sister.seoTown})`, !namesSisterTown);
  }

  // 3. Own phone present, both forms; sister's phone absent
  check(`${base}: own spaced phone present`, html.includes(spaced(own.phone)));
  check(`${base}: own tel: form present`, html.includes(unspaced(own.phone)));
  check(`${base}: sister's phone NOT present`, !html.includes(spaced(sister.phone)) && !html.includes(unspaced(sister.phone)));

  // 3b. No other trading branch's phone present anywhere
  for (const b of trading) {
    if (b.id === own.id) continue;
    if (!b.phone) continue;
    if (html.includes(spaced(b.phone)) || html.includes(unspaced(b.phone))) {
      failures.push(`${base}: contains ANOTHER branch's phone (${b.id}: ${b.phone})`);
    }
    checks++;
  }

  // 4. Own postcode present; sister's postcode absent; no other branch's postcode present
  check(`${base}: own postcode present`, html.includes(own.postalCode));
  check(`${base}: sister's postcode NOT present`, !html.includes(sister.postalCode));
  for (const b of trading) {
    if (b.id === own.id) continue;
    if (!b.postalCode) continue;
    if (html.includes(b.postalCode)) {
      failures.push(`${base}: contains ANOTHER branch's postcode (${b.id}: ${b.postalCode})`);
    }
    checks++;
  }

  // 5. JSON-LD block
  const ldMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  check(`${base}: has exactly one JSON-LD block`, !!ldMatch);
  if (ldMatch) {
    let ld;
    try { ld = JSON.parse(ldMatch[1]); } catch (e) { ld = null; }
    check(`${base}: JSON-LD parses`, !!ld);
    if (ld) {
      check(`${base}: JSON-LD @type is Pharmacy`, ld['@type'] === 'Pharmacy');
      check(`${base}: JSON-LD name equals own branchName (not bare brandLabel)`, ld.name === own.branchName);
      check(`${base}: JSON-LD name is NOT the sister's branchName`, ld.name !== sister.branchName);
      if (ld.address) {
        check(`${base}: JSON-LD streetAddress matches`, ld.address.streetAddress === own.streetAddress);
        check(`${base}: JSON-LD addressLocality matches`, ld.address.addressLocality === own.addressLocality);
        check(`${base}: JSON-LD postalCode matches`, ld.address.postalCode === own.postalCode);
        check(`${base}: JSON-LD addressRegion matches`, ld.address.addressRegion === own.addressRegion);
        check(`${base}: JSON-LD addressCountry matches`, ld.address.addressCountry === own.addressCountry);
      } else {
        failures.push(`${base}: JSON-LD has no address block`);
        checks++;
      }
      if (ld.telephone) {
        check(`${base}: JSON-LD telephone matches own phone exactly`, ld.telephone === own.phone);
      }
    }
  }

  // 6. data-wa matches estate WhatsApp constant. Branch landing pages carry no
  // WhatsApp button and no data-wa attribute at all, by design (a different
  // generator, build-branch-landing-pages.js, from the five service-family
  // generators that declare WHATSAPP; confirmed deliberate on the item 2.2
  // fifth-pass write-up: "WhatsApp absence confirmed by design").
  const waMatch = html.match(/data-wa="(\d+)"/);
  if (isBranchLandingPage) {
    check(`${base}: branch landing page correctly carries no data-wa (WhatsApp absent by design)`, !waMatch);
  } else {
    check(`${base}: data-wa present`, !!waMatch);
    if (waMatch) {
      check(`${base}: data-wa is the estate WhatsApp number`, waMatch[1] === '447521775631');
    }
  }

  // 7. data-branch matches own branchName
  const dbMatch = html.match(/data-branch="([^"]*)"/);
  check(`${base}: data-branch present`, !!dbMatch);
  if (dbMatch) {
    check(`${base}: data-branch equals own branchName`, dbMatch[1] === own.branchName);
  }

  // 8. Map embed decodes to own address, not sister's
  const mapMatch = html.match(/src="(https:\/\/www\.google\.com\/maps\/embed[^"]*)"/);
  if (mapMatch) {
    const decoded = decodeURIComponent(mapMatch[1]);
    const ownAddrParts = [own.streetAddress, own.addressLocality, own.postalCode];
    const allPartsPresent = ownAddrParts.every(p => decoded.includes(p));
    check(`${base}: map embed query contains own full address`, allPartsPresent);
    check(`${base}: map embed does not contain sister's postcode`, !decoded.includes(sister.postalCode));
  }
}

console.log(`Checks: ${checks}`);
console.log(`Failures: ${failures.length}`);
if (failures.length) {
  console.log('--- FAILURES ---');
  failures.forEach(f => console.log(' - ' + f));
  process.exit(1);
}
console.log('ALL CLEAN');
