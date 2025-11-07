import mongoose from 'mongoose';
import RoommateReview from '../models/RoommateReview.js';
import RoommateRequest from '../models/RoommateRequest.js';

const recalcRoommateRating = async (roommateRequestId) => {
  const stats = await RoommateReview.aggregate([
    { $match: { roommateRequest: new mongoose.Types.ObjectId(roommateRequestId) } },
    { $group: { _id: '$roommateRequest', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const request = await RoommateRequest.findById(roommateRequestId);
  if (!request) {
    return;
  }

  if (stats.length > 0) {
    request.rating = Number(stats[0].avg.toFixed(2));
    request.reviewCount = stats[0].count;
  } else {
    request.rating = null;
    request.reviewCount = 0;
  }

  await request.save();
};

export const getRoommateReviews = async (req, res) => {
  try {
    const reviews = await RoommateReview.find({ roommateRequest: req.params.id })
      .populate('reviewer', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('getRoommateReviews error:', error);
    res.status(500).json({ success: false, message: 'Unable to load reviews', error: error.message });
  }
};

export const createRoommateReview = async (req, res) => {
  try {
    const { rating, comment, livedTogetherDuration } = req.body;
    const roommateRequestId = req.params.id;

    const request = await RoommateRequest.findById(roommateRequestId).select('user');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Roommate request not found' });
    }

    if (request.user?.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot review your own roommate request' });
    }

    const review = await RoommateReview.create({
      roommateRequest: roommateRequestId,
      reviewer: req.user._id,
      rating,
      comment,
      livedTogetherDuration,
    });

    await recalcRoommateRating(roommateRequestId);
    await review.populate('reviewer', 'name email avatar');

    res.status(201).json({ success: true, message: 'Review added', data: review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this roommate request' });
    }
    console.error('createRoommateReview error:', error);
    res.status(500).json({ success: false, message: 'Unable to add review', error: error.message });
  }
};

export const updateRoommateReview = async (req, res) => {
  try {
    const { id: roommateRequestId, reviewId } = req.params;
    const { rating, comment, livedTogetherDuration } = req.body;

    const review = await RoommateReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.reviewer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this review' });
    }

    if (typeof rating === 'number') {
      review.rating = rating;
    }
    if (typeof comment === 'string') {
      review.comment = comment;
    }
    if (typeof livedTogetherDuration === 'string') {
      review.livedTogetherDuration = livedTogetherDuration;
    }

    await review.save();
    await recalcRoommateRating(roommateRequestId);
    await review.populate('reviewer', 'name email avatar');

    res.json({ success: true, message: 'Review updated', data: review });
  } catch (error) {
    console.error('updateRoommateReview error:', error);
    res.status(500).json({ success: false, message: 'Unable to update review', error: error.message });
  }
};

export const deleteRoommateReview = async (req, res) => {
  try {
    const { id: roommateRequestId, reviewId } = req.params;
    const review = await RoommateReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.reviewer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    await review.deleteOne();
    await recalcRoommateRating(roommateRequestId);

    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error('deleteRoommateReview error:', error);
    res.status(500).json({ success: false, message: 'Unable to delete review', error: error.message });
  }
};
