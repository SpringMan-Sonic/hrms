import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// Employees
export const employeeApi = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  delete: (id) => api.delete(`/employees/${id}`),
  getSummary: () => api.get('/employees/stats/summary'),
};

// Attendance
export const attendanceApi = {
  getAll: (params) => api.get('/attendance', { params }),
  getByEmployee: (employeeId, params) => api.get(`/attendance/employee/${employeeId}`, { params }),
  mark: (data) => api.post('/attendance', data),
  delete: (id) => api.delete(`/attendance/${id}`),
};

export default api;