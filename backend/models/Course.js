const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  courseCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  section: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  semester: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
    default: new Date().getFullYear(),
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  assignments: [{
    title: String,
    description: String,
    dueDate: Date,
    points: Number,
    attachments: [{
      originalName: { type: String, default: '' },
      filename: { type: String, default: '' },
      mimetype: { type: String, default: '' },
      size: { type: Number, default: 0 },
      url: { type: String, default: '' }
    }],
    submissions: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      submittedAt: {
        type: Date,
        default: Date.now
      },
      attachments: [{
        type: String
      }],
      comment: String,
      grade: {
        type: Number,
        min: 0
      },
      feedback: String,
      status: {
        type: String,
        enum: ['submitted', 'graded', 'returned'],
        default: 'submitted'
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  announcements: [{
    title: String,
    content: String,
    attachments: [{
      originalName: { type: String, default: '' },
      filename: { type: String, default: '' },
      mimetype: { type: String, default: '' },
      size: { type: Number, default: 0 },
      url: { type: String, default: '' }
    }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  materials: [{
    title: String,
    description: String,
    fileUrl: String,
    type: {
      type: String,
      enum: ['document', 'video', 'link', 'image'],
      default: 'document',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  schedule: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    }],
    time: String,
    room: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  joinCode: {
    type: String,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Generate unique join code before saving
CourseSchema.pre('save', async function(next) {
  if (!this.joinCode) {
    let joinCode;
    let isUnique = false;
    
    // Generate unique join code
    while (!isUnique) {
      joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingCourse = await this.constructor.findOne({ joinCode });
      if (!existingCourse) {
        isUnique = true;
      }
    }
    
    this.joinCode = joinCode;
  }
  next();
});

module.exports = mongoose.model('Course', CourseSchema);
