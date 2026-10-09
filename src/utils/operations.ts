import { http } from './http';
import type { PatrolRoute } from './patrol';

export interface Ranger {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AssignmentRow {
  _id: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
  assignedDate: string;
  route: { _id: string; name: string; parkName: string; distanceKm: number };
  ranger: { _id: string; firstName: string; lastName: string };
}

export interface PatrolRow {
  _id: string;
  patrolId: string;
  startTime: string;
  endTime: string | null;
  status: string;
  syncStatus: string;
  totalDistance: number;
  coveragePercentage: number;
  waypoints: { type: string }[];
  route: { _id: string; name: string; parkName: string };
  ranger: { _id: string; firstName: string; lastName: string };
}

export interface IncidentRow {
  _id: string;
  incidentType: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: string;
  location: { coordinates: [number, number] };
  evidence: { url: string; resourceType: string }[];
}

export async function fetchRoutes(): Promise<PatrolRoute[]> {
  const response = await http.get<{ routes: PatrolRoute[] }>('/patrol-routes');
  return response.data.routes;
}

export async function fetchRangers(): Promise<Ranger[]> {
  const response = await http.get<{ users: Ranger[] }>('/users', { params: { role: 'RANGER' } });
  return response.data.users;
}

export async function fetchAssignments(): Promise<AssignmentRow[]> {
  const response = await http.get<{ assignments: AssignmentRow[] }>('/patrol-assignments');
  return response.data.assignments;
}

export async function assignRoute(rangerId: string, routeId: string) {
  await http.post('/patrol-assignments', { rangerId, routeId });
}

export async function fetchPatrols(): Promise<PatrolRow[]> {
  const response = await http.get<{ patrols: PatrolRow[] }>('/patrols');
  return response.data.patrols;
}

export async function fetchIncidents(): Promise<IncidentRow[]> {
  const response = await http.get<{ data: IncidentRow[] }>('/incidents/map');
  return response.data.data;
}
