import { useEffect, useState } from 'react';
import { config } from '../../config.js';
import { usePatrolController } from '../PatrolContext.jsx';
import { MapView } from '../components/MapView.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

/** Park Manager reports, neglected-route coverage, and minimal route assignment form. */
export function ReportsPage() {
  const { role } = usePatrolController();
  const [patrols, setPatrols] = useState([]);
  const [coverage, setCoverage] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [rangerId, setRangerId] = useState(config.rangerUserId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const headers = { 'X-User-Id': config.parkManagerUserId };
        const [patrolResponse, coverageResponse, routeResponse] = await Promise.all([
          fetch(`${config.apiBaseUrl}/patrols`, { headers }),
          fetch(`${config.apiBaseUrl}/coverage`, { headers }),
          fetch(`${config.apiBaseUrl}/routes`, { headers }),
        ]);
        if (!patrolResponse.ok || !coverageResponse.ok) throw new Error('Reports could not be loaded from the server.');
        const [patrolData, coverageData] = await Promise.all([patrolResponse.json(), coverageResponse.json()]);
        const routeData = routeResponse.ok ? await routeResponse.json() : [];
        if (!cancelled) {
          setPatrols((patrolData.patrols || patrolData).filter((item) => item.syncStatus === 'SYNCED'));
          setCoverage(coverageData);
          setRoutes(routeData.routes || routeData);
          setError('');
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function assignRoute(event) {
    event.preventDefault();
    setMessage('');
    try {
      const response = await fetch(`${config.apiBaseUrl}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': config.parkManagerUserId },
        body: JSON.stringify({ routeId: selectedRoute, rangerId }),
      });
      if (!response.ok) throw new Error(`Assignment failed (${response.status}).`);
      setMessage('Route assigned successfully.');
    } catch (assignError) {
      setError(assignError.message);
    }
  }

  const neglected = coverage?.neglectedWaypoints || coverage?.neglectedRoutePoints || [];
  const routePoints = (coverage?.routeWaypoints || []).map((point) => ({ latitude: point.latitude, longitude: point.longitude }));
  return <section className="page-stack">
    <div className="page-heading"><div><p className="eyebrow">PARK OPERATIONS</p><h1>Patrol reports</h1></div><span aria-hidden="true" className="heading-icon">▤</span></div>
    {loading && <p className="loading-message" role="status">Loading reports…</p>}
    {error && <p className="error-message" role="alert">{error}</p>}
    {!loading && <><div className="card coverage-card"><div className="page-heading"><div><p className="eyebrow">ROUTE COVERAGE</p><h2>Coverage overview</h2></div><strong className="coverage-number">{coverage?.coveragePercent ?? coverage?.coveragePercentage ?? 0}%</strong></div>
      <div className="coverage-track"><span style={{ width: `${Math.min(100, Math.max(0, coverage?.coveragePercent ?? coverage?.coveragePercentage ?? 0))}%` }} /></div>
      <p>Neglected points are marked for follow-up.</p>
      <MapView highlightPoints={neglected.map((point) => ({ latitude: point.latitude, longitude: point.longitude }))} routePoints={routePoints} />
      {neglected.length > 0 && <ul className="neglected-list">{neglected.map((point, index) => <li key={`${point.latitude}-${point.longitude}-${index}`}>⚠ Neglected route point {index + 1}</li>)}</ul>}
    </div>
    <div className="card"><div className="section-title"><div><p className="eyebrow">SYNCHRONIZED RECORDS</p><h2>Completed patrols</h2></div><span>{patrols.length}</span></div>
      {patrols.length ? patrols.map((patrol) => <article className="report-row" key={patrol.id}><div><strong>{patrol.assignment?.route?.name || patrol.routeName || 'Patrol route'}</strong><small>{patrol.completedAt ? new Date(patrol.completedAt).toLocaleString() : 'Completed'}</small></div><StatusBadge status="SYNCED" /></article>) : <p className="subtle-note">No synchronized patrols are available.</p>}
    </div>
    <div className="card"><p className="eyebrow">FIELD OPERATIONS</p><h2>Assign route</h2>
      <form className="form-stack" onSubmit={assignRoute}><label htmlFor="route-choice">Route</label><select id="route-choice" required value={selectedRoute} onChange={(event) => setSelectedRoute(event.target.value)}><option value="">Choose a route</option>{routes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}</select>
        <label htmlFor="ranger-id">Ranger user ID</label><input id="ranger-id" value={rangerId} onChange={(event) => setRangerId(event.target.value)} required />
        <button className="button button-primary" disabled={!routes.length || !selectedRoute} type="submit">Assign route</button>
      </form>{message && <p className="success-message" role="status">{message}</p>}
    </div></>}
    {role !== 'Park Manager' && <p className="subtle-note">Developer preview: reports are shown for the Park Manager role.</p>}
  </section>;
}
ReportsPage.propTypes = {};
