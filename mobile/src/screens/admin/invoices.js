import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, TouchableOpacity, StyleSheet,
   StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../context/AuthContext';
import { getInvoices, getInvoice, updateInvoiceStatus } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';

function fmt(n) { return Number(n || 0).toLocaleString('ar-DZ'); }

const STATUS_COLOR = { pending: '#BA7517', paid: '#1D9E75', cancelled: '#E24B4A' };
const STATUS_LABEL = { pending: 'معلق', paid: 'مدفوع', cancelled: 'ملغى' };

export default function AdminInvoices({ goBack }) {
   const { t } = useAuth();
   const [invoices, setInvoices] = useState([]);
   const [loading, setLoading] = useState(true);
   const [printing, setPrinting] = useState(null);

   function load() {
      getInvoices().then(r => setInvoices(r.data || [])).catch(() => {}).finally(() => setLoading(false));
   }
   useEffect(() => { load(); }, []);

   async function handleStatus(id, status) {
      const label = status === 'paid' ? 'مدفوع' : 'ملغى';
      Alert.alert('تأكيد', `تغيير حالة الفاتورة إلى "${label}"؟`, [
         { text: 'إلغاء', style: 'cancel' },
         { text: 'تأكيد', onPress: async () => {
            await updateInvoiceStatus(id, status).catch(() => {});
            load();
         }},
      ]);
   }

   async function handlePrint(invoice) {
      setPrinting(invoice.id);
      try {
         const inv = await getInvoice(invoice.id);
         const data = inv.data;
         const html = `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
               <meta charset="UTF-8"/>
               <style>
                  body { font-family: Arial, sans-serif; direction: rtl; padding: 30px; color: #222; max-width: 800px; margin: auto; }
                  .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #E85D24; padding-bottom: 20px; }
                  .logo { font-size: 40px; }
                  h1 { color: #E85D24; margin: 8px 0 4px; font-size: 22px; }
                  .inv-num { color: #888; font-size: 14px; }
                  .info-grid { display: flex; justify-content: space-between; margin: 20px 0; }
                  .info-box { background: #f9f9f9; padding: 14px; border-radius: 8px; min-width: 45%; }
                  .info-label { color: #888; font-size: 11px; margin-bottom: 4px; }
                  .info-val { color: #222; font-size: 14px; font-weight: bold; }
                  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                  th { background: #E85D24; color: white; padding: 10px; text-align: right; }
                  td { border-bottom: 1px solid #eee; padding: 10px; text-align: right; }
                  .totals { background: #f9f9f9; padding: 16px; border-radius: 8px; margin-top: 20px; }
                  .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
                  .grand-total { font-size: 18px; font-weight: bold; color: #E85D24; border-top: 2px solid #E85D24; padding-top: 8px; margin-top: 8px; }
                  .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background: ${STATUS_COLOR[data.status] || '#888'}22; color: ${STATUS_COLOR[data.status] || '#888'}; }
                  .footer { text-align: center; margin-top: 40px; color: #aaa; font-size: 11px; border-top: 1px solid #eee; padding-top: 16px; }
               </style>
            </head>
            <body>
               <div class="header">
                  <div class="logo"></div>
                  <h1>فاتورة رسمية</h1>
                  <div class="inv-num">${data.invoice_number}</div>
                  <div class="status">${STATUS_LABEL[data.status] || data.status}</div>
               </div>

               <div class="info-grid">
                  <div class="info-box">
                     <div class="info-label">صادرة إلى</div>
                     <div class="info-val">${data.institution_name || 'عميل خاص'}</div>
                  </div>
                  <div class="info-box">
                     <div class="info-label">تاريخ الإصدار</div>
                     <div class="info-val">${new Date(data.created_at).toLocaleDateString('ar-DZ')}</div>
                     ${data.due_date ? `<div class="info-label" style="margin-top:8px">تاريخ الاستحقاق</div><div class="info-val">${data.due_date}</div>` : ''}
                  </div>
               </div>

               <table>
                  <thead><tr><th>نوع الوقود</th><th>الكميّة</th><th>السعر/L</th><th>المجموع</th></tr></thead>
                  <tbody>
                     ${(data.items || []).map(item => `
                        <tr>
                           <td>${item.fuel_name_ar}</td>
                           <td>${item.quantity_liters} L</td>
                           <td>${item.price_per_liter} دج</td>
                           <td>${fmt(item.subtotal)} دج</td>
                        </tr>
                     `).join('')}
                  </tbody>
               </table>

               <div class="totals">
                  <div class="total-row"><span>المبلغ الصافي</span><span>${fmt(data.net_amount)} دج</span></div>
                  <div class="total-row"><span>الضريبة (${Math.round((data.tax_rate || 0.19) * 100)}%)</span><span>${fmt(data.tax_amount)} دج</span></div>
                  <div class="total-row grand-total"><span>الإجمالي</span><span>${fmt(data.total_amount)} دج</span></div>
               </div>

               <div class="footer">نظام إدارة محطة الوقود · ${new Date().toLocaleDateString('ar-DZ')}</div>
            </body>
            </html>
         `;
         const { uri } = await Print.printToFileAsync({ html });
         await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'مشاركة الفاتورة' });
      } catch (e) {
         Alert.alert('خطأ', 'فشل إنشاء الفاتورة');
      }
      setPrinting(null);
   }

   return (
      <View style={s.screen}>
         <StatusBar backgroundColor="#1c2133" barStyle="light-content" />
         <View style={s.safeTop} />
         <View style={s.header}>
            <TouchableOpacity onPress={goBack}><Text style={s.back}>‹ رجوع</Text></TouchableOpacity>
            <Text style={s.title}>{t.invoices}</Text>
         </View>

         {loading
            ? <View style={s.center}><ActivityIndicator color="#E85D24" /></View>
            : invoices.length === 0
               ? <View style={s.center}><Text style={s.empty}>لا توجد فواتير</Text></View>
               : (
                  <ScrollView contentContainerStyle={{ padding: rp(14), paddingBottom: rp(30) }}>
                     {invoices.map(inv => (
                        <View key={inv.id} style={s.card}>
                           <View style={s.cardTop}>
                              <Text style={s.invNum}>{inv.invoice_number}</Text>
                              <View style={[s.statusBadge, { backgroundColor: (STATUS_COLOR[inv.status] || '#888') + '22' }]}>
                                 <Text style={[s.statusText, { color: STATUS_COLOR[inv.status] || '#888' }]}>
                                    {STATUS_LABEL[inv.status]}
                                 </Text>
                              </View>
                           </View>
                           <Text style={s.instName}> {inv.institution_name || 'عميل خاص'}</Text>
                           <View style={s.amountRow}>
                              <Text style={s.amountLabel}>الإجمالي</Text>
                              <Text style={s.amountVal}>{fmt(inv.total_amount)} دج</Text>
                           </View>
                           <Text style={s.dateText}> {new Date(inv.created_at).toLocaleDateString('ar-DZ')}</Text>

                           <View style={s.actions}>
                              <TouchableOpacity style={s.printBtn} onPress={() => handlePrint(inv)} disabled={printing === inv.id}>
                                 <Text style={s.printBtnText}>{printing === inv.id ? '...' : ' طباعة'}</Text>
                              </TouchableOpacity>
                              {inv.status === 'pending' && (
                                 <>
                                    <TouchableOpacity style={s.paidBtn} onPress={() => handleStatus(inv.id, 'paid')}>
                                       <Text style={s.paidBtnText}>✓ مدفوع</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={s.cancelBtn} onPress={() => handleStatus(inv.id, 'cancelled')}>
                                       <Text style={s.cancelBtnText}>✕ إلغاء</Text>
                                    </TouchableOpacity>
                                 </>
                              )}
                           </View>
                        </View>
                     ))}
                  </ScrollView>
               )
         }
      </View>
   );
}

const s = StyleSheet.create({
   screen: { flex: 1, backgroundColor: '#0f1117' },
   safeTop: { height: STATUS_BAR_HEIGHT, backgroundColor: '#1c2133' },
   header: { backgroundColor: '#1c2133', padding: rp(14), flexDirection: 'row', alignItems: 'center', gap: rp(12), borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
   back: { color: '#E85D24', fontSize: rs(16), fontWeight: '600' },
   title: { color: '#eef0f6', fontSize: rs(16), fontWeight: '700', flex: 1, textAlign: 'right' },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   empty: { color: '#555e7a', fontSize: rs(14) },
   card: { backgroundColor: '#1c2133', borderRadius: 12, padding: rp(14), marginBottom: rp(12), borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
   cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rp(6) },
   invNum: { color: '#E85D24', fontSize: rs(13), fontWeight: '700' },
   statusBadge: { paddingHorizontal: rp(10), paddingVertical: rp(3), borderRadius: 10 },
   statusText: { fontSize: rs(11), fontWeight: '700' },
   instName: { color: '#eef0f6', fontSize: rs(14), fontWeight: '600', marginBottom: rp(8) },
   amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rp(4) },
   amountLabel: { color: '#8b92a9', fontSize: rs(12) },
   amountVal: { color: '#eef0f6', fontSize: rs(16), fontWeight: '700' },
   dateText: { color: '#8b92a9', fontSize: rs(11), marginBottom: rp(12) },
   actions: { flexDirection: 'row', gap: rp(8) },
   printBtn: { flex: 1, backgroundColor: 'rgba(74,144,226,0.15)', padding: rp(10), borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(74,144,226,0.3)' },
   printBtnText:{ color: '#4A90E2', fontSize: rs(12), fontWeight: '600' },
   paidBtn: { flex: 1, backgroundColor: 'rgba(29,158,117,0.15)', padding: rp(10), borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(29,158,117,0.3)' },
   paidBtnText: { color: '#1D9E75', fontSize: rs(12), fontWeight: '600' },
   cancelBtn: { flex: 1, backgroundColor: 'rgba(226,75,74,0.15)', padding: rp(10), borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(226,75,74,0.3)' },
   cancelBtnText:{ color: '#E24B4A', fontSize: rs(12), fontWeight: '600' },
});