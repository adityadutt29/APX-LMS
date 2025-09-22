"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Brain, 
  BookOpen, 
  Code, 
  FileText, 
  Calculator, 
  Lightbulb,
  Home,
  ArrowLeft,
  Menu,
  X,
  Plus,
  MessageSquare,
  LogOut,
  User
} from "lucide-react"
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { motion } from "framer-motion"
import ChatBot from '../components/ChatBot';
import AuthGuard from '../components/AuthGuard';
import { useLogout } from '../components/LogoutHandler';

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', path: '/classroom', icon: Home },
  { id: 'viva', label: 'Viva-Voce', path: '/classroom/vivaone', icon: MessageSquare },
  { id: 'practice', label: 'Practice', path: '/classroom/practice', icon: Brain },
  { id: 'coding', label: 'Coding Practice', path: '/classroom/coding', icon: Code },
  { id: 'flashcards', label: 'Flashcards', path: '/classroom/flashcards', icon: Lightbulb },
  { id: 'yourcourses', label: 'Your Courses', path: '/classroom/yourcourses', icon: Lightbulb },
]

export default function ClassroomLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('');
  const [userInitial, setUserInitial] = useState('S');
  const logout = useLogout();

  useEffect(() => {
    // Set user initial from localStorage only once on mount
    const email = localStorage.getItem('userEmail') || '';
    const name = localStorage.getItem('userName') || '';
    setUserEmail(email);
    if (email && email.trim().length > 0) {
      setUserInitial(email.charAt(0).toUpperCase());
    } else if (name && name.trim().length > 0) {
      setUserInitial(name.charAt(0).toUpperCase());
    } else {
      setUserInitial('S');
    }
  }, []);

  // Check if current path is interview or viva related and should hide sidebar
  const shouldHideSidebar =
    (pathname.startsWith('/classroom/interview/') && pathname !== '/classroom/interview') ||
    (pathname.startsWith('/classroom/vivaone/') && pathname !== '/classroom/vivaone')

  const isActiveItem = (item) => {
    if (item.id === 'dashboard') {
      // Highlight dashboard for /classroom and /classroom/:id
      return pathname === '/classroom'|| pathname === '/classroom/_id';
    }
    if (item.id === 'viva') {
      return pathname.startsWith('/classroom/vivaone')
    }
    return pathname === item.path
  }

  const NavigationItem = ({ item }) => {
    const Icon = item.icon
    const isActive = isActiveItem(item)

    return (
      <button
        onClick={() => {
          router.push(item.path)
          setSidebarOpen(false)
        }}
        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group ${
          isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'hover:bg-blue-50 text-gray-700 hover:text-blue-700'
        }`}
      >
        <div className={`p-2 rounded-lg transition-all duration-200 ${
          isActive
            ? 'bg-white/20 text-white'
            : 'bg-blue-100 group-hover:bg-blue-200 text-blue-600 group-hover:text-blue-700'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-semibold text-sm">{item.label}</span>
        {isActive && (
          <div className="w-2 h-2 bg-white rounded-full ml-auto" />
        )}
      </button>
    )
  }

  return (
    <AuthGuard requiredRole="student">
      <div className="h-screen bg-gray-50 flex overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {!shouldHideSidebar && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar - Hidden for interview and viva pages */}
        {!shouldHideSidebar && (
          <div className={`fixed lg:static inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:transform-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}>
            <div className="w-72 bg-white backdrop-blur-xl shadow-xl fixed h-full z-40 flex flex-col border-r border-gray-200">
              {/* Header with Logo */}
              <div className="flex-shrink-0">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex flex-col items-center justify-center"
                >
                  <Image
                    src="/APXLMSBlack.png"
                    alt="AuraLMS Logo"
                    width={120}
                    height={30}
                    className="object-contain h-20 w-auto"
                    priority
                  />
                </motion.div>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto py-6 px-4">
                <nav className="space-y-2">
                  {sidebarItems.map((item) => (
                    <NavigationItem key={item.id} item={item} />
                  ))}
                </nav>
              </div>

              {/* User Profile & Logout */}
              <div className="flex-shrink-0 p-6 border-t border-gray-100 space-y-4">
                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 border border-gray-200 hover:border-red-200"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium text-sm">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`flex-1 flex flex-col h-screen overflow-hidden ${shouldHideSidebar ? 'w-full' : ''}`}>
          {/* Mobile Header */}
          <div className="lg:hidden bg-white backdrop-blur-xl shadow-sm border-b border-gray-200 px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              {!shouldHideSidebar && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  <Menu className="h-5 w-5 text-blue-600" />
                </button>
              )}
              {shouldHideSidebar && <div className="w-10" />}
              
              <h1 className="text-lg font-semibold text-gray-900">
                {pathname === '/classroom'
                  ? 'Dashboard' 
                  : pathname.startsWith('/classroom/interview')
                  ? 'Interview Practice'
                  : sidebarItems.find(item => item.path === pathname)?.label || 'ApxLMS'}
              </h1>
              
              <div className="w-10" />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto bg-gray-50">
            {children}
          </div>
          {/* Student Chatbot Widget */}
          {!shouldHideSidebar && <ChatBot />}
        </div>
      </div>
    </AuthGuard>
  )
}