import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getSalesSummary, getInventory, getEmployees } from '../../utils/api.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function fmt(n) { return Number(n||0).toLocaleString('ar-DZ'); }

export default function AdminDashboard() {
  const { t, isRTL } = useAuth();
  const [summary,   setSummary]   = useState([]);
  const [monthly,   setMonthly]   = useState([]);
  const [inventory, setInventory] = useState([]);
  const [empCount,  setEmpCount]  = useState(0);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0,7);
    Promise.all([
      getSalesSummary({ period:'daily',  date: today }),
      getSalesSummary({ period:'monthly', date: today }),
      getInventory(),
      getEmployees(),
    ]).then(([s, m, inv, emp]) => {
      setSummary(s.data);
      setMonthly(m.data);
      setInventory(inv.data);
      setEmpCount(emp.data.filter(e=>e.is_active).length);
    }).finally(() => setLoading(false));
  }, []);

  const todayTotal    = summary.reduce((s,r)=>s+r.total_da,     0);
  const todayLiters   = summary.reduce((s,r)=>s+r.total_liters, 0);
  const todayTxns     = summary.reduce((s,r)=>s+r.transactions, 0);

  if (loading) return <div className="loading"><div className="spinner"/>&nbsp;{t.loading}</div>;

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{t.todayRevenue}</div>
          <div className="stat-value">{fmt(todayTotal)} <span style={{fontSize:16}}>دج</span></div>
          <div className="stat-sub">{t.transactions}: {todayTxns}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.fuelSoldToday}</div>
          <div className="stat-value">{fmt(todayLiters)} <span style={{fontSize:16}}>L</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.employees}</div>
          <div className="stat-value">{empCount}</div>
          <div className="stat-sub">{t.active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.monthRevenue}</div>
          <div className="stat-value">{fmt(monthly.reduce((s,r)=>s+r.total_da,0))} <span style={{fontSize:16}}>دج</span></div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom:20 }}>
        {/* Monthly chart */}
        <div className="card">
          <div className="card-title">{t.monthSales}</div>
          {monthly.length === 0
            ? <div className="empty"><div className="empty-icon">📊</div>{t.noData}</div>
            : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthly}>
                  <XAxis dataKey="date" tick={{ fontSize:10, fill:'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize:10, fill:'var(--text-muted)' }} />
                  <Tooltip
                    contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}
                    formatter={(v)=>[`${fmt(v)} دج`, 'المبيعات']}
                  />
                  <Bar dataKey="total_da" fill="var(--accent)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* Fuel levels */}
        <div className="card">
          <div className="card-title">{t.inventory}</div>
          {inventory.map(inv => {
            const max = 30000;
            const pct = Math.min(100, Math.round((inv.quantity_liters / max) * 100));
            const color = pct < 20 ? 'var(--danger)' : pct < 40 ? 'var(--warning)' : 'var(--success)';
            return (
              <div key={inv.id} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
                  <span>{isRTL ? inv.name_ar : inv.name}</span>
                  <span style={{ color }}>
                    {fmt(inv.quantity_liters)} L &nbsp;·&nbsp; {pct}%
                    {pct < 20 && <span className="badge badge-danger" style={{marginRight:6}}>{t.criticalStock}</span>}
                    {pct >= 20 && pct < 40 && <span className="badge badge-warning" style={{marginRight:6}}>{t.lowStock}</span>}
                  </span>
                </div>
                <div className="fuel-bar-track">
                  <div className="fuel-bar-fill" style={{ width:`${pct}%`, background:color }} />
                </div>
                <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{t.pricePerLiter}: {inv.price_per_liter} دج</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's fuel breakdown */}
      <div className="card">
        <div className="card-title">{t.todaySalesBreakdown}</div>
        {summary.length === 0
          ? <div className="empty"><div className="empty-icon">⛽</div>{t.noSalesToday}</div>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>{t.fuelTypeTitle}</th><th>{t.quantityTitle}</th><th>{t.salesTitle}</th><th>{t.operationsTitle}</th>
                </tr></thead>
                <tbody>{summary.map(row=>(
                  <tr key={row.name}>
                    <td>{isRTL ? row.name_ar : row.name}</td>
                    <td>{fmt(row.total_liters)}</td>
                    <td style={{fontWeight:600}}>{fmt(row.total_da)} دج</td>
                    <td>{row.transactions}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
