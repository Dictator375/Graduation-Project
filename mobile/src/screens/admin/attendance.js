import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, TouchableOpacity, StyleSheet,
   StatusBar, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getThemeColors } from '../../utils/theme';
import { getEmployees, getAttendance, saveAttendance } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';
import { ScreenHeader } from '../../utils/components';

export default function AdminAttendance({ goBack }) {
   const { t, lang, theme } = useAuth();
   const c = getThemeColors(theme || 'dark');
   const s = getStyles(c);

   const STATUS_OPTIONS = [
      { value: 'present', label: t.present || 'حاضر', color: '#1D9E75' },
      { value: 'absent', label: t.absent || 'غائب', color: '#E24B4A' },
      { value: 'late', label: t.late || 'متأخر', color: '#BA7517' },
      { value: 'excused', label: t.excused || 'مبرر', color: '#4A90E2' },
   ];

   const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
   const [employees, setEmployees] = useState([]);
   const [attendance, setAttendance] = useState({});
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);

   function loadData(d) {
      setLoading(true);
      Promise.all([getEmployees(), getAttendance(d)]).then(([emp, att]) => {
         setEmployees((emp.data || []).filter(e => e.is_active && e.role !== 'manager'));
         const map = {};
         (att.data || []).forEach(a => {
            map[a.user_id] = {
               status: a.status,
               check_in: a.check_in || '',
               check_out: a.check_out || '',
               notes: a.notes || ''
            };
         });
         setAttendance(map);
      }).catch(() => {}).finally(() => setLoading(false));
   }

   useEffect(() => { loadData(date); }, [date]);

   function changeDate(dir) {
      const d = new Date(date);
      d.setDate(d.getDate() + dir);
      setDate(d.toISOString().split('T')[0]);
   }

   function setField(userId, field, val) {
      setAttendance(prev => ({
         ...prev,
         [userId]: {
            ...(prev[userId] || { status: 'absent', check_in: '', check_out: '', notes: '' }),
            [field]: val
         }
      }));
   }

   async function handleSave() {
      setSaving(true);
      const records = employees.map(emp => {
         const att = attendance[emp.id] || {};
         return {
            user_id: emp.id,
            date,
            status: att.status || 'absent',
            check_in: att.check_in || null,
            check_out: att.check_out || null,
            notes: att.notes || null,
         };
      });
      await saveAttendance(records).catch(() => {});
      setSaving(false);
      Alert.alert('✓', t.attendanceSaved || 'تم الحفظ بنجاح');
   }

   const counts = { present: 0, absent: 0, late: 0, excused: 0 };
   employees.forEach(e => { const st = attendance[e.id]?.status || 'absent'; counts[st]++; });

   return (
      <View style={s.screen}>
         <ScreenHeader
            title={t.attendance || 'الحضور والغياب'}
            onBack={goBack}
            lang={lang}
            theme={theme}
            c={c}
         />

         {/* Date navigator */}
         <View style={s.dateBar}>
            <TouchableOpacity style={s.dateBtn} onPress={() => changeDate(1)}><Text style={s.dateBtnText}>›</Text></TouchableOpacity>
            <Text style={s.dateText}>{new Date(date).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            <TouchableOpacity style={s.dateBtn} onPress={() => changeDate(-1)}><Text style={s.dateBtnText}>‹</Text></TouchableOpacity>
         </View>

         {/* Summary */}
         <View style={s.summary}>
            {STATUS_OPTIONS.map(opt => (
               <View key={opt.value} style={s.summaryItem}>
                  <Text style={[s.summaryCount, { color: opt.color }]}>{counts[opt.value]}</Text>
                  <Text style={s.summaryLabel}>{opt.label}</Text>
               </View>
            ))}
         </View>

         {loading
            ? <View style={s.center}><ActivityIndicator color="#E85D24" /></View>
            : (
               <ScrollView contentContainerStyle={{ padding: rp(12), paddingBottom: rp(80) }}>
                  {employees.map(emp => {
                     const att = attendance[emp.id] || { status: 'absent' };
                     const status = att.status;
                     const isPresent = status === 'present' || status === 'late';

                     return (
                        <View key={emp.id} style={s.empCard}>
                           <Text style={s.empName}>{lang === 'fr' ? (emp.full_name_fr || emp.full_name) : (emp.full_name_ar || emp.full_name)}</Text>
                           <View style={s.statusRow}>
                              {STATUS_OPTIONS.map(opt => (
                                 <TouchableOpacity
                                    key={opt.value}
                                    style={[s.statusBtn, status === opt.value && { backgroundColor: opt.color }]}
                                    onPress={() => setField(emp.id, 'status', opt.value)}
                                 >
                                    <Text style={[s.statusBtnText, status === opt.value && { color: '#fff' }]}>
                                       {opt.label}
                                    </Text>
                                 </TouchableOpacity>
                              ))}
                           </View>

                           {isPresent && (
                              <View style={s.inputsRow}>
                                 <TextInput
                                    style={s.inputHalf}
                                    placeholder={t.checkOut || 'خروج (HH:MM)'}
                                    placeholderTextColor={c.muted}
                                    value={att.check_out}
                                    onChangeText={v => setField(emp.id, 'check_out', v)}
                                    textAlign="center"
                                 />
                                 <TextInput
                                    style={s.inputHalf}
                                    placeholder={t.checkIn || 'دخول (HH:MM)'}
                                    placeholderTextColor={c.muted}
                                    value={att.check_in}
                                    onChangeText={v => setField(emp.id, 'check_in', v)}
                                    textAlign="center"
                                 />
                              </View>
                           )}

                           <TextInput
                              style={s.inputFull}
                              placeholder={t.notes || 'ملاحظات...'}
                              placeholderTextColor={c.muted}
                              value={att.notes}
                              onChangeText={v => setField(emp.id, 'notes', v)}
                              textAlign="right"
                           />
                        </View>
                     );
                  })}
               </ScrollView>
            )
         }

         {/* Save button */}
         <View style={s.saveWrap}>
            <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
               <Text style={s.saveBtnText}>{saving ? (t.saving || 'جاري الحفظ...') : `✓ ${t.save || 'حفظ'}`}</Text>
            </TouchableOpacity>
         </View>
      </View>
   );
}

const getStyles = (c) => StyleSheet.create({
   screen: { flex: 1, backgroundColor: c.bg },
   dateBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: rp(12), backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border },
   dateBtn: { padding: rp(8) },
   dateBtnText: { color: '#E85D24', fontSize: rs(20), fontWeight: '700' },
   dateText: { color: c.text, fontSize: rs(13), fontWeight: '500', textAlign: 'center', flex: 1 },
   summary: { flexDirection: 'row', backgroundColor: c.bg, padding: rp(10), borderBottomWidth: 1, borderBottomColor: c.border },
   summaryItem: { flex: 1, alignItems: 'center' },
   summaryCount: { fontSize: rs(20), fontWeight: '700' },
   summaryLabel: { color: c.sub, fontSize: rs(10), marginTop: 2 },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   empCard: { backgroundColor: c.card, borderRadius: 12, padding: rp(14), marginBottom: rp(10), borderWidth: 1, borderColor: c.border },
   empName: { color: c.text, fontSize: rs(14), fontWeight: '600', textAlign: 'right', marginBottom: rp(10) },
   statusRow: { flexDirection: 'row', gap: rp(6), marginBottom: rp(10) },
   statusBtn: { flex: 1, padding: rp(8), borderRadius: 8, alignItems: 'center', backgroundColor: c.bg, borderWidth: 1, borderColor: c.border },
   statusBtnText:{ color: c.sub, fontSize: rs(11), fontWeight: '600' },
   inputsRow: { flexDirection: 'row', gap: rp(8), marginBottom: rp(8) },
   inputHalf: { flex: 1, backgroundColor: c.bg, borderRadius: 8, padding: rp(10), color: c.text, fontSize: rs(12), borderWidth: 1, borderColor: c.border },
   inputFull: { backgroundColor: c.bg, borderRadius: 8, padding: rp(10), color: c.text, fontSize: rs(12), borderWidth: 1, borderColor: c.border },
   saveWrap: { position: 'absolute', bottom: rp(16), left: rp(16), right: rp(16) },
   saveBtn: { backgroundColor: '#E85D24', borderRadius: 12, padding: rp(16), alignItems: 'center' },
   saveBtnText: { color: '#fff', fontSize: rs(15), fontWeight: '700' },
});