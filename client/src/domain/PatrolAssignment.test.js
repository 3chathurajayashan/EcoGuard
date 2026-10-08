import { describe, expect, it } from 'vitest';
import { PatrolAssignment } from './PatrolAssignment.js';
import { PatrolRoute } from './PatrolRoute.js';

describe('route and assignment value objects', () => {
  it('constructs assignments and rejects missing id or route', () => {
    expect(new PatrolAssignment({ id: 'a1', route: { id: 'r1' } })).toMatchObject({ id: 'a1' });
    expect(() => new PatrolAssignment({ id: 'a1' })).toThrow(/required/);
    expect(() => new PatrolAssignment({ route: {} })).toThrow(/required/);
  });

  it('constructs routes and defaults expected points', () => {
    expect(new PatrolRoute({ id: 'r1', name: 'North' }).expectedWaypoints).toEqual([]);
    expect(new PatrolRoute({ id: 'r2', name: 'South', expectedWaypoints: [{ latitude: 1, longitude: 2 }] }).expectedWaypoints).toHaveLength(1);
    expect(() => new PatrolRoute({ name: 'No id' })).toThrow(/required/);
    expect(() => new PatrolRoute({ id: 'r3' })).toThrow(/required/);
  });
});
