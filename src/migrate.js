// ============================================
// SAVED-DATA MIGRATION
// ============================================
//
// Anyone who used the previous version has a localStorage record shaped
// { checked, onset, frequency, severity } keyed by symptom id. Several of those
// ids no longer exist, the modifier keys were renamed, and the option values
// changed. Without a migration, returning users would silently lose the detail
// they filled in -- which for a caregiver tracking someone over months is the
// worst possible failure.

import { symptomById } from './data/symptoms.js';
import { getModifiersFor, resolveImpactKey } from './data/itemKinds.js';

export const STORAGE_KEY = 'dementiaAssessmentData';
export const SCHEMA_VERSION = 4;

// v3 -> v4 retired mem9, a single checkbox reading "Memory is clearly the main
// problem, it began after about age 80, AND it has crept along more slowly than
// expected". Checking a conjunction is an assertion of every conjunct, so a
// checked mem9 expands into all three replacements rather than being dropped or
// arbitrarily assigned to one of them. Modifier values are copied to each.
const SPLIT_ITEMS = {
  mem9: ['mem10', 'mem11', 'onset8'],
};

const ONSET_MAP = {
  '1month': 'm1',
  '3months': 'm3',
  '6months': 'm6',
  '1year': 'y1',
  '2years': 'y2',
  '3years': 'y3',
  older: 'y5plus',
};

// The old frequency scale had overlapping buckets ("Daily" and "Constantly"
// both described the same situation). Mapped to the nearest non-overlapping
// bucket rather than inventing precision that was never captured.
const FREQUENCY_MAP = {
  rarely: 'monthly',
  sometimes: 'weekly',
  often: 'most_days',
  daily: 'most_days',
  constant: 'daily_many',
};

// Old severity was unanchored, and the first revision's single `impact` scale
// was task-shaped even for behaviours. Both are mapped onto whichever of the two
// current scales now applies to the item. The mapping is necessarily
// approximate, which is itself the argument for anchored scales.
const SEVERITY_TO_ABILITY = { mild: 'none', moderate: 'reminders', severe: 'handson' };
const SEVERITY_TO_CONSEQUENCE = { mild: 'none', moderate: 'upsetting', severe: 'supervision' };

// v2 `impact` values -> the two v3 scales.
const IMPACT_TO_ABILITY = {
  noticeable: 'none', workaround: 'reminders', assistance: 'handson', prevents: 'cannot',
};
const IMPACT_TO_CONSEQUENCE = {
  noticeable: 'none', workaround: 'upsetting', assistance: 'supervision', prevents: 'harm',
};

function migrateSymptomEntry(id, entry) {
  const symptom = symptomById[id];
  // Drop entries for items removed in the rewrite (mixed3/6/8/9/10 and the
  // old combined stroke-or-cardiovascular-disease item).
  if (!symptom || !entry?.checked) return null;

  const allowed = new Set(getModifiersFor(symptom));
  const impactKey = resolveImpactKey(symptom);
  const isAbility = impactKey === 'impactAbility';
  const next = { checked: true };

  const carry = (key, value) => {
    if (value && allowed.has(key)) next[key] = value;
  };

  carry('firstNoticed', entry.firstNoticed ?? ONSET_MAP[entry.onset]);
  carry('frequency', entry.frequency in FREQUENCY_MAP ? FREQUENCY_MAP[entry.frequency] : entry.frequency);
  // Accepts v1 (`severity`), v2 (`impact`) and v3 (already-scaled) shapes.
  const priorImpact =
    entry[impactKey] ??
    (isAbility ? IMPACT_TO_ABILITY[entry.impact] : IMPACT_TO_CONSEQUENCE[entry.impact]) ??
    (isAbility ? SEVERITY_TO_ABILITY[entry.severity] : SEVERITY_TO_CONSEQUENCE[entry.severity]);
  carry(impactKey, priorImpact);
  carry('trend', entry.trend);
  // A past event's date was previously recorded in the onset field, since that
  // was the only date field available.
  carry('whenHappened', entry.whenHappened ?? ONSET_MAP[entry.onset]);
  carry('reportedBy', entry.reportedBy);

  return next;
}

export function migrateSavedData(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;

  const source = Object.entries(parsed.symptomData ?? {});
  const symptomData = {};

  // Pass 1: expand retired compound items into their replacements.
  const derived = new Set();
  for (const [id, entry] of source) {
    for (const targetId of SPLIT_ITEMS[id] ?? []) {
      const migrated = migrateSymptomEntry(targetId, entry);
      if (migrated) {
        symptomData[targetId] = migrated;
        derived.add(targetId);
      }
    }
  }

  // Pass 2: anything the file answers directly is authoritative, whatever the
  // key order. A derived value is an inference from a retired question; a
  // direct answer is what the user actually said, so it wins -- including when
  // it says "not reported", which must clear the inference rather than lose to
  // it.
  for (const [id, entry] of source) {
    if (SPLIT_ITEMS[id]) continue;
    const migrated = migrateSymptomEntry(id, entry);
    if (migrated) symptomData[id] = migrated;
    else if (derived.has(id)) delete symptomData[id];
  }

  return {
    version: SCHEMA_VERSION,
    symptomData,
    medicalHistory: parsed.medicalHistory ?? {},
    adlData: parsed.adlData ?? {},
    redFlagData: parsed.redFlagData ?? {},
    mode: parsed.mode === 'quick' ? 'quick' : 'full',
    savedAt: parsed.savedAt ?? null,
    migratedFrom: parsed.version === SCHEMA_VERSION ? null : (parsed.version ?? 1),
  };
}

export function loadSavedData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrateSavedData(JSON.parse(raw));
  } catch (error) {
    console.error('Could not read saved assessment:', error);
    return null;
  }
}
