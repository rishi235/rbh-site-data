// Independent fifth-pass verification of the 12 Hirshmans Ainsdale pages.
// Written fresh for this run. Shares no code with tools/ on purpose: where it
// agrees with the checkers it does so by arriving separately.
const fs = require('fs');
const path = require('path');

const REPO = 'C:\\Dev\\rbh-site-data';
const data = JSON.parse(fs.readFileSync(path.join(REPO, 'branches.json'), 'utf8'));
const me = data.branches.find(b => b.id === 'hirshmans_ainsdale');
const others = data.branches.filter(b => b.id !== 'hirshmans_ainsdale');

const dirs = [
  'modules\\service\\pages',
  'modules\\switch\\pages',
  'modules\\branch\\pages',
];
let files = [];
for (const d of dirs) {
  const full = path.join(REPO, d);
  if (!fs.existsSync(full)) continue;
  for (const f of fs.readdirSync(full)) {
    if (/-hirshmans-ainsdale\.html$/i.test(f)) files.push(path.join(full, f));
  }
}
files.sort();

let checks = 0, fails = [];
function ck(file, name, cond, detail) {
  checks++;
  if (!cond) fails.push(`${path.basename(file)} :: ${name}${detail ? ' :: ' + detail : ''}`);
}

const digits = s => (s || '').replace(/\D/g, '');
const myPhoneDigits = digits(me.phone);

// foreign token sets
const foreignBrands = [...new Set(others.map(b => b.brandLabel))].filter(x => x && x !== me.brandLabel);
const foreignTowns = [...new Set(others.map(b => b.seoTown))]
  .filter(t => t && !me.serviceAreaList.includes(t) && t !== me.seoTown);
const foreignPhones = [...new Set(others.map(b => digits(b.phone)))].filter(p => p && p !== myPhoneDigits);
const foreignPostcodes = [...new Set(others.map(b => b.postalCode))].filter(p => p && p !== me.postalCode);
const myWidgetIds = Object.values(me.widgets || {});
const foreignWidgetIds = [...new Set(others.flatMap(b => Object.values(b.widgets || {})))]
  .filter(w => w && !myWidgetIds.includes(w));

console.log('FILES FOUND: ' + files.length);
files.forEach(f => console.log('  ' + path.basename(f)));
console.log('');

const titleLens = [], descLens = [];

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');

  // 1. title + description live in the paste-block comment header
  const tm = raw.match(/Weebly page SEO title:\s*(.+)/);
  const dm = raw.match(/Weebly page SEO description:\s*(.+)/);
  ck(file, 'has SEO title line', !!tm);
  ck(file, 'has SEO description line', !!dm);
  const title = tm ? tm[1].trim() : '';
  const desc = dm ? dm[1].trim() : '';

  if (title) {
    titleLens.push(title.length);
    ck(file, 'title <= 65 chars', title.length <= 65, `${title.length}: ${title}`);
    ck(file, 'title >= 30 chars', title.length >= 30, `${title.length}`);
    ck(file, 'title carries seoTown', title.includes(me.seoTown), title);
    ck(file, 'title carries brandLabel', title.includes(me.brandLabel), title);
  }
  if (desc) {
    descLens.push(desc.length);
    ck(file, 'description within 80-165', desc.length >= 80 && desc.length <= 165, `${desc.length}`);
    ck(file, 'description carries seoTown', desc.includes(me.seoTown), desc);
  }

  // 2. exactly one H1, carrying the seoTown
  const h1s = [...raw.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m =>
    m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
  ck(file, 'exactly one H1', h1s.length === 1, `found ${h1s.length}: ${JSON.stringify(h1s)}`);
  h1s.forEach((h, i) => ck(file, `H1[${i}] carries seoTown`, h.includes(me.seoTown), h));

  // 3. NAP: phone, postcode, street
  ck(file, 'display phone present', raw.includes(me.phone), me.phone);
  ck(file, 'tel: link present', raw.includes('tel:' + myPhoneDigits), 'tel:' + myPhoneDigits);
  ck(file, 'postcode present', raw.includes(me.postalCode), me.postalCode);

  // 4. no foreign tokens
  for (const b of foreignBrands) ck(file, 'no foreign brand', !raw.includes(b), b);
  for (const t of foreignTowns) ck(file, 'no foreign town', !new RegExp(`\\b${t}\\b`).test(raw), t);
  for (const p of foreignPhones) ck(file, 'no foreign phone digits', !raw.replace(/\D/g, '').includes(p), p);
  for (const p of foreignPostcodes) ck(file, 'no foreign postcode', !raw.includes(p), p);
  for (const w of foreignWidgetIds) ck(file, 'no foreign widget id', !raw.includes(w), w);

  // 5. only this branch's postcode shape anywhere
  const pcs = [...new Set((raw.match(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}\b/g) || [])
    .map(s => s.replace(/\s+/g, ' ').toUpperCase()))];
  ck(file, 'no other postcode present', pcs.every(p => p === me.postalCode), JSON.stringify(pcs));

  // 6. no phone-shaped number other than this branch's
  const phones = [...new Set((raw.match(/\b0\d{3}\s?\d{3}\s?\d{3,4}\b/g) || []).map(digits))];
  ck(file, 'no other phone-shaped number', phones.every(p => p === myPhoneDigits), JSON.stringify(phones));

  // 7. repo copy rules
  const visible = raw.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '));
  const DASH = new RegExp('[' + String.fromCharCode(0x2013,0x2014) + ']');
  const DASH_ENT = /&(?:mdash|ndash|#8212|#8211|#[xX]201[34]);/;
  ck(file, 'no em/en dash in visible copy', !DASH.test(visible));
  ck(file, 'no dash entity in visible copy', !DASH_ENT.test(visible));
  ck(file, 'no dash in pasteable SEO title', !DASH.test(title) && !DASH_ENT.test(title), title);
  ck(file, 'no dash in pasteable SEO description', !DASH.test(desc) && !DASH_ENT.test(desc), desc);
  ck(file, 'no emoji', !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(visible));

  // 8. slug carries the town
  ck(file, 'filename carries townSlug', path.basename(file).includes(me.townSlug));
}

// 9. JSON-LD, wherever it is carried
const withJsonLd = files.filter(f => /application\/ld\+json/i.test(fs.readFileSync(f, 'utf8')));
console.log(`PAGES CARRYING JSON-LD: ${withJsonLd.length} of ${files.length}`);
for (const file of withJsonLd) {
  const raw = fs.readFileSync(file, 'utf8');
  const blocks = [...raw.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of blocks) {
    let obj = null;
    try { obj = JSON.parse(b[1].trim()); } catch (e) { /* noted below */ }
    ck(file, 'JSON-LD parses', !!obj, (e => e)(b[1].slice(0, 80)));
    if (!obj) continue;
    const nodes = Array.isArray(obj) ? obj : [obj];
    for (const n of nodes) {
      const a = n.address;
      if (!a) continue;
      ck(file, 'JSON-LD addressLocality', a.addressLocality === me.addressLocality, String(a.addressLocality));
      ck(file, 'JSON-LD addressRegion', a.addressRegion === me.addressRegion, String(a.addressRegion));
      ck(file, 'JSON-LD postalCode', a.postalCode === me.postalCode, String(a.postalCode));
      ck(file, 'JSON-LD streetAddress', a.streetAddress === me.streetAddress, String(a.streetAddress));
    }
  }
}

console.log('');
console.log('TITLE LENGTHS: ' + Math.min(...titleLens) + ' to ' + Math.max(...titleLens));
console.log('DESC LENGTHS:  ' + Math.min(...descLens) + ' to ' + Math.max(...descLens));
console.log('');
console.log('CHECKS RUN: ' + checks);
console.log('FAILURES:   ' + fails.length);
fails.forEach(f => console.log('  FAIL ' + f));
process.exit(fails.length ? 1 : 0);
