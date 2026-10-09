import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { C } from '@/components/kit';
import type { Criteria, Options } from '@/utils/analytics';

const CATEGORY_ICON: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  hotspots: 'alert-triangle',
  coverage: 'map',
  conflict: 'trending-up',
};

/** Park, time period and analysis categories: used by "Select Analysis Criteria" and "Refine Analysis". */
export default function CriteriaForm({
  value,
  options,
  onChange,
  error,
}: {
  value: Criteria;
  options: Options;
  onChange: (next: Criteria) => void;
  error?: string;
}) {
  const [open, setOpen] = useState<'park' | 'period' | null>(null);
  const periodLabel = options.periods.find((p) => p.value === value.period)?.label ?? value.period;

  const toggle = (category: string) => {
    const has = value.categories.includes(category);
    onChange({ ...value, categories: has ? value.categories.filter((c) => c !== category) : [...value.categories, category] });
  };

  return (
    <View>
      <Text style={s.label}>Park / Conservation Area</Text>
      <Select
        icon="map-pin"
        text={value.park}
        open={open === 'park'}
        onPress={() => setOpen(open === 'park' ? null : 'park')}
        items={options.parks.map((p) => ({ key: p, label: p }))}
        selected={value.park}
        onPick={(park) => {
          onChange({ ...value, park });
          setOpen(null);
        }}
      />

      <Text style={[s.label, { marginTop: 16 }]}>Time Period</Text>
      <Select
        icon="calendar"
        text={periodLabel}
        open={open === 'period'}
        onPress={() => setOpen(open === 'period' ? null : 'period')}
        items={options.periods.map((p) => ({ key: p.value, label: p.label }))}
        selected={value.period}
        onPick={(period) => {
          onChange({ ...value, period });
          setOpen(null);
        }}
      />

      <Text style={[s.label, { marginTop: 16 }]}>Analysis Categories</Text>
      {options.categories.map((c) => {
        const on = value.categories.includes(c.value);
        return (
          <TouchableOpacity key={c.value} style={s.check} onPress={() => toggle(c.value)} activeOpacity={0.8}>
            <View style={[s.box, on && s.boxOn]}>{on ? <Feather name="check" size={14} color="#FFF" /> : null}</View>
            <Feather name={CATEGORY_ICON[c.value] ?? 'circle'} size={16} color={c.value === 'hotspots' ? C.red : C.green} />
            <Text style={s.checkText}>{c.label}</Text>
          </TouchableOpacity>
        );
      })}
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

function Select({
  icon,
  text,
  open,
  onPress,
  items,
  selected,
  onPick,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  text: string;
  open: boolean;
  onPress: () => void;
  items: { key: string; label: string }[];
  selected: string;
  onPick: (key: string) => void;
}) {
  return (
    <View>
      <TouchableOpacity style={s.select} onPress={onPress} activeOpacity={0.8}>
        <Feather name={icon} size={16} color={C.green} />
        <Text style={s.selectText}>{text}</Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#667" />
      </TouchableOpacity>
      {open ? (
        <View style={s.options}>
          {items.map((it) => (
            <TouchableOpacity key={it.key} style={[s.option, it.key === selected && s.optionOn]} onPress={() => onPick(it.key)}>
              <Text style={[s.optionText, it.key === selected && { color: C.green, fontWeight: '800' }]}>{it.label}</Text>
              {it.key === selected ? <Feather name="check" size={15} color={C.green} /> : null}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '800', color: C.text, marginBottom: 7 },
  select: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: '#D5DDD7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FFF' },
  selectText: { flex: 1, fontSize: 14, color: C.text },
  options: { borderWidth: 1, borderColor: '#D5DDD7', borderRadius: 10, marginTop: 4, backgroundColor: '#FFF', overflow: 'hidden' },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E3E8E3' },
  optionOn: { backgroundColor: '#EAF5EC' },
  optionText: { fontSize: 14, color: C.text },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  box: { width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: '#9AA9A0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  boxOn: { backgroundColor: C.green, borderColor: C.green },
  checkText: { fontSize: 14, color: C.text },
  error: { color: C.red, fontSize: 12, marginTop: 6 },
});
