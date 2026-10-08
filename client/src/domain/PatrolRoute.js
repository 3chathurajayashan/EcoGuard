/** Route definition with ordered expected points. */
export class PatrolRoute {
  /** @param {{ id: string, name: string, distanceKm: number, estimatedDurationMinutes: number, expectedWaypoints: Array<object> }} values */
  constructor(values) {
    if (!values?.id || !values.name) throw new TypeError('Route id and name are required.');
    Object.assign(this, { ...values, expectedWaypoints: values.expectedWaypoints || [] });
  }
}
