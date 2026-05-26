import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const PAGE_TITLES = {
  '/admin':              { key: 'dashboard'    },
  '/admin/employees':    { key: 'employees'    },
  '/admin/shifts':       { key: 'shifts'       },
  '/admin/inventory':    { key: 'inventory'    },
  '/admin/sales':        { key: 'reports'      },
  '/admin/invoices':     { key: 'invoices'     },
  '/admin/institutions': { key: 'institutions' },
  '/admin/messages':     { key: 'messages'     },
  '/admin/payroll':      { key: 'payroll'      },
  '/admin/register':     { key: 'register'     },
  '/worker':             { key: 'dashboard'    },
  '/worker/sales':       { key: 'newSale'      },
  '/worker/messages':    { key: 'messages'     },
  '/admin/credits': { key: 'credits' },
};

function getToday(lang) {
  return new Date().toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function Layout() {
  const { t, lang, user } = useAuth();
  const location = useLocation();
  const page     = PAGE_TITLES[location.pathname] || { key: 'dashboard' };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-title">{t[page.key] || page.key}</div>
            <div className="topbar-sub">{getToday(lang)}</div>
          </div>
          <div className="topbar-right">
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {t[user?.role] || ''}
            </div>
          </div>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
