const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getUsers,
  updateUser,
  getAllScans,
  createLearningContent,
  updateLearningContent,
  deleteLearningContent,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.patch('/users/:id', updateUser);
router.get('/scans', getAllScans);
router.post('/learning', createLearningContent);
router.patch('/learning/:id', updateLearningContent);
router.delete('/learning/:id', deleteLearningContent);

module.exports = router;
