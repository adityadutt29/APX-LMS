"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      const userRole = localStorage.getItem('userRole');
      const token = localStorage.getItem('token');

      if (!isAuthenticated || !token) {
        router.push('/auth');
        return;
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        // User doesn't have the required role
        alert('You do not have permission to access this page');
        router.push('/auth');
        return;
      }

      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [router, allowedRoles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
