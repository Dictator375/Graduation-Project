import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getSales, getSalesSummary } from '../../utils/api.js';

function fmt(n) { return Number(n || 0).toLocaleString('ar-DZ'); }

function printReport(sales, from, to, totalDA, totalL) {
  const html = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8"/>
      <title>تقرير المبيعات</title>
      <style>
        body { font-family: Arial, sans-serif; direction: rtl; padding: 30px; color: #222; }
        h1   { color: #E85D24; text-align: center; font-size: 22px; }
        h3   { text-align: center; color: #888; margin-top: -10px; font-size: 13px; }
        .summary { display: flex; gap: 16px; margin: 20px 0; }
        .stat { flex:1; background:#f5f5f5; border-radius:8px; padding:14px; text-align:center; }
        .stat-val { font-size:22px; font-weight:bold; color:#E85D24; }
        .stat-lbl { font-size:12px; color:#888; margin-top:4px; }
        table { width:100%; border-collapse:collapse; margin-top:20px; font-size:12px; }
        th { background:#E85D24; color:#fff; padding:9px; text-align:right; }
        td { border-bottom:1px solid #eee; padding:9px; text-align:right; }
        tr:nth-child(even){ background:#fafafa; }
        .footer { text-align:center; margin-top:30px; color:#aaa; font-size:11px; border-top:1px solid #eee; padding-top:14px; }
        @media print { button { display:none; } }
      </style>
    </head>
    <body>
      <h1>⛽ تقرير المبيعات</h1>
      <h3>من ${from} إلى ${to}</h3>
      <div class="summary">
        <div class="stat"><div class="stat-val">${fmt(totalDA)} دج</div><div class="stat-lbl">إجمالي الإيرادات</div></div>
        <div class="stat"><div class="stat-val">${fmt(totalL)} L</div><div class="stat-lbl">إجمالي الوقود</div></div>
        <div class="stat"><div class="stat-val">${sales.length}</div><div class="stat-lbl">عدد العمليات</div></div>
      </div>
      <table>
        <thead><tr>
          <th>التاريخ</th><th>الوقود</th><th>الكميّة</th>
          <th>السعر/L</th><th>المجموع</th><th>الدفع</th>
          <th>العامل</th><th>المضخة</th><th>المؤسسة</th>
        </tr></thead>
        <tbody>
          ${sales.map(s => `<tr>
            <td>${s.shift_date}</td>
            <td>${s.fuel_name_ar}</td>
            <td>${s.quantity_liters} L</td>
            <td>${s.price_per_liter} دج</td>
            <td><b>${fmt(s.total_amount)} دج</b></td>
            <td>${s.payment_method}</td>
            <td>${s.worker_name_ar || s.worker_name}</td>
            <td>${s.pump_number}</td>
            <td>${s.institution_name || '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="footer">نظام إدارة محطة الوقود · ${new Date().toLocaleDateString('ar-DZ')}</div>
    </body>
    </html>
  `;
  // Use a hidden iframe instead of window.open (which Electron blocks)
  let iframe = document.getElementById('__print_frame__');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = '__print_frame__';
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:none;left:-9999px;top:-9999px;';
    document.body.appendChild(iframe);
  }
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  iframe.contentWindow.focus();
  iframe.contentWindow.print();
}

const PAYMENT_COLOR = {
  cash: 'badge-gray', card: 'badge-success', loyalty: 'badge-warning', credit: 'badge-danger'
};

export default function AdminReports() {
  const { t } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [from, setFrom] = useState(today);
  const [to,   setTo]   = useState(today);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await getSales({ limit: 500 });
      setSales((res.data || []).filter(s => s.shift_date >= from && s.shift_date <= to));
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [from, to]);

  const totalDA = sales.reduce((s, r) => s + r.total_amount, 0);
  const totalL  = sales.reduce((s, r) => s + r.quantity_liters, 0);

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>من</label>
          <input type="date" className="input" style={{ width: 160 }} value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>إلى</label>
          <input type="date" className="input" style={{ width: 160 }} value={to} onChange={e => setTo(e.target.value)} />
        </div>

        {/* Quick filters */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setFrom(today); setTo(today); }}>اليوم</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setFrom(today.slice(0,7)+'-01'); setTo(today); }}>هذا الشهر</button>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={load} style={{ marginRight: 'auto' }}>🔄 تحديث</button>

        {/* Export CSV */}
        <button className="btn btn-ghost btn-sm" onClick={() => {
          const header = 'التاريخ,الوقود,الكميّة,السعر/L,المجموع,الدفع,العامل,المضخة,المؤسسة\n';
          const rows = sales.map(s =>
            `${s.shift_date},${s.fuel_name_ar},${s.quantity_liters},${s.price_per_liter},${s.total_amount},${s.payment_method},${s.worker_name},${s.pump_number},${s.institution_name || ''}`
          ).join('\n');
          const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement('a');
          a.href = url; a.download = `sales_${from}_${to}.csv`; a.click();
        }}>📥 تصدير CSV</button>

        {/* Print */}
        <button className="btn btn-primary btn-sm" onClick={() => printReport(sales, from, to, totalDA, totalL)}>
          🖨️ طباعة التقرير
        </button>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-label">إجمالي المبيعات</div><div className="stat-value">{fmt(totalDA)} <span style={{fontSize:16}}>دج</span></div></div>
        <div className="stat-card"><div className="stat-label">الكميّة الإجمالية</div><div className="stat-value">{fmt(totalL)} <span style={{fontSize:16}}>L</span></div></div>
        <div className="stat-card"><div className="stat-label">عدد العمليات</div><div className="stat-value">{sales.length}</div></div>
        <div className="stat-card"><div className="stat-label">متوسط العملية</div><div className="stat-value">{sales.length ? fmt(totalDA/sales.length) : 0} <span style={{fontSize:16}}>دج</span></div></div>
      </div>

      {/* Table */}
      <div className="card">
        {loading
          ? <div className="loading"><div className="spinner" /></div>
          : sales.length === 0
          ? <div className="empty"><div className="empty-icon">📊</div>لا توجد مبيعات في هذه الفترة</div>
          : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>التاريخ</th><th>نوع الوقود</th><th>الكميّة</th><th>السعر/L</th>
                    <th>المجموع</th><th>الدفع</th><th>المؤسسة</th><th>العامل</th><th>المضخة</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontSize: 12 }}>{s.shift_date}</td>
                      <td>{s.fuel_name_ar}</td>
                      <td>{s.quantity_liters} L</td>
                      <td style={{ fontSize: 12 }}>{s.price_per_liter} دج</td>
                      <td style={{ fontWeight: 600 }}>{fmt(s.total_amount)} دج</td>
                      <td><span className={`badge ${PAYMENT_COLOR[s.payment_method] || 'badge-gray'}`}>{s.payment_method}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--info)' }}>{s.institution_name || '—'}</td>
                      <td style={{ fontSize: 12 }}>{s.worker_name_ar || s.worker_name}</td>
                      <td style={{ fontSize: 12 }}>{s.pump_number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  );
}