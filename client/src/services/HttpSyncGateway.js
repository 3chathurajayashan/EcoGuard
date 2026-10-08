/** HTTP synchronization strategy for the assumed REST API. */
export class HttpSyncGateway {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.simulateOffline = false;
  }

  /** POST a completed patrol; all transport and non-2xx failures are reported as failure. */
  async synchronizePatrol(patrol) {
    if (this.simulateOffline) return { success: false, message: 'Network unavailable.' };
    try {
      const response = await fetch(`${this.baseUrl}/patrols/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': patrol.rangerId },
        body: JSON.stringify(patrol),
      });
      if (!response.ok) return { success: false, message: `Sync failed (${response.status}).` };
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Network unavailable.' };
    }
  }

  /** GET health endpoint to check API connectivity. */
  async isOnline() {
    if (this.simulateOffline) return false;
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
