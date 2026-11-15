const mongoose = require('mongoose');

const paymentAuthorizationNonceSchema = new mongoose.Schema({
  nonce: { type: String, required: true, unique: true },
  externalOrderId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 },
});

module.exports = mongoose.model('PaymentAuthorizationNonce', paymentAuthorizationNonceSchema);
