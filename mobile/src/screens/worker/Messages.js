import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getMessageUsers, getConversation, sendMessage } from '../../utils/api';

export default function WorkerMessages() {
  const { user, t } = useAuth();
  const [manager,  setManager]  = useState(null);
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const flatRef = useRef(null);

  useEffect(() => {
    getMessageUsers().then(r => {
      const mgr = r.data.find(u => u.role === 'manager');
      setManager(mgr || null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!manager) return;
    const fetch = () => getConversation(manager.id).then(r => setMessages(r.data));
    fetch();
    const iv = setInterval(fetch, 5000);
    return () => clearInterval(iv);
  }, [manager]);

  async function handleSend() {
    if (!text.trim() || !manager) return;
    await sendMessage({ receiver_id: manager.id, content: text.trim() });
    setText('');
    const r = await getConversation(manager.id);
    setMessages(r.data);
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#E85D24" /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatar}><Text style={{fontSize:18}}>👤</Text></View>
        <View>
          <Text style={s.headerName}>{manager?.full_name_ar || manager?.full_name || '—'}</Text>
          <Text style={s.headerRole}>{t.manager}</Text>
        </View>
        <View style={[s.dot, { backgroundColor: manager ? '#1D9E75' : '#E24B4A' }]} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={m => String(m.id)}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated:true })}
        contentContainerStyle={{ padding:12, gap:8 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{fontSize:32, marginBottom:8}}>💬</Text>
            <Text style={s.emptyText}>لا توجد رسائل بعد</Text>
            <Text style={s.emptySubText}>راسل المدير مباشرة من هنا</Text>
          </View>
        }
        renderItem={({ item:msg }) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <View style={{ alignItems: isMe ? 'flex-start' : 'flex-end' }}>
              <View style={[s.bubble, isMe ? s.myBubble : s.theirBubble]}>
                {!isMe && (
                  <Text style={{ color:'rgba(255,255,255,0.7)', fontSize:10, marginBottom:4, fontWeight:'700' }}>
                    {msg.sender_name_ar || msg.sender_name}
                  </Text>
                )}
                <Text style={{ color: isMe?'#fff':'#eef0f6', fontSize:13, lineHeight:20 }}>
                  {msg.content}
                </Text>
                <Text style={s.time}>
                  {new Date(msg.created_at).toLocaleTimeString('ar-DZ',{hour:'2-digit',minute:'2-digit'})}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Input */}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={text}
          onChangeText={setText}
          placeholder={t.typeMessage}
          placeholderTextColor="#555e7a"
          multiline
          textAlign="right"
          editable={!!manager}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!manager || !text.trim()) && { opacity:0.4 }]}
          onPress={handleSend}
          disabled={!manager || !text.trim()}
        >
          <Text style={{ color:'#fff', fontWeight:'700', fontSize:13 }}>{t.send}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:   { flex:1, backgroundColor:'#0f1117' },
  center:      { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#0f1117' },
  header:      { flexDirection:'row', alignItems:'center', gap:10, padding:14, backgroundColor:'#171b25', borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.07)' },
  avatar:      { width:40, height:40, borderRadius:20, backgroundColor:'rgba(232,93,36,.15)', justifyContent:'center', alignItems:'center' },
  headerName:  { color:'#eef0f6', fontWeight:'600', fontSize:14 },
  headerRole:  { color:'#8b92a9', fontSize:11 },
  dot:         { width:8, height:8, borderRadius:4, marginRight:'auto' },
  empty:       { flex:1, alignItems:'center', paddingTop:60 },
  emptyText:   { color:'#8b92a9', fontSize:14, fontWeight:'600' },
  emptySubText:{ color:'#555e7a', fontSize:12, marginTop:4 },
  bubble:      { maxWidth:'75%', padding:10, borderRadius:14, marginBottom:2 },
  myBubble:    { backgroundColor:'#E85D24', borderBottomRightRadius:3 },
  theirBubble: { backgroundColor:'#4a5568', borderBottomLeftRadius:3 },
  time:        { color:'rgba(255,255,255,.45)', fontSize:9, marginTop:4, textAlign:'left' },
  inputRow:    { flexDirection:'row', padding:10, borderTopWidth:1, borderTopColor:'rgba(255,255,255,0.07)', backgroundColor:'#171b25', gap:8 },
  input:       { flex:1, backgroundColor:'#1c2133', borderRadius:10, padding:10, color:'#eef0f6', fontSize:13, maxHeight:100, borderWidth:1, borderColor:'rgba(255,255,255,0.1)' },
  sendBtn:     { backgroundColor:'#E85D24', borderRadius:10, paddingHorizontal:16, justifyContent:'center' },
});
