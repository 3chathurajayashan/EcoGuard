import { openDB } from 'idb';
import { Patrol } from '../domain/Patrol.js';

/** Repository backed by IndexedDB; persistence failures return false on save. */
export class IndexedDbLocalDatabase {
  constructor(databaseName = 'ecoguard-patrols') {
    this.databaseName = databaseName;
    this.databasePromise = null;
  }

  async database() {
    if (!this.databasePromise) {
      this.databasePromise = openDB(this.databaseName, 1, {
        upgrade(database) {
          if (!database.objectStoreNames.contains('patrols')) database.createObjectStore('patrols', { keyPath: 'id' });
        },
      });
    }
    return this.databasePromise;
  }

  /** Persist the complete patrol; repository failures never escape to UI callers. */
  async saveLocally(patrol) {
    try {
      const database = await this.database();
      await database.put('patrols', structuredClone(patrol));
      return true;
    } catch (error) {
      console.error('Unable to save patrol locally.', error);
      return false;
    }
  }

  /** Update only the sync state after a successful remote sync. */
  async updateSyncStatus(patrol) {
    const database = await this.database();
    await database.put('patrols', structuredClone(patrol));
  }

  /** Load all locally retained records awaiting remote synchronization. */
  async getPendingPatrols() {
    const database = await this.database();
    const records = await database.getAll('patrols');
    return records.filter((record) => record.syncStatus === 'PENDING_SYNC').map((record) => new Patrol(record));
  }

  /** Restore an unfinished patrol after refresh. */
  async getActivePatrol() {
    const database = await this.database();
    const records = await database.getAll('patrols');
    const record = records.find((item) => item.status === 'IN_PROGRESS');
    return record ? new Patrol(record) : null;
  }

  /** Load records for reports. */
  async getAllPatrols() {
    const database = await this.database();
    return (await database.getAll('patrols')).map((record) => new Patrol(record));
  }
}
