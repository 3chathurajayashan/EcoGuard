 
import { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),

      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(taglineAnim, {
      toValue: 1,
      duration: 700,
      delay: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>🌿</Text>
          </View>
        </Animated.View>

        {/* App Name */}
        <Animated.Text
          style={[
            styles.appName,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          EcoGuard
        </Animated.Text>

        {/* Tagline */}
        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: taglineAnim,
              transform: [
                {
                  translateY: taglineAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [15, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.tagline}>
            Protecting Nature.
          </Text>

          <Text style={styles.tagline}>
            Empowering Communities.
          </Text>
        </Animated.View>

        {/* Bottom */}
        <View style={styles.bottomContainer}>
          <View style={styles.line} />

          <Text style={styles.bottomText}>
            SMART • SUSTAINABLE • SECURE
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B3D2E',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  logoContainer: {
    marginBottom: 24,
  },

  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,

    elevation: 10,
  },

  logoIcon: {
    fontSize: 58,
  },

  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  taglineContainer: {
    marginTop: 14,
    alignItems: 'center',
  },

  tagline: {
    fontSize: 16,
    lineHeight: 25,
    color: '#C8E6C9',
    fontWeight: '500',
    letterSpacing: 0.4,
  },

  bottomContainer: {
    position: 'absolute',
    bottom: 35,
    alignItems: 'center',
  },

  line: {
    width: 45,
    height: 2,
    backgroundColor: '#81C784',
    borderRadius: 2,
    marginBottom: 12,
  },

  bottomText: {
    fontSize: 9,
    color: '#A5D6A7',
    letterSpacing: 2,
    fontWeight: '600',
  },
});
 
