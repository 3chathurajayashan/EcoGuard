import { Patrol } from '../domain/Patrol.js';
import { Waypoint } from '../domain/Waypoint.js';
import { PatrolStatus, SyncStatus } from '../domain/enums.js';

/** Coordinates GPS, local repository, synchronization, and observable UI state. */
export class PatrolController {
  /**
   * @param {{ gps: import('../services/contracts.js').GPSInterface, database: import('../services/contracts.js').LocalDatabase, gateway: import('../services/contracts.js').SyncGateway, rangerId: string, assignment: object|null, gpsIntervalMs?: number, maxSyncAttempts?: number, onStateChange?: (state: object) => void }} dependencies
   */
  constructor({ gps, database, gateway, rangerId, assignment = null, gpsIntervalMs = 10_000, maxSyncAttempts = 5, onStateChange = () => {} }) {
    this.gps = gps;
    this.database = database;
    this.gateway = gateway;
    this.rangerId = rangerId;
    this.assignment = assignment;
    this.gpsIntervalMs = gpsIntervalMs;
    this.maxSyncAttempts = maxSyncAttempts;
    this.onStateChange = onStateChange;
    this.patrol = null;
    this.isSyncing = false;
    this.lastLocation = null;
    this.gpsError = '';
    this.error = '';
    this.message = '';
    this.pendingPatrols = [];
    this.retryAttempts = new Map();
    this.retryTimer = null;
    this.gpsTimer = null;
  }

  /** Return current assignment/patrol state. */
  async getAssignedPatrol() {
    if (!this.patrol && this.database.getActivePatrol) {
      this.patrol = await this.database.getActivePatrol();
      if (this.patrol) {
        this.assignment = this.patrol.assignment;
        const lastGpsPoint = [...this.patrol.waypoints].reverse().find((point) => point.type === 'AUTOMATIC');
        if (lastGpsPoint) {
          this.lastLocation = {
            latitude: lastGpsPoint.latitude,
            longitude: lastGpsPoint.longitude,
            altitude: lastGpsPoint.altitude,
          };
        }
        this.emit();
        await this.gps.startTracking().catch((error) => this.setGpsError(error));
        this.beginGpsPolling();
      }
    }
    this.emit();
    return this.patrol || this.assignment;
  }

  /** Start and persist an assigned patrol before tracking begins. */
  async startPatrol(assignment = this.assignment) {
    if (!assignment) {
      const error = new Error('No assigned route is available.');
      error.code = 'NO_ASSIGNED_ROUTE';
      this.error = error.message;
      this.emit();
      throw error;
    }
    if (this.patrol?.status === PatrolStatus.IN_PROGRESS) return this.patrol;
    this.assignment = assignment;
    this.patrol = new Patrol({ assignment, rangerId: this.rangerId }).start();
    if (!(await this.database.saveLocally(this.patrol))) {
      this.patrol = null;
      this.error = 'Could not save patrol on this device. Check available storage and try again.';
      this.emit();
      throw new Error(this.error);
    }
    this.error = '';
    this.message = 'Patrol started. Your route is saved on this device.';
    this.emit();
    try {
      await this.gps.startTracking();
      this.gpsError = '';
    } catch (error) {
      this.setGpsError(error);
    }
    this.beginGpsPolling();
    return this.patrol;
  }

  /** Capture and immediately persist one valid GPS waypoint. */
  async captureGpsPoint() {
    if (!this.patrol || this.patrol.status !== PatrolStatus.IN_PROGRESS) return false;
    try {
      const position = await this.gps.getCurrentLocation();
      const point = Waypoint.createAutoPoint(position.latitude, position.longitude, position.altitude ?? null);
      this.patrol.addWaypoint(point);
      if (!(await this.database.saveLocally(this.patrol))) {
        this.patrol.waypoints.pop();
        this.error = 'Could not save this GPS point locally. Earlier patrol data is preserved.';
        this.emit();
        return false;
      }
      this.lastLocation = position;
      this.gpsError = '';
      await this.gps.resumeAutoTracking();
      this.error = '';
      this.emit();
      return true;
    } catch (error) {
      this.setGpsError(error);
      return false;
    }
  }

  /** Add a manual point at supplied or last GPS coordinates. */
  async saveManualWaypoint(latitude, longitude, altitude, description) {
    const position = latitude === '' || latitude === null || latitude === undefined
      ? this.lastLocation
      : { latitude: Number(latitude), longitude: Number(longitude), altitude: altitude === '' ? null : Number(altitude) };
    if (!position) {
      this.error = 'No GPS position is available. Enter coordinates under Advanced to add a waypoint.';
      this.emit();
      return false;
    }
    try {
      const point = Waypoint.createManualPoint(position.latitude, position.longitude, position.altitude ?? null, description);
      if (!this.patrol || this.patrol.status !== PatrolStatus.IN_PROGRESS) throw new Error('Start a patrol before adding a waypoint.');
      this.patrol.addWaypoint(point);
      if (!(await this.database.saveLocally(this.patrol))) {
        this.patrol.waypoints.pop();
        this.error = 'Could not save this waypoint locally. Earlier patrol data is preserved.';
        this.emit();
        return false;
      }
      this.error = '';
      this.message = 'Manual waypoint saved on this device.';
      this.emit();
      return true;
    } catch (error) {
      this.error = error.message;
      this.emit();
      return false;
    }
  }

  /** Complete locally first, then synchronize without deleting the local record. */
  async completePatrol() {
    if (!this.patrol || this.patrol.status !== PatrolStatus.IN_PROGRESS) throw new Error('Only an in-progress patrol can be completed.');
    await this.stopTracking();
    this.patrol.complete();
    this.patrol.markPendingSync();
    if (!(await this.database.saveLocally(this.patrol))) {
      this.patrol.status = PatrolStatus.IN_PROGRESS;
      this.patrol.completedAt = null;
      this.patrol.syncStatus = SyncStatus.NOT_SYNCED;
      this.error = 'Could not save the completed patrol. It remains active on this device.';
      await this.gps.startTracking().catch((error) => this.setGpsError(error));
      this.beginGpsPolling();
      this.emit();
      return false;
    }
    this.error = '';
    this.message = 'Saved locally - will sync automatically';
    this.emit();
    await this.synchronize(this.patrol);
    await this.refreshPendingPatrols();
    return true;
  }

  /** Retry all pending records, and schedule exponential retries on failure. */
  async retryPendingSync({ manual = true } = {}) {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    const pending = await this.database.getPendingPatrols();
    this.pendingPatrols = pending;
    this.emit();
    const eligible = pending.filter((patrol) => manual || (this.retryAttempts.get(patrol.id) || 0) < this.maxSyncAttempts);
    if (!eligible.length) return pending;
    for (const patrol of eligible) await this.synchronize(patrol);
    await this.refreshPendingPatrols();
    return this.pendingPatrols;
  }

  async synchronize(patrol) {
    this.isSyncing = true;
    this.emit();
    const online = await this.gateway.isOnline();
    const result = online ? await this.gateway.synchronizePatrol(patrol) : { success: false, message: 'Network unavailable.' };
    this.isSyncing = false;
    if (result.success) {
      patrol.markSynced();
      try {
        await this.database.updateSyncStatus(patrol);
        this.retryAttempts.delete(patrol.id);
        if (this.patrol?.id === patrol.id) this.patrol.syncStatus = SyncStatus.SYNCED;
        this.error = '';
        this.message = 'Patrol synchronized successfully.';
      } catch (error) {
        patrol.markPendingSync();
        await this.database.saveLocally(patrol);
        if (this.patrol?.id === patrol.id) this.patrol.syncStatus = SyncStatus.PENDING_SYNC;
        this.error = `Patrol synchronized remotely, but its local sync status could not be updated: ${error.message}`;
        this.message = 'Saved locally - will sync automatically';
      }
    } else {
      patrol.markPendingSync();
      await this.database.saveLocally(patrol);
      this.message = 'Saved locally - will sync automatically';
      const attempts = (this.retryAttempts.get(patrol.id) || 0) + 1;
      this.retryAttempts.set(patrol.id, attempts);
      if (attempts < this.maxSyncAttempts) this.scheduleRetry(1000 * 2 ** (attempts - 1));
    }
    this.emit();
  }

  async refreshPendingPatrols() {
    this.pendingPatrols = await this.database.getPendingPatrols();
    this.emit();
  }

  setAssignment(assignment) {
    this.assignment = assignment;
    this.emit();
  }

  setGpsError(error) {
    this.gpsError = error?.message || 'GPS location is unavailable.';
    this.emit();
  }

  async stopTracking() {
    if (this.gpsTimer) clearInterval(this.gpsTimer);
    this.gpsTimer = null;
    await this.gps.stopTracking();
  }

  beginGpsPolling() {
    if (this.gpsTimer) clearInterval(this.gpsTimer);
    this.gpsTimer = setInterval(() => this.captureGpsPoint(), this.gpsIntervalMs);
  }

  scheduleRetry(delay = 30_000) {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (this.pendingPatrols.length === 0 && this.patrol?.syncStatus !== SyncStatus.PENDING_SYNC) return;
    this.retryTimer = setTimeout(() => this.retryPendingSync({ manual: false }), delay);
  }

  /** @returns {object} Serializable state for UI subscribers. */
  getState() {
    return {
      patrol: this.patrol,
      isSyncing: this.isSyncing,
      assignment: this.assignment,
      gpsError: this.gpsError,
      error: this.error,
      message: this.message,
      pendingPatrols: this.pendingPatrols,
      lastLocation: this.lastLocation,
    };
  }

  /** Observer pattern: push updates to all UI subscribers. */
  emit() {
    this.onStateChange(this.getState());
  }

  /** Release controller timers and GPS watch. */
  async dispose() {
    await this.stopTracking();
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }
}
