const fs = require('fs');
const Scan = require('../models/Scan');
const User = require('../models/User');
const { analyzeURL } = require('../services/urlAnalysisService');
const { extractTextFromImage } = require('../services/ocrService');
const { getStructuredCompletion } = require('../services/groqService');
const { URL_ANALYSIS_PROMPT, MESSAGE_ANALYSIS_PROMPT } = require('../utils/prompts');
const { validateAnalysisResponse } = require('../utils/validators');

async function recordScanAndUpdateStats(userId, scanData) {
  const scan = await Scan.create({ user: userId, ...scanData });

  const statUpdate = { $inc: { 'stats.totalScans': 1 } };
  if (scanData.classification === 'Scam' || scanData.classification === 'Malicious') {
    statUpdate.$inc['stats.highRiskScans'] = 1;
  } else if (scanData.classification === 'Safe') {
    statUpdate.$inc['stats.safeScans'] = 1;
  }

  await User.findByIdAndUpdate(userId, statUpdate);
  return scan;
}

// @desc    Analyze a URL for phishing/scam risk
// @route   POST /api/analyze/url
// @access  Private
const analyzeUrl = async (req, res, next) => {
  try {
    const { url } = req.body;

    const heuristics = analyzeURL(url);
    if (!heuristics.valid) {
      return res.status(400).json({ success: false, message: heuristics.error });
    }

    const prompt = URL_ANALYSIS_PROMPT(heuristics.normalizedUrl, heuristics);
    const rawAI = await getStructuredCompletion(prompt);
    const analysis = validateAnalysisResponse(rawAI);

    // Blend heuristic score into final risk score (weighted average) for robustness
    const blendedRisk = Math.round(analysis.riskScore * 0.7 + heuristics.heuristicRiskScore * 0.3);

    const scan = await recordScanAndUpdateStats(req.user._id, {
      scanType: 'url',
      input: heuristics.normalizedUrl,
      classification: analysis.classification,
      riskScore: blendedRisk,
      confidenceScore: analysis.confidenceScore,
      scamCategory: analysis.scamCategory,
      summary: analysis.summary,
      suspiciousIndicators: [...new Set([...analysis.suspiciousIndicators, ...heuristics.flags])],
      socialEngineeringTechniques: analysis.socialEngineeringTechniques,
      suspiciousPhrases: analysis.suspiciousPhrases,
      recommendedAction: analysis.recommendedAction,
      safetyRecommendations: analysis.safetyRecommendations,
      rawHeuristics: heuristics,
      aiRaw: rawAI,
    });

    res.status(200).json({ success: true, scan });
  } catch (err) {
    next(err);
  }
};

// @desc    Analyze a message (email/SMS/social) for scam risk
// @route   POST /api/analyze/message
// @access  Private
const analyzeMessage = async (req, res, next) => {
  try {
    const { message, channel } = req.body;

    const prompt = MESSAGE_ANALYSIS_PROMPT(message, channel);
    const rawAI = await getStructuredCompletion(prompt);
    const analysis = validateAnalysisResponse(rawAI);

    const scan = await recordScanAndUpdateStats(req.user._id, {
      scanType: 'message',
      input: message,
      channel: channel || 'other',
      classification: analysis.classification,
      riskScore: analysis.riskScore,
      confidenceScore: analysis.confidenceScore,
      scamCategory: analysis.scamCategory,
      summary: analysis.summary,
      suspiciousIndicators: analysis.suspiciousIndicators,
      socialEngineeringTechniques: analysis.socialEngineeringTechniques,
      suspiciousPhrases: analysis.suspiciousPhrases,
      recommendedAction: analysis.recommendedAction,
      safetyRecommendations: analysis.safetyRecommendations,
      aiRaw: rawAI,
    });

    res.status(200).json({ success: true, scan });
  } catch (err) {
    next(err);
  }
};

// @desc    Analyze a screenshot: OCR -> AI scam analysis
// @route   POST /api/analyze/screenshot
// @access  Private
const analyzeScreenshot = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const filePath = req.file.path;

    let extractedText;
    try {
      extractedText = await extractTextFromImage(filePath);
    } finally {
      // Clean up the uploaded file after OCR regardless of outcome
      fs.unlink(filePath, () => {});
    }

    if (!extractedText || extractedText.length < 3) {
      return res.status(422).json({
        success: false,
        message: 'Could not extract readable text from this image. Please try a clearer screenshot.',
      });
    }

    const prompt = MESSAGE_ANALYSIS_PROMPT(extractedText, 'screenshot');
    const rawAI = await getStructuredCompletion(prompt);
    const analysis = validateAnalysisResponse(rawAI);

    const scan = await recordScanAndUpdateStats(req.user._id, {
      scanType: 'screenshot',
      input: req.file.originalname,
      extractedText,
      classification: analysis.classification,
      riskScore: analysis.riskScore,
      confidenceScore: analysis.confidenceScore,
      scamCategory: analysis.scamCategory,
      summary: analysis.summary,
      suspiciousIndicators: analysis.suspiciousIndicators,
      socialEngineeringTechniques: analysis.socialEngineeringTechniques,
      suspiciousPhrases: analysis.suspiciousPhrases,
      recommendedAction: analysis.recommendedAction,
      safetyRecommendations: analysis.safetyRecommendations,
      aiRaw: rawAI,
    });

    res.status(200).json({ success: true, scan });
  } catch (err) {
    next(err);
  }
};

module.exports = { analyzeUrl, analyzeMessage, analyzeScreenshot };
