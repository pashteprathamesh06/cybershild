const mongoose = require('mongoose');

const SimulatorQuestionSchema = new mongoose.Schema(
  {
    scenarioType: {
      type: String,
      enum: [
        'Fake Bank Message',
        'Fake Job Offer',
        'Fake Delivery Message',
        'Fake Reward Message',
        'Fake Account Verification',
        'Fake Investment Message',
      ],
      required: true,
    },
    messageText: {
      type: String,
      required: true,
    },
    isScam: {
      type: Boolean,
      required: true,
      default: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    learningTips: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SimulatorQuestion', SimulatorQuestionSchema);
