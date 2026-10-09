import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Page, Panel } from '@/components/admin-ui';
import { Banner, C, Empty, Loading, Pill, fmtDateTime, type Tone } from '@/components/kit';
import SvgMap, { MapChrome } from '@/components/svg-map';
import { fetchIncidents, type IncidentRow } from '@/utils/operations';
import { useLoad } from '@/utils/use-load';

const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low'] as const;
const TONE: Record<string, Tone> = { Critical: 'red', High: 'red', Medium: 'orange', Low: 'gray' };
const HEAT = { Critical: 'High', High: 'High', Medium: 'Medium', Low: 'Low' } as const;

export default function IncidentManagement() {
  const [filter, setFilter] = useState<(typeof SEVERITIES)[number]>('All');
  const [open, setOpen] = useState<string | null>(null);
  const { data, loading, error, reload } = useLoad(fetchIncidents);

  const shown = (data ?? []).filter((i) => filter === 'All' || i.severity === filter);
  const heat = useMemo(
    () =>
      shown.map((i) => ({
        latitude: i.location.coordinates[1],
        longitude: i.location.coordinates[0],
        level: HEAT[i.severity] ?? 'Low',
        weight: 1,
      })),
    [shown],
  );

  return (
    <Page title="Incident Management" subtitle="Incidents reported by rangers in the field.">
      {error ? <Banner tone="red" text={error} action={{ label: 'Retry', onPress: reload }} /> : null}
      {loading && !data ? (
        <Loading />
      ) : (
        <>
          <Panel title="Incident map">
            <SvgMap height={220} heat={heat}>
              <MapChrome
                legend={[
                  { color: '#E53935', label: 'High / Critical' },
                  { color: '#FB8C00', label: 'Medium' },
                  { color: '#FDD835', label: 'Low' },
                ]}
              />
            </SvgMap>
          </Panel>

          <View style={s.chips}>
            {SEVERITIES.map((sev) => (
              <TouchableOpacity key={sev} style={[s.chip, filter === sev && s.chipOn]} onPress={() => setFilter(sev)}>
                <Text style={[s.chipText, filter === sev && { color: '#FFF' }]}>
                  {sev}
                  {sev === 'All' ? ` (${data?.length ?? 0})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Panel>
            {shown.length === 0 ? (
              <Empty icon="file-text" text="No incidents match this filter." />
            ) : (
              shown.map((i) => <IncidentItem key={i._id} incident={i} open={open === i._id} onToggle={() => setOpen(open === i._id ? null : i._id)} />)
            )}
          </Panel>
        </>
      )}
    </Page>
  );
}

function IncidentItem({ incident: i, open, onToggle }: { incident: IncidentRow; open: boolean; onToggle: () => void }) {
  return (
    <View style={s.item}>
      <TouchableOpacity style={s.head} onPress={onToggle} activeOpacity={0.8}>
        {i.evidence[0] ? <Image source={{ uri: i.evidence[0].url }} style={s.thumb} /> : <View style={[s.thumb, s.noThumb]} />}
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{i.incidentType}</Text>
          <Text style={s.sub}>
            {fmtDateTime(i.createdAt)} · {i.location.coordinates[1].toFixed(4)}, {i.location.coordinates[0].toFixed(4)}
          </Text>
        </View>
        <Pill label={i.severity} tone={TONE[i.severity] ?? 'gray'} />
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#8A9A90" />
      </TouchableOpacity>
      {open ? (
        <View style={s.body}>
          <Text style={s.desc}>{i.description}</Text>
          <View style={s.photos}>
            {i.evidence.map((e, n) => (
              <Image key={`${e.url}-${n}`} source={{ uri: e.url }} style={s.photo} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1.5, borderColor: '#CFD8D2', backgroundColor: '#FFF' },
  chipOn: { backgroundColor: C.green, borderColor: C.green },
  chipText: { fontSize: 13, color: '#455A64', fontWeight: '600' },
  item: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E3E8E3' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  thumb: { width: 54, height: 44, borderRadius: 8, backgroundColor: '#DDD' },
  noThumb: { backgroundColor: '#ECEFF1' },
  title: { fontSize: 14, fontWeight: '700', color: C.text },
  sub: { fontSize: 11, color: C.muted, marginTop: 2 },
  body: { paddingBottom: 12, paddingLeft: 66 },
  desc: { fontSize: 13, color: '#455A64', lineHeight: 19 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  photo: { width: 120, height: 84, borderRadius: 8, backgroundColor: '#DDD' },
});
