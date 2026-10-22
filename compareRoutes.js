const express = require('express');
const router = express.Router();
const { compareMessages } = require('../controllers/compareController');
const { protect } = require('../middleware/auth');
const { comparisonValidation } = require('../utils/validators');

router.post('/messages', protect, comparisonValidation, compareMessages);

module.exports = router;
