import { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';

const Courses = () => {
  // Add new state for editing
  const [editingCourse, setEditingCourse] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Add handleEditClick function
  const handleEditClick = (course) => {
    setEditingCourse(course);
    setShowEditForm(true);
  };

  // Add handleEditSubmit function
  const handleEditSubmit = (e) => {
    e.preventDefault();
    setCourses(courses.map(course => 
      course.id === editingCourse.id ? editingCourse : course
    ));
    setShowEditForm(false);
    setEditingCourse(null);
  };

  const [courses, setCourses] = useState([
    { 
      id: 1, 
      name: 'Web Development Fundamentals', 
      instructor: 'John Smith',
      students: 45,
      status: 'active',
      description: 'Learn HTML, CSS, and JavaScript basics',
      duration: '12 weeks'
    },
    { 
      id: 2, 
      name: 'Python Programming', 
      instructor: 'Sarah Johnson',
      students: 38,
      status: 'active',
      description: 'Master Python programming language',
      duration: '8 weeks'
    },
    { 
      id: 3, 
      name: 'Data Science Essentials', 
      instructor: 'Mike Wilson',
      students: 32,
      status: 'upcoming',
      description: 'Introduction to data analysis and visualization',
      duration: '10 weeks'
    },
    { 
      id: 4, 
      name: 'Machine Learning Basics', 
      instructor: 'Emily Brown',
      students: 28,
      status: 'completed',
      description: 'Learn ML algorithms and implementations',
      duration: '14 weeks'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    instructor: '',
    description: '',
    duration: '',
    status: 'upcoming'
  });

  const handleAddCourse = (e) => {
    e.preventDefault();
    setCourses([...courses, { 
      ...newCourse, 
      id: Date.now(),
      students: 0
    }]);
    setShowAddForm(false);
    setNewCourse({
      name: '',
      instructor: '',
      description: '',
      duration: '',
      status: 'upcoming'
    });
  };

  const handleDeleteCourse = (id) => {
    setCourses(courses.filter(course => course.id !== id));
  };
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Course Management</h3>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus size={18} />
              Add Course
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium">Active Courses</h4>
              <p className="text-2xl font-bold text-purple-600">
                {courses.filter(course => course.status === 'active').length}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium">Total Enrollments</h4>
              <p className="text-2xl font-bold text-blue-600">
                {courses.reduce((total, course) => total + course.students, 0)}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium">Completion Rate</h4>
              <p className="text-2xl font-bold text-green-600">78%</p>
            </div>
          </div>
        </div>

        {showAddForm && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <form onSubmit={handleAddCourse} className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Course Name"
                className="p-2 border rounded"
                value={newCourse.name}
                onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Instructor"
                className="p-2 border rounded"
                value={newCourse.instructor}
                onChange={(e) => setNewCourse({...newCourse, instructor: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Duration (e.g., 12 weeks)"
                className="p-2 border rounded"
                value={newCourse.duration}
                onChange={(e) => setNewCourse({...newCourse, duration: e.target.value})}
                required
              />
              <select
                className="p-2 border rounded"
                value={newCourse.status}
                onChange={(e) => setNewCourse({...newCourse, status: e.target.value})}
                required
              >
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              <textarea
                placeholder="Course Description"
                className="p-2 border rounded col-span-2"
                value={newCourse.description}
                onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                required
              />
              <div className="col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded"
                >
                  Add Course
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">Course Name</th>
                <th className="text-left p-4">Instructor</th>
                <th className="text-left p-4">Students</th>
                <th className="text-left p-4">Duration</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id} className="border-t">
                  <td className="p-4">
                    <div>
                      <div className="font-medium">{course.name}</div>
                      <div className="text-sm text-gray-500">{course.description}</div>
                    </div>
                  </td>
                  <td className="p-4">{course.instructor}</td>
                  <td className="p-4">{course.students}</td>
                  <td className="p-4">{course.duration}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      course.status === 'active' ? 'bg-green-100 text-green-800' :
                      course.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                      {/* Add Edit Form */}
                      {showEditForm && (
                        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                          <form onSubmit={handleEditSubmit} className="grid grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="Course Name"
                              className="p-2 border rounded"
                              value={editingCourse.name}
                              onChange={(e) => setEditingCourse({...editingCourse, name: e.target.value})}
                              required
                            />
                            <input
                              type="text"
                              placeholder="Instructor"
                              className="p-2 border rounded"
                              value={editingCourse.instructor}
                              onChange={(e) => setEditingCourse({...editingCourse, instructor: e.target.value})}
                              required
                            />
                            <input
                              type="text"
                              placeholder="Duration (e.g., 12 weeks)"
                              className="p-2 border rounded"
                              value={editingCourse.duration}
                              onChange={(e) => setEditingCourse({...editingCourse, duration: e.target.value})}
                              required
                            />
                            <select
                              className="p-2 border rounded"
                              value={editingCourse.status}
                              onChange={(e) => setEditingCourse({...editingCourse, status: e.target.value})}
                              required
                            >
                              <option value="upcoming">Upcoming</option>
                              <option value="active">Active</option>
                              <option value="completed">Completed</option>
                            </select>
                            <textarea
                              placeholder="Course Description"
                              className="p-2 border rounded col-span-2"
                              value={editingCourse.description}
                              onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})}
                              required
                            />
                            <div className="col-span-2 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowEditForm(false);
                                  setEditingCourse(null);
                                }}
                                className="px-4 py-2 bg-gray-200 rounded"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 bg-purple-600 text-white rounded"
                              >
                                Save Changes
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                      {/* Update the Edit button in the table */}
                      <button
                        onClick={() => handleEditClick(course)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Courses;