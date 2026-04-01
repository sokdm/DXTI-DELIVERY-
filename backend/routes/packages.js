const express = require('express');
const router = express.Router();
const {
  createPackage,
  getAllPackages,
  getPackageByTrackingCode,
  updateStatus,
  deletePackage,
  getDashboardStats,
} = require('../controllers/packageController');
const { auth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

router.get('/track/:trackingCode', getPackageByTrackingCode);
router.post('/create', auth, upload.single('packageImage'), handleUploadError, createPackage);
router.get('/', auth, getAllPackages);
router.get('/stats/dashboard', auth, getDashboardStats);
router.patch('/:id/status', auth, updateStatus);
router.delete('/:id', auth, deletePackage);

module.exports = router;
