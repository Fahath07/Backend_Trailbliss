const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  enquiryId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please provide a valid phone number']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxLength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxLength: [1000, 'Message cannot exceed 1000 characters']
  },
  category: {
    type: String,
    enum: ['General', 'Booking', 'Payment', 'Cancellation', 'Complaint', 'Suggestion', 'Technical'],
    default: 'General'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['New', 'In Progress', 'Resolved', 'Closed'],
    default: 'New'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  responses: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxLength: [1000, 'Response cannot exceed 1000 characters']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    attachments: [String] // URLs to attached files
  }],
  tags: [String],
  relatedBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  source: {
    type: String,
    enum: ['Website', 'Phone', 'Email', 'WhatsApp', 'Social Media', 'Walk-in'],
    default: 'Website'
  },
  resolvedAt: Date,
  satisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String
  }
}, {
  timestamps: true
});

// Generate enquiry ID before saving
enquirySchema.pre('save', async function(next) {
  if (this.isNew && !this.enquiryId) {
    const count = await this.constructor.countDocuments();
    this.enquiryId = `EQ${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Auto-set resolved date when status changes to resolved/closed
enquirySchema.pre('save', function(next) {
  if (this.isModified('status') && ['Resolved', 'Closed'].includes(this.status) && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  next();
});

// Indexing
enquirySchema.index({ enquiryId: 1 });
enquirySchema.index({ email: 1 });
enquirySchema.index({ status: 1 });
enquirySchema.index({ category: 1 });
enquirySchema.index({ priority: 1 });
enquirySchema.index({ assignedTo: 1 });
enquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Enquiry', enquirySchema);