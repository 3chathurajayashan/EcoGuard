import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ConflictMap from '@/components/conflicts/conflict-map';
import { AppHeader, BG, BottomNav, GREEN } from '@/components/conflicts/parts';
import { Banner, C, Card, Empty, Loading, Pill, timeAgo } from '@/components/kit';
import { fetchAlerts, fetchCollars, fetchZones, isClosedStatus, type Collar, type ConflictCase, type RiskZone } from '@/utils/conflicts';
import { useLoad } from '@/utils/use-load';

export default function TrackedAnimals() {
  const { data, loading, error } = useLoad<{ collars: Collar[]; zones: RiskZone[]; alerts: ConflictCase[] }>(async () => {
    const [collars, zones, alerts] = await Promise.all([fetchCollars(), fetchZones().catch(() => [] as RiskZone[]), fetchAlerts()]);
    return { collars, zones, alerts };
  });

  const open = new Map<string, ConflictCase>();
  data?.alerts.filter((a) => !isClosedStatus(a.status)).forEach((a) => open.set(a.animalId, a));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader />
      {error ? <Banner tone="red" text={error} /> : null}
      {loading && !data ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>TRACKED ANIMALS</Text>
          <Text style={styles.sub}>GPS-collared animals and their last known position</Text>

          <Card style={{ marginTop: 12 }}>
            <ConflictMap height={170} zones={data?.zones ?? []} collars={data?.collars ?? []} />
          </Card>

          {data?.collars.length === 0 ? (
            <Empty icon="radio" text="No collared animals yet." />
          ) : (
            data?.collars.map((c) => {
              const alert = open.get(c.animalId?.identifier);
              return (
                <View key={c._id} style={styles.row}>
                  <View style={styles.icon}>
                    <Feather name="radio" size={16} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{c.animalId?.identifier}</Text>
                    <Text style={styles.meta}>
                      {c.animalId?.species} · {c.lastUpdated ? `seen ${timeAgo(c.lastUpdated)}` : 'no position yet'}
                    </Text>
                    {c.lastLatitude != null ? (
                      <Text style={styles.meta}>
                        {c.lastLatitude.toFixed(4)}, {c.lastLongitude?.toFixed(4)}
                      </Text>
                    ) : null}
                  </View>
                  {alert ? <Pill label="In risk zone" tone="red" /> : <Pill label={c.status} tone={c.status === 'ACTIVE' ? 'green' : 'gray'} />}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
      <BottomNav active="animals" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 14, paddingBottom: 24 },
  title: { fontSize: 20, fontWeight: '800', color: GREEN },
  sub: { fontSize: 12, color: '#666', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.line },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '800', color: C.text },
  meta: { fontSize: 11, color: '#78909C', marginTop: 2 },
});
