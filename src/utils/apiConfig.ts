// src/utils/apiConfig.ts
// export const API_BASE_URL = 'https://techlog.p-e.kr';
export const API_BASE_URL = 'http://localhost:8080';

// 로컬스토리지에서 관리자 헤더 값을 가져오는 함수
export const getAdminHeaderFromStorage = (): string => {
  return localStorage.getItem('X-Admin-Header') || '';
};
