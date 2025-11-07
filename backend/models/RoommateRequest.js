import mongoose from 'mongoose';

const roommateRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  bio: {
    type: String,
    required: [true, 'Bio is required'],
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  preferredAreas: [{
    type: String,
    trim: true
  }],
  budget: {
    min: {
      type: Number,
      required: [true, 'Minimum budget is required'],
      min: [0, 'Budget must be positive']
    },
    max: {
      type: Number,
      required: [true, 'Maximum budget is required'],
      min: [0, 'Budget must be positive']
    }
  },
  roomType: {
    type: String,
    required: [true, 'Room type is required'],
    enum: ['Private Room', 'Shared Room', 'Studio', 'Entire Place']
  },
  moveInDate: {
    type: Date,
    required: [true, 'Move-in date is required']
  },
  lifestyle: {
    cleanliness: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    socialLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    smoking: {
      type: Boolean,
      default: false
    },
    pets: {
      type: Boolean,
      default: false
    },
    workSchedule: {
      type: String,
      enum: ['9-5', 'flexible', 'night-shift', 'student', 'other'],
      default: '9-5'
    },
    sleepSchedule: {
      type: String,
      enum: ['early-bird', 'night-owl', 'flexible'],
      default: 'flexible'
    }
  },
  interests: [{
    type: String,
    trim: true
  }],
  idealRoommate: {
    type: String,
    maxlength: [500, 'Ideal roommate description cannot exceed 500 characters']
  },
  dealBreakers: {
    type: String,
    maxlength: [500, 'Deal breakers description cannot exceed 500 characters']
  },
  contactPreference: {
    type: String,
    enum: ['email', 'phone', 'both'],
    default: 'both'
  },
  profileImage: {
    type: String, // URL to profile image
    default: ''
  },
  // Optional metrics for UI display
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: null
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  responseRate: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  lastActive: {
    type: Date,
    default: null
  },
  verifications: {
    email: { type: Boolean, default: false },
    phone: { type: Boolean, default: false },
    id: { type: Boolean, default: false },
    workEmail: { type: Boolean, default: false }
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
roommateRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validate budget range
roommateRequestSchema.pre('save', function(next) {
  if (this.budget.min >= this.budget.max) {
    next(new Error('Maximum budget must be greater than minimum budget'));
  }
  next();
});

// Index for search functionality
roommateRequestSchema.index({ location: 'text', preferredAreas: 'text', title: 'text' });
roommateRequestSchema.index({ 'budget.min': 1, 'budget.max': 1 });
roommateRequestSchema.index({ moveInDate: 1 });
roommateRequestSchema.index({ isActive: 1 });
roommateRequestSchema.index({ user: 1 });

export default mongoose.model('RoommateRequest', roommateRequestSchema);