// Sanity checks for the scoring rewrite. Run: node scripts/verify-scoring.mjs
//
// These are canonical textbook presentations. If a textbook DLB profile does
// not rank DLB first, the mappings are wrong and it does not matter how clean
// the code is.

import { globalSymptoms, quickSymptoms, symptomById, categories } from '../src/data/symptoms.js';
import { redFlags } from '../src/data/redFlags.js';
import { dementiaTypes, typeKeys, EVIDENCE_WEIGHTS } from '../src/data/dementiaTypes.js';
import { ITEM_KINDS, getModifiersForKind } from '../src/data/itemKinds.js';
import { computeScores, rankTypes, assessConfidence } from '../src/scoring.js';

let failures = 0;
const check = (name, condition, detail = '') => {
  if (condition) {
    console.log(`  PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name}${detail ? ` -- ${detail}` : ''}`);
  }
};

const checkedFrom = (ids) => Object.fromEntries(ids.map((id) => [id, { checked: true }]));

const rankFor = (ids, list = globalSymptoms) => {
  const scores = computeScores(checkedFrom(ids), list);
  return { scores, ranked: rankTypes(scores) };
};

// ---------------------------------------------------------------
console.log('\n== Data integrity ==');

check(`${globalSymptoms.length} symptoms, all with unique ids`,
  new Set(globalSymptoms.map((s) => s.id)).size === globalSymptoms.length);

check('every symptom declares a known kind',
  globalSymptoms.every((s) => ITEM_KINDS[s.kind]),
  globalSymptoms.filter((s) => !ITEM_KINDS[s.kind]).map((s) => s.id).join(', '));

check('every symptom maps to at least one type',
  globalSymptoms.every((s) => Object.keys(s.types ?? {}).length > 0),
  globalSymptoms.filter((s) => !Object.keys(s.types ?? {}).length).map((s) => s.id).join(', '));

check('every type key referenced actually exists',
  globalSymptoms.every((s) => Object.keys(s.types).every((t) => typeKeys.includes(t))),
  globalSymptoms.flatMap((s) => Object.keys(s.types).filter((t) => !typeKeys.includes(t))).join(', '));

check('every evidence tier is valid',
  globalSymptoms.every((s) => Object.values(s.types).every((w) => w in EVIDENCE_WEIGHTS)));

check('every `against` reference is a real type',
  globalSymptoms.every((s) => (s.against ?? []).every((t) => typeKeys.includes(t))));

check('every symptom cites evidence',
  globalSymptoms.every((s) => typeof s.evidence === 'string' && s.evidence.length > 20));

check('every type has at least one core symptom',
  typeKeys.every((t) => globalSymptoms.some((s) => s.types[t] === 'core')),
  typeKeys.filter((t) => !globalSymptoms.some((s) => s.types[t] === 'core')).join(', '));

check('course/context items expose no modifiers',
  globalSymptoms
    .filter((s) => s.kind === 'course' || s.kind === 'context')
    .every((s) => getModifiersForKind(s.kind).length === 0));

check('no `event` item is asked "how often"',
  globalSymptoms
    .filter((s) => s.kind === 'event')
    .every((s) => !getModifiersForKind(s.kind).includes('frequency')));

check('no `deficit` item is asked "how often"',
  globalSymptoms
    .filter((s) => s.kind === 'deficit')
    .every((s) => !getModifiersForKind(s.kind).includes('frequency')));

check('red flag ids unique and all carry an action',
  new Set(redFlags.map((f) => f.id)).size === redFlags.length &&
    redFlags.every((f) => f.action?.length > 20));

// ---------------------------------------------------------------
console.log('\n== Quick screen ==');

check(`quick screen is 15-25 items (is ${quickSymptoms.length})`,
  quickSymptoms.length >= 15 && quickSymptoms.length <= 25);

const quickCoverage = typeKeys.filter((t) => quickSymptoms.some((s) => s.types[t] === 'core'));
check('every type has a core item in the quick screen',
  quickCoverage.length === typeKeys.length,
  `missing: ${typeKeys.filter((t) => !quickCoverage.includes(t)).join(', ')}`);

// ---------------------------------------------------------------
console.log('\n== Canonical presentations (full set) ==');

const CASES = [
  {
    name: 'Textbook DLB',
    expect: 'lewy',
    ids: ['mem5', 'hall1', 'sleep1', 'mov2', 'mov1', 'exec4', 'auto5', 'sleep3'],
  },
  {
    name: 'Textbook amnestic AD',
    expect: 'alzheimers',
    ids: ['mem1', 'mem3', 'mem7', 'mem2', 'onset2', 'exec1', 'lang1'],
  },
  {
    name: 'Textbook bvFTD',
    expect: 'bvftd',
    ids: ['beh1', 'beh2', 'beh3', 'beh4', 'eat1', 'eat2', 'onset4', 'beh7'],
  },
  {
    name: 'Textbook vascular (post-stroke)',
    expect: 'vascular',
    ids: ['mov6', 'mem4', 'exec3', 'mem8', 'mov1', 'mov8', 'auto2'],
  },
  {
    name: 'Textbook semantic PPA',
    expect: 'ppa',
    ids: ['lang3', 'lang1', 'onset5', 'lang5', 'lang4'],
  },
  {
    name: 'Textbook PCA',
    expect: 'pca',
    ids: ['onset6', 'exec5', 'exec4', 'mem3', 'lang5'],
  },
];

for (const testCase of CASES) {
  const { scores, ranked } = rankFor(testCase.ids);
  const top = ranked.withEvidence[0];
  check(`${testCase.name} ranks ${dementiaTypes[testCase.expect].shortName} first`,
    top === testCase.expect,
    `got ${top} (${dementiaTypes[top]?.shortName}) at ${scores[top].profileMatch.toFixed(0)}% vs expected at ${scores[testCase.expect].profileMatch.toFixed(0)}%`);
}

// ---------------------------------------------------------------
console.log('\n== Canonical presentations (quick screen) ==');

const QUICK_CASES = [
  { name: 'DLB via quick screen', expect: 'lewy', ids: ['mem5', 'hall1', 'sleep1', 'mov2', 'mov1'] },
  { name: 'AD via quick screen', expect: 'alzheimers', ids: ['mem1', 'mem3', 'mem7', 'onset2'] },
  { name: 'bvFTD via quick screen', expect: 'bvftd', ids: ['beh1', 'beh2', 'beh3', 'eat1', 'onset4'] },
  { name: 'Vascular via quick screen', expect: 'vascular', ids: ['mov6', 'mem4', 'exec3', 'mem8'] },
  { name: 'PPA via quick screen', expect: 'ppa', ids: ['lang2', 'lang3', 'onset5'] },
];

for (const testCase of QUICK_CASES) {
  const { ranked } = rankFor(testCase.ids, quickSymptoms);
  const top = ranked.withEvidence[0];
  check(`${testCase.name} ranks ${dementiaTypes[testCase.expect].shortName} first`,
    top === testCase.expect, `got ${top}`);
}

// ---------------------------------------------------------------
console.log('\n== Regressions the rewrite exists to fix ==');

// The original bug: raw discriminating COUNTS across unequal denominators, so
// a thin FTD signal could out-rank a solid AD signal. Fixed by normalising each
// type against its OWN profile size rather than comparing raw integers.
{
  const { ranked, scores } = rankFor(['mem1', 'mem3', 'mem7', 'onset2', 'beh6', 'lang1']);
  check('normalisation: solid AD signal is not out-ranked by two incidental FTD-ish items',
    ranked.withEvidence[0] === 'alzheimers',
    `got ${ranked.withEvidence[0]}; AD ${scores.alzheimers.profileMatch.toFixed(0)}% vs bvFTD ${scores.bvftd.profileMatch.toFixed(0)}%`);
  // Guard against the test passing for the wrong reason: it should be a clear
  // win on evidence alone, with the prevalence prior playing no part.
  check('...and it wins on evidence alone, not because of the prevalence prior',
    scores.alzheimers.evidenceScore > scores.bvftd.evidenceScore * 2 && !ranked.priorChangedOrder);
}

// The prevalence prior must be a TIE-BREAKER, not an override. Two properties
// have to hold at once: it decides genuinely close calls, and it leaves clear
// evidence alone.
{
  // A wide evidence gap: the prior must not touch it.
  const clearCut = rankFor(['beh1', 'beh2', 'beh3', 'beh4', 'eat1', 'onset4']);
  check('prior does NOT override a strong bvFTD profile despite bvFTD being rare',
    clearCut.ranked.withEvidence[0] === 'bvftd' && !clearCut.ranked.priorChangedOrder);

  // LATE is by construction clinically indistinguishable from AD, so a plain
  // amnestic profile puts them inside the contention band -- exactly where the
  // prior should speak, and it should favour the far commoner AD.
  const amnestic = rankFor(['mem1', 'mem7', 'onset2']);
  check('prior DOES break the plain AD-vs-LATE tie in favour of the commoner AD',
    amnestic.ranked.withEvidence[0] === 'alzheimers',
    `got ${amnestic.ranked.withEvidence[0]}`);
  check('...and the tie was genuinely close (both inside the contention band)',
    amnestic.ranked.contenders.includes('alzheimers') && amnestic.ranked.contenders.includes('late'));

  // ...but the prior must NOT suppress LATE when its own defining item is
  // present. mem9 ("began after 80, slower than expected") is the whole reason
  // LATE is in the tool; if that is checked, LATE should win outright.
  const lateSpecific = rankFor(['mem1', 'mem7', 'onset2', 'mem9']);
  check('LATE wins outright once its defining item is checked',
    lateSpecific.ranked.withEvidence[0] === 'late',
    `got ${lateSpecific.ranked.withEvidence[0]}`);
}

// Visuospatial impairment must NOT give AD the same credit it gives LBD/PCA.
{
  const scores = computeScores(checkedFrom(['exec4']), globalSymptoms);
  const s = symptomById.exec4;
  check('visuospatial impairment is core for LBD and PCA but non-specific for AD',
    s.types.lewy === 'core' && s.types.pca === 'core' && s.types.alzheimers === 'common');
  check('...and that asymmetry shows up in the score',
    scores.lewy.core === 1 && scores.alzheimers.core === 0);
}

// Age 80+ must no longer hand Mixed a free point. Note this is a data-content
// assertion, not a scoring one: under the new proportional model one core item
// out of five cannot swing a result the way +1 on a raw count of 9 could. The
// item was removed because a near-universal finding carries almost no
// information, not because it would still break the maths.
check('"Age 80+" is gone as a scored item', !symptomById.mixed10);
check('the three removed double-counting mixed items are gone',
  !symptomById.mixed3 && !symptomById.mixed6 && !symptomById.mixed8 && !symptomById.mixed9);

// The corrected factual claims must not survive anywhere.
const allEvidence = globalSymptoms.map((s) => s.evidence).join(' ');
check('antipsychotic sensitivity is no longer called an indicative biomarker',
  symptomById.auto5.evidence.includes('NOT an indicative biomarker'));
check('the false "FTD most common under 65" claim is gone',
  !allEvidence.includes('FTD is most common cause of dementia under 65'));
check('onset-before-65 no longer scores for FTD alone',
  Object.keys(symptomById.onset1.types).length > 1 &&
    symptomById.onset1.types.alzheimers === 'common');
check('excessive daytime sleepiness downgraded to supportive for DLB',
  symptomById.sleep3.types.lewy === 'supportive');
check('early urinary symptoms upgraded to a core vascular criterion',
  symptomById.auto2.types.vascular === 'core');

// Counter-evidence must actually bite.
{
  const withCounter = computeScores(checkedFrom(['beh1', 'beh2', 'mem7', 'eat5']), globalSymptoms);
  const without = computeScores(checkedFrom(['beh1', 'beh2']), globalSymptoms);
  check('memory loss + weight loss reduce the bvFTD profile match',
    withCounter.bvftd.profileMatch < without.bvftd.profileMatch,
    `${withCounter.bvftd.profileMatch.toFixed(1)}% vs ${without.bvftd.profileMatch.toFixed(1)}%`);
  check('counter-evidence is reported, not just subtracted',
    withCounter.bvftd.counterEvidence.length === 2);
  check('profile match never goes negative',
    typeKeys.every((t) => withCounter[t].profileMatch >= 0));
}

// Confidence must refuse to name a winner off almost nothing.
{
  const scores = computeScores(checkedFrom(['hall1']), globalSymptoms);
  const c = assessConfidence(scores, checkedFrom(['hall1']), globalSymptoms);
  check('a single checked box yields "insufficient", not a verdict',
    c.level === 'insufficient', `got ${c.level}`);
}
{
  const ids = ['mem5', 'hall1', 'sleep1', 'mov2', 'mov1', 'exec4', 'auto5', 'sleep3', 'mem6', 'auto1', 'auto3', 'mov5'];
  const c = assessConfidence(computeScores(checkedFrom(ids), globalSymptoms), checkedFrom(ids), globalSymptoms);
  check('a full textbook DLB profile reaches "clear"', c.level === 'clear', `got ${c.level}`);
}

// ---------------------------------------------------------------
console.log(`\n== Profile of each type (for eyeballing) ==`);
for (const t of typeKeys) {
  const core = globalSymptoms.filter((s) => s.types[t] === 'core').length;
  const sup = globalSymptoms.filter((s) => s.types[t] === 'supportive').length;
  const com = globalSymptoms.filter((s) => s.types[t] === 'common').length;
  console.log(`  ${dementiaTypes[t].shortName.padEnd(6)} core ${String(core).padStart(2)}  supportive ${String(sup).padStart(2)}  non-specific ${String(com).padStart(2)}   commonness ${dementiaTypes[t].commonness}`);
}
console.log(`\n  ${globalSymptoms.length} symptoms across ${categories.length} categories; ${quickSymptoms.length} in quick screen; ${redFlags.length} red flags\n`);

console.log(failures === 0 ? '✅ All checks passed\n' : `❌ ${failures} check(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);
