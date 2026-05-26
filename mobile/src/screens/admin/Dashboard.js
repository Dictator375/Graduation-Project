import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getSalesSummary, getInventory, getEmployees } from '../../utils/api';

function fmt(n) { return Number(n||0).toLocaleString('ar-DZ'); }

export default function AdminDashboard({ navigate }) {
  const { t, doLogout, isRTL } = useAuth();
  const [summary,   setSummary]   = useState([]);
  const [inventory, setInventory] = useState([]);
  const [empCount,  setEmpCount]  = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  async function load() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [s, inv, emp] = await Promise.all([
        getSalesSummary({ period:'daily', date:today }),
        getInventory(),
        getEmployees(),
      ]);
      setSummary(s.data);
      setInventory(inv.data);
      setEmpCount(emp.data.filter(e=>e.is_active).length);
    } catch(e){}
    setLoading(false);
    setRefreshing(false);
  }
  useEffect(()=>{load();},[]);

  const todayDA   = summary.reduce((s,r)=>s+r.total_da,     0);
  const todayL    = summary.reduce((s,r)=>s+r.total_liters, 0);
  const todayTxns = summary.reduce((s,r)=>s+r.transactions, 0);

  if (loading) return <View style={s.center}><ActivityIndicator color="#E85D24" size="large"/></View>;

  return (
    <View style={{flex:1,backgroundColor:'#0f1117'}}>
      {/* Tab bar */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab,s.tabActive]}>
          <Text style={s.tabTextActive}>📊 {t.dashboard}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.tab} onPress={()=>navigate('messages')}>
          <Text style={s.tabText}>💬 {t.messages}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{flex:1,padding:16}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}} tintColor="#E85D24"/>}
      >
        <Text style={s.heading}>{t.dashboard} 📊</Text>

        {/* Stats */}
        <View style={s.row}>
          <View style={[s.card,{flex:1,marginLeft:8}]}>
            <Text style={s.cardLabel}>{t.todayRevenue}</Text>
            <Text style={s.cardValue}>{fmt(todayDA)}</Text>
            <Text style={s.cardSub}>دج</Text>
          </View>
          <View style={[s.card,{flex:1}]}>
            <Text style={s.cardLabel}>{t.fuelSoldToday}</Text>
            <Text style={s.cardValue}>{fmt(todayL)}</Text>
            <Text style={s.cardSub}>L</Text>
          </View>
        </View>
        <View style={s.row}>
          <View style={[s.card,{flex:1,marginLeft:8}]}>
            <Text style={s.cardLabel}>{t.todayOperations}</Text>
            <Text style={s.cardValue}>{todayTxns}</Text>
          </View>
          <View style={[s.card,{flex:1}]}>
            <Text style={s.cardLabel}>{t.employees}</Text>
            <Text style={s.cardValue}>{empCount}</Text>
            <Text style={s.cardSub}>{t.active}</Text>
          </View>
        </View>

        {/* Fuel levels */}
        <Text style={s.section}>{t.inventory}</Text>
        {inventory.map(inv=>{
          const pct = Math.min(100,Math.round((inv.quantity_liters/30000)*100));
          const col = pct<20?'#E24B4A':pct<40?'#BA7517':'#1D9E75';
          return (
            <View key={inv.id} style={s.invCard}>
              <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:5}}>
                <Text style={{color:'#eef0f6',fontSize:13}}>{isRTL ? inv.name_ar : inv.name}</Text>
                <Text style={{color:col,fontWeight:'700'}}>{pct}%{pct<20?' ⚠️':''}</Text>
              </View>
              <View style={s.barTrack}><View style={[s.barFill,{width:`${pct}%`,backgroundColor:col}]}/></View>
              <Text style={{color:'#555e7a',fontSize:11,marginTop:3,textAlign:'right'}}>{fmt(inv.quantity_liters)} L · {inv.price_per_liter} دج/L</Text>
            </View>
          );
        })}

        {/* Today breakdown */}
        <Text style={s.section}>{t.todayBreakdown}</Text>
        <View style={s.card}>
          {summary.length===0
            ? <Text style={{color:'#555e7a',textAlign:'center',padding:16}}>{t.noSalesToday}</Text>
            : summary.map(row=>(
              <View key={row.name} style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:8,borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,0.05)'}}>
                <Text style={{color:'#E85D24',fontWeight:'700'}}>{fmt(row.total_da)} دج</Text>
                <Text style={{color:'#8b92a9',fontSize:12}}>{fmt(row.total_liters)} L</Text>
                <Text style={{color:'#eef0f6'}}>{isRTL ? row.name_ar : row.name}</Text>
              </View>
            ))
          }
        </View>

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
  center:       {flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#0f1117'},
  tabs:         {flexDirection:'row',backgroundColor:'#171b25',borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,0.07)'},
  tab:          {flex:1,padding:12,alignItems:'center'},
  tabActive:    {borderBottomWidth:2,borderBottomColor:'#E85D24'},
  tabText:      {color:'#8b92a9',fontSize:11},
  tabTextActive:{color:'#E85D24',fontSize:11,fontWeight:'600'},
  heading:      {color:'#eef0f6',fontSize:19,fontWeight:'700',textAlign:'right',marginBottom:16},
  row:          {flexDirection:'row',marginBottom:10},
  card:         {backgroundColor:'#1c2133',borderRadius:12,padding:14,borderWidth:1,borderColor:'rgba(255,255,255,0.07)'},
  cardLabel:    {color:'#8b92a9',fontSize:11,textAlign:'right',marginBottom:4},
  cardValue:    {color:'#eef0f6',fontSize:22,fontWeight:'700',textAlign:'right'},
  cardSub:      {color:'#555e7a',fontSize:11,textAlign:'right'},
  section:      {color:'#eef0f6',fontSize:14,fontWeight:'600',marginTop:16,marginBottom:10,textAlign:'right'},
  invCard:      {backgroundColor:'#1c2133',borderRadius:10,padding:12,marginBottom:8,borderWidth:1,borderColor:'rgba(255,255,255,0.07)'},
  barTrack:     {height:7,backgroundColor:'#0f1117',borderRadius:4,overflow:'hidden',marginBottom:3},
  barFill:      {height:'100%',borderRadius:4},
  logoutBtn:    {marginTop:20,padding:14,alignItems:'center',borderWidth:1,borderColor:'rgba(226,75,74,0.3)',borderRadius:10},
});