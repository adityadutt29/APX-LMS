const mongoose = require('mongoose');

const mindmapSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  // Optional structured representation (new)
  nodes: [{
    id: { type: String },
    label: { type: String },
    parentId: { type: String },
    // Allow arbitrary extra attributes (ensure nested description retained)
    data: {
      type: Object,
      default: {}
    }
  }],
  connections: [{
    source: { type: String },
    target: { type: String },
    label: { type: String }
  }],
  title: {
    type: String,
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
mindmapSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Mindmap', mindmapSchema);
