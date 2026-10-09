import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Grid, Page, Panel } from '@/components/admin-ui';
import ConflictMap from '@/components/conflicts/conflict-map';
import { Banner, Button, C, Loading, Pill, timeAgo } from '@/components/kit';
import {
  fetchAlerts,
  fetchCollars,
  fetchZones,
  isClosedStatus,
  sendCollarPing,
  type Collar,
  type ConflictCase,
  type RiskZone,
} from '@/utils/conflicts';
import { errorMessage } from '@/utils/http';
import { useSession } from '@/utils/session';
import { useLoad } from '@/utils/use-load';

const ZONE_TONE: Record<string, 'red' | 'orange' | 'blue' | 'gray'> = {
  HIGH_RISK_AREA: 'red',
  COMMUNITY_SETTLEMENT: 'orange',
  MIGRATION_CORRIDOR: 'blue',
  WATER_SOURCE: 'blue',
  BUFFER_ZONE: 'gray',
};

/** The centre of a zone's polygon as { latitude, longitude }. */
const centre = (z: RiskZone) => {
  const ring = z.boundary.coordinates[0].slice(0, -1);
  return {
    latitude: ring.reduce((a, p) => a + p[1], 0) / ring.length,
    longitude: ring.reduce((a, p) => a + p[0], 0) / ring.length,
  };
};

export default function WildlifeMonitoring() {
  const { user } = useSession();
  const canPing = user?.role === 'PARK_MANAGER';
  const [collarId, setCollarId] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: 'green' | 'red' | 'orange'; text: string; alertId?: string } | null>(null);

  const { data, loading, error, reload } = useLoad<{ collars: Collar[]; zones: RiskZone[]; alerts: ConflictCase[] }>(async () => {
    const [collars, zones, alerts] = await Promise.all([fetchCollars(), fetchZones(), fetchAlerts({ active: true })]);
    return { collars, zones, alerts };
  });

  const selected = collarId || data?.collars[0]?._id || '';

  const ping = async (latitude: number, longitude: number, label: string) => {
    setBusy(true);
    setResult(null);
    try {
      const r = await sendCollarPing(selected, latitude, longitude);
      setResult(
        r.alertCreated
          ? { tone: 'red', text: `Position sent (${label}). The animal is inside a risk zone, so a conflict alert was raised and the officers were notified.`, alertId: r.alert?._id }
          : r.insideRiskZone
            ? { tone: 'orange', text: `Position sent (${label}). An open alert already exists for this animal and zone.`, alertId: r.alert?._id }
            : { tone: 'green', text: `Position sent (${label}). Outside every risk zone: stored as normal tracking data, no alert.` },
      );
      await reload();
    } catch (e) {
      setResult({ tone: 'red', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Wildlife Monitoring" subtitle="Collared animals, risk zones and active conflict alerts.">
      {error ? <Banner tone="red" text={error} action={{ label: 'Retry', onPress: reload }} /> : null}
      {loading && !data ? (
        <Loading />
      ) : (
        <>
          <Panel title="Animal movement map">
            <ConflictMap height={260} zones={data?.zones ?? []} collars={data?.collars ?? []} />
          </Panel>

          <Grid min={340}>
            <Panel title={`Collared animals (${data?.collars.length ?? 0})`}>
              {data?.collars.map((c) => (
                <View key={c._id} style={s.row}>
                  <View style={s.icon}>
                    <Feather name="radio" size={14} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>{c.animalId?.identifier}</Text>
                    <Text style={s.rowSub}>
                      {c.animalId?.species} · {c.lastUpdated ? `seen ${timeAgo(c.lastUpdated)}` : 'no position yet'}
                    </Text>
                  </View>
                  <Pill label={c.animalId?.riskStatus ?? ''} tone={c.animalId?.riskStatus === 'HIGH' || c.animalId?.riskStatus === 'CRITICAL' ? 'red' : 'gray'} />
                </View>
              ))}
            </Panel>

            <Panel title={`Risk zones (${data?.zones.length ?? 0})`}>
              {data?.zones.map((z) => (
                <View key={z._id} style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>{z.name}</Text>
                    <Text style={s.rowSub}>{z.description}</Text>
                  </View>
                  <Pill label={z.zoneType.replace(/_/g, ' ')} tone={ZONE_TONE[z.zoneType] ?? 'gray'} />
                </View>
              ))}
            </Panel>
          </Grid>

          <Panel title={`Active conflict alerts (${data?.alerts.filter((a) => !isClosedStatus(a.status)).length ?? 0})`}>
            {data?.alerts.length ? (
              data.alerts.map((a) => (
                <TouchableOpacity key={a.id} style={s.row} onPress={() => router.push(`/conflicts/${a.id}`)} activeOpacity={0.8}>
                  <View style={[s.dot, { backgroundColor: a.status === 'NEW' ? C.red : '#E65100' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>
                      {a.animalId} · {a.riskZone}
                    </Text>
                    <Text style={s.rowSub}>
                      {timeAgo(a.alertTime)} · {a.assignedTo}
                    </Text>
                  </View>
                  <Pill label={a.status.replace('_', ' ')} tone={a.status === 'NEW' ? 'red' : 'orange'} />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={s.none}>No active alerts. All tracked animals are outside the risk zones.</Text>
            )}
          </Panel>

          {canPing && data?.collars.length ? (
            <Panel title="GPS collar test">
              <Text style={s.hint}>Send a position as if the collar had reported it. A position inside a risk zone raises an alert automatically.</Text>
              <View style={s.chips}>
                {data.collars.map((c) => (
                  <TouchableOpacity key={c._id} style={[s.chip, selected === c._id && s.chipOn]} onPress={() => setCollarId(c._id)}>
                    <Text style={[s.chipText, selected === c._id && { color: '#FFF' }]}>{c.animalId?.identifier}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={s.buttons}>
                {data.zones.map((z) => (
                  <View key={z._id} style={{ minWidth: 220, flex: 1 }}>
                    <Button
                      label={`Move into ${z.name}`}
                      tone="danger"
                      small
                      disabled={busy}
                      onPress={() => ping(centre(z).latitude, centre(z).longitude, z.name)}
                    />
                  </View>
                ))}
                <View style={{ minWidth: 220, flex: 1 }}>
                  <Button label="Move outside all zones" tone="outline" small disabled={busy} onPress={() => ping(6.46, 81.64, 'outside the zones')} />
                </View>
              </View>
              {result ? (
                <View style={{ marginTop: 12 }}>
                  <Banner
                    tone={result.tone}
                    text={result.text}
                    action={result.alertId ? { label: 'View alert', onPress: () => router.push(`/conflicts/${result.alertId}`) } : undefined}
                  />
                </View>
              ) : null}
            </Panel>
          ) : null}
        </>
      )}
    </Page>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E3E8E3' },
  icon: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  rowSub: { fontSize: 11, color: C.muted, marginTop: 2 },
  none: { color: C.muted, fontSize: 13 },
  hint: { fontSize: 12, color: C.muted, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, borderWidth: 1.5, borderColor: '#CFD8D2', backgroundColor: '#FFF' },
  chipOn: { backgroundColor: C.green, borderColor: C.green },
  chipText: { fontSize: 13, color: '#455A64', fontWeight: '600' },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
