import { Schema, model } from 'mongoose';
import { jsonTransform } from '../../lib/query.js';

const columnProfile = new Schema(
  {
    name: String,
    kind: String,
    nullCount: Number,
    uniqueCount: Number,
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    mean: { type: Number, default: null },
    topValues: [{ _id: false, value: String, count: Number }],
  },
  { _id: false },
);

const datasetSchema = new Schema(
  {
    name: { type: String, required: true },
    rowCount: { type: Number, default: 0 },
    columns: { type: [columnProfile], default: [] },
    /** Rows are stored inline. Fine to ~50k rows, which is well past demo scale. */
    rows: { type: [Schema.Types.Mixed], default: [], select: false },
    ownerId: { type: String, default: null },
  },
  { timestamps: true, toJSON: jsonTransform },
);

export const Dataset = model('Dataset', datasetSchema);
