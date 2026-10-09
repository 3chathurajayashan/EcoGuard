import { PatrolStatus, SyncStatus } from './enums.js';

const radians = (degrees) => (degrees * Math.PI) / 180;

/** Patrol aggregate; State pattern owns lifecycle and synchronization transitions. */
export class Patrol {
  /**
   * @param {{ id?: string, assignment: object, rangerId: string, status?: string, syncStatus?: string, waypoints?: Array<object>, startedAt?: string|null, completedAt?: string|null }} values
   */
  constructor(values) {
    if (!values?.assignment) throw new TypeError('A patrol requires an assignment.');
    this.id = values.id || `patrol-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
    this.assignment = values.assignment;
    this.rangerId = values.rangerId;
    this.status = values.status || PatrolStatus.ASSIGNED;
    this.syncStatus = values.syncStatus || SyncStatus.NOT_SYNCED;
    this.waypoints = values.waypoints || [];
    this.startedAt = values.startedAt || null;
    this.completedAt = values.completedAt || null;
  }

  /** Start an assigned patrol. */
  start() {
    if (this.status !== PatrolStatus.ASSIGNED) throw new Error('Only an assigned patrol can be started.');
    this.status = PatrolStatus.IN_PROGRESS;
    this.startedAt = new Date().toISOString();
    return this;
  }

  /** Complete an active patrol. */
  complete() {
    if (this.status !== PatrolStatus.IN_PROGRESS) throw new Error('Only an in-progress patrol can be completed.');
    this.status = PatrolStatus.COMPLETED;
    this.completedAt = new Date().toISOString();
    return this;
  }

  /** Add a validated waypoint to an active patrol. */
  addWaypoint(point) {
    if (this.status !== PatrolStatus.IN_PROGRESS) throw new Error('Waypoints can only be added to an in-progress patrol.');
    if (!point || !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) throw new TypeError('A valid waypoint is required.');
    this.waypoints.push(point);
    return this;
  }

  /** Mark the local patrol as awaiting synchronization. */
  markPendingSync() {
    if (this.status !== PatrolStatus.COMPLETED) throw new Error('Only a completed patrol can be synchronized.');
    this.syncStatus = SyncStatus.PENDING_SYNC;
    return this;
  }

  /** Mark a completed patrol as synchronized. */
  markSynced() {
    if (this.status !== PatrolStatus.COMPLETED) throw new Error('Only a completed patrol can be synchronized.');
    this.syncStatus = SyncStatus.SYNCED;
    return this;
  }

  /** Total great-circle distance across recorded points, in kilometres. */
  get totalDistance() {
    if (this.waypoints.length < 2) return 0;
    return this.waypoints.slice(1).reduce((total, point, index) => {
      const previous = this.waypoints[index];
      const dLat = radians(point.latitude - previous.latitude);
      const dLon = radians(point.longitude - previous.longitude);
      const a = Math.sin(dLat / 2) ** 2
        + Math.cos(radians(previous.latitude)) * Math.cos(radians(point.latitude)) * Math.sin(dLon / 2) ** 2;
      return total + 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }, 0);
  }
}
