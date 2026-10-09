import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, BG, BottomNav, Card, GREEN, InfoRow, MockMap, RED, RiskPill, StatusPill, icon } from '@/components/conflicts/parts';
import { fmtDateTime, SAMPLE_PHOTOS, saveResponse, useCase } from '@/utils/conflict/store';

export default function OnSiteResponse() {
  const [c] = useCase();
  const [situation, setSituation] = useState('');
  const [action, setAction] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ situation?: string; action?: string }>({});

  if (!c) return <SafeAreaView style={styles.container} />;

  const pickPhotos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.7 });
      if (!result.canceled) setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    } catch {
      // picker not available on this device; the sample photos link still works
    }
  };

  const save = async () => {
    const next: typeof errors = {};
    if (!situation.trim()) next.situation = 'Describe the situation you observed on site.';
    if (!action.trim()) next.action = 'Record the action you took to manage the conflict.';
    setErrors(next);
    if (Object.keys(next).length) return;
    await saveResponse({ situation: situation.trim(), action: action.trim(), notes: notes.trim(), photos });
    router.replace('/conflicts/close');
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

          <View style={styles.titleRow}>
            <Text style={styles.title}>RANGER ON-SITE RESPONSE</Text>
            <StatusPill status={c.status === 'NEW' ? 'NEW' : 'ACKNOWLEDGED'} labelled />
          </View>

          <Card title="ALERT SUMMARY">
            <InfoRow icon={icon.paw} label="Animal ID">{c.animalId}</InfoRow>
            <InfoRow icon={icon.zone} label="Risk Zone">
              <Text style={[styles.value, { color: RED }]}>{c.riskZone}</Text>
            </InfoRow>
            <InfoRow icon={icon.clock} label="Alert Time">{fmtDateTime(c.alertTime)}</InfoRow>
            <InfoRow icon={icon.level} label="Risk Level">
              <RiskPill level={c.riskLevel} />
            </InfoRow>
          </Card>

          <Card title="LOCATION MAP">
            <MockMap height={140} withRanger />
          </Card>

          <Card title="FIELD ASSESSMENT & RESPONSE">
            <Field
              label="1. Situation Assessment *"
              hint="Describe the situation observed on site."
              placeholder="Enter your observations..."
              value={situation}
              onChange={setSituation}
              max={500}
              error={errors.situation}
            />
            <Field
              label="2. Action Taken *"
              hint="Record the action taken to manage the conflict."
              placeholder="Enter actions taken..."
              value={action}
              onChange={setAction}
              max={500}
              error={errors.action}
            />
            <Field
              label="3. Additional Notes (Optional)"
              hint="Any other relevant information."
              placeholder="Enter notes..."
              value={notes}
              onChange={setNotes}
              max={300}
            />

            <Text style={styles.label}>Add Photo / Evidence (Optional)</Text>
            <TouchableOpacity style={styles.upload} onPress={pickPhotos} activeOpacity={0.8}>
              <Feather name="image" size={20} color="#666" />
              <View>
                <Text style={styles.uploadTitle}>Tap to upload or drag and drop</Text>
                <Text style={styles.uploadSub}>JPG, PNG (Max 5MB each)</Text>
              </View>
            </TouchableOpacity>
            {photos.length ? (
              <View style={styles.thumbs}>
                {photos.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.thumb} />
                ))}
              </View>
            ) : null}
            <TouchableOpacity onPress={() => setPhotos(SAMPLE_PHOTOS)} style={{ alignSelf: 'flex-start', paddingVertical: 6 }}>
              <Text style={styles.sampleLink}>Use sample photos (demo)</Text>
            </TouchableOpacity>
          </Card>

          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveText}>SAVE RESPONSE</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNav active="alerts" />
    </SafeAreaView>
  );
}

function Field({
  label,
  hint,
  placeholder,
  value,
  onChange,
  max,
  error,
}: {
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  error?: string;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.hint}>{hint}</Text>
      <TextInput
        style={[styles.input, error ? { borderColor: RED } : null]}
        value={value}
        onChangeText={(t) => onChange(t.slice(0, max))}
        placeholder={placeholder}
        placeholderTextColor="#AAA"
        multiline
        textAlignVertical="top"
      />
      <View style={styles.fieldFoot}>
        <Text style={styles.error}>{error ?? ''}</Text>
        <Text style={styles.counter}>
          {value.length}/{max}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 14, paddingBottom: 24 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  backText: { fontSize: 12, color: '#444' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '800', color: GREEN },
  value: { fontSize: 12, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '700', color: '#222' },
  hint: { fontSize: 10, color: '#888', marginBottom: 5 },
  input: { minHeight: 56, borderWidth: 1, borderColor: '#D0D5D0', borderRadius: 6, padding: 8, fontSize: 12, color: '#222', backgroundColor: '#FFF' },
  fieldFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  error: { fontSize: 10, color: RED, flex: 1 },
  counter: { fontSize: 10, color: '#999' },
  upload: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: '#BDBDBD', borderRadius: 8, paddingVertical: 14, marginTop: 4 },
  uploadTitle: { fontSize: 11, color: '#444', fontWeight: '600' },
  uploadSub: { fontSize: 9, color: '#999' },
  thumbs: { flexDirection: 'row', gap: 6, marginTop: 8 },
  thumb: { width: 70, height: 52, borderRadius: 6, backgroundColor: '#DDD' },
  sampleLink: { fontSize: 11, color: '#78909C', textDecorationLine: 'underline' },
  saveBtn: { backgroundColor: GREEN, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  saveText: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
});
