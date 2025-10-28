const PracticeResult = require('../models/PracticeResult');
const User = require('../models/Users');
const Course = require('../models/Course');
const UserAnswer = require('../models/UserAnswer');
const Viva = require('../models/Viva');
const mongoose = require('mongoose');

// @desc    Get all grades for teacher dashboard
// @route   GET /api/grades/all
// @access  Private (Teacher only)
const getAllGrades = async (req, res) => {
  try {
    // Fetch courses for assignment scores
    const courses = await Course.find().lean();
    
    // Fetch practice results (quizzes) with percentage
    const quizScoresRaw = await PracticeResult.find({}, 'user score percentage fileName quizType createdAt');
    
    // Fetch viva feedbacks and vivas
    const vivaFeedbacks = await UserAnswer.find({});
    const vivas = await Viva.find().lean();

    // Extract assignment scores from courses
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

    // Calculate viva scores
    const vivaScores = [];
    vivas.forEach(v => {
      const studentEmail = v.createdBy;
      if (studentEmail) {
        const answers = vivaFeedbacks.filter(ans => 
          ans.mockIdRef === v.mockId && 
          ans.userEmail === studentEmail
        );
        
        if (answers.length > 0) {
          const totalRating = answers.reduce((sum, ans) => {
            const rating = parseFloat(ans.rating) || 0;
            return sum + rating;
          }, 0);
          const averageRating = totalRating / answers.length;
          
          // Convert rating (out of 10) to percentage (out of 100)
          const percentageScore = averageRating * 10;
          
          vivaScores.push({
            studentId: studentEmail,
            subject: v.topics || v.subject || 'Viva',
            score: Math.round(percentageScore * 100) / 100 // Round to 2 decimal places
          });
        }
      }
    });

    // Map quiz scores with percentage
    const quizScores = quizScoresRaw.map(q => ({
      studentId: q.user?.toString(),
      quizName: q.fileName,
      fileName: q.fileName,
      quizType: q.quizType,
      percentage: q.percentage || 0,
      score: q.score || 0,
      createdAt: q.createdAt
    }));

    // Build studentScores object
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
      studentScores[q.studentId].quizzes.push({ 
        quizName: q.quizName, 
        fileName: q.fileName,
        quizType: q.quizType,
        percentage: q.percentage,
        score: q.score,
        createdAt: q.createdAt
      });
    });

    // Fetch user names
    const studentIds = Object.keys(studentScores);
    const objectIds = studentIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
    const emails = studentIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    const users = await User.find({ $or: [{ _id: { $in: objectIds } }, { email: { $in: emails } }] }).lean();
    
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u.name;
      userMap[u.email] = u.name;
    });
    
    studentIds.forEach(id => {
      studentScores[id].name = userMap[id] || id;
      studentScores[id].studentName = userMap[id] || id;
      studentScores[id].student = userMap[id] || id;
    });

    res.json(studentScores);
  } catch (error) {
    console.error('Get all grades error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch grades',
      error: error.message 
    });
  }
};

// @desc    Get grades for a specific student
// @route   GET /api/grades/student/:studentId
// @access  Private (Teacher only)
const getStudentGrades = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const user = await User.findById(studentId).select('name email');
    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const studentData = {
      name: user.name,
      email: user.email,
      assignments: [],
      viva: [],
      quizzes: []
    };
    
    // Fetch practice results (quizzes)
    const practiceResults = await PracticeResult.find({
      user: studentId,
      status: { $ne: 'archived' }
    }).select('fileName quizType percentage score createdAt');
    
    studentData.quizzes = practiceResults.map(result => ({
      quizName: result.fileName || 'Quiz',
      fileName: result.fileName,
      quizType: result.quizType,
      percentage: result.percentage || 0,
      score: result.score || 0,
      createdAt: result.createdAt
    }));
    
    res.json(studentData);
  } catch (error) {
    console.error('Get student grades error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch student grades',
      error: error.message 
    });
  }
};

module.exports = {
  getAllGrades,
  getStudentGrades
};