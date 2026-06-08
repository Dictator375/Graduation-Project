import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getThemeColors } from '../../utils/theme';
import { createSale, getFuelTypes, getInstitutions, getPumps } from '../../utils/api';
import { STATUS_BAR_HEIGHT, TAB_BAR_HEIGHT, rs, rp, width } from '../../utils/layout';

const VOUCHER_VALUES = [850, 1200];

export default function WorkerSales({ navigate }) {
   const { t, lang, theme } = useAuth();
   const c = getThemeColors(theme || 'dark');
   const s = getStyles(c);

   const PAYMENTS = [
      { value: 'cash',    label: t.cash,    icon: '💵' },
      { value: 'card',    label: t.card,    icon: '💳' },
      { value: 'loyalty', label: t.loyalty,  icon: '⭐' },
      { value: 'credit',  label: t.credit,   icon: '🏢' },
   ];
  const [fuelTypes,    setFuelTypes]    = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [pumps, setPumps] = useState([]);
  const [isCustomVoucher, setIsCustomVoucher] = useState(false);
  const [form, setForm] = useState({ fuel_type_id: '', quantity_liters: '', payment_method: 'cash', pump_number: '', institution_id: '', notes: '', voucher_amount: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    getFuelTypes().then(r => setFuelTypes(r.data || [])).catch(() => {});
    getInstitutions().then(r => setInstitutions(r.data || [])).catch(() => {});
    getPumps().then(r => setPumps(r.data || [])).catch(() => {});
  }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  const selFuel   = fuelTypes.find(f => f.id === parseInt(form.fuel_type_id));
  const estimated = selFuel && form.quantity_liters
    ? (selFuel.price_per_liter * parseFloat(form.quantity_liters)).toFixed(2) : null;

  async function handleSubmit() {
    if (!form.fuel_type_id || !form.quantity_liters || !form.pump_number) {
      Alert.alert(t.errorTitle, `${t.selectFuel}, ${t.enterQuantity}, ${t.selectPump}`);
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      if (payload.payment_method !== 'loyalty') delete payload.voucher_amount;
      const res = await createSale(payload);
      setSuccess(res.data);
      setForm({ fuel_type_id: '', quantity_liters: '', payment_method: 'cash', pump_number: '', institution_id: '', notes: '', voucher_amount: '' });
      setIsCustomVoucher(false);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      Alert.alert(t.errorTitle, err.response?.data?.error || t.error);
    } finally { setLoading(false); }
  }

  return (
    <View style={s.screen}>
      <StatusBar backgroundColor={c.statusBar} barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
      <View style={s.safeTop} />

      <View style={s.tabBar}>
        <TouchableOpacity style={s.tab} onPress={() => navigate('home')}>
          <Text style={s.tabText}>🏠   {t.dashboard}</Text>
        </TouchableOpacity>
        <View style={[s.tab, s.tabActive]}>
          <Text style={s.tabTextActive}>⛽  {t.newSale}</Text>
        </View>
        <TouchableOpacity style={s.tab} onPress={() => navigate('chat')}>
          <Text style={s.tabText}>💬  {t.chat}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {success && (
          <View style={s.successBanner}>
            <Text style={{ fontSize: rs(28) }}>✅</Text>
            <View style={{ flex: 1, marginRight: rp(10) }}>
              <Text style={s.successTitle}>{t.newSaleSuccess}</Text>
              <Text style={s.successAmt}>{Number(success.total_amount).toLocaleString('ar-DZ')} {t.currency || 'دج'}</Text>
            </View>
          </View>
        )}

        <Text style={s.pageTitle}>{t.newSale}</Text>

        <Text style={s.label}>{t.fuelType}</Text>
        <View style={s.grid2}>
          {fuelTypes.map(f => (
            <TouchableOpacity key={f.id}
              style={[s.selectBtn, form.fuel_type_id == f.id && s.selectBtnActive]}
              onPress={() => set('fuel_type_id', f.id)}>
              <Text style={[s.selectBtnText, form.fuel_type_id == f.id && { color: '#fff' }]}>⛽ {lang === 'fr' ? (f.name_fr || f.name_ar) : f.name_ar}</Text>
              <Text style={[s.selectBtnSub, form.fuel_type_id == f.id && { color: 'rgba(255,255,255,.7)' }]}>{f.price_per_liter} {t.currency || 'دج'}/L</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>{t.pumpNumber}</Text>
        <View style={s.pumpGrid}>
          {pumps.map(p => {
             const out = p.status === 'out_of_service';
             return (
               <TouchableOpacity key={p.id}
                 disabled={out}
                 style={[s.pumpBtn, form.pump_number == p.pump_number && s.selectBtnActive, out && {opacity: 0.5}]}
                 onPress={() => set('pump_number', p.pump_number)}>
                 <Text style={[s.pumpText, form.pump_number == p.pump_number && { color: '#fff' }, out && {textDecorationLine: 'line-through'}]}>{p.pump_number}</Text>
               </TouchableOpacity>
             );
          })}
        </View>

        <Text style={s.label}>{t.quantityLiters}</Text>
        <TextInput
          style={s.input}
          value={form.quantity_liters}
          onChangeText={v => set('quantity_liters', v)}
          keyboardType="decimal-pad"
          placeholder="0.0"
          placeholderTextColor={c.muted}
          textAlign={lang === 'fr' ? 'left' : 'right'}
        />
        {estimated && (
          <Text style={s.estimate}>💰 {t.estimatedTotal}: {Number(estimated).toLocaleString('ar-DZ')} {t.currency}</Text>
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

        {form.payment_method === 'loyalty' && (
          <>
            <Text style={s.label}>{t.customAmount}</Text>
            <View style={{flexDirection: 'row', gap: rp(8), marginBottom: rp(8)}}>
              {VOUCHER_VALUES.map(val => (
                <TouchableOpacity key={val}
                  style={[s.payBtn, !isCustomVoucher && form.voucher_amount == val && s.selectBtnActive]}
                  onPress={() => { setIsCustomVoucher(false); set('voucher_amount', val.toString()); }}>
                  <Text style={[s.payText, !isCustomVoucher && form.voucher_amount == val && { color: '#fff' }]}>{val} {t.currency || 'دج'}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[s.payBtn, isCustomVoucher && s.selectBtnActive]}
                onPress={() => { setIsCustomVoucher(true); set('voucher_amount', ''); }}>
                <Text style={[s.payText, isCustomVoucher && { color: '#fff' }]}>{t.customAmount}</Text>
              </TouchableOpacity>
            </View>
            {isCustomVoucher && (
               <TextInput
                 style={s.input}
                 value={form.voucher_amount}
                 onChangeText={v => set('voucher_amount', v)}
                 keyboardType="decimal-pad"
                 placeholder={t.enterQuantity}
                 placeholderTextColor={c.muted}
                 textAlign={lang === 'fr' ? 'left' : 'right'}
               />
            )}
          </>
        )}

        {form.payment_method === 'credit' && (
          <>
            <Text style={s.label}>{t.selectInstitution}</Text>
            {institutions.map(inst => (
              <TouchableOpacity key={inst.id}
                style={[s.instRow, form.institution_id == inst.id && { backgroundColor: 'rgba(232,93,36,.15)' }]}
                onPress={() => set('institution_id', inst.id)}>
                <Text style={{ color: form.institution_id == inst.id ? '#E85D24' : c.text, fontSize: rs(13) }}>{inst.name}</Text>
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
          placeholder={t.notes}
          placeholderTextColor={c.muted}
          textAlign={lang === 'fr' ? 'left' : 'right'}
        />

        <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>✓  {t.confirmSale}</Text>}
        </TouchableOpacity>
        <View style={{ height: rp(30) }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (c) => StyleSheet.create({
  screen:          { flex: 1, backgroundColor: c.bg },
  safeTop:         { height: STATUS_BAR_HEIGHT, backgroundColor: c.card },
  tabBar:          { flexDirection: 'row', backgroundColor: c.card, borderBottomWidth: 2, borderBottomColor: '#E85D24', height: TAB_BAR_HEIGHT },
  tab:             { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2 },
  tabActive:       { borderBottomWidth: 3, borderBottomColor: '#E85D24', backgroundColor: 'rgba(232,93,36,0.12)' },
  tabText:         { color: c.sub, fontSize: rs(11), fontWeight: '500', textAlign: 'center' },
  tabTextActive:   { color: '#E85D24', fontSize: rs(11), fontWeight: '700', textAlign: 'center' },
  content:         { padding: rp(16) },
  pageTitle:       { color: c.text, fontSize: rs(19), fontWeight: '700', textAlign: 'right', marginBottom: rp(16) },
  label:           { color: c.sub, fontSize: rs(12), textAlign: 'right', marginBottom: rp(8), marginTop: rp(14) },
  grid2:           { flexDirection: 'row', flexWrap: 'wrap', gap: rp(8) },
  selectBtn:       { flex: 1, minWidth: (width - rp(48)) / 2, backgroundColor: c.card, borderRadius: 10, padding: rp(12), alignItems: 'center', borderWidth: 1, borderColor: c.border },
  selectBtnActive: { backgroundColor: '#E85D24', borderColor: '#E85D24' },
  selectBtnText:   { color: c.text, fontSize: rs(13), fontWeight: '500' },
  selectBtnSub:    { color: c.sub, fontSize: rs(10), marginTop: 2 },
  pumpGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: rp(8) },
  pumpBtn:         { width: rp(54), height: rp(54), backgroundColor: c.card, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: c.border },
  pumpText:        { color: c.text, fontSize: rs(16), fontWeight: '600' },
  input:           { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 10, color: c.text, fontSize: rs(15), paddingVertical: rp(12), paddingHorizontal: rp(14), textAlignVertical: 'center' },
  estimate:        { color: '#E85D24', fontSize: rs(13), fontWeight: '700', textAlign: 'right', marginTop: rp(6) },
  payRow:          { flexDirection: 'row', gap: rp(8) },
  payBtn:          { flex: 1, backgroundColor: c.card, borderRadius: 10, padding: rp(10), alignItems: 'center', borderWidth: 1, borderColor: c.border },
  payText:         { color: c.sub, fontSize: rs(11), marginTop: 3 },
  instRow:         { flexDirection: 'row', justifyContent: 'space-between', padding: rp(12), borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: c.card },
  submitBtn:       { backgroundColor: '#E85D24', borderRadius: 12, paddingVertical: rp(15), alignItems: 'center', marginTop: rp(22) },
  submitText:      { color: '#fff', fontWeight: '700', fontSize: rs(16) },
  successBanner:   { backgroundColor: 'rgba(29,158,117,.15)', borderRadius: 12, padding: rp(14), flexDirection: 'row', alignItems: 'center', gap: rp(12), marginBottom: rp(16), borderWidth: 1, borderColor: 'rgba(29,158,117,.3)' },
  successTitle:    { color: '#1D9E75', fontWeight: '700', fontSize: rs(14) },
  successAmt:      { color: '#1D9E75', fontSize: rs(13), marginTop: 2 },
});