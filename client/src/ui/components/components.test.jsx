import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog.jsx';
import { GpsBanner } from './GpsBanner.jsx';
import { SyncState } from './SyncState.jsx';

describe('shared accessible components', () => {
  it('shows confirm dialog only when open and calls cancel/confirm handlers', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const { rerender } = render(<ConfirmDialog open={false} title="End?" onCancel={onCancel} onConfirm={onConfirm}>Review distance</ConfirmDialog>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(<ConfirmDialog open title="End?" onCancel={onCancel} onConfirm={onConfirm}>Review distance</ConfirmDialog>);
    expect(screen.getByRole('dialog')).toHaveTextContent('Review distance');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('renders and clears persistent GPS warning without blocking content', () => {
    const { rerender } = render(<><GpsBanner message="Permission denied" /><button>Manual waypoint</button></>);
    expect(screen.getByRole('alert')).toHaveTextContent('Manual waypoints are still available');
    expect(screen.getByRole('button', { name: 'Manual waypoint' })).toBeVisible();
    rerender(<><GpsBanner message="" /><button>Manual waypoint</button></>);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders only one synchronization label at a time', () => {
    const { rerender } = render(<SyncState status="PENDING_SYNC" />);
    expect(screen.getByRole('status').textContent).toMatch(/Pending Sync/);
    expect(screen.getByRole('status').textContent.match(/Syncing|Synced|Pending Sync/g)).toHaveLength(1);
    rerender(<SyncState status="SYNCING" />);
    expect(screen.getByRole('status').textContent).toMatch(/Syncing/);
    expect(screen.getByRole('status').textContent.match(/Syncing|Synced|Pending Sync/g)).toHaveLength(1);
    rerender(<SyncState status="SYNCED" />);
    expect(screen.getByRole('status').textContent).toMatch(/Synced/);
    expect(screen.getByRole('status').textContent.match(/Syncing|Synced|Pending Sync/g)).toHaveLength(1);
  });
});
