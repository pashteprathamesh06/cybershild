const express = require('express');
const router = express.Router();
const { getScenarios, submitAnswer } = require('../controllers/simulatorController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getScenarios);
router.post('/:id/answer', protect, submitAnswer);

module.exports = router;
