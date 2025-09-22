"use client";
import { useState, useEffect } from 'react';
import { Eye, BookOpen, Users, GraduationCap, Shield, User, EyeOff, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('student');
  
  // Student login state
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentShowPassword, setStudentShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Admin login state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminRole, setAdminRole] = useState('teacher');
  const [adminShowPassword, setAdminShowPassword] = useState(false);

  // Load saved credentials on component mount
  useEffect(() => {
    const savedStudentEmail = localStorage.getItem('rememberedStudentEmail');
    const savedStudentPassword = localStorage.getItem('rememberedStudentPassword');
    const savedAdminEmail = localStorage.getItem('rememberedAdminEmail');
    const savedAdminPassword = localStorage.getItem('rememberedAdminPassword');
    const savedAdminRole = localStorage.getItem('rememberedAdminRole');
    
    if (savedStudentEmail) {
      setStudentEmail(savedStudentEmail);
      setRememberMe(true);
    }
    if (savedStudentPassword) {
      setStudentPassword(savedStudentPassword);
    }
    if (savedAdminEmail) {
      setAdminEmail(savedAdminEmail);
    }
    if (savedAdminPassword) {
      setAdminPassword(savedAdminPassword);
    }
    if (savedAdminRole) {
      setAdminRole(savedAdminRole);
    }
  }, []);

  useEffect(() => {
    // Load Google API script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "528709183868-5855h81bq2uph03glnp1oea49oc97gn3.apps.googleusercontent.com",
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false
        });
        
        // Render the Google button directly when student tab is active
        if (activeTab === 'student') {
          setTimeout(() => {
            const googleButton = document.getElementById('google-signin-button');
            if (googleButton) {
              window.google.accounts.id.renderButton(
                googleButton,
                { 
                  theme: 'outline', 
                  size: 'large',
                  text: 'continue_with',
                  width: 350
                }
              );
            }
          }, 500);
        }
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [activeTab]);

  const handleGoogleResponse = async (response) => {
    try {
      console.log('Google response received:', response);
      
      const res = await fetch('http://localhost:5001/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: response.credential })
      });

      const data = await res.json();
      
      if (!res.ok) {
        // Handle specific validation errors for Google OAuth
        if (data.message && data.message.includes('studentId') && data.message.includes('section')) {
          throw new Error('Google sign-in is temporarily unavailable. Please use email/password login or contact your administrator to set up your student profile.');
        }
        throw new Error(data.message || 'Google login failed');
      }

      // Store auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('isAuthenticated', 'true');
      
      if (data.user.section) localStorage.setItem('userSection', data.user.section);
      if (data.user.department) localStorage.setItem('userDepartment', data.user.department);
      
      toast.success(data.message || `Welcome, ${data.user.name}!`);
      
      // Redirect to student dashboard for Google OAuth users
      router.push('/classroom');
    } catch (error) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Google login failed. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      if (window.google && window.google.accounts) {
        // Try to trigger the one-tap prompt first
        window.google.accounts.id.prompt((notification) => {
          console.log('Prompt notification:', notification);
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If prompt fails, ensure button is rendered
            const googleButton = document.getElementById('google-signin-button');
            if (googleButton) {
              googleButton.innerHTML = ''; // Clear existing content
              window.google.accounts.id.renderButton(
                googleButton,
                { 
                  theme: 'outline', 
                  size: 'large',
                  text: 'continue_with',
                  width: 350
                }
              );
            }
          }
        });
      } else {
        toast.error('Google authentication is not available. Please try again.');
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Google login failed. Please try again.');
    }
  };

  const handleLogin = async (formData) => {
    const { email, password, role } = formData;
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5001/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      // Validate role matches the login tab and selected role
      if (activeTab === 'student' && data.user.role !== 'student') {
        throw new Error('This account is not a student account.');
      }
      
      if (activeTab === 'admin') {
        if (data.user.role === 'student') {
          throw new Error('Student accounts cannot login through Administration tab.');
        }
        
        // Validate the selected admin role matches the actual user role
        if (adminRole === 'teacher' && data.user.role !== 'teacher') {
          throw new Error('This account is not a teacher account.');
        }
        
        if (adminRole === 'admin' && data.user.role !== 'admin') {
          throw new Error('This account is not an admin account.');
        }
      }

      // Handle Remember Me functionality
      if (rememberMe) {
        if (activeTab === 'student') {
          localStorage.setItem('rememberedStudentEmail', email);
          localStorage.setItem('rememberedStudentPassword', password);
        } else {
          localStorage.setItem('rememberedAdminEmail', email);
          localStorage.setItem('rememberedAdminPassword', password);
          localStorage.setItem('rememberedAdminRole', adminRole);
        }
      } else {
        // Clear remembered credentials if unchecked
        if (activeTab === 'student') {
          localStorage.removeItem('rememberedStudentEmail');
          localStorage.removeItem('rememberedStudentPassword');
        } else {
          localStorage.removeItem('rememberedAdminEmail');
          localStorage.removeItem('rememberedAdminPassword');
          localStorage.removeItem('rememberedAdminRole');
        }
      }

      // Store auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('isAuthenticated', 'true');
      
      if (data.user.section) localStorage.setItem('userSection', data.user.section);
      if (data.user.department) localStorage.setItem('userDepartment', data.user.department);
      
      toast.success(data.message || `Welcome back, ${data.user.name}!`);
      
      // Redirect based on role
      switch(data.user.role) {
        case 'teacher': router.push('/teacher'); break;
        case 'student': router.push('/classroom'); break;
        case 'admin': router.push('/admin'); break;
        default: router.push('/dashboard');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Login failed. Please try again.');
    }
  };

  // Check if user is already authenticated and redirect
  useEffect(() => {
    const checkExistingAuth = () => {
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole');
      const isAuthenticated = localStorage.getItem('isAuthenticated');

      if (token && userRole && isAuthenticated === 'true') {
        // User is already authenticated, redirect to appropriate dashboard
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
            // Clear invalid auth data
            localStorage.clear();
        }
      }
    };

    checkExistingAuth();
  }, [router]);

  // Handle tab change - load appropriate remembered credentials
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    if (tab === 'student') {
      const savedEmail = localStorage.getItem('rememberedStudentEmail');
      const savedPassword = localStorage.getItem('rememberedStudentPassword');
      setRememberMe(!!savedEmail);
    } else {
      const savedEmail = localStorage.getItem('rememberedAdminEmail');
      const savedPassword = localStorage.getItem('rememberedAdminPassword');
      setRememberMe(!!savedEmail);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
      
      {/* Left Side - Welcome Section */}
      <div className="w-1/2 bg-white p-8 lg:p-12 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Home</span>
            </button>
          </div>

          {/* Brand Logo */}
          <div className="mb-2">
            <Image src={"/APXLMSBlack.png"} alt="ApexLMS Logo" width={150} height={40} className="object-contain h-20 w-auto" />
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">WELCOME <span className='text-blue-600'>BACK</span></h2>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => handleTabChange('student')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all duration-200 text-sm ${
                activeTab === 'student'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span className="font-medium">Student</span>
            </button>
            <button
              onClick={() => handleTabChange('admin')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all duration-200 text-sm ${
                activeTab === 'admin'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span className="font-medium">Administration</span>
            </button>
          </div>

          {/* Student Login Form */}
          {activeTab === 'student' && (
            <form className="space-y-4" onSubmit={e => {
              e.preventDefault();
              handleLogin({ email: studentEmail, password: studentPassword, role: 'student' });
            }}>
              {/* Google OAuth Button */}
              <div id="google-signin-button" className="flex justify-center min-h-[45px] mb-4"></div>

              {/* Divider */}
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-3 text-gray-500 text-xs">or</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={studentEmail}
                  onChange={e => setStudentEmail(e.target.value)}
                  className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-blue-600 bg-transparent focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={studentShowPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={studentPassword}
                    onChange={e => setStudentPassword(e.target.value)}
                    className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-blue-600 bg-transparent focus:outline-none transition-colors pr-8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setStudentShowPassword(!studentShowPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    {studentShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember</span>
                </label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                SUBMIT
              </button>
            </form>
          )}

          {/* Admin Login Form */}
          {activeTab === 'admin' && (
            <form className="space-y-4" onSubmit={e => {
              e.preventDefault();
              handleLogin({ email: adminEmail, password: adminPassword, role: adminRole });
            }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {adminRole === 'teacher' ? 'Teacher Username' : 'Admin Username'}
                </label>
                <input
                  type="email"
                  placeholder={`Enter your ${adminRole} email`}
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-blue-600 bg-transparent focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={adminShowPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-blue-600 bg-transparent focus:outline-none transition-colors pr-8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setAdminShowPassword(!adminShowPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    {adminShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    adminRole === 'teacher' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="adminRole"
                      value="teacher"
                      checked={adminRole === 'teacher'}
                      onChange={() => setAdminRole('teacher')}
                      className="sr-only"
                    />
                    <User className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Teacher</span>
                  </label>
                  <label className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    adminRole === 'admin' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="adminRole"
                      value="admin"
                      checked={adminRole === 'admin'}
                      onChange={() => setAdminRole('admin')}
                      className="sr-only"
                    />
                    <Shield className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Admin</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember</span>
                </label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                SUBMIT
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-gray-500 text-xs">
              Don't have an account?{' '}
              <a 
                href="mailto:admin@apexlms.com?subject=Account%20Creation%20Request"
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Contact Administrator
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Full Image with Bubbles */}
      <div className="w-1/2 relative overflow-hidden min-h-screen">
        {/* Full Area Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/loginpage.png"
            alt="Login Illustration"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Blue Overlay */}
        <div className="absolute inset-0 "></div>

        {/* Floating Bubbles */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/20 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-16 w-12 h-12 bg-white/15 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-20 left-20 w-16 h-16 bg-white/25 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-40 right-32 w-8 h-8 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-6 h-6 bg-cyan-300/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/3 right-1/3 w-14 h-14 bg-white/10 rounded-full animate-bounce" style={{ animationDelay: '0.8s' }}></div>
          <div className="absolute bottom-1/3 left-1/2 w-10 h-10 bg-blue-200/25 rounded-full animate-pulse" style={{ animationDelay: '1.2s' }}></div>
          <div className="absolute top-3/4 right-10 w-5 h-5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '2.5s' }}></div>
        </div>
      </div>
    </div>
  );
}