const User = require('../models/User');
const Scan = require('../models/Scan');
const LearningContent = require('../models/LearningContent');

// @desc    Admin dashboard: platform-wide statistics + chart data
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalScans,
      highRiskScans,
      safeScans,
      categoryDistribution,
      classificationDistribution,
      scanTrend,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments(),
      Scan.countDocuments(),
      Scan.countDocuments({ classification: { $in: ['Scam', 'Malicious'] } }),
      Scan.countDocuments({ classification: 'Safe' }),
      Scan.aggregate([
        { $group: { _id: '$scamCategory', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Scan.aggregate([{ $group: { _id: '$classification', count: { $sum: 1 } } }]),
      Scan.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
      Scan.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email'),
    ]);

    res.status(200).json({
      success: true,
      overview: { totalUsers, totalScans, highRiskScans, safeScans },
      categoryDistribution,
      classificationDistribution,
      scanTrend,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    List all users (admin)
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    res.status(200).json({ success: true, count: users.length, total, users });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a user's role or active status (admin)
// @route   PATCH /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const update = {};
    if (role && ['user', 'admin'].includes(role)) update.role = role;
    if (typeof isActive === 'boolean') update.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc    List all scans platform-wide (admin) with search/filter
// @route   GET /api/admin/scans
// @access  Private/Admin
const getAllScans = async (req, res, next) => {
  try {
    const { search, scanType, classification, page = 1, limit = 20 } = req.query;
    const query = {};
    if (scanType) query.scanType = scanType;
    if (classification) query.classification = classification;
    if (search) {
      query.$or = [
        { input: { $regex: search, $options: 'i' } },
        { scamCategory: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [scans, total] = await Promise.all([
      Scan.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Scan.countDocuments(query),
    ]);

    res.status(200).json({ success: true, count: scans.length, total, scans });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new learning content module (admin)
// @route   POST /api/admin/learning
// @access  Private/Admin
const createLearningContent = async (req, res, next) => {
  try {
    const module = await LearningContent.create(req.body);
    res.status(201).json({ success: true, module });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a learning content module (admin)
// @route   PATCH /api/admin/learning/:id
// @access  Private/Admin
const updateLearningContent = async (req, res, next) => {
  try {
    const module = await LearningContent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!module) {
      return res.status(404).json({ success: false, message: 'Learning module not found' });
    }
    res.status(200).json({ success: true, module });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a learning content module (admin)
// @route   DELETE /api/admin/learning/:id
// @access  Private/Admin
const deleteLearningContent = async (req, res, next) => {
  try {
    const module = await LearningContent.findByIdAndDelete(req.params.id);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Learning module not found' });
    }
    res.status(200).json({ success: true, message: 'Learning module deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard,
  getUsers,
  updateUser,
  getAllScans,
  createLearningContent,
  updateLearningContent,
  deleteLearningContent,
};
