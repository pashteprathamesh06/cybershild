const LearningContent = require('../models/LearningContent');

// @desc    Get all published learning modules (optionally filtered by category)
// @route   GET /api/learning
// @access  Private
const getLearningContent = async (req, res, next) => {
  try {
    const { category } = req.query;
    const query = { isPublished: true };
    if (category) query.category = category;

    const modules = await LearningContent.find(query).sort({ category: 1, order: 1 });

    res.status(200).json({ success: true, count: modules.length, modules });
  } catch (err) {
    next(err);
  }
};

// @desc    Get a single learning module by ID
// @route   GET /api/learning/:id
// @access  Private
const getLearningContentById = async (req, res, next) => {
  try {
    const module = await LearningContent.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Learning module not found' });
    }
    res.status(200).json({ success: true, module });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLearningContent, getLearningContentById };
