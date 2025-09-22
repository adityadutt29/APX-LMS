const mongoose = require('mongoose');

const ProgressStoreSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'youtubeCourse',
    required: true
  },
  completedChapters: [{
    type: Number
  }]
});

module.exports = mongoose.model('ProgressStore', ProgressStoreSchema);
