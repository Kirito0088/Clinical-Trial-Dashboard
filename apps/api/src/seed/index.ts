import { faker } from '@faker-js/faker';
import { PRIORITIES, STAGES } from '@gvhax/shared';
import { connectDb, disconnectDb } from '../db/connect.js';
import { log } from '../lib/logger.js';
import { AuditLog } from '../modules/audit/audit.model.js';
import { User } from '../modules/auth/user.model.js';
import { Dataset } from '../modules/ingest/dataset.model.js';
import { profileRows } from '../modules/ingest/profile.js';
import { Item } from '../modules/items/item.model.js';
import { Transition } from '../modules/workflow/transition.model.js';
import { Chunk, ingest } from '../modules/ai/rag.js';

/**
 * Populates every surface in the kit with plausible demo data.
 *
 * Two rules it follows deliberately:
 *  - Deterministic (fixed faker seed), so the demo looks the same each run and
 *    screenshots stay valid.
 *  - Spread across the last 30 days with coordinates and date ranges, so the
 *    trend chart, the map and the Gantt timeline all have something to show
 *    rather than rendering empty.
 */

faker.seed(20260902);

const CATEGORIES = ['infrastructure', 'sanitation', 'water', 'roads', 'health', 'education'];
const TAGS = ['urgent', 'field-verified', 'budgeted', 'escalated', 'recurring', 'citizen-reported'];

// Roughly the bounding box of peninsular India, so the map opens somewhere useful.
const GEO = { latMin: 12.8, latMax: 19.2, lngMin: 72.8, lngMax: 79.9 };

const ITEM_COUNT = 120;

async function seed(): Promise<void> {
  await connectDb();

  log.info('clearing existing demo data');
  await Promise.all([
    Item.deleteMany({}),
    User.deleteMany({}),
    Transition.deleteMany({}),
    AuditLog.deleteMany({}),
    Dataset.deleteMany({}),
    Chunk.deleteMany({}),
  ]);

  // ── Users ──────────────────────────────────────────────────────────────
  // Password is the same for all three so nobody loses time at the login box.
  const users = await User.create([
    { name: 'Admin User', email: 'admin@gvhax.dev', password: 'password', role: 'admin' },
    { name: 'Staff User', email: 'staff@gvhax.dev', password: 'password', role: 'staff' },
    { name: 'Regular User', email: 'user@gvhax.dev', password: 'password', role: 'user' },
  ]);
  log.ok(`${users.length} users (all password: "password")`);

  // ── Items ──────────────────────────────────────────────────────────────
  const items = Array.from({ length: ITEM_COUNT }, () => {
    const createdAt = faker.date.recent({ days: 30 });
    const startDate = faker.date.soon({ days: 5, refDate: createdAt });
    const stage = faker.helpers.arrayElement(STAGES);

    return {
      title: faker.helpers.fake('{{company.buzzVerb}} {{commerce.productMaterial}} {{company.buzzNoun}}'),
      description: faker.lorem.paragraph({ min: 2, max: 4 }),
      category: faker.helpers.arrayElement(CATEGORIES),
      stage,
      priority: faker.helpers.arrayElement(PRIORITIES),
      tags: faker.helpers.arrayElements(TAGS, { min: 0, max: 3 }),
      amount: faker.number.int({ min: 5_000, max: 900_000 }),
      startDate,
      dueDate: faker.date.soon({ days: 40, refDate: startDate }),
      location: {
        lat: faker.number.float({ min: GEO.latMin, max: GEO.latMax, fractionDigits: 5 }),
        lng: faker.number.float({ min: GEO.lngMin, max: GEO.lngMax, fractionDigits: 5 }),
        label: faker.location.city(),
      },
      ownerId: faker.helpers.arrayElement(users).id,
      votes: faker.number.int({ min: 0, max: 240 }),
      ratingSum: faker.number.int({ min: 0, max: 80 }),
      ratingCount: faker.number.int({ min: 0, max: 20 }),
      // A quarter of records are deliberately overdue so the SLA panel is not empty.
      slaBreached: faker.datatype.boolean({ probability: 0.25 }),
      stageEnteredAt: faker.date.between({ from: createdAt, to: new Date() }),
      createdAt,
      updatedAt: createdAt,
    };
  });

  const created = await Item.insertMany(items, { ordered: false });
  log.ok(`${created.length} items`);

  // ── Transition history ─────────────────────────────────────────────────
  // Only for items past draft, so the history panel has real content.
  const transitions = created
    .filter((i) => i.stage !== 'draft')
    .slice(0, 60)
    .map((i) => ({
      resource: 'items',
      resourceId: String(i._id),
      from: 'draft' as const,
      to: 'submitted' as const,
      note: faker.helpers.arrayElement(['Filed by field officer', 'Auto-submitted', 'Escalated from intake']),
      actorId: users[1].id,
      actorName: users[1].email,
      dwellHours: faker.number.float({ min: 1, max: 90, fractionDigits: 2 }),
      breachedSla: faker.datatype.boolean({ probability: 0.2 }),
    }));
  await Transition.insertMany(transitions);
  log.ok(`${transitions.length} workflow transitions`);

  // ── A sample dataset, as if someone had already dropped a CSV ───────────
  const rows = Array.from({ length: 300 }, () => ({
    date: faker.date.recent({ days: 90 }).toISOString().slice(0, 10),
    region: faker.helpers.arrayElement(['North', 'South', 'East', 'West', 'Central']),
    category: faker.helpers.arrayElement(CATEGORIES),
    units: faker.number.int({ min: 1, max: 500 }),
    revenue: faker.number.int({ min: 1000, max: 200_000 }),
    satisfied: faker.datatype.boolean(),
  }));
  await Dataset.create({
    name: 'demo-operations.csv',
    rows,
    columns: profileRows(rows),
    rowCount: rows.length,
    ownerId: users[0].id,
  });
  log.ok(`1 dataset (${rows.length} rows)`);

  // ── RAG corpus ─────────────────────────────────────────────────────────
  await ingest(
    'default',
    [
      'The grievance redressal process has four stages: intake, verification, resolution and closure. Each stage carries a service-level target measured in working hours.',
      'Intake must be completed within 24 hours of a complaint being filed. A complaint that is not acknowledged within this window is automatically escalated to the district officer.',
      'Verification requires a field visit for any complaint whose estimated cost exceeds fifty thousand rupees. Below that threshold a photographic record is sufficient.',
      'Resolution targets differ by category. Water and sanitation complaints carry a 72-hour target; road and infrastructure complaints carry a 14-day target because they usually require procurement.',
      'Closure requires sign-off from both the assigned officer and the original complainant. If the complainant does not respond within seven days the case closes automatically and is marked deemed-resolved.',
    ].join('\n\n'),
    'Grievance Redressal Handbook (sample)',
  );
  log.ok('1 RAG corpus ingested');

  log.banner([
    'Seed complete.',
    '',
    'Log in with  admin@gvhax.dev / password',
    'Then open    http://localhost:5173/_kit',
  ]);

  await disconnectDb();
}

seed().catch(async (err) => {
  log.error('seed failed');
  console.error(err);
  await disconnectDb();
  process.exit(1);
});
