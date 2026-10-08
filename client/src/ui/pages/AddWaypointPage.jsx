import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatrolController } from '../PatrolContext.jsx';
import { MapView } from '../components/MapView.jsx';

/** Ranger manual waypoint form; description is mandatory and type is inferred. */
export function AddWaypointPage() {
  const { controller, state } = usePatrolController();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState(state.lastLocation || null);
  const [advanced, setAdvanced] = useState(false);
  const [latitude, setLatitude] = useState(position?.latitude ?? '');
  const [longitude, setLongitude] = useState(position?.longitude ?? '');
  const [altitude, setAltitude] = useState(position?.altitude ?? '');

  useEffect(() => {
    if (position || !state.lastLocation) return;
    setPosition(state.lastLocation);
    setLatitude(state.lastLocation.latitude);
    setLongitude(state.lastLocation.longitude);
    setAltitude(state.lastLocation.altitude ?? '');
  }, [position, state.lastLocation]);

  function updatePosition(nextPosition) {
    setPosition(nextPosition);
    setLatitude(nextPosition.latitude);
    setLongitude(nextPosition.longitude);
    setAltitude(nextPosition.altitude ?? '');
  }

  async function submit(event) {
    event.preventDefault();
    const saved = await controller.saveManualWaypoint(advanced ? latitude : '', advanced ? longitude : '', altitude, description);
    if (saved) navigate('/patrol');
  }

  const displayedPoints = position ? [{ latitude: Number(latitude || position.latitude), longitude: Number(longitude || position.longitude), altitude: Number(altitude) || null }] : [];
  return <section className="page-stack">
    <div className="page-heading"><div><p className="eyebrow">ACTIVE PATROL</p><h1>Add waypoint</h1></div></div>
    <form className="card form-stack" onSubmit={submit}>
      <p className="subtle-note">Move the pin to mark a location. Your GPS position is pre-filled when available.</p>
      {position ? <MapView points={displayedPoints} selectable onPositionChange={updatePosition} /> : <div className="position-empty" role="status">No GPS position yet. Enter coordinates under Advanced to continue.</div>}
      <label htmlFor="waypoint-description">Description <span aria-hidden="true">*</span></label>
      <textarea id="waypoint-description" value={description} onChange={(event) => setDescription(event.target.value)} required minLength={1} placeholder="Describe the location or finding" rows="3" />
      <button className="text-button advanced-toggle" type="button" aria-expanded={advanced} onClick={() => setAdvanced(!advanced)}>{advanced ? 'Hide' : 'Show'} Advanced coordinate entry</button>
      {advanced && <div className="coordinate-grid">
        <label>Latitude<input aria-label="Latitude" type="number" min="-90" max="90" step="any" required value={latitude} onChange={(event) => setLatitude(event.target.value)} /></label>
        <label>Longitude<input aria-label="Longitude" type="number" min="-180" max="180" step="any" required value={longitude} onChange={(event) => setLongitude(event.target.value)} /></label>
        <label>Altitude (m)<input aria-label="Altitude" type="number" step="any" value={altitude} onChange={(event) => setAltitude(event.target.value)} /></label>
      </div>}
      <p className="origin-hint">Origin will be recorded as Manual.</p>
      {state.error && <p className="error-message" role="alert">{state.error}</p>}
      <div className="button-row"><button className="button button-secondary" type="button" onClick={() => navigate('/patrol')}>Cancel</button><button className="button button-primary" type="submit" disabled={!description.trim()}>Save waypoint</button></div>
    </form>
  </section>;
}
AddWaypointPage.propTypes = {};
