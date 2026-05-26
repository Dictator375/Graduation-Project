import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getCreditSales, markCreditPaid } from '../../utils/api.js';

function fmt(n) { return Number(n || 0).toLocaleString('ar-DZ'); }

export default function AdminCredits() {
  const { t } = useAuth();
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    getCreditSales()
      .then(r => setCredits(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function handlePay(sale) {
    if (!window.confirm(`تأكيد سداد ${fmt(sale.total_amount)} دج من "${sale.institution_name || 'عميل'}"؟`)) return;
    await markCreditPaid(sale.id).catch(() => {});
    load();
  }

  const totalDebt = credits.reduce((s, r) => s + r.total_amount, 0);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      {/* Summary */}
      <div style={{
        background: 'rgba(226,75,74,.1)', border: '1px solid rgba(226,75,74,.25)',
        borderRadius: 'var(--radius-lg)', padding: '18px 22px',
        display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20,
      }}>
        <span style={{ fontSize: 36 }}>💳</span>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>إجمالي الديون غير المسددة</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)' }}>{fmt(totalDebt)} دج</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{credits.length} دين غير مسدد</div>
        </div>
      </div>

      {credits.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">✅</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>لا توجد ديون غير مسددة</div>
          <div style={{ fontSize: 13 }}>جميع المؤسسات سددت ديونها</div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>المؤسسة</th>
                  <th>نوع الوقود</th>
                  <th>الكميّة</th>
                  <th>المبلغ</th>
                  <th>التاريخ</th>
                  <th>العامل</th>
                  <th>الهاتف</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {credits.map(sale => (
                  <tr key={sale.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      🏢 {sale.institution_name || 'غير محدد'}
                    </td>
                    <td>{sale.fuel_name_ar}</td>
                    <td>{sale.quantity_liters} L</td>
                    <td style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(sale.total_amount)} دج</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sale.shift_date}</td>
                    <td style={{ fontSize: 12 }}>{sale.worker_name_ar || sale.worker_name}</td>
                    <td style={{ fontSize: 12 }}>{sale.institution_phone || '—'}</td>
                    <td>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handlePay(sale)}
                      >
                        ✓ تسجيل السداد
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}