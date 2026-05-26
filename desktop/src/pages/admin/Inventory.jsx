import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getInventory, refillInventory, updateFuelPrice, getRefillHistory } from '../../utils/api.js';

export default function AdminInventory() {
  const { t } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [history,   setHistory]   = useState([]);
  const [refill,    setRefill]    = useState({ fuel_type_id:'', quantity_liters:'', cost_per_liter:'', supplier:'' });
  const [priceEdit, setPriceEdit] = useState({});
  const [msg,       setMsg]       = useState('');
  const [loading,   setLoading]   = useState(true);

  function load() {
    Promise.all([getInventory(), getRefillHistory()]).then(([inv, hist]) => {
      setInventory(inv.data); setHistory(hist.data);
    }).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleRefill(e) {
    e.preventDefault();
    await refillInventory(refill);
    setMsg('تم الملء بنجاح ✓');
    setRefill({ fuel_type_id:'', quantity_liters:'', cost_per_liter:'', supplier:'' });
    load();
    setTimeout(() => setMsg(''), 2000);
  }

  async function handlePriceUpdate(id) {
    const price = priceEdit[id];
    if (!price) return;
    await updateFuelPrice(id, parseFloat(price));
    setPriceEdit(p=>({...p,[id]:''}));
    load();
  }

  if (loading) return <div className="loading"><div className="spinner"/>&nbsp;{t.loading}</div>;

  return (
    <div>
      {/* Tank levels */}
      <div className="grid-2" style={{marginBottom:20}}>
        {inventory.map(inv => {
          const cap = 30000;
          const pct = Math.min(100, Math.round((inv.quantity_liters / cap)*100));
          const col = pct<20?'var(--danger)':pct<40?'var(--warning)':'var(--success)';
          return (
            <div className="card" key={inv.id}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div>
                  <div style={{fontWeight:600,fontSize:15}}>{inv.name_ar}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>{inv.name}</div>
                </div>
                {pct < 20 && <span className="badge badge-danger">{t.criticalStock}</span>}
                {pct>=20 && pct<40 && <span className="badge badge-warning">{t.lowStock}</span>}
                {pct >= 40 && <span className="badge badge-success">مستوى جيد</span>}
              </div>

              <div className="fuel-bar-track" style={{marginBottom:8}}>
                <div className="fuel-bar-fill" style={{width:`${pct}%`,background:col}}/>
              </div>

              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-secondary)',marginBottom:12}}>
                <span>{Number(inv.quantity_liters).toLocaleString()} L متبقية</span>
                <span style={{color:col,fontWeight:600}}>{pct}%</span>
              </div>

              {/* Price edit */}
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <input className="input" style={{flex:1,padding:'5px 8px'}} type="number" step="0.5"
                  placeholder={`السعر الحالي: ${inv.price_per_liter} دج/L`}
                  value={priceEdit[inv.id]||''}
                  onChange={e=>setPriceEdit(p=>({...p,[inv.id]:e.target.value}))}
                />
                <button className="btn btn-ghost btn-sm" onClick={()=>handlePriceUpdate(inv.id)}>تحديث السعر</button>
              </div>
              <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>
                آخر ملء: {inv.last_refill_date ? new Date(inv.last_refill_date).toLocaleDateString('ar-DZ') : '—'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid-2">
        {/* Refill form */}
        <div className="card">
          <div className="card-title">{t.refillNow}</div>
          <form onSubmit={handleRefill}>
            <div className="form-group">
              <label>{t.fuelType}</label>
              <select className="select" value={refill.fuel_type_id} onChange={e=>setRefill(r=>({...r,fuel_type_id:e.target.value}))} required>
                <option value="">— اختر —</option>
                {inventory.map(inv=><option key={inv.id} value={inv.id}>{inv.name_ar}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>الكميّة (لتر)</label>
              <input className="input" type="number" min="1" value={refill.quantity_liters}
                onChange={e=>setRefill(r=>({...r,quantity_liters:e.target.value}))} required />
            </div>
            <div className="form-group">
              <label>سعر الشراء (دج/L)</label>
              <input className="input" type="number" step="0.01" value={refill.cost_per_liter}
                onChange={e=>setRefill(r=>({...r,cost_per_liter:e.target.value}))} />
            </div>
            <div className="form-group">
              <label>المورّد</label>
              <input className="input" value={refill.supplier}
                onChange={e=>setRefill(r=>({...r,supplier:e.target.value}))} />
            </div>
            {msg && <div style={{color:'var(--success)',fontSize:13,marginBottom:10,textAlign:'center'}}>{msg}</div>}
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}}>{t.save}</button>
          </form>
        </div>

        {/* Refill history */}
        <div className="card">
          <div className="card-title">سجل الملء</div>
          <div className="table-wrap" style={{maxHeight:320,overflowY:'auto'}}>
            <table>
              <thead><tr><th>الوقود</th><th>الكميّة</th><th>التكلفة</th><th>التاريخ</th></tr></thead>
              <tbody>
                {history.slice(0,20).map(h=>(
                  <tr key={h.id}>
                    <td>{h.name_ar}</td>
                    <td>{Number(h.quantity_liters).toLocaleString()} L</td>
                    <td style={{fontSize:12}}>{h.total_cost ? `${Number(h.total_cost).toLocaleString()} دج` : '—'}</td>
                    <td style={{fontSize:11,color:'var(--text-muted)'}}>{new Date(h.refill_date).toLocaleDateString('ar-DZ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
