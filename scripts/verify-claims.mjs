// Audits the SHIPPED PROSE, not just the data.
//
// This exists because two corrected claims survived in the Sources page after
// the data layer had been fixed: a scripted replacement silently failed to
// match, and the tests all still passed because they only inspected
// src/data/*. A tool whose data is right but whose methodology page still
// asserts the error is still telling users the wrong thing.
//
// Run: node scripts/verify-claims.mjs

import { readFileSync } from 'node:fs';

const files = {
  'src/App.jsx': readFileSync('src/App.jsx', 'utf8'),
  'src/data/symptoms.js': readFileSync('src/data/symptoms.js', 'utf8'),
  'src/data/dementiaTypes.js': readFileSync('src/data/dementiaTypes.js', 'utf8'),
  'src/data/redFlags.js': readFileSync('src/data/redFlags.js', 'utf8'),
  'README.md': readFileSync('README.md', 'utf8'),
};

// Retracted claims. Each entry may allow specific files where the string is
// legitimately quoted while being described as wrong.
const RETRACTED = [
  {
    what: 'antipsychotic sensitivity called an indicative biomarker',
    needle: 'Indicative biomarker:</strong> Severe neuroleptic',
  },
  {
    what: 'antipsychotic sensitivity called an indicative biomarker (data)',
    needle: 'neuroleptic sensitivity is INDICATIVE BIOMARKER',
  },
  {
    what: '"FTD is most common cause of dementia under 65"',
    needle: 'FTD is most common cause of dementia under 65',
  },
  {
    what: 'unsourced "50%+ of dementia in 80+" figure',
    needle: '50%+ of dementia in 80+',
  },
  {
    what: 'NINDS-AIREN cited as current vascular criteria without VASCOG',
    needle: 'NINDS-AIREN criteria;',
  },
  { what: 'stale `ftd` type key', needle: 'dementiaTypes.ftd' },
  { what: 'old per-symptom discriminating flag in data', needle: 'discriminating: true', skip: ['src/App.jsx', 'README.md'] },
  { what: 'old onset option values', needle: "value: \"1month\"" },
  { what: 'removed Mixed item "Age 80+" as a scored symptom', needle: "id: 'mixed10'" },

  // --- corrections from the criteria rework ---
  {
    what: 'visuospatial impairment still called a CORE feature of DLB',
    needle: 'is a core feature of dementia with Lewy bodies',
  },
  {
    what: 'the retired triple-barrelled LATE item',
    needle: 'it began after about age 80, and it has crept along',
  },
  { what: 'stale mem9 reference in scored data', needle: "id: 'mem9'" },
];

// Corrections that must be documented somewhere user-visible, not just in code
// comments. Each must appear in App.jsx (the Sources/Methodology page) so a
// user can see what changed and why.
const MUST_DOCUMENT = [
  { what: 'DLB biomarker correction', needle: 'Antipsychotic sensitivity is not one of them', file: 'src/App.jsx' },
  { what: 'young-onset correction', needle: 'most common cause of young-onset dementia', file: 'src/App.jsx' },
  { what: 'pooled autopsy figure replacing the unsourced one', needle: '2,695', file: 'src/App.jsx' },
  { what: 'why Age 80+ was removed', needle: 'near-universal finding', file: 'src/App.jsx' },
  { what: 'per-type evidence tiers explained', needle: 'Evidence tiers (per type, not per symptom)', file: 'src/App.jsx' },
  { what: 'prevalence use disclosed', needle: 'How prevalence is used', file: 'src/App.jsx' },
  { what: 'question kinds explained', needle: 'Question types', file: 'src/App.jsx' },
  { what: 'limits stated', needle: 'What this tool will not do', file: 'src/App.jsx' },
  { what: 'README documents corrections', needle: 'Corrections made in the', file: 'README.md' },

  // --- criteria rework must be explained where users can see it ---
  { what: 'criteria-based core scoring explained', needle: 'Core evidence is counted per', file: 'src/App.jsx' },
  { what: 'the DLB 2-of-4 threshold stated', needle: '2 of 4 core clinical features', file: 'src/App.jsx' },
  { what: 'the AD-vs-LATE defect disclosed', needle: 'LATE outranked Alzheimer', file: 'src/App.jsx' },
  { what: 'parkinsonism grouping explained', needle: 'Rest tremor and rigidity both satisfy', file: 'src/App.jsx' },
  { what: 'README documents the criteria rework', needle: 'Core evidence is counted per criterion', file: 'README.md' },
];

let failures = 0;

console.log('\n== Retracted claims must not appear anywhere ==');
for (const { what, needle, skip = [] } of RETRACTED) {
  const hits = Object.entries(files)
    .filter(([name]) => !skip.includes(name))
    .filter(([, body]) => body.includes(needle))
    .map(([name]) => name);
  const ok = hits.length === 0;
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${what}${ok ? '' : ` — still in ${hits.join(', ')}`}`);
}

console.log('\n== Corrections must be documented user-visibly ==');
for (const { what, needle, file } of MUST_DOCUMENT) {
  const ok = files[file].includes(needle);
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${what} (${file})`);
}

console.log(
  failures === 0 ? '\n✅ Shipped prose matches the corrected evidence\n' : `\n❌ ${failures} claim problem(s)\n`
);
process.exit(failures === 0 ? 0 : 1);
