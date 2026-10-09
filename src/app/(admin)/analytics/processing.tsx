import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Page, Panel } from '@/components/admin-ui';
import { Banner, Button, C } from '@/components/kit';
import { analyze, setFlow, useFlow } from '@/utils/analytics';
import { errorMessage } from '@/utils/http';

const STEPS = [
  'Retrieving patrol records...',
  'Retrieving incident records...',
  'Retrieving community conflict data...',
  'Analyzing and generating insights...',
];

/** Analyzing Conservation Data: the progress screen while the server works. */
export default function Processing() {
  const flow = useFlow();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // The analysis itself is quick; the steps are paced so the progress is readable
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 700);
    const minimum = new Promise((resolve) => setTimeout(resolve, 2400));

    Promise.all([analyze(flow.criteria), minimum])
      .then(([results]) => {
        clearInterval(timer);
        setStep(STEPS.length);
        setFlow({ results });
        setTimeout(() => router.replace('/analytics/results'), 350);
      })
      .catch((e) => {
        clearInterval(timer);
        setError(errorMessage(e));
      });

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const percent = Math.round((Math.min(step, STEPS.length) / STEPS.length) * 100);

  return (
    <Page title="Analyzing Conservation Data">
      <View style={s.narrow}>
        <Panel>
          {error ? (
            <>
              <Banner tone="red" text={error} />
              <View style={{ height: 14 }} />
              <Button label="Back to criteria" tone="outline" onPress={() => router.replace('/analytics/criteria')} />
            </>
          ) : (
            <>
              <View style={s.gears}>
                <Feather name="settings" size={70} color={C.greenDark} />
                <Feather name="settings" size={44} color="#9AA9A0" style={{ marginLeft: -8, marginTop: 30 }} />
              </View>
              <View style={s.track}>
                <View style={[s.fill, { width: `${percent}%` }]} />
              </View>
              <Text style={s.percent}>{percent}%</Text>
              <Text style={s.processing}>Processing data...</Text>

              {STEPS.map((text, i) => (
                <View key={text} style={s.step}>
                  {i < step ? (
                    <View style={s.done}>
                      <Feather name="check" size={13} color="#FFF" />
                    </View>
                  ) : i === step ? (
                    <ActivityIndicator size="small" color={C.green} />
                  ) : (
                    <View style={s.pending} />
                  )}
                  <Text style={[s.stepText, i > step && { color: '#9AA9A0' }]}>{text}</Text>
                </View>
              ))}

              <View style={s.info}>
                <Feather name="info" size={16} color={C.blue} />
                <Text style={s.infoText}>This may take a few moments. You can continue to stay on this page.</Text>
              </View>
            </>
          )}
        </Panel>
      </View>
    </Page>
  );
}

const s = StyleSheet.create({
  narrow: { width: '100%', maxWidth: 560 },
  gears: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10 },
  track: { height: 10, borderRadius: 5, backgroundColor: '#DDE6DF', overflow: 'hidden', marginTop: 14 },
  fill: { height: 10, backgroundColor: '#2E9E4D' },
  percent: { textAlign: 'right', fontSize: 12, color: C.muted, marginTop: 4 },
  processing: { textAlign: 'center', fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 14 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  done: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#2E9E4D', alignItems: 'center', justifyContent: 'center' },
  pending: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#C5CFC8' },
  stepText: { fontSize: 14, color: C.text },
  info: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EAF1F8', borderRadius: 10, padding: 12, marginTop: 14 },
  infoText: { flex: 1, fontSize: 12, color: '#37506E' },
});
