const express = require('express');
const router = express.Router();
const { SignUpUser, LoginUser, GetProfile, UpdateProfile, GetAllUsers, DeleteUser } = require('../Controllers/UserController');
const { protect, admin } = require('../Middleware/authMiddleware');

router.post('/signup', SignUpUser);
router.post('/login', LoginUser);
router.get('/profile', protect, GetProfile);
router.put('/profile', protect, UpdateProfile);
router.get('/all', protect, admin, GetAllUsers);
router.delete('/:id', protect, admin, DeleteUser);

module.exports = router;
