/**
 * Cross-cutting constants shared by the API and the web client.
 * Deliberately domain-neutral — rename/extend these when a problem
 * statement gives you real vocabulary.
 */

export const ROLES = ['admin', 'staff', 'user'] as const;
export type Role = (typeof ROLES)[number];

/** Role ranking, used by the `requireRole` middleware. Higher wins. */
export const ROLE_RANK: Record<Role, number> = {
  admin: 30,
  staff: 20,
  user: 10,
};

/**
 * Generic workflow stages. Almost every "track a case through stages"
 * problem statement maps onto this shape — swap the labels, keep the machine.
 */
export const STAGES = ['draft', 'submitted', 'in_review', 'approved', 'rejected', 'closed'] as const;
export type Stage = (typeof STAGES)[number];

/** Which stage may move to which. The workflow service enforces this. */
export const STAGE_TRANSITIONS: Record<Stage, readonly Stage[]> = {
  draft: ['submitted'],
  submitted: ['in_review', 'rejected'],
  in_review: ['approved', 'rejected'],
  approved: ['closed'],
  rejected: ['draft', 'closed'],
  closed: [],
};

/** Default SLA per stage, in hours. Breaches are flagged, never enforced. */
export const STAGE_SLA_HOURS: Record<Stage, number> = {
  draft: 72,
  submitted: 24,
  in_review: 48,
  approved: 24,
  rejected: 24,
  closed: 0,
};

export const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const SOCKET_EVENTS = {
  /** Server -> client: something in a collection changed. */
  RESOURCE_CHANGED: 'resource:changed',
  /** Server -> client: a generic metric tick, for live dashboards. */
  METRIC_TICK: 'metric:tick',
  /** Client -> server: subscribe to a room, e.g. "items" or "queue". */
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
} as const;
