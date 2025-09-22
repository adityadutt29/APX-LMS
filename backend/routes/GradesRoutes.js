const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const Course = require('../models/Course');
const PracticeResult = require('../models/PracticeResult');
const UserAnswer = require('../models/UserAnswer');
const Viva = require('../models/Viva');
const User = require('../models/Users');
const mongoose = require('mongoose');

// GET /api/grades/all - get all aggregated grades data
router.get('/all', protect, async (req, res) => {
  try {
    const courses = await Course.find().lean();
    const quizScoresRaw = await PracticeResult.find({}, 'user score fileName');
    const vivaFeedbacks = await UserAnswer.find({});
    const vivas = await Viva.find().lean();

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

    const vivaScores = [];
    vivas.forEach(v => {
      const answers = vivaFeedbacks.filter(ans => ans.mockId === v.mockId && ans.studentId === v.createdBy);
      const totalRating = answers.reduce((sum, ans) => sum + (ans.rating || 0), 0);
      const averageScore = answers.length > 0 ? totalRating / answers.length : 0;
      vivaScores.push({
        studentId: v.createdBy,
        subject: v.topics || v.subject,
        score: averageScore
      });
    });

    const quizScores = quizScoresRaw.map(q => ({
      studentId: q.user?.toString(),
      quizName: q.fileName,
      score: q.score
    }));

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
    });

    res.json(studentScores);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

module.exports = router;