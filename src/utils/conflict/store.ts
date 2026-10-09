import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

// Local data for the Wildlife Conflict Alert flow. It stands in for the central system,
// so these screens run without any backend.
const KEY = '@conflict_case_v2';

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
  finalStatus: FinalStatus;
  resolvedAt: string;
  remarks: string;
}

export interface ConflictCase {
  id: string;
  animalId: string;
  riskZone: string;
  location: string;
  alertTime: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  detectedBy: string;
  description: string;
  assignedTo: string;
  status: CaseStatus;
  response: FieldResponse | null;
  closure: Closure | null;
}

export const createSeedCase = (): ConflictCase => ({
  id: 'ca-1',
  animalId: 'Elephant E-12',
  riskZone: 'High-Risk Zone 03',
  location: 'Near Kumbuk Wewa Village, North Central Province',
  alertTime: new Date(2025, 7, 20, 14, 36).toISOString(),
  riskLevel: 'HIGH',
  detectedBy: 'GPS Collar System',
  description: 'Elephant E-12 has entered a configured high-risk zone.',
  assignedTo: 'Ranger - North Central Team',
  status: 'NEW',
  response: null,
  closure: null,
});

export const SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&q=60&w=400',
  'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&q=60&w=400',
  'https://images.unsplash.com/photo-1581852017103-68ac65514cf7?auto=format&fit=crop&q=60&w=400',
];

let cache: ConflictCase | null = null;

export async function getCase(): Promise<ConflictCase> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as ConflictCase;
      return cache;
    }
  } catch {
    // fall back to the demo alert
  }
  cache = createSeedCase();
  return cache;
}

async function save(next: ConflictCase) {
  cache = next;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch (error) {
    console.error('Failed to store the conflict alert:', error);
  }
  return next;
}

export async function resetCase() {
  return save(createSeedCase());
}

export async function acknowledgeCase() {
  const c = await getCase();
  return save({ ...c, status: c.status === 'NEW' ? 'ACKNOWLEDGED' : c.status });
}

export async function saveResponse(input: Pick<FieldResponse, 'situation' | 'action' | 'notes' | 'photos'>) {
  const c = await getCase();
  return save({
    ...c,
    status: 'IN_PROGRESS',
    response: {
      ...input,
      recordedBy: c.assignedTo,
      // Demo alert is dated 20 Aug 2025, so the response is timed relative to it (69 min later)
      respondedAt: new Date(new Date(c.alertTime).getTime() + 69 * 60_000).toISOString(),
      fieldLocation: c.riskZone,
    },
  });
}

export async function closeCase(input: Closure) {
  const c = await getCase();
  const status: CaseStatus = input.finalStatus;
  return save({ ...c, status, closure: input });
}

/** Loads the alert every time the screen gains focus. */
export function useCase() {
  const [current, setCurrent] = useState<ConflictCase | null>(null);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getCase().then((c) => active && setCurrent(c));
      return () => {
        active = false;
      };
    }, []),
  );
  return [current, setCurrent] as const;
}

export const STATUS_LABEL: Record<CaseStatus, string> = {
  NEW: 'NEW',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  IN_PROGRESS: 'IN PROGRESS',
  RESOLVED: 'RESOLVED',
  FALSE_ALERT: 'FALSE ALERT',
  CANCELLED: 'CANCELLED',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
export const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const fmtDateTime = (iso: string) => `${fmtDate(iso)}, ${fmtTime(iso)}`;
