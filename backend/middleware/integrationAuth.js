const crypto = require('crypto');
const IntegrationClient = require('../models/IntegrationClient');

const authenticateIntegration = async (req, res, next) => {
  try {
    req.integrationStartedAt = Date.now();
    let logged = false;
    res.on('finish', () => {
      if (logged) return;
      const IntegrationRequestLog = require('../models/IntegrationRequestLog');
      IntegrationRequestLog.create({
        clientId: req.integrationClient?._id,
        clientName: req.integrationClient?.name,
        environment: req.integrationClient?.environment,
        method: req.method,
        path: req.originalUrl.split('?')[0],
        statusCode: res.statusCode,
        durationMs: Date.now() - req.integrationStartedAt,
        requestId: req.id,
      }).catch((error) => console.error('Failed to store integration request log:', error.message));
      logged = true;
    });
    const authorization = req.get('Authorization') || '';
    const match = authorization.match(/^Bearer (crx_(?:test|live)_[A-Za-z0-9_-]+)$/);
    if (!match) {
      return res.status(401).json({ success: false, code: 'UNAUTHENTICATED', message: 'A valid integration API key is required' });
    }

    const apiKey = match[1];
    const environmentPrefix = apiKey.startsWith('crx_live_') ? 'crx_live_' : 'crx_test_';
    const prefix = `${environmentPrefix}${apiKey.slice(environmentPrefix.length, environmentPrefix.length + 8)}`;
    const client = await IntegrationClient.findOne({ keyPrefix: prefix, revokedAt: null }).select('+keyHash');
    const suppliedHash = crypto.createHash('sha256').update(apiKey).digest();
    const storedHash = client ? Buffer.from(client.keyHash, 'hex') : Buffer.alloc(suppliedHash.length);
    const valid = storedHash.length === suppliedHash.length && crypto.timingSafeEqual(storedHash, suppliedHash);
    if (!client || !valid) {
      return res.status(401).json({ success: false, code: 'UNAUTHENTICATED', message: 'The integration API key is invalid or revoked' });
    }

    req.integrationClient = client;
    await IntegrationClient.updateOne({ _id: client._id }, { $set: { lastUsedAt: new Date() } });
    next();
  } catch (error) {
    next(error);
  }
};

const requireScopes = (...requiredScopes) => (req, res, next) => {
  const missing = requiredScopes.filter((scope) => !req.integrationClient?.scopes.includes(scope));
  if (missing.length) {
    return res.status(403).json({
      success: false,
      code: 'INSUFFICIENT_SCOPE',
      message: `This API key is missing required permission${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
    });
  }
  next();
};

module.exports = { authenticateIntegration, requireScopes };
