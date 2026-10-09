import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, C, Card, Empty, Loading, Pill, timeAgo, type Tone } from '@/components/kit';
import { fetchReports, reportLabel, type ReportStatus } from '@/utils/conflicts';
import { useLoad } from '@/utils/use-load';

const STATUS: Record<ReportStatus, { label: string; tone: Tone }> = {
  PENDING: { label: 'Awaiting review', tone: 'orange' },
  UNDER_REVIEW: { label: 'Under review', tone: 'blue' },
  VERIFIED: { label: 'Verified: rangers alerted', tone: 'green' },
  RESOLVED: { label: 'Resolved', tone: 'green' },
  DISMISSED: { label: 'Not confirmed', tone: 'gray' },
};

/** A villager's own sighting reports and what happened to each. */
export default function MySightings() {
  const { data, loading, error, reload } = useLoad(() => fetchReports());

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.head}>
        <Text style={s.title}>My Reports</Text>
        <Text style={s.sub}>Sightings you sent and their status</Text>
      </View>
      {error ? <Banner tone="red" text={error} action={{ label: 'Retry', onPress: reload }} /> : null}
      {loading && !data ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Button label="Report a sighting" icon="plus-circle" onPress={() => router.push('/conflicts/report')} />
          <View style={{ height: 16 }} />
          {data?.length === 0 ? (
            <Empty icon="file-text" text="You have not sent any reports yet." />
          ) : (
            data?.map((r) => (
              <Card key={r._id}>
                <View style={s.rowBetween}>
                  <Text style={s.type}>{reportLabel(r.reportType)}</Text>
                  <Pill label={STATUS[r.status].label} tone={STATUS[r.status].tone} />
                </View>
                <Text style={s.desc}>{r.description}</Text>
                <View style={s.meta}>
                  <Feather name="map-pin" size={13} color="#78909C" />
                  <Text style={s.metaText}>
                    {r.locationName || `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`} · {timeAgo(r.reportedAt)}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  head: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 },
  title: { fontSize: 22, fontWeight: '800', color: C.text },
  sub: { fontSize: 12, color: C.muted, marginTop: 2 },
  content: { padding: 16, paddingBottom: 30 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  type: { fontSize: 15, fontWeight: '800', color: C.text, flexShrink: 1 },
  desc: { fontSize: 13, color: '#455A64', marginTop: 8, lineHeight: 19 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  metaText: { fontSize: 12, color: '#78909C', flexShrink: 1 },
});
