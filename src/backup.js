// ============================================
// EXPORT / IMPORT
// ============================================
//
// Until now the only copy of an assessment lived in one localStorage key on one
// browser on one device. That is a single point of failure with no undo: a
// cleared browser, a new laptop, or a stray write and months of observations are
// gone, with nothing to restore from. (That last one is not hypothetical -- it
// is why this file exists.)
//
// Export alone would not fix it. A backup you cannot restore is just a file, so
// import is part of the same feature. Imported data is run through the SAME
// migration as localStorage, which means an export taken from an older version
// still loads correctly rather than half-loading with fields silently dropped.

import { migrateSavedData, SCHEMA_VERSION } from './migrate.js';

export const EXPORT_KIND = 'dementia-assessment';

/**
 * Everything needed to reconstruct an assessment. Deliberately the same shape
 * as the localStorage record plus provenance, so the two cannot drift.
 */
export function buildExport({ symptomData, medicalHistory, adlData, redFlagData, mode }) {
  return {
    kind: EXPORT_KIND,
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    symptomData,
    medicalHistory,
    adlData,
    redFlagData,
    mode,
  };
}

/**
 * Filenames people can tell apart six months later, when there may be several.
 * Falls back to the date alone if no name was entered.
 */
export function exportFilename(medicalHistory = {}) {
  const date = new Date().toISOString().slice(0, 10);
  const name = (medicalHistory.patientName || '').trim();
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return slug ? `dementia-assessment-${slug}-${date}.json` : `dementia-assessment-${date}.json`;
}

/**
 * Validate and normalise an imported file.
 *
 * Returns { ok: true, data, summary } or { ok: false, error }. Never throws, so
 * a mistyped file produces a message rather than a blank screen.
 */
export function parseImport(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not valid JSON. Pick a file exported from this tool.' };
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'That file does not contain an assessment.' };
  }

  // `kind` only exists on files exported after this feature was added. Records
  // recovered by hand from localStorage will not have it, and should still
  // import -- so its absence is accepted as long as the shape is right.
  if (raw.kind && raw.kind !== EXPORT_KIND) {
    return { ok: false, error: `That file is a "${raw.kind}" file, not a dementia assessment.` };
  }

  if (!raw.symptomData || typeof raw.symptomData !== 'object') {
    return { ok: false, error: 'That file has no symptom data in it.' };
  }

  // Same migration as localStorage, so an older export loads correctly instead
  // of half-loading with unrecognised fields dropped in silence.
  const data = migrateSavedData(raw);

  const requested = Object.keys(raw.symptomData).length;
  const kept = Object.keys(data.symptomData).length;

  return {
    ok: true,
    data,
    summary: {
      symptoms: kept,
      // Items removed in a later revision are dropped by the migration. Saying
      // so is better than silently importing fewer than the file contained.
      dropped: requested - kept,
      redFlags: Object.values(data.redFlagData ?? {}).filter((v) => v === 'yes').length,
      adls: Object.keys(data.adlData ?? {}).length,
      patientName: data.medicalHistory?.patientName || '',
      exportedAt: raw.exportedAt || null,
      fromVersion: raw.version ?? 1,
      upgraded: (raw.version ?? 1) !== SCHEMA_VERSION,
    },
  };
}

/**
 * Trigger a download. Kept here rather than inline so the component stays
 * declarative and this can be exercised in isolation.
 */
export function downloadJSON(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoked on the next tick so Safari has finished reading the blob.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
