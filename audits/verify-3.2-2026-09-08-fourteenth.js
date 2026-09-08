const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = '/sessions/sweet-inspiring-franklin/mnt/rbh-site-data';
const BJSON = path.join(ROOT, 'branches.json');

function sha256(buf) {
  return require('crypto').createHash('sha256').update(buf).digest('hex');
}

const original = fs.readFileSync(BJSON);
const originalHash = sha256(original);
console.log('baseline sha256:', originalHash);

function runChecker() {
  try {
    const out = execSync('node ' + path.join(ROOT, 'tools/check-branch-links.js'), { cwd: ROOT, encoding: 'utf8' });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
}

function restore() {
  fs.writeFileSync(BJSON, original);
  const h = sha256(fs.readFileSync(BJSON));
  if (h !== originalHash) throw new Error('RESTORE FAILED sha256 mismatch: ' + h);
}

function withMutation(label, mutateFn) {
  const data = JSON.parse(original.toString('utf8'));
  mutateFn(data);
  fs.writeFileSync(BJSON, JSON.stringify(data, null, 2) + '\n');
  const r = runChecker();
  console.log('--- INJECTION:', label, '---');
  console.log('exit code:', r.code);
  console.log(r.out.split('\n').filter(l => l.includes('FAIL') || l.includes('scorah')).join('\n'));
  restore();
  console.log('restored, sha256 verified match.');
}

// baseline check first
const baseline = runChecker();
console.log('BASELINE exit code:', baseline.code);
if (baseline.code !== 0) { console.log(baseline.out); process.exit(1); }

// (1) odsCode duplicate: scorah_hazel odsCode -> scorah_bramhall's FL495
withMutation('odsCode duplicate (scorah_hazel -> FL495)', d => {
  const hazel = d.branches.find(b => b.id === 'scorah_hazel');
  hazel.odsCode = 'FL495';
});

// (2) nhsEmail mismatch on scorah_bramhall
withMutation('nhsEmail mismatch (scorah_bramhall)', d => {
  const b = d.branches.find(b => b.id === 'scorah_bramhall');
  b.nhsEmail = 'pharmacy.WRONG@nhs.net';
});

// (3) nhsReviewUrl truncated to ODS code (the original Gordon Short fault shape) on scorah_hazel
withMutation('nhsReviewUrl truncated (scorah_hazel)', d => {
  const b = d.branches.find(b => b.id === 'scorah_hazel');
  b.nhsReviewUrl = 'https://www.nhs.uk/services/pharmacy/scorah-chemists-hazel-grove/XFKD04';
});

// (4) googleReviewUrl duplicate: scorah_hazel set to scorah_bramhall's own review link
withMutation('googleReviewUrl duplicate (scorah_hazel -> bramhall link)', d => {
  const bramhall = d.branches.find(b => b.id === 'scorah_bramhall');
  const hazel = d.branches.find(b => b.id === 'scorah_hazel');
  hazel.googleReviewUrl = bramhall.googleReviewUrl;
});

// (5) website malformed: trailing slash on scorah_bramhall
withMutation('website trailing slash (scorah_bramhall)', d => {
  const b = d.branches.find(b => b.id === 'scorah_bramhall');
  b.website = b.website + '/';
});

// (6) pfLink cross-branch ownership: scorah_bramhall pfLink repointed at a real, different, non-sister branch's own generated PF page
withMutation('pfLink cross-branch (scorah_bramhall -> riddings)', d => {
  const b = d.branches.find(b => b.id === 'scorah_bramhall');
  b.pfLink = 'https://www.scorah-chemists.co.uk/pharmacy-first-riddings-timperley.html';
});

console.log('ALL INJECTIONS COMPLETE. Final restore check:');
const finalHash = sha256(fs.readFileSync(BJSON));
console.log('final sha256:', finalHash, finalHash === originalHash ? 'MATCH' : 'MISMATCH!!');
