import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getMessageUsers, getTeamMembers, getConversation, getBroadcast, sendMessage } from '../../utils/api';
import { STATUS_BAR_HEIGHT, TAB_BAR_HEIGHT, rs, rp } from '../../utils/layout';

const TABS = [
  { key: 'broadcast', label: '📢 الكل', icon: '📢' },
  { key: 'team', label: '👥 فريقي', icon: '👥' },
  { key: 'direct', label: '💬 مباشر', icon: '💬' },
];

export default function WorkerChat({ navigate }) {
  const { user, t } = useAuth();
  const [tab, setTab] = useState('broadcast');
  const [users, setUsers] = useState([]);
  const [team, setTeam] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatRef = useRef(null);

  useEffect(() => {
    getMessageUsers().then(r => setUsers(r.data || [])).catch(() => {});
    getTeamMembers().then(r => setTeam(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadMessages();
    const iv = setInterval(loadMessages, 5000);
    return () => clearInterval(iv);
  }, [tab, selected]);

  async function loadMessages() {
    try {
      if (tab === 'broadcast') {
        const r = await getBroadcast();
        setMessages(r.data || []);
      } else if (tab === 'team' && selected) {
        const r = await getConversation(selected.id);
        setMessages(r.data || []);
      } else if (tab === 'direct' && selected) {
        const r = await getConversation(selected.id);
        setMessages(r.data || []);
      } else {
        setMessages([]);
      }
    } catch {}
  }

  async function handleSend() {
    if (!text.trim()) return;
    const receiver = tab === 'broadcast' ? null : selected?.id || null;
    await sendMessage({ receiver_id: receiver, content: text.trim() }).catch(() => {});
    setText('');
    loadMessages();
  }

  const canChat = tab === 'broadcast' || !!selected;
  const currentList = tab === 'team' ? team : users.filter(u => u.role !== 'manager');

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.screen}>
      <StatusBar backgroundColor="#1c2133" barStyle="light-content" />
      <View style={s.safeTop} />

      {/* Navigation tabs */}
      <View style={s.navBar}>
        <TouchableOpacity style={s.navTab} onPress={() => navigate('home')}>
          <Text style={s.navText}>�  {t.dashboard}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navTab} onPress={() => navigate('sales')}>
          <Text style={s.navText}>⛽ {t.newSale}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navTab} onPress={() => navigate('messages')}>
          <Text style={s.navText}>📞 المدير</Text>
        </TouchableOpacity>
        <View style={[s.navTab, s.navActive]}>
          <Text style={s.navActiveText}>💬 دردشة</Text>
        </View>
      </View>

      {/* Chat mode tabs */}
      <View style={s.modeTabs}>
        {TABS.map(tb => (
          <TouchableOpacity
            key={tb.key}
            style={[s.modeTab, tab === tb.key && s.modeTabActive]}
            onPress={() => { setTab(tb.key); setSelected(null); setMessages([]); }}
          >
            <Text style={[s.modeTabText, tab === tb.key && s.modeTabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* User selector for team/direct */}
      {(tab === 'team' || tab === 'direct') && !selected && (
        <FlatList
          data={currentList}
          keyExtractor={u => String(u.id)}
          ListHeaderComponent={
            <Text style={s.selectHeader}>
              {tab === 'team' ? 'اختر زميلاً من فريقك' : 'اختر موظفاً للمحادثة'}
            </Text>
          }
          ListEmptyComponent={
            <Text style={s.empty}>
              {tab === 'team' ? 'لا يوجد أعضاء في فريقك' : 'لا يوجد موظفون آخرون'}
            </Text>
          }
          renderItem={({ item: u }) => (
            <TouchableOpacity style={s.userRow} onPress={() => setSelected(u)}>
              <View style={s.avatar}><Text style={{ fontSize: rs(18) }}>👤</Text></View>
              <View style={{ flex: 1, marginHorizontal: rp(12) }}>
                <Text style={s.userName}>{u.full_name_ar || u.full_name}</Text>
                <Text style={s.userRole}>{t[u.role] || u.role}</Text>
              </View>
              <Text style={{ color: '#E85D24', fontSize: rs(20) }}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Chat view */}
      {(tab === 'broadcast' || selected) && (
        <>
          {/* Chat header */}
          <View style={s.chatHeader}>
            {selected && (
              <TouchableOpacity onPress={() => { setSelected(null); setMessages([]); }}>
                <Text style={s.backText}>‹</Text>
              </TouchableOpacity>
            )}
            <Text style={s.chatTitle}>
              {tab === 'broadcast' ? '📢 رسائل للجميع' :
               tab === 'team' ? `👥 ${selected?.full_name_ar || selected?.full_name}` :
               `💬 ${selected?.full_name_ar || selected?.full_name}`}
            </Text>
          </View>

          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => String(m.id)}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={{ padding: rp(12), paddingBottom: rp(8) }}
            ListEmptyComponent={<Text style={s.empty}>لا توجد رسائل بعد — ابدأ المحادثة</Text>}
            renderItem={({ item: msg }) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <View style={{ alignItems: isMe ? 'flex-start' : 'flex-end', marginBottom: rp(8) }}>
                  <View style={[s.bubble, isMe ? s.myBubble : s.theirBubble]}>
                    {!isMe && (
                      <Text style={s.bubbleSender}>{msg.sender_name_ar || msg.sender_name}</Text>
                    )}
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
            />
            <TouchableOpacity
              style={[s.sendBtn, !text.trim() && { opacity: 0.4 }]}
              onPress={handleSend}
              disabled={!text.trim()}
            >
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
  navBar: { flexDirection: 'row', backgroundColor: '#1c2133', borderBottomWidth: 2, borderBottomColor: '#E85D24', height: TAB_BAR_HEIGHT },
  navTab: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2 },
  navActive: { borderBottomWidth: 3, borderBottomColor: '#E85D24', backgroundColor: 'rgba(232,93,36,0.12)' },
  navText: { color: '#8b92a9', fontSize: rs(10), fontWeight: '500', textAlign: 'center' },
  navActiveText: { color: '#E85D24', fontSize: rs(10), fontWeight: '700', textAlign: 'center' },
  modeTabs: { flexDirection: 'row', backgroundColor: '#171b25', padding: rp(8), gap: rp(8) },
  modeTab: { flex: 1, padding: rp(10), borderRadius: 10, alignItems: 'center', backgroundColor: '#1c2133', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  modeTabActive: { backgroundColor: '#E85D24', borderColor: '#E85D24' },
  modeTabText: { color: '#8b92a9', fontSize: rs(12), fontWeight: '600' },
  modeTabTextActive:{ color: '#fff', fontSize: rs(12), fontWeight: '700' },
  selectHeader: { color: '#eef0f6', fontSize: rs(14), fontWeight: '600', padding: rp(16), textAlign: 'right' },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: rp(16), borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  avatar: { width: rp(42), height: rp(42), borderRadius: rp(21), backgroundColor: 'rgba(232,93,36,0.15)', justifyContent: 'center', alignItems: 'center' },
  userName: { color: '#eef0f6', fontSize: rs(14), fontWeight: '600', textAlign: 'right' },
  userRole: { color: '#8b92a9', fontSize: rs(12), textAlign: 'right', marginTop: 2 },
  empty: { color: '#555e7a', textAlign: 'center', padding: rp(30), fontSize: rs(13) },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: rp(12), backgroundColor: '#1c2133', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', gap: rp(10) },
  backText: { color: '#E85D24', fontSize: rs(22), fontWeight: '700' },
  chatTitle: { color: '#eef0f6', fontSize: rs(14), fontWeight: '700', flex: 1, textAlign: 'right' },
  bubble: { maxWidth: '75%', padding: rp(12), borderRadius: 16 },
  myBubble: { backgroundColor: '#E85D24', borderBottomRightRadius: 3 },
  theirBubble: { backgroundColor: '#1c2133', borderBottomLeftRadius: 3 },
  bubbleSender: { color: 'rgba(255,255,255,0.7)', fontSize: rs(10), marginBottom: 3, fontWeight: '700' },
  bubbleTime: { color: 'rgba(255,255,255,0.45)', fontSize: rs(9), marginTop: 4, textAlign: 'left' },
  inputRow: { flexDirection: 'row', padding: rp(12), borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', backgroundColor: '#1c2133', gap: rp(8) },
  input: { flex: 1, backgroundColor: '#0f1117', borderRadius: 12, padding: rp(12), color: '#eef0f6', fontSize: rs(13), maxHeight: rp(100), borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sendBtn: { backgroundColor: '#E85D24', borderRadius: 12, paddingHorizontal: rp(18), justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '700', fontSize: rs(14) },
});
