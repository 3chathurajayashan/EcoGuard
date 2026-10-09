import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { C } from '@/components/kit';

type IconName = React.ComponentProps<typeof Feather>['name'];

/** Scrolling page body with the content width capped, as on the dashboard wireframes. */
export function Page({ title, subtitle, back, right, children }: { title: string; subtitle?: string; back?: boolean | string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
      <View style={s.inner}>
        {back ? (
          <TouchableOpacity
            style={s.back}
            onPress={() => (typeof back === 'string' ? router.replace(back as any) : router.canGoBack() ? router.back() : router.replace('/dashboard'))}>
            <Feather name="arrow-left" size={15} color={C.green} />
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>
        ) : null}
        <View style={s.head}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{title}</Text>
            {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
          </View>
          {right}
        </View>
        {children}
      </View>
    </ScrollView>
  );
}

export function Panel({ title, right, children, style }: { title?: string; right?: React.ReactNode; children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[s.panel, style]}>
      {title || right ? (
        <View style={s.panelHead}>
          <Text style={s.panelTitle}>{title}</Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** A card-style link with an icon, title, description and chevron (Analytics & Reports menu). */
export function ActionCard({ icon, title, text, onPress, tone = 'green' }: { icon: IconName; title: string; text: string; onPress: () => void; tone?: 'green' | 'red' | 'blue' | 'orange' }) {
  const colors = { green: '#2E7D32', red: C.red, blue: C.blue, orange: C.orange }[tone];
  return (
    <TouchableOpacity style={s.action} onPress={onPress} activeOpacity={0.85}>
      <View style={[s.actionIcon, { backgroundColor: `${colors}1A` }]}>
        <Feather name={icon} size={24} color={colors} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.actionTitle}>{title}</Text>
        <Text style={s.actionText}>{text}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#9AA9A0" />
    </TouchableOpacity>
  );
}

export function StatCard({ label, value, hint, tone = 'green', icon }: { label: string; value: string | number; hint?: string; tone?: 'green' | 'red' | 'blue' | 'orange'; icon?: IconName }) {
  const color = { green: '#2E7D32', red: C.red, blue: C.blue, orange: C.orange }[tone];
  return (
    <View style={s.stat}>
      {icon ? (
        <View style={[s.statIcon, { backgroundColor: `${color}1A` }]}>
          <Feather name={icon} size={18} color={color} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={s.statLabel}>{label}</Text>
        <Text style={[s.statValue, { color }]}>{value}</Text>
        {hint ? <Text style={s.statHint}>{hint}</Text> : null}
      </View>
    </View>
  );
}

/** Lays children out in a responsive grid: two columns when there is room. */
export function Grid({ children, min = 320 }: { children: React.ReactNode; min?: number }) {
  return <View style={s.grid}>{React.Children.map(children, (c) => <View style={[s.cell, { minWidth: min }]}>{c}</View>)}</View>;
}

const s = StyleSheet.create({
  page: { padding: 18, paddingBottom: 40 },
  inner: { width: '100%', maxWidth: 1100, alignSelf: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, alignSelf: 'flex-start' },
  backText: { color: C.green, fontWeight: '700', fontSize: 13 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: C.text },
  sub: { fontSize: 13, color: C.muted, marginTop: 3 },
  panel: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.line, marginBottom: 14 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  panelTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  action: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.line },
  actionIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  actionText: { fontSize: 12, color: C.muted, marginTop: 2 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.line },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 12, color: C.muted },
  statValue: { fontSize: 24, fontWeight: '800' },
  statHint: { fontSize: 11, color: C.muted, marginTop: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -7 },
  cell: { flexGrow: 1, flexBasis: 0, padding: 7 },
});
