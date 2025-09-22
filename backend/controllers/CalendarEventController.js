const CalendarEvent = require('../models/CalendarEvent');

// Get all events for a user (optionally filter by date)
exports.getEvents = async (req, res) => {
  try {
    const { date } = req.query;
    const query = { createdBy: req.user._id };
    if (date) query.date = date;
    const events = await CalendarEvent.find(query).sort({ date: 1 });
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add a new event
exports.addEvent = async (req, res) => {
  try {
    const { text, type, date, done } = req.body;
    const event = new CalendarEvent({
      text,
      type,
      date,
      done: !!done,
      createdBy: req.user._id,
    });
    await event.save();
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await CalendarEvent.deleteOne({ _id: id, createdBy: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
