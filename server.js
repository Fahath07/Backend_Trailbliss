const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://trailbliss.netlify.app',
        /\.netlify\.app$/,
        /\.vercel\.app$/,
    ],
    credentials: true,
}));

// Health check — this is what the deployed URL "/" used to hit and show "Route not found"
app.get('/', (req, res) => res.json({ status: 'ok', message: 'TrailBliss API is running!' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'TrailBliss API is running!' }));

// Routes
app.use('/api/user', require('./Routers/UserRoutes'));
app.use('/api/trips', require('./Routers/TripRoutes'));
app.use('/api/bookings', require('./Routers/BookingRoutes'));
app.use('/api/enquiries', require('./Routers/EnquiryRoutes'));
app.use('/api/admin', require('./Routers/AdminRoutes'));

// 404 fallback
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found', path: req.originalUrl });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => {
        console.log('Successfully connected to MongoDB');
        app.listen(process.env.PORT || 5000, () => {
            console.log(`Server running on port ${process.env.PORT || 5000}`);
        });
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    });

module.exports = app;
