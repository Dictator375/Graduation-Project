import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar, Modal, Animated,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getThemeColors } from '../../utils/theme';
import { getSales, getPayroll, getInventory } from '../../utils/api';
import { STATUS_BAR_HEIGHT, TAB_BAR_HEIGHT, rs, rp, width } from '../../utils/layout';

function fmt(n) { return Number(n || 0).toLocaleString(); }

const PAYMENT_ICON  = { cash: '💵', card: '💳', loyalty: '⭐', credit: '🏢' };
const PAYMENT_COLOR = { cash: '#1D9E75', card: '#4A90E2', loyalty: '#BA7517', credit: '#E24B4A' };

function AnimatedCard({ children, delay = 0, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 320, delay, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [16, 0] }) }] }, style]}>
      {children}
    </Animated.View>
  );
}

export default function WorkerDashboard({ navigate }) {
  const { user, t, doLogout, lang, theme, toggleTheme, toggleLang } = useAuth();
  const c = getThemeColors(theme || 'dark');
  const [sales,      setSales]      = useState([]);
  const [payDates,   setPayDates]   = useState([]);
  const [inventory,  setInventory]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const modalAnim = useRef(new Animated.Value(0)).current;

  async function load() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [s, p, inv] = await Promise.all([
        getSales({ date: today, limit: 10 }),
        getPayroll(),
        getInventory(),
      ]);
      setSales(s.data   || []);
      setPayDates(p.data  || []);
      setInventory(inv.data || []);
    } catch (e) {}
    setLoading(false);
    setRefreshing(false);
  }
  useEffect(() => { load(); }, []);

  function openSettings() {
    setShowSettings(true);
    Animated.spring(modalAnim, { toValue: 1, useNativeDriver: true, tension: 70, friction: 9 }).start();
  }
  function closeSettings() {
    Animated.timing(modalAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setShowSettings(false));
  }
  const modalTranslateY = modalAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] });

  const todayTotal = sales.reduce((s, r) => s + (r.total_amount || 0), 0);
  const nextPay    = payDates.find(d => d.pay_date >= new Date().toISOString().split('T')[0]);
  const hour = new Date().getHours();
  const shiftName = hour >= 8 && hour < 14 ? t.morningShift : hour >= 14 && hour < 20 ? t.afternoonShift : t.nightShift;

  // Payment method label translations
  const payLabel = {
    cash:    t.cash,
    card:    t.card,
    loyalty: t.loyalty,
    credit:  t.credit,
  };

  const st = getStyles(c);

  return (
    <View style={st.screen}>
      <StatusBar backgroundColor={c.statusBar} barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
      <View style={[st.safeTop, { height: STATUS_BAR_HEIGHT }]} />

      {/* Tab bar */}
      <View style={[st.tabBar, { backgroundColor: c.card, borderBottomColor: c.border }]}>
        {[
          { icon: '🏠', label: t.dashboard, key: 'home',     active: true  },
          { icon: '⛽', label: t.newSale,   key: 'sales',    active: false },
          { icon: '💬', label: t.chat,      key: 'chat',     active: false },
          { icon: '⚙️', label: t.settings,  key: 'settings', active: false },
        ].map(tab => (
          tab.active
            ? <View key={tab.key} style={[st.tab, st.tabActive]}>
                <Text style={st.tabIcon}>{tab.icon}</Text>
                <Text style={st.tabLabelActive}>{tab.label}</Text>
              </View>
            : <TouchableOpacity key={tab.key} style={st.tab} onPress={() => tab.key === 'settings' ? openSettings() : navigate(tab.key)}>
                <Text style={[st.tabIcon, { color: c.sub }]}>{tab.icon}</Text>
                <Text style={[st.tabLabel, { color: c.sub }]}>{tab.label}</Text>
              </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <View style={st.center}><ActivityIndicator color="#E85D24" size="large" /></View>
        : (
          <ScrollView
            contentContainerStyle={st.content}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#E85D24" />}
          >
            {/* Welcome header */}
            <AnimatedCard delay={0}>
              <View style={st.welcomeCard}>
                <Text style={st.welcomeName}>
                  {t.welcome}, {lang === 'ar' ? (user?.full_name_ar || user?.full_name) : user?.full_name}
                </Text>
                <Text style={st.shiftLabel}>{shiftName}</Text>
              </View>
            </AnimatedCard>

            {/* Stats row */}
            <AnimatedCard delay={80}>
              <View style={st.statsRow}>
                <View style={[st.statCard, { backgroundColor: c.card, borderColor: c.border, marginRight: rp(8) }]}>
                  <Text style={[st.statLabel, { color: c.sub }]}>{t.mySalesToday}</Text>
                  <Text style={[st.statValue, { color: c.text }]} adjustsFontSizeToFit numberOfLines={1}>{fmt(todayTotal)}</Text>
                  <Text style={[st.statSub, { color: c.muted }]}>{t.currency} · {sales.length} {t.operationsCount}</Text>
                </View>
                <View style={[st.statCard, { backgroundColor: c.card, borderColor: c.border }]}>
                  <Text style={[st.statLabel, { color: c.sub }]}>{t.nextPayDate}</Text>
                  <Text style={[st.statValue, { color: c.text }]} adjustsFontSizeToFit numberOfLines={1}>
                    {nextPay
                      ? new Date(nextPay.pay_date).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-DZ', { month: 'short', day: 'numeric' })
                      : '—'}
                  </Text>
                  <Text style={[st.statSub, { color: c.muted }]} numberOfLines={1}>{nextPay?.description || (lang === 'fr' ? 'Aucune date prévue' : 'لا يوجد موعد')}</Text>
                </View>
              </View>
            </AnimatedCard>

            {/* Fuel availability */}
            <AnimatedCard delay={160}>
              <Text style={[st.section, { color: c.text }]}>{t.fuelAvailability}</Text>
              <View style={[st.fuelContainer, { backgroundColor: c.card, borderColor: c.border }]}>
                {inventory.length === 0
                  ? <Text style={[st.empty, { color: c.muted }]}>{t.noData}</Text>
                  : inventory.map((inv, i) => {
                    const pct = Math.min(100, Math.round((inv.quantity_liters / 30000) * 100));
                    const col = pct < 20 ? '#E74C3C' : pct < 40 ? '#F39C12' : '#2ECC71';
                    return (
                      <View key={inv.id} style={[st.fuelRow, i < inventory.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
                        <View style={[st.fuelDot, { backgroundColor: col }]} />
                        <Text style={[st.fuelName, { color: c.text }]}>
                          {lang === 'ar' ? inv.name_ar : (inv.name_fr || inv.name_ar)}
                        </Text>
                        <View style={{ flex: 1, marginHorizontal: rp(12) }}>
                          <View style={[st.barTrack, { backgroundColor: c.trackBg }]}>
                            <Animated.View style={[st.barFill, { width: `${pct}%`, backgroundColor: col }]} />
                          </View>
                        </View>
                        <Text style={[st.fuelPct, { color: col }]}>{pct}%</Text>
                      </View>
                    );
                  })}
              </View>
            </AnimatedCard>

            {/* Recent sales */}
            <AnimatedCard delay={240}>
              <Text style={[st.section, { color: c.text }]}>{t.latestSalesToday}</Text>
              {sales.length === 0
                ? <View style={[st.emptyWrap, { backgroundColor: c.card, borderColor: c.border }]}>
                    <Text style={{ fontSize: rs(32) }}>⛽</Text>
                    <Text style={[st.empty, { color: c.muted }]}>{t.noSalesToday}</Text>
                  </View>
                : sales.map((sale, i) => (
                  <View key={sale.id} style={[st.saleCard, { backgroundColor: c.card, borderColor: c.border }]}>
                    <View style={[st.saleIconWrap, { backgroundColor: (PAYMENT_COLOR[sale.payment_method] || '#888') + '18' }]}>
                      <Text style={{ fontSize: rs(20) }}>{PAYMENT_ICON[sale.payment_method] || '💰'}</Text>
                    </View>
                    <View style={{ flex: 1, marginHorizontal: rp(10) }}>
                      <Text style={[st.saleName, { color: c.text }]}>
                        {lang === 'ar' ? sale.fuel_name_ar : (sale.fuel_name_fr || sale.fuel_name_ar)} · {sale.quantity_liters} L
                      </Text>
                      <Text style={[st.saleSub, { color: c.sub }]}>
                        {t.pump} {sale.pump_number}
                        {sale.payment_method === 'credit' && sale.institution_name ? ` · ${sale.institution_name}` : ''}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={st.saleAmt}>{fmt(sale.total_amount)} {t.currency}</Text>
                      <View style={[st.payBadge, { backgroundColor: (PAYMENT_COLOR[sale.payment_method] || '#888') + '20' }]}>
                        <Text style={[st.payBadgeText, { color: PAYMENT_COLOR[sale.payment_method] || '#888' }]}>
                          {payLabel[sale.payment_method] || sale.payment_method}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              }
            </AnimatedCard>

            <View style={{ height: rp(30) }} />
          </ScrollView>
        )
      }

      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="none" onRequestClose={closeSettings}>
        <TouchableOpacity style={st.overlay} activeOpacity={1} onPress={closeSettings}>
          <Animated.View
            style={[st.sheet, { backgroundColor: c.card, borderColor: c.border, transform: [{ translateY: modalTranslateY }] }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[st.handle, { backgroundColor: c.muted + '80' }]} />
            <Text style={[st.sheetTitle, { color: c.text }]}>
              {t.settings}
            </Text>

            <TouchableOpacity style={[st.sheetRow, { borderBottomColor: c.border }]} onPress={toggleLang}>
              <View style={[st.sheetIcon, { backgroundColor: 'rgba(232,93,36,0.12)' }]}><Text style={{ fontSize: rs(18) }}>🌐</Text></View>
              <View style={{ flex: 1, marginHorizontal: rp(12) }}>
                <Text style={[st.sheetRowTitle, { color: c.text }]}>{t.language}</Text>
                <Text style={[st.sheetRowSub, { color: c.sub }]}>{t.switchLangDesc}</Text>
              </View>
              <View style={[st.pill, { backgroundColor: 'rgba(232,93,36,0.15)' }]}>
                <Text style={[st.pillText, { color: '#E85D24' }]}>{lang === 'ar' ? 'عربي' : 'FR'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[st.sheetRow, { borderBottomColor: c.border }]} onPress={toggleTheme}>
              <View style={[st.sheetIcon, { backgroundColor: theme === 'dark' ? 'rgba(74,144,226,0.12)' : 'rgba(245,189,0,0.12)' }]}>
                <Text style={{ fontSize: rs(18) }}>{theme === 'dark' ? '🌙' : '☀️'}</Text>
              </View>
              <View style={{ flex: 1, marginHorizontal: rp(12) }}>
                <Text style={[st.sheetRowTitle, { color: c.text }]}>{t.theme}</Text>
                <Text style={[st.sheetRowSub, { color: c.sub }]}>
                  {theme === 'dark' ? t.currentDark : t.currentLight}
                </Text>
              </View>
              <View style={[st.pill, { backgroundColor: theme === 'dark' ? 'rgba(74,144,226,0.15)' : 'rgba(245,189,0,0.15)' }]}>
                <Text style={[st.pillText, { color: theme === 'dark' ? '#4A90E2' : '#C89B00' }]}>
                  {theme === 'dark' ? t.darkMode : t.lightMode}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={st.logoutRow} onPress={() => { closeSettings(); setTimeout(doLogout, 220); }}>
              <View style={[st.sheetIcon, { backgroundColor: 'rgba(226,75,74,0.12)' }]}><Text style={{ fontSize: rs(18) }}>🚪</Text></View>
              <Text style={[st.logoutText, { marginLeft: rp(12) }]}>{t.logout}</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const getStyles = (c) => StyleSheet.create({
  screen:         { flex: 1, backgroundColor: c.bg },
  safeTop:        { backgroundColor: c.statusBar },
  tabBar:         { flexDirection: 'row', borderBottomWidth: 1, height: TAB_BAR_HEIGHT },
  tab:            { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabActive:      { borderBottomWidth: 3, borderBottomColor: '#E85D24', backgroundColor: 'rgba(232,93,36,0.1)' },
  tabIcon:        { fontSize: rs(17), textAlign: 'center', color: '#E85D24' },
  tabLabel:       { fontSize: rs(9), marginTop: 2, textAlign: 'center' },
  tabLabelActive: { fontSize: rs(9), marginTop: 2, color: '#E85D24', fontWeight: '700', textAlign: 'center' },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content:        { padding: rp(14), paddingBottom: rp(50) },
  welcomeCard:    { backgroundColor: 'rgba(232,93,36,0.1)', borderRadius: 16, padding: rp(16), marginBottom: rp(12), borderWidth: 1, borderColor: 'rgba(232,93,36,0.2)' },
  welcomeName:    { color: '#E85D24', fontSize: rs(17), fontWeight: '700', textAlign: 'right' },
  shiftLabel:     { color: '#E85D24', fontSize: rs(12), textAlign: 'right', marginTop: 4, opacity: 0.7 },
  statsRow:       { flexDirection: 'row', marginBottom: rp(12) },
  statCard:       { flex: 1, borderRadius: 14, padding: rp(14), borderWidth: 1 },
  statLabel:      { fontSize: rs(11), textAlign: 'right', marginBottom: 4 },
  statValue:      { fontSize: rs(22), fontWeight: '800', textAlign: 'right' },
  statSub:        { fontSize: rs(10), textAlign: 'right', marginTop: 2 },
  section:        { fontSize: rs(14), fontWeight: '700', textAlign: 'right', marginBottom: rp(8), marginTop: rp(4) },
  fuelContainer:  { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: rp(12) },
  fuelRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rp(14), paddingVertical: rp(12) },
  fuelDot:        { width: rp(10), height: rp(10), borderRadius: rp(5), marginRight: rp(8) },
  fuelName:       { fontSize: rs(13), fontWeight: '500', minWidth: rp(70) },
  barTrack:       { height: 7, borderRadius: 4, overflow: 'hidden' },
  barFill:        { height: '100%', borderRadius: 4 },
  fuelPct:        { fontSize: rs(12), fontWeight: '700', minWidth: rp(36), textAlign: 'right' },
  emptyWrap:      { borderRadius: 14, borderWidth: 1, padding: rp(24), alignItems: 'center', gap: rp(8), marginBottom: rp(12) },
  empty:          { fontSize: rs(13), textAlign: 'center' },
  saleCard:       { borderRadius: 12, padding: rp(12), marginBottom: rp(8), flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  saleIconWrap:   { width: rp(42), height: rp(42), borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  saleName:       { fontSize: rs(13), fontWeight: '600', textAlign: 'right' },
  saleSub:        { fontSize: rs(11), textAlign: 'right', marginTop: 2 },
  saleAmt:        { color: '#E85D24', fontWeight: '700', fontSize: rs(14), textAlign: 'right' },
  payBadge:       { paddingHorizontal: rp(7), paddingVertical: rp(3), borderRadius: 6, marginTop: 4 },
  payBadgeText:   { fontSize: rs(10), fontWeight: '700' },
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:          { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: rp(12), paddingHorizontal: rp(24), paddingBottom: rp(50), borderWidth: 1, borderBottomWidth: 0 },
  handle:         { width: rp(40), height: rp(4), borderRadius: 2, alignSelf: 'center', marginBottom: rp(20) },
  sheetTitle:     { fontSize: rs(18), fontWeight: '800', textAlign: 'center', marginBottom: rp(20) },
  sheetRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: rp(16), borderBottomWidth: 1 },
  sheetIcon:      { width: rp(44), height: rp(44), borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  sheetRowTitle:  { fontSize: rs(14), fontWeight: '600' },
  sheetRowSub:    { fontSize: rs(11), marginTop: 2 },
  pill:           { paddingHorizontal: rp(10), paddingVertical: rp(5), borderRadius: 8 },
  pillText:       { fontSize: rs(12), fontWeight: '700' },
  logoutRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: rp(16) },
  logoutText:     { fontSize: rs(14), fontWeight: '700', color: '#E74C3C', flex: 1 },
});