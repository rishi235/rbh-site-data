// Independent extraction for item 3.11 quality pass, 2026-09-01.
// Gordon Short Chemist Crosby - 12 generated pages.
// Imports NOTHING from tools/. Own regexes throughout, composed only from
// branches.json, per repo convention (CLAUDE.md, "Expected values are
// composed from branches.json rather than imported from the generators").

const fs = require('fs');
const path = require('path');

const branches = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'branches.json'), 'utf8'));
const b = branches.branches.find(x => x.id === 'gordonshorts_crosby');
if (!b) { console.error('FATAL: gordonshorts_crosby not found in branches.json'); process.exit(1); }

const pagesDir = path.join(__dirname, '..', 'modules', 'service', 'pages');
const switchDir = path.join(__dirname, '..', 'modules', 'switch', 'pages');

const files = [
  'contraception-gordon-short-crosby.html',
  'earache-treatment-gordon-short-crosby.html',
  'impetigo-treatment-gordon-short-crosby.html',
  'insect-bite-treatment-gordon-short-crosby.html',
  'pharmacy-first-gordon-short-crosby.html',
  'shingles-treatment-gordon-short-crosby.html',
  'sinusitis-treatment-gordon-short-crosby.html',
  'sore-throat-treatment-gordon-short-crosby.html',
  'travel-clinic-gordon-short-crosby.html',
  'uti-treatment-gordon-short-crosby.html',
  'weight-loss-clinic-gordon-short-crosby.html',
].map(f => ({ f, full: path.join(pagesDir, f) }));
files.push({ f: 'switch-prescriptions-gordon-short-crosby.html', full: path.join(switchDir, 'switch-prescriptions-gordon-short-crosby.html') });

let checks = 0, failures = 0;
const fail = (page, msg) => { failures++; console.log('FAIL [' + page + ']: ' + msg); };
const check = (cond, page, msg) => { checks++; if (!cond) fail(page, msg); };

// Other trading branches, to prove no cross-contamination.
const others = branches.branches.filter(x => x.id !== b.id && !x.disposed);

const spacedPhone = b.phone; // "0151 924 3449"
const unspacedPhone = b.phone.replace(/\s+/g, '');
const streetAddr = b.streetAddress;
const postcode = b.postalCode;
const reviewUrl = b.googleReviewUrl;

for (const { f, full } of files) {
  if (!fs.existsSync(full)) { fail(f, 'FILE MISSING'); continue; }
  const html = fs.readFileSync(full, 'utf8');

  // 1. Own phone present, spaced form somewhere and tel: link unspaced.
  check(html.includes(spacedPhone), f, 'spaced phone ' + spacedPhone + ' not found');
  const telMatches = [...html.matchAll(/href="tel:([^"]+)"/g)].map(m => m[1]);
  check(telMatches.length > 0, f, 'no tel: link found');
  for (const t of telMatches) {
    check(t.replace(/\s+/g, '') === unspacedPhone, f, 'tel: link ' + t + ' does not match own unspaced phone ' + unspacedPhone);
  }

  // 2. Own postcode and street address present.
  check(html.includes(postcode), f, 'own postcode ' + postcode + ' not found');
  check(html.includes(streetAddr), f, 'own street address ' + streetAddr + ' not found');

  // 3. Own Google review link, and no other branch's.
  check(html.includes(reviewUrl), f, 'own review URL not found');
  for (const o of others) {
    if (o.googleReviewUrl && o.googleReviewUrl !== reviewUrl) {
      check(!html.includes(o.googleReviewUrl), f, 'contains another branch\'s (' + o.id + ') review URL');
    }
  }

  // 4. No other trading branch's phone or postcode appears anywhere.
  for (const o of others) {
    if (o.phone && o.phone !== b.phone) {
      check(!html.includes(o.phone), f, 'contains another branch\'s (' + o.id + ') spaced phone ' + o.phone);
      const oUnspaced = o.phone.replace(/\s+/g, '');
      check(!telMatches.some(t => t.replace(/\s+/g, '') === oUnspaced), f, 'a tel: link matches another branch\'s (' + o.id + ') phone');
    }
    if (o.postalCode && o.postalCode !== b.postalCode) {
      check(!html.includes(o.postalCode), f, 'contains another branch\'s (' + o.id + ') postcode ' + o.postalCode);
    }
  }

  // 5. Crosby (seoTown) in the H1.
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  check(!!h1Match, f, 'no H1 found');
  if (h1Match) {
    const h1Text = h1Match[1].replace(/<[^>]+>/g, '');
    check(h1Text.includes('Crosby'), f, 'H1 does not carry "Crosby": "' + h1Text.trim() + '"');
  }

  // 6. Correct brand spelling only - "Gordon Short Chemist", never "Gordon Shorts".
  const wrongSpelling = /Gordon\s+Shorts\b/g;
  const wrongMatches = [...html.matchAll(wrongSpelling)];
  check(wrongMatches.length === 0, f, 'contains "Gordon Shorts" (wrong, plural) ' + wrongMatches.length + ' time(s)');
  check(html.includes('Gordon Short Chemist') || html.includes('Gordon Short'), f, 'no "Gordon Short" branding found at all');

  // 7. JSON-LD parses and matches branches.json field for field (name, address, telephone).
  const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  check(!!ldMatch, f, 'no JSON-LD block found');
  if (ldMatch) {
    let ld;
    try { ld = JSON.parse(ldMatch[1]); } catch (e) { fail(f, 'JSON-LD does not parse: ' + e.message); ld = null; }
    if (ld) {
      check(ld.name === b.branchName || ld.name === b.brandLabel, f, 'JSON-LD name "' + ld.name + '" is neither branchName nor brandLabel');
      if (ld.address) {
        check(ld.address.streetAddress === b.streetAddress, f, 'JSON-LD streetAddress mismatch: ' + ld.address.streetAddress);
        check(ld.address.addressLocality === b.addressLocality, f, 'JSON-LD addressLocality mismatch: ' + ld.address.addressLocality);
        check(ld.address.postalCode === b.postalCode, f, 'JSON-LD postalCode mismatch: ' + ld.address.postalCode);
        check(ld.address.addressRegion === b.addressRegion, f, 'JSON-LD addressRegion mismatch: ' + ld.address.addressRegion);
      } else {
        fail(f, 'JSON-LD has no address block');
      }
      check(ld.telephone === b.phone, f, 'JSON-LD telephone mismatch: ' + ld.telephone);
    }
  }

  // 8. No em dash / en dash outside HTML comments; no unexpected non-ASCII
  //    (pound sign on the weight loss price is the one known exception).
  const noComments = html.replace(/<!--[\s\S]*?-->/g, '');
  check(!noComments.includes('—'), f, 'contains an em dash outside comments');
  check(!noComments.includes('–'), f, 'contains an en dash outside comments');
  const nonAscii = [...noComments].filter(ch => ch.charCodeAt(0) > 127 && ch !== '£' && ch !== '’' && ch !== '“' && ch !== '”');
  check(nonAscii.length === 0, f, 'unexpected non-ASCII characters found: ' + [...new Set(nonAscii)].join(' '));

  // 9. hasApp false -> no app copy, no store URLs.
  if (b.hasApp === false) {
    check(!/RB Healthcare Pharmacy app/i.test(noComments), f, 'app copy present despite hasApp:false');
    check(!/apps\.apple\.com/i.test(noComments), f, 'App Store URL present despite hasApp:false');
    check(!/play\.google\.com/i.test(noComments), f, 'Play Store URL present despite hasApp:false');
  }
}

// 10. Weight loss page: no prescription-only medicine named by brand, since
//     this is an inner page but check-weight-loss-copy already governs the
//     detailed regime; re-confirm the headline brand-name absence here too.
const wlFile = files.find(x => x.f.includes('weight-loss-clinic'));
if (wlFile && fs.existsSync(wlFile.full)) {
  const wlHtml = fs.readFileSync(wlFile.full, 'utf8');
  const poms = ['Mounjaro', 'Wegovy', 'Ozempic', 'Saxenda', 'Orlistat', 'Rybelsus'];
  for (const pom of poms) {
    check(!wlHtml.includes(pom), 'weight-loss-clinic-gordon-short-crosby.html', 'names prescription-only medicine "' + pom + '"');
  }
}

console.log('');
console.log('TOTAL CHECKS: ' + checks + '   FAILURES: ' + failures);
process.exit(failures > 0 ? 1 : 0);
