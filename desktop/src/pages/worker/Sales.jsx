import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { createSale, getFuelTypes, getInstitutions } from '../../utils/api.js';

const PUMPS = [1,2,3,4,5,6,7,8];

export default function WorkerSales() {
  const { t } = useAuth();
  const [fuelTypes,    setFuelTypes]    = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [form, setForm] = useState({
    fuel_type_id:'', quantity_liters:'', payment_method:'cash',
    pump_number:'', institution_id:'', notes:'',
  });
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    getFuelTypes().then(r=>setFuelTypes(r.data));
    getInstitutions().then(r=>setInstitutions(r.data));
  }, []);

  const selectedFuel  = fuelTypes.find(f=>f.id===parseInt(form.fuel_type_id));
  const estimated     = selectedFuel && form.quantity_liters
    ? (selectedFuel.price_per_liter * parseFloat(form.quantity_liters)).toFixed(2)
    : null;

  function set(k,v){ setForm(f=>({...f,[k]:v})); }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await createSale(form);
      setResult(res.data);
      setForm({ fuel_type_id:'', quantity_liters:'', payment_method:'cash', pump_number:'', institution_id:'', notes:'' });
    } catch(err) {
      setError(err.response?.data?.error || t.error);
    } finally { setLoading(false); }
  }

  return (
    <div style={{maxWidth:580}}>
      {/* Success banner */}
      {result && (
        <div style={{
          background:'rgba(29,158,117,.15)',border:'1px solid rgba(29,158,117,.3)',
          borderRadius:'var(--radius-md)',padding:'16px 20px',marginBottom:20,
          display:'flex',alignItems:'center',gap:12,
        }}>
          <span style={{fontSize:28}}>✅</span>
          <div>
            <div style={{fontWeight:600,color:'var(--success)',fontSize:15}}>تمت عملية البيع بنجاح</div>
            <div style={{fontSize:13,color:'var(--text-secondary)',marginTop:2}}>
              المبلغ الإجمالي: <strong style={{color:'var(--success)'}}>{Number(result.total_amount).toLocaleString('ar-DZ')} دج</strong>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">{t.newSale}</div>

        <form onSubmit={handleSubmit}>
          {/* Fuel type */}
          <div className="form-group">
            <label>{t.fuelType}</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {fuelTypes.map(f=>(
                <button key={f.id} type="button"
                  className={`btn ${form.fuel_type_id==f.id?'btn-primary':'btn-ghost'}`}
                  style={{justifyContent:'center'}}
                  onClick={()=>set('fuel_type_id',f.id)}
                >
                  ⛽ {f.name_ar}
                  <span style={{fontSize:10,opacity:.75,marginRight:4}}>({f.price_per_liter} دج/L)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pump */}
          <div className="form-group">
            <label>{t.pumpNumber}</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {PUMPS.map(p=>(
                <button key={p} type="button"
                  className={`btn btn-sm ${form.pump_number==p?'btn-primary':'btn-ghost'}`}
                  onClick={()=>set('pump_number',p)}
                  style={{width:42,justifyContent:'center'}}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="form-group">
            <label>الكميّة (لتر)</label>
            <input className="input" type="number" min="0.1" step="0.1"
              value={form.quantity_liters}
              onChange={e=>set('quantity_liters',e.target.value)}
              placeholder="أدخل الكميّة..."
              required
            />
            {estimated && (
              <div style={{fontSize:12,color:'var(--accent)',marginTop:5,fontWeight:600}}>
                💰 المبلغ التقديري: {Number(estimated).toLocaleString('ar-DZ')} دج
              </div>
            )}
          </div>

          {/* Payment method */}
          <div className="form-group">
            <label>{t.paymentMethod}</label>
            <div style={{display:'flex',gap:8}}>
              {[['cash','نقداً','💵'],['card','بطاقة','💳'],['loyalty','نقاط','⭐'],['credit','دين','🏢']].map(([v,l,icon])=>(
                <button key={v} type="button"
                  className={`btn btn-sm ${form.payment_method===v?'btn-primary':'btn-ghost'}`}
                  style={{flex:1,justifyContent:'center'}}
                  onClick={()=>set('payment_method',v)}
                >
                  {icon} {l}
                </button>
              ))}
            </div>
          </div>

          {/* Institution (optional, for credit) */}
          {form.payment_method==='credit' && (
            <div className="form-group">
              <label>المؤسسة</label>
              <select className="select" value={form.institution_id} onChange={e=>set('institution_id',e.target.value)} required>
                <option value="">— اختر المؤسسة —</option>
                {institutions.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
          )}

          {/* Notes */}
          <div className="form-group">
            <label>{t.notes} ({t.yes === 'نعم' ? 'اختياري' : 'optionnel'})</label>
            <input className="input" value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="..." />
          </div>

          {error && <div style={{color:'var(--danger)',fontSize:12,marginBottom:12,textAlign:'center'}}>{error}</div>}

          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
            style={{width:'100%',justifyContent:'center'}}>
            {loading ? t.loading : '✓ تأكيد البيع'}
          </button>
        </form>
      </div>
    </div>
  );
}
