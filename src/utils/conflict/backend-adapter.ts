// Maps an alert returned by the EcoGuard backend (GET /api/conflict-alerts[/:id]) to the shape the
// conflict-alert screens use. The backend alert stores coordinates, severity and references; the
// animal, zone, report and officers come from the populated references the API already returns.

export type CaseStatus = 'NEW' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'FALSE_ALERT' | 'CANCELLED';
export type FinalStatus = 'IN_PROGRESS' | 'RESOLVED' | 'FALSE_ALERT' | 'CANCELLED';

export interface FieldResponse {
  situation: string;
  action: string;
  notes: string;
  photos: string[];
  recordedBy: string;
  respondedAt: string;
  fieldLocation: string;
}

export interface Closure {
  finalStatus: string;
  resolvedAt: string;
  remarks: string;
}

export interface ConflictCase {
  id: string;
  animalId: string;
  riskZone: string;
  location: string;
  latitude: number;
  longitude: number;
  alertTime: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  detectedBy: string;
  description: string;
  assignedTo: string;
  assignedToId: string | null;
  acknowledgedBy: string | null;
  acknowledgedById: string | null;
  status: CaseStatus;
  response: FieldResponse | null;
  closure: Closure | null;
  source: 'GPS_COLLAR' | 'COMMUNITY_REPORT' | 'MANUAL';
}

export interface BackendUserRef {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface BackendResponse {
  situationAssessment?: string;
  actionTaken: string;
  notes?: string;
  photos?: string[];
  fieldLocation?: string;
  responseTime: string;
  performedBy?: BackendUserRef | string | null;
}

export interface BackendAlert {
  _id: string;
  latitude: number;
  longitude: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'FALSE_ALERT' | 'CANCELLED' | 'CLOSED';
  description?: string;
  detectedBy?: 'GPS_COLLAR' | 'COMMUNITY_REPORT' | 'MANUAL';
  locationName?: string;
  assignedOfficer?: BackendUserRef | string | null;
  acknowledgedBy?: BackendUserRef | string | null;
  sourceReport?: { _id: string; reportType: string; description: string } | string | null;
  sourceAnimal?: { _id: string; species: string; identifier: string } | string | null;
  sourceRiskZone?: { _id: string; name: string; zoneType: string; description?: string } | string | null;
  latestResponse?: BackendResponse | null;
  closure?: { finalStatus?: string | null; resolvedAt?: string | null; remarks?: string } | null;
  closedAt?: string | null;
  createdAt: string;
}

const isObject = <T extends object>(ref: T | string | null | undefined): ref is T =>
  typeof ref === 'object' && ref !== null;

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
  RESOLVED: 'RESOLVED',
  FALSE_ALERT: 'FALSE_ALERT',
  CANCELLED: 'CANCELLED',
  CLOSED: 'RESOLVED',
};

const DETECTED_BY = {
  GPS_COLLAR: 'GPS Collar System',
  COMMUNITY_REPORT: 'Community Report',
  MANUAL: 'Manual Entry',
} as const;

const coords = (lat: number, lon: number) => `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
const person = (u: BackendUserRef) => `${u.firstName} ${u.lastName}`.trim();
const officer = (u: BackendUserRef) => `${ROLE_LABEL[u.role] ?? u.role} - ${person(u)}`;

export function toConflictCase(alert: BackendAlert): ConflictCase {
  const animal = isObject(alert.sourceAnimal) ? alert.sourceAnimal : null;
  const zone = isObject(alert.sourceRiskZone) ? alert.sourceRiskZone : null;
  const report = isObject(alert.sourceReport) ? alert.sourceReport : null;
  const assigned = isObject(alert.assignedOfficer) ? alert.assignedOfficer : null;
  const acknowledger = isObject(alert.acknowledgedBy) ? alert.acknowledgedBy : null;

  const source = alert.detectedBy ?? (animal ? 'GPS_COLLAR' : report ? 'COMMUNITY_REPORT' : 'MANUAL');

  // The backend stores a place name on the alert; fall back to the zone, then to the coordinates
  const where = coords(alert.latitude, alert.longitude);
  const location =
    alert.locationName?.trim() ||
    zone?.description?.trim() ||
    (zone ? `Near ${zone.name} (${where})` : where);

  const animalId = animal
    ? animal.identifier || animal.species
    : report
      ? `Community sighting (${report.reportType.toLowerCase().replace(/_/g, ' ')})`
      : 'Unknown animal';

  const description =
    alert.description?.trim() ||
    (animal
      ? `${animal.identifier} has entered ${zone ? `a configured ${zone.zoneType.toLowerCase().replace(/_/g, ' ')}` : 'a high-risk area'}.`
      : report?.description || 'Wildlife conflict reported.');

  const r = alert.latestResponse;
  const response: FieldResponse | null = r
    ? {
        situation: r.situationAssessment ?? '',
        action: r.actionTaken,
        notes: r.notes ?? '',
        photos: r.photos ?? [],
        recordedBy: isObject(r.performedBy) ? officer(r.performedBy) : 'Field officer',
        respondedAt: r.responseTime,
        fieldLocation: r.fieldLocation ?? '',
      }
    : null;

  const c = alert.closure;
  const closure: Closure | null =
    c?.finalStatus || alert.closedAt
      ? {
          finalStatus: c?.finalStatus ?? 'RESOLVED',
          resolvedAt: c?.resolvedAt ?? alert.closedAt ?? alert.createdAt,
          remarks: c?.remarks ?? '',
        }
      : null;

  return {
    id: alert._id,
    animalId,
    riskZone: zone?.name ?? 'Unmapped location',
    location,
    latitude: alert.latitude,
    longitude: alert.longitude,
    alertTime: alert.createdAt,
    riskLevel: alert.severity,
    detectedBy: DETECTED_BY[source],
    description,
    assignedTo: assigned ? officer(assigned) : 'Unassigned',
    assignedToId: assigned?._id ?? (typeof alert.assignedOfficer === 'string' ? alert.assignedOfficer : null),
    acknowledgedBy: acknowledger ? person(acknowledger) : null,
    acknowledgedById: acknowledger?._id ?? null,
    status: STATUS_MAP[alert.status] ?? 'NEW',
    response,
    closure,
    source,
  };
}

export const isClosedStatus = (s: CaseStatus) => s === 'RESOLVED' || s === 'FALSE_ALERT' || s === 'CANCELLED';

export const STATUS_LABEL: Record<CaseStatus, string> = {
  NEW: 'NEW',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  IN_PROGRESS: 'IN PROGRESS',
  RESOLVED: 'RESOLVED',
  FALSE_ALERT: 'FALSE ALERT',
  CANCELLED: 'CANCELLED',
};
