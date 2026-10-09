import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, C, Loading } from '@/components/kit';
import PatrolHeader from '@/components/patrol/patrol-header';
import RouteMap from '@/components/patrol/route-map';
import { beginPatrol, fetchMyAssignment, useActivePatrol, type Assignment } from '@/utils/patrol';
import { useLoad } from '@/utils/use-load';

export default function ReviewRoute() {
  const active = useActivePatrol();
  const { data: assignment, loading, error } = useLoad<Assignment | null>(fetchMyAssignment);
  const [simulate, setSimulate] = useState(false);
  const [starting, setStarting] = useState(false);

  if (loading && !assignment) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <PatrolHeader title="Review Route" onBack={() => router.back()} />
        <Loading />
      </SafeAreaView>
    );
  }

  const route = assignment?.route;
  if (!route) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <PatrolHeader title="Review Route" onBack={() => router.replace('/patrol')} />
        <Banner tone="orange" text={error || 'You have no assigned patrol route.'} />
      </SafeAreaView>
    );
  }

  const start = async () => {
    if (!assignment) return;
    setStarting(true);
    await beginPatrol(assignment, simulate);
    router.replace('/patrol/active');
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <PatrolHeader title={route.name} subtitle="Review route details before starting your patrol" onBack={() => router.replace('/patrol')} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {active?.status === 'IN_PROGRESS' ? (
          <Banner tone="orange" text="A patrol is already running." action={{ label: 'Resume', onPress: () => router.replace('/patrol/active') }} />
        ) : null}
        <View style={s.card}>
          <RouteMap route={route} height={230} />

          <View style={s.stats}>
            <Stat icon="map-pin" label="Distance" value={`${route.distanceKm} km`} />
            <Stat icon="clock" label="Est. Duration" value={`${Math.round(route.estimatedDurationMinutes / 60)} hours`} />
            <Stat icon="flag" label="Waypoints" value={String(route.expectedWaypoints ?? route.routePoints.length)} />
          </View>

          <View style={s.demo}>
            <View style={{ flex: 1 }}>
              <Text style={s.demoTitle}>Demo mode</Text>
              <Text style={s.demoSub}>Simulate GPS movement along the route (no phone GPS needed)</Text>
            </View>
            <Switch value={simulate} onValueChange={setSimulate} trackColor={{ true: C.green }} />
          </View>

          <Button label="Start Patrol" icon="play" onPress={start} loading={starting} disabled={active?.status === 'IN_PROGRESS'} />
        </View>
      </ScrollView>
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
  content: { padding: 14, paddingBottom: 24 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 12, gap: 14, borderWidth: 1, borderColor: C.line },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel: { fontSize: 10, color: C.muted },
  statValue: { fontSize: 16, fontWeight: '800', color: C.text },
  demo: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F4F7F4', borderRadius: 10, padding: 10 },
  demoTitle: { fontSize: 12, fontWeight: '800', color: C.text },
  demoSub: { fontSize: 11, color: C.muted, marginTop: 1 },
});
