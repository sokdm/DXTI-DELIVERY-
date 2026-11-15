const mongoose = require('mongoose');

const webhookDeliverySchema = new mongoose.Schema({
  eventId: { type: String, required: true },
  eventType: { type: String, required: true },
  endpointId: { type: mongoose.Schema.Types.ObjectId, ref: 'WebhookEndpoint', required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['pending', 'delivering', 'delivered', 'failed'], default: 'pending', index: true },
  attemptCount: { type: Number, default: 0 },
  nextAttemptAt: { type: Date, default: Date.now, index: true },
  lastAttemptAt: { type: Date },
  lastStatusCode: { type: Number },
  lastError: { type: String },
  deliveredAt: { type: Date },
  createdAt: { type: Date, default: Date.now, index: true },
});

webhookDeliverySchema.index({ eventId: 1, endpointId: 1 }, { unique: true });

module.exports = mongoose.model('WebhookDelivery', webhookDeliverySchema);
