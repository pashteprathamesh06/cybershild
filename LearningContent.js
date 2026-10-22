const mongoose = require('mongoose');

const LearningContentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Phishing Awareness',
        'OTP Scams',
        'UPI Fraud',
        'Banking Fraud',
        'Social Engineering',
        'Password Security',
        'MFA Security',
        'Fake Job Scams',
        'Investment Scams',
        'Safe Internet Practices',
      ],
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    content: {
      // Markdown / HTML-safe body text
      type: String,
      required: true,
    },
    keyTakeaways: {
      type: [String],
      default: [],
    },
    icon: {
      type: String,
      default: 'shield',
    },
    order: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LearningContent', LearningContentSchema);
