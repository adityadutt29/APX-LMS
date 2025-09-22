"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Book, 
  Users, 
  Trophy, 
  ArrowLeft,
  LogOut
} from 'lucide-react';

export default function TeacherProfile() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    _id: '',
    name: '',
    email: '',
    role: '',
    teachingSections: [],
    department: '',
    employeeId: '',
    avatar: null,
    isActive: true,
    createdAt: ''
  });
  
  const [teacherStats, setTeacherStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    completedCourses: 0,
    averageRating: 0
  });

  useEffect(() => {
    // Load user info from localStorage
    const email = localStorage.getItem('userEmail') || localStorage.getItem('userName') || '';
    const name = localStorage.getItem('userName') || email.split('@')[0] || '';
    
    // Set basic data from localStorage
    setUserInfo(prev => ({
      ...prev,
      name: name,
      email: email
    }));

    // Fetch complete teacher profile from API
    fetchTeacherProfile();
    
    // Fetch teacher statistics
    fetchTeacherStats();
  }, []);

  const fetchTeacherProfile = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

  const response = await fetch('http://localhost:5001/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setUserInfo(prev => ({
            ...prev,
            ...result.data,
            // Ensure arrays are properly handled
            teachingSections: result.data.teachingSections || []
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching teacher profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeacherStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

  const response = await fetch('http://localhost:5001/api/courses/teacher-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setTeacherStats(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-800 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Profile</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User size={20} />
              Personal Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded-lg">{userInfo.name || 'Not provided'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded-lg">{userInfo.email || 'Not provided'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded-lg">{userInfo.employeeId || 'Not assigned'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded-lg capitalize">{userInfo.role || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded-lg">{userInfo.department || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                <p className={`p-2 rounded-lg ${userInfo.isActive ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                  {userInfo.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Created</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded-lg">
                  {userInfo.createdAt ? new Date(userInfo.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Not available'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded-lg font-mono text-sm">{userInfo._id || 'Not available'}</p>
              </div>
            </div>
            
            {/* Teaching Sections */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Sections</label>
              <div className="flex flex-wrap gap-2">
                {userInfo.teachingSections && userInfo.teachingSections.map((section, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                  >
                    {section}
                  </span>
                ))}
                {(!userInfo.teachingSections || userInfo.teachingSections.length === 0) && (
                  <span className="text-gray-500 text-sm">No teaching sections assigned</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userName');
                router.push('/auth');
              }}
              className="w-full flex items-center justify-center gap-2 p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Avatar */}
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-3xl font-bold">
                {userInfo.name.charAt(0).toUpperCase() || userInfo.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{userInfo.name}</h3>
            <p className="text-gray-600">{userInfo.department}</p>
            <div className="flex items-center justify-center gap-1 mt-2 text-sm text-gray-500">
              <Calendar size={16} />
              {userInfo.createdAt ? (
                `Joined ${new Date(userInfo.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}`
              ) : (
                'Join date not available'
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Teaching Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Book size={16} className="text-purple-600" />
                  <span className="text-sm text-gray-600">Total Courses</span>
                </div>
                <span className="font-semibold text-gray-900">{teacherStats.totalCourses}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-blue-600" />
                  <span className="text-sm text-gray-600">Total Students</span>
                </div>
                <span className="font-semibold text-gray-900">{teacherStats.totalStudents}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => router.push('/teacher')}
                className="w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                View My Courses
              </button>
              <button 
                onClick={() => router.push('/teacher?tab=students')}
                className="w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Manage Students
              </button>
              <button 
                onClick={() => router.push('/teacher?tab=grades')}
                className="w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                View Grades
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
