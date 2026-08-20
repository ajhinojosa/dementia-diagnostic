// Negative controls: deliberately reintroduce each original bug in memory and
// confirm the corresponding check FAILS. A regression test that has never been
// seen to fail is not evidence of anything.

import { globalSymptoms, quickSymptoms, symptomById } from '../src/data/symptoms.js';
import { dementiaTypes, typeKeys } from '../src/data/dementiaTypes.js';
import { computeScores, rankTypes, rankingConfig } from '../src/scoring.js';
import { TYPE_CRITERIA, criteriaItemIds } from '../src/data/criteria.js';

const checkedFrom = (ids) => Object.fromEntries(ids.map((id) => [id, { checked: true }]));
let bad = 0;

const control = (name, breakIt, restore, assertion) => {
  const before = assertion();
  breakIt();
  const after = assertion();
  restore();
  const restored = assertion();

  const ok = before === true && after === false && restored === true;
  if (!ok) bad += 1;
  console.log(
    `  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        holds=${before}  broken=${after}  restored=${restored}`
  );
};

console.log('\n== Negative controls ==\n');

// 1. The prevalence prior. INVERT it and the AD-vs-LATE tie-break must flip.
//
//    Flattening is no longer a valid break here. Since core evidence became
//    criteria-based, a plain amnestic profile scores AD and LATE EXACTLY equal
//    (22.9 each, 1 of 4 criteria each) -- which is the correct answer, because
//    the two are genuinely indistinguishable on those symptoms. With the scores
//    tied, flattening the prior leaves the tie unbroken and the order unchanged,
//    so the control would pass while proving nothing. Inverting it is the real
//    test: if the prior is what orders them, making LATE the commoner disease
//    must put LATE first.
//
//    The profile deliberately EXCLUDES mem10/mem11/onset8, the three LATE
//    discriminators unpacked from the retired mem9 compound. With those checked
//    LATE wins outright and SHOULD -- that is the tool working.
{
  const original = Object.fromEntries(typeKeys.map((t) => [t, dementiaTypes[t].commonness]));
  control(
    'plain amnestic AD-vs-LATE order depends on the prevalence prior',
    () => {
      dementiaTypes.alzheimers.commonness = 0.5;
      dementiaTypes.late.commonness = 1;
    },
    () => typeKeys.forEach((t) => (dementiaTypes[t].commonness = original[t])),
    () => {
      const ranked = rankTypes(computeScores(checkedFrom(['mem1', 'mem7']), globalSymptoms));
      return ranked.withEvidence[0] === 'alzheimers';
    }
  );
}

// 1b. The contention band. Mixed is given an absurdly high prevalence for the
//     duration of this control, so the ONLY thing keeping it from overriding a
//     strong bvFTD profile is the band excluding it as a non-contender
//     (bvFTD ev 52.4 vs Mixed 16.4 -- far outside 80%). Collapse the band and
//     Mixed must take the lead.
{
  const originalMixed = dementiaTypes.mixed.commonness;
  dementiaTypes.mixed.commonness = 10;

  control(
    'contention band is what stops the prior overriding clear evidence',
    () => (rankingConfig.contentionBand = 0),
    () => (rankingConfig.contentionBand = 0.8),
    () => {
      const ids = ['beh1', 'beh2', 'beh3', 'beh4', 'eat1', 'onset4', 'mixed7'];
      const ranked = rankTypes(computeScores(checkedFrom(ids), globalSymptoms));
      return ranked.withEvidence[0] === 'bvftd';
    }
  );

  dementiaTypes.mixed.commonness = originalMixed;
}

// 2. The criteria table is what drives core scoring now, so mutating it must
//    move the result. Adding a fifth feature to LATE changes nothing clinical
//    -- but under a per-criterion denominator it must break the exact equality
//    that plain amnestic memory loss now produces. This is the control that
//    proves the ranking is computed from criteria and not from checkbox counts.
{
  const lateFeatures = TYPE_CRITERIA.late.features;
  const original = [...lateFeatures];
  control(
    'AD-vs-LATE equality depends on the criteria table, not on item counts',
    () => TYPE_CRITERIA.late.features.push({ id: 'padding', label: 'padding', any: ['mem2'] }),
    () => (TYPE_CRITERIA.late.features = original),
    () => {
      const s2 = computeScores(checkedFrom(['mem1', 'mem7']), globalSymptoms);
      return Math.abs(s2.alzheimers.evidenceScore - s2.late.evidenceScore) < 0.001;
    }
  );
}

// 2b. DLB 2017 requires only ONE cardinal parkinsonian feature. Rest tremor and
//     rigidity sit in the same OR-group precisely so either satisfies it. Remove
//     tremor from the group and the two must stop scoring alike -- which is the
//     bug the old per-checkbox model had by default.
{
  const group = TYPE_CRITERIA.lewy.features.find((f) => f.id === 'parkinsonism');
  const original = group.any;
  control(
    'rest tremor equals rigidity because they share one parkinsonism criterion',
    () => (group.any = ['mov2']),
    () => (group.any = original),
    () => {
      const tremor = computeScores(checkedFrom(['mem5', 'hall1', 'mov3']), globalSymptoms).lewy;
      const rigid = computeScores(checkedFrom(['mem5', 'hall1', 'mov2']), globalSymptoms).lewy;
      return Math.abs(tremor.evidenceScore - rigid.evidenceScore) < 0.001;
    }
  );
}

// 2c. NIA-AA's second-domain requirement is conditional on the amnestic
//     presentation -- there is no SECOND domain without a first. Drop the gate
//     and a purely visual presentation (which is PCA, not typical AD) must start
//     handing Alzheimer's a satisfied criterion.
{
  const feature = TYPE_CRITERIA.alzheimers.features.find((f) => f.id === 'secondDomain');
  const original = feature.requires;
  control(
    'AD\'s second-domain criterion is gated on a first domain being present',
    () => delete feature.requires,
    () => (feature.requires = original),
    () => computeScores(checkedFrom(['exec4', 'exec6', 'exec8']), globalSymptoms).alzheimers.core === 0
  );
}

// 3. Counter-evidence must actually change the score, not just be displayed.
//    BOTH against-bvftd sources have to be neutralised: an earlier version of
//    this control removed only eat5's, and mem7's was still biting, so the
//    check kept passing while apparently "broken".
{
  const originals = globalSymptoms
    .filter((s) => s.against?.includes('bvftd'))
    .map((s) => [s, s.against]);

  control(
    `bvFTD score genuinely drops on counter-evidence (${originals.length} sources)`,
    () => originals.forEach(([s]) => (s.against = [])),
    () => originals.forEach(([s, a]) => (s.against = a)),
    () => {
      const withC = computeScores(checkedFrom(['beh1', 'beh2', 'mem7', 'eat5']), globalSymptoms);
      const without = computeScores(checkedFrom(['beh1', 'beh2']), globalSymptoms);
      return withC.bvftd.profileMatch < without.bvftd.profileMatch;
    }
  );
}

// 4. Per-type tiers still drive the WEIGHTED half of the score for every item
//    outside a criteria group. Demote a supportive DLB finding to non-specific
//    and it must leave the denominator, changing DLB's profile match -- the
//    shared-boolean bug the rewrite exists to remove, tested on a second symptom
//    to confirm it is systemic and not a one-off.
//
//    Asserted on profileMatch rather than on the core count: core is now counted
//    from criteria, so a tier change on a non-criteria item cannot move it. An
//    assertion on `.core` would sit there passing forever no matter what the
//    tier said.
{
  const before = computeScores(checkedFrom(['sleep3']), globalSymptoms).lewy.profileMatch;
  control(
    'sleep3 weighting is genuinely read per-type, not from a shared flag',
    () => (symptomById.sleep3.types.lewy = 'common'),
    () => (symptomById.sleep3.types.lewy = 'supportive'),
    () => Math.abs(computeScores(checkedFrom(['sleep3']), globalSymptoms).lewy.profileMatch - before) < 0.001
  );
}

// 4b. A `core` tier outside its type's criteria would be labelled a core
//     criterion in the UI while contributing nothing to the core score. The
//     orphan check in verify-scoring is what catches that, so break it here and
//     confirm it bites.
{
  const orphans = () => {
    for (const type of typeKeys) {
      const inCriteria = criteriaItemIds(type);
      for (const sym of globalSymptoms) {
        if (sym.types?.[type] === 'core' && !inCriteria.has(sym.id)) return false;
      }
    }
    return true;
  };
  control(
    'a core-tiered item outside its criteria is detected',
    () => (symptomById.sleep3.types.lewy = 'core'),
    () => (symptomById.sleep3.types.lewy = 'supportive'),
    orphans
  );
}

// 5. The quick screen must normalise against the quick set, not the full set.
//    If it normalised against the full list, quick-mode profile matches would
//    be uniformly and misleadingly low. Asserted directly rather than as a
//    break/restore control, since there is no single value to corrupt.
{
  const ids = ['mem5', 'hall1', 'sleep1', 'mov2', 'mov1'];
  const quickScore = computeScores(checkedFrom(ids), quickSymptoms).lewy.profileMatch;
  const fullScore = computeScores(checkedFrom(ids), globalSymptoms).lewy.profileMatch;
  const ok = quickScore > fullScore;
  if (!ok) bad += 1;
  console.log(
    `  ${ok ? 'PASS' : 'FAIL'}  quick screen normalises against the quick set\n        quick=${quickScore.toFixed(1)}%  full=${fullScore.toFixed(1)}%  (quick must be higher)`
  );
}

console.log(
  bad === 0
    ? '\n✅ Every control broke the check it was supposed to break, then restored\n'
    : `\n❌ ${bad} control(s) did not behave as expected -- the test may be passing for the wrong reason\n`
);
process.exit(bad === 0 ? 0 : 1);
