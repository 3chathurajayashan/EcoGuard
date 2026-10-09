import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, C } from '@/components/kit';
import { GpsCard, GpsUnavailable } from '@/components/patrol/gps';
import PatrolHeader from '@/components/patrol/patrol-header';
import RouteMap from '@/components/patrol/route-map';
import { dismissGpsNotice, endPatrol, formatDuration, useActivePatrol, useNow } from '@/utils/patrol';

/** Live Tracking During Patrol: the big map view. */
export default function PatrolTracking() {
  const active = useActivePatrol();
  const now = useNow(1000);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (active === null) {
      const t = setTimeout(() => router.replace('/patrol'), 400);
      return () => clearTimeout(t);
    }
    if (active?.status === 'COMPLETED') router.replace('/patrol/complete');
  }, [active]);

  if (!active || active.status !== 'IN_PROGRESS') return <SafeAreaView style={s.root} />;

  const finish = async () => {
    setEnding(true);
    await endPatrol();
    router.replace('/patrol/complete');
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <PatrolHeader title="Tracking Route" subtitle="On Patrol  •  Protecting Wildlife" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.mapCard}>
          <View style={s.mapTitle}>
            <View style={s.mapIcon}>
              <Feather name="navigation" size={16} color="#FFF" />
            </View>
            <View>
              <Text style={s.mapName}>{active.route.name}</Text>
              <Text style={s.mapPark}>{active.route.parkName}</Text>
            </View>
          </View>
          <RouteMap route={active.route} waypoints={active.waypoints} height={300} showYou />
        </View>

        <View style={s.card}>
          <GpsCard state={active.gps} />
          <View style={s.stats}>
            <Stat icon="map-pin" label="Distance Traveled" value={`${active.totalDistanceKm.toFixed(1)} km`} />
            <Stat icon="clock" label="Time Elapsed" value={formatDuration(now - new Date(active.startTime).getTime())} />
            <Stat icon="flag" label="Waypoints" value={String(active.waypoints.length)} />
          </View>

          {confirmEnd ? (
            <View style={s.confirm}>
              <Text style={s.confirmTitle}>End this patrol?</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Button label="Keep patrolling" tone="outline" small onPress={() => setConfirmEnd(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="End patrol" tone="danger" small loading={ending} onPress={finish} />
                </View>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button label="Add Waypoint" icon="plus-circle" tone="outline" onPress={() => router.push('/patrol/waypoint')} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="End Patrol" icon="square" tone="danger" onPress={() => setConfirmEnd(true)} />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      {active.gps === 'unavailable' ? (
        <GpsUnavailable routeName={active.route.name} parkName={active.route.parkName} onOk={dismissGpsNotice} />
      ) : null}
    </SafeAreaView>
  );
}

function Stat({ icon, label, value }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string }) {
  return (
    <View style={s.stat}>
      <Feather name={icon} size={16} color={C.green} />
      <View>
        <Text style={s.statLabel}>{label}</Text>
        <Text style={s.statValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EEF4EC' },
  content: { padding: 14, paddingBottom: 24, gap: 12 },
  mapCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 10, gap: 10, borderWidth: 1, borderColor: C.line },
  mapTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mapIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  mapName: { fontSize: 14, fontWeight: '800', color: C.text },
  mapPark: { fontSize: 10, color: C.muted },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 12, gap: 12, borderWidth: 1, borderColor: C.line },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 9, color: C.muted },
  statValue: { fontSize: 16, fontWeight: '800', color: C.text },
  confirm: { backgroundColor: '#FFF5F5', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F5C6C6' },
  confirmTitle: { fontSize: 14, fontWeight: '800', color: C.red },
});
