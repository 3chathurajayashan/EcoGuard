import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Page, Panel } from '@/components/admin-ui';
import { Banner, Button, C } from '@/components/kit';
import { exportReport, shareExportedFile, useFlow, type ExportedFile } from '@/utils/analytics';
import { errorMessage } from '@/utils/http';

const FORMATS = [
  { value: 'PDF', label: 'PDF', icon: 'file-text' as const, color: '#C62828' },
  { value: 'CSV', label: 'CSV', icon: 'list' as const, color: '#2E7D32' },
  { value: 'XLSX', label: 'Excel', icon: 'grid' as const, color: '#1D6F42' },
];

/** Export Report. */
export default function ExportReport() {
  const { report } = useFlow();
  const [format, setFormat] = useState('PDF');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [file, setFile] = useState<ExportedFile | null>(null);

  useEffect(() => {
    if (!report) router.replace('/analytics/report');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!report) return <Page title="Export Report">{null}</Page>;

  const run = async () => {
    setBusy(true);
    setProblem('');
    setFile(null);
    try {
      setFile(await exportReport(report, format));
    } catch (e) {
      setProblem(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Export Report" subtitle="Choose a format to export the report." back="/analytics/report">
      <View style={s.narrow}>
        <Panel>
          {FORMATS.map((f) => (
            <TouchableOpacity key={f.value} style={s.option} onPress={() => setFormat(f.value)} activeOpacity={0.8}>
              <View style={[s.fileIcon, { backgroundColor: `${f.color}1A` }]}>
                <Feather name={f.icon} size={22} color={f.color} />
              </View>
              <Text style={s.optionText}>{f.label}</Text>
              <View style={[s.radio, format === f.value && s.radioOn]}>{format === f.value ? <View style={s.dot} /> : null}</View>
            </TouchableOpacity>
          ))}

          <View style={{ height: 14 }} />
          <Button label="Export" icon="download" onPress={run} loading={busy} />
          {problem ? <View style={{ marginTop: 12 }}><Banner tone="red" text={problem} /></View> : null}

          {file ? (
            <View style={s.success}>
              <View style={s.successIcon}>
                <Feather name="check" size={22} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.successTitle}>Report exported successfully!</Text>
                <Text style={s.successText}>{file.name} is ready for sharing.</Text>
              </View>
            </View>
          ) : null}
          {file ? (
            <View style={s.actions}>
              <View style={{ flex: 1 }}>
                <Button label="View File" icon="eye" tone="outline" small onPress={() => shareExportedFile(file)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Share" icon="share-2" tone="outline" small onPress={() => shareExportedFile(file)} />
              </View>
            </View>
          ) : null}
        </Panel>
      </View>
    </Page>
  );
}

const s = StyleSheet.create({
  narrow: { width: '100%', maxWidth: 520 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E3E8E3' },
  fileIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1, fontSize: 16, fontWeight: '700', color: C.text },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#9AA9A0', alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: C.green },
  dot: { width: 11, height: 11, borderRadius: 6, backgroundColor: C.green },
  success: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#E8F5E9', borderRadius: 12, padding: 14, marginTop: 16 },
  successIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2E9E4D', alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 14, fontWeight: '800', color: '#1B5E20' },
  successText: { fontSize: 12, color: '#3E6B4A', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
});
