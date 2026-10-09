/**
 * @typedef {object} GPSInterface
 * @property {() => Promise<void>} startTracking
 * @property {() => Promise<void>} stopTracking
 * @property {() => Promise<{latitude:number, longitude:number, altitude:number|null}>} getCurrentLocation
 * @property {() => Promise<void>} resumeAutoTracking
 */
/**
 * @typedef {object} LocalDatabase
 * @property {(patrol: import('../domain/Patrol.js').Patrol) => Promise<boolean>} saveLocally
 * @property {(patrol: import('../domain/Patrol.js').Patrol) => Promise<void>} updateSyncStatus
 * @property {() => Promise<Array<import('../domain/Patrol.js').Patrol>>} getPendingPatrols
 */
/**
 * @typedef {object} SyncResult
 * @property {boolean} success
 * @property {string=} message
 */
/**
 * @typedef {object} SyncGateway
 * @property {(patrol: import('../domain/Patrol.js').Patrol) => Promise<SyncResult>} synchronizePatrol
 * @property {() => Promise<boolean>} isOnline
 */
