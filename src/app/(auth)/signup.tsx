import { Link } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, C, Field, TopBar } from '@/components/kit';
import { ROLE_LABEL, type Role } from '@/utils/roles';
import { useSession } from '@/utils/session';

const ROLES: Role[] = ['VILLAGER', 'RANGER', 'COMMUNITY_LIAISON_OFFICER', 'PARK_MANAGER', 'CONSERVATION_RESEARCHER'];

export default function SignUpScreen() {
  const { signUp } = useSession();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', password: '', confirm: '' });
  const [role, setRole] = useState<Role>('VILLAGER');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = 'Required.';
    if (!form.lastName.trim()) next.lastName = 'Required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (form.password.length < 6) next.password = 'Use at least 6 characters.';
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match.';
    setErrors(next);
    setError('');
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await signUp({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email,
        phoneNumber: form.phoneNumber.trim() || undefined,
        password: form.password,
        role,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <TopBar title="Create account" subtitle="Join the EcoGuard conservation team" />
      {error ? <Banner tone="red" text={error} /> : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Field label="First name" value={form.firstName} onChangeText={set('firstName')} error={errors.firstName} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Last name" value={form.lastName} onChangeText={set('lastName')} error={errors.lastName} />
            </View>
          </View>
          <Field
            label="Email"
            value={form.email}
            onChangeText={set('email')}
            autoCapitalize="none"
            keyboardType="email-address"
            error={errors.email}
          />
          <Field label="Phone (optional)" value={form.phoneNumber} onChangeText={set('phoneNumber')} keyboardType="phone-pad" />
          <Field label="Password" value={form.password} onChangeText={set('password')} secureTextEntry error={errors.password} />
          <Field label="Confirm password" value={form.confirm} onChangeText={set('confirm')} secureTextEntry error={errors.confirm} />

          <Text style={s.label}>I am a</Text>
          <View style={s.roles}>
            {ROLES.map((r) => (
              <TouchableOpacity key={r} style={[s.role, role === r && s.roleOn]} onPress={() => setRole(r)}>
                <Text style={[s.roleText, role === r && s.roleTextOn]}>{ROLE_LABEL[r]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button label="Create account" onPress={submit} loading={busy} />
          <View style={s.switchRow}>
            <Text style={s.switchText}>Already have an account? </Text>
            <Link href="/login" style={s.link}>
              Sign in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 40, maxWidth: 560, width: '100%', alignSelf: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  role: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: '#CFD8D2', backgroundColor: '#FFF' },
  roleOn: { backgroundColor: C.green, borderColor: C.green },
  roleText: { fontSize: 13, color: C.gray, fontWeight: '600' },
  roleTextOn: { color: '#FFF' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  switchText: { color: C.muted, fontSize: 13 },
  link: { color: C.green, fontWeight: '800', fontSize: 13 },
});
