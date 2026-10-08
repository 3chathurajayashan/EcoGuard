import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { getMyReports, getPendingIncidents, syncPendingIncidents } from '@/utils/api';
import * as Network from 'expo-network';
import { Feather } from '@expo/vector-icons';

type TabType = 'All' | 'Pending' | 'Synced';

export default function MyReportsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    setLoading(true);
    
    // In a real app, this would get synced reports from the server 
    // and offline pending reports from local storage.
    const pending = await getPendingIncidents();
    const synced = await getMyReports();

    // Standardize the shape for display
    const formattedPending = pending.map((item: any) => ({
      ...item,
      id: item.id || Math.random().toString(),
      type: item.incidentType || item.type || 'Unknown',
      date: item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Just now',
      locationString: `Lat: ${item.latitude?.toFixed(4)}, Lng: ${item.longitude?.toFixed(4)}`,
      status: 'Pending'
    }));

    const formattedSynced = Array.isArray(synced) ? synced.map((item: any) => ({
      ...item,
      id: item._id || Math.random().toString(),
      type: item.incidentType || item.type || 'Unknown',
      date: item.createdAt || item.reportingDate ? new Date(item.createdAt || item.reportingDate).toLocaleString() : 'Unknown Date',
      locationString: item.location?.coordinates 
        ? `Lat: ${item.location.coordinates[1]?.toFixed(4)}, Lng: ${item.location.coordinates[0]?.toFixed(4)}`
        : 'Unknown Location',
      status: 'Synced'
    })) : [];

    // For demonstration, if backend is empty but user wants to see UI, we can mock it 
    // if there are no reports at all.
    let combined = [...formattedPending, ...formattedSynced];

    // No mock data - purely rely on backend/local DB state

    setReports(combined);
    setLoading(false);
  };

  const getFilteredReports = () => {
    if (activeTab === 'All') return reports;
    return reports.filter(r => r.status === activeTab);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.reportCard}
      activeOpacity={0.7}
      onPress={() => router.push({
        pathname: '/incidents/[id]',
        params: { id: item.id, data: JSON.stringify(item) }
      })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.typeRow}>
          <Text style={styles.typeIcon}>
            {item.type.includes('Snare') ? '🔗' : '🐾'}
          </Text>
          <Text style={styles.reportType}>{item.type}</Text>
        </View>
        <View style={[styles.badge, item.status === 'Synced' ? styles.badgeSynced : styles.badgePending]}>
          <Text style={[styles.badgeText, item.status === 'Synced' ? styles.badgeTextSynced : styles.badgeTextPending]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardDetails}>
        <Text style={styles.detailText}>📅 {item.date}</Text>
        <Text style={styles.detailText}>📍 {item.locationString}</Text>
      </View>
      
      <Feather name="chevron-right" size={24} color="#CCC" style={{ position: 'absolute', right: 16, top: '50%' }} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reports</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['All', 'Pending', 'Synced'].map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as TabType)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sync Banner for Pending Reports */}
      {reports.some(r => r.status === 'Pending') && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncBannerText}>
            You have {reports.filter(r => r.status === 'Pending').length} offline report(s).
          </Text>
          <TouchableOpacity 
            style={styles.syncBtn}
            onPress={async () => {
              const network = await Network.getNetworkStateAsync();
              if (network.isConnected) {
                setLoading(true);
                await syncPendingIncidents();
                await fetchData();
              } else {
                alert('No network connection available. Please try again when online.');
              }
            }}
          >
            <Text style={styles.syncBtnText}>Sync Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#1E5631" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={getFilteredReports()}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No reports found.</Text>
            }
          />
        )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1E5631',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1E5631',
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    padding: 20,
  },
  flatListContent: {
    paddingBottom: 40,
  },
  reportCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  reportType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
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
  cardDetails: {
    marginLeft: 30, // Align with text past the icon
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  arrowIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    fontSize: 18,
    color: '#CCC',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 50,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF9C4',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF59D',
  },
  syncBannerText: {
    fontSize: 14,
    color: '#F57F17',
    fontWeight: 'bold',
  },
  syncBtn: {
    backgroundColor: '#F57F17',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  syncBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
