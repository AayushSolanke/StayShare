import Listing from '../models/Listing.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

// @desc    Get all listings
// @route   GET /api/listings
// @access  Public
export const getListings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      location, 
      minPrice, 
      maxPrice, 
      bedrooms, 
      roomType,
      amenities,
      search 
    } = req.query;

    const query = { isActive: true };
    
    // Add filters
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    if (bedrooms) {
      query.bedrooms = Number(bedrooms);
    }
    
    if (roomType) {
      query.roomType = roomType;
    }
    
    if (amenities) {
      const amenityArray = amenities.split(',');
      query.amenities = { $in: amenityArray };
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const listings = await Listing.find(query)
      .populate('landlord', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Listing.countDocuments(query);

    res.json({
      success: true,
      data: listings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching listings',
      error: error.message
    });
  }
};

// @desc    Get listings for the authenticated landlord
// @route   GET /api/listings/owner/me
// @access  Private
export const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ landlord: req.user._id })
      .sort({ createdAt: -1 })
      .populate('landlord', 'name email phone')
      .lean();

    if (!listings.length) {
      return res.json({
        success: true,
        data: []
      });
    }

    const listingIds = listings.map((listing) => listing._id);

    const stats = await Booking.aggregate([
      { $match: { listing: { $in: listingIds } } },
      {
        $group: {
          _id: '$listing',
          total: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          confirmed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const statsMap = stats.reduce((acc, item) => {
      acc[item._id.toString()] = {
        total: item.total,
        pending: item.pending,
        confirmed: item.confirmed
      };
      return acc;
    }, {});

    const enrichedListings = listings.map((listing) => ({
      listing,
      stats: statsMap[listing._id.toString()] || {
        total: 0,
        pending: 0,
        confirmed: 0
      }
    }));

    res.json({
      success: true,
      data: enrichedListings
    });
  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your listings',
      error: error.message
    });
  }
};

// @desc    Get single listing
// @route   GET /api/listings/:id
// @access  Public
export const getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('landlord', 'name email phone avatar bio');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching listing',
      error: error.message
    });
  }
};

// @desc    Create new listing
// @route   POST /api/listings
// @access  Private
export const createListing = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      price,
      bedrooms,
      bathrooms,
      roommates,
      images,
      amenities,
      roomType,
      availableFrom
    } = req.body;

    const listing = await Listing.create({
      title,
      description,
      location,
      price,
      bedrooms,
      bathrooms,
      roommates,
      images,
      amenities,
      roomType,
      availableFrom,
      landlord: req.user._id
    });

    await listing.populate('landlord', 'name email phone');

    let updatedUserProfile = null;

    if (req.user.role !== 'landlord') {
      try {
        const updatedUser = await User.findByIdAndUpdate(
          req.user._id,
          { role: 'landlord' },
          { new: true }
        );

        if (updatedUser) {
          updatedUserProfile = updatedUser.getPublicProfile();
        }
      } catch (updateError) {
        console.error('Failed to promote user to landlord:', updateError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      data: listing,
      user: updatedUserProfile || req.user
    });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating listing',
      error: error.message
    });
  }
};

// @desc    Update listing availability status
// @route   PATCH /api/listings/:id/status
// @access  Private
export const updateListingStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    if (
      listing.landlord.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this listing status'
      });
    }

    listing.isActive = Boolean(isActive);
    listing.updatedAt = new Date();
    await listing.save();

    res.json({
      success: true,
      message: listing.isActive ? 'Listing reopened' : 'Listing marked as full',
      data: listing
    });
  } catch (error) {
    console.error('Update listing status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating listing status',
      error: error.message
    });
  }
};

// @desc    Update listing
// @route   PUT /api/listings/:id
// @access  Private
export const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check if user is the landlord or admin
    if (listing.landlord.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this listing'
      });
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('landlord', 'name email phone');

    res.json({
      success: true,
      message: 'Listing updated successfully',
      data: updatedListing
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating listing',
      error: error.message
    });
  }
};

// @desc    Delete listing
// @route   DELETE /api/listings/:id
// @access  Private
export const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check if user is the landlord or admin
    if (listing.landlord.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this listing'
      });
    }

    await listing.deleteOne();

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting listing',
      error: error.message
    });
  }
};