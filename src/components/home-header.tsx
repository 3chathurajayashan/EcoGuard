import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Avatar, C } from '@/components/kit';
import { fullName } from '@/utils/roles';
import { useUnreadCount } from '@/utils/notifications';
import { useSession } from '@/utils/session';

/** Brand, notification bell with an unread badge, and the signed-in person's avatar. */
export default function HomeHeader({ light = false }: { light?: boolean }) {
  const { user } = useSession();
  const unread = useUnreadCount();
  const fg = light ? '#FFF' : C.text;

  return (
    <View style={s.row}>
      <View style={s.brand}>
        <View style={s.logo}>
          <Ionicons name="paw" size={22} color="#FFF" />
        </View>
        <View>
          <Text style={[s.name, { color: fg }]}>EcoGuard</Text>
          <Text style={[s.tag, { color: light ? 'rgba(255,255,255,0.8)' : C.muted }]}>Wildlife Conservation</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => router.push('/notifications')} accessibilityLabel="Notifications" style={{ marginRight: 12 }}>
        <Feather name="bell" size={24} color={fg} />
        {unread > 0 ? (
          <View style={s.badge}>
            <Text style={s.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
      <Avatar name={fullName(user) || '?'} size={36} />
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '800' },
  tag: { fontSize: 11 },
  badge: { position: 'absolute', top: -6, right: -8, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
});
