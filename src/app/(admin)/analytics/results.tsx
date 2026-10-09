import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Grid, Page, Panel } from '@/components/admin-ui';
import { BarChart, LineChart } from '@/components/charts';
import { Button, C, Pill } from '@/components/kit';
import SvgMap, { MapChrome } from '@/components/svg-map';
import { useFlow } from '@/utils/analytics';

/** Conservation Analysis Results. */
export default function AnalysisResults() {
  const { results } = useFlow();

  // Opened directly with nothing analysed yet: start from the criteria form
  useEffect(() => {
    if (!results) router.replace('/analytics/criteria');
    // only when the screen opens: it stays mounted under later screens while new results load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const heat = useMemo(
    () => (results?.hotspots?.hotspots ?? []).map((h) => ({ latitude: h.latitude, longitude: h.longitude, level: h.level, weight: h.incidents })),
    [results],
  );
  const coverage = useMemo(
    () =>
      (results?.patrolCoverage?.mapPoints ?? []).map((p, i) => ({
        id: `${p.route}-${i}`,
        latitude: p.latitude,
        longitude: p.longitude,
        kind: p.covered ? ('covered' as const) : ('missed' as const),
      })),
    [results],
  );

  if (!results) return <Page title="Conservation Analysis Results">{null}</Page>;

  const s1 = results.incidentStatistics;
  const hot = results.hotspots;
  const cov = results.patrolCoverage;
  const con = results.conflictTrends;

  return (
    <Page
      title="Conservation Analysis Results"
      subtitle={`Park: ${results.criteria.park}   |   Period: ${results.criteria.periodLabel}`}
      back="/analytics"
      right={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label="Refine Analysis" tone="outline" small icon="sliders" onPress={() => router.push('/analytics/refine')} />
          <Button label="Generate Report" small icon="file-text" onPress={() => router.push('/analytics/report')} />
        </View>
      }>
      <Grid min={360}>
        <Panel title="Incident Statistics" right={<Trend value={s1.changePercent} />}>
          <Text style={s.big}>{s1.total}</Text>
          <Text style={s.small}>incidents reported ({s1.previousTotal} in the previous period)</Text>
          <BarChart labels={s1.byPeriod.map((b) => b.label)} values={s1.byPeriod.map((b) => b.count)} />
          <View style={s.tags}>
            {s1.byType.slice(0, 4).map((t) => (
              <Pill key={t.type} label={`${t.type} ${t.count}`} tone="gray" />
            ))}
          </View>
        </Panel>

        {hot ? (
          <Panel title="Incident Hotspot Map">
            <SvgMap height={190} heat={heat}>
              <MapChrome
                legend={[
                  { color: '#E53935', label: 'High' },
                  { color: '#FB8C00', label: 'Medium' },
                  { color: '#FDD835', label: 'Low' },
                ]}
              />
            </SvgMap>
            {hot.hotspots[0] ? (
              <Text style={s.note}>
                Busiest area: {hot.hotspots[0].incidents} incidents, mostly {hot.hotspots[0].mainType.toLowerCase()}.
              </Text>
            ) : (
              <Text style={s.note}>No incidents with a location in this period.</Text>
            )}
          </Panel>
        ) : null}

        {cov ? (
          <Panel title="Patrol Coverage">
            <SvgMap height={190} markers={coverage}>
              <MapChrome
                legend={[
                  { color: '#2E9E4D', label: 'Covered' },
                  { color: '#C62828', label: 'Not Covered' },
                ]}
              />
            </SvgMap>
            <View style={s.coverRow}>
              <Text style={s.big}>{cov.averageCoverage}%</Text>
              <Text style={s.small}>
                average coverage across {cov.patrols} patrols ({cov.totalKm} km). {cov.notCoveredPoints} route point{cov.notCoveredPoints === 1 ? '' : 's'} were missed.
              </Text>
            </View>
          </Panel>
        ) : null}

        {con ? (
          <Panel title="Human-Wildlife Conflict Trends" right={<Trend value={con.changePercent} />}>
            <Text style={s.big}>{con.total}</Text>
            <Text style={s.small}>
              conflict alerts, {con.resolvedPercent}% resolved, average {con.avgResponseMinutes} min to acknowledge
            </Text>
            <LineChart labels={con.byPeriod.map((b) => b.label)} values={con.byPeriod.map((b) => b.count)} color="#2E7D32" />
            {con.topZones.length ? (
              <Text style={s.note}>
                Most affected: {con.topZones[0].zone} ({con.topZones[0].count} alerts)
              </Text>
            ) : null}
          </Panel>
        ) : null}
      </Grid>
    </Page>
  );
}

function Trend({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <View style={[s.trend, { backgroundColor: up ? '#FDECEA' : '#E8F5E9' }]}>
      <Feather name={up ? 'arrow-up-right' : 'arrow-down-right'} size={13} color={up ? C.red : C.greenText} />
      <Text style={[s.trendText, { color: up ? C.red : C.greenText }]}>{Math.abs(value)}%</Text>
    </View>
  );
}

const s = StyleSheet.create({
  big: { fontSize: 30, fontWeight: '800', color: C.text },
  small: { fontSize: 12, color: C.muted, marginBottom: 8 },
  note: { fontSize: 12, color: '#455A64', marginTop: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  coverRow: { marginTop: 12 },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  trendText: { fontSize: 12, fontWeight: '800' },
});
