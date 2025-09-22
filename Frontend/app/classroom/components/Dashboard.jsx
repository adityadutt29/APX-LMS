"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, Trophy, Clock, Target, Bell, Plus, X, Check } from "lucide-react"
import { useNotifications } from "../../hooks/useNotifications"

export default function Dashboard() {
  const router = useRouter()
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Join Course Modal State
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [joinMessageType, setJoinMessageType] = useState(''); // 'success' or 'error'
  
  // Use the notifications hook for real-time functionality
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.notification-dropdown') && !event.target.closest('.notification-button')) {
        setShowNotifications(false);
      }
      if (!event.target.closest('.user-tooltip') && !event.target.closest('.user-avatar')) {
        setShowTooltip(false);
      }
    };

    if (showNotifications || showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications, showTooltip]);

  // Join Course Handler
  const handleJoinCourse = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setJoinMessage('Please enter a valid course code');
      setJoinMessageType('error');
      return;
    }

    setJoinLoading(true);
    setJoinMessage('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setJoinMessage('Please login first');
        setJoinMessageType('error');
        setJoinLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/courses/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ joinCode: joinCode.trim().toUpperCase() })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to join course');
      }
      
      setJoinMessage(`Successfully joined "${data.data.title}"!`);
      setJoinMessageType('success');
      setJoinCode('');
      
      // Refresh the courses after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error joining course:', error);
      setJoinMessage(error.message || 'Failed to join course. Please check the course code.');
      setJoinMessageType('error');
    } finally {
      setJoinLoading(false);
    }
  };

  // Close modal when clicking outside
  const closeJoinModal = () => {
    setShowJoinModal(false);
    setJoinCode('');
    setJoinMessage('');
    setJoinMessageType('');
  };



  useEffect(() => {
    // Get user info from localStorage
    const storedUserName = localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'Student';
    const storedUserEmail = localStorage.getItem('userEmail') || 'student@email.com';
    const storedUserId = localStorage.getItem('userId');
    const storedUserRole = localStorage.getItem('userRole') || 'student';
    
    setUserName(storedUserName);
    setUserEmail(storedUserEmail);
    setUserId(storedUserId);
    setUserRole(storedUserRole);

    const fetchEnrolledCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No authentication token found');
          setLoading(false);
          return;
        }

  const response = await fetch('http://localhost:5001/api/courses/student', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        
        const result = await response.json();
        setEnrolledCourses(result.data || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setEnrolledCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div className="ml-3 text-gray-500">Loading your courses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-10 px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Left side - Logo/Title */}
            <div className="flex items-center space-x-4">
               {/* User welcome section */}
              <div>
                    <h2 className="text-3xl font-extrabold text-blue-900 mb-1 drop-shadow-sm">
                      Welcome, <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{userName}</span>!
                    </h2>
              </div>
            </div>

            {/* Right side - Join Course, Notifications and User Avatar */}
            <div className="flex items-center space-x-4">
              {/* Join Course Button */}
              <button
                onClick={() => setShowJoinModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Join Course</span>
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="notification-button p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors relative"
                >
                  <Bell className="w-6 h-6 text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {unreadCount}
                      </span>
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="notification-dropdown absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-40">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification._id}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                              !notification.isRead ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => !notification.isRead && markAsRead(notification._id)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                !notification.isRead ? 'bg-blue-500' : 'bg-gray-300'
                              }`} />
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-gray-900">
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                {notification.metadata?.courseTitle && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    {notification.metadata.courseTitle} ({notification.metadata.courseCode})
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                  {notification.formattedDate || new Date(notification.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-200">
                      <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar with Tooltip */}
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
                  onClick={() => router.push('/classroom/profile')}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <span className="text-white font-bold text-lg">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                {/* Tooltip */}
                {showTooltip && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-20">
                    <div 
                      className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                      onClick={() => router.push('/classroom/profile')}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">{userName}</p>
                        <p className="text-gray-600 text-xs">{userEmail}</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <button 
                        onClick={() => router.push('/classroom/profile')}
                        className="w-full text-left text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Profile →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {enrolledCourses.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No courses found</div>
              <p className="text-gray-500">Join a course to get started!</p>
            </div>
          ) : (
            enrolledCourses.map(course => (
              <div 
                key={course._id} 
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:-translate-y-1"
                onClick={() => router.push(`/classroom/${course._id}`)}
              >
                {/* Header with gradient background */}
                <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 relative p-6">
                  <div className="text-white h-full flex flex-col justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-xl leading-tight line-clamp-2 mb-3">{course.title}</h3>
                      <div className="space-y-1">
                        <p className="text-blue-100 text-sm">Section {course.section} • {course.courseCode}</p>
                        <p className="text-blue-200 text-xs">{course.semester} {course.year}</p>
                      </div>
                    </div>
                  </div>
                  {/* Circle with teacher initial */}
                  <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
                    <span className="text-white font-bold text-lg">
                      {course.teacher?.name ? course.teacher.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                </div>
                {/* Content area */}
                <div className="p-6 flex-1">
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">{course.description}</p>
                </div>
                {/* Footer with icons */}
                <div className="px-6 pb-6">
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div className="flex space-x-3">
                      {/* People icon */}
                      <button 
                        className="p-2 hover:bg-blue-50 rounded-full transition-colors group"
                        onClick={(e) => e.stopPropagation()}
                        title="View Students"
                      >
                        <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.239" />
                        </svg>
                      </button>
                      {/* Folder icon */}
                      <button 
                        className="p-2 hover:bg-green-50 rounded-full transition-colors group"
                        onClick={(e) => e.stopPropagation()}
                        title="Course Materials"
                      >
                        <svg className="w-5 h-5 text-gray-500 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </button>
                    </div>
                    {/* More options */}
                    <button 
                      className="p-2 hover:bg-gray-50 rounded-full transition-colors group"
                      onClick={(e) => e.stopPropagation()}
                      title="More Options"
                    >
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Join Course Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-200 to-blue-200 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-green-700" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Join Course</h3>
              </div>
              <button
                onClick={closeJoinModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <form onSubmit={handleJoinCourse} className="space-y-4">
                <div>
                  <label htmlFor="joinCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code
                  </label>
                  <input
                    type="text"
                    id="joinCode"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter course code (e.g., ABC123)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono tracking-wider"
                    disabled={joinLoading}
                    maxLength={10}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ask your teacher for the course code
                  </p>
                </div>

                {/* Message Display */}
                {joinMessage && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 ${
                    joinMessageType === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-700' 
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    {joinMessageType === 'success' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">{joinMessage}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeJoinModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={joinLoading || !joinCode.trim()}
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {joinLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Joining...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Join Course
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
