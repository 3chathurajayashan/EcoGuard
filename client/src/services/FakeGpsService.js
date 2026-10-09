/** Configurable GPS strategy for deterministic development demos and tests. */
export class FakeGpsService {
  constructor(points = [
    { latitude: 6.369, longitude: 81.519, altitude: 18 },
    { latitude: 6.3748, longitude: 81.526, altitude: 20 },
    { latitude: 6.3818, longitude: 81.5312, altitude: 22 },
  ]) {
    this.points = points;
    this.index = 0;
    this.error = null;
    this.tracking = false;
  }

  async startTracking() { this.tracking = true; }
  async stopTracking() { this.tracking = false; }

  async getCurrentLocation() {
    if (this.error) throw this.error;
    return this.points[this.index++ % this.points.length];
  }

  async resumeAutoTracking() { this.tracking = true; }
}
