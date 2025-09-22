const express = require('express');
const router = express.Router();
const CalendarEventController = require('../controllers/CalendarEventController');
const auth = require('../middleware/auth');

// Get all events (optionally filter by date)
router.get('/', auth, CalendarEventController.getEvents);
// Add a new event
router.post('/', auth, CalendarEventController.addEvent);
// Delete an event
router.delete('/:id', auth, CalendarEventController.deleteEvent);

module.exports = router;
