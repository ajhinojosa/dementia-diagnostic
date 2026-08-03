// ============================================
// RED FLAGS AND REVERSIBLE MIMICS
// ============================================
//
// The original tool had no equivalent of this at all. It went straight to
// "which of these five incurable diseases is it?" without first asking whether
// the cause might be something treatable.
//
// That is the wrong order. The AAN practice parameter recommends screening for
// depression, vitamin B12 deficiency and hypothyroidism, plus structural
// neuroimaging, precisely because these are the situations where the answer
// changes what happens next. Delirium in particular is a medical emergency and
// should be excluded before any dementia subtype discussion.
//
// These items deliberately do NOT feed the subtype scoring. They are a
// separate channel: mixing "this might be a UTI" into a Lewy-versus-Alzheimer's
// comparison would be a category error.

export const RED_FLAG_URGENCY = {
  urgent: {
    label: 'Discuss urgently',
    color: '#B3261E',
    background: '#FEF4F3',
    note: 'Worth raising with a doctor promptly rather than waiting for a routine appointment.',
  },
  important: {
    label: 'Raise at the next appointment',
    color: '#8B6914',
    background: '#FFFEF5',
    note: 'Worth making sure the clinical team has specifically considered this.',
  },
};

export const redFlags = [
  {
    id: 'rf_delirium',
    urgency: 'urgent',
    quick: true,
    title: 'Confusion arrived over hours or days, not months',
    text: 'The confusion came on over hours or days, or swings wildly between one day and the next — especially around a new infection, a new medication, dehydration, a fall or a hospital stay.',
    means: 'This pattern suggests delirium rather than dementia.',
    action:
      'Delirium is treated as a medical emergency and is often reversible. It also frequently sits on top of an existing dementia. A same-day medical assessment is the usual advice — do not wait for a memory-clinic referral.',
  },
  {
    id: 'rf_rapid',
    urgency: 'urgent',
    quick: true,
    title: 'Getting worse over weeks, not years',
    text: 'There has been a clear, steady decline over weeks to a couple of months.',
    means:
      'Ordinary neurodegenerative dementia does not usually move this fast. Rapidly progressive causes need a different and more urgent workup.',
    action:
      'This warrants prompt specialist assessment rather than watchful waiting.',
  },
  {
    id: 'rf_neuro',
    urgency: 'urgent',
    title: 'New neurological symptoms',
    text: 'New seizures, severe or unfamiliar headaches, sudden one-sided weakness, or sudden loss of vision or speech.',
    means: 'These point to something acute rather than a slow degenerative process.',
    action: 'Sudden weakness or speech loss is a stroke until proven otherwise — emergency assessment.',
  },
  {
    id: 'rf_depression',
    urgency: 'important',
    quick: true,
    title: 'Low mood came first, or arrived alongside',
    text: 'Low mood, loss of interest, disturbed sleep or appetite began before or at the same time as the memory complaints. They often answer questions with "I don’t know" rather than guessing, and they are more distressed about their memory than the people around them are.',
    means:
      'Depression can produce cognitive symptoms severe enough to look like dementia — historically called pseudodementia. It also commonly coexists with genuine dementia.',
    action:
      'Depression is treatable, and treating it can substantially improve cognition. The AAN practice parameter recommends screening for it as part of any dementia assessment. The "I don’t know" pattern is a useful clue: people with Alzheimer’s more often confabulate an answer.',
  },
  {
    id: 'rf_nph',
    urgency: 'important',
    quick: true,
    title: 'Walking changed first, then bladder, then thinking',
    text: 'Walking difficulty came first — a wide-based, shuffling, "magnetic" gait as though the feet are stuck — followed by urinary urgency, with thinking changes arriving last.',
    means:
      'That particular ordering suggests normal pressure hydrocephalus (NPH), a build-up of cerebrospinal fluid.',
    action:
      'NPH is one of the few genuinely treatable causes, via a shunt, and is frequently overlooked. Ordering matters: in vascular disease and Lewy body dementia the gait change usually comes with or after the cognitive change, not clearly before it.',
  },
  {
    id: 'rf_meds',
    urgency: 'important',
    quick: true,
    title: 'On medications that can cloud thinking',
    text: 'Currently taking bladder medications, older antihistamines, sleep aids, benzodiazepines, opioids, some antidepressants, or several sedating medications at once.',
    means:
      'Anticholinergic and sedative burden is a common and reversible contributor to cognitive impairment, particularly in older adults.',
    action:
      'A pharmacist-led or GP medication review is low-risk and sometimes produces a striking improvement. Bring a complete list including anything bought over the counter.',
  },
  {
    id: 'rf_bloods',
    urgency: 'important',
    quick: true,
    title: 'Basic blood tests and a brain scan have not been done',
    text: 'There has been no recent test of vitamin B12, thyroid function (TSH), or a CT or MRI brain scan.',
    means:
      'B12 deficiency and hypothyroidism both cause treatable cognitive impairment. Imaging identifies strokes, white-matter disease, hydrocephalus and, occasionally, a tumour.',
    action:
      'The AAN practice parameter recommends screening for depression, B12 deficiency and hypothyroidism, plus structural neuroimaging. VASCOG notes that skipping imaging causes significant diagnostic inaccuracy by missing silent infarcts and white-matter lesions.',
  },
  {
    id: 'rf_alcohol',
    urgency: 'important',
    title: 'Heavy or prolonged alcohol use, or poor nutrition',
    text: 'A history of heavy or long-term drinking, or a period of significantly poor nutrition.',
    means:
      'Alcohol-related brain damage and thiamine deficiency both cause cognitive impairment that can be partly reversible if caught and treated.',
    action:
      'Worth stating explicitly to the clinical team, since it changes both the tests ordered and the treatment offered.',
  },
  {
    id: 'rf_head',
    urgency: 'important',
    title: 'Head injury',
    text: 'A head injury with loss of consciousness, a fall causing a head strike (particularly while on blood thinners), or repeated head impacts over the years.',
    means:
      'A subdural haematoma can build slowly over weeks and present as confusion. Repeated impacts carry their own longer-term risk.',
    action:
      'A recent head strike on anticoagulants merits prompt imaging — a slow bleed is treatable but only if it is found.',
  },
  {
    id: 'rf_sleepapnoea',
    urgency: 'important',
    title: 'Heavy snoring with pauses in breathing',
    text: 'Loud snoring, gasping, or witnessed pauses in breathing during sleep, along with unrefreshing sleep and daytime sleepiness.',
    means: 'Untreated obstructive sleep apnoea impairs attention and memory, and is treatable.',
    action:
      'Worth distinguishing from the excessive daytime sleepiness seen in Lewy body dementia, which has a different cause and different management.',
  },
];

export const quickRedFlags = redFlags.filter((f) => f.quick);
