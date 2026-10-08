import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpSyncGateway } from './HttpSyncGateway.js';

describe('HttpSyncGateway', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('posts a patrol successfully', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetch);
    const gateway = new HttpSyncGateway('http://localhost:5000/api/');
    expect(await gateway.synchronizePatrol({ id: 'p1', rangerId: 'r1' })).toEqual({ success: true });
    expect(fetch.mock.calls[0][0]).toBe('http://localhost:5000/api/patrols/sync');
    expect(fetch.mock.calls[0][1].headers['X-User-Id']).toBe('r1');
  });

  it('reports non-2xx and network errors as failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    expect(await new HttpSyncGateway('http://api').synchronizePatrol({})).toMatchObject({ success: false });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await new HttpSyncGateway('http://api').synchronizePatrol({})).toEqual({ success: false, message: 'offline' });
  });

  it('checks API connectivity and respects the developer offline switch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    const gateway = new HttpSyncGateway('http://api');
    expect(await gateway.isOnline()).toBe(true);
    gateway.simulateOffline = true;
    expect(await gateway.isOnline()).toBe(false);
    expect(await gateway.synchronizePatrol({})).toMatchObject({ success: false });
  });
});
