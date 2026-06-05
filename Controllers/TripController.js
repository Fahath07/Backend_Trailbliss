const Package = require('../Models/TripModel');

// @desc    Get all packages
// @route   GET /api/trips
// @access  Public
const getAllPackages = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      category = '',
      minPrice = 0,
      maxPrice = 999999,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { 'availability.isActive': { $ne: false } };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.state': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (minPrice > 0 || maxPrice < 999999) {
      query['pricing.basePrice'] = {
        $gte: parseInt(minPrice),
        $lte: parseInt(maxPrice)
      };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const packages = await Package.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'firstName lastName')
      .select('-reviews'); // Exclude reviews for list view

    const total = await Package.countDocuments(query);

    res.json({
      success: true,
      data: packages,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalPackages: total,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch packages' });
  }
};

// @desc    Get package by ID
// @route   GET /api/trips/:id
// @access  Public
const getPackageById = async (req, res) => {
  try {
    const package = await Package.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('reviews.user', 'firstName lastName avatar');

    if (!package) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    res.json({ success: true, data: package });
  } catch (error) {
    console.error('Get package error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch package' });
  }
};

// @desc    Get package by slug
// @route   GET /api/packages/slug/:slug
// @access  Public
const getPackageBySlug = async (req, res) => {
  try {
    const package = await Package.findOne({ slug: req.params.slug })
      .populate('createdBy', 'firstName lastName')
      .populate('reviews.user', 'firstName lastName avatar');

    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.json({ package });
  } catch (error) {
    console.error('Get package by slug error:', error);
    res.status(500).json({ message: 'Failed to fetch package' });
  }
};

// @desc    Create new package
// @route   POST /api/trips
// @access  Private/Admin
const createPackage = async (req, res) => {
  try {
    const packageData = {
      ...req.body,
      createdBy: req.userId
    };

    const package = new Package(packageData);
    await package.save();

    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: package
    });
  } catch (error) {
    console.error('Create package error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update package
// @route   PUT /api/trips/:id
// @access  Private/Admin
const updatePackage = async (req, res) => {
  try {
    const package = await Package.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!package) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    res.json({
      success: true,
      message: 'Package updated successfully',
      data: package
    });
  } catch (error) {
    console.error('Update package error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete package
// @route   DELETE /api/trips/:id
// @access  Private/Admin
const deletePackage = async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);

    if (!package) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    // Soft delete by setting inactive
    package.availability.isActive = false;
    await package.save();

    res.json({ success: true, message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete package' });
  }
};

// @desc    Add review to package
// @route   POST /api/packages/:id/reviews
// @access  Private
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const package = await Package.findById(req.params.id);

    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // Check if user already reviewed
    const existingReview = package.reviews.find(
      review => review.user.toString() === req.userId
    );

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this package' });
    }

    // Add review
    package.reviews.push({
      user: req.userId,
      rating,
      comment
    });

    // Update ratings
    package.updateRatings();
    await package.save();

    await package.populate('reviews.user', 'firstName lastName avatar');

    res.status(201).json({
      message: 'Review added successfully',
      reviews: package.reviews,
      ratings: package.ratings
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get package categories
// @route   GET /api/packages/categories/list
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Package.distinct('category', { 'availability.isActive': true });
    
    // Get package count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await Package.countDocuments({
          category,
          'availability.isActive': true
        });
        return { name: category, count };
      })
    );

    res.json({ categories: categoriesWithCount });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

// @desc    Get featured packages
// @route   GET /api/packages/featured/list
// @access  Public
const getFeaturedPackages = async (req, res) => {
  try {
    const packages = await Package.find({
      'availability.isActive': true,
      $or: [
        { badge: { $in: ['Popular', 'Bestseller'] } },
        { 'ratings.average': { $gte: 4.0 } },
        { bookingCount: { $gte: 10 } }
      ]
    })
    .sort({ 'ratings.average': -1, bookingCount: -1 })
    .limit(6)
    .select('-reviews -itinerary');

    res.json({ packages });
  } catch (error) {
    console.error('Get featured packages error:', error);
    res.status(500).json({ message: 'Failed to fetch featured packages' });
  }
};

// @desc    Search packages
// @route   GET /api/packages/search
// @access  Public
const searchPackages = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const packages = await Package.find({
      $text: { $search: q },
      'availability.isActive': true
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(10)
    .select('title location category pricing.basePrice images.featured ratings');

    res.json({ packages, query: q });
  } catch (error) {
    console.error('Search packages error:', error);
    res.status(500).json({ message: 'Search failed' });
  }
};

module.exports = {
  getAllPackages,
  getPackageById,
  getPackageBySlug,
  createPackage,
  updatePackage,
  deletePackage,
  addReview,
  getCategories,
  getFeaturedPackages,
  searchPackages
};