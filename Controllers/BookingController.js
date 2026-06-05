const Booking = require('../Models/BookingModel');
const Trip = require('../Models/TripModel');

const CreateBooking = async (req, res) => {
    try {
        const { packageId, travelerDetails, travelDetails } = req.body;

        const trip = await Trip.findById(packageId);
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        if (trip.availability?.isActive === false) return res.status(400).json({ message: 'Trip is not available' });

        const numTravelers = travelerDetails?.numberOfTravelers || 1;
        const basePrice = trip.pricing?.basePrice || 0;
        const totalAmount = basePrice * numTravelers;

        // Calculate end date from start date + duration
        const startDate = new Date(travelDetails?.startDate || Date.now());
        const durationDays = trip.duration?.days || 1;
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + durationDays);

        const booking = await Booking.create({
            user: req.user.id,
            package: packageId,
            travelerDetails: {
                primaryContact: {
                    fullName: travelerDetails?.fullName || '',
                    email: travelerDetails?.email || '',
                    phone: travelerDetails?.phone || '',
                },
                numberOfTravelers: numTravelers,
            },
            travelDetails: {
                startDate,
                endDate,
                tripType: travelerDetails?.tripType || 'Solo',
                specialRequests: travelDetails?.specialRequests || '',
            },
            pricing: {
                packagePrice: basePrice,
                totalAmount,
                finalAmount: totalAmount,
            },
            status: 'Pending',
        });

        res.status(201).json({ message: 'Booking created successfully', data: booking });
    } catch (error) {
        res.status(500).json({ message: 'Error creating booking', error: error.message });
    }
};

const GetMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate('package', 'title location pricing images duration');
        res.json({ data: bookings });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings', error: error.message });
    }
};

const GetBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('package')
            .populate('user', '-password');
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
        booking.status = 'Cancelled';
        await booking.save();
        res.json({ message: 'Booking cancelled', data: booking });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling booking', error: error.message });
    }
};

const GetAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('package', 'title location pricing')
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
            { status: req.body.status },
            { new: true }
        );
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json({ message: 'Booking updated', data: booking });
    } catch (error) {
        res.status(500).json({ message: 'Error updating booking', error: error.message });
    }
};

module.exports = { CreateBooking, GetMyBookings, GetBookingById, CancelBooking, GetAllBookings, UpdateBookingStatus };
