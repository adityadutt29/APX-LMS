import { Search } from 'lucide-react';

const Students = ({ students, searchQuery, setSearchQuery, loading }) => {
  // Filtering logic
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.studentId && student.studentId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold text-purple-700 px-6 pt-6 pb-2">Student List</h2>
      <div className="p-4 border-b flex justify-between items-center">
        <div className="relative flex-1 mr-4">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search students by name or roll number..."
            className="w-full pl-10 p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Table or loading spinner */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <span className="animate-spin inline-block w-8 h-8 border-4 border-purple-300 border-t-transparent rounded-full mr-2"></span>
            Loading students...
          </div>
        ) : (
          <>
            <table className="w-full border border-gray-300 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 border-b border-gray-300">Name</th>
                  <th className="text-left p-4 border-b border-gray-300">Student ID</th>
                  <th className="text-left p-4 border-b border-gray-300">Classroom</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student._id || student.id} className="hover:bg-gray-50 border-b border-gray-200">
                    <td className="p-4 font-medium border-r border-gray-200">{student.name}</td>
                    <td className="p-4 font-mono text-purple-600 border-r border-gray-200">{student.studentId}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                        {student.section}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStudents.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No students found matching your search
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Students;
