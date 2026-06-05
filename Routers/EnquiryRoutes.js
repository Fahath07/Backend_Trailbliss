const express = require('express');
const router = express.Router();
const {
  createEnquiry,
  getUserEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  addResponse,
  getAllEnquiries,
  deleteEnquiry,
  getEnquiryStats
} = require('../Controllers/EnquiryController');
const { protect, admin } = require('../Middleware/authMiddleware');

// Public routes
router.post('/', createEnquiry);

// Protected routes
router.get('/my-enquiries', protect, getUserEnquiries);
router.get('/:id', protect, getEnquiryById);

// Admin routes
router.get('/admin/all', protect, admin, getAllEnquiries);
router.get('/admin/stats', protect, admin, getEnquiryStats);
router.put('/:id/status', protect, admin, updateEnquiryStatus);
router.post('/:id/responses', protect, admin, addResponse);
router.delete('/:id', protect, admin, deleteEnquiry);

module.exports = router;