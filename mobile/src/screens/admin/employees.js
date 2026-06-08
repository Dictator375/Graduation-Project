import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, TouchableOpacity, StyleSheet,
   StatusBar, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getThemeColors } from '../../utils/theme';
import { getEmployees, getTeams, updateEmployee, deleteEmployee } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';
import { ScreenHeader } from '../../utils/components';

export default function AdminEmployees({ goBack }) {
   const { t, user, lang, theme } = useAuth();
   const c = getThemeColors(theme || 'dark');
   const s = getStyles(c);
   const ROLE_COLOR = { manager: '#E85D24', team_leader: '#4A90E2', worker: c.sub };
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
      Alert.alert(t.confirmation, t.deactivateConfirm, [
         { text: t.cancel, style: 'cancel' },
         { text: t.deactivate, style: 'destructive', onPress: async () => {
            await deleteEmployee(id);
            load();
         }},
      ]);
   }

   return (
      <View style={s.screen}>
         <ScreenHeader
            title={t.employees}
            onBack={goBack}
            lang={lang}
            theme={theme}
            c={c}
         />

         <View style={{ padding: rp(12) }}>
            <TextInput
               style={s.search}
               value={search}
               onChangeText={setSearch}
               placeholder={t.searchPlaceholder}
               placeholderTextColor={c.muted}
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
                                 <Text style={s.empName}>{lang === 'fr' ? (emp.full_name_fr || emp.full_name) : (emp.full_name_ar || emp.full_name)}</Text>
                                 <Text style={s.empSub}>@{emp.username} · {lang === 'fr' ? (team?.name_fr || team?.name_ar || '—') : (team?.name_ar || '—')}</Text>
                              </View>
                           </View>
                           <View style={s.cardRow}>
                              <Text style={s.infoText}> {emp.phone || '—'}</Text>
                              {user?.role === 'manager' && (
                                 <Text style={s.infoText}> {emp.salary ? `${Number(emp.salary).toLocaleString()} ${t.currency || 'دج'}` : '—'}</Text>
                              )}
                           </View>
                           <View style={s.cardActions}>
                              <View style={[s.statusBadge, { backgroundColor: emp.is_active ? 'rgba(29,158,117,.15)' : 'rgba(226,75,74,.15)' }]}>
                                 <Text style={{ color: emp.is_active ? '#1D9E75' : '#E24B4A', fontSize: rs(11) }}>
                                    {emp.is_active ? t.active : t.inactive}
                                 </Text>
                              </View>
                              {emp.is_active && user?.role === 'manager' && (
                                 <TouchableOpacity style={s.deactivateBtn} onPress={() => handleDeactivate(emp.id)}>
                                    <Text style={s.deactivateText}>{t.deactivate}</Text>
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

const getStyles = (c) => StyleSheet.create({
   screen: { flex: 1, backgroundColor: c.bg },
   safeTop: { height: STATUS_BAR_HEIGHT, backgroundColor: c.card },
   header: { backgroundColor: c.card, padding: rp(14), flexDirection: 'row', alignItems: 'center', gap: rp(12), borderBottomWidth: 1, borderBottomColor: c.border },
   back: { color: '#E85D24', fontSize: rs(16), fontWeight: '600' },
   title: { color: c.text, fontSize: rs(16), fontWeight: '700', flex: 1, textAlign: 'right' },
   search: { backgroundColor: c.card, borderRadius: 10, padding: rp(10), color: c.text, fontSize: rs(13), borderWidth: 1, borderColor: c.border },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   card: { backgroundColor: c.card, borderRadius: 12, padding: rp(14), marginBottom: rp(10), borderWidth: 1, borderColor: c.border },
   cardTop: { flexDirection: 'row', alignItems: 'center', gap: rp(10), marginBottom: rp(8) },
   badge: { padding: rp(4), borderRadius: 6, marginLeft: rp(6) },
   badgeText: { fontSize: rs(10), fontWeight: '700' },
   empName: { color: c.text, fontSize: rs(14), fontWeight: '600', textAlign: 'right' },
   empSub: { color: c.sub, fontSize: rs(11), textAlign: 'right', marginTop: 2 },
   cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rp(10) },
   infoText: { color: c.sub, fontSize: rs(12) },
   cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
   statusBadge: { paddingHorizontal: rp(10), paddingVertical: rp(4), borderRadius: 10 },
   deactivateBtn: { backgroundColor: 'rgba(226,75,74,0.15)', paddingHorizontal: rp(12), paddingVertical: rp(6), borderRadius: 8 },
   deactivateText: { color: '#E24B4A', fontSize: rs(12), fontWeight: '600' },
});