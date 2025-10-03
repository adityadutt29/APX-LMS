const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  front: {
    type: String,
    required: true,
    trim: true
  },
  back: {
    type: String,
    required: true,
    trim: true
  },
  // Optional grouping fields so generated flashcards can be associated with a study pack
  packName: {
    type: String,
    default: null,
    trim: true
  },
  sessionId: {
    type: String,
    default: null,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
flashcardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Flashcard', flashcardSchema);
