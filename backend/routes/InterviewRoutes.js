// This file is deprecated and should be deleted.
// All interview routes are now handled by VivaRoutes.js.
const {
  generateInterview,
  getInterview,
  getUserInterviews,
  deleteInterview,
  submitAnswer,
  getInterviewFeedback
} = require('../controllers/InterviewController');
const auth = require('../middleware/auth');
const { validateInterviewGeneration, validateAnswerSubmission } = require('../middleware/validateInterview');

// All routes require authentication
router.use(auth);

// Generate new interview
router.post('/generate', validateInterviewGeneration, generateInterview);

// Get user's interviews
router.get('/user', getUserInterviews);

// Get specific interview by mockId
router.get('/:mockId', getInterview);

// Delete interview
router.delete('/:mockId', deleteInterview);

// Submit answer for a question
router.post('/:mockId/submit', validateAnswerSubmission, submitAnswer);

// Get interview feedback
router.get('/:mockId/feedback', getInterviewFeedback);


module.exports = router;
