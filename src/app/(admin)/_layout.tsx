import { Stack } from 'expo-router';
import React from 'react';

import AdminShell from '@/components/admin-shell';

/** Dashboard layout for park managers and researchers: sidebar + top bar around a stack of pages. */
export default function AdminLayout() {
  return (
    <AdminShell>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
    </AdminShell>
  );
}
