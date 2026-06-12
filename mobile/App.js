import React, { useState, useRef, useEffect } from 'react';
import { View, ActivityIndicator, Animated, Dimensions, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Auth
import LoginScreen from './src/screens/Login';

// Admin screens
import AdminMenu from './src/screens/admin/menu';
import AdminDashboard from './src/screens/admin/Dashboard';
import AdminEmployees from './src/screens/admin/employees';
import AdminAttendance from './src/screens/admin/attendance';
import AdminInventory from './src/screens/admin/inventory';
import AdminPumps from './src/screens/admin/pumps';
import AdminReports from './src/screens/admin/reports';
import AdminInvoices from './src/screens/admin/invoices';
import AdminCredits from './src/screens/admin/credits';
import AdminInstitutions from './src/screens/admin/institutions';
import AdminSuppliers from './src/screens/admin/suppliers';
import AdminPayroll from './src/screens/admin/payroll';
import AdminMessages from './src/screens/admin/Messages';

// Worker screens
import WorkerDashboard from './src/screens/worker/Dashboard';
import WorkerSales from './src/screens/worker/Sales';
import WorkerChat from './src/screens/worker/chat';

const { width } = Dimensions.get('window');

// Animated screen wrapper — slides in from right, fades in
function AnimatedScreen({ children, screenKey }) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    slideAnim.setValue(40);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [screenKey]);

  return (
    <Animated.View style={[styles.fill, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      {children}
    </Animated.View>
  );
}

function Navigator() {
  const { isLoggedIn, user, loading } = useAuth();
  const [screen, setScreen] = useState('home');
  const [params,  setParams]  = useState({});
  const [screenKey, setScreenKey] = useState(0);

  function navigate(to, p = {}) {
    setScreen(to);
    setParams(p);
    setScreenKey(k => k + 1);
  }
  function goBack() { navigate('home'); }

  if (loading) return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator color="#E85D24" size="large" />
    </View>
  );

  if (!isLoggedIn) return (
    <AnimatedScreen screenKey="login">
      <LoginScreen navigate={navigate} />
    </AnimatedScreen>
  );

  const isManager = user?.role === 'manager' || user?.role === 'team_leader';
  const nav = { navigate, goBack };

  // ── Admin routing ───────────────────────────────────────────
  if (isManager) {
    let Component;
    switch (screen) {
      case 'dashboard':    Component = <AdminDashboard {...nav} />; break;
      case 'employees':    Component = <AdminEmployees {...nav} />; break;
      case 'attendance':   Component = <AdminAttendance {...nav} />; break;
      case 'inventory':    Component = <AdminInventory {...nav} />; break;
      case 'pumps':        Component = <AdminPumps {...nav} />; break;
      case 'reports':      Component = <AdminReports {...nav} />; break;
      case 'invoices':     Component = <AdminInvoices {...nav} />; break;
      case 'credits':      Component = <AdminCredits {...nav} />; break;
      case 'institutions': Component = <AdminInstitutions {...nav} />; break;
      case 'suppliers':    Component = <AdminSuppliers {...nav} />; break;
      case 'payroll':
        Component = user?.role !== 'manager' ? <AdminMenu {...nav} /> : <AdminPayroll {...nav} />;
        break;
      case 'messages':     Component = <AdminMessages {...nav} />; break;
      case 'sales':        Component = <WorkerSales navigate={navigate} goBack={goBack} />; break;
      default:             Component = <AdminMenu {...nav} />;
    }
    return <AnimatedScreen screenKey={screenKey}>{Component}</AnimatedScreen>;
  }

  // ── Worker routing ──────────────────────────────────────────
  let WorkerComponent;
  switch (screen) {
    case 'sales':    WorkerComponent = <WorkerSales    navigate={navigate} goBack={() => navigate('home')} />; break;
    case 'chat':     WorkerComponent = <WorkerChat     navigate={navigate} goBack={() => navigate('home')} />; break;
    default:         WorkerComponent = <WorkerDashboard navigate={navigate} />;
  }
  return <AnimatedScreen screenKey={screenKey}>{WorkerComponent}</AnimatedScreen>;
}

const styles = StyleSheet.create({
  fill:        { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d1117' },
});

export default function App() {
  return (
    <AuthProvider>
      <Navigator />
    </AuthProvider>
  );
}