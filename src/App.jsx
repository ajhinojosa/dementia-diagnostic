import React, { useState, useMemo } from 'react';

// Research-backed behavioral symptoms with subtype associations
// Sources: NIA-AA criteria, DLB Consortium (2017), International bvFTD Criteria Consortium,
// NINDS-AIREN vascular criteria, peer-reviewed meta-analyses
const globalSymptoms = [
  // MEMORY & COGNITION
  {
    id: "mem1",
    category: "Memory & Learning",
    text: "Forgets recent conversations within hours or asks the same questions repeatedly",
    types: ["alzheimers"],
    evidence: "NIA-AA diagnostic criteria; Alzheimer's Association 10 Warning Signs",
    discriminating: true
  },
  {
    id: "mem2",
    category: "Memory & Learning",
    text: "Misplaces items in unusual locations (e.g., keys in freezer, wallet in oven)",
    types: ["alzheimers"],
    evidence: "NIA-AA criteria; highly specific for AD pattern",
    discriminating: false
  },
  {
    id: "mem3",
    category: "Memory & Learning",
    text: "Gets lost in familiar places (own neighborhood, route to regular destinations)",
    types: ["alzheimers"],
    evidence: "NIA-AA criteria; spatial disorientation typical of AD",
    discriminating: true
  },
  {
    id: "mem4",
    category: "Memory & Learning",
    text: "Memory problems came on suddenly or worsened in noticeable 'steps' rather than gradually",
    types: ["vascular"],
    evidence: "NINDS-AIREN criteria; step-wise decline is classic vascular pattern (J Neurol Neurosurg Psychiatry)",
    discriminating: true
  },
  {
    id: "mem5",
    category: "Memory & Learning",
    text: "Attention and alertness fluctuate dramatically - 'good hours and bad hours' within the same day",
    types: ["lewy"],
    evidence: "DLB Consortium 4th consensus (2017) - core clinical feature; occurs in ~80% of DLB",
    discriminating: true
  },
  {
    id: "mem6",
    category: "Memory & Learning",
    text: "Stares blankly into space for periods of time or seems completely 'zoned out'",
    types: ["lewy"],
    evidence: "DLB Consortium - fluctuating cognition/attention; Dementia UK clinical guidance",
    discriminating: true
  },

  // EXECUTIVE FUNCTION & PLANNING
  {
    id: "exec1",
    category: "Planning & Problem-Solving",
    text: "Difficulty managing finances, paying bills, or following multi-step instructions",
    types: ["alzheimers", "vascular"],
    evidence: "NIA-AA criteria (AD); executive dysfunction prominent early in vascular dementia (Medscape)",
    discriminating: false
  },
  {
    id: "exec2",
    category: "Planning & Problem-Solving",
    text: "Trouble organizing, planning ahead, or sequencing tasks (e.g., following a recipe)",
    types: ["alzheimers", "vascular", "ftd"],
    evidence: "Common across types; dysexecutive profile is one of 6 bvFTD diagnostic features",
    discriminating: false
  },
  {
    id: "exec3",
    category: "Planning & Problem-Solving",
    text: "Mental processing seems notably slower - takes much longer to respond or complete tasks",
    types: ["vascular"],
    evidence: "Subcortical vascular dementia profile; PMC research on psychomotor slowing",
    discriminating: true
  },
  {
    id: "exec4",
    category: "Planning & Problem-Solving",
    text: "Problems with visuospatial tasks (judging distances, reading clocks, assembling objects)",
    types: ["alzheimers", "lewy"],
    evidence: "NIA-AA (AD); DLB Consortium - visuospatial deficits more prominent in DLB than AD",
    discriminating: false
  },

  // BEHAVIOR & PERSONALITY
  {
    id: "beh1",
    category: "Behavior & Personality",
    text: "Major personality change - seems like a different person than before",
    types: ["ftd"],
    evidence: "International bvFTD Criteria Consortium; personality change typically precedes memory loss",
    discriminating: true
  },
  {
    id: "beh2",
    category: "Behavior & Personality",
    text: "Makes inappropriate comments, jokes, or sexual remarks in social situations",
    types: ["ftd"],
    evidence: "bvFTD criteria - disinhibition is 1 of 6 core features; 76% of autopsy-confirmed bvFTD",
    discriminating: true
  },
  {
    id: "beh3",
    category: "Behavior & Personality",
    text: "Seems to have lost empathy - doesn't respond to others' emotions or needs",
    types: ["ftd"],
    evidence: "International bvFTD Criteria - loss of sympathy/empathy is core diagnostic feature",
    discriminating: true
  },
  {
    id: "beh4",
    category: "Behavior & Personality",
    text: "Engages in compulsive, ritualistic, or repetitive behaviors (fixed routines, hoarding, repetitive movements)",
    types: ["ftd"],
    evidence: "bvFTD criteria - perseverative/stereotyped behaviors; FTD caregiver studies",
    discriminating: true
  },
  {
    id: "beh5",
    category: "Behavior & Personality",
    text: "Shows profound apathy - loss of initiative, motivation, and interest in previous activities",
    types: ["ftd", "vascular"],
    evidence: "Core bvFTD feature; apathy early in vascular dementia vs. later in AD (Medscape)",
    discriminating: false
  },
  {
    id: "beh6",
    category: "Behavior & Personality",
    text: "Has made impulsive financial decisions, fallen for scams, or shown poor judgment with money",
    types: ["ftd", "alzheimers"],
    evidence: "UCSF Memory Center - common in bvFTD; NIA-AA - judgment changes in AD",
    discriminating: false
  },
  {
    id: "beh7",
    category: "Behavior & Personality",
    text: "Neglects personal hygiene or grooming (stopped bathing, wearing dirty clothes)",
    types: ["ftd"],
    evidence: "bvFTD diagnostic criteria; often early sign before memory changes",
    discriminating: false
  },

  // HALLUCINATIONS & PERCEPTIONS
  {
    id: "hall1",
    category: "Hallucinations & Perceptions",
    text: "Sees people, animals, or objects that aren't there (detailed, well-formed visual hallucinations)",
    types: ["lewy"],
    evidence: "DLB Consortium - core feature; occurs in 80% of DLB, usually early in disease",
    discriminating: true
  },
  {
    id: "hall2",
    category: "Hallucinations & Perceptions",
    text: "Reports seeing deceased relatives or strangers in the home",
    types: ["lewy"],
    evidence: "DLB Consortium; visual hallucinations typically well-formed and recurrent",
    discriminating: true
  },
  {
    id: "hall3",
    category: "Hallucinations & Perceptions",
    text: "Misidentifies familiar people (thinks spouse is an imposter) or becomes paranoid/suspicious",
    types: ["alzheimers", "lewy"],
    evidence: "Capgras syndrome more common in DLB; delusions occur in 20-40% of AD (NCBI)",
    discriminating: false
  },

  // MOVEMENT & PHYSICAL
  {
    id: "mov1",
    category: "Movement & Physical",
    text: "Shuffling walk, difficulty starting to walk, or freezing mid-step",
    types: ["lewy", "vascular"],
    evidence: "DLB Consortium - parkinsonism is core feature; gait problems characteristic of vascular dementia",
    discriminating: true
  },
  {
    id: "mov2",
    category: "Movement & Physical",
    text: "Muscle stiffness or rigidity, especially in arms or legs",
    types: ["lewy"],
    evidence: "DLB Consortium - parkinsonism (rigidity, bradykinesia) is core clinical feature",
    discriminating: true
  },
  {
    id: "mov3",
    category: "Movement & Physical",
    text: "Tremor (shaking) at rest, particularly in hands",
    types: ["lewy"],
    evidence: "DLB Consortium - parkinsonian features; may be less prominent than in Parkinson's disease",
    discriminating: false
  },
  {
    id: "mov4",
    category: "Movement & Physical",
    text: "Frequent falls or balance problems",
    types: ["lewy", "vascular"],
    evidence: "DLB Consortium - falls common; gait/balance deficits in subcortical vascular dementia (PMC)",
    discriminating: false
  },
  {
    id: "mov5",
    category: "Movement & Physical",
    text: "Facial expression appears flat or 'masked' (reduced emotional expression)",
    types: ["lewy"],
    evidence: "DLB Consortium - hypomimia/masked facies part of parkinsonism features",
    discriminating: false
  },
  {
    id: "mov6",
    category: "Movement & Physical",
    text: "History of stroke, TIA (mini-stroke), or known cardiovascular disease",
    types: ["vascular"],
    evidence: "NINDS-AIREN criteria; major risk factor; stroke increases dementia risk 70-120%",
    discriminating: true
  },

  // SLEEP
  {
    id: "sleep1",
    category: "Sleep & Arousal",
    text: "Acts out dreams during sleep - punching, kicking, yelling, or falling out of bed",
    types: ["lewy"],
    evidence: "DLB Consortium (2017) - REM sleep behavior disorder is core feature; often precedes cognitive symptoms by years",
    discriminating: true
  },
  {
    id: "sleep2",
    category: "Sleep & Arousal",
    text: "Talks, shouts, or makes sounds during sleep",
    types: ["lewy"],
    evidence: "NINDS/NIA - RBD manifestation; dream enactment behavior",
    discriminating: true
  },
  {
    id: "sleep3",
    category: "Sleep & Arousal",
    text: "Excessive daytime sleepiness - naps frequently or dozes off during activities",
    types: ["lewy"],
    evidence: "PMC systematic review - EDS occurs in ~80% of DLB patients; more severe than in AD",
    discriminating: true
  },
  {
    id: "sleep4",
    category: "Sleep & Arousal",
    text: "Sleep-wake cycle is disrupted - active at night, sleepy during day",
    types: ["alzheimers", "lewy"],
    evidence: "NIA - sundowning common in AD; circadian dysfunction in LBD",
    discriminating: false
  },

  // EATING & ORAL BEHAVIORS
  {
    id: "eat1",
    category: "Eating & Oral Behaviors",
    text: "Developed strong cravings for sweets or carbohydrates",
    types: ["ftd"],
    evidence: "J Neurol Neurosurg Psychiatry - sweet preference highly specific for FTD vs AD",
    discriminating: true
  },
  {
    id: "eat2",
    category: "Eating & Oral Behaviors",
    text: "Overeats, eats rapidly, or stuffs food in mouth (food cramming)",
    types: ["ftd"],
    evidence: "Bathgate et al. - food cramming discriminates FTD from other dementias (PMC)",
    discriminating: true
  },
  {
    id: "eat3",
    category: "Eating & Oral Behaviors",
    text: "Fixated on specific foods or developed rigid 'food fads' (will only eat certain things)",
    types: ["ftd"],
    evidence: "UCSF Memory Center; hyperorality is 1 of 6 core bvFTD diagnostic criteria",
    discriminating: true
  },
  {
    id: "eat4",
    category: "Eating & Oral Behaviors",
    text: "Puts non-food items in mouth or increased smoking/alcohol use",
    types: ["ftd"],
    evidence: "Cambridge Behavioral Inventory - oral behaviors domain; bvFTD associated",
    discriminating: false
  },

  // LANGUAGE & COMMUNICATION
  {
    id: "lang1",
    category: "Language & Communication",
    text: "Trouble finding the right words - uses vague terms or talks around the word",
    types: ["alzheimers", "ftd"],
    evidence: "NIA-AA criteria (AD); language variant FTD presents with word-finding difficulty",
    discriminating: false
  },
  {
    id: "lang2",
    category: "Language & Communication",
    text: "Speech has become slow, halting, or effortful",
    types: ["ftd"],
    evidence: "Non-fluent variant PPA criteria; progressive speech output difficulty",
    discriminating: true
  },
  {
    id: "lang3",
    category: "Language & Communication",
    text: "Loses understanding of word meanings - asks 'What is a [common word]?'",
    types: ["ftd"],
    evidence: "Semantic dementia (svPPA) - loss of conceptual knowledge; anterior temporal atrophy",
    discriminating: true
  },
  {
    id: "lang4",
    category: "Language & Communication",
    text: "Withdraws from conversations or social activities",
    types: ["alzheimers", "ftd"],
    evidence: "Alzheimer's Association warning sign; social withdrawal in both AD and FTD",
    discriminating: false
  },

  // AUTONOMIC & OTHER
  {
    id: "auto1",
    category: "Autonomic & Other",
    text: "Fainting episodes, dizziness when standing, or blood pressure fluctuations",
    types: ["lewy"],
    evidence: "DLB Consortium - autonomic dysfunction is supportive feature",
    discriminating: false
  },
  {
    id: "auto2",
    category: "Autonomic & Other",
    text: "New or worsening urinary incontinence (not explained by other conditions)",
    types: ["vascular"],
    evidence: "Subcortical vascular dementia clinical features (Medscape); frontal circuit involvement",
    discriminating: false
  },
  {
    id: "auto3",
    category: "Autonomic & Other",
    text: "Constipation or other bowel changes (not explained by medications)",
    types: ["lewy"],
    evidence: "DLB Consortium - autonomic symptoms; may precede cognitive symptoms",
    discriminating: false
  },
  {
    id: "auto4",
    category: "Autonomic & Other",
    text: "Loss of sense of smell (before or around time of other symptoms)",
    types: ["lewy"],
    evidence: "NIA - hyposmia is LBD risk factor; part of prodromal syndrome",
    discriminating: false
  },

  // ONSET & PROGRESSION
  {
    id: "onset1",
    category: "Onset & Progression",
    text: "Symptoms began before age 65",
    types: ["ftd"],
    evidence: "FTD is most common cause of dementia under 65; mean onset age 54",
    discriminating: true
  },
  {
    id: "onset2",
    category: "Onset & Progression",
    text: "Symptoms have progressed very gradually over years",
    types: ["alzheimers"],
    evidence: "NIA-AA - insidious onset and gradual progression characteristic of AD",
    discriminating: true
  },
  {
    id: "onset3",
    category: "Onset & Progression",
    text: "Progression seems faster than typical Alzheimer's (decline over months rather than years)",
    types: ["lewy", "vascular", "mixed"],
    evidence: "DLB often more rapid than AD; vascular events cause acute declines; mixed accelerates progression",
    discriminating: false
  },
  {
    id: "onset4",
    category: "Onset & Progression",
    text: "Behavior or personality changes appeared BEFORE memory problems",
    types: ["ftd"],
    evidence: "bvFTD diagnostic criteria - behavioral symptoms precede memory impairment; distinguishes from AD",
    discriminating: true
  }
];

const dementiaTypes = {
  alzheimers: {
    name: "Alzheimer's Disease",
    shortName: "AD",
    color: "#5B8C6F",
    description: "Most common form (60-80% of cases). Characterized by gradual onset with progressive memory decline, especially for recent events.",
    keyFeature: "Recent memory loss is earliest and most prominent symptom; personality often preserved early."
  },
  vascular: {
    name: "Vascular Dementia",
    shortName: "VaD",
    color: "#7B6B8D",
    description: "Second most common. Results from reduced blood flow to brain, often related to strokes or blood vessel damage.",
    keyFeature: "Often sudden onset or 'step-wise' decline. Executive function problems often more prominent than memory loss early on."
  },
  lewy: {
    name: "Lewy Body Dementia",
    shortName: "LBD",
    color: "#8B7355",
    description: "Third most common. Characterized by protein deposits (Lewy bodies) affecting brain chemistry and function.",
    keyFeature: "Visual hallucinations + fluctuating cognition + movement problems. CRITICAL: Often has dangerous reactions to antipsychotic medications."
  },
  ftd: {
    name: "Frontotemporal Dementia",
    shortName: "FTD",
    color: "#B87333",
    description: "Affects frontal and temporal lobes. Often younger onset (40s-60s) than other dementias.",
    keyFeature: "Personality/behavior changes or language problems come BEFORE memory loss. Often affects people under 65."
  },
  mixed: {
    name: "Mixed Dementia",
    shortName: "Mixed",
    color: "#5F7A8C",
    description: "Combination of two or more types, most commonly Alzheimer's + Vascular. Very common in older adults.",
    keyFeature: "Symptoms span multiple categories; often faster progression than pure AD. Suspect if pattern doesn't fit one type."
  }
};

const categories = [...new Set(globalSymptoms.map(s => s.category))];

export default function App() {
  const [checked, setChecked] = useState({});
  const [expandedCategories, setExpandedCategories] = useState(
    categories.reduce((acc, cat) => ({ ...acc, [cat]: true }), {})
  );
  const [showEvidenceFor, setShowEvidenceFor] = useState(null);

  const toggleCheck = (id) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Calculate scores for each dementia type
  const scores = useMemo(() => {
    const result = {};
    Object.keys(dementiaTypes).forEach(type => {
      const typeSymptoms = globalSymptoms.filter(s => s.types.includes(type));
      const discriminatingSymptoms = typeSymptoms.filter(s => s.discriminating);
      
      const checkedTotal = typeSymptoms.filter(s => checked[s.id]).length;
      const checkedDiscriminating = discriminatingSymptoms.filter(s => checked[s.id]).length;
      
      result[type] = {
        total: checkedTotal,
        maxTotal: typeSymptoms.length,
        discriminating: checkedDiscriminating,
        maxDiscriminating: discriminatingSymptoms.length,
        percentage: typeSymptoms.length > 0 ? (checkedTotal / typeSymptoms.length) * 100 : 0,
        discriminatingPercentage: discriminatingSymptoms.length > 0 
          ? (checkedDiscriminating / discriminatingSymptoms.length) * 100 : 0
      };
    });
    return result;
  }, [checked]);

  const hasAnyChecked = Object.values(checked).some(v => v);

  // Sort types by discriminating symptoms matched
  const sortedTypes = useMemo(() => {
    return Object.entries(scores)
      .sort((a, b) => {
        if (b[1].discriminating !== a[1].discriminating) {
          return b[1].discriminating - a[1].discriminating;
        }
        return b[1].total - a[1].total;
      })
      .map(([type]) => type);
  }, [scores]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FAF7F2 0%, #F0EDE5 100%)',
      fontFamily: "'Crimson Pro', Georgia, serif",
      padding: '24px 16px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap');
        
        * { box-sizing: border-box; }
        
        .card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
        }
        
        .checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s ease;
          border-bottom: 1px solid #F5F3F0;
        }
        
        .checkbox-row:last-child {
          border-bottom: none;
        }
        
        .checkbox-row:hover {
          background: rgba(0,0,0,0.02);
        }
        
        .custom-check {
          width: 22px;
          height: 22px;
          border: 2px solid #C8C4BC;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
          transition: all 0.15s ease;
          background: white;
        }
        
        .custom-check.checked {
          background: #3D7A5A;
          border-color: #3D7A5A;
        }
        
        .type-tag {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          white-space: nowrap;
        }
        
        .score-bar {
          height: 8px;
          border-radius: 4px;
          background: #F0EDE8;
          overflow: hidden;
        }
        
        .score-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .category-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          cursor: pointer;
          border-bottom: 1px solid #F0EDE8;
          transition: background 0.15s ease;
        }
        
        .category-header:hover {
          background: rgba(0,0,0,0.02);
        }
        
        .evidence-tooltip {
          position: absolute;
          bottom: 100%;
          left: 0;
          right: 0;
          background: #2D2A26;
          color: white;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 12px;
          line-height: 1.5;
          margin-bottom: 8px;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .evidence-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 20px;
          border: 6px solid transparent;
          border-top-color: #2D2A26;
        }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '26px',
            fontWeight: '700',
            color: '#2D2A26',
            marginBottom: '8px',
            letterSpacing: '-0.5px'
          }}>
            Dementia Subtype Comparison Tool
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            color: '#6B6660',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.5'
          }}>
            Check observable behaviors to see which patterns emerge. Symptoms are tagged by which dementia type(s) they indicate. 
            <span style={{ color: '#B87333', fontWeight: '500' }}> High-value discriminating symptoms</span> carry more diagnostic weight.
          </p>
        </div>

        {/* Critical Warning */}
        <div className="card" style={{
          padding: '16px 18px',
          marginBottom: '20px',
          borderLeft: '4px solid #C75050',
          background: '#FDF8F8'
        }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: '#5C5550',
            margin: 0,
            lineHeight: '1.6'
          }}>
            <strong style={{ color: '#A03030' }}>For discussion with healthcare providers only.</strong> Dementia diagnosis requires comprehensive medical evaluation including cognitive testing, brain imaging, blood work, and clinical assessment. This tool is based on peer-reviewed diagnostic criteria but cannot replace professional evaluation. Many symptoms overlap between types, and mixed dementia is common.
          </p>
        </div>

        {/* Score Summary */}
        {hasAnyChecked && (
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <h3 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '12px',
              color: '#6B6660',
              margin: '0 0 16px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: '600'
            }}>
              Pattern Analysis
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {sortedTypes.map(type => {
                const score = scores[type];
                const info = dementiaTypes[type];
                if (score.total === 0) return null;
                
                return (
                  <div key={type}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '6px'
                    }}>
                      <span style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '14px',
                        fontWeight: '600',
                        color: info.color
                      }}>
                        {info.name}
                      </span>
                      <span style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '12px',
                        color: '#8B8680'
                      }}>
                        <span style={{ color: '#B87333', fontWeight: '600' }}>
                          {score.discriminating}/{score.maxDiscriminating}
                        </span>
                        {' discriminating • '}
                        {score.total}/{score.maxTotal} total
                      </span>
                    </div>
                    <div className="score-bar">
                      <div 
                        className="score-fill"
                        style={{ 
                          width: `${score.discriminatingPercentage}%`,
                          background: info.color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Top Match Details */}
            {sortedTypes[0] && scores[sortedTypes[0]].discriminating > 0 && (
              <div style={{
                marginTop: '16px',
                padding: '12px 14px',
                background: `${dementiaTypes[sortedTypes[0]].color}08`,
                borderRadius: '8px',
                borderLeft: `3px solid ${dementiaTypes[sortedTypes[0]].color}`
              }}>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '11px',
                  color: dementiaTypes[sortedTypes[0]].color,
                  margin: '0 0 4px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: '600'
                }}>
                  Strongest Pattern Match: {dementiaTypes[sortedTypes[0]].name}
                </p>
                <p style={{
                  fontSize: '13px',
                  color: '#4A4744',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  {dementiaTypes[sortedTypes[0]].keyFeature}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Lewy Body Warning */}
        {scores.lewy?.discriminating >= 2 && (
          <div className="card" style={{
            padding: '16px 18px',
            marginBottom: '20px',
            borderLeft: '4px solid #D4A017',
            background: '#FFFEF5'
          }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: '#5C5550',
              margin: 0,
              lineHeight: '1.6'
            }}>
              <strong style={{ color: '#8B6914' }}>⚠️ Important Safety Note for Possible Lewy Body Dementia:</strong> People with LBD can have severe, sometimes life-threatening reactions to common antipsychotic medications. Flag this concern with healthcare providers <em>before</em> any antipsychotics are prescribed.
            </p>
          </div>
        )}

        {/* Symptom Checklist by Category */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {categories.map(category => {
            const categorySymptoms = globalSymptoms.filter(s => s.category === category);
            const isExpanded = expandedCategories[category];
            const checkedCount = categorySymptoms.filter(s => checked[s.id]).length;
            
            return (
              <div key={category} className="card" style={{ overflow: 'hidden' }}>
                <div 
                  className="category-header"
                  onClick={() => toggleCategory(category)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#2D2A26',
                      margin: 0
                    }}>
                      {category}
                    </h3>
                    {checkedCount > 0 && (
                      <span style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '12px',
                        color: '#3D7A5A',
                        fontWeight: '600'
                      }}>
                        {checkedCount} selected
                      </span>
                    )}
                  </div>
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#8B8680" 
                    strokeWidth="2"
                    style={{
                      transition: 'transform 0.2s ease',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
                
                {isExpanded && (
                  <div style={{ padding: '4px 0' }}>
                    {categorySymptoms.map(symptom => (
                      <div
                        key={symptom.id}
                        className="checkbox-row"
                        onClick={() => toggleCheck(symptom.id)}
                        style={{ position: 'relative' }}
                      >
                        <div className={`custom-check ${checked[symptom.id] ? 'checked' : ''}`}>
                          {checked[symptom.id] && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <path d="M5 12l5 5L20 7" />
                            </svg>
                          )}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '14px',
                            color: checked[symptom.id] ? '#2D2A26' : '#4A4744',
                            lineHeight: '1.45',
                            marginBottom: '6px'
                          }}>
                            {symptom.text}
                            {symptom.discriminating && (
                              <span style={{
                                marginLeft: '8px',
                                color: '#B87333',
                                fontSize: '10px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px'
                              }}>
                                High-value
                              </span>
                            )}
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: '6px',
                            alignItems: 'center'
                          }}>
                            {symptom.types.map(type => (
                              <span
                                key={type}
                                className="type-tag"
                                style={{
                                  background: `${dementiaTypes[type].color}15`,
                                  color: dementiaTypes[type].color
                                }}
                              >
                                {dementiaTypes[type].shortName}
                              </span>
                            ))}
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowEvidenceFor(showEvidenceFor === symptom.id ? null : symptom.id);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '2px 6px',
                                cursor: 'pointer',
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '10px',
                                color: '#8B8680',
                                textDecoration: 'underline',
                                textUnderlineOffset: '2px'
                              }}
                            >
                              {showEvidenceFor === symptom.id ? 'Hide' : 'Show'} evidence
                            </button>
                          </div>
                          
                          {showEvidenceFor === symptom.id && (
                            <div style={{
                              marginTop: '10px',
                              padding: '10px 12px',
                              background: '#F8F6F3',
                              borderRadius: '6px',
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: '12px',
                              color: '#5C5550',
                              lineHeight: '1.5'
                            }}>
                              <strong style={{ color: '#4A4744' }}>Research basis:</strong> {symptom.evidence}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Type Reference Cards */}
        <div style={{ marginTop: '24px' }}>
          <h3 style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px',
            color: '#6B6660',
            margin: '0 0 12px 16px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: '600'
          }}>
            Quick Reference: Dementia Types
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '12px'
          }}>
            {Object.entries(dementiaTypes).map(([key, type]) => (
              <div 
                key={key}
                className="card"
                style={{
                  padding: '14px 16px',
                  borderTop: `3px solid ${type.color}`
                }}
              >
                <h4 style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: type.color,
                  margin: '0 0 6px 0'
                }}>
                  {type.name}
                </h4>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '12px',
                  color: '#6B6660',
                  margin: '0 0 8px 0',
                  lineHeight: '1.5'
                }}>
                  {type.description}
                </p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '12px',
                  color: '#4A4744',
                  margin: 0,
                  lineHeight: '1.5',
                  fontStyle: 'italic'
                }}>
                  <strong>Key:</strong> {type.keyFeature}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '28px 20px 16px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px',
          color: '#8B8680',
          lineHeight: '1.6'
        }}>
          <p style={{ margin: '0 0 6px 0' }}>
            Based on: NIA-AA Alzheimer's criteria (2024), DLB Consortium 4th consensus (2017), 
            International bvFTD Criteria Consortium, NINDS-AIREN vascular criteria
          </p>
          <p style={{ margin: 0 }}>
            A neurologist or geriatrician can provide comprehensive evaluation, imaging, and accurate diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}

