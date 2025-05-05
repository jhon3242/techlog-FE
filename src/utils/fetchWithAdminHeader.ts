// src/utils/fetchWithAdminHeader.ts
import { API_BASE_URL, getAdminHeaderFromStorage } from './apiConfig';

export function fetchWithAdminHeader(path: string, init?: RequestInit) {
  // Ensure path doesn't start with a slash when concatenating
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  
  // 로컬스토리지에서 관리자 헤더 값을 가져옴
  const adminHeader = getAdminHeaderFromStorage();
  
  return fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      'x-admin-header': adminHeader,
    },
  });
}