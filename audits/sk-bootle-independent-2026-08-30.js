// Independent quality-pass verifier for worklist item 3.8 (SK Chemists, Bootle).
// Shares no code with tools/. Reads branches.json and the 12 generated SK pages,
// extracts facts independently and checks them. Exit 1 on any failure.
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = 'C:\\Dev\\rbh-site-data';
const data = JSON.parse(fs.readFileSync(path.join(REPO, 'branches.json'), 'utf8'));
const sk = data.branches.find(b => b.id === 'skchemists_bootle');
if (!sk) { console.error('no SK branch'); process.exit(1); }
const others = data.branches.filter(b => b.id !== 'skchemists_bootle' && !b.disposed);

const svcDir = path.join(REPO, 'modules', 'service', 'pages');
const swDir = path.join(REPO, 'modules', 'switch', 'pages');
const pages = fs.readdirSync(svcDir).filter(f => f.includes('sk-chemists-bootle')).map(f => path.join(svcDir, f))
  .concat(fs.readdirSync(swDir).filter(f => f.includes('sk-chemists-bootle')).map(f => path.join(swDir, f)));

let checks = 0, fails = 0;
const families = {};
function chk(fam, page, ok, msg) {
  checks++; families[fam] = (families[fam] || 0) + 1;
  if (!ok) { fails++; console.log('FAIL [' + fam + '] ' + path.basename(page) + ': ' + msg); }
}

const phoneDigits = sk.phone.replace(/\D/g, '');           // 01519441013
const telRe = new RegExp('tel:' + phoneDigits);

for (const p of pages) {
  const html = fs.readFileSync(p, 'utf8');
  // Visible copy = source with HTML build comments blanked, the same line
  // check-em-dashes.js draws and prior runs confirmed (log 2026-08-1x:
  // "dashes inside build comments - not public, not a failure").
  const vis = html.replace(/<!--[\s\S]*?-->/g, s => s.replace(/[^\n]/g, ' '));
  const base = path.basename(p);
  const isSwitch = p.includes('\\switch\\');
  const isWL = base.startsWith('weight-loss');

  // 1. SEO title and description in the paste header comment
  const tm = html.match(/Weebly page SEO title:\s*(.+)/);
  const dm = html.match(/Weebly page SEO description:\s*(.+)/);
  chk('seo-title', p, !!tm, 'no SEO title line');
  if (tm) {
    const t = tm[1].trim();
    chk('seo-title', p, t.includes('Bootle'), 'title lacks town: ' + t);
    chk('seo-title', p, t.includes('SK Chemists'), 'title lacks brand: ' + t);
    chk('seo-title', p, t.length <= 70, 'title over 70 chars (' + t.length + '): ' + t);
  }
  if (dm) {
    const d = dm[1].trim();
    chk('seo-desc', p, d.length >= 50 && d.length <= 165, 'description length ' + d.length);
    chk('seo-desc', p, d.includes('Bootle') || d.includes('SK Chemists'), 'description names neither town nor brand');
  }

  // 2. Exactly one h1, containing the town
  const h1s = html.match(/<h1[\s>]/g) || [];
  chk('h1', p, h1s.length === 1, h1s.length + ' h1 elements');
  const h1t = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
  chk('h1', p, /Bootle/.test(h1t), 'h1 lacks town: ' + h1t.trim());

  // 3. NAP facts: own phone only, correct tel: href, own postcode shape where present
  chk('nap', p, telRe.test(html) || !/tel:/.test(html), 'tel: href does not use own number');
  if (html.includes('0151 944 1013') || /tel:/.test(html)) {
    chk('nap', p, html.includes(sk.phone) || telRe.test(html), 'own phone absent though tel present');
  }
  // 4. Cross-contamination: no other live branch phone, postcode or ODS code
  for (const o of others) {
    if (o.phone) {
      const od = o.phone.replace(/\D/g, '');
      chk('contamination', p, !html.includes(o.phone) && !html.includes('tel:' + od), 'foreign phone ' + o.phone + ' (' + o.branchName + ')');
    }
    if (o.postalCode) chk('contamination', p, !html.toUpperCase().includes(o.postalCode.toUpperCase()), 'foreign postcode ' + o.postalCode + ' (' + o.branchName + ')');
    if (o.odsCode) chk('contamination', p, !new RegExp('\\b' + o.odsCode + '\\b').test(html), 'foreign ODS ' + o.odsCode + ' (' + o.branchName + ')');
    if (o.widgets) for (const k of Object.keys(o.widgets)) {
      const w = o.widgets[k];
      if (w && (!sk.widgets || !Object.values(sk.widgets).includes(w))) chk('contamination', p, !html.includes(w), 'foreign widget id ' + w + ' (' + o.branchName + ' ' + k + ')');
    }
  }

  // 5. Branch identity attribute
  chk('identity', p, !/data-branch=/.test(html) || /data-branch="SK Chemists"/.test(html), 'data-branch is not SK Chemists');

  // 6. Em/en dashes: none in any written shape in VISIBLE copy (comments are
  //    exempt by the established repo line)
  chk('dashes', p, !/[\u2013\u2014]/.test(vis) && !/&mdash;|&ndash;/i.test(vis) && !/&#8212;|&#8211;|&#x2014;|&#x2013;/i.test(vis), 'em/en dash in visible copy');

  // 7. URL scheme: no insecure links
  chk('scheme', p, !/http:\/\//.test(html), 'http:// link present');

  // 8. CDN pins match the generator model: service pages on the mutable branch
  //    ref, switch page on the immutable commit ref.
  const refs = [...html.matchAll(/cdn\.jsdelivr\.net\/gh\/rishi235\/rbh-site-data@([^\/"']+)/g)].map(m => m[1]);
  if (isSwitch) {
    chk('pins', p, refs.length > 0 && refs.every(r => /^[0-9a-f]{7,40}$/.test(r)), 'switch page not on an immutable commit pin: ' + refs.join(','));
  } else {
    chk('pins', p, refs.length > 0 && refs.every(r => r === 'service-module-phase1'), 'service page pin drift: ' + refs.join(','));
  }

  // 9. No hard-coded widget id on service pages (rendered from branches.json)
  if (!isSwitch && sk.widgets) {
    for (const k of Object.keys(sk.widgets)) chk('widgets', p, !html.includes(sk.widgets[k]), 'hard-coded own widget id ' + k);
  }

  // 10. Weight loss page, regime 2 constraints (generated inner page)
  if (isWL) {
    chk('wl-copy', p, !/buy now/i.test(vis), 'Buy Now present');
    chk('wl-copy', p, !/\b(best|fastest|strongest|most effective)\b[^.<]{0,40}(treatment|medication|injection|result)/i.test(vis), 'superlative claim shape');
    chk('wl-copy', p, /consultation/i.test(vis), 'no consultation wording');
    chk('wl-copy', p, !/lose\s+(a|one|two|\d+)\s*(stone|stones|lbs|pounds|kg|kilos)/i.test(vis), 'outcome amount claim');
    // Affirmative guarantees only. "not a guarantee" / "cannot guarantee" /
    // "does not guarantee" are the required protective wording.
    chk('wl-copy', p, !/\b(we|is|are)\s+guaranteed?\b|\bguaranteed\s+(results?|weight|outcome)/i.test(vis), 'affirmative guarantee claim');
  }

  // 11. Hours: any explicit clock times in visible copy must belong to the spec
  const times = [...vis.matchAll(/\b(\d{1,2}):(\d{2})\b/g)].map(m => m[1].padStart(2, '0') + ':' + m[2]);
  const allowed = new Set();
  for (const s of sk.openingHours.specification) { allowed.add(s.opens); allowed.add(s.closes); }
  for (const t of times) chk('hours', p, allowed.has(t), 'clock time ' + t + ' not in branches.json spec');

  // 12. Switch page copy: no promise that the pharmacy contacts the GP without
  //     the patient doing anything is asserted here; just check own facts appear
  if (isSwitch) {
    chk('switch', p, html.includes('SK Chemists'), 'brand absent');
  }
}

console.log('PAGES=' + pages.length + ' CHECKS=' + checks + ' FAMILIES=' + Object.keys(families).length + ' FAILS=' + fails);
console.log('family counts: ' + Object.entries(families).map(([k, v]) => k + '=' + v).join(', '));
process.exit(fails ? 1 : 0);
