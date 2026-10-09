import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ROLE_SHORT, fullName } from '@/utils/roles';
import { useUnreadCount } from '@/utils/notifications';
import { useSession } from '@/utils/session';
import { STATUS_LABEL, type CaseStatus } from '@/utils/conflicts';

export const GREEN = '#1E5631';
export const RED = '#C62828';
export const BG = '#F4F7F4';

/** Top app bar from the wireframe: menu (back to the main app), logo, bell and the signed-in user. */
export function AppHeader() {
  const { user } = useSession();
  const unread = useUnreadCount();
  return (
    <View style={p.appBar}>
      <TouchableOpacity onPress={() => router.replace('/')} accessibilityLabel="Back to home" hitSlop={10}>
        <Feather name="menu" size={22} color="#333" />
      </TouchableOpacity>
      <View style={p.logoRow}>
        <View style={p.logo}>
          <Ionicons name="paw" size={14} color="#FFF" />
        </View>
        <Text style={p.brand}>WILDLIFE MONITORING{'\n'}SYSTEM</Text>
      </View>
      <TouchableOpacity style={p.bellWrap} onPress={() => router.push('/notifications')} accessibilityLabel="Notifications">
        <Feather name="bell" size={20} color="#333" />
        {unread > 0 ? (
          <View style={p.bellBadge}>
            <Text style={p.bellBadgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
      <View style={p.userRow}>
        <View style={p.avatar}>
          <Feather name="user" size={16} color="#FFF" />
        </View>
        <View>
          <Text style={p.userName}>{user ? ROLE_SHORT[user.role] : ''}</Text>
          <Text style={p.userTeam} numberOfLines={1}>
            {fullName(user)}
          </Text>
        </View>
      </View>
    </View>
  );
}

type Tab = 'dashboard' | 'animals' | 'alerts' | 'reports';

/** Bottom navigation from the wireframe, wired to the conflict-alert screens. */
export function BottomNav({ active }: { active: Tab }) {
  const items: { key: Tab; label: string; icon: React.ReactNode; to: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <Feather name="home" size={20} />, to: '/conflicts' },
    { key: 'animals', label: 'Animals', icon: <Ionicons name="paw" size={20} />, to: '/conflicts/animals' },
    { key: 'alerts', label: 'Alerts', icon: <Ionicons name="warning" size={20} />, to: '/conflicts/alerts' },
    { key: 'reports', label: 'Reports', icon: <Feather name="file-text" size={20} />, to: '/conflicts/alerts?filter=closed' },
  ];
  return (
    <View style={p.nav}>
      {items.map((it) => {
        const on = it.key === active;
        const color = on ? GREEN : '#555';
        return (
          <TouchableOpacity key={it.key} style={[p.navItem, on && p.navItemOn]} onPress={() => router.replace(it.to as any)}>
            {React.cloneElement(it.icon as React.ReactElement<{ color: string }>, { color })}
            <Text style={[p.navLabel, { color }]}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function RiskPill({ level }: { level: string }) {
  const high = level === 'HIGH' || level === 'CRITICAL';
  return (
    <View style={[p.riskPill, !high && { backgroundColor: '#FFF3E0' }]}>
      <Text style={[p.riskText, !high && { color: '#E65100' }]}>{level}</Text>
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

export function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
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

export const p = StyleSheet.create({
  appBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E8ECE8' },
  logoRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  logo: { width: 28, height: 28, borderRadius: 14, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 9, fontWeight: '800', color: GREEN, lineHeight: 11 },
  bellWrap: { padding: 2 },
  bellBadge: { position: 'absolute', top: -4, right: -5, minWidth: 14, height: 14, borderRadius: 7, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  bellBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: 120 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#6D4C41', alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 11, fontWeight: 'bold', color: '#222' },
  userTeam: { fontSize: 8, color: '#666', maxWidth: 80 },
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
});
