import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const MANAGER_NAV = [
  { section: 'نظرة عامة' },
  { id: 'dashboard',    to: '/admin',              icon: '📊', label: 'لوحة التحكم'  },
  { id: 'reports',      to: '/admin/sales',         icon: '📈', label: 'التقارير'     },
  { section: 'العمليات' },
  { id: 'fuel',         to: '/admin/inventory',     icon: '⛽', label: 'مخزون الوقود' },
  { id: 'shifts',       to: '/admin/shifts',        icon: '📅', label: 'الفترات والحضور' },
  { id: 'employees',    to: '/admin/employees',     icon: '👥', label: 'الموظفون'     },
  { section: 'المالية' },
  { id: 'invoices',     to: '/admin/invoices',      icon: '🧾', label: 'الفواتير'     },
  { id: 'credits',      to: '/admin/credits',       icon: '💳', label: 'الديون'       },
  { id: 'institutions', to: '/admin/institutions',  icon: '🏢', label: 'المؤسسات'    },
  { section: 'أخرى' },
  { id: 'messages',     to: '/admin/messages',      icon: '💬', label: 'الرسائل'      },
  { id: 'payroll',      to: '/admin/payroll',       icon: '💰', label: 'مواعيد الرواتب' },
  { id: 'register',     to: '/admin/register',      icon: '➕', label: 'تسجيل عامل'  },
];

const WORKER_NAV = [
  { id: 'dashboard', to: '/worker',          icon: '🏠', label: 'لوحة التحكم' },
  { id: 'sales',     to: '/worker/sales',    icon: '⛽', label: 'تسجيل بيع'   },
  { id: 'messages',  to: '/worker/messages', icon: '💬', label: 'الرسائل'      },
];

export default function Sidebar() {
  const { user, doLogout, t, toggleLang, lang } = useAuth();
  const navigate  = useNavigate();
  const isManager = user?.role === 'manager' || user?.role === 'team_leader';
  const navItems  = isManager ? MANAGER_NAV : WORKER_NAV;

  function handleLogout() { doLogout(); navigate('/'); }

  return (
    <aside style={{
      width: '220px', minHeight: '100vh', flexShrink: 0,
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 14px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>⛽</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
          {t.appShort}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
          {t[user?.role] || ''}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {navItems.map((item, idx) => {
          if (item.section) return (
            <div key={idx} style={{
              fontSize: 10, color: 'var(--text-muted)', padding: '10px 14px 4px',
              letterSpacing: '.04em', textTransform: 'uppercase',
            }}>{item.section}</div>
          );
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin' || item.to === '/worker'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 0,
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-muted)' : 'transparent',
                borderRight: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                textDecoration: 'none', transition: 'all .15s',
              })}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {user?.full_name_ar || user?.full_name}
          </span><br />
          <span style={{ fontSize: 10 }}>{user?.username}</span>
        </div>
        <button
          onClick={toggleLang}
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', marginBottom: 6, justifyContent: 'center' }}
        >
          {lang === 'ar' ? '🇫🇷 Français' : '🇩🇿 العربية'}
        </button>
        <button
          onClick={handleLogout}
          className="btn btn-danger btn-sm"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {t.logout}
        </button>
      </div>
    </aside>
  );
}