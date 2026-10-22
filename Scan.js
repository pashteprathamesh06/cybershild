const mongoose = require('mongoose');

const ScanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scanType: {
      type: String,
      enum: ['url', 'message', 'screenshot', 'comparison'],
      required: true,
    },
    input: {
      // Raw input (URL string, message text, extracted OCR text, etc.)
      type: String,
      default: '',
    },
    channel: {
      // For message analysis: email, sms, whatsapp, telegram, instagram, facebook, other
      type: String,
      default: null,
    },
    classification: {
      type: String,
      enum: ['Safe', 'Suspicious', 'Scam', 'Malicious', 'Unknown'],
      default: 'Unknown',
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    scamCategory: {
      type: String,
      default: 'N/A',
    },
    summary: {
      type: String,
      default: '',
    },
    suspiciousIndicators: {
      type: [String],
      default: [],
    },
    socialEngineeringTechniques: {
      type: [String],
      default: [],
    },
    suspiciousPhrases: {
      type: [String],
      default: [],
    },
    recommendedAction: {
      type: String,
      default: '',
    },
    safetyRecommendations: {
      type: [String],
      default: [],
    },
    rawHeuristics: {
      // Deterministic pre-AI heuristic analysis (URL checks etc.)
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    aiRaw: {
      // Raw validated AI JSON response, stored for audit/debugging
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    extractedText: {
      // For screenshot analysis
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

ScanSchema.index({ user: 1, createdAt: -1 });
ScanSchema.index({ scamCategory: 1 });
ScanSchema.index({ classification: 1 });

module.exports = mongoose.model('Scan', ScanSchema);
