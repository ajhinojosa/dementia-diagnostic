import React, { useLayoutEffect, useRef, useState } from 'react';

import { getModifiersFor, modifierLabel } from '../data/itemKinds.js';
import { RED_FLAG_URGENCY } from '../data/redFlags.js';
import {
  PatternAnalysis,
  ProfileChart,
  DistinguishingAnswers,
  PROFILE_CHART_CAPTION,
  sectionHeading,
} from './AnalysisPanels.jsx';

// ============================================
// ONE-PAGE SUMMARY
// ============================================
//
// The colourful screen view -- pattern analysis, profile chart and the answers
// doing most of the separating -- on a single sheet to hand across a desk. The
// full printable report is still the record; this is the glance.
//
// "One page" is enforced rather than hoped for: the sheet is laid out at a
// fixed print width, its natural height is measured, and if it would spill
// onto a second page the printed copy is zoomed down to fit. Eight types with
// counter-evidence and a long criteria list can run tall; a summary that breaks
// across two sheets is not a summary.

const SANS = "'DM Sans', sans-serif";

// The sheet is formatted as US Letter: 8.5 x 11in with a 0.4in inner margin,
// so the content area is 7.7 x 10.2in. In CSS px (96/in), less a little slack
// for rounding.
const PRINTABLE_HEIGHT_PX = (11 - 0.8) * 96 - 12;

const detailLine = (symptom, entry) =>
  getModifiersFor(symptom)
    .map((key) => modifierLabel(key, entry?.[key]))
    .filter((v) => v && v !== 'Not sure')
    .join(' · ');

export default function OnePageSummary({
  onBack,
  medicalHistory,
  mode,
  checkedCount,
  scores,
  sortedTypes,
  leadingType,
  confidence,
  ranking,
  unexplored,
  answers,
  activeSymptoms,
  symptomData,
  flaggedRedFlags,
  safetyFlags,
}) {
  const sheetRef = useRef(null);
  const [fitScale, setFitScale] = useState(1);

  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    // Measure only the on-screen layout. Under print media the zoom itself
    // shrinks the sheet, so re-measuring there would feed the scale back into
    // its own input and oscillate.
    const printing = window.matchMedia('print');
    const measure = () => {
      if (printing.matches) return;
      const h = el.scrollHeight;
      setFitScale(h > PRINTABLE_HEIGHT_PX ? PRINTABLE_HEIGHT_PX / h : 1);
    };
    measure();
    // Webfonts land after first paint and change line wrapping.
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const details = Object.fromEntries(
    answers.map((a) => {
      const symptom = activeSymptoms.find((s) => s.id === a.id);
      return [a.id, symptom ? detailLine(symptom, symptomData[a.id]) : ''];
    })
  );

  const who = [
    medicalHistory.patientName,
    medicalHistory.patientAge && `age ${medicalHistory.patientAge}`,
  ].filter(Boolean).join(', ');

  return (
    <div className="summary-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600&family=DM+Sans:wght@400;500;600;700&display=swap');
        /* Letter, full-bleed: the sheet supplies its own 0.4in margin so the
           cream page prints edge to edge and browser headers/footers (which
           live in the @page margin) do not appear. */
        @page { size: letter; margin: 0; }
        .summary-root {
          min-height: 100vh;
          background: #ECE8E1;
          padding: 72px 16px 40px;
        }
        .summary-sheet {
          width: 8.5in;
          min-height: 11in;
          max-width: 100%;
          margin: 0 auto;
          padding: 0.4in;
          box-sizing: border-box;
          background: #FAF7F2;
          box-shadow: 0 6px 24px rgba(0,0,0,0.12);
          color: #2D2A26;
        }
        .summary-card {
          background: white;
          border-radius: 10px;
          border: 1px solid #ECE8E1;
          padding: 12px 14px;
        }
        .summary-root .score-bar {
          height: 7px;
          border-radius: 4px;
          background: #F0EDE8;
          overflow: hidden;
        }
        .summary-root .score-fill { height: 100%; border-radius: 4px; }
        .summary-controls {
          position: fixed;
          top: 16px;
          right: 16px;
          display: flex;
          gap: 10px;
          z-index: 1000;
        }
        .summary-controls button {
          padding: 10px 20px;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-family: ${SANS};
        }
        @media print {
          html, body { background: white !important; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .summary-controls, .summary-fit-note { display: none !important; }
          .summary-root { padding: 0; background: white; min-height: 0; }
          .summary-sheet {
            width: 8.5in;
            height: 11in;
            max-width: none;
            overflow: hidden;
            box-shadow: none;
            margin: 0;
          }
          .summary-content { zoom: var(--fit-scale, 1); }
          .summary-card, .pattern-row, .answer-row { break-inside: avoid; }
        }
      `}</style>

      <div className="summary-controls">
        <button onClick={() => window.print()} style={{ background: '#3D7A5A' }}>
          🖨️ Print / Save as PDF
        </button>
        <button onClick={onBack} style={{ background: '#6B6660' }}>
          ← Back to Tool
        </button>
      </div>

      <div className="summary-sheet">
        <div ref={sheetRef} className="summary-content" style={{ '--fit-scale': fitScale }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '12px',
            flexWrap: 'wrap',
            borderBottom: '2px solid #2D2A26',
            paddingBottom: '8px',
            marginBottom: '12px'
          }}>
            <div>
              <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '22px', fontWeight: '600', margin: 0, lineHeight: 1.15 }}>
                Dementia Symptom Pattern — Summary
              </h1>
              <p style={{ fontFamily: SANS, fontSize: '11px', color: '#6B6660', margin: '2px 0 0 0' }}>
                {who || 'Patient: ____________________'}
                {medicalHistory.caregiverName && ` • Recorded by ${medicalHistory.caregiverName}`}
                {medicalHistory.caregiverRelation && ` (${medicalHistory.caregiverRelation})`}
              </p>
            </div>
            <p style={{ fontFamily: SANS, fontSize: '11px', color: '#6B6660', margin: 0, textAlign: 'right' }}>
              {new Date().toLocaleDateString()}<br />
              {mode === 'quick' ? 'Quick screen' : 'Full assessment'} • {checkedCount} observation{checkedCount === 1 ? '' : 's'}
            </p>
          </div>

          {/* Red flags and safety flags outrank the subtype comparison, so they
              sit above it here exactly as they do in the full report. */}
          {flaggedRedFlags.length > 0 && (
            <div className="summary-card" style={{ borderLeft: '4px solid #B3261E', background: '#FDF6F5', marginBottom: '10px', padding: '8px 12px' }}>
              <p style={{ fontFamily: SANS, fontSize: '11.5px', margin: 0, color: '#5C2A27', lineHeight: 1.45 }}>
                <strong style={{ color: '#8C1D18' }}>Flagged for clinical attention first: </strong>
                {flaggedRedFlags.map((f, i) => (
                  <span key={f.id}>
                    {i > 0 && '; '}
                    {f.title}{' '}
                    <span style={{ color: RED_FLAG_URGENCY[f.urgency].color }}>({RED_FLAG_URGENCY[f.urgency].label})</span>
                  </span>
                ))}
                . These may be treatable or urgent, and matter more than which subtype fits best.
              </p>
            </div>
          )}
          {safetyFlags.map((flag) => (
            <div key={flag.id} className="summary-card" style={{ borderLeft: '4px solid #D4A017', background: '#FFFEF5', marginBottom: '10px', padding: '8px 12px' }}>
              <p style={{ fontFamily: SANS, fontSize: '11.5px', margin: 0, color: '#5C5550', lineHeight: 1.45 }}>
                <strong style={{ color: '#8B6914' }}>⚠️ {flag.title}: </strong>{flag.body}
              </p>
            </div>
          ))}

          <div className="summary-card" style={{ marginBottom: '10px' }}>
            <PatternAnalysis
              scores={scores}
              sortedTypes={sortedTypes}
              leadingType={leadingType}
              confidence={confidence}
              ranking={ranking}
              unexplored={unexplored}
              compact
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '3fr 4fr', gap: '10px', alignItems: 'stretch' }}>
            <div className="summary-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ ...sectionHeading, marginBottom: '4px' }}>Subtype Profile Chart</h3>
              <div style={{ display: 'flex', justifyContent: 'center', flex: 1, alignItems: 'center' }}>
                <ProfileChart scores={scores} width={290} />
              </div>
              <p style={{ fontFamily: SANS, fontSize: '9.5px', color: '#8B8680', textAlign: 'center', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                {PROFILE_CHART_CAPTION}
              </p>
            </div>

            <div className="summary-card">
              <h3 style={{ ...sectionHeading, marginBottom: '3px' }}>Top Distinguishing Answers</h3>
              <p style={{ fontFamily: SANS, fontSize: '9.5px', color: '#8B8680', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                Recorded observations that most separate one subtype from the others. Filled tag = core criterion,
                tinted = supportive.
              </p>
              <DistinguishingAnswers answers={answers} details={details} />
            </div>
          </div>

          <p style={{
            fontFamily: SANS,
            fontSize: '9.5px',
            color: '#6B6660',
            margin: '10px 0 0 0',
            paddingTop: '6px',
            borderTop: '1px solid #E0DCD5',
            lineHeight: 1.45
          }}>
            A carer-recorded symptom pattern prepared for discussion with a clinician. It is not a diagnosis and cannot rule
            any cause in or out. The tool's Red Flags checklist of treatable and urgent causes should be worked through
            whatever the pattern shows.
          </p>
        </div>
      </div>

      {fitScale < 1 && (
        <p className="summary-fit-note" style={{ fontFamily: SANS, fontSize: '11px', color: '#6B6660', textAlign: 'center', marginTop: '10px' }}>
          This summary is a little long, so it will be printed at {Math.round(fitScale * 100)}% to stay on one page.
        </p>
      )}
    </div>
  );
}
