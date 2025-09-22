const Grades = ({ grades, loading }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <h2 className="text-2xl font-bold text-purple-700 px-6 pt-6 pb-2">Grades List</h2>
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
              <th className="text-left p-4 border-b border-gray-300">Score</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade, index) => (
              <tr key={index} className="hover:bg-gray-50 border-b border-gray-200">
                <td className="p-4 border-r border-gray-200">{grade.student}</td>
                <td className="p-4 border-r border-gray-200">{grade.assignment}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-green-100 text-green-600 rounded">
                    {grade.score}%
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