import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { fetchWithAdminHeader } from './utils/fetchWithAdminHeader';

const AdminAuth: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const adminHeader = localStorage.getItem('X-Admin-Header');
        if (!adminHeader) {
          setIsAuthorized(false);
          setError('관리자 인증 정보가 없습니다.');
          return;
        }

        const response = await fetchWithAdminHeader('/api/admin');
        if (response.status === 200) {
          setIsAuthorized(true);
          setError(null);
        } else {
          setIsAuthorized(false);
          setError('관리자 권한이 없습니다.');
        }
      } catch (error) {
        console.error('Admin authentication error:', error);
        setIsAuthorized(false);
        setError('서버 연결에 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mt-4">접근 권한 없음</h2>
            <p className="text-gray-600 mt-2">
              {error || '관리자 페이지에 접근할 권한이 없습니다.'}
            </p>
            <button 
              onClick={() => navigate('/')}
              className="mt-6 bg-[#4C8CF7] hover:bg-[#3A7DE8] text-white font-medium py-2 px-4 rounded transition-colors duration-300"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default AdminAuth;
