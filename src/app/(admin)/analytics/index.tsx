import { router } from 'expo-router';
import React from 'react';

import { ActionCard, Grid, Page } from '@/components/admin-ui';
import { resetFlow, setFlow, useFlow } from '@/utils/analytics';

/** Analytics & Reports section: what would you like to look at? */
export default function AnalyticsHome() {
  const flow = useFlow();

  // Each card starts the same flow with the right category preselected
  const start = (categories: string[]) => {
    resetFlow();
    setFlow({ criteria: { ...flow.criteria, categories }, results: null, report: null });
    router.push('/analytics/criteria');
  };

  return (
    <Page title="Conservation Analytics & Reports" subtitle="Analyze data, identify patterns and generate statistical reports for better decision making.">
      <Grid min={320}>
        <ActionCard icon="bar-chart-2" title="Incident Statistics" text="View incident numbers, trends and hotspots" onPress={() => start(['hotspots'])} />
        <ActionCard icon="map" title="Patrol Coverage" text="Analyze patrol routes and coverage areas" onPress={() => start(['coverage'])} />
        <ActionCard icon="trending-up" title="Human-Wildlife Conflict Trends" text="View conflict reports and trends over time" tone="orange" onPress={() => start(['conflict'])} />
        <ActionCard
          icon="file-text"
          title="Generate Report"
          text="Create and export statistical reports"
          tone="blue"
          onPress={() => {
            resetFlow();
            router.push('/analytics/criteria');
          }}
        />
      </Grid>
    </Page>
  );
}
