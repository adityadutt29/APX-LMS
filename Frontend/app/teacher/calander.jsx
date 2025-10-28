import { useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const getToday = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

const Calendar = ({ courseId: propCourseId }) => {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(propCourseId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE_URL}/api/courses/teacher`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Failed to fetch courses');
        const data = await res.json();
        setCourses(data.data || []);
        
        // If no courseId prop and we have courses, select the first one
        if (!propCourseId && data.data && data.data.length > 0) {
          setSelectedCourseId(data.data[0]._id);
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setCourses([]);
      }
    };
    fetchCourses();
  }, [propCourseId]);

  // Fetch assignments for the selected course
  useEffect(() => {
    if (!selectedCourseId) return;
    const fetchAssignments = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE_URL}/api/courses/${selectedCourseId}/assignments`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Failed to fetch assignments');
        const data = await res.json();
        console.log('Fetched assignments:', data.data); // Debug log
        setAssignments(data.data || []);
      } catch (err) {
        setError(err.message);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [selectedCourseId]);

  // Filter assignments for the selected date (by creation date)
  console.log('Selected date:', selectedDate); // Debug log
  console.log('Assignments for date:', assignments.map(a => a.createdAt)); // Debug log
  const assignmentsForDate = assignments.filter(a => {
    const createdDate = a.createdAt?.split('T')[0];
    return createdDate === selectedDate;
  });

  // Helper to show status and color
  const getStatus = (a) => {
    if (a.done || a.completed) return { label: 'Completed', color: 'text-gray-500' };
    
    const now = new Date();
    const deadline = a.deadline || a.dueDate;
    
    if (deadline) {
      const dueDate = new Date(deadline);
      if (now > dueDate) {
        return { label: 'Overdue', color: 'text-red-600' };
      } else {
        return { label: 'Active', color: 'text-green-600' };
      }
    }
    
    // If no deadline, just check if it's completed
    return { label: 'Active', color: 'text-green-600' };
  };

  // Generate days for current month
  const today = new Date(selectedDate);
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = new Date(year, month, d).toISOString().split("T")[0];
    days.push(dateStr);
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Calendar</h2>
      
      {/* Course Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Course:
        </label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Select a course...</option>
          {courses.map(course => (
            <option key={course._id} value={course._id}>
              {course.title} ({course.courseCode})
            </option>
          ))}
        </select>
      </div>

      {selectedCourseId && (
        <>
          <div className="grid grid-cols-7 gap-2 mb-8">
            {days.map(date => (
              <button
                key={date}
                className={`rounded-lg px-2 py-3 text-center border transition-all text-sm font-medium ${
                  date === selectedDate
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-purple-100"
                }`}
                onClick={() => setSelectedDate(date)}
              >
                {date.split("-")[2]}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Assignments for {selectedDate}</h3>
            {loading ? (
              <div className="text-gray-400">Loading...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <ul className="mb-4">
                {assignmentsForDate.length === 0 && (
                  <li className="text-gray-400">No assignments for this day.</li>
                )}
                {assignmentsForDate.map((a, idx) => {
                  const status = getStatus(a);
                  const createdDateTime = new Date(a.createdAt).toLocaleString();
                  const deadline = a.deadline || a.dueDate;
                  const deadlineText = deadline ? new Date(deadline).toLocaleDateString() : 'No deadline';
                  
                  return (
                    <li key={a._id || idx} className={`mb-2 text-base`}>
                      <span className="font-semibold">{a.title || a.text || a.name}</span>
                      <span className="ml-2 text-xs text-gray-500">(Created: {createdDateTime})</span>
                      <span className="ml-2 text-xs text-gray-400">(Due: {deadlineText})</span>
                      <span className={`ml-4 text-xs font-bold ${status.color}`}>{status.label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Calendar;
