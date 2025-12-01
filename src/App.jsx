import React, { useState, useMemo, useRef, useEffect } from 'react';

// ============================================
// DATA DEFINITIONS
// ============================================

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
    evidence: "NINDS-AIREN criteria; step-wise decline is classic vascular pattern",
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
    evidence: "DLB Consortium - fluctuating cognition/attention",
    discriminating: true
  },

  // EXECUTIVE FUNCTION & PLANNING
  {
    id: "exec1",
    category: "Planning & Problem-Solving",
    text: "Difficulty managing finances, paying bills, or following multi-step instructions",
    types: ["alzheimers", "vascular", "mixed"],
    evidence: "NIA-AA criteria (AD); executive dysfunction prominent early in vascular dementia; common in mixed",
    discriminating: false
  },
  {
    id: "exec2",
    category: "Planning & Problem-Solving",
    text: "Trouble organizing, planning ahead, or sequencing tasks (e.g., following a recipe)",
    types: ["alzheimers", "vascular", "ftd", "mixed"],
    evidence: "Common across types; dysexecutive profile is one of 6 bvFTD diagnostic features; prominent in mixed",
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
    text: "Engages in compulsive, ritualistic, or repetitive behaviors (fixed routines, hoarding)",
    types: ["ftd"],
    evidence: "bvFTD criteria - perseverative/stereotyped behaviors",
    discriminating: true
  },
  {
    id: "beh5",
    category: "Behavior & Personality",
    text: "Shows profound apathy - loss of initiative, motivation, and interest in previous activities",
    types: ["ftd", "vascular", "mixed"],
    evidence: "Core bvFTD feature; apathy early in vascular dementia vs. later in AD; common in mixed presentations",
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
    text: "Misidentifies familiar people or becomes paranoid/suspicious",
    types: ["alzheimers", "lewy"],
    evidence: "Capgras syndrome more common in DLB; delusions occur in 20-40% of AD",
    discriminating: false
  },

  // MOVEMENT & PHYSICAL
  {
    id: "mov1",
    category: "Movement & Physical",
    text: "Shuffling walk, difficulty starting to walk, or freezing mid-step",
    types: ["lewy", "vascular"],
    evidence: "DLB Consortium - parkinsonism is core feature; gait problems in vascular dementia",
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
    evidence: "DLB Consortium - parkinsonian features",
    discriminating: false
  },
  {
    id: "mov4",
    category: "Movement & Physical",
    text: "Frequent falls or balance problems",
    types: ["lewy", "vascular", "mixed"],
    evidence: "DLB Consortium - falls common; gait/balance deficits in subcortical vascular dementia; common in mixed with vascular component",
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
    evidence: "DLB Consortium (2017) - REM sleep behavior disorder is core feature",
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
    evidence: "PMC systematic review - EDS occurs in ~80% of DLB patients",
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
    evidence: "Bathgate et al. - food cramming discriminates FTD from other dementias",
    discriminating: true
  },
  {
    id: "eat3",
    category: "Eating & Oral Behaviors",
    text: "Fixated on specific foods or developed rigid 'food fads'",
    types: ["ftd"],
    evidence: "UCSF Memory Center; hyperorality is 1 of 6 core bvFTD diagnostic criteria",
    discriminating: true
  },
  {
    id: "eat4",
    category: "Eating & Oral Behaviors",
    text: "Puts non-food items in mouth or increased smoking/alcohol use",
    types: ["ftd"],
    evidence: "Cambridge Behavioral Inventory - oral behaviors domain",
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
    evidence: "Semantic dementia (svPPA) - loss of conceptual knowledge",
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
    types: ["vascular", "mixed"],
    evidence: "Subcortical vascular dementia clinical features; frontal circuit involvement; common in mixed with vascular",
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
    text: "Progression seems faster than typical (decline over months rather than years)",
    types: ["lewy", "vascular", "mixed"],
    evidence: "DLB often more rapid than AD; vascular events cause acute declines; mixed pathology accelerates decline",
    discriminating: false
  },
  {
    id: "onset4",
    category: "Onset & Progression",
    text: "Behavior or personality changes appeared BEFORE memory problems",
    types: ["ftd"],
    evidence: "bvFTD diagnostic criteria - behavioral symptoms precede memory impairment",
    discriminating: true
  },

  // MIXED DEMENTIA INDICATORS
  {
    id: "mixed1",
    category: "Mixed Dementia Indicators",
    text: "Has BOTH gradual memory decline AND sudden worsening episodes (combines both patterns)",
    types: ["mixed"],
    evidence: "Alzheimer's Association; Neurology 2007 - mixed pathology shows both AD gradual + vascular stepwise patterns",
    discriminating: true
  },
  {
    id: "mixed2",
    category: "Mixed Dementia Indicators",
    text: "Memory problems AND executive dysfunction (planning, organizing) both appeared prominently and early",
    types: ["mixed"],
    evidence: "Neurology 2014 - combined amnestic + dysexecutive profile suggests AD + vascular pathology",
    discriminating: true
  },
  {
    id: "mixed3",
    category: "Mixed Dementia Indicators",
    text: "Has multiple cardiovascular risk factors (high blood pressure, diabetes, high cholesterol, heart disease) AND typical memory symptoms",
    types: ["mixed", "vascular"],
    evidence: "Lancet Neurology 2019; Alzheimer's Association - vascular risk factors + AD symptoms suggest mixed etiology",
    discriminating: true
  },
  {
    id: "mixed4",
    category: "Mixed Dementia Indicators",
    text: "Decline is noticeably faster than expected for someone with Alzheimer's alone",
    types: ["mixed"],
    evidence: "JAMA Neurology 2015 - autopsy studies show mixed pathology accelerates cognitive decline vs. AD alone",
    discriminating: true
  },
  {
    id: "mixed5",
    category: "Mixed Dementia Indicators",
    text: "Shows features of multiple dementia types simultaneously (e.g., AD-like memory loss + vascular-like attention problems + movement symptoms)",
    types: ["mixed"],
    evidence: "Alzheimer's Research UK; Nat Rev Neurol 2016 - overlapping symptom domains suggest multiple pathologies",
    discriminating: true
  },
  {
    id: "mixed6",
    category: "Mixed Dementia Indicators",
    text: "Has history of stroke or TIA AND also shows gradual progressive memory decline typical of Alzheimer's",
    types: ["mixed"],
    evidence: "NINDS-AIREN + NIA-AA combined criteria; vascular history + AD progression pattern = mixed dementia",
    discriminating: true
  },
  {
    id: "mixed7",
    category: "Mixed Dementia Indicators",
    text: "Brain imaging (MRI/CT) showed BOTH significant atrophy (shrinkage) AND vascular changes (white matter disease, small strokes)",
    types: ["mixed"],
    evidence: "Neurology 2018 - neuroimaging showing combined AD + vascular pathology strongly predicts mixed dementia",
    discriminating: true
  },
  {
    id: "mixed8",
    category: "Mixed Dementia Indicators",
    text: "Memory problems worsened significantly after a stroke, heart surgery, or cardiac event",
    types: ["mixed", "vascular"],
    evidence: "JAMA 2012 - post-stroke cognitive decline often reveals underlying AD pathology; common mixed presentation",
    discriminating: true
  },
  {
    id: "mixed9",
    category: "Mixed Dementia Indicators",
    text: "Symptoms span multiple categories that don't fit neatly into one dementia type",
    types: ["mixed"],
    evidence: "Alzheimer's Association diagnostic guidelines - atypical or multi-domain presentation suggests mixed pathology",
    discriminating: false
  },
  {
    id: "mixed10",
    category: "Mixed Dementia Indicators",
    text: "Age 80+ with dementia symptoms (mixed pathology is most common at advanced ages)",
    types: ["mixed"],
    evidence: "Rush Memory & Aging Project; Lancet 2017 - autopsy studies show 50%+ of dementia in 80+ has mixed pathology",
    discriminating: true
  }
];

const dementiaTypes = {
  alzheimers: {
    name: "Alzheimer's Disease",
    shortName: "AD",
    color: "#5B8C6F",
    description: "Most common form (60-80% of cases). Gradual onset with progressive memory decline.",
    keyFeature: "Recent memory loss is earliest and most prominent symptom; personality often preserved early."
  },
  vascular: {
    name: "Vascular Dementia",
    shortName: "VaD",
    color: "#7B6B8D",
    description: "Second most common. Results from reduced blood flow to brain.",
    keyFeature: "Often sudden onset or 'step-wise' decline. Executive function problems often more prominent than memory."
  },
  lewy: {
    name: "Lewy Body Dementia",
    shortName: "LBD",
    color: "#8B7355",
    description: "Third most common. Protein deposits affecting brain chemistry.",
    keyFeature: "Visual hallucinations + fluctuating cognition + movement problems. CAUTION: Antipsychotic sensitivity."
  },
  ftd: {
    name: "Frontotemporal Dementia",
    shortName: "FTD",
    color: "#B87333",
    description: "Affects frontal/temporal lobes. Often younger onset (40s-60s).",
    keyFeature: "Personality/behavior changes or language problems come BEFORE memory loss."
  },
  mixed: {
    name: "Mixed Dementia",
    shortName: "Mixed",
    color: "#5F7A8C",
    description: "Combination of types, most commonly Alzheimer's + Vascular.",
    keyFeature: "Symptoms span multiple categories; often faster progression."
  }
};

// IADL and Basic ADL items
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

const onsetOptions = [
  { value: "", label: "Select when noticed" },
  { value: "1month", label: "Within last month" },
  { value: "3months", label: "1-3 months ago" },
  { value: "6months", label: "3-6 months ago" },
  { value: "1year", label: "6-12 months ago" },
  { value: "2years", label: "1-2 years ago" },
  { value: "3years", label: "2-3 years ago" },
  { value: "older", label: "3+ years ago" }
];

const frequencyOptions = [
  { value: "", label: "How often?" },
  { value: "rarely", label: "Rarely (few times/month)" },
  { value: "sometimes", label: "Sometimes (weekly)" },
  { value: "often", label: "Often (multiple times/week)" },
  { value: "daily", label: "Daily" },
  { value: "constant", label: "Constantly" }
];

const severityOptions = [
  { value: "", label: "Severity" },
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" }
];

const adlStatusOptions = [
  { value: "", label: "Select status" },
  { value: "independent", label: "Fully independent" },
  { value: "supervision", label: "Needs reminding/supervision" },
  { value: "assistance", label: "Needs some hands-on help" },
  { value: "dependent", label: "Cannot do without full help" },
  { value: "na", label: "N/A or not assessed" }
];

// Stage information by dementia type
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

const categories = [...new Set(globalSymptoms.map(s => s.category))];

// ============================================
// MAIN COMPONENT
// ============================================

export default function App() {
  // State for symptoms with details
  const [symptomData, setSymptomData] = useState({});
  const [expandedCategories, setExpandedCategories] = useState(
    categories.reduce((acc, cat) => ({ ...acc, [cat]: false }), { "Memory & Learning": true })
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
    // Medications
    currentMedications: "",
    recentMedChanges: "",
    // Notes
    additionalNotes: ""
  });
  
  // State for ADLs
  const [adlData, setAdlData] = useState({});
  
  // State for view mode
  const [activeTab, setActiveTab] = useState("symptoms"); // symptoms, history, adl, stage, report
  const [showPrintView, setShowPrintView] = useState(false);
  const [showSourcesView, setShowSourcesView] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); // For save confirmation message

  // Load saved data on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('dementiaAssessmentData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.symptomData) setSymptomData(parsed.symptomData);
        if (parsed.medicalHistory) setMedicalHistory(parsed.medicalHistory);
        if (parsed.adlData) setAdlData(parsed.adlData);
        if (parsed.expandedCategories) setExpandedCategories(parsed.expandedCategories);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  // Save data function
  const saveData = () => {
    try {
      const dataToSave = {
        symptomData,
        medicalHistory,
        adlData,
        expandedCategories,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('dementiaAssessmentData', JSON.stringify(dataToSave));
      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving data:', error);
      setSaveStatus('Error saving data');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // Clear saved data function
  const clearData = () => {
    if (window.confirm('Are you sure you want to clear all saved data? This cannot be undone.')) {
      localStorage.removeItem('dementiaAssessmentData');
      setSymptomData({});
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
        currentMedications: "",
        recentMedChanges: "",
        additionalNotes: ""
      });
      setAdlData({});
      setExpandedCategories(
        categories.reduce((acc, cat) => ({ ...acc, [cat]: false }), { "Memory & Learning": true })
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
      return {
        ...prev,
        [id]: { checked: true, onset: "", frequency: "", severity: "" }
      };
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

  // Calculate scores
  const scores = useMemo(() => {
    const result = {};
    Object.keys(dementiaTypes).forEach(type => {
      const typeSymptoms = globalSymptoms.filter(s => s.types.includes(type));
      const discriminatingSymptoms = typeSymptoms.filter(s => s.discriminating);
      
      const checkedTotal = typeSymptoms.filter(s => symptomData[s.id]?.checked).length;
      const checkedDiscriminating = discriminatingSymptoms.filter(s => symptomData[s.id]?.checked).length;
      
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
  }, [symptomData]);

  const hasAnyChecked = Object.values(symptomData).some(v => v?.checked);

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

  // Get checked symptoms for report
  const checkedSymptoms = useMemo(() => {
    return globalSymptoms.filter(s => symptomData[s.id]?.checked).map(s => ({
      ...s,
      ...symptomData[s.id]
    }));
  }, [symptomData]);

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
    const severeSymptoms = Object.values(symptomData).filter(s => s?.checked && s?.severity === "severe").length;
    const moderateSymptoms = Object.values(symptomData).filter(s => s?.checked && s?.severity === "moderate").length;
    
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
    const topType = sortedTypes[0] && scores[sortedTypes[0]]?.discriminating > 0 ? sortedTypes[0] : null;
    
    // Get stage-specific information if we have both stage and type
    let stageDetails = null;
    if (stage && stage !== "unknown" && stage !== "minimal" && topType && stageInfo[topType]) {
      stageDetails = stageInfo[topType][stage];
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
  }, [adlData, symptomData, sortedTypes, scores]);

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
                    <th style={{ textAlign: 'left', padding: '8px 4px' }}>Dementia Type</th>
                    <th style={{ textAlign: 'center', padding: '8px 4px' }}>Discriminating Symptoms</th>
                    <th style={{ textAlign: 'center', padding: '8px 4px' }}>Total Symptoms</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTypes.filter(type => scores[type].total > 0).map(type => (
                    <tr key={type} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '8px 4px', fontWeight: scores[type].discriminating > 0 ? '600' : '400' }}>
                        {dementiaTypes[type].name}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 4px' }}>
                        {scores[type].discriminating} / {scores[type].maxDiscriminating}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 4px' }}>
                        {scores[type].total} / {scores[type].maxTotal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedTypes[0] && scores[sortedTypes[0]].discriminating > 0 && (
                <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', fontSize: '14px' }}>
                  <strong>Strongest pattern match: {dementiaTypes[sortedTypes[0]].name}</strong>
                  <p style={{ margin: '8px 0 0 0', fontStyle: 'italic' }}>{dementiaTypes[sortedTypes[0]].keyFeature}</p>
                </div>
              )}
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
                  <th style={{ textAlign: 'left', padding: '8px 4px', width: '40%' }}>Symptom</th>
                  <th style={{ textAlign: 'center', padding: '8px 4px' }}>Onset</th>
                  <th style={{ textAlign: 'center', padding: '8px 4px' }}>Frequency</th>
                  <th style={{ textAlign: 'center', padding: '8px 4px' }}>Severity</th>
                  <th style={{ textAlign: 'center', padding: '8px 4px' }}>Associated Types</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => {
                  const catSymptoms = checkedSymptoms.filter(s => s.category === cat);
                  if (catSymptoms.length === 0) return null;
                  return (
                    <React.Fragment key={cat}>
                      <tr>
                        <td colSpan={5} style={{ padding: '10px 4px 4px', fontWeight: '600', background: '#f0f0f0' }}>
                          {cat}
                        </td>
                      </tr>
                      {catSymptoms.map(symptom => (
                        <tr key={symptom.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '6px 4px' }}>
                            {symptom.text}
                            {symptom.discriminating && <span style={{ color: '#B87333' }}> ★</span>}
                          </td>
                          <td style={{ textAlign: 'center', padding: '6px 4px' }}>
                            {onsetOptions.find(o => o.value === symptom.onset)?.label || "—"}
                          </td>
                          <td style={{ textAlign: 'center', padding: '6px 4px' }}>
                            {frequencyOptions.find(o => o.value === symptom.frequency)?.label || "—"}
                          </td>
                          <td style={{ textAlign: 'center', padding: '6px 4px' }}>
                            {severityOptions.find(o => o.value === symptom.severity)?.label || "—"}
                          </td>
                          <td style={{ textAlign: 'center', padding: '6px 4px' }}>
                            {symptom.types.map(t => dementiaTypes[t].shortName).join(", ")}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: '14px', color: '#666' }}>No symptoms recorded.</p>
          )}
          <p style={{ fontSize: '11px', color: '#888', marginTop: '10px' }}>★ = High-value discriminating symptom</p>
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
            {scores.lewy?.discriminating >= 2 && (
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
                <li><strong>Vascular Cognitive Impairment (VCI) Statement (2011)</strong> - AHA/ASA Scientific Statement</li>
                <li><strong>Subcortical vascular dementia features</strong> - Psychomotor slowing, gait disturbance, executive dysfunction</li>
              </ul>
            </div>

            <div style={{ padding: '16px', background: '#F8F7F5', borderRadius: '8px', borderLeft: `4px solid ${dementiaTypes.lewy.color}` }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: dementiaTypes.lewy.color }}>
                Lewy Body Dementia
              </h3>
              <ul style={{ fontSize: '14px', margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                <li><strong>DLB Consortium 4th Consensus Criteria (2017)</strong> - McKeith et al., Neurology - defines core and supportive features</li>
                <li><strong>Core features:</strong> Fluctuating cognition, recurrent visual hallucinations, REM sleep behavior disorder, parkinsonism</li>
                <li><strong>NINDS/NIA diagnostic guidelines</strong> - Additional clinical features and biomarkers</li>
              </ul>
            </div>

            <div style={{ padding: '16px', background: '#F8F7F5', borderRadius: '8px', borderLeft: `4px solid ${dementiaTypes.ftd.color}` }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: dementiaTypes.ftd.color }}>
                Frontotemporal Dementia
              </h3>
              <ul style={{ fontSize: '14px', margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                <li><strong>International bvFTD Criteria Consortium (Rascovsky et al., 2011)</strong> - Brain - 6 core behavioral features</li>
                <li><strong>Primary Progressive Aphasia criteria</strong> - Non-fluent variant (nfvPPA) and semantic variant (svPPA)</li>
                <li><strong>UCSF Memory and Aging Center research</strong> - Behavioral and eating pattern changes</li>
              </ul>
            </div>

            <div style={{ padding: '16px', background: '#F8F7F5', borderRadius: '8px', borderLeft: `4px solid ${dementiaTypes.mixed.color}` }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: dementiaTypes.mixed.color }}>
                Mixed Dementia
              </h3>
              <ul style={{ fontSize: '14px', margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                <li><strong>Alzheimer's Association mixed dementia guidelines</strong> - Combined AD + vascular pathology recognition</li>
                <li><strong>Rush Memory and Aging Project</strong> - Autopsy studies showing 50%+ of dementia in 80+ has mixed pathology</li>
                <li><strong>Lancet Neurology (2017, 2019)</strong> - Epidemiological studies on mixed pathology prevalence</li>
                <li><strong>JAMA Neurology (2015)</strong> - Accelerated decline with multiple pathologies</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Methodology */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '15px' }}>
            Methodology
          </h2>
          
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>Discriminating vs. Non-Discriminating Symptoms</h3>
          <p style={{ fontSize: '14px', marginBottom: '15px', lineHeight: '1.6' }}>
            Symptoms are classified as <strong>"discriminating" (HIGH-VALUE)</strong> when they strongly suggest a specific dementia type 
            and help differentiate it from other forms. Non-discriminating symptoms may be present across multiple dementia types.
          </p>
          
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>Scoring Approach</h3>
          <p style={{ fontSize: '14px', marginBottom: '15px', lineHeight: '1.6' }}>
            The pattern analysis prioritizes discriminating symptoms when ranking dementia type matches. This approach is based on 
            the principle that certain symptoms are more specific to particular dementia types and carry greater diagnostic weight.
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
                    <th style={{ textAlign: 'center', padding: '10px 8px', width: '10%' }}>Key?</th>
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
                          {symptom.types.map(t => (
                            <span key={t} style={{
                              padding: '2px 6px',
                              background: `${dementiaTypes[t].color}20`,
                              color: dementiaTypes[t].color,
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '600',
                              fontFamily: "'DM Sans', sans-serif"
                            }}>
                              {dementiaTypes[t].shortName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px 8px', verticalAlign: 'top' }}>
                        {symptom.discriminating ? (
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
                <strong style={{ color: '#A03030' }}>For healthcare discussions only.</strong> Check symptoms you've observed, 
                then add timing and severity details. This helps identify patterns but cannot replace professional diagnosis.
              </p>
            </div>

            {/* Score Summary */}
            {hasAnyChecked && (
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
                  Pattern Analysis
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {sortedTypes.filter(type => scores[type].total > 0).map(type => {
                    const score = scores[type];
                    const info = dementiaTypes[type];
                    return (
                      <div key={type}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600', color: info.color }}>
                            {info.name}
                          </span>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#8B8680' }}>
                            <span style={{ color: '#B87333', fontWeight: '600' }}>{score.discriminating}/{score.maxDiscriminating}</span> key • {score.total}/{score.maxTotal} total
                          </span>
                        </div>
                        <div className="score-bar">
                          <div className="score-fill" style={{ width: `${score.discriminatingPercentage}%`, background: info.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LBD Warning */}
            {scores.lewy?.discriminating >= 2 && (
              <div className="card" style={{
                padding: '14px 18px',
                marginBottom: '16px',
                borderLeft: '4px solid #D4A017',
                background: '#FFFEF5'
              }}>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  color: '#5C5550',
                  margin: 0
                }}>
                  <strong style={{ color: '#8B6914' }}>⚠️ Lewy Body Dementia Indicators Detected:</strong> People with LBD can have 
                  severe reactions to antipsychotic medications. Discuss this with the healthcare team before any such medications are prescribed.
                </p>
              </div>
            )}

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
                  const isTopMatch = sortedTypes[0] === key && typeScore?.discriminating > 0;
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
                              {typeScore.discriminating}/{typeScore.maxDiscriminating} key • {typeScore.total}/{typeScore.maxTotal} total
                            </span>
                          </div>
                          <div className="score-bar" style={{ marginTop: '6px' }}>
                            <div className="score-fill" style={{ width: `${typeScore.discriminatingPercentage}%`, background: type.color }} />
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
                const categorySymptoms = globalSymptoms.filter(s => s.category === category);
                const isExpanded = expandedCategories[category];
                const checkedCount = categorySymptoms.filter(s => symptomData[s.id]?.checked).length;
                
                return (
                  <div key={category} className="card" style={{ overflow: 'hidden' }}>
                    <div className="category-header" onClick={() => toggleCategory(category)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2D2A26', margin: 0 }}>
                          {category}
                        </h3>
                        {checkedCount > 0 && (
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#3D7A5A', fontWeight: '600' }}>
                            {checkedCount} selected
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
                                    {symptom.discriminating && (
                                      <span style={{ marginLeft: '8px', color: '#B87333', fontSize: '10px', fontWeight: '600' }}>
                                        HIGH-VALUE
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {symptom.types.map(type => (
                                      <span key={type} className="type-tag" style={{
                                        background: `${dementiaTypes[type].color}15`,
                                        color: dementiaTypes[type].color
                                      }}>
                                        {dementiaTypes[type].shortName}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Detail Selects - shown when checked */}
                              {isChecked && (
                                <div style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '10px',
                                  marginTop: '12px',
                                  marginLeft: '34px',
                                  padding: '12px',
                                  background: '#F8F7F5',
                                  borderRadius: '8px'
                                }}>
                                  <select
                                    className="detail-select"
                                    value={symptomData[symptom.id]?.onset || ""}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => updateSymptomDetail(symptom.id, 'onset', e.target.value)}
                                  >
                                    {onsetOptions.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                  <select
                                    className="detail-select"
                                    value={symptomData[symptom.id]?.frequency || ""}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => updateSymptomDetail(symptom.id, 'frequency', e.target.value)}
                                  >
                                    {frequencyOptions.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                  <select
                                    className="detail-select"
                                    value={symptomData[symptom.id]?.severity || ""}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => updateSymptomDetail(symptom.id, 'severity', e.target.value)}
                                  >
                                    {severityOptions.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
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
                        Categories Reviewed
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', color: '#2D2A26' }}>
                        {Object.values(expandedCategories).filter(Boolean).length} / {categories.length}
                      </div>
                    </div>
                    <div style={{ height: '30px', width: '1px', background: '#E8E5E0' }} />
                    <div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#8B8680', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                        Symptoms Selected
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', color: '#3D7A5A' }}>
                        {Object.values(symptomData).filter(s => s?.checked).length}
                      </div>
                    </div>
                    <div style={{ height: '30px', width: '1px', background: '#E8E5E0' }} />
                    <div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#8B8680', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                        With Details
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: '600', color: '#7B6B8D' }}>
                        {Object.values(symptomData).filter(s => s?.checked && s?.onset && s?.frequency && s?.severity).length}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={{ flex: 1, maxWidth: '300px', minWidth: '150px' }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#8B8680', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Overall Progress</span>
                      <span>{Math.round((Object.values(expandedCategories).filter(Boolean).length / categories.length) * 100)}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#F0EDE8', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(Object.values(expandedCategories).filter(Boolean).length / categories.length) * 100}%`,
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
                          {globalSymptoms.filter(s => s.discriminating && symptomData[s.id]?.checked).length}
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
        {activeTab === 'history' && (
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 20px 0', color: '#2D2A26' }}>
              Medical History & Background
            </h2>
            
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
