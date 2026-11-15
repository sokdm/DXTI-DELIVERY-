const mongoose = require('mongoose');

const integrationRequestLogSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'IntegrationClient', index: true },
  clientName: { type: String },
  environment: { type: String, enum: ['test', 'production'] },
  method: { type: String, required: true },
  path: { type: String, required: true },
  statusCode: { type: Number, required: true },
  durationMs: { type: Number, required: true },
  requestId: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('IntegrationRequestLog', integrationRequestLogSchema);
