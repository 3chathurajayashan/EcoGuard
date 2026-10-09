import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, BG, BottomNav, Card, GREEN, InfoRow, RED, RiskPill, StatusPill, icon } from '@/components/conflicts/parts';
import { Banner, Button, Loading, fmtDate, fmtDateTime, fmtTime } from '@/components/kit';
import { closeAlert, fetchAlert, type ConflictCase, type FinalStatus } from '@/utils/conflicts';
import { errorMessage } from '@/utils/http';
import { useLoad } from '@/utils/use-load';

const FINAL_OPTIONS: { value: FinalStatus; label: string }[] = [
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'FALSE_ALERT', label: 'False Alert' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

/** "20 Aug 2025" + "16:00" typed by the officer -> a Date, or null if it cannot be read. */
function parseWhen(date: string, time: string): Date | null {
  const d = new Date(`${date.trim()} ${time.trim()}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function CloseAlert() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: c, loading, error } = useLoad<ConflictCase>(() => fetchAlert(String(id)));

  const [finalStatus, setFinalStatus] = useState<FinalStatus>('RESOLVED');
  const [dateEdit, setDate] = useState<string | undefined>();
  const [timeEdit, setTime] = useState<string | undefined>();
  const [remarks, setRemarks] = useState('');
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading && !c) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader />
        <Loading />
        <BottomNav active="alerts" />
      </SafeAreaView>
    );
  }
  if (!c) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader />
        <Banner tone="red" text={error || 'Alert not found.'} />
        <BottomNav active="alerts" />
      </SafeAreaView>
    );
  }

  const r = c.response;
  if (!r) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader />
        <View style={styles.missing}>
          <Feather name="info" size={32} color="#90A4AE" />
          <Text style={styles.missingText}>No response has been recorded yet. Save the on-site response first.</Text>
          <Button label="Start response" onPress={() => router.replace(`/conflicts/respond?id=${c.id}` as any)} />
        </View>
        <BottomNav active="alerts" />
      </SafeAreaView>
    );
  }

  const now = new Date();
  const date = dateEdit ?? fmtDate(now);
  const time = timeEdit ?? fmtTime(now);

  const submit = async () => {
    const when = parseWhen(date, time);
    if (!when) {
      setFailure('Enter the resolution date and time, for example "20 Aug 2025" and "16:00".');
      return;
    }
    if (when < new Date(c.alertTime)) {
      setFailure('The resolution time cannot be before the alert was raised.');
      return;
    }
    setBusy(true);
    setFailure('');
    try {
      await closeAlert(c.id, { finalStatus, resolvedAt: when, remarks: remarks.trim() });
      router.replace(`/conflicts/${c.id}` as any);
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader />
      {failure ? <Banner tone="red" text={failure} /> : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Feather name="arrow-left" size={14} color="#444" />
            <Text style={styles.backText}>Back to Alert Details</Text>
          </TouchableOpacity>

          <Text style={styles.title}>CLOSE WILDLIFE CONFLICT ALERT</Text>
          <Text style={styles.sub}>Review the response details, mark the alert as resolved and submit the report.</Text>

          <Card title="ALERT SUMMARY">
            <InfoRow icon={icon.paw} label="Animal ID">{c.animalId}</InfoRow>
            <InfoRow icon={icon.zone} label="Risk Zone">
              <Text style={[styles.value, { color: RED }]}>{c.riskZone}</Text>
            </InfoRow>
            <InfoRow icon={icon.clock} label="Alert Time">{fmtDateTime(c.alertTime)}</InfoRow>
            <InfoRow icon={icon.level} label="Risk Level">
              <RiskPill level={c.riskLevel} />
            </InfoRow>
            <InfoRow icon={icon.status} label="Current Status">
              <StatusPill status={c.status} />
            </InfoRow>
          </Card>

          <Card title="RESPONSE DETAILS">
            <InfoRow icon={icon.user} label="Recorded By">{r.recordedBy}</InfoRow>
            <InfoRow icon={icon.calendar} label="Response Time">{fmtDateTime(r.respondedAt)}</InfoRow>
            <InfoRow icon={icon.zone} label="Field Location">{r.fieldLocation || c.riskZone}</InfoRow>

            {r.situation ? <ReadOnly label="Situation Assessment" text={r.situation} max={500} /> : null}
            <ReadOnly label="Action Taken" text={r.action} max={500} />
            {r.notes ? <ReadOnly label="Additional Notes (Optional)" text={r.notes} max={300} /> : null}

            <Text style={[styles.label, { marginTop: 10 }]}>Evidence / Photos</Text>
            {r.photos.length ? (
              <View style={styles.thumbs}>
                {r.photos.map((uri, i) => (
                  <Image key={`${uri}-${i}`} source={{ uri }} style={styles.thumb} />
                ))}
              </View>
            ) : (
              <Text style={styles.none}>No photos attached.</Text>
            )}
            <TouchableOpacity style={styles.addPhotos} onPress={() => router.push(`/conflicts/respond?id=${c.id}` as any)}>
              <Feather name="plus" size={13} color={GREEN} />
              <Text style={styles.addPhotosText}>Record another response</Text>
            </TouchableOpacity>
          </Card>

          <Card title="CLOSE ALERT">
            <Text style={styles.label}>Final Status</Text>
            <View style={styles.radios}>
              {FINAL_OPTIONS.map((o) => (
                <TouchableOpacity key={o.value} style={styles.radioRow} onPress={() => setFinalStatus(o.value)}>
                  <View style={[styles.radio, finalStatus === o.value && styles.radioOn]}>
                    {finalStatus === o.value ? <View style={styles.radioDot} /> : null}
                  </View>
                  <Text style={styles.radioLabel}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 10 }]}>Resolution Time *</Text>
            <View style={styles.dateRow}>
              <TextInput style={[styles.input, { flex: 1.3 }]} value={date} onChangeText={setDate} />
              <TextInput style={[styles.input, { flex: 1 }]} value={time} onChangeText={setTime} />
            </View>

            <Text style={[styles.label, { marginTop: 10 }]}>Resolution Remarks (Optional)</Text>
            <TextInput
              style={[styles.input, { minHeight: 56 }]}
              value={remarks}
              onChangeText={(t) => setRemarks(t.slice(0, 300))}
              placeholder="Elephant has moved back to the forest. Area is safe."
              placeholderTextColor="#AAA"
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.counter}>{remarks.length}/300</Text>
          </Card>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancel} onPress={() => router.back()}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primary, { flex: 1.6 }, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
              <Feather name="check" size={14} color="#FFF" />
              <Text style={styles.primaryText}>{busy ? 'SUBMITTING...' : 'SUBMIT RESPONSE'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.foot}>Submitting will close the alert and record your response.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNav active="alerts" />
    </SafeAreaView>
  );
}

function ReadOnly({ label, text, max }: { label: string; text: string; max: number }) {
  return (
    <View style={{ marginTop: 10 }}>
      <View style={styles.roHead}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.counter}>
          {text.length}/{max}
        </Text>
      </View>
      <View style={styles.roBox}>
        <Text style={styles.roText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 14, paddingBottom: 24 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  backText: { fontSize: 12, color: '#444' },
  title: { fontSize: 17, fontWeight: '800', color: GREEN },
  sub: { fontSize: 11, color: '#666', marginTop: 3, marginBottom: 12 },
  value: { fontSize: 12, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '700', color: '#222' },
  roHead: { flexDirection: 'row', justifyContent: 'space-between' },
  roBox: { borderWidth: 1, borderColor: '#D0D5D0', borderRadius: 6, padding: 8, marginTop: 4, backgroundColor: '#FAFAFA' },
  roText: { fontSize: 11, color: '#333', lineHeight: 16 },
  counter: { fontSize: 10, color: '#999', textAlign: 'right' },
  none: { fontSize: 11, color: '#999', marginTop: 6 },
  thumbs: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  thumb: { width: 84, height: 58, borderRadius: 6, backgroundColor: '#DDD' },
  addPhotos: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9DBFA3', borderRadius: 6, paddingVertical: 8, marginTop: 8 },
  addPhotosText: { fontSize: 11, color: GREEN, fontWeight: '700' },
  radios: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginTop: 6 },
  radioRow: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8 },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#999', alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: GREEN },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  radioLabel: { fontSize: 12, color: '#333' },
  dateRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#D0D5D0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 7, fontSize: 12, color: '#222', backgroundColor: '#FFF', marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  cancel: { flex: 1, borderWidth: 1.5, borderColor: GREEN, borderRadius: 8, paddingVertical: 13, alignItems: 'center', backgroundColor: '#FFF' },
  cancelText: { color: GREEN, fontSize: 12, fontWeight: '800' },
  primary: { flexDirection: 'row', gap: 6, backgroundColor: GREEN, borderRadius: 8, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  foot: { fontSize: 10, color: '#888', textAlign: 'center', marginTop: 8 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 30 },
  missingText: { fontSize: 13, color: '#607D8B', textAlign: 'center' },
});
