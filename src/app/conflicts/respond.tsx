import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ConflictMap from '@/components/conflicts/conflict-map';
import { AppHeader, BG, BottomNav, Card, GREEN, InfoRow, RED, RiskPill, StatusPill, icon } from '@/components/conflicts/parts';
import { Banner, Button, Loading, fmtDateTime } from '@/components/kit';
import { fetchAlert, fetchCollars, fetchZones, saveResponse, type Collar, type ConflictCase, type RiskZone } from '@/utils/conflicts';
import { errorMessage } from '@/utils/http';
import { useLoad } from '@/utils/use-load';

const SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&q=60&w=400',
  'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&q=60&w=400',
  'https://images.unsplash.com/photo-1581852017103-68ac65514cf7?auto=format&fit=crop&q=60&w=400',
];

/** The ranger's own position for the map. Falls back to a point near the alert when GPS is unavailable. */
function useMyPosition(alert?: ConflictCase) {
  const [pos, setPos] = useState<{ latitude: number; longitude: number } | null>(null);
  useEffect(() => {
    if (!alert) return;
    let active = true;
    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status === 'granted') {
          const here = await Location.getCurrentPositionAsync({});
          if (active) return setPos({ latitude: here.coords.latitude, longitude: here.coords.longitude });
        }
      } catch {
        // fall through to the approximate position
      }
      if (active) setPos({ latitude: alert.latitude - 0.004, longitude: alert.longitude - 0.005 });
    })();
    return () => {
      active = false;
    };
  }, [alert]);
  return pos;
}

export default function OnSiteResponse() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error } = useLoad<{ alert: ConflictCase; zones: RiskZone[]; collars: Collar[] }>(async () => {
    const [alert, zones, collars] = await Promise.all([
      fetchAlert(String(id)),
      fetchZones().catch(() => [] as RiskZone[]),
      fetchCollars().catch(() => [] as Collar[]),
    ]);
    return { alert, zones, collars };
  });
  const position = useMyPosition(data?.alert);

  const [situation, setSituation] = useState('');
  const [action, setAction] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ situation?: string; action?: string }>({});
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader />
        <Loading />
        <BottomNav active="alerts" />
      </SafeAreaView>
    );
  }
  if (!data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader />
        <Banner tone="red" text={error || 'Alert not found.'} />
        <BottomNav active="alerts" />
      </SafeAreaView>
    );
  }
  const c = data.alert;

  const pickPhotos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.7 });
      if (!result.canceled) setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5));
    } catch {
      // the picker is not available here; the sample photos link still works
    }
  };

  const save = async () => {
    const next: typeof errors = {};
    if (!situation.trim()) next.situation = 'Describe the situation you observed on site.';
    if (!action.trim()) next.action = 'Record the action you took to manage the conflict.';
    setErrors(next);
    setFailure('');
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const result = await saveResponse({
        alertId: c.id,
        situation: situation.trim(),
        action: action.trim(),
        notes: notes.trim(),
        photos,
        fieldLocation: c.riskZone,
      });
      if (result.synced) router.replace(`/conflicts/close?id=${c.id}` as any);
      else setSavedOffline(true);
    } catch (e) {
      // E3: the device could not store it, so the officer must re-enter it before leaving
      setFailure(
        e instanceof Error && e.message === 'LOCAL_STORAGE_FAILURE'
          ? 'Your response could not be saved on this device. Please re-enter it before leaving this screen.'
          : errorMessage(e),
      );
    } finally {
      setBusy(false);
    }
  };

  if (savedOffline) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader />
        <View style={styles.done}>
          <View style={styles.doneIcon}>
            <Feather name="wifi-off" size={36} color="#FFF" />
          </View>
          <Text style={styles.doneTitle}>Saved on this device</Text>
          <Text style={styles.doneText}>
            You are offline. The response is marked &quot;Pending Sync&quot; and will be sent to the central system automatically when the connection returns.
          </Text>
          <View style={{ alignSelf: 'stretch', marginTop: 22 }}>
            <Button label="Back to dashboard" onPress={() => router.replace('/conflicts')} />
          </View>
        </View>
        <BottomNav active="alerts" />
      </SafeAreaView>
    );
  }

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

          <View style={styles.titleRow}>
            <Text style={styles.title}>RANGER ON-SITE RESPONSE</Text>
            <StatusPill status="ACKNOWLEDGED" labelled />
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
            <ConflictMap height={150} zones={data.zones} collars={data.collars} alert={c} focusAlert ranger={position} legend={false} />
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
                <Text style={styles.uploadSub}>JPG, PNG (Max 5 photos)</Text>
              </View>
            </TouchableOpacity>
            {photos.length ? (
              <View style={styles.thumbs}>
                {photos.map((uri, i) => (
                  <View key={`${uri}-${i}`}>
                    <Image source={{ uri }} style={styles.thumb} />
                    <TouchableOpacity style={styles.remove} onPress={() => setPhotos((p) => p.filter((_, j) => j !== i))}>
                      <Text style={styles.removeText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}
            <TouchableOpacity onPress={() => setPhotos(SAMPLE_PHOTOS)} style={{ alignSelf: 'flex-start', paddingVertical: 6 }}>
              <Text style={styles.sampleLink}>Use sample photos (demo)</Text>
            </TouchableOpacity>
          </Card>

          <TouchableOpacity style={[styles.saveBtn, busy && { opacity: 0.6 }]} onPress={save} disabled={busy}>
            <Text style={styles.saveText}>{busy ? 'SAVING...' : 'SAVE RESPONSE'}</Text>
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
  thumbs: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  thumb: { width: 70, height: 52, borderRadius: 6, backgroundColor: '#DDD' },
  remove: { position: 'absolute', top: 2, right: 2, width: 15, height: 15, borderRadius: 8, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: '#FFF', fontSize: 11, lineHeight: 14, fontWeight: 'bold' },
  sampleLink: { fontSize: 11, color: '#78909C', textDecorationLine: 'underline' },
  saveBtn: { backgroundColor: GREEN, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  saveText: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  doneIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#F57F17', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  doneTitle: { fontSize: 21, fontWeight: 'bold', color: '#222' },
  doneText: { fontSize: 14, color: '#607D8B', textAlign: 'center', marginTop: 10, lineHeight: 21 },
});
