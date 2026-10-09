import type { CaseStatus, ConflictCase } from './store';

// Maps an alert returned by the EcoGuard backend (GET /api/conflict-alerts[/:id]) to the shape the
// conflict-alert screens use. The backend alert only stores coordinates, severity and references,
// so the animal, zone and report come from the populated references the controller already returns.
// Nothing here needs a backend change.

export interface BackendUserRef {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: string;
}

export interface BackendAnimalRef {
  _id: string;
  species: string;
  identifier: string;
  riskStatus?: string;
}

export interface BackendZoneRef {
  _id: string;
  name: string;
  zoneType: string;
  description?: string;
}

export interface BackendReportRef {
  _id: string;
  reportType: string;
  description: string;
  status?: string;
}

/** A reference is an object when populated, or a plain id string when it was not. */
type Ref<T> = T | string | null | undefined;

export interface BackendAlert {
  _id: string;
  alertId: string;
  latitude: number;
  longitude: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'CLOSED';
  description?: string;
  assignedOfficer?: Ref<BackendUserRef>;
  sourceReport?: Ref<BackendReportRef>;
  sourceAnimal?: Ref<BackendAnimalRef>;
  sourceRiskZone?: Ref<BackendZoneRef>;
  acknowledgedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
}

const isObject = <T extends object>(ref: Ref<T>): ref is T => typeof ref === 'object' && ref !== null;

const ROLE_LABEL: Record<string, string> = {
  RANGER: 'Ranger',
  COMMUNITY_LIAISON_OFFICER: 'Liaison Officer',
  PARK_MANAGER: 'Park Manager',
  CONSERVATION_RESEARCHER: 'Researcher',
};

const STATUS_MAP: Record<BackendAlert['status'], CaseStatus> = {
  NEW: 'NEW',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSED: 'RESOLVED',
};

const coords = (lat: number, lon: number) => `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

export function toConflictCase(alert: BackendAlert): ConflictCase {
  const animal = isObject(alert.sourceAnimal) ? alert.sourceAnimal : null;
  const zone = isObject(alert.sourceRiskZone) ? alert.sourceRiskZone : null;
  const report = isObject(alert.sourceReport) ? alert.sourceReport : null;
  const officer = isObject(alert.assignedOfficer) ? alert.assignedOfficer : null;

  // The backend stores no place name. Use the zone's description when the API provides it,
  // otherwise "Near <zone>" with the exact coordinates.
  const where = coords(alert.latitude, alert.longitude);
  const location = zone?.description?.trim()
    ? zone.description.trim()
    : zone
      ? `Near ${zone.name} (${where})`
      : where;

  const source: ConflictCase['source'] = animal ? 'GPS_COLLAR' : report ? 'COMMUNITY_REPORT' : 'MANUAL';
  const detectedBy = source === 'GPS_COLLAR' ? 'GPS Collar System' : source === 'COMMUNITY_REPORT' ? 'Community Report' : 'Manual Entry';

  const animalId = animal ? animal.identifier || animal.species : report ? 'Reported by community' : 'Unknown animal';

  const description =
    alert.description?.trim() ||
    (animal
      ? `${animal.identifier} has entered ${zone ? `a configured ${zone.zoneType.toLowerCase().replace(/_/g, ' ')}` : 'a high-risk area'}.`
      : report?.description || 'Wildlife conflict reported.');

  const status = STATUS_MAP[alert.status] ?? 'NEW';

  return {
    id: alert._id,
    animalId,
    riskZone: zone?.name ?? 'Unmapped location',
    location,
    alertTime: alert.createdAt,
    riskLevel: alert.severity,
    detectedBy,
    description,
    assignedTo: officer
      ? `${ROLE_LABEL[officer.role] ?? officer.role} - ${officer.firstName} ${officer.lastName}`.trim()
      : 'Unassigned',
    status,
    response: null,
    closure: alert.closedAt ? { finalStatus: 'RESOLVED', resolvedAt: alert.closedAt, remarks: '' } : null,
    source,
  };
}
