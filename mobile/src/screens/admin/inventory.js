import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, TouchableOpacity, StyleSheet,
   StatusBar, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getInventory, refillInventory, updateFuelPrice } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';

function fmt(n) { return Number(n || 0).toLocaleString('ar-DZ'); }

export default function AdminInventory({ goBack }) {
   const { t } = useAuth();
   const [inventory, setInventory] = useState([]);
   const [loading, setLoading] = useState(true);
   const [refillForm, setRefillForm] = useState({ fuel_type_id: '', quantity_liters: '', cost_per_liter: '', supplier: '' });
   const [priceEdit, setPriceEdit] = useState({});
   const [saving, setSaving] = useState(false);

   function load() {
      getInventory().then(r => setInventory(r.data || [])).catch(() => {}).finally(() => setLoading(false));
   }
   useEffect(() => { load(); }, []);

   async function handleRefill() {
      if (!refillForm.fuel_type_id || !refillForm.quantity_liters) {
         Alert.alert('خطأ', 'اختر نوع الوقود وأدخل الكميّة');
         return;
      }
      setSaving(true);
      await refillInventory(refillForm).catch(() => {});
      setRefillForm({ fuel_type_id: '', quantity_liters: '', cost_per_liter: '', supplier: '' });
      setSaving(false);
      Alert.alert('✓', 'تم تحديث المخزون');
      load();
   }

   async function handlePriceUpdate(id) {
      const price = priceEdit[id];
      if (!price) return;
      await updateFuelPrice(id, parseFloat(price)).catch(() => {});
      setPriceEdit(p => ({ ...p, [id]: '' }));
      load();
      Alert.alert('✓', 'تم تحديث السعر');
   }

   return (
      <View style={s.screen}>
         <StatusBar backgroundColor="#1c2133" barStyle="light-content" />
         <View style={s.safeTop} />
         <View style={s.header}>
            <TouchableOpacity onPress={goBack}><Text style={s.back}>‹ رجوع</Text></TouchableOpacity>
            <Text style={s.title}>{t.inventory}</Text>
         </View>

         {loading
            ? <View style={s.center}><ActivityIndicator color="#E85D24" /></View>
            : (
               <ScrollView contentContainerStyle={{ padding: rp(14), paddingBottom: rp(40) }}>

                  {/* Tank levels */}
                  <Text style={s.section}>مستويات الخزانات</Text>
                  {inventory.map(inv => {
                     const pct = Math.min(100, Math.round((inv.quantity_liters / 30000) * 100));
                     const col = pct < 20 ? '#E24B4A' : pct < 40 ? '#BA7517' : '#1D9E75';
                     return (
                        <View key={inv.id} style={s.card}>
                           <View style={s.cardTop}>
                              <View style={[s.statusDot, { backgroundColor: col }]} />
                              <Text style={s.fuelName}>{inv.name_ar}</Text>
                              <Text style={[s.pctText, { color: col }]}>{pct}%</Text>
                           </View>
                           <View style={s.barTrack}>
                              <View style={[s.barFill, { width: `${pct}%`, backgroundColor: col }]} />
                           </View>
                           <View style={s.cardBottom}>
                              <Text style={s.infoSmall}>{fmt(inv.quantity_liters)} L متبقية</Text>
                              <Text style={s.infoSmall}>{inv.price_per_liter} دج/L</Text>
                           </View>

                           {/* Price update */}
                           <View style={s.priceRow}>
                              <TextInput
                                 style={s.priceInput}
                                 value={priceEdit[inv.id] || ''}
                                 onChangeText={v => setPriceEdit(p => ({ ...p, [inv.id]: v }))}
                                 placeholder="سعر جديد (دج/L)"
                                 placeholderTextColor="#555e7a"
                                 keyboardType="decimal-pad"
                                 textAlign="right"
                              />
                              <TouchableOpacity style={s.priceBtn} onPress={() => handlePriceUpdate(inv.id)}>
                                 <Text style={s.priceBtnText}>تحديث</Text>
                              </TouchableOpacity>
                           </View>
                        </View>
                     );
                  })}

                  {/* Refill form */}
                  <Text style={s.section}>{t.refillNow}</Text>
                  <View style={s.card}>
                     <Text style={s.label}>نوع الوقود</Text>
                     <View style={s.fuelGrid}>
                        {inventory.map(inv => (
                           <TouchableOpacity key={inv.id}
                              style={[s.fuelBtn, refillForm.fuel_type_id == inv.id && s.fuelBtnActive]}
                              onPress={() => setRefillForm(f => ({ ...f, fuel_type_id: inv.id }))}>
                              <Text style={[s.fuelBtnText, refillForm.fuel_type_id == inv.id && { color: '#fff' }]}>{inv.name_ar}</Text>
                           </TouchableOpacity>
                        ))}
                     </View>

                     <Text style={s.label}>الكميّة (لتر)</Text>
                     <TextInput style={s.input} value={refillForm.quantity_liters}
                        onChangeText={v => setRefillForm(f => ({ ...f, quantity_liters: v }))}
                        placeholder="عدد اللترات" placeholderTextColor="#555e7a"
                        keyboardType="numeric" textAlign="right" />

                     <Text style={s.label}>سعر الشراء (دج/L) — اختياري</Text>
                     <TextInput style={s.input} value={refillForm.cost_per_liter}
                        onChangeText={v => setRefillForm(f => ({ ...f, cost_per_liter: v }))}
                        placeholder="0.00" placeholderTextColor="#555e7a"
                        keyboardType="decimal-pad" textAlign="right" />

                     <Text style={s.label}>المورّد — اختياري</Text>
                     <TextInput style={s.input} value={refillForm.supplier}
                        onChangeText={v => setRefillForm(f => ({ ...f, supplier: v }))}
                        placeholder="اسم المورّد" placeholderTextColor="#555e7a" textAlign="right" />

                     <TouchableOpacity style={s.refillBtn} onPress={handleRefill} disabled={saving}>
                        <Text style={s.refillBtnText}>{saving ? 'جاري الحفظ...' : ' تسجيل الملء'}</Text>
                     </TouchableOpacity>
                  </View>
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
   card: { backgroundColor: '#1c2133', borderRadius: 12, padding: rp(14), marginBottom: rp(14), borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
   cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: rp(8), gap: rp(8) },
   statusDot: { width: rp(10), height: rp(10), borderRadius: rp(5) },
   fuelName: { color: '#eef0f6', fontSize: rs(14), fontWeight: '600', flex: 1, textAlign: 'right' },
   pctText: { fontSize: rs(14), fontWeight: '700' },
   barTrack: { height: 8, backgroundColor: '#0f1117', borderRadius: 4, overflow: 'hidden', marginBottom: rp(6) },
   barFill: { height: '100%', borderRadius: 4 },
   cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rp(10) },
   infoSmall: { color: '#8b92a9', fontSize: rs(11) },
   priceRow: { flexDirection: 'row', gap: rp(8) },
   priceInput: { flex: 1, backgroundColor: '#0f1117', borderRadius: 8, padding: rp(8), color: '#eef0f6', fontSize: rs(13), borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
   priceBtn: { backgroundColor: '#E85D24', borderRadius: 8, paddingHorizontal: rp(14), justifyContent: 'center' },
   priceBtnText:{ color: '#fff', fontSize: rs(12), fontWeight: '700' },
   label: { color: '#8b92a9', fontSize: rs(12), textAlign: 'right', marginBottom: rp(6), marginTop: rp(10) },
   fuelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rp(8) },
   fuelBtn: { flex: 1, minWidth: '40%', backgroundColor: '#0f1117', borderRadius: 8, padding: rp(10), alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
   fuelBtnActive:{ backgroundColor: '#E85D24', borderColor: '#E85D24' },
   fuelBtnText: { color: '#eef0f6', fontSize: rs(12), fontWeight: '500' },
   input: { backgroundColor: '#0f1117', borderRadius: 8, padding: rp(10), color: '#eef0f6', fontSize: rs(13), borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
   refillBtn: { backgroundColor: '#E85D24', borderRadius: 10, padding: rp(14), alignItems: 'center', marginTop: rp(14) },
   refillBtnText:{ color: '#fff', fontSize: rs(14), fontWeight: '700' },
});