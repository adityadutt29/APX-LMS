const mongoose = require('mongoose');

const CalendarEventSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['meeting', 'assignment', 'other'], default: 'other' },
  date: { type: String, required: true }, // ISO date string
  done: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('CalendarEvent', CalendarEventSchema);
