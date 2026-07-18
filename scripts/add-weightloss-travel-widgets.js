const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'branches.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const WEIGHT_LOSS = {
  'cherry-lane': '66b20b55bd0ba991115af5e1',
  'clear': '691451f1f9b8831e135baacb',
  'coleman-leigh': '66c8696297a4c50a888f230e',
  'fishlocks': '66b1f5561a0469a9f6b3b359',
  'gordon-short': '66c86a43ec8717372992a30f',
  'hirshmans': '66b9ce9e8ed9220fea0a204c',
  'mccanns': '66bb29f1328f6dafbb88971b',
  'riddings': '66b9c43c99512e8591be4a3d',
  'scorah': '66b9d3d18ed9220fea0a205d',
  'sk-chemists': '66c86584ba5faa183dc1c4a3',
  'smartts': '66c86882ec8717372992a309',
  'tiffenbergs': '66c868fafbe13d151242ede5',
};

const TRAVEL_CLINIC = {
  'cherry-lane': '6a5bf3ac7066e1645399e678',
  'clear': '6a5bf020900e97b9c7d8aa46',
  'coleman-leigh': '6a5bf2bfd34f7693a5c5f1f7',
  'fishlocks': '66b1f4ff9c1e2182b14fac37',
  'gordon-short': '6a5bf360900e97b9c7d8aa49',
  'hirshmans': '66b9cf3a5781154cd1315dff',
  'mccanns': '66b61b3d5e6c5e79f623b3e3',
  'riddings': '6a5bf315b78beedb8f44a0a8',
  'scorah': '66b9d4565781154cd1315e0b',
  'sk-chemists': '6a5bf248918ea659155231e0',
  'smartts': '6a5bf199f1b6a563bc42908c',
  'tiffenbergs': '6a5bf3f6d34f7693a5c5f1fa',
};

let updated = 0;
let skipped = [];

data.branches.forEach((branch) => {
  const slug = branch.brandSlug;
  if (!slug) {
    skipped.push(branch.id + ' (no brandSlug)');
    return;
  }
  if (!WEIGHT_LOSS[slug]) {
    skipped.push(`${branch.id} (brandSlug "${slug}" not in widget map - likely Wilmslow/disposed)`);
    return;
  }
  branch.widgets = branch.widgets || {};
  branch.widgets.weightLoss = WEIGHT_LOSS[slug];
  branch.widgets.travelClinic = TRAVEL_CLINIC[slug];
  updated++;
});

data.schemaNote += ' Added 2026-07-18: widgets.weightLoss and widgets.travelClinic per branch (12 active brand groups; Wilmslow excluded as disposed) — weightLoss widgets existed for all 13 non-rbhealth brands already; travelClinic widgets pre-existed only for Fishlocks/Hirshmans/McCanns/Scorah and were cloned (via Appointedd Clone + resource reassignment from the Fishlocks - Travel Clinic template, category "Travel Health") for the remaining 8 brands (Clear uses the "Online Appointment" resource since it has no physical branch resource in Appointedd).';

fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');

console.log(`Updated ${updated} branches.`);
console.log('Skipped:', skipped);
