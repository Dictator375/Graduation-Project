import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getInventory, refillInventory, updateFuelPrice, getRefillHistory } from '../../utils/api.js';

export default function AdminInventory() {
  const { t, lang } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [history,   setHistory]   = useState([]);
  const [refill,    setRefill]    = useState({ fuel_type_id:'', quantity_liters:'', cost_per_liter:'', supplier:'', demand_date:'', tax_rate:'0.19' });
  const [priceEdit, setPriceEdit] = useState({});
  const [msg,       setMsg]       = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [loading,   setLoading]   = useState(true);

  function load() {
    Promise.all([getInventory(), getRefillHistory()]).then(([inv, hist]) => {
      setInventory(inv.data); setHistory(hist.data);
    }).finally(() => setLoading(false));
  }
  useEffect(load, []);

  const [errorMsg,  setErrorMsg]  = useState('');

  async function handleRefill(e) {
    e.preventDefault();
    setErrorMsg('');
    try {
      await refillInventory(refill);
      setMsg('تم الملء بنجاح ✓');
      setRefill({ fuel_type_id:'', quantity_liters:'', cost_per_liter:'', supplier:'', demand_date:'', tax_rate:'0.19' });
      load();
      setTimeout(() => setMsg(''), 2000);
    } catch (err) {
      if (err.response?.data?.code === 'CAPACITY_EXCEEDED') {
        setErrorMsg(lang === 'ar' ? 'كمية الوقود المضافة تتجاوز سعة الخزان. يرجى المحاولة بكمية أقل.' : 'La quantité de carburant à ajouter dépasse la capacité du réservoir. Veuillez réessayer avec une plus petite quantité.');
      } else {
        setErrorMsg(err.response?.data?.error || t.error || 'حدث خطأ');
      }
    }
  }

  function getFilteredHistory() {
    if (filterPeriod === 'all') return history;
    const now = new Date();
    return history.filter(h => {
      const d = new Date(h.refill_date);
      if (filterPeriod === 'daily') return d.toDateString() === now.toDateString();
      if (filterPeriod === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (filterPeriod === 'yearly') return d.getFullYear() === now.getFullYear();
      if (filterPeriod === 'weekly') {
        const diff = now - d;
        return diff <= 7 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }

  function printHistory() {
    const data = getFilteredHistory();
    const html = `
      <html dir="rtl">
      <head>
        <title>سجل الملء - ${t.appName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f2f2f2; }
          h2 { text-align: center; }
        </style>
      </head>
      <body>
        <h2>سجل ملء المخزون</h2>
        <p>التاريخ: ${new Date().toLocaleDateString('ar-DZ')}</p>
        <table>
          <thead>
            <tr>
              <th>الوقود</th>
              <th>الكميّة</th>
              <th>التكلفة</th>
              <th>المورّد</th>
              <th>${t.demandDate}</th>
              <th>${t.arrivalDate}</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(h => `
              <tr>
                <td>${h.name_ar}</td>
                <td>${Number(h.quantity_liters).toLocaleString()} L</td>
                <td>${h.total_cost ? Number(h.total_cost).toLocaleString() + ' دج' : '—'}</td>
                <td>${h.supplier || '—'}</td>
                <td>${h.demand_date ? new Date(h.demand_date).toLocaleDateString('ar-DZ') : '—'}</td>
                <td>${new Date(h.refill_date).toLocaleDateString('ar-DZ')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const frame = document.createElement('iframe');
    frame.style.display = 'none';
    document.body.appendChild(frame);
    frame.contentWindow.document.write(html);
    frame.contentWindow.document.close();
    frame.contentWindow.focus();
    setTimeout(() => {
      frame.contentWindow.print();
      document.body.removeChild(frame);
    }, 500);
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
              <label>نسبة الضريبة (%)</label>
              <input className="input" type="number" step="0.01" min="0" max="100"
                value={parseFloat(refill.tax_rate || 0.19) * 100}
                onChange={e=>setRefill(r=>({...r,tax_rate:String(parseFloat(e.target.value||0)/100)}))}
              />
            </div>
            {/* Live tax breakdown */}
            {refill.cost_per_liter && refill.quantity_liters && (
              <div style={{background:'var(--bg-secondary)',borderRadius:'var(--radius-sm)',padding:10,marginBottom:10,fontSize:12}}>
                {(() => {
                  const net = parseFloat(refill.cost_per_liter) * parseFloat(refill.quantity_liters);
                  const taxAmt = net * parseFloat(refill.tax_rate || 0.19);
                  return (
                    <>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                        <span style={{color:'var(--text-secondary)'}}>المبلغ الصافي</span>
                        <span>{Number(net.toFixed(2)).toLocaleString('ar-DZ')} دج</span>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3,color:'var(--text-secondary)'}}>
                        <span>الضريبة ({Math.round(parseFloat(refill.tax_rate||0.19)*100)}%)</span>
                        <span>{Number(taxAmt.toFixed(2)).toLocaleString('ar-DZ')} دج</span>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,color:'var(--accent)'}}>
                        <span>الإجمالي</span>
                        <span>{Number((net+taxAmt).toFixed(2)).toLocaleString('ar-DZ')} دج</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
            <div className="form-group">
              <label>المورّد</label>
              <input className="input" value={refill.supplier}
                onChange={e=>setRefill(r=>({...r,supplier:e.target.value}))} />
            </div>
            <div className="form-group">
              <label>{t.demandDate}</label>
              <input className="input" type="date" value={refill.demand_date}
                onChange={e=>setRefill(r=>({...r,demand_date:e.target.value}))} />
            </div>
            {errorMsg && <div style={{color:'var(--danger)',fontSize:13,marginBottom:10,textAlign:'center'}}>{errorMsg}</div>}
            {msg && <div style={{color:'var(--success)',fontSize:13,marginBottom:10,textAlign:'center'}}>{msg}</div>}
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}}>{t.save}</button>
          </form>
        </div>

        {/* Refill history */}
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:15}}>
            <div className="card-title" style={{marginBottom:0}}>سجل الملء</div>
            <div style={{display:'flex',gap:10}}>
              <select className="select" style={{padding:'2px 8px', fontSize:12}} value={filterPeriod} onChange={e=>setFilterPeriod(e.target.value)}>
                <option value="all">الكل</option>
                <option value="daily">{t.daily}</option>
                <option value="weekly">{t.weekly}</option>
                <option value="monthly">{t.monthly}</option>
                <option value="yearly">{t.yearly}</option>
              </select>
              <button className="btn btn-ghost btn-sm" onClick={printHistory}>{t.print}</button>
            </div>
          </div>
          <div className="table-wrap" style={{maxHeight:320,overflowY:'auto'}}>
            <table>
              <thead><tr><th>الوقود</th><th>الكميّة</th><th>صافي</th><th>ضريبة</th><th>الإجمالي</th><th>{t.arrivalDate}</th></tr></thead>
              <tbody>
                {getFilteredHistory().map(h=>(
                  <tr key={h.id}>
                    <td>{h.name_ar}</td>
                    <td>{Number(h.quantity_liters).toLocaleString()} L</td>
                    <td style={{fontSize:11}}>{h.net_amount ? Number(h.net_amount).toLocaleString('ar-DZ')+' دج' : '—'}</td>
                    <td style={{fontSize:11,color:'var(--text-secondary)'}}>{h.tax_amount ? Number(h.tax_amount).toLocaleString('ar-DZ')+' دج' : '—'}</td>
                    <td style={{fontWeight:600,color:'var(--accent)'}}>{h.total_cost ? Number(h.total_cost).toLocaleString('ar-DZ')+' دج' : '—'}</td>
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
