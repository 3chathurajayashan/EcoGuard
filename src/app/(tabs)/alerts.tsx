import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AlertList from '@/components/conflicts/alert-list';
import { C } from '@/components/kit';

/** Liaison officers' alert list: every wildlife conflict alert, newest first. */
export default function AlertsTab() {
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.head}>
        <Text style={s.title}>Conflict Alerts</Text>
        <Text style={s.sub}>Acknowledge, respond to and follow every alert</Text>
      </View>
      <AlertList />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  head: { paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 22, fontWeight: '800', color: C.text },
  sub: { fontSize: 12, color: C.muted, marginTop: 2 },
});
