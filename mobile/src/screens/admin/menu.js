import React from 'react';
import {
   View, Text, TouchableOpacity, ScrollView,
   StyleSheet, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { STATUS_BAR_HEIGHT, rs, rp, width } from '../../utils/layout';

const MENU_ITEMS = [
   { icon: '', key: 'reports', screen: 'reports' },
   { icon: '', key: 'employees', screen: 'employees' },
   { icon: '', key: 'attendance', screen: 'attendance' },
   { icon: '', key: 'inventory', screen: 'inventory' },
   { icon: '', key: 'invoices', screen: 'invoices' },
   { icon: '', key: 'credits', screen: 'credits' },
   { icon: '', key: 'institutions', screen: 'institutions' },
   { icon: '', key: 'messages', screen: 'messages' },
   { icon: '', key: 'payroll', screen: 'payroll' },
];

const LABELS = {
   reports: { ar: 'التقارير', fr: 'Rapports' },
   employees: { ar: 'الموظفون', fr: 'Employés' },
   attendance: { ar: 'الحضور', fr: 'Présences' },
   inventory: { ar: 'المخزون', fr: 'Inventaire' },
   invoices: { ar: 'الفواتير', fr: 'Factures' },
   credits: { ar: 'الديون', fr: 'Crédits' },
   institutions: { ar: 'المؤسسات', fr: 'Institutions' },
   messages: { ar: 'الرسائل', fr: 'Messages' },
   payroll: { ar: 'الرواتب', fr: 'Paie' },
};

const TILE_SIZE = (width - rp(48)) / 3;

export default function AdminMenu({ navigate }) {
   const { user, t, doLogout, lang } = useAuth();
   const today = new Date().toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
   });

   return (
      <View style={s.screen}>
         <StatusBar backgroundColor="#1c2133" barStyle="light-content" />
         <View style={s.safeTop} />

         {/* Header */}
         <View style={s.header}>
            <View style={{ flex: 1 }}>
               <Text style={s.headerGreet}>مرحباً، {user?.full_name_ar || user?.full_name} </Text>
               <Text style={s.headerDate}>{today}</Text>
            </View>
            <TouchableOpacity style={s.logoutBtn} onPress={doLogout}>
               <Text style={s.logoutText}>خروج</Text>
            </TouchableOpacity>
         </View>

         <ScrollView contentContainerStyle={s.content}>
            <Text style={s.menuTitle}>لوحة تحكم المدير</Text>

            <View style={s.grid}>
               {MENU_ITEMS.map(item => (
                  <TouchableOpacity
                     key={item.screen}
                     style={s.tile}
                     onPress={() => navigate(item.screen)}
                  >
                     <Text style={s.tileIcon}>{item.icon}</Text>
                     <Text style={s.tileLabel}>
                        {lang === 'ar' ? LABELS[item.key].ar : LABELS[item.key].fr}
                     </Text>
                  </TouchableOpacity>
               ))}
            </View>
         </ScrollView>
      </View>
   );
}

const s = StyleSheet.create({
   screen: { flex: 1, backgroundColor: '#0f1117' },
   safeTop: { height: STATUS_BAR_HEIGHT, backgroundColor: '#1c2133' },
   header: { backgroundColor: '#1c2133', padding: rp(16), flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
   headerGreet: { color: '#eef0f6', fontSize: rs(15), fontWeight: '700', textAlign: 'right' },
   headerDate: { color: '#8b92a9', fontSize: rs(11), textAlign: 'right', marginTop: 2 },
   logoutBtn: { backgroundColor: 'rgba(226,75,74,0.15)', paddingVertical: rp(8), paddingHorizontal: rp(14), borderRadius: 10, borderWidth: 1, borderColor: 'rgba(226,75,74,0.3)' },
   logoutText: { color: '#E24B4A', fontSize: rs(12), fontWeight: '600' },
   content: { padding: rp(16), paddingBottom: rp(40) },
   menuTitle: { color: '#eef0f6', fontSize: rs(17), fontWeight: '700', textAlign: 'right', marginBottom: rp(16) },
   grid: { flexDirection: 'row', flexWrap: 'wrap', gap: rp(12) },
   tile: {
      width: TILE_SIZE, height: TILE_SIZE,
      backgroundColor: '#1c2133',
      borderRadius: 16,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
   },
   tileIcon: { fontSize: rs(32), marginBottom: rp(8) },
   tileLabel: { color: '#eef0f6', fontSize: rs(12), fontWeight: '600', textAlign: 'center' },
});