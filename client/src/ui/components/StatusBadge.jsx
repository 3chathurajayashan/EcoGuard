import PropTypes from 'prop-types';

const statusMeta = {
  ASSIGNED: ['○', 'Assigned', 'neutral'],
  IN_PROGRESS: ['●', 'In progress', 'active'],
  COMPLETED: ['✓', 'Completed', 'success'],
  NOT_SYNCED: ['○', 'Not synced', 'neutral'],
  PENDING_SYNC: ['◷', 'Pending Sync', 'pending'],
  SYNCED: ['✓', 'Synced', 'success'],
};

/** Accessible icon-and-label status indicator. */
export function StatusBadge({ status }) {
  const [icon, label, variant] = statusMeta[status] || ['●', status, 'neutral'];
  return <span className={`status-badge status-${variant}`} role="status"><span aria-hidden="true">{icon}</span> {label}</span>;
}

StatusBadge.propTypes = { status: PropTypes.string.isRequired };
