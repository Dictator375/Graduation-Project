import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getEmployees, getAttendance, saveAttendance } from '../../utils/api.js';

const STATUS_OPTIONS = [
  { value:'present', label:'حاضر',  color:'var(--success)' },
  { value:'absent',  label:'غائب',  color:'var(--danger)'  },
  { value:'late',    label:'متأخر', color:'var(--warning)' },
  { value:'excused', label:'مبرر',  color:'var(--info)'    },
];

export default function AdminShifts() {
  const { t } = useAuth();
  const [date,       setDate]       = useState(new Date().toISOString().split('T')[0]);
  const [employees,  setEmployees]  = useState([]);
  const [attendance, setAttendance] = useState({});  // { userId: {status, check_in, check_out, notes} }
  const [saved,      setSaved]      = useState(false);
  const [loading,    setLoading]    = useState(false);

  function loadData(d) {
    setLoading(true);
    Promise.all([getEmployees(), getAttendance(d)]).then(([emp, att]) => {
      setEmployees(emp.data.filter(e => e.is_active && e.role !== 'manager'));
      const map = {};
      att.data.forEach(a => {
        map[a.user_id] = { status: a.status, check_in: a.check_in||'', check_out: a.check_out||'', notes: a.notes||'' };
      });
      setAttendance(map);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { loadData(date); }, [date]);

  function setField(userId, field, value) {
    setAttendance(prev => ({
      ...prev,
      [userId]: { ...(prev[userId]||{status:'present'}), [field]: value }
    }));
  }

  async function handleSave() {
    const records = employees.map(emp => ({
      user_id:   emp.id,
      date,
      status:    attendance[emp.id]?.status    || 'absent',
      check_in:  attendance[emp.id]?.check_in  || null,
      check_out: attendance[emp.id]?.check_out || null,
      notes:     attendance[emp.id]?.notes     || null,
    }));
    await saveAttendance(records);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Shift summary counts
  const counts = { present:0, absent:0, late:0, excused:0 };
  employees.forEach(emp => {
    const s = attendance[emp.id]?.status || 'absent';
    counts[s] = (counts[s]||0) + 1;
  });

  if (loading) return <div className="loading"><div className="spinner"/>&nbsp;{t.loading}</div>;

  return (
    <div>
      {/* Date picker + summary */}
      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:18, flexWrap:'wrap' }}>
        <input type="date" className="input" style={{width:180}} value={date} onChange={e=>setDate(e.target.value)} />
        <div style={{display:'flex',gap:8}}>
          {STATUS_OPTIONS.map(s=>(
            <span key={s.value} className="badge" style={{background:`${s.color}22`,color:s.color}}>
              {s.label}: {counts[s.value]||0}
            </span>
          ))}
        </div>
        <button className="btn btn-primary" style={{marginRight:'auto'}} onClick={handleSave}>
          {saved ? '✓ ' + t.success : t.save}
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>{t.fullName}</th><th>الفريق</th><th>{t.attendance}</th><th>{t.checkIn}</th><th>{t.checkOut}</th><th>{t.notes}</th>
            </tr></thead>
            <tbody>
              {employees.map(emp => {
                const att = attendance[emp.id] || { status:'absent' };
                const statusColor = STATUS_OPTIONS.find(s=>s.value===att.status)?.color || 'var(--text-muted)';
                return (
                  <tr key={emp.id}>
                    <td>
                      <div style={{fontWeight:500}}>{emp.full_name_ar||emp.full_name}</div>
                      <div style={{fontSize:11,color:'var(--text-muted)'}}>{t[emp.role]}</div>
                    </td>
                    <td style={{fontSize:12,color:'var(--text-secondary)'}}>{emp.team_id||'—'}</td>
                    <td>
                      <select
                        className="select" style={{width:110,padding:'5px 8px',color:statusColor}}
                        value={att.status||'absent'}
                        onChange={e=>setField(emp.id,'status',e.target.value)}
                      >
                        {STATUS_OPTIONS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td>
                      <input type="time" className="input" style={{width:110,padding:'5px 8px'}}
                        value={att.check_in||''} onChange={e=>setField(emp.id,'check_in',e.target.value)} />
                    </td>
                    <td>
                      <input type="time" className="input" style={{width:110,padding:'5px 8px'}}
                        value={att.check_out||''} onChange={e=>setField(emp.id,'check_out',e.target.value)} />
                    </td>
                    <td>
                      <input className="input" style={{padding:'5px 8px'}}
                        placeholder={t.notes} value={att.notes||''}
                        onChange={e=>setField(emp.id,'notes',e.target.value)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
