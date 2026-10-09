import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Network from 'expo-network';
import { Platform } from 'react-native';

import { errorMessage, http } from './http';

// Incident reporting API. The server address and the signed-in user's token come from ./http
// and the session, so nothing here is hard-coded to one machine or one user.
const PENDING_INCIDENTS_KEY = '@pending_incidents';
const api = http;

/** A client-side id so a report that is sent twice (a retry after a dropped connection) is stored once. */
const newClientId = () => `inc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const getIncidentTypes = async () => {
  const response = await api.get('/incidents/types');
  return response.data.data || [];
};

/** Adds one photo to a multipart body. Phones send {uri,name,type}; browsers need a real File. */
async function appendEvidence(formData: FormData, uri: string, index: number) {
  const filename = uri.split('?')[0].split('/').pop() || `evidence-${index}.jpg`;
  const ext = /\.(\w+)$/.exec(filename)?.[1]?.toLowerCase();

  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    const name = ext ? filename : `evidence-${index}.${(blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')}`;
    formData.append('evidence', blob, name);
    return;
  }

  const type = ext ? `image/${ext === 'jpg' ? 'jpeg' : ext}` : 'image/jpeg';
  formData.append('evidence', { uri, name: filename, type } as any);
}

async function postIncident(incidentData: any, localImageUris: string[] | undefined, clientId: string) {
  const formData = new FormData();
  Object.keys(incidentData).forEach((key) => {
    const value = incidentData[key];
    if (value === undefined || value === null) return;
    formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  });
  formData.append('clientId', clientId);

  for (const [index, uri] of (localImageUris ?? []).entries()) {
    await appendEvidence(formData, uri, index);
  }
  return api.post('/incidents', formData);
}

export const submitIncident = async (incidentData: any, localImageUris?: string[]) => {
  const clientId = newClientId();
  const isConnected = await Network.getNetworkStateAsync();

  if (!isConnected.isConnected) {
    return await storeIncidentLocally(incidentData, localImageUris, clientId);
  }

  try {
    const response = await postIncident(incidentData, localImageUris, clientId);
    return { success: true, data: response.data, synced: true };
  } catch (error) {
    // No answer from the server (dropped connection): keep the report on the device to retry.
    if (axios.isAxiosError(error) && !error.response) {
      return await storeIncidentLocally(incidentData, localImageUris, clientId);
    }
    // The server answered and refused it (validation, permissions): saving it locally would
    // only make it fail again on every retry, so report the reason instead.
    console.error('Failed to submit incident:', error);
    return { success: false, error: errorMessage(error) };
  }
};

const storeIncidentLocally = async (incidentData: any, localImageUris: string[] | undefined, clientId: string) => {
  try {
    const existingStr = await AsyncStorage.getItem(PENDING_INCIDENTS_KEY);
    const existing = existingStr ? JSON.parse(existingStr) : [];

    const newIncident = {
      ...incidentData,
      localImageUris,
      id: clientId,
      clientId,
      status: 'Pending Synchronization',
      timestamp: new Date().toISOString(),
    };

    existing.push(newIncident);
    await AsyncStorage.setItem(PENDING_INCIDENTS_KEY, JSON.stringify(existing));

    return { success: true, localId: newIncident.id, synced: false };
  } catch (error) {
    console.error('Failed to store incident locally:', error);
    return { success: false, error: 'Local storage failure' };
  }
};

/**
 * Sends every report saved while offline. Each one goes up with its photos and its own
 * clientId; the server returns the stored report if it already has it, so retrying is safe.
 * Reports the server refuses are dropped from the queue, the rest stay for the next attempt.
 * Returns how many were synchronised.
 */
export const syncPendingIncidents = async () => {
  try {
    const isConnected = await Network.getNetworkStateAsync();
    if (!isConnected.isConnected) return 0;

    const existingStr = await AsyncStorage.getItem(PENDING_INCIDENTS_KEY);
    if (!existingStr) return 0;

    const pending: any[] = JSON.parse(existingStr);
    if (pending.length === 0) return 0;

    const remaining: any[] = [];
    let synced = 0;

    for (const item of pending) {
      const { localImageUris, id, clientId, status, timestamp, ...fields } = item;
      try {
        await postIncident(fields, localImageUris, clientId ?? id);
        synced += 1;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response && error.response.status < 500 && error.response.status !== 401) {
          console.error('Dropping a report the server refused:', errorMessage(error));
        } else {
          remaining.push(item);
        }
      }
    }

    if (remaining.length) await AsyncStorage.setItem(PENDING_INCIDENTS_KEY, JSON.stringify(remaining));
    else await AsyncStorage.removeItem(PENDING_INCIDENTS_KEY);
    return synced;
  } catch (error) {
    console.error('Sync failed:', error);
    return 0;
  }
};

export const getMyReports = async () => {
  try {
    const response = await api.get('/incidents/my-reports');
    return response.data.data || []; // Extract the inner data array
  } catch (error) {
    console.error('Failed to get my reports:', error);
    return [];
  }
};

export const getAllIncidentsMapData = async () => {
  try {
    const response = await api.get('/incidents/map');
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to get map incidents:', error);
    return [];
  }
};

export const getPendingIncidents = async () => {
  try {
    const existingStr = await AsyncStorage.getItem(PENDING_INCIDENTS_KEY);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch (error) {
    console.error('Failed to get pending incidents:', error);
    return [];
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data.user || null;
  } catch (error) {
    console.log('Could not load the signed-in user:', errorMessage(error));
    return null;
  }
};
