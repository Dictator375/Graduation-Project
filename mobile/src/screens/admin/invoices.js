import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, TouchableOpacity, StyleSheet,
   StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../context/AuthContext';
import { getThemeColors } from '../../utils/theme';
import { getSales, getInvoices, generateInvoice, downloadInvoice } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';
import { ScreenHeader } from '../../utils/components';

function fmt(n) { return Number(n || 0).toLocaleString('ar-DZ'); }

const STATUS_COLOR = { pending: '#BA7517', paid: '#1D9E75', cancelled: '#E24B4A' };
const STATUS_LABEL = {
   ar: { pending: 'معلق', paid: 'مدفوع', cancelled: 'ملغى' },
   fr: { pending: 'En attente', paid: 'Payé', cancelled: 'Annulé' },
};

export default function AdminInvoices({ goBack }) {
   const { t, lang, theme } = useAuth();
   const c = getThemeColors(theme || 'dark');
   const s = getStyles(c);
   const [invoices, setInvoices] = useState([]);
   const [loading, setLoading] = useState(true);
   const [printing, setPrinting] = useState(null);

   function load() {
      getInvoices().then(r => setInvoices(r.data || [])).catch(() => {}).finally(() => setLoading(false));
   }
   useEffect(() => { load(); }, []);

   async function handleStatus(id, status) {
      const label = status === 'paid' ? t.paid : t.cancelled;
      Alert.alert(t.confirmation, t.changeStatusConfirm, [
         { text: t.cancel, style: 'cancel' },
         { text: t.confirm, onPress: async () => {
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
            <html dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
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
                  <h1>${t.officialInvoice}</h1>
                  <div class="inv-num">${data.invoice_number}</div>
                  <div class="status">${STATUS_LABEL[data.status] || data.status}</div>
               </div>

               <div class="info-grid">
                  <div class="info-box">
                     <div class="info-label">${t.issuedTo}</div>
                     <div class="info-val">${data.institution_name || t.privateClient}</div>
                  </div>
                  <div class="info-box">
                     <div class="info-label">${t.issueDate}</div>
                     <div class="info-val">${new Date(data.created_at).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')}</div>
                     ${data.due_date ? `<div class="info-label" style="margin-top:8px">${lang === 'fr' ? "Date d'échéance" : "تاريخ الاستحقاق"}</div><div class="info-val">${data.due_date}</div>` : ''}
                  </div>
               </div>

               <table>
                  <thead><tr><th>${t.fuelType}</th><th>${t.quantity}</th><th>${t.unitPrice}</th><th>${t.subtotal}</th></tr></thead>
                  <tbody>
                     ${(data.items || []).map(item => `
                        <tr>
                           <td>${lang === 'fr' ? (item.fuel_name_fr || item.fuel_name_ar) : item.fuel_name_ar}</td>
                           <td>${item.quantity_liters} L</td>
                           <td>${item.price_per_liter} ${t.currency}</td>
                           <td>${fmt(item.subtotal)} ${t.currency}</td>
                        </tr>
                     `).join('')}
                  </tbody>
               </table>

               <div class="totals">
                  <div class="total-row grand-total"><span>${t.invoiceTotal}</span><span>${fmt(data.total_amount)} ${t.currency}</span></div>
               </div>

               <div class="footer">${t.appName} · ${new Date().toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')}</div>
            </body>
            </html>
         `;
         const { uri } = await Print.printToFileAsync({ html });
         await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: t.shareInvoice });
      } catch (e) {
         Alert.alert(t.errorTitle, t.invoiceCreateFailed);
      }
      setPrinting(null);
   }

   return (
      <View style={s.screen}>
         <ScreenHeader
            title={t.invoices}
            onBack={goBack}
            lang={lang}
            theme={theme}
            c={c}
         />

         {loading
            ? <View style={s.center}><ActivityIndicator color="#E85D24" /></View>
            : invoices.length === 0
               ? <View style={s.center}><Text style={s.empty}>{t.noInvoices}</Text></View>
               : (
                  <ScrollView contentContainerStyle={{ padding: rp(14), paddingBottom: rp(30) }}>
                     {invoices.map(inv => (
                        <View key={inv.id} style={s.card}>
                           <View style={s.cardTop}>
                              <Text style={s.invNum}>{inv.invoice_number}</Text>
                              <View style={[s.statusBadge, { backgroundColor: (STATUS_COLOR[inv.status] || '#888') + '22' }]}>
                                 <Text style={[s.statusText, { color: STATUS_COLOR[inv.status] || '#888' }]}>
                                    {(STATUS_LABEL[lang] || STATUS_LABEL.ar)[inv.status]}
                                 </Text>
                              </View>
                           </View>
                           <Text style={s.instName}> {inv.institution_name || t.privateClient}</Text>
                           <View style={s.amountRow}>
                              <Text style={s.amountLabel}>{t.invoiceTotal}</Text>
                              <Text style={s.amountVal}>{fmt(inv.total_amount)} {t.currency}</Text>
                           </View>
                           <Text style={s.dateText}> {new Date(inv.created_at).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')}</Text>

                           <View style={s.actions}>
                              <TouchableOpacity style={s.printBtn} onPress={() => handlePrint(inv)} disabled={printing === inv.id}>
                                 <Text style={s.printBtnText}>{printing === inv.id ? '...' : `🖨 ${t.print}`}</Text>
                              </TouchableOpacity>
                              {inv.status === 'pending' && (
                                 <>
                                    <TouchableOpacity style={s.paidBtn} onPress={() => handleStatus(inv.id, 'paid')}>
                                       <Text style={s.paidBtnText}>✓ {t.paid}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={s.cancelBtn} onPress={() => handleStatus(inv.id, 'cancelled')}>
                                       <Text style={s.cancelBtnText}>✕ {t.cancel}</Text>
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

const getStyles = (c) => StyleSheet.create({
   screen: { flex: 1, backgroundColor: c.bg },
   safeTop: { height: STATUS_BAR_HEIGHT, backgroundColor: c.card },
   header: { backgroundColor: c.card, padding: rp(14), flexDirection: 'row', alignItems: 'center', gap: rp(12), borderBottomWidth: 1, borderBottomColor: c.border },
   back: { color: '#E85D24', fontSize: rs(16), fontWeight: '600' },
   title: { color: c.text, fontSize: rs(16), fontWeight: '700', flex: 1, textAlign: 'right' },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   empty: { color: c.muted, fontSize: rs(14) },
   card: { backgroundColor: c.card, borderRadius: 12, padding: rp(14), marginBottom: rp(12), borderWidth: 1, borderColor: c.border },
   cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rp(6) },
   invNum: { color: '#E85D24', fontSize: rs(13), fontWeight: '700' },
   statusBadge: { paddingHorizontal: rp(10), paddingVertical: rp(3), borderRadius: 10 },
   statusText: { fontSize: rs(11), fontWeight: '700' },
   instName: { color: c.text, fontSize: rs(14), fontWeight: '600', marginBottom: rp(8) },
   amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rp(4) },
   amountLabel: { color: c.sub, fontSize: rs(12) },
   amountVal: { color: c.text, fontSize: rs(16), fontWeight: '700' },
   dateText: { color: c.sub, fontSize: rs(11), marginBottom: rp(12) },
   actions: { flexDirection: 'row', gap: rp(8) },
   printBtn: { flex: 1, backgroundColor: 'rgba(74,144,226,0.15)', padding: rp(10), borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(74,144,226,0.3)' },
   printBtnText:{ color: '#4A90E2', fontSize: rs(12), fontWeight: '600' },
   paidBtn: { flex: 1, backgroundColor: 'rgba(29,158,117,0.15)', padding: rp(10), borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(29,158,117,0.3)' },
   paidBtnText: { color: '#1D9E75', fontSize: rs(12), fontWeight: '600' },
   cancelBtn: { flex: 1, backgroundColor: 'rgba(226,75,74,0.15)', padding: rp(10), borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(226,75,74,0.3)' },
   cancelBtnText:{ color: '#E24B4A', fontSize: rs(12), fontWeight: '600' },
});