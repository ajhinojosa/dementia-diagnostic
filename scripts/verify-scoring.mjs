// Sanity checks for the scoring rewrite. Run: node scripts/verify-scoring.mjs
//
// These are canonical textbook presentations. If a textbook DLB profile does
// not rank DLB first, the mappings are wrong and it does not matter how clean
// the code is.

import { globalSymptoms, quickSymptoms, symptomById, categories } from '../src/data/symptoms.js';
import { redFlags } from '../src/data/redFlags.js';
import { dementiaTypes, typeKeys, EVIDENCE_WEIGHTS } from '../src/data/dementiaTypes.js';
import { ITEM_KINDS, getModifiersForKind, getModifiersFor, resolveImpactKey } from '../src/data/itemKinds.js';
import { computeScores, rankTypes, assessConfidence, distinguishingAnswers } from '../src/scoring.js';
import { TYPE_CRITERIA, criteriaItemIds, evaluateCriteria } from '../src/data/criteria.js';

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
    .every((s) => !getModifiersFor(s).includes('frequency')));

check('no `deficit` item is asked "how often"',
  globalSymptoms
    .filter((s) => s.kind === 'deficit')
    .every((s) => !getModifiersFor(s).includes('frequency')));

// Impact comes in two scales. Asking "how much help do they need" about apathy
// or reckless spending has no answer -- there is no task to assist with -- so
// behaviours and experienced symptoms are asked what they LED TO instead.
check('every item resolves to exactly one impact scale',
  globalSymptoms
    .filter((s) => ITEM_KINDS[s.kind].modifiers.includes('impact'))
    .every((s) => {
      const m = getModifiersFor(s);
      return m.includes('impactAbility') !== m.includes('impactConsequence');
    }));

check('no episodic item is asked the ability-shaped impact question',
  globalSymptoms
    .filter((s) => s.kind === 'episodic')
    .every((s) => resolveImpactKey(s) === 'impactConsequence'),
  globalSymptoms.filter((s) => s.kind === 'episodic' && resolveImpactKey(s) !== 'impactConsequence').map((s) => s.id).join(', '));

check('`impact` slot never leaks to the UI unresolved',
  globalSymptoms.every((s) => !getModifiersFor(s).includes('impact')));

check('every `scale` value is valid',
  globalSymptoms.every((s) => s.scale === undefined || ['ability', 'consequence'].includes(s.scale)));

check('red flag ids unique and all carry an action',
  new Set(redFlags.map((f) => f.id)).size === redFlags.length &&
    redFlags.every((f) => f.action?.length > 20));

// ---------------------------------------------------------------
console.log('\n== Golden mappings (criteria-derived, asserted exactly) ==');

// Ranking tests are robust to single mis-mappings BY DESIGN -- a textbook DLB
// profile still ranks LBD first if one of its five core features is wrongly
// reattributed. That robustness is correct for rankings and useless as a guard
// on the attributions themselves, which is exactly what the clinical audit
// fixed. So the criteria-derived mappings are pinned here, exactly.
//
// Each entry is the COMPLETE expected `types` map. Changing one of these should
// require changing this table, which should require citing the criteria.
const GOLDEN = {
  // DLB 2017 core clinical features
  mem5:   { lewy: 'core' },                                   // fluctuating cognition
  hall1:  { lewy: 'core' },                                   // recurrent complex visual hallucinations
  sleep1: { lewy: 'core' },                                   // REM sleep behaviour disorder
  mov2:   { lewy: 'core' },                                   // parkinsonism (rigidity/bradykinesia)

  // DLB 2017 SUPPORTIVE features -- previously over-weighted as core/key
  sleep3: { lewy: 'supportive' },                             // excessive daytime sleepiness
  auto5:  { lewy: 'supportive' },                             // antipsychotic sensitivity (NOT a biomarker)

  // DLB 2017 parkinsonism is satisfied by ONE of bradykinesia, rest tremor or
  // rigidity. Rest tremor was previously supportive; gait was previously core.
  // The 2017 revision restricts the cardinal features to those three, which
  // excludes gait and postural signs as too non-specific in older people.
  mov3:   { lewy: 'core' },                                   // rest tremor -- a cardinal feature
  mov1:   { vascular: 'core', lewy: 'supportive' },           // gait: VASCOG A2a, NOT a DLB cardinal feature
  exec4:  { pca: 'core', lewy: 'supportive', alzheimers: 'common' }, // visuoperceptual: PCA core; DLB cognitive profile, not a core feature

  // VASCOG 2014
  mov6:   { vascular: 'core', mixed: 'core' },                // A1a documented stroke + persistence
  mov8:   { vascular: 'core' },                               // A1b physical stroke signs
  auto2:  { vascular: 'core', mixed: 'supportive' },          // A2b early urinary -- previously under-weighted
  exec3:  { vascular: 'core', lewy: 'supportive', mixed: 'supportive' },

  // Rascovsky 2011 bvFTD features I-VI. beh1 ("a fundamentally different
  // person") is a gateway question describing the syndrome, not one of the six
  // named features, so it is supportive rather than core.
  beh1:   { bvftd: 'supportive' },
  beh2:   { bvftd: 'core' },                                  // I disinhibition
  beh3:   { bvftd: 'core' },                                  // III loss of empathy
  beh4:   { bvftd: 'core' },                                  // IV perseverative/compulsive
  eat1:   { bvftd: 'core' },                                  // V hyperorality / sweet preference
  onset4: { bvftd: 'core' },                                  // behaviour precedes memory

  // Gorno-Tempini 2011 PPA
  lang2:  { ppa: 'core' },                                    // nonfluent/agrammatic
  lang3:  { ppa: 'core' },                                    // semantic
  onset5: { ppa: 'core' },                                    // language-led for 1-2 years

  // Crutch 2017 PCA -- the core cognitive feature list (>=3 required)
  onset6: { pca: 'core' },
  onset9: { pca: 'core' },                                    // relative sparing of memory/speech/behaviour
  exec5:  { pca: 'core', alzheimers: 'common' },
  exec6:  { pca: 'core' },                                    // simultanagnosia
  exec7:  { pca: 'core' },                                    // dressing apraxia
  exec8:  { pca: 'core' },                                    // optic ataxia / space perception
  exec9:  { pca: 'core' },                                    // acalculia / left-right disorientation
  lang5:  { pca: 'core', ppa: 'supportive' },                 // apperceptive prosopagnosia -- on Crutch's core list

  // Gorno-Tempini 2011 root inclusion criterion 2
  lang6:  { ppa: 'core' },                                    // language is what impairs daily living

  // NIA-AA / LATE
  onset2: { alzheimers: 'core', late: 'supportive' },
  onset7: { alzheimers: 'core', bvftd: 'common', ppa: 'common', pca: 'common', lewy: 'common' },
  mem1:   { alzheimers: 'core', late: 'core', mixed: 'supportive' },
  mem7:   { alzheimers: 'core', late: 'core', mixed: 'supportive' },
  // mem9 retired: it packed three LATE criteria into one checkbox. Replaced by:
  mem10:  { late: 'core', alzheimers: 'common' },             // memory predominant, others spared
  mem11:  { late: 'core' },                                   // slower course than expected
  onset8: { late: 'core', mixed: 'supportive' },              // onset after ~80

  // The corrected young-onset item: must NOT be bvFTD-only
  onset1: { bvftd: 'supportive', ppa: 'supportive', pca: 'supportive', alzheimers: 'common' },
};

for (const [id, expected] of Object.entries(GOLDEN)) {
  const actual = symptomById[id]?.types;
  const same =
    actual &&
    Object.keys(expected).length === Object.keys(actual).length &&
    Object.entries(expected).every(([t, tier]) => actual[t] === tier);
  check(`${id} maps exactly as the criteria specify`, Boolean(same),
    actual ? `got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}` : 'symptom missing');
}

// Counter-evidence mappings are part of the clinical reasoning, so pin them too.
check('exactly the intended symptoms argue against bvFTD',
  globalSymptoms.filter(s => s.against?.includes('bvftd')).map(s => s.id).sort().join(',') === 'eat5,mem7',
  globalSymptoms.filter(s => s.against?.includes('bvftd')).map(s => s.id).join(','));

// Item kinds drive which questions get asked, so a silent kind change would
// reintroduce exactly the UX defect this revision fixed.
const GOLDEN_KINDS = {
  mov6: 'event', mov7: 'event', auto5: 'event',        // past events -> date only
  onset2: 'course', onset4: 'course', mem4: 'course',  // course statements -> no modifiers
  onset1: 'context',                                   // background -> no modifiers
  mixed7: 'finding',                                   // test result
  mem7: 'deficit', exec3: 'deficit', beh3: 'deficit',  // ongoing -> no "how often"
  hall1: 'episodic', sleep1: 'episodic', beh2: 'episodic',
};
for (const [id, kind] of Object.entries(GOLDEN_KINDS)) {
  check(`${id} is kind "${kind}"`, symptomById[id]?.kind === kind, `got ${symptomById[id]?.kind}`);
}

// Which impact question each item asks is a clinical judgement about whether an
// ABILITY was lost or a BEHAVIOUR has consequences. Pinned, because getting it
// wrong produces questions with no answer ("how much help do they need with
// their apathy?").
const GOLDEN_SCALES = {
  // abilities: there is a real task, and help is a real answer
  mem7: 'impactAbility', exec1: 'impactAbility', exec4: 'impactAbility',
  lang3: 'impactAbility', mov1: 'impactAbility', auto2: 'impactAbility',
  // behaviours and experienced symptoms: no task to assist with
  beh5: 'impactConsequence',   // apathy -- you prompt, you do not assist
  beh6: 'impactConsequence',   // reckless spending -- what did it cost
  beh1: 'impactConsequence', beh3: 'impactConsequence', beh7: 'impactConsequence',
  hall1: 'impactConsequence', sleep1: 'impactConsequence', eat1: 'impactConsequence',
  mov5: 'impactConsequence', auto4: 'impactConsequence',
};
for (const [id, expected] of Object.entries(GOLDEN_SCALES)) {
  check(`${id} asks the ${expected === 'impactAbility' ? 'help-needed' : 'consequences'} question`,
    resolveImpactKey(symptomById[id]) === expected,
    `got ${resolveImpactKey(symptomById[id])}`);
}

// ---------------------------------------------------------------
console.log('\n== Criteria groups ==');

// Core evidence is now counted per CRITERION, so the criteria table is the
// thing that must be pinned. Getting these wrong is invisible to ranking tests
// for the same reason single mis-mappings were.
const GOLDEN_CRITERIA = {
  // type        features  published threshold
  alzheimers:  [4, 4],   // NIA-AA: insidious + progressive + amnestic + second domain (all required)
  late:        [4, 3],   // Wolk 2025 amnestic-predominant profile
  lewy:        [4, 2],   // DLB 2017: >=2 of 4 core clinical features for probable DLB
  pca:         [3, 3],   // Crutch 2017: clinical + >=3 cognitive + sparing
  ppa:         [3, 3],   // Gorno-Tempini 2011: three root inclusion criteria
  bvftd:       [6, 3],   // Rascovsky 2011: >=3 of 6 for possible bvFTD
  vascular:    [4, 2],   // VASCOG 2014
  mixed:       [4, 2],
};
const allIds = new Set(globalSymptoms.map((s) => s.id));
for (const [type, [featureCount, required]] of Object.entries(GOLDEN_CRITERIA)) {
  const spec = TYPE_CRITERIA[type];
  check(`${type} has ${featureCount} criteria features`,
    spec?.features.length === featureCount, `got ${spec?.features.length}`);
  check(`${type} threshold is ${required}`,
    spec?.requiredMet === required, `got ${spec?.requiredMet}`);
}

check('every type in the registry has criteria defined',
  typeKeys.every((t) => TYPE_CRITERIA[t]),
  typeKeys.filter((t) => !TYPE_CRITERIA[t]).join(', '));

check('every criteria feature cites a real symptom id',
  Object.values(TYPE_CRITERIA).every((spec) =>
    spec.features.every((f) => (f.any ?? f.of ?? []).every((id) => allIds.has(id)))),
  Object.entries(TYPE_CRITERIA).flatMap(([t, spec]) =>
    spec.features.flatMap((f) => (f.any ?? f.of ?? []).filter((id) => !allIds.has(id)).map((id) => `${t}.${f.id}:${id}`))).join(', '));

check('every criteria feature is satisfiable (has at least one item)',
  Object.values(TYPE_CRITERIA).every((spec) =>
    spec.features.every((f) => (f.any ?? f.of ?? []).length >= (f.atLeast ?? 1))));

check('a threshold can actually be reached (required <= features)',
  Object.values(TYPE_CRITERIA).every((spec) => spec.requiredMet <= spec.features.length));

// Every item tiered `core` for a type must be reachable through that type's
// criteria -- otherwise it is labelled a core criterion in the UI while
// contributing nothing to the core score, which is worse than mislabelling it.
const orphanCore = [];
for (const type of typeKeys) {
  const inCriteria = criteriaItemIds(type);
  for (const sym of globalSymptoms) {
    if (sym.types?.[type] === 'core' && !inCriteria.has(sym.id)) orphanCore.push(`${type}:${sym.id}`);
  }
}
check('every core-tiered item participates in its type\'s criteria',
  orphanCore.length === 0, orphanCore.join(', '));

// THE PROPERTY THE REWORK BUYS.
//
// Under the old engine, splitting one question into two changed every ranking
// that involved its type, because core credit was counted per checkbox. That is
// what let LATE (3 core boxes) outrank Alzheimer's (4 core boxes) on Alzheimer's
// own criteria. Splitting a question must now be score-neutral: an added item
// inside an existing OR-group is redundant evidence, not extra evidence.
{
  const profiles = [
    ['mem1', 'mem7'],
    ['mem5', 'hall1', 'mov2'],
    ['beh2', 'beh3', 'eat1', 'onset4'],
    ['mem1', 'mem3', 'mem7', 'onset2', 'onset7'],
    ['onset6', 'onset9', 'exec4', 'exec6', 'exec8'],
  ];
  // Clone the symptom list with mov2 duplicated as a second rigidity question,
  // and add it to DLB's parkinsonism group -- the exact edit that would have
  // shifted every DLB ranking under the old engine.
  const clone = symptomById.mov2;
  const splitList = [...globalSymptoms, { ...clone, id: 'mov2b' }];
  const originalGroup = TYPE_CRITERIA.lewy.features.find((f) => f.id === 'parkinsonism').any;

  let allStable = true;
  const drifted = [];
  for (const ids of profiles) {
    const before = rankFor(ids).ranked.order.join(',');
    TYPE_CRITERIA.lewy.features.find((f) => f.id === 'parkinsonism').any = [...originalGroup, 'mov2b'];
    const after = rankTypes(computeScores(checkedFrom(ids), splitList)).order.join(',');
    TYPE_CRITERIA.lewy.features.find((f) => f.id === 'parkinsonism').any = originalGroup;
    if (before !== after) { allStable = false; drifted.push(ids.join('+')); }
  }
  check('splitting a question into two does not change any ranking',
    allStable, `drifted on: ${drifted.join(' | ')}`);
}

// The specific defect that motivated the rework.
{
  const amnestic = rankFor(['mem1', 'mem7']).ranked;
  const s = computeScores(checkedFrom(['mem1', 'mem7']), globalSymptoms);
  check('plain amnestic memory loss no longer ranks LATE above Alzheimer\'s',
    amnestic.order.indexOf('alzheimers') < amnestic.order.indexOf('late'),
    `order: ${amnestic.order.slice(0, 3).join(' > ')}`);
  check('...because the two now score equally on symptom fit',
    Math.abs(s.alzheimers.evidenceScore - s.late.evidenceScore) < 0.001,
    `AD ${s.alzheimers.evidenceScore.toFixed(1)} vs LATE ${s.late.evidenceScore.toFixed(1)}`);
  check('...and LATE still wins once its own discriminators are present',
    rankFor(['mem1', 'mem7', 'mem10', 'mem11', 'onset8']).ranked.order[0] === 'late',
    rankFor(['mem1', 'mem7', 'mem10', 'mem11', 'onset8']).ranked.order[0]);
}

// DLB 2017 requires only ONE cardinal parkinsonian feature, so rest tremor
// alone and rigidity alone must score identically.
{
  const tremor = computeScores(checkedFrom(['mem5', 'hall1', 'mov3']), globalSymptoms).lewy;
  const rigid = computeScores(checkedFrom(['mem5', 'hall1', 'mov2']), globalSymptoms).lewy;
  check('rest tremor and rigidity each satisfy parkinsonism identically',
    Math.abs(tremor.evidenceScore - rigid.evidenceScore) < 0.001,
    `tremor ${tremor.evidenceScore.toFixed(1)} vs rigidity ${rigid.evidenceScore.toFixed(1)}`);
  check('...and both reach the 2-of-4 threshold for probable DLB',
    tremor.meetsThreshold && rigid.meetsThreshold);
  const both = computeScores(checkedFrom(['mem5', 'hall1', 'mov2', 'mov3']), globalSymptoms).lewy;
  check('having both does not double-count one feature',
    Math.abs(both.evidenceScore - rigid.evidenceScore) < 0.001,
    `both ${both.evidenceScore.toFixed(1)} vs one ${rigid.evidenceScore.toFixed(1)}`);
}

// ---------------------------------------------------------------
console.log('\n== Quick screen ==');

// Grew from 31 to 36 when criteria coverage was balanced: a type whose
// criteria cannot be ASKED in quick mode has them excluded from its
// denominator, which silently inflates the ones that remain.
check(`quick screen is 20-40 items (is ${quickSymptoms.length})`,
  quickSymptoms.length >= 20 && quickSymptoms.length <= 40);

const quickCriteria = typeKeys.map((t) => [t, evaluateCriteria(t, {}, new Set(quickSymptoms.map((s) => s.id))).total]);
check('every type has at least 2 askable criteria in the quick screen',
  quickCriteria.every(([, n]) => n >= 2),
  quickCriteria.filter(([, n]) => n < 2).map(([t, n]) => `${t}:${n}`).join(', '));
check('every type except mixed has at least 3 askable criteria in the quick screen',
  quickCriteria.filter(([t, n]) => n < 3).every(([t]) => t === 'mixed'),
  quickCriteria.filter(([, n]) => n < 3).map(([t, n]) => `${t}:${n}`).join(', '));

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
  // With insidious onset added, AD now satisfies 2 of its 4 criteria against
  // LATE's 1 of 4, so AD leads on symptom fit alone and the prior is not even
  // needed. Assert the ordering, not the mechanism that produces it -- the old
  // version of this check asserted "both inside the contention band", which
  // silently became a test of the tie rather than of the outcome.
  check('...and AD now leads on symptom fit alone, not only via the prior',
    amnestic.scores.alzheimers.evidenceScore > amnestic.scores.late.evidenceScore,
    `AD ${amnestic.scores.alzheimers.evidenceScore.toFixed(1)} vs LATE ${amnestic.scores.late.evidenceScore.toFixed(1)}`);

  // ...but the prior must NOT suppress LATE when its own defining features are
  // present. These are the three criteria unpacked from the retired mem9
  // compound; they are the whole reason LATE is in the tool.
  const lateSpecific = rankFor(['mem1', 'mem7', 'onset2', 'mem10', 'mem11', 'onset8']);
  check('LATE wins outright once its own discriminators are checked',
    lateSpecific.ranked.withEvidence[0] === 'late',
    `got ${lateSpecific.ranked.withEvidence[0]}`);

  // Each of the three former conjuncts must be independently answerable --
  // that was the point of retiring mem9.
  for (const id of ['mem10', 'mem11', 'onset8']) {
    check(`${id} scores for LATE on its own`,
      computeScores(checkedFrom([id]), globalSymptoms).late.core === 1);
  }
}

// Visuoperceptual impairment: core for PCA, part of DLB's typical cognitive
// PROFILE rather than one of its four core clinical features, and a late
// non-specific finding in typical AD. Three different weights, one symptom --
// the case the old shared boolean could not express.
{
  const scores = computeScores(checkedFrom(['exec4']), globalSymptoms);
  const s = symptomById.exec4;
  check('visuoperceptual impairment is core for PCA, supportive for LBD, non-specific for AD',
    s.types.pca === 'core' && s.types.lewy === 'supportive' && s.types.alzheimers === 'common',
    JSON.stringify(s.types));
  // One posterior deficit satisfies nobody's core criterion: PCA needs three,
  // DLB counts it as supportive only, and AD's second-domain criterion is
  // gated on there being a first domain.
  check('one posterior deficit alone satisfies no type\'s core criterion',
    scores.pca.core === 0 && scores.lewy.core === 0 && scores.alzheimers.core === 0,
    `pca ${scores.pca.core} lewy ${scores.lewy.core} ad ${scores.alzheimers.core}`);
  check('...but it still corroborates DLB as a supportive finding',
    scores.lewy.profileMatch > 0);

  // Three of them DO satisfy PCA's threshold, and still give AD nothing.
  const three = computeScores(checkedFrom(['exec4', 'exec6', 'exec8']), globalSymptoms);
  check('three posterior deficits satisfy PCA\'s "at least three" criterion',
    three.pca.criteria.available.find((f) => f.id === 'posteriorCognitive')?.satisfied === true);
  check('...and a purely visual presentation gives Alzheimer\'s no core criterion',
    three.alzheimers.core === 0, `AD core ${three.alzheimers.core}`);
  // ...but once memory IS impaired, the second-domain criterion unlocks.
  const withMemory = computeScores(checkedFrom(['mem1', 'exec4']), globalSymptoms);
  check('a second domain counts only once a first domain is present',
    withMemory.alzheimers.criteria.available.find((f) => f.id === 'secondDomain')?.satisfied === true);
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

// One-page summary: "top distinguishing answers" must rank a single-type core
// criterion above an item shared across several types, must never include a
// purely non-specific finding, and must surface counter-evidence.
{
  const ids = ['mem1', 'hall1', 'beh2'];
  const sd = checkedFrom(ids);
  const order = rankTypes(computeScores(sd, globalSymptoms)).order;
  const answers = distinguishingAnswers(sd, globalSymptoms, order);
  const singleCore = answers.find((a) => a.supports.length === 1 && a.supports[0].tier === 'core');
  const sharedCore = answers.find((a) => a.supports.length > 1 && a.supports[0].tier === 'core');
  // Both sides must be present, or the ordering check passes vacuously.
  check('distinguishing answers: fixture has a single-type and a shared core item',
    Boolean(singleCore && sharedCore));
  check('distinguishing answers: single-type core outranks shared core',
    Boolean(singleCore && sharedCore) && answers.indexOf(singleCore) < answers.indexOf(sharedCore));
  check('distinguishing answers: no purely non-specific item is listed',
    answers.every((a) => a.supports.length > 0 || a.against.length > 0));
  check('distinguishing answers: every listed item was actually checked',
    answers.every((a) => sd[a.id]?.checked));
  check('distinguishing answers: values are sorted descending',
    answers.every((a, i) => i === 0 || answers[i - 1].value >= a.value));
  const withAgainst = globalSymptoms.find((s) => s.against?.length);
  const ag = distinguishingAnswers(checkedFrom([withAgainst.id]), globalSymptoms, order);
  check('distinguishing answers: counter-evidence is surfaced',
    ag[0]?.against.length === withAgainst.against.length, withAgainst.id);
  check('distinguishing answers: respects the limit',
    distinguishingAnswers(checkedFrom(globalSymptoms.map((s) => s.id)), globalSymptoms, order).length === 8);
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
