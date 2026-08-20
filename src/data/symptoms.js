// ============================================
// SYMPTOM SET
// ============================================
//
// Every item declares:
//   kind    which modifiers the UI should offer (see itemKinds.js)
//   types   { typeKey: 'core' | 'supportive' | 'common' } -- evidence tier is
//           now PER TYPE, so one symptom can be a core criterion for one
//           disease and a non-specific finding in another
//   against optional list of types this symptom argues AGAINST
//   quick   included in the ~3 minute short screen
//   evidence  the source the mapping rests on
//
// Sources relied on:
//   DLB Consortium 4th consensus, Neurology 2017;89:88-100
//   Rascovsky et al., Brain 2011;134:2456-77 (bvFTD, features I-VI)
//   Sachdev et al., VASCOG statement, Alzheimer Dis Assoc Disord 2014
//   NIA-AA criteria; Crutch et al. PCA consensus, Alz & Dem 2017
//   Nelson et al., LATE consensus, Brain 2019;142:1503-27
//   Wolk et al., clinical criteria for LATE, Alzheimer's & Dementia 2025;21:e14202
//   Gorno-Tempini et al., PPA classification, Neurology 2011
//   Bathgate et al., Acta Neurol Scand 2001 (FTD/AD/VaD behavioural discrimination)

export const globalSymptoms = [
  // ------------------------------------------------------------------
  // MEMORY & LEARNING
  // ------------------------------------------------------------------
  {
    id: 'mem1',
    category: 'Memory & Learning',
    kind: 'episodic',
    quick: true,
    text: 'Asks the same question repeatedly, or forgets a conversation that happened hours ago',
    types: { alzheimers: 'core', late: 'core', mixed: 'supportive' },
    evidence:
      'NIA-AA criteria: impaired acquisition/retention of new information is the defining amnestic presentation. LATE produces a near-identical amnestic picture and cannot be separated from AD on symptoms alone.',
  },
  {
    id: 'mem2',
    category: 'Memory & Learning',
    kind: 'episodic',
    text: 'Puts things in strange places (keys in the freezer, wallet in the oven)',
    types: { alzheimers: 'supportive' },
    evidence:
      "Alzheimer's Association warning signs. Widely reported in AD but not part of the formal diagnostic criteria, so treated as supportive rather than core.",
  },
  {
    id: 'mem3',
    category: 'Memory & Learning',
    kind: 'episodic',
    quick: true,
    text: 'Gets lost somewhere familiar — their own neighbourhood, or a route they have driven for years',
    types: { alzheimers: 'core', pca: 'supportive', lewy: 'common' },
    evidence:
      'Topographic disorientation is characteristic of the typical amnestic AD presentation. Also arises in PCA via visuospatial failure, and in DLB, so it is not exclusive to AD.',
  },
  {
    id: 'mem4',
    category: 'Memory & Learning',
    kind: 'course',
    quick: true,
    text: 'Thinking got worse in sudden noticeable steps, with flat stretches in between, rather than sliding down steadily',
    types: { vascular: 'core', mixed: 'supportive' },
    evidence:
      'VASCOG 2014: abrupt onset with a stepwise or fluctuating course is the classic multi-infarct pattern. IMPORTANT CAVEAT: VASCOG explicitly notes small-vessel vascular disease often produces gradual onset and slow progression instead, so the absence of stepwise decline does NOT rule vascular disease out.',
  },
  {
    id: 'mem5',
    category: 'Memory & Learning',
    kind: 'episodic',
    quick: true,
    text: 'Alertness swings dramatically — clearly "there" one hour and vacant or confused the next, on the same day',
    types: { lewy: 'core' },
    evidence:
      'DLB 2017 core clinical feature: fluctuating cognition with pronounced variation in attention and alertness.',
  },
  {
    id: 'mem6',
    category: 'Memory & Learning',
    kind: 'episodic',
    text: 'Stares into space or becomes briefly unresponsive, then "comes back"',
    types: { lewy: 'supportive' },
    evidence:
      'DLB 2017 lists transient episodes of unresponsiveness as a supportive clinical feature — a visible manifestation of the core fluctuation feature rather than a separate core feature.',
  },
  {
    id: 'mem7',
    category: 'Memory & Learning',
    kind: 'deficit',
    quick: true,
    text: 'Cannot hold on to new information even with repetition, notes and reminders',
    types: { alzheimers: 'core', late: 'core', mixed: 'supportive' },
    against: ['bvftd'],
    evidence:
      'NIA-AA: the core amnestic criterion. Counts against bvFTD, whose criteria specify relative sparing of episodic memory — though note that recent reviews find episodic memory IS often impaired in bvFTD, so this is a lean rather than an exclusion.',
  },
  {
    id: 'mem8',
    category: 'Memory & Learning',
    kind: 'deficit',
    quick: true,
    text: 'Cannot hold attention on anything demanding — loses the thread, is derailed by any interruption',
    types: { vascular: 'core', lewy: 'supportive', mixed: 'supportive' },
    evidence:
      'VASCOG 2014 criterion A2: decline prominent in speed of information processing and complex attention. Attention is also disproportionately affected in DLB relative to memory.',
  },
  // mem9 was retired here. It read "Memory is clearly the main problem, it
  // began after about age 80, AND it has crept along more slowly than
  // expected" -- three independent criteria behind one checkbox. Someone aged
  // 82 with memory-predominant but fast decline had to either overclaim all
  // three or lose all three, and it was the only thing separating LATE from
  // Alzheimer's. Replaced by mem10, mem11 and onset8, each answerable alone.
  // Migration expands a checked mem9 into all three, since checking a
  // conjunction is an assertion of every conjunct.
  {
    id: 'mem10',
    category: 'Memory & Learning',
    kind: 'course',
    quick: true,
    text: 'Memory is far and away the main problem — planning, language and spatial skills are much less affected',
    types: { late: 'core', alzheimers: 'common' },
    evidence:
      'Wolk et al. 2025 (Alz & Dem), clinical criteria for LATE: the central discriminator from AD. LATE predominantly affects memory, where AD involves the wider range of executive, language and visuospatial function. Until this item existed the tool had no way to express relative SPARING of a domain, which left LATE and AD near-indistinguishable by construction.',
  },
  {
    id: 'mem11',
    category: 'Memory & Learning',
    kind: 'course',
    quick: true,
    text: 'Decline has been unusually slow — gradual change over many years rather than a steady visible slide',
    types: { late: 'core' },
    evidence:
      'LATE consensus (Brain 2019) and Wolk 2025: isolated LATE follows a slower trajectory than AD. Note the exception — when LATE and AD coexist the course is FASTER than either alone, so a slow course argues for LATE while a fast one does not rule it out.',
  },

  // ------------------------------------------------------------------
  // PLANNING & PROBLEM-SOLVING
  // ------------------------------------------------------------------
  {
    id: 'exec1',
    category: 'Planning & Problem-Solving',
    kind: 'deficit',
    text: 'Struggles with money management — bills unpaid, accounts in disarray, cannot follow multi-step instructions',
    types: { alzheimers: 'common', vascular: 'supportive', bvftd: 'common', mixed: 'common' },
    evidence:
      'Occurs across every type; among the first instrumental activities to fail regardless of cause. Included because it is a useful marker of functional stage, not because it separates the types.',
  },
  {
    id: 'exec2',
    category: 'Planning & Problem-Solving',
    kind: 'deficit',
    quick: true,
    text: 'Cannot organise, plan ahead or sequence a task — a familiar recipe now falls apart',
    types: { bvftd: 'core', vascular: 'core', alzheimers: 'common', mixed: 'common' },
    evidence:
      'Rascovsky 2011 feature VI: dysexecutive neuropsychological profile. VASCOG 2014 A2: frontal-executive decline. Genuinely core for both — which is exactly the case the old single per-symptom flag could not express.',
  },
  {
    id: 'exec3',
    category: 'Planning & Problem-Solving',
    kind: 'deficit',
    quick: true,
    text: 'Thinking has visibly slowed — long pauses before answering, everything takes far longer than it used to',
    types: { vascular: 'core', lewy: 'supportive', mixed: 'supportive' },
    evidence:
      'VASCOG 2014 A2 names speed of information processing first among affected domains. Psychomotor slowing is the signature of the subcortical small-vessel profile.',
  },
  {
    id: 'exec4',
    category: 'Planning & Problem-Solving',
    kind: 'deficit',
    quick: true,
    text: 'Misjudges distances, cannot read an analogue clock, cannot assemble or fit things together',
    types: { pca: 'core', lewy: 'supportive', alzheimers: 'common' },
    evidence:
      'Crutch 2017: space perception deficit and constructional dyspraxia are both on the PCA core cognitive list. CORRECTION: previously core for DLB. In DLB 2017 disproportionate visuoperceptual impairment describes the ESSENTIAL criterion’s typical cognitive profile — it is not one of the four core clinical features — so it is supportive there. Non-specific for AD on its own, but it can satisfy the NIA-AA second-domain criterion (see criteria.js).',
  },
  {
    id: 'exec5',
    category: 'Planning & Problem-Solving',
    kind: 'deficit',
    text: 'Can see an object perfectly well but cannot work out what it is, or has lost the ability to read — with normal eye exams',
    types: { pca: 'core', alzheimers: 'common' },
    evidence:
      'Crutch et al. PCA consensus 2017: progressive loss of higher-order visual function with preserved primary vision. People are typically sent round optometrists for years before anyone considers a neurological cause.',
  },
  // Crutch 2017 names sixteen core cognitive features and requires at least
  // three. The tool previously carried about three and a half of them, which
  // is why PCA had the thinnest core of any type -- and only ONE core item in
  // quick mode, where a single checkbox swung it 76 points. The four below are
  // the ones a family member can actually answer without testing.
  {
    id: 'exec6',
    category: 'Planning & Problem-Solving',
    kind: 'deficit',
    quick: true,
    text: 'Can only take in one thing at a time — misses objects in plain sight, or cannot find an item on a cluttered table',
    types: { pca: 'core' },
    evidence:
      'Crutch 2017: simultanagnosia, the second most frequent core cognitive feature of PCA. Worded around a everyday scene because the clinical test (Navon figures, Cookie Theft) means nothing to a caregiver.',
  },
  {
    id: 'exec7',
    category: 'Planning & Problem-Solving',
    kind: 'deficit',
    text: 'Cannot work out how to put clothes on — inside out, back to front, or lost in a sleeve',
    types: { pca: 'core' },
    evidence:
      'Crutch 2017: dressing apraxia, on the core cognitive feature list. Distinctive because it appears while the person can still explain exactly what they are trying to do.',
  },
  {
    id: 'exec8',
    category: 'Planning & Problem-Solving',
    kind: 'deficit',
    quick: true,
    text: 'Reaches past things when picking them up, or has become frightened of stairs, escalators and kerbs',
    types: { pca: 'core' },
    evidence:
      'Crutch 2017: optic ataxia and space perception deficit. Stairs and escalators are the everyday situation where a space-perception deficit first becomes frightening, and are often the reason a family seeks help.',
  },
  {
    id: 'exec9',
    category: 'Planning & Problem-Solving',
    kind: 'deficit',
    text: 'Can no longer do simple arithmetic, or confuses left and right',
    types: { pca: 'core' },
    evidence:
      'Crutch 2017: acalculia and left/right disorientation, both on the core cognitive feature list. Part of the Gerstmann cluster that accompanies parietal involvement in PCA.',
  },

  // ------------------------------------------------------------------
  // BEHAVIOUR & PERSONALITY
  // ------------------------------------------------------------------
  {
    id: 'beh1',
    category: 'Behaviour & Personality',
    kind: 'deficit',
    scale: 'consequence', // personality change is not a task; what matters is the effect on those around them
    quick: true,
    text: 'Seems like a fundamentally different person than they used to be',
    types: { bvftd: 'supportive' },
    evidence:
      'Rascovsky 2011: early and progressive change in personality and conduct is the defining bvFTD presentation, typically preceding memory loss. CORRECTION: previously core. This is a gateway question, not one of Rascovsky’s six features — it describes the syndrome rather than naming a criterion, and the six specific features (disinhibition, apathy, loss of empathy, perseveration, hyperorality, dysexecutive profile) are scored individually. Kept as a supportive prompt because it is how families usually describe bvFTD first.',
  },
  {
    id: 'beh2',
    category: 'Behaviour & Personality',
    kind: 'episodic',
    quick: true,
    text: 'Says or does socially inappropriate things — tactless remarks, sexual comments, approaching strangers',
    types: { bvftd: 'core' },
    evidence:
      'Rascovsky 2011 feature I: behavioural disinhibition. Among the strongest discriminators of FTD from AD in Bathgate et al.',
  },
  {
    id: 'beh3',
    category: 'Behaviour & Personality',
    kind: 'deficit',
    scale: 'consequence', // lost empathy is not an ability you assist with
    quick: true,
    text: 'Has stopped responding to other people’s feelings — indifferent to distress that would once have moved them',
    types: { bvftd: 'core' },
    evidence:
      'Rascovsky 2011 feature III: loss of sympathy or empathy. Bathgate et al. found loss of emotion among the features that most strongly separate FTD from AD.',
  },
  {
    id: 'beh4',
    category: 'Behaviour & Personality',
    kind: 'episodic',
    text: 'Locked into rituals or repetition — a fixed unchangeable routine, hoarding, repeated phrases or movements',
    types: { bvftd: 'core' },
    evidence:
      'Rascovsky 2011 feature IV: perseverative, stereotyped or compulsive/ritualistic behaviour. Motor and verbal stereotypies were strong FTD discriminators in Bathgate et al.',
  },
  {
    id: 'beh5',
    category: 'Behaviour & Personality',
    kind: 'deficit',
    quick: true,
    scale: 'consequence', // apathy: you prompt them, you do not help them do it
    text: 'Profound loss of drive — will sit all day unless prompted, no longer initiates anything they used to enjoy',
    types: { bvftd: 'core', vascular: 'supportive', alzheimers: 'common', mixed: 'common' },
    evidence:
      'Rascovsky 2011 feature II: apathy or inertia. VASCOG 2014 A2c lists abulia and mood change as supporting features. Apathy is common in AD but appears later and is not specific.',
  },
  {
    id: 'beh6',
    category: 'Behaviour & Personality',
    kind: 'episodic',
    text: 'Reckless with money — impulsive purchases, gave money to a scam, uncharacteristically poor judgement',
    types: { bvftd: 'supportive', alzheimers: 'common' },
    evidence:
      'A frequent early consequence of frontal disinhibition and impaired judgement in bvFTD. Also occurs in AD via general judgement decline, so it does not separate them well on its own.',
  },
  {
    id: 'beh7',
    category: 'Behaviour & Personality',
    kind: 'deficit',
    scale: 'consequence', // they CAN wash; they do not. Prompting, not assistance
    text: 'Has stopped washing, changing clothes or grooming, and does not seem bothered by it',
    types: { bvftd: 'supportive' },
    evidence:
      'Personal neglect was among the discriminating features for FTD in Bathgate et al. Often appears before memory changes, which is what makes it useful.',
  },

  // ------------------------------------------------------------------
  // HALLUCINATIONS & PERCEPTIONS
  // ------------------------------------------------------------------
  {
    id: 'hall1',
    category: 'Hallucinations & Perceptions',
    kind: 'episodic',
    quick: true,
    text: 'Sees things that are not there, in convincing detail — people, children, animals',
    types: { lewy: 'core' },
    evidence:
      'DLB 2017 core clinical feature: recurrent, well-formed and detailed visual hallucinations, occurring in up to 80% of patients and typically early.',
  },
  {
    id: 'hall2',
    category: 'Hallucinations & Perceptions',
    kind: 'episodic',
    text: 'Describes seeing deceased relatives, or strangers who are in the house',
    types: { lewy: 'supportive' },
    evidence:
      'A characteristic content pattern of the DLB core visual-hallucination feature. Recorded separately because families often report it without recognising it as a hallucination.',
  },
  {
    id: 'hall3',
    category: 'Hallucinations & Perceptions',
    kind: 'episodic',
    text: 'Believes a family member has been replaced by an impostor, or that the house is not really their house',
    types: { lewy: 'common', alzheimers: 'common' },
    evidence:
      'Capgras and related misidentification delusions run at roughly 16% in AD and 17% in DLB — near-identical rates. Distressing and important to manage, but genuinely NOT useful for telling the two apart.',
  },

  // ------------------------------------------------------------------
  // MOVEMENT & PHYSICAL
  // ------------------------------------------------------------------
  {
    id: 'mov1',
    category: 'Movement & Physical',
    kind: 'deficit',
    quick: true,
    text: 'Walks differently — shuffling, small steps, feet seeming stuck to the floor, hesitating in doorways',
    types: { vascular: 'core', lewy: 'supportive' },
    evidence:
      'VASCOG 2014 A2a: early gait disturbance (small-step, magnetic, apraxic-ataxic or parkinsonian gait) — a core marker of the subcortical small-vessel profile. CORRECTION: previously also core for DLB. The 2017 revision restricts cardinal parkinsonism to bradykinesia, rest tremor and rigidity, deliberately excluding gait and postural features because they are too non-specific in older people. Parkinsonian gait is common in DLB but does not by itself satisfy the parkinsonism core feature, so it is supportive there.',
  },
  {
    id: 'mov2',
    category: 'Movement & Physical',
    kind: 'deficit',
    quick: true,
    text: 'Limbs have become stiff or rigid, and movement has slowed',
    types: { lewy: 'core' },
    evidence:
      'DLB 2017 core feature: parkinsonism (bradykinesia, rigidity), eventually present in over 85% of cases.',
  },
  {
    id: 'mov3',
    category: 'Movement & Physical',
    kind: 'deficit',
    scale: 'consequence', // a tremor is experienced, not performed
    quick: true,
    text: 'Hands shake when resting in their lap',
    types: { lewy: 'core' },
    evidence:
      'CORRECTION: previously supportive. Rest tremor is one of the three cardinal parkinsonian features named in DLB 2017, and the criteria require documentation of only ONE of bradykinesia, rest tremor or rigidity. It is less prominent in DLB than in Parkinson’s disease, but it satisfies the parkinsonism core feature outright, so it belongs alongside rigidity rather than below it.',
  },
  {
    id: 'mov4',
    category: 'Movement & Physical',
    kind: 'episodic',
    text: 'Falling, or repeatedly losing balance, without an obvious trip or cause',
    types: { lewy: 'supportive', vascular: 'supportive', mixed: 'common' },
    evidence:
      'DLB 2017 supportive feature (repeated falls). VASCOG 2014 A2a explicitly includes "unsteadiness and frequent, unprovoked falls" as a manifestation of the gait criterion.',
  },
  {
    id: 'mov5',
    category: 'Movement & Physical',
    kind: 'deficit',
    scale: 'consequence', // reduced expression costs nothing to do
    text: 'Face has become expressionless or mask-like',
    types: { lewy: 'supportive' },
    evidence: 'Hypomimia, part of the DLB parkinsonism feature.',
  },
  {
    id: 'mov6',
    category: 'Movement & Physical',
    kind: 'event',
    quick: true,
    text: 'Had a confirmed stroke, and thinking or memory clearly dropped around that time and never recovered within 3 months',
    types: { vascular: 'core', mixed: 'core' },
    evidence:
      'VASCOG 2014 criterion A1a: documented stroke with cognitive decline temporally associated with the event. The three-month clause is part of the criterion — deficits improving within three months of a stroke are recovery, not dementia. Also scores for mixed, because post-stroke decline frequently unmasks existing Alzheimer’s pathology.',
  },
  {
    id: 'mov6b',
    category: 'Movement & Physical',
    kind: 'event',
    text: 'Had a TIA or "mini-stroke" — symptoms that resolved within a day',
    types: { vascular: 'supportive' },
    evidence:
      'Evidence of cerebrovascular disease and a risk marker, but a TIA by definition leaves no lasting deficit, so it is weaker evidence than a completed stroke with persistent decline.',
  },
  {
    id: 'mov8',
    category: 'Movement & Physical',
    kind: 'deficit',
    text: 'Has lasting one-sided weakness, facial droop, slurred speech or swallowing trouble',
    types: { vascular: 'core' },
    evidence:
      'VASCOG 2014 criterion A1b: physical signs consistent with stroke (hemiparesis, lower facial weakness, spastic dysarthria, swallowing difficulty) count as evidence of a cerebrovascular event even without a documented stroke history.',
  },
  {
    id: 'mov7',
    category: 'Movement & Physical',
    kind: 'event',
    text: 'Had radiation treatment to the head or brain',
    types: { vascular: 'supportive' },
    evidence:
      'CORRECTION: this is a DISTINCT cause, not vascular dementia. Radiation-induced leukoencephalopathy develops months to years after cranial irradiation and produces a subcortical white-matter picture closely resembling small-vessel vascular disease (shared mechanism: endothelial injury). Grouped with the vascular profile because the symptom pattern and management overlap — but the underlying diagnosis differs, and it belongs in front of a neurologist.',
  },

  // ------------------------------------------------------------------
  // SLEEP & AROUSAL
  // ------------------------------------------------------------------
  {
    id: 'sleep1',
    category: 'Sleep & Arousal',
    kind: 'episodic',
    quick: true,
    text: 'Acts out dreams while asleep — punching, kicking, shouting, or has fallen out of bed',
    types: { lewy: 'core' },
    evidence:
      'DLB 2017 core clinical feature, given increased diagnostic weight in the fourth consensus. Present in 76% of autopsy-confirmed DLB versus 4% of non-DLB. Frequently precedes cognitive symptoms by years.',
  },
  {
    id: 'sleep2',
    category: 'Sleep & Arousal',
    kind: 'episodic',
    text: 'Talks, shouts or makes sounds while asleep',
    types: { lewy: 'supportive' },
    evidence:
      'A softer manifestation of dream enactment. Weaker than overt movement because ordinary sleep-talking is common and non-specific.',
  },
  {
    id: 'sleep3',
    category: 'Sleep & Arousal',
    kind: 'deficit',
    scale: 'consequence', // sleepiness is not a task
    text: 'Sleeps a great deal in the daytime — dozes off mid-conversation or mid-activity',
    types: { lewy: 'supportive' },
    evidence:
      'CORRECTED WEIGHTING: DLB 2017 lists hypersomnia/excessive daytime sleepiness as a SUPPORTIVE clinical feature, not a core one. Previously over-weighted here as a key discriminator.',
  },
  {
    id: 'sleep4',
    category: 'Sleep & Arousal',
    kind: 'episodic',
    text: 'Day and night have flipped — awake and active at night, asleep during the day',
    types: { alzheimers: 'common', lewy: 'common' },
    evidence:
      'Circadian disruption and sundowning occur across types. Genuinely difficult for caregivers, but of little value in telling types apart.',
  },

  // ------------------------------------------------------------------
  // EATING & ORAL BEHAVIOURS
  // ------------------------------------------------------------------
  {
    id: 'eat1',
    category: 'Eating & Oral Behaviours',
    kind: 'deficit',
    scale: 'consequence', // a food preference is not an ability
    quick: true,
    text: 'Developed a striking new sweet tooth, or now craves carbohydrates they never used to want',
    types: { bvftd: 'core' },
    evidence:
      'Rascovsky 2011 feature V: hyperorality and dietary change, specifically including increased preference for sweet food. Bathgate et al. found sweet food preference among the behaviours that most strongly discriminate FTD from both AD and vascular dementia.',
  },
  {
    id: 'eat2',
    category: 'Eating & Oral Behaviours',
    kind: 'episodic',
    text: 'Eats far too much or far too fast — crams food in, takes food from other people’s plates',
    types: { bvftd: 'core' },
    evidence:
      'Rascovsky 2011 feature V (binge eating). Gluttony was a strong FTD discriminator in Bathgate et al.',
  },
  {
    id: 'eat3',
    category: 'Eating & Oral Behaviours',
    kind: 'deficit',
    scale: 'consequence', // food fads are not an ability
    text: 'Fixated on a narrow set of foods, or has rigid new rules about eating',
    types: { bvftd: 'core' },
    evidence: 'Rascovsky 2011 feature V: food fads as part of the hyperorality criterion.',
  },
  {
    id: 'eat4',
    category: 'Eating & Oral Behaviours',
    kind: 'episodic',
    text: 'Puts non-food items in their mouth, or is smoking/drinking markedly more',
    types: { bvftd: 'supportive' },
    evidence:
      'Rascovsky 2011 feature V includes oral exploration and consumption of inedible objects. Recorded as supportive because it usually appears later than the dietary changes.',
  },
  {
    id: 'eat5',
    category: 'Eating & Oral Behaviours',
    kind: 'deficit',
    scale: 'consequence', // weight loss: the concern is harm, not assistance
    text: 'Appetite has fallen away and they are losing weight',
    types: { alzheimers: 'common' },
    against: ['bvftd'],
    evidence:
      'The opposite direction to FTD. AD typically presents with decreased appetite, early swallowing difficulty and weight loss, whereas bvFTD characteristically shows increased intake — so this counts AGAINST a behavioural FTD picture.',
  },

  // ------------------------------------------------------------------
  // LANGUAGE & COMMUNICATION
  // ------------------------------------------------------------------
  {
    id: 'lang1',
    category: 'Language & Communication',
    kind: 'deficit',
    text: 'Cannot retrieve the word they want — substitutes "thing", or talks around it',
    types: { ppa: 'core', alzheimers: 'common', bvftd: 'common' },
    evidence:
      'Anomia is the entry symptom for several PPA variants. Also extremely common in AD, so on its own it points nowhere — it becomes informative only when language is the DOMINANT problem (see the onset items).',
  },
  {
    id: 'lang2',
    category: 'Language & Communication',
    kind: 'deficit',
    quick: true,
    text: 'Speech has become effortful, halting or grammatically broken — the words come out with visible struggle',
    types: { ppa: 'core' },
    evidence:
      'Gorno-Tempini 2011: non-fluent/agrammatic variant PPA — effortful halting speech with agrammatism and/or apraxia of speech.',
  },
  {
    id: 'lang3',
    category: 'Language & Communication',
    kind: 'deficit',
    quick: true,
    text: 'Has lost the meanings of words — asks "what is a fork?" about everyday objects',
    types: { ppa: 'core' },
    evidence:
      'Gorno-Tempini 2011: semantic variant PPA — impaired confrontation naming and single-word comprehension reflecting loss of conceptual knowledge. Highly specific; healthy ageing does not do this.',
  },
  {
    id: 'lang4',
    category: 'Language & Communication',
    kind: 'deficit',
    scale: 'consequence', // withdrawal is a behaviour, not a lost skill
    text: 'Has withdrawn from conversation and social occasions',
    types: { alzheimers: 'common', bvftd: 'common', ppa: 'common' },
    evidence:
      'A common downstream consequence of language difficulty, apathy or embarrassment across all types. Non-specific.',
  },
  {
    id: 'lang5',
    category: 'Language & Communication',
    kind: 'deficit',
    text: 'Cannot recognise familiar faces — not just forgetting names, but not knowing the face',
    types: { pca: 'core', ppa: 'supportive' },
    evidence:
      'CORRECTION: previously supportive for PCA. Apperceptive prosopagnosia is named on Crutch 2017’s core cognitive feature list, so it counts toward the three required posterior deficits. Also arises via right anterior temporal degeneration in semantic variant PPA, where it is supportive. Distinguishing this from ordinary name-forgetting is the key question to ask.',
  },
  {
    id: 'lang6',
    category: 'Language & Communication',
    kind: 'deficit',
    quick: true,
    scale: 'consequence',
    text: 'It is the language trouble specifically that stops them managing day to day — not memory, judgement or motivation',
    types: { ppa: 'core' },
    evidence:
      'Gorno-Tempini 2011 root inclusion criterion 2: the language deficit must be the principal cause of impaired daily living activities. This is what separates PPA from a dementia that happens to include word-finding trouble, and it was previously unasked.',
  },

  // ------------------------------------------------------------------
  // AUTONOMIC & OTHER
  // ------------------------------------------------------------------
  {
    id: 'auto1',
    category: 'Autonomic & Other',
    kind: 'episodic',
    text: 'Faints, or goes dizzy and grey on standing up',
    types: { lewy: 'supportive' },
    evidence:
      'DLB 2017 supportive clinical feature: autonomic dysfunction including orthostatic hypotension and syncope.',
  },
  {
    id: 'auto2',
    category: 'Autonomic & Other',
    kind: 'deficit',
    text: 'Urinary urgency, frequency or accidents appeared EARLY, before they were otherwise very impaired',
    types: { vascular: 'core', mixed: 'supportive' },
    evidence:
      'CORRECTED WEIGHTING: VASCOG 2014 criterion A2b lists early urinary frequency and urgency not explained by urological disease as a formal supporting criterion, alongside gait disturbance. Previously under-weighted here as non-discriminating. The word "early" carries the weight — late incontinence is universal and means nothing.',
  },
  {
    id: 'auto3',
    category: 'Autonomic & Other',
    kind: 'deficit',
    scale: 'consequence', // constipation is experienced, not performed
    text: 'Long-standing constipation not explained by medication',
    types: { lewy: 'supportive' },
    evidence:
      'DLB 2017 supportive feature: autonomic dysfunction. Notable because it can precede cognitive symptoms by many years as part of the prodromal synucleinopathy picture.',
  },
  {
    id: 'auto4',
    category: 'Autonomic & Other',
    kind: 'deficit',
    scale: 'consequence', // anosmia is experienced; the risk is missed gas or spoiled food
    text: 'Lost their sense of smell, around or before the other symptoms began',
    types: { lewy: 'supportive' },
    evidence:
      'DLB 2017 supportive feature: hyposmia, which occurs earlier in DLB than in AD. Part of the prodromal picture alongside REM sleep behaviour disorder and constipation.',
  },
  {
    id: 'auto5',
    category: 'Autonomic & Other',
    kind: 'event',
    quick: true,
    safetyFlag: true,
    text: 'Reacted badly to an antipsychotic — became rigid, heavily sedated, or dramatically worse',
    types: { lewy: 'supportive' },
    evidence:
      'CORRECTION: DLB 2017 classifies severe antipsychotic sensitivity as a SUPPORTIVE CLINICAL FEATURE. It is NOT an indicative biomarker — the three indicative biomarkers are reduced dopamine-transporter uptake on SPECT/PET, reduced MIBG cardiac scintigraphy, and polysomnography-confirmed REM sleep without atonia. The distinction is load-bearing: an indicative biomarker alone can raise a diagnosis from possible to probable DLB, whereas a supportive feature cannot. Scored lower than before, but flagged prominently because the SAFETY implication is severe and unchanged.',
  },

  // ------------------------------------------------------------------
  // ONSET & PROGRESSION  (all `course`/`context` -- no modifiers)
  // ------------------------------------------------------------------
  {
    id: 'onset2',
    category: 'Onset & Progression',
    kind: 'course',
    quick: true,
    text: 'It has come on so gradually that no one can point to when it started',
    types: { alzheimers: 'core', late: 'supportive' },
    evidence:
      'NIA-AA: insidious onset over months to years, as opposed to abrupt onset, is characteristic of AD. Also fits LATE, which is slower still.',
  },
  {
    id: 'onset3',
    category: 'Onset & Progression',
    kind: 'course',
    text: 'Decline has been fast — clearly worse over months rather than years',
    types: { lewy: 'supportive', mixed: 'supportive', vascular: 'common' },
    evidence:
      'DLB often progresses faster than AD, and multiple simultaneous pathologies accelerate decline. NOTE: genuinely rapid decline over weeks to a few months is a RED FLAG requiring urgent assessment, not a subtype clue — see the Red Flags tab.',
  },
  {
    id: 'onset4',
    category: 'Onset & Progression',
    kind: 'course',
    quick: true,
    text: 'Personality and behaviour changed FIRST — memory problems came later, if at all',
    types: { bvftd: 'core' },
    evidence:
      'Rascovsky 2011: the defining temporal signature of bvFTD. This ordering is the single most useful question for separating bvFTD from AD.',
  },
  {
    id: 'onset5',
    category: 'Onset & Progression',
    kind: 'course',
    quick: true,
    text: 'Language was the first and main problem, and stayed that way for a year or more before anything else',
    types: { ppa: 'core' },
    evidence:
      'Gorno-Tempini 2011: PPA requires that language be the most prominent clinical deficit at onset and for the initial phase of the illness.',
  },
  {
    id: 'onset6',
    category: 'Onset & Progression',
    kind: 'course',
    quick: true,
    text: 'Vision and spatial problems came first, and eye examinations were normal',
    types: { pca: 'core' },
    evidence:
      'Crutch et al. 2017: PCA requires insidious onset with visual symptoms predominating, and relative sparing of memory and insight early on.',
  },
  {
    id: 'onset7',
    category: 'Onset & Progression',
    kind: 'course',
    quick: true,
    text: 'They are clearly and definitely worse now than a year ago — the decline has kept going',
    types: { alzheimers: 'core', bvftd: 'common', ppa: 'common', pca: 'common', lewy: 'common' },
    evidence:
      'NIA-AA 2011 lists "a clear-cut history of worsening of cognition by report or observation" as a REQUIREMENT for probable AD, separate from insidious onset. It was previously unrepresented at type level: progression existed only as a per-item trend modifier, so it could never satisfy a criterion. Marked non-specific for the other neurodegenerative types because they all progress — it corroborates rather than discriminates.',
  },
  {
    id: 'onset8',
    category: 'Onset & Progression',
    kind: 'context',
    quick: true,
    text: 'Symptoms began after about age 80',
    types: { late: 'core', mixed: 'supportive' },
    evidence:
      'LATE consensus (Brain 2019) and Wolk 2025: LATE is a disease of the oldest old, detectable in over a third of brains past 85, while AD prevalence levels off and falls after that age. Split out of the retired mem9 compound. Mirrors onset1 ("before age 65"), which already existed as a standalone item — the after-80 half had no equivalent. Also raises the prior for mixed pathology, which is the commonest reality at this age.',
  },
  {
    id: 'onset9',
    category: 'Onset & Progression',
    kind: 'course',
    quick: true,
    text: 'Memory, conversation and personality are still much as they were — the trouble is mainly with seeing and handling things',
    types: { pca: 'core' },
    evidence:
      'Crutch et al. 2017 requires relative sparing of anterograde memory, speech and non-visual language, executive function, personality and behaviour. This is the criterion that separates PCA from typical AD, and like LATE’s sparing criterion it was previously unexpressible.',
  },
  {
    id: 'onset1',
    category: 'Onset & Progression',
    kind: 'context',
    text: 'Symptoms began before age 65',
    types: { bvftd: 'supportive', ppa: 'supportive', pca: 'supportive', alzheimers: 'common' },
    evidence:
      "CORRECTION: the previous version stated 'FTD is the most common cause of dementia under 65' and scored this for FTD alone. That is not correct. Alzheimer's disease is the most common cause of young-onset dementia (roughly 40-50% of cases); per 100,000 people aged 30-64 the estimates are approximately AD 41, vascular 15, FTD 2. Young onset does raise the RELATIVE likelihood of FTD, PPA and PCA against their own base rates, which is why it scores as supportive for those — but it does not make FTD more likely than AD in absolute terms.",
  },
  {
    id: 'mixed1',
    category: 'Onset & Progression',
    kind: 'course',
    text: 'Both patterns at once — a slow steady slide AND separate sudden drops',
    types: { mixed: 'core' },
    evidence:
      'The combined signature of Alzheimer’s gradual progression plus superimposed vascular events. The most direct clinical indicator of mixed pathology.',
  },
  {
    id: 'mixed4',
    category: 'Onset & Progression',
    kind: 'course',
    text: 'Declining faster than the doctors expected given the working diagnosis',
    types: { mixed: 'supportive' },
    evidence:
      'Autopsy series consistently show that multiple co-occurring pathologies lower the threshold for clinically overt dementia and accelerate decline relative to a single pathology.',
  },
  {
    id: 'mixed5',
    category: 'Onset & Progression',
    kind: 'course',
    quick: true,
    text: 'Has clear features from two or more different types that do not fit one diagnosis',
    types: { mixed: 'core' },
    evidence:
      'Overlapping symptom domains suggest more than one process. Reinforced by the pooled autopsy data: 91% of 2,695 brains in six community cohorts carried more than one of six key pathologies, and 41% carried three or more.',
  },
  {
    id: 'mixed7',
    category: 'Onset & Progression',
    kind: 'finding',
    text: 'A brain scan showed BOTH shrinkage/atrophy AND vascular damage (white matter disease or old strokes)',
    types: { mixed: 'core', vascular: 'supportive' },
    evidence:
      'Imaging evidence of combined degenerative and cerebrovascular pathology. VASCOG 2014 treats neuroimaging as critical, noting that absence of imaging causes significant diagnostic inaccuracy by missing silent infarcts and white-matter lesions.',
  },
];

// Items retained in the ~3 minute short screen.
export const quickSymptoms = globalSymptoms.filter((s) => s.quick);

export const categories = [...new Set(globalSymptoms.map((s) => s.category))];

export const symptomById = Object.fromEntries(globalSymptoms.map((s) => [s.id, s]));

// ------------------------------------------------------------------
// REMOVED ITEMS -- kept here as a record of why, so the decisions are not
// silently re-introduced later.
//
//  mixed3   "multiple cardiovascular risk factors AND memory symptoms"
//           Duplicated the hypertension/diabetes/cholesterol/heart-disease
//           checkboxes already collected in Medical History, letting one
//           clinical fact score twice.
//
//  mixed6   "stroke or TIA AND gradual progressive memory decline"
//           Exactly the conjunction of mov6 and onset2, both of which are
//           scored individually. Triple-counted a single history.
//
//  mixed8   "memory worsened after a stroke or cardiac event"
//           Folded into mov6, which now carries the VASCOG three-month clause
//           and scores for both vascular and mixed.
//
//  mixed9   "symptoms span multiple categories that don't fit neatly"
//           Vague restatement of mixed5.
//
//  mixed10  "Age 80+"
//           The underlying claim was if anything understated -- mixed pathology
//           is near-universal past 80. That is precisely why it is useless as a
//           DISCRIMINATOR: a near-universal finding carries almost no
//           information, and scoring it added a point to Mixed for every older
//           adult assessed. Age now informs the base-rate note instead.
//
//  "or known cardiovascular disease" (was part of mov6)
//           Split out. A documented stroke with persistent decline is a VASCOG
//           diagnostic criterion; having treated hypertension is a risk factor.
//           Collapsing them into one checkbox gave a risk factor the weight of
//           a diagnostic criterion.
//
//  mem9     "Memory is clearly the main problem, it began after about age 80,
//           AND it has crept along more slowly than expected"
//           Three independent LATE criteria behind one checkbox. A person aged
//           82 with memory-predominant but FAST decline could only overclaim
//           all three or lose all three -- and this was the sole item
//           separating LATE from Alzheimer's. Replaced by mem10 (memory
//           predominant, others spared), mem11 (slow course) and onset8 (onset
//           after 80). Migration expands a checked mem9 into all three, because
//           checking a conjunction asserts every conjunct.
// ------------------------------------------------------------------
