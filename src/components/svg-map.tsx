import React, { useMemo, useState } from 'react';
import { Image, LayoutChangeEvent, Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, G, Polygon, Polyline, Text as SvgText } from 'react-native-svg';

// A real map without a native map SDK or an API key: free raster tiles drawn as images (web
// mercator, the same maths every web map uses) with zones, routes, markers and heat points
// drawn on top in SVG. It behaves the same on web, iOS and Android.

export interface MapZone {
  id: string;
  /** [latitude, longitude] pairs */
  coords: [number, number][];
  label?: string;
  level?: 'high' | 'normal';
}
export interface MapRoute {
  id: string;
  points: { latitude: number; longitude: number }[];
  color?: string;
  dashed?: boolean;
  width?: number;
}
export type MarkerKind = 'animal' | 'ranger' | 'start' | 'end' | 'waypoint' | 'alert' | 'poi' | 'covered' | 'missed' | 'pin';
export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  kind: MarkerKind;
  /** Fill colour for generic `pin` markers */
  color?: string;
  label?: string;
  /** Show the label above the marker */
  showLabel?: boolean;
}
export interface MapHeat {
  latitude: number;
  longitude: number;
  level: 'High' | 'Medium' | 'Low';
  weight?: number;
}

export type Basemap = 'streets' | 'satellite';

interface Props {
  height?: number;
  zones?: MapZone[];
  routes?: MapRoute[];
  markers?: MapMarker[];
  heat?: MapHeat[];
  /** Extra points to keep in view even if nothing is drawn there */
  include?: { latitude: number; longitude: number }[];
  /** Street map (default) or satellite imagery */
  basemap?: Basemap;
  style?: ViewStyle;
  children?: React.ReactNode;
}

const TILE = 256;
const FONT = Platform.select({ web: 'Arial, Helvetica, sans-serif', default: undefined });

const BASEMAPS: Record<Basemap, { url: (z: number, x: number, y: number) => string; credit: string }> = {
  // Esri World Topographic Map: forests, rivers and terrain, free to display with attribution
  streets: {
    url: (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`,
    credit: 'Tiles © Esri, HERE, Garmin, OpenStreetMap contributors',
  },
  // Esri World Imagery: free to display with attribution
  satellite: {
    url: (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
    credit: 'Imagery © Esri, Maxar, Earthstar Geographics',
  },
};

const MARKER_STYLE: Record<MarkerKind, { fill: string; glyph?: string; r: number }> = {
  animal: { fill: '#FFFFFF', glyph: '🐘', r: 15 },
  alert: { fill: '#C62828', glyph: '!', r: 12 },
  ranger: { fill: '#1565C0', glyph: '●', r: 11 },
  start: { fill: '#1E7D3A', glyph: 'S', r: 11 },
  end: { fill: '#C62828', glyph: 'E', r: 11 },
  waypoint: { fill: '#FFFFFF', r: 6 },
  poi: { fill: '#FFFFFF', glyph: '◆', r: 9 },
  covered: { fill: '#2E9E4D', r: 8 },
  missed: { fill: '#C62828', r: 8 },
  pin: { fill: '#2E7D32', r: 9 },
};

const HEAT_COLOR = { High: '#E53935', Medium: '#FB8C00', Low: '#FDD835' };

const mercX = (lon: number) => (lon + 180) / 360;
const mercY = (lat: number) => {
  const s = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
};

interface View2D {
  x: (lon: number) => number;
  y: (lat: number) => number;
  tiles: { key: string; uri: string; left: number; top: number; size: number }[];
}

function buildView(
  pts: { latitude: number; longitude: number }[],
  width: number,
  height: number,
  basemap: Basemap,
): View2D | null {
  if (!pts.length || !width) return null;

  let minLat = Math.min(...pts.map((p) => p.latitude));
  let maxLat = Math.max(...pts.map((p) => p.latitude));
  let minLon = Math.min(...pts.map((p) => p.longitude));
  let maxLon = Math.max(...pts.map((p) => p.longitude));
  const minSpan = 0.006;
  if (maxLat - minLat < minSpan) {
    const mid = (maxLat + minLat) / 2;
    minLat = mid - minSpan / 2;
    maxLat = mid + minSpan / 2;
  }
  if (maxLon - minLon < minSpan) {
    const mid = (maxLon + minLon) / 2;
    minLon = mid - minSpan / 2;
    maxLon = mid + minSpan / 2;
  }
  const padLat = (maxLat - minLat) * 0.16;
  const padLon = (maxLon - minLon) * 0.16;
  minLat -= padLat;
  maxLat += padLat;
  minLon -= padLon;
  maxLon += padLon;

  // Extent in "world" units (0..1), then the zoom at which that extent fills the view
  const dx = mercX(maxLon) - mercX(minLon);
  const dy = mercY(minLat) - mercY(maxLat);
  const zoom = Math.max(2, Math.min(17.4, Math.log2(Math.min(width / (TILE * dx), height / (TILE * dy)))));
  const world = TILE * 2 ** zoom;
  const cx = (mercX(minLon) + mercX(maxLon)) / 2;
  const cy = (mercY(minLat) + mercY(maxLat)) / 2;

  const x = (lon: number) => (mercX(lon) - cx) * world + width / 2;
  const y = (lat: number) => (mercY(lat) - cy) * world + height / 2;

  // Tiles come at whole zoom levels, so scale them up a little to match the fractional zoom
  const z = Math.floor(zoom);
  const n = 2 ** z;
  const size = world / n;
  const x0 = Math.floor((cx - width / 2 / world) * n);
  const x1 = Math.floor((cx + width / 2 / world) * n);
  const y0 = Math.max(0, Math.floor((cy - height / 2 / world) * n));
  const y1 = Math.min(n - 1, Math.floor((cy + height / 2 / world) * n));

  const tiles: View2D['tiles'] = [];
  for (let tx = x0; tx <= x1; tx++) {
    for (let ty = y0; ty <= y1; ty++) {
      const wrapped = ((tx % n) + n) % n;
      tiles.push({
        key: `${z}/${tx}/${ty}`,
        uri: BASEMAPS[basemap].url(z, wrapped, ty),
        left: (tx / n - cx) * world + width / 2,
        top: (ty / n - cy) * world + height / 2,
        size: size + 0.6, // a hair of overlap hides seams between tiles
      });
    }
  }
  return { x, y, tiles };
}

export default function SvgMap({ height = 160, zones = [], routes = [], markers = [], heat = [], include = [], basemap = 'streets', style, children }: Props) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const view = useMemo(() => {
    const pts: { latitude: number; longitude: number }[] = [
      ...zones.flatMap((z) => z.coords.map(([latitude, longitude]) => ({ latitude, longitude }))),
      ...routes.flatMap((r) => r.points),
      ...markers,
      ...heat,
      ...include,
    ];
    return buildView(pts, width, height, basemap);
  }, [zones, routes, markers, heat, include, width, height, basemap]);

  const satellite = basemap === 'satellite';
  const halo = satellite ? '#000000' : '#FFFFFF';
  const ink = satellite ? '#FFFFFF' : '#2A3A2E';

  return (
    <View style={[s.box, { height }, style]} onLayout={onLayout}>
      {view
        ? view.tiles.map((t) => (
            <Image key={t.key} source={{ uri: t.uri }} style={{ position: 'absolute', left: t.left, top: t.top, width: t.size, height: t.size }} />
          ))
        : null}

      {view && width ? (
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          {zones.map((z) => (
            <G key={z.id}>
              <Polygon
                points={z.coords.map(([lat, lon]) => `${view.x(lon)},${view.y(lat)}`).join(' ')}
                fill={z.level === 'normal' ? 'rgba(30,86,49,0.2)' : 'rgba(229,57,53,0.25)'}
                stroke={z.level === 'normal' ? '#1E5631' : '#E53935'}
                strokeWidth={2}
                strokeDasharray="6 4"
              />
              {z.label ? (
                <>
                  <SvgText
                    x={view.x(z.coords.reduce((a, c) => a + c[1], 0) / z.coords.length)}
                    y={view.y(z.coords.reduce((a, c) => a + c[0], 0) / z.coords.length) + 18}
                    fontSize={9}
                    fontFamily={FONT}
                    fontWeight="bold"
                    fill="#FFFFFF"
                    stroke="#FFFFFF"
                    strokeWidth={3}
                    textAnchor="middle">
                    {z.label.toUpperCase()}
                  </SvgText>
                  <SvgText
                    x={view.x(z.coords.reduce((a, c) => a + c[1], 0) / z.coords.length)}
                    y={view.y(z.coords.reduce((a, c) => a + c[0], 0) / z.coords.length) + 18}
                    fontSize={9}
                    fontFamily={FONT}
                    fontWeight="bold"
                    fill={z.level === 'normal' ? '#1E5631' : '#C62828'}
                    textAnchor="middle">
                    {z.label.toUpperCase()}
                  </SvgText>
                </>
              ) : null}
            </G>
          ))}

          {heat.map((h, i) => (
            <Circle key={i} cx={view.x(h.longitude)} cy={view.y(h.latitude)} r={10 + (h.weight ?? 1) * 4} fill={HEAT_COLOR[h.level]} opacity={0.6} />
          ))}

          {routes.map((r) => {
            const pts = r.points.map((p) => `${view.x(p.longitude)},${view.y(p.latitude)}`).join(' ');
            return (
              <G key={r.id}>
                <Polyline points={pts} fill="none" stroke="#FFFFFF" strokeWidth={(r.width ?? 4) + 3} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
                <Polyline
                  points={pts}
                  fill="none"
                  stroke={r.color ?? '#1FA84F'}
                  strokeWidth={r.width ?? 4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={r.dashed ? '7 5' : undefined}
                />
              </G>
            );
          })}

          {markers.map((m) => {
            const st = MARKER_STYLE[m.kind];
            const cx = view.x(m.longitude);
            const cy = view.y(m.latitude);
            return (
              <G key={m.id}>
                {m.kind === 'ranger' ? <Circle cx={cx} cy={cy} r={st.r + 9} fill="#1565C0" opacity={0.2} /> : null}
                <Circle cx={cx} cy={cy} r={st.r} fill={m.color ?? st.fill} stroke={m.kind === 'animal' ? '#9E9E9E' : '#FFFFFF'} strokeWidth={m.kind === 'waypoint' ? 2.5 : 2} />
                {m.kind === 'waypoint' ? <Circle cx={cx} cy={cy} r={2.5} fill="#1E7D3A" /> : null}
                {st.glyph ? (
                  <SvgText
                    x={cx}
                    y={cy + (m.kind === 'animal' ? 5.5 : 4)}
                    fontSize={m.kind === 'animal' ? 17 : 11}
                    fontFamily={FONT}
                    fontWeight="bold"
                    fill={m.kind === 'animal' ? '#444' : '#FFFFFF'}
                    textAnchor="middle">
                    {st.glyph}
                  </SvgText>
                ) : null}
                {m.label && m.showLabel !== false ? (
                  <>
                    {/* an outline under the text keeps labels readable on any map */}
                    <SvgText x={cx} y={cy - st.r - 4} fontSize={9} fontFamily={FONT} fontWeight="bold" fill={halo} textAnchor="middle" stroke={halo} strokeWidth={3}>
                      {m.label}
                    </SvgText>
                    <SvgText x={cx} y={cy - st.r - 4} fontSize={9} fontFamily={FONT} fontWeight="bold" fill={ink} textAnchor="middle">
                      {m.label}
                    </SvgText>
                  </>
                ) : null}
              </G>
            );
          })}
        </Svg>
      ) : null}

      {children}
      <View style={s.credit} pointerEvents="none">
        <Text style={s.creditText}>{BASEMAPS[basemap].credit}</Text>
      </View>
    </View>
  );
}

/** The "+ / -" and legend chrome the wireframes put on their maps (purely visual). */
export function MapChrome({ legend }: { legend?: { color: string; label: string; ring?: boolean }[] }) {
  return (
    <>
      {legend ? (
        <View style={s.legend}>
          {legend.map((l) => (
            <View key={l.label} style={s.legendRow}>
              <View style={[s.dot, l.ring ? { backgroundColor: '#FDECEA', borderWidth: 1, borderColor: l.color } : { backgroundColor: l.color }]} />
              <Text style={s.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={s.zoom}>
        <Text style={s.zoomText}>+</Text>
        <View style={s.zoomLine} />
        <Text style={s.zoomText}>−</Text>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  box: { borderRadius: 10, overflow: 'hidden', backgroundColor: '#DCE8D2', borderWidth: 1, borderColor: '#CFE0C6' },
  credit: { position: 'absolute', left: 4, bottom: 3, backgroundColor: 'rgba(255,255,255,0.75)', paddingHorizontal: 4, borderRadius: 3 },
  creditText: { fontSize: 7, color: '#333' },
  legend: { position: 'absolute', right: 8, top: 8, backgroundColor: '#FFF', borderRadius: 6, padding: 6, gap: 3, borderWidth: 1, borderColor: '#DDD' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 8, color: '#333' },
  zoom: { position: 'absolute', right: 8, bottom: 8, backgroundColor: '#FFF', borderRadius: 6, borderWidth: 1, borderColor: '#DDD', alignItems: 'center', paddingHorizontal: 7 },
  zoomText: { fontSize: 15, color: '#333', fontWeight: '600', lineHeight: 20 },
  zoomLine: { alignSelf: 'stretch', height: 1, backgroundColor: '#DDD' },
});
