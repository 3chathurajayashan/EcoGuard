export const config = Object.freeze({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  gpsIntervalMs: Number(import.meta.env.VITE_GPS_INTERVAL_MS) || 10_000,
  maxSyncAttempts: Number(import.meta.env.VITE_MAX_SYNC_ATTEMPTS) || 5,
  rangerUserId: import.meta.env.VITE_RANGER_USER_ID || 'ranger-001',
  parkManagerUserId: import.meta.env.VITE_PARK_MANAGER_USER_ID || 'manager-001',
});

export const demoAssignment = Object.freeze({
  id: 'assignment-001',
  route: {
    id: 'route-yala-block-one',
    name: 'Yala Block I Wildlife Corridor',
    distanceKm: 5.2,
    estimatedDurationMinutes: 100,
    expectedWaypoints: [
      { latitude: 6.369, longitude: 81.519, label: 'Palatupana ranger station' },
      { latitude: 6.3748, longitude: 81.526, label: 'Watering point' },
      { latitude: 6.3818, longitude: 81.5312, label: 'Menik River crossing' },
      { latitude: 6.3875, longitude: 81.538, label: 'Park boundary marker' },
    ],
  },
});
