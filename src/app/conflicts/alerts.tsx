import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AlertList, { type AlertFilter } from '@/components/conflicts/alert-list';
import { AppHeader, BG, BottomNav, GREEN } from '@/components/conflicts/parts';

export default function ConflictAlertsScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const initial: AlertFilter = filter === 'closed' ? 'closed' : 'active';
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader />
      <View style={styles.titleRow}>
        <Text style={styles.title}>{initial === 'closed' ? 'REPORTS' : 'ALERTS'}</Text>
        <Text style={styles.sub}>{initial === 'closed' ? 'Closed alerts and their responses' : 'All wildlife conflict alerts'}</Text>
      </View>
      <AlertList key={initial} initial={initial} />
      <BottomNav active={initial === 'closed' ? 'reports' : 'alerts'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  titleRow: { paddingHorizontal: 14, paddingTop: 12 },
  title: { fontSize: 20, fontWeight: '800', color: GREEN },
  sub: { fontSize: 12, color: '#666', marginTop: 2 },
});
