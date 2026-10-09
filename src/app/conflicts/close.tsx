import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, BG, BottomNav, Card, GREEN, InfoRow, RED, RiskPill, StatusPill, icon } from '@/components/conflicts/parts';
import type { FinalStatus } from '@/utils/conflict/store';
import { closeCase, fmtDate, fmtDateTime, fmtTime, useCase } from '@/utils/conflict/store';

const FINAL_OPTIONS: { value: FinalStatus; label: string }[] = [
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'FALSE_ALERT', label: 'False Alert' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function CloseAlert() {
  const [c] = useCase();
  const [finalStatus, setFinalStatus] = useState<FinalStatus>('RESOLVED');
  const resolvedDefault = c?.response ? new Date(new Date(c.response.respondedAt).getTime() + 15 * 60_000).toISOString() : new Date().toISOString();
  const [dateEdit, setDate] = useState<string | undefined>();
  const [timeEdit, setTime] = useState<string | undefined>();
  const date = dateEdit ?? fmtDate(resolvedDefault);
  const time = timeEdit ?? fmtTime(resolvedDefault);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  if (!c) return <SafeAreaView style={styles.container} />;

  const r = c.response;
  if (!r) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader />
        <View style={styles.missing}>
          <Feather name="info" size={32} color="#90A4AE" />
          <Text style={styles.missingText}>No response has been recorded yet. Save the on-site response first.</Text>
          <TouchableOpacity style={styles.primary} onPress={() => router.replace('/conflicts/ca-1')}>
            <Text style={styles.primaryText}>BACK TO ALERT</Text>
          </TouchableOpacity>
        </View>
        <BottomNav active="alerts" />
      </SafeAreaView>
    );
  }

  const submit = async () => {
    if (!date.trim() || !time.trim()) {
      setError('Enter the resolution date and time.');
      return;
    }
    await closeCase({ finalStatus, resolvedAt: `${date.trim()} ${time.trim()}`, remarks: remarks.trim() });
    router.replace('/conflicts');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader />
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
              <StatusPill status="IN_PROGRESS" />
            </InfoRow>
          </Card>

          <Card title="RESPONSE DETAILS">
            <InfoRow icon={icon.user} label="Recorded By">{r.recordedBy}</InfoRow>
            <InfoRow icon={icon.calendar} label="Response Time">{fmtDateTime(r.respondedAt)}</InfoRow>
            <InfoRow icon={icon.zone} label="Field Location">{r.fieldLocation}</InfoRow>

            <ReadOnly label="Situation Assessment" text={r.situation} max={500} />
            <ReadOnly label="Action Taken" text={r.action} max={500} />
            {r.notes ? <ReadOnly label="Additional Notes (Optional)" text={r.notes} max={300} /> : null}

            <Text style={[styles.label, { marginTop: 10 }]}>Evidence / Photos</Text>
            <View style={styles.thumbs}>
              {r.photos.map((uri, i) => (
                <View key={i}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <View style={styles.remove}>
                    <Text style={styles.removeText}>×</Text>
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.addPhotos} onPress={() => router.push('/conflicts/respond')}>
              <Feather name="plus" size={13} color={GREEN} />
              <Text style={styles.addPhotosText}>Add More Photos</Text>
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
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </Card>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancel} onPress={() => router.back()}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primary, { flex: 1.6 }]} onPress={submit}>
              <Feather name="check" size={14} color="#FFF" />
              <Text style={styles.primaryText}>SUBMIT RESPONSE</Text>
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
  thumbs: { flexDirection: 'row', gap: 6, marginTop: 6 },
  thumb: { width: 84, height: 58, borderRadius: 6, backgroundColor: '#DDD' },
  remove: { position: 'absolute', top: 3, right: 3, width: 15, height: 15, borderRadius: 8, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: '#FFF', fontSize: 11, lineHeight: 14, fontWeight: 'bold' },
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
  error: { fontSize: 11, color: RED, marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  cancel: { flex: 1, borderWidth: 1.5, borderColor: GREEN, borderRadius: 8, paddingVertical: 13, alignItems: 'center', backgroundColor: '#FFF' },
  cancelText: { color: GREEN, fontSize: 12, fontWeight: '800' },
  primary: { flexDirection: 'row', gap: 6, backgroundColor: GREEN, borderRadius: 8, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  foot: { fontSize: 10, color: '#888', textAlign: 'center', marginTop: 8 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 30 },
  missingText: { fontSize: 13, color: '#607D8B', textAlign: 'center' },
});
