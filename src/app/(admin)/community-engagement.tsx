import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Page, Panel } from '@/components/admin-ui';
import { Banner, Button, C, Empty, Loading, Pill, timeAgo, type Tone } from '@/components/kit';
import { fetchReports, reportLabel, reviewReport, type CommunityReport, type ReportStatus } from '@/utils/conflicts';
import { errorMessage } from '@/utils/http';
import { useSession } from '@/utils/session';
import { useLoad } from '@/utils/use-load';

const STATUS: Record<ReportStatus, { label: string; tone: Tone }> = {
  PENDING: { label: 'Awaiting review', tone: 'orange' },
  UNDER_REVIEW: { label: 'Under review', tone: 'blue' },
  VERIFIED: { label: 'Verified', tone: 'green' },
  RESOLVED: { label: 'Resolved', tone: 'green' },
  DISMISSED: { label: 'Not confirmed', tone: 'gray' },
};

/** Community sightings from villagers. Managers can verify or dismiss them; researchers read them. */
export default function CommunityEngagement() {
  const { user } = useSession();
  const canReview = user?.role === 'PARK_MANAGER';
  const [filter, setFilter] = useState<'waiting' | 'all'>('waiting');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'green' | 'gray' | 'red'; text: string; alertId?: string } | null>(null);
  const { data, loading, error, reload } = useLoad(() => fetchReports());

  const decide = async (r: CommunityReport, verified: boolean) => {
    setBusy(r._id);
    try {
      const result = await reviewReport(r._id, verified ? 'VERIFIED' : 'DISMISSED');
      setNotice(
        verified
          ? { tone: 'green', text: 'Report verified. A conflict alert was raised and the officers were notified.', alertId: result.alertId }
          : { tone: 'gray', text: 'Report marked as false and archived.' },
      );
      await reload();
    } catch (e) {
      setNotice({ tone: 'red', text: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const all = data ?? [];
  const waiting = all.filter((r) => r.status === 'PENDING' || r.status === 'UNDER_REVIEW');
  const shown = filter === 'waiting' ? waiting : all;

  return (
    <Page title="Community Engagement" subtitle="Sightings and concerns reported by villagers near the park.">
      {error ? <Banner tone="red" text={error} action={{ label: 'Retry', onPress: reload }} /> : null}
      {notice ? (
        <Banner
          tone={notice.tone}
          text={notice.text}
          action={notice.alertId ? { label: 'View alert', onPress: () => router.push(`/conflicts/${notice.alertId}`) } : undefined}
        />
      ) : null}

      <View style={s.chips}>
        <Chip on={filter === 'waiting'} label={`Needs review (${waiting.length})`} onPress={() => setFilter('waiting')} />
        <Chip on={filter === 'all'} label={`All reports (${all.length})`} onPress={() => setFilter('all')} />
      </View>

      {loading && !data ? (
        <Loading />
      ) : (
        <Panel>
          {shown.length === 0 ? (
            <Empty icon="check-circle" text="Nothing waiting for review." />
          ) : (
            shown.map((r) => (
              <View key={r._id} style={s.item}>
                <View style={{ flex: 1 }}>
                  <View style={s.titleRow}>
                    <Text style={s.title}>{reportLabel(r.reportType)}</Text>
                    <Pill label={STATUS[r.status].label} tone={STATUS[r.status].tone} />
                  </View>
                  <Text style={s.desc}>{r.description}</Text>
                  <View style={s.meta}>
                    <Feather name="map-pin" size={12} color="#78909C" />
                    <Text style={s.metaText}>
                      {r.locationName || `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`} · {r.reportedBy ? `${r.reportedBy.firstName} ${r.reportedBy.lastName}` : 'villager'} · {timeAgo(r.reportedAt)}
                    </Text>
                  </View>
                </View>
                {canReview && (r.status === 'PENDING' || r.status === 'UNDER_REVIEW') ? (
                  <View style={s.buttons}>
                    <Button label="Mark false" tone="outline" small disabled={busy === r._id} onPress={() => decide(r, false)} />
                    <Button label="Verify & alert" icon="check" small loading={busy === r._id} onPress={() => decide(r, true)} />
                  </View>
                ) : null}
              </View>
            ))
          )}
        </Panel>
      )}
    </Page>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[s.chip, on && s.chipOn]} onPress={onPress}>
      <Text style={[s.chipText, on && { color: '#FFF' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1.5, borderColor: '#CFD8D2', backgroundColor: '#FFF' },
  chipOn: { backgroundColor: C.green, borderColor: C.green },
  chipText: { fontSize: 13, color: '#455A64', fontWeight: '600' },
  item: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E3E8E3' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  title: { fontSize: 15, fontWeight: '800', color: C.text },
  desc: { fontSize: 13, color: '#455A64', marginTop: 5, lineHeight: 19 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  metaText: { fontSize: 11, color: C.muted, flexShrink: 1 },
  buttons: { flexDirection: 'row', gap: 8 },
});
