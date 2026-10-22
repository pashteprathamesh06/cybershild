const Scan = require('../models/Scan');

// @desc    Get current user's scan history (search, filter, sort, paginate)
// @route   GET /api/scans
// @access  Private
const getScans = async (req, res, next) => {
  try {
    const {
      search,
      scanType,
      classification,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const query = { user: req.user._id };

    if (scanType) query.scanType = scanType;
    if (classification) query.classification = classification;
    if (search) {
      query.$or = [
        { input: { $regex: search, $options: 'i' } },
        { scamCategory: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOptions = { [sortBy]: order === 'asc' ? 1 : -1 };
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

    const [scans, total] = await Promise.all([
      Scan.find(query)
        .sort(sortOptions)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Scan.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: scans.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      scans,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get a single scan by ID (owner only, unless admin)
// @route   GET /api/scans/:id
// @access  Private
const getScanById = async (req, res, next) => {
  try {
    const scan = await Scan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({ success: false, message: 'Scan not found' });
    }

    if (scan.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this scan' });
    }

    res.status(200).json({ success: true, scan });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a scan (owner only, unless admin)
// @route   DELETE /api/scans/:id
// @access  Private
const deleteScan = async (req, res, next) => {
  try {
    const scan = await Scan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({ success: false, message: 'Scan not found' });
    }

    if (scan.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this scan' });
    }

    await scan.deleteOne();

    res.status(200).json({ success: true, message: 'Scan deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get dashboard summary stats + chart data for current user
// @route   GET /api/scans/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [recentScans, categoryAgg, trendAgg] = await Promise.all([
      Scan.find({ user: userId }).sort({ createdAt: -1 }).limit(5),
      Scan.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$scamCategory', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      Scan.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            avgRisk: { $avg: '$riskScore' },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
    ]);

    res.status(200).json({
      success: true,
      stats: req.user.stats,
      recentScans,
      categoryDistribution: categoryAgg,
      riskTrend: trendAgg,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getScans, getScanById, deleteScan, getDashboardSummary };
