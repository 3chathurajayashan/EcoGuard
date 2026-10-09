import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Polygon, Polyline, Rect, Stop, Text as SvgText } from 'react-native-svg';

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
export type MarkerKind = 'animal' | 'ranger' | 'start' | 'end' | 'waypoint' | 'alert' | 'poi' | 'covered' | 'missed';
export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  kind: MarkerKind;
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

interface Props {
  height?: number;
  zones?: MapZone[];
  routes?: MapRoute[];
  markers?: MapMarker[];
  heat?: MapHeat[];
  /** Extra points to keep in view even if nothing is drawn there */
  include?: { latitude: number; longitude: number }[];
  style?: ViewStyle;
  /** Hides the decorative trees and river (used on dense analytics maps) */
  plain?: boolean;
  children?: React.ReactNode;
}

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
};

const FONT = Platform.select({ web: 'Arial, Helvetica, sans-serif', default: undefined });

const HEAT_COLOR = { High: '#E53935', Medium: '#FB8C00', Low: '#FDD835' };

// Small deterministic random generator so the terrain looks the same on every render
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export default function SvgMap({ height = 160, zones = [], routes = [], markers = [], heat = [], include = [], style, plain, children }: Props) {
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
    if (!pts.length || !width) return null;

    let minLat = Math.min(...pts.map((p) => p.latitude));
    let maxLat = Math.max(...pts.map((p) => p.latitude));
    let minLon = Math.min(...pts.map((p) => p.longitude));
    let maxLon = Math.max(...pts.map((p) => p.longitude));
    const minSpan = 0.012;
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
    const padLat = (maxLat - minLat) * 0.18;
    const padLon = (maxLon - minLon) * 0.18;
    minLat -= padLat;
    maxLat += padLat;
    minLon -= padLon;
    maxLon += padLon;

    const cosLat = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
    const spanX = (maxLon - minLon) * cosLat;
    const spanY = maxLat - minLat;
    const scale = Math.min(width / spanX, height / spanY);
    const offX = (width - spanX * scale) / 2;
    const offY = (height - spanY * scale) / 2;

    return {
      x: (lon: number) => offX + (lon - minLon) * cosLat * scale,
      y: (lat: number) => offY + (maxLat - lat) * scale,
      seed: Math.round((minLat + minLon) * 1e5),
    };
  }, [zones, routes, markers, heat, include, width, height]);

  const decor = useMemo(() => {
    if (!view || plain || !width) return null;
    const r = rng(view.seed);
    const trees = Array.from({ length: Math.round((width * height) / 2600) }, () => ({
      cx: r() * width,
      cy: r() * height,
      r: 2.5 + r() * 3.5,
      shade: r() > 0.5 ? '#6FA56B' : '#5E9460',
    }));
    const y0 = height * (0.55 + r() * 0.25);
    const river = `M -10 ${y0} C ${width * 0.25} ${y0 - height * 0.35}, ${width * 0.6} ${y0 + height * 0.4}, ${width + 10} ${y0 - height * 0.15}`;
    return { trees, river };
  }, [view, plain, width, height]);

  return (
    <View style={[s.box, { height }, style]} onLayout={onLayout}>
      {view && width ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="terrain" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#E3EDD8" />
              <Stop offset="1" stopColor="#C9DDBD" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={height} fill="url(#terrain)" />

          {decor ? (
            <>
              <Path d={decor.river} stroke="#BFDDF2" strokeWidth={Math.max(12, height * 0.09)} fill="none" strokeLinecap="round" />
              <Path d={decor.river} stroke="#A5CDE8" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.7} />
              {decor.trees.map((t, i) => (
                <Circle key={i} cx={t.cx} cy={t.cy} r={t.r} fill={t.shade} opacity={0.75} />
              ))}
            </>
          ) : null}

          {zones.map((z) => (
            <G key={z.id}>
              <Polygon
                points={z.coords.map(([lat, lon]) => `${view.x(lon)},${view.y(lat)}`).join(' ')}
                fill={z.level === 'normal' ? 'rgba(30,86,49,0.16)' : 'rgba(229,57,53,0.22)'}
                stroke={z.level === 'normal' ? '#1E5631' : '#E53935'}
                strokeWidth={2}
                strokeDasharray="6 4"
              />
              {z.label ? (
                <SvgText
                  x={view.x(z.coords.reduce((a, c) => a + c[1], 0) / z.coords.length)}
                  y={view.y(z.coords.reduce((a, c) => a + c[0], 0) / z.coords.length) + 3}
                  fontSize={9}
                  fontFamily={FONT}
                  fontWeight="bold"
                  fill={z.level === 'normal' ? '#1E5631' : '#C62828'}
                  textAnchor="middle">
                  {z.label.toUpperCase()}
                </SvgText>
              ) : null}
            </G>
          ))}

          {heat.map((h, i) => (
            <Circle
              key={i}
              cx={view.x(h.longitude)}
              cy={view.y(h.latitude)}
              r={10 + (h.weight ?? 1) * 4}
              fill={HEAT_COLOR[h.level]}
              opacity={0.55}
            />
          ))}

          {routes.map((r) => {
            const pts = r.points.map((p) => `${view.x(p.longitude)},${view.y(p.latitude)}`).join(' ');
            return (
              <G key={r.id}>
                <Polyline points={pts} fill="none" stroke="#FFFFFF" strokeWidth={(r.width ?? 4) + 3} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
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
                {m.kind === 'ranger' ? <Circle cx={cx} cy={cy} r={st.r + 9} fill="#1565C0" opacity={0.18} /> : null}
                <Circle cx={cx} cy={cy} r={st.r} fill={st.fill} stroke={m.kind === 'animal' ? '#BDBDBD' : '#FFFFFF'} strokeWidth={m.kind === 'waypoint' ? 2.5 : 2} />
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
                    {/* white outline under the text so labels stay readable on any terrain */}
                    <SvgText x={cx} y={cy - st.r - 4} fontSize={9} fontFamily={FONT} fontWeight="bold" fill="#FFFFFF" textAnchor="middle" stroke="#FFFFFF" strokeWidth={3}>
                      {m.label}
                    </SvgText>
                    <SvgText x={cx} y={cy - st.r - 4} fontSize={9} fontFamily={FONT} fontWeight="bold" fill="#2A3A2E" textAnchor="middle">
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
  legend: { position: 'absolute', right: 8, top: 8, backgroundColor: '#FFF', borderRadius: 6, padding: 6, gap: 3, borderWidth: 1, borderColor: '#DDD' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 8, color: '#333' },
  zoom: { position: 'absolute', right: 8, bottom: 8, backgroundColor: '#FFF', borderRadius: 6, borderWidth: 1, borderColor: '#DDD', alignItems: 'center', paddingHorizontal: 7 },
  zoomText: { fontSize: 15, color: '#333', fontWeight: '600', lineHeight: 20 },
  zoomLine: { alignSelf: 'stretch', height: 1, backgroundColor: '#DDD' },
});
