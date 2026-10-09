import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ConflictMap from '@/components/conflicts/conflict-map';
import { AppHeader, BG, BottomNav, Card, GREEN, InfoRow, RED, RiskPill, StatusPill, icon } from '@/components/conflicts/parts';
import { Banner, Loading, fmtDateTime } from '@/components/kit';
import {
  acknowledgeAlert,
  fetchAlert,
  fetchCollars,
  fetchZones,
  isClosedStatus,
  rerouteAlert,
  type Collar,
  type ConflictCase,
  type RiskZone,
} from '@/utils/conflicts';
import { errorMessage } from '@/utils/http';
import { useSession } from '@/utils/session';
import { useLoad } from '@/utils/use-load';

export default function AlertDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'green' | 'red' | 'orange'; text: string } | null>(null);

  const { data, loading, error, reload } = useLoad<{ alert: ConflictCase; zones: RiskZone[]; collars: Collar[] }>(async () => {
    const [alert, zones, collars] = await Promise.all([
      fetchAlert(String(id)),
      fetchZones().catch(() => [] as RiskZone[]),
      fetchCollars().catch(() => [] as Collar[]),
    ]);
    return { alert, zones, collars };
  });

  const run = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await fn();
      await reload();
      setNotice({ tone: 'green', text: done });
    } catch (e) {
      setNotice({ tone: 'red', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader />
        <Loading />
        <BottomNav active="alerts" />
      </SafeAreaView>
    );
  }
  if (!data || !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader />
        <Banner tone="red" text={error || 'Alert not found.'} action={{ label: 'Back', onPress: () => router.back() }} />
        <BottomNav active="alerts" />
      </SafeAreaView>
    );
  }

  const c = data.alert;
  const closed = isClosedStatus(c.status);
  const responder = user.role === 'RANGER' || user.role === 'COMMUNITY_LIAISON_OFFICER';
  const canReroute = responder || user.role === 'PARK_MANAGER';
  const isAssignedToMe = c.assignedToId === user.id;
  const iAcknowledged = c.acknowledgedById === user.id;
  // The person who took the alert responds; a liaison officer can always step in
  const canRespond = responder && (iAcknowledged || user.role === 'COMMUNITY_LIAISON_OFFICER') && c.status !== 'NEW';
  const acknowledged = c.status !== 'NEW';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader />
      {notice ? <Banner tone={notice.tone} text={notice.text} /> : null}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/conflicts'))}>
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
              <Text style={styles.bannerSub}>
                {c.source === 'GPS_COLLAR' ? 'A tracked animal has entered a high-risk zone.' : 'A community sighting was verified by a liaison officer.'}
              </Text>
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
          <ConflictMap height={140} zones={data.zones} collars={data.collars} alert={c} focusAlert />
        </Card>

        <Card title="RECIPIENT">
          <View style={styles.recipient}>
            <View style={styles.recipientIcon}>
              <Feather name="user" size={16} color="#444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recipientLabel}>Assigned To</Text>
              <Text style={styles.recipientName}>{c.assignedTo}</Text>
            </View>
            {c.acknowledgedBy ? (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.recipientLabel}>Acknowledged by</Text>
                <Text style={styles.recipientName}>{c.acknowledgedBy}</Text>
              </View>
            ) : null}
          </View>
        </Card>

        {closed ? (
          <View style={styles.closedBox}>
            <Feather name="check-circle" size={18} color={GREEN} />
            <View style={{ flex: 1 }}>
              <Text style={styles.closedTitle}>Alert closed as {c.status.replace('_', ' ').toLowerCase()}</Text>
              {c.closure?.remarks ? <Text style={styles.closedText}>{c.closure.remarks}</Text> : null}
            </View>
          </View>
        ) : responder || user.role === 'PARK_MANAGER' ? (
          <>
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
                  style={[styles.btn, { backgroundColor: acknowledged || !responder ? '#BDBDBD' : '#B7791F' }]}
                  disabled={acknowledged || !responder || busy}
                  onPress={() => run(() => acknowledgeAlert(c.id), 'Alert acknowledged. You can start the response.')}>
                  <Text style={styles.btnText}>
                    {acknowledged ? 'ACKNOWLEDGED' : isAssignedToMe || user.role === 'COMMUNITY_LIAISON_OFFICER' ? 'ACKNOWLEDGE' : 'ACCEPT ALERT'}
                  </Text>
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
                  style={[styles.btn, { backgroundColor: canRespond ? GREEN : '#BDBDBD' }]}
                  disabled={!canRespond}
                  onPress={() =>
                    router.push(
                      (c.status === 'IN_PROGRESS' ? `/conflicts/close?id=${c.id}` : `/conflicts/respond?id=${c.id}`) as any,
                    )
                  }>
                  <Text style={styles.btnText}>{c.status === 'IN_PROGRESS' ? 'REVIEW & CLOSE  ›' : 'START RESPONSE  ›'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {c.status === 'NEW' && canReroute ? (
              <TouchableOpacity
                style={styles.reroute}
                disabled={busy}
                onPress={() => run(() => rerouteAlert(c.id), 'Alert re-routed to the next available officer.')}>
                <Feather name="phone-off" size={14} color="#B7791F" />
                <Text style={styles.rerouteText}>Primary officer unreachable? Re-route this alert</Text>
              </TouchableOpacity>
            ) : null}
            {!responder ? <Text style={styles.readOnly}>Park managers can follow this alert; the assigned ranger responds to it.</Text> : null}
          </>
        ) : (
          <Text style={styles.readOnly}>Your role can view this alert but not respond to it.</Text>
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
  reroute: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#F1D9A4', backgroundColor: '#FFFBF1' },
  rerouteText: { fontSize: 12, color: '#8A5A12', fontWeight: '700' },
  readOnly: { fontSize: 12, color: '#78909C', textAlign: 'center', marginTop: 12 },
  closedBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#E8F5E9', borderRadius: 10, padding: 14 },
  closedTitle: { fontSize: 13, fontWeight: '800', color: GREEN },
  closedText: { fontSize: 12, color: '#3E6B4A', marginTop: 4 },
});
