import axios from 'axios';

// Use your PC's WiFi IP so the phone/emulator can reach the backend
const API_URL = 'http://192.168.100.10:3001/api';
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
export const getCreditSales = () => api.get('/sales/credits');
export const markCreditPaid = (id) => api.put(`/sales/${id}/pay`);

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
export const getPayroll = () => api.get('/payroll');
export const createPayroll = (data) => api.post('/payroll', data);
export const deletePayroll = (id) => api.delete(`/payroll/${id}`);

export default api;