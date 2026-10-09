import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HomeHeader from '@/components/home-header';
import { Button, C, Pill, timeAgo, type Tone } from '@/components/kit';
import { fetchReports, reportLabel, type ReportStatus } from '@/utils/conflicts';
import { useSession } from '@/utils/session';
import { useLoad } from '@/utils/use-load';

const STATUS: Record<ReportStatus, { label: string; tone: Tone }> = {
  PENDING: { label: 'Awaiting review', tone: 'orange' },
  UNDER_REVIEW: { label: 'Under review', tone: 'blue' },
  VERIFIED: { label: 'Verified', tone: 'green' },
  RESOLVED: { label: 'Resolved', tone: 'green' },
  DISMISSED: { label: 'Not confirmed', tone: 'gray' },
};

const STEPS = [
  { icon: 'camera' as const, text: 'You report an animal near your village or farm' },
  { icon: 'check-square' as const, text: 'A liaison officer checks your report' },
  { icon: 'shield' as const, text: 'Rangers are alerted and respond on site' },
];

export default function VillagerHome() {
  const { user } = useSession();
  const { data } = useLoad(() => fetchReports());
  const recent = (data ?? []).slice(0, 3);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <HomeHeader />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.welcome}>Hello, {user?.firstName}!</Text>
        <Text style={s.sub}>Together for a safer tomorrow, for people and wildlife.</Text>

        <View style={s.hero}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=1000' }}
            style={s.heroImg}
          />
          <View style={s.heroShade} />
          <Text style={s.heroText}>See an animal near your village or farm?</Text>
        </View>

        <Button label="Report a sighting" icon="plus-circle" onPress={() => router.push('/conflicts/report')} />

        <Text style={s.section}>HOW IT WORKS</Text>
        {STEPS.map((step, i) => (
          <View key={step.text} style={s.step}>
            <View style={s.stepIcon}>
              <Feather name={step.icon} size={16} color="#FFF" />
            </View>
            <Text style={s.stepText}>
              {i + 1}. {step.text}
            </Text>
          </View>
        ))}

        <View style={s.rowHead}>
          <Text style={[s.section, { marginTop: 0 }]}>MY RECENT REPORTS</Text>
          <TouchableOpacity onPress={() => router.push('/sightings')}>
            <Text style={s.link}>See all</Text>
          </TouchableOpacity>
        </View>
        {recent.length === 0 ? (
          <Text style={s.none}>You have not sent any reports yet.</Text>
        ) : (
          recent.map((r) => (
            <View key={r._id} style={s.report}>
              <View style={{ flex: 1 }}>
                <Text style={s.reportTitle}>{reportLabel(r.reportType)}</Text>
                <Text style={s.reportSub}>
                  {r.locationName || 'Pinned location'} · {timeAgo(r.reportedAt)}
                </Text>
              </View>
              <Pill label={STATUS[r.status].label} tone={STATUS[r.status].tone} />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 30 },
  welcome: { fontSize: 26, fontWeight: '800', color: C.text },
  sub: { fontSize: 13, color: C.muted, marginTop: 2, marginBottom: 16 },
  hero: { height: 150, borderRadius: 16, overflow: 'hidden', marginBottom: 16, justifyContent: 'flex-end' },
  heroImg: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,60,34,0.45)' },
  heroText: { color: '#FFF', fontSize: 18, fontWeight: '800', padding: 14 },
  section: { fontSize: 12, fontWeight: '800', color: C.green, letterSpacing: 0.5, marginTop: 22, marginBottom: 10 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.line },
  stepIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  stepText: { flex: 1, fontSize: 13, color: C.text },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 },
  link: { color: C.green, fontWeight: '800', fontSize: 12 },
  none: { color: C.muted, fontSize: 13 },
  report: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.line },
  reportTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  reportSub: { fontSize: 11, color: '#888', marginTop: 2 },
});
