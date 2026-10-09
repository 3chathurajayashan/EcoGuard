import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const markerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

function MapEvents({ onPositionChange }) {
  useMapEvents({ click(event) { onPositionChange?.({ latitude: event.latlng.lat, longitude: event.latlng.lng, altitude: null }); } });
  return null;
}
MapEvents.propTypes = { onPositionChange: PropTypes.func };

/** Reusable route/waypoint map with optional pin placement and dragging. */
export function MapView({ points = [], routePoints = [], highlightPoints = [], selectable = false, onPositionChange }) {
  const firstPoint = points[0] || routePoints[0] || highlightPoints[0];
  const center = firstPoint ? [firstPoint.latitude, firstPoint.longitude] : [6.369, 81.519];
  useEffect(() => { L.Marker.prototype.options.icon = markerIcon; }, []);
  return (
    <div className="map-frame" role="region" aria-label="Patrol route map">
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: '100%', minHeight: '250px' }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapEvents onPositionChange={selectable ? onPositionChange : undefined} />
        {routePoints.length > 1 && <Polyline positions={routePoints.map((point) => [point.latitude, point.longitude])} pathOptions={{ color: '#8c9c80', dashArray: '6 8' }} />}
        {points.length > 1 && <Polyline positions={points.map((point) => [point.latitude, point.longitude])} pathOptions={{ color: '#28754f', weight: 4 }} />}
        {routePoints.map((point, index) => <CircleMarker key={`route-${point.latitude}-${point.longitude}-${index}`} center={[point.latitude, point.longitude]} radius={5} pathOptions={{ color: '#687e62', fillColor: '#ffffff', fillOpacity: 1 }} />)}
        {highlightPoints.map((point, index) => <CircleMarker key={`highlight-${point.latitude}-${point.longitude}-${index}`} center={[point.latitude, point.longitude]} radius={8} pathOptions={{ color: '#a43f35', fillColor: '#f1a29a', fillOpacity: 0.9 }} />)}
        {points.map((point, index) => <Marker key={`${point.latitude}-${point.longitude}-${index}`} position={[point.latitude, point.longitude]} draggable={selectable && index === points.length - 1} eventHandlers={selectable && index === points.length - 1 ? { dragend(event) { const { lat, lng } = event.target.getLatLng(); onPositionChange?.({ latitude: lat, longitude: lng, altitude: point.altitude ?? null }); } } : undefined} />)}
      </MapContainer>
    </div>
  );
}

MapView.propTypes = {
  points: PropTypes.arrayOf(PropTypes.shape({ latitude: PropTypes.number.isRequired, longitude: PropTypes.number.isRequired })),
  routePoints: PropTypes.arrayOf(PropTypes.shape({ latitude: PropTypes.number.isRequired, longitude: PropTypes.number.isRequired })),
  highlightPoints: PropTypes.arrayOf(PropTypes.shape({ latitude: PropTypes.number.isRequired, longitude: PropTypes.number.isRequired })),
  selectable: PropTypes.bool,
  onPositionChange: PropTypes.func,
};
