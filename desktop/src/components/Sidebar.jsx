import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const MANAGER_NAV = [
  { sectionKey: 'overview' },
  { id: 'dashboard',    to: '/admin',              icon: '📊' },
  { id: 'reports',      to: '/admin/sales',         icon: '📈' },
  { sectionKey: 'operations' },
  { id: 'inventory',    to: '/admin/inventory',     icon: '⛽' },
  { id: 'pumps',        to: '/admin/pumps',         icon: '🚰' },
  { id: 'shifts',       to: '/admin/shifts',        icon: '📅' },
  { id: 'employees',    to: '/admin/employees',     icon: '👥' },
  { sectionKey: 'finance' },
  { id: 'invoices',     to: '/admin/invoices',      icon: '🧾' },
  { id: 'credits',      to: '/admin/credits',       icon: '💳' },
  { id: 'institutions', to: '/admin/institutions',  icon: '🏢' },
  { sectionKey: 'other' },
  { id: 'messages',     to: '/admin/messages',      icon: '💬' },
  { id: 'payroll',      to: '/admin/payroll',       icon: '💰' },
  { id: 'register',     to: '/admin/register',      icon: '➕' },
  { id: 'credentials',  to: '/admin/credentials',   icon: '🔑' },
];

const WORKER_NAV = [
  { id: 'dashboard', to: '/worker',          icon: '🏠' },
  { id: 'sales',     to: '/worker/sales',    icon: '⛽' },
  { id: 'messages',  to: '/worker/messages', icon: '💬' },
];

import { useState } from 'react';
export default function Sidebar() {
  const { user, doLogout, t, toggleLang, lang, theme, toggleTheme } = useAuth();
  const navigate  = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const isManager = user?.role === 'manager';
  const isTeamLeader = user?.role === 'team_leader';
  let navItems  = isManager || isTeamLeader ? [...MANAGER_NAV] : [...WORKER_NAV];
  
  if (isTeamLeader) {
    navItems = navItems.filter(i => i.id !== 'register' && i.id !== 'payroll' && i.id !== 'employees');
    const reportsIdx = navItems.findIndex(i => i.id === 'reports');
    if (reportsIdx !== -1) {
      navItems.splice(reportsIdx + 1, 0, { id: 'sales', to: '/admin/new-sale', icon: '⛽' });
    }
  }

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
          if (item.sectionKey) return (
            <div key={idx} style={{
              fontSize: 10, color: 'var(--text-muted)', padding: '10px 14px 4px',
              letterSpacing: '.04em', textTransform: 'uppercase',
            }}>{t[item.sectionKey]}</div>
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
              {t[item.id] || item.label}
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
          onClick={() => setShowSettings(true)}
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          ⚙️ {t.settings || 'الإعدادات'}
        </button>
      </div>

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ width: 350 }}>
            <div className="modal-title" style={{ textAlign: 'center' }}>⚙️ {t.settings || 'الإعدادات'}</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-ghost" style={{ justifyContent: 'space-between' }} onClick={toggleLang}>
                <span>🌐 {t.language || 'اللغة'}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'العربية' : 'Français'}</span>
              </button>
              
              <button className="btn btn-ghost" style={{ justifyContent: 'space-between' }} onClick={toggleTheme}>
                <span>{theme === 'dark' ? '🌙' : '☀️'} {t.theme || 'المظهر'}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{theme === 'dark' ? (t.darkMode || 'داكن') : (t.lightMode || 'فاتح')}</span>
              </button>

              <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />

              <button className="btn btn-danger" style={{ justifyContent: 'center' }} onClick={handleLogout}>
                🚪 {t.logout}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}