const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const {
  analyzeStudentPerformance,
  getAllStudentRecommendations,
  generateAndAssignCourse,
} = require("../controllers/CourseRecommendationController");

// @desc    Get performance analysis and recommendations for a specific student
// @route   GET /api/course-recommendations/analyze/:studentId
// @access  Private (Teacher only)
router.get("/analyze/:studentId", protect, analyzeStudentPerformance);

// @desc    Get course recommendations for all students
// @route   GET /api/course-recommendations/all
// @access  Private (Teacher only)
router.get("/all", protect, getAllStudentRecommendations);

// @desc    Generate and assign a personalized course to a student
// @route   POST /api/course-recommendations/generate-and-assign
// @access  Private (Teacher only)
router.post("/generate-and-assign", protect, generateAndAssignCourse);

module.exports = router;
