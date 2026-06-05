const express = require('express');
const router = express.Router();
const Booking = require('../Models/BookingModel');
const Package = require('../Models/TripModel');
const User = require('../Models/UserModel');
const Enquiry = require('../Models/EnquiryModel');
const { protect, admin } = require('../Middleware/authMiddleware');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
router.get('/dashboard-stats', protect, admin, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get basic counts
    const [
      totalBookings,
      totalUsers,
      totalPackages,
      totalEnquiries,
      recentBookings,
      recentUsers,
      activePackages
    ] = await Promise.all([
      Booking.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Package.countDocuments(),
      Enquiry.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: startDate } }),
      User.countDocuments({ createdAt: { $gte: startDate }, role: 'user' }),
      Package.countDocuments({ 'availability.isActive': true })
    ]);

    // Get revenue stats
    const revenueStats = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['Confirmed', 'Completed'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.finalAmount' },
          averageBookingValue: { $avg: '$pricing.finalAmount' }
        }
      }
    ]);

    const recentRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['Confirmed', 'Completed'] }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$pricing.finalAmount' }
        }
      }
    ]);

    // Get booking status distribution
    const bookingStatusStats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get popular packages
    const popularPackages = await Package.find({ 'availability.isActive': true })
      .sort({ bookingCount: -1, 'ratings.average': -1 })
      .limit(5)
      .select('title bookingCount ratings location category');

    // Get monthly booking trends
    const monthlyTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } // Last 6 months
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$pricing.finalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      overview: {
        totalBookings,
        totalUsers,
        totalPackages,
        totalEnquiries,
        activePackages,
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        averageBookingValue: Math.round(revenueStats[0]?.averageBookingValue || 0)
      },
      recentStats: {
        bookings: recentBookings,
        users: recentUsers,
        revenue: recentRevenue[0]?.revenue || 0,
        period: parseInt(period)
      },
      bookingStatusStats,
      popularPackages,
      monthlyTrends
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// @desc    Get recent activities
// @route   GET /api/admin/recent-activities
// @access  Private/Admin
router.get('/recent-activities', protect, admin, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 2)
      .populate('user', 'firstName lastName')
      .populate('package', 'title')
      .select('bookingId status createdAt user package pricing');

    // Get recent enquiries
    const recentEnquiries = await Enquiry.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 2)
      .select('enquiryId name subject status priority createdAt');

    // Get recent user registrations
    const recentUsers = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email createdAt');

    res.json({
      recentBookings,
      recentEnquiries,
      recentUsers
    });
  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({ message: 'Failed to fetch recent activities' });
  }
});

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private/Admin
router.get('/analytics', protect, admin, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Group by format
    const groupFormats = {
      day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      week: { $dateToString: { format: '%Y-W%U', date: '$createdAt' } },
      month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
    };

    // Booking analytics
    const bookingAnalytics = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupFormats[groupBy],
          bookings: { $sum: 1 },
          revenue: { $sum: '$pricing.finalAmount' },
          averageValue: { $avg: '$pricing.finalAmount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Package category performance
    const categoryPerformance = await Booking.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'packages',
          localField: 'package',
          foreignField: '_id',
          as: 'packageInfo'
        }
      },
      { $unwind: '$packageInfo' },
      {
        $group: {
          _id: '$packageInfo.category',
          bookings: { $sum: 1 },
          revenue: { $sum: '$pricing.finalAmount' }
        }
      },
      { $sort: { bookings: -1 } }
    ]);

    // User growth
    const userGrowth = await User.aggregate([
      {
        $match: {
          ...matchStage,
          role: 'user'
        }
      },
      {
        $group: {
          _id: groupFormats[groupBy],
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      bookingAnalytics,
      categoryPerformance,
      userGrowth,
      period: { startDate, endDate, groupBy }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
});

module.exports = router;