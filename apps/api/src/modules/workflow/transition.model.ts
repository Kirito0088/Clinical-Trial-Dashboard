import { Schema, model } from 'mongoose';
import { STAGES } from '@gvhax/shared';
import { jsonTransform } from '../../lib/query.js';

const transitionSchema = new Schema(
  {
    resource: { type: String, required: true, index: true },
    resourceId: { type: String, required: true, index: true },
    from: { type: String, enum: [...STAGES, null], default: null },
    to: { type: String, enum: STAGES, required: true },
    note: { type: String },
    actorId: { type: String, default: null },
    actorName: { type: String, default: null },
    dwellHours: { type: Number, default: null },
    breachedSla: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: jsonTransform },
);

export const Transition = model('Transition', transitionSchema);
