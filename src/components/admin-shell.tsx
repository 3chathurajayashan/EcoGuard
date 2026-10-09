import { Feather, Ionicons } from '@expo/vector-icons';
import { router, usePathname, type Href } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, C } from '@/components/kit';
import { useUnreadCount } from '@/utils/notifications';
import { ROLE_LABEL, fullName, type Role } from '@/utils/roles';
import { useSession } from '@/utils/session';

type IconName = React.ComponentProps<typeof Feather>['name'];

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  roles: Role[];
}

const MANAGER: Role = 'PARK_MANAGER';
const RESEARCHER: Role = 'CONSERVATION_RESEARCHER';

// The sidebar from the dashboard wireframes, plus Patrol Operations (managers assign routes there)
const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'home', roles: [MANAGER, RESEARCHER] },
  { label: 'Analytics & Reports', href: '/analytics', icon: 'bar-chart-2', roles: [MANAGER, RESEARCHER] },
  { label: 'Patrol Operations', href: '/patrol-operations', icon: 'clipboard', roles: [MANAGER, RESEARCHER] },
  { label: 'Wildlife Monitoring', href: '/monitoring', icon: 'radio', roles: [MANAGER, RESEARCHER] },
  { label: 'Incident Management', href: '/incident-management', icon: 'alert-triangle', roles: [MANAGER, RESEARCHER] },
  { label: 'Community Engagement', href: '/community-engagement', icon: 'users', roles: [MANAGER, RESEARCHER] },
  { label: 'Settings', href: '/settings', icon: 'settings', roles: [MANAGER, RESEARCHER] },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useSession();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const unread = useUnreadCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const wide = width >= 900;

  const items = NAV.filter((n) => !!user && n.roles.includes(user.role));
  const go = (href: string) => {
    setMenuOpen(false);
    router.push(href as Href);
  };
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = (
    <View style={[s.sidebar, !wide && s.sidebarOverlay]}>
      <View style={s.brand}>
        <View style={s.logo}>
          <Ionicons name="paw" size={20} color="#FFF" />
        </View>
        <View>
          <Text style={s.brandName}>WildLife</Text>
          <Text style={s.brandSub}>Conservation</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {items.map((item) => {
          const on = active(item.href);
          return (
            <TouchableOpacity key={item.href} style={[s.item, on && s.itemOn]} onPress={() => go(item.href)} activeOpacity={0.8}>
              <Feather name={item.icon} size={18} color={on ? '#FFF' : 'rgba(255,255,255,0.78)'} />
              <Text style={[s.itemText, on && { color: '#FFF', fontWeight: '800' }]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={s.item} onPress={() => signOut()} activeOpacity={0.8}>
        <Feather name="log-out" size={18} color="rgba(255,255,255,0.78)" />
        <Text style={s.itemText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.body}>
        {wide ? sidebar : null}
        <View style={{ flex: 1 }}>
          <View style={s.topBar}>
            {!wide ? (
              <TouchableOpacity onPress={() => setMenuOpen((o) => !o)} accessibilityLabel="Menu" style={{ marginRight: 10 }}>
                <Feather name={menuOpen ? 'x' : 'menu'} size={24} color={C.greenDark} />
              </TouchableOpacity>
            ) : null}
            <View style={s.search}>
              <Feather name="search" size={15} color="#8A9A90" />
              <Text style={s.searchText}>Search...</Text>
            </View>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => router.push('/notifications')} accessibilityLabel="Notifications" style={{ marginRight: 16 }}>
              <Feather name="bell" size={20} color={C.text} />
              {unread > 0 ? (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <Avatar name={fullName(user) || '?'} size={32} />
            {wide ? (
              <View style={{ marginLeft: 8 }}>
                <Text style={s.userName}>{user ? ROLE_LABEL[user.role] : ''}</Text>
                <Text style={s.userPark}>Yala National Park</Text>
              </View>
            ) : null}
          </View>
          <View style={{ flex: 1 }}>{children}</View>
        </View>
      </View>

      {!wide && menuOpen ? (
        <Pressable style={s.scrim} onPress={() => setMenuOpen(false)}>
          <Pressable onPress={() => undefined}>{sidebar}</Pressable>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F1' },
  body: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 232, backgroundColor: '#1E5631', paddingVertical: 16, paddingHorizontal: 10 },
  sidebarOverlay: { height: '100%' as any, width: 260 },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 50 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingBottom: 18 },
  logo: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  brandName: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  brandSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginBottom: 2 },
  itemOn: { backgroundColor: 'rgba(255,255,255,0.16)' },
  itemText: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E3E8E3' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#D5DDD7', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, minWidth: 140, maxWidth: 260 },
  searchText: { color: '#8A9A90', fontSize: 13 },
  badge: { position: 'absolute', top: -6, right: -8, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  userName: { fontSize: 12, fontWeight: '800', color: C.text },
  userPark: { fontSize: 10, color: C.muted },
});
