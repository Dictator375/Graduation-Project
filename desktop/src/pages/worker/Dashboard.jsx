import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getSales, getPayroll, getInventory } from '../../utils/api.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function fmt(n) { return Number(n || 0).toLocaleString('ar-DZ'); }

const PAYMENT_COLOR = {
  cash:    { bg: 'rgba(29,158,117,.12)',  color: 'var(--success)' },
  card:    { bg: 'rgba(74,144,226,.12)',  color: 'var(--info)'    },
  loyalty: { bg: 'rgba(186,117,23,.12)', color: 'var(--warning)' },
  credit:  { bg: 'rgba(226,75,74,.12)',  color: 'var(--danger)'  },
};

export default function WorkerDashboard() {
  const { user, t, isRTL } = useAuth();
  const [sales,     setSales]     = useState([]);
  const [payDates,  setPayDates]  = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      getSales({ date: today, limit: 20 }),
      getPayroll(),
      getInventory(),
    ]).then(([s, p, inv]) => {
      setSales(s.data || []);
      setPayDates(p.data || []);
      setInventory(inv.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const todayTotal = sales.reduce((s, r) => s + r.total_amount, 0);
  const nextPay    = payDates[0];
  const hour       = new Date().getHours();
  const shiftName  = hour >= 8 && hour < 14
    ? t.morningShift : hour >= 14 && hour < 20
    ? t.afternoonShift : t.nightShift;

  if (loading) return <div className="loading"><div className="spinner" />&nbsp;{t.loading}</div>;

  return (
    <div>
      {/* Welcome banner */}
      <div style={{
        background: 'var(--accent-muted)', border: '1px solid rgba(232,93,36,.2)',
        borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            {t.hello} {isRTL ? (user?.full_name_ar || user?.full_name) : (user?.full_name || user?.full_name_ar)} 👋
          </div>
          <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 3 }}>{shiftName}</div>
        </div>
        {nextPay && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.nextPayDate}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
              {new Date(nextPay.pay_date).toLocaleDateString('ar-DZ', { month: 'long', day: 'numeric' })}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">{t.mySalesToday}</div>
          <div className="stat-value">{fmt(todayTotal)} <span style={{ fontSize: 16 }}>دج</span></div>
          <div className="stat-sub">{sales.length} عملية</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.biggestTransaction}</div>
          <div className="stat-value">
            {sales.length ? fmt(Math.max(...sales.map(s => s.total_amount))) : 0}
            <span style={{ fontSize: 16 }}> دج</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.avgTransaction}</div>
          <div className="stat-value">
            {sales.length ? fmt(todayTotal / sales.length) : 0}
            <span style={{ fontSize: 16 }}> دج</span>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Fuel levels */}
        <div className="card">
          <div className="card-title">{t.fuelAvailability}</div>
          {inventory.map(inv => {
            const pct = Math.min(100, Math.round((inv.quantity_liters / 30000) * 100));
            const col = pct < 20 ? 'var(--danger)' : pct < 40 ? 'var(--warning)' : 'var(--success)';
            return (
              <div key={inv.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{isRTL ? inv.name_ar : inv.name}</span>
                  <span style={{ color: col, fontWeight: 600 }}>
                    {pct}% {pct < 20 && '⚠️'}
                  </span>
                </div>
                <div className="fuel-bar-track">
                  <div className="fuel-bar-fill" style={{ width: `${pct}%`, background: col }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {t.pricePerLiter}: {inv.price_per_liter} دج · {fmt(inv.quantity_liters)} L
                </div>
              </div>
            );
          })}
        </div>

        {/* Today's sales chart */}
        <div className="card">
          <div className="card-title">{t.mySalesByFuel}</div>
          {sales.length === 0
            ? <div className="empty"><div className="empty-icon">⛽</div>{t.noSalesYet}</div>
            : (() => {
              const byFuel = {};
              sales.forEach(s => {
                byFuel[isRTL ? s.fuel_name_ar : s.fuel_name] = (byFuel[isRTL ? s.fuel_name_ar : s.fuel_name] || 0) + s.total_amount;
              });
              const data = Object.entries(byFuel).map(([name, total]) => ({ name, total }));
              return (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      formatter={v => [`${fmt(v)} دج`, 'المبيعات']}
                    />
                    <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()
          }
        </div>
      </div>

      {/* Recent sales — with institution name for credit */}
      <div className="card">
        <div className="card-title">
          {t.myLatestSales}
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{sales.length} عملية</span>
        </div>
        {sales.length === 0
          ? <div className="empty"><div className="empty-icon">⛽</div>{t.noSalesYet}</div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sales.map(s => {
                const pc = PAYMENT_COLOR[s.payment_method] || PAYMENT_COLOR.cash;
                return (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                    background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                  }}>
                    {/* Pump badge */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: 'var(--bg-hover)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
                      flexShrink: 0,
                    }}>
                      ⛽{s.pump_number}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {isRTL ? s.fuel_name_ar : s.fuel_name} · {s.quantity_liters} L
                      </div>
                      {/* Show institution name for credit sales */}
                      {s.payment_method === 'credit' && s.institution_name && (
                        <div style={{ fontSize: 11, color: 'var(--info)', marginTop: 2 }}>
                          🏢 {s.institution_name}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        {new Date(s.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Payment badge */}
                    <span style={{
                      padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      background: pc.bg, color: pc.color,
                    }}>
                      {s.payment_method}
                    </span>

                    {/* Amount */}
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, flexShrink: 0 }}>
                      {fmt(s.total_amount)} دج
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
}