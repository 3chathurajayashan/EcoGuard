import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { within } from '@testing-library/dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const { mockedContext } = vi.hoisted(() => ({ mockedContext: { current: null } }));
vi.mock('../PatrolContext.jsx', () => ({ usePatrolController: () => mockedContext.current }));

import { AddWaypointPage } from './AddWaypointPage.jsx';
import { PatrolPage } from './PatrolPage.jsx';

describe('Patrol screens', () => {
  beforeEach(() => {
    mockedContext.current = {
      controller: { saveManualWaypoint: vi.fn().mockResolvedValue(true), retryPendingSync: vi.fn() },
      state: { lastLocation: { latitude: 1, longitude: 2, altitude: 10 }, patrol: null, assignment: null, pendingPatrols: [] },
      role: 'Ranger',
    };
  });

  it('requires a description and does not render a Type dropdown', () => {
    render(<MemoryRouter><AddWaypointPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Save waypoint' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: /Description/ })).toBeRequired();
    expect(screen.queryByLabelText('Type')).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: /Description/ }), { target: { value: 'Tracks by the stream' } });
    expect(screen.getByRole('button', { name: 'Save waypoint' })).toBeEnabled();
  });

  it('does not complete a patrol until confirmed and Cancel leaves tracking active', async () => {
    mockedContext.current.state.assignment = { route: { name: 'Ridge', expectedWaypoints: [] } };
    mockedContext.current.state.patrol = {
      status: 'IN_PROGRESS', assignment: mockedContext.current.state.assignment, startedAt: new Date().toISOString(),
      waypoints: [], totalDistance: 0, syncStatus: 'NOT_SYNCED',
    };
    render(<MemoryRouter initialEntries={['/patrol']}><Routes><Route path="/patrol" element={<PatrolPage />} /></Routes></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'End patrol' }));
    expect(screen.getByRole('dialog')).toBeVisible();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText('PATROL IN PROGRESS')).toBeVisible();
    expect(mockedContext.current.controller.completePatrol).toBeUndefined();
  });

  it('provides Retry now for pending sync from completed summary', () => {
    mockedContext.current.state.patrol = {
      status: 'COMPLETED', assignment: { route: { name: 'Ridge', expectedWaypoints: [] } },
      completedAt: new Date().toISOString(), startedAt: new Date().toISOString(), waypoints: [],
      totalDistance: 0, syncStatus: 'PENDING_SYNC',
    };
    render(<MemoryRouter initialEntries={['/patrol/summary']}><Routes><Route path="/patrol/summary" element={<PatrolPage />} /></Routes></MemoryRouter>);
    expect(document.querySelector('.sync-state').textContent).toMatch(/Pending Sync/);
    fireEvent.click(screen.getByRole('button', { name: 'Retry now' }));
    expect(mockedContext.current.controller.retryPendingSync).toHaveBeenCalledOnce();
    expect(document.querySelector('.sync-state').textContent.match(/Syncing|Synced|Pending Sync/g)).toHaveLength(1);
  });
});
