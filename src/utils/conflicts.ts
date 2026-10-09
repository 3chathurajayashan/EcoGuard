import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Network from 'expo-network';
import { Platform } from 'react-native';

import { toConflictCase, type BackendAlert, type ConflictCase, type FinalStatus } from './conflict/backend-adapter';
import { http } from './http';

export * from './conflict/backend-adapter';

// ───────────────────────────── alerts ─────────────────────────────

export async function fetchAlerts(params: { active?: boolean; mine?: boolean; status?: string } = {}): Promise<ConflictCase[]> {
  const response = await http.get<{ alerts: BackendAlert[] }>('/conflict-alerts', {
    params: {
      ...(params.active ? { active: 'true' } : {}),
      ...(params.mine ? { mine: 'true' } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  });
  return (response.data.alerts ?? []).map(toConflictCase);
}

export async function fetchAlert(id: string): Promise<ConflictCase> {
  const response = await http.get<{ alert: BackendAlert }>(`/conflict-alerts/${id}`);
  return toConflictCase(response.data.alert);
}

export async function acknowledgeAlert(id: string) {
  await http.patch(`/conflict-alerts/${id}/acknowledge`);
}

/** The primary officer cannot be reached: hand the alert to the next ranger. */
export async function rerouteAlert(id: string) {
  await http.patch(`/conflict-alerts/${id}/reroute`);
}

export async function closeAlert(id: string, input: { finalStatus: FinalStatus; resolvedAt: Date; remarks: string }) {
  await http.patch(`/conflict-alerts/${id}/close`, {
    finalStatus: input.finalStatus,
    resolvedAt: input.resolvedAt.toISOString(),
    remarks: input.remarks,
  });
}

// ───────────────────────────── field response (works offline) ─────────────────────────────

const PENDING_KEY = '@pending_conflict_responses';

export interface ResponseDraft {
  alertId: string;
  situation: string;
  action: string;
  notes: string;
  /** Local file URIs (uploaded when sent) or already-hosted URLs. */
  photos: string[];
  fieldLocation: string;
}

async function uploadPhotos(uris: string[]): Promise<string[]> {
  const hosted = uris.filter((u) => /^https?:\/\//i.test(u) && !u.includes('localhost') && !u.startsWith('blob:'));
  const local = uris.filter((u) => !hosted.includes(u));
  if (!local.length) return hosted;

  const form = new FormData();
  for (const [i, uri] of local.entries()) {
    const name = uri.split('?')[0].split('/').pop() || `photo-${i}.jpg`;
    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      form.append('photos', blob, /\.\w+$/.test(name) ? name : `photo-${i}.jpg`);
    } else {
      const ext = /\.(\w+)$/.exec(name)?.[1]?.toLowerCase() ?? 'jpg';
      form.append('photos', { uri, name, type: `image/${ext === 'jpg' ? 'jpeg' : ext}` } as any);
    }
  }
  const response = await http.post<{ urls: string[] }>('/response-actions/photos', form);
  return [...hosted, ...response.data.urls];
}

async function sendResponse(draft: ResponseDraft) {
  const photos = await uploadPhotos(draft.photos);
  await http.post('/response-actions', {
    alertId: draft.alertId,
    situationAssessment: draft.situation,
    actionTaken: draft.action,
    notes: draft.notes,
    photos,
    fieldLocation: draft.fieldLocation,
    status: 'IN_PROGRESS',
    syncStatus: 'SYNCED',
  });
}

async function readQueue(): Promise<ResponseDraft[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function pendingResponseCount() {
  return (await readQueue()).length;
}

/**
 * Records the ranger's on-site response. With no connection it is kept on the device as
 * "pending sync" and sent later; a server refusal is thrown so the form can show the reason.
 */
export async function saveResponse(draft: ResponseDraft): Promise<{ synced: boolean }> {
  const network = await Network.getNetworkStateAsync().catch(() => null);
  const offline = network?.isConnected === false;

  if (!offline) {
    try {
      await sendResponse(draft);
      return { synced: true };
    } catch (error) {
      if (!(axios.isAxiosError(error) && !error.response)) throw error;
      // no answer from the server: fall through and keep it on the device
    }
  }

  try {
    const queue = await readQueue();
    queue.push(draft);
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(queue));
  } catch {
    throw new Error('LOCAL_STORAGE_FAILURE');
  }
  return { synced: false };
}

/** Sends responses saved while offline. Returns how many were synchronised. */
export async function syncPendingResponses(): Promise<number> {
  const queue = await readQueue();
  if (!queue.length) return 0;

  const remaining: ResponseDraft[] = [];
  let synced = 0;
  for (const draft of queue) {
    try {
      await sendResponse(draft);
      synced += 1;
    } catch (error) {
      // keep it only if the server was unreachable; a refusal would fail forever
      if (axios.isAxiosError(error) && !error.response) remaining.push(draft);
    }
  }
  try {
    if (remaining.length) await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
    else await AsyncStorage.removeItem(PENDING_KEY);
  } catch {
    // leave the queue as it is
  }
  return synced;
}

// ───────────────────────────── community reports ─────────────────────────────

export const REPORT_TYPES = [
  { value: 'ANIMAL_SIGHTING', label: 'Animal sighting' },
  { value: 'CROP_DAMAGE', label: 'Crop damage' },
  { value: 'LIVESTOCK_ATTACK', label: 'Livestock attack' },
  { value: 'HUMAN_INJURY', label: 'Human injury' },
  { value: 'OTHER', label: 'Other' },
] as const;

export type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'RESOLVED' | 'DISMISSED';

export interface CommunityReport {
  _id: string;
  reportType: string;
  description: string;
  latitude: number;
  longitude: number;
  locationName?: string;
  status: ReportStatus;
  reportedAt: string;
  reportedBy?: { firstName: string; lastName: string } | null;
}

export async function fetchReports(status?: string): Promise<CommunityReport[]> {
  const response = await http.get<{ reports: CommunityReport[] }>('/community-reports', {
    params: status ? { status } : {},
  });
  return response.data.reports ?? [];
}

export async function submitReport(input: {
  reportType: string;
  description: string;
  latitude: number;
  longitude: number;
  locationName: string;
}) {
  const response = await http.post<{ report: CommunityReport }>('/community-reports', input);
  return response.data.report;
}

/** Liaison officer verifies (raises an alert) or dismisses a community report. */
export async function reviewReport(id: string, status: 'VERIFIED' | 'DISMISSED') {
  const response = await http.patch<{ report: CommunityReport; alert?: BackendAlert }>(`/community-reports/${id}/status`, { status });
  return { report: response.data.report, alertId: response.data.alert?._id };
}

export const reportLabel = (type: string) => REPORT_TYPES.find((t) => t.value === type)?.label ?? type;

// ───────────────────────────── map data ─────────────────────────────

export interface Collar {
  _id: string;
  status: string;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastUpdated: string | null;
  animalId: { _id: string; species: string; identifier: string; riskStatus: string };
}

export interface RiskZone {
  _id: string;
  name: string;
  zoneType: string;
  description?: string;
  boundary: { type: 'Polygon'; coordinates: number[][][] };
}

export async function fetchCollars(): Promise<Collar[]> {
  const response = await http.get<{ collars: Collar[] }>('/gps-collars');
  return response.data.collars ?? [];
}

export async function fetchZones(): Promise<RiskZone[]> {
  const response = await http.get<{ zones?: RiskZone[]; riskZones?: RiskZone[] }>('/risk-zones');
  return response.data.zones ?? response.data.riskZones ?? [];
}

/** Sends a collar position (field simulator). Entering a risk zone raises an alert on the server. */
export async function sendCollarPing(collarId: string, latitude: number, longitude: number) {
  const response = await http.patch<{ alertCreated: boolean; insideRiskZone: boolean; alert?: BackendAlert }>(
    `/gps-collars/${collarId}/location`,
    { latitude, longitude },
  );
  return response.data;
}
