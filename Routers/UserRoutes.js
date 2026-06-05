const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  forgotPassword,
  getAllUsers,
  deleteUser
} = require('../Controllers/UserController');
const { protect, admin } = require('../Middleware/authMiddleware');

// Public routes
router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);

// Admin only routes
router.get('/all', protect, admin, getAllUsers);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;