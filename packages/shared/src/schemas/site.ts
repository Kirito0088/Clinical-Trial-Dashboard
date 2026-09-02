import { z } from 'zod';

export const siteEnrollmentSchema = z.object({
  id: z.string(),
  siteName: z.string(),
  region: z.string(),
  targetEnrollment: z.number().int(),
  activeSubjects: z.number().int(),
  enrolledSubjects: z.number().int(),
  screenFailed: z.number().int(),
  withdrawn: z.number().int(),
  activationDate: z.string(),
  isNonEnrolling: z.boolean(),
});
export type SiteEnrollment = z.infer<typeof siteEnrollmentSchema>;
