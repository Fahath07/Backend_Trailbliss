const Booking = require('../Models/BookingModel');
const Trip = require('../Models/TripModel');

const CreateBooking = async (req, res) => {
    try {
        const { tripId, seats } = req.body;
        const trip = await Trip.findById(tripId);
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        if (!trip.available) return res.status(400).json({ message: 'Trip is not available' });

        const totalPrice = trip.price * seats;
        const booking = await Booking.create({ user: req.user.id, trip: tripId, seats, totalPrice });
        res.status(201).json({ message: 'Booking created successfully', data: booking });
    } catch (error) {
        res.status(500).json({ message: 'Error creating booking', error: error.message });
    }
};

const GetMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id }).populate('trip', 'title destination startDate endDate price image');
        res.json({ data: bookings });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings', error: error.message });
    }
};

const GetBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('trip').populate('user', '-password');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ message: 'Not authorized' });
        res.json({ data: booking });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching booking', error: error.message });
    }
};

const CancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ message: 'Not authorized' });
        booking.status = 'cancelled';
        await booking.save();
        res.json({ message: 'Booking cancelled', data: booking });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling booking', error: error.message });
    }
};

const GetAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('trip', 'title destination')
            .populate('user', 'firstname lastname email');
        res.json({ data: bookings });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings', error: error.message });
    }
};

const UpdateBookingStatus = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status, paymentStatus: req.body.paymentStatus },
            { new: true }
        );
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json({ message: 'Booking updated', data: booking });
    } catch (error) {
        res.status(500).json({ message: 'Error updating booking', error: error.message });
    }
};

module.exports = { CreateBooking, GetMyBookings, GetBookingById, CancelBooking, GetAllBookings, UpdateBookingStatus };
