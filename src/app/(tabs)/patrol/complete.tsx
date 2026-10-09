import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, C } from '@/components/kit';
import PatrolHeader from '@/components/patrol/patrol-header';
import { clearFinishedPatrol, formatDuration, syncFinishedPatrols, useActivePatrol } from '@/utils/patrol';

/** Patrol Completed & Sync. */
export default function PatrolComplete() {
  const patrol = useActivePatrol();
  const [retrying, setRetrying] = useState(false);

  if (!patrol || patrol.status !== 'COMPLETED') {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <PatrolHeader title="Great work, Ranger!" subtitle="Every patrol helps protect wildlife and wild places." />
        <View style={{ padding: 20 }}>
          <Button label="Back to Patrol" onPress={() => router.replace('/patrol')} />
        </View>
      </SafeAreaView>
    );
  }

  const synced = patrol.syncStatus === 'SYNCED';
  const duration = formatDuration(new Date(patrol.endTime ?? patrol.startTime).getTime() - new Date(patrol.startTime).getTime());
  const observations = patrol.waypoints.filter((w) => w.type === 'MANUAL').length;

  const retry = async () => {
    setRetrying(true);
    await syncFinishedPatrols().catch(() => 0);
    setRetrying(false);
  };

  const home = () => {
    clearFinishedPatrol();
    router.replace('/');
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <PatrolHeader title="Great work, Ranger!" subtitle="Every patrol helps protect wildlife and wild places." />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          <View style={s.tick}>
            <Feather name="check" size={44} color="#FFF" />
          </View>
          <Text style={s.title}>Patrol Completed!</Text>
          <Text style={s.sub}>Your patrol has been recorded successfully.</Text>

          <View style={s.grid}>
            <Stat icon="map-pin" label="Distance" value={`${patrol.totalDistanceKm.toFixed(1)} km`} />
            <Stat icon="clock" label="Time" value={duration} />
            <Stat icon="flag" label="Waypoints" value={String(patrol.waypoints.length)} />
            <Stat icon="eye" label="Observations" value={String(observations)} />
          </View>

          {synced ? (
            <View style={s.syncBox}>
              <View style={[s.syncIcon, { backgroundColor: C.green }]}>
                <Feather name="check-circle" size={20} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.syncTitle}>Synchronized</Text>
                <Text style={s.syncSub}>Patrol data was uploaded to the central system.</Text>
                <View style={s.track}>
                  <View style={[s.fill, { width: '100%' }]} />
                </View>
              </View>
              <Text style={s.pct}>100%</Text>
            </View>
          ) : (
            <View style={[s.syncBox, { backgroundColor: '#FFF8E8' }]}>
              <View style={[s.syncIcon, { backgroundColor: '#F57F17' }]}>
                <Feather name="clock" size={20} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.syncTitle}>Saved locally — Pending Sync</Text>
                <Text style={s.syncSub}>Will synchronize automatically when online.</Text>
              </View>
            </View>
          )}

          {patrol.syncError ? <Banner tone="red" text={patrol.syncError} /> : null}
          {!synced && !patrol.syncError ? <Button label="Retry sync now" icon="refresh-cw" tone="outline" small loading={retrying} onPress={retry} /> : null}
          <Button label="Back to Home" icon="home" onPress={home} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, label, value }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string }) {
  return (
    <View style={s.stat}>
      <View style={s.statIcon}>
        <Feather name={icon} size={16} color={C.green} />
      </View>
      <View>
        <Text style={s.statLabel}>{label}</Text>
        <Text style={s.statValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EEF4EC' },
  content: { padding: 14, paddingBottom: 24 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: C.line },
  tick: { alignSelf: 'center', width: 84, height: 84, borderRadius: 42, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: '#CFE8D4' },
  title: { fontSize: 24, fontWeight: '800', color: C.text, textAlign: 'center' },
  sub: { fontSize: 13, color: C.muted, textAlign: 'center', marginTop: -8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  stat: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E3EFE5', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 11, color: C.muted },
  statValue: { fontSize: 20, fontWeight: '800', color: C.text },
  syncBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F1F8F1', borderRadius: 12, padding: 12 },
  syncIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  syncTitle: { fontSize: 13, fontWeight: '800', color: C.text },
  syncSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  track: { height: 6, borderRadius: 3, backgroundColor: '#D5DDD7', marginTop: 8, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: C.green },
  pct: { fontSize: 12, fontWeight: '700', color: C.muted },
});
