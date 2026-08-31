#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const REPO = '/sessions/zealous-gracious-keller/mnt/rbh-site-data';

const branches = JSON.parse(fs.readFileSync(path.join(REPO, 'branches.json'), 'utf8'));
const smartts = branches.branches.find(b => b.id === 'smartts_bootle');
if (!smartts) { console.error('FATAL: smartts_bootle not found'); process.exit(2); }

const liveBranches = branches.branches.filter(b => !b.disposed);
const otherLive = liveBranches.filter(b => b.id !== smartts.id);

const pageFiles = [
  'modules/service/pages/contraception-smartts-bootle.html',
  'modules/service/pages/earache-treatment-smartts-bootle.html',
  'modules/service/pages/impetigo-treatment-smartts-bootle.html',
  'modules/service/pages/insect-bite-treatment-smartts-bootle.html',
  'modules/service/pages/pharmacy-first-smartts-bootle.html',
  'modules/service/pages/shingles-treatment-smartts-bootle.html',
  'modules/service/pages/sinusitis-treatment-smartts-bootle.html',
  'modules/service/pages/sore-throat-treatment-smartts-bootle.html',
  'modules/service/pages/travel-clinic-smartts-bootle.html',
  'modules/service/pages/uti-treatment-smartts-bootle.html',
  'modules/service/pages/weight-loss-clinic-smartts-bootle.html',
  'modules/switch/pages/switch-prescriptions-smartts-bootle.html',
];

let checks = 0;
let failures = [];
function check(cond, label, detail) {
  checks++;
  if (!cond) failures.push(label + (detail ? ' :: ' + detail : ''));
}

for (const rel of pageFiles) {
  const full = path.join(REPO, rel);
  if (!fs.existsSync(full)) { failures.push('MISSING FILE :: ' + rel); checks++; continue; }
  const rawFull = fs.readFileSync(full, 'utf8');
  const raw = rawFull.replace(/<!--[\s\S]*?-->/g, '');
  const label = rel;

  check(raw.includes(smartts.postalCode), label + ' own postcode present');
  for (const ob of otherLive) {
    if (ob.postalCode && ob.postalCode !== smartts.postalCode) {
      check(!raw.includes(ob.postalCode), label + ' no other postcode', ob.id + ' ' + ob.postalCode);
    }
  }

  check(raw.includes(smartts.phone), label + ' own phone present (display)');
  const telUnspaced = smartts.phone.replace(/\s+/g, '');
  const telHrefPresent = raw.includes('tel:+44' + smartts.phone.replace(/^0/, '').replace(/\s+/g, '')) || raw.includes(telUnspaced);
  check(telHrefPresent, label + ' tel: link or unspaced phone present');
  for (const ob of otherLive) {
    if (ob.phone && ob.phone !== smartts.phone) {
      check(!raw.includes(ob.phone), label + ' no other branch phone', ob.id + ' ' + ob.phone);
    }
  }

  check(raw.includes(smartts.streetAddress), label + ' own street address present');

  const mapMatch = raw.match(/google\.com\/maps\?[^"']*/);
  if (mapMatch) {
    const qMatch = mapMatch[0].match(/[?&]q=([^&"']+)/);
    if (qMatch) {
      const decoded = decodeURIComponent(qMatch[1]);
      check(decoded.includes(smartts.streetAddress) && decoded.includes(smartts.postalCode),
        label + ' map query matches own address', decoded);
    } else { failures.push(label + ' map embed has no q= param'); checks++; }
  } else { failures.push(label + ' no maps embed found'); checks++; }

  const ldMatch = raw.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (ldMatch) {
    let ld;
    try { ld = JSON.parse(ldMatch[1]); } catch (e) { ld = null; }
    if (ld) {
      check(ld['@type'] === 'Pharmacy', label + ' JSON-LD @type Pharmacy', ld['@type']);
      check(ld.name === smartts.branchName || ld.name === smartts.brandLabel, label + ' JSON-LD name matches branch', ld.name);
      check(ld.telephone === smartts.phone, label + ' JSON-LD telephone matches', ld.telephone);
      if (ld.address) {
        check(ld.address.streetAddress === smartts.streetAddress, label + ' JSON-LD streetAddress', ld.address.streetAddress);
        check(ld.address.postalCode === smartts.postalCode, label + ' JSON-LD postalCode', ld.address.postalCode);
        check(ld.address.addressRegion === smartts.addressRegion, label + ' JSON-LD addressRegion', ld.address.addressRegion);
      } else { failures.push(label + ' JSON-LD has no address block'); checks++; }
    } else { failures.push(label + ' JSON-LD did not parse'); checks++; }
  } else { failures.push(label + ' no JSON-LD block found'); checks++; }

  const dbMatch = raw.match(/data-branch="([^"]*)"/);
  if (dbMatch) {
    check(dbMatch[1] === smartts.branchName || dbMatch[1] === smartts.brandLabel, label + ' data-branch matches branch name', dbMatch[1]);
  }

  const waMatch = raw.match(/data-wa="([^"]*)"/);
  if (waMatch) {
    check(waMatch[1] === smartts.whatsapp, label + ' data-wa matches estate/own number', waMatch[1]);
  }

  const areaList = smartts.serviceAreaList || [];
  for (const ob of otherLive) {
    if (!ob.seoTown || ob.seoTown === smartts.seoTown) continue;
    const re = new RegExp('\\b' + ob.seoTown.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
    if (re.test(raw) && !areaList.includes(ob.seoTown)) {
      failures.push(label + ' names another branch seoTown without excuse :: ' + ob.seoTown + ' (' + ob.id + ')');
    }
    checks++;
  }

  const hasAppMention = /RB Healthcare Pharmacy app|Download our app/i.test(raw);
  if (rel.includes('switch-prescriptions')) {
    check(hasAppMention, label + ' switch page carries app card (hasApp=true)');
  }

  check(!raw.includes('—') && !raw.includes('–'), label + ' no em/en dash');

  for (const ob of otherLive) {
    if (!ob.widgets) continue;
    for (const wid of Object.values(ob.widgets)) {
      if (wid && raw.includes(wid)) {
        failures.push(label + ' carries another branch widget id :: ' + wid + ' (' + ob.id + ')');
        checks++;
      }
    }
  }
}

const sheetDir = path.join(REPO, 'modules/service/pages');
const sheetFiles = fs.readdirSync(sheetDir).filter(f => f.endsWith('.md'));
let smarttsSheetBlocks = 0;
for (const sf of sheetFiles) {
  const content = fs.readFileSync(path.join(sheetDir, sf), 'utf8');
  const blocks = content.split(/(?=^###? )/m);
  for (const blk of blocks) {
    if (/smartts-bootle/i.test(blk) || (/Smartts/i.test(blk) && /Bootle/i.test(blk) && /[Pp]ermalink/i.test(blk))) {
      smarttsSheetBlocks++;
      check(/Bootle/.test(blk), sf + ' block carries Bootle seoTown');
    }
  }
}
check(smarttsSheetBlocks > 0, 'at least one paste-sheet block found for Smartts Bootle', smarttsSheetBlocks);

const sharedPaste = path.join(REPO, 'modules/switch/weebly.html');
if (fs.existsSync(sharedPaste)) {
  const sp = fs.readFileSync(sharedPaste, 'utf8');
  check(!sp.includes(smartts.phone), 'shared switch weebly.html carries no Smartts phone');
  check(!sp.includes(smartts.postalCode), 'shared switch weebly.html carries no Smartts postcode');
}

console.log('Smartts Chemist Bootle - independent verification, item 3.7 sixth quality pass, 2026-08-31');
console.log('Pages checked:', pageFiles.length);
console.log('Total checks:', checks);
console.log('Failures:', failures.length);
if (failures.length) {
  console.log('\n--- FAILURES ---');
  for (const f of failures) console.log(' - ' + f);
  process.exit(1);
} else {
  console.log('\nAll checks passed.');
}
