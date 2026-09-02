import bcrypt from 'bcryptjs';
import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import { ROLES, type Role } from '@gvhax/shared';
import { jsonTransform } from '../../lib/query.js';

export interface UserAttrs {
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

interface UserMethods {
  checkPassword(plain: string): Promise<boolean>;
}

export type UserDoc = HydratedDocument<UserAttrs, UserMethods>;
type UserModel = Model<UserAttrs, Record<string, never>, UserMethods>;

const userSchema = new Schema<UserAttrs, UserModel, UserMethods>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    // Excluded by default so a stray `find()` can never leak the hash.
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'user', index: true },
  },
  { timestamps: true, toJSON: jsonTransform },
);

// Hash on save so no caller can accidentally persist a plaintext password.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.method('checkPassword', function checkPassword(this: UserDoc, plain: string) {
  return bcrypt.compare(plain, this.password);
});

export const User = model<UserAttrs, UserModel>('User', userSchema);
