import React from 'react';

import { dementiaTypes } from '../data/dementiaTypes.js';

// ============================================
// ANALYSIS PANELS
// ============================================
//
// Shared by the Symptoms tab and the one-page summary, so the printed page
// shows exactly what the screen shows. Two copies of this markup would drift --
// the ranking rules have been reworked twice already, and a printout that lags
// the screen is a printout that tells a clinician something the tool no longer
// believes.
//
// Both rely on the `.score-bar` / `.score-fill` classes, which each host page
// defines in its own <style> block.

const SANS = "'DM Sans', sans-serif";

export const sectionHeading = {
  fontFamily: SANS,
  fontSize: '12px',
  color: '#6B6660',
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  fontWeight: '600',
};

/**
 * Pattern analysis.
 * Three things the previous version did not do: state how much to trust the
 * ordering, show the prevalence adjustment rather than applying it silently,
 * and surface evidence that argues AGAINST a type instead of only evidence for
 * it.
 *
 * `headerExtra` renders beside the confidence chip (the screen puts the
 * one-page-summary button there). `compact` tightens spacing for print.
 */
export function PatternAnalysis({
  scores,
  sortedTypes,
  leadingType,
  confidence,
  ranking,
  unexplored,
  headerExtra = null,
  compact = false,
}) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: compact ? '6px' : '10px' }}>
        <h3 style={sectionHeading}>Pattern Analysis</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {headerExtra}
          <span style={{
            fontFamily: SANS,
            fontSize: '11px',
            fontWeight: '600',
            padding: '2px 8px',
            borderRadius: '10px',
            color: ['clear', 'moderate'].includes(confidence.level) ? '#2C5B43' : '#8B6914',
            background: ['clear', 'moderate'].includes(confidence.level) ? '#EDF5F0' : '#FFFBEF'
          }}>
            {confidence.label}
          </span>
        </div>
      </div>

      <p style={{
        fontFamily: SANS,
        fontSize: '12px',
        color: '#6B6660',
        margin: compact ? '0 0 8px 0' : '0 0 14px 0',
        lineHeight: '1.5'
      }}>
        {confidence.reason}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '7px' : '14px' }}>
        {sortedTypes.filter(type => scores[type].total > 0).map(type => {
          const score = scores[type];
          const info = dementiaTypes[type];
          const isLeader = leadingType === type;
          return (
            <div key={type} className="pattern-row" style={{
              padding: isLeader ? (compact ? '7px 10px' : '10px 12px') : '0',
              borderRadius: '8px',
              background: isLeader ? `${info.color}0D` : 'transparent',
              border: isLeader ? `1px solid ${info.color}33` : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: compact ? '3px' : '4px', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: SANS, fontSize: '13px', fontWeight: '600', color: info.color }}>
                  {info.name}
                  {isLeader && <span style={{ fontSize: '10px', marginLeft: '6px', color: '#8B8680', fontWeight: '500' }}>closest fit</span>}
                </span>
                <span style={{ fontFamily: SANS, fontSize: '11px', color: '#8B8680' }}>
                  <span style={{ fontWeight: '600', color: info.color }}>{Math.round(score.profileMatch)}%</span> profile match
                  {score.maxCore > 0 && <> • {score.core}/{score.maxCore} core criteria</>}
                </span>
              </div>
              <div className="score-bar">
                <div className="score-fill" style={{ width: `${score.profileMatch}%`, background: info.color }} />
              </div>
              {/* The published threshold, stated rather than folded into the
                  number. "2 of 4 core features" is a rule a clinician can check;
                  a percentage is not. */}
              {score.meetsThreshold && (
                <div style={{
                  fontFamily: SANS,
                  fontSize: '11px',
                  color: info.color,
                  marginTop: compact ? '3px' : '5px',
                  fontWeight: '600'
                }}>
                  Meets {score.criteria.thresholdLabel}
                </div>
              )}
              {isLeader && score.criteria?.available?.length > 0 && (
                <div style={{
                  fontFamily: SANS,
                  fontSize: '11px',
                  color: '#8B8680',
                  marginTop: compact ? '3px' : '5px',
                  lineHeight: compact ? '1.4' : '1.5'
                }}>
                  {score.criteria.available.map((f) => (
                    <div key={f.id}>
                      <span style={{ color: f.satisfied ? info.color : '#C8C4BC', fontWeight: '600' }}>
                        {f.satisfied ? '✓' : '○'}
                      </span>{' '}
                      {f.label}
                      {f.needed > 1 && ` (${f.have} of ${f.needed} needed)`}
                    </div>
                  ))}
                </div>
              )}
              {score.counterEvidence.length > 0 && (
                <div style={{
                  fontFamily: SANS,
                  fontSize: '11px',
                  color: '#A05252',
                  marginTop: compact ? '3px' : '5px',
                  lineHeight: '1.4'
                }}>
                  Counts against this: {score.counterEvidence.map(c => c.text.toLowerCase()).join('; ')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {ranking.priorChangedOrder && (
        <p style={{
          fontFamily: SANS,
          fontSize: '11px',
          color: '#6B6660',
          margin: compact ? '8px 0 0 0' : '14px 0 0 0',
          paddingTop: compact ? '6px' : '10px',
          borderTop: '1px dashed #E8E5E0',
          lineHeight: '1.5'
        }}>
          <strong>Ordering note:</strong> on symptom fit alone,{' '}
          <strong>{dementiaTypes[ranking.topByFit].name}</strong> scored highest. It has been placed below{' '}
          <strong>{dementiaTypes[ranking.withEvidence[0]].name}</strong> because the two are close enough to be
          hard to separate on symptoms, and the latter is substantially more common. Both are worth raising.
        </p>
      )}

      {unexplored.length > 0 && (
        <p style={{
          fontFamily: SANS,
          fontSize: '11px',
          color: '#8B6914',
          margin: compact ? '6px 0 0 0' : '10px 0 0 0',
          lineHeight: '1.5'
        }}>
          Nothing recorded yet under: {unexplored.join(', ')}. An unasked question is not a "no" — these
          categories are currently contributing nothing either way.
        </p>
      )}
    </>
  );
}

/**
 * Spider chart of every type's profile match -- the weighted share of that
 * type's defining features that are present.
 */
export function ProfileChart({ scores, width = 320 }) {
  const cx = 160, cy = 130, maxRadius = 100;
  const types = Object.keys(dementiaTypes);
  const angleStep = (2 * Math.PI) / types.length;
  const levels = [0.25, 0.5, 0.75, 1];

  const getPoint = (index, value) => {
    const angle = (index * angleStep) - Math.PI / 2;
    const radius = value * maxRadius;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
  };

  const getScoreValue = (type) => {
    const s = scores[type];
    if (!s) return 0;
    return s.profileMatch / 100;
  };

  return (
    // The viewBox starts above zero so the top axis label ("AD") is not
    // clipped -- it sits 125px above a centre that is only 130px down.
    <svg width={width} height={width * 296 / 320} viewBox="0 -14 320 296">
      <g>
        {/* Grid circles */}
        {levels.map((level, i) => (
          <circle
            key={`grid-${i}`}
            cx={cx}
            cy={cy}
            r={maxRadius * level}
            fill="none"
            stroke="#E8E5E0"
            strokeWidth="1"
            strokeDasharray={i < levels.length - 1 ? "4,4" : "none"}
          />
        ))}

        {/* Axis lines */}
        {types.map((type, i) => {
          const point = getPoint(i, 1);
          return (
            <line
              key={`axis-${type}`}
              x1={cx}
              y1={cy}
              x2={point.x}
              y2={point.y}
              stroke="#E8E5E0"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={types.map((type, i) => {
            const value = Math.max(getScoreValue(type), 0.05);
            const point = getPoint(i, value);
            return `${point.x},${point.y}`;
          }).join(' ')}
          fill="rgba(61, 122, 90, 0.15)"
          stroke="#3D7A5A"
          strokeWidth="2"
        />

        {/* Data points */}
        {types.map((type, i) => {
          const value = Math.max(getScoreValue(type), 0.05);
          const point = getPoint(i, value);
          const hasScore = scores[type]?.total > 0;
          return (
            <circle
              key={`point-${type}`}
              cx={point.x}
              cy={point.y}
              r={hasScore ? 6 : 4}
              fill={hasScore ? dementiaTypes[type].color : '#C8C4BC'}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}

        {/* Labels */}
        {types.map((type, i) => {
          const labelRadius = maxRadius + 25;
          const angle = (i * angleStep) - Math.PI / 2;
          const x = cx + labelRadius * Math.cos(angle);
          const y = cy + labelRadius * Math.sin(angle);
          const info = dementiaTypes[type];
          const hasScore = scores[type]?.total > 0;

          // Adjust text anchor based on position
          let textAnchor = 'middle';
          if (Math.cos(angle) < -0.1) textAnchor = 'end';
          else if (Math.cos(angle) > 0.1) textAnchor = 'start';

          return (
            <g key={`label-${type}`}>
              <text
                x={x}
                y={y}
                textAnchor={textAnchor}
                style={{
                  fontFamily: SANS,
                  fontSize: '11px',
                  fontWeight: hasScore ? '600' : '400',
                  fill: hasScore ? info.color : '#8B8680'
                }}
              >
                {info.shortName}
              </text>
              {hasScore && (
                <text
                  x={x}
                  y={y + 12}
                  textAnchor={textAnchor}
                  style={{
                    fontFamily: SANS,
                    fontSize: '9px',
                    fill: '#8B8680'
                  }}
                >
                  {Math.round(scores[type].profileMatch)}%
                </text>
              )}
            </g>
          );
        })}

        {/* Center percentage labels */}
        <text x={cx + 8} y={cy - maxRadius * 0.25 + 3} style={{ fontFamily: SANS, fontSize: '8px', fill: '#A8A4A0' }}>25%</text>
        <text x={cx + 8} y={cy - maxRadius * 0.5 + 3} style={{ fontFamily: SANS, fontSize: '8px', fill: '#A8A4A0' }}>50%</text>
        <text x={cx + 8} y={cy - maxRadius * 0.75 + 3} style={{ fontFamily: SANS, fontSize: '8px', fill: '#A8A4A0' }}>75%</text>
        <text x={cx + 8} y={cy - maxRadius + 3} style={{ fontFamily: SANS, fontSize: '8px', fill: '#A8A4A0' }}>100%</text>
      </g>
    </svg>
  );
}

export const PROFILE_CHART_CAPTION =
  "Each axis is that subtype's profile match — the weighted share of its defining features that are present. Non-specific findings are excluded from the denominator.";

/**
 * The recorded answers that do the most to separate the types (see
 * distinguishingAnswers in scoring.js), each tagged with the types it points
 * toward and away from, in those types' colours.
 */
export function DistinguishingAnswers({ answers, details = {} }) {
  if (answers.length === 0) {
    return (
      <p style={{ fontFamily: SANS, fontSize: '12px', color: '#8B8680', margin: 0 }}>
        None of the recorded answers is specific to one subtype yet.
      </p>
    );
  }
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {answers.map((a) => {
        const lead = a.supports[0] ? dementiaTypes[a.supports[0].type].color : '#A05252';
        const detail = details[a.id];
        return (
          <li key={a.id} className="answer-row" style={{ borderLeft: `3px solid ${lead}`, paddingLeft: '9px' }}>
            <div style={{ fontFamily: SANS, fontSize: '11.5px', color: '#2D2A26', lineHeight: '1.35' }}>
              {a.text}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '3px', alignItems: 'center' }}>
              {a.supports.map(({ type, tier }) => {
                const info = dementiaTypes[type];
                return (
                  <span key={type} style={{
                    fontFamily: SANS,
                    fontSize: '9.5px',
                    fontWeight: '600',
                    padding: '1px 6px',
                    borderRadius: '8px',
                    color: tier === 'core' ? 'white' : info.color,
                    background: tier === 'core' ? info.color : `${info.color}1A`,
                  }}>
                    {info.shortName} · {tier}
                  </span>
                );
              })}
              {a.against.map((type) => (
                <span key={`against-${type}`} style={{
                  fontFamily: SANS,
                  fontSize: '9.5px',
                  fontWeight: '600',
                  padding: '0 5px',
                  borderRadius: '8px',
                  color: '#A05252',
                  border: '1px solid #A0525266',
                }}>
                  against {dementiaTypes[type].shortName}
                </span>
              ))}
              {detail && (
                <span style={{ fontFamily: SANS, fontSize: '9.5px', color: '#8B8680' }}>{detail}</span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
