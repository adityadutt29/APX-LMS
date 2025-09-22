"use client";
import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Book, Users, LayoutList, Settings, Bell, Trophy, Plus, MessageCircle } from 'lucide-react';
import AdvancedTodoList from './todolist';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Calendar from './calander';
import NotificationDropdown from '../components/NotificationDropdown';
import Image from 'next/image';
import { motion } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import AuthGuard from '../components/AuthGuard';

export default function TeacherLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState('courses');
  const courseId = searchParams.get('courseId');
  const [userEmail, setUserEmail] = useState('');
  const [userInitial, setUserInitial] = useState('T');
  const [userFirstName, setUserFirstName] = useState('');
  const [userGender, setUserGender] = useState(''); // 'male' or 'female'
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    subject: '',
    courseCode: '',
    section: '',
    semester: '',
    year: new Date().getFullYear(),
    schedule: {
      days: [],
      time: '',
      room: ''
    }
  });

  useEffect(() => {
    // Set user initial and first name from localStorage only once on mount
    const email = localStorage.getItem('userEmail') || '';
    const name = localStorage.getItem('userName') || '';
    const gender = localStorage.getItem('userGender') || ''; // optional, set in user profile
    setUserEmail(email);
    setUserGender(gender.toLowerCase());
    if (email && email.trim().length > 0) {
      setUserInitial(email.charAt(0).toUpperCase());
    } else if (name && name.trim().length > 0) {
      setUserInitial(name.charAt(0).toUpperCase());
    } else {
      setUserInitial('T');
    }
    if (name && name.trim().length > 0) {
      setUserFirstName(name.split(' ')[0]);
    } else if (email && email.trim().length > 0) {
      setUserFirstName(email.split('@')[0]);
    } else {
      setUserFirstName('Teacher');
    }
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    console.log('URL changed - pathname:', pathname, 'tabParam:', tabParam);

    // Handle tab detection: prioritize tabParam if present
    if (pathname === '/teacher/chat') {
      setCurrentTab('chat');
      return;
    }
    if (pathname === '/teacher/generate-course') {
      setCurrentTab('coursesgenerate');
      return;
    }
    if (tabParam) {
      setCurrentTab(tabParam);
      return;
    }
    if (pathname === '/teacher' || pathname === '/teacher/') {
      setCurrentTab('courses');
      return;
    }
    setCurrentTab('courses');

    console.log('Updated currentTab to:', currentTab);
  }, [pathname, searchParams]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        return;
      }

      const response = await fetch('http://localhost:5001/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newCourse)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create course');
      }

      const result = await response.json();
      toast.success('Course created successfully!');

      // Reset form
      setNewCourse({
        title: '',
        description: '',
        subject: '',
        courseCode: '',
        section: '',
        semester: '',
        year: new Date().getFullYear(),
        schedule: {
          days: [],
          time: '',
          room: ''
        }
      });

      // Refresh the page to show new course
      window.location.reload();
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error(error.message || 'Failed to create course');
    }
  };

  const navigateToTab = (tab) => {
    router.push(`/teacher?tab=${tab}`);
  };

  // Determine if we're in a classroom
  const isInClassroom = pathname.includes('/classroom/');
  const isMainDashboard = (pathname === '/teacher' || pathname === '/teacher/') && !searchParams.get('tab');

  return (
    <AuthGuard requiredRole="teacher">
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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

        {/* Modern Sidebar */}
        <div className="w-72 bg-white/95 backdrop-blur-xl shadow-2xl fixed h-full z-40 flex flex-col border-r border-white/20">
          {/* Enhanced Header */}
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

          {/* Enhanced Navigation */}
          <div className="flex-1 overflow-y-auto py-6 px-4">
            <nav className="space-y-3">
              {[
                { key: 'courses', icon: Book, label: 'Courses', path: '/teacher' },
                { key: 'students', icon: Users, label: 'Students', path: '/teacher?tab=students' },
                { key: 'grades', icon: Trophy, label: 'Grades', path: '/teacher?tab=grades' },
                { key: 'todo', icon: LayoutList, label: 'To-Do', path: '/teacher?tab=todo' },
                { key: 'calendar', icon: LayoutList, label: 'Calendar', path: '/teacher?tab=calendar' },
                { key: 'chat', icon: MessageCircle, label: 'Chat', path: '/teacher?tab=chat' },
                { key: 'coursesgenerate', icon: Plus, label: 'Generate Course', path: '/teacher?tab=coursesgenerate' }
              ].map(({ key, icon: Icon, label, path }, index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ x: 6 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={() => router.push(path)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden 
          ${currentTab === key
                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/25'
                        : 'bg-white text-gray-700 hover:bg-blue-600 hover:text-white hover:shadow-lg'
                      }`}
                  >
                    {currentTab === key && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <div
                      className={`p-2 rounded-xl transition-all duration-300 
            ${currentTab === key
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-600 group-hover:bg-blue-500 group-hover:text-white'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-sm">{label}</span>
                    {currentTab === key && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-white rounded-full ml-auto"
                      />
                    )}
                  </button>
                </motion.div>
              ))}
            </nav>

          </div>
        </div>

        {/* Enhanced Main Content */}
        <div className="ml-72 flex-1">
          {/* Modern Top Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-30"
          >
            <div className="px-8 py-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-6">
                  {isInClassroom ? (
                    <motion.button
                      whileHover={{ x: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/teacher')}
                      className="flex items-center space-x-3 text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all duration-200 shadow-sm"
                    >
                      <span className="text-lg">←</span>
                      <span>Back to Dashboard</span>
                    </motion.button>
                  ) : (
                    <div>
                      <h1 className="text-3xl font-bold bg-clip-text text-transparent flex items-center">
                        <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mr-2">
                          Welcome
                        </span>
                        <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                          {` ${userFirstName} ${userGender === 'female' ? "Ma'am" : "Sir"}`}
                        </span>
                      </h1>
                      <p className="text-gray-600 mt-1 font-medium">Manage your courses and students efficiently</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {isMainDashboard && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 rounded-xl font-semibold">
                            <Plus className="w-5 h-5 mr-2" />
                            Create New Course
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              Create New Course
                            </DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleCreateCourse} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Course Title</Label>
                                <Input
                                  id="title"
                                  value={newCourse.title}
                                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                                  placeholder="e.g., Introduction to React"
                                  className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="subject" className="text-sm font-semibold text-gray-700">Subject</Label>
                                <Input
                                  id="subject"
                                  value={newCourse.subject}
                                  onChange={(e) => setNewCourse({ ...newCourse, subject: e.target.value })}
                                  placeholder="e.g., Computer Science"
                                  className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-2">
                                <Label htmlFor="courseCode" className="text-sm font-semibold text-gray-700">Course Code</Label>
                                <Input
                                  id="courseCode"
                                  value={newCourse.courseCode}
                                  onChange={(e) => setNewCourse({ ...newCourse, courseCode: e.target.value.toUpperCase() })}
                                  placeholder="e.g., CS101"
                                  className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="section" className="text-sm font-semibold text-gray-700">Section</Label>
                                <Input
                                  id="section"
                                  value={newCourse.section}
                                  onChange={(e) => setNewCourse({ ...newCourse, section: e.target.value.toUpperCase() })}
                                  placeholder="e.g., A, B, C"
                                  className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="semester" className="text-sm font-semibold text-gray-700">Semester</Label>
                                <Input
                                  id="semester"
                                  value={newCourse.semester}
                                  onChange={(e) => setNewCourse({ ...newCourse, semester: e.target.value })}
                                  placeholder="Semester I"
                                  className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label htmlFor="year" className="text-sm font-semibold text-gray-700">Academic Year</Label>
                                <Input
                                  id="year"
                                  type="number"
                                  value={newCourse.year}
                                  onChange={(e) => setNewCourse({ ...newCourse, year: parseInt(e.target.value) })}
                                  placeholder={new Date().getFullYear()}
                                  min={new Date().getFullYear()}
                                  max={new Date().getFullYear() + 5}
                                  className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="room" className="text-sm font-semibold text-gray-700">Room (Optional)</Label>
                                <Input
                                  id="room"
                                  value={newCourse.schedule.room}
                                  onChange={(e) => setNewCourse({
                                    ...newCourse,
                                    schedule: { ...newCourse.schedule, room: e.target.value }
                                  })}
                                  placeholder="e.g., Room 201"
                                  className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="time" className="text-sm font-semibold text-gray-700">Class Time (Optional)</Label>
                              <select
                                id="time"
                                value={newCourse.schedule.time}
                                onChange={(e) => setNewCourse({
                                  ...newCourse,
                                  schedule: { ...newCourse.schedule, time: e.target.value }
                                })}
                                className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500"
                              >
                                <option value="">Select Time Slot</option>
                                <option value="8:00 AM - 9:30 AM">8:00 AM - 9:30 AM</option>
                                <option value="9:30 AM - 11:00 AM">9:30 AM - 11:00 AM</option>
                                <option value="11:00 AM - 12:30 PM">11:00 AM - 12:30 PM</option>
                                <option value="12:30 PM - 2:00 PM">12:30 PM - 2:00 PM</option>
                                <option value="2:00 PM - 3:30 PM">2:00 PM - 3:30 PM</option>
                                <option value="3:30 PM - 5:00 PM">3:30 PM - 5:00 PM</option>
                                <option value="5:00 PM - 6:30 PM">5:00 PM - 6:30 PM</option>
                                <option value="6:30 PM - 8:00 PM">6:30 PM - 8:00 PM</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Course Description</Label>
                              <Textarea
                                id="description"
                                value={newCourse.description}
                                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                                placeholder="Describe what students will learn in this course..."
                                rows={4}
                                className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                                required
                              />
                            </div>
                            <Button
                              type="submit"
                              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              Create Course
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </motion.div>
                  )}

                  {/* Enhanced Notifications */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <NotificationDropdown />
                  </motion.div>

                  {/* Enhanced Profile Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/teacher/profile')}
                    className="flex items-center gap-3 hover:bg-white/80 rounded-2xl p-2 transition-all duration-300 shadow-sm hover:shadow-md group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <span className="text-white text-base font-bold" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.25)' }}>
                        {userInitial}
                      </span>
                    </div>

                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Page Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="p-8 min-h-[calc(100vh-200px)]"
          >
            {currentTab === 'todo' && (
              <AdvancedTodoList />
            )}
            {currentTab === 'calendar' && (
              <Calendar courseId={courseId} />
            )}
            {['courses', 'students', 'grades'].includes(currentTab) && children}
            {currentTab === 'chat' && children}
            {currentTab === 'coursesgenerate' && children}
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  );
}