# Dementia Symptom Assessment Tool

A caregiver-facing tool for organising observed symptoms into something a clinician can work from.
It compares the observed pattern against published diagnostic criteria for eight presentations, and
screens separately for treatable and urgent causes.

**It does not diagnose.** It compiles observations.

## Two lengths

| Mode | Items | Time | Trade-off |
|---|---|---|---|
| Quick screen | 24 | 2–3 min | Keeps the highest-value question for each subtype. Expect more ties and lower confidence. |
| Full assessment | 62 | 15–25 min | Every item, including low-specificity ones that confirm a picture rather than distinguish it. |

Answers carry over between modes. Scoring normalises against whichever set is active, so a quick-mode
profile match is out of what was actually asked.

## What it covers

**Subtypes:** Alzheimer's (typical), Posterior Cortical Atrophy, LATE, Vascular Cognitive Disorder,
Dementia with Lewy Bodies, behavioural-variant FTD, Primary Progressive Aphasia, Mixed.

**Red flags / reversible mimics:** delirium, rapid progression, focal neurological signs, depression,
normal pressure hydrocephalus, anticholinergic and sedative burden, missing B12/thyroid/imaging,
alcohol and nutrition, head injury, sleep apnoea. These never feed the subtype scoring — they are a
separate question with a different answer.

## How scoring works

Each symptom is graded **per type**, because the same finding can be decisive for one disease and
meaningless for another:

```js
// Visuospatial impairment: core for LBD and PCA, non-specific for typical AD.
types: { lewy: 'core', pca: 'core', alzheimers: 'common' }
```

- **core** (weight 3) — a formal criterion in the published consensus criteria
- **supportive** (weight 2) — a supportive/suggestive feature, or well replicated
- **common** (weight 1) — occurs in the type but too widespread to discriminate

**Profile match** = weighted share of a type's *defining* features that are present. Non-specific
findings corroborate when present but are excluded from the denominator, since not having them
shouldn't count against a type.

**Prevalence** is used only as a tie-breaker, among types within 20% of each other on symptom
evidence, and the UI states when it changed the order. Outside that band evidence alone decides — a
strong match for a rare type is never demoted for being rare.

**Confidence** is separate from ranking. The tool refuses to name a leading type until enough is
recorded, and says when the top two are too close to separate.

## Question types

Items are not all the same kind of thing, so they don't share one set of follow-up questions:

| Kind | Asks | Example |
|---|---|---|
| Recurring | First noticed · How often · Impact | Sees things that aren't there |
| Ongoing | First noticed · Impact · Direction | Cannot learn new information |
| Past event | When did this happen | Had a confirmed stroke |
| Pattern over time | *nothing* | Progressed gradually over years |
| Test result | When · Source | MRI showed atrophy and vascular changes |
| Background | *nothing* | Symptoms began before 65 |

Severity is anchored to what the person can still do ("needs reminders" / "needs hands-on help" /
"prevents the activity") rather than an unlabelled mild/moderate/severe scale.

## Development

```bash
npm install
npm run dev

node scripts/verify-scoring.mjs    # data integrity + canonical presentations
node scripts/negative-control.mjs  # confirms each check fails when its target is broken
```

`verify-scoring.mjs` asserts that textbook presentations rank correctly in both modes and that the
specific defects listed below stay fixed. `negative-control.mjs` reintroduces each defect in memory
and confirms the corresponding check goes red — a regression test never seen to fail is not evidence.

## Sources

- McKeith et al., *Neurology* 2017;89:88–100 — DLB Consortium 4th consensus
- Rascovsky et al., *Brain* 2011;134:2456–77 — bvFTD criteria
- Sachdev et al., *Alzheimer Dis Assoc Disord* 2014 — VASCOG vascular cognitive disorders
- Gorno-Tempini et al., *Neurology* 2011 — PPA classification
- Crutch et al., *Alzheimer's & Dementia* 2017 — PCA consensus
- Nelson et al., *Brain* 2019;142:1503–27 — LATE consensus
- Bathgate et al., *Acta Neurol Scand* 2001 — FTD/AD/VaD behavioural discrimination
- NIA-AA criteria; AAN practice parameter on dementia evaluation

## Corrections made in the 2026-08 revision

The symptom set was audited against the primary criteria papers. These were wrong or mis-weighted:

- **Antipsychotic sensitivity was labelled an "indicative biomarker" for DLB.** It is a *supportive
  clinical feature*. The indicative biomarkers are reduced dopamine-transporter uptake, reduced MIBG
  cardiac scintigraphy, and PSG-confirmed REM sleep without atonia. The distinction matters: an
  indicative biomarker alone can raise *possible* to *probable* DLB. Score reduced; safety warning
  kept prominent.
- **"FTD is the most common cause of dementia under 65" was asserted as fact.** It isn't. Alzheimer's
  is the most common young-onset cause (~40–50%); per 100,000 aged 30–64 the estimates are roughly
  AD 41, vascular 15, FTD 2. Onset before 65 now raises bvFTD/PPA/PCA relative to their own base
  rates without implying they overtake AD.
- **Stroke/TIA and "known cardiovascular disease" shared one checkbox**, giving a risk factor the
  weight of a diagnostic criterion. Split; the VASCOG three-month persistence clause added.
- **Excessive daytime sleepiness** was weighted as a key DLB discriminator; DLB 2017 lists it as
  supportive. Downgraded.
- **Early urinary symptoms** were weighted as non-discriminating for vascular disease; VASCOG A2b
  lists them as a formal supporting criterion alongside gait. Upgraded.
- **Cranial radiation** was listed as a vascular dementia indicator. Radiation-induced
  leukoencephalopathy is a distinct cause with a similar subcortical picture. Relabelled.
- **Five of ten Mixed items double-counted.** "Age 80+" was removed: mixed pathology past 80 is near
  universal (91% of 2,695 brains in six pooled autopsy cohorts carried >1 of six pathologies), and a
  near-universal finding carries almost no discriminating power.

Two structural defects were also fixed: `discriminating` was one boolean per symptom shared across
every type it mapped to, and ranking used raw counts across unequal denominators — which
structurally favoured the rarest diseases over the commonest.

## Medical disclaimer

**For discussion with healthcare providers only.** Dementia diagnosis requires comprehensive medical
evaluation including cognitive testing, brain imaging, blood work and clinical assessment. Several
listed types — LATE in particular — cannot be confirmed during life outside research settings. No
amount of symptom matching substitutes for excluding the treatable causes in the Red Flags section.
