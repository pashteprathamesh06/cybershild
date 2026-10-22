const express = require('express');
const router = express.Router();
const { getLearningContent, getLearningContentById } = require('../controllers/learningController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getLearningContent);
router.get('/:id', protect, getLearningContentById);

module.exports = router;
