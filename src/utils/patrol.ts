import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { http } from './http';

// ───────────────────────────── types ─────────────────────────────

export interface RoutePoint {
  name?: string;
  latitude: number;
  longitude: number;
}

export interface PatrolRoute {
  _id: string;
  name: string;
  parkName: string;
  startPoint: RoutePoint;
  endPoint: RoutePoint;
  distanceKm: number;
  estimatedDurationMinutes: number;
  routePoints: RoutePoint[];
  expectedWaypoints?: number;
}

export interface Assignment {
  _id: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
  assignedDate: string;
  route: PatrolRoute;
}

export interface Waypoint {
  waypointId: string;
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: string;
  type: 'AUTOMATIC' | 'MANUAL';
  category: string;
  description: string;
}

export type GpsState = 'searching' | 'ok' | 'unavailable';

export interface ActivePatrol {
  patrolId: string;
  assignmentId: string;
  route: PatrolRoute;
  startTime: string;
  endTime?: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  syncStatus: 'PENDING_SYNC' | 'SYNCED';
  /** kilometres */
  totalDistanceKm: number;
  waypoints: Waypoint[];
  /** Demo mode: positions are generated along the route instead of read from GPS */
  simulate: boolean;
  gps: GpsState;
  syncError?: string;
}

export const OBSERVATION_TYPES = ['Observation', 'Animal Sighting', 'Sign / Tracks', 'Illegal Activity', 'Water Source', 'Other'];

// ───────────────────────────── helpers ─────────────────────────────

export function uuid4(): string {
  const c = (globalThis as any).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function distanceMetres(a: RoutePoint, b: RoutePoint) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

/** Re-renders every `ms` so elapsed times keep ticking. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

// ───────────────────────────── server calls ─────────────────────────────

export async function fetchMyAssignment(): Promise<Assignment | null> {
  const response = await http.get<{ assignment: Assignment | null }>('/patrol-assignments/mine');
  return response.data.assignment;
}

// ───────────────────────────── active patrol store ─────────────────────────────

const ACTIVE_KEY = '@active_patrol_v1';
const QUEUE_KEY = '@pending_patrols_v1';

interface FinishedDto {
  patrolId: string;
  assignmentId: string;
  startTime: string;
  endTime: string;
  status: 'COMPLETED';
  syncStatus: 'PENDING_SYNC';
  totalDistance: number;
  waypoints: Waypoint[];
}

let current: ActivePatrol | null = null;
let loaded = false;
const listeners = new Set<() => void>();
const sentIds = new Set<string>();
let tracker: { stop: () => void } | null = null;
let pushTimer: ReturnType<typeof setInterval> | null = null;

const emit = () => listeners.forEach((l) => l());

async function persist() {
  try {
    if (current) await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(current));
    else await AsyncStorage.removeItem(ACTIVE_KEY);
  } catch {
    // storage unavailable: the patrol still works for this session
  }
}

function set(next: ActivePatrol | null) {
  current = next;
  emit();
  void persist();
}

function patch(change: Partial<ActivePatrol>) {
  if (!current) return;
  set({ ...current, ...change });
}

export async function loadActivePatrol() {
  if (loaded) return current;
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_KEY);
    if (raw) {
      current = JSON.parse(raw) as ActivePatrol;
      emit();
      // a patrol that was running when the app closed carries on tracking
      if (current.status === 'IN_PROGRESS') startTracker();
    }
  } catch {
    // ignore unreadable storage
  }
  return current;
}

export function getActivePatrol() {
  return current;
}

export function useActivePatrol() {
  useEffect(() => {
    void loadActivePatrol();
  }, []);
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => current,
  );
}

function addWaypointInternal(w: Waypoint) {
  if (!current || current.status !== 'IN_PROGRESS') return;
  const last = current.waypoints[current.waypoints.length - 1];
  let add = 0;
  if (last) {
    const m = distanceMetres(last, w);
    // ignore GPS jumps of more than 2 km between two fixes
    if (m < 2000) add = m / 1000;
  }
  patch({ waypoints: [...current.waypoints, w], totalDistanceKm: current.totalDistanceKm + add });
}

// ───────────────────────────── tracking ─────────────────────────────

function startTracker() {
  stopTracker();
  if (!current || current.status !== 'IN_PROGRESS') return;

  pushTimer = setInterval(() => void pushLiveWaypoints(), 20000);

  if (current.simulate) {
    const path = current.route.routePoints.length ? current.route.routePoints : [current.route.startPoint, current.route.endPoint];
    const seg = path.slice(1).map((p, i) => distanceMetres(path[i], p));
    const total = seg.reduce((a, b) => a + b, 0) || 1;
    const scale = (current.route.distanceKm * 1000) / total; // make distances match the route length
    let travelled = (current.waypoints.length ? current.waypoints.length : 0) * (total / 24);
    patch({ gps: 'ok' });
    const timer = setInterval(() => {
      if (!current) return;
      travelled = Math.min(travelled + total / 24, total);
      let left = travelled;
      let i = 0;
      while (i < seg.length - 1 && left > seg[i]) {
        left -= seg[i];
        i += 1;
      }
      const f = seg[i] ? left / seg[i] : 0;
      const a = path[i];
      const b = path[i + 1] ?? path[i];
      const jitter = () => (Math.random() - 0.5) * 0.00008;
      const w: Waypoint = {
        waypointId: uuid4(),
        latitude: a.latitude + (b.latitude - a.latitude) * f + jitter(),
        longitude: a.longitude + (b.longitude - a.longitude) * f + jitter(),
        altitude: 40 + Math.round(Math.random() * 6),
        timestamp: new Date().toISOString(),
        type: 'AUTOMATIC',
        category: '',
        description: '',
      };
      const last = current.waypoints[current.waypoints.length - 1];
      const step = last ? distanceMetres(last, w) : 0;
      addWaypointInternal(w);
      // scale the distance so the demo numbers match the real trail length
      if (current && step) patch({ totalDistanceKm: current.totalDistanceKm + (step * (scale - 1)) / 1000 });
    }, 2500);
    tracker = { stop: () => clearInterval(timer) };
    return;
  }

  let stopped = false;
  let subscription: Location.LocationSubscription | null = null;
  let lastFix = Date.now();
  patch({ gps: 'searching' });

  // No fix for a while means the signal is gone (canopy, valley): tell the ranger and keep trying
  const watchdog = setInterval(() => {
    if (current && Date.now() - lastFix > 25000 && current.gps !== 'unavailable') patch({ gps: 'unavailable' });
  }, 5000);

  (async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        if (!stopped) patch({ gps: 'unavailable' });
        return;
      }
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 8000, distanceInterval: 8 },
        (loc) => {
          lastFix = Date.now();
          if (current && current.gps !== 'ok') patch({ gps: 'ok' });
          addWaypointInternal({
            waypointId: uuid4(),
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude ?? 0,
            timestamp: new Date(loc.timestamp).toISOString(),
            type: 'AUTOMATIC',
            category: '',
            description: '',
          });
        },
      );
      if (stopped) subscription.remove();
    } catch {
      if (!stopped) patch({ gps: 'unavailable' });
    }
  })();

  tracker = {
    stop: () => {
      stopped = true;
      clearInterval(watchdog);
      subscription?.remove();
    },
  };
}

function stopTracker() {
  tracker?.stop();
  tracker = null;
  if (pushTimer) clearInterval(pushTimer);
  pushTimer = null;
}

/** Sends recorded GPS points to the central system while the patrol runs (best effort). */
async function pushLiveWaypoints() {
  if (!current || current.status !== 'IN_PROGRESS') return;
  const fresh = current.waypoints.filter((w) => !sentIds.has(w.waypointId));
  if (!fresh.length) return;
  try {
    await http.post(`/patrols/${current.patrolId}/waypoints`, { waypoints: fresh });
    fresh.forEach((w) => sentIds.add(w.waypointId));
  } catch {
    // offline or server busy: they go up with the final sync
  }
}

// ───────────────────────────── actions ─────────────────────────────

export async function beginPatrol(assignment: Assignment, simulate: boolean) {
  sentIds.clear();
  const startTime = new Date().toISOString();
  const patrolId = uuid4();
  set({
    patrolId,
    assignmentId: assignment._id,
    route: assignment.route,
    startTime,
    status: 'IN_PROGRESS',
    syncStatus: 'PENDING_SYNC',
    totalDistanceKm: 0,
    waypoints: [],
    simulate,
    gps: 'searching',
  });
  startTracker();

  // Tell the central system the patrol has started (it is also sent with the final sync)
  try {
    await http.post('/patrols/start', {
      patrolId,
      assignmentId: assignment._id,
      startTime,
      latitude: assignment.route.startPoint.latitude,
      longitude: assignment.route.startPoint.longitude,
    });
  } catch {
    // offline: the final sync carries everything
  }
}

export function addManualWaypoint(input: { category: string; description: string; latitude: number; longitude: number; time: Date }) {
  addWaypointInternal({
    waypointId: uuid4(),
    latitude: input.latitude,
    longitude: input.longitude,
    altitude: 0,
    timestamp: input.time.toISOString(),
    type: 'MANUAL',
    category: input.category,
    description: input.description.trim(),
  });
}

export function dismissGpsNotice() {
  // The notice is only a message; tracking keeps retrying in the background
  if (current && current.gps === 'unavailable') patch({ gps: 'searching' });
}

function toDto(p: ActivePatrol): FinishedDto {
  return {
    patrolId: p.patrolId,
    assignmentId: p.assignmentId,
    startTime: p.startTime,
    endTime: p.endTime ?? new Date().toISOString(),
    status: 'COMPLETED',
    syncStatus: 'PENDING_SYNC',
    totalDistance: Math.round(p.totalDistanceKm * 100) / 100,
    waypoints: p.waypoints,
  };
}

async function readQueue(): Promise<FinishedDto[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: FinishedDto[]) {
  try {
    if (queue.length) await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    else await AsyncStorage.removeItem(QUEUE_KEY);
  } catch {
    // keep going
  }
}

export async function pendingPatrolCount() {
  return (await readQueue()).length;
}

/** Sends every finished patrol that has not reached the server yet. Returns how many were sent. */
export async function syncFinishedPatrols(): Promise<number> {
  const queue = await readQueue();
  if (!queue.length) return 0;
  const network = await Network.getNetworkStateAsync().catch(() => null);
  if (network?.isConnected === false) return 0;

  const remaining: FinishedDto[] = [];
  let sent = 0;
  for (const dto of queue) {
    try {
      await http.post('/patrols/sync', dto);
      sent += 1;
      if (current?.patrolId === dto.patrolId) patch({ syncStatus: 'SYNCED', syncError: undefined });
    } catch (error) {
      const refused = axios.isAxiosError(error) && !!error.response && error.response.status < 500 && error.response.status !== 401;
      if (refused) {
        // The server will never accept this one, so do not retry forever
        if (current?.patrolId === dto.patrolId) patch({ syncError: (error.response?.data as any)?.message ?? 'The server refused this patrol.' });
      } else {
        remaining.push(dto);
      }
    }
  }
  await writeQueue(remaining);
  return sent;
}

/** Ends the patrol, stores it for sync and tries to send it right away. */
export async function endPatrol() {
  if (!current) return;
  stopTracker();
  await pushLiveWaypoints();
  patch({ status: 'COMPLETED', endTime: new Date().toISOString(), syncStatus: 'PENDING_SYNC' });
  if (!current) return;
  const queue = await readQueue();
  queue.push(toDto(current));
  await writeQueue(queue);
  await syncFinishedPatrols();
}

/** Leaves the "Patrol completed" screen. Anything not yet synced stays queued. */
export function clearFinishedPatrol() {
  if (current?.status === 'COMPLETED') set(null);
}

export function isTracking() {
  return tracker !== null;
}

// ───────────────────────────── coordinates ─────────────────────────────

/** 6.3748 -> `06°22'29" N`, as printed on the wireframes. */
export function dms(value: number, axis: 'lat' | 'lon') {
  const abs = Math.abs(value);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const sec = Math.floor(((abs - d) * 60 - m) * 60);
  const dir = axis === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
  return `${String(d).padStart(2, '0')}°${String(m).padStart(2, '0')}'${String(sec).padStart(2, '0')}" ${dir}`;
}

function checkRange(latitude: number, longitude: number) {
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null;
}

/** Reads "6.3748, 81.5262" or `06°22'29" N 081°31'34" E` into coordinates. */
export function parseCoordinates(text: string): { latitude: number; longitude: number } | null {
  const decimal = /^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*$/.exec(text);
  if (decimal) return checkRange(Number(decimal[1]), Number(decimal[2]));

  const parts = [...text.matchAll(/(\d+)\s*[°d ]\s*(\d+)\s*['′m ]\s*(\d+(?:\.\d+)?)\s*["″s ]?\s*([NSEWnsew])/g)];
  if (parts.length === 2) {
    const value = (m: RegExpMatchArray) => {
      const v = Number(m[1]) + Number(m[2]) / 60 + Number(m[3]) / 3600;
      return /[SWsw]/.test(m[4]) ? -v : v;
    };
    const lat = parts.find((m) => /[NSns]/.test(m[4]));
    const lon = parts.find((m) => /[EWew]/.test(m[4]));
    if (lat && lon) return checkRange(value(lat), value(lon));
  }
  return null;
}
