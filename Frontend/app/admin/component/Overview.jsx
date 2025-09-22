import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, GraduationCap } from 'lucide-react';

const Overview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCourses: 0,
    totalStudents: 0,
    userMonthlyTrend: [],
    studentScores: {},
    recentActivity: [],
  });

  useEffect(() => {
    const fetchOverviewStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/admin/overview', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalUsers: data.totalUsers,
            activeCourses: data.activeCourses,
            totalStudents: data.totalStudents,
            userMonthlyTrend: data.userMonthlyTrend,
            studentScores: data.studentScores,
            recentActivity: data.recentActivity,
          });
        }
      } catch (err) {
        setStats(prev => ({ ...prev }));
      }
    };
    fetchOverviewStats();
  }, []);

  // Prepare enrollment trend data for chart
  const enrollmentTrendData = stats.userMonthlyTrend.map(item => ({
    month: item.month,
    users: item.users
  }));

  // Prepare per-student assignment, viva, quiz data for charts
  const studentIds = Object.keys(stats.studentScores);
  // Map student id to name if available
  const getStudentName = (id) => {
    const info = stats.studentScores[id]?.studentInfo;
    return info?.name || id;
  };
  const assignmentChartData = studentIds.map(id => {
    const assignments = stats.studentScores[id]?.assignments ?? [];
    return {
      student: getStudentName(id),
      assignmentAvg: assignments.length
        ? (assignments.reduce((sum, a) => sum + (a.score ?? 0), 0) / assignments.length).toFixed(1)
        : 0
    };
  });
  const vivaChartData = studentIds.map(id => {
    const vivaArr = stats.studentScores[id]?.viva ?? [];
    const outOf = vivaArr.length && vivaArr[0]?.outOf ? vivaArr[0].outOf : 10;
    const vivaAvg = vivaArr.length
      ? (vivaArr.reduce((sum, v) => sum + (v.score ?? 0), 0) / vivaArr.length).toFixed(1)
      : 0;
    return {
      student: getStudentName(id),
      vivaAvg,
      outOf
    };
  });
  const quizChartData = studentIds.map(id => {
    const quizzes = stats.studentScores[id]?.quizzes ?? [];
    return {
      student: getStudentName(id),
      quizAvg: quizzes.length
        ? (quizzes.reduce((sum, q) => sum + (q.score ?? 0), 0) / quizzes.length).toFixed(1)
        : 0
    };
  });

  return (
    <div className="space-y-8 px-2 md:px-6 py-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Admin Performance Overview
          </h1>
          <p className="text-gray-600 text-lg font-medium">Track student progress, course activity, and engagement</p>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <div className="flex items-center gap-2 bg-white rounded-xl shadow px-4 py-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span className="font-bold text-purple-700">{stats.totalUsers}</span>
            <span className="text-gray-500 text-sm">Users</span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-xl shadow px-4 py-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-blue-700">{stats.activeCourses}</span>
            <span className="text-gray-500 text-sm">Courses</span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-xl shadow px-4 py-2">
            <GraduationCap className="w-6 h-6 text-green-600" />
            <span className="font-bold text-green-700">{stats.totalStudents}</span>
            <span className="text-gray-500 text-sm">Students</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col">
          <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            User Enrollment Trend
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={enrollmentTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col">
          <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            Assignment Scores (Avg per Student)
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={assignmentChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="student" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="assignmentAvg" fill="#6366f1" name="Assignment Avg" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col">
          <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-green-500" />
            Viva Scores (Avg per Student)
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={vivaChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="student" />
                <YAxis domain={[0, 10]} />
                <Tooltip formatter={(value, name, props) => [`${value} / ${props.payload.outOf}`, "Viva Avg"]} />
                <Legend />
                <Bar dataKey="vivaAvg" fill="#10b981" name="Viva Avg" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col">
          <h3 className="text-xl font-bold text-yellow-700 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-yellow-500" />
            Quiz Scores (Avg per Student)
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={quizChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="student" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quizAvg" fill="#f59e42" name="Quiz Avg" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;