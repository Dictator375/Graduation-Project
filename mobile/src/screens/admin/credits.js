import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, TouchableOpacity, StyleSheet,
   StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getCreditSales, markCreditPaid } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';

function fmt(n) { return Number(n || 0).toLocaleString('ar-DZ'); }

export default function AdminCredits({ goBack }) {
   const { t } = useAuth();
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
         'تأكيد السداد',
         `هل تريد تسجيل سداد ${fmt(sale.total_amount)} دج من ${sale.institution_name || 'عميل'}؟`,
         [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'تأكيد السداد', onPress: async () => {
               await markCreditPaid(sale.id).catch(() => {});
               load();
               Alert.alert('✓', 'تم تسجيل السداد وإزالة الدين');
            }},
         ]
      );
   }

   return (
      <View style={s.screen}>
         <StatusBar backgroundColor="#1c2133" barStyle="light-content" />
         <View style={s.safeTop} />
         <View style={s.header}>
            <TouchableOpacity onPress={goBack}><Text style={s.back}>‹ رجوع</Text></TouchableOpacity>
            <Text style={s.title}>الديون غير المسددة</Text>
         </View>

         {/* Total debt summary */}
         <View style={s.debtSummary}>
            <Text style={s.debtLabel}>إجمالي الديون</Text>
            <Text style={s.debtAmount}>{fmt(totalDebt)} دج</Text>
            <Text style={s.debtCount}>{credits.length} دين غير مسدد</Text>
         </View>

         {loading
            ? <View style={s.center}><ActivityIndicator color="#E85D24" /></View>
            : credits.length === 0
               ? (
                  <View style={s.emptyWrap}>
                     <Text style={{ fontSize: rs(48), marginBottom: rp(12) }}></Text>
                     <Text style={s.emptyText}>لا توجد ديون غير مسددة</Text>
                     <Text style={s.emptySub}>جميع المؤسسات سددت ديونها</Text>
                  </View>
               )
               : (
                  <ScrollView contentContainerStyle={{ padding: rp(14), paddingBottom: rp(30) }}>
                     {credits.map(sale => (
                        <View key={sale.id} style={s.creditCard}>
                           {/* Institution name */}
                           <View style={s.cardHeader}>
                              <Text style={s.instName}> {sale.institution_name || 'عميل غير محدد'}</Text>
                              <Text style={s.creditAmt}>{fmt(sale.total_amount)} دج</Text>
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
                              <Text style={s.payBtnText}>✓ تسجيل السداد — يختفي الدين</Text>
                           </TouchableOpacity>
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
   debtSummary: { backgroundColor: 'rgba(226,75,74,0.12)', borderBottomWidth: 1, borderBottomColor: 'rgba(226,75,74,0.2)', padding: rp(16), alignItems: 'center' },
   debtLabel: { color: '#8b92a9', fontSize: rs(12) },
   debtAmount: { color: '#E24B4A', fontSize: rs(28), fontWeight: '700', marginVertical: rp(4) },
   debtCount: { color: '#8b92a9', fontSize: rs(12) },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: rp(30) },
   emptyText: { color: '#eef0f6', fontSize: rs(16), fontWeight: '700', textAlign: 'center' },
   emptySub: { color: '#8b92a9', fontSize: rs(13), textAlign: 'center', marginTop: rp(6) },
   creditCard: { backgroundColor: '#1c2133', borderRadius: 12, padding: rp(14), marginBottom: rp(12), borderWidth: 1, borderColor: 'rgba(226,75,74,0.25)' },
   cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rp(10) },
   instName: { color: '#eef0f6', fontSize: rs(14), fontWeight: '700', flex: 1 },
   creditAmt: { color: '#E24B4A', fontSize: rs(16), fontWeight: '700' },
   detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rp(4) },
   detailText: { color: '#8b92a9', fontSize: rs(12) },
   payBtn: { backgroundColor: 'rgba(29,158,117,0.15)', borderRadius: 10, padding: rp(12), alignItems: 'center', marginTop: rp(12), borderWidth: 1, borderColor: 'rgba(29,158,117,0.3)' },
   payBtnText: { color: '#1D9E75', fontSize: rs(13), fontWeight: '700' },
});