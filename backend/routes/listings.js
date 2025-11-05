import express from 'express';
import { body } from 'express-validator';
import {
  getListings,
  getListing,
  getMyListings,
  createListing,
  updateListing,
  updateListingStatus,
  deleteListing
} from '../controllers/listingController.js';
import { getReviewsForListing, createReview, updateReview, deleteReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const listingValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),
  body('price')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('bedrooms')
    .isInt({ min: 1 })
    .withMessage('Bedrooms must be at least 1'),
  body('bathrooms')
    .isInt({ min: 1 })
    .withMessage('Bathrooms must be at least 1'),
  body('roommates.max')
    .isInt({ min: 1 })
    .withMessage('Maximum roommates must be at least 1'),
  body('images')
    .isArray({ min: 1 })
    .withMessage('At least one image is required'),
  body('roomType')
    .isIn(['Private Room', 'Shared Room', 'Studio', 'Entire Place'])
    .withMessage('Invalid room type'),
  body('availableFrom')
    .isISO8601()
    .withMessage('Please provide a valid available from date')
];

// Routes
router.get('/', getListings);
router.get('/owner/me', protect, getMyListings);
router.get('/:id', getListing);
router.post('/', protect, listingValidation, handleValidationErrors, createListing);
router.patch('/:id/status', protect, updateListingStatus);
router.put('/:id', protect, updateListing);
router.delete('/:id', protect, deleteListing);

// Reviews nested routes
router.get('/:id/reviews', getReviewsForListing);
router.post('/:id/reviews', protect, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 1000 }).withMessage('Comment too long')
], handleValidationErrors, createReview);
router.put('/:id/reviews/:reviewId', protect, [
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('comment').optional().isLength({ max: 1000 })
], handleValidationErrors, updateReview);
router.delete('/:id/reviews/:reviewId', protect, deleteReview);

export default router;