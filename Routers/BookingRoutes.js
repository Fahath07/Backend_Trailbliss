const express = require('express');
const router = express.Router();
const { CreateBooking, GetMyBookings, GetBookingById, CancelBooking, GetAllBookings, UpdateBookingStatus } = require('../Controllers/BookingController');
const { protect, admin } = require('../Middleware/authMiddleware');

router.post('/', protect, CreateBooking);
router.get('/my', protect, GetMyBookings);
router.get('/all', protect, admin, GetAllBookings);
router.get('/:id', protect, GetBookingById);
router.put('/:id/cancel', protect, CancelBooking);
router.put('/:id/status', protect, admin, UpdateBookingStatus);

module.exports = router;
