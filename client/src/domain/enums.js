/** Lifecycle values expected by the assumed API contract. */
export const PatrolStatus = Object.freeze({
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
});

/** Synchronization values expected by the assumed API contract. */
export const SyncStatus = Object.freeze({
  NOT_SYNCED: 'NOT_SYNCED',
  PENDING_SYNC: 'PENDING_SYNC',
  SYNCED: 'SYNCED',
});

/** Waypoint origin values expected by the assumed API contract. */
export const WaypointType = Object.freeze({
  AUTOMATIC: 'AUTOMATIC',
  MANUAL: 'MANUAL',
});
