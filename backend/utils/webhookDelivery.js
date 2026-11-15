const crypto = require('crypto');
const https = require('https');
const net = require('net');
const dns = require('dns').promises;
const WebhookDelivery = require('../models/WebhookDelivery');
const WebhookEndpoint = require('../models/WebhookEndpoint');
const { decryptSecret } = require('./integrationCrypto');

const isPrivateAddress = (address) => {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number);
    const c = Number(address.split('.')[2]);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) || (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) || a >= 224 ||
      (a === 192 && b === 88 && c === 99);
  }
  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    const mappedIpv4 = normalized.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
    if (mappedIpv4) return isPrivateAddress(mappedIpv4[1]);
    return normalized === '::1' || normalized === '::' || normalized.startsWith('fc') ||
      normalized.startsWith('fd') || normalized.startsWith('fe80:') ||
      normalized.startsWith('2001:db8:') || normalized.startsWith('::ffff:127.');
  }
  return true;
};

const validatePublicWebhookHost = async (urlString) => {
  const url = new URL(urlString);
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('Webhook URLs must use HTTPS and cannot include credentials');
  }
  if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost')) {
    throw new Error('Webhook URL cannot target a local host');
  }
  const ipVersion = net.isIP(url.hostname);
  const addresses = ipVersion
    ? [{ address: url.hostname }]
    : await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('Webhook URL must resolve only to public IP addresses');
  }
  return { url, address: addresses[0].address, family: ipVersion || net.isIP(addresses[0].address) };
};

const deliverOne = async () => {
  const now = new Date();
  const delivery = await WebhookDelivery.findOneAndUpdate(
    {
      attemptCount: { $lt: 10 },
      $or: [
        { status: { $in: ['pending', 'failed'] }, nextAttemptAt: { $lte: now } },
        { status: 'delivering', lastAttemptAt: { $lte: new Date(now.getTime() - 2 * 60 * 1000) } },
      ],
    },
    { $set: { status: 'delivering', lastAttemptAt: now } },
    { new: true, sort: { nextAttemptAt: 1 } }
  );
  if (!delivery) return false;

  try {
    const endpoint = await WebhookEndpoint.findOne({
      _id: delivery.endpointId,
      enabled: true,
      revokedAt: null,
    }).select('+encryptedSecret');
    if (!endpoint) {
      await WebhookDelivery.updateOne({ _id: delivery._id }, {
        $set: { status: 'failed', lastError: 'Webhook endpoint is disabled or revoked', nextAttemptAt: new Date(8640000000000000) },
      });
      return true;
    }

    const { url, address, family } = await validatePublicWebhookHost(endpoint.url);
    const body = JSON.stringify(delivery.payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto.createHmac('sha256', decryptSecret(endpoint.encryptedSecret))
      .update(`${timestamp}.${body}`)
      .digest('hex');
    const response = await new Promise((resolve, reject) => {
      const request = https.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'X-Credixa-Event': delivery.eventType,
          'X-Credixa-Event-Id': delivery.eventId,
          'X-Credixa-Timestamp': timestamp,
          'X-Credixa-Signature': `t=${timestamp},v1=${signature}`,
          'User-Agent': 'Credixa-Logistics-Webhooks/1.0',
        },
        timeout: 10000,
        lookup: (hostname, options, callback) => {
          if (options?.all) callback(null, [{ address, family }]);
          else callback(null, address, family);
        },
      }, (res) => {
        res.resume();
        res.on('end', () => resolve(res.statusCode));
      });
      request.on('timeout', () => request.destroy(new Error('Webhook request timed out')));
      request.on('error', reject);
      request.end(body);
    });

    if (response < 200 || response >= 300) throw Object.assign(new Error(`Webhook returned HTTP ${response}`), { statusCode: response });
    await WebhookDelivery.updateOne({ _id: delivery._id }, {
      $set: { status: 'delivered', deliveredAt: new Date(), lastStatusCode: response, lastError: null },
      $inc: { attemptCount: 1 },
    });
  } catch (error) {
    const attempts = delivery.attemptCount + 1;
    const terminal = attempts >= 10;
    const backoffMs = Math.min(60 * 1000 * (2 ** (attempts - 1)), 6 * 60 * 60 * 1000);
    await WebhookDelivery.updateOne({ _id: delivery._id }, {
      $set: {
        status: terminal ? 'failed' : 'pending',
        lastStatusCode: error.statusCode || null,
        lastError: String(error.message || 'Webhook delivery failed').slice(0, 1000),
        nextAttemptAt: terminal ? new Date(8640000000000000) : new Date(Date.now() + backoffMs),
      },
      $inc: { attemptCount: 1 },
    });
  }
  return true;
};

const startWebhookWorker = () => {
  const processQueue = async () => {
    try {
      for (let count = 0; count < 10; count += 1) {
        if (!(await deliverOne())) break;
      }
    } catch (error) {
      console.error('Webhook delivery worker error:', error.message);
    }
  };
  const timer = setInterval(processQueue, 15000);
  timer.unref();
  processQueue();
};

module.exports = { validatePublicWebhookHost, startWebhookWorker };
