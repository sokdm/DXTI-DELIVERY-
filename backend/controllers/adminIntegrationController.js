const crypto = require('crypto');
const IntegrationClient = require('../models/IntegrationClient');
const IntegrationRequestLog = require('../models/IntegrationRequestLog');
const IntegrationAuditLog = require('../models/IntegrationAuditLog');
const IntegrationSettings = require('../models/IntegrationSettings');
const WebhookEndpoint = require('../models/WebhookEndpoint');
const WebhookDelivery = require('../models/WebhookDelivery');
const { encryptSecret, generateApiKey } = require('../utils/integrationCrypto');
const { validatePublicWebhookHost } = require('../utils/webhookDelivery');

const SCOPES = ['shipments:read', 'shipments:write', 'receipts:read', 'tracking:read', 'tracking_events:write'];
const EVENTS = [
  'shipment.created',
  'shipment.updated',
  'shipment.dispatched',
  'shipment.in_transit',
  'shipment.delivered',
  'shipment.cancelled',
];
const errorResponse = (res, status, code, message) => res.status(status).json({ success: false, code, message });
const audit = (req, action, resourceType, resource) => IntegrationAuditLog.create({
  actorId: req.admin?._id,
  actorEmail: req.admin?.email,
  action,
  resourceType,
  resourceId: resource?._id?.toString(),
  resourceName: resource?.name,
  environment: resource?.environment,
});
const webhookView = (endpoint) => ({
  _id: endpoint._id,
  name: endpoint.name,
  url: endpoint.url,
  environment: endpoint.environment,
  events: endpoint.events,
  enabled: endpoint.enabled,
  revokedAt: endpoint.revokedAt,
  createdAt: endpoint.createdAt,
  updatedAt: endpoint.updatedAt,
});

exports.listClients = async (req, res) => {
  const clients = await IntegrationClient.find().sort({ createdAt: -1 }).lean();
  return res.json({ success: true, data: clients });
};

exports.createClient = async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const environment = req.body.environment;
  const scopes = req.body.scopes;
  if (!name || name.length > 100) return errorResponse(res, 400, 'VALIDATION_ERROR', 'Client name is required and must be 100 characters or fewer');
  if (!['test', 'production'].includes(environment)) return errorResponse(res, 400, 'VALIDATION_ERROR', 'Environment must be test or production');
  if (!Array.isArray(scopes) || scopes.some((scope) => !SCOPES.includes(scope)) || new Set(scopes).size !== scopes.length) {
    return errorResponse(res, 400, 'VALIDATION_ERROR', 'Select valid, non-duplicate API permissions');
  }
  const generated = generateApiKey(environment);
  const client = await IntegrationClient.create({
    name,
    environment,
    keyPrefix: generated.prefix,
    keyHash: crypto.createHash('sha256').update(generated.key).digest('hex'),
    scopes,
  });
  await audit(req, 'api_key.created', 'api_key', client);
  return res.status(201).json({
    success: true,
    data: { id: client._id, name: client.name, environment: client.environment, keyPrefix: client.keyPrefix, scopes: client.scopes, createdAt: client.createdAt },
    apiKey: generated.key,
    warning: 'Copy this API key now. It cannot be retrieved again.',
  });
};

exports.rotateClientKey = async (req, res) => {
  const client = await IntegrationClient.findById(req.params.id);
  if (!client) return errorResponse(res, 404, 'CLIENT_NOT_FOUND', 'API client not found');
  if (client.revokedAt) return errorResponse(res, 409, 'CLIENT_REVOKED', 'Re-enable this client by creating a new API key record');
  const generated = generateApiKey(client.environment);
  client.keyPrefix = generated.prefix;
  client.keyHash = crypto.createHash('sha256').update(generated.key).digest('hex');
  await client.save();
  await audit(req, 'api_key.rotated', 'api_key', client);
  return res.json({ success: true, apiKey: generated.key, warning: 'Copy this API key now. It cannot be retrieved again.' });
};

exports.updateClientScopes = async (req, res) => {
  const scopes = req.body.scopes;
  if (!Array.isArray(scopes) || scopes.some((scope) => !SCOPES.includes(scope)) || new Set(scopes).size !== scopes.length) {
    return errorResponse(res, 400, 'VALIDATION_ERROR', 'Select valid, non-duplicate API permissions');
  }
  const client = await IntegrationClient.findByIdAndUpdate(req.params.id, { $set: { scopes } }, { new: true });
  if (!client) return errorResponse(res, 404, 'CLIENT_NOT_FOUND', 'API client not found');
  await audit(req, 'api_key.scopes_updated', 'api_key', client);
  return res.json({ success: true, data: client });
};

exports.revokeClient = async (req, res) => {
  const client = await IntegrationClient.findByIdAndUpdate(
    req.params.id,
    { $set: { revokedAt: new Date() } },
    { new: true }
  );
  if (!client) return errorResponse(res, 404, 'CLIENT_NOT_FOUND', 'API client not found');
  await audit(req, 'api_key.revoked', 'api_key', client);
  return res.json({ success: true, message: 'API key revoked' });
};

exports.getCompanyProfile = async (req, res) => {
  const settings = await IntegrationSettings.findOne({ key: 'primary' }).lean();
  return res.json({ success: true, data: settings?.company || {} });
};

exports.updateCompanyProfile = async (req, res) => {
  const fields = ['name', 'contactName', 'email', 'phone', 'address', 'city', 'country'];
  const company = {};
  const errors = {};
  for (const field of fields) {
    const value = req.body[field];
    if (typeof value !== 'string' || value.trim().length > 200) errors[field] = 'Must be a string of 200 characters or fewer';
    else company[field] = value.trim();
  }
  if (company.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.email)) errors.email = 'Must be a valid email address';
  if (Object.keys(errors).length) return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', fields: errors });
  const settings = await IntegrationSettings.findOneAndUpdate(
    { key: 'primary' },
    { $set: { company, updatedAt: new Date() }, $setOnInsert: { key: 'primary' } },
    { upsert: true, new: true, runValidators: true }
  );
  await audit(req, 'company_profile.updated', 'company_profile', { _id: settings._id, name: company.name });
  return res.json({ success: true, data: settings.company });
};

exports.getStats = async (req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [requestStats, webhookStats, totalClients, enabledWebhooks, settings] = await Promise.all([
    IntegrationRequestLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: null, total: { $sum: 1 }, errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } } } },
    ]),
    WebhookDelivery.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    IntegrationClient.countDocuments({ revokedAt: null }),
    WebhookEndpoint.countDocuments({ enabled: true, revokedAt: null }),
    IntegrationSettings.findOne({ key: 'primary' }).lean(),
  ]);
  return res.json({
    success: true,
    data: {
      periodDays: 30,
      requests: requestStats[0] || { total: 0, errors: 0 },
      webhookDeliveries: Object.fromEntries(webhookStats.map((item) => [item._id, item.count])),
      activeClients: totalClients,
      activeWebhooks: enabledWebhooks,
      companyProfileComplete: Boolean(
        settings?.company?.name &&
        settings?.company?.email &&
        settings?.company?.phone &&
        settings?.company?.address &&
        settings?.company?.city &&
        settings?.company?.country
      ),
      paymentVerificationConfigured: Boolean(
        process.env.CREDIXA_PAYMENT_SIGNING_SECRET_TEST?.length >= 32 &&
        process.env.CREDIXA_PAYMENT_SIGNING_SECRET_PRODUCTION?.length >= 32
      ),
      secretEncryptionConfigured: Boolean(process.env.INTEGRATION_ENCRYPTION_KEY && process.env.INTEGRATION_ENCRYPTION_KEY.length >= 32),
    },
  });
};

exports.getRequestLogs = async (req, res) => {
  const limit = Math.max(1, Math.min(200, Number.parseInt(req.query.limit, 10) || 50));
  const filter = {};
  if (req.query.clientId) filter.clientId = req.query.clientId;
  if (req.query.status === 'failed') filter.statusCode = { $gte: 400 };
  const logs = await IntegrationRequestLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  return res.json({ success: true, data: logs });
};

exports.getAuditLogs = async (req, res) => {
  const limit = Math.max(1, Math.min(200, Number.parseInt(req.query.limit, 10) || 50));
  const logs = await IntegrationAuditLog.find().sort({ createdAt: -1 }).limit(limit).lean();
  return res.json({ success: true, data: logs });
};

exports.listWebhooks = async (req, res) => {
  const endpoints = await WebhookEndpoint.find().sort({ createdAt: -1 }).lean();
  return res.json({ success: true, data: endpoints });
};

exports.createWebhook = async (req, res) => {
  const { name, url, environment, events, secret } = req.body;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) return errorResponse(res, 400, 'VALIDATION_ERROR', 'Webhook name is required and must be 100 characters or fewer');
  if (!['test', 'production'].includes(environment)) return errorResponse(res, 400, 'VALIDATION_ERROR', 'Environment must be test or production');
  if (!Array.isArray(events) || !events.length || events.some((event) => !EVENTS.includes(event))) return errorResponse(res, 400, 'VALIDATION_ERROR', 'Select one or more valid webhook events');
  if (typeof secret !== 'string' || secret.length < 32 || secret.length > 256) return errorResponse(res, 400, 'VALIDATION_ERROR', 'Webhook signing secret must contain 32-256 characters');
  try {
    await validatePublicWebhookHost(url);
  } catch (error) {
    return errorResponse(res, 400, 'INVALID_WEBHOOK_URL', error.message);
  }
  const endpoint = await WebhookEndpoint.create({
    name: name.trim(),
    url: String(url).trim(),
    environment,
    events,
    encryptedSecret: encryptSecret(secret),
  });
  await audit(req, 'webhook.created', 'webhook', endpoint);
  return res.status(201).json({ success: true, data: webhookView(endpoint), message: 'Webhook endpoint configured. Signing secret is stored encrypted and cannot be retrieved.' });
};

exports.updateWebhook = async (req, res) => {
  const endpoint = await WebhookEndpoint.findById(req.params.id).select('+encryptedSecret');
  if (!endpoint) return errorResponse(res, 404, 'WEBHOOK_NOT_FOUND', 'Webhook endpoint not found');
  const { name, url, events, enabled, secret } = req.body;
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) return errorResponse(res, 400, 'VALIDATION_ERROR', 'Webhook name is invalid');
    endpoint.name = name.trim();
  }
  if (url !== undefined) {
    try {
      await validatePublicWebhookHost(url);
    } catch (error) {
      return errorResponse(res, 400, 'INVALID_WEBHOOK_URL', error.message);
    }
    endpoint.url = String(url).trim();
  }
  if (events !== undefined) {
    if (!Array.isArray(events) || !events.length || events.some((event) => !EVENTS.includes(event))) return errorResponse(res, 400, 'VALIDATION_ERROR', 'Select one or more valid webhook events');
    endpoint.events = events;
  }
  if (enabled !== undefined) {
    if (typeof enabled !== 'boolean') return errorResponse(res, 400, 'VALIDATION_ERROR', 'enabled must be a boolean');
    endpoint.enabled = enabled;
  }
  if (secret !== undefined) {
    if (typeof secret !== 'string' || secret.length < 32 || secret.length > 256) return errorResponse(res, 400, 'VALIDATION_ERROR', 'Webhook signing secret must contain 32-256 characters');
    endpoint.encryptedSecret = encryptSecret(secret);
  }
  endpoint.updatedAt = new Date();
  await endpoint.save();
  await audit(req, secret ? 'webhook.secret_rotated' : 'webhook.updated', 'webhook', endpoint);
  return res.json({ success: true, data: webhookView(endpoint), message: secret ? 'Webhook secret rotated. The previous secret has been replaced.' : 'Webhook endpoint updated' });
};

exports.revokeWebhook = async (req, res) => {
  const endpoint = await WebhookEndpoint.findByIdAndUpdate(
    req.params.id,
    { $set: { revokedAt: new Date(), enabled: false, updatedAt: new Date() } },
    { new: true }
  );
  if (!endpoint) return errorResponse(res, 404, 'WEBHOOK_NOT_FOUND', 'Webhook endpoint not found');
  await audit(req, 'webhook.revoked', 'webhook', endpoint);
  return res.json({ success: true, message: 'Webhook endpoint revoked' });
};

exports.getWebhookDeliveries = async (req, res) => {
  const limit = Math.max(1, Math.min(200, Number.parseInt(req.query.limit, 10) || 50));
  const filter = {};
  if (req.query.status && ['pending', 'delivering', 'delivered', 'failed'].includes(req.query.status)) filter.status = req.query.status;
  if (req.query.endpointId) filter.endpointId = req.query.endpointId;
  const deliveries = await WebhookDelivery.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('endpointId', 'name url environment')
    .lean();
  return res.json({ success: true, data: deliveries });
};

exports.retryWebhookDelivery = async (req, res) => {
  const delivery = await WebhookDelivery.findById(req.params.id);
  if (!delivery) return errorResponse(res, 404, 'DELIVERY_NOT_FOUND', 'Webhook delivery not found');
  if (delivery.status === 'delivered') return errorResponse(res, 409, 'ALREADY_DELIVERED', 'Successful deliveries cannot be retried');
  delivery.status = 'pending';
  delivery.attemptCount = 0;
  delivery.nextAttemptAt = new Date();
  delivery.lastError = null;
  delivery.lastStatusCode = null;
  await delivery.save();
  await audit(req, 'webhook_delivery.retried', 'webhook_delivery', { _id: delivery._id, name: delivery.eventType });
  return res.json({ success: true, message: 'Webhook delivery queued for retry' });
};

exports.getDocumentationUrl = (req, res) => res.json({ success: true, url: '/api/v1/integrations/docs' });
