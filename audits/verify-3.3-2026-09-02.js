// Independent eighth-pass extraction for item 3.3 (Fishlocks Chemist, Ainsdale
// and Eccleston). Written fresh for this run, own regexes throughout, imports
// nothing from tools/. Repeats every leg the seventh pass (2026-09-01) proved,
// so a regression since then would be caught even though the repo checkers
// already passed clean, and adds two legs neither the sixth nor seventh pass's
// independent extraction covered: meta keywords (own town present, sister town
// absent unless excused, no sister brandLabel) and JSON-LD PostalAddress
// matching branches.json field by field, since both are machine-read facts a
// visible-text-only extraction cannot see.
const fs = require('fs');
const path = require('path');

const branches = JSON.parse(fs.readFileSync('branches.json', 'utf8')).branches;
const ain = branches.find(b => b.id === 'fishlocks_ainsdale');
const ecc = branches.find(b => b.id === 'fishlocks_eccleston');
if (!ain || !ecc) { console.error('FAIL: branch records not found'); process.exit(1); }

let checks = 0, failures = 0;
function check(label, cond) {
  checks++;
  if (!cond) { failures++; console.log('FAIL: ' + label); }
}

const serviceDir = 'modules/service/pages';
const switchDir = 'modules/switch/pages';
const branchDir = 'modules/branch/pages';

const serviceSlugs = ['contraception', 'earache-treatment', 'impetigo-treatment',
  'insect-bite-treatment', 'pharmacy-first', 'shingles-treatment', 'sinusitis-treatment',
  'sore-throat-treatment', 'travel-clinic', 'uti-treatment', 'weight-loss-clinic'];

function pagesFor(b, slug) {
  return path.join(serviceDir, `${slug}-${b.brandSlug}-${b.townSlug}.html`);
}

const allPages = [];
for (const b of [ain, ecc]) {
  for (const slug of serviceSlugs) allPages.push({ b, other: b === ain ? ecc : ain, file: pagesFor(b, slug), family: 'service' });
  allPages.push({ b, other: b === ain ? ecc : ain, file: path.join(switchDir, `switch-prescriptions-${b.brandSlug}-${b.townSlug}.html`), family: 'switch' });
  allPages.push({ b, other: b === ain ? ecc : ain, file: path.join(branchDir, `pharmacy-${b.brandSlug}-${b.townSlug}.html`), family: 'branch' });
}
check('26 pages expected', allPages.length === 26);

function stripComments(html) { return html.replace(/<!--[\s\S]*?-->/g, ''); }
function wordBoundary(str, word) {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${esc}\\b`, 'i').test(str);
}

for (const { b, other, file, family } of allPages) {
  if (!fs.existsSync(file)) { failures++; console.log(`FAIL: missing page ${file}`); checks++; continue; }
  const raw = fs.readFileSync(file, 'utf8');
  const visible = stripComments(raw);

  const h1s = [...visible.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  check(`${file}: exactly one H1`, h1s.length === 1);
  const h1text = h1s.length ? h1s[0][1].replace(/<[^>]+>/g, '').trim() : '';

  if (h1s.length) check(`${file}: H1 carries own seoTown (${b.seoTown})`, wordBoundary(h1text, b.seoTown));

  if (h1s.length) {
    const namesSister = wordBoundary(h1text, other.seoTown);
    const excused = b.serviceAreaList.some(t => t.toLowerCase() === other.seoTown.toLowerCase());
    check(`${file}: H1 does not name sister town (${other.seoTown}) unless excused`, !namesSister || excused);
  }

  check(`${file}: own phone (${b.phone}) present`, visible.includes(b.phone));
  check(`${file}: sister phone (${other.phone}) absent`, !visible.includes(other.phone));

  check(`${file}: own postcode (${b.postalCode}) present`, visible.includes(b.postalCode));
  check(`${file}: sister postcode (${other.postalCode}) absent`, !visible.includes(other.postalCode));

  check(`${file}: no doubled own-town phrase`, !new RegExp(`${b.seoTown}\\s+in\\s+${b.seoTown}`, 'i').test(visible));

  // NEW LEG (eighth pass): JSON-LD PostalAddress matches branches.json exactly
  const ldMatch = raw.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (!ldMatch) {
    failures++; checks++; console.log(`FAIL: ${file}: no JSON-LD block found`);
  } else {
    let ld;
    try { ld = JSON.parse(ldMatch[1]); } catch (e) { ld = null; }
    check(`${file}: JSON-LD parses`, !!ld);
    if (ld) {
      const addr = ld.address || {};
      check(`${file}: JSON-LD streetAddress matches`, addr.streetAddress === b.streetAddress);
      check(`${file}: JSON-LD addressLocality matches`, addr.addressLocality === b.addressLocality);
      check(`${file}: JSON-LD postalCode matches`, addr.postalCode === b.postalCode);
      check(`${file}: JSON-LD addressRegion matches`, addr.addressRegion === b.addressRegion);
      check(`${file}: JSON-LD addressCountry matches`, addr.addressCountry === b.addressCountry);
      check(`${file}: JSON-LD telephone matches`, ld.telephone === b.phone);
    }
  }
}

const sheetFiles = [
  path.join(serviceDir, 'SEO.md'), path.join(serviceDir, 'INDEX.md'),
  path.join(switchDir, 'SEO.md'), path.join(switchDir, 'INDEX.md'),
  path.join(branchDir, 'SEO.md'), path.join(branchDir, 'INDEX.md'),
];
for (const sheet of sheetFiles) {
  if (!fs.existsSync(sheet)) { failures++; console.log(`FAIL: missing sheet ${sheet}`); checks++; continue; }
  const text = fs.readFileSync(sheet, 'utf8');
  for (const b of [ain, ecc]) {
    const slugPattern = `${b.brandSlug}-${b.townSlug}`;
    const blockMatches = text.split(/\n(?=#|- \*\*Page Title)/).filter(blk => blk.toLowerCase().includes(slugPattern));
    check(`${sheet}: at least one block for ${b.id}`, blockMatches.length >= 1);
    for (const blk of blockMatches) {
      const titleLines = [...blk.matchAll(/- \*\*Page Title:\*\*\s*(.+)/g)];
      const descLines = [...blk.matchAll(/- \*\*Page Description:\*\*\s*(.+)/g)];
      check(`${sheet} [${slugPattern}]: at most one Page Title label per block`, titleLines.length <= 1);
      check(`${sheet} [${slugPattern}]: at most one Page Description label per block`, descLines.length <= 1);
      if (titleLines.length) {
        check(`${sheet} [${slugPattern}]: title carries own town`, wordBoundary(titleLines[0][1], b.seoTown));
        check(`${sheet} [${slugPattern}]: title <= 65 chars`, titleLines[0][1].trim().length <= 65);
      }
      if (descLines.length) {
        check(`${sheet} [${slugPattern}]: description carries own town`, wordBoundary(descLines[0][1], b.seoTown));
        const len = descLines[0][1].trim().length;
        check(`${sheet} [${slugPattern}]: description 80-165 chars`, len >= 80 && len <= 165);
      }

      const kwLines = [...blk.matchAll(/- \*\*Meta Keywords:\*\*\s*(.+)/g)];
      check(`${sheet} [${slugPattern}]: at most one Meta Keywords label per block`, kwLines.length <= 1);
      if (kwLines.length) {
        const other = b === ain ? ecc : ain;
        const kw = kwLines[0][1];
        check(`${sheet} [${slugPattern}]: keywords carry own town`, wordBoundary(kw, b.seoTown));
        const namesSisterTown = wordBoundary(kw, other.seoTown);
        const excused = b.serviceAreaList.some(t => t.toLowerCase() === other.seoTown.toLowerCase());
        check(`${sheet} [${slugPattern}]: keywords do not name sister town unless excused`, !namesSisterTown || excused);
        check(`${sheet} [${slugPattern}]: keywords do not name sister brandLabel`, !kw.toLowerCase().includes(other.brandLabel.toLowerCase()) || other.brandLabel.toLowerCase() === b.brandLabel.toLowerCase());
      }
    }
  }
}

for (const b of [ain, ecc]) {
  const other = b === ain ? ecc : ain;
  const swFile = path.join(switchDir, `switch-prescriptions-${b.brandSlug}-${b.townSlug}.html`);
  const raw = fs.readFileSync(swFile, 'utf8');
  const ownLink = `switch-prescriptions-${b.brandSlug}-${b.townSlug}.html`;
  const sisterLink = `switch-prescriptions-${other.brandSlug}-${other.townSlug}.html`;
  check(`${swFile}: does not self-reference the sister branch's switch page`, !raw.includes(sisterLink) || raw.includes(ownLink));
}

console.log(`\n${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
