import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

export const C = {
  green: '#1E5631',
  greenDark: '#143C22',
  greenSoft: '#E3EFE5',
  bg: '#F4F7F4',
  card: '#FFFFFF',
  line: '#E3E8E3',
  text: '#222222',
  muted: '#6B7B70',
  red: '#C62828',
  redSoft: '#FDECEA',
  orange: '#E65100',
  orangeSoft: '#FFF3E0',
  blue: '#1565C0',
  blueSoft: '#E3F2FD',
  greenText: '#2E7D32',
  greenBadge: '#E8F5E9',
  gray: '#546E7A',
  graySoft: '#ECEFF1',
};

export type Tone = 'red' | 'orange' | 'green' | 'blue' | 'gray';
const TONES: Record<Tone, { bg: string; fg: string }> = {
  red: { bg: C.redSoft, fg: C.red },
  orange: { bg: C.orangeSoft, fg: C.orange },
  green: { bg: C.greenBadge, fg: C.greenText },
  blue: { bg: C.blueSoft, fg: C.blue },
  gray: { bg: C.graySoft, fg: C.gray },
};

type IconName = React.ComponentProps<typeof Feather>['name'];

export function Button({
  label,
  onPress,
  tone = 'primary',
  icon,
  loading,
  disabled,
  small,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'outline' | 'danger' | 'warning' | 'soft';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
}) {
  const p = {
    primary: { bg: C.green, fg: '#FFF', border: C.green },
    outline: { bg: '#FFF', fg: C.green, border: C.green },
    danger: { bg: C.red, fg: '#FFF', border: C.red },
    warning: { bg: '#B7791F', fg: '#FFF', border: '#B7791F' },
    soft: { bg: C.greenSoft, fg: C.green, border: C.greenSoft },
  }[tone];
  const off = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={off}
      activeOpacity={0.85}
      style={[
        s.btn,
        { backgroundColor: p.bg, borderColor: p.border, paddingVertical: small ? 9 : 14 },
        off && { opacity: 0.55 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <>
          {icon ? <Feather name={icon} size={small ? 14 : 17} color={p.fg} style={{ marginRight: 8 }} /> : null}
          <Text style={[s.btnText, { color: p.fg, fontSize: small ? 13 : 15 }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function Field({
  label,
  error,
  hint,
  ...input
}: TextInputProps & { label: string; error?: string; hint?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#A9B5AD"
        {...input}
        style={[s.input, input.multiline && { minHeight: 90, textAlignVertical: 'top' }, error ? { borderColor: C.red } : null, input.style]}
      />
      {error ? <Text style={s.error}>{error}</Text> : hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Pill({ label, tone = 'gray' }: { label: string; tone?: Tone }) {
  const t = TONES[tone];
  return (
    <View style={[s.pill, { backgroundColor: t.bg }]}>
      <Text style={[s.pillText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function Banner({
  tone,
  text,
  action,
}: {
  tone: Tone;
  text: string;
  action?: { label: string; onPress: () => void };
}) {
  const t = TONES[tone];
  return (
    <View style={[s.banner, { backgroundColor: t.bg }]}>
      <Text style={[s.bannerText, { color: t.fg }]}>{text}</Text>
      {action ? (
        <TouchableOpacity onPress={action.onPress} style={[s.bannerBtn, { backgroundColor: t.fg }]}>
          <Text style={s.bannerBtnText}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={s.sectionLabel}>{children}</Text>;
}

export function Loading({ text }: { text?: string }) {
  return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={C.green} />
      {text ? <Text style={[s.hint, { marginTop: 10 }]}>{text}</Text> : null}
    </View>
  );
}

export function Empty({ icon, text, action }: { icon: IconName; text: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={s.center}>
      <Feather name={icon} size={38} color="#B0BEC5" />
      <Text style={s.emptyText}>{text}</Text>
      {action ? (
        <View style={{ marginTop: 14 }}>
          <Button label={action.label} onPress={action.onPress} small tone="outline" />
        </View>
      ) : null}
    </View>
  );
}

/** Top bar for stack screens: back arrow, title and an optional right-hand slot. */
export function TopBar({
  title,
  subtitle,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <View style={s.topBar}>
      <TouchableOpacity
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
        style={{ padding: 6 }}
        accessibilityLabel="Go back">
        <Feather name="arrow-left" size={22} color={C.green} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={s.topTitle}>{title}</Text>
        {subtitle ? <Text style={s.topSub}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Avatar({ name, size = 36, color = C.green }: { name: string; size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: size * 0.42 }}>{name.trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export const timeAgo = (iso: string | Date) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} d ago`;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');
export const fmtDate = (iso: string | Date) => {
  const d = new Date(iso);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
export const fmtTime = (iso: string | Date) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const fmtDateTime = (iso: string | Date) => `${fmtDate(iso)}, ${fmtTime(iso)}`;

const s = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5 },
  btnText: { fontWeight: 'bold' },
  label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 6 },
  input: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#D5DDD7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text },
  error: { color: C.red, fontSize: 12, marginTop: 5 },
  hint: { color: C.muted, fontSize: 12, marginTop: 5 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.line },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  pillText: { fontSize: 11, fontWeight: 'bold' },
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  bannerText: { flex: 1, fontSize: 13, fontWeight: '600' },
  bannerBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  bannerBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: 6 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, paddingHorizontal: 24 },
  emptyText: { color: C.muted, fontSize: 14, textAlign: 'center', marginTop: 10 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: C.line },
  topTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  topSub: { fontSize: 12, color: C.muted, marginTop: 1 },
});
