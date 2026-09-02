import { Schema, model, type InferSchemaType } from 'mongoose';
import { jsonTransform } from '../../lib/query.js';

const auditSchema = new Schema(
  {
    action: { type: String, required: true },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String, default: null },
    actorId: { type: String, default: null, index: true },
    actorName: { type: String, default: null },
    actorRole: { type: String, default: null },
    method: { type: String, required: true },
    path: { type: String, required: true },
    statusCode: { type: Number, required: true },
    ip: { type: String, default: null },
    changes: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: jsonTransform },
);

auditSchema.index({ createdAt: -1 });

export type AuditDoc = InferSchemaType<typeof auditSchema>;
export const AuditLog = model('AuditLog', auditSchema);
