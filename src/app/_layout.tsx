import { DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
import { Platform, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DASHBOARD_ROLES, MOBILE_ROLES, STAFF_ROLES } from '@/utils/roles';
import { SessionProvider, useSession } from '@/utils/session';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // The screens are designed on a light palette, so the app stays light even when the device is in dark mode
  return (
    <ThemeProvider value={DefaultTheme}>
      <SessionProvider>
        <AnimatedSplashOverlay />
        <RootNavigator />
      </SessionProvider>
    </ThemeProvider>
  );
}

/**
 * Role-based access. A screen only exists for the roles whose guard is true; anyone else who
 * tries to open it (a link, a typed URL) is sent to their own home screen.
 */
function RootNavigator() {
  const { user, loading } = useSession();
  if (loading) return <View style={{ flex: 1 }} />;

  const role = user?.role;
  const signedIn = !!user;
  const mobile = !!role && MOBILE_ROLES.includes(role);
  const dashboard = !!role && DASHBOARD_ROLES.includes(role);
  const staff = !!role && STAFF_ROLES.includes(role);

  return (
    <PhoneFrame enabled={mobile}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      {/* Rangers, liaison officers and villagers use the phone layout */}
      <Stack.Protected guard={mobile}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>

      {/* Park managers and researchers use the dashboard layout */}
      <Stack.Protected guard={dashboard}>
        <Stack.Screen name="(admin)" />
      </Stack.Protected>

      {/* Incident reporting is the ranger's job */}
      <Stack.Protected guard={role === 'RANGER'}>
        <Stack.Screen name="incidents/report" />
        <Stack.Screen name="incidents/review" />
        <Stack.Screen name="incidents/success" />
      </Stack.Protected>
      <Stack.Protected guard={staff}>
        <Stack.Screen name="incidents/[id]" />
      </Stack.Protected>

      {/* Wildlife conflict alerts: every staff role can read them; actions depend on the role */}
      <Stack.Protected guard={staff}>
        <Stack.Screen name="conflicts/index" />
        <Stack.Screen name="conflicts/[id]" />
        <Stack.Screen name="conflicts/respond" />
        <Stack.Screen name="conflicts/close" />
        <Stack.Screen name="conflicts/alerts" />
        <Stack.Screen name="conflicts/animals" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="conflicts/report" />
        <Stack.Screen name="notifications" />
      </Stack.Protected>
    </Stack>
    </PhoneFrame>
  );
}

/** On a wide web window the phone layout stays phone-sized and centred. Native is unchanged. */
function PhoneFrame({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  if (Platform.OS !== 'web' || !enabled) return <>{children}</>;
  return (
    <View style={{ flex: 1, backgroundColor: '#DDE5DE' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: '#F4F7F4', overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}
