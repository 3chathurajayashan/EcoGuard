import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Patrol } from '../domain/Patrol.js';
import { Waypoint } from '../domain/Waypoint.js';
import { IndexedDbLocalDatabase } from './IndexedDbLocalDatabase.js';

describe('IndexedDbLocalDatabase', () => {
  let database;
  let patrol;

  beforeEach(() => {
    database = new IndexedDbLocalDatabase(`test-${crypto.randomUUID()}`);
    patrol = new Patrol({ id: 'p1', assignment: { id: 'a', route: {} }, rangerId: 'r' }).start();
    patrol.addWaypoint(Waypoint.createAutoPoint(1, 2));
    patrol.complete().markPendingSync();
  });

  it('saves and returns pending records from IndexedDB', async () => {
    expect(await database.saveLocally(patrol)).toBe(true);
    const records = await database.getPendingPatrols();
    expect(records).toHaveLength(1);
    expect(records[0].waypoints[0]).toMatchObject({ latitude: 1, longitude: 2 });
  });

  it('updates sync status and restores active patrols', async () => {
    const active = new Patrol({ id: 'active', assignment: { id: 'a', route: {} }, rangerId: 'r' }).start();
    await database.saveLocally(active);
    expect((await database.getActivePatrol()).id).toBe('active');
    patrol.markSynced();
    await database.updateSyncStatus(patrol);
    expect(await database.getPendingPatrols()).toHaveLength(0);
  });

  it('returns false on storage failure and logs explicitly', async () => {
    vi.spyOn(database, 'database').mockRejectedValue(new Error('storage denied'));
    const logger = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await database.saveLocally(patrol)).toBe(false);
    expect(logger).toHaveBeenCalled();
  });
});
