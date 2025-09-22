"use client";
import { useState, useEffect } from 'react';
import { Book, Users as UsersIcon, LayoutList, Settings as SettingsIcon, Bell, Search, Trophy, MessageCircle, LogOut } from 'lucide-react';
import Overview from './component/Overview';
import UsersManagement from './component/Users';
import SystemSettings from './component/Settings';
import AdminChatPage from './chat/page';
import Image from 'next/image'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || 'Admin';
    setUserEmail(email);
  }, []);

  const handleLogout = () => {
    // Clear all stored authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userSection');
    localStorage.removeItem('userDepartment');
    
    // Redirect to auth page
    window.location.href = '/auth';
  };

  // Update the Users icon usage in the navigation
  <button
    onClick={() => setActiveTab('users')}
    className={`w-full flex items-center gap-3 p-3 rounded-lg ${
      activeTab === 'users' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'
    }`}
  >
    <UsersIcon size={18} />
    Users
  </button>
  
  // Update the renderActiveTab function
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'users':
        return <UsersManagement />;
      case 'chat':
        return <AdminChatPage />;
      case 'settings':
        return <SystemSettings />;
      default:
        return null;
    }
  };
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-4 fixed h-full flex flex-col">
         <div className="flex flex-col items-center">
                  <Image
                    src="/APXLMSBlack.png"
                    alt="ApexLMS Logo"
                    width={160}
                    height={160}
                    className="object-contain"
                  />
          </div>

        <nav className="space-y-2 flex-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'overview' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'
            }`}
          >
            <Book size={18} />
            Overview
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'users' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'
            }`}
          >
            <UsersIcon size={18} />
            Users
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'chat' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'
            }`}
          >
            <MessageCircle size={18} />
            Chat
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg ${
              activeTab === 'settings' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'
            }`}
          >
            <SettingsIcon size={18} />
            Settings
          </button>
        </nav>

        {/* Logout Button */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
          <div className="text-xs text-gray-400 text-center py-2">
            ApexLMS v1.0
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
          </div>
        </div>

        {renderActiveTab()}
      </div>
    </div>
  );
};

export default AdminDashboard;