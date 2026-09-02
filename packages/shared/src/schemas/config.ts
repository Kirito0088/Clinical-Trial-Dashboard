import { z } from 'zod';

export const appConfigSchema = z.object({
  id: z.string(),
  asOfDate: z.string(),
  milestoneHorizonDays: z.number().int(),
  enrollmentShortfallThreshold: z.number(),
  minExposurePatientMonths: z.number(),
  aeRateAlert: z.number(),
  seriousEventReviewWindowDays: z.number().int(),
  nonEnrollingSiteGraceDays: z.number().int(),
});
export type AppConfig = z.infer<typeof appConfigSchema>;
