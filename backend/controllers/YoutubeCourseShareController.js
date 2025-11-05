const ProgressStore = require('../models/ProgressStore');
const YoutubeCourseShare = require('../models/YoutubeCourseShare');
const YoutubeCourse = require('../models/youtubeCourse');
const User = require('../models/Users');

// Get completed chapters for a course for the logged-in student
exports.getChapterProgress = async (req, res) => {
  try {
    const studentId = req.user._id;
    const courseId = req.params.courseId;
    let progress = await ProgressStore.findOne({ student: studentId, course: courseId });
    if (!progress) progress = { completedChapters: [] };
    res.json({ completedChapters: progress.completedChapters || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress', details: error.message });
  }
};

// Mark a chapter as completed for a student
exports.completeChapter = async (req, res) => {
  try {
    const studentId = req.user._id;
    const courseId = req.params.courseId;
    const { chapterIdx } = req.body;
    let progress = await ProgressStore.findOne({ student: studentId, course: courseId });
    if (!progress) {
      progress = new ProgressStore({ student: studentId, course: courseId, completedChapters: [chapterIdx] });
    } else {
      if (!progress.completedChapters.includes(chapterIdx)) {
        progress.completedChapters.push(chapterIdx);
      }
    }
    await progress.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress', details: error.message });
  }
};

// Share a course to selected students
exports.shareCourseToStudents = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const { students } = req.body;
    let teacherId = req.user._id;

    // Defensive checks
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'No students selected for sharing.' });
    }

    const course = await YoutubeCourse.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // If admin, use course.createdBy as sharedBy, else use req.user._id
    if (req.user.role === 'admin') {
      teacherId = course.createdBy;
      if (!teacherId) {
        return res.status(400).json({ error: 'Course does not have a creator (createdBy) field.' });
      }
    } else {
      // Only allow sharing if user is creator
      if (!course.createdBy || course.createdBy.toString() !== teacherId.toString()) {
        return res.status(403).json({ error: 'You are not authorized to share this course.' });
      }
    }

    // Validate student IDs and role
    for (const studentId of students) {
      if (!studentId) {
        return res.status(400).json({ error: 'Invalid student ID provided.' });
      }
      const student = await User.findById(studentId);
      if (!student || student.role !== 'student') {
        return res.status(400).json({ error: `Invalid student ID or not a student: ${studentId}` });
      }
    }

    // Share to each student (avoid duplicates)
    for (const studentId of students) {
      const exists = await YoutubeCourseShare.findOne({ course: courseId, student: studentId });
      if (!exists) {
        await YoutubeCourseShare.create({
          course: courseId,
          student: studentId,
          sharedBy: teacherId
        });
      }
    }
    res.json({ success: true, message: 'Course shared successfully' });
  } catch (error) {
    console.error('Error in shareCourseToStudents:', error);
    res.status(500).json({ error: 'Failed to share course', details: error.message });
  }
};

// Get all courses shared to a student
exports.getSharedCoursesForStudent = async (req, res) => {
  try {
    const studentId = req.user._id;
    const shares = await YoutubeCourseShare.find({ student: studentId })
      .populate({
        path: 'course',
        populate: { path: 'createdBy', select: 'username email' }
      });
    
    // Filter out shares where course is null (deleted courses)
    const courses = shares
      .filter(share => share.course != null)
      .map(share => share.course);
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching shared courses:', error);
    res.status(500).json({ error: 'Failed to fetch shared courses', details: error.message });
  }
};

// Export all controllers
module.exports = exports;