import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../utils/api.js';

export default function Suppliers() {
  const { t, isRTL } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', contact_person: '', phone: '', email: '', address: '', notes: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  function loadSuppliers() {
    setLoading(true);
    getSuppliers().then(res => {
      setSuppliers(res.data || []);
    }).catch(err => {
      console.error(err);
      alert(t.error || 'حدث خطأ');
    }).finally(() => {
      setLoading(false);
    });
  }

  function handleSave(e) {
    e.preventDefault();
    const req = editingId ? updateSupplier(editingId, formData) : createSupplier(formData);
    
    req.then(() => {
      setShowModal(false);
      loadSuppliers();
      setFormData({ name: '', contact_person: '', phone: '', email: '', address: '', notes: '' });
      setEditingId(null);
    }).catch(err => {
      console.error(err);
      alert(err.response?.data?.error || t.error || 'حدث خطأ');
    });
  }

  function handleEdit(sup) {
    setFormData({
      name: sup.name,
      contact_person: sup.contact_person || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      notes: sup.notes || '',
    });
    setEditingId(sup.id);
    setShowModal(true);
  }

  function handleDelete(id) {
    if (!confirm(t.confirm || 'تأكيد الحذف؟')) return;
    deleteSupplier(id).then(() => {
      loadSuppliers();
    }).catch(err => {
      console.error(err);
      alert(err.response?.data?.error || t.error || 'حدث خطأ');
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>{t.suppliers || 'الموردون'}</h2>
        <button className="btn btn-primary" onClick={() => {
          setEditingId(null);
          setFormData({ name: '', contact_person: '', phone: '', email: '', address: '', notes: '' });
          setShowModal(true);
        }}>+ {t.addSupplier || 'إضافة مورد'}</button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : suppliers.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🚛</div>
          {t.noData || 'لا توجد بيانات'}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.name || 'الاسم'}</th>
                  <th>{t.contactPerson || 'جهة الاتصال'}</th>
                  <th>{t.phone || 'الهاتف'}</th>
                  <th>{t.email || 'البريد'}</th>
                  <th>{t.address || 'العنوان'}</th>
                  <th>{t.notes || 'ملاحظات'}</th>
                  <th style={{ textAlign: 'center' }}>{t.actions || 'الإجراءات'}</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(sup => (
                  <tr key={sup.id}>
                    <td style={{ fontWeight: 600 }}>{sup.name}</td>
                    <td>{sup.contact_person || '—'}</td>
                    <td>{sup.phone || '—'}</td>
                    <td style={{ color: 'var(--accent)' }}>{sup.email || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sup.address || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sup.notes || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => handleEdit(sup)}>✏️</button>
                      <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(sup.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              {editingId ? (t.edit || 'تعديل') : (t.addSupplier || 'إضافة مورد')}
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>{t.supplierName || 'اسم المورد'}</label>
                <input required className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>{t.contactPerson || 'جهة الاتصال'}</label>
                  <input className="input" value={formData.contact_person} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>{t.phone || 'الهاتف'}</label>
                  <input className="input" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>{t.email || 'البريد الإلكتروني'}</label>
                  <input className="input" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>{t.address || 'العنوان'}</label>
                  <input className="input" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>{t.notes || 'ملاحظات'}</label>
                <textarea className="input" rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" className="btn btn-primary">{t.save || 'حفظ'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>{t.cancel || 'إلغاء'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
