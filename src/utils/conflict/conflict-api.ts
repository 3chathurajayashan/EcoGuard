import axios from 'axios';

import type { BackendAlert } from './backend-adapter';
import { toConflictCase } from './backend-adapter';
import type { ConflictCase } from './store';

// Same server the other EcoGuard modules use. Override with EXPO_PUBLIC_API_URL.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.37:5001/api';

const http = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

/** GET /conflict-alerts: every alert with animal, zone, report and officer populated, newest first. */
export async function fetchConflictAlerts(): Promise<ConflictCase[]> {
  const response = await http.get<{ alerts: BackendAlert[] }>('/conflict-alerts');
  return (response.data.alerts ?? []).map(toConflictCase);
}

/** GET /conflict-alerts/:id */
export async function fetchConflictAlert(id: string): Promise<ConflictCase> {
  const response = await http.get<{ alert: BackendAlert }>(`/conflict-alerts/${id}`);
  return toConflictCase(response.data.alert);
}
