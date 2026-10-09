import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { CaseStatus } from '@/utils/conflict/store';
import { STATUS_LABEL } from '@/utils/conflict/store';

export const GREEN = '#1E5631';
export const RED = '#C62828';
export const BG = '#F4F7F4';

/** Top app bar from the wireframe: menu, logo, notification bell and the signed-in ranger. */
export function AppHeader() {
  return (
    <View style={p.appBar}>
      <Feather name="menu" size={22} color="#333" />
      <View style={p.logoRow}>
        <View style={p.logo}>
          <Ionicons name="paw" size={14} color="#FFF" />
        </View>
        <Text style={p.brand}>WILDLIFE MONITORING{'\n'}SYSTEM</Text>
      </View>
      <View style={p.bellWrap}>
        <Feather name="bell" size={20} color="#333" />
        <View style={p.bellBadge}>
          <Text style={p.bellBadgeText}>2</Text>
        </View>
      </View>
      <View style={p.userRow}>
        <View style={p.avatar}>
          <Feather name="user" size={16} color="#FFF" />
        </View>
        <View>
          <Text style={p.userName}>Ranger</Text>
          <Text style={p.userTeam}>North Central Team</Text>
        </View>
        <Feather name="chevron-down" size={14} color="#666" />
      </View>
    </View>
  );
}

type Tab = 'dashboard' | 'animals' | 'alerts' | 'reports';

/** Bottom navigation from the wireframe. Only Dashboard and Alerts belong to this feature. */
export function BottomNav({ active }: { active: Tab }) {
  const items: { key: Tab; label: string; icon: React.ReactNode; onPress?: () => void }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <Feather name="home" size={20} />, onPress: () => router.replace('/conflicts') },
    { key: 'animals', label: 'Animals', icon: <Ionicons name="paw" size={20} /> },
    { key: 'alerts', label: 'Alerts', icon: <Ionicons name="warning" size={20} />, onPress: () => router.replace('/conflicts/ca-1') },
    { key: 'reports', label: 'Reports', icon: <Feather name="file-text" size={20} /> },
  ];
  return (
    <View style={p.nav}>
      {items.map((it) => {
        const on = it.key === active;
        const color = on ? GREEN : '#555';
        return (
          <TouchableOpacity key={it.key} style={[p.navItem, on && p.navItemOn]} onPress={it.onPress} activeOpacity={it.onPress ? 0.7 : 1}>
            {React.cloneElement(it.icon as React.ReactElement<{ color: string }>, { color })}
            <Text style={[p.navLabel, { color }]}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function RiskPill({ level }: { level: string }) {
  return (
    <View style={p.riskPill}>
      <Text style={p.riskText}>{level}</Text>
    </View>
  );
}

const STATUS_COLORS: Record<CaseStatus, { bg: string; fg: string }> = {
  NEW: { bg: '#FDECEA', fg: RED },
  ACKNOWLEDGED: { bg: '#FFF3E0', fg: '#E65100' },
  IN_PROGRESS: { bg: '#FFF3E0', fg: '#E65100' },
  RESOLVED: { bg: '#E8F5E9', fg: '#2E7D32' },
  FALSE_ALERT: { bg: '#ECEFF1', fg: '#546E7A' },
  CANCELLED: { bg: '#ECEFF1', fg: '#546E7A' },
};

export function StatusPill({ status, labelled = false }: { status: CaseStatus; labelled?: boolean }) {
  const c = STATUS_COLORS[status];
  return (
    <View style={[p.statusPill, { backgroundColor: c.bg }]}>
      {labelled ? <Text style={p.statusPrefix}>STATUS: </Text> : null}
      <Text style={[p.statusText, { color: c.fg }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

export function Card({ title, children, style }: { title?: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={[p.card, style]}>
      {title ? <Text style={p.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={p.infoRow}>
      <View style={p.infoIcon}>{icon}</View>
      <Text style={p.infoLabel}>{label}</Text>
      <View style={p.infoValue}>{typeof children === 'string' ? <Text style={p.infoText}>{children}</Text> : children}</View>
    </View>
  );
}

export const icon = {
  paw: <Ionicons name="paw" size={15} color="#444" />,
  zone: <Feather name="map-pin" size={15} color="#444" />,
  clock: <Feather name="clock" size={15} color="#444" />,
  level: <Feather name="bar-chart-2" size={15} color="#444" />,
  radio: <Feather name="radio" size={15} color="#444" />,
  info: <Feather name="info" size={15} color="#444" />,
  user: <Feather name="user" size={15} color="#444" />,
  calendar: <Feather name="calendar" size={15} color="#444" />,
  status: <Feather name="activity" size={15} color="#444" />,
};

/** Stylised map used instead of a real map so it also renders on web: river, trees, risk zone and markers. */
export function MockMap({ height = 150, withRanger = false }: { height?: number; withRanger?: boolean }) {
  const trees = [
    { l: '6%', t: '12%' }, { l: '18%', t: '70%' }, { l: '36%', t: '8%' }, { l: '82%', t: '70%' },
    { l: '90%', t: '38%' }, { l: '44%', t: '78%' }, { l: '10%', t: '42%' }, { l: '70%', t: '8%' },
  ];
  return (
    <View style={[p.map, { height }]}>
      <View style={p.river} />
      {trees.map((t, i) => (
        <Text key={i} style={[p.tree, { left: t.l as `${number}%`, top: t.t as `${number}%` }]}>
          🌲
        </Text>
      ))}

      <View style={[p.zone, withRanger && { left: '30%', top: '24%' }]} />
      <Text style={[p.zoneLabel, withRanger ? { left: '34%', top: '40%' } : { left: '56%', top: '38%' }]}>
        HIGH-RISK{'\n'}ZONE 03
      </Text>

      {withRanger ? (
        <>
          <View style={p.route} />
          <View style={[p.marker, { left: '16%', top: '58%', backgroundColor: '#1565C0' }]}>
            <Ionicons name="person" size={14} color="#FFF" />
          </View>
          <Text style={[p.markerLabel, { left: '10%', top: '38%' }]}>Ranger (You)</Text>
          <View style={[p.marker, { left: '52%', top: '64%' }]}>
            <Text style={{ fontSize: 15 }}>🐘</Text>
          </View>
          <Text style={[p.markerLabel, { left: '46%', top: '84%' }]}>Elephant E-12</Text>
        </>
      ) : (
        <>
          <View style={[p.marker, p.markerLg, { left: '14%', top: '34%' }]}>
            <Text style={{ fontSize: 24 }}>🐘</Text>
          </View>
          <View style={p.signal} />
          <View style={p.legend}>
            <View style={p.legendRow}>
              <View style={[p.legendDot, { backgroundColor: '#444' }]} />
              <Text style={p.legendText}>Elephant (Tracked)</Text>
            </View>
            <View style={p.legendRow}>
              <View style={[p.legendDot, { borderWidth: 1, borderColor: RED, backgroundColor: '#FDECEA' }]} />
              <Text style={p.legendText}>High-Risk Zone</Text>
            </View>
          </View>
        </>
      )}

      <View style={p.zoom}>
        <Text style={p.zoomText}>+</Text>
        <View style={p.zoomDivider} />
        <Text style={p.zoomText}>−</Text>
      </View>
      <View style={p.locate}>
        <Feather name="navigation" size={13} color="#444" />
      </View>
    </View>
  );
}

export const p = StyleSheet.create({
  appBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E8ECE8' },
  logoRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  logo: { width: 28, height: 28, borderRadius: 14, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 9, fontWeight: '800', color: GREEN, lineHeight: 11 },
  bellWrap: { padding: 2 },
  bellBadge: { position: 'absolute', top: -4, right: -5, minWidth: 14, height: 14, borderRadius: 7, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  bellBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#6D4C41', alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 11, fontWeight: 'bold', color: '#222' },
  userTeam: { fontSize: 8, color: '#666' },
  nav: { flexDirection: 'row', backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E8ECE8', paddingHorizontal: 8, paddingVertical: 6 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 10, gap: 2 },
  navItemOn: { backgroundColor: '#E3EFE5' },
  navLabel: { fontSize: 11, fontWeight: '600' },
  riskPill: { alignSelf: 'flex-start', backgroundColor: '#FDECEA', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 4 },
  riskText: { color: RED, fontSize: 11, fontWeight: 'bold' },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusPrefix: { fontSize: 10, fontWeight: 'bold', color: '#666' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  card: { backgroundColor: '#FFF', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E3E8E3' },
  cardTitle: { fontSize: 11, fontWeight: '800', color: GREEN, letterSpacing: 0.5, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
  infoIcon: { width: 22 },
  infoLabel: { width: 92, fontSize: 12, color: '#444' },
  infoValue: { flex: 1 },
  infoText: { fontSize: 12, fontWeight: '700', color: '#222' },
  map: { borderRadius: 10, overflow: 'hidden', backgroundColor: '#E6EFDD', borderWidth: 1, borderColor: '#D5E2CC' },
  river: { position: 'absolute', left: '-20%', top: '62%', width: '150%', height: 22, backgroundColor: '#BFDDF2', transform: [{ rotate: '-24deg' }] },
  tree: { position: 'absolute', fontSize: 13, opacity: 0.85 },
  zone: { position: 'absolute', left: '50%', top: '10%', width: 92, height: 88, borderRadius: 24, backgroundColor: 'rgba(229,57,53,0.2)', borderWidth: 2, borderColor: RED, borderStyle: 'dashed', transform: [{ rotate: '8deg' }] },
  zoneLabel: { position: 'absolute', fontSize: 9, fontWeight: '800', color: RED, textAlign: 'center' },
  marker: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#CCC' },
  markerLg: { width: 44, height: 44, borderRadius: 22 },
  markerLabel: { position: 'absolute', fontSize: 9, fontWeight: '700', color: '#333' },
  signal: { position: 'absolute', left: '32%', top: '44%', width: 70, borderTopWidth: 2, borderColor: '#555', borderStyle: 'dashed' },
  route: { position: 'absolute', left: '24%', top: '60%', width: 100, borderTopWidth: 2, borderColor: '#333', borderStyle: 'dashed', transform: [{ rotate: '-8deg' }] },
  legend: { position: 'absolute', right: 8, top: 8, backgroundColor: '#FFF', borderRadius: 6, padding: 6, gap: 3, borderWidth: 1, borderColor: '#DDD' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 8, color: '#333' },
  zoom: { position: 'absolute', right: 8, bottom: 8, backgroundColor: '#FFF', borderRadius: 6, borderWidth: 1, borderColor: '#DDD', alignItems: 'center', paddingHorizontal: 7 },
  zoomText: { fontSize: 15, color: '#333', fontWeight: '600', lineHeight: 20 },
  zoomDivider: { alignSelf: 'stretch', height: 1, backgroundColor: '#DDD' },
  locate: { position: 'absolute', left: 8, bottom: 8, width: 26, height: 26, borderRadius: 6, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', alignItems: 'center', justifyContent: 'center' },
});
