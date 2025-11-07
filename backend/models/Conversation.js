import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
    },
    roommateRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoommateRequest',
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    unreadFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  },
);

conversationSchema.pre('validate', function validateContext(next) {
  const hasListing = Boolean(this.listing);
  const hasRoommateRequest = Boolean(this.roommateRequest);

  if (!hasListing && !hasRoommateRequest) {
    next(new Error('Conversation must reference a listing or a roommate request.'));
    return;
  }

  if (hasListing && hasRoommateRequest) {
    next(new Error('Conversation cannot be linked to both a listing and a roommate request.'));
    return;
  }

  next();
});

conversationSchema.index({ participants: 1, listing: 1 });
conversationSchema.index({ participants: 1, roommateRequest: 1 });
conversationSchema.index({ lastActivityAt: -1 });

export default mongoose.model('Conversation', conversationSchema);
