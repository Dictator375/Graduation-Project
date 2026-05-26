// ── Payroll Page ─────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getPayroll, createPayroll, deletePayroll } from '../../utils/api.js';

export default function AdminPayroll() {
  const { t } = useAuth();
  const [dates,   setDates]   = useState([]);
  const [form,    setForm]    = useState({ pay_date:'', description:'' });
  const [loading, setLoading] = useState(true);

  function load() { getPayroll().then(r=>setDates(r.data)).finally(()=>setLoading(false)); }
  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    await createPayroll(form);
    setForm({ pay_date:'', description:'' });
    load();
  }

  async function handleDelete(id) {
    await deletePayroll(id);
    load();
  }

  const today = new Date().toISOString().split('T')[0];
  const upcoming = dates.filter(d => d.pay_date >= today);
  const past     = dates.filter(d => d.pay_date <  today);

  if (loading) return <div className="loading"><div className="spinner"/>&nbsp;{t.loading}</div>;

  return (
    <div className="grid-2">
      {/* Add form */}
      <div className="card">
        <div className="card-title">إضافة موعد راتب</div>
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label>{t.payDate}</label>
            <input className="input" type="date" value={form.pay_date} onChange={e=>setForm(f=>({...f,pay_date:e.target.value}))} required />
          </div>
          <div className="form-group">
            <label>{t.notes}</label>
            <input className="input" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="مثال: رواتب شهر جوان 2026" />
          </div>
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}}>{t.add}</button>
        </form>
      </div>

      {/* List */}
      <div>
        <div className="card" style={{marginBottom:14}}>
          <div className="card-title">📅 مواعيد قادمة</div>
          {upcoming.length === 0
            ? <div className="empty" style={{padding:16}}>لا توجد مواعيد قادمة</div>
            : upcoming.map(d=>(
              <div key={d.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontSize:22}}>💰</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,color:'var(--success)'}}>{new Date(d.pay_date).toLocaleDateString('ar-DZ',{year:'numeric',month:'long',day:'numeric'})}</div>
                  <div style={{fontSize:12,color:'var(--text-secondary)'}}>{d.description||''}</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(d.id)}>✕</button>
              </div>
            ))
          }
        </div>

        {past.length > 0 && (
          <div className="card">
            <div className="card-title" style={{color:'var(--text-muted)'}}>سابقة</div>
            {past.slice(-5).reverse().map(d=>(
              <div key={d.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)',opacity:.6}}>
                <span style={{fontSize:18}}>✓</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13}}>{new Date(d.pay_date).toLocaleDateString('ar-DZ')}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>{d.description||''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
