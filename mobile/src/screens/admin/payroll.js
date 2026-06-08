import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, TouchableOpacity, StyleSheet,
   StatusBar, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getThemeColors } from '../../utils/theme';
import { getPayroll, createPayroll, deletePayroll } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';
import { ScreenHeader } from '../../utils/components';

export default function AdminPayroll({ goBack }) {
   const { t, lang, theme } = useAuth();
   const c = getThemeColors(theme || 'dark');
   const s = getStyles(c);
   const [dates, setDates] = useState([]);
   const [loading, setLoading] = useState(true);
   const [form, setForm] = useState({ pay_date: '', description: '' });
   const [saving, setSaving] = useState(false);

   function load() {
      getPayroll().then(r => setDates(r.data || [])).catch(() => {}).finally(() => setLoading(false));
   }
   useEffect(() => { load(); }, []);

   async function handleAdd() {
      if (!form.pay_date) { Alert.alert(t.errorTitle, t.enterPayDate); return; }
      setSaving(true);
      await createPayroll(form).catch(() => {});
      setForm({ pay_date: '', description: '' });
      setSaving(false);
      load();
   }

   async function handleDelete(id) {
      Alert.alert(t.confirmation, t.deletePayDateConfirm, [
         { text: t.cancel, style: 'cancel' },
         { text: t.delete, style: 'destructive', onPress: async () => {
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
         <ScreenHeader
            title={t.payroll}
            onBack={goBack}
            lang={lang}
            theme={theme}
            c={c}
         />

         {loading
            ? <View style={s.center}><ActivityIndicator color="#E85D24" /></View>
            : (
               <ScrollView contentContainerStyle={{ padding: rp(16), paddingBottom: rp(40) }}>

                  {/* Add form */}
                  <Text style={s.section}>{t.addPayDate}</Text>
                  <View style={s.card}>
                     <Text style={s.label}>{t.date}</Text>
                      <TextInput
                         style={s.input}
                         value={form.pay_date}
                         onChangeText={v => setForm(f => ({ ...f, pay_date: v }))}
                         placeholder={lang === 'fr' ? 'AAAA-MM-JJ exemple: 2026-06-30' : 'YYYY-MM-DD مثال: 2026-06-30'}
                         placeholderTextColor={c.muted}
                         textAlign="right"
                         keyboardType="numeric"
                      />
                     <Text style={s.label}>{t.payDateDesc}</Text>
                      <TextInput
                         style={s.input}
                         value={form.description}
                         onChangeText={v => setForm(f => ({ ...f, description: v }))}
                         placeholder={lang === 'fr' ? 'Ex: Salaires juin 2026' : 'مثال: رواتب شهر جوان 2026'}
                         placeholderTextColor={c.muted}
                         textAlign="right"
                      />
                     <TouchableOpacity style={s.addBtn} onPress={handleAdd} disabled={saving}>
                        <Text style={s.addBtnText}>{saving ? t.saving : t.addPayDateBtn}</Text>
                     </TouchableOpacity>
                  </View>

                  {/* Upcoming */}
                  <Text style={s.section}>{t.upcoming} ({upcoming.length})</Text>
                  {upcoming.length === 0
                     ? <Text style={s.empty}>{t.noUpcoming}</Text>
                     : upcoming.map(d => (
                        <View key={d.id} style={s.dateCard}>
                           <View style={s.dateLeft}>
                              <Text style={s.dateIcon}></Text>
                           </View>
                           <View style={{ flex: 1 }}>
                              <Text style={s.dateValue}>
                                 {new Date(d.pay_date).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </Text>
                              {d.description && <Text style={s.dateDesc}>{d.description}</Text>}
                              <Text style={s.daysLeft}>
                                 {Math.ceil((new Date(d.pay_date) - new Date()) / 86400000)} {t.daysRemaining}
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
                        <Text style={[s.section, { color: c.muted, marginTop: rp(20) }]}>
                           {t.past} ({past.length})
                        </Text>
                        {past.slice(-5).reverse().map(d => (
                           <View key={d.id} style={[s.dateCard, { opacity: 0.5 }]}>
                              <View style={s.dateLeft}>
                                 <Text style={s.dateIcon}>✓</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                 <Text style={s.dateValue}>
                                    {new Date(d.pay_date).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
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

const getStyles = (c) => StyleSheet.create({
   screen: { flex: 1, backgroundColor: c.bg },
   safeTop: { height: STATUS_BAR_HEIGHT, backgroundColor: c.card },
   header: { backgroundColor: c.card, padding: rp(14), flexDirection: 'row', alignItems: 'center', gap: rp(12), borderBottomWidth: 1, borderBottomColor: c.border },
   back: { color: '#E85D24', fontSize: rs(16), fontWeight: '600' },
   title: { color: c.text, fontSize: rs(16), fontWeight: '700', flex: 1, textAlign: 'right' },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   section: { color: c.text, fontSize: rs(15), fontWeight: '700', marginBottom: rp(10), textAlign: 'right' },
   card: { backgroundColor: c.card, borderRadius: 12, padding: rp(16), marginBottom: rp(16), borderWidth: 1, borderColor: c.border },
   label: { color: c.sub, fontSize: rs(12), textAlign: 'right', marginBottom: rp(6), marginTop: rp(10) },
   input: { backgroundColor: c.bg, borderRadius: 8, padding: rp(12), color: c.text, fontSize: rs(13), borderWidth: 1, borderColor: c.border },
   addBtn: { backgroundColor: '#E85D24', borderRadius: 10, padding: rp(14), alignItems: 'center', marginTop: rp(14) },
   addBtnText: { color: '#fff', fontSize: rs(14), fontWeight: '700' },
   empty: { color: c.muted, textAlign: 'center', padding: rp(20), fontSize: rs(13) },
   dateCard: { backgroundColor: c.card, borderRadius: 12, padding: rp(14), marginBottom: rp(10), flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: c.border },
   dateLeft: { width: rp(40), height: rp(40), borderRadius: rp(20), backgroundColor: 'rgba(232,93,36,0.15)', justifyContent: 'center', alignItems: 'center', marginLeft: rp(12) },
   dateIcon: { fontSize: rs(20) },
   dateValue: { color: c.text, fontSize: rs(14), fontWeight: '600', textAlign: 'right' },
   dateDesc: { color: c.sub, fontSize: rs(12), textAlign: 'right', marginTop: 2 },
   daysLeft: { color: '#E85D24', fontSize: rs(11), textAlign: 'right', marginTop: 4 },
   deleteBtn: { padding: rp(8) },
   deleteBtnText:{ color: '#E24B4A', fontSize: rs(16), fontWeight: '700' },
});