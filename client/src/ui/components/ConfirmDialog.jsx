import PropTypes from 'prop-types';

/** Accessible confirmation dialog shown before patrol completion. */
export function ConfirmDialog({ open, title, children, onCancel, onConfirm, confirmLabel = 'Confirm' }) {
  if (!open) return null;
  return (
    <div className="dialog-backdrop">
      <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title">{title}</h2>
        {children}
        <div className="button-row">
          <button className="button button-secondary" type="button" onClick={onCancel}>Cancel</button>
          <button className="button button-danger" type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  confirmLabel: PropTypes.string,
};
