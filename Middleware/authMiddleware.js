const jwt = require('jsonwebtoken');
const User = require('../Models/UserModel');

const protect = async (req, res, next) => {
    try {
        const token = req.cookies?.trailbliss_token;
        if (!token)
            return res.status(401).json({ message: 'Not authenticated. Please log in.' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(401).json({ message: 'User not found' });

        req.user = { id: user._id.toString(), role: user.role, email: user.email };
        next();
    } catch {
        res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
};

const admin = (req, res, next) => {
    if (req.user?.role !== 'admin')
        return res.status(403).json({ message: 'Admin access only' });
    next();
};

module.exports = { protect, admin };
