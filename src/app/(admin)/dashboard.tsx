import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ActionCard, Grid, Page, Panel, StatCard } from '@/components/admin-ui';
import { Banner, C, Loading, timeAgo } from '@/components/kit';
import { fetchOverview } from '@/utils/analytics';
import { ROLE_LABEL } from '@/utils/roles';
import { useSession } from '@/utils/session';
import { useLoad } from '@/utils/use-load';

const UPDATE_ICON = { incident: 'alert-triangle', patrol: 'clipboard', alert: 'radio' } as const;

export default function DashboardScreen() {
  const { user } = useSession();
  const { data, loading, error, reload } = useLoad(fetchOverview);

  return (
    <Page title={`Welcome, ${user ? ROLE_LABEL[user.role] : ''}!`} subtitle="Together for a healthier wildlife tomorrow.">
      {error ? <Banner tone="red" text={error} action={{ label: 'Retry', onPress: reload }} /> : null}

      <View style={s.hero}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&q=75&w=1200' }}
          style={s.heroImg}
        />
        <View style={s.heroShade} />
        <View style={s.quote}>
          <Text style={s.quoteText}>“Data today for a safer tomorrow.”</Text>
        </View>
      </View>

      {loading && !data ? (
        <Loading />
      ) : (
        <Grid min={200}>
          <StatCard icon="alert-circle" label="Open conflict alerts" value={data?.openAlerts ?? 0} tone="red" />
          <StatCard icon="file-text" label="Incidents this week" value={data?.newIncidents ?? 0} tone="orange" />
          <StatCard icon="clipboard" label="Patrols this week" value={data?.patrolsWeek ?? 0} tone="green" />
          <StatCard icon="users" label="Reports to verify" value={data?.pendingReports ?? 0} tone="blue" />
        </Grid>
      )}

      <Text style={s.section}>Modules</Text>
      <Grid min={300}>
        <ActionCard icon="map-pin" title="Patrol Operations" text="View patrol coverage and assign routes" onPress={() => router.push('/patrol-operations')} />
        <ActionCard icon="alert-triangle" title="Incident Management" text="View and manage incidents" tone="red" onPress={() => router.push('/incident-management')} />
        <ActionCard icon="bar-chart-2" title="Analytics & Reports" text="Analyze data and generate reports" onPress={() => router.push('/analytics')} />
        <ActionCard icon="radio" title="Wildlife Monitoring" text="Track collared animals and risk zones" tone="orange" onPress={() => router.push('/monitoring')} />
      </Grid>

      <Panel title="Recent Updates">
        {data?.updates.length ? (
          data.updates.map((u, i) => (
            <TouchableOpacity key={i} style={s.update} activeOpacity={0.8} onPress={() => router.push(u.kind === 'alert' ? '/monitoring' : u.kind === 'patrol' ? '/patrol-operations' : '/incident-management')}>
              <View style={[s.updateIcon, u.kind === 'alert' && { backgroundColor: '#FDECEA' }]}>
                <Feather name={UPDATE_ICON[u.kind]} size={15} color={u.kind === 'alert' ? C.red : C.orange} />
              </View>
              <Text style={s.updateText}>{u.text}</Text>
              <Text style={s.updateTime}>{timeAgo(u.at)}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={s.none}>Nothing has happened yet.</Text>
        )}
      </Panel>
    </Page>
  );
}

const s = StyleSheet.create({
  hero: { height: 170, borderRadius: 16, overflow: 'hidden', marginBottom: 16, justifyContent: 'center' },
  heroImg: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,60,34,0.28)' },
  quote: { alignSelf: 'flex-end', marginRight: 18, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, maxWidth: '55%' },
  quoteText: { fontSize: 15, fontWeight: '700', color: C.greenDark, lineHeight: 20 },
  section: { fontSize: 14, fontWeight: '800', color: C.greenDark, marginTop: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
  update: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E3E8E3' },
  updateIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' },
  updateText: { flex: 1, fontSize: 13, color: C.text },
  updateTime: { fontSize: 11, color: C.muted },
  none: { color: C.muted, fontSize: 13 },
});
