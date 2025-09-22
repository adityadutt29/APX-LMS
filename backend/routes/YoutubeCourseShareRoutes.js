const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { shareCourseToStudents, getSharedCoursesForStudent, getChapterProgress, completeChapter } = require('../controllers/YoutubeCourseShareController');

// Teacher shares course to students
router.post('/:courseId/share', protect, shareCourseToStudents);

// Student fetches courses shared to them
router.get('/my', protect, getSharedCoursesForStudent);

// Student gets chapter progress for a course
router.get('/progress/:courseId', protect, getChapterProgress);

// Student marks chapter as completed
router.post('/progress/:courseId', protect, completeChapter);

module.exports = router;
