const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  handleValidationErrors,
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

const urlAnalysisValidation = [
  body('url').trim().notEmpty().withMessage('URL is required').isLength({ max: 2048 }),
  handleValidationErrors,
];

const messageAnalysisValidation = [
  body('message').trim().notEmpty().withMessage('Message text is required').isLength({ max: 10000 }),
  body('channel')
    .optional()
    .isIn(['email', 'sms', 'whatsapp', 'telegram', 'instagram', 'facebook', 'other'])
    .withMessage('Invalid channel'),
  handleValidationErrors,
];

const comparisonValidation = [
  body('messageA').trim().notEmpty().withMessage('Message A is required').isLength({ max: 10000 }),
  body('messageB').trim().notEmpty().withMessage('Message B is required').isLength({ max: 10000 }),
  handleValidationErrors,
];

/**
 * Validates and sanitizes the JSON object returned by Groq AI for single-item
 * analysis (URL / message / screenshot) so malformed AI output never reaches
 * the client or the database unchecked.
 */
const REQUIRED_ANALYSIS_FIELDS = [
  'classification',
  'riskScore',
  'confidenceScore',
  'scamCategory',
  'summary',
  'suspiciousIndicators',
  'socialEngineeringTechniques',
  'suspiciousPhrases',
  'recommendedAction',
  'safetyRecommendations',
];

const VALID_CLASSIFICATIONS = ['Safe', 'Suspicious', 'Scam', 'Malicious'];

function clampScore(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => typeof v === 'string' && v.trim().length > 0).slice(0, 20);
}

function validateAnalysisResponse(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('AI response was not a valid JSON object');
  }

  const classification = VALID_CLASSIFICATIONS.includes(raw.classification) ? raw.classification : 'Suspicious';

  const sanitized = {
    classification,
    riskScore: clampScore(raw.riskScore),
    confidenceScore: clampScore(raw.confidenceScore),
    scamCategory: typeof raw.scamCategory === 'string' && raw.scamCategory.trim() ? raw.scamCategory.trim() : 'Unclassified',
    summary: typeof raw.summary === 'string' ? raw.summary.trim().slice(0, 2000) : '',
    suspiciousIndicators: toStringArray(raw.suspiciousIndicators),
    socialEngineeringTechniques: toStringArray(raw.socialEngineeringTechniques),
    suspiciousPhrases: toStringArray(raw.suspiciousPhrases),
    recommendedAction: typeof raw.recommendedAction === 'string' ? raw.recommendedAction.trim().slice(0, 1000) : '',
    safetyRecommendations: toStringArray(raw.safetyRecommendations),
  };

  // Ensure required fields exist even as sane defaults
  REQUIRED_ANALYSIS_FIELDS.forEach((field) => {
    if (sanitized[field] === undefined) {
      throw new Error(`AI response missing required field: ${field}`);
    }
  });

  return sanitized;
}

function validateComparisonResponse(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('AI response was not a valid JSON object');
  }

  const sanitizeSide = (side) => ({
    classification: VALID_CLASSIFICATIONS.includes(side?.classification) ? side.classification : 'Suspicious',
    riskScore: clampScore(side?.riskScore),
    suspiciousIndicators: toStringArray(side?.suspiciousIndicators),
  });

  const moreSuspicious = ['A', 'B', 'Both', 'Neither'].includes(raw.moreSuspicious) ? raw.moreSuspicious : 'Neither';

  return {
    messageA: sanitizeSide(raw.messageA),
    messageB: sanitizeSide(raw.messageB),
    moreSuspicious,
    similarities: toStringArray(raw.similarities),
    differences: toStringArray(raw.differences),
    socialEngineeringTechniques: toStringArray(raw.socialEngineeringTechniques),
    confidenceScore: clampScore(raw.confidenceScore),
    summary: typeof raw.summary === 'string' ? raw.summary.trim().slice(0, 2000) : '',
    safetyRecommendations: toStringArray(raw.safetyRecommendations),
  };
}

module.exports = {
  registerValidation,
  loginValidation,
  urlAnalysisValidation,
  messageAnalysisValidation,
  comparisonValidation,
  validateAnalysisResponse,
  validateComparisonResponse,
  clampScore,
  toStringArray,
};
