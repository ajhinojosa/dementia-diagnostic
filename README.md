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
// Visuoperceptual impairment: core for PCA, part of DLB's typical cognitive
// profile rather than one of its four core features, non-specific in typical AD.
types: { pca: 'core', lewy: 'supportive', alzheimers: 'common' }
```

- **core** (weight 3) — a formal criterion in the published consensus criteria
- **supportive** (weight 2) — a supportive/suggestive feature, or well replicated
- **common** (weight 1) — occurs in the type but too widespread to discriminate

**Profile match** = weighted share of a type's *defining* features that are present. Non-specific
findings corroborate when present but are excluded from the denominator, since not having them
shouldn't count against a type.

### Core evidence is counted per criterion, not per question

Published criteria are threshold rules over *named features*, not proportions over question lists:

| | threshold |
|---|---|
| probable DLB | ≥ 2 of 4 core clinical features |
| possible bvFTD | ≥ 3 of 6 behavioural/cognitive features |
| PCA | clinical + ≥ 3 posterior cognitive deficits + sparing |
| probable AD | insidious + progressive + amnestic + a second domain |

`src/data/criteria.js` encodes those features, and several questions can satisfy one of them. DLB's
parkinsonism feature is satisfied by rest tremor **or** rigidity/bradykinesia, exactly as the 2017
consortium specifies — so someone with rigidity alone is not scored as having half a feature.

This replaced `coreMatched / coreTotal` over checkboxes, which made a type's score depend on how
finely its criteria had been split into questions. On plain amnestic memory loss — the commonest
presentation in dementia — LATE beat Alzheimer's 59.4 to 45.7 on the two items that are Alzheimer's
*own* core criteria, purely because it had three core boxes to Alzheimer's four. The gap then fell
just outside the contention band, so the prevalence prior that exists to break exactly that tie was
never allowed to run. The two now score identically on that profile, and the prior decides.

A feature may also declare `requires`, for criteria phrased relative to another: NIA-AA's
*second* domain only counts once a first domain is present, so a purely visual presentation no
longer hands Alzheimer's a satisfied criterion.

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

### Two impact scales

"Impact" was two different questions under one label. For an **ability** the question is how much help
is needed — fine for "cannot manage finances". For a **behaviour or experienced symptom** there is no
task to assist with, so asking it produces nonsense: help them do *what* about apathy? You do not
"help someone with" being reckless with money. What matters there is what it led to.

| Scale | Question | Anchors | Applies to |
|---|---|---|---|
| `impactAbility` | How much help do they need? | none → reminders → hands-on → cannot do it | 15 items where a real task was lost |
| `impactConsequence` | What has this led to? | nothing much → upsetting → someone steps in → caused harm, loss or danger | 31 behaviours and experienced symptoms |

Every `episodic` item takes the consequence scale as a rule, since a recurring event is never an
ability. `deficit` items default to ability and opt in with `scale: 'consequence'`. Both replace the
original unanchored mild/moderate/severe, which two carers would apply differently.

## Backing up an assessment

**Export** writes the whole assessment — symptoms with their details, medical history, functional
status, red flags — to a JSON file. **Import** reads it back through the same migration as
localStorage, so a file exported from an older version still loads correctly rather than
half-loading with fields silently dropped.

This exists because the only copy previously lived in one localStorage key, on one browser, on one
device, with no undo. A cleared browser or a stray write lost everything. Import shows what is in the
file *and* what is about to be replaced before doing it, and reports any items dropped because they
are no longer part of the assessment.

Exported files contain patient name, age and medical history — treat them as you would any medical
record.

## Development

```bash
npm install
npm run dev

npm run check      # build + all three gates (what CI runs)
npm run verify     # the three gates only
```

| Gate | Guards against |
|---|---|
| `verify:scoring` | Symptom→type mappings drifting, and textbook presentations misranking in either mode |
| `verify:controls` | A regression test passing for a reason unrelated to what it claims to test |
| `verify:claims` | A corrected clinical claim surviving in the shipped prose after the data was fixed |
| `verify:backup` | Export/import failing to round-trip losslessly, older exports failing to load, or a malformed file crashing rather than producing a message |

`verify:scoring` pins the criteria-derived attributions **exactly**, in a golden-mapping table.
Ranking tests alone are robust to single mis-mappings by design — a textbook DLB profile still ranks
LBD first if one of its five core features is wrongly reattributed — which makes them useless as a
guard on the attributions themselves. Since wrong attributions were the original defect, each
criteria-derived mapping and item kind is asserted individually. Changing one requires changing the
table, which should require citing the criteria.

`verify:controls` reintroduces each fixed defect in memory and confirms the corresponding check goes
red — a regression test never seen to fail is not evidence of anything.

CI runs all of it on push and PR to `main` (`.github/workflows/verify.yml`).

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

### Criteria audit, second pass

A follow-up audit of the types with the thinnest core sets found four more problems:

- **Visuospatial impairment was core for DLB.** In DLB 2017 disproportionate visuoperceptual
  impairment describes the *essential* criterion's typical cognitive profile — it is not one of the
  four core clinical features. Downgraded to supportive.
- **Shuffling/freezing gait was core for DLB.** The 2017 revision restricts cardinal parkinsonism to
  bradykinesia, rest tremor and rigidity, deliberately excluding gait and postural signs as too
  non-specific in older people. Downgraded to supportive; it remains core for vascular disease,
  where VASCOG A2a names early gait disturbance directly.
- **Rest tremor was only supportive for DLB.** It is one of the three cardinal features, any one of
  which satisfies the parkinsonism criterion. Upgraded to core.
- **Prosopagnosia was only supportive for PCA.** Apperceptive prosopagnosia is on Crutch 2017's core
  cognitive feature list. Upgraded.
- **`beh1` ("a fundamentally different person") was core for bvFTD.** It describes the syndrome
  rather than naming one of Rascovsky's six features, which are scored individually. Downgraded to
  supportive and kept as a gateway question.
- **`mem9` packed three LATE criteria into one checkbox** — memory-predominant *and* onset after 80
  *and* slower than expected. Someone aged 82 with memory-predominant but fast decline could only
  overclaim all three or lose all three, and it was the sole item separating LATE from Alzheimer's.
  Split into `mem10`, `mem11` and `onset8`. Saved data migrates by expanding a checked `mem9` into
  all three, since checking a conjunction asserts every conjunct.

Missing criteria were added: NIA-AA's *clear-cut history of worsening* and *second affected domain*
for AD; the *relative sparing of non-memory domains* that is the central LATE-vs-AD discriminator in
Wolk 2025; four more of Crutch's sixteen posterior cognitive features plus the PCA sparing
criterion; and Gorno-Tempini's requirement that language be what impairs daily living.

Three structural defects were fixed: `discriminating` was one boolean per symptom shared across
every type it mapped to; ranking used raw counts across unequal denominators, which structurally
favoured the rarest diseases over the commonest; and core evidence was counted per checkbox rather
than per criterion.

## Medical disclaimer

**For discussion with healthcare providers only.** Dementia diagnosis requires comprehensive medical
evaluation including cognitive testing, brain imaging, blood work and clinical assessment. Several
listed types — LATE in particular — cannot be confirmed during life outside research settings. No
amount of symptom matching substitutes for excluding the treatable causes in the Red Flags section.
