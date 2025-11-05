import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';

// @desc    Get all bookings for user
// @route   GET /api/bookings
// @access  Private
export const getUserBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { user: req.user._id };
    
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate({
        path: 'listing',
        select: 'title location price images landlord',
        populate: {
          path: 'landlord',
          select: 'name email phone'
        }
      })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
export const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('listing', 'title location price images landlord')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking or is the landlord
    const listing = await Listing.findById(booking.listing._id);
    const isOwner = booking.user._id.toString() === req.user._id.toString();
    const isLandlord = listing.landlord.toString() === req.user._id.toString();

    if (!isOwner && !isLandlord && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res) => {
  try {
    const {
      listing,
      viewingDate,
      viewingTime,
      moveInDate,
      message,
      phoneNumber
    } = req.body;

    // Check if listing exists
    const listingExists = await Listing.findById(listing);
    if (!listingExists) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check if user is trying to book their own listing
    if (listingExists.landlord.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book your own listing'
      });
    }

    // Check for existing booking for same listing and user
    const existingBooking = await Booking.findOne({
      user: req.user._id,
      listing: listing,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending or confirmed booking for this listing'
      });
    }

    const booking = await Booking.create({
      user: req.user._id,
      listing,
      viewingDate,
      viewingTime,
      moveInDate,
      message,
      phoneNumber
    });

    await booking.populate({
      path: 'listing',
      select: 'title location price images landlord',
      populate: {
        path: 'landlord',
        select: 'name email phone'
      }
    });
    await booking.populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
export const updateBookingStatus = async (req, res) => {
  try {
    const { status, landlordResponse } = req.body;
    
    const booking = await Booking.findById(req.params.id).populate('listing');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is the landlord
    if (booking.listing.landlord.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    booking.status = status;
    
    if (landlordResponse) {
      booking.landlordResponse = {
        message: landlordResponse,
        respondedAt: new Date()
      };
    }

    await booking.save();
    await booking.populate('user', 'name email phone');
    await booking.populate({
      path: 'listing',
      select: 'title location price images landlord',
      populate: {
        path: 'landlord',
        select: 'name email phone'
      }
    });

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Can only cancel pending or confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking with status: ${booking.status}`
      });
    }

    booking.status = 'cancelled';
    await booking.save();
    await booking.populate({
      path: 'listing',
      select: 'title location price images landlord',
      populate: {
        path: 'landlord',
        select: 'name email phone'
      }
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};

// @desc    Get bookings for landlord
// @route   GET /api/bookings/landlord
// @access  Private
export const getLandlordBookings = async (req, res) => {
  try {
    const { status } = req.query;
    
    // Get all listings owned by the user
    const userListings = await Listing.find({ landlord: req.user._id }).select('_id');
    const listingIds = userListings.map(listing => listing._id);

    const query = { listing: { $in: listingIds } };
    
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate({
        path: 'listing',
        select: 'title location price images landlord',
        populate: {
          path: 'landlord',
          select: 'name email phone'
        }
      })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Get landlord bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching landlord bookings',
      error: error.message
    });
  }
};