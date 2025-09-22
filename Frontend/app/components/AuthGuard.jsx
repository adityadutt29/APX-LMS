"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AuthGuard({ children, requiredRole = null }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');
        const isAuthenticatedFlag = localStorage.getItem('isAuthenticated');

        // Check if user is authenticated
        if (!token || !userRole || isAuthenticatedFlag !== 'true') {
          toast.error('Please login to access this page');
          router.replace('/auth');
          return;
        }

        // Check role-based access if requiredRole is specified
        if (requiredRole && userRole !== requiredRole) {
          toast.error(`Access denied. This page is for ${requiredRole}s only.`);
          
          // Redirect to appropriate dashboard based on user's actual role
          switch (userRole) {
            case 'student':
              router.replace('/classroom');
              break;
            case 'teacher':
              router.replace('/teacher');
              break;
            case 'admin':
              router.replace('/admin');
              break;
            default:
              router.replace('/auth');
          }
          return;
        }

        // User is authenticated and has correct role
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check error:', error);
        toast.error('Authentication error. Please login again.');
        router.replace('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, requiredRole]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated
  return isAuthenticated ? children : null;
}
