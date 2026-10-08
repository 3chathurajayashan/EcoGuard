import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} iconName="home" label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} iconName="map-pin" label="Map" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Reports',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} iconName="file-text" label="Reports" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} iconName="user" label="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ focused, color, iconName, label }: { focused: boolean, color: any, iconName: any, label: string }) {
  return (
    <View style={styles.tabItemContainer}>
      <View style={[styles.iconBg, focused && styles.iconBgActive]}>
        <Feather name={iconName} size={20} color={focused ? '#FFF' : color} />
      </View>
      <Text style={[styles.tabLabel, { color: focused ? '#1E5631' : color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFF',
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    height: 75,
    paddingTop: 5,
    paddingBottom: 5,
  },
  tabItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: '100%',
    width: 60,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  iconBg: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  iconBgActive: {
    backgroundColor: '#1E5631',
  }
});
