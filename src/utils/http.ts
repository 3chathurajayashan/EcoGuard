import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Where the backend lives. Set EXPO_PUBLIC_API_URL to override. Otherwise it is the same machine
 * the app was served from, on port 5001: localhost in the browser, and the dev machine's LAN
 * address on a phone (taken from the Expo dev server), so no IP has to be edited by hand.
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (Platform.OS === 'web') {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host}:5001/api`;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:5001/api`;
}

export const API_URL = resolveBaseUrl();

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};
export const getAuthToken = () => authToken;
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

export const http = axios.create({ baseURL: API_URL, timeout: 15000 });

http.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    // An expired or revoked token: send the user back to sign in
    if (axios.isAxiosError(error) && error.response?.status === 401 && authToken) onUnauthorized?.();
    return Promise.reject(error);
  },
);

/** A message safe to show to the user for any failed request. */
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: string[] } | undefined;
    if (data?.errors?.length) return data.errors.join('. ');
    if (data?.message) return data.message;
    if (!error.response) return 'Cannot reach the server. Check your connection and try again.';
    return error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong';
}
