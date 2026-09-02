import { STAGE_SLA_HOURS, STAGE_TRANSITIONS, type Stage } from '@gvhax/shared';
import { HttpError } from '../../lib/http.js';
import { Transition } from './transition.model.js';

/** Any document this service can drive. */
interface Stageable {
  _id: unknown;
  stage: Stage;
  stageEnteredAt: Date;
  slaBreached: boolean;
  save: () => Promise<unknown>;
}

export interface Actor {
  id: string;
  name: string;
}

/**
 * Move a document to a new stage, recording the hop.
 *
 * Legality is checked against `STAGE_TRANSITIONS` rather than left to the
 * caller — a state machine that anyone can bypass is just a string field.
 * SLA breaches are *flagged, never blocked*: the dashboards want to show
 * "this sat in review for three days", not refuse the transition.
 */
export async function transitionStage<T extends Stageable>(
  doc: T,
  to: Stage,
  opts: { resource: string; note?: string; actor?: Actor | null } ,
): Promise<T> {
  const from = doc.stage;

  if (from === to) throw HttpError.badRequest(`Already in stage "${to}"`);

  const allowed = STAGE_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw HttpError.badRequest(
      `Cannot move from "${from}" to "${to}". Allowed: ${allowed.length ? allowed.join(', ') : 'none — this is a terminal stage'}`,
    );
  }

  const enteredAt = doc.stageEnteredAt ?? new Date();
  const dwellHours = (Date.now() - new Date(enteredAt).getTime()) / 36e5;
  const budget = STAGE_SLA_HOURS[from];
  const breached = budget > 0 && dwellHours > budget;

  doc.stage = to;
  doc.stageEnteredAt = new Date();
  // Once breached, stays breached — it is a historical fact about the record.
  doc.slaBreached = doc.slaBreached || breached;
  await doc.save();

  await Transition.create({
    resource: opts.resource,
    resourceId: String(doc._id),
    from,
    to,
    note: opts.note,
    actorId: opts.actor?.id ?? null,
    actorName: opts.actor?.name ?? null,
    dwellHours: Number(dwellHours.toFixed(2)),
    breachedSla: breached,
  });

  return doc;
}

/** Which stages this document may legally move to right now. Drives the UI. */
export function nextStages(from: Stage): readonly Stage[] {
  return STAGE_TRANSITIONS[from] ?? [];
}

/**
 * Recompute breach status without transitioning — for the "which records are
 * overdue right now" panel that most tracker statements want.
 */
export function isOverdue(stage: Stage, stageEnteredAt: Date | string): boolean {
  const budget = STAGE_SLA_HOURS[stage];
  if (!budget) return false;
  return (Date.now() - new Date(stageEnteredAt).getTime()) / 36e5 > budget;
}

export async function historyFor(resource: string, resourceId: string) {
  return Transition.find({ resource, resourceId }).sort({ createdAt: 1 }).lean();
}
