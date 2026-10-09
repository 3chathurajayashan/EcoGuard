import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, C, Empty, Loading, TopBar, timeAgo } from '@/components/kit';
import { errorMessage } from '@/utils/http';
import { fetchNotifications, markAllNotificationsRead, type AppNotification } from '@/utils/notifications';
import { isStaff } from '@/utils/roles';
import { useSession } from '@/utils/session';

const ICON: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  'Conflict Alert': 'alert-triangle',
  'Community Report': 'users',
  Patrol: 'clipboard',
  'Incident Report': 'file-text',
  'Incident Update': 'file-text',
  'Sync Complete': 'refresh-cw',
};

export default function NotificationsScreen() {
  const { user } = useSession();
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const result = await fetchNotifications();
          if (!active) return;
          setItems(result.items);
          // Show what was unread first, then mark everything as read
          if (result.unread) await markAllNotificationsRead();
        } catch (e) {
          if (active) setError(errorMessage(e));
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const open = (n: AppNotification) => {
    if (n.alertId && isStaff(user?.role)) router.push(`/conflicts/${n.alertId}`);
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <TopBar title="Notifications" subtitle={user ? `${user.firstName} ${user.lastName}` : undefined} />
      {error ? <Banner tone="red" text={error} /> : null}
      {items === null && !error ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {items?.length === 0 ? (
            <Empty icon="bell-off" text="You have no notifications yet." />
          ) : (
            items?.map((n) => (
              <TouchableOpacity key={n._id} style={[s.item, !n.isRead && s.unread]} onPress={() => open(n)} activeOpacity={0.8}>
                <View style={[s.icon, n.type === 'Conflict Alert' && { backgroundColor: C.red }]}>
                  <Feather name={ICON[n.type] ?? 'bell'} size={16} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{n.title}</Text>
                  <Text style={s.msg}>{n.message}</Text>
                  <Text style={s.time}>{timeAgo(n.createdAt)}</Text>
                </View>
                {!n.isRead ? <View style={s.dot} /> : null}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  item: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.line },
  unread: { backgroundColor: '#F1F8E9', borderColor: '#C5E1A5' },
  icon: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '800', color: C.text },
  msg: { fontSize: 13, color: '#455A64', marginTop: 3, lineHeight: 18 },
  time: { fontSize: 11, color: '#90A4AE', marginTop: 5 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.red, marginTop: 4 },
});
