import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { getAllIncidentsMapData, getPendingIncidents } from '@/utils/api';

export default function MapScreen() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);

  const fetchLocation = async () => {
    try {
      console.log('Fetching location via ipapi.co...');
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data && data.latitude && data.longitude) {
        setUserLocation({
          latitude: data.latitude,
          longitude: data.longitude,
        });
        return;
      }
    } catch (externalErr) {
      console.log('ipapi.co fetch failed, trying device GPS:', externalErr);
    }

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    } catch (e) {
      console.log('GPS Location fallback failed:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLocation();
      fetchIncidents();
    }, [])
  );

  const fetchIncidents = async () => {
    setLoading(true);
    const pending = await getPendingIncidents();
    const synced = await getAllIncidentsMapData(); // Use new endpoint

    const formattedPending = pending.map((item: any) => ({
      id: item.id || Math.random().toString(),
      type: item.incidentType || item.type || 'Unknown',
      date: item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Just now',
      latitude: item.latitude,
      longitude: item.longitude,
      status: 'Pending'
    }));

    const formattedSynced = Array.isArray(synced) ? synced.map((item: any) => ({
      id: item._id || Math.random().toString(),
      type: item.incidentType || item.type || 'Unknown',
      date: item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown Date',
      latitude: item.location?.coordinates ? item.location.coordinates[1] : null,
      longitude: item.location?.coordinates ? item.location.coordinates[0] : null,
      status: 'Synced'
    })) : [];

    let combined = [...formattedPending, ...formattedSynced].filter(i => i.latitude && i.longitude);

    // No mock data - purely rely on backend/local DB state

    setIncidents(combined);
    setLoading(false);
  };

  // Default to Sri Lanka if location is missing
  const initialRegion = {
    latitude: userLocation?.latitude || 7.8731,
    longitude: userLocation?.longitude || 80.7718,
    latitudeDelta: userLocation ? 0.05 : 3.5,
    longitudeDelta: userLocation ? 0.05 : 3.5,
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E5631" />
          <Text style={styles.loadingText}>Loading Map...</Text>
        </View>
      ) : (
        <MapView 
          style={styles.map} 
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {incidents.map((incident) => (
            <Marker
              key={incident.id}
              coordinate={{
                latitude: incident.latitude,
                longitude: incident.longitude,
              }}
              pinColor={incident.status === 'Pending' ? 'orange' : 'green'}
            >
              <Callout>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{incident.type}</Text>
                  <Text style={styles.calloutDate}>{incident.date}</Text>
                  <Text style={[styles.calloutStatus, incident.status === 'Pending' ? styles.statusPending : styles.statusSynced]}>
                    {incident.status}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}
      
      {/* Overlay Header */}
      <SafeAreaView edges={['top']} style={styles.headerOverlay} pointerEvents="box-none">
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Incident Map</Text>
          <Text style={styles.headerSubtitle}>{incidents.length} Reports Found</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FFF7',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#1E5631',
    fontWeight: 'bold',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E5631',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  calloutContainer: {
    width: 150,
    padding: 5,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  calloutDate: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  calloutStatus: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusPending: {
    color: '#E65100',
  },
  statusSynced: {
    color: '#2E7D32',
  }
});
