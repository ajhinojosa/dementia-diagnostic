// ============================================
// ITEM KINDS AND THEIR MODIFIERS
// ============================================
//
// The original tool attached the same three dropdowns (Onset / Frequency /
// Severity) to every item. That works for a recurring event like "sees people
// who aren't there", but produces nonsense for the other five kinds of item in
// the list:
//
//   - "History of stroke"          -> "How often?" / "Severity?"
//   - "Cannot learn new information" -> "How often?" (it is a constant state)
//   - "Progressed gradually over years" -> "When did you notice it?" (circular:
//                                          the item IS an onset statement)
//   - "MRI showed atrophy"         -> "How often?"
//   - "Age 80+"                    -> all three
//
// Each item now declares a kind, and the row renders only the modifiers that
// can be answered sensibly, worded for that kind.

export const MODIFIER_DEFS = {
  firstNoticed: {
    label: 'First noticed',
    help: 'When did someone first notice this — not when it got bad.',
    options: [
      { value: 'm1', label: 'Within the last month' },
      { value: 'm3', label: '1–3 months ago' },
      { value: 'm6', label: '3–6 months ago' },
      { value: 'y1', label: '6–12 months ago' },
      { value: 'y2', label: '1–2 years ago' },
      { value: 'y3', label: '2–3 years ago' },
      { value: 'y5', label: '3–5 years ago' },
      { value: 'y5plus', label: 'More than 5 years ago' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },

  // Only offered for `episodic` items — things that happen and then stop.
  // Deliberately non-overlapping, unlike the original scale where "Daily" and
  // "Constantly" both applied to the same situation.
  frequency: {
    label: 'How often',
    help: 'Roughly how often does it happen now?',
    options: [
      { value: 'rare', label: 'Less than monthly' },
      { value: 'monthly', label: 'About monthly' },
      { value: 'weekly', label: 'About weekly' },
      { value: 'most_days', label: 'Most days' },
      { value: 'daily_many', label: 'Several times a day' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },

  // There are TWO different questions hiding under the word "impact", and using
  // one option set for both produced nonsense.
  //
  // For an ABILITY the question is how much help is needed. That works for
  // "cannot manage finances". It is meaningless for apathy -- help them do
  // what? -- and for reckless spending, which is not a task anyone assists with.
  //
  // For a BEHAVIOUR or an experienced symptom the question is what it has
  // actually led to. "Prevents the activity" says nothing about loss of drive;
  // "has caused financial loss" is exactly right for money given to a scam.
  //
  // Both replace the original unanchored Mild / Moderate / Severe, which two
  // carers rating the same person would apply differently.
  impactAbility: {
    label: 'Help needed',
    help: 'How much help do they need with this?',
    options: [
      { value: 'none', label: 'None — just noticeable' },
      { value: 'reminders', label: 'Reminders or a workaround' },
      { value: 'handson', label: 'Hands-on help each time' },
      { value: 'cannot', label: 'Cannot do it at all now' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },

  impactConsequence: {
    label: 'Consequences',
    help: 'What has this actually led to?',
    options: [
      { value: 'none', label: 'Nothing much so far' },
      { value: 'upsetting', label: 'Upsetting or disruptive' },
      { value: 'supervision', label: 'Someone has to step in or supervise' },
      { value: 'harm', label: 'Has caused harm, loss or danger' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },

  // For `deficit` items, direction of travel is the clinically useful third
  // axis — "how often" is meaningless for a constant state, but whether it is
  // stable or accelerating genuinely changes what a clinician does next.
  trend: {
    label: 'Direction',
    help: 'Compared with 6 months ago.',
    options: [
      { value: 'better', label: 'Better than it was' },
      { value: 'stable', label: 'About the same' },
      { value: 'slow_worse', label: 'Slowly getting worse' },
      { value: 'fast_worse', label: 'Quickly getting worse' },
      { value: 'fluctuates', label: 'Comes and goes' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },

  // For one-off past events. Coarser buckets than firstNoticed, because people
  // recall "about five years ago" far better than a specific month.
  whenHappened: {
    label: 'When did this happen',
    help: 'Roughly when did the event occur?',
    options: [
      { value: 'm6', label: 'Within the last 6 months' },
      { value: 'y1', label: '6–12 months ago' },
      { value: 'y3', label: '1–3 years ago' },
      { value: 'y10', label: '3–10 years ago' },
      { value: 'y10plus', label: 'More than 10 years ago' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },

  reportedBy: {
    label: 'Source',
    help: 'How do you know this?',
    options: [
      { value: 'report', label: 'I have seen the written report' },
      { value: 'told', label: 'A doctor told us' },
      { value: 'recall', label: 'Going from memory' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },
};

export const ITEM_KINDS = {
  // Recurring, countable events. All three classic axes apply.
  episodic: {
    label: 'Recurring',
    modifiers: ['firstNoticed', 'frequency', 'impact'],
    hint: 'Something that happens on separate occasions.',
  },

  // A persistent state or lost ability. "How often" is meaningless; direction
  // of travel replaces it.
  deficit: {
    label: 'Ongoing',
    modifiers: ['firstNoticed', 'impact', 'trend'],
    hint: 'An ongoing difficulty rather than separate episodes.',
  },

  // A discrete thing that happened once. Only the date is meaningful.
  event: {
    label: 'Past event',
    modifiers: ['whenHappened'],
    hint: 'A one-off event in the past.',
  },

  // The item is itself a statement about onset or course. Asking for an onset
  // date would be circular, and frequency/severity do not apply at all.
  course: {
    label: 'Pattern over time',
    modifiers: [],
    hint: 'This describes the overall pattern, so it needs no extra detail.',
  },

  // A test or imaging result.
  finding: {
    label: 'Test result',
    modifiers: ['whenHappened', 'reportedBy'],
    hint: 'A result from a scan or test.',
  },

  // Background facts (age, age at onset). Scored, but no modifiers make sense.
  context: {
    label: 'Background',
    modifiers: [],
    hint: 'Background information rather than a symptom.',
  },
};

// `impact` is a SLOT, not a modifier. Which option set fills it depends on
// whether the item describes something the person can no longer do, or
// something that happens and has consequences.
//
// Rule: every `episodic` item takes the consequence scale, because a recurring
// event is never an ability. `deficit` items default to the ability scale and
// opt into consequence via `scale: 'consequence'` on the item.
export const resolveImpactKey = (symptom) => {
  if (symptom.scale === 'consequence') return 'impactConsequence';
  if (symptom.scale === 'ability') return 'impactAbility';
  return symptom.kind === 'episodic' ? 'impactConsequence' : 'impactAbility';
};

export const getModifiersForKind = (kind) => ITEM_KINDS[kind]?.modifiers ?? [];

// Resolved modifier keys for a specific item. Use this in the UI; the
// kind-only version above is for checks that do not have an item to hand.
export const getModifiersFor = (symptom) =>
  getModifiersForKind(symptom.kind).map((m) => (m === 'impact' ? resolveImpactKey(symptom) : m));

// Human-readable value lookup, used by the printable report.
export const modifierLabel = (modifierKey, value) => {
  if (!value) return null;
  const def = MODIFIER_DEFS[modifierKey];
  if (!def) return null;
  return def.options.find((o) => o.value === value)?.label ?? null;
};

// Values across BOTH impact scales that indicate real functional loss, used by
// the staging estimate so it does not have to know which scale an item used.
export const IMPACT_SEVERE = new Set(['cannot', 'harm']);
export const IMPACT_MODERATE = new Set(['handson', 'supervision']);

// Reads whichever impact scale an entry actually used, so consumers (staging,
// the report) do not have to know which one applied to a given item.
export const impactValueOf = (entry) => entry?.impactAbility ?? entry?.impactConsequence ?? '';
