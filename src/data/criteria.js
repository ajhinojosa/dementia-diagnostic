// ============================================
// DIAGNOSTIC CRITERIA GROUPS
// ============================================
//
// WHY THIS FILE EXISTS
//
// The previous engine scored core evidence as `coreMatched / coreTotal`, where
// both sides counted CHECKBOXES. That made a type's score depend on how finely
// its criteria happened to be chopped into questions rather than on how much
// evidence was present.
//
// The failure was demonstrable. On the single most common presentation in all
// of dementia -- plain amnestic memory loss -- checking only the two items that
// are Alzheimer's core criteria produced:
//
//     late         evidence=59.4   core=2/3   <- ranked first
//     alzheimers   evidence=45.7   core=2/4
//
// LATE won on identical evidence because 2/3 > 2/4. Worse, the gap (0.77) fell
// just outside the 0.8 contention band, so the prevalence prior -- which exists
// precisely to break this kind of tie -- was never allowed to run. A rare mimic
// beat the disease responsible for 60-80% of dementia, structurally, every time.
//
// This is the small-denominator bug that `possibleWeight` was fixed for,
// reappearing in `coreTotal`. Excluding non-specific items from the denominator
// addressed the supportive bloat but left the core count untouched.
//
// THE FIX
//
// Published criteria are THRESHOLD RULES over named features, not proportions
// over question lists:
//
//     probable DLB   >= 2 of 4 core clinical features
//     possible bvFTD >= 3 of 6 behavioural/cognitive features
//     PCA            >= 3 of the posterior cognitive features, plus the
//                    clinical and sparing requirements
//     probable AD    insidious + progressive + amnestic + a second domain
//
// So the unit of core evidence here is a FEATURE, not a question. Several
// questions can satisfy one feature: DLB's parkinsonism feature is satisfied by
// rest tremor OR rigidity/bradykinesia, exactly as the 2017 consortium states,
// so a person with full rigidity no longer scores half a feature.
//
// This makes the encoding choice score-neutral. Splitting one question into
// three, or merging three into one, no longer moves any type's rank -- which is
// the property the old model lacked.

// ---------------------------------------------------------------------------
// Feature shapes
//
//   { id, label, any: [...ids] }              satisfied by ANY listed item
//   { id, label, atLeast: n, of: [...ids] }   satisfied by n or more
//
// `requiredMet` records the published threshold for the syndrome. It does NOT
// cap the score -- meeting 4 of 4 DLB features really is stronger evidence than
// meeting 2 of 4 -- it drives the plain-language "meets the published threshold
// for probable DLB" line in the UI, so the rule is shown rather than buried in
// arithmetic.
// ---------------------------------------------------------------------------

export const TYPE_CRITERIA = {
  alzheimers: {
    source: 'NIA-AA 2011 (McKhann et al.), core clinical criteria for probable AD dementia',
    requiredMet: 4,
    thresholdLabel: 'all four elements of the NIA-AA clinical criteria',
    features: [
      {
        id: 'amnestic',
        label: 'Impaired learning and recall of recent information',
        any: ['mem1', 'mem7'],
      },
      {
        id: 'secondDomain',
        label: 'A second cognitive domain is also affected',
        // NIA-AA is explicit that the amnestic presentation requires "evidence
        // of cognitive dysfunction in at least one other cognitive domain" --
        // reasoning/complex tasks, visuospatial, or language. Previously every
        // one of these was tiered `common` for AD, so a textbook multi-domain
        // amnestic presentation earned no core credit for the second domain the
        // criteria actually demand.
        //
        // Gated on the amnestic feature: there is no SECOND domain without a
        // first. Without this, a pure visual presentation (which is PCA, not
        // typical AD) handed Alzheimer's a satisfied criterion on the strength
        // of the visuospatial item alone.
        requires: 'amnestic',
        any: ['mem3', 'exec1', 'exec2', 'exec4', 'exec5', 'lang1'],
      },
      {
        id: 'insidious',
        label: 'Insidious onset over months to years',
        any: ['onset2'],
      },
      {
        id: 'progressive',
        label: 'Clear-cut history of worsening cognition',
        // A separate NIA-AA requirement from insidious onset, and previously
        // absent at type level: progression existed only as a per-item `trend`
        // modifier, so it could never satisfy a criterion.
        any: ['onset7'],
      },
    ],
  },

  late: {
    source:
      'Wolk et al., Alzheimer’s & Dementia 2025, clinical criteria for LATE; Nelson et al., Brain 2019, LATE consensus',
    requiredMet: 3,
    thresholdLabel: 'the amnestic-predominant profile described for LATE',
    features: [
      {
        id: 'amnestic',
        label: 'Progressive amnestic syndrome',
        any: ['mem1', 'mem7'],
      },
      {
        id: 'memoryPredominant',
        label: 'Memory affected out of proportion to other domains',
        // The central discriminator from AD in the 2025 criteria: LATE
        // "predominantly affects memory", where AD involves the wider range of
        // executive, language and visuospatial function. Nothing in the tool
        // could previously express relative SPARING of a domain, so LATE and AD
        // were near-indistinguishable by construction.
        any: ['mem10'],
      },
      {
        id: 'oldestOld',
        label: 'Onset after about age 80',
        any: ['onset8'],
      },
      {
        id: 'slowCourse',
        label: 'Slower progression than expected',
        any: ['mem11'],
      },
    ],
  },

  lewy: {
    source: 'DLB Consortium 4th consensus report, Neurology 2017;89:88-100',
    requiredMet: 2,
    thresholdLabel: 'the 2 of 4 core clinical features required for probable DLB',
    features: [
      {
        id: 'fluctuation',
        label: 'Fluctuating cognition with variation in attention and alertness',
        any: ['mem5'],
      },
      {
        id: 'visualHallucinations',
        label: 'Recurrent, well-formed visual hallucinations',
        any: ['hall1'],
      },
      {
        id: 'parkinsonism',
        label: 'One or more cardinal features of parkinsonism',
        // The 2017 revision states parkinsonism requires documentation of only
        // ONE of bradykinesia, rest tremor or rigidity. Encoding gait and
        // rigidity as two separate core items meant someone with full rigidity
        // and bradykinesia scored 1/2 on a feature the consortium considers
        // satisfied. Gait and postural features are deliberately NOT among the
        // cardinal three -- they are too non-specific in older people.
        any: ['mov2', 'mov3'],
      },
      {
        id: 'rbd',
        label: 'REM sleep behaviour disorder',
        any: ['sleep1'],
      },
    ],
  },

  pca: {
    source: 'Crutch et al., Alzheimer’s & Dementia 2017, consensus classification of PCA',
    requiredMet: 3,
    thresholdLabel: 'the clinical, cognitive and sparing requirements of the PCA syndrome',
    features: [
      {
        id: 'visualLedOnset',
        label: 'Insidious visual-led onset with normal eye examinations',
        any: ['onset6'],
      },
      {
        id: 'posteriorCognitive',
        label: 'At least three posterior cognitive deficits',
        // Crutch lists sixteen core cognitive features and requires at least
        // three. The tool previously carried roughly three and a half of the
        // sixteen, one of them mis-tiered.
        atLeast: 3,
        of: ['exec4', 'exec5', 'exec6', 'exec7', 'exec8', 'exec9', 'lang5'],
      },
      {
        id: 'sparing',
        label: 'Relative sparing of memory, speech, behaviour and insight',
        any: ['onset9'],
      },
    ],
  },

  ppa: {
    source: 'Gorno-Tempini et al., Neurology 2011, classification of primary progressive aphasia',
    requiredMet: 3,
    thresholdLabel: 'the three root inclusion criteria for PPA',
    features: [
      {
        id: 'languageDeficit',
        label: 'Language is the most prominent clinical deficit',
        any: ['lang1', 'lang2', 'lang3'],
      },
      {
        id: 'languageDrivesFunction',
        label: 'Language difficulty is the principal cause of impaired daily living',
        any: ['lang6'],
      },
      {
        id: 'languageFirst',
        label: 'Aphasia was the most prominent deficit at onset and in the initial phase',
        any: ['onset5'],
      },
    ],
  },

  bvftd: {
    source: 'Rascovsky et al., Brain 2011;134:2456-77, features I-VI',
    requiredMet: 3,
    thresholdLabel: 'the 3 of 6 features required for possible bvFTD',
    features: [
      {
        id: 'disinhibition',
        label: 'Early behavioural disinhibition',
        any: ['beh2', 'beh6'],
      },
      {
        id: 'apathy',
        label: 'Early apathy or inertia',
        any: ['beh5', 'beh7'],
      },
      {
        id: 'empathy',
        label: 'Early loss of sympathy or empathy',
        any: ['beh3'],
      },
      {
        id: 'perseveration',
        label: 'Perseverative, stereotyped or compulsive behaviour',
        any: ['beh4'],
      },
      {
        id: 'hyperorality',
        label: 'Hyperorality or dietary change',
        any: ['eat1', 'eat2', 'eat3', 'eat4'],
      },
      {
        id: 'dysexecutive',
        label: 'Executive difficulty, or behaviour changing well before memory',
        // Rascovsky feature VI is a neuropsychological profile: executive
        // deficits WITH relative sparing of episodic memory and visuospatial
        // function. Requiring both halves would make it unreachable without
        // formal testing, so either half satisfies it here. onset4 ("behaviour
        // and personality changed first, memory later, if at all") is the
        // sparing half, and is something a family member can actually report --
        // it is also the sharpest discriminator from Alzheimer's in this set.
        any: ['exec2', 'onset4'],
      },
    ],
  },

  vascular: {
    source: 'Sachdev et al., VASCOG statement, Alzheimer Dis Assoc Disord 2014',
    requiredMet: 2,
    thresholdLabel: 'documented vascular evidence plus a matching cognitive profile',
    features: [
      {
        id: 'strokeRelation',
        label: 'Cognitive decline temporally related to a cerebrovascular event',
        any: ['mov6', 'mov8'],
      },
      {
        id: 'stepwiseCourse',
        label: 'Stepwise or fluctuating decline rather than a steady slide',
        any: ['mem4'],
      },
      {
        id: 'subcorticalProfile',
        label: 'Slowed processing speed, complex attention or frontal-executive decline',
        any: ['exec2', 'exec3', 'mem8'],
      },
      {
        id: 'smallVesselSigns',
        label: 'Early gait disturbance or early urinary symptoms',
        // VASCOG names these as features of the subcortical small-vessel
        // profile. This is where shuffling/freezing gait belongs -- not in
        // DLB's cardinal parkinsonism, where it was previously scored.
        any: ['mov1', 'auto2'],
      },
    ],
  },

  mixed: {
    source: 'NIA-AA and VASCOG both recognise mixed pathology as the commonest reality past age 80',
    requiredMet: 2,
    thresholdLabel: 'features of more than one process at once',
    features: [
      {
        id: 'bothCourses',
        label: 'Both a gradual slide and separate sudden drops',
        any: ['mixed1'],
      },
      {
        id: 'twoTypeFeatures',
        label: 'Clear features from two or more different types',
        any: ['mixed5'],
      },
      {
        id: 'imagingBoth',
        label: 'Imaging shows both atrophy and vascular damage',
        any: ['mixed7'],
      },
      {
        id: 'strokeOnDegeneration',
        label: 'A stroke on top of an existing gradual decline',
        any: ['mov6'],
      },
    ],
  },
};

/** Every symptom id referenced by any feature of a type. */
export const criteriaItemIds = (typeKey) => {
  const spec = TYPE_CRITERIA[typeKey];
  if (!spec) return new Set();
  const ids = new Set();
  for (const feature of spec.features) {
    for (const id of feature.any ?? feature.of ?? []) ids.add(id);
  }
  return ids;
};

/**
 * Evaluate a type's criteria against what the user checked.
 *
 * `availableIds` is the set of symptom ids actually in play. A feature none of
 * whose items were ASKED cannot be satisfied, so it is excluded from the
 * denominator entirely -- the same principle the weighted half already applies
 * to quick mode. Without this, a short screen would silently punish every type
 * whose criteria it had no room to ask about.
 */
export function evaluateCriteria(typeKey, symptomData, availableIds) {
  const spec = TYPE_CRITERIA[typeKey];
  if (!spec) return { met: 0, total: 0, available: [], requiredMet: 0, meetsThreshold: false };

  const checked = (id) => Boolean(symptomData[id]?.checked);
  const available = [];

  for (const feature of spec.features) {
    const ids = feature.any ?? feature.of ?? [];
    const askable = ids.filter((id) => availableIds.has(id));
    if (askable.length === 0) continue;

    const hits = askable.filter(checked);
    // A threshold feature stays askable only if enough of its items survive the
    // current mode to be satisfiable at all.
    if (feature.atLeast != null && askable.length < feature.atLeast) continue;

    const satisfied =
      feature.atLeast != null ? hits.length >= feature.atLeast : hits.length > 0;

    available.push({
      id: feature.id,
      label: feature.label,
      satisfied,
      requires: feature.requires,
      matched: hits,
      needed: feature.atLeast ?? 1,
      have: hits.length,
    });
  }

  // Second pass for dependent features. A criterion phrased relative to another
  // one ("a SECOND domain is affected") is only meaningful once its predecessor
  // holds, so gate it rather than letting it stand alone.
  for (const feature of available) {
    if (!feature.requires) continue;
    const parent = available.find((f) => f.id === feature.requires);
    // If the parent was not askable in this mode, the dependent one cannot be
    // judged either -- treat it as unsatisfied rather than silently free.
    if (!parent?.satisfied) feature.satisfied = false;
  }

  const met = available.filter((f) => f.satisfied).length;

  return {
    met,
    total: available.length,
    available,
    requiredMet: spec.requiredMet,
    // Compared against the published threshold, but only meaningful when the
    // mode could ask about enough features to reach it.
    meetsThreshold: available.length >= spec.requiredMet && met >= spec.requiredMet,
    thresholdLabel: spec.thresholdLabel,
    source: spec.source,
  };
}
