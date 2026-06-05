const express = require('express');
const router = express.Router();
const {
  getAllPackages,
  getPackageById,
  getPackageBySlug,
  createPackage,
  updatePackage,
  deletePackage,
  addReview,
  getCategories,
  getFeaturedPackages,
  searchPackages
} = require('../Controllers/TripController');
const { protect, admin } = require('../Middleware/authMiddleware');

// Public routes
router.get('/', getAllPackages);
router.get('/search', searchPackages);
router.get('/categories/list', getCategories);
router.get('/featured/list', getFeaturedPackages);
router.get('/slug/:slug', getPackageBySlug);
router.get('/:id', getPackageById);

// Protected routes
router.post('/:id/reviews', protect, addReview);

// Admin only routes
router.post('/', protect, admin, createPackage);
router.put('/:id', protect, admin, updatePackage);
router.delete('/:id', protect, admin, deletePackage);

module.exports = router;