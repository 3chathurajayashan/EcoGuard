import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, C } from '@/components/kit';
import type { GpsState } from '@/utils/patrol';

/** Four little bars: full when a fix is coming in, empty when the signal is gone. */
export function SignalBars({ state }: { state: GpsState }) {
  const level = state === 'ok' ? 4 : state === 'searching' ? 2 : 0;
  return (
    <View style={s.bars}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[s.bar, { height: 6 + i * 4, backgroundColor: i <= level ? C.green : '#D5DDD7' }]} />
      ))}
    </View>
  );
}

/** "GPS Tracking Active" strip shown above the stats. */
export function GpsCard({ state }: { state: GpsState }) {
  const text =
    state === 'ok'
      ? { title: 'GPS Tracking Active', sub: 'Your location is being recorded automatically.' }
      : state === 'searching'
        ? { title: 'Searching for GPS signal', sub: 'Hold on, waiting for the first position.' }
        : { title: 'GPS Signal Unavailable', sub: 'Add waypoints manually until it comes back.' };
  return (
    <View style={s.gps}>
      <View style={[s.gpsIcon, state === 'unavailable' && { backgroundColor: C.red }]}>
        <Feather name={state === 'unavailable' ? 'alert-triangle' : 'radio'} size={20} color="#FFF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.gpsTitle}>{text.title}</Text>
        <Text style={s.gpsSub}>{text.sub}</Text>
      </View>
      <SignalBars state={state} />
    </View>
  );
}

/** Full-card message from the wireframe when the GPS signal is lost. */
export function GpsUnavailable({ routeName, parkName, onOk }: { routeName: string; parkName: string; onOk: () => void }) {
  return (
    <View style={s.overlay}>
      <View style={s.panel}>
        <View style={s.routeRow}>
          <View style={s.routeIcon}>
            <Feather name="navigation" size={18} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.small}>Current Patrol Route</Text>
            <Text style={s.routeName}>{routeName}</Text>
            <Text style={s.small}>{parkName}</Text>
          </View>
          <View style={s.activePill}>
            <View style={s.activeDot} />
            <Text style={s.activeText}>Active</Text>
          </View>
        </View>
        <View style={s.noSignal}>
          <View style={s.ring}>
            <Feather name="navigation" size={34} color={C.red} style={{ transform: [{ rotate: '-20deg' }] }} />
            <View style={s.slash} />
          </View>
          <Text style={s.noTitle}>GPS Signal Unavailable</Text>
          <Text style={s.noText}>Your location is currently unavailable.{'\n'}The app will keep trying to reconnect.</Text>
        </View>
        <Button label="OK" onPress={onOk} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 5, borderRadius: 2 },
  gps: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F4FAF4', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#DCEBDD' },
  gpsIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  gpsTitle: { fontSize: 14, fontWeight: '800', color: C.text },
  gpsSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(238,244,236,0.97)', padding: 14, justifyContent: 'center', zIndex: 20 },
  panel: { backgroundColor: '#FFF', borderRadius: 16, padding: 14, gap: 14, borderWidth: 1, borderColor: C.line },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  small: { fontSize: 10, color: C.muted },
  routeName: { fontSize: 18, fontWeight: '800', color: C.text },
  activePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2E9E4D' },
  activeText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
  noSignal: { alignItems: 'center', paddingVertical: 26, backgroundColor: '#EEF4EC', borderRadius: 14 },
  ring: { width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: C.red, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  slash: { position: 'absolute', width: 80, height: 4, backgroundColor: C.red, transform: [{ rotate: '-45deg' }] },
  noTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  noText: { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
