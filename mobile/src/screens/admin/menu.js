import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Modal, Animated, Dimensions, ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getThemeColors } from '../../utils/theme';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';

const { width, height } = Dimensions.get('window');

const MANAGER_ITEMS = [
  { icon: '📈', key: 'reports',      screen: 'reports',      color: '#4A90E2', gradient: '#1e3a5f' },
  { icon: '👥', key: 'employees',    screen: 'employees',    color: '#9B59B6', gradient: '#3d1f5c' },
  { icon: '📅', key: 'attendance',   screen: 'attendance',   color: '#E67E22', gradient: '#5c3010' },
  { icon: '🛢️', key: 'inventory',    screen: 'inventory',    color: '#16A085', gradient: '#0a3d30' },
  { icon: '🚰', key: 'pumps',        screen: 'pumps',        color: '#2980B9', gradient: '#0f3352' },
  { icon: '🧾', key: 'invoices',     screen: 'invoices',     color: '#8E44AD', gradient: '#3b1a52' },
  { icon: '💳', key: 'credits',      screen: 'credits',      color: '#E74C3C', gradient: '#5c1a16' },
  { icon: '🏢', key: 'institutions', screen: 'institutions', color: '#2ECC71', gradient: '#0f4a25' },
  { icon: '🚚', key: 'suppliers',    screen: 'suppliers',    color: '#D35400', gradient: '#5c2200' },
  { icon: '💬', key: 'messages',     screen: 'messages',     color: '#1ABC9C', gradient: '#0a3d30' },
  { icon: '💰', key: 'payroll',      screen: 'payroll',      color: '#F39C12', gradient: '#5c3c0a' },
];

// Items visible for team_leader
const TEAM_LEADER_ITEMS = [
  { icon: '⛽', key: 'sales',        screen: 'sales',        color: '#27AE60', gradient: '#0f4a25' },
  { icon: '📈', key: 'reports',      screen: 'reports',      color: '#4A90E2', gradient: '#1e3a5f' },
  { icon: '📅', key: 'attendance',   screen: 'attendance',   color: '#E67E22', gradient: '#5c3010' },
  { icon: '🛢️', key: 'inventory',    screen: 'inventory',    color: '#16A085', gradient: '#0a3d30' },
  { icon: '🚰', key: 'pumps',        screen: 'pumps',        color: '#2980B9', gradient: '#0f3352' },
  { icon: '🧾', key: 'invoices',     screen: 'invoices',     color: '#8E44AD', gradient: '#3b1a52' },
  { icon: '💳', key: 'credits',      screen: 'credits',      color: '#E74C3C', gradient: '#5c1a16' },
  { icon: '🏢', key: 'institutions', screen: 'institutions', color: '#2ECC71', gradient: '#0f4a25' },
  { icon: '💬', key: 'messages',     screen: 'messages',     color: '#1ABC9C', gradient: '#0a3d30' },
];

// Animated tile component
function MenuTile({ item, onPress, tileW, tileH, index, t, lang }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 55;
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, delay, useNativeDriver: true, tension: 80, friction: 7 }),
      Animated.timing(fadeAnim,  { toValue: 1, delay, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const pressAnim = useRef(new Animated.Value(1)).current;
  function onPressIn()  { Animated.spring(pressAnim, { toValue: 0.93, useNativeDriver: true, speed: 30 }).start(); }
  function onPressOut() { Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, speed: 30 }).start(); }

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: Animated.multiply(scaleAnim, pressAnim) }] }}>
      <TouchableOpacity
        style={[styles.tile, { width: tileW, height: tileH, backgroundColor: item.gradient + 'cc', borderColor: item.color + '40' }]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={[styles.tileIconCircle, { backgroundColor: item.color + '25', borderColor: item.color + '50' }]}>
          <Text style={styles.tileIcon}>{item.icon}</Text>
        </View>
        <Text style={[styles.tileLabel, { color: '#fff' }]} numberOfLines={2} adjustsFontSizeToFit>
          {t[item.key] || item.key}
        </Text>
        <View style={[styles.tileDot, { backgroundColor: item.color }]} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AdminMenu({ navigate }) {
  const { user, t, doLogout, lang, theme, toggleTheme, toggleLang } = useAuth();
  const c = getThemeColors(theme || 'dark');
  const [showSettings, setShowSettings] = useState(false);
  const modalAnim = useRef(new Animated.Value(0)).current;

  const today = new Date().toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const isManager = user?.role === 'manager';
  const items = isManager ? MANAGER_ITEMS : TEAM_LEADER_ITEMS;

  // Compute grid dimensions to fill the available screen space
  const COLS     = 3;
  const GAP      = rp(10);
  const H_PAD    = rp(12);
  const HEADER_H = STATUS_BAR_HEIGHT + rp(76); // safe + header
  const usableH  = height - HEADER_H - rp(20);
  const usableW  = width - H_PAD * 2;
  const rows     = Math.ceil(items.length / COLS);
  const tileW    = (usableW - GAP * (COLS - 1)) / COLS;
  const tileH    = Math.max(rp(95), (usableH - GAP * (rows - 1)) / rows);

  function openSettings() {
    setShowSettings(true);
    Animated.spring(modalAnim, { toValue: 1, useNativeDriver: true, tension: 70, friction: 9 }).start();
  }
  function closeSettings() {
    Animated.timing(modalAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setShowSettings(false));
  }

  const modalTranslateY = modalAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <StatusBar backgroundColor={c.statusBar} barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
      <View style={[styles.safeTop, { height: STATUS_BAR_HEIGHT, backgroundColor: c.statusBar }]} />

      {/* Header */}
      <Animated.View style={[styles.header, { backgroundColor: c.card, borderBottomColor: c.border, opacity: headerAnim }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: c.text }]} numberOfLines={1}>
            {t.welcome}، {lang === 'ar' ? (user?.full_name_ar || user?.full_name) : user?.full_name}
          </Text>
          <Text style={[styles.dateText, { color: c.sub }]}>{today}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{t[user?.role] || user?.role}</Text>
          </View>
          <TouchableOpacity style={[styles.settingsBtn, { backgroundColor: 'rgba(232,93,36,0.12)', borderColor: c.border }]} onPress={openSettings}>
            <Text style={{ fontSize: rs(18) }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Grid — fills the screen */}
      <View style={[styles.grid, { padding: H_PAD, gap: GAP }]}>
        {items.map((item, idx) => (
          <MenuTile
            key={item.screen}
            item={item}
            index={idx}
            tileW={tileW}
            tileH={tileH}
            t={t}
            lang={lang}
            onPress={() => navigate(item.screen)}
          />
        ))}
      </View>

      {/* Settings Modal — bottom sheet */}
      <Modal visible={showSettings} transparent animationType="none" onRequestClose={closeSettings}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeSettings}>
          <Animated.View
            style={[styles.sheet, { backgroundColor: c.card, borderColor: c.border, transform: [{ translateY: modalTranslateY }] }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.handle, { backgroundColor: c.muted + '80' }]} />
            <Text style={[styles.sheetTitle, { color: c.text }]}>
              {t.settings}
            </Text>

            {/* Language row */}
            <TouchableOpacity style={[styles.row, { borderBottomColor: c.border }]} onPress={() => { toggleLang(); }}>
              <View style={[styles.rowIcon, { backgroundColor: 'rgba(232,93,36,0.12)' }]}>
                <Text style={{ fontSize: rs(18) }}>🌐</Text>
              </View>
              <View style={{ flex: 1, marginHorizontal: rp(12) }}>
                <Text style={[styles.rowTitle, { color: c.text }]}>{t.language}</Text>
                <Text style={[styles.rowSub, { color: c.sub }]}>{t.switchLangDesc}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: 'rgba(232,93,36,0.15)' }]}>
                <Text style={[styles.badgeText, { color: '#E85D24' }]}>{lang === 'ar' ? 'عربي' : 'FR'}</Text>
              </View>
            </TouchableOpacity>

            {/* Theme row */}
            <TouchableOpacity style={[styles.row, { borderBottomColor: c.border }]} onPress={() => { toggleTheme(); }}>
              <View style={[styles.rowIcon, { backgroundColor: theme === 'dark' ? 'rgba(74,144,226,0.12)' : 'rgba(245,189,0,0.12)' }]}>
                <Text style={{ fontSize: rs(18) }}>{theme === 'dark' ? '🌙' : '☀️'}</Text>
              </View>
              <View style={{ flex: 1, marginHorizontal: rp(12) }}>
                <Text style={[styles.rowTitle, { color: c.text }]}>{t.theme}</Text>
                <Text style={[styles.rowSub, { color: c.sub }]}>
                  {theme === 'dark' ? t.currentDark : t.currentLight}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: theme === 'dark' ? 'rgba(74,144,226,0.15)' : 'rgba(245,189,0,0.15)' }]}>
                <Text style={[styles.badgeText, { color: theme === 'dark' ? '#4A90E2' : '#C89B00' }]}>
                  {theme === 'dark' ? t.darkMode : t.lightMode}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Logout row */}
            <TouchableOpacity style={styles.logoutRow} onPress={() => { closeSettings(); setTimeout(doLogout, 220); }}>
              <View style={[styles.rowIcon, { backgroundColor: 'rgba(226,75,74,0.12)' }]}>
                <Text style={{ fontSize: rs(18) }}>🚪</Text>
              </View>
              <Text style={[styles.logoutText, { marginLeft: rp(12) }]}>{t.logout}</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1 },
  safeTop:       { },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rp(16), paddingVertical: rp(12), borderBottomWidth: 1 },
  greeting:      { fontSize: rs(15), fontWeight: '700' },
  dateText:      { fontSize: rs(11), marginTop: 2 },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: rp(8), marginLeft: rp(10) },
  rolePill:      { backgroundColor: 'rgba(232,93,36,0.15)', borderRadius: 20, paddingHorizontal: rp(10), paddingVertical: rp(4) },
  rolePillText:  { color: '#E85D24', fontSize: rs(11), fontWeight: '700' },
  settingsBtn:   { width: rp(38), height: rp(38), borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  grid:          { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start' },
  tile:          { borderRadius: 18, borderWidth: 1, justifyContent: 'space-between', alignItems: 'center', padding: rp(12), paddingVertical: rp(14) },
  tileIconCircle:{ width: rp(52), height: rp(52), borderRadius: rp(16), borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  tileIcon:      { fontSize: rs(28) },
  tileLabel:     { fontSize: rs(12), fontWeight: '700', textAlign: 'center', lineHeight: rs(16) },
  tileDot:       { width: rp(6), height: rp(6), borderRadius: rp(3), opacity: 0.7 },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:         { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: rp(12), paddingHorizontal: rp(24), paddingBottom: rp(48), borderWidth: 1, borderBottomWidth: 0 },
  handle:        { width: rp(40), height: rp(4), borderRadius: 2, alignSelf: 'center', marginBottom: rp(16) },
  sheetTitle:    { fontSize: rs(18), fontWeight: '800', textAlign: 'center', marginBottom: rp(20) },
  row:           { flexDirection: 'row', alignItems: 'center', paddingVertical: rp(16), borderBottomWidth: 1 },
  rowIcon:       { width: rp(44), height: rp(44), borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  rowTitle:      { fontSize: rs(14), fontWeight: '600' },
  rowSub:        { fontSize: rs(11), marginTop: 2 },
  badge:         { paddingHorizontal: rp(10), paddingVertical: rp(5), borderRadius: 8 },
  badgeText:     { fontSize: rs(12), fontWeight: '700' },
  logoutRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: rp(16) },
  logoutText:    { fontSize: rs(14), fontWeight: '700', color: '#E74C3C', flex: 1 },
});