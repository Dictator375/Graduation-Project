import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Auth
import LoginScreen from './src/screens/Login';

// Admin screens
import AdminMenu from './src/screens/admin/menu';
import AdminEmployees from './src/screens/admin/employees';
import AdminAttendance from './src/screens/admin/attendance';
import AdminInventory from './src/screens/admin/inventory';
import AdminReports from './src/screens/admin/reports';
import AdminInvoices from './src/screens/admin/invoices';
import AdminCredits from './src/screens/admin/credits';
import AdminInstitutions from './src/screens/admin/institutions';
import AdminPayroll from './src/screens/admin/payroll';
import AdminMessages from './src/screens/admin/Messages';

// Worker screens
import WorkerDashboard from './src/screens/worker/Dashboard';
import WorkerSales from './src/screens/worker/Sales';
import WorkerMessages from './src/screens/worker/Messages';
import WorkerChat from './src/screens/worker/chat';

function Navigator() {
  const { isLoggedIn, user, loading } = useAuth();
  const [screen, setScreen] = useState('home');
  const [params, setParams] = useState({});

  function navigate(to, p = {}) { setScreen(to); setParams(p); }
  function goBack() { setScreen('home'); }

  if (loading) return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#0f1117' }}>
      <ActivityIndicator color="#E85D24" size="large" />
    </View>
  );

  if (!isLoggedIn) return <LoginScreen navigate={navigate} />;

  const isManager = user?.role === 'manager' || user?.role === 'team_leader';

  // ── Admin routing ──────────────────────────────────────────
  if (isManager) {
    const nav = { navigate, goBack };
    switch (screen) {
      case 'employees': return <AdminEmployees {...nav} />;
      case 'attendance': return <AdminAttendance {...nav} />;
      case 'inventory': return <AdminInventory {...nav} />;
      case 'reports': return <AdminReports {...nav} />;
      case 'invoices': return <AdminInvoices {...nav} />;
      case 'credits': return <AdminCredits {...nav} />;
      case 'institutions': return <AdminInstitutions {...nav} />;
      case 'payroll': return <AdminPayroll {...nav} />;
      case 'messages': return <AdminMessages {...nav} />;
      default: return <AdminMenu {...nav} />;
    }
  }

  // ── Worker routing ─────────────────────────────────────────
  switch (screen) {
    case 'sales': return <WorkerSales navigate={navigate} goBack={goBack} />;
    case 'messages': return <WorkerMessages navigate={navigate} goBack={goBack} />;
    case 'chat': return <WorkerChat navigate={navigate} goBack={goBack} />;
    default: return <WorkerDashboard navigate={navigate} />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <Navigator />
    </AuthProvider>
  );
}