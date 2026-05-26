import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { registerWorker, getTeams } from '../utils/api.js';

export default function Register() {
  const { t } = useAuth();
  const [teams, setTeams]   = useState([]);
  const [form,  setForm]    = useState({
    full_name: '', full_name_ar: '', username: '', password: '',
    role: 'worker', team_id: '', phone: '', national_id: '', hire_date: '', salary: '',
  });
  const [msg,   setMsg]     = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { getTeams().then(r => setTeams(r.data)); }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setMsg({ text: '', type: '' });
    try {
      await registerWorker(form);
      setMsg({ text: t.success, type: 'success' });
      setForm({ full_name:'',full_name_ar:'',username:'',password:'',role:'worker',team_id:'',phone:'',national_id:'',hire_date:'',salary:'' });
    } catch (err) {
      setMsg({ text: err.response?.data?.error || t.error, type: 'error' });
    } finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="card">
        <div className="card-title">{t.register}</div>

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label>{t.fullName} (بالفرنسية)</label>
              <input className="input" value={form.full_name} onChange={e=>set('full_name',e.target.value)} required />
            </div>
            <div className="form-group">
              <label>{t.fullName} (بالعربية)</label>
              <input className="input" value={form.full_name_ar} onChange={e=>set('full_name_ar',e.target.value)} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>{t.username}</label>
              <input className="input" value={form.username} onChange={e=>set('username',e.target.value)} required />
            </div>
            <div className="form-group">
              <label>{t.password}</label>
              <input className="input" type="password" value={form.password} onChange={e=>set('password',e.target.value)} required minLength={6} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>{t.team}</label>
              <select className="select" value={form.team_id} onChange={e=>set('team_id',e.target.value)}>
                <option value="">— {t.team} —</option>
                {teams.map(tm=><option key={tm.id} value={tm.id}>{tm.name_ar}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>الدور / Rôle</label>
              <select className="select" value={form.role} onChange={e=>set('role',e.target.value)}>
                <option value="worker">{t.worker}</option>
                <option value="team_leader">{t.team_leader}</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>{t.phone}</label>
              <input className="input" value={form.phone} onChange={e=>set('phone',e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t.nationalId}</label>
              <input className="input" value={form.national_id} onChange={e=>set('national_id',e.target.value)} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>{t.hireDate}</label>
              <input className="input" type="date" value={form.hire_date} onChange={e=>set('hire_date',e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t.salary} (دج)</label>
              <input className="input" type="number" value={form.salary} onChange={e=>set('salary',e.target.value)} min="0" />
            </div>
          </div>

          {msg.text && (
            <div style={{ color: msg.type==='success'?'var(--success)':'var(--danger)', fontSize:13, marginBottom:12, textAlign:'center' }}>
              {msg.text}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'100%', justifyContent:'center' }}>
            {loading ? t.loading : t.register}
          </button>
        </form>
      </div>
    </div>
  );
}