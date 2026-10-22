const express = require('express');
const router = express.Router();
const { getScans, getScanById, deleteScan, getDashboardSummary } = require('../controllers/scanController');
const { protect } = require('../middleware/auth');

router.get('/dashboard/summary', protect, getDashboardSummary);
router.get('/', protect, getScans);
router.get('/:id', protect, getScanById);
router.delete('/:id', protect, deleteScan);

module.exports = router;
