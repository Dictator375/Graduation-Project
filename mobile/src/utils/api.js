import axios from 'axios';

// Uncomment the IP address that matches your current network:
// const API_URL = 'http://192.168.100.10:3001/api'; // Your Home Wi-Fi IP
const API_URL = 'http://10.29.11.229:3001/api';     // Your Mobile Data IP

const api = axios.create({ baseURL: API_URL, timeout: 10000 });

// Module-level token storage (React Native has no localStorage)
let _token = null;

export function setAuthToken(token) {
  _token = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

api.interceptors.response.use(
   r => r,
   err => {
      if (err.response?.status === 401) {
         _token = null;
         delete api.defaults.headers.common['Authorization'];
      }
      return Promise.reject(err);
   }
);

// ── Auth ──────────────────────────────────────────────────────
export const login = (data) => api.post('/auth/login', data);
export const registerWorker = (data) => api.post('/auth/register', data);
export const changePassword = (data) => api.post('/auth/change-password', data);
export const getMe = () => api.get('/auth/me');

// ── Employees ─────────────────────────────────────────────────
export const getEmployees = () => api.get('/employees');
export const getEmployee = (id) => api.get(`/employees/${id}`);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);
export const getTeams = () => api.get('/employees/teams/list');

// ── Sales ─────────────────────────────────────────────────────
export const getSales = (params) => api.get('/sales', { params });
export const getSale = (id) => api.get(`/sales/${id}`);
export const createSale = (data) => api.post('/sales', data);
export const getSalesSummary = (params) => api.get('/sales/summary', { params });
export const getShiftSales = () => api.get('/sales/shift-summary');
export const getEmployeeRanking = (params) => api.get('/sales/employee-ranking', { params });
export const getCreditSales = () => api.get('/sales/credits');
export const markCreditPaid = (id) => api.put(`/sales/${id}/pay`);

// ── Pumps ─────────────────────────────────────────────────────
export const getPumps = () => api.get('/pumps');
export const createPump = (data) => api.post('/pumps', data);
export const updatePump = (id, data) => api.put(`/pumps/${id}`, data);

// ── Inventory ─────────────────────────────────────────────────
export const getInventory = () => api.get('/inventory');
export const getFuelTypes = () => api.get('/inventory/fuel-types');
export const refillInventory = (data) => api.post('/inventory/refill', data);
export const updateFuelPrice = (id, price) => api.put(`/inventory/price/${id}`, { price_per_liter: price });
export const getRefillHistory = () => api.get('/inventory/refill-history');

// ── Shifts & Attendance ───────────────────────────────────────
export const getShifts = (date) => api.get('/shifts', { params: { date } });
export const createShift = (data) => api.post('/shifts', data);
export const deleteShift = (id) => api.delete(`/shifts/${id}`);
export const getAttendance = (date) => api.get('/shifts/attendance', { params: { date } });
export const getMyAttendance = (month) => api.get('/shifts/attendance/my', { params: { month } });
export const saveAttendance = (records) => api.post('/shifts/attendance', { records });
export const getShiftTeams = () => api.get('/shifts/teams');

// ── Suppliers ─────────────────────────────────────────────────
export const getSuppliers = () => api.get('/suppliers');
export const getSupplier = (id) => api.get(`/suppliers/${id}`);
export const createSupplier = (data) => api.post('/suppliers', data);
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`);

// ── Messages ──────────────────────────────────────────────────
export const getMessages = () => api.get('/messages');
export const getConversation = (userId) => api.get(`/messages/conversation/${userId}`);
export const getBroadcast = () => api.get('/messages/broadcast');
export const sendMessage = (data) => api.post('/messages', data);
export const getUnreadCount = () => api.get('/messages/unread-count');
export const getMessageUsers = () => api.get('/messages/users/list');
export const getTeamMembers = () => api.get('/messages/team');
export const markRead = (id) => api.put(`/messages/${id}/read`);

// ── Invoices ──────────────────────────────────────────────────
export const getInvoices = (params) => api.get('/invoices', { params });
export const getInvoice = (id) => api.get(`/invoices/${id}`);
export const createInvoice = (data) => api.post('/invoices', data);
export const updateInvoiceStatus = (id, status) => api.put(`/invoices/${id}/status`, { status });

// ── Institutions ──────────────────────────────────────────────
export const getInstitutions = () => api.get('/institutions');
export const getInstitution = (id) => api.get(`/institutions/${id}`);
export const createInstitution= (data) => api.post('/institutions', data);
export const updateInstitution= (id, data) => api.put(`/institutions/${id}`, data);
export const deleteInstitution= (id) => api.delete(`/institutions/${id}`);

// ── Payroll ───────────────────────────────────────────────────
export const getPayroll = (month) => api.get('/payroll', { params: { month } });
export const createPayroll = (data) => api.post('/payroll', data);
export const deletePayroll = (id) => api.delete(`/payroll/${id}`);
export const getPayrollReport = (month) => api.get('/payroll', { params: { month } });
export const generatePayroll = (month) => api.post('/payroll/generate', { month });

// ── Credentials (manager only) ────────────────────────────────
export const getCredentials = () => api.get('/auth/credentials');
export const updateCredentials = (id, data) => api.put(`/auth/credentials/${id}`, data);

export default api;