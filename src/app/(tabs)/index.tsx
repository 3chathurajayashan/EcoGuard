import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';

const HERO_IMAGES = [
  { id: '1', uri: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&q=80&w=1000', title: 'Protect\nWildlife\nPreserve\nOur Parks' },
  { id: '2', uri: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=1000', title: 'Report\nIncidents\nInstantly' },
  { id: '3', uri: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&q=80&w=1000', title: 'Track\nYour\nImpact' }
];

import { Ionicons, Feather } from '@expo/vector-icons';

export default function HomeScreen() {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <View style={styles.container}>
      {/* Absolute Header Background */}
      <View style={styles.topBgContainer}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000&auto=format&fit=crop' }} 
          style={styles.topBgImage} 
        />
        <View style={styles.topBgGradient} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.iconPlaceholder}>
              <Ionicons name="paw" size={24} color="#FFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>EcoGuard</Text>
              <Text style={styles.headerSubtitle}>Wildlife Conservation</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellPlaceholder} onPress={() => router.push('/conflicts')}>
            <Text style={{ fontSize: 24 }}>🔔</Text>
            <View style={styles.redDot} />
          </TouchableOpacity>
        </View>

        <Text style={styles.welcomeText}>Welcome Ranger!</Text>
        <Text style={styles.welcomeSub}>Together for a Safer Tomorrow</Text>

        {/* Hero Image Carousel */}
        <View style={styles.heroContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / (Dimensions.get('window').width - 40));
              setActiveSlide(slide);
            }}
            scrollEventThrottle={16}
          >
            {HERO_IMAGES.map((img, idx) => (
              <View key={img.id} style={{ width: Dimensions.get('window').width - 40, height: '100%' }}>
                <Image source={{ uri: img.uri }} style={styles.heroImage} />
                <View style={styles.heroTextContainer}>
                  <Text style={styles.heroTitle}>{img.title}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.carouselDots}>
            {HERO_IMAGES.map((_, idx) => (
              <View key={idx} style={[styles.dot, activeSlide === idx && styles.activeDot]} />
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => router.push('/incidents/report')}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>+</Text>
            </View>
            <View style={styles.actionTextContent}>
              <Text style={styles.actionCardTitle}>Report Incident</Text>
              <Text style={styles.actionCardDesc}>Report snares, poaching, illegal activities and more</Text>
            </View>
            <Feather name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>📍</Text>
            </View>
            <View style={styles.actionTextContent}>
              <Text style={styles.actionCardTitle}>View Map</Text>
              <Text style={styles.actionCardDesc}>Explore incident locations</Text>
            </View>
            <Feather name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/conflicts')}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>🐘</Text>
            </View>
            <View style={styles.actionTextContent}>
              <Text style={styles.actionCardTitle}>Conflict Alerts</Text>
              <Text style={styles.actionCardDesc}>Respond to human-wildlife conflict alerts</Text>
            </View>
            <Feather name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/explore')}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>📋</Text>
            </View>
            <View style={styles.actionTextContent}>
              <Text style={styles.actionCardTitle}>My Reports</Text>
              <Text style={styles.actionCardDesc}>Track your submitted incidents</Text>
            </View>
            <Feather name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Bottom Banner */}
        <View style={styles.bottomBanner}>
          <View style={styles.bottomBannerBg}>
             <Image source={{ uri: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000&auto=format&fit=crop' }} style={styles.bannerBgImage} />
          </View>
          <Text style={styles.bannerIcon}>🌱</Text>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Every report makes{'\n'}a difference!</Text>
            <Text style={styles.bannerDesc}>Help us protect Sri Lanka's wildlife and natural habitats.</Text>
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FFF7',
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  topBgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,
    overflow: 'hidden',
  },
  topBgImage: {
    width: '100%',
    height: '100%',
    opacity: 0.15,
  },
  topBgGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: 'rgba(247, 255, 247, 0.8)', // fades into background
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: '#1E5631',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E5631',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#4C9A2A',
  },
  bellPlaceholder: {
    padding: 5,
    position: 'relative',
  },
  redDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 10,
    height: 10,
    backgroundColor: 'red',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E5631',
  },
  welcomeSub: {
    fontSize: 14,
    color: '#4C9A2A',
    marginBottom: 20,
  },
  heroContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 25,
    height: 180,
    backgroundColor: '#000',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  heroTextContainer: {
    position: 'absolute',
    left: 20,
    top: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    lineHeight: 30,
  },
  carouselDots: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FFF',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#1E5631',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionIcon: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
  },
  actionTextContent: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  actionCardDesc: {
    fontSize: 12,
    color: '#777',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#999',
    marginLeft: 10,
  },
  bottomBanner: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bottomBannerBg: {
    position: 'absolute',
    top: 0,
    right: -20,
    bottom: 0,
    width: '60%',
    opacity: 0.1,
  },
  bannerBgImage: {
    width: '100%',
    height: '100%',
  },
  bannerIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E5631',
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: 12,
    color: '#4C9A2A',
  },
});

