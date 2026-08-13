// Independent verification of item 3.8 - SK Chemists (Bootle).
// Third machine-era quality pass, run 150, 2026-08-13.
// Deliberately shares NO code with tools/: own file discovery, own regexes,
// own reading of branches.json. If this agrees with the 30 checkers that is
// evidence; if it disagrees one of the two is wrong and both get read.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGET_ID = 'skchemists_bootle';

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'branches.json'), 'utf8'));
const me = data.branches.find(b => b.id === TARGET_ID);
if (!me) { console.error('branch not found'); process.exit(2); }
const others = data.branches.filter(b => b.id !== TARGET_ID);

let checks = 0, fails = 0;
const failures = [];
function ok(cond, label) {
  checks++;
  if (!cond) { fails++; failures.push(label); }
}

// ---- own file discovery: walk modules/, keep pages naming this branch ----
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && p.toLowerCase().endsWith('.html')) out.push(p);
  }
  return out;
}
const allHtml = walk(path.join(ROOT, 'modules'), []);
const mine = allHtml.filter(p => path.basename(p).includes(me.brandSlug + '-' + me.townSlug));

console.log('DISCOVERY: ' + allHtml.length + ' html files under modules/, ' +
  mine.length + ' name ' + me.brandSlug + '-' + me.townSlug);
mine.forEach(p => console.log('  ' + path.relative(ROOT, p)));

const digits = s => (s || '').replace(/\D/g, '');
const myDigits = digits(me.phone);
const norm = s => (s || '').replace(/&middot;/g, '.').replace(/&amp;/g, '&');

for (const file of mine) {
  const rel = path.relative(ROOT, file);
  const html = fs.readFileSync(file, 'utf8');
  const tag = (label) => rel + ' :: ' + label;

  // 1. exactly one H1, and it carries the SEO town
  const h1s = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  ok(h1s.length === 1, tag('expected exactly one h1, found ' + h1s.length));
  if (h1s.length === 1) {
    const h1text = h1s[0].replace(/<[^>]+>/g, '').trim();
    ok(h1text.includes(me.seoTown), tag('h1 does not carry seoTown: ' + h1text));
  }

  // 2. phone in both shapes, and no other branch's number in either shape
  ok(html.includes(me.phone), tag('display phone missing'));
  ok(html.includes('tel:' + myDigits), tag('tel: link missing'));
  for (const o of others) {
    const od = digits(o.phone);
    // rbh_head_office_aintree carries no phone. An empty string makes both
    // tests below match every page, which is a fault in this script and not
    // in the estate, so a branch with no number is skipped rather than
    // silently producing 12 false flags.
    if (!od || od === myDigits) continue;
    ok(!html.includes(o.phone), tag('carries ' + o.id + ' display phone ' + o.phone));
    ok(!html.includes('tel:' + od), tag('carries ' + o.id + ' tel:' + od));
  }

  // 3. own street and postcode only
  ok(html.includes(me.streetAddress), tag('own street missing'));
  ok(html.includes(me.postalCode), tag('own postcode missing'));
  for (const o of others) {
    if (o.streetAddress && o.streetAddress !== me.streetAddress) {
      ok(!html.includes(o.streetAddress), tag('carries ' + o.id + ' street ' + o.streetAddress));
    }
    if (o.postalCode && o.postalCode !== me.postalCode) {
      ok(!html.includes(o.postalCode), tag('carries ' + o.id + ' postcode ' + o.postalCode));
    }
  }

  // 4. JSON-LD parses and every field matches branches.json
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  ok(!!ld, tag('no JSON-LD block'));
  if (ld) {
    let obj = null;
    try { obj = JSON.parse(ld[1]); } catch (e) { ok(false, tag('JSON-LD does not parse: ' + e.message)); }
    if (obj) {
      ok(obj['@context'] === 'https://schema.org', tag('ld @context wrong'));
      ok(obj['@type'] === 'Pharmacy', tag('ld @type wrong: ' + obj['@type']));
      ok(obj.name === me.branchName, tag('ld name ' + obj.name));
      ok(obj.telephone === me.phone, tag('ld telephone ' + obj.telephone));
      const a = obj.address || {};
      ok(a['@type'] === 'PostalAddress', tag('ld address @type'));
      ok(a.streetAddress === me.streetAddress, tag('ld streetAddress ' + a.streetAddress));
      ok(a.addressLocality === me.addressLocality, tag('ld addressLocality ' + a.addressLocality));
      ok(a.postalCode === me.postalCode, tag('ld postalCode ' + a.postalCode));
      ok(a.addressRegion === me.addressRegion, tag('ld addressRegion ' + a.addressRegion));
      ok(a.addressCountry === me.addressCountry, tag('ld addressCountry ' + a.addressCountry));
      // url must be own host + own filename
      const expectUrl = me.website + '/' + path.basename(file);
      ok(obj.url === expectUrl, tag('ld url ' + obj.url + ' expected ' + expectUrl));
    }
  }

  // 5. no widget id hard-coded into the page (service.js reads branches.json)
  for (const key of Object.keys(me.widgets || {})) {
    ok(!html.includes(me.widgets[key]), tag('hard-codes own ' + key + ' widget id'));
  }
  for (const o of others) {
    for (const key of Object.keys(o.widgets || {})) {
      ok(!html.includes(o.widgets[key]), tag('hard-codes ' + o.id + ' ' + key + ' widget id'));
    }
  }

  // 6. no other branch's review url, pf link, ODS code, nhs email or website host
  for (const o of others) {
    if (o.googleReviewUrl && o.googleReviewUrl !== me.googleReviewUrl) {
      ok(!html.includes(o.googleReviewUrl), tag('carries ' + o.id + ' review url'));
    }
    if (o.pfLink && o.pfLink !== me.pfLink) {
      ok(!html.includes(o.pfLink), tag('carries ' + o.id + ' pfLink'));
    }
    if (o.odsCode && o.odsCode !== me.odsCode) {
      ok(!html.includes(o.odsCode), tag('carries ' + o.id + ' ODS ' + o.odsCode));
    }
    if (o.nhsEmail && o.nhsEmail !== me.nhsEmail) {
      ok(!html.includes(o.nhsEmail), tag('carries ' + o.id + ' nhs email'));
    }
    if (o.website && o.website !== me.website) {
      ok(!html.includes(o.website), tag('carries ' + o.id + ' website ' + o.website));
    }
  }

  // 7. no other brand named anywhere in the page
  const myBrandWords = new Set([me.brandLabel, me.branchName]);
  for (const o of others) {
    if (myBrandWords.has(o.brandLabel)) continue;
    ok(!html.includes(o.brandLabel), tag('names other brand ' + o.brandLabel));
  }

  // 8. no insecure scheme anywhere on the page
  ok(!/http:\/\//.test(html), tag('carries an http:// URL'));

  // 9. own data-branch attribute where the module root exists
  const db = html.match(/data-branch="([^"]*)"/);
  if (db) ok(db[1] === me.branchName, tag('data-branch is ' + db[1]));

  // 10. map embed, where present, points at the own address
  const map = html.match(/google\.com\/maps\?q=([^"&]+)/);
  if (map) {
    const q = decodeURIComponent(map[1]);
    ok(q.includes(me.streetAddress) && q.includes(me.postalCode),
      tag('map embed query is ' + q));
  }

  // 11. relative internal links resolve to a file that exists in the same folder
  const links = [...html.matchAll(/href="(?!https?:|tel:|mailto:|#)([^"]+\.html)"/g)];
  for (const m of links) {
    const target = path.join(path.dirname(file), m[1]);
    ok(fs.existsSync(target), tag('relative link to missing file ' + m[1]));
    ok(m[1].includes(me.brandSlug + '-' + me.townSlug),
      tag('relative link leaves the branch: ' + m[1]));
  }

  // 12. house copy standards, applied to VISIBLE copy only. Build comments are
  // blanked first, which is the same line the repo's own check-em-dashes.js
  // draws: a dash in a build comment reaches no visitor. Both literal and
  // HTML-entity spellings are tested, because a browser renders them alike.
  const visible = html.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '));
  ok(!/[–—]/.test(visible), tag('em or en dash in visible copy'));
  ok(!/&(?:mdash|ndash|#8212|#8211|#[xX]201[34]);/.test(visible),
    tag('em or en dash entity in visible copy'));
  ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(visible), tag('emoji in visible copy'));

  // 13. CDN pins: every jsdelivr reference pinned to the same declared ref
  const pins = [...html.matchAll(/cdn\.jsdelivr\.net\/gh\/rishi235\/rbh-site-data@([^/]+)\//g)]
    .map(m => m[1]);
  const uniquePins = [...new Set(pins)];
  ok(uniquePins.length <= 1, tag('mixed CDN pins: ' + uniquePins.join(', ')));
}

// ---- the three copies of every page's two Weebly SEO fields ----
// The estate writes each page's SEO title and description three times: in the
// page's own build comment, in a *-SEO.md sheet, and in an *INDEX.md sheet.
// Run 149 closed the hole where the INDEX copies were compared to nothing.
// This re-derives the comparison for SK's 12 pages from scratch.
function sheetsUnder(dir) {
  return fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.md'))
    .map(f => path.join(dir, f));
}
// slug -> {title, desc, sheet} for every sheet row anywhere in modules/.
//
// Parsed per HEADING BLOCK, not line by line in order. The first version of
// this read fields in sequence and only accepted a title once a slug had been
// seen, which quietly dropped every *-SEO.md title in the estate: those sheets
// write Page Title BEFORE Page Permalink, while the INDEX.md sheets write the
// slug first. So the title half of this comparison was vacuous and the run
// still reported 23 rows compared. Caught by the negative test that injected a
// Hirshmans title onto the SK UTI row and was not noticed. Collect the whole
// block first, then key it, so field ORDER inside a block cannot matter.
const sheetRows = [];
const pageDirs = [...new Set(mine.map(f => path.dirname(f)))];
for (const dir of pageDirs) {
  for (const sheet of sheetsUnder(dir)) {
    const relSheet = path.relative(ROOT, sheet);
    const blocks = fs.readFileSync(sheet, 'utf8').split(/^##\s/m).slice(1);
    for (const block of blocks) {
      const grab = re => { const m = block.match(re); return m ? m[1].trim() : undefined; };
      const slug = (grab(/^\s*-\s*\*\*Page Permalink:\*\*\s*(\S+)/mi)
        || grab(/^\s*-\s*\*\*Page slug \/ URL:\*\*\s*`([^`]+)`/mi) || '').replace(/\.html$/, '');
      if (!slug) continue;
      sheetRows.push({
        slug,
        sheet: relSheet,
        title: grab(/^\s*-\s*\*\*(?:Page Title|SEO title):\*\*\s*(.+?)\s*$/mi),
        desc: grab(/^\s*-\s*\*\*(?:Page Description|SEO description):\*\*\s*(.+?)\s*$/mi)
      });
    }
  }
}

let rowsSeen = 0;
for (const file of mine) {
  const rel = path.relative(ROOT, file);
  const slug = path.basename(file).replace(/\.html$/, '');
  const html = fs.readFileSync(file, 'utf8');
  const comment = (html.match(/<!--[\s\S]*?-->/) || [''])[0];
  const ct = comment.match(/Weebly page SEO title:\s*(.+?)\s*\n/);
  const cd = comment.match(/Weebly page SEO description:\s*(.+?)\s*\n/);
  ok(!!ct, rel + ' :: build comment has no SEO title');
  ok(!!cd, rel + ' :: build comment has no SEO description');

  const rows = sheetRows.filter(r => r.slug === slug);
  ok(rows.length >= 1, rel + ' :: no paste sheet row found for slug ' + slug);
  // Both halves must actually be present somewhere, or a parser that silently
  // finds nothing reads as clean. This is the assertion the first version of
  // this script lacked.
  ok(rows.some(r => r.title !== undefined), rel + ' :: no sheet anywhere carries an SEO title for ' + slug);
  ok(rows.some(r => r.desc !== undefined), rel + ' :: no sheet anywhere carries an SEO description for ' + slug);
  for (const r of rows) {
    rowsSeen++;
    if (ct && r.title !== undefined) {
      ok(r.title === ct[1], rel + ' :: SEO title differs from ' + r.sheet +
        ' [comment: ' + ct[1] + '] [sheet: ' + r.title + ']');
    }
    if (cd && r.desc !== undefined) {
      ok(r.desc === cd[1], rel + ' :: SEO description differs from ' + r.sheet +
        ' [comment: ' + cd[1] + '] [sheet: ' + r.desc + ']');
    }
    // the strings must be this branch's, not a neighbour's
    if (r.title) {
      ok(r.title.includes(me.branchName) || r.title.includes(me.brandLabel),
        rel + ' :: sheet title does not name this branch: ' + r.title);
      ok(r.title.includes(me.seoTown), rel + ' :: sheet title does not carry seoTown: ' + r.title);
    }
    if (r.desc) {
      ok(r.desc.length >= 70 && r.desc.length <= 175,
        rel + ' :: sheet description length ' + r.desc.length + ' out of range');
      for (const o of others) {
        if (o.brandLabel === me.brandLabel) continue;
        ok(!r.desc.includes(o.brandLabel), rel + ' :: sheet description names ' + o.brandLabel);
      }
    }
  }
}

console.log('');
console.log('SHEET ROWS COMPARED: ' + rowsSeen + ' (across ' + pageDirs.length + ' pages folder(s))');
console.log('CHECKS RUN: ' + checks + '   FAILURES: ' + fails);
if (fails) {
  console.log('');
  failures.forEach(f => console.log('  FAIL  ' + f));
  process.exit(1);
}
console.log('');
console.log('SK Chemists (Bootle) item 3.8: clean on every check in this pass.');
