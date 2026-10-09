import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, C, Card, Empty, Loading, Pill } from '@/components/kit';
import PatrolHeader from '@/components/patrol/patrol-header';
import RouteMap from '@/components/patrol/route-map';
import {
  dms,
  fetchMyAssignment,
  pendingPatrolCount,
  syncFinishedPatrols,
  useActivePatrol,
  type Assignment,
} from '@/utils/patrol';
import { useSession } from '@/utils/session';
import { useLoad } from '@/utils/use-load';

export default function PatrolHome() {
  const { user } = useSession();
  const active = useActivePatrol();

  const { data, loading, error, reload } = useLoad<{ assignment: Assignment | null; pending: number; sent: number }>(async () => {
    // A patrol finished while offline goes up as soon as there is a connection
    const sent = await syncFinishedPatrols().catch(() => 0);
    const [assignment, pending] = await Promise.all([fetchMyAssignment(), pendingPatrolCount()]);
    return { assignment, pending, sent };
  });

  const assignment = data?.assignment ?? null;
  const running = active?.status === 'IN_PROGRESS' ? active : null;
  const justFinished = active?.status === 'COMPLETED' ? active : null;
  const route = running?.route ?? assignment?.route;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <PatrolHeader title={`Welcome, ${user?.role === 'RANGER' ? 'Ranger' : user?.firstName}!`} subtitle="Protect Wildlife, Preserve Our Parks" />
      {error ? <Banner tone="red" text={error} action={{ label: 'Retry', onPress: reload }} /> : null}
      {data && data.pending > 0 ? <Banner tone="orange" text={`${data.pending} finished patrol${data.pending > 1 ? 's' : ''} saved on this device, pending sync`} action={{ label: 'Sync now', onPress: reload }} /> : null}
      {data && data.sent > 0 ? <Banner tone="green" text={`${data.sent} patrol${data.sent > 1 ? 's were' : ' was'} synchronised with the central system.`} /> : null}

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {loading && !data ? (
          <Loading text="Loading your assignment" />
        ) : justFinished ? (
          <Card>
            <Text style={s.cardTitle}>Patrol finished</Text>
            <Text style={s.muted}>Your last patrol on {justFinished.route.name} is ready to review.</Text>
            <View style={{ height: 12 }} />
            <Button label="View summary" onPress={() => router.push('/patrol/complete')} />
          </Card>
        ) : !route ? (
          <Card>
            <Empty icon="map" text="You have no assigned patrol route. Your Park Manager will assign one." action={{ label: 'Check again', onPress: reload }} />
          </Card>
        ) : (
          <View style={s.routeCard}>
            <View style={s.routeHead}>
              <View style={s.routeIcon}>
                <Feather name="navigation" size={20} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.small}>{running ? 'Patrol in progress' : 'Assigned Patrol Route'}</Text>
                <Text style={s.routeName}>{route.name}</Text>
                <Text style={s.small}>{route.parkName}</Text>
              </View>
              <Pill label={running ? 'Active' : 'Assigned'} tone="green" />
            </View>

            <RouteMap route={route} waypoints={running?.waypoints} height={170} showYou={!!running} />

            <View style={s.stats}>
              <Stat icon="map-pin" color={C.green} label="Start Point" value={route.startPoint.name || 'Start'} sub={`${dms(route.startPoint.latitude, 'lat')}\n${dms(route.startPoint.longitude, 'lon')}`} />
              <Stat icon="map-pin" color={C.red} label="End Point" value={route.endPoint.name || 'End'} sub={`${dms(route.endPoint.latitude, 'lat')}\n${dms(route.endPoint.longitude, 'lon')}`} />
              <View style={s.statCol}>
                <Text style={s.statLabel}>Route Distance</Text>
                <Text style={s.statBig}>{route.distanceKm} km</Text>
                <Text style={s.statLabel}>Est. Duration</Text>
                <Text style={s.statMid}>{Math.round(route.estimatedDurationMinutes / 60)} hours</Text>
              </View>
            </View>

            {running ? (
              <Button label="Resume Patrol" icon="play" onPress={() => router.push('/patrol/active')} />
            ) : (
              <Button label="View Route" icon="map" onPress={() => router.push('/patrol/review')} />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, color, label, value, sub }: { icon: React.ComponentProps<typeof Feather>['name']; color: string; label: string; value: string; sub: string }) {
  return (
    <View style={s.statCol}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Feather name={icon} size={13} color={color} />
        <Text style={s.statLabel}>{label}</Text>
      </View>
      <Text style={s.statMid}>{value}</Text>
      <Text style={s.statSub}>{sub}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EEF4EC' },
  content: { padding: 14, paddingBottom: 24 },
  routeCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 12, gap: 12, borderWidth: 1, borderColor: C.line },
  routeHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  small: { fontSize: 11, color: C.muted },
  routeName: { fontSize: 20, fontWeight: '800', color: C.text },
  stats: { flexDirection: 'row', gap: 8 },
  statCol: { flex: 1 },
  statLabel: { fontSize: 10, color: C.muted },
  statMid: { fontSize: 13, fontWeight: '800', color: C.text, marginTop: 1 },
  statBig: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 6 },
  statSub: { fontSize: 9, color: C.muted, marginTop: 2 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  muted: { fontSize: 13, color: C.muted, marginTop: 4 },
});
