import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Avatar, C } from '@/components/kit';
import { useUnreadCount } from '@/utils/notifications';
import { fullName } from '@/utils/roles';
import { useSession } from '@/utils/session';

/** The misty-forest header band used on every patrol screen in the wireframes. */
export default function PatrolHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  const { user } = useSession();
  const unread = useUnreadCount();
  return (
    <View style={s.band}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=70&w=900' }}
        style={s.image}
      />
      <View style={s.mist} />
      <View style={s.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={{ marginRight: 4 }} accessibilityLabel="Go back">
            <Feather name="arrow-left" size={22} color={C.greenDark} />
          </TouchableOpacity>
        ) : null}
        <View style={s.logo}>
          <Ionicons name="paw" size={18} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.brand}>Wildlife{'\n'}Conservation</Text>
          <Text style={s.tag}>Rangers for a Wilder Tomorrow</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/notifications')} accessibilityLabel="Notifications">
          <Feather name="bell" size={20} color={C.greenDark} />
          {unread > 0 ? <View style={s.dot} /> : null}
        </TouchableOpacity>
        <Avatar name={fullName(user) || '?'} size={30} />
      </View>
      <View style={s.titleWrap}>
        <Text style={s.title}>{title}</Text>
        {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  band: { height: 176, backgroundColor: '#DCEBD9', overflow: 'hidden' },
  image: { ...StyleSheet.absoluteFill, width: '100%', height: '100%', opacity: 0.55 },
  mist: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(238,246,236,0.62)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 12 },
  logo: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 11, fontWeight: '800', color: C.greenDark, lineHeight: 12 },
  tag: { fontSize: 8, color: '#4B6B55', marginTop: 1 },
  dot: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: C.red },
  titleWrap: { paddingHorizontal: 18, paddingTop: 14 },
  title: { fontSize: 26, fontWeight: '800', color: C.greenDark },
  sub: { fontSize: 12, color: '#2F4A38', marginTop: 4, maxWidth: '75%' },
});
