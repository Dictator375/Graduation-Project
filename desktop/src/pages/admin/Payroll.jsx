import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getPayrollReport, generatePayroll, getPayrollDetail } from '../../utils/api.js';

function fmt(n) { return Number(n || 0).toLocaleString('ar-DZ'); }

export default function AdminPayroll() {
  const { t, isRTL } = useAuth();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  function loadData(m) {
    setLoading(true);
    getPayrollReport(m).then(res => {
      setReport(res.data);
    }).catch(err => {
      console.error(err);
      setReport(null);
    }).finally(() => {
      setLoading(false);
    });
  }

  useEffect(() => {
    loadData(month);
  }, [month]);

  async function handleGenerate() {
    try {
      await generatePayroll(month);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      loadData(month);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRowClick(userId) {
    setDetailLoading(true);
    setDetailModal({}); // open empty modal showing loading state
    try {
      const res = await getPayrollDetail(userId, month);
      setDetailModal(res.data);
    } catch (err) {
      console.error(err);
      setDetailModal(null);
    } finally {
      setDetailLoading(false);
    }
  }

  const STATUS_MAP = {
    present: { label: t.present || 'حاضر', badge: 'badge-success' },
    absent:  { label: t.absent || 'غائب',  badge: 'badge-danger' },
    late:    { label: t.late || 'متأخر',   badge: 'badge-accent' },
    excused: { label: t.excused || 'مبرر', badge: 'badge-info' },
  };

  return (
    <div>
      {/* Header and Controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <input 
          type="month" 
          className="input" 
          style={{ width: 180 }} 
          value={month} 
          onChange={e => setMonth(e.target.value)} 
        />
        <button 
          className={`btn ${saved ? 'btn-success' : 'btn-primary'}`} 
          style={{ marginRight: isRTL ? 'auto' : 0, marginLeft: isRTL ? 0 : 'auto', display: 'flex', alignItems: 'center', gap: 6 }} 
          onClick={handleGenerate}
        >
          {saved ? '✓ ' + (t.payrollGenerated || 'تم الحساب') : '⚡ ' + (t.generatePayroll || 'حساب الرواتب')}
        </button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" />&nbsp;{t.loading}</div>
      ) : !report ? (
        <div className="empty"><div className="empty-icon">⚠️</div>{t.error || 'حدث خطأ'}</div>
      ) : report.records.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">💰</div>
          {t.noPayrollYet || 'لم يتم حساب الرواتب بعد'}
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            {t.generateFirst || 'اضغط على "حساب الرواتب" لبدء الحساب'}
          </div>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-label">{t.totalNetPay || 'إجمالي الصافي'}</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {fmt(report.summary.total_net)} <span style={{ fontSize: 14 }}>{t.currency || 'دج'}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{t.totalDeductions || 'إجمالي الخصومات'}</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>
                {fmt(report.summary.total_deduction)} <span style={{ fontSize: 14 }}>{t.currency || 'دج'}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{t.workerCount || 'عدد العمال'}</div>
              <div className="stat-value">
                {report.summary.worker_count}
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t.fullName}</th>
                    <th>{t.team}</th>
                    <th>{t.baseSalary}</th>
                    <th>{t.dailyRate}</th>
                    <th>{t.daysWorked} / {t.daysTotal || 'الإجمالي'}</th>
                    <th>{t.daysAbsent}</th>
                    <th>{t.deductionLabel}</th>
                    <th>{t.netSalary}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.records.map(rec => {
                    // Row styling based on absences
                    const absentRatio = rec.days_absent / rec.total_days;
                    const bgStyle = absentRatio > 0.15 ? 'rgba(226,75,74,.05)' : absentRatio > 0 ? 'rgba(186,117,23,.05)' : 'rgba(29,158,117,.05)';
                    
                    return (
                      <tr 
                        key={rec.user_id} 
                        style={{ cursor: 'pointer', background: bgStyle }}
                        onClick={() => handleRowClick(rec.user_id)}
                      >
                        <td>
                          <div style={{ fontWeight: 500 }}>
                            {isRTL ? (rec.full_name_ar || rec.full_name) : (rec.full_name || rec.full_name_ar)}
                            {rec.is_prorated === 1 && (
                              <span className="badge badge-info" style={{ marginLeft: 8, marginRight: 8, fontSize: 10 }}>
                                {t.prorated || 'نسبي'}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t[rec.role] || rec.role}</div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {rec.team_name || '—'}
                        </td>
                        <td style={{ fontWeight: 500 }}>
                          {fmt(rec.base_salary)} {t.currency || 'دج'}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {fmt(rec.daily_rate)} {t.currency || 'دج'}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{rec.days_worked}</span>
                          <span style={{ color: 'var(--text-muted)' }}> / {rec.total_days}</span>
                        </td>
                        <td style={{ color: rec.days_absent > 0 ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: rec.days_absent > 0 ? 600 : 400 }}>
                          {rec.days_absent}
                        </td>
                        <td style={{ color: rec.deduction > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {rec.deduction > 0 ? '-' : ''}{fmt(rec.deduction)} {t.currency || 'دج'}
                        </td>
                        <td style={{ fontWeight: 700, color: rec.deduction > 0 ? 'var(--warning)' : 'var(--success)' }}>
                          {fmt(rec.net_salary)} {t.currency || 'دج'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, width: '90%' }}>
            {detailLoading || !detailModal.user ? (
              <div className="loading" style={{ padding: 40 }}><div className="spinner" /></div>
            ) : (
              <>
                <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{t.workerDetail || 'تفاصيل العامل'}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDetailModal(null)}>✕</button>
                </div>
                
                <div style={{ display: 'flex', gap: 20, marginBottom: 20, padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {isRTL ? (detailModal.user.full_name_ar || detailModal.user.full_name) : (detailModal.user.full_name || detailModal.user.full_name_ar)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {t.baseSalary}: {fmt(detailModal.user.salary)} {t.currency || 'دج'}
                    </div>
                  </div>
                  <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.monthLabel}</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{detailModal.month}</div>
                  </div>
                </div>

                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20, gap: 10 }}>
                  <div className="stat-card" style={{ padding: 12 }}>
                    <div className="stat-value" style={{ fontSize: 20, color: 'var(--success)' }}>{detailModal.counts.present || 0}</div>
                    <div className="stat-label" style={{ fontSize: 11 }}>{t.present}</div>
                  </div>
                  <div className="stat-card" style={{ padding: 12 }}>
                    <div className="stat-value" style={{ fontSize: 20, color: 'var(--danger)' }}>{detailModal.counts.absent || 0}</div>
                    <div className="stat-label" style={{ fontSize: 11 }}>{t.absent}</div>
                  </div>
                  <div className="stat-card" style={{ padding: 12 }}>
                    <div className="stat-value" style={{ fontSize: 20, color: 'var(--accent)' }}>{detailModal.counts.late || 0}</div>
                    <div className="stat-label" style={{ fontSize: 11 }}>{t.late}</div>
                  </div>
                  <div className="stat-card" style={{ padding: 12 }}>
                    <div className="stat-value" style={{ fontSize: 20, color: 'var(--info)' }}>{detailModal.counts.excused || 0}</div>
                    <div className="stat-label" style={{ fontSize: 11 }}>{t.excused}</div>
                  </div>
                </div>

                <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>{t.attendanceReport || 'تقرير الحضور'}</div>
                
                {detailModal.attendance.length === 0 ? (
                  <div className="empty" style={{ padding: 20 }}>{t.noData || 'لا توجد بيانات'}</div>
                ) : (
                  <div className="table-wrap" style={{ maxHeight: 300, overflowY: 'auto' }}>
                    <table style={{ fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th>{t.date}</th>
                          <th>{t.status}</th>
                          <th>{t.checkIn}</th>
                          <th>{t.checkOut}</th>
                          <th>{t.notes}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailModal.attendance.map(a => {
                          const statusInfo = STATUS_MAP[a.status] || { label: a.status, badge: 'badge-gray' };
                          return (
                            <tr key={a.date}>
                              <td style={{ fontWeight: 500 }}>{a.date}</td>
                              <td><span className={`badge ${statusInfo.badge}`}>{statusInfo.label}</span></td>
                              <td style={{ color: 'var(--text-secondary)' }}>{a.check_in || '—'}</td>
                              <td style={{ color: 'var(--text-secondary)' }}>{a.check_out || '—'}</td>
                              <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{a.notes || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
