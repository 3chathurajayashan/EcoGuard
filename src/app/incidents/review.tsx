import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { submitIncident } from '@/utils/api';
import { Feather } from '@expo/vector-icons';

export default function ReviewIncidentScreen() {
  const { data } = useLocalSearchParams();
  const [submitting, setSubmitting] = useState(false);

  let incidentData: any = null;
  try {
    if (typeof data === 'string') {
      incidentData = JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to parse incident data', e);
  }

  const handleSubmit = async () => {
    if (!incidentData) return;
    
    setSubmitting(true);
    const result = await submitIncident({
      incidentType: incidentData.incidentType,
      customIncidentType: incidentData.customIncidentType,
      description: incidentData.description,
      latitude: incidentData.latitude,
      longitude: incidentData.longitude,
      locationSource: incidentData.locationSource,
      severity: incidentData.severity
    }, incidentData.photoUris);
    setSubmitting(false);

    if (result.success) {
      router.push({
        pathname: '/incidents/success',
        params: { synced: result.synced ? 'true' : 'false' }
      });
    } else {
      alert('Failed to save incident. Please try again.');
    }
  };

  if (!incidentData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Invalid incident data.</Text>
        <TouchableOpacity style={styles.submitBtn} onPress={() => router.back()}>
          <Text style={styles.submitBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#1E5631" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Incident</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Incident Type */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>💬</Text>
            <Text style={styles.sectionLabel}>Incident Type</Text>
          </View>
          <Text style={styles.sectionValue}>
            {incidentData.incidentType}
            {incidentData.customIncidentType ? ` (${incidentData.customIncidentType})` : ''}
          </Text>
        </View>

        {/* Severity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚠️</Text>
            <Text style={styles.sectionLabel}>Severity</Text>
          </View>
          <Text style={styles.sectionValue}>{incidentData.severity}</Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📍</Text>
            <Text style={styles.sectionLabel}>Location</Text>
          </View>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPin}>📍</Text>
            <Text style={styles.coordText}>
              {incidentData.latitude.toFixed(5)}, {incidentData.longitude.toFixed(5)}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={styles.changeBtn}>
            <Text style={styles.changeBtnText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📷</Text>
            <Text style={styles.sectionLabel}>Photos ({incidentData.photoUris?.length || 0})</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoContainer}>
            {incidentData.photoUris?.map((uri: string, index: number) => (
              <Image key={index} source={{ uri }} style={styles.previewImage} />
            ))}
          </ScrollView>
          <TouchableOpacity onPress={() => router.back()} style={styles.changeBtn}>
            <Text style={styles.changeBtnText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📝</Text>
            <Text style={styles.sectionLabel}>Description</Text>
          </View>
          <Text style={styles.descriptionText}>
            {incidentData.description}
          </Text>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Incident</Text>
          )}
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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
  },
  sectionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 26, // Align with text
  },
  mapPlaceholder: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mapPin: {
    fontSize: 24,
    marginBottom: 5,
  },
  coordText: {
    fontSize: 14,
    color: '#1E5631',
    fontWeight: '600',
  },
  changeBtn: {
    alignSelf: 'flex-end',
  },
  changeBtnText: {
    color: '#1E5631',
    fontWeight: 'bold',
    fontSize: 14,
  },
  photoContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#E0E0E0',
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginLeft: 26,
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
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  }
});
