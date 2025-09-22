"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Plus, 
  Sparkles, 
  Video, 
  Clock, 
  Users, 
  Star,
  Play,
  ExternalLink,
  Code,
  FileText,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  Eye,
  Edit,
  X,
  ArrowLeft,
  Youtube,
  CheckCircle,
  AlertCircle,
  Trash2,
  Share2 // Add this import from lucide-react
} from 'lucide-react';

const GenerateCoursePage = () => {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [generatedCourse, setGeneratedCourse] = useState(null);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [generatingCourseId, setGeneratingCourseId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCourseId, setShareCourseId] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  
  // Form state for course generation
  const [formData, setFormData] = useState({
    topic: '',
    details: '',
    difficulty: 'beginner',
    duration: '',
    numChapters: 8
  });

  // Quota limits (can be adjusted based on your model/account)
const COURSE_LIMITS = {
  minute: 30,    // courses per minute
  hour: 900,     // courses per hour
  day: 14400     // courses per day
};

function getCourseGenerationStats() {
  const now = Date.now();
  const stats = JSON.parse(localStorage.getItem('courseGenerationStats') || '[]');
  // Filter out old records
  const minuteAgo = now - 60 * 1000;
  const hourAgo = now - 60 * 60 * 1000;
  const dayAgo = now - 24 * 60 * 60 * 1000;
  return {
    minute: stats.filter(ts => ts > minuteAgo).length,
    hour: stats.filter(ts => ts > hourAgo).length,
    day: stats.filter(ts => ts > dayAgo).length,
    all: stats
  };
}

function recordCourseGeneration() {
  const now = Date.now();
  const stats = JSON.parse(localStorage.getItem('courseGenerationStats') || '[]');
  stats.push(now);
  // Keep only last 24 hours
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const filtered = stats.filter(ts => ts > dayAgo);
  localStorage.setItem('courseGenerationStats', JSON.stringify(filtered));
}

// Fetch existing courses
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5001/api/youtubecourses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      setCourses(data);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    // Quota check
    const stats = getCourseGenerationStats();
    if (stats.minute >= COURSE_LIMITS.minute) {
      setError('API quota exceeded: You have reached the course generation limit for this minute. Please wait and try again.');
      return;
    }
    if (stats.hour >= COURSE_LIMITS.hour) {
      setError('API quota exceeded: You have reached the course generation limit for this hour. Please wait and try again.');
      return;
    }
    if (stats.day >= COURSE_LIMITS.day) {
      setError('API quota exceeded: You have reached the course generation limit for today. Please wait and try again tomorrow.');
      return;
    }

    if (!formData.topic.trim()) {
      setError('Please enter a course topic');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5001/api/youtubecourses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate course');
      }

      const data = await response.json();
      setGeneratedCourse(data);
      setShowCreateModal(false);
      setShowPreview(true);

      // Record successful generation
      recordCourseGeneration();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedCourse) return;

    setLoading(true);
    try {
      // Defensive: get token from localStorage and check its value
      const token = localStorage.getItem('token');
      if (!token || token === 'undefined' || token === '') {
        setError('Authentication token missing. Please login again.');
        setLoading(false);
        return;
      }
      // Debug: log token for troubleshooting
      console.log('Saving course with token:', token);

      const response = await fetch('http://localhost:5001/api/youtubecourses/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(generatedCourse)
      });

      if (!response.ok) {
        throw new Error('Failed to save course');
      }

      alert('Course saved successfully!');
      setGeneratedCourse(null);
      setShowPreview(false);
      fetchCourses();
      // Reset form
      setFormData({
        topic: '',
        details: '',
        difficulty: 'beginner',
        duration: '',
        numChapters: 8
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async (courseId) => {
    setGeneratingCourseId(courseId);
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:5001/api/chapters/courses/${courseId}/generate-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate content';
        
        try {
          const errorData = await response.json();
          
          // Handle specific error types
          if (response.status === 429) {
            errorMessage = 'Rate limit exceeded! The AI service is temporarily unavailable due to too many requests. Please wait a few minutes and try again. The free tier has a limit of 15 requests per minute.';
          } else if (response.status === 500) {
            if (errorData.error && errorData.error.includes('429') || errorData.error && errorData.error.includes('quota')) {
              errorMessage = 'AI API quota exceeded! Please wait a few minutes before generating content again. The free tier has usage limits.';
            } else {
              errorMessage = 'Server error occurred while generating content. Please try again later.';
            }
          } else if (response.status === 404) {
            errorMessage = 'Course not found. Please refresh the page and try again.';
          } else if (response.status === 401) {
            errorMessage = 'Authentication failed. Please log in again.';
          } else {
            errorMessage = errorData.error || errorMessage;
          }
        } catch (parseError) {
          // If we can't parse the error response, use status-based messages
          if (response.status === 429) {
            errorMessage = 'Rate limit exceeded! Please wait a few minutes and try again.';
          } else if (response.status === 500) {
            errorMessage = 'Server error occurred. This might be due to API rate limits. Please wait and try again.';
          }
        }
        
        throw new Error(errorMessage);
      }

      const updatedCourse = await response.json();
      setCourses(courses.map(course => 
        course._id === courseId ? updatedCourse : course
      ));
      
      alert('YouTube course content generated successfully!');
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error generating content:', err);
      const errorMessage = err.message;
      setError(errorMessage);
      
      // Show user-friendly error with suggestions
      if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
        alert(`⚠️ Rate Limit Reached\n\n${errorMessage}\n\n💡 Suggestions:\n• Wait 2-3 minutes before trying again\n• Try generating content for one course at a time\n• Consider upgrading to a paid plan for higher limits`);
      } else {
        alert(`❌ Error: ${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
      }
    } finally {
      setLoading(false);
      setGeneratingCourseId(null);
    }
  };

  const toggleChapterExpansion = (courseId, chapterIndex) => {
    const key = `${courseId}-${chapterIndex}`;
    setExpandedChapters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getYoutubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const resetToMainView = () => {
    setSelectedCourse(null);
    setGeneratedCourse(null);
    setShowPreview(false);
    setShowCreateModal(false);
  };

  // Create Course Modal
  const renderCreateModal = () => {
    const stats = getCourseGenerationStats();
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Create AI Course</h2>
                  <p className="text-gray-600">Generate comprehensive courses with AI</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Course Topic *
                </label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  placeholder="e.g., Python Web Development, React Fundamentals"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Difficulty Level
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Total Duration
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g., 8 hours, 3 weeks"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Number of Chapters
                </label>
                <input
                  type="number"
                  name="numChapters"
                  value={formData.numChapters}
                  onChange={handleChange}
                  min="3"
                  max="20"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Additional Details (Optional)
              </label>
              <textarea
                name="details"
                value={formData.details}
                onChange={handleChange}
                placeholder="Provide specific requirements, target audience, or learning objectives..."
                rows={4}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Course
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Course Preview
  const renderCoursePreview = () => (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <button
              onClick={resetToMainView}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{generatedCourse?.name}</h1>
              <p className="text-gray-600 mt-1">Review your generated course</p>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowPreview(false)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              Back to Edit
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 font-medium flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Save Course
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="capitalize bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
              {generatedCourse?.difficulty}
            </span>
            <span className="text-gray-600 font-medium flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {generatedCourse?.totalDuration}
            </span>
          </div>
          <p className="text-gray-700 leading-relaxed">{generatedCourse?.summary}</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-blue-500" />
            Course Chapters ({generatedCourse?.chapters?.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {generatedCourse?.chapters?.map((chapter, index) => (
            <div key={index} className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-blue-200 hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  Chapter {index + 1}: {chapter.title}
                </h3>
                <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">
                  {chapter.duration}
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm">{chapter.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Main Courses List
  const renderCoursesList = () => (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Generate AI Courses</h1>
          <p className="text-gray-600">Create, manage and generate content for your AI-powered courses</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center shadow-lg"
        >
          <Plus className="w-6 h-6 mr-2" />
          Create New Course
        </button>
      </div>

      {/* Error Message with better styling */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-6 rounded-lg shadow-sm">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-800 mb-2">
                {error.includes('rate limit') || error.includes('quota') ? 'Rate Limit Exceeded' : 'Generation Error'}
              </h3>
              <p className="text-red-700 mb-3">{error}</p>
              
              {(error.includes('rate limit') || error.includes('quota')) && (
                <div className="bg-red-100 p-3 rounded-md mb-3">
                  <h4 className="font-medium text-red-800 mb-1">What you can do:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Wait 2-3 minutes before trying again</li>
                    <li>• Generate content for one course at a time</li>
                    <li>• The free tier allows 15 requests per minute</li>
                    <li>• Consider upgrading to a paid Google AI plan for higher limits</li>
                  </ul>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => setError('')}
                  className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md transition-colors"
                >
                  Dismiss
                </button>
                <button 
                  onClick={() => {
                    // Directing users to Cerebras rate limit docs or general guidance
                    window.open('https://docs.cerebras.net/cloud/usage-and-limits', '_blank');
                  }}
                  className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-md transition-colors"
                >
                  Learn About Rate Limits
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Courses</p>
              <p className="text-3xl font-bold text-blue-800">{courses.length}</p>
            </div>
            <BookOpen className="w-12 h-12 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">With Content</p>
              <p className="text-3xl font-bold text-green-800">
                {courses.filter(course => course.chapters?.some(chapter => chapter.content?.length > 0)).length}
              </p>
            </div>
            <Video className="w-12 h-12 text-green-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Total Chapters</p>
              <p className="text-3xl font-bold text-purple-800">
                {courses.reduce((total, course) => total + (course.chapters?.length || 0), 0)}
              </p>
            </div>
            <FileText className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">No courses created yet</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Start creating your first AI-generated course with comprehensive chapters and YouTube video content
          </p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
          >
            Create Your First Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course) => {
            const hasContent = course.chapters?.some(chapter => chapter.content?.length > 0);
            const isGenerating = generatingCourseId === course._id;

            return (
              <div key={course._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 relative">
                <div className="p-10">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800 line-clamp-2 pr-2">{course.name}</h3>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="capitalize bg-blue-100 text-blue-800 px-14 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                      {course.difficulty}
                    </span>
                    <button
                      onClick={() => handleDeleteCourse(course._id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 rounded-full p-2 transition-all ml-2"
                      title="Delete Course"
                      style={{ position: 'static' }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">{course.summary}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
                    <span className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                      <BookOpen className="w-4 h-4 mr-1" />
                      {course.chapters?.length || 0} Chapters
                    </span>
                    <span className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                      <Clock className="w-4 h-4 mr-1" />
                      {course.totalDuration}
                    </span>
                  </div>
                  <div className="space-y-3 flex flex-col md:flex-row gap-3">
                    <button 
                      onClick={() => setSelectedCourse(course)}
                      className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl hover:bg-blue-600 transition-all font-medium flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleOpenShareModal(course._id)}
                      className="w-full bg-purple-500 text-white py-3 px-4 rounded-xl hover:bg-purple-600 transition-all font-medium flex items-center justify-center"
                      title="Share Course"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Course Details View (unchanged from original)
  const renderCourseDetails = () => {
    if (!selectedCourse) return null;

    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <button 
              onClick={() => setSelectedCourse(null)}
              className="text-blue-500 hover:text-blue-600 mb-2 flex items-center"
            >
              ← Back to Courses
            </button>
            <h1 className="text-3xl font-bold text-gray-800">{selectedCourse.name}</h1>
          </div>
          
          {!selectedCourse.chapters?.some(chapter => chapter.content?.length > 0) && (
            <button 
              onClick={() => handleGenerateContent(selectedCourse._id)}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating Content...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Course Content
                </>
              )}
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="capitalize bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {selectedCourse.difficulty}
            </span>
            <span className="text-gray-600">{selectedCourse.totalDuration}</span>
          </div>
          <p className="text-gray-700 mb-4">{selectedCourse.summary}</p>
        </div>

        <h2 className="text-2xl font-semibold mb-6">Course Chapters</h2>
        
        <div className="space-y-4">
          {selectedCourse.chapters?.map((chapter, index) => {
            const hasContent = chapter.content && chapter.content.length > 0;
            const isExpanded = expandedChapters[`${selectedCourse._id}-${index}`];
            
            return (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Chapter {index + 1}: {chapter.title}
                      </h3>
                      <p className="text-gray-600 mb-2">{chapter.summary}</p>
                      <span className="text-gray-500 text-sm">{chapter.duration}</span>
                    </div>
                    
                    {hasContent && (
                      <button
                        onClick={() => toggleChapterExpansion(selectedCourse._id, index)}
                        className="ml-4 p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </button>
                    )}
                  </div>

                  {hasContent && isExpanded && (
                    <div className="mt-6 border-t pt-6">
                      <h4 className="text-lg font-semibold mb-4 flex items-center">
                        <Video className="w-5 h-5 mr-2 text-red-500" />
                        Chapter Content
                      </h4>
                      
                      <div className="space-y-6">
                        {chapter.content.map((content, contentIndex) => {
                          const videoId = getYoutubeVideoId(content.videoUrl);
                          
                          return (
                            <div key={contentIndex} className="bg-gray-50 rounded-lg p-6">
                              <div className="flex flex-col lg:flex-row gap-6">
                                {/* Video Player */}
                                <div className="lg:w-1/2">
                                  {videoId ? (
                                    <div className="aspect-video">
                                      <iframe
                                        src={`https://www.youtube.com/embed/${videoId}`}
                                        className="w-full h-full rounded-lg"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      ></iframe>
                                    </div>
                                  ) : (
                                    <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                                      <Video className="w-12 h-12 text-gray-400" />
                                    </div>
                                  )}
                                  
                                  <div className="mt-4">
                                    <h5 className="font-semibold text-gray-800 mb-2">{content.videoTitle}</h5>
                                    <a 
                                      href={content.videoUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:text-blue-600 text-sm flex items-center"
                                    >
                                      <ExternalLink className="w-4 h-4 mr-1" />
                                      Watch on YouTube
                                    </a>
                                  </div>
                                </div>
                                
                                {/* Content Details */}
                                <div className="lg:w-1/2">
                                  <div className="mb-4">
                                    <h6 className="font-semibold text-gray-800 mb-2 flex items-center">
                                      <FileText className="w-4 h-4 mr-2" />
                                      Summary
                                    </h6>
                                    <p className="text-gray-600 text-sm leading-relaxed">{content.summary}</p>
                                  </div>
                                  
                                  {content.keyPoints && content.keyPoints.length > 0 && (
                                    <div className="mb-4">
                                      <h6 className="font-semibold text-gray-800 mb-2 flex items-center">
                                        <Lightbulb className="w-4 h-4 mr-2" />
                                        Key Points
                                      </h6>
                                      <ul className="text-gray-600 text-sm space-y-1">
                                        {content.keyPoints.map((point, pointIndex) => (
                                          <li key={pointIndex} className="flex items-start">
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                            {point}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  {content.codeBlocks && content.codeBlocks.length > 0 && (
                                    <div>
                                      <h6 className="font-semibold text-gray-800 mb-2 flex items-center">
                                        <Code className="w-4 h-4 mr-2" />
                                        Code Examples
                                      </h6>
                                      <div className="space-y-3">
                                        {content.codeBlocks.map((codeBlock, codeIndex) => (
                                          <div key={codeIndex} className="bg-gray-900 rounded-lg p-4">
                                            <div className="text-xs text-gray-400 mb-2">{codeBlock.language}</div>
                                            <pre className="text-green-400 text-sm overflow-x-auto">
                                              <code>{codeBlock.code}</code>
                                            </pre>
                                            {codeBlock.explanation && (
                                              <p className="text-gray-300 text-xs mt-2">{codeBlock.explanation}</p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {!hasContent && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 text-sm">
                        Content not generated yet. Click "Generate Course Content" to create video-based learning materials.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Add delete course function
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/youtubecourses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to delete course');
      }
      setCourses(prev => prev.filter(course => course._id !== courseId));
      alert('Course deleted successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch all students for sharing
  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/users?role=student', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setStudents([]);
    }
  };

  // Open share modal for a course
  const handleOpenShareModal = (courseId) => {
    setShareCourseId(courseId);
    setShowShareModal(true);
    setSelectedStudents([]);
    fetchStudents();
  };

  // Share course to selected students (use YoutubeCourseShare API)
  const handleShareCourse = async () => {
    if (!shareCourseId || selectedStudents.length === 0) return;
    try {
      const token = localStorage.getItem('token');
      // Make sure the URL matches the backend route exactly:
      // Backend: app.use('/api/youtubecourse-share', YoutubeCourseShareRoutes);
      // Route: router.post('/:courseId/share', protect, shareCourseToStudents);
      // So the correct URL is:
      // http://localhost:5001/api/youtubecourse-share/:courseId/share
      const response = await fetch(`http://localhost:5001/api/youtubecourse-share/${shareCourseId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ students: selectedStudents })
      });
      if (!response.ok) throw new Error('Failed to share course');
      alert('Course shared successfully!');
      setShowShareModal(false);
      setShareCourseId(null);
      setSelectedStudents([]);
    } catch (err) {
      alert('Error sharing course: ' + err.message);
    }
  };

  // Add Share Modal
  const renderShareModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Share2 className="w-6 h-6 text-blue-600" />
          Share Course
        </h2>
        <p className="mb-4 text-gray-600">Select students to share this course with:</p>
        <div className="max-h-64 overflow-y-auto mb-6">
          {students.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No students found.</div>
          ) : (
            <ul className="space-y-2">
              {students.map(student => (
                <li key={student._id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student._id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedStudents(prev => [...prev, student._id]);
                      } else {
                        setSelectedStudents(prev => prev.filter(id => id !== student._id));
                      }
                    }}
                  />
                  <span className="text-gray-700">{student.name || student.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-end gap-4">
          <button
            onClick={() => setShowShareModal(false)}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleShareCourse}
            disabled={selectedStudents.length === 0}
            className="px-6 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      {/* Main Content */}
      {showPreview && generatedCourse && renderCoursePreview()}
      {!showPreview && !selectedCourse && renderCoursesList()}
      {selectedCourse && renderCourseDetails()}
      {/* Create Course Modal */}
      {showCreateModal && renderCreateModal()}
      {/* Share Modal */}
      {showShareModal && renderShareModal()}
    </div>
  );
};

export default GenerateCoursePage;