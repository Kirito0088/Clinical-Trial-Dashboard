/**
 * Prisma seed — Clinical Trial Monitoring Dashboard (SIH26046)
 * Deterministic demo data. Same input + asOfDate = same output every run.
 *
 * Run with: npx prisma db seed
 */

import { PrismaClient, Phase, TrialStatus, AeSeverity } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Clinical Trials Dashboard...');

  // ── AppConfig ────────────────────────────────────────────────────────────
  await prisma.appConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      asOfDate: new Date('2026-09-01T00:00:00.000Z'),
      milestoneHorizonDays: 30,
      enrollmentShortfallThreshold: 0.15,
      minExposurePatientMonths: 24,
      aeRateAlert: 15,
      seriousEventReviewWindowDays: 7,
      nonEnrollingSiteGraceDays: 45,
    },
  });

  // ── Trial 1: CT-DEMO-001 ─────────────────────────────────────────────────
  await prisma.trial.upsert({
    where: { id: 'CT-DEMO-001' },
    update: {},
    create: {
      id: 'CT-DEMO-001',
      title: 'Cardiology Phase III — Amlodipine Besylate',
      sponsor: 'NovaPharma Inc.',
      phase: Phase.PHASE_3,
      status: TrialStatus.ACTIVE,
      conditionArea: 'Cardiology',
      interventionType: 'Drug',
      targetEnrollment: 300,
      plannedStart: new Date('2025-11-01'),
      plannedEnd: new Date('2027-02-28'),
      sites: {
        create: [
          { id: 'S-001-01', siteName: 'Apollo Hospital, Delhi', region: 'North India', targetEnrollment: 100, activationDate: new Date('2025-11-15') },
          { id: 'S-001-02', siteName: 'KEM Hospital, Mumbai', region: 'West India', targetEnrollment: 100, activationDate: new Date('2025-11-20') },
          { id: 'S-001-03', siteName: 'CMC Vellore', region: 'South India', targetEnrollment: 100, activationDate: new Date('2025-12-01') },
        ],
      },
      milestones: {
        create: [
          { id: 'M-001-01', type: 'FPFV', plannedDate: new Date('2025-12-01'), actualDate: new Date('2025-12-05') },
          { id: 'M-001-02', type: 'Interim Analysis', plannedDate: new Date('2026-06-15'), actualDate: new Date('2026-06-20') },
          { id: 'M-001-03', type: 'DSMB Review', plannedDate: new Date('2026-09-15'), actualDate: null },
          { id: 'M-001-04', type: 'LPLV', plannedDate: new Date('2027-01-15'), actualDate: null },
          { id: 'M-001-05', type: 'DB Lock', plannedDate: new Date('2027-02-28'), actualDate: null },
        ],
      },
    },
  });

  // Subjects for CT-DEMO-001
  const subjects001 = [
    { id: 'SUBJ-001-0001', siteId: 'S-001-01', screenedDate: new Date('2025-12-10'), enrolledDate: new Date('2025-12-18'), withdrawnDate: null },
    { id: 'SUBJ-001-0002', siteId: 'S-001-01', screenedDate: new Date('2025-12-12'), enrolledDate: new Date('2025-12-20'), withdrawnDate: null },
    { id: 'SUBJ-001-0042', siteId: 'S-001-01', screenedDate: new Date('2026-02-01'), enrolledDate: new Date('2026-02-08'), withdrawnDate: null },
    { id: 'SUBJ-001-0089', siteId: 'S-001-02', screenedDate: new Date('2026-01-15'), enrolledDate: new Date('2026-01-22'), withdrawnDate: null },
    { id: 'SUBJ-001-0112', siteId: 'S-001-03', screenedDate: new Date('2026-03-01'), enrolledDate: new Date('2026-03-08'), withdrawnDate: null },
    { id: 'SUBJ-001-SF01', siteId: 'S-001-02', screenedDate: new Date('2025-12-15'), enrolledDate: null, screenFailReason: 'Renal impairment above threshold' },
  ];
  for (const s of subjects001) {
    await prisma.subject.upsert({ where: { id: s.id }, update: {}, create: { ...s, trialId: 'CT-DEMO-001' } });
  }

  // Adverse Events for CT-DEMO-001
  const aes001 = [
    {
      id: 'AE-007865', siteId: 'S-001-01', subjectRef: 'SUBJ-001-0042',
      onsetDate: new Date('2026-08-10'), resolvedDate: null,
      term: 'Severe Hypotension', symptoms: ['Hypotension', 'Dizziness', 'Syncope'],
      severityGrade: AeSeverity.SEVERE, seriousFlag: true, outcome: 'Not yet resolved',
      drugName: 'Amlodipine Besylate', drugClass: 'Calcium Channel Blocker',
      patientAge: 67, patientSex: 'Male', suspectedRelationship: 'Probable',
      riskLevelSeed: 'High', reviewPrioritySeed: 'Urgent',
      riskFactorsSeed: 'Elderly patient, pre-existing renal impairment, concomitant ACE inhibitor',
      staffRecommendationSeed: 'Immediate dose reduction; cardiology consult; increase monitoring frequency to q4h vitals',
      caseSummary: 'Elderly male patient developed severe hypotension 72h post dose escalation.',
      eventNarrative: 'Patient experienced symptomatic hypotension requiring IV fluid resuscitation. BP nadir 74/42 mmHg. IV fluids administered with partial response.',
    },
    {
      id: 'AE-007866', siteId: 'S-001-02', subjectRef: 'SUBJ-001-0089',
      onsetDate: new Date('2026-08-15'), resolvedDate: null,
      term: 'Peripheral Edema', symptoms: ['Edema', 'Weight Gain', 'Fatigue'],
      severityGrade: AeSeverity.MODERATE, seriousFlag: true, outcome: 'Not yet resolved',
      drugName: 'Amlodipine Besylate', drugClass: 'Calcium Channel Blocker',
      patientAge: 55, patientSex: 'Female', suspectedRelationship: 'Possible',
      riskLevelSeed: 'Medium', reviewPrioritySeed: 'Standard',
      riskFactorsSeed: 'History of CHF, concurrent diuretic use',
      staffRecommendationSeed: 'Monitor weight daily; consider dose adjustment; assess cardiac function',
      caseSummary: 'Female patient with CHF history developed progressive peripheral edema.',
      eventNarrative: 'Bilateral lower extremity edema noted at Week 12 visit. 3kg weight gain over 2 weeks.',
    },
    {
      id: 'AE-007870', siteId: 'S-001-03', subjectRef: 'SUBJ-001-0112',
      onsetDate: new Date('2026-07-20'), resolvedDate: new Date('2026-08-05'),
      term: 'Headache', symptoms: ['Headache', 'Nausea'],
      severityGrade: AeSeverity.MILD, seriousFlag: false, outcome: 'Resolved',
      drugName: 'Amlodipine Besylate', drugClass: 'Calcium Channel Blocker',
      patientAge: 45, patientSex: 'Male', suspectedRelationship: 'Unlikely',
      riskLevelSeed: 'Low', reviewPrioritySeed: 'Routine',
      riskFactorsSeed: 'None identified',
      staffRecommendationSeed: 'Continue current dose; symptomatic management with acetaminophen',
      caseSummary: 'Mild headache following dose initiation, self-limited.',
      eventNarrative: 'Patient reported intermittent headache for 2 weeks following first dose. Resolved without intervention.',
    },
  ];
  for (const ae of aes001) {
    await prisma.adverseEvent.upsert({ where: { id: ae.id }, update: {}, create: { ...ae, trialId: 'CT-DEMO-001' } });
  }

  // ── Trial 2: CT-DEMO-002 ─────────────────────────────────────────────────
  await prisma.trial.upsert({
    where: { id: 'CT-DEMO-002' },
    update: {},
    create: {
      id: 'CT-DEMO-002',
      title: 'Oncology Phase II — Pembrolizumab Combination',
      sponsor: 'BioGenesis Labs',
      phase: Phase.PHASE_2,
      status: TrialStatus.RECRUITING,
      conditionArea: 'Oncology',
      interventionType: 'Biologic',
      targetEnrollment: 200,
      plannedStart: new Date('2026-01-15'),
      plannedEnd: new Date('2027-06-30'),
      sites: {
        create: [
          { id: 'S-002-01', siteName: 'Tata Memorial Hospital', region: 'West India', targetEnrollment: 80, activationDate: new Date('2026-02-01') },
          { id: 'S-002-02', siteName: 'AIIMS New Delhi', region: 'North India', targetEnrollment: 80, activationDate: new Date('2026-02-15') },
          { id: 'S-002-03', siteName: 'Mumbai Central Institute', region: 'West India', targetEnrollment: 40, activationDate: new Date('2026-07-12') },
        ],
      },
      milestones: {
        create: [
          { id: 'M-002-01', type: 'FPFV', plannedDate: new Date('2026-02-15'), actualDate: new Date('2026-02-20') },
          { id: 'M-002-02', type: 'DSMB Review', plannedDate: new Date('2026-09-20'), actualDate: null },
          { id: 'M-002-03', type: 'Interim Analysis', plannedDate: new Date('2026-12-15'), actualDate: null },
          { id: 'M-002-04', type: 'LPLV', plannedDate: new Date('2027-06-30'), actualDate: null },
        ],
      },
    },
  });

  for (const s of [
    { id: 'SUBJ-002-0001', siteId: 'S-002-01', screenedDate: new Date('2026-02-25'), enrolledDate: new Date('2026-03-05') },
    { id: 'SUBJ-002-0020', siteId: 'S-002-02', screenedDate: new Date('2026-03-10'), enrolledDate: new Date('2026-03-18') },
    { id: 'SUBJ-002-SF01', siteId: 'S-002-01', screenedDate: new Date('2026-02-28'), enrolledDate: null, screenFailReason: 'Prior immunotherapy within 6 months' },
  ]) {
    await prisma.subject.upsert({ where: { id: s.id }, update: {}, create: { ...s, trialId: 'CT-DEMO-002' } });
  }

  for (const ae of [
    {
      id: 'AE-002-001', siteId: 'S-002-01', subjectRef: 'SUBJ-002-0001',
      onsetDate: new Date('2026-05-10'), resolvedDate: null,
      term: 'Immune-mediated Colitis', symptoms: ['Diarrhea', 'Abdominal Pain', 'Rectal Bleeding'],
      severityGrade: AeSeverity.SEVERE, seriousFlag: true, outcome: 'Ongoing — steroid treatment initiated',
      drugName: 'Pembrolizumab', drugClass: 'PD-1 Inhibitor',
      patientAge: 52, patientSex: 'Female', suspectedRelationship: 'Probable',
      riskLevelSeed: 'High', reviewPrioritySeed: 'Urgent',
      riskFactorsSeed: 'Prior autoimmune history, high-dose combination regimen',
      staffRecommendationSeed: 'Hold pembrolizumab; initiate high-dose corticosteroids; GI consult urgently',
      caseSummary: 'Grade 3 immune-mediated colitis requiring treatment hold and steroid initiation.',
      eventNarrative: 'Patient developed Grade 3 diarrhea (>7 stools/day above baseline) at Week 8. Colonoscopy confirmed colitis.',
    },
  ]) {
    await prisma.adverseEvent.upsert({ where: { id: ae.id }, update: {}, create: { ...ae, trialId: 'CT-DEMO-002' } });
  }

  // ── Trial 3: CT-DEMO-003 ─────────────────────────────────────────────────
  await prisma.trial.upsert({
    where: { id: 'CT-DEMO-003' },
    update: {},
    create: {
      id: 'CT-DEMO-003',
      title: 'Neurology Phase I — GLP-1 Receptor Agonist',
      sponsor: 'NeuroVita Therapeutics',
      phase: Phase.PHASE_1,
      status: TrialStatus.RECRUITING,
      conditionArea: 'Neurology',
      interventionType: 'Drug',
      targetEnrollment: 80,
      plannedStart: new Date('2026-04-01'),
      plannedEnd: new Date('2026-12-31'),
      sites: {
        create: [
          { id: 'S-003-01', siteName: 'NIMHANS Bangalore', region: 'South India', targetEnrollment: 40, activationDate: new Date('2026-04-10') },
          { id: 'S-003-02', siteName: 'PGI Chandigarh', region: 'North India', targetEnrollment: 40, activationDate: new Date('2026-04-20') },
        ],
      },
      milestones: {
        create: [
          { id: 'M-003-01', type: 'FPFV', plannedDate: new Date('2026-04-20'), actualDate: new Date('2026-04-25') },
          { id: 'M-003-02', type: 'Interim Analysis', plannedDate: new Date('2026-08-01'), actualDate: new Date('2026-08-05') },
          { id: 'M-003-03', type: 'DSMB Review', plannedDate: new Date('2026-09-10'), actualDate: new Date('2026-09-10') },
          { id: 'M-003-04', type: 'LPLV', plannedDate: new Date('2026-10-15'), actualDate: null },
          { id: 'M-003-05', type: 'DB Lock', plannedDate: new Date('2026-11-30'), actualDate: null },
        ],
      },
    },
  });

  for (const s of [
    { id: 'SUBJ-003-0001', siteId: 'S-003-01', screenedDate: new Date('2026-04-28'), enrolledDate: new Date('2026-05-05') },
    { id: 'SUBJ-003-0015', siteId: 'S-003-02', screenedDate: new Date('2026-05-10'), enrolledDate: new Date('2026-05-17') },
  ]) {
    await prisma.subject.upsert({ where: { id: s.id }, update: {}, create: { ...s, trialId: 'CT-DEMO-003' } });
  }

  // ── Trial 4: CT-DEMO-004 ─────────────────────────────────────────────────
  await prisma.trial.upsert({
    where: { id: 'CT-DEMO-004' },
    update: {},
    create: {
      id: 'CT-DEMO-004',
      title: 'Immunology Phase IV — Adalimumab Biosimilar',
      sponsor: 'SafeBridge Pharma',
      phase: Phase.PHASE_4,
      status: TrialStatus.ACTIVE,
      conditionArea: 'Immunology',
      interventionType: 'Biologic',
      targetEnrollment: 400,
      plannedStart: new Date('2025-06-01'),
      plannedEnd: new Date('2026-08-31'),
      sites: {
        create: [
          { id: 'S-004-01', siteName: 'SGPGI Lucknow', region: 'North India', targetEnrollment: 150, activationDate: new Date('2025-06-15') },
          { id: 'S-004-02', siteName: 'Medanta Gurugram', region: 'North India', targetEnrollment: 150, activationDate: new Date('2025-07-01') },
          { id: 'S-004-03', siteName: 'Fortis Mumbai', region: 'West India', targetEnrollment: 100, activationDate: new Date('2025-07-15') },
        ],
      },
      milestones: {
        create: [
          { id: 'M-004-01', type: 'FPFV', plannedDate: new Date('2025-07-01'), actualDate: new Date('2025-07-05') },
          { id: 'M-004-02', type: 'Interim Analysis', plannedDate: new Date('2025-12-15'), actualDate: new Date('2025-12-20') },
          { id: 'M-004-03', type: 'DSMB Review', plannedDate: new Date('2026-04-01'), actualDate: new Date('2026-04-03') },
          { id: 'M-004-04', type: 'LPLV', plannedDate: new Date('2026-07-31'), actualDate: new Date('2026-07-28') },
          { id: 'M-004-05', type: 'DB Lock', plannedDate: new Date('2026-08-25'), actualDate: null }, // OVERDUE
        ],
      },
    },
  });

  for (const s of [
    { id: 'SUBJ-004-0001', siteId: 'S-004-01', screenedDate: new Date('2025-07-10'), enrolledDate: new Date('2025-07-18') },
    { id: 'SUBJ-004-0050', siteId: 'S-004-02', screenedDate: new Date('2025-08-01'), enrolledDate: new Date('2025-08-08') },
    { id: 'SUBJ-004-0099', siteId: 'S-004-03', screenedDate: new Date('2025-09-01'), enrolledDate: new Date('2025-09-10') },
  ]) {
    await prisma.subject.upsert({ where: { id: s.id }, update: {}, create: { ...s, trialId: 'CT-DEMO-004' } });
  }

  for (const ae of [
    {
      id: 'AE-004-001', siteId: 'S-004-01', subjectRef: 'SUBJ-004-0001',
      onsetDate: new Date('2026-06-15'), resolvedDate: null,
      term: 'Serious Infection — Cellulitis', symptoms: ['Fever', 'Erythema', 'Swelling', 'Pain'],
      severityGrade: AeSeverity.SEVERE, seriousFlag: true, outcome: 'Hospitalized — IV antibiotics',
      drugName: 'Adalimumab Biosimilar', drugClass: 'TNF-alpha Inhibitor',
      patientAge: 61, patientSex: 'Male', suspectedRelationship: 'Probable',
      riskLevelSeed: 'High', reviewPrioritySeed: 'Urgent',
      riskFactorsSeed: 'TNF-alpha immunosuppression, diabetes mellitus Type 2, peripheral vascular disease',
      staffRecommendationSeed: 'Hold adalimumab; IV antibiotics; infectious disease consult; daily wound assessment',
      caseSummary: 'Serious cellulitis requiring hospitalization in patient on TNF-alpha inhibitor.',
      eventNarrative: 'Patient presented with rapidly spreading erythema of left lower extremity requiring emergency admission. Blood cultures drawn.',
    },
    {
      id: 'AE-004-002', siteId: 'S-004-02', subjectRef: 'SUBJ-004-0050',
      onsetDate: new Date('2026-07-10'), resolvedDate: null,
      term: 'Hepatotoxicity — ALT Elevation', symptoms: ['Elevated ALT', 'Fatigue', 'Jaundice'],
      severityGrade: AeSeverity.CRITICAL, seriousFlag: true, outcome: 'Drug held — monitoring LFTs',
      drugName: 'Adalimumab Biosimilar', drugClass: 'TNF-alpha Inhibitor',
      patientAge: 48, patientSex: 'Female', suspectedRelationship: 'Probable',
      riskLevelSeed: 'High', reviewPrioritySeed: 'Urgent',
      riskFactorsSeed: 'Concurrent methotrexate use, elevated baseline ALT',
      staffRecommendationSeed: 'Permanently discontinue; hepatology referral; liver biopsy consideration',
      caseSummary: 'Grade 4 ALT elevation (>20x ULN) requiring drug discontinuation.',
      eventNarrative: 'ALT found 28x ULN at scheduled Week 52 labs. Jaundice present. Hepatology consulted.',
    },
  ]) {
    await prisma.adverseEvent.upsert({ where: { id: ae.id }, update: {}, create: { ...ae, trialId: 'CT-DEMO-004' } });
  }

  // ── Trial 5: CT-DEMO-005 ─────────────────────────────────────────────────
  await prisma.trial.upsert({
    where: { id: 'CT-DEMO-005' },
    update: {},
    create: {
      id: 'CT-DEMO-005',
      title: 'Dermatology Phase II — Dupilumab Extension',
      sponsor: 'DermaCure Research',
      phase: Phase.PHASE_2,
      status: TrialStatus.PAUSED,
      conditionArea: 'Dermatology',
      interventionType: 'Drug',
      targetEnrollment: 150,
      plannedStart: new Date('2025-09-01'),
      plannedEnd: new Date('2026-12-31'),
      sites: {
        create: [
          { id: 'S-005-01', siteName: 'Ruby Hall Clinic', region: 'West India', targetEnrollment: 75, activationDate: new Date('2025-09-15') },
          { id: 'S-005-02', siteName: 'Christian Medical College Ludhiana', region: 'North India', targetEnrollment: 75, activationDate: new Date('2025-10-01') },
        ],
      },
      milestones: {
        create: [
          { id: 'M-005-01', type: 'FPFV', plannedDate: new Date('2025-10-01'), actualDate: new Date('2025-10-08') },
          { id: 'M-005-02', type: 'Interim Analysis', plannedDate: new Date('2026-05-15'), actualDate: new Date('2026-05-20') },
          { id: 'M-005-03', type: 'LPLV', plannedDate: new Date('2026-11-30'), actualDate: null },
          { id: 'M-005-04', type: 'DB Lock', plannedDate: new Date('2026-12-31'), actualDate: null },
        ],
      },
    },
  });

  for (const s of [
    { id: 'SUBJ-005-0001', siteId: 'S-005-01', screenedDate: new Date('2025-10-10'), enrolledDate: new Date('2025-10-18') },
    { id: 'SUBJ-005-0030', siteId: 'S-005-02', screenedDate: new Date('2025-11-01'), enrolledDate: new Date('2025-11-08') },
  ]) {
    await prisma.subject.upsert({ where: { id: s.id }, update: {}, create: { ...s, trialId: 'CT-DEMO-005' } });
  }

  console.log('✅ Seeding complete — 5 trials, sites, subjects, adverse events, milestones loaded.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
