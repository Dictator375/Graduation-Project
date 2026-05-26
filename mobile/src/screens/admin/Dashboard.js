import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getSalesSummary, getInventory, getEmployees } from '../../utils/api';
import { STATUS_BAR_HEIGHT, TAB_BAR_HEIGHT, rs, rp } from '../../utils/layout';

function fmt(n) { return Number(n || 0).toLocaleString('ar-DZ'); }

export default function AdminDashboard({ navigate }) {
  const { t, doLogout } = useAuth();
  const [summary,    setSummary]   = useState([]);
  const [inventory,  setInventory] = useState([]);
  const [empCount,   setEmpCount]  = useState(0);
  const [loading,    setLoading]   = useState(true);
  const [refreshing, setRefreshing]= useState(false);

  async function load() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [s, inv, emp] = await Promise.all([
        getSalesSummary({ period: 'daily', date: today }),
        getInventory(),
        getEmployees(),
      ]);
      setSummary(s.data || []);
      setInventory(inv.data || []);
      setEmpCount((emp.data || []).filter(e => e.is_active).length);
    } catch (e) {}
    setLoading(false);
    setRefreshing(false);
  }
  useEffect(() => { load(); }, []);

  const todayDA   = summary.reduce((s, r) => s + (r.total_da || 0), 0);
  const todayL    = summary.reduce((s, r) => s + (r.total_liters || 0), 0);
  const todayTxns = summary.reduce((s, r) => s + (r.transactions || 0), 0);

  return (
    <View style={s.screen}>
      <StatusBar backgroundColor="#1c2133" barStyle="light-content" />
      <View style={s.safeTop} />

      <View style={s.tabBar}>
        <View style={[s.tab, s.tabActive]}>
          <Text style={s.tabTextActive}>📊  {t.dashboard}</Text>
        </View>
        <TouchableOpacity style={s.tab} onPress={() => navigate('messages')}>
          <Text style={s.tabText}>💬  {t.messages}</Text>
        </TouchableOpacity>
      </View>

      {loading
        ? <View style={s.center}><ActivityIndicator color="#E85D24" size="large" /></View>
        : (
          <ScrollView
            contentContainerStyle={s.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#E85D24" />}
          >
            <Text style={s.heading}>لوحة التحكم 📊</Text>

            <View style={s.row}>
              <View style={[s.card, { flex: 1, marginLeft: rp(8) }]}>
                <Text style={s.cardLabel}>{t.todayRevenue}</Text>
                <Text style={s.cardValue} numberOfLines={1} adjustsFontSizeToFit>{fmt(todayDA)}</Text>
                <Text style={s.cardSub}>دج</Text>
              </View>
              <View style={[s.card, { flex: 1 }]}>
                <Text style={s.cardLabel}>وقود مباع</Text>
                <Text style={s.cardValue} numberOfLines={1} adjustsFontSizeToFit>{fmt(todayL)}</Text>
                <Text style={s.cardSub}>L</Text>
              </View>
            </View>
            <View style={s.row}>
              <View style={[s.card, { flex: 1, marginLeft: rp(8) }]}>
                <Text style={s.cardLabel}>عمليات اليوم</Text>
                <Text style={s.cardValue}>{todayTxns}</Text>
              </View>
              <View style={[s.card, { flex: 1 }]}>
                <Text style={s.cardLabel}>{t.employees}</Text>
                <Text style={s.cardValue}>{empCount}</Text>
                <Text style={s.cardSub}>{t.active}</Text>
              </View>
            </View>

            <Text style={s.section}>{t.inventory}</Text>
            {inventory.map(inv => {
              const pct = Math.min(100, Math.round((inv.quantity_liters / 30000) * 100));
              const col = pct < 20 ? '#E24B4A' : pct < 40 ? '#BA7517' : '#1D9E75';
              return (
                <View key={inv.id} style={s.invCard}>
                  <View style={s.invRow}>
                    <Text style={s.invName}>{inv.name_ar}</Text>
                    <Text style={[s.invPct, { color: col }]}>{pct}%{pct < 20 ? ' � ️' : ''}</Text>
                  </View>
                  <View style={s.barTrack}>
                    <View style={[s.barFill, { width: `${pct}%`, backgroundColor: col }]} />
                  </View>
                  <Text style={s.invSub}>{fmt(inv.quantity_liters)} L · {inv.price_per_liter} دج/L</Text>
                </View>
              );
            })}

            <Text style={s.section}>تفصيل مبيعات اليوم</Text>
            <View style={s.card}>
              {summary.length === 0
                ? <Text style={s.empty}>لا توجد مبيعات اليوم</Text>
                : summary.map((row, i) => (
                  <View key={i} style={s.tableRow}>
                    <Text style={s.tableVal}>{fmt(row.total_da)} دج</Text>
                    <Text style={s.tableMid}>{fmt(row.total_liters)} L</Text>
                    <Text style={s.tableName}>{row.name_ar}</Text>
                  </View>
                ))
              }
            </View>

            <TouchableOpacity style={s.logoutBtn} onPress={doLogout}>
              <Text style={s.logoutText}>{t.logout} 🚪</Text>
            </TouchableOpacity>
          </ScrollView>
        )
      }
    </View>
  );
}

const s = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#0f1117' },
  safeTop:       { height: STATUS_BAR_HEIGHT, backgroundColor: '#1c2133' },
  tabBar:        { flexDirection: 'row', backgroundColor: '#1c2133', borderBottomWidth: 2, borderBottomColor: '#E85D24', height: TAB_BAR_HEIGHT },
  tab:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabActive:     { borderBottomWidth: 3, borderBottomColor: '#E85D24', backgroundColor: 'rgba(232,93,36,0.12)' },
  tabText:       { color: '#8b92a9', fontSize: rs(13), fontWeight: '500' },
  tabTextActive: { color: '#E85D24', fontSize: rs(13), fontWeight: '700' },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content:       { padding: rp(16), paddingBottom: rp(40) },
  heading:       { color: '#eef0f6', fontSize: rs(20), fontWeight: '700', textAlign: 'right', marginBottom: rp(16) },
  row:           { flexDirection: 'row', marginBottom: rp(10) },
  card:          { backgroundColor: '#1c2133', borderRadius: 12, padding: rp(14), borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  cardLabel:     { color: '#8b92a9', fontSize: rs(11), textAlign: 'right', marginBottom: 4 },
  cardValue:     { color: '#eef0f6', fontSize: rs(22), fontWeight: '700', textAlign: 'right' },
  cardSub:       { color: '#555e7a', fontSize: rs(11), textAlign: 'right' },
  section:       { color: '#eef0f6', fontSize: rs(15), fontWeight: '700', marginTop: rp(20), marginBottom: rp(10), textAlign: 'right' },
  invCard:       { backgroundColor: '#1c2133', borderRadius: 10, padding: rp(14), marginBottom: rp(8), borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  invRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  invName:       { color: '#eef0f6', fontSize: rs(13), fontWeight: '500' },
  invPct:        { fontSize: rs(13), fontWeight: '700' },
  invSub:        { color: '#555e7a', fontSize: rs(11), textAlign: 'right', marginTop: 3 },
  barTrack:      { height: 8, backgroundColor: '#0f1117', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  barFill:       { height: '100%', borderRadius: 4 },
  tableRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: rp(10), borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  tableVal:      { color: '#E85D24', fontWeight: '700', fontSize: rs(13) },
  tableMid:      { color: '#8b92a9', fontSize: rs(12) },
  tableName:     { color: '#eef0f6', fontSize: rs(13) },
  empty:         { color: '#555e7a', textAlign: 'center', padding: rp(20), fontSize: rs(13) },
  logoutBtn:     { marginTop: rp(24), padding: rp(16), alignItems: 'center', borderWidth: 1, borderColor: 'rgba(226,75,74,0.4)', borderRadius: 12, backgroundColor: 'rgba(226,75,74,0.08)' },
  logoutText:    { color: '#E24B4A', fontWeight: '600', fontSize: rs(14) },
});