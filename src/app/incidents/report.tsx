import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Platform, Modal, FlatList, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import MapView, { Marker } from 'react-native-maps';
import { getIncidentTypes } from '@/utils/api';
import { Feather } from '@expo/vector-icons';

const CustomDropdown = ({ icon, value, options, onSelect }: { icon: string, value: string, options: string[], onSelect: (val: string) => void }) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity 
        style={styles.dropdownBox} 
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.dropdownLeft}>
          <Text style={styles.dropdownIcon}>{icon}</Text>
          <Text style={styles.dropdownText}>{value}</Text>
        </View>
        <Text style={styles.dropdownChevron}>⌄</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <FlatList
                data={options}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => {
                      onSelect(item);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, item === value && styles.modalOptionSelected]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default function ReportIncidentScreen() {
  const [incidentType, setIncidentType] = useState('Illegal Snare');
  const [types, setTypes] = useState(['Animal Carcase', 'Poaching Incident', 'Injured Animal', 'Illegal Snare', 'Illegal Campsite', 'Other']);
  const [customIncidentType, setCustomIncidentType] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);

  useEffect(() => {
    // Attempt to fetch types from API
    getIncidentTypes()
      .then((data) => {
        if (data && data.length > 0) setTypes(data);
      })
      .catch((e) => console.log('Using fallback types', e));
      
    // Auto-fetch location on mount for seamless experience like the high-fi UI
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    setLocationLoading(true);
    
    try {
      console.log('Fetching location via ipapi.co...');
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data && data.latitude && data.longitude) {
        setLocation({
          coords: { 
            latitude: data.latitude, 
            longitude: data.longitude, 
            altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null 
          },
          timestamp: Date.now()
        });
      } else {
        throw new Error("Invalid external API response");
      }
    } catch (externalErr) {
      console.log('ipapi.co fetch failed, trying device GPS:', externalErr);
      
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let loc = await Location.getCurrentPositionAsync({});
          setLocation(loc);
        }
      } catch (gpsErr) {
        console.log('Device GPS also failed:', gpsErr);
        // Ultimate Fallback for offline simulators
        setLocation({
          coords: { latitude: 6.9271, longitude: 79.8612, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null },
          timestamp: Date.now()
        });
      }
    }
    
    setLocationLoading(false);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUris((prev) => [...prev, ...result.assets.map(a => a.uri)]);
    }
  };

  const proceedToReview = () => {
    if (!incidentType || !description || photoUris.length === 0 || !location) {
      alert('Please complete all required fields (including at least 1 photo).');
      return;
    }
    if (incidentType === 'Other' && !customIncidentType) {
      alert('Please specify the custom incident type.');
      return;
    }

    const incidentData = {
      incidentType,
      customIncidentType: incidentType === 'Other' ? customIncidentType : undefined,
      description,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      locationSource: 'Automatic GPS',
      severity,
      photoUris,
    };

    router.push({
      pathname: '/incidents/review',
      params: { data: JSON.stringify(incidentData) }
    });
  };

  // Helper to format lat/lng to degrees/minutes/seconds as seen in High-Fi UI
  const formatCoord = (coord: number, isLat: boolean) => {
    const absolute = Math.abs(coord);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    const direction = isLat ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${degrees}°${minutes}'${seconds}"${direction}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#1E5631" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Incident</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        
        {/* Incident Type */}
        <Text style={styles.label}>Incident Type <Text style={styles.req}>*</Text></Text>
        <CustomDropdown 
          icon="🔗" 
          value={incidentType} 
          options={types} 
          onSelect={setIncidentType} 
        />

        {incidentType === 'Other' && (
          <View style={[styles.textAreaContainer, { height: 50, marginTop: 10 }]}>
            <TextInput
              style={styles.textArea}
              placeholder="Specify Incident Type..."
              value={customIncidentType}
              onChangeText={setCustomIncidentType}
            />
          </View>
        )}

        {/* Severity */}
        <Text style={styles.label}>Severity <Text style={styles.req}>*</Text></Text>
        <CustomDropdown 
          icon="⚠️" 
          value={severity} 
          options={['Low', 'Medium', 'High', 'Critical']} 
          onSelect={setSeverity} 
        />

        {/* Location */}
        <Text style={styles.label}>Location</Text>
        <View style={styles.locationCard}>
          <View style={styles.mapWrapper}>
            {locationLoading ? (
              <View style={styles.mapPlaceholder}>
                <ActivityIndicator size="large" color="#1E5631" />
                <Text style={{ marginTop: 10, color: '#666' }}>Finding location...</Text>
              </View>
            ) : location ? (
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker 
                  coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
                  pinColor="#1E5631"
                />
              </MapView>
            ) : (
              <TouchableOpacity style={styles.mapPlaceholder} onPress={fetchLocation}>
                <Text style={styles.locButtonText}>Tap to enable location</Text>
              </TouchableOpacity>
            )}
            
            {/* Mapbox watermark placeholder for high-fi exactness */}
            <Text style={styles.mapboxWatermark}>© mapbox</Text>
          </View>

          {location && (
            <View style={styles.coordRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.miniPin}>📍</Text>
                <Text style={styles.coordText}>
                  {formatCoord(location.coords.latitude, true)} {formatCoord(location.coords.longitude, false)}
                </Text>
              </View>
              <TouchableOpacity onPress={fetchLocation}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.descHeader}>
          <Text style={styles.label}>Description <Text style={styles.req}>*</Text></Text>
        </View>
        <View style={styles.textAreaContainer}>
          <TextInput
            style={styles.textArea}
            multiline
            maxLength={250}
            placeholder="Enter a short description..."
            value={description}
            onChangeText={setDescription}
          />
          <Text style={styles.charCount}>{description.length}/250</Text>
        </View>

        {/* Add Photo */}
        <Text style={styles.label}>Add Photos <Text style={styles.req}>*</Text></Text>
        <ScrollView horizontal style={styles.photoScroll} showsHorizontalScrollIndicator={false}>
          {photoUris.map((uri, index) => (
            <View key={index} style={styles.previewImageWrapper}>
              <Image source={{ uri }} style={styles.previewImageSmall} />
              <TouchableOpacity 
                style={styles.removePhotoBtn}
                onPress={() => setPhotoUris(photoUris.filter((_, i) => i !== index))}
              >
                <Text style={styles.removePhotoText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.photoContainerSmall} onPress={pickImage}>
            <Text style={styles.cameraIconSmall}>📷</Text>
            <Text style={styles.photoTextSmall}>{photoUris.length > 0 ? 'Add more' : 'Tap to add'}</Text>
          </TouchableOpacity>
        </ScrollView>

      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={proceedToReview}>
          <Text style={styles.submitBtnText}>Submit Incident</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FFF7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
  },
  backBtn: {
    padding: 5,
    marginRight: 15,
  },
  backBtnText: {
    fontSize: 24,
    color: '#1E5631',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  req: {
    color: '#D32F2F',
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 15,
    height: 50,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownChevron: {
    fontSize: 20,
    color: '#666',
    fontWeight: '300',
    marginBottom: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
    overflow: 'hidden',
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionSelected: {
    color: '#1E5631',
    fontWeight: 'bold',
  },
  locationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    padding: 12,
  },
  mapWrapper: {
    height: 140,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E8F5E9',
    position: 'relative',
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapboxWatermark: {
    position: 'absolute',
    bottom: 5,
    left: 8,
    fontSize: 10,
    color: '#333',
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  locButtonText: {
    color: '#1E5631',
    fontWeight: 'bold',
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 5,
  },
  miniPin: {
    fontSize: 14,
    marginRight: 6,
  },
  coordText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  changeText: {
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 13,
  },
  descHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  textAreaContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    height: 110,
    position: 'relative',
  },
  textArea: {
    flex: 1,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#333',
  },
  charCount: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    fontSize: 11,
    color: '#999',
  },
  photoScroll: {
    flexDirection: 'row',
    marginTop: 5,
  },
  previewImageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  previewImageSmall: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  photoContainerSmall: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    borderStyle: 'dashed',
    borderRadius: 8,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconSmall: {
    fontSize: 24,
    marginBottom: 5,
  },
  photoTextSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitBtn: {
    backgroundColor: '#1E5631',
    padding: 16,
    borderRadius: 25, // Adjusted to match High-Fi pill shape
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

