import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, BG, BottomNav, Card, GREEN, MockMap, RED, StatusPill } from '@/components/conflicts/parts';
import { fmtDate, fmtTime, resetCase, useCase } from '@/utils/conflict/store';

export default function ConflictDashboard() {
  const [c, setCase] = useCase();
  if (!c) return <SafeAreaView style={styles.container} />;

  const isNew = c.status === 'NEW';
  const closed = c.status === 'RESOLVED' || c.status === 'FALSE_ALERT' || c.status === 'CANCELLED';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.sub}>Overview of wildlife alerts and activity</Text>
          </View>
          <View style={styles.updated}>
            <Feather name="clock" size={11} color="#666" />
            <Text style={styles.updatedText}>Last updated{'\n'}2 min ago</Text>
          </View>
        </View>

        <Card title="ANIMAL MOVEMENT MAP">
          <MockMap height={150} />
        </Card>

        <View style={[styles.alertCard, !isNew && styles.alertCardQuiet]}>
          <View style={styles.alertHead}>
            <View style={[styles.alertIcon, closed && { backgroundColor: GREEN }]}>
              <Feather name={closed ? 'check' : 'alert-triangle'} size={16} color="#FFF" />
            </View>
            <Text style={[styles.alertTitle, closed && { color: GREEN }]}>
              {isNew ? 'NEW WILDLIFE CONFLICT ALERT' : 'WILDLIFE CONFLICT ALERT'}
            </Text>
            {!isNew ? <StatusPill status={c.status} /> : null}
          </View>

          <View style={styles.grid}>
            <Field label="Animal ID" value={c.animalId} />
            <Field label="Location" value={c.riskZone} />
            <Field label="Time" value={fmtTime(c.alertTime)} />
            <Field label="Date" value={fmtDate(c.alertTime)} />
          </View>

          <View style={styles.message}>
            <Text style={styles.messageText}>
              {closed
                ? `This alert was closed as ${c.status.replace('_', ' ').toLowerCase()}.`
                : 'The system has detected that a tracked elephant has entered a high-risk zone.'}
            </Text>
          </View>

          <TouchableOpacity style={styles.viewBtn} onPress={() => router.push('/conflicts/ca-1')}>
            <Text style={styles.viewBtnText}>VIEW ALERT  ›</Text>
          </TouchableOpacity>
        </View>

        {closed ? (
          <TouchableOpacity
            onPress={async () => setCase(await resetCase())}
            style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset demo alert</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
      <BottomNav active="dashboard" />
    </SafeAreaView>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
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
  alertCard: { backgroundColor: '#FFF', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#F0B7B3' },
  alertCardQuiet: { borderColor: '#E3E8E3' },
  alertHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  alertIcon: { width: 28, height: 28, borderRadius: 6, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { flex: 1, fontSize: 13, fontWeight: '800', color: RED },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  field: { width: '50%' },
  fieldLabel: { fontSize: 10, color: '#777' },
  fieldValue: { fontSize: 13, fontWeight: '700', color: '#222', marginTop: 1 },
  message: { backgroundColor: '#FDE7E5', borderRadius: 6, padding: 10, marginVertical: 12 },
  messageText: { fontSize: 12, color: '#7A2A26' },
  viewBtn: { backgroundColor: GREEN, borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  viewBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  resetBtn: { alignSelf: 'center', marginTop: 14, padding: 8 },
  resetText: { fontSize: 12, color: '#78909C', textDecorationLine: 'underline' },
});
