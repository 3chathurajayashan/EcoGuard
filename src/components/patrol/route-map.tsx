import React, { useMemo } from 'react';

import SvgMap, { MapChrome, type MapMarker, type MapRoute } from '@/components/svg-map';
import type { PatrolRoute, Waypoint } from '@/utils/patrol';

/**
 * A patrol route on the schematic map: the planned trail, its expected stops, and (while a patrol
 * runs) the path actually walked, manual waypoints and the ranger's current position.
 */
export default function RouteMap({
  route,
  waypoints = [],
  height = 180,
  showStops = true,
  showYou = false,
}: {
  route: PatrolRoute;
  waypoints?: Waypoint[];
  height?: number;
  showStops?: boolean;
  /** Marks the latest GPS fix as "You are here" */
  showYou?: boolean;
}) {
  const { routes, markers } = useMemo(() => {
    const planned = route.routePoints.length ? route.routePoints : [route.startPoint, route.endPoint];
    const r: MapRoute[] = [{ id: 'planned', points: planned, color: waypoints.length ? '#9BC9A6' : '#1FA84F', width: waypoints.length ? 3 : 4, dashed: !!waypoints.length }];
    const auto = waypoints.filter((w) => w.type === 'AUTOMATIC');
    if (auto.length > 1) r.push({ id: 'walked', points: auto, color: '#1FA84F', width: 5 });

    const m: MapMarker[] = [];
    if (showStops) {
      planned.slice(1, -1).forEach((p, i) => m.push({ id: `stop-${i}`, latitude: p.latitude, longitude: p.longitude, kind: 'poi', label: p.name }));
    }
    m.push({ id: 'start', latitude: route.startPoint.latitude, longitude: route.startPoint.longitude, kind: 'start', label: 'Start' });
    m.push({ id: 'end', latitude: route.endPoint.latitude, longitude: route.endPoint.longitude, kind: 'end', label: 'End' });
    waypoints
      .filter((w) => w.type === 'MANUAL')
      .forEach((w) => m.push({ id: w.waypointId, latitude: w.latitude, longitude: w.longitude, kind: 'waypoint', label: w.category || undefined }));
    if (showYou && auto.length) {
      const last = auto[auto.length - 1];
      m.push({ id: 'you', latitude: last.latitude, longitude: last.longitude, kind: 'ranger', label: 'You are here' });
    }
    return { routes: r, markers: m };
  }, [route, waypoints, showStops, showYou]);

  return (
    <SvgMap height={height} routes={routes} markers={markers}>
      <MapChrome />
    </SvgMap>
  );
}
