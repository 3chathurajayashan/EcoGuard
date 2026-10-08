import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PatrolController } from './PatrolController.js';
import { Patrol } from '../domain/Patrol.js';
import { SyncStatus } from '../domain/enums.js';

const assignment = { id: 'a1', route: { id: 'r1', expectedWaypoints: [] } };

function setup({ assigned = assignment, save = true, online = true, syncSuccess = true, location = { latitude: 1, longitude: 2, altitude: 3 } } = {}) {
  const gps = {
    startTracking: vi.fn().mockResolvedValue(), stopTracking: vi.fn().mockResolvedValue(),
    getCurrentLocation: vi.fn().mockResolvedValue(location), resumeAutoTracking: vi.fn().mockResolvedValue(),
  };
  const records = [];
  const database = {
    saveLocally: vi.fn(async (patrol) => {
      if (save) {
        const index = records.findIndex((record) => record.id === patrol.id);
        if (index === -1) records.push(patrol);
        else records[index] = patrol;
      }
      return save;
    }),
    updateSyncStatus: vi.fn(async (patrol) => {
      const record = records.find((item) => item.id === patrol.id);
      if (record) record.syncStatus = patrol.syncStatus;
    }),
    getPendingPatrols: vi.fn(async () => records.filter((item) => item.syncStatus === SyncStatus.PENDING_SYNC)),
    getActivePatrol: vi.fn(async () => null),
  };
  const gateway = {
    isOnline: vi.fn().mockResolvedValue(online),
    synchronizePatrol: vi.fn().mockResolvedValue({ success: syncSuccess, message: 'unavailable' }),
  };
  const controller = new PatrolController({ gps, database, gateway, rangerId: 'ranger-1', assignment: assigned, gpsIntervalMs: 60_000, maxSyncAttempts: 5 });
  return { controller, gps, database, gateway, records };
}

describe('PatrolController offline-first orchestration', () => {
  beforeEach(() => vi.useRealTimers());

  it('rejects start when no route is assigned', async () => {
    const { controller } = setup({ assigned: null });
    await expect(controller.startPatrol()).rejects.toMatchObject({ code: 'NO_ASSIGNED_ROUTE' });
    expect(controller.getState().error).toMatch(/No assigned route/);
  });

  it('starts, saves immediately, and starts GPS strategy', async () => {
    const { controller, database, gps } = setup();
    const patrol = await controller.startPatrol();
    expect(patrol.status).toBe('IN_PROGRESS');
    expect(database.saveLocally).toHaveBeenCalledTimes(1);
    expect(gps.startTracking).toHaveBeenCalledOnce();
    await controller.dispose();
  });

  it('restores active patrol and last automatic position from local storage', async () => {
    const { controller, database, gps } = setup();
    const restored = new Patrol({
      id: 'persisted',
      status: 'IN_PROGRESS',
      assignment,
      rangerId: 'ranger-1',
      syncStatus: 'NOT_SYNCED',
      waypoints: [{ latitude: 5, longitude: 6, altitude: 7, type: 'AUTOMATIC' }],
    });
    database.getActivePatrol.mockResolvedValue(restored);
    await controller.getAssignedPatrol();
    expect(controller.patrol.id).toBe('persisted');
    expect(controller.lastLocation).toEqual({ latitude: 5, longitude: 6, altitude: 7 });
    expect(gps.startTracking).toHaveBeenCalledOnce();
    await controller.dispose();
  });

  it('does not continue when the initial local save fails', async () => {
    const { controller, gps } = setup({ save: false });
    await expect(controller.startPatrol()).rejects.toThrow(/save patrol/);
    expect(gps.startTracking).not.toHaveBeenCalled();
  });

  it('records GPS points immediately and resumes automatic tracking', async () => {
    const { controller, gps, database } = setup();
    await controller.startPatrol();
    expect(await controller.captureGpsPoint()).toBe(true);
    expect(controller.patrol.waypoints[0]).toMatchObject({ latitude: 1, longitude: 2, type: 'AUTOMATIC' });
    expect(database.saveLocally).toHaveBeenCalledTimes(2);
    expect(gps.resumeAutoTracking).toHaveBeenCalledOnce();
    await controller.dispose();
  });

  it('shows persistent GPS error then clears it after a valid reading', async () => {
    const { controller, gps } = setup();
    await controller.startPatrol();
    gps.getCurrentLocation.mockRejectedValueOnce(new Error('Permission denied'));
    expect(await controller.captureGpsPoint()).toBe(false);
    expect(controller.getState().gpsError).toBe('Permission denied');
    gps.getCurrentLocation.mockResolvedValueOnce({ latitude: 3, longitude: 4 });
    expect(await controller.captureGpsPoint()).toBe(true);
    expect(controller.getState().gpsError).toBe('');
    await controller.dispose();
  });

  it('does not create a false manual point when no position is available', async () => {
    const { controller, database } = setup();
    await controller.startPatrol();
    controller.lastLocation = null;
    const count = database.saveLocally.mock.calls.length;
    expect(await controller.saveManualWaypoint('', '', '', 'animal tracks')).toBe(false);
    expect(controller.patrol.waypoints).toHaveLength(0);
    expect(database.saveLocally).toHaveBeenCalledTimes(count);
    await controller.dispose();
  });

  it('saves manual point with description and validates missing description', async () => {
    const { controller } = setup();
    await controller.startPatrol();
    await controller.captureGpsPoint();
    expect(await controller.saveManualWaypoint('', '', '', 'Fresh tracks')).toBe(true);
    expect(controller.patrol.waypoints.at(-1).type).toBe('MANUAL');
    expect(await controller.saveManualWaypoint('', '', '', ' ')).toBe(false);
    await controller.dispose();
  });

  it('completes, saves locally, then marks the patrol synced', async () => {
    const { controller, database, gateway, gps } = setup();
    await controller.startPatrol();
    expect(await controller.completePatrol()).toBe(true);
    expect(gps.stopTracking).toHaveBeenCalledOnce();
    expect(database.saveLocally).toHaveBeenCalledTimes(2);
    expect(gateway.synchronizePatrol).toHaveBeenCalledOnce();
    expect(database.updateSyncStatus).toHaveBeenCalledOnce();
    expect(controller.patrol.syncStatus).toBe(SyncStatus.SYNCED);
  });

  it('keeps patrol active and displays error if completion cannot be saved', async () => {
    const { controller, database } = setup();
    await controller.startPatrol();
    database.saveLocally.mockResolvedValue(false);
    expect(await controller.completePatrol()).toBe(false);
    expect(controller.patrol.status).toBe('IN_PROGRESS');
    expect(controller.getState().error).toMatch(/remains active/);
  });

  it.each([{ online: false }, { online: true, syncSuccess: false }])('retains pending record after sync failure', async (options) => {
    const { controller, database, gateway } = setup(options);
    await controller.startPatrol();
    await controller.completePatrol();
    expect(controller.patrol.syncStatus).toBe(SyncStatus.PENDING_SYNC);
    expect(database.saveLocally).toHaveBeenCalledTimes(3);
    if (!options.online) expect(gateway.synchronizePatrol).not.toHaveBeenCalled();
    await controller.dispose();
  });

  it('rejects completing a patrol twice', async () => {
    const { controller } = setup();
    await controller.startPatrol();
    await controller.completePatrol();
    await expect(controller.completePatrol()).rejects.toThrow(/in-progress/);
    await controller.dispose();
  });

  it('retries pending records and handles both success and failure', async () => {
    const { controller, gateway, database } = setup({ syncSuccess: false });
    await controller.startPatrol();
    await controller.completePatrol();
    gateway.synchronizePatrol.mockResolvedValue({ success: true });
    expect(await controller.retryPendingSync()).toHaveLength(0);
    expect(database.updateSyncStatus).toHaveBeenCalledOnce();
    expect(await controller.retryPendingSync()).toEqual([]);
    await controller.dispose();
  });

  it('keeps a local pending record and reports local status update failure', async () => {
    const { controller, database } = setup();
    await controller.startPatrol();
    database.updateSyncStatus.mockRejectedValue(new Error('storage unavailable'));
    await controller.completePatrol();
    expect(controller.patrol.syncStatus).toBe(SyncStatus.PENDING_SYNC);
    expect(controller.getState().error).toMatch(/local sync status could not be updated/);
    expect(controller.getState().message).toBe('Saved locally - will sync automatically');
    await controller.dispose();
  });

  it('enforces configured retry attempts with exponential delays', async () => {
    vi.useFakeTimers();
    const { controller, gateway } = setup({ syncSuccess: false });
    controller.maxSyncAttempts = 3;
    await controller.startPatrol();
    await controller.completePatrol();
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(4000);
    expect(gateway.synchronizePatrol.mock.calls.length).toBeLessThanOrEqual(4);
    await controller.dispose();
  });
});
