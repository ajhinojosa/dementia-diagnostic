import React, { useState, useMemo, useRef, useEffect } from 'react';

import { dementiaTypes, typeKeys, EVIDENCE_LABELS } from './data/dementiaTypes.js';
import { globalSymptoms, quickSymptoms, categories as allCategories } from './data/symptoms.js';
import {
  ITEM_KINDS,
  MODIFIER_DEFS,
  getModifiersFor,
  modifierLabel,
  impactValueOf,
  IMPACT_SEVERE,
  IMPACT_MODERATE,
} from './data/itemKinds.js';
import { redFlags, quickRedFlags, RED_FLAG_URGENCY } from './data/redFlags.js';
import {
  computeScores,
  rankTypes,
  assessConfidence,
  activeSafetyFlags,
  unexploredCategories,
  distinguishingAnswers,
} from './scoring.js';
import { PatternAnalysis, ProfileChart, PROFILE_CHART_CAPTION, sectionHeading } from './components/AnalysisPanels.jsx';
import OnePageSummary from './components/OnePageSummary.jsx';
import { loadSavedData, STORAGE_KEY, SCHEMA_VERSION } from './migrate.js';
import { buildExport, exportFilename, parseImport, downloadJSON } from './backup.js';

// ============================================
// LOCAL DATA (functional assessment + staging)
// ============================================

const iadlItems = [
  { id: "iadl1", text: "Managing finances (paying bills, banking)", category: "Financial" },
  { id: "iadl2", text: "Managing medications (remembering doses, refills)", category: "Health" },
  { id: "iadl3", text: "Driving or arranging transportation", category: "Transportation" },
  { id: "iadl4", text: "Shopping for groceries or necessities", category: "Shopping" },
  { id: "iadl5", text: "Preparing meals", category: "Household" },
  { id: "iadl6", text: "Using telephone or technology", category: "Communication" },
  { id: "iadl7", text: "Housekeeping and laundry", category: "Household" },
  { id: "iadl8", text: "Managing appointments and schedule", category: "Organization" }
];

const badlItems = [
  { id: "badl1", text: "Bathing/showering independently", category: "Hygiene" },
  { id: "badl2", text: "Dressing appropriately", category: "Self-care" },
  { id: "badl3", text: "Using the toilet independently", category: "Continence" },
  { id: "badl4", text: "Transferring (getting in/out of bed, chairs)", category: "Mobility" },
  { id: "badl5", text: "Eating without assistance", category: "Nutrition" },
  { id: "badl6", text: "Walking/mobility", category: "Mobility" }
];

const adlStatusOptions = [
  { value: "", label: "Select status" },
  { value: "independent", label: "Fully independent" },
  { value: "supervision", label: "Needs reminding/supervision" },
  { value: "assistance", label: "Needs some hands-on help" },
  { value: "dependent", label: "Cannot do without full help" },
  { value: "na", label: "N/A or not assessed" }
];

const stageInfo = {
  alzheimers: {
    mild: {
      name: "Mild / Early Stage",
      duration: "Typically 2-4 years",
      cognitive: "Memory lapses for recent events, word-finding difficulty, misplacing items, trouble with complex planning",
      functional: "Can live independently but may need help with finances, medications, or complex tasks",
      behavioral: "May show anxiety, withdrawal from challenging situations, denial of problems",
      caregiving: "Light supervision, help with organization, medication reminders, accompaniment to appointments"
    },
    moderate: {
      name: "Moderate / Middle Stage",
      duration: "Often the longest stage, 2-10 years",
      cognitive: "Significant memory gaps, confusion about time/place, difficulty recognizing family, trouble with basic math",
      functional: "Needs help with daily activities: dressing, bathing, meal preparation. Should not drive.",
      behavioral: "Wandering, sundowning, suspicion/paranoia, sleep disturbances, repetitive behaviors, personality changes",
      caregiving: "Hands-on daily assistance, 24-hour supervision may become necessary, structured routines essential"
    },
    severe: {
      name: "Severe / Late Stage",
      duration: "Typically 1-3 years",
      cognitive: "Minimal awareness of surroundings, very limited communication, may not recognize self or close family",
      functional: "Dependent for all activities: eating, toileting, mobility. May become bedbound.",
      behavioral: "Loss of motor control, difficulty swallowing, increased sleep, vulnerability to infections",
      caregiving: "Full-time skilled care, focus on comfort and dignity, hospice may be appropriate"
    }
  },
  vascular: {
    mild: {
      name: "Mild / Early Stage",
      duration: "Variable, depends on vascular events",
      cognitive: "Slowed thinking, difficulty concentrating, trouble with planning and organization, memory less affected initially",
      functional: "May have subtle physical symptoms (mild weakness, gait changes), can manage most daily activities",
      behavioral: "Depression common, apathy, emotional flatness or lability",
      caregiving: "Focus on vascular risk factor management, medication adherence, fall prevention"
    },
    moderate: {
      name: "Moderate / Middle Stage",
      duration: "May progress in steps rather than gradually",
      cognitive: "More pronounced executive dysfunction, confusion, disorientation, memory problems worsen",
      functional: "Noticeable gait problems, balance issues, may need assistance with IADLs, driving unsafe",
      behavioral: "Emotional changes more pronounced, possible pseudobulbar affect (uncontrolled laughing/crying)",
      caregiving: "Daily supervision, fall prevention critical, watch for signs of new stroke/TIA"
    },
    severe: {
      name: "Severe / Late Stage",
      duration: "Variable",
      cognitive: "Severe cognitive impairment across all domains",
      functional: "Significant motor impairment, incontinence, dependent for most or all activities",
      behavioral: "May have swallowing difficulties, high infection risk",
      caregiving: "Full-time care, positioning and skin care important, aspiration precautions"
    }
  },
  lewy: {
    mild: {
      name: "Mild / Early Stage",
      duration: "Variable, often 1-2 years",
      cognitive: "Fluctuating attention/alertness, visual-spatial problems, executive dysfunction; memory may be relatively preserved",
      functional: "REM sleep behavior disorder often present, mild movement symptoms possible, can manage most activities",
      behavioral: "Visual hallucinations may begin (often not distressing initially), depression, anxiety, apathy",
      caregiving: "Monitor fluctuations, ensure sleep safety for RBD, AVOID antipsychotics, document patterns"
    },
    moderate: {
      name: "Moderate / Middle Stage",
      duration: "Often 2-4 years",
      cognitive: "More pronounced fluctuations, worsening visuospatial deficits, delusions may develop",
      functional: "Parkinsonism more evident (stiffness, slowness, falls), needs help with daily activities",
      behavioral: "Hallucinations may become more frequent/distressing, sleep problems worsen, autonomic symptoms",
      caregiving: "Fall prevention critical, medication management complex, watch for orthostatic hypotension"
    },
    severe: {
      name: "Severe / Late Stage",
      duration: "Typically 1-2 years",
      cognitive: "Severe impairment, minimal responsiveness during 'off' periods",
      functional: "Severe parkinsonism, may be bedbound, swallowing difficulties, high fall risk if mobile",
      behavioral: "Continued hallucinations, severe sleep disruption, autonomic failure",
      caregiving: "Full skilled care, aspiration precautions, comfort focus, medication review essential"
    }
  },
  ftd: {
    mild: {
      name: "Mild / Early Stage",
      duration: "Often 1-3 years",
      cognitive: "Executive dysfunction, but memory often preserved; person may perform normally on standard memory tests",
      functional: "Can manage self-care but judgment impaired; may make poor decisions, inappropriate social behavior",
      behavioral: "Personality changes, loss of empathy, disinhibition, apathy, compulsive behaviors, dietary changes",
      caregiving: "Behavioral management strategies, protect from financial exploitation, maintain structure"
    },
    moderate: {
      name: "Moderate / Middle Stage",
      duration: "Often 2-4 years",
      cognitive: "More pronounced executive deficits, language may deteriorate (especially in language variants)",
      functional: "Needs supervision and help with daily activities, cannot work or manage complex tasks",
      behavioral: "Behaviors may intensify or change, compulsions may become more rigid, social awareness further diminished",
      caregiving: "24-hour supervision often needed, behavioral interventions, structured environment essential"
    },
    severe: {
      name: "Severe / Late Stage",
      duration: "Typically 1-3 years",
      cognitive: "Severe impairment across domains, may become mute (especially language variants)",
      functional: "Dependent for all care, motor symptoms may emerge (parkinsonism or motor neuron signs)",
      behavioral: "May become more passive/inert, swallowing difficulties common",
      caregiving: "Full-time skilled care, feeding support, comfort-focused care"
    }
  },
  mixed: {
    mild: {
      name: "Mild / Early Stage",
      duration: "Variable",
      cognitive: "Combination of symptoms from multiple dementia types; may include memory problems + executive dysfunction",
      functional: "Some difficulty with complex tasks, may have subtle physical symptoms depending on types involved",
      behavioral: "Variable depending on which types are present",
      caregiving: "Address all contributing factors (e.g., vascular risk management + AD-focused interventions)"
    },
    moderate: {
      name: "Moderate / Middle Stage",
      duration: "Often progresses faster than single-type dementia",
      cognitive: "More rapid decline typical; multiple cognitive domains affected",
      functional: "Needs substantial help with daily activities, multiple symptom types to manage",
      behavioral: "May show behavioral symptoms from multiple dementia types",
      caregiving: "Complex care needs, may need to balance different symptom management approaches"
    },
    severe: {
      name: "Severe / Late Stage",
      duration: "Variable",
      cognitive: "Severe impairment",
      functional: "Fully dependent, may have combined motor + cognitive decline",
      behavioral: "Variable end-stage symptoms depending on types involved",
      caregiving: "Full-time skilled care, comfort focus"
    }
  }
};

// Stage descriptions were written for the original five types. The variants
// added in the rewrite share a staging picture with their parent syndrome, so
// they alias rather than duplicating near-identical prose.
const stageInfoAlias = {
  alzheimers: 'alzheimers',
  pca: 'alzheimers',
  late: 'alzheimers',
  vascular: 'vascular',
  lewy: 'lewy',
  bvftd: 'ftd',
  ppa: 'ftd',
  mixed: 'mixed',
};

// A symptom is highlighted as high-value when it is a CORE diagnostic criterion
// for at least one type. Which type(s) is shown per-tag, since the same symptom
// can be core for one and non-specific for another.
const coreForTypes = (symptom) =>
  Object.entries(symptom.types).filter(([, tier]) => tier === 'core').map(([t]) => t);
const isCoreAnywhere = (symptom) => coreForTypes(symptom).length > 0;

const stageFor = (type, stage) => stageInfo[stageInfoAlias[type]]?.[stage] ?? null;


// ============================================
// MAIN COMPONENT
// ============================================

export default function App() {
  // State for symptoms with details
  const [symptomData, setSymptomData] = useState({});
  // Keyed by category NAME, so it can initialise from the static full list.
  // It must NOT read the mode-derived `categories` memo, which is declared
  // further down and would be in its temporal dead zone during first render.
  const [expandedCategories, setExpandedCategories] = useState(
    allCategories.reduce((acc, cat) => ({ ...acc, [cat]: false }), { "Memory & Learning": true })
  );
  
  // State for medical history
  const [medicalHistory, setMedicalHistory] = useState({
    patientName: "",
    patientAge: "",
    caregiverName: "",
    caregiverRelation: "",
    firstSymptomsNoticed: "",
    diagnosisDate: "",
    currentDiagnosis: "",
    // Risk factors
    historyStroke: false,
    historyTIA: false,
    historyHeartDisease: false,
    historyHypertension: false,
    historyDiabetes: false,
    historyParkinsons: false,
    historyDepression: false,
    historyHeadInjury: false,
    familyHistoryDementia: false,
    familyHistoryDetails: "",
    // Cancer treatment history
    historyCancerTreatment: false,
    historyCranialRadiation: false,
    cancerTreatmentDetails: "",
    // Medications
    currentMedications: "",
    recentMedChanges: "",
    // Notes
    additionalNotes: ""
  });
  
  // State for ADLs
  const [adlData, setAdlData] = useState({});
  
  // Red flag / reversible-mimic responses, kept separate from symptomData
  // because they never feed the subtype scoring.
  const [redFlagData, setRedFlagData] = useState({});

  // 'quick' = the ~3 minute screen, 'full' = the complete checklist.
  const [mode, setMode] = useState('quick');
  const [modeChosen, setModeChosen] = useState(false);

  // State for view mode
  const [activeTab, setActiveTab] = useState("symptoms"); // symptoms, flags, history, adl, stage, report
  const [showPrintView, setShowPrintView] = useState(false);
  const [showSummaryView, setShowSummaryView] = useState(false);
  const [showSourcesView, setShowSourcesView] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); // For save confirmation message
  const [migrationNotice, setMigrationNotice] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [importError, setImportError] = useState('');

  // The item set currently in play. Everything downstream -- scoring maxima,
  // category list, progress -- derives from this, which is what lets the quick
  // screen score against what was actually asked rather than the full list.
  const activeSymptoms = mode === 'quick' ? quickSymptoms : globalSymptoms;
  const activeRedFlags = mode === 'quick' ? quickRedFlags : redFlags;
  const categories = useMemo(
    () => [...new Set(activeSymptoms.map((s) => s.category))],
    [activeSymptoms]
  );

  // Load saved data on mount
  useEffect(() => {
    const saved = loadSavedData();
    if (!saved) return;
    setSymptomData(saved.symptomData);
    setMedicalHistory((prev) => ({ ...prev, ...saved.medicalHistory }));
    setAdlData(saved.adlData);
    setRedFlagData(saved.redFlagData);
    setMode(saved.mode);
    setModeChosen(true);
    if (saved.migratedFrom === 1) setMigrationNotice(true);
  }, []);

  // Save data function
  const saveData = () => {
    try {
      const dataToSave = {
        version: SCHEMA_VERSION,
        symptomData,
        medicalHistory,
        adlData,
        redFlagData,
        mode,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving data:', error);
      setSaveStatus('Error saving data');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // Export the whole assessment to a file the user controls. Until this
  // existed, one localStorage key on one browser was the only copy, with no
  // undo -- a cleared browser or a stray write lost everything.
  const exportData = () => {
    try {
      const payload = buildExport({ symptomData, medicalHistory, adlData, redFlagData, mode });
      downloadJSON(exportFilename(medicalHistory), payload);
      setSaveStatus('Exported to your downloads');
      setTimeout(() => setSaveStatus(''), 4000);
    } catch (error) {
      console.error('Export failed:', error);
      setSaveStatus('Error exporting');
      setTimeout(() => setSaveStatus(''), 4000);
    }
  };

  const fileInputRef = useRef(null);

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    // Reset immediately so re-picking the same file still fires a change event.
    event.target.value = '';
    if (!file) return;

    const result = parseImport(await file.text());
    if (!result.ok) {
      setImportError(result.error);
      return;
    }
    setImportError('');
    setPendingImport(result);
  };

  // Importing replaces everything currently entered, so it asks first and shows
  // what is in the file AND what would be lost. Overwriting someone's records
  // without showing them the trade is how data disappears.
  const confirmImport = () => {
    const { data } = pendingImport;
    setSymptomData(data.symptomData);
    setMedicalHistory((prev) => ({ ...prev, ...data.medicalHistory }));
    setAdlData(data.adlData);
    setRedFlagData(data.redFlagData);
    setMode(data.mode);
    setModeChosen(true);
    setPendingImport(null);
    setSaveStatus('Assessment loaded from file');
    setTimeout(() => setSaveStatus(''), 4000);
  };

  // Clear saved data function
  const clearData = () => {
    if (window.confirm('Are you sure you want to clear all saved data? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      setSymptomData({});
      setRedFlagData({});
      setMedicalHistory({
        patientName: "",
        patientAge: "",
        caregiverName: "",
        caregiverRelation: "",
        firstSymptomsNoticed: "",
        diagnosisDate: "",
        currentDiagnosis: "",
        historyStroke: false,
        historyTIA: false,
        historyHeartDisease: false,
        historyHypertension: false,
        historyDiabetes: false,
        historyParkinsons: false,
        historyDepression: false,
        historyHeadInjury: false,
        familyHistoryDementia: false,
        familyHistoryDetails: "",
        historyCancerTreatment: false,
        historyCranialRadiation: false,
        cancerTreatmentDetails: "",
        currentMedications: "",
        recentMedChanges: "",
        additionalNotes: ""
      });
      setAdlData({});
      setExpandedCategories(
        allCategories.reduce((acc, cat) => ({ ...acc, [cat]: false }), { "Memory & Learning": true })
      );
      setSaveStatus('Data cleared');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // Toggle symptom checked
  const toggleSymptom = (id) => {
    setSymptomData(prev => {
      if (prev[id]?.checked) {
        const { [id]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: { checked: true } };
    });
  };

  // Update symptom detail
  const updateSymptomDetail = (id, field, value) => {
    setSymptomData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  // Toggle category expansion
  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Calculate scores. All maxima come from `activeSymptoms`, so the quick
  // screen is scored against what was actually asked rather than the full list.
  const scores = useMemo(
    () => computeScores(symptomData, activeSymptoms),
    [symptomData, activeSymptoms]
  );

  const hasAnyChecked = Object.values(symptomData).some(v => v?.checked);

  const ranking = useMemo(() => rankTypes(scores), [scores]);
  const sortedTypes = ranking.order;

  const confidence = useMemo(
    () => assessConfidence(scores, symptomData, activeSymptoms),
    [scores, symptomData, activeSymptoms]
  );

  const safetyFlags = useMemo(
    () => activeSafetyFlags(symptomData, activeSymptoms, scores),
    [symptomData, activeSymptoms, scores]
  );

  const unexplored = useMemo(
    () => unexploredCategories(symptomData, activeSymptoms),
    [symptomData, activeSymptoms]
  );

  // The tool only names a leading type once there is enough recorded to make
  // the ordering mean something. Below that threshold it says so instead --
  // the previous version would announce a "strongest pattern match" off a
  // single checked box.
  const leadingType =
    ['moderate', 'clear', 'weak'].includes(confidence.level) ? ranking.withEvidence[0] : null;

  // "Progress" through a checkbox list is a misleading metric: leaving a box
  // unticked is not the same as answering "no". So rather than a fake
  // completion percentage, the bar measures something real -- of the items that
  // WERE selected, how many have their follow-up details filled in.
  const checkedCount = useMemo(
    () => activeSymptoms.filter(s => symptomData[s.id]?.checked).length,
    [symptomData, activeSymptoms]
  );

  const detailedCount = useMemo(
    () => activeSymptoms.filter(s => {
      if (!symptomData[s.id]?.checked) return false;
      const mods = getModifiersFor(s);
      // Items with no modifiers (course/context) are complete by definition.
      return mods.every(m => symptomData[s.id]?.[m]);
    }).length,
    [symptomData, activeSymptoms]
  );

  const flaggedRedFlags = useMemo(
    () => activeRedFlags.filter(f => redFlagData[f.id] === 'yes'),
    [redFlagData, activeRedFlags]
  );

  const topAnswers = useMemo(
    () => distinguishingAnswers(symptomData, activeSymptoms, sortedTypes),
    [symptomData, activeSymptoms, sortedTypes]
  );

  const toggleRedFlag = (id, value) =>
    setRedFlagData(prev => ({ ...prev, [id]: prev[id] === value ? undefined : value }));

  // Get checked symptoms for report
  const checkedSymptoms = useMemo(() => {
    return activeSymptoms.filter(s => symptomData[s.id]?.checked).map(s => ({
      ...s,
      ...symptomData[s.id]
    }));
  }, [symptomData, activeSymptoms]);

  // Calculate ADL summary and stage estimation
  const stageEstimation = useMemo(() => {
    // Count ADL impairments
    const iadlImpairments = iadlItems.filter(item => 
      adlData[item.id] && !["", "independent", "na"].includes(adlData[item.id])
    );
    const badlImpairments = badlItems.filter(item => 
      adlData[item.id] && !["", "independent", "na"].includes(adlData[item.id])
    );
    
    // Count severe impairments (needs full help)
    const severeIadl = iadlItems.filter(item => adlData[item.id] === "dependent").length;
    const severeBadl = badlItems.filter(item => adlData[item.id] === "dependent").length;
    
    // Count symptom severity
    // Impact now comes in two scales -- how much help an ability needs, or what
    // a behaviour has led to -- so staging reads whichever one the item used and
    // compares against the anchors that mean real functional loss in either.
    const severeSymptoms = Object.values(symptomData)
      .filter(s => s?.checked && IMPACT_SEVERE.has(impactValueOf(s))).length;
    const moderateSymptoms = Object.values(symptomData)
      .filter(s => s?.checked && IMPACT_MODERATE.has(impactValueOf(s))).length;
    
    // Determine stage based on combined factors
    let stage = "unknown";
    let stageLabel = "Unable to determine";
    let confidence = "low";
    
    const iadlCount = iadlImpairments.length;
    const badlCount = badlImpairments.length;
    const totalAssessed = Object.keys(adlData).filter(k => adlData[k] && adlData[k] !== "" && adlData[k] !== "na").length;
    
    if (totalAssessed >= 4) {
      confidence = "moderate";
      
      if (severeBadl >= 4 || (severeBadl >= 2 && severeIadl >= 4)) {
        stage = "severe";
        stageLabel = "Severe / Late Stage";
        confidence = "high";
      } else if (badlCount >= 3 || (badlCount >= 1 && iadlCount >= 5) || severeSymptoms >= 3) {
        stage = "moderate";
        stageLabel = "Moderate / Middle Stage";
        if (badlCount >= 4 || severeIadl >= 5) confidence = "high";
      } else if (iadlCount >= 2 || moderateSymptoms >= 2) {
        stage = "mild";
        stageLabel = "Mild / Early Stage";
        if (iadlCount >= 3 && badlCount === 0) confidence = "high";
      } else if (iadlCount <= 1 && badlCount === 0) {
        stage = "minimal";
        stageLabel = "Minimal or Questionable Impairment";
      }
    }
    
    // Get the most likely dementia type
    const topType = leadingType;
    
    // Get stage-specific information if we have both stage and type
    let stageDetails = null;
    if (stage && stage !== "unknown" && stage !== "minimal" && topType) {
      stageDetails = stageFor(topType, stage);
    }
    
    return {
      iadlImpairments: iadlCount,
      badlImpairments: badlCount,
      severeIadl,
      severeBadl,
      stage,
      stageLabel,
      confidence,
      topType,
      stageDetails,
      totalAssessed
    };
  }, [adlData, symptomData, leadingType]);

  // ============================================
  // ONE-PAGE SUMMARY
  // ============================================

  if (showSummaryView) {
    return (
      <OnePageSummary
        onBack={() => setShowSummaryView(false)}
        medicalHistory={medicalHistory}
        mode={mode}
        checkedCount={checkedCount}
        scores={scores}
        sortedTypes={sortedTypes}
        leadingType={leadingType}
        confidence={confidence}
        ranking={ranking}
        unexplored={unexplored}
        answers={topAnswers}
        activeSymptoms={activeSymptoms}
        symptomData={symptomData}
        flaggedRedFlags={flaggedRedFlags}
        safetyFlags={safetyFlags}
      />
    );
  }

  // ============================================
  // PRINT VIEW COMPONENT
  // ============================================
  
  if (showPrintView) {
    return (
      <div style={{
        fontFamily: "'Georgia', serif",
        padding: '40px',
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        color: '#1a1a1a',
        lineHeight: '1.6'
      }}>
        <style>{`
          @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
          }
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600&family=DM+Sans:wght@400;500;600&display=swap');
        `}</style>
        
        {/* Print Controls */}
        <div className="no-print" style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          display: 'flex',
          gap: '10px',
          zIndex: 1000
        }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: '12px 24px',
              background: '#3D7A5A',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif"
            }}
          >
            🖨️ Print / Save as PDF
          </button>
          <button
            onClick={() => setShowPrintView(false)}
            style={{
              padding: '12px 24px',
              background: '#6B6660',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif"
            }}
          >
            ← Back to Tool
          </button>
        </div>

        {/* Report Header */}
        <div style={{ borderBottom: '2px solid #2D2A26', paddingBottom: '20px', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', margin: '0 0 8px 0', fontWeight: '600' }}>
            Dementia Symptom Observation Report
          </h1>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            Prepared for discussion with healthcare provider • Generated {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Patient Information */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '15px' }}>
            Patient Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
            <div><strong>Patient Name:</strong> {medicalHistory.patientName || "_______________"}</div>
            <div><strong>Age:</strong> {medicalHistory.patientAge || "____"}</div>
            <div><strong>Caregiver:</strong> {medicalHistory.caregiverName || "_______________"}</div>
            <div><strong>Relationship:</strong> {medicalHistory.caregiverRelation || "_______________"}</div>
            <div><strong>Symptoms First Noticed:</strong> {medicalHistory.firstSymptomsNoticed || "_______________"}</div>
            <div><strong>Current Diagnosis (if any):</strong> {medicalHistory.currentDiagnosis || "None/Unknown"}</div>
          </div>
        </div>

        {/* Medical History */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '15px' }}>
            Relevant Medical History
          </h2>
          <div style={{ fontSize: '14px' }}>
            <p style={{ margin: '0 0 10px 0' }}><strong>Cardiovascular/Stroke Risk Factors:</strong></p>
            <ul style={{ margin: '0 0 15px 0', paddingLeft: '20px' }}>
              {medicalHistory.historyStroke && <li>History of stroke</li>}
              {medicalHistory.historyTIA && <li>History of TIA (mini-stroke)</li>}
              {medicalHistory.historyHeartDisease && <li>Heart disease</li>}
              {medicalHistory.historyHypertension && <li>Hypertension</li>}
              {medicalHistory.historyDiabetes && <li>Diabetes</li>}
              {!medicalHistory.historyStroke && !medicalHistory.historyTIA && !medicalHistory.historyHeartDisease && 
               !medicalHistory.historyHypertension && !medicalHistory.historyDiabetes && <li>None reported</li>}
            </ul>
            <p style={{ margin: '0 0 10px 0' }}><strong>Other Relevant History:</strong></p>
            <ul style={{ margin: '0 0 15px 0', paddingLeft: '20px' }}>
              {medicalHistory.historyParkinsons && <li>Parkinson's disease</li>}
              {medicalHistory.historyDepression && <li>Depression</li>}
              {medicalHistory.historyHeadInjury && <li>Significant head injury</li>}
              {medicalHistory.historyCancerTreatment && <li>Cancer treatment history: {medicalHistory.cancerTreatmentDetails || "details not specified"}</li>}
              {medicalHistory.historyCranialRadiation && <li><strong>Cranial/brain radiation therapy</strong> (may cause vascular-like white matter changes)</li>}
              {medicalHistory.familyHistoryDementia && <li>Family history of dementia: {medicalHistory.familyHistoryDetails || "details not specified"}</li>}
            </ul>
            {medicalHistory.currentMedications && (
              <p style={{ margin: '0 0 10px 0' }}><strong>Current Medications:</strong> {medicalHistory.currentMedications}</p>
            )}
            {medicalHistory.recentMedChanges && (
              <p style={{ margin: '0 0 10px 0' }}><strong>Recent Medication Changes:</strong> {medicalHistory.recentMedChanges}</p>
            )}
          </div>
        </div>

        {/* Red flags come FIRST in the printed report. If any are present they
            matter more than the subtype comparison -- some are treatable and a
            couple are urgent -- so burying them below a five-row score table
            would be the wrong order for the person reading it. */}
        {flaggedRedFlags.length > 0 && (
          <div style={{ marginBottom: '30px', border: '2px solid #B3261E', borderRadius: '4px', padding: '14px' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 6px 0', color: '#8C1D18' }}>
              Flagged for clinical attention
            </h2>
            <p style={{ fontSize: '13px', margin: '0 0 12px 0', color: '#444' }}>
              The carer completing this identified the following. These are possible treatable or urgent causes, and are
              recorded separately from the subtype comparison below.
            </p>
            {flaggedRedFlags.map(flag => (
              <div key={flag.id} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                  <strong>{flag.title}</strong>
                  <span style={{ color: RED_FLAG_URGENCY[flag.urgency].color, fontSize: '12px', marginLeft: '8px' }}>
                    ({RED_FLAG_URGENCY[flag.urgency].label})
                  </span>
                </p>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#333' }}>{flag.text}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#555' }}><em>{flag.means}</em></p>
              </div>
            ))}
          </div>
        )}

        {/* Pattern Analysis */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '15px' }}>
            Symptom Pattern Analysis
          </h2>
          {hasAnyChecked ? (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginBottom: '15px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333' }}>
                    <th style={{ textAlign: 'left', padding: '8px 4px' }}>Type</th>
                    <th style={{ textAlign: 'center', padding: '8px 4px' }}>Profile match</th>
                    <th style={{ textAlign: 'center', padding: '8px 4px' }}>Core criteria met</th>
                    <th style={{ textAlign: 'center', padding: '8px 4px' }}>Observations</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTypes.filter(type => scores[type].total > 0).map(type => (
                    <tr key={type} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '8px 4px', fontWeight: leadingType === type ? '600' : '400' }}>
                        {dementiaTypes[type].name}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 4px' }}>
                        {Math.round(scores[type].profileMatch)}%
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 4px' }}>
                        {scores[type].maxCore > 0 ? `${scores[type].core} / ${scores[type].maxCore}` : '—'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 4px' }}>
                        {scores[type].total} / {scores[type].maxTotal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* The printed report is the document that reaches a clinician, so
                  it must not assert a leading type more confidently than the
                  tool itself does. The previous version named a "strongest
                  pattern match" whenever any core criterion was met at all --
                  including off a single observation. */}
              <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', fontSize: '14px' }}>
                <strong>Confidence in this ordering: {confidence.label}</strong>
                <p style={{ margin: '6px 0 0 0' }}>{confidence.reason}</p>
                {leadingType && (
                  <p style={{ margin: '10px 0 0 0' }}>
                    <strong>Closest fit: {dementiaTypes[leadingType].name}.</strong>{' '}
                    <em>{dementiaTypes[leadingType].keyFeature}</em>
                  </p>
                )}
                {ranking.priorChangedOrder && (
                  <p style={{ margin: '10px 0 0 0', fontSize: '13px' }}>
                    Note: on symptom fit alone {dementiaTypes[ranking.topByFit].name} scored highest, but it is close
                    enough to {dementiaTypes[ranking.withEvidence[0]].name} to be hard to separate on symptoms, and the
                    latter is substantially more common.
                  </p>
                )}
                <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#555' }}>
                  Profile match = weighted share of that type's defining features that are present. Non-specific
                  findings are excluded from the denominator. This is a pattern summary compiled by a carer, not a
                  diagnostic result.
                </p>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: '#666' }}>No symptoms recorded yet.</p>
          )}
        </div>

        {/* Observed Symptoms Detail */}
        <div className="page-break" style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '15px' }}>
            Detailed Symptom Observations
          </h2>
          {checkedSymptoms.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #333', background: '#f9f9f9' }}>
                  <th style={{ textAlign: 'left', padding: '8px 4px', width: '45%' }}>Observation</th>
                  <th style={{ textAlign: 'left', padding: '8px 4px', width: '35%' }}>Details recorded</th>
                  <th style={{ textAlign: 'center', padding: '8px 4px' }}>Points toward</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => {
                  const catSymptoms = checkedSymptoms.filter(s => s.category === cat);
                  if (catSymptoms.length === 0) return null;
                  return (
                    <React.Fragment key={cat}>
                      <tr>
                        <td colSpan={3} style={{ padding: '10px 4px 4px', fontWeight: '600', background: '#f0f0f0' }}>
                          {cat}
                        </td>
                      </tr>
                      {catSymptoms.map(symptom => {
                        // Each item lists only the modifiers its kind supports,
                        // labelled -- a fixed Onset/Frequency/Severity trio would
                        // print three dashes for a past event and read as missing
                        // data rather than as questions that never applied.
                        const details = getModifiersFor(symptom)
                          .map(key => ({ label: MODIFIER_DEFS[key].label, value: modifierLabel(key, symptom[key]) }))
                          .filter(d => d.value);
                        return (
                        <tr key={symptom.id} style={{ borderBottom: '1px solid #eee', verticalAlign: 'top' }}>
                          <td style={{ padding: '6px 4px' }}>
                            {symptom.text}
                            {isCoreAnywhere(symptom) && <span style={{ color: '#B87333' }}> ★</span>}
                          </td>
                          <td style={{ padding: '6px 4px', fontSize: '12px' }}>
                            {details.length > 0
                              ? details.map(d => (
                                  <div key={d.label}>
                                    <span style={{ color: '#666' }}>{d.label}:</span> {d.value}
                                  </div>
                                ))
                              : (getModifiersFor(symptom).length === 0
                                  ? <span style={{ color: '#999', fontStyle: 'italic' }}>n/a for this kind of item</span>
                                  : <span style={{ color: '#999' }}>—</span>)}
                          </td>
                          <td style={{ textAlign: 'center', padding: '6px 4px', fontSize: '12px' }}>
                            {Object.entries(symptom.types)
                              .sort((a, b) => (a[1] === 'core' ? -1 : 1))
                              .map(([t, tier]) => `${dementiaTypes[t].shortName}${tier === 'core' ? '★' : tier === 'common' ? '°' : ''}`)
                              .join(', ')}
                          </td>
                        </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: '14px', color: '#666' }}>No symptoms recorded.</p>
          )}
          <p style={{ fontSize: '11px', color: '#888', marginTop: '10px' }}>
            ★ = a core diagnostic criterion for that type &nbsp;·&nbsp; ° = occurs in that type but is not specific to it
          </p>
        </div>

        {/* Functional Assessment */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '15px' }}>
            Functional Independence Assessment
          </h2>
          <p style={{ fontSize: '14px', marginBottom: '8px' }}>
            <strong>Estimated Stage:</strong> {stageEstimation.stageLabel}
            {stageEstimation.confidence && (
              <span style={{ 
                marginLeft: '10px', 
                fontSize: '12px', 
                color: stageEstimation.confidence === 'high' ? '#2E7D32' : 
                       stageEstimation.confidence === 'moderate' ? '#F57F17' : '#C62828'
              }}>
                ({stageEstimation.confidence} confidence)
              </span>
            )}
          </p>
          <p style={{ fontSize: '13px', color: '#555', marginBottom: '15px' }}>
            IADL impairments: {stageEstimation.iadlImpairments} | BADL impairments: {stageEstimation.badlImpairments} | Fully dependent: {stageEstimation.severeIadl + stageEstimation.severeBadl}
          </p>
          
          {/* Stage expectations if available */}
          {stageEstimation.stageDetails && stageEstimation.topType && (
            <div style={{ 
              background: '#f8f8f8', 
              padding: '12px 15px', 
              borderRadius: '6px', 
              marginBottom: '20px',
              borderLeft: `3px solid ${dementiaTypes[stageEstimation.topType].color}`
            }}>
              <p style={{ fontSize: '12px', fontWeight: '600', margin: '0 0 8px 0', color: dementiaTypes[stageEstimation.topType].color }}>
                Expected at this stage ({dementiaTypes[stageEstimation.topType].name}):
              </p>
              <p style={{ fontSize: '12px', margin: '0 0 6px 0' }}><strong>Duration:</strong> {stageEstimation.stageDetails.duration}</p>
              <p style={{ fontSize: '12px', margin: '0 0 6px 0' }}><strong>Cognitive:</strong> {stageEstimation.stageDetails.cognitive}</p>
              <p style={{ fontSize: '12px', margin: '0 0 6px 0' }}><strong>Functional:</strong> {stageEstimation.stageDetails.functional}</p>
              <p style={{ fontSize: '12px', margin: '0 0 6px 0' }}><strong>Behavioral:</strong> {stageEstimation.stageDetails.behavioral}</p>
              <p style={{ fontSize: '12px', margin: '0' }}><strong>Caregiving focus:</strong> {stageEstimation.stageDetails.caregiving}</p>
            </div>
          )}
          
          <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>Instrumental Activities of Daily Living (IADLs)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px' }}>
            <tbody>
              {iadlItems.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px 4px' }}>{item.text}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'right', width: '200px' }}>
                    {adlStatusOptions.find(o => o.value === adlData[item.id])?.label || "Not assessed"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>Basic Activities of Daily Living (BADLs)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <tbody>
              {badlItems.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px 4px' }}>{item.text}</td>
                  <td style={{ padding: '6px 4px', textAlign: 'right', width: '200px' }}>
                    {adlStatusOptions.find(o => o.value === adlData[item.id])?.label || "Not assessed"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Questions for Doctor */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '15px' }}>
            Suggested Questions for Healthcare Provider
          </h2>
          <ul style={{ fontSize: '14px', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>Based on these symptoms, what type(s) of dementia should we be considering?</li>
            <li style={{ marginBottom: '8px' }}>What additional testing would help clarify the diagnosis? (cognitive testing, brain imaging, blood work)</li>
            <li style={{ marginBottom: '8px' }}>Have reversible causes been ruled out? (B12 deficiency, thyroid, medication side effects, depression, UTI)</li>
            {scores.lewy?.core >= 2 && (
              <li style={{ marginBottom: '8px', fontWeight: '600' }}>
                Given potential LBD indicators: Are there medications to avoid, particularly antipsychotics?
              </li>
            )}
            <li style={{ marginBottom: '8px' }}>What is the likely progression, and what should we prepare for?</li>
            <li style={{ marginBottom: '8px' }}>Are there treatment options that could help with current symptoms?</li>
            <li style={{ marginBottom: '8px' }}>Should we consult with a neurologist or dementia specialist?</li>
          </ul>
        </div>

        {/* Additional Notes */}
        {medicalHistory.additionalNotes && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '15px' }}>
              Additional Observations / Notes
            </h2>
            <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{medicalHistory.additionalNotes}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #ddd', paddingTop: '15px', fontSize: '11px', color: '#888' }}>
          <p style={{ margin: '0 0 5px 0' }}>
            <strong>Disclaimer:</strong> This report is based on caregiver observations and is intended to facilitate 
            discussion with healthcare providers. It is not a diagnostic tool. Dementia diagnosis requires comprehensive 
            medical evaluation including cognitive testing, imaging, and clinical assessment.
          </p>
          <p style={{ margin: 0 }}>
            Symptom associations based on: NIA-AA Alzheimer's criteria (2024), DLB Consortium 4th consensus (2017), 
            International bvFTD Criteria Consortium, NINDS-AIREN vascular dementia criteria.
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // SOURCES VIEW COMPONENT
  // ============================================
  
  if (showSourcesView) {
    // Group symptoms by category for better organization
    const symptomsByCategory = {};
    globalSymptoms.forEach(s => {
      if (!symptomsByCategory[s.category]) {
        symptomsByCategory[s.category] = [];
      }
      symptomsByCategory[s.category].push(s);
    });

    return (
      <div style={{
        fontFamily: "'Georgia', serif",
        padding: '40px',
        maxWidth: '900px',
        margin: '0 auto',
        background: 'white',
        color: '#1a1a1a',
        lineHeight: '1.6'
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600&family=DM+Sans:wght@400;500;600&display=swap');
        `}</style>
        
        {/* Back Button */}
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000
        }}>
          <button
            onClick={() => setShowSourcesView(false)}
            style={{
              padding: '12px 24px',
              background: '#3D7A5A',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif"
            }}
          >
            ← Back to Tool
          </button>
        </div>

        {/* Header */}
        <div style={{ borderBottom: '2px solid #2D2A26', paddingBottom: '20px', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', fontWeight: '600' }}>
            Sources & Methodology
          </h1>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            Research basis for symptom indicators and diagnostic criteria
          </p>
        </div>

        {/* Overview Section */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '15px' }}>
            Overview
          </h2>
          <p style={{ fontSize: '15px', marginBottom: '15px', lineHeight: '1.7' }}>
            This tool is designed to help caregivers document and organize observations about cognitive and functional changes 
            to facilitate discussions with healthcare providers. The symptom indicators and their associations with specific 
            dementia types are based on established diagnostic criteria and peer-reviewed research.
          </p>
          <div style={{ background: '#FFF8E1', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #F57F17', marginBottom: '20px' }}>
            <p style={{ fontSize: '14px', margin: 0, color: '#5C5550' }}>
              <strong style={{ color: '#8B6914' }}>Important:</strong> This tool is not a diagnostic instrument. 
              Dementia diagnosis requires comprehensive medical evaluation including cognitive testing, neuroimaging, 
              laboratory studies, and clinical assessment by qualified healthcare professionals.
            </p>
          </div>
        </div>

        {/* Primary Diagnostic Frameworks */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '15px' }}>
            Primary Diagnostic Frameworks
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', background: '#F8F7F5', borderRadius: '8px', borderLeft: `4px solid ${dementiaTypes.alzheimers.color}` }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: dementiaTypes.alzheimers.color }}>
                Alzheimer's Disease
              </h3>
              <ul style={{ fontSize: '14px', margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                <li><strong>NIA-AA Research Framework (2018)</strong> - National Institute on Aging and Alzheimer's Association diagnostic criteria</li>
                <li><strong>Core cognitive domains:</strong> Learning/memory, language, executive function, visuospatial, social cognition</li>
                <li><strong>Key criterion:</strong> Impaired ability to acquire and retain new information (episodic memory)</li>
                <li><strong>Alzheimer's Association 10 Warning Signs</strong> - Clinical observation guidelines</li>
                <li><strong>McKhann et al. (2011)</strong> - Recommendations for diagnosis of Alzheimer's disease</li>
              </ul>
            </div>

            <div style={{ padding: '16px', background: '#F8F7F5', borderRadius: '8px', borderLeft: `4px solid ${dementiaTypes.vascular.color}` }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: dementiaTypes.vascular.color }}>
                Vascular Dementia
              </h3>
              <ul style={{ fontSize: '14px', margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                <li><strong>NINDS-AIREN Criteria</strong> - National Institute of Neurological Disorders and Stroke international criteria</li>
                <li><strong>Key differentiator:</strong> Attention and executive dysfunction often MORE prominent than memory impairment</li>
                <li><strong>Vascular Cognitive Impairment (VCI) Statement (2011)</strong> - AHA/ASA Scientific Statement</li>
                <li><strong>Subcortical vascular dementia features</strong> - Psychomotor slowing, gait disturbance, executive dysfunction</li>
                <li><strong>Stepwise progression pattern</strong> - Decline in "steps" following vascular events vs. gradual AD decline</li>
              </ul>
            </div>

            <div style={{ padding: '16px', background: '#F8F7F5', borderRadius: '8px', borderLeft: `4px solid ${dementiaTypes.lewy.color}` }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: dementiaTypes.lewy.color }}>
                Lewy Body Dementia
              </h3>
              <ul style={{ fontSize: '14px', margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                <li><strong>DLB Consortium 4th Consensus Criteria (2017)</strong> - McKeith et al., Neurology - defines core and supportive features</li>
                <li><strong>Core features:</strong> Fluctuating cognition, recurrent visual hallucinations, REM sleep behavior disorder, parkinsonism</li>
                <li><strong>Supportive clinical features:</strong> severe antipsychotic sensitivity, excessive daytime sleepiness, hyposmia, autonomic dysfunction, transient unresponsiveness</li>
                <li><strong>Indicative biomarkers</strong> — a different and stronger category, since one alone can raise <em>possible</em> to <em>probable</em> DLB: reduced dopamine-transporter uptake on SPECT/PET (sensitivity 78%, specificity 90%), reduced MIBG cardiac scintigraphy (69% / 87%), and polysomnography-confirmed REM sleep without atonia. <strong>Antipsychotic sensitivity is not one of them</strong> — an earlier version of this tool stated that it was.</li>
                <li><strong>Key differentiator from AD:</strong> attention, executive and visual-processing deficits are disproportionate relative to memory and naming, which tend to be less affected in DLB</li>
                <li><strong>REM sleep behaviour disorder</strong> — present in 76% of autopsy-confirmed DLB vs 4% of non-DLB; given increased diagnostic weight in the 2017 consensus</li>
              </ul>
            </div>

            <div style={{ padding: '16px', background: '#F8F7F5', borderRadius: '8px', borderLeft: `4px solid ${dementiaTypes.bvftd.color}` }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: dementiaTypes.bvftd.color }}>
                Frontotemporal Dementia (behavioural) and Primary Progressive Aphasia
              </h3>
              <ul style={{ fontSize: '14px', margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                <li><strong>Rascovsky et al. (2011), Brain</strong> — International bvFTD Criteria Consortium, developed from over 400 histopathologically confirmed FTLD cases. Reported sensitivity 76% for probable and 86% for possible bvFTD.</li>
                <li><strong>Six bvFTD features:</strong> disinhibition; apathy or inertia; loss of sympathy or empathy; perseverative, stereotyped or compulsive behaviour; hyperorality and dietary change; dysexecutive profile with relative sparing of episodic memory. Three of six are required for <em>possible</em> bvFTD.</li>
                <li><strong>Caveat on memory:</strong> the "relative sparing of episodic memory" criterion is increasingly challenged, as memory impairment is now recognised as common in bvFTD. This tool treats amnesia as a lean against bvFTD, not an exclusion.</li>
                <li><strong>Gorno-Tempini et al. (2011), Neurology</strong> — PPA classification. Non-fluent/agrammatic and semantic variants are scored as their own type rather than pooled with behavioural FTD, since the two presentations need very different support.</li>
                <li><strong>Bathgate et al. (2001)</strong> — sweet food preference, gluttony, personal neglect, loss of emotion and stereotypies were the behaviours that most strongly separated FTD from AD and vascular dementia.</li>
              </ul>
            </div>

            <div style={{ padding: '16px', background: '#F8F7F5', borderRadius: '8px', borderLeft: `4px solid ${dementiaTypes.mixed.color}` }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: dementiaTypes.mixed.color }}>
                Mixed Dementia
              </h3>
              <ul style={{ fontSize: '14px', margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                <li><strong>Alzheimer's Association mixed dementia guidelines</strong> - Combined AD + vascular pathology recognition</li>
                <li><strong>Harmonisation of six community-based autopsy cohorts</strong> (Lancet Healthy Longevity, 2023) — 2,443 of 2,695 decedents (91%) carried more than one of six key neuropathologies, and 1,106 (41%) carried three or more. Among those with severe Alzheimer's pathology, 85% had at least one additional pathology, most often LATE (53%).</li>
                <li><strong>Rush Memory and Aging Project / ROS-MAP</strong> — community-based clinical-pathologic cohorts establishing that mixed pathology, not pure single-pathology disease, is the norm in later life.</li>
                <li><strong>Why "Age 80+" was removed as a scored item:</strong> at that age mixed pathology is close to universal, and a near-universal finding carries almost no power to discriminate between types. Scoring it simply added a point to Mixed for every older adult assessed.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Methodology */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '15px' }}>
            Methodology
          </h2>
          
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>Evidence tiers (per type, not per symptom)</h3>
          <p style={{ fontSize: '14px', marginBottom: '10px', lineHeight: '1.6' }}>
            Each symptom is graded separately <em>for each type it relates to</em>, because the same finding can be
            decisive for one disease and meaningless for another:
          </p>
          <ul style={{ fontSize: '14px', marginBottom: '15px', paddingLeft: '20px', lineHeight: '1.6' }}>
            <li><strong>Core criterion (★)</strong> — a formal diagnostic criterion in the published consensus criteria. Weight 3.</li>
            <li><strong>Supportive</strong> — listed as a supportive or suggestive feature, or well replicated without being a formal criterion. Weight 2.</li>
            <li><strong>Non-specific (°)</strong> — genuinely occurs in this type, but is too widespread across types to help tell them apart. Weight 1.</li>
          </ul>
          <p style={{ fontSize: '14px', marginBottom: '15px', lineHeight: '1.6' }}>
            An earlier version of this tool used a single <em>discriminating: true/false</em> flag per symptom, shared
            across every type that symptom mapped to. That could not express, for example, that visuospatial impairment
            is a core defining feature of posterior cortical atrophy, part of the typical cognitive profile in dementia
            with Lewy bodies, and a late non-specific finding in typical Alzheimer's — so all three received identical
            credit.
          </p>

          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>Scoring approach</h3>
          <p style={{ fontSize: '14px', marginBottom: '10px', lineHeight: '1.6' }}>
            Each type gets a <strong>profile match</strong>: the weighted share of its own defining features that are
            present. Non-specific findings corroborate when present but are excluded from the denominator, since not
            having them should not count against a type. Types are then ordered by profile match combined with how many
            of their core criteria are met.
          </p>
          <p style={{ fontSize: '14px', marginBottom: '10px', lineHeight: '1.6' }}>
            Core evidence is counted per <strong>criterion</strong>, not per question. Published criteria are threshold
            rules over named features — probable Lewy body dementia needs 2 of 4 core clinical features, possible bvFTD
            needs 3 of 6 — and several questions here can satisfy one feature. Rest tremor and rigidity both satisfy the
            single parkinsonism feature, exactly as the 2017 consortium specifies, so someone with rigidity alone is not
            scored as having half a feature.
          </p>
          <p style={{ fontSize: '14px', marginBottom: '15px', lineHeight: '1.6' }}>
            This matters more than it sounds. Counting checkboxes made a type's score depend on how finely its criteria
            had been split into questions. On plain amnestic memory loss — the commonest presentation in dementia —
            LATE outranked Alzheimer's on the two items that are Alzheimer's <em>own</em> core criteria, purely because
            it had three core boxes to Alzheimer's four. Counting criteria instead makes the ranking independent of how
            the questions were written.
          </p>
          <p style={{ fontSize: '14px', marginBottom: '15px', lineHeight: '1.6' }}>
            This replaced a ranking based on raw counts of discriminating symptoms. Because the number of such symptoms
            differed sharply by type, that comparison was between unequal denominators, and the rarest diseases were
            structurally favoured over the commonest ones.
          </p>

          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>How prevalence is used</h3>
          <p style={{ fontSize: '14px', marginBottom: '15px', lineHeight: '1.6' }}>
            When two types are within 20% of each other on symptom evidence — close enough that the symptoms cannot
            really separate them — how common each disease is decides the order, and the tool says so explicitly rather
            than adjusting silently. Outside that band, evidence alone decides: a strong match for a rare type is never
            demoted just for being rare. Prevalence is applied only to <em>ordering</em>, never to the profile match
            figures shown.
          </p>

          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>Counter-evidence</h3>
          <p style={{ fontSize: '14px', marginBottom: '15px', lineHeight: '1.6' }}>
            A few items argue <em>against</em> a type rather than for it — losing weight and appetite counts against
            behavioural FTD, where increased intake is characteristic. These reduce that type's score and are listed
            explicitly in the analysis, so the reasoning is visible rather than buried.
          </p>

          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>Question types</h3>
          <p style={{ fontSize: '14px', marginBottom: '15px', lineHeight: '1.6' }}>
            Items are not all the same kind of thing, so they no longer share one set of follow-up questions. A
            recurring symptom is asked when it started, how often it happens and what it prevents. An ongoing deficit is
            asked about direction of travel instead of frequency, since "how often can they not learn new information"
            has no answer. A past event is asked only when it happened. An item that already describes the course of the
            illness is asked nothing further, because asking when you first noticed a years-long gradual decline is
            circular. Severity options are anchored to what the person can still do, rather than an unlabelled
            mild/moderate/severe scale that two carers would apply differently.
          </p>

          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>What this tool will not do</h3>
          <p style={{ fontSize: '14px', marginBottom: '15px', lineHeight: '1.6' }}>
            It will not name a leading type until enough has been recorded for the ordering to mean anything, and it
            reports when the top two are too close to separate. Several of the types listed — LATE in particular —
            cannot be confirmed during life outside research settings. And no amount of symptom matching substitutes for
            excluding the treatable causes covered in the Red Flags section.
          </p>

          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>Stage Estimation</h3>
          <p style={{ fontSize: '14px', marginBottom: '15px', lineHeight: '1.6' }}>
            Functional staging is based on Activities of Daily Living (ADL) assessment, using established instruments:
          </p>
          <ul style={{ fontSize: '14px', marginBottom: '15px', paddingLeft: '20px', lineHeight: '1.6' }}>
            <li><strong>Lawton IADL Scale</strong> - Instrumental Activities of Daily Living (complex tasks)</li>
            <li><strong>Katz ADL Index</strong> - Basic Activities of Daily Living (self-care)</li>
            <li><strong>Clinical Dementia Rating (CDR)</strong> - Staging framework reference</li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>Corrections made in this revision</h3>
          <p style={{ fontSize: '14px', marginBottom: '10px', lineHeight: '1.6' }}>
            The symptom set was audited against the primary criteria papers. These items were wrong or mis-weighted and
            have been changed:
          </p>
          <ul style={{ fontSize: '14px', marginBottom: '15px', paddingLeft: '20px', lineHeight: '1.7' }}>
            <li><strong>Antipsychotic sensitivity was described as an "indicative biomarker" for DLB.</strong> It is not. DLB 2017 classifies it as a supportive clinical feature; the indicative biomarkers are reduced dopamine-transporter uptake, reduced MIBG cardiac scintigraphy, and polysomnography-confirmed REM sleep without atonia. Its score was reduced, but the safety warning was kept prominent — the clinical risk is unchanged.</li>
            <li><strong>"FTD is the most common cause of dementia under 65" was stated as fact.</strong> It is not correct. Alzheimer's disease is the most common cause of young-onset dementia (roughly 40–50%); per 100,000 people aged 30–64 the estimates are approximately AD 41, vascular 15, FTD 2. Onset before 65 now raises the likelihood of bvFTD, PPA and PCA relative to their own base rates, without implying they overtake AD.</li>
            <li><strong>Stroke/TIA and "known cardiovascular disease" shared one checkbox.</strong> A documented stroke with decline persisting beyond three months is a VASCOG diagnostic criterion; treated hypertension is a risk factor. They are now separate items, and the cardiovascular risk factors are collected once in Medical History instead of also being scored here.</li>
            <li><strong>Excessive daytime sleepiness was weighted as a key DLB discriminator.</strong> DLB 2017 lists it as supportive. Downgraded.</li>
            <li><strong>Early urinary symptoms were weighted as non-discriminating for vascular disease.</strong> VASCOG 2014 criterion A2b lists early urinary frequency and urgency as a formal supporting criterion alongside gait disturbance. Upgraded, with "early" made explicit — late incontinence is universal and carries no information.</li>
            <li><strong>Cranial radiation was listed as a vascular dementia indicator.</strong> Radiation-induced leukoencephalopathy is a distinct cause that produces a similar subcortical white-matter picture through shared endothelial injury. Kept alongside the vascular profile, but relabelled so it is not mistaken for the same diagnosis.</li>
            <li><strong>Five of the ten Mixed Dementia items double-counted.</strong> "Stroke or TIA AND gradual decline" was simply two other items combined; "multiple cardiovascular risk factors" duplicated Medical History. "Age 80+" was removed because mixed pathology past 80 is near-universal and therefore carries almost no discriminating power.</li>
            <li><strong>Stepwise decline was the main route to a vascular result.</strong> VASCOG explicitly notes that small-vessel disease often produces gradual onset and slow progression, so absence of stepwise decline does not rule vascular disease out. Physical stroke signs and the gait/urinary criteria are now scored in their own right.</li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>Types added</h3>
          <ul style={{ fontSize: '14px', marginBottom: '15px', paddingLeft: '20px', lineHeight: '1.7' }}>
            <li><strong>Primary Progressive Aphasia</strong> split out from behavioural FTD (Gorno-Tempini et al., 2011). A language-led presentation previously scored as behavioural FTD.</li>
            <li><strong>Posterior cortical atrophy</strong> (Crutch et al., 2017) — the visual-led Alzheimer's variant. Visuospatial complaints previously had nowhere accurate to land.</li>
            <li><strong>LATE</strong> (Nelson et al., Brain 2019) — an amnestic syndrome of the oldest old found in roughly 40% of brains past 85, which previously scored silently as Alzheimer's.</li>
            <li><strong>Reversible mimics and red flags</strong> — delirium, depression, normal pressure hydrocephalus, medication burden, B12 and thyroid deficiency, alcohol, head injury, sleep apnoea. These were entirely absent, despite being the one category where the answer changes treatment.</li>
          </ul>
        </div>

        {/* Detailed Symptom Evidence */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '15px' }}>
            Symptom Evidence by Category
          </h2>
          
          {Object.entries(symptomsByCategory).map(([category, symptoms]) => (
            <div key={category} style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#2D2A26' }}>
                {category}
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8F7F5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '10px 8px', width: '35%' }}>Symptom</th>
                    <th style={{ textAlign: 'center', padding: '10px 8px', width: '15%' }}>Types</th>
                    <th style={{ textAlign: 'center', padding: '10px 8px', width: '10%' }}>Core?</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', width: '40%' }}>Evidence Source</th>
                  </tr>
                </thead>
                <tbody>
                  {symptoms.map(symptom => (
                    <tr key={symptom.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                        {symptom.text}
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px 8px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                          {Object.entries(symptom.types).map(([t, tier]) => (
                            <span key={t} title={EVIDENCE_LABELS[tier]} style={{
                              padding: '2px 6px',
                              background: `${dementiaTypes[t].color}20`,
                              color: dementiaTypes[t].color,
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '600',
                              fontFamily: "'DM Sans', sans-serif",
                              opacity: tier === 'common' ? 0.6 : 1
                            }}>
                              {dementiaTypes[t].shortName}
                              {tier === 'core' ? '★' : tier === 'common' ? '°' : ''}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px 8px', verticalAlign: 'top' }}>
                        {isCoreAnywhere(symptom) ? (
                          <span style={{ color: '#B87333', fontWeight: '600' }}>★</span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '10px 8px', fontSize: '12px', color: '#666', verticalAlign: 'top', lineHeight: '1.5' }}>
                        {symptom.evidence}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Additional References */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '15px' }}>
            Additional References
          </h2>
          <ul style={{ fontSize: '14px', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li>Alzheimer's Association. (2024). <em>2024 Alzheimer's Disease Facts and Figures.</em></li>
            <li>McKhann GM, et al. (2011). The diagnosis of dementia due to Alzheimer's disease. <em>Alzheimer's & Dementia, 7</em>(3), 263-269.</li>
            <li>McKeith IG, et al. (2017). Diagnosis and management of dementia with Lewy bodies: Fourth consensus report. <em>Neurology, 89</em>(1), 88-100.</li>
            <li>Rascovsky K, et al. (2011). Sensitivity of revised diagnostic criteria for the behavioural variant of frontotemporal dementia. <em>Brain, 134</em>(9), 2456-2477.</li>
            <li>Román GC, et al. (1993). Vascular dementia: diagnostic criteria for research studies. <em>Neurology, 43</em>(2), 250-260.</li>
            <li>Schneider JA, et al. (2007). Mixed brain pathologies account for most dementia cases in community-dwelling older persons. <em>Neurology, 69</em>(24), 2197-2204.</li>
            <li>Kapasi A, et al. (2017). Impact of multiple pathologies on the threshold for clinically overt dementia. <em>Acta Neuropathologica, 134</em>(2), 171-186.</li>
            <li>Livingston G, et al. (2020). Dementia prevention, intervention, and care: 2020 report of the Lancet Commission. <em>The Lancet, 396</em>(10248), 413-446.</li>
          </ul>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #ddd', paddingTop: '15px', fontSize: '12px', color: '#888' }}>
          <p style={{ margin: 0 }}>
            This information is provided for educational purposes to support informed discussions with healthcare providers. 
            Always consult qualified medical professionals for diagnosis and treatment decisions.
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN INTERACTIVE VIEW
  // ============================================
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FAF7F2 0%, #F0EDE5 100%)',
      fontFamily: "'Crimson Pro', Georgia, serif",
      paddingBottom: '40px'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap');
        
        * { box-sizing: border-box; }
        
        .card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
        }
        
        .tab-btn {
          padding: 12px 20px;
          border: none;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #6B6660;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
        }
        
        .tab-btn:hover {
          color: #2D2A26;
        }
        
        .tab-btn.active {
          color: #3D7A5A;
          border-bottom-color: #3D7A5A;
        }
        
        .checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid #F5F3F0;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        
        .checkbox-row:hover {
          background: rgba(0,0,0,0.02);
        }
        
        .checkbox-row:last-child {
          border-bottom: none;
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
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        
        .detail-select {
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          background: white;
          cursor: pointer;
          min-width: 140px;
        }
        
        .detail-select:focus {
          outline: none;
          border-color: #3D7A5A;
        }
        
        .form-input {
          padding: 10px 14px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          width: 100%;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #3D7A5A;
        }
        
        .form-checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        
        .category-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          cursor: pointer;
          border-bottom: 1px solid #F0EDE8;
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

        .summary-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #3D7A5A;
          background: white;
          border: 1px solid #3D7A5A55;
          border-radius: 10px;
          padding: 2px 10px;
          cursor: pointer;
        }
        .summary-btn:hover { background: #EDF5F0; }
        
        .adl-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #F5F3F0;
        }
        
        .adl-row:last-child {
          border-bottom: none;
        }
      `}</style>

      {/* Header */}
      <div style={{ 
        background: 'white', 
        borderBottom: '1px solid #E8E5E0',
        padding: '20px 24px',
        marginBottom: '20px'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#2D2A26',
              margin: '0 0 8px 0'
            }}>
              Dementia Symptom Assessment Tool
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              color: '#6B6660',
              margin: 0
            }}>
              Document symptoms, medical history, and functional status to prepare for healthcare discussions.
              <button
                onClick={() => setShowSourcesView(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7B6B8D',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginLeft: '8px',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                View Sources & Methodology
              </button>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {saveStatus && (
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px',
                color: saveStatus.includes('Error') ? '#C62828' : '#2E7D32',
                fontWeight: '500'
              }}>
                {saveStatus}
              </span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
            <button
              onClick={exportData}
              title="Save a copy of this assessment to a file you control"
              style={{
                padding: '10px 16px',
                background: 'white',
                color: '#3D7A5A',
                border: '1.5px solid #3D7A5A',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
            <button
              onClick={() => { setImportError(''); fileInputRef.current?.click(); }}
              title="Load an assessment from a file you exported earlier"
              style={{
                padding: '10px 16px',
                background: 'white',
                color: '#5F7A8C',
                border: '1.5px solid #5F7A8C',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Import
            </button>
            <button
              onClick={saveData}
              style={{
                padding: '10px 20px',
                background: '#3D7A5A',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#2D5A43'}
              onMouseLeave={(e) => e.target.style.background = '#3D7A5A'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save
            </button>
            <button
              onClick={clearData}
              style={{
                padding: '10px 20px',
                background: '#6B6660',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#5A5550'}
              onMouseLeave={(e) => e.target.style.background = '#6B6660'}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px' }}>
        
        {importError && (
          <div className="card" style={{
            padding: '12px 16px', marginBottom: '16px',
            borderLeft: '4px solid #B3261E', background: '#FEF4F3'
          }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#8C1D18', margin: 0 }}>
              <strong>Could not import that file.</strong> {importError}
            </p>
          </div>
        )}

        {/* Import replaces everything currently entered. It shows what is in the
            file AND what is about to be lost, because overwriting someone's
            records without showing them the trade is how data disappears. */}
        {pendingImport && (
          <div className="card" style={{
            padding: '18px', marginBottom: '16px',
            borderLeft: '4px solid #5F7A8C', background: '#F5F8FA'
          }}>
            <h3 style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
              color: '#2D2A26', margin: '0 0 10px 0'
            }}>
              Load this assessment?
            </h3>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#8B8680', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  In the file
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#2D2A26', marginTop: '4px', lineHeight: '1.6' }}>
                  {pendingImport.summary.patientName && <><strong>{pendingImport.summary.patientName}</strong><br /></>}
                  {pendingImport.summary.symptoms} symptom{pendingImport.summary.symptoms === 1 ? '' : 's'}
                  {pendingImport.summary.redFlags > 0 && <>, {pendingImport.summary.redFlags} red flag{pendingImport.summary.redFlags === 1 ? '' : 's'}</>}
                  {pendingImport.summary.adls > 0 && <>, {pendingImport.summary.adls} functional item{pendingImport.summary.adls === 1 ? '' : 's'}</>}
                  {pendingImport.summary.exportedAt && (
                    <><br /><span style={{ color: '#8B8680' }}>
                      exported {new Date(pendingImport.summary.exportedAt).toLocaleDateString()}
                    </span></>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#8B8680', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Currently entered
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: checkedCount > 0 ? '#A05252' : '#8B8680', marginTop: '4px', lineHeight: '1.6' }}>
                  {checkedCount} symptom{checkedCount === 1 ? '' : 's'}
                  {checkedCount > 0 ? ' — this will be replaced' : ' — nothing to lose'}
                </div>
              </div>
            </div>

            {pendingImport.summary.dropped > 0 && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#8B6914', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                {pendingImport.summary.dropped} item{pendingImport.summary.dropped === 1 ? '' : 's'} in the file
                {pendingImport.summary.dropped === 1 ? ' is' : ' are'} no longer part of the assessment and will not be loaded.
              </p>
            )}

            {pendingImport.summary.upgraded && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B6660', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                This file was made by an earlier version. It will be brought up to date on load — worth
                re-checking any timing or impact answers afterwards.
              </p>
            )}

            {checkedCount > 0 && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#A05252', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                Export what you have now first if you want to keep it.
              </p>
            )}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={confirmImport}
                style={{
                  padding: '9px 18px', background: '#5F7A8C', color: 'white', border: 'none',
                  borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                  fontFamily: "'DM Sans', sans-serif", cursor: 'pointer'
                }}
              >
                Replace with this file
              </button>
              <button
                onClick={() => setPendingImport(null)}
                style={{
                  padding: '9px 18px', background: 'white', color: '#6B6660',
                  border: '1px solid #E8E5E0', borderRadius: '8px', fontSize: '13px',
                  fontWeight: '600', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Mode selector. The short screen exists because a 62-item checklist is
            a real barrier for someone doing this at a kitchen table; the honest
            trade-off is stated rather than buried. */}
        <div className="card" style={{ padding: '16px 18px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {[
              { key: 'quick', title: 'Quick screen', meta: `${quickSymptoms.length} questions · 2–3 min` },
              { key: 'full', title: 'Full assessment', meta: `${globalSymptoms.length} questions · 15–25 min` },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => { setMode(opt.key); setModeChosen(true); }}
                style={{
                  flex: '1 1 200px',
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  border: mode === opt.key ? '2px solid #3D7A5A' : '1px solid #E8E5E0',
                  background: mode === opt.key ? '#F3F8F5' : 'white'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '600', color: mode === opt.key ? '#2C5B43' : '#4A4744' }}>
                  {opt.title}
                </div>
                <div style={{ fontSize: '11px', color: '#8B8680', marginTop: '2px' }}>{opt.meta}</div>
              </button>
            ))}
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px',
            color: '#6B6660',
            margin: 0,
            lineHeight: '1.5'
          }}>
            {mode === 'quick'
              ? `The quick screen keeps the highest-value question for each subtype and drops the rest. It will point you in a direction, but it has fewer ways to tell close alternatives apart — expect more ties and lower confidence. Nothing is lost by switching to the full assessment later; your answers carry over.`
              : `The full assessment includes every item, including the low-specificity ones that help confirm a picture rather than distinguish it.`}
          </p>
        </div>

        {migrationNotice && (
          <div className="card" style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderLeft: '4px solid #5F7A8C',
            background: '#F5F8FA'
          }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#5C5550', margin: 0, lineHeight: '1.5' }}>
              <strong>Your earlier answers were carried over.</strong> The questions have been revised against the
              current diagnostic criteria, so a few items were removed and the timing/severity fields changed shape.
              Where an old answer had no exact equivalent it was mapped to the closest new option — worth a quick
              re-check of anything you had filled in detail.
            </p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="card" style={{ marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #F0EDE8' }}>
            <button 
              className={`tab-btn ${activeTab === 'symptoms' ? 'active' : ''}`}
              onClick={() => setActiveTab('symptoms')}
            >
              Symptoms
            </button>
            <button 
              className={`tab-btn ${activeTab === 'flags' ? 'active' : ''}`}
              onClick={() => setActiveTab('flags')}
            >
              Red Flags
              {flaggedRedFlags.length > 0 && (
                <span style={{
                  marginLeft: '6px',
                  background: '#B3261E',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '10px',
                  fontWeight: '700'
                }}>{flaggedRedFlags.length}</span>
              )}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Medical History
            </button>
            <button 
              className={`tab-btn ${activeTab === 'adl' ? 'active' : ''}`}
              onClick={() => setActiveTab('adl')}
            >
              Functional Status
            </button>
            <button 
              className={`tab-btn ${activeTab === 'stage' ? 'active' : ''}`}
              onClick={() => setActiveTab('stage')}
            >
              Stage Estimation
            </button>
            <button 
              className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
              onClick={() => setActiveTab('report')}
            >
              Generate Report
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* SYMPTOMS TAB */}
        {/* ============================================ */}
        {activeTab === 'symptoms' && (
          <>
            {/* Warning */}
            <div className="card" style={{
              padding: '14px 18px',
              marginBottom: '16px',
              borderLeft: '4px solid #C75050',
              background: '#FDF8F8'
            }}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                color: '#5C5550',
                margin: 0,
                lineHeight: '1.5'
              }}>
                <strong style={{ color: '#A03030' }}>For healthcare discussions only.</strong> Tick what you have actually
                observed, then fill in the follow-up questions — they differ per item, because a past event, an ongoing
                difficulty and a recurring symptom are not the same kind of thing. This organises what you have seen into
                something a clinician can work from. It cannot diagnose, and it is not a substitute for assessment.
              </p>
            </div>

            {/* Pattern analysis -- see components/AnalysisPanels.jsx. */}
            {hasAnyChecked && (
              <div className="card" style={{ padding: '18px', marginBottom: '16px' }}>
                <PatternAnalysis
                  scores={scores}
                  sortedTypes={sortedTypes}
                  leadingType={leadingType}
                  confidence={confidence}
                  ranking={ranking}
                  unexplored={unexplored}
                  headerExtra={
                    <button className="summary-btn" onClick={() => setShowSummaryView(true)}>
                      Print one-page summary
                    </button>
                  }
                />
              </div>
            )}

            {/* Safety flags, shown regardless of ranking. */}
            {safetyFlags.map(flag => (
              <div key={flag.id} className="card" style={{
                padding: '14px 18px',
                marginBottom: '16px',
                borderLeft: '4px solid #D4A017',
                background: '#FFFEF5'
              }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#5C5550', margin: 0, lineHeight: '1.5' }}>
                  <strong style={{ color: '#8B6914' }}>⚠️ {flag.title}: </strong>{flag.body}
                </p>
              </div>
            ))}

            {/* Prompt toward the reversible causes, which matter more than the
                subtype comparison when they apply. */}
            {hasAnyChecked && flaggedRedFlags.length === 0 && (
              <div className="card" style={{
                padding: '14px 18px',
                marginBottom: '16px',
                borderLeft: '4px solid #5F7A8C',
                background: '#F5F8FA'
              }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#5C5550', margin: 0, lineHeight: '1.5' }}>
                  <strong>Before reading anything into the ranking above,</strong> work through the{' '}
                  <button
                    onClick={() => setActiveTab('flags')}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#3D6B8C', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}
                  >Red Flags tab</button>. Some causes of confusion are treatable, and a few need urgent attention —
                  those change what to do next far more than which subtype fits best.
                </p>
              </div>
            )}

            {/* Spider Chart */}
            {hasAnyChecked && (
              <div className="card" style={{ padding: '18px', marginBottom: '16px' }}>
                <h3 style={{ ...sectionHeading, marginBottom: '14px' }}>
                  Subtype Profile Chart
                </h3>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <ProfileChart scores={scores} />
                </div>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '11px',
                  color: '#8B8680',
                  textAlign: 'center',
                  margin: '8px 0 0 0'
                }}>
                  {PROFILE_CHART_CAPTION}
                </p>
              </div>
            )}

            {/* The antipsychotic warning now comes from activeSafetyFlags() and
                is rendered once, above. It also fires when a bad reaction has
                already been recorded, not only on core-feature count. */}

            {/* Dementia Subtype Information Tiles */}
            <div className="card" style={{ padding: '18px', marginBottom: '16px' }}>
              <h3 style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px',
                color: '#6B6660',
                margin: '0 0 14px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: '600'
              }}>
                Dementia Subtypes Reference
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {Object.entries(dementiaTypes).map(([key, type]) => {
                  const typeScore = scores[key];
                  const isTopMatch = sortedTypes[0] === key && typeScore?.core > 0;
                  return (
                    <div 
                      key={key}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '8px',
                        border: isTopMatch ? `2px solid ${type.color}` : '1px solid #E8E5E0',
                        background: isTopMatch ? `${type.color}08` : '#FAFAF9',
                        position: 'relative'
                      }}
                    >
                      {isTopMatch && (
                        <span style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '12px',
                          background: type.color,
                          color: 'white',
                          fontSize: '10px',
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: '600',
                          padding: '2px 8px',
                          borderRadius: '10px'
                        }}>
                          TOP MATCH
                        </span>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '3px',
                          background: type.color,
                          flexShrink: 0
                        }} />
                        <h4 style={{ 
                          fontSize: '15px', 
                          fontWeight: '600', 
                          color: '#2D2A26', 
                          margin: 0 
                        }}>
                          {type.name}
                        </h4>
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '11px',
                          color: '#8B8680',
                          marginLeft: 'auto'
                        }}>
                          {type.shortName}
                        </span>
                      </div>
                      <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '12px',
                        color: '#6B6660',
                        margin: '0 0 10px 0',
                        lineHeight: '1.4'
                      }}>
                        {type.description}
                      </p>
                      <div style={{
                        padding: '10px 12px',
                        background: 'white',
                        borderRadius: '6px',
                        borderLeft: `3px solid ${type.color}`
                      }}>
                        <p style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '11px',
                          fontWeight: '600',
                          color: type.color,
                          margin: '0 0 4px 0',
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px'
                        }}>
                          Key Distinguishing Feature
                        </p>
                        <p style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '12px',
                          color: '#4A4744',
                          margin: 0,
                          lineHeight: '1.4'
                        }}>
                          {type.keyFeature}
                        </p>
                      </div>
                      {typeScore && typeScore.total > 0 && (
                        <div style={{
                          marginTop: '10px',
                          paddingTop: '10px',
                          borderTop: '1px solid #E8E5E0'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#8B8680' }}>
                              Your matches:
                            </span>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600', color: type.color }}>
                              {Math.round(typeScore.profileMatch)}% match{typeScore.maxCore > 0 ? ` • ${typeScore.core}/${typeScore.maxCore} core` : ''}
                            </span>
                          </div>
                          <div className="score-bar" style={{ marginTop: '6px' }}>
                            <div className="score-fill" style={{ width: `${typeScore.profileMatch}%`, background: type.color }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Symptom Categories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categories.map(category => {
                const categorySymptoms = activeSymptoms.filter(s => s.category === category);
                const isExpanded = expandedCategories[category];
                const checkedCount = categorySymptoms.filter(s => symptomData[s.id]?.checked).length;
                
                return (
                  <div key={category} className="card" style={{ overflow: 'hidden' }}>
                    <div className="category-header" onClick={() => toggleCategory(category)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2D2A26', margin: 0 }}>
                          {category}
                        </h3>
                        <span style={{ 
                          fontFamily: "'DM Sans', sans-serif", 
                          fontSize: '12px', 
                          color: '#A8A4A0', 
                          fontStyle: 'italic',
                          fontWeight: '400'
                        }}>
                          {categorySymptoms.length} {categorySymptoms.length === 1 ? 'item' : 'items'}
                        </span>
                        {checkedCount > 0 && (
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#3D7A5A', fontWeight: '600' }}>
                            • {checkedCount} selected
                          </span>
                        )}
                      </div>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B8680" strokeWidth="2"
                        style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                    
                    {isExpanded && (
                      <div>
                        {categorySymptoms.map(symptom => {
                          const isChecked = symptomData[symptom.id]?.checked;
                          return (
                            <div key={symptom.id} className="checkbox-row" style={{ flexDirection: 'column', cursor: 'default' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%', cursor: 'pointer' }}
                                   onClick={() => toggleSymptom(symptom.id)}>
                                <div className={`custom-check ${isChecked ? 'checked' : ''}`}>
                                  {isChecked && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                      <path d="M5 12l5 5L20 7" />
                                    </svg>
                                  )}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: '14px',
                                    color: isChecked ? '#2D2A26' : '#4A4744',
                                    lineHeight: '1.4',
                                    marginBottom: '6px'
                                  }}>
                                    {symptom.text}
                                    {isCoreAnywhere(symptom) && (
                                      <span style={{ marginLeft: '8px', color: '#B87333', fontSize: '10px', fontWeight: '600' }}>
                                        HIGH-VALUE
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                    {Object.entries(symptom.types).map(([type, tier]) => (
                                      <span
                                        key={type}
                                        className="type-tag"
                                        title={`${dementiaTypes[type].name} — ${EVIDENCE_LABELS[tier]}`}
                                        style={{
                                          background: tier === 'core'
                                            ? `${dementiaTypes[type].color}22`
                                            : `${dementiaTypes[type].color}0F`,
                                          color: dementiaTypes[type].color,
                                          border: tier === 'core'
                                            ? `1px solid ${dementiaTypes[type].color}55`
                                            : '1px solid transparent',
                                          opacity: tier === 'common' ? 0.6 : 1
                                        }}
                                      >
                                        {dementiaTypes[type].shortName}
                                        {tier === 'core' && <span style={{ marginLeft: '3px' }}>★</span>}
                                      </span>
                                    ))}
                                    <span style={{
                                      fontFamily: "'DM Sans', sans-serif",
                                      fontSize: '10px',
                                      color: '#A8A4A0',
                                      marginLeft: '2px'
                                    }}>
                                      {ITEM_KINDS[symptom.kind].label}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Kind-specific detail fields.
                                  Each item declares what kind of thing it is, and
                                  only the modifiers that can be answered sensibly
                                  are rendered. A past event is asked when it
                                  happened and nothing else; an ongoing deficit is
                                  asked about direction of travel rather than "how
                                  often"; an item that already describes the course
                                  of the illness is asked nothing at all. */}
                              {isChecked && getModifiersFor(symptom).length > 0 && (
                                <div style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '14px',
                                  marginTop: '12px',
                                  marginLeft: '34px',
                                  padding: '12px 14px',
                                  background: '#F8F7F5',
                                  borderRadius: '8px'
                                }}>
                                  {getModifiersFor(symptom).map(key => {
                                    const def = MODIFIER_DEFS[key];
                                    const fieldId = `${symptom.id}-${key}`;
                                    return (
                                      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '160px', flex: '1 1 160px' }}>
                                        {/* Visible label. The previous version used the
                                            placeholder as the label, so once a value was
                                            chosen the row read "1-2 years ago / Daily /
                                            Moderate" with nothing saying which was which. */}
                                        <label
                                          htmlFor={fieldId}
                                          style={{
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontSize: '10px',
                                            fontWeight: '600',
                                            letterSpacing: '0.4px',
                                            textTransform: 'uppercase',
                                            color: '#8B8680'
                                          }}
                                        >
                                          {def.label}
                                        </label>
                                        <select
                                          id={fieldId}
                                          className="detail-select"
                                          value={symptomData[symptom.id]?.[key] || ''}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => updateSymptomDetail(symptom.id, key, e.target.value)}
                                        >
                                          <option value="">Select…</option>
                                          {def.options.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                          ))}
                                        </select>
                                        <span style={{
                                          fontFamily: "'DM Sans', sans-serif",
                                          fontSize: '10px',
                                          color: '#A8A4A0',
                                          lineHeight: '1.3'
                                        }}>
                                          {def.help}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Items that describe the course of the illness need
                                  no follow-up questions -- asking "when did you first
                                  notice that it has been gradual for years" is
                                  circular. Say so rather than leaving a blank gap. */}
                              {isChecked && getModifiersFor(symptom).length === 0 && (
                                <div style={{
                                  marginTop: '10px',
                                  marginLeft: '34px',
                                  padding: '8px 12px',
                                  background: '#F8F7F5',
                                  borderRadius: '8px',
                                  fontFamily: "'DM Sans', sans-serif",
                                  fontSize: '11px',
                                  color: '#8B8680'
                                }}>
                                  {ITEM_KINDS[symptom.kind].hint}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sticky Progress Indicator */}
            <div style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'white',
              borderTop: '1px solid #E8E5E0',
              padding: '12px 20px',
              boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
              zIndex: 100
            }}>
              <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  {/* Progress Stats */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                    <div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#8B8680', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                        Categories Covered
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', color: '#2D2A26' }}>
                        {categories.length - unexplored.length} / {categories.length}
                      </div>
                    </div>
                    <div style={{ height: '30px', width: '1px', background: '#E8E5E0' }} />
                    <div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#8B8680', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                        Symptoms Selected
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', color: '#3D7A5A' }}>
                        {checkedCount}
                      </div>
                    </div>
                    <div style={{ height: '30px', width: '1px', background: '#E8E5E0' }} />
                    <div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#8B8680', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                        With Details
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', color: '#7B6B8D' }}>
                        {detailedCount}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={{ flex: 1, maxWidth: '300px', minWidth: '150px' }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#8B8680', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Details filled in</span>
                      <span>{checkedCount === 0 ? '—' : `${Math.round((detailedCount / checkedCount) * 100)}%`}</span>
                    </div>
                    <div style={{ height: '6px', background: '#F0EDE8', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${checkedCount === 0 ? 0 : (detailedCount / checkedCount) * 100}%`,
                        background: 'linear-gradient(90deg, #3D7A5A 0%, #5B8C6F 100%)',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                  {/* Key Symptoms Count */}
                  {Object.values(symptomData).filter(s => s?.checked).length > 0 && (
                    <div style={{
                      padding: '8px 16px',
                      background: '#F8F7F5',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ color: '#B87333', fontSize: '14px' }}>★</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#5C5550' }}>
                        <strong style={{ color: '#B87333' }}>
                          {activeSymptoms.filter(s => isCoreAnywhere(s) && symptomData[s.id]?.checked).length}
                        </strong>
                        {' '}key indicators selected
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Spacer to prevent content from being hidden behind sticky bar */}
            <div style={{ height: '80px' }} />
          </>
        )}

        {/* ============================================ */}
        {/* MEDICAL HISTORY TAB */}
        {/* ============================================ */}
        {/* ============================================ */}
        {/* RED FLAGS TAB                                */}
        {/* ============================================ */}
        {activeTab === 'flags' && (
          <>
            <div className="card" style={{
              padding: '16px 18px',
              marginBottom: '16px',
              borderLeft: '4px solid #B3261E',
              background: '#FEF4F3'
            }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#5C5550', margin: 0, lineHeight: '1.6' }}>
                <strong style={{ color: '#8C1D18' }}>Check these first.</strong> Not everything that looks like dementia
                is dementia, and some causes are treatable or reversible. Delirium in particular is a medical emergency
                and is meant to be excluded before any subtype discussion. Nothing here feeds the subtype comparison —
                these are a separate question with a different answer.
              </p>
            </div>

            {flaggedRedFlags.length > 0 && (
              <div className="card" style={{ padding: '16px 18px', marginBottom: '16px' }}>
                <h3 style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B6660',
                  margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600'
                }}>
                  {flaggedRedFlags.length} to raise with the clinical team
                </h3>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {flaggedRedFlags.map(f => (
                    <li key={f.id} style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#4A4744',
                      marginBottom: '4px', lineHeight: '1.5'
                    }}>
                      {f.title}
                      <span style={{ color: RED_FLAG_URGENCY[f.urgency].color, fontWeight: '600', fontSize: '11px', marginLeft: '6px' }}>
                        {RED_FLAG_URGENCY[f.urgency].label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '80px' }}>
              {activeRedFlags.map(flag => {
                const answer = redFlagData[flag.id];
                const urgency = RED_FLAG_URGENCY[flag.urgency];
                return (
                  <div key={flag.id} className="card" style={{
                    padding: '16px 18px',
                    borderLeft: answer === 'yes' ? `4px solid ${urgency.color}` : '4px solid transparent',
                    background: answer === 'yes' ? urgency.background : 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                      <h4 style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600',
                        color: '#2D2A26', margin: 0
                      }}>
                        {flag.title}
                      </h4>
                      <span style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: '600',
                        color: urgency.color, textTransform: 'uppercase', letterSpacing: '0.4px'
                      }}>
                        {urgency.label}
                      </span>
                    </div>

                    <p style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#4A4744',
                      margin: '8px 0 0 0', lineHeight: '1.55'
                    }}>
                      {flag.text}
                    </p>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      {[['yes', 'Yes, this applies'], ['no', 'No'], ['unsure', 'Not sure']].map(([val, label]) => (
                        <button
                          key={val}
                          onClick={() => toggleRedFlag(flag.id, val)}
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '12px',
                            fontWeight: answer === val ? '600' : '400',
                            padding: '6px 12px',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            border: answer === val ? `1.5px solid ${val === 'yes' ? urgency.color : '#8B8680'}` : '1px solid #E8E5E0',
                            background: answer === val ? (val === 'yes' ? urgency.background : '#F4F3F1') : 'white',
                            color: answer === val && val === 'yes' ? urgency.color : '#4A4744'
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {(answer === 'yes' || answer === 'unsure') && (
                      <div style={{
                        marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E8E5E0'
                      }}>
                        <p style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#5C5550',
                          margin: '0 0 6px 0', lineHeight: '1.55'
                        }}>
                          <strong>What this can mean:</strong> {flag.means}
                        </p>
                        <p style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#5C5550',
                          margin: 0, lineHeight: '1.55'
                        }}>
                          <strong>What to do:</strong> {flag.action}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {mode === 'quick' && (
              <div className="card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B6660', margin: 0, lineHeight: '1.5' }}>
                  The quick screen shows {quickRedFlags.length} of {redFlags.length} red flags. The full assessment adds
                  checks for head injury, alcohol and nutrition, and sleep apnoea.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#2D2A26' }}>
              Medical History & Background
            </h2>
            
            {/* Privacy Disclaimer */}
            <div style={{
              padding: '14px 18px',
              marginBottom: '24px',
              background: '#F8FAFB',
              borderRadius: '8px',
              borderLeft: '4px solid #5B8C6F'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5B8C6F" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <div>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#3D7A5A',
                    margin: '0 0 6px 0'
                  }}>
                    Your Privacy is Protected
                  </p>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '12px',
                    color: '#5C5550',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    All information entered on this page is stored <strong>only in your browser's local storage</strong> and is used 
                    solely to populate the report you generate for your healthcare provider. This data is <strong>never transmitted 
                    to any server</strong>, is not accessible to the application developer, and remains entirely under your control. 
                    You may clear all saved data at any time using the "Clear" button.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Patient Info */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', color: '#6B6660', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Patient Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B6660', display: 'block', marginBottom: '6px' }}>Patient Name</label>
                  <input className="form-input" type="text" value={medicalHistory.patientName}
                    onChange={(e) => setMedicalHistory(prev => ({ ...prev, patientName: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B6660', display: 'block', marginBottom: '6px' }}>Age</label>
                  <input className="form-input" type="text" value={medicalHistory.patientAge}
                    onChange={(e) => setMedicalHistory(prev => ({ ...prev, patientAge: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B6660', display: 'block', marginBottom: '6px' }}>Caregiver Name</label>
                  <input className="form-input" type="text" value={medicalHistory.caregiverName}
                    onChange={(e) => setMedicalHistory(prev => ({ ...prev, caregiverName: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B6660', display: 'block', marginBottom: '6px' }}>Relationship to Patient</label>
                  <input className="form-input" type="text" value={medicalHistory.caregiverRelation}
                    onChange={(e) => setMedicalHistory(prev => ({ ...prev, caregiverRelation: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B6660', display: 'block', marginBottom: '6px' }}>When Symptoms First Noticed</label>
                  <input className="form-input" type="text" placeholder="e.g., Spring 2023" value={medicalHistory.firstSymptomsNoticed}
                    onChange={(e) => setMedicalHistory(prev => ({ ...prev, firstSymptomsNoticed: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B6660', display: 'block', marginBottom: '6px' }}>Current Diagnosis (if any)</label>
                  <input className="form-input" type="text" placeholder="e.g., MCI, Alzheimer's, or None" value={medicalHistory.currentDiagnosis}
                    onChange={(e) => setMedicalHistory(prev => ({ ...prev, currentDiagnosis: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', color: '#6B6660', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Medical History & Risk Factors
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {[
                  { key: 'historyStroke', label: 'History of stroke' },
                  { key: 'historyTIA', label: 'History of TIA (mini-stroke)' },
                  { key: 'historyHeartDisease', label: 'Heart disease' },
                  { key: 'historyHypertension', label: 'High blood pressure' },
                  { key: 'historyDiabetes', label: 'Diabetes' },
                  { key: 'historyParkinsons', label: "Parkinson's disease" },
                  { key: 'historyDepression', label: 'Depression' },
                  { key: 'historyHeadInjury', label: 'Significant head injury' },
                  { key: 'historyCancerTreatment', label: 'Cancer treatment (chemo, radiation, hormone therapy)' },
                  { key: 'historyCranialRadiation', label: 'Radiation therapy to head/brain' },
                  { key: 'familyHistoryDementia', label: 'Family history of dementia' }
                ].map(item => (
                  <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" className="form-checkbox"
                      checked={medicalHistory[item.key]}
                      onChange={(e) => setMedicalHistory(prev => ({ ...prev, [item.key]: e.target.checked }))} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#4A4744' }}>{item.label}</span>
                  </label>
                ))}
              </div>
              {medicalHistory.familyHistoryDementia && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B6660', display: 'block', marginBottom: '6px' }}>
                    Family History Details (who, what type if known)
                  </label>
                  <input className="form-input" type="text" value={medicalHistory.familyHistoryDetails}
                    onChange={(e) => setMedicalHistory(prev => ({ ...prev, familyHistoryDetails: e.target.value }))} />
                </div>
              )}
              {(medicalHistory.historyCancerTreatment || medicalHistory.historyCranialRadiation) && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B6660', display: 'block', marginBottom: '6px' }}>
                    Cancer Treatment Details (type of cancer, treatments received, dates)
                  </label>
                  <input className="form-input" type="text" placeholder="e.g., Breast cancer 2019, chemotherapy + radiation"
                    value={medicalHistory.cancerTreatmentDetails}
                    onChange={(e) => setMedicalHistory(prev => ({ ...prev, cancerTreatmentDetails: e.target.value }))} />
                </div>
              )}
              {medicalHistory.historyCranialRadiation && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '12px 14px', 
                  background: '#FFF8E1', 
                  borderRadius: '6px',
                  borderLeft: '3px solid #F57F17'
                }}>
                  <p style={{ 
                    fontFamily: "'DM Sans', sans-serif", 
                    fontSize: '12px', 
                    color: '#5C5550', 
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    <strong style={{ color: '#8B6914' }}>Note:</strong> Cranial radiation can cause white matter changes 
                    similar to vascular dementia. This history is clinically relevant and will be noted in the report.
                  </p>
                </div>
              )}
            </div>

            {/* Medications */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', color: '#6B6660', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Medications
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B6660', display: 'block', marginBottom: '6px' }}>
                    Current Medications
                  </label>
                  <textarea className="form-input" rows={3} placeholder="List current medications..."
                    value={medicalHistory.currentMedications}
                    onChange={(e) => setMedicalHistory(prev => ({ ...prev, currentMedications: e.target.value }))}
                    style={{ resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B6660', display: 'block', marginBottom: '6px' }}>
                    Recent Medication Changes
                  </label>
                  <textarea className="form-input" rows={2} placeholder="Any medications started, stopped, or changed recently..."
                    value={medicalHistory.recentMedChanges}
                    onChange={(e) => setMedicalHistory(prev => ({ ...prev, recentMedChanges: e.target.value }))}
                    style={{ resize: 'vertical' }} />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', color: '#6B6660', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Additional Notes
              </h3>
              <textarea className="form-input" rows={4} placeholder="Any other observations, concerns, or information the doctor should know..."
                value={medicalHistory.additionalNotes}
                onChange={(e) => setMedicalHistory(prev => ({ ...prev, additionalNotes: e.target.value }))}
                style={{ resize: 'vertical' }} />
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* FUNCTIONAL STATUS TAB */}
        {/* ============================================ */}
        {activeTab === 'adl' && (
          <>
            <div className="card" style={{
              padding: '14px 18px',
              marginBottom: '16px',
              borderLeft: '4px solid #3D7A5A',
              background: '#F8FAF9'
            }}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                color: '#5C5550',
                margin: 0
              }}>
                This section assesses independence in daily activities. It helps determine disease stage and care needs.
                <strong> IADLs</strong> (complex tasks) typically decline before <strong>BADLs</strong> (basic self-care).
              </p>
            </div>

            {/* Stage Estimate */}
            {stageEstimation.totalAssessed > 0 && (
              <div className="card" style={{ padding: '16px 18px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B6660' }}>
                    Estimated Functional Stage:
                  </span>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px',
                    fontWeight: '600',
                    color: stageEstimation.stage === 'severe' ? '#A03030' :
                           stageEstimation.stage === 'moderate' ? '#B87333' :
                           stageEstimation.stage === 'mild' ? '#7B6B8D' : '#3D7A5A'
                  }}>
                    {stageEstimation.stageLabel}
                  </span>
                  {stageEstimation.confidence && stageEstimation.stage !== 'unknown' && (
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: stageEstimation.confidence === 'high' ? '#E8F5E9' : 
                                  stageEstimation.confidence === 'moderate' ? '#FFF8E1' : '#FFEBEE',
                      color: stageEstimation.confidence === 'high' ? '#2E7D32' : 
                             stageEstimation.confidence === 'moderate' ? '#F57F17' : '#C62828'
                    }}>
                      {stageEstimation.confidence} confidence
                    </span>
                  )}
                </div>
                <p style={{ 
                  fontFamily: "'DM Sans', sans-serif", 
                  fontSize: '12px', 
                  color: '#8B8680', 
                  margin: '8px 0 0 0'
                }}>
                  View the <strong>Stage Estimation</strong> tab for detailed expectations
                </p>
              </div>
            )}

            {/* IADLs */}
            <div className="card" style={{ marginBottom: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid #F0EDE8' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2D2A26', margin: 0 }}>
                  Instrumental Activities of Daily Living (IADLs)
                </h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#8B8680', margin: '4px 0 0 0' }}>
                  Complex tasks requiring cognitive ability
                </p>
              </div>
              {iadlItems.map(item => (
                <div key={item.id} className="adl-row">
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#4A4744' }}>
                    {item.text}
                  </span>
                  <select
                    className="detail-select"
                    value={adlData[item.id] || ""}
                    onChange={(e) => setAdlData(prev => ({ ...prev, [item.id]: e.target.value }))}
                    style={{ minWidth: '180px' }}
                  >
                    {adlStatusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* BADLs */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid #F0EDE8' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2D2A26', margin: 0 }}>
                  Basic Activities of Daily Living (BADLs)
                </h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#8B8680', margin: '4px 0 0 0' }}>
                  Fundamental self-care abilities
                </p>
              </div>
              {badlItems.map(item => (
                <div key={item.id} className="adl-row">
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#4A4744' }}>
                    {item.text}
                  </span>
                  <select
                    className="detail-select"
                    value={adlData[item.id] || ""}
                    onChange={(e) => setAdlData(prev => ({ ...prev, [item.id]: e.target.value }))}
                    style={{ minWidth: '180px' }}
                  >
                    {adlStatusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ============================================ */}
        {/* STAGE ESTIMATION TAB */}
        {/* ============================================ */}
        {activeTab === 'stage' && (
          <>
            {/* Insufficient Data Warning */}
            {stageEstimation.totalAssessed < 4 && (
              <div className="card" style={{
                padding: '24px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#B87333" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2D2A26', margin: '0 0 8px 0' }}>
                  More Information Needed
                </h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B6660', margin: 0, maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                  Please complete the <strong>Functional Status</strong> tab (at least 4 items) to enable stage estimation. 
                  Adding symptom severity ratings also improves accuracy.
                </p>
              </div>
            )}

            {/* Stage Estimation Results */}
            {stageEstimation.totalAssessed >= 4 && (
              <>
                {/* Current Stage Card */}
                <div className="card" style={{
                  padding: '24px',
                  marginBottom: '16px',
                  borderTop: `4px solid ${stageEstimation.stage === 'severe' ? '#A03030' : 
                    stageEstimation.stage === 'moderate' ? '#B87333' : 
                    stageEstimation.stage === 'mild' ? '#7B6B8D' : '#3D7A5A'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B6660', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Estimated Stage
                      </p>
                      <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#2D2A26', margin: 0 }}>
                        {stageEstimation.stageLabel}
                      </h2>
                    </div>
                    <div style={{
                      padding: '8px 16px',
                      background: stageEstimation.confidence === 'high' ? '#E8F5E9' : 
                                  stageEstimation.confidence === 'moderate' ? '#FFF8E1' : '#FFEBEE',
                      borderRadius: '20px'
                    }}>
                      <span style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '12px',
                        fontWeight: '600',
                        color: stageEstimation.confidence === 'high' ? '#2E7D32' : 
                               stageEstimation.confidence === 'moderate' ? '#F57F17' : '#C62828'
                      }}>
                        {stageEstimation.confidence === 'high' ? '● High' : 
                         stageEstimation.confidence === 'moderate' ? '● Moderate' : '● Low'} confidence
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                    gap: '16px', 
                    marginTop: '20px',
                    padding: '16px',
                    background: '#F8F7F5',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '24px', fontWeight: '700', color: '#7B6B8D' }}>
                        {stageEstimation.iadlImpairments}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#6B6660' }}>
                        IADL impairments
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '24px', fontWeight: '700', color: '#B87333' }}>
                        {stageEstimation.badlImpairments}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#6B6660' }}>
                        BADL impairments
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '24px', fontWeight: '700', color: '#A03030' }}>
                        {stageEstimation.severeIadl + stageEstimation.severeBadl}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#6B6660' }}>
                        Fully dependent
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage Details - if we have type-specific info */}
                {stageEstimation.stageDetails && stageEstimation.topType && (
                  <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2D2A26', margin: 0 }}>
                        What to Expect at This Stage
                      </h3>
                      <span style={{
                        padding: '4px 12px',
                        background: `${dementiaTypes[stageEstimation.topType].color}15`,
                        color: dementiaTypes[stageEstimation.topType].color,
                        borderRadius: '20px',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        Based on {dementiaTypes[stageEstimation.topType].name} pattern
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ padding: '14px 16px', background: '#F8F7F5', borderRadius: '8px', borderLeft: '3px solid #6B6660' }}>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#6B6660', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                          Typical Duration
                        </p>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#2D2A26', margin: 0 }}>
                          {stageEstimation.stageDetails.duration}
                        </p>
                      </div>

                      <div style={{ padding: '14px 16px', background: '#F8F7F5', borderRadius: '8px', borderLeft: '3px solid #5B8C6F' }}>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#5B8C6F', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                          Cognitive Changes
                        </p>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#2D2A26', margin: 0, lineHeight: '1.5' }}>
                          {stageEstimation.stageDetails.cognitive}
                        </p>
                      </div>

                      <div style={{ padding: '14px 16px', background: '#F8F7F5', borderRadius: '8px', borderLeft: '3px solid #7B6B8D' }}>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#7B6B8D', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                          Functional Abilities
                        </p>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#2D2A26', margin: 0, lineHeight: '1.5' }}>
                          {stageEstimation.stageDetails.functional}
                        </p>
                      </div>

                      <div style={{ padding: '14px 16px', background: '#F8F7F5', borderRadius: '8px', borderLeft: '3px solid #B87333' }}>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#B87333', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                          Behavioral Symptoms
                        </p>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#2D2A26', margin: 0, lineHeight: '1.5' }}>
                          {stageEstimation.stageDetails.behavioral}
                        </p>
                      </div>

                      <div style={{ padding: '14px 16px', background: '#E8F5E9', borderRadius: '8px', borderLeft: '3px solid #2E7D32' }}>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#2E7D32', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                          Caregiving Focus
                        </p>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#2D2A26', margin: 0, lineHeight: '1.5' }}>
                          {stageEstimation.stageDetails.caregiving}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stage Comparison Overview */}
                <div className="card" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2D2A26', margin: '0 0 16px 0' }}>
                    Stage Progression Overview
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {['mild', 'moderate', 'severe'].map(s => (
                      <div 
                        key={s}
                        style={{
                          flex: '1 1 200px',
                          padding: '16px',
                          background: stageEstimation.stage === s ? '#F0F7F4' : '#F8F7F5',
                          borderRadius: '8px',
                          border: stageEstimation.stage === s ? '2px solid #3D7A5A' : '1px solid #E8E5E0'
                        }}
                      >
                        <h4 style={{ 
                          fontFamily: "'DM Sans', sans-serif", 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: stageEstimation.stage === s ? '#3D7A5A' : '#6B6660',
                          margin: '0 0 8px 0'
                        }}>
                          {s === 'mild' ? '🌱 Mild / Early' : s === 'moderate' ? '🌿 Moderate / Middle' : '🍂 Severe / Late'}
                          {stageEstimation.stage === s && ' ← Current'}
                        </h4>
                        <ul style={{ 
                          fontFamily: "'DM Sans', sans-serif", 
                          fontSize: '12px', 
                          color: '#5C5550',
                          margin: 0,
                          paddingLeft: '16px',
                          lineHeight: '1.6'
                        }}>
                          {s === 'mild' && (
                            <>
                              <li>Can live mostly independently</li>
                              <li>Needs help with complex tasks</li>
                              <li>May still drive (with evaluation)</li>
                            </>
                          )}
                          {s === 'moderate' && (
                            <>
                              <li>Needs daily supervision</li>
                              <li>Help with ADLs required</li>
                              <li>Should not drive</li>
                            </>
                          )}
                          {s === 'severe' && (
                            <>
                              <li>24-hour care needed</li>
                              <li>Dependent for all activities</li>
                              <li>Focus on comfort & dignity</li>
                            </>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <div style={{
                  marginTop: '16px',
                  padding: '14px 18px',
                  background: '#FFFBF5',
                  borderRadius: '8px',
                  borderLeft: '3px solid #D4A017'
                }}>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '12px',
                    color: '#5C5550',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    <strong style={{ color: '#8B6914' }}>Note:</strong> Stage estimation is approximate and based on functional assessment. 
                    Progression varies significantly between individuals. Some people remain in one stage for years while others 
                    progress more quickly. Discuss staging and prognosis with your healthcare provider.
                  </p>
                </div>
              </>
            )}

            {/* Show basic info even when totalAssessed < 4 */}
            {stageEstimation.totalAssessed > 0 && stageEstimation.totalAssessed < 4 && (
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2D2A26', margin: '0 0 16px 0' }}>
                  Current Assessment Status
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                  gap: '16px', 
                  marginBottom: '20px',
                  padding: '16px',
                  background: '#F8F7F5',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '24px', fontWeight: '700', color: '#7B6B8D' }}>
                      {stageEstimation.iadlImpairments}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#6B6660' }}>
                      IADL impairments
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '24px', fontWeight: '700', color: '#B87333' }}>
                      {stageEstimation.badlImpairments}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#6B6660' }}>
                      BADL impairments
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '24px', fontWeight: '700', color: '#6B6660' }}>
                      {stageEstimation.totalAssessed}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#6B6660' }}>
                      Items assessed
                    </div>
                  </div>
                </div>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                  color: '#6B6660',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  Complete at least 4 ADL assessments in the <strong>Functional Status</strong> tab to get a stage estimation with confidence level.
                </p>
              </div>
            )}
          </>
        )}

        {/* ============================================ */}
        {/* GENERATE REPORT TAB */}
        {/* ============================================ */}
        {activeTab === 'report' && (
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ marginBottom: '24px' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#3D7A5A" strokeWidth="1.5" style={{ margin: '0 auto 16px' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </svg>
              <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#2D2A26', margin: '0 0 8px 0' }}>
                Generate Doctor Report
              </h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#6B6660', margin: 0, maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                Create a printable summary of all observations, symptoms, medical history, and functional status 
                to bring to your healthcare appointment.
              </p>
            </div>

            {/* Summary Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '28px',
              maxWidth: '500px',
              margin: '0 auto 28px'
            }}>
              <div style={{ padding: '16px', background: '#F8F7F5', borderRadius: '8px' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '24px', fontWeight: '700', color: '#3D7A5A' }}>
                  {checkedSymptoms.length}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B6660' }}>
                  Symptoms Logged
                </div>
              </div>
              <div style={{ padding: '16px', background: '#F8F7F5', borderRadius: '8px' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '24px', fontWeight: '700', color: '#7B6B8D' }}>
                  {Object.values(medicalHistory).filter(v => v && v !== "").length}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B6660' }}>
                  History Items
                </div>
              </div>
              <div style={{ padding: '16px', background: '#F8F7F5', borderRadius: '8px' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '24px', fontWeight: '700', color: '#B87333' }}>
                  {Object.keys(adlData).filter(k => adlData[k] && adlData[k] !== "").length}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B6660' }}>
                  ADLs Assessed
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPrintView(true)}
              style={{
                padding: '16px 48px',
                background: '#3D7A5A',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(61, 122, 90, 0.3)'
              }}
            >
              📄 Generate Printable Report
            </button>

            <div style={{ marginTop: '12px' }}>
              <button
                onClick={() => setShowSummaryView(true)}
                disabled={checkedSymptoms.length === 0}
                style={{
                  padding: '12px 32px',
                  background: 'white',
                  color: '#3D7A5A',
                  border: '2px solid #3D7A5A',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: checkedSymptoms.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: checkedSymptoms.length === 0 ? 0.5 : 1
                }}
              >
                🎨 One-Page Visual Summary
              </button>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#8B8680', margin: '6px 0 0 0' }}>
                Pattern analysis, profile chart and the most distinguishing answers on a single colour page.
              </p>
            </div>

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '12px',
              color: '#8B8680',
              marginTop: '16px'
            }}>
              Use your browser's Print function (Ctrl/Cmd + P) to save as PDF
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
