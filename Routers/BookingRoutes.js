const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  addPayment,
  addBookingReview,
  getAllBookings
} = require('../Controllers/BookingController');
const { protect, admin } = require('../Middleware/authMiddleware');

// Protected user routes
router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getUserBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);
router.post('/:id/payments', protect, addPayment);
router.post('/:id/review', protect, addBookingReview);

// Admin routes
router.get('/all', protect, admin, getAllBookings);
router.put('/:id/status', protect, admin, updateBookingStatus);

module.exports = router;