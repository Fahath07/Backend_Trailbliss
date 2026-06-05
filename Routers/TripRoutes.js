const express = require('express');
const router = express.Router();
const { GetAllTrips, GetTripById, CreateTrip, UpdateTrip, DeleteTrip } = require('../Controllers/TripController');
const { protect, admin } = require('../Middleware/authMiddleware');

router.get('/', GetAllTrips);
router.get('/:id', GetTripById);
router.post('/', protect, admin, CreateTrip);
router.put('/:id', protect, admin, UpdateTrip);
router.delete('/:id', protect, admin, DeleteTrip);

module.exports = router;
