import { Router } from 'express';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { ok, wrap } from '../../lib/http.js';

export const reportRouter: Router = Router();

const rowSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]));

const reportSchema = z.object({
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(200).optional(),
  /** Label/value pairs rendered as a summary block. */
  fields: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
  /** Optional tabular section. */
  rows: z.array(rowSchema).max(500).default([]),
  /** Encoded into a QR code in the footer — a verification URL, an id, anything. */
  qr: z.string().max(2000).optional(),
  footer: z.string().max(300).optional(),
});

/**
 * Generate a PDF certificate / compliance report / test report.
 *
 * Covers the "auto-generate a formatted report or certificate" statements
 * (NAWI test reports, LMS completion certificates, compliance findings) and
 * pairs with the QR helper for the traceability statements.
 *
 * Streams straight to the response — no temp files, nothing to clean up.
 */
reportRouter.post(
  '/pdf',
  validate(reportSchema),
  wrap(async (req, res) => {
    const { title, subtitle, fields, rows, qr, footer } = req.body as z.infer<typeof reportSchema>;

    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: title } });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${slug(title)}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text(title, { align: 'left' });
    if (subtitle) doc.moveDown(0.3).fontSize(11).fillColor('#555').text(subtitle);
    doc.fillColor('#000').moveDown(1);

    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .strokeColor('#ddd')
      .stroke();
    doc.moveDown(1);

    for (const [label, value] of Object.entries(fields)) {
      doc.fontSize(10).fillColor('#666').text(label.toUpperCase(), { continued: false });
      doc.fontSize(12).fillColor('#000').text(String(value));
      doc.moveDown(0.5);
    }

    if (rows.length > 0) {
      doc.moveDown(0.5).fontSize(13).text('Details');
      doc.moveDown(0.4);

      const headers = Object.keys(rows[0]);
      const colWidth = (doc.page.width - 100) / headers.length;

      doc.fontSize(9).fillColor('#666');
      headers.forEach((h, i) => {
        doc.text(h, 50 + i * colWidth, doc.y, { width: colWidth, continued: i < headers.length - 1 });
      });
      doc.moveDown(0.4).fillColor('#000');

      for (const row of rows.slice(0, 60)) {
        // Start a new page before running off the bottom.
        if (doc.y > doc.page.height - 120) doc.addPage();
        const top = doc.y;
        headers.forEach((h, i) => {
          doc.fontSize(9).text(String(row[h] ?? ''), 50 + i * colWidth, top, { width: colWidth - 4 });
        });
        doc.moveDown(0.2);
      }
      if (rows.length > 60) {
        doc.moveDown(0.5).fontSize(8).fillColor('#888').text(`… ${rows.length - 60} more rows omitted`);
      }
    }

    if (qr) {
      const dataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 220 });
      const png = Buffer.from(dataUrl.split(',')[1], 'base64');
      if (doc.y > doc.page.height - 200) doc.addPage();
      doc.moveDown(1.5).image(png, 50, doc.y, { width: 110 });
      doc.moveDown(0.5).fontSize(8).fillColor('#888').text(qr, 50, doc.y + 115, { width: 300 });
    }

    doc
      .fontSize(8)
      .fillColor('#999')
      .text(footer ?? `Generated ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`, 50, doc.page.height - 60, {
        width: doc.page.width - 100,
        align: 'center',
      });

    doc.end();
  }),
);

/** Standalone QR as a data URL — for on-screen display and provenance labels. */
reportRouter.post(
  '/qr',
  validate(z.object({ text: z.string().min(1).max(2000), width: z.coerce.number().min(64).max(1024).default(256) })),
  wrap(async (req, res) => {
    const dataUrl = await QRCode.toDataURL(req.body.text, { margin: 1, width: req.body.width });
    ok(res, { dataUrl });
  }),
);

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'report';
}
