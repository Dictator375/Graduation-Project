import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, TouchableOpacity, StyleSheet,
   StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../context/AuthContext';
import { getSales, getSalesSummary } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';

function fmt(n) { return Number(n || 0).toLocaleString('ar-DZ'); }

export default function AdminReports({ goBack }) {
   const { t } = useAuth();
   const today = new Date().toISOString().split('T')[0];
   const [from, setFrom] = useState(today);
   const [to, setTo] = useState(today);
   const [sales, setSales] = useState([]);
   const [summary, setSummary] = useState([]);
   const [loading, setLoading] = useState(false);
   const [printing,setPrinting]= useState(false);

   async function load() {
      setLoading(true);
      try {
         const [s, sum] = await Promise.all([
            getSales({ limit: 200 }),
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
            <html dir="rtl">
            <head>
               <meta charset="UTF-8"/>
               <style>
                  body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; color: #222; }
                  h1 { color: #E85D24; font-size: 22px; text-align: center; }
                  h3 { color: #555; font-size: 14px; text-align: center; margin-top: -10px; }
                  .summary { display: flex; gap: 12px; margin: 20px 0; }
                  .stat { flex: 1; background: #f5f5f5; border-radius: 8px; padding: 12px; text-align: center; }
                  .stat-val { font-size: 22px; font-weight: bold; color: #E85D24; }
                  .stat-lbl { font-size: 12px; color: #888; }
                  table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                  th { background: #E85D24; color: white; padding: 8px; text-align: right; }
                  td { border-bottom: 1px solid #eee; padding: 8px; text-align: right; }
                  tr:nth-child(even) { background: #fafafa; }
                  .footer { text-align: center; margin-top: 30px; color: #aaa; font-size: 11px; }
               </style>
            </head>
            <body>
               <h1> تقرير المبيعات</h1>
               <h3>من ${from} إلى ${to}</h3>

               <div class="summary">
                  <div class="stat"><div class="stat-val">${fmt(totalDA)} دج</div><div class="stat-lbl">إجمالي الإيرادات</div></div>
                  <div class="stat"><div class="stat-val">${fmt(totalL)} L</div><div class="stat-lbl">إجمالي الوقود</div></div>
                  <div class="stat"><div class="stat-val">${sales.length}</div><div class="stat-lbl">عدد العمليات</div></div>
               </div>

               <table>
                  <thead>
                     <tr>
                        <th>التاريخ</th>
                        <th>الوقود</th>
                        <th>الكميّة</th>
                        <th>السعر/L</th>
                        <th>المجموع</th>
                        <th>الدفع</th>
                        <th>العامل</th>
                        <th>المؤسسة</th>
                     </tr>
                  </thead>
                  <tbody>
                     ${sales.map(s => `
                        <tr>
                           <td>${s.shift_date}</td>
                           <td>${s.fuel_name_ar}</td>
                           <td>${s.quantity_liters} L</td>
                           <td>${s.price_per_liter} دج</td>
                           <td><b>${fmt(s.total_amount)} دج</b></td>
                           <td>${s.payment_method}</td>
                           <td>${s.worker_name_ar || s.worker_name}</td>
                           <td>${s.institution_name || '—'}</td>
                        </tr>
                     `).join('')}
                  </tbody>
               </table>

               <div class="footer">
                  تم إنشاء هذا التقرير بواسطة نظام إدارة محطة الوقود · ${new Date().toLocaleDateString('ar-DZ')}
               </div>
            </body>
            </html>
         `;
         const { uri } = await Print.printToFileAsync({ html });
         await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'مشاركة التقرير' });
      } catch (e) {
         Alert.alert('خطأ', 'فشل إنشاء التقرير');
      }
      setPrinting(false);
   }

   const PAYMENT_COLOR = { cash: '#1D9E75', card: '#4A90E2', loyalty: '#BA7517', credit: '#E24B4A' };

   return (
      <View style={s.screen}>
         <StatusBar backgroundColor="#1c2133" barStyle="light-content" />
         <View style={s.safeTop} />
         <View style={s.header}>
            <TouchableOpacity onPress={goBack}><Text style={s.back}>‹ رجوع</Text></TouchableOpacity>
            <Text style={s.title}>{t.reports}</Text>
            <TouchableOpacity style={s.printBtn} onPress={handlePrint} disabled={printing}>
               <Text style={s.printBtnText}>{printing ? '...' : ''}</Text>
            </TouchableOpacity>
         </View>

         {/* Date range */}
         <View style={s.dateRow}>
            <View style={s.dateField}>
               <Text style={s.dateLabel}>إلى</Text>
               <Text style={s.dateValue}>{to}</Text>
            </View>
            <View style={s.dateSep} />
            <View style={s.dateField}>
               <Text style={s.dateLabel}>من</Text>
               <Text style={s.dateValue}>{from}</Text>
            </View>
         </View>

         {/* Quick filters */}
         <View style={s.filterRow}>
            {[
               { label: 'اليوم', from: today, to: today },
               { label: 'هذا الأسبوع', from: (() => { const d = new Date(); d.setDate(d.getDate()-7); return d.toISOString().split('T')[0]; })(), to: today },
               { label: 'هذا الشهر', from: today.slice(0,7)+'-01', to: today },
            ].map(f => (
               <TouchableOpacity key={f.label} style={[s.filterBtn, from === f.from && to === f.to && s.filterBtnActive]}
                  onPress={() => { setFrom(f.from); setTo(f.to); }}>
                  <Text style={[s.filterBtnText, from === f.from && to === f.to && { color: '#fff' }]}>{f.label}</Text>
               </TouchableOpacity>
            ))}
         </View>

         {loading
            ? <View style={s.center}><ActivityIndicator color="#E85D24" /></View>
            : (
               <ScrollView contentContainerStyle={{ padding: rp(14), paddingBottom: rp(30) }}>
                  {/* Summary cards */}
                  <View style={s.statsRow}>
                     <View style={[s.statCard, { flex: 1, marginLeft: rp(8) }]}>
                        <Text style={s.statVal} numberOfLines={1} adjustsFontSizeToFit>{fmt(totalDA)}</Text>
                        <Text style={s.statLbl}>دج إجمالي</Text>
                     </View>
                     <View style={[s.statCard, { flex: 1 }]}>
                        <Text style={s.statVal}>{fmt(totalL)}</Text>
                        <Text style={s.statLbl}>L وقود</Text>
                     </View>
                     <View style={[s.statCard, { flex: 1, marginRight: rp(8) }]}>
                        <Text style={s.statVal}>{sales.length}</Text>
                        <Text style={s.statLbl}>عملية</Text>
                     </View>
                  </View>

                  {/* Sales list */}
                  {sales.length === 0
                     ? <Text style={s.empty}>لا توجد مبيعات في هذه الفترة</Text>
                     : sales.map(sale => (
                        <View key={sale.id} style={s.saleCard}>
                           <View style={s.saleTop}>
                              <Text style={s.saleDate}>{sale.shift_date}</Text>
                              <Text style={s.saleAmt}>{fmt(sale.total_amount)} دج</Text>
                           </View>
                           <View style={s.saleMid}>
                              <Text style={s.saleFuel}>{sale.fuel_name_ar} · {sale.quantity_liters} L</Text>
                              <View style={[s.payBadge, { backgroundColor: (PAYMENT_COLOR[sale.payment_method] || '#8b92a9') + '22' }]}>
                                 <Text style={[s.payBadgeText, { color: PAYMENT_COLOR[sale.payment_method] || '#8b92a9' }]}>{sale.payment_method}</Text>
                              </View>
                           </View>
                           <Text style={s.saleWorker}> {sale.worker_name_ar || sale.worker_name} · مضخة {sale.pump_number}</Text>
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

const s = StyleSheet.create({
   screen: { flex: 1, backgroundColor: '#0f1117' },
   safeTop: { height: STATUS_BAR_HEIGHT, backgroundColor: '#1c2133' },
   header: { backgroundColor: '#1c2133', padding: rp(14), flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
   back: { color: '#E85D24', fontSize: rs(16), fontWeight: '600' },
   title: { color: '#eef0f6', fontSize: rs(16), fontWeight: '700', flex: 1, textAlign: 'right', marginHorizontal: rp(10) },
   printBtn: { backgroundColor: 'rgba(232,93,36,0.15)', padding: rp(8), borderRadius: 8, borderWidth: 1, borderColor: 'rgba(232,93,36,0.3)' },
   printBtnText: { fontSize: rs(18) },
   dateRow: { flexDirection: 'row', backgroundColor: '#1c2133', padding: rp(12), borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
   dateField: { flex: 1, alignItems: 'center' },
   dateLabel: { color: '#8b92a9', fontSize: rs(11) },
   dateValue: { color: '#eef0f6', fontSize: rs(13), fontWeight: '600', marginTop: 2 },
   dateSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: rp(10) },
   filterRow: { flexDirection: 'row', padding: rp(10), gap: rp(8), backgroundColor: '#171b25' },
   filterBtn: { flex: 1, padding: rp(8), borderRadius: 8, alignItems: 'center', backgroundColor: '#1c2133', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
   filterBtnActive:{ backgroundColor: '#E85D24', borderColor: '#E85D24' },
   filterBtnText: { color: '#8b92a9', fontSize: rs(11), fontWeight: '500' },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   statsRow: { flexDirection: 'row', marginBottom: rp(14) },
   statCard: { backgroundColor: '#1c2133', borderRadius: 10, padding: rp(12), alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
   statVal: { color: '#E85D24', fontSize: rs(18), fontWeight: '700' },
   statLbl: { color: '#8b92a9', fontSize: rs(10), marginTop: 2 },
   empty: { color: '#555e7a', textAlign: 'center', padding: rp(40), fontSize: rs(13) },
   saleCard: { backgroundColor: '#1c2133', borderRadius: 10, padding: rp(12), marginBottom: rp(8), borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
   saleTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rp(4) },
   saleDate: { color: '#8b92a9', fontSize: rs(11) },
   saleAmt: { color: '#E85D24', fontWeight: '700', fontSize: rs(14) },
   saleMid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rp(4) },
   saleFuel: { color: '#eef0f6', fontSize: rs(13), fontWeight: '500' },
   payBadge: { paddingHorizontal: rp(8), paddingVertical: rp(3), borderRadius: 8 },
   payBadgeText: { fontSize: rs(11), fontWeight: '600' },
   saleWorker: { color: '#8b92a9', fontSize: rs(11) },
   saleInst: { color: '#4A90E2', fontSize: rs(11), marginTop: 2 },
});