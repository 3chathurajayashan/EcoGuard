import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Grid, Page, Panel } from '@/components/admin-ui';
import { Banner, Button, C, Loading, Pill, fmtDateTime } from '@/components/kit';
import { errorMessage } from '@/utils/http';
import { assignRoute, fetchAssignments, fetchPatrols, fetchRangers, fetchRoutes, type AssignmentRow, type PatrolRow, type Ranger } from '@/utils/operations';
import type { PatrolRoute } from '@/utils/patrol';
import { useSession } from '@/utils/session';
import { useLoad } from '@/utils/use-load';

interface Data {
  routes: PatrolRoute[];
  patrols: PatrolRow[];
  rangers: Ranger[];
  assignments: AssignmentRow[];
}

const STATUS_TONE = { ASSIGNED: 'orange', IN_PROGRESS: 'blue', COMPLETED: 'green' } as const;

export default function PatrolOperations() {
  const { user } = useSession();
  const isManager = user?.role === 'PARK_MANAGER';
  const [rangerId, setRangerId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);

  const { data, loading, error, reload } = useLoad<Data>(async () => {
    const [routes, patrols] = await Promise.all([fetchRoutes(), fetchPatrols()]);
    // Only managers plan patrols: the rangers list and assignments are theirs
    const [rangers, assignments] = isManager ? await Promise.all([fetchRangers(), fetchAssignments()]) : [[], []];
    return { routes, patrols, rangers, assignments };
  });

  const assign = async () => {
    if (!rangerId || !routeId) {
      setNotice({ tone: 'red', text: 'Choose a ranger and a route first.' });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await assignRoute(rangerId, routeId);
      setNotice({ tone: 'green', text: 'Route assigned. The ranger has been notified.' });
      setRangerId('');
      setRouteId('');
      await reload();
    } catch (e) {
      setNotice({ tone: 'red', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  const completed = (data?.patrols ?? []).filter((p) => p.status === 'COMPLETED');
  const average = completed.length ? Math.round((completed.reduce((a, p) => a + p.coveragePercentage, 0) / completed.length) * 10) / 10 : 0;

  return (
    <Page title="Patrol Operations" subtitle={isManager ? 'Assign routes to rangers and review patrol coverage.' : 'Patrol routes and coverage (read only).'}>
      {error ? <Banner tone="red" text={error} action={{ label: 'Retry', onPress: reload }} /> : null}
      {notice ? <Banner tone={notice.tone} text={notice.text} /> : null}
      {loading && !data ? (
        <Loading />
      ) : (
        <>
          <Grid min={180}>
            <Stat label="Routes" value={data?.routes.length ?? 0} />
            <Stat label="Patrols completed" value={completed.length} />
            <Stat label="Average coverage" value={`${average}%`} />
          </Grid>

          {isManager ? (
            <Panel title="Assign a route">
              <Text style={s.label}>Ranger</Text>
              <View style={s.chips}>
                {data?.rangers.map((r) => (
                  <Chip key={r._id} on={rangerId === r._id} label={`${r.firstName} ${r.lastName}`} onPress={() => setRangerId(r._id)} />
                ))}
              </View>
              <Text style={s.label}>Route</Text>
              <View style={s.chips}>
                {data?.routes.map((r) => (
                  <Chip key={r._id} on={routeId === r._id} label={`${r.name} (${r.distanceKm} km)`} onPress={() => setRouteId(r._id)} />
                ))}
              </View>
              <View style={{ maxWidth: 260 }}>
                <Button label="Assign route" icon="send" loading={busy} onPress={assign} />
              </View>
            </Panel>
          ) : null}

          {isManager ? (
            <Panel title="Assignments">
              {data?.assignments.length ? (
                data.assignments.slice(0, 8).map((a) => (
                  <View key={a._id} style={s.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowTitle}>{a.route.name}</Text>
                      <Text style={s.rowSub}>
                        {a.ranger.firstName} {a.ranger.lastName} · {fmtDateTime(a.assignedDate)}
                      </Text>
                    </View>
                    <Pill label={a.status.replace('_', ' ')} tone={STATUS_TONE[a.status]} />
                  </View>
                ))
              ) : (
                <Text style={s.none}>No assignments yet.</Text>
              )}
            </Panel>
          ) : null}

          <Panel title="Recent patrols">
            {data?.patrols.length ? (
              data.patrols.slice(0, 10).map((p) => (
                <View key={p._id} style={s.row}>
                  <View style={s.icon}>
                    <Feather name="navigation" size={15} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>{p.route?.name}</Text>
                    <Text style={s.rowSub}>
                      {p.ranger?.firstName} {p.ranger?.lastName} · {fmtDateTime(p.startTime)} · {p.totalDistance.toFixed(1)} km · {p.waypoints.length} points
                    </Text>
                  </View>
                  {p.status === 'COMPLETED' ? (
                    <Pill label={`${p.coveragePercentage}% covered`} tone={p.coveragePercentage >= 80 ? 'green' : p.coveragePercentage >= 60 ? 'orange' : 'red'} />
                  ) : (
                    <Pill label="In progress" tone="blue" />
                  )}
                </View>
              ))
            ) : (
              <Text style={s.none}>No patrols recorded yet.</Text>
            )}
          </Panel>

          <Panel title="Routes">
            {data?.routes.map((r) => (
              <View key={r._id} style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{r.name}</Text>
                  <Text style={s.rowSub}>
                    {r.startPoint.name} to {r.endPoint.name} · {r.routePoints.length} stops
                  </Text>
                </View>
                <Text style={s.km}>{r.distanceKm} km</Text>
              </View>
            ))}
          </Panel>
        </>
      )}
    </Page>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={s.stat}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[s.chip, on && s.chipOn]} onPress={onPress}>
      <Text style={[s.chipText, on && { color: '#FFF' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '800', color: C.text, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, borderWidth: 1.5, borderColor: '#CFD8D2', backgroundColor: '#FFF' },
  chipOn: { backgroundColor: C.green, borderColor: C.green },
  chipText: { fontSize: 13, color: '#455A64', fontWeight: '600' },
  stat: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.line },
  statLabel: { fontSize: 12, color: C.muted },
  statValue: { fontSize: 26, fontWeight: '800', color: C.green },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E3E8E3' },
  icon: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  rowSub: { fontSize: 11, color: C.muted, marginTop: 2 },
  km: { fontSize: 13, fontWeight: '800', color: C.text },
  none: { color: C.muted, fontSize: 13 },
});
