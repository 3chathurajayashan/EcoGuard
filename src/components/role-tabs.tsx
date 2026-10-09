import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { ColorValue, Platform, StyleSheet, Text, View } from 'react-native';

import { C } from '@/components/kit';
import type { Role } from '@/utils/roles';
import { useSession } from '@/utils/session';

type IconName = React.ComponentProps<typeof Feather>['name'];

// Declaration order is the order of the tab bar. A tab not listed for a role is hidden from
// that role (and its route is not reachable from the bar).
const TABS: { name: string; title: string; icon: IconName; roles: Role[] }[] = [
  { name: 'index', title: 'Home', icon: 'home', roles: ['RANGER', 'COMMUNITY_LIAISON_OFFICER', 'VILLAGER'] },
  { name: 'alerts', title: 'Alerts', icon: 'alert-triangle', roles: ['COMMUNITY_LIAISON_OFFICER'] },
  { name: 'community', title: 'Verify', icon: 'check-square', roles: ['COMMUNITY_LIAISON_OFFICER'] },
  { name: 'map', title: 'Map', icon: 'map-pin', roles: ['RANGER', 'COMMUNITY_LIAISON_OFFICER'] },
  { name: 'patrol', title: 'Patrol', icon: 'clipboard', roles: ['RANGER'] },
  { name: 'explore', title: 'Reports', icon: 'file-text', roles: ['RANGER'] },
  { name: 'sightings', title: 'My Reports', icon: 'file-text', roles: ['VILLAGER'] },
  { name: 'profile', title: 'Profile', icon: 'user', roles: ['RANGER', 'COMMUNITY_LIAISON_OFFICER', 'VILLAGER'] },
];

export default function RoleTabs() {
  const { user } = useSession();
  const role = user?.role;

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarShowLabel: false, tabBarInactiveTintColor: '#7C8C82', tabBarActiveTintColor: C.green }}>
      {TABS.map((tab) => {
        const visible = !!role && tab.roles.includes(role);
        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              href: visible ? undefined : null,
              tabBarIcon: ({ focused, color }) => (
                <TabIcon focused={focused} color={color} icon={tab.icon} label={tab.title} />
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}

function TabIcon({ focused, color, icon, label }: { focused: boolean; color: ColorValue; icon: IconName; label: string }) {
  return (
    <View style={styles.item}>
      <View style={[styles.iconBg, focused && styles.iconBgActive]}>
        <Feather name={icon} size={20} color={focused ? '#FFF' : color} />
      </View>
      <Text style={[styles.label, { color: focused ? C.green : color }]} >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFF',
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    height: 75,
    paddingTop: 5,
    paddingBottom: 5,
  },
  item: { alignItems: 'center', justifyContent: 'center', height: 60, width: Platform.OS === 'web' ? 76 : 64 },
  label: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  iconBg: { padding: 6, borderRadius: 8, backgroundColor: 'transparent' },
  iconBgActive: { backgroundColor: C.green },
});
