const Enquiry = require('../Models/EnquiryModel');

// @desc    Create new enquiry
// @route   POST /api/enquiries
// @access  Public
const createEnquiry = async (req, res) => {
  try {
    const { name, email, phone, subject, message, category = 'General' } = req.body;

    const enquiry = new Enquiry({
      name,
      email,
      phone,
      subject,
      message,
      category,
      source: 'Website'
    });

    await enquiry.save();

    res.status(201).json({
      message: 'Enquiry submitted successfully',
      enquiry: {
        enquiryId: enquiry.enquiryId,
        subject: enquiry.subject,
        status: enquiry.status,
        createdAt: enquiry.createdAt
      }
    });
  } catch (error) {
    console.error('Create enquiry error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user's enquiries
// @route   GET /api/enquiries/my-enquiries
// @access  Private
const getUserEnquiries = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(400).json({ message: 'User email not found' });
    }

    const enquiries = await Enquiry.find({ email: userEmail })
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'firstName lastName')
      .populate('responses.from', 'firstName lastName');

    res.json({ enquiries });
  } catch (error) {
    console.error('Get user enquiries error:', error);
    res.status(500).json({ message: 'Failed to fetch enquiries' });
  }
};

// @desc    Get enquiry by ID
// @route   GET /api/enquiries/:id
// @access  Private
const getEnquiryById = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('responses.from', 'firstName lastName')
      .populate('relatedBooking');

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    // Check access permissions
    if (req.userRole !== 'admin' && enquiry.email !== req.user?.email) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ enquiry });
  } catch (error) {
    console.error('Get enquiry error:', error);
    res.status(500).json({ message: 'Failed to fetch enquiry' });
  }
};

// @desc    Update enquiry status
// @route   PUT /api/enquiries/:id/status
// @access  Private/Admin
const updateEnquiryStatus = async (req, res) => {
  try {
    const { status, assignedTo, priority, tags } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (priority) updateData.priority = priority;
    if (tags) updateData.tags = tags;

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'firstName lastName');

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    res.json({
      message: 'Enquiry updated successfully',
      enquiry
    });
  } catch (error) {
    console.error('Update enquiry error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Add response to enquiry
// @route   POST /api/enquiries/:id/responses
// @access  Private/Admin
const addResponse = async (req, res) => {
  try {
    const { message, attachments = [] } = req.body;
    
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    // Add response
    enquiry.responses.push({
      from: req.userId,
      message,
      attachments,
      timestamp: new Date()
    });

    // Update status to In Progress if it was New
    if (enquiry.status === 'New') {
      enquiry.status = 'In Progress';
    }

    await enquiry.save();
    await enquiry.populate('responses.from', 'firstName lastName');

    res.json({
      message: 'Response added successfully',
      enquiry
    });
  } catch (error) {
    console.error('Add response error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all enquiries (Admin)
// @route   GET /api/enquiries/admin/all
// @access  Private/Admin
const getAllEnquiries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = '',
      category = '',
      priority = '',
      assignedTo = '',
      search = ''
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (search) {
      query.$or = [
        { enquiryId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const enquiries = await Enquiry.find(query)
      .sort({ priority: 1, createdAt: -1 }) // High priority first, then newest
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('assignedTo', 'firstName lastName')
      .select('-responses'); // Exclude responses for list view

    const total = await Enquiry.countDocuments(query);

    // Get summary stats
    const stats = await Enquiry.aggregate([
      {
        $group: {
          _id: {
            status: '$status',
            priority: '$priority'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get unassigned count
    const unassignedCount = await Enquiry.countDocuments({
      assignedTo: { $exists: false },
      status: { $in: ['New', 'In Progress'] }
    });

    res.json({
      enquiries,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalEnquiries: total,
      stats,
      unassignedCount
    });
  } catch (error) {
    console.error('Get all enquiries error:', error);
    res.status(500).json({ message: 'Failed to fetch enquiries' });
  }
};

// @desc    Delete enquiry
// @route   DELETE /api/enquiries/:id
// @access  Private/Admin
const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    
    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    await enquiry.deleteOne();
    
    res.json({ message: 'Enquiry deleted successfully' });
  } catch (error) {
    console.error('Delete enquiry error:', error);
    res.status(500).json({ message: 'Failed to delete enquiry' });
  }
};

// @desc    Get enquiry statistics
// @route   GET /api/enquiries/admin/stats
// @access  Private/Admin
const getEnquiryStats = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const stats = await Enquiry.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            status: '$status',
            category: '$category',
            priority: '$priority'
          },
          count: { $sum: 1 },
          avgResponseTime: {
            $avg: {
              $subtract: ['$resolvedAt', '$createdAt']
            }
          }
        }
      }
    ]);

    // Daily enquiry count for the period
    const dailyStats = await Enquiry.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      stats,
      dailyStats,
      period: parseInt(period)
    });
  } catch (error) {
    console.error('Get enquiry stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
};

module.exports = {
  createEnquiry,
  getUserEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  addResponse,
  getAllEnquiries,
  deleteEnquiry,
  getEnquiryStats
};