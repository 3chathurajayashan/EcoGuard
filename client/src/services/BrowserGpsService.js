/** Browser geolocation strategy used by live patrol tracking. */
export class BrowserGpsService {
  constructor() {
    this.watchId = null;
  }

  /** Begin requesting regular browser location updates. */
  async startTracking() {
    if (!navigator.geolocation) throw new Error('GPS is unavailable in this browser.');
    if (this.watchId !== null) return;
    this.watchId = navigator.geolocation.watchPosition(() => {}, (error) => { this.lastError = error; }, { enableHighAccuracy: true });
  }

  /** Stop browser location updates. */
  async stopTracking() {
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
  }

  /** Read one current position. */
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GPS is unavailable in this browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, altitude: coords.altitude }),
        (error) => reject(new Error(error.message || 'GPS location could not be read.')),
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
      );
    });
  }

  /** Resume normal watch behavior after a successful position read. */
  async resumeAutoTracking() {
    await this.startTracking();
  }
}
