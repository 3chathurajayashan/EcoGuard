import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PatrolStatus } from '../../domain/enums.js';
import { usePatrolController } from '../PatrolContext.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { GpsBanner } from '../components/GpsBanner.jsx';
import { MapView } from '../components/MapView.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { SyncState } from '../components/SyncState.jsx';

const formatElapsed = (startedAt) => {
  if (!startedAt) return '0 min';
  return `${Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60_000))} min`;
};

/** Assigned route, active tracking, and completed patrol summary screens. */
export function PatrolPage() {
  const { controller, state, role } = usePatrolController();
  const navigate = useNavigate();
  const location = useLocation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [, setNow] = useState(Date.now());
  const patrol = state.patrol;
  const assignment = patrol?.assignment || state.assignment;
  const active = patrol?.status === PatrolStatus.IN_PROGRESS;
  const completed = patrol?.status === PatrolStatus.COMPLETED;
  const route = assignment?.route;
  const mapPoints = patrol?.waypoints?.map((point) => ({ latitude: point.latitude, longitude: point.longitude })) || [];
  const expected = route?.expectedWaypoints || [];
  const recordedCount = patrol?.waypoints?.length || 0;

  useEffect(() => {
    if (!active) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (completed && location.pathname === '/patrol') navigate('/patrol/summary', { replace: true });
  }, [completed, location.pathname, navigate]);

  const elapsed = formatElapsed(patrol?.startedAt);

  async function startPatrol() {
    try {
      await controller.startPatrol(assignment);
    } catch {
      // The controller exposes a user-facing error state.
    }
  }

  async function completePatrol() {
    const saved = await controller.completePatrol();
    setConfirmOpen(false);
    if (saved) navigate('/patrol/summary');
  }

  if (role !== 'Ranger') return <section className="card"><p>Switch to the Ranger role to start or manage a patrol.</p></section>;
  if (completed || location.pathname.endsWith('/summary')) {
    if (!patrol) return <section className="card"><p>No completed patrol is available on this device.</p><Link className="button button-primary" to="/patrol">Back to Patrol</Link></section>;
    return <section className="page-stack">
      <div className="page-heading"><div><p className="eyebrow">PATROL COMPLETE</p><h1>Patrol summary</h1></div><StatusBadge status="COMPLETED" /></div>
      <div className="card summary-card">
        <SyncSummary status={state.isSyncing ? 'SYNCING' : patrol.syncStatus} onRetry={() => controller.retryPendingSync()} isPending={patrol.syncStatus === 'PENDING_SYNC' && !state.isSyncing} />
        <p className="route-name">{patrol.assignment.route.name}</p>
        <div className="metric-grid"><Metric label="Recorded distance" value={`${patrol.totalDistance.toFixed(2)} km`} /><Metric label="Duration" value={elapsed} /><Metric label="Waypoints" value={patrol.waypoints.length} /></div>
        <MapView points={mapPoints} routePoints={expected} />
        {state.error && <p className="error-message" role="alert">{state.error}</p>}
        {state.message && <p className="success-message" role="status">{state.message}</p>}
        <Link className="button button-primary full-width" to="/patrol">Done</Link>
      </div>
    </section>;
  }

  if (active) return <section className="page-stack">
    <GpsBanner message={state.gpsError} />
    {state.pendingPatrols?.length > 0 && <p className="pending-indicator" role="status">◷ {state.pendingPatrols.length} patrol{state.pendingPatrols.length === 1 ? '' : 's'} pending sync</p>}
    <div className="page-heading compact-heading"><div><p className="eyebrow">PATROL IN PROGRESS</p><h1>{route?.name}</h1></div><StatusBadge status="IN_PROGRESS" /></div>
    <MapView points={mapPoints} routePoints={expected} />
    <div className="metric-grid">
      <Metric label="Distance" value={`${(patrol.totalDistance).toFixed(2)} km`} />
      <Metric label="Elapsed" value={elapsed} />
      <Metric label="Waypoints" value={`${recordedCount} / ${expected.length}`} />
    </div>
    <div className="card waypoint-list">
      <h2>Route progress</h2>
      <p>{recordedCount} recorded · {expected.length} expected</p>
      {patrol.waypoints.slice(-3).reverse().map((point, index) => <div className="waypoint-row" key={`${point.recordedAt}-${index}`}><span aria-hidden="true">{point.type === 'AUTOMATIC' ? '⌖' : '✎'}</span><span>{point.type === 'AUTOMATIC' ? 'Automatic GPS' : point.description}</span><span className="origin-label">{point.type}</span></div>)}
    </div>
    {state.error && <p className="error-message" role="alert">{state.error}</p>}
    {state.message && <p className="success-message" role="status">{state.message}</p>}
    <div className="button-row sticky-actions"><Link className="button button-secondary" to="/patrol/add-waypoint">＋ Add waypoint</Link><button className="button button-danger" type="button" onClick={() => setConfirmOpen(true)}>End patrol</button></div>
    <ConfirmDialog open={confirmOpen} title="Complete this patrol?" onCancel={() => setConfirmOpen(false)} onConfirm={completePatrol} confirmLabel="Complete patrol">
      <p>Recorded distance: <strong>{patrol.totalDistance.toFixed(2)} km</strong></p><p>Time in patrol: <strong>{elapsed}</strong></p><p>Your patrol will be saved on this device before synchronization.</p>
    </ConfirmDialog>
  </section>;

  if (!assignment) return <section className="card empty-state"><span className="empty-icon" aria-hidden="true">◎</span><h1>No assigned route</h1><p>There is no patrol route assigned to your Ranger account yet. Ask a Park Manager to assign one before starting.</p><button className="button button-primary" type="button" disabled>Start patrol</button></section>;

  return <section className="page-stack">
    <div className="page-heading"><div><p className="eyebrow">YOUR ASSIGNED ROUTE</p><h1>Review &amp; start</h1></div><StatusBadge status="ASSIGNED" /></div>
    {state.pendingPatrols?.length > 0 && <p className="pending-indicator" role="status">◷ {state.pendingPatrols.length} patrol{state.pendingPatrols.length === 1 ? '' : 's'} pending sync</p>}
    <div className="card route-card">
      <div className="route-title"><span className="route-icon" aria-hidden="true">⌖</span><div><p className="eyebrow">ASSIGNED ROUTE</p><h2>{route.name}</h2></div></div>
      <div className="metric-grid"><Metric label="Route distance" value={`${route.distanceKm} km`} /><Metric label="Est. duration" value={`${route.estimatedDurationMinutes} min`} /><Metric label="Expected waypoints" value={route.expectedWaypoints.length} /></div>
      <MapView routePoints={route.expectedWaypoints} />
      <h3>Expected waypoints</h3>
      <ol className="expected-list">{route.expectedWaypoints.map((point, index) => <li key={`${point.latitude}-${point.longitude}`}><span>{point.label || `Waypoint ${index + 1}`}</span><small>{point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}</small></li>)}</ol>
      {state.error && <p className="error-message" role="alert">{state.error}</p>}
      <button className="button button-primary full-width" onClick={startPatrol} type="button">Start patrol</button>
      <p className="subtle-note">Your patrol data is saved locally and can be recorded offline.</p>
    </div>
  </section>;
}

function Metric({ label, value }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}
Metric.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired };

function SyncSummary({ status, onRetry, isPending }) {
  return <div className="sync-summary"><SyncState status={status} />{isPending && <button className="text-button" onClick={onRetry} type="button">Retry now</button>}</div>;
}
SyncSummary.propTypes = { status: PropTypes.string.isRequired, onRetry: PropTypes.func.isRequired, isPending: PropTypes.bool.isRequired };
