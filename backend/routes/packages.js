const express = require('express');
const router = express.Router();
const {
  createPackage,
  getAllPackages,
  getPackageByTrackingCode,
  updateStatus,
  deletePackage,
  getDashboardStats,
  getReceipt,
  downloadReceiptPDF,
  updateLocation,
  resendEmail,
} = require('../controllers/packageController');
const { auth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

router.get('/track/:trackingCode', getPackageByTrackingCode);
router.post('/create', auth, upload.single('packageImage'), handleUploadError, createPackage);
router.get('/', auth, getAllPackages);
router.get('/stats/dashboard', auth, getDashboardStats);
router.get('/:id/receipt', auth, getReceipt);
router.get('/:id/receipt/pdf', auth, downloadReceiptPDF);
router.patch('/:id/status', auth, updateStatus);
router.patch('/:id/location', auth, updateLocation);
router.post('/:id/resend-email', auth, resendEmail);
router.delete('/:id', auth, deletePackage);

module.exports = router;
