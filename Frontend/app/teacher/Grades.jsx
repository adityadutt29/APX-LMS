import { useState, useEffect } from 'react';

const Grades = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['All', 'Viva', 'Practice', 'AssignmentScore'];
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch all grades for dashboard from backend
    const fetchAllGrades = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setGrades([]);
          setLoading(false);
          return;
        }
        const response = await fetch('http://localhost:5001/api/grades/all', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          setGrades([]);
        } else {
          const data = await response.json();
          // Flatten studentScores object to array for table rendering
          const flatGrades = Object.entries(data).flatMap(([studentId, scores]) => {
            // Use scores.name if available, otherwise fallback to studentId
            const studentName = scores.name || scores.studentName || scores.student || studentId;
            return [
              ...scores.assignments.map(a => ({ student: studentName, assignment: a.course, type: 'Assignment', score: a.score })),
              ...scores.viva.map(v => ({ student: studentName, assignment: v.subject || 'Viva', type: 'Viva', score: v.score })),
              ...scores.quizzes.map(q => ({ student: studentName, assignment: q.quizName || q.fileName || 'Practice', type: 'Practice', percentage: q.percentage, score: q.score })),
            ];
          });
          setGrades(flatGrades);
        }
      } catch (err) {
        setGrades([]);
      }
      setLoading(false);
    };
    fetchAllGrades();
  }, []);

  // Filter grades by selected category
  const filteredGrades = selectedCategory === 'All'
    ? grades
    : grades.filter(g => {
        if (selectedCategory === 'AssignmentScore') {
          return (g.type || '').toLowerCase() === 'assignment' || (g.type || '').toLowerCase() === 'assignmentscore';
        }
        if (selectedCategory === 'Practice') {
          return (g.type || '').toLowerCase() === 'practice';
        }
        return (g.type || 'Other') === selectedCategory;
      });

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <h2 className="text-2xl font-bold text-purple-700 px-6 pt-6 pb-2">Grades List</h2>
      <div className="flex gap-2 px-6 pb-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg font-semibold border transition-all duration-200 ${selectedCategory === cat ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-purple-50 hover:text-purple-700'}`}
          >
            {cat}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="p-8 text-center text-gray-500">
          <span className="animate-spin inline-block w-8 h-8 border-4 border-green-300 border-t-transparent rounded-full mr-2"></span>
          Loading grades...
        </div>
      ) : (
        <table className="w-full border border-gray-300 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 border-b border-gray-300">Student</th>
              <th className="text-left p-4 border-b border-gray-300">Assignment</th>
              <th className="text-left p-4 border-b border-gray-300">Type</th>
              <th className="text-left p-4 border-b border-gray-300">Score</th>
            </tr>
          </thead>
          <tbody>
            {filteredGrades.map((grade, index) => (
              <tr key={index} className="hover:bg-gray-50 border-b border-gray-200">
                <td className="p-4 border-r border-gray-200">{grade.student}</td>
                <td className="p-4 border-r border-gray-200">{grade.assignment}</td>
                <td className="p-4 border-r border-gray-200">
                  {grade.type ? (
                    <span className={`px-2 py-1 rounded ${grade.type === 'Viva' ? 'bg-blue-100 text-blue-600' : grade.type === 'AI Quiz' ? 'bg-purple-100 text-purple-600' : (grade.type.toLowerCase() === 'assignment' || grade.type.toLowerCase() === 'assignmentscore') ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                      {grade.type === 'AssignmentScore' ? 'Assignment' : grade.type}
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">Other</span>
                  )}
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-green-100 text-green-600 rounded">
                    {grade.type === 'Practice' ? `${grade.percentage || 0}%` : grade.score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Grades;