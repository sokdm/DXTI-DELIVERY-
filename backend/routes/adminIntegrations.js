const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const controller = require('../controllers/adminIntegrationController');

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
router.use(auth);

router.get('/clients', asyncHandler(controller.listClients));
router.post('/clients', asyncHandler(controller.createClient));
router.patch('/clients/:id/scopes', asyncHandler(controller.updateClientScopes));
router.post('/clients/:id/rotate', asyncHandler(controller.rotateClientKey));
router.post('/clients/:id/revoke', asyncHandler(controller.revokeClient));
router.get('/company', asyncHandler(controller.getCompanyProfile));
router.put('/company', asyncHandler(controller.updateCompanyProfile));
router.get('/stats', asyncHandler(controller.getStats));
router.get('/logs', asyncHandler(controller.getRequestLogs));
router.get('/audit-logs', asyncHandler(controller.getAuditLogs));
router.get('/webhooks', asyncHandler(controller.listWebhooks));
router.post('/webhooks', asyncHandler(controller.createWebhook));
router.patch('/webhooks/:id', asyncHandler(controller.updateWebhook));
router.post('/webhooks/:id/revoke', asyncHandler(controller.revokeWebhook));
router.get('/webhook-deliveries', asyncHandler(controller.getWebhookDeliveries));
router.post('/webhook-deliveries/:id/retry', asyncHandler(controller.retryWebhookDelivery));
router.get('/docs', controller.getDocumentationUrl);

module.exports = router;
