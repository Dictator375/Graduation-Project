import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMessageUsers, getConversation, sendMessage } from '../../utils/api.js';

export default function AdminMessages() {
  const { t, user } = useAuth();
  const [users,    setUsers]    = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const bottomRef  = useRef(null);

  useEffect(() => { getMessageUsers().then(r => setUsers(r.data)); }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    getConversation(selected.id).then(r => {
      setMessages(r.data);
      setLoading(false);
    });
    const interval = setInterval(() => {
      getConversation(selected.id).then(r => setMessages(r.data));
    }, 5000);
    return () => clearInterval(interval);
  }, [selected]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    await sendMessage({ receiver_id: selected?.id || null, content: text.trim() });
    setText('');
    if (selected) {
      const r = await getConversation(selected.id);
      setMessages(r.data);
    }
  }

  return (
    <div style={{display:'flex',gap:14,height:'calc(100vh - 120px)'}}>
      {/* User list */}
      <div className="card" style={{width:220,flexShrink:0,overflow:'hidden',display:'flex',flexDirection:'column',padding:0}}>
        <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',fontSize:13,fontWeight:600}}>المحادثات</div>
        <div style={{flex:1,overflowY:'auto',padding:8}}>
          <div
            onClick={()=>setSelected(null)}
            style={{
              padding:'10px 12px',borderRadius:'var(--radius-sm)',cursor:'pointer',marginBottom:4,fontSize:12,
              background: !selected?'var(--accent-muted)':'transparent',
              color: !selected?'var(--accent)':'var(--text-secondary)',
            }}
          >
            📢 إرسال للجميع
          </div>
          {users.map(u => (
            <div key={u.id}
              onClick={() => setSelected(u)}
              style={{
                padding:'10px 12px',borderRadius:'var(--radius-sm)',cursor:'pointer',marginBottom:4,
                background: selected?.id===u.id?'var(--accent-muted)':'transparent',
                color: selected?.id===u.id?'var(--accent)':'var(--text-secondary)',
              }}
            >
              <div style={{fontSize:12,fontWeight:500,color:'var(--text-primary)'}}>{u.full_name_ar||u.full_name}</div>
              <div style={{fontSize:10,color:'var(--text-muted)'}}>{t[u.role]||u.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div className="card" style={{flex:1,display:'flex',flexDirection:'column',padding:0,overflow:'hidden'}}>
        <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',fontSize:13,fontWeight:600}}>
          {selected ? (selected.full_name_ar||selected.full_name) : '📢 إرسال للجميع'}
        </div>

        <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:8}}>
          {loading && <div className="loading"><div className="spinner"/></div>}
          {messages.map(msg => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} style={{display:'flex',justifyContent:isMe?'flex-start':'flex-end'}}>
                <div style={{
                  maxWidth:'70%',padding:'9px 13px',borderRadius:12,fontSize:13,lineHeight:1.4,
                  background: isMe?'var(--accent)':'#4a5568',
                  color: isMe?'#fff':'#eef0f6',
                  borderBottomRightRadius: isMe?2:12,
                  borderBottomLeftRadius: isMe?12:2,
                }}>
                  {!isMe&&<div style={{fontSize:10,opacity:.7,marginBottom:3}}>{msg.sender_name_ar||msg.sender_name}</div>}
                  {msg.content}
                  <div style={{fontSize:9,opacity:.6,marginTop:4,textAlign:'left'}}>
                    {new Date(msg.created_at).toLocaleTimeString('ar-DZ',{hour:'2-digit',minute:'2-digit'})}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>

        <form onSubmit={handleSend} style={{padding:12,borderTop:'1px solid var(--border)',display:'flex',gap:8}}>
          <input className="input" style={{flex:1}} value={text} onChange={e=>setText(e.target.value)} placeholder={t.typeMessage} />
          <button className="btn btn-primary" type="submit">{t.send}</button>
        </form>
      </div>
    </div>
  );
}
