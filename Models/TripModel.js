const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Package title is required'],
    trim: true,
    maxLength: [100, 'Title cannot be more than 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxLength: [500, 'Description cannot be more than 500 characters']
  },
  location: {
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    country: {
      type: String,
      default: 'India'
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Nature', 'Adventure', 'Leisure', 'Cultural', 'Wellness']
  },
  duration: {
    days: {
      type: Number,
      required: [true, 'Duration in days is required'],
      min: [1, 'Duration must be at least 1 day']
    },
    nights: {
      type: Number,
      default: function() {
        return Math.max(0, this.duration.days - 1);
      }
    }
  },
  pricing: {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 90
    },
    priceIncludes: [String],
    priceExcludes: [String]
  },
  itinerary: [{
    day: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    activities: [String],
    meals: {
      breakfast: { type: Boolean, default: false },
      lunch: { type: Boolean, default: false },
      dinner: { type: Boolean, default: false }
    },
    accommodation: {
      type: String,
      enum: ['Hotel', 'Resort', 'Guesthouse', 'Camping', 'Houseboat', 'Homestay', 'None']
    }
  }],
  images: {
    featured: {
      type: String,
      required: [true, 'Featured image is required']
    },
    gallery: [String]
  },
  highlights: [String],
  inclusions: [String],
  exclusions: [String],
  difficulty: {
    type: String,
    enum: ['Easy', 'Moderate', 'Challenging', 'Extreme'],
    default: 'Easy'
  },
  groupSize: {
    min: {
      type: Number,
      default: 1
    },
    max: {
      type: Number,
      default: 20
    }
  },
  availability: {
    isActive: {
      type: Boolean,
      default: true
    },
    seasonalAvailability: [{
      startDate: Date,
      endDate: Date,
      available: Boolean
    }],
    blackoutDates: [Date]
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxLength: [500, 'Review cannot be more than 500 characters']
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  badge: {
    type: String,
    enum: ['Popular', 'Bestseller', 'New', 'Limited', 'Premium', '']
  },
  bookingCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate slug before saving
packageSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Calculate final price with discount
packageSchema.virtual('finalPrice').get(function() {
  const discount = (this.pricing.basePrice * this.pricing.discountPercent) / 100;
  return this.pricing.basePrice - discount;
});

// Update ratings when reviews change
packageSchema.methods.updateRatings = function() {
  if (this.reviews.length === 0) {
    this.ratings.average = 0;
    this.ratings.count = 0;
  } else {
    const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.ratings.average = parseFloat((total / this.reviews.length).toFixed(1));
    this.ratings.count = this.reviews.length;
  }
};

// Indexing for search and performance
packageSchema.index({ title: 'text', description: 'text', 'location.city': 'text' });
packageSchema.index({ category: 1 });
packageSchema.index({ 'pricing.basePrice': 1 });
packageSchema.index({ 'ratings.average': -1 });
packageSchema.index({ bookingCount: -1 });
packageSchema.index({ 'availability.isActive': 1 });

module.exports = mongoose.model('Package', packageSchema);