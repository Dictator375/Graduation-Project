import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getInstitutions, createInstitution, updateInstitution, deleteInstitution } from '../../utils/api.js';

export default function AdminInstitutions() {
  const { t } = useAuth();
  const [list,    setList]    = useState([]);
  const [editing, setEditing] = useState(null);  // null | 'new' | object
  const [form,    setForm]    = useState({ name:'', contact_person:'', phone:'', address:'', tax_number:'', notes:'' });
  const [loading, setLoading] = useState(true);

  function load() { getInstitutions().then(r=>setList(r.data)).finally(()=>setLoading(false)); }
  useEffect(load, []);

  function openNew() { setForm({name:'',contact_person:'',phone:'',address:'',tax_number:'',notes:''}); setEditing('new'); }
  function openEdit(inst) { setForm({...inst}); setEditing(inst); }

  async function handleSave(e) {
    e.preventDefault();
    if (editing === 'new') { await createInstitution(form); }
    else { await updateInstitution(editing.id, form); }
    setEditing(null);
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm(t.confirm + '?')) return;
    await deleteInstitution(id);
    load();
  }

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  return (
    <div>
      <div style={{marginBottom:16,display:'flex',justifyContent:'flex-end'}}>
        <button className="btn btn-primary" onClick={openNew}>➕ {t.add}</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t.name}</th><th>جهة الاتصال</th><th>{t.phone}</th><th>العنوان</th><th>الرقم الضريبي</th><th>{t.actions}</th></tr></thead>
            <tbody>
              {list.length === 0
                ? <tr><td colSpan={6} style={{textAlign:'center',padding:32,color:'var(--text-muted)'}}>لا توجد مؤسسات</td></tr>
                : list.map(inst=>(
                  <tr key={inst.id}>
                    <td style={{fontWeight:500}}>{inst.name}</td>
                    <td style={{fontSize:12}}>{inst.contact_person||'—'}</td>
                    <td style={{fontSize:12}}>{inst.phone||'—'}</td>
                    <td style={{fontSize:12}}>{inst.address||'—'}</td>
                    <td style={{fontSize:12}}>{inst.tax_number||'—'}</td>
                    <td>
                      <div style={{display:'flex',gap:6}}>
                        <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(inst)}>{t.edit}</button>
                        <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(inst.id)}>{t.delete}</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={()=>setEditing(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">{editing==='new'?'مؤسسة جديدة':t.edit}</div>
            <form onSubmit={handleSave}>
              <div className="form-group"><label>{t.name}</label><input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required /></div>
              <div className="grid-2">
                <div className="form-group"><label>جهة الاتصال</label><input className="input" value={form.contact_person||''} onChange={e=>setForm(f=>({...f,contact_person:e.target.value}))} /></div>
                <div className="form-group"><label>{t.phone}</label><input className="input" value={form.phone||''} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></div>
              </div>
              <div className="form-group"><label>العنوان</label><input className="input" value={form.address||''} onChange={e=>setForm(f=>({...f,address:e.target.value}))} /></div>
              <div className="form-group"><label>الرقم الضريبي</label><input className="input" value={form.tax_number||''} onChange={e=>setForm(f=>({...f,tax_number:e.target.value}))} /></div>
              <div className="form-group"><label>{t.notes}</label><textarea className="input" rows={2} value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}} type="submit">{t.save}</button>
                <button className="btn btn-ghost" type="button" onClick={()=>setEditing(null)}>{t.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
