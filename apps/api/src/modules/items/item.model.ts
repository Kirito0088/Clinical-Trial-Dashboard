import { Schema, model } from 'mongoose';
import { PRIORITIES, STAGES } from '@gvhax/shared';
import { jsonTransform } from '../../lib/query.js';

const geoPoint = new Schema(
  { lat: Number, lng: Number, label: String },
  { _id: false },
);

const attachment = new Schema(
  { fileId: String, filename: String, contentType: String, size: Number },
  { _id: false },
);

const itemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'general', index: true },
    stage: { type: String, enum: STAGES, default: 'draft', index: true },
    priority: { type: String, enum: PRIORITIES, default: 'medium', index: true },
    tags: { type: [String], default: [] },
    amount: { type: Number, default: 0 },
    startDate: { type: Date },
    dueDate: { type: Date },
    location: { type: geoPoint, default: undefined },
    attachments: { type: [attachment], default: [] },
    metadata: { type: Schema.Types.Mixed, default: {} },

    ownerId: { type: String, default: null, index: true },
    votes: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0, select: false },
    ratingCount: { type: Number, default: 0, select: false },

    slaBreached: { type: Boolean, default: false },
    stageEnteredAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true, toJSON: jsonTransform, toObject: jsonTransform },
);

// Average rating is derived, never stored directly — avoids the classic
// "average drifts out of sync with the votes" bug.
itemSchema.virtual('rating').get(function computeRating(this: {
  ratingSum?: number;
  ratingCount?: number;
}) {
  if (!this.ratingCount) return 0;
  return Number(((this.ratingSum ?? 0) / this.ratingCount).toFixed(2));
});

itemSchema.index({ createdAt: -1 });
itemSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Item = model('Item', itemSchema);
