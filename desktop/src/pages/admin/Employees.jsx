import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getEmployees, updateEmployee, deleteEmployee, getTeams } from '../../utils/api.js';

const ROLE_BADGE = { manager:'badge-accent', team_leader:'badge-info', worker:'badge-gray' };

export default function AdminEmployees() {
  const { t } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [teams,     setTeams]     = useState([]);
  const [search,    setSearch]    = useState('');
  const [editing,   setEditing]   = useState(null);
  const [loading,   setLoading]   = useState(true);

  function load() {
    Promise.all([getEmployees(), getTeams()]).then(([e,tm]) => {
      setEmployees(e.data); setTeams(tm.data);
    }).finally(() => setLoading(false));
  }
  useEffect(load, []);

  const filtered = employees.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (e.full_name_ar||'').includes(search) ||
    e.username.includes(search)
  );

  async function handleDeactivate(id) {
    if (!window.confirm(t.confirm + '?')) return;
    await deleteEmployee(id);
    load();
  }

  async function handleSave(id, data) {
    await updateEmployee(id, data);
    setEditing(null);
    load();
  }

  if (loading) return <div className="loading"><div className="spinner"/>&nbsp;{t.loading}</div>;

  return (
    <div>
      {/* Search */}
      <div style={{ display:'flex', gap:10, marginBottom:18 }}>
        <input className="input" style={{flex:1}} placeholder={t.search + '...'} value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>{t.fullName}</th><th>{t.username}</th><th>الدور</th>
              <th>{t.team}</th><th>{t.phone}</th><th>{t.salary}</th><th>{t.status}</th><th>{t.actions}</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8} style={{textAlign:'center',color:'var(--text-muted)',padding:32}}>{t.search}</td></tr>
                : filtered.map(emp => {
                  const team = teams.find(tm => tm.id === emp.team_id);
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div style={{fontWeight:500}}>{emp.full_name_ar || emp.full_name}</div>
                        <div style={{fontSize:11,color:'var(--text-muted)'}}>{emp.full_name}</div>
                      </td>
                      <td style={{color:'var(--text-secondary)'}}>{emp.username}</td>
                      <td><span className={`badge ${ROLE_BADGE[emp.role]||'badge-gray'}`}>{t[emp.role]||emp.role}</span></td>
                      <td style={{fontSize:12}}>{team?.name_ar || '—'}</td>
                      <td style={{fontSize:12}}>{emp.phone || '—'}</td>
                      <td style={{fontSize:12}}>{emp.salary ? `${Number(emp.salary).toLocaleString()} دج` : '—'}</td>
                      <td>
                        <span className={`badge ${emp.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {emp.is_active ? t.active : t.inactive}
                        </span>
                      </td>
                      <td>
                        <div style={{display:'flex',gap:5}}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(emp)}>{t.edit}</button>
                          {emp.is_active && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(emp.id)}>{t.delete}</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editing && <EditModal emp={editing} teams={teams} t={t} onSave={handleSave} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditModal({ emp, teams, t, onSave, onClose }) {
  const [form, setForm] = useState({
    full_name: emp.full_name, full_name_ar: emp.full_name_ar||'',
    role: emp.role, team_id: emp.team_id||'', phone: emp.phone||'',
    salary: emp.salary||'', is_active: emp.is_active,
  });
  function set(k,v){ setForm(f=>({...f,[k]:v})); }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">{t.edit}: {emp.full_name_ar||emp.full_name}</div>
        <div className="grid-2">
          <div className="form-group"><label>الاسم (فرنسي)</label><input className="input" value={form.full_name} onChange={e=>set('full_name',e.target.value)}/></div>
          <div className="form-group"><label>الاسم (عربي)</label><input className="input" value={form.full_name_ar} onChange={e=>set('full_name_ar',e.target.value)}/></div>
        </div>
        <div className="grid-2">
          <div className="form-group"><label>{t.team}</label>
            <select className="select" value={form.team_id} onChange={e=>set('team_id',e.target.value)}>
              <option value="">—</option>
              {teams.map(tm=><option key={tm.id} value={tm.id}>{tm.name_ar}</option>)}
            </select>
          </div>
          <div className="form-group"><label>الدور</label>
            <select className="select" value={form.role} onChange={e=>set('role',e.target.value)}>
              <option value="worker">{t.worker}</option>
              <option value="team_leader">{t.team_leader}</option>
            </select>
          </div>
        </div>
        <div className="grid-2">
          <div className="form-group"><label>{t.phone}</label><input className="input" value={form.phone} onChange={e=>set('phone',e.target.value)}/></div>
          <div className="form-group"><label>{t.salary} (دج)</label><input className="input" type="number" value={form.salary} onChange={e=>set('salary',e.target.value)}/></div>
        </div>
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}} onClick={()=>onSave(emp.id,form)}>{t.save}</button>
          <button className="btn btn-ghost" onClick={onClose}>{t.cancel}</button>
        </div>
      </div>
    </div>
  );
}
