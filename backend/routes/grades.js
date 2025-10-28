const express = require('express');
const router = express.Router();
const { getAllGrades, getStudentGrades } = require('../controllers/GradesController');
const protect = require('../middleware/auth');

// @route   GET /api/grades/all
// @desc    Get all grades for teacher dashboard
// @access  Private (Teacher)
router.get('/all', protect, getAllGrades);

// @route   GET /api/grades/student/:studentId
// @desc    Get grades for specific student
// @access  Private (Teacher)
router.get('/student/:studentId', protect, getStudentGrades);

module.exports = router;