const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  travelerDetails: {
    primaryContact: {
      fullName: {
        type: String,
        required: [true, 'Primary contact name is required']
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
      },
      phone: {
        type: String,
        required: [true, 'Phone number is required']
      }
    },
    numberOfTravelers: {
      type: Number,
      required: [true, 'Number of travelers is required'],
      min: [1, 'At least 1 traveler is required']
    },
    travelers: [{
      name: {
        type: String,
        required: true
      },
      age: {
        type: Number,
        min: 0,
        max: 120
      },
      gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
      },
      idType: {
        type: String,
        enum: ['Passport', 'Aadhar', 'Driving License', 'Voter ID']
      },
      idNumber: String,
      specialRequirements: String
    }]
  },
  travelDetails: {
    startDate: {
      type: Date,
      required: [true, 'Travel start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'Travel end date is required']
    },
    tripType: {
      type: String,
      enum: ['Family', 'Couple', 'Solo', 'Friends Group', 'Corporate'],
      required: true
    },
    specialRequests: {
      type: String,
      maxLength: [500, 'Special requests cannot exceed 500 characters']
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  pricing: {
    packagePrice: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    },
    taxes: {
      type: Number,
      default: 0
    },
    finalAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  payment: {
    status: {
      type: String,
      enum: ['Pending', 'Partial', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending'
    },
    method: {
      type: String,
      enum: ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet', 'Bank Transfer']
    },
    transactions: [{
      transactionId: String,
      amount: Number,
      status: {
        type: String,
        enum: ['Success', 'Failed', 'Pending']
      },
      date: {
        type: Date,
        default: Date.now
      },
      gateway: String
    }],
    paidAmount: {
      type: Number,
      default: 0
    },
    dueAmount: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Refunded'],
    default: 'Pending'
  },
  confirmationDetails: {
    confirmedAt: Date,
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    confirmationNumber: String,
    vouchers: [String], // URLs to voucher documents
    itinerary: String // URL to detailed itinerary
  },
  communication: [{
    from: {
      type: String,
      enum: ['User', 'Admin', 'System']
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  cancellation: {
    isCancelled: {
      type: Boolean,
      default: false
    },
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['Pending', 'Processed', 'Completed', 'Rejected']
    }
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      maxLength: [1000, 'Review cannot exceed 1000 characters']
    },
    reviewDate: Date
  }
}, {
  timestamps: true
});

// Generate booking ID before saving
bookingSchema.pre('save', async function() {
  if (this.isNew && !this.bookingId) {
    const count = await this.constructor.countDocuments();
    this.bookingId = `TB${String(count + 1).padStart(4, '0')}`;
  }
  if (this.travelDetails?.startDate && this.travelDetails?.endDate) {
    if (new Date(this.travelDetails.startDate) >= new Date(this.travelDetails.endDate)) {
      throw new Error('End date must be after start date');
    }
  }
  if (this.pricing?.finalAmount != null && this.payment?.paidAmount != null) {
    this.payment.dueAmount = this.pricing.finalAmount - this.payment.paidAmount;
  }
});

// Indexing
bookingSchema.index({ user: 1 });
bookingSchema.index({ package: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'travelDetails.startDate': 1 });
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);