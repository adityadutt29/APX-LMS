const mongoose = require('mongoose');

const UserAnswerSchema = new mongoose.Schema({
  mockIdRef: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  correctAns: {
    type: String
  },
  userAns: {
    type: String
  },
  feedback: {
    type: String
  },
  rating: {
    type: String
  },
  userEmail: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UserAnswer', UserAnswerSchema);
