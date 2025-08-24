// src/api/axios.js
import axios from 'axios';

// Normalize base URL (avoid trailing slash causing // in requests)
const BASE_URL = (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

const api = axios.create({
  baseURL: BASE_URL,
});

// Attach JWT from common keys to avoid missing-token issues
api.interceptors.request.use((config) => {
  if (config.headers?.['X-Skip-Auth']) {
    delete config.headers['X-Skip-Auth'];
    return config;
  }

  const possibleKeys = ['token', 'authToken', 'jwt', 'accessToken'];
  let token;
  for (const k of possibleKeys) {
    try {
      const v = localStorage.getItem(k);
      if (v) {
        token = v;
        break;
      }
    } catch {
      // ignore storage read errors
    }
  }
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
