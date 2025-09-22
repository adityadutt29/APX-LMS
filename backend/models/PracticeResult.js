const mongoose = require('mongoose');

const PracticeResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  quizType: {
    type: String,
    enum: ['mcq', 'qa'],
    required: true,
  },
  extractedText: {
    type: String,
    required: true,
  },
  questions: [{
    id: {
      type: Number,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    options: [{
      type: String
    }], // For MCQ only
    correctAnswer: String, // For MCQ only
    type: {
      type: String,
      enum: ['mcq', 'qa'],
      required: true
    },
    maxMarks: Number, // For Q&A only
  }],
  userAnswers: [{
    question: {
      type: String,
      required: true
    },
    userAnswer: {
      type: String,
      required: true
    },
    correctAnswer: String, // For MCQ
    isCorrect: Boolean, // For MCQ
    score: Number, // For Q&A
    maxMarks: Number, // For Q&A
    feedback: String, // For Q&A
  }],
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  maxScore: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for efficient user queries
PracticeResultSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('PracticeResult', PracticeResultSchema);
