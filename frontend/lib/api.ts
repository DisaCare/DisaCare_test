import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
});

// Interceptor to attach JWT token to all requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('disacare_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const placesApi = {
  getAll: (params?: { search_query?: string; category_filter?: string }) =>
    api.get('/api/places', { params }).then(res => res.data),
    
  getById: (id: string) => 
    api.get(`/api/places/${id}`).then(res => res.data),
    
  report: (formData: FormData) =>
    api.post('/api/places/report', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data),
    
  verify: (id: string, status_action: 'approve' | 'reject') =>
    api.patch(`/api/places/verify/${id}`, { status_action }).then(res => res.data),
    
  getPending: () => 
    api.get('/api/places/pending').then(res => res.data),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }).then(res => res.data),
    
  register: (name: string, email: string, password: string) =>
    api.post('/api/auth/register', { name, email, password }).then(res => res.data),
};

export default api;
