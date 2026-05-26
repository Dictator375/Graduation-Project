import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, StyleSheet, TouchableOpacity,
   RefreshControl, ActivityIndicator, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getSales, getPayroll, getInventory } from '../../utils/api';
import { STATUS_BAR_HEIGHT, TAB_BAR_HEIGHT, rs, rp } from '../../utils/layout';

function fmt(n) { return Number(n || 0).toLocaleString('ar-DZ'); }

const PAYMENT_ICON = { cash: '', card: '', loyalty: '', credit: '' };
const PAYMENT_COLOR = { cash: '#1D9E75', card: '#4A90E2', loyalty: '#BA7517', credit: '#E24B4A' };

export default function WorkerDashboard({ navigate }) {
   const { user, t, doLogout } = useAuth();
   const [sales, setSales] = useState([]);
   const [payDates, setPayDates] = useState([]);
   const [inventory, setInventory] = useState([]);
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing]= useState(false);

   async function load() {
      try {
         const today = new Date().toISOString().split('T')[0];
         const [s, p, inv] = await Promise.all([
            getSales({ date: today, limit: 15 }),
            getPayroll(),
            getInventory(),
         ]);
         setSales(s.data || []);
         setPayDates(p.data || []);
         setInventory(inv.data || []);
      } catch (e) {}
      setLoading(false);
      setRefreshing(false);
   }
   useEffect(() => { load(); }, []);

   const todayTotal = sales.reduce((s, r) => s + r.total_amount, 0);
   const nextPay = payDates[0];
   const hour = new Date().getHours();
   const shiftName = hour >= 8 && hour < 14
      ? t.morningShift : hour >= 14 && hour < 20
      ? t.afternoonShift : t.nightShift;

   return (
      <View style={s.screen}>
         <StatusBar backgroundColor="#1c2133" barStyle="light-content" />
         <View style={s.safeTop} />

         {/* Tab bar - 4 tabs */}
         <View style={s.tabBar}>
            <View style={[s.tab, s.tabActive]}>
               <Text style={s.tabTextActive}></Text>
               <Text style={s.tabLabelActive}>{t.dashboard}</Text>
            </View>
            <TouchableOpacity style={s.tab} onPress={() => navigate('sales')}>
               <Text style={s.tabIcon}></Text>
               <Text style={s.tabLabel}>{t.newSale}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.tab} onPress={() => navigate('messages')}>
               <Text style={s.tabIcon}></Text>
               <Text style={s.tabLabel}>المدير</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.tab} onPress={() => navigate('chat')}>
               <Text style={s.tabIcon}></Text>
               <Text style={s.tabLabel}>دردشة</Text>
            </TouchableOpacity>
         </View>

         {loading
            ? <View style={s.center}><ActivityIndicator color="#E85D24" size="large" /></View>
            : (
               <ScrollView
                  contentContainerStyle={s.content}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#E85D24" />}
               >
                  {/* Welcome */}
                  <Text style={s.welcome}>مرحباً، {user?.full_name_ar || user?.full_name} </Text>
                  <Text style={s.shift}>{shiftName}</Text>

                  {/* Stats */}
                  <View style={s.row}>
                     <View style={[s.card, { flex: 1, marginLeft: rp(8) }]}>
                        <Text style={s.cardLabel}>مبيعاتي اليوم</Text>
                        <Text style={s.cardValue} numberOfLines={1} adjustsFontSizeToFit>{fmt(todayTotal)}</Text>
                        <Text style={s.cardSub}>دج · {sales.length} عملية</Text>
                     </View>
                     <View style={[s.card, { flex: 1 }]}>
                        <Text style={s.cardLabel}>{t.nextPayDate}</Text>
                        <Text style={s.cardValue} numberOfLines={1} adjustsFontSizeToFit>
                           {nextPay
                              ? new Date(nextPay.pay_date).toLocaleDateString('ar-DZ', { month: 'short', day: 'numeric' })
                              : '—'}
                        </Text>
                        <Text style={s.cardSub} numberOfLines={1}>{nextPay?.description || ''}</Text>
                     </View>
                  </View>

                  {/* Fuel availability */}
                  <Text style={s.section}>توفر الوقود</Text>
                  {inventory.map(inv => {
                     const pct = Math.min(100, Math.round((inv.quantity_liters / 30000) * 100));
                     const col = pct < 20 ? '#E24B4A' : pct < 40 ? '#BA7517' : '#1D9E75';
                     return (
                        <View key={inv.id} style={s.invCard}>
                           <View style={s.invRow}>
                              <Text style={s.invName}>{inv.name_ar}</Text>
                              <Text style={[s.invPct, { color: col }]}>{pct}%{pct < 20 ? ' ' : ''}</Text>
                           </View>
                           <View style={s.barTrack}>
                              <View style={[s.barFill, { width: `${pct}%`, backgroundColor: col }]} />
                           </View>
                           <Text style={s.invSub}>{inv.price_per_liter} دج/L</Text>
                        </View>
                     );
                  })}

                  {/* Recent sales - now shows institution for credit */}
                  <Text style={s.section}>آخر مبيعاتي اليوم</Text>
                  {sales.length === 0
                     ? <Text style={s.empty}>لا توجد مبيعات بعد</Text>
                     : sales.map(sale => (
                        <View key={sale.id} style={s.saleCard}>
                           <Text style={{ fontSize: rs(22) }}>{PAYMENT_ICON[sale.payment_method] || ''}</Text>
                           <View style={{ flex: 1, marginHorizontal: rp(10) }}>
                              <Text style={s.saleName}>{sale.fuel_name_ar} · {sale.quantity_liters} L</Text>
                              <Text style={s.saleSub}>مضخة {sale.pump_number}</Text>
                              {/* Show institution name for credit sales */}
                              {sale.payment_method === 'credit' && sale.institution_name && (
                                 <Text style={s.saleInst}> {sale.institution_name}</Text>
                              )}
                           </View>
                           <View style={{ alignItems: 'flex-end' }}>
                              <Text style={s.saleAmt}>{fmt(sale.total_amount)} دج</Text>
                              <View style={[s.payBadge, { backgroundColor: (PAYMENT_COLOR[sale.payment_method] || '#888') + '22' }]}>
                                 <Text style={[s.payBadgeText, { color: PAYMENT_COLOR[sale.payment_method] || '#888' }]}>
                                    {sale.payment_method}
                                 </Text>
                              </View>
                           </View>
                        </View>
                     ))
                  }

                  {/* Logout */}
                  <TouchableOpacity style={s.logoutBtn} onPress={doLogout}>
                     <Text style={s.logoutText}>{t.logout} </Text>
                  </TouchableOpacity>
               </ScrollView>
            )
         }
      </View>
   );
}

const s = StyleSheet.create({
   screen: { flex: 1, backgroundColor: '#0f1117' },
   safeTop: { height: STATUS_BAR_HEIGHT, backgroundColor: '#1c2133' },
   tabBar: { flexDirection: 'row', backgroundColor: '#1c2133', borderBottomWidth: 2, borderBottomColor: '#E85D24', height: TAB_BAR_HEIGHT },
   tab: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2 },
   tabActive: { borderBottomWidth: 3, borderBottomColor: '#E85D24', backgroundColor: 'rgba(232,93,36,0.12)' },
   tabIcon: { fontSize: rs(16), textAlign: 'center' },
   tabLabel: { color: '#8b92a9', fontSize: rs(9), fontWeight: '500', textAlign: 'center', marginTop: 1 },
   tabTextActive: { fontSize: rs(16), textAlign: 'center' },
   tabLabelActive:{ color: '#E85D24', fontSize: rs(9), fontWeight: '700', textAlign: 'center', marginTop: 1 },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   content: { padding: rp(16), paddingBottom: rp(40) },
   welcome: { color: '#eef0f6', fontSize: rs(19), fontWeight: '700', textAlign: 'right', marginBottom: 4 },
   shift: { color: '#E85D24', fontSize: rs(12), textAlign: 'right', marginBottom: rp(16) },
   row: { flexDirection: 'row', marginBottom: rp(10) },
   card: { backgroundColor: '#1c2133', borderRadius: 12, padding: rp(14), borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
   cardLabel: { color: '#8b92a9', fontSize: rs(11), textAlign: 'right', marginBottom: 4 },
   cardValue: { color: '#eef0f6', fontSize: rs(22), fontWeight: '700', textAlign: 'right' },
   cardSub: { color: '#555e7a', fontSize: rs(11), textAlign: 'right' },
   section: { color: '#eef0f6', fontSize: rs(15), fontWeight: '700', marginTop: rp(20), marginBottom: rp(10), textAlign: 'right' },
   invCard: { backgroundColor: '#1c2133', borderRadius: 10, padding: rp(14), marginBottom: rp(8), borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
   invRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
   invName: { color: '#eef0f6', fontSize: rs(13), fontWeight: '500' },
   invPct: { fontSize: rs(13), fontWeight: '700' },
   invSub: { color: '#555e7a', fontSize: rs(11), textAlign: 'right', marginTop: 2 },
   barTrack: { height: 8, backgroundColor: '#0f1117', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
   barFill: { height: '100%', borderRadius: 4 },
   saleCard: { backgroundColor: '#1c2133', borderRadius: 10, padding: rp(12), marginBottom: rp(8), flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
   saleName: { color: '#eef0f6', fontSize: rs(13), fontWeight: '500', textAlign: 'right' },
   saleSub: { color: '#8b92a9', fontSize: rs(11), textAlign: 'right', marginTop: 2 },
   saleInst: { color: '#4A90E2', fontSize: rs(11), textAlign: 'right', marginTop: 2 },
   saleAmt: { color: '#E85D24', fontWeight: '700', fontSize: rs(14) },
   payBadge: { paddingHorizontal: rp(6), paddingVertical: rp(2), borderRadius: 6, marginTop: 3 },
   payBadgeText: { fontSize: rs(10), fontWeight: '600' },
   empty: { color: '#555e7a', textAlign: 'center', padding: rp(20), fontSize: rs(13) },
   logoutBtn: { marginTop: rp(24), padding: rp(16), alignItems: 'center', borderWidth: 1, borderColor: 'rgba(226,75,74,0.4)', borderRadius: 12, backgroundColor: 'rgba(226,75,74,0.08)' },
   logoutText: { color: '#E24B4A', fontWeight: '600', fontSize: rs(14) },
});