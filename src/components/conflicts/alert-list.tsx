import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { StatusPill, GREEN } from '@/components/conflicts/parts';
import { Banner, C, Empty, Loading, Pill, fmtDateTime, timeAgo } from '@/components/kit';
import { fetchAlerts, isClosedStatus, type ConflictCase } from '@/utils/conflicts';
import { useLoad } from '@/utils/use-load';

export type AlertFilter = 'active' | 'closed' | 'all';

const FILTERS: { key: AlertFilter; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'closed', label: 'Closed' },
  { key: 'all', label: 'All' },
];

/** Every conflict alert with an Active / Closed / All filter. Tapping one opens its details. */
export default function AlertList({ initial = 'active' }: { initial?: AlertFilter }) {
  const [filter, setFilter] = useState<AlertFilter>(initial);
  const { data, loading, error, reload } = useLoad(() => fetchAlerts());

  const all = data ?? [];
  const shown = all.filter((a) => (filter === 'all' ? true : filter === 'closed' ? isClosedStatus(a.status) : !isClosedStatus(a.status)));

  return (
    <View style={{ flex: 1 }}>
      {error ? <Banner tone="red" text={error} action={{ label: 'Retry', onPress: reload }} /> : null}
      <View style={s.tabs}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f.key} style={[s.tab, filter === f.key && s.tabOn]} onPress={() => setFilter(f.key)}>
            <Text style={[s.tabText, filter === f.key && s.tabTextOn]}>
              {f.label} ({all.filter((a) => (f.key === 'all' ? true : f.key === 'closed' ? isClosedStatus(a.status) : !isClosedStatus(a.status))).length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !data ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {shown.length === 0 ? (
            <Empty icon="shield" text={filter === 'closed' ? 'No closed alerts yet.' : 'No conflict alerts here.'} />
          ) : (
            shown.map((a) => <AlertRow key={a.id} alert={a} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}

function AlertRow({ alert }: { alert: ConflictCase }) {
  const high = alert.riskLevel === 'HIGH' || alert.riskLevel === 'CRITICAL';
  return (
    <TouchableOpacity
      style={[s.card, alert.status === 'NEW' && s.cardNew]}
      onPress={() => router.push(`/conflicts/${alert.id}`)}
      activeOpacity={0.85}>
      <View style={s.head}>
        <View style={s.pills}>
          <Pill label={alert.riskLevel} tone={high ? 'red' : 'orange'} />
          <StatusPill status={alert.status} />
        </View>
        <Text style={s.time}>{timeAgo(alert.alertTime)}</Text>
      </View>
      <Text style={s.title}>
        {alert.animalId} · {alert.riskZone}
      </Text>
      <View style={s.meta}>
        <Feather name="map-pin" size={13} color="#78909C" />
        <Text style={s.metaText} numberOfLines={1}>
          {alert.location}
        </Text>
      </View>
      <View style={s.meta}>
        <Feather name={alert.source === 'GPS_COLLAR' ? 'radio' : 'users'} size={13} color="#78909C" />
        <Text style={s.metaText}>{alert.detectedBy}</Text>
        <Text style={[s.metaText, { marginLeft: 'auto' }]}>{alert.assignedTo}</Text>
      </View>
      {alert.closure ? (
        <Text style={s.closed}>Closed {fmtDateTime(alert.closure.resolvedAt)}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  tabs: { flexDirection: 'row', backgroundColor: '#E3EFE5', borderRadius: 12, padding: 4, margin: 14, marginBottom: 6 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
  tabOn: { backgroundColor: GREEN },
  tabText: { fontSize: 13, fontWeight: '700', color: GREEN },
  tabTextOn: { color: '#FFF' },
  list: { padding: 14, paddingTop: 8, paddingBottom: 30 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.line },
  cardNew: { borderColor: '#EF9A9A', borderLeftWidth: 4, borderLeftColor: C.red },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pills: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  time: { fontSize: 12, color: '#90A4AE' },
  title: { fontSize: 15, fontWeight: '800', color: C.text, marginTop: 10, marginBottom: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  metaText: { fontSize: 12, color: '#607D8B', flexShrink: 1 },
  closed: { fontSize: 11, color: C.greenText, marginTop: 8, fontWeight: '600' },
});
