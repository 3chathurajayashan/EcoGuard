import PropTypes from 'prop-types';

/** Render exactly one of the summary's three synchronization states. */
export function SyncState({ status }) {
  const pending = status === 'PENDING_SYNC' || status === 'NOT_SYNCED';
  const syncing = status === 'SYNCING';
  const label = syncing ? 'Syncing' : status === 'SYNCED' ? 'Synced' : 'Pending Sync';
  return <p className={`sync-state ${pending || syncing ? 'sync-pending' : 'sync-success'}`} role="status"><span aria-hidden="true">{syncing ? '↻' : pending ? '◷' : '✓'}</span> {label}</p>;
}
SyncState.propTypes = { status: PropTypes.string.isRequired };
