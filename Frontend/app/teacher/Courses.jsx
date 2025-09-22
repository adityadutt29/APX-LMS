import { 
  Book, 
  Users, 
  Clock, 
  Award, 
  ArrowRight, 
  Plus, 
  FileText, 
  MessageSquare, 
  Copy,
  MoreVertical,
  Settings,
  Archive,
  Share2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const Courses = () => {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          setLoading(false);
          return;
        }

  const response = await fetch('http://localhost:5001/api/courses/teacher', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        
        const result = await response.json();
        setCourses(result.data || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const copyJoinCode = (joinCode) => {
    navigator.clipboard.writeText(joinCode);
    // You can add a toast notification here
    alert('Join code copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <div className="ml-3 text-gray-500">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses && courses.length > 0 ? courses.map(course => (
          <div 
            key={course._id} 
            onClick={() => router.push(`/teacher/classroom/${course._id}`)}
            className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 cursor-pointer group"
          >
            {/* Course Header */}
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 h-32 p-6 relative">
              {/* Top section with title and menu */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 pr-4">
                  <h3 className="text-white text-lg font-bold mb-1 leading-tight">
                    {course.title.length > 25 ? `${course.title.substring(0, 25)}...` : course.title}
                  </h3>
                  <p className="text-white/90 text-sm font-medium">{course.subject}</p>
                  <p className="text-white/70 text-xs mt-1">{course.courseCode}</p>
                </div>
                
                {/* Student Count Circle */}
                <div className="bg-pink-500 w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg font-bold">
                    {course.students?.length || 0}
                  </span>
                </div>
              </div>
              
              {/* Bottom section with semester info */}
              <div className="absolute bottom-4 left-6">
                <p className="text-white/80 text-xs">
                  {course.semester} {course.year} • Section {course.section}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-white h-24 flex flex-col justify-center">
              <div className="mb-3">
                <p className="text-gray-600 text-sm line-clamp-2">
                  {course.description || "No description available"}
                </p>
              </div>
            </div>

            {/* Course Footer with Icons */}
            <div className="px-6 py-4 bg-white">
              <div className="flex justify-between items-center">
                {/* Left side - Course stats */}
                <div className="flex space-x-4 text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs">{course.students?.length || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">{course.assignments?.length || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs">{course.announcements?.length || 0}</span>
                  </div>
                </div>
                
                {/* Right side - Menu button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle menu actions here
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-12">
            <Book className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No courses yet</h3>
            <p className="text-gray-500 mb-4">Create your first course to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;