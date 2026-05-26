import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, TouchableOpacity, StyleSheet,
   StatusBar, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getEmployees, getTeams, updateEmployee, deleteEmployee } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';

const ROLE_COLOR = { manager: '#E85D24', team_leader: '#4A90E2', worker: '#8b92a9' };

export default function AdminEmployees({ goBack }) {
   const { t } = useAuth();
   const [employees, setEmployees] = useState([]);
   const [teams, setTeams] = useState([]);
   const [search, setSearch] = useState('');
   const [loading, setLoading] = useState(true);
   const [editing, setEditing] = useState(null);

   function load() {
      Promise.all([getEmployees(), getTeams()])
         .then(([e, tm]) => { setEmployees(e.data || []); setTeams(tm.data || []); })
         .catch(() => {})
         .finally(() => setLoading(false));
   }
   useEffect(() => { load(); }, []);

   const filtered = employees.filter(e =>
      (e.full_name_ar || '').includes(search) ||
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.username.includes(search)
   );

   async function handleDeactivate(id) {
      Alert.alert('تأكيد', 'هل تريد تعطيل هذا الموظف؟', [
         { text: 'إلغاء', style: 'cancel' },
         { text: 'تعطيل', style: 'destructive', onPress: async () => {
            await deleteEmployee(id);
            load();
         }},
      ]);
   }

   return (
      <View style={s.screen}>
         <StatusBar backgroundColor="#1c2133" barStyle="light-content" />
         <View style={s.safeTop} />
         <View style={s.header}>
            <TouchableOpacity onPress={goBack}><Text style={s.back}>‹ رجوع</Text></TouchableOpacity>
            <Text style={s.title}>{t.employees}</Text>
         </View>

         <View style={{ padding: rp(12) }}>
            <TextInput
               style={s.search}
               value={search}
               onChangeText={setSearch}
               placeholder="بحث..."
               placeholderTextColor="#555e7a"
               textAlign="right"
            />
         </View>

         {loading
            ? <View style={s.center}><ActivityIndicator color="#E85D24" /></View>
            : (
               <ScrollView contentContainerStyle={{ padding: rp(12), paddingTop: 0 }}>
                  {filtered.map(emp => {
                     const team = teams.find(tm => tm.id === emp.team_id);
                     return (
                        <View key={emp.id} style={s.card}>
                           <View style={s.cardTop}>
                              <View style={[s.badge, { backgroundColor: ROLE_COLOR[emp.role] + '22' }]}>
                                 <Text style={[s.badgeText, { color: ROLE_COLOR[emp.role] }]}>{t[emp.role] || emp.role}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                 <Text style={s.empName}>{emp.full_name_ar || emp.full_name}</Text>
                                 <Text style={s.empSub}>@{emp.username} · {team?.name_ar || '—'}</Text>
                              </View>
                           </View>
                           <View style={s.cardRow}>
                              <Text style={s.infoText}> {emp.phone || '—'}</Text>
                              <Text style={s.infoText}> {emp.salary ? `${Number(emp.salary).toLocaleString()} دج` : '—'}</Text>
                           </View>
                           <View style={s.cardActions}>
                              <View style={[s.statusBadge, { backgroundColor: emp.is_active ? 'rgba(29,158,117,.15)' : 'rgba(226,75,74,.15)' }]}>
                                 <Text style={{ color: emp.is_active ? '#1D9E75' : '#E24B4A', fontSize: rs(11) }}>
                                    {emp.is_active ? t.active : t.inactive}
                                 </Text>
                              </View>
                              {emp.is_active && emp.role !== 'manager' && (
                                 <TouchableOpacity style={s.deactivateBtn} onPress={() => handleDeactivate(emp.id)}>
                                    <Text style={s.deactivateText}>تعطيل</Text>
                                 </TouchableOpacity>
                              )}
                           </View>
                        </View>
                     );
                  })}
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
   search: { backgroundColor: '#1c2133', borderRadius: 10, padding: rp(10), color: '#eef0f6', fontSize: rs(13), borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   card: { backgroundColor: '#1c2133', borderRadius: 12, padding: rp(14), marginBottom: rp(10), borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
   cardTop: { flexDirection: 'row', alignItems: 'center', gap: rp(10), marginBottom: rp(8) },
   badge: { padding: rp(4), borderRadius: 6, marginLeft: rp(6) },
   badgeText: { fontSize: rs(10), fontWeight: '700' },
   empName: { color: '#eef0f6', fontSize: rs(14), fontWeight: '600', textAlign: 'right' },
   empSub: { color: '#8b92a9', fontSize: rs(11), textAlign: 'right', marginTop: 2 },
   cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rp(10) },
   infoText: { color: '#8b92a9', fontSize: rs(12) },
   cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
   statusBadge: { paddingHorizontal: rp(10), paddingVertical: rp(4), borderRadius: 10 },
   deactivateBtn: { backgroundColor: 'rgba(226,75,74,0.15)', paddingHorizontal: rp(12), paddingVertical: rp(6), borderRadius: 8 },
   deactivateText: { color: '#E24B4A', fontSize: rs(12), fontWeight: '600' },
});