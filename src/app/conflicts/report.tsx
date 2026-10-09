import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, C, Field, SectionLabel, TopBar } from '@/components/kit';
import { REPORT_TYPES, submitReport } from '@/utils/conflicts';
import { errorMessage } from '@/utils/http';

interface Place {
  name: string;
  latitude: number;
  longitude: number;
}

// Villages around the park, for people who cannot (or would rather not) share their GPS position
const PLACES: Place[] = [
  { name: 'Kataragama paddy fields', latitude: 6.3915, longitude: 81.5528 },
  { name: 'Tissa road', latitude: 6.3655, longitude: 81.5105 },
  { name: 'Palatupana village', latitude: 6.3312, longitude: 81.4911 },
];

/** A villager reports a sighting. A liaison officer verifies it before any alert is sent. */
export default function ReportSighting() {
  const [type, setType] = useState<string>(REPORT_TYPES[0].value);
  const [description, setDescription] = useState('');
  const [place, setPlace] = useState<Place | null>(null);
  const [errors, setErrors] = useState<{ place?: string; description?: string }>({});
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const useMyLocation = async () => {
    setFailure('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setFailure('Location permission was denied. Choose a nearby place instead.');
        return;
      }
      const here = await Location.getCurrentPositionAsync({});
      setPlace({ name: 'My current location', latitude: here.coords.latitude, longitude: here.coords.longitude });
      setErrors((e) => ({ ...e, place: undefined }));
    } catch {
      setFailure('Could not read your GPS position. Choose a nearby place instead.');
    }
  };

  const submit = async () => {
    const next: typeof errors = {};
    if (!place) next.place = 'Choose where you saw the animal.';
    if (description.trim().length < 5) next.description = 'Add a short description of what you saw.';
    setErrors(next);
    setFailure('');
    if (Object.keys(next).length || !place) return;

    setBusy(true);
    try {
      await submitReport({
        reportType: type,
        description: description.trim(),
        latitude: place.latitude,
        longitude: place.longitude,
        locationName: place.name,
      });
      setSent(true);
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <TopBar title="Report sent" onBack={() => router.replace('/')} />
        <View style={s.done}>
          <View style={s.doneIcon}>
            <Feather name="check" size={40} color="#FFF" />
          </View>
          <Text style={s.doneTitle}>Thank you!</Text>
          <Text style={s.doneText}>A Community Liaison Officer will verify your report. Rangers are alerted as soon as it is confirmed.</Text>
          <View style={{ alignSelf: 'stretch', marginTop: 24 }}>
            <Button label="Back to my reports" onPress={() => router.replace('/')} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <TopBar title="Report a sighting" subtitle="Human-wildlife conflict" />
      {failure ? <Banner tone="red" text={failure} /> : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <SectionLabel>What happened?</SectionLabel>
          <View style={s.chips}>
            {REPORT_TYPES.map((t) => (
              <TouchableOpacity key={t.value} style={[s.chip, type === t.value && s.chipOn]} onPress={() => setType(t.value)}>
                <Text style={[s.chipText, type === t.value && s.chipTextOn]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <SectionLabel>Where?</SectionLabel>
          <View style={s.chips}>
            {PLACES.map((p) => (
              <TouchableOpacity
                key={p.name}
                style={[s.chip, place?.name === p.name && s.chipOn]}
                onPress={() => {
                  setPlace(p);
                  setErrors((e) => ({ ...e, place: undefined }));
                }}>
                <Text style={[s.chipText, place?.name === p.name && s.chipTextOn]}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Button
            label={place?.name === 'My current location' ? 'Using your GPS location' : 'Use my current location'}
            icon="crosshair"
            tone="outline"
            small
            onPress={useMyLocation}
          />
          {errors.place ? <Text style={s.error}>{errors.place}</Text> : null}

          <View style={{ height: 16 }} />
          <Field
            label="Details"
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="How many animals, what are they doing, any damage so far?"
            error={errors.description}
          />
          <Button label="Send report" icon="send" onPress={submit} loading={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#CFD8DC' },
  chipOn: { backgroundColor: C.green, borderColor: C.green },
  chipText: { fontSize: 13, color: '#455A64', fontWeight: '600' },
  chipTextOn: { color: '#FFF' },
  error: { color: C.red, fontSize: 12, marginTop: 6 },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  doneIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  doneTitle: { fontSize: 21, fontWeight: 'bold', color: C.text },
  doneText: { fontSize: 14, color: '#607D8B', textAlign: 'center', marginTop: 10, lineHeight: 21 },
});
