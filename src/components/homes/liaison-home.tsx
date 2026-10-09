import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusPill } from '@/components/conflicts/parts';
import HomeHeader from '@/components/home-header';
import { Banner, C, Card, Empty, Loading, timeAgo } from '@/components/kit';
import { fetchAlerts, fetchReports } from '@/utils/conflicts';
import { useSession } from '@/utils/session';
import { useLoad } from '@/utils/use-load';

export default function LiaisonHome() {
  const { user } = useSession();
  const { data, loading, error, reload } = useLoad(async () => {
    const [alerts, reports] = await Promise.all([fetchAlerts({ active: true }), fetchReports('PENDING,UNDER_REVIEW')]);
    return { alerts, reports };
  });

  const alerts = data?.alerts ?? [];
  const fresh = alerts.filter((a) => a.status === 'NEW');

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <HomeHeader />
      {error ? <Banner tone="red" text={error} action={{ label: 'Retry', onPress: reload }} /> : null}
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.welcome}>Welcome, {user?.firstName}!</Text>
        <Text style={s.sub}>Keep communities and wildlife safe together.</Text>

        <View style={s.stats}>
          <Stat label="New alerts" value={fresh.length} color={C.red} onPress={() => router.push('/alerts')} />
          <Stat label="Active alerts" value={alerts.length} color={C.blue} onPress={() => router.push('/alerts')} />
          <Stat label="To verify" value={data?.reports.length ?? 0} color={C.orange} onPress={() => router.push('/community')} />
        </View>

        {data && data.reports.length > 0 ? (
          <TouchableOpacity style={s.verify} onPress={() => router.push('/community')}>
            <View style={s.verifyIcon}>
              <Feather name="check-square" size={22} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.verifyTitle}>Verify community reports</Text>
              <Text style={s.verifySub}>
                {data.reports.length} sighting{data.reports.length > 1 ? 's' : ''} from villagers waiting for your review
              </Text>
            </View>
            <Feather name="chevron-right" size={22} color="#999" />
          </TouchableOpacity>
        ) : null}

        <Text style={s.section}>NEEDS ATTENTION</Text>
        {loading && !data ? (
          <Loading />
        ) : alerts.length === 0 ? (
          <Card>
            <Empty icon="shield" text="No active conflict alerts right now." />
          </Card>
        ) : (
          alerts.slice(0, 4).map((a) => (
            <TouchableOpacity key={a.id} style={s.alert} onPress={() => router.push(`/conflicts/${a.id}`)}>
              <View style={[s.dot, { backgroundColor: a.status === 'NEW' ? C.red : '#E65100' }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.alertTitle} numberOfLines={1}>
                  {a.animalId} · {a.riskZone}
                </Text>
                <Text style={s.alertSub}>
                  {timeAgo(a.alertTime)} · {a.assignedTo}
                </Text>
              </View>
              <StatusPill status={a.status} />
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity style={s.open} onPress={() => router.push('/conflicts')}>
          <Text style={s.openText}>Open conflict dashboard</Text>
          <Feather name="arrow-right" size={16} color={C.green} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, color, onPress }: { label: string; value: number; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.stat} onPress={onPress}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 30 },
  welcome: { fontSize: 26, fontWeight: '800', color: C.text },
  sub: { fontSize: 13, color: C.muted, marginTop: 2, marginBottom: 16 },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  stat: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: C.line },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: C.muted, marginTop: 2 },
  verify: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: C.line },
  verifyIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  verifyTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  verifySub: { fontSize: 12, color: C.muted, marginTop: 2 },
  section: { fontSize: 12, fontWeight: '800', color: C.green, letterSpacing: 0.5, marginBottom: 8 },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.line },
  dot: { width: 10, height: 10, borderRadius: 5 },
  alertTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  alertSub: { fontSize: 11, color: '#888', marginTop: 2 },
  open: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, padding: 12 },
  openText: { color: C.green, fontWeight: '800', fontSize: 14 },
});
