import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { API_URL, getAuthToken, http } from './http';

// ───────────────────────────── types (match the backend's analysis result) ─────────────────────────────

export interface Criteria {
  park: string;
  period: string;
  categories: string[];
}

export interface Bucket {
  label: string;
  count: number;
}

export interface Hotspot {
  latitude: number;
  longitude: number;
  incidents: number;
  score: number;
  level: 'High' | 'Medium' | 'Low';
  mainType: string;
}

export interface AnalysisResults {
  criteria: Criteria & { periodLabel: string };
  range: { from: string; to: string };
  generatedAt: string;
  incidentStatistics: {
    total: number;
    previousTotal: number;
    changePercent: number;
    byType: { type: string; count: number }[];
    bySeverity: { severity: string; count: number }[];
    byPeriod: Bucket[];
  };
  hotspots?: {
    hotspots: Hotspot[];
    points: { latitude: number; longitude: number; severity: string; type: string }[];
  };
  patrolCoverage?: {
    patrols: number;
    totalKm: number;
    averageCoverage: number;
    routes: { route: string; patrols: number; km: number; averageCoverage: number }[];
    mapPoints: { route: string; name?: string; latitude: number; longitude: number; covered: boolean }[];
    coveredPoints: number;
    notCoveredPoints: number;
  };
  conflictTrends?: {
    total: number;
    previousTotal: number;
    changePercent: number;
    byPeriod: Bucket[];
    bySeverity: { severity: string; count: number }[];
    bySource: { source: string; count: number }[];
    resolvedPercent: number;
    avgResponseMinutes: number;
    communityReports: number;
    topZones: { zone: string; count: number }[];
  };
}

export interface Report {
  _id: string;
  title: string;
  status: 'DRAFT' | 'GENERATED' | 'UPDATED';
  criteria: Criteria;
  results: AnalysisResults;
  createdAt: string;
  lastUpdatedAt: string | null;
  lastExport?: { format: string | null; at: string | null };
}

export interface Options {
  parks: string[];
  periods: { value: string; label: string }[];
  categories: { value: string; label: string }[];
  formats: string[];
}

export interface Overview {
  openAlerts: number;
  newIncidents: number;
  patrolsWeek: number;
  pendingReports: number;
  updates: { kind: 'incident' | 'patrol' | 'alert'; text: string; at: string }[];
}

// ───────────────────────────── API ─────────────────────────────

export async function fetchOptions(): Promise<Options> {
  const response = await http.get<Options>('/analytics/options');
  return response.data;
}

export async function fetchOverview(): Promise<Overview> {
  const response = await http.get<Overview>('/analytics/overview');
  return response.data;
}

export async function analyze(criteria: Partial<Criteria>): Promise<AnalysisResults> {
  const response = await http.post<{ results: AnalysisResults }>('/analytics/analyze', criteria);
  return response.data.results;
}

export async function createReport(criteria: Criteria, title?: string): Promise<Report> {
  const response = await http.post<{ report: Report }>('/analytics/reports', { criteria, title });
  return response.data.report;
}

export async function updateReport(id: string, criteria: Partial<Criteria>): Promise<Report> {
  const response = await http.put<{ report: Report }>(`/analytics/reports/${id}`, { criteria });
  return response.data.report;
}

export async function fetchReports(): Promise<Omit<Report, 'results'>[]> {
  const response = await http.get<{ reports: Omit<Report, 'results'>[] }>('/analytics/reports');
  return response.data.reports;
}

// ───────────────────────────── the analysis flow (shared between the screens) ─────────────────────────────

interface FlowState {
  criteria: Criteria;
  results: AnalysisResults | null;
  report: Report | null;
}

const DEFAULT: FlowState = {
  criteria: { park: 'Yala National Park', period: '3m', categories: ['hotspots', 'coverage', 'conflict'] },
  results: null,
  report: null,
};

let flow: FlowState = DEFAULT;
const listeners = new Set<() => void>();

export function setFlow(patch: Partial<FlowState>) {
  flow = { ...flow, ...patch };
  listeners.forEach((l) => l());
}

export function resetFlow() {
  flow = { ...DEFAULT, criteria: { ...DEFAULT.criteria } };
  listeners.forEach((l) => l());
}

export function useFlow() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => flow,
    () => flow,
  );
}

// ───────────────────────────── export / download ─────────────────────────────

const EXT: Record<string, string> = { PDF: 'pdf', CSV: 'csv', XLSX: 'xlsx' };

export interface ExportedFile {
  name: string;
  /** file:// uri on a phone, undefined in the browser (the browser already saved it) */
  uri?: string;
  /** blob: url on web so the file can be opened again */
  webUrl?: string;
}

const safeName = (title: string, format: string) => `${title.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '')}.${EXT[format]}`;

/** Downloads a generated report in the chosen format (a browser download, or a saved file on a phone). */
export async function exportReport(report: Pick<Report, '_id' | 'title'>, format: string): Promise<ExportedFile> {
  const url = `${API_URL}/analytics/reports/${report._id}/export?format=${format}`;
  const headers = { Authorization: `Bearer ${getAuthToken()}` };
  const name = safeName(report.title, format);

  if (Platform.OS === 'web') {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`Export failed (${response.status})`);
    const blob = await response.blob();
    const webUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = webUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    return { name, webUrl };
  }

  const { Directory, File, Paths } = await import('expo-file-system');
  const folder = new Directory(Paths.cache, 'reports');
  folder.create({ idempotent: true });
  const target = new File(folder, name);
  const saved = await File.downloadFileAsync(url, target, { headers, idempotent: true });
  return { name, uri: saved.uri };
}

export async function shareExportedFile(file: ExportedFile) {
  if (Platform.OS === 'web') {
    if (file.webUrl) window.open(file.webUrl, '_blank');
    return;
  }
  if (!file.uri) return;
  const Sharing = await import('expo-sharing');
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri);
}

// ───────────────────────────── report summary ─────────────────────────────

/** The headline sentences shown in the report preview (the server writes the same ones into the export). */
export function summaryLines(results: AnalysisResults): string[] {
  const lines: string[] = [];
  const s = results.incidentStatistics;
  lines.push(
    `${s.total} incidents were reported in the ${results.criteria.periodLabel.toLowerCase()}, ${s.changePercent >= 0 ? 'up' : 'down'} ${Math.abs(s.changePercent)}% on the previous period.`,
  );
  const top = results.hotspots?.hotspots[0];
  if (top) lines.push(`The busiest hotspot is near ${top.latitude}, ${top.longitude} with ${top.incidents} incidents, mostly ${top.mainType.toLowerCase()}.`);
  const c = results.patrolCoverage;
  if (c) lines.push(`${c.patrols} patrols covered ${c.totalKm} km with an average route coverage of ${c.averageCoverage}%.`);
  const t = results.conflictTrends;
  if (t) lines.push(`${t.total} human-wildlife conflict alerts were raised (${t.changePercent >= 0 ? 'up' : 'down'} ${Math.abs(t.changePercent)}%); ${t.resolvedPercent}% are resolved.`);
  return lines;
}
