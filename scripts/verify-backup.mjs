// Export / import checks.
//
// The property that matters for a backup is ROUND-TRIP FIDELITY: what comes
// back must equal what went in. A file that exports cleanly but restores
// lossily is worse than no backup, because it is trusted.
//
// Run: node scripts/verify-backup.mjs

import { buildExport, exportFilename, parseImport, EXPORT_KIND } from '../src/backup.js';
import { SCHEMA_VERSION } from '../src/migrate.js';

let failures = 0;
const check = (name, cond, detail = '') => {
  if (!cond) failures += 1;
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !detail ? '' : ` -- ${detail}`}`);
};

const FULL = {
  symptomData: {
    beh5:  { checked: true, firstNoticed: 'y1', impactConsequence: 'supervision', trend: 'slow_worse' },
    beh6:  { checked: true, firstNoticed: 'y2', frequency: 'rare', impactConsequence: 'harm' },
    mem7:  { checked: true, firstNoticed: 'y1', impactAbility: 'handson', trend: 'slow_worse' },
    mov6:  { checked: true, whenHappened: 'y3' },
    onset2:{ checked: true },
  },
  medicalHistory: { patientName: 'Jane Doe', patientAge: '82', historyStroke: true, additionalNotes: 'note' },
  adlData: { iadl1: 'assistance', badl1: 'supervision' },
  redFlagData: { rf_delirium: 'yes', rf_meds: 'no' },
  mode: 'full',
};

console.log('\n== Round trip ==');
{
  const file = JSON.stringify(buildExport(FULL));
  const result = parseImport(file);
  check('a valid export imports cleanly', result.ok, result.error);

  const back = result.data;
  check('symptom data survives exactly',
    JSON.stringify(back.symptomData) === JSON.stringify(FULL.symptomData),
    JSON.stringify(back.symptomData));
  check('medical history survives', back.medicalHistory.patientName === 'Jane Doe' && back.medicalHistory.historyStroke === true);
  check('ADL data survives', JSON.stringify(back.adlData) === JSON.stringify(FULL.adlData));
  check('red flag answers survive', JSON.stringify(back.redFlagData) === JSON.stringify(FULL.redFlagData));
  check('mode survives', back.mode === 'full');
  check('nothing reported as dropped', result.summary.dropped === 0, String(result.summary.dropped));
  check('summary counts are right',
    result.summary.symptoms === 5 && result.summary.redFlags === 1 && result.summary.adls === 2,
    JSON.stringify(result.summary));
  check('current-version file is not flagged as upgraded', result.summary.upgraded === false);
}

console.log('\n== Older exports still load ==');
{
  // A v1-era file, as the very first version of the tool would have written it.
  const v1 = JSON.stringify({
    kind: EXPORT_KIND, version: 1,
    symptomData: {
      beh5: { checked: true, onset: '1year', frequency: 'daily', severity: 'severe' },
      mem7: { checked: true, onset: '1year', severity: 'severe' },
      mixed10: { checked: true, onset: '1month' },   // removed item
    },
    medicalHistory: { patientName: 'Old Record' }, adlData: {}, redFlagData: {},
  });
  const r = parseImport(v1);
  check('v1 export imports', r.ok, r.error);
  check('v1 behavioural item lands on the consequence scale',
    r.data.symptomData.beh5?.impactConsequence === 'supervision',
    JSON.stringify(r.data.symptomData.beh5));
  check('v1 ability item lands on the ability scale',
    r.data.symptomData.mem7?.impactAbility === 'handson',
    JSON.stringify(r.data.symptomData.mem7));
  check('removed item is dropped, and the drop is REPORTED not silent',
    !r.data.symptomData.mixed10 && r.summary.dropped === 1, JSON.stringify(r.summary));
  check('older file is flagged as upgraded', r.summary.upgraded === true);
}

console.log('\n== Bad input never throws ==');
{
  const cases = [
    ['not JSON at all', 'this is not json {{{'],
    ['JSON but not an object', '[1,2,3]'],
    ['object with no symptomData', '{"kind":"dementia-assessment","version":3}'],
    ['a different kind of file', '{"kind":"shopping-list","symptomData":{}}'],
    ['null', 'null'],
    ['empty string', ''],
  ];
  for (const [label, text] of cases) {
    let threw = false, res;
    try { res = parseImport(text); } catch { threw = true; }
    check(`${label} -> message, not crash`, !threw && res?.ok === false && typeof res.error === 'string');
  }
}

console.log('\n== Filenames ==');
{
  const today = new Date().toISOString().slice(0, 10);
  check('name is slugged into the filename',
    exportFilename({ patientName: 'Jane Doe' }) === `dementia-assessment-jane-doe-${today}.json`,
    exportFilename({ patientName: 'Jane Doe' }));
  check('falls back to date alone with no name',
    exportFilename({}) === `dementia-assessment-${today}.json`, exportFilename({}));
  check('unsafe characters cannot escape into the filename',
    !/[^a-z0-9.\-]/.test(exportFilename({ patientName: '../../etc/passwd  <>|' })),
    exportFilename({ patientName: '../../etc/passwd  <>|' }));
}

console.log('\n== Export shape ==');
{
  const e = buildExport(FULL);
  check('carries kind and current version', e.kind === EXPORT_KIND && e.version === SCHEMA_VERSION);
  check('carries an export timestamp', typeof e.exportedAt === 'string' && e.exportedAt.includes('T'));
  check('carries every section', ['symptomData','medicalHistory','adlData','redFlagData','mode'].every(k => k in e));
}

console.log(failures === 0 ? '\n✅ Export/import round-trips without loss\n' : `\n❌ ${failures} failure(s)\n`);
process.exit(failures === 0 ? 0 : 1);
