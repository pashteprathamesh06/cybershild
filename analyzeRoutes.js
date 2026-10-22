const express = require('express');
const router = express.Router();
const { analyzeUrl, analyzeMessage, analyzeScreenshot } = require('../controllers/analyzeController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { urlAnalysisValidation, messageAnalysisValidation } = require('../utils/validators');

router.post('/url', protect, urlAnalysisValidation, analyzeUrl);
router.post('/message', protect, messageAnalysisValidation, analyzeMessage);
router.post('/screenshot', protect, upload.single('screenshot'), analyzeScreenshot);

module.exports = router;
