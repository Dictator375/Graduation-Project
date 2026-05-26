import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { createSale, getFuelTypes, getInstitutions } from '../../utils/api';

const PUMPS   = [1,2,3,4,5,6,7,8];
const PAYMENTS = [
  { value:'cash',    label:'نقداً',  icon:'💵' },
  { value:'card',    label:'بطاقة', icon:'💳' },
  { value:'loyalty', label:'نقاط',  icon:'⭐' },
  { value:'credit',  label:'دين',   icon:'🏢' },
];

export default function WorkerSales() {
  const { t } = useAuth();
  const [fuelTypes,    setFuelTypes]    = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [form, setForm] = useState({
    fuel_type_id:'', quantity_liters:'', payment_method:'cash',
    pump_number:'', institution_id:'', notes:'',
  });
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(null);

  useEffect(() => {
    getFuelTypes().then(r => setFuelTypes(r.data));
    getInstitutions().then(r => setInstitutions(r.data));
  }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  const selectedFuel = fuelTypes.find(f => f.id === parseInt(form.fuel_type_id));
  const estimated    = selectedFuel && form.quantity_liters
    ? (selectedFuel.price_per_liter * parseFloat(form.quantity_liters)).toFixed(2)
    : null;

  async function handleSubmit() {
    if (!form.fuel_type_id || !form.quantity_liters || !form.pump_number) {
      Alert.alert('خطأ', 'أكمل جميع الحقول المطلوبة (نوع الوقود، الكميّة، المضخة)');
      return;
    }
    setLoading(true);
    try {
      const res = await createSale(form);
      setSuccess(res.data);
      setForm({ fuel_type_id:'', quantity_liters:'', payment_method:'cash', pump_number:'', institution_id:'', notes:'' });
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      Alert.alert('خطأ', err.response?.data?.error || t.error);
    } finally { setLoading(false); }
  }

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <Text style={s.heading}>تسجيل بيع ⛽</Text>

      {/* Success */}
      {success && (
        <View style={s.successBanner}>
          <Text style={s.successIcon}>✅</Text>
          <View>
            <Text style={s.successTitle}>تمت العملية بنجاح</Text>
            <Text style={s.successAmt}>{Number(success.total_amount).toLocaleString('ar-DZ')} دج</Text>
          </View>
        </View>
      )}

      {/* Fuel type */}
      <Text style={s.label}>{t.fuelType}</Text>
      <View style={s.grid2}>
        {fuelTypes.map(f => (
          <TouchableOpacity
            key={f.id}
            style={[s.selectBtn, form.fuel_type_id==f.id && s.selectBtnActive]}
            onPress={() => set('fuel_type_id', f.id)}
          >
            <Text style={[s.selectBtnText, form.fuel_type_id==f.id && { color:'#fff' }]}>⛽ {f.name_ar}</Text>
            <Text style={[s.selectBtnSub, form.fuel_type_id==f.id && { color:'rgba(255,255,255,.7)' }]}>{f.price_per_liter} دج/L</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pump */}
      <Text style={s.label}>{t.pumpNumber}</Text>
      <View style={s.pumpGrid}>
        {PUMPS.map(p => (
          <TouchableOpacity
            key={p}
            style={[s.pumpBtn, form.pump_number==p && s.selectBtnActive]}
            onPress={() => set('pump_number', p)}
          >
            <Text style={[s.pumpBtnText, form.pump_number==p && { color:'#fff' }]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quantity */}
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

      {/* Payment method */}
      <Text style={s.label}>{t.paymentMethod}</Text>
      <View style={s.payRow}>
        {PAYMENTS.map(p => (
          <TouchableOpacity
            key={p.value}
            style={[s.payBtn, form.payment_method===p.value && s.selectBtnActive]}
            onPress={() => set('payment_method', p.value)}
          >
            <Text style={{ fontSize:18 }}>{p.icon}</Text>
            <Text style={[s.payBtnText, form.payment_method===p.value && { color:'#fff' }]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Institution (credit only) */}
      {form.payment_method === 'credit' && (
        <>
          <Text style={s.label}>المؤسسة</Text>
          <View style={s.selectList}>
            {institutions.map(inst => (
              <TouchableOpacity
                key={inst.id}
                style={[s.instRow, form.institution_id==inst.id && { backgroundColor:'rgba(232,93,36,.15)' }]}
                onPress={() => set('institution_id', inst.id)}
              >
                <Text style={{ color: form.institution_id==inst.id?'#E85D24':'#eef0f6', fontSize:13 }}>{inst.name}</Text>
                {form.institution_id==inst.id && <Text style={{ color:'#E85D24' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Notes */}
      <Text style={s.label}>{t.notes}</Text>
      <TextInput
        style={[s.input, { height:70, textAlignVertical:'top' }]}
        value={form.notes}
        onChangeText={v => set('notes', v)}
        multiline
        placeholder="ملاحظات اختيارية..."
        placeholderTextColor="#555e7a"
        textAlign="right"
      />

      {/* Submit */}
      <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.submitText}>✓ تأكيد البيع</Text>
        }
      </TouchableOpacity>

      <View style={{ height:40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:     { flex:1, backgroundColor:'#0f1117', padding:16 },
  heading:       { color:'#eef0f6', fontSize:19, fontWeight:'700', marginBottom:16, textAlign:'right' },
  label:         { color:'#8b92a9', fontSize:12, marginBottom:8, textAlign:'right', marginTop:14 },
  grid2:         { flexDirection:'row', flexWrap:'wrap', gap:8 },
  selectBtn:     { flex:1, minWidth:'45%', backgroundColor:'#1c2133', borderRadius:10, padding:12, alignItems:'center', borderWidth:1, borderColor:'rgba(255,255,255,0.07)' },
  selectBtnActive:{ backgroundColor:'#E85D24', borderColor:'#E85D24' },
  selectBtnText: { color:'#eef0f6', fontSize:13, fontWeight:'500' },
  selectBtnSub:  { color:'#8b92a9', fontSize:10, marginTop:2 },
  pumpGrid:      { flexDirection:'row', flexWrap:'wrap', gap:8 },
  pumpBtn:       { width:54, height:54, backgroundColor:'#1c2133', borderRadius:10, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'rgba(255,255,255,0.07)' },
  pumpBtnText:   { color:'#eef0f6', fontSize:16, fontWeight:'600' },
  input: {
    backgroundColor:'#1c2133', borderWidth:1, borderColor:'rgba(255,255,255,0.13)',
    borderRadius:10, color:'#eef0f6', fontSize:15, paddingVertical:12, paddingHorizontal:14,
  },
  estimate:      { color:'#E85D24', fontSize:13, fontWeight:'700', textAlign:'right', marginTop:6 },
  payRow:        { flexDirection:'row', gap:8 },
  payBtn:        { flex:1, backgroundColor:'#1c2133', borderRadius:10, padding:10, alignItems:'center', borderWidth:1, borderColor:'rgba(255,255,255,0.07)' },
  payBtnText:    { color:'#8b92a9', fontSize:11, marginTop:3 },
  selectList:    { backgroundColor:'#1c2133', borderRadius:10, overflow:'hidden' },
  instRow:       { flexDirection:'row', justifyContent:'space-between', padding:12, borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.05)' },
  submitBtn:     { backgroundColor:'#E85D24', borderRadius:12, paddingVertical:15, alignItems:'center', marginTop:22 },
  submitText:    { color:'#fff', fontWeight:'700', fontSize:16 },
  successBanner: { backgroundColor:'rgba(29,158,117,.15)', borderRadius:12, padding:14, flexDirection:'row', alignItems:'center', gap:12, marginBottom:16, borderWidth:1, borderColor:'rgba(29,158,117,.3)' },
  successIcon:   { fontSize:28 },
  successTitle:  { color:'#1D9E75', fontWeight:'700', fontSize:14 },
  successAmt:    { color:'#1D9E75', fontSize:13, marginTop:2 },
});
