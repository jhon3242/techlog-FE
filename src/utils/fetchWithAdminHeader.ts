// src/utils/fetchWithAdminHeader.ts
import { API_BASE_URL } from './apiConfig';

const ADMIN_HEADER = import.meta.env.VITE_ADMIN_HEADER;

export function fetchWithAdminHeader(path: string, init?: RequestInit) {
  // Ensure path doesn't start with a slash when concatenating
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  
  return fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      'x-admin-header': ADMIN_HEADER,
    },
  });
}