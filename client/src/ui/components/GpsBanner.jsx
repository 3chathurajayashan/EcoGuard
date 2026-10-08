import PropTypes from 'prop-types';

/** Persistent non-blocking GPS warning shown during patrol tracking. */
export function GpsBanner({ message }) {
  if (!message) return null;
  return <div className="gps-banner" role="alert"><span aria-hidden="true">⌖</span><span><strong>GPS unavailable</strong> — {message}. Manual waypoints are still available.</span></div>;
}

GpsBanner.propTypes = { message: PropTypes.string };
