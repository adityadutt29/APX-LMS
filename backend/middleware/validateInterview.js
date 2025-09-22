const { body, validationResult } = require('express-validator');

const validateInterviewGeneration = [
  body('jobPosition')
    .trim()
    .notEmpty()
    .withMessage('Job position is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Job position must be between 2 and 100 characters'),
    
  body('jobDesc')
    .trim()
    .notEmpty()
    .withMessage('Job description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Job description must be between 10 and 1000 characters'),
    
  body('jobExp')
    .trim()
    .notEmpty()
    .withMessage('Years of experience is required')
    .isNumeric()
    .withMessage('Years of experience must be a number')
    .isInt({ min: 0, max: 50 })
    .withMessage('Years of experience must be between 0 and 50'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

const validateAnswerSubmission = [
  body('question')
    .trim()
    .notEmpty()
    .withMessage('Question is required'),
    
  body('correctAns')
    .trim()
    .notEmpty()
    .withMessage('Correct answer is required'),
    
  body('userAns')
    .trim()
    .notEmpty()
    .withMessage('User answer is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Answer must be between 10 and 5000 characters'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateInterviewGeneration,
  validateAnswerSubmission
};
