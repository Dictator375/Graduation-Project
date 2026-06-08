import React, { useState, useEffect } from 'react';
import {
   View, Text, ScrollView, TouchableOpacity, StyleSheet,
   StatusBar, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getThemeColors } from '../../utils/theme';
import { getInventory, refillInventory, updateFuelPrice } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp } from '../../utils/layout';
import { ScreenHeader } from '../../utils/components';

function fmt(n) { return Number(n || 0).toLocaleString('ar-DZ'); }

export default function AdminInventory({ goBack }) {
   const { t, lang, theme } = useAuth();
   const c = getThemeColors(theme || 'dark');
   const s = getStyles(c);
   const [inventory, setInventory] = useState([]);
   const [loading, setLoading] = useState(true);
   const [refillForm, setRefillForm] = useState({ fuel_type_id: '', quantity_liters: '', cost_per_liter: '', supplier: '', demand_date: '', tax_rate: '0.19' });
   const [priceEdit, setPriceEdit] = useState({});
   const [saving, setSaving] = useState(false);

   function load() {
      getInventory().then(r => setInventory(r.data || [])).catch(() => {}).finally(() => setLoading(false));
   }
   useEffect(() => { load(); }, []);

   async function handleRefill() {
      if (!refillForm.fuel_type_id || !refillForm.quantity_liters) {
         Alert.alert(t.errorTitle, t.selectFuelAndQuantity);
         return;
      }
      setSaving(true);
      try {
         await refillInventory(refillForm);
         setRefillForm({ fuel_type_id: '', quantity_liters: '', cost_per_liter: '', supplier: '', demand_date: '', tax_rate: '0.19' });
         Alert.alert(t.successTitle, t.stockUpdated);
         load();
      } catch (err) {
         if (err.response?.data?.code === 'CAPACITY_EXCEEDED') {
            Alert.alert(t.errorTitle, t.capacityExceeded || (lang === 'ar' ? 'كمية الوقود المضافة تتجاوز سعة الخزان. يرجى المحاولة بكمية أقل.' : 'La quantité de carburant à ajouter dépasse la capacité du réservoir. Veuillez réessayer avec une plus petite quantité.'));
         } else {
            Alert.alert(t.errorTitle, err.response?.data?.error || t.error);
         }
      }
      setSaving(false);
   }

   async function handlePriceUpdate(id) {
      const price = priceEdit[id];
      if (!price) return;
      await updateFuelPrice(id, parseFloat(price)).catch(() => {});
      setPriceEdit(p => ({ ...p, [id]: '' }));
      load();
      Alert.alert(t.successTitle, t.priceUpdated);
   }

   return (
      <View style={s.screen}>
         <ScreenHeader
            title={t.inventory}
            onBack={goBack}
            lang={lang}
            theme={theme}
            c={c}
         />

         {loading
            ? <View style={s.center}><ActivityIndicator color="#E85D24" /></View>
            : (
               <ScrollView contentContainerStyle={{ padding: rp(14), paddingBottom: rp(40) }}>

                  {/* Tank levels */}
                  <Text style={s.section}>{t.tankLevels}</Text>
                  {inventory.map(inv => {
                     const pct = Math.min(100, Math.round((inv.quantity_liters / 30000) * 100));
                     const col = pct < 20 ? '#E24B4A' : pct < 40 ? '#BA7517' : '#1D9E75';
                     return (
                        <View key={inv.id} style={s.card}>
                           <View style={s.cardTop}>
                              <View style={[s.statusDot, { backgroundColor: col }]} />
                              <Text style={s.fuelName}>{lang === 'fr' ? (inv.name_fr || inv.name_ar) : inv.name_ar}</Text>
                              <Text style={[s.pctText, { color: col }]}>{pct}%</Text>
                           </View>
                           <View style={s.barTrack}>
                              <View style={[s.barFill, { width: `${pct}%`, backgroundColor: col }]} />
                           </View>
                           <View style={s.cardBottom}>
                              <Text style={s.infoSmall}>{fmt(inv.quantity_liters)} {t.liters}</Text>
                              <Text style={s.infoSmall}>{inv.price_per_liter} {t.currency}/{t.liters}</Text>
                           </View>

                           {/* Price update */}
                           <View style={s.priceRow}>
                              <TextInput
                                 style={s.priceInput}
                                 value={priceEdit[inv.id] || ''}
                                 onChangeText={v => setPriceEdit(p => ({ ...p, [inv.id]: v }))}
                                 placeholder={`${t.newPrice} (${t.currency}/${t.liters})`}
                                 placeholderTextColor={c.muted}
                                 keyboardType="decimal-pad"
                                 textAlign="right"
                              />
                              <TouchableOpacity style={s.priceBtn} onPress={() => handlePriceUpdate(inv.id)}>
                                 <Text style={s.priceBtnText}>{t.update}</Text>
                              </TouchableOpacity>
                           </View>
                        </View>
                     );
                  })}

                  {/* Refill form */}
                  <Text style={s.section}>{t.refillNow}</Text>
                  <View style={s.card}>
                     <Text style={s.label}>{t.fuelType}</Text>
                     <View style={s.fuelGrid}>
                        {inventory.map(inv => (
                           <TouchableOpacity key={inv.id}
                              style={[s.fuelBtn, refillForm.fuel_type_id == inv.id && s.fuelBtnActive]}
                              onPress={() => setRefillForm(f => ({ ...f, fuel_type_id: inv.id }))}>
                              <Text style={[s.fuelBtnText, refillForm.fuel_type_id == inv.id && { color: '#fff' }]}>{lang === 'fr' ? (inv.name_fr || inv.name_ar) : inv.name_ar}</Text>
                           </TouchableOpacity>
                        ))}
                     </View>

                     <Text style={s.label}>{t.quantityLiters}</Text>
                     <TextInput style={s.input} value={refillForm.quantity_liters}
                        onChangeText={v => setRefillForm(f => ({ ...f, quantity_liters: v }))}
                        placeholder={t.quantityLiters} placeholderTextColor={c.muted}
                        keyboardType="numeric" textAlign="right" />

                     <Text style={s.label}>{t.purchasePrice} ({t.currency}/{t.liters})</Text>
                     <TextInput style={s.input} value={refillForm.cost_per_liter}
                        onChangeText={v => setRefillForm(f => ({ ...f, cost_per_liter: v }))}
                        placeholder="0.00" placeholderTextColor={c.muted}
                        keyboardType="decimal-pad" textAlign="right" />

                     <Text style={s.label}>{t.taxRate} (%)</Text>
                     <TextInput style={s.input}
                        value={String(parseFloat(refillForm.tax_rate || 0.19) * 100)}
                        onChangeText={v => setRefillForm(f => ({ ...f, tax_rate: String(parseFloat(v || 0) / 100) }))}
                        placeholder="19" placeholderTextColor={c.muted}
                        keyboardType="decimal-pad" textAlign="right" />

                     {/* Live tax breakdown */}
                     {refillForm.cost_per_liter && refillForm.quantity_liters ? (() => {
                        const net = parseFloat(refillForm.cost_per_liter) * parseFloat(refillForm.quantity_liters);
                        const taxAmt = net * parseFloat(refillForm.tax_rate || 0.19);
                        return (
                           <View style={{ backgroundColor: c.bg, borderRadius: 8, padding: rp(10), marginTop: rp(8) }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                 <Text style={{ color: c.sub, fontSize: rs(11) }}>{t.netAmount}</Text>
                                 <Text style={{ color: c.text, fontSize: rs(11) }}>{fmt(net)} {t.currency}</Text>
                              </View>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                 <Text style={{ color: c.sub, fontSize: rs(11) }}>{t.tax} ({Math.round(parseFloat(refillForm.tax_rate||0.19)*100)}%)</Text>
                                 <Text style={{ color: c.sub, fontSize: rs(11) }}>{fmt(taxAmt)} {t.currency}</Text>
                              </View>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                 <Text style={{ color: '#E85D24', fontSize: rs(12), fontWeight: '700' }}>{t.total}</Text>
                                 <Text style={{ color: '#E85D24', fontSize: rs(12), fontWeight: '700' }}>{fmt(net + taxAmt)} {t.currency}</Text>
                              </View>
                           </View>
                        );
                     })() : null}

                     <Text style={s.label}>{t.supplier}</Text>
                     <TextInput style={s.input} value={refillForm.supplier} 
                        onChangeText={v => setRefillForm(f => ({ ...f, supplier: v }))}
                        placeholder={t.supplierName} placeholderTextColor={c.muted}  textAlign="right" />
                     
                     <Text style={s.label}>{t.demandDate}</Text>
                     <TextInput style={s.input} value={refillForm.demand_date}
                        onChangeText={v => setRefillForm(f => ({ ...f, demand_date: v }))}
                        placeholder="YYYY-MM-DD" placeholderTextColor={c.muted} textAlign="right" />

                     <TouchableOpacity style={s.refillBtn} onPress={handleRefill} disabled={saving}>
                        <Text style={s.refillBtnText}>{saving ? t.loading : `⏺ ${t.refillNow}`}</Text>
                     </TouchableOpacity>
                  </View>
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
   section: { color: c.text, fontSize: rs(15), fontWeight: '700', marginBottom: rp(10), textAlign: 'right' },
   card: { backgroundColor: c.card, borderRadius: 12, padding: rp(14), marginBottom: rp(14), borderWidth: 1, borderColor: c.border },
   cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: rp(8), gap: rp(8) },
   statusDot: { width: rp(10), height: rp(10), borderRadius: rp(5) },
   fuelName: { color: c.text, fontSize: rs(14), fontWeight: '600', flex: 1, textAlign: 'right' },
   pctText: { fontSize: rs(14), fontWeight: '700' },
   barTrack: { height: 8, backgroundColor: c.bg, borderRadius: 4, overflow: 'hidden', marginBottom: rp(6) },
   barFill: { height: '100%', borderRadius: 4 },
   cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: rp(10) },
   infoSmall: { color: c.sub, fontSize: rs(11) },
   priceRow: { flexDirection: 'row', gap: rp(8) },
   priceInput: { flex: 1, backgroundColor: c.bg, borderRadius: 8, padding: rp(8), color: c.text, fontSize: rs(13), borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
   priceBtn: { backgroundColor: '#E85D24', borderRadius: 8, paddingHorizontal: rp(14), justifyContent: 'center' },
   priceBtnText:{ color: '#fff', fontSize: rs(12), fontWeight: '700' },
   label: { color: c.sub, fontSize: rs(12), textAlign: 'right', marginBottom: rp(6), marginTop: rp(10) },
   fuelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rp(8) },
   fuelBtn: { flex: 1, minWidth: '40%', backgroundColor: c.bg, borderRadius: 8, padding: rp(10), alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
   fuelBtnActive:{ backgroundColor: '#E85D24', borderColor: '#E85D24' },
   fuelBtnText: { color: c.text, fontSize: rs(12), fontWeight: '500' },
   input: { backgroundColor: c.bg, borderRadius: 8, padding: rp(10), color: c.text, fontSize: rs(13), borderWidth: 1, borderColor: c.border },
   refillBtn: { backgroundColor: '#E85D24', borderRadius: 10, padding: rp(14), alignItems: 'center', marginTop: rp(14) },
   refillBtnText:{ color: '#fff', fontSize: rs(14), fontWeight: '700' },
});