// Independent verification, item 3.5 (Hirshmans Chemist, Ainsdale), ninth quality pass, 2026-09-02.
// Freshly written, no code imported from tools/. Output written outside the repo tree
// (a prior step in this run's own sweep showed repo-tree scratch files get swept into
// check-postcodes.js, which scans the whole repo - lesson carried, not repeated here).
const fs = require('fs');
const path = require('path');

const REPO = 'C:\\Dev\\rbh-site-data';
const branches = JSON.parse(fs.readFileSync(path.join(REPO, 'branches.json'), 'utf8'));
const b = branches.branches.find(x => x.brandSlug === 'hirshmans');
if (!b) { console.error('Hirshmans branch not found'); process.exit(1); }

let checks = 0, failures = 0;
const fail = (msg) => { failures++; console.log('FAIL: ' + msg); };
const check = (cond, msg) => { checks++; if (!cond) fail(msg); };

const otherBranches = branches.branches.filter(x => x.id !== b.id && !x.disposed);

const pageDirs = [
  path.join(REPO, 'modules', 'service', 'pages'),
  path.join(REPO, 'modules', 'switch', 'pages'),
];
let pages = [];
for (const dir of pageDirs) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f.includes('hirshmans-ainsdale'));
  for (const f of files) pages.push(path.join(dir, f));
}
console.log('Pages found: ' + pages.length);
pages.forEach(p => console.log('  ' + path.basename(p)));

const sheetFiles = [
  path.join(REPO, 'modules', 'service', 'pages', 'SEO.md'),
  path.join(REPO, 'modules', 'service', 'pages', 'CONTRACEPTION-SEO.md'),
  path.join(REPO, 'modules', 'service', 'pages', 'TRAVEL-CLINIC-SEO.md'),
  path.join(REPO, 'modules', 'service', 'pages', 'WEIGHT-LOSS-SEO.md'),
  path.join(REPO, 'modules', 'switch', 'pages', 'SEO.md'),
];
let sheetBlocks = {};
for (const sf of sheetFiles) {
  if (!fs.existsSync(sf)) continue;
  const content = fs.readFileSync(sf, 'utf8');
  const blocks = content.split(/\r?\n## /).slice(1);
  for (const blk of blocks) {
    const permMatch = blk.match(/\*\*Page Permalink:\*\*\s*(\S+)/);
    const titleMatch = blk.match(/\*\*Page Title:\*\*\s*(.+)/);
    const descMatch = blk.match(/\*\*Page Description:\*\*\s*(.+)/);
    if (permMatch) {
      sheetBlocks[permMatch[1].trim()] = {
        title: titleMatch ? titleMatch[1].trim() : null,
        description: descMatch ? descMatch[1].trim() : null,
      };
    }
  }
}
console.log('Sheet permalink blocks loaded: ' + Object.keys(sheetBlocks).length);

for (const p of pages) {
  const base = path.basename(p, '.html');
  const html = fs.readFileSync(p, 'utf8');

  const titleMatch = html.match(/Weebly page SEO title:\s*(.+)/);
  const descMatch = html.match(/Weebly page SEO description:\s*(.+)/);
  check(!!titleMatch, base + ': build comment carries SEO title');
  check(!!descMatch, base + ': build comment carries SEO description');

  let title = titleMatch ? titleMatch[1].trim().replace(/\r$/, '') : null;
  let desc = descMatch ? descMatch[1].trim().replace(/\r$/, '') : null;

  if (title) {
    check(title.length <= 65, base + ': title <=65 chars (' + title.length + ')');
    check(title.includes(b.seoTown), base + ': title contains seoTown ' + b.seoTown);
  }
  if (desc) {
    check(desc.length >= 80 && desc.length <= 165, base + ': description 80-165 chars (' + desc.length + ')');
    check(desc.includes(b.seoTown), base + ': description contains seoTown');
  }

  // Cross-check comment header title/description against the sheet's own block for this permalink
  if (sheetBlocks[base]) {
    check(sheetBlocks[base].title === title, base + ': sheet Page Title === comment header title');
    check(sheetBlocks[base].description === desc, base + ': sheet Page Description === comment header description');
    // NEW LEG: sheet's own Page Permalink field, looked up by exact block match, contains townSlug
    check(base.includes(b.townSlug), base + ': sheet Page Permalink (' + base + ') contains townSlug ' + b.townSlug);
  } else {
    fail(base + ': no matching sheet block found for this permalink');
  }

  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  check(h1s.length === 1, base + ': exactly one H1 (' + h1s.length + ')');
  if (h1s.length >= 1) {
    check(h1s[0].includes(b.seoTown), base + ': H1 contains seoTown');
  }

  // filename itself contains townSlug
  check(base.includes(b.townSlug), base + ': filename contains townSlug ' + b.townSlug);

  for (const ob of otherBranches) {
    if (!ob.seoTown) continue;
    if ((b.serviceAreaList || []).includes(ob.seoTown)) continue;
    const re = new RegExp('\\b' + ob.seoTown.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
    checks++;
    if (re.test(h1s.join(' '))) fail(base + ': H1 contains foreign seoTown ' + ob.seoTown);
  }

  const ownPhoneDigits = b.phone.replace(/\D/g, '');
  check(html.replace(/\D/g,'').includes(ownPhoneDigits), base + ': own phone present');
  for (const ob of otherBranches) {
    if (!ob.phone) continue;
    const obDigits = ob.phone.replace(/\D/g, '');
    if (obDigits === ownPhoneDigits) continue;
    checks++;
    if (html.replace(/\D/g,'').includes(obDigits)) fail(base + ': contains foreign phone digits from ' + ob.brandLabel);
  }

  check(html.includes(b.postalCode), base + ': own postcode present');
  for (const ob of otherBranches) {
    if (!ob.postalCode || ob.postalCode === b.postalCode) continue;
    checks++;
    if (html.includes(ob.postalCode)) fail(base + ': contains foreign postcode ' + ob.postalCode);
  }

  const waMatch = html.match(/data-wa="([^"]*)"/);
  if (waMatch) {
    check(waMatch[1] === b.whatsapp, base + ': data-wa matches branch whatsapp');
  }

  const jsonldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (jsonldMatch) {
    let ld;
    try { ld = JSON.parse(jsonldMatch[1]); } catch (e) { fail(base + ': JSON-LD parse error: ' + e.message); ld = null; }
    checks++;
    if (ld && ld.address) {
      check(ld.address.streetAddress === b.streetAddress, base + ': JSON-LD streetAddress matches');
      check(ld.address.addressLocality === b.addressLocality, base + ': JSON-LD addressLocality matches');
      check(ld.address.postalCode === b.postalCode, base + ': JSON-LD postalCode matches');
      check(ld.address.addressRegion === b.addressRegion, base + ': JSON-LD addressRegion matches');
    } else if (ld) {
      fail(base + ': JSON-LD missing address block');
    }
    if (ld) {
      check(ld.telephone === b.phone, base + ': JSON-LD telephone matches');
    }
  }
}

console.log('');
console.log('TOTAL CHECKS: ' + checks + '   FAILURES: ' + failures);
process.exit(failures > 0 ? 1 : 0);
