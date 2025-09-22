'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  MessageSquare, 
  FileText, 
  Users, 
  Plus, 
  Send,
  Calendar,
  Clock,
  BookOpen,
  ArrowLeft,
  Pin,
  Paperclip,
  MoreVertical,
  Edit3,
  Trash2,
  ClipboardCheck,
  Award,
  Eye,
  Download
} from 'lucide-react'
import FileViewer from '../../../../components/FileViewer'

export default function TeacherClassroom() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stream')
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' })
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    points: 100,
    attachments: []
  })
  const [newAnnouncementFiles, setNewAnnouncementFiles] = useState([])
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    fetchCourseDetails()
  }, [courseId])

  // Helper function to handle file selection for announcements
  const handleAnnouncementFileSelect = (event) => {
    const files = Array.from(event.target.files)
    setNewAnnouncementFiles(prev => [...prev, ...files])
  }

  // Helper function to handle file selection for assignments
  const handleAssignmentFileSelect = (event) => {
    const files = Array.from(event.target.files)
    setNewAssignment(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }))
  }

  // Helper function to remove files
  const removeAnnouncementFile = (index) => {
    setNewAnnouncementFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removeAssignmentFile = (index) => {
    setNewAssignment(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  // Helper function to check if assignment is still available
  const isAssignmentAvailable = (dueDate) => {
    if (!dueDate) return true
    return new Date(dueDate) > new Date()
  }

  // Helper function to get minimum date for due date input (today)
  const getMinDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const hours = String(today.getHours()).padStart(2, '0')
    const minutes = String(today.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const fetchCourseDetails = async () => {
    try {
      const token = localStorage.getItem('token')
  const response = await fetch(`http://localhost:5001/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const result = await response.json()
        setCourse(result.data)
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const createAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) return

    try {
      let uploadedFiles = []
      
      // Upload files first if any
      if (newAnnouncementFiles.length > 0) {
        const formData = new FormData()
        newAnnouncementFiles.forEach(file => {
          formData.append('files', file)
        })
        
        const token = localStorage.getItem('token')
  const uploadResponse = await fetch('http://localhost:5001/api/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData
        })
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          uploadedFiles = uploadResult.data
        } else {
          throw new Error('Failed to upload files')
        }
      }

      // Create announcement with file info
      const token = localStorage.getItem('token')
  const response = await fetch(`http://localhost:5001/api/courses/${courseId}/announcements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newAnnouncement,
          attachments: uploadedFiles
        })
      })
      
      if (response.ok) {
        setNewAnnouncement({ title: '', content: '' })
        setNewAnnouncementFiles([])
        setShowAnnouncementForm(false)
        fetchCourseDetails() // Refresh course data
      } else {
        const error = await response.json()
        console.error('Create announcement error:', error)
        alert(error.message || 'Failed to create announcement')
      }
    } catch (error) {
      console.error('Error creating announcement:', error)
      alert('Failed to create announcement. Please try again.')
    }
  }

  const createAssignment = async () => {
    // Validation
    const errors = []
    if (!newAssignment.title.trim()) errors.push('Assignment title is required')
    if (!newAssignment.description.trim()) errors.push('Assignment instructions are required')
    if (!newAssignment.dueDate) errors.push('Due date is required')
    
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'))
      return
    }

    // Validate due date is not in the past
    const dueDateTime = new Date(newAssignment.dueDate)
    const now = new Date()
    if (dueDateTime <= now) {
      alert('Due date must be in the future')
      return
    }

    try {
      let uploadedFiles = []
      
      // Upload files first if any
      if (newAssignment.attachments.length > 0) {
        const formData = new FormData()
        newAssignment.attachments.forEach(file => {
          formData.append('files', file)
        })
        
        const token = localStorage.getItem('token')
  const uploadResponse = await fetch('http://localhost:5001/api/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData
        })
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          uploadedFiles = uploadResult.data
        } else {
          throw new Error('Failed to upload files')
        }
      }

      // Create assignment with file info
      const token = localStorage.getItem('token')
  const response = await fetch(`http://localhost:5001/api/courses/${courseId}/assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newAssignment,
          attachments: uploadedFiles
        })
      })
      
      if (response.ok) {
        setNewAssignment({ title: '', description: '', dueDate: '', points: 100, attachments: [] })
        setShowAssignmentForm(false)
        fetchCourseDetails() // Refresh course data
      } else {
        const error = await response.json()
        console.error('Create assignment error:', error)
        alert(error.message || 'Failed to create assignment')
      }
    } catch (error) {
      console.error('Error creating assignment:', error)
      alert('Failed to create assignment. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <div className="ml-3 text-gray-600">Loading classroom...</div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course not found</h2>
          <button 
            onClick={() => router.push('/teacher')}
            className="text-purple-600 hover:text-purple-800"
          >
            Return to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      {/* Course Info Header */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
              <p className="text-sm text-gray-600">{course.courseCode} • Section {course.section}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{course.students?.length || 0} Students</p>
              <p className="text-xs text-gray-600">Join code: {course.joinCode}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{course.title}</h2>
              <p className="text-purple-100 mb-2">{course.description}</p>
              <div className="flex items-center space-x-4 text-sm text-purple-100">
                <span>{course.subject}</span>
                <span>•</span>
                <span>{course.semester} {course.year}</span>
                <span>•</span>
                <span>Room: {course.schedule?.room || 'TBA'}</span>
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
              { id: 'stream', label: 'Stream', icon: MessageSquare },
              { id: 'classwork', label: 'Classwork', icon: FileText },
              { id: 'submissions', label: 'Submissions', icon: ClipboardCheck },
              { id: 'people', label: 'People', icon: Users }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
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
      <div className="max-w-7xl mx-auto px-6">
        {/* Stream Tab */}
        {activeTab === 'stream' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Create Announcement */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {!showAnnouncementForm ? (
                <button
                  onClick={() => setShowAnnouncementForm(true)}
                  className="w-full flex items-center justify-center space-x-3 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  <Plus className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600 font-medium">Share something with your class</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Announcement title"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <textarea
                    placeholder="Share something with your class..."
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  
                  {/* File Attachments */}
                  {newAnnouncementFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
                      {newAnnouncementFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-600">{file.name}</span>
                          <button
                            onClick={() => removeAnnouncementFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        id="announcement-files"
                        multiple
                        accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.jpg,.png,.zip,.rar"
                        onChange={handleAnnouncementFileSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="announcement-files"
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                      >
                        <Paperclip className="w-5 h-5" />
                      </label>
                      <span className="text-xs text-gray-500">Add files (PDF, DOC, PPT, Images, etc.)</span>
                    </div>
                    <div className="space-x-3">
                      <button
                        onClick={() => {
                          setShowAnnouncementForm(false)
                          setNewAnnouncement({ title: '', content: '' })
                          setNewAnnouncementFiles([])
                        }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createAnnouncement}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Announcements List */}
            <div className="space-y-4">
              {course.announcements && course.announcements.length > 0 ? (
                course.announcements
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((announcement, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date(announcement.createdAt).toLocaleDateString()} at{' '}
                              {new Date(announcement.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap mb-4">{announcement.content}</p>
                      
                      {/* Announcement attachments display */}
                      {announcement.attachments && announcement.attachments.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
                          <div className="space-y-2">
                            {announcement.attachments.map((attachment, attachIndex) => {
                              // Handle both old string format and new object format
                              const fileName = typeof attachment === 'string' ? attachment : (attachment.originalName || attachment.filename)
                              const fileObj = typeof attachment === 'string' 
                                ? { originalName: attachment, filename: attachment, url: `/api/files/${attachment}` }
                                : attachment
                              
                              return (
                                <div key={attachIndex} className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                                  <div className="flex items-center space-x-2">
                                    <Paperclip className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm text-purple-800 font-medium">{fileName}</span>
                                    {fileObj.size && (
                                      <span className="text-xs text-purple-600">({(fileObj.size / 1024 / 1024).toFixed(2)} MB)</span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => setSelectedFile(fileObj)}
                                      className="p-1 hover:bg-purple-200 rounded text-purple-600 hover:text-purple-800"
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
                                      className="p-1 hover:bg-purple-200 rounded text-purple-600 hover:text-purple-800"
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
                    </div>
                  ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements yet</h3>
                  <p className="text-gray-500">Share something with your class to get started</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Classwork Tab */}
        {activeTab === 'classwork' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Create Assignment */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {!showAssignmentForm ? (
                <button
                  onClick={() => setShowAssignmentForm(true)}
                  className="w-full flex items-center justify-center space-x-3 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600 font-medium">Create assignment</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assignment Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter assignment title"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructions <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      placeholder="Provide detailed instructions for the assignment"
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={newAssignment.dueDate}
                        min={getMinDate()}
                        onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                          newAssignment.dueDate && new Date(newAssignment.dueDate) <= new Date() 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        required
                      />
                      <p className={`text-xs mt-1 ${
                        newAssignment.dueDate && new Date(newAssignment.dueDate) <= new Date()
                          ? 'text-red-500'
                          : 'text-gray-500'
                      }`}>
                        {newAssignment.dueDate && new Date(newAssignment.dueDate) <= new Date()
                          ? 'Due date must be in the future'
                          : 'Must be in the future'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={newAssignment.points}
                        onChange={(e) => setNewAssignment({...newAssignment, points: parseInt(e.target.value)})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  {/* File Attachments for Assignment */}
                  {newAssignment.attachments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
                      {newAssignment.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-600">{file.name}</span>
                          <button
                            onClick={() => removeAssignmentFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        id="assignment-files"
                        multiple
                        accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.jpg,.png,.zip,.rar"
                        onChange={handleAssignmentFileSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="assignment-files"
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                      >
                        <Paperclip className="w-5 h-5" />
                      </label>
                      <span className="text-xs text-gray-500">Add files (PDF, DOC, PPT, Images, etc.)</span>
                    </div>
                    <div className="space-x-3">
                      <button
                        onClick={() => {
                          setShowAssignmentForm(false)
                          setNewAssignment({ title: '', description: '', dueDate: '', points: 100, attachments: [] })
                        }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createAssignment}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Assign
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Assignments List */}
            <div className="space-y-4">
              {course.assignments && course.assignments.length > 0 ? (
                course.assignments
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((assignment, index) => {
                    const isExpired = assignment.dueDate && !isAssignmentAvailable(assignment.dueDate)
                    const dueDateObj = assignment.dueDate ? new Date(assignment.dueDate) : null
                    const now = new Date()
                    let statusColor = 'text-green-600'
                    let statusText = 'Active'
                    
                    if (isExpired) {
                      statusColor = 'text-red-600'
                      statusText = 'Expired'
                    } else if (dueDateObj && dueDateObj.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
                      statusColor = 'text-orange-600'
                      statusText = 'Due Soon'
                    }

                    return (
                      <div 
                        key={index} 
                        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${isExpired ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isExpired ? 'bg-red-100' : 'bg-blue-100'
                            }`}>
                              <FileText className={`w-5 h-5 ${isExpired ? 'text-red-600' : 'text-blue-600'}`} />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${statusColor}`}>
                                  {statusText}
                                </span>
                                {isExpired && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600">
                                    No longer accepting submissions
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>Posted {new Date(assignment.createdAt).toLocaleDateString()}</span>
                                {assignment.dueDate && (
                                  <span className={`flex items-center ${isExpired ? 'text-red-600' : ''}`}>
                                    <Calendar className="w-4 h-4 mr-1" />
                                    Due {new Date(assignment.dueDate).toLocaleString()}
                                  </span>
                                )}
                                <span>{assignment.points} points</span>
                              </div>
                            </div>
                          </div>
                          <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                        {assignment.description && (
                          <p className="text-gray-700 whitespace-pre-wrap mb-4">{assignment.description}</p>
                        )}
                        
                        {/* Assignment attachments display */}
                        {assignment.attachments && assignment.attachments.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
                            <div className="space-y-2">
                              {assignment.attachments.map((attachment, attachIndex) => {
                                // Handle both old string format and new object format
                                const fileName = typeof attachment === 'string' ? attachment : (attachment.originalName || attachment.filename)
                                const fileObj = typeof attachment === 'string' 
                                  ? { originalName: attachment, filename: attachment, url: `/api/files/${attachment}` }
                                  : attachment
                                
                                return (
                                  <div key={attachIndex} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                    <div className="flex items-center space-x-2">
                                      <Paperclip className="w-4 h-4 text-blue-600" />
                                      <span className="text-sm text-blue-800 font-medium">{fileName}</span>
                                      {fileObj.size && (
                                        <span className="text-xs text-blue-600">({(fileObj.size / 1024 / 1024).toFixed(2)} MB)</span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => setSelectedFile(fileObj)}
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

                        {isExpired && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-red-600" />
                              <span className="text-sm text-red-800">
                                This assignment has expired and is no longer accepting submissions.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                  <p className="text-gray-500">Create your first assignment to get started</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <SubmissionsTab course={course} courseId={courseId} />
        )}

        {/* People Tab */}
        {activeTab === 'people' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Course Code:</span>
                  <span className="ml-2 text-gray-900">{course.courseCode}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Join Code:</span>
                  <span className="ml-2 font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">{course.joinCode}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Students:</span>
                  <span className="ml-2 text-gray-900">{course.students?.length || 0}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="ml-2 text-gray-900">{new Date(course.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Students List */}
            {course.students && course.students.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Students ({course.students.length})</h4>
                <div className="space-y-3">
                  {course.students.map((student, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name || `Student ${index + 1}`}</p>
                        <p className="text-sm text-gray-600">{student.email || 'No email'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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

// Submissions Tab Component for Teachers
function SubmissionsTab({ course, courseId }) {
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [gradingSubmission, setGradingSubmission] = useState(null)

  // Helper function to get student name
  const getStudentName = (studentId) => {
    if (typeof studentId === 'object' && studentId.name) {
      return studentId.name // Already populated
    }
    
    // Try to find student in course.students
    const student = course?.students?.find(s => 
      s._id.toString() === (studentId._id || studentId).toString()
    )
    
    return student ? student.name : 'Unknown Student'
  }

  // Get assignments with submissions
  const assignmentsWithSubmissions = course?.assignments?.filter(assignment => 
    assignment.submissions && assignment.submissions.length > 0
  ) || []

  const fetchSubmissionDetails = async (assignment) => {
    setLoading(true)
    try {
      setSelectedAssignment(assignment)
      setSubmissions(assignment.submissions || [])
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGradeSubmission = async (submissionId, grade, feedback) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
  `http://localhost:5001/api/courses/${courseId}/assignments/${selectedAssignment._id}/submissions/${submissionId}/grade`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ grade, feedback })
        }
      )

      if (response.ok) {
        // Refresh the course data to show updated grades
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to grade submission')
      }
    } catch (error) {
      console.error('Error grading submission:', error)
      alert('Failed to grade submission')
    }
  }

  if (selectedAssignment) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setSelectedAssignment(null)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Submissions Overview</span>
        </button>

        {/* Assignment Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedAssignment.title}</h2>
              <p className="text-gray-700 mb-4">{selectedAssignment.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Due: {new Date(selectedAssignment.dueDate).toLocaleString()}</span>
                <span>{selectedAssignment.points} points</span>
                <span>{submissions.length} submissions</span>
              </div>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {submissions.filter(s => s.grade !== undefined).length}/{submissions.length} graded
            </span>
          </div>
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-gray-500">Students haven't submitted this assignment yet</p>
            </div>
          ) : (
            submissions.map((submission, index) => (
              <SubmissionCard
                key={index}
                submission={submission}
                assignment={selectedAssignment}
                course={course}
                onGrade={handleGradeSubmission}
              />
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Assignment Submissions</h2>
        <span className="text-sm text-gray-600">
          {assignmentsWithSubmissions.length} assignments have submissions
        </span>
      </div>

      {assignmentsWithSubmissions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
          <p className="text-gray-500">When students submit assignments, they will appear here for grading</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {assignmentsWithSubmissions.map((assignment, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fetchSubmissionDetails(assignment)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{assignment.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{assignment.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Award className="w-4 h-4" />
                      <span>{assignment.points} points</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ClipboardCheck className="w-4 h-4" />
                      <span>{assignment.submissions.length} submissions</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {assignment.submissions.filter(s => s.grade !== undefined).length}/{assignment.submissions.length} graded
                  </span>
                  <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm">
                    <Eye className="w-4 h-4" />
                    <span>View Submissions</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Individual Submission Card Component
function SubmissionCard({ submission, assignment, course, onGrade }) {
  const [isGrading, setIsGrading] = useState(false)
  const [grade, setGrade] = useState(submission.grade || '')
  const [feedback, setFeedback] = useState(submission.feedback || '')
  const [showFiles, setShowFiles] = useState(false)

  // Helper function to get student name
  const getStudentName = () => {
    // Check if submission.student is already populated with name
    if (submission.student && typeof submission.student === 'object' && submission.student.name) {
      return submission.student.name
    }
    
    // Try to find student in course.students using student ID
    const studentId = submission.student?._id || submission.student
    if (studentId && course?.students) {
      const student = course.students.find(s => s._id.toString() === studentId.toString())
      return student ? student.name : 'Unknown Student'
    }
    
    return 'Unknown Student'
  }

  const getStudentInitial = () => {
    const name = getStudentName()
    return name.charAt(0).toUpperCase()
  }

  const handleSaveGrade = async () => {
    if (grade < 0 || grade > assignment.points) {
      alert(`Grade must be between 0 and ${assignment.points}`)
      return
    }

    try {
      await onGrade(submission._id, parseInt(grade), feedback)
      setIsGrading(false)
    } catch (error) {
      console.error('Error saving grade:', error)
    }
  }

  const getStatusColor = () => {
    if (submission.grade !== undefined) {
      return submission.grade >= assignment.points * 0.7 ? 'text-green-600' : 'text-orange-600'
    }
    return 'text-blue-600'
  }

  const getStatusText = () => {
    if (submission.grade !== undefined) {
      return `Graded: ${submission.grade}/${assignment.points}`
    }
    return 'Pending'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold">
              {getStudentInitial()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {getStudentName()}
            </h3>
            <p className="text-sm text-gray-600">
              Submitted: {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor()} bg-gray-100`}>
          {getStatusText()}
        </span>
      </div>

      {/* Student Comment */}
      {submission.comment && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Student Comment:</h4>
          <p className="text-gray-700">{submission.comment}</p>
        </div>
      )}

      {/* Attachments */}
      {submission.attachments && submission.attachments.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">
              Submitted Files ({submission.attachments.length})
            </h4>
            <button
              onClick={() => setShowFiles(!showFiles)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {showFiles ? 'Hide' : 'Show'} Files
            </button>
          </div>
          
          {showFiles && (
            <div className="space-y-1">
              {submission.attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div className="flex items-center space-x-2">
                    <Paperclip className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{file}</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grading Section */}
      <div className="border-t pt-4">
        {isGrading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade (out of {assignment.points})
                </label>
                <input
                  type="number"
                  min="0"
                  max={assignment.points}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feedback (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Provide feedback to the student..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsGrading(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGrade}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Grade
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {submission.grade !== undefined ? (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Grade: {submission.grade}/{assignment.points}</span>
                {submission.feedback && (
                  <div className="mt-1 p-2 bg-blue-50 rounded text-blue-800">
                    <span className="font-medium">Feedback:</span> {submission.feedback}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-500">Not graded yet</span>
            )}
            
            <button
              onClick={() => setIsGrading(true)}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Award className="w-4 h-4" />
              <span>{submission.grade !== undefined ? 'Edit Grade' : 'Grade'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
