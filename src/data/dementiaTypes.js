// ============================================
// DEMENTIA TYPE REGISTRY
// ============================================
//
// `commonness` is a deliberately COMPRESSED prevalence prior, not a raw
// epidemiological rate. Raw rates would be misleading here: bvFTD is roughly
// 20x rarer than AD in the general population, and multiplying by raw
// prevalence would make it effectively impossible for the tool to ever surface
// FTD even when the symptom profile is textbook.
//
// The compression keeps common types from being out-ranked by rare types on
// thin evidence (the original tool's failure mode) without burying the rare
// types entirely. The value is applied ONLY to ordering, never to the displayed
// "profile match" figure, and the UI states plainly when it changed the order.
//
// Derivation: approximate share of dementia cases, compressed toward 1.0.
//   AD ~60-80% -> 1.00   |   Mixed very common in 80+ -> 0.95
//   VaD ~15-20% -> 0.85  |   LBD ~5-15% -> 0.75
//   LATE common pathologically past 85 but rarely diagnosed in life -> 0.72
//   bvFTD ~3% -> 0.62    |   PPA ~2% -> 0.58   |   PCA ~1% -> 0.52

export const dementiaTypes = {
  alzheimers: {
    name: "Alzheimer's Disease (typical)",
    shortName: 'AD',
    color: '#5B8C6F',
    commonness: 1.0,
    description:
      'Most common form (60-80% of cases). Gradual onset with progressive memory decline.',
    keyFeature:
      'Trouble learning and holding on to NEW information is the earliest and most prominent problem. Personality is often preserved early.',
    commonnessNote: 'The single most common cause of dementia at every adult age, including under 65.',
  },
  pca: {
    name: 'Posterior Cortical Atrophy',
    shortName: 'PCA',
    color: '#6E8CA0',
    commonness: 0.52,
    description:
      'A visual-led variant of Alzheimer’s disease (Alzheimer’s pathology underlies roughly 80% of cases).',
    keyFeature:
      'Seeing, reading, judging space and recognising objects break down FIRST, while memory and insight stay relatively intact. Eye exams come back normal.',
    commonnessNote:
      'Rare, and frequently missed for years because people are sent to optometrists rather than neurologists.',
  },
  late: {
    name: 'LATE (TDP-43 encephalopathy)',
    shortName: 'LATE',
    color: '#8A7BA8',
    commonness: 0.72,
    description:
      'Limbic-predominant age-related TDP-43 encephalopathy. An amnestic syndrome of later life that closely mimics Alzheimer’s.',
    keyFeature:
      'Looks like Alzheimer’s — memory-led, gradual — but starts later (usually 80+) and typically progresses more slowly. Often coexists with Alzheimer’s pathology.',
    commonnessNote:
      'Found in roughly 40% of brains examined after age 85, but rarely diagnosed during life. Cannot currently be confirmed without autopsy or research biomarkers.',
  },
  vascular: {
    name: 'Vascular Cognitive Disorder',
    shortName: 'VaD',
    color: '#7B6B8D',
    commonness: 0.85,
    description:
      'Cognitive decline caused by stroke or small-vessel disease in the brain.',
    keyFeature:
      'Slowed thinking, poor sustained attention and executive difficulty usually outrun memory loss. Gait change and urinary urgency often appear early.',
    commonnessNote:
      'Second most common single cause, and extremely common as a contributor alongside Alzheimer’s pathology.',
  },
  lewy: {
    name: 'Dementia with Lewy Bodies',
    shortName: 'LBD',
    color: '#8B7355',
    commonness: 0.75,
    description:
      'Alpha-synuclein deposits affecting attention, perception, sleep and movement.',
    keyFeature:
      'Fluctuating alertness + detailed visual hallucinations + acting out dreams + parkinsonism. SAFETY: severe antipsychotic sensitivity.',
    commonnessNote:
      'Commonly under-recognised. Getting this right matters more than most, because antipsychotics can cause serious harm.',
  },
  bvftd: {
    name: 'Frontotemporal Dementia — behavioural',
    shortName: 'bvFTD',
    color: '#B87333',
    commonness: 0.62,
    description:
      'Degeneration of frontal and anterior temporal lobes presenting with behaviour and personality change.',
    keyFeature:
      'Personality, conduct and empathy change BEFORE memory. Diagnosis requires 3 of 6 features: disinhibition, apathy, loss of empathy, compulsive behaviour, dietary change, dysexecutive profile.',
    commonnessNote:
      'Uncommon overall, but its share rises sharply under 65 — though even there Alzheimer’s remains more common.',
  },
  ppa: {
    name: 'Primary Progressive Aphasia',
    shortName: 'PPA',
    color: '#C25E5E',
    commonness: 0.58,
    description:
      'Language-led degeneration. Includes non-fluent/agrammatic and semantic variants.',
    keyFeature:
      'Language is the first and dominant problem for at least the first year or two, while day-to-day memory and behaviour hold up comparatively well.',
    commonnessNote:
      'Shares underlying pathology with bvFTD, but the presentation and the support needs are quite different.',
  },
  mixed: {
    name: 'Mixed Dementia',
    shortName: 'Mixed',
    color: '#5F7A8C',
    commonness: 0.95,
    description:
      'More than one disease process at once — most often Alzheimer’s plus cerebrovascular disease.',
    keyFeature:
      'Features that belong to different single types appear together, and decline is often faster than one pathology alone would explain.',
    commonnessNote:
      'The norm, not the exception, in advanced age: in six pooled community autopsy cohorts, 91% of 2,695 brains carried more than one of six key pathologies and 41% carried three or more.',
  },
};

// Evidence tiers used in symptom -> type mappings.
//
//   core        a formal diagnostic criterion for that type in the published
//               consensus criteria (DLB 2017 core features, Rascovsky 2011
//               features I-VI, VASCOG 2014 clinical criteria A1/A2, NIA-AA).
//   supportive  listed as a supportive/suggestive feature, or well replicated
//               in the literature without being a formal criterion.
//   common      genuinely occurs in this type but is too widespread across
//               types to help tell them apart. Counted, but weighted low.
//
// This replaces the original single per-SYMPTOM `discriminating` boolean, which
// could not express that one symptom is a core feature of one type and a
// non-specific finding in another (e.g. visuospatial impairment: core for LBD
// and PCA, non-specific for AD).
export const EVIDENCE_WEIGHTS = {
  core: 3,
  supportive: 2,
  common: 1,
};

export const EVIDENCE_LABELS = {
  core: 'Core criterion',
  supportive: 'Supportive',
  common: 'Non-specific',
};

// Weight subtracted when a symptom is explicit counter-evidence for a type.
export const AGAINST_WEIGHT = 2;

export const typeKeys = Object.keys(dementiaTypes);
