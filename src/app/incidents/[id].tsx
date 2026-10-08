import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function IncidentDetailScreen() {
  const { data } = useLocalSearchParams();
  
  let item: any = null;
  try {
    item = data ? JSON.parse(data as string) : null;
  } catch (e) {
    console.error("Failed to parse detail data");
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color="#1E5631" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <Text style={styles.errorText}>Could not load incident details.</Text>
      </SafeAreaView>
    );
  }

  // Handle both local offline pending data and synced backend data structures
  const type = item.incidentType || item.type || 'Unknown';
  const customType = item.customIncidentType ? `(${item.customIncidentType})` : '';
  const severity = item.severity || 'Medium';
  const description = item.description || 'No description provided.';
  const photos = item.evidence || []; // Backend returns evidence array
  const localPhotos = item.localImageUris || []; // Offline uses localImageUris
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#1E5631" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Type & Status */}
        <View style={styles.topSection}>
          <View>
            <Text style={styles.typeTitle}>{type} {customType}</Text>
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
          <View style={[styles.badge, item.status === 'Synced' ? styles.badgeSynced : styles.badgePending]}>
            <Text style={[styles.badgeText, item.status === 'Synced' ? styles.badgeTextSynced : styles.badgeTextPending]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Severity</Text>
            <Text style={styles.infoValue}>{severity}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{item.locationString}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{description}</Text>
        </View>

        {/* Photos */}
        {(photos.length > 0 || localPhotos.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photographic Evidence</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoContainer}>
              {photos.map((photo: any, idx: number) => (
                <Image key={`remote-${idx}`} source={{ uri: photo.url }} style={styles.photoImage} />
              ))}
              {localPhotos.map((uri: string, idx: number) => (
                <Image key={`local-${idx}`} source={{ uri }} style={styles.photoImage} />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  typeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E5631',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgePending: {
    backgroundColor: '#FFF3E0',
  },
  badgeSynced: {
    backgroundColor: '#E8F5E9',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgeTextPending: {
    color: '#E65100',
  },
  badgeTextSynced: {
    color: '#2E7D32',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E5631',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  photoContainer: {
    flexDirection: 'row',
  },
  photoImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginRight: 15,
    backgroundColor: '#E0E0E0',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#888',
    fontSize: 16,
  }
});
