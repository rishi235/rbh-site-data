// Item 5.2 quality pass (eighth), 2026-09-02, unattended run via Cowork.
// Independent re-derivation. Imports nothing from tools/; own regexes, own
// address-string composition. New angle versus the seven prior passes on
// this item (link resolution, SERP lengths, ASCII, sister reciprocity,
// serviceAreaList order, blood pressure cohort, bank holiday note, own
// seoTown/phone, cross-branch seoTown, JSON-LD name vs brandLabel,
// data-branch, app-card membership): this script is the first for 5.2 to
// independently re-derive the "Get directions" button and the visible
// email contact line, both by-hand-typed surfaces distinct from the
// tel:/JSON-LD surfaces earlier passes already covered, and to run full
// cross-branch NAP isolation (phone, postcode, email) against all 16
// branches rather than only the six landing pages' own data.
//
// Never writes to modules/, core/, branches.json or any tracked file.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const branches = JSON.parse(fs.readFileSync(path.join(ROOT, 'branches.json'), 'utf8')).branches;

const PAGES = [
  { id: 'fishlocks_ainsdale', file: 'pharmacy-fishlocks-ainsdale.html' },
  { id: 'fishlocks_eccleston', file: 'pharmacy-fishlocks-eccleston.html' },
  { id: 'mccanns_aigburth', file: 'pharmacy-mccanns-aigburth.html' },
  { id: 'mccanns_sandringham', file: 'pharmacy-mccanns-sandringham.html' },
  { id: 'scorah_bramhall', file: 'pharmacy-scorah-bramhall.html' },
  { id: 'scorah_hazel', file: 'pharmacy-scorah-hazel-grove.html' },
];

let checks = 0;
let failures = [];

function digits(s) { return (s || '').replace(/\D/g, ''); }

function fail(page, rule, detail) {
  failures.push(`${page}: ${rule} - ${detail}`);
}

for (const p of PAGES) {
  const branch = branches.find(b => b.id === p.id);
  if (!branch) { fail(p.id, 'branch-lookup', 'no matching branches.json entry'); continue; }

  const filePath = path.join(ROOT, 'modules', 'branch', 'pages', p.file);
  if (!fs.existsSync(filePath)) { fail(p.id, 'file-exists', `${filePath} missing`); continue; }
  const html = fs.readFileSync(filePath, 'utf8');

  const ownAddress = `${branch.streetAddress}, ${branch.addressLocality}, ${branch.postalCode}`;

  // 1. tel: href
  checks++;
  const telMatch = html.match(/href="tel:(\+?\d+)"/);
  if (!telMatch) { fail(p.id, 'tel-href-present', 'no tel: href found'); }
  else if (digits(telMatch[1]) !== digits(branch.phone)) {
    fail(p.id, 'tel-href-match', `page has ${telMatch[1]}, branches.json has ${branch.phone}`);
  }

  // 2. visible "Call ..." button text
  checks++;
  const callTextMatch = html.match(/<span>Call ([^<]+)<\/span>/);
  if (!callTextMatch) { fail(p.id, 'call-button-text-present', 'no "Call ..." button text found'); }
  else if (digits(callTextMatch[1]) !== digits(branch.phone)) {
    fail(p.id, 'call-button-text-match', `page shows "${callTextMatch[1]}", branches.json has ${branch.phone}`);
  }

  // 3. mailto: href
  checks++;
  const mailtoMatch = html.match(/href="mailto:([^"]+)"/);
  if (!mailtoMatch) { fail(p.id, 'mailto-href-present', 'no mailto: href found'); }
  else if (mailtoMatch[1] !== branch.email) {
    fail(p.id, 'mailto-href-match', `page has ${mailtoMatch[1]}, branches.json has ${branch.email}`);
  }

  // 4. visible Email: contact line
  checks++;
  const emailLineMatch = html.match(/<strong>Email:<\/strong>\s*<a href="mailto:[^"]+">([^<]+)<\/a>/);
  if (!emailLineMatch) { fail(p.id, 'email-line-present', 'no visible Email: contact line found'); }
  else if (emailLineMatch[1] !== branch.email) {
    fail(p.id, 'email-line-match', `page shows "${emailLineMatch[1]}", branches.json has ${branch.email}`);
  }

  // 5. Get directions button, destination= param
  checks++;
  const dirMatch = html.match(/href="https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=([^"]+)"/);
  if (!dirMatch) { fail(p.id, 'directions-button-present', 'no Get directions href of the expected shape found'); }
  else {
    const decoded = decodeURIComponent(dirMatch[1]);
    if (decoded !== ownAddress) {
      fail(p.id, 'directions-destination-match', `decodes to "${decoded}", expected "${ownAddress}"`);
    }
  }

  // 6. map iframe src, q= param
  checks++;
  const mapMatch = html.match(/<iframe class="map" src="https:\/\/www\.google\.com\/maps\?q=([^&]+)&output=embed"/);
  if (!mapMatch) { fail(p.id, 'map-iframe-present', 'no map iframe of the expected shape found'); }
  else {
    const decoded = decodeURIComponent(mapMatch[1]);
    if (decoded !== ownAddress) {
      fail(p.id, 'map-query-match', `decodes to "${decoded}", expected "${ownAddress}"`);
    }
  }

  // 7. directions destination equals map query (cross-check within the page)
  if (dirMatch && mapMatch) {
    checks++;
    const dirDecoded = decodeURIComponent(dirMatch[1]);
    const mapDecoded = decodeURIComponent(mapMatch[1]);
    if (dirDecoded !== mapDecoded) {
      fail(p.id, 'directions-vs-map-agree', `directions "${dirDecoded}" != map "${mapDecoded}"`);
    }
  }

  // 8. googleReviewUrl
  checks++;
  const reviewMatch = html.match(/<strong>Google reviews:<\/strong>\s*<a href="([^"]+)"/);
  if (!reviewMatch) { fail(p.id, 'google-review-present', 'no Google reviews link found'); }
  else if (reviewMatch[1] !== branch.googleReviewUrl) {
    fail(p.id, 'google-review-match', `page has ${reviewMatch[1]}, branches.json has ${branch.googleReviewUrl}`);
  }

  // 9. nhsReviewUrl
  checks++;
  const nhsReviewMatch = html.match(/<strong>NHS website:<\/strong>\s*<a href="([^"]+)"/);
  if (!nhsReviewMatch) { fail(p.id, 'nhs-review-present', 'no NHS website link found'); }
  else if (nhsReviewMatch[1] !== branch.nhsReviewUrl) {
    fail(p.id, 'nhs-review-match', `page has ${nhsReviewMatch[1]}, branches.json has ${branch.nhsReviewUrl}`);
  }

  // 10. visible postcode in contact-line address text
  checks++;
  const addrLineMatch = html.match(/<div class="contact-line"><p>([^<]*\d[A-Z]{2}[^<]*)<\/p><\/div>/);
  if (!addrLineMatch) { fail(p.id, 'address-line-present', 'no visible address contact-line found'); }
  else if (addrLineMatch[1] !== ownAddress) {
    fail(p.id, 'address-line-match', `page shows "${addrLineMatch[1]}", expected "${ownAddress}"`);
  }

  // 11. JSON-LD email field (own re-derivation, distinct from check-jsonld.js)
  checks++;
  const jsonldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!jsonldMatch) { fail(p.id, 'jsonld-present', 'no JSON-LD block found'); }
  else {
    try {
      const ld = JSON.parse(jsonldMatch[1]);
      checks++;
      if (ld.email !== branch.email) {
        fail(p.id, 'jsonld-email-match', `JSON-LD has ${ld.email}, branches.json has ${branch.email}`);
      }
    } catch (e) {
      fail(p.id, 'jsonld-parse', e.message);
    }
  }

  // 12-14. cross-branch isolation: phone, email, postcode must not belong to
  // any OTHER branch (own branch excluded), catching copy-paste
  // contamination between shared-domain sister branches.
  for (const other of branches) {
    if (other.id === p.id) continue;
    if (other.disposed) continue;

    checks++;
    if (telMatch && digits(telMatch[1]) === digits(other.phone) && digits(other.phone) !== digits(branch.phone)) {
      fail(p.id, 'foreign-phone', `tel: href matches ${other.id}'s phone ${other.phone}`);
    }
    checks++;
    if (mailtoMatch && mailtoMatch[1] === other.email && other.email !== branch.email) {
      fail(p.id, 'foreign-email', `mailto: href matches ${other.id}'s email ${other.email}`);
    }
    checks++;
    if (addrLineMatch && other.postalCode && addrLineMatch[1].includes(other.postalCode) && other.postalCode !== branch.postalCode) {
      fail(p.id, 'foreign-postcode', `address line contains ${other.id}'s postcode ${other.postalCode}`);
    }
  }
}

console.log(`verify-5.2 (eighth pass): ${checks} checks across ${PAGES.length} pages, ${failures.length} failure(s).`);
if (failures.length) {
  failures.forEach(f => console.log('  FAIL: ' + f));
  process.exitCode = 1;
} else {
  console.log('  OK - no failures');
}
