// Independent seventh-pass verifier for item 3.6 (McCanns Chemist, Aigburth
// and Sandringham). Fresh regexes throughout; imports nothing from tools/.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const branches = JSON.parse(fs.readFileSync(path.join(ROOT, 'branches.json'), 'utf8')).branches;

const aig = branches.find(b => b.id === 'mccanns_aigburth');
const san = branches.find(b => b.id === 'mccanns_sandringham');
if (!aig || !san) { console.error('FAIL: could not find both McCanns branches in branches.json'); process.exit(1); }

let checks = 0, failures = 0;
function check(label, cond) {
  checks++;
  if (!cond) { failures++; console.log('FAIL:', label); }
}

function walk(dir) {
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(walk(p));
    else out.push(p);
  }
  return out;
}
const allPages = walk(path.join(ROOT, 'modules')).filter(p => p.endsWith('.html'));
const mccannsPages = allPages.filter(p => path.basename(p).toLowerCase().includes('mccanns'));
check('found exactly 26 McCanns pages (branch+service+switch)', mccannsPages.length === 26);
console.log('McCanns pages found:', mccannsPages.length);

function branchForPage(p) {
  const base = path.basename(p);
  if (base.includes('aigburth')) return aig;
  if (base.includes('sandringham')) return san;
  return null;
}

const otherBrandPostcodes = branches.filter(b => b.id !== aig.id && b.id !== san.id).map(b => b.postalCode);
const otherBrandPhones = branches.filter(b => b.id !== aig.id && b.id !== san.id).map(b => b.phone);

for (const pagePath of mccannsPages) {
  const html = fs.readFileSync(pagePath, 'utf8');
  const branch = branchForPage(pagePath);
  const base = path.basename(pagePath);
  if (!branch) { failures++; console.log('FAIL: page matches no known branch:', base); continue; }
  const other = branch === aig ? san : aig;

  const h1m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  check(`${base}: has an H1`, !!h1m);
  if (h1m) {
    const h1text = h1m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    check(`${base}: H1 contains own seoTown "${branch.seoTown}"`, h1text.includes(branch.seoTown));
    const namesOtherTown = h1text.includes(other.seoTown);
    const excused = branch.serviceAreaList && branch.serviceAreaList.includes(other.seoTown);
    check(`${base}: H1 does not name sister's seoTown unless excused`, !namesOtherTown || excused);
  }

  const telHrefs = [...html.matchAll(/href="tel:([+0-9]+)"/g)].map(m => m[1]);
  const ownPhoneDigits = branch.phone.replace(/\D/g, '');
  check(`${base}: contains own phone as tel: link`, telHrefs.some(t => t.replace(/\D/g, '').endsWith(ownPhoneDigits)));
  check(`${base}: contains own phone as visible text`, html.includes(branch.phone));
  check(`${base}: does not contain sister's phone`, !html.includes(other.phone));
  for (const ph of otherBrandPhones) {
    check(`${base}: does not contain ${ph} (another branch's phone)`, !html.includes(ph));
  }

  check(`${base}: contains own postcode`, html.includes(branch.postalCode));
  check(`${base}: does not contain sister's postcode`, !html.includes(other.postalCode));
  for (const pc of otherBrandPostcodes) {
    check(`${base}: does not contain ${pc} (another branch's postcode)`, !html.includes(pc));
  }

  const ldMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  check(`${base}: exactly one JSON-LD block`, ldMatches.length === 1);
  if (ldMatches.length === 1) {
    let ld;
    try { ld = JSON.parse(ldMatches[0][1]); } catch (e) { ld = null; }
    check(`${base}: JSON-LD parses`, !!ld);
    if (ld) {
      check(`${base}: JSON-LD name is branch's own branchName`, ld.name === branch.branchName);
      check(`${base}: JSON-LD name is not the bare shared brandLabel`, ld.name !== branch.brandLabel);
      if (ld.address) {
        check(`${base}: JSON-LD streetAddress matches`, ld.address.streetAddress === branch.streetAddress);
        check(`${base}: JSON-LD addressLocality matches`, ld.address.addressLocality === branch.addressLocality);
        check(`${base}: JSON-LD postalCode matches`, ld.address.postalCode === branch.postalCode);
        check(`${base}: JSON-LD addressRegion matches`, ld.address.addressRegion === branch.addressRegion);
        check(`${base}: JSON-LD addressCountry matches`, ld.address.addressCountry === branch.addressCountry);
      } else {
        failures++; console.log(`FAIL: ${base}: JSON-LD has no address block`);
      }
      if (ld.telephone !== undefined) {
        check(`${base}: JSON-LD telephone matches exactly`, ld.telephone === branch.phone);
      }
    }
  }

  const mapMatches = [...html.matchAll(/https:\/\/www\.google\.com\/maps\?q=[^"']*output=embed/g)];
  check(`${base}: exactly one map embed`, mapMatches.length === 1);
  if (mapMatches.length === 1) {
    const qMatch = mapMatches[0][0].match(/[?&]q=([^&"']+)/);
    check(`${base}: map embed has a q= param`, !!qMatch);
    if (qMatch) {
      const decoded = decodeURIComponent(qMatch[1].replace(/\+/g, ' '));
      const expected = `${branch.streetAddress}, ${branch.addressLocality}, ${branch.postalCode}`;
      check(`${base}: map query equals own full address`, decoded === expected);
    }
  }

  // Branch landing pages also carry a "Get directions" button whose destination
  // must equal the same address as the map query on the same page.
  const dirMatches = [...html.matchAll(/google\.com\/maps\/dir\/\?api=1&destination=([^"'&]+)/g)];
  if (dirMatches.length > 0) {
    check(`${base}: exactly one directions button`, dirMatches.length === 1);
    const decodedDir = decodeURIComponent(dirMatches[0][1].replace(/\+/g, ' '));
    const expected = `${branch.streetAddress}, ${branch.addressLocality}, ${branch.postalCode}`;
    check(`${base}: directions destination equals own full address`, decodedDir === expected);
  }

  const waMatch = html.match(/data-wa="([^"]+)"/);
  if (waMatch) {
    check(`${base}: data-wa is a UK mobile E.164 without plus`, /^447\d{9}$/.test(waMatch[1]));
  }

  const dbMatch = html.match(/data-branch="([^"]+)"/);
  if (dbMatch) {
    const val = dbMatch[1];
    check(`${base}: data-branch is this branch's own name`, val === branch.branchName || val === branch.brandLabel);
    check(`${base}: data-branch is not the sister's branchName`, val !== other.branchName || val === branch.branchName);
  }

  check(`${base}: no http:// links`, !/href="http:\/\//.test(html));

  if (html.includes('leave-a-review')) {
    check(`${base}: own NHS review URL present if any review link exists`,
      html.includes(branch.odsCode) || html.includes(branch.nhsReviewUrl));
    check(`${base}: sister's ODS code not present`, !html.includes(other.odsCode));
  }
  if (html.includes('g.page/r/')) {
    check(`${base}: own Google review URL present`, html.includes(branch.googleReviewUrl));
    check(`${base}: sister's Google review URL absent`, !html.includes(other.googleReviewUrl));
  }
}

console.log('\nTotal checks:', checks, ' Failures:', failures);
if (checks < 500) { console.log('REFUSING TO REPORT: fewer than 500 checks run, coverage too thin to trust.'); process.exit(1); }
process.exit(failures === 0 ? 0 : 1);
