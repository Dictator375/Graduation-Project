import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar, Animated,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getThemeColors } from '../../utils/theme';
import { getSalesSummary, getInventory, getEmployees, getShiftSales, getEmployeeRanking } from '../../utils/api';
import { STATUS_BAR_HEIGHT, TAB_BAR_HEIGHT, rs, rp } from '../../utils/layout';

function fmt(n) { return Number(n || 0).toLocaleString(); }

function AnimatedCard({ children, delay = 0, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 320, delay, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [18, 0] }) }] }, style]}>
      {children}
    </Animated.View>
  );
}

export default function AdminDashboard({ navigate }) {
  const { t, lang, theme, doLogout } = useAuth();
  const c = getThemeColors(theme || 'dark');
  const [summary,    setSummary]    = useState([]);
  const [inventory,  setInventory]  = useState([]);
  const [empCount,   setEmpCount]   = useState(0);
  const [shiftSales, setShiftSales] = useState([]);
  const [ranking,    setRanking]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [s, inv, emp, shift, rnk] = await Promise.all([
        getSalesSummary({ period: 'daily', date: today }),
        getInventory(),
        getEmployees(),
        getShiftSales(),
        getEmployeeRanking({ period: 'daily' }),
      ]);
      setSummary(s.data || []);
      setInventory(inv.data || []);
      setEmpCount((emp.data || []).filter(e => e.is_active).length);
      setShiftSales(shift.data || []);
      setRanking(rnk.data || []);
    } catch (e) {}
    setLoading(false);
    setRefreshing(false);
  }
  useEffect(() => { load(); }, []);

  const todayDA   = summary.reduce((s, r) => s + (r.total_da || 0), 0);
  const todayL    = summary.reduce((s, r) => s + (r.total_liters || 0), 0);
  const todayTxns = summary.reduce((s, r) => s + (r.transactions || 0), 0);

  const s = getStyles(c);

  return (
    <View style={s.screen}>
      <StatusBar backgroundColor={c.statusBar} barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
      <View style={[s.safeTop, { height: STATUS_BAR_HEIGHT }]} />

      {/* Tab bar */}
      <View style={[s.tabBar, { backgroundColor: c.card, borderBottomColor: c.border }]}>
        <View style={[s.tab, s.tabActive]}>
          <Text style={s.tabIcon}>📊</Text>
          <Text style={s.tabLabelActive}>{t.dashboard}</Text>
        </View>
        <TouchableOpacity style={s.tab} onPress={() => navigate('messages')}>
          <Text style={[s.tabIcon, { color: c.sub }]}>💬</Text>
          <Text style={[s.tabLabel, { color: c.sub }]}>{t.messages}</Text>
        </TouchableOpacity>
      </View>

      {loading
        ? <View style={s.center}><ActivityIndicator color="#E85D24" size="large" /></View>
        : (
          <ScrollView
            contentContainerStyle={s.content}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#E85D24" />}
          >
            <AnimatedCard delay={0}>
              <Text style={s.heading}>{t.dashboard} 📊</Text>
            </AnimatedCard>

            {/* KPI Cards */}
            <AnimatedCard delay={60}>
              <View style={s.row}>
                <View style={[s.kpiCard, { marginRight: rp(8), backgroundColor: c.card, borderColor: c.border }]}>
                  <Text style={[s.kpiLabel, { color: c.sub }]}>{t.todayRevenue}</Text>
                  <Text style={[s.kpiVal, { color: c.text }]} adjustsFontSizeToFit numberOfLines={1}>{fmt(todayDA)}</Text>
                  <Text style={[s.kpiSub, { color: c.muted }]}>{t.currency}</Text>
                </View>
                <View style={[s.kpiCard, { backgroundColor: c.card, borderColor: c.border }]}>
                  <Text style={[s.kpiLabel, { color: c.sub }]}>{t.fuelSoldToday}</Text>
                  <Text style={[s.kpiVal, { color: c.text }]} adjustsFontSizeToFit numberOfLines={1}>{fmt(todayL)}</Text>
                  <Text style={[s.kpiSub, { color: c.muted }]}>L</Text>
                </View>
              </View>
              <View style={s.row}>
                <View style={[s.kpiCard, { marginRight: rp(8), backgroundColor: c.card, borderColor: c.border }]}>
                  <Text style={[s.kpiLabel, { color: c.sub }]}>{t.operationsTitle}</Text>
                  <Text style={[s.kpiVal, { color: c.text }]}>{todayTxns}</Text>
                  <Text style={[s.kpiSub, { color: c.muted }]}>{t.today}</Text>
                </View>
                <View style={[s.kpiCard, { backgroundColor: c.card, borderColor: c.border }]}>
                  <Text style={[s.kpiLabel, { color: c.sub }]}>{t.employees}</Text>
                  <Text style={[s.kpiVal, { color: c.text }]}>{empCount}</Text>
                  <Text style={[s.kpiSub, { color: c.muted }]}>{t.active}</Text>
                </View>
              </View>
            </AnimatedCard>

            {/* Inventory */}
            <AnimatedCard delay={140}>
              <Text style={[s.section, { color: c.text }]}>{t.inventory}</Text>
              <View style={[s.tableCard, { backgroundColor: c.card, borderColor: c.border }]}>
                {inventory.length === 0
                  ? <Text style={[s.empty, { color: c.muted }]}>{t.noData}</Text>
                  : inventory.map((inv, i) => {
                    const pct = Math.min(100, Math.round((inv.quantity_liters / 30000) * 100));
                    const col = pct < 20 ? '#E74C3C' : pct < 40 ? '#F39C12' : '#2ECC71';
                    return (
                      <View key={inv.id} style={[s.invRow, i < inventory.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
                        <View style={[s.invDot, { backgroundColor: col }]} />
                        <Text style={[s.invName, { color: c.text }]}>{lang === 'fr' ? (inv.name_fr || inv.name_ar) : inv.name_ar}</Text>
                        <View style={{ flex: 1, marginHorizontal: rp(10) }}>
                          <View style={[s.barTrack, { backgroundColor: c.trackBg }]}>
                            <View style={[s.barFill, { width: `${pct}%`, backgroundColor: col }]} />
                          </View>
                        </View>
                        <Text style={[s.invPct, { color: col }]}>{pct}%</Text>
                      </View>
                    );
                  })}
              </View>
            </AnimatedCard>

            {/* Today breakdown */}
            <AnimatedCard delay={200}>
              <Text style={[s.section, { color: c.text }]}>{t.todaySalesBreakdown}</Text>
              <View style={[s.tableCard, { backgroundColor: c.card, borderColor: c.border }]}>
                {summary.length === 0
                  ? <Text style={[s.empty, { color: c.muted }]}>{t.noSalesToday}</Text>
                  : summary.map((row, i) => (
                    <View key={i} style={[s.tRow, i < summary.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
                      <Text style={[s.tName, { color: c.text }]}>{lang === 'fr' ? (row.name_fr || row.name_ar) : row.name_ar}</Text>
                      <Text style={[s.tMid, { color: c.sub }]}>{fmt(row.total_liters)} L</Text>
                      <Text style={s.tVal}>{fmt(row.total_da)} {t.currency}</Text>
                    </View>
                  ))
                }
              </View>
            </AnimatedCard>

            {/* Shift sales */}
            <AnimatedCard delay={260}>
              <Text style={[s.section, { color: c.text }]}>{t.shiftSales}</Text>
              <View style={[s.tableCard, { backgroundColor: c.card, borderColor: c.border }]}>
                {shiftSales.length === 0
                  ? <Text style={[s.empty, { color: c.muted }]}>{t.noData}</Text>
                  : shiftSales.map((row, i) => (
                    <View key={i} style={[s.tRow, i < shiftSales.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
                      <Text style={[s.tName, { color: c.text }]}>{lang === 'fr' ? (row.team_name_fr || row.team_name_ar || row.team_name) : (row.team_name_ar || row.team_name)}</Text>
                      <Text style={[s.tMid, { color: c.sub }]}>{fmt(row.total_liters)} L</Text>
                      <Text style={s.tVal}>{fmt(row.total_da)}</Text>
                    </View>
                  ))
                }
              </View>
            </AnimatedCard>

            {/* Ranking */}
            <AnimatedCard delay={320}>
              <Text style={[s.section, { color: c.text }]}>{t.employeeRanking}</Text>
              <View style={[s.tableCard, { backgroundColor: c.card, borderColor: c.border }]}>
                {ranking.length === 0
                  ? <Text style={[s.empty, { color: c.muted }]}>{t.noData}</Text>
                  : ranking.map((row, i) => (
                    <View key={i} style={[s.tRow, i < ranking.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
                      <Text style={[s.tRank, { color: i === 0 ? '#F39C12' : i === 1 ? '#BDC3C7' : i === 2 ? '#CD7F32' : c.sub }]}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                      </Text>
                      <Text style={[s.tName, { color: c.text, flex: 1 }]}>
                        {lang === 'ar' ? (row.full_name_ar || row.full_name) : row.full_name}
                      </Text>
                      <Text style={[s.tMid, { color: c.sub }]}>{row.sales_count} {t.transactions}</Text>
                      <Text style={s.tVal}>{fmt(row.total_sales_da)}</Text>
                    </View>
                  ))
                }
              </View>
            </AnimatedCard>

            <AnimatedCard delay={380}>
              <TouchableOpacity style={s.logoutBtn} onPress={doLogout}>
                <Text style={s.logoutText}>{t.logout} 🚪</Text>
              </TouchableOpacity>
            </AnimatedCard>
            <View style={{ height: rp(30) }} />
          </ScrollView>
        )
      }
    </View>
  );
}

const getStyles = (c) => StyleSheet.create({
  screen:     { flex: 1, backgroundColor: c.bg },
  safeTop:    { backgroundColor: c.statusBar },
  tabBar:     { flexDirection: 'row', borderBottomWidth: 1, height: TAB_BAR_HEIGHT },
  tab:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabActive:  { borderBottomWidth: 3, borderBottomColor: '#E85D24', backgroundColor: 'rgba(232,93,36,0.1)' },
  tabIcon:    { fontSize: rs(17), textAlign: 'center', color: '#E85D24' },
  tabLabel:   { fontSize: rs(9), marginTop: 2, textAlign: 'center' },
  tabLabelActive: { fontSize: rs(9), marginTop: 2, color: '#E85D24', fontWeight: '700' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content:    { padding: rp(14), paddingBottom: rp(40) },
  heading:    { color: c.text, fontSize: rs(20), fontWeight: '800', textAlign: 'right', marginBottom: rp(14) },
  row:        { flexDirection: 'row', marginBottom: rp(10) },
  kpiCard:    { flex: 1, borderRadius: 14, padding: rp(14), borderWidth: 1 },
  kpiLabel:   { fontSize: rs(11), textAlign: 'right', marginBottom: 4 },
  kpiVal:     { fontSize: rs(24), fontWeight: '800', textAlign: 'right' },
  kpiSub:     { fontSize: rs(11), textAlign: 'right', marginTop: 2 },
  section:    { fontSize: rs(14), fontWeight: '700', textAlign: 'right', marginBottom: rp(8), marginTop: rp(6) },
  tableCard:  { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: rp(4) },
  invRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rp(14), paddingVertical: rp(12) },
  invDot:     { width: rp(10), height: rp(10), borderRadius: rp(5), marginRight: rp(8) },
  invName:    { fontSize: rs(13), fontWeight: '500', minWidth: rp(70) },
  barTrack:   { height: 7, borderRadius: 4, overflow: 'hidden' },
  barFill:    { height: '100%', borderRadius: 4 },
  invPct:     { fontSize: rs(12), fontWeight: '700', minWidth: rp(36), textAlign: 'right' },
  tRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rp(14), paddingVertical: rp(12) },
  tRank:      { fontSize: rs(16), marginRight: rp(8), minWidth: rp(28) },
  tName:      { fontSize: rs(13), fontWeight: '500', textAlign: 'right', flex: 1, marginRight: rp(8) },
  tMid:       { fontSize: rs(11), minWidth: rp(60), textAlign: 'center' },
  tVal:       { color: '#E85D24', fontWeight: '700', fontSize: rs(13), minWidth: rp(70), textAlign: 'right' },
  empty:      { textAlign: 'center', padding: rp(20), fontSize: rs(13) },
  logoutBtn:  { marginTop: rp(20), padding: rp(16), alignItems: 'center', borderWidth: 1, borderColor: 'rgba(231,76,60,0.3)', borderRadius: 14, backgroundColor: 'rgba(231,76,60,0.08)' },
  logoutText: { color: '#E74C3C', fontWeight: '600', fontSize: rs(14) },
});