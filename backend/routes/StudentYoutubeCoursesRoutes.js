const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const YoutubeCourse = require('../models/youtubeCourse');

// Get all YouTube courses shared by teachers (for students)
router.get('/', protect, async (req, res) => {
  try {
    // Optionally, filter by courses assigned to the student's classroom
    // For now, return all shared courses
    const courses = await YoutubeCourse.find().populate('createdBy', 'username');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch YouTube courses' });
  }
});

module.exports = router;
