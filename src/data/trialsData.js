/**
 * Synthetic Clinical Trial Dataset for Research Ops Monitoring
 * NOTE: All data is synthetic for demonstration purposes only.
 */

export const INITIAL_TRIALS = [
  {
    id: "CT-038",
    phase: "II",
    title: "Solid Tumor Basket Study",
    description: "Multi-cohort genomic basket study targeting rare oncogenic fusions across solid tumor types.",
    enrolled: 120,
    target: 120,
    percentage: 100,
    estimatedCompletion: "Dec 2024",
    region: "North America",
    indication: "Oncology",
    aesTotal: 4,
    aesSevere: 0,
    aesMildMod: 4,
    aesUnresolved: 1,
    nextMilestone: "Final Data Lock",
    milestoneDate: "Nov 15, 2024",
    status: "on_track",
    statusLabel: "On Track",
    funnel: {
      screened: 142,
      enrolled: 120,
      active: 114,
      withdrawn: 6
    },
    milestones: [
      { id: "M-38-1", name: "Final Data Lock", due: "Nov 15, 2024", status: "upcoming", dueDays: 74, completed: false, description: "eCRF completion across all 3 participating clinical research sites." },
      { id: "M-38-2", name: "Database Freeze", due: "Dec 01, 2024", status: "pending", dueDays: 90, completed: false, description: "Final audit lock and biostatistical dataset export." },
      { id: "M-38-3", name: "Primary Endpoint Readout", due: "Dec 20, 2024", status: "pending", dueDays: 109, completed: false, description: "Objective Response Rate (ORR) and Progression-Free Survival (PFS) readout." }
    ],
    recommendation: {
      priority: "Low Priority",
      priorityLevel: "low",
      title: "Schedule final data verification audit",
      reason: "All 120 target subjects have completed study visits. Site data verification is 96% complete.",
      actionText: "Review Data Lock Checklist",
      actionType: "milestones",
      targetSite: null
    },
    sites: [
      { id: "SITE-201", name: "Dana-Farber Cancer Institute", location: "Boston, MA", pi: "Dr. L. Chen", enrolled: 45, target: 45, status: "completed", trajectory: "100%", flag: null },
      { id: "SITE-202", name: "Memorial Sloan Kettering", location: "New York, NY", pi: "Dr. R. Vance", enrolled: 40, target: 40, status: "completed", trajectory: "100%", flag: null },
      { id: "SITE-203", name: "City of Hope", location: "Duarte, CA", pi: "Dr. K. Patel", enrolled: 35, target: 35, status: "completed", trajectory: "100%", flag: null }
    ],
    patients: [
      { id: "PT-3801", site: "Dana-Farber (Boston)", screenedDate: "Mar 10, 2024", enrolledDate: "Mar 16, 2024", status: "Completed", age: 61, gender: "Female", cohort: "Cohort A (NTRK)", lastVisit: "Week 24 (Aug 15)", aeCount: 1, notes: "Completed 24-week follow-up. Primary response confirmed PR." },
      { id: "PT-3802", site: "Memorial Sloan (NY)", screenedDate: "Mar 14, 2024", enrolledDate: "Mar 20, 2024", status: "Active", age: 54, gender: "Male", cohort: "Cohort B (RET)", lastVisit: "Week 20 (Aug 22)", aeCount: 1, notes: "Stable disease. Scheduled for final Week 24 scan." },
      { id: "PT-3803", site: "City of Hope (CA)", screenedDate: "Apr 02, 2024", enrolledDate: "Apr 08, 2024", status: "Active", age: 48, gender: "Female", cohort: "Cohort A (NTRK)", lastVisit: "Week 18 (Aug 19)", aeCount: 1, notes: "Grade 1 rash resolved with topical treatment." },
      { id: "PT-3804", site: "Dana-Farber (Boston)", screenedDate: "Apr 11, 2024", enrolledDate: "Apr 18, 2024", status: "Active", age: 67, gender: "Male", cohort: "Cohort C (ROS1)", lastVisit: "Week 16 (Aug 25)", aeCount: 1, notes: "Grade 2 diarrhea under active dose interruption protocol." },
      { id: "PT-3805", site: "Memorial Sloan (NY)", screenedDate: "Apr 20, 2024", enrolledDate: "—", status: "Screened", age: 59, gender: "Female", cohort: "Screen Failure", lastVisit: "Screening (Apr 20)", aeCount: 0, notes: "Ineligible due to genomic variant non-match." },
      { id: "PT-3806", site: "City of Hope (CA)", screenedDate: "May 01, 2024", enrolledDate: "May 06, 2024", status: "Withdrawn", age: 72, gender: "Male", cohort: "Cohort B (RET)", lastVisit: "Week 8 (Jun 29)", aeCount: 0, notes: "Patient relocation; consent withdrawn." }
    ],
    adverseEvents: [
      { id: "AE-3801", subjectId: "PT-3801", site: "Dana-Farber", severity: "Mild", grade: "Grade 1", term: "Fatigue", date: "Jul 14, 2024", actionTaken: "Dose Maintained", status: "Resolved", related: "Unlikely", duration: "8 days" },
      { id: "AE-3802", subjectId: "PT-3802", site: "Memorial Sloan", severity: "Moderate", grade: "Grade 2", term: "Nausea", date: "Aug 02, 2024", actionTaken: "Concomitant Meds", status: "Resolved", related: "Possible", duration: "5 days" },
      { id: "AE-3803", subjectId: "PT-3803", site: "City of Hope", severity: "Mild", grade: "Grade 1", term: "Rash", date: "Aug 19, 2024", actionTaken: "Topical Tx", status: "Resolved", related: "Probable", duration: "12 days" },
      { id: "AE-3804", subjectId: "PT-3804", site: "Dana-Farber", severity: "Moderate", grade: "Grade 2", term: "Diarrhea", date: "Aug 25, 2024", actionTaken: "Dose Interruption", status: "Active", related: "Possible", duration: "7 days (Active)" }
    ]
  },
  {
    id: "CT-042",
    phase: "III",
    title: "Advanced Oncology Study",
    description: "Advanced Oncology Study - Multi-center synthetic cohort evaluation.",
    enrolled: 450,
    target: 600,
    percentage: 75,
    estimatedCompletion: "Jan 2025",
    region: "Global (Multi-center)",
    indication: "Oncology",
    aesTotal: 4,
    aesSevere: 1,
    aesMildMod: 3,
    aesUnresolved: 3,
    nextMilestone: "Interim Analysis",
    milestoneDate: "Oct 12, 2024",
    status: "attention",
    statusLabel: "Attention Needed",
    funnel: {
      screened: 520,
      enrolled: 450,
      active: 432,
      withdrawn: 18
    },
    milestones: [
      { id: "M-42-1", name: "Interim Analysis Data Cut", due: "Oct 12, 2024", status: "active", dueDays: 14, completed: false, highlight: true, description: "Primary safety and efficacy interim cut for DSMB review." },
      { id: "M-42-2", name: "DSMB Review Meeting", due: "Nov 15, 2024", status: "pending", dueDays: 48, completed: false, description: "Independent Data and Safety Monitoring Board unblinded session." },
      { id: "M-42-3", name: "Target Enrollment Completion", due: "Jan 30, 2025", status: "pending", dueDays: 124, completed: false, description: "Final patient in (FPI) milestone target across all 4 centers." }
    ],
    recommendation: {
      priority: "High Priority",
      priorityLevel: "high",
      title: "Prioritize CT-042 enrollment review",
      reason: "Enrollment is currently below the expected trajectory. Review site-level enrollment performance before the next monitoring milestone.",
      actionText: "Review Enrollment",
      actionType: "patients",
      targetSite: "SITE-103"
    },
    sites: [
      { id: "SITE-101", name: "Memorial Sloan Kettering", location: "New York, NY", pi: "Dr. H. Sterling", enrolled: 180, target: 200, status: "on_track", trajectory: "90%", flag: null },
      { id: "SITE-102", name: "Mayo Clinic Comprehensive", location: "Rochester, MN", pi: "Dr. A. Fischer", enrolled: 160, target: 200, status: "on_track", trajectory: "80%", flag: null },
      { id: "SITE-103", name: "Johns Hopkins Oncology Center", location: "Baltimore, MD", pi: "Dr. M. Gable", enrolled: 85, target: 150, status: "flagged", trajectory: "56.6%", flag: "IRB Protocol Amendment Delay (-35% below expected pacing)" },
      { id: "SITE-104", name: "MD Anderson Cancer Center", location: "Houston, TX", pi: "Dr. E. Thorne", enrolled: 25, target: 50, status: "on_track", trajectory: "50%", flag: null }
    ],
    patients: [
      { id: "PT-1042", site: "Memorial Sloan (NY)", screenedDate: "Aug 12, 2024", enrolledDate: "Aug 18, 2024", status: "Active", age: 58, gender: "Female", cohort: "Arm A (Investigational)", lastVisit: "Cycle 2 Day 1", aeCount: 1, notes: "Grade 2 elevated ALT/AST on Aug 15. Resolved after dose adjustment." },
      { id: "PT-1043", site: "Johns Hopkins (MD)", screenedDate: "Aug 14, 2024", enrolledDate: "Aug 20, 2024", status: "Active", age: 63, gender: "Male", cohort: "Arm A (Investigational)", lastVisit: "Cycle 1 Day 15", aeCount: 1, notes: "Grade 3 Neutropenic Fever on Aug 28. Hospitalized; trial drug held." },
      { id: "PT-1044", site: "Mayo Clinic (MN)", screenedDate: "Aug 15, 2024", enrolledDate: "Aug 21, 2024", status: "Active", age: 71, gender: "Male", cohort: "Arm B (Control)", lastVisit: "Cycle 2 Day 1", aeCount: 1, notes: "Grade 1 Peripheral Neuropathy monitored. Stable." },
      { id: "PT-1045", site: "Johns Hopkins (MD)", screenedDate: "Aug 16, 2024", enrolledDate: "—", status: "Screened", age: 49, gender: "Female", cohort: "Pending Screening", lastVisit: "Screening Lab (Aug 16)", aeCount: 0, notes: "Awaiting confirmatory genomic biomarker panel result." },
      { id: "PT-1046", site: "Memorial Sloan (NY)", screenedDate: "Aug 18, 2024", enrolledDate: "Aug 24, 2024", status: "Active", age: 52, gender: "Female", cohort: "Arm A (Investigational)", lastVisit: "Cycle 1 Day 8", aeCount: 1, notes: "Grade 1 Hypokalemia; oral electrolyte supplementation ongoing." },
      { id: "PT-1047", site: "MD Anderson (TX)", screenedDate: "Aug 20, 2024", enrolledDate: "Aug 26, 2024", status: "Active", age: 66, gender: "Male", cohort: "Arm B (Control)", lastVisit: "Cycle 1 Day 1", aeCount: 0, notes: "Baseline infusion completed uneventfully." },
      { id: "PT-1048", site: "Johns Hopkins (MD)", screenedDate: "Aug 02, 2024", enrolledDate: "Aug 08, 2024", status: "Withdrawn", age: 75, gender: "Male", cohort: "Arm A (Investigational)", lastVisit: "Cycle 1 Day 7", aeCount: 0, notes: "Withdrew consent due to travel burden." }
    ],
    adverseEvents: [
      { id: "AE-4201", subjectId: "PT-1043", site: "Johns Hopkins (MD)", severity: "Severe", grade: "Grade 3", term: "Neutropenic Fever", date: "Aug 28, 2024", actionTaken: "Hospitalization & Dose Reduced", status: "Active", related: "Probable", duration: "4 days (Active)", flagged: true },
      { id: "AE-4202", subjectId: "PT-1042", site: "Memorial Sloan (NY)", severity: "Moderate", grade: "Grade 2", term: "Elevated ALT/AST", date: "Aug 15, 2024", actionTaken: "Dose Interruption", status: "Resolved", related: "Possible", duration: "6 days", flagged: false },
      { id: "AE-4203", subjectId: "PT-1044", site: "Mayo Clinic (MN)", severity: "Mild", grade: "Grade 1", term: "Peripheral Neuropathy", date: "Aug 20, 2024", actionTaken: "Monitored", status: "Active", related: "Possible", duration: "12 days (Active)", flagged: false },
      { id: "AE-4204", subjectId: "PT-1046", site: "Memorial Sloan (NY)", severity: "Mild", grade: "Grade 1", term: "Hypokalemia", date: "Aug 22, 2024", actionTaken: "Electrolyte Supplement", status: "Active", related: "Unlikely", duration: "10 days (Active)", flagged: false }
    ]
  },
  {
    id: "CT-051",
    phase: "I",
    title: "First-in-Human Immunotherapy",
    description: "Dose-escalation phase I evaluation of novel checkpoint agonist in refractory metastatic solid tumors.",
    enrolled: 15,
    target: 50,
    percentage: 30,
    estimatedCompletion: "Aug 2025",
    region: "North America",
    indication: "Immunotherapy",
    aesTotal: 1,
    aesSevere: 0,
    aesMildMod: 1,
    aesUnresolved: 0,
    nextMilestone: "Dose Escalation",
    milestoneDate: "Sep 28, 2024",
    status: "on_track",
    statusLabel: "On Track",
    funnel: {
      screened: 22,
      enrolled: 15,
      active: 14,
      withdrawn: 1
    },
    milestones: [
      { id: "M-51-1", name: "Dose Escalation Cohort 2", due: "Sep 28, 2024", status: "active", dueDays: 26, completed: false, description: "Evaluation of 21-day DLT observation window for 10mg/kg dose tier." },
      { id: "M-51-2", name: "Safety Review Committee", due: "Oct 15, 2024", status: "pending", dueDays: 43, completed: false, description: "SRC dose escalation clearance to 20mg/kg." },
      { id: "M-51-3", name: "Cohort 3 Initiation", due: "Nov 01, 2024", status: "pending", dueDays: 60, completed: false, description: "First patient dosed in third escalation tier." }
    ],
    recommendation: {
      priority: "Medium Priority",
      priorityLevel: "medium",
      title: "Confirm Cohort 2 DLT Observation Window",
      reason: "Cohort 2 (3 subjects) has reached 21-day observation without dose-limiting toxicities. SRC sign-off needed.",
      actionText: "View Safety Dossier",
      actionType: "events",
      targetSite: null
    },
    sites: [
      { id: "SITE-301", name: "Fred Hutchinson Cancer Center", location: "Seattle, WA", pi: "Dr. S. Vance", enrolled: 15, target: 50, status: "on_track", trajectory: "30%", flag: null }
    ],
    patients: [
      { id: "PT-5101", site: "Fred Hutchinson (WA)", screenedDate: "Jul 10, 2024", enrolledDate: "Jul 16, 2024", status: "Active", age: 55, gender: "Male", cohort: "Cohort 2 (10mg/kg)", lastVisit: "Day 28 Visit", aeCount: 1, notes: "Grade 1 infusion-related chills. Resolved with antihistamine." },
      { id: "PT-5102", site: "Fred Hutchinson (WA)", screenedDate: "Jul 18, 2024", enrolledDate: "Jul 24, 2024", status: "Active", age: 62, gender: "Female", cohort: "Cohort 2 (10mg/kg)", lastVisit: "Day 21 Visit", aeCount: 0, notes: "No DLTs observed through observation window." },
      { id: "PT-5103", site: "Fred Hutchinson (WA)", screenedDate: "Jul 22, 2024", enrolledDate: "Jul 29, 2024", status: "Active", age: 49, gender: "Female", cohort: "Cohort 2 (10mg/kg)", lastVisit: "Day 21 Visit", aeCount: 0, notes: "Pharmacokinetic profile in line with preclinical modeling." }
    ],
    adverseEvents: [
      { id: "AE-5101", subjectId: "PT-5101", site: "Fred Hutchinson (WA)", severity: "Mild", grade: "Grade 1", term: "Infusion-related Reaction", date: "Aug 11, 2024", actionTaken: "Antihistamine", status: "Resolved", related: "Probable", duration: "2 hours" }
    ]
  },
  {
    id: "CT-089",
    phase: "II",
    title: "Targeted Kinase Inhibitor in NSCLC",
    description: "Open-label Phase II evaluating dual MET/EGFR inhibitor in EGFR-TKI resistant non-small cell lung cancer.",
    enrolled: 112,
    target: 150,
    percentage: 75,
    estimatedCompletion: "Apr 2025",
    region: "Europe",
    indication: "Pulmonology / Oncology",
    aesTotal: 0,
    aesSevere: 0,
    aesMildMod: 0,
    aesUnresolved: 0,
    nextMilestone: "Data Lock",
    milestoneDate: "Nov 05, 2024",
    status: "on_track",
    statusLabel: "Active",
    funnel: {
      screened: 135,
      enrolled: 112,
      active: 108,
      withdrawn: 4
    },
    milestones: [
      { id: "M-89-1", name: "Interim Data Lock", due: "Nov 05, 2024", status: "upcoming", dueDays: 64, completed: false, description: "eCRF monitoring cut for first 100 evaluable patients." },
      { id: "M-89-2", name: "Central Imaging Review", due: "Dec 01, 2024", status: "pending", dueDays: 90, completed: false, description: "Independent radiological review of baseline and Week 12 CT scans." }
    ],
    recommendation: {
      priority: "Low Priority",
      priorityLevel: "low",
      title: "Monitor EU site electronic CRF closeouts",
      reason: "All 3 European sites are on schedule with eCRF completion rate exceeding 98%. Continue routine monitoring.",
      actionText: "View Site Metrics",
      actionType: "patients",
      targetSite: null
    },
    sites: [
      { id: "SITE-401", name: "Gustave Roussy Institute", location: "Paris, FR", pi: "Dr. P. Dubois", enrolled: 42, target: 50, status: "on_track", trajectory: "84%", flag: null },
      { id: "SITE-402", name: "Charité Comprehensive Cancer Center", location: "Berlin, DE", pi: "Dr. H. Weber", enrolled: 40, target: 50, status: "on_track", trajectory: "80%", flag: null },
      { id: "SITE-403", name: "The Royal Marsden NHS Foundation", location: "London, UK", pi: "Dr. O. Smith", enrolled: 30, target: 50, status: "on_track", trajectory: "60%", flag: null }
    ],
    patients: [
      { id: "PT-8901", site: "Gustave Roussy (Paris)", screenedDate: "May 10, 2024", enrolledDate: "May 15, 2024", status: "Active", age: 58, gender: "Male", cohort: "Exon 19 del + MET amp", lastVisit: "Week 12 Scan", aeCount: 0, notes: "Partial response confirmed at Week 12 scan." },
      { id: "PT-8902", site: "Charité (Berlin)", screenedDate: "May 12, 2024", enrolledDate: "May 18, 2024", status: "Active", age: 64, gender: "Female", cohort: "L858R + MET amp", lastVisit: "Week 12 Scan", aeCount: 0, notes: "eCRF complete; zero protocol deviations." },
      { id: "PT-8903", site: "Royal Marsden (London)", screenedDate: "Jun 01, 2024", enrolledDate: "Jun 07, 2024", status: "Active", age: 70, gender: "Male", cohort: "Exon 19 del + MET amp", lastVisit: "Week 8 Visit", aeCount: 0, notes: "Tolerating study therapy without dose modifications." }
    ],
    adverseEvents: []
  },
  {
    id: "CT-102",
    phase: "I",
    title: "Dual-Target CAR-T in Relapsed Myeloma",
    description: "Phase I first-in-human cell therapy dose ranging study for BCMA/GPRC5D targeting in multiple myeloma.",
    enrolled: 24,
    target: 40,
    percentage: 60,
    estimatedCompletion: "Jun 2025",
    region: "North America",
    indication: "Hematology",
    aesTotal: 1,
    aesSevere: 1,
    aesMildMod: 0,
    aesUnresolved: 1,
    nextMilestone: "Dose Escalation",
    milestoneDate: "Sep 28, 2024",
    status: "attention",
    statusLabel: "Attention Needed",
    funnel: {
      screened: 32,
      enrolled: 24,
      active: 22,
      withdrawn: 2
    },
    milestones: [
      { id: "M-102-1", name: "Dose Escalation Cohort 3 Evaluation", due: "Sep 28, 2024", status: "active", dueDays: 26, completed: false, highlight: true, description: "Evaluating safety telemetry following Grade 3 CRS in Cohort 2." },
      { id: "M-102-2", name: "DSMB Cytokine Release Review", due: "Oct 10, 2024", status: "pending", dueDays: 38, completed: false, description: "Safety committee review of neurotoxicity and CRS management." }
    ],
    recommendation: {
      priority: "High Priority",
      priorityLevel: "high",
      title: "Review Grade 3 CRS event prior to dose increase",
      reason: "Single active severe adverse event (Cytokine Release Syndrome) documented in Cohort 2 subject PT-1021.",
      actionText: "Review Adverse Event",
      actionType: "events",
      targetSite: "SITE-501"
    },
    sites: [
      { id: "SITE-501", name: "Penn Medicine Abramson Center", location: "Philadelphia, PA", pi: "Dr. C. June", enrolled: 14, target: 20, status: "on_track", trajectory: "70%", flag: null },
      { id: "SITE-502", name: "Stanford Cancer Institute", location: "Palo Alto, CA", pi: "Dr. R. Majzner", enrolled: 10, target: 20, status: "on_track", trajectory: "50%", flag: null }
    ],
    patients: [
      { id: "PT-1021", site: "Penn Medicine (PA)", screenedDate: "Aug 01, 2024", enrolledDate: "Aug 08, 2024", status: "Active", age: 59, gender: "Male", cohort: "Cohort 2 (3x10^6 cells/kg)", lastVisit: "Day +14 Inpatient", aeCount: 1, notes: "Grade 3 Cytokine Release Syndrome on Aug 30. Responding to Tocilizumab." },
      { id: "PT-1022", site: "Stanford (CA)", screenedDate: "Aug 05, 2024", enrolledDate: "Aug 12, 2024", status: "Active", age: 66, gender: "Female", cohort: "Cohort 2 (3x10^6 cells/kg)", lastVisit: "Day +14 Outpatient", aeCount: 0, notes: "Grade 1 fever managed with supportive care. CAR-T persistence confirmed." }
    ],
    adverseEvents: [
      { id: "AE-1021", subjectId: "PT-1021", site: "Penn Medicine (PA)", severity: "Severe", grade: "Grade 3", term: "Cytokine Release Syndrome", date: "Aug 30, 2024", actionTaken: "Tocilizumab Administered", status: "Active", related: "Definite", duration: "3 days (Active)", flagged: true }
    ]
  },
  {
    id: "CT-021",
    phase: "III",
    title: "Secondary Prevention in High-Risk CVD",
    description: "Double-blind, randomized outcome trial of novel lipid-lowering agent in patients with prior acute coronary syndrome.",
    enrolled: 800,
    target: 800,
    percentage: 100,
    estimatedCompletion: "Completed",
    region: "Global (Multi-center)",
    indication: "Cardiology",
    aesTotal: 0,
    aesSevere: 0,
    aesMildMod: 0,
    aesUnresolved: 0,
    nextMilestone: "Final Report",
    milestoneDate: "Dec 01, 2024",
    status: "on_track",
    statusLabel: "Closed",
    funnel: {
      screened: 950,
      enrolled: 800,
      active: 0,
      withdrawn: 34
    },
    milestones: [
      { id: "M-21-1", name: "Final Study Report (CSR)", due: "Dec 01, 2024", status: "upcoming", dueDays: 90, completed: false, description: "Clinical Study Report drafting and biostatistical sign-off." },
      { id: "M-21-2", name: "FDA Briefing Package", due: "Jan 15, 2025", status: "pending", dueDays: 135, completed: false, description: "NDA electronic submission package compilation." }
    ],
    recommendation: {
      priority: "Low Priority",
      priorityLevel: "low",
      title: "Archive study master file documentation",
      reason: "Trial closed to enrollment and follow-up. Final statistical report validated.",
      actionText: "View Archival Status",
      actionType: "milestones",
      targetSite: null
    },
    sites: [
      { id: "SITE-601", name: "Brigham and Women's Hospital", location: "Boston, MA", pi: "Dr. M. Sabatine", enrolled: 300, target: 300, status: "completed", trajectory: "100%", flag: null },
      { id: "SITE-602", name: "Cleveland Clinic Heart Center", location: "Cleveland, OH", pi: "Dr. S. Nissen", enrolled: 280, target: 280, status: "completed", trajectory: "100%", flag: null },
      { id: "SITE-603", name: "Karolinska University Hospital", location: "Stockholm, SE", pi: "Dr. A. Lind", enrolled: 220, target: 220, status: "completed", trajectory: "100%", flag: null }
    ],
    patients: [
      { id: "PT-2101", site: "Brigham and Women's (MA)", screenedDate: "Jan 10, 2023", enrolledDate: "Jan 18, 2023", status: "Completed", age: 68, gender: "Male", cohort: "Active Drug", lastVisit: "Month 18 (Completed)", aeCount: 0, notes: "Study exit visit completed. LDL reduction maintained." },
      { id: "PT-2102", site: "Cleveland Clinic (OH)", screenedDate: "Jan 15, 2023", enrolledDate: "Jan 22, 2023", status: "Completed", age: 72, gender: "Female", cohort: "Active Drug", lastVisit: "Month 18 (Completed)", aeCount: 0, notes: "Zero MACE events recorded throughout study period." }
    ],
    adverseEvents: []
  },
  {
    id: "CT-114",
    phase: "IIb",
    title: "Neurodegenerative Biomarker Study",
    description: "Multicenter trial evaluating neurofilament light-chain reduction with oral antisense therapy in early ALS.",
    enrolled: 45,
    target: 80,
    percentage: 56,
    estimatedCompletion: "May 2025",
    region: "North America",
    indication: "Neurology",
    aesTotal: 2,
    aesSevere: 1,
    aesMildMod: 1,
    aesUnresolved: 1,
    nextMilestone: "Safety Review",
    milestoneDate: "Oct 24, 2024",
    status: "critical",
    statusLabel: "Critical",
    funnel: {
      screened: 60,
      enrolled: 45,
      active: 41,
      withdrawn: 4
    },
    milestones: [
      { id: "M-114-1", name: "Urgent Safety Review Meeting", due: "Oct 24, 2024", status: "active", dueDays: 26, completed: false, highlight: true, description: "DSMB and medical monitor evaluation of Grade 3 thrombocytopenia." },
      { id: "M-114-2", name: "Protocol Safety Amendment", due: "Nov 15, 2024", status: "pending", dueDays: 48, completed: false, description: "Mandatory platelet count monitoring frequency update." }
    ],
    recommendation: {
      priority: "High Priority",
      priorityLevel: "high",
      title: "Address unresolved thrombocytopenia cluster",
      reason: "Grade 3 thrombocytopenia detected at Northwestern site in subject PT-1141. Immediate DSMB safety consultation recommended.",
      actionText: "Review Adverse Event",
      actionType: "events",
      targetSite: "SITE-701"
    },
    sites: [
      { id: "SITE-701", name: "Northwestern Memorial Hospital", location: "Chicago, IL", pi: "Dr. T. Siddique", enrolled: 25, target: 40, status: "flagged", trajectory: "62.5%", flag: "Safety pause under consideration" },
      { id: "SITE-702", name: "Massachusetts General Hospital", location: "Boston, MA", pi: "Dr. M. Cudkowicz", enrolled: 20, target: 40, status: "on_track", trajectory: "50%", flag: null }
    ],
    patients: [
      { id: "PT-1141", site: "Northwestern (IL)", screenedDate: "Jul 05, 2024", enrolledDate: "Jul 12, 2024", status: "Active", age: 57, gender: "Male", cohort: "Arm A (High Dose)", lastVisit: "Week 6 Lab Check", aeCount: 1, notes: "Platelets dropped to 38k/uL on Aug 29. Dose suspended; daily CBC." },
      { id: "PT-1142", site: "Mass General (MA)", screenedDate: "Jul 10, 2024", enrolledDate: "Jul 16, 2024", status: "Active", age: 63, gender: "Female", cohort: "Arm B (Low Dose)", lastVisit: "Week 6 Visit", aeCount: 1, notes: "Post-LP headache resolved after blood patch on Aug 18." }
    ],
    adverseEvents: [
      { id: "AE-1141", subjectId: "PT-1141", site: "Northwestern (IL)", severity: "Severe", grade: "Grade 3", term: "Thrombocytopenia", date: "Aug 29, 2024", actionTaken: "Trial Drug Withheld", status: "Active", related: "Definite", duration: "4 days (Active)", flagged: true },
      { id: "AE-1142", subjectId: "PT-1142", site: "Mass General (MA)", severity: "Moderate", grade: "Grade 2", term: "Headache / CSF Leak", date: "Aug 18, 2024", actionTaken: "Epidural Blood Patch", status: "Resolved", related: "Probable", duration: "3 days", flagged: false }
    ]
  },
  {
    id: "CT-077",
    phase: "III",
    title: "Pediatric Rare Metabolic Cohort",
    description: "Enzyme replacement therapy optimization in pediatric MPS type II patients.",
    enrolled: 32,
    target: 60,
    percentage: 53,
    estimatedCompletion: "Nov 2025",
    region: "Asia-Pacific",
    indication: "Rare Disease / Pediatrics",
    aesTotal: 1,
    aesSevere: 0,
    aesMildMod: 1,
    aesUnresolved: 0,
    nextMilestone: "Annual DSMB",
    milestoneDate: "Nov 18, 2024",
    status: "on_track",
    statusLabel: "On Track",
    funnel: {
      screened: 38,
      enrolled: 32,
      active: 32,
      withdrawn: 0
    },
    milestones: [
      { id: "M-77-1", name: "Annual DSMB Review", due: "Nov 18, 2024", status: "upcoming", dueDays: 77, completed: false, description: "Yearly independent safety telemetry and growth velocity analysis." },
      { id: "M-77-2", name: "Year 1 Biomarker Analysis", due: "Jan 15, 2025", status: "pending", dueDays: 135, completed: false, description: "Urinary GAG reduction and functional 6-minute walk test." }
    ],
    recommendation: {
      priority: "Medium Priority",
      priorityLevel: "medium",
      title: "Coordinate APAC infusion site shipping schedules",
      reason: "Cold-chain distribution to Tokyo and Seoul sites requires holiday freight buffer.",
      actionText: "View Logistics Dossier",
      actionType: "patients",
      targetSite: null
    },
    sites: [
      { id: "SITE-801", name: "Tokyo University Hospital", location: "Tokyo, JP", pi: "Dr. K. Tanaka", enrolled: 18, target: 30, status: "on_track", trajectory: "60%", flag: null },
      { id: "SITE-802", name: "Seoul National University Hospital", location: "Seoul, KR", pi: "Dr. J. Park", enrolled: 14, target: 30, status: "on_track", trajectory: "46.7%", flag: null }
    ],
    patients: [
      { id: "PT-7701", site: "Tokyo Univ (JP)", screenedDate: "Jun 02, 2024", enrolledDate: "Jun 08, 2024", status: "Active", age: 9, gender: "Male", cohort: "Cohort 1 (Weekly ERT)", lastVisit: "Week 12 Infusion", aeCount: 1, notes: "Mild pyrexia during Week 8 infusion; pre-medication added." }
    ],
    adverseEvents: [
      { id: "AE-7701", subjectId: "PT-7701", site: "Tokyo Univ (JP)", severity: "Mild", grade: "Grade 1", term: "Pyrexia", date: "Aug 05, 2024", actionTaken: "Acetaminophen", status: "Resolved", related: "Probable", duration: "1 day" }
    ]
  },
  {
    id: "CT-063",
    phase: "II",
    title: "Monoclonal Antibody in Refractory RA",
    description: "Selective IL-23 receptor antagonist in patients with biologic-resistant rheumatoid arthritis.",
    enrolled: 90,
    target: 100,
    percentage: 90,
    estimatedCompletion: "Mar 2025",
    region: "Europe",
    indication: "Rheumatology",
    aesTotal: 2,
    aesSevere: 0,
    aesMildMod: 2,
    aesUnresolved: 0,
    nextMilestone: "Cohort B Closeout",
    milestoneDate: "Dec 15, 2024",
    status: "on_track",
    statusLabel: "On Track",
    funnel: {
      screened: 110,
      enrolled: 90,
      active: 88,
      withdrawn: 2
    },
    milestones: [
      { id: "M-63-1", name: "Cohort B Closeout", due: "Dec 15, 2024", status: "upcoming", dueDays: 104, completed: false, description: "Last patient last visit for secondary dosing arm." },
      { id: "M-63-2", name: "ACR20/50 Response Primary Readout", due: "Feb 28, 2025", status: "pending", dueDays: 179, completed: false, description: "Primary endpoint analysis of clinical response at Week 24." }
    ],
    recommendation: {
      priority: "Low Priority",
      priorityLevel: "low",
      title: "Verify last patient last visit scheduling",
      reason: "Final 10 patients scheduled for Week 24 endpoint visits in Q4 2024.",
      actionText: "View Visit Roster",
      actionType: "patients",
      targetSite: null
    },
    sites: [
      { id: "SITE-901", name: "University of Oxford Hospital", location: "Oxford, UK", pi: "Dr. G. Taylor", enrolled: 50, target: 50, status: "completed", trajectory: "100%", flag: null },
      { id: "SITE-902", name: "Karolinska Institute", location: "Stockholm, SE", pi: "Dr. E. Malm", enrolled: 40, target: 50, status: "on_track", trajectory: "80%", flag: null }
    ],
    patients: [
      { id: "PT-6301", site: "Oxford (UK)", screenedDate: "Mar 15, 2024", enrolledDate: "Mar 22, 2024", status: "Active", age: 48, gender: "Female", cohort: "Cohort A (300mg)", lastVisit: "Week 20 Visit", aeCount: 1, notes: "Grade 2 URI treated with amoxicillin. Resolved." },
      { id: "PT-6302", site: "Karolinska (SE)", screenedDate: "Mar 20, 2024", enrolledDate: "Mar 28, 2024", status: "Active", age: 53, gender: "Female", cohort: "Cohort B (150mg)", lastVisit: "Week 20 Visit", aeCount: 1, notes: "Grade 1 injection site reaction. Resolved spontaneously." }
    ],
    adverseEvents: [
      { id: "AE-6301", subjectId: "PT-6301", site: "Oxford (UK)", severity: "Moderate", grade: "Grade 2", term: "Upper Respiratory Infection", date: "Jul 29, 2024", actionTaken: "Antibiotics", status: "Resolved", related: "Possible", duration: "6 days" },
      { id: "AE-6302", subjectId: "PT-6302", site: "Karolinska (SE)", severity: "Mild", grade: "Grade 1", term: "Injection Site Erythema", date: "Aug 14, 2024", actionTaken: "None Required", status: "Resolved", related: "Probable", duration: "2 days" }
    ]
  },
  {
    id: "CT-130",
    phase: "I",
    title: "mRNA Neoantigen Vaccine in Solid Tumors",
    description: "Personalized poly-epitope mRNA vaccine combined with anti-PD1 in advanced gastrointestinal malignancies.",
    enrolled: 38,
    target: 45,
    percentage: 84,
    estimatedCompletion: "May 2025",
    region: "North America",
    indication: "Oncology",
    aesTotal: 3,
    aesSevere: 1,
    aesMildMod: 2,
    aesUnresolved: 1,
    nextMilestone: "Immunogenicity Cut",
    milestoneDate: "Oct 30, 2024",
    status: "attention",
    statusLabel: "Attention Needed",
    funnel: {
      screened: 48,
      enrolled: 38,
      active: 36,
      withdrawn: 2
    },
    milestones: [
      { id: "M-130-1", name: "Immunogenicity Data Cut", due: "Oct 30, 2024", status: "active", dueDays: 32, completed: false, highlight: true, description: "ELISpot and TCR sequencing assay cut across all vaccinated cohorts." },
      { id: "M-130-2", name: "ELISpot Assays Completion", due: "Nov 20, 2024", status: "pending", dueDays: 53, completed: false, description: "Central core laboratory immune response validation." }
    ],
    recommendation: {
      priority: "High Priority",
      priorityLevel: "high",
      title: "Expedite central lab blood sample processing",
      reason: "3 PBMC samples from Stanford site delayed in transit. Risk to immunogenicity endpoint timeline.",
      actionText: "Review Lab Logistics",
      actionType: "patients",
      targetSite: "SITE-1302"
    },
    sites: [
      { id: "SITE-1301", name: "UCSF Helen Diller Family Center", location: "San Francisco, CA", pi: "Dr. A. Ko", enrolled: 22, target: 25, status: "on_track", trajectory: "88%", flag: null },
      { id: "SITE-1302", name: "Stanford Cancer Institute", location: "Palo Alto, CA", pi: "Dr. S. George", enrolled: 16, target: 20, status: "flagged", trajectory: "80%", flag: "Sample transport delay" }
    ],
    patients: [
      { id: "PT-1301", site: "UCSF (CA)", screenedDate: "Jun 10, 2024", enrolledDate: "Jun 16, 2024", status: "Active", age: 60, gender: "Male", cohort: "Cohort 1 (mRNA + PD1)", lastVisit: "Week 10 Visit", aeCount: 1, notes: "Grade 3 Autoimmune Colitis on Aug 21. Steroids administered; drug held." },
      { id: "PT-1302", site: "Stanford (CA)", screenedDate: "Jun 14, 2024", enrolledDate: "Jun 20, 2024", status: "Active", age: 56, gender: "Female", cohort: "Cohort 1 (mRNA + PD1)", lastVisit: "Week 10 Visit", aeCount: 1, notes: "Sample collection complete; awaiting courier transit confirmation." }
    ],
    adverseEvents: [
      { id: "AE-1301", subjectId: "PT-1301", site: "UCSF (CA)", severity: "Severe", grade: "Grade 3", term: "Autoimmune Colitis", date: "Aug 21, 2024", actionTaken: "Corticosteroids & Hold", status: "Active", related: "Probable", duration: "11 days (Active)", flagged: true },
      { id: "AE-1302", subjectId: "PT-1302", site: "Stanford (CA)", severity: "Mild", grade: "Grade 1", term: "Chills", date: "Aug 04, 2024", actionTaken: "Paracetamol", status: "Resolved", related: "Definite", duration: "1 day" },
      { id: "AE-1303", subjectId: "PT-1301", site: "UCSF (CA)", severity: "Moderate", grade: "Grade 2", term: "Myalgia", date: "Aug 17, 2024", actionTaken: "NSAID", status: "Resolved", related: "Probable", duration: "4 days" }
    ]
  },
  {
    id: "CT-015",
    phase: "IV",
    title: "Post-Marketing Safety Registry",
    description: "Real-world evidence observational cohort evaluating long-term safety profile of oral anticoagulant in renal impairment.",
    enrolled: 150,
    target: 150,
    percentage: 100,
    estimatedCompletion: "Dec 2024",
    region: "Europe",
    indication: "Hematology",
    aesTotal: 0,
    aesSevere: 0,
    aesMildMod: 0,
    aesUnresolved: 0,
    nextMilestone: "Regulatory Submission",
    milestoneDate: "Nov 30, 2024",
    status: "on_track",
    statusLabel: "On Track",
    funnel: {
      screened: 165,
      enrolled: 150,
      active: 148,
      withdrawn: 2
    },
    milestones: [
      { id: "M-15-1", name: "Annual Safety Update Report (PSUR)", due: "Nov 30, 2024", status: "upcoming", dueDays: 89, completed: false, description: "Periodic Safety Update Report compilation for EMA/FDA." },
      { id: "M-15-2", name: "EMA Annual Report", due: "Dec 20, 2024", status: "pending", dueDays: 109, completed: false, description: "Final annual real-world evidence summary submission." }
    ],
    recommendation: {
      priority: "Low Priority",
      priorityLevel: "low",
      title: "Generate annual PSUR draft for sponsor review",
      reason: "All 150 electronic health record extraction pipelines verified. Zero safety signals detected.",
      actionText: "Download Report Draft",
      actionType: "milestones",
      targetSite: null
    },
    sites: [
      { id: "SITE-1501", name: "Erasmus Medical Center", location: "Rotterdam, NL", pi: "Dr. J. Van Der Meer", enrolled: 75, target: 75, status: "completed", trajectory: "100%", flag: null },
      { id: "SITE-1502", name: "University of Zurich Hospital", location: "Zurich, CH", pi: "Dr. F. Keller", enrolled: 75, target: 75, status: "completed", trajectory: "100%", flag: null }
    ],
    patients: [
      { id: "PT-1501", site: "Erasmus MC (NL)", screenedDate: "Jan 10, 2024", enrolledDate: "Jan 15, 2024", status: "Active", age: 74, gender: "Male", cohort: "CrCl 30-50 mL/min", lastVisit: "Month 6 RWE Check", aeCount: 0, notes: "No bleeding events logged in EHR extraction." },
      { id: "PT-1502", site: "Univ Zurich (CH)", screenedDate: "Jan 12, 2024", enrolledDate: "Jan 18, 2024", status: "Active", age: 69, gender: "Female", cohort: "CrCl 30-50 mL/min", lastVisit: "Month 6 RWE Check", aeCount: 0, notes: "Renal function stable; no dose change." }
    ],
    adverseEvents: []
  },
  {
    id: "CT-095",
    phase: "II",
    title: "Triple-Negative Breast Cancer Combination",
    description: "Phase II evaluating PARP inhibitor in combination with anti-PD-L1 in BRCA-mutated metastatic TNBC.",
    enrolled: 76,
    target: 120,
    percentage: 63,
    estimatedCompletion: "Sep 2025",
    region: "Asia-Pacific",
    indication: "Oncology",
    aesTotal: 1,
    aesSevere: 0,
    aesMildMod: 1,
    aesUnresolved: 0,
    nextMilestone: "Futility Analysis",
    milestoneDate: "Jan 10, 2025",
    status: "on_track",
    statusLabel: "On Track",
    funnel: {
      screened: 98,
      enrolled: 76,
      active: 72,
      withdrawn: 4
    },
    milestones: [
      { id: "M-95-1", name: "Interim Futility Analysis", due: "Jan 10, 2025", status: "upcoming", dueDays: 130, completed: false, description: "Planned interim futility cut at 40 evaluable subject scans." },
      { id: "M-95-2", name: "ORR Primary Assessment", due: "Apr 15, 2025", status: "pending", dueDays: 225, completed: false, description: "Central independent blinded radiology read (BICR)." }
    ],
    recommendation: {
      priority: "Medium Priority",
      priorityLevel: "medium",
      title: "Monitor RECIST 1.1 central radiological reads",
      reason: "First 40 patients approaching 16-week scan window. Central reader calibration complete.",
      actionText: "View Imaging Queue",
      actionType: "milestones",
      targetSite: null
    },
    sites: [
      { id: "SITE-951", name: "National Cancer Centre Singapore", location: "Singapore, SG", pi: "Dr. T. Lim", enrolled: 40, target: 60, status: "on_track", trajectory: "66.7%", flag: null },
      { id: "SITE-952", name: "Queen Mary Hospital", location: "Hong Kong, HK", pi: "Dr. V. Wong", enrolled: 36, target: 60, status: "on_track", trajectory: "60%", flag: null }
    ],
    patients: [
      { id: "PT-9501", site: "NCC Singapore (SG)", screenedDate: "May 08, 2024", enrolledDate: "May 14, 2024", status: "Active", age: 51, gender: "Female", cohort: "BRCA1-mutated", lastVisit: "Week 16 Scan", aeCount: 1, notes: "Grade 2 Anemia on Aug 12. 1 unit PRBC transfused; resolved." },
      { id: "PT-9502", site: "Queen Mary (HK)", screenedDate: "May 15, 2024", enrolledDate: "May 22, 2024", status: "Active", age: 47, gender: "Female", cohort: "BRCA2-mutated", lastVisit: "Week 12 Visit", aeCount: 0, notes: "Target lesion reduction -28% by investigator RECIST 1.1." }
    ],
    adverseEvents: [
      { id: "AE-9501", subjectId: "PT-9501", site: "NCC Singapore (SG)", severity: "Moderate", grade: "Grade 2", term: "Anemia", date: "Aug 12, 2024", actionTaken: "Blood Transfusion", status: "Resolved", related: "Probable", duration: "3 days" }
    ]
  }
];
