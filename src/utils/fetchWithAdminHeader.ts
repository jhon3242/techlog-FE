// src/utils/fetchWithAdminHeader.ts
const ADMIN_HEADER = import.meta.env.VITE_ADMIN_HEADER;

export function fetchWithAdminHeader(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      'x-admin-header': ADMIN_HEADER,
    },
  });
}