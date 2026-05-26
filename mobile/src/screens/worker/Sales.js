import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { createSale, getFuelTypes, getInstitutions } from '../../utils/api';
import { STATUS_BAR_HEIGHT, TAB_BAR_HEIGHT, rs, rp, width } from '../../utils/layout';

const PUMPS    = [1, 2, 3, 4, 5, 6, 7, 8];
const PAYMENTS = [
  { value: 'cash',    label: 'نقداً',  icon: '💵' },
  { value: 'card',    label: 'بطاقة', icon: '💳' },
  { value: 'loyalty', label: 'نقاط',  icon: '⭐' },
  { value: 'credit',  label: 'دين',   icon: '🏢' },
];

export default function WorkerSales({ navigate }) {
  const { t } = useAuth();
  const [fuelTypes,    setFuelTypes]    = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [form, setForm] = useState({ fuel_type_id: '', quantity_liters: '', payment_method: 'cash', pump_number: '', institution_id: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    getFuelTypes().then(r => setFuelTypes(r.data || [])).catch(() => {});
    getInstitutions().then(r => setInstitutions(r.data || [])).catch(() => {});
  }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  const selFuel   = fuelTypes.find(f => f.id === parseInt(form.fuel_type_id));
  const estimated = selFuel && form.quantity_liters
    ? (selFuel.price_per_liter * parseFloat(form.quantity_liters)).toFixed(2) : null;

  async function handleSubmit() {
    if (!form.fuel_type_id || !form.quantity_liters || !form.pump_number) {
      Alert.alert('خطأ', 'أكمل: نوع الوقود، الكميّة، المضخة');
      return;
    }
    setLoading(true);
    try {
      const res = await createSale(form);
      setSuccess(res.data);
      setForm({ fuel_type_id: '', quantity_liters: '', payment_method: 'cash', pump_number: '', institution_id: '', notes: '' });
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      Alert.alert('خطأ', err.response?.data?.error || t.error);
    } finally { setLoading(false); }
  }

  return (
    <View style={s.screen}>
      <StatusBar backgroundColor="#1c2133" barStyle="light-content" />
      <View style={s.safeTop} />

      <View style={s.tabBar}>
        <TouchableOpacity style={s.tab} onPress={() => navigate('home')}>
          <Text style={s.tabText}>�   {t.dashboard}</Text>
        </TouchableOpacity>
        <View style={[s.tab, s.tabActive]}>
          <Text style={s.tabTextActive}>⛽  {t.newSale}</Text>
        </View>
        <TouchableOpacity style={s.tab} onPress={() => navigate('messages')}>
          <Text style={s.tabText}>💬  {t.messages}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {success && (
          <View style={s.successBanner}>
            <Text style={{ fontSize: rs(28) }}>✅</Text>
            <View style={{ flex: 1, marginRight: rp(10) }}>
              <Text style={s.successTitle}>تمت العملية بنجاح</Text>
              <Text style={s.successAmt}>{Number(success.total_amount).toLocaleString('ar-DZ')} دج</Text>
            </View>
          </View>
        )}

        <Text style={s.pageTitle}>تسجيل بيع جديد</Text>

        <Text style={s.label}>{t.fuelType}</Text>
        <View style={s.grid2}>
          {fuelTypes.map(f => (
            <TouchableOpacity key={f.id}
              style={[s.selectBtn, form.fuel_type_id == f.id && s.selectBtnActive]}
              onPress={() => set('fuel_type_id', f.id)}>
              <Text style={[s.selectBtnText, form.fuel_type_id == f.id && { color: '#fff' }]}>⛽ {f.name_ar}</Text>
              <Text style={[s.selectBtnSub, form.fuel_type_id == f.id && { color: 'rgba(255,255,255,.7)' }]}>{f.price_per_liter} دج/L</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>{t.pumpNumber}</Text>
        <View style={s.pumpGrid}>
          {PUMPS.map(p => (
            <TouchableOpacity key={p}
              style={[s.pumpBtn, form.pump_number == p && s.selectBtnActive]}
              onPress={() => set('pump_number', p)}>
              <Text style={[s.pumpText, form.pump_number == p && { color: '#fff' }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>الكميّة (لتر)</Text>
        <TextInput
          style={s.input}
          value={form.quantity_liters}
          onChangeText={v => set('quantity_liters', v)}
          keyboardType="decimal-pad"
          placeholder="0.0"
          placeholderTextColor="#555e7a"
          textAlign="right"
        />
        {estimated && (
          <Text style={s.estimate}>💰 تقدير المبلغ: {Number(estimated).toLocaleString('ar-DZ')} دج</Text>
        )}

        <Text style={s.label}>{t.paymentMethod}</Text>
        <View style={s.payRow}>
          {PAYMENTS.map(p => (
            <TouchableOpacity key={p.value}
              style={[s.payBtn, form.payment_method === p.value && s.selectBtnActive]}
              onPress={() => set('payment_method', p.value)}>
              <Text style={{ fontSize: rs(18) }}>{p.icon}</Text>
              <Text style={[s.payText, form.payment_method === p.value && { color: '#fff' }]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {form.payment_method === 'credit' && (
          <>
            <Text style={s.label}>المؤسسة</Text>
            {institutions.map(inst => (
              <TouchableOpacity key={inst.id}
                style={[s.instRow, form.institution_id == inst.id && { backgroundColor: 'rgba(232,93,36,.15)' }]}
                onPress={() => set('institution_id', inst.id)}>
                <Text style={{ color: form.institution_id == inst.id ? '#E85D24' : '#eef0f6', fontSize: rs(13) }}>{inst.name}</Text>
                {form.institution_id == inst.id && <Text style={{ color: '#E85D24' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </>
        )}

        <Text style={s.label}>{t.notes}</Text>
        <TextInput
          style={[s.input, { height: rp(70), textAlignVertical: 'top' }]}
          value={form.notes}
          onChangeText={v => set('notes', v)}
          multiline
          placeholder="ملاحظات اختيارية..."
          placeholderTextColor="#555e7a"
          textAlign="right"
        />

        <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>✓  تأكيد البيع</Text>}
        </TouchableOpacity>
        <View style={{ height: rp(30) }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: '#0f1117' },
  safeTop:         { height: STATUS_BAR_HEIGHT, backgroundColor: '#1c2133' },
  tabBar:          { flexDirection: 'row', backgroundColor: '#1c2133', borderBottomWidth: 2, borderBottomColor: '#E85D24', height: TAB_BAR_HEIGHT },
  tab:             { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2 },
  tabActive:       { borderBottomWidth: 3, borderBottomColor: '#E85D24', backgroundColor: 'rgba(232,93,36,0.12)' },
  tabText:         { color: '#8b92a9', fontSize: rs(11), fontWeight: '500', textAlign: 'center' },
  tabTextActive:   { color: '#E85D24', fontSize: rs(11), fontWeight: '700', textAlign: 'center' },
  content:         { padding: rp(16) },
  pageTitle:       { color: '#eef0f6', fontSize: rs(19), fontWeight: '700', textAlign: 'right', marginBottom: rp(16) },
  label:           { color: '#8b92a9', fontSize: rs(12), textAlign: 'right', marginBottom: rp(8), marginTop: rp(14) },
  grid2:           { flexDirection: 'row', flexWrap: 'wrap', gap: rp(8) },
  selectBtn:       { flex: 1, minWidth: (width - rp(48)) / 2, backgroundColor: '#1c2133', borderRadius: 10, padding: rp(12), alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  selectBtnActive: { backgroundColor: '#E85D24', borderColor: '#E85D24' },
  selectBtnText:   { color: '#eef0f6', fontSize: rs(13), fontWeight: '500' },
  selectBtnSub:    { color: '#8b92a9', fontSize: rs(10), marginTop: 2 },
  pumpGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: rp(8) },
  pumpBtn:         { width: rp(54), height: rp(54), backgroundColor: '#1c2133', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  pumpText:        { color: '#eef0f6', fontSize: rs(16), fontWeight: '600' },
  input:           { backgroundColor: '#1c2133', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', borderRadius: 10, color: '#eef0f6', fontSize: rs(15), paddingVertical: rp(12), paddingHorizontal: rp(14) },
  estimate:        { color: '#E85D24', fontSize: rs(13), fontWeight: '700', textAlign: 'right', marginTop: rp(6) },
  payRow:          { flexDirection: 'row', gap: rp(8) },
  payBtn:          { flex: 1, backgroundColor: '#1c2133', borderRadius: 10, padding: rp(10), alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  payText:         { color: '#8b92a9', fontSize: rs(11), marginTop: 3 },
  instRow:         { flexDirection: 'row', justifyContent: 'space-between', padding: rp(12), borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: '#1c2133' },
  submitBtn:       { backgroundColor: '#E85D24', borderRadius: 12, paddingVertical: rp(15), alignItems: 'center', marginTop: rp(22) },
  submitText:      { color: '#fff', fontWeight: '700', fontSize: rs(16) },
  successBanner:   { backgroundColor: 'rgba(29,158,117,.15)', borderRadius: 12, padding: rp(14), flexDirection: 'row', alignItems: 'center', gap: rp(12), marginBottom: rp(16), borderWidth: 1, borderColor: 'rgba(29,158,117,.3)' },
  successTitle:    { color: '#1D9E75', fontWeight: '700', fontSize: rs(14) },
  successAmt:      { color: '#1D9E75', fontSize: rs(13), marginTop: 2 },
});