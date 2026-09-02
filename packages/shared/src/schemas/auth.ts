import { z } from 'zod';
import { ROLES } from '../constants.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6, 'Use at least 6 characters').max(128),
  role: z.enum(ROLES).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const publicUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(ROLES),
  createdAt: z.string(),
});
export type PublicUser = z.infer<typeof publicUserSchema>;

export interface AuthPayload {
  token: string;
  user: PublicUser;
}

/** Shape of the decoded JWT. */
export interface JwtClaims {
  sub: string;
  email: string;
  role: (typeof ROLES)[number];
  iat: number;
  exp: number;
}
