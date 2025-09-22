import { Search } from 'lucide-react';

const QuizResults = ({ quizResults, searchQuery, setSearchQuery }) => {
  const filteredQuizResults = quizResults.filter(result =>
    (result.roleNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (result.topic?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by role number or topic..."
            className="w-full pl-10 p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Role Number</th>
              <th className="text-left p-4">Topic</th>
              <th className="text-left p-4">Score</th>
              <th className="text-left p-4">Percentage</th>
              <th className="text-left p-4">Total Questions</th>
              <th className="text-left p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuizResults.map((result, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="p-4 font-mono text-purple-600">{result.roleNumber}</td>
                <td className="p-4 capitalize">{result.topic}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded">
                    {result.score}/{result.totalQuestions}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded ${
                    result.percentage >= 80 ? 'bg-green-100 text-green-600' :
                    result.percentage >= 60 ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {result.percentage}%
                  </span>
                </td>
                <td className="p-4">{result.totalQuestions}</td>
                <td className="p-4 text-sm text-gray-500">
                  {new Date(result.timestamp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredQuizResults.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No quiz results found
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizResults;