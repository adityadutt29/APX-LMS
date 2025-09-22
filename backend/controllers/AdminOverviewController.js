const User = require('../models/Users');
const Course = require('../models/Course');
const Viva = require('../models/Viva');
const Quiz = require('../models/PracticeResult');
const UserAnswer = require('../models/UserAnswer');

exports.getAdminOverview = async (req, res) => {
  try {
    // Aggregate stats
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeCourses = await Course.countDocuments({ isActive: true });

    // Enrollment trend (from User creation dates, by month)
    const userMonthlyTrend = await User.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]).then(data => data.map(item => ({
      month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][item._id - 1],
      users: item.count
    })));

    // Individual student scores for assignments (from submission.grade), viva (from feedback), quizzes
    const courses = await Course.find().lean(); // Use lean for faster access

    let assignmentScores = [];
    courses.forEach(course => {
      if (Array.isArray(course.assignments)) {
        course.assignments.forEach(assignment => {
          if (Array.isArray(assignment.submissions)) {
            assignment.submissions.forEach(sub => {
              if (sub.student && typeof sub.grade === 'number') {
                assignmentScores.push({
                  studentId: sub.student.toString(),
                  course: course.title,
                  score: sub.grade
                });
              }
            });
          }
        });
      }
    });

    // For viva, use UserAnswer model feedback (rating out of 10) for each student
    const vivaFeedbacks = await UserAnswer.find({}, 'studentId rating subject');
    const vivaScores = vivaFeedbacks.map(v => ({
      studentId: v.studentId?.toString(),
      subject: v.subject,
      score: typeof v.rating === 'number' ? v.rating : parseFloat(v.rating), // out of 10
      outOf: 10
    }));

    // For quizzes, assume PracticeResult model has { studentId, score, quizName }
    const quizScoresRaw = await Quiz.find({}, 'studentId score quizName');
    const quizScores = quizScoresRaw.map(q => ({
      studentId: q.studentId?.toString(),
      quizName: q.quizName,
      score: q.score
    }));

    // Prepare per-student graphs data
    const studentScores = {};
    assignmentScores.forEach(a => {
      if (!studentScores[a.studentId]) studentScores[a.studentId] = { assignments: [], viva: [], quizzes: [] };
      studentScores[a.studentId].assignments.push({ course: a.course, score: a.score });
    });
    vivaScores.forEach(v => {
      if (!studentScores[v.studentId]) studentScores[v.studentId] = { assignments: [], viva: [], quizzes: [] };
      studentScores[v.studentId].viva.push({ subject: v.subject, score: v.score });
    });
    quizScores.forEach(q => {
      if (!studentScores[q.studentId]) studentScores[q.studentId] = { assignments: [], viva: [], quizzes: [] };
      studentScores[q.studentId].quizzes.push({ quizName: q.quizName, score: q.score });
    });

    // Recent activity (last 10 actions) - still empty, fill as needed
    const recentActivity = [];

    res.json({
      totalUsers,
      totalStudents,
      activeCourses,
      userMonthlyTrend,
      studentScores,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin overview', details: error.message });
  }
};