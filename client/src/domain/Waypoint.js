import { WaypointType } from './enums.js';

/** A recorded geographic point on a patrol. */
export class Waypoint {
  /**
   * @param {{ latitude: number, longitude: number, altitude: number|null, type: string, description?: string, recordedAt?: string }} values
   */
  constructor(values) {
    const { latitude, longitude, altitude = null, type, description = '', recordedAt = new Date().toISOString() } = values;
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new RangeError('Latitude must be between -90 and 90.');
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new RangeError('Longitude must be between -180 and 180.');
    if (altitude !== null && !Number.isFinite(altitude)) throw new TypeError('Altitude must be a finite number or null.');
    if (!Object.values(WaypointType).includes(type)) throw new TypeError('Waypoint type is invalid.');
    if (type === WaypointType.MANUAL && !description.trim()) throw new TypeError('A manual waypoint requires a description.');
    Object.assign(this, { latitude, longitude, altitude, type, description: description.trim(), recordedAt });
  }

  /** Factory Method for a GPS-captured point. */
  static createAutoPoint(latitude, longitude, altitude = null) {
    return new Waypoint({ latitude, longitude, altitude, type: WaypointType.AUTOMATIC });
  }

  /** Factory Method for a Ranger-entered point. */
  static createManualPoint(latitude, longitude, altitude = null, description) {
    return new Waypoint({ latitude, longitude, altitude, type: WaypointType.MANUAL, description });
  }
}
