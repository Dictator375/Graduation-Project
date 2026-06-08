import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getCredentials, updateCredentials } from '../../utils/api.js';

const ROLE_BADGE = { manager:'badge-accent', team_leader:'badge-info', worker:'badge-gray' };

export default function AdminCredentials() {
  const { t } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    getCredentials()
      .then(res => setUsers(res.data))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name_ar||'').includes(search) ||
    u.username.includes(search)
  );

  async function handleSave(id, data) {
    try {
      await updateCredentials(id, data);
      setEditing(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || t.error);
    }
  }

  if (loading) return <div className="loading"><div className="spinner"/>&nbsp;{t.loading}</div>;

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:18 }}>
        <input className="input" style={{flex:1}} placeholder={t.search + '...'} value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>{t.fullName}</th>
              <th>{t.usernameLabel || 'اسم المستخدم'}</th>
              <th>الدور</th>
              <th>{t.status}</th>
              <th>{t.actions}</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={5} style={{textAlign:'center',color:'var(--text-muted)',padding:32}}>{t.noData}</td></tr>
                : filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{fontWeight:500}}>{u.full_name_ar || u.full_name}</div>
                      <div style={{fontSize:11,color:'var(--text-muted)'}}>{u.full_name}</div>
                    </td>
                    <td style={{color:'var(--text-primary)', fontWeight:600}}>{u.username}</td>
                    <td><span className={`badge ${ROLE_BADGE[u.role]||'badge-gray'}`}>{t[u.role]||u.role}</span></td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {u.is_active ? t.active : t.inactive}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(u)}>
                        {t.changeCredentials || 'تغيير بيانات الدخول'}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <EditCredentialsModal user={editing} t={t} onSave={handleSave} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditCredentialsModal({ user, t, onSave, onClose }) {
  const [form, setForm] = useState({ username: user.username, password: '' });
  
  function set(k,v){ setForm(f=>({...f,[k]:v})); }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{ width: 400 }}>
        <div className="modal-title">{t.changeCredentials || 'تغيير بيانات الدخول'}: {user.full_name_ar || user.full_name}</div>
        
        <div className="form-group">
          <label>{t.usernameLabel || 'اسم المستخدم'}</label>
          <input className="input" value={form.username} onChange={e=>set('username',e.target.value)} />
        </div>
        
        <div className="form-group" style={{ marginTop: 15 }}>
          <label>{t.newPasswordLabel || 'كلمة المرور الجديدة'}</label>
          <input 
            className="input" 
            type="password" 
            placeholder="••••••••" 
            value={form.password} 
            onChange={e=>set('password',e.target.value)} 
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {t.lang === 'ar' 
              ? 'اترك الحقل فارغاً إذا كنت لا تريد تغيير كلمة المرور' 
              : 'Laissez vide si vous ne voulez pas changer le mot de passe'}
          </div>
        </div>

        <div style={{display:'flex',gap:8,marginTop:20}}>
          <button 
            className="btn btn-primary" 
            style={{flex:1,justifyContent:'center'}} 
            onClick={() => onSave(user.id, form)}
            disabled={!form.username || (form.password && form.password.length < 6)}
          >
            {t.save}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>{t.cancel}</button>
        </div>
      </div>
    </div>
  );
}
