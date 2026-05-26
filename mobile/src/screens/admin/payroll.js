import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, TouchableOpacity, StyleSheet,
   StatusBar, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getPayroll, createPayroll, deletePayroll } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';

export default function AdminPayroll({ goBack }) {
   const { t } = useAuth();
   const [dates, setDates] = useState([]);
   const [loading, setLoading] = useState(true);
   const [form, setForm] = useState({ pay_date: '', description: '' });
   const [saving, setSaving] = useState(false);

   function load() {
      getPayroll().then(r => setDates(r.data || [])).catch(() => {}).finally(() => setLoading(false));
   }
   useEffect(() => { load(); }, []);

   async function handleAdd() {
      if (!form.pay_date) { Alert.alert('خطأ', 'أدخل تاريخ الراتب'); return; }
      setSaving(true);
      await createPayroll(form).catch(() => {});
      setForm({ pay_date: '', description: '' });
      setSaving(false);
      load();
   }

   async function handleDelete(id) {
      Alert.alert('تأكيد', 'هل تريد حذف هذا الموعد؟', [
         { text: 'إلغاء', style: 'cancel' },
         { text: 'حذف', style: 'destructive', onPress: async () => {
            await deletePayroll(id).catch(() => {});
            load();
         }},
      ]);
   }

   const today = new Date().toISOString().split('T')[0];
   const upcoming = dates.filter(d => d.pay_date >= today);
   const past = dates.filter(d => d.pay_date < today);

   return (
      <View style={s.screen}>
         <StatusBar backgroundColor="#1c2133" barStyle="light-content" />
         <View style={s.safeTop} />
         <View style={s.header}>
            <TouchableOpacity onPress={goBack}><Text style={s.back}>‹ رجوع</Text></TouchableOpacity>
            <Text style={s.title}>{t.payroll}</Text>
         </View>

         {loading
            ? <View style={s.center}><ActivityIndicator color="#E85D24" /></View>
            : (
               <ScrollView contentContainerStyle={{ padding: rp(16), paddingBottom: rp(40) }}>

                  {/* Add form */}
                  <Text style={s.section}>إضافة موعد راتب</Text>
                  <View style={s.card}>
                     <Text style={s.label}>التاريخ</Text>
                     <TextInput
                        style={s.input}
                        value={form.pay_date}
                        onChangeText={v => setForm(f => ({ ...f, pay_date: v }))}
                        placeholder="YYYY-MM-DD مثال: 2026-06-30"
                        placeholderTextColor="#555e7a"
                        textAlign="right"
                        keyboardType="numeric"
                     />
                     <Text style={s.label}>الوصف (اختياري)</Text>
                     <TextInput
                        style={s.input}
                        value={form.description}
                        onChangeText={v => setForm(f => ({ ...f, description: v }))}
                        placeholder="مثال: رواتب شهر جوان 2026"
                        placeholderTextColor="#555e7a"
                        textAlign="right"
                     />
                     <TouchableOpacity style={s.addBtn} onPress={handleAdd} disabled={saving}>
                        <Text style={s.addBtnText}>{saving ? 'جاري الحفظ...' : '+ إضافة الموعد'}</Text>
                     </TouchableOpacity>
                  </View>

                  {/* Upcoming */}
                  <Text style={s.section}> مواعيد قادمة ({upcoming.length})</Text>
                  {upcoming.length === 0
                     ? <Text style={s.empty}>لا توجد مواعيد قادمة</Text>
                     : upcoming.map(d => (
                        <View key={d.id} style={s.dateCard}>
                           <View style={s.dateLeft}>
                              <Text style={s.dateIcon}></Text>
                           </View>
                           <View style={{ flex: 1 }}>
                              <Text style={s.dateValue}>
                                 {new Date(d.pay_date).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </Text>
                              {d.description && <Text style={s.dateDesc}>{d.description}</Text>}
                              <Text style={s.daysLeft}>
                                 {Math.ceil((new Date(d.pay_date) - new Date()) / 86400000)} يوم متبقي
                              </Text>
                           </View>
                           <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(d.id)}>
                              <Text style={s.deleteBtnText}>✕</Text>
                           </TouchableOpacity>
                        </View>
                     ))
                  }

                  {/* Past */}
                  {past.length > 0 && (
                     <>
                        <Text style={[s.section, { color: '#555e7a', marginTop: rp(20) }]}>
                           سابقة ({past.length})
                        </Text>
                        {past.slice(-5).reverse().map(d => (
                           <View key={d.id} style={[s.dateCard, { opacity: 0.5 }]}>
                              <View style={s.dateLeft}>
                                 <Text style={s.dateIcon}>✓</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                 <Text style={s.dateValue}>
                                    {new Date(d.pay_date).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                                 </Text>
                                 {d.description && <Text style={s.dateDesc}>{d.description}</Text>}
                              </View>
                              <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(d.id)}>
                                 <Text style={s.deleteBtnText}>✕</Text>
                              </TouchableOpacity>
                           </View>
                        ))}
                     </>
                  )}
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
   section: { color: '#eef0f6', fontSize: rs(15), fontWeight: '700', marginBottom: rp(10), textAlign: 'right' },
   card: { backgroundColor: '#1c2133', borderRadius: 12, padding: rp(16), marginBottom: rp(16), borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
   label: { color: '#8b92a9', fontSize: rs(12), textAlign: 'right', marginBottom: rp(6), marginTop: rp(10) },
   input: { backgroundColor: '#0f1117', borderRadius: 8, padding: rp(12), color: '#eef0f6', fontSize: rs(13), borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
   addBtn: { backgroundColor: '#E85D24', borderRadius: 10, padding: rp(14), alignItems: 'center', marginTop: rp(14) },
   addBtnText: { color: '#fff', fontSize: rs(14), fontWeight: '700' },
   empty: { color: '#555e7a', textAlign: 'center', padding: rp(20), fontSize: rs(13) },
   dateCard: { backgroundColor: '#1c2133', borderRadius: 12, padding: rp(14), marginBottom: rp(10), flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
   dateLeft: { width: rp(40), height: rp(40), borderRadius: rp(20), backgroundColor: 'rgba(232,93,36,0.15)', justifyContent: 'center', alignItems: 'center', marginLeft: rp(12) },
   dateIcon: { fontSize: rs(20) },
   dateValue: { color: '#eef0f6', fontSize: rs(14), fontWeight: '600', textAlign: 'right' },
   dateDesc: { color: '#8b92a9', fontSize: rs(12), textAlign: 'right', marginTop: 2 },
   daysLeft: { color: '#E85D24', fontSize: rs(11), textAlign: 'right', marginTop: 4 },
   deleteBtn: { padding: rp(8) },
   deleteBtnText:{ color: '#E24B4A', fontSize: rs(16), fontWeight: '700' },
});