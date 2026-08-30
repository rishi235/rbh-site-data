// Independent quality-pass verifier for worklist item 3.9 (Coleman and Leighs
// Pharmacy, Walton). Shares no code with tools/. Reads branches.json and the 12
// generated Coleman pages, extracts facts independently and checks them.
// Exit 1 on any failure.
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = 'C:\\Dev\\rbh-site-data';
const data = JSON.parse(fs.readFileSync(path.join(REPO, 'branches.json'), 'utf8'));
const col = data.branches.find(b => b.id === 'colemanleigh_liverpool');
if (!col) { console.error('no Coleman branch'); process.exit(1); }
const others = data.branches.filter(b => b.id !== 'colemanleigh_liverpool' && !b.disposed);

const svcDir = path.join(REPO, 'modules', 'service', 'pages');
const swDir = path.join(REPO, 'modules', 'switch', 'pages');
const pages = fs.readdirSync(svcDir).filter(f => f.includes('coleman-leigh-walton')).map(f => path.join(svcDir, f))
  .concat(fs.readdirSync(swDir).filter(f => f.includes('coleman-leigh-walton')).map(f => path.join(swDir, f)));

let checks = 0, fails = 0;
const families = {};
function chk(fam, page, ok, msg) {
  checks++; families[fam] = (families[fam] || 0) + 1;
  if (!ok) { fails++; console.log('FAIL [' + fam + '] ' + path.basename(page) + ': ' + msg); }
}

const phoneDigits = col.phone.replace(/\D/g, '');           // 01515253522
const telRe = new RegExp('tel:' + phoneDigits);

for (const p of pages) {
  const html = fs.readFileSync(p, 'utf8');
  // Visible copy = source with HTML build comments blanked, the same line
  // check-em-dashes.js draws (dashes inside build comments are not public,
  // not a failure - the established repo line, re-confirmed on the 3.8 pass).
  const vis = html.replace(/<!--[\s\S]*?-->/g, s => s.replace(/[^\n]/g, ' '));
  const base = path.basename(p);
  const isSwitch = p.includes('\\switch\\');
  const isWL = base.startsWith('weight-loss');

  // 1. SEO title and description in the paste header comment. Q14 settled the
  //    insect-bite title as "... - Coleman and Leighs" without "Pharmacy", so
  //    the brand test accepts the shorter suffix.
  const tm = html.match(/Weebly page SEO title:\s*(.+)/);
  const dm = html.match(/Weebly page SEO description:\s*(.+)/);
  chk('seo-title', p, !!tm, 'no SEO title line');
  if (tm) {
    const t = tm[1].trim();
    chk('seo-title', p, t.includes('Walton'), 'title lacks town: ' + t);
    chk('seo-title', p, t.includes('Coleman and Leighs'), 'title lacks brand: ' + t);
    chk('seo-title', p, t.length <= 70, 'title over 70 chars (' + t.length + '): ' + t);
  }
  if (dm) {
    const d = dm[1].trim();
    chk('seo-desc', p, d.length >= 50 && d.length <= 165, 'description length ' + d.length);
    chk('seo-desc', p, d.includes('Walton') || d.includes('Coleman and Leighs'), 'description names neither town nor brand');
  }

  // 2. Exactly one h1, containing the town
  const h1s = html.match(/<h1[\s>]/g) || [];
  chk('h1', p, h1s.length === 1, h1s.length + ' h1 elements');
  const h1t = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
  chk('h1', p, /Walton/.test(h1t), 'h1 lacks town: ' + h1t.trim());

  // 3. NAP facts: own phone only, correct tel: href
  chk('nap', p, telRe.test(html) || !/tel:/.test(html), 'tel: href does not use own number');
  if (html.includes(col.phone) || /tel:/.test(html)) {
    chk('nap', p, html.includes(col.phone) || telRe.test(html), 'own phone absent though tel present');
  }

  // 4. Cross-contamination: no other live branch phone, postcode, ODS code or
  //    widget id anywhere on the page
  for (const o of others) {
    if (o.phone) {
      const od = o.phone.replace(/\D/g, '');
      chk('contamination', p, !html.includes(o.phone) && !html.includes('tel:' + od), 'foreign phone ' + o.phone + ' (' + o.branchName + ')');
    }
    if (o.postalCode) chk('contamination', p, !html.toUpperCase().includes(o.postalCode.toUpperCase()), 'foreign postcode ' + o.postalCode + ' (' + o.branchName + ')');
    if (o.odsCode) chk('contamination', p, !new RegExp('\\b' + o.odsCode + '\\b').test(html), 'foreign ODS ' + o.odsCode + ' (' + o.branchName + ')');
    if (o.widgets) for (const k of Object.keys(o.widgets)) {
      const w = o.widgets[k];
      if (w && (!col.widgets || !Object.values(col.widgets).includes(w))) chk('contamination', p, !html.includes(w), 'foreign widget id ' + w + ' (' + o.branchName + ' ' + k + ')');
    }
  }

  // 5. Branch identity attribute
  chk('identity', p, !/data-branch=/.test(html) || /data-branch="Coleman and Leighs/.test(html), 'data-branch is not Coleman and Leighs');

  // 6. Em/en dashes: none in any written shape in visible copy
  chk('dashes', p, !/[\u2013\u2014]/.test(vis) && !/&mdash;|&ndash;/i.test(vis) && !/&#8212;|&#8211;|&#x2014;|&#x2013;/i.test(vis), 'em/en dash in visible copy');

  // 7. URL scheme: no insecure links
  chk('scheme', p, !/http:\/\//.test(html), 'http:// link present');

  // 8. CDN pins: service pages on the mutable branch ref, switch page on an
  //    immutable commit ref
  const refs = [...html.matchAll(/cdn\.jsdelivr\.net\/gh\/rishi235\/rbh-site-data@([^\/"']+)/g)].map(m => m[1]);
  if (isSwitch) {
    chk('pins', p, refs.length > 0 && refs.every(r => /^[0-9a-f]{7,40}$/.test(r)), 'switch page not on an immutable commit pin: ' + refs.join(','));
  } else {
    chk('pins', p, refs.length > 0 && refs.every(r => r === 'service-module-phase1'), 'service page pin drift: ' + refs.join(','));
  }

  // 9. No hard-coded widget id on service pages (rendered by service.js from
  //    branches.json at run time, by design)
  if (!isSwitch && col.widgets) {
    for (const k of Object.keys(col.widgets)) chk('widgets', p, !html.includes(col.widgets[k]), 'hard-coded own widget id ' + k);
  }

  // 10. JSON-LD parsed and compared field by field to branches.json
  const ldBlocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  for (const m of ldBlocks) {
    let ld; try { ld = JSON.parse(m[1]); } catch (e) { chk('jsonld', p, false, 'unparseable JSON-LD'); continue; }
    const nodes = Array.isArray(ld) ? ld : [ld];
    for (const n of nodes) {
      if (n.telephone) chk('jsonld', p, n.telephone.replace(/\D/g, '') === phoneDigits, 'JSON-LD telephone ' + n.telephone);
      const addr = n.address;
      if (addr) {
        chk('jsonld', p, addr.postalCode === col.postalCode, 'JSON-LD postcode ' + addr.postalCode);
        chk('jsonld', p, addr.streetAddress === col.streetAddress, 'JSON-LD street ' + addr.streetAddress);
        chk('jsonld', p, addr.addressLocality === col.addressLocality, 'JSON-LD locality ' + addr.addressLocality);
        chk('jsonld', p, addr.addressRegion === col.addressRegion, 'JSON-LD region ' + addr.addressRegion);
      }
      if (n.url) chk('jsonld', p, n.url.startsWith(col.website), 'JSON-LD url off own host: ' + n.url);
    }
  }

  // 11. Weight loss page, regime 2 constraints (generated inner page)
  if (isWL) {
    chk('wl-copy', p, !/buy now/i.test(vis), 'Buy Now present');
    chk('wl-copy', p, !/\b(best|fastest|strongest|most effective)\b[^.<]{0,40}(treatment|medication|injection|result)/i.test(vis), 'superlative claim shape');
    chk('wl-copy', p, /consultation/i.test(vis), 'no consultation wording');
    chk('wl-copy', p, !/lose\s+(a|one|two|\d+|[a-z]+teen|twenty)\s*(stone|stones|lbs|pounds|kg|kilos)/i.test(vis), 'outcome amount claim');
    chk('wl-copy', p, !/\b(we|is|are)\s+guaranteed?\b|\bguaranteed\s+(results?|weight|outcome)/i.test(vis), 'affirmative guarantee claim');
  }

  // 12. Hours: any explicit clock times in visible copy must belong to the spec
  if (col.openingHours && col.openingHours.specification) {
    const times = [...vis.matchAll(/\b(\d{1,2}):(\d{2})\b/g)].map(m => m[1].padStart(2, '0') + ':' + m[2]);
    const allowed = new Set();
    for (const s of col.openingHours.specification) { allowed.add(s.opens); allowed.add(s.closes); }
    for (const t of times) chk('hours', p, allowed.has(t), 'clock time ' + t + ' not in branches.json spec');
  }

  // 13. Switch page carries the brand
  if (isSwitch) {
    chk('switch', p, html.includes('Coleman and Leighs'), 'brand absent');
  }
}

console.log('PAGES=' + pages.length + ' CHECKS=' + checks + ' FAMILIES=' + Object.keys(families).length + ' FAILS=' + fails);
console.log('family counts: ' + Object.entries(families).map(([k, v]) => k + '=' + v).join(', '));
process.exit(fails ? 1 : 0);
