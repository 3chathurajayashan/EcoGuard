import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Grid, Page, Panel } from '@/components/admin-ui';
import { Banner, Button, C, Pill, fmtDate } from '@/components/kit';
import { createReport, setFlow, summaryLines, updateReport, useFlow } from '@/utils/analytics';
import { errorMessage } from '@/utils/http';

/** Statistical Conservation Report: preview, then generate. */
export default function ReportPreview() {
  const { results, report, criteria } = useFlow();
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (!results) router.replace('/analytics/criteria');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!results) return <Page title="Statistical Conservation Report">{null}</Page>;

  const shown = report?.results ?? results;
  const included = [
    'Incident Statistics',
    shown.hotspots ? 'Hotspot Findings' : null,
    shown.patrolCoverage ? 'Patrol Coverage Summary' : null,
    shown.conflictTrends ? 'Human-Wildlife Conflict Trends' : null,
  ].filter(Boolean) as string[];
  const s1 = shown.incidentStatistics;

  const generate = async () => {
    setBusy(true);
    setProblem('');
    try {
      const created = await createReport(criteria);
      setFlow({ report: created });
      router.push('/analytics/export');
    } catch (e) {
      setProblem(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  // Update Report: run the analysis again (with the current criteria) and refresh the stored report
  const update = async () => {
    if (!report) return;
    setBusy(true);
    setProblem('');
    try {
      const next = await updateReport(report._id, criteria);
      setFlow({ report: next, results: next.results });
      setUpdated(true);
    } catch (e) {
      setProblem(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page
      title="Statistical Conservation Report"
      subtitle={`Park: ${shown.criteria.park}   |   Period: ${shown.criteria.periodLabel}`}
      back="/analytics/results"
      right={<Pill label={report ? (report.status === 'UPDATED' ? 'UPDATED' : 'GENERATED') : 'DRAFT'} tone={report ? 'green' : 'orange'} />}>
      {problem ? <Banner tone="red" text={problem} /> : null}
      {updated ? <Banner tone="green" text="Report updated with the latest data." /> : null}

      <Grid min={320}>
        <View style={s.cover}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=75&w=700' }} style={s.coverImg} />
          <View style={s.coverShade} />
          <View style={s.coverTop}>
            <View style={s.coverLogo}>
              <Ionicons name="paw" size={18} color="#FFF" />
            </View>
            <Text style={s.coverBrand}>WildLife Conservation</Text>
          </View>
          <View style={s.coverBottom}>
            <Text style={s.coverTitle}>Conservation{'\n'}Report</Text>
            <Text style={s.coverPark}>{shown.criteria.park}</Text>
            <Text style={s.coverDate}>{fmtDate(shown.generatedAt)}</Text>
          </View>
        </View>

        <View>
          <Panel title="Report Includes">
            {included.map((name, i) => (
              <View key={name} style={s.row}>
                <Text style={s.num}>{i + 1}.</Text>
                <Text style={s.item}>{name}</Text>
              </View>
            ))}
          </Panel>
          <Panel>
            <View style={s.total}>
              <View style={s.totalIcon}>
                <Feather name="bar-chart-2" size={24} color={C.greenDark} />
              </View>
              <View>
                <Text style={s.totalLabel}>Total Incidents</Text>
                <Text style={s.totalValue}>{s1.total}</Text>
                <Text style={[s.totalHint, { color: s1.changePercent >= 0 ? C.red : C.greenText }]}>
                  {s1.changePercent >= 0 ? '↑' : '↓'} {Math.abs(s1.changePercent)}% compared to previous period
                </Text>
              </View>
            </View>
          </Panel>
        </View>
      </Grid>

      {showPreview ? (
        <Panel title="Report Preview">
          {summaryLines(shown).map((line) => (
            <View key={line} style={s.row}>
              <Text style={s.num}>•</Text>
              <Text style={[s.item, { flex: 1 }]}>{line}</Text>
            </View>
          ))}
        </Panel>
      ) : null}

      <View style={s.buttons}>
        <View style={{ flex: 1, minWidth: 160 }}>
          <Button label={showPreview ? 'Hide Preview' : 'Preview Report'} icon="eye" tone="outline" onPress={() => setShowPreview((v) => !v)} />
        </View>
        {report ? (
          <View style={{ flex: 1, minWidth: 160 }}>
            <Button label="Update Report" icon="refresh-cw" tone="outline" loading={busy} onPress={update} />
          </View>
        ) : null}
        <View style={{ flex: 1, minWidth: 160 }}>
          {report ? (
            <Button label="Export Report" icon="download" onPress={() => router.push('/analytics/export')} />
          ) : (
            <Button label="Generate Report" icon="file-text" loading={busy} onPress={generate} />
          )}
        </View>
      </View>
    </Page>
  );
}

const s = StyleSheet.create({
  cover: { height: 340, borderRadius: 14, overflow: 'hidden', justifyContent: 'space-between', backgroundColor: '#1E5631' },
  coverImg: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  coverShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,60,34,0.4)' },
  coverTop: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 },
  coverLogo: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  coverBrand: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  coverBottom: { padding: 18, backgroundColor: 'rgba(255,255,255,0.88)' },
  coverTitle: { fontSize: 24, fontWeight: '800', color: C.greenDark, lineHeight: 28 },
  coverPark: { fontSize: 13, color: '#37474F', marginTop: 4 },
  coverDate: { fontSize: 11, color: C.muted, marginTop: 2, textAlign: 'right' },
  row: { flexDirection: 'row', gap: 8, paddingVertical: 5 },
  num: { fontSize: 13, color: C.muted, width: 18 },
  item: { fontSize: 14, color: C.text },
  total: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  totalIcon: { width: 54, height: 54, borderRadius: 14, backgroundColor: '#E3EFE5', alignItems: 'center', justifyContent: 'center' },
  totalLabel: { fontSize: 12, color: C.muted },
  totalValue: { fontSize: 34, fontWeight: '800', color: C.text },
  totalHint: { fontSize: 12, fontWeight: '700' },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 },
});
