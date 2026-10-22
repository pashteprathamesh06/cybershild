const Scan = require('../models/Scan');
const User = require('../models/User');
const { getStructuredCompletion } = require('../services/groqService');
const { COMPARISON_PROMPT } = require('../utils/prompts');
const { validateComparisonResponse } = require('../utils/validators');

// @desc    Compare two messages and determine which is more suspicious
// @route   POST /api/compare/messages
// @access  Private
const compareMessages = async (req, res, next) => {
  try {
    const { messageA, messageB } = req.body;

    const prompt = COMPARISON_PROMPT(messageA, messageB);
    const rawAI = await getStructuredCompletion(prompt);
    const result = validateComparisonResponse(rawAI);

    const scan = await Scan.create({
      user: req.user._id,
      scanType: 'comparison',
      input: `A: ${messageA}\n---\nB: ${messageB}`,
      classification: result.moreSuspicious === 'Neither' ? 'Safe' : 'Suspicious',
      riskScore: Math.max(result.messageA.riskScore, result.messageB.riskScore),
      confidenceScore: result.confidenceScore,
      scamCategory: 'Comparison',
      summary: result.summary,
      suspiciousIndicators: [...result.messageA.suspiciousIndicators, ...result.messageB.suspiciousIndicators],
      socialEngineeringTechniques: result.socialEngineeringTechniques,
      safetyRecommendations: result.safetyRecommendations,
      aiRaw: rawAI,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.totalScans': 1 } });

    res.status(200).json({ success: true, comparison: result, scanId: scan._id });
  } catch (err) {
    next(err);
  }
};

module.exports = { compareMessages };
