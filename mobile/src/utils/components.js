/**
 * Shared UI components used across admin/worker screens.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { rs, rp, STATUS_BAR_HEIGHT } from './layout';

/**
 * Standard screen header with back button.
 * Automatically shows "رجوع" (AR) or "Retour" (FR) based on lang.
 */
export function ScreenHeader({ title, onBack, lang, theme, c, rightElement }) {
  return (
    <>
      <StatusBar
        backgroundColor={c.statusBar}
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
      />
      <View style={[h.safeTop, { height: STATUS_BAR_HEIGHT, backgroundColor: c.statusBar }]} />
      <View style={[h.header, { backgroundColor: c.card, borderBottomColor: c.border }]}>
        <TouchableOpacity style={h.backBtn} onPress={onBack}>
          <Text style={h.backArrow}>‹</Text>
          <Text style={h.backLabel}>{lang === 'fr' ? 'Retour' : 'رجوع'}</Text>
        </TouchableOpacity>
        <Text style={[h.title, { color: c.text }]} numberOfLines={1}>{title}</Text>
        {rightElement ? rightElement : <View style={{ width: rp(70) }} />}
      </View>
    </>
  );
}

const h = StyleSheet.create({
  safeTop:   { },
  header:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rp(12), paddingVertical: rp(12), borderBottomWidth: 1, minHeight: rp(54) },
  backBtn:   { flexDirection: 'row', alignItems: 'center', minWidth: rp(70) },
  backArrow: { color: '#E85D24', fontSize: rs(22), fontWeight: '700', lineHeight: rs(26), marginRight: 2 },
  backLabel: { color: '#E85D24', fontSize: rs(14), fontWeight: '600' },
  title:     { flex: 1, fontSize: rs(16), fontWeight: '700', textAlign: 'center' },
});
