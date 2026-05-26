import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';

// Auth
import Login    from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// Admin pages
import AdminDashboard    from './pages/admin/Dashboard.jsx';
import AdminEmployees    from './pages/admin/Employees.jsx';
import AdminShifts       from './pages/admin/Shifts.jsx';
import AdminInventory    from './pages/admin/Inventory.jsx';
import AdminReports      from './pages/admin/Reports.jsx';
import AdminMessages     from './pages/admin/Messages.jsx';
import AdminPayroll      from './pages/admin/Payroll.jsx';
import AdminInstitutions from './pages/admin/Institutions.jsx';
import AdminInvoices     from './pages/admin/Invoices.jsx';
import AdminCredits      from './pages/admin/Credits.jsx';

// Worker pages
import WorkerDashboard from './pages/worker/Dashboard.jsx';
import WorkerSales     from './pages/worker/Sales.jsx';
import WorkerMessages  from './pages/worker/Messages.jsx';

function PrivateRoute({ children, roles }) {
  const { isLoggedIn, user } = useAuth();
  if (!isLoggedIn) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/worker" replace />;
  return children;
}

export default function App() {
  const { isLoggedIn, user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={
        !isLoggedIn
          ? <Login />
          : <Navigate to={user?.role === 'manager' || user?.role === 'team_leader' ? '/admin' : '/worker'} />
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <PrivateRoute roles={['manager', 'team_leader']}><Layout /></PrivateRoute>
      }>
        <Route index             element={<AdminDashboard />} />
        <Route path="employees"    element={<AdminEmployees />} />
        <Route path="shifts"       element={<AdminShifts />} />
        <Route path="inventory"    element={<AdminInventory />} />
        <Route path="sales"        element={<AdminReports />} />
        <Route path="invoices"     element={<AdminInvoices />} />
        <Route path="credits"      element={<AdminCredits />} />
        <Route path="institutions" element={<AdminInstitutions />} />
        <Route path="messages"     element={<AdminMessages />} />
        <Route path="payroll"      element={<AdminPayroll />} />
        <Route path="register"     element={<Register />} />
      </Route>

      {/* Worker routes */}
      <Route path="/worker" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index        element={<WorkerDashboard />} />
        <Route path="sales"    element={<WorkerSales />} />
        <Route path="messages" element={<WorkerMessages />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}