import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, TouchableOpacity, StyleSheet,
   StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getEmployees, getAttendance, saveAttendance } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';

const STATUS_OPTIONS = [
   { value: 'present', label: 'حاضر', color: '#1D9E75' },
   { value: 'absent', label: 'غائب', color: '#E24B4A' },
   { value: 'late', label: 'متأخر', color: '#BA7517' },
   { value: 'excused', label: 'مبرر', color: '#4A90E2' },
];

export default function AdminAttendance({ goBack }) {
   const { t } = useAuth();
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
         (att.data || []).forEach(a => { map[a.user_id] = a.status; });
         setAttendance(map);
      }).catch(() => {}).finally(() => setLoading(false));
   }

   useEffect(() => { loadData(date); }, [date]);

   function changeDate(dir) {
      const d = new Date(date);
      d.setDate(d.getDate() + dir);
      setDate(d.toISOString().split('T')[0]);
   }

   function setStatus(userId, status) {
      setAttendance(prev => ({ ...prev, [userId]: status }));
   }

   async function handleSave() {
      setSaving(true);
      const records = employees.map(emp => ({
         user_id: emp.id, date, status: attendance[emp.id] || 'absent',
      }));
      await saveAttendance(records).catch(() => {});
      setSaving(false);
      Alert.alert('✓', 'تم حفظ الحضور');
   }

   const counts = { present: 0, absent: 0, late: 0, excused: 0 };
   employees.forEach(e => { const s = attendance[e.id] || 'absent'; counts[s]++; });

   return (
      <View style={s.screen}>
         <StatusBar backgroundColor="#1c2133" barStyle="light-content" />
         <View style={s.safeTop} />
         <View style={s.header}>
            <TouchableOpacity onPress={goBack}><Text style={s.back}>‹ رجوع</Text></TouchableOpacity>
            <Text style={s.title}>{t.attendance}</Text>
         </View>

         {/* Date navigator */}
         <View style={s.dateBar}>
            <TouchableOpacity style={s.dateBtn} onPress={() => changeDate(1)}><Text style={s.dateBtnText}>›</Text></TouchableOpacity>
            <Text style={s.dateText}>{new Date(date).toLocaleDateString('ar-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
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
                     const status = attendance[emp.id] || 'absent';
                     const statusOpt = STATUS_OPTIONS.find(o => o.value === status);
                     return (
                        <View key={emp.id} style={s.empCard}>
                           <Text style={s.empName}>{emp.full_name_ar || emp.full_name}</Text>
                           <View style={s.statusRow}>
                              {STATUS_OPTIONS.map(opt => (
                                 <TouchableOpacity
                                    key={opt.value}
                                    style={[s.statusBtn, status === opt.value && { backgroundColor: opt.color }]}
                                    onPress={() => setStatus(emp.id, opt.value)}
                                 >
                                    <Text style={[s.statusBtnText, status === opt.value && { color: '#fff' }]}>
                                       {opt.label}
                                    </Text>
                                 </TouchableOpacity>
                              ))}
                           </View>
                        </View>
                     );
                  })}
               </ScrollView>
            )
         }

         {/* Save button */}
         <View style={s.saveWrap}>
            <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
               <Text style={s.saveBtnText}>{saving ? 'جاري الحفظ...' : '✓ حفظ الحضور'}</Text>
            </TouchableOpacity>
         </View>
      </View>
   );
}

const s = StyleSheet.create({
   screen: { flex: 1, backgroundColor: '#0f1117' },
   safeTop: { height: STATUS_BAR_HEIGHT, backgroundColor: '#1c2133' },
   header: { backgroundColor: '#1c2133', padding: rp(14), flexDirection: 'row', alignItems: 'center', gap: rp(12), borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
   back: { color: '#E85D24', fontSize: rs(16), fontWeight: '600' },
   title: { color: '#eef0f6', fontSize: rs(16), fontWeight: '700', flex: 1, textAlign: 'right' },
   dateBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: rp(12), backgroundColor: '#1c2133', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
   dateBtn: { padding: rp(8) },
   dateBtnText: { color: '#E85D24', fontSize: rs(20), fontWeight: '700' },
   dateText: { color: '#eef0f6', fontSize: rs(13), fontWeight: '500', textAlign: 'center', flex: 1 },
   summary: { flexDirection: 'row', backgroundColor: '#171b25', padding: rp(10) },
   summaryItem: { flex: 1, alignItems: 'center' },
   summaryCount: { fontSize: rs(20), fontWeight: '700' },
   summaryLabel: { color: '#8b92a9', fontSize: rs(10), marginTop: 2 },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   empCard: { backgroundColor: '#1c2133', borderRadius: 12, padding: rp(14), marginBottom: rp(10), borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
   empName: { color: '#eef0f6', fontSize: rs(14), fontWeight: '600', textAlign: 'right', marginBottom: rp(10) },
   statusRow: { flexDirection: 'row', gap: rp(6) },
   statusBtn: { flex: 1, padding: rp(8), borderRadius: 8, alignItems: 'center', backgroundColor: '#171b25', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
   statusBtnText:{ color: '#8b92a9', fontSize: rs(11), fontWeight: '600' },
   saveWrap: { position: 'absolute', bottom: rp(16), left: rp(16), right: rp(16) },
   saveBtn: { backgroundColor: '#E85D24', borderRadius: 12, padding: rp(16), alignItems: 'center' },
   saveBtnText: { color: '#fff', fontSize: rs(15), fontWeight: '700' },
});