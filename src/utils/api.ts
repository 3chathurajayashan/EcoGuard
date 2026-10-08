import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

// Use your computer's IP address (192.168.1.37 from metro logs) or an environment variable. 
// "localhost" doesn't resolve to your Mac when running on a physical Android/iOS phone.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.37:5001/api'; 
const PENDING_INCIDENTS_KEY = '@pending_incidents';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0ZDJiMmY4ZTRiMDEyMzQ1Njc4OWFiYyIsInJvbGUiOiJyYW5nZXIiLCJpYXQiOjE3OTE0ODQ3NTV9.NyYwgshOon8pDdvHvYmdOwFpU3z-fjWcBeDO0-wYE3I';

api.interceptors.request.use(async (config) => {
  config.headers.Authorization = `Bearer ${MOCK_TOKEN}`;
  return config;
});

export const getIncidentTypes = async () => {
  const response = await api.get('/incidents/types');
  return response.data.data || [];
};

export const submitIncident = async (incidentData: any, localImageUris?: string[]) => {
  const isConnected = await Network.getNetworkStateAsync();

  if (!isConnected.isConnected) {
    return await storeIncidentLocally(incidentData, localImageUris);
  }

  try {
    const formData = new FormData();
    Object.keys(incidentData).forEach(key => {
      const value = incidentData[key];
      if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });

    if (localImageUris && localImageUris.length > 0) {
      localImageUris.forEach((uri, index) => {
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;
        
        formData.append('evidence', {
          uri,
          name: filename || `evidence-${index}.jpg`,
          type,
        } as any);
      });
    }

    const response = await api.post('/incidents', formData);

    return { success: true, data: response.data, synced: true };
  } catch (error) {
    console.error('Failed to submit incident:', error);
    // If request fails due to network even though we thought we had it, save locally
    return await storeIncidentLocally(incidentData, localImageUris);
  }
};

const storeIncidentLocally = async (incidentData: any, localImageUris?: string[]) => {
  try {
    const existingStr = await AsyncStorage.getItem(PENDING_INCIDENTS_KEY);
    const existing = existingStr ? JSON.parse(existingStr) : [];
    
    const newIncident = {
      ...incidentData,
      localImageUris,
      id: Date.now().toString(),
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

export const syncPendingIncidents = async () => {
  try {
    const isConnected = await Network.getNetworkStateAsync();
    if (!isConnected.isConnected) return;

    const existingStr = await AsyncStorage.getItem(PENDING_INCIDENTS_KEY);
    if (!existingStr) return;
    
    const pendingIncidents = JSON.parse(existingStr);
    if (pendingIncidents.length === 0) return;

    // A real implementation would sync one by one or use the batch sync endpoint.
    // Given the endpoint /api/incidents/sync accepts raw JSON, we can batch it,
    // but the backend says "Accepts raw JSON", so photos might need a separate flow, 
    // or we just send the JSON first and attach photos via POST /:id/evidence later.
    // For simplicity in the use case:
    
    const response = await api.post('/incidents/sync', { incidents: pendingIncidents });
    
    if (response.status === 200 || response.status === 201) {
      await AsyncStorage.removeItem(PENDING_INCIDENTS_KEY);
      console.log('Successfully synced pending incidents');
    }
  } catch (error) {
    console.error('Sync failed:', error);
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
    // Assuming backend returns { success: true, data: { ...userObject } }
    return response.data.data || response.data;
  } catch (error) {
    console.log('User is not authenticated (backend returned 401). Falling back to local data.');
    return null;
  }
};
