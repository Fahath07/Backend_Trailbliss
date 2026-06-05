const Trip = require('../Models/TripModel');

const GetAllTrips = async (req, res) => {
    try {
        const { destination, minPrice, maxPrice, available, category } = req.query;
        const filter = {};
        if (destination) filter.destination = { $regex: destination, $options: 'i' };
        if (category && category !== 'All') filter.category = category;
        if (minPrice || maxPrice) filter.price = { ...(minPrice && { $gte: Number(minPrice) }), ...(maxPrice && { $lte: Number(maxPrice) }) };
        if (available !== undefined) filter.available = available === 'true';

        const trips = await Trip.find(filter).sort({ startDate: 1 });
        res.json({ data: trips });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching trips', error: error.message });
    }
};

const GetTripById = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        res.json({ data: trip });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching trip', error: error.message });
    }
};

const CreateTrip = async (req, res) => {
    try {
        const trip = await Trip.create(req.body);
        res.status(201).json({ message: 'Trip created successfully', data: trip });
    } catch (error) {
        res.status(500).json({ message: 'Error creating trip', error: error.message });
    }
};

const UpdateTrip = async (req, res) => {
    try {
        const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        res.json({ message: 'Trip updated', data: trip });
    } catch (error) {
        res.status(500).json({ message: 'Error updating trip', error: error.message });
    }
};

const DeleteTrip = async (req, res) => {
    try {
        await Trip.findByIdAndDelete(req.params.id);
        res.json({ message: 'Trip deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting trip', error: error.message });
    }
};

module.exports = { GetAllTrips, GetTripById, CreateTrip, UpdateTrip, DeleteTrip };
