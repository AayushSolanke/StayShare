import mongoose from 'mongoose';

const roommateReviewSchema = new mongoose.Schema(
  {
    roommateRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoommateRequest',
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5'],
    },
    comment: {
      type: String,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      trim: true,
    },
    livedTogetherDuration: {
      type: String,
      maxlength: [120, 'Duration description cannot exceed 120 characters'],
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

roommateReviewSchema.index({ roommateRequest: 1, createdAt: -1 });
roommateReviewSchema.index({ roommateRequest: 1, reviewer: 1 }, { unique: true });

export default mongoose.model('RoommateReview', roommateReviewSchema);
