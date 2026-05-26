import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getInvoices, getInvoice, createInvoice, updateInvoiceStatus, getInstitutions, getFuelTypes } from '../../utils/api.js';

function fmt(n) { return Number(n || 0).toLocaleString('ar-DZ'); }

function generateInvoiceNumber(db) {
  const year = new Date().getFullYear();
  return `INV-${year}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

const STATUS_STYLE = { pending: 'badge-warning', paid: 'badge-success', cancelled: 'badge-danger' };
const STATUS_LABEL = { pending: 'معلق', paid: 'مدفوع', cancelled: 'ملغى' };

async function printInvoice(id) {
  try {
    const res  = await getInvoice(id);
    const data = res.data;
    const html = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8"/>
        <title>فاتورة ${data.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; padding: 40px; color: #222; max-width: 750px; margin: auto; }
          .header { text-align:center; border-bottom:3px solid #E85D24; padding-bottom:20px; margin-bottom:24px; }
          .logo   { font-size:48px; }
          h1      { color:#E85D24; font-size:22px; margin:8px 0 4px; }
          .inv-num{ color:#888; font-size:13px; }
          .status { display:inline-block; padding:4px 14px; border-radius:20px; font-size:12px; font-weight:bold;
                    background:${data.status==='paid'?'rgba(29,158,117,.15)':data.status==='cancelled'?'rgba(226,75,74,.15)':'rgba(186,117,23,.15)'};
                    color:${data.status==='paid'?'#1D9E75':data.status==='cancelled'?'#E24B4A':'#BA7517'}; }
          .grid   { display:flex; gap:20px; margin:20px 0; }
          .box    { flex:1; background:#f8f8f8; border-radius:8px; padding:14px; }
          .lbl    { color:#888; font-size:11px; margin-bottom:4px; }
          .val    { font-size:14px; font-weight:bold; color:#222; }
          table   { width:100%; border-collapse:collapse; margin:20px 0; font-size:13px; }
          th      { background:#E85D24; color:#fff; padding:10px; text-align:right; }
          td      { border-bottom:1px solid #eee; padding:10px; text-align:right; }
          tr:nth-child(even){ background:#fafafa; }
          .totals { background:#f8f8f8; border-radius:8px; padding:16px; margin-top:20px; }
          .t-row  { display:flex; justify-content:space-between; padding:6px 0; font-size:14px; }
          .t-grand{ font-size:18px; font-weight:bold; color:#E85D24; border-top:2px solid #E85D24; padding-top:10px; margin-top:6px; }
          .footer { text-align:center; margin-top:40px; color:#aaa; font-size:11px; border-top:1px solid #eee; padding-top:14px; }
          @media print { button{display:none} }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">⛽</div>
          <h1>فاتورة رسمية</h1>
          <div class="inv-num">${data.invoice_number}</div>
          <br/>
          <span class="status">${STATUS_LABEL[data.status] || data.status}</span>
        </div>
        <div class="grid">
          <div class="box">
            <div class="lbl">صادرة إلى</div>
            <div class="val">${data.institution_name || 'عميل خاص'}</div>
          </div>
          <div class="box">
            <div class="lbl">تاريخ الإصدار</div>
            <div class="val">${new Date(data.created_at).toLocaleDateString('ar-DZ')}</div>
            ${data.due_date ? `<div class="lbl" style="margin-top:8px">تاريخ الاستحقاق</div><div class="val">${data.due_date}</div>` : ''}
          </div>
        </div>
        <table>
          <thead><tr><th>نوع الوقود</th><th>الكميّة</th><th>السعر/L</th><th>المجموع الفرعي</th></tr></thead>
          <tbody>
            ${(data.items || []).map(item => `
              <tr>
                <td>${item.fuel_name_ar}</td>
                <td>${item.quantity_liters} L</td>
                <td>${item.price_per_liter} دج</td>
                <td>${fmt(item.subtotal)} دج</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <div class="t-row"><span>المبلغ الصافي</span><span>${fmt(data.net_amount)} دج</span></div>
          <div class="t-row"><span>الضريبة (${Math.round((data.tax_rate || 0.19)*100)}%)</span><span>${fmt(data.tax_amount)} دج</span></div>
          <div class="t-row t-grand"><span>الإجمالي</span><span>${fmt(data.total_amount)} دج</span></div>
        </div>
        ${data.notes ? `<p style="margin-top:16px;color:#666;font-size:13px"><b>ملاحظات:</b> ${data.notes}</p>` : ''}
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
  } catch (e) {
    alert('فشل إنشاء الفاتورة');
  }
}

export default function AdminInvoices() {
  const { t } = useAuth();
  const [invoices,     setInvoices]     = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [fuelTypes,    setFuelTypes]    = useState([]);
  const [showNew,      setShowNew]      = useState(false);
  const [items,        setItems]        = useState([{ fuel_type_id: '', quantity_liters: '', price_per_liter: '' }]);
  const [form,         setForm]         = useState({ institution_id: '', due_date: '', notes: '' });
  const [loading,      setLoading]      = useState(true);

  function load() {
    Promise.all([getInvoices(), getInstitutions(), getFuelTypes()]).then(([inv, inst, ft]) => {
      setInvoices(inv.data || []);
      setInstitutions(inst.data || []);
      setFuelTypes(ft.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  function addItem()         { setItems(i => [...i, { fuel_type_id: '', quantity_liters: '', price_per_liter: '' }]); }
  function removeItem(idx)   { setItems(i => i.filter((_, j) => j !== idx)); }
  function setItem(idx, k, v){ setItems(i => i.map((it, j) => j === idx ? { ...it, [k]: v } : it)); }

  async function handleCreate(e) {
    e.preventDefault();
    await createInvoice({ ...form, items }).catch(() => {});
    setShowNew(false);
    setItems([{ fuel_type_id: '', quantity_liters: '', price_per_liter: '' }]);
    setForm({ institution_id: '', due_date: '', notes: '' });
    load();
  }

  async function handleStatus(id, status) {
    if (!window.confirm(`تغيير حالة الفاتورة إلى "${STATUS_LABEL[status]}"؟`)) return;
    await updateInvoiceStatus(id, status).catch(() => {});
    load();
  }

  const totalLine = items.reduce((s, it) => s + (parseFloat(it.quantity_liters) || 0) * (parseFloat(it.price_per_liter) || 0), 0);
  const tax       = totalLine * 0.19;
  const grand     = totalLine + tax;

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>➕ فاتورة جديدة</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>رقم الفاتورة</th><th>المؤسسة</th><th>المبلغ الصافي</th>
              <th>الضريبة</th><th>الإجمالي</th><th>الحالة</th><th>التاريخ</th><th>الإجراءات</th>
            </tr></thead>
            <tbody>
              {invoices.length === 0
                ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>لا توجد فواتير</td></tr>
                : invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600, fontSize: 12 }}>{inv.invoice_number}</td>
                    <td style={{ fontSize: 12 }}>{inv.institution_name || 'عميل خاص'}</td>
                    <td style={{ fontSize: 12 }}>{fmt(inv.net_amount)} دج</td>
                    <td style={{ fontSize: 12 }}>{fmt(inv.tax_amount)} دج</td>
                    <td style={{ fontWeight: 600 }}>{fmt(inv.total_amount)} دج</td>
                    <td><span className={`badge ${STATUS_STYLE[inv.status] || 'badge-gray'}`}>{STATUS_LABEL[inv.status]}</span></td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(inv.created_at).toLocaleDateString('ar-DZ')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => printInvoice(inv.id)}>🖨️ طباعة</button>
                        {inv.status === 'pending' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleStatus(inv.id, 'paid')}>مدفوع</button>
                            <button className="btn btn-danger btn-sm"  onClick={() => handleStatus(inv.id, 'cancelled')}>إلغاء</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* New invoice modal */}
      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal" style={{ width: 'min(95vw, 640px)' }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">إنشاء فاتورة جديدة</div>
            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="form-group">
                  <label>المؤسسة</label>
                  <select className="select" value={form.institution_id} onChange={e => setForm(f => ({ ...f, institution_id: e.target.value }))}>
                    <option value="">— اختياري —</option>
                    {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>تاريخ الاستحقاق</label>
                  <input className="input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>أصناف الفاتورة</div>
                {items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                    <select className="select" style={{ flex: 1.5 }} value={it.fuel_type_id} onChange={e => setItem(idx, 'fuel_type_id', e.target.value)} required>
                      <option value="">نوع الوقود</option>
                      {fuelTypes.map(f => <option key={f.id} value={f.id}>{f.name_ar}</option>)}
                    </select>
                    <input className="input" style={{ flex: 1 }} type="number" placeholder="الكميّة (L)" value={it.quantity_liters} onChange={e => setItem(idx, 'quantity_liters', e.target.value)} required />
                    <input className="input" style={{ flex: 1 }} type="number" step="0.01" placeholder="السعر/L" value={it.price_per_liter} onChange={e => setItem(idx, 'price_per_liter', e.target.value)} required />
                    {items.length > 1 && <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(idx)}>✕</button>}
                  </div>
                ))}
                <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>➕ إضافة صنف</button>
              </div>

              {/* Totals preview */}
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: 12, marginBottom: 14, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>المبلغ الصافي</span><span>{fmt(totalLine)} دج</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--text-secondary)' }}><span>الضريبة (19%)</span><span>{fmt(tax)} دج</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--accent)' }}><span>الإجمالي</span><span>{fmt(grand)} دج</span></div>
              </div>

              <div className="form-group">
                <label>ملاحظات</label>
                <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" type="submit" style={{ flex: 1, justifyContent: 'center' }}>إنشاء الفاتورة</button>
                <button className="btn btn-ghost" type="button" onClick={() => setShowNew(false)}>{t.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}