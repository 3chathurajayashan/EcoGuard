/** Assignment of a route to a Ranger. */
export class PatrolAssignment {
  /** @param {{ id: string, route: object, rangerId?: string }} values */
  constructor(values) {
    if (!values?.id || !values.route) throw new TypeError('Assignment id and route are required.');
    Object.assign(this, values);
  }
}
