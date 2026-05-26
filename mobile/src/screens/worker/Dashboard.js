import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getSales, getPayroll, getInventory } from '../../utils/api';

function fmt(n) { return Number(n||0).toLocaleString('ar-DZ'); }

export default function WorkerDashboard({ navigate }) {
  const { user, t, doLogout, isRTL } = useAuth();
  const [sales,     setSales]     = useState([]);
  const [payDates,  setPayDates]  = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  async function load() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [s, p, inv] = await Promise.all([
        getSales({ date: today, limit: 10 }),
        getPayroll(),
        getInventory(),
      ]);
      setSales(s.data);
      setPayDates(p.data);
      setInventory(inv.data);
    } catch(e) {}
    setLoading(false);
    setRefreshing(false);
  }
  useEffect(() => { load(); }, []);

  const todayTotal = sales.reduce((s,r) => s + r.total_amount, 0);
  const nextPay    = payDates[0];
  const hour       = new Date().getHours();
  const shiftName  = hour>=8&&hour<14 ? t.morningShift : hour>=14&&hour<20 ? t.afternoonShift : t.nightShift;

  if (loading) return <View style={s.center}><ActivityIndicator color="#E85D24" size="large"/></View>;

  return (
    <View style={{flex:1,backgroundColor:'#0f1117'}}>
      {/* Tab bar */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, s.tabActive]}>
          <Text style={s.tabTextActive}>🏠 {t.dashboard}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.tab} onPress={() => navigate('sales')}>
          <Text style={s.tabText}>⛽ {t.newSale}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.tab} onPress={() => navigate('messages')}>
          <Text style={s.tabText}>💬 {t.messages}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{flex:1,padding:16}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}} tintColor="#E85D24"/>}
      >
        {/* Welcome */}
        <Text style={s.welcome}>{t.hello} {isRTL ? (user?.full_name_ar||user?.full_name) : (user?.full_name||user?.full_name_ar)} 👋</Text>
        <Text style={s.shift}>{shiftName}</Text>

        {/* Stats */}
        <View style={s.row}>
          <View style={[s.card,{flex:1,marginLeft:8}]}>
            <Text style={s.cardLabel}>{t.mySalesToday}</Text>
            <Text style={s.cardValue}>{fmt(todayTotal)}</Text>
            <Text style={s.cardSub}>دج · {sales.length} عملية</Text>
          </View>
          <View style={[s.card,{flex:1}]}>
            <Text style={s.cardLabel}>{t.nextPayDate}</Text>
            <Text style={s.cardValue} numberOfLines={1}>
              {nextPay ? new Date(nextPay.pay_date).toLocaleDateString('ar-DZ',{month:'short',day:'numeric'}) : '—'}
            </Text>
          </View>
        </View>

        {/* Fuel */}
        <Text style={s.section}>{t.fuelAvailability}</Text>
        {inventory.map(inv => {
          const pct = Math.min(100,Math.round((inv.quantity_liters/30000)*100));
          const col = pct<20?'#E24B4A':pct<40?'#BA7517':'#1D9E75';
          return (
            <View key={inv.id} style={s.invCard}>
              <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:5}}>
                <Text style={{color:'#eef0f6',fontSize:13}}>{isRTL ? inv.name_ar : inv.name}</Text>
                <Text style={{color:col,fontWeight:'700'}}>{pct}%{pct<20?' ⚠️':''}</Text>
              </View>
              <View style={s.barTrack}><View style={[s.barFill,{width:`${pct}%`,backgroundColor:col}]}/></View>
              <Text style={{color:'#555e7a',fontSize:11,marginTop:3,textAlign:'right'}}>{inv.price_per_liter} دج/L</Text>
            </View>
          );
        })}

        {/* Recent sales */}
        <Text style={s.section}>{t.myLatestSales}</Text>
        {sales.length===0
          ? <Text style={{color:'#555e7a',textAlign:'center',padding:20}}>{t.noSalesYet}</Text>
          : sales.map(sale=>(
            <View key={sale.id} style={s.saleRow}>
              <Text style={{fontSize:20}}>⛽</Text>
              <View style={{flex:1,marginHorizontal:10}}>
                <Text style={{color:'#eef0f6',fontSize:13,textAlign:'right'}}>{isRTL ? sale.fuel_name_ar : sale.fuel_name} · {sale.quantity_liters}L</Text>
                <Text style={{color:'#8b92a9',fontSize:11,textAlign:'right'}}>{t.pumpStr} {sale.pump_number}</Text>
              </View>
              <Text style={{color:'#E85D24',fontWeight:'700'}}>{fmt(sale.total_amount)} دج</Text>
            </View>
          ))
        }

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={doLogout}>
          <Text style={{color:'#E24B4A',fontWeight:'600'}}>{t.logout}</Text>
        </TouchableOpacity>
        <View style={{height:20}}/>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  center:      {flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#0f1117'},
  tabs:        {flexDirection:'row',backgroundColor:'#171b25',borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,0.07)'},
  tab:         {flex:1,padding:12,alignItems:'center'},
  tabActive:   {borderBottomWidth:2,borderBottomColor:'#E85D24'},
  tabText:     {color:'#8b92a9',fontSize:11},
  tabTextActive:{color:'#E85D24',fontSize:11,fontWeight:'600'},
  welcome:     {color:'#eef0f6',fontSize:18,fontWeight:'700',textAlign:'right',marginBottom:4},
  shift:       {color:'#E85D24',fontSize:12,textAlign:'right',marginBottom:16},
  row:         {flexDirection:'row',marginBottom:14},
  card:        {backgroundColor:'#1c2133',borderRadius:12,padding:14,borderWidth:1,borderColor:'rgba(255,255,255,0.07)'},
  cardLabel:   {color:'#8b92a9',fontSize:11,textAlign:'right',marginBottom:4},
  cardValue:   {color:'#eef0f6',fontSize:22,fontWeight:'700',textAlign:'right'},
  cardSub:     {color:'#555e7a',fontSize:11,textAlign:'right'},
  section:     {color:'#eef0f6',fontSize:14,fontWeight:'600',marginBottom:10,textAlign:'right'},
  invCard:     {backgroundColor:'#1c2133',borderRadius:10,padding:12,marginBottom:8,borderWidth:1,borderColor:'rgba(255,255,255,0.07)'},
  barTrack:    {height:7,backgroundColor:'#0f1117',borderRadius:4,overflow:'hidden',marginBottom:3},
  barFill:     {height:'100%',borderRadius:4},
  saleRow:     {backgroundColor:'#1c2133',borderRadius:10,padding:12,marginBottom:8,flexDirection:'row',alignItems:'center'},
  logoutBtn:   {marginTop:20,padding:14,alignItems:'center',borderWidth:1,borderColor:'rgba(226,75,74,0.3)',borderRadius:10},
});