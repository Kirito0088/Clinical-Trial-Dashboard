import { z } from 'zod';
import { AE_SEVERITIES } from '../constants.js';

export const adverseEventSchema = z.object({
  id: z.string(),
  trialId: z.string(),
  siteId: z.string(),
  subjectRef: z.string(),
  onsetDate: z.string(),
  resolvedDate: z.string().nullable(),
  term: z.string(),
  symptoms: z.array(z.string()),
  severityGrade: z.enum(AE_SEVERITIES),
  seriousFlag: z.boolean(),
  outcome: z.string(),
  drugName: z.string(),
  drugClass: z.string(),
  patientAge: z.number().int(),
  patientSex: z.string(),
  suspectedRelationship: z.string(),
  // Seed (deterministic fallback) fields
  riskLevelSeed: z.string(),
  reviewPrioritySeed: z.string(),
  riskFactorsSeed: z.string(),
  staffRecommendationSeed: z.string(),
  caseSummary: z.string(),
  eventNarrative: z.string(),
  // AI-generated (cached)
  aiRecommendation: z.string().nullable(),
  aiGeneratedAt: z.string().nullable(),
});
export type AdverseEvent = z.infer<typeof adverseEventSchema>;
