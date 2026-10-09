import { describe, expect, it } from 'vitest';
import { Waypoint } from './Waypoint.js';
import { WaypointType } from './enums.js';

describe('Waypoint factories and validation', () => {
  it('creates an automatic point with exact origin', () => {
    const point = Waypoint.createAutoPoint(-90, 180, 12);
    expect(point).toMatchObject({ latitude: -90, longitude: 180, altitude: 12, type: WaypointType.AUTOMATIC });
  });

  it('creates a manual point with trimmed description', () => {
    expect(Waypoint.createManualPoint(0, 0, null, '  spoor  ')).toMatchObject({ description: 'spoor', type: WaypointType.MANUAL });
  });

  it.each([[91, 1], [-91, 1], [0, 181], [0, -181]])('rejects out-of-bounds coordinates %s, %s', (latitude, longitude) => {
    expect(() => Waypoint.createAutoPoint(latitude, longitude)).toThrow(RangeError);
  });

  it('rejects invalid coordinate types, altitude, origin, and blank manual descriptions', () => {
    expect(() => Waypoint.createAutoPoint(Number.NaN, 0)).toThrow();
    expect(() => Waypoint.createAutoPoint(0, 0, Number.NaN)).toThrow();
    expect(() => new Waypoint({ latitude: 0, longitude: 0, type: 'OTHER' })).toThrow();
    expect(() => Waypoint.createManualPoint(0, 0, null, '  ')).toThrow(/description/);
  });
});
