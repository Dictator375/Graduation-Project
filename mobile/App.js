import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Screens
import LoginScreen        from './src/screens/Login';
import AdminDashboard     from './src/screens/admin/Dashboard';
import AdminMessages      from './src/screens/admin/Messages';
import WorkerDashboard    from './src/screens/worker/Dashboard';
import WorkerSales        from './src/screens/worker/Sales';
import WorkerMessages     from './src/screens/worker/Messages';

// Simple state-based navigation — no native modules needed
function Navigator() {
  const { isLoggedIn, user, loading } = useAuth();
  const [screen, setScreen] = useState('home');
  const [params, setParams] = useState({});

  function navigate(to, p = {}) { setScreen(to); setParams(p); }
  function goBack()              { setScreen('home'); }

  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#0f1117' }}>
        <ActivityIndicator color="#E85D24" size="large" />
      </View>
    );
  }

  // Not logged in → Login
  if (!isLoggedIn) return <LoginScreen navigate={navigate} />;

  const isManager = user?.role === 'manager' || user?.role === 'team_leader';

  // Manager screens
  if (isManager) {
    if (screen === 'messages') return <AdminMessages navigate={navigate} goBack={goBack} params={params} />;
    return <AdminDashboard navigate={navigate} />;
  }

  // Worker screens
  if (screen === 'sales')    return <WorkerSales    navigate={navigate} goBack={goBack} />;
  if (screen === 'messages') return <WorkerMessages navigate={navigate} goBack={goBack} />;
  return <WorkerDashboard navigate={navigate} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Navigator />
    </AuthProvider>
  );
}