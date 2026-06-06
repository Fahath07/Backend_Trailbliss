const Enquiry = require('../Models/EnquiryModel');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const ADMIN_EMAIL = 'fahathalsalam07@gmail.com';

const createEnquiry = async (req, res) => {
  try {
    const { name, email, phone, subject, message, category = 'General' } = req.body;

    const count = await Enquiry.countDocuments();
    const enquiryId = `EQ${String(count + 1).padStart(4, '0')}`;

    const enquiry = new Enquiry({ enquiryId, name, email, phone, subject, message, category, source: 'Website' });
    await enquiry.save();

    // Send email notification to admin
    transporter.sendMail({
      from: `"TrailBliss" <${process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: `New Enquiry: ${subject}`,
      html: `
        <div style="font-family:Poppins,sans-serif;max-width:520px;margin:auto;padding:32px;border-radius:12px;border:1px solid #e5e7eb">
          <h2 style="color:#1a1a2e">🌍 New Contact Enquiry</h2>
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr><td style="padding:8px 0;color:#6b7280;width:120px">Name</td><td><strong>${name}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Email</td><td>${email}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Phone</td><td>${phone || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Subject</td><td>${subject}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#f9fafb;border-radius:8px">
            <p style="color:#6b7280;margin:0 0 8px">Message:</p>
            <p style="margin:0">${message}</p>
          </div>
          <p style="margin-top:16px;color:#6b7280;font-size:13px">Enquiry ID: ${enquiry.enquiryId}</p>
        </div>
      `,
    }).catch(() => {}); // fire-and-forget, don't fail the request if email fails

    res.status(201).json({
      message: 'Enquiry submitted successfully',
      enquiry: { enquiryId: enquiry.enquiryId, subject: enquiry.subject, status: enquiry.status, createdAt: enquiry.createdAt }
    });
  } catch (error) {
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

const getAllEnquiries = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const query = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ]
    } : {};
    const enquiries = await Enquiry.find(query).sort({ createdAt: -1 });
    res.json({ data: enquiries });
  } catch (error) {
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