import { Router } from 'express';
import { Readable } from 'node:stream';
import multer from 'multer';
import mongoose from 'mongoose';
import { HttpError, ok, wrap } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';

export const filesRouter: Router = Router();

const BUCKET = 'uploads';
const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Files live in GridFS rather than on disk: it survives the in-memory database
 * tier, needs no writable directory, and keeps a single backup surface.
 */
function bucket(): mongoose.mongo.GridFSBucket {
  const db = mongoose.connection.db;
  if (!db) throw new HttpError(503, 'Database not connected', 'DB_DOWN');
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET });
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES } });

filesRouter.post(
  '/',
  requireAuth,
  upload.single('file'),
  wrap(async (req, res) => {
    if (!req.file) throw HttpError.badRequest('Attach a file under the "file" field');

    const stream = bucket().openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
      metadata: { uploadedBy: req.user?.id ?? null, uploadedAt: new Date() },
    });

    await new Promise<void>((resolve, reject) => {
      Readable.from(req.file!.buffer).pipe(stream).on('finish', resolve).on('error', reject);
    });

    res.status(201);
    ok(res, {
      fileId: String(stream.id),
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      size: req.file.size,
    });
  }),
);

filesRouter.get(
  '/',
  wrap(async (_req, res) => {
    const files = await bucket().find({}).sort({ uploadDate: -1 }).limit(100).toArray();
    ok(
      res,
      files.map((f) => ({
        fileId: String(f._id),
        filename: f.filename,
        contentType: f.contentType ?? 'application/octet-stream',
        size: f.length,
        uploadedAt: f.uploadDate,
      })),
    );
  }),
);

filesRouter.get(
  '/:id',
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw HttpError.badRequest('Invalid file id');
    const id = new mongoose.Types.ObjectId(req.params.id);

    const [meta] = await bucket().find({ _id: id }).limit(1).toArray();
    if (!meta) throw HttpError.notFound('File not found');

    res.setHeader('Content-Type', meta.contentType ?? 'application/octet-stream');
    // `inline` so images preview in the browser; add ?download=1 to force save.
    const disp = req.query.download ? 'attachment' : 'inline';
    res.setHeader('Content-Disposition', `${disp}; filename="${encodeURIComponent(meta.filename)}"`);
    bucket().openDownloadStream(id).pipe(res);
  }),
);

filesRouter.delete(
  '/:id',
  requireAuth,
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw HttpError.badRequest('Invalid file id');
    await bucket().delete(new mongoose.Types.ObjectId(req.params.id));
    ok(res, { id: req.params.id });
  }),
);
