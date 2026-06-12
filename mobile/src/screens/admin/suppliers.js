import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, TouchableOpacity, StyleSheet,
   ActivityIndicator, Alert, TextInput, Modal
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getThemeColors } from '../../utils/theme';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';
import { ScreenHeader } from '../../utils/components';

export default function AdminSuppliers({ goBack }) {
   const { t, lang, theme } = useAuth();
   const c = getThemeColors(theme || 'dark');
   const s = getStyles(c);

   const [suppliers, setSuppliers] = useState([]);
   const [loading, setLoading] = useState(true);
   const [modalVisible, setModalVisible] = useState(false);
   const [form, setForm] = useState({ id: null, name: '', phone: '', email: '', company: '', address: '' });
   const [saving, setSaving] = useState(false);

   function load() {
      setLoading(true);
      getSuppliers()
         .then(res => setSuppliers(res.data || []))
         .catch(() => {})
         .finally(() => setLoading(false));
   }

   useEffect(() => { load(); }, []);

   function openModal(sup = null) {
      if (sup) {
         setForm({ id: sup.id, name: sup.name, phone: sup.phone || '', email: sup.email || '', company: sup.company || '', address: sup.address || '' });
      } else {
         setForm({ id: null, name: '', phone: '', email: '', company: '', address: '' });
      }
      setModalVisible(true);
   }

   async function handleSave() {
      if (!form.name) return Alert.alert('خطأ', 'الاسم مطلوب');
      setSaving(true);
      try {
         if (form.id) {
            await updateSupplier(form.id, form);
         } else {
            await createSupplier(form);
         }
         setModalVisible(false);
         load();
      } catch (e) {
         Alert.alert('خطأ', 'حدث خطأ أثناء الحفظ');
      }
      setSaving(false);
   }

   function handleDelete(id) {
      Alert.alert(
         t.confirmation || 'تأكيد',
         t.deleteConfirm || 'هل أنت متأكد من الحذف؟',
         [
            { text: t.cancel || 'إلغاء', style: 'cancel' },
            { text: t.delete || 'حذف', style: 'destructive', onPress: async () => {
               await deleteSupplier(id).catch(() => {});
               load();
            }}
         ]
      );
   }

   return (
      <View style={s.screen}>
         <ScreenHeader
            title={t.suppliers || 'الموردون'}
            onBack={goBack}
            lang={lang}
            theme={theme}
            c={c}
         />

         {loading ? (
            <View style={s.center}><ActivityIndicator color="#E85D24" /></View>
         ) : (
            <ScrollView contentContainerStyle={{ padding: rp(16), paddingBottom: rp(80) }}>
               {suppliers.length === 0 ? (
                  <Text style={s.empty}>{t.noData || 'لا يوجد موردين'}</Text>
               ) : (
                  suppliers.map(sup => (
                     <View key={sup.id} style={s.card}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                           <View style={s.actions}>
                              <TouchableOpacity onPress={() => openModal(sup)} style={{ padding: 5 }}>
                                 <Text style={{ color: '#4A90E2', fontSize: rs(14) }}>✎</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDelete(sup.id)} style={{ padding: 5 }}>
                                 <Text style={{ color: '#E24B4A', fontSize: rs(14) }}>✕</Text>
                              </TouchableOpacity>
                           </View>
                           <View style={{ flex: 1, alignItems: 'flex-end' }}>
                              <Text style={s.cardTitle}>{sup.name}</Text>
                              {sup.company ? <Text style={s.cardSub}>{sup.company}</Text> : null}
                              {sup.phone ? <Text style={s.cardText}>📞 {sup.phone}</Text> : null}
                              {sup.email ? <Text style={s.cardText}>📧 {sup.email}</Text> : null}
                           </View>
                        </View>
                     </View>
                  ))
               )}
            </ScrollView>
         )}

         <View style={s.fabWrap}>
            <TouchableOpacity style={s.fab} onPress={() => openModal()}>
               <Text style={s.fabText}>+</Text>
            </TouchableOpacity>
         </View>

         {/* Add/Edit Modal */}
         <Modal visible={modalVisible} transparent animationType="slide">
            <View style={s.modalBg}>
               <View style={s.modalBox}>
                  <Text style={s.modalTitle}>{form.id ? (t.edit || 'تعديل') : (t.add || 'إضافة مورد')}</Text>

                  <TextInput style={s.input} placeholder={t.name || 'الاسم'} placeholderTextColor={c.muted} value={form.name} onChangeText={v => setForm({ ...form, name: v })} textAlign="right" />
                  <TextInput style={s.input} placeholder={t.company || 'الشركة'} placeholderTextColor={c.muted} value={form.company} onChangeText={v => setForm({ ...form, company: v })} textAlign="right" />
                  <TextInput style={s.input} placeholder={t.phone || 'رقم الهاتف'} placeholderTextColor={c.muted} value={form.phone} onChangeText={v => setForm({ ...form, phone: v })} textAlign="right" keyboardType="phone-pad" />
                  <TextInput style={s.input} placeholder={t.email || 'البريد الإلكتروني'} placeholderTextColor={c.muted} value={form.email} onChangeText={v => setForm({ ...form, email: v })} textAlign="right" keyboardType="email-address" />
                  <TextInput style={s.input} placeholder={t.address || 'العنوان'} placeholderTextColor={c.muted} value={form.address} onChangeText={v => setForm({ ...form, address: v })} textAlign="right" />

                  <View style={{ flexDirection: 'row', gap: rp(10), marginTop: rp(10) }}>
                     <TouchableOpacity style={[s.modalBtn, { backgroundColor: c.border }]} onPress={() => setModalVisible(false)}>
                        <Text style={[s.modalBtnText, { color: c.text }]}>{t.cancel || 'إلغاء'}</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={[s.modalBtn, { backgroundColor: '#E85D24' }]} onPress={handleSave} disabled={saving}>
                        <Text style={s.modalBtnText}>{saving ? '...' : (t.save || 'حفظ')}</Text>
                     </TouchableOpacity>
                  </View>
               </View>
            </View>
         </Modal>
      </View>
   );
}

const getStyles = (c) => StyleSheet.create({
   screen: { flex: 1, backgroundColor: c.bg },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   empty: { color: c.muted, textAlign: 'center', padding: rp(20), fontSize: rs(13) },
   card: { backgroundColor: c.card, borderRadius: 12, padding: rp(14), marginBottom: rp(12), borderWidth: 1, borderColor: c.border },
   cardTitle: { color: c.text, fontSize: rs(16), fontWeight: '700', marginBottom: 2 },
   cardSub: { color: c.sub, fontSize: rs(12), marginBottom: 8 },
   cardText: { color: c.text, fontSize: rs(12), marginTop: 4 },
   actions: { flexDirection: 'row', gap: 10 },
   fabWrap: { position: 'absolute', bottom: rp(20), left: rp(20) },
   fab: { width: rp(56), height: rp(56), borderRadius: rp(28), backgroundColor: '#E85D24', justifyContent: 'center', alignItems: 'center', elevation: 4 },
   fabText: { color: '#fff', fontSize: rs(30), fontWeight: '300', marginTop: -4 },
   
   modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: rp(20) },
   modalBox: { backgroundColor: c.card, borderRadius: 16, padding: rp(20), borderWidth: 1, borderColor: c.border },
   modalTitle: { color: c.text, fontSize: rs(18), fontWeight: '700', textAlign: 'right', marginBottom: rp(16) },
   input: { backgroundColor: c.bg, color: c.text, borderRadius: 8, padding: rp(12), borderWidth: 1, borderColor: c.border, marginBottom: rp(10), fontSize: rs(13) },
   modalBtn: { flex: 1, padding: rp(14), borderRadius: 8, alignItems: 'center' },
   modalBtnText: { color: '#fff', fontSize: rs(14), fontWeight: '700' },
});
