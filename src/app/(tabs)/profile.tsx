import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ROLE_LABEL, fullName } from '@/utils/roles';
import { useSession } from '@/utils/session';

export default function ProfileScreen() {
  const { user, signOut, updateProfile } = useSession();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ firstName: '', lastName: '', phoneNumber: '' });
  const [message, setMessage] = useState('');

  if (!user) return <SafeAreaView style={styles.container} />;

  const name = fullName(user);
  const role = ROLE_LABEL[user.role];
  const email = user.email;
  const phone = user.phoneNumber || 'Not added';
  const avatarUrl =
    user.profilePicture?.url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop';

  const startEdit = () => {
    setDraft({ firstName: user.firstName, lastName: user.lastName, phoneNumber: user.phoneNumber ?? '' });
    setMessage('');
    setEditing(true);
  };
  const saveEdit = async () => {
    try {
      await updateProfile(draft);
      setEditing(false);
      setMessage('Profile updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update your profile.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{name}</Text>
          <Text style={[styles.role, { color: '#666', marginBottom: 10 }]}>{role}</Text>

          <View style={styles.badgeContainer}>
            <Text style={styles.badgeIcon}>🛡️</Text>
            <Text style={styles.badgeText}>{user.role === 'VILLAGER' ? 'Community Member' : 'Verified Officer'}</Text>
          </View>
        </View>

        {editing ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            {(['firstName', 'lastName', 'phoneNumber'] as const).map((key) => (
              <View key={key} style={{ marginBottom: 10 }}>
                <Text style={styles.infoLabel}>{key === 'firstName' ? 'First name' : key === 'lastName' ? 'Last name' : 'Phone'}</Text>
                <TextInput
                  style={styles.editInput}
                  value={draft[key]}
                  onChangeText={(v) => setDraft((d) => ({ ...d, [key]: v }))}
                />
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.editBtn, { backgroundColor: '#1E5631' }]} onPress={saveEdit}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.editBtn, { backgroundColor: '#ECEFF1' }]} onPress={() => setEditing(false)}>
                <Text style={{ color: '#455A64', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>Active</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications')}>
            <Text style={styles.menuItemText}>Notifications</Text>
            <Feather name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={startEdit}>
            <Text style={styles.menuItemText}>Edit Profile</Text>
            <Feather name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut()}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  editInput: { borderWidth: 1, borderColor: '#D5DDD7', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 15, marginTop: 4, backgroundColor: '#FFF' },
  editBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  message: { textAlign: 'center', color: '#2E7D32', marginBottom: 12, fontWeight: '600' },
  container: {
    flex: 1,
    backgroundColor: '#F7FFF7',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#1E5631',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E5631',
  },
  role: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  badgeText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E5631',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemText: {
    fontSize: 15,
    color: '#444',
  },
  menuItemArrow: {
    fontSize: 18,
    color: '#CCC',
  },
  logoutBtn: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutBtnText: {
    color: '#E65100',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
