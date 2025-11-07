import express from 'express';
import { body } from 'express-validator';
import {
  getRoommateRequests,
  getRoommateRequest,
  createRoommateRequest,
  updateRoommateRequest,
  deleteRoommateRequest,
  getMyRoommateRequests
} from '../controllers/roommateController.js';
import {
  getRoommateReviews,
  createRoommateReview,
  updateRoommateReview,
  deleteRoommateReview,
} from '../controllers/roommateReviewController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const roommateRequestValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('bio')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Bio must be between 10 and 1000 characters'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),
  body('budget.min')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Minimum budget must be a positive number'),
  body('budget.max')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Maximum budget must be a positive number'),
  body('roomType')
    .isIn(['Private Room', 'Shared Room', 'Studio', 'Entire Place'])
    .withMessage('Invalid room type'),
  body('moveInDate')
    .isISO8601()
    .withMessage('Please provide a valid move-in date'),
  body('lifestyle.cleanliness')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Cleanliness level must be between 1 and 5'),
  body('lifestyle.socialLevel')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Social level must be between 1 and 5'),
  body('contactPreference')
    .optional()
    .isIn(['email', 'phone', 'both'])
    .withMessage('Invalid contact preference')
];

// Custom validation for budget range
const validateBudgetRange = (req, res, next) => {
  const { budget } = req.body;
  if (budget && budget.min >= budget.max) {
    return res.status(400).json({
      success: false,
      message: 'Maximum budget must be greater than minimum budget'
    });
  }
  next();
};

// Routes
router.get('/', optionalAuth, getRoommateRequests);
router.get('/my-requests', protect, getMyRoommateRequests);
router.get('/:id', getRoommateRequest);
router.post('/', protect, roommateRequestValidation, handleValidationErrors, validateBudgetRange, createRoommateRequest);
router.put('/:id', protect, updateRoommateRequest);
router.delete('/:id', protect, deleteRoommateRequest);

// Roommate reviews
const roommateReviewCreateValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  body('livedTogetherDuration')
    .optional()
    .isLength({ max: 120 })
    .withMessage('Duration cannot exceed 120 characters'),
];

const roommateReviewUpdateValidation = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  body('livedTogetherDuration')
    .optional()
    .isLength({ max: 120 })
    .withMessage('Duration cannot exceed 120 characters'),
];

router.get('/:id/reviews', getRoommateReviews);
router.post(
  '/:id/reviews',
  protect,
  roommateReviewCreateValidation,
  handleValidationErrors,
  createRoommateReview,
);
router.put(
  '/:id/reviews/:reviewId',
  protect,
  roommateReviewUpdateValidation,
  handleValidationErrors,
  updateRoommateReview,
);
router.delete('/:id/reviews/:reviewId', protect, deleteRoommateReview);

export default router;