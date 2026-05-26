import axios from 'axios';

// Change this to your PC's local IP address
// Find it by running "ipconfig" in CMD and looking for WiFi IPv4 Address
export const API_URL = 'http://192.168.100.10:3001/api';

const api = axios.create({ baseURL: API_URL });

// Attach token to every request using a simple in-memory store
let _token = null;
export function setAuthToken(token) { _token = token; }
export function clearAuthToken()    { _token = null;  }

api.interceptors.request.use((config) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`;
  return config;
});

// Auth
export const login          = (data)   => api.post('/auth/login', data);
export const changePassword = (data)   => api.post('/auth/change-password', data);

// Sales
export const getSales        = (params) => api.get('/sales',         { params });
export const createSale      = (data)   => api.post('/sales',        data);
export const getSalesSummary = (params) => api.get('/sales/summary', { params });

// Inventory
export const getInventory  = () => api.get('/inventory');
export const getFuelTypes  = () => api.get('/inventory/fuel-types');

// Employees
export const getEmployees  = () => api.get('/employees');

// Messages
export const getConversation = (userId) => api.get(`/messages/conversation/${userId}`);
export const sendMessage     = (data)   => api.post('/messages', data);
export const getMessageUsers = ()       => api.get('/messages/users/list');

// Institutions
export const getInstitutions = () => api.get('/institutions');

// Payroll
export const getPayroll = () => api.get('/payroll');

export default api;