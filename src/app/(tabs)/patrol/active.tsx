import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, C, fmtDate, fmtTime } from '@/components/kit';
import { GpsCard, GpsUnavailable } from '@/components/patrol/gps';
import PatrolHeader from '@/components/patrol/patrol-header';
import RouteMap from '@/components/patrol/route-map';
import { dismissGpsNotice, endPatrol, formatDuration, useActivePatrol, useNow } from '@/utils/patrol';

/** Patrol Active: GPS tracking has started. */
export default function PatrolActive() {
  const active = useActivePatrol();
  const now = useNow(1000);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);

  // No patrol running (or it already ended): go back to the start of the flow
  useEffect(() => {
    if (active === null) {
      const t = setTimeout(() => router.replace('/patrol'), 400);
      return () => clearTimeout(t);
    }
    if (active?.status === 'COMPLETED') router.replace('/patrol/complete');
  }, [active]);

  if (!active || active.status !== 'IN_PROGRESS') {
    return <SafeAreaView style={s.root} />;
  }

  const elapsed = now - new Date(active.startTime).getTime();
  const manual = active.waypoints.filter((w) => w.type === 'MANUAL').length;

  const finish = async () => {
    setEnding(true);
    await endPatrol();
    router.replace('/patrol/complete');
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <PatrolHeader title="Patrol Active" subtitle="Protect Wildlife, Preserve Our Parks" />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          <GpsCard state={active.gps} />

          <View style={s.stats}>
            <Stat icon="clock" label="Start Time" value={`${fmtDate(active.startTime)}\n${fmtTime(active.startTime)}`} small />
            <Stat icon="map-pin" label="Distance" value={`${active.totalDistanceKm.toFixed(1)} km`} />
            <Stat icon="watch" label="Time Elapsed" value={formatDuration(elapsed)} />
          </View>

          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/patrol/tracking')}>
            <RouteMap route={active.route} waypoints={active.waypoints} height={180} showStops={false} showYou />
          </TouchableOpacity>

          <TouchableOpacity style={s.addCard} onPress={() => router.push('/patrol/waypoint')} activeOpacity={0.85}>
            <View style={s.addIcon}>
              <Feather name="map-pin" size={20} color={C.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.addTitle}>Add Waypoint</Text>
              <Text style={s.addSub}>Mark important sightings, signs, or points of interest along your patrol route.</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>

          <Button label={`Add Waypoint${manual ? ` (${manual} added)` : ''}`} icon="plus-circle" onPress={() => router.push('/patrol/waypoint')} />

          {confirmEnd ? (
            <View style={s.confirm}>
              <Text style={s.confirmTitle}>End this patrol?</Text>
              <Text style={s.confirmText}>
                {active.totalDistanceKm.toFixed(1)} km covered and {active.waypoints.length} waypoints recorded. The patrol will be saved and sent to the central system.
              </Text>
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
            <Button label="End Patrol" icon="square" tone="danger" onPress={() => setConfirmEnd(true)} />
          )}
        </View>
        {active.syncError ? <Banner tone="red" text={active.syncError} /> : null}
      </ScrollView>

      {active.gps === 'unavailable' ? (
        <GpsUnavailable routeName={active.route.name} parkName={active.route.parkName} onOk={dismissGpsNotice} />
      ) : null}
    </SafeAreaView>
  );
}

function Stat({ icon, label, value, small }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string; small?: boolean }) {
  return (
    <View style={s.stat}>
      <Feather name={icon} size={16} color={C.green} />
      <View>
        <Text style={s.statLabel}>{label}</Text>
        <Text style={[s.statValue, small && { fontSize: 11 }]}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EEF4EC' },
  content: { padding: 14, paddingBottom: 24 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 12, gap: 12, borderWidth: 1, borderColor: C.line },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 9, color: C.muted },
  statValue: { fontSize: 15, fontWeight: '800', color: C.text },
  addCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 10, backgroundColor: '#F4FAF4', borderWidth: 1, borderColor: '#DCEBDD' },
  addIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E3EFE5', alignItems: 'center', justifyContent: 'center' },
  addTitle: { fontSize: 14, fontWeight: '800', color: C.text },
  addSub: { fontSize: 10, color: C.muted, marginTop: 1 },
  confirm: { backgroundColor: '#FFF5F5', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F5C6C6' },
  confirmTitle: { fontSize: 14, fontWeight: '800', color: C.red },
  confirmText: { fontSize: 12, color: '#7A2A26', marginTop: 4, lineHeight: 17 },
});
