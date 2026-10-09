import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, C, fmtDate, fmtTime } from '@/components/kit';
import PatrolHeader from '@/components/patrol/patrol-header';
import { OBSERVATION_TYPES, addManualWaypoint, dms, parseCoordinates, useActivePatrol } from '@/utils/patrol';

export default function AddWaypoint() {
  const active = useActivePatrol();
  const last = active?.waypoints.filter((w) => w.type === 'AUTOMATIC').slice(-1)[0] ?? active?.route.startPoint;
  const [type, setType] = useState(OBSERVATION_TYPES[0]);
  const [picking, setPicking] = useState(false);
  const [description, setDescription] = useState('');
  // Default to the last GPS position; derived (not copied into state) because the active patrol
  // may still be loading from the device when this screen first renders.
  const [locationEdit, setLocation] = useState<string | undefined>();
  const location = locationEdit ?? (last ? `${dms(last.latitude, 'lat')}  ${dms(last.longitude, 'lon')}` : '');
  const [when, setWhen] = useState(`${fmtDate(new Date())} ${fmtTime(new Date())}`);
  const [errors, setErrors] = useState<{ description?: string; location?: string; when?: string }>({});

  if (!active || active.status !== 'IN_PROGRESS') {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <PatrolHeader title="Add Manual Waypoint" onBack={() => router.replace('/patrol')} />
        <Text style={s.none}>Start a patrol before adding waypoints.</Text>
      </SafeAreaView>
    );
  }

  const save = () => {
    const next: typeof errors = {};
    if (!description.trim()) next.description = 'Describe what you saw.';
    const coords = parseCoordinates(location);
    if (!coords) next.location = 'Enter coordinates like 6.3748, 81.5262 or 01°24\'16" S 036°45\'20" E.';
    const time = new Date(when);
    if (Number.isNaN(time.getTime())) next.when = 'Enter a date and time, for example "20 Aug 2025 11:32".';
    setErrors(next);
    if (Object.keys(next).length || !coords) return;
    addManualWaypoint({ category: type, description, latitude: coords.latitude, longitude: coords.longitude, time });
    router.back();
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <PatrolHeader title="Add Manual Waypoint" subtitle="Record important signs, observations or locations." onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.card}>
            <FieldRow icon="map-pin" label="Type *">
              <TouchableOpacity style={s.select} onPress={() => setPicking((p) => !p)}>
                <Text style={s.selectText}>{type}</Text>
                <Feather name={picking ? 'chevron-up' : 'chevron-down'} size={18} color="#555" />
              </TouchableOpacity>
              {picking ? (
                <View style={s.options}>
                  {OBSERVATION_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[s.option, t === type && s.optionOn]}
                      onPress={() => {
                        setType(t);
                        setPicking(false);
                      }}>
                      <Text style={[s.optionText, t === type && { color: C.green, fontWeight: '800' }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </FieldRow>

            <FieldRow icon="file-text" label="Description *">
              <TextInput
                style={[s.input, { minHeight: 84 }, errors.description ? s.inputErr : null]}
                value={description}
                onChangeText={(t) => setDescription(t.slice(0, 250))}
                placeholder="Elephant tracks near river (GPS unavailable)"
                placeholderTextColor="#AAA"
                multiline
                textAlignVertical="top"
              />
              <Text style={s.counter}>{description.length}/250</Text>
              {errors.description ? <Text style={s.error}>{errors.description}</Text> : null}
            </FieldRow>

            <FieldRow icon="crosshair" label="Location (manual) *">
              <TextInput style={[s.input, errors.location ? s.inputErr : null]} value={location} onChangeText={setLocation} autoCapitalize="characters" />
              {errors.location ? <Text style={s.error}>{errors.location}</Text> : <Text style={s.hint}>Starts from your last GPS position. Edit it if you are elsewhere.</Text>}
            </FieldRow>

            <FieldRow icon="clock" label="Time *">
              <TextInput style={[s.input, errors.when ? s.inputErr : null]} value={when} onChangeText={setWhen} />
              {errors.when ? <Text style={s.error}>{errors.when}</Text> : null}
            </FieldRow>

            <Button label="Save Waypoint" icon="save" onPress={save} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldRow({ icon, label, children }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; children: React.ReactNode }) {
  return (
    <View style={s.row}>
      <View style={s.rowIcon}>
        <Feather name={icon} size={20} color="#FFF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{label}</Text>
        {children}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EEF4EC' },
  content: { padding: 14, paddingBottom: 24 },
  none: { textAlign: 'center', color: C.muted, marginTop: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 12, gap: 14, borderWidth: 1, borderColor: C.line },
  row: { flexDirection: 'row', gap: 10 },
  rowIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  label: { fontSize: 12, fontWeight: '800', color: C.text, marginBottom: 5 },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#D0D5D0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#FAFAFA' },
  selectText: { fontSize: 14, color: C.text },
  options: { borderWidth: 1, borderColor: '#D0D5D0', borderRadius: 8, marginTop: 4, backgroundColor: '#FFF', overflow: 'hidden' },
  option: { paddingVertical: 11, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
  optionOn: { backgroundColor: '#EAF5EC' },
  optionText: { fontSize: 14, color: C.text },
  input: { borderWidth: 1, borderColor: '#D0D5D0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text, backgroundColor: '#FAFAFA' },
  inputErr: { borderColor: C.red },
  counter: { fontSize: 10, color: '#999', textAlign: 'right', marginTop: 2 },
  error: { fontSize: 11, color: C.red, marginTop: 4 },
  hint: { fontSize: 10, color: C.muted, marginTop: 4 },
});
