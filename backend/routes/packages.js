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
  sendReceiptEmail,
  updateLocation,
  updatePackage,
  sendCustomEmail,
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
router.post('/:id/receipt/email', auth, sendReceiptEmail);
router.patch('/:id/status', auth, updateStatus);
router.patch('/:id/location', auth, upload.single('locationImage'), handleUploadError, updateLocation);
router.patch('/:id', auth, upload.fields([
  { name: 'packageImage', maxCount: 1 },
  { name: 'locationImage', maxCount: 1 },
]), handleUploadError, updatePackage);
router.post('/:id/send-email', auth, sendCustomEmail);
router.post('/:id/resend-email', auth, resendEmail);
router.delete('/:id', auth, deletePackage);

module.exports = router;
