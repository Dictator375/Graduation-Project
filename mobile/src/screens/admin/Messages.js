import React, { useState, useEffect, useRef } from 'react';
import {
   View, Text, FlatList, TextInput, TouchableOpacity,
   StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
   Alert, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getMessageUsers, getConversation, sendMessage } from '../../utils/api';
import { STATUS_BAR_HEIGHT, TAB_BAR_HEIGHT, rs, rp } from '../../utils/layout';

export default function AdminMessages({ navigate, goBack }) {
   const { user, t } = useAuth();
   const [users, setUsers] = useState([]);
   const [selected, setSelected] = useState(null);
   const [messages, setMessages] = useState([]);
   const [text, setText] = useState('');
   const [loading, setLoading] = useState(true);
   const flatRef = useRef(null);

   useEffect(() => {
      getMessageUsers()
         .then(r => setUsers(r.data || []))
         .catch(() => {})
         .finally(() => setLoading(false));
   }, []);

   useEffect(() => {
      if (!selected) { setMessages([]); return; }
      const fetch = () => getConversation(selected.id).then(r => setMessages(r.data || [])).catch(() => {});
      fetch();
      const iv = setInterval(fetch, 5000);
      return () => clearInterval(iv);
   }, [selected]);

   async function handleSend() {
      if (!text.trim()) return;
      try {
         await sendMessage({ receiver_id: selected?.id || null, content: text.trim() });
         setText('');
         if (selected) getConversation(selected.id).then(r => setMessages(r.data || []));
      } catch { Alert.alert('خطأ', 'فشل إرسال الرسالة'); }
   }

   return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.screen}>
         <StatusBar backgroundColor="#1c2133" barStyle="light-content" />
         <View style={s.safeTop} />

         <View style={s.header}>
            <TouchableOpacity onPress={selected ? () => { setSelected(null); setMessages([]); } : goBack}>
               <Text style={s.back}>‹ رجوع</Text>
            </TouchableOpacity>
            <Text style={s.title}>
               {selected ? (selected.full_name_ar || selected.full_name) : t.messages}
            </Text>
         </View>

         {!selected ? (
            <FlatList
               data={users}
               keyExtractor={u => String(u.id)}
               ListHeaderComponent={
                  <View>
                     <Text style={s.listHeading}>{t.messages}</Text>
                     {loading && <ActivityIndicator color="#E85D24" style={{ marginVertical: rp(20) }} />}
                     <TouchableOpacity style={s.broadcastBtn}
                        onPress={() => setSelected({ id: null, full_name_ar: 'إرسال للجميع' })}>
                        <Text style={s.broadcastText}> إرسال رسالة للجميع</Text>
                     </TouchableOpacity>
                  </View>
               }
               renderItem={({ item: u }) => (
                  <TouchableOpacity style={s.userRow} onPress={() => setSelected(u)}>
                     <View style={s.avatar}><Text style={{ fontSize: rs(20) }}></Text></View>
                     <View style={{ flex: 1, marginHorizontal: rp(12) }}>
                        <Text style={s.userName}>{u.full_name_ar || u.full_name}</Text>
                        <Text style={s.userRole}>{t[u.role] || u.role}</Text>
                     </View>
                     <Text style={{ color: '#E85D24', fontSize: rs(22) }}>›</Text>
                  </TouchableOpacity>
               )}
            />
         ) : (
            <>
               <FlatList
                  ref={flatRef}
                  data={messages}
                  keyExtractor={m => String(m.id)}
                  onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
                  contentContainerStyle={{ padding: rp(14), paddingBottom: rp(10) }}
                  ListEmptyComponent={<Text style={s.empty}>لا توجد رسائل بعد</Text>}
                  renderItem={({ item: msg }) => {
                     const isMe = msg.sender_id === user?.id;
                     return (
                        <View style={{ alignItems: isMe ? 'flex-start' : 'flex-end', marginBottom: rp(8) }}>
                           <View style={[s.bubble, isMe ? s.myBubble : s.theirBubble]}>
                              {!isMe && <Text style={s.bubbleSender}>{msg.sender_name_ar || msg.sender_name}</Text>}
                              <Text style={{ color: isMe ? '#fff' : '#eef0f6', fontSize: rs(13), lineHeight: rs(20) }}>
                                 {msg.content}
                              </Text>
                              <Text style={s.bubbleTime}>
                                 {new Date(msg.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
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
                     <Text style={s.sendText}>{t.send}</Text>
                  </TouchableOpacity>
               </View>
            </>
         )}
      </KeyboardAvoidingView>
   );
}

const s = StyleSheet.create({
   screen: { flex: 1, backgroundColor: '#0f1117' },
   safeTop: { height: STATUS_BAR_HEIGHT, backgroundColor: '#1c2133' },
   header: { backgroundColor: '#1c2133', padding: rp(14), flexDirection: 'row', alignItems: 'center', gap: rp(12), borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
   back: { color: '#E85D24', fontSize: rs(16), fontWeight: '600' },
   title: { color: '#eef0f6', fontSize: rs(15), fontWeight: '700', flex: 1, textAlign: 'right' },
   listHeading: { color: '#eef0f6', fontSize: rs(17), fontWeight: '700', padding: rp(16), textAlign: 'right' },
   broadcastBtn: { backgroundColor: 'rgba(232,93,36,0.15)', marginHorizontal: rp(14), marginBottom: rp(6), borderRadius: 12, padding: rp(16), alignItems: 'center', borderWidth: 1, borderColor: 'rgba(232,93,36,0.3)' },
   broadcastText: { color: '#E85D24', fontWeight: '700', fontSize: rs(14) },
   userRow: { flexDirection: 'row', alignItems: 'center', padding: rp(16), borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
   avatar: { width: rp(44), height: rp(44), borderRadius: rp(22), backgroundColor: 'rgba(232,93,36,0.15)', justifyContent: 'center', alignItems: 'center' },
   userName: { color: '#eef0f6', fontSize: rs(14), fontWeight: '600', textAlign: 'right' },
   userRole: { color: '#8b92a9', fontSize: rs(12), textAlign: 'right', marginTop: 2 },
   bubble: { maxWidth: '75%', padding: rp(12), borderRadius: 16 },
   myBubble: { backgroundColor: '#E85D24', borderBottomRightRadius: 3 },
   theirBubble: { backgroundColor: '#1c2133', borderBottomLeftRadius: 3 },
   bubbleSender: { color: 'rgba(255,255,255,0.7)', fontSize: rs(10), marginBottom: 3, fontWeight: '700' },
   bubbleTime: { color: 'rgba(255,255,255,0.45)', fontSize: rs(9), marginTop: 4, textAlign: 'left' },
   empty: { color: '#555e7a', textAlign: 'center', marginTop: rp(50), fontSize: rs(13) },
   inputRow: { flexDirection: 'row', padding: rp(12), borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', backgroundColor: '#1c2133', gap: rp(8) },
   input: { flex: 1, backgroundColor: '#0f1117', borderRadius: 12, padding: rp(12), color: '#eef0f6', fontSize: rs(13), maxHeight: rp(100), borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
   sendBtn: { backgroundColor: '#E85D24', borderRadius: 12, paddingHorizontal: rp(18), justifyContent: 'center' },
   sendText: { color: '#fff', fontWeight: '700', fontSize: rs(14) },
});