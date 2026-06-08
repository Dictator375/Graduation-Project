import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getThemeColors } from '../../utils/theme';
import { getMessageUsers, getTeamMembers, getConversation, getBroadcast, sendMessage } from '../../utils/api';
import { STATUS_BAR_HEIGHT, rs, rp, width } from '../../utils/layout';

const TABS = [
  { key: 'broadcast', icon: '📢' },
  { key: 'team',      icon: '👥' },
  { key: 'direct',    icon: '💬' },
];

export default function WorkerChat({ navigate, goBack }) {
  const { user, t, lang, theme } = useAuth();
  const c = getThemeColors(theme || 'dark');
  const [tab, setTab]               = useState('broadcast');
  const [users, setUsers]           = useState([]);
  const [team, setTeam]             = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [text, setText]             = useState('');
  const [loading, setLoading]       = useState(false);
  const flatListRef = useRef();

  useEffect(() => {
    getMessageUsers().then(r => setUsers(r.data || [])).catch(() => {});
    getTeamMembers().then(r  => setTeam(r.data  || [])).catch(() => {});
  }, []);

  useEffect(() => { loadMessages(); }, [tab, selectedUser]);

  async function loadMessages() {
    setLoading(true);
    try {
      if (tab === 'broadcast') {
        const res = await getBroadcast();
        setMessages(res.data || []);
      } else {
        if (!selectedUser) { setMessages([]); setLoading(false); return; }
        const res = await getConversation(selectedUser.id);
        setMessages(res.data || []);
      }
    } catch (e) {}
    setLoading(false);
  }

  async function handleSend() {
    if (!text.trim()) return;
    const receiverId = (tab !== 'broadcast' && selectedUser) ? selectedUser.id : null;
    if (tab !== 'broadcast' && !receiverId) return;
    try {
      await sendMessage({ receiver_id: receiverId, content: text, is_broadcast: false });
      setText('');
      loadMessages();
    } catch (e) {}
  }

  const tabLabels = {
    broadcast: t.sendToAll,
    team:      t.teamChat,
    direct:    t.directMessages,
  };

  // Can current user send in this tab?
  const canSend = tab !== 'broadcast' && (selectedUser !== null);

  const s = getStyles(c);

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : null}>
      <StatusBar backgroundColor={c.statusBar} barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
      <View style={s.safeTop} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={goBack} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t.chat}</Text>
        <View style={{ width: rp(40) }} />
      </View>

      {/* Tab Bar */}
      <View style={s.tabBar}>
        {TABS.map(tItem => (
          <TouchableOpacity
            key={tItem.key}
            style={[s.tab, tab === tItem.key && s.tabActive]}
            onPress={() => { setTab(tItem.key); setSelectedUser(null); }}
          >
            <Text style={{ fontSize: rs(16) }}>{tItem.icon}</Text>
            <Text style={[s.tabText, tab === tItem.key && s.tabTextActive]}>
              {tabLabels[tItem.key]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* User picker for team/direct */}
      {(tab === 'team' || tab === 'direct') && !selectedUser && (
        <FlatList
          data={tab === 'team' ? team : users}
          keyExtractor={i => i.id.toString()}
          contentContainerStyle={s.userList}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={s.emptyText}>{t.noMembers}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={s.userCard} onPress={() => setSelectedUser(item)}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{(lang === 'ar' ? (item.full_name_ar || item.full_name) : item.full_name)?.[0] || '?'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: rp(12) }}>
                <Text style={s.userName}>{lang === 'ar' ? (item.full_name_ar || item.full_name) : item.full_name}</Text>
                <Text style={s.userRole}>{t[item.role] || item.role}</Text>
              </View>
              <Text style={s.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Selected user header */}
      {(tab === 'team' || tab === 'direct') && selectedUser && (
        <View style={s.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedUser(null)} style={s.backBtn}>
            <Text style={s.backText}>‹</Text>
          </TouchableOpacity>
          <View style={s.chatAvatar}>
            <Text style={s.chatAvatarText}>{(lang === 'ar' ? (selectedUser.full_name_ar || selectedUser.full_name) : selectedUser.full_name)?.[0] || '?'}</Text>
          </View>
          <Text style={s.chatTarget}>{lang === 'ar' ? (selectedUser.full_name_ar || selectedUser.full_name) : selectedUser.full_name}</Text>
        </View>
      )}

      {/* Broadcast notice for non-managers */}
      {tab === 'broadcast' && user?.role !== 'manager' && (
        <View style={s.broadcastNotice}>
          <Text style={s.broadcastNoticeText}>
            {t.broadcastNotice}
          </Text>
        </View>
      )}

      {/* Messages list */}
      {(tab === 'broadcast' || selectedUser) && (
        <View style={{ flex: 1 }}>
          {loading
            ? <View style={s.center}><ActivityIndicator color="#E85D24" /></View>
            : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={m => m.id.toString()}
                contentContainerStyle={s.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                ListEmptyComponent={
                  <View style={s.emptyWrap}>
                    <Text style={{ fontSize: rs(36), marginBottom: rp(8) }}>💬</Text>
                    <Text style={s.emptyText}>{t.noMessages}</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isMe = item.sender_id === user?.id;
                  const date = new Date(item.created_at).toLocaleTimeString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <View style={[s.msgRow, { justifyContent: isMe ? 'flex-end' : 'flex-start' }]}>
                      {!isMe && (
                        <View style={s.msgAvatar}>
                          <Text style={s.msgAvatarText}>
                            {(lang === 'ar' ? (item.sender_name_ar || item.sender_name) : item.sender_name)?.[0] || '?'}
                          </Text>
                        </View>
                      )}
                      <View style={[s.msgBubble, isMe ? s.msgMe : s.msgOther, { maxWidth: width * 0.72 }]}>
                        {!isMe && tab === 'broadcast' && (
                          <Text style={s.msgSender}>{lang === 'ar' ? (item.sender_name_ar || item.sender_name) : item.sender_name}</Text>
                        )}
                        <Text style={[s.msgText, isMe && { color: '#fff' }]}>{item.content}</Text>
                        <Text style={[s.msgTime, isMe && { color: 'rgba(255,255,255,0.65)' }]}>{date}</Text>
                      </View>
                    </View>
                  );
                }}
              />
            )
          }

          {/* Input */}
          {canSend && (
            <View style={s.inputArea}>
              <TextInput
                style={s.input}
                value={text}
                onChangeText={setText}
                placeholder={t.typeMessage}
                placeholderTextColor={c.muted}
                multiline
                textAlign={lang === 'ar' ? 'right' : 'left'}
              />
              <TouchableOpacity style={[s.sendBtn, !text.trim() && { opacity: 0.4 }]} onPress={handleSend} disabled={!text.trim()}>
                <Text style={s.sendText}>➤</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const getStyles = (c) => StyleSheet.create({
  screen:             { flex: 1, backgroundColor: c.bg },
  safeTop:            { height: STATUS_BAR_HEIGHT, backgroundColor: c.statusBar },
  header:             { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border, paddingHorizontal: rp(8), paddingVertical: rp(12) },
  backBtn:            { width: rp(40), height: rp(40), justifyContent: 'center', alignItems: 'center' },
  backText:           { color: '#E85D24', fontSize: rs(26), fontWeight: '600', lineHeight: rs(30) },
  title:              { flex: 1, textAlign: 'center', color: c.text, fontSize: rs(17), fontWeight: '700' },
  tabBar:             { flexDirection: 'row', backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border },
  tab:                { flex: 1, paddingVertical: rp(10), alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', gap: rp(3) },
  tabActive:          { borderBottomColor: '#E85D24' },
  tabText:            { color: c.sub, fontSize: rs(11), fontWeight: '500' },
  tabTextActive:      { color: '#E85D24', fontWeight: '700' },
  userList:           { padding: rp(14), paddingBottom: rp(30) },
  userCard:           { flexDirection: 'row', alignItems: 'center', padding: rp(14), backgroundColor: c.card, borderRadius: 14, marginBottom: rp(8), borderWidth: 1, borderColor: c.border },
  avatar:             { width: rp(44), height: rp(44), borderRadius: rp(22), backgroundColor: 'rgba(232,93,36,0.15)', justifyContent: 'center', alignItems: 'center' },
  avatarText:         { color: '#E85D24', fontSize: rs(18), fontWeight: '700' },
  userName:           { color: c.text, fontSize: rs(14), fontWeight: '600' },
  userRole:           { color: c.sub, fontSize: rs(12), marginTop: 2 },
  chevron:            { color: '#E85D24', fontSize: rs(20), fontWeight: '600' },
  chatHeader:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rp(8), paddingVertical: rp(10), backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border, gap: rp(8) },
  chatAvatar:         { width: rp(34), height: rp(34), borderRadius: rp(17), backgroundColor: 'rgba(232,93,36,0.15)', justifyContent: 'center', alignItems: 'center' },
  chatAvatarText:     { color: '#E85D24', fontSize: rs(14), fontWeight: '700' },
  chatTarget:         { color: c.text, fontSize: rs(15), fontWeight: '600', flex: 1 },
  broadcastNotice:    { backgroundColor: 'rgba(232,93,36,0.08)', padding: rp(10), borderBottomWidth: 1, borderBottomColor: 'rgba(232,93,36,0.15)', alignItems: 'center' },
  broadcastNoticeText:{ color: c.sub, fontSize: rs(12) },
  center:             { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageList:        { padding: rp(14), paddingBottom: rp(10) },
  emptyWrap:          { alignItems: 'center', paddingTop: rp(50) },
  emptyText:          { color: c.muted, fontSize: rs(14) },
  msgRow:             { flexDirection: 'row', alignItems: 'flex-end', marginBottom: rp(10) },
  msgAvatar:          { width: rp(30), height: rp(30), borderRadius: rp(15), backgroundColor: 'rgba(232,93,36,0.12)', justifyContent: 'center', alignItems: 'center', marginRight: rp(6) },
  msgAvatarText:      { color: '#E85D24', fontSize: rs(11), fontWeight: '700' },
  msgBubble:          { padding: rp(10), borderRadius: 18 },
  msgMe:              { backgroundColor: '#E85D24', borderBottomRightRadius: 4, alignSelf: 'flex-end' },
  msgOther:           { backgroundColor: c.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: c.border },
  msgSender:          { color: '#E85D24', fontSize: rs(11), fontWeight: '700', marginBottom: rp(3) },
  msgText:            { color: c.text, fontSize: rs(14), lineHeight: rs(20) },
  msgTime:            { color: c.muted, fontSize: rs(10), alignSelf: 'flex-end', marginTop: rp(4) },
  inputArea:          { flexDirection: 'row', padding: rp(10), paddingBottom: Platform.OS === 'ios' ? rp(10) : rp(20), backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border, alignItems: 'flex-end', gap: rp(8) },
  input:              { flex: 1, backgroundColor: c.bg, borderRadius: 20, paddingHorizontal: rp(16), paddingTop: Platform.OS === 'ios' ? rp(12) : rp(8), paddingBottom: rp(10), color: c.text, fontSize: rs(14), borderWidth: 1, borderColor: c.border, minHeight: rp(44), maxHeight: rp(100), textAlignVertical: 'top' },
  sendBtn:            { width: rp(44), height: rp(44), borderRadius: rp(22), backgroundColor: '#E85D24', justifyContent: 'center', alignItems: 'center', marginBottom: Platform.OS === 'ios' ? 0 : rp(2) },
  sendText:           { color: '#fff', fontSize: rs(18) },
});
