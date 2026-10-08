import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrowserGpsService } from './BrowserGpsService.js';
import { FakeGpsService } from './FakeGpsService.js';

afterEach(() => vi.unstubAllGlobals());

describe('BrowserGpsService', () => {
  it('starts, stops, and resumes browser watch tracking', async () => {
    const geo = { watchPosition: vi.fn().mockReturnValue(7), clearWatch: vi.fn(), getCurrentPosition: vi.fn() };
    vi.stubGlobal('navigator', Object.assign(Object.create(navigator), { geolocation: geo }));
    const gps = new BrowserGpsService();
    await gps.startTracking();
    await gps.startTracking();
    expect(geo.watchPosition).toHaveBeenCalledOnce();
    await gps.stopTracking();
    expect(geo.clearWatch).toHaveBeenCalledWith(7);
    await gps.resumeAutoTracking();
    expect(geo.watchPosition).toHaveBeenCalledTimes(2);
    await gps.stopTracking();
  });

  it('resolves current coordinates and rejects geolocation errors', async () => {
    const geo = { watchPosition: vi.fn(), clearWatch: vi.fn(), getCurrentPosition: vi.fn((success) => success({ coords: { latitude: 2, longitude: 3, altitude: 4 } })) };
    vi.stubGlobal('navigator', Object.assign(Object.create(navigator), { geolocation: geo }));
    const gps = new BrowserGpsService();
    await expect(gps.getCurrentLocation()).resolves.toEqual({ latitude: 2, longitude: 3, altitude: 4 });
    geo.getCurrentPosition.mockImplementationOnce((success, error) => error({ message: 'Permission denied' }));
    await expect(gps.getCurrentLocation()).rejects.toThrow('Permission denied');
  });

  it('reports unsupported browser geolocation', async () => {
    vi.stubGlobal('navigator', Object.create(null));
    const gps = new BrowserGpsService();
    await expect(gps.startTracking()).rejects.toThrow(/unavailable/);
    await expect(gps.getCurrentLocation()).rejects.toThrow(/unavailable/);
    await gps.stopTracking();
  });
});

describe('FakeGpsService', () => {
  it('cycles deterministic positions, tracks, and resumes', async () => {
    const gps = new FakeGpsService([{ latitude: 1, longitude: 2 }, { latitude: 3, longitude: 4 }]);
    await gps.startTracking();
    expect(gps.tracking).toBe(true);
    expect(await gps.getCurrentLocation()).toMatchObject({ latitude: 1 });
    expect(await gps.getCurrentLocation()).toMatchObject({ latitude: 3 });
    expect(await gps.getCurrentLocation()).toMatchObject({ latitude: 1 });
    await gps.stopTracking();
    expect(gps.tracking).toBe(false);
    await gps.resumeAutoTracking();
    expect(gps.tracking).toBe(true);
  });

  it('can emulate a GPS failure', async () => {
    const gps = new FakeGpsService();
    gps.error = new Error('GPS denied');
    await expect(gps.getCurrentLocation()).rejects.toThrow('GPS denied');
  });
});
