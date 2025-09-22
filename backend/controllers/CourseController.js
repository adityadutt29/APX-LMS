const Course = require('../models/Course');
const User = require('../models/Users');
const mongoose = require('mongoose');

// @desc    Create a new course
// @route   POST /api/courses
// @access  Teacher only
const createCourse = async (req, res) => {
  try {
    const { title, description, subject, courseCode, section, semester, year, schedule } = req.body;
    const teacherId = req.user.id;

    // Validate required fields
    if (!title || !description || !subject || !courseCode || !section) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: title, description, subject, courseCode, section' 
      });
    }

    // Check if user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create courses' });
    }

    // Check if course code already exists for this teacher and section
    const existingCourse = await Course.findOne({ 
      courseCode: courseCode.toUpperCase(),
      section: section.toUpperCase(),
      teacher: teacherId,
      isActive: true
    });
    if (existingCourse) {
      return res.status(400).json({ 
        message: `Course code ${courseCode.toUpperCase()} already exists for section ${section.toUpperCase()}` 
      });
    }

    const course = new Course({
      title: title.trim(),
      description: description.trim(),
      subject: subject.trim(),
      courseCode: courseCode.toUpperCase().trim(),
      section: section.toUpperCase().trim(),
      semester: semester || 'FALL',
      year: year || new Date().getFullYear(),
      teacher: teacherId,
      schedule: schedule || {
        days: [],
        time: '',
        room: ''
      },
      students: [],
      assignments: [],
      announcements: [],
      materials: []
    });

    await course.save();
    await course.populate('teacher', 'name email employeeId department');

    res.status(201).json({
      success: true,
      data: course,
      message: `Course "${course.title}" created successfully with join code: ${course.joinCode}`
    });
  } catch (error) {
    console.error('Create course error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Course with this code and section combination already exists' 
      });
    }
    res.status(500).json({ message: 'Server error while creating course' });
  }
};

// @desc    Get all courses for a teacher
// @route   GET /api/courses/teacher
// @access  Teacher only
const getTeacherCourses = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Verify user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teacher role required.' });
    }

    const courses = await Course.find({ teacher: teacherId, isActive: true })
      .populate('teacher', 'name email employeeId department')
      .populate('students', 'name email studentId section')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: courses,
      count: courses.length
    });
  } catch (error) {
    console.error('Get teacher courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all courses for a student
// @route   GET /api/courses/student
// @access  Student only
const getStudentCourses = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Verify user is a student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Student role required.' });
    }

    const courses = await Course.find({ 
      students: studentId, 
      isActive: true 
    })
      .populate('teacher', 'name email employeeId department')
      .populate('students', 'name email studentId section')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: courses,
      count: courses.length,
      studentInfo: {
        section: student.section,
        department: student.department
      }
    });
  } catch (error) {
    console.error('Get student courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Join a course using join code
// @route   POST /api/courses/join
// @access  Student only
const joinCourse = async (req, res) => {
  try {
    const { joinCode } = req.body;
    const studentId = req.user.id;

    // Verify user is a student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can join courses' });
    }

    // Find course by join code
    const course = await Course.findOne({ joinCode: joinCode.toUpperCase(), isActive: true });
    if (!course) {
      return res.status(404).json({ message: 'Invalid join code or course not found' });
    }

    // Check if student is already enrolled
    if (course.students.includes(studentId)) {
      return res.status(400).json({ message: 'You are already enrolled in this course' });
    }

    // Add student to course
    course.students.push(studentId);
    await course.save();

    // Populate course data for response
    await course.populate('teacher', 'name email department');

    res.json({
      success: true,
      message: 'Successfully joined the course',
      data: {
        title: course.title,
        courseCode: course.courseCode,
        section: course.section,
        teacher: course.teacher.name,
        joinCode: course.joinCode
      }
    });
  } catch (error) {
    console.error('Join course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single course details
// @route   GET /api/courses/:id
// @access  Teacher/Student (enrolled)
const getCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;

    // Validate course ID
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }

    let course = await Course.findById(courseId)
      .populate('teacher', 'name email employeeId department')
      .populate('students', 'name email studentId section department');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user has access to this course
    const isTeacher = course.teacher._id.toString() === userId;
    const isEnrolledStudent = course.students.some(student => student._id.toString() === userId);

    if (!isTeacher && !isEnrolledStudent) {
      return res.status(403).json({ message: 'Access denied to this course' });
    }

    // Manually populate student data in assignment submissions for teachers
    if (isTeacher && course.assignments) {
      for (let assignment of course.assignments) {
        if (assignment.submissions && assignment.submissions.length > 0) {
          for (let submission of assignment.submissions) {
            const student = course.students.find(s => s._id.toString() === submission.student.toString());
            if (student) {
              submission.student = {
                _id: student._id,
                name: student.name,
                email: student.email,
                studentId: student.studentId
              };
            }
          }
        }
      }
    }

    res.json({
      success: true,
      data: course,
      userRole: isTeacher ? 'teacher' : 'student'
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Teacher only (course owner)
const updateCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const teacherId = req.user.id;
    const { title, description, subject, section, semester, year, schedule } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the teacher of this course
    if (course.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Access denied. Only course teacher can update.' });
    }

    // Update course fields
    course.title = title || course.title;
    course.description = description || course.description;
    course.subject = subject || course.subject;
    course.section = section ? section.toUpperCase() : course.section;
    course.semester = semester || course.semester;
    course.year = year || course.year;
    course.schedule = schedule || course.schedule;

    await course.save();
    await course.populate('teacher', 'name email employeeId department');

    res.json({
      success: true,
      data: course,
      message: 'Course updated successfully'
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Teacher only (course owner)
const deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const teacherId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the teacher of this course
    if (course.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    course.isActive = false;
    await course.save();

    res.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create announcement
// @route   POST /api/courses/:id/announcements
// @access  Teacher only
const createAnnouncement = async (req, res) => {
  try {
    const courseId = req.params.id;
    const teacherId = req.user.id;
    const { title, content, attachments } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the teacher of this course
    if (course.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Access denied. Only course teacher can create announcements.' });
    }

    // Process attachments to ensure correct format
    const processedAttachments = (attachments || []).map(attachment => {
      // If it's already an object with the correct structure, use it
      if (typeof attachment === 'object' && attachment.originalName) {
        return attachment;
      }
      // If it's a string (old format), convert to new format
      if (typeof attachment === 'string') {
        return {
          originalName: attachment,
          filename: attachment,
          mimetype: '',
          size: 0,
          url: `/api/files/${attachment}`
        };
      }
      // Default fallback
      return {
        originalName: 'Unknown file',
        filename: 'unknown',
        mimetype: '',
        size: 0,
        url: ''
      };
    });

    const announcement = {
      title,
      content,
      attachments: processedAttachments,
      createdAt: new Date()
    };

    course.announcements.push(announcement);
    await course.save();

    // Send real-time notifications to all students in the course
    try {
      const { sendAnnouncementNotification } = require('./NotificationController');
      const notifications = await sendAnnouncementNotification(courseId, teacherId, {
        _id: announcement._id,
        title: announcement.title,
        content: announcement.content
      });

      // Send real-time WebSocket notifications
      if (global.notificationWS && notifications) {
        notifications.forEach(notification => {
          global.notificationWS.sendToUser(notification.recipient.toString(), notification);
        });
      }
    } catch (notificationError) {
      console.error('Error sending announcement notifications:', notificationError);
      // Don't fail the announcement creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get announcements
// @route   GET /api/courses/:id/announcements
// @access  Teacher/Student (enrolled)
const getAnnouncements = async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user has access to this course
    const isTeacher = course.teacher.toString() === userId;
    const isEnrolledStudent = course.students.includes(userId);

    if (!isTeacher && !isEnrolledStudent) {
      return res.status(403).json({ message: 'Access denied to this course' });
    }

    res.json({
      success: true,
      data: course.announcements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create assignment
// @route   POST /api/courses/:id/assignments
// @access  Teacher only
const createAssignment = async (req, res) => {
  try {
    const courseId = req.params.id;
    const teacherId = req.user.id;
    const { title, description, dueDate, points, attachments } = req.body;

    if (!title || !description || !dueDate) {
      return res.status(400).json({ message: 'Title, description, and due date are required' });
    }

    // Validate due date is not in the past
    const dueDateObj = new Date(dueDate);
    const now = new Date();
    if (dueDateObj < now) {
      return res.status(400).json({ message: 'Due date cannot be in the past' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the teacher of this course
    if (course.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Access denied. Only course teacher can create assignments.' });
    }

    // Process attachments to ensure correct format
    const processedAttachments = (attachments || []).map(attachment => {
      // If it's already an object with the correct structure, use it
      if (typeof attachment === 'object' && attachment.originalName) {
        return attachment;
      }
      // If it's a string (old format), convert to new format
      if (typeof attachment === 'string') {
        return {
          originalName: attachment,
          filename: attachment,
          mimetype: '',
          size: 0,
          url: `/api/files/${attachment}`
        };
      }
      // Default fallback
      return {
        originalName: 'Unknown file',
        filename: 'unknown',
        mimetype: '',
        size: 0,
        url: ''
      };
    });

    const assignment = {
      title,
      description,
      dueDate: dueDateObj,
      points: points || 100,
      attachments: processedAttachments,
      createdAt: new Date()
    };

    course.assignments.push(assignment);
    await course.save();

    // Send real-time notifications to all students in the course
    try {
      const { sendAssignmentNotification } = require('./NotificationController');
      const notifications = await sendAssignmentNotification(courseId, teacherId, {
        _id: assignment._id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        points: assignment.points
      });

      // Send real-time WebSocket notifications
      if (global.notificationWS && notifications) {
        notifications.forEach(notification => {
          global.notificationWS.sendToUser(notification.recipient.toString(), notification);
        });
      }
    } catch (notificationError) {
      console.error('Error sending assignment notifications:', notificationError);
      // Don't fail the assignment creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get assignments
// @route   GET /api/courses/:id/assignments
// @access  Teacher/Student (enrolled)
const getAssignments = async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user has access to this course
    const isTeacher = course.teacher.toString() === userId;
    const isEnrolledStudent = course.students.includes(userId);

    if (!isTeacher && !isEnrolledStudent) {
      return res.status(403).json({ message: 'Access denied to this course' });
    }

    res.json({
      success: true,
      data: course.assignments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Submit assignment
// @route   POST /api/courses/:courseId/assignments/:assignmentId/submit
// @access  Student only
const submitAssignment = async (req, res) => {
  try {
    const { courseId, assignmentId } = req.params;
    const studentId = req.user.id;
    const { attachments, comment } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if student is enrolled in this course
    if (!course.students.includes(studentId)) {
      return res.status(403).json({ message: 'Access denied. You are not enrolled in this course.' });
    }

    // Find the assignment
    const assignment = course.assignments.id(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if assignment is still accepting submissions
    if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
      return res.status(400).json({ message: 'Assignment due date has passed' });
    }

    // Check if student has already submitted
    const existingSubmission = assignment.submissions.find(sub => sub.student.toString() === studentId);
    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this assignment' });
    }

    // Create submission
    const submission = {
      student: studentId,
      attachments: attachments || [],
      comment: comment || '',
      submittedAt: new Date()
    };

    assignment.submissions.push(submission);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: submission
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get assignment submission status
// @route   GET /api/courses/:courseId/assignments/:assignmentId/submission
// @access  Student only
const getSubmissionStatus = async (req, res) => {
  try {
    const { courseId, assignmentId } = req.params;
    const studentId = req.user.id;

    const course = await Course.findById(courseId)
      .populate('students', 'name email studentId');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if student is enrolled in this course
    if (!course.students.some(student => student._id.toString() === studentId)) {
      return res.status(403).json({ message: 'Access denied. You are not enrolled in this course.' });
    }

    // Find the assignment
    const assignment = course.assignments.id(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Find student's submission
    const submission = assignment.submissions.find(sub => sub.student.toString() === studentId);

    res.json({
      success: true,
      data: {
        assignment: {
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          points: assignment.points,
          attachments: assignment.attachments
        },
        submission: submission || null,
        isOverdue: assignment.dueDate && new Date() > new Date(assignment.dueDate),
        canSubmit: !submission && (!assignment.dueDate || new Date() <= new Date(assignment.dueDate))
      }
    });
  } catch (error) {
    console.error('Get submission status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Grade assignment submission
// @route   PUT /api/courses/:courseId/assignments/:assignmentId/submissions/:submissionId/grade
// @access  Teacher only
const gradeSubmission = async (req, res) => {
  try {
    const { courseId, assignmentId, submissionId } = req.params;
    const teacherId = req.user.id;
    const { grade, feedback } = req.body;

    if (grade < 0) {
      return res.status(400).json({ message: 'Grade cannot be negative' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the teacher of this course
    if (course.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Access denied. Only course teacher can grade assignments.' });
    }

    // Find the assignment
    const assignment = course.assignments.id(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Find the submission
    const submission = assignment.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Update submission with grade and feedback
    submission.grade = grade;
    submission.feedback = feedback;
    submission.status = 'graded';

    await course.save();

    // Send real-time notification to the student
    try {
      const { sendGradeNotification } = require('./NotificationController');
      const notification = await sendGradeNotification(
        submission.student,
        teacherId,
        courseId,
        {
          _id: assignment._id,
          title: assignment.title,
          points: assignment.points
        },
        grade
      );

      // Send real-time WebSocket notification
      if (global.notificationWS && notification) {
        global.notificationWS.sendToUser(notification.recipient.toString(), notification);
      }
    } catch (notificationError) {
      console.error('Error sending grade notification:', notificationError);
      // Don't fail the grading if notification fails
    }

    res.json({
      success: true,
      message: 'Assignment graded successfully',
      data: submission
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get teacher statistics
// @route   GET /api/courses/teacher-stats
// @access  Teacher only
const getTeacherStats = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Check if user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access teacher statistics' });
    }

    // Get teacher's courses
    const courses = await Course.find({ teacher: teacherId, isActive: true });
    
    // Calculate statistics
    const totalCourses = courses.length;
    let totalStudents = 0;
    let completedCourses = 0;
    
    courses.forEach(course => {
      totalStudents += course.students ? course.students.length : 0;
      // You can add logic here for completed courses based on your requirements
      // For now, we'll consider courses from previous semesters as completed
      const currentYear = new Date().getFullYear();
      if (course.year < currentYear) {
        completedCourses++;
      }
    });

    const stats = {
      totalCourses,
      totalStudents,
      completedCourses,
      averageRating: 4.5 // You can calculate this based on student feedback if available
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get teacher stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all courses for a student with full assignment data
// @route   GET /api/courses/student/full
// @access  Student only
const getStudentCoursesWithAssignments = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Verify user is a student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Student role required.' });
    }

    const courses = await Course.find({ 
      students: studentId, 
      isActive: true 
    })
      .populate('teacher', 'name email employeeId department')
      .populate('students', 'name email studentId section')
      .sort({ createdAt: -1 });

    // Populate student data in assignment submissions manually
    const coursesWithAssignmentData = courses.map(course => {
      const courseObj = course.toObject();
      
      if (courseObj.assignments && courseObj.assignments.length > 0) {
        courseObj.assignments = courseObj.assignments.map(assignment => {
          if (assignment.submissions && assignment.submissions.length > 0) {
            assignment.submissions = assignment.submissions.map(submission => {
              const student = courseObj.students.find(s => s._id.toString() === submission.student.toString());
              if (student) {
                submission.student = student;
              }
              return submission;
            });
          }
          return assignment;
        });
      }
      
      return courseObj;
    });

    res.json({
      success: true,
      data: coursesWithAssignmentData,
      count: coursesWithAssignmentData.length,
      studentInfo: {
        section: student.section,
        department: student.department
      }
    });
  } catch (error) {
    console.error('Get student courses with assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createCourse,
  getTeacherCourses,
  getStudentCourses,
  getStudentCoursesWithAssignments,
  joinCourse,
  getCourse,
  updateCourse,
  deleteCourse,
  createAnnouncement,
  getAnnouncements,
  createAssignment,
  getAssignments,
  submitAssignment,
  getSubmissionStatus,
  gradeSubmission,
  getTeacherStats,
};
