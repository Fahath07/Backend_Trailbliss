const express = require('express');
const router = express.Router();
const { SignUpUser, LoginUser, LogoutUser, GetProfile, UpdateProfile, GetAllUsers, DeleteUser, SendOTP, VerifyOTP, ResetPassword, GoogleCallback } = require('../Controllers/UserController');
const { protect, admin } = require('../Middleware/authMiddleware');

router.post('/google', GoogleCallback);
router.post('/signup', SignUpUser);
router.post('/login', LoginUser);
router.post('/logout', LogoutUser);
router.post('/send-otp', SendOTP);
router.post('/verify-otp', VerifyOTP);
router.post('/reset-password', ResetPassword);
router.get('/profile', protect, GetProfile);
router.put('/profile', protect, UpdateProfile);
router.get('/all', protect, admin, GetAllUsers);
router.delete('/:id', protect, admin, DeleteUser);

module.exports = router;
