const express = require('express');
const {
  createCourse,
  getTeacherCourses,
  getStudentCourses,
  getStudentCoursesWithAssignments,
  joinCourse,
  getCourse,
  updateCourse,
  deleteCourse,
  createAnnouncement,
  createAssignment,
  getAnnouncements,
  getAssignments,
  submitAssignment,
  getSubmissionStatus,
  gradeSubmission,
  getTeacherStats,
} = require('../controllers/CourseController');
const auth = require('../middleware/auth');

const router = express.Router();

// Course management routes
router.post('/', auth, createCourse);
router.get('/teacher', auth, getTeacherCourses);
router.get('/student', auth, getStudentCourses);
router.get('/student/full', auth, getStudentCoursesWithAssignments);
router.get('/teacher-stats', auth, getTeacherStats);
router.post('/join', auth, joinCourse);
router.get('/:id', auth, getCourse);
router.put('/:id', auth, updateCourse);
router.delete('/:id', auth, deleteCourse);

// Announcement routes
router.post('/:id/announcements', auth, createAnnouncement);
router.get('/:id/announcements', auth, getAnnouncements);

// Assignment routes
router.post('/:id/assignments', auth, createAssignment);
router.get('/:id/assignments', auth, getAssignments);

// Submission routes
router.post('/:courseId/assignments/:assignmentId/submit', auth, submitAssignment);
router.get('/:courseId/assignments/:assignmentId/submission', auth, getSubmissionStatus);
router.put('/:courseId/assignments/:assignmentId/submissions/:submissionId/grade', auth, gradeSubmission);

module.exports = router;
