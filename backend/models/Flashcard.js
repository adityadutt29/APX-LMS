const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
flashcardSchema.index({ userId: 1 });
flashcardSchema.index({ front: 'text', back: 'text' });

const Flashcard = mongoose.model('Flashcard', flashcardSchema);

module.exports = Flashcard;
