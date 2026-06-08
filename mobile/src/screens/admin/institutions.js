import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, TouchableOpacity, StyleSheet,
   StatusBar, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getThemeColors } from '../../utils/theme';
import { getInstitutions, createInstitution, updateInstitution, deleteInstitution } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';
import { ScreenHeader } from '../../utils/components';

export default function AdminInstitutions({ goBack }) {
   const { t, lang, theme } = useAuth();
   const c = getThemeColors(theme || 'dark');
   const s = getStyles(c);
   const [list, setList] = useState([]);
   const [loading, setLoading] = useState(true);
   const [form, setForm] = useState({ name: '', contact_person: '', phone: '', address: '', tax_number: '' });
   const [editing, setEditing] = useState(null);
   const [showForm,setShowForm]= useState(false);

   function load() {
      getInstitutions().then(r => setList(r.data || [])).catch(() => {}).finally(() => setLoading(false));
   }
   useEffect(() => { load(); }, []);

   function openNew() {
      setForm({ name: '', contact_person: '', phone: '', address: '', tax_number: '' });
      setEditing(null);
      setShowForm(true);
   }

   function openEdit(inst) {
      setForm({ name: inst.name, contact_person: inst.contact_person || '', phone: inst.phone || '', address: inst.address || '', tax_number: inst.tax_number || '' });
      setEditing(inst.id);
      setShowForm(true);
   }

   async function handleSave() {
      if (!form.name.trim()) { Alert.alert(t.errorTitle, t.fillRequired); return; }
      if (editing) {
         await updateInstitution(editing, form).catch(() => {});
      } else {
         await createInstitution(form).catch(() => {});
      }
      setShowForm(false);
      load();
   }

   async function handleDelete(id) {
      Alert.alert(t.confirmation, t.deleteInstitutionConfirm, [
         { text: t.cancel, style: 'cancel' },
         { text: t.delete, style: 'destructive', onPress: async () => {
            await deleteInstitution(id).catch(() => {});
            load();
         }},
      ]);
   }

   function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

   return (
      <View style={s.screen}>
         <ScreenHeader
            title={t.institutions}
            onBack={showForm ? () => setShowForm(false) : goBack}
            lang={lang}
            theme={theme}
            c={c}
            rightElement={!showForm ? (
               <TouchableOpacity style={s.addBtn} onPress={openNew}>
                  <Text style={s.addBtnText}>+ {t.add}</Text>
               </TouchableOpacity>
            ) : null}
         />

         {showForm ? (
            <ScrollView contentContainerStyle={{ padding: rp(16) }}>
               <Text style={s.formTitle}>{editing ? t.editInstitution : t.addInstitution}</Text>

               {[
                  { key: 'name', label: `${t.name} *`, placeholder: t.institution },
                  { key: 'contact_person', label: t.name, placeholder: t.name },
                  { key: 'phone', label: t.phone, placeholder: '0x xx xx xx xx' },
                  { key: 'address', label: t.address, placeholder: t.address },
                  { key: 'tax_number', label: t.taxNumber, placeholder: 'NIF / NIS' },
               ].map(field => (
                  <View key={field.key} style={s.formGroup}>
                     <Text style={s.label}>{field.label}</Text>
                     <TextInput
                        style={s.input}
                        value={form[field.key]}
                        onChangeText={v => set(field.key, v)}
                        placeholder={field.placeholder}
                        placeholderTextColor={c.muted}
                        textAlign={lang === 'fr' ? 'left' : 'right'}
                     />
                  </View>
               ))}

               <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
                  <Text style={s.saveBtnText}>✓ {t.save}</Text>
               </TouchableOpacity>
            </ScrollView>
         ) : loading ? (
            <View style={s.center}><ActivityIndicator color="#E85D24" /></View>
         ) : (
            <ScrollView contentContainerStyle={{ padding: rp(14), paddingBottom: rp(30) }}>
               {list.length === 0 ? (
                  <View style={s.emptyWrap}>
                     <Text style={{ fontSize: rs(40), marginBottom: rp(10) }}></Text>
                     <Text style={s.emptyText}>{t.noInstitutions}</Text>
                  </View>
               ) : list.map(inst => (
                  <View key={inst.id} style={s.card}>
                     <View style={s.cardTop}>
                        <Text style={s.instName}>{inst.name}</Text>
                     </View>
                     {inst.contact_person && <Text style={s.infoText}> {inst.contact_person}</Text>}
                     {inst.phone && <Text style={s.infoText}> {inst.phone}</Text>}
                     {inst.address && <Text style={s.infoText}> {inst.address}</Text>}
                     {inst.tax_number && <Text style={s.infoText}> {inst.tax_number}</Text>}
                     <View style={s.cardActions}>
                        <TouchableOpacity style={s.editBtn} onPress={() => openEdit(inst)}>
                           <Text style={s.editBtnText}>{t.edit}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(inst.id)}>
                           <Text style={s.deleteBtnText}>{t.delete}</Text>
                        </TouchableOpacity>
                     </View>
                  </View>
               ))}
            </ScrollView>
         )}
      </View>
   );
}

const getStyles = (c) => StyleSheet.create({
   screen: { flex: 1, backgroundColor: c.bg },
   safeTop: { height: STATUS_BAR_HEIGHT, backgroundColor: c.card },
   header: { backgroundColor: c.card, padding: rp(14), flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: c.border },
   back: { color: '#E85D24', fontSize: rs(16), fontWeight: '600' },
   title: { color: c.text, fontSize: rs(16), fontWeight: '700', flex: 1, textAlign: 'right', marginHorizontal: rp(10) },
   addBtn: { backgroundColor: 'rgba(232,93,36,0.15)', paddingHorizontal: rp(12), paddingVertical: rp(7), borderRadius: 8, borderWidth: 1, borderColor: 'rgba(232,93,36,0.3)' },
   addBtnText: { color: '#E85D24', fontSize: rs(12), fontWeight: '700' },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   emptyWrap: { alignItems: 'center', paddingTop: rp(60) },
   emptyText: { color: c.sub, fontSize: rs(14) },
   card: { backgroundColor: c.card, borderRadius: 12, padding: rp(14), marginBottom: rp(10), borderWidth: 1, borderColor: c.border },
   cardTop: { marginBottom: rp(8) },
   instName: { color: c.text, fontSize: rs(15), fontWeight: '700', textAlign: 'right' },
   infoText: { color: c.sub, fontSize: rs(12), textAlign: 'right', marginBottom: rp(3) },
   cardActions: { flexDirection: 'row', gap: rp(8), marginTop: rp(10) },
   editBtn: { flex: 1, backgroundColor: 'rgba(74,144,226,0.15)', padding: rp(10), borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(74,144,226,0.3)' },
   editBtnText: { color: '#4A90E2', fontSize: rs(12), fontWeight: '600' },
   deleteBtn: { flex: 1, backgroundColor: 'rgba(226,75,74,0.15)', padding: rp(10), borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(226,75,74,0.3)' },
   deleteBtnText:{ color: '#E24B4A', fontSize: rs(12), fontWeight: '600' },
   formTitle: { color: c.text, fontSize: rs(17), fontWeight: '700', textAlign: 'right', marginBottom: rp(20) },
   formGroup: { marginBottom: rp(14) },
   label: { color: c.sub, fontSize: rs(12), textAlign: 'right', marginBottom: rp(6) },
   input: { backgroundColor: c.card, borderRadius: 10, padding: rp(12), color: c.text, fontSize: rs(13), borderWidth: 1, borderColor: c.border },
   saveBtn: { backgroundColor: '#E85D24', borderRadius: 12, padding: rp(15), alignItems: 'center', marginTop: rp(10) },
   saveBtnText: { color: '#fff', fontSize: rs(15), fontWeight: '700' },
});