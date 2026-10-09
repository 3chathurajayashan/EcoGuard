import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Page, Panel } from '@/components/admin-ui';
import { Banner, Button, C, Field } from '@/components/kit';
import { ROLE_LABEL, fullName } from '@/utils/roles';
import { useSession } from '@/utils/session';

export default function Settings() {
  const { user, signOut, updateProfile } = useSession();
  const [form, setForm] = useState({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phoneNumber: user?.phoneNumber ?? '' });
  const [notice, setNotice] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const save = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setNotice({ tone: 'red', text: 'First and last name are required.' });
      return;
    }
    setBusy(true);
    try {
      await updateProfile(form);
      setNotice({ tone: 'green', text: 'Profile updated.' });
    } catch (e) {
      setNotice({ tone: 'red', text: e instanceof Error ? e.message : 'Could not update your profile.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Settings" subtitle="Your account and profile.">
      <View style={s.narrow}>
        <Panel title="Account">
          <View style={s.row}>
            <Text style={s.label}>Name</Text>
            <Text style={s.value}>{fullName(user)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Role</Text>
            <Text style={s.value}>{ROLE_LABEL[user.role]}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Email</Text>
            <Text style={s.value}>{user.email}</Text>
          </View>
        </Panel>

        <Panel title="Edit profile">
          {notice ? <Banner tone={notice.tone} text={notice.text} /> : null}
          <View style={{ height: notice ? 12 : 0 }} />
          <Field label="First name" value={form.firstName} onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))} />
          <Field label="Last name" value={form.lastName} onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))} />
          <Field label="Phone" value={form.phoneNumber} onChangeText={(v) => setForm((f) => ({ ...f, phoneNumber: v }))} keyboardType="phone-pad" />
          <Button label="Save changes" onPress={save} loading={busy} />
        </Panel>

        <Button label="Log out" icon="log-out" tone="danger" onPress={() => signOut()} />
      </View>
    </Page>
  );
}

const s = StyleSheet.create({
  narrow: { width: '100%', maxWidth: 520 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E3E8E3' },
  label: { fontSize: 13, color: C.muted },
  value: { fontSize: 14, fontWeight: '700', color: C.text },
});
