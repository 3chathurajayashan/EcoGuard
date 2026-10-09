import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Page, Panel } from '@/components/admin-ui';
import CriteriaForm from '@/components/analytics-form';
import { Banner, Button, Loading } from '@/components/kit';
import { fetchOptions, setFlow, useFlow, type Criteria } from '@/utils/analytics';
import { useLoad } from '@/utils/use-load';

/** Refine Analysis: change the criteria and run it again. */
export default function RefineAnalysis() {
  const flow = useFlow();
  const { data: options, loading, error, reload } = useLoad(fetchOptions);
  const [criteria, setCriteria] = useState<Criteria>(flow.criteria);
  const [problem, setProblem] = useState('');

  const update = () => {
    if (!criteria.categories.length) {
      setProblem('Select at least one analysis category.');
      return;
    }
    setFlow({ criteria, results: null });
    router.replace('/analytics/processing');
  };

  return (
    <Page title="Refine Analysis" subtitle="Adjust the criteria to get a more focused view." back="/analytics/results">
      {error ? <Banner tone="red" text={error} action={{ label: 'Retry', onPress: reload }} /> : null}
      <View style={s.narrow}>
        <Panel>
          {loading && !options ? (
            <Loading />
          ) : options ? (
            <>
              <CriteriaForm
                value={criteria}
                options={options}
                onChange={(c) => {
                  setCriteria(c);
                  setProblem('');
                }}
                error={problem}
              />
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Button label="Reset" tone="outline" onPress={() => setCriteria(flow.criteria)} />
                </View>
                <View style={{ flex: 2 }}>
                  <Button label="Update Analysis" icon="refresh-cw" onPress={update} />
                </View>
              </View>
            </>
          ) : null}
        </Panel>
      </View>
    </Page>
  );
}

const s = StyleSheet.create({
  narrow: { width: '100%', maxWidth: 560 },
  row: { flexDirection: 'row', gap: 12, marginTop: 20 },
});
