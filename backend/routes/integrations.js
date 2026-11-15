const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const controller = require('../controllers/integrationController');
const { authenticateIntegration, requireScopes } = require('../middleware/integrationAuth');

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const integrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many integration API requests; retry later' },
});

router.get('/docs', controller.getDocumentation);
router.use(integrationLimiter, authenticateIntegration);
router.post('/shipments', requireScopes('shipments:write'), asyncHandler(controller.createShipment));
router.get('/shipments', requireScopes('shipments:read'), asyncHandler(controller.listShipments));
router.get('/shipments/by-order/:externalOrderId', requireScopes('shipments:read'), asyncHandler(controller.getShipmentByOrder));
router.get('/shipments/:trackingNumber', requireScopes('shipments:read', 'tracking:read'), asyncHandler(controller.getShipment));
router.get('/shipments/:trackingNumber/receipt', requireScopes('receipts:read'), asyncHandler(controller.getReceipt));
router.patch('/shipments/:trackingNumber/status', requireScopes('shipments:write'), asyncHandler(controller.updateShipmentStatus));
router.post('/shipments/:trackingNumber/events', requireScopes('tracking_events:write'), asyncHandler(controller.addTrackingEvent));

module.exports = router;
