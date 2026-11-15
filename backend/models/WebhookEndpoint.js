const mongoose = require('mongoose');

const webhookEndpointSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  url: { type: String, required: true, trim: true, maxlength: 2048 },
  environment: { type: String, enum: ['test', 'production'], required: true },
  events: {
    type: [String],
    enum: [
      'shipment.created',
      'shipment.updated',
      'shipment.dispatched',
      'shipment.in_transit',
      'shipment.delivered',
      'shipment.cancelled',
    ],
    default: [],
  },
  encryptedSecret: { type: String, required: true, select: false },
  enabled: { type: Boolean, default: true },
  revokedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('WebhookEndpoint', webhookEndpointSchema);
