"use client";
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export const useLogout = () => {
  const router = useRouter();

  const logout = () => {
    try {
      // Clear all authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userSection');
      localStorage.removeItem('userDepartment');
      
      toast.success('Logged out successfully');
      router.replace('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout');
      // Force redirect even if there's an error
      router.replace('/auth');
    }
  };

  return logout;
};