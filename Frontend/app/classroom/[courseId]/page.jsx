'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  BookOpen, 
  MessageSquare, 
  ClipboardList,
  Settings,
  FileText,
  Clock,
  User,
  X,
  Upload,
  Paperclip,
  Trash2,
  CheckCircle,
  AlertCircle,
  Download,
  Eye
} from 'lucide-react'
import FileViewer from '../../../components/FileViewer'

export default function ClassroomPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId
  
  const [course, setCourse] = useState(null)
  const [activeTab, setActiveTab] = useState('stream')
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('')
  const [showNewPost, setShowNewPost] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [assignments, setAssignments] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    setUserRole(role)
    fetchCourseData()
  }, [courseId])

  const fetchCourseData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch course details
  const courseResponse = await fetch(`http://localhost:5001/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!courseResponse.ok) {
        throw new Error('Failed to fetch course')
      }
      
      const courseResult = await courseResponse.json()
      setCourse(courseResult.data)
      setAnnouncements(courseResult.data.announcements || [])
      setAssignments(courseResult.data.assignments || [])
      
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnnouncement = async (title, content, attachments = []) => {
    try {
      const token = localStorage.getItem('token')
      
  const response = await fetch(`http://localhost:5001/api/courses/${courseId}/announcements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content, attachments })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create announcement')
      }
      
      fetchCourseData() // Refresh data
      setShowNewPost(false)
      
    } catch (error) {
      console.error('Error creating announcement:', error)
    }
  }

  const handleCreateAssignment = async (assignmentData) => {
    try {
      const token = localStorage.getItem('token')
      
  const response = await fetch(`http://localhost:5001/api/courses/${courseId}/assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create assignment')
      }
      
      fetchCourseData() // Refresh data
      
    } catch (error) {
      console.error('Error creating assignment:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FFF9F0]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <div className="ml-3 text-gray-600">Loading classroom...</div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FFF9F0]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Course not found</h2>
          <button 
            onClick={() => router.push('/classroom')}
            className="text-blue-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/classroom')}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-800">{course.title}</h1>
                  <p className="text-sm text-gray-600">
                    {course.courseCode} • Section {course.section} • {course.semester} {course.year}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Course Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">{course.title}</h2>
                <p className="text-blue-100 mb-1">{course.description}</p>
                <div className="flex items-center space-x-4 text-sm text-blue-100">
                  <span>Teacher: {course.teacher?.name || 'Unknown'}</span>
                  <span>•</span>
                  <span>{course.students?.length || 0} students</span>
                  <span>•</span>
                  <span>Join Code: {course.joinCode}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex space-x-8">
              {['stream', 'classwork', 'people'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'stream' && <MessageSquare className="w-4 h-4 inline mr-1" />}
                  {tab === 'classwork' && <ClipboardList className="w-4 h-4 inline mr-1" />}
                  {tab === 'people' && <Users className="w-4 h-4 inline mr-1" />}
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {activeTab === 'stream' && (
            <StreamTab 
              course={course}
              announcements={announcements}
              assignments={assignments}
              userRole={userRole}
              onCreateAnnouncement={handleCreateAnnouncement}
              onCreateAssignment={handleCreateAssignment}
              showNewPost={showNewPost}
              setShowNewPost={setShowNewPost}
              setSelectedFile={setSelectedFile}
            />
          )}
          
          {activeTab === 'classwork' && (
            <ClassworkTab 
              assignments={assignments}
              userRole={userRole}
              onCreateAssignment={handleCreateAssignment}
            />
          )}
          
          {activeTab === 'people' && (
            <PeopleTab 
              course={course}
              userRole={userRole}
            />
          )}
        </div>

        {/* File Viewer Modal */}
        {selectedFile && (
          <FileViewer
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
          />
        )}
    </div>
  )
}

// Stream Tab Component
function StreamTab({ course, announcements, assignments, userRole, onCreateAnnouncement, onCreateAssignment, showNewPost, setShowNewPost, setSelectedFile }) {
  const [postType, setPostType] = useState('announcement')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState([])
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    dueDate: '',
    points: 100,
    attachments: []
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (postType === 'announcement') {
      onCreateAnnouncement(title, content, attachments)
    } else if (postType === 'assignment') {
      onCreateAssignment({
        ...assignmentData,
        dueDate: new Date(assignmentData.dueDate)
      })
    }
    
    // Reset form
    setTitle('')
    setContent('')
    setAttachments([])
    setAssignmentData({
      title: '',
      description: '',
      dueDate: '',
      points: 100,
      attachments: []
    })
  }

  const handleFileSelect = async (event) => {
    const selectedFiles = Array.from(event.target.files)
    
    if (selectedFiles.length === 0) return
    
    try {
      // Upload files to backend
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })
      
      const token = localStorage.getItem('token')
  const response = await fetch('http://localhost:5001/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to upload files')
      }
      
      const result = await response.json()
      const fileInfo = result.data
      
      if (postType === 'announcement') {
        setAttachments(prev => [...prev, ...fileInfo])
      } else {
        setAssignmentData(prev => ({
          ...prev,
          attachments: [...prev.attachments, ...fileInfo]
        }))
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Failed to upload files. Please try again.')
    }
  }

  const removeAttachment = (index) => {
    if (postType === 'announcement') {
      setAttachments(prev => prev.filter((_, i) => i !== index))
    } else {
      setAssignmentData(prev => ({
        ...prev,
        attachments: prev.attachments.filter((_, i) => i !== index)
      }))
    }
  }

  // Combine and sort announcements and assignments by date
  const allPosts = [
    ...announcements.map(a => ({ ...a, type: 'announcement' })),
    ...assignments.map(a => ({ ...a, type: 'assignment' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div className="space-y-6">
      {/* Create Post Button (Teacher Only) */}
      {userRole === 'teacher' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          {!showNewPost ? (
            <button
              onClick={() => setShowNewPost(true)}
              className="w-full flex items-center space-x-3 p-4 text-left hover:bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
            >
              <Plus className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">Share something with your class</span>
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex space-x-2 border-b border-gray-200 pb-4">
                <button
                  type="button"
                  onClick={() => setPostType('announcement')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    postType === 'announcement'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Announcement
                </button>
                <button
                  type="button"
                  onClick={() => setPostType('assignment')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    postType === 'assignment'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ClipboardList className="w-4 h-4 inline mr-1" />
                  Assignment
                </button>
              </div>

              {postType === 'announcement' ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Announcement title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <textarea
                    placeholder="Share something with your class..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required
                  />
                  
                  {/* File Upload for Announcements */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attach Files (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        id="announcement-files"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.jpg,.png,.zip,.rar"
                      />
                      <label
                        htmlFor="announcement-files"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-sm text-gray-600">Click to upload files</span>
                        <span className="text-xs text-gray-500">PDF, DOC, PPT, Images, etc.</span>
                      </label>
                    </div>
                  </div>

                  {/* Display Selected Files */}
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Attached Files</h4>
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{file.originalName || file.filename}</span>
                            {file.size && (
                              <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Assignment title"
                    value={assignmentData.title}
                    onChange={(e) => setAssignmentData({...assignmentData, title: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <textarea
                    placeholder="Assignment description..."
                    value={assignmentData.description}
                    onChange={(e) => setAssignmentData({...assignmentData, description: e.target.value})}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                      <input
                        type="datetime-local"
                        value={assignmentData.dueDate}
                        onChange={(e) => setAssignmentData({...assignmentData, dueDate: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                      <input
                        type="number"
                        value={assignmentData.points}
                        onChange={(e) => setAssignmentData({...assignmentData, points: parseInt(e.target.value)})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="1000"
                      />
                    </div>
                  </div>
                  
                  {/* File Upload for Assignments */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attach Files (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        id="assignment-files"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.jpg,.png,.zip,.rar"
                      />
                      <label
                        htmlFor="assignment-files"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-sm text-gray-600">Click to upload files</span>
                        <span className="text-xs text-gray-500">PDF, DOC, PPT, Images, etc.</span>
                      </label>
                    </div>
                  </div>

                  {/* Display Selected Assignment Files */}
                  {assignmentData.attachments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Attached Files</h4>
                      {assignmentData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{file.originalName || file.filename || file}</span>
                            {file.size && (
                              <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowNewPost(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Post
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {allPosts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500">
              {userRole === 'teacher' 
                ? 'Share announcements and assignments with your class'
                : 'Your teacher will post announcements and assignments here'
              }
            </p>
          </div>
        ) : (
          allPosts.map((post, index) => (
            <PostCard 
              key={`${post.type}-${index}`} 
              post={post} 
              onFileView={setSelectedFile} 
            />
          ))
        )}
      </div>
    </div>
  )
}

// Post Card Component
function PostCard({ post, onFileView }) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            post.type === 'announcement' ? 'bg-blue-100' : 'bg-green-100'
          }`}>
            {post.type === 'announcement' ? (
              <MessageSquare className="w-5 h-5 text-blue-600" />
            ) : (
              <ClipboardList className="w-5 h-5 text-green-600" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  post.type === 'announcement' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {post.type === 'announcement' ? 'Announcement' : 'Assignment'}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(post.createdAt)}
                </span>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {post.title}
            </h3>
            
            <p className="text-gray-700 whitespace-pre-wrap">
              {post.content || post.description}
            </p>
            
            {/* Display Attachments */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Attached Files</h4>
                <div className="space-y-2">
                  {post.attachments.map((attachment, index) => {
                    // Handle both old string format and new object format
                    const fileName = typeof attachment === 'string' ? attachment : (attachment.originalName || attachment.filename)
                    const fileObj = typeof attachment === 'string' 
                      ? { originalName: attachment, filename: attachment, url: `/api/files/${attachment}` }
                      : attachment
                    
                    return (
                      <div key={index} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <div className="flex items-center space-x-2">
                          <Paperclip className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-800 font-medium">{fileName}</span>
                          {fileObj.size && (
                            <span className="text-xs text-blue-600">({(fileObj.size / 1024 / 1024).toFixed(2)} MB)</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onFileView(fileObj)}
                            className="p-1 hover:bg-blue-200 rounded text-blue-600 hover:text-blue-800"
                            title="View file"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const downloadUrl = fileObj.url?.startsWith('http') 
                                ? `${fileObj.url}/download` 
                                : `http://localhost:5001${fileObj.url}/download`
                              
                              const token = localStorage.getItem('token')
                              fetch(downloadUrl, {
                                headers: { 'Authorization': `Bearer ${token}` }
                              })
                              .then(response => response.blob())
                              .then(blob => {
                                const url = window.URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.style.display = 'none'
                                a.href = url
                                a.download = fileName
                                document.body.appendChild(a)
                                a.click()
                                window.URL.revokeObjectURL(url)
                                document.body.removeChild(a)
                              })
                              .catch(error => {
                                console.error('Download failed:', error)
                                alert('Failed to download file')
                              })
                            }}
                            className="p-1 hover:bg-blue-200 rounded text-blue-600 hover:text-blue-800"
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {post.type === 'assignment' && (
              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Due: {formatDate(post.dueDate)}
                </div>
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  {post.points} points
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Classwork Tab Component
function ClassworkTab({ assignments, userRole, onCreateAssignment }) {
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [submissionStatus, setSubmissionStatus] = useState({})
  const params = useParams()

  useEffect(() => {
    // Fetch submission status for each assignment if student
    if (userRole === 'student') {
      assignments.forEach(async (assignment, index) => {
        try {
          const token = localStorage.getItem('token')
          const response = await fetch(
            `http://localhost:5001/api/courses/${params.courseId}/assignments/${assignment._id}/submission`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          )
          
          if (response.ok) {
            const result = await response.json()
            setSubmissionStatus(prev => ({
              ...prev,
              [assignment._id]: result.data
            }))
          }
        } catch (error) {
          console.error('Error fetching submission status:', error)
        }
      })
    }
  }, [assignments, userRole, params.courseId])

  const handleAssignmentClick = (assignment) => {
    if (userRole === 'student') {
      setSelectedAssignment(assignment)
    }
  }

  const getAssignmentStatus = (assignment) => {
    const status = submissionStatus[assignment._id]
    if (!status) return { text: 'Loading...', color: 'bg-gray-100 text-gray-800' }
    
    if (status.submission) {
      if (status.submission.grade !== undefined) {
        return { 
          text: `Graded: ${status.submission.grade}/${assignment.points}`, 
          color: 'bg-green-100 text-green-800' 
        }
      }
      return { text: 'Submitted', color: 'bg-blue-100 text-blue-800' }
    }
    
    if (status.isOverdue) {
      return { text: 'Overdue', color: 'bg-red-100 text-red-800' }
    }
    
    return { text: 'Assigned', color: 'bg-yellow-100 text-yellow-800' }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Classwork</h2>
        {userRole === 'teacher' && (
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Create Assignment
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {assignments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
            <p className="text-gray-500">
              {userRole === 'teacher' 
                ? 'Create your first assignment'
                : 'Your teacher will post assignments here'
              }
            </p>
          </div>
        ) : (
          assignments.map((assignment, index) => {
            const statusInfo = userRole === 'student' ? getAssignmentStatus(assignment) : null
            const isOverdue = assignment.dueDate && new Date() > new Date(assignment.dueDate)
            
            return (
              <div 
                key={index} 
                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-colors ${
                  userRole === 'student' ? 'cursor-pointer hover:bg-gray-50' : ''
                }`}
                onClick={() => handleAssignmentClick(assignment)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {assignment.title}
                      </h3>
                      {isOverdue && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          Overdue
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-4">{assignment.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Due: {new Date(assignment.dueDate).toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {assignment.points} points
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {userRole === 'student' && statusInfo && (
                      <span className={`px-3 py-1 rounded-full text-sm ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    )}
                    {userRole === 'teacher' && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {assignment.submissions?.length || 0} submissions
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Assignment Detail Modal for Students */}
      {selectedAssignment && userRole === 'student' && (
        <AssignmentModal
          assignment={selectedAssignment}
          submissionData={submissionStatus[selectedAssignment._id]}
          onClose={() => setSelectedAssignment(null)}
          courseId={params.courseId}
        />
      )}
    </div>
  )
}

// People Tab Component
function PeopleTab({ course, userRole }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">People</h2>

      {/* Teacher Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Teacher
        </h3>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {course.teacher?.name ? course.teacher.name.charAt(0).toUpperCase() : 'T'}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{course.teacher?.name || 'Unknown Teacher'}</p>
            <p className="text-sm text-gray-500">{course.teacher?.email || 'No email'}</p>
          </div>
        </div>
      </div>

      {/* Students Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Students ({course.students?.length || 0})
        </h3>
        
        {course.students?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No students enrolled yet</p>
        ) : (
          <div className="space-y-3">
            {course.students?.map((student, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{student.name || 'Unknown Student'}</p>
                  <p className="text-sm text-gray-500">{student.email || 'No email'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Assignment Modal Component for Students
function AssignmentModal({ assignment, submissionData, onClose, courseId }) {
  const [files, setFiles] = useState([])
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files)
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (files.length === 0) {
      alert('Please attach at least one file')
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
  `http://localhost:5001/api/courses/${courseId}/assignments/${assignment._id}/submit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            attachments: files.map(file => file.name),
            comment
          })
        }
      )

      if (response.ok) {
        setSubmitSuccess(true)
        setTimeout(() => {
          onClose()
          window.location.reload() // Refresh to show updated status
        }, 2000)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to submit assignment')
      }
    } catch (error) {
      console.error('Error submitting assignment:', error)
      alert('Failed to submit assignment')
    } finally {
      setSubmitting(false)
    }
  }

  const isOverdue = assignment.dueDate && new Date() > new Date(assignment.dueDate)
  const hasSubmission = submissionData?.submission
  const canSubmit = submissionData?.canSubmit && !hasSubmission

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{assignment.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Assignment Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Assignment Instructions</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
            
            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Due: {new Date(assignment.dueDate).toLocaleString()}
              </div>
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                {assignment.points} points
              </div>
            </div>

            {/* Assignment attachments */}
            {assignment.attachments && assignment.attachments.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Teacher's Files</h4>
                <div className="flex flex-wrap gap-2">
                  {assignment.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center space-x-1 bg-blue-50 px-3 py-1 rounded-full text-sm text-blue-700">
                      <Paperclip className="w-3 h-3" />
                      <span>{attachment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submission Status */}
          {hasSubmission ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-medium text-green-800">
                  {submissionData.submission.grade !== undefined ? 'Graded' : 'Submitted'}
                </h3>
              </div>
              
              <div className="space-y-2 text-sm text-green-700">
                <p>Submitted on: {new Date(submissionData.submission.submittedAt).toLocaleString()}</p>
                
                {submissionData.submission.grade !== undefined && (
                  <p className="font-medium">
                    Grade: {submissionData.submission.grade}/{assignment.points} points
                  </p>
                )}
                
                {submissionData.submission.feedback && (
                  <div>
                    <p className="font-medium">Teacher Feedback:</p>
                    <p className="bg-white p-2 rounded border">{submissionData.submission.feedback}</p>
                  </div>
                )}
                
                {submissionData.submission.comment && (
                  <div>
                    <p className="font-medium">Your Comment:</p>
                    <p className="bg-white p-2 rounded border">{submissionData.submission.comment}</p>
                  </div>
                )}
                
                {submissionData.submission.attachments && submissionData.submission.attachments.length > 0 && (
                  <div>
                    <p className="font-medium">Your Files:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {submissionData.submission.attachments.map((file, index) => (
                        <span key={index} className="bg-white px-2 py-1 rounded text-xs border">{file}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : isOverdue ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-medium text-red-800">Assignment Overdue</h3>
              </div>
              <p className="text-sm text-red-700 mt-2">
                This assignment is past its due date and no longer accepting submissions.
              </p>
            </div>
          ) : canSubmit ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Submit Your Work</h3>
              
              {submitSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">Assignment submitted successfully!</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attach Files <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        id="assignment-files"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.jpg,.png,.zip,.rar"
                      />
                      <label
                        htmlFor="assignment-files"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600">Click to upload files</span>
                        <span className="text-xs text-gray-500">PDF, DOC, PPT, Images, etc.</span>
                      </label>
                    </div>
                  </div>

                  {/* Selected Files */}
                  {files.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Selected Files</h4>
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comment (Optional)
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add any comments about your submission..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || files.length === 0}
                      className={`px-6 py-2 rounded-lg font-medium ${
                        submitting || files.length === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {submitting ? 'Submitting...' : 'Submit Assignment'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
