import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, TouchableOpacity, StyleSheet,
   StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../context/AuthContext';
import { getThemeColors } from '../../utils/theme';
import { getSales, getSalesSummary } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';
import { ScreenHeader } from '../../utils/components';

export default function AdminReports({ goBack }) {
   const { t, lang, theme } = useAuth();
   const c = getThemeColors(theme || 'dark');
   const s = getStyles(c);
   const today = new Date().toISOString().split('T')[0];
   const [from, setFrom] = useState('2020-01-01');
   const [to, setTo] = useState(today);
   const [activeFilter, setActiveFilter] = useState('all');
   const [sales, setSales] = useState([]);
   const [summary, setSummary] = useState([]);
   const [loading, setLoading] = useState(false);
   const [printing,setPrinting]= useState(false);

   function fmt(n) { return Number(n || 0).toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ'); }

   async function load() {
      setLoading(true);
      try {
         const [s, sum] = await Promise.all([
            getSales({ limit: 9999 }),
            getSalesSummary({ period: 'daily', date: from }),
         ]);
         setSales((s.data || []).filter(s => s.shift_date >= from && s.shift_date <= to));
         setSummary(sum.data || []);
      } catch (e) {}
      setLoading(false);
   }

   useEffect(() => { load(); }, [from, to]);

   const totalDA = sales.reduce((s, r) => s + r.total_amount, 0);
   const totalL = sales.reduce((s, r) => s + r.quantity_liters, 0);

   async function handlePrint() {
      setPrinting(true);
      try {
         const html = `
            <!DOCTYPE html>
            <html dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
            <head>
               <meta charset="UTF-8"/>
               <style>
                  body { font-family: Arial, sans-serif; direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; padding: 20px; color: #222; }
                  h1 { color: #E85D24; font-size: 22px; text-align: center; }
                  h3 { color: #555; font-size: 14px; text-align: center; margin-top: -10px; }
                  .summary { display: flex; gap: 12px; margin: 20px 0; }
                  .stat { flex: 1; background: #f5f5f5; border-radius: 8px; padding: 12px; text-align: center; }
                  .stat-val { font-size: 22px; font-weight: bold; color: #E85D24; }
                  .stat-lbl { font-size: 12px; color: #888; }
                  table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                  th { background: #E85D24; color: white; padding: 8px; text-align: ${lang === 'ar' ? 'right' : 'left'}; }
                  td { border-bottom: 1px solid #eee; padding: 8px; text-align: ${lang === 'ar' ? 'right' : 'left'}; }
                  tr:nth-child(even) { background: #fafafa; }
                  .footer { text-align: center; margin-top: 30px; color: #aaa; font-size: 11px; }
               </style>
            </head>
            <body>
               <h1> ${t.salesReport}</h1>
               <h3>${t.fromDate} ${from} ${t.toDate} ${to}</h3>

               <div class="summary">
                  <div class="stat"><div class="stat-val">${fmt(totalDA)} ${t.currency}</div><div class="stat-lbl">${t.totalRevenue}</div></div>
                  <div class="stat"><div class="stat-val">${fmt(totalL)} L</div><div class="stat-lbl">${t.totalFuel}</div></div>
                  <div class="stat"><div class="stat-val">${sales.length}</div><div class="stat-lbl">${t.operationsTitle}</div></div>
               </div>

               <table>
                  <thead>
                     <tr>
                        <th>${t.date}</th>
                        <th>${t.fuelCol}</th>
                        <th>${t.qtyCol}</th>
                        <th>${t.priceCol}</th>
                        <th>${t.totalCol}</th>
                        <th>${t.payment}</th>
                        <th>${t.employee}</th>
                        <th>${t.institutionCol}</th>
                     </tr>
                  </thead>
                  <tbody>
                     ${sales.map(s => `
                        <tr>
                           <td>${s.shift_date}</td>
                           <td>${lang === 'fr' ? (s.fuel_name_fr || s.fuel_name_ar) : s.fuel_name_ar}</td>
                           <td>${s.quantity_liters} L</td>
                           <td>${s.price_per_liter} ${t.currency}</td>
                           <td><b>${fmt(s.total_amount)} ${t.currency}</b></td>
                           <td>${s.payment_method}</td>
                           <td>${lang === 'fr' ? (s.worker_name_fr || s.worker_name) : (s.worker_name_ar || s.worker_name)}</td>
                           <td>${s.institution_name || '—'}</td>
                        </tr>
                     `).join('')}
                  </tbody>
               </table>

               <div class="footer">
                  ${t.generatedBy} · ${new Date().toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ')}
               </div>
            </body>
            </html>
         `;
         const { uri } = await Print.printToFileAsync({ html });
         await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: t.shareReport });
      } catch (e) {
         Alert.alert(t.errorTitle, t.reportError);
      }
      setPrinting(false);
   }

   const PAYMENT_COLOR = { cash: '#1D9E75', card: '#4A90E2', loyalty: '#BA7517', credit: '#E24B4A' };

   const FILTERS = [
      { id: 'today', label: t.today, from: today, to: today },
      { id: 'week', label: t.thisWeek, from: (() => { const d = new Date(); d.setDate(d.getDate()-7); return d.toISOString().split('T')[0]; })(), to: today },
      { id: 'month', label: t.thisMonth, from: today.slice(0,7)+'-01', to: today },
      { id: 'all', label: t.allTime, from: '2020-01-01', to: today },
   ];

   return (
      <View style={s.screen}>
         <ScreenHeader
            title={t.reports}
            onBack={goBack}
            lang={lang}
            theme={theme}
            c={c}
            rightElement={
               <TouchableOpacity style={s.printBtn} onPress={handlePrint} disabled={printing}>
                  <Text style={s.printBtnText}>{printing ? '...' : '🖨️'}</Text>
               </TouchableOpacity>
            }
         />

         {/* Date range */}
         <View style={s.dateRow}>
            <View style={s.dateField}>
               <Text style={s.dateLabel}>{t.toDate}</Text>
               <Text style={s.dateValue}>{to}</Text>
            </View>
            <View style={s.dateSep} />
            <View style={s.dateField}>
               <Text style={s.dateLabel}>{t.fromDate}</Text>
               <Text style={s.dateValue}>{from}</Text>
            </View>
         </View>

         {/* Quick filters */}
         <View style={s.filterRow}>
            {FILTERS.map(f => (
               <TouchableOpacity key={f.id} style={[s.filterBtn, activeFilter === f.id && s.filterBtnActive]}
                  onPress={() => { setFrom(f.from); setTo(f.to); setActiveFilter(f.id); }}>
                  <Text style={[s.filterBtnText, activeFilter === f.id && { color: '#fff' }]}
                     numberOfLines={1} adjustsFontSizeToFit>{f.label}</Text>
               </TouchableOpacity>
            ))}
         </View>

         {loading
            ? <View style={s.center}><ActivityIndicator color="#E85D24" /></View>
            : (
               <ScrollView contentContainerStyle={{ padding: rp(14), paddingBottom: rp(30) }}>
                  {/* Summary cards */}
                  <View style={s.statsRow}>
                     <View style={[s.statCard, { flex: 1 }]}>
                        <Text style={s.statVal} numberOfLines={1} adjustsFontSizeToFit>{fmt(totalDA)}</Text>
                        <Text style={s.statLbl}>{t.currency} {t.total}</Text>
                     </View>
                     <View style={[s.statCard, { flex: 1 }]}>
                        <Text style={s.statVal}>{fmt(totalL)}</Text>
                        <Text style={s.statLbl}>L {t.fuelCol}</Text>
                     </View>
                     <View style={[s.statCard, { flex: 1 }]}>
                        <Text style={s.statVal}>{sales.length}</Text>
                        <Text style={s.statLbl}>{t.operationsCount}</Text>
                     </View>
                  </View>

                  {/* Sales list */}
                  {sales.length === 0
                     ? <Text style={s.empty}>{t.noSalesInPeriod}</Text>
                     : sales.map(sale => (
                        <View key={sale.id} style={s.saleCard}>
                           <View style={s.saleTop}>
                              <Text style={s.saleDate}>{sale.shift_date}</Text>
                              <Text style={s.saleAmt}>{fmt(sale.total_amount)} {t.currency}</Text>
                           </View>
                           <View style={s.saleMid}>
                              <Text style={s.saleFuel}>{lang === 'fr' ? (sale.fuel_name_fr || sale.fuel_name_ar) : sale.fuel_name_ar} · {sale.quantity_liters} L</Text>
                              <View style={[s.payBadge, { backgroundColor: (PAYMENT_COLOR[sale.payment_method] || c.sub) + '22' }]}>
                                 <Text style={[s.payBadgeText, { color: PAYMENT_COLOR[sale.payment_method] || c.sub }]}>{sale.payment_method}</Text>
                              </View>
                           </View>
                           <Text style={s.saleWorker}> {lang === 'fr' ? (sale.worker_name_fr || sale.worker_name) : (sale.worker_name_ar || sale.worker_name)} · {t.pump} {sale.pump_number}</Text>
                           {sale.institution_name && <Text style={s.saleInst}> {sale.institution_name}</Text>}
                        </View>
                     ))
                  }
               </ScrollView>
            )
         }
      </View>
   );
}

const getStyles = (c) => StyleSheet.create({
   screen: { flex: 1, backgroundColor: c.bg },
   safeTop: { height: STATUS_BAR_HEIGHT, backgroundColor: c.card },
   header: { backgroundColor: c.card, padding: rp(14), flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: c.border },
   back: { color: '#E85D24', fontSize: rs(16), fontWeight: '600' },
   title: { color: c.text, fontSize: rs(16), fontWeight: '700', flex: 1, textAlign: 'right', marginHorizontal: rp(10) },
   printBtn: { backgroundColor: 'rgba(232,93,36,0.15)', padding: rp(8), borderRadius: 8, borderWidth: 1, borderColor: 'rgba(232,93,36,0.3)' },
   printBtnText: { fontSize: rs(18) },
   dateRow: { flexDirection: 'row', backgroundColor: c.card, padding: rp(12), borderBottomWidth: 1, borderBottomColor: c.border },
   dateField: { flex: 1, alignItems: 'center' },
   dateLabel: { color: c.sub, fontSize: rs(11) },
   dateValue: { color: c.text, fontSize: rs(13), fontWeight: '600', marginTop: 2 },
   dateSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: rp(10) },
   filterRow: { flexDirection: 'row', padding: rp(10), gap: rp(6), backgroundColor: c.bg },
   filterBtn: { flex: 1, paddingVertical: rp(10), paddingHorizontal: rp(6), borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card, borderWidth: 1, borderColor: c.border, minHeight: rp(38) },
   filterBtnActive:{ backgroundColor: '#E85D24', borderColor: '#E85D24' },
   filterBtnText: { color: c.sub, fontSize: rs(11), fontWeight: '600', textAlign: 'center' },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   statsRow: { flexDirection: 'row', gap: rp(8), marginBottom: rp(14) },
   statCard: { backgroundColor: c.card, borderRadius: 10, padding: rp(12), alignItems: 'center', borderWidth: 1, borderColor: c.border },
   statVal: { color: '#E85D24', fontSize: rs(18), fontWeight: '700' },
   statLbl: { color: c.sub, fontSize: rs(10), marginTop: 2 },
   empty: { color: c.muted, textAlign: 'center', padding: rp(40), fontSize: rs(13) },
   saleCard: { backgroundColor: c.card, borderRadius: 10, padding: rp(12), marginBottom: rp(8), borderWidth: 1, borderColor: c.border },
   saleTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rp(4) },
   saleDate: { color: c.sub, fontSize: rs(11) },
   saleAmt: { color: '#E85D24', fontWeight: '700', fontSize: rs(14) },
   saleMid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rp(4) },
   saleFuel: { color: c.text, fontSize: rs(13), fontWeight: '500' },
   payBadge: { paddingHorizontal: rp(8), paddingVertical: rp(3), borderRadius: 8 },
   payBadgeText: { fontSize: rs(11), fontWeight: '600' },
   saleWorker: { color: c.sub, fontSize: rs(11) },
   saleInst: { color: '#4A90E2', fontSize: rs(11), marginTop: 2 },
});