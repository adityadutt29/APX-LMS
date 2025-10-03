const mongoose = require('mongoose');

const PracticeResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessionId: { // logical grouping id so we can create incomplete then finalize
    type: String,
    index: true
  },
  fileName: {
    type: String,
    required: true,
  },
  quizType: {
    type: String,
    enum: ['mcq', 'qa'],
    required: false,
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
    required: false,
  },
  flashcardCount: {
    type: Number,
    default: 0
  },
  mindmapGenerated: {
    type: Boolean,
    default: false
  },
   summary: { // AI generated structured summary (stored once per session or attempt)
    overview: String,
    keyPoints: [String],
    sections: [{
      title: String,
      summary: String
    }],
    examples: [String],
    studyTips: String,
    insight: String
  },
  notes: { // AI generated detailed chapter-style notes
    title: String,
    introduction: String,
    chapters: [{
      number: Number,
      title: String,
      content: String,
      keyPoints: [String],
      examples: [String]
    }],
    conclusion: String,
    references: [String],
    generatedAt: Date
  },
  status: {
    type: String,
    enum: ['incomplete', 'completed', 'archived'],
    default: 'incomplete',
    index: true
  },
  archivedAt: {
    type: Date
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
