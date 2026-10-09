import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, C, Card, Empty, Loading, Pill, SectionLabel, timeAgo } from '@/components/kit';
import { errorMessage } from '@/utils/http';
import { fetchReports, reportLabel, reviewReport, type CommunityReport } from '@/utils/conflicts';
import { useLoad } from '@/utils/use-load';

/** Liaison officers verify community sightings here. Nothing is broadcast until one is verified. */
export default function VerifyReportsTab() {
  const { data, loading, error, reload } = useLoad(() => fetchReports());
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'green' | 'gray' | 'red'; text: string; alertId?: string } | null>(null);

  const decide = async (report: CommunityReport, verified: boolean) => {
    setBusy(report._id);
    try {
      const result = await reviewReport(report._id, verified ? 'VERIFIED' : 'DISMISSED');
      setNotice(
        verified
          ? { tone: 'green', text: 'Report verified. A conflict alert was raised and the officers were notified.', alertId: result.alertId }
          : { tone: 'gray', text: 'Report marked as false and archived. No alert was sent.' },
      );
      await reload();
    } catch (e) {
      setNotice({ tone: 'red', text: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const waiting = (data ?? []).filter((r) => r.status === 'PENDING' || r.status === 'UNDER_REVIEW');
  const reviewed = (data ?? []).filter((r) => r.status !== 'PENDING' && r.status !== 'UNDER_REVIEW');

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.head}>
        <Text style={s.title}>Verify Reports</Text>
        <Text style={s.sub}>{waiting.length} community report{waiting.length === 1 ? '' : 's'} waiting for review</Text>
      </View>
      {error ? <Banner tone="red" text={error} action={{ label: 'Retry', onPress: reload }} /> : null}
      {notice ? (
        <Banner
          tone={notice.tone}
          text={notice.text}
          action={notice.alertId ? { label: 'View alert', onPress: () => router.push(`/conflicts/${notice.alertId}`) } : undefined}
        />
      ) : null}

      {loading && !data ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {waiting.length === 0 ? (
            <Empty icon="check-circle" text="All community reports have been reviewed." />
          ) : (
            waiting.map((r) => (
              <Card key={r._id}>
                <View style={s.rowBetween}>
                  <Text style={s.type}>{reportLabel(r.reportType)}</Text>
                  <Text style={s.time}>{timeAgo(r.reportedAt)}</Text>
                </View>
                <Text style={s.desc}>{r.description}</Text>
                <View style={s.meta}>
                  <Feather name="map-pin" size={13} color="#78909C" />
                  <Text style={s.metaText}>{r.locationName || `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`}</Text>
                </View>
                <View style={s.meta}>
                  <Feather name="user" size={13} color="#78909C" />
                  <Text style={s.metaText}>Reported by {r.reportedBy ? `${r.reportedBy.firstName} ${r.reportedBy.lastName}` : 'a villager'}</Text>
                </View>
                <View style={s.btnRow}>
                  <View style={{ flex: 1 }}>
                    <Button label="Mark as false" tone="outline" small disabled={busy === r._id} onPress={() => decide(r, false)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button label="Verify & alert" icon="check" small loading={busy === r._id} onPress={() => decide(r, true)} />
                  </View>
                </View>
              </Card>
            ))
          )}

          {reviewed.length ? <SectionLabel>Already reviewed</SectionLabel> : null}
          {reviewed.map((r) => (
            <Card key={r._id}>
              <View style={s.rowBetween}>
                <Text style={s.type}>{reportLabel(r.reportType)}</Text>
                <Pill label={r.status === 'VERIFIED' ? 'Verified' : r.status === 'DISMISSED' ? 'False / archived' : r.status} tone={r.status === 'VERIFIED' ? 'green' : 'gray'} />
              </View>
              <Text style={s.desc}>{r.description}</Text>
            </Card>
          ))}
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
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  type: { fontSize: 16, fontWeight: '800', color: C.text },
  time: { fontSize: 12, color: '#90A4AE' },
  desc: { fontSize: 14, color: '#455A64', marginTop: 8, lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  metaText: { fontSize: 13, color: '#607D8B' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
