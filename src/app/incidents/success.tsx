import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

export default function SuccessScreen() {
  const { synced } = useLocalSearchParams();
  const isSynced = synced === 'true';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.iconContainer}>
          {isSynced ? (
            <View style={[styles.circle, { borderColor: '#4CAF50' }]}>
              <Text style={styles.icon}>✓</Text>
            </View>
          ) : (
            <View style={[styles.circle, { borderColor: '#FF9800' }]}>
              <Text style={styles.icon}>☁️</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>
          {isSynced ? 'Incident Reported!' : 'No Network'}
        </Text>
        
        <Text style={styles.message}>
          {isSynced 
            ? 'Your report has been recorded successfully.' 
            : 'Your report has been saved on your device and will be synchronized automatically when a connection is available.'}
        </Text>
        
        <View style={styles.notificationBox}>
          <Text style={styles.notificationIcon}>🔔</Text>
          <Text style={styles.notificationText}>
            {isSynced 
              ? 'A notification has been sent to the Park Manager.' 
              : 'The Park Manager will be notified automatically once connection is restored.'}
          </Text>
        </View>

      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={() => router.push('/explore')}
        >
          <Text style={styles.primaryBtnText}>View My Reports</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryBtn} 
          onPress={() => router.push('/')}
        >
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  iconContainer: {
    marginBottom: 30,
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 50,
    color: '#4CAF50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  notificationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FFF59D',
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  notificationText: {
    flex: 1,
    fontSize: 13,
    color: '#F57F17',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    gap: 15,
  },
  primaryBtn: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  primaryBtnText: {
    color: '#1E5631',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCC',
  },
  secondaryBtnText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
