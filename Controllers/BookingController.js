const Booking = require('../Models/BookingModel');
const Package = require('../Models/TripModel');
const User = require('../Models/UserModel');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const {
      packageId,
      travelerDetails,
      travelDetails,
      specialRequests
    } = req.body;

    // Verify package exists and is available
    const package = await Package.findById(packageId);
    if (!package || !package.availability.isActive) {
      return res.status(404).json({ message: 'Package not found or unavailable' });
    }

    // Calculate pricing
    const packagePrice = package.pricing.basePrice;
    const numberOfTravelers = travelerDetails.numberOfTravelers;
    const totalAmount = packagePrice * numberOfTravelers;
    const taxes = Math.round(totalAmount * 0.18); // 18% GST
    const finalAmount = totalAmount + taxes;

    // Create booking
    const booking = new Booking({
      user: req.userId,
      package: packageId,
      travelerDetails: {
        ...travelerDetails,
        primaryContact: {
          fullName: travelerDetails.fullName,
          email: travelerDetails.email,
          phone: travelerDetails.phone
        }
      },
      travelDetails: {
        ...travelDetails,
        specialRequests
      },
      pricing: {
        packagePrice,
        totalAmount,
        taxes,
        finalAmount
      }
    });

    await booking.save();

    // Update package booking count
    package.bookingCount += 1;
    await package.save();

    // Add booking to user's history
    await User.findByIdAndUpdate(req.userId, {
      $push: { bookingHistory: booking._id }
    });

    await booking.populate([
      { path: 'package', select: 'title location category duration pricing images' },
      { path: 'user', select: 'firstName lastName email phone' }
    ]);

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
const getUserBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;

    const query = { user: req.userId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('package', 'title location category duration pricing images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalBookings: total
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('package')
      .populate('user', 'firstName lastName email phone')
      .populate('confirmationDetails.confirmedBy', 'firstName lastName');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking or is admin
    if (booking.user._id.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Failed to fetch booking' });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update status
    booking.status = status;

    // Add confirmation details if confirmed
    if (status === 'Confirmed') {
      booking.confirmationDetails = {
        confirmedAt: new Date(),
        confirmedBy: req.userId,
        confirmationNumber: `CNF${booking.bookingId}${Date.now().toString().slice(-4)}`
      };
    }

    // Add communication log
    if (notes) {
      booking.communication.push({
        from: 'Admin',
        message: notes,
        timestamp: new Date()
      });
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if booking can be cancelled
    if (['Cancelled', 'Completed'].includes(booking.status)) {
      return res.status(400).json({ message: 'Booking cannot be cancelled' });
    }

    // Calculate refund (simple logic - can be enhanced)
    const daysDifference = Math.ceil((booking.travelDetails.startDate - new Date()) / (1000 * 60 * 60 * 24));
    let refundPercent = 0;
    
    if (daysDifference > 30) refundPercent = 90;
    else if (daysDifference > 15) refundPercent = 70;
    else if (daysDifference > 7) refundPercent = 50;
    else if (daysDifference > 3) refundPercent = 25;

    const refundAmount = Math.round((booking.pricing.finalAmount * refundPercent) / 100);

    // Update booking
    booking.status = 'Cancelled';
    booking.cancellation = {
      isCancelled: true,
      cancelledAt: new Date(),
      cancelledBy: req.userId,
      reason,
      refundAmount,
      refundStatus: 'Pending'
    };

    // Add communication log
    booking.communication.push({
      from: 'User',
      message: `Booking cancelled. Reason: ${reason}`,
      timestamp: new Date()
    });

    await booking.save();

    res.json({
      message: 'Booking cancelled successfully',
      refundAmount,
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Add payment to booking
// @route   POST /api/bookings/:id/payments
// @access  Private
const addPayment = async (req, res) => {
  try {
    const { amount, method, transactionId } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add transaction
    booking.payment.transactions.push({
      transactionId,
      amount,
      status: 'Success',
      date: new Date()
    });

    // Update payment amounts
    booking.payment.paidAmount += amount;
    booking.payment.method = method;

    // Update payment status
    if (booking.payment.paidAmount >= booking.pricing.finalAmount) {
      booking.payment.status = 'Completed';
    } else if (booking.payment.paidAmount > 0) {
      booking.payment.status = 'Partial';
    }

    await booking.save();

    res.json({
      message: 'Payment added successfully',
      payment: booking.payment
    });
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Add review for booking
// @route   POST /api/bookings/:id/review
// @access  Private
const addBookingReview = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if booking is completed
    if (booking.status !== 'Completed') {
      return res.status(400).json({ message: 'Can only review completed bookings' });
    }

    // Add feedback
    booking.feedback = {
      rating,
      review,
      reviewDate: new Date()
    };

    await booking.save();

    // Also add review to the package
    const package = await Package.findById(booking.package);
    if (package) {
      package.reviews.push({
        user: req.userId,
        rating,
        comment: review
      });
      package.updateRatings();
      await package.save();
    }

    res.json({
      message: 'Review added successfully',
      feedback: booking.feedback
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings/all
// @access  Private/Admin
const getAllBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = '',
      search = '',
      startDate = '',
      endDate = ''
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
        { 'travelerDetails.primaryContact.fullName': { $regex: search, $options: 'i' } },
        { 'travelerDetails.primaryContact.email': { $regex: search, $options: 'i' } }
      ];
    }
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(query)
      .populate('trip', 'title location category')
      .populate('user', 'firstname lastname email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    // Get stats
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$pricing.finalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: bookings,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalBookings: total,
      stats
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  addPayment,
  addBookingReview,
  getAllBookings
};