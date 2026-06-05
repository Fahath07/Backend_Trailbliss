const jwt = require('jsonwebtoken');
const User = require('../Models/UserModel');

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer '))
            return res.status(401).json({ message: 'No token, authorization denied' });

        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);

        // generateToken signs with { id, role } — support both id and userId for safety
        const user = await User.findById(decoded.id || decoded.userId).select('-password');
        if (!user) return res.status(401).json({ message: 'User not found' });

        // Set req.user with id string so controllers can use req.user.id
        req.user = { id: user._id.toString(), role: user.role, email: user.email };
        next();
    } catch {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const admin = (req, res, next) => {
    if (req.user?.role !== 'admin')
        return res.status(403).json({ message: 'Admin access only' });
    next();
};

// Alias for backward compatibility
const adminOnly = admin;

module.exports = { protect, admin, adminOnly };
