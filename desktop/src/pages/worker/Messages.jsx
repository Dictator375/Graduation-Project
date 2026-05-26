import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMessageUsers, getTeamMembers, getConversation, getBroadcast, sendMessage } from '../../utils/api.js';

const TABS = [
  { key: 'manager',   label: '📞 المدير',  desc: 'تواصل مع المدير مباشرة' },
  { key: 'team',      label: '👥 فريقي',   desc: 'محادثة مع أعضاء فريقك' },
  { key: 'broadcast', label: '📢 الكل',    desc: 'رسائل عامة للجميع' },
  { key: 'direct',    label: '💬 مباشر',   desc: 'محادثة مع موظف محدد' },
];

export default function WorkerMessages() {
  const { user, t } = useAuth();
  const [activeTab,  setActiveTab]  = useState('manager');
  const [allUsers,   setAllUsers]   = useState([]);
  const [teamUsers,  setTeamUsers]  = useState([]);
  const [manager,    setManager]    = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [messages,   setMessages]   = useState([]);
  const [text,       setText]       = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    getMessageUsers().then(r => {
      const users = r.data || [];
      setAllUsers(users);
      setManager(users.find(u => u.role === 'manager') || null);
    }).catch(() => {});
    getTeamMembers().then(r => setTeamUsers(r.data || [])).catch(() => {});
  }, []);

  // Auto-select manager on manager tab
  useEffect(() => {
    if (activeTab === 'manager' && manager) {
      setSelected(manager);
    } else if (activeTab === 'broadcast') {
      setSelected(null);
    } else if (activeTab === 'team' || activeTab === 'direct') {
      setSelected(null);
    }
    setMessages([]);
  }, [activeTab, manager]);

  useEffect(() => {
    if (!selected && activeTab !== 'broadcast') return;
    const fetch = () => {
      if (activeTab === 'broadcast') {
        getBroadcast().then(r => setMessages(r.data || [])).catch(() => {});
      } else if (selected) {
        getConversation(selected.id).then(r => setMessages(r.data || [])).catch(() => {});
      }
    };
    fetch();
    const iv = setInterval(fetch, 5000);
    return () => clearInterval(iv);
  }, [selected, activeTab]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const receiver = activeTab === 'broadcast' ? null : selected?.id || null;
    await sendMessage({ receiver_id: receiver, content: text.trim() }).catch(() => {});
    setText('');
    if (activeTab === 'broadcast') {
      getBroadcast().then(r => setMessages(r.data || []));
    } else if (selected) {
      getConversation(selected.id).then(r => setMessages(r.data || []));
    }
  }

  const canChat  = activeTab === 'broadcast' || !!selected;
  const userList = activeTab === 'team'
    ? teamUsers
    : allUsers.filter(u => u.role !== 'manager');

  return (
    <div style={{ display: 'flex', gap: 14, height: 'calc(100vh - 120px)' }}>

      {/* Left panel: tabs + user list */}
      <div className="card" style={{ width: 240, flexShrink: 0, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Mode tabs */}
        <div style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>
          {TABS.map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '8px 10px', marginBottom: 3,
                borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                background: activeTab === tab.key ? 'var(--accent-muted)' : 'transparent',
                color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400,
                textAlign: 'right',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* User list for team/direct tabs */}
        {(activeTab === 'team' || activeTab === 'direct') && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 4px 8px', textAlign: 'right' }}>
              {activeTab === 'team' ? 'أعضاء فريقك' : 'جميع الموظفين'}
            </div>
            {userList.length === 0
              ? <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: 16 }}>
                  {activeTab === 'team' ? 'لا يوجد أعضاء في فريقك' : 'لا يوجد موظفون'}
                </div>
              : userList.map(u => (
                <button key={u.id}
                  onClick={() => setSelected(u)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '8px 10px', marginBottom: 3,
                    borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                    background: selected?.id === u.id ? 'var(--accent-muted)' : 'transparent',
                    color: selected?.id === u.id ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: 12, textAlign: 'right',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--bg-hover)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, flexShrink: 0,
                  }}>👤</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.full_name_ar || u.full_name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t[u.role] || u.role}</div>
                  </div>
                </button>
              ))
            }
          </div>
        )}

        {/* Info for manager/broadcast tabs */}
        {(activeTab === 'manager' || activeTab === 'broadcast') && (
          <div style={{ flex: 1, padding: '12px 14px' }}>
            <div style={{
              background: 'var(--accent-muted)', borderRadius: 'var(--radius-sm)',
              padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)',
              textAlign: 'right', lineHeight: 1.6,
            }}>
              {activeTab === 'manager'
                ? `📞 تتحدث مع:\n${manager?.full_name_ar || manager?.full_name || 'المدير'}`
                : '📢 رسائل مرئية لجميع الموظفين والمدير'
              }
            </div>
          </div>
        )}
      </div>

      {/* Right panel: chat */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>

        {/* Chat header */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            {activeTab === 'manager' ? '👤' : activeTab === 'broadcast' ? '📢' : activeTab === 'team' ? '👥' : '💬'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {activeTab === 'manager'   ? (manager?.full_name_ar || 'المدير')
               : activeTab === 'broadcast' ? 'رسائل للجميع'
               : activeTab === 'team'      ? `فريقي · ${selected ? (selected.full_name_ar || selected.full_name) : 'اختر عضواً'}`
               : selected ? (selected.full_name_ar || selected.full_name) : 'اختر موظفاً'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {TABS.find(t => t.key === activeTab)?.desc}
            </div>
          </div>
        </div>

        {/* Messages */}
        {!canChat ? (
          <div className="empty">
            <div className="empty-icon">💬</div>
            <div>اختر محادثة من القائمة</div>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.length === 0 && (
                <div className="empty" style={{ flex: 1 }}>
                  <div className="empty-icon">✉️</div>
                  <div>لا توجد رسائل بعد — ابدأ المحادثة</div>
                </div>
              )}
              {messages.map(msg => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-start' : 'flex-end' }}>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px', borderRadius: 14, fontSize: 13, lineHeight: 1.5,
                      background: isMe ? 'var(--accent)' : '#4a5568',
                      color: isMe ? '#fff' : '#eef0f6',
                      borderBottomRightRadius: isMe ? 3 : 14,
                      borderBottomLeftRadius: isMe ? 14 : 3,
                      border: isMe ? 'none' : '1px solid var(--border)',
                    }}>
                      {!isMe && (
                        <div style={{ fontSize: 10, opacity: .7, marginBottom: 3, fontWeight: 600 }}>
                          {msg.sender_name_ar || msg.sender_name}
                        </div>
                      )}
                      {msg.content}
                      <div style={{ fontSize: 9, opacity: .6, marginTop: 4, textAlign: 'left' }}>
                        {new Date(msg.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <input
                className="input"
                style={{ flex: 1 }}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={t.typeMessage}
              />
              <button className="btn btn-primary" type="submit" disabled={!text.trim()}>
                {t.send} ↑
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}