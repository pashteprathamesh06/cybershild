const SimulatorQuestion = require('../models/SimulatorQuestion');

// @desc    Get a batch of simulator scenarios (safe fields only — no answer leaked)
// @route   GET /api/simulator
// @access  Private
const getScenarios = async (req, res, next) => {
  try {
    const { scenarioType, limit = 6 } = req.query;
    const query = { isActive: true };
    if (scenarioType) query.scenarioType = scenarioType;

    const scenarios = await SimulatorQuestion.aggregate([
      { $match: query },
      { $sample: { size: Math.min(20, parseInt(limit, 10) || 6) } },
      {
        $project: {
          scenarioType: 1,
          messageText: 1,
          difficulty: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, scenarios });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit a guess for a scenario and get scored feedback
// @route   POST /api/simulator/:id/answer
// @access  Private
const submitAnswer = async (req, res, next) => {
  try {
    const { userGuess } = req.body; // boolean: true = user thinks it's a scam

    if (typeof userGuess !== 'boolean') {
      return res.status(400).json({ success: false, message: 'userGuess (boolean) is required' });
    }

    const question = await SimulatorQuestion.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Scenario not found' });
    }

    const correct = userGuess === question.isScam;

    res.status(200).json({
      success: true,
      correct,
      isScam: question.isScam,
      explanation: question.explanation,
      learningTips: question.learningTips,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getScenarios, submitAnswer };
