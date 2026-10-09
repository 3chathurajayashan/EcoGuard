import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Button, C, Field } from '@/components/kit';
import { ROLE_SHORT, type Role } from '@/utils/roles';
import { useSession } from '@/utils/session';

// Accounts created by the backend seed script (npm run seed). Shown so every role is one tap away.
const DEMO: { role: Role; email: string }[] = [
  { role: 'RANGER', email: 'ranger@ecoguard.lk' },
  { role: 'COMMUNITY_LIAISON_OFFICER', email: 'liaison@ecoguard.lk' },
  { role: 'PARK_MANAGER', email: 'manager@ecoguard.lk' },
  { role: 'CONSERVATION_RESEARCHER', email: 'researcher@ecoguard.lk' },
  { role: 'VILLAGER', email: 'villager@ecoguard.lk' },
];
const DEMO_PASSWORD = 'Eco@12345';

export default function LoginScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = async (e = email, p = password) => {
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(e.trim())) next.email = 'Enter a valid email address.';
    if (!p) next.password = 'Enter your password.';
    setErrors(next);
    setError('');
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await signIn(e, p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.root}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&q=80&w=1200' }}
        style={s.hero}
      />
      <View style={s.heroShade} />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={s.brand}>
              <View style={s.logo}>
                <Ionicons name="paw" size={28} color="#FFF" />
              </View>
              <View>
                <Text style={s.brandName}>EcoGuard</Text>
                <Text style={s.brandTag}>Wildlife Conservation</Text>
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.title}>Welcome back</Text>
              <Text style={s.sub}>Sign in to continue protecting wildlife.</Text>
              {error ? <Banner tone="red" text={error} /> : null}
              <View style={{ height: 12 }} />
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@example.com"
                error={errors.email}
              />
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Your password"
                error={errors.password}
                onSubmitEditing={() => submit()}
              />
              <Button label="Sign in" onPress={() => submit()} loading={busy} />
              <View style={s.switchRow}>
                <Text style={s.switchText}>New to EcoGuard? </Text>
                <Link href="/signup" style={s.link}>
                  Create an account
                </Link>
              </View>
            </View>

            <View style={s.demo}>
              <Text style={s.demoTitle}>Demo accounts (password {DEMO_PASSWORD})</Text>
              <View style={s.chips}>
                {DEMO.map((d) => (
                  <TouchableOpacity
                    key={d.email}
                    style={s.chip}
                    onPress={() => {
                      setEmail(d.email);
                      setPassword(DEMO_PASSWORD);
                      submit(d.email, DEMO_PASSWORD);
                    }}>
                    <Text style={s.chipText}>{ROLE_SHORT[d.role]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.greenDark },
  hero: { ...StyleSheet.absoluteFill, width: '100%', height: 340, opacity: 0.9 },
  heroShade: { ...StyleSheet.absoluteFill, height: 340, backgroundColor: 'rgba(20,60,34,0.55)' },
  scroll: { padding: 20, paddingBottom: 40, maxWidth: 520, width: '100%', alignSelf: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, marginBottom: 54 },
  logo: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  brandName: { color: '#FFF', fontSize: 26, fontWeight: '800' },
  brandTag: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  title: { fontSize: 22, fontWeight: '800', color: C.text },
  sub: { fontSize: 13, color: C.muted, marginTop: 4, marginBottom: 14 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  switchText: { color: C.muted, fontSize: 13 },
  link: { color: C.green, fontWeight: '800', fontSize: 13 },
  demo: { marginTop: 22, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 14 },
  demoTitle: { color: '#FFF', fontSize: 12, fontWeight: '700', marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  chipText: { color: C.green, fontWeight: '700', fontSize: 12 },
});
