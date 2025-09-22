const express = require('express');
const router = express.Router();
const { generateCourse, getCourses, getCourseById, saveCourse, deleteCourse, shareCourse } = require('../controllers/youtubecourseController');
const protect = require('../middleware/auth');

router.get('/', protect, getCourses);
router.get('/:courseId', protect, getCourseById);
router.post('/generate', protect, generateCourse);
router.post('/save', protect, saveCourse);
router.delete('/:courseId', protect, deleteCourse);
router.post('/:courseId/share', protect, shareCourse);

module.exports = router;