import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, TouchableOpacity, StyleSheet,
   StatusBar, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getThemeColors } from '../../utils/theme';
import { getPayrollReport, generatePayroll } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';
import { ScreenHeader } from '../../utils/components';

function fmt(n) { return Number(n || 0).toLocaleString('ar-DZ'); }

export default function AdminPayroll({ goBack }) {
   const { t, lang, theme } = useAuth();
   const c = getThemeColors(theme || 'dark');
   const s = getStyles(c);

   const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
   const [records, setRecords] = useState([]);
   const [summary, setSummary] = useState({});
   const [loading, setLoading] = useState(true);
   const [generating, setGenerating] = useState(false);

   function load() {
      setLoading(true);
      getPayrollReport(month).then(res => {
         if (res.data && res.data.records) {
            setRecords(res.data.records);
            setSummary(res.data.summary);
         } else {
            setRecords([]);
            setSummary({});
         }
      }).catch(e => {
         console.error(e);
      }).finally(() => setLoading(false));
   }

   useEffect(() => { load(); }, [month]);

   async function handleGenerate() {
      Alert.alert(
         t.confirmation || 'تأكيد',
         t.generatePayrollConfirm || 'هل أنت متأكد من حساب الرواتب لهذا الشهر؟ سيتم تحديث السجلات.',
         [
            { text: t.cancel || 'إلغاء', style: 'cancel' },
            {
               text: t.confirm || 'تأكيد',
               style: 'destructive',
               onPress: async () => {
                  setGenerating(true);
                  try {
                     await generatePayroll(month);
                     Alert.alert('✓', t.payrollGenerated || 'تم حساب الرواتب بنجاح');
                     load();
                  } catch (e) {
                     Alert.alert(t.errorTitle || 'خطأ', t.error || 'حدث خطأ');
                  }
                  setGenerating(false);
               }
            }
         ]
      );
   }

   return (
      <View style={s.screen}>
         <ScreenHeader
            title={t.payroll || 'الرواتب'}
            onBack={goBack}
            lang={lang}
            theme={theme}
            c={c}
         />

         <View style={{ padding: rp(16), borderBottomWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.sub, marginBottom: 5, textAlign: 'right' }}>{t.month || 'الشهر'}</Text>
            <TextInput
               style={s.input}
               value={month}
               onChangeText={setMonth}
               placeholder="YYYY-MM"
               placeholderTextColor={c.muted}
               textAlign="right"
            />
         </View>

         {loading ? (
            <View style={s.center}><ActivityIndicator color="#E85D24" /></View>
         ) : (
            <ScrollView contentContainerStyle={{ padding: rp(16), paddingBottom: rp(80) }}>
               {/* Summary */}
               {summary && summary.total_net !== undefined && (
                  <View style={s.summaryCard}>
                     <Text style={s.section}>{t.summary || 'الملخص'}</Text>
                     <View style={s.row}>
                        <Text style={s.label}>{t.totalBase || 'إجمالي الراتب الأساسي'}</Text>
                        <Text style={s.val}>{fmt(summary.total_base)} دج</Text>
                     </View>
                     <View style={s.row}>
                        <Text style={s.label}>{t.totalDeduction || 'إجمالي الخصومات'}</Text>
                        <Text style={s.val}>{fmt(summary.total_deduction)} دج</Text>
                     </View>
                     <View style={s.row}>
                        <Text style={[s.label, { color: '#1D9E75' }]}>{t.totalNet || 'إجمالي الصافي'}</Text>
                        <Text style={[s.val, { color: '#1D9E75', fontWeight: 'bold' }]}>{fmt(summary.total_net)} دج</Text>
                     </View>
                  </View>
               )}

               {records.length === 0 ? (
                  <Text style={s.empty}>{t.noData || 'لا توجد رواتب لهذا الشهر'}</Text>
               ) : (
                  records.map(rec => (
                     <View key={rec.id} style={s.card}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                           <Text style={{ color: '#1D9E75', fontWeight: 'bold' }}>{fmt(rec.net_salary)} دج</Text>
                           <Text style={{ color: c.text, fontSize: rs(14), fontWeight: 'bold' }}>
                              {lang === 'fr' ? (rec.full_name_fr || rec.full_name) : (rec.full_name_ar || rec.full_name)}
                           </Text>
                        </View>
                        <Text style={s.subText}>{t.baseSalary || 'الراتب الأساسي'}: {fmt(rec.base_salary)} دج</Text>
                        {rec.deduction > 0 && <Text style={[s.subText, { color: '#E24B4A' }]}>{t.deduction || 'الخصم'}: {fmt(rec.deduction)} دج</Text>}
                     </View>
                  ))
               )}
            </ScrollView>
         )}

         {/* Generate button */}
         <View style={s.saveWrap}>
            <TouchableOpacity style={s.saveBtn} onPress={handleGenerate} disabled={generating || loading}>
               <Text style={s.saveBtnText}>{generating ? (t.saving || 'جاري الحفظ...') : (t.generate || 'حساب الرواتب')}</Text>
            </TouchableOpacity>
         </View>
      </View>
   );
}

const getStyles = (c) => StyleSheet.create({
   screen: { flex: 1, backgroundColor: c.bg },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   input: { backgroundColor: c.card, color: c.text, borderRadius: 8, padding: rp(12), borderWidth: 1, borderColor: c.border, textAlign: 'right' },
   summaryCard: { backgroundColor: c.card, borderRadius: 12, padding: rp(16), marginBottom: rp(16), borderWidth: 1, borderColor: c.border },
   section: { color: c.text, fontSize: rs(15), fontWeight: '700', marginBottom: rp(10), textAlign: 'right' },
   row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rp(6) },
   label: { color: c.sub, fontSize: rs(13) },
   val: { color: c.text, fontSize: rs(13), fontWeight: '600' },
   card: { backgroundColor: c.card, borderRadius: 12, padding: rp(14), marginBottom: rp(10), borderWidth: 1, borderColor: c.border },
   subText: { color: c.sub, fontSize: rs(12), marginBottom: 4, textAlign: 'right' },
   empty: { color: c.muted, textAlign: 'center', padding: rp(20), fontSize: rs(13) },
   saveWrap: { position: 'absolute', bottom: rp(16), left: rp(16), right: rp(16) },
   saveBtn: { backgroundColor: '#E85D24', borderRadius: 12, padding: rp(16), alignItems: 'center' },
   saveBtnText: { color: '#fff', fontSize: rs(15), fontWeight: '700' },
});