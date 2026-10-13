// ============================================
// SCORING ENGINE
// ============================================
//
// Replaces the original scoring, which had two structural problems:
//
// 1. It counted "discriminating symptoms" as a raw integer and ranked types by
//    that integer. The number of discriminating items differed wildly per type
//    (AD had 5, FTD had 12), so the comparison was between unequal
//    denominators. Alzheimer's disease -- 60-80% of all dementia -- competed
//    with the smallest denominator and could essentially never win a tie-break
//    against the rarest types. The base rates were inverted.
//
// 2. `discriminating` was one boolean per symptom, shared across every type the
//    symptom mapped to, so a symptom that is a core criterion for one disease
//    and a throwaway finding in another gave both the same credit.
//
// The replacement scores a weighted PROPORTION of each type's own profile, then
// orders by that proportion adjusted by a compressed prevalence prior. Both
// numbers are surfaced separately in the UI so the adjustment is never hidden.

// 3. Core evidence was `coreMatched / coreTotal` over CHECKBOXES, so a type's
//    score depended on how finely its criteria had been chopped into questions.
//    On plain amnestic memory loss -- the commonest presentation in dementia --
//    LATE beat Alzheimer's 59.4 to 45.7 on the two items that are AD's OWN core
//    criteria, purely because 2/3 > 2/4. The gap then fell just outside the
//    contention band, so the prevalence prior that exists to break exactly this
//    tie was never allowed to run.
//
//    Core evidence is now counted per CRITERION (see data/criteria.js), which
//    is the unit published criteria actually use. Splitting or merging
//    questions no longer moves any ranking.

import { dementiaTypes, EVIDENCE_WEIGHTS, AGAINST_WEIGHT, typeKeys } from './data/dementiaTypes.js';
import { evaluateCriteria, criteriaItemIds } from './data/criteria.js';

const isChecked = (symptomData, id) => Boolean(symptomData[id]?.checked);

/**
 * Score every dementia type against the checked symptoms.
 *
 * @param symptomData    { [symptomId]: { checked, ...modifiers } }
 * @param activeSymptoms the symptom list currently in play. Passing the quick
 *                       subset here is what makes the short screen score
 *                       correctly: every maximum is computed from the items the
 *                       user was actually shown, so a quick-mode profile match
 *                       is out of what was asked, not out of the full set.
 */
export function computeScores(symptomData, activeSymptoms) {
  const result = {};
  const availableIds = new Set(activeSymptoms.map((s) => s.id));

  for (const type of typeKeys) {
    const relevant = activeSymptoms.filter((s) => s.types?.[type]);
    const counters = activeSymptoms.filter((s) => s.against?.includes(type));

    // ---- Core evidence: counted per CRITERION, not per checkbox ----
    const criteria = evaluateCriteria(type, symptomData, availableIds);
    const coreMatched = criteria.met;
    const coreTotal = criteria.total;

    // Every item that can satisfy a criterion is represented by that criterion
    // and must NOT also be weighed individually. Otherwise an item sitting in a
    // criterion group would earn twice, and -- because the weaker members of a
    // group carry a per-item tier while the strongest often does not -- the
    // weakest evidence would end up outweighing the strongest.
    const inCriteria = criteriaItemIds(type);

    let matchedWeight = EVIDENCE_WEIGHTS.core * coreMatched;
    let possibleWeight = EVIDENCE_WEIGHTS.core * coreTotal;
    let matchedCount = coreMatched;

    for (const symptom of relevant) {
      if (inCriteria.has(symptom.id)) continue;

      const tier = symptom.types[type];
      const weight = EVIDENCE_WEIGHTS[tier] ?? 0;

      // Non-specific ('common') findings are deliberately EXCLUDED from the
      // denominator. They are not part of what defines the type, so not having
      // them should not count against it -- they corroborate when present but
      // never penalise when absent.
      //
      // Without this, types differ wildly in how bloated their denominator is:
      // AD carries 13 non-specific items and LATE carries none, so an identical
      // amnestic profile scored LATE at 73% and AD at 33%, ranking the rare
      // mimic above the common disease on every amnestic presentation. That is
      // the original small-denominator bug reappearing in mirror image.
      if (tier !== 'common') possibleWeight += weight;

      if (isChecked(symptomData, symptom.id)) {
        matchedWeight += weight;
        matchedCount += 1;
      }
    }

    // Counter-evidence: symptoms that actively argue against this type.
    const counterEvidence = counters.filter((s) => isChecked(symptomData, s.id));
    const againstWeight = counterEvidence.length * AGAINST_WEIGHT;

    // Floored at zero -- counter-evidence can erase a weak match but must never
    // produce a negative score, which would sort below "no evidence at all" and
    // read as meaningful when it is not.
    const netWeight = Math.max(0, matchedWeight - againstWeight);

    // Capped at 100: corroborating non-specific findings add to the numerator
    // but must not push a type past a complete profile match.
    const profileMatch =
      possibleWeight > 0 ? Math.min(100, (netWeight / possibleWeight) * 100) : 0;
    const corePercentage = coreTotal > 0 ? (coreMatched / coreTotal) * 100 : 0;

    result[type] = {
      matchedWeight,
      possibleWeight,
      againstWeight,
      netWeight,
      counterEvidence: counterEvidence.map((s) => ({ id: s.id, text: s.text })),

      profileMatch,
      corePercentage,

      // `core` / `maxCore` now count CRITERIA met and criteria askable in this
      // mode, not checkboxes. Consumers reading them as "how much of this
      // type's defining picture is present" get a truer answer than before.
      core: coreMatched,
      maxCore: coreTotal,
      criteria,
      // Whether the published threshold for the syndrome is reached (2 of 4
      // core features for probable DLB, 3 of 6 for possible bvFTD, and so on).
      // Surfaced rather than folded into the score, so the rule stays legible.
      meetsThreshold: criteria.meetsThreshold,

      total: matchedCount,
      maxTotal: relevant.length,

      commonness: dementiaTypes[type].commonness,

      // Pure symptom fit, with no prevalence adjustment whatsoever. Core
      // features are given an extra pull, because meeting a type's actual
      // diagnostic criteria should outrank accumulating many low-specificity
      // findings that happen to be listed under it.
      evidenceScore: profileMatch * 0.6 + corePercentage * 0.4,
    };
  }

  return result;
}

// How close a type's evidence must be to the leader's before the prevalence
// prior is allowed to reorder them. Within this band the two profiles are not
// meaningfully distinguishable on symptoms, which is exactly the situation
// where "how common is this disease anyway" is the right tie-breaker.
// Exported as a mutable object so the negative-control script can widen the
// band and confirm that the band -- not something else -- is what keeps the
// prior from overriding clear evidence.
export const rankingConfig = { contentionBand: 0.8 };

/**
 * Order types for display, and report whether the prevalence prior changed the
 * order relative to raw symptom fit. If it did, the UI says so -- a prior that
 * silently reorders results is exactly the kind of hidden thumb on the scale
 * this rewrite exists to remove.
 *
 * The prior is applied ONLY as a tie-breaker among types whose symptom evidence
 * is genuinely close. An earlier version multiplied every type's score by its
 * prevalence unconditionally, which flipped the winner in 37% of profiles --
 * including cases where two core bvFTD criteria lost to a single Mixed imaging
 * finding. Strong evidence should swamp a moderate prior, not lose to it.
 */
export function rankTypes(scores) {
  const byEvidence = [...typeKeys].sort((a, b) => {
    const diff = scores[b].evidenceScore - scores[a].evidenceScore;
    if (Math.abs(diff) > 0.001) return diff;
    return scores[b].core - scores[a].core;
  });

  const leaderScore = scores[byEvidence[0]]?.evidenceScore ?? 0;
  const threshold = leaderScore * rankingConfig.contentionBand;

  const isContender = (t) => scores[t].evidenceScore > 0 && scores[t].evidenceScore >= threshold;

  const contenders = byEvidence.filter(isContender);
  const rest = byEvidence.filter((t) => !isContender(t));

  // Inside the contention band, prevalence decides. Outside it, evidence order
  // stands untouched.
  contenders.sort((a, b) => {
    const diff =
      scores[b].evidenceScore * scores[b].commonness -
      scores[a].evidenceScore * scores[a].commonness;
    if (Math.abs(diff) > 0.001) return diff;
    return scores[b].core - scores[a].core;
  });

  const order = [...contenders, ...rest];
  const withEvidence = order.filter((t) => scores[t].total > 0);
  const priorChangedOrder =
    withEvidence.length > 1 && order[0] !== byEvidence[0] && scores[byEvidence[0]].total > 0;

  return {
    order,
    withEvidence,
    topByFit: byEvidence[0],
    contenders,
    priorChangedOrder,
  };
}

/**
 * How much to trust the ranking at all.
 *
 * The old tool would name a "strongest pattern match" off a single checked box.
 * Separating confidence from ranking means the tool can say "here is the
 * ordering, and you should not read much into it yet", which is usually the
 * honest answer early in an assessment.
 */
export function assessConfidence(scores, symptomData, activeSymptoms) {
  const checkedCount = activeSymptoms.filter((s) => isChecked(symptomData, s.id)).length;
  const ranked = rankTypes(scores);
  const [first, second] = ranked.withEvidence;

  if (checkedCount === 0) {
    return { level: 'none', label: 'Nothing recorded yet', reason: 'No observations have been selected.' };
  }

  if (checkedCount < 5) {
    return {
      level: 'insufficient',
      label: 'Too little recorded to compare',
      reason: `Only ${checkedCount} observation${checkedCount === 1 ? '' : 's'} selected. Any ordering here is close to noise — work through more of the categories before reading anything into it.`,
    };
  }

  const topScore = first ? scores[first].evidenceScore : 0;
  const secondScore = second ? scores[second].evidenceScore : 0;
  const separation = topScore > 0 ? ((topScore - secondScore) / topScore) * 100 : 0;
  const topCoreRatio = first ? scores[first].corePercentage : 0;

  if (separation < 15) {
    return {
      level: 'ambiguous',
      label: 'No clear front-runner',
      reason:
        'The top two profiles are scoring within 15% of each other. That is a genuine finding rather than a failure — overlapping presentations are common, and mixed pathology is the norm in later life.',
    };
  }

  if (topCoreRatio < 34) {
    return {
      level: 'weak',
      label: 'Leading pattern, but built on soft evidence',
      reason:
        'The leading type is ahead mostly on non-specific findings rather than on its core diagnostic criteria. Worth checking whether its core features have actually been asked about.',
    };
  }

  if (checkedCount >= 12 && separation > 30 && topCoreRatio >= 50) {
    return {
      level: 'clear',
      label: 'Reasonably clear pattern',
      reason:
        'A good number of observations, a clear gap to the next type, and at least half of the leading type’s core criteria matched. Still a pattern, not a diagnosis.',
    };
  }

  return {
    level: 'moderate',
    label: 'Moderate pattern',
    reason: 'A leading type has emerged, but there is room for the picture to change as more is recorded.',
  };
}

/**
 * Symptoms whose safety implications matter regardless of scoring.
 */
export function activeSafetyFlags(symptomData, activeSymptoms, scores) {
  const flags = [];

  const lewyCore = scores.lewy?.core ?? 0;
  const reactedToAntipsychotic = isChecked(symptomData, 'auto5');

  if (lewyCore >= 2 || reactedToAntipsychotic) {
    flags.push({
      id: 'antipsychotic',
      title: 'Antipsychotic caution',
      body: reactedToAntipsychotic
        ? 'A severe reaction to an antipsychotic has been recorded. Up to half of people with Lewy body dementia react badly to these drugs, sometimes dangerously. Make sure every clinician involved knows about this reaction before any antipsychotic is prescribed again — including in hospital, where they are often given for agitation.'
        : 'Two or more core Lewy body features are recorded. People with Lewy body dementia can react severely to antipsychotic medication. Worth raising before any such medication is prescribed, including during a hospital admission.',
    });
  }

  return flags;
}

/**
 * Which categories still have nothing recorded. Drives the "you have not looked
 * here yet" prompt -- an unasked category is not the same as a negative answer,
 * and the original tool's progress bar counted a category as done merely for
 * having been expanded.
 */
export function unexploredCategories(symptomData, activeSymptoms) {
  const byCategory = {};
  for (const symptom of activeSymptoms) {
    byCategory[symptom.category] ??= { total: 0, checked: 0 };
    byCategory[symptom.category].total += 1;
    if (isChecked(symptomData, symptom.id)) byCategory[symptom.category].checked += 1;
  }
  return Object.entries(byCategory)
    .filter(([, v]) => v.checked === 0)
    .map(([name]) => name);
}

/**
 * The recorded answers that do the most to tell the types apart, for the
 * one-page summary. A checked item mapped to one type at core tier separates
 * that type from every other; the same item mapped core to three types barely
 * separates anything. So each answer is valued by its strongest tier times the
 * share of its total weight that tier holds -- 3 for a single-type core item,
 * 1 for a core item shared three ways -- plus credit for each type it argues
 * against, since ruling a type out is distinguishing too.
 *
 * Non-specific ('common') tiers are ignored: they corroborate, they do not
 * discriminate. Ties go to answers that bear on the higher-ranked types, so the
 * list explains the top of the ranking rather than its tail.
 */
export function distinguishingAnswers(symptomData, activeSymptoms, order, limit = 8) {
  const rankOf = (t) => {
    const i = order.indexOf(t);
    return i === -1 ? order.length : i;
  };

  return activeSymptoms
    .filter((s) => isChecked(symptomData, s.id))
    .map((s) => {
      const supports = Object.entries(s.types ?? {})
        .filter(([, tier]) => tier !== 'common')
        .map(([type, tier]) => ({ type, tier, weight: EVIDENCE_WEIGHTS[tier] ?? 0 }))
        .sort((a, b) => b.weight - a.weight || rankOf(a.type) - rankOf(b.type));
      const against = [...(s.against ?? [])].sort((a, b) => rankOf(a) - rankOf(b));

      const sum = supports.reduce((acc, x) => acc + x.weight, 0);
      const best = supports[0]?.weight ?? 0;
      const focus = sum > 0 ? best / sum : 0;
      const value = best * focus + against.length;

      const touched = [...supports.map((x) => x.type), ...against];
      const topRank = touched.length ? Math.min(...touched.map(rankOf)) : order.length;

      return { id: s.id, text: s.text, supports, against, value, topRank };
    })
    .filter((a) => a.value > 0)
    .sort((a, b) => b.value - a.value || a.topRank - b.topRank)
    .slice(0, limit);
}
