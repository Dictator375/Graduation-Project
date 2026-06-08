import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getPumps, createPump, updatePump } from '../../utils/api.js';

export default function AdminPumps() {
  const { t } = useAuth();
  const [pumps, setPumps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [editPump, setEditPump] = useState(null);

  // New pump state
  const [newPump, setNewPump] = useState({
    pump_number: '', uid: '', status: 'in_service', service_start_date: ''
  });

  function load() {
    getPumps().then(res => {
      setPumps(res.data);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setErrorMsg('');
    if (pumps.length >= 12) {
      setErrorMsg('الحد الأقصى هو 12 مضخة'); // Max limit is 12
      return;
    }
    
    try {
      await createPump(newPump);
      setMsg(t.success);
      setNewPump({ pump_number: '', uid: '', status: 'in_service', service_start_date: '' });
      load();
      setTimeout(() => setMsg(''), 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || t.error);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setErrorMsg('');
    try {
      await updatePump(editPump.id, editPump);
      setMsg(t.success);
      setEditPump(null);
      load();
      setTimeout(() => setMsg(''), 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || t.error);
    }
  }

  if (loading) return <div className="loading"><div className="spinner"/>&nbsp;{t.loading}</div>;

  return (
    <div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">{t.add} {t.pumpStr} (Max 12)</div>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>{t.pumpNumber}</label>
              <input className="input" type="number" min="1" max="100" required
                value={newPump.pump_number} onChange={e=>setNewPump(p=>({...p, pump_number: e.target.value}))} />
            </div>
            <div className="form-group">
              <label>UID (ID)</label>
              <input className="input" type="text"
                value={newPump.uid} onChange={e=>setNewPump(p=>({...p, uid: e.target.value}))} />
            </div>
            <div className="form-group">
              <label>{t.serviceStartDate}</label>
              <input className="input" type="date"
                value={newPump.service_start_date} onChange={e=>setNewPump(p=>({...p, service_start_date: e.target.value}))} />
            </div>
            {errorMsg && !editPump && <div style={{color:'var(--danger)',fontSize:13,marginBottom:10,textAlign:'center'}}>{errorMsg}</div>}
            {msg && !editPump && <div style={{color:'var(--success)',fontSize:13,marginBottom:10,textAlign:'center'}}>{msg}</div>}
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} disabled={pumps.length >= 12}>{t.add}</button>
          </form>
        </div>

        {editPump && (
          <div className="card">
            <div className="card-title">{t.edit} {t.pumpStr} #{editPump.pump_number}</div>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>{t.status}</label>
                <select className="select" value={editPump.status} onChange={e=>setEditPump(p=>({...p, status: e.target.value}))}>
                  <option value="in_service">{t.inService}</option>
                  <option value="out_of_service">{t.outOfService}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t.lastMaintenanceDate}</label>
                <input className="input" type="date"
                  value={editPump.last_maintenance_date || ''} onChange={e=>setEditPump(p=>({...p, last_maintenance_date: e.target.value}))} />
              </div>
              <div className="form-group">
                <label>{t.maintenanceLog}</label>
                <textarea className="input" rows="4" readOnly
                  value={editPump.maintenance_log || ''} style={{backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed'}} />
              </div>
              <div className="form-group">
                <label>{t.faultLog}</label>
                <textarea className="input" rows="4" readOnly
                  value={editPump.fault_log || ''} style={{backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed'}} />
              </div>
              {errorMsg && editPump && <div style={{color:'var(--danger)',fontSize:13,marginBottom:10,textAlign:'center'}}>{errorMsg}</div>}
              {msg && editPump && <div style={{color:'var(--success)',fontSize:13,marginBottom:10,textAlign:'center'}}>{msg}</div>}
              <div style={{display:'flex', gap:10}}>
                <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}}>{t.save}</button>
                <button type="button" className="btn btn-ghost" style={{flex:1,justifyContent:'center'}} onClick={() => setEditPump(null)}>{t.cancel}</button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="card" style={{marginTop:20}}>
        <div className="card-title">{t.pumps}</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t.pumpNumber}</th>
                <th>UID</th>
                <th>{t.status}</th>
                <th>{t.serviceStartDate}</th>
                <th>{t.lastMaintenanceDate}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {pumps.map(p => (
                <tr key={p.id}>
                  <td style={{fontWeight:'bold'}}>{p.pump_number}</td>
                  <td>{p.uid || '—'}</td>
                  <td>
                    {p.status === 'in_service' 
                      ? <span className="badge badge-success">{t.inService}</span>
                      : <span className="badge badge-danger">{t.outOfService}</span>
                    }
                  </td>
                  <td>{p.service_start_date ? new Date(p.service_start_date).toLocaleDateString('ar-DZ') : '—'}</td>
                  <td>{p.last_maintenance_date ? new Date(p.last_maintenance_date).toLocaleDateString('ar-DZ') : '—'}</td>
                  <td>
                    <button className="btn btn-sm btn-ghost" onClick={() => setEditPump(p)}>{t.edit}</button>
                  </td>
                </tr>
              ))}
              {pumps.length === 0 && <tr><td colSpan="6" style={{textAlign:'center'}}>{t.noData}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
