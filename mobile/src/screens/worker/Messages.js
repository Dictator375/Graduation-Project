import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getMessageUsers, getConversation, sendMessage } from '../../utils/api';
import { STATUS_BAR_HEIGHT, TAB_BAR_HEIGHT, rs, rp } from '../../utils/layout';

export default function WorkerMessages({ navigate }) {
  const { user, t } = useAuth();
  const [manager,  setManager]  = useState(null);
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const flatRef = useRef(null);

  useEffect(() => {
    getMessageUsers()
      .then(r => {
        const mgr = (r.data || []).find(u => u.role === 'manager');
        setManager(mgr || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!manager) return;
    const fetch = () =>
      getConversation(manager.id)
        .then(r => setMessages(r.data || []))
        .catch(() => {});
    fetch();
    const iv = setInterval(fetch, 5000);
    return () => clearInterval(iv);
  }, [manager]);

  async function handleSend() {
    if (!text.trim() || !manager) return;
    await sendMessage({ receiver_id: manager.id, content: text.trim() });
    setText('');
    getConversation(manager.id).then(r => setMessages(r.data || []));
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.screen}
    >
      <StatusBar backgroundColor="#1c2133" barStyle="light-content" />
      <View style={s.safeTop} />

      {/* Tab bar */}
      <View style={s.tabBar}>
        <TouchableOpacity style={s.tab} onPress={() => navigate('home')}>
          <Text style={s.tabText}>�   {t.dashboard}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.tab} onPress={() => navigate('sales')}>
          <Text style={s.tabText}>⛽  {t.newSale}</Text>
        </TouchableOpacity>
        <View style={[s.tab, s.tabActive]}>
          <Text style={s.tabTextActive}>💬  {t.messages}</Text>
        </View>
      </View>

      {/* Manager header */}
      <View style={s.mgrHeader}>
        <View style={s.mgrAvatar}>
          <Text style={{ fontSize: rs(20) }}>👤</Text>
        </View>
        <View style={{ flex: 1, marginRight: rp(10) }}>
          <Text style={s.mgrName}>{manager?.full_name_ar || manager?.full_name || '—'}</Text>
          <Text style={s.mgrRole}>{t.manager}</Text>
        </View>
        <View style={[s.dot, { backgroundColor: manager ? '#1D9E75' : '#E24B4A' }]} />
      </View>

      {loading
        ? <View style={s.center}><ActivityIndicator color="#E85D24" /></View>
        : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => String(m.id)}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={{ padding: rp(14), paddingBottom: rp(10) }}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Text style={{ fontSize: rs(40), marginBottom: rp(10) }}>💬</Text>
                <Text style={s.emptyText}>لا توجد رسائل بعد</Text>
                <Text style={s.emptySub}>راسل المدير مباشرة من هنا</Text>
              </View>
            }
            renderItem={({ item: msg }) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <View style={{ alignItems: isMe ? 'flex-start' : 'flex-end', marginBottom: rp(8) }}>
                  <View style={[s.bubble, isMe ? s.myBubble : s.theirBubble]}>
                    <Text style={{ color: isMe ? '#fff' : '#eef0f6', fontSize: rs(13), lineHeight: rs(20) }}>
                      {msg.content}
                    </Text>
                    <Text style={s.time}>
                      {new Date(msg.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )
      }

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
          style={[s.sendBtn, (!manager || !text.trim()) && { opacity: 0.4 }]}
          onPress={handleSend}
          disabled={!manager || !text.trim()}
        >
          <Text style={s.sendText}>{t.send}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#0f1117' },
  safeTop:       { height: STATUS_BAR_HEIGHT, backgroundColor: '#1c2133' },
  tabBar:        { flexDirection: 'row', backgroundColor: '#1c2133', borderBottomWidth: 2, borderBottomColor: '#E85D24', height: TAB_BAR_HEIGHT },
  tab:           { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2 },
  tabActive:     { borderBottomWidth: 3, borderBottomColor: '#E85D24', backgroundColor: 'rgba(232,93,36,0.12)' },
  tabText:       { color: '#8b92a9', fontSize: rs(11), fontWeight: '500', textAlign: 'center' },
  tabTextActive: { color: '#E85D24', fontSize: rs(11), fontWeight: '700', textAlign: 'center' },
  mgrHeader:     { flexDirection: 'row', alignItems: 'center', padding: rp(14), backgroundColor: '#1c2133', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  mgrAvatar:     { width: rp(44), height: rp(44), borderRadius: rp(22), backgroundColor: 'rgba(232,93,36,0.15)', justifyContent: 'center', alignItems: 'center', marginLeft: rp(10) },
  mgrName:       { color: '#eef0f6', fontWeight: '600', fontSize: rs(14), textAlign: 'right' },
  mgrRole:       { color: '#8b92a9', fontSize: rs(11), textAlign: 'right' },
  dot:           { width: rp(10), height: rp(10), borderRadius: rp(5) },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap:     { alignItems: 'center', paddingTop: rp(60) },
  emptyText:     { color: '#8b92a9', fontSize: rs(14), fontWeight: '600' },
  emptySub:      { color: '#555e7a', fontSize: rs(12), marginTop: 4 },
  bubble:        { maxWidth: '75%', padding: rp(12), borderRadius: 16 },
  myBubble:      { backgroundColor: '#E85D24', borderBottomRightRadius: 3 },
  theirBubble:   { backgroundColor: '#1c2133', borderBottomLeftRadius: 3 },
  time:          { color: 'rgba(255,255,255,0.45)', fontSize: rs(9), marginTop: 4, textAlign: 'left' },
  inputRow:      { flexDirection: 'row', padding: rp(12), borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', backgroundColor: '#1c2133', gap: rp(8) },
  input:         { flex: 1, backgroundColor: '#0f1117', borderRadius: 12, padding: rp(12), color: '#eef0f6', fontSize: rs(13), maxHeight: rp(100), borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sendBtn:       { backgroundColor: '#E85D24', borderRadius: 12, paddingHorizontal: rp(18), justifyContent: 'center' },
  sendText:      { color: '#fff', fontWeight: '700', fontSize: rs(14) },
});