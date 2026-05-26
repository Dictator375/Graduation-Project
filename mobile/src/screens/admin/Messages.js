import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getMessageUsers, getConversation, sendMessage } from '../../utils/api';

export default function AdminMessages({ navigate }) {
  const { user, t } = useAuth();
  const [users,    setUsers]    = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const flatRef = useRef(null);

  useEffect(() => {
    getMessageUsers()
      .then(r => setUsers(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) { setMessages([]); return; }
    const fetch = () =>
      getConversation(selected.id)
        .then(r => setMessages(r.data || []))
        .catch(() => {});
    fetch();
    const iv = setInterval(fetch, 5000);
    return () => clearInterval(iv);
  }, [selected]);

  async function handleSend() {
    if (!text.trim()) return;
    try {
      await sendMessage({ receiver_id: selected?.id || null, content: text.trim() });
      setText('');
      if (selected) {
        const r = await getConversation(selected.id);
        setMessages(r.data || []);
      }
    } catch(e) {
      Alert.alert('خطأ', 'فشل إرسال الرسالة');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS==='ios'?'padding':'height'}
      style={{flex:1,backgroundColor:'#0f1117'}}
    >
      {/* ── Tab bar ── */}
      <View style={s.tabBar}>
        <TouchableOpacity style={s.tab} onPress={() => navigate('home')}>
          <Text style={s.tabText}>📊  {t.dashboard}</Text>
        </TouchableOpacity>
        <View style={[s.tab, s.tabActive]}>
          <Text style={s.tabTextActive}>💬  {t.messages}</Text>
        </View>
      </View>

      {/* ── User list ── */}
      {!selected ? (
        <View style={{flex:1}}>
          <Text style={s.heading}>{t.messages}</Text>
          {loading && <ActivityIndicator color="#E85D24" style={{marginTop:30}}/>}

          <TouchableOpacity
            style={s.broadcastBtn}
            onPress={() => setSelected({ id: null, full_name_ar:'إرسال للجميع' })}
          >
            <Text style={s.broadcastText}>📢  إرسال رسالة للجميع</Text>
          </TouchableOpacity>

          {users.map(u => (
            <TouchableOpacity key={u.id} style={s.userRow} onPress={() => setSelected(u)}>
              <View style={s.avatar}><Text style={{fontSize:20}}>👤</Text></View>
              <View style={{flex:1, marginHorizontal:12}}>
                <Text style={s.userName}>{u.full_name_ar || u.full_name}</Text>
                <Text style={s.userRole}>{t[u.role] || u.role}</Text>
              </View>
              <Text style={{color:'#E85D24',fontSize:22}}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        /* ── Chat ── */
        <>
          <View style={s.chatHeader}>
            <TouchableOpacity onPress={() => setSelected(null)} style={s.backBtn}>
              <Text style={s.backText}>‹  رجوع</Text>
            </TouchableOpacity>
            <Text style={s.chatTitle}>{selected.full_name_ar || selected.full_name}</Text>
          </View>

          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => String(m.id)}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({animated:true})}
            contentContainerStyle={{padding:14,paddingBottom:10}}
            ListEmptyComponent={
              <Text style={{color:'#555e7a',textAlign:'center',marginTop:40,fontSize:13}}>
                لا توجد رسائل بعد
              </Text>
            }
            renderItem={({item:msg}) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <View style={{alignItems:isMe?'flex-start':'flex-end', marginBottom:8}}>
                  <View style={[s.bubble, isMe?s.myBubble:s.theirBubble]}>
                    {!isMe && (
                      <Text style={s.bubbleSender}>{msg.sender_name_ar||msg.sender_name}</Text>
                    )}
                    <Text style={{color:isMe?'#fff':'#eef0f6',fontSize:13,lineHeight:20}}>
                      {msg.content}
                    </Text>
                    <Text style={s.bubbleTime}>
                      {new Date(msg.created_at).toLocaleTimeString('ar-DZ',{hour:'2-digit',minute:'2-digit'})}
                    </Text>
                  </View>
                </View>
              );
            }}
          />

          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              value={text}
              onChangeText={setText}
              placeholder={t.typeMessage}
              placeholderTextColor="#555e7a"
              multiline
              textAlign="right"
            />
            <TouchableOpacity style={s.sendBtn} onPress={handleSend}>
              <Text style={{color:'#fff',fontWeight:'700',fontSize:14}}>{t.send}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  tabBar:       {flexDirection:'row',backgroundColor:'#1c2133',borderBottomWidth:2,borderBottomColor:'#E85D24'},
  tab:          {flex:1,paddingVertical:14,alignItems:'center'},
  tabActive:    {borderBottomWidth:3,borderBottomColor:'#E85D24',backgroundColor:'rgba(232,93,36,0.1)'},
  tabText:      {color:'#8b92a9',fontSize:13,fontWeight:'500'},
  tabTextActive:{color:'#E85D24',fontSize:13,fontWeight:'700'},
  heading:      {color:'#eef0f6',fontSize:19,fontWeight:'700',padding:16,textAlign:'right'},
  broadcastBtn: {backgroundColor:'rgba(232,93,36,0.15)',marginHorizontal:14,marginBottom:6,borderRadius:12,padding:16,alignItems:'center',borderWidth:1,borderColor:'rgba(232,93,36,0.3)'},
  broadcastText:{color:'#E85D24',fontWeight:'700',fontSize:14},
  userRow:      {flexDirection:'row',alignItems:'center',padding:16,borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,0.06)'},
  avatar:       {width:44,height:44,borderRadius:22,backgroundColor:'rgba(232,93,36,0.15)',justifyContent:'center',alignItems:'center'},
  userName:     {color:'#eef0f6',fontSize:14,fontWeight:'600',textAlign:'right'},
  userRole:     {color:'#8b92a9',fontSize:12,textAlign:'right',marginTop:2},
  chatHeader:   {flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:14,backgroundColor:'#1c2133',borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,0.07)'},
  backBtn:      {padding:4},
  backText:     {color:'#E85D24',fontSize:16,fontWeight:'600'},
  chatTitle:    {color:'#eef0f6',fontWeight:'700',fontSize:15},
  bubble:       {maxWidth:'75%',padding:12,borderRadius:16},
  myBubble:     {backgroundColor:'#E85D24',borderBottomRightRadius:3},
  theirBubble:  {backgroundColor:'#4a5568',borderBottomLeftRadius:3},
  bubbleSender: {color:'rgba(255,255,255,0.7)',fontSize:10,marginBottom:4,fontWeight:'700'},
  bubbleTime:   {color:'rgba(255,255,255,0.45)',fontSize:9,marginTop:5,textAlign:'left'},
  inputRow:     {flexDirection:'row',padding:12,borderTopWidth:1,borderTopColor:'rgba(255,255,255,0.07)',backgroundColor:'#1c2133',gap:8},
  input:        {flex:1,backgroundColor:'#0f1117',borderRadius:12,padding:12,color:'#eef0f6',fontSize:13,maxHeight:100,borderWidth:1,borderColor:'rgba(255,255,255,0.1)'},
  sendBtn:      {backgroundColor:'#E85D24',borderRadius:12,paddingHorizontal:18,justifyContent:'center'},
});