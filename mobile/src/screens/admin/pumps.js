import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, TouchableOpacity, StyleSheet,
   StatusBar, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getThemeColors } from '../../utils/theme';
import { getPumps, createPump, updatePump } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';
import { ScreenHeader } from '../../utils/components';

export default function AdminPumps({ navigate, goBack }) {
   const { t, lang, theme } = useAuth();
   const c = getThemeColors(theme || 'dark');
   const s = getStyles(c);
   const [pumps, setPumps] = useState([]);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [editMode, setEditMode] = useState(false);
   
   const [form, setForm] = useState({ pump_number: '', uid: '', service_start_date: '', status: 'in_service', last_maintenance_date: '', maintenance_log: '', fault_log: '' });
   const [editId, setEditId] = useState(null);

   function load() {
      getPumps().then(r => setPumps(r.data || [])).catch(() => {}).finally(() => setLoading(false));
   }
   useEffect(() => { load(); }, []);

   async function handleSave() {
      if (!form.pump_number) {
         Alert.alert(t.alert, t.enterPumpNumber);
         return;
      }
      setSaving(true);
      try {
         if (editMode) {
            await updatePump(editId, form);
            Alert.alert(t.successTitle, t.pumpUpdated);
         } else {
            if (pumps.length >= 12) {
               Alert.alert(t.errorTitle, t.maxPumps);
               setSaving(false);
               return;
            }
            await createPump(form);
            Alert.alert(t.successTitle, t.pumpAdded);
         }
         setForm({ pump_number: '', uid: '', service_start_date: '', status: 'in_service', last_maintenance_date: '', maintenance_log: '', fault_log: '' });
         setEditMode(false);
         setEditId(null);
         load();
      } catch (err) {
         Alert.alert(t.errorTitle, err.response?.data?.error || t.error);
      }
      setSaving(false);
   }

   function startEdit(p) {
      setEditMode(true);
      setEditId(p.id);
      setForm({
         pump_number: p.pump_number.toString(), uid: p.uid || '',
         service_start_date: p.service_start_date || '', status: p.status || 'in_service',
         last_maintenance_date: p.last_maintenance_date || '', maintenance_log: p.maintenance_log || '',
         fault_log: p.fault_log || ''
      });
   }

   function cancelEdit() {
      setEditMode(false);
      setEditId(null);
      setForm({ pump_number: '', uid: '', service_start_date: '', status: 'in_service', last_maintenance_date: '', maintenance_log: '', fault_log: '' });
   }

   return (
      <View style={s.screen}>
         <ScreenHeader
            title={t.pumps}
            onBack={goBack}
            lang={lang}
            theme={theme}
            c={c}
         />

         {loading
            ? <View style={s.center}><ActivityIndicator color="#E85D24" /></View>
            : (
               <ScrollView contentContainerStyle={{ padding: rp(14), paddingBottom: rp(40) }}>
                  
                  {/* Form */}
                  <Text style={s.section}>{editMode ? t.pumpEdit : t.pumpAdd}</Text>
                  <View style={s.card}>
                     <Text style={s.label}>{t.pumpNumber}</Text>
                     <TextInput style={s.input} value={form.pump_number} onChangeText={v=>setForm({...form, pump_number: v})}
                        placeholder="1, 2, 3..." placeholderTextColor={c.muted} keyboardType="numeric" textAlign="right" editable={!editMode} />
                     
                     <Text style={s.label}>UID</Text>
                     <TextInput style={s.input} value={form.uid} onChangeText={v=>setForm({...form, uid: v})}
                        placeholder="..." placeholderTextColor={c.muted} textAlign="right" editable={!editMode} />
                     
                     <Text style={s.label}>{t.serviceStartDate}</Text>
                     <TextInput style={s.input} value={form.service_start_date} onChangeText={v=>setForm({...form, service_start_date: v})}
                        placeholder="YYYY-MM-DD" placeholderTextColor={c.muted} textAlign="right" editable={!editMode} />

                     {editMode && (
                        <>
                           <Text style={s.label}>{t.status}</Text>
                           <View style={{flexDirection: 'row', gap: rp(8), marginBottom: rp(10)}}>
                              <TouchableOpacity style={[s.fuelBtn, form.status === 'in_service' && s.fuelBtnActive]} onPress={() => setForm({...form, status: 'in_service'})}>
                                 <Text style={[s.fuelBtnText, form.status === 'in_service' && { color: '#fff' }]}>{t.inService}</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={[s.fuelBtn, form.status === 'out_of_service' && s.fuelBtnActive]} onPress={() => setForm({...form, status: 'out_of_service'})}>
                                 <Text style={[s.fuelBtnText, form.status === 'out_of_service' && { color: '#fff' }]}>{t.outOfService}</Text>
                              </TouchableOpacity>
                           </View>

                           <Text style={s.label}>{t.lastMaintenanceDate}</Text>
                           <TextInput style={s.input} value={form.last_maintenance_date} onChangeText={v=>setForm({...form, last_maintenance_date: v})}
                              placeholder="YYYY-MM-DD" placeholderTextColor={c.muted} textAlign="right" />

                           <Text style={s.label}>{t.maintenanceLog}</Text>
                           <TextInput style={[s.input, {height: 60, backgroundColor: c.card, color: c.sub}]} value={form.maintenance_log} 
                              placeholder="..." placeholderTextColor={c.muted} textAlign="right" multiline editable={false} />

                           <Text style={s.label}>{t.faultLog}</Text>
                           <TextInput style={[s.input, {height: 60, backgroundColor: c.card, color: c.sub}]} value={form.fault_log} 
                              placeholder="..." placeholderTextColor={c.muted} textAlign="right" multiline editable={false} />
                        </>
                     )}

                     <View style={{flexDirection: 'row', gap: rp(10), marginTop: rp(14)}}>
                        {editMode && (
                           <TouchableOpacity style={[s.refillBtn, {backgroundColor: '#333', flex: 1}]} onPress={cancelEdit}>
                              <Text style={s.refillBtnText}>{t.cancel}</Text>
                           </TouchableOpacity>
                        )}
                        <TouchableOpacity style={[s.refillBtn, {flex: 2}]} onPress={handleSave} disabled={saving || (!editMode && pumps.length >= 12)}>
                           <Text style={s.refillBtnText}>{saving ? t.saving : (editMode ? t.update : t.add)}</Text>
                        </TouchableOpacity>
                     </View>
                  </View>

                  {/* List */}
                  <Text style={s.section}>{t.pumps}</Text>
                  {pumps.map(p => {
                     const inService = p.status === 'in_service';
                     const col = inService ? '#1D9E75' : '#E24B4A';
                     return (
                        <View key={p.id} style={s.card}>
                           <View style={s.cardTop}>
                              <View style={[s.statusDot, { backgroundColor: col }]} />
                              <Text style={s.fuelName}>{t.pumpHash}{p.pump_number}</Text>
                              <TouchableOpacity onPress={() => startEdit(p)}>
                                 <Text style={{color: '#E85D24', fontSize: rs(12), fontWeight: '600'}}>{t.edit}</Text>
                              </TouchableOpacity>
                           </View>
                           <View style={s.cardBottom}>
                              <Text style={s.infoSmall}>UID: {p.uid || '—'}</Text>
                              <Text style={[s.infoSmall, {color: col, fontWeight: 'bold'}]}>{inService ? t.inService : t.outOfService}</Text>
                           </View>
                        </View>
                     );
                  })}
                  {pumps.length === 0 && <Text style={{color: c.muted, textAlign: 'center', marginVertical: rp(20)}}>{t.noPumps}</Text>}

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
   section: { color: c.text, fontSize: rs(15), fontWeight: '700', marginBottom: rp(10), marginTop: rp(10), textAlign: 'right' },
   card: { backgroundColor: c.card, borderRadius: 12, padding: rp(14), marginBottom: rp(14), borderWidth: 1, borderColor: c.border },
   cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: rp(8), gap: rp(8) },
   statusDot: { width: rp(10), height: rp(10), borderRadius: rp(5) },
   fuelName: { color: c.text, fontSize: rs(14), fontWeight: '600', flex: 1, textAlign: 'right' },
   cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rp(2) },
   infoSmall: { color: c.sub, fontSize: rs(12) },
   label: { color: c.sub, fontSize: rs(12), textAlign: 'right', marginBottom: rp(6), marginTop: rp(10) },
   fuelBtn: { flex: 1, backgroundColor: c.bg, borderRadius: 8, padding: rp(10), alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
   fuelBtnActive:{ backgroundColor: '#E85D24', borderColor: '#E85D24' },
   fuelBtnText: { color: c.text, fontSize: rs(12), fontWeight: '500' },
   input: { backgroundColor: c.bg, borderRadius: 8, padding: rp(10), color: c.text, fontSize: rs(13), borderWidth: 1, borderColor: c.border },
   refillBtn: { backgroundColor: '#E85D24', borderRadius: 10, padding: rp(14), alignItems: 'center' },
   refillBtnText:{ color: '#fff', fontSize: rs(14), fontWeight: '700' },
});
