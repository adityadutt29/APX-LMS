'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  BookOpen, 
  Trophy, 
  Clock, 
  FileText, 
  Target, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  Building,
  Users,
  Star,
  MessageCircle // Changed from Target/Star for viva
} from 'lucide-react'

export default function Profile() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [courses, setCourses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [practiceResults, setPracticeResults] = useState([])
  const [vivaResults, setVivaResults] = useState([]) // Changed from interviewResults
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch user profile
  const userResponse = await fetch('http://localhost:5001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      let currentUser = null
      if (userResponse.ok) {
        const userData = await userResponse.json()
        currentUser = userData.data
        setUser(userData.data)
      }

      // Fetch enrolled courses with assignments and submissions
  const coursesResponse = await fetch('http://localhost:5001/api/courses/student/full', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        setCourses(coursesData.data || [])
        
        // Extract assignments with their submissions
        const allAssignments = []
        coursesData.data?.forEach(course => {
          course.assignments?.forEach(assignment => {
            const userSubmission = assignment.submissions?.find(
              sub => sub.student === currentUser?._id || sub.student?._id === currentUser?._id
            )
            allAssignments.push({
              ...assignment,
              courseTitle: course.title,
              courseCode: course.courseCode,
              submission: userSubmission
            })
          })
        })
        setAssignments(allAssignments)
      }

      // Fetch practice quiz results
      try {
  const practiceResponse = await fetch('http://localhost:5001/api/practice/user-results', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (practiceResponse.ok) {
          const practiceData = await practiceResponse.json()
          setPracticeResults(practiceData.data || [])
        }
      } catch (error) {
        console.log('Practice results endpoint not available')
      }

      // Fetch viva practice results (changed from interview results)
      try {
        const vivaResponse = await fetch('http://localhost:5001/api/viva/user/results', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (vivaResponse.ok) {
          const vivaData = await vivaResponse.json()
          setVivaResults(vivaData.data || [])
        }
      } catch (error) {
        console.log('Viva results endpoint not available')
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching user data:', error)
      setLoading(false)
    }
  }



  // Calculate performance metrics
  const performanceMetrics = {
    totalCourses: courses.length,
    submittedAssignments: assignments.filter(a => a.submission).length,
    gradedAssignments: assignments.filter(a => a.submission?.grade !== undefined).length,
    averageAssignmentGrade: (() => {
      const gradedAssignments = assignments.filter(a => a.submission?.grade !== undefined)
      if (gradedAssignments.length === 0) return 'N/A'
      const totalGrade = gradedAssignments.reduce((sum, a) => sum + a.submission.grade, 0)
      return (totalGrade / gradedAssignments.length).toFixed(1)
    })(),
    averagePracticeScore: practiceResults.length > 0 
      ? (practiceResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / practiceResults.length).toFixed(1)
      : 'N/A',
    practiceTests: practiceResults.length,
    vivaCompleted: vivaResults.length, // Changed from interviewsCompleted
    averageVivaScore: (() => { // Changed from averageInterviewRating
      if (vivaResults.length === 0) return 'N/A'
      const totalScore = vivaResults.reduce((sum, r) => sum + (r.score || 0), 0)
      return (totalScore / vivaResults.length).toFixed(1)
    })()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <div className="ml-3 text-gray-600">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/classroom')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-sm text-gray-600">View and manage your account information</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{user?.name || 'Student Name'}</h2>
              <p className="text-indigo-100 mb-1">{user?.email}</p>
              <div className="flex items-center space-x-4 text-sm text-indigo-100">
                <span>Student ID: {user?.studentId || 'N/A'}</span>
                <span>•</span>
                <span>Section: {user?.section || 'Not assigned'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Trophy },
              { id: 'courses', label: 'My Courses', icon: BookOpen },
              { id: 'assignments', label: 'Assignments', icon: FileText },
              { id: 'performance', label: 'Performance', icon: TrendingUp },
              { id: 'profile', label: 'Profile Info', icon: User }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <OverviewTab 
            performanceMetrics={performanceMetrics} 
            courses={courses}
            assignments={assignments.slice(0, 3)}
            practiceResults={practiceResults.slice(0, 3)}
            vivaResults={vivaResults.slice(0, 3)} // Changed
            user={user}
          />
        )}
        
        {activeTab === 'courses' && (
          <CoursesTab courses={courses} />
        )}
        
        {activeTab === 'assignments' && (
          <AssignmentsTab assignments={assignments} />
        )}
        
        {activeTab === 'performance' && (
          <PerformanceTab 
            practiceResults={practiceResults} 
            vivaResults={vivaResults} // Changed
            performanceMetrics={performanceMetrics} 
          />
        )}
        
        {activeTab === 'profile' && (
          <ProfileTab user={user} />
        )}
      </div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ performanceMetrics, courses, assignments, practiceResults, vivaResults, user }) {
  return (
    <div className="space-y-8">
      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={BookOpen}
          label="Enrolled Courses"
          value={performanceMetrics.totalCourses}
          color="blue"
        />
        <MetricCard
          icon={FileText}
          label="Assignments"
          value={`${performanceMetrics.submittedAssignments}/${assignments.length}`}
          color="green"
        />
        <MetricCard
          icon={Trophy}
          label="Practice Tests"
          value={performanceMetrics.practiceTests}
          color="purple"
        />
        <MetricCard
          icon={MessageCircle} // Changed from Target
          label="Viva Practice" // Changed
          value={performanceMetrics.vivaCompleted}
          color="orange"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Assignments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Recent Assignments
          </h3>
          <div className="space-y-3">
            {assignments.map((assignment, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-gray-900 text-sm">{assignment.title}</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    assignment.submission?.status === 'graded' 
                      ? 'bg-green-100 text-green-800' 
                      : assignment.submission 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {assignment.submission?.status === 'graded' 
                      ? 'Graded' 
                      : assignment.submission 
                      ? 'Submitted' 
                      : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{assignment.courseCode}</p>
                {assignment.submission?.grade !== undefined && (
                  <p className="text-sm font-medium text-green-600 mt-1">
                    Grade: {assignment.submission.grade}/{assignment.points}
                  </p>
                )}
              </div>
            ))}
            {assignments.length === 0 && (
              <p className="text-gray-500 text-center py-4">No assignments yet</p>
            )}
          </div>
        </div>

        {/* Practice Tests */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            Practice Tests
          </h3>
          <div className="space-y-3">
            {practiceResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    result.percentage >= 80 ? 'bg-green-100' : 
                    result.percentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <Trophy className={`w-4 h-4 ${
                      result.percentage >= 80 ? 'text-green-600' : 
                      result.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {result.quizType === 'mcq' ? 'MCQ Quiz' : 'Practice Quiz'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(result.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    result.percentage >= 80 ? 'text-green-600' : 
                    result.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {result.percentage}%
                  </p>
                </div>
              </div>
            ))}
            {practiceResults.length === 0 && (
              <p className="text-gray-500 text-center py-4">No practice tests yet</p>
            )}
          </div>
        </div>

        {/* Viva Practice Results */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Viva Practice
          </h3>
          <div className="space-y-3">
            {vivaResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    result.score >= 80 ? 'bg-green-100' : 
                    result.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <MessageCircle className={`w-4 h-4 ${
                      result.score >= 80 ? 'text-green-600' : 
                      result.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Viva Practice</p>
                    <p className="text-xs text-gray-600">
                      {new Date(result.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    result.score >= 80 ? 'text-green-600' : 
                    result.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {result.score}%
                  </p>
                </div>
              </div>
            ))}
            {vivaResults.length === 0 && (
              <p className="text-gray-500 text-center py-4">No viva practice yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Building className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Department</h4>
            <p className="text-gray-600">{user?.department || 'Not specified'}</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Section</h4>
            <p className="text-gray-600">{user?.section || 'Not assigned'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Metric Card Component
function MetricCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}

// Courses Tab Component
function CoursesTab({ courses }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
        <p className="text-gray-600">{courses.length} course{courses.length !== 1 ? 's' : ''} enrolled</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Active
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{course.description}</p>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Course Code:</span>
                <span className="font-medium">{course.courseCode}</span>
              </div>
              <div className="flex justify-between">
                <span>Section:</span>
                <span className="font-medium">{course.section}</span>
              </div>
              <div className="flex justify-between">
                <span>Teacher:</span>
                <span className="font-medium">{course.teacher?.name || 'TBA'}</span>
              </div>
            </div>
          </div>
        ))}
        
        {courses.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-500">Join your first course to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Assignments Tab Component
function AssignmentsTab({ assignments }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Assignments</h2>
        <p className="text-gray-600">
          {assignments.filter(a => a.submission).length} of {assignments.length} submitted
        </p>
      </div>

      <div className="space-y-4">
        {assignments.map((assignment, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{assignment.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Course: {assignment.courseTitle} ({assignment.courseCode})</span>
                  <span>•</span>
                  <span>Points: {assignment.points}</span>
                  <span>•</span>
                  <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-3 py-1 text-sm rounded-full ${
                  assignment.submission?.status === 'graded' 
                    ? 'bg-green-100 text-green-800' 
                    : assignment.submission 
                    ? 'bg-blue-100 text-blue-800' 
                    : new Date(assignment.dueDate) < new Date()
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {assignment.submission?.status === 'graded' 
                    ? 'Graded' 
                    : assignment.submission 
                    ? 'Submitted' 
                    : new Date(assignment.dueDate) < new Date()
                    ? 'Overdue'
                    : 'Pending'}
                </span>
                
                {assignment.submission?.grade !== undefined && (
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {assignment.submission.grade}/{assignment.points}
                    </p>
                    <p className="text-sm text-gray-600">
                      {((assignment.submission.grade / assignment.points) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {assignment.submission && (
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Submitted: {new Date(assignment.submission.submittedAt).toLocaleString()}
                    </p>
                    {assignment.submission.feedback && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-900">Feedback:</p>
                        <p className="text-sm text-gray-700 mt-1">{assignment.submission.feedback}</p>
                      </div>
                    )}
                  </div>
                  
                  {assignment.submission.attachments?.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <FileText className="w-4 h-4 inline mr-1" />
                      {assignment.submission.attachments.length} file(s)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {assignments.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
            <p className="text-gray-500">Assignments will appear here when your teachers post them</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Performance Tab Component
function PerformanceTab({ practiceResults, vivaResults, performanceMetrics }) {
  return (
    <div className="space-y-8">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Assignment Average</p>
              <p className="text-3xl font-bold text-gray-900">
                {performanceMetrics.averageAssignmentGrade !== 'N/A' 
                  ? `${performanceMetrics.averageAssignmentGrade}%` 
                  : 'N/A'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Practice Average</p>
              <p className="text-3xl font-bold text-gray-900">
                {performanceMetrics.averagePracticeScore !== 'N/A' 
                  ? `${performanceMetrics.averagePracticeScore}%` 
                  : 'N/A'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Viva Average</p>
              <p className="text-3xl font-bold text-gray-900">
                {performanceMetrics.averageVivaScore !== 'N/A' 
                  ? `${performanceMetrics.averageVivaScore}%` 
                  : 'N/A'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed Activities</p>
              <p className="text-3xl font-bold text-gray-900">
                {performanceMetrics.gradedAssignments + performanceMetrics.practiceTests + performanceMetrics.vivaCompleted}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Practice Test Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Practice Quiz History</h3>
        
        {practiceResults.length > 0 ? (
          <div className="space-y-4">
            {practiceResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    result.percentage >= 80 ? 'bg-green-100' : 
                    result.percentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <Trophy className={`w-5 h-5 ${
                      result.percentage >= 80 ? 'text-green-600' : 
                      result.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900">
                      {result.fileName ? result.fileName.replace('.pdf', '') : `${result.quizType.toUpperCase()} Quiz`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(result.createdAt).toLocaleDateString()} • 
                      {result.totalQuestions} questions
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    result.percentage >= 80 ? 'text-green-600' : 
                    result.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {result.percentage}%
                  </p>
                  <p className="text-sm text-gray-600">
                    {result.score}/{result.totalQuestions}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No practice quizzes yet</h4>
            <p className="text-gray-500">Start practicing to see your performance history</p>
          </div>
        )}
      </div>

      {/* Viva Practice Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Viva Practice History</h3>
        
        {vivaResults.length > 0 ? (
          <div className="space-y-4">
            {vivaResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    result.score >= 80 ? 'bg-green-100' : 
                    result.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <MessageCircle className={`w-5 h-5 ${
                      result.score >= 80 ? 'text-green-600' : 
                      result.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900">Viva Practice Session</p>
                    <p className="text-sm text-gray-600">
                      {new Date(result.createdAt).toLocaleDateString()} • 
                      {result.totalQuestions || 0} questions
                    </p>
                    {result.topic && (
                      <p className="text-xs text-gray-500 mt-1">Topic: {result.topic}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    result.score >= 80 ? 'text-green-600' : 
                    result.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {result.score}%
                  </p>
                  <p className="text-sm text-gray-600">
                    {result.correctAnswers || 0}/{result.totalQuestions || 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No viva practice yet</h4>
            <p className="text-gray-500">Complete viva practice sessions to see your results here</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Profile Tab Component
function ProfileTab({ user }) {
  const router = useRouter()
  const InfoRow = ({ icon, label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
    <div className="flex items-center space-x-3">
      {icon}
      <span className="text-gray-600 font-medium">{label}</span>
    </div>
    <span className="text-gray-900 font-semibold">{value}</span>
  </div>
);

  
  return (
    <div className="w-full px-0">
  {/* Header */}
  <div className="mb-8">
    <h2 className="text-2xl font-bold text-gray-900">Profile Overview</h2>
  </div>

  {/* Grid for Personal & Academic Info */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
    {/* Personal Information */}
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <User className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
      </div>
      <div className="space-y-6">
        <InfoRow icon={<User className="w-4 h-4 text-gray-500" />} label="Full Name" value={user?.name || 'Not provided'} />
        <InfoRow icon={<Mail className="w-4 h-4 text-gray-500" />} label="Email Address" value={user?.email || 'Not provided'} />
        <InfoRow icon={<Award className="w-4 h-4 text-gray-500" />} label="Student ID" value={user?.studentId || 'N/A'} />
        <InfoRow icon={<Calendar className="w-4 h-4 text-gray-500" />} label="Member Since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not available'} />
      </div>
    </div>

    {/* Academic Information */}
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Academic Information</h3>
      </div>
      <div className="space-y-6">
        <InfoRow icon={<Building className="w-4 h-4 text-gray-500" />} label="Department" value={user?.department || 'Not specified'} />
        <InfoRow icon={<Users className="w-4 h-4 text-gray-500" />} label="Section" value={user?.section || 'Not assigned'} />
        <InfoRow icon={<User className="w-4 h-4 text-gray-500" />} label="Role" value={user?.role || 'Student'} />
        <InfoRow icon={<Trophy className="w-4 h-4 text-gray-500" />} label="Account Status" value={<span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Active</span>} />
      </div>
    </div>
  </div>
</div>

  )
}
