import { describe, expect, it } from 'vitest';
import { Patrol } from './Patrol.js';
import { Waypoint } from './Waypoint.js';
import { PatrolStatus, SyncStatus } from './enums.js';

const assignment = { id: 'a1', route: { id: 'r1' } };
const makePatrol = () => new Patrol({ id: 'p1', assignment, rangerId: 'r1' });

describe('Patrol lifecycle and distance', () => {
  it('starts and completes with timestamps', () => {
    const patrol = makePatrol();
    expect(patrol.start().status).toBe(PatrolStatus.IN_PROGRESS);
    expect(patrol.startedAt).toBeTruthy();
    expect(patrol.complete().status).toBe(PatrolStatus.COMPLETED);
    expect(patrol.completedAt).toBeTruthy();
  });

  it('rejects illegal lifecycle transitions and missing assignments', () => {
    expect(() => new Patrol({ rangerId: 'r1' })).toThrow();
    expect(() => makePatrol().complete()).toThrow(/in-progress/);
    expect(() => makePatrol().addWaypoint({ latitude: 0, longitude: 0 })).toThrow(/in-progress/);
    expect(() => makePatrol().markPendingSync()).toThrow(/completed/);
    expect(() => makePatrol().markSynced()).toThrow(/completed/);
  });

  it('accepts points only during active patrols', () => {
    const patrol = makePatrol().start();
    expect(() => patrol.addWaypoint(null)).toThrow(/waypoint/);
    expect(patrol.addWaypoint(Waypoint.createAutoPoint(0, 0)).waypoints).toHaveLength(1);
  });

  it.each([[0, 0], [1, 0]])('returns zero distance for %i point(s)', (count) => {
    const patrol = makePatrol().start();
    if (count) patrol.addWaypoint(Waypoint.createAutoPoint(0, 0));
    expect(patrol.totalDistance).toBe(0);
  });

  it('calculates a single segment with haversine distance', () => {
    const patrol = makePatrol().start()
      .addWaypoint(Waypoint.createAutoPoint(0, 0))
      .addWaypoint(Waypoint.createAutoPoint(0, 1));
    expect(patrol.totalDistance).toBeCloseTo(111.19, 1);
  });

  it('sums many segments and changes synchronization status', () => {
    const patrol = makePatrol().start()
      .addWaypoint(Waypoint.createAutoPoint(0, 0))
      .addWaypoint(Waypoint.createAutoPoint(0, 1))
      .addWaypoint(Waypoint.createAutoPoint(1, 1))
      .complete();
    expect(patrol.totalDistance).toBeGreaterThan(220);
    expect(patrol.markPendingSync().syncStatus).toBe(SyncStatus.PENDING_SYNC);
    expect(patrol.markSynced().syncStatus).toBe(SyncStatus.SYNCED);
  });
});
