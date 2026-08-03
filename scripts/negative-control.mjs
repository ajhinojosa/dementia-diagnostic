// Negative controls: deliberately reintroduce each original bug in memory and
// confirm the corresponding check FAILS. A regression test that has never been
// seen to fail is not evidence of anything.

import { globalSymptoms, quickSymptoms, symptomById } from '../src/data/symptoms.js';
import { dementiaTypes, typeKeys } from '../src/data/dementiaTypes.js';
import { computeScores, rankTypes, rankingConfig } from '../src/scoring.js';

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

// 1. The prevalence prior. Flatten it and the AD-vs-LATE tie-break must break.
//
//    This case is used rather than AD-vs-FTD because AD-vs-FTD is a blowout on
//    evidence alone (52% vs 2%) -- flattening the prior does not change it, so
//    it never exercised the prior at all. An earlier version of this control
//    asserted otherwise and passed for the wrong reason.
//
//    Note the profile deliberately EXCLUDES mem9 ("began after 80 and slower
//    than expected"), which is the LATE-defining item. With mem9 checked, LATE
//    wins outright at 100% and SHOULD -- that is the tool working. The prior is
//    only meant to decide the plain amnestic picture, where the two are
//    genuinely indistinguishable (AD 68.6 vs LATE 70.3) and the far commoner
//    disease is the better bet.
{
  const original = Object.fromEntries(typeKeys.map((t) => [t, dementiaTypes[t].commonness]));
  control(
    'plain amnestic AD-vs-LATE tie-break depends on the prevalence prior',
    () => typeKeys.forEach((t) => (dementiaTypes[t].commonness = 1)),
    () => typeKeys.forEach((t) => (dementiaTypes[t].commonness = original[t])),
    () => {
      const ids = ['mem1', 'mem7', 'onset2'];
      const ranked = rankTypes(computeScores(checkedFrom(ids), globalSymptoms));
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

// 2. Per-type evidence tiers. Give AD the same 'core' credit for visuospatial
//    impairment that LBD gets -- the original shared-boolean behaviour.
{
  control(
    'visuospatial asymmetry depends on per-type evidence tiers',
    () => (symptomById.exec4.types.alzheimers = 'core'),
    () => (symptomById.exec4.types.alzheimers = 'common'),
    () => {
      const scores = computeScores(checkedFrom(['exec4']), globalSymptoms);
      return scores.lewy.core === 1 && scores.alzheimers.core === 0;
    }
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

// 4. Weighting must be per-type. Promoting a non-specific AD finding to 'core'
//    must change AD's core count -- this is the shared-boolean bug the rewrite
//    exists to remove, tested on a second symptom to confirm it is systemic and
//    not a one-off in exec4.
{
  control(
    'sleep3 weighting is genuinely read per-type, not from a shared flag',
    () => (symptomById.sleep3.types.lewy = 'core'),
    () => (symptomById.sleep3.types.lewy = 'supportive'),
    () => computeScores(checkedFrom(['sleep3']), globalSymptoms).lewy.core === 0
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
