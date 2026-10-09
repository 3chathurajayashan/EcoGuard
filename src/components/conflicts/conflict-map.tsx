import React, { useMemo } from 'react';

import SvgMap, { MapChrome, type MapMarker } from '@/components/svg-map';
import type { Collar, ConflictCase, RiskZone } from '@/utils/conflicts';

/** Ring of a zone's polygon as [lat, lon] pairs (the API stores GeoJSON [lon, lat]). */
const ring = (zone: RiskZone): [number, number][] =>
  (zone.boundary?.coordinates?.[0] ?? []).map(([lon, lat]) => [lat, lon] as [number, number]);

/**
 * The map used on the conflict screens: risk zones, collared animals and the alert location.
 * `ranger` adds the responder's position and a dashed route to the animal (on-site response).
 */
export default function ConflictMap({
  height,
  zones,
  collars = [],
  alert,
  focusAlert = false,
  ranger,
  legend = true,
}: {
  height: number;
  zones: RiskZone[];
  collars?: Collar[];
  alert?: ConflictCase | null;
  /** Show only the alert's own zone and animal instead of the whole park */
  focusAlert?: boolean;
  ranger?: { latitude: number; longitude: number } | null;
  legend?: boolean;
}) {
  const { mapZones, markers, routes } = useMemo(() => {
    const alertZone = alert ? zones.find((z) => z.name === alert.riskZone) : undefined;
    const shownZones = focusAlert && alertZone ? [alertZone] : zones;

    const shownCollars = focusAlert && alert
      ? collars.filter((c) => c.animalId?.identifier === alert.animalId)
      : collars;
    const m: MapMarker[] = shownCollars
      .filter((c) => c.lastLatitude != null && c.lastLongitude != null)
      .map((c) => ({
        id: c._id,
        latitude: c.lastLatitude as number,
        longitude: c.lastLongitude as number,
        kind: 'animal' as const,
        label: c.animalId?.identifier,
        showLabel: focusAlert,
      }));

    // The alert itself (when there is no collar for it, e.g. a community report)
    if (alert && !m.some((x) => x.label === alert.animalId)) {
      m.push({ id: 'alert', latitude: alert.latitude, longitude: alert.longitude, kind: 'alert', label: alert.animalId });
    }
    if (ranger) m.push({ id: 'ranger', latitude: ranger.latitude, longitude: ranger.longitude, kind: 'ranger', label: 'Ranger (You)' });

    const target = m.find((x) => x.kind === 'animal' || x.kind === 'alert');
    const r =
      ranger && target
        ? [{ id: 'route', points: [ranger, target], color: '#222', dashed: true, width: 2 }]
        : [];

    return {
      mapZones: shownZones.map((z) => ({
        id: z._id,
        coords: ring(z),
        label: z.name,
        level: z.zoneType === 'HIGH_RISK_AREA' || z.zoneType === 'COMMUNITY_SETTLEMENT' ? ('high' as const) : ('normal' as const),
      })),
      markers: m,
      routes: r,
    };
  }, [zones, collars, alert, focusAlert, ranger]);

  return (
    <SvgMap height={height} zones={mapZones} markers={markers} routes={routes} include={alert ? [alert] : []}>
      <MapChrome
        legend={
          legend
            ? [
                { color: '#444', label: 'Elephant (Tracked)' },
                { color: '#E53935', label: 'High-Risk Zone', ring: true },
              ]
            : undefined
        }
      />
    </SvgMap>
  );
}
