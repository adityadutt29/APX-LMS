const Notification = require('../models/Notification');
const User = require('../models/Users');
const Course = require('../models/Course');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name email role')
      .populate('courseId', 'title courseCode')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalNotifications = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });

    res.json({
      success: true,
      data: notifications,
      pagination: {
        current: page,
        pages: Math.ceil(totalNotifications / limit),
        total: totalNotifications
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications' 
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    ).populate('sender', 'name email role')
      .populate('courseId', 'title courseCode');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark notification as read' 
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });

    res.json({
      success: true,
      unreadCount,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark all notifications as read' 
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete notification' 
    });
  }
};

// @desc    Create notification (internal function)
// @route   Internal use
// @access  Private
const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    
    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'name email role')
      .populate('courseId', 'title courseCode');

    return populatedNotification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

// @desc    Send announcement notification to all course students
// @route   Internal use
// @access  Private
const sendAnnouncementNotification = async (courseId, senderId, announcementData) => {
  try {
    const course = await Course.findById(courseId).populate('students', '_id');
    
    if (!course) {
      throw new Error('Course not found');
    }

    const notifications = [];
    
    // Create notification for each student in the course
    for (const student of course.students) {
      const notificationData = {
        recipient: student._id,
        sender: senderId,
        courseId: courseId,
        type: 'announcement',
        title: `New Announcement: ${announcementData.title}`,
        message: announcementData.content,
        metadata: {
          announcementId: announcementData._id,
          courseTitle: course.title,
          courseCode: course.courseCode
        }
      };

      const notification = await createNotification(notificationData);
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error('Send announcement notification error:', error);
    throw error;
  }
};

// @desc    Send assignment notification to all course students
// @route   Internal use  
// @access  Private
const sendAssignmentNotification = async (courseId, senderId, assignmentData) => {
  try {
    const course = await Course.findById(courseId).populate('students', '_id');
    
    if (!course) {
      throw new Error('Course not found');
    }

    const notifications = [];
    
    // Create notification for each student in the course
    for (const student of course.students) {
      const notificationData = {
        recipient: student._id,
        sender: senderId,
        courseId: courseId,
        type: 'assignment',
        title: `New Assignment: ${assignmentData.title}`,
        message: `Due: ${new Date(assignmentData.dueDate).toLocaleDateString()}`,
        metadata: {
          assignmentId: assignmentData._id,
          courseTitle: course.title,
          courseCode: course.courseCode,
          dueDate: assignmentData.dueDate,
          points: assignmentData.points
        }
      };

      const notification = await createNotification(notificationData);
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error('Send assignment notification error:', error);
    throw error;
  }
};

// @desc    Send grade notification to student
// @route   Internal use
// @access  Private
const sendGradeNotification = async (studentId, teacherId, courseId, assignmentData, grade) => {
  try {
    const course = await Course.findById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }

    const notificationData = {
      recipient: studentId,
      sender: teacherId,
      courseId: courseId,
      type: 'grade',
      title: `Assignment Graded: ${assignmentData.title}`,
      message: `You received ${grade}/${assignmentData.points} points`,
      metadata: {
        assignmentId: assignmentData._id,
        courseTitle: course.title,
        courseCode: course.courseCode,
        grade: grade,
        maxPoints: assignmentData.points,
        percentage: ((grade / assignmentData.points) * 100).toFixed(1)
      }
    };

    const notification = await createNotification(notificationData);
    return notification;
  } catch (error) {
    console.error('Send grade notification error:', error);
    throw error;
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  sendAnnouncementNotification,
  sendAssignmentNotification,
  sendGradeNotification
};
