import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, TouchableOpacity, StyleSheet,
   StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getThemeColors } from '../../utils/theme';
import { getCreditSales, markCreditPaid } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';
import { ScreenHeader } from '../../utils/components';

function fmt(n) { return Number(n || 0).toLocaleString('ar-DZ'); }

export default function AdminCredits({ goBack }) {
   const { t, lang, theme } = useAuth();
   const c = getThemeColors(theme || 'dark');
   const s = getStyles(c);
   const [credits, setCredits] = useState([]);
   const [loading, setLoading] = useState(true);

   function load() {
      getCreditSales()
         .then(r => setCredits(r.data || []))
         .catch(() => {})
         .finally(() => setLoading(false));
   }
   useEffect(() => { load(); }, []);

   const totalDebt = credits.reduce((s, r) => s + r.total_amount, 0);

   async function handlePay(sale) {
      Alert.alert(
         t.confirmPayment,
         `${t.confirmPaymentMsg} ${fmt(sale.total_amount)} ${t.currency} — ${sale.institution_name || t.unknownClient}`,
         [
            { text: t.cancel, style: 'cancel' },
            { text: t.confirmPayment, onPress: async () => {
               await markCreditPaid(sale.id).catch(() => {});
               load();
               Alert.alert(t.successTitle, t.paymentRegistered);
            }},
         ]
      );
   }

   return (
      <View style={s.screen}>
         <ScreenHeader
            title={t.credits}
            onBack={goBack}
            lang={lang}
            theme={theme}
            c={c}
         />

         {/* Total debt summary */}
         <View style={s.debtSummary}>
            <Text style={s.debtLabel}>{t.totalDebt}</Text>
            <Text style={s.debtAmount}>{fmt(totalDebt)} {t.currency}</Text>
            <Text style={s.debtCount}>{credits.length} {t.unpaidDebt}</Text>
         </View>

         {loading
            ? <View style={s.center}><ActivityIndicator color="#E85D24" /></View>
            : credits.length === 0
               ? (
                  <View style={s.emptyWrap}>
                     <Text style={{ fontSize: rs(48), marginBottom: rp(12) }}></Text>
                     <Text style={s.emptyText}>{t.noUnpaidDebts}</Text>
                     <Text style={s.emptySub}>{t.allDebtsCleared}</Text>
                  </View>
               )
               : (
                  <ScrollView contentContainerStyle={{ padding: rp(14), paddingBottom: rp(30) }}>
                     {credits.map(sale => (
                        <View key={sale.id} style={s.creditCard}>
                           {/* Institution name */}
                           <View style={s.cardHeader}>
                              <Text style={s.instName}> {sale.institution_name || t.unknownClient}</Text>
                              <Text style={s.creditAmt}>{fmt(sale.total_amount)} {t.currency}</Text>
                           </View>

                           {/* Sale details */}
                           <View style={s.detailRow}>
                              <Text style={s.detailText}> {sale.fuel_name_ar} · {sale.quantity_liters} L</Text>
                              <Text style={s.detailText}> {sale.shift_date}</Text>
                           </View>
                           <View style={s.detailRow}>
                              <Text style={s.detailText}> {sale.worker_name_ar || sale.worker_name}</Text>
                              <Text style={s.detailText}> {sale.institution_phone || '—'}</Text>
                           </View>

                           {/* Pay button */}
                           <TouchableOpacity style={s.payBtn} onPress={() => handlePay(sale)}>
                              <Text style={s.payBtnText}>{t.registerPayment}</Text>
                           </TouchableOpacity>
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
   debtSummary: { backgroundColor: 'rgba(226,75,74,0.12)', borderBottomWidth: 1, borderBottomColor: 'rgba(226,75,74,0.2)', padding: rp(16), alignItems: 'center' },
   debtLabel: { color: c.sub, fontSize: rs(12) },
   debtAmount: { color: '#E24B4A', fontSize: rs(28), fontWeight: '700', marginVertical: rp(4) },
   debtCount: { color: c.sub, fontSize: rs(12) },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: rp(30) },
   emptyText: { color: c.text, fontSize: rs(16), fontWeight: '700', textAlign: 'center' },
   emptySub: { color: c.sub, fontSize: rs(13), textAlign: 'center', marginTop: rp(6) },
   creditCard: { backgroundColor: c.card, borderRadius: 12, padding: rp(14), marginBottom: rp(12), borderWidth: 1, borderColor: 'rgba(226,75,74,0.25)' },
   cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rp(10) },
   instName: { color: c.text, fontSize: rs(14), fontWeight: '700', flex: 1 },
   creditAmt: { color: '#E24B4A', fontSize: rs(16), fontWeight: '700' },
   detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rp(4) },
   detailText: { color: c.sub, fontSize: rs(12) },
   payBtn: { backgroundColor: 'rgba(29,158,117,0.15)', borderRadius: 10, padding: rp(12), alignItems: 'center', marginTop: rp(12), borderWidth: 1, borderColor: 'rgba(29,158,117,0.3)' },
   payBtnText: { color: '#1D9E75', fontSize: rs(13), fontWeight: '700' },
});