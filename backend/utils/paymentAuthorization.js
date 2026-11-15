const crypto = require('crypto');
const PaymentAuthorizationNonce = require('../models/PaymentAuthorizationNonce');

const verifyPaymentAuthorization = async ({ externalOrderId, paymentReference, environment, headers, session }) => {
  const secretKey = environment === 'production'
    ? 'CREDIXA_PAYMENT_SIGNING_SECRET_PRODUCTION'
    : 'CREDIXA_PAYMENT_SIGNING_SECRET_TEST';
  const secret = process.env[secretKey];
  if (!secret || secret.length < 32) {
    const error = new Error('Trusted payment verification is not configured');
    error.statusCode = 503;
    error.apiCode = 'PAYMENT_AUTH_NOT_CONFIGURED';
    throw error;
  }

  const timestamp = headers['x-credixa-payment-timestamp'];
  const nonce = headers['x-credixa-payment-nonce'];
  const signature = headers['x-credixa-payment-signature'];
  const timestampSeconds = Number(timestamp);
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (!Number.isInteger(timestampSeconds) || Math.abs(nowSeconds - timestampSeconds) > 300) {
    const error = new Error('Payment authorization timestamp is invalid or expired');
    error.statusCode = 401;
    error.apiCode = 'PAYMENT_AUTH_EXPIRED';
    throw error;
  }
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(String(nonce || ''))) {
    const error = new Error('Payment authorization nonce is invalid');
    error.statusCode = 401;
    error.apiCode = 'PAYMENT_AUTH_INVALID';
    throw error;
  }
  if (!/^[a-f0-9]{64}$/i.test(String(signature || ''))) {
    const error = new Error('Payment authorization signature is invalid');
    error.statusCode = 401;
    error.apiCode = 'PAYMENT_AUTH_INVALID';
    throw error;
  }

  const canonical = `${externalOrderId}.${paymentReference}.${timestamp}.${nonce}`;
  const expected = crypto.createHmac('sha256', secret).update(canonical).digest();
  const supplied = Buffer.from(signature, 'hex');
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    const error = new Error('Payment authorization signature is invalid');
    error.statusCode = 401;
    error.apiCode = 'PAYMENT_AUTH_INVALID';
    throw error;
  }

  try {
    await PaymentAuthorizationNonce.create([{
      nonce,
      externalOrderId,
    }], { session });
  } catch (error) {
    if (error.code === 11000) {
      const replay = new Error('Payment authorization has already been used');
      replay.statusCode = 409;
      replay.apiCode = 'PAYMENT_AUTH_REPLAYED';
      throw replay;
    }
    throw error;
  }
};

module.exports = { verifyPaymentAuthorization };
