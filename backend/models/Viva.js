const mongoose = require('mongoose');

const VivaSchema = new mongoose.Schema({
  mockId: {
    type: String,
    required: true,
    unique: true
  },
  subject: {
    type: String,
    required: true
  },
  topics: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: true
  },
  jsonMockResp: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Viva', VivaSchema);