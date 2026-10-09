import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Page, Panel } from '@/components/admin-ui';
import CriteriaForm from '@/components/analytics-form';
import { Banner, Button, Loading } from '@/components/kit';
import { fetchOptions, setFlow, useFlow, type Criteria } from '@/utils/analytics';
import { useLoad } from '@/utils/use-load';

/** Select Analysis Criteria. */
export default function SelectCriteria() {
  const flow = useFlow();
  const { data: options, loading, error, reload } = useLoad(fetchOptions);
  const [criteria, setCriteria] = useState<Criteria>(flow.criteria);
  const [problem, setProblem] = useState('');

  const analyze = () => {
    if (!criteria.categories.length) {
      setProblem('Select at least one analysis category.');
      return;
    }
    setFlow({ criteria, results: null, report: null });
    router.push('/analytics/processing');
  };

  return (
    <Page title="Select Analysis Criteria" subtitle="Choose the park, time period and categories to analyze." back="/analytics">
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
              <View style={{ height: 18 }} />
              <Button label="Analyze" icon="arrow-right" onPress={analyze} />
            </>
          ) : null}
        </Panel>
      </View>
    </Page>
  );
}

const s = StyleSheet.create({
  narrow: { width: '100%', maxWidth: 560 },
});
