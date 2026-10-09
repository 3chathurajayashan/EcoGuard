import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ConflictMap from '@/components/conflicts/conflict-map';
import { AppHeader, BG, BottomNav, Card, GREEN, RED, StatusPill } from '@/components/conflicts/parts';
import { Banner, Loading, fmtDate, fmtTime, timeAgo } from '@/components/kit';
import {
  fetchAlerts,
  fetchCollars,
  fetchZones,
  isClosedStatus,
  pendingResponseCount,
  syncPendingResponses,
  type Collar,
  type ConflictCase,
  type RiskZone,
} from '@/utils/conflicts';
import { useSession } from '@/utils/session';
import { useLoad } from '@/utils/use-load';

interface DashboardData {
  alerts: ConflictCase[];
  collars: Collar[];
  zones: RiskZone[];
  pending: number;
  synced: number;
}

export default function ConflictDashboard() {
  const { user } = useSession();
  const [syncing, setSyncing] = useState(false);

  const { data, loading, error, reload } = useLoad<DashboardData>(async () => {
    // Send anything a ranger saved while offline before showing the latest state
    const synced = await syncPendingResponses().catch(() => 0);
    const [alerts, collars, zones, pending] = await Promise.all([
      fetchAlerts({ active: true }),
      fetchCollars().catch(() => [] as Collar[]),
      fetchZones().catch(() => [] as RiskZone[]),
      pendingResponseCount(),
    ]);
    return { alerts, collars, zones, pending, synced };
  });

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader />
        <Loading text="Loading alerts" />
        <BottomNav active="dashboard" />
      </SafeAreaView>
    );
  }

  const alerts = data?.alerts ?? [];
  // The alert that needs this person most: a new one assigned to them, else any new one, else the newest
  const featured =
    alerts.find((a) => a.status === 'NEW' && a.assignedToId === user?.id) ??
    alerts.find((a) => a.status === 'NEW') ??
    alerts[0] ??
    null;
  const others = alerts.filter((a) => a.id !== featured?.id);

  const syncNow = async () => {
    setSyncing(true);
    await syncPendingResponses().catch(() => 0);
    await reload();
    setSyncing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader />
      {error ? <Banner tone="red" text={error} action={{ label: 'Retry', onPress: reload }} /> : null}
      {data && data.pending > 0 ? (
        <Banner
          tone="orange"
          text={`${data.pending} response${data.pending > 1 ? 's' : ''} saved on this device, pending sync`}
          action={{ label: syncing ? 'Syncing' : 'Sync now', onPress: syncNow }}
        />
      ) : null}
      {data && data.synced > 0 ? <Banner tone="green" text={`${data.synced} offline response${data.synced > 1 ? 's were' : ' was'} synchronised.`} /> : null}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.sub}>Overview of wildlife alerts and activity</Text>
          </View>
          <View style={styles.updated}>
            <Feather name="clock" size={11} color="#666" />
            <Text style={styles.updatedText}>Last updated{'\n'}just now</Text>
          </View>
        </View>

        <Card title="ANIMAL MOVEMENT MAP">
          <ConflictMap height={160} zones={data?.zones ?? []} collars={data?.collars ?? []} alert={featured} />
        </Card>

        {featured ? (
          <AlertSummary alert={featured} />
        ) : (
          <View style={styles.allClear}>
            <View style={styles.clearIcon}>
              <Feather name="check" size={18} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clearTitle}>No active conflict alerts</Text>
              <Text style={styles.clearText}>All tracked animals are outside the high-risk zones.</Text>
            </View>
          </View>
        )}

        {others.length ? (
          <>
            <Text style={styles.moreTitle}>MORE ACTIVE ALERTS ({others.length})</Text>
            {others.slice(0, 4).map((a) => (
              <TouchableOpacity key={a.id} style={styles.row} onPress={() => router.push(`/conflicts/${a.id}`)}>
                <View style={[styles.rowDot, { backgroundColor: a.status === 'NEW' ? RED : '#E65100' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {a.animalId} · {a.riskZone}
                  </Text>
                  <Text style={styles.rowSub}>{timeAgo(a.alertTime)}</Text>
                </View>
                <StatusPill status={a.status} />
              </TouchableOpacity>
            ))}
          </>
        ) : null}
      </ScrollView>
      <BottomNav active="dashboard" />
    </SafeAreaView>
  );
}

function AlertSummary({ alert }: { alert: ConflictCase }) {
  const isNew = alert.status === 'NEW';
  const closed = isClosedStatus(alert.status);
  return (
    <View style={[styles.alertCard, !isNew && styles.alertCardQuiet]}>
      <View style={styles.alertHead}>
        <View style={[styles.alertIcon, closed && { backgroundColor: GREEN }]}>
          <Feather name={closed ? 'check' : 'alert-triangle'} size={16} color="#FFF" />
        </View>
        <Text style={[styles.alertTitle, closed && { color: GREEN }]}>
          {isNew ? 'NEW WILDLIFE CONFLICT ALERT' : 'WILDLIFE CONFLICT ALERT'}
        </Text>
        {!isNew ? <StatusPill status={alert.status} /> : null}
      </View>

      <View style={styles.grid}>
        <Field label="Animal ID" value={alert.animalId} />
        <Field label="Location" value={alert.riskZone} />
        <Field label="Time" value={fmtTime(alert.alertTime)} />
        <Field label="Date" value={fmtDate(alert.alertTime)} />
      </View>

      <View style={styles.message}>
        <Text style={styles.messageText}>{alert.description}</Text>
      </View>

      <TouchableOpacity style={styles.viewBtn} onPress={() => router.push(`/conflicts/${alert.id}`)}>
        <Text style={styles.viewBtnText}>VIEW ALERT  ›</Text>
      </TouchableOpacity>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 14, paddingBottom: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#222' },
  sub: { fontSize: 12, color: '#666', marginTop: 2 },
  updated: { flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: '#E3E8E3' },
  updatedText: { fontSize: 9, color: '#666' },
  alertCard: { backgroundColor: '#FFF', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#F0B7B3', marginBottom: 12 },
  alertCardQuiet: { borderColor: '#E3E8E3' },
  alertHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  alertIcon: { width: 28, height: 28, borderRadius: 6, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { flex: 1, fontSize: 13, fontWeight: '800', color: RED },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  field: { width: '50%', paddingRight: 8 },
  fieldLabel: { fontSize: 10, color: '#777' },
  fieldValue: { fontSize: 13, fontWeight: '700', color: '#222', marginTop: 1 },
  message: { backgroundColor: '#FDE7E5', borderRadius: 6, padding: 10, marginVertical: 12 },
  messageText: { fontSize: 12, color: '#7A2A26' },
  viewBtn: { backgroundColor: GREEN, borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  viewBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  allClear: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#E8F5E9', borderRadius: 10, padding: 14, marginBottom: 12 },
  clearIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  clearTitle: { fontSize: 14, fontWeight: '800', color: GREEN },
  clearText: { fontSize: 12, color: '#4A6B52', marginTop: 2 },
  moreTitle: { fontSize: 11, fontWeight: '800', color: GREEN, letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E3E8E3' },
  rowDot: { width: 10, height: 10, borderRadius: 5 },
  rowTitle: { fontSize: 13, fontWeight: '700', color: '#222' },
  rowSub: { fontSize: 11, color: '#888', marginTop: 2 },
});
