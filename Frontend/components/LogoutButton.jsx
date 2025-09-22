"use client";
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

const LogoutButton = ({ className = "" }) => {
  const router = useRouter();

  const handleLogout = () => {
    // Clear authentication data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAuthenticated');
    
    // Redirect to login page
    router.push('/auth');
  };

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors ${className}`}
    >
      <LogOut size={16} />
      Logout
    </button>
  );
};

export default LogoutButton;
