import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, BG, BottomNav, Card, GREEN, InfoRow, MockMap, RED, RiskPill, StatusPill, icon } from '@/components/conflicts/parts';
import { acknowledgeCase, fmtDateTime, useCase } from '@/utils/conflict/store';

export default function AlertDetails() {
  const [c, setCase] = useCase();
  if (!c) return <SafeAreaView style={styles.container} />;

  const acknowledged = c.status !== 'NEW';
  const inProgress = c.status === 'IN_PROGRESS';
  const closed = c.status === 'RESOLVED' || c.status === 'FALSE_ALERT' || c.status === 'CANCELLED';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => router.replace('/conflicts')}>
          <Feather name="arrow-left" size={14} color="#444" />
          <Text style={styles.backText}>Back to Alerts</Text>
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <Text style={styles.title}>ALERT DETAILS</Text>
          <StatusPill status={c.status} labelled />
        </View>

        <Card>
          <View style={styles.banner}>
            <View style={styles.bannerIcon}>
              <Feather name="alert-triangle" size={18} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>WILDLIFE CONFLICT ALERT</Text>
              <Text style={styles.bannerSub}>A tracked elephant has entered a high-risk zone.</Text>
            </View>
          </View>
          <InfoRow icon={icon.paw} label="Animal ID">{c.animalId}</InfoRow>
          <InfoRow icon={icon.zone} label="Risk Zone">
            <Text style={[styles.value, { color: RED }]}>{c.riskZone}</Text>
          </InfoRow>
          <InfoRow icon={icon.zone} label="Location">{c.location}</InfoRow>
          <InfoRow icon={icon.clock} label="Alert Time">{fmtDateTime(c.alertTime)}</InfoRow>
          <InfoRow icon={icon.level} label="Risk Level">
            <RiskPill level={c.riskLevel} />
          </InfoRow>
          <InfoRow icon={icon.radio} label="Detected By">{c.detectedBy}</InfoRow>
          <InfoRow icon={icon.info} label="Description">{c.description}</InfoRow>
        </Card>

        <Card title="LOCATION MAP">
          <MockMap height={130} />
        </Card>

        <Card title="RECIPIENT">
          <View style={styles.recipient}>
            <View style={styles.recipientIcon}>
              <Feather name="user" size={16} color="#444" />
            </View>
            <View>
              <Text style={styles.recipientLabel}>Assigned To</Text>
              <Text style={styles.recipientName}>{c.assignedTo}</Text>
            </View>
          </View>
        </Card>

        {closed ? (
          <View style={styles.closedBox}>
            <Feather name="check-circle" size={18} color={GREEN} />
            <Text style={styles.closedText}>This alert was closed. Open the Dashboard to reset the demo.</Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <View style={[styles.actionBox, { borderColor: '#F1D9A4', backgroundColor: '#FFFBF1' }]}>
              <View style={styles.actionHead}>
                <View style={[styles.actionIcon, { backgroundColor: '#FFF3D6' }]}>
                  <Feather name="check-circle" size={16} color="#B7791F" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>ACKNOWLEDGE ALERT</Text>
                  <Text style={styles.actionSub}>Acknowledge that you have received the alert</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: acknowledged ? '#BDBDBD' : '#B7791F' }]}
                disabled={acknowledged}
                onPress={async () => setCase(await acknowledgeCase())}>
                <Text style={styles.btnText}>{acknowledged ? 'ACKNOWLEDGED' : 'ACKNOWLEDGE'}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.actionBox, { borderColor: '#BFDDC4', backgroundColor: '#F4FBF5' }]}>
              <View style={styles.actionHead}>
                <View style={[styles.actionIcon, { backgroundColor: '#DDF0E0' }]}>
                  <Feather name="map-pin" size={16} color={GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>START RESPONSE</Text>
                  <Text style={styles.actionSub}>Respond to this alert and update your status</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: acknowledged ? GREEN : '#BDBDBD' }]}
                disabled={!acknowledged}
                onPress={() => router.push(inProgress ? '/conflicts/close' : '/conflicts/respond')}>
                <Text style={styles.btnText}>{inProgress ? 'REVIEW & CLOSE  ›' : 'START RESPONSE  ›'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      <BottomNav active="alerts" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 14, paddingBottom: 24 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  backText: { fontSize: 12, color: '#444' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 19, fontWeight: '800', color: GREEN },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FDECEA', borderRadius: 8, padding: 10, marginBottom: 6 },
  bannerIcon: { width: 32, height: 32, borderRadius: 6, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontSize: 12, fontWeight: '800', color: RED },
  bannerSub: { fontSize: 11, color: '#555', marginTop: 1 },
  value: { fontSize: 12, fontWeight: '700' },
  recipient: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recipientIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ECEFF1', alignItems: 'center', justifyContent: 'center' },
  recipientLabel: { fontSize: 10, color: '#777' },
  recipientName: { fontSize: 13, fontWeight: '700', color: '#222' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBox: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 10, justifyContent: 'space-between', gap: 10 },
  actionHead: { flexDirection: 'row', gap: 8 },
  actionIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 10, fontWeight: '800', color: '#333' },
  actionSub: { fontSize: 9, color: '#666', marginTop: 2 },
  btn: { borderRadius: 7, paddingVertical: 10, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  closedBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#E8F5E9', borderRadius: 10, padding: 14 },
  closedText: { flex: 1, fontSize: 12, color: GREEN },
});
